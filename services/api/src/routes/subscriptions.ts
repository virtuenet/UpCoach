/**
 * Subscription Routes
 * API endpoints for subscription management and RevenueCat integration
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

import { authenticate } from '../middleware/auth';
import { revenueCatService } from '../services/payments/RevenueCatService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Subscriptions
 *     description: Subscription management and entitlement verification
 */

/**
 * @swagger
 * /api/subscriptions/current:
 *   get:
 *     summary: Get current user subscription
 *     description: Retrieve the current user's subscription status and entitlements
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tier:
 *                       type: string
 *                       enum: [free, pro, premium, enterprise]
 *                     activeEntitlements:
 *                       type: array
 *                       items:
 *                         type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     isActive:
 *                       type: boolean
 *                     managementUrl:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/current', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // TODO: Get subscription from database
    // For now, return mock data
    const subscription = {
      tier: 'free',
      tierName: 'Free',
      activeEntitlements: [],
      expiresAt: null,
      isActive: true,
      willRenew: false,
      managementUrl: null,
    };

    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    logger.error('Failed to get current subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve subscription',
    });
  }
});

/**
 * @swagger
 * /api/subscriptions/sync:
 *   post:
 *     summary: Sync subscription from RevenueCat
 *     description: Synchronize subscription data from the mobile app's RevenueCat SDK
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - revenueCatUserId
 *               - activeEntitlements
 *             properties:
 *               revenueCatUserId:
 *                 type: string
 *                 description: RevenueCat app user ID
 *               activeEntitlements:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of active entitlement IDs
 *               managementUrl:
 *                 type: string
 *                 description: URL to manage subscription in app store
 *               originalPurchaseDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Subscription synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tier:
 *                       type: string
 *                     activeEntitlements:
 *                       type: array
 *                       items:
 *                         type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/sync',
  authenticate,
  [
    body('revenueCatUserId').isString().notEmpty(),
    body('activeEntitlements').isArray(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    try {
      const userId = (req as any).user?.id;
      const { revenueCatUserId, activeEntitlements, managementUrl } = req.body;

      const result = await revenueCatService.syncSubscription(
        userId,
        revenueCatUserId,
        activeEntitlements
      );

      res.json({
        success: result.success,
        data: {
          tier: result.tier || 'free',
          activeEntitlements: result.activeEntitlements,
          expiresAt: result.expiresAt,
        },
      });
    } catch (error) {
      logger.error('Failed to sync subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync subscription',
      });
    }
  }
);

/**
 * @swagger
 * /api/subscriptions/validate-receipt:
 *   post:
 *     summary: Validate subscription receipt
 *     description: Server-side validation of subscription receipt with RevenueCat
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - revenueCatUserId
 *             properties:
 *               revenueCatUserId:
 *                 type: string
 *                 description: RevenueCat app user ID
 *               activeEntitlements:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Claimed active entitlements for verification
 *     responses:
 *       200:
 *         description: Receipt validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 valid:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tier:
 *                       type: string
 *                     activeEntitlements:
 *                       type: array
 *                       items:
 *                         type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     isInGracePeriod:
 *                       type: boolean
 *                     isSandbox:
 *                       type: boolean
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/validate-receipt',
  authenticate,
  [body('revenueCatUserId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    try {
      const { revenueCatUserId, activeEntitlements } = req.body;

      const validation = await revenueCatService.validateSubscription(revenueCatUserId);

      // Check if claimed entitlements match validated entitlements
      let entitlementsMatch = true;
      if (activeEntitlements && Array.isArray(activeEntitlements)) {
        entitlementsMatch =
          activeEntitlements.length === validation.activeEntitlements.length &&
          activeEntitlements.every((e: string) =>
            validation.activeEntitlements.includes(e)
          );
      }

      res.json({
        success: true,
        valid: validation.valid,
        entitlementsMatch,
        data: {
          tier: validation.tier || 'free',
          activeEntitlements: validation.activeEntitlements,
          expiresAt: validation.expiresAt,
          isInGracePeriod: validation.isInGracePeriod,
          isSandbox: validation.isSandbox,
          managementUrl: validation.managementUrl,
        },
      });
    } catch (error) {
      logger.error('Failed to validate receipt:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate receipt',
      });
    }
  }
);

/**
 * @swagger
 * /api/subscriptions/check-entitlement:
 *   post:
 *     summary: Check specific entitlement
 *     description: Check if user has access to a specific entitlement/feature
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entitlementId
 *             properties:
 *               entitlementId:
 *                 type: string
 *                 description: Entitlement ID to check (e.g., 'voice_journaling', 'pro')
 *     responses:
 *       200:
 *         description: Entitlement check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 hasAccess:
 *                   type: boolean
 *                 entitlement:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/check-entitlement',
  authenticate,
  [body('entitlementId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    try {
      const userId = (req as any).user?.id;
      const { entitlementId } = req.body;

      // TODO: Get user's RevenueCat ID from database
      // For now, return false for unauthenticated
      const hasAccess = false;

      res.json({
        success: true,
        hasAccess,
        entitlement: entitlementId,
      });
    } catch (error) {
      logger.error('Failed to check entitlement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check entitlement',
      });
    }
  }
);

/**
 * @swagger
 * /api/subscriptions/webhook/revenuecat:
 *   post:
 *     summary: RevenueCat webhook handler
 *     description: Receives and processes webhook events from RevenueCat
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               api_version:
 *                 type: string
 *               event:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       401:
 *         description: Invalid webhook authentication
 *       500:
 *         description: Webhook processing failed
 */
router.post('/webhook/revenuecat', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const event = req.body;

    logger.info('Received RevenueCat webhook:', {
      type: event?.event?.type,
      appUserId: event?.event?.app_user_id,
    });

    const success = await revenueCatService.handleWebhook(event, authHeader);

    if (!success) {
      return res.status(401).json({
        success: false,
        error: 'Webhook processing failed',
      });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('RevenueCat webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/subscriptions/management-url:
 *   get:
 *     summary: Get subscription management URL
 *     description: Get the URL to manage subscription in App Store or Play Store
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Management URL retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 url:
 *                   type: string
 *                   format: uri
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: No active subscription found
 */
router.get('/management-url', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // TODO: Get user's RevenueCat ID and fetch management URL
    const managementUrl = null;

    if (!managementUrl) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found',
      });
    }

    res.json({
      success: true,
      url: managementUrl,
    });
  } catch (error) {
    logger.error('Failed to get management URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get management URL',
    });
  }
});

export default router;
