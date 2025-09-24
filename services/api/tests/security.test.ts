import request from 'supertest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import app from '../src/index';
import { redis } from '../src/services/redis';
import { secretManager } from '../src/config/secrets';

// Test configuration
const TEST_TIMEOUT = 30000;
const API_BASE = '/api';

describe('Security Tests', () => {
  let testToken: string;
  let testUserId: number;

  beforeAll(async () => {
    // Setup test environment
    process.env.NODE_ENV = 'test';

    // Create test user and token
    testUserId = 1;
    testToken = jwt.sign(
      { id: testUserId, email: 'test@example.com' },
      secretManager.getSecret('JWT_SECRET') || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Cleanup
    await redis.flushdb();
  });

  describe('Authentication Security', () => {
    test('should reject requests without authentication', async () => {
      const response = await request(app)
        .get(`${API_BASE}/users/profile`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Unauthorized');
    }, TEST_TIMEOUT);

    test('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        { id: testUserId, email: 'test@example.com' },
        secretManager.getSecret('JWT_SECRET') || 'test-secret',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get(`${API_BASE}/users/profile`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    }, TEST_TIMEOUT);

    test('should reject tokens with invalid signature', async () => {
      const invalidToken = jwt.sign(
        { id: testUserId, email: 'test@example.com' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get(`${API_BASE}/users/profile`)
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    }, TEST_TIMEOUT);

    test('should validate JWT audience claim', async () => {
      const wrongAudienceToken = jwt.sign(
        { id: testUserId, email: 'test@example.com' },
        secretManager.getSecret('JWT_SECRET') || 'test-secret',
        { expiresIn: '1h', audience: 'wrong-audience' }
      );

      const response = await request(app)
        .get(`${API_BASE}/users/profile`)
        .set('Authorization', `Bearer ${wrongAudienceToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    }, TEST_TIMEOUT);
  });

  describe('SQL Injection Prevention', () => {
    test('should prevent SQL injection in query parameters', async () => {
      const maliciousQuery = "1' OR '1'='1";

      const response = await request(app)
        .get(`${API_BASE}/users`)
        .query({ id: maliciousQuery })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).not.toContain('SQL');
    }, TEST_TIMEOUT);

    test('should prevent SQL injection in body parameters', async () => {
      const maliciousPayload = {
        email: "admin@example.com'; DROP TABLE users; --",
        password: 'password123',
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send(maliciousPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    }, TEST_TIMEOUT);

    test('should sanitize user input in search queries', async () => {
      const response = await request(app)
        .get(`${API_BASE}/search`)
        .query({ q: "'; UNION SELECT * FROM users --" })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    }, TEST_TIMEOUT);
  });

  describe('XSS Prevention', () => {
    test('should prevent XSS in response data', async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const response = await request(app)
        .post(`${API_BASE}/comments`)
        .send({ content: xssPayload })
        .set('Authorization', `Bearer ${testToken}`);

      if (response.status === 200) {
        expect(response.body.content).not.toContain('<script>');
        expect(response.body.content).not.toContain('</script>');
      }
    }, TEST_TIMEOUT);

    test('should set proper Content-Type headers', async () => {
      const response = await request(app)
        .get(`${API_BASE}/health`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    }, TEST_TIMEOUT);
  });

  describe('CORS Security', () => {
    test('should reject requests from unauthorized origins', async () => {
      const response = await request(app)
        .get(`${API_BASE}/health`)
        .set('Origin', 'https://malicious-site.com')
        .expect(500); // CORS will block

      expect(response.text).toContain('CORS');
    }, TEST_TIMEOUT);

    test('should allow requests from authorized origins', async () => {
      const response = await request(app)
        .get(`${API_BASE}/health`)
        .set('Origin', 'https://upcoach.ai')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://upcoach.ai');
    }, TEST_TIMEOUT);

    test('should reject non-HTTPS origins in production', async () => {
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get(`${API_BASE}/health`)
        .set('Origin', 'http://upcoach.ai')
        .expect(500);

      expect(response.text).toContain('HTTPS required');

      process.env.NODE_ENV = 'test';
    }, TEST_TIMEOUT);
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits on API endpoints', async () => {
      const requests = [];

      // Make 101 requests (exceeding the 100 request limit)
      for (let i = 0; i < 101; i++) {
        requests.push(
          request(app)
            .get(`${API_BASE}/health`)
            .set('X-Forwarded-For', '192.168.1.100')
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      expect(rateLimited).toBe(true);
    }, TEST_TIMEOUT);

    test('should enforce strict rate limits on auth endpoints', async () => {
      const requests = [];

      // Make 6 auth requests (exceeding the 5 request limit)
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post(`${API_BASE}/auth/login`)
            .send({ email: 'test@example.com', password: 'wrong' })
            .set('X-Forwarded-For', '192.168.1.101')
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      expect(rateLimited).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('CSRF Protection', () => {
    test('should require CSRF token for state-changing operations', async () => {
      const response = await request(app)
        .post(`${API_BASE}/users/update`)
        .send({ name: 'Test User' })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('CSRF');
    }, TEST_TIMEOUT);

    test('should accept valid CSRF tokens', async () => {
      // Get CSRF token
      const tokenResponse = await request(app)
        .get(`${API_BASE}/csrf-token`)
        .expect(200);

      const csrfToken = tokenResponse.body.csrfToken;

      // Use CSRF token
      const response = await request(app)
        .post(`${API_BASE}/users/update`)
        .send({ name: 'Test User' })
        .set('Authorization', `Bearer ${testToken}`)
        .set('X-CSRF-Token', csrfToken);

      expect(response.status).not.toBe(403);
    }, TEST_TIMEOUT);
  });

  describe('Security Headers', () => {
    test('should set security headers correctly', async () => {
      const response = await request(app)
        .get(`${API_BASE}/health`)
        .expect(200);

      // Check security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

      if (process.env.NODE_ENV === 'production') {
        expect(response.headers['strict-transport-security']).toBeDefined();
        expect(response.headers['content-security-policy']).toBeDefined();
      }
    }, TEST_TIMEOUT);
  });

  describe('Authorization Security', () => {
    test('should enforce role-based access control', async () => {
      const memberToken = jwt.sign(
        { id: 2, email: 'member@example.com', role: 'member' },
        secretManager.getSecret('JWT_SECRET') || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .delete(`${API_BASE}/organizations/1`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Insufficient permissions');
    }, TEST_TIMEOUT);

    test('should prevent privilege escalation', async () => {
      const response = await request(app)
        .put(`${API_BASE}/users/1/role`)
        .send({ role: 'admin' })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    }, TEST_TIMEOUT);
  });

  describe('Input Validation', () => {
    test('should validate email format', async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send({
          email: 'invalid-email',
          password: 'ValidPassword123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('email');
    }, TEST_TIMEOUT);

    test('should enforce password complexity requirements', async () => {
      const weakPasswords = [
        'short',
        'nouppercase123!',
        'NOLOWERCASE123!',
        'NoNumbers!',
        'NoSpecialChar123',
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post(`${API_BASE}/auth/register`)
          .send({
            email: 'test@example.com',
            password,
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error.toLowerCase()).toContain('password');
      }
    }, TEST_TIMEOUT);

    test('should prevent path traversal attacks', async () => {
      const response = await request(app)
        .get(`${API_BASE}/files/../../etc/passwd`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    }, TEST_TIMEOUT);
  });

  describe('Session Security', () => {
    test('should regenerate session on login', async () => {
      const agent = request.agent(app);

      // Initial request to get session
      await agent.get(`${API_BASE}/health`);
      const initialCookie = agent.jar.getCookie('upcoach.sid', { path: '/' });

      // Login
      await agent
        .post(`${API_BASE}/auth/login`)
        .send({ email: 'test@example.com', password: 'TestPassword123!' });

      const newCookie = agent.jar.getCookie('upcoach.sid', { path: '/' });

      expect(newCookie).not.toBe(initialCookie);
    }, TEST_TIMEOUT);

    test('should set secure cookie flags in production', async () => {
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({ email: 'test@example.com', password: 'TestPassword123!' });

      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        const cookieString = Array.isArray(setCookieHeader)
          ? setCookieHeader[0]
          : setCookieHeader;

        expect(cookieString).toContain('Secure');
        expect(cookieString).toContain('HttpOnly');
        expect(cookieString).toContain('SameSite=Strict');
      }

      process.env.NODE_ENV = 'test';
    }, TEST_TIMEOUT);
  });

  describe('Cryptographic Security', () => {
    test('should use secure random number generation', () => {
      const token1 = crypto.randomBytes(32).toString('hex');
      const token2 = crypto.randomBytes(32).toString('hex');

      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64);
      expect(token2.length).toBe(64);
    });

    test('should properly hash passwords', async () => {
      const bcrypt = require('bcrypt');
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12);

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      expect(await bcrypt.compare(password, hash)).toBe(true);
      expect(await bcrypt.compare('WrongPassword', hash)).toBe(false);
    });
  });

  describe('API Versioning Security', () => {
    test('should reject unsupported API versions', async () => {
      const response = await request(app)
        .get('/api/v0/health')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    }, TEST_TIMEOUT);

    test('should handle deprecated endpoints securely', async () => {
      const response = await request(app)
        .get(`${API_BASE}/deprecated/endpoint`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(410);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('deprecated');
    }, TEST_TIMEOUT);
  });

  describe('File Upload Security', () => {
    test('should validate file types', async () => {
      const response = await request(app)
        .post(`${API_BASE}/upload`)
        .set('Authorization', `Bearer ${testToken}`)
        .attach('file', Buffer.from('test'), {
          filename: 'test.exe',
          contentType: 'application/x-msdownload',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('file type');
    }, TEST_TIMEOUT);

    test('should enforce file size limits', async () => {
      const largeBuffer = Buffer.alloc(100 * 1024 * 1024); // 100MB

      const response = await request(app)
        .post(`${API_BASE}/upload`)
        .set('Authorization', `Bearer ${testToken}`)
        .attach('file', largeBuffer, 'large.pdf')
        .expect(413);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('too large');
    }, TEST_TIMEOUT);
  });
});

describe('Penetration Testing Scenarios', () => {
  describe('Authentication Bypass Attempts', () => {
    test('should prevent JWT algorithm confusion attack', async () => {
      // Attempt to use 'none' algorithm
      const maliciousToken = jwt.sign(
        { id: 1, email: 'admin@example.com' },
        '',
        { algorithm: 'none' as any }
      );

      const response = await request(app)
        .get(`${API_BASE}/admin/users`)
        .set('Authorization', `Bearer ${maliciousToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    }, TEST_TIMEOUT);

    test('should prevent JWT key confusion attack', async () => {
      // Attempt to use public key as HMAC secret
      const publicKey = 'public-key-content';
      const maliciousToken = jwt.sign(
        { id: 1, email: 'admin@example.com' },
        publicKey,
        { algorithm: 'HS256' }
      );

      const response = await request(app)
        .get(`${API_BASE}/admin/users`)
        .set('Authorization', `Bearer ${maliciousToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    }, TEST_TIMEOUT);
  });

  describe('Business Logic Attacks', () => {
    test('should prevent race condition in concurrent requests', async () => {
      const promises = [];

      // Simulate concurrent withdrawal requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post(`${API_BASE}/withdraw`)
            .send({ amount: 100 })
            .set('Authorization', `Bearer ${testToken}`)
        );
      }

      const responses = await Promise.all(promises);
      const successfulWithdrawals = responses.filter(r => r.status === 200);

      // Should only allow one successful withdrawal
      expect(successfulWithdrawals.length).toBeLessThanOrEqual(1);
    }, TEST_TIMEOUT);

    test('should prevent negative number attacks', async () => {
      const response = await request(app)
        .post(`${API_BASE}/transfer`)
        .send({ amount: -1000, to: 'attacker@example.com' })
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid amount');
    }, TEST_TIMEOUT);
  });
});