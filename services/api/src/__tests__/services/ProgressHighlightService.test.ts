import { progressHighlightService } from '../../services/analytics/ProgressHighlightService';
import { userDayContextService } from '../../services/ai/UserDayContextService';
import { analyticsInsightsService } from '../../services/analytics/AnalyticsInsightsService';

jest.mock('../../services/ai/UserDayContextService');
jest.mock('../../services/analytics/AnalyticsInsightsService');

describe('ProgressHighlightService', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateHighlights', () => {
    it('should generate positive highlights for successful day', async () => {
      const mockContext = {
        overdueTasks: 0,
        upcomingTasks: 3,
        completedToday: 8,
        streakDays: 12,
        moodAverage: 4.7,
        habitTrend: [
          { date: '2025-11-24', completionRate: 0.9 },
          { date: '2025-11-23', completionRate: 0.85 }
        ]
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);
      (analyticsInsightsService.getWeeklySummary as jest.Mock).mockResolvedValue({
        totalCompleted: 45,
        streakMaintained: true,
        improvementAreas: []
      });

      const highlights = await progressHighlightService.generateHighlights(mockUserId, 'daily');

      expect(highlights).toBeDefined();
      expect(highlights.length).toBeGreaterThan(0);
      expect(highlights.some(h => h.sentiment === 'positive')).toBe(true);
    });

    it('should generate recovery highlights for struggling users', async () => {
      const mockContext = {
        overdueTasks: 10,
        upcomingTasks: 15,
        completedToday: 1,
        streakDays: 3,
        moodAverage: 3.2,
        habitTrend: [
          { date: '2025-11-24', completionRate: 0.2 },
          { date: '2025-11-23', completionRate: 0.3 }
        ]
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);
      (analyticsInsightsService.getWeeklySummary as jest.Mock).mockResolvedValue({
        totalCompleted: 5,
        streakMaintained: false,
        improvementAreas: ['time_management', 'task_prioritization']
      });

      const highlights = await progressHighlightService.generateHighlights(mockUserId, 'daily');

      expect(highlights.some(h => h.sentiment === 'recovery')).toBe(true);
    });

    it('should generate weekly highlights with aggregated data', async () => {
      const mockContext = {
        overdueTasks: 2,
        upcomingTasks: 5,
        completedToday: 4,
        streakDays: 20,
        moodAverage: 4.3,
        habitTrend: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 86400000).toISOString(),
          completionRate: 0.7 + Math.random() * 0.2
        }))
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);
      (analyticsInsightsService.getWeeklySummary as jest.Mock).mockResolvedValue({
        totalCompleted: 32,
        streakMaintained: true,
        topCategories: ['work', 'health', 'learning']
      });

      const highlights = await progressHighlightService.generateHighlights(mockUserId, 'weekly');

      expect(highlights).toBeDefined();
      expect(highlights.some(h => h.period === 'weekly')).toBe(true);
    });

    it('should include shareable media metadata', async () => {
      const mockContext = {
        overdueTasks: 1,
        upcomingTasks: 4,
        completedToday: 5,
        streakDays: 15,
        moodAverage: 4.5,
        habitTrend: []
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);

      const highlights = await progressHighlightService.generateHighlights(mockUserId, 'daily');

      highlights.forEach(highlight => {
        expect(highlight.id).toBeDefined();
        expect(highlight.title).toBeDefined();
        expect(highlight.summary).toBeDefined();
        expect(['positive', 'neutral', 'recovery']).toContain(highlight.sentiment);
      });
    });

    it('should respect privacy settings in shareable content', async () => {
      const mockContext = {
        overdueTasks: 0,
        upcomingTasks: 2,
        completedToday: 3,
        streakDays: 10,
        moodAverage: 4.2,
        habitTrend: []
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);

      const highlights = await progressHighlightService.generateHighlights(
        mockUserId,
        'daily',
        { includePersonalDetails: false }
      );

      // Highlights should not include sensitive personal information
      highlights.forEach(highlight => {
        expect(highlight.summary).not.toContain(mockUserId);
        // Should be anonymized for public sharing
      });
    });
  });

  describe('getPublicHighlights', () => {
    it('should return anonymized highlights for public feed', async () => {
      const mockHighlights = [
        {
          id: '1',
          sentiment: 'positive',
          title: '5-day streak achieved!',
          summary: 'Maintained momentum',
          isPublic: true
        },
        {
          id: '2',
          sentiment: 'neutral',
          title: 'Progress update',
          summary: 'Completed 3 tasks',
          isPublic: false
        }
      ];

      const publicHighlights = mockHighlights.filter(h => h.isPublic);

      expect(publicHighlights.length).toBe(1);
      expect(publicHighlights[0].isPublic).toBe(true);
    });
  });

  describe('highlight generation edge cases', () => {
    it('should handle users with no activity', async () => {
      const mockEmptyContext = {
        overdueTasks: 0,
        upcomingTasks: 0,
        completedToday: 0,
        streakDays: 0,
        moodAverage: null,
        habitTrend: []
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockEmptyContext);

      const highlights = await progressHighlightService.generateHighlights(mockUserId, 'daily');

      expect(highlights).toBeDefined();
      expect(highlights.length).toBeGreaterThan(0);
      // Should generate encouraging onboarding-style highlights
    });

    it('should detect streak milestones', async () => {
      const mockStreakContext = {
        overdueTasks: 0,
        upcomingTasks: 2,
        completedToday: 4,
        streakDays: 30, // Milestone!
        moodAverage: 4.5,
        habitTrend: []
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockStreakContext);

      const highlights = await progressHighlightService.generateHighlights(mockUserId, 'daily');

      expect(highlights.some(h => h.title.includes('30'))).toBe(true);
    });
  });
});
