/**
 * Configuration Scanner - Phase 13 Week 2
 * Infrastructure security configuration validation and hardening
 */

import { EventEmitter } from 'events';
import { promisify } from 'util';
import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface ConfigIssue {
  id: string;
  component: string;
  category: 'database' | 'api' | 'infrastructure' | 'network' | 'authentication' | 'encryption';
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  remediation: string;
  cwe?: string; // Common Weakness Enumeration
  compliance?: string[]; // Affected compliance frameworks (SOC2, PCI-DSS, etc.)
  autoRemediable: boolean;
  detectedAt: Date;
  resolvedAt?: Date;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted';
}

export interface ScanResult {
  scanId: string;
  scanType: string;
  timestamp: Date;
  duration: number;
  issuesFound: number;
  issuesBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  issues: ConfigIssue[];
}

export class ConfigurationScanner extends EventEmitter {
  private issues: ConfigIssue[] = [];
  private scanHistory: ScanResult[] = [];

  /**
   * Run comprehensive configuration scan
   */
  async runFullScan(): Promise<ScanResult> {
    const startTime = Date.now();
    const scanId = `scan_${Date.now()}`;

    const allIssues: ConfigIssue[] = [];

    // Run all scans in parallel
    const [dbIssues, apiIssues, infraIssues] = await Promise.all([
      this.scanDatabaseConfig(),
      this.scanAPIConfig(),
      this.scanInfrastructure()
    ]);

    allIssues.push(...dbIssues, ...apiIssues, ...infraIssues);

    // Store issues
    for (const issue of allIssues) {
      if (!this.issues.find(i => i.id === issue.id)) {
        this.issues.push(issue);
        this.emit('config:issue_detected', issue);

        // Auto-remediate if possible and severity is low/medium
        if (issue.autoRemediable && (issue.severity === 'low' || issue.severity === 'medium')) {
          await this.autoRemediate(issue.id);
        }
      }
    }

    const result: ScanResult = {
      scanId,
      scanType: 'full',
      timestamp: new Date(),
      duration: Date.now() - startTime,
      issuesFound: allIssues.length,
      issuesBySeverity: {
        critical: allIssues.filter(i => i.severity === 'critical').length,
        high: allIssues.filter(i => i.severity === 'high').length,
        medium: allIssues.filter(i => i.severity === 'medium').length,
        low: allIssues.filter(i => i.severity === 'low').length
      },
      issues: allIssues
    };

    this.scanHistory.push(result);
    this.emit('config:scan_complete', result);

    return result;
  }

  /**
   * Scan database configuration
   */
  async scanDatabaseConfig(): Promise<ConfigIssue[]> {
    const issues: ConfigIssue[] = [];

    try {
      // Check if we can access database config
      const dbConfigPath = path.join(process.cwd(), '.env');
      const envContent = await fs.readFile(dbConfigPath, 'utf-8');

      // Parse environment variables
      const env = this.parseEnv(envContent);

      // 1. Check for weak database passwords
      const dbPassword = env.DB_PASSWORD || env.DATABASE_PASSWORD || env.POSTGRES_PASSWORD;
      if (dbPassword && dbPassword.length < 12) {
        issues.push(this.createIssue({
          component: 'Database',
          category: 'database',
          issue: 'Database password is too short (<12 characters)',
          severity: 'high',
          remediation: 'Use a strong password with at least 12 characters including uppercase, lowercase, numbers, and symbols',
          cwe: 'CWE-521',
          compliance: ['SOC2-CC6.1', 'PCI-DSS-8.2'],
          autoRemediable: false
        }));
      }

      // 2. Check if SSL/TLS is enabled
      const dbSsl = env.DB_SSL || env.DATABASE_SSL;
      if (!dbSsl || dbSsl === 'false') {
        issues.push(this.createIssue({
          component: 'Database',
          category: 'database',
          issue: 'Database connections are not using SSL/TLS encryption',
          severity: 'critical',
          remediation: 'Enable SSL/TLS for all database connections by setting DB_SSL=true',
          cwe: 'CWE-319',
          compliance: ['SOC2-CC6.7', 'PCI-DSS-4.1'],
          autoRemediable: false
        }));
      }

      // 3. Check for default database credentials
      const dbUser = env.DB_USER || env.DATABASE_USER || env.POSTGRES_USER;
      if (dbUser === 'root' || dbUser === 'admin' || dbUser === 'postgres') {
        issues.push(this.createIssue({
          component: 'Database',
          category: 'database',
          issue: `Database is using default username: ${dbUser}`,
          severity: 'high',
          remediation: 'Create a dedicated database user with minimal required permissions',
          cwe: 'CWE-798',
          compliance: ['SOC2-CC6.2'],
          autoRemediable: false
        }));
      }

      // 4. Check connection pool limits
      const maxConnections = parseInt(env.DB_MAX_CONNECTIONS || env.DATABASE_MAX_CONNECTIONS || '100');
      if (maxConnections > 500) {
        issues.push(this.createIssue({
          component: 'Database',
          category: 'database',
          issue: `Database connection pool is too large (${maxConnections})`,
          severity: 'medium',
          remediation: 'Reduce connection pool to 100-200 to prevent resource exhaustion',
          autoRemediable: false
        }));
      }

      // 5. Check for exposed database port
      const dbPort = env.DB_PORT || env.DATABASE_PORT;
      if (dbPort === '5432' || dbPort === '3306' || dbPort === '27017') {
        issues.push(this.createIssue({
          component: 'Database',
          category: 'network',
          issue: `Database is using default port (${dbPort})`,
          severity: 'medium',
          remediation: 'Use a non-standard port and ensure database is not exposed to public internet',
          cwe: 'CWE-200',
          autoRemediable: false
        }));
      }

    } catch (error) {
      // Config file not found or not readable
      this.emit('config:scan_error', { component: 'database', error });
    }

    return issues;
  }

  /**
   * Scan API configuration
   */
  async scanAPIConfig(): Promise<ConfigIssue[]> {
    const issues: ConfigIssue[] = [];

    try {
      const envContent = await fs.readFile(path.join(process.cwd(), '.env'), 'utf-8');
      const env = this.parseEnv(envContent);

      // 1. Check JWT secret strength
      const jwtSecret = env.JWT_SECRET || env.SECRET_KEY;
      if (jwtSecret && jwtSecret.length < 32) {
        issues.push(this.createIssue({
          component: 'API Authentication',
          category: 'authentication',
          issue: 'JWT secret is too short (<32 characters)',
          severity: 'critical',
          remediation: 'Use a cryptographically secure random string with at least 32 characters',
          cwe: 'CWE-326',
          compliance: ['SOC2-CC6.1', 'PCI-DSS-8.2.1'],
          autoRemediable: false
        }));
      }

      // 2. Check for hardcoded secrets in environment
      const suspiciousKeys = ['password', 'secret', 'key', 'token', 'api_key'];
      for (const [key, value] of Object.entries(env)) {
        const lowerKey = key.toLowerCase();
        if (suspiciousKeys.some(sk => lowerKey.includes(sk))) {
          if (value === 'changeme' || value === 'secret' || value === '123456') {
            issues.push(this.createIssue({
              component: 'API Configuration',
              category: 'authentication',
              issue: `Weak or default value for ${key}`,
              severity: 'critical',
              remediation: 'Generate a strong random value for this secret',
              cwe: 'CWE-798',
              compliance: ['SOC2-CC6.1'],
              autoRemediable: false
            }));
          }
        }
      }

      // 3. Check CORS configuration
      const corsOrigin = env.CORS_ORIGIN || env.ALLOWED_ORIGINS;
      if (corsOrigin === '*') {
        issues.push(this.createIssue({
          component: 'API Security',
          category: 'api',
          issue: 'CORS is configured to allow all origins (*)',
          severity: 'high',
          remediation: 'Restrict CORS to specific trusted domains',
          cwe: 'CWE-942',
          compliance: ['SOC2-CC6.6'],
          autoRemediable: false
        }));
      }

      // 4. Check if rate limiting is configured
      const rateLimitEnabled = env.RATE_LIMIT_ENABLED;
      if (!rateLimitEnabled || rateLimitEnabled === 'false') {
        issues.push(this.createIssue({
          component: 'API Security',
          category: 'api',
          issue: 'Rate limiting is not enabled',
          severity: 'high',
          remediation: 'Enable rate limiting to prevent brute force and DoS attacks',
          cwe: 'CWE-307',
          compliance: ['SOC2-CC6.6'],
          autoRemediable: true
        }));
      }

      // 5. Check session configuration
      const sessionSecret = env.SESSION_SECRET;
      if (!sessionSecret || sessionSecret.length < 32) {
        issues.push(this.createIssue({
          component: 'Session Management',
          category: 'authentication',
          issue: 'Session secret is missing or too short',
          severity: 'critical',
          remediation: 'Generate a strong session secret with at least 32 random characters',
          cwe: 'CWE-330',
          compliance: ['SOC2-CC6.1'],
          autoRemediable: false
        }));
      }

      // 6. Check if HTTPS is enforced
      const nodeEnv = env.NODE_ENV;
      const forceHttps = env.FORCE_HTTPS;
      if (nodeEnv === 'production' && (!forceHttps || forceHttps === 'false')) {
        issues.push(this.createIssue({
          component: 'API Security',
          category: 'network',
          issue: 'HTTPS is not enforced in production',
          severity: 'critical',
          remediation: 'Set FORCE_HTTPS=true to redirect all HTTP traffic to HTTPS',
          cwe: 'CWE-319',
          compliance: ['SOC2-CC6.7', 'PCI-DSS-4.1'],
          autoRemediable: true
        }));
      }

    } catch (error) {
      this.emit('config:scan_error', { component: 'api', error });
    }

    return issues;
  }

  /**
   * Scan infrastructure configuration (AWS, Redis, S3, etc.)
   */
  async scanInfrastructure(): Promise<ConfigIssue[]> {
    const issues: ConfigIssue[] = [];

    try {
      const envContent = await fs.readFile(path.join(process.cwd(), '.env'), 'utf-8');
      const env = this.parseEnv(envContent);

      // 1. Check Redis configuration
      const redisPassword = env.REDIS_PASSWORD;
      if (!redisPassword) {
        issues.push(this.createIssue({
          component: 'Redis Cache',
          category: 'infrastructure',
          issue: 'Redis is not password protected',
          severity: 'high',
          remediation: 'Set a strong password for Redis using REDIS_PASSWORD environment variable',
          cwe: 'CWE-306',
          compliance: ['SOC2-CC6.1'],
          autoRemediable: false
        }));
      }

      const redisTls = env.REDIS_TLS || env.REDIS_SSL;
      if (!redisTls || redisTls === 'false') {
        issues.push(this.createIssue({
          component: 'Redis Cache',
          category: 'infrastructure',
          issue: 'Redis connections are not using TLS encryption',
          severity: 'high',
          remediation: 'Enable TLS for Redis connections',
          cwe: 'CWE-319',
          compliance: ['SOC2-CC6.7', 'PCI-DSS-4.1'],
          autoRemediable: false
        }));
      }

      // 2. Check S3 bucket configuration
      const s3BucketName = env.S3_BUCKET_NAME || env.AWS_S3_BUCKET;
      if (s3BucketName) {
        // Check if bucket encryption is enabled (this would require AWS SDK call in production)
        issues.push(this.createIssue({
          component: 'S3 Storage',
          category: 'infrastructure',
          issue: 'Verify S3 bucket encryption is enabled',
          severity: 'high',
          remediation: 'Enable default encryption (AES-256 or KMS) on S3 bucket',
          cwe: 'CWE-311',
          compliance: ['SOC2-CC6.7', 'PCI-DSS-3.4'],
          autoRemediable: false
        }));

        issues.push(this.createIssue({
          component: 'S3 Storage',
          category: 'infrastructure',
          issue: 'Verify S3 bucket public access is blocked',
          severity: 'critical',
          remediation: 'Block all public access to S3 bucket unless explicitly required',
          cwe: 'CWE-668',
          compliance: ['SOC2-CC6.6'],
          autoRemediable: false
        }));
      }

      // 3. Check AWS credentials
      const awsAccessKey = env.AWS_ACCESS_KEY_ID;
      const awsSecretKey = env.AWS_SECRET_ACCESS_KEY;
      if (awsAccessKey && awsSecretKey) {
        // Check if using IAM roles instead (best practice for EC2/ECS)
        issues.push(this.createIssue({
          component: 'AWS Configuration',
          category: 'infrastructure',
          issue: 'Using hardcoded AWS credentials instead of IAM roles',
          severity: 'medium',
          remediation: 'Use IAM roles for EC2/ECS instances instead of hardcoded credentials',
          cwe: 'CWE-798',
          compliance: ['SOC2-CC6.2'],
          autoRemediable: false
        }));
      }

      // 4. Check logging configuration
      const logLevel = env.LOG_LEVEL;
      if (logLevel === 'debug' && env.NODE_ENV === 'production') {
        issues.push(this.createIssue({
          component: 'Logging',
          category: 'infrastructure',
          issue: 'Debug logging is enabled in production',
          severity: 'medium',
          remediation: 'Set LOG_LEVEL=info or LOG_LEVEL=warn in production to avoid sensitive data leakage',
          cwe: 'CWE-532',
          compliance: ['SOC2-CC7.2'],
          autoRemediable: true
        }));
      }

      // 5. Check email configuration
      const smtpPassword = env.SMTP_PASSWORD;
      if (smtpPassword && smtpPassword.length < 8) {
        issues.push(this.createIssue({
          component: 'Email Service',
          category: 'infrastructure',
          issue: 'SMTP password is weak',
          severity: 'medium',
          remediation: 'Use a strong SMTP password with at least 12 characters',
          cwe: 'CWE-521',
          compliance: ['SOC2-CC6.1'],
          autoRemediable: false
        }));
      }

    } catch (error) {
      this.emit('config:scan_error', { component: 'infrastructure', error });
    }

    return issues;
  }

  /**
   * Auto-remediate configuration issues
   */
  async autoRemediate(issueId: string): Promise<boolean> {
    const issue = this.issues.find(i => i.id === issueId);

    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    if (!issue.autoRemediable) {
      throw new Error(`Issue ${issueId} cannot be auto-remediated`);
    }

    try {
      this.emit('config:remediation_started', issue);
      issue.status = 'in_progress';

      // Apply remediation based on issue
      if (issue.issue.includes('Rate limiting is not enabled')) {
        await this.enableRateLimiting();
      } else if (issue.issue.includes('HTTPS is not enforced')) {
        await this.enforceHttps();
      } else if (issue.issue.includes('Debug logging is enabled in production')) {
        await this.setProductionLogLevel();
      }

      issue.status = 'resolved';
      issue.resolvedAt = new Date();
      this.emit('config:remediation_complete', issue);

      return true;
    } catch (error) {
      issue.status = 'open';
      this.emit('config:remediation_failed', { issue, error });
      return false;
    }
  }

  /**
   * Enable rate limiting
   */
  private async enableRateLimiting(): Promise<void> {
    await this.updateEnvVariable('RATE_LIMIT_ENABLED', 'true');
    await this.updateEnvVariable('RATE_LIMIT_WINDOW_MS', '900000'); // 15 minutes
    await this.updateEnvVariable('RATE_LIMIT_MAX_REQUESTS', '100');
  }

  /**
   * Enforce HTTPS
   */
  private async enforceHttps(): Promise<void> {
    await this.updateEnvVariable('FORCE_HTTPS', 'true');
  }

  /**
   * Set production log level
   */
  private async setProductionLogLevel(): Promise<void> {
    await this.updateEnvVariable('LOG_LEVEL', 'info');
  }

  /**
   * Update environment variable in .env file
   */
  private async updateEnvVariable(key: string, value: string): Promise<void> {
    const envPath = path.join(process.cwd(), '.env');
    let envContent = await fs.readFile(envPath, 'utf-8');

    const regex = new RegExp(`^${key}=.*$`, 'm');

    if (regex.test(envContent)) {
      // Update existing variable
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // Add new variable
      envContent += `\n${key}=${value}\n`;
    }

    await fs.writeFile(envPath, envContent, 'utf-8');
  }

  /**
   * Parse .env file content
   */
  private parseEnv(content: string): Record<string, string> {
    const env: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key) {
          env[key] = value;
        }
      }
    }

    return env;
  }

  /**
   * Create configuration issue
   */
  private createIssue(params: Omit<ConfigIssue, 'id' | 'detectedAt' | 'status'>): ConfigIssue {
    return {
      id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      detectedAt: new Date(),
      status: 'open',
      ...params
    };
  }

  /**
   * Get all issues
   */
  getIssues(): ConfigIssue[] {
    return this.issues;
  }

  /**
   * Get issues by severity
   */
  getIssuesBySeverity(severity: ConfigIssue['severity']): ConfigIssue[] {
    return this.issues.filter(i => i.severity === severity);
  }

  /**
   * Get issues by status
   */
  getIssuesByStatus(status: ConfigIssue['status']): ConfigIssue[] {
    return this.issues.filter(i => i.status === status);
  }

  /**
   * Get issues by component
   */
  getIssuesByComponent(component: string): ConfigIssue[] {
    return this.issues.filter(i => i.component === component);
  }

  /**
   * Mark issue as accepted (won't fix)
   */
  acceptIssue(issueId: string, reason: string): void {
    const issue = this.issues.find(i => i.id === issueId);
    if (issue) {
      issue.status = 'accepted';
      this.emit('config:issue_accepted', { issue, reason });
    }
  }

  /**
   * Get scan history
   */
  getScanHistory(): ScanResult[] {
    return this.scanHistory;
  }

  /**
   * Get configuration drift (issues that reappear after being resolved)
   */
  getConfigurationDrift(): ConfigIssue[] {
    // Find issues that were resolved but have reappeared
    return this.issues.filter(issue => {
      if (issue.status !== 'open') return false;

      // Check if similar issue was previously resolved
      const previouslyResolved = this.scanHistory.some(scan =>
        scan.issues.some(prevIssue =>
          prevIssue.component === issue.component &&
          prevIssue.issue === issue.issue &&
          prevIssue.status === 'resolved' &&
          prevIssue.resolvedAt &&
          prevIssue.resolvedAt < issue.detectedAt
        )
      );

      return previouslyResolved;
    });
  }

  /**
   * Get compliance violations
   */
  getComplianceViolations(framework: string): ConfigIssue[] {
    return this.issues.filter(issue =>
      issue.compliance?.some(c => c.startsWith(framework))
    );
  }
}
