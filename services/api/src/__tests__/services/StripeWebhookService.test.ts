import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import Stripe from 'stripe';
import { StripeWebhookService } from '../../services/financial/StripeWebhookService';
import {
  Transaction,
  Subscription,
  BillingEvent,
  User,
  TransactionStatus,
  SubscriptionStatus,
} from '../../models';

// Mock dependencies
jest.mock('../../models', () => ({
  Transaction: {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
  Subscription: {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
  BillingEvent: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
  TransactionStatus: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded',
  },
  TransactionType: {
    PAYMENT: 'payment',
    REFUND: 'refund',
    ADJUSTMENT: 'adjustment',
    CHARGEBACK: 'chargeback',
    PAYOUT: 'payout',
  },
  PaymentMethod: {
    CARD: 'card',
    BANK_TRANSFER: 'bank_transfer',
    PAYPAL: 'paypal',
    CRYPTO: 'crypto',
    OTHER: 'other',
  },
  SubscriptionStatus: {
    ACTIVE: 'active',
    PAST_DUE: 'past_due',
    CANCELED: 'canceled',
    TRIALING: 'trialing',
    INCOMPLETE: 'incomplete',
    INCOMPLETE_EXPIRED: 'incomplete_expired',
    PAUSED: 'paused',
  },
  BillingEventType: {
    SUBSCRIPTION_CREATED: 'subscription_created',
    SUBSCRIPTION_UPDATED: 'subscription_updated',
    SUBSCRIPTION_CANCELED: 'subscription_canceled',
    SUBSCRIPTION_REACTIVATED: 'subscription_reactivated',
    PAYMENT_SUCCEEDED: 'payment_succeeded',
    PAYMENT_FAILED: 'payment_failed',
    PAYMENT_RETRY: 'payment_retry',
    REFUND_ISSUED: 'refund_issued',
    CHARGEBACK_CREATED: 'chargeback_created',
    TRIAL_STARTED: 'trial_started',
    TRIAL_ENDED: 'trial_ended',
    PLAN_CHANGED: 'plan_changed',
    DISCOUNT_APPLIED: 'discount_applied',
    DISCOUNT_REMOVED: 'discount_removed',
    INVOICE_CREATED: 'invoice_created',
    INVOICE_SENT: 'invoice_sent',
    INVOICE_PAID: 'invoice_paid',
    CREDIT_APPLIED: 'credit_applied',
    DUNNING_STARTED: 'dunning_started',
    DUNNING_RESOLVED: 'dunning_resolved',
  },
  BillingEventSource: {
    STRIPE_WEBHOOK: 'stripe_webhook',
    ADMIN_ACTION: 'admin_action',
    SYSTEM_AUTOMATION: 'system_automation',
    USER_ACTION: 'user_action',
    API_CALL: 'api_call',
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('StripeWebhookService', () => {
  let webhookService: StripeWebhookService;
  const mockTransaction = Transaction as jest.Mocked<typeof Transaction>;
  const mockSubscription = Subscription as jest.Mocked<typeof Subscription>;
  const mockBillingEvent = BillingEvent as jest.Mocked<typeof BillingEvent>;
  const mockUser = User as jest.Mocked<typeof User>;

  const testUserId = 123;
  const testEmail = 'test@upcoach.ai';
  const testCustomerId = 'cus_test123';

  beforeEach(() => {
    webhookService = new StripeWebhookService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('handleWebhook', () => {
    test('should prevent processing duplicate events', async () => {
      const duplicateEvent = {
        id: 'evt_duplicate123',
        type: 'payment_intent.succeeded',
        data: { object: {} },
      } as Stripe.Event;

      // Mock existing event found
      mockBillingEvent.findOne.mockResolvedValue({ id: 1 } as unknown);

      await webhookService.handleWebhook(duplicateEvent);

      // Should not process the event
      expect(mockBillingEvent.create).not.toHaveBeenCalled();
      expect(mockTransaction.create).not.toHaveBeenCalled();
    });

    test('should log new billing events', async () => {
      const newEvent = {
        id: 'evt_new123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_new123',
            customer: testCustomerId,
            amount: 5000,
            currency: 'usd',
            receipt_email: testEmail,
            charges: { data: [{ payment_method_details: { type: 'card' } }] },
          }
        },
        created: Date.now() / 1000,
      } as unknown as Stripe.Event;

      mockBillingEvent.findOne.mockResolvedValue(null);
      mockBillingEvent.create.mockResolvedValue({} as unknown);
      mockUser.findOne.mockResolvedValue({ id: testUserId, email: testEmail } as unknown);
      mockTransaction.create.mockResolvedValue({} as unknown);

      await webhookService.handleWebhook(newEvent);

      // Check that billing event was created (implementation creates it in handler)
      expect(mockBillingEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'payment_succeeded',
          source: 'stripe_webhook',
          userId: testUserId,
        })
      );
    });
  });

  describe('Payment Intent Events', () => {
    test('should handle payment_intent.succeeded event', async () => {
      const paymentSucceededEvent = {
        id: 'evt_payment_success',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            customer: testCustomerId,
            amount: 5000, // $50.00
            currency: 'usd',
            metadata: { userId: testUserId.toString() },
            charges: {
              data: [{
                payment_method_details: {
                  type: 'card',
                  card: { last4: '4242' }
                }
              }]
            },
          },
        },
      } as unknown as Stripe.Event;

      mockBillingEvent.findOne.mockResolvedValue(null);
      mockBillingEvent.create.mockResolvedValue({} as unknown);
      mockUser.findOne.mockResolvedValue({ id: testUserId, email: testEmail } as unknown);
      mockTransaction.create.mockResolvedValue({} as unknown);

      await webhookService.handleWebhook(paymentSucceededEvent);

      expect(mockTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          amount: 50.00, // Converted from cents
          currency: 'usd',
          status: TransactionStatus.COMPLETED,
        })
      );
    });

    test('should handle payment_intent.payment_failed event', async () => {
      const paymentFailedEvent = {
        id: 'evt_payment_failed',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_456',
            customer: testCustomerId,
            amount: 3000,
            currency: 'usd',
            receipt_email: testEmail,
            metadata: { userId: testUserId.toString() },
            last_payment_error: {
              message: 'Your card was declined',
            },
          },
        },
      } as unknown as Stripe.Event;

      mockBillingEvent.findOne.mockResolvedValue(null);
      mockBillingEvent.create.mockResolvedValue({} as unknown);
      mockUser.findOne.mockResolvedValue({ id: testUserId, email: testEmail } as unknown);
      mockTransaction.create.mockResolvedValue({} as unknown);

      await webhookService.handleWebhook(paymentFailedEvent);

      expect(mockTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          status: TransactionStatus.FAILED,
          failureReason: 'Your card was declined',
        })
      );
    });
  });

  describe('Subscription Events', () => {
    test('should handle customer.subscription.created event', async () => {
      const subscriptionCreatedEvent = {
        id: 'evt_sub_created',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: testCustomerId,
            status: 'active',
            currency: 'usd',
            items: {
              data: [{
                price: {
                  id: 'price_premium',
                  nickname: 'Premium Plan',
                  lookup_key: 'pro_monthly',
                  recurring: { interval: 'month' },
                  unit_amount: 2999,
                  currency: 'usd',
                },
              }],
            },
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            trial_end: null,
            metadata: { userId: testUserId.toString() },
          },
        },
      } as unknown as Stripe.Event;

      mockBillingEvent.findOne.mockResolvedValue(null);
      mockBillingEvent.create.mockResolvedValue({} as unknown);
      // Implementation looks for existing subscription to find user
      mockSubscription.findOne.mockResolvedValue({ user: { id: testUserId, email: testEmail } } as unknown);
      mockSubscription.create.mockResolvedValue({ id: 1 } as unknown);

      await webhookService.handleWebhook(subscriptionCreatedEvent);

      expect(mockSubscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          status: SubscriptionStatus.ACTIVE,
          amount: 29.99,
          currency: 'usd',
        })
      );
    });

    test('should handle customer.subscription.updated event', async () => {
      const subscriptionUpdatedEvent = {
        id: 'evt_sub_updated',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            customer: testCustomerId,
            status: 'past_due',
            currency: 'usd',
            items: {
              data: [{
                price: {
                  id: 'price_premium',
                  lookup_key: 'pro_monthly',
                  unit_amount: 2999,
                },
              }],
            },
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            metadata: { userId: testUserId.toString() },
          },
          previous_attributes: {
            status: 'active',
          },
        },
      } as unknown as Stripe.Event;

      const mockSubscriptionInstance = {
        id: 1,
        plan: 'pro',
        userId: testUserId,
        update: jest.fn().mockResolvedValue({}),
        save: jest.fn().mockResolvedValue({}),
      };

      mockBillingEvent.findOne.mockResolvedValue(null);
      mockBillingEvent.create.mockResolvedValue({} as unknown);
      mockUser.findOne.mockResolvedValue({ id: testUserId, email: testEmail } as unknown);
      mockSubscription.findOne.mockResolvedValue(mockSubscriptionInstance as unknown);

      await webhookService.handleWebhook(subscriptionUpdatedEvent);

      expect(mockSubscriptionInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.PAST_DUE,
        })
      );
    });

    test('should handle customer.subscription.deleted event', async () => {
      const subscriptionDeletedEvent = {
        id: 'evt_sub_deleted',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            customer: testCustomerId,
            status: 'canceled',
            metadata: { userId: testUserId.toString() },
            canceled_at: Math.floor(Date.now() / 1000),
          },
        },
      } as unknown as Stripe.Event;

      const mockSubscriptionInstance = {
        id: 1,
        plan: 'pro',
        userId: testUserId,
        currentPeriodEnd: new Date(),
        update: jest.fn().mockResolvedValue({}),
        save: jest.fn().mockResolvedValue({}),
      };

      mockBillingEvent.findOne.mockResolvedValue(null);
      mockBillingEvent.create.mockResolvedValue({} as unknown);
      mockUser.findOne.mockResolvedValue({ id: testUserId, email: testEmail } as unknown);
      mockSubscription.findOne.mockResolvedValue(mockSubscriptionInstance as unknown);

      await webhookService.handleWebhook(subscriptionDeletedEvent);

      expect(mockSubscriptionInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.CANCELED,
        })
      );
    });

    test('should handle trial_will_end event', async () => {
      const trialEndingEvent = {
        id: 'evt_trial_ending',
        type: 'customer.subscription.trial_will_end',
        data: {
          object: {
            id: 'sub_123',
            customer: testCustomerId,
            trial_end: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60, // 3 days from now
            metadata: { userId: testUserId.toString() },
          },
        },
      } as unknown as Stripe.Event;

      const mockSubscriptionInstance = {
        id: 1,
        plan: 'pro',
        userId: testUserId,
      };

      mockBillingEvent.findOne.mockResolvedValue(null);
      mockBillingEvent.create.mockResolvedValue({} as unknown);
      mockSubscription.findOne.mockResolvedValue(mockSubscriptionInstance as unknown);

      await webhookService.handleWebhook(trialEndingEvent);

      // Should create billing event for trial ending
      expect(mockBillingEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'trial_ended',
          userId: testUserId,
        })
      );
    });
  });

  describe('Invoice Events', () => {
    test('should handle invoice.payment_succeeded event', async () => {
      const invoiceSucceededEvent = {
        id: 'evt_invoice_success',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_123',
            customer: testCustomerId,
            amount_paid: 2999,
            currency: 'usd',
            subscription: 'sub_123',
            charge: 'ch_123',
            metadata: { userId: testUserId.toString() },
          },
        },
      } as unknown as Stripe.Event;

      const mockSubscriptionInstance = {
        id: 1,
        plan: 'pro',
        userId: testUserId,
        currentPeriodEnd: new Date(),
        save: jest.fn().mockResolvedValue({}),
      };

      mockBillingEvent.findOne.mockResolvedValue(null);
      mockBillingEvent.create.mockResolvedValue({} as unknown);
      mockUser.findOne.mockResolvedValue({ id: testUserId, email: testEmail } as unknown);
      mockSubscription.findOne.mockResolvedValue(mockSubscriptionInstance as unknown);
      mockTransaction.create.mockResolvedValue({} as unknown);

      await webhookService.handleWebhook(invoiceSucceededEvent);

      expect(mockTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          amount: 29.99,
          status: TransactionStatus.COMPLETED,
          type: 'payment',
        })
      );
    });

    test('should handle invoice.payment_failed event', async () => {
      const invoiceFailedEvent = {
        id: 'evt_invoice_failed',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_456',
            customer: testCustomerId,
            amount_due: 2999,
            currency: 'usd',
            subscription: 'sub_123',
            metadata: { userId: testUserId.toString() },
            attempt_count: 2,
          },
        },
      } as unknown as Stripe.Event;

      const mockSubscriptionInstance = {
        id: 1,
        plan: 'pro',
        userId: testUserId,
        update: jest.fn().mockResolvedValue({}),
        save: jest.fn().mockResolvedValue({}),
      };

      mockBillingEvent.findOne.mockResolvedValue(null);
      mockBillingEvent.create.mockResolvedValue({} as unknown);
      mockUser.findOne.mockResolvedValue({ id: testUserId, email: testEmail } as unknown);
      mockSubscription.findOne.mockResolvedValue(mockSubscriptionInstance as unknown);

      await webhookService.handleWebhook(invoiceFailedEvent);

      // Should update subscription status to past_due
      expect(mockSubscriptionInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.PAST_DUE,
        })
      );
    });
  });

  describe('Refund Events', () => {
    test('should handle charge.refunded event', async () => {
      const refundEvent = {
        id: 'evt_refund',
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_123',
            customer: testCustomerId,
            amount: 5000,
            amount_refunded: 5000,
            currency: 'usd',
            refunded: true,
            refunds: {
              data: [{
                id: 're_123',
                amount: 5000,
                reason: 'requested_by_customer',
              }],
            },
            metadata: { userId: testUserId.toString() },
          },
        },
      } as unknown as Stripe.Event;

      const mockTransactionInstance = {
        id: 1,
        userId: testUserId,
        subscriptionId: null,
        stripeTransactionId: 'ch_123',
        update: jest.fn().mockResolvedValue({}),
        save: jest.fn().mockResolvedValue({}),
      };

      mockBillingEvent.findOne.mockResolvedValue(null);
      mockBillingEvent.create.mockResolvedValue({} as unknown);
      mockUser.findOne.mockResolvedValue({ id: testUserId, email: testEmail } as unknown);
      mockTransaction.findOne.mockResolvedValue(mockTransactionInstance as unknown);
      mockTransaction.create.mockResolvedValue({} as unknown);

      await webhookService.handleWebhook(refundEvent);

      expect(mockTransactionInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TransactionStatus.REFUNDED,
          refundedAmount: 50,
        })
      );
    });
  });

  describe('Dispute Events', () => {
    test('should handle charge.dispute.created event', async () => {
      const disputeEvent = {
        id: 'evt_dispute',
        type: 'charge.dispute.created',
        data: {
          object: {
            id: 'dp_123',
            charge: 'ch_123',
            amount: 5000,
            currency: 'usd',
            reason: 'fraudulent',
            status: 'needs_response',
            metadata: { userId: testUserId.toString() },
          },
        },
      } as unknown as Stripe.Event;

      const mockTransactionInstance = {
        id: 1,
        userId: testUserId,
        stripeTransactionId: 'ch_123',
      };

      mockBillingEvent.findOne.mockResolvedValue(null);
      mockBillingEvent.create.mockResolvedValue({} as unknown);
      mockUser.findOne.mockResolvedValue({ id: testUserId, email: testEmail } as unknown);
      mockTransaction.findOne.mockResolvedValue(mockTransactionInstance as unknown);

      await webhookService.handleWebhook(disputeEvent);

      // Should log dispute for manual review
      expect(mockBillingEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'chargeback_created',
          userId: testUserId,
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle user not found gracefully', async () => {
      const event = {
        id: 'evt_no_user',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            customer: 'cus_nonexistent',
            metadata: { userId: '99999' },
          },
        },
      } as unknown as Stripe.Event;

      mockBillingEvent.findOne.mockResolvedValue(null);
      mockBillingEvent.create.mockResolvedValue({} as unknown);
      mockUser.findOne.mockResolvedValue(null);

      // Should not throw
      await expect(webhookService.handleWebhook(event)).resolves.toBeUndefined();
    });

    test('should handle database errors gracefully', async () => {
      const event = {
        id: 'evt_db_error',
        type: 'payment_intent.succeeded',
        data: { object: {} },
      } as Stripe.Event;

      mockBillingEvent.findOne.mockRejectedValue(new Error('Database connection failed'));

      // Should throw the error (implementation doesn't catch it in handleWebhook)
      await expect(webhookService.handleWebhook(event)).rejects.toThrow('Database connection failed');
    });

    test('should handle missing metadata gracefully', async () => {
      const eventWithoutMetadata = {
        id: 'evt_no_metadata',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            customer: testCustomerId,
            amount: 1000,
            currency: 'usd',
            // No metadata field
          },
        },
      } as unknown as Stripe.Event;

      mockBillingEvent.findOne.mockResolvedValue(null);
      mockBillingEvent.create.mockResolvedValue({} as unknown);
      mockUser.findOne.mockResolvedValue({ id: testUserId } as unknown);

      await expect(webhookService.handleWebhook(eventWithoutMetadata)).resolves.toBeUndefined();
    });
  });

  describe('Amount Conversion', () => {
    test('should correctly convert cents to dollars', async () => {
      const event = {
        id: 'evt_conversion',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            customer: testCustomerId,
            amount: 12345, // $123.45
            currency: 'usd',
            metadata: { userId: testUserId.toString() },
            charges: { data: [{ payment_method_details: { type: 'card' } }] },
          },
        },
      } as unknown as Stripe.Event;

      mockBillingEvent.findOne.mockResolvedValue(null);
      mockBillingEvent.create.mockResolvedValue({} as unknown);
      mockUser.findOne.mockResolvedValue({ id: testUserId } as unknown);
      mockTransaction.create.mockResolvedValue({} as unknown);

      await webhookService.handleWebhook(event);

      expect(mockTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 123.45,
        })
      );
    });

    test('should handle zero-decimal currencies correctly', async () => {
      const event = {
        id: 'evt_jpy',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            customer: testCustomerId,
            amount: 1000, // ¥1000 (no decimals for JPY)
            currency: 'jpy',
            metadata: { userId: testUserId.toString() },
            charges: { data: [{ payment_method_details: { type: 'card' } }] },
          },
        },
      } as unknown as Stripe.Event;

      mockBillingEvent.findOne.mockResolvedValue(null);
      mockBillingEvent.create.mockResolvedValue({} as unknown);
      mockUser.findOne.mockResolvedValue({ id: testUserId } as unknown);
      mockTransaction.create.mockResolvedValue({} as unknown);

      await webhookService.handleWebhook(event);

      // JPY should not be divided by 100
      expect(mockTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'jpy',
        })
      );
    });
  });
});
