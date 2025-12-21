/**
 * HIPAA Compliance Service
 *
 * Implements Health Insurance Portability and Accountability Act requirements:
 * - Protected Health Information (PHI) management
 * - Access controls and audit logging
 * - Minimum necessary standard
 * - Business Associate Agreements tracking
 * - Security incident management
 * - Risk assessments
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

// Types
export type PHICategory =
  | 'health_status'
  | 'medical_history'
  | 'treatment_plans'
  | 'medications'
  | 'mental_health'
  | 'substance_abuse'
  | 'genetic_information'
  | 'biometric_data';

export type AccessLevel = 'none' | 'view' | 'create' | 'modify' | 'delete' | 'full';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PHIAccessLog {
  id: string;
  userId: string;
  patientId: string;
  phiCategory: PHICategory;
  accessType: 'view' | 'create' | 'modify' | 'delete' | 'export' | 'print';
  accessLevel: AccessLevel;
  reason: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  approved: boolean;
  approvedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface AccessControl {
  id: string;
  userId: string;
  role: string;
  permissions: {
    category: PHICategory;
    level: AccessLevel;
    restrictions?: string[];
  }[];
  effectiveFrom: Date;
  effectiveUntil?: Date;
  grantedBy: string;
  grantedAt: Date;
  lastReviewedAt?: Date;
  reviewedBy?: string;
}

export interface BusinessAssociate {
  id: string;
  name: string;
  type: 'vendor' | 'contractor' | 'partner' | 'subcontractor';
  services: string[];
  phiAccess: PHICategory[];
  baaSignedAt: Date;
  baaExpiresAt?: Date;
  contactName: string;
  contactEmail: string;
  securityAssessmentDate?: Date;
  securityScore?: number;
  status: 'active' | 'pending' | 'suspended' | 'terminated';
  notes?: string[];
}

export interface SecurityIncident {
  id: string;
  type: 'breach' | 'unauthorized_access' | 'system_failure' | 'policy_violation' | 'other';
  severity: IncidentSeverity;
  description: string;
  discoveredAt: Date;
  discoveredBy: string;
  affectedPHI: PHICategory[];
  affectedPatients: number;
  status: 'investigating' | 'contained' | 'resolved' | 'reported';
  containmentActions: string[];
  correctiveActions: string[];
  breachNotificationRequired: boolean;
  reportedToHHS?: Date;
  patientsNotified?: Date;
  mediaNotified?: Date;
  rootCause?: string;
  lessonsLearned?: string;
}

export interface RiskAssessment {
  id: string;
  name: string;
  scope: string;
  assessedAt: Date;
  assessedBy: string;
  risks: Risk[];
  overallRiskLevel: RiskLevel;
  nextAssessmentDue: Date;
  status: 'draft' | 'in_progress' | 'completed' | 'approved';
  approvedBy?: string;
  approvedAt?: Date;
}

export interface Risk {
  id: string;
  category: string;
  description: string;
  threat: string;
  vulnerability: string;
  likelihood: 'rare' | 'unlikely' | 'possible' | 'likely' | 'almost_certain';
  impact: 'negligible' | 'minor' | 'moderate' | 'major' | 'catastrophic';
  riskLevel: RiskLevel;
  existingControls: string[];
  proposedControls: string[];
  residualRisk: RiskLevel;
  owner?: string;
  mitigationDeadline?: Date;
  mitigationStatus?: 'not_started' | 'in_progress' | 'completed';
}

export interface TrainingRecord {
  id: string;
  userId: string;
  trainingType: 'initial' | 'annual' | 'role_specific' | 'incident_response';
  trainingName: string;
  completedAt: Date;
  score?: number;
  passed: boolean;
  certificateUrl?: string;
  expiresAt: Date;
}

export interface HIPAAStats {
  totalPHIAccessLogs: number;
  unauthorizedAccessAttempts: number;
  activeBusinessAssociates: number;
  pendingBAAs: number;
  openIncidents: number;
  riskAssessmentsDue: number;
  trainingComplianceRate: number;
  lastRiskAssessment?: Date;
}

export interface HIPAAComplianceConfig {
  accessLogRetentionYears?: number;
  riskAssessmentIntervalMonths?: number;
  trainingExpirationMonths?: number;
  breachNotificationDays?: number;
  minimumTrainingScore?: number;
}

// HIPAA Compliance Service
export class HIPAAComplianceService extends EventEmitter {
  private config: Required<HIPAAComplianceConfig>;
  private accessLogs: Map<string, PHIAccessLog> = new Map();
  private accessControls: Map<string, AccessControl> = new Map();
  private businessAssociates: Map<string, BusinessAssociate> = new Map();
  private incidents: Map<string, SecurityIncident> = new Map();
  private riskAssessments: Map<string, RiskAssessment> = new Map();
  private trainingRecords: Map<string, TrainingRecord[]> = new Map();

  constructor(config: HIPAAComplianceConfig = {}) {
    super();
    this.config = {
      accessLogRetentionYears: config.accessLogRetentionYears || 6,
      riskAssessmentIntervalMonths: config.riskAssessmentIntervalMonths || 12,
      trainingExpirationMonths: config.trainingExpirationMonths || 12,
      breachNotificationDays: config.breachNotificationDays || 60,
      minimumTrainingScore: config.minimumTrainingScore || 80,
    };
  }

  /**
   * Initialize HIPAA compliance service
   */
  async initialize(): Promise<void> {
    console.log('HIPAAComplianceService initialized');
    this.emit('initialized');
  }

  // ===== PHI Access Management =====

  /**
   * Log PHI access
   */
  logPHIAccess(
    log: Omit<PHIAccessLog, 'id' | 'timestamp' | 'approved'>
  ): PHIAccessLog {
    const id = `phi_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Check if access is authorized
    const authorized = this.checkAccessAuthorization(
      log.userId,
      log.phiCategory,
      log.accessType
    );

    const fullLog: PHIAccessLog = {
      ...log,
      id,
      timestamp: new Date(),
      approved: authorized,
    };

    this.accessLogs.set(id, fullLog);

    if (!authorized) {
      this.emit('unauthorizedAccess', fullLog);
      console.log(`UNAUTHORIZED PHI access attempt: ${log.userId} -> ${log.phiCategory}`);
    }

    this.emit('phiAccessed', fullLog);
    return fullLog;
  }

  /**
   * Check if user is authorized to access PHI
   */
  checkAccessAuthorization(
    userId: string,
    category: PHICategory,
    accessType: PHIAccessLog['accessType']
  ): boolean {
    const controls = Array.from(this.accessControls.values()).filter(
      (c) => c.userId === userId
    );

    if (controls.length === 0) {
      return false;
    }

    const now = new Date();
    const activeControl = controls.find(
      (c) =>
        c.effectiveFrom <= now && (!c.effectiveUntil || c.effectiveUntil >= now)
    );

    if (!activeControl) {
      return false;
    }

    const permission = activeControl.permissions.find((p) => p.category === category);
    if (!permission) {
      return false;
    }

    // Map access types to required levels
    const requiredLevels: Record<PHIAccessLog['accessType'], AccessLevel[]> = {
      view: ['view', 'create', 'modify', 'delete', 'full'],
      create: ['create', 'modify', 'delete', 'full'],
      modify: ['modify', 'delete', 'full'],
      delete: ['delete', 'full'],
      export: ['view', 'full'],
      print: ['view', 'full'],
    };

    return requiredLevels[accessType].includes(permission.level);
  }

  /**
   * Grant access control
   */
  grantAccessControl(
    control: Omit<AccessControl, 'id' | 'grantedAt'>
  ): AccessControl {
    const id = `ac_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const fullControl: AccessControl = {
      ...control,
      id,
      grantedAt: new Date(),
    };

    this.accessControls.set(id, fullControl);
    this.emit('accessControlGranted', fullControl);

    return fullControl;
  }

  /**
   * Revoke access control
   */
  revokeAccessControl(controlId: string): boolean {
    const control = this.accessControls.get(controlId);
    if (!control) {
      return false;
    }

    control.effectiveUntil = new Date();
    this.emit('accessControlRevoked', control);

    return true;
  }

  /**
   * Review access control
   */
  reviewAccessControl(controlId: string, reviewedBy: string): AccessControl | null {
    const control = this.accessControls.get(controlId);
    if (!control) {
      return null;
    }

    control.lastReviewedAt = new Date();
    control.reviewedBy = reviewedBy;

    this.emit('accessControlReviewed', control);
    return control;
  }

  /**
   * Get access controls needing review
   */
  getAccessControlsNeedingReview(monthsWithoutReview: number = 3): AccessControl[] {
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() - monthsWithoutReview);

    return Array.from(this.accessControls.values()).filter((control) => {
      if (control.effectiveUntil && control.effectiveUntil < new Date()) {
        return false; // Expired
      }
      return !control.lastReviewedAt || control.lastReviewedAt < threshold;
    });
  }

  // ===== Business Associate Agreements =====

  /**
   * Register business associate
   */
  registerBusinessAssociate(
    ba: Omit<BusinessAssociate, 'id' | 'status' | 'notes'>
  ): BusinessAssociate {
    const id = `ba_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const fullBA: BusinessAssociate = {
      ...ba,
      id,
      status: 'pending',
      notes: [],
    };

    this.businessAssociates.set(id, fullBA);
    this.emit('businessAssociateRegistered', fullBA);

    return fullBA;
  }

  /**
   * Activate business associate (after BAA signed)
   */
  activateBusinessAssociate(baId: string): BusinessAssociate | null {
    const ba = this.businessAssociates.get(baId);
    if (!ba) {
      return null;
    }

    ba.status = 'active';
    this.emit('businessAssociateActivated', ba);

    return ba;
  }

  /**
   * Terminate business associate
   */
  terminateBusinessAssociate(baId: string, reason: string): BusinessAssociate | null {
    const ba = this.businessAssociates.get(baId);
    if (!ba) {
      return null;
    }

    ba.status = 'terminated';
    ba.notes = ba.notes || [];
    ba.notes.push(`Terminated: ${reason} at ${new Date().toISOString()}`);

    this.emit('businessAssociateTerminated', ba);

    return ba;
  }

  /**
   * Get BAs with expiring agreements
   */
  getExpiringBAAs(daysAhead: number = 90): BusinessAssociate[] {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysAhead);

    return Array.from(this.businessAssociates.values()).filter(
      (ba) =>
        ba.status === 'active' &&
        ba.baaExpiresAt &&
        ba.baaExpiresAt <= threshold
    );
  }

  // ===== Security Incidents =====

  /**
   * Report security incident
   */
  reportIncident(
    incident: Omit<SecurityIncident, 'id' | 'status' | 'containmentActions' | 'correctiveActions'>
  ): SecurityIncident {
    const id = `inc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const fullIncident: SecurityIncident = {
      ...incident,
      id,
      status: 'investigating',
      containmentActions: [],
      correctiveActions: [],
    };

    this.incidents.set(id, fullIncident);
    this.emit('incidentReported', fullIncident);

    // Check if breach notification is required
    if (fullIncident.breachNotificationRequired) {
      console.log(
        `HIPAA BREACH: Notification required within ${this.config.breachNotificationDays} days`
      );
    }

    return fullIncident;
  }

  /**
   * Update incident status
   */
  updateIncidentStatus(
    incidentId: string,
    status: SecurityIncident['status'],
    updates?: Partial<SecurityIncident>
  ): SecurityIncident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return null;
    }

    incident.status = status;
    if (updates) {
      Object.assign(incident, updates);
    }

    this.emit('incidentUpdated', incident);
    return incident;
  }

  /**
   * Add containment action
   */
  addContainmentAction(incidentId: string, action: string): SecurityIncident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return null;
    }

    incident.containmentActions.push(`[${new Date().toISOString()}] ${action}`);
    this.emit('containmentActionAdded', { incident, action });

    return incident;
  }

  /**
   * Get incidents requiring breach notification
   */
  getIncidentsRequiringNotification(): SecurityIncident[] {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() - this.config.breachNotificationDays);

    return Array.from(this.incidents.values()).filter(
      (incident) =>
        incident.breachNotificationRequired &&
        !incident.reportedToHHS &&
        incident.discoveredAt < deadline
    );
  }

  // ===== Risk Assessments =====

  /**
   * Create risk assessment
   */
  createRiskAssessment(
    assessment: Omit<RiskAssessment, 'id' | 'status' | 'overallRiskLevel'>
  ): RiskAssessment {
    const id = `ra_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const overallRiskLevel = this.calculateOverallRisk(assessment.risks);

    const fullAssessment: RiskAssessment = {
      ...assessment,
      id,
      status: 'draft',
      overallRiskLevel,
    };

    this.riskAssessments.set(id, fullAssessment);
    this.emit('riskAssessmentCreated', fullAssessment);

    return fullAssessment;
  }

  /**
   * Complete risk assessment
   */
  completeRiskAssessment(assessmentId: string): RiskAssessment | null {
    const assessment = this.riskAssessments.get(assessmentId);
    if (!assessment) {
      return null;
    }

    assessment.status = 'completed';
    assessment.overallRiskLevel = this.calculateOverallRisk(assessment.risks);

    this.emit('riskAssessmentCompleted', assessment);
    return assessment;
  }

  /**
   * Approve risk assessment
   */
  approveRiskAssessment(
    assessmentId: string,
    approvedBy: string
  ): RiskAssessment | null {
    const assessment = this.riskAssessments.get(assessmentId);
    if (!assessment || assessment.status !== 'completed') {
      return null;
    }

    assessment.status = 'approved';
    assessment.approvedBy = approvedBy;
    assessment.approvedAt = new Date();

    this.emit('riskAssessmentApproved', assessment);
    return assessment;
  }

  /**
   * Get overdue risk assessments
   */
  getOverdueRiskAssessments(): string[] {
    const assessments = Array.from(this.riskAssessments.values());
    const now = new Date();

    // Check if any approved assessments are overdue for renewal
    const overdue: string[] = [];

    for (const assessment of assessments) {
      if (assessment.status === 'approved' && assessment.nextAssessmentDue < now) {
        overdue.push(assessment.scope);
      }
    }

    return overdue;
  }

  // ===== Training Compliance =====

  /**
   * Record training completion
   */
  recordTraining(
    record: Omit<TrainingRecord, 'id' | 'passed' | 'expiresAt'>
  ): TrainingRecord {
    const id = `tr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const passed = !record.score || record.score >= this.config.minimumTrainingScore;

    const expiresAt = new Date(record.completedAt);
    expiresAt.setMonth(expiresAt.getMonth() + this.config.trainingExpirationMonths);

    const fullRecord: TrainingRecord = {
      ...record,
      id,
      passed,
      expiresAt,
    };

    const userRecords = this.trainingRecords.get(record.userId) || [];
    userRecords.push(fullRecord);
    this.trainingRecords.set(record.userId, userRecords);

    this.emit('trainingCompleted', fullRecord);

    return fullRecord;
  }

  /**
   * Check if user has valid training
   */
  hasValidTraining(userId: string, trainingType?: TrainingRecord['trainingType']): boolean {
    const records = this.trainingRecords.get(userId) || [];
    const now = new Date();

    return records.some(
      (r) =>
        r.passed &&
        r.expiresAt > now &&
        (!trainingType || r.trainingType === trainingType)
    );
  }

  /**
   * Get users with expiring training
   */
  getUsersWithExpiringTraining(daysAhead: number = 30): string[] {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysAhead);

    const usersNeedingTraining: Set<string> = new Set();

    for (const [userId, records] of this.trainingRecords.entries()) {
      const latestRecord = records
        .filter((r) => r.passed)
        .sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime())[0];

      if (!latestRecord || latestRecord.expiresAt <= threshold) {
        usersNeedingTraining.add(userId);
      }
    }

    return Array.from(usersNeedingTraining);
  }

  // ===== Reporting =====

  /**
   * Get HIPAA compliance stats
   */
  getStats(): HIPAAStats {
    const accessLogs = Array.from(this.accessLogs.values());
    const trainingRecords = Array.from(this.trainingRecords.values()).flat();
    const now = new Date();

    const validTrainingCount = trainingRecords.filter(
      (r) => r.passed && r.expiresAt > now
    ).length;
    const totalUsers = this.trainingRecords.size;

    // Get last completed risk assessment
    const completedAssessments = Array.from(this.riskAssessments.values())
      .filter((a) => a.status === 'approved')
      .sort((a, b) => (b.approvedAt?.getTime() || 0) - (a.approvedAt?.getTime() || 0));

    return {
      totalPHIAccessLogs: accessLogs.length,
      unauthorizedAccessAttempts: accessLogs.filter((l) => !l.approved).length,
      activeBusinessAssociates: Array.from(this.businessAssociates.values()).filter(
        (ba) => ba.status === 'active'
      ).length,
      pendingBAAs: Array.from(this.businessAssociates.values()).filter(
        (ba) => ba.status === 'pending'
      ).length,
      openIncidents: Array.from(this.incidents.values()).filter(
        (i) => !['resolved', 'reported'].includes(i.status)
      ).length,
      riskAssessmentsDue: this.getOverdueRiskAssessments().length,
      trainingComplianceRate: totalUsers > 0 ? (validTrainingCount / totalUsers) * 100 : 100,
      lastRiskAssessment: completedAssessments[0]?.approvedAt,
    };
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(): {
    generatedAt: Date;
    stats: HIPAAStats;
    accessControlsNeedingReview: AccessControl[];
    expiringBAAs: BusinessAssociate[];
    openIncidents: SecurityIncident[];
    overdueRiskAssessments: string[];
    usersNeedingTraining: string[];
    recommendations: string[];
  } {
    const stats = this.getStats();
    const recommendations: string[] = [];

    if (stats.unauthorizedAccessAttempts > 0) {
      recommendations.push(
        `${stats.unauthorizedAccessAttempts} unauthorized access attempts detected - review access controls`
      );
    }

    if (stats.openIncidents > 0) {
      recommendations.push(`${stats.openIncidents} security incidents require attention`);
    }

    if (stats.trainingComplianceRate < 100) {
      recommendations.push(
        `Training compliance at ${stats.trainingComplianceRate.toFixed(1)}% - schedule refresher training`
      );
    }

    if (stats.riskAssessmentsDue > 0) {
      recommendations.push(`${stats.riskAssessmentsDue} risk assessments are overdue`);
    }

    return {
      generatedAt: new Date(),
      stats,
      accessControlsNeedingReview: this.getAccessControlsNeedingReview(),
      expiringBAAs: this.getExpiringBAAs(),
      openIncidents: Array.from(this.incidents.values()).filter(
        (i) => !['resolved', 'reported'].includes(i.status)
      ),
      overdueRiskAssessments: this.getOverdueRiskAssessments(),
      usersNeedingTraining: this.getUsersWithExpiringTraining(),
      recommendations,
    };
  }

  // Private methods

  private calculateOverallRisk(risks: Risk[]): RiskLevel {
    if (risks.length === 0) return 'low';

    const levels: Record<RiskLevel, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };

    const avgScore =
      risks.reduce((sum, r) => sum + levels[r.riskLevel], 0) / risks.length;

    if (avgScore >= 3.5) return 'critical';
    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    return 'low';
  }
}

// Singleton instance
let hipaaComplianceServiceInstance: HIPAAComplianceService | null = null;

export function getHIPAAComplianceService(
  config?: HIPAAComplianceConfig
): HIPAAComplianceService {
  if (!hipaaComplianceServiceInstance) {
    hipaaComplianceServiceInstance = new HIPAAComplianceService(config);
  }
  return hipaaComplianceServiceInstance;
}
