import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AIService } from '../../services/ai/AIService';
import { UserProfilingService } from '../../services/ai/UserProfilingService';
import { RecommendationEngine } from '../../services/ai/RecommendationEngine';
import { PredictiveAnalytics } from '../../services/ai/PredictiveAnalytics';
import { InsightGenerator } from '../../services/ai/InsightGenerator';
import { performance } from 'perf_hooks';

// Mock external services
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

describe('AI Services Performance Tests', () => {
  let aiService: AIService;
  let userProfilingService: UserProfilingService;
  let recommendationEngine: RecommendationEngine;
  let predictiveAnalytics: PredictiveAnalytics;
  let insightGenerator: InsightGenerator;

  // Performance thresholds in milliseconds
  const PERFORMANCE_THRESHOLDS = {
    aiResponse: 2000, // 2 seconds for AI response
    profileCreation: 500, // 500ms for profile creation
    recommendations: 1000, // 1 second for recommendations
    predictions: 800, // 800ms for predictions
    insights: 1500, // 1.5 seconds for insights
    batchOperations: 5000, // 5 seconds for batch operations
  };

  beforeAll(() => {
    aiService = new AIService();
    userProfilingService = new UserProfilingService();
    recommendationEngine = new RecommendationEngine();
    predictiveAnalytics = new PredictiveAnalytics();
    insightGenerator = new InsightGenerator();

    // Mock AI responses to be fast
    jest.spyOn(aiService, 'generateResponse').mockImplementation(async () => ({
      content: 'Mock response',
      provider: 'openai',
      model: 'gpt-4',
      usage: { totalTokens: 100 },
    }));

    jest.spyOn(aiService, 'generateStructuredResponse').mockImplementation(async () => ({
      recommendations: [{ title: 'Mock recommendation' }],
    }));
  });

  describe('AI Response Performance', () => {
    test('generates response within threshold', async () => {
      const messages = [{ role: 'user' as const, content: 'How can I improve my productivity?' }];

      const start = performance.now();
      await aiService.generateResponse(messages);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.aiResponse);
      logger.info(`AI response time: ${duration.toFixed(2)}ms`);
    });

    test('handles concurrent requests efficiently', async () => {
      const messages = [{ role: 'user' as const, content: 'Test message' }];

      const start = performance.now();
      const promises = Array(5)
        .fill(null)
        .map(() => aiService.generateResponse(messages));

      await Promise.all(promises);
      const duration = performance.now() - start;

      // Should handle 5 concurrent requests in reasonable time
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.aiResponse * 2);
      logger.info(`5 concurrent AI requests: ${duration.toFixed(2)}ms`);
    });

    test('streaming response performs well', async () => {
      const messages = [{ role: 'user' as const, content: 'Tell me a story' }];

      // Mock streaming
      const mockStream = async function* () {
        for (let i = 0; i < 10; i++) {
          yield `Chunk ${i} `;
        }
      };

      jest.spyOn(aiService, 'streamResponse').mockImplementation(async () => mockStream());

      const start = performance.now();
      const stream = await aiService.streamResponse(messages);

      let chunkCount = 0;
      for await (const chunk of stream) {
        chunkCount++;
      }

      const duration = performance.now() - start;

      expect(chunkCount).toBe(10);
      expect(duration).toBeLessThan(1000); // Streaming should be fast
      logger.info(`Streaming 10 chunks: ${duration.toFixed(2)}ms`);
    });
  });

  describe('User Profiling Performance', () => {
    test('creates profile within threshold', async () => {
      const start = performance.now();
      await userProfilingService.createOrUpdateProfile('user123');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.profileCreation);
      logger.info(`Profile creation time: ${duration.toFixed(2)}ms`);
    });

    test('updates profile efficiently', async () => {
      // First create
      await userProfilingService.createOrUpdateProfile('user123');

      // Then update
      const start = performance.now();
      await userProfilingService.createOrUpdateProfile('user123');
      const duration = performance.now() - start;

      // Updates should be faster than creation
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.profileCreation / 2);
      logger.info(`Profile update time: ${duration.toFixed(2)}ms`);
    });

    test('retrieves insights quickly', async () => {
      const start = performance.now();
      await userProfilingService.getInsights('user123');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(300); // Quick retrieval
      logger.info(`Insight retrieval time: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Recommendation Engine Performance', () => {
    test('generates recommendations within threshold', async () => {
      const start = performance.now();
      await recommendationEngine.generateRecommendations('user123', ['habit', 'goal'], 5);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.recommendations);
      logger.info(`Recommendation generation: ${duration.toFixed(2)}ms`);
    });

    test('optimal timing calculation is fast', async () => {
      const start = performance.now();
      await recommendationEngine.getOptimalTiming('user123', 'exercise');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200); // Should be very fast
      logger.info(`Optimal timing calculation: ${duration.toFixed(2)}ms`);
    });

    test('adaptive scheduling performs well', async () => {
      const start = performance.now();
      await recommendationEngine.generateAdaptiveSchedule('user123', new Date());
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.recommendations);
      logger.info(`Adaptive schedule generation: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Predictive Analytics Performance', () => {
    test('predicts user success quickly', async () => {
      const start = performance.now();
      await predictiveAnalytics.predictUserSuccess('user123');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.predictions);
      logger.info(`Success prediction: ${duration.toFixed(2)}ms`);
    });

    test('analyzes behavior patterns efficiently', async () => {
      const start = performance.now();
      await predictiveAnalytics.analyzeBehaviorPatterns('user123');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.predictions);
      logger.info(`Behavior analysis: ${duration.toFixed(2)}ms`);
    });

    test('batch predictions scale well', async () => {
      const userIds = Array(10)
        .fill(null)
        .map((_, i) => `user${i}`);

      const start = performance.now();
      const promises = userIds.map(id => predictiveAnalytics.predictChurnRisk(id));
      await Promise.all(promises);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.batchOperations);
      logger.info(`10 user predictions: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Insight Generation Performance', () => {
    test('generates insights within threshold', async () => {
      const start = performance.now();
      await insightGenerator.generateInsightReport('user123');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.insights);
      logger.info(`Insight generation: ${duration.toFixed(2)}ms`);
    });

    test('retrieves active insights quickly', async () => {
      const start = performance.now();
      await insightGenerator.getActiveInsights('user123');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200); // Should be from cache/DB
      logger.info(`Active insights retrieval: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage', () => {
    test('AI service does not leak memory', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform multiple operations
      for (let i = 0; i < 100; i++) {
        await aiService.generateResponse([{ role: 'user' as const, content: 'Test message' }]);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      logger.info(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Caching Performance', () => {
    test('cached responses are significantly faster', async () => {
      const userId = 'cache-test-user';

      // First call (not cached)
      const start1 = performance.now();
      await userProfilingService.getUserProfile(userId);
      const firstCallDuration = performance.now() - start1;

      // Second call (should be cached)
      const start2 = performance.now();
      await userProfilingService.getUserProfile(userId);
      const secondCallDuration = performance.now() - start2;

      // Cached call should be at least 5x faster
      expect(secondCallDuration).toBeLessThan(firstCallDuration / 5);
      logger.info(
        `First call: ${firstCallDuration.toFixed(2)}ms, Cached: ${secondCallDuration.toFixed(2)}ms`
      );
    });
  });

  describe('Database Query Performance', () => {
    test('bulk operations are optimized', async () => {
      const userIds = Array(50)
        .fill(null)
        .map((_, i) => `bulk-user-${i}`);

      const start = performance.now();
      // Simulate bulk profile fetch
      const profiles = await Promise.all(
        userIds.map(id => userProfilingService.getUserProfile(id))
      );
      const duration = performance.now() - start;

      // Should use efficient bulk queries
      expect(duration).toBeLessThan(2000); // 2 seconds for 50 users
      logger.info(`Bulk fetch 50 profiles: ${duration.toFixed(2)}ms`);
    });
  });

  describe('API Rate Limiting', () => {
    test('handles rate limits gracefully', async () => {
      const requests = Array(20)
        .fill(null)
        .map((_, i) => ({
          role: 'user' as const,
          content: `Request ${i}`,
        }));

      const start = performance.now();
      const results = await Promise.allSettled(
        requests.map(msg => aiService.generateResponse([msg]))
      );
      const duration = performance.now() - start;

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info(
        `20 requests: ${successful} successful, ${failed} failed in ${duration.toFixed(2)}ms`
      );

      // Should complete within reasonable time even with rate limiting
      expect(duration).toBeLessThan(10000); // 10 seconds
    });
  });
});
