import { Model, Optional } from 'sequelize';
/**
 * User Analytics Model
 * Tracks user progress, coaching effectiveness, and behavioral patterns
 * for data-driven coaching insights and reporting
 */
export interface UserAnalyticsAttributes {
    id: string;
    userId: string;
    periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    periodStart: Date;
    periodEnd: Date;
    engagementMetrics: {
        totalSessions: number;
        totalDuration: number;
        averageSessionDuration: number;
        streakCount: number;
        missedSessions: number;
        responsiveness: number;
        participationScore: number;
        followThroughRate: number;
    };
    coachingMetrics: {
        goalsSet: number;
        goalsAchieved: number;
        goalCompletionRate: number;
        avatarId: string;
        avatarEffectivenessScore: number;
        avatarSwitchCount: number;
        progressMetrics: {
            skillImprovement: number;
            confidenceIncrease: number;
            stressReduction: number;
            habitFormation: number;
        };
    };
    behavioralData: {
        preferredSessionTime: string;
        preferredDuration: number;
        communicationStyle: string;
        topicsOfInterest: string[];
        challengeAreas: string[];
        moodTrends: {
            date: string;
            mood: string;
            sentiment: number;
        }[];
        learningPreferences: {
            visualLearner: number;
            auditoryLearner: number;
            kinestheticLearner: number;
        };
    };
    kpiMetrics: {
        userSatisfactionScore: number;
        npsScore: number;
        retentionProbability: number;
        churnRisk: number;
        customKpis: {
            name: string;
            value: number;
            target: number;
            trend: 'increasing' | 'decreasing' | 'stable';
        }[];
    };
    benchmarkData: {
        userPercentile: number;
        cohortId?: string;
        industryBenchmark: number;
        personalBest: number;
    };
    aiInsights: {
        strengthAreas: string[];
        improvementAreas: string[];
        recommendedActions: string[];
        predictedOutcomes: string[];
        riskFactors: string[];
    };
    calculatedAt: Date;
    nextCalculationDate: Date;
    dataQualityScore: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserAnalyticsCreationAttributes extends Optional<UserAnalyticsAttributes, 'id' | 'nextCalculationDate' | 'dataQualityScore' | 'createdAt' | 'updatedAt'> {
}
export declare class UserAnalytics extends Model<UserAnalyticsAttributes, UserAnalyticsCreationAttributes> implements UserAnalyticsAttributes {
    id: string;
    userId: string;
    periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    periodStart: Date;
    periodEnd: Date;
    engagementMetrics: {
        totalSessions: number;
        totalDuration: number;
        averageSessionDuration: number;
        streakCount: number;
        missedSessions: number;
        responsiveness: number;
        participationScore: number;
        followThroughRate: number;
    };
    coachingMetrics: {
        goalsSet: number;
        goalsAchieved: number;
        goalCompletionRate: number;
        avatarId: string;
        avatarEffectivenessScore: number;
        avatarSwitchCount: number;
        progressMetrics: {
            skillImprovement: number;
            confidenceIncrease: number;
            stressReduction: number;
            habitFormation: number;
        };
    };
    behavioralData: {
        preferredSessionTime: string;
        preferredDuration: number;
        communicationStyle: string;
        topicsOfInterest: string[];
        challengeAreas: string[];
        moodTrends: {
            date: string;
            mood: string;
            sentiment: number;
        }[];
        learningPreferences: {
            visualLearner: number;
            auditoryLearner: number;
            kinestheticLearner: number;
        };
    };
    kpiMetrics: {
        userSatisfactionScore: number;
        npsScore: number;
        retentionProbability: number;
        churnRisk: number;
        customKpis: {
            name: string;
            value: number;
            target: number;
            trend: 'increasing' | 'decreasing' | 'stable';
        }[];
    };
    benchmarkData: {
        userPercentile: number;
        cohortId?: string;
        industryBenchmark: number;
        personalBest: number;
    };
    aiInsights: {
        strengthAreas: string[];
        improvementAreas: string[];
        recommendedActions: string[];
        predictedOutcomes: string[];
        riskFactors: string[];
    };
    calculatedAt: Date;
    nextCalculationDate: Date;
    dataQualityScore: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    /**
     * Calculate overall health score for the user
     */
    getOverallHealthScore(): number;
    /**
     * Get trending direction for key metrics
     */
    getTrendingDirection(): 'up' | 'down' | 'stable';
    /**
     * Check if user is at risk of churning
     */
    isAtRisk(): boolean;
    /**
     * Get personalized recommendations based on analytics
     */
    getPersonalizedRecommendations(): string[];
}
export default UserAnalytics;
//# sourceMappingURL=UserAnalytics.d.ts.map