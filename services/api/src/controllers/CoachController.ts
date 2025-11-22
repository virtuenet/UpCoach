import { Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';

import { SessionType } from '../models/CoachSession';
import { coachService } from '../services/coach/CoachService';
import { logger } from '../utils/logger';

export class CoachController {
  // Search coaches
  searchCoaches = [
    query('specialization').optional().isString(),
    query('minRating').optional().isFloat({ min: 0, max: 5 }),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('language').optional().isString(),
    query('isAvailable').optional().isBoolean(),
    query('search').optional().isString(),
    query('timezone').optional().isString(),
    query('hasVideo').optional().isBoolean(),
    query('sortBy').optional().isIn(['rating', 'price', 'experience', 'sessions']),
    query('order').optional().isIn(['ASC', 'DESC']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    async (req: Request, _res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return _res.status(400).json({ errors: errors.array() });
        }

        const filters = {
          specialization: req.query.specialization as string,
          minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
          minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
          maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
          language: req.query.language as string,
          isAvailable: req.query.isAvailable === 'true',
          search: req.query.search as string,
          timezone: req.query.timezone as string,
          hasVideo: req.query.hasVideo === 'true',
          sortBy: req.query.sortBy as unknown,
          order: req.query.order as unknown,
        };

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await coachService.searchCoaches(filters, page, limit);

        _res.json({
          success: true,
          data: result.coaches,
          pagination: {
            page,
            limit,
            total: result.total,
            pages: result.pages,
          },
        });
      } catch (error) {
        logger.error('Error searching coaches', { error });
        _res.status(500).json({
          success: false,
          error: 'Failed to search coaches',
        });
      }
    },
  ];

  // Get coach details
  getCoachDetails = [
    param('id').isInt(),
    async (req: Request, _res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return _res.status(400).json({ errors: errors.array() });
        }

        const coachId = parseInt(req.params.id);
        const coach = await coachService.getCoachDetails(coachId);

        if (!coach) {
          return _res.status(404).json({
            success: false,
            error: 'Coach not found',
          });
        }

        _res.json({
          success: true,
          data: coach,
        });
      } catch (error) {
        logger.error('Error getting coach details', { error });
        _res.status(500).json({
          success: false,
          error: 'Failed to get coach details',
        });
      }
    },
  ];

  // Get coach availability
  getCoachAvailability = [
    param('id').isInt(),
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
    async (req: Request, _res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return _res.status(400).json({ errors: errors.array() });
        }

        const coachId = parseInt(req.params.id);
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(req.query.endDate as string);

        // Validate date range
        if (endDate < startDate) {
          return _res.status(400).json({
            success: false,
            error: 'End date must be after start date',
          });
        }

        const maxDays = 30;
        const daysDiff = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff > maxDays) {
          return _res.status(400).json({
            success: false,
            error: `Date range cannot exceed ${maxDays} days`,
          });
        }

        const availability = await coachService.getCoachAvailability(coachId, startDate, endDate);

        _res.json({
          success: true,
          data: availability,
        });
      } catch (error) {
        logger.error('Error getting coach availability', { error });
        _res.status(500).json({
          success: false,
          error: 'Failed to get coach availability',
        });
      }
    },
  ];

  // Book a session
  bookSession = [
    body('coachId').isInt(),
    body('sessionType').isIn(Object.values(SessionType)),
    body('scheduledAt').isISO8601(),
    body('durationMinutes').isInt({ min: 30, max: 240 }),
    body('title').notEmpty().isString(),
    body('description').optional().isString(),
    body('timezone').notEmpty().isString(),
    body('packageId').optional().isInt(),
    async (req: Request, _res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return _res.status(400).json({ errors: errors.array() });
        }

        const clientId = req.userId; // From auth middleware
        const booking = {
          ...req.body,
          clientId,
          scheduledAt: new Date(req.body.scheduledAt),
        };

        const session = await coachService.bookSession(booking);

        _res.status(201).json({
          success: true,
          data: session,
        });
      } catch (error) {
        logger.error('Error booking session', { error });
        _res.status(400).json({
          success: false,
          error: (error as Error)?.message || "Failed to book session",
        });
      }
    },
  ];

  // Process session payment
  processPayment = [
    param('id').isInt(),
    body('paymentMethodId').notEmpty().isString(),
    async (req: Request, _res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return _res.status(400).json({ errors: errors.array() });
        }

        const sessionId = parseInt(req.params.id);
        const { paymentMethodId } = req.body;

        await coachService.processSessionPayment(sessionId, paymentMethodId);

        _res.json({
          success: true,
          message: 'Payment processed successfully',
        });
      } catch (error) {
        logger.error('Error processing payment', { error });
        _res.status(400).json({
          success: false,
          error: (error as Error)?.message || "Failed to process payment",
        });
      }
    },
  ];

  // Submit a review
  submitReview = [
    param('sessionId').isInt(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('title').optional().isString(),
    body('comment').notEmpty().isString(),
    body('communicationRating').optional().isInt({ min: 1, max: 5 }),
    body('knowledgeRating').optional().isInt({ min: 1, max: 5 }),
    body('helpfulnessRating').optional().isInt({ min: 1, max: 5 }),
    async (req: Request, _res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return _res.status(400).json({ errors: errors.array() });
        }

        const sessionId = parseInt(req.params.sessionId);
        const clientId = req.userId;

        const review = await coachService.submitReview(sessionId, clientId, req.body);

        _res.status(201).json({
          success: true,
          data: review,
        });
      } catch (error) {
        logger.error('Error submitting review', { error });
        _res.status(400).json({
          success: false,
          error: (error as Error)?.message || "Failed to submit review",
        });
      }
    },
  ];

  // Get coach packages
  getCoachPackages = [
    param('coachId').isInt(),
    async (req: Request, _res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return _res.status(400).json({ errors: errors.array() });
        }

        const coachId = parseInt(req.params.coachId);
        const packages = await coachService.getCoachPackages(coachId);

        _res.json({
          success: true,
          data: packages,
        });
      } catch (error) {
        logger.error('Error getting coach packages', { error });
        _res.status(500).json({
          success: false,
          error: 'Failed to get coach packages',
        });
      }
    },
  ];

  // Purchase package
  purchasePackage = [
    param('id').isInt(),
    body('paymentMethodId').notEmpty().isString(),
    async (req: Request, _res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return _res.status(400).json({ errors: errors.array() });
        }

        const packageId = parseInt(req.params.id);
        const clientId = req.userId;
        const { paymentMethodId } = req.body;

        const clientPackage = await coachService.purchasePackage(
          packageId,
          clientId,
          paymentMethodId
        );

        _res.status(201).json({
          success: true,
          data: clientPackage,
        });
      } catch (error) {
        logger.error('Error purchasing package', { error });
        _res.status(400).json({
          success: false,
          error: (error as Error)?.message || "Failed to purchase package",
        });
      }
    },
  ];

  // Get coach dashboard (for coaches)
  getCoachDashboard = async (req: Request, _res: Response) => {
    try {
      const userId = req.userId;

      // Get coach profile by user ID
      const { CoachProfile } = require('../models/CoachProfile');
      const coachProfile = await CoachProfile.findOne({
        where: { userId },
      });

      if (!coachProfile) {
        return _res.status(404).json({
          success: false,
          error: 'Coach profile not found',
        });
      }

      const dashboard = await coachService.getCoachDashboard(coachProfile.id);

      _res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      logger.error('Error getting coach dashboard', { error });
      _res.status(500).json({
        success: false,
        error: 'Failed to get coach dashboard',
      });
    }
  };

  // Get client sessions
  getClientSessions = [
    query('status').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    async (req: Request, _res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return _res.status(400).json({ errors: errors.array() });
        }

        const clientId = req.userId;
        const status = req.query.status as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const sessions = await coachService.getClientSessions(clientId, status, page, limit);

        _res.json({
          success: true,
          data: sessions.sessions,
          pagination: {
            page,
            limit,
            total: sessions.total,
            pages: sessions.pages,
          },
        });
      } catch (error) {
        logger.error('Error getting client sessions', { error });
        _res.status(500).json({
          success: false,
          error: 'Failed to get client sessions',
        });
      }
    },
  ];

  // Admin: Get all coaches
  adminGetCoaches = async (req: Request, _res: Response) => {
    try {
      const { CoachProfile } = require('../models/CoachProfile');
      const { User } = require('../models/User');

      const coaches = await CoachProfile.findAll({
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      _res.json({
        success: true,
        data: coaches,
      });
    } catch (error) {
      logger.error('Error getting coaches for admin', { error });
      _res.status(500).json({
        success: false,
        error: 'Failed to get coaches',
      });
    }
  };

  // Admin: Get all sessions
  adminGetSessions = async (req: Request, _res: Response) => {
    try {
      const { CoachSession } = require('../models/CoachSession');
      const { CoachProfile } = require('../models/CoachProfile');
      const { User } = require('../models/User');

      const sessions = await CoachSession.findAll({
        include: [
          {
            model: CoachProfile,
            attributes: ['id', 'displayName'],
          },
          {
            model: User,
            as: 'client',
            attributes: ['id', 'name', 'email'],
          },
        ],
        order: [['scheduledAt', 'DESC']],
        limit: 100,
      });

      _res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      logger.error('Error getting sessions for admin', { error });
      _res.status(500).json({
        success: false,
        error: 'Failed to get sessions',
      });
    }
  };

  // Admin: Get all reviews
  adminGetReviews = async (req: Request, _res: Response) => {
    try {
      const { CoachReview } = require('../models/CoachReview');
      const { CoachProfile } = require('../models/CoachProfile');
      const { User } = require('../models/User');

      const reviews = await CoachReview.findAll({
        include: [
          {
            model: CoachProfile,
            attributes: ['id', 'displayName'],
          },
          {
            model: User,
            as: 'client',
            attributes: ['id', 'name'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: 100,
      });

      _res.json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      logger.error('Error getting reviews for admin', { error });
      _res.status(500).json({
        success: false,
        error: 'Failed to get reviews',
      });
    }
  };

  // Admin: Get marketplace stats
  adminGetStats = async (req: Request, _res: Response) => {
    try {
      const stats = await coachService.getMarketplaceStats();

      _res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting marketplace stats', { error });
      _res.status(500).json({
        success: false,
        error: 'Failed to get marketplace stats',
      });
    }
  };

  // Admin: Update coach status
  adminUpdateCoachStatus = [
    param('id').isInt(),
    body('isActive').isBoolean(),
    async (req: Request, _res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return _res.status(400).json({ errors: errors.array() });
        }

        const coachId = parseInt(req.params.id);
        const { isActive } = req.body;

        const { CoachProfile } = require('../models/CoachProfile');
        await CoachProfile.update({ isActive }, { where: { id: coachId } });

        _res.json({
          success: true,
          message: 'Coach status updated successfully',
        });
      } catch (error) {
        logger.error('Error updating coach status', { error });
        _res.status(500).json({
          success: false,
          error: 'Failed to update coach status',
        });
      }
    },
  ];

  // Admin: Verify coach
  adminVerifyCoach = [
    param('id').isInt(),
    body('isVerified').isBoolean(),
    async (req: Request, _res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return _res.status(400).json({ errors: errors.array() });
        }

        const coachId = parseInt(req.params.id);
        const { isVerified } = req.body;

        const { CoachProfile } = require('../models/CoachProfile');
        await CoachProfile.update({ isVerified }, { where: { id: coachId } });

        _res.json({
          success: true,
          message: 'Coach verification updated successfully',
        });
      } catch (error) {
        logger.error('Error verifying coach', { error });
        _res.status(500).json({
          success: false,
          error: 'Failed to verify coach',
        });
      }
    },
  ];

  // Admin: Feature coach
  adminFeatureCoach = [
    param('id').isInt(),
    body('isFeatured').isBoolean(),
    async (req: Request, _res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return _res.status(400).json({ errors: errors.array() });
        }

        const coachId = parseInt(req.params.id);
        const { isFeatured } = req.body;

        const { CoachProfile } = require('../models/CoachProfile');
        await CoachProfile.update({ isFeatured }, { where: { id: coachId } });

        _res.json({
          success: true,
          message: 'Coach feature status updated successfully',
        });
      } catch (error) {
        logger.error('Error featuring coach', { error });
        _res.status(500).json({
          success: false,
          error: 'Failed to update coach feature status',
        });
      }
    },
  ];

  // Admin: Delete review
  adminDeleteReview = [
    param('id').isInt(),
    async (req: Request, _res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return _res.status(400).json({ errors: errors.array() });
        }

        const reviewId = parseInt(req.params.id);

        const { CoachReview } = require('../models/CoachReview');
        await CoachReview.destroy({
          where: { id: reviewId },
        });

        _res.json({
          success: true,
          message: 'Review deleted successfully',
        });
      } catch (error) {
        logger.error('Error deleting review', { error });
        _res.status(500).json({
          success: false,
          error: 'Failed to delete review',
        });
      }
    },
  ];

  // Cancel session
  cancelSession = [
    param('id').isInt(),
    body('reason').optional().isString(),
    async (req: Request, _res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return _res.status(400).json({ errors: errors.array() });
        }

        const sessionId = parseInt(req.params.id);
        const userId = req.userId;
        const userRole = req.userRole;
        const { reason } = req.body;

        await coachService.cancelSession(sessionId, userId, userRole, reason);

        _res.json({
          success: true,
          message: 'Session cancelled successfully',
        });
      } catch (error) {
        logger.error('Error cancelling session', { error });
        _res.status(400).json({
          success: false,
          error: (error as Error)?.message || "Failed to cancel session",
        });
      }
    },
  ];
}

export const coachController = new CoachController();
