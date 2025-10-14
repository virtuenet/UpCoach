"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coachIntelligenceValidation = exports.CoachIntelligenceController = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const KpiTracker_1 = tslib_1.__importDefault(require("../models/analytics/KpiTracker"));
const UserAnalytics_1 = tslib_1.__importDefault(require("../models/analytics/UserAnalytics"));
const CoachMemory_1 = tslib_1.__importDefault(require("../models/coaching/CoachMemory"));
const CoachIntelligenceService_1 = tslib_1.__importDefault(require("../services/coaching/CoachIntelligenceService"));
const CoachIntelligenceServiceEnhanced_1 = require("../services/coaching/CoachIntelligenceServiceEnhanced");
const MissedSessionsCalculator_1 = require("../services/coaching/MissedSessionsCalculator");
const logger_1 = require("../utils/logger");
class CoachIntelligenceController {
    coachIntelligenceService;
    constructor() {
        this.coachIntelligenceService = new CoachIntelligenceService_1.default();
    }
    async processSession(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { userId, avatarId, sessionId, currentTopic, userMood, conversationHistory, goals, conversationContent, sessionDuration, userFeedback, } = req.body;
            const context = {
                userId,
                avatarId,
                sessionId,
                currentTopic,
                userMood,
                conversationHistory,
                goals,
            };
            const memory = await this.coachIntelligenceService.processCoachingSession(context, conversationContent, sessionDuration, userFeedback);
            _res.status(201).json({
                success: true,
                message: 'Coaching session processed successfully',
                data: {
                    memoryId: memory.id,
                    insights: memory.insightsGenerated,
                    importance: memory.importance,
                    relevanceScore: memory.relevanceScore,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error processing coaching session:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to process coaching session',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'Internal server error',
            });
        }
    }
    async getRelevantMemories(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { userId } = req.params;
            const { topics, mood, recentGoals, limit = 10 } = req.query;
            const currentContext = {
                topics: topics ? topics.split(',') : [],
                mood: mood || 'neutral',
                recentGoals: recentGoals ? recentGoals.split(',') : [],
            };
            const memories = await this.coachIntelligenceService.getRelevantMemories(userId, currentContext, parseInt(limit, 10));
            _res.status(200).json({
                success: true,
                message: 'Relevant memories retrieved successfully',
                data: {
                    memories: memories.map(memory => ({
                        id: memory.id,
                        memoryType: memory.memoryType,
                        summary: memory.summary,
                        tags: memory.tags,
                        emotionalContext: memory.emotionalContext,
                        coachingContext: memory.coachingContext,
                        conversationDate: memory.conversationDate,
                        importance: memory.importance,
                        relevanceScore: memory.relevanceScore,
                        accessCount: memory.accessCount,
                    })),
                    totalCount: memories.length,
                    contextUsed: currentContext,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error retrieving relevant memories:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to retrieve relevant memories',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'Internal server error',
            });
        }
    }
    async getCoachingRecommendations(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { userId } = req.params;
            const { avatarId } = req.query;
            const recommendations = await this.coachIntelligenceService.generateCoachingRecommendations(userId, avatarId);
            _res.status(200).json({
                success: true,
                message: 'Coaching recommendations generated successfully',
                data: {
                    recommendations,
                    generatedAt: new Date(),
                    totalRecommendations: recommendations.length,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating coaching recommendations:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to generate coaching recommendations',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'Internal server error',
            });
        }
    }
    async getWeeklyReport(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { userId } = req.params;
            const report = await this.coachIntelligenceService.generateWeeklyReport(userId);
            _res.status(200).json({
                success: true,
                message: 'Weekly report generated successfully',
                data: report,
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating weekly report:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to generate weekly report',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'Internal server error',
            });
        }
    }
    async getUserAnalytics(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { userId } = req.params;
            const { periodType = 'weekly' } = req.query;
            const analytics = await this.coachIntelligenceService.calculateUserAnalytics(userId, periodType);
            _res.status(200).json({
                success: true,
                message: 'User analytics retrieved successfully',
                data: {
                    analytics,
                    overallHealthScore: analytics.getOverallHealthScore(),
                    trendingDirection: analytics.getTrendingDirection(),
                    isAtRisk: analytics.isAtRisk(),
                    recommendations: analytics.getPersonalizedRecommendations(),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error retrieving user analytics:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to retrieve user analytics',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'Internal server error',
            });
        }
    }
    async getUserMemories(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { userId } = req.params;
            const { memoryType, tags, startDate, endDate, page = 1, limit = 20, sortBy = 'conversationDate', sortOrder = 'DESC', } = req.query;
            const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
            const whereClause = { userId };
            if (memoryType) {
                whereClause.memoryType = memoryType;
            }
            if (tags) {
                whereClause.tags = {
                    $overlap: tags.split(','),
                };
            }
            if (startDate || endDate) {
                whereClause.conversationDate = {};
                if (startDate) {
                    whereClause.conversationDate.$gte = new Date(startDate);
                }
                if (endDate) {
                    whereClause.conversationDate.$lte = new Date(endDate);
                }
            }
            const { count, rows: memories } = await CoachMemory_1.default.findAndCountAll({
                where: whereClause,
                order: [[sortBy, sortOrder]],
                limit: parseInt(limit, 10),
                offset,
            });
            _res.status(200).json({
                success: true,
                message: 'User memories retrieved successfully',
                data: {
                    memories: memories.map(memory => ({
                        id: memory.id,
                        memoryType: memory.memoryType,
                        summary: memory.summary,
                        tags: memory.tags,
                        emotionalContext: memory.emotionalContext,
                        coachingContext: memory.coachingContext,
                        conversationDate: memory.conversationDate,
                        importance: memory.importance,
                        relevanceScore: memory.relevanceScore,
                        accessCount: memory.accessCount,
                        isRelevant: memory.isRelevant(),
                    })),
                    pagination: {
                        page: parseInt(page, 10),
                        limit: parseInt(limit, 10),
                        totalItems: count,
                        totalPages: Math.ceil(count / parseInt(limit, 10)),
                    },
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error retrieving user memories:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to retrieve user memories',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'Internal server error',
            });
        }
    }
    async createKpiTracker(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const kpiTracker = await KpiTracker_1.default.create(req.body);
            _res.status(201).json({
                success: true,
                message: 'KPI tracker created successfully',
                data: {
                    kpiTracker,
                    overallProgress: kpiTracker.calculateOverallProgress(),
                    isAtRisk: kpiTracker.isAtRisk(),
                    nextMilestone: kpiTracker.getNextMilestone(),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating KPI tracker:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to create KPI tracker',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'Internal server error',
            });
        }
    }
    async getUserKpiTrackers(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { userId } = req.params;
            const { status, category, type } = req.query;
            const whereClause = { userId };
            if (status) {
                whereClause.status = status;
            }
            if (category) {
                whereClause.category = category;
            }
            if (type) {
                whereClause.type = type;
            }
            const kpiTrackers = await KpiTracker_1.default.findAll({
                where: whereClause,
                order: [
                    ['priority', 'DESC'],
                    ['createdAt', 'DESC'],
                ],
            });
            const trackersWithAnalytics = kpiTrackers.map(tracker => ({
                ...tracker.toJSON(),
                overallProgress: tracker.calculateOverallProgress(),
                isAtRisk: tracker.isAtRisk(),
                velocityScore: tracker.calculateVelocityScore(),
                nextMilestone: tracker.getNextMilestone(),
                overdueActionItems: tracker.getOverdueActionItems(),
            }));
            _res.status(200).json({
                success: true,
                message: 'KPI trackers retrieved successfully',
                data: {
                    kpiTrackers: trackersWithAnalytics,
                    summary: {
                        total: kpiTrackers.length,
                        inProgress: kpiTrackers.filter(t => t.status === 'in_progress').length,
                        atRisk: kpiTrackers.filter(t => t.isAtRisk()).length,
                        completed: kpiTrackers.filter(t => t.status === 'completed').length,
                    },
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error retrieving KPI trackers:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to retrieve KPI trackers',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'Internal server error',
            });
        }
    }
    async updateKpiProgress(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { id } = req.params;
            const { value, note, context } = req.body;
            const kpiTracker = await KpiTracker_1.default.findByPk(id);
            if (!kpiTracker) {
                _res.status(404).json({
                    success: false,
                    message: 'KPI tracker not found',
                });
                return;
            }
            kpiTracker.addPerformanceData(value, note, context);
            await kpiTracker.save();
            _res.status(200).json({
                success: true,
                message: 'KPI progress updated successfully',
                data: {
                    kpiTracker,
                    overallProgress: kpiTracker.calculateOverallProgress(),
                    velocityScore: kpiTracker.calculateVelocityScore(),
                    isAtRisk: kpiTracker.isAtRisk(),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating KPI progress:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to update KPI progress',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'Internal server error',
            });
        }
    }
    async getCohortAnalytics(req, _res) {
        try {
            const { cohortId, periodType = 'weekly' } = req.query;
            const whereClause = {};
            if (cohortId) {
                whereClause['$UserAnalytics.benchmarkData.cohortId$'] = cohortId;
            }
            const analytics = await UserAnalytics_1.default.findAll({
                where: {
                    periodType: periodType,
                    calculatedAt: {
                        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                    ...whereClause,
                },
                order: [['calculatedAt', 'DESC']],
            });
            const cohortMetrics = {
                totalUsers: analytics.length,
                averageEngagement: analytics.reduce((sum, a) => sum + a.engagementMetrics.participationScore, 0) /
                    analytics.length,
                averageGoalCompletion: analytics.reduce((sum, a) => sum + a.coachingMetrics.goalCompletionRate, 0) /
                    analytics.length,
                averageSatisfaction: analytics.reduce((sum, a) => sum + a.kpiMetrics.userSatisfactionScore, 0) /
                    analytics.length,
                churnRisk: analytics.filter(a => a.kpiMetrics.churnRisk > 0.7).length,
                topStrengthAreas: this.aggregateStringArrays(analytics.map(a => a.aiInsights.strengthAreas)),
                topImprovementAreas: this.aggregateStringArrays(analytics.map(a => a.aiInsights.improvementAreas)),
            };
            _res.status(200).json({
                success: true,
                message: 'Cohort analytics retrieved successfully',
                data: {
                    cohortMetrics,
                    individualAnalytics: analytics,
                    generatedAt: new Date(),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error retrieving cohort analytics:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to retrieve cohort analytics',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'Internal server error',
            });
        }
    }
    async getEngagementScore(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { userId } = req.params;
            const engagementMetrics = await CoachIntelligenceServiceEnhanced_1.coachIntelligenceService.calculateEngagementScore(userId);
            _res.status(200).json({
                success: true,
                message: 'Engagement score calculated successfully',
                data: {
                    engagementMetrics,
                    riskAssessment: {
                        level: engagementMetrics.churnRisk > 0.7 ? 'high' :
                            engagementMetrics.churnRisk > 0.4 ? 'medium' : 'low',
                        recommendations: engagementMetrics.churnRisk > 0.5 ? [
                            'Schedule immediate check-in',
                            'Review engagement patterns',
                            'Adjust coaching frequency'
                        ] : [
                            'Continue current approach',
                            'Monitor for changes'
                        ]
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error calculating engagement score:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to calculate engagement score',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    async getMissedSessions(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { userId } = req.params;
            const missedSessionsData = await MissedSessionsCalculator_1.missedSessionsCalculator.calculateMissedSessions(userId);
            _res.status(200).json({
                success: true,
                message: 'Missed sessions data retrieved successfully',
                data: {
                    missedSessions: missedSessionsData,
                    actionRequired: missedSessionsData.riskLevel === 'high' || missedSessionsData.riskLevel === 'critical',
                    urgencyLevel: missedSessionsData.riskLevel,
                    nextActions: missedSessionsData.recommendations.slice(0, 3)
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error retrieving missed sessions data:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to retrieve missed sessions data',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    async getMissedSessionsAnalytics(req, _res) {
        try {
            const analytics = await MissedSessionsCalculator_1.missedSessionsCalculator.getMissedSessionsAnalytics();
            _res.status(200).json({
                success: true,
                message: 'Missed sessions analytics retrieved successfully',
                data: {
                    analytics,
                    generatedAt: new Date(),
                    alerts: {
                        highRiskUsers: analytics.summary.highRiskUsers,
                        totalMissedSessions: analytics.summary.totalMissedSessions,
                        averageMissedSessions: analytics.summary.averageMissedSessions
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error retrieving missed sessions analytics:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to retrieve missed sessions analytics',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    async predictAtRiskUsers(req, _res) {
        try {
            const atRiskUsers = await MissedSessionsCalculator_1.missedSessionsCalculator.predictAtRiskUsers();
            _res.status(200).json({
                success: true,
                message: 'At-risk users prediction completed',
                data: {
                    atRiskUsers: atRiskUsers.slice(0, 20),
                    totalAtRisk: atRiskUsers.length,
                    criticalUsers: atRiskUsers.filter(u => u.riskScore > 0.8).length,
                    interventionRequired: atRiskUsers.filter(u => u.riskScore > 0.7).length
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error predicting at-risk users:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to predict at-risk users',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    async setSessionExpectations(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { userId } = req.params;
            const { expectedSessionsPerWeek, preferredDays, preferredTimes, customSchedule } = req.body;
            await MissedSessionsCalculator_1.missedSessionsCalculator.setUserSessionExpectation(userId, {
                userId,
                expectedSessionsPerWeek,
                preferredDays,
                preferredTimes,
                customSchedule
            });
            _res.status(200).json({
                success: true,
                message: 'Session expectations set successfully',
                data: {
                    userId,
                    expectedSessionsPerWeek,
                    preferredDays,
                    preferredTimes
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error setting session expectations:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to set session expectations',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    async trackCustomKPI(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { userId } = req.params;
            const { kpiName, value, metadata } = req.body;
            const customKPI = await CoachIntelligenceServiceEnhanced_1.coachIntelligenceService.trackCustomKPI(userId, kpiName, value, metadata);
            _res.status(201).json({
                success: true,
                message: 'Custom KPI tracked successfully',
                data: {
                    customKPI,
                    trendAnalysis: {
                        direction: customKPI.trend,
                        forecast: customKPI.forecast,
                        achievement: `${Math.round(customKPI.achievement)}%`
                    },
                    nextSteps: customKPI.insights.slice(0, 3)
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error tracking custom KPI:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to track custom KPI',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    async generateKPIReport(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { userId } = req.params;
            const { period = 'month' } = req.query;
            const kpiReport = await CoachIntelligenceServiceEnhanced_1.coachIntelligenceService.generateKPIReport(userId, period);
            _res.status(200).json({
                success: true,
                message: 'KPI report generated successfully',
                data: {
                    report: kpiReport,
                    executiveSummary: {
                        overallPerformance: `${Math.round(kpiReport.performanceScore * 100)}%`,
                        topPerformer: kpiReport.kpis.length > 0 ? kpiReport.kpis[0].name : 'N/A',
                        priorityActions: kpiReport.recommendations.slice(0, 3),
                        riskAreas: kpiReport.kpis.filter(k => k.trend === 'down').length
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating KPI report:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to generate KPI report',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    async predictUserSuccess(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { userId } = req.params;
            const { goalId } = req.query;
            const prediction = await CoachIntelligenceServiceEnhanced_1.coachIntelligenceService.predictUserSuccess(userId, goalId);
            _res.status(200).json({
                success: true,
                message: 'Success prediction completed',
                data: {
                    prediction,
                    summary: {
                        successLikelihood: `${Math.round(prediction.successProbability * 100)}%`,
                        confidenceLevel: `${Math.round(prediction.confidenceLevel * 100)}%`,
                        estimatedDays: Math.round(prediction.timeToGoal),
                        riskFactorCount: prediction.riskFactors.length,
                        successFactorCount: prediction.successFactors.length
                    },
                    actionPlan: prediction.recommendedActions.slice(0, 5)
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error predicting user success:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to predict user success',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    async getBehaviorInsights(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { userId } = req.params;
            const behaviorInsights = await CoachIntelligenceServiceEnhanced_1.coachIntelligenceService.generateBehaviorInsights(userId);
            _res.status(200).json({
                success: true,
                message: 'Behavior insights generated successfully',
                data: {
                    insights: behaviorInsights,
                    summary: {
                        totalPatterns: behaviorInsights.length,
                        positivePatterns: behaviorInsights.filter(i => i.impact === 'positive').length,
                        areasForImprovement: behaviorInsights.filter(i => i.impact === 'negative').length,
                        keyRecommendations: behaviorInsights.flatMap(i => i.recommendations).slice(0, 5)
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating behavior insights:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to generate behavior insights',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    aggregateStringArrays(arrays) {
        const counts = {};
        arrays.flat().forEach(item => {
            counts[item] = (counts[item] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([item, count]) => ({ item, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }
}
exports.CoachIntelligenceController = CoachIntelligenceController;
exports.coachIntelligenceValidation = {
    processSession: [
        (0, express_validator_1.body)('userId').isUUID().withMessage('Valid user ID is required'),
        (0, express_validator_1.body)('avatarId').isUUID().withMessage('Valid avatar ID is required'),
        (0, express_validator_1.body)('sessionId').isUUID().withMessage('Valid session ID is required'),
        (0, express_validator_1.body)('currentTopic').isString().withMessage('Current topic is required'),
        (0, express_validator_1.body)('userMood').isString().withMessage('User mood is required'),
        (0, express_validator_1.body)('conversationContent')
            .isString()
            .isLength({ min: 10 })
            .withMessage('Conversation content must be at least 10 characters'),
        (0, express_validator_1.body)('sessionDuration')
            .isInt({ min: 1 })
            .withMessage('Session duration must be a positive integer'),
        (0, express_validator_1.body)('userFeedback.rating')
            .optional()
            .isInt({ min: 1, max: 10 })
            .withMessage('Rating must be between 1 and 10'),
    ],
    getRelevantMemories: [
        (0, express_validator_1.param)('userId').isUUID().withMessage('Valid user ID is required'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Limit must be between 1 and 50'),
    ],
    getCoachingRecommendations: [
        (0, express_validator_1.param)('userId').isUUID().withMessage('Valid user ID is required'),
        (0, express_validator_1.query)('avatarId').optional().isUUID().withMessage('Avatar ID must be valid UUID'),
    ],
    getWeeklyReport: [(0, express_validator_1.param)('userId').isUUID().withMessage('Valid user ID is required')],
    getUserAnalytics: [
        (0, express_validator_1.param)('userId').isUUID().withMessage('Valid user ID is required'),
        (0, express_validator_1.query)('periodType')
            .optional()
            .isIn(['daily', 'weekly', 'monthly', 'quarterly'])
            .withMessage('Invalid period type'),
    ],
    getUserMemories: [
        (0, express_validator_1.param)('userId').isUUID().withMessage('Valid user ID is required'),
        (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
    ],
    createKpiTracker: [
        (0, express_validator_1.body)('userId').isUUID().withMessage('Valid user ID is required'),
        (0, express_validator_1.body)('type')
            .isIn(['kpi', 'okr', 'personal_goal', 'team_goal'])
            .withMessage('Invalid tracker type'),
        (0, express_validator_1.body)('title')
            .isString()
            .isLength({ min: 3, max: 200 })
            .withMessage('Title must be between 3 and 200 characters'),
        (0, express_validator_1.body)('description')
            .isString()
            .isLength({ min: 10 })
            .withMessage('Description must be at least 10 characters'),
        (0, express_validator_1.body)('category')
            .isIn([
            'financial',
            'professional',
            'personal',
            'health',
            'relationships',
            'skills',
            'custom',
        ])
            .withMessage('Invalid category'),
        (0, express_validator_1.body)('startDate').isISO8601().withMessage('Valid start date is required'),
        (0, express_validator_1.body)('endDate').isISO8601().withMessage('Valid end date is required'),
        (0, express_validator_1.body)('priority')
            .optional()
            .isIn(['low', 'medium', 'high', 'critical'])
            .withMessage('Invalid priority'),
    ],
    getUserKpiTrackers: [(0, express_validator_1.param)('userId').isUUID().withMessage('Valid user ID is required')],
    updateKpiProgress: [
        (0, express_validator_1.param)('id').isUUID().withMessage('Valid KPI tracker ID is required'),
        (0, express_validator_1.body)('value').isNumeric().withMessage('Progress value must be numeric'),
        (0, express_validator_1.body)('note').optional().isString().withMessage('Note must be a string'),
        (0, express_validator_1.body)('context').optional().isString().withMessage('Context must be a string'),
    ],
    getEngagementScore: [(0, express_validator_1.param)('userId').isUUID().withMessage('Valid user ID is required')],
    getMissedSessions: [(0, express_validator_1.param)('userId').isUUID().withMessage('Valid user ID is required')],
    setSessionExpectations: [
        (0, express_validator_1.param)('userId').isUUID().withMessage('Valid user ID is required'),
        (0, express_validator_1.body)('expectedSessionsPerWeek')
            .isInt({ min: 1, max: 21 })
            .withMessage('Expected sessions per week must be between 1 and 21'),
        (0, express_validator_1.body)('preferredDays')
            .isArray()
            .withMessage('Preferred days must be an array'),
        (0, express_validator_1.body)('preferredTimes')
            .isArray()
            .withMessage('Preferred times must be an array'),
    ],
    trackCustomKPI: [
        (0, express_validator_1.param)('userId').isUUID().withMessage('Valid user ID is required'),
        (0, express_validator_1.body)('kpiName')
            .isString()
            .isLength({ min: 3, max: 100 })
            .withMessage('KPI name must be between 3 and 100 characters'),
        (0, express_validator_1.body)('value').isNumeric().withMessage('KPI value must be numeric'),
        (0, express_validator_1.body)('metadata').optional().isObject().withMessage('Metadata must be an object'),
    ],
    generateKPIReport: [
        (0, express_validator_1.param)('userId').isUUID().withMessage('Valid user ID is required'),
        (0, express_validator_1.query)('period')
            .optional()
            .isIn(['week', 'month', 'quarter'])
            .withMessage('Period must be week, month, or quarter'),
    ],
    predictUserSuccess: [
        (0, express_validator_1.param)('userId').isUUID().withMessage('Valid user ID is required'),
        (0, express_validator_1.query)('goalId').optional().isUUID().withMessage('Goal ID must be a valid UUID'),
    ],
    getBehaviorInsights: [(0, express_validator_1.param)('userId').isUUID().withMessage('Valid user ID is required')],
};
exports.default = CoachIntelligenceController;
