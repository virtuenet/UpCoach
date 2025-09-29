import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import googleAuthRoutes from '../../routes/googleAuth';

// Mock dependencies
jest.mock('../../services/auth/GoogleAuthService');
jest.mock('../../services/userService');
jest.mock('../../services/redis');
jest.mock('../../middleware/auth');

describe('Google Auth Routes', () => {
  let app: express.Application;
  let mockGoogleAuthService: any;
  let mockUserService: any;
  let mockRedis: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth/google', googleAuthRoutes);

    // Mock Google Auth Service
    mockGoogleAuthService = {
      getUserInfo: jest.fn(),
    };
    const { googleAuthService } = require('../../services/auth/GoogleAuthService');
    (googleAuthService.getUserInfo as jest.Mock) = mockGoogleAuthService.getUserInfo;

    // Mock User Service
    mockUserService = {
      findByEmail: jest.fn(),
      createFromGoogle: jest.fn(),
      update: jest.fn(),
      updateLastLogin: jest.fn(),
      toResponseDto: jest.fn(),
    };
    const { UserService } = require('../../services/userService');
    Object.assign(UserService, mockUserService);

    // Mock Redis
    mockRedis = {
      setEx: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };
    const { redis } = require('../../services/redis');
    Object.assign(redis, mockRedis);

    // Mock auth middleware
    const { generateTokens, authLimiter } = require('../../middleware/auth');
    (generateTokens as jest.Mock) = jest.fn().mockReturnValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
    (authLimiter as jest.Mock) = jest.fn((req: any, res: any, next: any) => next());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /signin', () => {
    const validGoogleUser = {
      sub: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
      email_verified: true,
    };

    const validRequestBody = {
      id_token: 'valid-google-id-token',
      access_token: 'valid-google-access-token',
      client_info: {
        platform: 'mobile',
        app_version: '1.0.0',
        device_id: 'test-device',
      },
    };

    it('should create new user and sign in successfully', async () => {
      // Setup mocks for new user creation
      mockGoogleAuthService.getUserInfo.mockResolvedValue(validGoogleUser);
      mockUserService.findByEmail.mockResolvedValue(null);
      
      const newUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        isActive: true,
      };
      
      mockUserService.createFromGoogle.mockResolvedValue(newUser);
      mockUserService.toResponseDto.mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      });

      const response = await request(app)
        .post('/auth/google/signin')
        .send(validRequestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isNewUser).toBe(true);
      expect(response.body.data.authProvider).toBe('google');
      expect(response.body.data.tokens.accessToken).toBe('mock-access-token');

      // Verify service calls
      expect(mockGoogleAuthService.getUserInfo).toHaveBeenCalledWith({
        idToken: 'valid-google-id-token',
        accessToken: 'valid-google-access-token',
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserService.createFromGoogle).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        googleId: 'google-123',
        avatarUrl: 'https://example.com/photo.jpg',
        isEmailVerified: true,
      });
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'refresh_token:user-123',
        30 * 24 * 60 * 60,
        'mock-refresh-token'
      );
    });

    it('should sign in existing user successfully', async () => {
      const existingUser = {
        id: 'existing-user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        isActive: true,
        googleId: null,
        avatarUrl: null,
        isEmailVerified: false,
      };

      mockGoogleAuthService.getUserInfo.mockResolvedValue(validGoogleUser);
      mockUserService.findByEmail.mockResolvedValue(existingUser);
      mockUserService.update.mockResolvedValue(existingUser);
      mockUserService.toResponseDto.mockReturnValue({
        id: 'existing-user-123',
        email: 'test@example.com',
        name: 'Test User',
      });

      const response = await request(app)
        .post('/auth/google/signin')
        .send(validRequestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isNewUser).toBe(false);
      
      // Should update user with Google data
      expect(mockUserService.update).toHaveBeenCalledWith('existing-user-123', {
        google_id: 'google-123',
        auth_provider: 'google',
        avatar_url: 'https://example.com/photo.jpg',
        is_email_verified: true,
        last_provider_sync: expect.any(Date),
        provider_data: {
          google: {
            sub: 'google-123',
            locale: undefined,
            picture: 'https://example.com/photo.jpg',
            verified_email: true,
          }
        }
      });
    });

    it('should reject request with missing ID token', async () => {
      const invalidRequestBody = {
        client_info: { platform: 'mobile' },
      };

      const response = await request(app)
        .post('/auth/google/signin')
        .send(invalidRequestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Google ID token is required');
    });

    it('should reject unverified Google email', async () => {
      const unverifiedGoogleUser = {
        ...validGoogleUser,
        email_verified: false,
      };

      mockGoogleAuthService.getUserInfo.mockResolvedValue(unverifiedGoogleUser);

      const response = await request(app)
        .post('/auth/google/signin')
        .send(validRequestBody)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Google account email must be verified');
    });

    it('should reject deactivated user account', async () => {
      const deactivatedUser = {
        id: 'deactivated-user-123',
        email: 'test@example.com',
        isActive: false,
      };

      mockGoogleAuthService.getUserInfo.mockResolvedValue(validGoogleUser);
      mockUserService.findByEmail.mockResolvedValue(deactivatedUser);

      const response = await request(app)
        .post('/auth/google/signin')
        .send(validRequestBody)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is deactivated');
    });

    it('should handle Google Auth service errors', async () => {
      mockGoogleAuthService.getUserInfo.mockRejectedValue(
        new Error('Google token verification failed')
      );

      const response = await request(app)
        .post('/auth/google/signin')
        .send(validRequestBody)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Google Sign-In failed');
    });
  });

  describe('POST /refresh', () => {
    const validRefreshBody = {
      refresh_token: 'valid-refresh-token',
    };

    it('should refresh Google tokens successfully', async () => {
      const mockVerifyRefreshToken = jest.fn().mockReturnValue({
        userId: 'user-123',
      });
      
      const { verifyRefreshToken } = require('../../middleware/auth');
      (verifyRefreshToken as jest.Mock) = mockVerifyRefreshToken;

      mockRedis.get.mockResolvedValue('valid-refresh-token');
      
      const existingUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        isActive: true,
      };
      mockUserService.findById.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/auth/google/refresh')
        .send(validRefreshBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBe('mock-access-token');

      expect(mockRedis.get).toHaveBeenCalledWith('refresh_token:user-123');
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'refresh_token:user-123',
        30 * 24 * 60 * 60,
        'mock-refresh-token'
      );
    });

    it('should reject invalid refresh token', async () => {
      const mockVerifyRefreshToken = jest.fn().mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });
      
      const { verifyRefreshToken } = require('../../middleware/auth');
      (verifyRefreshToken as jest.Mock) = mockVerifyRefreshToken;

      const response = await request(app)
        .post('/auth/google/refresh')
        .send(validRefreshBody)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token refresh failed');
    });

    it('should reject when stored token does not match', async () => {
      const mockVerifyRefreshToken = jest.fn().mockReturnValue({
        userId: 'user-123',
      });
      
      const { verifyRefreshToken } = require('../../middleware/auth');
      (verifyRefreshToken as jest.Mock) = mockVerifyRefreshToken;

      mockRedis.get.mockResolvedValue('different-token');

      const response = await request(app)
        .post('/auth/google/refresh')
        .send(validRefreshBody)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid refresh token');
    });
  });

  describe('Security headers', () => {
    it('should set security headers on all Google auth endpoints', async () => {
      const response = await request(app)
        .post('/auth/google/signin')
        .send({
          id_token: 'test-token',
          client_info: { platform: 'mobile' },
        });

      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('Rate limiting', () => {
    it('should apply rate limiting to signin endpoint', async () => {
      // Rate limiter is mocked but we verify it's called
      await request(app)
        .post('/auth/google/signin')
        .send({
          id_token: 'test-token',
          client_info: { platform: 'mobile' },
        });

      const { authLimiter } = require('../../middleware/auth');
      expect(authLimiter).toHaveBeenCalled();
    });

    it('should apply rate limiting to refresh endpoint', async () => {
      await request(app)
        .post('/auth/google/refresh')
        .send({
          refresh_token: 'test-token',
        });

      const { authLimiter } = require('../../middleware/auth');
      expect(authLimiter).toHaveBeenCalled();
    });
  });
});