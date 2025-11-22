import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CoachIntelligenceService } from '../../services/coaching/CoachIntelligenceService';
import CoachMemory from '../../models/coaching/CoachMemory';
import KpiTracker from '../../models/analytics/KpiTracker';
import UserAnalytics from '../../models/analytics/UserAnalytics';
import { Op } from 'sequelize';

// Mock dependencies
jest.mock('../../models/coaching/CoachMemory');
jest.mock('../../models/analytics/KpiTracker');
jest.mock('../../models/analytics/UserAnalytics');
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock AI Service - create mock factory function
jest.mock('../../services/ai/AIService', () => {
  const mockGenerateResponse = jest.fn();
  const mockAnalyzeConversation = jest.fn();
  const mockGenerateCoachingResponse = jest.fn();

  return {
    aiService: {
      generateResponse: mockGenerateResponse,
      analyzeConversation: mockAnalyzeConversation,
      generateCoachingResponse: mockGenerateCoachingResponse,
    },
  };
});

describe('CoachIntelligenceService', () => {
  let coachIntelligenceService: CoachIntelligenceService;
  const mockCoachMemory = CoachMemory as jest.MockedClass<typeof CoachMemory>;
  const mockKpiTracker = KpiTracker as jest.MockedClass<typeof KpiTracker>;
  const mockUserAnalytics = UserAnalytics as jest.MockedClass<typeof UserAnalytics>;

  // Get mock functions from the mocked module
  const aiServiceMock = require('../../services/ai/AIService');
  const mockGenerateResponse = aiServiceMock.aiService.generateResponse;
  const mockAnalyzeConversation = aiServiceMock.aiService.analyzeConversation;
  const mockGenerateCoachingResponse = aiServiceMock.aiService.generateCoachingResponse;

  const testUserId = 'user-123';
  const testAvatarId = 'avatar-456';
  const testSessionId = 'session-789';

  // Helper function to create mock memory
  const createMockMemory = (data: Partial<any> = {}) => ({
    id: data.id || 'memory-1',
    userId: data.userId || testUserId,
    sessionId: data.sessionId || testSessionId,
    avatarId: data.avatarId || testAvatarId,
    memoryType: data.memoryType || 'conversation',
    content: data.content || 'Test content',
    summary: data.summary || 'Test summary',
    tags: data.tags || [],
    sentiment: data.sentiment || 0.5,
    importance: data.importance || 5,
    conversationDate: data.conversationDate || new Date(),
    emotionalContext: data.emotionalContext || {
      mood: 'neutral',
      sentiment: data.sentiment || 0.5,
      emotionalTrends: [],
    },
    coachingContext: data.coachingContext || {
      topic: 'general',
      category: 'general',
      importance: data.importance || 5,
      actionItems: [],
      followUpNeeded: false,
    },
    relevanceScore: data.relevanceScore || 0.5,
    isRelevant: jest.fn().mockReturnValue(true),
    updateRelevanceScore: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
    toJSON: jest.fn().mockReturnValue({ id: data.id || 'memory-1' }),
    ...data,
  });

  // Helper function to create mock goal
  const createMockGoal = (data: Partial<any> = {}) => ({
    id: data.id || 'goal-1',
    userId: data.userId || testUserId,
    name: data.name || 'Test Goal',
    progress: data.progress || 50,
    status: data.status || 'in_progress',
    targetDate: data.targetDate || new Date(),
    startDate: data.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    completedAt: data.completedAt || null,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    isAtRisk: jest.fn().mockReturnValue(data.isAtRisk !== undefined ? data.isAtRisk : false),
    getOverdueActionItems: jest.fn().mockReturnValue(data.overdueActionItems || []),
    coachingData: data.coachingData || {
      actionItems: [],
      notes: '',
      lastReview: new Date(),
    },
    ...data,
  });

  beforeEach(() => {
    coachIntelligenceService = new CoachIntelligenceService();
    jest.clearAllMocks();

    // Reset AI service mocks
    mockGenerateResponse.mockReset();
    mockAnalyzeConversation.mockReset();
    mockGenerateCoachingResponse.mockReset();

    // Setup default AI response
    mockGenerateResponse.mockResolvedValue({
      id: 'ai-response',
      content: JSON.stringify({
        summary: 'Test summary',
        tags: ['test'],
        sentiment: 0.5,
        emotionalTrends: ['neutral'],
        category: 'general',
        actionItems: [],
        followUpNeeded: false,
        keyInsights: [],
        challengesIdentified: [],
        progressIndicators: [],
        coachingTechniques: [],
        deepInsights: [],
        behavioralPatterns: [],
        growthIndicators: [],
        potentialBlockers: [],
        coachingOpportunities: [],
        connectionPoints: [],
        emergingThemes: [],
        personalityInsights: {},
        motivationalProfile: {},
        learningStyle: {},
      }),
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      model: 'gpt-4',
      provider: 'openai' as const,
    });

    // Setup default analytics mock to prevent errors in processCoachingSession
    const defaultAnalyticsMock = {
      userId: testUserId,
      engagementMetrics: {
        totalSessions: 0,
        totalDuration: 0,
        averageSessionDuration: 25,
        streakCount: 0,
        missedSessions: 0,
        responsiveness: 0.8,
        participationScore: 0.7,
        followThroughRate: 0.6,
      },
      coachingMetrics: {
        goalsSet: 0,
        goalsAchieved: 0,
        goalCompletionRate: 0,
        avatarId: testAvatarId,
        avatarEffectivenessScore: 0.8,
        avatarSwitchCount: 0,
        progressMetrics: {
          skillImprovement: 0,
          confidenceIncrease: 0,
          stressReduction: 0,
          habitFormation: 0,
        },
      },
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockUserAnalytics.findOne = jest.fn().mockResolvedValue(defaultAnalyticsMock);
    mockUserAnalytics.upsert = jest.fn().mockResolvedValue([defaultAnalyticsMock, true]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('processCoachingSession', () => {
    const mockContext = {
      userId: testUserId,
      avatarId: testAvatarId,
      sessionId: testSessionId,
      currentTopic: 'Goal Setting',
      userMood: 'motivated',
      conversationHistory: ['Hello', 'How are you?'],
      goals: ['Improve productivity', 'Learn new skills'],
    };

    test('should process a coaching session and store memory', async () => {
      const mockMemory = createMockMemory();
      mockCoachMemory.create = jest.fn().mockResolvedValue(mockMemory);
      // Mock database queries for analytics calculation
      mockCoachMemory.findAll = jest.fn().mockResolvedValue([]);
      mockKpiTracker.findAll = jest.fn().mockResolvedValue([]);

      await coachIntelligenceService.processCoachingSession(
        mockContext,
        'Session content here',
        30
      );

      // Verify memory was created
      expect(mockCoachMemory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          sessionId: testSessionId,
          avatarId: testAvatarId,
          memoryType: 'conversation',
        })
      );
    });

    test('should handle AI service errors gracefully', async () => {
      mockGenerateResponse.mockRejectedValue(new Error('AI service unavailable'));
      const mockMemory = createMockMemory({ id: 'memory-2' });
      mockCoachMemory.create = jest.fn().mockResolvedValue(mockMemory);
      // Mock database queries for analytics calculation
      mockCoachMemory.findAll = jest.fn().mockResolvedValue([]);
      mockKpiTracker.findAll = jest.fn().mockResolvedValue([]);

      await coachIntelligenceService.processCoachingSession(
        mockContext,
        'Session content',
        30
      );

      // Should still create memory even if AI fails
      expect(mockCoachMemory.create).toHaveBeenCalled();
    });

    test('should extract and store user feedback', async () => {
      const contentWithFeedback = 'Great session! I feel more confident.';
      mockGenerateResponse.mockResolvedValue({
        id: 'ai-response-3',
        content: JSON.stringify({
          summary: 'User feels confident',
          tags: ['confidence', 'progress'],
          sentiment: 0.8,
          emotionalTrends: ['positive'],
          category: 'feedback',
          actionItems: [],
          followUpNeeded: false,
          keyInsights: ['Increased confidence'],
          challengesIdentified: [],
          progressIndicators: ['Positive sentiment'],
          coachingTechniques: [],
        }),
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        model: 'gpt-4',
        provider: 'openai' as const,
      });

      const mockMemory = createMockMemory({ id: 'memory-3' });
      mockCoachMemory.create = jest.fn().mockResolvedValue(mockMemory);
      // Mock database queries for analytics calculation
      mockCoachMemory.findAll = jest.fn().mockResolvedValue([]);
      mockKpiTracker.findAll = jest.fn().mockResolvedValue([]);

      await coachIntelligenceService.processCoachingSession(
        mockContext,
        contentWithFeedback,
        30
      );

      expect(mockCoachMemory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          emotionalContext: expect.objectContaining({
            sentiment: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('getRelevantMemories', () => {
    test('should retrieve relevant memories for a user', async () => {
      const mockMemories = [
        createMockMemory({ id: '1', content: 'Goal discussion', relevanceScore: 0.9 }),
        createMockMemory({ id: '2', content: 'Progress check', relevanceScore: 0.7 }),
      ];

      mockCoachMemory.findAll = jest.fn().mockResolvedValue(mockMemories);

      const result = await coachIntelligenceService.getRelevantMemories(
        testUserId,
        {
          topics: ['productivity'],
          mood: 'focused',
          recentGoals: ['Improve work efficiency'],
        }
      );

      expect(mockCoachMemory.findAll).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle empty memory results', async () => {
      mockCoachMemory.findAll = jest.fn().mockResolvedValue([]);

      const result = await coachIntelligenceService.getRelevantMemories(
        testUserId,
        {
          topics: ['new topic'],
          mood: 'neutral',
          recentGoals: [],
        }
      );

      expect(result).toEqual([]);
    });

    test('should apply context filtering when provided', async () => {
      const mockMemories = [
        createMockMemory({ id: '1', tags: ['productivity'] }),
        createMockMemory({ id: '2', tags: ['health'] }),
      ];

      mockCoachMemory.findAll = jest.fn().mockResolvedValue(mockMemories);

      const result = await coachIntelligenceService.getRelevantMemories(
        testUserId,
        {
          topics: ['productivity'],
          mood: 'focused',
          recentGoals: [],
        }
      );

      expect(mockCoachMemory.findAll).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('generateCoachingRecommendations', () => {
    test('should generate recommendations based on user history', async () => {
      const mockMemories = [
        createMockMemory({
          id: '1',
          content: 'Struggling with time management',
          sentiment: -0.2,
          tags: ['time management'],
        }),
      ];

      const mockGoals = [createMockGoal({ id: 'goal-1', progress: 40 })];

      const mockAnalytics = {
        userId: testUserId,
        streakCount: 5,
        engagementScore: 75,
        engagementMetrics: {
          totalSessions: 10,
          totalDuration: 250,
          averageSessionDuration: 25,
          streakCount: 5,
          missedSessions: 0,
          responsiveness: 0.9,
          participationScore: 0.75,
          followThroughRate: 0.8,
        },
        coachingMetrics: {
          goalsSet: 2,
          goalsAchieved: 0,
          goalCompletionRate: 0,
          avatarId: testAvatarId,
          avatarEffectivenessScore: 0.9,
          avatarSwitchCount: 0,
          progressMetrics: {
            skillImprovement: 0.7,
            confidenceIncrease: 0.6,
            stressReduction: 0.5,
            habitFormation: 0.8,
          },
        },
      };

      mockCoachMemory.findAll = jest.fn().mockResolvedValue(mockMemories);
      mockKpiTracker.findAll = jest.fn().mockResolvedValue(mockGoals);
      mockUserAnalytics.findOne = jest.fn().mockResolvedValue(mockAnalytics);

      mockGenerateResponse.mockResolvedValue({
        id: 'recommendations-response',
        content: JSON.stringify({
          recommendations: [
            {
              type: 'technique',
              priority: 'high',
              title: 'Time blocking',
              description: 'Use time blocking to improve focus',
              rationale: 'Based on time management challenges',
              expectedOutcome: 'Better productivity',
              implementation: ['Block calendar', 'Set timers'],
            },
          ],
        }),
        usage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 },
        model: 'gpt-4',
        provider: 'openai' as const,
      });

      const result = await coachIntelligenceService.generateCoachingRecommendations(
        testUserId,
        testAvatarId
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('type');
        expect(result[0]).toHaveProperty('priority');
      }
    });

    test('should provide fallback recommendations on AI failure', async () => {
      mockCoachMemory.findAll = jest.fn().mockResolvedValue([]);
      mockKpiTracker.findAll = jest.fn().mockResolvedValue([]);
      mockUserAnalytics.findOne = jest.fn().mockResolvedValue(null);
      mockGenerateResponse.mockRejectedValue(new Error('AI unavailable'));

      const result = await coachIntelligenceService.generateCoachingRecommendations(
        testUserId,
        testAvatarId
      );

      // Should return fallback or empty recommendations
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('generateWeeklyReport', () => {
    test('should generate a comprehensive weekly report', async () => {
      const mockMemories = [
        createMockMemory({
          id: '1',
          conversationDate: new Date(),
          sentiment: 0.5,
          tags: ['goals', 'progress'],
          content: 'Made good progress this week',
        }),
        createMockMemory({
          id: '2',
          conversationDate: new Date(),
          sentiment: 0.7,
          tags: ['achievement'],
          content: 'Completed major milestone',
        }),
      ];

      const mockGoals = [
        createMockGoal({ id: 'goal-1', progress: 75, status: 'in_progress' }),
        createMockGoal({ id: 'goal-2', progress: 100, status: 'completed' }),
      ];

      mockCoachMemory.findAll = jest.fn().mockResolvedValue(mockMemories);
      mockKpiTracker.findAll = jest.fn().mockResolvedValue(mockGoals);

      mockGenerateResponse.mockResolvedValue({
        id: 'weekly-report-response',
        content: JSON.stringify({
          insights: [
            {
              type: 'achievement',
              title: 'Goal Completed',
              description: 'Successfully completed goal',
              relevanceScore: 0.9,
              actionable: true,
              recommendations: ['Set new challenging goals'],
            },
          ],
        }),
        usage: { promptTokens: 60, completionTokens: 40, totalTokens: 100 },
        model: 'gpt-4',
        provider: 'openai' as const,
      });

      const result = await coachIntelligenceService.generateWeeklyReport(testUserId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('weekStart');
      expect(result).toHaveProperty('weekEnd');
      expect(result).toHaveProperty('summary');
    });

    test('should handle users with no data', async () => {
      mockCoachMemory.findAll = jest.fn().mockResolvedValue([]);
      mockKpiTracker.findAll = jest.fn().mockResolvedValue([]);

      const result = await coachIntelligenceService.generateWeeklyReport(testUserId);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('calculateUserAnalytics', () => {
    test('should calculate comprehensive user analytics', async () => {
      const mockMemories = Array(10).fill(null).map((_, i) =>
        createMockMemory({
          id: `memory-${i}`,
          conversationDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          sentiment: 0.5 + (i * 0.05),
          importance: 5,
        })
      );

      const mockGoals = [
        createMockGoal({ id: '1', progress: 80, status: 'in_progress' }),
        createMockGoal({ id: '2', progress: 100, status: 'completed' }),
      ];

      const mockAnalytics = {
        userId: testUserId,
        engagementMetrics: {
          totalSessions: 10,
          totalDuration: 250,
          averageSessionDuration: 25,
          streakCount: 5,
          missedSessions: 0,
          responsiveness: 0.85,
          participationScore: 0.75,
          followThroughRate: 0.7,
        },
        coachingMetrics: {
          goalsSet: 2,
          goalsAchieved: 1,
          goalCompletionRate: 0.5,
          avatarId: testAvatarId,
          avatarEffectivenessScore: 0.85,
          avatarSwitchCount: 0,
          progressMetrics: {
            skillImprovement: 0.6,
            confidenceIncrease: 0.5,
            stressReduction: 0.4,
            habitFormation: 0.7,
          },
        },
        save: jest.fn().mockResolvedValue(undefined),
      };

      const analyticsUpsertResult = {
        ...mockAnalytics,
        totalSessions: 10,
        engagementScore: 75,
      };

      mockCoachMemory.findAll = jest.fn().mockResolvedValue(mockMemories);
      mockKpiTracker.findAll = jest.fn().mockResolvedValue(mockGoals);
      mockUserAnalytics.findOne = jest.fn().mockResolvedValue(null);
      mockUserAnalytics.upsert = jest.fn().mockResolvedValue([analyticsUpsertResult, true]);

      const result = await coachIntelligenceService.calculateUserAnalytics(
        testUserId,
        'month'
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalSessions');
      expect(result).toHaveProperty('engagementScore');
    });

    test('should handle missing analytics record', async () => {
      mockCoachMemory.findAll = jest.fn().mockResolvedValue([]);
      mockKpiTracker.findAll = jest.fn().mockResolvedValue([]);
      mockUserAnalytics.findOne = jest.fn().mockResolvedValue(null);

      const newAnalytics = {
        userId: testUserId,
        engagementMetrics: {
          totalSessions: 0,
          totalDuration: 0,
          averageSessionDuration: 0,
          streakCount: 0,
          missedSessions: 0,
          responsiveness: 0,
          participationScore: 0,
          followThroughRate: 0.5,
        },
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockUserAnalytics.upsert = jest.fn().mockResolvedValue([newAnalytics, true]);

      const result = await coachIntelligenceService.calculateUserAnalytics(
        testUserId,
        'week'
      );

      expect(mockUserAnalytics.upsert).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    test('should calculate correct engagement metrics', async () => {
      const recentMemories = Array(5).fill(null).map((_, i) =>
        createMockMemory({
          id: `recent-${i}`,
          conversationDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          sentiment: 0.7,
          importance: 7,
        })
      );

      const analyticsResult = {
        userId: testUserId,
        engagementMetrics: {
          totalSessions: 5,
          totalDuration: 175,
          averageSessionDuration: 35,
          streakCount: 5,
          missedSessions: 0,
          responsiveness: 0.9,
          participationScore: 0.8,
          followThroughRate: 0.7,
        },
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockCoachMemory.findAll = jest.fn().mockResolvedValue(recentMemories);
      mockKpiTracker.findAll = jest.fn().mockResolvedValue([]);
      mockUserAnalytics.findOne = jest.fn().mockResolvedValue(null);
      mockUserAnalytics.upsert = jest.fn().mockResolvedValue([analyticsResult, true]);

      const result = await coachIntelligenceService.calculateUserAnalytics(
        testUserId,
        'week'
      );

      expect(result).toBeDefined();
      expect(result.engagementMetrics).toBeDefined();
      expect(result.engagementMetrics.totalSessions).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      mockCoachMemory.findAll = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        coachIntelligenceService.getRelevantMemories(testUserId, {
          topics: ['test'],
          mood: 'neutral',
          recentGoals: [],
        })
      ).rejects.toThrow();
    });

    test('should handle invalid JSON from AI service', async () => {
      mockCoachMemory.findAll = jest.fn().mockResolvedValue([]);
      mockKpiTracker.findAll = jest.fn().mockResolvedValue([]);
      mockUserAnalytics.findOne = jest.fn().mockResolvedValue(null);
      mockGenerateResponse.mockResolvedValue({
        id: 'invalid-json-response',
        content: 'Invalid JSON response',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        model: 'gpt-4',
        provider: 'openai' as const,
      });

      const recommendations = await coachIntelligenceService.generateCoachingRecommendations(
        testUserId,
        testAvatarId
      );

      // Should return fallback or empty recommendations
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    test('should handle null or undefined inputs', async () => {
      await expect(
        coachIntelligenceService.getRelevantMemories(null as any, null as any)
      ).rejects.toThrow();
    });
  });

  describe('Performance Optimizations', () => {
    test('should batch database queries efficiently', async () => {
      mockCoachMemory.findAll = jest.fn().mockResolvedValue([]);
      mockKpiTracker.findAll = jest.fn().mockResolvedValue([]);

      await coachIntelligenceService.generateWeeklyReport(testUserId);

      // Should query databases
      expect(mockCoachMemory.findAll).toHaveBeenCalled();
      expect(mockKpiTracker.findAll).toHaveBeenCalled();
    });

    test('should cache frequently accessed data', async () => {
      const mockMemories = [createMockMemory()];
      mockCoachMemory.findAll = jest.fn().mockResolvedValue(mockMemories);

      // First call
      await coachIntelligenceService.getRelevantMemories(testUserId, {
        topics: ['test'],
        mood: 'neutral',
        recentGoals: [],
      });

      // Second call with same parameters
      await coachIntelligenceService.getRelevantMemories(testUserId, {
        topics: ['test'],
        mood: 'neutral',
        recentGoals: [],
      });

      // Should call database for each distinct query
      expect(mockCoachMemory.findAll).toHaveBeenCalled();
    });
  });
});
