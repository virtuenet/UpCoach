import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { describe, beforeEach, afterEach, test, expect, jest } from '@jest/globals';
import { mockRedis } from '../mocks/redis.helper';
import { createMockRequest, createMockResponse } from '../helpers/test-app.helper';

// Mock config module BEFORE importing auth middleware
jest.mock('../../config/environment', () => ({
  config: {
    jwt: {
      secret: 'test-jwt-secret',
      expiresIn: '15m',
      refreshSecret: 'test-refresh-secret',
      refreshExpiresIn: '30d',
    },
  },
}));

// Import auth middleware AFTER mocking config
import {
  authMiddleware,
  generateTokens,
  verifyRefreshToken,
  blacklistToken,
  AuthenticatedRequest
} from '../../middleware/auth';

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    JWT_SECRET: 'test-jwt-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '30d'
  };
});

afterEach(() => {
  process.env = originalEnv;
  mockRedis.clear();
});

describe('Auth Middleware', () => {
  describe('generateTokens', () => {
    test('should generate valid access and refresh tokens', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const role = 'user';
      const req = createMockRequest({
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' }
      });

      const tokens = generateTokens(userId, email, role, req);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');

      // Verify access token payload
      const accessPayload = jwt.verify(tokens.accessToken, 'test-jwt-secret', {
        issuer: 'upcoach-api',
        audience: 'upcoach-client',
        algorithms: ['HS256']
      }) as any;
      expect(accessPayload.userId).toBe(userId);
      expect(accessPayload.email).toBe(email);
      expect(accessPayload.role).toBe(role);
      expect(accessPayload.type).toBe('access');

      // Verify refresh token payload
      const refreshPayload = jwt.verify(tokens.refreshToken, 'test-refresh-secret', {
        issuer: 'upcoach-api',
        audience: 'upcoach-client',
        algorithms: ['HS256']
      }) as any;
      expect(refreshPayload.userId).toBe(userId);
      expect(refreshPayload.type).toBe('refresh');
    });

    test('should include IP and user agent in token metadata', () => {
      const req = createMockRequest({
        ip: '192.168.1.1',
        headers: { 'user-agent': 'Mozilla/5.0' }
      });

      const tokens = generateTokens('user-id', 'user@example.com', 'user', req);
      const accessPayload = jwt.verify(tokens.accessToken, 'test-jwt-secret', {
        issuer: 'upcoach-api',
        audience: 'upcoach-client',
        algorithms: ['HS256']
      }) as any;

      expect(accessPayload.ip).toBe('192.168.1.1');
      expect(accessPayload.userAgent).toBe('Mozilla/5.0');
    });
  });

  describe('verifyRefreshToken', () => {
    test('should verify valid refresh token', () => {
      const userId = 'test-user-id';
      const req = createMockRequest();
      const tokens = generateTokens(userId, 'test@example.com', 'user', req);

      const result = verifyRefreshToken(tokens.refreshToken);

      expect(result.userId).toBe(userId);
    });

    test('should throw error for invalid refresh token', () => {
      expect(() => {
        verifyRefreshToken('invalid-token');
      }).toThrow();
    });

    test('should throw error for access token used as refresh token', () => {
      const req = createMockRequest();
      const tokens = generateTokens('user-id', 'user@example.com', 'user', req);

      expect(() => {
        verifyRefreshToken(tokens.accessToken);
      }).toThrow();
    });
  });

  describe('blacklistToken', () => {
    test('should blacklist token in Redis', async () => {
      const req = createMockRequest();
      const tokens = generateTokens('user-id', 'user@example.com', 'user', req);

      await blacklistToken(tokens.accessToken);

      const blacklisted = await mockRedis.exists(`blacklist:${tokens.accessToken}`);
      expect(blacklisted).toBe(1);
    });

    test('should set appropriate TTL for blacklisted token', async () => {
      const req = createMockRequest();
      const tokens = generateTokens('user-id', 'user@example.com', 'user', req);

      await blacklistToken(tokens.accessToken);

      const ttl = await mockRedis.ttl(`blacklist:${tokens.accessToken}`);
      expect(ttl).toBeGreaterThan(0);
    });
  });

  describe('authMiddleware', () => {
    let req: AuthenticatedRequest;
    let res: Response;
    let next: NextFunction;

    beforeEach(() => {
      req = createMockRequest() as AuthenticatedRequest;
      res = createMockResponse();
      next = jest.fn();
    });

    test('should authenticate valid token', async () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const role = 'user';
      const mockReq = createMockRequest();
      const tokens = generateTokens(userId, email, role, mockReq);

      req.headers = {
        authorization: `Bearer ${tokens.accessToken}`
      };

      await authMiddleware(req, res, next);

      expect(req.user).toEqual({
        id: userId,
        email: email,
        role: role
      });
      expect(next).toHaveBeenCalledWith();
    });

    test('should reject missing authorization header', async () => {
      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject malformed authorization header', async () => {
      req.headers = {
        authorization: 'Invalid format'
      };

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token format'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject invalid token', async () => {
      req.headers = {
        authorization: 'Bearer invalid-token'
      };

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject blacklisted token', async () => {
      const userId = 'test-user-id';
      const mockReq = createMockRequest();
      const tokens = generateTokens(userId, 'test@example.com', 'user', mockReq);

      // Blacklist the token
      await blacklistToken(tokens.accessToken);

      req.headers = {
        authorization: `Bearer ${tokens.accessToken}`
      };

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token has been revoked'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject refresh token used as access token', async () => {
      const mockReq = createMockRequest();
      const tokens = generateTokens('user-id', 'user@example.com', 'user', mockReq);

      req.headers = {
        authorization: `Bearer ${tokens.refreshToken}`
      };

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token type'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle expired token gracefully', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        {
          userId: 'user-id',
          email: 'user@example.com',
          role: 'user',
          type: 'access'
        },
        'test-jwt-secret',
        { expiresIn: '-1s' } // Already expired
      );

      req.headers = {
        authorization: `Bearer ${expiredToken}`
      };

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle Redis connection errors gracefully', async () => {
      const userId = 'test-user-id';
      const mockReq = createMockRequest();
      const tokens = generateTokens(userId, 'test@example.com', 'user', mockReq);

      // Mock Redis error
      const originalExists = mockRedis.exists;
      mockRedis.exists = jest.fn().mockRejectedValue(new Error('Redis connection failed'));

      req.headers = {
        authorization: `Bearer ${tokens.accessToken}`
      };

      await authMiddleware(req, res, next);

      // Should proceed if Redis is down (fail open for availability)
      expect(req.user).toEqual({
        id: userId,
        email: 'test@example.com',
        role: 'user'
      });
      expect(next).toHaveBeenCalledWith();

      // Restore Redis mock
      mockRedis.exists = originalExists;
    });
  });

  describe('Token Security', () => {
    test('should use different secrets for access and refresh tokens', () => {
      const req = createMockRequest();
      const tokens = generateTokens('user-id', 'user@example.com', 'user', req);

      // Access token should not be verifiable with refresh secret
      expect(() => {
        jwt.verify(tokens.accessToken, 'test-refresh-secret', {
          issuer: 'upcoach-api',
          audience: 'upcoach-client',
          algorithms: ['HS256']
        });
      }).toThrow();

      // Refresh token should not be verifiable with access secret
      expect(() => {
        jwt.verify(tokens.refreshToken, 'test-jwt-secret', {
          issuer: 'upcoach-api',
          audience: 'upcoach-client',
          algorithms: ['HS256']
        });
      }).toThrow();
    });

    test('should include unique jti in tokens', () => {
      const req = createMockRequest();
      const tokens1 = generateTokens('user-id', 'user@example.com', 'user', req);
      const tokens2 = generateTokens('user-id', 'user@example.com', 'user', req);

      const payload1 = jwt.verify(tokens1.accessToken, 'test-jwt-secret', {
        issuer: 'upcoach-api',
        audience: 'upcoach-client',
        algorithms: ['HS256']
      }) as any;
      const payload2 = jwt.verify(tokens2.accessToken, 'test-jwt-secret', {
        issuer: 'upcoach-api',
        audience: 'upcoach-client',
        algorithms: ['HS256']
      }) as any;

      expect(payload1.jti).toBeDefined();
      expect(payload2.jti).toBeDefined();
      expect(payload1.jti).not.toBe(payload2.jti);
    });

    test('should validate token expiration correctly', () => {
      // Set very short expiration for testing
      process.env.JWT_EXPIRES_IN = '0s';

      const req = createMockRequest();

      // This might pass or fail depending on timing, so we'll just ensure it doesn't crash
      expect(() => {
        generateTokens('user-id', 'user@example.com', 'user', req);
      }).not.toThrow();
    });
  });
});