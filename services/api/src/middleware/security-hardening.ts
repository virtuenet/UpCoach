import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { logger } from '../utils/logger';

/**
 * Comprehensive Security Hardening Middleware
 * Implements defense-in-depth security controls
 */

// Security headers configuration
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://checkout.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        "https://api.openai.com",
        "https://api.anthropic.com",
        "wss://upcoach.ai"
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
    reportOnly: process.env.NODE_ENV === 'development'
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options
  frameguard: { action: 'deny' },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },

  // Permissions Policy
  permittedCrossDomainPolicies: false,

  // Additional security headers
  hidePoweredBy: true,
  ieNoOpen: true,
  dnsPrefetchControl: { allow: false }
});

// Advanced rate limiting with different tiers
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: options.message || 'Too many requests, please try again later',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,

    // Custom key generator for better tracking
    keyGenerator: (req: Request) => {
      // Use IP + User-Agent for better fingerprinting
      const ip = req.ip || req.socket?.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      return `${ip}-${Buffer.from(userAgent).toString('base64').subarray(0, 10)}`;
    },

    // Skip rate limiting for trusted IPs in development
    skip: (req: Request) => {
      if (process.env.NODE_ENV === 'development') {
        const trustedIPs = ['127.0.0.1', '::1', 'localhost'];
        return trustedIPs.includes(req.ip || '');
      }
      return false;
    },

    // Handler for rate limit exceeded
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });
      res.status(429).json({
        error: options.message || 'Too many requests, please try again later',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};

// Different rate limiters for different endpoints
export const generalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth attempts per windowMs
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true
});

export const apiRateLimit = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 API requests per minute
  message: 'API rate limit exceeded, please slow down'
});

// CORS configuration with security focus
export const corsConfig = cors({
  origin: (origin, callback) => {
    // Allow requests from allowed origins
    const allowedOrigins = [
      'https://upcoach.ai',
      'https://www.upcoach.ai',
      'https://admin.upcoach.ai',
      'https://cms.upcoach.ai',
      'https://app.upcoach.ai'
    ];

    // Allow localhost in development
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:1005',
        'http://localhost:1006',
        'http://localhost:1007'
      );
    }

    // Allow mobile app origins
    if (!origin) {
      // Allow mobile apps and server-to-server requests
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS violation attempted', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-CSRF-Token'
  ]
});

// Request sanitization middleware
export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction) => {
  // Remove potentially dangerous characters from all string inputs
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/vbscript:/gi, '') // Remove vbscript: protocols
      .replace(/onload=/gi, '') // Remove onload events
      .replace(/onerror=/gi, '') // Remove onerror events
      .trim();
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj: unknown): Record<string, unknown> | unknown[] | unknown => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize request body, query, and params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query) as typeof req.query;
  }

  if (req.params) {
    req.params = sanitizeObject(req.params) as typeof req.params;
  }

  next();
};

// Security logging middleware
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log security-relevant information
  const securityInfo = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
    headers: {
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      host: req.get('Host'),
      contentType: req.get('Content-Type')
    }
  };

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\b(union|select|insert|delete|drop|create|alter)\s+/i, // SQL injection
    /<script|javascript:|vbscript:|onload=|onerror=/i, // XSS
    /\.\.\//g, // Path traversal
    /\${.*}/g, // Template injection
    /eval\s*\(/i, // Code execution
  ];

  const requestString = JSON.stringify(req.body) + req.url + JSON.stringify(req.query);
  const suspiciousDetected = suspiciousPatterns.some(pattern => pattern.test(requestString));

  if (suspiciousDetected) {
    logger.warn('Suspicious request detected', {
      ...securityInfo,
      body: req.body,
      query: req.query,
      params: req.params
    });
  }

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    if (res.statusCode >= 400 || suspiciousDetected) {
      logger.info('Request completed', {
        ...securityInfo,
        statusCode: res.statusCode,
        duration,
        suspicious: suspiciousDetected
      });
    }
  });

  next();
};

// IP filtering middleware (for production)
export const ipFilter = (req: Request, res: Response, next: NextFunction): void => {
  const clientIP = req.ip || '';

  // Blocked IP ranges (example - configure based on your needs)
  const blockedIPs = process.env.BLOCKED_IPS?.split(',') || [];
  const allowedIPs = process.env.ALLOWED_IPS?.split(',') || [];

  // If allowlist is configured, only allow those IPs
  if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
    logger.warn('IP not in allowlist', { ip: clientIP });
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Block specific IPs
  if (blockedIPs.includes(clientIP)) {
    logger.warn('Blocked IP attempted access', { ip: clientIP });
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  next();
};

// Request timeout middleware
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          method: req.method,
          path: req.path,
          ip: req.ip,
          timeout: timeoutMs
        });
        res.status(408).json({ error: 'Request timeout' });
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

// Content length limiter
export const contentLengthLimit = (maxSize: number = 10 * 1024 * 1024) => { // 10MB default
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('Content-Length') || '0');

    if (contentLength > maxSize) {
      logger.warn('Request exceeds content length limit', {
        contentLength,
        maxSize,
        ip: req.ip,
        path: req.path
      });
      res.status(413).json({ error: 'Payload too large' });
      return;
    }

    next();
  };
};

// Security middleware stack
export const securityMiddlewareStack = [
  securityHeaders,
  corsConfig,
  generalRateLimit,
  ipFilter,
  requestTimeout(),
  contentLengthLimit(),
  sanitizeRequest,
  securityLogger
];

export default {
  securityHeaders,
  generalRateLimit,
  authRateLimit,
  apiRateLimit,
  corsConfig,
  sanitizeRequest,
  securityLogger,
  ipFilter,
  requestTimeout,
  contentLengthLimit,
  securityMiddlewareStack
};