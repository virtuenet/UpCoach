/**
 * Week 4 Performance and Load Testing Framework
 * UpCoach Platform - Production Load Validation
 *
 * Tests the platform's ability to handle 10,000+ concurrent users
 * with real-time features and maintains <100ms latency under load
 */

const k6 = require('k6');
const http = require('k6/http');
const ws = require('k6/ws');
const { check, sleep } = require('k6');
const { Rate, Trend, Counter } = require('k6/metrics');

// Performance Metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const websocketConnections = new Counter('websocket_connections');
const realtimeLatency = new Trend('realtime_latency');

// Test Configuration
const config = {
  BASE_URL: __ENV.BASE_URL || 'https://api.upcoach.com',
  WEBSOCKET_URL: __ENV.WEBSOCKET_URL || 'wss://api.upcoach.com',
  TARGET_USERS: parseInt(__ENV.TARGET_USERS) || 10000,
  RAMP_UP_DURATION: __ENV.RAMP_UP_DURATION || '10m',
  STEADY_STATE_DURATION: __ENV.STEADY_STATE_DURATION || '30m',
  RAMP_DOWN_DURATION: __ENV.RAMP_DOWN_DURATION || '5m'
};

// Load Testing Scenarios
export let options = {
  scenarios: {
    // Scenario 1: Gradual ramp-up to peak load
    peak_load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: config.RAMP_UP_DURATION, target: config.TARGET_USERS },
        { duration: config.STEADY_STATE_DURATION, target: config.TARGET_USERS },
        { duration: config.RAMP_DOWN_DURATION, target: 0 }
      ],
      gracefulRampDown: '30s'
    },

    // Scenario 2: Stress testing with spikes
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 2000 },
        { duration: '2m', target: 2000 },
        { duration: '1m', target: 5000 }, // Spike
        { duration: '2m', target: 5000 },
        { duration: '1m', target: 10000 }, // Major spike
        { duration: '3m', target: 10000 },
        { duration: '2m', target: 0 }
      ],
      gracefulRampDown: '30s'
    },

    // Scenario 3: Real-time features testing
    realtime_test: {
      executor: 'constant-vus',
      vus: 1000,
      duration: '15m',
      exec: 'realtimeScenario'
    },

    // Scenario 4: API endpoint stress testing
    api_stress_test: {
      executor: 'constant-arrival-rate',
      rate: 1000, // 1000 requests per second
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 100,
      maxVUs: 1000,
      exec: 'apiStressScenario'
    }
  },
  thresholds: {
    // Performance Requirements
    http_req_duration: ['p(95)<100'], // 95% of requests under 100ms
    http_req_failed: ['rate<0.01'], // Error rate under 1%
    websocket_connections: ['count>500'], // Minimum WebSocket connections
    realtime_latency: ['p(95)<50'], // Real-time latency under 50ms
    errors: ['rate<0.01'] // Overall error rate under 1%
  }
};

// Test Data Factory
class LoadTestDataFactory {
  static generateUser() {
    const userId = Math.random().toString(36).substr(2, 9);
    return {
      id: userId,
      email: `loadtest-${userId}@upcoach.com`,
      password: 'LoadTest123!',
      firstName: `User${userId}`,
      lastName: 'LoadTest'
    };
  }

  static generateGoal() {
    const goalId = Math.random().toString(36).substr(2, 9);
    return {
      id: goalId,
      title: `Load Test Goal ${goalId}`,
      description: 'Performance testing goal',
      category: 'Testing',
      priority: Math.floor(Math.random() * 5) + 1
    };
  }

  static generateJournalEntry() {
    const entryId = Math.random().toString(36).substr(2, 9);
    return {
      id: entryId,
      title: `Journal Entry ${entryId}`,
      content: 'This is a load test journal entry for performance validation.',
      mood: Math.floor(Math.random() * 10) + 1,
      tags: ['loadtest', 'performance']
    };
  }
}

// Authentication Helper
class AuthHelper {
  static async authenticate(user) {
    const loginResponse = http.post(`${config.BASE_URL}/auth/login`, {
      email: user.email,
      password: user.password
    });

    const authSuccess = check(loginResponse, {
      'auth status is 200': (r) => r.status === 200,
      'auth response contains token': (r) => r.json('token') !== undefined
    });

    if (!authSuccess) {
      errorRate.add(1);
      return null;
    }

    return loginResponse.json('token');
  }

  static getAuthHeaders(token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}

// Main Load Test Scenario
export default function() {
  const user = LoadTestDataFactory.generateUser();

  // Step 1: User Registration (if needed)
  const registrationStart = new Date();
  const registrationResponse = http.post(`${config.BASE_URL}/auth/register`, user);

  check(registrationResponse, {
    'registration status is 201 or 409': (r) => r.status === 201 || r.status === 409
  }) || errorRate.add(1);

  // Step 2: Authentication
  const authStart = new Date();
  const token = AuthHelper.authenticate(user);

  if (!token) {
    return; // Skip rest of test if auth fails
  }

  const authTime = new Date() - authStart;
  responseTime.add(authTime);

  const headers = AuthHelper.getAuthHeaders(token);

  // Step 3: Dashboard Access
  const dashboardStart = new Date();
  const dashboardResponse = http.get(`${config.BASE_URL}/api/dashboard`, { headers });

  check(dashboardResponse, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response time < 500ms': (r) => r.timings.duration < 500
  }) || errorRate.add(1);

  responseTime.add(new Date() - dashboardStart);

  // Step 4: Goal Management
  const goal = LoadTestDataFactory.generateGoal();
  const goalStart = new Date();

  // Create goal
  const createGoalResponse = http.post(`${config.BASE_URL}/api/goals`, goal, { headers });
  check(createGoalResponse, {
    'create goal status is 201': (r) => r.status === 201
  }) || errorRate.add(1);

  // List goals
  const listGoalsResponse = http.get(`${config.BASE_URL}/api/goals`, { headers });
  check(listGoalsResponse, {
    'list goals status is 200': (r) => r.status === 200,
    'goals response contains data': (r) => r.json('data') !== undefined
  }) || errorRate.add(1);

  responseTime.add(new Date() - goalStart);

  // Step 5: Journal Functionality
  const journal = LoadTestDataFactory.generateJournalEntry();
  const journalStart = new Date();

  const createJournalResponse = http.post(`${config.BASE_URL}/api/journal`, journal, { headers });
  check(createJournalResponse, {
    'create journal status is 201': (r) => r.status === 201
  }) || errorRate.add(1);

  responseTime.add(new Date() - journalStart);

  // Step 6: User Profile Access
  const profileStart = new Date();
  const profileResponse = http.get(`${config.BASE_URL}/api/profile`, { headers });

  check(profileResponse, {
    'profile status is 200': (r) => r.status === 200,
    'profile response time < 200ms': (r) => r.timings.duration < 200
  }) || errorRate.add(1);

  responseTime.add(new Date() - profileStart);

  // Step 7: Search Functionality
  const searchStart = new Date();
  const searchResponse = http.get(`${config.BASE_URL}/api/search?q=fitness`, { headers });

  check(searchResponse, {
    'search status is 200': (r) => r.status === 200
  }) || errorRate.add(1);

  responseTime.add(new Date() - searchStart);

  // Random wait to simulate user behavior
  sleep(Math.random() * 3 + 1);
}

// Real-time Features Testing Scenario
export function realtimeScenario() {
  const user = LoadTestDataFactory.generateUser();
  const token = AuthHelper.authenticate(user);

  if (!token) {
    return;
  }

  // WebSocket Connection Test
  const wsUrl = `${config.WEBSOCKET_URL}/realtime?token=${token}`;
  const res = ws.connect(wsUrl, {}, function (socket) {
    websocketConnections.add(1);

    socket.on('open', function open() {
      console.log('WebSocket connection established');

      // Send real-time messages
      const testMessages = [
        { type: 'goal_update', data: LoadTestDataFactory.generateGoal() },
        { type: 'progress_update', data: { progress: Math.random() * 100 } },
        { type: 'journal_update', data: LoadTestDataFactory.generateJournalEntry() }
      ];

      testMessages.forEach((message, index) => {
        setTimeout(() => {
          const sendTime = new Date();
          socket.send(JSON.stringify(message));

          socket.on('message', function(data) {
            const receiveTime = new Date();
            const latency = receiveTime - sendTime;
            realtimeLatency.add(latency);

            check(data, {
              'websocket message received': (d) => d !== undefined,
              'realtime latency < 100ms': () => latency < 100
            }) || errorRate.add(1);
          });
        }, index * 1000);
      });
    });

    socket.on('error', function(e) {
      errorRate.add(1);
      console.error('WebSocket error:', e);
    });

    // Keep connection alive for test duration
    sleep(60);
  });

  check(res, {
    'websocket connection successful': (r) => r && r.status === 101
  }) || errorRate.add(1);
}

// API Stress Testing Scenario
export function apiStressScenario() {
  const endpoints = [
    '/api/health',
    '/api/version',
    '/api/goals',
    '/api/dashboard',
    '/api/profile',
    '/api/journal',
    '/api/search?q=test'
  ];

  const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = http.get(`${config.BASE_URL}${randomEndpoint}`);

  check(response, {
    'api stress status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'api stress response time < 200ms': (r) => r.timings.duration < 200
  }) || errorRate.add(1);

  responseTime.add(response.timings.duration);
}

// Database Performance Testing
export function databaseStressTest() {
  const user = LoadTestDataFactory.generateUser();
  const token = AuthHelper.authenticate(user);

  if (!token) {
    return;
  }

  const headers = AuthHelper.getAuthHeaders(token);

  // Heavy read operations
  for (let i = 0; i < 10; i++) {
    const readStart = new Date();
    const response = http.get(`${config.BASE_URL}/api/goals?page=${i}&limit=100`, { headers });

    check(response, {
      'db read operation successful': (r) => r.status === 200,
      'db read response time < 300ms': (r) => r.timings.duration < 300
    }) || errorRate.add(1);

    responseTime.add(new Date() - readStart);
  }

  // Heavy write operations
  for (let i = 0; i < 5; i++) {
    const writeStart = new Date();
    const goal = LoadTestDataFactory.generateGoal();
    const response = http.post(`${config.BASE_URL}/api/goals`, goal, { headers });

    check(response, {
      'db write operation successful': (r) => r.status === 201,
      'db write response time < 500ms': (r) => r.timings.duration < 500
    }) || errorRate.add(1);

    responseTime.add(new Date() - writeStart);
  }
}

// Memory and Resource Testing
export function resourceMonitoring() {
  // Simulate memory-intensive operations
  const largeDataSets = [];

  for (let i = 0; i < 100; i++) {
    largeDataSets.push({
      id: i,
      data: new Array(1000).fill(0).map(() => LoadTestDataFactory.generateJournalEntry())
    });
  }

  // Process large datasets
  const processStart = new Date();
  largeDataSets.forEach(dataset => {
    dataset.data.forEach(entry => {
      // Simulate data processing
      const processed = {
        ...entry,
        processed: true,
        timestamp: new Date().toISOString()
      };
    });
  });

  const processingTime = new Date() - processStart;
  responseTime.add(processingTime);

  check(processingTime, {
    'memory processing time < 1000ms': (time) => time < 1000
  }) || errorRate.add(1);
}

// Cleanup function
export function teardown(data) {
  console.log('Load test completed. Final metrics:');
  console.log(`Total WebSocket connections: ${websocketConnections.count}`);
  console.log(`Average response time: ${responseTime.avg}ms`);
  console.log(`95th percentile response time: ${responseTime.p95}ms`);
  console.log(`Error rate: ${errorRate.rate * 100}%`);
  console.log(`Real-time latency average: ${realtimeLatency.avg}ms`);
}

// Export for external monitoring
module.exports = {
  LoadTestDataFactory,
  AuthHelper,
  config,
  errorRate,
  responseTime,
  websocketConnections,
  realtimeLatency
};