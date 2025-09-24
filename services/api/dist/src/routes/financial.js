"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const express_validator_1 = require("express-validator");
const environment_1 = require("../config/environment");
const FinancialDashboardController_1 = require("../controllers/financial/FinancialDashboardController");
const FinancialDashboardControllerEnhanced_1 = require("../controllers/financial/FinancialDashboardControllerEnhanced");
const ReportDeliveryService_1 = require("../services/financial/ReportDeliveryService");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const StripeWebhookService_1 = require("../services/financial/StripeWebhookService");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const financialController = new FinancialDashboardController_1.FinancialDashboardController();
const stripe = new stripe_1.default(environment_1.config.stripe.secretKey || '', {
    apiVersion: '2025-08-27.basil',
});
router.post('/webhook/stripe', (0, express_1.raw)({ type: 'application/json' }), async (req, _res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        logger_1.logger.error('Missing Stripe signature header');
        return _res.status(400).json({
            error: 'Missing signature header',
            code: 'MISSING_SIGNATURE',
        });
    }
    if (!environment_1.config.stripe.webhookSecret) {
        logger_1.logger.error('Stripe webhook secret not configured');
        return _res.status(500).json({
            error: 'Webhook configuration error',
            code: 'WEBHOOK_NOT_CONFIGURED',
        });
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, environment_1.config.stripe.webhookSecret);
        logger_1.logger.info('Stripe webhook signature verified', {
            eventType: event.type,
            eventId: event.id,
        });
    }
    catch (err) {
        logger_1.logger.error('Webhook signature verification failed', {
            error: err.message,
            signature: sig.substring(0, 20) + '...',
        });
        return _res.status(400).json({
            error: 'Invalid signature',
            code: 'INVALID_SIGNATURE',
        });
    }
    try {
        await StripeWebhookService_1.stripeWebhookService.handleWebhook(event);
        _res.json({
            received: true,
            eventId: event.id,
            eventType: event.type,
        });
    }
    catch (error) {
        logger_1.logger.error('Webhook processing error:', {
            error: error.message,
            eventId: event.id,
            eventType: event.type,
        });
        _res.status(500).json({
            error: 'Webhook processing failed',
            code: 'PROCESSING_ERROR',
        });
    }
});
router.use(auth_1.authMiddleware);
router.get('/dashboard', financialController.getDashboardMetrics);
router.get('/dashboard/revenue', financialController.getRevenueMetrics);
router.get('/dashboard/subscriptions', financialController.getSubscriptionMetrics);
router.get('/dashboard/costs', financialController.getCostMetrics);
router.get('/dashboard/enhanced', async (req, res) => {
    try {
        await FinancialDashboardControllerEnhanced_1.financialDashboardControllerEnhanced.getEnhancedDashboardMetrics(req, res);
    }
    catch (error) {
        logger_1.logger.error('Enhanced dashboard endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/analytics/kpis', async (req, res) => {
    try {
        const kpis = await FinancialDashboardControllerEnhanced_1.financialDashboardControllerEnhanced.calculateFinancialKPIs();
        res.json({
            timestamp: new Date(),
            kpis
        });
    }
    catch (error) {
        logger_1.logger.error('Financial KPIs endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch financial KPIs' });
    }
});
router.get('/analytics/alerts', async (req, res) => {
    try {
        await FinancialDashboardControllerEnhanced_1.financialDashboardControllerEnhanced.getFinancialAlerts(req, res);
    }
    catch (error) {
        logger_1.logger.error('Financial alerts endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch financial alerts' });
    }
});
router.get('/analytics/forecast', async (req, res) => {
    try {
        const forecast = await FinancialDashboardControllerEnhanced_1.financialDashboardControllerEnhanced.generateRevenueForecasts();
        res.json({
            timestamp: new Date(),
            forecast
        });
    }
    catch (error) {
        logger_1.logger.error('Revenue forecast endpoint error:', error);
        res.status(500).json({ error: 'Failed to generate revenue forecast' });
    }
});
router.get('/analytics/optimization', async (req, res) => {
    try {
        const optimization = await FinancialDashboardControllerEnhanced_1.financialDashboardControllerEnhanced.calculateCostOptimization();
        res.json({
            timestamp: new Date(),
            optimization
        });
    }
    catch (error) {
        logger_1.logger.error('Cost optimization endpoint error:', error);
        res.status(500).json({ error: 'Failed to calculate cost optimization' });
    }
});
router.get('/pnl', financialController.getProfitLossStatement);
router.get('/pnl/:period', financialController.getProfitLossStatement);
router.get('/revenue/mrr', financialController.getMRRMetrics);
router.get('/revenue/arr', financialController.getARRMetrics);
router.get('/revenue/by-plan', financialController.getRevenueByPlan);
router.get('/revenue/by-country', financialController.getRevenueByCountry);
router.get('/revenue/forecast', financialController.getRevenueForecast);
router.get('/subscriptions', financialController.getSubscriptions);
router.get('/subscriptions/active', financialController.getActiveSubscriptions);
router.get('/subscriptions/churn', financialController.getChurnAnalytics);
router.get('/subscriptions/ltv', financialController.getLTVAnalytics);
router.get('/costs', financialController.getCosts);
router.post('/costs', financialController.createCost);
router.put('/costs/:id', financialController.updateCost);
router.delete('/costs/:id', financialController.deleteCost);
router.get('/costs/by-category', financialController.getCostsByCategory);
router.get('/costs/optimization', financialController.getCostOptimizationSuggestions);
router.get('/snapshots', financialController.getSnapshots);
router.post('/snapshots/generate', financialController.generateSnapshot);
router.get('/snapshots/latest', financialController.getLatestSnapshot);
router.get('/reports', financialController.getReports);
router.post('/reports', financialController.createReport);
router.get('/reports/:id', financialController.getReport);
router.get('/reports/:id/download', financialController.downloadReport);
router.post('/reports/:id/send', financialController.sendReport);
router.post('/reports/send', (0, validation_1.validateRequest)([
    (0, express_validator_1.body)('recipients').isArray().withMessage('Recipients must be an array'),
    (0, express_validator_1.body)('recipients.*').isEmail().withMessage('Invalid email address'),
    (0, express_validator_1.body)('reportType').isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM']).withMessage('Invalid report type'),
    (0, express_validator_1.body)('format').isIn(['JSON', 'PDF', 'CSV']).withMessage('Invalid report format'),
    (0, express_validator_1.body)('period').isString().withMessage('Period is required'),
    (0, express_validator_1.body)('includeCharts').optional().isBoolean().withMessage('includeCharts must be boolean'),
    (0, express_validator_1.body)('includeRawData').optional().isBoolean().withMessage('includeRawData must be boolean')
]), async (req, res) => {
    try {
        const { recipients, reportType, format, period, includeCharts = true, includeRawData = false, customTemplate } = req.body;
        const result = await ReportDeliveryService_1.reportDeliveryService.sendFinancialReport({
            recipients,
            reportType,
            format,
            period,
            includeCharts,
            includeRawData,
            customTemplate
        });
        if (result.success) {
            res.json({
                success: true,
                message: `Report sent successfully to ${recipients.length} recipient(s)`,
                reportId: result.reportId
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Send report endpoint error:', error);
        res.status(500).json({ error: 'Failed to send financial report' });
    }
});
router.post('/reports/schedule', (0, validation_1.validateRequest)([
    (0, express_validator_1.body)('name').isString().withMessage('Schedule name is required'),
    (0, express_validator_1.body)('recipients').isArray().withMessage('Recipients must be an array'),
    (0, express_validator_1.body)('recipients.*').isEmail().withMessage('Invalid email address'),
    (0, express_validator_1.body)('frequency').isIn(['daily', 'weekly', 'monthly', 'quarterly']).withMessage('Invalid frequency'),
    (0, express_validator_1.body)('format').isIn(['JSON', 'PDF', 'CSV']).withMessage('Invalid report format'),
    (0, express_validator_1.body)('reportType').isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM']).withMessage('Invalid report type'),
    (0, express_validator_1.body)('isActive').optional().isBoolean().withMessage('isActive must be boolean')
]), async (req, res) => {
    try {
        const { name, recipients, frequency, format, reportType, isActive = true } = req.body;
        const scheduleId = await ReportDeliveryService_1.reportDeliveryService.scheduleRecurringReport({
            name,
            recipients,
            frequency,
            format,
            reportType,
            isActive
        });
        res.json({
            success: true,
            message: 'Report scheduled successfully',
            scheduleId
        });
    }
    catch (error) {
        logger_1.logger.error('Schedule report endpoint error:', error);
        res.status(500).json({ error: 'Failed to schedule financial report' });
    }
});
router.get('/reports/comprehensive', (0, validation_1.validateRequest)([
    (0, express_validator_1.query)('period').optional().isString().withMessage('Invalid period'),
    (0, express_validator_1.query)('format').optional().isIn(['json', 'pdf', 'csv']).withMessage('Invalid format')
]), async (req, res) => {
    try {
        await FinancialDashboardControllerEnhanced_1.financialDashboardControllerEnhanced.generateComprehensiveReport(req, res);
    }
    catch (error) {
        logger_1.logger.error('Comprehensive report endpoint error:', error);
        res.status(500).json({ error: 'Failed to generate comprehensive report' });
    }
});
router.get('/cohorts', financialController.getCohortAnalysis);
router.get('/cohorts/:month', financialController.getCohortDetails);
router.get('/cohorts/analysis/enhanced', (0, validation_1.validateRequest)([
    (0, express_validator_1.query)('cohortMonth').optional().isISO8601().withMessage('Invalid cohort month format')
]), async (req, res) => {
    try {
        const { cohortMonth } = req.query;
        const analysis = await ReportDeliveryService_1.reportDeliveryService.getEnhancedCohortAnalysis(cohortMonth);
        res.json(analysis);
    }
    catch (error) {
        logger_1.logger.error('Enhanced cohort analysis endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch enhanced cohort analysis' });
    }
});
router.get('/cohorts/analysis/:cohortMonth', async (req, res) => {
    try {
        await FinancialDashboardControllerEnhanced_1.financialDashboardControllerEnhanced.getCohortAnalysis(req, res);
    }
    catch (error) {
        logger_1.logger.error('Specific cohort analysis endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch cohort analysis' });
    }
});
router.get('/unit-economics', financialController.getUnitEconomics);
router.get('/unit-economics/cac', financialController.getCAC);
router.get('/unit-economics/ltv-cac', financialController.getLTVtoCACRatio);
router.get('/billing-events', financialController.getBillingEvents);
router.get('/billing-events/:id', financialController.getBillingEvent);
router.get('/automation/status', financialController.getAutomationStatus);
router.post('/automation/trigger/:type', financialController.triggerAutomation);
router.post('/automation/test-email', financialController.sendTestEmail);
router.get('/scheduler/jobs', financialController.getScheduledJobs);
router.post('/scheduler/jobs/:name/start', financialController.startJob);
router.post('/scheduler/jobs/:name/stop', financialController.stopJob);
exports.default = router;
//# sourceMappingURL=financial.js.map