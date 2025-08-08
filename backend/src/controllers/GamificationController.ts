import { Request, Response } from 'express';
import { gamificationService } from '../services/gamification/GamificationService';
import { logger } from '../utils/logger';
import { body, query, param, validationResult } from 'express-validator';

export class GamificationController {
  // Get user stats
  getUserStats = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const stats = await gamificationService.getUserStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting user stats', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get user stats',
      });
    }
  };

  // Get user achievements
  getUserAchievements = [
    query('category').optional().isString(),
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const userId = (req as any).userId;
        const category = req.query.category as string;
        
        const achievements = await gamificationService.getUserAchievements(
          userId,
          category
        );

        res.json({
          success: true,
          data: achievements,
        });
      } catch (error) {
        logger.error('Error getting user achievements', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to get user achievements',
        });
      }
    },
  ];

  // Claim achievement
  claimAchievement = [
    param('achievementId').isInt(),
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const userId = (req as any).userId;
        const achievementId = parseInt(req.params.achievementId);

        // Mark achievement as claimed
        const { sequelize } = require('../models');
        const { QueryTypes } = require('sequelize');
        
        await sequelize.query(
          `UPDATE user_achievements 
           SET is_claimed = true, claimed_at = CURRENT_TIMESTAMP
           WHERE user_id = :userId AND achievement_id = :achievementId
             AND unlocked_at IS NOT NULL AND is_claimed = false`,
          {
            replacements: { userId, achievementId },
            type: QueryTypes.UPDATE,
          }
        );

        res.json({
          success: true,
          message: 'Achievement claimed successfully',
        });
      } catch (error) {
        logger.error('Error claiming achievement', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to claim achievement',
        });
      }
    },
  ];

  // Get user streaks
  getUserStreaks = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { sequelize } = require('../models');
      const { QueryTypes } = require('sequelize');

      const streaks = await sequelize.query(
        `SELECT * FROM user_streaks WHERE user_id = :userId`,
        {
          replacements: { userId },
          type: QueryTypes.SELECT,
        }
      );

      res.json({
        success: true,
        data: streaks,
      });
    } catch (error) {
      logger.error('Error getting user streaks', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get user streaks',
      });
    }
  };

  // Get available challenges
  getChallenges = [
    query('type').optional().isString(),
    query('status').optional().isIn(['active', 'upcoming', 'ended']),
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const userId = (req as any).userId;
        const type = req.query.type as string;
        const status = req.query.status as string || 'active';

        const { sequelize } = require('../models');
        const { QueryTypes } = require('sequelize');

        let whereClause = 'WHERE c.is_active = true';
        const replacements: any = { userId };

        if (type) {
          whereClause += ' AND c.type = :type';
          replacements.type = type;
        }

        if (status === 'active') {
          whereClause += ' AND c.start_date <= NOW() AND c.end_date >= NOW()';
        } else if (status === 'upcoming') {
          whereClause += ' AND c.start_date > NOW()';
        } else if (status === 'ended') {
          whereClause += ' AND c.end_date < NOW()';
        }

        const challenges = await sequelize.query(
          `SELECT 
             c.*,
             uc.status as participation_status,
             uc.completion_percentage,
             uc.joined_at,
             (
               SELECT COUNT(*) 
               FROM user_challenges 
               WHERE challenge_id = c.id
             ) as participant_count
           FROM challenges c
           LEFT JOIN user_challenges uc ON c.id = uc.challenge_id AND uc.user_id = :userId
           ${whereClause}
           ORDER BY c.is_featured DESC, c.start_date ASC`,
          {
            replacements,
            type: QueryTypes.SELECT,
          }
        );

        res.json({
          success: true,
          data: challenges,
        });
      } catch (error) {
        logger.error('Error getting challenges', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to get challenges',
        });
      }
    },
  ];

  // Join challenge
  joinChallenge = [
    param('challengeId').isInt(),
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const userId = (req as any).userId;
        const challengeId = parseInt(req.params.challengeId);

        await gamificationService.joinChallenge(userId, challengeId);

        res.json({
          success: true,
          message: 'Successfully joined challenge',
        });
      } catch (error) {
        logger.error('Error joining challenge', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to join challenge',
        });
      }
    },
  ];

  // Get leaderboard
  getLeaderboard = [
    query('type').isIn(['points', 'achievements', 'streaks', 'level']),
    query('period').optional().isIn(['all_time', 'monthly', 'weekly', 'daily']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const type = req.query.type as any;
        const period = (req.query.period as any) || 'all_time';
        const limit = parseInt(req.query.limit as string) || 10;

        const leaderboard = await gamificationService.getLeaderboard(
          type,
          period,
          limit
        );

        res.json({
          success: true,
          data: leaderboard,
        });
      } catch (error) {
        logger.error('Error getting leaderboard', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to get leaderboard',
        });
      }
    },
  ];

  // Get reward store items
  getRewardStore = [
    query('category').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const userId = (req as any).userId;
        const category = req.query.category as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        const { sequelize } = require('../models');
        const { QueryTypes } = require('sequelize');

        // Get user level for filtering
        const userLevel = await sequelize.query(
          `SELECT current_level FROM user_levels WHERE user_id = :userId`,
          {
            replacements: { userId },
            type: QueryTypes.SELECT,
          }
        );

        const level = userLevel[0]?.current_level || 1;

        let whereClause = 'WHERE ri.is_active = true AND ri.min_level_required <= :level';
        const replacements: any = { userId, level, limit, offset };

        if (category) {
          whereClause += ' AND ri.category = :category';
          replacements.category = category;
        }

        const items = await sequelize.query(
          `SELECT 
             ri.*,
             (
               SELECT COUNT(*) 
               FROM user_rewards 
               WHERE user_id = :userId AND reward_item_id = ri.id
             ) as user_purchase_count,
             CASE 
               WHEN ri.stock_quantity IS NULL THEN true
               WHEN ri.stock_quantity > 0 THEN true
               ELSE false
             END as in_stock
           FROM reward_items ri
           ${whereClause}
           ORDER BY ri.is_featured DESC, ri.point_cost ASC
           LIMIT :limit OFFSET :offset`,
          {
            replacements,
            type: QueryTypes.SELECT,
          }
        );

        // Get total count
        const countResult = await sequelize.query(
          `SELECT COUNT(*) as total
           FROM reward_items ri
           ${whereClause}`,
          {
            replacements,
            type: QueryTypes.SELECT,
          }
        );

        res.json({
          success: true,
          data: items,
          pagination: {
            page,
            limit,
            total: countResult[0].total,
            pages: Math.ceil(countResult[0].total / limit),
          },
        });
      } catch (error) {
        logger.error('Error getting reward store', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to get reward store',
        });
      }
    },
  ];

  // Purchase reward
  purchaseReward = [
    param('itemId').isInt(),
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const userId = (req as any).userId;
        const itemId = parseInt(req.params.itemId);

        await gamificationService.purchaseReward(userId, itemId);

        res.json({
          success: true,
          message: 'Reward purchased successfully',
        });
      } catch (error: any) {
        logger.error('Error purchasing reward', { error });
        res.status(400).json({
          success: false,
          error: error.message || 'Failed to purchase reward',
        });
      }
    },
  ];

  // Get user rewards
  getUserRewards = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { sequelize } = require('../models');
      const { QueryTypes } = require('sequelize');

      const rewards = await sequelize.query(
        `SELECT 
           ur.*,
           ri.name,
           ri.description,
           ri.category,
           ri.item_data,
           ri.preview_image_url
         FROM user_rewards ur
         JOIN reward_items ri ON ur.reward_item_id = ri.id
         WHERE ur.user_id = :userId
         ORDER BY ur.purchased_at DESC`,
        {
          replacements: { userId },
          type: QueryTypes.SELECT,
        }
      );

      res.json({
        success: true,
        data: rewards,
      });
    } catch (error) {
      logger.error('Error getting user rewards', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get user rewards',
      });
    }
  };

  // Track activity (for internal use)
  trackActivity = [
    body('category').notEmpty().isString(),
    body('value').optional().isInt(),
    body('metadata').optional().isObject(),
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const userId = (req as any).userId;
        const { category, value, metadata } = req.body;

        await gamificationService.trackProgress(
          userId,
          category,
          value || 1,
          metadata
        );

        res.json({
          success: true,
          message: 'Activity tracked successfully',
        });
      } catch (error) {
        logger.error('Error tracking activity', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to track activity',
        });
      }
    },
  ];

  // Update streak
  updateStreak = [
    body('streakType').notEmpty().isString(),
    body('activityDate').optional().isISO8601(),
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const userId = (req as any).userId;
        const { streakType, activityDate } = req.body;

        await gamificationService.updateStreak(
          userId,
          streakType,
          activityDate ? new Date(activityDate) : new Date()
        );

        res.json({
          success: true,
          message: 'Streak updated successfully',
        });
      } catch (error) {
        logger.error('Error updating streak', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to update streak',
        });
      }
    },
  ];
}

export const gamificationController = new GamificationController();