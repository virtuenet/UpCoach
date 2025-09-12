"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.coachIntelligenceService = exports.CoachIntelligenceServiceEnhanced = void 0;
const sequelize_1 = require("sequelize");
const KpiTracker_1 = __importDefault(require("../../models/analytics/KpiTracker"));
const UserAnalytics_1 = __importDefault(require("../../models/analytics/UserAnalytics"));
const CoachMemory_1 = __importDefault(require("../../models/coaching/CoachMemory"));
const User_1 = require("../../models/User");
const logger_1 = require("../../utils/logger");
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
const AnalyticsService_1 = require("../analytics/AnalyticsService");
class CoachIntelligenceServiceEnhanced {
    cache;
    analytics;
    constructor() {
        this.cache = new UnifiedCacheService_1.UnifiedCacheService();
        this.analytics = new AnalyticsService_1.AnalyticsService();
    }
    async calculateEngagementScore(userId) {
        const cacheKey = `engagement:${userId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        try {
            const memories = await CoachMemory_1.default.findAll({
                where: {
                    userId,
                    conversationDate: {
                        [sequelize_1.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                },
                order: [['conversationDate', 'DESC']]
            });
            const analytics = await UserAnalytics_1.default.findOne({
                where: { userId },
                order: [['calculatedAt', 'DESC']]
            });
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const dailyActive = memories.some(m => new Date(m.conversationDate) >= oneDayAgo);
            const weeklyActive = memories.some(m => new Date(m.conversationDate) >= oneWeekAgo);
            const monthlyActive = memories.some(m => new Date(m.conversationDate) >= oneMonthAgo);
            const weeklyMemories = memories.filter(m => new Date(m.conversationDate) >= oneWeekAgo);
            const sessionFrequency = weeklyMemories.length;
            const averageSessionDuration = analytics?.engagementMetrics?.averageSessionDuration || 0;
            const interactionDepth = this.calculateInteractionDepth(memories);
            const featureAdoption = await this.calculateFeatureAdoption(userId);
            const retentionRate = await this.calculateRetentionRate(userId);
            const churnRisk = await this.calculateChurnRisk(userId, {
                dailyActive,
                weeklyActive,
                sessionFrequency,
                retentionRate
            });
            const overallScore = this.calculateWeightedEngagementScore({
                dailyActive,
                weeklyActive,
                monthlyActive,
                sessionFrequency,
                averageSessionDuration,
                interactionDepth,
                featureAdoption,
                retentionRate,
                churnRisk
            });
            const metrics = {
                overallScore,
                dailyActive,
                weeklyActive,
                monthlyActive,
                sessionFrequency,
                averageSessionDuration,
                interactionDepth,
                featureAdoption,
                retentionRate,
                churnRisk
            };
            await this.cache.set(cacheKey, metrics, { ttl: 3600 });
            await this.analytics.trackUserAction(parseInt(userId), 'engagement_calculated', metrics);
            return metrics;
        }
        catch (error) {
            logger_1.logger.error('Error calculating engagement score:', error);
            throw error;
        }
    }
    async calculateNPSScore(userId) {
        const cacheKey = `nps:${userId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        try {
            const memories = await CoachMemory_1.default.findAll({
                where: { userId },
                order: [['conversationDate', 'DESC']],
                limit: 30
            });
            const sentimentScores = memories.map(m => m.emotionalContext?.sentiment || 0);
            const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
            const npsScore = Math.round((avgSentiment + 1) * 5);
            let category;
            if (npsScore >= 9)
                category = 'promoter';
            else if (npsScore >= 7)
                category = 'passive';
            else
                category = 'detractor';
            const historicalScores = await this.getNPSHistory(userId);
            const trend = this.calculateNPSTrend(historicalScores);
            const improvementAreas = await this.identifyNPSImprovementAreas(userId, memories);
            const feedback = memories
                .filter(m => m.coachingContext?.followUpNeeded)
                .map(m => m.summary)
                .filter(Boolean)
                .slice(0, 5);
            const npsData = {
                score: npsScore,
                category,
                trend,
                historicalScores,
                feedback,
                improvementAreas
            };
            await this.cache.set(cacheKey, npsData, { ttl: 86400 });
            await this.storeNPSScore(userId, npsScore);
            return npsData;
        }
        catch (error) {
            logger_1.logger.error('Error calculating NPS score:', error);
            throw error;
        }
    }
    async getNPSTrends(userId, period = 'month') {
        try {
            const historicalScores = await this.getNPSHistory(userId, period);
            if (historicalScores.length < 2) {
                return {
                    trend: 'stable',
                    averageScore: historicalScores[0]?.score || 7,
                    changeRate: 0,
                    projection: historicalScores[0]?.score || 7
                };
            }
            const averageScore = historicalScores.reduce((sum, h) => sum + h.score, 0) / historicalScores.length;
            const n = historicalScores.length;
            const sumX = historicalScores.reduce((sum, _, i) => sum + i, 0);
            const sumY = historicalScores.reduce((sum, h) => sum + h.score, 0);
            const sumXY = historicalScores.reduce((sum, h, i) => sum + i * h.score, 0);
            const sumX2 = historicalScores.reduce((sum, _, i) => sum + i * i, 0);
            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const changeRate = slope;
            let trend;
            if (Math.abs(slope) < 0.1)
                trend = 'stable';
            else if (slope > 0)
                trend = 'improving';
            else
                trend = 'declining';
            const projection = Math.max(0, Math.min(10, averageScore + slope));
            return {
                trend,
                averageScore,
                changeRate,
                projection
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting NPS trends:', error);
            throw error;
        }
    }
    async assessSkillImprovement(userId, skillName) {
        try {
            const memories = await CoachMemory_1.default.findAll({
                where: {
                    userId,
                    tags: {
                        [sequelize_1.Op.overlap]: [skillName.toLowerCase()]
                    }
                },
                order: [['conversationDate', 'DESC']]
            });
            const goals = await KpiTracker_1.default.findAll({
                where: {
                    userId,
                    title: {
                        [sequelize_1.Op.iLike]: `%${skillName}%`
                    }
                }
            });
            const currentLevel = await this.calculateCurrentSkillLevel(memories, goals);
            const previousLevel = await this.calculatePreviousSkillLevel(memories, goals);
            const improvement = currentLevel - previousLevel;
            const improvementRate = previousLevel > 0 ? improvement / previousLevel : 0;
            const timeToImprove = this.calculateTimeToSkillImprovement(memories, improvement);
            const recommendations = await this.generateSkillRecommendations(skillName, currentLevel, improvement, memories);
            const practiceAreas = await this.identifyPracticeAreas(skillName, currentLevel, memories);
            return {
                skillName,
                currentLevel,
                previousLevel,
                improvement,
                improvementRate,
                timeToImprove,
                recommendations,
                practiceAreas
            };
        }
        catch (error) {
            logger_1.logger.error('Error assessing skill improvement:', error);
            throw error;
        }
    }
    async trackCustomKPI(userId, kpiName, value, metadata) {
        try {
            let kpiTracker = await KpiTracker_1.default.findOne({
                where: {
                    userId,
                    title: kpiName
                }
            });
            if (!kpiTracker) {
                kpiTracker = await KpiTracker_1.default.create({
                    userId,
                    title: kpiName,
                    description: metadata?.description || `Custom KPI: ${kpiName}`,
                    type: 'kpi',
                    category: 'custom',
                    keyResults: [],
                    kpiData: {
                        metric: kpiName,
                        target: metadata?.target || 100,
                        current: value,
                        unit: metadata?.unit || 'points',
                        trend: 'stable',
                        frequency: 'daily'
                    },
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                    reviewFrequency: 'weekly',
                    nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    overallProgress: 0,
                    status: 'in_progress',
                    milestones: [],
                    performanceHistory: [],
                    coachingData: {
                        coachingFrequency: 'weekly',
                        coachingNotes: [],
                        actionItems: []
                    },
                    analytics: {
                        averageProgress: 0,
                        velocityScore: 0,
                        consistencyScore: 0,
                        riskFactors: [],
                        successFactors: [],
                        recommendations: []
                    },
                    collaborators: [],
                    priority: metadata?.priority || 'medium',
                    confidentiality: 'private',
                    tags: []
                });
            }
            else {
                const history = kpiTracker.performanceHistory || [];
                history.push({
                    date: new Date(),
                    value,
                    note: metadata?.note,
                    context: metadata?.context
                });
                if (kpiTracker.kpiData) {
                    kpiTracker.kpiData.current = value;
                }
                kpiTracker.performanceHistory = history;
                const targetValue = kpiTracker.kpiData?.target || 100;
                kpiTracker.overallProgress = (value / targetValue) * 100;
                await kpiTracker.save();
            }
            const trend = this.calculateKPITrend(kpiTracker.performanceHistory);
            const forecast = await this.forecastKPIValue(kpiTracker);
            const insights = await this.generateKPIInsights(kpiTracker, trend);
            return {
                kpiId: kpiTracker.id,
                name: kpiName,
                value,
                target: kpiTracker.kpiData?.target || 0,
                achievement: kpiTracker.overallProgress,
                trend,
                forecast,
                insights
            };
        }
        catch (error) {
            logger_1.logger.error('Error tracking custom KPI:', error);
            throw error;
        }
    }
    async generateKPIReport(userId, period = 'month') {
        try {
            const kpiTrackers = await KpiTracker_1.default.findAll({
                where: { userId },
                order: [['priority', 'DESC'], ['createdAt', 'DESC']]
            });
            const kpis = [];
            for (const tracker of kpiTrackers) {
                const trend = this.calculateKPITrend(tracker.performanceHistory);
                const forecast = await this.forecastKPIValue(tracker);
                const insights = await this.generateKPIInsights(tracker, trend);
                kpis.push({
                    kpiId: tracker.id,
                    name: tracker.title,
                    value: tracker.kpiData?.current || 0,
                    target: tracker.kpiData?.target || 100,
                    achievement: tracker.overallProgress,
                    trend,
                    forecast,
                    insights
                });
            }
            const summary = {
                totalKPIs: kpis.length,
                achievedKPIs: kpis.filter(k => k.achievement >= 100).length,
                averageAchievement: kpis.reduce((sum, k) => sum + k.achievement, 0) / kpis.length,
                improvingKPIs: kpis.filter(k => k.trend === 'up').length,
                decliningKPIs: kpis.filter(k => k.trend === 'down').length
            };
            const insights = await this.generateOverallKPIInsights(kpis, summary);
            const recommendations = await this.generateKPIRecommendations(kpis, summary);
            const performanceScore = this.calculatePerformanceScore(kpis);
            return {
                summary,
                kpis,
                insights,
                recommendations,
                performanceScore
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating KPI report:', error);
            throw error;
        }
    }
    async predictUserSuccess(userId, goalId) {
        try {
            const memories = await CoachMemory_1.default.findAll({
                where: { userId },
                order: [['conversationDate', 'DESC']],
                limit: 100
            });
            const goals = await KpiTracker_1.default.findAll({
                where: goalId ? { userId, id: goalId } : { userId }
            });
            const analytics = await UserAnalytics_1.default.findOne({
                where: { userId },
                order: [['calculatedAt', 'DESC']]
            });
            const features = {
                engagementScore: analytics ? (analytics.engagementMetrics.participationScore * 0.4 + analytics.engagementMetrics.followThroughRate * 0.4 + analytics.engagementMetrics.responsiveness * 0.2) : 0.5,
                consistencyScore: this.calculateConsistencyIndex(memories),
                sentimentScore: this.calculateAverageSentiment(memories),
                progressVelocity: this.calculateProgressVelocity(goals),
                historicalSuccess: this.calculateHistoricalSuccessRate(goals),
                currentMomentum: this.calculateCurrentMomentum(memories, goals)
            };
            const successProbability = this.applySuccessPredictionModel(features);
            const riskFactors = this.identifyRiskFactors(features, memories, goals);
            const successFactors = this.identifySuccessFactors(features, memories, goals);
            const recommendedActions = await this.generateSuccessActions(features, riskFactors, successFactors);
            const confidenceLevel = this.calculatePredictionConfidence(memories, goals);
            const timeToGoal = this.estimateTimeToGoal(goals, features);
            return {
                successProbability,
                riskFactors,
                successFactors,
                recommendedActions,
                confidenceLevel,
                timeToGoal
            };
        }
        catch (error) {
            logger_1.logger.error('Error predicting user success:', error);
            throw error;
        }
    }
    async trackConfidenceLevel(userId, area, score) {
        try {
            const cacheKey = `confidence:${userId}:${area}`;
            const previousData = await this.cache.get(cacheKey);
            const previousLevel = previousData?.currentLevel || 5;
            const confidenceData = {
                currentLevel: score,
                previousLevel,
                timestamp: new Date(),
                area
            };
            await this.cache.set(cacheKey, confidenceData, { ttl: 86400 * 7 });
            const change = score - previousLevel;
            let trend;
            if (Math.abs(change) < 0.5)
                trend = 'stable';
            else if (change > 0)
                trend = 'improving';
            else
                trend = 'declining';
            const insights = await this.generateConfidenceInsights(area, score, previousLevel, trend);
            await this.analytics.trackUserAction(parseInt(userId), 'confidence_tracked', {
                area,
                score,
                change,
                trend
            });
            return {
                currentLevel: score,
                previousLevel,
                change,
                trend,
                insights
            };
        }
        catch (error) {
            logger_1.logger.error('Error tracking confidence level:', error);
            throw error;
        }
    }
    async generateBehaviorInsights(userId) {
        try {
            const memories = await CoachMemory_1.default.findAll({
                where: { userId },
                order: [['conversationDate', 'DESC']],
                limit: 100
            });
            const goals = await KpiTracker_1.default.findAll({
                where: { userId }
            });
            const insights = [];
            const timingPattern = this.analyzeSessionTiming(memories);
            if (timingPattern) {
                insights.push({
                    pattern: 'Session Timing Preference',
                    frequency: timingPattern.frequency,
                    impact: timingPattern.impact,
                    description: timingPattern.description,
                    recommendations: timingPattern.recommendations,
                    relatedGoals: timingPattern.relatedGoals
                });
            }
            const topicPattern = this.analyzeTopicPreferences(memories);
            if (topicPattern) {
                insights.push({
                    pattern: 'Topic Focus Areas',
                    frequency: topicPattern.frequency,
                    impact: topicPattern.impact,
                    description: topicPattern.description,
                    recommendations: topicPattern.recommendations,
                    relatedGoals: topicPattern.relatedGoals
                });
            }
            const achievementPattern = this.analyzeAchievementPatterns(goals);
            if (achievementPattern) {
                insights.push({
                    pattern: 'Goal Achievement Style',
                    frequency: achievementPattern.frequency,
                    impact: achievementPattern.impact,
                    description: achievementPattern.description,
                    recommendations: achievementPattern.recommendations,
                    relatedGoals: achievementPattern.relatedGoals
                });
            }
            const emotionalPattern = this.analyzeEmotionalPatterns(memories);
            if (emotionalPattern) {
                insights.push({
                    pattern: 'Emotional Response Pattern',
                    frequency: emotionalPattern.frequency,
                    impact: emotionalPattern.impact,
                    description: emotionalPattern.description,
                    recommendations: emotionalPattern.recommendations,
                    relatedGoals: emotionalPattern.relatedGoals
                });
            }
            const learningPattern = this.analyzeLearningStyle(memories);
            if (learningPattern) {
                insights.push({
                    pattern: 'Learning Style Preference',
                    frequency: learningPattern.frequency,
                    impact: learningPattern.impact,
                    description: learningPattern.description,
                    recommendations: learningPattern.recommendations,
                    relatedGoals: learningPattern.relatedGoals
                });
            }
            return insights;
        }
        catch (error) {
            logger_1.logger.error('Error generating behavior insights:', error);
            throw error;
        }
    }
    async calculatePercentileRank(userId, metric) {
        try {
            const userAnalytics = await UserAnalytics_1.default.findOne({
                where: { userId },
                order: [['calculatedAt', 'DESC']]
            });
            const userValue = this.extractMetricValue(userAnalytics, metric);
            const peerAnalytics = await UserAnalytics_1.default.findAll({
                where: {
                    userId: { [sequelize_1.Op.ne]: userId },
                    calculatedAt: {
                        [sequelize_1.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                },
                limit: 1000
            });
            const peerValues = peerAnalytics
                .map(p => this.extractMetricValue(p, metric))
                .filter(v => v !== null);
            if (peerValues.length === 0) {
                return {
                    metric,
                    userValue,
                    peerAverage: userValue,
                    topPerformerAverage: userValue,
                    percentileRank: 50,
                    improvementGap: 0,
                    recommendations: ['Not enough peer data for comparison']
                };
            }
            const belowUser = peerValues.filter(v => v < userValue).length;
            const percentileRank = Math.round((belowUser / peerValues.length) * 100);
            const peerAverage = peerValues.reduce((a, b) => a + b, 0) / peerValues.length;
            const sortedValues = peerValues.sort((a, b) => b - a);
            const top10Percent = Math.ceil(peerValues.length * 0.1);
            const topPerformers = sortedValues.slice(0, top10Percent);
            const topPerformerAverage = topPerformers.reduce((a, b) => a + b, 0) / topPerformers.length;
            const improvementGap = topPerformerAverage - userValue;
            const recommendations = await this.generateBenchmarkRecommendations(metric, percentileRank, improvementGap, userValue, peerAverage);
            return {
                metric,
                userValue,
                peerAverage,
                topPerformerAverage,
                percentileRank,
                improvementGap,
                recommendations
            };
        }
        catch (error) {
            logger_1.logger.error('Error calculating percentile rank:', error);
            throw error;
        }
    }
    calculateInteractionDepth(memories) {
        if (memories.length === 0)
            return 0;
        const depths = memories.map(m => {
            const contentLength = m.content?.length || 0;
            const hasActionItems = (m.coachingContext?.actionItems?.length || 0) > 0;
            const hasTags = (m.tags?.length || 0) > 0;
            const hasFollowUp = m.coachingContext?.followUpNeeded || false;
            let depth = 0;
            if (contentLength > 500)
                depth += 0.3;
            else if (contentLength > 200)
                depth += 0.2;
            else if (contentLength > 50)
                depth += 0.1;
            if (hasActionItems)
                depth += 0.3;
            if (hasTags)
                depth += 0.2;
            if (hasFollowUp)
                depth += 0.2;
            return Math.min(1, depth);
        });
        return depths.reduce((a, b) => a + b, 0) / depths.length;
    }
    async calculateFeatureAdoption(userId) {
        const features = [
            'goal_setting',
            'mood_tracking',
            'voice_journal',
            'progress_photos',
            'chat_coaching',
            'habit_tracking',
            'analytics_view'
        ];
        const userAnalytics = await this.analytics.getUserAnalytics(parseInt(userId));
        const usedFeatures = userAnalytics?.features || [];
        return usedFeatures.length / features.length;
    }
    async calculateRetentionRate(userId) {
        const user = await User_1.User.findByPk(userId);
        if (!user)
            return 0;
        const accountAge = Date.now() - new Date(user.createdAt).getTime();
        const daysActive = Math.floor(accountAge / (24 * 60 * 60 * 1000));
        if (daysActive < 7)
            return 1;
        const recentActivity = await CoachMemory_1.default.count({
            where: {
                userId,
                conversationDate: {
                    [sequelize_1.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        });
        return recentActivity > 0 ? 0.8 + (Math.min(recentActivity, 10) * 0.02) : 0.3;
    }
    async calculateChurnRisk(userId, metrics) {
        let risk = 0;
        if (!metrics.dailyActive)
            risk += 0.2;
        if (!metrics.weeklyActive)
            risk += 0.3;
        if ((metrics.sessionFrequency || 0) < 2)
            risk += 0.2;
        if ((metrics.retentionRate || 1) < 0.5)
            risk += 0.3;
        return Math.min(1, risk);
    }
    calculateWeightedEngagementScore(metrics) {
        const weights = {
            dailyActive: 0.15,
            weeklyActive: 0.15,
            monthlyActive: 0.05,
            sessionFrequency: 0.20,
            averageSessionDuration: 0.15,
            interactionDepth: 0.10,
            featureAdoption: 0.10,
            retentionRate: 0.10
        };
        let score = 0;
        score += (metrics.dailyActive ? 1 : 0) * weights.dailyActive;
        score += (metrics.weeklyActive ? 1 : 0) * weights.weeklyActive;
        score += (metrics.monthlyActive ? 1 : 0) * weights.monthlyActive;
        score += Math.min(1, (metrics.sessionFrequency || 0) / 7) * weights.sessionFrequency;
        score += Math.min(1, (metrics.averageSessionDuration || 0) / 30) * weights.averageSessionDuration;
        score += (metrics.interactionDepth || 0) * weights.interactionDepth;
        score += (metrics.featureAdoption || 0) * weights.featureAdoption;
        score += (metrics.retentionRate || 0) * weights.retentionRate;
        score *= (1 - (metrics.churnRisk || 0) * 0.3);
        return Math.min(1, Math.max(0, score));
    }
    async getNPSHistory(userId, period = 'month') {
        const cacheKey = `nps:history:${userId}:${period}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        const memories = await CoachMemory_1.default.findAll({
            where: {
                userId,
                conversationDate: {
                    [sequelize_1.Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                }
            },
            order: [['conversationDate', 'ASC']]
        });
        const history = [];
        const groupSize = period === 'week' ? 7 : period === 'month' ? 30 : 90;
        for (let i = 0; i < memories.length; i += groupSize) {
            const group = memories.slice(i, i + groupSize);
            if (group.length > 0) {
                const avgSentiment = group.reduce((sum, m) => sum + (m.emotionalContext?.sentiment || 0), 0) / group.length;
                history.push({
                    date: group[0].conversationDate,
                    score: Math.round((avgSentiment + 1) * 5)
                });
            }
        }
        await this.cache.set(cacheKey, history, { ttl: 3600 });
        return history;
    }
    calculateNPSTrend(historicalScores) {
        if (historicalScores.length < 2)
            return 'stable';
        const recent = historicalScores.slice(-3);
        const older = historicalScores.slice(0, 3);
        const recentAvg = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
        const olderAvg = older.reduce((sum, h) => sum + h.score, 0) / older.length;
        const difference = recentAvg - olderAvg;
        if (Math.abs(difference) < 0.5)
            return 'stable';
        return difference > 0 ? 'improving' : 'declining';
    }
    async identifyNPSImprovementAreas(userId, memories) {
        const areas = [];
        if (memories.length < 10) {
            areas.push('Increase coaching session frequency');
        }
        const withActionItems = memories.filter(m => m.coachingContext?.actionItems && m.coachingContext.actionItems.length > 0);
        if (withActionItems.length < memories.length * 0.5) {
            areas.push('Create more actionable outcomes from sessions');
        }
        const negativeSentiment = memories.filter(m => (m.emotionalContext?.sentiment || 0) < -0.3);
        if (negativeSentiment.length > memories.length * 0.3) {
            areas.push('Address emotional wellbeing concerns');
        }
        const shallowSessions = memories.filter(m => (m.content?.length || 0) < 100);
        if (shallowSessions.length > memories.length * 0.4) {
            areas.push('Deepen coaching conversation engagement');
        }
        return areas;
    }
    async storeNPSScore(userId, score) {
        await this.analytics.trackUserAction(parseInt(userId), 'nps_score_recorded', { score });
    }
    calculateKPITrend(performanceHistory) {
        if (!performanceHistory || performanceHistory.length < 2)
            return 'stable';
        const recent = performanceHistory.slice(-5);
        const older = performanceHistory.slice(0, 5);
        const recentAvg = recent.reduce((sum, h) => sum + h.value, 0) / recent.length;
        const olderAvg = older.reduce((sum, h) => sum + h.value, 0) / older.length;
        const change = ((recentAvg - olderAvg) / olderAvg) * 100;
        if (Math.abs(change) < 5)
            return 'stable';
        return change > 0 ? 'up' : 'down';
    }
    async forecastKPIValue(kpiTracker) {
        const history = kpiTracker.performanceHistory || [];
        if (history.length < 3)
            return kpiTracker.kpiData?.current || 0;
        const n = history.length;
        const sumX = history.reduce((sum, _, i) => sum + i, 0);
        const sumY = history.reduce((sum, h) => sum + h.value, 0);
        const sumXY = history.reduce((sum, h, i) => sum + i * h.value, 0);
        const sumX2 = history.reduce((sum, _, i) => sum + i * i, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        const forecast = slope * n + intercept;
        return Math.max(0, forecast);
    }
    async generateKPIInsights(kpiTracker, trend) {
        const insights = [];
        if (trend === 'up') {
            insights.push(`${kpiTracker.title} is showing positive momentum`);
        }
        else if (trend === 'down') {
            insights.push(`${kpiTracker.title} needs attention - declining trend detected`);
        }
        if (kpiTracker.overallProgress >= 100) {
            insights.push(`Congratulations! ${kpiTracker.title} target achieved`);
        }
        else if (kpiTracker.overallProgress >= 80) {
            insights.push(`${kpiTracker.title} is close to target - maintain focus`);
        }
        else if (kpiTracker.overallProgress < 30) {
            insights.push(`${kpiTracker.title} requires significant effort to reach target`);
        }
        return insights;
    }
    calculatePerformanceScore(kpis) {
        if (kpis.length === 0)
            return 0;
        const scores = kpis.map(kpi => {
            let score = kpi.achievement / 100;
            if (kpi.trend === 'up')
                score *= 1.1;
            else if (kpi.trend === 'down')
                score *= 0.9;
            return Math.min(1, score);
        });
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    async generateOverallKPIInsights(kpis, summary) {
        const insights = [];
        if (summary.averageAchievement >= 80) {
            insights.push('Outstanding overall KPI performance - keep up the excellent work!');
        }
        else if (summary.averageAchievement >= 60) {
            insights.push('Good KPI progress - focus on underperforming areas');
        }
        else {
            insights.push('KPI performance needs improvement - consider adjusting targets or approach');
        }
        if (summary.improvingKPIs > summary.decliningKPIs) {
            insights.push('Positive momentum across most KPIs');
        }
        else if (summary.decliningKPIs > summary.improvingKPIs) {
            insights.push('Several KPIs showing decline - review and adjust strategies');
        }
        return insights;
    }
    async generateKPIRecommendations(kpis, summary) {
        const recommendations = [];
        const declining = kpis.filter(k => k.trend === 'down');
        if (declining.length > 0) {
            recommendations.push(`Priority focus on improving: ${declining.map(k => k.name).join(', ')}`);
        }
        const achieved = kpis.filter(k => k.achievement >= 100);
        if (achieved.length > 0) {
            recommendations.push(`Set new stretch targets for completed KPIs: ${achieved.map(k => k.name).join(', ')}`);
        }
        const lowPerformers = kpis.filter(k => k.achievement < 30);
        if (lowPerformers.length > 0) {
            recommendations.push(`Consider breaking down or adjusting: ${lowPerformers.map(k => k.name).join(', ')}`);
        }
        return recommendations;
    }
    async calculateCurrentSkillLevel(memories, goals) {
        const recentMemories = memories.slice(0, 10);
        if (recentMemories.length === 0)
            return 0;
        const avgSentiment = recentMemories.reduce((sum, m) => sum + (m.emotionalContext?.sentiment || 0), 0) / recentMemories.length;
        const avgProgress = goals.length > 0 ?
            goals.reduce((sum, g) => sum + g.overallProgress, 0) / goals.length : 50;
        const skillLevel = ((avgSentiment + 1) / 2) * 5 + (avgProgress / 100) * 5;
        return Math.min(10, Math.max(0, skillLevel));
    }
    async calculatePreviousSkillLevel(memories, goals) {
        const olderMemories = memories.slice(10, 20);
        if (olderMemories.length === 0)
            return 0;
        const avgSentiment = olderMemories.reduce((sum, m) => sum + (m.emotionalContext?.sentiment || 0), 0) / olderMemories.length;
        const initialProgress = goals.length > 0 ? 30 : 0;
        const skillLevel = ((avgSentiment + 1) / 2) * 5 + (initialProgress / 100) * 5;
        return Math.min(10, Math.max(0, skillLevel));
    }
    calculateTimeToSkillImprovement(memories, improvement) {
        if (memories.length < 2 || improvement === 0)
            return 0;
        const timeSpan = new Date(memories[0].conversationDate).getTime() -
            new Date(memories[memories.length - 1].conversationDate).getTime();
        const days = Math.floor(timeSpan / (1000 * 60 * 60 * 24));
        return days;
    }
    async generateSkillRecommendations(skillName, currentLevel, improvement, memories) {
        const recommendations = [];
        if (currentLevel < 3) {
            recommendations.push(`Focus on foundational ${skillName} concepts`);
            recommendations.push('Increase practice frequency');
        }
        else if (currentLevel < 7) {
            recommendations.push(`Advance to intermediate ${skillName} techniques`);
            recommendations.push('Set specific measurable goals');
        }
        else {
            recommendations.push(`Master advanced ${skillName} strategies`);
            recommendations.push('Consider mentoring others');
        }
        if (improvement < 0) {
            recommendations.push('Review and adjust current approach');
            recommendations.push('Seek additional resources or support');
        }
        else if (improvement > 2) {
            recommendations.push('Maintain current momentum');
            recommendations.push('Document successful strategies');
        }
        return recommendations;
    }
    async identifyPracticeAreas(skillName, currentLevel, memories) {
        const areas = [];
        const challenges = memories.filter(m => m.coachingContext?.category === 'challenge' ||
            (m.emotionalContext?.sentiment || 0) < 0);
        if (challenges.length > 0) {
            areas.push('Overcoming identified challenges');
        }
        if (currentLevel < 5) {
            areas.push('Daily practice exercises');
            areas.push('Fundamental skill building');
        }
        else {
            areas.push('Advanced technique refinement');
            areas.push('Real-world application');
        }
        return areas;
    }
    applySuccessPredictionModel(features) {
        const weights = {
            engagementScore: 0.25,
            consistencyScore: 0.20,
            sentimentScore: 0.15,
            progressVelocity: 0.15,
            historicalSuccess: 0.15,
            currentMomentum: 0.10
        };
        let probability = 0;
        for (const [key, weight] of Object.entries(weights)) {
            probability += (features[key] || 0) * weight;
        }
        return 1 / (1 + Math.exp(-4 * (probability - 0.5)));
    }
    calculateAverageSentiment(memories) {
        if (memories.length === 0)
            return 0;
        const sentiments = memories.map(m => m.emotionalContext?.sentiment || 0);
        const avg = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
        return (avg + 1) / 2;
    }
    calculateProgressVelocity(goals) {
        if (goals.length === 0)
            return 0;
        const activeGoals = goals.filter(g => g.status === 'in_progress');
        if (activeGoals.length === 0)
            return 0;
        const progressRates = activeGoals.map(g => {
            const daysSinceStart = Math.max(1, (Date.now() - new Date(g.startDate).getTime()) / (1000 * 60 * 60 * 24));
            return g.overallProgress / daysSinceStart;
        });
        const avgRate = progressRates.reduce((a, b) => a + b, 0) / progressRates.length;
        return Math.min(1, avgRate / 1);
    }
    calculateHistoricalSuccessRate(goals) {
        const completedGoals = goals.filter(g => g.status === 'completed');
        const totalGoals = goals.filter(g => g.status === 'completed' || g.status === 'failed');
        if (totalGoals.length === 0)
            return 0.5;
        return completedGoals.length / totalGoals.length;
    }
    calculateCurrentMomentum(memories, goals) {
        const recentMemories = memories.filter(m => new Date(m.conversationDate) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        const recentProgress = goals
            .filter(g => g.status === 'in_progress')
            .reduce((sum, g) => {
            const recent = (g.performanceHistory || [])
                .filter(h => new Date(h.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
            return sum + recent.length;
        }, 0);
        const activityScore = Math.min(1, recentMemories.length / 7);
        const progressScore = Math.min(1, recentProgress / 7);
        return (activityScore + progressScore) / 2;
    }
    identifyRiskFactors(features, memories, goals) {
        const risks = [];
        if (features.engagementScore < 0.3) {
            risks.push('Low engagement levels may impact goal achievement');
        }
        if (features.consistencyScore < 0.4) {
            risks.push('Inconsistent coaching patterns reduce success likelihood');
        }
        if (features.sentimentScore < 0.4) {
            risks.push('Negative emotional state affecting motivation');
        }
        if (features.progressVelocity < 0.2) {
            risks.push('Slow progress pace may lead to goal abandonment');
        }
        const stalledGoals = goals.filter(g => g.status === 'in_progress' && g.overallProgress < 20);
        if (stalledGoals.length > 0) {
            risks.push('Multiple stalled goals requiring intervention');
        }
        return risks;
    }
    identifySuccessFactors(features, memories, goals) {
        const factors = [];
        if (features.engagementScore > 0.7) {
            factors.push('High engagement supporting consistent progress');
        }
        if (features.consistencyScore > 0.7) {
            factors.push('Excellent coaching consistency');
        }
        if (features.sentimentScore > 0.6) {
            factors.push('Positive emotional state enhancing motivation');
        }
        if (features.historicalSuccess > 0.7) {
            factors.push('Strong track record of goal achievement');
        }
        const completedGoals = goals.filter(g => g.status === 'completed');
        if (completedGoals.length > 3) {
            factors.push('Proven ability to complete multiple goals');
        }
        return factors;
    }
    async generateSuccessActions(features, riskFactors, successFactors) {
        const actions = [];
        if (features.engagementScore < 0.5) {
            actions.push('Schedule daily check-ins to boost engagement');
        }
        if (features.consistencyScore < 0.5) {
            actions.push('Establish fixed coaching schedule');
        }
        if (features.progressVelocity < 0.3) {
            actions.push('Break down goals into smaller milestones');
        }
        if (successFactors.length > 2) {
            actions.push('Maintain current successful strategies');
        }
        actions.push('Track progress daily for accountability');
        actions.push('Celebrate small wins to maintain momentum');
        return actions;
    }
    calculatePredictionConfidence(memories, goals) {
        let confidence = 0.5;
        if (memories.length > 50)
            confidence += 0.2;
        else if (memories.length > 20)
            confidence += 0.1;
        if (goals.length > 5)
            confidence += 0.2;
        else if (goals.length > 2)
            confidence += 0.1;
        const recentMemories = memories.filter(m => new Date(m.conversationDate) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000));
        if (recentMemories.length > 7)
            confidence += 0.1;
        return Math.min(0.95, confidence);
    }
    estimateTimeToGoal(goals, features) {
        const activeGoals = goals.filter(g => g.status === 'in_progress');
        if (activeGoals.length === 0)
            return 0;
        const avgProgress = activeGoals.reduce((sum, g) => sum + g.overallProgress, 0) / activeGoals.length;
        const remainingProgress = 100 - avgProgress;
        if (features.progressVelocity === 0)
            return 365;
        const estimatedDays = remainingProgress / features.progressVelocity;
        return Math.min(365, Math.max(1, estimatedDays));
    }
    async generateConfidenceInsights(area, currentLevel, previousLevel, trend) {
        const insights = [];
        if (trend === 'improving') {
            insights.push(`Great progress! Your confidence in ${area} is increasing`);
        }
        else if (trend === 'declining') {
            insights.push(`Your confidence in ${area} needs attention`);
        }
        if (currentLevel >= 8) {
            insights.push(`Excellent confidence level in ${area} - leverage this strength`);
        }
        else if (currentLevel <= 3) {
            insights.push(`Low confidence in ${area} - consider additional support or practice`);
        }
        const change = currentLevel - previousLevel;
        if (Math.abs(change) > 2) {
            insights.push(`Significant confidence shift detected (${change > 0 ? '+' : ''}${change.toFixed(1)})`);
        }
        return insights;
    }
    analyzeSessionTiming(memories) {
        if (memories.length < 5)
            return null;
        const hours = memories.map(m => new Date(m.conversationDate).getHours());
        const morning = hours.filter(h => h >= 6 && h < 12).length;
        const afternoon = hours.filter(h => h >= 12 && h < 18).length;
        const evening = hours.filter(h => h >= 18 && h < 24).length;
        const total = morning + afternoon + evening;
        const maxTime = Math.max(morning, afternoon, evening);
        let preferredTime = 'morning';
        if (afternoon === maxTime)
            preferredTime = 'afternoon';
        if (evening === maxTime)
            preferredTime = 'evening';
        return {
            frequency: maxTime / total,
            impact: 'positive',
            description: `User prefers ${preferredTime} coaching sessions (${Math.round(maxTime / total * 100)}% of sessions)`,
            recommendations: [
                `Schedule priority sessions in the ${preferredTime}`,
                'Respect user\'s natural rhythm for better engagement'
            ],
            relatedGoals: []
        };
    }
    analyzeTopicPreferences(memories) {
        if (memories.length < 5)
            return null;
        const topics = {};
        memories.forEach(m => {
            const topic = m.coachingContext?.topic || 'general';
            topics[topic] = (topics[topic] || 0) + 1;
        });
        const sortedTopics = Object.entries(topics)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        if (sortedTopics.length === 0)
            return null;
        return {
            frequency: sortedTopics[0][1] / memories.length,
            impact: 'positive',
            description: `Primary focus areas: ${sortedTopics.map(t => t[0]).join(', ')}`,
            recommendations: [
                `Deepen exploration of ${sortedTopics[0][0]}`,
                'Connect other topics to areas of high interest'
            ],
            relatedGoals: []
        };
    }
    analyzeAchievementPatterns(goals) {
        if (goals.length < 2)
            return null;
        const completed = goals.filter(g => g.status === 'completed');
        const completionRate = completed.length / goals.length;
        const goalTypes = {};
        completed.forEach(g => {
            const type = g.type || 'general';
            goalTypes[type] = (goalTypes[type] || 0) + 1;
        });
        return {
            frequency: completionRate,
            impact: completionRate > 0.5 ? 'positive' : 'negative',
            description: `${Math.round(completionRate * 100)}% goal completion rate`,
            recommendations: completionRate > 0.5 ? [
                'Continue successful goal-setting approach',
                'Consider setting stretch goals'
            ] : [
                'Break goals into smaller milestones',
                'Review goal feasibility and timeline'
            ],
            relatedGoals: goals.map(g => g.id)
        };
    }
    analyzeEmotionalPatterns(memories) {
        if (memories.length < 5)
            return null;
        const sentiments = memories.map(m => m.emotionalContext?.sentiment || 0);
        const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
        const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - avgSentiment, 2), 0) / sentiments.length;
        const volatility = Math.sqrt(variance);
        return {
            frequency: 1,
            impact: avgSentiment > 0 ? 'positive' : 'negative',
            description: `${avgSentiment > 0 ? 'Positive' : 'Negative'} emotional baseline with ${volatility < 0.3 ? 'stable' : 'variable'} mood patterns`,
            recommendations: avgSentiment > 0 ? [
                'Leverage positive emotional state for challenging goals',
                'Maintain mood-supporting practices'
            ] : [
                'Prioritize emotional wellbeing activities',
                'Consider mood-lifting coaching techniques'
            ],
            relatedGoals: []
        };
    }
    analyzeLearningStyle(memories) {
        if (memories.length < 5)
            return null;
        const withActionItems = memories.filter(m => m.coachingContext?.actionItems && m.coachingContext.actionItems.length > 0);
        const actionOriented = withActionItems.length / memories.length;
        const longContent = memories.filter(m => (m.content?.length || 0) > 500);
        const reflective = longContent.length / memories.length;
        let style = 'balanced';
        if (actionOriented > 0.7)
            style = 'action-oriented';
        else if (reflective > 0.7)
            style = 'reflective';
        return {
            frequency: 1,
            impact: 'positive',
            description: `Learning style: ${style}`,
            recommendations: style === 'action-oriented' ? [
                'Provide concrete action steps',
                'Focus on practical applications'
            ] : style === 'reflective' ? [
                'Allow time for deep exploration',
                'Use thought-provoking questions'
            ] : [
                'Mix action items with reflection',
                'Vary coaching techniques'
            ],
            relatedGoals: []
        };
    }
    extractMetricValue(analytics, metric) {
        if (!analytics)
            return 0;
        switch (metric) {
            case 'engagement':
                return analytics ? (analytics.engagementMetrics.participationScore * 0.4 + analytics.engagementMetrics.followThroughRate * 0.4 + analytics.engagementMetrics.responsiveness * 0.2) : 0;
            case 'goal_completion':
                return analytics.coachingMetrics?.goalCompletionRate || 0;
            case 'consistency':
                return analytics.coachingMetrics?.goalCompletionRate || 0;
            case 'satisfaction':
                return analytics.coachingMetrics?.goalCompletionRate || 0;
            default:
                return 0;
        }
    }
    async generateBenchmarkRecommendations(metric, percentileRank, improvementGap, userValue, peerAverage) {
        const recommendations = [];
        if (percentileRank < 25) {
            recommendations.push(`Focus on improving ${metric} - currently in bottom quartile`);
            recommendations.push('Study top performer strategies');
        }
        else if (percentileRank > 75) {
            recommendations.push(`Excellent ${metric} performance - maintain current approach`);
            recommendations.push('Consider mentoring others');
        }
        if (improvementGap > 0) {
            const percentImprovement = (improvementGap / userValue) * 100;
            recommendations.push(`${Math.round(percentImprovement)}% improvement potential in ${metric}`);
        }
        if (userValue < peerAverage * 0.8) {
            recommendations.push('Review and adjust current strategies');
        }
        return recommendations;
    }
    calculateConsistencyIndex(memories) {
        if (memories.length < 3)
            return 0.5;
        const sortedMemories = memories.sort((a, b) => new Date(a.conversationDate).getTime() - new Date(b.conversationDate).getTime());
        const intervals = [];
        for (let i = 1; i < sortedMemories.length; i++) {
            const daysBetween = Math.floor((new Date(sortedMemories[i].conversationDate).getTime() -
                new Date(sortedMemories[i - 1].conversationDate).getTime()) / (1000 * 60 * 60 * 24));
            intervals.push(daysBetween);
        }
        const meanInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - meanInterval, 2), 0) / intervals.length;
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = meanInterval > 0 ? standardDeviation / meanInterval : 1;
        const consistencyScore = Math.max(0, 1 - (coefficientOfVariation / 2));
        return Math.min(1, consistencyScore);
    }
}
exports.CoachIntelligenceServiceEnhanced = CoachIntelligenceServiceEnhanced;
exports.coachIntelligenceService = new CoachIntelligenceServiceEnhanced();
//# sourceMappingURL=CoachIntelligenceServiceEnhanced.js.map