import Stripe from 'stripe';
import { Transaction, Subscription, BillingEvent } from '../../models';
import { sequelize } from '../../models';

/**
 * StripeWebhookService
 * Handles Stripe webhook events and updates database accordingly
 */
export class StripeWebhookService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event: Stripe.Event): Promise<void> {
    // Check for duplicate webhook
    const isDuplicate = await BillingEvent.isDuplicateWebhook(event.id);
    if (isDuplicate) {
      console.log(`Duplicate webhook received: ${event.id}`);
      return;
    }

    // Create billing event record
    const billingEvent = await BillingEvent.create({
      eventType: this.mapStripeEventType(event.type),
      webhookId: event.id,
      webhookProvider: 'stripe',
      webhookVerified: true,
      source: 'webhook',
      eventData: {
        metadata: event.data.object,
      },
      processingStatus: 'processing',
      sideEffects: {},
      impact: {},
      compliance: {
        gdprCompliant: true,
        pciCompliant: true,
      },
      childEventIds: [],
      environment: process.env.NODE_ENV as any,
      version: '1.0.0',
      tags: ['stripe', event.type],
      eventTimestamp: new Date(event.created * 1000),
    });

    const transaction = await sequelize.transaction();

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event, billingEvent, transaction);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event, billingEvent, transaction);
          break;
        
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event, billingEvent, transaction);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event, billingEvent, transaction);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event, billingEvent, transaction);
          break;
        
        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event, billingEvent, transaction);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event, billingEvent, transaction);
          break;
        
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event, billingEvent, transaction);
          break;
        
        case 'charge.refunded':
          await this.handleChargeRefunded(event, billingEvent, transaction);
          break;
        
        case 'charge.dispute.created':
          await this.handleDisputeCreated(event, billingEvent, transaction);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Update billing event as completed
      billingEvent.processingStatus = 'completed';
      billingEvent.processedAt = new Date();
      billingEvent.processingDuration = Date.now() - billingEvent.createdAt.getTime();
      await billingEvent.save({ transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      
      // Update billing event as failed
      billingEvent.processingStatus = 'failed';
      billingEvent.processingError = error.message;
      await billingEvent.save();
      
      throw error;
    }
  }

  /**
   * Handle payment succeeded event
   */
  private async handlePaymentSucceeded(
    event: Stripe.Event,
    billingEvent: BillingEvent,
    transaction: any
  ): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    // Find or create transaction
    const [txn, created] = await Transaction.findOrCreate({
      where: { providerTransactionId: paymentIntent.id },
      defaults: {
        userId: paymentIntent.metadata.userId,
        subscriptionId: paymentIntent.metadata.subscriptionId,
        type: 'payment',
        status: 'completed',
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        description: paymentIntent.description || 'Subscription payment',
        paymentMethod: this.mapPaymentMethod(paymentIntent.payment_method_types[0]),
        paymentProvider: 'stripe',
        providerTransactionId: paymentIntent.id,
        providerCustomerId: paymentIntent.customer as string,
        subtotal: paymentIntent.amount / 100,
        taxAmount: 0, // Would be calculated from metadata
        taxRate: 0,
        refundedAmount: 0,
        requiresReview: false,
        metadata: paymentIntent.metadata,
        processedAt: new Date(),
      },
      transaction,
    });

    // Update billing event
    billingEvent.userId = txn.userId;
    billingEvent.transactionId = txn.id;
    billingEvent.subscriptionId = txn.subscriptionId;
    billingEvent.eventData = {
      amount: txn.amount,
      currency: txn.currency,
      description: txn.description,
      paymentMethod: txn.paymentMethod,
    };
    billingEvent.impact = {
      revenueImpact: txn.amount,
      mrrChange: 0, // Will be calculated based on subscription
    };
    billingEvent.sideEffects = {
      emailsSent: ['payment_confirmation'],
      notificationsSent: ['payment_success'],
    };
  }

  /**
   * Handle payment failed event
   */
  private async handlePaymentFailed(
    event: Stripe.Event,
    billingEvent: BillingEvent,
    transaction: any
  ): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    // Create failed transaction record
    const txn = await Transaction.create({
      userId: paymentIntent.metadata.userId,
      subscriptionId: paymentIntent.metadata.subscriptionId,
      type: 'payment',
      status: 'failed',
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      description: paymentIntent.description || 'Failed payment',
      paymentMethod: this.mapPaymentMethod(paymentIntent.payment_method_types[0]),
      paymentProvider: 'stripe',
      providerTransactionId: paymentIntent.id,
      providerCustomerId: paymentIntent.customer as string,
      subtotal: paymentIntent.amount / 100,
      taxAmount: 0,
      taxRate: 0,
      refundedAmount: 0,
      requiresReview: true,
      metadata: {
        ...paymentIntent.metadata,
        failureCode: paymentIntent.last_payment_error?.code,
        failureMessage: paymentIntent.last_payment_error?.message,
      },
      failedAt: new Date(),
    }, { transaction });

    // Update billing event
    billingEvent.userId = txn.userId;
    billingEvent.transactionId = txn.id;
    billingEvent.subscriptionId = txn.subscriptionId;
    billingEvent.eventData = {
      amount: txn.amount,
      currency: txn.currency,
      failureReason: paymentIntent.last_payment_error?.message,
      failureCode: paymentIntent.last_payment_error?.code,
    };
    billingEvent.sideEffects = {
      emailsSent: ['payment_failed'],
      notificationsSent: ['payment_failure'],
      actionsPerformed: ['dunning_started'],
    };
  }

  /**
   * Handle subscription created event
   */
  private async handleSubscriptionCreated(
    event: Stripe.Event,
    billingEvent: BillingEvent,
    transaction: any
  ): Promise<void> {
    const stripeSubscription = event.data.object as Stripe.Subscription;
    
    // Create subscription record
    const subscription = await Subscription.create({
      userId: stripeSubscription.metadata.userId,
      customerId: stripeSubscription.customer as string,
      planId: stripeSubscription.items.data[0].price.id,
      planName: stripeSubscription.items.data[0].price.nickname || 'Subscription',
      planType: this.mapPlanType(stripeSubscription.items.data[0].price.metadata),
      status: this.mapSubscriptionStatus(stripeSubscription.status),
      billingInterval: this.mapBillingInterval(stripeSubscription.items.data[0].price.recurring?.interval),
      billingAmount: (stripeSubscription.items.data[0].price.unit_amount || 0) / 100,
      currency: stripeSubscription.currency.toUpperCase(),
      trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : undefined,
      trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      startDate: new Date(stripeSubscription.start_date * 1000),
      discountPercentage: 0,
      discountAmount: 0,
      usageMetrics: {
        sessionsUsed: 0,
        sessionsLimit: -1,
        storageUsed: 0,
        storageLimit: 1000,
        coachingHoursUsed: 0,
        coachingHoursLimit: 10,
        aiCreditsUsed: 0,
        aiCreditsLimit: 1000,
      },
      winBackAttempts: 0,
      tags: [],
    }, { transaction });

    // Update billing event
    billingEvent.userId = subscription.userId;
    billingEvent.subscriptionId = subscription.id;
    billingEvent.eventData = {
      newPlan: subscription.planName,
      newAmount: subscription.billingAmount,
    };
    billingEvent.impact = {
      mrrChange: subscription.getMRR(),
    };
    billingEvent.sideEffects = {
      emailsSent: ['welcome_email'],
      notificationsSent: ['subscription_created'],
    };
  }

  /**
   * Handle subscription updated event
   */
  private async handleSubscriptionUpdated(
    event: Stripe.Event,
    billingEvent: BillingEvent,
    transaction: any
  ): Promise<void> {
    const stripeSubscription = event.data.object as Stripe.Subscription;
    const previousAttributes = event.data.previous_attributes as any;
    
    // Find existing subscription
    const subscription = await Subscription.findOne({
      where: { customerId: stripeSubscription.customer as string },
      transaction,
    });

    if (!subscription) {
      throw new Error(`Subscription not found for customer: ${stripeSubscription.customer}`);
    }

    const oldMRR = subscription.getMRR();

    // Update subscription
    subscription.status = this.mapSubscriptionStatus(stripeSubscription.status);
    subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    
    if (previousAttributes.items) {
      // Plan changed
      subscription.previousPlanId = subscription.planId;
      subscription.planId = stripeSubscription.items.data[0].price.id;
      subscription.planName = stripeSubscription.items.data[0].price.nickname || 'Subscription';
      subscription.billingAmount = (stripeSubscription.items.data[0].price.unit_amount || 0) / 100;
      
      if (subscription.billingAmount > (previousAttributes.items.data[0].price.unit_amount || 0) / 100) {
        subscription.upgradedAt = new Date();
      } else {
        subscription.downgradedAt = new Date();
      }
    }

    await subscription.save({ transaction });

    const newMRR = subscription.getMRR();

    // Update billing event
    billingEvent.userId = subscription.userId;
    billingEvent.subscriptionId = subscription.id;
    billingEvent.eventData = {
      oldPlan: previousAttributes.items?.data[0].price.nickname,
      newPlan: subscription.planName,
      oldAmount: previousAttributes.items?.data[0].price.unit_amount / 100,
      newAmount: subscription.billingAmount,
    };
    billingEvent.impact = {
      mrrChange: newMRR - oldMRR,
    };
  }

  /**
   * Handle subscription deleted event
   */
  private async handleSubscriptionDeleted(
    event: Stripe.Event,
    billingEvent: BillingEvent,
    transaction: any
  ): Promise<void> {
    const stripeSubscription = event.data.object as Stripe.Subscription;
    
    // Find subscription
    const subscription = await Subscription.findOne({
      where: { customerId: stripeSubscription.customer as string },
      transaction,
    });

    if (!subscription) {
      throw new Error(`Subscription not found for customer: ${stripeSubscription.customer}`);
    }

    const mrrLost = subscription.getMRR();

    // Update subscription
    subscription.status = 'canceled';
    subscription.canceledAt = new Date();
    subscription.endDate = new Date();
    await subscription.save({ transaction });

    // Update billing event
    billingEvent.userId = subscription.userId;
    billingEvent.subscriptionId = subscription.id;
    billingEvent.eventData = {
      description: 'Subscription canceled',
    };
    billingEvent.impact = {
      mrrChange: -mrrLost,
    };
    billingEvent.sideEffects = {
      emailsSent: ['cancellation_confirmation'],
      notificationsSent: ['subscription_canceled'],
      actionsPerformed: ['winback_campaign_queued'],
    };
  }

  /**
   * Handle trial will end event
   */
  private async handleTrialWillEnd(
    event: Stripe.Event,
    billingEvent: BillingEvent,
    transaction: any
  ): Promise<void> {
    const stripeSubscription = event.data.object as Stripe.Subscription;
    
    // Find subscription
    const subscription = await Subscription.findOne({
      where: { customerId: stripeSubscription.customer as string },
      transaction,
    });

    if (!subscription) {
      throw new Error(`Subscription not found for customer: ${stripeSubscription.customer}`);
    }

    // Update billing event
    billingEvent.userId = subscription.userId;
    billingEvent.subscriptionId = subscription.id;
    billingEvent.eventData = {
      trialDays: subscription.trialDays,
      description: 'Trial ending soon',
    };
    billingEvent.sideEffects = {
      emailsSent: ['trial_ending_reminder'],
      notificationsSent: ['trial_ending'],
    };
  }

  /**
   * Handle invoice payment succeeded
   */
  private async handleInvoicePaymentSucceeded(
    event: Stripe.Event,
    billingEvent: BillingEvent,
    transaction: any
  ): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    
    // Update next billing date for subscription
    if (invoice.subscription) {
      const subscription = await Subscription.findOne({
        where: { customerId: invoice.customer as string },
        transaction,
      });

      if (subscription) {
        subscription.lastPaymentDate = new Date();
        subscription.lastPaymentAmount = invoice.amount_paid / 100;
        subscription.lastPaymentStatus = 'succeeded';
        subscription.nextBillingDate = new Date((invoice.period_end || 0) * 1000);
        await subscription.save({ transaction });
      }
    }

    billingEvent.eventData = {
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      invoiceNumber: invoice.number,
    };
    billingEvent.impact = {
      revenueImpact: invoice.amount_paid / 100,
    };
  }

  /**
   * Handle invoice payment failed
   */
  private async handleInvoicePaymentFailed(
    event: Stripe.Event,
    billingEvent: BillingEvent,
    transaction: any
  ): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    
    // Update subscription status
    if (invoice.subscription) {
      const subscription = await Subscription.findOne({
        where: { customerId: invoice.customer as string },
        transaction,
      });

      if (subscription) {
        subscription.status = 'past_due';
        subscription.lastPaymentStatus = 'failed';
        await subscription.save({ transaction });
      }
    }

    billingEvent.eventData = {
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      invoiceNumber: invoice.number,
      failureReason: 'Payment failed',
    };
    billingEvent.sideEffects = {
      emailsSent: ['payment_failed', 'update_payment_method'],
      actionsPerformed: ['dunning_process_started'],
    };
  }

  /**
   * Handle charge refunded
   */
  private async handleChargeRefunded(
    event: Stripe.Event,
    billingEvent: BillingEvent,
    transaction: any
  ): Promise<void> {
    const charge = event.data.object as Stripe.Charge;
    
    // Find original transaction
    const originalTransaction = await Transaction.findOne({
      where: { providerTransactionId: charge.payment_intent as string },
      transaction,
    });

    if (!originalTransaction) {
      throw new Error(`Original transaction not found for charge: ${charge.id}`);
    }

    // Create refund transaction
    const refundTransaction = await Transaction.create({
      userId: originalTransaction.userId,
      subscriptionId: originalTransaction.subscriptionId,
      type: 'refund',
      status: 'completed',
      amount: charge.amount_refunded / 100,
      currency: charge.currency.toUpperCase(),
      description: `Refund for ${originalTransaction.description}`,
      paymentMethod: originalTransaction.paymentMethod,
      paymentProvider: 'stripe',
      providerTransactionId: `${charge.id}_refund`,
      providerCustomerId: originalTransaction.providerCustomerId,
      originalTransactionId: originalTransaction.id,
      subtotal: charge.amount_refunded / 100,
      taxAmount: 0,
      taxRate: 0,
      refundedAmount: 0,
      requiresReview: false,
      metadata: {
        reason: charge.refunds.data[0]?.reason,
      },
      processedAt: new Date(),
    }, { transaction });

    // Update original transaction
    originalTransaction.refundedAmount += refundTransaction.amount;
    originalTransaction.refundedAt = new Date();
    originalTransaction.refundReason = charge.refunds.data[0]?.reason || 'Customer requested';
    await originalTransaction.save({ transaction });

    billingEvent.userId = refundTransaction.userId;
    billingEvent.transactionId = refundTransaction.id;
    billingEvent.eventData = {
      amount: refundTransaction.amount,
      currency: refundTransaction.currency,
      description: refundTransaction.description,
    };
    billingEvent.impact = {
      revenueImpact: -refundTransaction.amount,
    };
  }

  /**
   * Handle dispute created
   */
  private async handleDisputeCreated(
    event: Stripe.Event,
    billingEvent: BillingEvent,
    transaction: any
  ): Promise<void> {
    const dispute = event.data.object as Stripe.Dispute;
    
    // Find transaction
    const txn = await Transaction.findOne({
      where: { providerTransactionId: dispute.payment_intent as string },
      transaction,
    });

    if (txn) {
      txn.requiresReview = true;
      txn.metadata = {
        ...txn.metadata,
        dispute: {
          id: dispute.id,
          amount: dispute.amount / 100,
          reason: dispute.reason,
          status: dispute.status,
        },
      };
      await txn.save({ transaction });

      billingEvent.userId = txn.userId;
      billingEvent.transactionId = txn.id;
    }

    billingEvent.eventData = {
      amount: dispute.amount / 100,
      currency: dispute.currency,
      chargebackReason: dispute.reason,
      disputeAmount: dispute.amount / 100,
    };
    billingEvent.sideEffects = {
      emailsSent: ['dispute_notification'],
      actionsPerformed: ['dispute_evidence_requested'],
    };
  }

  /**
   * Map Stripe event type to billing event type
   */
  private mapStripeEventType(stripeType: string): BillingEvent['eventType'] {
    const mapping: Record<string, BillingEvent['eventType']> = {
      'payment_intent.succeeded': 'payment_succeeded',
      'payment_intent.payment_failed': 'payment_failed',
      'customer.subscription.created': 'subscription_created',
      'customer.subscription.updated': 'subscription_updated',
      'customer.subscription.deleted': 'subscription_cancelled',
      'customer.subscription.trial_will_end': 'trial_ended',
      'invoice.payment_succeeded': 'invoice_paid',
      'invoice.payment_failed': 'invoice_failed',
      'charge.refunded': 'payment_refunded',
      'charge.dispute.created': 'chargeback_created',
    };

    return mapping[stripeType] || 'payment_succeeded';
  }

  /**
   * Map payment method
   */
  private mapPaymentMethod(method: string): Transaction['paymentMethod'] {
    const mapping: Record<string, Transaction['paymentMethod']> = {
      'card': 'card',
      'bank_transfer': 'bank_transfer',
      'paypal': 'paypal',
    };

    return mapping[method] || 'other';
  }

  /**
   * Map subscription status
   */
  private mapSubscriptionStatus(status: string): Subscription['status'] {
    const mapping: Record<string, Subscription['status']> = {
      'trialing': 'trialing',
      'active': 'active',
      'past_due': 'past_due',
      'canceled': 'canceled',
      'unpaid': 'unpaid',
      'paused': 'paused',
    };

    return mapping[status] || 'active';
  }

  /**
   * Map billing interval
   */
  private mapBillingInterval(interval?: string): Subscription['billingInterval'] {
    const mapping: Record<string, Subscription['billingInterval']> = {
      'month': 'monthly',
      'quarter': 'quarterly',
      'year': 'yearly',
    };

    return mapping[interval || 'month'] || 'monthly';
  }

  /**
   * Map plan type from metadata
   */
  private mapPlanType(metadata: any): Subscription['planType'] {
    return metadata?.planType || 'basic';
  }
}

export default StripeWebhookService; 