import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Op } from 'sequelize';

// Mock Sequelize before importing models
jest.mock('../../config/sequelize', () => ({
  sequelize: {
    define: jest.fn()
  }
}));

jest.mock('sequelize', () => ({
  Model: class {},
  DataTypes: {
    UUID: 'UUID',
    STRING: 'STRING',
    TEXT: 'TEXT',
    INTEGER: 'INTEGER',
    FLOAT: 'FLOAT',
    BOOLEAN: 'BOOLEAN',
    JSON: 'JSON',
    JSONB: 'JSONB',
    DATE: 'DATE',
    ENUM: jest.fn((...args) => ({ type: 'ENUM', values: args }))
  },
  Op: {
    gte: Symbol('gte'),
    ne: Symbol('ne'),
    overlap: Symbol('overlap')
  }
}));

import { CoachIntelligenceService } from '../../services/coaching/CoachIntelligenceService';
import CoachMemory from '../../models/coaching/CoachMemory';
import KpiTracker from '../../models/analytics/KpiTracker';
import UserAnalytics from '../../models/analytics/UserAnalytics';
import { aiService } from '../../services/ai/AIService';

// Mock dependencies
jest.mock('../../models/coaching/CoachMemory');
jest.mock('../../models/analytics/KpiTracker');
jest.mock('../../models/analytics/UserAnalytics');
jest.mock('../../services/ai/AIService');
jest.mock('../../utils/logger');

const mockCoachMemory = CoachMemory as jest.MockedClass<typeof CoachMemory>;
const mockKpiTracker = KpiTracker as jest.MockedClass<typeof KpiTracker>;
const mockUserAnalytics = UserAnalytics as jest.MockedClass<typeof UserAnalytics>;
const mockAiService = aiService as jest.Mocked<typeof aiService>;

describe('CoachIntelligenceService', () => {
  let service: CoachIntelligenceService;
  
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockAvatarId = '123e4567-e89b-12d3-a456-426614174001';
  const mockSessionId = '123e4567-e89b-12d3-a456-426614174002';

  const mockCoachingContext = {
    userId: mockUserId,
    avatarId: mockAvatarId,
    sessionId: mockSessionId,
    currentTopic: 'Goal Setting',
    userMood: 'motivated',
    conversationHistory: ['Previous session about habits'],
    goals: ['Improve productivity', 'Exercise daily'],
  };

  beforeEach(() => {
    service = new CoachIntelligenceService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('processCoachingSession', () => {
    it('should successfully process a coaching session', async () => {
      // Mock AI service response for conversation insights
      mockAiService.generateResponse.mockResolvedValueOnce({
        id: 'ai-response-1',
        content: JSON.stringify({
          summary: 'User discussed productivity goals and time management strategies',
          tags: ['productivity', 'time-management', 'goals'],
          sentiment: 0.7,
          emotionalTrends: ['motivated', 'focused'],
          category: 'goal-setting',
          actionItems: ['Set up morning routine', 'Use time blocking'],
          followUpNeeded: true,
          keyInsights: ['User prefers structured approaches'],
          challengesIdentified: ['Difficulty with consistency'],
          progressIndicators: ['Increased motivation'],
          coachingTechniques: ['Goal setting', 'Accountability']
        }),
        usage: {
          promptTokens: 150,
          completionTokens: 200,
          totalTokens: 350
        },
        model: 'gpt-4'
      });

      // Mock memory creation
      const mockMemory = {
        id: 'memory-123',
        userId: mockUserId,
        avatarId: mockAvatarId,
        sessionId: mockSessionId,
        memoryType: 'conversation',
        content: 'Test conversation content',
        summary: 'User discussed productivity goals',
        tags: ['productivity', 'goals'],
        emotionalContext: {
          mood: 'motivated',
          sentiment: 0.7,
          emotionalTrends: ['motivated', 'focused']
        },
        coachingContext: {
          topic: 'Goal Setting',
          category: 'goal-setting',
          importance: 7,
          actionItems: ['Set up morning routine'],
          followUpNeeded: true
        },
        importance: 7,
        relevanceScore: 0.8,
        conversationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn(),
        updateRelevanceScore: jest.fn(),
        isRelevant: jest.fn(() => true),
      };

      mockCoachMemory.create.mockResolvedValueOnce(mockMemory as any);

      const result = await service.processCoachingSession(
        mockCoachingContext,
        'Test conversation content about productivity and goals',
        25,
        { rating: 8, comments: 'Very helpful session' }
      );

      expect(mockCoachMemory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          avatarId: mockAvatarId,
          sessionId: mockSessionId,
          memoryType: 'conversation',
          content: 'Test conversation content about productivity and goals'
        })
      );

      expect(result).toEqual(mockMemory);
    });

    it('should handle AI service errors gracefully', async () => {
      mockAiService.generateResponse.mockRejectedValueOnce(new Error('AI service unavailable'));

      const mockMemory = {
        id: 'memory-123',
        userId: mockUserId,
        save: jest.fn(),
        updateRelevanceScore: jest.fn(),
        isRelevant: jest.fn(() => true),
      };

      mockCoachMemory.create.mockResolvedValueOnce(mockMemory as any);

      const result = await service.processCoachingSession(
        mockCoachingContext,
        'Test conversation content',
        20
      );

      expect(result).toBeDefined();
      expect(mockCoachMemory.create).toHaveBeenCalled();
    });
  });

  describe('getRelevantMemories', () => {
    it('should retrieve and filter relevant memories', async () => {
      const mockMemories = [
        {
          id: 'memory-1',
          userId: mockUserId,
          tags: ['productivity', 'goals'],
          relevanceScore: 0.9,
          conversationDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          updateRelevanceScore: jest.fn(),
          isRelevant: jest.fn(() => true),
          save: jest.fn()
        },
        {
          id: 'memory-2',
          userId: mockUserId,
          tags: ['habits', 'consistency'],
          relevanceScore: 0.7,
          conversationDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
          updateRelevanceScore: jest.fn(),
          isRelevant: jest.fn(() => true),
          save: jest.fn()
        },
        {
          id: 'memory-3',
          userId: mockUserId,
          tags: ['motivation'],
          relevanceScore: 0.3,
          conversationDate: new Date(Date.now() - 72 * 60 * 60 * 1000),
          updateRelevanceScore: jest.fn(),
          isRelevant: jest.fn(() => false),
          save: jest.fn()
        }
      ];

      mockCoachMemory.findAll.mockResolvedValueOnce(mockMemories as any);

      const result = await service.getRelevantMemories(
        mockUserId,
        {
          topics: ['productivity', 'goals'],
          mood: 'motivated',
          recentGoals: ['exercise', 'productivity']
        },
        5
      );

      expect(mockCoachMemory.findAll).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          conversationDate: {
            [Op.gte]: expect.any(Date)
          }
        },
        order: [['conversationDate', 'DESC']]
      });

      // Should return only relevant memories, sorted by relevance score
      expect(result).toHaveLength(2);
      expect(result[0].relevanceScore).toBeGreaterThan(result[1].relevanceScore);
    });

    it('should return empty array when no memories exist', async () => {
      mockCoachMemory.findAll.mockResolvedValueOnce([]);

      const result = await service.getRelevantMemories(
        mockUserId,
        { topics: [], mood: 'neutral', recentGoals: [] }
      );

      expect(result).toEqual([]);
    });
  });

  describe('generateCoachingRecommendations', () => {
    it('should generate recommendations based on user analytics and goals', async () => {
      const mockAnalytics = {
        id: 'analytics-123',
        userId: mockUserId,
        engagementMetrics: {
          averageSessionDuration: 15, // Below optimal
          participationScore: 0.8,
          responseRate: 0.9
        },
        coachingMetrics: {
          goalCompletionRate: 0.4, // Low completion rate
          avatarEffectivenessScore: 0.6 // Below optimal
        }
      };

      const mockGoals = [
        {
          id: 'goal-1',
          userId: mockUserId,
          title: 'Daily Exercise',
          status: 'at_risk',
          overallProgress: 30,
          analytics: {
            consistencyScore: 0.4,
            velocityScore: 0.2
          },
          priority: 'high'
        }
      ];

      const mockMemories = [
        {
          id: 'memory-1',
          userId: mockUserId,
          conversationDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          tags: ['exercise', 'motivation']
        }
      ];

      mockUserAnalytics.findOne.mockResolvedValueOnce(mockAnalytics as any);
      mockKpiTracker.findAll.mockResolvedValueOnce(mockGoals as any);
      mockCoachMemory.findAll.mockResolvedValueOnce(mockMemories as any);

      const result = await service.generateCoachingRecommendations(mockUserId, mockAvatarId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Should include engagement recommendation due to short sessions
      const engagementRec = result.find(r => r.title.includes('Session Engagement'));
      expect(engagementRec).toBeDefined();
      expect(engagementRec?.priority).toBe('medium');

      // Should include goal completion recommendation due to low completion rate
      const goalRec = result.find(r => r.title.includes('Goal Achievement'));
      expect(goalRec).toBeDefined();
    });

    it('should handle missing analytics gracefully', async () => {
      mockUserAnalytics.findOne.mockResolvedValueOnce(null);
      mockKpiTracker.findAll.mockResolvedValueOnce([]);
      mockCoachMemory.findAll.mockResolvedValueOnce([]);

      const result = await service.generateCoachingRecommendations(mockUserId, mockAvatarId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Should still return some baseline recommendations
    });
  });

  describe('generateWeeklyReport', () => {
    it('should generate comprehensive weekly report', async () => {
      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date();

      const mockMemories = [
        {
          id: 'memory-1',
          userId: mockUserId,
          conversationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          importance: 7,
          emotionalContext: { sentiment: 0.6 },
          coachingContext: { importance: 8 }
        },
        {
          id: 'memory-2',
          userId: mockUserId,
          conversationDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          importance: 6,
          emotionalContext: { sentiment: 0.3 },
          coachingContext: { importance: 6 }
        }
      ];

      const mockGoals = [
        {
          id: 'goal-1',
          userId: mockUserId,
          title: 'Exercise Goal',
          overallProgress: 75,
          status: 'in_progress',
          analytics: {
            consistencyScore: 0.8,
            velocityScore: 0.6
          },
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          performanceHistory: []
        }
      ];

      mockCoachMemory.findAll.mockResolvedValueOnce(mockMemories as any);
      mockKpiTracker.findAll.mockResolvedValueOnce(mockGoals as any);

      const result = await service.generateWeeklyReport(mockUserId);

      expect(result).toBeDefined();
      expect(result.userId).toBe(mockUserId);
      expect(result.weekStart).toBeInstanceOf(Date);
      expect(result.weekEnd).toBeInstanceOf(Date);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalSessions).toBe(mockMemories.length);
      expect(result.achievements).toBeDefined();
      expect(Array.isArray(result.achievements)).toBe(true);
      expect(result.challenges).toBeDefined();
      expect(Array.isArray(result.challenges)).toBe(true);
      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.nextWeekFocus).toBeDefined();
      expect(Array.isArray(result.nextWeekFocus)).toBe(true);
    });

    it('should handle empty data gracefully', async () => {
      mockCoachMemory.findAll.mockResolvedValueOnce([]);
      mockKpiTracker.findAll.mockResolvedValueOnce([]);

      const result = await service.generateWeeklyReport(mockUserId);

      expect(result).toBeDefined();
      expect(result.summary.totalSessions).toBe(0);
      expect(result.summary.avgSessionDuration).toBe(0);
      expect(result.achievements).toHaveLength(0);
      expect(result.challenges).toHaveLength(0);
    });
  });

  describe('calculateUserAnalytics', () => {
    it('should calculate comprehensive user analytics', async () => {
      const mockMemories = [
        {
          id: 'memory-1',
          userId: mockUserId,
          importance: 8,
          emotionalContext: { sentiment: 0.7 },
          tags: ['productivity', 'goals'],
          conversationDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      ];

      const mockGoals = [
        {
          id: 'goal-1',
          userId: mockUserId,
          overallProgress: 80,
          status: 'in_progress',
          analytics: {
            consistencyScore: 0.9,
            velocityScore: 0.7
          }
        }
      ];

      mockCoachMemory.findAll.mockResolvedValueOnce(mockMemories as any);
      mockKpiTracker.findAll.mockResolvedValueOnce(mockGoals as any);

      const result = await service.calculateUserAnalytics(mockUserId, 'weekly');

      expect(result).toBeDefined();
      expect(result.userId).toBe(mockUserId);
      expect(result.periodType).toBe('weekly');
      expect(result.engagementMetrics).toBeDefined();
      expect(result.coachingMetrics).toBeDefined();
      expect(result.kpiMetrics).toBeDefined();
      expect(result.aiInsights).toBeDefined();
      expect(result.benchmarkData).toBeDefined();
    });

    it('should handle different period types', async () => {
      mockCoachMemory.findAll.mockResolvedValueOnce([]);
      mockKpiTracker.findAll.mockResolvedValueOnce([]);

      const result = await service.calculateUserAnalytics(mockUserId, 'monthly');

      expect(result.periodType).toBe('monthly');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle database errors gracefully', async () => {
      mockCoachMemory.findAll.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        service.getRelevantMemories(mockUserId, { topics: [], mood: 'neutral', recentGoals: [] })
      ).rejects.toThrow('Database error');
    });

    it('should handle invalid user IDs', async () => {
      const invalidUserId = 'invalid-id';
      
      mockCoachMemory.findAll.mockResolvedValueOnce([]);
      
      const result = await service.getRelevantMemories(
        invalidUserId,
        { topics: [], mood: 'neutral', recentGoals: [] }
      );

      expect(result).toEqual([]);
    });

    it('should handle malformed AI responses', async () => {
      mockAiService.generateResponse.mockResolvedValueOnce({
        id: 'ai-response-error',
        content: 'Invalid JSON response',
        usage: {
          promptTokens: 50,
          completionTokens: 20,
          totalTokens: 70
        },
        model: 'gpt-4'
      });

      const mockMemory = {
        id: 'memory-123',
        save: jest.fn(),
        updateRelevanceScore: jest.fn(),
        isRelevant: jest.fn(() => true),
      };

      mockCoachMemory.create.mockResolvedValueOnce(mockMemory as any);

      const result = await service.processCoachingSession(
        mockCoachingContext,
        'Test conversation',
        20
      );

      expect(result).toBeDefined();
      // Should fall back to basic extraction
    });
  });
});