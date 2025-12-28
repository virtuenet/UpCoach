/**
 * DDoS Protection Service
 * Phase 13 Week 1
 *
 * Advanced DDoS protection with rate analysis, traffic pattern anomaly detection,
 * automatic IP blacklisting, and challenge-response for suspicious traffic
 */

import { Request, Response, NextFunction } from 'express';
import EventEmitter from 'events';
import { RedisCache } from '../../infrastructure/cache/RedisCache';

export interface DDoSConfig {
  enabled: boolean;
  volumeThreshold: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  banDuration: number; // milliseconds
  whitelistedIPs: string[];
  challengeThreshold: number; // requests per minute
}

export interface TrafficPattern {
  ip: string;
  requestCount: number;
  firstSeen: Date;
  lastSeen: Date;
  uniqueEndpoints: Set<string>;
  userAgents: Set<string>;
  methods: Map<string, number>;
  anomalyScore: number; // 0-100
}

export interface DDoSEvent {
  type: 'volume-attack' | 'protocol-attack' | 'application-attack' | 'behavioral-anomaly';
  ip: string;
  timestamp: Date;
  details: {
    requestCount: number;
    duration: number; // seconds
    endpoints: string[];
    pattern: string;
  };
  action: 'banned' | 'challenged' | 'monitored';
}

export interface DDoSStats {
  totalRequests: number;
  blockedRequests: number;
  challengedRequests: number;
  bannedIPs: number;
  activeAttacks: number;
  mitigationEffectiveness: number; // percentage
}

export class DDoSProtection extends EventEmitter {
  private config: DDoSConfig;
  private cache: RedisCache;
  private trafficPatterns: Map<string, TrafficPattern> = new Map();
  private bannedIPs: Set<string> = new Set();
  private stats: DDoSStats;
  private baselineTraffic: number = 0;

  constructor(cache: RedisCache, config?: Partial<DDoSConfig>) {
    super();
    this.cache = cache;

    this.config = {
      enabled: true,
      volumeThreshold: {
        requestsPerMinute: 1000,
        requestsPerHour: 10000
      },
      banDuration: 900000, // 15 minutes
      whitelistedIPs: [],
      challengeThreshold: 500,
      ...config
    };

    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      challengedRequests: 0,
      bannedIPs: 0,
      activeAttacks: 0,
      mitigationEffectiveness: 0
    };

    this.startPatternAnalysis();
    this.startBaselineCalculation();
  }

  /**
   * DDoS protection middleware
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) {
        return next();
      }

      this.stats.totalRequests++;
      const ip = req.ip;

      try {
        // Check if IP is whitelisted
        if (this.config.whitelistedIPs.includes(ip)) {
          return next();
        }

        // Check if IP is banned
        if (await this.isBanned(ip)) {
          this.stats.blockedRequests++;
          res.status(429).json({
            error: 'Too Many Requests',
            message: 'Your IP has been temporarily banned due to suspicious activity',
            retryAfter: Math.ceil(this.config.banDuration / 1000)
          });
          this.emit('ddos:blocked', { ip, timestamp: new Date() });
          return;
        }

        // Track traffic pattern
        await this.trackRequest(ip, req);

        // Analyze traffic
        const pattern = this.trafficPatterns.get(ip);
        if (pattern) {
          const threat = await this.analyzeThreat(pattern);

          if (threat.shouldBan) {
            await this.banIP(ip, threat.event);
            this.stats.blockedRequests++;
            res.status(429).json({
              error: 'Too Many Requests',
              message: 'Rate limit exceeded',
              retryAfter: Math.ceil(this.config.banDuration / 1000)
            });
            return;
          }

          if (threat.shouldChallenge) {
            // TODO: Implement CAPTCHA challenge
            this.stats.challengedRequests++;
            this.emit('ddos:challenge', { ip, pattern });
          }
        }

        next();
      } catch (error) {
        console.error('DDoS protection error:', error);
        next(); // Fail open
      }
    };
  }

  /**
   * Track request in traffic pattern
   */
  private async trackRequest(ip: string, req: Request): Promise<void> {
    let pattern = this.trafficPatterns.get(ip);

    if (!pattern) {
      pattern = {
        ip,
        requestCount: 0,
        firstSeen: new Date(),
        lastSeen: new Date(),
        uniqueEndpoints: new Set(),
        userAgents: new Set(),
        methods: new Map(),
        anomalyScore: 0
      };
      this.trafficPatterns.set(ip, pattern);
    }

    pattern.requestCount++;
    pattern.lastSeen = new Date();
    pattern.uniqueEndpoints.add(req.path);

    const userAgent = req.get('user-agent') || 'unknown';
    pattern.userAgents.add(userAgent);

    const methodCount = pattern.methods.get(req.method) || 0;
    pattern.methods.set(req.method, methodCount + 1);

    // Update anomaly score
    pattern.anomalyScore = this.calculateAnomalyScore(pattern);

    // Store in Redis for distributed tracking
    await this.cache.set(`ddos:traffic:${ip}`, pattern, 3600); // 1 hour TTL
  }

  /**
   * Calculate anomaly score for traffic pattern
   */
  private calculateAnomalyScore(pattern: TrafficPattern): number {
    let score = 0;

    // Volume anomaly
    const duration = (pattern.lastSeen.getTime() - pattern.firstSeen.getTime()) / 1000; // seconds
    const requestsPerSecond = pattern.requestCount / duration;

    if (requestsPerSecond > 10) score += 30;
    else if (requestsPerSecond > 5) score += 15;

    // Endpoint diversity anomaly (too many different endpoints)
    if (pattern.uniqueEndpoints.size > 50) score += 25;
    else if (pattern.uniqueEndpoints.size > 20) score += 10;

    // User-Agent anomaly (missing or suspicious)
    if (pattern.userAgents.size === 0) score += 20;
    else if (pattern.userAgents.has('unknown')) score += 10;

    // Method distribution anomaly (too many POSTs)
    const postCount = pattern.methods.get('POST') || 0;
    const getCount = pattern.methods.get('GET') || 0;
    if (postCount > getCount * 2) score += 15;

    // Traffic spike anomaly (compared to baseline)
    const requestsPerMinute = (pattern.requestCount / duration) * 60;
    const spikeRatio = requestsPerMinute / Math.max(this.baselineTraffic, 1);

    if (spikeRatio > 10) score += 30;
    else if (spikeRatio > 5) score += 20;
    else if (spikeRatio > 3) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Analyze threat level
   */
  private async analyzeThreat(pattern: TrafficPattern): Promise<{
    shouldBan: boolean;
    shouldChallenge: boolean;
    event?: DDoSEvent;
  }> {
    const duration = (pattern.lastSeen.getTime() - pattern.firstSeen.getTime()) / 1000;
    const requestsPerMinute = (pattern.requestCount / duration) * 60;
    const requestsPerHour = (pattern.requestCount / duration) * 3600;

    // Volume-based detection
    if (requestsPerMinute > this.config.volumeThreshold.requestsPerMinute) {
      const event: DDoSEvent = {
        type: 'volume-attack',
        ip: pattern.ip,
        timestamp: new Date(),
        details: {
          requestCount: pattern.requestCount,
          duration,
          endpoints: Array.from(pattern.uniqueEndpoints).slice(0, 10),
          pattern: `${Math.round(requestsPerMinute)} req/min`
        },
        action: 'banned'
      };

      return { shouldBan: true, shouldChallenge: false, event };
    }

    if (requestsPerHour > this.config.volumeThreshold.requestsPerHour) {
      const event: DDoSEvent = {
        type: 'volume-attack',
        ip: pattern.ip,
        timestamp: new Date(),
        details: {
          requestCount: pattern.requestCount,
          duration,
          endpoints: Array.from(pattern.uniqueEndpoints).slice(0, 10),
          pattern: `${Math.round(requestsPerHour)} req/hour`
        },
        action: 'banned'
      };

      return { shouldBan: true, shouldChallenge: false, event };
    }

    // Behavioral anomaly detection
    if (pattern.anomalyScore > 80) {
      const event: DDoSEvent = {
        type: 'behavioral-anomaly',
        ip: pattern.ip,
        timestamp: new Date(),
        details: {
          requestCount: pattern.requestCount,
          duration,
          endpoints: Array.from(pattern.uniqueEndpoints).slice(0, 10),
          pattern: `Anomaly score: ${pattern.anomalyScore}`
        },
        action: 'banned'
      };

      return { shouldBan: true, shouldChallenge: false, event };
    }

    // Challenge threshold
    if (requestsPerMinute > this.config.challengeThreshold && pattern.anomalyScore > 40) {
      return { shouldBan: false, shouldChallenge: true };
    }

    return { shouldBan: false, shouldChallenge: false };
  }

  /**
   * Ban IP address
   */
  private async banIP(ip: string, event?: DDoSEvent): Promise<void> {
    this.bannedIPs.add(ip);
    this.stats.bannedIPs = this.bannedIPs.size;

    // Store ban in Redis for distributed enforcement
    await this.cache.set(
      `ddos:ban:${ip}`,
      { timestamp: new Date(), event },
      this.config.banDuration
    );

    // Schedule unban
    setTimeout(() => {
      this.bannedIPs.delete(ip);
      this.stats.bannedIPs = this.bannedIPs.size;
      this.emit('ddos:unbanned', { ip, timestamp: new Date() });
    }, this.config.banDuration);

    if (event) {
      this.stats.activeAttacks++;
      this.emit('ddos:attack_detected', event);
    }

    this.emit('ddos:banned', { ip, timestamp: new Date(), event });
  }

  /**
   * Check if IP is banned
   */
  private async isBanned(ip: string): Promise<boolean> {
    if (this.bannedIPs.has(ip)) {
      return true;
    }

    // Check Redis for distributed bans
    const banRecord = await this.cache.get(`ddos:ban:${ip}`);
    if (banRecord) {
      this.bannedIPs.add(ip);
      return true;
    }

    return false;
  }

  /**
   * Manually ban IP
   */
  async banIPManually(ip: string, reason: string, duration?: number): Promise<void> {
    const event: DDoSEvent = {
      type: 'application-attack',
      ip,
      timestamp: new Date(),
      details: {
        requestCount: 0,
        duration: 0,
        endpoints: [],
        pattern: reason
      },
      action: 'banned'
    };

    const banDuration = duration || this.config.banDuration;
    await this.banIP(ip, event);

    // Override timeout if custom duration
    if (duration) {
      setTimeout(() => {
        this.bannedIPs.delete(ip);
        this.stats.bannedIPs = this.bannedIPs.size;
      }, duration);
    }
  }

  /**
   * Unban IP
   */
  async unbanIP(ip: string): Promise<boolean> {
    const wasBanned = this.bannedIPs.delete(ip);
    await this.cache.delete(`ddos:ban:${ip}`);

    if (wasBanned) {
      this.stats.bannedIPs = this.bannedIPs.size;
      this.emit('ddos:unbanned', { ip, timestamp: new Date() });
    }

    return wasBanned;
  }

  /**
   * Get traffic pattern for IP
   */
  getTrafficPattern(ip: string): TrafficPattern | undefined {
    return this.trafficPatterns.get(ip);
  }

  /**
   * Get all banned IPs
   */
  getBannedIPs(): string[] {
    return Array.from(this.bannedIPs);
  }

  /**
   * Get statistics
   */
  getStats(): DDoSStats {
    this.updateMitigationEffectiveness();
    return { ...this.stats };
  }

  /**
   * Update mitigation effectiveness
   */
  private updateMitigationEffectiveness(): void {
    if (this.stats.totalRequests === 0) {
      this.stats.mitigationEffectiveness = 100;
    } else {
      const legitimateRequests = this.stats.totalRequests - this.stats.blockedRequests;
      this.stats.mitigationEffectiveness = (legitimateRequests / this.stats.totalRequests) * 100;
    }
  }

  /**
   * Clear traffic patterns (cleanup)
   */
  clearOldPatterns(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const [ip, pattern] of this.trafficPatterns) {
      if (now - pattern.lastSeen.getTime() > maxAge) {
        this.trafficPatterns.delete(ip);
      }
    }
  }

  /**
   * Start periodic pattern analysis
   */
  private startPatternAnalysis(): void {
    setInterval(() => {
      this.clearOldPatterns();
    }, 300000); // Every 5 minutes
  }

  /**
   * Start baseline traffic calculation
   */
  private startBaselineCalculation(): void {
    setInterval(() => {
      // Calculate average requests per minute from all patterns
      let totalRpm = 0;
      let patternCount = 0;

      for (const pattern of this.trafficPatterns.values()) {
        const duration = (pattern.lastSeen.getTime() - pattern.firstSeen.getTime()) / 1000;
        const rpm = (pattern.requestCount / duration) * 60;

        if (pattern.anomalyScore < 30) { // Only count normal traffic
          totalRpm += rpm;
          patternCount++;
        }
      }

      if (patternCount > 0) {
        this.baselineTraffic = totalRpm / patternCount;
      }
    }, 600000); // Every 10 minutes
  }
}

/**
 * Singleton DDoS Protection Manager
 */
export class DDoSManager {
  private static instance: DDoSProtection;

  static initialize(cache: RedisCache, config?: Partial<DDoSConfig>): void {
    if (this.instance) {
      throw new Error('DDoS protection already initialized');
    }
    this.instance = new DDoSProtection(cache, config);
  }

  static getInstance(): DDoSProtection {
    if (!this.instance) {
      throw new Error('DDoS protection not initialized');
    }
    return this.instance;
  }
}
