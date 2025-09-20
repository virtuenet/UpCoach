"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const resourceAccess_1 = require("../middleware/resourceAccess");
const SecurityMonitoringService_1 = require("../services/security/SecurityMonitoringService");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const securityRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many security requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
});
router.use(securityRateLimit);
router.get('/events', (0, resourceAccess_1.checkResourceAction)(['read']), async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { page = 1, limit = 50, eventType, severity, startDate, endDate, timeRange } = req.query;
        const eventTypes = eventType ? [eventType] : undefined;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const range = timeRange ? parseInt(timeRange) : undefined;
        const events = SecurityMonitoringService_1.securityMonitoringService.getComplianceEvents(start, end, eventTypes);
        const filteredEvents = severity
            ? events.filter(event => event.severity === severity)
            : events;
        const startIndex = (Number(page) - 1) * Number(limit);
        const endIndex = startIndex + Number(limit);
        const paginatedEvents = filteredEvents.slice(startIndex, endIndex);
        const metrics = SecurityMonitoringService_1.securityMonitoringService.getSecurityMetrics(range);
        res.json({
            events: paginatedEvents,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: filteredEvents.length,
                pages: Math.ceil(filteredEvents.length / Number(limit)),
            },
            metrics,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching security events', { error, userId: req.user?.id });
        res.status(500).json({ error: 'Failed to fetch security events' });
    }
});
router.get('/metrics', (0, resourceAccess_1.checkResourceAction)(['read']), async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { timeRange } = req.query;
        const range = timeRange ? parseInt(timeRange) : 86400;
        const metrics = SecurityMonitoringService_1.securityMonitoringService.getSecurityMetrics(range);
        res.json({
            metrics,
            timeRange: range,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching security metrics', { error, userId: req.user?.id });
        res.status(500).json({ error: 'Failed to fetch security metrics' });
    }
});
router.post('/test-event', (0, resourceAccess_1.checkResourceAction)(['create']), async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ error: 'Test events not allowed in production' });
        }
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { type, severity, description, metadata } = req.body;
        const event = await SecurityMonitoringService_1.securityMonitoringService.recordEvent({
            type: type || SecurityMonitoringService_1.SecurityEventType.SUSPICIOUS_REQUEST,
            severity: severity || 'medium',
            source: 'test_api',
            description: description || 'Test security event',
            metadata: metadata || {},
            userId: user.id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            endpoint: req.path,
            method: req.method,
        });
        res.json({ event });
    }
    catch (error) {
        logger_1.logger.error('Error creating test security event', { error, userId: req.user?.id });
        res.status(500).json({ error: 'Failed to create test event' });
    }
});
router.get('/compliance/export', (0, resourceAccess_1.checkResourceAction)(['read']), async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { startDate, endDate, format = 'json' } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const events = SecurityMonitoringService_1.securityMonitoringService.getComplianceEvents(start, end);
        await SecurityMonitoringService_1.securityMonitoringService.recordEvent({
            type: SecurityMonitoringService_1.SecurityEventType.COMPLIANCE_VIOLATION,
            severity: 'low',
            source: 'security_api',
            description: `Compliance data exported by admin ${user.id}`,
            metadata: {
                exportedEvents: events.length,
                dateRange: { start, end },
                format,
            },
            userId: user.id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            endpoint: req.path,
            method: req.method,
        });
        if (format === 'csv') {
            const csvHeader = 'ID,Type,Severity,Timestamp,Source,Description,UserID,IPAddress,Endpoint\n';
            const csvData = events.map(event => `${event.id},${event.type},${event.severity},${event.timestamp.toISOString()},${event.source},"${event.description}",${event.userId || ''},${event.ipAddress || ''},${event.endpoint || ''}`).join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="security-events-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv"`);
            res.send(csvHeader + csvData);
        }
        else {
            res.json({
                events,
                exportInfo: {
                    totalEvents: events.length,
                    dateRange: { start, end },
                    exportedAt: new Date().toISOString(),
                    exportedBy: user.id,
                },
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Error exporting compliance data', { error, userId: req.user?.id });
        res.status(500).json({ error: 'Failed to export compliance data' });
    }
});
router.post('/cleanup', (0, resourceAccess_1.checkResourceAction)(['create']), async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { maxAge = 86400000 } = req.body;
        const metricsBefore = SecurityMonitoringService_1.securityMonitoringService.getSecurityMetrics();
        SecurityMonitoringService_1.securityMonitoringService.cleanup(maxAge);
        const metricsAfter = SecurityMonitoringService_1.securityMonitoringService.getSecurityMetrics();
        await SecurityMonitoringService_1.securityMonitoringService.recordEvent({
            type: SecurityMonitoringService_1.SecurityEventType.COMPLIANCE_VIOLATION,
            severity: 'low',
            source: 'security_api',
            description: `Security events cleaned up by admin ${user.id}`,
            metadata: {
                maxAge,
                eventsBefore: metricsBefore.eventCount,
                eventsAfter: metricsAfter.eventCount,
                eventsRemoved: metricsBefore.eventCount - metricsAfter.eventCount,
            },
            userId: user.id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            endpoint: req.path,
            method: req.method,
        });
        res.json({
            message: 'Security events cleaned up successfully',
            eventsRemoved: metricsBefore.eventCount - metricsAfter.eventCount,
            currentEventCount: metricsAfter.eventCount,
        });
    }
    catch (error) {
        logger_1.logger.error('Error cleaning up security events', { error, userId: req.user?.id });
        res.status(500).json({ error: 'Failed to clean up security events' });
    }
});
exports.default = router;
//# sourceMappingURL=security.js.map