"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhookService = exports.StripeWebhookService = void 0;
const models_1 = require("../../models");
const logger_1 = require("../../utils/logger");
class StripeWebhookService {
    async handleWebhook(event) {
        try {
            const existingEvent = await models_1.BillingEvent.findOne({
                where: { stripeEventId: event.id },
            });
            if (existingEvent) {
                logger_1.logger.info(`Duplicate webhook event: ${event.id}`);
                return;
            }
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentSucceeded(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await this.handlePaymentFailed(event.data.object);
                    break;
                case 'customer.subscription.created':
                    await this.handleSubscriptionCreated(event.data.object);
                    break;
                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdated(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionDeleted(event.data.object);
                    break;
                case 'customer.subscription.trial_will_end':
                    await this.handleTrialWillEnd(event.data.object);
                    break;
                case 'invoice.payment_succeeded':
                    await this.handleInvoicePaymentSucceeded(event.data.object);
                    break;
                case 'invoice.payment_failed':
                    await this.handleInvoicePaymentFailed(event.data.object);
                    break;
                case 'charge.refunded':
                    await this.handleChargeRefunded(event.data.object);
                    break;
                case 'charge.dispute.created':
                    await this.handleDisputeCreated(event.data.object);
                    break;
                default:
                    logger_1.logger.info(`Unhandled webhook event type: ${event.type}`);
            }
            await this.recordBillingEvent(event);
        }
        catch (error) {
            logger_1.logger.error('Error processing webhook:', error);
            throw error;
        }
    }
    async handlePaymentSucceeded(paymentIntent) {
        const user = await models_1.User.findOne({
            where: { email: paymentIntent.receipt_email },
        });
        if (!user) {
            logger_1.logger.error(`User not found for payment: ${paymentIntent.id}`);
            return;
        }
        await models_1.Transaction.create({
            userId: user.id,
            stripeTransactionId: paymentIntent.id,
            type: models_1.TransactionType.PAYMENT,
            status: models_1.TransactionStatus.COMPLETED,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            paymentMethod: models_1.PaymentMethod.CARD,
            description: paymentIntent.description || 'Payment',
        });
        await models_1.BillingEvent.create({
            eventType: models_1.BillingEventType.PAYMENT_SUCCEEDED,
            source: models_1.BillingEventSource.STRIPE_WEBHOOK,
            userId: user.id,
            stripeEventId: paymentIntent.id,
            description: `Payment of ${paymentIntent.amount / 100} ${paymentIntent.currency} succeeded`,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            isProcessed: true,
            processedAt: new Date(),
        });
    }
    async handlePaymentFailed(paymentIntent) {
        const user = await models_1.User.findOne({
            where: { email: paymentIntent.receipt_email },
        });
        if (!user)
            return;
        await models_1.Transaction.create({
            userId: user.id,
            stripeTransactionId: paymentIntent.id,
            type: models_1.TransactionType.PAYMENT,
            status: models_1.TransactionStatus.FAILED,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            paymentMethod: models_1.PaymentMethod.CARD,
            description: paymentIntent.description || 'Payment',
            failureReason: paymentIntent.last_payment_error?.message,
        });
        await models_1.BillingEvent.create({
            eventType: models_1.BillingEventType.PAYMENT_FAILED,
            source: models_1.BillingEventSource.STRIPE_WEBHOOK,
            userId: user.id,
            stripeEventId: paymentIntent.id,
            description: `Payment failed: ${paymentIntent.last_payment_error?.message}`,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            isProcessed: true,
            processedAt: new Date(),
        });
    }
    async handleSubscriptionCreated(stripeSubscription) {
        const existingSubscription = await models_1.Subscription.findOne({
            where: { stripeCustomerId: stripeSubscription.customer },
            include: [{ model: models_1.User, as: 'user' }],
        });
        const user = existingSubscription?.user;
        if (!user)
            return;
        const subscription = await models_1.Subscription.create({
            userId: user.id,
            stripeSubscriptionId: stripeSubscription.id,
            stripeCustomerId: stripeSubscription.customer,
            plan: this.mapStripePlanToInternal(stripeSubscription.items.data[0].price.lookup_key),
            status: this.mapStripeStatusToInternal(stripeSubscription.status),
            amount: stripeSubscription.items.data[0].price.unit_amount / 100,
            currency: stripeSubscription.currency,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            trialStartDate: stripeSubscription.trial_start
                ? new Date(stripeSubscription.trial_start * 1000)
                : undefined,
            trialEndDate: stripeSubscription.trial_end
                ? new Date(stripeSubscription.trial_end * 1000)
                : undefined,
        });
        await models_1.BillingEvent.create({
            eventType: models_1.BillingEventType.SUBSCRIPTION_CREATED,
            source: models_1.BillingEventSource.STRIPE_WEBHOOK,
            userId: user.id,
            subscriptionId: subscription.id,
            stripeEventId: stripeSubscription.id,
            description: `Subscription created: ${subscription.plan} plan`,
            isProcessed: true,
            processedAt: new Date(),
        });
    }
    async handleSubscriptionUpdated(stripeSubscription) {
        const subscription = await models_1.Subscription.findOne({
            where: { stripeSubscriptionId: stripeSubscription.id },
        });
        if (!subscription)
            return;
        const previousPlan = subscription.plan;
        const newPlan = this.mapStripePlanToInternal(stripeSubscription.items.data[0].price.lookup_key);
        await subscription.update({
            plan: newPlan,
            status: this.mapStripeStatusToInternal(stripeSubscription.status),
            amount: stripeSubscription.items.data[0].price.unit_amount / 100,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        });
        let eventType = models_1.BillingEventType.SUBSCRIPTION_UPDATED;
        if (previousPlan !== newPlan) {
            eventType = models_1.BillingEventType.PLAN_CHANGED;
        }
        await models_1.BillingEvent.create({
            eventType,
            source: models_1.BillingEventSource.STRIPE_WEBHOOK,
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
    async handleSubscriptionDeleted(stripeSubscription) {
        const subscription = await models_1.Subscription.findOne({
            where: { stripeSubscriptionId: stripeSubscription.id },
        });
        if (!subscription)
            return;
        await subscription.update({
            status: models_1.SubscriptionStatus.CANCELED,
            canceledAt: new Date(),
        });
        await models_1.BillingEvent.create({
            eventType: models_1.BillingEventType.SUBSCRIPTION_CANCELED,
            source: models_1.BillingEventSource.STRIPE_WEBHOOK,
            userId: subscription.userId,
            subscriptionId: subscription.id,
            stripeEventId: stripeSubscription.id,
            description: 'Subscription canceled',
            isProcessed: true,
            processedAt: new Date(),
        });
    }
    async handleTrialWillEnd(stripeSubscription) {
        const subscription = await models_1.Subscription.findOne({
            where: { stripeSubscriptionId: stripeSubscription.id },
        });
        if (!subscription)
            return;
        await models_1.BillingEvent.create({
            eventType: models_1.BillingEventType.TRIAL_ENDED,
            source: models_1.BillingEventSource.STRIPE_WEBHOOK,
            userId: subscription.userId,
            subscriptionId: subscription.id,
            stripeEventId: stripeSubscription.id,
            description: 'Trial period ending soon',
            isProcessed: true,
            processedAt: new Date(),
        });
    }
    async handleInvoicePaymentSucceeded(invoice) {
        const subscription = await models_1.Subscription.findOne({
            where: { stripeSubscriptionId: invoice.subscription },
        });
        if (!subscription)
            return;
        await subscription.save();
        await models_1.Transaction.create({
            userId: subscription.userId,
            subscriptionId: subscription.id,
            stripeTransactionId: invoice.charge,
            type: models_1.TransactionType.PAYMENT,
            status: models_1.TransactionStatus.COMPLETED,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            paymentMethod: models_1.PaymentMethod.CARD,
            description: 'Subscription payment',
            stripeInvoiceId: invoice.id,
        });
    }
    async handleInvoicePaymentFailed(invoice) {
        const subscription = await models_1.Subscription.findOne({
            where: { stripeSubscriptionId: invoice.subscription },
        });
        if (!subscription)
            return;
        await subscription.update({
            status: models_1.SubscriptionStatus.PAST_DUE,
        });
        await models_1.BillingEvent.create({
            eventType: models_1.BillingEventType.PAYMENT_FAILED,
            source: models_1.BillingEventSource.STRIPE_WEBHOOK,
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
    async handleChargeRefunded(charge) {
        const transaction = await models_1.Transaction.findOne({
            where: { stripeTransactionId: charge.id },
        });
        if (!transaction)
            return;
        await transaction.update({
            status: models_1.TransactionStatus.REFUNDED,
            refundedAmount: charge.amount_refunded / 100,
        });
        await models_1.Transaction.create({
            userId: transaction.userId,
            subscriptionId: transaction.subscriptionId,
            stripeTransactionId: `${charge.id}_refund`,
            type: models_1.TransactionType.REFUND,
            status: models_1.TransactionStatus.COMPLETED,
            amount: charge.amount_refunded / 100,
            currency: charge.currency,
            paymentMethod: models_1.PaymentMethod.CARD,
            description: 'Refund',
        });
        await models_1.BillingEvent.create({
            eventType: models_1.BillingEventType.REFUND_ISSUED,
            source: models_1.BillingEventSource.STRIPE_WEBHOOK,
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
    async handleDisputeCreated(dispute) {
        const transaction = await models_1.Transaction.findOne({
            where: { stripeTransactionId: dispute.charge },
        });
        if (!transaction)
            return;
        await models_1.BillingEvent.create({
            eventType: models_1.BillingEventType.CHARGEBACK_CREATED,
            source: models_1.BillingEventSource.STRIPE_WEBHOOK,
            userId: transaction.userId,
            transactionId: transaction.id,
            stripeEventId: dispute.id,
            description: `Dispute created: ${dispute.reason}`,
            amount: dispute.amount / 100,
            currency: dispute.currency,
            isProcessed: false,
            processedAt: new Date(),
        });
    }
    async recordBillingEvent(event) {
        logger_1.logger.info(`Processed Stripe webhook: ${event.type}`);
    }
    mapStripePlanToInternal(stripePlan) {
        const planMap = {
            basic_monthly: 'basic',
            pro_monthly: 'pro',
            team_monthly: 'team',
            enterprise_monthly: 'enterprise',
        };
        return planMap[stripePlan] || 'free';
    }
    mapStripeStatusToInternal(stripeStatus) {
        const statusMap = {
            active: models_1.SubscriptionStatus.ACTIVE,
            past_due: models_1.SubscriptionStatus.PAST_DUE,
            canceled: models_1.SubscriptionStatus.CANCELED,
            incomplete: models_1.SubscriptionStatus.INCOMPLETE,
            incomplete_expired: models_1.SubscriptionStatus.INCOMPLETE_EXPIRED,
            trialing: models_1.SubscriptionStatus.TRIALING,
            paused: models_1.SubscriptionStatus.PAUSED,
        };
        return statusMap[stripeStatus] || models_1.SubscriptionStatus.INCOMPLETE;
    }
}
exports.StripeWebhookService = StripeWebhookService;
exports.stripeWebhookService = new StripeWebhookService();
//# sourceMappingURL=StripeWebhookService.js.map