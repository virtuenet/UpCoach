"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const FinancialDashboardController_1 = require("../controllers/financial/FinancialDashboardController");
const StripeWebhookService_1 = require("../services/financial/StripeWebhookService");
const logger_1 = require("../utils/logger");
const environment_1 = require("../config/environment");
const stripe_1 = __importDefault(require("stripe"));
const router = (0, express_1.Router)();
const financialController = new FinancialDashboardController_1.FinancialDashboardController();
const stripe = new stripe_1.default(environment_1.config.stripe.secretKey || '', {
    apiVersion: '2025-08-27.basil',
});
// Stripe webhook endpoint with proper signature validation
// IMPORTANT: Use raw body for signature verification
router.post('/webhook/stripe', (0, express_1.raw)({ type: 'application/json' }), // Raw body required for signature verification
async (req, _res) => {
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
        // Verify webhook signature using Stripe SDK
        event = stripe.webhooks.constructEvent(req.body, // Raw body buffer
        sig, environment_1.config.stripe.webhookSecret);
        logger_1.logger.info('Stripe webhook signature verified', {
            eventType: event.type,
            eventId: event.id,
        });
    }
    catch (err) {
        logger_1.logger.error('Webhook signature verification failed', {
            error: err.message,
            signature: sig.substring(0, 20) + '...', // Log partial signature for debugging
        });
        // Return 400 to indicate invalid signature
        return _res.status(400).json({
            error: 'Invalid signature',
            code: 'INVALID_SIGNATURE',
        });
    }
    try {
        // Process verified webhook event
        await StripeWebhookService_1.stripeWebhookService.handleWebhook(event);
        // Return 200 to acknowledge receipt
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
        // Return 500 for processing errors (Stripe will retry)
        _res.status(500).json({
            error: 'Webhook processing failed',
            code: 'PROCESSING_ERROR',
        });
    }
});
// Protected routes (require admin auth)
router.use(auth_1.authMiddleware);
// Dashboard metrics
router.get('/dashboard', financialController.getDashboardMetrics);
router.get('/dashboard/revenue', financialController.getRevenueMetrics);
router.get('/dashboard/subscriptions', financialController.getSubscriptionMetrics);
router.get('/dashboard/costs', financialController.getCostMetrics);
// P&L Statement
router.get('/pnl', financialController.getProfitLossStatement);
router.get('/pnl/:period', financialController.getProfitLossStatement);
// Revenue analytics
router.get('/revenue/mrr', financialController.getMRRMetrics);
router.get('/revenue/arr', financialController.getARRMetrics);
router.get('/revenue/by-plan', financialController.getRevenueByPlan);
router.get('/revenue/by-country', financialController.getRevenueByCountry);
router.get('/revenue/forecast', financialController.getRevenueForecast);
// Subscription analytics
router.get('/subscriptions', financialController.getSubscriptions);
router.get('/subscriptions/active', financialController.getActiveSubscriptions);
router.get('/subscriptions/churn', financialController.getChurnAnalytics);
router.get('/subscriptions/ltv', financialController.getLTVAnalytics);
// Cost tracking
router.get('/costs', financialController.getCosts);
router.post('/costs', financialController.createCost);
router.put('/costs/:id', financialController.updateCost);
router.delete('/costs/:id', financialController.deleteCost);
router.get('/costs/by-category', financialController.getCostsByCategory);
router.get('/costs/optimization', financialController.getCostOptimizationSuggestions);
// Financial snapshots
router.get('/snapshots', financialController.getSnapshots);
router.post('/snapshots/generate', financialController.generateSnapshot);
router.get('/snapshots/latest', financialController.getLatestSnapshot);
// Reports
router.get('/reports', financialController.getReports);
router.post('/reports', financialController.createReport);
router.get('/reports/:id', financialController.getReport);
router.get('/reports/:id/download', financialController.downloadReport);
router.post('/reports/:id/send', financialController.sendReport);
// Cohort analysis
router.get('/cohorts', financialController.getCohortAnalysis);
router.get('/cohorts/:month', financialController.getCohortDetails);
// Unit economics
router.get('/unit-economics', financialController.getUnitEconomics);
router.get('/unit-economics/cac', financialController.getCAC);
router.get('/unit-economics/ltv-cac', financialController.getLTVtoCACRatio);
// Billing events
router.get('/billing-events', financialController.getBillingEvents);
router.get('/billing-events/:id', financialController.getBillingEvent);
// Automation endpoints
router.get('/automation/status', financialController.getAutomationStatus);
router.post('/automation/trigger/:type', financialController.triggerAutomation);
router.post('/automation/test-email', financialController.sendTestEmail);
// Scheduler management
router.get('/scheduler/jobs', financialController.getScheduledJobs);
router.post('/scheduler/jobs/:name/start', financialController.startJob);
router.post('/scheduler/jobs/:name/stop', financialController.stopJob);
exports.default = router;
//# sourceMappingURL=financial.js.map