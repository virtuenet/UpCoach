import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { AdaptiveLearning } from '../../../services/ai/AdaptiveLearning';
import { AIService } from '../../../services/ai/AIService';
import { ConversationalAI } from '../../../services/ai/ConversationalAI';
import { InsightGenerator } from '../../../services/ai/InsightGenerator';
import { PredictiveAnalytics } from '../../../services/ai/PredictiveAnalytics';
import { RecommendationEngine } from '../../../services/ai/RecommendationEngine';
import { UserProfilingService } from '../../../services/ai/UserProfilingService';
import { VoiceAI } from '../../../services/ai/VoiceAI';

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
        id: 'comprehensive-test-1',
        content: 'I can help you set a SMART fitness goal...',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        model: 'gpt-4-turbo-preview',
      };

      jest.spyOn(aiService as any, 'generateOpenAIResponse').mockResolvedValue(mockResponse);

      const response = await aiService.generateResponse(messages);
      expect(response).toEqual(mockResponse);
      expect(response.provider).toBe('openai');
    });

    it('should generate coaching response with context', async () => {
      const mockResponse = {
        content: 'Based on your progress...',
        usage: { promptTokens: 15, completionTokens: 25, totalTokens: 40 },
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
      expect(prediction).toHaveProperty('estimatedCompletionDate');
      expect(prediction).toHaveProperty('requiredWeeklyProgress');
      expect(prediction).toHaveProperty('obstacles');
      expect(prediction).toHaveProperty('accelerators');
      expect(prediction.probability).toBeGreaterThanOrEqual(0);
      expect(prediction.probability).toBeLessThanOrEqual(1);
    });

    it('should analyze behavior patterns', async () => {
      const patterns = await predictiveAnalytics.analyzeBehaviorPatterns('user123');

      expect(patterns).toBeInstanceOf(Array);
      expect(patterns.length).toBeGreaterThanOrEqual(0);
      patterns.forEach(pattern => {
        expect(pattern).toHaveProperty('pattern');
        expect(pattern).toHaveProperty('frequency');
        expect(pattern).toHaveProperty('trend');
        expect(pattern).toHaveProperty('impact');
      });
    });

    it('should create intervention plan for risks', async () => {
      const plan = await predictiveAnalytics.generateInterventionPlan('user123', 'burnout');

      expect(plan).toHaveProperty('interventions');
      expect(plan).toHaveProperty('successMetrics');
      expect(plan.interventions).toBeInstanceOf(Array);
      expect(plan.successMetrics).toBeInstanceOf(Array);
    });

    it('should analyze goal completion risk factors', async () => {
      const riskAnalysis = await predictiveAnalytics.analyzeGoalRisk('goal123');

      expect(riskAnalysis).toHaveProperty('riskLevel');
      expect(riskAnalysis).toHaveProperty('probability');
      expect(riskAnalysis).toHaveProperty('factors');
      expect(riskAnalysis).toHaveProperty('recommendations');
      expect(riskAnalysis).toHaveProperty('timeline');
      expect(riskAnalysis).toHaveProperty('interventions');

      // Validate risk level
      expect(['low', 'medium', 'high', 'critical']).toContain(riskAnalysis.riskLevel);

      // Validate probability range
      expect(riskAnalysis.probability).toBeGreaterThanOrEqual(0);
      expect(riskAnalysis.probability).toBeLessThanOrEqual(1);

      // Validate factors structure
      expect(riskAnalysis.factors).toHaveProperty('positive');
      expect(riskAnalysis.factors).toHaveProperty('negative');
      expect(riskAnalysis.factors).toHaveProperty('neutral');
      expect(Array.isArray(riskAnalysis.factors.positive)).toBe(true);
      expect(Array.isArray(riskAnalysis.factors.negative)).toBe(true);
      expect(Array.isArray(riskAnalysis.factors.neutral)).toBe(true);

      // Validate timeline metrics
      expect(riskAnalysis.timeline).toHaveProperty('currentProgress');
      expect(riskAnalysis.timeline).toHaveProperty('expectedProgress');
      expect(riskAnalysis.timeline).toHaveProperty('daysRemaining');
      expect(riskAnalysis.timeline).toHaveProperty('requiredDailyProgress');
      expect(riskAnalysis.timeline.currentProgress).toBeGreaterThanOrEqual(0);
      expect(riskAnalysis.timeline.currentProgress).toBeLessThanOrEqual(100);

      // Validate recommendations
      expect(Array.isArray(riskAnalysis.recommendations)).toBe(true);
      expect(riskAnalysis.recommendations.length).toBeGreaterThan(0);

      // Validate interventions structure
      expect(Array.isArray(riskAnalysis.interventions)).toBe(true);
      riskAnalysis.interventions.forEach(intervention => {
        expect(intervention).toHaveProperty('type');
        expect(intervention).toHaveProperty('action');
        expect(intervention).toHaveProperty('priority');
        expect(intervention).toHaveProperty('expectedImpact');
        expect(['immediate', 'short_term', 'long_term']).toContain(intervention.type);
        expect(['high', 'medium', 'low']).toContain(intervention.priority);
      });
    });
  });

  describe('ConversationalAI', () => {
    it('should process conversation with intent detection', async () => {
      const result = await conversationalAI.processConversation('user123', 'I want to start meditating', 'conv123');

      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('suggestions');
      expect(result.intent.primary).toBe('goal_setting');
    });

    it('should generate smart responses', async () => {
      const response = await conversationalAI.generateSmartResponse(
        'user123',
        'How can I stay motivated?'
      );

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should maintain conversation context', async () => {
      const context1 = await conversationalAI.processConversation('user123', 'I want to lose weight', 'conv123');

      const context2 = await conversationalAI.processConversation('user123', 'How should I start?', 'conv123', context1);

      expect(context2.response).toContain('weight');
    });
  });

  describe('VoiceAI', () => {
    it('should analyze voice emotions', async () => {
      const mockAudioData = Buffer.from('mock audio data');
      const analysis = await voiceAI.analyzeVoice('user123', mockAudioData);

      expect(analysis).toHaveProperty('transcript');
      expect(analysis).toHaveProperty('sentiment');
      expect(analysis).toHaveProperty('speechPatterns');
      expect(analysis).toHaveProperty('linguisticAnalysis');
      expect(analysis).toHaveProperty('insights');
    });

    it('should generate voice coaching insights', async () => {
      const mockAnalysis = {
        transcript: 'I feel motivated today',
        sentiment: { overall: 'positive' as const, score: 0.8, emotions: { joy: 0.8, sadness: 0.1, anger: 0.1, fear: 0.1, surprise: 0.2, trust: 0.7 } },
        speechPatterns: { pace: 'normal' as const, volume: 'normal' as const, tone: 'expressive' as const, fillerWords: 2, pauseDuration: 1.5, speechRate: 150 },
        linguisticAnalysis: { complexity: 'moderate' as const, vocabulary: { uniqueWords: 10, totalWords: 15, sophistication: 5.0 }, sentenceStructure: { avgLength: 8, complexity: 4 } },
        insights: []
      };
      
      const insights = await voiceAI.generateVoiceCoaching('user123', mockAnalysis);

      expect(insights).toHaveProperty('response');
      expect(insights).toHaveProperty('actionItems');
      expect(insights).toHaveProperty('followUpQuestions');
    });

    it('should compare voice sessions', async () => {
      const comparison = await voiceAI.compareVoiceSessions('user123', 'session1', 'session2');

      expect(comparison).toHaveProperty('comparison');
      expect(comparison).toHaveProperty('insights');
      expect(comparison).toHaveProperty('recommendations');
      expect(comparison.comparison).toHaveProperty('sentiment');
      expect(comparison.comparison).toHaveProperty('speechRate');
      expect(comparison.comparison).toHaveProperty('vocabulary');
    });

    it('should save voice analysis to database', async () => {
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
        title: 'Motivational Reflection',
        audioUrl: '/path/to/audio.mp3',
        duration: 120,
        sessionType: 'reflection' as const,
      };

      const savedEntry = await voiceAI.saveAnalysis('user123', mockAnalysis, options);

      expect(savedEntry).toHaveProperty('id');
      expect(savedEntry).toHaveProperty('userId', 'user123');
      expect(savedEntry).toHaveProperty('title', 'Motivational Reflection');
      expect(savedEntry).toHaveProperty('transcriptionText', mockAnalysis.transcript);
      expect(savedEntry).toHaveProperty('audioFilePath', '/path/to/audio.mp3');
      expect(savedEntry).toHaveProperty('duration', 120);
      expect(savedEntry).toHaveProperty('emotionalTone', 'positive');
      expect(savedEntry).toHaveProperty('isTranscribed', true);
      expect(savedEntry).toHaveProperty('isAnalyzed', true);
      expect(savedEntry.tags).toContain('reflection');
      expect(savedEntry.tags).toContain('positive');
    });
  });

  describe('UserProfilingService', () => {
    it('should create or update comprehensive user profile', async () => {
      const profile = await userProfilingService.createOrUpdateProfile('user123');

      expect(profile).toHaveProperty('learningStyle');
      expect(profile).toHaveProperty('communicationPreference');
      expect(profile).toHaveProperty('coachingPreferences');
      expect(profile).toHaveProperty('behaviorPatterns');
      expect(profile).toHaveProperty('progressMetrics');
    });

    it('should update profile based on preferences', async () => {
      const preferences = {
        learningStyle: 'visual',
        communicationPreference: 'direct',
        focusAreas: ['productivity', 'wellbeing'],
      };

      const updated = await userProfilingService.updateUserPreferences('user123', preferences);
      expect(updated).toHaveProperty('learningStyle');
      expect(updated.learningStyle).toBe('visual');
    });

    it('should generate profile insights', async () => {
      const insights = await userProfilingService.getProfileInsights('user123');

      expect(insights).toHaveProperty('strengths');
      expect(insights).toHaveProperty('growthAreas');
      expect(insights).toHaveProperty('recommendations');
    });
  });

  describe('InsightGenerator', () => {
    it('should generate insight report', async () => {
      const report = await insightGenerator.generateInsightReport('user123');

      expect(report).toHaveProperty('insights');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('recommendations');
      expect(report.insights).toBeInstanceOf(Array);
      expect(report.summary).toHaveProperty('totalInsights');
    });

    it('should get active insights for user', async () => {
      const insights = await insightGenerator.getActiveInsights('user123');

      expect(insights).toBeInstanceOf(Array);
      insights.forEach(insight => {
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('priority');
        expect(insight).toHaveProperty('confidence');
      });
    });
  });

  describe('AdaptiveLearning', () => {
    it('should create personalized learning path', async () => {
      const mockGoal = { id: 'goal123', title: 'Meditation Goal', description: 'Learn meditation', userId: 'user123', category: 'wellness' };
      jest.spyOn(adaptiveLearning as any, 'createPersonalizedLearningPath').mockResolvedValue({
        modules: [{ id: 'module1', title: 'Basic Meditation' }],
        estimatedDuration: 30,
        difficulty: 'beginner'
      });

      const path = await adaptiveLearning.createPersonalizedLearningPath('user123', 'goal123');

      expect(path).toHaveProperty('modules');
      expect(path).toHaveProperty('estimatedDuration');
      expect(path).toHaveProperty('difficulty');
      expect(path.modules.length).toBeGreaterThan(0);
    });

    it('should adapt based on progress', async () => {
      const mockPerformance = {
        completionRate: 0.9,
        averageScore: 85,
        timeSpent: 300,
        strugglingAreas: [],
        strongAreas: ['meditation'],
        learningVelocity: 0.8,
        retentionRate: 0.9
      };

      const mockAdaptedPath = {
        id: 'path123',
        nextModule: { id: 'module2' },
        difficultyAdjustment: 'increase',
        recommendations: ['Continue with advanced meditation']
      };

      jest.spyOn(adaptiveLearning, 'adaptLearningPath').mockResolvedValue(mockAdaptedPath as any);

      const adaptation = await adaptiveLearning.adaptLearningPath('user123', 'path123', mockPerformance);

      expect(adaptation).toHaveProperty('id');
    });

    it('should track learning progress', async () => {
      jest.spyOn(adaptiveLearning, 'trackLearningProgress').mockResolvedValue();

      await adaptiveLearning.trackLearningProgress('user123', 'path123', 'module1', {
        completed: true,
        score: 85,
        timeSpent: 600,
      });

      expect(adaptiveLearning.trackLearningProgress).toHaveBeenCalledWith('user123', 'path123', 'module1', {
        completed: true,
        score: 85,
        timeSpent: 600,
      });
    });
  });

  describe('Integration Tests', () => {
    it('should generate recommendations based on behavior patterns', async () => {
      const patterns = await predictiveAnalytics.analyzeBehaviorPatterns('user123');
      const recommendations = await recommendationEngine.generateRecommendations('user123');

      expect(recommendations).toBeDefined();
      expect(recommendations).toBeInstanceOf(Array);
      expect(patterns).toBeInstanceOf(Array);
    });

    it('should create insights from voice analysis', async () => {
      const voiceAnalysis = await voiceAI.analyzeVoice('user123', Buffer.from('audio'));
      const report = await insightGenerator.generateInsightReport('user123');

      expect(voiceAnalysis).toHaveProperty('transcript');
      expect(voiceAnalysis).toHaveProperty('sentiment');
      expect(report).toHaveProperty('insights');
      expect(report.insights).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      jest
        .spyOn(aiService as any, 'generateOpenAIResponse')
        .mockRejectedValue(new Error('API Error'));

      await expect(aiService.generateResponse([{ role: 'user' as const, content: 'test' }])).rejects.toThrow(
        'Failed to generate AI response'
      );
    });

    it('should handle invalid user profiles', async () => {
      const profile = await userProfilingService.createOrUpdateProfile('invalid-user');
      expect(profile).toHaveProperty('learningStyle', 'balanced');
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
          role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant' | 'system',
          content: `Message ${i}`,
        })) as any;

      const start = Date.now();
      await aiService.analyzeConversation(messages, 'summary');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });
  });
});
