/**
 * Mock Repositories
 *
 * Creates mock repository objects for testing services.
 * Each mock repository has standard CRUD methods.
 */

export class MockRepositories {
  /**
   * Create a mock user repository
   */
  static createUserRepository() {
    return {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      count: jest.fn(),
    };
  }

  /**
   * Create a mock goal repository
   */
  static createGoalRepository() {
    return {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      count: jest.fn(),
    };
  }

  /**
   * Create a mock subscription repository
   */
  static createSubscriptionRepository() {
    return {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      count: jest.fn(),
    };
  }

  /**
   * Create a mock transaction repository
   */
  static createTransactionRepository() {
    return {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      count: jest.fn(),
      sum: jest.fn(),
    };
  }

  /**
   * Create a mock coaching session repository
   */
  static createCoachingSessionRepository() {
    return {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      count: jest.fn(),
    };
  }

  /**
   * Create a mock user level repository (gamification)
   */
  static createUserLevelRepository() {
    return {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      increment: jest.fn(),
    };
  }
}

/**
 * Mock Service Factory
 *
 * Creates mock service objects with common methods
 */
export class MockServices {
  /**
   * Create a mock email service
   */
  static createEmailService() {
    return {
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
      sendWelcomeEmail: jest.fn().mockResolvedValue(true),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
      sendNotificationEmail: jest.fn().mockResolvedValue(true),
    };
  }

  /**
   * Create a mock gamification service
   */
  static createGamificationService() {
    return {
      initializeUser: jest.fn().mockResolvedValue({
        level: 1,
        totalPoints: 0,
        achievements: [],
      }),
      awardPoints: jest.fn().mockResolvedValue({ pointsAwarded: 50 }),
      unlockAchievement: jest.fn().mockResolvedValue({ unlocked: true }),
      checkLevelUp: jest.fn().mockResolvedValue({ leveledUp: false }),
    };
  }

  /**
   * Create a mock Stripe service
   */
  static createStripeService() {
    return {
      createCustomer: jest.fn().mockResolvedValue({ id: 'cus_test_123' }),
      createSubscription: jest.fn().mockResolvedValue({
        id: 'sub_test_123',
        status: 'active',
      }),
      cancelSubscription: jest.fn().mockResolvedValue({ canceled: true }),
      updateSubscription: jest.fn().mockResolvedValue({ updated: true }),
      createPaymentIntent: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
      }),
      attachPaymentMethod: jest.fn().mockResolvedValue({ attached: true }),
    };
  }

  /**
   * Create a mock AI service
   */
  static createAIService() {
    return {
      generateRecommendations: jest.fn().mockResolvedValue([
        { type: 'goal', suggestion: 'Break down into smaller milestones' },
      ]),
      analyzeProgress: jest.fn().mockResolvedValue({
        trend: 'positive',
        insights: ['Making good progress'],
      }),
      generateMilestones: jest.fn().mockResolvedValue([
        { title: 'Milestone 1', dueDate: new Date() },
      ]),
    };
  }

  /**
   * Create a mock Redis/cache service
   */
  static createCacheService() {
    return {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(0),
      expire: jest.fn().mockResolvedValue(1),
    };
  }

  /**
   * Create a mock authentication service
   */
  static createAuthService() {
    return {
      hashPassword: jest.fn().mockResolvedValue('hashed_password'),
      comparePassword: jest.fn().mockResolvedValue(true),
      generateToken: jest.fn().mockReturnValue('jwt_token_123'),
      verifyToken: jest.fn().mockReturnValue({ userId: 'user-123' }),
      generateVerificationToken: jest.fn().mockReturnValue('verification_token_123'),
    };
  }
}
