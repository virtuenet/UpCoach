import { companionChatService } from '../../services/ai/CompanionChatService';
import { userDayContextService } from '../../services/ai/UserDayContextService';
import { aiService } from '../../services/ai/AIService';
import { UnifiedCacheService } from '../../services/cache/UnifiedCacheService';

jest.mock('../../services/ai/UserDayContextService');
jest.mock('../../services/ai/AIService');
jest.mock('../../services/cache/UnifiedCacheService');

describe('CompanionChatService', () => {
  const mockUserId = 'test-user-123';
  const mockMessage = 'How can I improve my productivity?';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should generate AI response with user context', async () => {
      const mockContext = {
        overdueTasks: 2,
        upcomingTasks: 5,
        completedToday: 3,
        streakDays: 7,
        moodAverage: 4.2,
        habitTrend: []
      };

      const mockHistory = [
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' }
      ];

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);
      (aiService.generateResponse as jest.Mock).mockResolvedValue({
        content: 'Focus on your 2 overdue tasks first, then tackle the 5 upcoming items.'
      });

      const cache = UnifiedCacheService.prototype;
      jest.spyOn(cache, 'get').mockResolvedValue(mockHistory);

      const result = await companionChatService.sendMessage(mockUserId, mockMessage);

      expect(result).toBeDefined();
      expect(result.user.content).toBe(mockMessage);
      expect(result.assistant.content).toContain('overdue');
      expect(aiService.generateResponse).toHaveBeenCalled();
    });

    it('should maintain conversation history across messages', async () => {
      const mockContext = {
        overdueTasks: 0,
        upcomingTasks: 3,
        completedToday: 5,
        streakDays: 10,
        moodAverage: 4.5,
        habitTrend: []
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);
      (aiService.generateResponse as jest.Mock).mockResolvedValue({
        content: 'Great progress!'
      });

      const cache = UnifiedCacheService.prototype;
      const setSpy = jest.spyOn(cache, 'set');

      await companionChatService.sendMessage(mockUserId, 'I finished all my tasks!');

      expect(setSpy).toHaveBeenCalled();
      const savedHistory = setSpy.mock.calls[0][1];
      expect(savedHistory.length).toBeGreaterThan(0);
    });

    it('should handle AI service failures gracefully', async () => {
      const mockContext = {
        overdueTasks: 1,
        upcomingTasks: 2,
        completedToday: 1,
        streakDays: 5,
        moodAverage: 4.0,
        habitTrend: []
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);
      (aiService.generateResponse as jest.Mock).mockRejectedValue(new Error('AI unavailable'));

      await expect(companionChatService.sendMessage(mockUserId, mockMessage))
        .rejects.toThrow('AI unavailable');
    });

    it('should limit conversation history to recent messages', async () => {
      const longHistory = Array.from({ length: 50 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`
      }));

      const mockContext = {
        overdueTasks: 0,
        upcomingTasks: 1,
        completedToday: 2,
        streakDays: 3,
        moodAverage: 4.0,
        habitTrend: []
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);
      (aiService.generateResponse as jest.Mock).mockResolvedValue({
        content: 'Response'
      });

      const cache = UnifiedCacheService.prototype;
      jest.spyOn(cache, 'get').mockResolvedValue(longHistory);
      const setSpy = jest.spyOn(cache, 'set');

      await companionChatService.sendMessage(mockUserId, 'New message');

      const savedHistory = setSpy.mock.calls[0][1];
      expect(savedHistory.length).toBeLessThanOrEqual(20); // Reasonable history limit
    });
  });

  describe('getHistory', () => {
    it('should return conversation history for user', async () => {
      const mockHistory = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
        { role: 'assistant', content: 'I\'m doing well!' }
      ];

      const cache = UnifiedCacheService.prototype;
      jest.spyOn(cache, 'get').mockResolvedValue(mockHistory);

      const history = await companionChatService.getHistory(mockUserId);

      expect(history).toEqual(mockHistory);
      expect(history.length).toBe(4);
    });

    it('should return empty array for new users', async () => {
      const cache = UnifiedCacheService.prototype;
      jest.spyOn(cache, 'get').mockResolvedValue(null);

      const history = await companionChatService.getHistory(mockUserId);

      expect(history).toEqual([]);
    });
  });

  describe('resetHistory', () => {
    it('should clear conversation history', async () => {
      const cache = UnifiedCacheService.prototype;
      const delSpy = jest.spyOn(cache, 'del');

      await companionChatService.resetHistory(mockUserId);

      expect(delSpy).toHaveBeenCalled();
    });
  });

  describe('proactive outreach', () => {
    it('should generate context-aware opening message', async () => {
      const mockContext = {
        overdueTasks: 5,
        upcomingTasks: 10,
        completedToday: 0,
        streakDays: 15,
        moodAverage: 3.2,
        habitTrend: [
          { date: '2025-11-24', completionRate: 0.3 },
          { date: '2025-11-23', completionRate: 0.4 }
        ]
      };

      (userDayContextService.build as jest.Mock).mockResolvedValue(mockContext);
      (aiService.generateResponse as jest.Mock).mockResolvedValue({
        content: 'I noticed you have 5 overdue tasks. Would you like help prioritizing?'
      });

      const opening = await companionChatService.generateProactiveMessage(mockUserId);

      expect(opening).toBeDefined();
      expect(opening.content).toContain('task');
    });
  });
});
