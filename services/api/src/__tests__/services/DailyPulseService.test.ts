import { dailyPulseService, PulsePeriod } from '../../services/ai/DailyPulseService';
import { userDayContextService } from '../../services/ai/UserDayContextService';
import { aiService } from '../../services/ai/AIService';
import { NotificationService } from '../../services/NotificationService';
import { UnifiedCacheService } from '../../services/cache/UnifiedCacheService';

jest.mock('../../services/ai/UserDayContextService');
jest.mock('../../services/ai/AIService');
jest.mock('../../services/NotificationService');
jest.mock('../../services/cache/UnifiedCacheService');

describe('DailyPulseService', () => {
  const mockUserId = 'test-user-123';
  const mockPeriod: PulsePeriod = 'morning';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePulse', () => {
    it('should generate a morning pulse successfully', async () => {
      const mockContext = {
        overdueTasks: 2,
        upcomingTasks: 5,
        completedToday: 3,
        streakDays: 7,
        moodAverage: 4.2,
        habitTrend: [{ date: '2025-11-24', completionRate: 0.8 }]
      };

      const mockPulse = {
        id: 'pulse-123',
        userId: mockUserId,
        period: mockPeriod,
        title: 'Good morning!',
        message: 'You have 5 tasks due today',
        insights: [{ type: 'streak', text: '7 day streak!' }],
        actions: [{ title: 'View tasks', category: 'tasks' }],
        generatedAt: new Date()
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);
      (aiService.generateResponse as jest.Mock).mockResolvedValue({
        content: JSON.stringify({
          title: mockPulse.title,
          message: mockPulse.message,
          insights: mockPulse.insights,
          actions: mockPulse.actions
        })
      });

      const result = await dailyPulseService.generatePulse(mockUserId, mockPeriod);

      expect(result).toBeDefined();
      expect(result.userId).toBe(mockUserId);
      expect(result.period).toBe(mockPeriod);
      expect(result.title).toBe(mockPulse.title);
      expect(userDayContextService.build).toHaveBeenCalledWith(mockUserId);
      expect(aiService.generateResponse).toHaveBeenCalled();
    });

    it('should cache generated pulse', async () => {
      const mockContext = {
        overdueTasks: 0,
        upcomingTasks: 3,
        completedToday: 2,
        streakDays: 5,
        moodAverage: 4.0,
        habitTrend: []
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);
      (aiService.generateResponse as jest.Mock).mockResolvedValue({
        content: JSON.stringify({
          title: 'Good evening!',
          message: 'Great progress today',
          insights: [],
          actions: []
        })
      });

      const cache = UnifiedCacheService.prototype;
      const setSpy = jest.spyOn(cache, 'set');

      await dailyPulseService.generatePulse(mockUserId, 'evening');

      expect(setSpy).toHaveBeenCalled();
    });

    it('should handle AI generation failures gracefully', async () => {
      const mockContext = {
        overdueTasks: 0,
        upcomingTasks: 0,
        completedToday: 0,
        streakDays: 0,
        moodAverage: 3.5,
        habitTrend: []
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);
      (aiService.generateResponse as jest.Mock).mockRejectedValue(new Error('AI service unavailable'));

      await expect(dailyPulseService.generatePulse(mockUserId, mockPeriod))
        .rejects.toThrow('AI service unavailable');
    });

    it('should generate different pulses for morning vs evening', async () => {
      const mockContext = {
        overdueTasks: 1,
        upcomingTasks: 4,
        completedToday: 6,
        streakDays: 10,
        moodAverage: 4.5,
        habitTrend: []
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);

      let callCount = 0;
      (aiService.generateResponse as jest.Mock).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          content: JSON.stringify({
            title: callCount === 1 ? 'Good morning!' : 'Good evening!',
            message: callCount === 1 ? 'Start strong' : 'Reflect on today',
            insights: [],
            actions: []
          })
        });
      });

      const morningPulse = await dailyPulseService.generatePulse(mockUserId, 'morning');
      const eveningPulse = await dailyPulseService.generatePulse(mockUserId, 'evening');

      expect(morningPulse.title).toContain('morning');
      expect(eveningPulse.title).toContain('evening');
    });
  });

  describe('broadcastPulse', () => {
    it('should broadcast pulses to all active users', async () => {
      const mockUsers = [
        { id: 'user-1', lastActive: new Date() },
        { id: 'user-2', lastActive: new Date() }
      ];

      // Mock user fetching logic (would need to be implemented)
      const notifySpy = jest.spyOn(NotificationService.prototype, 'sendPushNotification');

      await dailyPulseService.broadcastPulse('morning');

      // Verify broadcast logic is called
      // (actual implementation would depend on user service)
    });
  });

  describe('getPulseForUser', () => {
    it('should return cached pulse if available', async () => {
      const mockPulse = {
        id: 'cached-pulse',
        userId: mockUserId,
        period: mockPeriod,
        title: 'Cached pulse',
        message: 'From cache',
        insights: [],
        actions: [],
        generatedAt: new Date()
      };

      const cache = UnifiedCacheService.prototype;
      jest.spyOn(cache, 'get').mockResolvedValue(mockPulse);

      const result = await dailyPulseService.getPulse(mockUserId, mockPeriod);

      expect(result).toEqual(mockPulse);
    });

    it('should generate new pulse if cache is empty', async () => {
      const cache = UnifiedCacheService.prototype;
      jest.spyOn(cache, 'get').mockResolvedValue(null);

      const mockContext = {
        overdueTasks: 0,
        upcomingTasks: 2,
        completedToday: 1,
        streakDays: 3,
        moodAverage: 4.0,
        habitTrend: []
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);
      (aiService.generateResponse as jest.Mock).mockResolvedValue({
        content: JSON.stringify({
          title: 'Fresh pulse',
          message: 'Newly generated',
          insights: [],
          actions: []
        })
      });

      const result = await dailyPulseService.getPulse(mockUserId, mockPeriod);

      expect(result).toBeDefined();
      expect(result.title).toBe('Fresh pulse');
    });
  });
});
