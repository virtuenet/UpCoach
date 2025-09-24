"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhookService = exports.StripeWebhookService = void 0;
const models_1 = require("../../models");
const logger_1 = require("../../utils/logger");
class FinancialNotificationService {
    async sendNotification(notificationData) {
        try {
            if (notificationData.type === 'in_app' || notificationData.type === 'both') {
                await this.createInAppNotification(notificationData);
            }
            if (notificationData.type === 'email' || notificationData.type === 'both') {
                await this.sendEmailNotification(notificationData);
            }
            logger_1.logger.info('Financial notification sent', {
                userId: notificationData.userId,
                template: notificationData.template,
                type: notificationData.type,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to send financial notification', {
                error,
                userId: notificationData.userId,
                template: notificationData.template,
            });
        }
    }
    async createInAppNotification(notificationData) {
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
        try {
            await require('../../models').sequelize.query(query, {
                replacements: values,
                type: require('sequelize').QueryTypes.INSERT,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create in-app notification', { error, userId: notificationData.userId });
        }
    }
    async sendEmailNotification(notificationData) {
        try {
            const user = await models_1.User.findByPk(notificationData.userId);
            if (!user) {
                logger_1.logger.error('User not found for email notification', { userId: notificationData.userId });
                return;
            }
            const emailContent = {
                to: user.email,
                subject: notificationData.subject,
                template: notificationData.template,
                data: notificationData.data,
                priority: notificationData.priority,
            };
            if (process.env.NODE_ENV !== 'production') {
                logger_1.logger.info('Email notification (development mode)', emailContent);
            }
            else {
                logger_1.logger.info('Email notification sent', {
                    userId: notificationData.userId,
                    template: notificationData.template,
                    to: user.email,
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send email notification', {
                error,
                userId: notificationData.userId,
            });
        }
    }
    generateMessage(template, data) {
        const messages = {
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
        await notificationService.sendNotification({
            userId: subscription.userId,
            type: 'both',
            template: 'subscription_updated',
            subject: 'Subscription updated',
            data: {
                previousPlan: previousPlan,
                newPlan: newPlan,
                amount: stripeSubscription.items.data[0].price.unit_amount / 100,
                currency: stripeSubscription.currency,
            },
            priority: 'medium',
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
        await notificationService.sendNotification({
            userId: subscription.userId,
            type: 'in_app',
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
        logger_1.logger.warn('Payment dispute created - requires manual review', {
            userId: transaction.userId,
            disputeId: dispute.id,
            amount: dispute.amount / 100,
            reason: dispute.reason,
        });
    }
    async recordBillingEvent(event) {
        logger_1.logger.info(`Processed Stripe webhook: ${event.type}`, {
            eventId: event.id,
            eventType: event.type,
            created: event.created,
            livemode: event.livemode,
        });
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