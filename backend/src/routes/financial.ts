import { Router, Request, Response, raw } from 'express';
import { authMiddleware } from '../middleware/auth';
import { FinancialDashboardController } from '../controllers/financial/FinancialDashboardController';
import { stripeWebhookService } from '../services/financial/StripeWebhookService';
import { logger } from '../utils/logger';
import { config } from '../config/environment';
import Stripe from 'stripe';

const router = Router();
const financialController = new FinancialDashboardController();
const stripe = new Stripe(config.stripe.secretKey || '', {
  apiVersion: '2025-06-30.basil',
});

// Stripe webhook endpoint with proper signature validation
// IMPORTANT: Use raw body for signature verification
router.post('/webhook/stripe', 
  raw({ type: 'application/json' }), // Raw body required for signature verification
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      logger.error('Missing Stripe signature header');
      return res.status(400).json({ 
        error: 'Missing signature header',
        code: 'MISSING_SIGNATURE' 
      });
    }
    
    if (!config.stripe.webhookSecret) {
      logger.error('Stripe webhook secret not configured');
      return res.status(500).json({ 
        error: 'Webhook configuration error',
        code: 'WEBHOOK_NOT_CONFIGURED' 
      });
    }
    
    let event: Stripe.Event;
    
    try {
      // Verify webhook signature using Stripe SDK
      event = stripe.webhooks.constructEvent(
        req.body, // Raw body buffer
        sig,
        config.stripe.webhookSecret
      );
      
      logger.info('Stripe webhook signature verified', { 
        eventType: event.type,
        eventId: event.id 
      });
    } catch (_err) {
      logger.error('Webhook signature verification failed', { 
        error: err.message,
        signature: sig.substring(0, 20) + '...' // Log partial signature for debugging
      });
      
      // Return 400 to indicate invalid signature
      return res.status(400).json({ 
        error: 'Invalid signature',
        code: 'INVALID_SIGNATURE'
      });
    }
    
    try {
      // Process verified webhook event
      await stripeWebhookService.handleWebhook(event);
      
      // Return 200 to acknowledge receipt
      (res as any).json({ 
        received: true,
        eventId: event.id,
        eventType: event.type
      });
    } catch (error) {
      logger.error('Webhook processing error:', {
        error: error.message,
        eventId: event.id,
        eventType: event.type
      });
      
      // Return 500 for processing errors (Stripe will retry)
      res.status(500).json({ 
        error: 'Webhook processing failed',
        code: 'PROCESSING_ERROR'
      });
    }
  }
);

// Protected routes (require admin auth)
router.use(authMiddleware);

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

export default router; 