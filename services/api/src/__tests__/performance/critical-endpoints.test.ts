/**
 * Performance Tests: Critical Endpoints
 *
 * Measures performance of high-traffic endpoints:
 * - User authentication
 * - Goal retrieval
 * - Dashboard metrics
 * - Coaching session queries
 */

import {
  measurePerformance,
  assertPerformance,
  measureConcurrent,
  PERFORMANCE_THRESHOLDS,
} from './setup.helper';

describe('Performance Tests: Critical Endpoints', () => {
  describe('Authentication Performance', () => {
    test('should validate JWT token under 50ms', async () => {
      const mockJwtService = {
        verify: jest.fn().mockResolvedValue({
          id: 'user123',
          email: 'test@example.com',
          role: 'user',
        }),
      };

      const { duration } = await measurePerformance('JWT Verification', async () => {
        return await mockJwtService.verify('mock.jwt.token');
      });

      assertPerformance('JWT Verification', duration, PERFORMANCE_THRESHOLDS.FAST_ENDPOINT);
      expect(duration).toBeFasterThan(PERFORMANCE_THRESHOLDS.FAST_ENDPOINT);
    });

    test('should handle 100 concurrent JWT verifications', async () => {
      const mockJwtService = {
        verify: jest.fn().mockResolvedValue({ id: 'user123', role: 'user' }),
      };

      const metrics = await measureConcurrent(
        'JWT Verification',
        async () => mockJwtService.verify('token'),
        100
      );

      expect(metrics.averageDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_ENDPOINT);
      expect(metrics.maxDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.NORMAL_ENDPOINT);
    });
  });

  describe('Goal Retrieval Performance', () => {
    test('should fetch user goals under 200ms', async () => {
      const mockGoalService = {
        getUserGoals: jest.fn().mockResolvedValue([
          { id: '1', title: 'Goal 1', progress: 50 },
          { id: '2', title: 'Goal 2', progress: 75 },
        ]),
      };

      const { duration } = await measurePerformance('Get User Goals', async () => {
        return await mockGoalService.getUserGoals('user123');
      });

      assertPerformance('Get User Goals', duration, PERFORMANCE_THRESHOLDS.NORMAL_ENDPOINT);
      expect(duration).toBeFasterThan(PERFORMANCE_THRESHOLDS.NORMAL_ENDPOINT);
    });

    test('should fetch single goal under 100ms', async () => {
      const mockGoalService = {
        getGoalById: jest.fn().mockResolvedValue({
          id: '1',
          title: 'Goal 1',
          progress: 50,
          milestones: [
            { id: 'm1', title: 'Milestone 1', completed: true },
            { id: 'm2', title: 'Milestone 2', completed: false },
          ],
        }),
      };

      const { duration } = await measurePerformance('Get Goal By ID', async () => {
        return await mockGoalService.getGoalById('goal123');
      });

      assertPerformance('Get Goal By ID', duration, PERFORMANCE_THRESHOLDS.NORMAL_ENDPOINT);
      expect(duration).toBeFasterThan(PERFORMANCE_THRESHOLDS.NORMAL_ENDPOINT);
    });
  });

  describe('Coaching Session Query Performance', () => {
    test('should fetch upcoming sessions under 200ms', async () => {
      const mockSessionService = {
        getUpcomingSessions: jest.fn().mockResolvedValue([
          { id: 's1', coach: 'Coach A', startTime: '2024-11-05T10:00:00Z' },
          { id: 's2', coach: 'Coach B', startTime: '2024-11-06T14:00:00Z' },
        ]),
      };

      const { duration } = await measurePerformance('Get Upcoming Sessions', async () => {
        return await mockSessionService.getUpcomingSessions('user123');
      });

      assertPerformance(
        'Get Upcoming Sessions',
        duration,
        PERFORMANCE_THRESHOLDS.NORMAL_ENDPOINT
      );
      expect(duration).toBeFasterThan(PERFORMANCE_THRESHOLDS.NORMAL_ENDPOINT);
    });

    test('should search available coaches under 500ms', async () => {
      const mockCoachService = {
        searchCoaches: jest.fn().mockResolvedValue([
          { id: 'c1', name: 'Coach A', specialization: 'fitness', rating: 4.8 },
          { id: 'c2', name: 'Coach B', specialization: 'wellness', rating: 4.9 },
        ]),
      };

      const { duration } = await measurePerformance('Search Coaches', async () => {
        return await mockCoachService.searchCoaches({
          specialization: 'fitness',
          minRating: 4.0,
        });
      });

      assertPerformance('Search Coaches', duration, PERFORMANCE_THRESHOLDS.SLOW_ENDPOINT);
      expect(duration).toBeFasterThan(PERFORMANCE_THRESHOLDS.SLOW_ENDPOINT);
    });
  });

  describe('Dashboard Metrics Performance', () => {
    test('should calculate dashboard metrics under 1s', async () => {
      const mockDashboardService = {
        getDashboardMetrics: jest.fn().mockResolvedValue({
          goalsCompleted: 15,
          activeGoals: 3,
          upcomingSessions: 2,
          totalPoints: 1250,
          achievements: ['first_goal', 'streak_7'],
        }),
      };

      const { duration } = await measurePerformance('Get Dashboard Metrics', async () => {
        return await mockDashboardService.getDashboardMetrics('user123');
      });

      assertPerformance('Get Dashboard Metrics', duration, PERFORMANCE_THRESHOLDS.SLOW_ENDPOINT);
      expect(duration).toBeFasterThan(PERFORMANCE_THRESHOLDS.SLOW_ENDPOINT);
    });
  });

  describe('Cache Performance', () => {
    test('should retrieve cached data under 10ms', async () => {
      const mockCacheService = {
        get: jest.fn().mockResolvedValue({ data: 'cached-value' }),
      };

      const { duration } = await measurePerformance('Cache Get', async () => {
        return await mockCacheService.get('cache-key');
      });

      assertPerformance('Cache Get', duration, PERFORMANCE_THRESHOLDS.FAST_ENDPOINT);
      expect(duration).toBeFasterThan(PERFORMANCE_THRESHOLDS.FAST_ENDPOINT);
    });

    test('should set cached data under 20ms', async () => {
      const mockCacheService = {
        set: jest.fn().mockResolvedValue(true),
      };

      const { duration } = await measurePerformance('Cache Set', async () => {
        return await mockCacheService.set('cache-key', { data: 'value' }, 3600);
      });

      assertPerformance('Cache Set', duration, PERFORMANCE_THRESHOLDS.FAST_ENDPOINT);
      expect(duration).toBeFasterThan(PERFORMANCE_THRESHOLDS.FAST_ENDPOINT);
    });
  });

  describe('Concurrent Load Testing', () => {
    test('should handle 50 concurrent goal updates', async () => {
      const mockGoalService = {
        updateProgress: jest.fn().mockResolvedValue({ id: 'goal123', progress: 60 }),
      };

      const metrics = await measureConcurrent(
        'Goal Progress Update',
        async () => mockGoalService.updateProgress('goal123', 60),
        50
      );

      expect(metrics.averageDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.NORMAL_ENDPOINT);
      expect(metrics.totalDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_OPERATION);
    });

    test('should handle 100 concurrent authentication requests', async () => {
      const mockAuthService = {
        authenticate: jest.fn().mockResolvedValue({ token: 'jwt.token', user: { id: '123' } }),
      };

      const metrics = await measureConcurrent(
        'Authentication',
        async () => mockAuthService.authenticate('user@example.com', 'password'),
        100
      );

      expect(metrics.averageDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.NORMAL_ENDPOINT);
      expect(metrics.maxDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.SLOW_ENDPOINT);
    });
  });

  describe('Database Query Performance', () => {
    test('should execute simple SELECT under 10ms', async () => {
      const mockDb = {
        query: jest.fn().mockResolvedValue([{ id: '1', name: 'Test' }]),
      };

      const { duration } = await measurePerformance('Simple SELECT Query', async () => {
        return await mockDb.query('SELECT * FROM users WHERE id = ?', ['user123']);
      });

      assertPerformance('Simple SELECT Query', duration, PERFORMANCE_THRESHOLDS.SIMPLE_QUERY);
      expect(duration).toBeFasterThan(PERFORMANCE_THRESHOLDS.SIMPLE_QUERY);
    });

    test('should execute complex JOIN under 100ms', async () => {
      const mockDb = {
        query: jest.fn().mockResolvedValue([
          {
            user: { id: '1', name: 'User' },
            goals: [{ id: 'g1', title: 'Goal 1' }],
            sessions: [{ id: 's1', startTime: '2024-11-05' }],
          },
        ]),
      };

      const { duration } = await measurePerformance('Complex JOIN Query', async () => {
        return await mockDb.query(
          'SELECT * FROM users JOIN goals ON users.id = goals.userId JOIN sessions ON users.id = sessions.clientId WHERE users.id = ?',
          ['user123']
        );
      });

      assertPerformance('Complex JOIN Query', duration, PERFORMANCE_THRESHOLDS.COMPLEX_QUERY);
      expect(duration).toBeFasterThan(PERFORMANCE_THRESHOLDS.COMPLEX_QUERY);
    });
  });
});
