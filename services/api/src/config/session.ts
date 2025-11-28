import session from 'express-session';
const redisModule = require('redis');
const { createClient } = redisModule;
import { Application } from 'express';

import { redis } from '../services/redis';
import { logger } from '../utils/logger';
import { secretManager } from './secrets';

// Import connect-redis properly for newer versions
let RedisStore: unknown;
try {
  const connectRedis = require('connect-redis');
  RedisStore = connectRedis.default ? connectRedis.default(session) : connectRedis(session);
} catch (error) {
  logger.warn('connect-redis not available, sessions will use memory store');
}

interface SessionConfig {
  secret: string;
  name?: string;
  resave?: boolean;
  saveUninitialized?: boolean;
  rolling?: boolean;
  proxy?: boolean;
  cookie: {
    secure: boolean;
    httpOnly: boolean;
    maxAge: number;
    sameSite: 'strict' | 'lax' | 'none';
    domain?: string;
    path?: string;
  };
  store?: session.Store;
  genid?: () => string;
}

/**
 * Generate secure session ID
 */
function generateSecureSessionId(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create session configuration for production
 */
export function createSessionConfig(): SessionConfig {
  const isProduction = process.env.NODE_ENV === 'production';

  // Get or generate session secret
  const sessionSecret = secretManager.getSecret('SESSION_SECRET') ||
                        secretManager.generateSecureSecret(64);

  const config: SessionConfig = {
    secret: sessionSecret,
    name: process.env.SESSION_NAME || 'upcoach.sid',
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't save empty sessions
    rolling: true, // Reset expiry on activity
    proxy: isProduction, // Trust proxy in production
    cookie: {
      secure: isProduction, // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'), // 24 hours default
      sameSite: 'strict', // CSRF protection
      domain: process.env.COOKIE_DOMAIN || undefined,
      path: '/',
    },
    genid: generateSecureSessionId,
  };

  // Use Redis store in production for distributed sessions
  if (isProduction || process.env.USE_REDIS_SESSIONS === 'true') {
    config.store = new RedisStore({
      client: redis as unknown,
      prefix: 'sess:',
      ttl: config.cookie.maxAge / 1000, // TTL in seconds
      disableTouch: false, // Enable touch to reset TTL
      logErrors: (error: Error) => {
        logger.error('Redis session store error:', error);
      },
    });

    logger.info('Using Redis session store for distributed sessions');
  } else {
    logger.info('Using in-memory session store (development mode)');
  }

  return config;
}

/**
 * Configure session middleware for Express app
 */
export function configureSession(app: Application): void {
  const sessionConfig = createSessionConfig();

  // Add session middleware
  app.use(session(sessionConfig));

  // Add session security headers
  app.use((req, res, next) => {
    // Regenerate session ID on login for security
    if (req.body?.action === 'login' && req.session) {
      req.session.regenerate((err) => {
        if (err) {
          logger.error('Session regeneration error:', err);
        }
        next();
      });
    } else {
      next();
    }
  });

  // Session cleanup middleware
  app.use((req, res, next) => {
    // Check for session fixation attacks
    if (req.session && req.session.userId) {
      const sessionAge = Date.now() - (req.session.createdAt || 0);
      const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

      if (sessionAge > maxSessionAge) {
        req.session.destroy((err) => {
          if (err) {
            logger.error('Session destruction error:', err);
          }
        });
        return res.status(401).json({
          success: false,
          error: 'Session expired',
          message: 'Please login again',
        });
      }
    }

    next();
  });

  logger.info('Session middleware configured successfully');
}

/**
 * Session manager for handling session operations
 */
export class SessionManager {
  private static instance: SessionManager;

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Create a new session for a user
   */
  async createSession(req: unknown, userId: number, metadata?: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.regenerate((err: Error) => {
        if (err) {
          logger.error('Session creation error:', err);
          return reject(err);
        }

        req.session.userId = userId;
        req.session.createdAt = Date.now();
        req.session.lastActivity = Date.now();
        req.session.metadata = metadata || {};

        req.session.save((err: Error) => {
          if (err) {
            logger.error('Session save error:', err);
            return reject(err);
          }

          logger.info('Session created', {
            userId,
            sessionId: req.sessionID,
          });

          resolve();
        });
      });
    });
  }

  /**
   * Destroy a session
   */
  async destroySession(req: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      const sessionId = req.sessionID;
      const userId = req.session?.userId;

      req.session.destroy((err: Error) => {
        if (err) {
          logger.error('Session destruction error:', err);
          return reject(err);
        }

        logger.info('Session destroyed', {
          userId,
          sessionId,
        });

        resolve();
      });
    });
  }

  /**
   * Update session activity timestamp
   */
  updateActivity(req: unknown): void {
    if (req.session) {
      req.session.lastActivity = Date.now();
    }
  }

  /**
   * Get all active sessions for a user (for security monitoring)
   */
  async getUserSessions(userId: number): Promise<string[]> {
    try {
      const pattern = `sess:*`;
      const keys = await redis.keys(pattern);
      const userSessions: string[] = [];

      for (const key of keys) {
        const sessionData = await redis.get(key);
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            if (session.userId === userId) {
              userSessions.push(key.replace('sess:', ''));
            }
          } catch (parseError) {
            // Skip invalid session data
          }
        }
      }

      return userSessions;
    } catch (error) {
      logger.error('Error fetching user sessions:', error);
      return [];
    }
  }

  /**
   * Invalidate all sessions for a user (for security)
   */
  async invalidateAllUserSessions(userId: number): Promise<number> {
    try {
      const sessions = await this.getUserSessions(userId);
      let invalidatedCount = 0;

      for (const sessionId of sessions) {
        const deleted = await redis.del(`sess:${sessionId}`);
        if (deleted) {
          invalidatedCount++;
        }
      }

      logger.info(`Invalidated ${invalidatedCount} sessions for user ${userId}`);
      return invalidatedCount;
    } catch (error) {
      logger.error('Error invalidating user sessions:', error);
      return 0;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const pattern = `sess:*`;
      const keys = await redis.keys(pattern);
      let cleanedCount = 0;
      const now = Date.now();
      const maxAge = parseInt(process.env.SESSION_MAX_AGE || '86400000');

      for (const key of keys) {
        const sessionData = await redis.get(key);
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            const sessionAge = now - (session.createdAt || 0);

            if (sessionAge > maxAge) {
              const deleted = await redis.del(key);
              if (deleted) {
                cleanedCount++;
              }
            }
          } catch (parseError) {
            // Remove invalid session data
            await redis.del(key);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} expired sessions`);
      }

      return cleanedCount;
    } catch (error) {
      logger.error('Error cleaning up sessions:', error);
      return 0;
    }
  }

  /**
   * Monitor session anomalies for security
   */
  async detectSessionAnomalies(req: unknown): Promise<boolean> {
    if (!req.session || !req.session.userId) {
      return false;
    }

    try {
      // Check for concurrent sessions from different IPs
      const sessions = await this.getUserSessions(req.session.userId);
      const sessionDetails: unknown[] = [];

      for (const sessionId of sessions) {
        const sessionData = await redis.get(`sess:${sessionId}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          sessionDetails.push({
            id: sessionId,
            ip: session.metadata?.ip,
            userAgent: session.metadata?.userAgent,
            lastActivity: session.lastActivity,
          });
        }
      }

      // Detect anomalies
      const currentIp = req.ip;
      const currentUserAgent = req.get('user-agent');

      const suspiciousSessions = sessionDetails.filter(s => {
        // Different IP in last 5 minutes
        const recentActivity = Date.now() - s.lastActivity < 5 * 60 * 1000;
        const differentIp = s.ip && s.ip !== currentIp;
        const differentAgent = s.userAgent && s.userAgent !== currentUserAgent;

        return recentActivity && (differentIp || differentAgent);
      });

      if (suspiciousSessions.length > 0) {
        logger.warn('Session anomaly detected', {
          userId: req.session.userId,
          currentIp,
          suspiciousSessions,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error detecting session anomalies:', error);
      return false;
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

/**
 * Session validation middleware
 */
export function validateSession(req: unknown, res: unknown, next: unknown): void {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'No active session',
      message: 'Please login to continue',
    });
  }

  // Update activity timestamp
  sessionManager.updateActivity(req);

  // Check for session anomalies
  sessionManager.detectSessionAnomalies(req).then(hasAnomalies => {
    if (hasAnomalies) {
      // Log but don't block for now (can be configured)
      logger.warn('Session anomaly detected but allowing request', {
        userId: req.session.userId,
        sessionId: req.sessionID,
      });
    }
  }).catch(error => {
    logger.error('Failed to detect session anomalies', { error: error instanceof Error ? error.message : 'Unknown error' });
  });

  next();
}

/**
 * Scheduled job to clean up expired sessions
 */
export function scheduleSessionCleanup(): void {
  const cleanupInterval = parseInt(process.env.SESSION_CLEANUP_INTERVAL || '3600000'); // 1 hour default

  setInterval(async () => {
    try {
      await sessionManager.cleanupExpiredSessions();
    } catch (error) {
      logger.error('Session cleanup job error:', error);
    }
  }, cleanupInterval);

  logger.info(`Session cleanup scheduled every ${cleanupInterval / 1000} seconds`);
}