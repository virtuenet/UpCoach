/**
 * Comprehensive Authentication Service Unit Tests
 *
 * Tests all authentication functionality including:
 * - User registration and login
 * - JWT token management
 * - Password hashing and verification
 * - Multi-factor authentication
 * - OAuth integration
 * - Session management
 * - Rate limiting
 * - Security validations
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../services/AuthService';
import { UserService } from '../../services/UserService';
import { EmailService } from '../../services/EmailService';
import { RedisService } from '../../services/RedisService';
import { SecurityService } from '../../services/SecurityService';
import { AuditService } from '../../services/AuditService';

// Test data factories
const createTestUser = () => ({
  id: 'test-user-id',
  email: 'test@upcoach.ai',
  firstName: 'Test',
  lastName: 'User',
  password: 'hashedPassword123',
  isVerified: true,
  role: 'user' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const createTestAuthRequest = () => ({
  email: 'test@upcoach.ai',
  password: 'SecurePassword123!',
  rememberMe: false,
});

const createTestRegisterRequest = () => ({
  email: 'newuser@upcoach.ai',
  firstName: 'New',
  lastName: 'User',
  password: 'SecurePassword123!',
  confirmPassword: 'SecurePassword123!',
  acceptTerms: true,
});

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let mockUserService: jest.Mocked<UserService>;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockRedisService: jest.Mocked<RedisService>;
  let mockSecurityService: jest.Mocked<SecurityService>;
  let mockAuditService: jest.Mocked<AuditService>;

  // Mock environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-jwt-secret-key',
      JWT_EXPIRES_IN: '24h',
      BCRYPT_ROUNDS: '10',
      MAX_LOGIN_ATTEMPTS: '5',
      LOCKOUT_TIME: '15',
    };

    // Create mocked services
    mockUserService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateLastLogin: jest.fn(),
      incrementLoginAttempts: jest.fn(),
      resetLoginAttempts: jest.fn(),
      lockAccount: jest.fn(),
      unlockAccount: jest.fn(),
    } as any;

    mockEmailService = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      sendWelcomeEmail: jest.fn(),
      sendSecurityAlert: jest.fn(),
    } as any;

    mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      increment: jest.fn(),
    } as any;

    mockSecurityService = {
      generateSecureToken: jest.fn(),
      validatePasswordStrength: jest.fn(),
      detectSuspiciousActivity: jest.fn(),
      checkRateLimit: jest.fn(),
      validateIPAddress: jest.fn(),
    } as any;

    mockAuditService = {
      logAuthEvent: jest.fn(),
      logSecurityEvent: jest.fn(),
      logUserAction: jest.fn(),
    } as any;

    authService = new AuthService(
      mockUserService,
      mockEmailService,
      mockRedisService,
      mockSecurityService,
      mockAuditService
    );

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const registerData = createTestRegisterRequest();
      const hashedPassword = 'hashed-password';

      // Mock implementations
      mockUserService.findByEmail.mockResolvedValue(null);
      mockSecurityService.validatePasswordStrength.mockReturnValue({ isValid: true, score: 4 });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      mockSecurityService.generateSecureToken.mockReturnValue('verification-token');
      mockUserService.create.mockResolvedValue({ id: 'new-user-id', ...registerData, password: hashedPassword });
      mockEmailService.sendVerificationEmail.mockResolvedValue(true);

      const result = await authService.register(registerData);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(registerData.email);
      expect(mockUserService.create).toHaveBeenCalledWith({
        email: registerData.email,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        password: hashedPassword,
        isVerified: false,
      });
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
      expect(mockAuditService.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REGISTER', success: true })
      );
    });

    it('should reject registration with existing email', async () => {
      const registerData = createTestRegisterRequest();
      const existingUser = createTestUser();

      mockUserService.findByEmail.mockResolvedValue(existingUser);

      const result = await authService.register(registerData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already registered');
      expect(mockUserService.create).not.toHaveBeenCalled();
      expect(mockAuditService.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REGISTER', success: false, error: 'Email already registered' })
      );
    });

    it('should reject registration with weak password', async () => {
      const registerData = { ...createTestRegisterRequest(), password: '123' };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockSecurityService.validatePasswordStrength.mockReturnValue({
        isValid: false,
        score: 1,
        feedback: ['Password too short', 'Add numbers and symbols']
      });

      const result = await authService.register(registerData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Password does not meet requirements');
      expect(mockUserService.create).not.toHaveBeenCalled();
    });

    it('should reject registration with mismatched passwords', async () => {
      const registerData = {
        ...createTestRegisterRequest(),
        confirmPassword: 'DifferentPassword123!'
      };

      const result = await authService.register(registerData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Passwords do not match');
      expect(mockUserService.create).not.toHaveBeenCalled();
    });
  });

  describe('User Authentication', () => {
    it('should authenticate user with valid credentials', async () => {
      const authData = createTestAuthRequest();
      const user = createTestUser();
      const token = 'jwt-token';

      mockSecurityService.checkRateLimit.mockResolvedValue(true);
      mockUserService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwt, 'sign').mockReturnValue(token as never);
      mockUserService.updateLastLogin.mockResolvedValue(undefined);
      mockUserService.resetLoginAttempts.mockResolvedValue(undefined);

      const result = await authService.authenticate(authData);

      expect(result.success).toBe(true);
      expect(result.token).toBe(token);
      expect(result.user).toEqual(expect.objectContaining({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }));
      expect(mockUserService.updateLastLogin).toHaveBeenCalledWith(user.id);
      expect(mockUserService.resetLoginAttempts).toHaveBeenCalledWith(user.id);
      expect(mockAuditService.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN', success: true, userId: user.id })
      );
    });

    it('should reject authentication with invalid email', async () => {
      const authData = createTestAuthRequest();

      mockSecurityService.checkRateLimit.mockResolvedValue(true);
      mockUserService.findByEmail.mockResolvedValue(null);

      const result = await authService.authenticate(authData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(mockAuditService.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN', success: false, error: 'User not found' })
      );
    });

    it('should reject authentication with invalid password', async () => {
      const authData = createTestAuthRequest();
      const user = createTestUser();

      mockSecurityService.checkRateLimit.mockResolvedValue(true);
      mockUserService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      mockUserService.incrementLoginAttempts.mockResolvedValue(undefined);

      const result = await authService.authenticate(authData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(mockUserService.incrementLoginAttempts).toHaveBeenCalledWith(user.id);
      expect(mockAuditService.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN', success: false, error: 'Invalid password' })
      );
    });

    it('should reject authentication when rate limited', async () => {
      const authData = createTestAuthRequest();

      mockSecurityService.checkRateLimit.mockResolvedValue(false);

      const result = await authService.authenticate(authData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many login attempts. Please try again later.');
      expect(mockUserService.findByEmail).not.toHaveBeenCalled();
    });

    it('should reject authentication for locked account', async () => {
      const authData = createTestAuthRequest();
      const user = { ...createTestUser(), isLocked: true, lockedUntil: new Date(Date.now() + 900000) };

      mockSecurityService.checkRateLimit.mockResolvedValue(true);
      mockUserService.findByEmail.mockResolvedValue(user);

      const result = await authService.authenticate(authData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account is temporarily locked due to multiple failed login attempts');
    });

    it('should reject authentication for unverified account', async () => {
      const authData = createTestAuthRequest();
      const user = { ...createTestUser(), isVerified: false };

      mockSecurityService.checkRateLimit.mockResolvedValue(true);
      mockUserService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await authService.authenticate(authData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please verify your email address before logging in');
    });
  });

  describe('Token Management', () => {
    it('should generate valid JWT token', () => {
      const user = createTestUser();
      const token = authService.generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token structure
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.userId).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    it('should validate valid JWT token', async () => {
      const user = createTestUser();
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      mockUserService.findById.mockResolvedValue(user);

      const result = await authService.validateToken(token);

      expect(result.valid).toBe(true);
      expect(result.user).toEqual(expect.objectContaining({
        id: user.id,
        email: user.email,
      }));
    });

    it('should reject invalid JWT token', async () => {
      const invalidToken = 'invalid-token';

      const result = await authService.validateToken(invalidToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
    });

    it('should reject expired JWT token', async () => {
      const user = createTestUser();
      const expiredToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' }
      );

      const result = await authService.validateToken(expiredToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');
    });

    it('should handle token blacklisting', async () => {
      const user = createTestUser();
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      mockRedisService.exists.mockResolvedValue(1); // Token is blacklisted

      const result = await authService.validateToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token has been revoked');
    });
  });

  describe('Password Reset', () => {
    it('should initiate password reset successfully', async () => {
      const email = 'test@upcoach.ai';
      const user = createTestUser();
      const resetToken = 'reset-token';

      mockUserService.findByEmail.mockResolvedValue(user);
      mockSecurityService.generateSecureToken.mockReturnValue(resetToken);
      mockRedisService.set.mockResolvedValue('OK');
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(true);

      const result = await authService.initiatePasswordReset(email);

      expect(result.success).toBe(true);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `password_reset:${resetToken}`,
        user.id,
        'EX',
        3600 // 1 hour expiry
      );
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(user, resetToken);
    });

    it('should handle password reset for non-existent email gracefully', async () => {
      const email = 'nonexistent@upcoach.ai';

      mockUserService.findByEmail.mockResolvedValue(null);

      const result = await authService.initiatePasswordReset(email);

      // Should return success for security reasons (don't reveal if email exists)
      expect(result.success).toBe(true);
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should reset password with valid token', async () => {
      const resetToken = 'valid-reset-token';
      const newPassword = 'NewSecurePassword123!';
      const userId = 'user-id';
      const hashedPassword = 'hashed-new-password';

      mockRedisService.get.mockResolvedValue(userId);
      mockSecurityService.validatePasswordStrength.mockReturnValue({ isValid: true, score: 4 });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      mockUserService.update.mockResolvedValue(undefined);
      mockRedisService.del.mockResolvedValue(1);

      const result = await authService.resetPassword(resetToken, newPassword);

      expect(result.success).toBe(true);
      expect(mockUserService.update).toHaveBeenCalledWith(userId, {
        password: hashedPassword,
        passwordChangedAt: expect.any(Date),
      });
      expect(mockRedisService.del).toHaveBeenCalledWith(`password_reset:${resetToken}`);
    });

    it('should reject password reset with invalid token', async () => {
      const resetToken = 'invalid-reset-token';
      const newPassword = 'NewSecurePassword123!';

      mockRedisService.get.mockResolvedValue(null);

      const result = await authService.resetPassword(resetToken, newPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired reset token');
    });
  });

  describe('Email Verification', () => {
    it('should verify email with valid token', async () => {
      const verificationToken = 'valid-verification-token';
      const userId = 'user-id';

      mockRedisService.get.mockResolvedValue(userId);
      mockUserService.update.mockResolvedValue(undefined);
      mockRedisService.del.mockResolvedValue(1);

      const result = await authService.verifyEmail(verificationToken);

      expect(result.success).toBe(true);
      expect(mockUserService.update).toHaveBeenCalledWith(userId, {
        isVerified: true,
        emailVerifiedAt: expect.any(Date),
      });
      expect(mockRedisService.del).toHaveBeenCalledWith(`email_verification:${verificationToken}`);
    });

    it('should reject email verification with invalid token', async () => {
      const verificationToken = 'invalid-verification-token';

      mockRedisService.get.mockResolvedValue(null);

      const result = await authService.verifyEmail(verificationToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired verification token');
    });
  });

  describe('Multi-Factor Authentication', () => {
    it('should enable 2FA for user', async () => {
      const userId = 'user-id';
      const user = createTestUser();
      const secret = 'totp-secret';

      mockUserService.findById.mockResolvedValue(user);
      mockSecurityService.generateTOTPSecret.mockReturnValue(secret);
      mockUserService.update.mockResolvedValue(undefined);

      const result = await authService.enable2FA(userId);

      expect(result.success).toBe(true);
      expect(result.secret).toBe(secret);
      expect(result.qrCode).toBeDefined();
      expect(mockUserService.update).toHaveBeenCalledWith(userId, {
        totpSecret: secret,
        isTwoFactorEnabled: false, // Will be enabled after verification
      });
    });

    it('should verify and activate 2FA', async () => {
      const userId = 'user-id';
      const totpCode = '123456';
      const user = { ...createTestUser(), totpSecret: 'totp-secret' };

      mockUserService.findById.mockResolvedValue(user);
      mockSecurityService.verifyTOTP.mockReturnValue(true);
      mockUserService.update.mockResolvedValue(undefined);

      const result = await authService.verify2FA(userId, totpCode);

      expect(result.success).toBe(true);
      expect(mockUserService.update).toHaveBeenCalledWith(userId, {
        isTwoFactorEnabled: true,
      });
    });

    it('should reject invalid 2FA code', async () => {
      const userId = 'user-id';
      const totpCode = '000000';
      const user = { ...createTestUser(), totpSecret: 'totp-secret' };

      mockUserService.findById.mockResolvedValue(user);
      mockSecurityService.verifyTOTP.mockReturnValue(false);

      const result = await authService.verify2FA(userId, totpCode);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid verification code');
    });
  });

  describe('Session Management', () => {
    it('should create session successfully', async () => {
      const userId = 'user-id';
      const sessionId = 'session-id';
      const deviceInfo = { browser: 'Chrome', os: 'Windows' };

      mockSecurityService.generateSecureToken.mockReturnValue(sessionId);
      mockRedisService.set.mockResolvedValue('OK');

      const result = await authService.createSession(userId, deviceInfo);

      expect(result.sessionId).toBe(sessionId);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `session:${sessionId}`,
        expect.objectContaining({
          userId,
          deviceInfo,
          createdAt: expect.any(String),
        }),
        'EX',
        86400 // 24 hours
      );
    });

    it('should validate active session', async () => {
      const sessionId = 'valid-session-id';
      const sessionData = {
        userId: 'user-id',
        deviceInfo: { browser: 'Chrome', os: 'Windows' },
        createdAt: new Date().toISOString(),
      };

      mockRedisService.get.mockResolvedValue(JSON.stringify(sessionData));

      const result = await authService.validateSession(sessionId);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(sessionData.userId);
    });

    it('should invalidate expired session', async () => {
      const sessionId = 'expired-session-id';

      mockRedisService.get.mockResolvedValue(null);

      const result = await authService.validateSession(sessionId);

      expect(result.valid).toBe(false);
    });

    it('should logout and destroy session', async () => {
      const sessionId = 'session-to-destroy';
      const token = 'jwt-token';

      mockRedisService.del.mockResolvedValue(1);
      mockRedisService.set.mockResolvedValue('OK');

      const result = await authService.logout(sessionId, token);

      expect(result.success).toBe(true);
      expect(mockRedisService.del).toHaveBeenCalledWith(`session:${sessionId}`);
      // Token should be blacklisted
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `blacklisted_token:${token}`,
        'true',
        'EX',
        expect.any(Number)
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      const authData = createTestAuthRequest();

      mockSecurityService.checkRateLimit.mockResolvedValue(true);
      mockUserService.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      const result = await authService.authenticate(authData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication service temporarily unavailable');
    });

    it('should handle Redis connection errors gracefully', async () => {
      const email = 'test@upcoach.ai';
      const user = createTestUser();

      mockUserService.findByEmail.mockResolvedValue(user);
      mockSecurityService.generateSecureToken.mockReturnValue('reset-token');
      mockRedisService.set.mockRejectedValue(new Error('Redis connection failed'));

      const result = await authService.initiatePasswordReset(email);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unable to process request at this time');
    });

    it('should handle email service failures gracefully', async () => {
      const registerData = createTestRegisterRequest();

      mockUserService.findByEmail.mockResolvedValue(null);
      mockSecurityService.validatePasswordStrength.mockReturnValue({ isValid: true, score: 4 });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
      mockSecurityService.generateSecureToken.mockReturnValue('verification-token');
      mockUserService.create.mockResolvedValue({ id: 'new-user-id', ...registerData });
      mockEmailService.sendVerificationEmail.mockRejectedValue(new Error('Email service failed'));

      const result = await authService.register(registerData);

      // Registration should still succeed even if email fails
      expect(result.success).toBe(true);
      expect(result.warning).toBe('Account created but verification email could not be sent');
    });
  });

  describe('Security Features', () => {
    it('should detect and log suspicious activity', async () => {
      const authData = createTestAuthRequest();
      const suspiciousActivity = {
        riskScore: 8,
        reasons: ['Multiple failed attempts', 'Unusual location']
      };

      mockSecurityService.checkRateLimit.mockResolvedValue(true);
      mockSecurityService.detectSuspiciousActivity.mockReturnValue(suspiciousActivity);
      mockUserService.findByEmail.mockResolvedValue(createTestUser());

      const result = await authService.authenticate(authData);

      expect(result.requiresAdditionalVerification).toBe(true);
      expect(mockAuditService.logSecurityEvent).toHaveBeenCalledWith({
        type: 'SUSPICIOUS_ACTIVITY',
        riskScore: suspiciousActivity.riskScore,
        reasons: suspiciousActivity.reasons,
        userId: expect.any(String),
      });
    });

    it('should validate IP address restrictions', async () => {
      const authData = createTestAuthRequest();
      const ipAddress = '192.168.1.1';

      mockSecurityService.checkRateLimit.mockResolvedValue(true);
      mockSecurityService.validateIPAddress.mockReturnValue(false);

      const result = await authService.authenticate(authData, { ipAddress });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied from this location');
    });

    it('should enforce account lockout after max failed attempts', async () => {
      const authData = createTestAuthRequest();
      const user = { ...createTestUser(), loginAttempts: 4 };

      mockSecurityService.checkRateLimit.mockResolvedValue(true);
      mockUserService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      mockUserService.incrementLoginAttempts.mockResolvedValue(undefined);
      mockUserService.lockAccount.mockResolvedValue(undefined);

      const result = await authService.authenticate(authData);

      expect(result.success).toBe(false);
      expect(mockUserService.lockAccount).toHaveBeenCalledWith(
        user.id,
        expect.any(Date) // Lock until time
      );
      expect(mockEmailService.sendSecurityAlert).toHaveBeenCalledWith(user);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high concurrent authentication requests', async () => {
      const authData = createTestAuthRequest();
      const user = createTestUser();
      const concurrentRequests = 100;

      mockSecurityService.checkRateLimit.mockResolvedValue(true);
      mockUserService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwt, 'sign').mockReturnValue('jwt-token' as never);
      mockUserService.updateLastLogin.mockResolvedValue(undefined);
      mockUserService.resetLoginAttempts.mockResolvedValue(undefined);

      const promises = Array.from({ length: concurrentRequests }, () =>
        authService.authenticate(authData)
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' &&
        (r.value as any).success).length;

      expect(successful).toBeGreaterThan(0);
      expect(successful).toBeLessThanOrEqual(concurrentRequests);
    });

    it('should cache frequently accessed user data', async () => {
      const token = jwt.sign(
        { userId: 'frequent-user', email: 'frequent@upcoach.ai', role: 'user' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      mockRedisService.get.mockResolvedValueOnce(null); // Cache miss first time
      mockUserService.findById.mockResolvedValue(createTestUser());
      mockRedisService.set.mockResolvedValue('OK');

      // First call - should hit database
      await authService.validateToken(token);

      mockRedisService.get.mockResolvedValueOnce(JSON.stringify(createTestUser())); // Cache hit

      // Second call - should hit cache
      await authService.validateToken(token);

      expect(mockUserService.findById).toHaveBeenCalledTimes(1); // Only called once
      expect(mockRedisService.get).toHaveBeenCalledTimes(3); // Called for blacklist check and cache
    });
  });
});