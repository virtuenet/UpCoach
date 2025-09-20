"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeService = exports.StripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const environment_1 = require("../../config/environment");
const logger_1 = require("../../utils/logger");
const User_1 = require("../../models/User");
class StripeService {
    stripe;
    constructor() {
        if (!environment_1.config.stripe.secretKey) {
            throw new Error('Stripe secret key not configured');
        }
        this.stripe = new stripe_1.default(environment_1.config.stripe.secretKey, {
            apiVersion: '2025-08-27.basil',
            typescript: true,
        });
    }
    async createPaymentIntent(params) {
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
            logger_1.logger.info(`Payment intent created: ${paymentIntent.id}`, {
                amount: params.amount,
                currency: params.currency,
                customer: params.customer,
                status: paymentIntent.status,
            });
            return paymentIntent;
        }
        catch (error) {
            logger_1.logger.error('Failed to create payment intent:', error);
            throw new Error(`Payment intent creation failed: ${error.message}`);
        }
    }
    async retrievePaymentIntent(paymentIntentId) {
        try {
            return await this.stripe.paymentIntents.retrieve(paymentIntentId);
        }
        catch (error) {
            logger_1.logger.error(`Failed to retrieve payment intent ${paymentIntentId}:`, error);
            throw new Error(`Payment intent retrieval failed: ${error.message}`);
        }
    }
    async confirmPaymentIntent(paymentIntentId, params) {
        try {
            return await this.stripe.paymentIntents.confirm(paymentIntentId, params);
        }
        catch (error) {
            logger_1.logger.error(`Failed to confirm payment intent ${paymentIntentId}:`, error);
            throw new Error(`Payment intent confirmation failed: ${error.message}`);
        }
    }
    async cancelPaymentIntent(paymentIntentId) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);
            logger_1.logger.info(`Payment intent canceled: ${paymentIntentId}`);
            return paymentIntent;
        }
        catch (error) {
            logger_1.logger.error(`Failed to cancel payment intent ${paymentIntentId}:`, error);
            throw new Error(`Payment intent cancellation failed: ${error.message}`);
        }
    }
    async createCustomer(params) {
        try {
            const customer = await this.stripe.customers.create({
                email: params.email,
                name: params.name,
                phone: params.phone,
                metadata: params.metadata,
            });
            logger_1.logger.info(`Stripe customer created: ${customer.id}`, {
                email: params.email,
                name: params.name,
            });
            return customer;
        }
        catch (error) {
            logger_1.logger.error('Failed to create Stripe customer:', error);
            throw new Error(`Customer creation failed: ${error.message}`);
        }
    }
    async retrieveCustomer(customerId) {
        try {
            const customer = await this.stripe.customers.retrieve(customerId);
            if (customer.deleted) {
                throw new Error('Customer has been deleted');
            }
            return customer;
        }
        catch (error) {
            logger_1.logger.error(`Failed to retrieve customer ${customerId}:`, error);
            throw new Error(`Customer retrieval failed: ${error.message}`);
        }
    }
    async updateCustomer(customerId, params) {
        try {
            const customer = await this.stripe.customers.update(customerId, {
                email: params.email,
                name: params.name,
                phone: params.phone,
                metadata: params.metadata,
            });
            logger_1.logger.info(`Stripe customer updated: ${customerId}`);
            return customer;
        }
        catch (error) {
            logger_1.logger.error(`Failed to update customer ${customerId}:`, error);
            throw new Error(`Customer update failed: ${error.message}`);
        }
    }
    async deleteCustomer(customerId) {
        try {
            const deletedCustomer = await this.stripe.customers.del(customerId);
            logger_1.logger.info(`Stripe customer deleted: ${customerId}`);
            return deletedCustomer;
        }
        catch (error) {
            logger_1.logger.error(`Failed to delete customer ${customerId}:`, error);
            throw new Error(`Customer deletion failed: ${error.message}`);
        }
    }
    async createSubscription(params) {
        try {
            const subscriptionParams = {
                customer: params.customer,
                payment_behavior: params.payment_behavior || 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: params.expand || ['latest_invoice.payment_intent'],
                trial_period_days: params.trial_period_days,
                metadata: params.metadata,
            };
            if (params.items) {
                subscriptionParams.items = params.items;
            }
            else if (params.price) {
                subscriptionParams.items = [{ price: params.price }];
            }
            else {
                throw new Error('Either price or items must be provided');
            }
            const subscription = await this.stripe.subscriptions.create(subscriptionParams);
            logger_1.logger.info(`Subscription created: ${subscription.id}`, {
                customer: params.customer,
                status: subscription.status,
            });
            return subscription;
        }
        catch (error) {
            logger_1.logger.error('Failed to create subscription:', error);
            throw new Error(`Subscription creation failed: ${error.message}`);
        }
    }
    async retrieveSubscription(subscriptionId) {
        try {
            return await this.stripe.subscriptions.retrieve(subscriptionId, {
                expand: ['latest_invoice.payment_intent'],
            });
        }
        catch (error) {
            logger_1.logger.error(`Failed to retrieve subscription ${subscriptionId}:`, error);
            throw new Error(`Subscription retrieval failed: ${error.message}`);
        }
    }
    async updateSubscription(subscriptionId, params) {
        try {
            const updateParams = {};
            if (params.items) {
                updateParams.items = params.items;
            }
            else if (params.price) {
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
            logger_1.logger.info(`Subscription updated: ${subscriptionId}`);
            return subscription;
        }
        catch (error) {
            logger_1.logger.error(`Failed to update subscription ${subscriptionId}:`, error);
            throw new Error(`Subscription update failed: ${error.message}`);
        }
    }
    async cancelSubscription(subscriptionId) {
        try {
            const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
            logger_1.logger.info(`Subscription canceled: ${subscriptionId}`);
            return subscription;
        }
        catch (error) {
            logger_1.logger.error(`Failed to cancel subscription ${subscriptionId}:`, error);
            throw new Error(`Subscription cancellation failed: ${error.message}`);
        }
    }
    async createRefund(params) {
        try {
            const refund = await this.stripe.refunds.create({
                payment_intent: params.payment_intent,
                amount: params.amount,
                reason: params.reason,
                metadata: params.metadata,
            });
            logger_1.logger.info(`Refund created: ${refund.id}`, {
                payment_intent: params.payment_intent,
                amount: params.amount,
                reason: params.reason,
            });
            return refund;
        }
        catch (error) {
            logger_1.logger.error('Failed to create refund:', error);
            throw new Error(`Refund creation failed: ${error.message}`);
        }
    }
    async createSetupIntent(params) {
        try {
            const setupIntent = await this.stripe.setupIntents.create({
                customer: params.customer,
                payment_method_types: params.payment_method_types || ['card'],
                usage: params.usage || 'off_session',
            });
            logger_1.logger.info(`Setup intent created: ${setupIntent.id}`, {
                customer: params.customer,
            });
            return setupIntent;
        }
        catch (error) {
            logger_1.logger.error('Failed to create setup intent:', error);
            throw new Error(`Setup intent creation failed: ${error.message}`);
        }
    }
    async listCustomerPaymentMethods(customerId, type = 'card') {
        try {
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: customerId,
                type,
            });
            return paymentMethods.data;
        }
        catch (error) {
            logger_1.logger.error(`Failed to list payment methods for customer ${customerId}:`, error);
            throw new Error(`Payment methods retrieval failed: ${error.message}`);
        }
    }
    async detachPaymentMethod(paymentMethodId) {
        try {
            const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);
            logger_1.logger.info(`Payment method detached: ${paymentMethodId}`);
            return paymentMethod;
        }
        catch (error) {
            logger_1.logger.error(`Failed to detach payment method ${paymentMethodId}:`, error);
            throw new Error(`Payment method detachment failed: ${error.message}`);
        }
    }
    async getOrCreateCustomer(userId) {
        try {
            const user = await User_1.User.findByPk(userId);
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }
            if (user.stripeCustomerId) {
                try {
                    await this.retrieveCustomer(user.stripeCustomerId);
                    return user.stripeCustomerId;
                }
                catch (error) {
                    logger_1.logger.warn(`Stripe customer not found: ${user.stripeCustomerId}. Creating new customer.`);
                }
            }
            const customer = await this.createCustomer({
                email: user.email,
                name: user.name,
                metadata: {
                    userId: userId.toString(),
                },
            });
            user.stripeCustomerId = customer.id;
            await user.save();
            return customer.id;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get or create customer for user ${userId}:`, error);
            throw new Error(`Customer creation failed: ${error.message}`);
        }
    }
    constructWebhookEvent(payload, signature) {
        try {
            if (!environment_1.config.stripe.webhookSecret) {
                throw new Error('Stripe webhook secret not configured');
            }
            return this.stripe.webhooks.constructEvent(payload, signature, environment_1.config.stripe.webhookSecret);
        }
        catch (error) {
            logger_1.logger.error('Failed to construct webhook event:', error);
            throw new Error(`Webhook event construction failed: ${error.message}`);
        }
    }
    getStripeInstance() {
        return this.stripe;
    }
}
exports.StripeService = StripeService;
exports.stripeService = new StripeService();
//# sourceMappingURL=StripeService.js.map