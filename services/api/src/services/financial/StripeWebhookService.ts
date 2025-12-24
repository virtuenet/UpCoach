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
import { flashERPService } from '../erp/FlashERPService';
import { config } from '../../config/environment';

// Notification types for financial events
interface NotificationData {
  userId: number;
  type: 'email' | 'in_app' | 'both';
  template: string;
  subject: string;
  data: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Financial notification service
class FinancialNotificationService {
  async sendNotification(notificationData: NotificationData): Promise<void> {
    try {
      // Create in-app notification
      if (notificationData.type === 'in_app' || notificationData.type === 'both') {
        await this.createInAppNotification(notificationData);
      }

      // Send email notification
      if (notificationData.type === 'email' || notificationData.type === 'both') {
        await this.sendEmailNotification(notificationData);
      }

      logger.info('Financial notification sent', {
        userId: notificationData.userId,
        template: notificationData.template,
        type: notificationData.type,
      });
    } catch (error) {
      logger.error('Failed to send financial notification', {
        error,
        userId: notificationData.userId,
        template: notificationData.template,
      });
    }
  }

  private async createInAppNotification(notificationData: NotificationData): Promise<void> {
    // Insert notification into database
    const query = `
      INSERT INTO notifications (user_id, type, title, message, data, priority, created_at, is_read)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)
    `;

    const values = [
      notificationData.userId,
      'financial',
      notificationData.subject,
      this.generateMessage(notificationData.template, notificationData.data),
      JSON.stringify(notificationData.data),
      notificationData.priority,
    ];

    // Since we're using Sequelize, we'll use raw query for now
    // In a real implementation, this would use the Notification model
    try {
      await require('../../models').sequelize.query(query, {
        replacements: values,
        type: require('sequelize').QueryTypes.INSERT,
      });
    } catch (error) {
      logger.error('Failed to create in-app notification', { error, userId: notificationData.userId });
    }
  }

  private async sendEmailNotification(notificationData: NotificationData): Promise<void> {
    try {
      // Get user email
      const user = await User.findByPk(notificationData.userId);
      if (!user) {
        logger.error('User not found for email notification', { userId: notificationData.userId });
        return;
      }

      // For now, we'll log the email that would be sent
      // In production, this would integrate with your email service (SendGrid, AWS SES, etc.)
      const emailContent = {
        to: user.email,
        subject: notificationData.subject,
        template: notificationData.template,
        data: notificationData.data,
        priority: notificationData.priority,
      };

      // Log email for development/staging
      if (process.env.NODE_ENV !== 'production') {
        logger.info('Email notification (development mode)', emailContent);
      } else {
        // In production, send actual email
        // await emailService.sendTemplateEmail(emailContent);
        logger.info('Email notification sent', {
          userId: notificationData.userId,
          template: notificationData.template,
          to: user.email,
        });
      }
    } catch (error) {
      logger.error('Failed to send email notification', {
        error,
        userId: notificationData.userId,
      });
    }
  }

  private generateMessage(template: string, data: Record<string, any>): string {
    const messages: Record<string, string> = {
      payment_success: `Your payment of ${data.amount} ${data.currency?.toUpperCase()} has been processed successfully.`,
      payment_failed: `Your payment of ${data.amount} ${data.currency?.toUpperCase()} failed. Please update your payment method.`,
      subscription_created: `Welcome! Your ${data.plan} subscription has been activated.`,
      subscription_updated: `Your subscription has been updated from ${data.previousPlan} to ${data.newPlan}.`,
      subscription_canceled: `Your ${data.plan} subscription has been canceled. You'll continue to have access until ${data.periodEnd}.`,
      trial_ending: `Your trial period ends in ${data.daysRemaining} days. Update your payment method to continue service.`,
      invoice_payment_success: `Your subscription payment of ${data.amount} ${data.currency?.toUpperCase()} has been processed.`,
      invoice_payment_failed: `Your subscription payment failed. Please update your payment method to avoid service interruption.`,
      refund_issued: `A refund of ${data.amount} ${data.currency?.toUpperCase()} has been issued to your account.`,
      dispute_created: `A dispute has been created for your payment. Our team will review and contact you if needed.`,
    };

    return messages[template] || 'Financial event notification';
  }
}

const notificationService = new FinancialNotificationService();

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
    const transaction = await Transaction.create({
      userId: user.id,
      stripeTransactionId: paymentIntent.id,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.COMPLETED,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      paymentMethod: PaymentMethod.CARD,
      description: paymentIntent.description || 'Payment',
    });

    // Sync to FlashERP (non-blocking)
    if (config.flashERP.enabled) {
      flashERPService.syncTransaction(transaction.id).catch((err) => {
        logger.error('FlashERP transaction sync failed (non-blocking)', {
          transactionId: transaction.id,
          error: err.message,
        });
      });
    }

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

    // Send success notification to user
    await notificationService.sendNotification({
      userId: user.id,
      type: 'both',
      template: 'payment_success',
      subject: 'Payment successful',
      data: {
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        description: paymentIntent.description || 'Payment',
      },
      priority: 'medium',
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

    // Send failure notification to user
    await notificationService.sendNotification({
      userId: user.id,
      type: 'both',
      template: 'payment_failed',
      subject: 'Payment failed',
      data: {
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        reason: paymentIntent.last_payment_error?.message || 'Unknown error',
      },
      priority: 'high',
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
      currentPeriodStart: new Date((stripeSubscription as unknown).current_period_start * 1000),
      currentPeriodEnd: new Date((stripeSubscription as unknown).current_period_end * 1000),
      trialStartDate: stripeSubscription.trial_start
        ? new Date(stripeSubscription.trial_start * 1000)
        : undefined,
      trialEndDate: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : undefined,
    });

    // Sync to FlashERP (non-blocking)
    if (config.flashERP.enabled) {
      flashERPService.syncSubscription(subscription.id).catch((err) => {
        logger.error('FlashERP subscription sync failed (non-blocking)', {
          subscriptionId: subscription.id,
          error: err.message,
        });
      });
    }

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

    // Send subscription creation notification
    await notificationService.sendNotification({
      userId: user.id,
      type: 'both',
      template: 'subscription_created',
      subject: 'Subscription activated',
      data: {
        plan: subscription.plan,
        amount: subscription.amount,
        currency: subscription.currency,
        periodStart: subscription.currentPeriodStart?.toLocaleDateString(),
        periodEnd: subscription.currentPeriodEnd?.toLocaleDateString(),
      },
      priority: 'medium',
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
    const newPlan = this.mapStripePlanToInternal(
      stripeSubscription.items.data[0].price.lookup_key!
    );

    await subscription.update({
      plan: newPlan,
      status: this.mapStripeStatusToInternal(stripeSubscription.status),
      amount: stripeSubscription.items.data[0].price.unit_amount! / 100,
      currentPeriodStart: new Date((stripeSubscription as unknown).current_period_start * 1000),
      currentPeriodEnd: new Date((stripeSubscription as unknown).current_period_end * 1000),
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

    // Send subscription update notification
    await notificationService.sendNotification({
      userId: subscription.userId,
      type: 'both',
      template: 'subscription_updated',
      subject: 'Subscription updated',
      data: {
        previousPlan: previousPlan,
        newPlan: newPlan,
        amount: stripeSubscription.items.data[0].price.unit_amount! / 100,
        currency: stripeSubscription.currency,
      },
      priority: 'medium',
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

    // Send subscription cancellation notification
    await notificationService.sendNotification({
      userId: subscription.userId,
      type: 'both',
      template: 'subscription_canceled',
      subject: 'Subscription canceled',
      data: {
        plan: subscription.plan,
        periodEnd: subscription.currentPeriodEnd?.toLocaleDateString(),
        canceledAt: new Date().toLocaleDateString(),
      },
      priority: 'high',
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

    // Send notification to user about trial ending
    await notificationService.sendNotification({
      userId: subscription.userId,
      type: 'both',
      template: 'trial_ending',
      subject: 'Your trial is ending soon',
      data: {
        plan: subscription.plan,
        trialEndDate: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000).toLocaleDateString() : 'soon',
        daysRemaining: stripeSubscription.trial_end ? Math.ceil((stripeSubscription.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
      },
      priority: 'high',
    });
  }

  /**
   * Handle invoice payment succeeded
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: (invoice as unknown).subscription as string },
    });

    if (!subscription) return;

    // Update subscription payment date
    // Update subscription if needed
    await subscription.save();

    // Create transaction
    await Transaction.create({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      stripeTransactionId: (invoice as unknown).charge as string,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.COMPLETED,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      paymentMethod: PaymentMethod.CARD,
      description: 'Subscription payment',
      stripeInvoiceId: invoice.id,
    });

    // Send invoice payment success notification
    await notificationService.sendNotification({
      userId: subscription.userId,
      type: 'in_app', // Less intrusive for recurring payments
      template: 'invoice_payment_success',
      subject: 'Subscription payment processed',
      data: {
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        plan: subscription.plan,
        nextPaymentDate: subscription.currentPeriodEnd?.toLocaleDateString(),
      },
      priority: 'low',
    });
  }

  /**
   * Handle invoice payment failed
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: (invoice as unknown).subscription as string },
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

    // Send invoice payment failure notification
    await notificationService.sendNotification({
      userId: subscription.userId,
      type: 'both',
      template: 'invoice_payment_failed',
      subject: 'Subscription payment failed',
      data: {
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        plan: subscription.plan,
        nextAttempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString() : 'Unknown',
      },
      priority: 'critical',
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

    // Send refund notification
    await notificationService.sendNotification({
      userId: transaction.userId,
      type: 'both',
      template: 'refund_issued',
      subject: 'Refund issued',
      data: {
        amount: charge.amount_refunded / 100,
        currency: charge.currency,
        originalTransactionId: transaction.stripeTransactionId,
        refundReason: charge.refunds?.data[0]?.reason || 'requested_by_customer',
      },
      priority: 'medium',
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

    // Send dispute notification (high priority for manual review)
    await notificationService.sendNotification({
      userId: transaction.userId,
      type: 'both',
      template: 'dispute_created',
      subject: 'Payment dispute created',
      data: {
        amount: dispute.amount / 100,
        currency: dispute.currency,
        reason: dispute.reason,
        transactionId: transaction.stripeTransactionId,
        disputeId: dispute.id,
      },
      priority: 'critical',
    });

    // Also notify internal team for disputes
    logger.warn('Payment dispute created - requires manual review', {
      userId: transaction.userId,
      disputeId: dispute.id,
      amount: dispute.amount / 100,
      reason: dispute.reason,
    });
  }

  /**
   * Record billing event for audit
   */
  private async recordBillingEvent(event: Stripe.Event): Promise<void> {
    // This is handled in individual event handlers
    logger.info(`Processed Stripe webhook: ${event.type}`, {
      eventId: event.id,
      eventType: event.type,
      created: event.created,
      livemode: event.livemode,
    });
  }

  /**
   * Map Stripe plan to internal plan
   */
  private mapStripePlanToInternal(stripePlan: string): unknown {
    const planMap: Record<string, any> = {
      basic_monthly: 'basic',
      pro_monthly: 'pro',
      team_monthly: 'team',
      enterprise_monthly: 'enterprise',
    };

    return planMap[stripePlan] || 'free';
  }

  /**
   * Map Stripe status to internal status
   */
  private mapStripeStatusToInternal(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
      trialing: SubscriptionStatus.TRIALING,
      paused: SubscriptionStatus.PAUSED,
    };

    return statusMap[stripeStatus] || SubscriptionStatus.INCOMPLETE;
  }
}

export const stripeWebhookService = new StripeWebhookService();
