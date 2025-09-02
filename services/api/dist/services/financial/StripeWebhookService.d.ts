import Stripe from 'stripe';
export declare class StripeWebhookService {
    /**
     * Handle incoming Stripe webhook
     */
    handleWebhook(event: Stripe.Event): Promise<void>;
    /**
     * Handle successful payment
     */
    private handlePaymentSucceeded;
    /**
     * Handle failed payment
     */
    private handlePaymentFailed;
    /**
     * Handle subscription creation
     */
    private handleSubscriptionCreated;
    /**
     * Handle subscription update
     */
    private handleSubscriptionUpdated;
    /**
     * Handle subscription deletion
     */
    private handleSubscriptionDeleted;
    /**
     * Handle trial ending soon
     */
    private handleTrialWillEnd;
    /**
     * Handle invoice payment succeeded
     */
    private handleInvoicePaymentSucceeded;
    /**
     * Handle invoice payment failed
     */
    private handleInvoicePaymentFailed;
    /**
     * Handle charge refunded
     */
    private handleChargeRefunded;
    /**
     * Handle dispute created
     */
    private handleDisputeCreated;
    /**
     * Record billing event for audit
     */
    private recordBillingEvent;
    /**
     * Map Stripe plan to internal plan
     */
    private mapStripePlanToInternal;
    /**
     * Map Stripe status to internal status
     */
    private mapStripeStatusToInternal;
}
export declare const stripeWebhookService: StripeWebhookService;
//# sourceMappingURL=StripeWebhookService.d.ts.map