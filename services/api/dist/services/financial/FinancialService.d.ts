import { FinancialSnapshot } from '../../models';
export declare class FinancialService {
    /**
     * Calculate Monthly Recurring Revenue (MRR)
     */
    calculateMRR(date?: Date): Promise<number>;
    /**
     * Calculate Annual Recurring Revenue (ARR)
     */
    calculateARR(date?: Date): Promise<number>;
    /**
     * Calculate churn rate for a given period
     */
    calculateChurnRate(startDate: Date, endDate: Date): Promise<number>;
    /**
     * Get revenue breakdown by plan
     */
    getRevenueByPlan(startDate: Date, endDate: Date): Promise<any>;
    /**
     * Calculate Customer Lifetime Value (LTV)
     */
    calculateLTV(cohortMonth?: string): Promise<number>;
    /**
     * Calculate Average Revenue Per User (ARPU)
     */
    calculateARPU(): Promise<number>;
    /**
     * Calculate Customer Acquisition Cost (CAC)
     */
    calculateCAC(startDate: Date, endDate: Date): Promise<number>;
    /**
     * Get financial metrics dashboard data
     */
    getDashboardMetrics(): Promise<any>;
    /**
     * Generate daily financial snapshot
     */
    generateDailySnapshot(date?: Date): Promise<FinancialSnapshot>;
    /**
     * Get P&L statement for a period
     */
    getProfitLossStatement(startDate: Date, endDate: Date): Promise<any>;
    /**
     * Get costs grouped by category
     */
    getCostsByCategory(startDate: Date, endDate: Date): Promise<{
        category: any;
        total: number;
        count: number;
        average: number;
        percentage: number;
    }[]>;
    /**
     * Get detailed cost breakdown
     */
    getCostBreakdown(startDate: Date, endDate: Date): Promise<{
        category: any;
        vendor: any;
        total: number;
        count: number;
        average: number;
        percentage: number;
    }[]>;
}
export declare const financialService: FinancialService;
//# sourceMappingURL=FinancialService.d.ts.map