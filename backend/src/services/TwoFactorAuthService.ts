/**
 * Two-Factor Authentication Service
 * Implements TOTP (Time-based One-Time Password) and WebAuthn support
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { redis } from './redis';

export interface TOTPSecret {
  ascii: string;
  hex: string;
  base32: string;
  qr_code_ascii?: string;
  qr_code_hex?: string;
  qr_code_base32?: string;
  google_auth_qr?: string;
  otpauth_url?: string;
}

export interface BackupCodes {
  codes: string[];
  generatedAt: Date;
  usedCodes: string[];
}

export interface TwoFactorConfig {
  userId: string;
  method: 'totp' | 'webauthn' | 'sms' | 'email';
  enabled: boolean;
  secret?: string;
  backupCodes?: string[];
  verifiedAt?: Date;
  lastUsedAt?: Date;
  trustedDevices?: TrustedDevice[];
}

export interface TrustedDevice {
  id: string;
  name: string;
  fingerprint: string;
  addedAt: Date;
  lastUsedAt: Date;
  userAgent: string;
  ipAddress: string;
}

export interface WebAuthnCredential {
  id: string;
  userId: string;
  credentialId: string;
  credentialPublicKey: string;
  counter: number;
  deviceType: string;
  backedUp: boolean;
  transports?: string[];
  createdAt: Date;
  lastUsedAt?: Date;
  name?: string;
}

class TwoFactorAuthService {
  private static instance: TwoFactorAuthService;
  private readonly issuer = process.env.APP_NAME || 'UpCoach';
  private readonly backupCodeCount = 10;
  private readonly backupCodeLength = 8;
  private readonly totpWindow = 2; // Allow 2 time windows for clock drift

  private constructor() {}

  static getInstance(): TwoFactorAuthService {
    if (!TwoFactorAuthService.instance) {
      TwoFactorAuthService.instance = new TwoFactorAuthService();
    }
    return TwoFactorAuthService.instance;
  }

  /**
   * Generate TOTP secret for user
   */
  async generateTOTPSecret(
    userId: string,
    email: string
  ): Promise<{
    secret: TOTPSecret;
    qrCode: string;
    backupCodes: string[];
  }> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        length: 32,
        name: `${this.issuer} (${email})`,
        issuer: this.issuer,
      });

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Store temporarily in Redis (expires in 10 minutes)
      const tempKey = `2fa:setup:${userId}`;
      await redis.setEx(
        tempKey,
        600, // 10 minutes
        JSON.stringify({
          secret: secret.base32,
          backupCodes,
          timestamp: Date.now(),
        })
      );

      logger.info('Generated TOTP secret for user', { userId });

      return {
        secret,
        qrCode,
        backupCodes,
      };
    } catch (error) {
      logger.error('Error generating TOTP secret', error);
      throw new Error('Failed to generate 2FA secret');
    }
  }

  /**
   * Verify TOTP token and enable 2FA
   */
  async verifyAndEnableTOTP(
    userId: string,
    token: string
  ): Promise<{ success: boolean; backupCodes?: string[] }> {
    try {
      // Get temporary secret from Redis
      const tempKey = `2fa:setup:${userId}`;
      const tempData = await redis.get(tempKey);

      if (!tempData) {
        throw new Error('2FA setup session expired. Please start again.');
      }

      const { secret, backupCodes } = JSON.parse(tempData);

      // Verify token
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: this.totpWindow,
      });

      if (!verified) {
        return { success: false };
      }

      // Store permanent 2FA configuration
      const configKey = `2fa:config:${userId}`;
      const config: TwoFactorConfig = {
        userId,
        method: 'totp',
        enabled: true,
        secret,
        backupCodes,
        verifiedAt: new Date(),
      };

      await redis.set(configKey, JSON.stringify(config));

      // Clean up temporary data
      await redis.del(tempKey);

      logger.info('2FA enabled for user', { userId });

      return {
        success: true,
        backupCodes,
      };
    } catch (error) {
      logger.error('Error verifying TOTP', error);
      throw error;
    }
  }

  /**
   * Verify TOTP token for authentication
   */
  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    try {
      // Get user's 2FA configuration
      const config = await this.get2FAConfig(userId);

      if (!config || !config.enabled || config.method !== 'totp') {
        return false;
      }

      // Check if it's a backup code
      if (config.backupCodes?.includes(token)) {
        return await this.useBackupCode(userId, token);
      }

      // Verify TOTP token
      const verified = speakeasy.totp.verify({
        secret: config.secret!,
        encoding: 'base32',
        token,
        window: this.totpWindow,
      });

      if (verified) {
        // Update last used timestamp
        config.lastUsedAt = new Date();
        await this.update2FAConfig(userId, config);

        logger.info('TOTP verification successful', { userId });
      }

      return verified;
    } catch (error) {
      logger.error('Error verifying TOTP', error);
      return false;
    }
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId: string): Promise<void> {
    try {
      const configKey = `2fa:config:${userId}`;
      await redis.del(configKey);

      // Clear trusted devices
      const trustedDevicesKey = `2fa:trusted:${userId}`;
      await redis.del(trustedDevicesKey);

      logger.info('2FA disabled for user', { userId });
    } catch (error) {
      logger.error('Error disabling 2FA', error);
      throw new Error('Failed to disable 2FA');
    }
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(count: number = this.backupCodeCount): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      const code = crypto
        .randomBytes(this.backupCodeLength)
        .toString('hex')
        .substring(0, this.backupCodeLength)
        .toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      const config = await this.get2FAConfig(userId);

      if (!config || !config.enabled) {
        throw new Error('2FA is not enabled');
      }

      const newCodes = this.generateBackupCodes();
      config.backupCodes = newCodes;

      await this.update2FAConfig(userId, config);

      logger.info('Regenerated backup codes for user', { userId });

      return newCodes;
    } catch (error) {
      logger.error('Error regenerating backup codes', error);
      throw error;
    }
  }

  /**
   * Use a backup code
   */
  private async useBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const config = await this.get2FAConfig(userId);

      if (!config || !config.backupCodes) {
        return false;
      }

      const codeIndex = config.backupCodes.indexOf(code);
      if (codeIndex === -1) {
        return false;
      }

      // Remove used backup code
      config.backupCodes.splice(codeIndex, 1);
      config.lastUsedAt = new Date();

      await this.update2FAConfig(userId, config);

      logger.info('Backup code used', { userId, remainingCodes: config.backupCodes.length });

      // Notify user if running low on backup codes
      if (config.backupCodes.length <= 2) {
        // TODO: Send notification to user
        logger.warn('User running low on backup codes', {
          userId,
          remaining: config.backupCodes.length,
        });
      }

      return true;
    } catch (error) {
      logger.error('Error using backup code', error);
      return false;
    }
  }

  /**
   * Add trusted device
   */
  async addTrustedDevice(
    userId: string,
    deviceInfo: {
      name: string;
      fingerprint: string;
      userAgent: string;
      ipAddress: string;
    }
  ): Promise<TrustedDevice> {
    try {
      const device: TrustedDevice = {
        id: crypto.randomBytes(16).toString('hex'),
        name: deviceInfo.name,
        fingerprint: deviceInfo.fingerprint,
        addedAt: new Date(),
        lastUsedAt: new Date(),
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
      };

      const trustedDevicesKey = `2fa:trusted:${userId}`;
      const existingDevices = await this.getTrustedDevices(userId);
      existingDevices.push(device);

      await redis.set(trustedDevicesKey, JSON.stringify(existingDevices));

      logger.info('Added trusted device', { userId, deviceId: device.id });

      return device;
    } catch (error) {
      logger.error('Error adding trusted device', error);
      throw new Error('Failed to add trusted device');
    }
  }

  /**
   * Check if device is trusted
   */
  async isDeviceTrusted(userId: string, fingerprint: string): Promise<boolean> {
    try {
      const devices = await this.getTrustedDevices(userId);
      const device = devices.find(d => d.fingerprint === fingerprint);

      if (device) {
        // Update last used timestamp
        device.lastUsedAt = new Date();
        const trustedDevicesKey = `2fa:trusted:${userId}`;
        await redis.set(trustedDevicesKey, JSON.stringify(devices));

        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error checking trusted device', error);
      return false;
    }
  }

  /**
   * Remove trusted device
   */
  async removeTrustedDevice(userId: string, deviceId: string): Promise<void> {
    try {
      const devices = await this.getTrustedDevices(userId);
      const filteredDevices = devices.filter(d => d.id !== deviceId);

      const trustedDevicesKey = `2fa:trusted:${userId}`;
      await redis.set(trustedDevicesKey, JSON.stringify(filteredDevices));

      logger.info('Removed trusted device', { userId, deviceId });
    } catch (error) {
      logger.error('Error removing trusted device', error);
      throw new Error('Failed to remove trusted device');
    }
  }

  /**
   * Get trusted devices
   */
  async getTrustedDevices(userId: string): Promise<TrustedDevice[]> {
    try {
      const trustedDevicesKey = `2fa:trusted:${userId}`;
      const data = await redis.get(trustedDevicesKey);

      if (!data) {
        return [];
      }

      return JSON.parse(data);
    } catch (error) {
      logger.error('Error getting trusted devices', error);
      return [];
    }
  }

  /**
   * Get 2FA configuration
   */
  async get2FAConfig(userId: string): Promise<TwoFactorConfig | null> {
    try {
      const configKey = `2fa:config:${userId}`;
      const data = await redis.get(configKey);

      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      logger.error('Error getting 2FA config', error);
      return null;
    }
  }

  /**
   * Update 2FA configuration
   */
  private async update2FAConfig(userId: string, config: TwoFactorConfig): Promise<void> {
    const configKey = `2fa:config:${userId}`;
    await redis.set(configKey, JSON.stringify(config));
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    const config = await this.get2FAConfig(userId);
    return config?.enabled || false;
  }

  /**
   * Get 2FA method for user
   */
  async get2FAMethod(userId: string): Promise<string | null> {
    const config = await this.get2FAConfig(userId);
    return config?.method || null;
  }

  /**
   * Generate device fingerprint
   */
  generateDeviceFingerprint(userAgent: string, ipAddress: string, additionalData?: string): string {
    const data = `${userAgent}:${ipAddress}:${additionalData || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Rate limit 2FA attempts
   */
  async check2FARateLimit(userId: string): Promise<boolean> {
    const key = `2fa:ratelimit:${userId}`;
    const attempts = await redis.get(key);

    if (!attempts) {
      await redis.setEx(key, 300, '1'); // 5 minutes window
      return true;
    }

    const count = parseInt(attempts);
    if (count >= 5) {
      logger.warn('2FA rate limit exceeded', { userId });
      return false;
    }

    await redis.incr(key);
    return true;
  }

  /**
   * Clear 2FA rate limit
   */
  async clear2FARateLimit(userId: string): Promise<void> {
    const key = `2fa:ratelimit:${userId}`;
    await redis.del(key);
  }
}

// Export singleton instance
export const twoFactorAuthService = TwoFactorAuthService.getInstance();
