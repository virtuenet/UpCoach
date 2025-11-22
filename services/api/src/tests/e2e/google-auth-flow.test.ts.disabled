import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../index';
import { redis } from '../../services/redis';

// Mock Google Auth Library for E2E tests
const mockGoogleResponse = {
  sub: 'google-test-user-123',
  email: 'e2e.test@example.com',
  name: 'E2E Test User',
  given_name: 'E2E',
  family_name: 'User',
  picture: 'https://example.com/test-photo.jpg',
  email_verified: true,
};

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockImplementation((options: any) => Promise.resolve({
      getPayload: () => mockGoogleResponse,
    })),
  })),
}));

describe('Google Auth End-to-End Flow', () => {
  let testUserId: string;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Setup test environment
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await redis.del(`refresh_token:${testUserId}`);
      await redis.del(`google_session:${testUserId}:${mockGoogleResponse.sub}`);
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Google Sign-In Flow', () => {
    it('should handle full new user registration flow', async () => {
      // Step 1: Initial Google Sign-In
      const signInResponse = await request(app)
        .post('/api/auth/google/signin')
        .send({
          id_token: 'valid-test-id-token',
          access_token: 'valid-test-access-token',
          client_info: {
            platform: 'mobile',
            app_version: '1.0.0',
            device_id: 'e2e-test-device',
          },
        })
        .expect(200);

      // Verify new user creation
      expect(signInResponse.body.success).toBe(true);
      expect(signInResponse.body.data.isNewUser).toBe(true);
      expect(signInResponse.body.data.authProvider).toBe('google');
      expect(signInResponse.body.data.user.email).toBe('e2e.test@example.com');
      expect(signInResponse.body.data.tokens.accessToken).toBeDefined();
      expect(signInResponse.body.data.tokens.refreshToken).toBeDefined();

      // Store tokens for subsequent tests
      testUserId = signInResponse.body.data.user.id;
      accessToken = signInResponse.body.data.tokens.accessToken;
      refreshToken = signInResponse.body.data.tokens.refreshToken;

      // Verify session is stored in Redis
      const storedRefreshToken = await redis.get(`refresh_token:${testUserId}`);
      expect(storedRefreshToken).toBe(refreshToken);

      // Step 2: Verify access token works
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.user.id).toBe(testUserId);
      expect(profileResponse.body.data.user.email).toBe('e2e.test@example.com');

      // Step 3: Test token refresh
      const refreshResponse = await request(app)
        .post('/api/auth/google/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.tokens.accessToken).toBeDefined();
      expect(refreshResponse.body.data.tokens.refreshToken).toBeDefined();

      // Update tokens
      const newAccessToken = refreshResponse.body.data.tokens.accessToken;
      const newRefreshToken = refreshResponse.body.data.tokens.refreshToken;

      // Step 4: Verify new access token works
      const profileResponse2 = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(profileResponse2.body.success).toBe(true);

      // Step 5: Test subsequent sign-in (existing user)
      const signInResponse2 = await request(app)
        .post('/api/auth/google/signin')
        .send({
          id_token: 'valid-test-id-token-2',
          client_info: {
            platform: 'mobile',
            app_version: '1.0.0',
            device_id: 'e2e-test-device-2',
          },
        })
        .expect(200);

      expect(signInResponse2.body.data.isNewUser).toBe(false);
      expect(signInResponse2.body.data.user.id).toBe(testUserId);

      // Step 6: Test logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // Verify token is blacklisted/invalid
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(401);

      // Verify refresh token is removed from Redis
      const deletedToken = await redis.get(`refresh_token:${testUserId}`);
      expect(deletedToken).toBeNull();
    });

    it('should handle existing local user linking Google account', async () => {
      // Pre-create a local user with same email
      const localUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing.user@example.com',
          password: 'TestPassword123!',
          name: 'Existing User',
        })
        .expect(201);

      const localUserId = localUserResponse.body.data.user.id;

      // Mock Google response for same email
      const mockLinkedGoogleResponse = {
        ...mockGoogleResponse,
        email: 'existing.user@example.com',
        sub: 'google-linked-user-456',
      };

      const { OAuth2Client } = require('google-auth-library');
      OAuth2Client.mockImplementation(() => ({
        verifyIdToken: jest.fn().mockImplementation((options: any) => Promise.resolve({
          getPayload: () => mockLinkedGoogleResponse,
        })),
      }));

      // Attempt Google sign-in with existing email
      const googleSignInResponse = await request(app)
        .post('/api/auth/google/signin')
        .send({
          id_token: 'linking-test-token',
          client_info: {
            platform: 'mobile',
            app_version: '1.0.0',
            device_id: 'linking-test-device',
          },
        })
        .expect(200);

      // Should link accounts, not create new user
      expect(googleSignInResponse.body.data.isNewUser).toBe(false);
      expect(googleSignInResponse.body.data.user.id).toBe(localUserId);
      expect(googleSignInResponse.body.data.user.email).toBe('existing.user@example.com');

      // Cleanup
      await redis.del(`refresh_token:${localUserId}`);
    });
  });

  describe('Error Scenarios', () => {
    it('should reject expired Google tokens', async () => {
      const { OAuth2Client } = require('google-auth-library');
      OAuth2Client.mockImplementation(() => ({
        verifyIdToken: jest.fn().mockImplementation((options: any) => Promise.reject(new Error('Token used too late'))),
      }));

      const response = await request(app)
        .post('/api/auth/google/signin')
        .send({
          id_token: 'expired-token',
          client_info: { platform: 'mobile' },
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Google Sign-In failed');
    });

    it('should reject unverified Google email', async () => {
      const { OAuth2Client } = require('google-auth-library');
      OAuth2Client.mockImplementation(() => ({
        verifyIdToken: jest.fn().mockImplementation((options: any) => Promise.resolve({
          getPayload: () => ({ ...mockGoogleResponse, email_verified: false }),
        })),
      }));

      const response = await request(app)
        .post('/api/auth/google/signin')
        .send({
          id_token: 'unverified-email-token',
          client_info: { platform: 'mobile' },
        })
        .expect(401);

      expect(response.body.message).toBe('Google account email must be verified');
    });

    it('should handle rate limiting', async () => {
      // Simulate rapid requests to trigger rate limiting
      const requests = Array.from({ length: 20 }, () =>
        request(app)
          .post('/api/auth/google/signin')
          .send({
            id_token: 'rate-limit-test-token',
            client_info: { platform: 'mobile' },
          })
      );

      const responses = await Promise.allSettled(requests);
      
      // At least some requests should be rate limited
      const rateLimitedResponses = responses.filter(
        (result) => result.status === 'fulfilled' && 
                   (result.value as any).status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should reject malformed requests', async () => {
      const malformedRequests = [
        {}, // Empty body
        { id_token: '' }, // Empty token
        { id_token: 'valid', client_info: 'invalid' }, // Invalid client_info type
      ];

      for (const requestBody of malformedRequests) {
        const response = await request(app)
          .post('/api/auth/google/signin')
          .send(requestBody);

        expect([400, 401]).toContain(response.status);
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Security Validations', () => {
    it('should set proper security headers', async () => {
      const response = await request(app)
        .post('/api/auth/google/signin')
        .send({
          id_token: 'security-test-token',
          client_info: { platform: 'mobile' },
        });

      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should log security events properly', async () => {
      const consoleSpy = jest.spyOn(console, 'info');
      
      await request(app)
        .post('/api/auth/google/signin')
        .send({
          id_token: 'logging-test-token',
          client_info: { platform: 'mobile' },
        });

      // Verify security logging occurred
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Google Sign-In'),
        expect.objectContaining({
          email: expect.any(String),
          googleSub: expect.any(String),
          ip: expect.any(String),
        })
      );

      consoleSpy.mockRestore();
    });

    it('should prevent session fixation attacks', async () => {
      // Sign in first time
      const firstResponse = await request(app)
        .post('/api/auth/google/signin')
        .send({
          id_token: 'session-fixation-test-1',
          client_info: { platform: 'mobile' },
        })
        .expect(200);

      const firstRefreshToken = firstResponse.body.data.tokens.refreshToken;

      // Sign in second time with same user
      const secondResponse = await request(app)
        .post('/api/auth/google/signin')
        .send({
          id_token: 'session-fixation-test-2',
          client_info: { platform: 'mobile' },
        })
        .expect(200);

      const secondRefreshToken = secondResponse.body.data.tokens.refreshToken;

      // Tokens should be different (new session created)
      expect(firstRefreshToken).not.toBe(secondRefreshToken);

      // First token should be invalidated
      await request(app)
        .post('/api/auth/google/refresh')
        .send({ refresh_token: firstRefreshToken })
        .expect(401);

      // Second token should work
      await request(app)
        .post('/api/auth/google/refresh')
        .send({ refresh_token: secondRefreshToken })
        .expect(200);

      // Cleanup
      const userId = secondResponse.body.data.user.id;
      await redis.del(`refresh_token:${userId}`);
    });
  });
});