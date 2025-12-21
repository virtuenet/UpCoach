/**
 * Threat Protection Middleware
 *
 * Comprehensive security middleware that integrates:
 * - Threat detection and prevention
 * - IP blocking and reputation
 * - Request analysis for attacks
 * - Behavioral anomaly detection
 * - Security audit logging
 */

import { Request, Response, NextFunction } from 'express';
import { getThreatDetectionService } from '../services/security/ThreatDetectionService';
import { getSecurityAuditService } from '../services/security/SecurityAuditService';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      threatAnalysis?: {
        riskScore: number;
        threats: string[];
        blocked: boolean;
      };
      securityContext?: {
        ipReputation: number;
        isBot: boolean;
        rateLimited: boolean;
      };
    }
  }
}

// Middleware options
interface ThreatProtectionOptions {
  enabled?: boolean;
  blockThreshold?: number;
  logAllRequests?: boolean;
  excludePaths?: string[];
  trustedProxies?: string[];
  bypassForAuthenticated?: boolean;
}

const defaultOptions: ThreatProtectionOptions = {
  enabled: true,
  blockThreshold: 70,
  logAllRequests: false,
  excludePaths: ['/health', '/metrics', '/ready'],
  trustedProxies: [],
  bypassForAuthenticated: false,
};

/**
 * Create threat protection middleware
 */
export function createThreatProtection(options: ThreatProtectionOptions = {}) {
  const config = { ...defaultOptions, ...options };
  const threatService = getThreatDetectionService();
  const auditService = getSecurityAuditService();

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!config.enabled) {
      return next();
    }

    // Skip excluded paths
    if (config.excludePaths?.some(path => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();
    const clientIP = getClientIP(req, config.trustedProxies || []);

    try {
      // Analyze request for threats
      const analysis = await threatService.analyzeRequest({
        ip: clientIP,
        userAgent: req.headers['user-agent'] || '',
        method: req.method,
        path: req.path,
        query: req.query as Record<string, any>,
        body: req.body,
        headers: req.headers as Record<string, string>,
        userId: (req as any).user?.id,
        sessionId: req.sessionID,
      });

      // Attach analysis to request
      req.threatAnalysis = {
        riskScore: analysis.riskScore,
        threats: analysis.threats.map(t => t.type),
        blocked: !analysis.allowed,
      };

      // Block request if not allowed
      if (!analysis.allowed) {
        // Log blocked request
        await auditService.logSecurity('ip.blocked', {
          type: 'system',
          ip: clientIP,
          userAgent: req.headers['user-agent'],
        }, {
          path: req.path,
          method: req.method,
          riskScore: analysis.riskScore,
          threats: analysis.threats.map(t => t.type),
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: 'Request blocked by security policy',
          code: 'SECURITY_BLOCK',
        });
      }

      // Check for required actions
      for (const action of analysis.actions) {
        switch (action.type) {
          case 'captcha':
            // Add captcha challenge header
            res.setHeader('X-Security-Challenge', 'captcha-required');
            break;
          case 'mfa_challenge':
            // Add MFA challenge header
            res.setHeader('X-Security-Challenge', 'mfa-required');
            break;
          case 'rate_limit':
            // Add rate limit headers
            res.setHeader('X-RateLimit-Exceeded', 'true');
            res.setHeader('Retry-After', '60');
            break;
        }
      }

      // Add security headers
      res.setHeader('X-Security-Score', analysis.riskScore.toString());

      // Log request if configured or if threats detected
      if (config.logAllRequests || analysis.threats.length > 0) {
        const logSeverity = analysis.threats.length > 0 ? 'security.threat.detected' : 'data.read';

        if (analysis.threats.length > 0) {
          await auditService.log('security.threat.detected', {
            actor: {
              type: (req as any).user ? 'user' : 'anonymous',
              id: (req as any).user?.id,
              ip: clientIP,
              userAgent: req.headers['user-agent'],
            },
            action: 'Threat detected in request',
            outcome: 'success',
            details: {
              path: req.path,
              method: req.method,
              riskScore: analysis.riskScore,
              threats: analysis.threats.map(t => ({
                type: t.type,
                severity: t.severity,
                indicators: t.indicators,
              })),
              responseTime: Date.now() - startTime,
            },
          });
        }
      }

      // Continue to next middleware
      next();
    } catch (error) {
      console.error('ThreatProtection middleware error:', error);
      // Don't block on errors, but log them
      next();
    }
  };
}

/**
 * IP blocking middleware
 */
export function createIPBlocker(options: { blocklist?: string[]; allowlist?: string[] } = {}) {
  const threatService = getThreatDetectionService();
  const blocklist = new Set(options.blocklist || []);
  const allowlist = new Set(options.allowlist || []);

  return async (req: Request, res: Response, next: NextFunction) => {
    const clientIP = getClientIP(req, []);

    // Check allowlist first
    if (allowlist.has(clientIP)) {
      return next();
    }

    // Check static blocklist
    if (blocklist.has(clientIP)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied',
        code: 'IP_BLOCKED',
      });
    }

    // Check dynamic blocklist
    if (threatService.isIPBlocked(clientIP)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access temporarily denied',
        code: 'IP_TEMPORARILY_BLOCKED',
      });
    }

    next();
  };
}

/**
 * Login attempt tracking middleware
 */
export function createLoginTracker() {
  const threatService = getThreatDetectionService();
  const auditService = getSecurityAuditService();

  return async (req: Request, res: Response, next: NextFunction) => {
    const clientIP = getClientIP(req, []);
    const identifier = req.body?.email || req.body?.username || 'unknown';

    // Store original end function
    const originalEnd = res.end;
    const originalJson = res.json;

    // Override json to track response
    res.json = function(body: any) {
      const success = res.statusCode >= 200 && res.statusCode < 300;

      // Track login attempt
      threatService.trackLoginAttempt(identifier, success, clientIP).then(result => {
        if (result.blocked) {
          // Log the block
          auditService.logAuth('login.failure', {
            type: 'anonymous',
            ip: clientIP,
            userAgent: req.headers['user-agent'],
          }, {
            reason: 'brute_force_detected',
            attempts: result.attempts,
            identifier,
          });
        } else if (!success) {
          auditService.logAuth('login.failure', {
            type: 'anonymous',
            ip: clientIP,
            userAgent: req.headers['user-agent'],
          }, {
            identifier,
            attempts: result.attempts,
          });
        } else {
          auditService.logAuth('login.success', {
            type: 'user',
            id: body?.user?.id,
            email: body?.user?.email,
            ip: clientIP,
            userAgent: req.headers['user-agent'],
          });
        }
      }).catch(err => {
        console.error('Login tracking error:', err);
      });

      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Request validation middleware
 */
export function createRequestValidator(options: {
  maxBodySize?: number;
  maxQueryParams?: number;
  maxHeaderSize?: number;
  allowedContentTypes?: string[];
} = {}) {
  const config = {
    maxBodySize: 1024 * 1024, // 1MB
    maxQueryParams: 50,
    maxHeaderSize: 8192, // 8KB
    allowedContentTypes: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'],
    ...options,
  };

  return (req: Request, res: Response, next: NextFunction) => {
    // Check query params count
    if (Object.keys(req.query).length > config.maxQueryParams) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Too many query parameters',
        code: 'QUERY_PARAMS_EXCEEDED',
      });
    }

    // Check content type for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers['content-type']?.split(';')[0] || '';
      if (contentType && !config.allowedContentTypes.some(ct => contentType.includes(ct))) {
        return res.status(415).json({
          error: 'Unsupported Media Type',
          message: `Content-Type ${contentType} not supported`,
          code: 'UNSUPPORTED_CONTENT_TYPE',
        });
      }
    }

    // Check for suspicious patterns in headers
    const suspiciousHeaders = ['x-forwarded-host', 'x-original-url', 'x-rewrite-url'];
    for (const header of suspiciousHeaders) {
      if (req.headers[header]) {
        // Log but don't block - could be legitimate proxy headers
        console.warn(`Suspicious header detected: ${header}`, {
          ip: getClientIP(req, []),
          path: req.path,
        });
      }
    }

    next();
  };
}

/**
 * Security headers middleware
 */
export function createSecurityHeaders(options: {
  contentSecurityPolicy?: string;
  strictTransportSecurity?: boolean;
  xFrameOptions?: 'DENY' | 'SAMEORIGIN';
  xContentTypeOptions?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: string;
} = {}) {
  const config = {
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
    strictTransportSecurity: true,
    xFrameOptions: 'DENY' as const,
    xContentTypeOptions: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
    ...options,
  };

  return (req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy
    if (config.contentSecurityPolicy) {
      res.setHeader('Content-Security-Policy', config.contentSecurityPolicy);
    }

    // Strict Transport Security
    if (config.strictTransportSecurity) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // X-Frame-Options
    if (config.xFrameOptions) {
      res.setHeader('X-Frame-Options', config.xFrameOptions);
    }

    // X-Content-Type-Options
    if (config.xContentTypeOptions) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // Referrer Policy
    if (config.referrerPolicy) {
      res.setHeader('Referrer-Policy', config.referrerPolicy);
    }

    // Permissions Policy
    if (config.permissionsPolicy) {
      res.setHeader('Permissions-Policy', config.permissionsPolicy);
    }

    // Additional security headers
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    next();
  };
}

/**
 * Data access logging middleware
 */
export function createDataAccessLogger() {
  const auditService = getSecurityAuditService();

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only log for authenticated users accessing data endpoints
    if (!(req as any).user) {
      return next();
    }

    // Determine operation type from method
    const operationMap: Record<string, 'read' | 'create' | 'update' | 'delete'> = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };

    const operation = operationMap[req.method];
    if (!operation) {
      return next();
    }

    // Extract resource type from path
    const pathParts = req.path.split('/').filter(Boolean);
    const resourceType = pathParts[1] || 'unknown'; // e.g., /api/users -> users

    // Store original end
    const originalEnd = res.end;

    res.end = function(...args: any[]) {
      // Log after response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        auditService.logDataAccess(
          operation,
          {
            type: 'user',
            id: (req as any).user.id,
            email: (req as any).user.email,
            ip: getClientIP(req, []),
            userAgent: req.headers['user-agent'],
          },
          {
            type: resourceType,
            id: req.params.id,
          },
          {
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
          }
        ).catch(err => {
          console.error('Data access logging error:', err);
        });
      }

      return originalEnd.apply(this, args);
    };

    next();
  };
}

/**
 * Get client IP from request
 */
function getClientIP(req: Request, trustedProxies: string[]): string {
  // Check X-Forwarded-For header
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = (typeof xForwardedFor === 'string' ? xForwardedFor : xForwardedFor[0])
      .split(',')
      .map(ip => ip.trim());

    // Return first non-trusted proxy IP
    for (const ip of ips) {
      if (!trustedProxies.includes(ip)) {
        return ip;
      }
    }
  }

  // Check X-Real-IP header
  const xRealIP = req.headers['x-real-ip'];
  if (xRealIP) {
    return typeof xRealIP === 'string' ? xRealIP : xRealIP[0];
  }

  // Fall back to socket address
  return req.socket.remoteAddress || req.ip || 'unknown';
}

// Export default middleware stack
export const threatProtection = createThreatProtection();
export const ipBlocker = createIPBlocker();
export const loginTracker = createLoginTracker();
export const requestValidator = createRequestValidator();
export const securityHeaders = createSecurityHeaders();
export const dataAccessLogger = createDataAccessLogger();
