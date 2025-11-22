import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { redis } from '../redis';
import { logger } from '../../utils/logger';
import { ApiError } from '../../utils/apiError';

/**
 * SECURE SESSION MANAGEMENT SERVICE
 * Implements enterprise-grade session security including:
 * - HttpOnly cookies with secure attributes
 * - Session timeout and idle detection
 * - Cross-tab session synchronization
 * - Concurrent session limiting
 * - Session hijacking protection
 */

interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: Date;
  lastActivityAt: Date;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  isActive: boolean;
  metadata?: unknown;
}

interface SessionOptions {
  maxAge: number; // Session maximum lifetime in seconds
  idleTimeout: number; // Idle timeout in seconds
  maxConcurrentSessions: number; // Maximum concurrent sessions per user
  secureCookies: boolean; // Use secure cookies
  sameSite: 'strict' | 'lax' | 'none'; // SameSite cookie attribute
  domain?: string; // Cookie domain
  path: string; // Cookie path
}

interface SessionSecurityConfig {
  enableCrossTabSync: boolean;
  enableSessionHijackProtection: boolean;
  enableConcurrentSessionLimiting: boolean;
  sessionRotationInterval: number; // Rotate session ID every N minutes
}

const DEFAULT_SESSION_OPTIONS: SessionOptions = {
  maxAge: 8 * 60 * 60, // 8 hours
  idleTimeout: 30 * 60, // 30 minutes
  maxConcurrentSessions: 5,
  secureCookies: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/'
};

const DEFAULT_SECURITY_CONFIG: SessionSecurityConfig = {
  enableCrossTabSync: true,
  enableSessionHijackProtection: true,
  enableConcurrentSessionLimiting: true,
  sessionRotationInterval: 60 // 60 minutes
};

export class SessionSecurityService {
  private static instance: SessionSecurityService;
  private options: SessionOptions;
  private securityConfig: SessionSecurityConfig;

  constructor(
    options: Partial<SessionOptions> = {},
    securityConfig: Partial<SessionSecurityConfig> = {}
  ) {
    this.options = { ...DEFAULT_SESSION_OPTIONS, ...options };
    this.securityConfig = { ...DEFAULT_SECURITY_CONFIG, ...securityConfig };
  }

  static getInstance(): SessionSecurityService {
    if (!SessionSecurityService.instance) {
      SessionSecurityService.instance = new SessionSecurityService();
    }
    return SessionSecurityService.instance;
  }

  /**
   * Generate cryptographically secure session ID
   */
  private generateSessionId(): string {
    // Generate 32 bytes of cryptographically secure random data
    const randomBytes = crypto.randomBytes(32);

    // Add timestamp for uniqueness
    const timestamp = Buffer.from(Date.now().toString());

    // Combine entropy sources
    const combined = Buffer.concat([randomBytes, timestamp]);

    // Create session ID using multiple hash rounds for security
    let sessionId = crypto.createHash('sha256').update(combined).digest('hex');

    // Additional entropy round
    sessionId = crypto.createHash('sha256').update(sessionId + crypto.randomBytes(16).toString('hex')).digest('hex');

    return sessionId;
  }

  /**
   * Generate device fingerprint for session binding
   */
  private generateDeviceFingerprint(req: Request): string {
    const components = [
      req.ip,
      req.headers['user-agent'] || '',
      req.headers['accept-language'] || '',
      req.headers['accept-encoding'] || ''
    ].join('|');

    return crypto.createHash('sha256').update(components).digest('hex').substring(0, 32);
  }

  /**
   * Create secure session
   */
  async createSession(
    userId: string,
    email: string,
    role: string,
    req: Request,
    res: Response,
    metadata: unknown = {}
  ): Promise<string> {
    try {
      const sessionId = this.generateSessionId();
      const deviceFingerprint = this.generateDeviceFingerprint(req);

      // Check concurrent session limit
      if (this.securityConfig.enableConcurrentSessionLimiting) {
        await this.enforceConcurrentSessionLimit(userId);
      }

      const sessionData: SessionData = {
        userId,
        email,
        role,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        deviceFingerprint,
        isActive: true,
        metadata
      };

      // Store session data in Redis
      await redis.setEx(
        `session:${sessionId}`,
        this.options.maxAge,
        JSON.stringify(sessionData)
      );

      // Track user sessions for concurrent session management
      await redis.sadd(`user_sessions:${userId}`, sessionId);
      await redis.expire(`user_sessions:${userId}`, this.options.maxAge);

      // Set secure HTTP-only cookie
      this.setSessionCookie(res, sessionId);

      // Schedule session rotation
      if (this.securityConfig.sessionRotationInterval > 0) {
        setTimeout(() => {
          this.scheduleSessionRotation(sessionId);
        }, this.securityConfig.sessionRotationInterval * 60 * 1000);
      }

      await this.logSessionEvent('SESSION_CREATED', sessionId, userId, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        deviceFingerprint
      });

      logger.info('Secure session created', {
        sessionId: sessionId.substring(0, 16) + '...',
        userId,
        ipAddress: req.ip
      });

      return sessionId;
    } catch (error) {
      logger.error('Session creation failed:', error);
      throw new ApiError(500, 'Session creation failed');
    }
  }

  /**
   * Validate and retrieve session
   */
  async validateSession(
    sessionId: string,
    req: Request
  ): Promise<{ valid: boolean; sessionData?: SessionData; violations?: string[] }> {
    const violations: string[] = [];

    try {
      if (!sessionId) {
        return { valid: false, violations: ['SESSION_ID_MISSING'] };
      }

      // Retrieve session data
      const sessionDataString = await redis.get(`session:${sessionId}`);
      if (!sessionDataString) {
        violations.push('SESSION_NOT_FOUND');
        return { valid: false, violations };
      }

      const sessionData: SessionData = JSON.parse(sessionDataString);

      // Check if session is active
      if (!sessionData.isActive) {
        violations.push('SESSION_INACTIVE');
      }

      // Check session expiry
      const now = Date.now();
      const sessionAge = now - new Date(sessionData.createdAt).getTime();
      const idleTime = now - new Date(sessionData.lastActivityAt).getTime();

      if (sessionAge > this.options.maxAge * 1000) {
        violations.push('SESSION_EXPIRED');
      }

      if (idleTime > this.options.idleTimeout * 1000) {
        violations.push('SESSION_IDLE_TIMEOUT');
      }

      // Security checks
      if (this.securityConfig.enableSessionHijackProtection) {
        // Check device fingerprint
        const currentFingerprint = this.generateDeviceFingerprint(req);
        if (sessionData.deviceFingerprint !== currentFingerprint) {
          violations.push('DEVICE_FINGERPRINT_MISMATCH');
          await this.logSessionEvent('SECURITY_VIOLATION', sessionId, sessionData.userId, {
            violation: 'device_fingerprint_mismatch',
            expected: sessionData.deviceFingerprint,
            actual: currentFingerprint,
            ipAddress: req.ip
          });
        }

        // Check IP address changes (configurable strictness)
        if (process.env.STRICT_IP_VALIDATION === 'true' && sessionData.ipAddress !== req.ip) {
          violations.push('IP_ADDRESS_CHANGE');
          await this.logSessionEvent('SECURITY_VIOLATION', sessionId, sessionData.userId, {
            violation: 'ip_address_change',
            originalIP: sessionData.ipAddress,
            currentIP: req.ip
          });
        }
      }

      // If session is valid, update last activity
      if (violations.length === 0) {
        await this.updateSessionActivity(sessionId, sessionData);
      } else {
        // Log security violations
        await this.logSessionEvent('SESSION_VALIDATION_FAILED', sessionId, sessionData.userId, {
          violations,
          ipAddress: req.ip
        });
      }

      return {
        valid: violations.length === 0,
        sessionData: violations.length === 0 ? sessionData : undefined,
        violations: violations.length > 0 ? violations : undefined
      };

    } catch (error) {
      logger.error('Session validation error:', error);
      return { valid: false, violations: ['VALIDATION_ERROR'] };
    }
  }

  /**
   * Update session activity timestamp
   */
  private async updateSessionActivity(sessionId: string, sessionData: SessionData): Promise<void> {
    sessionData.lastActivityAt = new Date();

    await redis.setEx(
      `session:${sessionId}`,
      this.options.maxAge,
      JSON.stringify(sessionData)
    );
  }

  /**
   * Destroy session
   */
  async destroySession(sessionId: string, res: Response, reason: string = 'logout'): Promise<void> {
    try {
      // Get session data for logging
      const sessionDataString = await redis.get(`session:${sessionId}`);
      let userId = 'unknown';

      if (sessionDataString) {
        const sessionData: SessionData = JSON.parse(sessionDataString);
        userId = sessionData.userId;

        // Remove from user sessions set
        await redis.srem(`user_sessions:${userId}`, sessionId);
      }

      // Delete session
      await redis.del(`session:${sessionId}`);

      // Clear session cookie
      this.clearSessionCookie(res);

      await this.logSessionEvent('SESSION_DESTROYED', sessionId, userId, { reason });

      logger.info('Session destroyed', {
        sessionId: sessionId.substring(0, 16) + '...',
        userId,
        reason
      });
    } catch (error) {
      logger.error('Session destruction failed:', error);
      throw new ApiError(500, 'Session destruction failed');
    }
  }

  /**
   * Destroy all user sessions
   */
  async destroyAllUserSessions(userId: string, reason: string = 'security'): Promise<void> {
    try {
      const sessionIds = await redis.smembers(`user_sessions:${userId}`);

      for (const sessionId of sessionIds) {
        await redis.del(`session:${sessionId}`);
        await this.logSessionEvent('SESSION_DESTROYED', sessionId, userId, { reason });
      }

      await redis.del(`user_sessions:${userId}`);

      logger.info('All user sessions destroyed', { userId, count: sessionIds.length, reason });
    } catch (error) {
      logger.error('Bulk session destruction failed:', error);
      throw new ApiError(500, 'Bulk session destruction failed');
    }
  }

  /**
   * Enforce concurrent session limit
   */
  private async enforceConcurrentSessionLimit(userId: string): Promise<void> {
    const sessionIds = await redis.smembers(`user_sessions:${userId}`);

    if (sessionIds.length >= this.options.maxConcurrentSessions) {
      // Remove oldest sessions
      const sessionsToRemove = sessionIds.slice(0, sessionIds.length - this.options.maxConcurrentSessions + 1);

      for (const sessionId of sessionsToRemove) {
        await redis.del(`session:${sessionId}`);
        await redis.srem(`user_sessions:${userId}`, sessionId);
        await this.logSessionEvent('SESSION_DESTROYED', sessionId, userId, {
          reason: 'concurrent_session_limit'
        });
      }

      logger.info('Concurrent session limit enforced', {
        userId,
        removedSessions: sessionsToRemove.length
      });
    }
  }

  /**
   * Set secure session cookie
   */
  private setSessionCookie(res: Response, sessionId: string): void {
    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: this.options.secureCookies,
      sameSite: this.options.sameSite,
      maxAge: this.options.maxAge * 1000,
      domain: this.options.domain,
      path: this.options.path,
      signed: false // We handle our own session integrity
    });
  }

  /**
   * Clear session cookie
   */
  private clearSessionCookie(res: Response): void {
    res.clearCookie('session_id', {
      httpOnly: true,
      secure: this.options.secureCookies,
      sameSite: this.options.sameSite,
      domain: this.options.domain,
      path: this.options.path
    });
  }

  /**
   * Schedule session rotation
   */
  private async scheduleSessionRotation(sessionId: string): Promise<void> {
    try {
      const sessionDataString = await redis.get(`session:${sessionId}`);
      if (!sessionDataString) return;

      const sessionData: SessionData = JSON.parse(sessionDataString);
      const newSessionId = this.generateSessionId();

      // Create new session with same data
      await redis.setEx(
        `session:${newSessionId}`,
        this.options.maxAge,
        JSON.stringify(sessionData)
      );

      // Update user sessions set
      await redis.srem(`user_sessions:${sessionData.userId}`, sessionId);
      await redis.sadd(`user_sessions:${sessionData.userId}`, newSessionId);

      // Delete old session
      await redis.del(`session:${sessionId}`);

      await this.logSessionEvent('SESSION_ROTATED', newSessionId, sessionData.userId, {
        oldSessionId: sessionId,
        reason: 'scheduled_rotation'
      });

      logger.info('Session rotated', {
        oldSessionId: sessionId.substring(0, 16) + '...',
        newSessionId: newSessionId.substring(0, 16) + '...',
        userId: sessionData.userId
      });

    } catch (error) {
      logger.error('Session rotation failed:', error);
    }
  }

  /**
   * Cross-tab session synchronization
   */
  async syncCrossTabSessions(userId: string): Promise<string[]> {
    if (!this.securityConfig.enableCrossTabSync) {
      return [];
    }

    const sessionIds = await redis.smembers(`user_sessions:${userId}`);
    const activeSessions: string[] = [];

    for (const sessionId of sessionIds) {
      const sessionData = await redis.get(`session:${sessionId}`);
      if (sessionData) {
        const session: SessionData = JSON.parse(sessionData);
        if (session.isActive) {
          activeSessions.push(sessionId);
        }
      } else {
        // Clean up orphaned session references
        await redis.srem(`user_sessions:${userId}`, sessionId);
      }
    }

    return activeSessions;
  }

  /**
   * Get user session information
   */
  async getUserSessions(userId: string): Promise<any[]> {
    const sessionIds = await redis.smembers(`user_sessions:${userId}`);
    const sessions = [];

    for (const sessionId of sessionIds) {
      const sessionDataString = await redis.get(`session:${sessionId}`);
      if (sessionDataString) {
        const sessionData: SessionData = JSON.parse(sessionDataString);
        sessions.push({
          sessionId: sessionId.substring(0, 16) + '...',
          createdAt: sessionData.createdAt,
          lastActivityAt: sessionData.lastActivityAt,
          ipAddress: sessionData.ipAddress,
          userAgent: sessionData.userAgent,
          isActive: sessionData.isActive
        });
      }
    }

    return sessions;
  }

  /**
   * Session middleware
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const sessionId = req.cookies.session_id;

        if (!sessionId) {
          return next();
        }

        const validation = await this.validateSession(sessionId, req);

        if (validation.valid && validation.sessionData) {
          // Attach session data to request
          req.session = validation.sessionData;
          req.sessionId = sessionId;
        } else {
          // Clear invalid session cookie
          this.clearSessionCookie(res);

          if (validation.violations?.includes('DEVICE_FINGERPRINT_MISMATCH') ||
              validation.violations?.includes('IP_ADDRESS_CHANGE')) {
            logger.warn('Session security violation detected', {
              sessionId: sessionId.substring(0, 16) + '...',
              violations: validation.violations,
              ipAddress: req.ip
            });
          }
        }

        next();
      } catch (error) {
        logger.error('Session middleware error:', error);
        next();
      }
    };
  }

  /**
   * Log session events for security auditing
   */
  private async logSessionEvent(
    event: string,
    sessionId: string,
    userId: string,
    details: unknown
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date(),
      event,
      sessionId: sessionId.substring(0, 16) + '...',
      userId,
      details
    };

    await redis.zadd(
      'session:audit_log',
      Date.now(),
      JSON.stringify(logEntry)
    );

    // Keep only last 50000 entries
    await redis.zremrangebyrank('session:audit_log', 0, -50001);
  }

  /**
   * Get session audit logs
   */
  async getSessionAuditLogs(
    startTime?: Date,
    endTime?: Date,
    userId?: string
  ): Promise<any[]> {
    const start = startTime ? startTime.getTime() : '-inf';
    const end = endTime ? endTime.getTime() : '+inf';

    const logs = await redis.zrangebyscore('session:audit_log', start, end);

    return logs
      .map(log => JSON.parse(log))
      .filter(log => !userId || log.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

// Export singleton instance
export const sessionSecurityService = SessionSecurityService.getInstance();