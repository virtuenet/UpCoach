import { Model } from 'sequelize-typescript';
export declare enum AnalyticsPeriod {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    YEARLY = "yearly"
}
export declare enum ForecastModel {
    LINEAR = "linear",
    EXPONENTIAL = "exponential",
    ARIMA = "arima",
    PROPHET = "prophet",
    ENSEMBLE = "ensemble"
}
export declare class RevenueAnalytics extends Model {
    id: string;
    period: AnalyticsPeriod;
    periodStart: Date;
    periodEnd: Date;
    cohortMonth: string;
    cohortSize: number;
    monthsSinceStart: number;
    retentionRate: number;
    cohortRevenue: number;
    cumulativeCohortRevenue: number;
    revenueBySegment?: {
        plan?: Record<string, number>;
        country?: Record<string, number>;
        acquisition?: Record<string, number>;
        industry?: Record<string, number>;
    };
    customerSegments?: {
        highValue?: {
            count: number;
            revenue: number;
        };
        mediumValue?: {
            count: number;
            revenue: number;
        };
        lowValue?: {
            count: number;
            revenue: number;
        };
        atRisk?: {
            count: number;
            revenue: number;
        };
    };
    expansionRevenue: number;
    expansionCount: number;
    contractionRevenue: number;
    contractionCount: number;
    forecastModel?: ForecastModel;
    forecastedRevenue?: number;
    forecastLowerBound?: number;
    forecastUpperBound?: number;
    forecastConfidence?: number;
    forecastAccuracy?: number;
    churnPrediction?: {
        predictedChurnCount?: number;
        predictedChurnRevenue?: number;
        riskFactors?: string[];
        preventionRecommendations?: string[];
    };
    averageLtv: number;
    ltvBySegment?: Record<string, number>;
    ltvDistribution?: {
        percentile25?: number;
        median?: number;
        percentile75?: number;
        percentile90?: number;
    };
    featureImpact?: {
        feature: string;
        revenueImpact: number;
        userCount: number;
        adoptionRate: number;
    }[];
    seasonalityFactors?: {
        dayOfWeek?: Record<string, number>;
        monthOfYear?: Record<string, number>;
        holidays?: Record<string, number>;
    };
    hasAnomaly: boolean;
    anomalyDetails?: {
        type?: string;
        severity?: string;
        description?: string;
        impact?: number;
    };
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
    get netExpansionRevenue(): number;
    get expansionRate(): number;
    get contractionRate(): number;
    get isForecastReliable(): boolean;
}
//# sourceMappingURL=RevenueAnalytics.d.ts.map