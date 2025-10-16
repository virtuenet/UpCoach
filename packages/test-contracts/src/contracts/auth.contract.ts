/**
 * Authentication Service Contract Tests
 *
 * Defines and validates API contracts between:
 * - Mobile App <-> API
 * - Admin Panel <-> API
 * - CMS Panel <-> API
 * - Landing Page <-> API
 *
 * Uses Pact for consumer-driven contract testing
 */

import { Pact, PactOptions, Matchers } from '@pact-foundation/pact';
import { InteractionObject } from '@pact-foundation/pact/src/dsl/interaction';
import path from 'path';
import { AuthAPI } from '../api-clients/AuthAPI';

const { like, eachLike, term, iso8601DateTime } = Matchers;

describe('Auth Service Contract Tests', () => {
  const mockProvider = new Pact({
    consumer: 'upcoach-clients',
    provider: 'upcoach-api',
    port: 1234,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'INFO',
    spec: 2,
    pactfileWriteMode: 'overwrite',
  } as PactOptions);

  const authAPI = new AuthAPI('http://localhost:1234');

  beforeAll(async () => {
    await mockProvider.setup();
  });

  afterAll(async () => {
    await mockProvider.finalize();
  });

  afterEach(async () => {
    await mockProvider.verify();
  });

  describe('User Registration Contract', () => {
    it('should register a new user successfully', async () => {
      const registrationData = {
        email: 'test@upcoach.ai',
        firstName: 'Test',
        lastName: 'User',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        acceptTerms: true,
      };

      const expectedResponse = {
        success: true,
        message: 'Registration successful',
        user: {
          id: like('user-123'),
          email: like('test@upcoach.ai'),
          firstName: like('Test'),
          lastName: like('User'),
          isVerified: like(false),
          createdAt: iso8601DateTime(),
          role: like('user'),
        },
      };

      await mockProvider.addInteraction({
        state: 'user does not exist',
        uponReceiving: 'a request to register a new user',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/register',
          headers: {
            'Content-Type': 'application/json',
          },
          body: registrationData,
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.register(registrationData);

      expect(result.success).toBe(true);
      expect(result.user.email).toBe('test@upcoach.ai');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should reject duplicate email registration', async () => {
      const registrationData = {
        email: 'existing@upcoach.ai',
        firstName: 'Existing',
        lastName: 'User',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        acceptTerms: true,
      };

      const expectedResponse = {
        success: false,
        error: 'Email already registered',
        code: 'EMAIL_EXISTS',
      };

      await mockProvider.addInteraction({
        state: 'user with email existing@upcoach.ai already exists',
        uponReceiving: 'a request to register with existing email',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/register',
          headers: {
            'Content-Type': 'application/json',
          },
          body: registrationData,
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.register(registrationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already registered');
    });

    it('should validate required registration fields', async () => {
      const invalidRegistrationData = {
        email: 'invalid-email',
        password: '123', // Too weak
        // Missing required fields
      };

      const expectedResponse = {
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: eachLike({
          field: like('email'),
          message: like('Invalid email format'),
          code: like('INVALID_FORMAT'),
        }),
      };

      await mockProvider.addInteraction({
        state: 'any state',
        uponReceiving: 'a request to register with invalid data',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/register',
          headers: {
            'Content-Type': 'application/json',
          },
          body: invalidRegistrationData,
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.register(invalidRegistrationData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('User Authentication Contract', () => {
    it('should authenticate user with valid credentials', async () => {
      const loginData = {
        email: 'test@upcoach.ai',
        password: 'SecurePassword123!',
        rememberMe: false,
      };

      const expectedResponse = {
        success: true,
        message: 'Login successful',
        token: term({
          generate: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          matcher: '^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+$',
        }),
        refreshToken: like('refresh-token-123'),
        user: {
          id: like('user-123'),
          email: like('test@upcoach.ai'),
          firstName: like('Test'),
          lastName: like('User'),
          role: like('user'),
          isVerified: like(true),
          lastLoginAt: iso8601DateTime(),
        },
        expiresIn: like(86400),
      };

      await mockProvider.addInteraction({
        state: 'user exists and is verified',
        uponReceiving: 'a request to login with valid credentials',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: loginData,
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.login(loginData);

      expect(result.success).toBe(true);
      expect(result.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      expect(result.user.email).toBe('test@upcoach.ai');
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'test@upcoach.ai',
        password: 'WrongPassword123!',
        rememberMe: false,
      };

      const expectedResponse = {
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      };

      await mockProvider.addInteraction({
        state: 'user exists but password is wrong',
        uponReceiving: 'a request to login with invalid credentials',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: loginData,
        },
        willRespondWith: {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.login(loginData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should require email verification before login', async () => {
      const loginData = {
        email: 'unverified@upcoach.ai',
        password: 'SecurePassword123!',
        rememberMe: false,
      };

      const expectedResponse = {
        success: false,
        error: 'Please verify your email address before logging in',
        code: 'EMAIL_NOT_VERIFIED',
        requiresVerification: true,
      };

      await mockProvider.addInteraction({
        state: 'user exists but email is not verified',
        uponReceiving: 'a request to login with unverified email',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: loginData,
        },
        willRespondWith: {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.login(loginData);

      expect(result.success).toBe(false);
      expect(result.requiresVerification).toBe(true);
    });

    it('should handle rate limiting', async () => {
      const loginData = {
        email: 'test@upcoach.ai',
        password: 'WrongPassword123!',
        rememberMe: false,
      };

      const expectedResponse = {
        success: false,
        error: 'Too many login attempts. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: like(900), // 15 minutes
      };

      await mockProvider.addInteraction({
        state: 'user has exceeded login attempt limit',
        uponReceiving: 'a request to login when rate limited',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: loginData,
        },
        willRespondWith: {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.login(loginData);

      expect(result.success).toBe(false);
      expect(result.code).toBe('RATE_LIMITED');
      expect(result.retryAfter).toBe(900);
    });
  });

  describe('Token Management Contract', () => {
    it('should validate JWT token', async () => {
      const token = 'valid-jwt-token';

      const expectedResponse = {
        valid: true,
        user: {
          id: like('user-123'),
          email: like('test@upcoach.ai'),
          role: like('user'),
        },
        expiresAt: iso8601DateTime(),
      };

      await mockProvider.addInteraction({
        state: 'valid JWT token exists',
        uponReceiving: 'a request to validate JWT token',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/validate-token',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.validateToken(token);

      expect(result.valid).toBe(true);
      expect(result.user.id).toBe('user-123');
    });

    it('should reject invalid JWT token', async () => {
      const token = 'invalid-jwt-token';

      const expectedResponse = {
        valid: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      };

      await mockProvider.addInteraction({
        state: 'any state',
        uponReceiving: 'a request to validate invalid JWT token',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/validate-token',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        },
        willRespondWith: {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.validateToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
    });

    it('should refresh JWT token', async () => {
      const refreshToken = 'valid-refresh-token';

      const expectedResponse = {
        success: true,
        token: term({
          generate: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-token-payload.signature',
          matcher: '^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+$',
        }),
        refreshToken: like('new-refresh-token'),
        expiresIn: like(86400),
      };

      await mockProvider.addInteraction({
        state: 'valid refresh token exists',
        uponReceiving: 'a request to refresh JWT token',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/refresh-token',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            refreshToken: refreshToken,
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.refreshToken(refreshToken);

      expect(result.success).toBe(true);
      expect(result.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });
  });

  describe('Password Management Contract', () => {
    it('should initiate password reset', async () => {
      const resetData = { email: 'test@upcoach.ai' };

      const expectedResponse = {
        success: true,
        message: 'Password reset email sent',
      };

      await mockProvider.addInteraction({
        state: 'user exists',
        uponReceiving: 'a request to initiate password reset',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/forgot-password',
          headers: {
            'Content-Type': 'application/json',
          },
          body: resetData,
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.forgotPassword(resetData.email);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset email sent');
    });

    it('should reset password with valid token', async () => {
      const resetData = {
        token: 'valid-reset-token',
        newPassword: 'NewSecurePassword123!',
        confirmPassword: 'NewSecurePassword123!',
      };

      const expectedResponse = {
        success: true,
        message: 'Password reset successful',
      };

      await mockProvider.addInteraction({
        state: 'valid password reset token exists',
        uponReceiving: 'a request to reset password with valid token',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/reset-password',
          headers: {
            'Content-Type': 'application/json',
          },
          body: resetData,
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.resetPassword(resetData);

      expect(result.success).toBe(true);
    });

    it('should reject invalid reset token', async () => {
      const resetData = {
        token: 'invalid-reset-token',
        newPassword: 'NewSecurePassword123!',
        confirmPassword: 'NewSecurePassword123!',
      };

      const expectedResponse = {
        success: false,
        error: 'Invalid or expired reset token',
        code: 'INVALID_RESET_TOKEN',
      };

      await mockProvider.addInteraction({
        state: 'any state',
        uponReceiving: 'a request to reset password with invalid token',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/reset-password',
          headers: {
            'Content-Type': 'application/json',
          },
          body: resetData,
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.resetPassword(resetData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired reset token');
    });
  });

  describe('Email Verification Contract', () => {
    it('should verify email with valid token', async () => {
      const verificationToken = 'valid-verification-token';

      const expectedResponse = {
        success: true,
        message: 'Email verified successfully',
        user: {
          id: like('user-123'),
          email: like('test@upcoach.ai'),
          isVerified: true,
          emailVerifiedAt: iso8601DateTime(),
        },
      };

      await mockProvider.addInteraction({
        state: 'valid email verification token exists',
        uponReceiving: 'a request to verify email with valid token',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/verify-email',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            token: verificationToken,
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.verifyEmail(verificationToken);

      expect(result.success).toBe(true);
      expect(result.user.isVerified).toBe(true);
    });

    it('should resend verification email', async () => {
      const resendData = { email: 'test@upcoach.ai' };

      const expectedResponse = {
        success: true,
        message: 'Verification email sent',
      };

      await mockProvider.addInteraction({
        state: 'unverified user exists',
        uponReceiving: 'a request to resend verification email',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/resend-verification',
          headers: {
            'Content-Type': 'application/json',
          },
          body: resendData,
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.resendVerification(resendData.email);

      expect(result.success).toBe(true);
    });
  });

  describe('Multi-Factor Authentication Contract', () => {
    it('should enable 2FA', async () => {
      const token = 'valid-jwt-token';

      const expectedResponse = {
        success: true,
        message: '2FA enabled successfully',
        secret: like('JBSWY3DPEHPK3PXP'),
        qrCode: term({
          generate: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
          matcher: '^data:image\\/png;base64,[A-Za-z0-9+\\/=]+$',
        }),
        backupCodes: eachLike('12345678'),
      };

      await mockProvider.addInteraction({
        state: 'authenticated user without 2FA',
        uponReceiving: 'a request to enable 2FA',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/2fa/enable',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.enable2FA(token);

      expect(result.success).toBe(true);
      expect(result.secret).toBeTruthy();
      expect(result.qrCode).toMatch(/^data:image\/png;base64,/);
      expect(Array.isArray(result.backupCodes)).toBe(true);
    });

    it('should verify 2FA code', async () => {
      const token = 'valid-jwt-token';
      const verificationData = { code: '123456' };

      const expectedResponse = {
        success: true,
        message: '2FA verification successful',
        verified: true,
      };

      await mockProvider.addInteraction({
        state: 'user has pending 2FA setup',
        uponReceiving: 'a request to verify 2FA code',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/2fa/verify',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: verificationData,
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.verify2FA(token, verificationData.code);

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
    });
  });

  describe('Session Management Contract', () => {
    it('should logout user', async () => {
      const token = 'valid-jwt-token';

      const expectedResponse = {
        success: true,
        message: 'Logout successful',
      };

      await mockProvider.addInteraction({
        state: 'authenticated user exists',
        uponReceiving: 'a request to logout',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/logout',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.logout(token);

      expect(result.success).toBe(true);
    });

    it('should get active sessions', async () => {
      const token = 'valid-jwt-token';

      const expectedResponse = {
        success: true,
        sessions: eachLike({
          id: like('session-123'),
          deviceInfo: {
            browser: like('Chrome'),
            os: like('Windows'),
            ip: like('192.168.1.1'),
          },
          createdAt: iso8601DateTime(),
          lastActivity: iso8601DateTime(),
          current: like(true),
        }),
      };

      await mockProvider.addInteraction({
        state: 'authenticated user with active sessions',
        uponReceiving: 'a request to get active sessions',
        withRequest: {
          method: 'GET',
          path: '/api/v1/auth/sessions',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.getSessions(token);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.sessions)).toBe(true);
    });

    it('should revoke specific session', async () => {
      const token = 'valid-jwt-token';
      const sessionId = 'session-to-revoke';

      const expectedResponse = {
        success: true,
        message: 'Session revoked successfully',
      };

      await mockProvider.addInteraction({
        state: 'session exists for user',
        uponReceiving: 'a request to revoke specific session',
        withRequest: {
          method: 'DELETE',
          path: `/api/v1/auth/sessions/${sessionId}`,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.revokeSession(token, sessionId);

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling Contract', () => {
    it('should handle server errors gracefully', async () => {
      const loginData = {
        email: 'test@upcoach.ai',
        password: 'SecurePassword123!',
        rememberMe: false,
      };

      const expectedResponse = {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
      };

      await mockProvider.addInteraction({
        state: 'server is experiencing issues',
        uponReceiving: 'a request when server has internal error',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: loginData,
        },
        willRespondWith: {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.login(loginData);

      expect(result.success).toBe(false);
      expect(result.code).toBe('INTERNAL_ERROR');
    });

    it('should handle network timeouts', async () => {
      // This would typically be handled by the HTTP client
      // but we can define the expected behavior in the contract
      const loginData = {
        email: 'test@upcoach.ai',
        password: 'SecurePassword123!',
        rememberMe: false,
      };

      const expectedResponse = {
        success: false,
        error: 'Request timeout',
        code: 'TIMEOUT',
      };

      await mockProvider.addInteraction({
        state: 'server is slow to respond',
        uponReceiving: 'a request that times out',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: loginData,
        },
        willRespondWith: {
          status: 408,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      } as InteractionObject);

      const result = await authAPI.login(loginData);

      expect(result.success).toBe(false);
      expect(result.code).toBe('TIMEOUT');
    });
  });
});