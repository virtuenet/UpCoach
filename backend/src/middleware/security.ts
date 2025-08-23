import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { logger } from '../utils/logger';
import { nonceMiddleware, enhancedSecurityHeaders } from './securityNonce';

/**
 * Content Security Policy configuration
 */
const cspConfig = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    // "'unsafe-inline'" removed for security - using nonces instead
    "https://cdn.jsdelivr.net",
    "https://unpkg.com",
    "https://www.google-analytics.com",
    "https://www.googletagmanager.com",
  ],
  styleSrc: [
    "'self'",
    // "'unsafe-inline'" removed for security - using nonces instead
    "https://fonts.googleapis.com",
    "https://cdn.jsdelivr.net",
  ],
  fontSrc: [
    "'self'",
    "https://fonts.gstatic.com",
    "data:",
  ],
  imgSrc: [
    "'self'",
    "data:",
    "blob:",
    "https:",
  ],
  connectSrc: [
    "'self'",
    "https://api.openai.com",
    "https://api.stripe.com",
    "wss:", // WebSocket connections
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:8006',
  ],
  mediaSrc: ["'self'"],
  objectSrc: ["'none'"],
  childSrc: ["'self'", "blob:"],
  workerSrc: ["'self'", "blob:"],
  frameSrc: ["'self'", "https://js.stripe.com"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  baseUri: ["'self'"],
  manifestSrc: ["'self'"],
  upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined,
};

/**
 * Security headers middleware
 */
export function securityHeaders() {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: cspConfig as any,
    },
    
    // Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    
    // X-Frame-Options
    frameguard: {
      action: 'deny',
    },
    
    // X-Content-Type-Options
    noSniff: true,
    
    // X-XSS-Protection (legacy but still useful)
    xssFilter: true,
    
    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    
    // X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },
    
    // DNS Prefetch Control
    dnsPrefetchControl: {
      allow: false,
    },
    
    // IE No Open
    ieNoOpen: true,
    
    // Hide Powered By
    hidePoweredBy: true,
  });
}

/**
 * Additional custom security headers
 */
export function customSecurityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Permissions Policy (formerly Feature Policy)
    res.setHeader('Permissions-Policy', [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'battery=()',
      'camera=()',
      'cross-origin-isolated=()',
      'display-capture=()',
      'document-domain=()',
      'encrypted-media=()',
      'execution-while-not-rendered=()',
      'execution-while-out-of-viewport=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'keyboard-map=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'navigation-override=()',
      'payment=()',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=()',
      'xr-spatial-tracking=()',
    ].join(', '));
    
    // Clear Site Data (for logout)
    if (req.path === '/api/auth/logout') {
      res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
    }
    
    // Cache Control for sensitive data
    if (req.path.includes('/api/') && !req.path.includes('/public')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
    
    // X-Download-Options
    res.setHeader('X-Download-Options', 'noopen');
    
    // X-DNS-Prefetch-Control
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    
    // Expect-CT (Certificate Transparency)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Expect-CT', 'max-age=86400, enforce');
    }
    
    next();
  };
}

/**
 * CORS configuration with security in mind
 */
export function secureCors() {
  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin);
    
  if (allowedOrigins.length === 0) {
    // Default allowed origins
    allowedOrigins.push(
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.ADMIN_URL || 'http://localhost:8006',
      process.env.CMS_URL || 'http://localhost:8007'
    );
  }
  
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token'
      );
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      
      // Expose certain headers to the client
      res.setHeader('Access-Control-Expose-Headers', 'X-CSRF-Token, X-Request-Id');
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    
    next();
  };
}

/**
 * Request ID middleware for tracking
 */
export function requestId() {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.headers['x-request-id'] || 
               req.headers['x-correlation-id'] || 
               `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    req.id = id as string;
    res.setHeader('X-Request-Id', id);
    
    next();
  };
}

/**
 * Security monitoring middleware
 */
export function securityMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Log security-relevant events
    const securityEvents = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/reset-password',
      '/api/admin',
      '/api/financial',
    ];
    
    if (securityEvents.some(path => req.path.startsWith(path))) {
      logger.info('Security event', {
        event: 'security_action',
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
        userId: (req as any).user?.id,
      });
    }
    
    // Detect potential security threats
    const suspiciousPatterns = [
      /(<script|javascript:|onerror=|onload=)/i,
      /(union.*select|select.*from|insert.*into|delete.*from)/i,
      /(\.\.\/?){2,}/,
      /%00|%0d|%0a/i,
    ];
    
    const checkSuspicious = (value: string): boolean => {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    };
    
    const url = req.url;
    const body = JSON.stringify(req.body || {});
    
    if (checkSuspicious(url) || checkSuspicious(body)) {
      logger.warn('Suspicious request detected', {
        event: 'suspicious_request',
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
      });
    }
    
    next();
  };
}

/**
 * Apply all security middleware
 */
export function applySecurityMiddleware(app: any): void {
  // Request ID (should be first)
  app.use(requestId());
  
  // Security headers
  app.use(securityHeaders());
  app.use(customSecurityHeaders());
  
  // CORS
  app.use(secureCors());
  
  // Security monitoring
  app.use(securityMonitoring());
  
  logger.info('Security middleware applied successfully');
}