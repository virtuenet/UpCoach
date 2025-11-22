import request from 'supertest';
import express, { Application } from 'express';
import googleRouter from '../../../routes/v2/auth/google';
import { googleAuthService } from '../../../services/auth/GoogleAuthService';
import { authMiddleware } from '../../../middleware/auth';
import { errorMiddleware } from '../../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../../services/auth/GoogleAuthService');
jest.mock('../../../middleware/auth');
jest.mock('../../../utils/logger');

describe('Google Authentication Routes', () => {
  let app: Application;

  beforeEach(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/v2/auth/google', googleRouter);
    app.use(errorMiddleware);

    // Reset mocks
    jest.clearAllMocks();

    // Mock auth middleware for protected routes
    (authMiddleware as jest.Mock).mockImplementation((req, res, next) => {
      (req as any).user = { id: 'test-user-id', email: 'test@example.com' };
      next();
    });
  });

  describe('POST /api/v2/auth/google/signin', () => {
    const validSignInRequest = {
      idToken: 'valid-google-token',
      platform: 'mobile' as const,
      deviceInfo: {
        deviceId: 'device-123',
        deviceName: 'iPhone 13',
        platform: 'iOS',
        appVersion: '1.0.0',
      },
    };

    const mockSignInResponse = {
      user: {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      },
      isNewUser: false,
    };

    it('should successfully sign in with Google', async () => {
      (googleAuthService.signIn as jest.Mock).mockResolvedValue(mockSignInResponse);

      const response = await request(app)
        .post('/api/v2/auth/google/signin')
        .send(validSignInRequest)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Sign in successful',
        data: mockSignInResponse,
      });

      expect(googleAuthService.signIn).toHaveBeenCalledWith(
        'valid-google-token',
        'mobile',
        expect.objectContaining({
          deviceId: 'device-123',
          deviceName: 'iPhone 13',
        })
      );
    });

    it('should return 201 for new user registration', async () => {
      const newUserResponse = { ...mockSignInResponse, isNewUser: true };
      (googleAuthService.signIn as jest.Mock).mockResolvedValue(newUserResponse);

      const response = await request(app)
        .post('/api/v2/auth/google/signin')
        .send(validSignInRequest)
        .expect(201);

      expect(response.body.message).toBe('Account created successfully');
    });

    it('should handle missing idToken', async () => {
      const response = await request(app)
        .post('/api/v2/auth/google/signin')
        .send({ platform: 'mobile' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should default platform to web if not specified', async () => {
      (googleAuthService.signIn as jest.Mock).mockResolvedValue(mockSignInResponse);

      await request(app)
        .post('/api/v2/auth/google/signin')
        .send({ idToken: 'token' })
        .expect(200);

      expect(googleAuthService.signIn).toHaveBeenCalledWith(
        'token',
        'web',
        expect.any(Object)
      );
    });

    it('should handle invalid Google token error', async () => {
      const error = new Error('Invalid Google authentication');
      (googleAuthService.signIn as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post('/api/v2/auth/google/signin')
        .send(validSignInRequest)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should capture IP address from request', async () => {
      (googleAuthService.signIn as jest.Mock).mockResolvedValue(mockSignInResponse);

      await request(app)
        .post('/api/v2/auth/google/signin')
        .set('X-Forwarded-For', '192.168.1.1')
        .send(validSignInRequest)
        .expect(200);

      expect(googleAuthService.signIn).toHaveBeenCalledWith(
        'valid-google-token',
        'mobile',
        expect.objectContaining({
          ipAddress: '192.168.1.1',
        })
      );
    });
  });

  describe('POST /api/v2/auth/google/refresh', () => {
    const mockRefreshResponse = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
    };

    it('should successfully refresh tokens', async () => {
      (googleAuthService.refreshToken as jest.Mock).mockResolvedValue(
        mockRefreshResponse
      );

      const response = await request(app)
        .post('/api/v2/auth/google/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          tokens: mockRefreshResponse,
        },
      });
    });

    it('should handle missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v2/auth/google/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid refresh token', async () => {
      (googleAuthService.refreshToken as jest.Mock).mockRejectedValue(
        new Error('Invalid refresh token')
      );

      const response = await request(app)
        .post('/api/v2/auth/google/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v2/auth/google/session', () => {
    const mockSessionResponse = {
      valid: true,
      user: {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    it('should validate session successfully', async () => {
      (googleAuthService.validateSession as jest.Mock).mockResolvedValue(
        mockSessionResponse
      );

      const response = await request(app)
        .get('/api/v2/auth/google/session')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Session is valid',
        data: {
          user: mockSessionResponse.user,
        },
      });
    });

    it('should handle invalid session', async () => {
      (googleAuthService.validateSession as jest.Mock).mockResolvedValue({
        valid: false,
      });

      const response = await request(app)
        .get('/api/v2/auth/google/session')
        .set('Authorization', 'Bearer valid-token')
        .expect(401);

      expect(response.body.error.message).toBe('Invalid session');
    });

    it('should require authentication', async () => {
      (authMiddleware as jest.Mock).mockImplementation((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      await request(app)
        .get('/api/v2/auth/google/session')
        .expect(401);
    });
  });

  describe('POST /api/v2/auth/google/link', () => {
    it('should link Google account successfully', async () => {
      const mockGoogleUser = {
        sub: 'google-123',
        email: 'google@example.com',
        name: 'Google User',
      };

      (googleAuthService.verifyIdToken as jest.Mock).mockResolvedValue(
        mockGoogleUser
      );
      (googleAuthService as any).findUserByGoogleId = jest.fn().mockResolvedValue(null);
      (googleAuthService as any).linkGoogleAccount = jest.fn().mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/v2/auth/google/link')
        .set('Authorization', 'Bearer valid-token')
        .send({ idToken: 'google-token' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Google account linked successfully',
        data: {
          googleEmail: 'google@example.com',
          googleName: 'Google User',
        },
      });
    });

    it('should prevent linking already linked account', async () => {
      const mockGoogleUser = {
        sub: 'google-123',
        email: 'google@example.com',
      };

      (googleAuthService.verifyIdToken as jest.Mock).mockResolvedValue(
        mockGoogleUser
      );
      (googleAuthService as any).findUserByGoogleId = jest.fn().mockResolvedValue({
        id: 'other-user-id',
      });

      const response = await request(app)
        .post('/api/v2/auth/google/link')
        .set('Authorization', 'Bearer valid-token')
        .send({ idToken: 'google-token' })
        .expect(409);

      expect(response.body.error.message).toContain('already linked');
    });
  });

  describe('DELETE /api/v2/auth/google/unlink', () => {
    it('should unlink Google account successfully', async () => {
      const mockDb = {
        query: jest.fn()
          .mockResolvedValueOnce({
            rows: [{
              password_hash: 'hash',
              auth_provider: 'google',
            }],
          })
          .mockResolvedValueOnce({ rows: [] }),
      };

      jest.mock('../../../services/database', () => ({ db: mockDb }));

      const response = await request(app)
        .delete('/api/v2/auth/google/unlink')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Google account unlinked successfully',
      });
    });

    it('should prevent unlinking if no alternative auth method', async () => {
      const mockDb = {
        query: jest.fn().mockResolvedValue({
          rows: [{
            password_hash: null,
            auth_provider: 'google',
          }],
        }),
      };

      jest.mock('../../../services/database', () => ({ db: mockDb }));

      const response = await request(app)
        .delete('/api/v2/auth/google/unlink')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.error.message).toContain('set a password first');
    });
  });

  describe('GET /api/v2/auth/google/status', () => {
    it('should return linked status', async () => {
      const mockDb = {
        query: jest.fn().mockResolvedValue({
          rows: [{
            google_id: 'google-123',
            google_email: 'google@example.com',
            auth_provider: 'google',
          }],
        }),
      };

      jest.mock('../../../services/database', () => ({ db: mockDb }));

      const response = await request(app)
        .get('/api/v2/auth/google/status')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          isLinked: true,
          googleEmail: 'google@example.com',
          authProvider: 'google',
        },
      });
    });

    it('should return unlinked status', async () => {
      const mockDb = {
        query: jest.fn().mockResolvedValue({
          rows: [{
            google_id: null,
            google_email: null,
            auth_provider: 'email',
          }],
        }),
      };

      jest.mock('../../../services/database', () => ({ db: mockDb }));

      const response = await request(app)
        .get('/api/v2/auth/google/status')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.isLinked).toBe(false);
    });
  });

  describe('POST /api/v2/auth/google/revoke', () => {
    it('should revoke all tokens successfully', async () => {
      (googleAuthService.revokeAllTokens as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/v2/auth/google/revoke')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'All tokens have been revoked successfully',
      });

      expect(googleAuthService.revokeAllTokens).toHaveBeenCalledWith('test-user-id');
    });

    it('should handle revocation errors', async () => {
      (googleAuthService.revokeAllTokens as jest.Mock).mockRejectedValue(
        new Error('Revocation failed')
      );

      const response = await request(app)
        .post('/api/v2/auth/google/revoke')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});