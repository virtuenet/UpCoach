/**
 * CostAnalyticsService
 * Advanced cost analysis and optimization service
 */
export declare class CostAnalyticsService {
    /**
     * Calculate cost per user for a period
     */
    static calculateCostPerUser(startDate: Date, endDate: Date): Promise<{
        totalCostPerUser: number;
        costPerActiveUser: number;
        costsByCategory: Record<string, number>;
    }>;
    /**
     * Analyze infrastructure costs and usage
     */
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
    /**
     * Analyze API service costs
     */
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
    /**
     * Generate cost forecasting
     */
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
    /**
     * Analyze budget variance
     */
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
    /**
     * Generate cost optimization recommendations
     */
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
    /**
     * Calculate cost trends
     */
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
    /**
     * Helper method to calculate growth trend
     */
    private static calculateGrowthTrend;
}
export default CostAnalyticsService;
//# sourceMappingURL=CostAnalyticsService.d.ts.map