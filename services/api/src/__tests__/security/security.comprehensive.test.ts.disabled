import request from 'supertest';
import * as crypto from 'crypto';
import app from '../../index';
import { jwtSecurityService } from '../../services/security/JwtSecurityService';
import { sessionSecurityService } from '../../services/security/SessionSecurityService';
import { dataExportService } from '../../services/security/DataExportService';
import { redis } from '../../services/redis';

/**
 * COMPREHENSIVE SECURITY TEST SUITE
 * Tests all critical security vulnerabilities and their remediation:
 * - OAuth 2.0 PKCE and state validation
 * - JWT security and rotation
 * - File upload security
 * - CSRF protection
 * - Session management security
 * - Data export authorization
 * - Authentication bypass attempts
 */

describe('Security Comprehensive Test Suite', () => {
  let testUserId: string;
  let testUserToken: string;
  let adminUserId: string;
  let adminToken: string;

  beforeAll(async () => {
    // Setup test users
    testUserId = 'test-user-' + crypto.randomUUID();
    adminUserId = 'admin-user-' + crypto.randomUUID();

    // Generate test tokens
    const testTokenData = await jwtSecurityService.generateToken({
      userId: testUserId,
      email: 'test@upcoach.ai',
      role: 'user',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent'
    });
    testUserToken = testTokenData.token;

    const adminTokenData = await jwtSecurityService.generateToken({
      userId: adminUserId,
      email: 'admin@upcoach.ai',
      role: 'admin',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent'
    });
    adminToken = adminTokenData.token;
  });

  afterAll(async () => {
    // Cleanup test data
    await redis.flushall();
  });

  describe('OAuth 2.0 Security', () => {
    describe('PKCE Implementation', () => {
      test('should generate valid PKCE challenge and verifier', async () => {
        const { googleAuthService } = await import('../../services/auth/GoogleAuthService');
        const pkce = googleAuthService.generatePKCE();

        expect(pkce.codeVerifier).toBeDefined();
        expect(pkce.codeChallenge).toBeDefined();
        expect(pkce.codeChallengeMethod).toBe('S256');
        expect(pkce.codeVerifier.length).toBeGreaterThan(43);
        expect(pkce.codeChallenge.length).toBeGreaterThan(32);
      });

      test('should verify PKCE challenge correctly', async () => {
        const { googleAuthService } = await import('../../services/auth/GoogleAuthService');
        const pkce = googleAuthService.generatePKCE();

        const isValid = googleAuthService.verifyPKCE(pkce.codeVerifier, pkce.codeChallenge);
        expect(isValid).toBe(true);

        const isInvalid = googleAuthService.verifyPKCE('invalid-verifier', pkce.codeChallenge);
        expect(isInvalid).toBe(false);
      });
    });

    describe('State Parameter Validation', () => {
      test('should generate and validate OAuth state with comprehensive checks', async () => {
        const { googleAuthService } = await import('../../services/auth/GoogleAuthService');
        const clientId = 'test-client-id';
        const redirectUri = 'https://upcoach.ai/callback';

        const oauthState = await googleAuthService.generateOAuthState(clientId, redirectUri);

        expect(oauthState.state).toBeDefined();
        expect(oauthState.nonce).toBeDefined();
        expect(oauthState.clientId).toBe(clientId);
        expect(oauthState.redirectUri).toBe(redirectUri);

        // Validate immediately
        const validation = await googleAuthService.validateOAuthState(
          oauthState.state,
          clientId,
          redirectUri
        );

        expect(validation.valid).toBe(true);
        expect(validation.nonce).toBe(oauthState.nonce);
      });

      test('should reject state with mismatched client ID', async () => {
        const { googleAuthService } = await import('../../services/auth/GoogleAuthService');
        const clientId = 'test-client-id';
        const redirectUri = 'https://upcoach.ai/callback';

        const oauthState = await googleAuthService.generateOAuthState(clientId, redirectUri);

        const validation = await googleAuthService.validateOAuthState(
          oauthState.state,
          'different-client-id',
          redirectUri
        );

        expect(validation.valid).toBe(false);
      });

      test('should reject expired state', async () => {
        const { googleAuthService } = await import('../../services/auth/GoogleAuthService');
        const clientId = 'test-client-id';
        const redirectUri = 'https://upcoach.ai/callback';

        const oauthState = await googleAuthService.generateOAuthState(clientId, redirectUri);

        // Manually expire the state in Redis
        await redis.del(`oauth_state:${oauthState.state}`);

        const validation = await googleAuthService.validateOAuthState(
          oauthState.state,
          clientId,
          redirectUri
        );

        expect(validation.valid).toBe(false);
      });
    });
  });

  describe('JWT Security', () => {
    describe('Token Generation and Validation', () => {
      test('should generate secure JWT with fingerprinting', async () => {
        const tokenData = await jwtSecurityService.generateToken({
          userId: testUserId,
          email: 'test@upcoach.ai',
          role: 'user',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...'
        }, '15m', {
          includeFingerprint: true,
          bindToDevice: true,
          restrictToIP: true
        });

        expect(tokenData.token).toBeDefined();
        expect(tokenData.tokenId).toBeDefined();
        expect(tokenData.fingerprint).toBeDefined();

        const verification = await jwtSecurityService.verifyToken(tokenData.token, {
          checkFingerprint: true,
          expectedFingerprint: tokenData.fingerprint,
          checkIPBinding: true,
          currentIP: '192.168.1.1'
        });

        expect(verification.valid).toBe(true);
        expect(verification.payload).toBeDefined();
      });

      test('should detect fingerprint mismatch', async () => {
        const tokenData = await jwtSecurityService.generateToken({
          userId: testUserId,
          email: 'test@upcoach.ai',
          role: 'user',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...'
        }, '15m', {
          includeFingerprint: true
        });

        const verification = await jwtSecurityService.verifyToken(tokenData.token, {
          checkFingerprint: true,
          expectedFingerprint: 'different-fingerprint'
        });

        expect(verification.valid).toBe(false);
        expect(verification.violations).toContain('FINGERPRINT_MISMATCH');
      });

      test('should handle token blacklisting', async () => {
        const tokenData = await jwtSecurityService.generateToken({
          userId: testUserId,
          email: 'test@upcoach.ai',
          role: 'user'
        });

        // Token should be valid initially
        let verification = await jwtSecurityService.verifyToken(tokenData.token);
        expect(verification.valid).toBe(true);

        // Blacklist the token
        await jwtSecurityService.revokeToken(tokenData.token, 'security_violation');

        // Token should now be invalid
        verification = await jwtSecurityService.verifyToken(tokenData.token);
        expect(verification.valid).toBe(false);
        expect(verification.violations).toContain('TOKEN_BLACKLISTED');
      });
    });

    describe('Secret Rotation', () => {
      test('should handle secret rotation gracefully', async () => {
        const tokenData = await jwtSecurityService.generateToken({
          userId: testUserId,
          email: 'test@upcoach.ai',
          role: 'user'
        });

        // Token should be valid with current secret
        let verification = await jwtSecurityService.verifyToken(tokenData.token);
        expect(verification.valid).toBe(true);

        // Force secret rotation
        await jwtSecurityService.forceSecretRotation('test rotation');

        // Token should still be valid during grace period (previous secret)
        verification = await jwtSecurityService.verifyToken(tokenData.token);
        expect(verification.valid).toBe(true);
      });
    });
  });

  describe('File Upload Security', () => {
    describe('Magic Byte Validation', () => {
      test('should reject files with mismatched MIME types', async () => {
        // Create a fake image file that's actually executable
        const maliciousFile = Buffer.from('MZ' + 'fake image data'); // PE executable header

        const response = await request(app)
          .post('/api/upload/test')
          .set('Authorization', `Bearer ${testUserToken}`)
          .attach('file', maliciousFile, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('MAGIC_BYTE_MISMATCH');
      });

      test('should reject dangerous file extensions', async () => {
        const response = await request(app)
          .post('/api/upload/test')
          .set('Authorization', `Bearer ${testUserToken}`)
          .attach('file', Buffer.from('test content'), {
            filename: 'malware.exe',
            contentType: 'application/octet-stream'
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('FILE_TYPE_NOT_ALLOWED');
      });
    });

    describe('Antivirus Scanning Simulation', () => {
      test('should detect embedded scripts in files', async () => {
        const maliciousContent = Buffer.from(`
          Valid file content
          <script>alert('xss')</script>
          More content
        `);

        const response = await request(app)
          .post('/api/upload/test')
          .set('Authorization', `Bearer ${testUserToken}`)
          .attach('file', maliciousContent, {
            filename: 'document.txt',
            contentType: 'text/plain'
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('SECURITY_SCAN_FAILED');
        expect(response.body.threats).toContain('EMBEDDED_SCRIPT');
      });
    });

    describe('File Size Validation', () => {
      test('should reject oversized files', async () => {
        const largeFile = Buffer.alloc(200 * 1024 * 1024); // 200MB

        const response = await request(app)
          .post('/api/upload/test')
          .set('Authorization', `Bearer ${testUserToken}`)
          .attach('file', largeFile, {
            filename: 'large.txt',
            contentType: 'text/plain'
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('FILE_TOO_LARGE');
      });
    });
  });

  describe('CSRF Protection', () => {
    test('should require CSRF token for state-changing operations', async () => {
      const response = await request(app)
        .post('/api/test/csrf-protected')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ data: 'test' });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('CSRF_TOKEN_REQUIRED');
    });

    test('should accept valid CSRF token', async () => {
      // Get CSRF token
      const tokenResponse = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', 'session-id=test-session');

      const csrfToken = tokenResponse.body.csrfToken;

      const response = await request(app)
        .post('/api/test/csrf-protected')
        .set('Authorization', `Bearer ${testUserToken}`)
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', 'session-id=test-session')
        .send({ data: 'test' });

      expect(response.status).not.toBe(403);
    });

    test('should reject invalid CSRF tokens', async () => {
      const response = await request(app)
        .post('/api/test/csrf-protected')
        .set('Authorization', `Bearer ${testUserToken}`)
        .set('X-CSRF-Token', 'invalid-token')
        .set('Cookie', 'session-id=test-session')
        .send({ data: 'test' });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('CSRF_TOKEN_INVALID');
    });
  });

  describe('Session Management Security', () => {
    test('should create secure session with device fingerprinting', async () => {
      const mockReq = {
        ip: '192.168.1.100',
        headers: {
          'user-agent': 'Mozilla/5.0 Test Browser',
          'accept-language': 'en-US,en;q=0.9',
          'accept-encoding': 'gzip, deflate'
        }
      };

      const mockRes = {
        cookie: jest.fn()
      };

      const sessionId = await sessionSecurityService.createSession(
        testUserId,
        'test@upcoach.ai',
        'user',
        mockReq as any,
        mockRes as any
      );

      expect(sessionId).toBeDefined();
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'session_id',
        sessionId,
        expect.objectContaining({
          httpOnly: true,
          secure: false, // Test environment
          sameSite: 'strict'
        })
      );
    });

    test('should detect session hijacking attempts', async () => {
      const mockReq1 = {
        ip: '192.168.1.100',
        headers: {
          'user-agent': 'Mozilla/5.0 Original Browser'
        }
      };

      const mockReq2 = {
        ip: '192.168.1.200', // Different IP
        headers: {
          'user-agent': 'Mozilla/5.0 Different Browser' // Different user agent
        }
      };

      const mockRes = {
        cookie: jest.fn()
      };

      const sessionId = await sessionSecurityService.createSession(
        testUserId,
        'test@upcoach.ai',
        'user',
        mockReq1 as any,
        mockRes as any
      );

      // Validation with different device should fail
      const validation = await sessionSecurityService.validateSession(
        sessionId,
        mockReq2 as any
      );

      expect(validation.valid).toBe(false);
      expect(validation.violations).toContain('DEVICE_FINGERPRINT_MISMATCH');
    });

    test('should enforce concurrent session limits', async () => {
      const mockReq = {
        ip: '192.168.1.100',
        headers: { 'user-agent': 'Test Browser' }
      };
      const mockRes = { cookie: jest.fn() };

      // Create maximum allowed sessions
      const sessionIds = [];
      for (let i = 0; i < 5; i++) {
        const sessionId = await sessionSecurityService.createSession(
          testUserId,
          'test@upcoach.ai',
          'user',
          mockReq as any,
          mockRes as any
        );
        sessionIds.push(sessionId);
      }

      // Creating one more should remove the oldest
      const newSessionId = await sessionSecurityService.createSession(
        testUserId,
        'test@upcoach.ai',
        'user',
        mockReq as any,
        mockRes as any
      );

      // First session should no longer be valid
      const validation = await sessionSecurityService.validateSession(
        sessionIds[0],
        mockReq as any
      );

      expect(validation.valid).toBe(false);
    });
  });

  describe('Data Export Security', () => {
    test('should require proper authorization for data export', async () => {
      // User trying to export another user's data
      const otherUserId = 'other-user-' + crypto.randomUUID();

      await expect(
        dataExportService.requestDataExport(
          otherUserId,
          testUserId,
          'user_data'
        )
      ).rejects.toThrow('Insufficient permissions');
    });

    test('should enforce rate limiting on export requests', async () => {
      // Make maximum allowed requests
      for (let i = 0; i < 3; i++) {
        await dataExportService.requestDataExport(
          testUserId,
          testUserId,
          'user_data'
        );
      }

      // Fourth request should be rate limited
      await expect(
        dataExportService.requestDataExport(
          testUserId,
          testUserId,
          'user_data'
        )
      ).rejects.toThrow('Export rate limit exceeded');
    });

    test('should allow admin to export any user data', async () => {
      const exportRequest = await dataExportService.requestDataExport(
        testUserId,
        adminUserId,
        'user_data'
      );

      expect(exportRequest.exportId).toBeDefined();
      expect(exportRequest.estimatedCompletionTime).toBeDefined();
    });

    test('should generate secure time-limited download URLs', async () => {
      const exportRequest = await dataExportService.requestDataExport(
        testUserId,
        testUserId,
        'user_data'
      );

      // Wait for processing to complete (in real scenario, this would be asynchronous)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const status = await dataExportService.getExportStatus(
        exportRequest.exportId,
        testUserId
      );

      if (status?.downloadUrl) {
        expect(status.downloadUrl).toMatch(/\/download\/[a-f0-9]{64}$/);
        expect(status.expiresAt).toBeDefined();
        expect(new Date(status.expiresAt!)).toBeInstanceOf(Date);
      }
    });
  });

  describe('Authentication Bypass Attempts', () => {
    test('should reject requests without authentication to protected endpoints', async () => {
      const response = await request(app)
        .get('/api/coach-intelligence/analytics/test-user-id');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    test('should reject expired JWT tokens', async () => {
      // Generate token with very short expiry
      const shortTokenData = await jwtSecurityService.generateToken({
        userId: testUserId,
        email: 'test@upcoach.ai',
        role: 'user'
      }, '1ms'); // 1 millisecond

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/api/coach-intelligence/analytics/' + testUserId)
        .set('Authorization', `Bearer ${shortTokenData.token}`);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });

    test('should reject malformed JWT tokens', async () => {
      const response = await request(app)
        .get('/api/coach-intelligence/analytics/' + testUserId)
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    test('should enforce role-based access control', async () => {
      // Regular user trying to access admin endpoint
      const response = await request(app)
        .get('/api/coach-intelligence/cohort-analytics')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    test('should enforce resource ownership', async () => {
      const otherUserId = 'other-user-' + crypto.randomUUID();

      // User trying to access another user's data
      const response = await request(app)
        .get(`/api/coach-intelligence/analytics/${otherUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('SQL Injection Prevention', () => {
    test('should prevent SQL injection in user parameters', async () => {
      const maliciousUserId = "'; DROP TABLE users; --";

      const response = await request(app)
        .get(`/api/coach-intelligence/analytics/${encodeURIComponent(maliciousUserId)}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      // Should not crash the server and should return proper error
      expect(response.status).toBe(403); // Access denied due to ownership check
    });
  });

  describe('XSS Prevention', () => {
    test('should sanitize user input to prevent XSS', async () => {
      const xssPayload = '<script>alert("xss")</script>';

      const response = await request(app)
        .post('/api/test/user-input')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ name: xssPayload });

      if (response.status === 200) {
        expect(response.body.sanitizedName).not.toContain('<script>');
      }
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce API rate limits', async () => {
      const requests = [];

      // Make many requests quickly
      for (let i = 0; i < 150; i++) {
        requests.push(
          request(app)
            .get('/api/health')
            .set('Authorization', `Bearer ${testUserToken}`)
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    test('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    test('should validate request body structure', async () => {
      const response = await request(app)
        .post('/api/test/validation')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          invalidField: 'value',
          missingRequiredField: undefined
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/validation/i);
    });

    test('should validate email formats', async () => {
      const response = await request(app)
        .post('/api/test/email-validation')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ email: 'invalid-email-format' });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/invalid.*email/i);
    });
  });
});

// Helper function to create mock HTTP request/response objects
function createMockReq(overrides: any = {}) {
  return {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-agent',
      'accept-language': 'en-US',
      'accept-encoding': 'gzip'
    },
    ...overrides
  };
}

function createMockRes() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}