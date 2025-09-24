"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const PredictiveCoachingEngine_1 = __importDefault(require("../services/ml/PredictiveCoachingEngine"));
const MLModelMonitoringService_1 = __importDefault(require("../services/ml/MLModelMonitoringService"));
const RealTimeInsightsGenerator_1 = __importDefault(require("../services/ml/RealTimeInsightsGenerator"));
const router = (0, express_1.Router)();
router.post('/predict/goal-success', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 30 }), [
    (0, express_validator_1.body)('goalId').isUUID(),
    (0, express_validator_1.body)('userId').isUUID(),
    (0, express_validator_1.body)('timeframe').optional().isInt({ min: 1, max: 365 }),
], async (req, res) => {
    try {
        const { goalId, userId, timeframe } = req.body;
        const prediction = await PredictiveCoachingEngine_1.default.predictGoalSuccess(goalId, userId, timeframe);
        res.status(200).json({
            success: true,
            data: prediction,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to generate goal prediction',
        });
    }
});
router.post('/predict/behavior', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 30 }), [
    (0, express_validator_1.body)('userId').isUUID(),
    (0, express_validator_1.body)('timeframe').optional().isInt({ min: 1, max: 30 }),
], async (req, res) => {
    try {
        const { userId, timeframe } = req.body;
        const predictions = await PredictiveCoachingEngine_1.default.predictBehaviorPatterns(userId, timeframe);
        res.status(200).json({
            success: true,
            data: predictions,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to predict behavior patterns',
        });
    }
});
router.post('/predict/engagement', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 30 }), [
    (0, express_validator_1.body)('userId').isUUID(),
    (0, express_validator_1.body)('period').optional().isIn(['day', 'week', 'month']),
], async (req, res) => {
    try {
        const { userId, period } = req.body;
        const prediction = await PredictiveCoachingEngine_1.default.predictEngagement(userId, period);
        res.status(200).json({
            success: true,
            data: prediction,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to predict engagement',
        });
    }
});
router.post('/optimize/coaching-path', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 20 }), [
    (0, express_validator_1.body)('userId').isUUID(),
    (0, express_validator_1.body)('goals').isArray(),
    (0, express_validator_1.body)('goals.*').isUUID(),
    (0, express_validator_1.body)('constraints.timeAvailable').isInt({ min: 0 }),
    (0, express_validator_1.body)('constraints.resources').optional().isArray(),
    (0, express_validator_1.body)('constraints.preferences').optional().isObject(),
], async (req, res) => {
    try {
        const { userId, goals, constraints } = req.body;
        const optimization = await PredictiveCoachingEngine_1.default.optimizeCoachingPath(userId, goals, constraints);
        res.status(200).json({
            success: true,
            data: optimization,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to optimize coaching path',
        });
    }
});
router.post('/models/register', auth_1.authenticate, (0, auth_1.authorize)(['admin']), (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 10 }), [
    (0, express_validator_1.body)('modelId').isString(),
    (0, express_validator_1.body)('modelName').isString(),
    (0, express_validator_1.body)('version').isString(),
    (0, express_validator_1.body)('config').optional().isObject(),
], async (req, res) => {
    try {
        const { modelId, modelName, version, config } = req.body;
        await MLModelMonitoringService_1.default.registerModel(modelId, modelName, version, config);
        res.status(201).json({
            success: true,
            message: 'Model registered successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to register model',
        });
    }
});
router.post('/models/:modelId/record', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 1000 }), [
    (0, express_validator_1.param)('modelId').isString(),
    (0, express_validator_1.body)('prediction').exists(),
    (0, express_validator_1.body)('actual').optional(),
    (0, express_validator_1.body)('features').optional(),
    (0, express_validator_1.body)('metadata').optional().isObject(),
], async (req, res) => {
    try {
        const { modelId } = req.params;
        const { prediction, actual, features, metadata } = req.body;
        await MLModelMonitoringService_1.default.recordPrediction(modelId, prediction, actual, features, metadata);
        res.status(200).json({
            success: true,
            message: 'Prediction recorded',
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to record prediction',
        });
    }
});
router.get('/models/:modelId/metrics', auth_1.authenticate, (0, auth_1.authorize)(['admin', 'analyst']), (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 30 }), [
    (0, express_validator_1.param)('modelId').isString(),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
], async (req, res) => {
    try {
        const { modelId } = req.params;
        const { startDate, endDate } = req.query;
        const timeRange = startDate && endDate ? {
            start: new Date(startDate),
            end: new Date(endDate),
        } : undefined;
        const metrics = await MLModelMonitoringService_1.default.getModelMetrics(modelId, timeRange);
        res.status(200).json({
            success: true,
            data: metrics,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to get model metrics',
        });
    }
});
router.get('/models/:modelId/drift', auth_1.authenticate, (0, auth_1.authorize)(['admin', 'analyst']), (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 30 }), [(0, express_validator_1.param)('modelId').isString()], async (req, res) => {
    try {
        const { modelId } = req.params;
        const drift = await MLModelMonitoringService_1.default.getDriftAnalysis(modelId);
        res.status(200).json({
            success: true,
            data: drift,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to get drift analysis',
        });
    }
});
router.get('/models/:modelId/health', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 60 }), [(0, express_validator_1.param)('modelId').isString()], async (req, res) => {
    try {
        const { modelId } = req.params;
        const health = await MLModelMonitoringService_1.default.getModelHealth(modelId);
        res.status(200).json({
            success: true,
            data: health,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to get model health',
        });
    }
});
router.get('/models/:modelId/performance', auth_1.authenticate, (0, auth_1.authorize)(['admin', 'analyst']), (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 30 }), [
    (0, express_validator_1.param)('modelId').isString(),
    (0, express_validator_1.query)('period').optional().isIn(['hour', 'day', 'week', 'month']),
], async (req, res) => {
    try {
        const { modelId } = req.params;
        const { period } = req.query;
        const report = await MLModelMonitoringService_1.default.getPerformanceReport(modelId, period);
        res.status(200).json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to get performance report',
        });
    }
});
router.get('/alerts', auth_1.authenticate, (0, auth_1.authorize)(['admin']), (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 30 }), [(0, express_validator_1.query)('modelId').optional().isString()], async (req, res) => {
    try {
        const { modelId } = req.query;
        const alerts = await MLModelMonitoringService_1.default.getActiveAlerts(modelId);
        res.status(200).json({
            success: true,
            data: alerts,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to get alerts',
        });
    }
});
router.post('/alerts/:alertId/resolve', auth_1.authenticate, (0, auth_1.authorize)(['admin']), (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 30 }), [(0, express_validator_1.param)('alertId').isUUID()], async (req, res) => {
    try {
        const { alertId } = req.params;
        await MLModelMonitoringService_1.default.resolveAlert(alertId);
        res.status(200).json({
            success: true,
            message: 'Alert resolved',
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to resolve alert',
        });
    }
});
router.post('/insights/generate', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 60 }), [
    (0, express_validator_1.body)('userId').isUUID(),
    (0, express_validator_1.body)('timeframe').optional().isString(),
    (0, express_validator_1.body)('focus').optional().isArray(),
    (0, express_validator_1.body)('excludeTypes').optional().isArray(),
    (0, express_validator_1.body)('minImportance').optional().isFloat({ min: 0, max: 1 }),
    (0, express_validator_1.body)('maxInsights').optional().isInt({ min: 1, max: 100 }),
], async (req, res) => {
    try {
        const context = req.body;
        const insights = await RealTimeInsightsGenerator_1.default.generateInsights(context);
        res.status(200).json({
            success: true,
            data: insights,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to generate insights',
        });
    }
});
router.post('/insights/contextual', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 60 }), [
    (0, express_validator_1.body)('userId').isUUID(),
    (0, express_validator_1.body)('context.currentActivity').optional().isString(),
    (0, express_validator_1.body)('context.recentActions').optional().isArray(),
    (0, express_validator_1.body)('context.mood').optional().isString(),
    (0, express_validator_1.body)('context.timeOfDay').optional().isString(),
], async (req, res) => {
    try {
        const { userId, context } = req.body;
        const insight = await RealTimeInsightsGenerator_1.default.generateContextualInsight(userId, context);
        res.status(200).json({
            success: true,
            data: insight,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to generate contextual insight',
        });
    }
});
router.post('/insights/predictive', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 30 }), [(0, express_validator_1.body)('userId').isUUID()], async (req, res) => {
    try {
        const { userId } = req.body;
        const insights = await RealTimeInsightsGenerator_1.default.generatePredictiveInsights(userId);
        res.status(200).json({
            success: true,
            data: insights,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to generate predictive insights',
        });
    }
});
exports.default = router;
//# sourceMappingURL=ml.routes.js.map