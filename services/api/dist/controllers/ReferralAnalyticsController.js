"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralAnalyticsController = exports.ReferralAnalyticsController = void 0;
const sequelize_1 = require("sequelize");
const Referral_1 = require("../models/Referral");
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const ReferralService_1 = require("../services/referral/ReferralService");
class ReferralAnalyticsController {
    async getReferralStats(req, res) {
        try {
            const stats = await ReferralService_1.referralService.getOverallStats();
            res.json({
                totalReferrals: stats.totalReferrals,
                activeReferrals: stats.activeReferrals,
                completedReferrals: stats.completedReferrals,
                totalEarnings: stats.totalEarnings,
                pendingPayouts: stats.pendingPayouts,
                averageConversionRate: stats.conversionRate,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get referral stats:', error);
            res.status(500).json({ error: 'Failed to fetch referral statistics' });
        }
    }
    async getAllReferrals(req, _res) {
        try {
            const { page = 1, limit = 20, status, search } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const where = {};
            if (status && status !== 'all') {
                where.status = status;
            }
            if (search) {
                where[sequelize_1.Op.or] = [
                    { code: { [sequelize_1.Op.iLike]: `%${search}%` } },
                    { '$referrer.name$': { [sequelize_1.Op.iLike]: `%${search}%` } },
                    { '$referee.name$': { [sequelize_1.Op.iLike]: `%${search}%` } },
                ];
            }
            const referrals = await Referral_1.Referral.findAll({
                where,
                include: [
                    {
                        model: User_1.User,
                        as: 'referrer',
                        attributes: ['id', 'name', 'email'],
                    },
                    {
                        model: User_1.User,
                        as: 'referee',
                        attributes: ['id', 'name', 'email'],
                    },
                ],
                limit: parseInt(limit),
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get all referrals:', error);
            _res.status(500).json({ error: 'Failed to fetch referrals' });
        }
    }
    async updateReferralStatus(req, _res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const referral = await Referral_1.Referral.findByPk(id);
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
        }
        catch (error) {
            logger_1.logger.error('Failed to update referral status:', error);
            _res.status(500).json({ error: 'Failed to update referral status' });
        }
    }
    async processReferralPayment(req, _res) {
        try {
            const { referralId } = req.body;
            const referral = await Referral_1.Referral.findByPk(referralId);
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
        }
        catch (error) {
            logger_1.logger.error('Failed to process referral payment:', error);
            _res.status(500).json({ error: 'Failed to process payment' });
        }
    }
    async getReferralPrograms(req, res) {
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
            res.json(programs);
        }
        catch (error) {
            logger_1.logger.error('Failed to get referral programs:', error);
            res.status(500).json({ error: 'Failed to fetch referral programs' });
        }
    }
}
exports.ReferralAnalyticsController = ReferralAnalyticsController;
exports.referralAnalyticsController = new ReferralAnalyticsController();
//# sourceMappingURL=ReferralAnalyticsController.js.map