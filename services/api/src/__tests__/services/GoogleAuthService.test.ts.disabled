import { OAuth2Client } from 'google-auth-library';
import { GoogleAuthService } from '../../services/auth/GoogleAuthService';
import { db } from '../../services/database';
import { redis } from '../../services/redis';
import { ApiError } from '../../utils/apiError';
import * as authMiddleware from '../../middleware/auth';

// Mock dependencies
jest.mock('google-auth-library');
jest.mock('../../services/database');
jest.mock('../../services/redis');
jest.mock('../../middleware/auth');
jest.mock('../../utils/logger');
jest.mock('@supabase/supabase-js');

describe('GoogleAuthService', () => {
  let googleAuthService: GoogleAuthService;
  let mockOAuthClient: jest.Mocked<OAuth2Client>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set up environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_MOBILE_CLIENT_ID = 'test-mobile-client-id';
    process.env.GOOGLE_WEB_CLIENT_ID = 'test-web-client-id';

    // Mock OAuth2Client with comprehensive typing
    mockOAuthClient = {
      verifyIdToken: jest.fn(),
      generateAuthUrl: jest.fn(),
      getToken: jest.fn(),
      setCredentials: jest.fn(),
      getAccessToken: jest.fn(),
      // Required OAuth2Client properties
      endpoints: {} as any,
      issuers: [],
      clientAuthentication: {} as any,
      generateCodeVerifier: jest.fn(),
      generateCodeChallenge: jest.fn(),
      revokeToken: jest.fn(),
      revokeCredentials: jest.fn(),
      request: jest.fn(),
      getRequestMetadata: jest.fn(),
      // Mock additional required methods
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      setMaxListeners: jest.fn(),
      getMaxListeners: jest.fn(),
      listeners: jest.fn(),
      rawListeners: jest.fn(),
      listenerCount: jest.fn(),
      prependListener: jest.fn(),
      prependOnceListener: jest.fn(),
      eventNames: jest.fn(),
    } as unknown as jest.Mocked<OAuth2Client>;

    (OAuth2Client as jest.MockedClass<typeof OAuth2Client>).mockImplementation(
      () => mockOAuthClient
    );

    // Create service instance
    googleAuthService = new GoogleAuthService();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_MOBILE_CLIENT_ID;
    delete process.env.GOOGLE_WEB_CLIENT_ID;
  });

  describe('verifyIdToken', () => {
    const mockGooglePayload = {
      sub: '123456789',
      email: 'test@example.com',
      email_verified: true,
      name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      picture: 'https://example.com/photo.jpg',
      locale: 'en',
      iss: 'https://accounts.google.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    it('should successfully verify a valid Google ID token', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(mockGooglePayload)
      };
      (mockOAuthClient.verifyIdToken as jest.Mock).mockResolvedValue(mockTicket);

      const result = await googleAuthService.verifyIdToken('valid-token');

      expect(result).toEqual({
        sub: '123456789',
        email: 'test@example.com',
        email_verified: true,
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/photo.jpg',
        locale: 'en',
      });

      expect(mockOAuthClient.verifyIdToken).toHaveBeenCalledWith({
        idToken: 'valid-token',
        audience: ['test-client-id'],
      });
    });

    it('should verify token with mobile client ID when platform is mobile', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(mockGooglePayload)
      };
      (mockOAuthClient.verifyIdToken as jest.Mock).mockResolvedValue(mockTicket);

      await googleAuthService.verifyIdToken('valid-token', 'mobile');

      expect(mockOAuthClient.verifyIdToken).toHaveBeenCalledWith({
        idToken: 'valid-token',
        audience: ['test-client-id', 'test-mobile-client-id'],
      });
    });

    it('should verify token with web client ID when platform is web', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(mockGooglePayload)
      };
      (mockOAuthClient.verifyIdToken as jest.Mock).mockResolvedValue(mockTicket);

      await googleAuthService.verifyIdToken('valid-token', 'web');

      expect(mockOAuthClient.verifyIdToken).toHaveBeenCalledWith({
        idToken: 'valid-token',
        audience: ['test-client-id', 'test-web-client-id'],
      });
    });

    it('should throw error for invalid token', async () => {
      (mockOAuthClient.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      await expect(
        googleAuthService.verifyIdToken('invalid-token')
      ).rejects.toThrow(ApiError);
    });

    it('should throw error for expired token', async () => {
      (mockOAuthClient.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('Token used too late')
      );

      await expect(
        googleAuthService.verifyIdToken('expired-token')
      ).rejects.toThrow('Google token has expired');
    });

    it('should throw error for malformed token', async () => {
      (mockOAuthClient.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('Wrong number of segments')
      );

      await expect(
        googleAuthService.verifyIdToken('malformed-token')
      ).rejects.toThrow('Malformed Google token');
    });

    it('should throw error for invalid issuer', async () => {
      const invalidPayload = { ...mockGooglePayload, iss: 'invalid-issuer' };
      (mockOAuthClient.verifyIdToken as jest.Mock).mockResolvedValue({
        getPayload: () => invalidPayload,
      });

      await expect(
        googleAuthService.verifyIdToken('token-with-invalid-issuer')
      ).rejects.toThrow('Invalid token issuer');
    });

    it('should throw error when email is missing', async () => {
      const noEmailPayload = { ...mockGooglePayload, email: undefined };
      (mockOAuthClient.verifyIdToken as jest.Mock).mockResolvedValue({
        getPayload: () => noEmailPayload,
      });

      await expect(
        googleAuthService.verifyIdToken('token-without-email')
      ).rejects.toThrow('Email not provided in Google token');
    });

    it('should throw error when email is not verified and verification is required', async () => {
      process.env.REQUIRE_EMAIL_VERIFICATION = 'true';
      
      const unverifiedPayload = { ...mockGooglePayload, email_verified: false };
      (mockOAuthClient.verifyIdToken as jest.Mock).mockResolvedValue({
        getPayload: () => unverifiedPayload,
      });

      await expect(
        googleAuthService.verifyIdToken('token-unverified-email')
      ).rejects.toThrow('Email not verified with Google');

      delete process.env.REQUIRE_EMAIL_VERIFICATION;
    });
  });

  describe('signIn', () => {
    const mockGoogleUser = {
      sub: '123456789',
      email: 'test@example.com',
      email_verified: true,
      name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      picture: 'https://example.com/photo.jpg',
      locale: 'en',
    };

    const mockExistingUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      google_id: '123456789',
      role: 'user',
      is_active: true,
    };

    beforeEach(() => {
      // Mock verifyIdToken
      (mockOAuthClient.verifyIdToken as jest.Mock).mockResolvedValue({
        getPayload: () => ({
          ...mockGoogleUser,
          iss: 'https://accounts.google.com',
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      });

      // Mock token generation
      (authMiddleware.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });

      // Mock Redis
      (redis.setEx as jest.Mock).mockResolvedValue('OK');
    });

    it('should sign in existing user with Google ID', async () => {
      // Mock finding user by Google ID
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockExistingUser],
      });

      const result = await googleAuthService.signIn('valid-token', 'mobile');

      expect(result).toEqual({
        user: expect.objectContaining({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        }),
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
        },
        isNewUser: false,
      });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE google_id'),
        ['123456789']
      );
    });

    it('should create new user when not found', async () => {
      // Mock user not found by Google ID
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // findUserByGoogleId
        .mockResolvedValueOnce({ rows: [] }) // findUserByEmail
        .mockResolvedValueOnce({ // createGoogleUser
          rows: [{
            id: '2',
            email: 'test@example.com',
            name: 'Test User',
            google_id: '123456789',
            role: 'user',
            is_active: true,
          }],
        })
        .mockResolvedValueOnce({ rows: [] }); // logAuthEvent

      const result = await googleAuthService.signIn('valid-token', 'web');

      expect(result.isNewUser).toBe(true);
      expect(result.user.email).toBe('test@example.com');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['test@example.com', 'Test User', '123456789'])
      );
    });

    it('should link existing email account with Google', async () => {
      const existingEmailUser = {
        id: '3',
        email: 'test@example.com',
        name: 'Existing User',
        google_id: null,
        role: 'user',
        is_active: true,
      };

      // Mock user not found by Google ID but found by email
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // findUserByGoogleId
        .mockResolvedValueOnce({ rows: [existingEmailUser] }) // findUserByEmail
        .mockResolvedValueOnce({ rows: [] }) // linkGoogleAccount
        .mockResolvedValueOnce({ rows: [] }); // logAuthEvent

      const result = await googleAuthService.signIn('valid-token', 'mobile');

      expect(result.isNewUser).toBe(false);
      expect(result.user.id).toBe('3');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining(['123456789', 'test@example.com'])
      );
    });

    it('should handle device info correctly', async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [mockExistingUser] });

      const deviceInfo = {
        deviceId: 'device-123',
        deviceName: 'iPhone 13',
        platform: 'iOS',
        appVersion: '1.0.0',
      };

      await googleAuthService.signIn('valid-token', 'mobile', deviceInfo);

      expect(redis.setEx).toHaveBeenCalledWith(
        'refresh_token:1',
        30 * 24 * 60 * 60,
        expect.stringContaining('device-123')
      );
    });

    it('should handle database errors gracefully', async () => {
      (db.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        googleAuthService.signIn('valid-token')
      ).rejects.toThrow('Database error');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'user',
        is_active: true,
      };

      (authMiddleware.verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: '1',
      });

      (db.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });

      (redis.get as jest.Mock).mockResolvedValue(
        JSON.stringify({
          token: 'valid-refresh-token',
          deviceInfo: { deviceId: 'device-123' },
        })
      );

      (authMiddleware.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const result = await googleAuthService.refreshToken('valid-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      });
    });

    it('should throw error for invalid refresh token', async () => {
      (authMiddleware.verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        googleAuthService.refreshToken('invalid-token')
      ).rejects.toThrow();
    });

    it('should throw error when refresh token not found in Redis', async () => {
      (authMiddleware.verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: '1',
      });

      (db.query as jest.Mock).mockResolvedValue({ rows: [{ id: '1' }] });

      (redis.get as jest.Mock).mockResolvedValue(null);

      await expect(
        googleAuthService.refreshToken('expired-token')
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error for inactive user', async () => {
      (authMiddleware.verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: '1',
      });

      (db.query as jest.Mock).mockResolvedValue({ rows: [] });

      await expect(
        googleAuthService.refreshToken('token-for-inactive-user')
      ).rejects.toThrow('User not found or inactive');
    });
  });

  describe('validateSession', () => {
    it('should validate active session successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        is_active: true,
      };

      (db.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });
      (redis.exists as jest.Mock).mockResolvedValue(1);

      const result = await googleAuthService.validateSession('1');

      expect(result.valid).toBe(true);
      expect(result.user).toEqual(expect.objectContaining({ id: '1' }));
    });

    it('should return invalid for non-existent user', async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await googleAuthService.validateSession('999');

      expect(result.valid).toBe(false);
      expect(result.user).toBeUndefined();
    });

    it('should return invalid when refresh token missing', async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [{ id: '1' }] });
      (redis.exists as jest.Mock).mockResolvedValue(0);

      const result = await googleAuthService.validateSession('1');

      expect(result.valid).toBe(false);
    });
  });

  describe('revokeAllTokens', () => {
    it('should revoke all tokens successfully', async () => {
      (redis.del as jest.Mock).mockResolvedValue(1);
      (db.query as jest.Mock).mockResolvedValue({ rows: [] });

      await googleAuthService.revokeAllTokens('1');

      expect(redis.del).toHaveBeenCalledWith('refresh_token:1');
    });

    it('should handle Redis errors', async () => {
      (redis.del as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(
        googleAuthService.revokeAllTokens('1')
      ).rejects.toThrow('Failed to revoke tokens');
    });
  });
});