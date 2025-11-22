import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TwoFactorAuthService } from '../../services/TwoFactorAuthService';
import { User } from '../../models/User';
import { redis } from '../../services/redis';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Mock dependencies
jest.mock('../../services/redis');
jest.mock('../../models/User');
jest.mock('speakeasy');
jest.mock('qrcode');
jest.mock('../../utils/cryptoSecurity', () => ({
  __esModule: true,
  default: {
    generateSecureBackupCodes: jest.fn((count: number = 10, codeLength: number = 8) => {
      const codes: string[] = [];
      for (let i = 0; i < count; i++) {
        codes.push('A'.repeat(codeLength));
      }
      return codes;
    }),
    encryptSensitiveData: jest.fn((data: string) => `encrypted_${data}`),
    decryptSensitiveData: jest.fn((data: string) => data.replace('encrypted_', '')),
    timingSafeStringCompare: jest.fn((a: string, b: string) => a === b),
    validateDeviceInfo: jest.fn((info: any) => ({ isValid: true, sanitized: info })),
    generateSecureDeviceFingerprint: jest.fn(() => 'mock-fingerprint'),
    generateSecureCode: jest.fn((length: number) => '123456'),
  }
}));

const mockRedis = redis as jest.Mocked<typeof redis>;
const mockUser = User as jest.Mocked<typeof User>;
const mockSpeakeasy = speakeasy as jest.Mocked<typeof speakeasy>;
const mockQRCode = QRCode as jest.Mocked<typeof QRCode>;

describe('TwoFactorAuthService', () => {
  let twoFactorService: TwoFactorAuthService;
  const testUserId = 'test-user-123';
  const testEmail = 'test@upcoach.ai';
  const testSecret = 'JBSWY3DPEHPK3PXP';
  const testToken = '123456';

  beforeEach(() => {
    twoFactorService = new TwoFactorAuthService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('generateSecret', () => {
    it('should generate a new 2FA secret successfully', async () => {
      // Mock user
      const mockUserInstance: any = {
        id: testUserId,
        email: testEmail,
        name: 'Test User',
        update: jest.fn()
      };
      mockUserInstance.update.mockResolvedValue(mockUserInstance);
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      // Mock speakeasy secret generation
      mockSpeakeasy.generateSecret = jest.fn().mockReturnValue({
        ascii: testSecret,
        hex: 'hex-secret',
        base32: testSecret,
        otpauth_url: `otpauth://totp/UpCoach:${testEmail}?secret=${testSecret}&issuer=UpCoach`
      });

      // Mock QR code generation
      mockQRCode.toDataURL = jest.fn().mockResolvedValue('data:image/png;base64,mockqrcode');

      // Mock Redis setEx for the generateTOTPSecret internal call
      mockRedis.setEx = jest.fn().mockResolvedValue('OK');

      const result = await twoFactorService.generateSecret(testUserId);

      expect(result).toHaveProperty('secret', testSecret);
      expect(result).toHaveProperty('qrCode', 'data:image/png;base64,mockqrcode');
      expect(result).toHaveProperty('backupCodes');
      expect(result.backupCodes).toHaveLength(10);
      expect(mockUserInstance.update).toHaveBeenCalledWith({
        twoFactorSecret: testSecret,
        twoFactorBackupCodes: expect.any(Array)
      });
    });

    it('should throw error if user not found', async () => {
      mockUser.findByPk = jest.fn().mockResolvedValue(null);

      await expect(twoFactorService.generateSecret('invalid-user'))
        .rejects.toThrow('User not found');
    });

    it('should handle QR code generation failure', async () => {
      const mockUserInstance: any = {
        id: testUserId,
        email: testEmail,
        name: 'Test User',
        update: jest.fn()
      };
      mockUserInstance.update.mockResolvedValue(mockUserInstance);
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      mockSpeakeasy.generateSecret = jest.fn().mockReturnValue({
        ascii: testSecret,
        base32: testSecret,
        otpauth_url: `otpauth://totp/UpCoach:${testEmail}?secret=${testSecret}&issuer=UpCoach`
      });

      mockQRCode.toDataURL = jest.fn().mockRejectedValue(new Error('QR generation failed'));

      // Mock Redis setEx
      mockRedis.setEx = jest.fn().mockResolvedValue('OK');

      await expect(twoFactorService.generateSecret(testUserId))
        .rejects.toThrow('Failed to save 2FA secret');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid TOTP token', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorSecret: testSecret,
        twoFactorEnabled: true
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      mockSpeakeasy.totp.verify = jest.fn().mockReturnValue(true);
      mockRedis.setex = jest.fn().mockResolvedValue('OK');

      const result = await twoFactorService.verifyToken(testUserId, testToken);

      expect(result).toBe(true);
      expect(mockSpeakeasy.totp.verify).toHaveBeenCalledWith({
        secret: testSecret,
        encoding: 'base32',
        token: testToken,
        window: 2
      });
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `used_token:${testUserId}:${testToken}`,
        300,
        'used'
      );
    });

    it('should verify valid backup code', async () => {
      const backupCode = 'backup-123456';
      const mockUserInstance = {
        id: testUserId,
        twoFactorSecret: testSecret,
        twoFactorEnabled: true,
        twoFactorBackupCodes: ['backup-123456', 'backup-789012'],
        update: jest.fn().mockResolvedValue(true)
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      mockSpeakeasy.totp.verify = jest.fn().mockReturnValue(false);

      const result = await twoFactorService.verifyToken(testUserId, backupCode);

      expect(result).toBe(true);
      expect(mockUserInstance.update).toHaveBeenCalledWith({
        twoFactorBackupCodes: ['backup-789012']
      });
    });

    it('should reject invalid token', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorSecret: testSecret,
        twoFactorEnabled: true,
        twoFactorBackupCodes: []
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      mockSpeakeasy.totp.verify = jest.fn().mockReturnValue(false);

      const result = await twoFactorService.verifyToken(testUserId, 'invalid-token');

      expect(result).toBe(false);
    });

    it('should reject already used token', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorSecret: testSecret,
        twoFactorEnabled: true
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);
      mockRedis.get = jest.fn().mockResolvedValue('used');

      const result = await twoFactorService.verifyToken(testUserId, testToken);

      expect(result).toBe(false);
      expect(mockSpeakeasy.totp.verify).not.toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      mockUser.findByPk = jest.fn().mockResolvedValue(null);

      await expect(twoFactorService.verifyToken('invalid-user', testToken))
        .rejects.toThrow('User not found');
    });

    it('should throw error if 2FA not enabled', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorEnabled: false
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      await expect(twoFactorService.verifyToken(testUserId, testToken))
        .rejects.toThrow('2FA not enabled for this user');
    });
  });

  describe('enableTwoFactor', () => {
    it('should enable 2FA with valid token', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorSecret: testSecret,
        twoFactorEnabled: false,
        update: jest.fn().mockResolvedValue(true)
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      mockSpeakeasy.totp.verify = jest.fn().mockReturnValue(true);
      mockRedis.setex = jest.fn().mockResolvedValue('OK');

      const result = await twoFactorService.enableTwoFactor(testUserId, testToken);

      expect(result).toBe(true);
      expect(mockUserInstance.update).toHaveBeenCalledWith({
        twoFactorEnabled: true
      });
    });

    it('should reject invalid verification token', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorSecret: testSecret,
        twoFactorEnabled: false
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      mockSpeakeasy.totp.verify = jest.fn().mockReturnValue(false);

      const result = await twoFactorService.enableTwoFactor(testUserId, 'invalid-token');

      expect(result).toBe(false);
    });

    it('should throw error if 2FA already enabled', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorEnabled: true
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      await expect(twoFactorService.enableTwoFactor(testUserId, testToken))
        .rejects.toThrow('2FA is already enabled');
    });
  });

  describe('disableTwoFactor', () => {
    it('should disable 2FA with valid token', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorSecret: testSecret,
        twoFactorEnabled: true,
        update: jest.fn().mockResolvedValue(true)
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      mockSpeakeasy.totp.verify = jest.fn().mockReturnValue(true);

      const result = await twoFactorService.disableTwoFactor(testUserId, testToken);

      expect(result).toBe(true);
      expect(mockUserInstance.update).toHaveBeenCalledWith({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null
      });
    });

    it('should reject invalid verification token', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorSecret: testSecret,
        twoFactorEnabled: true
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      mockSpeakeasy.totp.verify = jest.fn().mockReturnValue(false);

      const result = await twoFactorService.disableTwoFactor(testUserId, 'invalid-token');

      expect(result).toBe(false);
    });

    it('should throw error if 2FA not enabled', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorEnabled: false
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      await expect(twoFactorService.disableTwoFactor(testUserId, testToken))
        .rejects.toThrow('2FA is not enabled');
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate new backup codes', async () => {
      const mockUserInstance: any = {
        id: testUserId,
        twoFactorEnabled: true,
        update: jest.fn()
      };
      mockUserInstance.update.mockResolvedValue(mockUserInstance);
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      const result = await twoFactorService.generateBackupCodes(testUserId);

      expect(result).toHaveLength(10);
      expect(result.every(code => typeof code === 'string' && code.length === 8)).toBe(true);
      expect(mockUserInstance.update).toHaveBeenCalledWith({
        twoFactorBackupCodes: result
      });
    });

    it('should throw error if 2FA not enabled', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorEnabled: false
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      await expect(twoFactorService.generateBackupCodes(testUserId))
        .rejects.toThrow('2FA is not enabled');
    });
  });

  describe('getTwoFactorStatus', () => {
    it('should return 2FA status for enabled user', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorEnabled: true,
        twoFactorBackupCodes: ['code1', 'code2', 'code3']
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      const result = await twoFactorService.getTwoFactorStatus(testUserId);

      expect(result).toEqual({
        enabled: true,
        backupCodesCount: 3
      });
    });

    it('should return 2FA status for disabled user', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorEnabled: false,
        twoFactorBackupCodes: null
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);

      const result = await twoFactorService.getTwoFactorStatus(testUserId);

      expect(result).toEqual({
        enabled: false,
        backupCodesCount: 0
      });
    });

    it('should throw error if user not found', async () => {
      mockUser.findByPk = jest.fn().mockResolvedValue(null);

      await expect(twoFactorService.getTwoFactorStatus('invalid-user'))
        .rejects.toThrow('User not found');
    });
  });

  describe('Error handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorSecret: testSecret,
        twoFactorEnabled: true
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);
      mockSpeakeasy.totp.verify = jest.fn().mockReturnValue(true);
      mockRedis.setex = jest.fn().mockRejectedValue(new Error('Redis connection failed'));

      // Should still verify but log error
      const result = await twoFactorService.verifyToken(testUserId, testToken);
      expect(result).toBe(true);
    });

    it('should handle database errors during secret generation', async () => {
      const mockUserInstance = {
        id: testUserId,
        email: testEmail,
        name: 'Test User',
        update: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);
      mockSpeakeasy.generateSecret = jest.fn().mockReturnValue({
        ascii: testSecret,
        base32: testSecret,
        otpauth_url: `otpauth://totp/UpCoach:${testEmail}?secret=${testSecret}&issuer=UpCoach`
      });
      mockQRCode.toDataURL = jest.fn().mockResolvedValue('data:image/png;base64,mockqrcode');

      await expect(twoFactorService.generateSecret(testUserId))
        .rejects.toThrow('Failed to save 2FA secret');
    });
  });

  describe('Security features', () => {
    it('should prevent token reuse', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorSecret: testSecret,
        twoFactorEnabled: true
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);
      mockSpeakeasy.totp.verify = jest.fn().mockReturnValue(true);
      mockRedis.get = jest.fn()
        .mockResolvedValueOnce(null)  // First call - token not used
        .mockResolvedValueOnce('used'); // Second call - token already used
      mockRedis.setex = jest.fn().mockResolvedValue('OK');

      // First verification should succeed
      const firstResult = await twoFactorService.verifyToken(testUserId, testToken);
      expect(firstResult).toBe(true);

      // Second verification with same token should fail
      const secondResult = await twoFactorService.verifyToken(testUserId, testToken);
      expect(secondResult).toBe(false);
    });

    it('should have rate limiting for verification attempts', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorSecret: testSecret,
        twoFactorEnabled: true
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);
      mockSpeakeasy.totp.verify = jest.fn().mockReturnValue(false);

      // Mock rate limiting
      mockRedis.incr = jest.fn().mockResolvedValue(6); // Exceed limit
      mockRedis.expire = jest.fn().mockResolvedValue(1);

      await expect(twoFactorService.verifyToken(testUserId, 'wrong-token'))
        .rejects.toThrow('Too many failed attempts');
    });

    it('should validate backup code format', async () => {
      const mockUserInstance = {
        id: testUserId,
        twoFactorSecret: testSecret,
        twoFactorEnabled: true,
        twoFactorBackupCodes: ['backup-123456']
      };
      mockUser.findByPk = jest.fn().mockResolvedValue(mockUserInstance);
      mockSpeakeasy.totp.verify = jest.fn().mockReturnValue(false);

      // Invalid backup code format
      const result = await twoFactorService.verifyToken(testUserId, 'invalid-format');
      expect(result).toBe(false);
    });
  });
});
