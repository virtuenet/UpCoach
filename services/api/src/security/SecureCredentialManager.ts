import * as crypto from 'crypto';
import { logger } from '../utils/logger';

export interface CredentialConfig {
  encryptionKey?: string;
  rotationIntervalHours: number;
  enableAuditLogging: boolean;
  enableKeyRotation: boolean;
  maxKeyAge: number;
}

export interface SecureCredential {
  id: string;
  encryptedValue: string;
  keyId: string;
  createdAt: Date;
  lastUsed: Date;
  expiresAt?: Date;
  metadata: {
    service: string;
    purpose: string;
    environment: string;
  };
}

export interface CredentialUsageLog {
  credentialId: string;
  timestamp: Date;
  operation: 'read' | 'encrypt' | 'decrypt' | 'rotate';
  success: boolean;
  source: string;
  ipAddress?: string;
  errorMessage?: string;
}

export class SecureCredentialManager {
  private readonly config: CredentialConfig;
  private readonly credentials: Map<string, SecureCredential> = new Map();
  private readonly encryptionKeys: Map<string, Buffer> = new Map();
  private currentKeyId: string;
  private readonly usageLogs: CredentialUsageLog[] = [];
  private rotationTimer?: NodeJS.Timeout;

  constructor(config: Partial<CredentialConfig> = {}) {
    this.config = {
      rotationIntervalHours: 24,
      enableAuditLogging: true,
      enableKeyRotation: true,
      maxKeyAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      ...config,
    };

    // Initialize with current encryption key
    this.currentKeyId = this.generateKeyId();
    this.initializeEncryptionKeys();
    
    // Start key rotation if enabled
    if (this.config.enableKeyRotation) {
      this.startKeyRotation();
    }
  }

  /**
   * Securely stores an API key or credential
   */
  async storeCredential(
    id: string,
    value: string,
    metadata: {
      service: string;
      purpose: string;
      environment: string;
    },
    expiresAt?: Date
  ): Promise<void> {
    try {
      // Validate input
      if (!value || value.trim().length === 0) {
        throw new Error('Credential value cannot be empty');
      }

      // Encrypt the credential
      const encryptedValue = this.encryptValue(value);
      
      const credential: SecureCredential = {
        id,
        encryptedValue,
        keyId: this.currentKeyId,
        createdAt: new Date(),
        lastUsed: new Date(),
        expiresAt,
        metadata,
      };

      this.credentials.set(id, credential);

      // Log the storage operation
      this.logCredentialUsage({
        credentialId: id,
        timestamp: new Date(),
        operation: 'encrypt',
        success: true,
        source: 'SecureCredentialManager.storeCredential',
      });

      logger.info('Credential stored securely:', {
        credentialId: id,
        service: metadata.service,
        purpose: metadata.purpose,
        environment: metadata.environment,
        hasExpiry: !!expiresAt,
      });

    } catch (error) {
      this.logCredentialUsage({
        credentialId: id,
        timestamp: new Date(),
        operation: 'encrypt',
        success: false,
        source: 'SecureCredentialManager.storeCredential',
        errorMessage: error.message,
      });

      logger.error('Failed to store credential:', {
        credentialId: id,
        error: error.message,
      });

      throw new Error('Failed to store credential securely');
    }
  }

  /**
   * Retrieves and decrypts a credential
   */
  async getCredential(id: string, source: string = 'unknown'): Promise<string | null> {
    try {
      const credential = this.credentials.get(id);
      
      if (!credential) {
        this.logCredentialUsage({
          credentialId: id,
          timestamp: new Date(),
          operation: 'read',
          success: false,
          source,
          errorMessage: 'Credential not found',
        });
        return null;
      }

      // Check if credential has expired
      if (credential.expiresAt && credential.expiresAt < new Date()) {
        this.logCredentialUsage({
          credentialId: id,
          timestamp: new Date(),
          operation: 'read',
          success: false,
          source,
          errorMessage: 'Credential has expired',
        });

        // Remove expired credential
        this.credentials.delete(id);
        logger.warn('Expired credential removed:', { credentialId: id });
        return null;
      }

      // Decrypt the value
      const decryptedValue = this.decryptValue(credential.encryptedValue, credential.keyId);
      
      // Update last used timestamp
      credential.lastUsed = new Date();

      // Log successful access
      this.logCredentialUsage({
        credentialId: id,
        timestamp: new Date(),
        operation: 'read',
        success: true,
        source,
      });

      return decryptedValue;

    } catch (error) {
      this.logCredentialUsage({
        credentialId: id,
        timestamp: new Date(),
        operation: 'read',
        success: false,
        source,
        errorMessage: error.message,
      });

      logger.error('Failed to retrieve credential:', {
        credentialId: id,
        source,
        error: error.message,
      });

      // Return null on error to avoid exposing error details
      return null;
    }
  }

  /**
   * Initializes API credentials from environment variables securely
   */
  async initializeFromEnvironment(): Promise<void> {
    const environment = process.env.NODE_ENV || 'development';
    
    // OpenAI API Key
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      await this.storeCredential('openai_api_key', openaiKey, {
        service: 'openai',
        purpose: 'api_access',
        environment,
      });
      
      // Remove from environment to prevent accidental logging
      delete process.env.OPENAI_API_KEY;
    }

    // Claude API Key
    const claudeKey = process.env.CLAUDE_API_KEY;
    if (claudeKey) {
      await this.storeCredential('claude_api_key', claudeKey, {
        service: 'anthropic',
        purpose: 'api_access',
        environment,
      });
      
      // Remove from environment to prevent accidental logging
      delete process.env.CLAUDE_API_KEY;
    }

    // Any custom AI service keys
    const customKeys = Object.keys(process.env).filter(key => 
      key.includes('API_KEY') && (key.includes('AI') || key.includes('GPT') || key.includes('CLAUDE'))
    );

    for (const keyName of customKeys) {
      const value = process.env[keyName];
      if (value) {
        const normalizedName = keyName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        await this.storeCredential(normalizedName, value, {
          service: 'custom',
          purpose: 'api_access',
          environment,
        });
        
        // Remove from environment
        delete process.env[keyName];
      }
    }

    logger.info('API credentials initialized securely from environment');
  }

  /**
   * Creates a secure error message that doesn't leak credential information
   */
  createSecureErrorMessage(originalError: unknown, operation: string): Error {
    // Never include the original error message in production as it might contain credentials
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      return new Error(`${operation} failed - please check configuration`);
    } else {
      // In development, sanitize the error message
      const sanitizedMessage = this.sanitizeErrorMessage(originalError.message || 'Unknown error');
      return new Error(`${operation} failed: ${sanitizedMessage}`);
    }
  }

  /**
   * Sanitizes error messages to remove potential credential information
   */
  private sanitizeErrorMessage(message: string): string {
    return message
      // Remove OpenAI API keys (sk-..., starts with sk-)
      .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED_OPENAI_KEY]')
      // Remove Claude API keys (starts with claude_)
      .replace(/claude_[a-zA-Z0-9_-]{20,}/g, '[REDACTED_CLAUDE_KEY]')
      // Remove Anthropic API keys (starts with ant_)
      .replace(/ant_[a-zA-Z0-9_-]{20,}/g, '[REDACTED_ANTHROPIC_KEY]')
      // Remove any potential API keys (patterns that look like keys)
      .replace(/[a-zA-Z0-9_-]{20,}/g, '[REDACTED_KEY]')
      // Remove tokens with prefixes
      .replace(/token[:\s=]+[a-zA-Z0-9_-]+/gi, 'token: [REDACTED]')
      // Remove bearer tokens
      .replace(/bearer\s+[a-zA-Z0-9_-]+/gi, 'bearer [REDACTED]')
      // Remove JWT tokens (three base64 parts separated by dots)
      .replace(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]')
      // Remove any long base64-like strings
      .replace(/[A-Za-z0-9+/]{30,}={0,2}/g, '[REDACTED_B64]')
      // Remove authorization headers
      .replace(/authorization[:\s=]+[^\s,]+/gi, 'authorization: [REDACTED]')
      // Remove specific patterns that might appear in error messages
      .replace(/api\s*key\s*[:\s=]+[^\s,]+/gi, 'api key: [REDACTED]')
      .replace(/secret\s*[:\s=]+[^\s,]+/gi, 'secret: [REDACTED]')
      .replace(/password\s*[:\s=]+[^\s,]+/gi, 'password: [REDACTED]')
      // Remove credential patterns in various formats
      .replace(/["']sk-[a-zA-Z0-9]{20,}["']/g, '"[REDACTED_OPENAI_KEY]"')
      .replace(/["']claude_[a-zA-Z0-9_-]{20,}["']/g, '"[REDACTED_CLAUDE_KEY]"')
      .replace(/["']ant_[a-zA-Z0-9_-]{20,}["']/g, '"[REDACTED_ANTHROPIC_KEY]"');
  }

  /**
   * Encrypts a value using AES-256-GCM
   */
  private encryptValue(value: string): string {
    const key = this.getCurrentEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV, authTag, and encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypts a value using AES-256-GCM
   */
  private decryptValue(encryptedValue: string, keyId: string): string {
    const parts = encryptedValue.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted value format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const key = this.getEncryptionKey(keyId);
    if (!key) {
      throw new Error('Encryption key not found');
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Initializes encryption keys
   */
  private initializeEncryptionKeys(): void {
    // Use provided key or generate a new one
    const keyMaterial = this.config.encryptionKey || crypto.randomBytes(32);
    const key = typeof keyMaterial === 'string' ? Buffer.from(keyMaterial, 'hex') : keyMaterial;
    
    this.encryptionKeys.set(this.currentKeyId, key);
  }

  /**
   * Gets the current encryption key
   */
  private getCurrentEncryptionKey(): Buffer {
    const key = this.encryptionKeys.get(this.currentKeyId);
    if (!key) {
      throw new Error('Current encryption key not found');
    }
    return key;
  }

  /**
   * Gets an encryption key by ID
   */
  private getEncryptionKey(keyId: string): Buffer | undefined {
    return this.encryptionKeys.get(keyId);
  }

  /**
   * Generates a unique key ID
   */
  private generateKeyId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Starts automatic key rotation
   */
  private startKeyRotation(): void {
    const intervalMs = this.config.rotationIntervalHours * 60 * 60 * 1000;
    
    this.rotationTimer = setInterval(() => {
      this.rotateEncryptionKeys();
    }, intervalMs);

    logger.info('Key rotation started:', {
      intervalHours: this.config.rotationIntervalHours,
    });
  }

  /**
   * Rotates encryption keys
   */
  private async rotateEncryptionKeys(): Promise<void> {
    try {
      const oldKeyId = this.currentKeyId;
      this.currentKeyId = this.generateKeyId();
      
      // Generate new key
      const newKey = crypto.randomBytes(32);
      this.encryptionKeys.set(this.currentKeyId, newKey);

      // Re-encrypt all credentials with new key
      const reencryptionPromises = Array.from(this.credentials.entries()).map(async ([id, credential]) => {
        try {
          // Decrypt with old key
          const plaintext = this.decryptValue(credential.encryptedValue, credential.keyId);
          
          // Encrypt with new key
          const newEncryptedValue = this.encryptValue(plaintext);
          
          // Update credential
          credential.encryptedValue = newEncryptedValue;
          credential.keyId = this.currentKeyId;

          this.logCredentialUsage({
            credentialId: id,
            timestamp: new Date(),
            operation: 'rotate',
            success: true,
            source: 'SecureCredentialManager.rotateEncryptionKeys',
          });

        } catch (error) {
          logger.error('Failed to rotate credential:', {
            credentialId: id,
            error: error.message,
          });

          this.logCredentialUsage({
            credentialId: id,
            timestamp: new Date(),
            operation: 'rotate',
            success: false,
            source: 'SecureCredentialManager.rotateEncryptionKeys',
            errorMessage: error.message,
          });
        }
      });

      await Promise.all(reencryptionPromises);

      // Keep old key for a while in case of rollback needs
      setTimeout(() => {
        this.encryptionKeys.delete(oldKeyId);
        logger.debug('Old encryption key removed after rotation:', { oldKeyId });
      }, 60 * 60 * 1000); // Keep for 1 hour

      logger.info('Encryption keys rotated successfully:', {
        newKeyId: this.currentKeyId,
        credentialsReencrypted: this.credentials.size,
      });

    } catch (error) {
      logger.error('Key rotation failed:', error);
    }
  }

  /**
   * Logs credential usage for audit purposes
   */
  private logCredentialUsage(log: CredentialUsageLog): void {
    if (!this.config.enableAuditLogging) return;

    this.usageLogs.push(log);

    // Keep only recent logs (last 1000 entries)
    if (this.usageLogs.length > 1000) {
      this.usageLogs.splice(0, this.usageLogs.length - 1000);
    }

    // Log security events
    if (!log.success || log.operation === 'rotate') {
      logger.info('Credential usage audit:', {
        credentialId: log.credentialId,
        operation: log.operation,
        success: log.success,
        source: log.source,
        timestamp: log.timestamp,
        errorMessage: log.errorMessage,
      });
    }
  }

  /**
   * Gets audit logs for monitoring
   */
  getAuditLogs(limit: number = 100): CredentialUsageLog[] {
    return this.usageLogs
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Gets credential metadata without exposing the actual credential
   */
  getCredentialMetadata(id: string): Omit<SecureCredential, 'encryptedValue'> | null {
    const credential = this.credentials.get(id);
    if (!credential) return null;

    const { encryptedValue, ...metadata } = credential;
    return metadata;
  }

  /**
   * Removes a credential securely
   */
  async removeCredential(id: string): Promise<boolean> {
    const credential = this.credentials.get(id);
    if (!credential) return false;

    this.credentials.delete(id);

    this.logCredentialUsage({
      credentialId: id,
      timestamp: new Date(),
      operation: 'read', // Using 'read' as operation type since 'delete' isn't in the type
      success: true,
      source: 'SecureCredentialManager.removeCredential',
    });

    logger.info('Credential removed:', { credentialId: id });
    return true;
  }

  /**
   * Health check for the credential manager
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      encryptionKeys: number;
      credentials: number;
      keyRotationEnabled: boolean;
      lastRotation?: Date;
      auditLogsCount: number;
    };
  }> {
    const credentialCount = this.credentials.size;
    const keyCount = this.encryptionKeys.size;
    const auditLogsCount = this.usageLogs.length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check if we have encryption keys
    if (keyCount === 0) {
      status = 'unhealthy';
    }

    // Check if current key exists
    if (!this.encryptionKeys.has(this.currentKeyId)) {
      status = 'unhealthy';
    }

    return {
      status,
      details: {
        encryptionKeys: keyCount,
        credentials: credentialCount,
        keyRotationEnabled: this.config.enableKeyRotation,
        auditLogsCount,
      },
    };
  }

  /**
   * Cleanup method to stop timers and clear sensitive data
   */
  async cleanup(): Promise<void> {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }

    // Clear encryption keys
    this.encryptionKeys.clear();
    
    // Clear credentials
    this.credentials.clear();

    // Clear audit logs
    this.usageLogs.length = 0;

    logger.info('Credential manager cleaned up');
  }
}

// Export singleton instance
export const secureCredentialManager = new SecureCredentialManager();