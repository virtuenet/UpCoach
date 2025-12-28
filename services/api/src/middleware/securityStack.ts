/**
 * Security Middleware Stack
 * Phase 13 Week 1
 *
 * Comprehensive security middleware chain with WAF, DDoS protection,
 * security headers, CSRF protection, and XSS filtering
 */

import { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { WAFManager } from '../security/waf/WAFService';
import { DDoSManager } from '../security/ddos/DDoSProtection';
import { SecurityEventManager } from '../security/events/SecurityEventAggregator';

/**
 * Initialize and apply security middleware stack
 */
export function applySecurityStack(app: Express): void {
  // 1. Helmet - Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: 'deny'
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    }
  }));

  // 2. Additional security headers
  app.use(additionalSecurityHeaders);

  // 3. WAF - Web Application Firewall
  const waf = WAFManager.getInstance();
  app.use(waf.middleware());

  // 4. DDoS Protection
  const ddos = DDoSManager.getInstance();
  app.use(ddos.middleware());

  // 5. XSS Filter
  app.use(xssFilter);

  // 6. Request sanitization
  app.use(sanitizeRequest);

  // 7. Security event logging
  app.use(securityEventLogger);
}

/**
 * Additional security headers middleware
 */
function additionalSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS Protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature-Policy)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Expect-CT (Certificate Transparency)
  res.setHeader('Expect-CT', 'max-age=86400, enforce');

  next();
}

/**
 * XSS Filter middleware
 */
function xssFilter(req: Request, res: Response, next: NextFunction): void {
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  next();
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }

  return sanitized;
}

/**
 * Sanitize string for XSS
 */
function sanitizeString(str: any): any {
  if (typeof str !== 'string') {
    return str;
  }

  // Remove dangerous HTML/JS patterns
  return str
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Request sanitization middleware
 */
function sanitizeRequest(req: Request, res: Response, next: NextFunction): void {
  // Remove null bytes from URL
  if (req.url.includes('\0')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid characters in URL'
    });
  }

  // Validate Content-Type for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');

    if (!contentType) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Content-Type header required'
      });
    }

    // Ensure Content-Type is valid
    const validTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data'
    ];

    const isValid = validTypes.some(type => contentType.includes(type));

    if (!isValid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid Content-Type'
      });
    }
  }

  // Limit request size (already handled by body-parser, but double-check)
  const contentLength = parseInt(req.get('Content-Length') || '0', 10);
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'Request body exceeds 10MB limit'
    });
  }

  next();
}

/**
 * Security event logger middleware
 */
function securityEventLogger(req: Request, res: Response, next: NextFunction): void {
  const events = SecurityEventManager.getInstance();

  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.[\/\\]/,  // Path traversal
    /union.*select/i,  // SQL injection
    /<script/i,  // XSS
    /eval\(/,  // Code injection
    /\$\{/  // Template injection
  ];

  const requestData = JSON.stringify({
    url: req.url,
    query: req.query,
    body: req.body
  });

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      events.ingestEvent({
        source: 'system',
        type: 'suspicious-request',
        severity: 'medium',
        ip: req.ip,
        user: (req as any).user ? {
          id: (req as any).user.id,
          email: (req as any).user.email,
          role: (req as any).user.role
        } : undefined,
        details: {
          pattern: pattern.toString(),
          method: req.method,
          path: req.path,
          userAgent: req.get('user-agent')
        },
        tags: ['suspicious', 'automated-detection']
      });

      break;
    }
  }

  next();
}

/**
 * CSRF Protection middleware (for session-based auth)
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API routes with Bearer token
  const authHeader = req.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // Check CSRF token
  const csrfToken = req.get('X-CSRF-Token') || req.body._csrf;
  const sessionToken = (req as any).session?.csrfToken;

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid CSRF token'
    });
  }

  next();
}

/**
 * Rate limiting for sensitive endpoints
 */
export function sensitiveEndpointRateLimit(req: Request, res: Response, next: NextFunction): void {
  // This would integrate with existing rate limiter
  // For now, just pass through
  next();
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}
