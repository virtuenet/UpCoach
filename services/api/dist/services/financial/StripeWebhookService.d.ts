import Stripe from 'stripe';
export declare class StripeWebhookService {
    handleWebhook(event: Stripe.Event): Promise<void>;
    private handlePaymentSucceeded;
    private handlePaymentFailed;
    private handleSubscriptionCreated;
    private handleSubscriptionUpdated;
    private handleSubscriptionDeleted;
    private handleTrialWillEnd;
    private handleInvoicePaymentSucceeded;
    private handleInvoicePaymentFailed;
    private handleChargeRefunded;
    private handleDisputeCreated;
    private recordBillingEvent;
    private mapStripePlanToInternal;
    private mapStripeStatusToInternal;
}
export declare const stripeWebhookService: StripeWebhookService;
//# sourceMappingURL=StripeWebhookService.d.ts.map