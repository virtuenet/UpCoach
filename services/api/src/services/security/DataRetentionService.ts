/**
 * Data Retention Service
 *
 * Manages data lifecycle and retention policies for compliance:
 * - Configurable retention policies by data type
 * - Automated data deletion/archival
 * - Legal hold management
 * - Data export capabilities
 * - Audit logging of all data operations
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

// Types
export type DataCategory =
  | 'user_profile'
  | 'activity_logs'
  | 'coaching_sessions'
  | 'chat_messages'
  | 'goals'
  | 'habits'
  | 'mood_entries'
  | 'financial_transactions'
  | 'analytics_data'
  | 'audit_logs'
  | 'system_logs'
  | 'ai_interactions'
  | 'media_files'
  | 'backup_data';

export type RetentionAction = 'delete' | 'archive' | 'anonymize' | 'pseudonymize';
export type LegalHoldStatus = 'active' | 'released' | 'expired';

export interface RetentionPolicy {
  id: string;
  category: DataCategory;
  retentionDays: number;
  action: RetentionAction;
  enabled: boolean;
  requiresConsent: boolean;
  archiveLocation?: string;
  description: string;
  legalBasis: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataItem {
  id: string;
  category: DataCategory;
  userId: string;
  createdAt: Date;
  lastAccessedAt?: Date;
  expiresAt: Date;
  isArchived: boolean;
  isDeleted: boolean;
  metadata?: Record<string, unknown>;
}

export interface LegalHold {
  id: string;
  name: string;
  reason: string;
  status: LegalHoldStatus;
  categories: DataCategory[];
  userIds?: string[];
  startDate: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  releasedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface DeletionRequest {
  id: string;
  userId: string;
  categories: DataCategory[];
  requestedAt: Date;
  scheduledAt: Date;
  completedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  itemsDeleted: number;
  errors?: string[];
}

export interface ArchiveJob {
  id: string;
  category: DataCategory;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  itemsProcessed: number;
  totalItems: number;
  startedAt: Date;
  completedAt?: Date;
  archiveLocation?: string;
  error?: string;
}

export interface RetentionStats {
  totalItems: number;
  byCategory: Record<DataCategory, number>;
  expiringSoon: number;
  archivedCount: number;
  deletedCount: number;
  legalHoldsActive: number;
  pendingDeletionRequests: number;
}

export interface DataRetentionConfig {
  defaultRetentionDays?: number;
  archiveStoragePath?: string;
  enableAutoArchive?: boolean;
  enableAutoDelete?: boolean;
  batchSize?: number;
  gracePeriodDays?: number;
}

// Default retention policies
const DEFAULT_POLICIES: Omit<RetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    category: 'user_profile',
    retentionDays: 730, // 2 years after account deletion
    action: 'delete',
    enabled: true,
    requiresConsent: false,
    description: 'User profile data retention after account deletion',
    legalBasis: 'GDPR Article 17 - Right to erasure',
  },
  {
    category: 'activity_logs',
    retentionDays: 365,
    action: 'anonymize',
    enabled: true,
    requiresConsent: false,
    description: 'Activity logs retention for analytics',
    legalBasis: 'Legitimate interest for service improvement',
  },
  {
    category: 'coaching_sessions',
    retentionDays: 1095, // 3 years
    action: 'archive',
    enabled: true,
    requiresConsent: false,
    archiveLocation: 'cold-storage/coaching',
    description: 'Coaching session records retention',
    legalBasis: 'Contractual obligation and legitimate interest',
  },
  {
    category: 'chat_messages',
    retentionDays: 365,
    action: 'delete',
    enabled: true,
    requiresConsent: false,
    description: 'Chat message retention',
    legalBasis: 'User consent and service operation',
  },
  {
    category: 'goals',
    retentionDays: 730,
    action: 'archive',
    enabled: true,
    requiresConsent: false,
    archiveLocation: 'cold-storage/goals',
    description: 'Goal data retention',
    legalBasis: 'User consent and service operation',
  },
  {
    category: 'habits',
    retentionDays: 730,
    action: 'archive',
    enabled: true,
    requiresConsent: false,
    archiveLocation: 'cold-storage/habits',
    description: 'Habit tracking data retention',
    legalBasis: 'User consent and service operation',
  },
  {
    category: 'mood_entries',
    retentionDays: 365,
    action: 'anonymize',
    enabled: true,
    requiresConsent: false,
    description: 'Mood tracking data retention',
    legalBasis: 'User consent',
  },
  {
    category: 'financial_transactions',
    retentionDays: 2555, // 7 years for tax compliance
    action: 'archive',
    enabled: true,
    requiresConsent: false,
    archiveLocation: 'cold-storage/financial',
    description: 'Financial transaction records',
    legalBasis: 'Legal obligation (tax regulations)',
  },
  {
    category: 'analytics_data',
    retentionDays: 730,
    action: 'anonymize',
    enabled: true,
    requiresConsent: true,
    description: 'Analytics and usage data',
    legalBasis: 'User consent for analytics',
  },
  {
    category: 'audit_logs',
    retentionDays: 2555, // 7 years for compliance
    action: 'archive',
    enabled: true,
    requiresConsent: false,
    archiveLocation: 'cold-storage/audit',
    description: 'Security audit logs',
    legalBasis: 'Legal obligation and security',
  },
  {
    category: 'system_logs',
    retentionDays: 90,
    action: 'delete',
    enabled: true,
    requiresConsent: false,
    description: 'System operational logs',
    legalBasis: 'Legitimate interest for system operation',
  },
  {
    category: 'ai_interactions',
    retentionDays: 365,
    action: 'anonymize',
    enabled: true,
    requiresConsent: true,
    description: 'AI coaching interactions',
    legalBasis: 'User consent for AI processing',
  },
  {
    category: 'media_files',
    retentionDays: 365,
    action: 'delete',
    enabled: true,
    requiresConsent: false,
    description: 'User uploaded media files',
    legalBasis: 'User consent',
  },
  {
    category: 'backup_data',
    retentionDays: 90,
    action: 'delete',
    enabled: true,
    requiresConsent: false,
    description: 'System backups',
    legalBasis: 'Business continuity',
  },
];

// Data Retention Service
export class DataRetentionService extends EventEmitter {
  private config: Required<DataRetentionConfig>;
  private policies: Map<string, RetentionPolicy> = new Map();
  private legalHolds: Map<string, LegalHold> = new Map();
  private deletionRequests: Map<string, DeletionRequest> = new Map();
  private archiveJobs: Map<string, ArchiveJob> = new Map();
  private dataItems: Map<string, DataItem> = new Map(); // In production, this is the database
  private stats: RetentionStats = {
    totalItems: 0,
    byCategory: {} as Record<DataCategory, number>,
    expiringSoon: 0,
    archivedCount: 0,
    deletedCount: 0,
    legalHoldsActive: 0,
    pendingDeletionRequests: 0,
  };

  constructor(config: DataRetentionConfig = {}) {
    super();
    this.config = {
      defaultRetentionDays: config.defaultRetentionDays || 365,
      archiveStoragePath: config.archiveStoragePath || '/data/archives',
      enableAutoArchive: config.enableAutoArchive ?? true,
      enableAutoDelete: config.enableAutoDelete ?? true,
      batchSize: config.batchSize || 1000,
      gracePeriodDays: config.gracePeriodDays || 30,
    };
  }

  /**
   * Initialize the data retention service
   */
  async initialize(): Promise<void> {
    // Load default policies
    for (const policyData of DEFAULT_POLICIES) {
      const policy: RetentionPolicy = {
        ...policyData,
        id: `policy_${policyData.category}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.policies.set(policy.id, policy);
    }

    console.log('DataRetentionService initialized with', this.policies.size, 'policies');
    this.emit('initialized');
  }

  /**
   * Get retention policy for a category
   */
  getPolicy(category: DataCategory): RetentionPolicy | null {
    return Array.from(this.policies.values()).find((p) => p.category === category) || null;
  }

  /**
   * Get all retention policies
   */
  getAllPolicies(): RetentionPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Update a retention policy
   */
  updatePolicy(
    policyId: string,
    updates: Partial<Omit<RetentionPolicy, 'id' | 'createdAt'>>
  ): RetentionPolicy | null {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return null;
    }

    const updated: RetentionPolicy = {
      ...policy,
      ...updates,
      updatedAt: new Date(),
    };

    this.policies.set(policyId, updated);
    this.emit('policyUpdated', updated);

    return updated;
  }

  /**
   * Calculate expiration date for a data item
   */
  calculateExpirationDate(category: DataCategory, createdAt: Date = new Date()): Date {
    const policy = this.getPolicy(category);
    const retentionDays = policy?.retentionDays || this.config.defaultRetentionDays;
    return new Date(createdAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);
  }

  /**
   * Track a data item for retention
   */
  trackDataItem(item: Omit<DataItem, 'expiresAt' | 'isArchived' | 'isDeleted'>): DataItem {
    const fullItem: DataItem = {
      ...item,
      expiresAt: this.calculateExpirationDate(item.category, item.createdAt),
      isArchived: false,
      isDeleted: false,
    };

    this.dataItems.set(fullItem.id, fullItem);
    this.updateStats();

    return fullItem;
  }

  /**
   * Create a deletion request (GDPR right to be forgotten)
   */
  async createDeletionRequest(
    userId: string,
    categories?: DataCategory[]
  ): Promise<DeletionRequest> {
    const requestId = `del_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date();

    const request: DeletionRequest = {
      id: requestId,
      userId,
      categories: categories || (Object.keys(DEFAULT_POLICIES.map((p) => p.category)) as DataCategory[]),
      requestedAt: now,
      scheduledAt: new Date(now.getTime() + this.config.gracePeriodDays * 24 * 60 * 60 * 1000),
      status: 'pending',
      itemsDeleted: 0,
    };

    this.deletionRequests.set(requestId, request);
    this.updateStats();

    this.emit('deletionRequestCreated', request);

    return request;
  }

  /**
   * Execute a deletion request
   */
  async executeDeletionRequest(requestId: string): Promise<DeletionRequest | null> {
    const request = this.deletionRequests.get(requestId);
    if (!request || request.status !== 'pending') {
      return null;
    }

    // Check for legal holds
    const activeHolds = this.getActiveHoldsForUser(request.userId);
    if (activeHolds.length > 0) {
      request.status = 'cancelled';
      request.errors = ['Data is under legal hold'];
      return request;
    }

    request.status = 'processing';
    const errors: string[] = [];
    let deletedCount = 0;

    try {
      for (const category of request.categories) {
        const items = this.getDataItemsForUser(request.userId, category);
        const policy = this.getPolicy(category);

        for (const item of items) {
          try {
            await this.applyRetentionAction(item, policy?.action || 'delete');
            deletedCount++;
          } catch (e) {
            errors.push(`Failed to process ${item.id}: ${e}`);
          }
        }
      }

      request.status = 'completed';
      request.completedAt = new Date();
      request.itemsDeleted = deletedCount;
      if (errors.length > 0) {
        request.errors = errors;
      }

      this.emit('deletionRequestCompleted', request);
    } catch (e) {
      request.status = 'failed';
      request.errors = [String(e)];
    }

    this.updateStats();
    return request;
  }

  /**
   * Cancel a deletion request
   */
  cancelDeletionRequest(requestId: string): boolean {
    const request = this.deletionRequests.get(requestId);
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'cancelled';
    this.updateStats();

    this.emit('deletionRequestCancelled', request);
    return true;
  }

  /**
   * Create a legal hold
   */
  createLegalHold(
    name: string,
    reason: string,
    categories: DataCategory[],
    createdBy: string,
    options?: {
      userIds?: string[];
      endDate?: Date;
      metadata?: Record<string, unknown>;
    }
  ): LegalHold {
    const holdId = `hold_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const hold: LegalHold = {
      id: holdId,
      name,
      reason,
      status: 'active',
      categories,
      userIds: options?.userIds,
      startDate: new Date(),
      endDate: options?.endDate,
      createdBy,
      createdAt: new Date(),
      metadata: options?.metadata,
    };

    this.legalHolds.set(holdId, hold);
    this.updateStats();

    this.emit('legalHoldCreated', hold);

    return hold;
  }

  /**
   * Release a legal hold
   */
  releaseLegalHold(holdId: string): LegalHold | null {
    const hold = this.legalHolds.get(holdId);
    if (!hold || hold.status !== 'active') {
      return null;
    }

    hold.status = 'released';
    hold.releasedAt = new Date();
    this.updateStats();

    this.emit('legalHoldReleased', hold);

    return hold;
  }

  /**
   * Get active legal holds for a user
   */
  getActiveHoldsForUser(userId: string): LegalHold[] {
    return Array.from(this.legalHolds.values()).filter(
      (hold) =>
        hold.status === 'active' && (!hold.userIds || hold.userIds.includes(userId))
    );
  }

  /**
   * Check if data is under legal hold
   */
  isUnderLegalHold(userId: string, category: DataCategory): boolean {
    const holds = this.getActiveHoldsForUser(userId);
    return holds.some((hold) => hold.categories.includes(category));
  }

  /**
   * Run retention policy enforcement
   */
  async enforceRetentionPolicies(): Promise<{
    processed: number;
    archived: number;
    deleted: number;
    anonymized: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      archived: 0,
      deleted: 0,
      anonymized: 0,
      errors: [] as string[],
    };

    const now = new Date();
    const expiredItems = Array.from(this.dataItems.values()).filter(
      (item) => !item.isDeleted && !item.isArchived && item.expiresAt <= now
    );

    for (const item of expiredItems.slice(0, this.config.batchSize)) {
      // Check legal hold
      if (this.isUnderLegalHold(item.userId, item.category)) {
        continue;
      }

      const policy = this.getPolicy(item.category);
      if (!policy?.enabled) {
        continue;
      }

      try {
        const action = await this.applyRetentionAction(item, policy.action);
        results.processed++;

        switch (action) {
          case 'delete':
            results.deleted++;
            break;
          case 'archive':
            results.archived++;
            break;
          case 'anonymize':
          case 'pseudonymize':
            results.anonymized++;
            break;
        }
      } catch (e) {
        results.errors.push(`Failed to process ${item.id}: ${e}`);
      }
    }

    this.updateStats();
    this.emit('retentionEnforced', results);

    return results;
  }

  /**
   * Apply retention action to a data item
   */
  private async applyRetentionAction(
    item: DataItem,
    action: RetentionAction
  ): Promise<RetentionAction> {
    switch (action) {
      case 'delete':
        item.isDeleted = true;
        // In production, actually delete from database
        this.emit('dataDeleted', { itemId: item.id, category: item.category });
        break;

      case 'archive':
        item.isArchived = true;
        // In production, move to archive storage
        this.emit('dataArchived', {
          itemId: item.id,
          category: item.category,
          location: this.config.archiveStoragePath,
        });
        break;

      case 'anonymize':
        // In production, remove PII from the data
        item.metadata = { ...item.metadata, anonymized: true, anonymizedAt: new Date() };
        this.emit('dataAnonymized', { itemId: item.id, category: item.category });
        break;

      case 'pseudonymize':
        // In production, replace PII with pseudonyms
        item.metadata = {
          ...item.metadata,
          pseudonymized: true,
          pseudonymizedAt: new Date(),
        };
        this.emit('dataPseudonymized', { itemId: item.id, category: item.category });
        break;
    }

    return action;
  }

  /**
   * Get data items for a user
   */
  private getDataItemsForUser(userId: string, category?: DataCategory): DataItem[] {
    return Array.from(this.dataItems.values()).filter(
      (item) =>
        item.userId === userId &&
        !item.isDeleted &&
        (!category || item.category === category)
    );
  }

  /**
   * Get items expiring soon
   */
  getExpiringItems(daysAhead: number = 30): DataItem[] {
    const threshold = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    return Array.from(this.dataItems.values()).filter(
      (item) => !item.isDeleted && !item.isArchived && item.expiresAt <= threshold
    );
  }

  /**
   * Export user data (GDPR data portability)
   */
  async exportUserData(
    userId: string,
    categories?: DataCategory[]
  ): Promise<{
    exportId: string;
    userId: string;
    items: DataItem[];
    exportedAt: Date;
    format: string;
  }> {
    const items = Array.from(this.dataItems.values()).filter(
      (item) =>
        item.userId === userId &&
        !item.isDeleted &&
        (!categories || categories.includes(item.category))
    );

    return {
      exportId: `export_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId,
      items,
      exportedAt: new Date(),
      format: 'json',
    };
  }

  /**
   * Get retention statistics
   */
  getStats(): RetentionStats {
    return { ...this.stats };
  }

  /**
   * Get all deletion requests
   */
  getDeletionRequests(status?: DeletionRequest['status']): DeletionRequest[] {
    const requests = Array.from(this.deletionRequests.values());
    if (status) {
      return requests.filter((r) => r.status === status);
    }
    return requests;
  }

  /**
   * Get all legal holds
   */
  getLegalHolds(status?: LegalHoldStatus): LegalHold[] {
    const holds = Array.from(this.legalHolds.values());
    if (status) {
      return holds.filter((h) => h.status === status);
    }
    return holds;
  }

  private updateStats(): void {
    const items = Array.from(this.dataItems.values());
    const now = new Date();
    const soonThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    this.stats = {
      totalItems: items.filter((i) => !i.isDeleted).length,
      byCategory: items.reduce((acc, item) => {
        if (!item.isDeleted) {
          acc[item.category] = (acc[item.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<DataCategory, number>),
      expiringSoon: items.filter(
        (i) => !i.isDeleted && !i.isArchived && i.expiresAt <= soonThreshold
      ).length,
      archivedCount: items.filter((i) => i.isArchived).length,
      deletedCount: items.filter((i) => i.isDeleted).length,
      legalHoldsActive: Array.from(this.legalHolds.values()).filter(
        (h) => h.status === 'active'
      ).length,
      pendingDeletionRequests: Array.from(this.deletionRequests.values()).filter(
        (r) => r.status === 'pending'
      ).length,
    };
  }
}

// Singleton instance
let dataRetentionServiceInstance: DataRetentionService | null = null;

export function getDataRetentionService(config?: DataRetentionConfig): DataRetentionService {
  if (!dataRetentionServiceInstance) {
    dataRetentionServiceInstance = new DataRetentionService(config);
  }
  return dataRetentionServiceInstance;
}
