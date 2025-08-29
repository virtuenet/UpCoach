import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Referral } from '../models/Referral';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { referralService } from '../services/referral/ReferralService';

export class ReferralAnalyticsController {
  async getReferralStats_(req: Request, _res: Response): Promise<void> {
    try {
      const stats = await referralService.getOverallStats();
      
      _res.json({
        totalReferrals: stats.totalReferrals,
        activeReferrals: stats.activeReferrals,
        completedReferrals: stats.completedReferrals,
        totalEarnings: stats.totalEarnings,
        pendingPayouts: stats.pendingPayouts,
        averageConversionRate: stats.conversionRate,
      });
    } catch (error) {
      logger.error('Failed to get referral stats:', error);
      _res.status(500).json({ error: 'Failed to fetch referral statistics' });
    }
  }

  async getAllReferrals(req: Request, _res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      
      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where[Op.or as any] = [
          { code: { [Op.iLike]: `%${search}%` } },
          { '$referrer.name$': { [Op.iLike]: `%${search}%` } },
          { '$referee.name$': { [Op.iLike]: `%${search}%` } },
        ];
      }

      const referrals = await Referral.findAll({
        where,
        include: [
          {
            model: User,
            as: 'referrer',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: User,
            as: 'referee',
            attributes: ['id', 'name', 'email'],
          },
        ],
        limit: parseInt(limit as string),
        offset,
        order: [['createdAt', 'DESC']],
      });

      const formattedReferrals = referrals.map(ref => ({
        id: ref.id,
        referrerName: ref.referrer?.name || 'Unknown',
        referrerId: ref.referrerId,
        refereeName: ref.referee?.name || null,
        refereeId: ref.refereeId,
        code: ref.code,
        status: ref.status,
        rewardStatus: ref.rewardStatus,
        referrerReward: ref.referrerReward || 0,
        refereeReward: ref.refereeReward || 0,
        createdAt: ref.createdAt,
        completedAt: ref.completedAt,
        expiresAt: ref.expiresAt,
      }));

      _res.json(formattedReferrals);
    } catch (error) {
      logger.error('Failed to get all referrals:', error);
      _res.status(500).json({ error: 'Failed to fetch referrals' });
    }
  }

  async updateReferralStatus(req: Request, _res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const referral = await Referral.findByPk(id);
      if (!referral) {
        _res.status(404).json({ error: 'Referral not found' });
        return;
      }

      referral.status = status;
      if (status === 'completed' && !referral.completedAt) {
        referral.completedAt = new Date();
      }
      
      await referral.save();

      _res.json({ message: 'Referral status updated successfully' });
    } catch (error) {
      logger.error('Failed to update referral status:', error);
      _res.status(500).json({ error: 'Failed to update referral status' });
    }
  }

  async processReferralPayment(req: Request, _res: Response): Promise<void> {
    try {
      const { referralId } = req.body;

      const referral = await Referral.findByPk(referralId);
      if (!referral) {
        _res.status(404).json({ error: 'Referral not found' });
        return;
      }

      if (referral.rewardStatus === 'paid') {
        _res.status(400).json({ error: 'Reward already paid' });
        return;
      }

      // Process payment (integrate with payment service)
      // For now, just mark as paid
      referral.rewardStatus = 'paid';
      await referral.save();

      _res.json({ message: 'Payment processed successfully' });
    } catch (error) {
      logger.error('Failed to process referral payment:', error);
      _res.status(500).json({ error: 'Failed to process payment' });
    }
  }

  async getReferralPrograms_(req: Request, _res: Response): Promise<void> {
    try {
      const programs = [
        {
          id: 'standard',
          name: 'Standard Program',
          referrerReward: 20,
          refereeDiscount: 20,
          discountType: 'percentage',
          description: 'Get $20 for each successful referral',
        },
        {
          id: 'premium',
          name: 'Premium Program',
          referrerReward: 30,
          refereeDiscount: 30,
          discountType: 'percentage',
          description: 'Get $30 for each successful referral',
        },
        {
          id: 'coach',
          name: 'Coach Program',
          referrerReward: 25,
          refereeDiscount: 25,
          discountType: 'percentage',
          description: 'Special program for certified coaches',
        },
      ];

      _res.json(programs);
    } catch (error) {
      logger.error('Failed to get referral programs:', error);
      _res.status(500).json({ error: 'Failed to fetch referral programs' });
    }
  }
}

export const referralAnalyticsController = new ReferralAnalyticsController();