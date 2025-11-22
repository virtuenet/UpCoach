import Stripe from 'stripe';

import { config } from '../../config/environment';
import { logger } from '../../utils/logger';
import { User } from '../../models/User';

interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency: string;
  customer?: string;
  payment_method?: string;
  metadata?: Record<string, string>;
  confirm?: boolean;
  automatic_payment_methods?: {
    enabled: boolean;
  };
}

interface CreateCustomerParams {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
}

interface CreateSubscriptionParams {
  customer: string;
  price?: string;
  items?: Array<{
    price?: string;
    price_data?: {
      currency: string;
      product_data: {
        name: string;
        metadata?: Record<string, string>;
      };
      recurring: {
        interval: 'day' | 'week' | 'month' | 'year';
        interval_count?: number;
      };
      unit_amount: number;
    };
    quantity?: number;
  }>;
  payment_method?: string;
  payment_behavior?: 'allow_incomplete' | 'default_incomplete' | 'error_if_incomplete' | 'pending_if_incomplete';
  expand?: string[];
  trial_period_days?: number;
  metadata?: Record<string, string>;
}

export class StripeService {
  private stripe: Stripe;

  constructor() {
    if (!config.stripe.secretKey) {
      throw new Error('Stripe secret key not configured');
    }

    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency,
        customer: params.customer,
        payment_method: params.payment_method,
        metadata: params.metadata,
        confirm: params.confirm,
        automatic_payment_methods: params.automatic_payment_methods || {
          enabled: true,
        },
      });

      logger.info(`Payment intent created: ${paymentIntent.id}`, {
        amount: params.amount,
        currency: params.currency,
        customer: params.customer,
        status: paymentIntent.status,
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to create payment intent:', error);
      throw new Error(`Payment intent creation failed: ${error.message}`);
    }
  }

  /**
   * Retrieve a payment intent
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      logger.error(`Failed to retrieve payment intent ${paymentIntentId}:`, error);
      throw new Error(`Payment intent retrieval failed: ${error.message}`);
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    params?: {
      payment_method?: string;
      return_url?: string;
    }
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.confirm(paymentIntentId, params);
    } catch (error) {
      logger.error(`Failed to confirm payment intent ${paymentIntentId}:`, error);
      throw new Error(`Payment intent confirmation failed: ${error.message}`);
    }
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);
      
      logger.info(`Payment intent canceled: ${paymentIntentId}`);
      
      return paymentIntent;
    } catch (error) {
      logger.error(`Failed to cancel payment intent ${paymentIntentId}:`, error);
      throw new Error(`Payment intent cancellation failed: ${error.message}`);
    }
  }

  /**
   * Create a Stripe customer
   */
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        phone: params.phone,
        metadata: params.metadata,
      });

      logger.info(`Stripe customer created: ${customer.id}`, {
        email: params.email,
        name: params.name,
      });

      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
      throw new Error(`Customer creation failed: ${error.message}`);
    }
  }

  /**
   * Retrieve a Stripe customer
   */
  async retrieveCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }

      return customer as Stripe.Customer;
    } catch (error) {
      logger.error(`Failed to retrieve customer ${customerId}:`, error);
      throw new Error(`Customer retrieval failed: ${error.message}`);
    }
  }

  /**
   * Update a Stripe customer
   */
  async updateCustomer(
    customerId: string,
    params: Partial<CreateCustomerParams>
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, {
        email: params.email,
        name: params.name,
        phone: params.phone,
        metadata: params.metadata,
      });

      logger.info(`Stripe customer updated: ${customerId}`);

      return customer;
    } catch (error) {
      logger.error(`Failed to update customer ${customerId}:`, error);
      throw new Error(`Customer update failed: ${error.message}`);
    }
  }

  /**
   * Delete a Stripe customer
   */
  async deleteCustomer(customerId: string): Promise<Stripe.DeletedCustomer> {
    try {
      const deletedCustomer = await this.stripe.customers.del(customerId);
      
      logger.info(`Stripe customer deleted: ${customerId}`);
      
      return deletedCustomer;
    } catch (error) {
      logger.error(`Failed to delete customer ${customerId}:`, error);
      throw new Error(`Customer deletion failed: ${error.message}`);
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<Stripe.Subscription> {
    try {
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: params.customer,
        payment_behavior: params.payment_behavior || 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: params.expand || ['latest_invoice.payment_intent'],
        trial_period_days: params.trial_period_days,
        metadata: params.metadata,
      };

      // Handle items - either with price ID or price_data
      if (params.items) {
        subscriptionParams.items = params.items as unknown;
      } else if (params.price) {
        subscriptionParams.items = [{ price: params.price }];
      } else {
        throw new Error('Either price or items must be provided');
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionParams);

      logger.info(`Subscription created: ${subscription.id}`, {
        customer: params.customer,
        status: subscription.status,
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      throw new Error(`Subscription creation failed: ${error.message}`);
    }
  }

  /**
   * Retrieve a subscription
   */
  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice.payment_intent'],
      });
    } catch (error) {
      logger.error(`Failed to retrieve subscription ${subscriptionId}:`, error);
      throw new Error(`Subscription retrieval failed: ${error.message}`);
    }
  }

  /**
   * Update a subscription
   */
  async updateSubscription(
    subscriptionId: string,
    params: Partial<Omit<CreateSubscriptionParams, 'customer'>> & {
      proration_behavior?: 'create_prorations' | 'none' | 'always_invoice';
    }
  ): Promise<Stripe.Subscription> {
    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {};

      if (params.items) {
        updateParams.items = params.items as unknown;
      } else if (params.price) {
        // Get current subscription to update the price
        const currentSubscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        updateParams.items = [
          {
            id: currentSubscription.items.data[0].id,
            price: params.price,
          },
        ];
      }

      if (params.metadata) {
        updateParams.metadata = params.metadata;
      }

      if (params.proration_behavior) {
        updateParams.proration_behavior = params.proration_behavior;
      }

      const subscription = await this.stripe.subscriptions.update(subscriptionId, updateParams);

      logger.info(`Subscription updated: ${subscriptionId}`);

      return subscription;
    } catch (error) {
      logger.error(`Failed to update subscription ${subscriptionId}:`, error);
      throw new Error(`Subscription update failed: ${error.message}`);
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      
      logger.info(`Subscription canceled: ${subscriptionId}`);
      
      return subscription;
    } catch (error) {
      logger.error(`Failed to cancel subscription ${subscriptionId}:`, error);
      throw new Error(`Subscription cancellation failed: ${error.message}`);
    }
  }

  /**
   * Create a refund
   */
  async createRefund(params: {
    payment_intent: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, string>;
  }): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: params.payment_intent,
        amount: params.amount,
        reason: params.reason,
        metadata: params.metadata,
      });

      logger.info(`Refund created: ${refund.id}`, {
        payment_intent: params.payment_intent,
        amount: params.amount,
        reason: params.reason,
      });

      return refund;
    } catch (error) {
      logger.error('Failed to create refund:', error);
      throw new Error(`Refund creation failed: ${error.message}`);
    }
  }

  /**
   * Create a Setup Intent for saving payment methods
   */
  async createSetupIntent(params: {
    customer: string;
    payment_method_types?: string[];
    usage?: 'on_session' | 'off_session';
  }): Promise<Stripe.SetupIntent> {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: params.customer,
        payment_method_types: params.payment_method_types || ['card'],
        usage: params.usage || 'off_session',
      });

      logger.info(`Setup intent created: ${setupIntent.id}`, {
        customer: params.customer,
      });

      return setupIntent;
    } catch (error) {
      logger.error('Failed to create setup intent:', error);
      throw new Error(`Setup intent creation failed: ${error.message}`);
    }
  }

  /**
   * List customer payment methods
   */
  async listCustomerPaymentMethods(
    customerId: string,
    type: 'card' | 'us_bank_account' | 'sepa_debit' = 'card'
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type,
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error(`Failed to list payment methods for customer ${customerId}:`, error);
      throw new Error(`Payment methods retrieval failed: ${error.message}`);
    }
  }

  /**
   * Detach a payment method from a customer
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);
      
      logger.info(`Payment method detached: ${paymentMethodId}`);
      
      return paymentMethod;
    } catch (error) {
      logger.error(`Failed to detach payment method ${paymentMethodId}:`, error);
      throw new Error(`Payment method detachment failed: ${error.message}`);
    }
  }

  /**
   * Get or create Stripe customer for a user
   */
  async getOrCreateCustomer(userId: number): Promise<string> {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Check if user already has a Stripe customer ID
      if ((user as unknown).stripeCustomerId) {
        // Verify the customer still exists in Stripe
        try {
          await this.retrieveCustomer((user as unknown).stripeCustomerId);
          return (user as unknown).stripeCustomerId;
        } catch (error) {
          logger.warn(`Stripe customer not found: ${(user as unknown).stripeCustomerId}. Creating new customer.`);
          // Customer doesn't exist, create a new one
        }
      }

      // Create new Stripe customer
      const customer = await this.createCustomer({
        email: user.email,
        name: user.name,
        metadata: {
          userId: userId.toString(),
        },
      });

      // Save customer ID to user
      (user as unknown).stripeCustomerId = customer.id;
      await user.save();

      return customer.id;
    } catch (error) {
      logger.error(`Failed to get or create customer for user ${userId}:`, error);
      throw new Error(`Customer creation failed: ${error.message}`);
    }
  }

  /**
   * Construct webhook event from request
   */
  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    try {
      if (!config.stripe.webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
    } catch (error) {
      logger.error('Failed to construct webhook event:', error);
      throw new Error(`Webhook event construction failed: ${error.message}`);
    }
  }

  /**
   * Get Stripe instance for advanced operations
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}

// Export singleton instance
export const stripeService = new StripeService();