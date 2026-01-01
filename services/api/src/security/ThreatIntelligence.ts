import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { Logger } from '../utils/logger';
import * as tf from '@tensorflow/tfjs-node';
import { Queue } from 'bullmq';
import { lookup as geoipLookup } from 'geoip-lite';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const logger = new Logger('ThreatIntelligence');

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface ThreatFeed {
  name: string;
  type: 'IP' | 'DOMAIN' | 'URL' | 'HASH' | 'EMAIL';
  source: 'AbuseIPDB' | 'AlienVault' | 'VirusTotal' | 'IBM_XForce' | 'MITRE' | 'CVE';
  lastUpdated: Date;
  entriesCount: number;
  enabled: boolean;
}

export interface IPReputation {
  ipAddress: string;
  reputationScore: number; // 0-100 (higher = worse)
  isBlacklisted: boolean;
  isTorExitNode: boolean;
  isVPN: boolean;
  isProxy: boolean;
  isCloudProvider: boolean;
  cloudProvider?: string;
  country: string;
  asn: number;
  asnOrg: string;
  threatTypes: string[];
  lastSeen: Date;
  reportCount: number;
  sources: string[];
}

export interface ThreatIndicator {
  id: string;
  type: 'IP' | 'DOMAIN' | 'URL' | 'HASH' | 'EMAIL';
  value: string;
  threatType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  confidence: number; // 0-100
  source: string;
  description: string;
  tags: string[];
  firstSeen: Date;
  lastSeen: Date;
  expiresAt: Date;
  metadata: Record<string, any>;
}

export interface ThreatDetection {
  id: string;
  type: 'BRUTE_FORCE' | 'CREDENTIAL_STUFFING' | 'ACCOUNT_TAKEOVER' | 'SQL_INJECTION' |
        'XSS' | 'COMMAND_INJECTION' | 'PATH_TRAVERSAL' | 'DDOS' | 'DATA_EXFILTRATION' |
        'PRIVILEGE_ESCALATION' | 'MALWARE' | 'PHISHING';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  score: number; // 0-100
  source: string;
  target: string;
  userId?: string;
  ipAddress: string;
  payload: string;
  timestamp: Date;
  blocked: boolean;
  mitreAttack?: {
    tactic: string;
    technique: string;
    subTechnique?: string;
  };
}

export interface BehaviorAnomaly {
  userId: string;
  anomalyType: 'UNUSUAL_ACCESS_PATTERN' | 'DATA_EXFILTRATION' | 'PRIVILEGE_ESCALATION' |
                'UNUSUAL_LOCATION' | 'UNUSUAL_TIME' | 'EXCESSIVE_REQUESTS';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number; // 0-100
  details: string;
  baseline: any;
  current: any;
  timestamp: Date;
}

export interface ThreatScore {
  overall: number; // 0-100 (higher = more threatening)
  components: {
    ipReputation: number;
    userBehavior: number;
    payloadAnalysis: number;
  };
  action: 'ALLOW' | 'LOG' | 'CHALLENGE' | 'BLOCK';
  reasons: string[];
}

export interface AutomatedResponse {
  actionType: 'BLOCK_IP' | 'DISABLE_ACCOUNT' | 'TRIGGER_INCIDENT' | 'ALERT_SOC' | 'QUARANTINE';
  executed: boolean;
  timestamp: Date;
  details: string;
  affectedResources: string[];
}

export interface CVEInfo {
  cveId: string;
  description: string;
  cvssScore: number;
  cvssVector: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  publishedDate: Date;
  lastModifiedDate: Date;
  affectedProducts: string[];
  references: string[];
  exploitAvailable: boolean;
  patchAvailable: boolean;
}

// ============================================================================
// THREAT INTELLIGENCE SERVICE
// ============================================================================

export class ThreatIntelligenceService {
  private abuseIPDBClient: AxiosInstance;
  private alienVaultClient: AxiosInstance;
  private virusTotalClient: AxiosInstance;
  private ibmXForceClient: AxiosInstance;
  private anomalyModel: tf.LayersModel | null = null;
  private incidentQueue: Queue;

  // Pattern databases
  private sqlInjectionPatterns: RegExp[];
  private xssPatterns: RegExp[];
  private commandInjectionPatterns: RegExp[];
  private pathTraversalPatterns: RegExp[];

  constructor() {
    // Initialize API clients
    this.abuseIPDBClient = axios.create({
      baseURL: 'https://api.abuseipdb.com/api/v2',
      headers: {
        'Key': process.env.ABUSEIPDB_API_KEY || '',
        'Accept': 'application/json'
      }
    });

    this.alienVaultClient = axios.create({
      baseURL: 'https://otx.alienvault.com/api/v1',
      headers: {
        'X-OTX-API-KEY': process.env.ALIENVAULT_API_KEY || ''
      }
    });

    this.virusTotalClient = axios.create({
      baseURL: 'https://www.virustotal.com/api/v3',
      headers: {
        'x-apikey': process.env.VIRUSTOTAL_API_KEY || ''
      }
    });

    this.ibmXForceClient = axios.create({
      baseURL: 'https://api.xforce.ibmcloud.com',
      auth: {
        username: process.env.IBM_XFORCE_KEY || '',
        password: process.env.IBM_XFORCE_PASSWORD || ''
      }
    });

    // Initialize BullMQ queue for incident response
    this.incidentQueue = new Queue('incident-response', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    // Initialize attack pattern detection
    this.initializePatterns();
    this.initializeAnomalyModel();
    this.startThreatFeedUpdates();
  }

  // ==========================================================================
  // THREAT INTELLIGENCE FEEDS
  // ==========================================================================

  private async startThreatFeedUpdates(): Promise<void> {
    // Update feeds every 1 hour
    setInterval(async () => {
      await this.updateAllFeeds();
    }, 3600000);

    // Initial update
    await this.updateAllFeeds();
  }

  private async updateAllFeeds(): Promise<void> {
    logger.info('Updating threat intelligence feeds...');

    try {
      await Promise.all([
        this.updateAbuseIPDBFeed(),
        this.updateAlienVaultFeed(),
        this.updateCVEFeed(),
        this.updateTorExitNodes(),
        this.updateCloudProviderIPs()
      ]);

      logger.info('Threat intelligence feeds updated successfully');
    } catch (error) {
      logger.error('Failed to update threat feeds', error);
    }
  }

  private async updateAbuseIPDBFeed(): Promise<void> {
    try {
      const response = await this.abuseIPDBClient.get('/blacklist', {
        params: {
          confidenceMinimum: 90,
          limit: 10000
        }
      });

      const blacklist = response.data.data;

      for (const entry of blacklist) {
        await this.addThreatIndicator({
          type: 'IP',
          value: entry.ipAddress,
          threatType: 'MALICIOUS_IP',
          severity: entry.abuseConfidenceScore > 95 ? 'CRITICAL' : 'HIGH',
          confidence: entry.abuseConfidenceScore,
          source: 'AbuseIPDB',
          description: `Reported ${entry.totalReports} times`,
          tags: ['blacklist', 'abuse'],
          expiresAt: new Date(Date.now() + 86400000 * 7) // 7 days
        });

        // Add to Redis blocklist
        await redis.sadd('ip:blocklist', entry.ipAddress);
      }

      logger.info(`Updated AbuseIPDB feed: ${blacklist.length} IPs`);
    } catch (error) {
      logger.error('Failed to update AbuseIPDB feed', error);
    }
  }

  private async updateAlienVaultFeed(): Promise<void> {
    try {
      const response = await this.alienVaultClient.get('/pulses/subscribed');

      const pulses = response.data.results;

      for (const pulse of pulses) {
        for (const indicator of pulse.indicators) {
          await this.addThreatIndicator({
            type: this.mapAlienVaultType(indicator.type),
            value: indicator.indicator,
            threatType: pulse.tags.join(', '),
            severity: this.calculateSeverityFromTags(pulse.tags),
            confidence: 80,
            source: 'AlienVault OTX',
            description: pulse.description,
            tags: pulse.tags,
            expiresAt: new Date(Date.now() + 86400000 * 30) // 30 days
          });
        }
      }

      logger.info(`Updated AlienVault feed: ${pulses.length} pulses`);
    } catch (error) {
      logger.error('Failed to update AlienVault feed', error);
    }
  }

  private mapAlienVaultType(type: string): ThreatIndicator['type'] {
    const mapping: Record<string, ThreatIndicator['type']> = {
      'IPv4': 'IP',
      'IPv6': 'IP',
      'domain': 'DOMAIN',
      'hostname': 'DOMAIN',
      'URL': 'URL',
      'FileHash-MD5': 'HASH',
      'FileHash-SHA1': 'HASH',
      'FileHash-SHA256': 'HASH',
      'email': 'EMAIL'
    };

    return mapping[type] || 'IP';
  }

  private calculateSeverityFromTags(tags: string[]): ThreatIndicator['severity'] {
    const criticalTags = ['apt', 'ransomware', 'backdoor', 'trojan'];
    const highTags = ['malware', 'phishing', 'exploit'];
    const mediumTags = ['spam', 'suspicious'];

    if (tags.some(tag => criticalTags.includes(tag.toLowerCase()))) return 'CRITICAL';
    if (tags.some(tag => highTags.includes(tag.toLowerCase()))) return 'HIGH';
    if (tags.some(tag => mediumTags.includes(tag.toLowerCase()))) return 'MEDIUM';

    return 'LOW';
  }

  private async updateCVEFeed(): Promise<void> {
    try {
      // Fetch recent CVEs from NVD
      const response = await axios.get('https://services.nvd.nist.gov/rest/json/cves/2.0', {
        params: {
          resultsPerPage: 100,
          startIndex: 0
        }
      });

      const cves = response.data.vulnerabilities;

      for (const cveItem of cves) {
        const cve = cveItem.cve;

        const cvssScore = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 0;

        await this.storeCVE({
          cveId: cve.id,
          description: cve.descriptions?.[0]?.value || '',
          cvssScore,
          cvssVector: cve.metrics?.cvssMetricV31?.[0]?.cvssData?.vectorString || '',
          severity: this.cvssToSeverity(cvssScore),
          publishedDate: new Date(cve.published),
          lastModifiedDate: new Date(cve.lastModified),
          affectedProducts: cve.configurations?.nodes?.map((n: any) => n.cpeMatch?.[0]?.criteria) || [],
          references: cve.references?.map((r: any) => r.url) || [],
          exploitAvailable: false,
          patchAvailable: false
        });
      }

      logger.info(`Updated CVE feed: ${cves.length} vulnerabilities`);
    } catch (error) {
      logger.error('Failed to update CVE feed', error);
    }
  }

  private cvssToSeverity(score: number): CVEInfo['severity'] {
    if (score >= 9.0) return 'CRITICAL';
    if (score >= 7.0) return 'HIGH';
    if (score >= 4.0) return 'MEDIUM';
    return 'LOW';
  }

  private async storeCVE(cve: CVEInfo): Promise<void> {
    await prisma.cVE.upsert({
      where: { cveId: cve.cveId },
      create: {
        cveId: cve.cveId,
        description: cve.description,
        cvssScore: cve.cvssScore,
        cvssVector: cve.cvssVector,
        severity: cve.severity,
        publishedDate: cve.publishedDate,
        lastModifiedDate: cve.lastModifiedDate,
        affectedProducts: cve.affectedProducts,
        references: cve.references,
        exploitAvailable: cve.exploitAvailable,
        patchAvailable: cve.patchAvailable
      },
      update: {
        lastModifiedDate: cve.lastModifiedDate,
        cvssScore: cve.cvssScore,
        severity: cve.severity
      }
    });
  }

  private async updateTorExitNodes(): Promise<void> {
    try {
      const response = await axios.get('https://check.torproject.org/torbulkexitlist');
      const torIPs = response.data.split('\n').filter((ip: string) => ip && !ip.startsWith('#'));

      for (const ip of torIPs) {
        await redis.sadd('ip:tor', ip);
        await this.addThreatIndicator({
          type: 'IP',
          value: ip,
          threatType: 'TOR_EXIT_NODE',
          severity: 'MEDIUM',
          confidence: 100,
          source: 'TorProject',
          description: 'Tor exit node',
          tags: ['tor', 'anonymizer'],
          expiresAt: new Date(Date.now() + 86400000 * 7)
        });
      }

      // Expire the set
      await redis.expire('ip:tor', 86400 * 7);

      logger.info(`Updated Tor exit nodes: ${torIPs.length} IPs`);
    } catch (error) {
      logger.error('Failed to update Tor exit nodes', error);
    }
  }

  private async updateCloudProviderIPs(): Promise<void> {
    try {
      // AWS IP ranges
      const awsResponse = await axios.get('https://ip-ranges.amazonaws.com/ip-ranges.json');
      const awsPrefixes = awsResponse.data.prefixes;

      for (const prefix of awsPrefixes) {
        await redis.sadd('ip:cloud:aws', prefix.ip_prefix);
      }

      // GCP IP ranges
      const gcpResponse = await axios.get('https://www.gstatic.com/ipranges/cloud.json');
      const gcpPrefixes = gcpResponse.data.prefixes;

      for (const prefix of gcpPrefixes) {
        if (prefix.ipv4Prefix) {
          await redis.sadd('ip:cloud:gcp', prefix.ipv4Prefix);
        }
      }

      // Azure IP ranges (simplified - Azure publishes large JSON)
      // In production, download and parse the full Azure IP ranges

      logger.info('Updated cloud provider IP ranges');
    } catch (error) {
      logger.error('Failed to update cloud provider IPs', error);
    }
  }

  // ==========================================================================
  // IP REPUTATION MANAGEMENT
  // ==========================================================================

  async getIPReputation(ipAddress: string): Promise<IPReputation> {
    // Check cache first
    const cacheKey = `ip:reputation:${ipAddress}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Build reputation from multiple sources
    const reputation: IPReputation = {
      ipAddress,
      reputationScore: 0,
      isBlacklisted: false,
      isTorExitNode: false,
      isVPN: false,
      isProxy: false,
      isCloudProvider: false,
      country: '',
      asn: 0,
      asnOrg: '',
      threatTypes: [],
      lastSeen: new Date(),
      reportCount: 0,
      sources: []
    };

    // Check blocklist
    reputation.isBlacklisted = await redis.sismember('ip:blocklist', ipAddress) === 1;
    if (reputation.isBlacklisted) {
      reputation.reputationScore += 50;
      reputation.sources.push('Blocklist');
    }

    // Check Tor
    reputation.isTorExitNode = await redis.sismember('ip:tor', ipAddress) === 1;
    if (reputation.isTorExitNode) {
      reputation.reputationScore += 30;
      reputation.sources.push('Tor');
      reputation.threatTypes.push('TOR_EXIT_NODE');
    }

    // Check cloud providers
    const isAWS = await this.isIPInRange(ipAddress, 'ip:cloud:aws');
    const isGCP = await this.isIPInRange(ipAddress, 'ip:cloud:gcp');

    if (isAWS || isGCP) {
      reputation.isCloudProvider = true;
      reputation.cloudProvider = isAWS ? 'AWS' : 'GCP';
      reputation.reputationScore += 10; // Slight increase for cloud IPs
    }

    // Get geolocation
    const geo = geoipLookup(ipAddress);
    if (geo) {
      reputation.country = geo.country;
    }

    // Query AbuseIPDB
    try {
      const abuseData = await this.queryAbuseIPDB(ipAddress);
      if (abuseData) {
        reputation.reputationScore += abuseData.abuseConfidenceScore;
        reputation.reportCount = abuseData.totalReports;
        reputation.sources.push('AbuseIPDB');
        reputation.threatTypes.push(...abuseData.usageType);
      }
    } catch (error) {
      logger.error(`Failed to query AbuseIPDB for ${ipAddress}`, error);
    }

    // Query AlienVault OTX
    try {
      const otxData = await this.queryAlienVault(ipAddress);
      if (otxData && otxData.pulse_info.count > 0) {
        reputation.reputationScore += Math.min(otxData.pulse_info.count * 5, 30);
        reputation.sources.push('AlienVault');
        reputation.threatTypes.push('OTX_PULSE');
      }
    } catch (error) {
      logger.error(`Failed to query AlienVault for ${ipAddress}`, error);
    }

    // Cap at 100
    reputation.reputationScore = Math.min(reputation.reputationScore, 100);

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(reputation));

    return reputation;
  }

  private async isIPInRange(ipAddress: string, setKey: string): Promise<boolean> {
    // Simplified check - in production, use proper CIDR matching
    const ranges = await redis.smembers(setKey);

    for (const range of ranges) {
      if (this.ipInCIDR(ipAddress, range)) {
        return true;
      }
    }

    return false;
  }

  private ipInCIDR(ip: string, cidr: string): boolean {
    // Simple CIDR check - in production, use a library like ip-cidr
    const [range, bits] = cidr.split('/');
    const ipParts = ip.split('.').map(Number);
    const rangeParts = range.split('.').map(Number);

    const bitsNum = parseInt(bits || '32');
    const mask = -1 << (32 - bitsNum);

    const ipNum = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
    const rangeNum = (rangeParts[0] << 24) + (rangeParts[1] << 16) + (rangeParts[2] << 8) + rangeParts[3];

    return (ipNum & mask) === (rangeNum & mask);
  }

  private async queryAbuseIPDB(ipAddress: string): Promise<any> {
    const response = await this.abuseIPDBClient.get('/check', {
      params: {
        ipAddress,
        maxAgeInDays: 90
      }
    });

    return response.data.data;
  }

  private async queryAlienVault(ipAddress: string): Promise<any> {
    const response = await this.alienVaultClient.get(`/indicators/IPv4/${ipAddress}/general`);
    return response.data;
  }

  async blockIP(ipAddress: string, reason: string, duration?: number): Promise<void> {
    await redis.sadd('ip:blocklist', ipAddress);

    if (duration) {
      // Temporary block
      setTimeout(async () => {
        await redis.srem('ip:blocklist', ipAddress);
        logger.info(`IP ${ipAddress} unbanned after ${duration}ms`);
      }, duration);
    }

    // Update AWS WAF
    await this.updateAWSWAF('block', ipAddress);

    logger.warn(`IP ${ipAddress} blocked: ${reason}`);

    await prisma.blockedIP.create({
      data: {
        ipAddress,
        reason,
        blockedAt: new Date(),
        expiresAt: duration ? new Date(Date.now() + duration) : null
      }
    });
  }

  private async updateAWSWAF(action: 'block' | 'unblock', ipAddress: string): Promise<void> {
    // In production, use AWS SDK to update WAF IP sets
    // Example:
    // const waf = new AWS.WAFV2();
    // await waf.updateIPSet({...});

    logger.info(`AWS WAF updated: ${action} ${ipAddress}`);
  }

  // ==========================================================================
  // REAL-TIME THREAT DETECTION
  // ==========================================================================

  private initializePatterns(): void {
    // SQL Injection patterns
    this.sqlInjectionPatterns = [
      /(\bUNION\b.*\bSELECT\b)/i,
      /(\bSELECT\b.*\bFROM\b.*\bWHERE\b)/i,
      /(\bINSERT\b.*\bINTO\b.*\bVALUES\b)/i,
      /(\bDROP\b.*\bTABLE\b)/i,
      /(\bDELETE\b.*\bFROM\b)/i,
      /(\bUPDATE\b.*\bSET\b)/i,
      /(--|#|\/\*|\*\/)/,
      /(\bOR\b\s+\d+\s*=\s*\d+)/i,
      /(\bAND\b\s+\d+\s*=\s*\d+)/i,
      /(;\s*\bDROP\b)/i,
      /(\bEXEC\b.*\()/i,
      /(\bxp_cmdshell\b)/i
    ];

    // XSS patterns
    this.xssPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers like onclick=
      /<img[^>]+src[^>]*>/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /vbscript:/i,
      /<svg[^>]*onload/i
    ];

    // Command injection patterns
    this.commandInjectionPatterns = [
      /[;&|`$()]/,
      /\bcat\b.*\/etc\/passwd/i,
      /\bls\b.*-la/i,
      /\bwget\b/i,
      /\bcurl\b/i,
      /\bnc\b.*-e/i,
      /\/bin\/(bash|sh)/i,
      /\bchmod\b/i,
      /\bsudo\b/i
    ];

    // Path traversal patterns
    this.pathTraversalPatterns = [
      /\.\.\//,
      /\.\.\\\/,
      /%2e%2e%2f/i,
      /%2e%2e\\/i,
      /\/etc\/passwd/,
      /\/etc\/shadow/,
      /C:\\Windows/i,
      /\.\.%2F/i
    ];
  }

  async detectThreats(request: {
    userId?: string;
    ipAddress: string;
    path: string;
    method: string;
    payload: string;
    headers: Record<string, string>;
  }): Promise<ThreatDetection[]> {
    const detections: ThreatDetection[] = [];

    // SQL Injection detection
    const sqlInjection = this.detectSQLInjection(request.payload);
    if (sqlInjection) {
      detections.push(sqlInjection);
    }

    // XSS detection
    const xss = this.detectXSS(request.payload);
    if (xss) {
      detections.push(xss);
    }

    // Command injection detection
    const cmdInjection = this.detectCommandInjection(request.payload);
    if (cmdInjection) {
      detections.push(cmdInjection);
    }

    // Path traversal detection
    const pathTraversal = this.detectPathTraversal(request.path);
    if (pathTraversal) {
      detections.push(pathTraversal);
    }

    // Brute force detection
    if (request.userId) {
      const bruteForce = await this.detectBruteForce(request.userId, request.ipAddress);
      if (bruteForce) {
        detections.push(bruteForce);
      }
    }

    // Credential stuffing detection
    const credentialStuffing = await this.detectCredentialStuffing(request.ipAddress);
    if (credentialStuffing) {
      detections.push(credentialStuffing);
    }

    // DDoS detection
    const ddos = await this.detectDDoS(request.ipAddress);
    if (ddos) {
      detections.push(ddos);
    }

    // Store detections
    for (const detection of detections) {
      await this.storeDetection(detection);

      // Auto-respond to critical threats
      if (detection.severity === 'CRITICAL') {
        await this.automatedResponse(detection);
      }
    }

    return detections;
  }

  private detectSQLInjection(payload: string): ThreatDetection | null {
    for (const pattern of this.sqlInjectionPatterns) {
      if (pattern.test(payload)) {
        return {
          id: this.generateId(),
          type: 'SQL_INJECTION',
          severity: 'CRITICAL',
          score: 95,
          source: 'Pattern Matching',
          target: 'Database',
          ipAddress: '',
          payload: payload.substring(0, 500),
          timestamp: new Date(),
          blocked: true,
          mitreAttack: {
            tactic: 'Initial Access',
            technique: 'T1190',
            subTechnique: 'Exploit Public-Facing Application'
          }
        };
      }
    }

    return null;
  }

  private detectXSS(payload: string): ThreatDetection | null {
    for (const pattern of this.xssPatterns) {
      if (pattern.test(payload)) {
        return {
          id: this.generateId(),
          type: 'XSS',
          severity: 'HIGH',
          score: 85,
          source: 'Pattern Matching',
          target: 'Web Application',
          ipAddress: '',
          payload: payload.substring(0, 500),
          timestamp: new Date(),
          blocked: true,
          mitreAttack: {
            tactic: 'Initial Access',
            technique: 'T1189',
            subTechnique: 'Drive-by Compromise'
          }
        };
      }
    }

    return null;
  }

  private detectCommandInjection(payload: string): ThreatDetection | null {
    for (const pattern of this.commandInjectionPatterns) {
      if (pattern.test(payload)) {
        return {
          id: this.generateId(),
          type: 'COMMAND_INJECTION',
          severity: 'CRITICAL',
          score: 98,
          source: 'Pattern Matching',
          target: 'System',
          ipAddress: '',
          payload: payload.substring(0, 500),
          timestamp: new Date(),
          blocked: true,
          mitreAttack: {
            tactic: 'Execution',
            technique: 'T1059',
            subTechnique: 'Command and Scripting Interpreter'
          }
        };
      }
    }

    return null;
  }

  private detectPathTraversal(path: string): ThreatDetection | null {
    for (const pattern of this.pathTraversalPatterns) {
      if (pattern.test(path)) {
        return {
          id: this.generateId(),
          type: 'PATH_TRAVERSAL',
          severity: 'HIGH',
          score: 88,
          source: 'Pattern Matching',
          target: 'File System',
          ipAddress: '',
          payload: path,
          timestamp: new Date(),
          blocked: true,
          mitreAttack: {
            tactic: 'Collection',
            technique: 'T1005',
            subTechnique: 'Data from Local System'
          }
        };
      }
    }

    return null;
  }

  private async detectBruteForce(userId: string, ipAddress: string): Promise<ThreatDetection | null> {
    // Check failed login attempts in last 5 minutes
    const key = `failed:login:${userId}`;
    const attempts = await redis.get(key);
    const count = attempts ? parseInt(attempts) : 0;

    if (count >= 5) {
      return {
        id: this.generateId(),
        type: 'BRUTE_FORCE',
        severity: 'CRITICAL',
        score: 92,
        source: 'Behavioral Analysis',
        target: userId,
        userId,
        ipAddress,
        payload: `${count} failed attempts in 5 minutes`,
        timestamp: new Date(),
        blocked: true,
        mitreAttack: {
          tactic: 'Credential Access',
          technique: 'T1110',
          subTechnique: 'Brute Force'
        }
      };
    }

    return null;
  }

  private async detectCredentialStuffing(ipAddress: string): Promise<ThreatDetection | null> {
    // Check login attempts from same IP across multiple accounts
    const key = `ip:login:${ipAddress}`;
    const accounts = await redis.smembers(key);

    if (accounts.length >= 10) {
      return {
        id: this.generateId(),
        type: 'CREDENTIAL_STUFFING',
        severity: 'CRITICAL',
        score: 94,
        source: 'Behavioral Analysis',
        target: 'Multiple Accounts',
        ipAddress,
        payload: `${accounts.length} different accounts from same IP`,
        timestamp: new Date(),
        blocked: true,
        mitreAttack: {
          tactic: 'Credential Access',
          technique: 'T1110',
          subTechnique: 'Credential Stuffing'
        }
      };
    }

    return null;
  }

  private async detectDDoS(ipAddress: string): Promise<ThreatDetection | null> {
    // Check request rate from IP
    const key = `rate:${ipAddress}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, 1); // 1 second window
    }

    if (count > 1000) {
      return {
        id: this.generateId(),
        type: 'DDOS',
        severity: 'CRITICAL',
        score: 96,
        source: 'Rate Limiting',
        target: 'Application',
        ipAddress,
        payload: `${count} requests per second`,
        timestamp: new Date(),
        blocked: true,
        mitreAttack: {
          tactic: 'Impact',
          technique: 'T1499',
          subTechnique: 'Endpoint Denial of Service'
        }
      };
    }

    return null;
  }

  private async storeDetection(detection: ThreatDetection): Promise<void> {
    await prisma.threatDetection.create({
      data: {
        id: detection.id,
        type: detection.type,
        severity: detection.severity,
        score: detection.score,
        source: detection.source,
        target: detection.target,
        userId: detection.userId,
        ipAddress: detection.ipAddress,
        payload: detection.payload,
        timestamp: detection.timestamp,
        blocked: detection.blocked,
        mitreAttack: detection.mitreAttack as any
      }
    });

    logger.warn(`Threat detected: ${detection.type} (${detection.severity}) - ${detection.ipAddress}`);
  }

  // ==========================================================================
  // BEHAVIORAL ANALYSIS
  // ==========================================================================

  private async initializeAnomalyModel(): Promise<void> {
    try {
      this.anomalyModel = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [15], units: 32, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });

      this.anomalyModel.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      logger.info('Anomaly detection model initialized');
    } catch (error) {
      logger.error('Failed to initialize anomaly model', error);
    }
  }

  async detectBehavioralAnomaly(userId: string, currentBehavior: any): Promise<BehaviorAnomaly | null> {
    // Get baseline behavior
    const baseline = await prisma.userBehaviorBaseline.findUnique({
      where: { userId }
    });

    if (!baseline) {
      return null; // No baseline yet
    }

    const anomalies: BehaviorAnomaly[] = [];

    // Check access patterns
    const typicalPaths = baseline.accessPatterns as string[];
    if (!typicalPaths.includes(currentBehavior.path)) {
      anomalies.push({
        userId,
        anomalyType: 'UNUSUAL_ACCESS_PATTERN',
        severity: 'MEDIUM',
        score: 65,
        details: `Accessing unusual path: ${currentBehavior.path}`,
        baseline: { typicalPaths },
        current: { path: currentBehavior.path },
        timestamp: new Date()
      });
    }

    // Check access time
    const typicalHours = baseline.typicalLoginHours as number[];
    const currentHour = new Date().getHours();
    if (!typicalHours.includes(currentHour)) {
      anomalies.push({
        userId,
        anomalyType: 'UNUSUAL_TIME',
        severity: 'LOW',
        score: 45,
        details: `Login at unusual hour: ${currentHour}`,
        baseline: { typicalHours },
        current: { hour: currentHour },
        timestamp: new Date()
      });
    }

    // Check data exfiltration (large downloads)
    if (currentBehavior.downloadSize > 1000000000) { // 1GB
      anomalies.push({
        userId,
        anomalyType: 'DATA_EXFILTRATION',
        severity: 'HIGH',
        score: 85,
        details: `Large data download: ${currentBehavior.downloadSize} bytes`,
        baseline: {},
        current: { downloadSize: currentBehavior.downloadSize },
        timestamp: new Date()
      });
    }

    // Check excessive requests
    const requestCount = await this.getUserRequestCount(userId);
    if (requestCount > 10000) {
      anomalies.push({
        userId,
        anomalyType: 'EXCESSIVE_REQUESTS',
        severity: 'MEDIUM',
        score: 70,
        details: `Excessive requests: ${requestCount} in last hour`,
        baseline: {},
        current: { requestCount },
        timestamp: new Date()
      });
    }

    // Return highest severity anomaly
    if (anomalies.length > 0) {
      anomalies.sort((a, b) => b.score - a.score);

      // Store anomaly
      await prisma.behaviorAnomaly.create({
        data: {
          userId: anomalies[0].userId,
          anomalyType: anomalies[0].anomalyType,
          severity: anomalies[0].severity,
          score: anomalies[0].score,
          details: anomalies[0].details,
          baseline: anomalies[0].baseline as any,
          current: anomalies[0].current as any,
          timestamp: anomalies[0].timestamp
        }
      });

      return anomalies[0];
    }

    return null;
  }

  private async getUserRequestCount(userId: string): Promise<number> {
    const key = `user:requests:${userId}`;
    const count = await redis.get(key);
    return count ? parseInt(count) : 0;
  }

  // ==========================================================================
  // THREAT SCORING & AUTOMATED RESPONSE
  // ==========================================================================

  async calculateThreatScore(request: {
    ipAddress: string;
    userId?: string;
    payload: string;
  }): Promise<ThreatScore> {
    let ipReputationScore = 0;
    let userBehaviorScore = 0;
    let payloadAnalysisScore = 0;

    // IP Reputation
    const reputation = await this.getIPReputation(request.ipAddress);
    ipReputationScore = reputation.reputationScore;

    // User Behavior
    if (request.userId) {
      const anomaly = await this.detectBehavioralAnomaly(request.userId, {
        path: '/',
        downloadSize: 0
      });

      userBehaviorScore = anomaly ? anomaly.score : 0;
    }

    // Payload Analysis
    const detections = await this.detectThreats({
      userId: request.userId,
      ipAddress: request.ipAddress,
      path: '/',
      method: 'POST',
      payload: request.payload,
      headers: {}
    });

    if (detections.length > 0) {
      payloadAnalysisScore = Math.max(...detections.map(d => d.score));
    }

    // Weighted average
    const overall = Math.round(
      ipReputationScore * 0.5 +
      userBehaviorScore * 0.3 +
      payloadAnalysisScore * 0.2
    );

    let action: ThreatScore['action'];
    const reasons: string[] = [];

    if (overall >= 80) {
      action = 'BLOCK';
      reasons.push('Critical threat detected');
    } else if (overall >= 60) {
      action = 'CHALLENGE';
      reasons.push('High risk - require additional verification');
    } else if (overall >= 30) {
      action = 'LOG';
      reasons.push('Medium risk - log for review');
    } else {
      action = 'ALLOW';
    }

    if (ipReputationScore > 50) reasons.push(`High IP reputation score: ${ipReputationScore}`);
    if (userBehaviorScore > 50) reasons.push(`Behavioral anomaly detected: ${userBehaviorScore}`);
    if (payloadAnalysisScore > 50) reasons.push(`Malicious payload detected: ${payloadAnalysisScore}`);

    return {
      overall,
      components: {
        ipReputation: ipReputationScore,
        userBehavior: userBehaviorScore,
        payloadAnalysis: payloadAnalysisScore
      },
      action,
      reasons
    };
  }

  async automatedResponse(detection: ThreatDetection): Promise<AutomatedResponse> {
    const responses: AutomatedResponse = {
      actionType: 'BLOCK_IP',
      executed: false,
      timestamp: new Date(),
      details: '',
      affectedResources: []
    };

    try {
      // Block IP
      if (detection.ipAddress) {
        await this.blockIP(detection.ipAddress, `${detection.type} detected`, 86400000); // 24 hours
        responses.affectedResources.push(detection.ipAddress);
      }

      // Disable account if compromised
      if (detection.userId && ['ACCOUNT_TAKEOVER', 'CREDENTIAL_STUFFING'].includes(detection.type)) {
        await prisma.user.update({
          where: { id: detection.userId },
          data: { status: 'SUSPENDED' }
        });
        responses.actionType = 'DISABLE_ACCOUNT';
        responses.affectedResources.push(detection.userId);
      }

      // Trigger incident response workflow
      await this.incidentQueue.add('new-incident', {
        detectionId: detection.id,
        type: detection.type,
        severity: detection.severity,
        timestamp: detection.timestamp
      });

      // Alert SOC team
      await this.alertSOC(detection);

      responses.executed = true;
      responses.details = `Automated response executed for ${detection.type}`;

      logger.info(`Automated response executed for detection ${detection.id}`);
    } catch (error) {
      logger.error('Failed to execute automated response', error);
      responses.details = `Failed: ${error.message}`;
    }

    return responses;
  }

  private async alertSOC(detection: ThreatDetection): Promise<void> {
    // In production, integrate with PagerDuty, Slack, etc.
    logger.warn(`SOC ALERT: ${detection.type} - Severity: ${detection.severity}`);

    // Example: Send to Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      await axios.post(process.env.SLACK_WEBHOOK_URL, {
        text: `🚨 Security Alert: ${detection.type}`,
        attachments: [{
          color: detection.severity === 'CRITICAL' ? 'danger' : 'warning',
          fields: [
            { title: 'Severity', value: detection.severity, short: true },
            { title: 'Score', value: detection.score.toString(), short: true },
            { title: 'IP Address', value: detection.ipAddress, short: true },
            { title: 'Target', value: detection.target, short: true }
          ]
        }]
      });
    }
  }

  // ==========================================================================
  // THREAT INTELLIGENCE SHARING
  // ==========================================================================

  async addThreatIndicator(indicator: Omit<ThreatIndicator, 'id' | 'firstSeen' | 'lastSeen' | 'metadata'>): Promise<void> {
    const id = this.generateId();

    await prisma.threatIndicator.upsert({
      where: {
        type_value: {
          type: indicator.type,
          value: indicator.value
        }
      },
      create: {
        id,
        type: indicator.type,
        value: indicator.value,
        threatType: indicator.threatType,
        severity: indicator.severity,
        confidence: indicator.confidence,
        source: indicator.source,
        description: indicator.description,
        tags: indicator.tags,
        firstSeen: new Date(),
        lastSeen: new Date(),
        expiresAt: indicator.expiresAt,
        metadata: {}
      },
      update: {
        lastSeen: new Date(),
        confidence: indicator.confidence,
        severity: indicator.severity,
        expiresAt: indicator.expiresAt
      }
    });
  }

  async exportSTIX(): Promise<any> {
    // Export indicators in STIX format for sharing
    const indicators = await prisma.threatIndicator.findMany({
      where: {
        expiresAt: {
          gt: new Date()
        }
      },
      take: 1000
    });

    const stixBundle = {
      type: 'bundle',
      id: `bundle--${this.generateId()}`,
      objects: indicators.map(ind => ({
        type: 'indicator',
        id: `indicator--${ind.id}`,
        created: ind.firstSeen.toISOString(),
        modified: ind.lastSeen.toISOString(),
        pattern: `[${ind.type.toLowerCase()}:value = '${ind.value}']`,
        valid_from: ind.firstSeen.toISOString(),
        valid_until: ind.expiresAt.toISOString(),
        labels: ind.tags,
        confidence: ind.confidence
      }))
    };

    return stixBundle;
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  async getStatistics(): Promise<any> {
    const [
      totalIndicators,
      blockedIPs,
      detectionsToday,
      criticalThreats
    ] = await Promise.all([
      prisma.threatIndicator.count(),
      redis.scard('ip:blocklist'),
      prisma.threatDetection.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 86400000)
          }
        }
      }),
      prisma.threatDetection.count({
        where: {
          severity: 'CRITICAL',
          timestamp: {
            gte: new Date(Date.now() - 86400000)
          }
        }
      })
    ]);

    return {
      totalIndicators,
      blockedIPs,
      detectionsToday,
      criticalThreats
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const threatIntelligence = new ThreatIntelligenceService();
