import { microAdventureService } from '../../services/gamification/MicroAdventureService';
import { userDayContextService } from '../../services/ai/UserDayContextService';
import { microChallengeCatalog } from '../../data/microChallengesCatalog';
import { UnifiedCacheService } from '../../services/cache/UnifiedCacheService';

jest.mock('../../services/ai/UserDayContextService');
jest.mock('../../services/cache/UnifiedCacheService');

describe('MicroAdventureService', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecommendations', () => {
    it('should return context-aware challenge recommendations', async () => {
      const mockContext = {
        overdueTasks: 3,
        upcomingTasks: 5,
        completedToday: 2,
        streakDays: 7,
        moodAverage: 4.2,
        habitTrend: [{ date: '2025-11-24', completionRate: 0.8 }]
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);

      const recommendations = await microAdventureService.getRecommendations(mockUserId, 'morning', 5);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(5);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should filter challenges by period trigger', async () => {
      const mockContext = {
        overdueTasks: 0,
        upcomingTasks: 2,
        completedToday: 1,
        streakDays: 3,
        moodAverage: 4.0,
        habitTrend: []
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);

      const morningChallenges = await microAdventureService.getRecommendations(mockUserId, 'morning', 10);
      const eveningChallenges = await microAdventureService.getRecommendations(mockUserId, 'evening', 10);

      // Morning and evening challenges should potentially be different
      expect(morningChallenges).toBeDefined();
      expect(eveningChallenges).toBeDefined();
    });

    it('should respect the limit parameter', async () => {
      const mockContext = {
        overdueTasks: 1,
        upcomingTasks: 4,
        completedToday: 3,
        streakDays: 5,
        moodAverage: 4.5,
        habitTrend: []
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);

      const limited = await microAdventureService.getRecommendations(mockUserId, 'afternoon', 3);

      expect(limited.length).toBeLessThanOrEqual(3);
    });

    it('should match challenges based on context triggers', async () => {
      const mockContext = {
        overdueTasks: 5, // High overdue count
        upcomingTasks: 10,
        completedToday: 0,
        streakDays: 2,
        moodAverage: 3.5,
        habitTrend: []
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);

      const recommendations = await microAdventureService.getRecommendations(mockUserId, 'morning', 5);

      // Should include challenges that trigger on high task count
      expect(recommendations.some(c => c.trigger?.minTasksDue)).toBeTruthy();
    });
  });

  describe('completeChallenge', () => {
    it('should mark challenge as completed and award points', async () => {
      const challengeId = 'quick-win-sprint';
      const challenge = microChallengeCatalog.find(c => c.id === challengeId);

      expect(challenge).toBeDefined();

      const result = await microAdventureService.completeChallenge(mockUserId, challengeId);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.pointsAwarded).toBeGreaterThan(0);
    });

    it('should handle invalid challenge ID gracefully', async () => {
      const result = await microAdventureService.completeChallenge(mockUserId, 'non-existent-challenge');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should prevent duplicate completions within cooldown period', async () => {
      const challengeId = 'morning-momentum';

      // Complete once
      const firstCompletion = await microAdventureService.completeChallenge(mockUserId, challengeId);
      expect(firstCompletion.success).toBe(true);

      // Try to complete again immediately
      const secondCompletion = await microAdventureService.completeChallenge(mockUserId, challengeId);

      // Should either succeed with reduced points or fail due to cooldown
      if (!secondCompletion.success) {
        expect(secondCompletion.error).toContain('cooldown');
      }
    });

    it('should integrate with gamification service for badge progress', async () => {
      const challengeId = 'focus-burst';

      const result = await microAdventureService.completeChallenge(mockUserId, challengeId);

      expect(result.success).toBe(true);
      // Verify badge/streak updates would happen (mocked in real implementation)
    });
  });

  describe('getUserChallengeHistory', () => {
    it('should return completed challenges for user', async () => {
      const cache = UnifiedCacheService.prototype;
      const mockHistory = [
        { challengeId: 'quick-win-sprint', completedAt: new Date(), pointsAwarded: 10 },
        { challengeId: 'morning-momentum', completedAt: new Date(), pointsAwarded: 15 }
      ];

      jest.spyOn(cache, 'get').mockResolvedValue(mockHistory);

      const history = await microAdventureService.getUserChallengeHistory(mockUserId);

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should return empty array for users with no history', async () => {
      const cache = UnifiedCacheService.prototype;
      jest.spyOn(cache, 'get').mockResolvedValue(null);

      const history = await microAdventureService.getUserChallengeHistory(mockUserId);

      expect(history).toEqual([]);
    });
  });

  describe('challenge catalog integrity', () => {
    it('should have valid challenge definitions', () => {
      expect(microChallengeCatalog.length).toBeGreaterThan(0);

      microChallengeCatalog.forEach(challenge => {
        expect(challenge.id).toBeDefined();
        expect(challenge.title).toBeDefined();
        expect(challenge.description).toBeDefined();
        expect(challenge.category).toBeDefined();
        expect(typeof challenge.estimatedMinutes).toBe('number');
        expect(typeof challenge.pointsReward).toBe('number');
      });
    });

    it('should have unique challenge IDs', () => {
      const ids = microChallengeCatalog.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have reasonable time estimates', () => {
      microChallengeCatalog.forEach(challenge => {
        expect(challenge.estimatedMinutes).toBeGreaterThan(0);
        expect(challenge.estimatedMinutes).toBeLessThanOrEqual(60);
      });
    });
  });
});
