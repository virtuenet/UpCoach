import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GoogleAuthService } from '../../../services/auth/GoogleAuthService';
import { ApiError } from '../../../utils/apiError';

// Mock Google Auth Library
jest.mock('google-auth-library');

describe('GoogleAuthService', () => {
  let googleAuthService: GoogleAuthService;
  let mockOAuth2Client: any;

  beforeEach(() => {
    // Reset environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    
    // Clear singleton instance
    (GoogleAuthService as any).instance = null;
    
    mockOAuth2Client = {
      verifyIdToken: jest.fn(),
    };
    
    // Mock OAuth2Client constructor
    const { OAuth2Client } = require('google-auth-library');
    (OAuth2Client as jest.Mock).mockImplementation(() => mockOAuth2Client);
    
    googleAuthService = GoogleAuthService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  describe('Constructor validation', () => {
    it('should throw error when GOOGLE_CLIENT_ID is missing', () => {
      delete process.env.GOOGLE_CLIENT_ID;
      (GoogleAuthService as any).instance = null;
      
      expect(() => GoogleAuthService.getInstance()).toThrow(
        'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required'
      );
    });

    it('should throw error when GOOGLE_CLIENT_SECRET is missing', () => {
      delete process.env.GOOGLE_CLIENT_SECRET;
      (GoogleAuthService as any).instance = null;
      
      expect(() => GoogleAuthService.getInstance()).toThrow(
        'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required'
      );
    });

    it('should create instance when all environment variables are present', () => {
      expect(googleAuthService).toBeInstanceOf(GoogleAuthService);
    });
  });

  describe('verifyIdToken', () => {
    const validTokenPayload = {
      sub: 'google-user-id-123',
      email: 'test@example.com',
      name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      picture: 'https://example.com/photo.jpg',
      email_verified: true,
    };

    it('should successfully verify valid ID token', async () => {
      const mockTicket = {
        getPayload: () => validTokenPayload,
      };
      mockOAuth2Client.verifyIdToken.mockResolvedValue(mockTicket);

      const result = await googleAuthService.verifyIdToken('valid-token');

      expect(result).toEqual({
        sub: 'google-user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/photo.jpg',
        email_verified: true,
      });

      expect(mockOAuth2Client.verifyIdToken).toHaveBeenCalledWith({
        idToken: 'valid-token',
        audience: 'test-client-id',
      });
    });

    it('should throw error when token has no payload', async () => {
      const mockTicket = { getPayload: () => null };
      mockOAuth2Client.verifyIdToken.mockResolvedValue(mockTicket);

      await expect(
        googleAuthService.verifyIdToken('invalid-token')
      ).rejects.toThrow('Authentication failed');
    });

    it('should throw error when email is not verified', async () => {
      const mockTicket = {
        getPayload: () => ({ ...validTokenPayload, email_verified: false }),
      };
      mockOAuth2Client.verifyIdToken.mockResolvedValue(mockTicket);

      await expect(
        googleAuthService.verifyIdToken('unverified-email-token')
      ).rejects.toThrow('Authentication failed');
    });

    it('should handle token expiry error gracefully', async () => {
      const expiredError = new Error('Token used too late');
      mockOAuth2Client.verifyIdToken.mockRejectedValue(expiredError);

      await expect(
        googleAuthService.verifyIdToken('expired-token')
      ).rejects.toThrow('Authentication failed');
    });

    it('should handle invalid signature error gracefully', async () => {
      const signatureError = new Error('Invalid token signature');
      mockOAuth2Client.verifyIdToken.mockRejectedValue(signatureError);

      await expect(
        googleAuthService.verifyIdToken('invalid-signature-token')
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('verifyAccessToken', () => {
    const validUserData = {
      id: 'google-user-id-123',
      email: 'test@example.com',
      name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      picture: 'https://example.com/photo.jpg',
      verified_email: true,
    };

    beforeEach(() => {
      // Mock fetch globally
      global.fetch = jest.fn() as any;
    });

    afterEach(() => {
      (global.fetch as jest.Mock).mockRestore();
    });

    it('should successfully verify valid access token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(validUserData),
      } as any);

      const result = await googleAuthService.verifyAccessToken('valid-access-token');

      expect(result).toEqual({
        sub: 'google-user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/photo.jpg',
        email_verified: true,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v2/userinfo?access_token=valid-access-token'
      );
    });

    it('should throw error for invalid access token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      } as any);

      await expect(
        googleAuthService.verifyAccessToken('invalid-access-token')
      ).rejects.toThrow('Authentication failed');
    });

    it('should throw error when email is not verified', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ...validUserData, verified_email: false }),
      } as any);

      await expect(
        googleAuthService.verifyAccessToken('unverified-email-token')
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('getUserInfo', () => {
    it('should prioritize ID token over access token', async () => {
      const mockTicket = {
        getPayload: () => ({
          sub: 'id-token-user',
          email: 'idtoken@example.com',
          name: 'ID Token User',
          email_verified: true,
        }),
      };
      mockOAuth2Client.verifyIdToken.mockResolvedValue(mockTicket);

      const result = await googleAuthService.getUserInfo({
        idToken: 'id-token',
        accessToken: 'access-token',
      });

      expect(result.sub).toBe('id-token-user');
      expect(mockOAuth2Client.verifyIdToken).toHaveBeenCalled();
    });

    it('should use access token when ID token is not provided', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'access-token-user',
          email: 'accesstoken@example.com',
          name: 'Access Token User',
          verified_email: true,
        }),
      }) as any;

      const result = await googleAuthService.getUserInfo({
        idToken: 'mock-id-token',
        accessToken: 'access-token',
      });

      expect(result.sub).toBe('access-token-user');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should throw error when neither token is provided', async () => {
      await expect(
        googleAuthService.getUserInfo({ idToken: '' })
      ).rejects.toThrow('Either ID token or access token must be provided');
    });
  });

  describe('OAuth state utilities', () => {
    it('should validate correct OAuth state', () => {
      const state = 'test-state-123';
      const isValid = googleAuthService.validateOAuthState(state, state);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect OAuth state', () => {
      const isValid = googleAuthService.validateOAuthState('state1', 'state2');
      expect(isValid).toBe(false);
    });

    it('should generate OAuth state with sufficient entropy', () => {
      const state1 = googleAuthService.generateOAuthState();
      const state2 = googleAuthService.generateOAuthState();
      
      expect(state1).not.toBe(state2);
      expect(state1.length).toBeGreaterThan(20);
      expect(state2.length).toBeGreaterThan(20);
    });
  });
});