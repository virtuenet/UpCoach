"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsDashboardController = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const AnalyticsPipelineService_1 = tslib_1.__importDefault(require("../services/analytics/AnalyticsPipelineService"));
const UserBehaviorAnalyticsService_1 = tslib_1.__importDefault(require("../services/analytics/UserBehaviorAnalyticsService"));
const RealTimeInsightsGenerator_1 = tslib_1.__importDefault(require("../services/ml/RealTimeInsightsGenerator"));
const PredictiveCoachingEngine_1 = tslib_1.__importDefault(require("../services/ml/PredictiveCoachingEngine"));
const CoachIntelligenceMLServiceComplete_1 = require("../services/coaching/CoachIntelligenceMLServiceComplete");
const logger_1 = require("../utils/logger");
class AnalyticsDashboardController {
    mlService;
    constructor() {
        this.mlService = new CoachIntelligenceMLServiceComplete_1.CoachIntelligenceMLServiceComplete();
    }
    async getDashboardMetrics(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { organizationId, timeframe = '30d' } = req.query;
            const userId = req.user?.id;
            if (organizationId && !this.hasOrganizationAccess(userId, organizationId)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            const [overview, performance, engagement, behavioral, predictions, insights] = await Promise.all([
                this.getOverviewMetrics(organizationId, timeframe),
                this.getPerformanceMetrics(organizationId, timeframe),
                this.getEngagementMetrics(organizationId, timeframe),
                this.getBehavioralMetrics(organizationId, timeframe),
                this.getPredictionMetrics(organizationId),
                this.getInsightMetrics(organizationId, timeframe),
            ]);
            const dashboardMetrics = {
                overview,
                performance,
                engagement,
                behavioral,
                predictions,
                insights,
            };
            return res.status(200).json({
                success: true,
                data: dashboardMetrics,
                timeframe,
                generatedAt: new Date(),
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get dashboard metrics', error);
            return res.status(500).json({
                error: 'Failed to retrieve dashboard metrics',
            });
        }
    }
    async getUserAnalytics(req, res) {
        try {
            const { userId } = req.params;
            const { timeframe = '30d', includeComparisons = true } = req.query;
            if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            const analytics = await AnalyticsPipelineService_1.default.calculateAggregatedMetrics(userId, timeframe);
            let predictions = null;
            if (req.query.includePredictions === 'true') {
                predictions = await this.getUserPredictions(userId);
            }
            let insights = null;
            if (req.query.includeInsights === 'true') {
                insights = await RealTimeInsightsGenerator_1.default.generateInsights({
                    userId,
                    timeframe: timeframe,
                    maxInsights: 10,
                });
            }
            let comparisons = null;
            if (includeComparisons) {
                comparisons = await this.getUserComparisons(userId);
            }
            return res.status(200).json({
                success: true,
                data: {
                    analytics,
                    predictions,
                    insights,
                    comparisons,
                },
                userId,
                timeframe,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get user analytics', error);
            return res.status(500).json({
                error: 'Failed to retrieve user analytics',
            });
        }
    }
    async getBehaviorPatterns(req, res) {
        try {
            const { userId } = req.params;
            const { timeframe = '30', patternTypes, minConfidence = '0.7' } = req.query;
            if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            const patterns = await UserBehaviorAnalyticsService_1.default.analyzeBehaviorPatterns(userId, {
                timeframe: parseInt(timeframe),
                patternTypes: patternTypes ? patternTypes.split(',') : undefined,
                minConfidence: parseFloat(minConfidence),
            });
            return res.status(200).json({
                success: true,
                data: patterns,
                count: patterns.length,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get behavior patterns', error);
            return res.status(500).json({
                error: 'Failed to analyze behavior patterns',
            });
        }
    }
    async getRealTimeInsights(req, res) {
        try {
            const { userId } = req.params;
            const { timeframe = '7d', categories, minImportance = '0.5', maxInsights = '20' } = req.query;
            if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            const insights = await RealTimeInsightsGenerator_1.default.generateInsights({
                userId,
                timeframe: timeframe,
                focus: categories ? categories.split(',') : undefined,
                minImportance: parseFloat(minImportance),
                maxInsights: parseInt(maxInsights),
            });
            return res.status(200).json({
                success: true,
                data: insights,
                count: insights.length,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get real-time insights', error);
            return res.status(500).json({
                error: 'Failed to generate insights',
            });
        }
    }
    async getPredictiveAnalytics(req, res) {
        try {
            const { userId } = req.params;
            const { predictionTypes = 'all' } = req.query;
            if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            const predictions = {};
            const normalizedTypes = Array.isArray(predictionTypes) ? predictionTypes :
                typeof predictionTypes === 'string' ? [predictionTypes] : ['all'];
            if (normalizedTypes.includes('all') || normalizedTypes.includes('goals')) {
                const goals = await this.getUserGoals(userId);
                predictions.goalSuccess = await Promise.all(goals.map(goal => PredictiveCoachingEngine_1.default.predictGoalSuccess(goal.id, userId)));
            }
            if (normalizedTypes.includes('all') || normalizedTypes.includes('engagement')) {
                predictions.engagement = await PredictiveCoachingEngine_1.default.predictEngagement(userId);
            }
            if (normalizedTypes.includes('all') || normalizedTypes.includes('behavior')) {
                predictions.behavior = await PredictiveCoachingEngine_1.default.predictBehaviorPatterns(userId);
            }
            if (normalizedTypes.includes('all') || normalizedTypes.includes('churn')) {
                predictions.churn = await UserBehaviorAnalyticsService_1.default.predictChurnRisk(userId);
            }
            return res.status(200).json({
                success: true,
                data: predictions,
                userId,
                generatedAt: new Date(),
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get predictive analytics', error);
            return res.status(500).json({
                error: 'Failed to generate predictions',
            });
        }
    }
    async getCohortAnalysis(req, res) {
        try {
            const { startDate, endDate, criteria } = req.body;
            if (!this.isAdmin(req.user?.id)) {
                return res.status(403).json({ error: 'Admin access required' });
            }
            const analysis = await UserBehaviorAnalyticsService_1.default.analyzeCohort({
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                criteria: criteria || {},
            });
            return res.status(200).json({
                success: true,
                data: analysis,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to perform cohort analysis', error);
            return res.status(500).json({
                error: 'Failed to analyze cohort',
            });
        }
    }
    async getUserSegments(req, res) {
        try {
            const { method = 'behavioral', numSegments = '5', features } = req.query;
            if (!this.isAdmin(req.user?.id)) {
                return res.status(403).json({ error: 'Admin access required' });
            }
            const segments = await UserBehaviorAnalyticsService_1.default.segmentUsers({
                method: method,
                features: features ? features.split(',') : undefined,
                numSegments: parseInt(numSegments),
            });
            return res.status(200).json({
                success: true,
                data: segments,
                count: segments.length,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get user segments', error);
            return res.status(500).json({
                error: 'Failed to segment users',
            });
        }
    }
    async getAnomalyDetection(req, res) {
        try {
            const { userId } = req.params;
            const { sensitivity = '0.8', lookbackDays = '30', metrics } = req.query;
            if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            const anomalies = await UserBehaviorAnalyticsService_1.default.detectAnomalies(userId, {
                sensitivity: parseFloat(sensitivity),
                lookbackDays: parseInt(lookbackDays),
                metrics: metrics ? metrics.split(',') : undefined,
            });
            return res.status(200).json({
                success: true,
                data: anomalies,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to detect anomalies', error);
            return res.status(500).json({
                error: 'Failed to detect anomalies',
            });
        }
    }
    async getUserJourney(req, res) {
        try {
            const { userId } = req.params;
            if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            const journey = await UserBehaviorAnalyticsService_1.default.mapUserJourney(userId);
            return res.status(200).json({
                success: true,
                data: journey,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to map user journey', error);
            return res.status(500).json({
                error: 'Failed to map journey',
            });
        }
    }
    async getComparativeInsights(req, res) {
        try {
            const { userId } = req.params;
            const { comparisonGroup = 'peers' } = req.query;
            if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            const insights = await RealTimeInsightsGenerator_1.default.generateComparativeInsights(userId, comparisonGroup);
            return res.status(200).json({
                success: true,
                data: insights,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get comparative insights', error);
            return res.status(500).json({
                error: 'Failed to generate comparative insights',
            });
        }
    }
    async streamAnalytics(req, res) {
        const { userId } = req.params;
        if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });
        try {
            for await (const event of AnalyticsPipelineService_1.default.streamAnalytics(userId, {
                realtime: true,
            })) {
                res.write(`data: ${JSON.stringify(event)}\n\n`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error streaming analytics', error);
            res.write(`event: error\ndata: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
        }
    }
    async getOverviewMetrics(organizationId, timeframe) {
        return {
            totalUsers: 1000,
            activeUsers: 750,
            avgEngagement: 78.5,
            avgProgress: 65.3,
            totalGoals: 5000,
            completedGoals: 2150,
            overallHealth: 82.1,
        };
    }
    async getPerformanceMetrics(organizationId, timeframe) {
        return {
            kpiAchievement: 75.5,
            goalSuccessRate: 68.2,
            avgCompletionTime: 28.5,
            performanceTrend: 'improving',
            topPerformers: [],
            improvementRate: 15.3,
        };
    }
    async getEngagementMetrics(organizationId, timeframe) {
        return {
            dau: 450,
            wau: 650,
            mau: 750,
            retention: {
                day1: 95,
                day7: 75,
                day30: 60,
            },
            sessionMetrics: {
                avgDuration: 25.5,
                avgFrequency: 3.2,
                totalSessions: 15000,
            },
            engagementDistribution: {},
        };
    }
    async getBehavioralMetrics(organizationId, timeframe) {
        return {
            patterns: [],
            segments: [],
            journeys: [],
            anomalies: [],
        };
    }
    async getPredictionMetrics(organizationId) {
        return {
            churnRisk: {
                high: 5,
                medium: 15,
                low: 80,
            },
            goalSuccess: {
                onTrack: 70,
                atRisk: 20,
                failing: 10,
            },
            engagementForecast: {},
        };
    }
    async getInsightMetrics(organizationId, timeframe) {
        return {
            totalInsights: 250,
            actionableInsights: 180,
            criticalInsights: 15,
            insightCategories: {
                performance: 80,
                engagement: 60,
                goal: 70,
                habit: 40,
            },
            insightTrends: [],
        };
    }
    async getUserPredictions(userId) {
        return {
            goalSuccess: 0.75,
            engagementTrend: 'stable',
            churnRisk: 0.15,
        };
    }
    async getUserComparisons(userId) {
        return {
            percentile: 75,
            peerAverage: 65,
            topPerformerAverage: 85,
        };
    }
    async getUserGoals(userId) {
        return [];
    }
    hasOrganizationAccess(userId, organizationId) {
        return true;
    }
    canAccessUserAnalytics(requesterId, targetUserId) {
        return requesterId === targetUserId || this.isAdmin(requesterId);
    }
    isAdmin(userId) {
        return false;
    }
}
exports.AnalyticsDashboardController = AnalyticsDashboardController;
exports.default = new AnalyticsDashboardController();
