/**
 * Threat Intelligence Service
 * Phase 13 Week 1
 *
 * Integration with AbuseIPDB, VirusTotal, Have I Been Pwned for
 * IP reputation, malicious URL detection, and leaked password checks
 */

import EventEmitter from 'events';
import crypto from 'crypto';
import { RedisCache } from '../../infrastructure/cache/RedisCache';

export interface IPReputation {
  ip: string;
  score: number; // 0-100, higher is more malicious
  isWhitelisted: boolean;
  isBlacklisted: boolean;
  abuseConfidenceScore: number;
  country?: string;
  isp?: string;
  domain?: string;
  usageType?: string;
  totalReports: number;
  lastReported?: Date;
}

export interface PasswordBreachCheck {
  isBreached: boolean;
  breachCount: number;
  checked: Date;
}

export interface ThreatFeed {
  source: string;
  maliciousIPs: Set<string>;
  maliciousURLs: Set<string>;
  maliciousHashes: Set<string>;
  lastUpdated: Date;
}

export interface ThreatIntelConfig {
  enabled: boolean;
  apiKeys: {
    abuseIPDB?: string;
    virusTotal?: string;
    haveIBeenPwned?: string;
  };
  cacheTTL: number; // milliseconds
  updateInterval: number; // milliseconds for feed updates
}

export class ThreatIntelligenceService extends EventEmitter {
  private config: ThreatIntelConfig;
  private cache: RedisCache;
  private customThreatFeed: ThreatFeed;

  constructor(cache: RedisCache, config?: Partial<ThreatIntelConfig>) {
    super();
    this.cache = cache;

    this.config = {
      enabled: true,
      apiKeys: {},
      cacheTTL: 86400000, // 24 hours
      updateInterval: 86400000, // 24 hours
      ...config
    };

    this.customThreatFeed = {
      source: 'custom',
      maliciousIPs: new Set(),
      maliciousURLs: new Set(),
      maliciousHashes: new Set(),
      lastUpdated: new Date()
    };

    this.startThreatFeedUpdates();
  }

  /**
   * Check IP reputation
   */
  async checkIPReputation(ip: string): Promise<IPReputation> {
    // Check cache first
    const cached = await this.cache.get<IPReputation>(`threat:ip:${ip}`);
    if (cached) {
      return cached;
    }

    let reputation: IPReputation = {
      ip,
      score: 0,
      isWhitelisted: false,
      isBlacklisted: false,
      abuseConfidenceScore: 0,
      totalReports: 0
    };

    // Check custom threat feed
    if (this.customThreatFeed.maliciousIPs.has(ip)) {
      reputation.score = 100;
      reputation.isBlacklisted = true;
    }

    // Check AbuseIPDB if API key available
    if (this.config.apiKeys.abuseIPDB) {
      try {
        const abuseData = await this.checkAbuseIPDB(ip);
        reputation = { ...reputation, ...abuseData };
      } catch (error) {
        console.error('AbuseIPDB check failed:', error);
      }
    }

    // Cache result
    await this.cache.set(`threat:ip:${ip}`, reputation, this.config.cacheTTL);

    // Emit event if high risk
    if (reputation.score > 80) {
      this.emit('threat:high_risk_ip', reputation);
    }

    return reputation;
  }

  /**
   * Check AbuseIPDB
   */
  private async checkAbuseIPDB(ip: string): Promise<Partial<IPReputation>> {
    // Simulated AbuseIPDB response (replace with actual API call)
    // const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
    //   headers: { 'Key': this.config.apiKeys.abuseIPDB! }
    // });

    // For now, return mock data
    return {
      abuseConfidenceScore: 0,
      totalReports: 0,
      score: 0
    };
  }

  /**
   * Check if password is in breach database (Have I Been Pwned)
   */
  async checkPasswordBreach(password: string): Promise<PasswordBreachCheck> {
    // Use k-anonymity model (only send first 5 chars of SHA-1 hash)
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    // Check cache first
    const cached = await this.cache.get<PasswordBreachCheck>(`threat:pwd:${sha1}`);
    if (cached) {
      return cached;
    }

    try {
      // Simulated HIBP API call (replace with actual API call)
      // const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      // const text = await response.text();

      // For now, simulate response
      const isBreached = false;
      const breachCount = 0;

      const result: PasswordBreachCheck = {
        isBreached,
        breachCount,
        checked: new Date()
      };

      // Cache result
      await this.cache.set(`threat:pwd:${sha1}`, result, this.config.cacheTTL);

      if (isBreached) {
        this.emit('threat:breached_password', { hash: prefix, count: breachCount });
      }

      return result;
    } catch (error) {
      console.error('Password breach check failed:', error);
      return {
        isBreached: false,
        breachCount: 0,
        checked: new Date()
      };
    }
  }

  /**
   * Check URL reputation (VirusTotal)
   */
  async checkURLReputation(url: string): Promise<{
    isMalicious: boolean;
    score: number;
    vendors: { name: string; detected: boolean }[];
  }> {
    // Check custom threat feed
    if (this.customThreatFeed.maliciousURLs.has(url)) {
      return {
        isMalicious: true,
        score: 100,
        vendors: [{ name: 'custom', detected: true }]
      };
    }

    // Check cache
    const cached = await this.cache.get<any>(`threat:url:${url}`);
    if (cached) {
      return cached;
    }

    try {
      // Simulated VirusTotal API call (replace with actual API call)
      // const response = await fetch('https://www.virustotal.com/vtapi/v2/url/report', {
      //   method: 'POST',
      //   body: new URLSearchParams({
      //     apikey: this.config.apiKeys.virusTotal!,
      //     resource: url
      //   })
      // });

      const result = {
        isMalicious: false,
        score: 0,
        vendors: []
      };

      await this.cache.set(`threat:url:${url}`, result, this.config.cacheTTL);

      if (result.isMalicious) {
        this.emit('threat:malicious_url', { url, score: result.score });
      }

      return result;
    } catch (error) {
      console.error('URL reputation check failed:', error);
      return {
        isMalicious: false,
        score: 0,
        vendors: []
      };
    }
  }

  /**
   * Scan file hash (VirusTotal)
   */
  async checkFileHash(hash: string): Promise<{
    isMalicious: boolean;
    detections: number;
    totalScans: number;
  }> {
    // Check custom threat feed
    if (this.customThreatFeed.maliciousHashes.has(hash)) {
      return {
        isMalicious: true,
        detections: 1,
        totalScans: 1
      };
    }

    // Check cache
    const cached = await this.cache.get<any>(`threat:hash:${hash}`);
    if (cached) {
      return cached;
    }

    try {
      // Simulated VirusTotal API call
      const result = {
        isMalicious: false,
        detections: 0,
        totalScans: 70
      };

      await this.cache.set(`threat:hash:${hash}`, result, this.config.cacheTTL);

      if (result.isMalicious) {
        this.emit('threat:malicious_file', { hash, detections: result.detections });
      }

      return result;
    } catch (error) {
      console.error('File hash check failed:', error);
      return {
        isMalicious: false,
        detections: 0,
        totalScans: 0
      };
    }
  }

  /**
   * Add IP to custom threat feed
   */
  addMaliciousIP(ip: string, reason: string): void {
    this.customThreatFeed.maliciousIPs.add(ip);
    this.customThreatFeed.lastUpdated = new Date();

    this.emit('threat:ip_added', { ip, reason });

    // Invalidate cache
    this.cache.delete(`threat:ip:${ip}`);
  }

  /**
   * Remove IP from custom threat feed
   */
  removeMaliciousIP(ip: string): boolean {
    const removed = this.customThreatFeed.maliciousIPs.delete(ip);

    if (removed) {
      this.customThreatFeed.lastUpdated = new Date();
      this.emit('threat:ip_removed', { ip });
      this.cache.delete(`threat:ip:${ip}`);
    }

    return removed;
  }

  /**
   * Add URL to custom threat feed
   */
  addMaliciousURL(url: string, reason: string): void {
    this.customThreatFeed.maliciousURLs.add(url);
    this.customThreatFeed.lastUpdated = new Date();

    this.emit('threat:url_added', { url, reason });
    this.cache.delete(`threat:url:${url}`);
  }

  /**
   * Add file hash to custom threat feed
   */
  addMaliciousHash(hash: string, reason: string): void {
    this.customThreatFeed.maliciousHashes.add(hash);
    this.customThreatFeed.lastUpdated = new Date();

    this.emit('threat:hash_added', { hash, reason });
    this.cache.delete(`threat:hash:${hash}`);
  }

  /**
   * Get threat feed statistics
   */
  getThreatFeedStats(): {
    maliciousIPs: number;
    maliciousURLs: number;
    maliciousHashes: number;
    lastUpdated: Date;
  } {
    return {
      maliciousIPs: this.customThreatFeed.maliciousIPs.size,
      maliciousURLs: this.customThreatFeed.maliciousURLs.size,
      maliciousHashes: this.customThreatFeed.maliciousHashes.size,
      lastUpdated: this.customThreatFeed.lastUpdated
    };
  }

  /**
   * Export threat feed (for sharing)
   */
  exportThreatFeed(): {
    maliciousIPs: string[];
    maliciousURLs: string[];
    maliciousHashes: string[];
  } {
    return {
      maliciousIPs: Array.from(this.customThreatFeed.maliciousIPs),
      maliciousURLs: Array.from(this.customThreatFeed.maliciousURLs),
      maliciousHashes: Array.from(this.customThreatFeed.maliciousHashes)
    };
  }

  /**
   * Import threat feed
   */
  importThreatFeed(feed: {
    maliciousIPs?: string[];
    maliciousURLs?: string[];
    maliciousHashes?: string[];
  }): void {
    if (feed.maliciousIPs) {
      feed.maliciousIPs.forEach(ip => this.customThreatFeed.maliciousIPs.add(ip));
    }

    if (feed.maliciousURLs) {
      feed.maliciousURLs.forEach(url => this.customThreatFeed.maliciousURLs.add(url));
    }

    if (feed.maliciousHashes) {
      feed.maliciousHashes.forEach(hash => this.customThreatFeed.maliciousHashes.add(hash));
    }

    this.customThreatFeed.lastUpdated = new Date();
    this.emit('threat:feed_imported', feed);
  }

  /**
   * Start periodic threat feed updates
   */
  private startThreatFeedUpdates(): void {
    setInterval(async () => {
      try {
        // Update threat feeds from external sources
        await this.updateThreatFeeds();
      } catch (error) {
        console.error('Threat feed update failed:', error);
      }
    }, this.config.updateInterval);
  }

  /**
   * Update threat feeds from external sources
   */
  private async updateThreatFeeds(): Promise<void> {
    // Placeholder for external threat feed updates
    // In production, fetch from:
    // - Emerging Threats feeds
    // - AlienVault OTX
    // - Abuse.ch
    // - Custom threat intelligence providers

    this.emit('threat:feeds_updated', {
      timestamp: new Date(),
      sources: ['custom']
    });
  }
}

/**
 * Singleton Threat Intelligence Manager
 */
export class ThreatIntelManager {
  private static instance: ThreatIntelligenceService;

  static initialize(cache: RedisCache, config?: Partial<ThreatIntelConfig>): void {
    if (this.instance) {
      throw new Error('Threat intelligence service already initialized');
    }
    this.instance = new ThreatIntelligenceService(cache, config);
  }

  static getInstance(): ThreatIntelligenceService {
    if (!this.instance) {
      throw new Error('Threat intelligence service not initialized');
    }
    return this.instance;
  }
}
