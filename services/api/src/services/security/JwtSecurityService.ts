import * as crypto from 'crypto';
import { sign, verify, decode, JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { redis } from '../redis';
import { logger } from '../../utils/logger';
import { ApiError } from '../../utils/apiError';

/**
 * COMPREHENSIVE JWT SECURITY SERVICE
 * Implements enterprise-grade JWT security including:
 * - Cryptographically secure secret generation and rotation
 * - Token binding and fingerprinting
 * - Blacklisting and revocation
 * - Security monitoring and anomaly detection
 */

interface JwtSecrets {
  current: {
    id: string;
    secret: string;
    createdAt: Date;
    algorithm: string;
  };
  previous?: {
    id: string;
    secret: string;
    createdAt: Date;
    algorithm: string;
  };
}

interface TokenMetadata {
  userId: string;
  email: string;
  role: string;
  fingerprint?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

interface SecurityAuditLog {
  timestamp: Date;
  userId?: string;
  event: 'TOKEN_ISSUED' | 'TOKEN_VERIFIED' | 'TOKEN_REVOKED' | 'SECURITY_VIOLATION' | 'SECRET_ROTATED';
  details: unknown;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  ipAddress?: string;
  userAgent?: string;
}

export class JwtSecurityService {
  private static instance: JwtSecurityService;
  private secrets: JwtSecrets;
  private rotationIntervalMs: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.initializeSecrets();
  }

  static getInstance(): JwtSecurityService {
    if (!JwtSecurityService.instance) {
      JwtSecurityService.instance = new JwtSecurityService();
    }
    return JwtSecurityService.instance;
  }

  /**
   * Initialize JWT secrets with cryptographically secure generation
   */
  private async initializeSecrets(): Promise<void> {
    try {
      // Try to load existing secrets from Redis
      const storedSecrets = await redis.get('jwt:secrets');

      if (storedSecrets) {
        this.secrets = JSON.parse(storedSecrets);

        // Check if rotation is needed
        const age = Date.now() - new Date(this.secrets.current.createdAt).getTime();
        if (age > this.rotationIntervalMs) {
          await this.rotateSecrets();
        }
      } else {
        // Generate initial secrets
        await this.generateInitialSecrets();
      }

      // Schedule automatic rotation
      this.scheduleSecretRotation();
    } catch (error) {
      logger.error('Failed to initialize JWT secrets:', error);
      throw new Error('JWT security initialization failed');
    }
  }

  /**
   * Generate cryptographically secure JWT secrets
   */
  private generateSecureSecret(): string {
    // Generate 64 bytes (512 bits) of cryptographically secure random data
    const randomBytes = crypto.randomBytes(64);

    // Add timestamp and process PID for additional entropy
    const timestamp = Buffer.from(Date.now().toString());
    const pid = Buffer.from(process.pid.toString());

    // Combine all entropy sources
    const combinedEntropy = Buffer.concat([randomBytes, timestamp, pid]);

    // Create final secret using PBKDF2 for additional security
    const secret = crypto.pbkdf2Sync(combinedEntropy, 'upcoach-jwt-salt', 100000, 64, 'sha512');

    return secret.toString('base64');
  }

  /**
   * Generate initial secrets
   */
  private async generateInitialSecrets(): Promise<void> {
    const secretId = crypto.randomUUID();
    const secret = this.generateSecureSecret();

    this.secrets = {
      current: {
        id: secretId,
        secret,
        createdAt: new Date(),
        algorithm: 'HS512'
      }
    };

    await this.persistSecrets();
    await this.auditLog({
      timestamp: new Date(),
      event: 'SECRET_ROTATED',
      details: { secretId, action: 'initial_generation' },
      severity: 'INFO'
    });

    logger.info('JWT secrets initialized', { secretId });
  }

  /**
   * Rotate JWT secrets
   */
  async rotateSecrets(): Promise<void> {
    try {
      const newSecretId = crypto.randomUUID();
      const newSecret = this.generateSecureSecret();

      // Keep previous secret for token verification during transition
      const previousSecret = this.secrets.current;

      this.secrets = {
        current: {
          id: newSecretId,
          secret: newSecret,
          createdAt: new Date(),
          algorithm: 'HS512'
        },
        previous: previousSecret
      };

      await this.persistSecrets();
      await this.auditLog({
        timestamp: new Date(),
        event: 'SECRET_ROTATED',
        details: {
          newSecretId,
          previousSecretId: previousSecret.id,
          rotationReason: 'scheduled_rotation'
        },
        severity: 'INFO'
      });

      logger.info('JWT secrets rotated', {
        newSecretId,
        previousSecretId: previousSecret.id
      });

      // Clean up old secret after grace period (1 hour)
      setTimeout(() => {
        this.cleanupOldSecret();
      }, 60 * 60 * 1000);

    } catch (error) {
      logger.error('Secret rotation failed:', error);
      await this.auditLog({
        timestamp: new Date(),
        event: 'SECRET_ROTATED',
        details: { error: error.message, action: 'rotation_failed' },
        severity: 'CRITICAL'
      });
      throw error;
    }
  }

  /**
   * Clean up old secrets
   */
  private async cleanupOldSecret(): Promise<void> {
    if (this.secrets.previous) {
      const oldSecretId = this.secrets.previous.id;
      delete this.secrets.previous;
      await this.persistSecrets();

      logger.info('Old JWT secret cleaned up', { secretId: oldSecretId });
    }
  }

  /**
   * Persist secrets to Redis with encryption
   */
  private async persistSecrets(): Promise<void> {
    const encryptedSecrets = this.encryptSecrets(JSON.stringify(this.secrets));
    await redis.setEx('jwt:secrets', 7 * 24 * 60 * 60, encryptedSecrets); // 7 days TTL
  }

  /**
   * Encrypt secrets before storage
   */
  private encryptSecrets(data: string): string {
    const key = crypto.scryptSync(process.env.MASTER_KEY || 'default-master-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}:${cipher.getAuthTag().toString('hex')}`;
  }

  /**
   * Schedule automatic secret rotation
   */
  private scheduleSecretRotation(): void {
    setInterval(async () => {
      try {
        await this.rotateSecrets();
      } catch (error) {
        logger.error('Scheduled secret rotation failed:', error);
      }
    }, this.rotationIntervalMs);
  }

  /**
   * Generate secure JWT token with enhanced security features
   */
  async generateToken(
    metadata: TokenMetadata,
    expiresIn: string = '15m',
    options: {
      includeFingerprint?: boolean;
      bindToDevice?: boolean;
      restrictToIP?: boolean;
    } = {}
  ): Promise<{ token: string; tokenId: string; fingerprint?: string }> {
    try {
      const tokenId = crypto.randomUUID();
      const sessionId = crypto.randomUUID();

      // Generate device fingerprint if requested
      let fingerprint: string | undefined;
      if (options.includeFingerprint) {
        fingerprint = this.generateDeviceFingerprint(metadata);
      }

      const payload = {
        sub: metadata.userId,
        email: metadata.email,
        role: metadata.role,
        jti: tokenId,
        sid: sessionId,
        iss: 'upcoach-api',
        aud: 'upcoach-client',
        ...(fingerprint && { fingerprint }),
        ...(metadata.deviceId && { deviceId: metadata.deviceId }),
        ...(options.restrictToIP && metadata.ipAddress && { ipAddress: metadata.ipAddress })
      };

      const token = sign(payload, this.secrets.current.secret, {
        algorithm: this.secrets.current.algorithm as unknown,
        expiresIn,
        issuer: 'upcoach-api',
        audience: 'upcoach-client',
        jwtid: tokenId
      });

      // Store token metadata for security monitoring
      await this.storeTokenMetadata(tokenId, {
        ...metadata,
        fingerprint,
        sessionId,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + this.parseExpiry(expiresIn))
      });

      await this.auditLog({
        timestamp: new Date(),
        userId: metadata.userId,
        event: 'TOKEN_ISSUED',
        details: { tokenId, expiresIn, hasFingerprint: !!fingerprint },
        severity: 'INFO',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      });

      return { token, tokenId, fingerprint };
    } catch (error) {
      logger.error('Token generation failed:', error);
      throw new ApiError(500, 'Token generation failed');
    }
  }

  /**
   * Verify JWT token with comprehensive security checks
   */
  async verifyToken(
    token: string,
    options: {
      checkFingerprint?: boolean;
      expectedFingerprint?: string;
      checkIPBinding?: boolean;
      currentIP?: string;
      checkDeviceBinding?: boolean;
      currentDeviceId?: string;
    } = {}
  ): Promise<{ valid: boolean; payload?: unknown; violations?: string[] }> {
    const violations: string[] = [];

    try {
      // Check if token is blacklisted
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const isBlacklisted = await redis.get(`blacklist:${tokenHash}`);

      if (isBlacklisted) {
        violations.push('TOKEN_BLACKLISTED');
        await this.auditLog({
          timestamp: new Date(),
          event: 'SECURITY_VIOLATION',
          details: { violation: 'blacklisted_token_used', tokenHash: tokenHash.substring(0, 16) },
          severity: 'WARN'
        });
        return { valid: false, violations };
      }

      // Try verifying with current secret first
      let payload: unknown;
      try {
        payload = verify(token, this.secrets.current.secret, {
          algorithms: [this.secrets.current.algorithm as unknown],
          issuer: 'upcoach-api',
          audience: 'upcoach-client'
        });
      } catch (error) {
        // If current secret fails, try previous secret (during rotation period)
        if (this.secrets.previous) {
          try {
            payload = verify(token, this.secrets.previous.secret, {
              algorithms: [this.secrets.previous.algorithm as unknown],
              issuer: 'upcoach-api',
              audience: 'upcoach-client'
            });
          } catch (previousError) {
            throw error; // Throw original error
          }
        } else {
          throw error;
        }
      }

      // Retrieve stored token metadata
      const tokenMetadata = await this.getTokenMetadata(payload.jti);
      if (!tokenMetadata) {
        violations.push('TOKEN_METADATA_MISSING');
      }

      // Security checks
      if (options.checkFingerprint && options.expectedFingerprint) {
        if (payload.fingerprint !== options.expectedFingerprint) {
          violations.push('FINGERPRINT_MISMATCH');
        }
      }

      if (options.checkIPBinding && options.currentIP) {
        if (payload.ipAddress && payload.ipAddress !== options.currentIP) {
          violations.push('IP_ADDRESS_MISMATCH');
        }
      }

      if (options.checkDeviceBinding && options.currentDeviceId) {
        if (payload.deviceId && payload.deviceId !== options.currentDeviceId) {
          violations.push('DEVICE_ID_MISMATCH');
        }
      }

      // Check for anomalies
      await this.detectAnomalies(payload, tokenMetadata);

      await this.auditLog({
        timestamp: new Date(),
        userId: payload.sub,
        event: 'TOKEN_VERIFIED',
        details: {
          tokenId: payload.jti,
          violations: violations.length > 0 ? violations : undefined
        },
        severity: violations.length > 0 ? 'WARN' : 'INFO'
      });

      return {
        valid: violations.length === 0,
        payload: violations.length === 0 ? payload : undefined,
        violations: violations.length > 0 ? violations : undefined
      };

    } catch (error) {
      if (error instanceof TokenExpiredError) {
        violations.push('TOKEN_EXPIRED');
      } else if (error instanceof JsonWebTokenError) {
        violations.push('TOKEN_INVALID');
      } else {
        violations.push('VERIFICATION_ERROR');
      }

      await this.auditLog({
        timestamp: new Date(),
        event: 'SECURITY_VIOLATION',
        details: {
          violation: violations[0],
          error: error.message
        },
        severity: 'WARN'
      });

      return { valid: false, violations };
    }
  }

  /**
   * Revoke token by adding to blacklist
   */
  async revokeToken(token: string, reason?: string): Promise<void> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const decoded = decode(token) as unknown;

      if (decoded && decoded.exp) {
        const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));

        if (ttl > 0) {
          await redis.setEx(`blacklist:${tokenHash}`, ttl, JSON.stringify({
            revokedAt: new Date(),
            reason: reason || 'manual_revocation',
            tokenId: decoded.jti
          }));

          // Remove token metadata
          if (decoded.jti) {
            await redis.del(`token:metadata:${decoded.jti}`);
          }

          await this.auditLog({
            timestamp: new Date(),
            userId: decoded.sub,
            event: 'TOKEN_REVOKED',
            details: {
              tokenId: decoded.jti,
              reason: reason || 'manual_revocation'
            },
            severity: 'INFO'
          });
        }
      }
    } catch (error) {
      logger.error('Token revocation failed:', error);
      throw new ApiError(500, 'Token revocation failed');
    }
  }

  /**
   * Generate device fingerprint
   */
  private generateDeviceFingerprint(metadata: TokenMetadata): string {
    const components = [
      metadata.ipAddress || '',
      metadata.userAgent || '',
      metadata.deviceId || ''
    ].join('|');

    return crypto.createHash('sha256').update(components).digest('hex').substring(0, 32);
  }

  /**
   * Store token metadata for security monitoring
   */
  private async storeTokenMetadata(tokenId: string, metadata: unknown): Promise<void> {
    await redis.setEx(
      `token:metadata:${tokenId}`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify(metadata)
    );
  }

  /**
   * Retrieve token metadata
   */
  private async getTokenMetadata(tokenId: string): Promise<unknown> {
    const metadata = await redis.get(`token:metadata:${tokenId}`);
    return metadata ? JSON.parse(metadata) : null;
  }

  /**
   * Detect security anomalies
   */
  private async detectAnomalies(payload: unknown, metadata: unknown): Promise<void> {
    // Check for unusual token usage patterns
    const recentUsage = await redis.get(`token:usage:${payload.jti}`);

    if (recentUsage) {
      const usageData = JSON.parse(recentUsage);

      // Check for rapid successive uses (potential token theft)
      if (Date.now() - usageData.lastUsed < 1000) { // Less than 1 second
        await this.auditLog({
          timestamp: new Date(),
          userId: payload.sub,
          event: 'SECURITY_VIOLATION',
          details: {
            violation: 'rapid_token_reuse',
            tokenId: payload.jti,
            interval: Date.now() - usageData.lastUsed
          },
          severity: 'WARN'
        });
      }
    }

    // Update usage tracking
    await redis.setEx(
      `token:usage:${payload.jti}`,
      300, // 5 minutes
      JSON.stringify({ lastUsed: Date.now() })
    );
  }

  /**
   * Parse expiry string to milliseconds
   */
  private parseExpiry(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000;
    }
  }

  /**
   * Security audit logging
   */
  private async auditLog(log: SecurityAuditLog): Promise<void> {
    const logId = crypto.randomUUID();

    await redis.zadd(
      'security:audit_log',
      Date.now(),
      JSON.stringify({ ...log, logId })
    );

    // Keep only last 10000 entries
    await redis.zremrangebyrank('security:audit_log', 0, -10001);

    // Log critical events immediately
    if (log.severity === 'CRITICAL') {
      logger.error('CRITICAL SECURITY EVENT:', log);
    }
  }

  /**
   * Get security audit logs
   */
  async getAuditLogs(
    startTime?: Date,
    endTime?: Date,
    userId?: string,
    event?: string
  ): Promise<SecurityAuditLog[]> {
    const start = startTime ? startTime.getTime() : '-inf';
    const end = endTime ? endTime.getTime() : '+inf';

    const logs = await redis.zrangebyscore('security:audit_log', start, end);

    return logs
      .map(log => JSON.parse(log))
      .filter(log => !userId || log.userId === userId)
      .filter(log => !event || log.event === event)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Force secret rotation (emergency use)
   */
  async forceSecretRotation(reason: string): Promise<void> {
    await this.auditLog({
      timestamp: new Date(),
      event: 'SECRET_ROTATED',
      details: { rotationReason: 'emergency_rotation', reason },
      severity: 'CRITICAL'
    });

    await this.rotateSecrets();
  }

  /**
   * Get current secret information (for monitoring)
   */
  getCurrentSecretInfo(): { id: string; createdAt: Date; algorithm: string } {
    return {
      id: this.secrets.current.id,
      createdAt: this.secrets.current.createdAt,
      algorithm: this.secrets.current.algorithm
    };
  }
}

// Export singleton instance
export const jwtSecurityService = JwtSecurityService.getInstance();