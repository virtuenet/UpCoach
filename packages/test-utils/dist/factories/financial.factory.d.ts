export interface FinancialSnapshot {
    id: string;
    date: Date;
    mrr: number;
    arr: number;
    revenue: number;
    costs: number;
    profit: number;
    activeSubscriptions: number;
    churnRate: number;
    ltv: number;
    cac: number;
    createdAt: Date;
}
export interface Transaction {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    type: 'payment' | 'refund' | 'subscription' | 'one-time';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    stripeId?: string;
    description: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
export interface Subscription {
    id: string;
    userId: string;
    stripeSubscriptionId: string;
    status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'incomplete';
    plan: 'basic' | 'premium' | 'enterprise';
    amount: number;
    currency: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    canceledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FinancialSnapshotFactory: any;
export declare const TransactionFactory: any;
export declare const SubscriptionFactory: any;
export declare const ActiveSubscriptionFactory: any;
export declare const TrialingSubscriptionFactory: any;
export declare const CanceledSubscriptionFactory: any;
export declare const PaymentTransactionFactory: any;
export declare const RefundTransactionFactory: any;
export declare function createMonthlySnapshots(months?: number): FinancialSnapshot[];
export declare function createSubscriptionHistory(userId: string, months?: number): Subscription[];
//# sourceMappingURL=financial.factory.d.ts.map