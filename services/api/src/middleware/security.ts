import { Request, Response, NextFunction, Express } from 'express';
import helmet from 'helmet';
import type { ContentSecurityPolicyDirectiveValue } from 'helmet';

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
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
  ],
  styleSrc: [
    "'self'",
    // "'unsafe-inline'" removed for security - using nonces instead
    'https://fonts.googleapis.com',
    'https://cdn.jsdelivr.net',
  ],
  fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
  imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
  connectSrc: [
    "'self'",
    'https://api.openai.com',
    'https://api.stripe.com',
    'wss:', // WebSocket connections
    process.env.FRONTEND_URL || 'http://localhost:8005',
    process.env.ADMIN_URL || 'http://localhost:8006',
    process.env.CMS_URL || 'http://localhost:8007',
  ],
  mediaSrc: ["'self'"],
  objectSrc: ["'none'"],
  childSrc: ["'self'", 'blob:'],
  workerSrc: ["'self'", 'blob:'],
  frameSrc: ["'self'", 'https://js.stripe.com'],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  baseUri: ["'self'"],
  manifestSrc: ["'self'"],
  upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined,
};

// Type for CSP directives
type CspDirectives = Record<string, Iterable<ContentSecurityPolicyDirectiveValue>>;

/**
 * Security headers middleware
 */
export function securityHeaders() {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: cspConfig as CspDirectives,
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
  return (req: Request, _res: Response, next: NextFunction) => {
    // Permissions Policy (formerly Feature Policy)
    _res.setHeader(
      'Permissions-Policy',
      [
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
      ].join(', ')
    );

    // Clear Site Data (for logout)
    if (req.path === '/api/auth/logout') {
      _res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
    }

    // Cache Control for sensitive data
    if (req.path.includes('/api/') && !req.path.includes('/public')) {
      _res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      _res.setHeader('Pragma', 'no-cache');
      _res.setHeader('Expires', '0');
      _res.setHeader('Surrogate-Control', 'no-store');
    }

    // X-Download-Options
    _res.setHeader('X-Download-Options', 'noopen');

    // X-DNS-Prefetch-Control
    _res.setHeader('X-DNS-Prefetch-Control', 'off');

    // Expect-CT (Certificate Transparency)
    if (process.env.NODE_ENV === 'production') {
      _res.setHeader('Expect-CT', 'max-age=86400, enforce');
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

  return (req: Request, _res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      _res.setHeader('Access-Control-Allow-Origin', origin);
      _res.setHeader('Access-Control-Allow-Credentials', 'true');
      _res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      _res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token'
      );
      _res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

      // Expose certain headers to the client
      _res.setHeader('Access-Control-Expose-Headers', 'X-CSRF-Token, X-Request-Id');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      _res.sendStatus(204);
      return;
    }

    next();
  };
}

/**
 * Request ID middleware for tracking
 */
export function requestId() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const id =
      req.headers['x-request-id'] ||
      req.headers['x-correlation-id'] ||
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    req.id = id as string;
    _res.setHeader('X-Request-Id', id);

    next();
  };
}

/**
 * Advanced SQL injection pattern detection with OWASP coverage
 */
interface ThreatDetectionResult {
  isSuspicious: boolean;
  threatType?: 'sqli' | 'xss' | 'path_traversal' | 'null_byte';
  confidence: number; // 0-1 scale
  pattern?: string;
}

class AdvancedThreatDetector {
  private static readonly SQL_INJECTION_PATTERNS = [
    // UNION-based SQL injection patterns (Critical - CVSS 7.5+)
    {
      pattern: /\b(union|union\s+all)\s+(select|distinct)\b/gi,
      type: 'sqli' as const,
      confidence: 0.95,
      name: 'UNION_SELECT'
    },
    {
      pattern: /\bunion\s*(?:\/\*.*?\*\/)?\s*select\b/gi,
      type: 'sqli' as const,
      confidence: 0.90,
      name: 'UNION_SELECT_OBFUSCATED'
    },
    {
      pattern: /\b(?:select|insert|update|delete|drop|create|alter|exec|execute)\s+.*\s+union\b/gi,
      type: 'sqli' as const,
      confidence: 0.85,
      name: 'NESTED_UNION'
    },

    // Boolean-based blind SQL injection
    {
      pattern: /\b(and|or)\s+(\d+\s*=\s*\d+|'[^']*'\s*=\s*'[^']*')(\s*(--|#|;)|$)/gi,
      type: 'sqli' as const,
      confidence: 0.80,
      name: 'BOOLEAN_BLIND'
    },
    {
      pattern: /\b(and|or)\s+\d+\s*(>|<|>=|<=|=|<>)\s*\d+/gi,
      type: 'sqli' as const,
      confidence: 0.75,
      name: 'BOOLEAN_COMPARISON'
    },

    // Time-based blind SQL injection
    {
      pattern: /\b(sleep|pg_sleep|waitfor\s+delay|benchmark)\s*\(/gi,
      type: 'sqli' as const,
      confidence: 0.90,
      name: 'TIME_BASED_BLIND'
    },
    {
      pattern: /\bif\s*\(.+,\s*(sleep|benchmark|pg_sleep)\s*\(/gi,
      type: 'sqli' as const,
      confidence: 0.85,
      name: 'CONDITIONAL_TIME_BASED'
    },

    // Error-based SQL injection
    {
      pattern: /\b(extractvalue|updatexml|xpath|exp|pow|floor|rand|count)\s*\(/gi,
      type: 'sqli' as const,
      confidence: 0.70,
      name: 'ERROR_BASED_MYSQL'
    },
    {
      pattern: /\b(cast|convert|try_cast)\s*\(.+\s+as\s+(int|numeric|decimal)\s*\)/gi,
      type: 'sqli' as const,
      confidence: 0.75,
      name: 'ERROR_BASED_CAST'
    },

    // Advanced SQL injection techniques
    {
      pattern: /\b(load_file|into\s+outfile|into\s+dumpfile)\s*\(/gi,
      type: 'sqli' as const,
      confidence: 0.95,
      name: 'FILE_OPERATIONS'
    },
    {
      pattern: /\b(exec|execute|sp_executesql|xp_cmdshell)\s*\(/gi,
      type: 'sqli' as const,
      confidence: 0.90,
      name: 'COMMAND_EXECUTION'
    },

    // SQL injection with encoding/obfuscation
    {
      pattern: /(%[0-9a-fA-F]{2}){4,}/g,
      type: 'sqli' as const,
      confidence: 0.60,
      name: 'URL_ENCODED_PAYLOAD'
    },
    {
      pattern: /\b(select|union|insert|update|delete|drop|create|alter)\s*\/\*.*?\*\/\s*(select|from|where|union|password)/gi,
      type: 'sqli' as const,
      confidence: 0.80,
      name: 'COMMENT_OBFUSCATED'
    },

    // Subquery and nested injection patterns
    {
      pattern: /\b(select|insert|update|delete)\s+.+\s+from\s*\(.+\s+(select|union)\s+.+\)/gi,
      type: 'sqli' as const,
      confidence: 0.85,
      name: 'SUBQUERY_INJECTION'
    },
    {
      pattern: /\bexists\s*\(\s*select\b/gi,
      type: 'sqli' as const,
      confidence: 0.80,
      name: 'EXISTS_SUBQUERY'
    },

    // Multi-statement injection
    {
      pattern: /;\s*(select|insert|update|delete|drop|create|alter)\s+/gi,
      type: 'sqli' as const,
      confidence: 0.90,
      name: 'MULTI_STATEMENT'
    },

    // Traditional patterns (enhanced)
    {
      pattern: /(select.*from|insert.*into|delete.*from|update.*set)\s+/gi,
      type: 'sqli' as const,
      confidence: 0.65,
      name: 'BASIC_SQL_KEYWORDS'
    },

    // XSS patterns
    {
      pattern: /(<script|javascript:|onerror=|onload=|onclick=|onmouseover=)/gi,
      type: 'xss' as const,
      confidence: 0.85,
      name: 'XSS_PATTERNS'
    },

    // Path traversal
    {
      pattern: /(\.\.[\\/]){2,}/g,
      type: 'path_traversal' as const,
      confidence: 0.90,
      name: 'PATH_TRAVERSAL'
    },

    // Null byte injection
    {
      pattern: /%00|%0d|%0a/gi,
      type: 'null_byte' as const,
      confidence: 0.85,
      name: 'NULL_BYTE_INJECTION'
    }
  ];

  static detectThreats(value: string): ThreatDetectionResult[] {
    const startTime = process.hrtime.bigint();
    const results: ThreatDetectionResult[] = [];
    const decodedValue = this.decodeValue(value);
    
    for (const { pattern, type, confidence, name } of this.SQL_INJECTION_PATTERNS) {
      // Test both original and decoded values
      const testValues = [value, decodedValue].filter((v, i, arr) => arr.indexOf(v) === i);
      
      for (const testValue of testValues) {
        const matches = testValue.match(pattern);
        if (matches) {
          results.push({
            isSuspicious: true,
            threatType: type,
            confidence,
            pattern: name
          });
          
          // High-confidence patterns trigger immediate response
          if (confidence >= 0.85) {
            break;
          }
        }
      }
    }
    
    // Performance monitoring - ensure <5ms processing time
    const endTime = process.hrtime.bigint();
    const processingTime = Number(endTime - startTime) / 1000000; // Convert to ms
    
    if (processingTime > 5) {
      logger.warn('SQL injection detection exceeded performance threshold', {
        processingTime: `${processingTime.toFixed(2)}ms`,
        valueLength: value.length,
        resultCount: results.length
      });
    }
    
    return results;
  }

  private static decodeValue(value: string): string {
    try {
      // URL decode
      let decoded = decodeURIComponent(value);
      // HTML entity decode (basic)
      decoded = decoded
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');
      return decoded;
    } catch {
      return value;
    }
  }
}

/**
 * Enhanced security monitoring middleware with advanced threat detection
 */
export function securityMonitoring() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const startTime = process.hrtime.bigint();
    
    // Log security-relevant events
    const securityEvents = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/reset-password',
      '/api/admin',
      '/api/financial',
      '/api/v2/auth/google', // OAuth endpoints
    ];

    if (securityEvents.some(path => req.path.startsWith(path))) {
      logger.info('Security event', {
        event: 'security_action',
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
        userId: req.user?.id,
      });
    }

    // Enhanced threat detection
    const valuesToCheck = [
      req.url,
      JSON.stringify(req.body || {}),
      JSON.stringify(req.query || {}),
      req.headers['user-agent'] || '',
      req.headers['referer'] || '',
    ];

    let highestThreat: ThreatDetectionResult | null = null;
    const allThreats: ThreatDetectionResult[] = [];

    for (const value of valuesToCheck) {
      const threats = AdvancedThreatDetector.detectThreats(value);
      allThreats.push(...threats);
      
      // Track highest confidence threat
      for (const threat of threats) {
        if (!highestThreat || threat.confidence > highestThreat.confidence) {
          highestThreat = threat;
        }
      }
    }

    // Handle high-confidence threats (potential attack)
    if (highestThreat && highestThreat.confidence >= 0.85) {
      const endTime = process.hrtime.bigint();
      const processingTime = Number(endTime - startTime) / 1000000;
      
      logger.error('High-confidence security threat detected', {
        event: 'security_threat_critical',
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
        userId: req.user?.id,
        threatType: highestThreat.threatType,
        confidence: highestThreat.confidence,
        pattern: highestThreat.pattern,
        processingTime: `${processingTime.toFixed(2)}ms`,
        threatCount: allThreats.length,
        // Don't log actual payload values for security
        payloadIndicators: {
          urlLength: req.url.length,
          bodySize: JSON.stringify(req.body || {}).length,
          hasQueryParams: Object.keys(req.query || {}).length > 0
        }
      });
      
      // For production: Consider blocking the request
      // For now: Log and monitor
    }
    
    // Log medium-confidence threats for monitoring
    else if (highestThreat && highestThreat.confidence >= 0.70) {
      logger.warn('Potential security threat detected', {
        event: 'security_threat_medium',
        path: req.path,
        method: req.method,
        ip: req.ip,
        requestId: req.id,
        threatType: highestThreat.threatType,
        confidence: highestThreat.confidence,
        pattern: highestThreat.pattern,
        threatCount: allThreats.length
      });
    }

    next();
  };
}

/**
 * Apply all security middleware
 */
export function applySecurityMiddleware(app: Express): void {
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
