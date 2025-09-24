/**
 * Advanced Rate Limiting with AI-based threat detection
 * Implements adaptive rate limiting based on behavioral analysis
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { redis } from '../services/redis';
import { logger } from '../utils/logger';

interface RequestPattern {
  timestamp: number;
  endpoint: string;
  method: string;
  userAgent: string;
  ipAddress: string;
  responseTime: number;
  statusCode: number;
  payloadSize: number;
}

interface ThreatScore {
  score: number; // 0-100, higher = more suspicious
  reasons: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  enableThreatDetection?: boolean;
  adaptiveThreshold?: boolean;
  blockDuration?: number; // in seconds
}

class AdvancedRateLimiter {
  private static readonly THREAT_PATTERNS = {
    // Rapid sequential requests to different endpoints
    ENDPOINT_SCANNING: {
      pattern: 'multiple_endpoints_rapid',
      weight: 30,
      description: 'Rapid requests to multiple different endpoints'
    },

    // Unusual request timing patterns
    TIMING_ANOMALY: {
      pattern: 'timing_anomaly',
      weight: 25,
      description: 'Unusual request timing patterns'
    },

    // Large payload attacks
    PAYLOAD_ATTACK: {
      pattern: 'large_payload',
      weight: 20,
      description: 'Consistently large request payloads'
    },

    // User agent rotation
    USER_AGENT_ROTATION: {
      pattern: 'ua_rotation',
      weight: 35,
      description: 'Frequent user agent changes'
    },

    // Error rate patterns
    HIGH_ERROR_RATE: {
      pattern: 'high_errors',
      weight: 40,
      description: 'High rate of error responses'
    },

    // Authentication failures
    AUTH_BRUTE_FORCE: {
      pattern: 'auth_brute_force',
      weight: 50,
      description: 'Multiple authentication failures'
    }
  };

  /**
   * Analyze request patterns to detect threats
   */
  static async analyzeThreatPattern(
    ipAddress: string,
    userAgent: string,
    endpoint: string,
    method: string
  ): Promise<ThreatScore> {
    const threatScore: ThreatScore = {
      score: 0,
      reasons: [],
      severity: 'low'
    };

    try {
      // Get recent request history for this IP
      const historyKey = `request_history:${ipAddress}`;
      const history = await redis.lrange(historyKey, 0, 99); // Last 100 requests

      if (history.length < 5) {
        return threatScore; // Not enough data for analysis
      }

      const patterns = history.map(item => JSON.parse(item) as RequestPattern);

      // 1. Endpoint scanning detection
      const uniqueEndpoints = new Set(patterns.slice(0, 20).map(p => p.endpoint));
      if (uniqueEndpoints.size > 15) {
        threatScore.score += this.THREAT_PATTERNS.ENDPOINT_SCANNING.weight;
        threatScore.reasons.push(this.THREAT_PATTERNS.ENDPOINT_SCANNING.description);
      }

      // 2. Timing anomaly detection
      const intervals = [];
      for (let i = 1; i < Math.min(patterns.length, 20); i++) {
        intervals.push(patterns[i-1].timestamp - patterns[i].timestamp);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const rapidRequests = intervals.filter(interval => interval < 100).length; // <100ms intervals

      if (rapidRequests > intervals.length * 0.7) {
        threatScore.score += this.THREAT_PATTERNS.TIMING_ANOMALY.weight;
        threatScore.reasons.push(this.THREAT_PATTERNS.TIMING_ANOMALY.description);
      }

      // 3. User agent rotation detection
      const uniqueUserAgents = new Set(patterns.slice(0, 20).map(p => p.userAgent));
      if (uniqueUserAgents.size > 5) {
        threatScore.score += this.THREAT_PATTERNS.USER_AGENT_ROTATION.weight;
        threatScore.reasons.push(this.THREAT_PATTERNS.USER_AGENT_ROTATION.description);
      }

      // 4. Error rate analysis
      const errorCount = patterns.slice(0, 20).filter(p => p.statusCode >= 400).length;
      const errorRate = errorCount / Math.min(patterns.length, 20);

      if (errorRate > 0.6) {
        threatScore.score += this.THREAT_PATTERNS.HIGH_ERROR_RATE.weight;
        threatScore.reasons.push(this.THREAT_PATTERNS.HIGH_ERROR_RATE.description);
      }

      // 5. Authentication brute force detection
      const authEndpoints = patterns.slice(0, 20).filter(p =>
        p.endpoint.includes('/auth/') || p.endpoint.includes('/login')
      );
      const authErrors = authEndpoints.filter(p => p.statusCode === 401 || p.statusCode === 403);

      if (authErrors.length > 5) {
        threatScore.score += this.THREAT_PATTERNS.AUTH_BRUTE_FORCE.weight;
        threatScore.reasons.push(this.THREAT_PATTERNS.AUTH_BRUTE_FORCE.description);
      }

      // 6. Payload size analysis
      const largePaylods = patterns.slice(0, 10).filter(p => p.payloadSize > 1000000); // >1MB
      if (largePaylods.length > 3) {
        threatScore.score += this.THREAT_PATTERNS.PAYLOAD_ATTACK.weight;
        threatScore.reasons.push(this.THREAT_PATTERNS.PAYLOAD_ATTACK.description);
      }

      // Determine severity
      if (threatScore.score >= 80) {
        threatScore.severity = 'critical';
      } else if (threatScore.score >= 60) {
        threatScore.severity = 'high';
      } else if (threatScore.score >= 40) {
        threatScore.severity = 'medium';
      }

      return threatScore;
    } catch (error) {
      logger.error('Error analyzing threat patterns:', error);
      return threatScore;
    }
  }

  /**
   * Store request pattern for analysis
   */
  static async storeRequestPattern(
    req: Request,
    res: Response,
    responseTime: number
  ): Promise<void> {
    try {
      const pattern: RequestPattern = {
        timestamp: Date.now(),
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('user-agent') || 'unknown',
        ipAddress: req.ip || 'unknown',
        responseTime,
        statusCode: res.statusCode,
        payloadSize: JSON.stringify(req.body || {}).length
      };

      const historyKey = `request_history:${req.ip}`;

      // Store pattern
      await redis.lpush(historyKey, JSON.stringify(pattern));

      // Keep only last 100 requests
      await redis.ltrim(historyKey, 0, 99);

      // Set expiry
      await redis.expire(historyKey, 3600); // 1 hour
    } catch (error) {
      logger.error('Error storing request pattern:', error);
    }
  }

  /**
   * Get adaptive rate limit based on threat score
   */
  static getAdaptiveLimit(baseLimitConfig: RateLimitConfig, threatScore: number): RateLimitConfig {
    const adaptiveConfig = { ...baseLimitConfig };

    if (threatScore >= 80) {
      // Critical threat: Very strict limits
      adaptiveConfig.maxRequests = Math.floor(baseLimitConfig.maxRequests * 0.1);
      adaptiveConfig.blockDuration = 3600; // 1 hour
    } else if (threatScore >= 60) {
      // High threat: Strict limits
      adaptiveConfig.maxRequests = Math.floor(baseLimitConfig.maxRequests * 0.3);
      adaptiveConfig.blockDuration = 1800; // 30 minutes
    } else if (threatScore >= 40) {
      // Medium threat: Reduced limits
      adaptiveConfig.maxRequests = Math.floor(baseLimitConfig.maxRequests * 0.6);
      adaptiveConfig.blockDuration = 900; // 15 minutes
    }

    return adaptiveConfig;
  }
}

/**
 * Create advanced rate limiter with threat detection
 */
export function createAdvancedRateLimiter(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime.bigint();
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    try {
      // Check if IP is blocked
      const blockKey = `blocked:${ipAddress}`;
      const isBlocked = await redis.get(blockKey);

      if (isBlocked) {
        const blockData = JSON.parse(isBlocked);
        logger.warn('Blocked IP attempted access', {
          ip: ipAddress,
          endpoint: req.path,
          blockReason: blockData.reason,
          blockedUntil: blockData.until
        });

        return res.status(429).json({
          error: 'Access temporarily blocked',
          message: 'Your IP has been temporarily blocked due to suspicious activity',
          blockedUntil: blockData.until
        });
      }

      // Perform threat analysis if enabled
      let threatScore = { score: 0, reasons: [], severity: 'low' as const };

      if (config.enableThreatDetection) {
        threatScore = await AdvancedRateLimiter.analyzeThreatPattern(
          ipAddress,
          userAgent,
          req.path,
          req.method
        );
      }

      // Get adaptive limits if enabled
      let activeConfig = config;
      if (config.adaptiveThreshold && threatScore.score > 0) {
        activeConfig = AdvancedRateLimiter.getAdaptiveLimit(config, threatScore.score);
      }

      // Apply rate limiting
      const limiter = rateLimit({
        windowMs: activeConfig.windowMs,
        max: activeConfig.maxRequests,
        skipSuccessfulRequests: activeConfig.skipSuccessfulRequests || false,
        keyGenerator: (req) => `${req.ip}:${req.path}`,
        handler: async (req, res) => {
          // Block IP if threat score is high
          if (threatScore.score >= 80) {
            const blockDuration = activeConfig.blockDuration || 3600;
            const blockUntil = Date.now() + (blockDuration * 1000);

            await redis.setEx(
              `blocked:${ipAddress}`,
              blockDuration,
              JSON.stringify({
                reason: threatScore.reasons.join(', '),
                score: threatScore.score,
                until: new Date(blockUntil).toISOString(),
                blockedAt: new Date().toISOString()
              })
            );

            logger.error('IP blocked due to high threat score', {
              ip: ipAddress,
              threatScore: threatScore.score,
              reasons: threatScore.reasons,
              blockDuration: blockDuration
            });
          }

          // Log rate limit hit
          logger.warn('Rate limit exceeded', {
            ip: ipAddress,
            endpoint: req.path,
            method: req.method,
            threatScore: threatScore.score,
            adaptiveLimit: activeConfig.maxRequests,
            originalLimit: config.maxRequests
          });

          res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please slow down.',
            threatScore: threatScore.severity,
            retryAfter: Math.ceil(activeConfig.windowMs / 1000)
          });
        },
        standardHeaders: true,
        legacyHeaders: false
      });

      // Apply the rate limiter
      limiter(req, res, (err) => {
        if (err) {
          return next(err);
        }

        // Store request pattern for future analysis
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000;

        // Store pattern asynchronously
        AdvancedRateLimiter.storeRequestPattern(req, res, responseTime)
          .catch(error => logger.error('Error storing request pattern:', error));

        // Log high threat scores
        if (threatScore.score >= 40) {
          logger.warn('High threat score detected', {
            ip: ipAddress,
            endpoint: req.path,
            threatScore: threatScore.score,
            severity: threatScore.severity,
            reasons: threatScore.reasons
          });
        }

        next();
      });

    } catch (error) {
      logger.error('Advanced rate limiter error:', error);
      // Fallback to basic rate limiting
      next();
    }
  };
}

/**
 * Enhanced authentication rate limiter with adaptive protection
 */
export const enhancedAuthLimiter = createAdvancedRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  skipSuccessfulRequests: true,
  enableThreatDetection: true,
  adaptiveThreshold: true,
  blockDuration: 3600 // 1 hour for auth endpoints
});

/**
 * API rate limiter with behavioral analysis
 */
export const intelligentApiLimiter = createAdvancedRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 60,
  skipSuccessfulRequests: false,
  enableThreatDetection: true,
  adaptiveThreshold: true,
  blockDuration: 900 // 15 minutes for API endpoints
});

/**
 * Strict rate limiter for sensitive operations
 */
export const strictOperationLimiter = createAdvancedRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  skipSuccessfulRequests: false,
  enableThreatDetection: true,
  adaptiveThreshold: true,
  blockDuration: 7200 // 2 hours for sensitive operations
});

/**
 * Public endpoint limiter with threat detection
 */
export const publicEndpointLimiter = createAdvancedRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 30,
  skipSuccessfulRequests: false,
  enableThreatDetection: true,
  adaptiveThreshold: true,
  blockDuration: 600 // 10 minutes for public endpoints
});

/**
 * Utility function to check if IP is currently blocked
 */
export async function isIpBlocked(ipAddress: string): Promise<boolean> {
  try {
    const blockData = await redis.get(`blocked:${ipAddress}`);
    return !!blockData;
  } catch (error) {
    logger.error('Error checking IP block status:', error);
    return false;
  }
}

/**
 * Utility function to manually block an IP
 */
export async function blockIpAddress(
  ipAddress: string,
  reason: string,
  durationSeconds: number = 3600
): Promise<void> {
  try {
    const blockUntil = Date.now() + (durationSeconds * 1000);

    await redis.setEx(
      `blocked:${ipAddress}`,
      durationSeconds,
      JSON.stringify({
        reason,
        score: 100,
        until: new Date(blockUntil).toISOString(),
        blockedAt: new Date().toISOString(),
        manual: true
      })
    );

    logger.info('IP manually blocked', {
      ip: ipAddress,
      reason,
      duration: durationSeconds
    });
  } catch (error) {
    logger.error('Error blocking IP:', error);
    throw error;
  }
}

/**
 * Utility function to unblock an IP
 */
export async function unblockIpAddress(ipAddress: string): Promise<void> {
  try {
    await redis.del(`blocked:${ipAddress}`);

    logger.info('IP unblocked', { ip: ipAddress });
  } catch (error) {
    logger.error('Error unblocking IP:', error);
    throw error;
  }
}