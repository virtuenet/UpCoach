import Stripe from 'stripe';
import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { UsageTrackingService } from './UsageTrackingService';

/**
 * Tenant Billing Service
 *
 * Manages Stripe subscriptions for enterprise tenants:
 * - Subscription creation and management
 * - Usage-based billing (metered pricing)
 * - Invoice generation and payment
 * - Overage billing automation
 * - Payment method management
 * - Subscription lifecycle (trial, active, canceled)
 *
 * Stripe Architecture:
 * - 1 Stripe Customer per Tenant
 * - Multiple Subscriptions per Customer (base + add-ons)
 * - Usage Records for metered billing
 */

export interface TenantSubscription {
  tenantId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planName: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  metadata?: Record<string, string>;
}

export interface BillingPlan {
  id: string;
  name: string;
  stripePriceId: string;
  basePrice: number;
  currency: string;
  interval: 'month' | 'year';
  features: {
    apiCalls: number;
    storageGB: number;
    aiCredits: number;
    activeUsers: number;
  };
}

export class TenantBillingService {
  private db: Pool;
  private stripe: Stripe;
  private usageService: UsageTrackingService;

  constructor(db: Pool, usageService: UsageTrackingService) {
    this.db = db;
    this.usageService = usageService;

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-11-20.acacia',
    });
  }

  /**
   * Create Stripe customer for new tenant
   */
  async createCustomer(
    tenantId: string,
    email: string,
    companyName: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name: companyName,
        metadata: {
          tenantId,
          ...metadata,
        },
      });

      // Save customer ID to database
      await this.saveCustomer(tenantId, customer.id);

      logger.info('Stripe customer created', {
        tenantId,
        stripeCustomerId: customer.id,
      });

      return customer.id;
    } catch (error) {
      logger.error('Failed to create Stripe customer', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create subscription for tenant
   */
  async createSubscription(
    tenantId: string,
    planId: string,
    trialDays?: number
  ): Promise<TenantSubscription> {
    try {
      // Get or create Stripe customer
      let stripeCustomerId = await this.getStripeCustomerId(tenantId);

      if (!stripeCustomerId) {
        throw new Error('Stripe customer not found for tenant');
      }

      // Get plan details
      const plan = await this.getBillingPlan(planId);

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [
          {
            price: plan.stripePriceId,
          },
        ],
        trial_period_days: trialDays,
        metadata: {
          tenantId,
          planName: plan.name,
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Save subscription to database
      const tenantSub = await this.saveSubscription(tenantId, subscription, plan);

      // Set usage limits based on plan
      await this.usageService.setUsageLimits(tenantId, plan.features);

      logger.info('Subscription created', {
        tenantId,
        subscriptionId: subscription.id,
        planName: plan.name,
      });

      return tenantSub;
    } catch (error) {
      logger.error('Failed to create subscription', {
        tenantId,
        planId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Report usage to Stripe for metered billing
   */
  async reportUsage(
    tenantId: string,
    metricName: string,
    quantity: number
  ): Promise<void> {
    try {
      const subscription = await this.getActiveSubscription(tenantId);

      if (!subscription) {
        logger.warn('No active subscription found for usage reporting', { tenantId });
        return;
      }

      // Find subscription item for metered usage
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      const meteredItem = stripeSubscription.items.data.find(
        (item) => item.price.recurring?.usage_type === 'metered'
      );

      if (!meteredItem) {
        logger.debug('No metered pricing item found', { tenantId });
        return;
      }

      // Create usage record
      await this.stripe.subscriptionItems.createUsageRecord(meteredItem.id, {
        quantity,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      });

      logger.debug('Usage reported to Stripe', {
        tenantId,
        metricName,
        quantity,
      });
    } catch (error) {
      logger.error('Failed to report usage to Stripe', {
        tenantId,
        metricName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(tenantId: string, newPlanId: string): Promise<TenantSubscription> {
    try {
      const currentSub = await this.getActiveSubscription(tenantId);

      if (!currentSub) {
        throw new Error('No active subscription found');
      }

      const newPlan = await this.getBillingPlan(newPlanId);

      // Update subscription
      const updatedSubscription = await this.stripe.subscriptions.update(
        currentSub.stripeSubscriptionId,
        {
          items: [
            {
              id: (await this.stripe.subscriptions.retrieve(currentSub.stripeSubscriptionId))
                .items.data[0].id,
              price: newPlan.stripePriceId,
            },
          ],
          proration_behavior: 'create_prorations',
        }
      );

      // Update database
      const tenantSub = await this.saveSubscription(tenantId, updatedSubscription, newPlan);

      // Update usage limits
      await this.usageService.setUsageLimits(tenantId, newPlan.features);

      logger.info('Subscription updated', {
        tenantId,
        oldPlan: currentSub.planName,
        newPlan: newPlan.name,
      });

      return tenantSub;
    } catch (error) {
      logger.error('Failed to update subscription', {
        tenantId,
        newPlanId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    tenantId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<void> {
    try {
      const subscription = await this.getActiveSubscription(tenantId);

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      if (cancelAtPeriodEnd) {
        // Cancel at end of billing period
        await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        // Cancel immediately
        await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      }

      // Update database
      const updateQuery = `
        UPDATE tenant_subscriptions
        SET status = $1, cancel_at_period_end = $2, updated_at = NOW()
        WHERE tenant_id = $3 AND stripe_subscription_id = $4
      `;
      await this.db.query(updateQuery, [
        cancelAtPeriodEnd ? subscription.status : 'canceled',
        cancelAtPeriodEnd,
        tenantId,
        subscription.stripeSubscriptionId,
      ]);

      logger.info('Subscription canceled', {
        tenantId,
        subscriptionId: subscription.stripeSubscriptionId,
        cancelAtPeriodEnd,
      });
    } catch (error) {
      logger.error('Failed to cancel subscription', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get upcoming invoice for tenant
   */
  async getUpcomingInvoice(tenantId: string): Promise<{
    amount: number;
    currency: string;
    periodStart: Date;
    periodEnd: Date;
    lines: Array<{ description: string; amount: number }>;
  } | null> {
    try {
      const stripeCustomerId = await this.getStripeCustomerId(tenantId);

      if (!stripeCustomerId) {
        return null;
      }

      const upcomingInvoice = await this.stripe.invoices.retrieveUpcoming({
        customer: stripeCustomerId,
      });

      return {
        amount: upcomingInvoice.amount_due,
        currency: upcomingInvoice.currency,
        periodStart: new Date(upcomingInvoice.period_start * 1000),
        periodEnd: new Date(upcomingInvoice.period_end * 1000),
        lines: upcomingInvoice.lines.data.map((line) => ({
          description: line.description || '',
          amount: line.amount,
        })),
      };
    } catch (error) {
      logger.error('Failed to retrieve upcoming invoice', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(
    tenantId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      const stripeCustomerId = await this.getStripeCustomerId(tenantId);

      if (!stripeCustomerId) {
        throw new Error('Stripe customer not found');
      }

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });

      // Set as default payment method
      await this.stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      logger.info('Payment method added', { tenantId, paymentMethodId });
    } catch (error) {
      logger.error('Failed to add payment method', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        logger.debug('Unhandled webhook event', { eventType: event.type });
    }
  }

  /**
   * Get active subscription for tenant
   */
  private async getActiveSubscription(tenantId: string): Promise<TenantSubscription | null> {
    const query = `
      SELECT * FROM tenant_subscriptions
      WHERE tenant_id = $1 AND status IN ('trialing', 'active')
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await this.db.query(query, [tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToSubscription(result.rows[0]);
  }

  /**
   * Get Stripe customer ID for tenant
   */
  private async getStripeCustomerId(tenantId: string): Promise<string | null> {
    const query = `SELECT stripe_customer_id FROM tenant_stripe_customers WHERE tenant_id = $1`;
    const result = await this.db.query(query, [tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].stripe_customer_id;
  }

  /**
   * Save Stripe customer to database
   */
  private async saveCustomer(tenantId: string, stripeCustomerId: string): Promise<void> {
    const query = `
      INSERT INTO tenant_stripe_customers (tenant_id, stripe_customer_id, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (tenant_id) DO UPDATE
      SET stripe_customer_id = $2, updated_at = NOW()
    `;
    await this.db.query(query, [tenantId, stripeCustomerId]);
  }

  /**
   * Save subscription to database
   */
  private async saveSubscription(
    tenantId: string,
    subscription: Stripe.Subscription,
    plan: BillingPlan
  ): Promise<TenantSubscription> {
    const query = `
      INSERT INTO tenant_subscriptions (
        tenant_id, stripe_subscription_id, stripe_customer_id,
        plan_name, status, current_period_start, current_period_end,
        cancel_at_period_end, trial_end, metadata, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      ON CONFLICT (stripe_subscription_id) DO UPDATE
      SET status = $5, current_period_start = $6, current_period_end = $7,
          cancel_at_period_end = $8, trial_end = $9, updated_at = NOW()
      RETURNING *
    `;

    const result = await this.db.query(query, [
      tenantId,
      subscription.id,
      subscription.customer as string,
      plan.name,
      subscription.status,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.cancel_at_period_end,
      subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      JSON.stringify(subscription.metadata),
    ]);

    return this.mapToSubscription(result.rows[0]);
  }

  /**
   * Get billing plan
   */
  private async getBillingPlan(planId: string): Promise<BillingPlan> {
    const query = `SELECT * FROM billing_plans WHERE id = $1`;
    const result = await this.db.query(query, [planId]);

    if (result.rows.length === 0) {
      throw new Error(`Billing plan not found: ${planId}`);
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      stripePriceId: row.stripe_price_id,
      basePrice: row.base_price,
      currency: row.currency,
      interval: row.interval,
      features: JSON.parse(row.features),
    };
  }

  /**
   * Handle payment succeeded webhook
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    logger.info('Payment succeeded', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      amount: invoice.amount_paid,
    });

    // TODO: Send invoice receipt email
  }

  /**
   * Handle payment failed webhook
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    logger.error('Payment failed', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      amount: invoice.amount_due,
    });

    // TODO: Send payment failure notification
    // TODO: Update subscription status to 'past_due'
  }

  /**
   * Handle subscription updated webhook
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata.tenantId;

    if (!tenantId) {
      logger.warn('Subscription updated without tenantId metadata', {
        subscriptionId: subscription.id,
      });
      return;
    }

    // Reload plan details and save
    const plan = await this.getBillingPlan(subscription.metadata.planId || '');
    await this.saveSubscription(tenantId, subscription, plan);
  }

  /**
   * Handle subscription deleted webhook
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const updateQuery = `
      UPDATE tenant_subscriptions
      SET status = 'canceled', updated_at = NOW()
      WHERE stripe_subscription_id = $1
    `;
    await this.db.query(updateQuery, [subscription.id]);

    logger.info('Subscription deleted', { subscriptionId: subscription.id });
  }

  /**
   * Map database row to TenantSubscription
   */
  private mapToSubscription(row: any): TenantSubscription {
    return {
      tenantId: row.tenant_id,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      planName: row.plan_name,
      status: row.status,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      cancelAtPeriodEnd: row.cancel_at_period_end,
      trialEnd: row.trial_end,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    };
  }
}
