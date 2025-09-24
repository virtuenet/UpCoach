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
exports.UserBehaviorAnalyticsService = void 0;
const events_1 = require("events");
const ioredis_1 = require("ioredis");
const sequelize_1 = require("sequelize");
const crypto = __importStar(require("crypto"));
const perf_hooks_1 = require("perf_hooks");
const User_1 = __importDefault(require("../../models/User"));
const CoachMemory_1 = __importDefault(require("../../models/coaching/CoachMemory"));
const UserAnalytics_1 = __importDefault(require("../../models/analytics/UserAnalytics"));
const Goal_1 = __importDefault(require("../../models/Goal"));
const logger_1 = require("../../utils/logger");
class UserBehaviorAnalyticsService extends events_1.EventEmitter {
    redis;
    eventStream;
    patternDetector;
    segmentationEngine;
    anomalyDetector;
    journeyAnalyzer;
    constructor() {
        super();
        this.redis = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            db: 2,
        });
        this.eventStream = new Map();
        this.patternDetector = new PatternDetector();
        this.segmentationEngine = new SegmentationEngine();
        this.anomalyDetector = new AnomalyDetector();
        this.journeyAnalyzer = new JourneyAnalyzer();
        this.initializeEventProcessing();
    }
    initializeEventProcessing() {
        setInterval(() => this.processEventBatch(), 5000);
        setInterval(() => this.runPatternDetection(), 60000);
        setInterval(() => this.runAnomalyDetection(), 300000);
        logger_1.logger.info('User behavior analytics service initialized');
    }
    async trackEvent(event) {
        const startTime = perf_hooks_1.performance.now();
        try {
            this.validateEvent(event);
            if (!this.eventStream.has(event.userId)) {
                this.eventStream.set(event.userId, []);
            }
            this.eventStream.get(event.userId).push(event);
            await this.redis.lpush(`events:${event.userId}`, JSON.stringify(event));
            await this.redis.ltrim(`events:${event.userId}`, 0, 999);
            this.emit('event:tracked', event);
            if (this.shouldProcessImmediately(event)) {
                await this.processEventImmediately(event);
            }
            const processingTime = perf_hooks_1.performance.now() - startTime;
            if (processingTime > 50) {
                logger_1.logger.warn(`Slow event tracking: ${processingTime}ms`);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to track event', error, { event });
            throw error;
        }
    }
    async analyzeBehaviorPatterns(userId, options = {}) {
        try {
            const timeframe = options.timeframe || 30;
            const minConfidence = options.minConfidence || 0.7;
            const events = await this.fetchUserEvents(userId, timeframe);
            let patterns = await this.patternDetector.detectPatterns(events, options.patternTypes);
            patterns = patterns.filter(p => p.confidence >= minConfidence);
            patterns = this.rankPatterns(patterns);
            await this.storePatterns(userId, patterns);
            return patterns;
        }
        catch (error) {
            logger_1.logger.error('Failed to analyze behavior patterns', error);
            throw error;
        }
    }
    async mapUserJourney(userId) {
        try {
            const [user, goals, memories, analytics] = await Promise.all([
                User_1.default.findByPk(userId),
                Goal_1.default.findAll({ where: { userId } }),
                CoachMemory_1.default.findAll({
                    where: { userId },
                    order: [['createdAt', 'ASC']],
                }),
                UserAnalytics_1.default.findOne({ where: { userId } }),
            ]);
            const journey = await this.journeyAnalyzer.analyzeJourney({
                user,
                goals,
                memories,
                analytics,
            });
            const bottlenecks = await this.identifyBottlenecks(journey);
            const opportunities = await this.findOpportunities(journey, analytics);
            const predictedPath = await this.predictJourneyPath(journey, analytics);
            return {
                userId,
                stages: journey.stages,
                currentStage: journey.currentStage,
                progressRate: journey.progressRate,
                predictedPath,
                bottlenecks,
                opportunities,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to map user journey', error);
            throw error;
        }
    }
    async segmentUsers(options = {}) {
        try {
            const method = options.method || 'behavioral';
            const numSegments = options.numSegments || 5;
            const usersWithAnalytics = await this.fetchUsersWithAnalytics();
            const features = await this.extractSegmentationFeatures(usersWithAnalytics, options.features);
            const segments = await this.segmentationEngine.segment(features, method, numSegments);
            const profiles = await this.profileSegments(segments, usersWithAnalytics);
            await this.storeSegmentAssignments(segments);
            return profiles;
        }
        catch (error) {
            logger_1.logger.error('Failed to segment users', error);
            throw error;
        }
    }
    async analyzeCohort(cohortDefinition) {
        try {
            const cohortId = this.generateCohortId(cohortDefinition);
            const members = await this.fetchCohortMembers(cohortDefinition);
            const retention = await this.calculateRetention(members);
            const engagement = await this.calculateEngagement(members);
            const performance = await this.calculatePerformance(members);
            const behavioral = await this.calculateBehavioral(members);
            const trends = await this.analyzeTrends(members);
            const comparisons = await this.compareWithOtherCohorts(cohortId, {
                retention,
                engagement,
                performance,
                behavioral,
            });
            return {
                cohortId,
                period: `${cohortDefinition.startDate.toISOString()} - ${cohortDefinition.endDate.toISOString()}`,
                metrics: {
                    retention,
                    engagement,
                    performance,
                    behavioral,
                },
                trends,
                comparisons,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to analyze cohort', error);
            throw error;
        }
    }
    async detectAnomalies(userId, options = {}) {
        try {
            const sensitivity = options.sensitivity || 0.8;
            const lookbackDays = options.lookbackDays || 30;
            const historicalData = await this.fetchHistoricalData(userId, lookbackDays);
            const anomalies = await this.anomalyDetector.detect(historicalData, sensitivity, options.metrics);
            const riskScore = this.calculateRiskScore(anomalies);
            const requiresIntervention = this.shouldIntervene(anomalies, riskScore);
            const recommendations = await this.generateAnomalyRecommendations(anomalies, riskScore);
            await this.storeAnomalyResults(userId, {
                anomalies,
                riskScore,
                requiresIntervention,
                recommendations,
            });
            return {
                userId,
                anomalies,
                riskScore,
                requiresIntervention,
                recommendations,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to detect anomalies', error);
            throw error;
        }
    }
    async predictChurnRisk(userId) {
        try {
            const engagementHistory = await this.fetchEngagementHistory(userId);
            const indicators = this.calculateChurnIndicators(engagementHistory);
            const risk = this.calculateChurnRisk(indicators);
            const factors = this.identifyChurnFactors(indicators);
            const timeline = this.estimateChurnTimeline(risk, indicators);
            const preventionStrategies = this.generatePreventionStrategies(risk, factors);
            return {
                risk,
                factors,
                timeline,
                preventionStrategies,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to predict churn risk', error);
            throw error;
        }
    }
    async calculateLifetimeValue(userId) {
        try {
            const [user, analytics, goals] = await Promise.all([
                User_1.default.findByPk(userId),
                UserAnalytics_1.default.findOne({ where: { userId } }),
                Goal_1.default.findAll({ where: { userId } }),
            ]);
            const currentValue = this.computeCurrentValue(user, analytics, goals);
            const projectedValue = this.projectFutureValue(currentValue, analytics);
            const valueSegment = this.determineValueSegment(currentValue, projectedValue);
            const growthPotential = this.calculateGrowthPotential(currentValue, projectedValue, analytics);
            const recommendations = this.generateValueRecommendations(valueSegment, growthPotential);
            return {
                currentValue,
                projectedValue,
                valueSegment,
                growthPotential,
                recommendations,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate lifetime value', error);
            throw error;
        }
    }
    validateEvent(event) {
        if (!event.userId || !event.eventType || !event.timestamp) {
            throw new Error('Invalid event: missing required fields');
        }
    }
    shouldProcessImmediately(event) {
        const criticalEvents = ['goal_completed', 'subscription_cancelled', 'error_occurred'];
        return criticalEvents.includes(event.eventType);
    }
    async processEventImmediately(event) {
        if (event.eventType === 'subscription_cancelled') {
            await this.handleChurnEvent(event);
        }
    }
    async processEventBatch() {
        for (const [userId, events] of this.eventStream) {
            if (events.length > 0) {
                await this.processBatchForUser(userId, events);
                this.eventStream.set(userId, []);
            }
        }
    }
    async processBatchForUser(userId, events) {
        const aggregated = this.aggregateEvents(events);
        await this.updateUserAnalytics(userId, aggregated);
        const patterns = await this.patternDetector.detectRealTimePatterns(events);
        if (patterns.length > 0) {
            this.emit('patterns:detected', { userId, patterns });
        }
    }
    async runPatternDetection() {
        try {
            const activeUsers = await this.getActiveUsers();
            for (const userId of activeUsers) {
                const patterns = await this.analyzeBehaviorPatterns(userId);
                if (patterns.length > 0) {
                    this.emit('patterns:batch', { userId, patterns });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Pattern detection job failed', error);
        }
    }
    async runAnomalyDetection() {
        try {
            const users = await this.getUsersForAnomalyDetection();
            for (const userId of users) {
                const result = await this.detectAnomalies(userId);
                if (result.requiresIntervention) {
                    this.emit('anomaly:critical', result);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Anomaly detection job failed', error);
        }
    }
    async fetchUserEvents(userId, days) {
        const events = [];
        const rawEvents = await this.redis.lrange(`events:${userId}`, 0, -1);
        for (const rawEvent of rawEvents) {
            const event = JSON.parse(rawEvent);
            const eventDate = new Date(event.timestamp);
            const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            if (eventDate >= cutoffDate) {
                events.push(event);
            }
        }
        return events;
    }
    rankPatterns(patterns) {
        return patterns.sort((a, b) => {
            const scoreA = a.confidence * a.frequency * a.strength;
            const scoreB = b.confidence * b.frequency * b.strength;
            return scoreB - scoreA;
        });
    }
    async storePatterns(userId, patterns) {
        const key = `patterns:${userId}`;
        await this.redis.setex(key, 86400, JSON.stringify(patterns));
    }
    async identifyBottlenecks(journey) {
        const bottlenecks = [];
        for (let i = 0; i < journey.stages.length - 1; i++) {
            const current = journey.stages[i];
            const next = journey.stages[i + 1];
            if (current.duration && current.duration > journey.averageDuration * 2) {
                bottlenecks.push({
                    stage: current.name,
                    severity: 'high',
                    description: `Taking longer than average at ${current.name}`,
                    impact: 0.7,
                    suggestions: ['Provide additional guidance', 'Simplify the process'],
                });
            }
        }
        return bottlenecks;
    }
    async findOpportunities(journey, analytics) {
        const opportunities = [];
        if (analytics?.engagementScore > 80) {
            opportunities.push({
                type: 'upsell',
                description: 'High engagement user - potential for premium features',
                potentialImpact: 0.8,
                effort: 'low',
                recommendations: ['Offer premium trial', 'Showcase advanced features'],
            });
        }
        return opportunities;
    }
    async predictJourneyPath(journey, analytics) {
        const possiblePaths = {
            onboarding: ['goal_setting', 'first_session'],
            goal_setting: ['habit_formation', 'progress_tracking'],
            habit_formation: ['consistency_building', 'mastery'],
        };
        return possiblePaths[journey.currentStage] || ['explore', 'engage', 'achieve'];
    }
    async fetchUsersWithAnalytics() {
        return UserAnalytics_1.default.findAll({
            include: [{ model: User_1.default }],
        });
    }
    async extractSegmentationFeatures(users, features) {
        return users.map(user => ({
            userId: user.userId,
            engagement: user.engagementScore || 0,
            retention: user.retentionRate || 0,
            value: user.lifetimeValue || 0,
            activity: user.activityLevel || 0,
        }));
    }
    async profileSegments(segments, users) {
        const profiles = [];
        for (const segment of segments) {
            profiles.push({
                segmentId: segment.id,
                name: segment.name || `Segment ${segment.id}`,
                description: this.describeSegment(segment),
                characteristics: this.extractCharacteristics(segment),
                size: segment.members.length,
                growthRate: this.calculateGrowthRate(segment),
                engagementLevel: this.calculateEngagementLevel(segment, users),
                churnRisk: this.calculateSegmentChurnRisk(segment),
                valuePotential: this.calculateValuePotential(segment),
            });
        }
        return profiles;
    }
    async storeSegmentAssignments(segments) {
        for (const segment of segments) {
            for (const userId of segment.members) {
                await this.redis.hset(`user:${userId}`, 'segment', segment.id);
            }
        }
    }
    generateCohortId(definition) {
        const hash = crypto.createHash('md5');
        hash.update(JSON.stringify(definition));
        return hash.digest('hex').substring(0, 8);
    }
    async fetchCohortMembers(definition) {
        return User_1.default.findAll({
            where: {
                createdAt: {
                    [sequelize_1.Op.between]: [definition.startDate, definition.endDate],
                },
                ...definition.criteria,
            },
        });
    }
    async calculateRetention(members) {
        return {
            day1: 0.95,
            day7: 0.75,
            day30: 0.60,
            day90: 0.45,
            curve: [1, 0.95, 0.85, 0.75, 0.70, 0.65, 0.60],
            churnRate: 0.15,
            lifetimeValue: 1200,
        };
    }
    async calculateEngagement(members) {
        return {
            dau: members.length * 0.3,
            wau: members.length * 0.6,
            mau: members.length * 0.8,
            stickiness: 0.5,
            sessionFrequency: 3.5,
            sessionDuration: 25,
            featureAdoption: {
                goals: 0.9,
                habits: 0.7,
                analytics: 0.6,
            },
        };
    }
    async calculatePerformance(members) {
        return {
            goalCompletionRate: 0.65,
            averageProgress: 0.72,
            velocityTrend: 0.15,
            successRate: 0.78,
            improvementRate: 0.22,
        };
    }
    async calculateBehavioral(members) {
        return {
            dominantPatterns: ['morning_routine', 'weekly_review'],
            behaviorDiversity: 0.7,
            consistencyScore: 0.8,
            adaptabilityIndex: 0.6,
            engagementDepth: 0.75,
        };
    }
    async analyzeTrends(members) {
        return [
            {
                metric: 'engagement',
                direction: 'up',
                magnitude: 0.12,
                significance: 0.95,
                forecast: [0.75, 0.77, 0.79, 0.81, 0.82],
            },
        ];
    }
    async compareWithOtherCohorts(cohortId, metrics) {
        return [];
    }
    async fetchHistoricalData(userId, days) {
        return {
            events: await this.fetchUserEvents(userId, days),
            analytics: await UserAnalytics_1.default.findOne({ where: { userId } }),
        };
    }
    calculateRiskScore(anomalies) {
        if (anomalies.length === 0)
            return 0;
        const severityWeights = { low: 0.2, medium: 0.5, high: 0.8, critical: 1.0 };
        const totalScore = anomalies.reduce((sum, a) => sum + severityWeights[a.severity], 0);
        return Math.min(1, totalScore / anomalies.length);
    }
    shouldIntervene(anomalies, riskScore) {
        return riskScore > 0.7 || anomalies.some(a => a.severity === 'critical');
    }
    async generateAnomalyRecommendations(anomalies, riskScore) {
        const recommendations = [];
        if (riskScore > 0.8) {
            recommendations.push('Schedule immediate check-in with user');
            recommendations.push('Review recent changes in user behavior');
        }
        return recommendations;
    }
    async storeAnomalyResults(userId, results) {
        await this.redis.setex(`anomalies:${userId}`, 3600, JSON.stringify(results));
    }
    async handleChurnEvent(event) { }
    aggregateEvents(events) { return {}; }
    async updateUserAnalytics(userId, data) { }
    async getActiveUsers() { return []; }
    async getUsersForAnomalyDetection() { return []; }
    async fetchEngagementHistory(userId) { return {}; }
    calculateChurnIndicators(history) { return {}; }
    calculateChurnRisk(indicators) { return Math.random(); }
    identifyChurnFactors(indicators) { return []; }
    estimateChurnTimeline(risk, indicators) { return '30 days'; }
    generatePreventionStrategies(risk, factors) { return []; }
    computeCurrentValue(user, analytics, goals) { return 1000; }
    projectFutureValue(current, analytics) { return current * 1.5; }
    determineValueSegment(current, projected) { return 'high'; }
    calculateGrowthPotential(current, projected, analytics) { return 0.5; }
    generateValueRecommendations(segment, potential) { return []; }
    describeSegment(segment) { return 'Segment description'; }
    extractCharacteristics(segment) { return ['high_engagement']; }
    calculateGrowthRate(segment) { return 0.1; }
    calculateEngagementLevel(segment, users) { return 0.75; }
    calculateSegmentChurnRisk(segment) { return 0.2; }
    calculateValuePotential(segment) { return 0.8; }
}
exports.UserBehaviorAnalyticsService = UserBehaviorAnalyticsService;
class PatternDetector {
    async detectPatterns(events, types) {
        const patterns = [];
        if (!types || types.includes('temporal')) {
            patterns.push(...this.detectTemporalPatterns(events));
        }
        if (!types || types.includes('sequential')) {
            patterns.push(...this.detectSequentialPatterns(events));
        }
        return patterns;
    }
    async detectRealTimePatterns(events) {
        return this.detectPatterns(events);
    }
    detectTemporalPatterns(events) {
        return [];
    }
    detectSequentialPatterns(events) {
        return [];
    }
}
class SegmentationEngine {
    async segment(features, method, numSegments) {
        return [];
    }
}
class AnomalyDetector {
    async detect(data, sensitivity, metrics) {
        return [];
    }
}
class JourneyAnalyzer {
    async analyzeJourney(data) {
        return {
            stages: [],
            currentStage: 'onboarding',
            progressRate: 0.5,
            averageDuration: 7,
        };
    }
}
exports.default = new UserBehaviorAnalyticsService();
//# sourceMappingURL=UserBehaviorAnalyticsService.js.map