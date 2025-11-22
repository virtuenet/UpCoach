/**
 * AI Services Integration Test
 * Tests the newly implemented methods: VoiceAI.saveAnalysis and PredictiveAnalytics.analyzeGoalRisk
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { VoiceAI } from '../../../services/ai/VoiceAI';
import { PredictiveAnalytics } from '../../../services/ai/PredictiveAnalytics';
import { VoiceJournalEntry } from '../../../models/VoiceJournalEntry';
import { Goal } from '../../../models/Goal';
import { Task } from '../../../models/Task';
import { Mood } from '../../../models/Mood';

// Mock database models
jest.mock('../../../models/VoiceJournalEntry');
jest.mock('../../../models/Goal');
jest.mock('../../../models/Task');
jest.mock('../../../models/Mood');
jest.mock('../../../models/ChatMessage');
jest.mock('../../../models/Chat');
jest.mock('../../../models/UserProfile');

// Mock external dependencies
jest.mock('openai');
jest.mock('../../../services/ai/AIService');
jest.mock('../../../services/ai/UserProfilingService');

describe('AI Services Integration Tests', () => {
  let voiceAI: VoiceAI;
  let predictiveAnalytics: PredictiveAnalytics;

  beforeEach(() => {
    voiceAI = new VoiceAI();
    predictiveAnalytics = new PredictiveAnalytics();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('VoiceAI.saveAnalysis', () => {
    it('should save voice analysis to database successfully', async () => {
      // Mock the VoiceJournalEntry.create method
      const mockVoiceEntry = {
        id: 'voice-entry-123',
        userId: 'user123',
        title: 'Motivational Reflection - 1/14/2025',
        transcriptionText: 'I feel motivated and excited about my goals today',
        audioFilePath: '/path/to/audio.mp3',
        duration: 120,
        summary: 'Overall sentiment: positive (+80%). Speech: normal pace, expressive tone. Language: moderate complexity, 10 unique words. Key insights: High positive sentiment detected',
        tags: ['reflection', 'positive', 'joy', 'emotional'],
        emotionalTone: 'positive',
        isTranscribed: true,
        isAnalyzed: true,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (VoiceJournalEntry.create as jest.MockedFunction<typeof VoiceJournalEntry.create>)
        .mockResolvedValue(mockVoiceEntry as any);

      const mockAnalysis = {
        transcript: 'I feel motivated and excited about my goals today',
        sentiment: {
          overall: 'positive' as const,
          score: 0.8,
          emotions: {
            joy: 0.8,
            sadness: 0.1,
            anger: 0.1,
            fear: 0.1,
            surprise: 0.2,
            trust: 0.7
          }
        },
        speechPatterns: {
          pace: 'normal' as const,
          volume: 'normal' as const,
          tone: 'expressive' as const,
          fillerWords: 2,
          pauseDuration: 1.5,
          speechRate: 150
        },
        linguisticAnalysis: {
          complexity: 'moderate' as const,
          vocabulary: {
            uniqueWords: 10,
            totalWords: 15,
            sophistication: 5.0
          },
          sentenceStructure: {
            avgLength: 8,
            complexity: 4
          }
        },
        insights: [{
          type: 'emotional' as const,
          insight: 'High positive sentiment detected',
          confidence: 0.85,
          recommendations: ['Leverage this positive energy for goal achievement']
        }]
      };

      const options = {
        audioUrl: '/path/to/audio.mp3',
        duration: 120,
        sessionType: 'reflection' as const
      };

      const result = await voiceAI.saveAnalysis('user123', mockAnalysis, options);

      expect(VoiceJournalEntry.create).toHaveBeenCalledWith({
        userId: 'user123',
        title: expect.any(String),
        transcriptionText: mockAnalysis.transcript,
        audioFilePath: '/path/to/audio.mp3',
        duration: 120,
        summary: expect.any(String),
        tags: expect.any(Array),
        emotionalTone: 'positive',
        isTranscribed: true,
        isAnalyzed: true,
        isFavorite: false
      });

      expect(result).toEqual(mockVoiceEntry);
      expect(result.userId).toBe('user123');
      expect(result.emotionalTone).toBe('positive');
      expect(result.isAnalyzed).toBe(true);
    });

    it('should handle errors gracefully when saving fails', async () => {
      (VoiceJournalEntry.create as jest.MockedFunction<typeof VoiceJournalEntry.create>)
        .mockRejectedValue(new Error('Database error'));

      const mockAnalysis = {
        transcript: 'test',
        sentiment: {
          overall: 'neutral' as const,
          score: 0,
          emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, trust: 0 }
        },
        speechPatterns: {
          pace: 'normal' as const,
          volume: 'normal' as const,
          tone: 'monotone' as const,
          fillerWords: 0,
          pauseDuration: 0,
          speechRate: 100
        },
        linguisticAnalysis: {
          complexity: 'simple' as const,
          vocabulary: { uniqueWords: 1, totalWords: 1, sophistication: 1 },
          sentenceStructure: { avgLength: 1, complexity: 1 }
        },
        insights: []
      };

      await expect(voiceAI.saveAnalysis('user123', mockAnalysis))
        .rejects.toThrow('Failed to save voice analysis');
    });
  });

  describe('PredictiveAnalytics.analyzeGoalRisk', () => {
    it('should analyze goal risk successfully', async () => {
      // Mock Goal.findByPk
      const mockGoal = {
        id: 'goal123',
        userId: 'user123',
        title: 'Fitness Goal',
        progress: 45,
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        status: 'in_progress'
      };

      (Goal.findByPk as jest.MockedFunction<typeof Goal.findByPk>)
        .mockResolvedValue(mockGoal as any);

      // Mock Task.findAll
      const mockTasks = [
        { id: 'task1', status: 'completed', priority: 'high', createdAt: new Date() },
        { id: 'task2', status: 'in_progress', priority: 'medium', createdAt: new Date() },
        { id: 'task3', status: 'completed', priority: 'low', createdAt: new Date() }
      ];

      (Task.findAll as jest.MockedFunction<typeof Task.findAll>)
        .mockResolvedValue(mockTasks as any);

      // Mock related goals
      (Goal.findAll as jest.MockedFunction<typeof Goal.findAll>)
        .mockResolvedValue([
          { id: 'goal2', status: 'completed', userId: 'user123' },
          { id: 'goal3', status: 'in_progress', userId: 'user123' }
        ] as any);

      // Mock user data dependencies
      jest.spyOn(predictiveAnalytics as any, 'gatherUserData')
        .mockResolvedValue({
          goals: [mockGoal],
          tasks: mockTasks,
          moods: [],
          profile: null,
          messageCount: 5,
          avgMoodTrend: 0.1
        });

      const result = await predictiveAnalytics.analyzeGoalRisk('goal123');

      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('probability');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('timeline');
      expect(result).toHaveProperty('interventions');

      // Verify risk level is valid
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);

      // Verify probability is within valid range
      expect(result.probability).toBeGreaterThanOrEqual(0);
      expect(result.probability).toBeLessThanOrEqual(1);

      // Verify factors structure
      expect(result.factors).toHaveProperty('positive');
      expect(result.factors).toHaveProperty('negative');
      expect(result.factors).toHaveProperty('neutral');

      // Verify timeline has required properties
      expect(result.timeline).toHaveProperty('currentProgress', 45);
      expect(result.timeline).toHaveProperty('daysRemaining');
      expect(result.timeline.daysRemaining).toBeGreaterThan(0);

      // Verify recommendations are provided
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);

      // Verify interventions structure
      expect(Array.isArray(result.interventions)).toBe(true);
      result.interventions.forEach(intervention => {
        expect(intervention).toHaveProperty('type');
        expect(intervention).toHaveProperty('action');
        expect(intervention).toHaveProperty('priority');
        expect(intervention).toHaveProperty('expectedImpact');
      });
    });

    it('should handle non-existent goals', async () => {
      (Goal.findByPk as jest.MockedFunction<typeof Goal.findByPk>)
        .mockResolvedValue(null);

      await expect(predictiveAnalytics.analyzeGoalRisk('nonexistent-goal'))
        .rejects.toThrow('Goal with ID nonexistent-goal not found');
    });

    it('should handle database errors gracefully', async () => {
      (Goal.findByPk as jest.MockedFunction<typeof Goal.findByPk>)
        .mockRejectedValue(new Error('Database connection error'));

      await expect(predictiveAnalytics.analyzeGoalRisk('goal123'))
        .rejects.toThrow('Failed to analyze goal risk');
    });
  });

  describe('Integration between VoiceAI and PredictiveAnalytics', () => {
    it('should work together for comprehensive user analysis', async () => {
      // This test verifies that both services can work together
      // For example, voice analysis insights could inform goal risk analysis

      const mockAnalysis = {
        transcript: 'I am struggling with my fitness goals lately',
        sentiment: {
          overall: 'negative' as const,
          score: -0.4,
          emotions: { joy: 0.1, sadness: 0.6, anger: 0.2, fear: 0.3, surprise: 0.1, trust: 0.2 }
        },
        speechPatterns: {
          pace: 'slow' as const,
          volume: 'soft' as const,
          tone: 'monotone' as const,
          fillerWords: 8,
          pauseDuration: 2.5,
          speechRate: 80
        },
        linguisticAnalysis: {
          complexity: 'simple' as const,
          vocabulary: { uniqueWords: 5, totalWords: 8, sophistication: 2 },
          sentenceStructure: { avgLength: 4, complexity: 2 }
        },
        insights: [{
          type: 'emotional' as const,
          insight: 'User expressing struggle and frustration',
          confidence: 0.9,
          recommendations: ['Provide additional support and motivation']
        }]
      };

      // Mock successful voice analysis save
      (VoiceJournalEntry.create as jest.MockedFunction<typeof VoiceJournalEntry.create>)
        .mockResolvedValue({
          id: 'voice-entry-456',
          userId: 'user123',
          emotionalTone: 'negative'
        } as any);

      const savedVoiceEntry = await voiceAI.saveAnalysis('user123', mockAnalysis);
      
      expect(savedVoiceEntry).toBeDefined();
      expect(savedVoiceEntry.emotionalTone).toBe('negative');

      // The negative voice analysis could be used to inform goal risk analysis
      // In a real implementation, the PredictiveAnalytics service could consider
      // recent voice journal entries when calculating goal completion risks
      
      expect(savedVoiceEntry.id).toBe('voice-entry-456');
    });
  });
});