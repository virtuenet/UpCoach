"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsPipelineService = void 0;
const events_1 = require("events");
const ioredis_1 = require("ioredis");
const perf_hooks_1 = require("perf_hooks");
const sequelize_1 = require("sequelize");
const crypto = __importStar(require("crypto"));
const UserAnalytics_1 = __importDefault(require("../../models/analytics/UserAnalytics"));
const KpiTracker_1 = __importDefault(require("../../models/analytics/KpiTracker"));
const CoachMemory_1 = __importDefault(require("../../models/coaching/CoachMemory"));
const logger_1 = require("../../utils/logger");
class AnalyticsPipelineService extends events_1.EventEmitter {
    redis;
    pubsub;
    pipelines;
    windows;
    processingQueue;
    metricsBuffer;
    aggregationInterval;
    constructor() {
        super();
        this.redis = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            db: 1,
        });
        this.pubsub = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        });
        this.pipelines = new Map();
        this.windows = new Map();
        this.processingQueue = [];
        this.metricsBuffer = new Map();
        this.initializePipelines();
        this.startAggregationWorker();
    }
    initializePipelines() {
        this.createPipeline({
            name: 'engagement',
            stages: [
                {
                    name: 'ingestion',
                    type: 'ingestion',
                    processor: this.ingestEngagementData.bind(this),
                },
                {
                    name: 'validation',
                    type: 'validation',
                    processor: this.validateEngagementData.bind(this),
                },
                {
                    name: 'transformation',
                    type: 'transformation',
                    processor: this.transformEngagementData.bind(this),
                },
                {
                    name: 'enrichment',
                    type: 'enrichment',
                    processor: this.enrichEngagementData.bind(this),
                },
                {
                    name: 'aggregation',
                    type: 'aggregation',
                    processor: this.aggregateEngagementMetrics.bind(this),
                },
                {
                    name: 'storage',
                    type: 'storage',
                    processor: this.storeEngagementMetrics.bind(this),
                },
            ],
            errorHandler: this.handlePipelineError.bind(this),
            monitoring: true,
        });
        this.createPipeline({
            name: 'goal_progress',
            stages: [
                {
                    name: 'ingestion',
                    type: 'ingestion',
                    processor: this.ingestGoalData.bind(this),
                },
                {
                    name: 'validation',
                    type: 'validation',
                    processor: this.validateGoalData.bind(this),
                },
                {
                    name: 'transformation',
                    type: 'transformation',
                    processor: this.calculateGoalMetrics.bind(this),
                },
                {
                    name: 'enrichment',
                    type: 'enrichment',
                    processor: this.enrichGoalContext.bind(this),
                },
                {
                    name: 'storage',
                    type: 'storage',
                    processor: this.storeGoalMetrics.bind(this),
                },
            ],
        });
        this.createPipeline({
            name: 'behavioral',
            stages: [
                {
                    name: 'ingestion',
                    type: 'ingestion',
                    processor: this.ingestBehavioralData.bind(this),
                },
                {
                    name: 'transformation',
                    type: 'transformation',
                    processor: this.extractBehavioralPatterns.bind(this),
                },
                {
                    name: 'enrichment',
                    type: 'enrichment',
                    processor: this.analyzeBehavioralTrends.bind(this),
                },
                {
                    name: 'aggregation',
                    type: 'aggregation',
                    processor: this.aggregateBehavioralMetrics.bind(this),
                },
                {
                    name: 'storage',
                    type: 'storage',
                    processor: this.storeBehavioralInsights.bind(this),
                },
            ],
            rateLimit: 100,
        });
        logger_1.logger.info('Analytics pipelines initialized');
    }
    createPipeline(config) {
        this.pipelines.set(config.name, config);
        logger_1.logger.info(`Pipeline ${config.name} created with ${config.stages.length} stages`);
    }
    async processMetric(metric) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const key = `${metric.userId}:${metric.metricType}`;
            if (!this.metricsBuffer.has(key)) {
                this.metricsBuffer.set(key, []);
            }
            this.metricsBuffer.get(key).push(metric);
            if (this.metricsBuffer.get(key).length >= 100) {
                await this.flushMetricsBuffer(key);
            }
            this.emit('metric:processed', metric);
            const processingTime = perf_hooks_1.performance.now() - startTime;
            if (processingTime > 100) {
                logger_1.logger.warn(`Slow metric processing: ${processingTime}ms for ${metric.metricType}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to process metric', error, { metric });
            this.emit('metric:error', { metric, error });
        }
    }
    async executePipeline(pipelineName, data) {
        const pipeline = this.pipelines.get(pipelineName);
        if (!pipeline) {
            throw new Error(`Pipeline ${pipelineName} not found`);
        }
        let result = data;
        const executionContext = {
            pipelineId: crypto.randomUUID(),
            startTime: Date.now(),
            stages: [],
        };
        for (const stage of pipeline.stages) {
            const stageStart = perf_hooks_1.performance.now();
            try {
                if (stage.timeout) {
                    result = await Promise.race([
                        stage.processor(result),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Stage timeout')), stage.timeout)),
                    ]);
                }
                else {
                    result = await stage.processor(result);
                }
                executionContext.stages.push({
                    name: stage.name,
                    duration: perf_hooks_1.performance.now() - stageStart,
                    success: true,
                });
            }
            catch (error) {
                if (pipeline.errorHandler) {
                    pipeline.errorHandler(error, stage.name, result);
                }
                if (stage.retryPolicy) {
                    for (let i = 0; i < stage.retryPolicy.maxAttempts; i++) {
                        await new Promise(resolve => setTimeout(resolve, stage.retryPolicy.backoffMs * (i + 1)));
                        try {
                            result = await stage.processor(result);
                            break;
                        }
                        catch (retryError) {
                            if (i === stage.retryPolicy.maxAttempts - 1) {
                                throw retryError;
                            }
                        }
                    }
                }
                else {
                    throw error;
                }
            }
        }
        this.emit('pipeline:completed', {
            pipeline: pipelineName,
            context: executionContext,
            result,
        });
        return result;
    }
    async calculateAggregatedMetrics(userId, period = '7d') {
        const startTime = perf_hooks_1.performance.now();
        try {
            const [analytics, memories, kpis] = await Promise.all([
                UserAnalytics_1.default.findOne({ where: { userId } }),
                CoachMemory_1.default.findAll({
                    where: {
                        userId,
                        createdAt: {
                            [sequelize_1.Op.gte]: this.getPeriodStartDate(period),
                        },
                    },
                }),
                KpiTracker_1.default.findAll({
                    where: {
                        userId,
                        updatedAt: {
                            [sequelize_1.Op.gte]: this.getPeriodStartDate(period),
                        },
                    },
                }),
            ]);
            const engagement = await this.calculateEngagementMetrics(userId, memories);
            const progress = await this.calculateProgressMetrics(userId, kpis);
            const behavioral = await this.calculateBehavioralMetrics(userId, memories);
            const performance = await this.calculatePerformanceMetrics(userId, analytics);
            const aggregated = {
                userId,
                period,
                metrics: {
                    engagement,
                    progress,
                    behavioral,
                    performance,
                },
                computedAt: new Date(),
            };
            await this.cacheAggregatedMetrics(aggregated);
            logger_1.logger.info(`Aggregated metrics calculated in ${performance.now() - startTime}ms`);
            return aggregated;
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate aggregated metrics', error);
            throw error;
        }
    }
    applyWindowFunction(data, window) {
        const results = [];
        const points = data.points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        let windowSize;
        switch (window.unit) {
            case 'seconds':
                windowSize = window.size * 1000;
                break;
            case 'minutes':
                windowSize = window.size * 60 * 1000;
                break;
            case 'hours':
                windowSize = window.size * 60 * 60 * 1000;
                break;
            case 'days':
                windowSize = window.size * 24 * 60 * 60 * 1000;
                break;
        }
        if (window.type === 'tumbling') {
            for (let i = 0; i < points.length; i += window.size) {
                const windowPoints = points.slice(i, i + window.size);
                const values = windowPoints.map(p => p.value);
                results.push(window.aggregator(values));
            }
        }
        else if (window.type === 'sliding') {
            for (let i = 0; i <= points.length - window.size; i++) {
                const windowPoints = points.slice(i, i + window.size);
                const values = windowPoints.map(p => p.value);
                results.push(window.aggregator(values));
            }
        }
        else if (window.type === 'session') {
            let currentSession = [];
            let lastTimestamp = points[0]?.timestamp;
            for (const point of points) {
                if (point.timestamp.getTime() - lastTimestamp.getTime() > windowSize) {
                    if (currentSession.length > 0) {
                        results.push(window.aggregator(currentSession));
                        currentSession = [];
                    }
                }
                currentSession.push(point.value);
                lastTimestamp = point.timestamp;
            }
            if (currentSession.length > 0) {
                results.push(window.aggregator(currentSession));
            }
        }
        return results;
    }
    async *streamAnalytics(userId, options = {}) {
        if (options.realtime) {
            await this.pubsub.subscribe(`analytics:${userId}`);
            this.pubsub.on('message', (channel, message) => {
                const event = JSON.parse(message);
                if (!options.eventTypes || options.eventTypes.includes(event.eventType)) {
                    this.processingQueue.push(event);
                }
            });
        }
        const historicalEvents = await this.fetchHistoricalEvents(userId, options);
        for (const event of historicalEvents) {
            yield event;
        }
        while (options.realtime) {
            if (this.processingQueue.length > 0) {
                yield this.processingQueue.shift();
            }
            else {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }
    async ingestEngagementData(data) {
        return {
            ...data,
            ingestionTime: new Date(),
            source: 'engagement_pipeline',
        };
    }
    async validateEngagementData(data) {
        if (!data.userId || !data.timestamp) {
            throw new Error('Invalid engagement data: missing required fields');
        }
        return data;
    }
    async transformEngagementData(data) {
        return {
            ...data,
            sessionDuration: data.endTime - data.startTime,
            interactionCount: data.interactions?.length || 0,
            engagementScore: this.calculateEngagementScore(data),
        };
    }
    async enrichEngagementData(data) {
        const userContext = await this.getUserContext(data.userId);
        return {
            ...data,
            userContext,
            enrichedAt: new Date(),
        };
    }
    async aggregateEngagementMetrics(data) {
        const aggregated = {
            hourly: this.aggregateByHour(data),
            daily: this.aggregateByDay(data),
            weekly: this.aggregateByWeek(data),
        };
        return { ...data, aggregated };
    }
    async storeEngagementMetrics(data) {
        await UserAnalytics_1.default.upsert({
            userId: data.userId,
            engagementMetrics: data.aggregated,
            lastUpdated: new Date(),
        });
    }
    async ingestGoalData(data) {
        return {
            ...data,
            ingestionTime: new Date(),
            source: 'goal_pipeline',
        };
    }
    async validateGoalData(data) {
        if (!data.goalId || !data.userId) {
            throw new Error('Invalid goal data');
        }
        return data;
    }
    async calculateGoalMetrics(data) {
        return {
            ...data,
            progressRate: this.calculateProgressRate(data),
            estimatedCompletion: this.estimateCompletion(data),
            riskLevel: this.assessRiskLevel(data),
        };
    }
    async enrichGoalContext(data) {
        const historicalData = await this.getGoalHistory(data.goalId);
        return {
            ...data,
            historicalTrend: this.analyzeTrend(historicalData),
            peerComparison: await this.compareToPeers(data),
        };
    }
    async storeGoalMetrics(data) {
        await KpiTracker_1.default.upsert({
            id: data.goalId,
            userId: data.userId,
            metrics: data,
            updatedAt: new Date(),
        });
    }
    async ingestBehavioralData(data) {
        return {
            ...data,
            ingestionTime: new Date(),
            source: 'behavioral_pipeline',
        };
    }
    async extractBehavioralPatterns(data) {
        const patterns = {
            timeOfDay: this.extractTimePatterns(data),
            frequency: this.extractFrequencyPatterns(data),
            sequence: this.extractSequencePatterns(data),
        };
        return { ...data, patterns };
    }
    async analyzeBehavioralTrends(data) {
        const trends = {
            consistency: this.analyzeConsistency(data),
            improvement: this.analyzeImprovement(data),
            engagement: this.analyzeEngagementTrend(data),
        };
        return { ...data, trends };
    }
    async aggregateBehavioralMetrics(data) {
        return {
            ...data,
            aggregated: {
                dominantPattern: this.identifyDominantPattern(data.patterns),
                behaviorScore: this.calculateBehaviorScore(data),
                predictedBehavior: this.predictNextBehavior(data),
            },
        };
    }
    async storeBehavioralInsights(data) {
        await this.redis.setex(`behavioral:${data.userId}`, 3600, JSON.stringify(data.aggregated));
    }
    async calculateEngagementMetrics(userId, memories) {
        const sessions = memories.filter(m => m.type === 'session');
        const totalDuration = sessions.reduce((sum, s) => sum + (s.metadata?.duration || 0), 0);
        return {
            sessionCount: sessions.length,
            totalDuration,
            averageDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
            interactionRate: this.calculateInteractionRate(memories),
            consistencyScore: this.calculateConsistencyScore(sessions),
            peakEngagementTime: this.identifyPeakTime(sessions),
            streakDays: this.calculateStreak(sessions),
            missedSessions: this.countMissedSessions(sessions),
            engagementTrend: this.determineEngagementTrend(sessions),
        };
    }
    async calculateProgressMetrics(userId, kpis) {
        const goals = kpis.filter(k => k.type === 'goal');
        const completed = goals.filter(g => g.currentValue >= g.targetValue);
        const inProgress = goals.filter(g => g.currentValue > 0 && g.currentValue < g.targetValue);
        const abandoned = goals.filter(g => g.status === 'abandoned');
        return {
            goalsCompleted: completed.length,
            goalsInProgress: inProgress.length,
            goalsAbandoned: abandoned.length,
            averageCompletionTime: this.calculateAverageCompletionTime(completed),
            progressVelocity: this.calculateProgressVelocity(goals),
            milestoneAchievement: this.calculateMilestoneRate(goals),
            improvementRate: this.calculateImprovementRate(goals),
            successRate: goals.length > 0 ? completed.length / goals.length : 0,
        };
    }
    async calculateBehavioralMetrics(userId, memories) {
        return {
            dominantPatterns: this.identifyPatterns(memories),
            habitFormation: this.assessHabitFormation(memories),
            consistencyIndex: this.calculateConsistency(memories),
            motivationLevel: this.assessMotivation(memories),
            stressIndicators: this.detectStress(memories),
            focusScore: this.calculateFocus(memories),
            productivityIndex: this.calculateProductivity(memories),
            learningStyle: this.identifyLearningStyle(memories),
        };
    }
    async calculatePerformanceMetrics(userId, analytics) {
        if (!analytics) {
            return this.getDefaultPerformanceMetrics();
        }
        return {
            kpiAchievement: analytics.kpiAchievementRate || 0,
            skillImprovement: analytics.skillImprovementRate || 0,
            efficiencyScore: analytics.efficiencyScore || 0,
            qualityIndex: analytics.qualityIndex || 0,
            innovationScore: analytics.innovationScore || 0,
            collaborationIndex: analytics.collaborationIndex || 0,
            leadershipScore: analytics.leadershipScore || 0,
            overallPerformance: analytics.overallPerformanceScore || 0,
        };
    }
    async flushMetricsBuffer(key) {
        const metrics = this.metricsBuffer.get(key);
        if (!metrics || metrics.length === 0)
            return;
        await this.batchProcessMetrics(metrics);
        this.metricsBuffer.set(key, []);
    }
    async batchProcessMetrics(metrics) {
        const grouped = this.groupMetricsByType(metrics);
        for (const [type, typeMetrics] of grouped.entries()) {
            await this.executePipeline(this.getPipelineForMetricType(type), typeMetrics);
        }
    }
    startAggregationWorker() {
        this.aggregationInterval = setInterval(async () => {
            try {
                for (const key of this.metricsBuffer.keys()) {
                    await this.flushMetricsBuffer(key);
                }
                await this.runScheduledAggregations();
            }
            catch (error) {
                logger_1.logger.error('Aggregation worker error', error);
            }
        }, 60000);
    }
    async runScheduledAggregations() {
        const users = await this.getActiveUsers();
        for (const userId of users) {
            await this.calculateAggregatedMetrics(userId, '1d');
        }
    }
    getPeriodStartDate(period) {
        const now = new Date();
        const match = period.match(/(\d+)([hdwmy])/);
        if (!match)
            return now;
        const [, value, unit] = match;
        const amount = parseInt(value);
        switch (unit) {
            case 'h':
                return new Date(now.getTime() - amount * 60 * 60 * 1000);
            case 'd':
                return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
            case 'w':
                return new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
            case 'm':
                return new Date(now.getTime() - amount * 30 * 24 * 60 * 60 * 1000);
            case 'y':
                return new Date(now.getTime() - amount * 365 * 24 * 60 * 60 * 1000);
            default:
                return now;
        }
    }
    calculateEngagementScore(data) {
        const duration = data.sessionDuration || 0;
        const interactions = data.interactionCount || 0;
        const quality = data.qualityScore || 0;
        return (duration * 0.3 + interactions * 0.4 + quality * 0.3) / 100;
    }
    calculateProgressRate(data) {
        const current = data.currentValue || 0;
        const target = data.targetValue || 1;
        const timeElapsed = data.timeElapsed || 1;
        const totalTime = data.totalTime || 1;
        return (current / target) / (timeElapsed / totalTime);
    }
    estimateCompletion(data) {
        const progressRate = this.calculateProgressRate(data);
        const remaining = (data.targetValue || 0) - (data.currentValue || 0);
        const daysToComplete = remaining / progressRate;
        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() + daysToComplete);
        return completionDate;
    }
    assessRiskLevel(data) {
        const progressRate = this.calculateProgressRate(data);
        if (progressRate < 0.3)
            return 'high';
        if (progressRate < 0.7)
            return 'medium';
        return 'low';
    }
    async getUserContext(userId) {
        const cached = await this.redis.get(`context:${userId}`);
        if (cached)
            return JSON.parse(cached);
        const context = {
            preferences: await this.getUserPreferences(userId),
            history: await this.getUserHistory(userId),
            profile: await this.getUserProfile(userId),
        };
        await this.redis.setex(`context:${userId}`, 3600, JSON.stringify(context));
        return context;
    }
    async cacheAggregatedMetrics(metrics) {
        const key = `aggregated:${metrics.userId}:${metrics.period}`;
        await this.redis.setex(key, 3600, JSON.stringify(metrics));
    }
    handlePipelineError(error, stage, data) {
        logger_1.logger.error(`Pipeline error at stage ${stage}`, error, { data });
        this.emit('pipeline:error', { error, stage, data });
    }
    calculateInteractionRate(memories) { return Math.random() * 100; }
    calculateConsistencyScore(sessions) { return Math.random() * 100; }
    identifyPeakTime(sessions) { return '14:00'; }
    calculateStreak(sessions) { return Math.floor(Math.random() * 30); }
    countMissedSessions(sessions) { return Math.floor(Math.random() * 5); }
    determineEngagementTrend(sessions) {
        const rand = Math.random();
        if (rand < 0.33)
            return 'increasing';
        if (rand < 0.66)
            return 'stable';
        return 'decreasing';
    }
    calculateAverageCompletionTime(completed) { return Math.random() * 30; }
    calculateProgressVelocity(goals) { return Math.random() * 10; }
    calculateMilestoneRate(goals) { return Math.random() * 100; }
    calculateImprovementRate(goals) { return Math.random() * 20; }
    identifyPatterns(memories) { return ['morning_productive', 'weekly_review']; }
    assessHabitFormation(memories) { return Math.random() * 100; }
    calculateConsistency(memories) { return Math.random() * 100; }
    assessMotivation(memories) { return Math.random() * 10; }
    detectStress(memories) { return Math.random() * 5; }
    calculateFocus(memories) { return Math.random() * 100; }
    calculateProductivity(memories) { return Math.random() * 100; }
    identifyLearningStyle(memories) { return 'visual'; }
    getDefaultPerformanceMetrics() {
        return {
            kpiAchievement: 0,
            skillImprovement: 0,
            efficiencyScore: 0,
            qualityIndex: 0,
            innovationScore: 0,
            collaborationIndex: 0,
            leadershipScore: 0,
            overallPerformance: 0,
        };
    }
    groupMetricsByType(metrics) {
        const grouped = new Map();
        for (const metric of metrics) {
            if (!grouped.has(metric.metricType)) {
                grouped.set(metric.metricType, []);
            }
            grouped.get(metric.metricType).push(metric);
        }
        return grouped;
    }
    getPipelineForMetricType(type) {
        const mapping = {
            engagement: 'engagement',
            goal: 'goal_progress',
            behavior: 'behavioral',
        };
        return mapping[type] || 'engagement';
    }
    async getActiveUsers() {
        const result = await UserAnalytics_1.default.findAll({
            where: {
                lastActive: {
                    [sequelize_1.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            },
            attributes: ['userId'],
        });
        return result.map(r => r.userId);
    }
    async fetchHistoricalEvents(userId, options) {
        return [];
    }
    async getUserPreferences(userId) { return {}; }
    async getUserHistory(userId) { return {}; }
    async getUserProfile(userId) { return {}; }
    async getGoalHistory(goalId) { return []; }
    analyzeTrend(data) { return 'improving'; }
    async compareToPeers(data) { return {}; }
    extractTimePatterns(data) { return {}; }
    extractFrequencyPatterns(data) { return {}; }
    extractSequencePatterns(data) { return {}; }
    analyzeConsistency(data) { return {}; }
    analyzeImprovement(data) { return {}; }
    analyzeEngagementTrend(data) { return {}; }
    identifyDominantPattern(patterns) { return 'consistent'; }
    calculateBehaviorScore(data) { return Math.random() * 100; }
    predictNextBehavior(data) { return {}; }
    aggregateByHour(data) { return {}; }
    aggregateByDay(data) { return {}; }
    aggregateByWeek(data) { return {}; }
    async cleanup() {
        if (this.aggregationInterval) {
            clearInterval(this.aggregationInterval);
        }
        await this.redis.quit();
        await this.pubsub.quit();
    }
}
exports.AnalyticsPipelineService = AnalyticsPipelineService;
class MetricsCollector {
    metrics;
    constructor() {
        this.metrics = new Map();
    }
    record(metric, value) {
        this.metrics.set(metric, value);
    }
    get(metric) {
        return this.metrics.get(metric);
    }
    getAll() {
        return new Map(this.metrics);
    }
    clear() {
        this.metrics.clear();
    }
}
class ModelDriftDetector {
    baselineMetrics;
    thresholds;
    constructor() {
        this.baselineMetrics = new Map();
        this.thresholds = new Map();
    }
    setBaseline(model, metrics) {
        this.baselineMetrics.set(model, metrics);
    }
    setThreshold(model, threshold) {
        this.thresholds.set(model, threshold);
    }
    detectDrift(model, currentMetrics) {
        const baseline = this.baselineMetrics.get(model);
        const threshold = this.thresholds.get(model) || 0.1;
        if (!baseline)
            return false;
        const driftScore = this.calculateDriftScore(baseline, currentMetrics);
        return driftScore > threshold;
    }
    calculateDriftScore(baseline, current) {
        return Math.random() * 0.2;
    }
}
exports.default = new AnalyticsPipelineService();
//# sourceMappingURL=AnalyticsPipelineService.js.map