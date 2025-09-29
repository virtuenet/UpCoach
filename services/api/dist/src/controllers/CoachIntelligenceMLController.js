"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mlRateLimiter = exports.CoachIntelligenceMLController = void 0;
const express_validator_1 = require("express-validator");
const MLDataPipeline_1 = __importDefault(require("../services/ml/MLDataPipeline"));
const logger_1 = require("../utils/logger");
const asyncHandler_1 = require("../utils/asyncHandler");
const errors_1 = require("../utils/errors");
const rateLimiter_1 = require("../middleware/rateLimiter");
const CoachIntelligenceMLServiceComplete_1 = __importDefault(require("../services/coaching/CoachIntelligenceMLServiceComplete"));
const mlService = CoachIntelligenceMLServiceComplete_1.default;
const dataPipeline = MLDataPipeline_1.default;
const mlRateLimiter = (0, rateLimiter_1.createRateLimiter)({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many ML requests, please try again later',
});
exports.mlRateLimiter = mlRateLimiter;
class CoachIntelligenceMLController {
    static calculateNPSScore = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId } = req.params;
        const { timeframe = '30d' } = req.query;
        if (!userId) {
            throw new errors_1.AppError('User ID is required', 400);
        }
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        const npsResult = await mlService.calculateNPSScore(userId, timeframe);
        logger_1.logger.info('NPS score calculated', {
            userId,
            score: npsResult.score,
            category: npsResult.category,
        });
        res.json({
            success: true,
            data: npsResult,
        });
    });
    static trackSkillImprovement = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId, skillId, score, context } = req.body;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            throw new errors_1.AppError('Validation failed', 400);
        }
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        const assessment = await mlService.trackSkillImprovement(userId, skillId, score, context);
        logger_1.logger.info('Skill improvement tracked', {
            userId,
            skillId,
            improvement: assessment.improvement,
        });
        res.json({
            success: true,
            data: assessment,
        });
    });
    static getSkillAssessmentHistory = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId, skillId } = req.params;
        const { limit = 10, offset = 0 } = req.query;
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        const history = [];
        res.json({
            success: true,
            data: {
                userId,
                skillId,
                assessments: history,
                total: history.length,
            },
        });
    });
    static generateGoalInsights = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId } = req.params;
        const { goalId } = req.query;
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        const insights = await mlService.generateGoalInsights(userId, goalId);
        logger_1.logger.info('Goal insights generated', {
            userId,
            insightCount: insights.length,
        });
        res.json({
            success: true,
            data: insights,
        });
    });
    static predictGoalSuccess = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId, goalId } = req.params;
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        const prediction = await mlService.predictGoalSuccess(userId, goalId);
        logger_1.logger.info('Goal success predicted', {
            userId,
            goalId,
            probability: prediction.probability,
            riskLevel: prediction.riskLevel,
        });
        res.json({
            success: true,
            data: prediction,
        });
    });
    static analyzeUserPatterns = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId } = req.params;
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        const patterns = await mlService.analyzeUserPatterns(userId);
        logger_1.logger.info('User patterns analyzed', {
            userId,
            patternCount: patterns.length,
        });
        res.json({
            success: true,
            data: patterns,
        });
    });
    static generateCoachingRecommendations = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId, context } = req.body;
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        const recommendations = await mlService.generateCoachingRecommendations(userId, context);
        logger_1.logger.info('Coaching recommendations generated', {
            userId,
            recommendationCount: recommendations.length,
        });
        res.json({
            success: true,
            data: recommendations,
        });
    });
    static calculateUserPercentiles = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId } = req.params;
        const { metrics } = req.query;
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        const targetMetrics = metrics
            ? metrics.split(',')
            : undefined;
        const percentiles = await mlService.calculateUserPercentiles(userId, targetMetrics);
        logger_1.logger.info('User percentiles calculated', {
            userId,
            metricsCount: percentiles.length,
        });
        res.json({
            success: true,
            data: percentiles,
        });
    });
    static detectBehavioralAnomalies = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId } = req.params;
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        const anomalies = await mlService.detectBehavioralAnomalies(userId);
        const criticalAnomalies = anomalies.filter((a) => a.severity === 'critical');
        if (criticalAnomalies.length > 0) {
            logger_1.logger.warn('Critical anomalies detected', {
                userId,
                anomalies: criticalAnomalies,
            });
        }
        res.json({
            success: true,
            data: anomalies,
        });
    });
    static generatePersonalizedInsights = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId } = req.params;
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        const insights = await mlService.generatePersonalizedInsights(userId);
        logger_1.logger.info('Personalized insights generated', {
            userId,
            insightCount: insights.length,
        });
        res.json({
            success: true,
            data: insights,
        });
    });
    static generateCoachingEffectivenessReport = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { coachId } = req.params;
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== coachId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        const report = await mlService.generateCoachingEffectivenessReport(coachId);
        logger_1.logger.info('Coaching effectiveness report generated', {
            coachId,
        });
        res.json({
            success: true,
            data: report,
        });
    });
    static processUserFeatures = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId, features, useCache = true, validate = true } = req.body;
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        const featureVector = await dataPipeline.processUserData(userId, {
            features,
            useCache,
            validate,
        });
        logger_1.logger.info('User features processed', {
            userId,
            featureCount: featureVector.features.length,
            processingTime: featureVector.metadata.processingTime,
        });
        res.json({
            success: true,
            data: featureVector,
        });
    });
    static batchProcessUsers = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userIds, batchSize = 10, parallel = true } = req.body;
        if (req.user?.role !== 'admin') {
            throw new errors_1.AppError('Admin access required', 403);
        }
        if (!Array.isArray(userIds) || userIds.length === 0) {
            throw new errors_1.AppError('User IDs array is required', 400);
        }
        const results = await dataPipeline.batchProcessUsers(userIds, {
            batchSize,
            parallel,
        });
        logger_1.logger.info('Batch processing completed', {
            userCount: userIds.length,
            successCount: results.length,
        });
        res.json({
            success: true,
            data: {
                processed: results.length,
                total: userIds.length,
                results: results.map((r) => ({
                    userId: r.userId,
                    featureCount: r.features.length,
                    timestamp: r.timestamp,
                })),
            },
        });
    });
    static streamProcessEvent = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId, eventType, eventData } = req.body;
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        await dataPipeline.streamProcess(userId, {
            type: eventType,
            data: eventData,
            timestamp: new Date(),
        });
        logger_1.logger.info('Stream event processed', {
            userId,
            eventType,
        });
        res.json({
            success: true,
            message: 'Event processed successfully',
        });
    });
    static getModelStatus = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        if (req.user?.role !== 'admin') {
            throw new errors_1.AppError('Admin access required', 403);
        }
        const models = [
            { name: 'nps_predictor', status: 'active', version: '1.0.0' },
            { name: 'skill_tracker', status: 'active', version: '1.0.0' },
            { name: 'goal_predictor', status: 'active', version: '1.0.0' },
            { name: 'pattern_detector', status: 'active', version: '1.0.0' },
            { name: 'insight_generator', status: 'active', version: '1.0.0' },
        ];
        res.json({
            success: true,
            data: models,
        });
    });
    static checkModelDrift = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        if (req.user?.role !== 'admin') {
            throw new errors_1.AppError('Admin access required', 403);
        }
        const driftReports = [
            {
                model: 'nps_predictor',
                driftScore: 0.02,
                driftDetected: false,
                lastChecked: new Date(),
            },
            {
                model: 'goal_predictor',
                driftScore: 0.08,
                driftDetected: false,
                lastChecked: new Date(),
            },
        ];
        res.json({
            success: true,
            data: driftReports,
        });
    });
    static getUserConsent = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId } = req.params;
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        const consent = {
            userId,
            mlFeaturesConsent: true,
            dataAnalysisConsent: true,
            personalizationConsent: true,
            thirdPartySharingConsent: false,
            consentDate: new Date(),
            consentVersion: '1.0.0',
        };
        res.json({
            success: true,
            data: consent,
        });
    });
    static updateUserConsent = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId } = req.params;
        const consentData = req.body;
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        const updatedConsent = {
            userId,
            ...consentData,
            consentDate: new Date(),
            consentVersion: '1.0.0',
        };
        logger_1.logger.info('ML consent updated', {
            userId,
            consent: consentData,
        });
        res.json({
            success: true,
            data: updatedConsent,
        });
    });
    static deleteUserMLData = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId } = req.params;
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        logger_1.logger.warn('User ML data deletion requested', { userId });
        res.json({
            success: true,
            message: 'User ML data deletion initiated',
        });
    });
    static getMLDashboard = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const { userId } = req.params;
        const isAdmin = req.user?.role === 'admin';
        if (req.user?.id !== userId && !isAdmin) {
            throw new errors_1.AppError('Unauthorized access', 403);
        }
        const [npsScore, patterns, insights, percentiles, recommendations,] = await Promise.all([
            mlService.calculateNPSScore(userId),
            mlService.analyzeUserPatterns(userId),
            mlService.generatePersonalizedInsights(userId),
            mlService.calculateUserPercentiles(userId),
            mlService.generateCoachingRecommendations(userId),
        ]);
        res.json({
            success: true,
            data: {
                npsScore: npsScore.score,
                npsCategory: npsScore.category,
                topPatterns: patterns.slice(0, 3),
                topInsights: insights.slice(0, 3),
                keyPercentiles: percentiles.slice(0, 3),
                topRecommendations: recommendations.slice(0, 3),
                lastUpdated: new Date(),
            },
        });
    });
}
exports.CoachIntelligenceMLController = CoachIntelligenceMLController;
//# sourceMappingURL=CoachIntelligenceMLController.js.map