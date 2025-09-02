"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const ReferralService_1 = require("../services/referral/ReferralService");
const AnalyticsService_1 = require("../services/analytics/AnalyticsService");
const logger_1 = require("../utils/logger");
const Referral_1 = require("../models/Referral");
const router = (0, express_1.Router)();
// Get user's referral stats
router.get('/stats', auth_1.authMiddleware, async (req, _res) => {
    try {
        const userId = req.user.id;
        const stats = await ReferralService_1.referralService.getUserReferralStats(Number(userId));
        _res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get referral stats', { error, userId: req.user.id });
        _res.status(500).json({
            success: false,
            error: 'Failed to retrieve referral statistics',
        });
    }
});
// Create a new referral code
router.post('/code', auth_1.authMiddleware, [(0, express_validator_1.body)('programId').optional().isString().isIn(['standard', 'premium', 'coach'])], validation_1.validateRequest, async (req, _res) => {
    try {
        const userId = req.user.id;
        const { programId = 'standard' } = req.body;
        const referral = await ReferralService_1.referralService.createReferralCode(Number(userId), programId);
        // Track event
        await AnalyticsService_1.analyticsService.trackUserAction(Number(userId), 'Referral Code Generated', {
            programId,
            code: referral.code,
        });
        _res.status(201).json({
            success: true,
            data: {
                code: referral.code,
                expiresAt: referral.expiresAt,
                programId: referral.programId,
                shareUrl: `${process.env.FRONTEND_URL}/signup?ref=${referral.code}`,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create referral code', { error, userId: req.user.id });
        _res.status(400).json({
            success: false,
            error: error?.message || 'Failed to create referral code',
        });
    }
});
// Validate a referral code (public endpoint)
router.post('/validate', [(0, express_validator_1.body)('code').notEmpty().isString().isLength({ min: 4, max: 20 })], validation_1.validateRequest, async (req, _res) => {
    try {
        const { code } = req.body;
        // Basic validation without applying
        const referral = await Referral_1.Referral.findByCode(code);
        if (!referral) {
            return _res.status(404).json({
                success: false,
                error: 'Invalid referral code',
            });
        }
        const isValid = referral.isActive();
        _res.json({
            success: true,
            data: {
                valid: isValid,
                programId: referral.programId,
                discount: referral.programId === 'standard' ? 20 : referral.programId === 'premium' ? 30 : 25,
                discountType: 'percentage',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to validate referral code', { error });
        _res.status(500).json({
            success: false,
            error: 'Failed to validate referral code',
        });
    }
});
// Apply a referral code (called during signup)
router.post('/apply', auth_1.authMiddleware, [(0, express_validator_1.body)('code').notEmpty().isString().isLength({ min: 4, max: 20 })], validation_1.validateRequest, async (req, _res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;
        const result = await ReferralService_1.referralService.applyReferralCode(Number(userId), code);
        if (!result.success) {
            return _res.status(400).json({
                success: false,
                error: result.message,
            });
        }
        _res.json({
            success: true,
            data: {
                discount: result.discount,
                message: result.message,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to apply referral code', { error, userId: req.user.id });
        _res.status(500).json({
            success: false,
            error: 'Failed to apply referral code',
        });
    }
});
// Get referral leaderboard
router.get('/leaderboard', [(0, express_validator_1.query)('period').optional().isIn(['week', 'month', 'all'])], validation_1.validateRequest, async (req, _res) => {
    try {
        const period = req.query.period || 'month';
        const leaderboard = await ReferralService_1.referralService.getReferralLeaderboard(period);
        _res.json({
            success: true,
            data: {
                period,
                leaderboard,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get referral leaderboard', { error });
        _res.status(500).json({
            success: false,
            error: 'Failed to retrieve leaderboard',
        });
    }
});
// Get referral history
router.get('/history', auth_1.authMiddleware, async (req, _res) => {
    try {
        const userId = req.user.id;
        const stats = await ReferralService_1.referralService.getUserReferralStats(Number(userId));
        _res.json({
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get referral history', { error, userId: req.user.id });
        _res.status(500).json({
            success: false,
            error: 'Failed to retrieve referral history',
        });
    }
});
// Track referral click (public endpoint)
router.post('/click', [
    (0, express_validator_1.body)('code').notEmpty().isString(),
    (0, express_validator_1.body)('landingPage').optional().isURL(),
    (0, express_validator_1.body)('utmParams').optional().isObject(),
], validation_1.validateRequest, async (req, _res) => {
    try {
        const { code, landingPage, utmParams } = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get('user-agent');
        const referrer = req.get('referrer');
        // Track click in analytics
        await AnalyticsService_1.analyticsService.track({
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
        _res.json({
            success: true,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to track referral click', { error });
        _res.status(500).json({
            success: false,
            error: 'Failed to track click',
        });
    }
});
// Share referral code via email
router.post('/share', auth_1.authMiddleware, [
    (0, express_validator_1.body)('emails').isArray().notEmpty(),
    (0, express_validator_1.body)('emails.*').isEmail(),
    (0, express_validator_1.body)('message').optional().isString().isLength({ max: 500 }),
], validation_1.validateRequest, async (req, _res) => {
    try {
        const userId = req.user.id;
        const { emails, message } = req.body;
        // Get user's active referral code
        const stats = await ReferralService_1.referralService.getUserReferralStats(Number(userId));
        if (!stats.referralCode) {
            return _res.status(400).json({
                success: false,
                error: 'No active referral code found',
            });
        }
        // Send referral invites (implement email sending)
        // This would integrate with email service
        // Track shares
        await AnalyticsService_1.analyticsService.trackUserAction(Number(userId), 'Referral Shared', {
            method: 'email',
            recipients: emails.length,
        });
        _res.json({
            success: true,
            data: {
                sent: emails.length,
                message: 'Referral invitations sent successfully',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to share referral', { error, userId: req.user.id });
        _res.status(500).json({
            success: false,
            error: 'Failed to share referral code',
        });
    }
});
// Admin endpoint to process referral rewards
router.post('/process-reward', auth_1.authMiddleware, [(0, express_validator_1.body)('refereeId').isInt(), (0, express_validator_1.body)('paymentAmount').isFloat({ min: 0 })], validation_1.validateRequest, async (req, _res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return _res.status(403).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const { refereeId, paymentAmount } = req.body;
        await ReferralService_1.referralService.processReferrerReward(Number(refereeId), paymentAmount);
        _res.json({
            success: true,
            data: {
                message: 'Referral reward processed successfully',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to process referral reward', { error });
        _res.status(500).json({
            success: false,
            error: 'Failed to process reward',
        });
    }
});
exports.default = router;
//# sourceMappingURL=referral.js.map