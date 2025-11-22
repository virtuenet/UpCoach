import { Router, Request, Response, raw } from 'express';
import Stripe from 'stripe';
import { body, query } from 'express-validator';

import { config } from '../config/environment';
import { FinancialDashboardController } from '../controllers/financial/FinancialDashboardController';
import { financialDashboardControllerEnhanced } from '../controllers/financial/FinancialDashboardControllerEnhanced';
import { reportDeliveryService } from '../services/financial/ReportDeliveryService';
import { authMiddleware } from '../middleware/auth';
import { validateRequest, validate } from '../middleware/validation';
import {
  requireFinancialAccess,
  requireFinancialModifyAccess,
  requireDeleteAccess,
  requireReportSendAccess,
  requireAutomationAccess,
  validateFinancialContext,
  rateLimitSensitiveOperations
} from '../middleware/authorization';
import { stripeWebhookService } from '../services/financial/StripeWebhookService';
import { logger } from '../utils/logger';


const router = Router();
const financialController = new FinancialDashboardController();
const stripe = new Stripe(config.stripe.secretKey || '', {
  apiVersion: '2025-08-27.basil',
});

/**
 * @swagger
 * /api/financial/webhook/stripe:
 *   post:
 *     summary: Stripe webhook receiver
 *     description: Consumes Stripe webhook events using the raw request body for signature verification. Returns HTTP 200 when the event is processed successfully so Stripe will stop retrying.
 *     tags: [Financial]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw Stripe event payload signed with the configured webhook secret.
 *     responses:
 *       200:
 *         description: Event processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                 eventId:
 *                   type: string
 *                 eventType:
 *                   type: string
 *       400:
 *         description: Missing or invalid Stripe signature header
 *       500:
 *         description: Webhook configuration or processing error
 */
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

// Protected routes (require admin auth and financial context validation)
router.use(authMiddleware);
router.use(validateFinancialContext());

/**
 * @swagger
 * /api/financial/dashboard:
 *   get:
 *     summary: Financial overview dashboard
 *     description: Returns high-level KPIs (MRR, ARR, churn, burn, runway) for the authenticated organization.
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
// Dashboard metrics (existing) - require financial access
router.get('/dashboard', requireFinancialAccess(), financialController.getDashboardMetrics);
/**
 * @swagger
 * /api/financial/dashboard/revenue:
 *   get:
 *     summary: Revenue dashboard metrics
 *     description: Returns revenue-focused KPIs including MRR trendlines, ARR projections, and segmented income sources.
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue metrics returned
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/dashboard/revenue', requireFinancialAccess(), financialController.getRevenueMetrics);
router.get('/dashboard/subscriptions', requireFinancialAccess(), financialController.getSubscriptionMetrics);
router.get('/dashboard/costs', requireFinancialAccess(), financialController.getCostMetrics);

// Enhanced Dashboard with Forecasting and AI Insights
router.get('/dashboard/enhanced', requireFinancialAccess(), async (req: Request, res: Response) => {
  try {
    await financialDashboardControllerEnhanced.getEnhancedDashboardMetrics(req, res);
  } catch (error) {
    logger.error('Enhanced dashboard endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced Analytics Endpoints
router.get('/analytics/kpis', requireFinancialAccess(), async (req: Request, res: Response) => {
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

router.get('/analytics/alerts', requireFinancialAccess(), async (req: Request, res: Response) => {
  try {
    await financialDashboardControllerEnhanced.getFinancialAlerts(req, res);
  } catch (error) {
    logger.error('Financial alerts endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch financial alerts' });
  }
});

router.get('/analytics/forecast', requireFinancialAccess(), async (req: Request, res: Response) => {
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

router.get('/analytics/optimization', requireFinancialAccess(), async (req: Request, res: Response) => {
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

// P&L Statement - require financial access
router.get('/pnl', requireFinancialAccess(), financialController.getProfitLossStatement);
router.get('/pnl/:period', requireFinancialAccess(), financialController.getProfitLossStatement);

// Revenue analytics - require financial access
/**
 * @swagger
 * /api/financial/revenue/mrr:
 *   get:
 *     summary: Monthly Recurring Revenue metrics
 *     description: Returns current MRR, trailing averages, and delta compared to previous periods.
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MRR metrics returned
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/revenue/mrr', requireFinancialAccess(), financialController.getMRRMetrics);
/**
 * @swagger
 * /api/financial/revenue/arr:
 *   get:
 *     summary: Annual Recurring Revenue metrics
 *     description: Returns ARR figures and growth rates derived from current subscription data.
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ARR metrics returned
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/revenue/arr', requireFinancialAccess(), financialController.getARRMetrics);
/**
 * @swagger
 * /api/financial/revenue/by-plan:
 *   get:
 *     summary: Revenue by subscription plan
 *     description: Breaks down recurring revenue by plan/tier for pricing and growth analysis.
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue per plan returned
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/revenue/by-plan', requireFinancialAccess(), financialController.getRevenueByPlan);
router.get('/revenue/by-country', requireFinancialAccess(), financialController.getRevenueByCountry);
router.get('/revenue/forecast', requireFinancialAccess(), financialController.getRevenueForecast);

// Subscription analytics - require financial access
router.get('/subscriptions', requireFinancialAccess(), financialController.getSubscriptions);
router.get('/subscriptions/active', requireFinancialAccess(), financialController.getActiveSubscriptions);
router.get('/subscriptions/churn', requireFinancialAccess(), financialController.getChurnAnalytics);
router.get('/subscriptions/ltv', requireFinancialAccess(), financialController.getLTVAnalytics);

// Cost tracking - varying permission levels
router.get('/costs', requireFinancialAccess(), financialController.getCosts);
router.post('/costs', requireFinancialModifyAccess(), rateLimitSensitiveOperations(), financialController.createCost);
router.put('/costs/:id', requireFinancialModifyAccess(), rateLimitSensitiveOperations(), financialController.updateCost);
router.delete('/costs/:id', requireDeleteAccess(), rateLimitSensitiveOperations(), financialController.deleteCost);
router.get('/costs/by-category', requireFinancialAccess(), financialController.getCostsByCategory);
router.get('/costs/optimization', requireFinancialAccess(), financialController.getCostOptimizationSuggestions);

// Financial snapshots
router.get('/snapshots', requireFinancialAccess(), financialController.getSnapshots);
router.post('/snapshots/generate', requireFinancialModifyAccess(), rateLimitSensitiveOperations(), financialController.generateSnapshot);
router.get('/snapshots/latest', requireFinancialAccess(), financialController.getLatestSnapshot);

// Reports (existing) - require appropriate permissions
/**
 * @swagger
 * /api/financial/reports:
 *   get:
 *     summary: List financial reports
 *     description: Returns a paginated list of generated financial reports with metadata such as type, period, and status.
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports returned
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/reports', requireFinancialAccess(), financialController.getReports);
/**
 * @swagger
 * /api/financial/reports:
 *   post:
 *     summary: Create financial report
 *     description: Generates a new financial report for a specified period and data slice.
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportType:
 *                 type: string
 *                 description: Type of report (e.g., MRR, ARR, P&L)
 *               period:
 *                 type: string
 *                 description: Reporting period (ISO8601 or custom keyword)
 *               format:
 *                 type: string
 *                 enum: [pdf, csv, json]
 *     responses:
 *       201:
 *         description: Report created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/reports', requireFinancialModifyAccess(), rateLimitSensitiveOperations(), financialController.createReport);
router.get('/reports/:id', requireFinancialAccess(), financialController.getReport);
router.get('/reports/:id/download', requireFinancialAccess(), financialController.downloadReport);
/**
 * @swagger
 * /api/financial/reports/{id}/send:
 *   post:
 *     summary: Send existing financial report
 *     description: Sends a previously generated report by ID to the configured recipients.
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Report identifier
 *     responses:
 *       200:
 *         description: Report sent successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/reports/:id/send', requireReportSendAccess(), rateLimitSensitiveOperations(), financialController.sendReport);

// Enhanced Reports with Email Delivery
/**
 * @swagger
 * /api/financial/reports/send:
 *   post:
 *     summary: Send ad-hoc financial report
 *     description: Sends a generated report to one or more recipients with optional attachments and custom templates.
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipients, reportType, format, period]
 *             properties:
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *               reportType:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY, QUARTERLY, CUSTOM]
 *               format:
 *                 type: string
 *                 enum: [JSON, PDF, CSV]
 *               period:
 *                 type: string
 *                 description: Reporting period descriptor
 *               includeCharts:
 *                 type: boolean
 *                 default: true
 *               includeRawData:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Report sent successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/reports/send',
  requireReportSendAccess(),
  rateLimitSensitiveOperations(),
  ...validate(
    body('recipients').isArray().withMessage('Recipients must be an array'),
    body('recipients.*').isEmail().withMessage('Invalid email address'),
    body('reportType').isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM']).withMessage('Invalid report type'),
    body('format').isIn(['JSON', 'PDF', 'CSV']).withMessage('Invalid report format'),
    body('period').isString().withMessage('Period is required'),
    body('includeCharts').optional().isBoolean().withMessage('includeCharts must be boolean'),
    body('includeRawData').optional().isBoolean().withMessage('includeRawData must be boolean')
  ),
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

/**
 * @swagger
 * /api/financial/reports/schedule:
 *   post:
 *     summary: Schedule recurring financial reports
 *     description: Creates or updates a recurring report schedule with configurable cadence, recipients, and formats.
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, recipients, frequency, format, reportType]
 *             properties:
 *               name:
 *                 type: string
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly, quarterly]
 *               format:
 *                 type: string
 *                 enum: [JSON, PDF, CSV]
 *               reportType:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY, QUARTERLY, CUSTOM]
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Recurring schedule created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/reports/schedule',
  requireReportSendAccess(),
  rateLimitSensitiveOperations(),
  ...validate(
    body('name').isString().withMessage('Schedule name is required'),
    body('recipients').isArray().withMessage('Recipients must be an array'),
    body('recipients.*').isEmail().withMessage('Invalid email address'),
    body('frequency').isIn(['daily', 'weekly', 'monthly', 'quarterly']).withMessage('Invalid frequency'),
    body('format').isIn(['JSON', 'PDF', 'CSV']).withMessage('Invalid report format'),
    body('reportType').isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM']).withMessage('Invalid report type'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
  ),
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
  requireFinancialAccess(),
  ...validate(
    query('period').optional().isString().withMessage('Invalid period'),
    query('format').optional().isIn(['json', 'pdf', 'csv']).withMessage('Invalid format')
  ),
  async (req: Request, res: Response) => {
    try {
      await financialDashboardControllerEnhanced.generateComprehensiveReport(req, res);
    } catch (error) {
      logger.error('Comprehensive report endpoint error:', error);
      res.status(500).json({ error: 'Failed to generate comprehensive report' });
    }
  }
);

// Cohort analysis (existing) - require financial access
router.get('/cohorts', requireFinancialAccess(), financialController.getCohortAnalysis);
router.get('/cohorts/:month', requireFinancialAccess(), financialController.getCohortDetails);

// Enhanced Cohort Analysis
router.get('/cohorts/analysis/enhanced',
  requireFinancialAccess(),
  ...validate(
    query('cohortMonth').optional().isISO8601().withMessage('Invalid cohort month format')
  ),
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

router.get('/cohorts/analysis/:cohortMonth', requireFinancialAccess(), async (req: Request, res: Response) => {
  try {
    await financialDashboardControllerEnhanced.getCohortAnalysis(req, res);
  } catch (error) {
    logger.error('Specific cohort analysis endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch cohort analysis' });
  }
});

// Unit economics - require financial access
router.get('/unit-economics', requireFinancialAccess(), financialController.getUnitEconomics);
router.get('/unit-economics/cac', requireFinancialAccess(), financialController.getCAC);
router.get('/unit-economics/ltv-cac', requireFinancialAccess(), financialController.getLTVtoCACRatio);

// Billing events - require financial access
router.get('/billing-events', requireFinancialAccess(), financialController.getBillingEvents);
router.get('/billing-events/:id', requireFinancialAccess(), financialController.getBillingEvent);

// Automation endpoints - require admin access
router.get('/automation/status', requireAutomationAccess(), financialController.getAutomationStatus);
router.post('/automation/trigger/:type', requireAutomationAccess(), rateLimitSensitiveOperations(), financialController.triggerAutomation);
router.post('/automation/test-email', requireAutomationAccess(), rateLimitSensitiveOperations(), financialController.sendTestEmail);

// Scheduler management - require admin access
router.get('/scheduler/jobs', requireAutomationAccess(), financialController.getScheduledJobs);
router.post('/scheduler/jobs/:name/start', requireAutomationAccess(), rateLimitSensitiveOperations(), financialController.startJob);
router.post('/scheduler/jobs/:name/stop', requireAutomationAccess(), rateLimitSensitiveOperations(), financialController.stopJob);

export default router;
