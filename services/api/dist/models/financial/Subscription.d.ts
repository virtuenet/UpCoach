import { Model, Optional, Association } from 'sequelize';
import { User } from '../User';
import { Transaction } from './Transaction';
export declare enum SubscriptionStatus {
    ACTIVE = "active",
    PAST_DUE = "past_due",
    CANCELED = "canceled",
    INCOMPLETE = "incomplete",
    INCOMPLETE_EXPIRED = "incomplete_expired",
    TRIALING = "trialing",
    PAUSED = "paused"
}
export declare enum SubscriptionPlan {
    FREE = "free",
    BASIC = "basic",
    PRO = "pro",
    TEAM = "team",
    ENTERPRISE = "enterprise"
}
export declare enum BillingInterval {
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    YEARLY = "yearly"
}
export interface SubscriptionAttributes {
    id: string;
    userId: string;
    stripeSubscriptionId: string;
    stripeCustomerId?: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    billingInterval: BillingInterval;
    amount: number;
    currency: string;
    trialStartDate?: Date;
    trialEndDate?: Date;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    canceledAt?: Date;
    cancelReason?: string;
    discountPercentage?: number;
    discountValidUntil?: Date;
    metadata?: any;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface SubscriptionCreationAttributes extends Optional<SubscriptionAttributes, 'id' | 'stripeCustomerId' | 'status' | 'billingInterval' | 'currency' | 'trialStartDate' | 'trialEndDate' | 'canceledAt' | 'cancelReason' | 'discountPercentage' | 'discountValidUntil' | 'metadata' | 'createdAt' | 'updatedAt'> {
}
export declare class Subscription extends Model<SubscriptionAttributes, SubscriptionCreationAttributes> implements SubscriptionAttributes {
    id: string;
    userId: string;
    stripeSubscriptionId: string;
    stripeCustomerId?: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    billingInterval: BillingInterval;
    amount: number;
    currency: string;
    trialStartDate?: Date;
    trialEndDate?: Date;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    canceledAt?: Date;
    cancelReason?: string;
    discountPercentage?: number;
    discountValidUntil?: Date;
    metadata?: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly user?: User;
    readonly transactions?: Transaction[];
    static associations: {
        user: Association<Subscription, User>;
        transactions: Association<Subscription, Transaction>;
    };
    get isActive(): boolean;
    get isTrialing(): boolean;
    get hasTrial(): boolean;
    get daysUntilTrialEnd(): number | null;
    get daysUntilRenewal(): number | null;
    get monthlyAmount(): number;
    get annualAmount(): number;
    get effectiveAmount(): number;
    get planFeatures(): {
        maxCoaches: number;
        maxGoals: number;
        maxChatsPerDay: number;
        hasVoiceJournaling: boolean;
        hasProgressPhotos: boolean;
        hasAdvancedAnalytics: boolean;
        hasTeamFeatures: boolean;
        hasPrioritySupport: boolean;
        hasCustomBranding: boolean;
        hasApiAccess: boolean;
    };
    static associate(models: any): void;
}
//# sourceMappingURL=Subscription.d.ts.map