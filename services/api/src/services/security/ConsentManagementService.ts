/**
 * Consent Management Service
 *
 * Provides comprehensive user consent management for GDPR/CCPA compliance:
 * - Consent collection and storage
 * - Consent versioning and history
 * - Consent withdrawal handling
 * - Purpose-based consent management
 * - Consent proof generation
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

// Types
export type ConsentType =
  | 'marketing'
  | 'analytics'
  | 'personalization'
  | 'third_party_sharing'
  | 'cookies'
  | 'data_collection'
  | 'push_notifications'
  | 'email_communications'
  | 'sms_communications'
  | 'terms_of_service'
  | 'privacy_policy'
  | 'ai_processing'
  | 'data_retention'
  | 'cross_border_transfer';

export type ConsentStatus = 'granted' | 'denied' | 'withdrawn' | 'expired' | 'pending';
export type ConsentSource = 'web_form' | 'mobile_app' | 'api' | 'email' | 'in_person' | 'sso';

export interface ConsentRecord {
  id: string;
  userId: string;
  type: ConsentType;
  status: ConsentStatus;
  version: string;
  grantedAt?: Date;
  deniedAt?: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  source: ConsentSource;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  hash: string; // Proof of consent
}

export interface ConsentPreferences {
  userId: string;
  consents: Map<ConsentType, ConsentRecord>;
  lastUpdated: Date;
  version: string;
}

export interface ConsentPurpose {
  type: ConsentType;
  name: string;
  description: string;
  required: boolean;
  defaultValue: boolean;
  legalBasis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
  retentionDays?: number;
  thirdParties?: string[];
  version: string;
}

export interface ConsentRequest {
  userId: string;
  type: ConsentType;
  granted: boolean;
  source: ConsentSource;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface ConsentProof {
  consentId: string;
  userId: string;
  type: ConsentType;
  status: ConsentStatus;
  timestamp: Date;
  hash: string;
  signature: string;
  verificationUrl?: string;
}

export interface ConsentAuditEntry {
  id: string;
  consentId: string;
  userId: string;
  action: 'granted' | 'denied' | 'withdrawn' | 'updated' | 'expired';
  previousStatus?: ConsentStatus;
  newStatus: ConsentStatus;
  timestamp: Date;
  source: ConsentSource;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export interface ConsentStats {
  totalUsers: number;
  byType: Record<ConsentType, { granted: number; denied: number; withdrawn: number }>;
  bySource: Record<ConsentSource, number>;
  recentWithdrawals: number;
  pendingExpirations: number;
}

export interface ConsentManagementConfig {
  defaultExpirationDays?: number;
  requireExplicitConsent?: boolean;
  enableAuditLogging?: boolean;
  enableConsentProof?: boolean;
  signingKey?: string;
}

// Default consent purposes
const DEFAULT_PURPOSES: ConsentPurpose[] = [
  {
    type: 'terms_of_service',
    name: 'Terms of Service',
    description: 'Agreement to our Terms of Service',
    required: true,
    defaultValue: false,
    legalBasis: 'contract',
    version: '1.0',
  },
  {
    type: 'privacy_policy',
    name: 'Privacy Policy',
    description: 'Acknowledgment of our Privacy Policy',
    required: true,
    defaultValue: false,
    legalBasis: 'contract',
    version: '1.0',
  },
  {
    type: 'data_collection',
    name: 'Essential Data Collection',
    description: 'Collection of data necessary for service operation',
    required: true,
    defaultValue: true,
    legalBasis: 'contract',
    version: '1.0',
  },
  {
    type: 'analytics',
    name: 'Analytics',
    description: 'Usage analytics to improve our services',
    required: false,
    defaultValue: false,
    legalBasis: 'consent',
    version: '1.0',
  },
  {
    type: 'marketing',
    name: 'Marketing Communications',
    description: 'Promotional emails and marketing messages',
    required: false,
    defaultValue: false,
    legalBasis: 'consent',
    version: '1.0',
  },
  {
    type: 'personalization',
    name: 'Personalization',
    description: 'Personalized content and recommendations',
    required: false,
    defaultValue: false,
    legalBasis: 'consent',
    version: '1.0',
  },
  {
    type: 'third_party_sharing',
    name: 'Third-Party Data Sharing',
    description: 'Sharing data with trusted partners',
    required: false,
    defaultValue: false,
    legalBasis: 'consent',
    thirdParties: [],
    version: '1.0',
  },
  {
    type: 'cookies',
    name: 'Cookies',
    description: 'Use of cookies for functionality and tracking',
    required: false,
    defaultValue: false,
    legalBasis: 'consent',
    version: '1.0',
  },
  {
    type: 'ai_processing',
    name: 'AI Processing',
    description: 'Use of AI to analyze and process your data',
    required: false,
    defaultValue: false,
    legalBasis: 'consent',
    version: '1.0',
  },
  {
    type: 'push_notifications',
    name: 'Push Notifications',
    description: 'Receive push notifications on your device',
    required: false,
    defaultValue: false,
    legalBasis: 'consent',
    version: '1.0',
  },
  {
    type: 'email_communications',
    name: 'Email Communications',
    description: 'Receive updates and information via email',
    required: false,
    defaultValue: false,
    legalBasis: 'consent',
    version: '1.0',
  },
  {
    type: 'cross_border_transfer',
    name: 'Cross-Border Data Transfer',
    description: 'Transfer of data to countries outside your region',
    required: false,
    defaultValue: false,
    legalBasis: 'consent',
    version: '1.0',
  },
];

// Consent Management Service
export class ConsentManagementService extends EventEmitter {
  private config: Required<ConsentManagementConfig>;
  private purposes: Map<ConsentType, ConsentPurpose> = new Map();
  private consents: Map<string, ConsentPreferences> = new Map(); // userId -> preferences
  private auditLog: ConsentAuditEntry[] = [];
  private stats: ConsentStats = {
    totalUsers: 0,
    byType: {} as Record<ConsentType, { granted: number; denied: number; withdrawn: number }>,
    bySource: {} as Record<ConsentSource, number>,
    recentWithdrawals: 0,
    pendingExpirations: 0,
  };

  constructor(config: ConsentManagementConfig = {}) {
    super();
    this.config = {
      defaultExpirationDays: config.defaultExpirationDays || 365,
      requireExplicitConsent: config.requireExplicitConsent ?? true,
      enableAuditLogging: config.enableAuditLogging ?? true,
      enableConsentProof: config.enableConsentProof ?? true,
      signingKey: config.signingKey || crypto.randomBytes(32).toString('hex'),
    };

    // Initialize purposes
    for (const purpose of DEFAULT_PURPOSES) {
      this.purposes.set(purpose.type, purpose);
    }
  }

  /**
   * Initialize the consent management service
   */
  async initialize(): Promise<void> {
    // In production, load existing consents from database
    console.log('ConsentManagementService initialized');
    this.emit('initialized');
  }

  /**
   * Record a consent decision
   */
  async recordConsent(request: ConsentRequest): Promise<ConsentRecord> {
    const purpose = this.purposes.get(request.type);
    if (!purpose) {
      throw new Error(`Unknown consent type: ${request.type}`);
    }

    const now = new Date();
    const consentId = this.generateConsentId();

    // Get or create user preferences
    let preferences = this.consents.get(request.userId);
    if (!preferences) {
      preferences = {
        userId: request.userId,
        consents: new Map(),
        lastUpdated: now,
        version: '1.0',
      };
      this.consents.set(request.userId, preferences);
      this.stats.totalUsers++;
    }

    // Get previous consent if exists
    const previousConsent = preferences.consents.get(request.type);
    const previousStatus = previousConsent?.status;

    // Create new consent record
    const consent: ConsentRecord = {
      id: consentId,
      userId: request.userId,
      type: request.type,
      status: request.granted ? 'granted' : 'denied',
      version: purpose.version,
      grantedAt: request.granted ? now : undefined,
      deniedAt: request.granted ? undefined : now,
      expiresAt: request.granted
        ? new Date(now.getTime() + this.config.defaultExpirationDays * 24 * 60 * 60 * 1000)
        : undefined,
      source: request.source,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      metadata: request.metadata,
      hash: this.generateConsentHash({
        id: consentId,
        userId: request.userId,
        type: request.type,
        status: request.granted ? 'granted' : 'denied',
        timestamp: now,
      }),
    };

    // Store consent
    preferences.consents.set(request.type, consent);
    preferences.lastUpdated = now;

    // Update stats
    this.updateStats(request.type, consent.status, previousStatus, request.source);

    // Audit log
    if (this.config.enableAuditLogging) {
      this.addAuditEntry({
        id: crypto.randomUUID(),
        consentId,
        userId: request.userId,
        action: request.granted ? 'granted' : 'denied',
        previousStatus,
        newStatus: consent.status,
        timestamp: now,
        source: request.source,
        ipAddress: request.ipAddress,
        metadata: request.metadata,
      });
    }

    this.emit('consentRecorded', { consent, previousStatus });

    return consent;
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(
    userId: string,
    type: ConsentType,
    source: ConsentSource,
    metadata?: Record<string, unknown>
  ): Promise<ConsentRecord | null> {
    const preferences = this.consents.get(userId);
    if (!preferences) {
      return null;
    }

    const consent = preferences.consents.get(type);
    if (!consent || consent.status !== 'granted') {
      return null;
    }

    const now = new Date();
    const previousStatus = consent.status;

    // Update consent record
    consent.status = 'withdrawn';
    consent.withdrawnAt = now;
    consent.hash = this.generateConsentHash({
      id: consent.id,
      userId,
      type,
      status: 'withdrawn',
      timestamp: now,
    });

    preferences.lastUpdated = now;

    // Update stats
    this.updateStats(type, 'withdrawn', previousStatus, source);
    this.stats.recentWithdrawals++;

    // Audit log
    if (this.config.enableAuditLogging) {
      this.addAuditEntry({
        id: crypto.randomUUID(),
        consentId: consent.id,
        userId,
        action: 'withdrawn',
        previousStatus,
        newStatus: 'withdrawn',
        timestamp: now,
        source,
        metadata,
      });
    }

    this.emit('consentWithdrawn', { consent, previousStatus });

    return consent;
  }

  /**
   * Get user's consent preferences
   */
  async getConsents(userId: string): Promise<ConsentPreferences | null> {
    return this.consents.get(userId) || null;
  }

  /**
   * Check if user has valid consent for a specific type
   */
  async hasConsent(userId: string, type: ConsentType): Promise<boolean> {
    const preferences = this.consents.get(userId);
    if (!preferences) {
      // Check if consent is required
      const purpose = this.purposes.get(type);
      return purpose?.defaultValue ?? false;
    }

    const consent = preferences.consents.get(type);
    if (!consent) {
      const purpose = this.purposes.get(type);
      return purpose?.defaultValue ?? false;
    }

    // Check if consent is valid
    if (consent.status !== 'granted') {
      return false;
    }

    // Check if consent has expired
    if (consent.expiresAt && new Date() > consent.expiresAt) {
      consent.status = 'expired';
      return false;
    }

    return true;
  }

  /**
   * Get consent for multiple types at once
   */
  async checkConsents(
    userId: string,
    types: ConsentType[]
  ): Promise<Map<ConsentType, boolean>> {
    const results = new Map<ConsentType, boolean>();

    for (const type of types) {
      results.set(type, await this.hasConsent(userId, type));
    }

    return results;
  }

  /**
   * Get required consents that are missing for a user
   */
  async getMissingRequiredConsents(userId: string): Promise<ConsentPurpose[]> {
    const missing: ConsentPurpose[] = [];

    for (const [type, purpose] of this.purposes.entries()) {
      if (purpose.required) {
        const hasConsent = await this.hasConsent(userId, type);
        if (!hasConsent) {
          missing.push(purpose);
        }
      }
    }

    return missing;
  }

  /**
   * Generate consent proof for compliance
   */
  generateConsentProof(userId: string, type: ConsentType): ConsentProof | null {
    if (!this.config.enableConsentProof) {
      return null;
    }

    const preferences = this.consents.get(userId);
    if (!preferences) {
      return null;
    }

    const consent = preferences.consents.get(type);
    if (!consent) {
      return null;
    }

    const timestamp = new Date();
    const proofData = JSON.stringify({
      consentId: consent.id,
      userId,
      type,
      status: consent.status,
      timestamp: timestamp.toISOString(),
      hash: consent.hash,
    });

    const signature = crypto
      .createHmac('sha256', this.config.signingKey)
      .update(proofData)
      .digest('hex');

    return {
      consentId: consent.id,
      userId,
      type,
      status: consent.status,
      timestamp,
      hash: consent.hash,
      signature,
    };
  }

  /**
   * Verify consent proof
   */
  verifyConsentProof(proof: ConsentProof): boolean {
    const proofData = JSON.stringify({
      consentId: proof.consentId,
      userId: proof.userId,
      type: proof.type,
      status: proof.status,
      timestamp: proof.timestamp.toISOString(),
      hash: proof.hash,
    });

    const expectedSignature = crypto
      .createHmac('sha256', this.config.signingKey)
      .update(proofData)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(proof.signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get consent audit trail for a user
   */
  getAuditTrail(userId: string, options?: { limit?: number; type?: ConsentType }): ConsentAuditEntry[] {
    let entries = this.auditLog.filter((e) => e.userId === userId);

    if (options?.type) {
      entries = entries.filter((e) => {
        const consent = Array.from(this.consents.get(userId)?.consents.values() || [])
          .find((c) => c.id === e.consentId);
        return consent?.type === options.type;
      });
    }

    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.limit) {
      entries = entries.slice(0, options.limit);
    }

    return entries;
  }

  /**
   * Get all consent purposes
   */
  getPurposes(onlyRequired?: boolean): ConsentPurpose[] {
    const purposes = Array.from(this.purposes.values());
    if (onlyRequired) {
      return purposes.filter((p) => p.required);
    }
    return purposes;
  }

  /**
   * Add or update a consent purpose
   */
  setPurpose(purpose: ConsentPurpose): void {
    this.purposes.set(purpose.type, purpose);
    this.emit('purposeUpdated', purpose);
  }

  /**
   * Bulk update consents for a user
   */
  async updateBulkConsents(
    userId: string,
    consents: Array<{ type: ConsentType; granted: boolean }>,
    source: ConsentSource,
    metadata?: Record<string, unknown>
  ): Promise<ConsentRecord[]> {
    const results: ConsentRecord[] = [];

    for (const { type, granted } of consents) {
      const consent = await this.recordConsent({
        userId,
        type,
        granted,
        source,
        metadata,
      });
      results.push(consent);
    }

    return results;
  }

  /**
   * Export user's consent data (for GDPR data portability)
   */
  async exportConsentData(userId: string): Promise<{
    preferences: ConsentPreferences | null;
    auditTrail: ConsentAuditEntry[];
    exportedAt: Date;
  }> {
    return {
      preferences: await this.getConsents(userId),
      auditTrail: this.getAuditTrail(userId),
      exportedAt: new Date(),
    };
  }

  /**
   * Delete all consent data for a user (for GDPR right to be forgotten)
   */
  async deleteConsentData(userId: string): Promise<boolean> {
    const had = this.consents.has(userId);
    this.consents.delete(userId);
    this.auditLog = this.auditLog.filter((e) => e.userId !== userId);

    if (had) {
      this.stats.totalUsers--;
    }

    this.emit('consentDataDeleted', { userId });
    return had;
  }

  /**
   * Check for expiring consents
   */
  async checkExpiringConsents(daysAhead: number = 30): Promise<ConsentRecord[]> {
    const expiring: ConsentRecord[] = [];
    const threshold = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

    for (const preferences of this.consents.values()) {
      for (const consent of preferences.consents.values()) {
        if (
          consent.status === 'granted' &&
          consent.expiresAt &&
          consent.expiresAt <= threshold
        ) {
          expiring.push(consent);
        }
      }
    }

    this.stats.pendingExpirations = expiring.length;
    return expiring;
  }

  /**
   * Get consent statistics
   */
  getStats(): ConsentStats {
    return { ...this.stats };
  }

  // Private methods

  private generateConsentId(): string {
    return `consent_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateConsentHash(data: {
    id: string;
    userId: string;
    type: ConsentType;
    status: ConsentStatus;
    timestamp: Date;
  }): string {
    const hashData = JSON.stringify({
      ...data,
      timestamp: data.timestamp.toISOString(),
    });
    return crypto.createHash('sha256').update(hashData).digest('hex');
  }

  private updateStats(
    type: ConsentType,
    newStatus: ConsentStatus,
    previousStatus: ConsentStatus | undefined,
    source: ConsentSource
  ): void {
    if (!this.stats.byType[type]) {
      this.stats.byType[type] = { granted: 0, denied: 0, withdrawn: 0 };
    }

    // Decrement previous status if exists
    if (previousStatus === 'granted') {
      this.stats.byType[type].granted = Math.max(0, this.stats.byType[type].granted - 1);
    } else if (previousStatus === 'denied') {
      this.stats.byType[type].denied = Math.max(0, this.stats.byType[type].denied - 1);
    }

    // Increment new status
    if (newStatus === 'granted') {
      this.stats.byType[type].granted++;
    } else if (newStatus === 'denied') {
      this.stats.byType[type].denied++;
    } else if (newStatus === 'withdrawn') {
      this.stats.byType[type].withdrawn++;
    }

    // Update source stats
    this.stats.bySource[source] = (this.stats.bySource[source] || 0) + 1;
  }

  private addAuditEntry(entry: ConsentAuditEntry): void {
    this.auditLog.push(entry);

    // Keep only recent entries (in production, this would be persisted)
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
    }
  }
}

// Singleton instance
let consentManagementServiceInstance: ConsentManagementService | null = null;

export function getConsentManagementService(
  config?: ConsentManagementConfig
): ConsentManagementService {
  if (!consentManagementServiceInstance) {
    consentManagementServiceInstance = new ConsentManagementService(config);
  }
  return consentManagementServiceInstance;
}
