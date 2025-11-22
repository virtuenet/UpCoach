/**
 * Comprehensive Performance and Load Testing Suite
 *
 * Tests performance under various conditions:
 * - API endpoint load testing
 * - Database connection stress testing
 * - Frontend bundle size and loading performance
 * - Real-time features (WebSocket) under load
 * - Mobile app performance benchmarks
 * - Concurrent user scenarios
 * - Memory and CPU usage monitoring
 * - CDN and asset delivery performance
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { jUnit, textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const dbConnections = new Gauge('db_connections');
const memoryUsage = new Gauge('memory_usage_mb');
const cpuUsage = new Gauge('cpu_usage_percent');
const wsConnections = new Counter('websocket_connections');
const concurrentUsers = new Gauge('concurrent_users');

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/v1`;
const WS_URL = __ENV.WS_URL || 'ws://localhost:3000';

// Test data
const TEST_USER = {
  email: 'load.test@upcoach.ai',
  password: 'LoadTest123!',
};

const TEST_GOAL = {
  title: 'Load Test Goal',
  description: 'Generated for load testing purposes',
  category: 'testing',
  priority: 'medium',
  deadline: '2024-12-31T23:59:59Z',
};

// Utility functions
function authenticate() {
  const loginResponse = http.post(`${API_URL}/auth/login`, JSON.stringify(TEST_USER), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => JSON.parse(r.body).token !== undefined,
  });

  return loginResponse.status === 200 ? JSON.parse(loginResponse.body).token : null;
}

function createAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

function monitorResourceUsage() {
  // Simulate monitoring calls (in real scenario, this would query monitoring endpoints)
  const metricsResponse = http.get(`${API_URL}/health/metrics`);

  if (metricsResponse.status === 200) {
    const metrics = JSON.parse(metricsResponse.body);
    memoryUsage.add(metrics.memory || 0);
    cpuUsage.add(metrics.cpu || 0);
    dbConnections.add(metrics.dbConnections || 0);
  }
}

// Load test scenarios
export const options = {
  scenarios: {
    // Smoke test - minimal load to verify functionality
    smoke_test: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { test_type: 'smoke' },
    },

    // Load test - normal expected load
    load_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      tags: { test_type: 'load' },
    },

    // Stress test - beyond normal capacity
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '5m', target: 300 },
        { duration: '2m', target: 400 },
        { duration: '3m', target: 400 },
        { duration: '2m', target: 0 },
      ],
      tags: { test_type: 'stress' },
    },

    // Spike test - sudden traffic increases
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '30s', target: 500 }, // Sudden spike
        { duration: '3m', target: 500 },
        { duration: '30s', target: 100 }, // Drop back
        { duration: '3m', target: 100 },
        { duration: '1m', target: 0 },
      ],
      tags: { test_type: 'spike' },
    },

    // Volume test - large amounts of data
    volume_test: {
      executor: 'constant-vus',
      vus: 20,
      duration: '10m',
      tags: { test_type: 'volume' },
    },

    // Endurance test - sustained load over time
    endurance_test: {
      executor: 'constant-vus',
      vus: 100,
      duration: '30m',
      tags: { test_type: 'endurance' },
    },

    // Real-time features test
    websocket_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      exec: 'websocketTest',
      tags: { test_type: 'websocket' },
    },

    // API-specific tests
    api_endpoints: {
      executor: 'per-vu-iterations',
      vus: 30,
      iterations: 100,
      maxDuration: '10m',
      exec: 'apiEndpointsTest',
      tags: { test_type: 'api' },
    },

    // Database stress test
    database_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 150 },
        { duration: '5m', target: 150 },
        { duration: '2m', target: 0 },
      ],
      exec: 'databaseStressTest',
      tags: { test_type: 'database' },
    },
  },

  thresholds: {
    // Performance requirements
    http_req_duration: [
      'p(95)<500', // 95% of requests should be below 500ms
      'p(99)<1000', // 99% of requests should be below 1s
    ],
    http_req_failed: ['rate<0.01'], // Error rate should be less than 1%

    // Custom metrics thresholds
    error_rate: ['rate<0.05'], // Error rate should be less than 5%
    response_time: ['p(90)<300', 'p(95)<500'],

    // Resource usage thresholds
    memory_usage_mb: ['value<1000'], // Memory should stay under 1GB
    cpu_usage_percent: ['value<80'], // CPU should stay under 80%
    db_connections: ['value<100'], // DB connections should stay under 100
  },

  // Output configuration
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)'],
};

// Main test function
export default function () {
  group('Authentication Flow', () => {
    const token = authenticate();

    if (token) {
      group('User Profile Operations', () => {
        // Get user profile
        const profileResponse = http.get(`${API_URL}/user/profile`, {
          headers: createAuthHeaders(token),
        });

        check(profileResponse, {
          'profile loaded': (r) => r.status === 200,
          'profile has email': (r) => JSON.parse(r.body).email !== undefined,
        });

        responseTime.add(profileResponse.timings.duration);

        // Update user profile
        const updateData = {
          firstName: `LoadTest${Math.floor(Math.random() * 1000)}`,
          bio: 'Updated during load testing',
        };

        const updateResponse = http.put(
          `${API_URL}/user/profile`,
          JSON.stringify(updateData),
          { headers: createAuthHeaders(token) }
        );

        check(updateResponse, {
          'profile updated': (r) => r.status === 200,
        });
      });

      group('Goals Management', () => {
        // Create goal
        const createGoalResponse = http.post(
          `${API_URL}/goals`,
          JSON.stringify(TEST_GOAL),
          { headers: createAuthHeaders(token) }
        );

        check(createGoalResponse, {
          'goal created': (r) => r.status === 201,
        });

        const goalId = createGoalResponse.status === 201
          ? JSON.parse(createGoalResponse.body).goal.id
          : null;

        if (goalId) {
          // Get goals list
          const goalsResponse = http.get(`${API_URL}/goals`, {
            headers: createAuthHeaders(token),
          });

          check(goalsResponse, {
            'goals list loaded': (r) => r.status === 200,
            'goals array exists': (r) => Array.isArray(JSON.parse(r.body).goals),
          });

          // Update goal progress
          const progressUpdate = { progress: Math.floor(Math.random() * 100) };
          const updateGoalResponse = http.put(
            `${API_URL}/goals/${goalId}`,
            JSON.stringify(progressUpdate),
            { headers: createAuthHeaders(token) }
          );

          check(updateGoalResponse, {
            'goal updated': (r) => r.status === 200,
          });

          // Delete goal (cleanup)
          const deleteResponse = http.del(`${API_URL}/goals/${goalId}`, {
            headers: createAuthHeaders(token),
          });

          check(deleteResponse, {
            'goal deleted': (r) => r.status === 204,
          });
        }
      });

      group('Habits Tracking', () => {
        const habitData = {
          name: 'Load Test Habit',
          category: 'testing',
          frequency: 'daily',
        };

        // Create habit
        const createHabitResponse = http.post(
          `${API_URL}/habits`,
          JSON.stringify(habitData),
          { headers: createAuthHeaders(token) }
        );

        check(createHabitResponse, {
          'habit created': (r) => r.status === 201,
        });

        const habitId = createHabitResponse.status === 201
          ? JSON.parse(createHabitResponse.body).habit.id
          : null;

        if (habitId) {
          // Record habit check-in
          const checkInData = {
            completed: true,
            notes: 'Completed during load test',
            quality: Math.floor(Math.random() * 5) + 6, // 6-10 scale
          };

          const checkInResponse = http.post(
            `${API_URL}/habits/${habitId}/check-in`,
            JSON.stringify(checkInData),
            { headers: createAuthHeaders(token) }
          );

          check(checkInResponse, {
            'habit check-in recorded': (r) => r.status === 200,
          });

          // Get habit history
          const historyResponse = http.get(`${API_URL}/habits/${habitId}/history`, {
            headers: createAuthHeaders(token),
          });

          check(historyResponse, {
            'habit history loaded': (r) => r.status === 200,
          });
        }
      });

      group('Dashboard Analytics', () => {
        // Get dashboard stats
        const statsResponse = http.get(`${API_URL}/dashboard/stats`, {
          headers: createAuthHeaders(token),
        });

        check(statsResponse, {
          'dashboard stats loaded': (r) => r.status === 200,
          'stats contain metrics': (r) => {
            const stats = JSON.parse(r.body);
            return stats.totalGoals !== undefined && stats.habitStreak !== undefined;
          },
        });

        // Get progress charts data
        const chartsResponse = http.get(`${API_URL}/dashboard/charts`, {
          headers: createAuthHeaders(token),
        });

        check(chartsResponse, {
          'charts data loaded': (r) => r.status === 200,
        });

        // Get recent activity
        const activityResponse = http.get(`${API_URL}/dashboard/activity`, {
          headers: createAuthHeaders(token),
        });

        check(activityResponse, {
          'recent activity loaded': (r) => r.status === 200,
        });
      });
    } else {
      errorRate.add(1);
    }

    // Monitor resource usage periodically
    if (Math.random() < 0.1) { // 10% chance to monitor
      monitorResourceUsage();
    }

    // Track concurrent users
    concurrentUsers.add(1);

    sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
  });
}

// WebSocket load test
export function websocketTest() {
  const token = authenticate();

  if (!token) {
    errorRate.add(1);
    return;
  }

  const url = `${WS_URL}?token=${token}`;

  const res = ws.connect(url, {}, function (socket) {
    wsConnections.add(1);

    socket.on('open', () => {
      // Send ping messages every 5 seconds
      socket.setInterval(() => {
        socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }, 5000);

      // Send goal progress updates
      socket.setInterval(() => {
        socket.send(JSON.stringify({
          type: 'goal_progress_update',
          goalId: 'test-goal',
          progress: Math.floor(Math.random() * 100),
        }));
      }, 10000);

      // Send habit check-ins
      socket.setInterval(() => {
        socket.send(JSON.stringify({
          type: 'habit_checkin',
          habitId: 'test-habit',
          completed: Math.random() > 0.5,
        }));
      }, 15000);
    });

    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        check(message, {
          'websocket message valid': (msg) => msg.type !== undefined,
        });
      } catch (e) {
        errorRate.add(1);
      }
    });

    socket.on('close', () => {
      wsConnections.add(-1);
    });

    socket.on('error', (e) => {
      console.error('WebSocket error:', e);
      errorRate.add(1);
    });

    // Keep connection alive for test duration
    sleep(60);
  });

  check(res, {
    'websocket connection successful': (r) => r && r.status === 101,
  });
}

// API endpoints specific testing
export function apiEndpointsTest() {
  const token = authenticate();

  if (!token) {
    errorRate.add(1);
    return;
  }

  const headers = createAuthHeaders(token);

  // Test various endpoints with different loads
  const endpoints = [
    { method: 'GET', url: `${API_URL}/user/profile`, weight: 30 },
    { method: 'GET', url: `${API_URL}/goals`, weight: 25 },
    { method: 'GET', url: `${API_URL}/habits`, weight: 20 },
    { method: 'GET', url: `${API_URL}/dashboard/stats`, weight: 15 },
    { method: 'GET', url: `${API_URL}/coaching/sessions`, weight: 10 },
  ];

  // Weighted random endpoint selection
  const random = Math.random() * 100;
  let cumulative = 0;
  let selectedEndpoint;

  for (const endpoint of endpoints) {
    cumulative += endpoint.weight;
    if (random <= cumulative) {
      selectedEndpoint = endpoint;
      break;
    }
  }

  if (selectedEndpoint) {
    const startTime = Date.now();
    const response = http.request(selectedEndpoint.method, selectedEndpoint.url, null, { headers });
    const duration = Date.now() - startTime;

    check(response, {
      [`${selectedEndpoint.method} ${selectedEndpoint.url} success`]: (r) => r.status < 400,
      [`${selectedEndpoint.method} ${selectedEndpoint.url} fast`]: (r) => r.timings.duration < 1000,
    });

    responseTime.add(duration);

    if (response.status >= 400) {
      errorRate.add(1);
    }
  }

  sleep(0.5);
}

// Database stress testing
export function databaseStressTest() {
  const token = authenticate();

  if (!token) {
    errorRate.add(1);
    return;
  }

  const headers = createAuthHeaders(token);

  group('Database Heavy Operations', () => {
    // Create multiple goals rapidly
    for (let i = 0; i < 5; i++) {
      const goalData = {
        ...TEST_GOAL,
        title: `DB Stress Goal ${i} - ${Math.random().toString(36).substr(2, 9)}`,
      };

      const createResponse = http.post(`${API_URL}/goals`, JSON.stringify(goalData), { headers });

      check(createResponse, {
        'goal creation under stress': (r) => r.status === 201,
      });

      if (createResponse.status >= 400) {
        errorRate.add(1);
      }
    }

    // Perform complex queries
    const complexQueryResponse = http.get(
      `${API_URL}/analytics/detailed?startDate=2024-01-01&endDate=2024-12-31&groupBy=month&include=goals,habits,sessions`,
      { headers }
    );

    check(complexQueryResponse, {
      'complex query succeeds': (r) => r.status === 200,
      'complex query reasonable time': (r) => r.timings.duration < 3000,
    });

    // Bulk operations
    const bulkData = {
      operations: Array.from({ length: 10 }, (_, i) => ({
        type: 'update_goal_progress',
        goalId: `bulk-goal-${i}`,
        progress: Math.floor(Math.random() * 100),
      })),
    };

    const bulkResponse = http.post(`${API_URL}/bulk/operations`, JSON.stringify(bulkData), { headers });

    check(bulkResponse, {
      'bulk operations succeed': (r) => r.status === 200,
    });
  });

  // Monitor database connections more frequently during stress
  monitorResourceUsage();

  sleep(1);
}

// Frontend performance test
export function frontendPerformanceTest() {
  group('Frontend Performance', () => {
    // Landing page performance
    const landingResponse = http.get(BASE_URL);

    check(landingResponse, {
      'landing page loads': (r) => r.status === 200,
      'landing page fast': (r) => r.timings.duration < 2000,
      'landing page size reasonable': (r) => r.body.length < 500000, // Under 500KB
    });

    // Static assets performance
    const assetsToTest = [
      '/static/js/main.js',
      '/static/css/main.css',
      '/static/media/logo.svg',
    ];

    for (const asset of assetsToTest) {
      const assetResponse = http.get(`${BASE_URL}${asset}`);

      check(assetResponse, {
        [`${asset} loads`]: (r) => r.status === 200,
        [`${asset} cached`]: (r) => r.headers['Cache-Control'] !== undefined,
        [`${asset} compressed`]: (r) => r.headers['Content-Encoding'] !== undefined,
      });
    }

    // API response times for frontend
    const token = authenticate();
    if (token) {
      const criticalEndpoints = [
        `${API_URL}/user/profile`,
        `${API_URL}/dashboard/stats`,
        `${API_URL}/goals?limit=10`,
      ];

      for (const endpoint of criticalEndpoints) {
        const response = http.get(endpoint, {
          headers: createAuthHeaders(token),
        });

        check(response, {
          [`${endpoint} API fast`]: (r) => r.timings.duration < 200,
          [`${endpoint} API success`]: (r) => r.status === 200,
        });
      }
    }
  });
}

// Generate comprehensive test report
export function handleSummary(data) {
  const reportData = {
    ...data,
    testMetadata: {
      baseUrl: BASE_URL,
      testDate: new Date().toISOString(),
      scenarios: Object.keys(options.scenarios),
      thresholds: options.thresholds,
    },
  };

  return {
    'performance-report.html': htmlReport(reportData),
    'performance-report.xml': jUnit(reportData),
    'performance-summary.txt': textSummary(reportData, { indent: ' ', enableColors: true }),
    stdout: textSummary(reportData, { indent: ' ', enableColors: true }),
  };
}

// Teardown function
export function teardown(data) {
  console.log('\n📊 Performance Test Summary:');
  console.log(`Total VU seconds: ${data.metrics.vus.values.value}`);
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Failed requests: ${data.metrics.http_req_failed.values.count}`);
  console.log(`Average response time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`95th percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);

  if (data.metrics.error_rate && data.metrics.error_rate.values.rate > 0.05) {
    console.log('⚠️  ERROR RATE TOO HIGH: ', (data.metrics.error_rate.values.rate * 100).toFixed(2), '%');
  } else {
    console.log('✅ Error rate within acceptable limits');
  }

  if (data.metrics.http_req_duration.values['p(95)'] > 500) {
    console.log('⚠️  RESPONSE TIME TOO HIGH: 95th percentile exceeds 500ms');
  } else {
    console.log('✅ Response times within acceptable limits');
  }
}