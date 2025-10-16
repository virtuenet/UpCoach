/**
 * Comprehensive Audit Service
 * Enterprise-grade audit logging and compliance monitoring
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const { logger } = require('../../utils/logger');
const { redis } = require('../redis');

// Audit Event Types
const AuditEventType = {
  // Authentication Events
  AUTH_LOGIN_SUCCESS: 'auth.login.success',
  AUTH_LOGIN_FAILURE: 'auth.login.failure',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_PASSWORD_CHANGE: 'auth.password.change',
  AUTH_PASSWORD_RESET: 'auth.password.reset',
  AUTH_2FA_ENABLED: 'auth.2fa.enabled',
  AUTH_2FA_DISABLED: 'auth.2fa.disabled',
  AUTH_SESSION_EXPIRED: 'auth.session.expired',

  // Data Access Events
  DATA_ACCESS_READ: 'data.access.read',
  DATA_ACCESS_CREATE: 'data.access.create',
  DATA_ACCESS_UPDATE: 'data.access.update',
  DATA_ACCESS_DELETE: 'data.access.delete',
  DATA_EXPORT: 'data.export',
  DATA_IMPORT: 'data.import',

  // Administrative Events
  ADMIN_USER_CREATE: 'admin.user.create',
  ADMIN_USER_UPDATE: 'admin.user.update',
  ADMIN_USER_DELETE: 'admin.user.delete',
  ADMIN_ROLE_CHANGE: 'admin.role.change',
  ADMIN_PERMISSION_GRANT: 'admin.permission.grant',
  ADMIN_PERMISSION_REVOKE: 'admin.permission.revoke',
  ADMIN_CONFIG_CHANGE: 'admin.config.change',

  // Security Events
  SECURITY_SUSPICIOUS_ACTIVITY: 'security.suspicious.activity',
  SECURITY_RATE_LIMIT_EXCEEDED: 'security.rate_limit.exceeded',
  SECURITY_UNAUTHORIZED_ACCESS: 'security.unauthorized.access',
  SECURITY_VULNERABILITY_DETECTED: 'security.vulnerability.detected',
  SECURITY_POLICY_VIOLATION: 'security.policy.violation',
  SECURITY_ENCRYPTION_FAILURE: 'security.encryption.failure',

  // System Events
  SYSTEM_STARTUP: 'system.startup',
  SYSTEM_SHUTDOWN: 'system.shutdown',
  SYSTEM_CONFIG_CHANGE: 'system.config.change',
  SYSTEM_BACKUP_START: 'system.backup.start',
  SYSTEM_BACKUP_COMPLETE: 'system.backup.complete',
  SYSTEM_MAINTENANCE_START: 'system.maintenance.start',
  SYSTEM_MAINTENANCE_COMPLETE: 'system.maintenance.complete',

  // Compliance Events
  GDPR_CONSENT_GIVEN: 'gdpr.consent.given',
  GDPR_CONSENT_WITHDRAWN: 'gdpr.consent.withdrawn',
  GDPR_DATA_REQUEST: 'gdpr.data.request',
  GDPR_DATA_DELETION: 'gdpr.data.deletion',
  GDPR_BREACH_DETECTED: 'gdpr.breach.detected',
  GDPR_BREACH_REPORTED: 'gdpr.breach.reported'
};

// Audit Event Severity Levels
const AuditSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Risk Assessment Levels
const RiskLevel = {
  MINIMAL: 'minimal',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

class ComprehensiveAuditService extends EventEmitter {
  constructor() {
    super();
    this.maxEventHistory = 10000; // Keep last 10k events in memory
    this.eventHistory = [];
    this.anomalyThresholds = {
      failedLogins: 5,
      suspiciousPatterns: 3,
      dataAccess: 100,
      adminActions: 10
    };

    // Set up event listeners for real-time monitoring
    this.setupEventListeners();
  }

  /**
   * Log a comprehensive audit event
   */
  async logEvent(eventData, req = null) {
    const auditEvent = await this.buildAuditEvent(eventData, req);

    try {
      // Log to application logger
      logger.info('Audit Event', auditEvent);

      // Store in Redis for real-time access
      await this.storeInRedis(auditEvent);

      // Store in persistent storage (database)
      await this.storePersistent(auditEvent);

      // Emit event for real-time monitoring
      this.emit('auditEvent', auditEvent);

      // Check for anomalies
      await this.checkAnomalies(auditEvent);

      // Update risk scoring
      await this.updateRiskScoring(auditEvent);

      return auditEvent;
    } catch (error) {
      logger.error('Failed to log audit event:', error);
      // Don't throw - audit logging should not break application flow
    }
  }

  /**
   * Build comprehensive audit event object
   */
  async buildAuditEvent(eventData, req) {
    const timestamp = new Date();
    const eventId = crypto.randomUUID();

    const baseEvent = {
      // Core identifiers
      id: eventId,
      timestamp: timestamp.toISOString(),
      type: eventData.type,
      severity: eventData.severity || this.calculateSeverity(eventData.type),

      // User context
      userId: eventData.userId || req?.user?.id || 'anonymous',
      sessionId: eventData.sessionId || req?.sessionID || req?.headers['x-session-id'],
      userRole: eventData.userRole || req?.user?.role,

      // Request context
      source: {
        ip: req?.ip || eventData.sourceIp || 'unknown',
        userAgent: req?.headers['user-agent'] || eventData.userAgent || 'unknown',
        referer: req?.headers['referer'] || eventData.referer,
        requestId: req?.id || eventData.requestId
      },

      // Event details
      action: eventData.action,
      resource: eventData.resource || req?.path,
      outcome: eventData.outcome || 'success',
      description: eventData.description,

      // Metadata
      metadata: {
        ...eventData.metadata,
        environment: process.env.NODE_ENV,
        service: 'upcoach-api',
        version: process.env.APP_VERSION || '1.0.0'
      },

      // Security context
      security: {
        riskLevel: await this.calculateRiskLevel(eventData, req),
        threatScore: await this.calculateThreatScore(eventData, req),
        anomalyScore: await this.calculateAnomalyScore(eventData, req),
        correlationId: await this.generateCorrelationId(eventData, req)
      },

      // Compliance flags
      compliance: {
        gdprRelevant: this.isGDPRRelevant(eventData.type),
        hipaaRelevant: this.isHIPAARelevant(eventData.type),
        pciRelevant: this.isPCIRelevant(eventData.type),
        sox404Relevant: this.isSOX404Relevant(eventData.type)
      }
    };

    // Add sensitive data handling
    if (eventData.sensitiveData) {
      baseEvent.sensitiveDataHandled = true;
      baseEvent.dataClassification = eventData.dataClassification || 'confidential';
    }

    return baseEvent;
  }

  /**
   * Calculate event severity based on type
   */
  calculateSeverity(eventType) {
    const severityMap = {
      [AuditEventType.AUTH_LOGIN_FAILURE]: AuditSeverity.MEDIUM,
      [AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY]: AuditSeverity.HIGH,
      [AuditEventType.SECURITY_VULNERABILITY_DETECTED]: AuditSeverity.CRITICAL,
      [AuditEventType.GDPR_BREACH_DETECTED]: AuditSeverity.CRITICAL,
      [AuditEventType.ADMIN_USER_DELETE]: AuditSeverity.HIGH,
      [AuditEventType.DATA_ACCESS_DELETE]: AuditSeverity.MEDIUM,
      [AuditEventType.SYSTEM_CONFIG_CHANGE]: AuditSeverity.MEDIUM
    };

    return severityMap[eventType] || AuditSeverity.LOW;
  }

  /**
   * Calculate risk level for the event
   */
  async calculateRiskLevel(eventData, req) {
    let riskScore = 0;

    // IP reputation check
    if (req?.ip) {
      const ipRisk = await this.getIPRiskScore(req.ip);
      riskScore += ipRisk * 0.3;
    }

    // User behavior analysis
    if (eventData.userId || req?.user?.id) {
      const userRisk = await this.getUserRiskScore(eventData.userId || req.user.id);
      riskScore += userRisk * 0.4;
    }

    // Event type risk
    const eventRisk = this.getEventTypeRisk(eventData.type);
    riskScore += eventRisk * 0.3;

    // Convert to risk level
    if (riskScore >= 0.8) return RiskLevel.CRITICAL;
    if (riskScore >= 0.6) return RiskLevel.HIGH;
    if (riskScore >= 0.4) return RiskLevel.MEDIUM;
    if (riskScore >= 0.2) return RiskLevel.LOW;
    return RiskLevel.MINIMAL;
  }

  /**
   * Calculate threat score
   */
  async calculateThreatScore(eventData, req) {
    let threatScore = 0;

    // Check for known attack patterns
    if (req) {
      const requestData = JSON.stringify({
        url: req.url,
        body: req.body,
        query: req.query,
        headers: req.headers
      });

      const threatPatterns = [
        /union.*select/gi,
        /<script/gi,
        /javascript:/gi,
        /\.\.\/|\.\.\\/g,
        /eval\(/gi,
        /base64_decode/gi
      ];

      for (const pattern of threatPatterns) {
        if (pattern.test(requestData)) {
          threatScore += 0.2;
        }
      }
    }

    // Failed authentication attempts
    if (eventData.type === AuditEventType.AUTH_LOGIN_FAILURE) {
      const recentFailures = await this.getRecentFailures(req?.ip);
      threatScore += Math.min(recentFailures * 0.1, 0.5);
    }

    return Math.min(threatScore, 1);
  }

  /**
   * Calculate anomaly score
   */
  async calculateAnomalyScore(eventData, req) {
    // Implement ML-based anomaly detection here
    // For now, use simple heuristics

    let anomalyScore = 0;
    const userId = eventData.userId || req?.user?.id;

    if (userId) {
      // Check for unusual activity patterns
      const recentEvents = await this.getRecentUserEvents(userId, 3600000); // 1 hour
      const eventCounts = {};

      recentEvents.forEach(event => {
        eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
      });

      // Check for unusual event frequency
      for (const [type, count] of Object.entries(eventCounts)) {
        if (count > this.anomalyThresholds[type] * 2) {
          anomalyScore += 0.3;
        }
      }
    }

    return Math.min(anomalyScore, 1);
  }

  /**
   * Generate correlation ID for related events
   */
  async generateCorrelationId(eventData, req) {
    const correlationFactors = [
      req?.ip || 'unknown',
      eventData.userId || req?.user?.id || 'anonymous',
      req?.sessionID || 'no-session',
      eventData.type
    ];

    return crypto
      .createHash('sha256')
      .update(correlationFactors.join('|'))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Store event in Redis for real-time access
   */
  async storeInRedis(auditEvent) {
    const key = `audit:event:${auditEvent.id}`;
    await redis.setEx(key, 86400, JSON.stringify(auditEvent)); // 24 hours

    // Add to user's recent events
    if (auditEvent.userId !== 'anonymous') {
      const userEventsKey = `audit:user:${auditEvent.userId}`;
      await redis.lpush(userEventsKey, auditEvent.id);
      await redis.ltrim(userEventsKey, 0, 99); // Keep last 100 events
      await redis.expire(userEventsKey, 86400);
    }

    // Add to IP's recent events
    const ipEventsKey = `audit:ip:${auditEvent.source.ip}`;
    await redis.lpush(ipEventsKey, auditEvent.id);
    await redis.ltrim(ipEventsKey, 0, 99);
    await redis.expire(ipEventsKey, 86400);

    // Track event counts by type
    const typeCountKey = `audit:count:${auditEvent.type}:${new Date().toISOString().split('T')[0]}`;
    await redis.incr(typeCountKey);
    await redis.expire(typeCountKey, 86400 * 7); // 7 days
  }

  /**
   * Store event in persistent storage
   */
  async storePersistent(auditEvent) {
    // Implement database storage here
    // This would typically go to a dedicated audit database or data warehouse
    logger.info('Storing audit event persistently', { eventId: auditEvent.id });
  }

  /**
   * Check for anomalies and trigger alerts
   */
  async checkAnomalies(auditEvent) {
    // Check for rapid-fire events from same source
    const recentEvents = await this.getRecentIPEvents(auditEvent.source.ip, 300000); // 5 minutes

    if (recentEvents.length > 50) {
      await this.triggerAlert('RAPID_FIRE_EVENTS', {
        ip: auditEvent.source.ip,
        eventCount: recentEvents.length,
        timeWindow: '5 minutes'
      });
    }

    // Check for multiple failed logins
    if (auditEvent.type === AuditEventType.AUTH_LOGIN_FAILURE) {
      const failures = recentEvents.filter(e => e.type === AuditEventType.AUTH_LOGIN_FAILURE);

      if (failures.length >= this.anomalyThresholds.failedLogins) {
        await this.triggerAlert('MULTIPLE_FAILED_LOGINS', {
          ip: auditEvent.source.ip,
          failureCount: failures.length,
          userId: auditEvent.userId
        });
      }
    }

    // Check for privilege escalation patterns
    if (auditEvent.type.startsWith('admin.')) {
      const adminEvents = recentEvents.filter(e => e.type.startsWith('admin.'));

      if (adminEvents.length >= this.anomalyThresholds.adminActions) {
        await this.triggerAlert('EXCESSIVE_ADMIN_ACTIVITY', {
          userId: auditEvent.userId,
          adminEventCount: adminEvents.length
        });
      }
    }
  }

  /**
   * Update risk scoring based on events
   */
  async updateRiskScoring(auditEvent) {
    const userId = auditEvent.userId;
    const ip = auditEvent.source.ip;

    if (userId !== 'anonymous') {
      // Update user risk score
      const currentScore = await redis.get(`risk:user:${userId}`) || '0';
      let newScore = parseFloat(currentScore);

      switch (auditEvent.severity) {
        case AuditSeverity.CRITICAL:
          newScore += 0.3;
          break;
        case AuditSeverity.HIGH:
          newScore += 0.2;
          break;
        case AuditSeverity.MEDIUM:
          newScore += 0.1;
          break;
        default:
          newScore -= 0.01; // Slight decrease for normal activity
      }

      newScore = Math.max(0, Math.min(1, newScore)); // Clamp between 0 and 1
      await redis.setEx(`risk:user:${userId}`, 3600, newScore.toString());
    }

    // Update IP risk score
    const currentIPScore = await redis.get(`risk:ip:${ip}`) || '0';
    let newIPScore = parseFloat(currentIPScore);

    if (auditEvent.security.threatScore > 0.5) {
      newIPScore += 0.2;
    } else {
      newIPScore -= 0.005; // Very slight decrease for normal activity
    }

    newIPScore = Math.max(0, Math.min(1, newIPScore));
    await redis.setEx(`risk:ip:${ip}`, 3600, newIPScore.toString());
  }

  /**
   * Trigger security alerts
   */
  async triggerAlert(alertType, alertData) {
    const alert = {
      id: crypto.randomUUID(),
      type: alertType,
      timestamp: new Date().toISOString(),
      severity: AuditSeverity.HIGH,
      data: alertData
    };

    logger.error('Security Alert Triggered', alert);

    // Store alert
    await redis.setEx(`alert:${alert.id}`, 86400, JSON.stringify(alert));

    // Emit alert event
    this.emit('securityAlert', alert);

    // Send notifications (implement based on your notification system)
    await this.sendAlertNotification(alert);
  }

  /**
   * Send alert notifications
   */
  async sendAlertNotification(alert) {
    // Implement notification logic (email, Slack, PagerDuty, etc.)
    logger.info('Alert notification would be sent', { alertId: alert.id, type: alert.type });
  }

  /**
   * Helper methods
   */
  async getIPRiskScore(ip) {
    const score = await redis.get(`risk:ip:${ip}`);
    return parseFloat(score) || 0.1;
  }

  async getUserRiskScore(userId) {
    const score = await redis.get(`risk:user:${userId}`);
    return parseFloat(score) || 0.1;
  }

  getEventTypeRisk(eventType) {
    const riskMap = {
      [AuditEventType.SECURITY_VULNERABILITY_DETECTED]: 0.9,
      [AuditEventType.ADMIN_USER_DELETE]: 0.8,
      [AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY]: 0.7,
      [AuditEventType.AUTH_LOGIN_FAILURE]: 0.6,
      [AuditEventType.DATA_ACCESS_DELETE]: 0.5
    };

    return riskMap[eventType] || 0.1;
  }

  async getRecentFailures(ip) {
    const failures = await redis.get(`failures:${ip}`);
    return parseInt(failures) || 0;
  }

  async getRecentUserEvents(userId, timeWindow) {
    const eventIds = await redis.lrange(`audit:user:${userId}`, 0, -1);
    const events = [];

    for (const eventId of eventIds) {
      const eventData = await redis.get(`audit:event:${eventId}`);
      if (eventData) {
        const event = JSON.parse(eventData);
        if (Date.now() - new Date(event.timestamp).getTime() <= timeWindow) {
          events.push(event);
        }
      }
    }

    return events;
  }

  async getRecentIPEvents(ip, timeWindow) {
    const eventIds = await redis.lrange(`audit:ip:${ip}`, 0, -1);
    const events = [];

    for (const eventId of eventIds) {
      const eventData = await redis.get(`audit:event:${eventId}`);
      if (eventData) {
        const event = JSON.parse(eventData);
        if (Date.now() - new Date(event.timestamp).getTime() <= timeWindow) {
          events.push(event);
        }
      }
    }

    return events;
  }

  /**
   * Compliance check methods
   */
  isGDPRRelevant(eventType) {
    const gdprTypes = [
      AuditEventType.GDPR_CONSENT_GIVEN,
      AuditEventType.GDPR_CONSENT_WITHDRAWN,
      AuditEventType.GDPR_DATA_REQUEST,
      AuditEventType.GDPR_DATA_DELETION,
      AuditEventType.DATA_ACCESS_READ,
      AuditEventType.DATA_EXPORT
    ];

    return gdprTypes.includes(eventType);
  }

  isHIPAARelevant(eventType) {
    // Implement HIPAA relevance check if handling health data
    return false;
  }

  isPCIRelevant(eventType) {
    // Implement PCI relevance check if handling payment data
    const pciTypes = [
      AuditEventType.DATA_ACCESS_READ,
      AuditEventType.DATA_ACCESS_UPDATE,
      AuditEventType.DATA_ACCESS_DELETE
    ];

    return pciTypes.includes(eventType);
  }

  isSOX404Relevant(eventType) {
    // Implement SOX 404 relevance check for financial controls
    const soxTypes = [
      AuditEventType.ADMIN_CONFIG_CHANGE,
      AuditEventType.SYSTEM_CONFIG_CHANGE,
      AuditEventType.ADMIN_ROLE_CHANGE
    ];

    return soxTypes.includes(eventType);
  }

  /**
   * Setup event listeners for real-time monitoring
   */
  setupEventListeners() {
    this.on('auditEvent', (event) => {
      // Real-time event processing
      if (event.severity === AuditSeverity.CRITICAL) {
        logger.error('Critical audit event detected', event);
      }
    });

    this.on('securityAlert', (alert) => {
      // Security alert processing
      logger.error('Security alert triggered', alert);
    });
  }

  /**
   * Generate compliance reports
   */
  async generateComplianceReport(startDate, endDate, complianceType) {
    // Implement compliance report generation
    logger.info('Generating compliance report', { startDate, endDate, complianceType });
  }

  /**
   * Middleware for automatic audit logging
   */
  auditMiddleware(eventType, options = {}) {
    return async (req, res, next) => {
      const startTime = Date.now();

      // Capture original response methods
      const originalJson = res.json;
      const originalSend = res.send;
      let responseData;

      // Override response methods to capture data
      res.json = function(data) {
        responseData = data;
        return originalJson.call(this, data);
      };

      res.send = function(data) {
        if (!responseData) responseData = data;
        return originalSend.call(this, data);
      };

      // Log event after response
      res.on('finish', async () => {
        const outcome = res.statusCode < 400 ? 'success' : 'failure';
        const responseTime = Date.now() - startTime;

        await this.logEvent({
          type: eventType,
          action: options.action || req.method,
          resource: options.resource || req.route?.path || req.path,
          outcome,
          description: options.description || `${req.method} ${req.path}`,
          metadata: {
            responseTime,
            statusCode: res.statusCode,
            method: req.method,
            ...options.metadata
          }
        }, req);
      });

      next();
    };
  }
}

// Export singleton instance
const comprehensiveAuditService = new ComprehensiveAuditService();

module.exports = {
  ComprehensiveAuditService,
  AuditEventType,
  AuditSeverity,
  RiskLevel,
  auditService: comprehensiveAuditService
};