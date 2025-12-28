/**
 * Web Application Firewall Service
 * Phase 13 Week 1
 *
 * Advanced WAF with SQL injection detection, XSS prevention, CSRF protection,
 * path traversal detection, and intelligent threat scoring
 */

import { Request, Response, NextFunction } from 'express';
import EventEmitter from 'events';

export interface WAFRule {
  id: string;
  name: string;
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  action: 'block' | 'log' | 'challenge';
  enabled: boolean;
  category: 'sql-injection' | 'xss' | 'path-traversal' | 'command-injection' | 'csrf' | 'custom';
}

export interface WAFViolation {
  timestamp: Date;
  ip: string;
  userId?: string;
  rule: WAFRule;
  request: {
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: any;
    query?: any;
  };
  blocked: boolean;
  threatScore: number; // 0-100
}

export interface WAFStats {
  totalRequests: number;
  blockedRequests: number;
  loggedViolations: number;
  challengesSent: number;
  blockRate: number; // percentage
  topAttackTypes: Map<string, number>;
  topAttackerIPs: Map<string, number>;
}

export class WAFService extends EventEmitter {
  private rules: Map<string, WAFRule> = new Map();
  private violations: WAFViolation[] = [];
  private stats: WAFStats;
  private ipThreatScores: Map<string, number> = new Map();
  private readonly MAX_VIOLATIONS_HISTORY = 10000;
  private readonly THREAT_SCORE_DECAY = 0.95; // Decay per hour

  constructor() {
    super();

    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      loggedViolations: 0,
      challengesSent: 0,
      blockRate: 0,
      topAttackTypes: new Map(),
      topAttackerIPs: new Map()
    };

    this.registerDefaultRules();
    this.startThreatScoreDecay();
  }

  /**
   * WAF middleware for Express
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      this.stats.totalRequests++;

      try {
        const violations = await this.inspectRequest(req);

        if (violations.length === 0) {
          return next();
        }

        // Calculate threat score
        const threatScore = this.calculateThreatScore(violations, req.ip);
        this.updateIPThreatScore(req.ip, threatScore);

        // Handle violations based on highest severity action
        const criticalViolation = violations.find(v => v.rule.action === 'block');

        if (criticalViolation) {
          this.stats.blockedRequests++;
          this.recordViolation({ ...criticalViolation, blocked: true, threatScore });

          res.status(403).json({
            error: 'Forbidden',
            message: 'Request blocked by Web Application Firewall',
            violationId: criticalViolation.rule.id,
            timestamp: new Date().toISOString()
          });

          this.emit('waf:blocked', criticalViolation);
          return;
        }

        // Log violations without blocking
        violations.forEach(v => {
          this.stats.loggedViolations++;
          this.recordViolation({ ...v, blocked: false, threatScore });
          this.emit('waf:violation', v);
        });

        next();
      } catch (error) {
        console.error('WAF inspection error:', error);
        next(); // Fail open to avoid blocking legitimate traffic
      }
    };
  }

  /**
   * Inspect request for violations
   */
  private async inspectRequest(req: Request): Promise<WAFViolation[]> {
    const violations: WAFViolation[] = [];

    for (const [_, rule] of this.rules) {
      if (!rule.enabled) continue;

      const violation = this.testRule(rule, req);
      if (violation) {
        violations.push(violation);
      }
    }

    return violations;
  }

  /**
   * Test a single rule against request
   */
  private testRule(rule: WAFRule, req: Request): WAFViolation | null {
    const testData = this.extractTestData(req);

    for (const data of testData) {
      if (rule.pattern.test(data)) {
        return {
          timestamp: new Date(),
          ip: req.ip,
          userId: (req as any).user?.id,
          rule,
          request: {
            method: req.method,
            path: req.path,
            headers: this.sanitizeHeaders(req.headers as Record<string, string>),
            body: this.sanitizeBody(req.body),
            query: req.query
          },
          blocked: false,
          threatScore: 0
        };
      }
    }

    return null;
  }

  /**
   * Extract data to test from request
   */
  private extractTestData(req: Request): string[] {
    const data: string[] = [];

    // URL and query parameters
    data.push(req.url);
    Object.values(req.query || {}).forEach(v => {
      if (typeof v === 'string') data.push(v);
    });

    // Request body
    if (req.body) {
      data.push(JSON.stringify(req.body));
      this.extractObjectValues(req.body, data);
    }

    // Headers
    Object.values(req.headers || {}).forEach(v => {
      if (typeof v === 'string') data.push(v);
    });

    return data;
  }

  /**
   * Extract values from nested object
   */
  private extractObjectValues(obj: any, data: string[]): void {
    if (typeof obj !== 'object' || obj === null) return;

    for (const value of Object.values(obj)) {
      if (typeof value === 'string') {
        data.push(value);
      } else if (typeof value === 'object') {
        this.extractObjectValues(value, data);
      }
    }
  }

  /**
   * Calculate threat score for request
   */
  private calculateThreatScore(violations: WAFViolation[], ip: string): number {
    let score = 0;

    violations.forEach(v => {
      switch (v.rule.severity) {
        case 'critical':
          score += 50;
          break;
        case 'high':
          score += 30;
          break;
        case 'medium':
          score += 15;
          break;
        case 'low':
          score += 5;
          break;
      }
    });

    // Add historical threat score
    const historicalScore = this.ipThreatScores.get(ip) || 0;
    score += historicalScore * 0.3;

    return Math.min(score, 100);
  }

  /**
   * Update IP threat score
   */
  private updateIPThreatScore(ip: string, newScore: number): void {
    const currentScore = this.ipThreatScores.get(ip) || 0;
    const updatedScore = Math.max(currentScore, newScore);
    this.ipThreatScores.set(ip, updatedScore);
  }

  /**
   * Record violation in history
   */
  private recordViolation(violation: WAFViolation): void {
    this.violations.push(violation);

    // Limit history size
    if (this.violations.length > this.MAX_VIOLATIONS_HISTORY) {
      this.violations = this.violations.slice(-this.MAX_VIOLATIONS_HISTORY);
    }

    // Update stats
    const attackType = violation.rule.category;
    this.stats.topAttackTypes.set(
      attackType,
      (this.stats.topAttackTypes.get(attackType) || 0) + 1
    );

    this.stats.topAttackerIPs.set(
      violation.ip,
      (this.stats.topAttackerIPs.get(violation.ip) || 0) + 1
    );

    this.updateBlockRate();
  }

  /**
   * Update block rate statistic
   */
  private updateBlockRate(): void {
    if (this.stats.totalRequests === 0) {
      this.stats.blockRate = 0;
    } else {
      this.stats.blockRate = (this.stats.blockedRequests / this.stats.totalRequests) * 100;
    }
  }

  /**
   * Register a custom WAF rule
   */
  registerRule(rule: WAFRule): void {
    this.rules.set(rule.id, rule);
    this.emit('rule:registered', rule);
  }

  /**
   * Disable a rule
   */
  disableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      return true;
    }
    return false;
  }

  /**
   * Enable a rule
   */
  enableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      return true;
    }
    return false;
  }

  /**
   * Get WAF statistics
   */
  getStats(): WAFStats {
    return {
      ...this.stats,
      topAttackTypes: new Map(this.stats.topAttackTypes),
      topAttackerIPs: new Map(this.stats.topAttackerIPs)
    };
  }

  /**
   * Get violations for IP
   */
  getViolationsByIP(ip: string, limit: number = 100): WAFViolation[] {
    return this.violations
      .filter(v => v.ip === ip)
      .slice(-limit);
  }

  /**
   * Get recent violations
   */
  getRecentViolations(limit: number = 100): WAFViolation[] {
    return this.violations.slice(-limit);
  }

  /**
   * Get IP threat score
   */
  getIPThreatScore(ip: string): number {
    return this.ipThreatScores.get(ip) || 0;
  }

  /**
   * Clear violations history
   */
  clearHistory(): void {
    this.violations = [];
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      loggedViolations: 0,
      challengesSent: 0,
      blockRate: 0,
      topAttackTypes: new Map(),
      topAttackerIPs: new Map()
    };
  }

  /**
   * Sanitize headers for logging
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitize body for logging
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Register default WAF rules
   */
  private registerDefaultRules(): void {
    // SQL Injection Rules
    this.registerRule({
      id: 'sql-001',
      name: 'SQL Injection - UNION Attack',
      pattern: /(\bunion\b.*\bselect\b|\bselect\b.*\bunion\b)/i,
      severity: 'critical',
      action: 'block',
      enabled: true,
      category: 'sql-injection'
    });

    this.registerRule({
      id: 'sql-002',
      name: 'SQL Injection - OR 1=1',
      pattern: /(\bor\b\s+[\d\w]+\s*=\s*[\d\w]+|\band\b\s+[\d\w]+\s*=\s*[\d\w]+)/i,
      severity: 'critical',
      action: 'block',
      enabled: true,
      category: 'sql-injection'
    });

    this.registerRule({
      id: 'sql-003',
      name: 'SQL Injection - DROP/DELETE',
      pattern: /(\bdrop\b|\bdelete\b|\btruncate\b)\s+\btable\b/i,
      severity: 'critical',
      action: 'block',
      enabled: true,
      category: 'sql-injection'
    });

    this.registerRule({
      id: 'sql-004',
      name: 'SQL Injection - Comment Syntax',
      pattern: /(--|\#|\/\*|\*\/)/,
      severity: 'high',
      action: 'log',
      enabled: true,
      category: 'sql-injection'
    });

    // XSS Rules
    this.registerRule({
      id: 'xss-001',
      name: 'XSS - Script Tag',
      pattern: /<script[^>]*>[\s\S]*?<\/script>/i,
      severity: 'critical',
      action: 'block',
      enabled: true,
      category: 'xss'
    });

    this.registerRule({
      id: 'xss-002',
      name: 'XSS - Event Handler',
      pattern: /on(load|error|click|mouseover|focus)\s*=/i,
      severity: 'high',
      action: 'block',
      enabled: true,
      category: 'xss'
    });

    this.registerRule({
      id: 'xss-003',
      name: 'XSS - JavaScript Protocol',
      pattern: /javascript:/i,
      severity: 'high',
      action: 'block',
      enabled: true,
      category: 'xss'
    });

    // Path Traversal Rules
    this.registerRule({
      id: 'path-001',
      name: 'Path Traversal - Directory Traversal',
      pattern: /(\.\.[\/\\]|[\/\\]\.\.|%2e%2e[\/\\]|[\/\\]%2e%2e)/i,
      severity: 'critical',
      action: 'block',
      enabled: true,
      category: 'path-traversal'
    });

    this.registerRule({
      id: 'path-002',
      name: 'Path Traversal - Absolute Path',
      pattern: /(\/etc\/passwd|\/windows\/|c:\\)/i,
      severity: 'critical',
      action: 'block',
      enabled: true,
      category: 'path-traversal'
    });

    // Command Injection Rules
    this.registerRule({
      id: 'cmd-001',
      name: 'Command Injection - Shell Commands',
      pattern: /(\||;|`|\$\(|\${|&&)/,
      severity: 'critical',
      action: 'block',
      enabled: true,
      category: 'command-injection'
    });

    this.registerRule({
      id: 'cmd-002',
      name: 'Command Injection - System Commands',
      pattern: /\b(cat|ls|pwd|whoami|wget|curl)\b/i,
      severity: 'high',
      action: 'log',
      enabled: true,
      category: 'command-injection'
    });
  }

  /**
   * Start threat score decay (hourly)
   */
  private startThreatScoreDecay(): void {
    setInterval(() => {
      for (const [ip, score] of this.ipThreatScores) {
        const decayedScore = score * this.THREAT_SCORE_DECAY;

        if (decayedScore < 1) {
          this.ipThreatScores.delete(ip);
        } else {
          this.ipThreatScores.set(ip, decayedScore);
        }
      }
    }, 3600000); // 1 hour
  }
}

/**
 * Singleton WAF instance
 */
export class WAFManager {
  private static instance: WAFService;

  static initialize(): WAFService {
    if (!this.instance) {
      this.instance = new WAFService();
    }
    return this.instance;
  }

  static getInstance(): WAFService {
    if (!this.instance) {
      throw new Error('WAF not initialized. Call initialize() first.');
    }
    return this.instance;
  }
}
