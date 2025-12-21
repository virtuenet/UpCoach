/**
 * Threat Detection Service
 *
 * Real-time threat detection and response including:
 * - Brute force attack detection
 * - Credential stuffing detection
 * - Anomalous behavior detection
 * - IP reputation checking
 * - Rate limiting violations
 * - Bot detection
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// Threat Types
export type ThreatType =
  | 'brute_force'
  | 'credential_stuffing'
  | 'account_takeover'
  | 'bot_activity'
  | 'ddos_attempt'
  | 'sql_injection'
  | 'xss_attempt'
  | 'path_traversal'
  | 'rate_limit_violation'
  | 'ip_reputation'
  | 'suspicious_behavior'
  | 'data_exfiltration';

// Threat Severity
export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

// Threat Status
export type ThreatStatus = 'active' | 'mitigated' | 'investigating' | 'false_positive' | 'resolved';

// Threat Event
export interface ThreatEvent {
  id: string;
  type: ThreatType;
  severity: ThreatSeverity;
  status: ThreatStatus;
  source: {
    ip: string;
    userAgent?: string;
    userId?: string;
    sessionId?: string;
    country?: string;
    asn?: string;
  };
  target: {
    endpoint?: string;
    userId?: string;
    resource?: string;
  };
  indicators: ThreatIndicator[];
  score: number; // 0-100 threat score
  detectedAt: Date;
  updatedAt: Date;
  mitigatedAt?: Date;
  mitigationAction?: string;
  metadata: Record<string, any>;
}

// Threat Indicator
export interface ThreatIndicator {
  type: string;
  value: string;
  weight: number;
  description: string;
}

// IP Reputation
export interface IPReputation {
  ip: string;
  score: number; // 0-100, lower is worse
  isTor: boolean;
  isProxy: boolean;
  isVPN: boolean;
  isDatacenter: boolean;
  isKnownAttacker: boolean;
  country?: string;
  asn?: string;
  asnOrg?: string;
  threatCategories: string[];
  lastUpdated: Date;
}

// Rate Limit State
export interface RateLimitState {
  identifier: string;
  type: 'ip' | 'user' | 'endpoint';
  count: number;
  windowStart: Date;
  windowSize: number; // seconds
  limit: number;
  blocked: boolean;
  violations: number;
}

// Behavioral Baseline
export interface BehavioralBaseline {
  userId: string;
  normalHours: number[]; // 0-23
  normalDays: number[]; // 0-6 (Sun-Sat)
  normalIPs: string[];
  normalCountries: string[];
  avgRequestsPerHour: number;
  avgSessionDuration: number;
  typicalEndpoints: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Threat Rule
export interface ThreatRule {
  id: string;
  name: string;
  description: string;
  type: ThreatType;
  enabled: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  severity: ThreatSeverity;
  cooldownSeconds: number;
}

// Rule Condition
export interface RuleCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'regex' | 'in' | 'not_in';
  value: any;
}

// Rule Action
export interface RuleAction {
  type: 'block' | 'rate_limit' | 'alert' | 'log' | 'captcha' | 'mfa_challenge';
  params?: Record<string, any>;
}

// Detection Stats
export interface ThreatDetectionStats {
  totalThreats: number;
  activeThreats: number;
  mitigatedThreats: number;
  bySeverity: Record<ThreatSeverity, number>;
  byType: Record<ThreatType, number>;
  blockedIPs: number;
  rateLimit24h: number;
  falsePositiveRate: number;
}

// Config
export interface ThreatDetectionConfig {
  enabled: boolean;
  bruteForceThreshold: number;
  bruteForceWindow: number; // seconds
  rateLimitDefault: number;
  rateLimitWindow: number; // seconds
  suspicionScoreThreshold: number;
  ipReputationThreshold: number;
  autoBlockEnabled: boolean;
  autoBlockDuration: number; // seconds
}

/**
 * Threat Detection Service
 */
export class ThreatDetectionService extends EventEmitter {
  private static instance: ThreatDetectionService;
  private config: ThreatDetectionConfig;

  // In-memory storage (replace with Redis in production)
  private threats: Map<string, ThreatEvent> = new Map();
  private ipReputation: Map<string, IPReputation> = new Map();
  private rateLimits: Map<string, RateLimitState> = new Map();
  private baselines: Map<string, BehavioralBaseline> = new Map();
  private blockedIPs: Map<string, { blockedAt: Date; expiresAt: Date; reason: string }> = new Map();
  private loginAttempts: Map<string, { count: number; firstAttempt: Date }> = new Map();
  private rules: Map<string, ThreatRule> = new Map();

  // Known malicious patterns
  private readonly SQL_INJECTION_PATTERNS = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
    /((\%27)|(\'))union/gi,
  ];

  private readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+onerror\s*=/gi,
  ];

  private readonly PATH_TRAVERSAL_PATTERNS = [
    /\.\.\//g,
    /\.\.\\|/g,
    /%2e%2e%2f/gi,
    /%252e%252e%252f/gi,
  ];

  private constructor(config?: Partial<ThreatDetectionConfig>) {
    super();
    this.config = {
      enabled: true,
      bruteForceThreshold: 5,
      bruteForceWindow: 300, // 5 minutes
      rateLimitDefault: 100,
      rateLimitWindow: 60, // 1 minute
      suspicionScoreThreshold: 70,
      ipReputationThreshold: 30,
      autoBlockEnabled: true,
      autoBlockDuration: 3600, // 1 hour
      ...config,
    };

    this.initializeDefaultRules();
    this.startCleanupTask();
    console.log('ThreatDetectionService initialized');
  }

  static getInstance(config?: Partial<ThreatDetectionConfig>): ThreatDetectionService {
    if (!ThreatDetectionService.instance) {
      ThreatDetectionService.instance = new ThreatDetectionService(config);
    }
    return ThreatDetectionService.instance;
  }

  // ==================== Request Analysis ====================

  /**
   * Analyze incoming request for threats
   */
  async analyzeRequest(request: {
    ip: string;
    userAgent?: string;
    method: string;
    path: string;
    query?: Record<string, any>;
    body?: any;
    headers?: Record<string, string>;
    userId?: string;
    sessionId?: string;
  }): Promise<{
    allowed: boolean;
    threats: ThreatEvent[];
    riskScore: number;
    actions: RuleAction[];
  }> {
    if (!this.config.enabled) {
      return { allowed: true, threats: [], riskScore: 0, actions: [] };
    }

    const threats: ThreatEvent[] = [];
    const actions: RuleAction[] = [];
    let riskScore = 0;

    // Check if IP is blocked
    if (this.isIPBlocked(request.ip)) {
      return {
        allowed: false,
        threats: [],
        riskScore: 100,
        actions: [{ type: 'block', params: { reason: 'IP blocked' } }],
      };
    }

    // Check IP reputation
    const ipRep = await this.checkIPReputation(request.ip);
    if (ipRep.score < this.config.ipReputationThreshold) {
      riskScore += 30;
      threats.push(
        this.createThreat('ip_reputation', 'medium', request, [
          { type: 'ip_reputation', value: ipRep.score.toString(), weight: 30, description: 'Low IP reputation score' },
        ])
      );
    }

    // Check for SQL injection
    const sqlInjection = this.detectSQLInjection(request);
    if (sqlInjection.detected) {
      riskScore += 50;
      threats.push(
        this.createThreat('sql_injection', 'critical', request, sqlInjection.indicators)
      );
      actions.push({ type: 'block' });
    }

    // Check for XSS
    const xss = this.detectXSS(request);
    if (xss.detected) {
      riskScore += 40;
      threats.push(
        this.createThreat('xss_attempt', 'high', request, xss.indicators)
      );
      actions.push({ type: 'block' });
    }

    // Check for path traversal
    const pathTraversal = this.detectPathTraversal(request);
    if (pathTraversal.detected) {
      riskScore += 40;
      threats.push(
        this.createThreat('path_traversal', 'high', request, pathTraversal.indicators)
      );
      actions.push({ type: 'block' });
    }

    // Check rate limits
    const rateLimitResult = await this.checkRateLimit(request.ip, request.userId);
    if (rateLimitResult.exceeded) {
      riskScore += 20;
      threats.push(
        this.createThreat('rate_limit_violation', 'medium', request, [
          { type: 'rate_limit', value: rateLimitResult.count.toString(), weight: 20, description: 'Rate limit exceeded' },
        ])
      );
      actions.push({ type: 'rate_limit' });
    }

    // Check for bot activity
    const botDetection = this.detectBot(request);
    if (botDetection.isBot) {
      riskScore += botDetection.confidence;
      if (botDetection.confidence > 80) {
        threats.push(
          this.createThreat('bot_activity', 'medium', request, botDetection.indicators)
        );
        actions.push({ type: 'captcha' });
      }
    }

    // Check behavioral anomalies if user is authenticated
    if (request.userId) {
      const anomalyResult = await this.checkBehavioralAnomalies(request.userId, request);
      if (anomalyResult.anomalous) {
        riskScore += anomalyResult.score;
        threats.push(
          this.createThreat('suspicious_behavior', anomalyResult.severity, request, anomalyResult.indicators)
        );
        if (anomalyResult.score > 50) {
          actions.push({ type: 'mfa_challenge' });
        }
      }
    }

    // Store threats
    threats.forEach((threat) => {
      this.threats.set(threat.id, threat);
      this.emit('threat:detected', { threat });
    });

    // Auto-block if score exceeds threshold
    if (riskScore >= this.config.suspicionScoreThreshold && this.config.autoBlockEnabled) {
      await this.blockIP(request.ip, this.config.autoBlockDuration, 'Auto-blocked due to high risk score');
      actions.push({ type: 'block' });
    }

    return {
      allowed: actions.every((a) => a.type !== 'block'),
      threats,
      riskScore: Math.min(riskScore, 100),
      actions,
    };
  }

  // ==================== Brute Force Detection ====================

  /**
   * Track login attempt for brute force detection
   */
  async trackLoginAttempt(
    identifier: string,
    success: boolean,
    ip: string
  ): Promise<{ blocked: boolean; attempts: number }> {
    const key = `login:${identifier}:${ip}`;
    const now = new Date();
    let state = this.loginAttempts.get(key);

    if (!state || now.getTime() - state.firstAttempt.getTime() > this.config.bruteForceWindow * 1000) {
      state = { count: 0, firstAttempt: now };
    }

    if (!success) {
      state.count++;
    } else {
      // Reset on successful login
      this.loginAttempts.delete(key);
      return { blocked: false, attempts: 0 };
    }

    this.loginAttempts.set(key, state);

    if (state.count >= this.config.bruteForceThreshold) {
      await this.blockIP(ip, this.config.autoBlockDuration, 'Brute force attempt detected');

      this.createThreat(
        'brute_force',
        'high',
        { ip, userId: identifier } as any,
        [
          { type: 'failed_logins', value: state.count.toString(), weight: 40, description: 'Multiple failed login attempts' },
        ]
      );

      return { blocked: true, attempts: state.count };
    }

    return { blocked: false, attempts: state.count };
  }

  /**
   * Detect credential stuffing attack
   */
  async detectCredentialStuffing(
    ip: string,
    attempts: Array<{ username: string; success: boolean }>
  ): Promise<{ detected: boolean; confidence: number }> {
    // Credential stuffing: many different usernames from same IP
    const uniqueUsernames = new Set(attempts.map((a) => a.username)).size;
    const failedAttempts = attempts.filter((a) => !a.success).length;
    const failureRate = failedAttempts / attempts.length;

    if (uniqueUsernames > 10 && failureRate > 0.8) {
      const confidence = Math.min(uniqueUsernames * 5 + failureRate * 50, 100);

      this.createThreat(
        'credential_stuffing',
        'critical',
        { ip } as any,
        [
          { type: 'unique_usernames', value: uniqueUsernames.toString(), weight: 40, description: 'Many unique usernames attempted' },
          { type: 'failure_rate', value: `${(failureRate * 100).toFixed(1)}%`, weight: 30, description: 'High failure rate' },
        ]
      );

      await this.blockIP(ip, this.config.autoBlockDuration * 2, 'Credential stuffing detected');

      return { detected: true, confidence };
    }

    return { detected: false, confidence: 0 };
  }

  // ==================== IP Management ====================

  /**
   * Check IP reputation
   */
  async checkIPReputation(ip: string): Promise<IPReputation> {
    let reputation = this.ipReputation.get(ip);

    if (!reputation || Date.now() - reputation.lastUpdated.getTime() > 24 * 60 * 60 * 1000) {
      // In production, call external API (IPQualityScore, AbuseIPDB, etc.)
      reputation = {
        ip,
        score: Math.random() * 100, // Simulated score
        isTor: Math.random() > 0.95,
        isProxy: Math.random() > 0.9,
        isVPN: Math.random() > 0.85,
        isDatacenter: Math.random() > 0.8,
        isKnownAttacker: Math.random() > 0.98,
        country: 'US',
        asn: 'AS12345',
        asnOrg: 'Example ISP',
        threatCategories: [],
        lastUpdated: new Date(),
      };

      if (reputation.isTor || reputation.isKnownAttacker) {
        reputation.score = Math.min(reputation.score, 20);
      }

      this.ipReputation.set(ip, reputation);
    }

    return reputation;
  }

  /**
   * Block an IP address
   */
  async blockIP(ip: string, durationSeconds: number, reason: string): Promise<void> {
    const now = new Date();
    this.blockedIPs.set(ip, {
      blockedAt: now,
      expiresAt: new Date(now.getTime() + durationSeconds * 1000),
      reason,
    });

    this.emit('ip:blocked', { ip, duration: durationSeconds, reason });
  }

  /**
   * Unblock an IP address
   */
  async unblockIP(ip: string): Promise<void> {
    this.blockedIPs.delete(ip);
    this.emit('ip:unblocked', { ip });
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip: string): boolean {
    const block = this.blockedIPs.get(ip);
    if (!block) return false;

    if (block.expiresAt < new Date()) {
      this.blockedIPs.delete(ip);
      return false;
    }

    return true;
  }

  /**
   * Get all blocked IPs
   */
  getBlockedIPs(): Array<{ ip: string; blockedAt: Date; expiresAt: Date; reason: string }> {
    const now = new Date();
    const result: Array<{ ip: string; blockedAt: Date; expiresAt: Date; reason: string }> = [];

    for (const [ip, block] of this.blockedIPs) {
      if (block.expiresAt > now) {
        result.push({ ip, ...block });
      } else {
        this.blockedIPs.delete(ip);
      }
    }

    return result;
  }

  // ==================== Rate Limiting ====================

  /**
   * Check rate limit
   */
  async checkRateLimit(
    ip: string,
    userId?: string
  ): Promise<{ exceeded: boolean; count: number; limit: number }> {
    const identifier = userId || ip;
    const key = `rate:${identifier}`;
    const now = new Date();

    let state = this.rateLimits.get(key);

    if (!state || now.getTime() - state.windowStart.getTime() > this.config.rateLimitWindow * 1000) {
      state = {
        identifier,
        type: userId ? 'user' : 'ip',
        count: 0,
        windowStart: now,
        windowSize: this.config.rateLimitWindow,
        limit: this.config.rateLimitDefault,
        blocked: false,
        violations: 0,
      };
    }

    state.count++;
    this.rateLimits.set(key, state);

    const exceeded = state.count > state.limit;
    if (exceeded) {
      state.violations++;
      state.blocked = true;
    }

    return {
      exceeded,
      count: state.count,
      limit: state.limit,
    };
  }

  // ==================== Pattern Detection ====================

  /**
   * Detect SQL injection attempts
   */
  private detectSQLInjection(request: any): { detected: boolean; indicators: ThreatIndicator[] } {
    const indicators: ThreatIndicator[] = [];
    const checkValue = (value: string, source: string) => {
      for (const pattern of this.SQL_INJECTION_PATTERNS) {
        if (pattern.test(value)) {
          indicators.push({
            type: 'sql_pattern',
            value: value.substring(0, 100),
            weight: 50,
            description: `SQL injection pattern in ${source}`,
          });
          break;
        }
      }
    };

    // Check query params
    if (request.query) {
      Object.entries(request.query).forEach(([key, value]) => {
        if (typeof value === 'string') checkValue(value, `query.${key}`);
      });
    }

    // Check body
    if (request.body && typeof request.body === 'object') {
      const checkObject = (obj: any, path: string) => {
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'string') checkValue(value, `${path}.${key}`);
          else if (typeof value === 'object' && value) checkObject(value, `${path}.${key}`);
        });
      };
      checkObject(request.body, 'body');
    }

    return { detected: indicators.length > 0, indicators };
  }

  /**
   * Detect XSS attempts
   */
  private detectXSS(request: any): { detected: boolean; indicators: ThreatIndicator[] } {
    const indicators: ThreatIndicator[] = [];
    const checkValue = (value: string, source: string) => {
      for (const pattern of this.XSS_PATTERNS) {
        if (pattern.test(value)) {
          indicators.push({
            type: 'xss_pattern',
            value: value.substring(0, 100),
            weight: 40,
            description: `XSS pattern in ${source}`,
          });
          break;
        }
      }
    };

    if (request.query) {
      Object.entries(request.query).forEach(([key, value]) => {
        if (typeof value === 'string') checkValue(value, `query.${key}`);
      });
    }

    if (request.body && typeof request.body === 'object') {
      const checkObject = (obj: any, path: string) => {
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'string') checkValue(value, `${path}.${key}`);
          else if (typeof value === 'object' && value) checkObject(value, `${path}.${key}`);
        });
      };
      checkObject(request.body, 'body');
    }

    return { detected: indicators.length > 0, indicators };
  }

  /**
   * Detect path traversal attempts
   */
  private detectPathTraversal(request: any): { detected: boolean; indicators: ThreatIndicator[] } {
    const indicators: ThreatIndicator[] = [];

    for (const pattern of this.PATH_TRAVERSAL_PATTERNS) {
      if (pattern.test(request.path)) {
        indicators.push({
          type: 'path_traversal',
          value: request.path,
          weight: 40,
          description: 'Path traversal pattern in URL',
        });
        break;
      }
    }

    return { detected: indicators.length > 0, indicators };
  }

  /**
   * Detect bot activity
   */
  private detectBot(request: any): { isBot: boolean; confidence: number; indicators: ThreatIndicator[] } {
    const indicators: ThreatIndicator[] = [];
    let confidence = 0;

    // Check user agent
    const ua = request.userAgent?.toLowerCase() || '';

    // Known bot patterns
    const botPatterns = ['bot', 'crawler', 'spider', 'headless', 'phantom', 'selenium', 'puppeteer'];
    if (botPatterns.some((p) => ua.includes(p))) {
      confidence += 80;
      indicators.push({
        type: 'user_agent',
        value: ua,
        weight: 80,
        description: 'Bot-like user agent',
      });
    }

    // Missing or suspicious headers
    if (!request.headers?.['accept-language']) {
      confidence += 20;
      indicators.push({
        type: 'missing_header',
        value: 'accept-language',
        weight: 20,
        description: 'Missing Accept-Language header',
      });
    }

    // Empty or missing user agent
    if (!ua || ua.length < 10) {
      confidence += 30;
      indicators.push({
        type: 'empty_user_agent',
        value: ua || 'empty',
        weight: 30,
        description: 'Empty or minimal user agent',
      });
    }

    return {
      isBot: confidence > 50,
      confidence: Math.min(confidence, 100),
      indicators,
    };
  }

  // ==================== Behavioral Analysis ====================

  /**
   * Check for behavioral anomalies
   */
  private async checkBehavioralAnomalies(
    userId: string,
    request: any
  ): Promise<{
    anomalous: boolean;
    score: number;
    severity: ThreatSeverity;
    indicators: ThreatIndicator[];
  }> {
    const baseline = this.baselines.get(userId);
    if (!baseline) {
      // No baseline yet, create one
      this.createBaseline(userId, request);
      return { anomalous: false, score: 0, severity: 'info', indicators: [] };
    }

    const indicators: ThreatIndicator[] = [];
    let score = 0;
    const now = new Date();

    // Check if access time is unusual
    if (!baseline.normalHours.includes(now.getHours())) {
      score += 15;
      indicators.push({
        type: 'unusual_time',
        value: `Hour ${now.getHours()}`,
        weight: 15,
        description: 'Access at unusual time',
      });
    }

    // Check if IP is new
    if (!baseline.normalIPs.includes(request.ip)) {
      score += 20;
      indicators.push({
        type: 'new_ip',
        value: request.ip,
        weight: 20,
        description: 'Access from new IP address',
      });
    }

    // Check country
    const reputation = await this.checkIPReputation(request.ip);
    if (reputation.country && !baseline.normalCountries.includes(reputation.country)) {
      score += 25;
      indicators.push({
        type: 'new_country',
        value: reputation.country,
        weight: 25,
        description: 'Access from new country',
      });
    }

    const severity: ThreatSeverity =
      score >= 60 ? 'high' : score >= 40 ? 'medium' : score >= 20 ? 'low' : 'info';

    return {
      anomalous: score > 30,
      score,
      severity,
      indicators,
    };
  }

  /**
   * Create behavioral baseline for user
   */
  private createBaseline(userId: string, request: any): void {
    const now = new Date();
    this.baselines.set(userId, {
      userId,
      normalHours: [now.getHours()],
      normalDays: [now.getDay()],
      normalIPs: [request.ip],
      normalCountries: [],
      avgRequestsPerHour: 10,
      avgSessionDuration: 1800,
      typicalEndpoints: [request.path],
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Update behavioral baseline
   */
  async updateBaseline(userId: string, request: any): Promise<void> {
    const baseline = this.baselines.get(userId);
    if (!baseline) {
      this.createBaseline(userId, request);
      return;
    }

    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    if (!baseline.normalHours.includes(hour)) {
      baseline.normalHours.push(hour);
    }
    if (!baseline.normalDays.includes(day)) {
      baseline.normalDays.push(day);
    }
    if (!baseline.normalIPs.includes(request.ip)) {
      baseline.normalIPs.push(request.ip);
      // Keep only last 10 IPs
      if (baseline.normalIPs.length > 10) {
        baseline.normalIPs.shift();
      }
    }
    if (!baseline.typicalEndpoints.includes(request.path)) {
      baseline.typicalEndpoints.push(request.path);
      if (baseline.typicalEndpoints.length > 50) {
        baseline.typicalEndpoints.shift();
      }
    }

    baseline.updatedAt = now;
    this.baselines.set(userId, baseline);
  }

  // ==================== Threat Management ====================

  /**
   * Create a threat event
   */
  private createThreat(
    type: ThreatType,
    severity: ThreatSeverity,
    request: any,
    indicators: ThreatIndicator[]
  ): ThreatEvent {
    const id = `THR-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date();

    const threat: ThreatEvent = {
      id,
      type,
      severity,
      status: 'active',
      source: {
        ip: request.ip,
        userAgent: request.userAgent,
        userId: request.userId,
        sessionId: request.sessionId,
      },
      target: {
        endpoint: request.path,
        userId: request.userId,
      },
      indicators,
      score: indicators.reduce((sum, i) => sum + i.weight, 0),
      detectedAt: now,
      updatedAt: now,
      metadata: {},
    };

    this.threats.set(id, threat);
    this.emit('threat:detected', { threat });

    return threat;
  }

  /**
   * Get threat by ID
   */
  getThreat(id: string): ThreatEvent | undefined {
    return this.threats.get(id);
  }

  /**
   * Get active threats
   */
  getActiveThreats(): ThreatEvent[] {
    return Array.from(this.threats.values()).filter((t) => t.status === 'active');
  }

  /**
   * Mitigate a threat
   */
  async mitigateThreat(id: string, action: string): Promise<ThreatEvent> {
    const threat = this.threats.get(id);
    if (!threat) {
      throw new Error(`Threat not found: ${id}`);
    }

    threat.status = 'mitigated';
    threat.mitigatedAt = new Date();
    threat.mitigationAction = action;
    threat.updatedAt = new Date();

    this.threats.set(id, threat);
    this.emit('threat:mitigated', { threat });

    return threat;
  }

  /**
   * Get detection stats
   */
  getStats(): ThreatDetectionStats {
    const threats = Array.from(this.threats.values());

    const bySeverity = threats.reduce(
      (acc, t) => {
        acc[t.severity] = (acc[t.severity] || 0) + 1;
        return acc;
      },
      {} as Record<ThreatSeverity, number>
    );

    const byType = threats.reduce(
      (acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      },
      {} as Record<ThreatType, number>
    );

    const falsePositives = threats.filter((t) => t.status === 'false_positive').length;

    return {
      totalThreats: threats.length,
      activeThreats: threats.filter((t) => t.status === 'active').length,
      mitigatedThreats: threats.filter((t) => t.status === 'mitigated').length,
      bySeverity,
      byType,
      blockedIPs: this.getBlockedIPs().length,
      rateLimit24h: Array.from(this.rateLimits.values()).filter((r) => r.violations > 0).length,
      falsePositiveRate: threats.length > 0 ? falsePositives / threats.length : 0,
    };
  }

  // ==================== Helpers ====================

  private initializeDefaultRules(): void {
    // Add default rules
    this.rules.set('brute_force', {
      id: 'brute_force',
      name: 'Brute Force Detection',
      description: 'Detect multiple failed login attempts',
      type: 'brute_force',
      enabled: true,
      conditions: [
        { field: 'failed_attempts', operator: 'gte', value: 5 },
        { field: 'time_window', operator: 'lte', value: 300 },
      ],
      actions: [{ type: 'block', params: { duration: 3600 } }],
      severity: 'high',
      cooldownSeconds: 3600,
    });
  }

  private startCleanupTask(): void {
    // Clean up expired data every 5 minutes
    setInterval(() => {
      const now = new Date();

      // Clean up expired rate limits
      for (const [key, state] of this.rateLimits) {
        if (now.getTime() - state.windowStart.getTime() > state.windowSize * 1000 * 2) {
          this.rateLimits.delete(key);
        }
      }

      // Clean up expired login attempts
      for (const [key, state] of this.loginAttempts) {
        if (now.getTime() - state.firstAttempt.getTime() > this.config.bruteForceWindow * 1000 * 2) {
          this.loginAttempts.delete(key);
        }
      }

      // Clean up old threats (keep last 7 days)
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      for (const [id, threat] of this.threats) {
        if (threat.detectedAt < cutoff) {
          this.threats.delete(id);
        }
      }
    }, 5 * 60 * 1000);
  }
}

// Singleton getter
export function getThreatDetectionService(
  config?: Partial<ThreatDetectionConfig>
): ThreatDetectionService {
  return ThreatDetectionService.getInstance(config);
}
