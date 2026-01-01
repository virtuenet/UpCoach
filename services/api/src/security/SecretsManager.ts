import {
  SecretsManagerClient,
  CreateSecretCommand,
  GetSecretValueCommand,
  UpdateSecretCommand,
  DeleteSecretCommand,
  RotateSecretCommand,
  ListSecretsCommand,
  DescribeSecretCommand,
  PutSecretValueCommand,
  RestoreSecretCommand
} from '@aws-sdk/client-secrets-manager';
import Vault from 'node-vault';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

/**
 * Secrets Manager Service
 *
 * Comprehensive secrets and credentials management:
 * - AWS Secrets Manager integration
 * - HashiCorp Vault integration
 * - Automatic secret rotation
 * - Access control and audit logging
 * - Secret scanning and detection
 * - Emergency access (break-glass)
 */

interface SecretsConfig {
  provider: 'aws' | 'vault' | 'both';
  awsRegion?: string;
  vaultUrl?: string;
  vaultToken?: string;
  rotationSchedule?: {
    default: number;
    apiKeys: number;
    dbCredentials: number;
    certificates: number;
  };
  enableScanning: boolean;
  enableAudit: boolean;
}

interface Secret {
  id: string;
  name: string;
  type: 'api-key' | 'db-credentials' | 'oauth-token' | 'ssh-key' | 'certificate' | 'encryption-key' | 'generic';
  value: string;
  description?: string;
  environment: 'dev' | 'staging' | 'prod' | 'all';
  tags: Record<string, string>;
  version: number;
  created: Date;
  updated: Date;
  lastRotated?: Date;
  nextRotation?: Date;
  rotationEnabled: boolean;
  rotationDays: number;
  metadata: SecretMetadata;
}

interface SecretMetadata {
  createdBy: string;
  ownedBy: string;
  expiresAt?: Date;
  provider: 'aws' | 'vault' | 'local';
  encrypted: boolean;
  accessCount: number;
  lastAccessed?: Date;
  lastAccessedBy?: string;
}

interface SecretVersion {
  version: number;
  value: string;
  createdAt: Date;
  createdBy: string;
  active: boolean;
}

interface AccessPolicy {
  secretId: string;
  allowedUsers: string[];
  allowedRoles: string[];
  allowedServices: string[];
  allowedIPs?: string[];
  timeRestriction?: {
    startHour: number;
    endHour: number;
  };
  maxAccessCount?: number;
  expiresAt?: Date;
}

interface AuditLog {
  id: string;
  secretId: string;
  secretName: string;
  action: 'created' | 'read' | 'updated' | 'rotated' | 'deleted' | 'restored';
  userId: string;
  userRole?: string;
  success: boolean;
  errorMessage?: string;
  metadata: {
    ip: string;
    userAgent?: string;
    location?: string;
  };
  timestamp: Date;
}

interface RotationConfig {
  secretId: string;
  enabled: boolean;
  rotationDays: number;
  nextRotation: Date;
  lambdaArn?: string;
  rotationFunction?: (secret: Secret) => Promise<string>;
  notifyBefore: number[];
  testBeforeActivate: boolean;
}

interface SecretScanResult {
  found: boolean;
  matches: SecretMatch[];
  file?: string;
  line?: number;
  timestamp: Date;
}

interface SecretMatch {
  type: string;
  pattern: string;
  value: string;
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface BreakGlassRequest {
  id: string;
  secretId: string;
  requestedBy: string;
  justification: string;
  approvedBy?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expiresAt: Date;
  accessGrantedAt?: Date;
  accessRevokedAt?: Date;
}

interface SecretsMetrics {
  totalSecrets: number;
  activeSecrets: number;
  expiredSecrets: number;
  rotationsThisMonth: number;
  failedRotations: number;
  accessCount: number;
  violationCount: number;
  scanResults: number;
}

export class SecretsManager extends EventEmitter {
  private config: SecretsConfig;
  private awsClient: SecretsManagerClient | null = null;
  private vaultClient: any = null;
  private secrets: Map<string, Secret> = new Map();
  private secretVersions: Map<string, SecretVersion[]> = new Map();
  private accessPolicies: Map<string, AccessPolicy> = new Map();
  private auditLogs: AuditLog[] = [];
  private rotationConfigs: Map<string, RotationConfig> = new Map();
  private rotationTimers: Map<string, NodeJS.Timeout> = new Map();
  private breakGlassRequests: Map<string, BreakGlassRequest> = new Map();
  private metrics: SecretsMetrics;

  // Secret detection patterns
  private readonly secretPatterns: Record<string, { pattern: RegExp; severity: SecretMatch['severity'] }> = {
    awsAccessKey: {
      pattern: /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g,
      severity: 'critical'
    },
    awsSecretKey: {
      pattern: /\b[A-Za-z0-9/+=]{40}\b/g,
      severity: 'critical'
    },
    githubToken: {
      pattern: /\bghp_[A-Za-z0-9]{36}\b/g,
      severity: 'critical'
    },
    githubOAuth: {
      pattern: /\bgho_[A-Za-z0-9]{36}\b/g,
      severity: 'critical'
    },
    slackToken: {
      pattern: /\bxox[baprs]-[0-9]{10,13}-[A-Za-z0-9]{24,}\b/g,
      severity: 'high'
    },
    slackWebhook: {
      pattern: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/g,
      severity: 'high'
    },
    stripeKey: {
      pattern: /\b(sk|pk)_(live|test)_[A-Za-z0-9]{24,}\b/g,
      severity: 'critical'
    },
    twilioKey: {
      pattern: /\bSK[a-z0-9]{32}\b/g,
      severity: 'high'
    },
    sendgridKey: {
      pattern: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g,
      severity: 'high'
    },
    privateKey: {
      pattern: /-----BEGIN\s+(RSA|EC|OPENSSH|DSA|PGP)\s+PRIVATE\s+KEY-----/g,
      severity: 'critical'
    },
    jwt: {
      pattern: /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\b/g,
      severity: 'medium'
    },
    genericApiKey: {
      pattern: /\b(api[_-]?key|apikey|api[_-]?secret)\s*[=:]\s*['"][A-Za-z0-9_-]{20,}['"]/gi,
      severity: 'high'
    },
    passwordInCode: {
      pattern: /\b(password|passwd|pwd)\s*[=:]\s*['"][^'"]{8,}['"]/gi,
      severity: 'high'
    },
    databaseUrl: {
      pattern: /(postgres|mysql|mongodb):\/\/[^:]+:[^@]+@[^\s]+/g,
      severity: 'critical'
    },
    googleApiKey: {
      pattern: /\bAIza[A-Za-z0-9_-]{35}\b/g,
      severity: 'high'
    },
    googleOAuth: {
      pattern: /[0-9]+-[A-Za-z0-9_-]{32}\.apps\.googleusercontent\.com/g,
      severity: 'high'
    }
  };

  constructor(config: Partial<SecretsConfig> = {}) {
    super();

    this.config = {
      provider: 'aws',
      awsRegion: 'us-east-1',
      rotationSchedule: {
        default: 90,
        apiKeys: 30,
        dbCredentials: 60,
        certificates: 365
      },
      enableScanning: true,
      enableAudit: true,
      ...config
    };

    this.metrics = {
      totalSecrets: 0,
      activeSecrets: 0,
      expiredSecrets: 0,
      rotationsThisMonth: 0,
      failedRotations: 0,
      accessCount: 0,
      violationCount: 0,
      scanResults: 0
    };

    this.initializeClients();
  }

  /**
   * Initialize secret storage clients
   */
  private initializeClients(): void {
    if (this.config.provider === 'aws' || this.config.provider === 'both') {
      this.awsClient = new SecretsManagerClient({
        region: this.config.awsRegion,
        maxAttempts: 3
      });
    }

    if (this.config.provider === 'vault' || this.config.provider === 'both') {
      if (this.config.vaultUrl && this.config.vaultToken) {
        this.vaultClient = Vault({
          apiVersion: 'v1',
          endpoint: this.config.vaultUrl,
          token: this.config.vaultToken
        });
      }
    }
  }

  /**
   * Secret Storage
   */

  /**
   * Create a new secret
   */
  async createSecret(
    name: string,
    value: string,
    type: Secret['type'],
    environment: Secret['environment'],
    options: {
      description?: string;
      tags?: Record<string, string>;
      rotationDays?: number;
      createdBy: string;
    }
  ): Promise<Secret> {
    const secretId = this.generateSecretId();

    // Encrypt value
    const encryptedValue = this.encryptValue(value);

    const secret: Secret = {
      id: secretId,
      name,
      type,
      value: encryptedValue,
      description: options.description,
      environment,
      tags: options.tags || {},
      version: 1,
      created: new Date(),
      updated: new Date(),
      rotationEnabled: true,
      rotationDays: options.rotationDays || this.getDefaultRotationDays(type),
      metadata: {
        createdBy: options.createdBy,
        ownedBy: options.createdBy,
        provider: this.config.provider === 'both' ? 'aws' : this.config.provider,
        encrypted: true,
        accessCount: 0
      }
    };

    // Store in AWS Secrets Manager
    if (this.awsClient && (this.config.provider === 'aws' || this.config.provider === 'both')) {
      try {
        const command = new CreateSecretCommand({
          Name: `${environment}/${name}`,
          Description: options.description,
          SecretString: value,
          Tags: Object.entries(options.tags || {}).map(([Key, Value]) => ({ Key, Value }))
        });

        const response = await this.awsClient.send(command);
        secret.metadata.provider = 'aws';
      } catch (error) {
        console.error('Failed to create secret in AWS:', error);
        throw error;
      }
    }

    // Store in HashiCorp Vault
    if (this.vaultClient && (this.config.provider === 'vault' || this.config.provider === 'both')) {
      try {
        await this.vaultClient.write(`secret/data/${environment}/${name}`, {
          data: {
            value,
            metadata: secret.metadata
          }
        });
        secret.metadata.provider = 'vault';
      } catch (error) {
        console.error('Failed to create secret in Vault:', error);
      }
    }

    // Store locally
    this.secrets.set(secretId, secret);

    // Initialize version history
    this.secretVersions.set(secretId, [{
      version: 1,
      value: encryptedValue,
      createdAt: new Date(),
      createdBy: options.createdBy,
      active: true
    }]);

    // Setup rotation
    this.setupRotation(secretId);

    // Audit log
    this.logAccess({
      secretId,
      secretName: name,
      action: 'created',
      userId: options.createdBy,
      success: true,
      metadata: {
        ip: 'system',
        location: environment
      },
      timestamp: new Date()
    });

    this.metrics.totalSecrets++;
    this.metrics.activeSecrets++;

    this.emit('secret-created', secret);

    return secret;
  }

  /**
   * Get secret value
   */
  async getSecret(
    secretId: string,
    userId: string,
    context: {
      ip: string;
      userRole?: string;
    }
  ): Promise<string> {
    const secret = this.secrets.get(secretId);
    if (!secret) {
      throw new Error('Secret not found');
    }

    // Check access policy
    const hasAccess = await this.checkAccess(secretId, userId, context);
    if (!hasAccess) {
      this.logAccess({
        secretId,
        secretName: secret.name,
        action: 'read',
        userId,
        userRole: context.userRole,
        success: false,
        errorMessage: 'Access denied',
        metadata: context,
        timestamp: new Date()
      });

      this.metrics.violationCount++;
      throw new Error('Access denied');
    }

    // Fetch from provider
    let value = secret.value;

    if (secret.metadata.provider === 'aws' && this.awsClient) {
      try {
        const command = new GetSecretValueCommand({
          SecretId: `${secret.environment}/${secret.name}`
        });

        const response = await this.awsClient.send(command);
        value = response.SecretString || secret.value;
      } catch (error) {
        console.error('Failed to get secret from AWS:', error);
      }
    }

    if (secret.metadata.provider === 'vault' && this.vaultClient) {
      try {
        const response = await this.vaultClient.read(`secret/data/${secret.environment}/${secret.name}`);
        value = response.data.data.value;
      } catch (error) {
        console.error('Failed to get secret from Vault:', error);
      }
    }

    // Decrypt value
    const decryptedValue = this.decryptValue(value);

    // Update access metadata
    secret.metadata.accessCount++;
    secret.metadata.lastAccessed = new Date();
    secret.metadata.lastAccessedBy = userId;

    // Audit log
    this.logAccess({
      secretId,
      secretName: secret.name,
      action: 'read',
      userId,
      userRole: context.userRole,
      success: true,
      metadata: context,
      timestamp: new Date()
    });

    this.metrics.accessCount++;

    return decryptedValue;
  }

  /**
   * Update secret value
   */
  async updateSecret(
    secretId: string,
    newValue: string,
    userId: string
  ): Promise<Secret> {
    const secret = this.secrets.get(secretId);
    if (!secret) {
      throw new Error('Secret not found');
    }

    // Encrypt new value
    const encryptedValue = this.encryptValue(newValue);

    // Update in AWS
    if (secret.metadata.provider === 'aws' && this.awsClient) {
      const command = new PutSecretValueCommand({
        SecretId: `${secret.environment}/${secret.name}`,
        SecretString: newValue
      });

      await this.awsClient.send(command);
    }

    // Update in Vault
    if (secret.metadata.provider === 'vault' && this.vaultClient) {
      await this.vaultClient.write(`secret/data/${secret.environment}/${secret.name}`, {
        data: {
          value: newValue,
          metadata: secret.metadata
        }
      });
    }

    // Archive current version
    const versions = this.secretVersions.get(secretId) || [];
    versions.forEach(v => v.active = false);

    // Add new version
    secret.version++;
    versions.push({
      version: secret.version,
      value: encryptedValue,
      createdAt: new Date(),
      createdBy: userId,
      active: true
    });

    this.secretVersions.set(secretId, versions);

    secret.value = encryptedValue;
    secret.updated = new Date();

    // Audit log
    this.logAccess({
      secretId,
      secretName: secret.name,
      action: 'updated',
      userId,
      success: true,
      metadata: { ip: 'system' },
      timestamp: new Date()
    });

    this.emit('secret-updated', secret);

    return secret;
  }

  /**
   * Delete secret
   */
  async deleteSecret(secretId: string, userId: string): Promise<void> {
    const secret = this.secrets.get(secretId);
    if (!secret) {
      throw new Error('Secret not found');
    }

    // Delete from AWS (schedule deletion)
    if (secret.metadata.provider === 'aws' && this.awsClient) {
      const command = new DeleteSecretCommand({
        SecretId: `${secret.environment}/${secret.name}`,
        RecoveryWindowInDays: 7 // Can be recovered within 7 days
      });

      await this.awsClient.send(command);
    }

    // Delete from Vault
    if (secret.metadata.provider === 'vault' && this.vaultClient) {
      await this.vaultClient.delete(`secret/data/${secret.environment}/${secret.name}`);
    }

    // Remove locally
    this.secrets.delete(secretId);
    this.secretVersions.delete(secretId);

    // Clear rotation timer
    const timer = this.rotationTimers.get(secretId);
    if (timer) {
      clearTimeout(timer);
      this.rotationTimers.delete(secretId);
    }

    // Audit log
    this.logAccess({
      secretId,
      secretName: secret.name,
      action: 'deleted',
      userId,
      success: true,
      metadata: { ip: 'system' },
      timestamp: new Date()
    });

    this.metrics.activeSecrets--;

    this.emit('secret-deleted', { secretId, secretName: secret.name });
  }

  /**
   * Secret Rotation
   */

  /**
   * Setup automatic rotation
   */
  private setupRotation(secretId: string): void {
    const secret = this.secrets.get(secretId);
    if (!secret || !secret.rotationEnabled) {
      return;
    }

    const rotationConfig: RotationConfig = {
      secretId,
      enabled: true,
      rotationDays: secret.rotationDays,
      nextRotation: new Date(Date.now() + secret.rotationDays * 24 * 60 * 60 * 1000),
      notifyBefore: [7, 1, 0], // days before rotation
      testBeforeActivate: true
    };

    this.rotationConfigs.set(secretId, rotationConfig);

    // Schedule rotation
    const timeUntilRotation = secret.rotationDays * 24 * 60 * 60 * 1000;
    const timer = setTimeout(() => {
      this.rotateSecret(secretId, 'system');
    }, timeUntilRotation);

    this.rotationTimers.set(secretId, timer);

    // Schedule notifications
    rotationConfig.notifyBefore.forEach(days => {
      const notifyTime = timeUntilRotation - (days * 24 * 60 * 60 * 1000);
      if (notifyTime > 0) {
        setTimeout(() => {
          this.emit('rotation-reminder', {
            secretId,
            secretName: secret.name,
            daysUntilRotation: days
          });
        }, notifyTime);
      }
    });
  }

  /**
   * Rotate secret
   */
  async rotateSecret(secretId: string, userId: string): Promise<Secret> {
    const secret = this.secrets.get(secretId);
    if (!secret) {
      throw new Error('Secret not found');
    }

    const rotationConfig = this.rotationConfigs.get(secretId);

    try {
      let newValue: string;

      // Use custom rotation function if provided
      if (rotationConfig?.rotationFunction) {
        newValue = await rotationConfig.rotationFunction(secret);
      } else {
        // Default rotation: generate new random value
        newValue = this.generateSecretValue(secret.type);
      }

      // Test new secret if required
      if (rotationConfig?.testBeforeActivate) {
        const testResult = await this.testSecret(secret, newValue);
        if (!testResult) {
          throw new Error('New secret failed validation test');
        }
      }

      // Update secret with new value
      await this.updateSecret(secretId, newValue, userId);

      // Update rotation metadata
      secret.lastRotated = new Date();
      secret.nextRotation = new Date(Date.now() + secret.rotationDays * 24 * 60 * 60 * 1000);

      if (rotationConfig) {
        rotationConfig.nextRotation = secret.nextRotation;
      }

      // Reschedule next rotation
      this.setupRotation(secretId);

      // Audit log
      this.logAccess({
        secretId,
        secretName: secret.name,
        action: 'rotated',
        userId,
        success: true,
        metadata: { ip: 'system' },
        timestamp: new Date()
      });

      this.metrics.rotationsThisMonth++;

      this.emit('secret-rotated', secret);

      return secret;
    } catch (error) {
      this.metrics.failedRotations++;

      this.logAccess({
        secretId,
        secretName: secret.name,
        action: 'rotated',
        userId,
        success: false,
        errorMessage: String(error),
        metadata: { ip: 'system' },
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Test secret validity
   */
  private async testSecret(secret: Secret, newValue: string): Promise<boolean> {
    // Implement type-specific validation
    switch (secret.type) {
      case 'api-key':
        // Test API key by making a test request
        return newValue.length >= 32;

      case 'db-credentials':
        // Test database connection
        // Would integrate with database client
        return true;

      case 'oauth-token':
        // Validate token format
        return /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(newValue);

      case 'ssh-key':
        // Validate SSH key format
        return newValue.includes('-----BEGIN') && newValue.includes('PRIVATE KEY-----');

      default:
        return true;
    }
  }

  /**
   * Generate new secret value based on type
   */
  private generateSecretValue(type: Secret['type']): string {
    switch (type) {
      case 'api-key':
        return crypto.randomBytes(32).toString('hex');

      case 'db-credentials':
        return JSON.stringify({
          username: 'user_' + crypto.randomBytes(8).toString('hex'),
          password: this.generateStrongPassword()
        });

      case 'oauth-token':
        // Generate JWT-like token
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 3600000 })).toString('base64url');
        const signature = crypto.randomBytes(32).toString('base64url');
        return `${header}.${payload}.${signature}`;

      case 'encryption-key':
        return crypto.randomBytes(32).toString('base64');

      default:
        return crypto.randomBytes(32).toString('hex');
    }
  }

  /**
   * Generate strong password
   */
  private generateStrongPassword(): string {
    const length = 32;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';

    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      password += charset[bytes[i] % charset.length];
    }

    return password;
  }

  /**
   * Access Control
   */

  /**
   * Add access policy
   */
  addAccessPolicy(policy: AccessPolicy): void {
    this.accessPolicies.set(policy.secretId, policy);
    this.emit('policy-added', policy);
  }

  /**
   * Check access permissions
   */
  private async checkAccess(
    secretId: string,
    userId: string,
    context: { ip: string; userRole?: string }
  ): Promise<boolean> {
    const policy = this.accessPolicies.get(secretId);

    // No policy means open access (in production, default should be deny)
    if (!policy) {
      return true;
    }

    // Check user
    if (policy.allowedUsers.length > 0 && !policy.allowedUsers.includes(userId)) {
      return false;
    }

    // Check role
    if (context.userRole && policy.allowedRoles.length > 0 && !policy.allowedRoles.includes(context.userRole)) {
      return false;
    }

    // Check IP whitelist
    if (policy.allowedIPs && policy.allowedIPs.length > 0 && !policy.allowedIPs.includes(context.ip)) {
      return false;
    }

    // Check time restriction
    if (policy.timeRestriction) {
      const hour = new Date().getHours();
      if (hour < policy.timeRestriction.startHour || hour > policy.timeRestriction.endHour) {
        return false;
      }
    }

    // Check expiration
    if (policy.expiresAt && new Date() > policy.expiresAt) {
      return false;
    }

    // Check max access count
    const secret = this.secrets.get(secretId);
    if (policy.maxAccessCount && secret && secret.metadata.accessCount >= policy.maxAccessCount) {
      return false;
    }

    return true;
  }

  /**
   * Secret Scanning
   */

  /**
   * Scan text for secrets
   */
  scanForSecrets(text: string, context?: { file?: string; line?: number }): SecretScanResult {
    const matches: SecretMatch[] = [];

    for (const [type, { pattern, severity }] of Object.entries(this.secretPatterns)) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;

      while ((match = regex.exec(text)) !== null) {
        const value = match[0];
        const confidence = this.calculateSecretConfidence(type, value);

        if (confidence >= 0.5) {
          matches.push({
            type,
            pattern: pattern.source,
            value,
            confidence,
            severity
          });
        }
      }
    }

    const result: SecretScanResult = {
      found: matches.length > 0,
      matches,
      file: context?.file,
      line: context?.line,
      timestamp: new Date()
    };

    if (result.found) {
      this.metrics.scanResults++;
      this.emit('secrets-found', result);
    }

    return result;
  }

  /**
   * Calculate confidence for secret detection
   */
  private calculateSecretConfidence(type: string, value: string): number {
    const baseConfidence: Record<string, number> = {
      awsAccessKey: 0.95,
      awsSecretKey: 0.7,
      githubToken: 0.95,
      slackToken: 0.9,
      stripeKey: 0.95,
      privateKey: 0.99,
      jwt: 0.6,
      genericApiKey: 0.5
    };

    let confidence = baseConfidence[type] || 0.5;

    // Adjust based on entropy
    const entropy = this.calculateEntropy(value);
    if (entropy < 3.0) {
      confidence *= 0.5;
    }

    // Check for common test patterns
    const testPatterns = ['test', 'example', 'dummy', 'fake', 'sample', 'xxxxx'];
    for (const pattern of testPatterns) {
      if (value.toLowerCase().includes(pattern)) {
        confidence *= 0.3;
      }
    }

    return confidence;
  }

  /**
   * Calculate Shannon entropy
   */
  private calculateEntropy(str: string): number {
    const freq: Record<string, number> = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    for (const count of Object.values(freq)) {
      const p = count / str.length;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Scan git commits for secrets
   */
  async scanGitCommit(commitHash: string, diff: string): Promise<SecretScanResult[]> {
    const results: SecretScanResult[] = [];
    const lines = diff.split('\n');

    lines.forEach((line, index) => {
      // Only scan added lines
      if (line.startsWith('+') && !line.startsWith('+++')) {
        const scanResult = this.scanForSecrets(line.slice(1), {
          file: commitHash,
          line: index + 1
        });

        if (scanResult.found) {
          results.push(scanResult);
        }
      }
    });

    return results;
  }

  /**
   * Emergency Access (Break-Glass)
   */

  /**
   * Request emergency access
   */
  requestBreakGlass(
    secretId: string,
    userId: string,
    justification: string
  ): BreakGlassRequest {
    const request: BreakGlassRequest = {
      id: this.generateId(),
      secretId,
      requestedBy: userId,
      justification,
      status: 'pending',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour to approve
    };

    this.breakGlassRequests.set(request.id, request);

    this.emit('break-glass-requested', request);

    return request;
  }

  /**
   * Approve emergency access
   */
  approveBreakGlass(
    requestId: string,
    approverId: string,
    approverRole: string
  ): BreakGlassRequest {
    const request = this.breakGlassRequests.get(requestId);
    if (!request) {
      throw new Error('Break-glass request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request already processed');
    }

    if (new Date() > request.expiresAt) {
      request.status = 'expired';
      throw new Error('Request expired');
    }

    // Require 2-person rule: manager + security
    request.approvedBy = request.approvedBy || [];
    request.approvedBy.push(`${approverId}:${approverRole}`);

    if (request.approvedBy.length >= 2) {
      request.status = 'approved';
      request.accessGrantedAt = new Date();

      // Auto-revoke after 1 hour
      setTimeout(() => {
        this.revokeBreakGlass(requestId);
      }, 60 * 60 * 1000);

      this.emit('break-glass-approved', request);
    }

    return request;
  }

  /**
   * Revoke emergency access
   */
  revokeBreakGlass(requestId: string): void {
    const request = this.breakGlassRequests.get(requestId);
    if (request && request.status === 'approved') {
      request.accessRevokedAt = new Date();
      this.emit('break-glass-revoked', request);
    }
  }

  /**
   * Check if user has active break-glass access
   */
  hasBreakGlassAccess(secretId: string, userId: string): boolean {
    for (const request of this.breakGlassRequests.values()) {
      if (
        request.secretId === secretId &&
        request.requestedBy === userId &&
        request.status === 'approved' &&
        request.accessGrantedAt &&
        !request.accessRevokedAt
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Helper Methods
   */

  /**
   * Encrypt secret value
   */
  private encryptValue(value: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // In production, store key in KMS
    return JSON.stringify({
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      key: key.toString('base64') // Should be encrypted with KMS
    });
  }

  /**
   * Decrypt secret value
   */
  private decryptValue(encryptedData: string): string {
    try {
      const data = JSON.parse(encryptedData);
      const algorithm = 'aes-256-gcm';

      const decipher = crypto.createDecipheriv(
        algorithm,
        Buffer.from(data.key, 'base64'),
        Buffer.from(data.iv, 'base64')
      );

      decipher.setAuthTag(Buffer.from(data.authTag, 'base64'));

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(data.encrypted, 'base64')),
        decipher.final()
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      // If not encrypted (backward compatibility)
      return encryptedData;
    }
  }

  /**
   * Get default rotation days by type
   */
  private getDefaultRotationDays(type: Secret['type']): number {
    const defaults = this.config.rotationSchedule!;

    switch (type) {
      case 'api-key':
        return defaults.apiKeys;
      case 'db-credentials':
        return defaults.dbCredentials;
      case 'certificate':
        return defaults.certificates;
      default:
        return defaults.default;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate secret ID
   */
  private generateSecretId(): string {
    return `secret_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Log access
   */
  private logAccess(log: Omit<AuditLog, 'id'>): void {
    if (!this.config.enableAudit) {
      return;
    }

    const auditLog: AuditLog = {
      id: this.generateId(),
      ...log
    };

    this.auditLogs.push(auditLog);

    // Keep only last 10000 logs in memory
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }

    this.emit('audit-log', auditLog);
  }

  /**
   * Public API
   */

  /**
   * List all secrets (metadata only)
   */
  listSecrets(filters?: {
    environment?: string;
    type?: string;
    tag?: string;
  }): Omit<Secret, 'value'>[] {
    let secrets = Array.from(this.secrets.values());

    if (filters?.environment) {
      secrets = secrets.filter(s => s.environment === filters.environment || s.environment === 'all');
    }

    if (filters?.type) {
      secrets = secrets.filter(s => s.type === filters.type);
    }

    if (filters?.tag) {
      secrets = secrets.filter(s => s.tags[filters.tag] !== undefined);
    }

    // Remove sensitive value
    return secrets.map(({ value, ...metadata }) => metadata);
  }

  /**
   * Get secret metadata
   */
  getSecretMetadata(secretId: string): Omit<Secret, 'value'> | undefined {
    const secret = this.secrets.get(secretId);
    if (!secret) {
      return undefined;
    }

    const { value, ...metadata } = secret;
    return metadata;
  }

  /**
   * Get secret versions
   */
  getSecretVersions(secretId: string): Omit<SecretVersion, 'value'>[] {
    const versions = this.secretVersions.get(secretId) || [];
    return versions.map(({ value, ...metadata }) => metadata);
  }

  /**
   * Get audit logs
   */
  getAuditLogs(filters?: {
    secretId?: string;
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): AuditLog[] {
    let logs = [...this.auditLogs];

    if (filters?.secretId) {
      logs = logs.filter(l => l.secretId === filters.secretId);
    }

    if (filters?.userId) {
      logs = logs.filter(l => l.userId === filters.userId);
    }

    if (filters?.action) {
      logs = logs.filter(l => l.action === filters.action);
    }

    if (filters?.startDate) {
      logs = logs.filter(l => l.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      logs = logs.filter(l => l.timestamp <= filters.endDate!);
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get secrets expiring soon
   */
  getExpiringSecrets(days: number = 7): Secret[] {
    const threshold = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return Array.from(this.secrets.values()).filter(s =>
      s.nextRotation && s.nextRotation <= threshold
    );
  }

  /**
   * Get metrics
   */
  getMetrics(): SecretsMetrics {
    // Update expired count
    this.metrics.expiredSecrets = Array.from(this.secrets.values())
      .filter(s => s.metadata.expiresAt && new Date() > s.metadata.expiresAt)
      .length;

    return { ...this.metrics };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    aws: boolean;
    vault: boolean;
    secrets: number;
    rotations: number;
  }> {
    let awsHealthy = false;
    let vaultHealthy = false;

    // Check AWS
    if (this.awsClient) {
      try {
        const command = new ListSecretsCommand({ MaxResults: 1 });
        await this.awsClient.send(command);
        awsHealthy = true;
      } catch (error) {
        console.error('AWS health check failed:', error);
      }
    }

    // Check Vault
    if (this.vaultClient) {
      try {
        await this.vaultClient.health();
        vaultHealthy = true;
      } catch (error) {
        console.error('Vault health check failed:', error);
      }
    }

    return {
      healthy: (awsHealthy || vaultHealthy || this.secrets.size > 0),
      aws: awsHealthy,
      vault: vaultHealthy,
      secrets: this.secrets.size,
      rotations: this.rotationConfigs.size
    };
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    // Clear all rotation timers
    for (const timer of this.rotationTimers.values()) {
      clearTimeout(timer);
    }
    this.rotationTimers.clear();

    // Destroy clients
    this.awsClient?.destroy();

    this.emit('cleanup-complete');
  }
}

export default SecretsManager;
