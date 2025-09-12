export declare class CostAnalyticsService {
    static calculateCostPerUser(startDate: Date, endDate: Date): Promise<{
        totalCostPerUser: number;
        costPerActiveUser: number;
        costsByCategory: Record<string, number>;
    }>;
    static analyzeInfrastructureCosts(startDate: Date, endDate: Date): Promise<{
        totalInfrastructureCost: number;
        costBreakdown: {
            compute: number;
            storage: number;
            network: number;
            database: number;
            other: number;
        };
        optimization: {
            potentialSavings: number;
            recommendations: string[];
        };
    }>;
    static analyzeApiServiceCosts(startDate: Date, endDate: Date): Promise<{
        totalApiCosts: number;
        costsByProvider: Record<string, number>;
        usageMetrics: {
            totalRequests: number;
            costPerRequest: number;
            costPerUser: number;
        };
        optimization: {
            potentialSavings: number;
            recommendations: string[];
        };
    }>;
    static generateCostForecast(months?: number): Promise<{
        forecastPeriods: {
            month: string;
            predictedCost: number;
            category: string;
            confidence: number;
        }[];
        totalForecastedCost: number;
        methodology: string;
    }>;
    static analyzeBudgetVariance(startDate: Date, endDate: Date): Promise<{
        totalBudget: number;
        totalActual: number;
        variance: number;
        variancePercentage: number;
        categoryVariances: {
            category: string;
            budget: number;
            actual: number;
            variance: number;
            status: 'under' | 'over' | 'on_track';
        }[];
    }>;
    static generateOptimizationRecommendations(): Promise<{
        recommendations: {
            category: string;
            recommendation: string;
            impact: 'high' | 'medium' | 'low';
            effort: 'high' | 'medium' | 'low';
            potentialSavings: number;
            timeframe: string;
        }[];
        totalPotentialSavings: number;
    }>;
    static calculateCostTrends(months?: number): Promise<{
        trends: {
            month: string;
            totalCost: number;
            categoryBreakdown: Record<string, number>;
            growthRate: number;
        }[];
        averageGrowthRate: number;
        seasonalityFactors: number[];
    }>;
    private static calculateGrowthTrend;
}
export default CostAnalyticsService;
//# sourceMappingURL=CostAnalyticsService.d.ts.map