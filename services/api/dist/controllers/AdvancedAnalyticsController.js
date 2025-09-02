"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedAnalyticsController = exports.AdvancedAnalyticsController = void 0;
const AdvancedAnalyticsService_1 = require("../services/analytics/AdvancedAnalyticsService");
const logger_1 = require("../utils/logger");
const express_validator_1 = require("express-validator");
class AdvancedAnalyticsController {
    // Create a new cohort
    createCohort = [
        (0, express_validator_1.body)('name').notEmpty().isString(),
        (0, express_validator_1.body)('description').optional().isString(),
        (0, express_validator_1.body)('type').isIn(['signup_date', 'subscription', 'behavior', 'custom']),
        (0, express_validator_1.body)('startDate').optional().isISO8601(),
        (0, express_validator_1.body)('endDate').optional().isISO8601(),
        (0, express_validator_1.body)('filters').optional().isObject(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const userId = req.userId;
                const cohortId = await AdvancedAnalyticsService_1.advancedAnalyticsService.createCohort({
                    ...req.body,
                    startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
                    endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
                }, userId);
                _res.status(201).json({
                    success: true,
                    data: { cohortId },
                });
            }
            catch (error) {
                logger_1.logger.error('Error creating cohort', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to create cohort',
                });
            }
        },
    ];
    // Get cohort retention
    getCohortRetention = [
        (0, express_validator_1.param)('cohortId').isInt(),
        (0, express_validator_1.query)('periodType').optional().isIn(['day', 'week', 'month']),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const cohortId = parseInt(req.params.cohortId);
                const periodType = req.query.periodType || 'day';
                const retention = await AdvancedAnalyticsService_1.advancedAnalyticsService.calculateRetention(cohortId, periodType);
                _res.json({
                    success: true,
                    data: retention,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting cohort retention', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to get cohort retention',
                });
            }
        },
    ];
    // Compare cohorts
    compareCohorts = [
        (0, express_validator_1.body)('cohortIds').isArray({ min: 2 }),
        (0, express_validator_1.body)('cohortIds.*').isInt(),
        (0, express_validator_1.body)('metricType').isIn(['retention', 'revenue', 'engagement']),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const { cohortIds, metricType } = req.body;
                const comparison = await AdvancedAnalyticsService_1.advancedAnalyticsService.compareCohorts(cohortIds, metricType);
                _res.json({
                    success: true,
                    data: comparison,
                });
            }
            catch (error) {
                logger_1.logger.error('Error comparing cohorts', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to compare cohorts',
                });
            }
        },
    ];
    // Create funnel
    createFunnel = [
        (0, express_validator_1.body)('name').notEmpty().isString(),
        (0, express_validator_1.body)('description').optional().isString(),
        (0, express_validator_1.body)('steps').isArray({ min: 2 }),
        (0, express_validator_1.body)('steps.*.name').notEmpty().isString(),
        (0, express_validator_1.body)('steps.*.eventType').notEmpty().isString(),
        (0, express_validator_1.body)('steps.*.filters').optional().isObject(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const { name, description, steps } = req.body;
                const funnelId = await AdvancedAnalyticsService_1.advancedAnalyticsService.createFunnel(name, steps, description);
                _res.status(201).json({
                    success: true,
                    data: { funnelId },
                });
            }
            catch (error) {
                logger_1.logger.error('Error creating funnel', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to create funnel',
                });
            }
        },
    ];
    // Get funnel analytics
    getFunnelAnalytics = [
        (0, express_validator_1.param)('funnelId').isInt(),
        (0, express_validator_1.query)('startDate').optional().isISO8601(),
        (0, express_validator_1.query)('endDate').optional().isISO8601(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const funnelId = parseInt(req.params.funnelId);
                const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
                const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
                const analytics = await AdvancedAnalyticsService_1.advancedAnalyticsService.getFunnelAnalytics(funnelId, startDate, endDate);
                _res.json({
                    success: true,
                    data: analytics,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting funnel analytics', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to get funnel analytics',
                });
            }
        },
    ];
    // Track activity
    trackActivity = [
        (0, express_validator_1.body)('activityType').notEmpty().isString(),
        (0, express_validator_1.body)('data').optional().isObject(),
        (0, express_validator_1.body)('sessionId').optional().isString(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const userId = req.userId;
                const { activityType, data, sessionId } = req.body;
                await AdvancedAnalyticsService_1.advancedAnalyticsService.trackActivity(userId, activityType, data, sessionId);
                _res.json({
                    success: true,
                    message: 'Activity tracked successfully',
                });
            }
            catch (error) {
                logger_1.logger.error('Error tracking activity', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to track activity',
                });
            }
        },
    ];
    // Track funnel step
    trackFunnelStep = [
        (0, express_validator_1.body)('funnelId').isInt(),
        (0, express_validator_1.body)('stepIndex').isInt({ min: 0 }),
        (0, express_validator_1.body)('attribution').optional().isObject(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const userId = req.userId;
                const { funnelId, stepIndex, attribution } = req.body;
                await AdvancedAnalyticsService_1.advancedAnalyticsService.trackFunnelStep(funnelId, userId, stepIndex, attribution);
                _res.json({
                    success: true,
                    message: 'Funnel step tracked successfully',
                });
            }
            catch (error) {
                logger_1.logger.error('Error tracking funnel step', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to track funnel step',
                });
            }
        },
    ];
    // Get feature adoption
    getFeatureAdoption = [
        (0, express_validator_1.query)('featureName').optional().isString(),
        (0, express_validator_1.query)('startDate').optional().isISO8601(),
        (0, express_validator_1.query)('endDate').optional().isISO8601(),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const featureName = req.query.featureName;
                const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
                const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
                const adoption = await AdvancedAnalyticsService_1.advancedAnalyticsService.getFeatureAdoption(featureName, startDate, endDate);
                _res.json({
                    success: true,
                    data: adoption,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting feature adoption', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to get feature adoption',
                });
            }
        },
    ];
    // Get user lifecycle stage
    getUserLifecycleStage = async (req, _res) => {
        try {
            const userId = req.userId;
            const stage = await AdvancedAnalyticsService_1.advancedAnalyticsService.getUserLifecycleStage(userId);
            _res.json({
                success: true,
                data: { stage },
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting user lifecycle stage', { error });
            _res.status(500).json({
                success: false,
                error: 'Failed to get user lifecycle stage',
            });
        }
    };
    // Get revenue analytics
    getRevenueAnalytics = [
        (0, express_validator_1.query)('startDate').optional().isISO8601(),
        (0, express_validator_1.query)('endDate').optional().isISO8601(),
        (0, express_validator_1.query)('groupBy').optional().isIn(['day', 'week', 'month']),
        async (req, _res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return _res.status(400).json({ errors: errors.array() });
                }
                const startDate = req.query.startDate
                    ? new Date(req.query.startDate)
                    : new Date(new Date().setMonth(new Date().getMonth() - 1));
                const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
                const groupBy = req.query.groupBy || 'day';
                const { sequelize } = require('../models');
                const { QueryTypes } = require('sequelize');
                const result = await sequelize.query(`SELECT 
             ${groupBy === 'day' ? 'date' : groupBy === 'week' ? "DATE_TRUNC('week', date) as week" : "DATE_TRUNC('month', date) as month"},
             SUM(total_revenue) as total_revenue,
             SUM(recurring_revenue) as recurring_revenue,
             SUM(new_revenue) as new_revenue,
             AVG(arpu) as avg_arpu,
             AVG(mrr_growth_rate) as avg_mrr_growth
           FROM revenue_analytics
           WHERE date BETWEEN :startDate AND :endDate
           GROUP BY ${groupBy === 'day' ? 'date' : groupBy === 'week' ? 'week' : 'month'}
           ORDER BY ${groupBy === 'day' ? 'date' : groupBy === 'week' ? 'week' : 'month'}`, {
                    replacements: {
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0],
                    },
                    type: QueryTypes.SELECT,
                });
                _res.json({
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting revenue analytics', { error });
                _res.status(500).json({
                    success: false,
                    error: 'Failed to get revenue analytics',
                });
            }
        },
    ];
    // Get all cohorts
    getCohorts = async (_req, _res) => {
        try {
            const { sequelize } = require('../models');
            const { QueryTypes } = require('sequelize');
            const cohorts = await sequelize.query(`SELECT 
           c.*,
           COUNT(ucm.user_id) as current_user_count,
           (
             SELECT retention_rate 
             FROM retention_metrics 
             WHERE cohort_id = c.id 
               AND period_type = 'day' 
               AND period_number = 7
           ) as day7_retention,
           (
             SELECT retention_rate 
             FROM retention_metrics 
             WHERE cohort_id = c.id 
               AND period_type = 'day' 
               AND period_number = 30
           ) as day30_retention
         FROM user_cohorts c
         LEFT JOIN user_cohort_members ucm ON c.id = ucm.cohort_id
         WHERE c.is_active = true
         GROUP BY c.id
         ORDER BY c.created_at DESC`, { type: QueryTypes.SELECT });
            _res.json({
                success: true,
                data: cohorts,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting cohorts', { error });
            _res.status(500).json({
                success: false,
                error: 'Failed to get cohorts',
            });
        }
    };
    // Get all funnels
    getFunnels = async (_req, _res) => {
        try {
            const { sequelize } = require('../models');
            const { QueryTypes } = require('sequelize');
            const funnels = await sequelize.query(`SELECT 
           f.*,
           (
             SELECT COUNT(DISTINCT user_id)
             FROM funnel_completions
             WHERE funnel_id = f.id AND step_index = 0
           ) as total_entries,
           (
             SELECT COUNT(DISTINCT user_id)
             FROM funnel_completions
             WHERE funnel_id = f.id 
               AND step_index = jsonb_array_length(f.steps) - 1
           ) as total_completions
         FROM conversion_funnels f
         WHERE f.is_active = true
         ORDER BY f.created_at DESC`, { type: QueryTypes.SELECT });
            _res.json({
                success: true,
                data: funnels,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting funnels', { error });
            _res.status(500).json({
                success: false,
                error: 'Failed to get funnels',
            });
        }
    };
}
exports.AdvancedAnalyticsController = AdvancedAnalyticsController;
exports.advancedAnalyticsController = new AdvancedAnalyticsController();
//# sourceMappingURL=AdvancedAnalyticsController.js.map