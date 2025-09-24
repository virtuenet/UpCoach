import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const loginRate = new Rate('login_success_rate');
const apiResponseTime = new Trend('api_response_time');
const errorCount = new Counter('errors');

// Test configuration
export let options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 20 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 100 },

    // Stay at peak
    { duration: '10m', target: 100 },

    // Ramp down
    { duration: '2m', target: 50 },
    { duration: '3m', target: 20 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    // API response time should be below 200ms for 95% of requests
    'api_response_time': ['p(95)<200'],

    // Error rate should be below 1%
    'errors': ['rate<0.01'],

    // Login success rate should be above 99%
    'login_success_rate': ['rate>0.99'],

    // HTTP request duration
    'http_req_duration': ['p(95)<500'],

    // HTTP request failure rate
    'http_req_failed': ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8000';

// Test data
const testUsers = [
  { email: 'loadtest1@example.com', password: 'LoadTest123!' },
  { email: 'loadtest2@example.com', password: 'LoadTest123!' },
  { email: 'loadtest3@example.com', password: 'LoadTest123!' },
  { email: 'loadtest4@example.com', password: 'LoadTest123!' },
  { email: 'loadtest5@example.com', password: 'LoadTest123!' },
];

let authToken = '';

export function setup() {
  // Create test users if they don't exist
  testUsers.forEach(user => {
    const registerResponse = http.post(`${BASE_URL}/auth/register`, {
      email: user.email,
      password: user.password,
      firstName: 'Load',
      lastName: 'Test'
    });

    if (registerResponse.status !== 201 && registerResponse.status !== 400) {
      console.error(`Failed to create user ${user.email}: ${registerResponse.status}`);
    }
  });

  return { testUsers };
}

export default function(data) {
  const user = data.testUsers[Math.floor(Math.random() * data.testUsers.length)];

  group('Authentication Flow', () => {
    // Login
    const loginStart = Date.now();
    const loginResponse = http.post(`${BASE_URL}/auth/login`, {
      email: user.email,
      password: user.password
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const loginSuccess = check(loginResponse, {
      'login status is 200': (r) => r.status === 200,
      'login response has token': (r) => r.json('tokens.accessToken') !== undefined,
    });

    loginRate.add(loginSuccess);
    apiResponseTime.add(Date.now() - loginStart);

    if (loginSuccess) {
      authToken = loginResponse.json('tokens.accessToken');
    } else {
      errorCount.add(1);
      return;
    }
  });

  group('User Dashboard APIs', () => {
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Get user profile
    const profileStart = Date.now();
    const profileResponse = http.get(`${BASE_URL}/users/profile`, { headers });

    check(profileResponse, {
      'profile status is 200': (r) => r.status === 200,
      'profile has user data': (r) => r.json('user.email') !== undefined,
    });

    apiResponseTime.add(Date.now() - profileStart);

    if (profileResponse.status !== 200) {
      errorCount.add(1);
    }

    // Get user goals
    const goalsStart = Date.now();
    const goalsResponse = http.get(`${BASE_URL}/goals`, { headers });

    check(goalsResponse, {
      'goals status is 200': (r) => r.status === 200,
      'goals response is array': (r) => Array.isArray(r.json('goals')),
    });

    apiResponseTime.add(Date.now() - goalsStart);

    if (goalsResponse.status !== 200) {
      errorCount.add(1);
    }

    // Get user habits
    const habitsStart = Date.now();
    const habitsResponse = http.get(`${BASE_URL}/habits`, { headers });

    check(habitsResponse, {
      'habits status is 200': (r) => r.status === 200,
      'habits response is array': (r) => Array.isArray(r.json('habits')),
    });

    apiResponseTime.add(Date.now() - habitsStart);

    if (habitsResponse.status !== 200) {
      errorCount.add(1);
    }
  });

  group('Goal Management APIs', () => {
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Create a goal
    const createGoalStart = Date.now();
    const createGoalResponse = http.post(`${BASE_URL}/goals`, JSON.stringify({
      title: `Load Test Goal ${Date.now()}`,
      description: 'A goal created during load testing',
      category: 'Personal Development',
      targetDate: '2024-12-31'
    }), { headers });

    const goalCreated = check(createGoalResponse, {
      'create goal status is 201': (r) => r.status === 201,
      'create goal returns goal id': (r) => r.json('goal.id') !== undefined,
    });

    apiResponseTime.add(Date.now() - createGoalStart);

    if (!goalCreated) {
      errorCount.add(1);
      return;
    }

    const goalId = createGoalResponse.json('goal.id');

    // Update goal progress
    const updateGoalStart = Date.now();
    const updateGoalResponse = http.patch(`${BASE_URL}/goals/${goalId}`, JSON.stringify({
      progress: Math.floor(Math.random() * 100)
    }), { headers });

    check(updateGoalResponse, {
      'update goal status is 200': (r) => r.status === 200,
    });

    apiResponseTime.add(Date.now() - updateGoalStart);

    if (updateGoalResponse.status !== 200) {
      errorCount.add(1);
    }

    // Delete goal (cleanup)
    const deleteGoalResponse = http.del(`${BASE_URL}/goals/${goalId}`, null, { headers });

    check(deleteGoalResponse, {
      'delete goal status is 200': (r) => r.status === 200,
    });

    if (deleteGoalResponse.status !== 200) {
      errorCount.add(1);
    }
  });

  group('Habit Tracking APIs', () => {
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Create a habit
    const createHabitStart = Date.now();
    const createHabitResponse = http.post(`${BASE_URL}/habits`, JSON.stringify({
      name: `Load Test Habit ${Date.now()}`,
      frequency: 'daily',
      reminderTime: '09:00'
    }), { headers });

    const habitCreated = check(createHabitResponse, {
      'create habit status is 201': (r) => r.status === 201,
      'create habit returns habit id': (r) => r.json('habit.id') !== undefined,
    });

    apiResponseTime.add(Date.now() - createHabitStart);

    if (!habitCreated) {
      errorCount.add(1);
      return;
    }

    const habitId = createHabitResponse.json('habit.id');

    // Mark habit as completed
    const completeHabitStart = Date.now();
    const completeHabitResponse = http.post(`${BASE_URL}/habits/${habitId}/complete`, JSON.stringify({
      completedAt: new Date().toISOString()
    }), { headers });

    check(completeHabitResponse, {
      'complete habit status is 200': (r) => r.status === 200,
    });

    apiResponseTime.add(Date.now() - completeHabitStart);

    if (completeHabitResponse.status !== 200) {
      errorCount.add(1);
    }

    // Get habit statistics
    const habitStatsStart = Date.now();
    const habitStatsResponse = http.get(`${BASE_URL}/habits/${habitId}/stats`, { headers });

    check(habitStatsResponse, {
      'habit stats status is 200': (r) => r.status === 200,
      'habit stats has streak': (r) => r.json('stats.currentStreak') !== undefined,
    });

    apiResponseTime.add(Date.now() - habitStatsStart);

    if (habitStatsResponse.status !== 200) {
      errorCount.add(1);
    }

    // Delete habit (cleanup)
    const deleteHabitResponse = http.del(`${BASE_URL}/habits/${habitId}`, null, { headers });

    check(deleteHabitResponse, {
      'delete habit status is 200': (r) => r.status === 200,
    });

    if (deleteHabitResponse.status !== 200) {
      errorCount.add(1);
    }
  });

  group('AI Coach APIs', () => {
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Send message to AI coach
    const aiMessageStart = Date.now();
    const aiMessageResponse = http.post(`${BASE_URL}/ai-coach/message`, JSON.stringify({
      message: 'I need help staying motivated with my fitness goals.',
      context: {
        currentGoals: ['fitness', 'weight loss'],
        recentActivities: ['workout', 'meal planning']
      }
    }), { headers });

    check(aiMessageResponse, {
      'ai message status is 200': (r) => r.status === 200,
      'ai response has message': (r) => r.json('response.message') !== undefined,
      'ai response time < 5s': (r) => r.timings.duration < 5000,
    });

    apiResponseTime.add(Date.now() - aiMessageStart);

    if (aiMessageResponse.status !== 200) {
      errorCount.add(1);
    }

    // Get AI coaching insights
    const insightsStart = Date.now();
    const insightsResponse = http.get(`${BASE_URL}/ai-coach/insights`, { headers });

    check(insightsResponse, {
      'insights status is 200': (r) => r.status === 200,
      'insights has recommendations': (r) => Array.isArray(r.json('insights')),
    });

    apiResponseTime.add(Date.now() - insightsStart);

    if (insightsResponse.status !== 200) {
      errorCount.add(1);
    }
  });

  group('File Upload APIs', () => {
    const headers = {
      'Authorization': `Bearer ${authToken}`,
    };

    // Simulate progress photo upload
    const uploadStart = Date.now();

    // Create a small dummy image file
    const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const uploadResponse = http.post(`${BASE_URL}/progress/photos`, {
      photo: http.file(imageData, 'test-photo.png', 'image/png'),
      description: 'Load test progress photo'
    }, { headers });

    check(uploadResponse, {
      'upload status is 201': (r) => r.status === 201,
      'upload returns photo id': (r) => r.json('photo.id') !== undefined,
      'upload time < 3s': (r) => r.timings.duration < 3000,
    });

    apiResponseTime.add(Date.now() - uploadStart);

    if (uploadResponse.status !== 201) {
      errorCount.add(1);
    }
  });

  group('Analytics APIs', () => {
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Get user analytics
    const analyticsStart = Date.now();
    const analyticsResponse = http.get(`${BASE_URL}/analytics/user`, { headers });

    check(analyticsResponse, {
      'analytics status is 200': (r) => r.status === 200,
      'analytics has data': (r) => r.json('analytics') !== undefined,
    });

    apiResponseTime.add(Date.now() - analyticsStart);

    if (analyticsResponse.status !== 200) {
      errorCount.add(1);
    }

    // Get progress report
    const reportStart = Date.now();
    const reportResponse = http.get(`${BASE_URL}/analytics/progress-report?period=30d`, { headers });

    check(reportResponse, {
      'report status is 200': (r) => r.status === 200,
      'report has summary': (r) => r.json('report.summary') !== undefined,
    });

    apiResponseTime.add(Date.now() - reportStart);

    if (reportResponse.status !== 200) {
      errorCount.add(1);
    }
  });

  // Logout
  group('Logout Flow', () => {
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    const logoutStart = Date.now();
    const logoutResponse = http.post(`${BASE_URL}/auth/logout`, {}, { headers });

    check(logoutResponse, {
      'logout status is 200': (r) => r.status === 200,
    });

    apiResponseTime.add(Date.now() - logoutStart);

    if (logoutResponse.status !== 200) {
      errorCount.add(1);
    }
  });

  // Wait between iterations
  sleep(1);
}

export function teardown(data) {
  // Cleanup test data
  console.log('Load test completed');
  console.log(`Total test users: ${data.testUsers.length}`);
}

// Handle different test scenarios
export function handleSummary(data) {
  return {
    'performance-report.html': htmlReport(data),
    'performance-results.json': JSON.stringify(data),
  };
}

function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>UpCoach Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; border-left: 4px solid #007cba; }
        .pass { border-left-color: #28a745; }
        .fail { border-left-color: #dc3545; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>UpCoach Performance Test Report</h1>

    <h2>Test Summary</h2>
    <div class="metric">
        <strong>Test Duration:</strong> ${Math.round(data.state.testRunDurationMs / 1000)}s
    </div>
    <div class="metric">
        <strong>Total VUs:</strong> ${data.metrics.vus_max.values.max}
    </div>
    <div class="metric">
        <strong>Total Requests:</strong> ${data.metrics.http_reqs.values.count}
    </div>

    <h2>Performance Metrics</h2>
    <table>
        <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Threshold</th>
            <th>Status</th>
        </tr>
        <tr>
            <td>API Response Time (95th percentile)</td>
            <td>${Math.round(data.metrics.api_response_time?.values?.['p(95)'] || 0)}ms</td>
            <td>&lt; 200ms</td>
            <td class="${(data.metrics.api_response_time?.values?.['p(95)'] || 0) < 200 ? 'pass' : 'fail'}">
                ${(data.metrics.api_response_time?.values?.['p(95)'] || 0) < 200 ? 'PASS' : 'FAIL'}
            </td>
        </tr>
        <tr>
            <td>HTTP Request Duration (95th percentile)</td>
            <td>${Math.round(data.metrics.http_req_duration?.values?.['p(95)'] || 0)}ms</td>
            <td>&lt; 500ms</td>
            <td class="${(data.metrics.http_req_duration?.values?.['p(95)'] || 0) < 500 ? 'pass' : 'fail'}">
                ${(data.metrics.http_req_duration?.values?.['p(95)'] || 0) < 500 ? 'PASS' : 'FAIL'}
            </td>
        </tr>
        <tr>
            <td>Error Rate</td>
            <td>${Math.round((data.metrics.errors?.values?.rate || 0) * 100)}%</td>
            <td>&lt; 1%</td>
            <td class="${(data.metrics.errors?.values?.rate || 0) < 0.01 ? 'pass' : 'fail'}">
                ${(data.metrics.errors?.values?.rate || 0) < 0.01 ? 'PASS' : 'FAIL'}
            </td>
        </tr>
        <tr>
            <td>Login Success Rate</td>
            <td>${Math.round((data.metrics.login_success_rate?.values?.rate || 0) * 100)}%</td>
            <td>&gt; 99%</td>
            <td class="${(data.metrics.login_success_rate?.values?.rate || 0) > 0.99 ? 'pass' : 'fail'}">
                ${(data.metrics.login_success_rate?.values?.rate || 0) > 0.99 ? 'PASS' : 'FAIL'}
            </td>
        </tr>
    </table>

    <h2>Detailed Metrics</h2>
    <pre>${JSON.stringify(data.metrics, null, 2)}</pre>

    <p><em>Generated on ${new Date().toISOString()}</em></p>
</body>
</html>
  `;
}