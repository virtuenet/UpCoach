/**
 * Encryption Service
 *
 * Provides comprehensive data encryption capabilities:
 * - Field-level encryption (AES-256-GCM)
 * - Envelope encryption with key hierarchy
 * - Searchable encryption for encrypted fields
 * - Key derivation and management
 * - Encryption at rest and in transit
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

// Types
export type EncryptionAlgorithm = 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';
export type KeyType = 'master' | 'data' | 'field' | 'searchable';

export interface EncryptionKey {
  id: string;
  type: KeyType;
  algorithm: EncryptionAlgorithm;
  key: Buffer;
  createdAt: Date;
  rotatedAt?: Date;
  expiresAt?: Date;
  version: number;
  parentKeyId?: string;
  metadata?: Record<string, unknown>;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag?: string;
  keyId: string;
  keyVersion: number;
  algorithm: EncryptionAlgorithm;
  encryptedAt: Date;
}

export interface EncryptionOptions {
  algorithm?: EncryptionAlgorithm;
  keyId?: string;
  additionalData?: Buffer;
  deterministic?: boolean; // For searchable encryption
}

export interface FieldEncryptionConfig {
  fieldName: string;
  searchable: boolean;
  deterministicSearch?: boolean;
  blindIndexSalt?: string;
}

export interface EncryptionStats {
  totalEncryptions: number;
  totalDecryptions: number;
  keyRotations: number;
  activeKeys: number;
  averageEncryptionTime: number;
  averageDecryptionTime: number;
}

export interface EncryptionServiceConfig {
  masterKeyId?: string;
  defaultAlgorithm?: EncryptionAlgorithm;
  keyRotationInterval?: number; // days
  enableSearchableEncryption?: boolean;
}

// Encryption Service
export class EncryptionService extends EventEmitter {
  private keys: Map<string, EncryptionKey> = new Map();
  private currentDataKeyId: string | null = null;
  private config: Required<EncryptionServiceConfig>;
  private stats: EncryptionStats = {
    totalEncryptions: 0,
    totalDecryptions: 0,
    keyRotations: 0,
    activeKeys: 0,
    averageEncryptionTime: 0,
    averageDecryptionTime: 0,
  };
  private encryptionTimes: number[] = [];
  private decryptionTimes: number[] = [];

  constructor(config: EncryptionServiceConfig = {}) {
    super();
    this.config = {
      masterKeyId: config.masterKeyId || 'master-key-v1',
      defaultAlgorithm: config.defaultAlgorithm || 'aes-256-gcm',
      keyRotationInterval: config.keyRotationInterval || 90,
      enableSearchableEncryption: config.enableSearchableEncryption ?? true,
    };
  }

  /**
   * Initialize the encryption service
   */
  async initialize(): Promise<void> {
    // Generate or load master key
    await this.ensureMasterKey();

    // Generate initial data encryption key
    await this.generateDataKey();

    console.log('EncryptionService initialized');
    this.emit('initialized');
  }

  /**
   * Ensure master key exists
   */
  private async ensureMasterKey(): Promise<void> {
    if (this.keys.has(this.config.masterKeyId)) {
      return;
    }

    // In production, this would be loaded from HSM or KMS
    const masterKey: EncryptionKey = {
      id: this.config.masterKeyId,
      type: 'master',
      algorithm: 'aes-256-gcm',
      key: crypto.randomBytes(32),
      createdAt: new Date(),
      version: 1,
    };

    this.keys.set(masterKey.id, masterKey);
  }

  /**
   * Generate a new data encryption key
   */
  async generateDataKey(parentKeyId?: string): Promise<string> {
    const keyId = `dek-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const parentKey = parentKeyId
      ? this.keys.get(parentKeyId)
      : this.keys.get(this.config.masterKeyId);

    if (!parentKey) {
      throw new Error('Parent key not found');
    }

    const dataKey: EncryptionKey = {
      id: keyId,
      type: 'data',
      algorithm: this.config.defaultAlgorithm,
      key: crypto.randomBytes(32),
      createdAt: new Date(),
      version: 1,
      parentKeyId: parentKey.id,
      expiresAt: new Date(Date.now() + this.config.keyRotationInterval * 24 * 60 * 60 * 1000),
    };

    this.keys.set(keyId, dataKey);
    this.currentDataKeyId = keyId;
    this.stats.activeKeys = this.keys.size;

    return keyId;
  }

  /**
   * Encrypt data
   */
  async encrypt(
    plaintext: string | Buffer,
    options: EncryptionOptions = {}
  ): Promise<EncryptedData> {
    const startTime = Date.now();
    const algorithm = options.algorithm || this.config.defaultAlgorithm;
    const keyId = options.keyId || this.currentDataKeyId;

    if (!keyId) {
      throw new Error('No encryption key available');
    }

    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }

    const plaintextBuffer = typeof plaintext === 'string' ? Buffer.from(plaintext) : plaintext;
    let result: EncryptedData;

    switch (algorithm) {
      case 'aes-256-gcm':
        result = this.encryptAesGcm(plaintextBuffer, key, options);
        break;
      case 'aes-256-cbc':
        result = this.encryptAesCbc(plaintextBuffer, key);
        break;
      case 'chacha20-poly1305':
        result = this.encryptChaCha20(plaintextBuffer, key, options);
        break;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    this.stats.totalEncryptions++;
    this.recordEncryptionTime(Date.now() - startTime);

    return result;
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData: EncryptedData): Promise<Buffer> {
    const startTime = Date.now();
    const key = this.keys.get(encryptedData.keyId);

    if (!key) {
      throw new Error(`Key not found: ${encryptedData.keyId}`);
    }

    let result: Buffer;

    switch (encryptedData.algorithm) {
      case 'aes-256-gcm':
        result = this.decryptAesGcm(encryptedData, key);
        break;
      case 'aes-256-cbc':
        result = this.decryptAesCbc(encryptedData, key);
        break;
      case 'chacha20-poly1305':
        result = this.decryptChaCha20(encryptedData, key);
        break;
      default:
        throw new Error(`Unsupported algorithm: ${encryptedData.algorithm}`);
    }

    this.stats.totalDecryptions++;
    this.recordDecryptionTime(Date.now() - startTime);

    return result;
  }

  /**
   * Encrypt string and return base64
   */
  async encryptString(plaintext: string, options: EncryptionOptions = {}): Promise<string> {
    const encrypted = await this.encrypt(plaintext, options);
    return this.serializeEncryptedData(encrypted);
  }

  /**
   * Decrypt base64 string
   */
  async decryptString(encryptedString: string): Promise<string> {
    const encrypted = this.deserializeEncryptedData(encryptedString);
    const decrypted = await this.decrypt(encrypted);
    return decrypted.toString('utf8');
  }

  /**
   * Encrypt a specific field with optional searchable encryption
   */
  async encryptField(
    value: string,
    fieldConfig: FieldEncryptionConfig
  ): Promise<{ encrypted: string; blindIndex?: string }> {
    const encrypted = await this.encryptString(value);

    let blindIndex: string | undefined;
    if (fieldConfig.searchable && this.config.enableSearchableEncryption) {
      blindIndex = this.generateBlindIndex(value, fieldConfig);
    }

    return { encrypted, blindIndex };
  }

  /**
   * Decrypt a field
   */
  async decryptField(encryptedValue: string): Promise<string> {
    return this.decryptString(encryptedValue);
  }

  /**
   * Generate blind index for searchable encryption
   */
  generateBlindIndex(value: string, config: FieldEncryptionConfig): string {
    const salt = config.blindIndexSalt || config.fieldName;
    const normalized = value.toLowerCase().trim();

    // Use HMAC for deterministic but secure hashing
    const hmac = crypto.createHmac('sha256', salt);
    hmac.update(normalized);
    const hash = hmac.digest();

    // Truncate to reduce storage while maintaining reasonable collision resistance
    return hash.subarray(0, 16).toString('hex');
  }

  /**
   * Search encrypted field using blind index
   */
  searchBlindIndex(searchValue: string, config: FieldEncryptionConfig): string {
    return this.generateBlindIndex(searchValue, config);
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(): Promise<{ newKeyId: string; rotatedCount: number }> {
    const newKeyId = await this.generateDataKey();

    // Mark old keys as rotated
    let rotatedCount = 0;
    for (const [keyId, key] of this.keys.entries()) {
      if (key.type === 'data' && keyId !== newKeyId && !key.rotatedAt) {
        key.rotatedAt = new Date();
        rotatedCount++;
      }
    }

    this.stats.keyRotations++;
    this.emit('keysRotated', { newKeyId, rotatedCount });

    return { newKeyId, rotatedCount };
  }

  /**
   * Re-encrypt data with new key
   */
  async reEncrypt(encryptedData: EncryptedData, newKeyId?: string): Promise<EncryptedData> {
    const decrypted = await this.decrypt(encryptedData);
    return this.encrypt(decrypted, { keyId: newKeyId || this.currentDataKeyId || undefined });
  }

  /**
   * Derive a key for a specific purpose
   */
  deriveKey(purpose: string, keyId?: string): Buffer {
    const parentKey = keyId ? this.keys.get(keyId) : this.keys.get(this.config.masterKeyId);

    if (!parentKey) {
      throw new Error('Parent key not found');
    }

    return crypto.pbkdf2Sync(parentKey.key, purpose, 100000, 32, 'sha256');
  }

  /**
   * Hash a value with salt (for passwords, etc.)
   */
  hash(value: string, salt?: string): { hash: string; salt: string } {
    const usedSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(value, usedSalt, 100000, 64, 'sha512').toString('hex');
    return { hash, salt: usedSalt };
  }

  /**
   * Verify a hash
   */
  verifyHash(value: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hash(value, salt);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash));
  }

  /**
   * Generate a secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Get encryption statistics
   */
  getStats(): EncryptionStats {
    return { ...this.stats };
  }

  /**
   * Get key info (without exposing actual key material)
   */
  getKeyInfo(keyId: string): Omit<EncryptionKey, 'key'> | null {
    const key = this.keys.get(keyId);
    if (!key) return null;

    const { key: _, ...info } = key;
    return info;
  }

  /**
   * List all keys (without exposing key material)
   */
  listKeys(): Array<Omit<EncryptionKey, 'key'>> {
    return Array.from(this.keys.values()).map(({ key: _, ...info }) => info);
  }

  // Private encryption methods

  private encryptAesGcm(
    plaintext: Buffer,
    key: EncryptionKey,
    options: EncryptionOptions
  ): EncryptedData {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key.key, iv);

    if (options.additionalData) {
      cipher.setAAD(options.additionalData);
    }

    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      keyId: key.id,
      keyVersion: key.version,
      algorithm: 'aes-256-gcm',
      encryptedAt: new Date(),
    };
  }

  private decryptAesGcm(encryptedData: EncryptedData, key: EncryptionKey): Buffer {
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
    const authTag = Buffer.from(encryptedData.authTag || '', 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key.key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  private encryptAesCbc(plaintext: Buffer, key: EncryptionKey): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key.key, iv);

    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      keyId: key.id,
      keyVersion: key.version,
      algorithm: 'aes-256-cbc',
      encryptedAt: new Date(),
    };
  }

  private decryptAesCbc(encryptedData: EncryptedData, key: EncryptionKey): Buffer {
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-cbc', key.key, iv);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  private encryptChaCha20(
    plaintext: Buffer,
    key: EncryptionKey,
    options: EncryptionOptions
  ): EncryptedData {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('chacha20-poly1305', key.key, iv, {
      authTagLength: 16,
    });

    if (options.additionalData) {
      cipher.setAAD(options.additionalData);
    }

    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      keyId: key.id,
      keyVersion: key.version,
      algorithm: 'chacha20-poly1305',
      encryptedAt: new Date(),
    };
  }

  private decryptChaCha20(encryptedData: EncryptedData, key: EncryptionKey): Buffer {
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
    const authTag = Buffer.from(encryptedData.authTag || '', 'base64');

    const decipher = crypto.createDecipheriv('chacha20-poly1305', key.key, iv, {
      authTagLength: 16,
    });
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  private serializeEncryptedData(data: EncryptedData): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  private deserializeEncryptedData(serialized: string): EncryptedData {
    return JSON.parse(Buffer.from(serialized, 'base64').toString('utf8'));
  }

  private recordEncryptionTime(ms: number): void {
    this.encryptionTimes.push(ms);
    if (this.encryptionTimes.length > 1000) {
      this.encryptionTimes.shift();
    }
    this.stats.averageEncryptionTime =
      this.encryptionTimes.reduce((a, b) => a + b, 0) / this.encryptionTimes.length;
  }

  private recordDecryptionTime(ms: number): void {
    this.decryptionTimes.push(ms);
    if (this.decryptionTimes.length > 1000) {
      this.decryptionTimes.shift();
    }
    this.stats.averageDecryptionTime =
      this.decryptionTimes.reduce((a, b) => a + b, 0) / this.decryptionTimes.length;
  }
}

// Singleton instance
let encryptionServiceInstance: EncryptionService | null = null;

export function getEncryptionService(config?: EncryptionServiceConfig): EncryptionService {
  if (!encryptionServiceInstance) {
    encryptionServiceInstance = new EncryptionService(config);
  }
  return encryptionServiceInstance;
}
