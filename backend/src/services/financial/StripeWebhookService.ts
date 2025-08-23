import Stripe from 'stripe';
import { 
  Transaction, 
  Subscription, 
  BillingEvent,
  User,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
  SubscriptionStatus,
  BillingEventType,
  BillingEventSource,
} from '../../models';
import { logger } from '../../utils/logger';

export class StripeWebhookService {
  /**
   * Handle incoming Stripe webhook
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      // Check for duplicate events
      const existingEvent = await BillingEvent.findOne({
        where: { stripeEventId: event.id },
      });

      if (existingEvent) {
        logger.info(`Duplicate webhook event: ${event.id}`);
        return;
      }

      // Process event based on type
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }

      // Record the event
      await this.recordBillingEvent(event);
    } catch (error) {
      logger.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const user = await User.findOne({
      where: { email: paymentIntent.receipt_email! },
    });

    if (!user) {
      logger.error(`User not found for payment: ${paymentIntent.id}`);
      return;
    }

    // Create transaction record
    await Transaction.create({
      userId: user.id,
      stripeTransactionId: paymentIntent.id,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.COMPLETED,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      paymentMethod: PaymentMethod.CARD,
      description: paymentIntent.description || 'Payment',
    });

    // Create billing event
    await BillingEvent.create({
      eventType: BillingEventType.PAYMENT_SUCCEEDED,
      source: BillingEventSource.STRIPE_WEBHOOK,
      userId: user.id,
      stripeEventId: paymentIntent.id,
      description: `Payment of ${paymentIntent.amount / 100} ${paymentIntent.currency} succeeded`,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      isProcessed: true,
      processedAt: new Date(),
    });
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const user = await User.findOne({
      where: { email: paymentIntent.receipt_email! },
    });

    if (!user) return;

    // Create failed transaction
    await Transaction.create({
      userId: user.id,
      stripeTransactionId: paymentIntent.id,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.FAILED,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      paymentMethod: PaymentMethod.CARD,
      description: paymentIntent.description || 'Payment',
      failureReason: paymentIntent.last_payment_error?.message,
    });

    // Create billing event
    await BillingEvent.create({
      eventType: BillingEventType.PAYMENT_FAILED,
      source: BillingEventSource.STRIPE_WEBHOOK,
      userId: user.id,
      stripeEventId: paymentIntent.id,
      description: `Payment failed: ${paymentIntent.last_payment_error?.message}`,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      isProcessed: true,
      processedAt: new Date(),
    });
  }

  /**
   * Handle subscription creation
   */
  private async handleSubscriptionCreated(stripeSubscription: Stripe.Subscription): Promise<void> {
    // Find user by looking up existing subscription with the same customer ID
    const existingSubscription = await Subscription.findOne({
      where: { stripeCustomerId: stripeSubscription.customer as string },
      include: [{ model: User, as: 'user' }],
    });

    const user = existingSubscription?.user;

    if (!user) return;

    const subscription = await Subscription.create({
      userId: user.id,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: stripeSubscription.customer as string,
      plan: this.mapStripePlanToInternal(stripeSubscription.items.data[0].price.lookup_key!),
      status: this.mapStripeStatusToInternal(stripeSubscription.status),
      amount: stripeSubscription.items.data[0].price.unit_amount! / 100,
      currency: stripeSubscription.currency,
      currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
      trialStartDate: stripeSubscription.trial_start 
        ? new Date(stripeSubscription.trial_start * 1000) 
        : undefined,
      trialEndDate: stripeSubscription.trial_end 
        ? new Date(stripeSubscription.trial_end * 1000) 
        : undefined,
    });

    // Create billing event
    await BillingEvent.create({
      eventType: BillingEventType.SUBSCRIPTION_CREATED,
      source: BillingEventSource.STRIPE_WEBHOOK,
      userId: user.id,
      subscriptionId: subscription.id,
      stripeEventId: stripeSubscription.id,
      description: `Subscription created: ${subscription.plan} plan`,
      isProcessed: true,
      processedAt: new Date(),
    });
  }

  /**
   * Handle subscription update
   */
  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) return;

    const previousPlan = subscription.plan;
    const newPlan = this.mapStripePlanToInternal(stripeSubscription.items.data[0].price.lookup_key!);

    await subscription.update({
      plan: newPlan,
      status: this.mapStripeStatusToInternal(stripeSubscription.status),
      amount: stripeSubscription.items.data[0].price.unit_amount! / 100,
      currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
    });

    // Determine event type
    let eventType = BillingEventType.SUBSCRIPTION_UPDATED;
    if (previousPlan !== newPlan) {
      eventType = BillingEventType.PLAN_CHANGED;
    }

    // Create billing event
    await BillingEvent.create({
      eventType,
      source: BillingEventSource.STRIPE_WEBHOOK,
      userId: subscription.userId,
      subscriptionId: subscription.id,
      stripeEventId: stripeSubscription.id,
      description: `Subscription updated: ${previousPlan} → ${newPlan}`,
      previousValue: previousPlan,
      newValue: newPlan,
      isProcessed: true,
      processedAt: new Date(),
    });
  }

  /**
   * Handle subscription deletion
   */
  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) return;

    await subscription.update({
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
    });

    // Create billing event
    await BillingEvent.create({
      eventType: BillingEventType.SUBSCRIPTION_CANCELED,
      source: BillingEventSource.STRIPE_WEBHOOK,
      userId: subscription.userId,
      subscriptionId: subscription.id,
      stripeEventId: stripeSubscription.id,
      description: 'Subscription canceled',
      isProcessed: true,
      processedAt: new Date(),
    });
  }

  /**
   * Handle trial ending soon
   */
  private async handleTrialWillEnd(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) return;

    // Create billing event
    await BillingEvent.create({
      eventType: BillingEventType.TRIAL_ENDED,
      source: BillingEventSource.STRIPE_WEBHOOK,
      userId: subscription.userId,
      subscriptionId: subscription.id,
      stripeEventId: stripeSubscription.id,
      description: 'Trial period ending soon',
      isProcessed: true,
      processedAt: new Date(),
    });

    // TODO: Send notification to user
  }

  /**
   * Handle invoice payment succeeded
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: (invoice as any).subscription as string },
    });

    if (!subscription) return;

    // Update subscription payment date
    // Update subscription if needed
    await subscription.save();

    // Create transaction
    await Transaction.create({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      stripeTransactionId: (invoice as any).charge as string,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.COMPLETED,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      paymentMethod: PaymentMethod.CARD,
      description: 'Subscription payment',
      stripeInvoiceId: invoice.id,
    });
  }

  /**
   * Handle invoice payment failed
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: (invoice as any).subscription as string },
    });

    if (!subscription) return;

    // Update subscription status
    await subscription.update({
      status: SubscriptionStatus.PAST_DUE,
    });

    // Create billing event
    await BillingEvent.create({
      eventType: BillingEventType.PAYMENT_FAILED,
      source: BillingEventSource.STRIPE_WEBHOOK,
      userId: subscription.userId,
      subscriptionId: subscription.id,
      stripeEventId: invoice.id,
      description: 'Invoice payment failed',
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      isProcessed: true,
      processedAt: new Date(),
    });
  }

  /**
   * Handle charge refunded
   */
  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const transaction = await Transaction.findOne({
      where: { stripeTransactionId: charge.id },
    });

    if (!transaction) return;

    // Update transaction
    await transaction.update({
      status: TransactionStatus.REFUNDED,
      refundedAmount: charge.amount_refunded / 100,
    });

    // Create refund transaction
    await Transaction.create({
      userId: transaction.userId,
      subscriptionId: transaction.subscriptionId,
      stripeTransactionId: `${charge.id}_refund`,
      type: TransactionType.REFUND,
      status: TransactionStatus.COMPLETED,
      amount: charge.amount_refunded / 100,
      currency: charge.currency,
      paymentMethod: PaymentMethod.CARD,
      description: 'Refund',
    });

    // Create billing event
    await BillingEvent.create({
      eventType: BillingEventType.REFUND_ISSUED,
      source: BillingEventSource.STRIPE_WEBHOOK,
      userId: transaction.userId,
      transactionId: transaction.id,
      stripeEventId: charge.id,
      description: 'Refund issued',
      amount: charge.amount_refunded / 100,
      currency: charge.currency,
      isProcessed: true,
      processedAt: new Date(),
    });
  }

  /**
   * Handle dispute created
   */
  private async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    const transaction = await Transaction.findOne({
      where: { stripeTransactionId: dispute.charge as string },
    });

    if (!transaction) return;

    // Create billing event
    await BillingEvent.create({
      eventType: BillingEventType.CHARGEBACK_CREATED,
      source: BillingEventSource.STRIPE_WEBHOOK,
      userId: transaction.userId,
      transactionId: transaction.id,
      stripeEventId: dispute.id,
      description: `Dispute created: ${dispute.reason}`,
      amount: dispute.amount / 100,
      currency: dispute.currency,
      isProcessed: false, // Requires manual review
      processedAt: new Date(),
    });
  }

  /**
   * Record billing event for audit
   */
  private async recordBillingEvent(event: Stripe.Event): Promise<void> {
    // This is handled in individual event handlers
    logger.info(`Processed Stripe webhook: ${event.type}`);
  }

  /**
   * Map Stripe plan to internal plan
   */
  private mapStripePlanToInternal(stripePlan: string): any {
    const planMap: Record<string, any> = {
      'basic_monthly': 'basic',
      'pro_monthly': 'pro',
      'team_monthly': 'team',
      'enterprise_monthly': 'enterprise',
    };

    return planMap[stripePlan] || 'free';
  }

  /**
   * Map Stripe status to internal status
   */
  private mapStripeStatusToInternal(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      'active': SubscriptionStatus.ACTIVE,
      'past_due': SubscriptionStatus.PAST_DUE,
      'canceled': SubscriptionStatus.CANCELED,
      'incomplete': SubscriptionStatus.INCOMPLETE,
      'incomplete_expired': SubscriptionStatus.INCOMPLETE_EXPIRED,
      'trialing': SubscriptionStatus.TRIALING,
      'paused': SubscriptionStatus.PAUSED,
    };

    return statusMap[stripeStatus] || SubscriptionStatus.INCOMPLETE;
  }
}

export const stripeWebhookService = new StripeWebhookService(); 