/**
 * Security Monitoring Service
 * Centralized security event monitoring, alerting, and compliance logging
 */

import { EventEmitter } from 'events';

import { logger } from '../../utils/logger';
import { sentryService } from '../monitoring/SentryService';

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  timestamp: Date;
  source: string;
  description: string;
  metadata: unknown;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  resourceId?: string;
  organizationId?: string;
}

export enum SecurityEventType {
  CSP_VIOLATION = 'csp_violation',
  EXPECT_CT_VIOLATION = 'expect_ct_violation',
  CERTIFICATE_TRANSPARENCY_VIOLATION = 'ct_violation',
  IDOR_ATTEMPT = 'idor_attempt',
  AUTHENTICATION_FAILURE = 'auth_failure',
  AUTHORIZATION_FAILURE = 'authz_failure',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_REQUEST = 'suspicious_request',
  MALFORMED_REQUEST = 'malformed_request',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_VIOLATION = 'csrf_violation',
  SECURITY_HEADER_VIOLATION = 'security_header_violation',
  UNUSUAL_ACCESS_PATTERN = 'unusual_access_pattern',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  ACCOUNT_COMPROMISE = 'account_compromise',
  COMPLIANCE_VIOLATION = 'compliance_violation',
}

export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface SecurityAlert {
  eventId: string;
  alertId: string;
  timestamp: Date;
  recipients: string[];
  channel: AlertChannel;
  status: AlertStatus;
  escalationLevel: number;
}

export enum AlertChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  PAGERDUTY = 'pagerduty',
}

export enum AlertStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

export interface SecurityMetrics {
  eventCount: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecurityEventSeverity, number>;
  alertCount: number;
  alertsByChannel: Record<AlertChannel, number>;
  meanTimeToAcknowledge: number;
  meanTimeToResolve: number;
}

export class SecurityMonitoringService extends EventEmitter {
  private static instance: SecurityMonitoringService;
  private events: Map<string, SecurityEvent> = new Map();
  private alerts: Map<string, SecurityAlert> = new Map();
  private alertRules: Map<SecurityEventType, AlertRule[]> = new Map();
  private complianceStorage: SecurityEvent[] = [];
  private maxComplianceEvents = 10000; // Keep last 10k events for compliance

  private constructor() {
    super();
    this.setupDefaultAlertRules();
  }

  static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService();
    }
    return SecurityMonitoringService.instance;
  }

  /**
   * Record a security event
   */
  async recordEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<SecurityEvent> {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    // Store event
    this.events.set(securityEvent.id, securityEvent);

    // Add to compliance storage
    this.addToComplianceStorage(securityEvent);

    // Log event
    logger.warn('Security event recorded', {
      eventId: securityEvent.id,
      type: securityEvent.type,
      severity: securityEvent.severity,
      source: securityEvent.source,
      description: securityEvent.description,
      metadata: securityEvent.metadata,
    });

    // Send to external monitoring (Sentry)
    this.sendToExternalMonitoring(securityEvent);

    // Check if alert should be triggered
    await this.evaluateAlertRules(securityEvent);

    // Emit event for listeners
    this.emit('securityEvent', securityEvent);

    return securityEvent;
  }

  /**
   * Send event to external monitoring services
   */
  private sendToExternalMonitoring(event: SecurityEvent): void {
    try {
      // Send to Sentry
      sentryService.captureMessage(
        `Security Event: ${event.type}`,
        event.severity === SecurityEventSeverity.CRITICAL ? 'error' : 'warning',
        {
          securityEvent: event,
          tags: {
            securityEventType: event.type,
            severity: event.severity,
            source: event.source,
          },
        }
      );

      // Add breadcrumb for context
      sentryService.addBreadcrumb({
        message: `Security event: ${event.description}`,
        category: 'security',
        level: event.severity === SecurityEventSeverity.CRITICAL ? 'error' : 'warning',
        data: {
          eventType: event.type,
          eventId: event.id,
          source: event.source,
        },
      });

      // Send to DataDog or other APM tools if configured
      if (process.env.DATADOG_API_KEY) {
        this.sendToDataDog(event);
      }
    } catch (error) {
      logger.error('Failed to send security event to external monitoring', { error, eventId: event.id });
    }
  }

  /**
   * Send to DataDog for metrics and alerting
   */
  private async sendToDataDog(event: SecurityEvent): Promise<void> {
    try {
      // Using dd-trace if available
      const tracer = require('dd-trace');
      if (tracer) {
        tracer.increment('security.event.count', 1, {
          event_type: event.type,
          severity: event.severity,
          source: event.source,
        });
      }
    } catch (error) {
      logger.debug('DataDog not available for security metrics', { error });
    }
  }

  /**
   * Store event for compliance auditing
   */
  private addToComplianceStorage(event: SecurityEvent): void {
    this.complianceStorage.push(event);

    // Keep only the most recent events to prevent memory bloat
    if (this.complianceStorage.length > this.maxComplianceEvents) {
      this.complianceStorage = this.complianceStorage.slice(-this.maxComplianceEvents);
    }
  }

  /**
   * Setup default alert rules for security events
   */
  private setupDefaultAlertRules(): void {
    // Critical events - immediate alert
    const criticalRule: AlertRule = {
      threshold: 1,
      timeWindow: 60, // 1 minute
      channels: [AlertChannel.EMAIL, AlertChannel.SLACK, AlertChannel.PAGERDUTY],
      escalation: true,
    };

    // High severity events - alert after 3 in 5 minutes
    const highSeverityRule: AlertRule = {
      threshold: 3,
      timeWindow: 300, // 5 minutes
      channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
      escalation: false,
    };

    // Medium severity events - alert after 10 in 15 minutes
    const mediumSeverityRule: AlertRule = {
      threshold: 10,
      timeWindow: 900, // 15 minutes
      channels: [AlertChannel.EMAIL],
      escalation: false,
    };

    // Set rules for critical event types
    this.alertRules.set(SecurityEventType.IDOR_ATTEMPT, [criticalRule]);
    this.alertRules.set(SecurityEventType.SQL_INJECTION_ATTEMPT, [criticalRule]);
    this.alertRules.set(SecurityEventType.DATA_BREACH_ATTEMPT, [criticalRule]);
    this.alertRules.set(SecurityEventType.ACCOUNT_COMPROMISE, [criticalRule]);
    this.alertRules.set(SecurityEventType.PRIVILEGE_ESCALATION, [criticalRule]);

    // High severity rules
    this.alertRules.set(SecurityEventType.AUTHENTICATION_FAILURE, [highSeverityRule]);
    this.alertRules.set(SecurityEventType.AUTHORIZATION_FAILURE, [highSeverityRule]);
    this.alertRules.set(SecurityEventType.XSS_ATTEMPT, [highSeverityRule]);
    this.alertRules.set(SecurityEventType.CSRF_VIOLATION, [highSeverityRule]);

    // Medium severity rules
    this.alertRules.set(SecurityEventType.CSP_VIOLATION, [mediumSeverityRule]);
    this.alertRules.set(SecurityEventType.RATE_LIMIT_EXCEEDED, [mediumSeverityRule]);
    this.alertRules.set(SecurityEventType.SUSPICIOUS_REQUEST, [mediumSeverityRule]);
  }

  /**
   * Evaluate if alert rules are triggered
   */
  private async evaluateAlertRules(event: SecurityEvent): Promise<void> {
    const rules = this.alertRules.get(event.type);
    if (!rules) return;

    for (const rule of rules) {
      const shouldAlert = await this.checkAlertRule(event, rule);
      if (shouldAlert) {
        await this.triggerAlert(event, rule);
      }
    }
  }

  /**
   * Check if an alert rule is triggered
   */
  private async checkAlertRule(event: SecurityEvent, rule: AlertRule): Promise<boolean> {
    const timeThreshold = new Date(Date.now() - rule.timeWindow * 1000);
    const recentEvents = Array.from(this.events.values()).filter(
      e => e.type === event.type && e.timestamp >= timeThreshold
    );

    return recentEvents.length >= rule.threshold;
  }

  /**
   * Trigger security alert
   */
  private async triggerAlert(event: SecurityEvent, rule: AlertRule): Promise<void> {
    const alert: SecurityAlert = {
      eventId: event.id,
      alertId: this.generateAlertId(),
      timestamp: new Date(),
      recipients: await this.getAlertRecipients(rule.channels),
      channel: rule.channels[0], // Primary channel
      status: AlertStatus.PENDING,
      escalationLevel: 0,
    };

    this.alerts.set(alert.alertId, alert);

    try {
      // Send alert via configured channels
      await this.sendAlert(alert, event, rule);

      alert.status = AlertStatus.SENT;
      logger.info('Security alert sent', {
        alertId: alert.alertId,
        eventId: event.id,
        recipients: alert.recipients,
        channels: rule.channels,
      });
    } catch (error) {
      alert.status = AlertStatus.FAILED;
      logger.error('Failed to send security alert', {
        error,
        alertId: alert.alertId,
        eventId: event.id,
      });
    }
  }

  /**
   * Send alert via configured channels
   */
  private async sendAlert(alert: SecurityAlert, event: SecurityEvent, rule: AlertRule): Promise<void> {
    const alertMessage = this.formatAlertMessage(event, alert);

    for (const channel of rule.channels) {
      try {
        switch (channel) {
          case AlertChannel.EMAIL:
            await this.sendEmailAlert(alertMessage, alert.recipients);
            break;
          case AlertChannel.SLACK:
            await this.sendSlackAlert(alertMessage);
            break;
          case AlertChannel.SMS:
            await this.sendSMSAlert(alertMessage, alert.recipients);
            break;
          case AlertChannel.WEBHOOK:
            await this.sendWebhookAlert(event, alert);
            break;
          case AlertChannel.PAGERDUTY:
            await this.sendPagerDutyAlert(event, alert);
            break;
        }
      } catch (error) {
        logger.error(`Failed to send alert via ${channel}`, { error, alertId: alert.alertId });
      }
    }
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(event: SecurityEvent, alert: SecurityAlert): string {
    return `
🚨 SECURITY ALERT 🚨

Event Type: ${event.type}
Severity: ${event.severity.toUpperCase()}
Time: ${event.timestamp.toISOString()}
Source: ${event.source}

Description: ${event.description}

Event ID: ${event.id}
Alert ID: ${alert.alertId}

${event.userId ? `User ID: ${event.userId}` : ''}
${event.ipAddress ? `IP Address: ${event.ipAddress}` : ''}
${event.endpoint ? `Endpoint: ${event.method} ${event.endpoint}` : ''}

Please investigate immediately.
    `.trim();
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(message: string, recipients: string[]): Promise<void> {
    // Implementation would integrate with your email service
    logger.info('Email alert would be sent', { recipients, message: message.substring(0, 100) });
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(message: string): Promise<void> {
    // Implementation would integrate with Slack API
    logger.info('Slack alert would be sent', { message: message.substring(0, 100) });
  }

  /**
   * Send SMS alert
   */
  private async sendSMSAlert(message: string, recipients: string[]): Promise<void> {
    // Implementation would integrate with SMS service
    logger.info('SMS alert would be sent', { recipients, message: message.substring(0, 100) });
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(event: SecurityEvent, alert: SecurityAlert): Promise<void> {
    // Implementation would send to configured webhook endpoint
    logger.info('Webhook alert would be sent', { eventId: event.id, alertId: alert.alertId });
  }

  /**
   * Send PagerDuty alert
   */
  private async sendPagerDutyAlert(event: SecurityEvent, alert: SecurityAlert): Promise<void> {
    // Implementation would integrate with PagerDuty API
    logger.info('PagerDuty alert would be sent', { eventId: event.id, alertId: alert.alertId });
  }

  /**
   * Get alert recipients for channels
   */
  private async getAlertRecipients(channels: AlertChannel[]): Promise<string[]> {
    // This would typically come from configuration or database
    const defaultRecipients = [
      'security@upcoach.ai',
      'admin@upcoach.ai',
    ];

    return defaultRecipients;
  }

  /**
   * Get compliance events for audit
   */
  getComplianceEvents(
    startDate?: Date,
    endDate?: Date,
    eventTypes?: SecurityEventType[]
  ): SecurityEvent[] {
    let events = this.complianceStorage;

    if (startDate || endDate || eventTypes) {
      events = events.filter(event => {
        if (startDate && event.timestamp < startDate) return false;
        if (endDate && event.timestamp > endDate) return false;
        if (eventTypes && !eventTypes.includes(event.type)) return false;
        return true;
      });
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(timeRange?: number): SecurityMetrics {
    const cutoff = timeRange ? new Date(Date.now() - timeRange * 1000) : null;
    const relevantEvents = Array.from(this.events.values()).filter(
      event => !cutoff || event.timestamp >= cutoff
    );
    const relevantAlerts = Array.from(this.alerts.values()).filter(
      alert => !cutoff || alert.timestamp >= cutoff
    );

    const eventsByType = {} as Record<SecurityEventType, number>;
    const eventsBySeverity = {} as Record<SecurityEventSeverity, number>;
    const alertsByChannel = {} as Record<AlertChannel, number>;

    relevantEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    relevantAlerts.forEach(alert => {
      alertsByChannel[alert.channel] = (alertsByChannel[alert.channel] || 0) + 1;
    });

    return {
      eventCount: relevantEvents.length,
      eventsByType,
      eventsBySeverity,
      alertCount: relevantAlerts.length,
      alertsByChannel,
      meanTimeToAcknowledge: 0, // Would calculate from alert timestamps
      meanTimeToResolve: 0, // Would calculate from alert timestamps
    };
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old events to prevent memory leaks
   */
  cleanup(maxAge: number = 86400000): void { // Default 24 hours
    const cutoff = new Date(Date.now() - maxAge);

    for (const [id, event] of this.events.entries()) {
      if (event.timestamp < cutoff) {
        this.events.delete(id);
      }
    }

    for (const [id, alert] of this.alerts.entries()) {
      if (alert.timestamp < cutoff) {
        this.alerts.delete(id);
      }
    }
  }
}

interface AlertRule {
  threshold: number;
  timeWindow: number; // seconds
  channels: AlertChannel[];
  escalation: boolean;
}

// Export singleton instance
export const securityMonitoringService = SecurityMonitoringService.getInstance();