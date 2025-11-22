import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AIService, AIMessage } from '../../../services/ai/AIService';

// Mock OpenAI and Anthropic
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

// Mock cache service
jest.mock('../../../services/cache/UnifiedCacheService', () => ({
  getCacheService: () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
    getStats: () => ({ hits: 0, misses: 0 }),
    invalidate: jest.fn().mockResolvedValue(true)
  })
}));

describe('AIService Core Functionality', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
  });

  describe('Basic AI Response Generation', () => {
    it('should generate response using OpenAI', async () => {
      const messages: AIMessage[] = [
        { role: 'user', content: 'Help me set a fitness goal' }
      ];

      // Mock the private method instead of external API
      jest.spyOn(aiService as any, 'generateOpenAIResponse').mockResolvedValue({
        id: 'test-completion',
        content: 'Test AI response',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        model: 'gpt-4-turbo-preview'
      });

      const response = await aiService.generateResponse(messages, {
        provider: 'openai',
        useCache: false
      });

      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('usage');
      expect(response.content).toBe('Test AI response');
    });

    it('should generate coaching response with context', async () => {
      // Mock the generateResponse method for coaching
      jest.spyOn(aiService, 'generateResponse').mockResolvedValue({
        id: 'coaching-response',
        content: 'You are making great progress with your goals!',
        usage: { promptTokens: 15, completionTokens: 25, totalTokens: 40 },
        model: 'gpt-4-turbo-preview'
      });

      const response = await aiService.generateCoachingResponse(
        'How am I progressing with my goals?',
        {
          userId: 'user123',
          personality: 'motivator',
          provider: 'openai'
        }
      );

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('usage');
      expect(typeof response.content).toBe('string');
    });

    it('should analyze conversation for sentiment', async () => {
      const messages: AIMessage[] = [
        { role: 'user', content: 'I feel unmotivated' },
        { role: 'assistant', content: 'Let me help you get back on track' }
      ];

      // Mock the analysis response
      jest.spyOn(aiService as any, 'generateResponse').mockResolvedValueOnce({
        content: JSON.stringify({
          overall_sentiment: 'negative',
          emotion_breakdown: { sadness: 60, neutral: 40 },
          key_emotional_moments: ['unmotivated']
        })
      });

      const analysis = await aiService.analyzeConversation(messages, 'sentiment');
      
      expect(analysis).toHaveProperty('overall_sentiment');
      expect(analysis.overall_sentiment).toBe('negative');
    });
  });

  describe('AI Service Configuration', () => {
    it('should select optimal model based on task', () => {
      const coachingModel = aiService.getOptimalModel('coaching');
      expect(coachingModel.provider).toBe('openai');
      
      const analysisModel = aiService.getOptimalModel('analysis');
      expect(analysisModel.provider).toBe('claude');
    });

    it('should handle circuit breaker functionality', () => {
      const metrics = aiService.getMetrics();
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('totalErrors');
      expect(metrics).toHaveProperty('circuitBreakerState');
    });
  });

  describe('Health Check and Monitoring', () => {
    it('should perform health check', async () => {
      const health = await aiService.healthCheck();
      
      expect(health).toHaveProperty('openai');
      expect(health).toHaveProperty('claude');
      expect(health).toHaveProperty('cache');
      expect(health).toHaveProperty('circuitBreaker');
    });

    it('should track performance metrics', () => {
      const metrics = aiService.getMetrics();
      
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.totalErrors).toBe('number');
      expect(typeof metrics.averageResponseTime).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      // Mock API failure
      jest.spyOn(aiService as any, 'generateOpenAIResponse')
        .mockRejectedValueOnce(new Error('API Error'));

      await expect(
        aiService.generateResponse([{ role: 'user', content: 'test' }], { useCache: false })
      ).rejects.toThrow('Failed to generate AI response');
    });

    it('should handle malformed analysis responses', async () => {
      // Mock malformed JSON response
      jest.spyOn(aiService as any, 'generateResponse').mockResolvedValueOnce({
        content: 'invalid json response'
      });

      const messages: AIMessage[] = [
        { role: 'user', content: 'test message' }
      ];

      const analysis = await aiService.analyzeConversation(messages, 'sentiment');
      
      expect(analysis).toHaveProperty('error');
      expect(analysis.error).toBe('Failed to parse analysis');
    });
  });
});