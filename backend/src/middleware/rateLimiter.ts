import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

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
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
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
  max: 5, // Limit each fingerprint to 5 requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Use fingerprinting for better bot detection
  keyGenerator: (req) => generateRequestFingerprint(req),
  handler: (req: Request, res: Response) => {
    logger.error('Auth rate limit exceeded', {
      ip: req.ip,
      fingerprint: generateRequestFingerprint(req).substring(0, 10),
      path: req.path,
      body: { email: req.body?.email }, // Log email for security monitoring
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
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
  max: 3,
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
  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
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
    keyGenerator: options.useFingerprint 
      ? (req) => generateRequestFingerprint(req)
      : undefined, // Uses default IP-based key
    handler: (req: Request, res: Response) => {
      logger.warn('Custom rate limit exceeded', {
        ip: req.ip,
        fingerprint: options.useFingerprint ? generateRequestFingerprint(req).substring(0, 10) : undefined,
        path: req.path,
        limit: options.max,
        window: options.windowMs,
      });
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: options.message || 'Please try again later.',
      });
    },
  });
}