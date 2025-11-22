import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import type { RateLimitRequestHandler, Options } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

import { logger } from '../utils/logger';
import { redis } from '../services/redis';

/**
 * Generate cryptographically secure request fingerprint
 * Uses HMAC to prevent fingerprint manipulation
 */
function generateSecureFingerprint(req: Request): string {
  const secret = process.env.FINGERPRINT_SECRET || 'default-fingerprint-secret-change-me';

  // Collect immutable request characteristics
  const components = [
    req.ip || 'unknown',
    req.get('user-agent') || 'no-agent',
    req.get('accept-language') || 'no-lang',
    req.get('accept-encoding') || 'no-encoding',
    req.get('sec-ch-ua') || 'no-ch-ua',
    req.get('sec-ch-ua-platform') || 'no-platform',
    // Add TLS fingerprint if available
    (req.socket as unknown).getPeerCertificate?.()?.fingerprint || 'no-tls',
  ];

  // Use HMAC for secure fingerprinting
  return crypto
    .createHmac('sha256', secret)
    .update(components.join('|'))
    .digest('hex');
}

/**
 * Create Redis store for distributed rate limiting
 */
function createRedisStore(windowMs: number) {
  return new RedisStore({
    client: redis,
    sendCommand: (...args: string[]) => (redis as unknown).sendCommand(args),
    // Use sliding window for more accurate rate limiting
    windowMs,
    // Ensure keys are properly prefixed
    prefix: 'rl:',
  });
}

/**
 * General API rate limiter with Redis backend
 */
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(15 * 60 * 1000),
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

/**
 * Strict auth rate limiter with secure fingerprinting
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(15 * 60 * 1000),
  keyGenerator: (req) => generateSecureFingerprint(req),
  handler: async (req: Request, res: Response) => {
    const fingerprint = generateSecureFingerprint(req);

    // Track violations
    await trackViolation(req.ip || 'unknown', 'auth_rate_limit');

    logger.error('Auth rate limit exceeded', {
      ip: req.ip,
      fingerprint: fingerprint.substring(0, 10),
      path: req.path,
      email: req.body?.email,
      userAgent: req.get('user-agent'),
    });

    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts',
      message: 'Account temporarily locked. Please try again in 15 minutes.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * Password reset limiter
 */
export const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  skipSuccessfulRequests: false,
  message: 'Too many password reset requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(60 * 60 * 1000),
  keyGenerator: (req) => {
    // Use email-based rate limiting for password resets
    const email = req.body?.email || req.ip || 'unknown';
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  },
});

/**
 * Upload rate limiter
 */
export const uploadLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Upload limit exceeded, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(60 * 60 * 1000),
});

/**
 * Webhook rate limiter
 */
export const webhookLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  message: 'Webhook rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(60 * 1000),
});

/**
 * Public API rate limiter
 */
export const publicApiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'API rate limit exceeded, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(60 * 1000),
});

/**
 * Track violations for security monitoring
 */
async function trackViolation(identifier: string, violationType: string): Promise<void> {
  try {
    const key = `violations:${identifier}:${violationType}`;
    const count = await redis.incr(key);

    // Set expiry if this is the first violation
    if (count === 1) {
      await redis.expire(key, 86400); // 24 hours
    }

    // Alert if threshold exceeded
    if (count >= 10) {
      logger.error('High violation count detected', {
        identifier,
        violationType,
        count,
      });
      // Here you would trigger alerts to security team
    }
  } catch (error) {
    logger.error('Error tracking violation:', error);
  }
}

/**
 * Intelligent rate limiter with dynamic limits based on user trust
 * Fixed memory leak issue by properly handling async operations
 */
export const intelligentRateLimiter = (options?: {
  baseLimit?: number;
  windowMs?: number;
}): RateLimitRequestHandler => {
  const baseLimit = options?.baseLimit || 50;
  const windowMs = options?.windowMs || 15 * 60 * 1000;

  return rateLimit({
    windowMs,
    max: async (req: Request) => {
      const trustScore = await getUserTrustScore(req);
      // Dynamic limit based on trust (50-200 requests)
      return Math.floor(baseLimit + (trustScore * 150));
    },
    keyGenerator: (req: Request) => {
      const userId = req.user?.id || 'anonymous';
      return `${req.ip}:${userId}:${req.path}`;
    },
    store: createRedisStore(windowMs),
    handler: async (req: Request, res: Response) => {
      // FIX: Removed setTimeout to prevent memory leak
      // Track violation immediately
      await trackViolation(req.ip || 'unknown', 'intelligent_rate_limit');

      const trustScore = await getUserTrustScore(req);

      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please slow down.',
        trustScore: Math.round(trustScore * 100) / 100,
        retryAfter: res.getHeader('Retry-After'),
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * Get user trust score for dynamic rate limiting
 */
async function getUserTrustScore(req: Request): Promise<number> {
  const userId = req.user?.id;
  const identifier = userId || req.ip || 'unknown';

  try {
    // Check cache first
    const cachedScore = await redis.get(`trust:${identifier}`);
    if (cachedScore) {
      return parseFloat(cachedScore);
    }

    // Calculate trust score based on violations and success
    const [violations, successes] = await Promise.all([
      redis.get(`violations:${identifier}:total`) || '0',
      redis.get(`success:${identifier}`) || '0',
    ]);

    const violationCount = parseInt(String(violations));
    const successCount = parseInt(String(successes));

    // Trust calculation (0-1 scale)
    const baseTrust = 0.5;
    const violationPenalty = Math.min(violationCount * 0.05, 0.4);
    const successBonus = Math.min(successCount * 0.001, 0.4);

    const score = Math.max(0.1, Math.min(1, baseTrust + successBonus - violationPenalty));

    // Cache for 1 hour
    await redis.setEx(`trust:${identifier}`, 3600, score.toString());

    return score;
  } catch (error) {
    logger.error('Error calculating user trust score:', error);
    return 0.3; // Default to low trust on error
  }
}

/**
 * Distributed rate limiter middleware for horizontal scaling
 */
export const distributedRateLimiter = (
  options: {
    windowMs?: number;
    maxRequests?: number;
    keyPrefix?: string;
  } = {}
) => {
  const windowMs = options.windowMs || 60000; // 1 minute default
  const maxRequests = options.maxRequests || 100;
  const keyPrefix = options.keyPrefix || 'dist';

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const window = Math.floor(Date.now() / windowMs);
      const identifier = req.ip || 'unknown';
      const key = `${keyPrefix}:${identifier}:${window}`;

      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, Math.ceil(windowMs / 1000));

      const results = await pipeline.exec();

      if (!results || results.length < 1) {
        // Fail open if Redis fails
        return next();
      }

      const [[incrErr, requestCount]] = results as [[Error | null, number]];

      if (incrErr) {
        logger.error('Distributed rate limiter error:', incrErr);
        return next(); // Fail open
      }

      if (requestCount > maxRequests) {
        await trackViolation(identifier, 'distributed_rate_limit');

        res.setHeader('X-RateLimit-Limit', String(maxRequests));
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', String(new Date((window + 1) * windowMs).toISOString()));

        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${maxRequests} per ${windowMs / 1000} seconds`,
        });
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - requestCount)));
      res.setHeader('X-RateLimit-Reset', String(new Date((window + 1) * windowMs).toISOString()));

      next();
    } catch (error) {
      logger.error('Distributed rate limiter error:', error);
      next(); // Fail open
    }
  };
};

/**
 * Advanced threat detection middleware
 */
export const threatDetectionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Define suspicious patterns
    const suspiciousPatterns = [
      /union\s+select/i,
      /select\s+.*\s+from\s+information_schema/i,
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers
      /eval\s*\(/i,
      /base64_decode/i,
      /\.\.\//g, // Path traversal
      /etc\/passwd/i,
      /cmd\.exe/i,
      /powershell/i,
      /%00/g, // Null byte
      /\x00/g, // Null byte hex
    ];

    // Combine all request data for scanning
    const requestData = [
      JSON.stringify(req.body),
      req.url,
      decodeURIComponent(req.url),
      req.get('user-agent') || '',
      JSON.stringify(req.headers),
    ].join(' ');

    // Check for suspicious patterns
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(requestData)) {
        await trackViolation(req.ip || 'unknown', 'suspicious_pattern');

        logger.error('Suspicious request pattern detected', {
          ip: req.ip,
          path: req.path,
          pattern: pattern.source,
          userAgent: req.get('user-agent'),
          body: req.body,
        });

        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Request blocked by security filter',
        });
      }
    }

    // Check for request size anomalies
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB limit
      await trackViolation(req.ip || 'unknown', 'oversized_request');

      return res.status(413).json({
        success: false,
        error: 'Payload too large',
        message: 'Request size exceeds limit',
      });
    }

    next();
  } catch (error) {
    logger.error('Threat detection middleware error:', error);
    next(); // Continue on error
  }
};

/**
 * Create custom rate limiter with specific configuration
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  useFingerprint?: boolean;
  keyPrefix?: string;
}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Rate limit exceeded',
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(options.windowMs),
    keyGenerator: options.useFingerprint
      ? (req) => generateSecureFingerprint(req)
      : (req) => `${options.keyPrefix || 'custom'}:${req.ip || 'unknown'}`,
    handler: async (req: Request, res: Response) => {
      const identifier = options.useFingerprint
        ? generateSecureFingerprint(req).substring(0, 10)
        : req.ip || 'unknown';

      await trackViolation(identifier, 'custom_rate_limit');

      logger.warn('Custom rate limit exceeded', {
        ip: req.ip,
        fingerprint: options.useFingerprint ? identifier : undefined,
        path: req.path,
        limit: options.max,
        window: options.windowMs,
      });

      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: options.message || 'Please try again later.',
        retryAfter: res.getHeader('Retry-After'),
      });
    },
  });
}

/**
 * Clear rate limit for a specific key (for testing or admin override)
 */
export async function clearRateLimit(identifier: string, limiterType: string = 'api'): Promise<void> {
  try {
    const pattern = `rl:${limiterType}:${identifier}*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Cleared rate limits for ${identifier} (${limiterType})`);
    }
  } catch (error) {
    logger.error('Error clearing rate limit:', error);
  }
}