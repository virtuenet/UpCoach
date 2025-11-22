import crypto from 'crypto';

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

import { logger } from '../utils/logger';
import { redis } from '../services/redis';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, _res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    _res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per fingerprint (IP + user agent)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 10000 : 5, // Much higher limit in tests
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Use fingerprinting for better bot detection
  keyGenerator: req => generateRequestFingerprint(req),
  handler: (req: Request, _res: Response) => {
    logger.error('Auth rate limit exceeded', {
      ip: req.ip,
      fingerprint: generateRequestFingerprint(req).substring(0, 10),
      path: req.path,
      body: { email: req.body?.email }, // Log email for security monitoring
      userAgent: req.get('user-agent'),
    });
    _res.status(429).json({
      success: false,
      error: 'Too many authentication attempts',
      message: 'Account temporarily locked. Please try again in 15 minutes.',
    });
  },
});

/**
 * Moderate rate limiter for password reset endpoints
 * 3 requests per hour per IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'test' ? 10000 : 3, // Much higher limit in tests
  skipSuccessfulRequests: false,
  message: 'Too many password reset requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for file uploads
 * 10 uploads per hour per IP
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Upload limit exceeded, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for webhook endpoints
 * 1000 requests per minute (for external services)
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  message: 'Webhook rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Flexible rate limiter for public API endpoints
 * 30 requests per minute per IP
 */
export const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'API rate limit exceeded, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Generate request fingerprint for better rate limiting
 * Combines IP with user agent and other factors
 */
function generateRequestFingerprint(req: Request): string {
  const components = [
    req.ip || 'unknown',
    req.get('user-agent') || 'no-agent',
    req.get('accept-language') || 'no-lang',
    // Add more entropy from headers that are hard to spoof
    req.get('accept-encoding') || '',
    req.get('sec-ch-ua') || '', // Browser client hints
  ];

  // Create hash of combined components
  return crypto.createHash('sha256').update(components.join('|')).digest('hex');
}

/**
 * Create a custom rate limiter with specific configuration
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  useFingerprint?: boolean; // New option for fingerprint-based limiting
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Rate limit exceeded',
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    standardHeaders: true,
    legacyHeaders: false,
    // Use fingerprint if enabled, otherwise use IP
    keyGenerator: options.useFingerprint ? req => generateRequestFingerprint(req) : undefined, // Uses default IP-based key
    handler: (req: Request, _res: Response) => {
      logger.warn('Custom rate limit exceeded', {
        ip: req.ip,
        fingerprint: options.useFingerprint
          ? generateRequestFingerprint(req).substring(0, 10)
          : undefined,
        path: req.path,
        limit: options.max,
        window: options.windowMs,
      });
      _res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: options.message || 'Please try again later.',
      });
    },
  });
}

/**
 * Get user trust score for dynamic rate limiting
 */
async function getUserTrustScore(req: Request): Promise<number> {
  const userId = req.user?.id;
  if (!userId) {
    return 0.3; // Low trust for unauthenticated users
  }

  try {
    // Check user history from Redis cache
    const trustScore = await redis.get(`trust:${userId}`);
    if (trustScore) {
      return parseFloat(trustScore);
    }

    // Calculate trust score based on user behavior
    const violations = await redis.get(`violations:${req.ip}`) || '0';
    const successfulRequests = await redis.get(`success:${userId}`) || '1';
    
    // Simple trust calculation (0-1 scale)
    const violationPenalty = Math.min(parseInt(violations) * 0.1, 0.7);
    const successBonus = Math.min(parseInt(successfulRequests) * 0.01, 0.4);
    const baseTrust = 0.5;
    
    const score = Math.max(0.1, Math.min(1, baseTrust + successBonus - violationPenalty));
    
    // Cache for 1 hour
    await redis.setEx(`trust:${userId}`, 3600, score.toString());
    
    return score;
  } catch (error) {
    logger.error('Error calculating user trust score:', error);
    return 0.3; // Default to low trust on error
  }
}

/**
 * Intelligent rate limiter with dynamic limits based on user trust
 */
export const intelligentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: async (req: Request) => {
    const userTrust = await getUserTrustScore(req);
    // High trust users get more requests (up to 200), low trust gets fewer (50)
    return Math.floor(50 + (userTrust * 150));
  },
  keyGenerator: (req: Request) => {
    // Combine IP and user ID for better tracking
    const userId = req.user?.id || 'anonymous';
    return `${req.ip}:${userId}:${req.path}`;
  },
  handler: async (req: Request, res: Response) => {
    try {
      // Implement progressive delays for repeat offenders
      const violationsKey = `violations:${req.ip}`;
      const violations = await redis.get(violationsKey);
      const violationCount = violations ? parseInt(violations) + 1 : 1;
      
      // Store violation with 24-hour expiry
      await redis.setEx(violationsKey, 86400, violationCount.toString());
      
      // Progressive delay: 1s, 2s, 3s, up to 5s max
      const delay = Math.min(violationCount * 1000, 5000);
      const trustScore = await getUserTrustScore(req);
      
      setTimeout(() => {
        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please slow down.',
          retryAfter: Math.ceil(delay / 1000),
          trustScore: trustScore || 'unknown',
        });
      }, delay);
    } catch (error) {
      // Fallback to simple rate limit response
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
      });
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Distributed rate limiter for production scaling
 */
export const distributedRateLimiter = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const currentMinute = Math.floor(Date.now() / 60000); // Current minute timestamp
    const key = `rate:${req.ip}:${currentMinute}`;
    
    const requests = await redis.incr(key);
    await redis.expire(key, 60); // Expire after 60 seconds
    
    // Allow up to 100 requests per minute per IP
    if (requests > 100) {
      res.status(429).json({
        success: false,
        error: 'Distributed rate limit exceeded',
        message: 'Too many requests per minute',
        requestCount: requests,
      });
      return;
    }
    
    next();
  } catch (error) {
    logger.error('Distributed rate limiter error:', error);
    // Fail open - allow request if Redis is down
    next();
  }
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
    const suspiciousPatterns = [
      /union.*select/i,
      /<script/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i,
      /eval\(/i,
      /base64/i,
    ];

    const requestData = JSON.stringify(req.body) + req.url + (req.get('user-agent') || '');
    
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
      pattern.test(requestData)
    );

    if (hasSuspiciousPattern) {
      logger.error('Suspicious request pattern detected', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('user-agent'),
        body: req.body,
      });

      // Increase violation count
      const violationsKey = `violations:${req.ip}`;
      const violations = await redis.get(violationsKey);
      const violationCount = violations ? parseInt(violations) + 5 : 5; // Bigger penalty
      await redis.setEx(violationsKey, 86400, violationCount.toString());

      res.status(400).json({
        success: false,
        error: 'Invalid request pattern detected',
        message: 'Request blocked by security filter',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Threat detection middleware error:', error);
    next(); // Continue on error
  }
};
