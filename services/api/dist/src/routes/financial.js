"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const environment_1 = require("../config/environment");
const FinancialDashboardController_1 = require("../controllers/financial/FinancialDashboardController");
const auth_1 = require("../middleware/auth");
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
router.get('/cohorts', financialController.getCohortAnalysis);
router.get('/cohorts/:month', financialController.getCohortDetails);
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