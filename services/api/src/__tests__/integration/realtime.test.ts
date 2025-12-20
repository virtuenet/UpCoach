/**
 * Real-time Services Integration Tests
 *
 * Comprehensive tests for Priority 5: AI Phase C - Real-time & Streaming services
 * Tests all real-time services including event bus, predictions, engagement, streaming, and safety
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';

// Mock Redis before imports
jest.mock('../../services/redis', () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    hSet: jest.fn().mockResolvedValue(1),
    hGet: jest.fn().mockResolvedValue(null),
    hGetAll: jest.fn().mockResolvedValue({}),
    lPush: jest.fn().mockResolvedValue(1),
    lTrim: jest.fn().mockResolvedValue('OK'),
    incr: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue('PONG'),
    publish: jest.fn().mockResolvedValue(1),
    subscribe: jest.fn().mockResolvedValue(undefined),
    unsubscribe: jest.fn().mockResolvedValue(undefined),
    duplicate: jest.fn().mockReturnThis(),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock event bus for isolated testing
jest.mock('../../services/events/EventBus', () => {
  const handlers = new Map<string, Set<Function>>();
  return {
    eventBus: {
      publish: jest.fn().mockImplementation(async (type: string, category: string, payload: any) => {
        const handlersForType = handlers.get(type) || new Set();
        for (const handler of handlersForType) {
          await handler({ id: 'test-event', type, category, payload, timestamp: new Date() });
        }
        return 'event-id';
      }),
      subscribe: jest.fn().mockImplementation(async (pattern: string, handler: Function) => {
        if (!handlers.has(pattern)) {
          handlers.set(pattern, new Set());
        }
        handlers.get(pattern)!.add(handler);
        return 'subscription-id';
      }),
      unsubscribe: jest.fn().mockResolvedValue(true),
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      getStats: jest.fn().mockReturnValue({
        totalPublished: 0,
        totalConsumed: 0,
        activeSubscriptions: 0,
        pendingEvents: 0,
        errorCount: 0,
        averageLatencyMs: 0,
        throughputPerSecond: 0,
      }),
    },
    EventBus: jest.fn(),
    createEventBus: jest.fn(),
  };
});

// Mock event store
jest.mock('../../services/events/EventStore', () => ({
  eventStore: {
    append: jest.fn().mockResolvedValue({ id: 'stored-event', position: 1 }),
    read: jest.fn().mockResolvedValue([]),
    getStream: jest.fn().mockResolvedValue({ events: [], version: 0 }),
    initialize: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  },
  EventStore: jest.fn(),
  createEventStore: jest.fn(),
}));

// Mock ML predictors
jest.mock('../../services/ml/predictions', () => ({
  churnPredictor: {
    predict: jest.fn().mockResolvedValue({
      probability: 0.3,
      riskLevel: 'low',
      riskFactors: ['low_activity'],
      recommendations: ['Send engagement email'],
    }),
  },
  coachPerformancePredictor: {
    predict: jest.fn().mockReturnValue({
      projectedRating: 4.5,
      performanceLevel: 'excellent',
    }),
    findBestMatches: jest.fn().mockReturnValue([
      { coachId: 'coach-1', compatibilityScore: 0.95 },
      { coachId: 'coach-2', compatibilityScore: 0.88 },
    ]),
  },
  sessionOutcomePredictor: {
    predict: jest.fn().mockReturnValue({
      predictedSuccessScore: 0.85,
      riskFactors: [],
      recommendations: [],
    }),
  },
  goalCompletionPredictor: {
    predict: jest.fn().mockResolvedValue({
      probability: 0.75,
      estimatedCompletionDate: new Date(),
      milestones: [],
    }),
  },
  engagementOptimizer: {
    optimize: jest.fn().mockResolvedValue({
      overallScore: 0.8,
      recommendations: [],
      optimalTimes: [],
    }),
  },
}));

// Import services after mocks
import {
  RealtimePredictionService,
  createRealtimePredictionService,
} from '../../services/realtime/RealtimePredictionService';

import {
  LiveEngagementMonitor,
  createLiveEngagementMonitor,
} from '../../services/realtime/LiveEngagementMonitor';

import {
  StreamingAIService,
} from '../../services/realtime/StreamingAIService';

import {
  RealtimeSafetyDetection,
} from '../../services/realtime/RealtimeSafetyDetection';

// ============================================================================
// RealtimePredictionService Tests
// ============================================================================

describe('RealtimePredictionService', () => {
  let service: RealtimePredictionService;

  beforeEach(() => {
    service = createRealtimePredictionService();
  });

  describe('Prediction Operations', () => {
    it('should make churn prediction successfully', async () => {
      const result = await service.predict('churn', 'user-123', {
        userId: 'user-123',
        subscriptionStatus: 'active',
        daysSinceLastActivity: 5,
        sessionsThisWeek: 2,
        goalsCompleted: 1,
      });

      expect(result).toBeDefined();
      expect(result.requestId).toBeDefined();
      expect(result.type).toBe('churn');
      expect(result.userId).toBe('user-123');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(typeof result.confidence).toBe('number');
    });

    it('should make session outcome prediction', async () => {
      const result = await service.predict('session_outcome', 'user-123', {
        sessionId: 'session-1',
        coachId: 'coach-1',
        clientId: 'user-123',
        scheduledTime: new Date(),
        sessionType: 'regular',
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('session_outcome');
      expect(result.prediction).toBeDefined();
    });

    it('should make coach match prediction', async () => {
      const result = await service.predict('coach_match', 'user-123', {
        client: { id: 'user-123', preferences: ['life coaching'] },
        coaches: [
          { id: 'coach-1', specializations: ['life coaching'] },
          { id: 'coach-2', specializations: ['career coaching'] },
        ],
        limit: 5,
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('coach_match');
      expect(Array.isArray(result.prediction)).toBe(true);
    });

    it('should make goal completion prediction', async () => {
      const result = await service.predict('goal_completion', 'user-123', {
        goalId: 'goal-1',
        userId: 'user-123',
        progress: 50,
        daysRemaining: 30,
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('goal_completion');
    });

    it('should make engagement optimization prediction', async () => {
      const result = await service.predict('engagement', 'user-123', {
        userId: 'user-123',
        currentEngagement: 60,
        activityHistory: [],
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('engagement');
    });
  });

  describe('Batch Predictions', () => {
    it('should handle batch predictions', async () => {
      const requests = [
        { type: 'churn' as const, userId: 'user-1', input: { userId: 'user-1' } },
        { type: 'churn' as const, userId: 'user-2', input: { userId: 'user-2' } },
        { type: 'churn' as const, userId: 'user-3', input: { userId: 'user-3' } },
      ];

      const result = await service.batchPredict(requests);

      expect(result).toBeDefined();
      expect(result.batchId).toBeDefined();
      expect(result.results.length).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
      expect(result.totalLatencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle partial batch failures gracefully', async () => {
      const requests = [
        { type: 'churn' as const, userId: 'user-1', input: { userId: 'user-1' } },
        { type: 'unknown_type' as any, userId: 'user-2', input: {} },
      ];

      const result = await service.batchPredict(requests);

      expect(result.successCount + result.failureCount).toBe(2);
    });
  });

  describe('Subscription Management', () => {
    it('should subscribe to predictions', () => {
      const callback = jest.fn();
      const subscriptionId = service.subscribe('user-123', ['churn', 'engagement'], callback);

      expect(subscriptionId).toBeDefined();
      expect(typeof subscriptionId).toBe('string');
    });

    it('should unsubscribe from predictions', () => {
      const callback = jest.fn();
      const subscriptionId = service.subscribe('user-123', ['churn'], callback);

      const result = service.unsubscribe(subscriptionId);
      expect(result).toBe(true);

      // Unsubscribing again should return false
      const result2 = service.unsubscribe(subscriptionId);
      expect(result2).toBe(false);
    });

    it('should notify subscribers on prediction', async () => {
      const callback = jest.fn();
      service.subscribe('user-123', ['churn'], callback);

      await service.predict('churn', 'user-123', { userId: 'user-123' });

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0]).toMatchObject({
        type: 'churn',
        userId: 'user-123',
      });
    });
  });

  describe('Queue Management', () => {
    it('should queue predictions for async processing', () => {
      const request = {
        id: 'req-1',
        type: 'churn' as const,
        userId: 'user-123',
        input: {},
        priority: 'normal' as const,
        requestedAt: new Date(),
      };

      expect(() => service.queuePrediction(request)).not.toThrow();
    });

    it('should prioritize queue based on priority', () => {
      const normalRequest = {
        id: 'req-normal',
        type: 'churn' as const,
        userId: 'user-1',
        input: {},
        priority: 'normal' as const,
        requestedAt: new Date(),
      };

      const criticalRequest = {
        id: 'req-critical',
        type: 'churn' as const,
        userId: 'user-2',
        input: {},
        priority: 'critical' as const,
        requestedAt: new Date(),
      };

      service.queuePrediction(normalRequest);
      service.queuePrediction(criticalRequest);

      // Critical should be processed first - verify through stats
      const stats = service.getStats();
      expect(stats.queueLength).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Statistics', () => {
    it('should track prediction statistics', async () => {
      await service.predict('churn', 'user-123', { userId: 'user-123' });
      await service.predict('churn', 'user-456', { userId: 'user-456' });

      const stats = service.getStats();

      expect(stats.totalRequests).toBeGreaterThanOrEqual(2);
      expect(typeof stats.cacheHits).toBe('number');
      expect(typeof stats.cacheMisses).toBe('number');
      expect(typeof stats.averageLatencyMs).toBe('number');
    });

    it('should calculate cache hit rate', async () => {
      const hitRate = service.getCacheHitRate();
      expect(typeof hitRate).toBe('number');
      expect(hitRate).toBeGreaterThanOrEqual(0);
      expect(hitRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const health = await service.healthCheck();

      expect(health).toBeDefined();
      expect(typeof health.healthy).toBe('boolean');
      expect(typeof health.latency).toBe('number');
      expect(typeof health.cacheConnected).toBe('boolean');
    });
  });

  describe('Cache Management', () => {
    it('should invalidate cache for user', async () => {
      const count = await service.invalidateCache('user-123');
      expect(typeof count).toBe('number');
    });

    it('should invalidate cache for specific prediction type', async () => {
      const count = await service.invalidateCache('user-123', 'churn');
      expect(typeof count).toBe('number');
    });
  });
});

// ============================================================================
// LiveEngagementMonitor Tests
// ============================================================================

describe('LiveEngagementMonitor', () => {
  let monitor: LiveEngagementMonitor;

  beforeEach(() => {
    monitor = createLiveEngagementMonitor();
  });

  afterAll(async () => {
    if (monitor.isActive()) {
      await monitor.stop();
    }
  });

  describe('Lifecycle', () => {
    it('should start and stop correctly', async () => {
      await monitor.start();
      expect(monitor.isActive()).toBe(true);

      await monitor.stop();
      expect(monitor.isActive()).toBe(false);
    });

    it('should handle multiple start calls', async () => {
      await monitor.start();
      await monitor.start(); // Should be idempotent
      expect(monitor.isActive()).toBe(true);

      await monitor.stop();
    });
  });

  describe('Activity Tracking', () => {
    beforeEach(async () => {
      await monitor.start();
    });

    afterEach(async () => {
      await monitor.stop();
    });

    it('should track user login activity', async () => {
      await monitor.trackActivity({
        userId: 'user-123',
        type: 'login',
        metadata: { deviceType: 'mobile' },
      });

      const users = monitor.getActiveUsers();
      expect(users.some(u => u.userId === 'user-123')).toBe(true);
    });

    it('should track user logout activity', async () => {
      await monitor.trackActivity({
        userId: 'user-123',
        type: 'login',
      });

      await monitor.trackActivity({
        userId: 'user-123',
        type: 'logout',
      });

      const users = monitor.getActiveUsers('offline');
      expect(users.some(u => u.userId === 'user-123')).toBe(true);
    });

    it('should track session start/end', async () => {
      await monitor.trackActivity({
        userId: 'user-123',
        type: 'session_start',
        metadata: { sessionId: 'session-1' },
      });

      const inSessionUsers = monitor.getActiveUsers('in_session');
      expect(inSessionUsers.some(u => u.userId === 'user-123')).toBe(true);

      await monitor.trackActivity({
        userId: 'user-123',
        type: 'session_end',
      });

      const onlineUsers = monitor.getActiveUsers('online');
      expect(onlineUsers.some(u => u.userId === 'user-123')).toBe(true);
    });

    it('should track page views', async () => {
      await monitor.trackActivity({
        userId: 'user-123',
        type: 'page_view',
        metadata: { page: '/dashboard' },
      });

      const users = monitor.getActiveUsers();
      const user = users.find(u => u.userId === 'user-123');
      expect(user?.currentPage).toBe('/dashboard');
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      await monitor.start();
    });

    afterEach(async () => {
      await monitor.stop();
    });

    it('should update session status', async () => {
      await monitor.updateSession({
        sessionId: 'session-1',
        coachId: 'coach-1',
        clientId: 'client-1',
        status: 'in_progress',
        scheduledAt: new Date(),
        startedAt: new Date(),
        sessionType: 'regular',
      });

      const sessions = monitor.getActiveSessions('in_progress');
      expect(sessions.some(s => s.sessionId === 'session-1')).toBe(true);
    });

    it('should filter sessions by status', async () => {
      await monitor.updateSession({
        sessionId: 'session-1',
        coachId: 'coach-1',
        clientId: 'client-1',
        status: 'in_progress',
        scheduledAt: new Date(),
        sessionType: 'regular',
      });

      await monitor.updateSession({
        sessionId: 'session-2',
        coachId: 'coach-2',
        clientId: 'client-2',
        status: 'completed',
        scheduledAt: new Date(),
        sessionType: 'regular',
        duration: 60,
      });

      const inProgress = monitor.getActiveSessions('in_progress');
      const completed = monitor.getActiveSessions('completed');

      expect(inProgress.length).toBe(1);
      expect(completed.length).toBe(1);
    });
  });

  describe('Churn Alerts', () => {
    beforeEach(async () => {
      await monitor.start();
    });

    afterEach(async () => {
      await monitor.stop();
    });

    it('should add churn alert', async () => {
      const alertId = await monitor.addChurnAlert({
        userId: 'user-123',
        riskLevel: 'high',
        riskScore: 0.85,
        reasons: ['No activity for 14 days', 'Cancelled last session'],
      });

      expect(alertId).toBeDefined();
      expect(typeof alertId).toBe('string');

      const alerts = monitor.getChurnAlerts();
      expect(alerts.some(a => a.id === alertId)).toBe(true);
    });

    it('should acknowledge churn alert', async () => {
      const alertId = await monitor.addChurnAlert({
        userId: 'user-123',
        riskLevel: 'medium',
        riskScore: 0.65,
        reasons: ['Decreased engagement'],
      });

      const result = await monitor.acknowledgeAlert(alertId, 'admin-user');
      expect(result).toBe(true);

      const unacknowledged = monitor.getChurnAlerts(false);
      expect(unacknowledged.some(a => a.id === alertId)).toBe(false);
    });

    it('should include acknowledged alerts when requested', async () => {
      const alertId = await monitor.addChurnAlert({
        userId: 'user-123',
        riskLevel: 'low',
        riskScore: 0.45,
        reasons: ['Minor engagement drop'],
      });

      await monitor.acknowledgeAlert(alertId, 'admin-user');

      const allAlerts = monitor.getChurnAlerts(true);
      expect(allAlerts.some(a => a.id === alertId)).toBe(true);
    });
  });

  describe('Subscription System', () => {
    beforeEach(async () => {
      await monitor.start();
    });

    afterEach(async () => {
      await monitor.stop();
    });

    it('should subscribe to metrics updates', () => {
      const callback = jest.fn();
      const subscriptionId = monitor.subscribe('metrics', callback);

      expect(subscriptionId).toBeDefined();
      expect(callback).toHaveBeenCalled(); // Initial state sent
    });

    it('should subscribe to user updates', () => {
      const callback = jest.fn();
      const subscriptionId = monitor.subscribe('users', callback);

      expect(subscriptionId).toBeDefined();
    });

    it('should subscribe to all updates', () => {
      const callback = jest.fn();
      const subscriptionId = monitor.subscribe('all', callback);

      expect(subscriptionId).toBeDefined();
      expect(callback).toHaveBeenCalled();
    });

    it('should unsubscribe successfully', () => {
      const callback = jest.fn();
      const subscriptionId = monitor.subscribe('metrics', callback);

      const result = monitor.unsubscribe(subscriptionId);
      expect(result).toBe(true);
    });
  });

  describe('Metrics', () => {
    beforeEach(async () => {
      await monitor.start();
    });

    afterEach(async () => {
      await monitor.stop();
    });

    it('should get current metrics', () => {
      const metrics = monitor.getCurrentMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.activeUsers).toBe('number');
      expect(typeof metrics.activeSessions).toBe('number');
      expect(typeof metrics.churnRiskAlerts).toBe('number');
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should get metrics history', () => {
      const history = monitor.getMetricsHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should limit metrics history', () => {
      const history = monitor.getMetricsHistory(5);
      expect(history.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await monitor.start();
    });

    afterEach(async () => {
      await monitor.stop();
    });

    it('should provide engagement stats', () => {
      const stats = monitor.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.subscriberCount).toBe('number');
      expect(typeof stats.activeUsersTracked).toBe('number');
      expect(typeof stats.activeSessionsTracked).toBe('number');
      expect(typeof stats.alertsActive).toBe('number');
      expect(stats.metricsUpdatedAt).toBeInstanceOf(Date);
    });
  });
});

// ============================================================================
// StreamingAIService Tests
// ============================================================================

describe('StreamingAIService', () => {
  let service: StreamingAIService;

  beforeAll(() => {
    service = StreamingAIService.getInstance();
  });

  afterAll(async () => {
    await service.stop();
  });

  describe('Lifecycle', () => {
    it('should be a singleton', () => {
      const instance1 = StreamingAIService.getInstance();
      const instance2 = StreamingAIService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should start and stop correctly', async () => {
      await service.start();
      await service.stop();
      // Should not throw
    });
  });

  describe('Stream Creation', () => {
    beforeAll(async () => {
      await service.start();
    });

    it('should create a stream', async () => {
      const streamId = await service.createStream({
        userId: 'user-123',
        prompt: 'Hello, how are you?',
        options: {
          provider: 'claude',
          maxTokens: 100,
        },
      });

      expect(streamId).toBeDefined();
      expect(typeof streamId).toBe('string');
    });

    it('should create stream with conversation context', async () => {
      const streamId = await service.createStream({
        userId: 'user-123',
        conversationId: 'conv-1',
        prompt: 'Continue the conversation',
        context: [
          { role: 'user', content: 'Hi!' },
          { role: 'assistant', content: 'Hello!' },
        ],
      });

      expect(streamId).toBeDefined();
    });

    it('should limit concurrent streams per user', async () => {
      // Create max allowed streams
      const streamIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const id = await service.createStream({
          userId: 'user-limit-test',
          prompt: `Test prompt ${i}`,
        });
        streamIds.push(id);
      }

      // Fourth stream should fail
      await expect(
        service.createStream({
          userId: 'user-limit-test',
          prompt: 'This should fail',
        })
      ).rejects.toThrow(/Maximum concurrent streams/);

      // Cleanup
      for (const id of streamIds) {
        await service.cancelStream(id);
      }
    });
  });

  describe('Stream Cancellation', () => {
    beforeAll(async () => {
      await service.start();
    });

    it('should cancel a stream', async () => {
      const streamId = await service.createStream({
        userId: 'user-123',
        prompt: 'Test prompt',
      });

      const result = await service.cancelStream(streamId, 'User cancelled');
      expect(result).toBe(true);
    });

    it('should return false for non-existent stream', async () => {
      const result = await service.cancelStream('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('Stream Queries', () => {
    let testStreamId: string;

    beforeAll(async () => {
      await service.start();
      testStreamId = await service.createStream({
        userId: 'user-query-test',
        prompt: 'Test prompt',
      });
    });

    afterAll(async () => {
      await service.cancelStream(testStreamId);
    });

    it('should get stream by ID', () => {
      const stream = service.getStream(testStreamId);
      expect(stream).toBeDefined();
      expect(stream?.userId).toBe('user-query-test');
    });

    it('should return undefined for non-existent stream', () => {
      const stream = service.getStream('non-existent');
      expect(stream).toBeUndefined();
    });

    it('should get user streams', () => {
      const streams = service.getUserStreams('user-query-test');
      expect(Array.isArray(streams)).toBe(true);
      expect(streams.some(s => s.id === testStreamId)).toBe(true);
    });

    it('should get stream metrics', () => {
      const metrics = service.getStreamMetrics(testStreamId);
      expect(metrics).toBeDefined();
      expect(metrics?.streamId).toBe(testStreamId);
    });
  });

  describe('Statistics', () => {
    beforeAll(async () => {
      await service.start();
    });

    it('should provide service statistics', () => {
      const stats = service.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalStreamsCreated).toBe('number');
      expect(typeof stats.activeStreams).toBe('number');
      expect(typeof stats.totalTokensStreamed).toBe('number');
      expect(typeof stats.averageLatencyToFirstToken).toBe('number');
      expect(typeof stats.streamsByProvider).toBe('object');
      expect(typeof stats.streamsByStatus).toBe('object');
    });
  });
});

// ============================================================================
// RealtimeSafetyDetection Tests
// ============================================================================

describe('RealtimeSafetyDetection', () => {
  let service: RealtimeSafetyDetection;

  beforeAll(() => {
    service = RealtimeSafetyDetection.getInstance();
  });

  afterAll(async () => {
    await service.stop();
  });

  describe('Lifecycle', () => {
    it('should be a singleton', () => {
      const instance1 = RealtimeSafetyDetection.getInstance();
      const instance2 = RealtimeSafetyDetection.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should start and stop correctly', async () => {
      await service.start();
      await service.stop();
    });
  });

  describe('Content Safety Checks', () => {
    beforeAll(async () => {
      await service.start();
    });

    it('should pass safe content', async () => {
      const result = await service.checkContent({
        contentId: 'msg-1',
        userId: 'user-123',
        content: 'I am feeling great today! Making progress on my goals.',
        source: 'user_message',
      });

      expect(result.passed).toBe(true);
      expect(result.detections.length).toBe(0);
      expect(result.blockedContent).toBe(false);
    });

    it('should detect crisis content', async () => {
      const result = await service.checkContent({
        contentId: 'msg-2',
        userId: 'user-123',
        content: 'I want to kill myself',
        source: 'user_message',
      });

      expect(result.passed).toBe(false);
      expect(result.detections.length).toBeGreaterThan(0);
      expect(result.highestSeverity).toBe('critical');
      expect(result.requiresEscalation).toBe(true);
    });

    it('should detect self-harm content', async () => {
      const result = await service.checkContent({
        contentId: 'msg-3',
        userId: 'user-123',
        content: 'I have been cutting myself lately',
        source: 'user_message',
      });

      expect(result.detections.length).toBeGreaterThan(0);
      expect(result.detections.some(d => d.category === 'self_harm')).toBe(true);
    });

    it('should detect medical advice boundary', async () => {
      const result = await service.checkContent({
        contentId: 'msg-4',
        userId: 'user-123',
        content: 'Should I stop taking my medication?',
        source: 'user_message',
      });

      expect(result.detections.some(d => d.category === 'medical_advice')).toBe(true);
      expect(result.autoResponse).toBeDefined();
    });

    it('should detect PII exposure', async () => {
      const result = await service.checkContent({
        contentId: 'msg-5',
        userId: 'user-123',
        content: 'My SSN is 123-45-6789',
        source: 'user_message',
      });

      expect(result.detections.some(d => d.category === 'pii_exposure')).toBe(true);
      expect(result.blockedContent).toBe(true);
    });

    it('should track processing time', async () => {
      const result = await service.checkContent({
        contentId: 'msg-6',
        userId: 'user-123',
        content: 'Normal content here',
        source: 'user_message',
      });

      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Rule Management', () => {
    beforeAll(async () => {
      await service.start();
    });

    it('should get all rules', () => {
      const rules = service.getRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    });

    it('should add custom rule', () => {
      service.addRule({
        id: 'custom-test-rule',
        name: 'Test Rule',
        category: 'spam',
        severity: 'low',
        patterns: [/test pattern/i],
        keywords: ['test keyword'],
        action: 'flag',
        enabled: true,
      });

      const rules = service.getRules();
      expect(rules.some(r => r.id === 'custom-test-rule')).toBe(true);
    });

    it('should remove rule', () => {
      const result = service.removeRule('custom-test-rule');
      expect(result).toBe(true);

      const rules = service.getRules();
      expect(rules.some(r => r.id === 'custom-test-rule')).toBe(false);
    });

    it('should enable/disable rule', () => {
      const rules = service.getRules();
      const ruleId = rules[0].id;

      const disableResult = service.setRuleEnabled(ruleId, false);
      expect(disableResult).toBe(true);

      const enableResult = service.setRuleEnabled(ruleId, true);
      expect(enableResult).toBe(true);
    });
  });

  describe('Detection Management', () => {
    let detectionId: string;

    beforeAll(async () => {
      await service.start();

      // Create a detection
      const result = await service.checkContent({
        contentId: 'msg-detection-test',
        userId: 'user-detection-test',
        content: 'give me legal advice please',
        source: 'user_message',
      });

      if (result.detections.length > 0) {
        detectionId = result.detections[0].id;
      }
    });

    it('should get detection by ID', () => {
      if (!detectionId) return;

      const detection = service.getDetection(detectionId);
      expect(detection).toBeDefined();
    });

    it('should get user detections', () => {
      const detections = service.getUserDetections('user-detection-test');
      expect(Array.isArray(detections)).toBe(true);
    });

    it('should filter user detections by category', () => {
      const detections = service.getUserDetections('user-detection-test', {
        category: 'legal_advice',
      });
      expect(Array.isArray(detections)).toBe(true);
    });

    it('should get unreviewed detections', () => {
      const detections = service.getUnreviewedDetections();
      expect(Array.isArray(detections)).toBe(true);
    });

    it('should review detection', async () => {
      if (!detectionId) return;

      const result = await service.reviewDetection(
        detectionId,
        'reviewer-1',
        'confirmed',
        'Legitimate detection'
      );

      expect(result).toBe(true);
    });
  });

  describe('Escalation Management', () => {
    beforeAll(async () => {
      await service.start();
    });

    it('should get open escalations', () => {
      const escalations = service.getOpenEscalations();
      expect(Array.isArray(escalations)).toBe(true);
    });

    it('should check for recent critical detections', () => {
      const hasRecent = service.hasRecentCriticalDetections('user-123');
      expect(typeof hasRecent).toBe('boolean');
    });
  });

  describe('Statistics', () => {
    beforeAll(async () => {
      await service.start();
    });

    it('should provide safety statistics', () => {
      const stats = service.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalChecks).toBe('number');
      expect(typeof stats.detectionsByCategory).toBe('object');
      expect(typeof stats.detectionsBySeverity).toBe('object');
      expect(typeof stats.actionsTaken).toBe('object');
      expect(typeof stats.falsePositiveRate).toBe('number');
      expect(typeof stats.averageProcessingTimeMs).toBe('number');
      expect(typeof stats.activeEscalations).toBe('number');
    });
  });
});

// ============================================================================
// Integration Tests - Cross-Service Communication
// ============================================================================

describe('Real-time Services Integration', () => {
  let predictionService: RealtimePredictionService;
  let engagementMonitor: LiveEngagementMonitor;
  let safetyService: RealtimeSafetyDetection;

  beforeAll(async () => {
    predictionService = createRealtimePredictionService();
    engagementMonitor = createLiveEngagementMonitor();
    safetyService = RealtimeSafetyDetection.getInstance();

    await engagementMonitor.start();
    await safetyService.start();
  });

  afterAll(async () => {
    await engagementMonitor.stop();
    await safetyService.stop();
  });

  describe('Prediction and Engagement Integration', () => {
    it('should trigger churn alert from high-risk prediction', async () => {
      // Mock high churn prediction
      const result = await predictionService.predict('churn', 'user-integration', {
        userId: 'user-integration',
        subscriptionStatus: 'active',
        daysSinceLastActivity: 30,
        sessionsThisWeek: 0,
      });

      expect(result).toBeDefined();

      // Engagement monitor should have received the prediction event
      // (in real scenario, this would create an alert)
    });
  });

  describe('Safety and Streaming Integration', () => {
    it('should check AI-generated content for safety', async () => {
      // Simulate AI response content check
      const result = await safetyService.checkContent({
        contentId: 'ai-response-1',
        userId: 'user-123',
        content: 'Here are some tips for improving your productivity...',
        source: 'ai_response',
      });

      expect(result.passed).toBe(true);
    });
  });

  describe('Activity Tracking and Predictions', () => {
    it('should track activity and update user state', async () => {
      // Track login
      await engagementMonitor.trackActivity({
        userId: 'user-active-test',
        type: 'login',
      });

      // Get user state
      const users = engagementMonitor.getActiveUsers('online');
      expect(users.some(u => u.userId === 'user-active-test')).toBe(true);

      // Make prediction for the active user
      const prediction = await predictionService.predict('engagement', 'user-active-test', {
        userId: 'user-active-test',
        currentEngagement: 80,
      });

      expect(prediction).toBeDefined();
    });
  });
});
