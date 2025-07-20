import { Router } from 'express';
import express from 'express';
import { FinancialDashboardController } from '../controllers/financial/FinancialDashboardController';
import { StripeWebhookService } from '../services/financial/StripeWebhookService';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query } from 'express-validator';

const router = Router();

// All financial routes require authentication and admin access
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard routes
router.get(
  '/dashboard',
  [
    query('period').optional().isIn(['daily', 'monthly', 'quarterly', 'yearly']),
  ],
  validateRequest,
  FinancialDashboardController.getDashboardOverview
);

router.get(
  '/mrr',
  FinancialDashboardController.getMRRBreakdown
);

router.get(
  '/profit-loss',
  [
    query('startDate').notEmpty().isISO8601(),
    query('endDate').notEmpty().isISO8601(),
  ],
  validateRequest,
  FinancialDashboardController.getProfitLoss
);

router.get(
  '/costs',
  [
    query('startDate').notEmpty().isISO8601(),
    query('endDate').notEmpty().isISO8601(),
  ],
  validateRequest,
  FinancialDashboardController.getCostBreakdown
);

router.get(
  '/subscriptions',
  FinancialDashboardController.getSubscriptionMetrics
);

router.get(
  '/forecast',
  [
    query('months').optional().isInt({ min: 1, max: 24 }),
  ],
  validateRequest,
  FinancialDashboardController.getRevenueForecast
);

router.get(
  '/cohort',
  [
    query('cohortMonth').notEmpty().matches(/^\d{4}-\d{2}$/),
  ],
  validateRequest,
  FinancialDashboardController.getCohortAnalysis
);

router.post(
  '/snapshot',
  [
    body('type').optional().isIn(['daily', 'monthly', 'quarterly', 'yearly']),
  ],
  validateRequest,
  FinancialDashboardController.generateSnapshot
);

// Stripe webhook route (no auth required for webhooks)
router.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const webhookService = new StripeWebhookService();
      
      const event = webhookService.verifyWebhookSignature(req.body, sig);
      await webhookService.processWebhookEvent(event);
      
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

export default router; 