import request from 'supertest';
import { app } from '../app';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { JWTService } from '../services/JWTService';
import { GoogleAuthService } from '../services/GoogleAuthService';
import { AppleAuthService } from '../services/AppleAuthService';

jest.mock('../services/AuthService');
jest.mock('../services/UserService');
jest.mock('../services/JWTService');
jest.mock('../services/GoogleAuthService');
jest.mock('../services/AppleAuthService');

const mockAuthService = AuthService as jest.MockedClass<typeof AuthService>;
const mockUserService = UserService as jest.MockedClass<typeof UserService>;
const mockJWTService = JWTService as jest.MockedClass<typeof JWTService>;
const mockGoogleAuthService = GoogleAuthService as jest.MockedClass<typeof GoogleAuthService>;
const mockAppleAuthService = AppleAuthService as jest.MockedClass<typeof AppleAuthService>;

describe('OAuth 2.0 Authentication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const mockUser = {
        id: 'user-123',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isEmailVerified: false
      };

      mockAuthService.prototype.register = jest.fn().mockResolvedValue(mockUser);
      mockAuthService.prototype.sendEmailVerification = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User registered successfully',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName
        }
      });

      expect(mockAuthService.prototype.register).toHaveBeenCalledWith(userData);
      expect(mockAuthService.prototype.sendEmailVerification).toHaveBeenCalledWith(mockUser.email);
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      mockAuthService.prototype.register = jest.fn().mockRejectedValue(
        new Error('User already exists with this email')
      );

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User already exists with this email'
      });
    });

    it('should validate password requirements', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Password must be at least 8 characters')
      });
    });

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid email format')
      });
    });
  });

  describe('POST /auth/login', () => {
    it('should authenticate user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePassword123!'
      };

      const mockUser = {
        id: 'user-123',
        email: loginData.email,
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true
      };

      const mockTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresIn: 3600
      };

      mockAuthService.prototype.login = jest.fn().mockResolvedValue(mockUser);
      mockJWTService.prototype.generateTokens = jest.fn().mockResolvedValue(mockTokens);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: mockUser,
        tokens: mockTokens
      });

      expect(mockAuthService.prototype.login).toHaveBeenCalledWith(
        loginData.email,
        loginData.password
      );
    });

    it('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockAuthService.prototype.login = jest.fn().mockRejectedValue(
        new Error('Invalid credentials')
      );

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid credentials'
      });
    });

    it('should return error for unverified email', async () => {
      const loginData = {
        email: 'unverified@example.com',
        password: 'SecurePassword123!'
      };

      mockAuthService.prototype.login = jest.fn().mockRejectedValue(
        new Error('Email not verified')
      );

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Email not verified'
      });
    });

    it('should handle rate limiting for failed login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockAuthService.prototype.login = jest.fn().mockRejectedValue(
        new Error('Too many failed attempts')
      );

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(429);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Too many failed attempts'
      });
    });
  });

  describe('Google OAuth Integration', () => {
    describe('GET /auth/google', () => {
      it('should redirect to Google OAuth', async () => {
        const response = await request(app)
          .get('/auth/google')
          .expect(302);

        expect(response.headers.location).toContain('accounts.google.com');
      });
    });

    describe('GET /auth/google/callback', () => {
      it('should handle successful Google OAuth callback', async () => {
        const mockGoogleUser = {
          id: 'google-123',
          email: 'google@example.com',
          given_name: 'John',
          family_name: 'Doe',
          picture: 'https://example.com/photo.jpg'
        };

        const mockUser = {
          id: 'user-123',
          email: mockGoogleUser.email,
          firstName: mockGoogleUser.given_name,
          lastName: mockGoogleUser.family_name,
          avatar: mockGoogleUser.picture,
          isEmailVerified: true
        };

        const mockTokens = {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresIn: 3600
        };

        mockGoogleAuthService.prototype.verifyToken = jest.fn().mockResolvedValue(mockGoogleUser);
        mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(null);
        mockUserService.prototype.createFromGoogle = jest.fn().mockResolvedValue(mockUser);
        mockJWTService.prototype.generateTokens = jest.fn().mockResolvedValue(mockTokens);

        const response = await request(app)
          .get('/auth/google/callback')
          .query({ code: 'google-auth-code' })
          .expect(302);

        expect(response.headers.location).toContain('success');
      });

      it('should handle existing Google user login', async () => {
        const mockGoogleUser = {
          id: 'google-123',
          email: 'existing@example.com',
          given_name: 'John',
          family_name: 'Doe'
        };

        const existingUser = {
          id: 'user-123',
          email: mockGoogleUser.email,
          firstName: mockGoogleUser.given_name,
          lastName: mockGoogleUser.family_name,
          googleId: mockGoogleUser.id
        };

        mockGoogleAuthService.prototype.verifyToken = jest.fn().mockResolvedValue(mockGoogleUser);
        mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(existingUser);

        const response = await request(app)
          .get('/auth/google/callback')
          .query({ code: 'google-auth-code' })
          .expect(302);

        expect(mockUserService.prototype.createFromGoogle).not.toHaveBeenCalled();
      });

      it('should handle Google OAuth error', async () => {
        mockGoogleAuthService.prototype.verifyToken = jest.fn().mockRejectedValue(
          new Error('Invalid Google token')
        );

        const response = await request(app)
          .get('/auth/google/callback')
          .query({ code: 'invalid-code' })
          .expect(302);

        expect(response.headers.location).toContain('error');
      });
    });
  });

  describe('Apple OAuth Integration', () => {
    describe('POST /auth/apple', () => {
      it('should handle successful Apple Sign-In', async () => {
        const appleData = {
          identityToken: 'apple-identity-token',
          authorizationCode: 'apple-auth-code',
          user: {
            email: 'apple@example.com',
            firstName: 'John',
            lastName: 'Doe'
          }
        };

        const mockAppleUser = {
          sub: 'apple-123',
          email: appleData.user.email,
          email_verified: true
        };

        const mockUser = {
          id: 'user-123',
          email: mockAppleUser.email,
          firstName: appleData.user.firstName,
          lastName: appleData.user.lastName,
          appleId: mockAppleUser.sub,
          isEmailVerified: true
        };

        const mockTokens = {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresIn: 3600
        };

        mockAppleAuthService.prototype.verifyToken = jest.fn().mockResolvedValue(mockAppleUser);
        mockUserService.prototype.findByEmail = jest.fn().mockResolvedValue(null);
        mockUserService.prototype.createFromApple = jest.fn().mockResolvedValue(mockUser);
        mockJWTService.prototype.generateTokens = jest.fn().mockResolvedValue(mockTokens);

        const response = await request(app)
          .post('/auth/apple')
          .send(appleData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          user: mockUser,
          tokens: mockTokens
        });
      });

      it('should handle Apple Sign-In error', async () => {
        const appleData = {
          identityToken: 'invalid-token',
          authorizationCode: 'invalid-code'
        };

        mockAppleAuthService.prototype.verifyToken = jest.fn().mockRejectedValue(
          new Error('Invalid Apple token')
        );

        const response = await request(app)
          .post('/auth/apple')
          .send(appleData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Invalid Apple token'
        });
      });
    });
  });

  describe('Email Verification', () => {
    describe('POST /auth/verify-email', () => {
      it('should verify email with valid token', async () => {
        const verificationData = {
          token: 'verification-token-123'
        };

        mockAuthService.prototype.verifyEmail = jest.fn().mockResolvedValue(true);

        const response = await request(app)
          .post('/auth/verify-email')
          .send(verificationData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Email verified successfully'
        });

        expect(mockAuthService.prototype.verifyEmail).toHaveBeenCalledWith(
          verificationData.token
        );
      });

      it('should return error for invalid verification token', async () => {
        const verificationData = {
          token: 'invalid-token'
        };

        mockAuthService.prototype.verifyEmail = jest.fn().mockRejectedValue(
          new Error('Invalid or expired token')
        );

        const response = await request(app)
          .post('/auth/verify-email')
          .send(verificationData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Invalid or expired token'
        });
      });
    });

    describe('POST /auth/resend-verification', () => {
      it('should resend verification email', async () => {
        const resendData = {
          email: 'test@example.com'
        };

        mockAuthService.prototype.sendEmailVerification = jest.fn().mockResolvedValue(true);

        const response = await request(app)
          .post('/auth/resend-verification')
          .send(resendData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Verification email sent'
        });
      });

      it('should handle rate limiting for verification emails', async () => {
        const resendData = {
          email: 'test@example.com'
        };

        mockAuthService.prototype.sendEmailVerification = jest.fn().mockRejectedValue(
          new Error('Too many requests')
        );

        const response = await request(app)
          .post('/auth/resend-verification')
          .send(resendData)
          .expect(429);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Too many requests'
        });
      });
    });
  });

  describe('Password Reset', () => {
    describe('POST /auth/forgot-password', () => {
      it('should send password reset email', async () => {
        const resetData = {
          email: 'test@example.com'
        };

        mockAuthService.prototype.sendPasswordReset = jest.fn().mockResolvedValue(true);

        const response = await request(app)
          .post('/auth/forgot-password')
          .send(resetData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Password reset email sent'
        });
      });

      it('should not reveal if email exists', async () => {
        const resetData = {
          email: 'nonexistent@example.com'
        };

        mockAuthService.prototype.sendPasswordReset = jest.fn().mockResolvedValue(false);

        const response = await request(app)
          .post('/auth/forgot-password')
          .send(resetData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Password reset email sent'
        });
      });
    });

    describe('POST /auth/reset-password', () => {
      it('should reset password with valid token', async () => {
        const resetData = {
          token: 'reset-token-123',
          password: 'NewSecurePassword123!'
        };

        mockAuthService.prototype.resetPassword = jest.fn().mockResolvedValue(true);

        const response = await request(app)
          .post('/auth/reset-password')
          .send(resetData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Password reset successfully'
        });
      });

      it('should return error for invalid reset token', async () => {
        const resetData = {
          token: 'invalid-token',
          password: 'NewSecurePassword123!'
        };

        mockAuthService.prototype.resetPassword = jest.fn().mockRejectedValue(
          new Error('Invalid or expired token')
        );

        const response = await request(app)
          .post('/auth/reset-password')
          .send(resetData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Invalid or expired token'
        });
      });
    });
  });

  describe('Token Refresh', () => {
    describe('POST /auth/refresh', () => {
      it('should refresh access token with valid refresh token', async () => {
        const refreshData = {
          refreshToken: 'valid-refresh-token'
        };

        const newTokens = {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600
        };

        mockJWTService.prototype.refreshTokens = jest.fn().mockResolvedValue(newTokens);

        const response = await request(app)
          .post('/auth/refresh')
          .send(refreshData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          tokens: newTokens
        });
      });

      it('should return error for invalid refresh token', async () => {
        const refreshData = {
          refreshToken: 'invalid-refresh-token'
        };

        mockJWTService.prototype.refreshTokens = jest.fn().mockRejectedValue(
          new Error('Invalid refresh token')
        );

        const response = await request(app)
          .post('/auth/refresh')
          .send(refreshData)
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Invalid refresh token'
        });
      });
    });
  });

  describe('Logout', () => {
    describe('POST /auth/logout', () => {
      it('should logout user successfully', async () => {
        const logoutData = {
          refreshToken: 'valid-refresh-token'
        };

        mockAuthService.prototype.logout = jest.fn().mockResolvedValue(true);

        const response = await request(app)
          .post('/auth/logout')
          .send(logoutData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Logged out successfully'
        });
      });

      it('should handle logout with invalid token gracefully', async () => {
        const logoutData = {
          refreshToken: 'invalid-refresh-token'
        };

        mockAuthService.prototype.logout = jest.fn().mockRejectedValue(
          new Error('Invalid token')
        );

        const response = await request(app)
          .post('/auth/logout')
          .send(logoutData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Logged out successfully'
        });
      });
    });
  });

  describe('Two-Factor Authentication', () => {
    describe('POST /auth/2fa/setup', () => {
      it('should set up 2FA for authenticated user', async () => {
        const mockSecret = 'JBSWY3DPEHPK3PXP';
        const mockQRCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

        mockAuthService.prototype.setup2FA = jest.fn().mockResolvedValue({
          secret: mockSecret,
          qrCode: mockQRCode
        });

        const response = await request(app)
          .post('/auth/2fa/setup')
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          secret: mockSecret,
          qrCode: mockQRCode
        });
      });
    });

    describe('POST /auth/2fa/verify', () => {
      it('should verify 2FA token', async () => {
        const verifyData = {
          token: '123456'
        };

        mockAuthService.prototype.verify2FA = jest.fn().mockResolvedValue(true);

        const response = await request(app)
          .post('/auth/2fa/verify')
          .set('Authorization', 'Bearer valid-token')
          .send(verifyData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: '2FA verified successfully'
        });
      });

      it('should return error for invalid 2FA token', async () => {
        const verifyData = {
          token: '000000'
        };

        mockAuthService.prototype.verify2FA = jest.fn().mockResolvedValue(false);

        const response = await request(app)
          .post('/auth/2fa/verify')
          .set('Authorization', 'Bearer valid-token')
          .send(verifyData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Invalid 2FA token'
        });
      });
    });
  });
});