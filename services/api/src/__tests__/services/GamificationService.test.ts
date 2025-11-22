import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GamificationService } from '../../services/gamification/GamificationService';
import { analyticsService } from '../../services/analytics/AnalyticsService';
import emailService from '../../services/email/UnifiedEmailService';

// Mock Sequelize and QueryTypes
jest.mock('sequelize', () => ({
  QueryTypes: {
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    SELECT: 'SELECT',
    DELETE: 'DELETE',
  },
  Op: {
    and: Symbol('and'),
    or: Symbol('or'),
    eq: Symbol('eq'),
    ne: Symbol('ne'),
    gte: Symbol('gte'),
    gt: Symbol('gt'),
    lte: Symbol('lte'),
    lt: Symbol('lt'),
  },
}));

// Mock dependencies
jest.mock('../../models', () => ({
  sequelize: {
    query: jest.fn(),
  },
}));

// Import after mocking
import { sequelize } from '../../models';
import { QueryTypes } from 'sequelize';

jest.mock('../../services/analytics/AnalyticsService', () => ({
  analyticsService: {
    trackUserAction: jest.fn(),
  },
}));

jest.mock('../../services/email/UnifiedEmailService', () => ({
  default: {
    send: jest.fn(),
  },
}));

describe('GamificationService', () => {
  let gamificationService: GamificationService;
  const mockSequelize = sequelize as jest.Mocked<typeof sequelize>;
  const mockAnalytics = analyticsService as jest.Mocked<typeof analyticsService>;
  const mockEmail = emailService as jest.Mocked<typeof emailService>;

  const testUserId = 12345;
  const testEmail = 'test@upcoach.ai';

  beforeEach(() => {
    gamificationService = new GamificationService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initializeUser', () => {
    test('should initialize user gamification data with levels and streaks', async () => {
      mockSequelize.query.mockResolvedValue([[], 0] as unknown);

      await gamificationService.initializeUser(testUserId);

      // Verify user_levels insert
      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_levels'),
        expect.objectContaining({
          replacements: { userId: testUserId },
          type: QueryTypes.INSERT,
        })
      );

      // Verify user_streaks bulk insert (optimized version)
      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_streaks'),
        expect.objectContaining({
          replacements: { userId: testUserId },
          type: QueryTypes.INSERT,
        })
      );

      // Should have been called twice: once for levels, once for streaks
      expect(mockSequelize.query).toHaveBeenCalledTimes(2);
    });

    test('should handle initialization errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockSequelize.query.mockRejectedValue(error);

      // Should not throw, just log error
      await expect(gamificationService.initializeUser(testUserId)).resolves.toBeUndefined();
    });

    test('should support transactions', async () => {
      const mockTransaction = { id: 'mock-transaction' };
      mockSequelize.query.mockResolvedValue([[], 0] as unknown);

      await gamificationService.initializeUser(testUserId, mockTransaction as unknown);

      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          transaction: mockTransaction,
        })
      );
    });

    test('should use ON CONFLICT to prevent duplicate entries', async () => {
      mockSequelize.query.mockResolvedValue([[], 0] as unknown);

      await gamificationService.initializeUser(testUserId);

      const calls = (mockSequelize.query as jest.Mock).mock.calls;

      // Check user_levels has ON CONFLICT
      expect(calls[0][0]).toContain('ON CONFLICT');
      expect(calls[0][0]).toContain('DO NOTHING');

      // Check user_streaks has ON CONFLICT
      expect(calls[1][0]).toContain('ON CONFLICT');
      expect(calls[1][0]).toContain('DO NOTHING');
    });
  });

  describe('awardPoints', () => {
    test('should award points and update user level data', async () => {
      const points = 100;
      const reason = 'Completed daily goal';

      // Mock both UPDATE and SELECT queries
      mockSequelize.query
        .mockResolvedValueOnce([[], 1] as unknown) // UPDATE user_levels
        .mockResolvedValueOnce([[], 0] as unknown); // checkLevelUp SELECT

      await gamificationService.awardPoints(testUserId, points, reason);

      // Verify points update query
      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_levels'),
        expect.objectContaining({
          replacements: { userId: testUserId, points },
          type: QueryTypes.UPDATE,
        })
      );

      // Verify analytics tracking
      expect(mockAnalytics.trackUserAction).toHaveBeenCalledWith(
        testUserId,
        'Points Earned',
        { points, reason }
      );
    });

    test('should increment total_points, current_points, and level_progress', async () => {
      const points = 50;
      mockSequelize.query.mockResolvedValue([[], 1] as unknown);

      await gamificationService.awardPoints(testUserId, points, 'Test reward');

      const updateCall = (mockSequelize.query as jest.Mock).mock.calls.find(
        call => call[0].includes('UPDATE user_levels')
      );

      expect(updateCall[0]).toContain('total_points = total_points + :points');
      expect(updateCall[0]).toContain('current_points = current_points + :points');
      expect(updateCall[0]).toContain('level_progress = level_progress + :points');
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database update failed');
      mockSequelize.query.mockRejectedValue(error);

      await expect(
        gamificationService.awardPoints(testUserId, 100, 'Test')
      ).rejects.toThrow('Database update failed');
    });

    test('should check for level up after awarding points', async () => {
      mockSequelize.query
        .mockResolvedValueOnce([[], 1] as unknown) // UPDATE
        .mockResolvedValueOnce([[], 0] as unknown); // checkLevelUp

      await gamificationService.awardPoints(testUserId, 100, 'Test');

      // Verify checkLevelUp was called by checking for CTE query
      const calls = (mockSequelize.query as jest.Mock).mock.calls;
      const hasLevelUpCheck = calls.some(call =>
        call[0] && call[0].includes('WITH user_data AS')
      );

      expect(hasLevelUpCheck).toBe(true);
    });

    test('should support zero and negative points', async () => {
      mockSequelize.query.mockResolvedValue([[], 1] as unknown);

      await gamificationService.awardPoints(testUserId, 0, 'No points');
      await gamificationService.awardPoints(testUserId, -50, 'Penalty');

      expect(mockSequelize.query).toHaveBeenCalledTimes(4); // 2 updates + 2 level checks
    });
  });

  describe('Level Up System', () => {
    test('should execute level up CTE query correctly', async () => {
      mockSequelize.query
        .mockResolvedValueOnce([[], 1] as unknown) // UPDATE points
        .mockResolvedValueOnce([[], 0] as unknown); // checkLevelUp (no level up)

      await gamificationService.awardPoints(testUserId, 1000, 'Big achievement');

      // Verify CTE query for level up check
      const calls = (mockSequelize.query as jest.Mock).mock.calls;
      const levelUpCall = calls.find(call =>
        call[0] && call[0].includes('WITH user_data AS')
      );

      expect(levelUpCall).toBeDefined();
      expect(levelUpCall[0]).toContain('UPDATE user_levels');
      expect(levelUpCall[0]).toContain('FROM user_data');
    });
  });

  describe('Point Calculation Edge Cases', () => {
    test('should handle very large point values', async () => {
      const largePoints = 999999999;
      mockSequelize.query
        .mockResolvedValueOnce([[], 1] as unknown)
        .mockResolvedValueOnce([[], 0] as unknown);

      await gamificationService.awardPoints(testUserId, largePoints, 'Massive achievement');

      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          replacements: expect.objectContaining({ points: largePoints }),
        })
      );
    });

    test('should handle decimal point values', async () => {
      const decimalPoints = 50.7;
      mockSequelize.query
        .mockResolvedValueOnce([[], 1] as unknown)
        .mockResolvedValueOnce([[], 0] as unknown);

      await gamificationService.awardPoints(testUserId, decimalPoints, 'Partial achievement');

      // System should handle decimals
      expect(mockAnalytics.trackUserAction).toHaveBeenCalled();
    });

    test('should track different reward reasons', async () => {
      mockSequelize.query.mockResolvedValue([[], 1] as unknown);

      const reasons = [
        'Daily login bonus',
        'Goal completion',
      ];

      for (const reason of reasons) {
        await gamificationService.awardPoints(testUserId, 10, reason);
      }

      // Verify analytics was called for each reason
      expect(mockAnalytics.trackUserAction).toHaveBeenCalled();
    });
  });

  describe('Transaction Support', () => {
    test('should pass transaction to all database operations', async () => {
      const mockTransaction = { id: 'test-transaction' };
      mockSequelize.query.mockResolvedValue([[], 1] as unknown);

      await gamificationService.awardPoints(
        testUserId,
        100,
        'Test',
        mockTransaction as unknown
      );

      // All query calls should include the transaction
      const calls = (mockSequelize.query as jest.Mock).mock.calls;
      calls.forEach(call => {
        expect(call[1]).toHaveProperty('transaction', mockTransaction);
      });
    });
  });

  describe('Performance Optimizations', () => {
    test('should use bulk insert for streaks initialization', async () => {
      mockSequelize.query.mockResolvedValue([[], 0] as unknown);

      await gamificationService.initializeUser(testUserId);

      // Find the streaks insert query
      const streaksCall = (mockSequelize.query as jest.Mock).mock.calls.find(
        call => call[0].includes('user_streaks')
      );

      // Should contain all three streak types in VALUES clause (optimized bulk insert)
      expect(streaksCall[0]).toContain('daily_login');
      expect(streaksCall[0]).toContain('weekly_goal');
      expect(streaksCall[0]).toContain('mood_tracking');

      // Should use multiple VALUES in single query (3 values for 3 streak types)
      const valuesCount = (streaksCall[0].match(/VALUES/gi) || []).length;
      expect(valuesCount).toBe(1); // Single VALUES keyword = bulk insert
    });

    test('should minimize database round trips', async () => {
      mockSequelize.query.mockResolvedValue([[], 0] as unknown);

      await gamificationService.initializeUser(testUserId);

      // Should only make 2 queries: 1 for levels, 1 for all streaks (not 4 queries)
      expect(mockSequelize.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery', () => {
    test('should handle initialization errors gracefully', async () => {
      mockSequelize.query.mockRejectedValue(new Error('Connection timeout'));

      // Should not throw
      await expect(
        gamificationService.initializeUser(testUserId)
      ).resolves.toBeUndefined();
    });

    test('should propagate errors in awardPoints for transaction rollback', async () => {
      mockSequelize.query.mockRejectedValue(new Error('Constraint violation'));

      await expect(
        gamificationService.awardPoints(testUserId, 100, 'Test')
      ).rejects.toThrow();
    });
  });
});
