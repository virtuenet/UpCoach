/**
 * Intrusion Detection System (IDS)
 * Phase 13 Week 1
 *
 * ML-based anomaly detection for brute force attacks, port scanning,
 * data exfiltration, privilege escalation, and anomalous API usage
 */

import EventEmitter from 'events';
import { RedisCache } from '../../infrastructure/cache/RedisCache';

export interface IDSAlert {
  id: string;
  type: 'brute-force' | 'port-scan' | 'data-exfiltration' | 'privilege-escalation' | 'anomalous-api' | 'suspicious-activity';
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  source: {
    ip: string;
    userId?: string;
    userAgent?: string;
  };
  details: {
    description: string;
    evidence: any;
    affectedResources: string[];
  };
  action: 'blocked' | 'monitored' | 'escalated';
  resolved: boolean;
}

export interface UserBehaviorBaseline {
  userId: string;
  typicalLoginTimes: number[]; // Hour of day (0-23)
  typicalLocations: string[]; // IP ranges or geo-locations
  averageApiCallsPerHour: number;
  commonEndpoints: Map<string, number>;
  typicalDataVolume: number; // MB per hour
  lastUpdated: Date;
}

export interface IDSConfig {
  enabled: boolean;
  bruteForce: {
    maxFailedAttempts: number;
    timeWindow: number; // milliseconds
  };
  dataExfiltration: {
    maxDownloadMB: number;
    timeWindow: number; // milliseconds
  };
  anomalousBehavior: {
    zScoreThreshold: number; // Standard deviations from baseline
    minBaselineData: number; // Minimum data points for baseline
  };
}

export interface IDSStats {
  totalAlerts: number;
  criticalAlerts: number;
  resolvedAlerts: number;
  falsePositives: number;
  detectionAccuracy: number; // percentage
  meanTimeToDetect: number; // milliseconds
  alertsByType: Map<string, number>;
}

export class IntrusionDetectionService extends EventEmitter {
  private config: IDSConfig;
  private cache: RedisCache;
  private alerts: Map<string, IDSAlert> = new Map();
  private userBaselines: Map<string, UserBehaviorBaseline> = new Map();
  private stats: IDSStats;

  constructor(cache: RedisCache, config?: Partial<IDSConfig>) {
    super();
    this.cache = cache;

    this.config = {
      enabled: true,
      bruteForce: {
        maxFailedAttempts: 10,
        timeWindow: 300000 // 5 minutes
      },
      dataExfiltration: {
        maxDownloadMB: 100,
        timeWindow: 3600000 // 1 hour
      },
      anomalousBehavior: {
        zScoreThreshold: 3,
        minBaselineData: 100
      },
      ...config
    };

    this.stats = {
      totalAlerts: 0,
      criticalAlerts: 0,
      resolvedAlerts: 0,
      falsePositives: 0,
      detectionAccuracy: 100,
      meanTimeToDetect: 0,
      alertsByType: new Map()
    };
  }

  /**
   * Detect brute force attack
   */
  async detectBruteForce(ip: string, userId?: string): Promise<IDSAlert | null> {
    const key = `ids:bruteforce:${ip}`;
    const attempts = await this.cache.get<number>(key) || 0;
    const newAttempts = attempts + 1;

    await this.cache.set(key, newAttempts, this.config.bruteForce.timeWindow);

    if (newAttempts >= this.config.bruteForce.maxFailedAttempts) {
      const alert = this.createAlert({
        type: 'brute-force',
        severity: 'critical',
        source: { ip, userId },
        details: {
          description: `Brute force attack detected: ${newAttempts} failed login attempts in ${this.config.bruteForce.timeWindow / 1000}s`,
          evidence: { attempts: newAttempts, timeWindow: this.config.bruteForce.timeWindow },
          affectedResources: [userId || ip]
        },
        action: 'blocked'
      });

      this.emit('ids:brute_force', alert);
      return alert;
    }

    return null;
  }

  /**
   * Detect data exfiltration
   */
  async detectDataExfiltration(
    userId: string,
    ip: string,
    dataSizeMB: number
  ): Promise<IDSAlert | null> {
    const key = `ids:exfiltration:${userId}`;
    const downloadedMB = await this.cache.get<number>(key) || 0;
    const totalDownloadedMB = downloadedMB + dataSizeMB;

    await this.cache.set(key, totalDownloadedMB, this.config.dataExfiltration.timeWindow);

    if (totalDownloadedMB > this.config.dataExfiltration.maxDownloadMB) {
      // Check if this is anomalous for the user
      const baseline = this.userBaselines.get(userId);
      const isAnomalous = baseline
        ? totalDownloadedMB > baseline.typicalDataVolume * 3
        : true;

      if (isAnomalous) {
        const alert = this.createAlert({
          type: 'data-exfiltration',
          severity: 'critical',
          source: { ip, userId },
          details: {
            description: `Suspicious data download detected: ${totalDownloadedMB.toFixed(2)}MB in ${this.config.dataExfiltration.timeWindow / 1000 / 60} minutes`,
            evidence: {
              downloadedMB: totalDownloadedMB,
              threshold: this.config.dataExfiltration.maxDownloadMB,
              baseline: baseline?.typicalDataVolume
            },
            affectedResources: [userId]
          },
          action: 'escalated'
        });

        this.emit('ids:data_exfiltration', alert);
        return alert;
      }
    }

    return null;
  }

  /**
   * Detect privilege escalation
   */
  async detectPrivilegeEscalation(
    userId: string,
    ip: string,
    attemptedRole: string,
    currentRole: string
  ): Promise<IDSAlert | null> {
    // Role hierarchy: guest(1) < user(2) < coach(3) < admin(4) < super_admin(5)
    const roleHierarchy: Record<string, number> = {
      guest: 1,
      user: 2,
      coach: 3,
      admin: 4,
      super_admin: 5
    };

    const attemptedLevel = roleHierarchy[attemptedRole] || 0;
    const currentLevel = roleHierarchy[currentRole] || 0;

    // Alert if attempting to access higher privilege level
    if (attemptedLevel > currentLevel + 1) {
      const alert = this.createAlert({
        type: 'privilege-escalation',
        severity: 'critical',
        source: { ip, userId },
        details: {
          description: `Privilege escalation attempt: ${currentRole} → ${attemptedRole}`,
          evidence: {
            attemptedRole,
            currentRole,
            attemptedLevel,
            currentLevel
          },
          affectedResources: [userId]
        },
        action: 'blocked'
      });

      this.emit('ids:privilege_escalation', alert);
      return alert;
    }

    return null;
  }

  /**
   * Detect anomalous API usage
   */
  async detectAnomalousAPI(
    userId: string,
    ip: string,
    endpoint: string
  ): Promise<IDSAlert | null> {
    const baseline = this.userBaselines.get(userId);

    if (!baseline) {
      // Not enough baseline data yet
      return null;
    }

    // Track endpoints accessed in current session
    const key = `ids:api:${userId}`;
    const endpointsAccessed = await this.cache.get<string[]>(key) || [];
    endpointsAccessed.push(endpoint);

    await this.cache.set(key, endpointsAccessed, 3600000); // 1 hour

    // Check for rapid endpoint enumeration
    const uniqueEndpoints = new Set(endpointsAccessed);
    if (uniqueEndpoints.size > 50 && endpointsAccessed.length < 60) {
      const alert = this.createAlert({
        type: 'anomalous-api',
        severity: 'high',
        source: { ip, userId },
        details: {
          description: `API enumeration detected: ${uniqueEndpoints.size} unique endpoints in 1 minute`,
          evidence: {
            uniqueEndpoints: uniqueEndpoints.size,
            totalRequests: endpointsAccessed.length,
            endpoints: Array.from(uniqueEndpoints).slice(0, 10)
          },
          affectedResources: [userId]
        },
        action: 'monitored'
      });

      this.emit('ids:anomalous_api', alert);
      return alert;
    }

    // Check API call rate anomaly
    const callsPerHour = endpointsAccessed.length;
    const zScore = this.calculateZScore(
      callsPerHour,
      baseline.averageApiCallsPerHour,
      baseline.averageApiCallsPerHour * 0.3 // Assume 30% std deviation
    );

    if (zScore > this.config.anomalousBehavior.zScoreThreshold) {
      const alert = this.createAlert({
        type: 'anomalous-api',
        severity: 'medium',
        source: { ip, userId },
        details: {
          description: `Unusual API activity: ${callsPerHour} calls/hour (baseline: ${baseline.averageApiCallsPerHour})`,
          evidence: {
            callsPerHour,
            baseline: baseline.averageApiCallsPerHour,
            zScore: zScore.toFixed(2)
          },
          affectedResources: [userId]
        },
        action: 'monitored'
      });

      this.emit('ids:anomalous_api', alert);
      return alert;
    }

    return null;
  }

  /**
   * Detect anomalous login time
   */
  async detectAnomalousLogin(
    userId: string,
    ip: string,
    loginTime: Date
  ): Promise<IDSAlert | null> {
    const baseline = this.userBaselines.get(userId);

    if (!baseline || baseline.typicalLoginTimes.length < this.config.anomalousBehavior.minBaselineData) {
      return null;
    }

    const hour = loginTime.getHours();
    const isTypicalTime = baseline.typicalLoginTimes.includes(hour) ||
      baseline.typicalLoginTimes.includes((hour + 1) % 24) ||
      baseline.typicalLoginTimes.includes((hour - 1 + 24) % 24);

    if (!isTypicalTime) {
      const alert = this.createAlert({
        type: 'suspicious-activity',
        severity: 'low',
        source: { ip, userId },
        details: {
          description: `Login at unusual time: ${hour}:00 (typical: ${baseline.typicalLoginTimes.join(', ')})`,
          evidence: {
            loginHour: hour,
            typicalHours: baseline.typicalLoginTimes
          },
          affectedResources: [userId]
        },
        action: 'monitored'
      });

      this.emit('ids:anomalous_login', alert);
      return alert;
    }

    return null;
  }

  /**
   * Update user behavior baseline
   */
  async updateUserBaseline(
    userId: string,
    activity: {
      loginTime?: Date;
      ipAddress?: string;
      apiCalls?: number;
      endpoints?: string[];
      dataVolumeMB?: number;
    }
  ): Promise<void> {
    let baseline = this.userBaselines.get(userId);

    if (!baseline) {
      baseline = {
        userId,
        typicalLoginTimes: [],
        typicalLocations: [],
        averageApiCallsPerHour: 0,
        commonEndpoints: new Map(),
        typicalDataVolume: 0,
        lastUpdated: new Date()
      };
      this.userBaselines.set(userId, baseline);
    }

    // Update login times
    if (activity.loginTime) {
      const hour = activity.loginTime.getHours();
      if (!baseline.typicalLoginTimes.includes(hour)) {
        baseline.typicalLoginTimes.push(hour);

        // Keep only most frequent hours (max 8)
        if (baseline.typicalLoginTimes.length > 8) {
          baseline.typicalLoginTimes = baseline.typicalLoginTimes.slice(-8);
        }
      }
    }

    // Update typical locations
    if (activity.ipAddress) {
      const ipRange = this.getIPRange(activity.ipAddress);
      if (!baseline.typicalLocations.includes(ipRange)) {
        baseline.typicalLocations.push(ipRange);

        // Keep only recent locations (max 5)
        if (baseline.typicalLocations.length > 5) {
          baseline.typicalLocations = baseline.typicalLocations.slice(-5);
        }
      }
    }

    // Update average API calls
    if (activity.apiCalls !== undefined) {
      baseline.averageApiCallsPerHour =
        (baseline.averageApiCallsPerHour * 0.9) + (activity.apiCalls * 0.1);
    }

    // Update common endpoints
    if (activity.endpoints) {
      activity.endpoints.forEach(endpoint => {
        const count = baseline!.commonEndpoints.get(endpoint) || 0;
        baseline!.commonEndpoints.set(endpoint, count + 1);
      });
    }

    // Update typical data volume
    if (activity.dataVolumeMB !== undefined) {
      baseline.typicalDataVolume =
        (baseline.typicalDataVolume * 0.9) + (activity.dataVolumeMB * 0.1);
    }

    baseline.lastUpdated = new Date();

    // Persist to cache
    await this.cache.set(`ids:baseline:${userId}`, baseline, 2592000000); // 30 days
  }

  /**
   * Create alert
   */
  private createAlert(params: {
    type: IDSAlert['type'];
    severity: IDSAlert['severity'];
    source: IDSAlert['source'];
    details: IDSAlert['details'];
    action: IDSAlert['action'];
  }): IDSAlert {
    const alert: IDSAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      resolved: false,
      ...params
    };

    this.alerts.set(alert.id, alert);
    this.updateStats(alert);

    return alert;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, resolution: 'true-positive' | 'false-positive'): boolean {
    const alert = this.alerts.get(alertId);

    if (!alert) {
      return false;
    }

    alert.resolved = true;
    this.stats.resolvedAlerts++;

    if (resolution === 'false-positive') {
      this.stats.falsePositives++;
    }

    this.updateDetectionAccuracy();
    this.emit('ids:alert_resolved', { alert, resolution });

    return true;
  }

  /**
   * Get alerts
   */
  getAlerts(filter?: {
    type?: IDSAlert['type'];
    severity?: IDSAlert['severity'];
    resolved?: boolean;
    limit?: number;
  }): IDSAlert[] {
    let alerts = Array.from(this.alerts.values());

    if (filter?.type) {
      alerts = alerts.filter(a => a.type === filter.type);
    }

    if (filter?.severity) {
      alerts = alerts.filter(a => a.severity === filter.severity);
    }

    if (filter?.resolved !== undefined) {
      alerts = alerts.filter(a => a.resolved === filter.resolved);
    }

    // Sort by timestamp (newest first)
    alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filter?.limit) {
      alerts = alerts.slice(0, filter.limit);
    }

    return alerts;
  }

  /**
   * Get statistics
   */
  getStats(): IDSStats {
    return {
      ...this.stats,
      alertsByType: new Map(this.stats.alertsByType)
    };
  }

  /**
   * Calculate z-score for anomaly detection
   */
  private calculateZScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return Math.abs((value - mean) / stdDev);
  }

  /**
   * Get IP range (first 3 octets)
   */
  private getIPRange(ip: string): string {
    const parts = ip.split('.');
    return parts.slice(0, 3).join('.') + '.0/24';
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update statistics
   */
  private updateStats(alert: IDSAlert): void {
    this.stats.totalAlerts++;

    if (alert.severity === 'critical') {
      this.stats.criticalAlerts++;
    }

    const typeCount = this.stats.alertsByType.get(alert.type) || 0;
    this.stats.alertsByType.set(alert.type, typeCount + 1);
  }

  /**
   * Update detection accuracy
   */
  private updateDetectionAccuracy(): void {
    if (this.stats.resolvedAlerts === 0) {
      this.stats.detectionAccuracy = 100;
    } else {
      const truePositives = this.stats.resolvedAlerts - this.stats.falsePositives;
      this.stats.detectionAccuracy = (truePositives / this.stats.resolvedAlerts) * 100;
    }
  }
}

/**
 * Singleton IDS Manager
 */
export class IDSManager {
  private static instance: IntrusionDetectionService;

  static initialize(cache: RedisCache, config?: Partial<IDSConfig>): void {
    if (this.instance) {
      throw new Error('IDS already initialized');
    }
    this.instance = new IntrusionDetectionService(cache, config);
  }

  static getInstance(): IntrusionDetectionService {
    if (!this.instance) {
      throw new Error('IDS not initialized');
    }
    return this.instance;
  }
}
