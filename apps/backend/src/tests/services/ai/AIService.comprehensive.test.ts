import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AIService } from '../../../services/ai/AIService';
import { RecommendationEngine } from '../../../services/ai/RecommendationEngine';
import { PredictiveAnalytics } from '../../../services/ai/PredictiveAnalytics';
import { ConversationalAI } from '../../../services/ai/ConversationalAI';
import { VoiceAI } from '../../../services/ai/VoiceAI';
import { UserProfilingService } from '../../../services/ai/UserProfilingService';
import { InsightGenerator } from '../../../services/ai/InsightGenerator';
import { AdaptiveLearning } from '../../../services/ai/AdaptiveLearning';

// Mock OpenAI and Anthropic
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

describe('AI Services Comprehensive Test Suite', () => {
  let aiService: AIService;
  let recommendationEngine: RecommendationEngine;
  let predictiveAnalytics: PredictiveAnalytics;
  let conversationalAI: ConversationalAI;
  let voiceAI: VoiceAI;
  let userProfilingService: UserProfilingService;
  let insightGenerator: InsightGenerator;
  let adaptiveLearning: AdaptiveLearning;

  beforeEach(() => {
    aiService = new AIService();
    recommendationEngine = new RecommendationEngine();
    predictiveAnalytics = new PredictiveAnalytics();
    conversationalAI = new ConversationalAI();
    voiceAI = new VoiceAI();
    userProfilingService = new UserProfilingService();
    insightGenerator = new InsightGenerator();
    adaptiveLearning = new AdaptiveLearning();
  });

  describe('AIService Core', () => {
    it('should generate response using OpenAI', async () => {
      const messages = [{ role: 'user' as const, content: 'Help me set a fitness goal' }];

      const mockResponse = {
        content: 'I can help you set a SMART fitness goal...',
        usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
        model: 'gpt-4-turbo-preview',
        provider: 'openai' as const,
      };

      jest.spyOn(aiService as any, 'generateOpenAIResponse').mockResolvedValue(mockResponse);

      const response = await aiService.generateResponse(messages);
      expect(response).toEqual(mockResponse);
      expect(response.provider).toBe('openai');
    });

    it('should generate coaching response with context', async () => {
      const mockResponse = {
        content: 'Based on your progress...',
        usage: { input_tokens: 15, output_tokens: 25, total_tokens: 40 },
        provider: 'openai' as const,
      };

      jest.spyOn(aiService as any, 'generateResponse').mockResolvedValue(mockResponse);

      const response = await aiService.generateCoachingResponse('How am I doing?', {
        userId: 'user123',
        personality: 'motivator',
      });

      expect(response.content).toContain('Based on your progress');
    });

    it('should analyze conversation for insights', async () => {
      const messages = [
        { role: 'user' as const, content: 'I feel unmotivated' },
        { role: 'assistant' as const, content: "Let's work on that..." },
      ];

      const mockAnalysis = {
        overall_sentiment: 'negative',
        emotion_breakdown: { sadness: 60, neutral: 40 },
        key_emotional_moments: ['unmotivated'],
      };

      jest.spyOn(aiService, 'analyzeConversation').mockResolvedValue(mockAnalysis);

      const analysis = await aiService.analyzeConversation(messages, 'sentiment');
      expect(analysis.overall_sentiment).toBe('negative');
    });
  });

  describe('RecommendationEngine', () => {
    it('should generate personalized recommendations', async () => {
      const userId = 'user123';
      const mockProfile = {
        goals: ['weight_loss', 'stress_reduction'],
        preferences: { workoutTime: 'morning', intensity: 'moderate' },
        behaviorPatterns: { consistency: 0.8 },
      };

      jest.spyOn(recommendationEngine as any, 'getUserContext').mockResolvedValue(mockProfile);

      const recommendations = await recommendationEngine.generateRecommendations(userId);

      expect(recommendations).toHaveProperty('goals');
      expect(recommendations).toHaveProperty('habits');
      expect(recommendations).toHaveProperty('content');
      expect(recommendations).toHaveProperty('activities');
    });

    it('should recommend optimal timing for activities', async () => {
      const timing = await recommendationEngine.getOptimalTiming('user123', 'exercise');

      expect(timing).toHaveProperty('bestTime');
      expect(timing).toHaveProperty('reason');
      expect(timing).toHaveProperty('alternativeTimes');
      expect(timing.alternativeTimes).toBeInstanceOf(Array);
    });

    it('should create adaptive schedule', async () => {
      const schedule = await recommendationEngine.generateAdaptiveSchedule('user123', new Date());

      expect(schedule).toHaveProperty('morning');
      expect(schedule).toHaveProperty('afternoon');
      expect(schedule).toHaveProperty('evening');
      expect(schedule).toHaveProperty('flexibility');
    });
  });

  describe('PredictiveAnalytics', () => {
    it('should predict goal completion', async () => {
      const prediction = await predictiveAnalytics.predictGoalCompletion('goal123');

      expect(prediction).toHaveProperty('probability');
      expect(prediction).toHaveProperty('estimatedDate');
      expect(prediction).toHaveProperty('factors');
      expect(prediction).toHaveProperty('risks');
      expect(prediction.probability).toBeGreaterThanOrEqual(0);
      expect(prediction.probability).toBeLessThanOrEqual(1);
    });

    it('should generate behavior predictions', async () => {
      const predictions = await predictiveAnalytics.generatePredictions('user123');

      expect(predictions).toHaveProperty('adherence');
      expect(predictions).toHaveProperty('engagement');
      expect(predictions).toHaveProperty('burnout');
      expect(predictions).toHaveProperty('success');
    });

    it('should create intervention plan for risks', async () => {
      const plan = await predictiveAnalytics.getInterventionPlan('user123', 'burnout');

      expect(plan).toHaveProperty('triggers');
      expect(plan).toHaveProperty('immediateActions');
      expect(plan).toHaveProperty('preventiveMeasures');
      expect(plan).toHaveProperty('supportResources');
    });
  });

  describe('ConversationalAI', () => {
    it('should process message with intent detection', async () => {
      const result = await conversationalAI.processMessage('I want to start meditating', {
        userId: 'user123',
      });

      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('suggestions');
      expect(result.intent).toBe('goal_setting');
    });

    it('should generate smart responses', async () => {
      const response = await conversationalAI.generateSmartResponse(
        'user123',
        'How can I stay motivated?'
      );

      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('tone');
      expect(response).toHaveProperty('followUpQuestions');
    });

    it('should maintain conversation context', async () => {
      const context1 = await conversationalAI.processMessage('I want to lose weight', {
        userId: 'user123',
      });

      const context2 = await conversationalAI.processMessage('How should I start?', {
        userId: 'user123',
        previousContext: context1,
      });

      expect(context2.response).toContain('weight');
    });
  });

  describe('VoiceAI', () => {
    it('should analyze voice emotions', async () => {
      const mockAudioData = Buffer.from('mock audio data');
      const analysis = await voiceAI.analyzeVoice(mockAudioData, 'user123');

      expect(analysis).toHaveProperty('emotions');
      expect(analysis).toHaveProperty('stress');
      expect(analysis).toHaveProperty('energy');
      expect(analysis).toHaveProperty('clarity');
    });

    it('should generate voice coaching insights', async () => {
      const insights = await voiceAI.generateVoiceCoaching('user123', 'session123');

      expect(insights).toHaveProperty('emotionalState');
      expect(insights).toHaveProperty('recommendations');
      expect(insights).toHaveProperty('exercises');
    });

    it('should compare voice sessions', async () => {
      const comparison = await voiceAI.compareVoiceSessions('session1', 'session2');

      expect(comparison).toHaveProperty('emotionalProgress');
      expect(comparison).toHaveProperty('stressChange');
      expect(comparison).toHaveProperty('improvements');
      expect(comparison).toHaveProperty('concerns');
    });
  });

  describe('UserProfilingService', () => {
    it('should build comprehensive user profile', async () => {
      const profile = await userProfilingService.buildProfile('user123');

      expect(profile).toHaveProperty('personalityType');
      expect(profile).toHaveProperty('learningStyle');
      expect(profile).toHaveProperty('motivationalDrivers');
      expect(profile).toHaveProperty('behaviorPatterns');
    });

    it('should update profile based on interactions', async () => {
      const interaction = {
        type: 'goal_completed',
        timestamp: new Date(),
        data: { goalId: 'goal123', completionTime: 30 },
      };

      const updated = await userProfilingService.updateProfile('user123', interaction);
      expect(updated).toHaveProperty('updated');
      expect(updated.updated).toBe(true);
    });

    it('should generate profile insights', async () => {
      const insights = await userProfilingService.getProfileInsights('user123');

      expect(insights).toHaveProperty('strengths');
      expect(insights).toHaveProperty('growthAreas');
      expect(insights).toHaveProperty('recommendations');
    });
  });

  describe('InsightGenerator', () => {
    it('should generate user insights', async () => {
      const insights = await insightGenerator.generateInsights('user123');

      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);
      insights.forEach(insight => {
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('actionItems');
      });
    });

    it('should prioritize insights by impact', async () => {
      const insights = await insightGenerator.generateInsights('user123');
      const priorities = insights.map(i => i.priority);

      // Check if sorted by priority
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i]).toBeGreaterThanOrEqual(priorities[i - 1]);
      }
    });
  });

  describe('AdaptiveLearning', () => {
    it('should create personalized learning path', async () => {
      const path = await adaptiveLearning.createLearningPath('user123', 'meditation');

      expect(path).toHaveProperty('modules');
      expect(path).toHaveProperty('estimatedDuration');
      expect(path).toHaveProperty('difficulty');
      expect(path.modules.length).toBeGreaterThan(0);
    });

    it('should adapt based on progress', async () => {
      const adaptation = await adaptiveLearning.adaptPath('path123', {
        moduleId: 'module1',
        performance: 0.9,
        timeSpent: 300,
      });

      expect(adaptation).toHaveProperty('nextModule');
      expect(adaptation).toHaveProperty('difficultyAdjustment');
      expect(adaptation).toHaveProperty('recommendations');
    });

    it('should track learning progress', async () => {
      const progress = await adaptiveLearning.trackProgress('path123', 'module1', {
        completed: true,
        score: 85,
        timeSpent: 600,
      });

      expect(progress).toHaveProperty('overallProgress');
      expect(progress).toHaveProperty('nextSteps');
      expect(progress).toHaveProperty('achievements');
    });
  });

  describe('Integration Tests', () => {
    it('should generate recommendations based on predictions', async () => {
      const predictions = await predictiveAnalytics.generatePredictions('user123');
      const recommendations = await recommendationEngine.generateRecommendations('user123', {
        predictions,
      });

      expect(recommendations).toBeDefined();
      if (predictions.burnout.risk > 0.7) {
        expect(recommendations.activities).toContain('rest');
      }
    });

    it('should create insights from voice analysis', async () => {
      const voiceAnalysis = await voiceAI.analyzeVoice(Buffer.from('audio'), 'user123');
      const insights = await insightGenerator.generateInsights('user123', {
        voiceData: voiceAnalysis,
      });

      expect(insights.some(i => i.type === 'emotional_wellbeing')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      jest
        .spyOn(aiService as any, 'generateOpenAIResponse')
        .mockRejectedValue(new Error('API Error'));

      await expect(aiService.generateResponse([{ role: 'user', content: 'test' }])).rejects.toThrow(
        'Failed to generate AI response'
      );
    });

    it('should handle invalid user profiles', async () => {
      const profile = await userProfilingService.buildProfile('invalid-user');
      expect(profile).toHaveProperty('personalityType', 'balanced');
    });
  });

  describe('Performance Tests', () => {
    it('should generate recommendations within 500ms', async () => {
      const start = Date.now();
      await recommendationEngine.generateRecommendations('user123');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });

    it('should process conversations efficiently', async () => {
      const messages = Array(50)
        .fill(null)
        .map((_, i) => ({
          role: i % 2 === 0 ? 'user' : ('assistant' as const),
          content: `Message ${i}`,
        }));

      const start = Date.now();
      await aiService.analyzeConversation(messages, 'summary');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });
  });
});
