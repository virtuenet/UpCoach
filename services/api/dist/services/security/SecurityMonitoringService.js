"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityMonitoringService = exports.SecurityMonitoringService = exports.AlertStatus = exports.AlertChannel = exports.SecurityEventSeverity = exports.SecurityEventType = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const SentryService_1 = require("../monitoring/SentryService");
var SecurityEventType;
(function (SecurityEventType) {
    SecurityEventType["CSP_VIOLATION"] = "csp_violation";
    SecurityEventType["EXPECT_CT_VIOLATION"] = "expect_ct_violation";
    SecurityEventType["CERTIFICATE_TRANSPARENCY_VIOLATION"] = "ct_violation";
    SecurityEventType["IDOR_ATTEMPT"] = "idor_attempt";
    SecurityEventType["AUTHENTICATION_FAILURE"] = "auth_failure";
    SecurityEventType["AUTHORIZATION_FAILURE"] = "authz_failure";
    SecurityEventType["RATE_LIMIT_EXCEEDED"] = "rate_limit_exceeded";
    SecurityEventType["SUSPICIOUS_REQUEST"] = "suspicious_request";
    SecurityEventType["MALFORMED_REQUEST"] = "malformed_request";
    SecurityEventType["SQL_INJECTION_ATTEMPT"] = "sql_injection_attempt";
    SecurityEventType["XSS_ATTEMPT"] = "xss_attempt";
    SecurityEventType["CSRF_VIOLATION"] = "csrf_violation";
    SecurityEventType["SECURITY_HEADER_VIOLATION"] = "security_header_violation";
    SecurityEventType["UNUSUAL_ACCESS_PATTERN"] = "unusual_access_pattern";
    SecurityEventType["DATA_BREACH_ATTEMPT"] = "data_breach_attempt";
    SecurityEventType["PRIVILEGE_ESCALATION"] = "privilege_escalation";
    SecurityEventType["ACCOUNT_COMPROMISE"] = "account_compromise";
    SecurityEventType["COMPLIANCE_VIOLATION"] = "compliance_violation";
})(SecurityEventType || (exports.SecurityEventType = SecurityEventType = {}));
var SecurityEventSeverity;
(function (SecurityEventSeverity) {
    SecurityEventSeverity["LOW"] = "low";
    SecurityEventSeverity["MEDIUM"] = "medium";
    SecurityEventSeverity["HIGH"] = "high";
    SecurityEventSeverity["CRITICAL"] = "critical";
})(SecurityEventSeverity || (exports.SecurityEventSeverity = SecurityEventSeverity = {}));
var AlertChannel;
(function (AlertChannel) {
    AlertChannel["EMAIL"] = "email";
    AlertChannel["SLACK"] = "slack";
    AlertChannel["SMS"] = "sms";
    AlertChannel["WEBHOOK"] = "webhook";
    AlertChannel["PAGERDUTY"] = "pagerduty";
})(AlertChannel || (exports.AlertChannel = AlertChannel = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["PENDING"] = "pending";
    AlertStatus["SENT"] = "sent";
    AlertStatus["FAILED"] = "failed";
    AlertStatus["ACKNOWLEDGED"] = "acknowledged";
    AlertStatus["RESOLVED"] = "resolved";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
class SecurityMonitoringService extends events_1.EventEmitter {
    static instance;
    events = new Map();
    alerts = new Map();
    alertRules = new Map();
    complianceStorage = [];
    maxComplianceEvents = 10000;
    constructor() {
        super();
        this.setupDefaultAlertRules();
    }
    static getInstance() {
        if (!SecurityMonitoringService.instance) {
            SecurityMonitoringService.instance = new SecurityMonitoringService();
        }
        return SecurityMonitoringService.instance;
    }
    async recordEvent(event) {
        const securityEvent = {
            ...event,
            id: this.generateEventId(),
            timestamp: new Date(),
        };
        this.events.set(securityEvent.id, securityEvent);
        this.addToComplianceStorage(securityEvent);
        logger_1.logger.warn('Security event recorded', {
            eventId: securityEvent.id,
            type: securityEvent.type,
            severity: securityEvent.severity,
            source: securityEvent.source,
            description: securityEvent.description,
            metadata: securityEvent.metadata,
        });
        this.sendToExternalMonitoring(securityEvent);
        await this.evaluateAlertRules(securityEvent);
        this.emit('securityEvent', securityEvent);
        return securityEvent;
    }
    sendToExternalMonitoring(event) {
        try {
            SentryService_1.sentryService.captureMessage(`Security Event: ${event.type}`, event.severity === SecurityEventSeverity.CRITICAL ? 'error' : 'warning', {
                securityEvent: event,
                tags: {
                    securityEventType: event.type,
                    severity: event.severity,
                    source: event.source,
                },
            });
            SentryService_1.sentryService.addBreadcrumb({
                message: `Security event: ${event.description}`,
                category: 'security',
                level: event.severity === SecurityEventSeverity.CRITICAL ? 'error' : 'warning',
                data: {
                    eventType: event.type,
                    eventId: event.id,
                    source: event.source,
                },
            });
            if (process.env.DATADOG_API_KEY) {
                this.sendToDataDog(event);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send security event to external monitoring', { error, eventId: event.id });
        }
    }
    async sendToDataDog(event) {
        try {
            const tracer = require('dd-trace');
            if (tracer) {
                tracer.increment('security.event.count', 1, {
                    event_type: event.type,
                    severity: event.severity,
                    source: event.source,
                });
            }
        }
        catch (error) {
            logger_1.logger.debug('DataDog not available for security metrics', { error });
        }
    }
    addToComplianceStorage(event) {
        this.complianceStorage.push(event);
        if (this.complianceStorage.length > this.maxComplianceEvents) {
            this.complianceStorage = this.complianceStorage.slice(-this.maxComplianceEvents);
        }
    }
    setupDefaultAlertRules() {
        const criticalRule = {
            threshold: 1,
            timeWindow: 60,
            channels: [AlertChannel.EMAIL, AlertChannel.SLACK, AlertChannel.PAGERDUTY],
            escalation: true,
        };
        const highSeverityRule = {
            threshold: 3,
            timeWindow: 300,
            channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
            escalation: false,
        };
        const mediumSeverityRule = {
            threshold: 10,
            timeWindow: 900,
            channels: [AlertChannel.EMAIL],
            escalation: false,
        };
        this.alertRules.set(SecurityEventType.IDOR_ATTEMPT, [criticalRule]);
        this.alertRules.set(SecurityEventType.SQL_INJECTION_ATTEMPT, [criticalRule]);
        this.alertRules.set(SecurityEventType.DATA_BREACH_ATTEMPT, [criticalRule]);
        this.alertRules.set(SecurityEventType.ACCOUNT_COMPROMISE, [criticalRule]);
        this.alertRules.set(SecurityEventType.PRIVILEGE_ESCALATION, [criticalRule]);
        this.alertRules.set(SecurityEventType.AUTHENTICATION_FAILURE, [highSeverityRule]);
        this.alertRules.set(SecurityEventType.AUTHORIZATION_FAILURE, [highSeverityRule]);
        this.alertRules.set(SecurityEventType.XSS_ATTEMPT, [highSeverityRule]);
        this.alertRules.set(SecurityEventType.CSRF_VIOLATION, [highSeverityRule]);
        this.alertRules.set(SecurityEventType.CSP_VIOLATION, [mediumSeverityRule]);
        this.alertRules.set(SecurityEventType.RATE_LIMIT_EXCEEDED, [mediumSeverityRule]);
        this.alertRules.set(SecurityEventType.SUSPICIOUS_REQUEST, [mediumSeverityRule]);
    }
    async evaluateAlertRules(event) {
        const rules = this.alertRules.get(event.type);
        if (!rules)
            return;
        for (const rule of rules) {
            const shouldAlert = await this.checkAlertRule(event, rule);
            if (shouldAlert) {
                await this.triggerAlert(event, rule);
            }
        }
    }
    async checkAlertRule(event, rule) {
        const timeThreshold = new Date(Date.now() - rule.timeWindow * 1000);
        const recentEvents = Array.from(this.events.values()).filter(e => e.type === event.type && e.timestamp >= timeThreshold);
        return recentEvents.length >= rule.threshold;
    }
    async triggerAlert(event, rule) {
        const alert = {
            eventId: event.id,
            alertId: this.generateAlertId(),
            timestamp: new Date(),
            recipients: await this.getAlertRecipients(rule.channels),
            channel: rule.channels[0],
            status: AlertStatus.PENDING,
            escalationLevel: 0,
        };
        this.alerts.set(alert.alertId, alert);
        try {
            await this.sendAlert(alert, event, rule);
            alert.status = AlertStatus.SENT;
            logger_1.logger.info('Security alert sent', {
                alertId: alert.alertId,
                eventId: event.id,
                recipients: alert.recipients,
                channels: rule.channels,
            });
        }
        catch (error) {
            alert.status = AlertStatus.FAILED;
            logger_1.logger.error('Failed to send security alert', {
                error,
                alertId: alert.alertId,
                eventId: event.id,
            });
        }
    }
    async sendAlert(alert, event, rule) {
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
            }
            catch (error) {
                logger_1.logger.error(`Failed to send alert via ${channel}`, { error, alertId: alert.alertId });
            }
        }
    }
    formatAlertMessage(event, alert) {
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
    async sendEmailAlert(message, recipients) {
        logger_1.logger.info('Email alert would be sent', { recipients, message: message.substring(0, 100) });
    }
    async sendSlackAlert(message) {
        logger_1.logger.info('Slack alert would be sent', { message: message.substring(0, 100) });
    }
    async sendSMSAlert(message, recipients) {
        logger_1.logger.info('SMS alert would be sent', { recipients, message: message.substring(0, 100) });
    }
    async sendWebhookAlert(event, alert) {
        logger_1.logger.info('Webhook alert would be sent', { eventId: event.id, alertId: alert.alertId });
    }
    async sendPagerDutyAlert(event, alert) {
        logger_1.logger.info('PagerDuty alert would be sent', { eventId: event.id, alertId: alert.alertId });
    }
    async getAlertRecipients(channels) {
        const defaultRecipients = [
            'security@upcoach.ai',
            'admin@upcoach.ai',
        ];
        return defaultRecipients;
    }
    getComplianceEvents(startDate, endDate, eventTypes) {
        let events = this.complianceStorage;
        if (startDate || endDate || eventTypes) {
            events = events.filter(event => {
                if (startDate && event.timestamp < startDate)
                    return false;
                if (endDate && event.timestamp > endDate)
                    return false;
                if (eventTypes && !eventTypes.includes(event.type))
                    return false;
                return true;
            });
        }
        return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    getSecurityMetrics(timeRange) {
        const cutoff = timeRange ? new Date(Date.now() - timeRange * 1000) : null;
        const relevantEvents = Array.from(this.events.values()).filter(event => !cutoff || event.timestamp >= cutoff);
        const relevantAlerts = Array.from(this.alerts.values()).filter(alert => !cutoff || alert.timestamp >= cutoff);
        const eventsByType = {};
        const eventsBySeverity = {};
        const alertsByChannel = {};
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
            meanTimeToAcknowledge: 0,
            meanTimeToResolve: 0,
        };
    }
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateAlertId() {
        return `alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    cleanup(maxAge = 86400000) {
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
exports.SecurityMonitoringService = SecurityMonitoringService;
exports.securityMonitoringService = SecurityMonitoringService.getInstance();
