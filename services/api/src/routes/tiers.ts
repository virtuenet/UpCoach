import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';

import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
  requireRole,
  requireFinancialAccess,
  requireFinancialModifyAccess,
  requireDeleteAccess,
  AuthorizedRequest,
} from '../middleware/authorization';
import { tierService, AuditContext } from '../services/financial/TierService';
import { tierPricingService } from '../services/financial/TierPricingService';
import { stripeTierSyncService } from '../services/financial/StripeTierSyncService';
import { TierBillingInterval } from '../models';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Helper to extract audit context from request
 */
const getAuditContext = (req: AuthorizedRequest): AuditContext => ({
  userId: req.user?.id,
  email: req.user?.email,
  role: req.user?.role,
  ipAddress: req.ip || req.connection?.remoteAddress,
  userAgent: req.get('User-Agent'),
  requestId: req.get('X-Request-ID'),
});

// ============================================
// PUBLIC ENDPOINTS (for pricing page, mobile app)
// ============================================

/**
 * @swagger
 * /api/tiers/public:
 *   get:
 *     summary: Get public pricing tiers
 *     description: Returns all active, public tiers with their pricing. Used by pricing page and mobile app.
 *     tags: [Tiers]
 *     responses:
 *       200:
 *         description: List of public tiers with pricing
 */
router.get('/public', async (_req: Request, res: Response) => {
  try {
    const tiers = await tierService.getPublicTiers();

    res.json({
      success: true,
      data: tiers.map((tier) => ({
        id: tier.id,
        name: tier.name,
        displayName: tier.displayName,
        description: tier.description,
        features: tier.planFeatures,
        isUnlimited: tier.isUnlimited,
        featureCount: tier.featureCount,
        pricing: tier.pricing?.map((p) => ({
          id: p.id,
          billingInterval: p.billingInterval,
          amount: p.amount,
          amountInDollars: p.amountInDollars,
          currency: p.currency,
          monthlyEquivalent: p.monthlyEquivalent,
          savingsPercentage: p.savingsPercentage,
          trialDays: p.trialDays,
          effectiveAmount: p.effectiveAmount,
          isDiscountActive: p.isDiscountActive,
        })),
        sortOrder: tier.sortOrder,
      })),
      cacheControl: {
        maxAge: 3600, // 1 hour cache for mobile clients
      },
    });
  } catch (error) {
    logger.error('Failed to get public tiers', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pricing information',
    });
  }
});

// ============================================
// ADMIN ENDPOINTS (require authentication)
// ============================================

/**
 * @swagger
 * /api/tiers:
 *   get:
 *     summary: List all tiers (admin)
 *     description: Returns all tiers including inactive and private ones.
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authMiddleware,
  requireFinancialAccess(),
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const includePrivate = req.query.includePrivate === 'true';
      const isActive = req.query.isActive
        ? req.query.isActive === 'true'
        : undefined;

      const tiers = await tierService.findAll({
        includePrivate,
        isActive,
      });

      res.json({
        success: true,
        data: tiers,
        count: tiers.length,
      });
    } catch (error) {
      logger.error('Failed to list tiers', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve tiers',
      });
    }
  }
);

/**
 * @swagger
 * /api/tiers/{id}:
 *   get:
 *     summary: Get tier by ID
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  authMiddleware,
  requireFinancialAccess(),
  param('id').isUUID(),
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const tier = await tierService.findById(req.params.id);

      if (!tier) {
        return res.status(404).json({
          success: false,
          error: 'Tier not found',
        });
      }

      res.json({
        success: true,
        data: tier,
      });
    } catch (error) {
      logger.error('Failed to get tier', { error, tierId: req.params.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve tier',
      });
    }
  }
);

/**
 * @swagger
 * /api/tiers:
 *   post:
 *     summary: Create new tier
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authMiddleware,
  requireFinancialModifyAccess(),
  [
    body('name')
      .isString()
      .trim()
      .toLowerCase()
      .matches(/^[a-z][a-z0-9_]*$/),
    body('displayName').isString().trim().notEmpty(),
    body('description').optional().isString(),
    body('maxCoaches').isInt({ min: -1 }),
    body('maxGoals').isInt({ min: -1 }),
    body('maxChatsPerDay').isInt({ min: -1 }),
    body('hasVoiceJournaling').optional().isBoolean(),
    body('hasProgressPhotos').optional().isBoolean(),
    body('hasAdvancedAnalytics').optional().isBoolean(),
    body('hasTeamFeatures').optional().isBoolean(),
    body('hasPrioritySupport').optional().isBoolean(),
    body('hasCustomBranding').optional().isBoolean(),
    body('hasApiAccess').optional().isBoolean(),
    body('hasSsoIntegration').optional().isBoolean(),
    body('hasDedicatedSupport').optional().isBoolean(),
  ],
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const tier = await tierService.create(req.body, getAuditContext(req));

      res.status(201).json({
        success: true,
        data: tier,
        message: `Tier '${tier.name}' created successfully`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create tier', { error, body: req.body });
      res.status(400).json({
        success: false,
        error: message,
      });
    }
  }
);

/**
 * @swagger
 * /api/tiers/{id}:
 *   put:
 *     summary: Update tier
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  authMiddleware,
  requireFinancialModifyAccess(),
  param('id').isUUID(),
  [
    body('name')
      .optional()
      .isString()
      .trim()
      .toLowerCase()
      .matches(/^[a-z][a-z0-9_]*$/),
    body('displayName').optional().isString().trim().notEmpty(),
    body('description').optional().isString(),
    body('sortOrder').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
    body('isPublic').optional().isBoolean(),
    body('maxCoaches').optional().isInt({ min: -1 }),
    body('maxGoals').optional().isInt({ min: -1 }),
    body('maxChatsPerDay').optional().isInt({ min: -1 }),
    body('hasVoiceJournaling').optional().isBoolean(),
    body('hasProgressPhotos').optional().isBoolean(),
    body('hasAdvancedAnalytics').optional().isBoolean(),
    body('hasTeamFeatures').optional().isBoolean(),
    body('hasPrioritySupport').optional().isBoolean(),
    body('hasCustomBranding').optional().isBoolean(),
    body('hasApiAccess').optional().isBoolean(),
    body('hasSsoIntegration').optional().isBoolean(),
    body('hasDedicatedSupport').optional().isBoolean(),
  ],
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const tier = await tierService.update(
        req.params.id,
        req.body,
        getAuditContext(req)
      );

      res.json({
        success: true,
        data: tier,
        message: `Tier '${tier.name}' updated successfully`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update tier', { error, tierId: req.params.id });
      res.status(400).json({
        success: false,
        error: message,
      });
    }
  }
);

/**
 * @swagger
 * /api/tiers/{id}:
 *   delete:
 *     summary: Delete tier (soft delete)
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authMiddleware,
  requireDeleteAccess(),
  param('id').isUUID(),
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const hardDelete = req.query.hard === 'true';
      await tierService.delete(req.params.id, getAuditContext(req), {
        hardDelete,
      });

      res.json({
        success: true,
        message: hardDelete
          ? 'Tier permanently deleted'
          : 'Tier deactivated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to delete tier', { error, tierId: req.params.id });
      res.status(400).json({
        success: false,
        error: message,
      });
    }
  }
);

/**
 * @swagger
 * /api/tiers/{id}/activate:
 *   post:
 *     summary: Activate tier
 *     tags: [Tiers]
 */
router.post(
  '/:id/activate',
  authMiddleware,
  requireFinancialModifyAccess(),
  param('id').isUUID(),
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const tier = await tierService.activate(req.params.id, getAuditContext(req));

      res.json({
        success: true,
        data: tier,
        message: `Tier '${tier.name}' activated`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * @swagger
 * /api/tiers/{id}/deactivate:
 *   post:
 *     summary: Deactivate tier
 *     tags: [Tiers]
 */
router.post(
  '/:id/deactivate',
  authMiddleware,
  requireFinancialModifyAccess(),
  param('id').isUUID(),
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const tier = await tierService.deactivate(
        req.params.id,
        getAuditContext(req)
      );

      res.json({
        success: true,
        data: tier,
        message: `Tier '${tier.name}' deactivated`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * @swagger
 * /api/tiers/{id}/duplicate:
 *   post:
 *     summary: Duplicate tier
 *     tags: [Tiers]
 */
router.post(
  '/:id/duplicate',
  authMiddleware,
  requireFinancialModifyAccess(),
  param('id').isUUID(),
  body('name')
    .isString()
    .trim()
    .toLowerCase()
    .matches(/^[a-z][a-z0-9_]*$/),
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const tier = await tierService.duplicate(
        req.params.id,
        req.body.name,
        getAuditContext(req)
      );

      res.status(201).json({
        success: true,
        data: tier,
        message: `Tier duplicated as '${tier.name}'`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * @swagger
 * /api/tiers/reorder:
 *   post:
 *     summary: Reorder tiers
 *     tags: [Tiers]
 */
router.post(
  '/reorder',
  authMiddleware,
  requireFinancialModifyAccess(),
  body('orderedIds').isArray().notEmpty(),
  body('orderedIds.*').isUUID(),
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      await tierService.reorder(req.body.orderedIds, getAuditContext(req));

      res.json({
        success: true,
        message: 'Tiers reordered successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * @swagger
 * /api/tiers/{id}/audit-logs:
 *   get:
 *     summary: Get tier audit logs
 *     tags: [Tiers]
 */
router.get(
  '/:id/audit-logs',
  authMiddleware,
  requireRole(['super_admin']),
  param('id').isUUID(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const { logs, total } = await tierService.getAuditLogs(req.params.id, {
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      });

      res.json({
        success: true,
        data: logs,
        total,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to retrieve audit logs' });
    }
  }
);

/**
 * @swagger
 * /api/tiers/compare:
 *   get:
 *     summary: Compare two tiers
 *     tags: [Tiers]
 */
router.get(
  '/compare',
  authMiddleware,
  requireFinancialAccess(),
  query('tier1').isUUID(),
  query('tier2').isUUID(),
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const comparison = await tierService.compareTiers(
        req.query.tier1 as string,
        req.query.tier2 as string
      );

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// ============================================
// PRICING ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/tiers/{tierId}/pricing:
 *   get:
 *     summary: Get pricing for a tier
 *     tags: [Tier Pricing]
 */
router.get(
  '/:tierId/pricing',
  authMiddleware,
  requireFinancialAccess(),
  param('tierId').isUUID(),
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const pricing = await tierPricingService.findByTierId(req.params.tierId, {
        includeInactive,
      });

      res.json({
        success: true,
        data: pricing,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to retrieve pricing' });
    }
  }
);

/**
 * @swagger
 * /api/tiers/{tierId}/pricing:
 *   post:
 *     summary: Add pricing to tier
 *     tags: [Tier Pricing]
 */
router.post(
  '/:tierId/pricing',
  authMiddleware,
  requireFinancialModifyAccess(),
  param('tierId').isUUID(),
  [
    body('billingInterval').isIn(Object.values(TierBillingInterval)),
    body('amount').isInt({ min: 0 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
    body('isActive').optional().isBoolean(),
    body('trialDays').optional().isInt({ min: 0, max: 365 }),
    body('discountPercentage').optional().isFloat({ min: 0, max: 100 }),
    body('discountValidUntil').optional().isISO8601(),
  ],
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const pricing = await tierPricingService.create(
        {
          tierId: req.params.tierId,
          ...req.body,
        },
        getAuditContext(req)
      );

      res.status(201).json({
        success: true,
        data: pricing,
        message: 'Pricing added successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * @swagger
 * /api/tiers/{tierId}/pricing/{priceId}:
 *   put:
 *     summary: Update pricing
 *     tags: [Tier Pricing]
 */
router.put(
  '/:tierId/pricing/:priceId',
  authMiddleware,
  requireFinancialModifyAccess(),
  param('tierId').isUUID(),
  param('priceId').isUUID(),
  [
    body('amount').optional().isInt({ min: 0 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
    body('isActive').optional().isBoolean(),
    body('trialDays').optional().isInt({ min: 0, max: 365 }),
    body('discountPercentage').optional().isFloat({ min: 0, max: 100 }),
    body('discountValidUntil').optional().isISO8601().or(body('discountValidUntil').isIn([null])),
  ],
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const pricing = await tierPricingService.update(
        req.params.priceId,
        req.body,
        getAuditContext(req)
      );

      res.json({
        success: true,
        data: pricing,
        message: 'Pricing updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * @swagger
 * /api/tiers/{tierId}/pricing/{priceId}:
 *   delete:
 *     summary: Delete pricing
 *     tags: [Tier Pricing]
 */
router.delete(
  '/:tierId/pricing/:priceId',
  authMiddleware,
  requireDeleteAccess(),
  param('tierId').isUUID(),
  param('priceId').isUUID(),
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const hardDelete = req.query.hard === 'true';
      await tierPricingService.delete(req.params.priceId, getAuditContext(req), {
        hardDelete,
      });

      res.json({
        success: true,
        message: hardDelete
          ? 'Pricing permanently deleted'
          : 'Pricing deactivated',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * @swagger
 * /api/tiers/pricing/comparison:
 *   get:
 *     summary: Get pricing comparison across all tiers
 *     tags: [Tier Pricing]
 */
router.get(
  '/pricing/comparison',
  authMiddleware,
  requireFinancialAccess(),
  query('billingInterval').isIn(Object.values(TierBillingInterval)),
  query('currency').optional().isString().isLength({ min: 3, max: 3 }),
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const comparison = await tierPricingService.getPricingComparison(
        req.query.billingInterval as TierBillingInterval,
        (req.query.currency as string) || 'USD'
      );

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get comparison' });
    }
  }
);

// ============================================
// STRIPE SYNC ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/tiers/stripe/sync-status:
 *   get:
 *     summary: Get Stripe sync status for all tiers
 *     tags: [Stripe Sync]
 */
router.get(
  '/stripe/sync-status',
  authMiddleware,
  requireRole(['super_admin']),
  async (_req: AuthorizedRequest, res: Response) => {
    try {
      const status = await stripeTierSyncService.getSyncStatus();

      res.json({
        success: true,
        isConfigured: stripeTierSyncService.isConfigured(),
        data: status,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get sync status' });
    }
  }
);

/**
 * @swagger
 * /api/tiers/{id}/stripe/sync:
 *   post:
 *     summary: Sync tier to Stripe
 *     tags: [Stripe Sync]
 */
router.post(
  '/:id/stripe/sync',
  authMiddleware,
  requireRole(['super_admin']),
  param('id').isUUID(),
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const result = await stripeTierSyncService.syncTierToStripe(
        req.params.id,
        getAuditContext(req)
      );

      res.json({
        success: result.success,
        data: {
          stripeProductId: result.stripeProduct?.id,
          stripePriceIds: result.stripePrices?.map((p) => p.id),
        },
        errors: result.errors,
        warnings: result.warnings,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * @swagger
 * /api/tiers/stripe/sync-all:
 *   post:
 *     summary: Sync all tiers to Stripe
 *     tags: [Stripe Sync]
 */
router.post(
  '/stripe/sync-all',
  authMiddleware,
  requireRole(['super_admin']),
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const result = await stripeTierSyncService.syncAllTiersToStripe(
        getAuditContext(req)
      );

      res.json({
        success: result.failed === 0,
        successful: result.successful,
        failed: result.failed,
        results: result.results.map((r) => ({
          tierName: r.tier?.name,
          success: r.success,
          errors: r.errors,
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * @swagger
 * /api/tiers/stripe/products:
 *   get:
 *     summary: List Stripe products
 *     tags: [Stripe Sync]
 */
router.get(
  '/stripe/products',
  authMiddleware,
  requireRole(['super_admin']),
  async (_req: AuthorizedRequest, res: Response) => {
    try {
      const products = await stripeTierSyncService.listStripeProducts({
        active: true,
      });

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to list Stripe products' });
    }
  }
);

/**
 * @swagger
 * /api/tiers/{id}/stripe/link:
 *   post:
 *     summary: Link tier to existing Stripe product
 *     tags: [Stripe Sync]
 */
router.post(
  '/:id/stripe/link',
  authMiddleware,
  requireRole(['super_admin']),
  param('id').isUUID(),
  body('stripeProductId').isString().notEmpty(),
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      await stripeTierSyncService.linkStripeProduct(
        req.params.id,
        req.body.stripeProductId,
        getAuditContext(req)
      );

      res.json({
        success: true,
        message: 'Tier linked to Stripe product',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * @swagger
 * /api/tiers/{id}/stripe/unlink:
 *   post:
 *     summary: Unlink tier from Stripe
 *     tags: [Stripe Sync]
 */
router.post(
  '/:id/stripe/unlink',
  authMiddleware,
  requireRole(['super_admin']),
  param('id').isUUID(),
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      await stripeTierSyncService.unlinkStripeProduct(
        req.params.id,
        getAuditContext(req)
      );

      res.json({
        success: true,
        message: 'Tier unlinked from Stripe',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * @swagger
 * /api/tiers/stripe/import:
 *   post:
 *     summary: Import tier from Stripe product
 *     tags: [Stripe Sync]
 */
router.post(
  '/stripe/import',
  authMiddleware,
  requireRole(['super_admin']),
  body('stripeProductId').isString().notEmpty(),
  body('tierName')
    .isString()
    .trim()
    .toLowerCase()
    .matches(/^[a-z][a-z0-9_]*$/),
  validateRequest,
  async (req: AuthorizedRequest, res: Response) => {
    try {
      const tier = await stripeTierSyncService.importFromStripe(
        req.body.stripeProductId,
        req.body.tierName,
        getAuditContext(req)
      );

      res.status(201).json({
        success: true,
        data: tier,
        message: `Imported tier '${tier.name}' from Stripe`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * @swagger
 * /api/tiers/cache/refresh:
 *   post:
 *     summary: Refresh tier features cache
 *     tags: [Tiers]
 */
router.post(
  '/cache/refresh',
  authMiddleware,
  requireFinancialModifyAccess(),
  async (_req: AuthorizedRequest, res: Response) => {
    try {
      await tierService.refreshCache();

      res.json({
        success: true,
        message: 'Cache refreshed successfully',
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to refresh cache' });
    }
  }
);

export default router;
