import { User } from '../../models/User';
import { Transaction } from 'sequelize';
import { logger } from '../../utils/logger';
import emailService from '../email/UnifiedEmailService';
import { analyticsService } from '../analytics/AnalyticsService';
import { generateCode } from '../../utils/generators';
import { getCacheService } from '../cache/UnifiedCacheService';

interface ReferralProgram {
  id: string;
  name: string;
  rewardType: 'percentage' | 'fixed' | 'credits' | 'subscription';
  referrerReward: number;
  refereeReward: number;
  maxRewards?: number;
  validityDays: number;
  conditions: ReferralConditions;
}

interface ReferralConditions {
  minSubscriptionTier?: string;
  requiresPaidPlan?: boolean;
  minAccountAge?: number; // days
  geoRestrictions?: string[];
}

interface Referral {
  id: number;
  referrerId: number;
  refereeId?: number;
  code: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  rewardStatus: 'pending' | 'paid' | 'failed';
  referrerReward?: number;
  refereeReward?: number;
  programId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export class ReferralService {
  private programs: Map<string, ReferralProgram> = new Map();
  private referrals: Map<string, Referral> = new Map(); // code -> referral

  constructor() {
    this.initializePrograms();
  }

  private initializePrograms() {
    // Standard referral program
    this.programs.set('standard', {
      id: 'standard',
      name: 'Standard Referral Program',
      rewardType: 'percentage',
      referrerReward: 20, // 20% commission
      refereeReward: 20, // 20% discount
      maxRewards: 10,
      validityDays: 90,
      conditions: {
        requiresPaidPlan: false,
      },
    });

    // Premium referral program
    this.programs.set('premium', {
      id: 'premium',
      name: 'Premium Referral Program',
      rewardType: 'fixed',
      referrerReward: 50, // $50 credit
      refereeReward: 30, // $30 discount
      validityDays: 180,
      conditions: {
        minSubscriptionTier: 'pro',
        requiresPaidPlan: true,
        minAccountAge: 30,
      },
    });

    // Coach referral program
    this.programs.set('coach', {
      id: 'coach',
      name: 'Coach Partner Program',
      rewardType: 'percentage',
      referrerReward: 30, // 30% recurring commission
      refereeReward: 25, // 25% discount first 3 months
      validityDays: 365,
      conditions: {
        minSubscriptionTier: 'coach',
        requiresPaidPlan: true,
      },
    });
  }

  // Create a referral code for a user
  async createReferralCode(userId: number, programId: string = 'standard'): Promise<Referral> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const program = this.programs.get(programId);
    if (!program) {
      throw new Error('Invalid referral program');
    }

    // Check if user is eligible
    const isEligible = await this.checkEligibility(user, program);
    if (!isEligible.eligible) {
      throw new Error(`Not eligible for referral program: ${isEligible.reason}`);
    }

    // Generate unique code
    let code: string;
    let attempts = 0;
    do {
      code = await this.generateUniqueCode(user);
      attempts++;
    } while (this.referrals.has(code) && attempts < 10);

    if (attempts >= 10) {
      throw new Error('Failed to generate unique referral code');
    }

    // Create referral
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + program.validityDays);

    const referral: Referral = {
      id: Date.now(), // In production, use proper ID generation
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

    // Store referral
    this.referrals.set(code, referral);
    await this.saveReferralToDatabase(referral);

    // Track event
    await analyticsService.trackUserAction(userId, 'Referral Code Created', {
      programId,
      code,
      expiresAt,
    });

    logger.info('Referral code created', { userId, code, programId });

    return referral;
  }

  // Apply a referral code
  async applyReferralCode(
    refereeId: number,
    code: string,
    transaction?: Transaction
  ): Promise<{
    success: boolean;
    discount?: number;
    message: string;
  }> {
    try {
      const referral = await this.getReferralByCode(code);
      if (!referral) {
        return { success: false, message: 'Invalid referral code' };
      }

      // Check if code is valid
      const validation = await this.validateReferralCode(referral, refereeId);
      if (!validation.valid) {
        return { success: false, message: validation.reason || 'Invalid code' };
      }

      const program = this.programs.get(referral.programId);
      if (!program) {
        return { success: false, message: 'Invalid referral program' };
      }

      // Update referral
      referral.refereeId = refereeId;
      referral.status = 'completed';
      referral.completedAt = new Date();
      referral.refereeReward = program.refereeReward;

      await this.updateReferralInDatabase(referral, transaction);

      // Apply discount/benefit to referee
      const discount = await this.applyRefereeReward(refereeId, program, referral, transaction);

      // Schedule referrer reward (after referee pays)
      await this.scheduleReferrerReward(referral);

      // Send notifications
      await this.sendReferralNotifications(referral);

      // Track conversion
      await analyticsService.trackConversion(refereeId, 'referral_applied', discount, 'USD', {
        referralCode: code,
        programId: program.id,
        referrerId: referral.referrerId,
      });

      logger.info('Referral code applied', {
        refereeId,
        code,
        discount,
      });

      return {
        success: true,
        discount,
        message: `Referral applied! You saved ${this.formatReward(program.rewardType, discount)}`,
      };
    } catch (error) {
      logger.error('Failed to apply referral code', { error, refereeId, code });
      return {
        success: false,
        message: 'Failed to apply referral code',
      };
    }
  }

  // Get user's referral stats
  async getUserReferralStats(userId: number): Promise<{
    totalReferrals: number;
    successfulReferrals: number;
    totalEarnings: number;
    pendingEarnings: number;
    referralCode?: string;
    referrals: Referral[];
  }> {
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

  // Process referrer rewards (called after payment)
  async processReferrerReward(refereeId: number, paymentAmount: number): Promise<void> {
    try {
      // Find referral by referee
      const referral = await this.getReferralByReferee(refereeId);
      if (!referral || referral.rewardStatus !== 'pending') {
        return;
      }

      const program = this.programs.get(referral.programId);
      if (!program) {
        return;
      }

      // Calculate reward
      let rewardAmount = 0;
      if (program.rewardType === 'percentage') {
        rewardAmount = (paymentAmount * program.referrerReward) / 100;
      } else if (program.rewardType === 'fixed') {
        rewardAmount = program.referrerReward;
      }

      // Apply reward to referrer
      await this.applyReferrerReward(referral.referrerId, rewardAmount, referral);

      // Update referral
      referral.referrerReward = rewardAmount;
      referral.rewardStatus = 'paid';
      await this.updateReferralInDatabase(referral);

      // Send notification
      await this.sendRewardNotification(referral, rewardAmount);

      // Track reward
      await analyticsService.trackRevenue(
        referral.referrerId,
        rewardAmount,
        'USD',
        'referral_reward',
        {
          referralId: referral.id,
          refereeId,
        }
      );

      logger.info('Referrer reward processed', {
        referralId: referral.id,
        referrerId: referral.referrerId,
        rewardAmount,
      });
    } catch (error) {
      logger.error('Failed to process referrer reward', { error, refereeId });
    }
  }

  // Get overall referral stats
  async getOverallStats(): Promise<{
    totalReferrals: number;
    activeReferrals: number;
    completedReferrals: number;
    totalEarnings: number;
    pendingPayouts: number;
    conversionRate: number;
  }> {
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
      conversionRate:
        allReferrals.length > 0
          ? (allReferrals.filter(r => r.status === 'completed').length / allReferrals.length) * 100
          : 0,
    };

    return stats;
  }

  // Get referral leaderboard
  async getReferralLeaderboard(period: 'week' | 'month' | 'all' = 'month'): Promise<
    Array<{
      userId: number;
      userName: string;
      referralCount: number;
      totalEarnings: number;
      rank: number;
    }>
  > {
    const startDate = this.getLeaderboardStartDate(period);

    // In production, this would be a database query
    const leaderboard: Map<number, any> = new Map();

    for (const referral of this.referrals.values()) {
      if (referral.status === 'completed' && (!startDate || referral.completedAt! >= startDate)) {
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

    // Sort and add user details
    const sorted = Array.from(leaderboard.values()).sort(
      (a, b) => b.totalEarnings - a.totalEarnings
    );

    // Add user names and ranks
    const results = await Promise.all(
      sorted.slice(0, 10).map(async (entry, index) => {
        const user = await User.findByPk(entry.userId);
        return {
          ...entry,
          userName: user?.name || 'Unknown',
          rank: index + 1,
        };
      })
    );

    return results;
  }

  // Private helper methods

  private async checkEligibility(
    user: User,
    program: ReferralProgram
  ): Promise<{ eligible: boolean; reason?: string }> {
    const conditions = program.conditions;

    // Check subscription tier
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

    // Check paid plan requirement
    if (conditions.requiresPaidPlan && !user.role) {
      return {
        eligible: false,
        reason: 'Requires an active paid subscription',
      };
    }

    // Check account age
    if (conditions.minAccountAge) {
      const accountAgeDays = Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (accountAgeDays < conditions.minAccountAge) {
        return {
          eligible: false,
          reason: `Account must be at least ${conditions.minAccountAge} days old`,
        };
      }
    }

    // Check existing rewards limit
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

  private async generateUniqueCode(user: User): Promise<string> {
    // Generate code based on user name and random string
    const namePart = user.name
      .split(' ')[0]
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 4);
    const randomPart = generateCode(4);
    return `${namePart}${randomPart}`;
  }

  private async validateReferralCode(
    referral: Referral,
    refereeId: number
  ): Promise<{ valid: boolean; reason?: string }> {
    // Check if expired
    if (new Date() > referral.expiresAt) {
      return { valid: false, reason: 'Referral code has expired' };
    }

    // Check if already used
    if (referral.status !== 'pending') {
      return { valid: false, reason: 'Referral code has already been used' };
    }

    // Check self-referral
    if (referral.referrerId === refereeId) {
      return { valid: false, reason: 'Cannot use your own referral code' };
    }

    // Check if referee already has an account
    const existingReferral = await this.getReferralByReferee(refereeId);
    if (existingReferral) {
      return { valid: false, reason: 'You have already used a referral code' };
    }

    return { valid: true };
  }

  private async applyRefereeReward(
    _refereeId: number,
    program: ReferralProgram,
    _referral: Referral,
    _transaction?: Transaction
  ): Promise<number> {
    let discountAmount = 0;

    if (program.rewardType === 'percentage') {
      // Apply percentage discount to first payment
      discountAmount = program.refereeReward; // This will be applied as percentage
    } else if (program.rewardType === 'fixed') {
      // Apply fixed credit
      discountAmount = program.refereeReward;
      // In production, add credit to user account
    } else if (program.rewardType === 'subscription') {
      // Apply free subscription period
      // In production, extend subscription
    }

    return discountAmount;
  }

  private async applyReferrerReward(
    referrerId: number,
    amount: number,
    _referral: Referral
  ): Promise<void> {
    // In production, this would add credit to user account or process payout
    const user = await User.findByPk(referrerId);
    if (user) {
      // Add to user balance or credits
      logger.info('Referrer reward applied', { referrerId, amount });
    }
  }

  private async scheduleReferrerReward(_referral: Referral): Promise<void> {
    // In production, this would create a scheduled job
    // to process reward after referee's first payment
  }

  private async sendReferralNotifications(referral: Referral): Promise<void> {
    const [referrer, referee] = await Promise.all([
      User.findByPk(referral.referrerId),
      User.findByPk(referral.refereeId!),
    ]);

    if (referrer) {
      await emailService.send({
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

  private async sendRewardNotification(referral: Referral, amount: number): Promise<void> {
    const referrer = await User.findByPk(referral.referrerId);
    if (referrer) {
      await emailService.send({
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

  private formatReward(type: string, amount: number): string {
    if (type === 'percentage') {
      return `${amount}%`;
    } else if (type === 'fixed' || type === 'credits') {
      return `$${amount}`;
    }
    return amount.toString();
  }

  private getLeaderboardStartDate(period: string): Date | null {
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

  // Database operations (in production, these would use actual database)
  private async saveReferralToDatabase(referral: Referral): Promise<void> {
    await getCacheService().set(`referral:${referral.code}`, referral);
  }

  private async updateReferralInDatabase(
    referral: Referral,
    _transaction?: Transaction
  ): Promise<void> {
    await getCacheService().set(`referral:${referral.code}`, referral);
  }

  private async getReferralByCode(code: string): Promise<Referral | null> {
    return this.referrals.get(code) || (await getCacheService().get<Referral>(`referral:${code}`));
  }

  private async getReferralByReferee(refereeId: number): Promise<Referral | null> {
    // In production, query database
    for (const referral of this.referrals.values()) {
      if (referral.refereeId === refereeId) {
        return referral;
      }
    }
    return null;
  }

  private async getUserReferrals(userId: number): Promise<Referral[]> {
    const referrals: Referral[] = [];
    for (const referral of this.referrals.values()) {
      if (referral.referrerId === userId) {
        referrals.push(referral);
      }
    }
    return referrals;
  }

  private async countUserRewards(userId: number, programId: string): Promise<number> {
    let count = 0;
    for (const referral of this.referrals.values()) {
      if (
        referral.referrerId === userId &&
        referral.programId === programId &&
        referral.rewardStatus === 'paid'
      ) {
        count++;
      }
    }
    return count;
  }

  private async getUserTotalEarnings(userId: number): Promise<number> {
    let total = 0;
    for (const referral of this.referrals.values()) {
      if (referral.referrerId === userId && referral.rewardStatus === 'paid') {
        total += referral.referrerReward || 0;
      }
    }
    return total;
  }
}

export const referralService = new ReferralService();
