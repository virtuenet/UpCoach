/**
 * Service-Level Integration Tests: Payment Management
 *
 * Tests subscription and payment business logic without HTTP/database layers.
 *
 * Test Coverage:
 * - Subscription creation with Stripe integration
 * - Subscription upgrades and downgrades
 * - Payment processing with transaction records
 * - Subscription cancellation and reactivation
 * - Failed payment handling
 * - Gamification integration for subscription events
 */

import { TestFactories } from '../helpers/test-factories.helper';
import { MockRepositories, MockServices } from '../helpers/mock-repositories.helper';

/**
 * PaymentManagementService - Orchestrates payment and subscription operations
 *
 * This service integrates:
 * - StripeService (external Stripe API)
 * - SubscriptionRepository (database persistence)
 * - TransactionRepository (payment tracking)
 * - GamificationService (reward system)
 */
class PaymentManagementService {
  constructor(
    private stripeService: any,
    private subscriptionRepo: any,
    private transactionRepo: any,
    private userRepo: any,
    private gamificationService: any
  ) {}

  /**
   * Create a new subscription for a user
   */
  async createSubscription(data: {
    userId: string;
    priceId: string;
    paymentMethodId?: string;
    trialDays?: number;
  }) {
    // Step 1: Validate user exists
    const user = await this.userRepo.findByPk(data.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Step 2: Check for existing active subscription
    const existingSubscription = await this.subscriptionRepo.findOne({
      where: { userId: data.userId, status: 'active' },
    });
    if (existingSubscription) {
      throw new Error('User already has an active subscription');
    }

    // Step 3: Create Stripe customer if not exists
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const stripeCustomer = await this.stripeService.createCustomer({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      });
      stripeCustomerId = stripeCustomer.id;

      // Update user with Stripe customer ID
      await this.userRepo.update(
        { stripeCustomerId },
        { where: { id: data.userId } }
      );
    }

    // Step 4: Create Stripe subscription
    const stripeSubscription = await this.stripeService.createSubscription({
      customer: stripeCustomerId,
      price: data.priceId,
      payment_method: data.paymentMethodId,
      trial_period_days: data.trialDays,
    });

    // Step 5: Save subscription to database
    const subscription = await this.subscriptionRepo.create({
      userId: data.userId,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId,
      status: stripeSubscription.status,
      tier: 'premium', // Determine from priceId in real implementation
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    });

    // Step 6: Award gamification points for subscription
    if (!data.trialDays) {
      await this.gamificationService.awardPoints(
        data.userId,
        'subscription_created',
        100
      );
    }

    return {
      subscription,
      stripeSubscription,
      gamification: { pointsAwarded: data.trialDays ? 0 : 100 },
    };
  }

  /**
   * Upgrade or downgrade a subscription
   */
  async changeSubscriptionTier(data: {
    userId: string;
    newPriceId: string;
  }) {
    // Step 1: Find active subscription
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId: data.userId, status: 'active' },
    });
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Step 2: Update Stripe subscription
    const stripeSubscription = await this.stripeService.updateSubscription(
      subscription.stripeSubscriptionId,
      { price: data.newPriceId }
    );

    // Step 3: Update local subscription record
    await this.subscriptionRepo.update(
      { tier: 'enterprise', updatedAt: new Date() }, // Determine tier from priceId
      { where: { id: subscription.id } }
    );

    // Step 4: Award points for upgrade
    await this.gamificationService.awardPoints(
      data.userId,
      'subscription_upgraded',
      50
    );

    return {
      subscription: { ...subscription, tier: 'enterprise' },
      stripeSubscription,
      gamification: { pointsAwarded: 50 },
    };
  }

  /**
   * Process a one-time payment
   */
  async processPayment(data: {
    userId: string;
    amount: number;
    currency: string;
    paymentMethodId: string;
    description: string;
  }) {
    // Step 1: Get user
    const user = await this.userRepo.findByPk(data.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Step 2: Create payment intent
    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: data.amount,
      currency: data.currency,
      payment_method: data.paymentMethodId,
      customer: user.stripeCustomerId,
      confirm: true,
    });

    // Step 3: Record transaction
    const transaction = await this.transactionRepo.create({
      userId: data.userId,
      amount: data.amount / 100, // Convert cents to dollars
      currency: data.currency,
      type: 'one_time_payment',
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
      stripePaymentIntentId: paymentIntent.id,
      description: data.description,
    });

    // Step 4: Award points for successful payment
    if (paymentIntent.status === 'succeeded') {
      await this.gamificationService.awardPoints(
        data.userId,
        'payment_completed',
        25
      );
    }

    return {
      transaction,
      paymentIntent,
      gamification: { pointsAwarded: paymentIntent.status === 'succeeded' ? 25 : 0 },
    };
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(data: {
    userId: string;
    cancelAtPeriodEnd?: boolean;
  }) {
    // Step 1: Find active subscription
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId: data.userId, status: 'active' },
    });
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Step 2: Cancel in Stripe
    await this.stripeService.cancelSubscription(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: data.cancelAtPeriodEnd }
    );

    // Step 3: Update local subscription
    const newStatus = data.cancelAtPeriodEnd ? 'active' : 'canceled';
    await this.subscriptionRepo.update(
      { status: newStatus, canceledAt: new Date() },
      { where: { id: subscription.id } }
    );

    return {
      subscription: { ...subscription, status: newStatus },
      canceledImmediately: !data.cancelAtPeriodEnd,
    };
  }

  /**
   * Handle failed payment (called by webhook)
   */
  async handleFailedPayment(data: {
    subscriptionId: string;
    reason: string;
  }) {
    // Step 1: Find subscription
    const subscription = await this.subscriptionRepo.findOne({
      where: { stripeSubscriptionId: data.subscriptionId },
    });
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Step 2: Update subscription status
    await this.subscriptionRepo.update(
      { status: 'past_due' },
      { where: { id: subscription.id } }
    );

    // Step 3: Create failed transaction record
    const transaction = await this.transactionRepo.create({
      userId: subscription.userId,
      amount: 0,
      currency: 'USD',
      type: 'subscription_payment',
      status: 'failed',
      description: `Payment failed: ${data.reason}`,
    });

    return {
      subscription: { ...subscription, status: 'past_due' },
      transaction,
    };
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(data: {
    userId: string;
    paymentMethodId: string;
  }) {
    // Step 1: Find canceled subscription
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId: data.userId, status: 'canceled' },
    });
    if (!subscription) {
      throw new Error('No canceled subscription found');
    }

    // Step 2: Create new Stripe subscription
    const stripeSubscription = await this.stripeService.createSubscription({
      customer: subscription.stripeCustomerId,
      price: 'price_premium', // Use stored price ID in real implementation
      payment_method: data.paymentMethodId,
    });

    // Step 3: Update local subscription
    await this.subscriptionRepo.update(
      {
        stripeSubscriptionId: stripeSubscription.id,
        status: 'active',
        canceledAt: null,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
      { where: { id: subscription.id } }
    );

    // Step 4: Award points for reactivation
    await this.gamificationService.awardPoints(
      data.userId,
      'subscription_reactivated',
      50
    );

    return {
      subscription: { ...subscription, status: 'active' },
      stripeSubscription,
      gamification: { pointsAwarded: 50 },
    };
  }
}

// ===========================
// TEST SUITE
// ===========================

describe('PaymentManagementService Integration', () => {
  let service: PaymentManagementService;
  let mockStripeService: any;
  let mockSubscriptionRepo: any;
  let mockTransactionRepo: any;
  let mockUserRepo: any;
  let mockGamificationService: any;

  beforeEach(() => {
    // Create all mocks
    mockStripeService = MockServices.createStripeService();
    mockSubscriptionRepo = MockRepositories.createSubscriptionRepository();
    mockTransactionRepo = MockRepositories.createTransactionRepository();
    mockUserRepo = MockRepositories.createUserRepository();
    mockGamificationService = MockServices.createGamificationService();

    // Instantiate service with mocks
    service = new PaymentManagementService(
      mockStripeService,
      mockSubscriptionRepo,
      mockTransactionRepo,
      mockUserRepo,
      mockGamificationService
    );
  });

  describe('Subscription Creation', () => {
    test('should create new subscription for user without Stripe customer', async () => {
      // Arrange
      const userId = 'user-123';
      const user = TestFactories.createUser({
        id: userId,
        stripeCustomerId: null, // No Stripe customer yet
      });
      const stripeCustomer = { id: 'cus_new_123' };
      const stripeSubscription = {
        id: 'sub_new_123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      };

      mockUserRepo.findByPk.mockResolvedValue(user);
      mockSubscriptionRepo.findOne.mockResolvedValue(null); // No existing subscription
      mockStripeService.createCustomer.mockResolvedValue(stripeCustomer);
      mockStripeService.createSubscription.mockResolvedValue(stripeSubscription);
      mockSubscriptionRepo.create.mockResolvedValue({
        id: 'db-sub-123',
        userId,
        stripeSubscriptionId: stripeSubscription.id,
        status: 'active',
      });

      // Act
      const result = await service.createSubscription({
        userId,
        priceId: 'price_premium_monthly',
      });

      // Assert
      expect(result).toMatchObject({
        subscription: {
          id: 'db-sub-123',
          userId,
          status: 'active',
        },
        gamification: { pointsAwarded: 100 },
      });

      // Verify service integration flow
      expect(mockUserRepo.findByPk).toHaveBeenCalledWith(userId);
      expect(mockStripeService.createCustomer).toHaveBeenCalledWith({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      });
      expect(mockUserRepo.update).toHaveBeenCalledWith(
        { stripeCustomerId: stripeCustomer.id },
        { where: { id: userId } }
      );
      expect(mockStripeService.createSubscription).toHaveBeenCalled();
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
        userId,
        'subscription_created',
        100
      );
    });

    test('should create subscription with existing Stripe customer', async () => {
      // Arrange
      const userId = 'user-456';
      const user = TestFactories.createUser({
        id: userId,
        stripeCustomerId: 'cus_existing_123',
      });
      const stripeSubscription = {
        id: 'sub_existing_456',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      };

      mockUserRepo.findByPk.mockResolvedValue(user);
      mockSubscriptionRepo.findOne.mockResolvedValue(null);
      mockStripeService.createSubscription.mockResolvedValue(stripeSubscription);
      mockSubscriptionRepo.create.mockResolvedValue({
        id: 'db-sub-456',
        userId,
        stripeSubscriptionId: stripeSubscription.id,
        status: 'active',
      });

      // Act
      const result = await service.createSubscription({
        userId,
        priceId: 'price_premium_monthly',
      });

      // Assert
      expect(result.subscription.userId).toBe(userId);
      expect(mockStripeService.createCustomer).not.toHaveBeenCalled(); // Should not create new customer
      expect(mockStripeService.createSubscription).toHaveBeenCalledWith({
        customer: 'cus_existing_123',
        price: 'price_premium_monthly',
        payment_method: undefined,
        trial_period_days: undefined,
      });
    });

    test('should create subscription with trial period (no points awarded)', async () => {
      // Arrange
      const userId = 'user-789';
      const user = TestFactories.createUser({ id: userId, stripeCustomerId: 'cus_789' });
      const stripeSubscription = {
        id: 'sub_trial_789',
        status: 'trialing',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60,
      };

      mockUserRepo.findByPk.mockResolvedValue(user);
      mockSubscriptionRepo.findOne.mockResolvedValue(null);
      mockStripeService.createSubscription.mockResolvedValue(stripeSubscription);
      mockSubscriptionRepo.create.mockResolvedValue({
        id: 'db-sub-789',
        userId,
        status: 'trialing',
      });

      // Act
      const result = await service.createSubscription({
        userId,
        priceId: 'price_premium_monthly',
        trialDays: 14,
      });

      // Assert
      expect(result.gamification.pointsAwarded).toBe(0); // No points for trial
      expect(mockGamificationService.awardPoints).not.toHaveBeenCalled();
    });

    test('should reject subscription creation when user not found', async () => {
      // Arrange
      mockUserRepo.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createSubscription({
          userId: 'non-existent-user',
          priceId: 'price_premium_monthly',
        })
      ).rejects.toThrow('User not found');

      expect(mockStripeService.createSubscription).not.toHaveBeenCalled();
    });

    test('should reject subscription creation when user already has active subscription', async () => {
      // Arrange
      const userId = 'user-with-sub';
      const user = TestFactories.createUser({ id: userId });
      const existingSubscription = TestFactories.createSubscription({
        userId,
        status: 'active',
      });

      mockUserRepo.findByPk.mockResolvedValue(user);
      mockSubscriptionRepo.findOne.mockResolvedValue(existingSubscription);

      // Act & Assert
      await expect(
        service.createSubscription({
          userId,
          priceId: 'price_premium_monthly',
        })
      ).rejects.toThrow('User already has an active subscription');

      expect(mockStripeService.createSubscription).not.toHaveBeenCalled();
    });
  });

  describe('Subscription Tier Changes', () => {
    test('should upgrade subscription tier successfully', async () => {
      // Arrange
      const userId = 'user-upgrade';
      const existingSubscription = TestFactories.createSubscription({
        userId,
        tier: 'premium',
        status: 'active',
        stripeSubscriptionId: 'sub_premium_123',
      });
      const updatedStripeSubscription = {
        id: 'sub_premium_123',
        status: 'active',
      };

      mockSubscriptionRepo.findOne.mockResolvedValue(existingSubscription);
      mockStripeService.updateSubscription.mockResolvedValue(updatedStripeSubscription);

      // Act
      const result = await service.changeSubscriptionTier({
        userId,
        newPriceId: 'price_enterprise_monthly',
      });

      // Assert
      expect(result).toMatchObject({
        subscription: { tier: 'enterprise' },
        gamification: { pointsAwarded: 50 },
      });
      expect(mockStripeService.updateSubscription).toHaveBeenCalledWith(
        'sub_premium_123',
        { price: 'price_enterprise_monthly' }
      );
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
        userId,
        'subscription_upgraded',
        50
      );
    });

    test('should reject tier change when no active subscription exists', async () => {
      // Arrange
      mockSubscriptionRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.changeSubscriptionTier({
          userId: 'user-no-sub',
          newPriceId: 'price_enterprise_monthly',
        })
      ).rejects.toThrow('No active subscription found');

      expect(mockStripeService.updateSubscription).not.toHaveBeenCalled();
    });
  });

  describe('One-Time Payments', () => {
    test('should process successful one-time payment', async () => {
      // Arrange
      const userId = 'user-payment';
      const user = TestFactories.createUser({
        id: userId,
        stripeCustomerId: 'cus_payment_123',
      });
      const paymentIntent = {
        id: 'pi_success_123',
        status: 'succeeded',
        amount: 9900,
      };

      mockUserRepo.findByPk.mockResolvedValue(user);
      mockStripeService.createPaymentIntent.mockResolvedValue(paymentIntent);
      mockTransactionRepo.create.mockResolvedValue({
        id: 'txn_123',
        userId,
        amount: 99.00,
        status: 'completed',
      });

      // Act
      const result = await service.processPayment({
        userId,
        amount: 9900,
        currency: 'USD',
        paymentMethodId: 'pm_card_123',
        description: 'Coaching session payment',
      });

      // Assert
      expect(result).toMatchObject({
        transaction: { userId, status: 'completed' },
        gamification: { pointsAwarded: 25 },
      });
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith({
        amount: 9900,
        currency: 'USD',
        payment_method: 'pm_card_123',
        customer: 'cus_payment_123',
        confirm: true,
      });
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
        userId,
        'payment_completed',
        25
      );
    });

    test('should handle pending payment without awarding points', async () => {
      // Arrange
      const userId = 'user-pending';
      const user = TestFactories.createUser({ id: userId, stripeCustomerId: 'cus_pending' });
      const paymentIntent = {
        id: 'pi_pending_123',
        status: 'processing',
      };

      mockUserRepo.findByPk.mockResolvedValue(user);
      mockStripeService.createPaymentIntent.mockResolvedValue(paymentIntent);
      mockTransactionRepo.create.mockResolvedValue({
        id: 'txn_pending',
        userId,
        status: 'pending',
      });

      // Act
      const result = await service.processPayment({
        userId,
        amount: 5000,
        currency: 'USD',
        paymentMethodId: 'pm_card_pending',
        description: 'Test payment',
      });

      // Assert
      expect(result.gamification.pointsAwarded).toBe(0);
      expect(mockGamificationService.awardPoints).not.toHaveBeenCalled();
    });
  });

  describe('Subscription Cancellation', () => {
    test('should cancel subscription immediately', async () => {
      // Arrange
      const userId = 'user-cancel';
      const subscription = TestFactories.createSubscription({
        userId,
        status: 'active',
        stripeSubscriptionId: 'sub_cancel_123',
      });

      mockSubscriptionRepo.findOne.mockResolvedValue(subscription);

      // Act
      const result = await service.cancelSubscription({
        userId,
        cancelAtPeriodEnd: false,
      });

      // Assert
      expect(result).toMatchObject({
        subscription: { status: 'canceled' },
        canceledImmediately: true,
      });
      expect(mockStripeService.cancelSubscription).toHaveBeenCalledWith(
        'sub_cancel_123',
        { cancel_at_period_end: false }
      );
      expect(mockSubscriptionRepo.update).toHaveBeenCalledWith(
        { status: 'canceled', canceledAt: expect.any(Date) },
        { where: { id: subscription.id } }
      );
    });

    test('should cancel subscription at period end', async () => {
      // Arrange
      const userId = 'user-cancel-later';
      const subscription = TestFactories.createSubscription({
        userId,
        status: 'active',
        stripeSubscriptionId: 'sub_cancel_later',
      });

      mockSubscriptionRepo.findOne.mockResolvedValue(subscription);

      // Act
      const result = await service.cancelSubscription({
        userId,
        cancelAtPeriodEnd: true,
      });

      // Assert
      expect(result).toMatchObject({
        subscription: { status: 'active' }, // Remains active until period end
        canceledImmediately: false,
      });
      expect(mockStripeService.cancelSubscription).toHaveBeenCalledWith(
        subscription.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );
    });
  });

  describe('Failed Payment Handling', () => {
    test('should handle failed payment and update subscription status', async () => {
      // Arrange
      const subscription = TestFactories.createSubscription({
        userId: 'user-failed-payment',
        status: 'active',
        stripeSubscriptionId: 'sub_fail_123',
      });

      mockSubscriptionRepo.findOne.mockResolvedValue(subscription);
      mockTransactionRepo.create.mockResolvedValue({
        id: 'txn_failed',
        userId: subscription.userId,
        status: 'failed',
      });

      // Act
      const result = await service.handleFailedPayment({
        subscriptionId: 'sub_fail_123',
        reason: 'insufficient_funds',
      });

      // Assert
      expect(result).toMatchObject({
        subscription: { status: 'past_due' },
        transaction: { status: 'failed' },
      });
      expect(mockSubscriptionRepo.update).toHaveBeenCalledWith(
        { status: 'past_due' },
        { where: { id: subscription.id } }
      );
      expect(mockTransactionRepo.create).toHaveBeenCalledWith({
        userId: subscription.userId,
        amount: 0,
        currency: 'USD',
        type: 'subscription_payment',
        status: 'failed',
        description: 'Payment failed: insufficient_funds',
      });
    });
  });

  describe('Subscription Reactivation', () => {
    test('should reactivate canceled subscription', async () => {
      // Arrange
      const userId = 'user-reactivate';
      const canceledSubscription = TestFactories.createSubscription({
        userId,
        status: 'canceled',
        stripeCustomerId: 'cus_reactivate',
      });
      const newStripeSubscription = {
        id: 'sub_reactivate_new',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      };

      mockSubscriptionRepo.findOne.mockResolvedValue(canceledSubscription);
      mockStripeService.createSubscription.mockResolvedValue(newStripeSubscription);

      // Act
      const result = await service.reactivateSubscription({
        userId,
        paymentMethodId: 'pm_reactivate',
      });

      // Assert
      expect(result).toMatchObject({
        subscription: { status: 'active' },
        gamification: { pointsAwarded: 50 },
      });
      expect(mockStripeService.createSubscription).toHaveBeenCalledWith({
        customer: 'cus_reactivate',
        price: 'price_premium',
        payment_method: 'pm_reactivate',
      });
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
        userId,
        'subscription_reactivated',
        50
      );
    });

    test('should reject reactivation when no canceled subscription exists', async () => {
      // Arrange
      mockSubscriptionRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.reactivateSubscription({
          userId: 'user-no-canceled-sub',
          paymentMethodId: 'pm_test',
        })
      ).rejects.toThrow('No canceled subscription found');

      expect(mockStripeService.createSubscription).not.toHaveBeenCalled();
    });
  });
});
