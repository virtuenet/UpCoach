import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Express } from 'express';
import crypto from 'crypto';

import app from '../../index';
import { User } from '../../models';
import { EnhancedAuthService } from '../../services/EnhancedAuthService';
import { TwoFactorAuthService } from '../../services/TwoFactorAuthService';
import { WebAuthnService } from '../../services/WebAuthnService';
import { sequelize } from '../../config/database';

describe('Authentication Token Security Tests', () => {
  let testApp: Express;
  let authService: EnhancedAuthService;
  let twoFactorService: TwoFactorAuthService;
  let webAuthnService: WebAuthnService;

  beforeAll(async () => {
    testApp = app;
    authService = new EnhancedAuthService();
    twoFactorService = TwoFactorAuthService.getInstance();
    webAuthnService = WebAuthnService.getInstance();

    // Create test users
    await User.create({
      id: 'auth-test-user-1',
      email: 'authtest1@upcoach.ai',
      name: 'Auth Test1',
      password: 'SecurePassword123!',
      role: 'user'
    });

    await User.create({
      id: 'auth-test-user-2',
      email: 'authtest2@upcoach.ai',
      name: 'Auth Test2',
      password: 'SecurePassword123!',
      role: 'admin'
    });
  });

  afterAll(async () => {
    await User.destroy({ where: { id: ['auth-test-user-1', 'auth-test-user-2'] }, force: true });
  });

  describe('Enhanced Device Fingerprinting', () => {
    test('should generate unique and consistent device fingerprints', async () => {
      const deviceInfo1 = {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        screenResolution: '390x844',
        timezone: 'America/New_York',
        language: 'en-US',
        platform: 'iOS',
        vendor: 'Apple',
        cookiesEnabled: true,
        javaEnabled: false,
        touchSupport: true
      };

      const deviceInfo2 = {
        userAgent: 'Mozilla/5.0 (Android 11; Mobile; LG-H870)',
        screenResolution: '360x640',
        timezone: 'America/Los_Angeles',
        language: 'en-US',
        platform: 'Android',
        vendor: 'Google',
        cookiesEnabled: true,
        javaEnabled: false,
        touchSupport: true
      };

      // Generate fingerprints
      const fingerprint1 = await authService.generateDeviceFingerprint(deviceInfo1);
      const fingerprint2 = await authService.generateDeviceFingerprint(deviceInfo2);
      const fingerprint1Duplicate = await authService.generateDeviceFingerprint(deviceInfo1);

      // Different devices should have different fingerprints
      expect(fingerprint1).not.toBe(fingerprint2);
      
      // Same device should have consistent fingerprint
      expect(fingerprint1).toBe(fingerprint1Duplicate);
      
      // Fingerprints should be valid format
      expect(fingerprint1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex format
      expect(fingerprint2).toMatch(/^[a-f0-9]{64}$/);
      
      // Should detect fingerprint entropy
      expect(authService.validateFingerprintEntropy(fingerprint1)).toBe(true);
      expect(authService.validateFingerprintEntropy(fingerprint2)).toBe(true);
    });

    test('should detect inconsistent device fingerprint data', async () => {
      // Inconsistent data: Android user agent with iOS platform
      const inconsistentDevice = {
        userAgent: 'Mozilla/5.0 (Android 11; Mobile)',
        screenResolution: '390x844', // iPhone resolution
        timezone: 'America/New_York',
        language: 'en-US',
        platform: 'iOS', // Inconsistent with Android UA
        vendor: 'Apple',
        touchSupport: true
      };

      const spoofedDevice = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        screenResolution: '1920x1080',
        timezone: 'Europe/London',
        language: 'en-GB',
        platform: 'Win32',
        vendor: 'Google Inc.', // Wrong vendor for Windows
        touchSupport: false
      };

      // Should detect inconsistencies
      expect(() => authService.validateDeviceConsistency(inconsistentDevice))
        .toThrow('Inconsistent device fingerprint data');
      
      expect(() => authService.validateDeviceConsistency(spoofedDevice))
        .toThrow('Potential device spoofing detected');
    });

    test('should handle device fingerprint variations gracefully', async () => {
      const baseDevice = {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        screenResolution: '390x844',
        timezone: 'America/New_York',
        language: 'en-US',
        platform: 'iOS',
        vendor: 'Apple'
      };

      // Minor variations that should be acceptable
      const slightlyDifferentDevice = {
        ...baseDevice,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X)', // iOS version change
        timezone: 'America/New_York'  // Same timezone
      };

      const baseFingerprint = await authService.generateDeviceFingerprint(baseDevice);
      const variantFingerprint = await authService.generateDeviceFingerprint(slightlyDifferentDevice);

      // Should generate different but valid fingerprints
      expect(baseFingerprint).not.toBe(variantFingerprint);
      expect(authService.validateFingerprintSimilarity(baseFingerprint, variantFingerprint)).toBe(true);
    });

    test('should implement fingerprint aging and refresh', async () => {
      const deviceInfo = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        screenResolution: '1440x900',
        timezone: 'America/New_York',
        language: 'en-US',
        platform: 'MacIntel',
        vendor: 'Apple Computer, Inc.'
      };

      const initialFingerprint = await authService.generateDeviceFingerprint(deviceInfo);
      
      // Simulate time passage for fingerprint aging
      const agedFingerprint = await authService.generateDeviceFingerprint(
        deviceInfo,
        { ageInDays: 30 }
      );

      // Aged fingerprints should incorporate time component
      expect(initialFingerprint).not.toBe(agedFingerprint);
      
      // Should still be recognizable as related
      expect(authService.isFingerprintFamily(initialFingerprint, agedFingerprint)).toBe(true);
    });
  });

  describe('Token Binding and Validation', () => {
    test('should bind tokens to device fingerprints', async () => {
      const deviceFingerprint = 'test_device_fingerprint_12345abcdef';
      
      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'authtest1@upcoach.ai',
          password: 'SecurePassword123!',
          deviceFingerprint,
          deviceInfo: {
            platform: 'web',
            userAgent: 'Mozilla/5.0 Test Browser',
            ip: '192.168.1.100'
          }
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('accessToken');
      expect(loginResponse.body).toHaveProperty('refreshToken');

      const accessToken = loginResponse.body.accessToken;
      const tokenPayload = jwt.decode(accessToken) as any;

      // Token should include device fingerprint
      expect(tokenPayload).toHaveProperty('deviceFingerprint');
      expect(tokenPayload.deviceFingerprint).toBe(deviceFingerprint);

      // Verify token with correct fingerprint
      const verificationResult = await authService.verifyTokenWithFingerprint(
        accessToken,
        deviceFingerprint
      );
      expect(verificationResult.valid).toBe(true);
      expect(verificationResult.userId).toBe('auth-test-user-1');
    });

    test('should reject tokens with mismatched device fingerprints', async () => {
      const correctFingerprint = 'correct_device_fingerprint_abc123';
      const wrongFingerprint = 'wrong_device_fingerprint_xyz789';
      
      // Login with correct fingerprint
      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'authtest1@upcoach.ai',
          password: 'SecurePassword123!',
          deviceFingerprint: correctFingerprint
        });

      const accessToken = loginResponse.body.accessToken;

      // Try to verify with wrong fingerprint
      const verificationResult = await authService.verifyTokenWithFingerprint(
        accessToken,
        wrongFingerprint
      );

      expect(verificationResult.valid).toBe(false);
      expect(verificationResult.reason).toBe('DEVICE_FINGERPRINT_MISMATCH');
      
      // API call with wrong fingerprint should fail
      const apiResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Device-Fingerprint', wrongFingerprint);

      expect(apiResponse.status).toBe(401);
      expect(apiResponse.body.error).toContain('device fingerprint');
    });

    test('should implement secure token rotation', async () => {
      const deviceFingerprint = 'rotation_test_fingerprint_123';
      
      // Initial login
      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'authtest1@upcoach.ai',
          password: 'SecurePassword123!',
          deviceFingerprint
        });

      const initialTokens = {
        accessToken: loginResponse.body.accessToken,
        refreshToken: loginResponse.body.refreshToken
      };

      // Wait briefly to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh tokens
      const refreshResponse = await request(testApp)
        .post('/api/auth/refresh')
        .send({
          refreshToken: initialTokens.refreshToken,
          deviceFingerprint
        });

      expect(refreshResponse.status).toBe(200);
      const newTokens = {
        accessToken: refreshResponse.body.accessToken,
        refreshToken: refreshResponse.body.refreshToken
      };

      // New tokens should be different
      expect(newTokens.accessToken).not.toBe(initialTokens.accessToken);
      expect(newTokens.refreshToken).not.toBe(initialTokens.refreshToken);

      // Old access token should be invalidated
      const oldTokenResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${initialTokens.accessToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint);

      expect(oldTokenResponse.status).toBe(401);

      // New token should work
      const newTokenResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${newTokens.accessToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint);

      expect(newTokenResponse.status).toBe(200);
    });

    test('should detect and prevent token replay attacks', async () => {
      const deviceFingerprint = 'replay_test_fingerprint_456';
      
      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'authtest1@upcoach.ai',
          password: 'SecurePassword123!',
          deviceFingerprint
        });

      const accessToken = loginResponse.body.accessToken;

      // Make successful API call
      const firstCall = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint)
        .set('X-Request-ID', 'unique-request-123');

      expect(firstCall.status).toBe(200);

      // Try to replay the exact same request (same nonce/timestamp)
      const replayCall = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint)
        .set('X-Request-ID', 'unique-request-123'); // Same request ID

      // Should be rejected as replay attack
      expect(replayCall.status).toBe(401);
      expect(replayCall.body.error).toContain('replay');
    });

    test('should validate token expiration and automatic refresh', async () => {
      const deviceFingerprint = 'expiration_test_fingerprint_789';
      
      // Create short-lived token for testing
      const shortLivedToken = jwt.sign(
        {
          userId: 'auth-test-user-1',
          deviceFingerprint,
          type: 'access'
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '2s' } // Very short expiration
      );

      // Token should work initially
      const immediateResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${shortLivedToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint);

      expect(immediateResponse.status).toBe(200);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Expired token should be rejected
      const expiredResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${shortLivedToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint);

      expect(expiredResponse.status).toBe(401);
      expect(expiredResponse.body.error.toLowerCase()).toContain('expired');
    });
  });

  describe('Session Hijacking Prevention', () => {
    test('should detect concurrent sessions from different devices', async () => {
      const device1Fingerprint = 'device_1_fingerprint_abc';
      const device2Fingerprint = 'device_2_fingerprint_xyz';

      // Login from device 1
      const login1Response = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'authtest1@upcoach.ai',
          password: 'SecurePassword123!',
          deviceFingerprint: device1Fingerprint,
          deviceInfo: { ip: '192.168.1.100', userAgent: 'Device 1' }
        });

      expect(login1Response.status).toBe(200);

      // Concurrent login from device 2
      const login2Response = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'authtest1@upcoach.ai',
          password: 'SecurePassword123!',
          deviceFingerprint: device2Fingerprint,
          deviceInfo: { ip: '10.0.0.50', userAgent: 'Device 2' }
        });

      expect(login2Response.status).toBe(200);

      // Check security events for concurrent session detection
      const securityEventsResponse = await request(testApp)
        .get('/api/auth/security-events')
        .set('Authorization', `Bearer ${login2Response.body.accessToken}`)
        .set('X-Device-Fingerprint', device2Fingerprint);

      expect(securityEventsResponse.status).toBe(200);
      
      const events = securityEventsResponse.body.events || [];
      const concurrentSessionEvent = events.find(
        (event: any) => event.type === 'CONCURRENT_SESSIONS_DETECTED'
      );

      expect(concurrentSessionEvent).toBeDefined();
      expect(concurrentSessionEvent.deviceFingerprints).toContain(device1Fingerprint);
      expect(concurrentSessionEvent.deviceFingerprints).toContain(device2Fingerprint);
      expect(concurrentSessionEvent.ipAddresses).toContain('192.168.1.100');
      expect(concurrentSessionEvent.ipAddresses).toContain('10.0.0.50');
    });

    test('should implement session binding to IP and User-Agent', async () => {
      const deviceFingerprint = 'ip_binding_test_fingerprint';
      const originalIP = '192.168.1.200';
      const originalUserAgent = 'Mozilla/5.0 (Original Browser)';

      // Login with specific IP and User-Agent
      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'authtest1@upcoach.ai',
          password: 'SecurePassword123!',
          deviceFingerprint
        })
        .set('User-Agent', originalUserAgent)
        .set('X-Forwarded-For', originalIP);

      const accessToken = loginResponse.body.accessToken;

      // Use token with same IP and User-Agent (should work)
      const validResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint)
        .set('User-Agent', originalUserAgent)
        .set('X-Forwarded-For', originalIP);

      expect(validResponse.status).toBe(200);

      // Try with different IP (should trigger security check)
      const differentIPResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint)
        .set('User-Agent', originalUserAgent)
        .set('X-Forwarded-For', '10.0.0.100'); // Different IP

      expect([401, 403]).toContain(differentIPResponse.status);

      // Try with different User-Agent (should trigger security check)
      const differentUAResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint)
        .set('User-Agent', 'Mozilla/5.0 (Different Browser)')
        .set('X-Forwarded-For', originalIP);

      expect([401, 403]).toContain(differentUAResponse.status);
    });

    test('should detect and prevent session fixation attacks', async () => {
      // Attacker tries to pre-set a session token
      const maliciousToken = jwt.sign(
        {
          userId: 'auth-test-user-1',
          deviceFingerprint: 'attacker_controlled_fingerprint',
          type: 'access',
          sessionId: 'attacker_controlled_session'
        },
        'wrong_secret', // Wrong secret
        { expiresIn: '1h' }
      );

      // Try to use malicious token
      const maliciousResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${maliciousToken}`)
        .set('X-Device-Fingerprint', 'attacker_controlled_fingerprint');

      expect(maliciousResponse.status).toBe(401);

      // Legitimate login should create new session
      const legitimateLogin = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'authtest1@upcoach.ai',
          password: 'SecurePassword123!',
          deviceFingerprint: 'legitimate_device'
        });

      expect(legitimateLogin.status).toBe(200);
      
      const legitimateToken = legitimateLogin.body.accessToken;
      const tokenPayload = jwt.decode(legitimateToken) as any;
      
      // Session ID should be randomly generated, not predictable
      expect(tokenPayload.sessionId).toBeDefined();
      expect(tokenPayload.sessionId).not.toBe('attacker_controlled_session');
      expect(tokenPayload.sessionId.length).toBeGreaterThan(20);
    });

    test('should implement session timeout and inactivity detection', async () => {
      const deviceFingerprint = 'inactivity_test_fingerprint';
      
      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'authtest1@upcoach.ai',
          password: 'SecurePassword123!',
          deviceFingerprint,
          sessionTimeout: 5 // 5 seconds for testing
        });

      const accessToken = loginResponse.body.accessToken;

      // Immediate activity should work
      const immediateResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint);

      expect(immediateResponse.status).toBe(200);

      // Wait for session timeout
      await new Promise(resolve => setTimeout(resolve, 6000));

      // After timeout, session should be invalid
      const timeoutResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint);

      expect(timeoutResponse.status).toBe(401);
      expect(timeoutResponse.body.error.toLowerCase()).toContain('session');
    });
  });

  describe('Two-Factor Authentication Integration', () => {
    test('should require 2FA for sensitive operations', async () => {
      // 2FA status is managed separately in the auth service

      const deviceFingerprint = 'two_factor_test_fingerprint';
      
      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'authtest1@upcoach.ai',
          password: 'SecurePassword123!',
          deviceFingerprint
        });

      // Should require 2FA verification
      expect(loginResponse.status).toBe(202);
      expect(loginResponse.body).toHaveProperty('requiresTwoFactor');
      expect(loginResponse.body).toHaveProperty('temporaryToken');

      const temporaryToken = loginResponse.body.temporaryToken;

      // Try to access sensitive endpoint with temporary token
      const sensitiveResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${temporaryToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint);

      expect(sensitiveResponse.status).toBe(403);
      expect(sensitiveResponse.body.error).toContain('two-factor');

      // Complete 2FA verification
      const twoFactorResponse = await request(testApp)
        .post('/api/auth/verify-2fa')
        .send({
          temporaryToken,
          code: '123456', // Mock TOTP code
          deviceFingerprint
        });

      expect(twoFactorResponse.status).toBe(200);
      expect(twoFactorResponse.body).toHaveProperty('accessToken');

      // Now sensitive operations should work
      const verifiedResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${twoFactorResponse.body.accessToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint);

      expect(verifiedResponse.status).toBe(200);
    });

    test('should implement trusted device management', async () => {
      const trustedFingerprint = 'trusted_device_fingerprint';
      const untrustedFingerprint = 'untrusted_device_fingerprint';

      // Login from trusted device
      const trustedLoginResponse = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'authtest1@upcoach.ai',
          password: 'SecurePassword123!',
          deviceFingerprint: trustedFingerprint,
          trustDevice: true
        });

      expect(trustedLoginResponse.status).toBe(200);

      // Mark device as trusted
      await request(testApp)
        .post('/api/auth/trust-device')
        .send({ deviceFingerprint: trustedFingerprint })
        .set('Authorization', `Bearer ${trustedLoginResponse.body.accessToken}`)
        .set('X-Device-Fingerprint', trustedFingerprint);

      // Login from trusted device should skip some security checks
      const subsequentTrustedLogin = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'authtest1@upcoach.ai',
          password: 'SecurePassword123!',
          deviceFingerprint: trustedFingerprint
        });

      expect(subsequentTrustedLogin.body.deviceTrusted).toBe(true);

      // Login from untrusted device should require additional verification
      const untrustedLoginResponse = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'authtest1@upcoach.ai',
          password: 'SecurePassword123!',
          deviceFingerprint: untrustedFingerprint
        });

      expect(untrustedLoginResponse.body.deviceTrusted).toBe(false);
      expect(untrustedLoginResponse.body.requiresDeviceVerification).toBe(true);
    });
  });

  describe('WebAuthn and Passwordless Authentication', () => {
    test('should support WebAuthn registration', async () => {
      const deviceFingerprint = 'webauthn_registration_test';
      
      // Start WebAuthn registration
      const registrationOptionsResponse = await request(testApp)
        .post('/api/auth/webauthn/registration/begin')
        .send({
          email: 'authtest1@upcoach.ai',
          deviceFingerprint
        });

      expect(registrationOptionsResponse.status).toBe(200);
      expect(registrationOptionsResponse.body).toHaveProperty('challenge');
      expect(registrationOptionsResponse.body).toHaveProperty('rp');
      expect(registrationOptionsResponse.body.rp.id).toBe('upcoach.ai');

      // Mock WebAuthn credential creation
      const mockCredential = {
        id: 'mock-credential-id',
        rawId: Buffer.from('mock-credential-id').toString('base64'),
        type: 'public-key',
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.create',
            challenge: registrationOptionsResponse.body.challenge,
            origin: 'https://upcoach.ai'
          })).toString('base64'),
          attestationObject: 'mock-attestation-object'
        }
      };

      // Complete WebAuthn registration
      const registrationResponse = await request(testApp)
        .post('/api/auth/webauthn/registration/finish')
        .send({
          credential: mockCredential,
          deviceFingerprint
        });

      expect(registrationResponse.status).toBe(200);
      expect(registrationResponse.body.verified).toBe(true);
    });

    test('should support WebAuthn authentication', async () => {
      const deviceFingerprint = 'webauthn_auth_test';
      
      // Start WebAuthn authentication
      const authOptionsResponse = await request(testApp)
        .post('/api/auth/webauthn/authentication/begin')
        .send({
          email: 'authtest1@upcoach.ai',
          deviceFingerprint
        });

      expect(authOptionsResponse.status).toBe(200);
      expect(authOptionsResponse.body).toHaveProperty('challenge');
      expect(authOptionsResponse.body).toHaveProperty('allowCredentials');

      // Mock WebAuthn authentication
      const mockAuthCredential = {
        id: 'mock-credential-id',
        rawId: Buffer.from('mock-credential-id').toString('base64'),
        type: 'public-key',
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.get',
            challenge: authOptionsResponse.body.challenge,
            origin: 'https://upcoach.ai'
          })).toString('base64'),
          authenticatorData: 'mock-authenticator-data',
          signature: 'mock-signature'
        }
      };

      // Complete WebAuthn authentication
      const authResponse = await request(testApp)
        .post('/api/auth/webauthn/authentication/finish')
        .send({
          credential: mockAuthCredential,
          deviceFingerprint
        });

      expect(authResponse.status).toBe(200);
      expect(authResponse.body).toHaveProperty('accessToken');
      expect(authResponse.body).toHaveProperty('refreshToken');
      
      const tokenPayload = jwt.decode(authResponse.body.accessToken) as any;
      expect(tokenPayload.authMethod).toBe('webauthn');
      expect(tokenPayload.deviceFingerprint).toBe(deviceFingerprint);
    });

    test('should prevent WebAuthn credential reuse attacks', async () => {
      const deviceFingerprint = 'webauthn_reuse_test';
      
      const authOptionsResponse = await request(testApp)
        .post('/api/auth/webauthn/authentication/begin')
        .send({
          email: 'authtest1@upcoach.ai',
          deviceFingerprint
        });

      const mockCredential = {
        id: 'reuse-test-credential',
        rawId: Buffer.from('reuse-test-credential').toString('base64'),
        type: 'public-key',
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.get',
            challenge: authOptionsResponse.body.challenge,
            origin: 'https://upcoach.ai'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'mock-signature'
        }
      };

      // First authentication attempt
      const firstAuthResponse = await request(testApp)
        .post('/api/auth/webauthn/authentication/finish')
        .send({
          credential: mockCredential,
          deviceFingerprint
        });

      expect(firstAuthResponse.status).toBe(200);

      // Replay same credential (should fail)
      const replayResponse = await request(testApp)
        .post('/api/auth/webauthn/authentication/finish')
        .send({
          credential: mockCredential,
          deviceFingerprint
        });

      expect(replayResponse.status).toBe(400);
      expect(replayResponse.body.error).toContain('credential already used');
    });
  });

  describe('Token Security Validation', () => {
    test('should validate JWT signature integrity', async () => {
      const validToken = jwt.sign(
        { userId: 'auth-test-user-1', deviceFingerprint: 'test' },
        process.env.JWT_SECRET as string
      );

      const tamperedToken = validToken.slice(0, -10) + 'tampered123';
      const wrongSecretToken = jwt.sign(
        { userId: 'auth-test-user-1', deviceFingerprint: 'test' },
        'wrong-secret'
      );

      // Valid token should work
      const validResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .set('X-Device-Fingerprint', 'test');

      expect(validResponse.status).toBe(200);

      // Tampered token should fail
      const tamperedResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .set('X-Device-Fingerprint', 'test');

      expect(tamperedResponse.status).toBe(401);

      // Wrong secret token should fail
      const wrongSecretResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .set('X-Device-Fingerprint', 'test');

      expect(wrongSecretResponse.status).toBe(401);
    });

    test('should implement proper token revocation', async () => {
      const deviceFingerprint = 'revocation_test_device';
      
      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'authtest1@upcoach.ai',
          password: 'SecurePassword123!',
          deviceFingerprint
        });

      const accessToken = loginResponse.body.accessToken;

      // Token should work initially
      const initialResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint);

      expect(initialResponse.status).toBe(200);

      // Revoke token
      const revokeResponse = await request(testApp)
        .post('/api/auth/revoke')
        .send({ token: accessToken })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint);

      expect(revokeResponse.status).toBe(200);

      // Revoked token should no longer work
      const revokedResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Device-Fingerprint', deviceFingerprint);

      expect(revokedResponse.status).toBe(401);
      expect(revokedResponse.body.error).toContain('revoked');
    });

    test('should implement token blacklisting for security incidents', async () => {
      const suspiciousFingerprint = 'suspicious_device_fingerprint';
      
      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'authtest1@upcoach.ai',
          password: 'SecurePassword123!',
          deviceFingerprint: suspiciousFingerprint
        });

      const accessToken = loginResponse.body.accessToken;

      // Simulate security incident detection
      await request(testApp)
        .post('/api/auth/security-incident')
        .send({
          type: 'SUSPICIOUS_ACTIVITY',
          deviceFingerprint: suspiciousFingerprint,
          reason: 'Multiple failed attempts from different locations'
        })
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .set('X-Device-Fingerprint', suspiciousFingerprint);

      // Token should be blacklisted
      const blacklistedResponse = await request(testApp)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Device-Fingerprint', suspiciousFingerprint);

      expect(blacklistedResponse.status).toBe(401);
      expect(blacklistedResponse.body.error).toContain('security incident');
    });
  });
});