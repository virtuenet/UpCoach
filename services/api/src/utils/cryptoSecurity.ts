/**
 * Cryptographic Security Utilities
 * Implements AES-256-GCM encryption for sensitive data and timing-safe operations
 */

import crypto from 'crypto';
import { logger } from './logger';

export class CryptoSecurity {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits
  private static readonly SALT_LENGTH = 32; // 256 bits

  // Derive encryption key from master key and salt
  private static deriveKey(masterKey: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(masterKey, salt, 100000, this.KEY_LENGTH, 'sha256');
  }

  // Get master key from environment with fallback
  private static getMasterKey(): string {
    const masterKey = process.env.CRYPTO_MASTER_KEY || process.env.DATABASE_ENCRYPTION_KEY;
    if (!masterKey) {
      throw new Error('CRYPTO_MASTER_KEY or DATABASE_ENCRYPTION_KEY must be set for sensitive data encryption');
    }
    return masterKey;
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   * Returns base64-encoded encrypted data with salt, IV, tag, and ciphertext
   */
  static encryptSensitiveData(plaintext: string): string {
    try {
      const masterKey = this.getMasterKey();
      const salt = crypto.randomBytes(this.SALT_LENGTH);
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      const key = this.deriveKey(masterKey, salt);
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
      cipher.setAAD(Buffer.from('sensitive-data', 'utf8'));
      
      let ciphertext = cipher.update(plaintext, 'utf8');
      ciphertext = Buffer.concat([ciphertext, cipher.final()]);
      
      const tag = cipher.getAuthTag();
      
      // Combine salt, IV, tag, and ciphertext
      const combined = Buffer.concat([salt, iv, tag, ciphertext]);
      return combined.toString('base64');
    } catch (error) {
      logger.error('Error encrypting sensitive data', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt sensitive data encrypted with encryptSensitiveData
   */
  static decryptSensitiveData(encryptedData: string): string {
    try {
      const masterKey = this.getMasterKey();
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const salt = combined.subarray(0, this.SALT_LENGTH);
      const iv = combined.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const tag = combined.subarray(this.SALT_LENGTH + this.IV_LENGTH, this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
      const ciphertext = combined.subarray(this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
      
      const key = this.deriveKey(masterKey, salt);
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      decipher.setAAD(Buffer.from('sensitive-data', 'utf8'));
      
      let plaintext = decipher.update(ciphertext);
      plaintext = Buffer.concat([plaintext, decipher.final()]);
      
      return plaintext.toString('utf8');
    } catch (error) {
      logger.error('Error decrypting sensitive data', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   * Uses crypto.timingSafeEqual for constant-time comparison
   */
  static timingSafeStringCompare(a: string, b: string): boolean {
    try {
      // Normalize strings to same length to prevent length-based attacks
      const normalizedA = Buffer.from(a, 'utf8');
      const normalizedB = Buffer.from(b, 'utf8');
      
      // If lengths differ, still compare to prevent timing leaks
      if (normalizedA.length !== normalizedB.length) {
        // Perform a dummy comparison of equal-length strings
        const maxLength = Math.max(normalizedA.length, normalizedB.length);
        const paddedA = Buffer.alloc(maxLength, 0);
        const paddedB = Buffer.alloc(maxLength, 0);
        normalizedA.copy(paddedA);
        normalizedB.copy(paddedB);
        
        // Always return false for different lengths, but after constant-time check
        crypto.timingSafeEqual(paddedA, paddedB);
        return false;
      }
      
      return crypto.timingSafeEqual(normalizedA, normalizedB);
    } catch (error) {
      logger.error('Error in timing-safe comparison', error);
      return false;
    }
  }

  /**
   * Generate cryptographically secure random code
   * Uses crypto.randomBytes for better entropy than randomInt
   */
  static generateSecureCode(length: number = 6): string {
    try {
      // Generate more bytes than needed and use modulo to get digits
      const byteLength = Math.ceil(length * 1.5); // Extra bytes for better distribution
      const randomBytes = crypto.randomBytes(byteLength);
      
      let code = '';
      let byteIndex = 0;
      
      while (code.length < length && byteIndex < randomBytes.length) {
        const byte = randomBytes[byteIndex];
        // Use bytes 0-249 to get even distribution for digits 0-9
        if (byte < 250) {
          code += (byte % 10).toString();
        }
        byteIndex++;
      }
      
      // Fallback if we don't have enough valid bytes (very unlikely)
      while (code.length < length) {
        const fallbackByte = crypto.randomBytes(1)[0];
        if (fallbackByte < 250) {
          code += (fallbackByte % 10).toString();
        }
      }
      
      return code;
    } catch (error) {
      logger.error('Error generating secure code', error);
      throw new Error('Failed to generate secure code');
    }
  }

  /**
   * Generate cryptographically secure backup codes
   * Uses proper entropy and character set
   */
  static generateSecureBackupCodes(count: number = 10, codeLength: number = 8): string[] {
    try {
      const codes: string[] = [];
      const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Remove ambiguous characters
      
      for (let i = 0; i < count; i++) {
        let code = '';
        
        // Generate enough random bytes
        const randomBytes = crypto.randomBytes(codeLength * 2);
        let byteIndex = 0;
        
        while (code.length < codeLength && byteIndex < randomBytes.length) {
          const byte = randomBytes[byteIndex];
          // Use byte values that evenly distribute across charset
          if (byte < Math.floor(256 / charset.length) * charset.length) {
            code += charset[byte % charset.length];
          }
          byteIndex++;
        }
        
        // Add separator in middle for readability
        if (codeLength >= 6) {
          const mid = Math.floor(codeLength / 2);
          code = code.substring(0, mid) + '-' + code.substring(mid);
        }
        
        codes.push(code);
      }
      
      return codes;
    } catch (error) {
      logger.error('Error generating secure backup codes', error);
      throw new Error('Failed to generate secure backup codes');
    }
  }

  /**
   * Generate secure device fingerprint with additional entropy
   */
  static generateSecureDeviceFingerprint(userAgent: string, ipAddress: string, additionalData?: string): string {
    try {
      // Add timestamp and random salt to prevent predictability
      const timestamp = Date.now();
      const salt = crypto.randomBytes(16).toString('hex');
      const data = `${userAgent}:${ipAddress}:${additionalData || ''}:${timestamp}:${salt}`;
      
      // Use HMAC for additional security
      const hmac = crypto.createHmac('sha256', this.getMasterKey());
      hmac.update(data);
      return hmac.digest('hex');
    } catch (error) {
      logger.error('Error generating secure device fingerprint', error);
      throw new Error('Failed to generate secure device fingerprint');
    }
  }

  /**
   * Validate and sanitize device information
   */
  static validateDeviceInfo(deviceInfo: {
    name: string;
    fingerprint: string;
    userAgent: string;
    ipAddress: string;
  }): { isValid: boolean; sanitized?: typeof deviceInfo; errors?: string[] } {
    const errors: string[] = [];
    
    try {
      // Validate device name
      if (!deviceInfo.name || deviceInfo.name.length > 100) {
        errors.push('Device name must be 1-100 characters');
      }
      
      // Validate fingerprint format
      if (!deviceInfo.fingerprint || !/^[a-fA-F0-9]{64}$/.test(deviceInfo.fingerprint)) {
        errors.push('Invalid device fingerprint format');
      }
      
      // Validate user agent length
      if (!deviceInfo.userAgent || deviceInfo.userAgent.length > 500) {
        errors.push('User agent must be 1-500 characters');
      }
      
      // Validate IP address format
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      if (!deviceInfo.ipAddress || !ipRegex.test(deviceInfo.ipAddress)) {
        errors.push('Invalid IP address format');
      }
      
      if (errors.length > 0) {
        return { isValid: false, errors };
      }
      
      // Sanitize inputs
      const sanitized = {
        name: deviceInfo.name.trim(),
        fingerprint: deviceInfo.fingerprint.toLowerCase(),
        userAgent: deviceInfo.userAgent.trim(),
        ipAddress: deviceInfo.ipAddress.trim(),
      };
      
      return { isValid: true, sanitized };
    } catch (error) {
      logger.error('Error validating device info', error);
      return { isValid: false, errors: ['Device validation failed'] };
    }
  }

  /**
   * Generate secure HMAC for data integrity verification
   */
  static generateHMAC(data: string, key?: string): string {
    try {
      const hmacKey = key || this.getMasterKey();
      const hmac = crypto.createHmac('sha256', hmacKey);
      hmac.update(data);
      return hmac.digest('hex');
    } catch (error) {
      logger.error('Error generating HMAC', error);
      throw new Error('Failed to generate HMAC');
    }
  }

  /**
   * Verify HMAC for data integrity
   */
  static verifyHMAC(data: string, expectedHmac: string, key?: string): boolean {
    try {
      const actualHmac = this.generateHMAC(data, key);
      return this.timingSafeStringCompare(actualHmac, expectedHmac);
    } catch (error) {
      logger.error('Error verifying HMAC', error);
      return false;
    }
  }
}

export default CryptoSecurity;