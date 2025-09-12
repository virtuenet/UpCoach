import { FinancialSnapshot } from '../../models';
export declare class FinancialService {
    calculateMRR(date?: Date): Promise<number>;
    calculateARR(date?: Date): Promise<number>;
    calculateChurnRate(startDate: Date, endDate: Date): Promise<number>;
    getRevenueByPlan(startDate: Date, endDate: Date): Promise<any>;
    calculateLTV(cohortMonth?: string): Promise<number>;
    calculateARPU(): Promise<number>;
    calculateCAC(startDate: Date, endDate: Date): Promise<number>;
    getDashboardMetrics(): Promise<any>;
    generateDailySnapshot(date?: Date): Promise<FinancialSnapshot>;
    getProfitLossStatement(startDate: Date, endDate: Date): Promise<any>;
    getCostsByCategory(startDate: Date, endDate: Date): Promise<{
        category: any;
        total: number;
        count: number;
        average: number;
        percentage: number;
    }[]>;
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