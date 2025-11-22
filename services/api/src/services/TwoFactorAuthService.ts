/**
 * Two-Factor Authentication Service
 * Implements TOTP (Time-based One-Time Password) and WebAuthn support
 */

import crypto from 'crypto';

import * as QRCode from 'qrcode';
import * as speakeasy from 'speakeasy';

import { logger } from '../utils/logger';
import CryptoSecurity from '../utils/cryptoSecurity';

import { redis } from './redis';
import { NotificationService } from './NotificationService';
import emailService from './email/UnifiedEmailService';

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

export class TwoFactorAuthService {
  private static instance: TwoFactorAuthService;
  private readonly issuer = process.env.APP_NAME || 'UpCoach';
  private readonly backupCodeCount = 10;
  private readonly backupCodeLength = 8;
  private readonly totpWindow = 2; // Allow 2 time windows for clock drift
  private notificationService = NotificationService.getInstance();

  constructor() {}

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
      const backupCodes = this.generateBackupCodesHelper();

      // Store temporarily in Redis (expires in 10 minutes) - ENCRYPTED
      const tempKey = `2fa:setup:${userId}`;
      const tempData = {
        secret: secret.base32,
        backupCodes,
        timestamp: Date.now(),
      };
      
      // Encrypt sensitive temporary data
      const encryptedTempData = CryptoSecurity.encryptSensitiveData(JSON.stringify(tempData));
      await redis.setEx(tempKey, 600, encryptedTempData); // 10 minutes

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
      // Get temporary secret from Redis and decrypt
      const tempKey = `2fa:setup:${userId}`;
      const encryptedTempData = await redis.get(tempKey);

      if (!encryptedTempData) {
        throw new Error('2FA setup session expired. Please start again.');
      }

      // Decrypt temporary data
      const decryptedTempData = CryptoSecurity.decryptSensitiveData(encryptedTempData);
      const { secret, backupCodes } = JSON.parse(decryptedTempData);

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

      // Store permanent 2FA configuration - ENCRYPTED
      const configKey = `2fa:config:${userId}`;
      const config: TwoFactorConfig = {
        userId,
        method: 'totp',
        enabled: true,
        secret, // This will be encrypted before storage
        backupCodes, // These will be encrypted before storage
        verifiedAt: new Date(),
      };

      // Encrypt sensitive configuration data
      const encryptedConfig = CryptoSecurity.encryptSensitiveData(JSON.stringify(config));
      await redis.set(configKey, encryptedConfig);

      // Clean up temporary data
      await redis.del(tempKey);

      // Send security notification
      await this.notificationService.showSuccess(
        userId.toString(),
        'Two-Factor Authentication has been enabled on your account for enhanced security.'
      );

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
   * Verify 2FA token for authentication (supports TOTP, SMS, and Email)
   */
  async verify2FA(userId: string, token: string): Promise<boolean> {
    try {
      // Get user's 2FA configuration
      const config = await this.get2FAConfig(userId);

      if (!config || !config.enabled) {
        return false;
      }

      let verified = false;

      switch (config.method) {
        case 'totp':
          verified = await this.verifyTOTPToken(userId, token, config);
          break;
        case 'sms':
          verified = await this.verifySMSCode(userId, token);
          break;
        case 'email':
          verified = await this.verifyEmailCode(userId, token);
          break;
        default:
          logger.warn('Unknown 2FA method', { userId, method: config.method });
          return false;
      }

      if (verified) {
        // Update last used timestamp and clear failed attempts
        config.lastUsedAt = new Date();
        await this.update2FAConfig(userId, config);
        await this.clearFailedAttempts(userId);

        logger.info('2FA verification successful', { userId, method: config.method });
      } else {
        // Track failed attempts
        await this.trackFailedAttempt(userId);
      }

      return verified;
    } catch (error) {
      logger.error('Error verifying 2FA', error);
      return false;
    }
  }

  /**
   * Legacy TOTP verification method (for backward compatibility)
   */
  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    return this.verify2FA(userId, token);
  }

  /**
   * Verify TOTP token specifically
   */
  private async verifyTOTPToken(userId: string, token: string, config: TwoFactorConfig): Promise<boolean> {
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

    return verified;
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

      // Send security notification
      await this.notificationService.showWarning(
        userId.toString(),
        'Two-Factor Authentication has been disabled on your account. Your account security may be reduced.',
        [
          {
            label: 'Re-enable 2FA',
            action: 'enable-2fa',
            primary: true,
            icon: 'shield',
          },
        ]
      );

      logger.info('2FA disabled for user', { userId });
    } catch (error) {
      logger.error('Error disabling 2FA', error);
      throw new Error('Failed to disable 2FA');
    }
  }

  /**
   * Generate backup codes - CRYPTOGRAPHICALLY SECURE
   * Private helper method
   */
  private generateBackupCodesHelper(count: number = this.backupCodeCount): string[] {
    // Use the secure backup code generation from CryptoSecurity
    return CryptoSecurity.generateSecureBackupCodes(count, this.backupCodeLength);
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

      const newCodes = this.generateBackupCodesHelper();
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
        await this.notificationService.showWarning(
          userId.toString(),
          `You have ${config.backupCodes.length} backup codes remaining. Generate new backup codes to maintain account security.`,
          [
            {
              label: 'Generate New Codes',
              action: 'generate-backup-codes',
              primary: true,
              icon: 'refresh',
            },
          ]
        );
        
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
      // Validate and sanitize device information - SECURITY ENHANCEMENT
      const validation = CryptoSecurity.validateDeviceInfo(deviceInfo);
      if (!validation.isValid) {
        throw new Error(`Invalid device information: ${validation.errors?.join(', ')}`);
      }
      
      const sanitizedDeviceInfo = validation.sanitized!;
      
      const device: TrustedDevice = {
        id: crypto.randomBytes(16).toString('hex'),
        name: sanitizedDeviceInfo.name,
        fingerprint: sanitizedDeviceInfo.fingerprint,
        addedAt: new Date(),
        lastUsedAt: new Date(),
        userAgent: sanitizedDeviceInfo.userAgent,
        ipAddress: sanitizedDeviceInfo.ipAddress,
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
   * Get 2FA configuration - DECRYPT
   */
  async get2FAConfig(userId: string): Promise<TwoFactorConfig | null> {
    try {
      const configKey = `2fa:config:${userId}`;
      const encryptedData = await redis.get(configKey);

      if (!encryptedData) {
        return null;
      }

      // Decrypt configuration data
      const decryptedData = CryptoSecurity.decryptSensitiveData(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      logger.error('Error getting 2FA config', error);
      return null;
    }
  }

  /**
   * Update 2FA configuration - ENCRYPTED
   */
  private async update2FAConfig(userId: string, config: TwoFactorConfig): Promise<void> {
    const configKey = `2fa:config:${userId}`;
    const encryptedConfig = CryptoSecurity.encryptSensitiveData(JSON.stringify(config));
    await redis.set(configKey, encryptedConfig);
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
   * Generate device fingerprint - CRYPTOGRAPHICALLY SECURE
   */
  generateDeviceFingerprint(userAgent: string, ipAddress: string, additionalData?: string): string {
    return CryptoSecurity.generateSecureDeviceFingerprint(userAgent, ipAddress, additionalData);
  }

  /**
   * Rate limit 2FA attempts - ENHANCED PROGRESSIVE DELAYS
   */
  async check2FARateLimit(userId: string): Promise<{ allowed: boolean; delaySeconds?: number }> {
    const key = `2fa:ratelimit:${userId}`;
    const attempts = await redis.get(key);

    if (!attempts) {
      await redis.setEx(key, 300, '1'); // 5 minutes window
      return { allowed: true };
    }

    const count = parseInt(attempts);
    
    // Progressive delay implementation
    let delaySeconds = 0;
    let allowed = true;
    
    if (count >= 3 && count < 5) {
      delaySeconds = Math.pow(2, count - 2) * 30; // 30s, 60s, 120s
    } else if (count >= 5 && count < 10) {
      delaySeconds = 300; // 5 minutes
      allowed = false;
    } else if (count >= 10) {
      delaySeconds = 1800; // 30 minutes
      allowed = false;
    }

    if (allowed) {
      await redis.incr(key);
    }

    if (!allowed) {
      logger.warn('2FA rate limit exceeded', { userId, attempts: count, delaySeconds });
    }

    return { allowed, delaySeconds };
  }

  /**
   * Clear 2FA rate limit
   */
  async clear2FARateLimit(userId: string): Promise<void> {
    const key = `2fa:ratelimit:${userId}`;
    await redis.del(key);
  }

  /**
   * Track failed 2FA attempts and send notifications
   */
  private async trackFailedAttempt(userId: string): Promise<void> {
    const key = `2fa:failed:${userId}`;
    const attempts = await redis.get(key);
    
    if (!attempts) {
      await redis.setEx(key, 3600, '1'); // 1 hour window
    } else {
      const count = parseInt(attempts) + 1;
      await redis.setEx(key, 3600, count.toString());
      
      // Send notification after multiple failed attempts
      if (count >= 3) {
        await this.notificationService.showWarning(
          userId.toString(),
          `There have been ${count} failed two-factor authentication attempts on your account in the last hour.`,
          [
            {
              label: 'Review Account Security',
              action: 'security-review',
              primary: true,
              icon: 'security',
            },
          ]
        );

        logger.warn('Multiple failed 2FA attempts detected', { userId, attempts: count });
      }
    }
  }

  /**
   * Clear failed attempt counter
   */
  private async clearFailedAttempts(userId: string): Promise<void> {
    const key = `2fa:failed:${userId}`;
    await redis.del(key);
  }

  /**
   * Send SMS verification code
   */
  async sendSMSCode(userId: string, phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      // Generate 6-digit code - CRYPTOGRAPHICALLY SECURE
      const code = CryptoSecurity.generateSecureCode(6);
      
      // Store code in Redis with 5-minute expiry
      const key = `2fa:sms:${userId}`;
      await redis.setEx(key, 300, JSON.stringify({ code, phoneNumber, sentAt: new Date() }));

      // Send SMS via configured SMS service (supports Twilio, AWS SNS, and mock)
      // SECURITY: Never log the actual code - removed security vulnerability
      const smsResult = await this.sendSMS(phoneNumber, `Your UpCoach verification code is: ${code}. This code expires in 5 minutes.`);

      if (smsResult.success) {
        logger.info('SMS 2FA code sent', { userId, phoneNumber: this.maskPhoneNumber(phoneNumber) });
        return { success: true, message: 'Verification code sent successfully' };
      } else {
        throw new Error('Failed to send SMS');
      }
    } catch (error) {
      logger.error('Error sending SMS code', error);
      return { success: false, message: 'Failed to send verification code' };
    }
  }

  /**
   * Verify SMS code
   */
  async verifySMSCode(userId: string, code: string): Promise<boolean> {
    try {
      const key = `2fa:sms:${userId}`;
      const storedData = await redis.get(key);

      if (!storedData) {
        logger.warn('SMS verification failed: code expired or not found', { userId });
        return false;
      }

      const { code: storedCode, phoneNumber, sentAt } = JSON.parse(storedData);

      // Check if code matches - TIMING-SAFE COMPARISON
      if (!CryptoSecurity.timingSafeStringCompare(code, storedCode)) {
        await this.trackFailedAttempt(userId);
        logger.warn('SMS verification failed: invalid code', { userId });
        return false;
      }

      // Check if code is not too old (additional safety check)
      const sentTime = new Date(sentAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - sentTime.getTime()) / (1000 * 60);

      if (diffMinutes > 5) {
        logger.warn('SMS verification failed: code expired', { userId });
        return false;
      }

      // Clear the used code
      await redis.del(key);
      await this.clearFailedAttempts(userId);

      logger.info('SMS verification successful', { userId, phoneNumber: this.maskPhoneNumber(phoneNumber) });
      return true;
    } catch (error) {
      logger.error('Error verifying SMS code', error);
      return false;
    }
  }

  /**
   * Enable SMS 2FA
   */
  async enableSMS2FA(userId: string, phoneNumber: string, verificationCode: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verify the SMS code first
      const isCodeValid = await this.verifySMSCode(userId, verificationCode);
      if (!isCodeValid) {
        return { success: false, message: 'Invalid verification code' };
      }

      // Store SMS 2FA configuration
      const configKey = `2fa:config:${userId}`;
      const config: TwoFactorConfig = {
        userId,
        method: 'sms',
        enabled: true,
        verifiedAt: new Date(),
        lastUsedAt: new Date(),
        trustedDevices: [],
      };

      // Store phone number securely - ENCRYPTED
      const phoneKey = `2fa:phone:${userId}`;
      const encryptedPhoneNumber = CryptoSecurity.encryptSensitiveData(phoneNumber);
      await redis.set(phoneKey, encryptedPhoneNumber);
      
      // Store encrypted configuration
      const encryptedConfig = CryptoSecurity.encryptSensitiveData(JSON.stringify(config));
      await redis.set(configKey, encryptedConfig);

      // Send security notification
      await this.notificationService.showSuccess(
        userId.toString(),
        'SMS Two-Factor Authentication has been enabled on your account for enhanced security.'
      );

      logger.info('SMS 2FA enabled for user', { userId, phoneNumber: this.maskPhoneNumber(phoneNumber) });

      return { success: true, message: 'SMS 2FA enabled successfully' };
    } catch (error) {
      logger.error('Error enabling SMS 2FA', error);
      return { success: false, message: 'Failed to enable SMS 2FA' };
    }
  }

  /**
   * Send email verification code
   */
  async sendEmailCode(userId: string, email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Generate 6-digit code - CRYPTOGRAPHICALLY SECURE
      const code = CryptoSecurity.generateSecureCode(6);
      
      // Store code in Redis with 5-minute expiry
      const key = `2fa:email:${userId}`;
      await redis.setEx(key, 300, JSON.stringify({ code, email, sentAt: new Date() }));

      // Send email via email service
      const emailResult = await emailService.send({
        to: email,
        subject: 'Your UpCoach Verification Code',
        template: 'two-factor-auth-email',
        data: {
          code,
          expiresIn: '5 minutes',
          userEmail: email,
        },
      });

      if (emailResult) {
        logger.info('Email 2FA code sent', { userId, email: this.maskEmail(email) });
        return { success: true, message: 'Verification code sent successfully' };
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      logger.error('Error sending email code', error);
      return { success: false, message: 'Failed to send verification code' };
    }
  }

  /**
   * Verify email code
   */
  async verifyEmailCode(userId: string, code: string): Promise<boolean> {
    try {
      const key = `2fa:email:${userId}`;
      const storedData = await redis.get(key);

      if (!storedData) {
        logger.warn('Email verification failed: code expired or not found', { userId });
        return false;
      }

      const { code: storedCode, email, sentAt } = JSON.parse(storedData);

      // Check if code matches - TIMING-SAFE COMPARISON
      if (!CryptoSecurity.timingSafeStringCompare(code, storedCode)) {
        await this.trackFailedAttempt(userId);
        logger.warn('Email verification failed: invalid code', { userId });
        return false;
      }

      // Check if code is not too old (additional safety check)
      const sentTime = new Date(sentAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - sentTime.getTime()) / (1000 * 60);

      if (diffMinutes > 5) {
        logger.warn('Email verification failed: code expired', { userId });
        return false;
      }

      // Clear the used code
      await redis.del(key);
      await this.clearFailedAttempts(userId);

      logger.info('Email verification successful', { userId, email: this.maskEmail(email) });
      return true;
    } catch (error) {
      logger.error('Error verifying email code', error);
      return false;
    }
  }

  /**
   * Enable email 2FA
   */
  async enableEmail2FA(userId: string, email: string, verificationCode: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verify the email code first
      const isCodeValid = await this.verifyEmailCode(userId, verificationCode);
      if (!isCodeValid) {
        return { success: false, message: 'Invalid verification code' };
      }

      // Store email 2FA configuration
      const configKey = `2fa:config:${userId}`;
      const config: TwoFactorConfig = {
        userId,
        method: 'email',
        enabled: true,
        verifiedAt: new Date(),
        lastUsedAt: new Date(),
        trustedDevices: [],
      };

      // Store email securely - ENCRYPTED
      const emailKey = `2fa:email-addr:${userId}`;
      const encryptedEmail = CryptoSecurity.encryptSensitiveData(email);
      await redis.set(emailKey, encryptedEmail);
      
      // Store encrypted configuration
      const encryptedConfig = CryptoSecurity.encryptSensitiveData(JSON.stringify(config));
      await redis.set(configKey, encryptedConfig);

      // Send security notification
      await this.notificationService.showSuccess(
        userId.toString(),
        'Email Two-Factor Authentication has been enabled on your account for enhanced security.'
      );

      logger.info('Email 2FA enabled for user', { userId, email: this.maskEmail(email) });

      return { success: true, message: 'Email 2FA enabled successfully' };
    } catch (error) {
      logger.error('Error enabling email 2FA', error);
      return { success: false, message: 'Failed to enable email 2FA' };
    }
  }

  /**
   * Send SMS using the configured SMS service
   */
  private async sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Import SMS service dynamically to avoid circular dependencies
      const { smsService } = await import('./sms/SMSService');

      const result = await smsService.sendSMS(phoneNumber, message);

      if (result.success) {
        logger.info('SMS sent successfully', {
          provider: result.provider,
          messageId: result.messageId
        });
        return { success: true };
      } else {
        logger.error('SMS sending failed', {
          provider: result.provider,
          error: result.error
        });
        return {
          success: false,
          message: result.error || 'Failed to send SMS'
        };
      }
    } catch (error) {
      logger.error('SMS service error', error);
      return {
        success: false,
        message: 'SMS service unavailable'
      };
    }
  }

  /**
   * Mask phone number for logging
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return phoneNumber;
    return phoneNumber.slice(0, 3) + '*'.repeat(phoneNumber.length - 6) + phoneNumber.slice(-3);
  }

  /**
   * Mask email for logging
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    return local.slice(0, 2) + '*'.repeat(local.length - 4) + local.slice(-2) + '@' + domain;
  }

  /**
   * Validate TOTP secret strength and quality
   */
  validateSecretStrength(secret: string): {
    isValid: boolean;
    score: number;
    issues: string[];
    recommendations: string[]
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check minimum length (Base32 secrets should be at least 16 characters for 80 bits)
    if (secret.length < 16) {
      issues.push('Secret is too short (minimum 16 characters required)');
      recommendations.push('Use a longer secret for better security');
    } else {
      score += 20;
    }

    // Check for sufficient entropy
    const entropy = this.calculateEntropy(secret);
    if (entropy < 4.0) {
      issues.push('Secret has low entropy (randomness)');
      recommendations.push('Use a more random secret with better character distribution');
    } else if (entropy >= 4.0 && entropy < 4.5) {
      score += 15;
      recommendations.push('Consider using a secret with higher entropy for maximum security');
    } else {
      score += 25;
    }

    // Check character set diversity (Base32: A-Z, 2-7)
    const base32Pattern = /^[A-Z2-7]+$/;
    if (!base32Pattern.test(secret)) {
      issues.push('Secret contains invalid characters (must be Base32: A-Z, 2-7)');
      recommendations.push('Ensure secret uses only valid Base32 characters');
    } else {
      score += 15;
    }

    // Check for repeated patterns
    if (this.hasRepeatedPatterns(secret)) {
      issues.push('Secret contains repeated patterns');
      recommendations.push('Use a secret without obvious patterns or repetitions');
    } else {
      score += 20;
    }

    // Check for common weak patterns
    const weakPatterns = ['AAAA', 'BBBB', '2222', '3333', '4444', '5555', '6666', '7777'];
    const hasWeakPattern = weakPatterns.some(pattern => secret.includes(pattern));
    if (hasWeakPattern) {
      issues.push('Secret contains weak patterns');
      recommendations.push('Avoid repeated characters or predictable sequences');
    } else {
      score += 10;
    }

    // Check for adequate length for high security (32+ characters recommended)
    if (secret.length >= 32) {
      score += 10;
    } else if (secret.length >= 24) {
      score += 5;
      recommendations.push('Consider using a 32+ character secret for maximum security');
    }

    const isValid = issues.length === 0 && score >= 70;

    // Add general recommendations based on score
    if (score < 50) {
      recommendations.push('Generate a new secret using a cryptographically secure random generator');
    } else if (score < 80) {
      recommendations.push('Your secret is acceptable but could be improved');
    }

    return {
      isValid,
      score,
      issues,
      recommendations
    };
  }

  /**
   * Calculate Shannon entropy of a string
   */
  private calculateEntropy(str: string): number {
    const frequencies: { [key: string]: number } = {};

    // Count character frequencies
    for (const char of str) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    // Calculate entropy
    let entropy = 0;
    const length = str.length;

    for (const freq of Object.values(frequencies)) {
      const probability = freq / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  /**
   * Check for repeated patterns in secret
   */
  private hasRepeatedPatterns(secret: string): boolean {
    // Check for repeated 2-character patterns
    for (let i = 0; i < secret.length - 3; i++) {
      const pattern = secret.substring(i, i + 2);
      if (secret.substring(i + 2, i + 4) === pattern) {
        return true;
      }
    }

    // Check for repeated 3-character patterns
    for (let i = 0; i < secret.length - 5; i++) {
      const pattern = secret.substring(i, i + 3);
      if (secret.substring(i + 3, i + 6) === pattern) {
        return true;
      }
    }

    // Check for runs of identical characters (4 or more)
    for (let i = 0; i < secret.length - 3; i++) {
      if (secret[i] === secret[i + 1] &&
          secret[i] === secret[i + 2] &&
          secret[i] === secret[i + 3]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate a cryptographically secure TOTP secret
   */
  generateSecureSecret(length: number = 32): string {
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';

    // Use crypto.randomBytes for cryptographically secure randomness
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      secret += base32Chars[randomBytes[i] % base32Chars.length];
    }

    return secret;
  }

  /**
   * Validate and potentially regenerate a secret if it's weak
   */
  async validateAndRegenerateSecret(secret?: string): Promise<{
    secret: string;
    validation: ReturnType<typeof this.validateSecretStrength>;
    regenerated: boolean;
  }> {
    // If no secret provided, generate one
    if (!secret) {
      const newSecret = this.generateSecureSecret();
      return {
        secret: newSecret,
        validation: this.validateSecretStrength(newSecret),
        regenerated: true
      };
    }

    // Validate existing secret
    const validation = this.validateSecretStrength(secret);

    // If secret is weak, regenerate
    if (!validation.isValid || validation.score < 70) {
      logger.warn('Weak TOTP secret detected, regenerating', {
        score: validation.score,
        issues: validation.issues
      });

      const newSecret = this.generateSecureSecret();
      return {
        secret: newSecret,
        validation: this.validateSecretStrength(newSecret),
        regenerated: true
      };
    }

    return {
      secret,
      validation,
      regenerated: false
    };
  }

  // ====== ADAPTER METHODS FOR TESTS ======
  // These methods provide the interface expected by the test suite

  /**
   * Generate secret (adapter for generateTOTPSecret)
   * @param userId User ID
   */
  async generateSecret(userId: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    // Get user from database
    const { User } = await import('../models/User');
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    try {
      const result = await this.generateTOTPSecret(userId, user.email);

      // Store secret and backup codes in user model
      await user.update({
        twoFactorSecret: result.secret.base32,
        twoFactorBackupCodes: result.backupCodes
      });

      return {
        secret: result.secret.base32,
        qrCode: result.qrCode,
        backupCodes: result.backupCodes
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('QR')) {
        throw new Error('Failed to generate QR code');
      }
      throw new Error('Failed to save 2FA secret');
    }
  }

  /**
   * Verify token (adapter for verify2FA)
   * @param userId User ID
   * @param token Token to verify
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    const { User } = await import('../models/User');
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new Error('2FA not enabled for this user');
    }

    // Check rate limiting
    const rateLimitKey = `2fa:attempts:${userId}`;
    const attempts = await redis.incr(rateLimitKey);

    if (attempts === 1) {
      await redis.expire(rateLimitKey, 300); // 5 minutes
    }

    if (attempts > 5) {
      throw new Error('Too many failed attempts');
    }

    // Check if token is reused
    const tokenKey = `used_token:${userId}:${token}`;
    const isUsed = await redis.get(tokenKey);

    if (isUsed) {
      return false;
    }

    // Try TOTP verification first
    if (user.twoFactorSecret) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
        window: this.totpWindow
      });

      if (verified) {
        // Mark token as used (gracefully handle Redis errors)
        try {
          await redis.setex(tokenKey, 300, 'used');
        } catch (error) {
          logger.error('Failed to mark token as used in Redis', error);
        }
        // Clear rate limit on success (gracefully handle Redis errors)
        try {
          await redis.del(rateLimitKey);
        } catch (error) {
          logger.error('Failed to clear rate limit in Redis', error);
        }
        return true;
      }
    }

    // Try backup code
    if (user.twoFactorBackupCodes && Array.isArray(user.twoFactorBackupCodes)) {
      const codeIndex = user.twoFactorBackupCodes.indexOf(token);
      if (codeIndex > -1) {
        // Remove used backup code
        const updatedCodes = [...user.twoFactorBackupCodes];
        updatedCodes.splice(codeIndex, 1);
        await user.update({ twoFactorBackupCodes: updatedCodes });
        // Clear rate limit on success (gracefully handle Redis errors)
        try {
          await redis.del(rateLimitKey);
        } catch (error) {
          logger.error('Failed to clear rate limit in Redis', error);
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Enable two factor authentication
   * @param userId User ID
   * @param token Verification token
   */
  async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    const { User } = await import('../models/User');
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new Error('2FA is already enabled');
    }

    // Verify the token first
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: this.totpWindow
    });

    if (!verified) {
      return false;
    }

    // Mark token as used
    const tokenKey = `used_token:${userId}:${token}`;
    await redis.setex(tokenKey, 300, 'used');

    // Enable 2FA
    await user.update({ twoFactorEnabled: true });

    return true;
  }

  /**
   * Disable two factor authentication
   * @param userId User ID
   * @param token Verification token
   */
  async disableTwoFactor(userId: string, token: string): Promise<boolean> {
    const { User } = await import('../models/User');
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new Error('2FA is not enabled');
    }

    // Verify the token first
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: this.totpWindow
    });

    if (!verified) {
      return false;
    }

    // Disable 2FA and clear secret
    await user.update({
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null
    });

    return true;
  }

  /**
   * Generate new backup codes
   * @param userId User ID
   */
  async generateBackupCodes(userId: string): Promise<string[]> {
    const { User } = await import('../models/User');
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new Error('2FA is not enabled');
    }

    // Generate new backup codes
    const codes: string[] = [];
    for (let i = 0; i < this.backupCodeCount; i++) {
      const code = crypto.randomBytes(4).toString('hex');
      codes.push(code);
    }

    await user.update({ twoFactorBackupCodes: codes });

    return codes;
  }

  /**
   * Get two factor status
   * @param userId User ID
   */
  async getTwoFactorStatus(userId: string): Promise<{
    enabled: boolean;
    backupCodesCount: number;
  }> {
    const { User } = await import('../models/User');
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      enabled: user.twoFactorEnabled || false,
      backupCodesCount: user.twoFactorBackupCodes ? user.twoFactorBackupCodes.length : 0
    };
  }
}

// Export class and singleton instance
export { TwoFactorAuthService };
export const twoFactorAuthService = TwoFactorAuthService.getInstance();
