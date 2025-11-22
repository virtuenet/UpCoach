/**
 * Service-Level Integration Tests: Referral Service
 *
 * Tests the referral program business logic:
 * - Referral code generation
 * - Referral tracking and attribution
 * - Reward calculation and distribution
 * - Referral analytics
 * - Fraud detection
 */

import { faker } from '@faker-js/faker';

// Mock repositories
const mockReferralRepo = {
  create: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
};

const mockUserRepo = {
  findByPk: jest.fn(),
  update: jest.fn(),
};

const mockRewardRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  sum: jest.fn(),
};

const mockGamificationService = {
  awardPoints: jest.fn(),
  unlockAchievement: jest.fn(),
};

const mockEmailService = {
  sendReferralInvite: jest.fn(),
  sendReferralReward: jest.fn(),
};

/**
 * ReferralService
 *
 * Manages referral program and rewards
 */
class ReferralService {
  constructor(
    private referralRepo: any,
    private userRepo: any,
    private rewardRepo: any,
    private gamificationService: any,
    private emailService: any
  ) {}

  /**
   * Generate unique referral code for user
   */
  async generateReferralCode(userId: string): Promise<string> {
    const user = await this.userRepo.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate code from user name + random string
    const baseCode = (user.firstName + user.lastName)
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .substring(0, 4);

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referralCode = `${baseCode}${randomSuffix}`;

    return referralCode;
  }

  /**
   * Create referral tracking entry
   */
  async createReferral(data: {
    referrerId: string;
    referredEmail: string;
    referralCode: string;
  }) {
    // Validate referrer exists
    const referrer = await this.userRepo.findByPk(data.referrerId);
    if (!referrer) {
      throw new Error('Referrer not found');
    }

    // Check for existing referral
    const existing = await this.referralRepo.findOne({
      where: { referredEmail: data.referredEmail },
    });

    if (existing) {
      throw new Error('Email already referred');
    }

    // Create referral tracking
    const referral = await this.referralRepo.create({
      referrerId: data.referrerId,
      referredEmail: data.referredEmail,
      referralCode: data.referralCode,
      status: 'pending',
      createdAt: new Date(),
    });

    // Send invitation email
    await this.emailService.sendReferralInvite({
      toEmail: data.referredEmail,
      referrerName: `${referrer.firstName} ${referrer.lastName}`,
      referralCode: data.referralCode,
    });

    return referral;
  }

  /**
   * Complete referral when referred user signs up
   */
  async completeReferral(data: { referredEmail: string; referredUserId: string }) {
    // Find pending referral
    const referral = await this.referralRepo.findOne({
      where: { referredEmail: data.referredEmail, status: 'pending' },
    });

    if (!referral) {
      return null; // No referral found, user signed up organically
    }

    // Update referral status
    referral.status = 'completed';
    referral.referredUserId = data.referredUserId;
    referral.completedAt = new Date();
    await referral.save();

    // Award rewards to referrer
    const referrerReward = await this.awardReferrerReward(referral.referrerId);

    // Award rewards to referred user
    const referredReward = await this.awardReferredReward(data.referredUserId);

    return {
      referral,
      referrerReward,
      referredReward,
    };
  }

  /**
   * Award reward to referrer
   */
  private async awardReferrerReward(referrerId: string) {
    const rewardAmount = 1000; // 1000 points
    const rewardCash = 10; // $10 credit

    // Create reward record
    const reward = await this.rewardRepo.create({
      userId: referrerId,
      type: 'referrer',
      points: rewardAmount,
      cashValue: rewardCash,
      awardedAt: new Date(),
    });

    // Award gamification points
    await this.gamificationService.awardPoints({
      userId: referrerId,
      points: rewardAmount,
      reason: 'Successful referral',
    });

    // Check if user unlocked referral milestone achievements
    const totalReferrals = await this.referralRepo.count({
      where: { referrerId, status: 'completed' },
    });

    if (totalReferrals === 1) {
      await this.gamificationService.unlockAchievement(referrerId, 'first_referral');
    } else if (totalReferrals === 5) {
      await this.gamificationService.unlockAchievement(referrerId, 'referral_master');
    } else if (totalReferrals === 10) {
      await this.gamificationService.unlockAchievement(referrerId, 'referral_legend');
    }

    // Send reward notification
    await this.emailService.sendReferralReward({
      userId: referrerId,
      points: rewardAmount,
      cashValue: rewardCash,
    });

    return reward;
  }

  /**
   * Award reward to newly referred user
   */
  private async awardReferredReward(userId: string) {
    const welcomeBonus = 500; // 500 points

    const reward = await this.rewardRepo.create({
      userId,
      type: 'referred',
      points: welcomeBonus,
      cashValue: 0,
      awardedAt: new Date(),
    });

    await this.gamificationService.awardPoints({
      userId,
      points: welcomeBonus,
      reason: 'Welcome bonus (referred)',
    });

    return reward;
  }

  /**
   * Get referral analytics for user
   */
  async getReferralAnalytics(userId: string) {
    // Total referrals
    const totalReferrals = await this.referralRepo.count({
      where: { referrerId: userId, status: 'completed' },
    });

    // Pending referrals
    const pendingReferrals = await this.referralRepo.count({
      where: { referrerId: userId, status: 'pending' },
    });

    // Total rewards earned
    const totalRewardsPoints = await this.rewardRepo.sum('points', {
      where: { userId, type: 'referrer' },
    });

    const totalRewardsCash = await this.rewardRepo.sum('cashValue', {
      where: { userId, type: 'referrer' },
    });

    // Conversion rate
    const totalInvites = totalReferrals + pendingReferrals;
    const conversionRate = totalInvites > 0 ? (totalReferrals / totalInvites) * 100 : 0;

    return {
      totalReferrals,
      pendingReferrals,
      totalRewards: {
        points: totalRewardsPoints || 0,
        cashValue: totalRewardsCash || 0,
      },
      conversionRate,
    };
  }

  /**
   * Detect potential fraud
   */
  async detectFraud(userId: string): Promise<{ isFraudulent: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    // Check for rapid referrals (more than 10 in 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReferrals = await this.referralRepo.count({
      where: {
        referrerId: userId,
        createdAt: { $gte: oneDayAgo },
      },
    });

    if (recentReferrals > 10) {
      reasons.push('Suspicious referral rate (>10 in 24 hours)');
    }

    // Check for self-referral patterns
    const user = await this.userRepo.findByPk(userId);
    const referrals = await this.referralRepo.findAll({
      where: { referrerId: userId },
    });

    const suspiciousEmails = referrals.filter(
      (ref: any) =>
        ref.referredEmail.includes(user.email.split('@')[0]) || // Similar email prefix
        ref.referredEmail.split('@')[1] === user.email.split('@')[1] // Same domain
    );

    if (suspiciousEmails.length > 2) {
      reasons.push('Suspicious email patterns detected');
    }

    return {
      isFraudulent: reasons.length > 0,
      reasons,
    };
  }
}

// Test Suite
describe('ReferralService Integration Tests', () => {
  let service: ReferralService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReferralService(
      mockReferralRepo,
      mockUserRepo,
      mockRewardRepo,
      mockGamificationService,
      mockEmailService
    );
  });

  describe('generateReferralCode', () => {
    test('should generate unique referral code from user name', async () => {
      // Arrange
      mockUserRepo.findByPk.mockResolvedValue({
        id: faker.string.uuid(),
        firstName: 'John',
        lastName: 'Doe',
      });

      // Act
      const code = await service.generateReferralCode(faker.string.uuid());

      // Assert
      expect(code).toMatch(/^JOHN[A-Z0-9]{4}$/); // JOHN + 4 random chars
      expect(code.length).toBeGreaterThanOrEqual(8);
    });

    test('should reject non-existent user', async () => {
      // Arrange
      mockUserRepo.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(service.generateReferralCode(faker.string.uuid())).rejects.toThrow('User not found');
    });
  });

  describe('createReferral', () => {
    test('should create referral and send invitation email', async () => {
      // Arrange
      const referrerId = faker.string.uuid();
      const referralData = {
        referrerId,
        referredEmail: faker.internet.email(),
        referralCode: 'JOHN1234',
      };

      mockUserRepo.findByPk.mockResolvedValue({
        id: referrerId,
        firstName: 'John',
        lastName: 'Doe',
      });

      mockReferralRepo.findOne.mockResolvedValue(null); // No existing referral

      mockReferralRepo.create.mockResolvedValue({
        id: faker.string.uuid(),
        ...referralData,
        status: 'pending',
      });

      // Act
      const result = await service.createReferral(referralData);

      // Assert
      expect(result.status).toBe('pending');
      expect(mockEmailService.sendReferralInvite).toHaveBeenCalledWith({
        toEmail: referralData.referredEmail,
        referrerName: 'John Doe',
        referralCode: referralData.referralCode,
      });
    });

    test('should reject duplicate referral email', async () => {
      // Arrange
      mockUserRepo.findByPk.mockResolvedValue({ id: faker.string.uuid() });
      mockReferralRepo.findOne.mockResolvedValue({ id: faker.string.uuid() }); // Existing referral

      // Act & Assert
      await expect(
        service.createReferral({
          referrerId: faker.string.uuid(),
          referredEmail: faker.internet.email(),
          referralCode: 'TEST1234',
        })
      ).rejects.toThrow('Email already referred');
    });
  });

  describe('completeReferral', () => {
    test('should complete referral and award rewards to both users', async () => {
      // Arrange
      const referrerId = faker.string.uuid();
      const referredUserId = faker.string.uuid();
      const referredEmail = faker.internet.email();

      const mockReferral = {
        id: faker.string.uuid(),
        referrerId,
        referredEmail,
        status: 'pending',
        save: jest.fn(),
      };

      mockReferralRepo.findOne.mockResolvedValue(mockReferral);
      mockReferralRepo.count.mockResolvedValue(1); // First referral
      mockRewardRepo.create.mockImplementation(data => Promise.resolve({ id: faker.string.uuid(), ...data }));

      // Act
      const result = await service.completeReferral({ referredEmail, referredUserId });

      // Assert
      expect(result).not.toBeNull();
      expect(mockReferral.status).toBe('completed');
      expect(mockReferral.save).toHaveBeenCalled();

      // Verify referrer reward
      expect(result!.referrerReward.points).toBe(1000);
      expect(result!.referrerReward.cashValue).toBe(10);

      // Verify referred user reward
      expect(result!.referredReward.points).toBe(500);

      // Verify gamification points awarded
      expect(mockGamificationService.awardPoints).toHaveBeenCalledTimes(2);

      // Verify first referral achievement
      expect(mockGamificationService.unlockAchievement).toHaveBeenCalledWith(referrerId, 'first_referral');
    });

    test('should unlock milestone achievement at 5 referrals', async () => {
      // Arrange
      const referrerId = faker.string.uuid();
      mockReferralRepo.findOne.mockResolvedValue({
        id: faker.string.uuid(),
        referrerId,
        status: 'pending',
        save: jest.fn(),
      });

      mockReferralRepo.count.mockResolvedValue(5);
      mockRewardRepo.create.mockImplementation(data => Promise.resolve({ id: faker.string.uuid(), ...data }));

      // Act
      await service.completeReferral({
        referredEmail: faker.internet.email(),
        referredUserId: faker.string.uuid(),
      });

      // Assert
      expect(mockGamificationService.unlockAchievement).toHaveBeenCalledWith(referrerId, 'referral_master');
    });

    test('should unlock milestone achievement at 10 referrals', async () => {
      // Arrange
      const referrerId = faker.string.uuid();
      mockReferralRepo.findOne.mockResolvedValue({
        id: faker.string.uuid(),
        referrerId,
        status: 'pending',
        save: jest.fn(),
      });

      mockReferralRepo.count.mockResolvedValue(10);
      mockRewardRepo.create.mockImplementation(data => Promise.resolve({ id: faker.string.uuid(), ...data }));

      // Act
      await service.completeReferral({
        referredEmail: faker.internet.email(),
        referredUserId: faker.string.uuid(),
      });

      // Assert
      expect(mockGamificationService.unlockAchievement).toHaveBeenCalledWith(referrerId, 'referral_legend');
    });

    test('should return null for organic signup (no referral)', async () => {
      // Arrange
      mockReferralRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.completeReferral({
        referredEmail: faker.internet.email(),
        referredUserId: faker.string.uuid(),
      });

      // Assert
      expect(result).toBeNull();
      expect(mockRewardRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('getReferralAnalytics', () => {
    test('should calculate referral analytics correctly', async () => {
      // Arrange
      const userId = faker.string.uuid();

      mockReferralRepo.count.mockImplementation(({ where }) => {
        if (where.status === 'completed') return Promise.resolve(8);
        if (where.status === 'pending') return Promise.resolve(2);
        return Promise.resolve(10);
      });

      mockRewardRepo.sum.mockImplementation((field, { where }) => {
        if (field === 'points') return Promise.resolve(8000);
        if (field === 'cashValue') return Promise.resolve(80);
        return Promise.resolve(0);
      });

      // Act
      const analytics = await service.getReferralAnalytics(userId);

      // Assert
      expect(analytics.totalReferrals).toBe(8);
      expect(analytics.pendingReferrals).toBe(2);
      expect(analytics.totalRewards.points).toBe(8000);
      expect(analytics.totalRewards.cashValue).toBe(80);
      expect(analytics.conversionRate).toBe(80); // 8/10 * 100
    });
  });

  describe('detectFraud', () => {
    test('should flag suspicious rapid referrals', async () => {
      // Arrange
      const userId = faker.string.uuid();

      mockReferralRepo.count.mockResolvedValue(15); // More than 10 in 24 hours
      mockUserRepo.findByPk.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
      });
      mockReferralRepo.findAll.mockResolvedValue([]);

      // Act
      const result = await service.detectFraud(userId);

      // Assert
      expect(result.isFraudulent).toBe(true);
      expect(result.reasons).toContain('Suspicious referral rate (>10 in 24 hours)');
    });

    test('should flag suspicious email patterns', async () => {
      // Arrange
      const userId = faker.string.uuid();

      mockReferralRepo.count.mockResolvedValue(5); // Normal rate
      mockUserRepo.findByPk.mockResolvedValue({
        id: userId,
        email: 'john@example.com',
      });

      // Suspicious emails: same domain or similar prefix
      mockReferralRepo.findAll.mockResolvedValue([
        { referredEmail: 'john1@example.com' },
        { referredEmail: 'john2@example.com' },
        { referredEmail: 'john3@example.com' },
      ]);

      // Act
      const result = await service.detectFraud(userId);

      // Assert
      expect(result.isFraudulent).toBe(true);
      expect(result.reasons).toContain('Suspicious email patterns detected');
    });

    test('should pass clean referral activity', async () => {
      // Arrange
      const userId = faker.string.uuid();

      mockReferralRepo.count.mockResolvedValue(3); // Normal rate
      mockUserRepo.findByPk.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
      });

      // Legitimate different emails
      mockReferralRepo.findAll.mockResolvedValue([
        { referredEmail: 'friend1@gmail.com' },
        { referredEmail: 'friend2@yahoo.com' },
        { referredEmail: 'friend3@outlook.com' },
      ]);

      // Act
      const result = await service.detectFraud(userId);

      // Assert
      expect(result.isFraudulent).toBe(false);
      expect(result.reasons).toHaveLength(0);
    });
  });
});
