/**
 * Security Dashboard API Routes
 * Phase 13 Week 1
 *
 * RESTful API for security dashboard - real-time metrics, threats,
 * incidents, and security reports
 */

import { Router, Request, Response } from 'express';
import { WAFManager } from '../security/waf/WAFService';
import { DDoSManager } from '../security/ddos/DDoSProtection';
import { IDSManager } from '../security/ids/IntrusionDetectionService';
import { SecurityEventManager } from '../security/events/SecurityEventAggregator';
import { ThreatIntelManager } from '../security/threat-intel/ThreatIntelligenceService';

const router = Router();

/**
 * GET /api/security/dashboard
 * Get real-time security metrics
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const waf = WAFManager.getInstance();
    const ddos = DDoSManager.getInstance();
    const ids = IDSManager.getInstance();
    const events = SecurityEventManager.getInstance();

    const wafStats = waf.getStats();
    const ddosStats = ddos.getStats();
    const idsStats = ids.getStats();
    const eventStats = events.getStats();

    // Get active threats (last 24 hours)
    const yesterday = new Date(Date.now() - 86400000);
    const recentEvents = events.getEvents({
      startTime: yesterday,
      severity: 'critical'
    });

    // Get banned IPs
    const bannedIPs = ddos.getBannedIPs();

    // Get unresolved IDS alerts
    const unresolvedAlerts = ids.getAlerts({
      resolved: false,
      severity: 'critical'
    });

    res.json({
      timestamp: new Date().toISOString(),
      metrics: {
        waf: {
          totalRequests: wafStats.totalRequests,
          blockedRequests: wafStats.blockedRequests,
          blockRate: wafStats.blockRate.toFixed(2) + '%',
          topAttackTypes: Array.from(wafStats.topAttackTypes.entries())
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        },
        ddos: {
          totalRequests: ddosStats.totalRequests,
          blockedRequests: ddosStats.blockedRequests,
          bannedIPs: ddosStats.bannedIPs,
          activeAttacks: ddosStats.activeAttacks,
          mitigationEffectiveness: ddosStats.mitigationEffectiveness.toFixed(2) + '%'
        },
        ids: {
          totalAlerts: idsStats.totalAlerts,
          criticalAlerts: idsStats.criticalAlerts,
          unresolvedAlerts: unresolvedAlerts.length,
          detectionAccuracy: idsStats.detectionAccuracy.toFixed(2) + '%'
        },
        events: {
          totalEvents: eventStats.totalEvents,
          eventsLast24Hours: eventStats.eventsLast24Hours,
          correlatedEvents: eventStats.correlatedEvents
        }
      },
      activeThreats: {
        count: recentEvents.length,
        bannedIPs: bannedIPs.length,
        criticalAlerts: unresolvedAlerts.length
      },
      recentActivity: recentEvents.slice(0, 10)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load security dashboard' });
  }
});

/**
 * GET /api/security/threats
 * Get active threats with pagination
 */
router.get('/threats', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, severity, source } = req.query;
    const events = SecurityEventManager.getInstance();

    const allThreats = events.getEvents({
      severity: severity as any,
      source: source as any
    });

    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedThreats = allThreats.slice(startIndex, endIndex);

    res.json({
      threats: paginatedThreats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: allThreats.length,
        totalPages: Math.ceil(allThreats.length / Number(limit))
      }
    });
  } catch (error) {
    console.error('Threats error:', error);
    res.status(500).json({ error: 'Failed to load threats' });
  }
});

/**
 * GET /api/security/incidents
 * Get security incidents (last 30 days)
 */
router.get('/incidents', async (req: Request, res: Response) => {
  try {
    const ids = IDSManager.getInstance();
    const { type, severity, resolved } = req.query;

    const alerts = ids.getAlerts({
      type: type as any,
      severity: severity as any,
      resolved: resolved ? resolved === 'true' : undefined,
      limit: 100
    });

    res.json({
      incidents: alerts,
      stats: {
        total: alerts.length,
        resolved: alerts.filter(a => a.resolved).length,
        unresolved: alerts.filter(a => !a.resolved).length,
        byType: alerts.reduce((acc, alert) => {
          acc[alert.type] = (acc[alert.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error('Incidents error:', error);
    res.status(500).json({ error: 'Failed to load incidents' });
  }
});

/**
 * POST /api/security/incident/:id/resolve
 * Mark incident as resolved
 */
router.post('/incident/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    if (!['true-positive', 'false-positive'].includes(resolution)) {
      return res.status(400).json({
        error: 'Invalid resolution. Must be "true-positive" or "false-positive"'
      });
    }

    const ids = IDSManager.getInstance();
    const resolved = ids.resolveAlert(id, resolution);

    if (!resolved) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    res.json({
      success: true,
      message: 'Incident resolved successfully',
      resolution
    });
  } catch (error) {
    console.error('Resolve incident error:', error);
    res.status(500).json({ error: 'Failed to resolve incident' });
  }
});

/**
 * GET /api/security/reports/weekly
 * Get weekly security summary
 */
router.get('/reports/weekly', async (req: Request, res: Response) => {
  try {
    const events = SecurityEventManager.getInstance();
    const ids = IDSManager.getInstance();
    const waf = WAFManager.getInstance();
    const ddos = DDoSManager.getInstance();

    const oneWeekAgo = new Date(Date.now() - 604800000);

    const weeklyEvents = events.getEvents({
      startTime: oneWeekAgo
    });

    const weeklyAlerts = ids.getAlerts({ limit: 1000 }).filter(
      a => a.timestamp >= oneWeekAgo
    );

    const report = {
      period: {
        start: oneWeekAgo.toISOString(),
        end: new Date().toISOString()
      },
      summary: {
        totalEvents: weeklyEvents.length,
        totalAlerts: weeklyAlerts.length,
        criticalAlerts: weeklyAlerts.filter(a => a.severity === 'critical').length,
        blockedAttacks: waf.getStats().blockedRequests,
        bannedIPs: ddos.getStats().bannedIPs
      },
      eventsByDay: this.groupByDay(weeklyEvents),
      topThreats: weeklyEvents
        .filter(e => e.severity === 'critical' || e.severity === 'high')
        .slice(0, 10),
      recommendations: this.generateRecommendations(weeklyEvents, weeklyAlerts)
    };

    res.json(report);
  } catch (error) {
    console.error('Weekly report error:', error);
    res.status(500).json({ error: 'Failed to generate weekly report' });
  }
});

/**
 * GET /api/security/ip/:ip
 * Get security information for specific IP
 */
router.get('/ip/:ip', async (req: Request, res: Response) => {
  try {
    const { ip } = req.params;

    const ddos = DDoSManager.getInstance();
    const events = SecurityEventManager.getInstance();
    const threatIntel = ThreatIntelManager.getInstance();

    const trafficPattern = ddos.getTrafficPattern(ip);
    const ipEvents = events.getEventsByIP(ip);
    const reputation = await threatIntel.checkIPReputation(ip);

    res.json({
      ip,
      reputation,
      trafficPattern,
      events: ipEvents.slice(0, 50),
      isBanned: ddos.getBannedIPs().includes(ip)
    });
  } catch (error) {
    console.error('IP lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup IP' });
  }
});

/**
 * POST /api/security/ip/:ip/ban
 * Manually ban an IP address
 */
router.post('/ip/:ip/ban', async (req: Request, res: Response) => {
  try {
    const { ip } = req.params;
    const { reason, duration } = req.body;

    const ddos = DDoSManager.getInstance();
    await ddos.banIPManually(ip, reason || 'Manual ban', duration);

    res.json({
      success: true,
      message: `IP ${ip} has been banned`,
      duration: duration || '15 minutes'
    });
  } catch (error) {
    console.error('Ban IP error:', error);
    res.status(500).json({ error: 'Failed to ban IP' });
  }
});

/**
 * DELETE /api/security/ip/:ip/ban
 * Unban an IP address
 */
router.delete('/ip/:ip/ban', async (req: Request, res: Response) => {
  try {
    const { ip } = req.params;

    const ddos = DDoSManager.getInstance();
    const unbanned = await ddos.unbanIP(ip);

    if (!unbanned) {
      return res.status(404).json({ error: 'IP not found in ban list' });
    }

    res.json({
      success: true,
      message: `IP ${ip} has been unbanned`
    });
  } catch (error) {
    console.error('Unban IP error:', error);
    res.status(500).json({ error: 'Failed to unban IP' });
  }
});

/**
 * Helper: Group events by day
 */
function groupByDay(events: any[]): Record<string, number> {
  const grouped: Record<string, number> = {};

  events.forEach(event => {
    const day = event.timestamp.toISOString().split('T')[0];
    grouped[day] = (grouped[day] || 0) + 1;
  });

  return grouped;
}

/**
 * Helper: Generate security recommendations
 */
function generateRecommendations(events: any[], alerts: any[]): string[] {
  const recommendations: string[] = [];

  const criticalEvents = events.filter(e => e.severity === 'critical').length;
  if (criticalEvents > 10) {
    recommendations.push(`${criticalEvents} critical security events detected. Review WAF and IDS configurations.`);
  }

  const unresolvedAlerts = alerts.filter(a => !a.resolved).length;
  if (unresolvedAlerts > 5) {
    recommendations.push(`${unresolvedAlerts} unresolved security alerts. Prioritize incident response.`);
  }

  const bruteForceAlerts = alerts.filter(a => a.type === 'brute-force').length;
  if (bruteForceAlerts > 3) {
    recommendations.push('Multiple brute force attempts detected. Consider enforcing MFA for all users.');
  }

  const dataExfiltration = alerts.filter(a => a.type === 'data-exfiltration').length;
  if (dataExfiltration > 0) {
    recommendations.push('Data exfiltration detected. Review user permissions and access controls.');
  }

  if (recommendations.length === 0) {
    recommendations.push('No critical security issues detected. Maintain current security posture.');
  }

  return recommendations;
}

export default router;
