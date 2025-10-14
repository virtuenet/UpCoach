"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const AnalyticsDashboardController_1 = tslib_1.__importDefault(require("../controllers/AnalyticsDashboardController"));
const router = (0, express_1.Router)();
router.get('/dashboard', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 30 }), [
    (0, express_validator_1.query)('organizationId').optional().isUUID(),
    (0, express_validator_1.query)('timeframe').optional().isIn(['1d', '7d', '30d', '90d', '1y']),
], AnalyticsDashboardController_1.default.getDashboardMetrics);
router.get('/users/:userId', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 60 }), [
    (0, express_validator_1.param)('userId').isUUID(),
    (0, express_validator_1.query)('timeframe').optional().isIn(['1d', '7d', '30d', '90d']),
    (0, express_validator_1.query)('includeComparisons').optional().isBoolean(),
    (0, express_validator_1.query)('includePredictions').optional().isBoolean(),
    (0, express_validator_1.query)('includeInsights').optional().isBoolean(),
], AnalyticsDashboardController_1.default.getUserAnalytics);
router.get('/users/:userId/behavior', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 30 }), [
    (0, express_validator_1.param)('userId').isUUID(),
    (0, express_validator_1.query)('timeframe').optional().isNumeric(),
    (0, express_validator_1.query)('patternTypes').optional().isString(),
    (0, express_validator_1.query)('minConfidence').optional().isFloat({ min: 0, max: 1 }),
], AnalyticsDashboardController_1.default.getBehaviorPatterns);
router.get('/users/:userId/journey', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 30 }), [(0, express_validator_1.param)('userId').isUUID()], AnalyticsDashboardController_1.default.getUserJourney);
router.get('/users/:userId/anomalies', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 20 }), [
    (0, express_validator_1.param)('userId').isUUID(),
    (0, express_validator_1.query)('sensitivity').optional().isFloat({ min: 0, max: 1 }),
    (0, express_validator_1.query)('lookbackDays').optional().isInt({ min: 1, max: 90 }),
    (0, express_validator_1.query)('metrics').optional().isString(),
], AnalyticsDashboardController_1.default.getAnomalyDetection);
router.get('/users/:userId/insights', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 60 }), [
    (0, express_validator_1.param)('userId').isUUID(),
    (0, express_validator_1.query)('timeframe').optional().isString(),
    (0, express_validator_1.query)('categories').optional().isString(),
    (0, express_validator_1.query)('minImportance').optional().isFloat({ min: 0, max: 1 }),
    (0, express_validator_1.query)('maxInsights').optional().isInt({ min: 1, max: 100 }),
], AnalyticsDashboardController_1.default.getRealTimeInsights);
router.get('/users/:userId/insights/comparative', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 30 }), [
    (0, express_validator_1.param)('userId').isUUID(),
    (0, express_validator_1.query)('comparisonGroup').optional().isIn(['peers', 'top_performers', 'similar_goals']),
], AnalyticsDashboardController_1.default.getComparativeInsights);
router.get('/users/:userId/predictions', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 30 }), [
    (0, express_validator_1.param)('userId').isUUID(),
    (0, express_validator_1.query)('predictionTypes').optional().isString(),
], AnalyticsDashboardController_1.default.getPredictiveAnalytics);
router.post('/cohorts/analyze', auth_1.authenticate, (0, auth_1.authorize)(['admin', 'analyst']), (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 10 }), [
    (0, express_validator_1.body)('startDate').isISO8601(),
    (0, express_validator_1.body)('endDate').isISO8601(),
    (0, express_validator_1.body)('criteria').optional().isObject(),
], AnalyticsDashboardController_1.default.getCohortAnalysis);
router.get('/segments', auth_1.authenticate, (0, auth_1.authorize)(['admin', 'analyst']), (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 20 }), [
    (0, express_validator_1.query)('method').optional().isIn(['behavioral', 'kmeans', 'hierarchical', 'dbscan']),
    (0, express_validator_1.query)('numSegments').optional().isInt({ min: 2, max: 20 }),
    (0, express_validator_1.query)('features').optional().isString(),
], AnalyticsDashboardController_1.default.getUserSegments);
router.get('/users/:userId/stream', auth_1.authenticate, (0, rateLimiter_1.rateLimiter)({ windowMs: 60000, max: 5 }), [(0, express_validator_1.param)('userId').isUUID()], AnalyticsDashboardController_1.default.streamAnalytics);
exports.default = router;
