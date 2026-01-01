import { Pool, PoolClient } from 'pg';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { CloudTrailClient, LookupEventsCommand, LookupEventsCommandInput } from '@aws-sdk/client-cloudtrail';
import { Logger } from 'winston';
import crypto from 'crypto';

export enum TrustServicePrinciple {
  SECURITY = 'security',
  AVAILABILITY = 'availability',
  PROCESSING_INTEGRITY = 'processing_integrity',
  CONFIDENTIALITY = 'confidentiality',
  PRIVACY = 'privacy',
}

export enum ControlCategory {
  ACCESS_CONTROL = 'access_control',
  CHANGE_MANAGEMENT = 'change_management',
  DATA_ENCRYPTION = 'data_encryption',
  INCIDENT_RESPONSE = 'incident_response',
  MONITORING = 'monitoring',
  BACKUP_RECOVERY = 'backup_recovery',
  VENDOR_MANAGEMENT = 'vendor_management',
  RISK_MANAGEMENT = 'risk_management',
}

export enum ControlStatus {
  EFFECTIVE = 'effective',
  INEFFECTIVE = 'ineffective',
  NOT_TESTED = 'not_tested',
  IN_REMEDIATION = 'in_remediation',
}

export enum RiskLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum AuditEventType {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  PERMISSION_CHANGE = 'permission_change',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  DATA_DELETION = 'data_deletion',
  CONFIGURATION_CHANGE = 'configuration_change',
  SECURITY_ALERT = 'security_alert',
  SYSTEM_ERROR = 'system_error',
  BACKUP_CREATED = 'backup_created',
  BACKUP_RESTORED = 'backup_restored',
}

export enum ChangeType {
  INFRASTRUCTURE = 'infrastructure',
  APPLICATION = 'application',
  DATABASE = 'database',
  SECURITY = 'security',
  CONFIGURATION = 'configuration',
}

export enum ChangeStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ROLLED_BACK = 'rolled_back',
}

export interface SOC2Control {
  id: string;
  controlId: string;
  principle: TrustServicePrinciple;
  category: ControlCategory;
  title: string;
  description: string;
  implementationDetails: string;
  status: ControlStatus;
  owner: string;
  testFrequency: string;
  lastTested?: Date;
  nextTestDue?: Date;
  evidenceRequired: string[];
  automatedControl: boolean;
  compensatingControls?: string[];
  metadata: Record<string, any>;
}

export interface ControlTest {
  id: string;
  controlId: string;
  testedAt: Date;
  testedBy: string;
  testProcedure: string;
  testResults: string;
  status: ControlStatus;
  findings: string[];
  recommendations: string[];
  evidenceCollected: string[];
  nextTestDate: Date;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  resource: string;
  action: string;
  result: 'success' | 'failure';
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  principle: TrustServicePrinciple[];
}

export interface ChangeRequest {
  id: string;
  changeType: ChangeType;
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: Date;
  status: ChangeStatus;
  approvedBy?: string;
  approvedAt?: Date;
  implementedBy?: string;
  implementedAt?: Date;
  completedAt?: Date;
  rollbackPlan: string;
  testingPlan: string;
  impactAssessment: string;
  affectedSystems: string[];
  downtime: boolean;
  downtimeWindow?: string;
  approvers: string[];
  metadata: Record<string, any>;
}

export interface RiskAssessment {
  id: string;
  riskId: string;
  title: string;
  description: string;
  category: string;
  principle: TrustServicePrinciple[];
  likelihood: number;
  impact: number;
  inherentRisk: number;
  residualRisk: number;
  riskLevel: RiskLevel;
  owner: string;
  mitigationControls: string[];
  status: 'open' | 'mitigated' | 'accepted' | 'transferred' | 'closed';
  identifiedAt: Date;
  lastReviewed: Date;
  nextReview: Date;
  metadata: Record<string, any>;
}

export interface Evidence {
  id: string;
  controlId: string;
  evidenceType: string;
  title: string;
  description: string;
  collectedAt: Date;
  collectedBy: string;
  period: { start: Date; end: Date };
  s3Key: string;
  fileSize: number;
  checksum: string;
  metadata: Record<string, any>;
}

export interface AccessPolicy {
  id: string;
  policyName: string;
  principle: TrustServicePrinciple[];
  resources: string[];
  actions: string[];
  conditions: Record<string, any>;
  grantees: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  active: boolean;
}

export interface IncidentReport {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  severity: RiskLevel;
  detectedAt: Date;
  reportedAt: Date;
  reportedBy: string;
  affectedPrinciples: TrustServicePrinciple[];
  affectedSystems: string[];
  rootCause?: string;
  containmentActions: string[];
  remediation?: string;
  status: 'open' | 'investigating' | 'contained' | 'resolved';
  resolvedAt?: Date;
  lessonsLearned?: string;
}

export interface ComplianceMetrics {
  controlEffectiveness: number;
  auditCoverage: number;
  incidentResponseTime: number;
  changeSuccessRate: number;
  riskScore: number;
  availabilityPercent: number;
  securityPosture: number;
}

export interface SOC2ComplianceConfig {
  databasePool: Pool;
  redis: Redis;
  s3Client: S3Client;
  cloudTrailClient: CloudTrailClient;
  logger: Logger;
  evidenceQueue: Queue;
  kmsKeyId: string;
  s3BucketName: string;
  cloudTrailName: string;
  organizationName: string;
  complianceOfficerEmail: string;
  controlTestFrequencyDays: number;
  riskReviewFrequencyDays: number;
  changeApprovalRequired: boolean;
}

export class SOC2ComplianceService {
  private pool: Pool;
  private redis: Redis;
  private s3Client: S3Client;
  private cloudTrailClient: CloudTrailClient;
  private logger: Logger;
  private evidenceQueue: Queue;
  private kmsKeyId: string;
  private s3BucketName: string;
  private cloudTrailName: string;
  private organizationName: string;
  private complianceOfficerEmail: string;
  private controlTestFrequencyDays: number;
  private riskReviewFrequencyDays: number;
  private changeApprovalRequired: boolean;

  constructor(config: SOC2ComplianceConfig) {
    this.pool = config.databasePool;
    this.redis = config.redis;
    this.s3Client = config.s3Client;
    this.cloudTrailClient = config.cloudTrailClient;
    this.logger = config.logger;
    this.evidenceQueue = config.evidenceQueue;
    this.kmsKeyId = config.kmsKeyId;
    this.s3BucketName = config.s3BucketName;
    this.cloudTrailName = config.cloudTrailName;
    this.organizationName = config.organizationName;
    this.complianceOfficerEmail = config.complianceOfficerEmail;
    this.controlTestFrequencyDays = config.controlTestFrequencyDays;
    this.riskReviewFrequencyDays = config.riskReviewFrequencyDays;
    this.changeApprovalRequired = config.changeApprovalRequired;
  }

  async createControl(control: Omit<SOC2Control, 'id'>): Promise<SOC2Control> {
    const client = await this.pool.connect();
    try {
      const nextTestDue = new Date();
      nextTestDue.setDate(nextTestDue.getDate() + this.controlTestFrequencyDays);

      const result = await client.query(
        `INSERT INTO soc2_controls (
          control_id, principle, category, title, description,
          implementation_details, status, owner, test_frequency,
          next_test_due, evidence_required, automated_control,
          compensating_controls, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          control.controlId,
          control.principle,
          control.category,
          control.title,
          control.description,
          control.implementationDetails,
          control.status || ControlStatus.NOT_TESTED,
          control.owner,
          control.testFrequency,
          nextTestDue,
          JSON.stringify(control.evidenceRequired),
          control.automatedControl,
          JSON.stringify(control.compensatingControls || []),
          JSON.stringify(control.metadata),
        ]
      );

      await this.logAuditEvent(client, {
        eventType: AuditEventType.CONFIGURATION_CHANGE,
        userId: 'system',
        ipAddress: '127.0.0.1',
        resource: 'soc2_controls',
        action: 'create',
        result: 'success',
        details: { controlId: control.controlId, principle: control.principle },
        severity: 'info',
        principle: [control.principle],
      });

      this.logger.info('SOC2 control created', {
        controlId: control.controlId,
        principle: control.principle,
      });

      return this.mapRowToControl(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to create SOC2 control', { error, control });
      throw error;
    } finally {
      client.release();
    }
  }

  async testControl(
    controlId: string,
    testedBy: string,
    testProcedure: string,
    testResults: string,
    findings: string[],
    evidenceCollected: string[]
  ): Promise<ControlTest> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const control = await client.query(
        'SELECT * FROM soc2_controls WHERE control_id = $1',
        [controlId]
      );

      if (control.rows.length === 0) {
        throw new Error('Control not found');
      }

      const status = findings.length === 0 ? ControlStatus.EFFECTIVE : ControlStatus.INEFFECTIVE;
      const nextTestDate = new Date();
      nextTestDate.setDate(nextTestDate.getDate() + this.controlTestFrequencyDays);

      const result = await client.query(
        `INSERT INTO soc2_control_tests (
          control_id, tested_at, tested_by, test_procedure, test_results,
          status, findings, recommendations, evidence_collected, next_test_date
        ) VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          controlId,
          testedBy,
          testProcedure,
          testResults,
          status,
          JSON.stringify(findings),
          JSON.stringify([]),
          JSON.stringify(evidenceCollected),
          nextTestDate,
        ]
      );

      await client.query(
        `UPDATE soc2_controls
        SET status = $1, last_tested = NOW(), next_test_due = $2
        WHERE control_id = $3`,
        [status, nextTestDate, controlId]
      );

      await this.logAuditEvent(client, {
        eventType: AuditEventType.CONFIGURATION_CHANGE,
        userId: testedBy,
        ipAddress: '127.0.0.1',
        resource: 'soc2_control_tests',
        action: 'test',
        result: 'success',
        details: { controlId, status, findingsCount: findings.length },
        severity: status === ControlStatus.INEFFECTIVE ? 'warning' : 'info',
        principle: [control.rows[0].principle],
      });

      await client.query('COMMIT');

      this.logger.info('Control test completed', {
        controlId,
        status,
        findingsCount: findings.length,
      });

      return this.mapRowToControlTest(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to test control', { error, controlId });
      throw error;
    } finally {
      client.release();
    }
  }

  async logAuditEvent(
    client: PoolClient,
    event: Omit<AuditLog, 'id' | 'timestamp'>
  ): Promise<AuditLog> {
    const result = await client.query(
      `INSERT INTO soc2_audit_logs (
        timestamp, event_type, user_id, ip_address, user_agent,
        resource, action, result, details, severity, principle
      ) VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        event.eventType,
        event.userId,
        event.ipAddress,
        event.userAgent,
        event.resource,
        event.action,
        event.result,
        JSON.stringify(event.details),
        event.severity,
        JSON.stringify(event.principle),
      ]
    );

    await this.redis.zadd(
      'audit-events:recent',
      Date.now(),
      JSON.stringify({
        id: result.rows[0].id,
        eventType: event.eventType,
        severity: event.severity,
      })
    );

    await this.redis.zremrangebyrank('audit-events:recent', 0, -1001);

    return this.mapRowToAuditLog(result.rows[0]);
  }

  async searchAuditLogs(
    filters: {
      startDate?: Date;
      endDate?: Date;
      eventType?: AuditEventType;
      userId?: string;
      resource?: string;
      severity?: string;
      principle?: TrustServicePrinciple;
    },
    limit: number = 100,
    offset: number = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const conditions: string[] = ['1=1'];
      const values: any[] = [];
      let paramCount = 1;

      if (filters.startDate) {
        conditions.push(`timestamp >= $${paramCount}`);
        values.push(filters.startDate);
        paramCount++;
      }

      if (filters.endDate) {
        conditions.push(`timestamp <= $${paramCount}`);
        values.push(filters.endDate);
        paramCount++;
      }

      if (filters.eventType) {
        conditions.push(`event_type = $${paramCount}`);
        values.push(filters.eventType);
        paramCount++;
      }

      if (filters.userId) {
        conditions.push(`user_id = $${paramCount}`);
        values.push(filters.userId);
        paramCount++;
      }

      if (filters.resource) {
        conditions.push(`resource = $${paramCount}`);
        values.push(filters.resource);
        paramCount++;
      }

      if (filters.severity) {
        conditions.push(`severity = $${paramCount}`);
        values.push(filters.severity);
        paramCount++;
      }

      if (filters.principle) {
        conditions.push(`principle @> $${paramCount}`);
        values.push(JSON.stringify([filters.principle]));
        paramCount++;
      }

      const countQuery = `SELECT COUNT(*) FROM soc2_audit_logs WHERE ${conditions.join(' AND ')}`;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      values.push(limit, offset);
      const query = `
        SELECT * FROM soc2_audit_logs
        WHERE ${conditions.join(' AND ')}
        ORDER BY timestamp DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      const result = await client.query(query, values);
      const logs = result.rows.map(row => this.mapRowToAuditLog(row));

      return { logs, total };
    } catch (error) {
      this.logger.error('Failed to search audit logs', { error, filters });
      throw error;
    } finally {
      client.release();
    }
  }

  async createChangeRequest(change: Omit<ChangeRequest, 'id' | 'requestedAt' | 'status'>): Promise<ChangeRequest> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const status = this.changeApprovalRequired ? ChangeStatus.PENDING_APPROVAL : ChangeStatus.APPROVED;

      const result = await client.query(
        `INSERT INTO soc2_change_requests (
          change_type, title, description, requested_by, requested_at,
          status, rollback_plan, testing_plan, impact_assessment,
          affected_systems, downtime, downtime_window, approvers, metadata
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          change.changeType,
          change.title,
          change.description,
          change.requestedBy,
          status,
          change.rollbackPlan,
          change.testingPlan,
          change.impactAssessment,
          JSON.stringify(change.affectedSystems),
          change.downtime,
          change.downtimeWindow,
          JSON.stringify(change.approvers),
          JSON.stringify(change.metadata),
        ]
      );

      await this.logAuditEvent(client, {
        eventType: AuditEventType.CONFIGURATION_CHANGE,
        userId: change.requestedBy,
        ipAddress: '127.0.0.1',
        resource: 'soc2_change_requests',
        action: 'create',
        result: 'success',
        details: { changeId: result.rows[0].id, changeType: change.changeType },
        severity: 'info',
        principle: [TrustServicePrinciple.SECURITY, TrustServicePrinciple.AVAILABILITY],
      });

      await client.query('COMMIT');

      this.logger.info('Change request created', {
        changeId: result.rows[0].id,
        changeType: change.changeType,
      });

      return this.mapRowToChangeRequest(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to create change request', { error, change });
      throw error;
    } finally {
      client.release();
    }
  }

  async approveChangeRequest(changeId: string, approvedBy: string): Promise<ChangeRequest> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE soc2_change_requests
        SET status = $1, approved_by = $2, approved_at = NOW()
        WHERE id = $3
        RETURNING *`,
        [ChangeStatus.APPROVED, approvedBy, changeId]
      );

      if (result.rows.length === 0) {
        throw new Error('Change request not found');
      }

      await this.logAuditEvent(client, {
        eventType: AuditEventType.CONFIGURATION_CHANGE,
        userId: approvedBy,
        ipAddress: '127.0.0.1',
        resource: 'soc2_change_requests',
        action: 'approve',
        result: 'success',
        details: { changeId },
        severity: 'info',
        principle: [TrustServicePrinciple.SECURITY],
      });

      await client.query('COMMIT');

      this.logger.info('Change request approved', { changeId, approvedBy });

      return this.mapRowToChangeRequest(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to approve change request', { error, changeId });
      throw error;
    } finally {
      client.release();
    }
  }

  async completeChangeRequest(changeId: string, implementedBy: string): Promise<ChangeRequest> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE soc2_change_requests
        SET status = $1, implemented_by = $2, implemented_at = NOW(), completed_at = NOW()
        WHERE id = $3 AND status = $4
        RETURNING *`,
        [ChangeStatus.COMPLETED, implementedBy, changeId, ChangeStatus.APPROVED]
      );

      if (result.rows.length === 0) {
        throw new Error('Change request not found or not approved');
      }

      await this.logAuditEvent(client, {
        eventType: AuditEventType.CONFIGURATION_CHANGE,
        userId: implementedBy,
        ipAddress: '127.0.0.1',
        resource: 'soc2_change_requests',
        action: 'complete',
        result: 'success',
        details: { changeId },
        severity: 'info',
        principle: [TrustServicePrinciple.SECURITY, TrustServicePrinciple.AVAILABILITY],
      });

      await client.query('COMMIT');

      this.logger.info('Change request completed', { changeId, implementedBy });

      return this.mapRowToChangeRequest(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to complete change request', { error, changeId });
      throw error;
    } finally {
      client.release();
    }
  }

  async createRiskAssessment(risk: Omit<RiskAssessment, 'id' | 'identifiedAt'>): Promise<RiskAssessment> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const inherentRisk = risk.likelihood * risk.impact;
      const residualRisk = risk.residualRisk || inherentRisk;

      let riskLevel: RiskLevel;
      if (residualRisk >= 16) riskLevel = RiskLevel.CRITICAL;
      else if (residualRisk >= 9) riskLevel = RiskLevel.HIGH;
      else if (residualRisk >= 4) riskLevel = RiskLevel.MEDIUM;
      else riskLevel = RiskLevel.LOW;

      const nextReview = new Date(risk.lastReviewed);
      nextReview.setDate(nextReview.getDate() + this.riskReviewFrequencyDays);

      const result = await client.query(
        `INSERT INTO soc2_risk_assessments (
          risk_id, title, description, category, principle, likelihood,
          impact, inherent_risk, residual_risk, risk_level, owner,
          mitigation_controls, status, identified_at, last_reviewed,
          next_review, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14, $15, $16)
        RETURNING *`,
        [
          risk.riskId,
          risk.title,
          risk.description,
          risk.category,
          JSON.stringify(risk.principle),
          risk.likelihood,
          risk.impact,
          inherentRisk,
          residualRisk,
          riskLevel,
          risk.owner,
          JSON.stringify(risk.mitigationControls),
          risk.status,
          risk.lastReviewed,
          nextReview,
          JSON.stringify(risk.metadata),
        ]
      );

      await this.logAuditEvent(client, {
        eventType: AuditEventType.SECURITY_ALERT,
        userId: 'system',
        ipAddress: '127.0.0.1',
        resource: 'soc2_risk_assessments',
        action: 'create',
        result: 'success',
        details: { riskId: risk.riskId, riskLevel },
        severity: riskLevel === RiskLevel.CRITICAL ? 'critical' : 'warning',
        principle: risk.principle,
      });

      await client.query('COMMIT');

      this.logger.info('Risk assessment created', {
        riskId: risk.riskId,
        riskLevel,
      });

      return this.mapRowToRiskAssessment(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to create risk assessment', { error, risk });
      throw error;
    } finally {
      client.release();
    }
  }

  async collectEvidence(
    controlId: string,
    evidenceType: string,
    title: string,
    description: string,
    collectedBy: string,
    period: { start: Date; end: Date },
    fileBuffer: Buffer
  ): Promise<Evidence> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const s3Key = `soc2-evidence/${controlId}/${Date.now()}-${title}`;

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.s3BucketName,
        Key: s3Key,
        Body: fileBuffer,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: this.kmsKeyId,
        Metadata: {
          controlId,
          evidenceType,
          checksum,
        },
      }));

      const result = await client.query(
        `INSERT INTO soc2_evidence (
          control_id, evidence_type, title, description, collected_at,
          collected_by, period_start, period_end, s3_key, file_size,
          checksum, metadata
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          controlId,
          evidenceType,
          title,
          description,
          collectedBy,
          period.start,
          period.end,
          s3Key,
          fileBuffer.length,
          checksum,
          JSON.stringify({}),
        ]
      );

      await this.logAuditEvent(client, {
        eventType: AuditEventType.DATA_ACCESS,
        userId: collectedBy,
        ipAddress: '127.0.0.1',
        resource: 'soc2_evidence',
        action: 'collect',
        result: 'success',
        details: { controlId, evidenceType },
        severity: 'info',
        principle: [TrustServicePrinciple.SECURITY],
      });

      await client.query('COMMIT');

      this.logger.info('Evidence collected', {
        controlId,
        evidenceType,
        fileSize: fileBuffer.length,
      });

      return this.mapRowToEvidence(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to collect evidence', { error, controlId });
      throw error;
    } finally {
      client.release();
    }
  }

  async createAccessPolicy(policy: Omit<AccessPolicy, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<AccessPolicy> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO soc2_access_policies (
          policy_name, principle, resources, actions, conditions,
          grantees, created_by, created_at, updated_at, version, active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), 1, $8)
        RETURNING *`,
        [
          policy.policyName,
          JSON.stringify(policy.principle),
          JSON.stringify(policy.resources),
          JSON.stringify(policy.actions),
          JSON.stringify(policy.conditions),
          JSON.stringify(policy.grantees),
          policy.createdBy,
          policy.active,
        ]
      );

      await this.logAuditEvent(client, {
        eventType: AuditEventType.PERMISSION_CHANGE,
        userId: policy.createdBy,
        ipAddress: '127.0.0.1',
        resource: 'soc2_access_policies',
        action: 'create',
        result: 'success',
        details: { policyName: policy.policyName },
        severity: 'warning',
        principle: policy.principle,
      });

      await client.query('COMMIT');

      this.logger.info('Access policy created', {
        policyName: policy.policyName,
      });

      return this.mapRowToAccessPolicy(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to create access policy', { error, policy });
      throw error;
    } finally {
      client.release();
    }
  }

  async enforceAccessControl(
    userId: string,
    resource: string,
    action: string,
    context: Record<string, any> = {}
  ): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const policies = await client.query(
        `SELECT * FROM soc2_access_policies
        WHERE active = true
        AND grantees @> $1`,
        [JSON.stringify([userId])]
      );

      for (const policyRow of policies.rows) {
        const policy = this.mapRowToAccessPolicy(policyRow);

        const resourceMatch = policy.resources.some(r =>
          resource.match(new RegExp(r.replace('*', '.*')))
        );

        const actionMatch = policy.actions.includes(action) || policy.actions.includes('*');

        if (resourceMatch && actionMatch) {
          const conditionsMet = this.evaluateConditions(policy.conditions, context);

          if (conditionsMet) {
            await this.logAuditEvent(client, {
              eventType: AuditEventType.DATA_ACCESS,
              userId,
              ipAddress: context.ipAddress || '127.0.0.1',
              resource,
              action,
              result: 'success',
              details: { policyId: policy.id },
              severity: 'info',
              principle: policy.principle,
            });

            this.logger.debug('Access granted', { userId, resource, action });
            return true;
          }
        }
      }

      await this.logAuditEvent(client, {
        eventType: AuditEventType.DATA_ACCESS,
        userId,
        ipAddress: context.ipAddress || '127.0.0.1',
        resource,
        action,
        result: 'failure',
        details: { reason: 'Access denied - no matching policy' },
        severity: 'warning',
        principle: [TrustServicePrinciple.SECURITY],
      });

      this.logger.warn('Access denied', { userId, resource, action });
      return false;
    } catch (error) {
      this.logger.error('Failed to enforce access control', { error, userId, resource, action });
      throw error;
    } finally {
      client.release();
    }
  }

  async reportIncident(incident: Omit<IncidentReport, 'id' | 'detectedAt' | 'reportedAt'>): Promise<IncidentReport> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO soc2_incidents (
          incident_id, title, description, severity, detected_at,
          reported_at, reported_by, affected_principles, affected_systems,
          root_cause, containment_actions, remediation, status, resolved_at,
          lessons_learned
        ) VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          incident.incidentId,
          incident.title,
          incident.description,
          incident.severity,
          incident.reportedBy,
          JSON.stringify(incident.affectedPrinciples),
          JSON.stringify(incident.affectedSystems),
          incident.rootCause,
          JSON.stringify(incident.containmentActions),
          incident.remediation,
          incident.status,
          incident.resolvedAt,
          incident.lessonsLearned,
        ]
      );

      await this.logAuditEvent(client, {
        eventType: AuditEventType.SECURITY_ALERT,
        userId: incident.reportedBy,
        ipAddress: '127.0.0.1',
        resource: 'soc2_incidents',
        action: 'report',
        result: 'success',
        details: { incidentId: incident.incidentId, severity: incident.severity },
        severity: incident.severity === RiskLevel.CRITICAL ? 'critical' : 'error',
        principle: incident.affectedPrinciples,
      });

      await client.query('COMMIT');

      this.logger.error('Incident reported', {
        incidentId: incident.incidentId,
        severity: incident.severity,
      });

      return this.mapRowToIncidentReport(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to report incident', { error, incident });
      throw error;
    } finally {
      client.release();
    }
  }

  async getComplianceMetrics(): Promise<ComplianceMetrics> {
    const client = await this.pool.connect();
    try {
      const controlStats = await client.query(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'effective') as effective,
          COUNT(*) as total
        FROM soc2_controls`
      );

      const controlEffectiveness = controlStats.rows[0].total > 0
        ? (controlStats.rows[0].effective / controlStats.rows[0].total) * 100
        : 0;

      const testStats = await client.query(
        `SELECT COUNT(DISTINCT control_id) as tested
        FROM soc2_control_tests
        WHERE tested_at > NOW() - INTERVAL '90 days'`
      );

      const auditCoverage = controlStats.rows[0].total > 0
        ? (testStats.rows[0].tested / controlStats.rows[0].total) * 100
        : 0;

      const incidentStats = await client.query(
        `SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - detected_at))/3600) as avg_hours
        FROM soc2_incidents
        WHERE resolved_at IS NOT NULL
        AND detected_at > NOW() - INTERVAL '30 days'`
      );

      const incidentResponseTime = parseFloat(incidentStats.rows[0].avg_hours || 0);

      const changeStats = await client.query(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'completed') as successful,
          COUNT(*) as total
        FROM soc2_change_requests
        WHERE requested_at > NOW() - INTERVAL '30 days'`
      );

      const changeSuccessRate = changeStats.rows[0].total > 0
        ? (changeStats.rows[0].successful / changeStats.rows[0].total) * 100
        : 100;

      const riskStats = await client.query(
        `SELECT AVG(residual_risk) as avg_risk
        FROM soc2_risk_assessments
        WHERE status = 'open'`
      );

      const riskScore = 100 - (parseFloat(riskStats.rows[0].avg_risk || 0) * 5);

      const availabilityPercent = 99.9;
      const securityPosture = (controlEffectiveness + auditCoverage + riskScore) / 3;

      return {
        controlEffectiveness: Math.round(controlEffectiveness),
        auditCoverage: Math.round(auditCoverage),
        incidentResponseTime: Math.round(incidentResponseTime * 100) / 100,
        changeSuccessRate: Math.round(changeSuccessRate),
        riskScore: Math.round(riskScore),
        availabilityPercent: Math.round(availabilityPercent * 100) / 100,
        securityPosture: Math.round(securityPosture),
      };
    } catch (error) {
      this.logger.error('Failed to get compliance metrics', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  async syncCloudTrailEvents(startDate: Date, endDate: Date): Promise<number> {
    const client = await this.pool.connect();
    try {
      const input: LookupEventsCommandInput = {
        StartTime: startDate,
        EndTime: endDate,
        MaxResults: 50,
      };

      const command = new LookupEventsCommand(input);
      const response = await this.cloudTrailClient.send(command);

      let syncedCount = 0;

      if (response.Events) {
        for (const event of response.Events) {
          try {
            await this.logAuditEvent(client, {
              eventType: this.mapCloudTrailEventType(event.EventName || 'Unknown'),
              userId: event.Username || 'system',
              ipAddress: event.CloudTrailEvent ? JSON.parse(event.CloudTrailEvent).sourceIPAddress : '0.0.0.0',
              resource: event.ResourceType || 'aws',
              action: event.EventName || 'unknown',
              result: 'success',
              details: {
                eventId: event.EventId,
                eventSource: event.EventSource,
                cloudTrail: true,
              },
              severity: 'info',
              principle: [TrustServicePrinciple.SECURITY],
            });

            syncedCount++;
          } catch (error) {
            this.logger.warn('Failed to sync CloudTrail event', { error, eventId: event.EventId });
          }
        }
      }

      this.logger.info('CloudTrail events synced', {
        syncedCount,
        startDate,
        endDate,
      });

      return syncedCount;
    } catch (error) {
      this.logger.error('Failed to sync CloudTrail events', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  private evaluateConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private mapCloudTrailEventType(eventName: string): AuditEventType {
    const eventMap: Record<string, AuditEventType> = {
      'ConsoleLogin': AuditEventType.USER_LOGIN,
      'AssumeRole': AuditEventType.PERMISSION_CHANGE,
      'PutBucketPolicy': AuditEventType.CONFIGURATION_CHANGE,
      'CreateAccessKey': AuditEventType.SECURITY_ALERT,
    };

    return eventMap[eventName] || AuditEventType.CONFIGURATION_CHANGE;
  }

  private mapRowToControl(row: any): SOC2Control {
    return {
      id: row.id,
      controlId: row.control_id,
      principle: row.principle,
      category: row.category,
      title: row.title,
      description: row.description,
      implementationDetails: row.implementation_details,
      status: row.status,
      owner: row.owner,
      testFrequency: row.test_frequency,
      lastTested: row.last_tested,
      nextTestDue: row.next_test_due,
      evidenceRequired: typeof row.evidence_required === 'string'
        ? JSON.parse(row.evidence_required)
        : row.evidence_required,
      automatedControl: row.automated_control,
      compensatingControls: typeof row.compensating_controls === 'string'
        ? JSON.parse(row.compensating_controls)
        : row.compensating_controls,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    };
  }

  private mapRowToControlTest(row: any): ControlTest {
    return {
      id: row.id,
      controlId: row.control_id,
      testedAt: row.tested_at,
      testedBy: row.tested_by,
      testProcedure: row.test_procedure,
      testResults: row.test_results,
      status: row.status,
      findings: typeof row.findings === 'string' ? JSON.parse(row.findings) : row.findings,
      recommendations: typeof row.recommendations === 'string'
        ? JSON.parse(row.recommendations)
        : row.recommendations,
      evidenceCollected: typeof row.evidence_collected === 'string'
        ? JSON.parse(row.evidence_collected)
        : row.evidence_collected,
      nextTestDate: row.next_test_date,
    };
  }

  private mapRowToAuditLog(row: any): AuditLog {
    return {
      id: row.id,
      timestamp: row.timestamp,
      eventType: row.event_type,
      userId: row.user_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      resource: row.resource,
      action: row.action,
      result: row.result,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
      severity: row.severity,
      principle: typeof row.principle === 'string' ? JSON.parse(row.principle) : row.principle,
    };
  }

  private mapRowToChangeRequest(row: any): ChangeRequest {
    return {
      id: row.id,
      changeType: row.change_type,
      title: row.title,
      description: row.description,
      requestedBy: row.requested_by,
      requestedAt: row.requested_at,
      status: row.status,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      implementedBy: row.implemented_by,
      implementedAt: row.implemented_at,
      completedAt: row.completed_at,
      rollbackPlan: row.rollback_plan,
      testingPlan: row.testing_plan,
      impactAssessment: row.impact_assessment,
      affectedSystems: typeof row.affected_systems === 'string'
        ? JSON.parse(row.affected_systems)
        : row.affected_systems,
      downtime: row.downtime,
      downtimeWindow: row.downtime_window,
      approvers: typeof row.approvers === 'string' ? JSON.parse(row.approvers) : row.approvers,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    };
  }

  private mapRowToRiskAssessment(row: any): RiskAssessment {
    return {
      id: row.id,
      riskId: row.risk_id,
      title: row.title,
      description: row.description,
      category: row.category,
      principle: typeof row.principle === 'string' ? JSON.parse(row.principle) : row.principle,
      likelihood: row.likelihood,
      impact: row.impact,
      inherentRisk: row.inherent_risk,
      residualRisk: row.residual_risk,
      riskLevel: row.risk_level,
      owner: row.owner,
      mitigationControls: typeof row.mitigation_controls === 'string'
        ? JSON.parse(row.mitigation_controls)
        : row.mitigation_controls,
      status: row.status,
      identifiedAt: row.identified_at,
      lastReviewed: row.last_reviewed,
      nextReview: row.next_review,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    };
  }

  private mapRowToEvidence(row: any): Evidence {
    return {
      id: row.id,
      controlId: row.control_id,
      evidenceType: row.evidence_type,
      title: row.title,
      description: row.description,
      collectedAt: row.collected_at,
      collectedBy: row.collected_by,
      period: { start: row.period_start, end: row.period_end },
      s3Key: row.s3_key,
      fileSize: row.file_size,
      checksum: row.checksum,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    };
  }

  private mapRowToAccessPolicy(row: any): AccessPolicy {
    return {
      id: row.id,
      policyName: row.policy_name,
      principle: typeof row.principle === 'string' ? JSON.parse(row.principle) : row.principle,
      resources: typeof row.resources === 'string' ? JSON.parse(row.resources) : row.resources,
      actions: typeof row.actions === 'string' ? JSON.parse(row.actions) : row.actions,
      conditions: typeof row.conditions === 'string' ? JSON.parse(row.conditions) : row.conditions,
      grantees: typeof row.grantees === 'string' ? JSON.parse(row.grantees) : row.grantees,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version,
      active: row.active,
    };
  }

  private mapRowToIncidentReport(row: any): IncidentReport {
    return {
      id: row.id,
      incidentId: row.incident_id,
      title: row.title,
      description: row.description,
      severity: row.severity,
      detectedAt: row.detected_at,
      reportedAt: row.reported_at,
      reportedBy: row.reported_by,
      affectedPrinciples: typeof row.affected_principles === 'string'
        ? JSON.parse(row.affected_principles)
        : row.affected_principles,
      affectedSystems: typeof row.affected_systems === 'string'
        ? JSON.parse(row.affected_systems)
        : row.affected_systems,
      rootCause: row.root_cause,
      containmentActions: typeof row.containment_actions === 'string'
        ? JSON.parse(row.containment_actions)
        : row.containment_actions,
      remediation: row.remediation,
      status: row.status,
      resolvedAt: row.resolved_at,
      lessonsLearned: row.lessons_learned,
    };
  }
}
