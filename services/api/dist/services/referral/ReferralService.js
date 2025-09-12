"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralService = exports.ReferralService = void 0;
const User_1 = require("../../models/User");
const generators_1 = require("../../utils/generators");
const logger_1 = require("../../utils/logger");
const AnalyticsService_1 = require("../analytics/AnalyticsService");
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
const UnifiedEmailService_1 = __importDefault(require("../email/UnifiedEmailService"));
class ReferralService {
    programs = new Map();
    referrals = new Map();
    constructor() {
        this.initializePrograms();
    }
    initializePrograms() {
        this.programs.set('standard', {
            id: 'standard',
            name: 'Standard Referral Program',
            rewardType: 'percentage',
            referrerReward: 20,
            refereeReward: 20,
            maxRewards: 10,
            validityDays: 90,
            conditions: {
                requiresPaidPlan: false,
            },
        });
        this.programs.set('premium', {
            id: 'premium',
            name: 'Premium Referral Program',
            rewardType: 'fixed',
            referrerReward: 50,
            refereeReward: 30,
            validityDays: 180,
            conditions: {
                minSubscriptionTier: 'pro',
                requiresPaidPlan: true,
                minAccountAge: 30,
            },
        });
        this.programs.set('coach', {
            id: 'coach',
            name: 'Coach Partner Program',
            rewardType: 'percentage',
            referrerReward: 30,
            refereeReward: 25,
            validityDays: 365,
            conditions: {
                minSubscriptionTier: 'coach',
                requiresPaidPlan: true,
            },
        });
    }
    async createReferralCode(userId, programId = 'standard') {
        const user = await User_1.User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const program = this.programs.get(programId);
        if (!program) {
            throw new Error('Invalid referral program');
        }
        const isEligible = await this.checkEligibility(user, program);
        if (!isEligible.eligible) {
            throw new Error(`Not eligible for referral program: ${isEligible.reason}`);
        }
        let code;
        let attempts = 0;
        do {
            code = await this.generateUniqueCode(user);
            attempts++;
        } while (this.referrals.has(code) && attempts < 10);
        if (attempts >= 10) {
            throw new Error('Failed to generate unique referral code');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + program.validityDays);
        const referral = {
            id: Date.now(),
            referrerId: userId,
            code,
            status: 'pending',
            rewardStatus: 'pending',
            programId,
            createdAt: new Date(),
            expiresAt,
            metadata: {
                userTier: user.role,
                programName: program.name,
            },
        };
        this.referrals.set(code, referral);
        await this.saveReferralToDatabase(referral);
        await AnalyticsService_1.analyticsService.trackUserAction(userId, 'Referral Code Created', {
            programId,
            code,
            expiresAt,
        });
        logger_1.logger.info('Referral code created', { userId, code, programId });
        return referral;
    }
    async applyReferralCode(refereeId, code, transaction) {
        try {
            const referral = await this.getReferralByCode(code);
            if (!referral) {
                return { success: false, message: 'Invalid referral code' };
            }
            const validation = await this.validateReferralCode(referral, refereeId);
            if (!validation.valid) {
                return { success: false, message: validation.reason || 'Invalid code' };
            }
            const program = this.programs.get(referral.programId);
            if (!program) {
                return { success: false, message: 'Invalid referral program' };
            }
            referral.refereeId = refereeId;
            referral.status = 'completed';
            referral.completedAt = new Date();
            referral.refereeReward = program.refereeReward;
            await this.updateReferralInDatabase(referral, transaction);
            const discount = await this.applyRefereeReward(refereeId, program, referral, transaction);
            await this.scheduleReferrerReward(referral);
            await this.sendReferralNotifications(referral);
            await AnalyticsService_1.analyticsService.trackConversion(refereeId, 'referral_applied', discount, 'USD', {
                referralCode: code,
                programId: program.id,
                referrerId: referral.referrerId,
            });
            logger_1.logger.info('Referral code applied', {
                refereeId,
                code,
                discount,
            });
            return {
                success: true,
                discount,
                message: `Referral applied! You saved ${this.formatReward(program.rewardType, discount)}`,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to apply referral code', { error, refereeId, code });
            return {
                success: false,
                message: 'Failed to apply referral code',
            };
        }
    }
    async getUserReferralStats(userId) {
        const userReferrals = await this.getUserReferrals(userId);
        const stats = {
            totalReferrals: userReferrals.length,
            successfulReferrals: userReferrals.filter(r => r.status === 'completed').length,
            totalEarnings: userReferrals
                .filter(r => r.rewardStatus === 'paid')
                .reduce((sum, r) => sum + (r.referrerReward || 0), 0),
            pendingEarnings: userReferrals
                .filter(r => r.status === 'completed' && r.rewardStatus === 'pending')
                .reduce((sum, r) => sum + (r.referrerReward || 0), 0),
            referralCode: userReferrals.find(r => r.status === 'pending')?.code,
            referrals: userReferrals,
        };
        return stats;
    }
    async processReferrerReward(refereeId, paymentAmount) {
        try {
            const referral = await this.getReferralByReferee(refereeId);
            if (!referral || referral.rewardStatus !== 'pending') {
                return;
            }
            const program = this.programs.get(referral.programId);
            if (!program) {
                return;
            }
            let rewardAmount = 0;
            if (program.rewardType === 'percentage') {
                rewardAmount = (paymentAmount * program.referrerReward) / 100;
            }
            else if (program.rewardType === 'fixed') {
                rewardAmount = program.referrerReward;
            }
            await this.applyReferrerReward(referral.referrerId, rewardAmount, referral);
            referral.referrerReward = rewardAmount;
            referral.rewardStatus = 'paid';
            await this.updateReferralInDatabase(referral);
            await this.sendRewardNotification(referral, rewardAmount);
            await AnalyticsService_1.analyticsService.trackRevenue(referral.referrerId, rewardAmount, 'USD', 'referral_reward', {
                referralId: referral.id,
                refereeId,
            });
            logger_1.logger.info('Referrer reward processed', {
                referralId: referral.id,
                referrerId: referral.referrerId,
                rewardAmount,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to process referrer reward', { error, refereeId });
        }
    }
    async getOverallStats() {
        const allReferrals = Array.from(this.referrals.values());
        const stats = {
            totalReferrals: allReferrals.length,
            activeReferrals: allReferrals.filter(r => r.status === 'pending' && new Date() <= r.expiresAt)
                .length,
            completedReferrals: allReferrals.filter(r => r.status === 'completed').length,
            totalEarnings: allReferrals
                .filter(r => r.rewardStatus === 'paid')
                .reduce((sum, r) => sum + (r.referrerReward || 0), 0),
            pendingPayouts: allReferrals
                .filter(r => r.status === 'completed' && r.rewardStatus === 'pending')
                .reduce((sum, r) => sum + (r.referrerReward || 0), 0),
            conversionRate: allReferrals.length > 0
                ? (allReferrals.filter(r => r.status === 'completed').length / allReferrals.length) * 100
                : 0,
        };
        return stats;
    }
    async getReferralLeaderboard(period = 'month') {
        const startDate = this.getLeaderboardStartDate(period);
        const leaderboard = new Map();
        for (const referral of this.referrals.values()) {
            if (referral.status === 'completed' && (!startDate || referral.completedAt >= startDate)) {
                const existing = leaderboard.get(referral.referrerId) || {
                    userId: referral.referrerId,
                    referralCount: 0,
                    totalEarnings: 0,
                };
                existing.referralCount++;
                existing.totalEarnings += referral.referrerReward || 0;
                leaderboard.set(referral.referrerId, existing);
            }
        }
        const sorted = Array.from(leaderboard.values()).sort((a, b) => b.totalEarnings - a.totalEarnings);
        const results = await Promise.all(sorted.slice(0, 10).map(async (entry, index) => {
            const user = await User_1.User.findByPk(entry.userId);
            return {
                ...entry,
                userName: user?.name || 'Unknown',
                rank: index + 1,
            };
        }));
        return results;
    }
    async checkEligibility(user, program) {
        const conditions = program.conditions;
        if (conditions.minSubscriptionTier) {
            const tierHierarchy = ['free', 'basic', 'pro', 'premium', 'coach'];
            const userTierIndex = tierHierarchy.indexOf(user.role || 'free');
            const requiredTierIndex = tierHierarchy.indexOf(conditions.minSubscriptionTier);
            if (userTierIndex < requiredTierIndex) {
                return {
                    eligible: false,
                    reason: `Requires ${conditions.minSubscriptionTier} plan or higher`,
                };
            }
        }
        if (conditions.requiresPaidPlan && !user.role) {
            return {
                eligible: false,
                reason: 'Requires an active paid subscription',
            };
        }
        if (conditions.minAccountAge) {
            const accountAgeDays = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            if (accountAgeDays < conditions.minAccountAge) {
                return {
                    eligible: false,
                    reason: `Account must be at least ${conditions.minAccountAge} days old`,
                };
            }
        }
        if (program.maxRewards) {
            const existingRewards = await this.countUserRewards(Number(user.id), program.id);
            if (existingRewards >= program.maxRewards) {
                return {
                    eligible: false,
                    reason: 'Maximum referral rewards reached',
                };
            }
        }
        return { eligible: true };
    }
    async generateUniqueCode(user) {
        const namePart = user.name
            .split(' ')[0]
            .toUpperCase()
            .replace(/[^A-Z]/g, '')
            .slice(0, 4);
        const randomPart = (0, generators_1.generateCode)(4);
        return `${namePart}${randomPart}`;
    }
    async validateReferralCode(referral, refereeId) {
        if (new Date() > referral.expiresAt) {
            return { valid: false, reason: 'Referral code has expired' };
        }
        if (referral.status !== 'pending') {
            return { valid: false, reason: 'Referral code has already been used' };
        }
        if (referral.referrerId === refereeId) {
            return { valid: false, reason: 'Cannot use your own referral code' };
        }
        const existingReferral = await this.getReferralByReferee(refereeId);
        if (existingReferral) {
            return { valid: false, reason: 'You have already used a referral code' };
        }
        return { valid: true };
    }
    async applyRefereeReward(_refereeId, program, _referral, _transaction) {
        let discountAmount = 0;
        if (program.rewardType === 'percentage') {
            discountAmount = program.refereeReward;
        }
        else if (program.rewardType === 'fixed') {
            discountAmount = program.refereeReward;
        }
        else if (program.rewardType === 'subscription') {
        }
        return discountAmount;
    }
    async applyReferrerReward(referrerId, amount, _referral) {
        const user = await User_1.User.findByPk(referrerId);
        if (user) {
            logger_1.logger.info('Referrer reward applied', { referrerId, amount });
        }
    }
    async scheduleReferrerReward(_referral) {
    }
    async sendReferralNotifications(referral) {
        const [referrer, referee] = await Promise.all([
            User_1.User.findByPk(referral.referrerId),
            User_1.User.findByPk(referral.refereeId),
        ]);
        if (referrer) {
            await UnifiedEmailService_1.default.send({
                to: referrer.email,
                subject: 'Your referral joined UpCoach! 🎉',
                template: 'referral-success',
                data: {
                    referrerName: referrer.name,
                    refereeName: referee?.name || 'Someone',
                    rewardPending: true,
                },
            });
        }
    }
    async sendRewardNotification(referral, amount) {
        const referrer = await User_1.User.findByPk(referral.referrerId);
        if (referrer) {
            await UnifiedEmailService_1.default.send({
                to: referrer.email,
                subject: 'You earned a referral reward! 💰',
                template: 'referral-reward',
                data: {
                    referrerName: referrer.name,
                    rewardAmount: amount,
                    totalEarnings: await this.getUserTotalEarnings(Number(referrer.id)),
                },
            });
        }
    }
    formatReward(type, amount) {
        if (type === 'percentage') {
            return `${amount}%`;
        }
        else if (type === 'fixed' || type === 'credits') {
            return `$${amount}`;
        }
        return amount.toString();
    }
    getLeaderboardStartDate(period) {
        const now = new Date();
        switch (period) {
            case 'week':
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return weekAgo;
            case 'month':
                const monthAgo = new Date(now);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return monthAgo;
            default:
                return null;
        }
    }
    async saveReferralToDatabase(referral) {
        await (0, UnifiedCacheService_1.getCacheService)().set(`referral:${referral.code}`, referral);
    }
    async updateReferralInDatabase(referral, _transaction) {
        await (0, UnifiedCacheService_1.getCacheService)().set(`referral:${referral.code}`, referral);
    }
    async getReferralByCode(code) {
        return this.referrals.get(code) || (await (0, UnifiedCacheService_1.getCacheService)().get(`referral:${code}`));
    }
    async getReferralByReferee(refereeId) {
        for (const referral of this.referrals.values()) {
            if (referral.refereeId === refereeId) {
                return referral;
            }
        }
        return null;
    }
    async getUserReferrals(userId) {
        const referrals = [];
        for (const referral of this.referrals.values()) {
            if (referral.referrerId === userId) {
                referrals.push(referral);
            }
        }
        return referrals;
    }
    async countUserRewards(userId, programId) {
        let count = 0;
        for (const referral of this.referrals.values()) {
            if (referral.referrerId === userId &&
                referral.programId === programId &&
                referral.rewardStatus === 'paid') {
                count++;
            }
        }
        return count;
    }
    async getUserTotalEarnings(userId) {
        let total = 0;
        for (const referral of this.referrals.values()) {
            if (referral.referrerId === userId && referral.rewardStatus === 'paid') {
                total += referral.referrerReward || 0;
            }
        }
        return total;
    }
}
exports.ReferralService = ReferralService;
exports.referralService = new ReferralService();
//# sourceMappingURL=ReferralService.js.map