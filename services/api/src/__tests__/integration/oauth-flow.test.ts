import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import app from '../../index';
import { sequelize } from '../../config/database';
import { User } from '../../models/User';
import { redis } from '../../services/redis';
import { GoogleAuthService } from '../../services/auth/GoogleAuthService';

// Mock Google APIs
jest.mock('googleapis');
jest.mock('google-auth-library');

const mockGoogle = google as jest.Mocked<typeof google>;
const mockOAuth2Client = OAuth2Client as jest.MockedClass<typeof OAuth2Client>;

describe('OAuth Flow Integration Tests', () => {
  let mockGoogleAuth: jest.Mocked<OAuth2Client>;
  let testUser: any;
  const testEmail = 'test@upcoach.ai';
  const testGoogleId = 'google-123456789';
  const mockAccessToken = 'mock-access-token';
  const mockRefreshToken = 'mock-refresh-token';
  const mockIdToken = 'mock-id-token';

  beforeAll(async () => {
    // Wait for database connection
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Clear test data
    await User.destroy({ where: { email: testEmail } });
    
    // Setup Google Auth mocks
    mockGoogleAuth = {
      setCredentials: jest.fn(),
      getAccessToken: jest.fn(),
      verifyIdToken: jest.fn(),
      getTokenInfo: jest.fn(),
      refreshAccessToken: jest.fn(),
      generateAuthUrl: jest.fn(),
      getToken: jest.fn(),
    } as any;

    mockOAuth2Client.mockImplementation(() => mockGoogleAuth);
    
    // Mock Google OAuth endpoints
    mockGoogle.auth = {
      OAuth2: mockOAuth2Client,
    } as any;
  });

  afterEach(async () => {
    await User.destroy({ where: { email: testEmail } });
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
    await redis.quit();
  });

  describe('Google OAuth Initiation', () => {
    it('should generate authorization URL for Google OAuth', async () => {
      const expectedAuthUrl = 'https://accounts.google.com/oauth/authorize?client_id=test&redirect_uri=test&scope=email+profile';
      
      mockGoogleAuth.generateAuthUrl.mockReturnValue(expectedAuthUrl);

      const response = await request(app)
        .get('/api/auth/google')
        .expect(302);

      expect(response.headers.location).toBe(expectedAuthUrl);
      expect(mockGoogleAuth.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: ['email', 'profile'],
        prompt: 'consent'
      });
    });

    it('should include state parameter for CSRF protection', async () => {
      const expectedAuthUrl = 'https://accounts.google.com/oauth/authorize?state=mock-state&client_id=test';
      
      mockGoogleAuth.generateAuthUrl.mockReturnValue(expectedAuthUrl);

      const response = await request(app)
        .get('/api/auth/google')
        .query({ state: 'mock-state' })
        .expect(302);

      expect(mockGoogleAuth.generateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'mock-state'
        })
      );
    });

    it('should handle mobile app redirect scheme', async () => {
      const mobileRedirectUri = 'upcoach://auth/callback';
      const expectedAuthUrl = `https://accounts.google.com/oauth/authorize?redirect_uri=${encodeURIComponent(mobileRedirectUri)}`;
      
      mockGoogleAuth.generateAuthUrl.mockReturnValue(expectedAuthUrl);

      const response = await request(app)
        .get('/api/auth/google')
        .query({ platform: 'mobile' })
        .expect(302);

      expect(mockGoogleAuth.generateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          redirect_uri: mobileRedirectUri
        })
      );
    });
  });

  describe('Google OAuth Callback', () => {
    const mockGoogleUserInfo = {
      sub: testGoogleId,
      email: testEmail,
      name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      picture: 'https://example.com/avatar.jpg',
      email_verified: true
    };

    it('should handle successful OAuth callback and create new user', async () => {
      // Mock token exchange
      mockGoogleAuth.getToken.mockResolvedValue({
        tokens: {
          access_token: mockAccessToken,
          refresh_token: mockRefreshToken,
          id_token: mockIdToken
        }
      });

      // Mock ID token verification
      mockGoogleAuth.verifyIdToken.mockResolvedValue({
        getPayload: () => mockGoogleUserInfo
      } as any);

      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ 
          code: 'auth-code-123',
          state: 'csrf-state-token'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testEmail);
      expect(response.body.data.user.googleId).toBe(testGoogleId);

      // Verify user was created in database
      const createdUser = await User.findOne({ where: { email: testEmail } });
      expect(createdUser).toBeTruthy();
      expect(createdUser!.googleId).toBe(testGoogleId);
      expect(createdUser!.emailVerified).toBe(true);
    });

    it('should handle OAuth callback for existing user', async () => {
      // Create existing user
      const existingUser = await User.create({
        email: testEmail,
        name: 'Existing User',
        googleId: testGoogleId,
        emailVerified: true,
        isActive: true
      });

      // Mock token exchange
      mockGoogleAuth.getToken.mockResolvedValue({
        tokens: {
          access_token: mockAccessToken,
          refresh_token: mockRefreshToken,
          id_token: mockIdToken
        }
      });

      // Mock ID token verification
      mockGoogleAuth.verifyIdToken.mockResolvedValue({
        getPayload: () => mockGoogleUserInfo
      } as any);

      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ 
          code: 'auth-code-123',
          state: 'csrf-state-token'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user.id).toBe(existingUser.id);
      expect(response.body.data.user.email).toBe(testEmail);

      // Verify tokens were updated
      const updatedUser = await User.findByPk(existingUser.id);
      expect(updatedUser!.googleAccessToken).toBe(mockAccessToken);
      expect(updatedUser!.googleRefreshToken).toBe(mockRefreshToken);
    });

    it('should reject callback without authorization code', async () => {
      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ state: 'csrf-state-token' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject callback with invalid state parameter', async () => {
      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ 
          code: 'auth-code-123',
          state: 'invalid-state'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Invalid state parameter');
    });

    it('should handle token exchange failure', async () => {
      mockGoogleAuth.getToken.mockRejectedValue(new Error('Token exchange failed'));

      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ 
          code: 'invalid-auth-code',
          state: 'csrf-state-token'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('OAuth callback failed');
    });

    it('should handle invalid ID token', async () => {
      mockGoogleAuth.getToken.mockResolvedValue({
        tokens: {
          access_token: mockAccessToken,
          id_token: 'invalid-id-token'
        }
      });

      mockGoogleAuth.verifyIdToken.mockRejectedValue(new Error('Invalid ID token'));

      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ 
          code: 'auth-code-123',
          state: 'csrf-state-token'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Invalid Google ID token');
    });

    it('should handle unverified email', async () => {
      const unverifiedUserInfo = {
        ...mockGoogleUserInfo,
        email_verified: false
      };

      mockGoogleAuth.getToken.mockResolvedValue({
        tokens: {
          access_token: mockAccessToken,
          id_token: mockIdToken
        }
      });

      mockGoogleAuth.verifyIdToken.mockResolvedValue({
        getPayload: () => unverifiedUserInfo
      } as any);

      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ 
          code: 'auth-code-123',
          state: 'csrf-state-token'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Email not verified');
    });

    it('should link Google account to existing email user', async () => {
      // Create user with same email but no Google ID
      await User.create({
        email: testEmail,
        name: 'Existing User',
        password: 'hashed-password',
        emailVerified: true,
        isActive: true
      });

      mockGoogleAuth.getToken.mockResolvedValue({
        tokens: {
          access_token: mockAccessToken,
          refresh_token: mockRefreshToken,
          id_token: mockIdToken
        }
      });

      mockGoogleAuth.verifyIdToken.mockResolvedValue({
        getPayload: () => mockGoogleUserInfo
      } as any);

      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ 
          code: 'auth-code-123',
          state: 'csrf-state-token'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      
      // Verify Google ID was linked
      const updatedUser = await User.findOne({ where: { email: testEmail } });
      expect(updatedUser!.googleId).toBe(testGoogleId);
      expect(updatedUser!.googleAccessToken).toBe(mockAccessToken);
    });
  });

  describe('Token Refresh', () => {
    beforeEach(async () => {
      testUser = await User.create({
        email: testEmail,
        name: 'Test User',
        googleId: testGoogleId,
        googleAccessToken: 'expired-access-token',
        googleRefreshToken: mockRefreshToken,
        emailVerified: true,
        isActive: true
      });
    });

    it('should refresh Google access token', async () => {
      const newAccessToken = 'new-access-token';
      
      mockGoogleAuth.refreshAccessToken.mockResolvedValue({
        credentials: {
          access_token: newAccessToken,
          refresh_token: mockRefreshToken
        }
      });

      const response = await request(app)
        .post('/api/auth/google/refresh')
        .send({ userId: testUser.id })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken', newAccessToken);

      // Verify token was updated in database
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser!.googleAccessToken).toBe(newAccessToken);
    });

    it('should handle refresh token expiration', async () => {
      mockGoogleAuth.refreshAccessToken.mockRejectedValue(
        new Error('invalid_grant: Token has been expired or revoked')
      );

      const response = await request(app)
        .post('/api/auth/google/refresh')
        .send({ userId: testUser.id })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Refresh token expired');
      expect(response.body).toHaveProperty('requiresReauth', true);
    });

    it('should clear Google tokens when refresh fails permanently', async () => {
      mockGoogleAuth.refreshAccessToken.mockRejectedValue(
        new Error('invalid_grant: Token has been expired or revoked')
      );

      await request(app)
        .post('/api/auth/google/refresh')
        .send({ userId: testUser.id })
        .expect(401);

      // Verify tokens were cleared
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser!.googleAccessToken).toBeNull();
      expect(updatedUser!.googleRefreshToken).toBeNull();
    });
  });

  describe('Google Account Unlinking', () => {
    beforeEach(async () => {
      testUser = await User.create({
        email: testEmail,
        name: 'Test User',
        password: 'hashed-password', // Has password, so can unlink Google
        googleId: testGoogleId,
        googleAccessToken: mockAccessToken,
        googleRefreshToken: mockRefreshToken,
        emailVerified: true,
        isActive: true
      });
    });

    it('should unlink Google account when user has password', async () => {
      // Get auth token
      const token = jwt.sign(
        { userId: testUser.id, email: testEmail },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      mockGoogleAuth.getTokenInfo.mockResolvedValue({
        access_token: mockAccessToken
      });

      const response = await request(app)
        .post('/api/auth/google/unlink')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Google account unlinked successfully');

      // Verify Google data was removed
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser!.googleId).toBeNull();
      expect(updatedUser!.googleAccessToken).toBeNull();
      expect(updatedUser!.googleRefreshToken).toBeNull();
    });

    it('should revoke Google tokens when unlinking', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testEmail },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      mockGoogleAuth.getTokenInfo.mockResolvedValue({
        access_token: mockAccessToken
      });

      const mockRevoke = jest.fn().mockResolvedValue({});
      mockGoogleAuth.revokeToken = mockRevoke;

      await request(app)
        .post('/api/auth/google/unlink')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(mockRevoke).toHaveBeenCalledWith(mockAccessToken);
    });

    it('should prevent unlinking when Google is the only authentication method', async () => {
      // Update user to have no password
      await testUser.update({ password: null });

      const token = jwt.sign(
        { userId: testUser.id, email: testEmail },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/auth/google/unlink')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Cannot unlink the only authentication method');
    });
  });

  describe('Security and Edge Cases', () => {
    it('should prevent OAuth callback replay attacks', async () => {
      const authCode = 'auth-code-123';
      const state = 'csrf-state-token';

      mockGoogleAuth.getToken.mockResolvedValue({
        tokens: {
          access_token: mockAccessToken,
          id_token: mockIdToken
        }
      });

      mockGoogleAuth.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: testGoogleId,
          email: testEmail,
          email_verified: true
        })
      } as any);

      // First request should succeed
      await request(app)
        .get('/api/auth/google/callback')
        .query({ code: authCode, state })
        .expect(200);

      // Second request with same code should fail
      mockGoogleAuth.getToken.mockRejectedValue(
        new Error('Authorization code has already been used')
      );

      await request(app)
        .get('/api/auth/google/callback')
        .query({ code: authCode, state })
        .expect(400);
    });

    it('should handle rate limiting for OAuth endpoints', async () => {
      const requests = Array(10).fill(null).map(() => 
        request(app)
          .get('/api/auth/google')
      );

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });

    it('should validate redirect URI to prevent open redirect', async () => {
      const maliciousRedirect = 'https://evil.com/steal-tokens';
      
      const response = await request(app)
        .get('/api/auth/google')
        .query({ redirect_uri: maliciousRedirect })
        .expect(400);

      expect(response.body.error).toContain('Invalid redirect URI');
    });

    it('should handle Google API rate limiting', async () => {
      mockGoogleAuth.getToken.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ 
          code: 'auth-code-123',
          state: 'csrf-state-token'
        })
        .expect(429);

      expect(response.body.error).toContain('Rate limit exceeded');
    });

    it('should log security events for failed OAuth attempts', async () => {
      const logSpy = jest.spyOn(console, 'warn').mockImplementation();

      await request(app)
        .get('/api/auth/google/callback')
        .query({ 
          code: 'invalid-code',
          state: 'invalid-state'
        })
        .expect(400);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('OAuth security violation')
      );

      logSpy.mockRestore();
    });
  });

  describe('Mobile App Integration', () => {
    it('should handle mobile OAuth callback with deep link', async () => {
      mockGoogleAuth.getToken.mockResolvedValue({
        tokens: {
          access_token: mockAccessToken,
          id_token: mockIdToken
        }
      });

      mockGoogleAuth.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: testGoogleId,
          email: testEmail,
          email_verified: true
        })
      } as any);

      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ 
          code: 'auth-code-123',
          state: 'csrf-state-token',
          platform: 'mobile'
        })
        .expect(302);

      // Should redirect to mobile app with tokens
      expect(response.headers.location).toContain('upcoach://auth/success');
      expect(response.headers.location).toContain('token=');
    });

    it('should handle mobile OAuth errors with deep link', async () => {
      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ 
          error: 'access_denied',
          platform: 'mobile'
        })
        .expect(302);

      expect(response.headers.location).toContain('upcoach://auth/error');
      expect(response.headers.location).toContain('error=access_denied');
    });
  });

  describe('Cross-Platform Token Validation', () => {
    beforeEach(async () => {
      testUser = await User.create({
        email: testEmail,
        name: 'Test User',
        googleId: testGoogleId,
        googleAccessToken: mockAccessToken,
        emailVerified: true,
        isActive: true
      });
    });

    it('should validate Google token across platforms', async () => {
      mockGoogleAuth.getTokenInfo.mockResolvedValue({
        aud: process.env.GOOGLE_CLIENT_ID,
        sub: testGoogleId,
        email: testEmail,
        email_verified: 'true'
      });

      const response = await request(app)
        .post('/api/auth/google/validate')
        .send({ 
          accessToken: mockAccessToken,
          platform: 'web'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('valid', true);
      expect(response.body.data.user.email).toBe(testEmail);
    });

    it('should reject invalid Google tokens', async () => {
      mockGoogleAuth.getTokenInfo.mockRejectedValue(
        new Error('Invalid token')
      );

      const response = await request(app)
        .post('/api/auth/google/validate')
        .send({ 
          accessToken: 'invalid-token',
          platform: 'mobile'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('valid', false);
    });
  });
});
