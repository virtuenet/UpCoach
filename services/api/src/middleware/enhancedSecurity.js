/**
 * Enhanced Security Middleware
 * Implements comprehensive security headers and monitoring
 */

const crypto = require('crypto');
const { logger } = require('../utils/logger');

class SecurityHeadersEnhanced {
  constructor(options = {}) {
    this.config = {
      // CSP Configuration
      csp: {
        enabled: options.cspEnabled !== false,
        directives: {
          'default-src': ["'self'"],
          'script-src': [
            "'self'",
            "'strict-dynamic'",
            'https://cdn.jsdelivr.net',
            'https://js.stripe.com',
            'https://www.google-analytics.com',
            'https://www.googletagmanager.com'
          ],
          'style-src': [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
            'https://cdn.jsdelivr.net'
          ],
          'font-src': [
            "'self'",
            'https://fonts.gstatic.com',
            'data:'
          ],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'https:',
            'https://www.google-analytics.com'
          ],
          'connect-src': [
            "'self'",
            'https://api.stripe.com',
            'https://api.openai.com',
            'wss:',
            'https://www.google-analytics.com'
          ],
          'frame-src': [
            "'self'",
            'https://js.stripe.com'
          ],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
          'block-all-mixed-content': [],
          'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : undefined
        },
        reportUri: '/api/security/csp-report'
      },

      // HSTS Configuration
      hsts: {
        enabled: options.hstsEnabled !== false,
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },

      // Additional Security Headers
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Download-Options': 'noopen',
        'X-DNS-Prefetch-Control': 'off',
        'X-Permitted-Cross-Domain-Policies': 'none',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'same-origin'
      },

      // Permissions Policy
      permissionsPolicy: {
        accelerometer: [],
        'ambient-light-sensor': [],
        autoplay: [],
        battery: [],
        camera: [],
        'cross-origin-isolated': [],
        'display-capture': [],
        'document-domain': [],
        'encrypted-media': [],
        'execution-while-not-rendered': [],
        'execution-while-out-of-viewport': [],
        fullscreen: ['self'],
        geolocation: [],
        gyroscope: [],
        'keyboard-map': [],
        magnetometer: [],
        microphone: [],
        midi: [],
        'navigation-override': [],
        payment: ['self'],
        'picture-in-picture': [],
        'publickey-credentials-get': [],
        'screen-wake-lock': [],
        'sync-xhr': [],
        usb: [],
        'web-share': [],
        'xr-spatial-tracking': []
      }
    };
  }

  generateNonce() {
    return crypto.randomBytes(16).toString('base64');
  }

  buildCSP(nonce) {
    const directives = [];

    for (const [directive, values] of Object.entries(this.config.csp.directives)) {
      if (!values) continue;

      if (values.length === 0) {
        directives.push(directive);
      } else {
        const directiveValues = [...values];

        // Add nonce to script-src and style-src
        if (nonce && (directive === 'script-src' || directive === 'style-src')) {
          directiveValues.push(`'nonce-${nonce}'`);
        }

        directives.push(`${directive} ${directiveValues.join(' ')}`);
      }
    }

    return directives.join('; ');
  }

  buildPermissionsPolicy() {
    const policies = [];

    for (const [feature, allowlist] of Object.entries(this.config.permissionsPolicy)) {
      if (allowlist.length === 0) {
        policies.push(`${feature}=()`);
      } else {
        policies.push(`${feature}=(${allowlist.map(val => val === 'self' ? 'self' : `"${val}"`).join(' ')})`);
      }
    }

    return policies.join(', ');
  }

  middleware() {
    return (req, res, next) => {
      try {
        // Generate CSP nonce
        const nonce = this.generateNonce();
        res.locals.nonce = nonce;
        res.locals.cspNonce = nonce;

        // Set CSP headers
        if (this.config.csp.enabled) {
          const cspHeader = this.buildCSP(nonce);
          res.setHeader('Content-Security-Policy', cspHeader);

          // Also set report-only header in development
          if (process.env.NODE_ENV !== 'production') {
            res.setHeader('Content-Security-Policy-Report-Only', cspHeader);
          }
        }

        // Set HSTS header
        if (this.config.hsts.enabled && req.secure) {
          let hstsValue = `max-age=${this.config.hsts.maxAge}`;
          if (this.config.hsts.includeSubDomains) {
            hstsValue += '; includeSubDomains';
          }
          if (this.config.hsts.preload) {
            hstsValue += '; preload';
          }
          res.setHeader('Strict-Transport-Security', hstsValue);
        }

        // Set additional security headers
        for (const [header, value] of Object.entries(this.config.headers)) {
          res.setHeader(header, value);
        }

        // Set Permissions Policy
        const permissionsPolicy = this.buildPermissionsPolicy();
        res.setHeader('Permissions-Policy', permissionsPolicy);

        // Set Expect-CT header for production
        if (process.env.NODE_ENV === 'production') {
          res.setHeader('Expect-CT', 'max-age=86400, enforce, report-uri="/api/security/ct-report"');
        }

        // Remove server identification headers
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');

        // Add security monitoring headers
        res.setHeader('X-Request-ID', req.id || crypto.randomUUID());
        res.setHeader('X-Security-Headers', 'enabled');

        next();
      } catch (error) {
        logger.error('Error in security headers middleware:', error);
        next(); // Continue even if security headers fail
      }
    };
  }
}

/**
 * Enhanced CORS Configuration
 */
class SecureCORS {
  constructor(options = {}) {
    this.allowedOrigins = this.parseOrigins(options.origins || process.env.CORS_ORIGINS);
    this.allowCredentials = options.credentials !== false;
    this.maxAge = options.maxAge || 86400; // 24 hours
    this.allowedMethods = options.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];
    this.allowedHeaders = options.headers || [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
      'X-Request-ID'
    ];
    this.exposedHeaders = options.exposedHeaders || [
      'X-CSRF-Token',
      'X-Request-ID',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset'
    ];
  }

  parseOrigins(originsString) {
    if (!originsString) {
      return [
        process.env.FRONTEND_URL || 'https://upcoach.ai',
        process.env.ADMIN_URL || 'https://admin.upcoach.ai',
        process.env.CMS_URL || 'https://cms.upcoach.ai'
      ];
    }

    return originsString.split(',').map(origin => origin.trim()).filter(Boolean);
  }

  isOriginAllowed(origin) {
    if (!origin) return false;

    // Exact match
    if (this.allowedOrigins.includes(origin)) {
      return true;
    }

    // Pattern matching for subdomains (only in development)
    if (process.env.NODE_ENV === 'development') {
      const patterns = this.allowedOrigins.filter(o => o.includes('*'));
      for (const pattern of patterns) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(origin)) {
          return true;
        }
      }
    }

    return false;
  }

  middleware() {
    return (req, res, next) => {
      const origin = req.headers.origin;

      // Always set Vary header
      res.setHeader('Vary', 'Origin');

      // Check if origin is allowed
      if (origin && this.isOriginAllowed(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);

        if (this.allowCredentials) {
          res.setHeader('Access-Control-Allow-Credentials', 'true');
        }

        res.setHeader('Access-Control-Allow-Methods', this.allowedMethods.join(', '));
        res.setHeader('Access-Control-Allow-Headers', this.allowedHeaders.join(', '));
        res.setHeader('Access-Control-Expose-Headers', this.exposedHeaders.join(', '));
        res.setHeader('Access-Control-Max-Age', this.maxAge.toString());
      }

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }

      next();
    };
  }
}

/**
 * Request Validation Middleware
 */
class RequestValidator {
  constructor() {
    this.suspiciousPatterns = [
      // SQL Injection patterns
      /(\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b.*\b(select|from|where|union|password)\b)/gi,
      /(\b(and|or)\s+\d+\s*=\s*\d+)/gi,
      /(sleep|pg_sleep|waitfor\s+delay|benchmark)\s*\(/gi,

      // XSS patterns
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,

      // Path traversal
      /(\.\.[\\/]){2,}/g,
      /%2e%2e%2f/gi,
      /%252e%252e%252f/gi,

      // Command injection
      /[;&|`$(){}[\]]/g,
      /(bash|sh|cmd|powershell|wget|curl)\s+/gi,

      // LDAP injection
      /[()=*!&|]/g,

      // NoSQL injection
      /\$\w+:/g,
      /\{\s*\$\w+:/g
    ];
  }

  validateRequest(req) {
    const violations = [];
    const testData = [
      req.url,
      JSON.stringify(req.body || {}),
      JSON.stringify(req.query || {}),
      req.headers['user-agent'] || '',
      req.headers['referer'] || ''
    ];

    for (const data of testData) {
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(data)) {
          violations.push({
            type: 'suspicious_pattern',
            pattern: pattern.source,
            data: data.substring(0, 100) // First 100 chars for logging
          });
        }
      }
    }

    return violations;
  }

  middleware() {
    return (req, res, next) => {
      const violations = this.validateRequest(req);

      if (violations.length > 0) {
        logger.warn('Suspicious request detected', {
          ip: req.ip,
          url: req.url,
          method: req.method,
          userAgent: req.headers['user-agent'],
          violations: violations.length,
          details: violations
        });

        // Block highly suspicious requests
        const highRiskPatterns = violations.filter(v =>
          v.pattern.includes('union|select') ||
          v.pattern.includes('script') ||
          v.pattern.includes('bash|sh|cmd')
        );

        if (highRiskPatterns.length > 0) {
          res.status(400).json({
            error: 'Request blocked by security filter',
            code: 'SECURITY_VIOLATION'
          });
          return;
        }
      }

      next();
    };
  }
}

// Export configured middleware instances
const securityHeaders = new SecurityHeadersEnhanced();
const secureCORS = new SecureCORS();
const requestValidator = new RequestValidator();

module.exports = {
  SecurityHeadersEnhanced,
  SecureCORS,
  RequestValidator,
  securityHeaders: securityHeaders.middleware(),
  secureCORS: secureCORS.middleware(),
  requestValidator: requestValidator.middleware()
};