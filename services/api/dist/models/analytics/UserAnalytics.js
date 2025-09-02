"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAnalytics = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
class UserAnalytics extends sequelize_1.Model {
    id;
    userId;
    periodType;
    periodStart;
    periodEnd;
    engagementMetrics;
    coachingMetrics;
    behavioralData;
    kpiMetrics;
    benchmarkData;
    aiInsights;
    calculatedAt;
    nextCalculationDate;
    dataQualityScore;
    /**
     * Calculate overall health score for the user
     */
    getOverallHealthScore() {
        const engagement = this.engagementMetrics.participationScore * 0.3;
        const coaching = this.coachingMetrics.goalCompletionRate * 0.4;
        const satisfaction = (this.kpiMetrics.userSatisfactionScore / 10) * 0.3;
        return Math.round((engagement + coaching + satisfaction) * 100);
    }
    /**
     * Get trending direction for key metrics
     */
    getTrendingDirection() {
        const trends = this.kpiMetrics.customKpis.map(kpi => kpi.trend);
        const upCount = trends.filter(t => t === 'increasing').length;
        const downCount = trends.filter(t => t === 'decreasing').length;
        if (upCount > downCount)
            return 'up';
        if (downCount > upCount)
            return 'down';
        return 'stable';
    }
    /**
     * Check if user is at risk of churning
     */
    isAtRisk() {
        return (this.kpiMetrics.churnRisk > 0.7 ||
            this.kpiMetrics.userSatisfactionScore < 5 ||
            this.engagementMetrics.followThroughRate < 0.3);
    }
    /**
     * Get personalized recommendations based on analytics
     */
    getPersonalizedRecommendations() {
        const recommendations = [];
        // Engagement recommendations
        if (this.engagementMetrics.averageSessionDuration < 15) {
            recommendations.push('Consider shorter, more focused coaching sessions to improve engagement');
        }
        if (this.engagementMetrics.missedSessions > 2) {
            recommendations.push('Implement session reminders and flexible scheduling');
        }
        // Progress recommendations
        if (this.coachingMetrics.goalCompletionRate < 0.5) {
            recommendations.push('Break down goals into smaller, more achievable milestones');
        }
        if (this.coachingMetrics.avatarEffectivenessScore < 0.6) {
            recommendations.push('Consider switching to a different coaching avatar style');
        }
        // Behavioral recommendations
        if (this.behavioralData.challengeAreas.length > 3) {
            recommendations.push('Focus on addressing 1-2 primary challenge areas for better results');
        }
        return [...recommendations, ...this.aiInsights.recommendedActions];
    }
}
exports.UserAnalytics = UserAnalytics;
UserAnalytics.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    periodType: {
        type: sequelize_1.DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly'),
        allowNull: false,
    },
    periodStart: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    periodEnd: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    engagementMetrics: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            totalSessions: 0,
            totalDuration: 0,
            averageSessionDuration: 0,
            streakCount: 0,
            missedSessions: 0,
            responsiveness: 0.5,
            participationScore: 0.5,
            followThroughRate: 0.5,
        },
    },
    coachingMetrics: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            goalsSet: 0,
            goalsAchieved: 0,
            goalCompletionRate: 0,
            avatarId: '',
            avatarEffectivenessScore: 0.5,
            avatarSwitchCount: 0,
            progressMetrics: {
                skillImprovement: 0.5,
                confidenceIncrease: 0.5,
                stressReduction: 0.5,
                habitFormation: 0.5,
            },
        },
    },
    behavioralData: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            preferredSessionTime: 'morning',
            preferredDuration: 30,
            communicationStyle: 'supportive',
            topicsOfInterest: [],
            challengeAreas: [],
            moodTrends: [],
            learningPreferences: {
                visualLearner: 0.33,
                auditoryLearner: 0.33,
                kinestheticLearner: 0.33,
            },
        },
    },
    kpiMetrics: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            userSatisfactionScore: 7,
            npsScore: 0,
            retentionProbability: 0.7,
            churnRisk: 0.2,
            customKpis: [],
        },
    },
    benchmarkData: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            userPercentile: 50,
            industryBenchmark: 0.5,
            personalBest: 0.5,
        },
    },
    aiInsights: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            strengthAreas: [],
            improvementAreas: [],
            recommendedActions: [],
            predictedOutcomes: [],
            riskFactors: [],
        },
    },
    calculatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    nextCalculationDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow;
        },
    },
    dataQualityScore: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.8,
        validate: {
            min: 0,
            max: 1,
        },
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: sequelize_2.sequelize,
    tableName: 'user_analytics',
    modelName: 'UserAnalytics',
    timestamps: true,
    indexes: [
        {
            fields: ['userId'],
            name: 'idx_user_analytics_user_id',
        },
        {
            fields: ['periodType'],
            name: 'idx_user_analytics_period_type',
        },
        {
            fields: ['periodStart', 'periodEnd'],
            name: 'idx_user_analytics_period',
        },
        {
            fields: ['calculatedAt'],
            name: 'idx_user_analytics_calculated_at',
        },
        {
            fields: ['nextCalculationDate'],
            name: 'idx_user_analytics_next_calculation',
        },
        {
            fields: ['userId', 'periodType', 'periodStart'],
            name: 'idx_user_analytics_user_period',
            unique: true,
        },
    ],
});
exports.default = UserAnalytics;
//# sourceMappingURL=UserAnalytics.js.map