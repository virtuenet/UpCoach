"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealTimeInsightsGenerator = void 0;
const events_1 = require("events");
const ioredis_1 = require("ioredis");
const perf_hooks_1 = require("perf_hooks");
const sequelize_1 = require("sequelize");
const UserAnalytics_1 = __importDefault(require("../../models/analytics/UserAnalytics"));
const KpiTracker_1 = __importDefault(require("../../models/analytics/KpiTracker"));
const CoachMemory_1 = __importDefault(require("../../models/coaching/CoachMemory"));
const Goal_1 = __importDefault(require("../../models/Goal"));
const logger_1 = require("../../utils/logger");
const PredictiveCoachingEngine_1 = __importDefault(require("./PredictiveCoachingEngine"));
class RealTimeInsightsGenerator extends events_1.EventEmitter {
    redis;
    insightRules;
    insightCache;
    generationQueue;
    streamManager;
    constructor() {
        super();
        this.redis = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            db: 3,
        });
        this.insightRules = new Map();
        this.insightCache = new Map();
        this.generationQueue = new Set();
        this.streamManager = new StreamManager();
        this.initializeRules();
        this.startGenerationWorker();
    }
    initializeRules() {
        this.addRule({
            id: 'goal_at_risk',
            name: 'Goal at Risk Detection',
            condition: (data) => data.goalProgress < 0.3 && data.daysRemaining < 14,
            generator: this.generateGoalAtRiskInsight.bind(this),
            priority: 9,
            enabled: true,
        });
        this.addRule({
            id: 'streak_achievement',
            name: 'Streak Achievement',
            condition: (data) => data.streakDays >= 7,
            generator: this.generateStreakInsight.bind(this),
            priority: 7,
            enabled: true,
        });
        this.addRule({
            id: 'engagement_drop',
            name: 'Engagement Drop Detection',
            condition: (data) => data.engagementTrend === 'decreasing' && data.dropPercent > 20,
            generator: this.generateEngagementDropInsight.bind(this),
            priority: 8,
            enabled: true,
        });
        this.addRule({
            id: 'skill_improvement',
            name: 'Skill Improvement Detection',
            condition: (data) => data.skillImprovement > 15,
            generator: this.generateSkillImprovementInsight.bind(this),
            priority: 6,
            enabled: true,
        });
        this.addRule({
            id: 'optimal_time',
            name: 'Optimal Time Discovery',
            condition: (data) => data.hasOptimalTime && data.confidence > 0.8,
            generator: this.generateOptimalTimeInsight.bind(this),
            priority: 5,
            enabled: true,
        });
        logger_1.logger.info(`Initialized ${this.insightRules.size} insight generation rules`);
    }
    async generateInsights(context) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const cached = this.getCachedInsights(context.userId);
            if (cached && this.isCacheValid(cached, context)) {
                return this.filterInsights(cached, context);
            }
            const userData = await this.fetchUserData(context.userId, context.timeframe);
            const analysisResults = await this.analyzeUserData(userData);
            const insights = await this.applyRules(analysisResults, context);
            const enhancedInsights = await this.enhanceWithPredictions(insights, userData);
            const finalInsights = this.rankAndFilter(enhancedInsights, context);
            this.cacheInsights(context.userId, finalInsights);
            const generationTime = perf_hooks_1.performance.now() - startTime;
            logger_1.logger.info(`Generated ${finalInsights.length} insights in ${generationTime}ms`);
            this.emit('insights:generated', {
                userId: context.userId,
                count: finalInsights.length,
                generationTime,
            });
            return finalInsights;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate insights', error);
            throw error;
        }
    }
    async *streamInsights(userId, options = {}) {
        const interval = options.interval || 5000;
        const stream = this.streamManager.createStream(userId);
        while (!options.stopCondition || !options.stopCondition()) {
            const insights = await this.generateInsights({
                userId,
                timeframe: '1d',
                minImportance: 0.5,
            });
            for (const insight of insights) {
                if (!stream.hasDelivered(insight.id)) {
                    yield insight;
                    stream.markDelivered(insight.id);
                }
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
    async generateContextualInsight(userId, context) {
        try {
            const recentData = await this.fetchRecentData(userId, 1);
            const contextAnalysis = this.analyzeContext(context, recentData);
            if (contextAnalysis.needsMotivation) {
                return this.generateMotivationalInsight(userId, contextAnalysis);
            }
            else if (contextAnalysis.needsGuidance) {
                return this.generateGuidanceInsight(userId, contextAnalysis);
            }
            else if (contextAnalysis.hasOpportunity) {
                return this.generateOpportunityInsight(userId, contextAnalysis);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate contextual insight', error);
            return null;
        }
    }
    async generateComparativeInsights(userId, comparisonGroup) {
        try {
            const comparisonData = await this.fetchComparisonData(userId, comparisonGroup);
            const analysis = this.analyzeComparisons(comparisonData);
            const insights = [];
            if (analysis.strengths.length > 0) {
                insights.push(this.generateStrengthInsight(userId, analysis.strengths));
            }
            if (analysis.improvements.length > 0) {
                insights.push(this.generateImprovementInsight(userId, analysis.improvements));
            }
            if (analysis.opportunities.length > 0) {
                insights.push(this.generateOpportunityInsight(userId, analysis.opportunities));
            }
            return insights;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate comparative insights', error);
            return [];
        }
    }
    async generatePredictiveInsights(userId) {
        try {
            const insights = [];
            const goalPredictions = await PredictiveCoachingEngine_1.default.predictGoalSuccess(userId, userId, 30);
            if (goalPredictions.probability < 0.5) {
                insights.push(this.generateGoalRiskInsight(userId, goalPredictions));
            }
            const engagementPredictions = await PredictiveCoachingEngine_1.default.predictEngagement(userId);
            if (engagementPredictions.riskOfDisengagement > 0.7) {
                insights.push(this.generateDisengagementRiskInsight(userId, engagementPredictions));
            }
            const behaviorPredictions = await PredictiveCoachingEngine_1.default.predictBehaviorPatterns(userId);
            for (const pattern of behaviorPredictions.patterns) {
                if (pattern.type === 'negative' && pattern.strength > 0.6) {
                    insights.push(this.generateBehaviorPatternInsight(userId, pattern));
                }
            }
            return insights;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate predictive insights', error);
            return [];
        }
    }
    addRule(rule) {
        this.insightRules.set(rule.id, rule);
    }
    removeRule(ruleId) {
        this.insightRules.delete(ruleId);
    }
    toggleRule(ruleId, enabled) {
        const rule = this.insightRules.get(ruleId);
        if (rule) {
            rule.enabled = enabled;
        }
    }
    async fetchUserData(userId, timeframe) {
        const [analytics, memories, goals, kpis] = await Promise.all([
            UserAnalytics_1.default.findOne({ where: { userId } }),
            CoachMemory_1.default.findAll({
                where: {
                    userId,
                    createdAt: { [sequelize_1.Op.gte]: this.getTimeframeDate(timeframe) },
                },
            }),
            Goal_1.default.findAll({ where: { userId } }),
            KpiTracker_1.default.findAll({ where: { userId } }),
        ]);
        return { analytics, memories, goals, kpis };
    }
    async analyzeUserData(data) {
        const analysis = {
            goalProgress: this.calculateGoalProgress(data.goals),
            goalsAtRisk: this.identifyGoalsAtRisk(data.goals),
            engagementScore: data.analytics?.engagementScore || 0,
            engagementTrend: this.calculateEngagementTrend(data.memories),
            streakDays: this.calculateStreak(data.memories),
            performanceMetrics: this.calculatePerformanceMetrics(data.kpis),
            skillImprovement: this.calculateSkillImprovement(data.kpis),
            patterns: await this.extractPatterns(data.memories),
            optimalTimes: this.identifyOptimalTimes(data.memories),
            lastActive: data.analytics?.lastActive,
            totalSessions: data.memories.filter(m => m.type === 'session').length,
        };
        return analysis;
    }
    async applyRules(analysis, context) {
        const insights = [];
        for (const [ruleId, rule] of this.insightRules) {
            if (!rule.enabled)
                continue;
            try {
                if (rule.condition(analysis)) {
                    const insight = rule.generator(analysis);
                    if (insight && (!context.excludeTypes || !context.excludeTypes.includes(insight.type))) {
                        insights.push(insight);
                    }
                }
            }
            catch (error) {
                logger_1.logger.error(`Failed to apply rule ${ruleId}`, error);
            }
        }
        return insights;
    }
    async enhanceWithPredictions(insights, userData) {
        for (const insight of insights) {
            if (insight.type === 'risk' || insight.type === 'opportunity') {
                const prediction = await this.getPredictionForInsight(insight, userData);
                if (prediction) {
                    insight.supportingData.metrics['predicted_outcome'] = prediction.probability;
                    insight.supportingData.trends.push({
                        metric: 'predicted_trend',
                        period: '30d',
                        direction: prediction.trend,
                        changePercent: prediction.change,
                        significance: prediction.confidence,
                    });
                }
            }
        }
        return insights;
    }
    rankAndFilter(insights, context) {
        const scoredInsights = insights.map(insight => ({
            insight,
            score: this.calculateRelevanceScore(insight, context),
        }));
        scoredInsights.sort((a, b) => b.score - a.score);
        let filtered = scoredInsights
            .filter(item => !context.minImportance || item.insight.importance >= context.minImportance)
            .map(item => item.insight);
        if (context.maxInsights) {
            filtered = filtered.slice(0, context.maxInsights);
        }
        return filtered;
    }
    calculateRelevanceScore(insight, context) {
        let score = insight.importance * 0.4 + insight.urgency * 0.3 + insight.confidence * 0.3;
        if (context.focus && context.focus.includes(insight.category)) {
            score *= 1.5;
        }
        if (insight.actionable) {
            score *= 1.2;
        }
        return Math.min(1, score);
    }
    getCachedInsights(userId) {
        return this.insightCache.get(userId) || null;
    }
    isCacheValid(insights, context) {
        if (insights.length === 0)
            return false;
        const oldestInsight = insights.reduce((oldest, current) => current.timestamp < oldest.timestamp ? current : oldest);
        const cacheAge = Date.now() - oldestInsight.timestamp.getTime();
        const maxAge = this.getMaxCacheAge(context.timeframe);
        return cacheAge < maxAge;
    }
    filterInsights(insights, context) {
        return insights.filter(insight => {
            if (context.excludeTypes && context.excludeTypes.includes(insight.type)) {
                return false;
            }
            if (context.minImportance && insight.importance < context.minImportance) {
                return false;
            }
            return true;
        });
    }
    cacheInsights(userId, insights) {
        this.insightCache.set(userId, insights);
        this.redis.setex(`insights:${userId}`, 3600, JSON.stringify(insights));
    }
    startGenerationWorker() {
        setInterval(async () => {
            for (const userId of this.generationQueue) {
                try {
                    await this.generateInsights({
                        userId,
                        timeframe: '7d',
                        minImportance: 0.5,
                    });
                    this.generationQueue.delete(userId);
                }
                catch (error) {
                    logger_1.logger.error(`Failed to generate insights for user ${userId}`, error);
                }
            }
        }, 30000);
    }
    generateGoalAtRiskInsight(data) {
        const goalAtRisk = data.goalsAtRisk[0];
        return {
            id: `goal_risk_${Date.now()}`,
            userId: data.userId,
            type: 'risk',
            category: 'goal',
            title: 'Goal at Risk',
            description: `Your goal "${goalAtRisk.title}" is at risk of not being completed on time`,
            importance: 0.9,
            urgency: 0.95,
            confidence: 0.85,
            actionable: true,
            actions: [
                {
                    id: 'action_1',
                    action: 'Review and adjust your goal timeline',
                    priority: 'high',
                    estimatedImpact: 0.7,
                    estimatedEffort: 'low',
                },
                {
                    id: 'action_2',
                    action: 'Break down the goal into smaller tasks',
                    priority: 'medium',
                    estimatedImpact: 0.6,
                    estimatedEffort: 'medium',
                },
            ],
            supportingData: {
                metrics: {
                    current_progress: goalAtRisk.progress,
                    required_progress: goalAtRisk.requiredProgress,
                    days_remaining: goalAtRisk.daysRemaining,
                },
                trends: [],
                comparisons: [],
            },
            relatedInsights: [],
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
    }
    generateStreakInsight(data) {
        return {
            id: `streak_${Date.now()}`,
            userId: data.userId,
            type: 'achievement',
            category: 'engagement',
            title: `${data.streakDays} Day Streak!`,
            description: `Congratulations! You've maintained a ${data.streakDays} day streak`,
            importance: 0.7,
            urgency: 0.3,
            confidence: 1.0,
            actionable: true,
            actions: [
                {
                    id: 'action_1',
                    action: 'Share your achievement',
                    priority: 'low',
                    estimatedImpact: 0.3,
                    estimatedEffort: 'low',
                },
            ],
            supportingData: {
                metrics: {
                    streak_days: data.streakDays,
                    consistency_score: data.consistencyScore,
                },
                trends: [],
                comparisons: [],
            },
            relatedInsights: [],
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
    }
    generateEngagementDropInsight(data) {
        return {
            id: `engagement_drop_${Date.now()}`,
            userId: data.userId,
            type: 'risk',
            category: 'engagement',
            title: 'Engagement Decrease Detected',
            description: `Your engagement has decreased by ${data.dropPercent}% this week`,
            importance: 0.8,
            urgency: 0.7,
            confidence: 0.9,
            actionable: true,
            actions: [
                {
                    id: 'action_1',
                    action: 'Schedule shorter, more frequent sessions',
                    priority: 'high',
                    estimatedImpact: 0.6,
                    estimatedEffort: 'low',
                },
                {
                    id: 'action_2',
                    action: 'Review and adjust your goals',
                    priority: 'medium',
                    estimatedImpact: 0.5,
                    estimatedEffort: 'medium',
                },
            ],
            supportingData: {
                metrics: {
                    engagement_drop: data.dropPercent,
                    current_engagement: data.engagementScore,
                },
                trends: [
                    {
                        metric: 'engagement',
                        period: '7d',
                        direction: 'down',
                        changePercent: data.dropPercent,
                        significance: 0.9,
                    },
                ],
                comparisons: [],
            },
            relatedInsights: [],
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        };
    }
    generateSkillImprovementInsight(data) {
        return {
            id: `skill_improvement_${Date.now()}`,
            userId: data.userId,
            type: 'achievement',
            category: 'learning',
            title: 'Skill Improvement Detected',
            description: `Your skills have improved by ${data.skillImprovement}% this month`,
            importance: 0.8,
            urgency: 0.4,
            confidence: 0.85,
            actionable: true,
            actions: [
                {
                    id: 'action_1',
                    action: 'Take on more challenging tasks',
                    priority: 'medium',
                    estimatedImpact: 0.7,
                    estimatedEffort: 'medium',
                },
            ],
            supportingData: {
                metrics: {
                    improvement_percent: data.skillImprovement,
                },
                trends: [],
                comparisons: [],
            },
            relatedInsights: [],
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
    }
    generateOptimalTimeInsight(data) {
        return {
            id: `optimal_time_${Date.now()}`,
            userId: data.userId,
            type: 'opportunity',
            category: 'performance',
            title: 'Optimal Performance Time Identified',
            description: `You perform best during ${data.optimalTime}`,
            importance: 0.7,
            urgency: 0.5,
            confidence: data.confidence,
            actionable: true,
            actions: [
                {
                    id: 'action_1',
                    action: `Schedule important tasks during ${data.optimalTime}`,
                    priority: 'medium',
                    estimatedImpact: 0.8,
                    estimatedEffort: 'low',
                },
            ],
            supportingData: {
                metrics: {
                    performance_boost: data.performanceBoost,
                    confidence: data.confidence,
                },
                trends: [],
                comparisons: [],
            },
            relatedInsights: [],
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        };
    }
    getTimeframeDate(timeframe) {
        const now = new Date();
        const match = timeframe.match(/(\d+)([hdwmy])/);
        if (!match)
            return now;
        const [, value, unit] = match;
        const amount = parseInt(value);
        switch (unit) {
            case 'h': return new Date(now.getTime() - amount * 60 * 60 * 1000);
            case 'd': return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
            case 'w': return new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
            case 'm': return new Date(now.getTime() - amount * 30 * 24 * 60 * 60 * 1000);
            case 'y': return new Date(now.getTime() - amount * 365 * 24 * 60 * 60 * 1000);
            default: return now;
        }
    }
    getMaxCacheAge(timeframe) {
        const match = timeframe.match(/(\d+)([hdwmy])/);
        if (!match)
            return 3600000;
        const [, , unit] = match;
        switch (unit) {
            case 'h': return 300000;
            case 'd': return 3600000;
            case 'w': return 21600000;
            default: return 86400000;
        }
    }
    calculateGoalProgress(goals) {
        if (!goals || goals.length === 0)
            return 0;
        const totalProgress = goals.reduce((sum, g) => sum + (g.progress || 0), 0);
        return totalProgress / goals.length;
    }
    identifyGoalsAtRisk(goals) {
        return goals.filter(g => g.progress < 0.5 && g.daysRemaining < 14);
    }
    calculateEngagementTrend(memories) {
        return 'stable';
    }
    calculateStreak(memories) {
        return 7;
    }
    calculatePerformanceMetrics(kpis) {
        return {};
    }
    calculateSkillImprovement(kpis) {
        return 15;
    }
    async extractPatterns(memories) {
        return [];
    }
    identifyOptimalTimes(memories) {
        return { hasOptimalTime: true, optimalTime: '9:00 AM - 11:00 AM', confidence: 0.85 };
    }
    async getPredictionForInsight(insight, userData) {
        return {
            probability: 0.75,
            trend: 'up',
            change: 15,
            confidence: 0.8,
        };
    }
    async fetchRecentData(userId, hours) {
        return {};
    }
    analyzeContext(context, data) {
        return {
            needsMotivation: false,
            needsGuidance: true,
            hasOpportunity: false,
        };
    }
    async generateMotivationalInsight(userId, analysis) {
        return this.generateStreakInsight({ userId, streakDays: 7 });
    }
    async generateGuidanceInsight(userId, analysis) {
        return this.generateOptimalTimeInsight({ userId, optimalTime: '9:00 AM', confidence: 0.8 });
    }
    async generateOpportunityInsight(userId, analysis) {
        return this.generateSkillImprovementInsight({ userId, skillImprovement: 20 });
    }
    async fetchComparisonData(userId, group) {
        return {};
    }
    analyzeComparisons(data) {
        return {
            strengths: [],
            improvements: [],
            opportunities: [],
        };
    }
    generateStrengthInsight(userId, strengths) {
        return this.generateSkillImprovementInsight({ userId, skillImprovement: 25 });
    }
    generateImprovementInsight(userId, improvements) {
        return this.generateEngagementDropInsight({ userId, dropPercent: 10, engagementScore: 70 });
    }
    generateGoalRiskInsight(userId, predictions) {
        return this.generateGoalAtRiskInsight({
            userId,
            goalsAtRisk: [{ title: 'Goal', progress: 0.3, requiredProgress: 0.5, daysRemaining: 10 }]
        });
    }
    generateDisengagementRiskInsight(userId, predictions) {
        return this.generateEngagementDropInsight({ userId, dropPercent: 25, engagementScore: 60 });
    }
    generateBehaviorPatternInsight(userId, pattern) {
        return this.generateOptimalTimeInsight({ userId, optimalTime: '10:00 AM', confidence: 0.9 });
    }
}
exports.RealTimeInsightsGenerator = RealTimeInsightsGenerator;
class StreamManager {
    streams;
    constructor() {
        this.streams = new Map();
    }
    createStream(userId) {
        if (!this.streams.has(userId)) {
            this.streams.set(userId, new UserStream(userId));
        }
        return this.streams.get(userId);
    }
    closeStream(userId) {
        this.streams.delete(userId);
    }
}
class UserStream {
    userId;
    deliveredInsights;
    constructor(userId) {
        this.userId = userId;
        this.deliveredInsights = new Set();
    }
    hasDelivered(insightId) {
        return this.deliveredInsights.has(insightId);
    }
    markDelivered(insightId) {
        this.deliveredInsights.add(insightId);
    }
}
exports.default = new RealTimeInsightsGenerator();
//# sourceMappingURL=RealTimeInsightsGenerator.js.map