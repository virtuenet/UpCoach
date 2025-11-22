import * as crypto from 'crypto';
import { logger } from '../utils/logger';

/**
 * Secure Secrets Management Service
 * Provides encrypted storage and retrieval of sensitive configuration data
 */

interface SecretConfig {
  key: string;
  encrypted: boolean;
  required: boolean;
  validator?: (value: string) => boolean;
  defaultValue?: string;
}

class SecretsManager {
  private static instance: SecretsManager;
  private encryptionKey: string;
  private secretsCache: Map<string, string> = new Map();

  private constructor() {
    // Initialize encryption key from environment or generate one
    this.encryptionKey = process.env.MASTER_KEY || this.generateMasterKey();
    if (!process.env.MASTER_KEY) {
      logger.warn('MASTER_KEY not set, using generated key. This should only happen in development!');
    }
  }

  public static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  /**
   * Generate a secure master key for encryption
   */
  private generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt a sensitive value
   */
  private encrypt(text: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, this.encryptionKey);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
      logger.error('Failed to encrypt secret', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt a sensitive value
   */
  private decrypt(encryptedText: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const parts = encryptedText.split(':');

      if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Failed to decrypt secret', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Validate environment variable format and security
   */
  private validateSecret(key: string, value: string, config: SecretConfig): boolean {
    // Check if value is properly formatted
    if (!value || value.trim().length === 0) {
      if (config.required) {
        throw new Error(`Required secret ${key} is missing or empty`);
      }
      return false;
    }

    // Check for common security issues
    if (value.includes('password') || value.includes('secret') || value.includes('key')) {
      logger.warn(`Secret ${key} appears to contain the word 'password', 'secret', or 'key' in its value`);
    }

    // Run custom validator if provided
    if (config.validator && !config.validator(value)) {
      throw new Error(`Secret ${key} failed validation`);
    }

    return true;
  }

  /**
   * Get a secret value with validation and caching
   */
  public getSecret(key: string, config: SecretConfig = { key, encrypted: false, required: true }): string {
    // Check cache first
    const cacheKey = `${key}_${config.encrypted ? 'encrypted' : 'plain'}`;
    if (this.secretsCache.has(cacheKey)) {
      return this.secretsCache.get(cacheKey)!;
    }

    // Get value from environment
    let value = process.env[key];

    // Use default value if not found
    if (!value && config.defaultValue) {
      value = config.defaultValue;
    }

    // Validate the secret
    if (!this.validateSecret(key, value || '', config)) {
      if (config.required) {
        throw new Error(`Required secret ${key} is not available`);
      }
      return '';
    }

    // Decrypt if needed
    let finalValue = value!;
    if (config.encrypted && value) {
      try {
        finalValue = this.decrypt(value);
      } catch (error) {
        logger.error(`Failed to decrypt secret ${key}`, error);
        if (config.required) {
          throw error;
        }
        return '';
      }
    }

    // Cache the result (but don't cache decrypted secrets in production)
    if (process.env.NODE_ENV !== 'production' || !config.encrypted) {
      this.secretsCache.set(cacheKey, finalValue);
    }

    return finalValue;
  }

  /**
   * Set a secret value (for development/testing only)
   */
  public setSecret(key: string, value: string, encrypted: boolean = false): void {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot set secrets in production environment');
    }

    const finalValue = encrypted ? this.encrypt(value) : value;
    process.env[key] = finalValue;

    // Update cache
    const cacheKey = `${key}_${encrypted ? 'encrypted' : 'plain'}`;
    this.secretsCache.set(cacheKey, value);
  }

  /**
   * Clear cached secrets (for security)
   */
  public clearCache(): void {
    this.secretsCache.clear();
  }

  /**
   * Validate all required secrets are available
   */
  public validateAllSecrets(): { valid: boolean; missing: string[]; errors: string[] } {
    const missing: string[] = [];
    const errors: string[] = [];

    const requiredSecrets: Record<string, SecretConfig> = {
      DATABASE_URL: {
        key: 'DATABASE_URL',
        encrypted: false,
        required: true,
        validator: (value) => value.startsWith('postgresql://') && !value.includes('password')
      },
      JWT_SECRET: {
        key: 'JWT_SECRET',
        encrypted: false,
        required: true,
        validator: (value) => value.length >= 32
      },
      SESSION_SECRET: {
        key: 'SESSION_SECRET',
        encrypted: false,
        required: true,
        validator: (value) => value.length >= 32
      },
      OPENAI_API_KEY: {
        key: 'OPENAI_API_KEY',
        encrypted: false,
        required: true,
        validator: (value) => value.startsWith('sk-')
      },
      STRIPE_SECRET_KEY: {
        key: 'STRIPE_SECRET_KEY',
        encrypted: false,
        required: true,
        validator: (value) => value.startsWith('sk_')
      }
    };

    for (const [key, config] of Object.entries(requiredSecrets)) {
      try {
        const value = this.getSecret(key, config);
        if (!value && config.required) {
          missing.push(key);
        }
      } catch (error) {
        errors.push(`${key}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      valid: missing.length === 0 && errors.length === 0,
      missing,
      errors
    };
  }

  /**
   * Generate secure random values for secrets
   */
  public generateSecret(type: 'jwt' | 'session' | 'encryption' | 'api_key' = 'jwt'): string {
    switch (type) {
      case 'jwt':
      case 'session':
        return crypto.randomBytes(64).toString('hex');
      case 'encryption':
        return crypto.randomBytes(32).toString('hex');
      case 'api_key':
        return 'uk_' + crypto.randomBytes(32).toString('hex');
      default:
        return crypto.randomBytes(32).toString('hex');
    }
  }

  /**
   * Rotate encryption key (admin operation)
   */
  public rotateEncryptionKey(): string {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Key rotation must be done through secure admin interface');
    }

    const newKey = this.generateMasterKey();
    this.encryptionKey = newKey;
    this.clearCache();

    logger.info('Encryption key rotated successfully');
    return newKey;
  }
}

// Export singleton instance
export const secretsManager = SecretsManager.getInstance();

// Convenience functions for common secrets
export const getSecret = (key: string, required: boolean = true): string => {
  return secretsManager.getSecret(key, { key, encrypted: false, required });
};

export const getEncryptedSecret = (key: string, required: boolean = true): string => {
  return secretsManager.getSecret(key, { key, encrypted: true, required });
};

// Startup validation
export const validateSecretsOnStartup = (): void => {
  const validation = secretsManager.validateAllSecrets();

  if (!validation.valid) {
    logger.error('Secret validation failed', {
      missing: validation.missing,
      errors: validation.errors
    });

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Critical secrets are missing or invalid. Cannot start application.');
    } else {
      logger.warn('Some secrets are missing in development mode. Application may not function correctly.');
    }
  } else {
    logger.info('All required secrets validated successfully');
  }
};

export default secretsManager;