import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { redis } from '../services/redis';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  outcome: 'success' | 'failure' | 'blocked';
  riskScore: number;
  metadata?: Record<string, any>;
  fingerprint: string;
}

export class AuditTrailService {
  static async logSecurityEvent(event: Partial<AuditEvent>, req: Request): Promise<void> {
    const auditEvent: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      userId: req.user?.id,
      sessionId: req.sessionID || req.headers['x-session-id'] as string,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      fingerprint: this.generateEventFingerprint(req),
      riskScore: await this.calculateRiskScore(req),
      ...event,
      action: event.action || 'unknown',
      resource: event.resource || req.path,
      outcome: event.outcome || 'success'
    };
    
    // Log to application logger
    logger.info('Security audit event', auditEvent);
    
    // Store in Redis for real-time monitoring (24-hour TTL)
    await redis.setEx(
      `audit:${auditEvent.id}`, 
      86400, 
      JSON.stringify(auditEvent)
    );
    
    // Real-time alerting for high-risk events
    if (auditEvent.riskScore > 0.8) {
      await this.triggerSecurityAlert(auditEvent);
    }
    
    // Update security metrics
    await this.updateSecurityMetrics(auditEvent);
  }
  
  private static generateEventFingerprint(req: Request): string {
    const components = [
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      req.path,
      req.user?.id || 'anonymous',
    ].join('|');
    
    return crypto.createHash('sha256').update(components).digest('hex').substring(0, 16);
  }
  
  private static async calculateRiskScore(req: Request): Promise<number> {
    let score = 0;
    
    try {
      // IP reputation check
      const ipRisk = await this.getIPRiskScore(req.ip || '');
      score += ipRisk * 0.3;
      
      // User behavior analysis
      const userRisk = await this.getUserRiskScore(req.user?.id);
      score += userRisk * 0.4;
      
      // Request pattern analysis
      const requestRisk = await this.getRequestRiskScore(req);
      score += requestRisk * 0.3;
      
      return Math.min(score, 1);
    } catch (error) {
      logger.error('Error calculating risk score:', error);
      return 0.5; // Default medium risk
    }
  }
  
  private static async getIPRiskScore(ip: string): Promise<number> {
    if (!ip || ip === 'unknown') return 0.5;
    
    // Check for recent violations
    const violations = await redis.get(`violations:${ip}`);
    if (violations && parseInt(violations) > 10) {
      return 0.9; // High risk for IPs with many violations
    }
    
    // Check if IP is in allowlist/blocklist
    const isBlocked = await redis.get(`blocked:${ip}`);
    if (isBlocked) {
      return 1.0; // Maximum risk for blocked IPs
    }
    
    const isTrusted = await redis.get(`trusted:${ip}`);
    if (isTrusted) {
      return 0.1; // Low risk for trusted IPs
    }
    
    return 0.3; // Default risk for unknown IPs
  }
  
  private static async getUserRiskScore(userId?: string): Promise<number> {
    if (!userId) return 0.6; // Higher risk for unauthenticated requests
    
    try {
      // Check user trust score
      const trustScore = await redis.get(`trust:${userId}`);
      if (trustScore) {
        return 1 - parseFloat(trustScore); // Invert trust score to get risk
      }
      
      // Check for recent failed authentications
      const authFailures = await redis.get(`auth_failures:${userId}`);
      if (authFailures && parseInt(authFailures) > 5) {
        return 0.8; // High risk for users with many auth failures
      }
      
      return 0.2; // Low risk for authenticated users without issues
    } catch (error) {
      logger.error('Error calculating user risk score:', error);
      return 0.5;
    }
  }
  
  private static async getRequestRiskScore(req: Request): Promise<number> {
    let risk = 0;
    
    // Check for suspicious patterns in request
    const suspiciousPatterns = [
      /union.*select/i,
      /<script/i,
      /javascript:/i,
      /\.\.\/|\.\.\\/,
      /etc\/passwd/i,
      /cmd\.exe/i,
    ];
    
    const requestData = JSON.stringify(req.body) + req.url;
    const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
      pattern.test(requestData)
    );
    
    if (hasSuspiciousContent) {
      risk += 0.7;
    }
    
    // Check request timing (too fast = suspicious)
    const userId = req.user?.id || req.ip;
    const lastRequestTime = await redis.get(`last_request:${userId}`);
    if (lastRequestTime) {
      const timeDiff = Date.now() - parseInt(lastRequestTime);
      if (timeDiff < 100) { // Less than 100ms between requests
        risk += 0.3;
      }
    }
    await redis.setEx(`last_request:${userId}`, 60, Date.now().toString());
    
    // Check for unusual request patterns
    if (req.method === 'POST' && !req.get('content-type')?.includes('json')) {
      risk += 0.2;
    }
    
    return Math.min(risk, 1);
  }
  
  private static async triggerSecurityAlert(event: AuditEvent): Promise<void> {
    logger.error('High-risk security event detected', {
      eventId: event.id,
      riskScore: event.riskScore,
      action: event.action,
      userId: event.userId,
      ipAddress: event.ipAddress,
      resource: event.resource,
    });
    
    // Store high-risk event for immediate attention
    await redis.setEx(
      `alert:${event.id}`, 
      3600, // 1 hour TTL for alerts
      JSON.stringify({
        ...event,
        alertLevel: 'HIGH',
        alertTime: new Date(),
      })
    );
    
    // In a real system, you might also:
    // - Send to external monitoring system (DataDog, Sentry)
    // - Trigger PagerDuty alert
    // - Send Slack notification
    // - Auto-block IP if score > 0.95
  }
  
  private static async updateSecurityMetrics(event: AuditEvent): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Update daily metrics
    await redis.incr(`metrics:${today}:total_events`);
    
    if (event.outcome === 'failure') {
      await redis.incr(`metrics:${today}:failures`);
    }
    
    if (event.outcome === 'blocked') {
      await redis.incr(`metrics:${today}:blocked`);
    }
    
    if (event.riskScore > 0.8) {
      await redis.incr(`metrics:${today}:high_risk`);
    }
    
    // Set expiration for metrics (30 days)
    await redis.expire(`metrics:${today}:total_events`, 2592000);
    await redis.expire(`metrics:${today}:failures`, 2592000);
    await redis.expire(`metrics:${today}:blocked`, 2592000);
    await redis.expire(`metrics:${today}:high_risk`, 2592000);
  }
}

/**
 * Audit middleware that logs security events
 */
export const auditMiddleware = (action: string, resource?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Store original res.json to capture response
    const originalJson = res.json;
    let responseData: unknown;
    
    res.json = function(data: unknown) {
      responseData = data;
      return originalJson.call(this, data);
    };
    
    res.on('finish', async () => {
      const outcome = res.statusCode < 400 ? 'success' : 
                     res.statusCode < 500 ? 'blocked' : 'failure';
      
      await AuditTrailService.logSecurityEvent({
        action,
        resource: resource || req.route?.path || req.path,
        outcome,
        metadata: {
          responseTime: Date.now() - startTime,
          statusCode: res.statusCode,
          contentLength: res.get('content-length'),
          method: req.method,
          hasError: !!responseData?.error,
        }
      }, req);
    });
    
    next();
  };
};

/**
 * Enhanced authentication audit middleware
 */
export const authAuditMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const startTime = Date.now();
  
  res.on('finish', async () => {
    const isSuccess = res.statusCode === 200;
    const action = req.path.includes('login') ? 'login' : 
                  req.path.includes('register') ? 'register' :
                  req.path.includes('logout') ? 'logout' : 'auth';
    
    await AuditTrailService.logSecurityEvent({
      action,
      resource: 'authentication',
      outcome: isSuccess ? 'success' : 'failure',
      metadata: {
        responseTime: Date.now() - startTime,
        statusCode: res.statusCode,
        email: req.body?.email,
        attemptedAction: action,
      }
    }, req);
    
    // Track authentication failures
    if (!isSuccess && req.body?.email) {
      const failures = await redis.get(`auth_failures:${req.body.email}`) || '0';
      await redis.setEx(`auth_failures:${req.body.email}`, 3600, (parseInt(failures) + 1).toString());
    }
  });
  
  next();
};