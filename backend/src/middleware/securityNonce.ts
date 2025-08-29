import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Extend Express Request type to include nonce
declare global {
  namespace Express {
    interface Request {
      nonce?: string;
    }
  }
}

/**
 * Generate a nonce for CSP
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Middleware to add nonce to request and response locals
 */
export function nonceMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const nonce = generateNonce();
  req.nonce = nonce;
  _res.locals.nonce = nonce;
  next();
}

/**
 * Generate CSP header with nonce
 */
export function generateCSPWithNonce(nonce: string, isDevelopment: boolean = false): string {
  const directives: string[] = [
    `default-src 'self'`,
    `script-src 'nonce-${nonce}' 'strict-dynamic' https: ${isDevelopment ? "'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com https://cdn.jsdelivr.net`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https:`,
    `connect-src 'self' https://api.openai.com https://api.stripe.com wss: ${process.env.FRONTEND_URL || 'http://localhost:3000'} ${process.env.ADMIN_URL || 'http://localhost:8006'}`,
    `media-src 'self'`,
    `object-src 'none'`,
    `child-src 'self' blob:`,
    `worker-src 'self' blob:`,
    `frame-src 'self' https://js.stripe.com`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `manifest-src 'self'`,
    `upgrade-insecure-requests`
  ];

  return directives.join('; ');
}

/**
 * Enhanced security headers middleware with nonce-based CSP
 */
export function enhancedSecurityHeaders(isDevelopment: boolean = false) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Generate nonce for this request
    const nonce = req.nonce || generateNonce();
    req.nonce = nonce;
    _res.locals.nonce = nonce;

    // Set CSP header with nonce
    const cspHeader = generateCSPWithNonce(nonce, isDevelopment);
    _res.setHeader('Content-Security-Policy', cspHeader);

    // Additional security headers
    _res.setHeader('X-Content-Type-Options', 'nosniff');
    _res.setHeader('X-Frame-Options', 'DENY');
    _res.setHeader('X-XSS-Protection', '1; mode=block');
    _res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    _res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // HSTS header for production
    if (!isDevelopment) {
      _res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    next();
  };
}