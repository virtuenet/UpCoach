import * as crypto from 'crypto';

import { logger } from './logger';

/**
 * Generates a cryptographically secure random secret
 * @param bytes Number of random bytes (default 64)
 * @returns Hex-encoded secret string
 */
export function generateSecret(bytes: number = 64): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Validates that a secret meets security requirements
 * @param secret The secret to validate
 * @param minLength Minimum length requirement
 * @returns Boolean indicating if secret is valid
 */
export function validateSecret(secret: string, minLength: number = 64): boolean {
  if (!secret || secret.length < minLength) {
    return false;
  }

  // Check for common weak patterns
  const weakPatterns = [
    'secret',
    'key',
    'password',
    'test',
    'placeholder',
    'change',
    'example',
    '12345',
    'admin',
    'default',
  ];

  const lowerSecret = secret.toLowerCase();
  for (const pattern of weakPatterns) {
    if (lowerSecret.includes(pattern)) {
      logger.warn(`Secret contains weak pattern: ${pattern}`);
      return false;
    }
  }

  return true;
}

/**
 * Generates a secure API key with prefix
 * @param prefix Key prefix (e.g., 'sk_live_', 'pk_test_')
 * @returns Formatted API key
 */
export function generateApiKey(prefix: string = 'key_'): string {
  const secret = generateSecret(32);
  return `${prefix}${secret}`;
}

/**
 * Hashes a secret for storage (one-way)
 * @param secret The secret to hash
 * @returns Hashed secret
 */
export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

/**
 * Compares a plain secret with a hashed secret
 * @param plain Plain text secret
 * @param hashed Hashed secret
 * @returns Boolean indicating if they match
 */
export function compareSecrets(plain: string, hashed: string): boolean {
  const plainHashed = hashSecret(plain);
  return crypto.timingSafeEqual(Buffer.from(plainHashed), Buffer.from(hashed));
}

/**
 * Encrypts sensitive data
 * @param text Text to encrypt
 * @param key Encryption key
 * @returns Encrypted text with IV
 */
export function encrypt(text: string, key: string): string {
  const algorithm = 'aes-256-gcm';
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, authTag, Buffer.from(encrypted, 'hex')]).toString('base64');
}

/**
 * Decrypts sensitive data
 * @param encryptedText Encrypted text with IV
 * @param key Decryption key
 * @returns Decrypted text
 */
export function decrypt(encryptedText: string, key: string): string {
  const algorithm = 'aes-256-gcm';
  const buffer = Buffer.from(encryptedText, 'base64');

  const salt = buffer.slice(0, 16);
  const iv = buffer.slice(16, 32);
  const authTag = buffer.slice(32, 48);
  const encrypted = buffer.slice(48);

  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
  const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Rotates a secret by generating a new one
 * @returns Object with new and old secrets for gradual migration
 */
export function rotateSecret(currentSecret?: string): { current: string; previous: string; rotatedAt: Date } {
  return {
    current: generateSecret(),
    previous: currentSecret || generateSecret(),
    rotatedAt: new Date(),
  };
}

/**
 * Validates environment secrets on startup
 */
export function validateEnvironmentSecrets(): void {
  const requiredSecrets = [
    { name: 'JWT_SECRET', value: process.env.JWT_SECRET, minLength: 64 },
    { name: 'JWT_REFRESH_SECRET', value: process.env.JWT_REFRESH_SECRET, minLength: 64 },
    { name: 'DATABASE_URL', value: process.env.DATABASE_URL, minLength: 20 },
  ];

  const errors: string[] = [];

  for (const secret of requiredSecrets) {
    if (!secret.value) {
      errors.push(`Missing required secret: ${secret.name}`);
    } else if (!validateSecret(secret.value, secret.minLength)) {
      errors.push(`Weak or invalid secret: ${secret.name}`);
    }
  }

  if (errors.length > 0) {
    logger.error('Environment secret validation failed:', errors);
    // Never allow invalid secrets in production or staging environments
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
      throw new Error('🚨 CRITICAL: Invalid environment secrets detected in production/staging environment.');
    } else if (process.env.NODE_ENV !== 'test') {
      // For development, log warnings but allow continuation for developer experience
      logger.warn('⚠️  Development environment: Please configure proper secrets before deployment');
    }
  }
}
