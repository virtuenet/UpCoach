/**
 * K6 Security Load Testing Script
 * Tests for DoS resilience and performance under stress
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const authFailures = new Rate('auth_failures');
const rateLimitHits = new Rate('rate_limit_hits');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Warm up
    { duration: '1m', target: 50 }, // Normal load
    { duration: '2m', target: 100 }, // Stress test
    { duration: '1m', target: 200 }, // Spike test
    { duration: '30s', target: 0 }, // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests must complete within 5s
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
    errors: ['rate<0.1'], // Custom error rate threshold
    rate_limit_hits: ['rate<0.5'], // Rate limiting should not affect >50% of requests
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://staging.upcoach.ai';
const API_BASE = `${BASE_URL}/api`;

/**
 * Setup function - runs once before the test
 */
export function setup() {
  // Test basic connectivity
  const healthCheck = http.get(`${API_BASE}/health`);
  check(healthCheck, {
    'API is reachable': r => r.status === 200,
  });

  return {
    baseUrl: BASE_URL,
    apiBase: API_BASE,
  };
}

/**
 * Main test scenario
 */
export default function (data) {
  // Test 1: Health endpoint (should handle high load)
  const healthRes = http.get(`${data.apiBase}/health`);
  check(healthRes, {
    'health check status is 200': r => r.status === 200,
    'health check response time < 500ms': r => r.timings.duration < 500,
  });
  responseTime.add(healthRes.timings.duration);

  // Test 2: Authentication endpoint (test rate limiting)
  const authPayload = JSON.stringify({
    email: `test${Math.random()}@example.com`,
    password: 'wrongpassword',
  });

  const authParams = {
    headers: { 'Content-Type': 'application/json' },
  };

  const authRes = http.post(`${data.apiBase}/auth/login`, authPayload, authParams);

  const authChecks = check(authRes, {
    'auth returns 401 or 429': r => r.status === 401 || r.status === 429,
    'no server errors on auth': r => r.status < 500,
  });

  if (authRes.status === 429) {
    rateLimitHits.add(1);
  } else {
    rateLimitHits.add(0);
  }

  if (!authChecks) {
    authFailures.add(1);
  } else {
    authFailures.add(0);
  }

  // Test 3: Search endpoint (test input validation)
  const searchPayloads = [
    'normal search',
    'a'.repeat(1000), // Long string
    '<script>alert(1)</script>', // XSS attempt
    "' OR '1'='1", // SQL injection attempt
    '../../../etc/passwd', // Path traversal
  ];

  const randomPayload = searchPayloads[Math.floor(Math.random() * searchPayloads.length)];
  const searchRes = http.get(`${data.apiBase}/search?q=${encodeURIComponent(randomPayload)}`);

  check(searchRes, {
    'search handles malicious input': r => r.status !== 500,
    'search has reasonable response time': r => r.timings.duration < 2000,
  });

  // Test 4: Large payload handling
  const largePayload = JSON.stringify({
    data: 'x'.repeat(1024 * 100), // 100KB payload
    nested: Array(100).fill({ key: 'value' }),
  });

  const largeRes = http.post(`${data.apiBase}/data`, largePayload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s',
  });

  check(largeRes, {
    'large payload rejected or handled': r =>
      r.status === 413 || r.status === 400 || r.status === 401,
    'no timeout on large payload': r => r.timings.duration < 10000,
  });

  // Test 5: Concurrent connection handling
  const batch = [
    ['GET', `${data.apiBase}/health`],
    ['GET', `${data.apiBase}/status`],
    ['GET', `${data.apiBase}/version`],
  ];

  const batchRes = http.batch(batch);
  check(batchRes[0], {
    'concurrent requests handled': r => r.status < 500,
  });

  // Test 6: Resource exhaustion protection
  const heavyComputeRes = http.get(`${data.apiBase}/compute?complexity=high`);
  check(heavyComputeRes, {
    'heavy compute protected': r => r.status !== 500 && r.timings.duration < 5000,
  });

  // Track overall errors
  errorRate.add(healthRes.status >= 400 ? 1 : 0);

  // Random sleep between requests (0.1 - 1 second)
  sleep(Math.random() * 0.9 + 0.1);
}

/**
 * Teardown function - runs once after the test
 */
export function teardown(data) {
  // Final health check
  const finalHealth = http.get(`${data.apiBase}/health`);
  check(finalHealth, {
    'API still responsive after load test': r => r.status === 200,
  });
}

/**
 * Handle summary generation
 */
export function handleSummary(data) {
  // Calculate security metrics
  const totalRequests = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
  const failedRequests = data.metrics.http_req_failed
    ? data.metrics.http_req_failed.values.passes
    : 0;
  const avgResponseTime = data.metrics.http_req_duration
    ? data.metrics.http_req_duration.values.avg
    : 0;
  const p95ResponseTime = data.metrics.http_req_duration
    ? data.metrics.http_req_duration.values['p(95)']
    : 0;
  const rateLimitRate = data.metrics.rate_limit_hits ? data.metrics.rate_limit_hits.values.rate : 0;

  const securitySummary = {
    security_assessment: {
      dos_resilience: p95ResponseTime < 5000 ? 'PASSED' : 'FAILED',
      rate_limiting: rateLimitRate > 0 ? 'ACTIVE' : 'INACTIVE',
      error_handling: failedRequests / totalRequests < 0.1 ? 'STABLE' : 'UNSTABLE',
      performance_degradation: avgResponseTime < 1000 ? 'ACCEPTABLE' : 'DEGRADED',
    },
    metrics: {
      total_requests: totalRequests,
      failed_requests: failedRequests,
      avg_response_time_ms: avgResponseTime,
      p95_response_time_ms: p95ResponseTime,
      rate_limit_effectiveness: `${(rateLimitRate * 100).toFixed(2)}%`,
    },
    recommendations: [],
  };

  // Add recommendations based on results
  if (p95ResponseTime > 5000) {
    securitySummary.recommendations.push('Improve DoS protection - high response times under load');
  }

  if (rateLimitRate === 0) {
    securitySummary.recommendations.push('Implement or verify rate limiting is working');
  }

  if (failedRequests / totalRequests > 0.1) {
    securitySummary.recommendations.push('Improve error handling and stability under load');
  }

  return {
    stdout: JSON.stringify(securitySummary, null, 2),
    'summary.json': JSON.stringify(data, null, 2),
  };
}
