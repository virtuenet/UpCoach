import { Router, Request, Response, raw } from 'express';
import Stripe from 'stripe';
import { body, query } from 'express-validator';

import { config } from '../config/environment';
import { FinancialDashboardController } from '../controllers/financial/FinancialDashboardController';
import { financialDashboardControllerEnhanced } from '../controllers/financial/FinancialDashboardControllerEnhanced';
import { reportDeliveryService } from '../services/financial/ReportDeliveryService';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { stripeWebhookService } from '../services/financial/StripeWebhookService';
import { logger } from '../utils/logger';


const router = Router();
const financialController = new FinancialDashboardController();
const stripe = new Stripe(config.stripe.secretKey || '', {
  apiVersion: '2025-08-27.basil',
});

// Stripe webhook endpoint with proper signature validation
// IMPORTANT: Use raw body for signature verification
router.post(
  '/webhook/stripe',
  raw({ type: 'application/json' }), // Raw body required for signature verification
  async (req: Request, _res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      logger.error('Missing Stripe signature header');
      return _res.status(400).json({
        error: 'Missing signature header',
        code: 'MISSING_SIGNATURE',
      });
    }

    if (!config.stripe.webhookSecret) {
      logger.error('Stripe webhook secret not configured');
      return _res.status(500).json({
        error: 'Webhook configuration error',
        code: 'WEBHOOK_NOT_CONFIGURED',
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
        eventId: event.id,
      });
    } catch (err) {
      logger.error('Webhook signature verification failed', {
        error: (err as Error).message,
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
      await stripeWebhookService.handleWebhook(event);

      // Return 200 to acknowledge receipt
      _res.json({
        received: true,
        eventId: event.id,
        eventType: event.type,
      });
    } catch (error) {
      logger.error('Webhook processing error:', {
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
  }
);

// Protected routes (require admin auth)
router.use(authMiddleware);

// Dashboard metrics (existing)
router.get('/dashboard', financialController.getDashboardMetrics);
router.get('/dashboard/revenue', financialController.getRevenueMetrics);
router.get('/dashboard/subscriptions', financialController.getSubscriptionMetrics);
router.get('/dashboard/costs', financialController.getCostMetrics);

// Enhanced Dashboard with Forecasting and AI Insights
router.get('/dashboard/enhanced', async (req: Request, res: Response) => {
  try {
    await financialDashboardControllerEnhanced.getEnhancedDashboardMetrics(req, res);
  } catch (error) {
    logger.error('Enhanced dashboard endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced Analytics Endpoints
router.get('/analytics/kpis', async (req: Request, res: Response) => {
  try {
    const kpis = await financialDashboardControllerEnhanced.calculateFinancialKPIs();
    res.json({
      timestamp: new Date(),
      kpis
    });
  } catch (error) {
    logger.error('Financial KPIs endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch financial KPIs' });
  }
});

router.get('/analytics/alerts', async (req: Request, res: Response) => {
  try {
    await financialDashboardControllerEnhanced.getFinancialAlerts(req, res);
  } catch (error) {
    logger.error('Financial alerts endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch financial alerts' });
  }
});

router.get('/analytics/forecast', async (req: Request, res: Response) => {
  try {
    const forecast = await financialDashboardControllerEnhanced.generateRevenueForecasts();
    res.json({
      timestamp: new Date(),
      forecast
    });
  } catch (error) {
    logger.error('Revenue forecast endpoint error:', error);
    res.status(500).json({ error: 'Failed to generate revenue forecast' });
  }
});

router.get('/analytics/optimization', async (req: Request, res: Response) => {
  try {
    const optimization = await financialDashboardControllerEnhanced.calculateCostOptimization();
    res.json({
      timestamp: new Date(),
      optimization
    });
  } catch (error) {
    logger.error('Cost optimization endpoint error:', error);
    res.status(500).json({ error: 'Failed to calculate cost optimization' });
  }
});

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

// Reports (existing)
router.get('/reports', financialController.getReports);
router.post('/reports', financialController.createReport);
router.get('/reports/:id', financialController.getReport);
router.get('/reports/:id/download', financialController.downloadReport);
router.post('/reports/:id/send', financialController.sendReport);

// Enhanced Reports with Email Delivery
router.post('/reports/send',
  validateRequest([
    body('recipients').isArray().withMessage('Recipients must be an array'),
    body('recipients.*').isEmail().withMessage('Invalid email address'),
    body('reportType').isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM']).withMessage('Invalid report type'),
    body('format').isIn(['JSON', 'PDF', 'CSV']).withMessage('Invalid report format'),
    body('period').isString().withMessage('Period is required'),
    body('includeCharts').optional().isBoolean().withMessage('includeCharts must be boolean'),
    body('includeRawData').optional().isBoolean().withMessage('includeRawData must be boolean')
  ]),
  async (req: Request, res: Response) => {
    try {
      const {
        recipients,
        reportType,
        format,
        period,
        includeCharts = true,
        includeRawData = false,
        customTemplate
      } = req.body;

      const result = await reportDeliveryService.sendFinancialReport({
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
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      logger.error('Send report endpoint error:', error);
      res.status(500).json({ error: 'Failed to send financial report' });
    }
  }
);

router.post('/reports/schedule',
  validateRequest([
    body('name').isString().withMessage('Schedule name is required'),
    body('recipients').isArray().withMessage('Recipients must be an array'),
    body('recipients.*').isEmail().withMessage('Invalid email address'),
    body('frequency').isIn(['daily', 'weekly', 'monthly', 'quarterly']).withMessage('Invalid frequency'),
    body('format').isIn(['JSON', 'PDF', 'CSV']).withMessage('Invalid report format'),
    body('reportType').isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM']).withMessage('Invalid report type'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
  ]),
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        recipients,
        frequency,
        format,
        reportType,
        isActive = true
      } = req.body;

      const scheduleId = await reportDeliveryService.scheduleRecurringReport({
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
    } catch (error) {
      logger.error('Schedule report endpoint error:', error);
      res.status(500).json({ error: 'Failed to schedule financial report' });
    }
  }
);

router.get('/reports/comprehensive',
  validateRequest([
    query('period').optional().isString().withMessage('Invalid period'),
    query('format').optional().isIn(['json', 'pdf', 'csv']).withMessage('Invalid format')
  ]),
  async (req: Request, res: Response) => {
    try {
      await financialDashboardControllerEnhanced.generateComprehensiveReport(req, res);
    } catch (error) {
      logger.error('Comprehensive report endpoint error:', error);
      res.status(500).json({ error: 'Failed to generate comprehensive report' });
    }
  }
);

// Cohort analysis (existing)
router.get('/cohorts', financialController.getCohortAnalysis);
router.get('/cohorts/:month', financialController.getCohortDetails);

// Enhanced Cohort Analysis
router.get('/cohorts/analysis/enhanced',
  validateRequest([
    query('cohortMonth').optional().isISO8601().withMessage('Invalid cohort month format')
  ]),
  async (req: Request, res: Response) => {
    try {
      const { cohortMonth } = req.query;
      const analysis = await reportDeliveryService.getEnhancedCohortAnalysis(cohortMonth as string);
      res.json(analysis);
    } catch (error) {
      logger.error('Enhanced cohort analysis endpoint error:', error);
      res.status(500).json({ error: 'Failed to fetch enhanced cohort analysis' });
    }
  }
);

router.get('/cohorts/analysis/:cohortMonth', async (req: Request, res: Response) => {
  try {
    await financialDashboardControllerEnhanced.getCohortAnalysis(req, res);
  } catch (error) {
    logger.error('Specific cohort analysis endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch cohort analysis' });
  }
});

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
