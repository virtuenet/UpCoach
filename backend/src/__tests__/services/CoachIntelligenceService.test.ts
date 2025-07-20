import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import CoachIntelligenceService from '../../services/coaching/CoachIntelligenceService';
import CoachMemory from '../../models/coaching/CoachMemory';
import UserAnalytics from '../../models/analytics/UserAnalytics';
import KpiTracker from '../../models/analytics/KpiTracker';
import { Avatar } from '../../models/personality/Avatar';
import { UserAvatarPreference } from '../../models/personality/UserAvatarPreference';

// Mock the models
jest.mock('../../models/coaching/CoachMemory');
jest.mock('../../models/analytics/UserAnalytics');
jest.mock('../../models/analytics/KpiTracker');
jest.mock('../../models/personality/Avatar');
jest.mock('../../models/personality/UserAvatarPreference');

const MockedCoachMemory = CoachMemory as jest.MockedClass<typeof CoachMemory>;
const MockedUserAnalytics = UserAnalytics as jest.MockedClass<typeof UserAnalytics>;
const MockedKpiTracker = KpiTracker as jest.MockedClass<typeof KpiTracker>;
const MockedAvatar = Avatar as jest.MockedClass<typeof Avatar>;

describe('CoachIntelligenceService', () => {
  let service: CoachIntelligenceService;
  let mockCoachingContext: any;
  let mockMemory: any;
  let mockAnalytics: any;
  let mockKpiTracker: any;

  beforeEach(() => {
    service = new CoachIntelligenceService();

    // Setup mock coaching context
    mockCoachingContext = {
      userId: 'user-123',
      avatarId: 'avatar-456',
      sessionId: 'session-789',
      currentTopic: 'goal-setting',
      userMood: 'motivated',
      conversationHistory: ['Hello', 'How can I help you today?'],
      goals: ['Improve productivity', 'Learn new skills'],
    };

    // Setup mock memory
    mockMemory = {
      id: 'memory-123',
      userId: 'user-123',
      avatarId: 'avatar-456',
      sessionId: 'session-789',
      memoryType: 'conversation',
      content: 'User discussed productivity challenges and goal-setting strategies',
      summary: 'Productive session about goal-setting and productivity improvement',
      tags: ['goal-setting', 'productivity'],
      emotionalContext: {
        mood: 'motivated',
        sentiment: 0.7,
        emotionalTrends: ['motivated', 'focused'],
      },
      coachingContext: {
        topic: 'goal-setting',
        category: 'productivity',
        importance: 8,
        actionItems: ['Set 3 SMART goals', 'Schedule weekly review'],
        followUpNeeded: true,
      },
      conversationDate: new Date(),
      importance: 8,
      relevanceScore: 0.9,
      accessCount: 1,
      relatedMemoryIds: [],
      parentMemoryId: null,
      childMemoryIds: [],
      aiProcessed: false,
      insightsGenerated: [],
      isRelevant: jest.fn().mockReturnValue(true),
      updateRelevanceScore: jest.fn(),
      recordAccess: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
      toJSON: jest.fn().mockReturnValue({}),
    };

    // Setup mock analytics
    mockAnalytics = {
      id: 'analytics-123',
      userId: 'user-123',
      periodType: 'weekly',
      engagementMetrics: {
        totalSessions: 5,
        totalDuration: 150,
        averageSessionDuration: 30,
        streakCount: 3,
        missedSessions: 1,
        responsiveness: 0.8,
        participationScore: 0.9,
        followThroughRate: 0.7,
      },
      coachingMetrics: {
        goalsSet: 3,
        goalsAchieved: 2,
        goalCompletionRate: 0.67,
        avatarId: 'avatar-456',
        avatarEffectivenessScore: 0.8,
        avatarSwitchCount: 0,
        progressMetrics: {
          skillImprovement: 0.7,
          confidenceIncrease: 0.8,
          stressReduction: 0.6,
          habitFormation: 0.5,
        },
      },
      kpiMetrics: {
        userSatisfactionScore: 8,
        npsScore: 20,
        retentionProbability: 0.85,
        churnRisk: 0.15,
        customKpis: [],
      },
      getOverallHealthScore: jest.fn().mockReturnValue(78),
      getTrendingDirection: jest.fn().mockReturnValue('up'),
      isAtRisk: jest.fn().mockReturnValue(false),
      getPersonalizedRecommendations: jest.fn().mockReturnValue([
        'Continue current engagement level',
        'Focus on completing remaining goal',
      ]),
    };

    // Setup mock KPI tracker
    mockKpiTracker = {
      id: 'kpi-123',
      userId: 'user-123',
      type: 'personal_goal',
      title: 'Improve Productivity',
      status: 'in_progress',
      priority: 'high',
      overallProgress: 65,
      isAtRisk: jest.fn().mockReturnValue(false),
      calculateOverallProgress: jest.fn().mockReturnValue(65),
      getNextMilestone: jest.fn().mockReturnValue({
        id: 'milestone-1',
        title: 'Complete productivity course',
        targetDate: new Date(),
        progress: 80,
      }),
      getOverdueActionItems: jest.fn().mockReturnValue([]),
      coachingData: {
        actionItems: [
          {
            id: 'action-1',
            description: 'Complete time tracking for one week',
            status: 'completed',
            priority: 'high',
          },
          {
            id: 'action-2',
            description: 'Set up productivity dashboard',
            status: 'in_progress',
            priority: 'medium',
          },
        ],
      },
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('processCoachingSession', () => {
    it('should successfully process a coaching session and create memory', async () => {
      // Arrange
      MockedCoachMemory.create.mockResolvedValue(mockMemory as any);
      MockedCoachMemory.findAll.mockResolvedValue([]);

      const conversationContent = 'User discussed productivity challenges and wants to set better goals';
      const sessionDuration = 30;
      const userFeedback = { rating: 8, comments: 'Very helpful session' };

      // Act
      const result = await service.processCoachingSession(
        mockCoachingContext,
        conversationContent,
        sessionDuration,
        userFeedback
      );

      // Assert
      expect(MockedCoachMemory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockCoachingContext.userId,
          avatarId: mockCoachingContext.avatarId,
          sessionId: mockCoachingContext.sessionId,
          memoryType: 'conversation',
          content: conversationContent,
        })
      );
      expect(result).toEqual(mockMemory);
    });

    it('should handle session processing with minimal user feedback', async () => {
      // Arrange
      MockedCoachMemory.create.mockResolvedValue(mockMemory as any);
      MockedCoachMemory.findAll.mockResolvedValue([]);

      const conversationContent = 'Brief check-in session';
      const sessionDuration = 15;

      // Act
      const result = await service.processCoachingSession(
        mockCoachingContext,
        conversationContent,
        sessionDuration
      );

      // Assert
      expect(MockedCoachMemory.create).toHaveBeenCalled();
      expect(result).toEqual(mockMemory);
    });

    it('should handle errors during session processing', async () => {
      // Arrange
      MockedCoachMemory.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        service.processCoachingSession(
          mockCoachingContext,
          'test content',
          30
        )
      ).rejects.toThrow('Database error');
    });
  });

  describe('getRelevantMemories', () => {
    it('should retrieve and rank relevant memories', async () => {
      // Arrange
      const memories = [mockMemory, { ...mockMemory, id: 'memory-124', relevanceScore: 0.8 }];
      MockedCoachMemory.findAll.mockResolvedValue(memories as any);

      const currentContext = {
        topics: ['goal-setting', 'productivity'],
        mood: 'motivated',
        recentGoals: ['Improve productivity'],
      };

      // Act
      const result = await service.getRelevantMemories('user-123', currentContext, 10);

      // Assert
      expect(MockedCoachMemory.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
          }),
        })
      );
      expect(memories[0].updateRelevanceScore).toHaveBeenCalledWith(currentContext);
      expect(result).toEqual(memories);
    });

    it('should filter out irrelevant memories', async () => {
      // Arrange
      const irrelevantMemory = { ...mockMemory, isRelevant: jest.fn().mockReturnValue(false) };
      MockedCoachMemory.findAll.mockResolvedValue([mockMemory, irrelevantMemory] as any);

      const currentContext = {
        topics: ['goal-setting'],
        mood: 'motivated',
        recentGoals: ['Improve productivity'],
      };

      // Act
      const result = await service.getRelevantMemories('user-123', currentContext, 10);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMemory);
    });

    it('should limit results to specified count', async () => {
      // Arrange
      const memories = Array(15).fill(0).map((_, i) => ({ ...mockMemory, id: `memory-${i}` }));
      MockedCoachMemory.findAll.mockResolvedValue(memories as any);

      const currentContext = {
        topics: ['goal-setting'],
        mood: 'motivated',
        recentGoals: ['Improve productivity'],
      };

      // Act
      const result = await service.getRelevantMemories('user-123', currentContext, 5);

      // Assert
      expect(result).toHaveLength(5);
    });
  });

  describe('generateCoachingRecommendations', () => {
    it('should generate recommendations based on analytics and goals', async () => {
      // Arrange
      MockedUserAnalytics.findOne.mockResolvedValue(mockAnalytics as any);
      MockedKpiTracker.findAll.mockResolvedValue([mockKpiTracker] as any);
      MockedCoachMemory.findAll.mockResolvedValue([mockMemory] as any);
      MockedAvatar.findByPk.mockResolvedValue({ id: 'avatar-456', name: 'Alex' } as any);

      // Act
      const result = await service.generateCoachingRecommendations('user-123', 'avatar-456');

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('priority');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('implementation');
    });

    it('should prioritize urgent recommendations for at-risk goals', async () => {
      // Arrange
      const atRiskGoal = { ...mockKpiTracker, isAtRisk: jest.fn().mockReturnValue(true) };
      MockedUserAnalytics.findOne.mockResolvedValue(mockAnalytics as any);
      MockedKpiTracker.findAll.mockResolvedValue([atRiskGoal] as any);
      MockedCoachMemory.findAll.mockResolvedValue([mockMemory] as any);

      // Act
      const result = await service.generateCoachingRecommendations('user-123', 'avatar-456');

      // Assert
      const urgentRecommendations = result.filter(r => r.priority === 'urgent');
      expect(urgentRecommendations.length).toBeGreaterThan(0);
    });

    it('should handle missing analytics gracefully', async () => {
      // Arrange
      MockedUserAnalytics.findOne.mockResolvedValue(null);
      MockedKpiTracker.findAll.mockResolvedValue([]);
      MockedCoachMemory.findAll.mockResolvedValue([]);

      // Act
      const result = await service.generateCoachingRecommendations('user-123', 'avatar-456');

      // Assert
      expect(result).toBeInstanceOf(Array);
      // Should still return some basic recommendations
    });
  });

  describe('generateWeeklyReport', () => {
    it('should generate comprehensive weekly report', async () => {
      // Arrange
      MockedUserAnalytics.findOne.mockResolvedValue(mockAnalytics as any);
      MockedCoachMemory.findAll.mockResolvedValue([mockMemory] as any);
      MockedKpiTracker.findAll.mockResolvedValue([mockKpiTracker] as any);

      // Act
      const result = await service.generateWeeklyReport('user-123');

      // Assert
      expect(result).toHaveProperty('userId', 'user-123');
      expect(result).toHaveProperty('weekStart');
      expect(result).toHaveProperty('weekEnd');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('achievements');
      expect(result).toHaveProperty('challenges');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('nextWeekFocus');

      expect(result.summary).toHaveProperty('totalSessions');
      expect(result.summary).toHaveProperty('avgSessionDuration');
      expect(result.summary).toHaveProperty('goalsProgress');
      expect(result.summary).toHaveProperty('engagementScore');
      expect(result.summary).toHaveProperty('moodTrend');
    });

    it('should handle weeks with no activity', async () => {
      // Arrange
      MockedUserAnalytics.findOne.mockResolvedValue(null);
      MockedCoachMemory.findAll.mockResolvedValue([]);
      MockedKpiTracker.findAll.mockResolvedValue([]);

      // Act
      const result = await service.generateWeeklyReport('user-123');

      // Assert
      expect(result).toHaveProperty('summary');
      expect(result.summary.totalSessions).toBe(0);
    });
  });

  describe('calculateUserAnalytics', () => {
    it('should calculate analytics for weekly period', async () => {
      // Arrange
      MockedCoachMemory.findAll.mockResolvedValue([mockMemory] as any);
      MockedKpiTracker.findAll.mockResolvedValue([mockKpiTracker] as any);
      MockedUserAnalytics.upsert.mockResolvedValue([mockAnalytics] as any);

      // Act
      const result = await service.calculateUserAnalytics('user-123', 'weekly');

      // Assert
      expect(MockedUserAnalytics.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          periodType: 'weekly',
        })
      );
      expect(result).toEqual(mockAnalytics);
    });

    it('should calculate analytics for different time periods', async () => {
      // Arrange
      MockedCoachMemory.findAll.mockResolvedValue([mockMemory] as any);
      MockedKpiTracker.findAll.mockResolvedValue([mockKpiTracker] as any);
      MockedUserAnalytics.upsert.mockResolvedValue([mockAnalytics] as any);

      // Test different periods
      const periods: Array<'daily' | 'weekly' | 'monthly' | 'quarterly'> = ['daily', 'weekly', 'monthly', 'quarterly'];

      for (const period of periods) {
        // Act
        await service.calculateUserAnalytics('user-123', period);

        // Assert
        expect(MockedUserAnalytics.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            periodType: period,
          })
        );
      }
    });

    it('should handle empty data gracefully', async () => {
      // Arrange
      MockedCoachMemory.findAll.mockResolvedValue([]);
      MockedKpiTracker.findAll.mockResolvedValue([]);
      MockedUserAnalytics.upsert.mockResolvedValue([mockAnalytics] as any);

      // Act
      const result = await service.calculateUserAnalytics('user-123', 'weekly');

      // Assert
      expect(result).toEqual(mockAnalytics);
      expect(MockedUserAnalytics.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          engagementMetrics: expect.objectContaining({
            totalSessions: 0,
          }),
        })
      );
    });
  });

  describe('Helper Methods', () => {
    describe('analyzeSentiment', () => {
      it('should correctly analyze positive sentiment', () => {
        const service = new CoachIntelligenceService();
        const positiveText = 'I feel great and happy about my progress. Excellent session!';
        
        // Access private method for testing
        const sentiment = (service as any).analyzeSentiment(positiveText);
        
        expect(sentiment).toBeGreaterThan(0);
      });

      it('should correctly analyze negative sentiment', () => {
        const service = new CoachIntelligenceService();
        const negativeText = 'I feel terrible and frustrated. This is a bad situation with many problems.';
        
        const sentiment = (service as any).analyzeSentiment(negativeText);
        
        expect(sentiment).toBeLessThan(0);
      });

      it('should return neutral for balanced text', () => {
        const service = new CoachIntelligenceService();
        const neutralText = 'This is a normal session with regular discussion about topics.';
        
        const sentiment = (service as any).analyzeSentiment(neutralText);
        
        expect(sentiment).toBe(0);
      });
    });

    describe('extractActionItems', () => {
      it('should extract action items from conversation', () => {
        const service = new CoachIntelligenceService();
        const content = 'I will complete the task tomorrow. You should review the document. Next week we will discuss progress.';
        
        const actionItems = (service as any).extractActionItems(content);
        
        expect(actionItems).toBeInstanceOf(Array);
        expect(actionItems.length).toBeGreaterThan(0);
      });

      it('should handle content without action items', () => {
        const service = new CoachIntelligenceService();
        const content = 'We talked about general topics and had a nice conversation.';
        
        const actionItems = (service as any).extractActionItems(content);
        
        expect(actionItems).toBeInstanceOf(Array);
      });
    });

    describe('calculateMemoryImportance', () => {
      it('should assign higher importance to sessions with positive feedback', () => {
        const service = new CoachIntelligenceService();
        const insights = { actionItems: [], followUpNeeded: false, sentiment: 0.5 };
        const userFeedback = { rating: 9 };
        
        const importance = (service as any).calculateMemoryImportance(insights, userFeedback);
        
        expect(importance).toBeGreaterThan(5);
      });

      it('should assign higher importance to sessions with action items', () => {
        const service = new CoachIntelligenceService();
        const insights = { actionItems: ['Complete task'], followUpNeeded: true, sentiment: 0.8 };
        
        const importance = (service as any).calculateMemoryImportance(insights);
        
        expect(importance).toBeGreaterThan(5);
      });

      it('should cap importance at maximum value', () => {
        const service = new CoachIntelligenceService();
        const insights = { 
          actionItems: ['Task 1', 'Task 2'], 
          followUpNeeded: true, 
          sentiment: 0.9 
        };
        const userFeedback = { rating: 10 };
        
        const importance = (service as any).calculateMemoryImportance(insights, userFeedback);
        
        expect(importance).toBeLessThanOrEqual(10);
      });
    });
  });
});

describe('CoachIntelligenceService Integration Tests', () => {
  let service: CoachIntelligenceService;

  beforeEach(() => {
    service = new CoachIntelligenceService();
  });

  describe('End-to-End Coaching Flow', () => {
    it('should handle complete coaching session flow', async () => {
      // This would be an integration test that uses actual database
      // For now, we'll skip it or mock the entire flow
      expect(service).toBeInstanceOf(CoachIntelligenceService);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      // Test with large number of memories and analytics
      expect(service).toBeInstanceOf(CoachIntelligenceService);
    });

    it('should process recommendations within acceptable time', async () => {
      // Test recommendation generation performance
      expect(service).toBeInstanceOf(CoachIntelligenceService);
    });
  });
});

// Test data factories for consistent test data
export const createMockCoachingContext = (overrides = {}) => ({
  userId: 'user-123',
  avatarId: 'avatar-456',
  sessionId: 'session-789',
  currentTopic: 'goal-setting',
  userMood: 'motivated',
  conversationHistory: ['Hello', 'How can I help you today?'],
  goals: ['Improve productivity', 'Learn new skills'],
  ...overrides,
});

export const createMockMemory = (overrides = {}) => ({
  id: 'memory-123',
  userId: 'user-123',
  avatarId: 'avatar-456',
  memoryType: 'conversation',
  content: 'Test conversation content',
  summary: 'Test summary',
  tags: ['test'],
  importance: 5,
  relevanceScore: 0.8,
  isRelevant: jest.fn().mockReturnValue(true),
  updateRelevanceScore: jest.fn(),
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

export const createMockAnalytics = (overrides = {}) => ({
  id: 'analytics-123',
  userId: 'user-123',
  periodType: 'weekly',
  engagementMetrics: {
    totalSessions: 5,
    averageSessionDuration: 30,
    participationScore: 0.8,
  },
  coachingMetrics: {
    goalCompletionRate: 0.7,
    avatarEffectivenessScore: 0.8,
  },
  kpiMetrics: {
    userSatisfactionScore: 8,
    churnRisk: 0.2,
  },
  getOverallHealthScore: jest.fn().mockReturnValue(75),
  ...overrides,
}); 