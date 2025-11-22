/**
 * Security Routes
 * Endpoints for security monitoring, reporting, and management
 */

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

import { checkResourceAccess, checkResourceAction } from '../middleware/resourceAccess';
import { securityMonitoringService, SecurityEventType } from '../services/security/SecurityMonitoringService';
import { logger } from '../utils/logger';

const router = Router();

// Rate limiting for security endpoints
const securityRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many security requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(securityRateLimit);

/**
 * GET /api/security/events
 * Get security events for monitoring dashboard
 * Admin only
 */
router.get('/events', checkResourceAction(['read']), async (req: Request, res: Response) => {
  try {
    const user = req.user;

    // Only admins can view security events
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      page = 1,
      limit = 50,
      eventType,
      severity,
      startDate,
      endDate,
      timeRange
    } = req.query;

    // Parse query parameters
    const eventTypes = eventType ? [eventType as SecurityEventType] : undefined;
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    const range = timeRange ? parseInt(timeRange as string) : undefined;

    // Get events from monitoring service
    const events = securityMonitoringService.getComplianceEvents(start, end, eventTypes);

    // Filter by severity if specified
    const filteredEvents = severity
      ? events.filter(event => event.severity === severity)
      : events;

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

    // Get metrics
    const metrics = securityMonitoringService.getSecurityMetrics(range);

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
  } catch (error) {
    logger.error('Error fetching security events', { error, userId: req.user?.id });
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

/**
 * GET /api/security/metrics
 * Get security metrics and statistics
 * Admin only
 */
router.get('/metrics', checkResourceAction(['read']), async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { timeRange } = req.query;
    const range = timeRange ? parseInt(timeRange as string) : 86400; // Default 24 hours

    const metrics = securityMonitoringService.getSecurityMetrics(range);

    res.json({
      metrics,
      timeRange: range,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching security metrics', { error, userId: req.user?.id });
    res.status(500).json({ error: 'Failed to fetch security metrics' });
  }
});

/**
 * POST /api/security/test-event
 * Create a test security event (development only)
 * Admin only
 */
router.post('/test-event', checkResourceAction(['create']), async (req: Request, res: Response) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Test events not allowed in production' });
    }

    const user = req.user;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { type, severity, description, metadata } = req.body;

    const event = await securityMonitoringService.recordEvent({
      type: type || SecurityEventType.SUSPICIOUS_REQUEST,
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
  } catch (error) {
    logger.error('Error creating test security event', { error, userId: req.user?.id });
    res.status(500).json({ error: 'Failed to create test event' });
  }
});

/**
 * GET /api/security/compliance/export
 * Export compliance data for auditing
 * Admin only
 */
router.get('/compliance/export', checkResourceAction(['read']), async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { startDate, endDate, format = 'json' } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    const end = endDate ? new Date(endDate as string) : new Date();

    const events = securityMonitoringService.getComplianceEvents(start, end);

    // Log the export for audit trail
    await securityMonitoringService.recordEvent({
      type: SecurityEventType.COMPLIANCE_VIOLATION,
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
      // Convert to CSV format
      const csvHeader = 'ID,Type,Severity,Timestamp,Source,Description,UserID,IPAddress,Endpoint\n';
      const csvData = events.map(event =>
        `${event.id},${event.type},${event.severity},${event.timestamp.toISOString()},${event.source},"${event.description}",${event.userId || ''},${event.ipAddress || ''},${event.endpoint || ''}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="security-events-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv"`);
      res.send(csvHeader + csvData);
    } else {
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
  } catch (error) {
    logger.error('Error exporting compliance data', { error, userId: req.user?.id });
    res.status(500).json({ error: 'Failed to export compliance data' });
  }
});

/**
 * POST /api/security/cleanup
 * Clean up old security events
 * Admin only
 */
router.post('/cleanup', checkResourceAction(['create']), async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { maxAge = 86400000 } = req.body; // Default 24 hours

    const metricsBefore = securityMonitoringService.getSecurityMetrics();

    securityMonitoringService.cleanup(maxAge);

    const metricsAfter = securityMonitoringService.getSecurityMetrics();

    // Log the cleanup
    await securityMonitoringService.recordEvent({
      type: SecurityEventType.COMPLIANCE_VIOLATION,
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
  } catch (error) {
    logger.error('Error cleaning up security events', { error, userId: req.user?.id });
    res.status(500).json({ error: 'Failed to clean up security events' });
  }
});

export default router;