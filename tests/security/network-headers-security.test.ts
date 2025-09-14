/**
 * Network Security & Headers Testing Suite
 * 
 * Comprehensive security testing for network-level protection:
 * - Security Headers (CSP, HSTS, X-Frame-Options, etc.)
 * - CORS configuration validation
 * - SSL/TLS security
 * - Rate limiting effectiveness
 * - DDoS protection mechanisms
 * - HTTP security best practices
 * - Cookie security attributes
 * - Referrer policy validation
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import https from 'https';
import http from 'http';
import crypto from 'crypto';
import { app } from '../../services/api/src/index';

interface SecurityHeaders {
  'strict-transport-security'?: string;
  'content-security-policy'?: string;
  'x-frame-options'?: string;
  'x-content-type-options'?: string;
  'x-xss-protection'?: string;
  'referrer-policy'?: string;
  'permissions-policy'?: string;
  'x-dns-prefetch-control'?: string;
  'expect-ct'?: string;
}

interface TestEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  requiresAuth?: boolean;
}

describe('Network Security & Headers Testing', () => {
  const testEndpoints: TestEndpoint[] = [
    { method: 'GET', path: '/' },
    { method: 'GET', path: '/api/health' },
    { method: 'GET', path: '/api/auth/profile', requiresAuth: true },
    { method: 'POST', path: '/api/auth/login' },
    { method: 'GET', path: '/admin', requiresAuth: true },
    { method: 'GET', path: '/api/admin/users', requiresAuth: true }
  ];

  let testToken: string;

  beforeEach(async () => {
    // Get valid auth token for authenticated tests
    testToken = await getTestAuthToken();
  });

  afterEach(async () => {
    // Cleanup any test data
    await cleanupTestData();
  });

  describe('Security Headers Tests', () => {
    test('should implement comprehensive security headers', async () => {
      for (const endpoint of testEndpoints) {
        let requestBuilder = request(app)[endpoint.method.toLowerCase() as keyof typeof request];
        
        if (endpoint.requiresAuth && testToken) {
          requestBuilder = requestBuilder.set('Authorization', `Bearer ${testToken}`);
        }

        const response = await requestBuilder(endpoint.path);
        
        // Skip if endpoint returns 404 or requires different auth
        if ([404, 401, 403].includes(response.status)) continue;

        const headers = response.headers as SecurityHeaders;

        // Test HSTS (HTTP Strict Transport Security)
        expect(headers['strict-transport-security']).toBeDefined();
        expect(headers['strict-transport-security']).toMatch(/max-age=\d+/);
        expect(headers['strict-transport-security']).toContain('includeSubDomains');
        expect(headers['strict-transport-security']).toContain('preload');

        // Test Content Security Policy
        expect(headers['content-security-policy']).toBeDefined();
        const csp = headers['content-security-policy']!;
        expect(csp).toContain("default-src 'self'");
        expect(csp).not.toContain("'unsafe-eval'"); // Should not allow eval
        expect(csp).not.toContain("'unsafe-inline'"); // Should minimize inline scripts
        expect(csp).toContain('upgrade-insecure-requests');

        // Test X-Frame-Options
        expect(headers['x-frame-options']).toBeDefined();
        expect(['DENY', 'SAMEORIGIN']).toContain(headers['x-frame-options']);

        // Test X-Content-Type-Options
        expect(headers['x-content-type-options']).toBe('nosniff');

        // Test X-XSS-Protection
        expect(headers['x-xss-protection']).toBeDefined();
        expect(headers['x-xss-protection']).toMatch(/1; mode=block|0/);

        // Test Referrer Policy
        expect(headers['referrer-policy']).toBeDefined();
        expect([
          'no-referrer',
          'no-referrer-when-downgrade',
          'strict-origin-when-cross-origin',
          'same-origin'
        ]).toContain(headers['referrer-policy']);

        // Test Permissions Policy (formerly Feature Policy)
        expect(headers['permissions-policy']).toBeDefined();
        const permissionsPolicy = headers['permissions-policy']!;
        expect(permissionsPolicy).toContain('camera=()');
        expect(permissionsPolicy).toContain('microphone=()');
        expect(permissionsPolicy).toContain('geolocation=()');

        // Test DNS Prefetch Control
        expect(headers['x-dns-prefetch-control']).toBe('off');

        // Test Expect-CT (Certificate Transparency)
        if (headers['expect-ct']) {
          expect(headers['expect-ct']).toMatch(/max-age=\d+/);
          expect(headers['expect-ct']).toContain('enforce');
        }
      }
    });

    test('should set secure cookie attributes', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@upcoach.ai',
          password: 'testpassword123'
        });

      const setCookieHeaders = loginResponse.headers['set-cookie'];
      
      if (setCookieHeaders && Array.isArray(setCookieHeaders)) {
        for (const cookie of setCookieHeaders) {
          // Test HttpOnly flag
          expect(cookie).toContain('HttpOnly');
          
          // Test Secure flag
          expect(cookie).toContain('Secure');
          
          // Test SameSite attribute
          expect(cookie).toMatch(/SameSite=(Strict|Lax)/);
          
          // Test Path attribute
          expect(cookie).toContain('Path=/');
          
          // Test expiration for session cookies
          if (cookie.includes('session')) {
            // Session cookies should not have long expiration
            expect(cookie).not.toMatch(/Max-Age=\d{8,}/); // Not more than ~3 months
          }
        }
      }
    });

    test('should prevent information disclosure in headers', async () => {
      const response = await request(app).get('/api/health');

      // Should not reveal server information
      expect(response.headers['server']).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
      
      // Should not reveal internal paths or versions
      const headerValues = Object.values(response.headers).join(' ');
      expect(headerValues).not.toMatch(/\/usr\/|\/var\/|\/etc\/|\/home\//);
      expect(headerValues).not.toMatch(/nginx\/[\d\.]+|apache\/[\d\.]+/i);
      expect(headerValues).not.toMatch(/php\/[\d\.]+|node\.js\/[\d\.]+/i);
    });

    test('should implement proper CSP for different content types', async () => {
      const contentEndpoints = [
        { path: '/api/content/articles', contentType: 'api' },
        { path: '/admin', contentType: 'admin-panel' },
        { path: '/api/upload/image', contentType: 'upload', method: 'POST' }
      ];

      for (const endpoint of contentEndpoints) {
        let requestBuilder = endpoint.method === 'POST' 
          ? request(app).post(endpoint.path)
          : request(app).get(endpoint.path);

        if (testToken) {
          requestBuilder = requestBuilder.set('Authorization', `Bearer ${testToken}`);
        }

        const response = await requestBuilder;
        
        if ([401, 403, 404].includes(response.status)) continue;

        const csp = response.headers['content-security-policy'];
        
        if (csp) {
          // API endpoints should have stricter CSP
          if (endpoint.contentType === 'api') {
            expect(csp).toContain("default-src 'none'");
          }
          
          // Admin panels may need more permissive CSP but still secure
          if (endpoint.contentType === 'admin-panel') {
            expect(csp).toContain("script-src 'self'");
            expect(csp).not.toContain("script-src 'unsafe-eval'");
          }
          
          // Upload endpoints should restrict object sources
          if (endpoint.contentType === 'upload') {
            expect(csp).toContain("object-src 'none'");
          }
        }
      }
    });
  });

  describe('CORS Security Tests', () => {
    test('should implement secure CORS policy', async () => {
      const corsTestCases = [
        {
          origin: 'https://upcoach.ai',
          shouldAllow: true
        },
        {
          origin: 'https://app.upcoach.ai',
          shouldAllow: true
        },
        {
          origin: 'https://admin.upcoach.ai',
          shouldAllow: true
        },
        {
          origin: 'https://malicious.com',
          shouldAllow: false
        },
        {
          origin: 'http://upcoach.ai', // HTTP instead of HTTPS
          shouldAllow: false
        },
        {
          origin: 'https://evil-upcoach.ai.malicious.com',
          shouldAllow: false
        },
        {
          origin: null, // No origin (direct request)
          shouldAllow: false
        }
      ];

      for (const testCase of corsTestCases) {
        const requestBuilder = request(app)
          .options('/api/auth/login')
          .set('Access-Control-Request-Method', 'POST')
          .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

        if (testCase.origin) {
          requestBuilder.set('Origin', testCase.origin);
        }

        const response = await requestBuilder;

        if (testCase.shouldAllow) {
          expect(response.status).toBe(204);
          expect(response.headers['access-control-allow-origin']).toBe(testCase.origin);
          expect(response.headers['access-control-allow-methods']).toBeDefined();
          expect(response.headers['access-control-allow-headers']).toBeDefined();
        } else {
          // Should either reject or not set CORS headers
          if (response.status === 200 || response.status === 204) {
            expect(response.headers['access-control-allow-origin']).not.toBe(testCase.origin);
          }
        }
      }
    });

    test('should prevent CORS wildcard with credentials', async () => {
      const response = await request(app)
        .options('/api/auth/profile')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Authorization');

      // If credentials are allowed, origin should not be wildcard
      if (response.headers['access-control-allow-credentials'] === 'true') {
        expect(response.headers['access-control-allow-origin']).not.toBe('*');
      }
    });

    test('should validate preflight requests properly', async () => {
      // Test complex CORS request that requires preflight
      const preflightResponse = await request(app)
        .options('/api/users/profile')
        .set('Origin', 'https://app.upcoach.ai')
        .set('Access-Control-Request-Method', 'PUT')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization, X-Custom-Header');

      if (preflightResponse.status === 204) {
        // Check that only allowed headers are permitted
        const allowedHeaders = preflightResponse.headers['access-control-allow-headers']?.toLowerCase() || '';
        expect(allowedHeaders).toContain('content-type');
        expect(allowedHeaders).toContain('authorization');
        expect(allowedHeaders).not.toContain('x-admin-token'); // Should not allow dangerous headers
      }
    });
  });

  describe('Rate Limiting Tests', () => {
    test('should implement rate limiting on authentication endpoints', async () => {
      const maxAttempts = 10; // Adjust based on actual rate limit
      const endpoint = '/api/auth/login';
      const requests = [];

      // Make rapid requests to trigger rate limiting
      for (let i = 0; i < maxAttempts + 5; i++) {
        requests.push(
          request(app)
            .post(endpoint)
            .send({
              email: 'test@example.com',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // Should have at least some rate limited responses
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Check rate limit headers
      const rateLimitedResponse = rateLimitedResponses[0];
      expect(rateLimitedResponse.headers['retry-after']).toBeDefined();
      expect(rateLimitedResponse.headers['x-ratelimit-remaining']).toBeDefined();
    });

    test('should implement different rate limits for different endpoints', async () => {
      const endpointRateLimits = [
        { endpoint: '/api/auth/login', expectedLimit: 5 }, // Stricter for auth
        { endpoint: '/api/goals', expectedLimit: 100 }, // More lenient for API
        { endpoint: '/api/upload/file', expectedLimit: 10 } // Moderate for uploads
      ];

      for (const testCase of endpointRateLimits) {
        // Make requests to check rate limit headers
        const response = await request(app)
          .get(testCase.endpoint)
          .set('Authorization', `Bearer ${testToken}`);

        if (response.headers['x-ratelimit-limit']) {
          const limit = parseInt(response.headers['x-ratelimit-limit']);
          // Verify the limit is within expected range
          expect(limit).toBeGreaterThanOrEqual(testCase.expectedLimit / 2);
          expect(limit).toBeLessThanOrEqual(testCase.expectedLimit * 2);
        }
      }
    });

    test('should implement IP-based rate limiting', async () => {
      const rapidRequests = [];
      
      // Simulate requests from same IP
      for (let i = 0; i < 20; i++) {
        rapidRequests.push(
          request(app)
            .get('/api/health')
            .set('X-Forwarded-For', '192.168.1.100')
        );
      }

      const responses = await Promise.all(rapidRequests);
      
      // Should eventually rate limit by IP
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    test('should handle rate limiting bypass attempts', async () => {
      const bypassAttempts = [
        // Try different IP headers
        { 'X-Forwarded-For': '127.0.0.1' },
        { 'X-Real-IP': '127.0.0.1' },
        { 'X-Originating-IP': '127.0.0.1' },
        { 'X-Client-IP': '127.0.0.1' },
        
        // Try to spoof headers
        { 'X-Forwarded-For': '192.168.1.1, 127.0.0.1' },
        { 'X-Forwarded-For': 'multiple, ips, here' },
        
        // Try user agent variations
        { 'User-Agent': 'Different-Agent-1.0' },
        { 'User-Agent': 'Mobile-App-2.0' }
      ];

      const endpoint = '/api/auth/login';
      
      // First, trigger rate limiting
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post(endpoint)
          .send({ email: 'test@example.com', password: 'wrong' });
      }

      // Now try bypass attempts
      for (const headers of bypassAttempts) {
        const response = await request(app)
          .post(endpoint)
          .set(headers)
          .send({ email: 'test@example.com', password: 'wrong' });

        // Should still be rate limited
        expect([400, 429]).toContain(response.status);
      }
    });
  });

  describe('SSL/TLS Security Tests', () => {
    test('should enforce HTTPS redirects', async () => {
      // This test would typically require a separate HTTP server
      // For now, we'll test that HSTS is properly set to enforce HTTPS
      
      const response = await request(app).get('/api/health');
      const hsts = response.headers['strict-transport-security'];
      
      expect(hsts).toBeDefined();
      expect(hsts).toContain('max-age=');
      
      // Should have a reasonable max-age (at least 6 months)
      const maxAgeMatch = hsts.match(/max-age=(\d+)/);
      if (maxAgeMatch) {
        const maxAge = parseInt(maxAgeMatch[1]);
        expect(maxAge).toBeGreaterThanOrEqual(15768000); // 6 months in seconds
      }
    });

    test('should set appropriate TLS security headers', async () => {
      const response = await request(app).get('/');
      
      // Check for HSTS with appropriate directives
      const hsts = response.headers['strict-transport-security'];
      if (hsts) {
        expect(hsts).toContain('includeSubDomains');
        expect(hsts).toContain('preload');
      }

      // Check for Expect-CT header
      const expectCT = response.headers['expect-ct'];
      if (expectCT) {
        expect(expectCT).toContain('enforce');
        expect(expectCT).toMatch(/max-age=\d+/);
      }
    });
  });

  describe('HTTP Security Best Practices Tests', () => {
    test('should prevent HTTP response splitting', async () => {
      const maliciousHeaders = [
        'test\r\nX-Injected-Header: malicious',
        'test\nSet-Cookie: admin=true',
        'test%0d%0aX-Injected: header',
        'test%0a%0dLocation: http://evil.com'
      ];

      for (const maliciousValue of maliciousHeaders) {
        const response = await request(app)
          .get(`/api/content/articles?category=${encodeURIComponent(maliciousValue)}`)
          .set('Authorization', `Bearer ${testToken}`);

        // Should not reflect the malicious value in headers
        const responseHeaders = JSON.stringify(response.headers);
        expect(responseHeaders).not.toContain('X-Injected');
        expect(responseHeaders).not.toContain('malicious');
        expect(responseHeaders).not.toContain('evil.com');
      }
    });

    test('should implement proper error handling without information leakage', async () => {
      const errorEndpoints = [
        '/api/nonexistent',
        '/api/users/invalid-id',
        '/api/admin/secret-endpoint'
      ];

      for (const endpoint of errorEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${testToken}`);

        // Error responses should not leak sensitive information
        const responseText = JSON.stringify(response.body) + JSON.stringify(response.headers);
        
        // Should not contain stack traces
        expect(responseText).not.toMatch(/at Object\.|at Function\.|at \/.*\.js:/);
        
        // Should not contain file paths
        expect(responseText).not.toMatch(/\/usr\/|\/var\/|\/home\/|C:\\/);
        
        // Should not contain database connection strings
        expect(responseText).not.toMatch(/mongodb:\/\/|postgresql:\/\/|mysql:\/\//);
        
        // Should not contain internal service URLs
        expect(responseText).not.toMatch(/localhost:\d+|127\.0\.0\.1:\d+/);
      }
    });

    test('should prevent HTTP method tampering', async () => {
      const tamperedMethods = [
        'TRACE',
        'TRACK', 
        'DEBUG',
        'CONNECT',
        'PROPFIND',
        'PROPPATCH',
        'MKCOL',
        'COPY',
        'MOVE',
        'LOCK',
        'UNLOCK'
      ];

      for (const method of tamperedMethods) {
        try {
          const response = await request(app)[method.toLowerCase() as keyof typeof request]('/api/health');
          
          // These methods should not be allowed
          expect([405, 501]).toContain(response.status);
        } catch (error) {
          // Method not implemented in supertest is also acceptable
          expect(error).toBeDefined();
        }
      }
    });

    test('should validate Content-Type headers', async () => {
      const maliciousContentTypes = [
        'application/json; charset=utf-7', // UTF-7 XSS
        'text/html; charset=utf-7',
        'application/json\r\nX-Injected: header',
        'multipart/form-data; boundary=--evil\r\nX-Test: header'
      ];

      for (const contentType of maliciousContentTypes) {
        const response = await request(app)
          .post('/api/goals')
          .set('Content-Type', contentType)
          .set('Authorization', `Bearer ${testToken}`)
          .send({ title: 'Test Goal' });

        // Should reject or sanitize malicious content types
        expect([400, 415, 422]).toContain(response.status);
      }
    });
  });

  describe('DDoS Protection Tests', () => {
    test('should handle large request payloads', async () => {
      const largePayload = {
        title: 'A'.repeat(10000), // 10KB title
        description: 'B'.repeat(100000), // 100KB description
        data: 'C'.repeat(1000000) // 1MB data field
      };

      const response = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${testToken}`)
        .send(largePayload);

      // Should reject oversized payloads
      expect([413, 400, 422]).toContain(response.status);
    });

    test('should handle slow client attacks', async () => {
      // Simulate slow POST by sending data in chunks
      const slowResponse = await new Promise<any>((resolve) => {
        const req = request(app)
          .post('/api/goals')
          .set('Authorization', `Bearer ${testToken}`)
          .set('Content-Type', 'application/json')
          .timeout(5000); // 5 second timeout

        req.write('{"title":"');
        
        // Send the rest after a delay to simulate slow client
        setTimeout(() => {
          req.write('test","description":"slow request"}');
          req.end();
        }, 3000);

        req.end((err, res) => {
          resolve({ err, res });
        });
      });

      // Should handle slow clients gracefully
      if (slowResponse.err) {
        expect(slowResponse.err.message).toMatch(/timeout|ECONNRESET/i);
      } else {
        expect([408, 400]).toContain(slowResponse.res.status);
      }
    });

    test('should limit concurrent connections', async () => {
      const concurrentRequests = [];
      const connectionCount = 50;

      // Create many concurrent requests
      for (let i = 0; i < connectionCount; i++) {
        concurrentRequests.push(
          request(app)
            .get('/api/health')
            .timeout(10000)
        );
      }

      const responses = await Promise.allSettled(concurrentRequests);
      
      // Should handle concurrent requests but may reject some if limit exceeded
      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length;
      
      const rateLimited = responses.filter(r =>
        r.status === 'fulfilled' && r.value.status === 429
      ).length;

      // Should either handle all or rate limit some
      expect(successful + rateLimited).toBeGreaterThan(connectionCount * 0.5);
    });
  });

  // Helper functions
  async function getTestAuthToken(): Promise<string> {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@upcoach.ai',
        password: 'testpassword123'
      });

    return loginResponse.body.accessToken || 'mock-token';
  }

  async function cleanupTestData(): Promise<void> {
    // Cleanup test data if needed
    try {
      await request(app)
        .delete('/api/test/cleanup')
        .set('Authorization', `Bearer ${testToken}`);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
});