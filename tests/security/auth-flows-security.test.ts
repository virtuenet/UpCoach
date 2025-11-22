/**
 * Authentication Flows Security Testing Suite
 * 
 * Comprehensive security testing for all authentication implementations:
 * - OAuth PKCE flows
 * - JWT token security
 * - Two-factor authentication (TOTP, SMS, Email)
 * - Biometric authentication
 * - WebAuthn/Passkey security
 * - Session management
 * - Device binding and trusted devices
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import { app } from '../../services/api/src/index';

interface TestUser {
  id: string;
  email: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
  totpSecret?: string;
  phoneNumber?: string;
}

describe('Authentication Security Testing', () => {
  let testUser: TestUser;
  let maliciousUser: TestUser;

  beforeEach(async () => {
    // Create test users with controlled data
    testUser = {
      id: crypto.randomUUID(),
      email: 'test-security@upcoach.ai',
      password: 'SecureTestPassword123!',
      phoneNumber: '+1234567890'
    };

    maliciousUser = {
      id: crypto.randomUUID(),
      email: 'malicious@example.com',
      password: 'MaliciousPassword123!'
    };

    // Clean up any existing test data
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('OAuth PKCE Security Tests', () => {
    test('should enforce PKCE code verifier validation', async () => {
      // Generate proper PKCE parameters
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

      // Start OAuth flow
      const authResponse = await request(app)
        .post('/api/auth/oauth/authorize')
        .send({
          response_type: 'code',
          client_id: 'test-client',
          redirect_uri: 'https://localhost:3000/callback',
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
          state: 'secure-random-state'
        })
        .expect(200);

      const { code, state } = authResponse.body;

      // Test 1: Valid PKCE verification should succeed
      await request(app)
        .post('/api/auth/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: 'https://localhost:3000/callback',
          code_verifier: codeVerifier,
          client_id: 'test-client'
        })
        .expect(200);

      // Test 2: Invalid code verifier should fail
      const invalidCodeVerifier = crypto.randomBytes(32).toString('base64url');
      await request(app)
        .post('/api/auth/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: 'https://localhost:3000/callback',
          code_verifier: invalidCodeVerifier,
          client_id: 'test-client'
        })
        .expect(400);

      // Test 3: Missing code verifier should fail
      await request(app)
        .post('/api/auth/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: 'https://localhost:3000/callback',
          client_id: 'test-client'
        })
        .expect(400);
    });

    test('should prevent code replay attacks', async () => {
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

      const authResponse = await request(app)
        .post('/api/auth/oauth/authorize')
        .send({
          response_type: 'code',
          client_id: 'test-client',
          redirect_uri: 'https://localhost:3000/callback',
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
          state: 'secure-random-state'
        });

      const { code } = authResponse.body;

      // First use should succeed
      await request(app)
        .post('/api/auth/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: 'https://localhost:3000/callback',
          code_verifier: codeVerifier,
          client_id: 'test-client'
        })
        .expect(200);

      // Second use should fail (code already consumed)
      await request(app)
        .post('/api/auth/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: 'https://localhost:3000/callback',
          code_verifier: codeVerifier,
          client_id: 'test-client'
        })
        .expect(400);
    });

    test('should validate redirect URI security', async () => {
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

      // Test malicious redirect URIs
      const maliciousRedirects = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'http://malicious.com/callback',
        'https://evil.upcoach.ai/callback', // Subdomain attack
        'ftp://upcoach.ai/callback',
        'file:///etc/passwd'
      ];

      for (const maliciousRedirect of maliciousRedirects) {
        await request(app)
          .post('/api/auth/oauth/authorize')
          .send({
            response_type: 'code',
            client_id: 'test-client',
            redirect_uri: maliciousRedirect,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            state: 'secure-random-state'
          })
          .expect(400);
      }
    });
  });

  describe('JWT Token Security Tests', () => {
    test('should enforce JWT signature validation', async () => {
      // Get valid token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      const { accessToken } = loginResponse.body;

      // Test 1: Valid token should work
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Test 2: Tampered payload should fail
      const payload = jwt.decode(accessToken) as any;
      payload.userId = maliciousUser.id; // Try to impersonate another user
      
      const tamperedToken = jwt.sign(payload, 'wrong-secret');
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      // Test 3: None algorithm attack should fail
      const noneAlgToken = jwt.sign(payload, '', { algorithm: 'none' as any });
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${noneAlgToken}`)
        .expect(401);

      // Test 4: Expired token should fail
      const expiredToken = jwt.sign(
        { ...payload, exp: Math.floor(Date.now() / 1000) - 3600 },
        process.env.JWT_SECRET!
      );
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    test('should implement device binding security', async () => {
      const deviceFingerprint = crypto.randomBytes(16).toString('hex');
      
      // Login with device binding
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          deviceFingerprint: deviceFingerprint
        })
        .set('User-Agent', 'TestClient/1.0')
        .set('X-Forwarded-For', '192.168.1.100');

      const { accessToken } = loginResponse.body;

      // Test 1: Same device should work
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('User-Agent', 'TestClient/1.0')
        .set('X-Device-Fingerprint', deviceFingerprint)
        .expect(200);

      // Test 2: Different device should fail
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('User-Agent', 'MaliciousClient/1.0')
        .set('X-Device-Fingerprint', crypto.randomBytes(16).toString('hex'))
        .expect(401);

      // Test 3: Missing device fingerprint should fail
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('User-Agent', 'TestClient/1.0')
        .expect(401);
    });

    test('should prevent JWT confusion attacks', async () => {
      // Test mixing RS256 with HS256 algorithms
      const rsaPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA2Z3QX0BTLS5CVGB1N2vNJwS2nKOr8ZhwT4qGV3xHhpspkcIK
...
-----END RSA PRIVATE KEY-----`;

      const payload = {
        userId: testUser.id,
        email: testUser.email,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      // Create RS256 token but try to verify as HS256
      const rs256Token = jwt.sign(payload, rsaPrivateKey, { algorithm: 'RS256' });
      
      // This should fail - algorithm confusion attack
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${rs256Token}`)
        .expect(401);
    });
  });

  describe('Two-Factor Authentication Security Tests', () => {
    let totpSecret: string;

    beforeEach(async () => {
      // Set up user with 2FA
      const setupResponse = await request(app)
        .post('/api/auth/2fa/setup-totp')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200);

      totpSecret = setupResponse.body.secret;
      testUser.totpSecret = totpSecret;
    });

    test('should enforce TOTP rate limiting', async () => {
      const maxAttempts = 5;
      const invalidCode = '000000';

      // Make multiple failed attempts
      for (let i = 0; i < maxAttempts; i++) {
        await request(app)
          .post('/api/auth/2fa/verify')
          .send({
            userId: testUser.id,
            token: invalidCode
          })
          .expect(400);
      }

      // Next attempt should be rate limited
      await request(app)
        .post('/api/auth/2fa/verify')
        .send({
          userId: testUser.id,
          token: invalidCode
        })
        .expect(429);

      // Even valid code should be rejected during rate limit
      const validCode = authenticator.generate(totpSecret);
      await request(app)
        .post('/api/auth/2fa/verify')
        .send({
          userId: testUser.id,
          token: validCode
        })
        .expect(429);
    });

    test('should prevent TOTP replay attacks', async () => {
      const validCode = authenticator.generate(totpSecret);

      // First use should succeed
      await request(app)
        .post('/api/auth/2fa/verify')
        .send({
          userId: testUser.id,
          token: validCode
        })
        .expect(200);

      // Immediate replay should fail
      await request(app)
        .post('/api/auth/2fa/verify')
        .send({
          userId: testUser.id,
          token: validCode
        })
        .expect(400);
    });

    test('should validate TOTP time window security', async () => {
      // Generate code for different time windows
      const currentTime = Math.floor(Date.now() / 1000);
      const timeStep = 30; // TOTP time step in seconds

      // Test codes from different time windows
      const oldCode = authenticator.generate(totpSecret, currentTime - (timeStep * 3));
      const futureCode = authenticator.generate(totpSecret, currentTime + (timeStep * 3));
      
      // Old code should fail (outside acceptable window)
      await request(app)
        .post('/api/auth/2fa/verify')
        .send({
          userId: testUser.id,
          token: oldCode
        })
        .expect(400);

      // Future code should fail
      await request(app)
        .post('/api/auth/2fa/verify')
        .send({
          userId: testUser.id,
          token: futureCode
        })
        .expect(400);
    });

    test('should secure backup codes usage', async () => {
      const setupResponse = await request(app)
        .post('/api/auth/2fa/setup-totp')
        .set('Authorization', `Bearer ${testUser.accessToken}`);

      const { backupCodes } = setupResponse.body;
      const backupCode = backupCodes[0];

      // Test 1: Valid backup code should work once
      await request(app)
        .post('/api/auth/2fa/verify')
        .send({
          userId: testUser.id,
          token: backupCode
        })
        .expect(200);

      // Test 2: Same backup code should not work again
      await request(app)
        .post('/api/auth/2fa/verify')
        .send({
          userId: testUser.id,
          token: backupCode
        })
        .expect(400);

      // Test 3: Invalid backup code format should fail
      await request(app)
        .post('/api/auth/2fa/verify')
        .send({
          userId: testUser.id,
          token: '12345678' // Wrong format
        })
        .expect(400);
    });

    test('should secure SMS 2FA delivery', async () => {
      // Test rate limiting for SMS sending
      const maxSMSPerHour = 3;

      for (let i = 0; i < maxSMSPerHour; i++) {
        await request(app)
          .post('/api/auth/2fa/send-sms')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .send({
            phoneNumber: testUser.phoneNumber
          })
          .expect(200);
      }

      // Next SMS should be rate limited
      await request(app)
        .post('/api/auth/2fa/send-sms')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          phoneNumber: testUser.phoneNumber
        })
        .expect(429);
    });

    test('should validate phone number format security', async () => {
      const maliciousPhones = [
        '+1; DROP TABLE users; --',
        '+1<script>alert(1)</script>',
        '+1" OR "1"="1',
        '1234567890123456789012345', // Too long
        'javascript:alert(1)',
        'tel:+15551234567; evil=malicious'
      ];

      for (const maliciousPhone of maliciousPhones) {
        await request(app)
          .post('/api/auth/2fa/send-sms')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .send({
            phoneNumber: maliciousPhone
          })
          .expect(400);
      }
    });
  });

  describe('WebAuthn/Passkey Security Tests', () => {
    test('should validate WebAuthn registration security', async () => {
      // Start registration
      const optionsResponse = await request(app)
        .post('/api/auth/webauthn/register/start')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200);

      const { challenge, user } = optionsResponse.body;

      // Test 1: Challenge should be cryptographically random
      expect(challenge).toBeDefined();
      expect(challenge.length).toBeGreaterThan(32);
      expect(Buffer.from(challenge, 'base64').length).toBeGreaterThanOrEqual(32);

      // Test 2: User ID should not leak sensitive information
      expect(user.id).not.toEqual(testUser.email);
      expect(user.id).not.toEqual(testUser.id);

      // Test 3: Replay attack prevention
      // Getting options again should generate different challenge
      const optionsResponse2 = await request(app)
        .post('/api/auth/webauthn/register/start')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200);

      expect(optionsResponse2.body.challenge).not.toEqual(challenge);
    });

    test('should prevent WebAuthn ceremony tampering', async () => {
      const optionsResponse = await request(app)
        .post('/api/auth/webauthn/register/start')
        .set('Authorization', `Bearer ${testUser.accessToken}`);

      const { challenge } = optionsResponse.body;

      // Simulate tampered registration response
      const tamperedResponse = {
        id: 'fake-credential-id',
        rawId: Buffer.from('fake-credential-id').toString('base64'),
        response: {
          attestationObject: 'tampered-attestation',
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'tampered-challenge', // Different from server challenge
            origin: 'https://evil.com'
          })).toString('base64')
        },
        type: 'public-key'
      };

      await request(app)
        .post('/api/auth/webauthn/register/verify')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          response: tamperedResponse,
          name: 'Test Passkey'
        })
        .expect(400);
    });

    test('should enforce WebAuthn origin validation', async () => {
      const optionsResponse = await request(app)
        .post('/api/auth/webauthn/register/start')
        .set('Authorization', `Bearer ${testUser.accessToken}`);

      const maliciousOrigins = [
        'https://evil.com',
        'http://upcoach.ai', // Wrong protocol
        'https://fake-upcoach.ai.evil.com',
        'data:text/html,<script>alert(1)</script>',
        'javascript:alert(1)'
      ];

      for (const origin of maliciousOrigins) {
        const maliciousResponse = {
          id: 'test-credential-id',
          rawId: Buffer.from('test-credential-id').toString('base64'),
          response: {
            clientDataJSON: Buffer.from(JSON.stringify({
              type: 'webauthn.create',
              challenge: optionsResponse.body.challenge,
              origin: origin
            })).toString('base64'),
            attestationObject: 'valid-attestation-object'
          },
          type: 'public-key'
        };

        await request(app)
          .post('/api/auth/webauthn/register/verify')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .send({
            response: maliciousResponse,
            name: 'Malicious Passkey'
          })
          .expect(400);
      }
    });

    test('should prevent WebAuthn credential hijacking', async () => {
      // User A registers a credential
      const userA = { ...testUser, email: 'usera@upcoach.ai' };
      const userB = { ...testUser, email: 'userb@upcoach.ai' };

      // Register credential for user A
      const credentialData = await registerWebAuthnCredential(userA);

      // Try to use user A's credential to authenticate as user B
      await request(app)
        .post('/api/auth/webauthn/authenticate/verify')
        .send({
          response: credentialData,
          userId: userB.id // Wrong user ID
        })
        .expect(401);
    });
  });

  describe('Session Management Security Tests', () => {
    test('should enforce session timeout security', async () => {
      // Login and get session
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      const { accessToken, sessionId } = loginResponse.body;

      // Test active session
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Fast-forward time to simulate timeout
      await simulateSessionTimeout(sessionId);

      // Session should be invalid now
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    test('should prevent session fixation attacks', async () => {
      // Get initial session ID
      const initialResponse = await request(app)
        .get('/api/auth/csrf-token')
        .expect(200);

      const initialSessionId = extractSessionId(initialResponse);

      // Login should create new session
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      const newSessionId = extractSessionId(loginResponse);

      // Session ID should change after login
      expect(newSessionId).not.toEqual(initialSessionId);

      // Old session should be invalid
      await request(app)
        .get('/api/auth/profile')
        .set('Cookie', `sessionId=${initialSessionId}`)
        .expect(401);
    });

    test('should enforce concurrent session limits', async () => {
      const maxSessions = 3;
      const sessions: string[] = [];

      // Create maximum number of sessions
      for (let i = 0; i < maxSessions; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
            deviceName: `Device ${i + 1}`
          });

        sessions.push(response.body.accessToken);
      }

      // All sessions should be valid
      for (const token of sessions) {
        await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      }

      // Creating one more session should invalidate the oldest
      const newResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          deviceName: 'New Device'
        });

      // Oldest session should be invalid now
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${sessions[0]}`)
        .expect(401);

      // Newest session should be valid
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${newResponse.body.accessToken}`)
        .expect(200);
    });

    test('should secure session storage', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      // Check session cookie security attributes
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();

      const sessionCookie = setCookieHeader.find((cookie: string) => 
        cookie.includes('sessionId')
      );

      expect(sessionCookie).toContain('HttpOnly'); // Prevent XSS
      expect(sessionCookie).toContain('Secure'); // HTTPS only
      expect(sessionCookie).toContain('SameSite=Strict'); // CSRF protection
    });
  });

  describe('Device Trust Security Tests', () => {
    test('should validate device fingerprinting security', async () => {
      const deviceFingerprint = generateSecureDeviceFingerprint();

      // Add trusted device
      await request(app)
        .post('/api/auth/2fa/verify')
        .send({
          userId: testUser.id,
          token: authenticator.generate(testUser.totpSecret!),
          trustDevice: true,
          deviceName: 'Test Device',
          deviceFingerprint
        })
        .expect(200);

      // Test device fingerprint collision resistance
      const similarFingerprint = deviceFingerprint.slice(0, -1) + '0';
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          deviceFingerprint: similarFingerprint
        })
        .expect(200); // Should require 2FA (not trusted)

      // Should still prompt for 2FA verification
      const response = await request(app)
        .get('/api/auth/2fa/status')
        .set('Authorization', `Bearer ${response.body?.accessToken}`)
        .expect(200);

      expect(response.body.requiresVerification).toBe(true);
    });

    test('should prevent device impersonation', async () => {
      // Create legitimate trusted device
      const legitimateDevice = {
        name: 'iPhone 13',
        fingerprint: generateSecureDeviceFingerprint(),
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        ipAddress: '192.168.1.100'
      };

      // Add trusted device
      await addTrustedDevice(testUser.id, legitimateDevice);

      // Attacker tries to impersonate with similar but different fingerprint
      const maliciousDevice = {
        ...legitimateDevice,
        fingerprint: legitimateDevice.fingerprint.replace(/.$/, '0'), // Change last char
        ipAddress: '10.0.0.1' // Different IP
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          deviceFingerprint: maliciousDevice.fingerprint
        })
        .set('User-Agent', maliciousDevice.userAgent)
        .set('X-Forwarded-For', maliciousDevice.ipAddress);

      // Should require 2FA even with similar fingerprint
      expect(response.body.requires2FA).toBe(true);
    });

    test('should detect suspicious device patterns', async () => {
      const suspiciousPatterns = [
        {
          description: 'Rapid location changes',
          devices: [
            { ipAddress: '1.2.3.4', location: 'US' },
            { ipAddress: '101.102.103.104', location: 'CN' }, // Different country
            { ipAddress: '200.201.202.203', location: 'BR' }  // Another country
          ],
          timeGap: 60000 // 1 minute between logins
        },
        {
          description: 'Inconsistent user agent patterns',
          devices: [
            { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            { userAgent: 'curl/7.68.0' }, // Command line tool
            { userAgent: 'python-requests/2.25.1' } // Automated tool
          ]
        }
      ];

      for (const pattern of suspiciousPatterns) {
        for (let i = 0; i < pattern.devices.length; i++) {
          const device = pattern.devices[i];
          
          const response = await request(app)
            .post('/api/auth/login')
            .send({
              email: testUser.email,
              password: testUser.password
            })
            .set('User-Agent', device.userAgent || 'normal-browser')
            .set('X-Forwarded-For', device.ipAddress || '192.168.1.1');

          if (i > 0) {
            // Subsequent suspicious logins should trigger additional security
            expect(response.body.securityAlert).toBeDefined();
            expect(response.body.requires2FA).toBe(true);
          }

          // Wait for pattern detection
          if (pattern.timeGap) {
            await new Promise(resolve => setTimeout(resolve, pattern.timeGap));
          }
        }
      }
    });
  });

  // Helper functions
  async function cleanupTestData(): Promise<void> {
    // Clean up test users, sessions, and related data
    // Implementation would clean database test data
  }

  async function registerWebAuthnCredential(user: TestUser): Promise<any> {
    // Mock WebAuthn credential registration
    // Implementation would simulate full WebAuthn flow
    return {
      id: 'mock-credential-id',
      response: {
        clientDataJSON: 'mock-client-data',
        attestationObject: 'mock-attestation'
      }
    };
  }

  async function simulateSessionTimeout(sessionId: string): Promise<void> {
    // Fast-forward session timeout in Redis
    // Implementation would manipulate session TTL
  }

  function extractSessionId(response: any): string {
    const setCookie = response.headers['set-cookie'];
    const sessionCookie = setCookie?.find((cookie: string) => 
      cookie.includes('sessionId')
    );
    return sessionCookie?.split('=')[1]?.split(';')[0] || '';
  }

  function generateSecureDeviceFingerprint(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async function addTrustedDevice(userId: string, device: any): Promise<void> {
    // Add device to trusted devices list
    // Implementation would call service directly
  }
});