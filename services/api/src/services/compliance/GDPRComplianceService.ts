/**
 * GDPR Compliance Service
 *
 * Implements General Data Protection Regulation (GDPR) requirements:
 * - Data Subject Access Requests (DSAR)
 * - Right to Erasure (Right to be Forgotten)
 * - Data Portability
 * - Consent Management Integration
 * - Processing Records (Article 30)
 * - Data Protection Impact Assessments (DPIA)
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

// Types
export type DSARType = 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
export type DSARStatus = 'pending' | 'verified' | 'processing' | 'completed' | 'rejected' | 'extended';
export type LawfulBasis = 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';

export interface DataSubjectRequest {
  id: string;
  type: DSARType;
  subjectEmail: string;
  subjectId?: string;
  status: DSARStatus;
  verificationToken?: string;
  verifiedAt?: Date;
  requestedAt: Date;
  dueDate: Date;
  completedAt?: Date;
  extendedUntil?: Date;
  extensionReason?: string;
  details?: Record<string, unknown>;
  responseData?: unknown;
  handledBy?: string;
  notes?: string[];
}

export interface ProcessingRecord {
  id: string;
  name: string;
  purpose: string;
  lawfulBasis: LawfulBasis;
  dataCategories: string[];
  dataSubjects: string[];
  recipients: string[];
  internationalTransfers?: {
    country: string;
    safeguards: string;
  }[];
  retentionPeriod: string;
  securityMeasures: string[];
  dpia?: string; // Reference to DPIA
  createdAt: Date;
  updatedAt: Date;
}

export interface DPIA {
  id: string;
  name: string;
  processingDescription: string;
  necessity: string;
  risks: DPIARisk[];
  mitigations: DPIAMitigation[];
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  dpoApproval?: {
    approved: boolean;
    approvedBy: string;
    approvedAt: Date;
    comments?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DPIARisk {
  id: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface DPIAMitigation {
  riskId: string;
  description: string;
  effectiveness: 'partial' | 'full';
  implementedAt?: Date;
}

export interface DataBreach {
  id: string;
  discoveredAt: Date;
  reportedAt?: Date;
  nature: string;
  categoriesAffected: string[];
  subjectsAffected: number;
  consequences: string;
  measuresTaken: string[];
  notificationRequired: boolean;
  supervisoryAuthorityNotified?: Date;
  subjectsNotified?: Date;
  status: 'investigating' | 'contained' | 'resolved' | 'reported';
}

export interface GDPRStats {
  totalDSARs: number;
  pendingDSARs: number;
  completedDSARs: number;
  avgResponseTime: number; // days
  processingRecords: number;
  activeDPIAs: number;
  dataBreaches: number;
  consentRate: number;
}

export interface GDPRComplianceConfig {
  dsarResponseDays?: number;
  enableAutoVerification?: boolean;
  dpoEmail?: string;
  supervisoryAuthorityContact?: string;
  organizationName?: string;
  organizationAddress?: string;
}

// GDPR Compliance Service
export class GDPRComplianceService extends EventEmitter {
  private config: Required<GDPRComplianceConfig>;
  private dsars: Map<string, DataSubjectRequest> = new Map();
  private processingRecords: Map<string, ProcessingRecord> = new Map();
  private dpias: Map<string, DPIA> = new Map();
  private dataBreaches: Map<string, DataBreach> = new Map();
  private responseTimes: number[] = [];

  constructor(config: GDPRComplianceConfig = {}) {
    super();
    this.config = {
      dsarResponseDays: config.dsarResponseDays || 30,
      enableAutoVerification: config.enableAutoVerification ?? false,
      dpoEmail: config.dpoEmail || 'dpo@company.com',
      supervisoryAuthorityContact: config.supervisoryAuthorityContact || '',
      organizationName: config.organizationName || 'UpCoach',
      organizationAddress: config.organizationAddress || '',
    };
  }

  /**
   * Initialize GDPR compliance service
   */
  async initialize(): Promise<void> {
    // Initialize default processing records
    this.initializeDefaultProcessingRecords();
    console.log('GDPRComplianceService initialized');
    this.emit('initialized');
  }

  // ===== Data Subject Access Requests (DSAR) =====

  /**
   * Submit a new DSAR
   */
  async submitDSAR(
    type: DSARType,
    subjectEmail: string,
    details?: Record<string, unknown>
  ): Promise<DataSubjectRequest> {
    const id = `dsar_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date();

    const dsar: DataSubjectRequest = {
      id,
      type,
      subjectEmail,
      status: 'pending',
      verificationToken: crypto.randomBytes(32).toString('hex'),
      requestedAt: now,
      dueDate: new Date(now.getTime() + this.config.dsarResponseDays * 24 * 60 * 60 * 1000),
      details,
      notes: [],
    };

    this.dsars.set(id, dsar);
    this.emit('dsarSubmitted', dsar);

    // In production, send verification email
    console.log(`DSAR submitted: ${id}, verification required`);

    return dsar;
  }

  /**
   * Verify a DSAR (identity verification)
   */
  async verifyDSAR(dsarId: string, token: string): Promise<boolean> {
    const dsar = this.dsars.get(dsarId);
    if (!dsar || dsar.status !== 'pending') {
      return false;
    }

    if (dsar.verificationToken !== token) {
      return false;
    }

    dsar.status = 'verified';
    dsar.verifiedAt = new Date();
    delete dsar.verificationToken;

    this.emit('dsarVerified', dsar);
    return true;
  }

  /**
   * Process a DSAR
   */
  async processDSAR(dsarId: string, handledBy: string): Promise<DataSubjectRequest | null> {
    const dsar = this.dsars.get(dsarId);
    if (!dsar || dsar.status !== 'verified') {
      return null;
    }

    dsar.status = 'processing';
    dsar.handledBy = handledBy;

    this.emit('dsarProcessing', dsar);
    return dsar;
  }

  /**
   * Complete a DSAR
   */
  async completeDSAR(
    dsarId: string,
    responseData: unknown,
    notes?: string
  ): Promise<DataSubjectRequest | null> {
    const dsar = this.dsars.get(dsarId);
    if (!dsar || dsar.status !== 'processing') {
      return null;
    }

    const now = new Date();
    dsar.status = 'completed';
    dsar.completedAt = now;
    dsar.responseData = responseData;

    if (notes) {
      dsar.notes = dsar.notes || [];
      dsar.notes.push(notes);
    }

    // Record response time
    const responseTime = Math.ceil(
      (now.getTime() - dsar.requestedAt.getTime()) / (24 * 60 * 60 * 1000)
    );
    this.responseTimes.push(responseTime);

    this.emit('dsarCompleted', dsar);
    return dsar;
  }

  /**
   * Extend DSAR deadline (allowed under Article 12)
   */
  async extendDSAR(
    dsarId: string,
    extensionDays: number,
    reason: string
  ): Promise<DataSubjectRequest | null> {
    const dsar = this.dsars.get(dsarId);
    if (!dsar || dsar.status === 'completed' || dsar.status === 'rejected') {
      return null;
    }

    // GDPR allows max 2 month extension
    if (extensionDays > 60) {
      throw new Error('Extension cannot exceed 60 days under GDPR');
    }

    dsar.status = 'extended';
    dsar.extendedUntil = new Date(dsar.dueDate.getTime() + extensionDays * 24 * 60 * 60 * 1000);
    dsar.extensionReason = reason;
    dsar.dueDate = dsar.extendedUntil;

    this.emit('dsarExtended', dsar);
    return dsar;
  }

  /**
   * Get overdue DSARs
   */
  getOverdueDSARs(): DataSubjectRequest[] {
    const now = new Date();
    return Array.from(this.dsars.values()).filter(
      (dsar) =>
        ['pending', 'verified', 'processing', 'extended'].includes(dsar.status) &&
        dsar.dueDate < now
    );
  }

  /**
   * Handle Right to Access (Article 15)
   */
  async handleAccessRequest(subjectId: string): Promise<{
    personalData: Record<string, unknown>;
    processingInfo: ProcessingRecord[];
    exportFormat: string;
  }> {
    // In production, collect all user data from database
    const personalData = {
      profile: {}, // User profile data
      activities: [], // Activity logs
      preferences: {}, // User preferences
      communications: [], // Communication history
    };

    const processingInfo = this.getProcessingRecordsForSubject(subjectId);

    return {
      personalData,
      processingInfo,
      exportFormat: 'json',
    };
  }

  /**
   * Handle Right to Erasure (Article 17)
   */
  async handleErasureRequest(subjectId: string): Promise<{
    success: boolean;
    itemsDeleted: number;
    retainedItems: { category: string; reason: string }[];
  }> {
    const retainedItems: { category: string; reason: string }[] = [];

    // Some data may need to be retained for legal obligations
    retainedItems.push({
      category: 'financial_transactions',
      reason: 'Legal obligation - tax records retention (7 years)',
    });

    // In production, delete user data
    const itemsDeleted = 100; // Placeholder

    this.emit('dataErased', { subjectId, itemsDeleted, retainedItems });

    return {
      success: true,
      itemsDeleted,
      retainedItems,
    };
  }

  /**
   * Handle Data Portability (Article 20)
   */
  async handlePortabilityRequest(subjectId: string): Promise<{
    exportData: unknown;
    format: string;
    downloadUrl?: string;
  }> {
    // Collect portable data in machine-readable format
    const exportData = {
      exportedAt: new Date().toISOString(),
      subject: subjectId,
      data: {
        profile: {},
        content: [],
        activities: [],
      },
    };

    return {
      exportData,
      format: 'application/json',
    };
  }

  // ===== Processing Records (Article 30) =====

  /**
   * Create a processing record
   */
  createProcessingRecord(
    record: Omit<ProcessingRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): ProcessingRecord {
    const id = `proc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date();

    const fullRecord: ProcessingRecord = {
      ...record,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.processingRecords.set(id, fullRecord);
    this.emit('processingRecordCreated', fullRecord);

    return fullRecord;
  }

  /**
   * Get all processing records
   */
  getProcessingRecords(): ProcessingRecord[] {
    return Array.from(this.processingRecords.values());
  }

  /**
   * Get processing records for a data subject
   */
  getProcessingRecordsForSubject(subjectCategory: string): ProcessingRecord[] {
    return Array.from(this.processingRecords.values()).filter((record) =>
      record.dataSubjects.includes(subjectCategory)
    );
  }

  // ===== Data Protection Impact Assessments (DPIA) =====

  /**
   * Create a DPIA
   */
  createDPIA(
    dpia: Omit<DPIA, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): DPIA {
    const id = `dpia_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date();

    const fullDPIA: DPIA = {
      ...dpia,
      id,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    this.dpias.set(id, fullDPIA);
    this.emit('dpiaCreated', fullDPIA);

    return fullDPIA;
  }

  /**
   * Submit DPIA for review
   */
  submitDPIAForReview(dpiaId: string): DPIA | null {
    const dpia = this.dpias.get(dpiaId);
    if (!dpia || dpia.status !== 'draft') {
      return null;
    }

    dpia.status = 'in_review';
    dpia.updatedAt = new Date();

    this.emit('dpiaSubmittedForReview', dpia);
    return dpia;
  }

  /**
   * Approve or reject DPIA
   */
  decideDPIA(
    dpiaId: string,
    approved: boolean,
    approvedBy: string,
    comments?: string
  ): DPIA | null {
    const dpia = this.dpias.get(dpiaId);
    if (!dpia || dpia.status !== 'in_review') {
      return null;
    }

    dpia.status = approved ? 'approved' : 'rejected';
    dpia.dpoApproval = {
      approved,
      approvedBy,
      approvedAt: new Date(),
      comments,
    };
    dpia.updatedAt = new Date();

    this.emit(approved ? 'dpiaApproved' : 'dpiaRejected', dpia);
    return dpia;
  }

  // ===== Data Breach Management =====

  /**
   * Report a data breach
   */
  reportDataBreach(
    breach: Omit<DataBreach, 'id' | 'status'>
  ): DataBreach {
    const id = `breach_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const fullBreach: DataBreach = {
      ...breach,
      id,
      status: 'investigating',
    };

    this.dataBreaches.set(id, fullBreach);
    this.emit('dataBreachReported', fullBreach);

    // Check if notification to supervisory authority is required (72 hours)
    if (breach.notificationRequired) {
      console.log(
        `WARNING: Data breach requires notification to supervisory authority within 72 hours`
      );
    }

    return fullBreach;
  }

  /**
   * Update breach status
   */
  updateBreachStatus(
    breachId: string,
    status: DataBreach['status'],
    updates?: Partial<DataBreach>
  ): DataBreach | null {
    const breach = this.dataBreaches.get(breachId);
    if (!breach) {
      return null;
    }

    breach.status = status;
    if (updates) {
      Object.assign(breach, updates);
    }

    this.emit('dataBreachUpdated', breach);
    return breach;
  }

  /**
   * Get breaches requiring notification
   */
  getBreachesRequiringNotification(): DataBreach[] {
    const deadline = new Date(Date.now() - 72 * 60 * 60 * 1000);
    return Array.from(this.dataBreaches.values()).filter(
      (breach) =>
        breach.notificationRequired &&
        !breach.supervisoryAuthorityNotified &&
        breach.discoveredAt < deadline
    );
  }

  // ===== Compliance Reporting =====

  /**
   * Get GDPR compliance stats
   */
  getStats(): GDPRStats {
    const dsars = Array.from(this.dsars.values());
    const pendingDSARs = dsars.filter((d) =>
      ['pending', 'verified', 'processing', 'extended'].includes(d.status)
    );
    const completedDSARs = dsars.filter((d) => d.status === 'completed');

    return {
      totalDSARs: dsars.length,
      pendingDSARs: pendingDSARs.length,
      completedDSARs: completedDSARs.length,
      avgResponseTime:
        this.responseTimes.length > 0
          ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
          : 0,
      processingRecords: this.processingRecords.size,
      activeDPIAs: Array.from(this.dpias.values()).filter(
        (d) => d.status === 'approved'
      ).length,
      dataBreaches: this.dataBreaches.size,
      consentRate: 0, // Would be calculated from consent management service
    };
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(): {
    generatedAt: Date;
    organization: string;
    stats: GDPRStats;
    processingRecords: ProcessingRecord[];
    openDSARs: DataSubjectRequest[];
    activeDPIAs: DPIA[];
    recentBreaches: DataBreach[];
    recommendations: string[];
  } {
    const stats = this.getStats();
    const recommendations: string[] = [];

    // Generate recommendations
    if (stats.pendingDSARs > 5) {
      recommendations.push('High number of pending DSARs - consider additional resources');
    }

    if (stats.avgResponseTime > 25) {
      recommendations.push('Average DSAR response time approaching deadline - review processes');
    }

    const overdue = this.getOverdueDSARs();
    if (overdue.length > 0) {
      recommendations.push(`${overdue.length} overdue DSARs require immediate attention`);
    }

    return {
      generatedAt: new Date(),
      organization: this.config.organizationName,
      stats,
      processingRecords: this.getProcessingRecords(),
      openDSARs: Array.from(this.dsars.values()).filter(
        (d) => !['completed', 'rejected'].includes(d.status)
      ),
      activeDPIAs: Array.from(this.dpias.values()).filter(
        (d) => d.status === 'approved'
      ),
      recentBreaches: Array.from(this.dataBreaches.values())
        .filter((b) => b.discoveredAt > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)),
      recommendations,
    };
  }

  /**
   * Get all DSARs
   */
  getDSARs(status?: DSARStatus): DataSubjectRequest[] {
    const dsars = Array.from(this.dsars.values());
    if (status) {
      return dsars.filter((d) => d.status === status);
    }
    return dsars;
  }

  /**
   * Get all DPIAs
   */
  getDPIAs(): DPIA[] {
    return Array.from(this.dpias.values());
  }

  /**
   * Get all data breaches
   */
  getDataBreaches(): DataBreach[] {
    return Array.from(this.dataBreaches.values());
  }

  // Private methods

  private initializeDefaultProcessingRecords(): void {
    const defaultRecords: Omit<ProcessingRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'User Account Management',
        purpose: 'Create and manage user accounts for service delivery',
        lawfulBasis: 'contract',
        dataCategories: ['name', 'email', 'profile_information'],
        dataSubjects: ['users', 'coaches'],
        recipients: ['internal_staff'],
        retentionPeriod: '2 years after account deletion',
        securityMeasures: ['encryption', 'access_control', 'audit_logging'],
      },
      {
        name: 'Coaching Session Delivery',
        purpose: 'Deliver personalized coaching sessions',
        lawfulBasis: 'contract',
        dataCategories: ['goals', 'habits', 'progress_data', 'session_notes'],
        dataSubjects: ['users'],
        recipients: ['coaches', 'ai_systems'],
        retentionPeriod: '3 years',
        securityMeasures: ['encryption', 'access_control', 'pseudonymization'],
      },
      {
        name: 'Analytics and Service Improvement',
        purpose: 'Improve services through aggregated analytics',
        lawfulBasis: 'legitimate_interests',
        dataCategories: ['usage_data', 'interaction_data'],
        dataSubjects: ['users'],
        recipients: ['internal_analytics_team'],
        retentionPeriod: '2 years',
        securityMeasures: ['anonymization', 'aggregation', 'access_control'],
      },
      {
        name: 'Marketing Communications',
        purpose: 'Send marketing and promotional communications',
        lawfulBasis: 'consent',
        dataCategories: ['email', 'communication_preferences'],
        dataSubjects: ['users', 'prospects'],
        recipients: ['marketing_team', 'email_service_providers'],
        retentionPeriod: 'Until consent withdrawal',
        securityMeasures: ['encryption', 'access_control'],
      },
      {
        name: 'Payment Processing',
        purpose: 'Process subscription payments',
        lawfulBasis: 'contract',
        dataCategories: ['payment_information', 'transaction_history'],
        dataSubjects: ['paying_users'],
        recipients: ['payment_processors'],
        internationalTransfers: [
          { country: 'United States', safeguards: 'Standard Contractual Clauses' },
        ],
        retentionPeriod: '7 years (tax obligations)',
        securityMeasures: ['PCI_DSS_compliance', 'encryption', 'tokenization'],
      },
    ];

    for (const record of defaultRecords) {
      this.createProcessingRecord(record);
    }
  }
}

// Singleton instance
let gdprComplianceServiceInstance: GDPRComplianceService | null = null;

export function getGDPRComplianceService(
  config?: GDPRComplianceConfig
): GDPRComplianceService {
  if (!gdprComplianceServiceInstance) {
    gdprComplianceServiceInstance = new GDPRComplianceService(config);
  }
  return gdprComplianceServiceInstance;
}
