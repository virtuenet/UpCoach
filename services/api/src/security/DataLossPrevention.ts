import * as tf from '@tensorflow/tfjs-node';
import natural from 'natural';
import { EventEmitter } from 'events';

/**
 * Data Loss Prevention (DLP) Service
 *
 * Comprehensive DLP solution with:
 * - Automatic data classification
 * - Sensitive data detection (PII, PCI, PHI, credentials)
 * - Data exfiltration detection
 * - DLP policies (block, quarantine, encrypt, redact, alert)
 * - Data monitoring and masking
 * - Compliance enforcement (GDPR, HIPAA, PCI-DSS, SOX)
 */

interface DLPConfig {
  enableMLClassification: boolean;
  enableMonitoring: boolean;
  alertThresholds: {
    uploadSize: number;
    downloadSize: number;
    bulkExport: number;
  };
  businessHours: {
    start: number;
    end: number;
  };
  allowedCountries: string[];
}

interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  confidence: number;
  reason: string;
  timestamp: Date;
  tags: string[];
}

interface SensitiveDataMatch {
  type: string;
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  pattern: string;
}

interface DLPPolicy {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: PolicyCondition[];
  actions: PolicyAction[];
  scope: {
    users?: string[];
    groups?: string[];
    dataTypes?: string[];
    locations?: string[];
  };
  created: Date;
  updated: Date;
}

interface PolicyCondition {
  type: 'dataType' | 'classification' | 'size' | 'location' | 'time' | 'user';
  operator: 'equals' | 'contains' | 'regex' | 'greaterThan' | 'lessThan';
  value: string | number | RegExp;
}

interface PolicyAction {
  type: 'block' | 'quarantine' | 'encrypt' | 'redact' | 'alert' | 'log';
  parameters?: Record<string, any>;
  notifyUsers?: string[];
}

interface DLPViolation {
  id: string;
  policyId: string;
  policyName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  action: string;
  dataType: string;
  detectedData: SensitiveDataMatch[];
  actionsTaken: string[];
  timestamp: Date;
  location: {
    ip: string;
    country: string;
    city?: string;
  };
  metadata: Record<string, any>;
}

interface ExfiltrationAlert {
  id: string;
  userId: string;
  type: 'unusual_upload' | 'unusual_download' | 'large_transfer' | 'bulk_export' | 'unusual_location' | 'off_hours' | 'impossible_travel';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  metrics: {
    baseline?: number;
    current: number;
    threshold: number;
  };
  timestamp: Date;
  blocked: boolean;
}

interface DataMaskingRule {
  field: string;
  maskType: 'partial' | 'full' | 'tokenize' | 'hash' | 'fpe';
  preserveFormat: boolean;
  visibleChars?: number;
  authorizedRoles?: string[];
}

interface QuarantineItem {
  id: string;
  type: 'file' | 'message' | 'record';
  content: string;
  detectedIssues: SensitiveDataMatch[];
  userId: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
}

interface DLPMetrics {
  totalScans: number;
  violationsDetected: number;
  violationsBlocked: number;
  dataClassified: number;
  quarantineItems: number;
  falsePositives: number;
  averageScanTime: number;
}

export class DataLossPrevention extends EventEmitter {
  private config: DLPConfig;
  private policies: Map<string, DLPPolicy> = new Map();
  private violations: Map<string, DLPViolation> = new Map();
  private quarantine: Map<string, QuarantineItem> = new Map();
  private maskingRules: Map<string, DataMaskingRule> = new Map();
  private userBaselines: Map<string, UserBaseline> = new Map();
  private metrics: DLPMetrics;
  private mlModel: tf.LayersModel | null = null;
  private tokenizer: natural.WordTokenizer;
  private tfidf: natural.TfIdf;

  // Comprehensive regex patterns for sensitive data
  private readonly patterns = {
    // PII Patterns
    ssn: /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/g,
    ssnStrict: /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
    passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
    driversLicense: /\b[A-Z]{1,2}\d{5,8}\b/g,
    phone: /\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

    // PCI Patterns
    creditCard: /\b(?:4\d{3}|5[1-5]\d{2}|6011|3[47]\d{2})[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    cvv: /\b\d{3,4}\b/g,
    bankAccount: /\b\d{8,17}\b/g,
    routingNumber: /\b\d{9}\b/g,

    // PHI Patterns
    medicalRecord: /\b(MRN|MR#|Medical\s+Record)\s*:?\s*\d{6,10}\b/gi,
    icd10: /\b[A-TV-Z]\d{2}(\.\d{1,4})?\b/g,
    npi: /\b\d{10}\b/g,

    // Credentials
    apiKey: /\b[A-Za-z0-9_-]{32,}\b/g,
    awsAccessKey: /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g,
    awsSecretKey: /\b[A-Za-z0-9/+=]{40}\b/g,
    githubToken: /\bghp_[A-Za-z0-9]{36}\b/g,
    slackToken: /\bxox[baprs]-[0-9]{10,13}-[A-Za-z0-9]{24,}\b/g,
    stripeKey: /\b(sk|pk)_(live|test)_[A-Za-z0-9]{24,}\b/g,
    privateKey: /-----BEGIN\s+(RSA|EC|OPENSSH|DSA)\s+PRIVATE\s+KEY-----/g,
    password: /\b(password|passwd|pwd)\s*[=:]\s*['"][^'"]{8,}['"]/gi,
    oauthToken: /\b[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\b/g,

    // IP and Secrets
    ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    privateIp: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g,
    jwt: /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\b/g,

    // Financial
    iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g,
    swift: /\b[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?\b/g,

    // Other
    bitcoin: /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g,
    ethereum: /\b0x[a-fA-F0-9]{40}\b/g,
    dateOfBirth: /\b(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\d\d\b/g
  };

  constructor(config: Partial<DLPConfig> = {}) {
    super();

    this.config = {
      enableMLClassification: true,
      enableMonitoring: true,
      alertThresholds: {
        uploadSize: 100 * 1024 * 1024, // 100MB
        downloadSize: 1024 * 1024 * 1024, // 1GB
        bulkExport: 1000
      },
      businessHours: {
        start: 6,
        end: 21
      },
      allowedCountries: ['US', 'CA', 'GB', 'DE', 'FR'],
      ...config
    };

    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();

    this.metrics = {
      totalScans: 0,
      violationsDetected: 0,
      violationsBlocked: 0,
      dataClassified: 0,
      quarantineItems: 0,
      falsePositives: 0,
      averageScanTime: 0
    };

    this.initializeMLModel();
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize ML model for classification
   */
  private async initializeMLModel(): Promise<void> {
    if (!this.config.enableMLClassification) {
      return;
    }

    try {
      // Simple neural network for document classification
      this.mlModel = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [100], units: 64, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 4, activation: 'softmax' }) // 4 classification levels
        ]
      });

      this.mlModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
    } catch (error) {
      console.error('Failed to initialize ML model:', error);
      this.mlModel = null;
    }
  }

  /**
   * Initialize default DLP policies
   */
  private initializeDefaultPolicies(): void {
    // Policy 1: Block SSN transmission
    this.addPolicy({
      id: 'block-ssn',
      name: 'Block SSN Transmission',
      enabled: true,
      priority: 1,
      conditions: [
        { type: 'dataType', operator: 'equals', value: 'ssn' }
      ],
      actions: [
        { type: 'block' },
        { type: 'alert', notifyUsers: ['security@company.com'] },
        { type: 'log' }
      ],
      scope: {},
      created: new Date(),
      updated: new Date()
    });

    // Policy 2: Encrypt credit card data
    this.addPolicy({
      id: 'encrypt-credit-card',
      name: 'Encrypt Credit Card Data',
      enabled: true,
      priority: 2,
      conditions: [
        { type: 'dataType', operator: 'equals', value: 'creditCard' }
      ],
      actions: [
        { type: 'encrypt' },
        { type: 'log' }
      ],
      scope: {},
      created: new Date(),
      updated: new Date()
    });

    // Policy 3: Quarantine API keys
    this.addPolicy({
      id: 'quarantine-api-keys',
      name: 'Quarantine API Keys',
      enabled: true,
      priority: 1,
      conditions: [
        { type: 'dataType', operator: 'equals', value: 'apiKey' }
      ],
      actions: [
        { type: 'quarantine' },
        { type: 'alert', notifyUsers: ['security@company.com'] },
        { type: 'log' }
      ],
      scope: {},
      created: new Date(),
      updated: new Date()
    });

    // Policy 4: Alert on large downloads
    this.addPolicy({
      id: 'alert-large-download',
      name: 'Alert on Large Downloads',
      enabled: true,
      priority: 3,
      conditions: [
        { type: 'size', operator: 'greaterThan', value: this.config.alertThresholds.downloadSize }
      ],
      actions: [
        { type: 'alert', notifyUsers: ['security@company.com'] },
        { type: 'log' }
      ],
      scope: {},
      created: new Date(),
      updated: new Date()
    });

    // Policy 5: Redact confidential data in non-prod
    this.addPolicy({
      id: 'redact-confidential',
      name: 'Redact Confidential Data',
      enabled: true,
      priority: 2,
      conditions: [
        { type: 'classification', operator: 'equals', value: 'confidential' },
        { type: 'location', operator: 'contains', value: 'non-prod' }
      ],
      actions: [
        { type: 'redact' },
        { type: 'log' }
      ],
      scope: {},
      created: new Date(),
      updated: new Date()
    });
  }

  /**
   * Data Classification
   */

  /**
   * Classify data automatically
   */
  async classifyData(content: string, metadata?: Record<string, any>): Promise<DataClassification> {
    const startTime = Date.now();

    // Content-based classification
    const contentScore = this.classifyByContent(content);

    // Metadata-based classification
    const metadataScore = metadata ? this.classifyByMetadata(metadata) : 0;

    // ML-based classification
    const mlScore = this.config.enableMLClassification && this.mlModel
      ? await this.classifyByML(content)
      : 0;

    // Combine scores (weighted average)
    const finalScore = (contentScore * 0.5) + (metadataScore * 0.2) + (mlScore * 0.3);

    let level: DataClassification['level'];
    let reason = '';

    if (finalScore >= 0.75) {
      level = 'restricted';
      reason = 'Contains highly sensitive data (SSN, credit card, private keys)';
    } else if (finalScore >= 0.5) {
      level = 'confidential';
      reason = 'Contains confidential information (API keys, passwords)';
    } else if (finalScore >= 0.25) {
      level = 'internal';
      reason = 'Contains internal-only information';
    } else {
      level = 'public';
      reason = 'No sensitive data detected';
    }

    const classification: DataClassification = {
      level,
      confidence: finalScore,
      reason,
      timestamp: new Date(),
      tags: this.extractTags(content)
    };

    this.metrics.dataClassified++;
    this.metrics.averageScanTime = (this.metrics.averageScanTime * (this.metrics.totalScans) + (Date.now() - startTime)) / (this.metrics.totalScans + 1);
    this.metrics.totalScans++;

    return classification;
  }

  /**
   * Classify by content patterns
   */
  private classifyByContent(content: string): number {
    let score = 0;

    // Check for various sensitive data types
    if (this.patterns.ssn.test(content) || this.patterns.ssnStrict.test(content)) {
      score = Math.max(score, 0.9);
    }
    if (this.patterns.creditCard.test(content)) {
      score = Math.max(score, 0.9);
    }
    if (this.patterns.privateKey.test(content)) {
      score = Math.max(score, 0.95);
    }
    if (this.patterns.awsAccessKey.test(content) || this.patterns.awsSecretKey.test(content)) {
      score = Math.max(score, 0.8);
    }
    if (this.patterns.apiKey.test(content)) {
      score = Math.max(score, 0.7);
    }
    if (this.patterns.password.test(content)) {
      score = Math.max(score, 0.7);
    }
    if (this.patterns.email.test(content)) {
      score = Math.max(score, 0.3);
    }
    if (this.patterns.phone.test(content)) {
      score = Math.max(score, 0.4);
    }

    return score;
  }

  /**
   * Classify by metadata
   */
  private classifyByMetadata(metadata: Record<string, any>): number {
    let score = 0;

    // File extension
    if (metadata.extension) {
      const sensitiveExtensions = ['.key', '.pem', '.p12', '.pfx', '.env', '.credentials'];
      if (sensitiveExtensions.includes(metadata.extension.toLowerCase())) {
        score = Math.max(score, 0.8);
      }
    }

    // File size (very large files might contain bulk data)
    if (metadata.size && metadata.size > 100 * 1024 * 1024) {
      score = Math.max(score, 0.5);
    }

    // User-defined labels
    if (metadata.labels) {
      const sensitiveLabels = ['confidential', 'restricted', 'secret', 'private'];
      for (const label of metadata.labels) {
        if (sensitiveLabels.includes(label.toLowerCase())) {
          score = Math.max(score, 0.7);
        }
      }
    }

    return score;
  }

  /**
   * Classify using ML
   */
  private async classifyByML(content: string): Promise<number> {
    if (!this.mlModel) {
      return 0;
    }

    try {
      // Tokenize and vectorize
      const tokens = this.tokenizer.tokenize(content.toLowerCase());
      const vector = this.vectorizeText(tokens || []);

      // Predict
      const prediction = this.mlModel.predict(tf.tensor2d([vector])) as tf.Tensor;
      const scores = await prediction.data();

      // Return weighted score based on classification probabilities
      // [public, internal, confidential, restricted]
      return scores[0] * 0 + scores[1] * 0.33 + scores[2] * 0.66 + scores[3] * 1;
    } catch (error) {
      console.error('ML classification error:', error);
      return 0;
    }
  }

  /**
   * Vectorize text for ML model
   */
  private vectorizeText(tokens: string[]): number[] {
    const vector = new Array(100).fill(0);

    // Simple bag-of-words with frequency
    const sensitiveWords = ['password', 'secret', 'key', 'token', 'confidential', 'private', 'ssn', 'credit', 'card'];

    tokens.forEach((token, index) => {
      if (index < 100) {
        vector[index] = sensitiveWords.includes(token) ? 1 : 0.1;
      }
    });

    return vector;
  }

  /**
   * Extract classification tags
   */
  private extractTags(content: string): string[] {
    const tags: string[] = [];

    if (this.patterns.ssn.test(content)) tags.push('PII-SSN');
    if (this.patterns.creditCard.test(content)) tags.push('PCI-CreditCard');
    if (this.patterns.email.test(content)) tags.push('PII-Email');
    if (this.patterns.phone.test(content)) tags.push('PII-Phone');
    if (this.patterns.apiKey.test(content)) tags.push('Credentials-APIKey');
    if (this.patterns.privateKey.test(content)) tags.push('Credentials-PrivateKey');
    if (this.patterns.medicalRecord.test(content)) tags.push('PHI-MedicalRecord');

    return tags;
  }

  /**
   * Sensitive Data Detection
   */

  /**
   * Scan content for sensitive data
   */
  scanContent(content: string): SensitiveDataMatch[] {
    const matches: SensitiveDataMatch[] = [];

    // Scan with all patterns
    for (const [type, pattern] of Object.entries(this.patterns)) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;

      while ((match = regex.exec(content)) !== null) {
        const value = match[0];
        const confidence = this.calculateConfidence(type, value);

        if (confidence >= 0.5) {
          matches.push({
            type,
            value,
            startIndex: match.index,
            endIndex: match.index + value.length,
            confidence,
            pattern: pattern.source
          });
        }
      }
    }

    // Additional validation for credit cards (Luhn algorithm)
    matches.forEach(match => {
      if (match.type === 'creditCard') {
        const cleanNumber = match.value.replace(/[-\s]/g, '');
        if (!this.luhnCheck(cleanNumber)) {
          match.confidence *= 0.5; // Reduce confidence if Luhn check fails
        }
      }
    });

    return matches;
  }

  /**
   * Calculate detection confidence
   */
  private calculateConfidence(type: string, value: string): number {
    const baseConfidence: Record<string, number> = {
      ssnStrict: 0.95,
      ssn: 0.8,
      creditCard: 0.9,
      privateKey: 0.99,
      awsAccessKey: 0.95,
      awsSecretKey: 0.85,
      githubToken: 0.95,
      stripeKey: 0.95,
      apiKey: 0.6,
      email: 0.9,
      phone: 0.7,
      medicalRecord: 0.8
    };

    let confidence = baseConfidence[type] || 0.5;

    // Adjust based on context
    if (type === 'apiKey' && value.length < 32) {
      confidence *= 0.5;
    }

    // Check entropy for potential passwords
    if (type === 'password') {
      const entropy = this.calculateEntropy(value);
      confidence = entropy > 3.5 ? 0.8 : 0.4;
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
   * Luhn algorithm for credit card validation
   */
  private luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Data Exfiltration Detection
   */

  /**
   * Track user activity baseline
   */
  private updateUserBaseline(userId: string, activity: UserActivity): void {
    let baseline = this.userBaselines.get(userId);

    if (!baseline) {
      baseline = {
        userId,
        avgUploadSize: 0,
        avgDownloadSize: 0,
        avgExportCount: 0,
        commonLocations: new Map(),
        commonHours: new Array(24).fill(0),
        lastActivity: new Date(),
        totalActivities: 0
      };
      this.userBaselines.set(userId, baseline);
    }

    // Update rolling averages
    baseline.avgUploadSize = (baseline.avgUploadSize * baseline.totalActivities + activity.uploadSize) / (baseline.totalActivities + 1);
    baseline.avgDownloadSize = (baseline.avgDownloadSize * baseline.totalActivities + activity.downloadSize) / (baseline.totalActivities + 1);
    baseline.avgExportCount = (baseline.avgExportCount * baseline.totalActivities + activity.exportCount) / (baseline.totalActivities + 1);

    // Update location frequency
    const locationCount = baseline.commonLocations.get(activity.location) || 0;
    baseline.commonLocations.set(activity.location, locationCount + 1);

    // Update hour frequency
    const hour = new Date(activity.timestamp).getHours();
    baseline.commonHours[hour]++;

    baseline.totalActivities++;
    baseline.lastActivity = activity.timestamp;
  }

  /**
   * Detect unusual activity
   */
  async detectExfiltration(userId: string, activity: UserActivity): Promise<ExfiltrationAlert[]> {
    const alerts: ExfiltrationAlert[] = [];
    const baseline = this.userBaselines.get(userId);

    // Update baseline
    this.updateUserBaseline(userId, activity);

    if (!baseline || baseline.totalActivities < 10) {
      // Need more data for baseline
      return alerts;
    }

    // Check unusual upload size
    if (activity.uploadSize > baseline.avgUploadSize * 100) {
      alerts.push({
        id: this.generateId(),
        userId,
        type: 'unusual_upload',
        severity: activity.uploadSize > this.config.alertThresholds.uploadSize ? 'high' : 'medium',
        details: `Upload size ${this.formatBytes(activity.uploadSize)} is ${Math.round(activity.uploadSize / baseline.avgUploadSize)}x higher than baseline`,
        metrics: {
          baseline: baseline.avgUploadSize,
          current: activity.uploadSize,
          threshold: this.config.alertThresholds.uploadSize
        },
        timestamp: new Date(),
        blocked: activity.uploadSize > this.config.alertThresholds.uploadSize * 10
      });
    }

    // Check unusual download size
    if (activity.downloadSize > baseline.avgDownloadSize * 100) {
      alerts.push({
        id: this.generateId(),
        userId,
        type: 'unusual_download',
        severity: activity.downloadSize > this.config.alertThresholds.downloadSize ? 'critical' : 'high',
        details: `Download size ${this.formatBytes(activity.downloadSize)} is ${Math.round(activity.downloadSize / baseline.avgDownloadSize)}x higher than baseline`,
        metrics: {
          baseline: baseline.avgDownloadSize,
          current: activity.downloadSize,
          threshold: this.config.alertThresholds.downloadSize
        },
        timestamp: new Date(),
        blocked: activity.downloadSize > this.config.alertThresholds.downloadSize
      });
    }

    // Check large file transfer
    if (activity.uploadSize > this.config.alertThresholds.uploadSize || activity.downloadSize > this.config.alertThresholds.downloadSize) {
      alerts.push({
        id: this.generateId(),
        userId,
        type: 'large_transfer',
        severity: 'high',
        details: `Large file transfer detected: ${this.formatBytes(Math.max(activity.uploadSize, activity.downloadSize))}`,
        metrics: {
          current: Math.max(activity.uploadSize, activity.downloadSize),
          threshold: Math.max(this.config.alertThresholds.uploadSize, this.config.alertThresholds.downloadSize)
        },
        timestamp: new Date(),
        blocked: false
      });
    }

    // Check bulk export
    if (activity.exportCount > this.config.alertThresholds.bulkExport) {
      alerts.push({
        id: this.generateId(),
        userId,
        type: 'bulk_export',
        severity: 'critical',
        details: `Bulk export detected: ${activity.exportCount} records`,
        metrics: {
          baseline: baseline.avgExportCount,
          current: activity.exportCount,
          threshold: this.config.alertThresholds.bulkExport
        },
        timestamp: new Date(),
        blocked: true
      });
    }

    // Check unusual location
    const locationFreq = baseline.commonLocations.get(activity.location) || 0;
    if (locationFreq === 0 && !this.config.allowedCountries.includes(activity.country || '')) {
      alerts.push({
        id: this.generateId(),
        userId,
        type: 'unusual_location',
        severity: 'high',
        details: `Access from unusual location: ${activity.location} (${activity.country})`,
        metrics: {
          current: 0,
          threshold: 1
        },
        timestamp: new Date(),
        blocked: false
      });
    }

    // Check off-hours access
    const hour = new Date(activity.timestamp).getHours();
    if (hour < this.config.businessHours.start || hour > this.config.businessHours.end) {
      const hourFreq = baseline.commonHours[hour];
      if (hourFreq < 5) {
        alerts.push({
          id: this.generateId(),
          userId,
          type: 'off_hours',
          severity: 'medium',
          details: `Access outside business hours: ${hour}:00`,
          metrics: {
            baseline: hourFreq,
            current: 1,
            threshold: 5
          },
          timestamp: new Date(),
          blocked: false
        });
      }
    }

    // Check impossible travel
    if (baseline.lastActivity) {
      const timeDiff = (activity.timestamp.getTime() - baseline.lastActivity.getTime()) / 1000 / 60; // minutes
      const lastLocation = Array.from(baseline.commonLocations.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];

      if (lastLocation && lastLocation !== activity.location && timeDiff < 60) {
        alerts.push({
          id: this.generateId(),
          userId,
          type: 'impossible_travel',
          severity: 'critical',
          details: `Impossible travel detected: ${lastLocation} to ${activity.location} in ${Math.round(timeDiff)} minutes`,
          metrics: {
            current: timeDiff,
            threshold: 60
          },
          timestamp: new Date(),
          blocked: true
        });
      }
    }

    // Emit alerts
    alerts.forEach(alert => {
      this.emit('exfiltration-alert', alert);
    });

    return alerts;
  }

  /**
   * DLP Policies
   */

  /**
   * Add DLP policy
   */
  addPolicy(policy: DLPPolicy): void {
    this.policies.set(policy.id, policy);
    this.emit('policy-added', policy);
  }

  /**
   * Update DLP policy
   */
  updatePolicy(policyId: string, updates: Partial<DLPPolicy>): void {
    const policy = this.policies.get(policyId);
    if (policy) {
      Object.assign(policy, updates, { updated: new Date() });
      this.policies.set(policyId, policy);
      this.emit('policy-updated', policy);
    }
  }

  /**
   * Delete DLP policy
   */
  deletePolicy(policyId: string): void {
    const policy = this.policies.get(policyId);
    if (policy) {
      this.policies.delete(policyId);
      this.emit('policy-deleted', policy);
    }
  }

  /**
   * Evaluate policies against content
   */
  async evaluatePolicies(content: string, context: {
    userId: string;
    action: string;
    location: { ip: string; country: string };
    metadata?: Record<string, any>;
  }): Promise<{
    allowed: boolean;
    violations: DLPViolation[];
    actionsToTake: PolicyAction[];
  }> {
    const detectedData = this.scanContent(content);
    const classification = await this.classifyData(content, context.metadata);

    const violations: DLPViolation[] = [];
    const actionsToTake: PolicyAction[] = [];
    let allowed = true;

    // Sort policies by priority
    const sortedPolicies = Array.from(this.policies.values())
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const policy of sortedPolicies) {
      // Check if policy applies
      if (!this.policyApplies(policy, detectedData, classification, context)) {
        continue;
      }

      // Create violation record
      const violation: DLPViolation = {
        id: this.generateId(),
        policyId: policy.id,
        policyName: policy.name,
        severity: this.determineSeverity(policy, detectedData),
        userId: context.userId,
        action: context.action,
        dataType: detectedData[0]?.type || 'unknown',
        detectedData,
        actionsTaken: policy.actions.map(a => a.type),
        timestamp: new Date(),
        location: context.location,
        metadata: context.metadata || {}
      };

      violations.push(violation);
      this.violations.set(violation.id, violation);

      // Collect actions
      actionsToTake.push(...policy.actions);

      // Check if blocking action
      if (policy.actions.some(a => a.type === 'block')) {
        allowed = false;
      }

      this.emit('policy-violation', violation);
    }

    // Update metrics
    this.metrics.violationsDetected += violations.length;
    if (!allowed) {
      this.metrics.violationsBlocked++;
    }

    return { allowed, violations, actionsToTake };
  }

  /**
   * Check if policy applies to content
   */
  private policyApplies(
    policy: DLPPolicy,
    detectedData: SensitiveDataMatch[],
    classification: DataClassification,
    context: any
  ): boolean {
    return policy.conditions.every(condition => {
      switch (condition.type) {
        case 'dataType':
          return detectedData.some(d => {
            if (condition.operator === 'equals') {
              return d.type === condition.value;
            } else if (condition.operator === 'contains') {
              return d.type.includes(condition.value as string);
            }
            return false;
          });

        case 'classification':
          if (condition.operator === 'equals') {
            return classification.level === condition.value;
          }
          return false;

        case 'size':
          const size = context.metadata?.size || 0;
          if (condition.operator === 'greaterThan') {
            return size > (condition.value as number);
          } else if (condition.operator === 'lessThan') {
            return size < (condition.value as number);
          }
          return false;

        case 'location':
          if (condition.operator === 'contains') {
            return context.location?.country?.includes(condition.value);
          }
          return false;

        case 'time':
          const hour = new Date().getHours();
          // Simple time check (can be enhanced)
          return true;

        case 'user':
          if (condition.operator === 'equals') {
            return context.userId === condition.value;
          }
          return false;

        default:
          return false;
      }
    });
  }

  /**
   * Determine violation severity
   */
  private determineSeverity(policy: DLPPolicy, detectedData: SensitiveDataMatch[]): DLPViolation['severity'] {
    const criticalTypes = ['ssn', 'creditCard', 'privateKey', 'awsAccessKey'];
    const highTypes = ['apiKey', 'password', 'medicalRecord'];

    if (detectedData.some(d => criticalTypes.includes(d.type))) {
      return 'critical';
    } else if (detectedData.some(d => highTypes.includes(d.type))) {
      return 'high';
    } else if (policy.priority <= 2) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Execute policy actions
   */
  async executeActions(content: string, actions: PolicyAction[]): Promise<string> {
    let processedContent = content;

    for (const action of actions) {
      switch (action.type) {
        case 'block':
          throw new Error('Access denied by DLP policy');

        case 'quarantine':
          await this.quarantineContent(processedContent, actions);
          break;

        case 'encrypt':
          // Would integrate with AdvancedEncryption service
          processedContent = Buffer.from(processedContent).toString('base64');
          break;

        case 'redact':
          processedContent = this.redactSensitiveData(processedContent);
          break;

        case 'alert':
          this.sendAlert(action, content);
          break;

        case 'log':
          this.logAccess(content, action);
          break;
      }
    }

    return processedContent;
  }

  /**
   * Data Masking
   */

  /**
   * Redact sensitive data
   */
  private redactSensitiveData(content: string): string {
    let redacted = content;

    // Redact SSN
    redacted = redacted.replace(this.patterns.ssn, (match) => {
      const parts = match.split('-');
      if (parts.length === 3) {
        return `XXX-XX-${parts[2]}`;
      }
      return 'XXX-XX-' + match.slice(-4);
    });

    // Redact credit card
    redacted = redacted.replace(this.patterns.creditCard, (match) => {
      const digits = match.replace(/[-\s]/g, '');
      return '**** **** **** ' + digits.slice(-4);
    });

    // Redact email (partial)
    redacted = redacted.replace(this.patterns.email, (match) => {
      const [local, domain] = match.split('@');
      return local[0] + '***@' + domain;
    });

    // Redact phone
    redacted = redacted.replace(this.patterns.phone, (match) => {
      return '***-***-' + match.slice(-4);
    });

    // Redact API keys
    redacted = redacted.replace(this.patterns.apiKey, () => '[REDACTED-API-KEY]');

    // Redact private keys
    redacted = redacted.replace(this.patterns.privateKey, () => '[REDACTED-PRIVATE-KEY]');

    return redacted;
  }

  /**
   * Apply masking rules
   */
  applyMasking(data: Record<string, any>, userRole: string): Record<string, any> {
    const masked = { ...data };

    for (const [field, rule] of this.maskingRules.entries()) {
      if (!(data[field])) continue;

      // Check role authorization
      if (rule.authorizedRoles && rule.authorizedRoles.includes(userRole)) {
        continue; // Skip masking for authorized roles
      }

      const value = String(data[field]);

      switch (rule.maskType) {
        case 'partial':
          masked[field] = this.partialMask(value, rule.visibleChars || 4);
          break;

        case 'full':
          masked[field] = '*'.repeat(value.length);
          break;

        case 'tokenize':
          masked[field] = this.tokenize(value);
          break;

        case 'hash':
          masked[field] = this.hashValue(value);
          break;

        case 'fpe':
          // Format-preserving encryption would be implemented here
          masked[field] = this.formatPreservingMask(value);
          break;
      }
    }

    return masked;
  }

  /**
   * Partial masking
   */
  private partialMask(value: string, visibleChars: number): string {
    if (value.length <= visibleChars) {
      return '*'.repeat(value.length);
    }
    return '*'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
  }

  /**
   * Tokenize value
   */
  private tokenize(value: string): string {
    return 'tok_' + Buffer.from(value).toString('base64').slice(0, 16);
  }

  /**
   * Hash value
   */
  private hashValue(value: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
  }

  /**
   * Format-preserving mask
   */
  private formatPreservingMask(value: string): string {
    // Simple format preservation (replace alphanumeric with random)
    return value.replace(/[a-zA-Z]/g, () => String.fromCharCode(65 + Math.random() * 26))
      .replace(/\d/g, () => String(Math.floor(Math.random() * 10)));
  }

  /**
   * Quarantine Management
   */

  /**
   * Add to quarantine
   */
  private async quarantineContent(content: string, actions: PolicyAction[]): Promise<void> {
    const detectedData = this.scanContent(content);

    const item: QuarantineItem = {
      id: this.generateId(),
      type: 'message',
      content,
      detectedIssues: detectedData,
      userId: 'unknown',
      timestamp: new Date(),
      status: 'pending'
    };

    this.quarantine.set(item.id, item);
    this.metrics.quarantineItems++;

    this.emit('quarantine-added', item);
  }

  /**
   * Review quarantine item
   */
  reviewQuarantineItem(itemId: string, approved: boolean, reviewerId: string): void {
    const item = this.quarantine.get(itemId);
    if (item) {
      item.status = approved ? 'approved' : 'rejected';
      item.reviewedBy = reviewerId;
      item.reviewedAt = new Date();

      this.emit('quarantine-reviewed', item);

      if (!approved) {
        this.metrics.quarantineItems--;
      }
    }
  }

  /**
   * Helper Methods
   */

  /**
   * Send alert
   */
  private sendAlert(action: PolicyAction, content: string): void {
    this.emit('alert', {
      recipients: action.notifyUsers || [],
      subject: 'DLP Policy Violation',
      message: `Sensitive data detected. Preview: ${content.slice(0, 100)}...`
    });
  }

  /**
   * Log access
   */
  private logAccess(content: string, action: PolicyAction): void {
    this.emit('log', {
      action: action.type,
      content: content.slice(0, 100),
      timestamp: new Date()
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `dlp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Format bytes
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Public API
   */

  getAllPolicies(): DLPPolicy[] {
    return Array.from(this.policies.values());
  }

  getPolicy(policyId: string): DLPPolicy | undefined {
    return this.policies.get(policyId);
  }

  getViolations(filters?: { userId?: string; severity?: string; startDate?: Date }): DLPViolation[] {
    let violations = Array.from(this.violations.values());

    if (filters?.userId) {
      violations = violations.filter(v => v.userId === filters.userId);
    }

    if (filters?.severity) {
      violations = violations.filter(v => v.severity === filters.severity);
    }

    if (filters?.startDate) {
      violations = violations.filter(v => v.timestamp >= filters.startDate!);
    }

    return violations;
  }

  getQuarantineItems(status?: QuarantineItem['status']): QuarantineItem[] {
    const items = Array.from(this.quarantine.values());
    return status ? items.filter(i => i.status === status) : items;
  }

  getMetrics(): DLPMetrics {
    return { ...this.metrics };
  }

  addMaskingRule(field: string, rule: DataMaskingRule): void {
    this.maskingRules.set(field, rule);
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    policies: number;
    violations: number;
    quarantine: number;
    ml: boolean;
  }> {
    return {
      healthy: true,
      policies: this.policies.size,
      violations: this.violations.size,
      quarantine: this.quarantine.size,
      ml: this.mlModel !== null
    };
  }
}

interface UserBaseline {
  userId: string;
  avgUploadSize: number;
  avgDownloadSize: number;
  avgExportCount: number;
  commonLocations: Map<string, number>;
  commonHours: number[];
  lastActivity: Date;
  totalActivities: number;
}

interface UserActivity {
  uploadSize: number;
  downloadSize: number;
  exportCount: number;
  location: string;
  country?: string;
  timestamp: Date;
}

export default DataLossPrevention;
