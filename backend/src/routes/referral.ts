import { Request, Response } from "express";
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query } from 'express-validator';
import { referralService } from '../services/referral/ReferralService';
import { analyticsService } from '../services/analytics/AnalyticsService';
import { logger } from '../utils/logger';
import { Referral } from '../models/Referral';

const router = Router();

// Get user's referral stats
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await referralService.getUserReferralStats(Number(userId));

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get referral stats', { error, userId: req.user!.id });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve referral statistics',
    });
  }
});

// Create a new referral code
router.post(
  '/code',
  authenticateToken,
  [
    body('programId').optional().isString().isIn(['standard', 'premium', 'coach']),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { programId = 'standard' } = req.body;

      const referral = await referralService.createReferralCode(Number(userId), programId);

      // Track event
      await analyticsService.trackUserAction(Number(userId), 'Referral Code Generated', {
        programId,
        code: referral.code,
      });

      res.status(201).json({
        success: true,
        data: {
          code: referral.code,
          expiresAt: referral.expiresAt,
          programId: referral.programId,
          shareUrl: `${process.env.FRONTEND_URL}/signup?ref=${referral.code}`,
        },
      });
    } catch (error: any) {
      logger.error('Failed to create referral code', { error, userId: req.user!.id });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create referral code',
      });
    }
  }
);

// Validate a referral code (public endpoint)
router.post(
  '/validate',
  [
    body('code').notEmpty().isString().isLength({ min: 4, max: 20 }),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      
      // Basic validation without applying
      const referral = await Referral.findByCode(code);
      
      if (!referral) {
        return res.status(404).json({
          success: false,
          error: 'Invalid referral code',
        });
      }

      const isValid = referral.isActive();
      
      res.json({
        success: true,
        data: {
          valid: isValid,
          programId: referral.programId,
          discount: referral.programId === 'standard' ? 20 : 
                   referral.programId === 'premium' ? 30 : 25,
          discountType: 'percentage',
        },
      });
    } catch (error) {
      logger.error('Failed to validate referral code', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to validate referral code',
      });
    }
  }
);

// Apply a referral code (called during signup)
router.post(
  '/apply',
  authenticateToken,
  [
    body('code').notEmpty().isString().isLength({ min: 4, max: 20 }),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { code } = req.body;

      const result = await referralService.applyReferralCode(Number(userId), code);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.message,
        });
      }

      res.json({
        success: true,
        data: {
          discount: result.discount,
          message: result.message,
        },
      });
    } catch (error) {
      logger.error('Failed to apply referral code', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        error: 'Failed to apply referral code',
      });
    }
  }
);

// Get referral leaderboard
router.get(
  '/leaderboard',
  [
    query('period').optional().isIn(['week', 'month', 'all']),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as 'week' | 'month' | 'all') || 'month';
      const leaderboard = await referralService.getReferralLeaderboard(period);

      res.json({
        success: true,
        data: {
          period,
          leaderboard,
        },
      });
    } catch (error) {
      logger.error('Failed to get referral leaderboard', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve leaderboard',
      });
    }
  }
);

// Get referral history
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await referralService.getUserReferralStats(Number(userId));

    res.json({
      success: true,
      data: {
        referrals: stats.referrals,
        summary: {
          total: stats.totalReferrals,
          successful: stats.successfulReferrals,
          earnings: stats.totalEarnings,
          pending: stats.pendingEarnings,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get referral history', { error, userId: req.user!.id });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve referral history',
    });
  }
});

// Track referral click (public endpoint)
router.post(
  '/click',
  [
    body('code').notEmpty().isString(),
    body('landingPage').optional().isURL(),
    body('utmParams').optional().isObject(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { code, landingPage, utmParams } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');
      const referrer = req.get('referrer');

      // Track click in analytics
      await analyticsService.track({
        event: 'Referral Link Clicked',
        properties: {
          code,
          landingPage,
          utmParams,
          ipAddress,
          userAgent,
          referrer,
        },
      });

      res.json({
        success: true,
      });
    } catch (error) {
      logger.error('Failed to track referral click', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to track click',
      });
    }
  }
);

// Share referral code via email
router.post(
  '/share',
  authenticateToken,
  [
    body('emails').isArray().notEmpty(),
    body('emails.*').isEmail(),
    body('message').optional().isString().isLength({ max: 500 }),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { emails, message } = req.body;

      // Get user's active referral code
      const stats = await referralService.getUserReferralStats(Number(userId));
      
      if (!stats.referralCode) {
        return res.status(400).json({
          success: false,
          error: 'No active referral code found',
        });
      }

      // Send referral invites (implement email sending)
      // This would integrate with email service

      // Track shares
      await analyticsService.trackUserAction(Number(userId), 'Referral Shared', {
        method: 'email',
        recipients: emails.length,
      });

      res.json({
        success: true,
        data: {
          sent: emails.length,
          message: 'Referral invitations sent successfully',
        },
      });
    } catch (error) {
      logger.error('Failed to share referral', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        error: 'Failed to share referral code',
      });
    }
  }
);

// Admin endpoint to process referral rewards
router.post(
  '/process-reward',
  authenticateToken,
  [
    body('refereeId').isInt(),
    body('paymentAmount').isFloat({ min: 0 }),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (req.user!.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { refereeId, paymentAmount } = req.body;
      await referralService.processReferrerReward(Number(refereeId), paymentAmount);

      res.json({
        success: true,
        data: {
          message: 'Referral reward processed successfully',
        },
      });
    } catch (error) {
      logger.error('Failed to process referral reward', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to process reward',
      });
    }
  }
);

export default router;