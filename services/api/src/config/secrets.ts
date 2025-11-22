import crypto from 'crypto';
import { config as dotenvConfig } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

import { logger } from '../utils/logger';

// Load environment-specific .env file
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenvConfig({ path: path.resolve(process.cwd(), envFile) });

/**
 * Secure secrets management system
 * Handles encryption, rotation, and validation of sensitive configuration
 */
export class SecretManager {
  private static instance: SecretManager;
  private secrets: Map<string, string> = new Map();
  private encryptionKey: unknown;
  private readonly algorithm = 'aes-256-gcm';
  private readonly rotationInterval = 90 * 24 * 60 * 60 * 1000; // 90 days

  private constructor() {
    this.encryptionKey = this.getOrCreateEncryptionKey();
    this.loadSecrets();
    this.validateSecrets();
  }

  public static getInstance(): SecretManager {
    if (!SecretManager.instance) {
      SecretManager.instance = new SecretManager();
    }
    return SecretManager.instance;
  }

  /**
   * Get or create master encryption key for secrets
   */
  private getOrCreateEncryptionKey(): unknown {
    const keyPath = path.join(process.cwd(), '.secrets', 'master.key');

    try {
      if (fs.existsSync(keyPath)) {
        const key = fs.readFileSync(keyPath);
        if (key.length !== 32) {
          throw new Error('Invalid encryption key length');
        }
        return key;
      }
    } catch (error) {
      logger.warn('Failed to read encryption key, generating new one:', error);
    }

    // Generate new key
    const key = crypto.randomBytes(32);

    // Ensure directory exists
    const dir = path.dirname(keyPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }

    // Write key with restricted permissions
    fs.writeFileSync(keyPath, key, { mode: 0o600 });
    logger.info('Generated new master encryption key');

    return key;
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = (cipher as unknown).getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    (decipher as unknown).setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Load and decrypt secrets from secure storage
   */
  private loadSecrets(): void {
    const secretsPath = path.join(process.cwd(), '.secrets', 'encrypted.json');

    if (fs.existsSync(secretsPath)) {
      try {
        const encryptedSecrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));

        for (const [key, value] of Object.entries(encryptedSecrets)) {
          if (typeof value === 'string') {
            this.secrets.set(key, this.decrypt(value));
          }
        }

        logger.info('Loaded encrypted secrets successfully');
      } catch (error) {
        logger.error('Failed to load encrypted secrets:', error);
      }
    }

    // Override with environment variables if present
    this.loadFromEnvironment();
  }

  /**
   * Load secrets from environment variables
   */
  private loadFromEnvironment(): void {
    const requiredSecrets = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'DATABASE_URL',
      'DB_PASSWORD',
      'REDIS_URL',
      'SESSION_SECRET',
      'CSRF_SECRET',
      'API_KEY_SALT',
    ];

    for (const key of requiredSecrets) {
      const value = process.env[key];
      if (value && value !== 'placeholder') {
        this.secrets.set(key, value);
      }
    }
  }

  /**
   * Validate that all required secrets are present and secure
   */
  private validateSecrets(): void {
    const requiredSecrets = {
      JWT_SECRET: { minLength: 64, pattern: /^[A-Za-z0-9+/=]{64,}$/ },
      JWT_REFRESH_SECRET: { minLength: 64, pattern: /^[A-Za-z0-9+/=]{64,}$/ },
      DATABASE_URL: { minLength: 20, pattern: /^(postgresql|mysql|mssql):\/\// },
      DB_PASSWORD: { minLength: 16, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{16,}$/ },
      SESSION_SECRET: { minLength: 32, pattern: /^[A-Za-z0-9+/=]{32,}$/ },
      CSRF_SECRET: { minLength: 32, pattern: /^[A-Za-z0-9+/=]{32,}$/ },
      API_KEY_SALT: { minLength: 32, pattern: /^[A-Za-z0-9+/=]{32,}$/ },
    };

    const missingSecrets: string[] = [];
    const weakSecrets: string[] = [];

    for (const [key, validation] of Object.entries(requiredSecrets)) {
      const value = this.secrets.get(key);

      if (!value || value === 'placeholder') {
        missingSecrets.push(key);
        // Generate secure default for development
        if (process.env.NODE_ENV !== 'production') {
          const generated = this.generateSecureSecret(validation.minLength);
          this.secrets.set(key, generated);
          logger.warn(`Generated development secret for ${key}`);
        }
      } else if (value.length < validation.minLength) {
        weakSecrets.push(`${key} (min length: ${validation.minLength})`);
      } else if (!validation.pattern.test(value)) {
        weakSecrets.push(`${key} (invalid format)`);
      }
    }

    if (process.env.NODE_ENV === 'production') {
      if (missingSecrets.length > 0) {
        throw new Error(`Missing required secrets: ${missingSecrets.join(', ')}`);
      }
      if (weakSecrets.length > 0) {
        throw new Error(`Weak or invalid secrets: ${weakSecrets.join(', ')}`);
      }
    }
  }

  /**
   * Generate cryptographically secure secret
   */
  public generateSecureSecret(length: number = 64): string {
    return crypto.randomBytes(Math.ceil(length * 3 / 4))
      .toString('base64')
      .slice(0, length)
      .replace(/\+/g, '0')
      .replace(/\//g, '0');
  }

  /**
   * Get a secret value
   */
  public getSecret(key: string): string | undefined {
    return this.secrets.get(key);
  }

  /**
   * Set a secret value (encrypts and stores)
   */
  public setSecret(key: string, value: string): void {
    this.secrets.set(key, value);
    this.saveSecrets();
  }

  /**
   * Save encrypted secrets to disk
   */
  private saveSecrets(): void {
    const secretsPath = path.join(process.cwd(), '.secrets', 'encrypted.json');
    const encryptedSecrets: Record<string, string> = {};

    for (const [key, value] of this.secrets.entries()) {
      // Don't save environment-provided secrets
      if (!process.env[key]) {
        encryptedSecrets[key] = this.encrypt(value);
      }
    }

    // Ensure directory exists
    const dir = path.dirname(secretsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }

    fs.writeFileSync(
      secretsPath,
      JSON.stringify(encryptedSecrets, null, 2),
      { mode: 0o600 }
    );
  }

  /**
   * Rotate a specific secret
   */
  public async rotateSecret(key: string): Promise<string> {
    const newSecret = this.generateSecureSecret();
    this.setSecret(key, newSecret);

    logger.info(`Rotated secret: ${key}`);

    // Notify dependent services about rotation
    // This would integrate with your notification system

    return newSecret;
  }

  /**
   * Check if secrets need rotation
   */
  public async checkRotation(): Promise<void> {
    const rotationMetadataPath = path.join(process.cwd(), '.secrets', 'rotation.json');

    let rotationData: Record<string, number> = {};
    if (fs.existsSync(rotationMetadataPath)) {
      rotationData = JSON.parse(fs.readFileSync(rotationMetadataPath, 'utf8'));
    }

    const now = Date.now();
    const secretsToRotate: string[] = [];

    for (const key of this.secrets.keys()) {
      const lastRotation = rotationData[key] || 0;
      if (now - lastRotation > this.rotationInterval) {
        secretsToRotate.push(key);
      }
    }

    if (secretsToRotate.length > 0) {
      logger.warn(`Secrets requiring rotation: ${secretsToRotate.join(', ')}`);

      // Auto-rotate in non-production environments
      if (process.env.NODE_ENV !== 'production') {
        for (const key of secretsToRotate) {
          await this.rotateSecret(key);
          rotationData[key] = now;
        }

        fs.writeFileSync(
          rotationMetadataPath,
          JSON.stringify(rotationData, null, 2),
          { mode: 0o600 }
        );
      }
    }
  }

  /**
   * Generate secure configuration for production
   */
  public generateProductionSecrets(): Record<string, string> {
    return {
      JWT_SECRET: this.generateSecureSecret(128),
      JWT_REFRESH_SECRET: this.generateSecureSecret(128),
      SESSION_SECRET: this.generateSecureSecret(64),
      CSRF_SECRET: this.generateSecureSecret(64),
      API_KEY_SALT: this.generateSecureSecret(32),
      DB_PASSWORD: this.generateStrongPassword(),
      ENCRYPTION_KEY: this.generateSecureSecret(64),
      WEBHOOK_SECRET: this.generateSecureSecret(64),
    };
  }

  /**
   * Generate strong password with complexity requirements
   */
  private generateStrongPassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '@$!%*?&^#';
    const all = uppercase + lowercase + numbers + special;

    let password = '';

    // Ensure at least one of each required character type
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += special[crypto.randomInt(0, special.length)];

    // Fill rest with random characters
    for (let i = password.length; i < 24; i++) {
      password += all[crypto.randomInt(0, all.length)];
    }

    // Shuffle password
    return password.split('').sort(() => crypto.randomInt(0, 2) - 1).join('');
  }
}

// Export singleton instance
export const secretManager = SecretManager.getInstance();

// Export configuration with secure defaults
export const secureConfig = {
  jwt: {
    secret: secretManager.getSecret('JWT_SECRET') || secretManager.generateSecureSecret(128),
    refreshSecret: secretManager.getSecret('JWT_REFRESH_SECRET') || secretManager.generateSecureSecret(128),
    expiresIn: '15m',
    refreshExpiresIn: '7d',
    algorithm: 'HS512' as const,
    audience: process.env.JWT_AUDIENCE || 'upcoach-api',
    issuer: process.env.JWT_ISSUER || 'upcoach.ai',
  },
  session: {
    secret: secretManager.getSecret('SESSION_SECRET') || secretManager.generateSecureSecret(64),
    name: 'upcoach.sid',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
  },
  csrf: {
    secret: secretManager.getSecret('CSRF_SECRET') || secretManager.generateSecureSecret(64),
    saltLength: 16,
    secretLength: 32,
  },
  encryption: {
    key: secretManager.getSecret('ENCRYPTION_KEY') || secretManager.generateSecureSecret(64),
    algorithm: 'aes-256-gcm',
  },
  apiKeys: {
    salt: secretManager.getSecret('API_KEY_SALT') || secretManager.generateSecureSecret(32),
    iterations: 100000,
    keyLength: 64,
    digest: 'sha512',
  },
};