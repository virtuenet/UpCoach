import { Model, Optional, Association } from 'sequelize';
import { User } from '../User';
import { Subscription } from './Subscription';
import { Transaction } from './Transaction';
export declare enum BillingEventType {
    SUBSCRIPTION_CREATED = "subscription_created",
    SUBSCRIPTION_UPDATED = "subscription_updated",
    SUBSCRIPTION_CANCELED = "subscription_canceled",
    SUBSCRIPTION_REACTIVATED = "subscription_reactivated",
    PAYMENT_SUCCEEDED = "payment_succeeded",
    PAYMENT_FAILED = "payment_failed",
    PAYMENT_RETRY = "payment_retry",
    REFUND_ISSUED = "refund_issued",
    CHARGEBACK_CREATED = "chargeback_created",
    TRIAL_STARTED = "trial_started",
    TRIAL_ENDED = "trial_ended",
    PLAN_CHANGED = "plan_changed",
    DISCOUNT_APPLIED = "discount_applied",
    DISCOUNT_REMOVED = "discount_removed",
    INVOICE_CREATED = "invoice_created",
    INVOICE_SENT = "invoice_sent",
    INVOICE_PAID = "invoice_paid",
    CREDIT_APPLIED = "credit_applied",
    DUNNING_STARTED = "dunning_started",
    DUNNING_RESOLVED = "dunning_resolved"
}
export declare enum BillingEventSource {
    STRIPE_WEBHOOK = "stripe_webhook",
    ADMIN_ACTION = "admin_action",
    SYSTEM_AUTOMATION = "system_automation",
    USER_ACTION = "user_action",
    API_CALL = "api_call"
}
export interface BillingEventAttributes {
    id: string;
    eventType: BillingEventType;
    source: BillingEventSource;
    userId: string;
    subscriptionId?: string;
    transactionId?: string;
    stripeEventId?: string;
    description: string;
    amount?: number;
    currency?: string;
    previousValue?: string;
    newValue?: string;
    eventData?: any;
    ipAddress?: string;
    userAgent?: string;
    performedBy?: string;
    isProcessed: boolean;
    processedAt?: Date;
    processingError?: string;
    retryCount: number;
    metadata?: any;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface BillingEventCreationAttributes extends Optional<BillingEventAttributes, 'id' | 'subscriptionId' | 'transactionId' | 'stripeEventId' | 'amount' | 'currency' | 'previousValue' | 'newValue' | 'eventData' | 'ipAddress' | 'userAgent' | 'performedBy' | 'isProcessed' | 'processedAt' | 'processingError' | 'retryCount' | 'metadata' | 'createdAt' | 'updatedAt'> {
}
export declare class BillingEvent extends Model<BillingEventAttributes, BillingEventCreationAttributes> implements BillingEventAttributes {
    id: string;
    eventType: BillingEventType;
    source: BillingEventSource;
    userId: string;
    subscriptionId?: string;
    transactionId?: string;
    stripeEventId?: string;
    description: string;
    amount?: number;
    currency?: string;
    previousValue?: string;
    newValue?: string;
    eventData?: any;
    ipAddress?: string;
    userAgent?: string;
    performedBy?: string;
    isProcessed: boolean;
    processedAt?: Date;
    processingError?: string;
    retryCount: number;
    metadata?: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly user?: User;
    readonly subscription?: Subscription;
    readonly transaction?: Transaction;
    static associations: {
        user: Association<BillingEvent, User>;
        subscription: Association<BillingEvent, Subscription>;
        transaction: Association<BillingEvent, Transaction>;
    };
    get isMonetaryEvent(): boolean;
    get requiresAction(): boolean;
    get severity(): 'low' | 'medium' | 'high' | 'critical';
    static associate(models: any): void;
}
//# sourceMappingURL=BillingEvent.d.ts.map