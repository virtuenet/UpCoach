import { Model } from 'sequelize-typescript';
export declare enum SnapshotPeriod {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    YEARLY = "yearly"
}
export declare class FinancialSnapshot extends Model {
    id: string;
    date: Date;
    period: SnapshotPeriod;
    revenue: number;
    recurringRevenue: number;
    oneTimeRevenue: number;
    mrr: number;
    arr: number;
    newMrr: number;
    expansionMrr: number;
    contractionMrr: number;
    churnedMrr: number;
    netMrrGrowth: number;
    totalCosts: number;
    infrastructureCosts: number;
    apiCosts: number;
    personnelCosts: number;
    marketingCosts: number;
    operationalCosts: number;
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    churnedCustomers: number;
    churnRate: number;
    avgRevenuePerUser: number;
    customerAcquisitionCost: number;
    customerLifetimeValue: number;
    totalSubscriptions: number;
    newSubscriptions: number;
    canceledSubscriptions: number;
    trialSubscriptions: number;
    trialConversionRate: number;
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    refundedTransactions: number;
    refundAmount: number;
    costPerUser: number;
    revenuePerUser: number;
    profitPerUser: number;
    ltvToCacRatio: number;
    paybackPeriodDays: number;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
    get mrrGrowthRate(): number;
    get operatingMargin(): number;
    get isHealthy(): boolean;
}
//# sourceMappingURL=FinancialSnapshot.d.ts.map