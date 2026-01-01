import { Pool, PoolClient } from 'pg';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { KMSClient, EncryptCommand, DecryptCommand, GenerateDataKeyCommand } from '@aws-sdk/client-kms';
import { Logger } from 'winston';
import crypto from 'crypto';

export enum PHICategory {
  NAME = 'name',
  ADDRESS = 'address',
  DATES = 'dates',
  PHONE = 'phone',
  EMAIL = 'email',
  SSN = 'ssn',
  MEDICAL_RECORD = 'medical_record',
  HEALTH_PLAN = 'health_plan',
  ACCOUNT_NUMBER = 'account_number',
  CERTIFICATE_LICENSE = 'certificate_license',
  VEHICLE_IDENTIFIER = 'vehicle_identifier',
  DEVICE_IDENTIFIER = 'device_identifier',
  URL = 'url',
  IP_ADDRESS = 'ip_address',
  BIOMETRIC = 'biometric',
  PHOTO = 'photo',
  GENETIC_INFO = 'genetic_info',
  OTHER = 'other',
}

export enum SafeguardType {
  ADMINISTRATIVE = 'administrative',
  PHYSICAL = 'physical',
  TECHNICAL = 'technical',
}

export enum AccessLevel {
  NO_ACCESS = 'no_access',
  READ_ONLY = 'read_only',
  READ_WRITE = 'read_write',
  FULL_ACCESS = 'full_access',
}

export enum BreachType {
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  UNAUTHORIZED_DISCLOSURE = 'unauthorized_disclosure',
  LOSS = 'loss',
  THEFT = 'theft',
  IMPROPER_DISPOSAL = 'improper_disposal',
  HACKING = 'hacking',
  OTHER = 'other',
}

export enum TrainingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export interface PHIRecord {
  id: string;
  patientId: string;
  dataType: PHICategory;
  encryptedValue: string;
  encryptionKeyId: string;
  createdAt: Date;
  updatedAt: Date;
  accessedBy: string[];
  retentionExpiresAt?: Date;
  metadata: Record<string, any>;
}

export interface PHIAccessLog {
  id: string;
  phiRecordId: string;
  userId: string;
  accessType: 'read' | 'write' | 'delete';
  accessedAt: Date;
  ipAddress: string;
  justification: string;
  minimumNecessary: boolean;
  approved: boolean;
  approvedBy?: string;
}

export interface HIPAASafeguard {
  id: string;
  safeguardType: SafeguardType;
  category: string;
  title: string;
  description: string;
  implementation: string;
  required: boolean;
  implemented: boolean;
  implementedAt?: Date;
  responsibleParty: string;
  reviewFrequency: string;
  lastReviewed?: Date;
  nextReview?: Date;
  evidence: string[];
}

export interface BusinessAssociateAgreement {
  id: string;
  associateName: string;
  associateType: string;
  servicesProvided: string[];
  signedDate: Date;
  effectiveDate: Date;
  expirationDate?: Date;
  terminationDate?: Date;
  status: 'active' | 'expired' | 'terminated';
  attestationReceived: boolean;
  lastAttestationDate?: Date;
  phiAccessLevel: AccessLevel;
  subcontractorsAllowed: boolean;
  subcontractors: string[];
  metadata: Record<string, any>;
}

export interface HIPAABreach {
  id: string;
  breachId: string;
  detectedAt: Date;
  reportedAt?: Date;
  breachType: BreachType;
  affectedIndividuals: number;
  affectedRecords: string[];
  description: string;
  causeDescription: string;
  phiInvolved: PHICategory[];
  riskAssessment: string;
  mitigationSteps: string[];
  hhsNotificationRequired: boolean;
  hhsNotifiedAt?: Date;
  individuals NotifiedAt?: Date;
  mediaNotificationRequired: boolean;
  status: 'detected' | 'investigating' | 'contained' | 'reported' | 'closed';
  closedAt?: Date;
}

export interface RiskAnalysis {
  id: string;
  analysisId: string;
  conductedAt: Date;
  conductedBy: string;
  scope: string;
  threatsIdentified: Array<{
    threat: string;
    vulnerability: string;
    likelihood: number;
    impact: number;
    riskLevel: number;
  }>;
  safeguardsReviewed: string[];
  gaps: string[];
  recommendations: string[];
  nextReviewDate: Date;
  status: 'draft' | 'completed' | 'approved';
  approvedBy?: string;
  approvedAt?: Date;
}

export interface WorkforceTraining {
  id: string;
  userId: string;
  trainingType: string;
  trainingDate: Date;
  completedAt?: Date;
  status: TrainingStatus;
  score?: number;
  expiresAt: Date;
  certificateUrl?: string;
  topics: string[];
  duration: number;
  instructor?: string;
}

export interface MinimumNecessaryPolicy {
  id: string;
  policyName: string;
  role: string;
  allowedPHICategories: PHICategory[];
  allowedOperations: Array<'read' | 'write' | 'delete'>;
  conditions: Record<string, any>;
  justificationRequired: boolean;
  approvalRequired: boolean;
  approvers: string[];
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface AuditReport {
  id: string;
  reportId: string;
  reportType: 'internal' | 'external' | 'regulatory';
  period: { start: Date; end: Date };
  generatedAt: Date;
  generatedBy: string;
  findings: Array<{
    finding: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
  }>;
  complianceScore: number;
  s3Key: string;
  status: 'draft' | 'final';
}

export interface EncryptionKey {
  id: string;
  keyId: string;
  kmsKeyArn: string;
  purpose: string;
  createdAt: Date;
  rotatedAt?: Date;
  nextRotation: Date;
  active: boolean;
  encryptedRecordsCount: number;
}

export interface HIPAAComplianceConfig {
  databasePool: Pool;
  redis: Redis;
  s3Client: S3Client;
  kmsClient: KMSClient;
  logger: Logger;
  breachQueue: Queue;
  kmsKeyId: string;
  s3BucketName: string;
  organizationName: string;
  privacyOfficerEmail: string;
  securityOfficerEmail: string;
  breachNotificationDays: number;
  trainingRequiredAnnually: boolean;
  minimumNecessaryEnforced: boolean;
  retentionPeriodYears: number;
}

export class HIPAAComplianceService {
  private pool: Pool;
  private redis: Redis;
  private s3Client: S3Client;
  private kmsClient: KMSClient;
  private logger: Logger;
  private breachQueue: Queue;
  private kmsKeyId: string;
  private s3BucketName: string;
  private organizationName: string;
  private privacyOfficerEmail: string;
  private securityOfficerEmail: string;
  private breachNotificationDays: number;
  private trainingRequiredAnnually: boolean;
  private minimumNecessaryEnforced: boolean;
  private retentionPeriodYears: number;

  constructor(config: HIPAAComplianceConfig) {
    this.pool = config.databasePool;
    this.redis = config.redis;
    this.s3Client = config.s3Client;
    this.kmsClient = config.kmsClient;
    this.logger = config.logger;
    this.breachQueue = config.breachQueue;
    this.kmsKeyId = config.kmsKeyId;
    this.s3BucketName = config.s3BucketName;
    this.organizationName = config.organizationName;
    this.privacyOfficerEmail = config.privacyOfficerEmail;
    this.securityOfficerEmail = config.securityOfficerEmail;
    this.breachNotificationDays = config.breachNotificationDays;
    this.trainingRequiredAnnually = config.trainingRequiredAnnually;
    this.minimumNecessaryEnforced = config.minimumNecessaryEnforced;
    this.retentionPeriodYears = config.retentionPeriodYears;
  }

  async encryptPHI(patientId: string, dataType: PHICategory, value: string): Promise<PHIRecord> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const dataKeyCommand = new GenerateDataKeyCommand({
        KeyId: this.kmsKeyId,
        KeySpec: 'AES_256',
      });

      const dataKeyResponse = await this.kmsClient.send(dataKeyCommand);

      if (!dataKeyResponse.Plaintext || !dataKeyResponse.CiphertextBlob) {
        throw new Error('Failed to generate data key');
      }

      const plainTextKey = Buffer.from(dataKeyResponse.Plaintext);
      const encryptedDataKey = Buffer.from(dataKeyResponse.CiphertextBlob).toString('base64');

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', plainTextKey, iv);

      let encryptedValue = cipher.update(value, 'utf8', 'base64');
      encryptedValue += cipher.final('base64');

      const combinedValue = `${iv.toString('base64')}:${encryptedValue}`;

      const retentionExpiresAt = new Date();
      retentionExpiresAt.setFullYear(retentionExpiresAt.getFullYear() + this.retentionPeriodYears);

      const result = await client.query(
        `INSERT INTO hipaa_phi_records (
          patient_id, data_type, encrypted_value, encryption_key_id,
          created_at, updated_at, accessed_by, retention_expires_at, metadata
        ) VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7)
        RETURNING *`,
        [
          patientId,
          dataType,
          combinedValue,
          encryptedDataKey,
          JSON.stringify([]),
          retentionExpiresAt,
          JSON.stringify({}),
        ]
      );

      await this.logPHIAccess(client, {
        phiRecordId: result.rows[0].id,
        userId: 'system',
        accessType: 'write',
        ipAddress: '127.0.0.1',
        justification: 'PHI record created',
        minimumNecessary: true,
        approved: true,
      });

      await client.query('COMMIT');

      this.logger.info('PHI encrypted and stored', {
        phiRecordId: result.rows[0].id,
        patientId,
        dataType,
      });

      return this.mapRowToPHIRecord(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to encrypt PHI', { error, patientId, dataType });
      throw error;
    } finally {
      client.release();
    }
  }

  async decryptPHI(phiRecordId: string, userId: string, justification: string): Promise<string> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const phiRecord = await client.query(
        'SELECT * FROM hipaa_phi_records WHERE id = $1',
        [phiRecordId]
      );

      if (phiRecord.rows.length === 0) {
        throw new Error('PHI record not found');
      }

      const record = this.mapRowToPHIRecord(phiRecord.rows[0]);

      if (this.minimumNecessaryEnforced) {
        const hasAccess = await this.checkMinimumNecessary(client, userId, record.dataType, 'read');
        if (!hasAccess) {
          throw new Error('Access denied: minimum necessary rule violation');
        }
      }

      const [ivBase64, encryptedValue] = record.encryptedValue.split(':');
      const iv = Buffer.from(ivBase64, 'base64');
      const encryptedDataKey = Buffer.from(record.encryptionKeyId, 'base64');

      const decryptCommand = new DecryptCommand({
        CiphertextBlob: encryptedDataKey,
      });

      const decryptResponse = await this.kmsClient.send(decryptCommand);

      if (!decryptResponse.Plaintext) {
        throw new Error('Failed to decrypt data key');
      }

      const plainTextKey = Buffer.from(decryptResponse.Plaintext);
      const decipher = crypto.createDecipheriv('aes-256-cbc', plainTextKey, iv);

      let decryptedValue = decipher.update(encryptedValue, 'base64', 'utf8');
      decryptedValue += decipher.final('utf8');

      await this.logPHIAccess(client, {
        phiRecordId,
        userId,
        accessType: 'read',
        ipAddress: '127.0.0.1',
        justification,
        minimumNecessary: true,
        approved: true,
      });

      const accessedBy = Array.isArray(record.accessedBy) ? record.accessedBy : [];
      if (!accessedBy.includes(userId)) {
        accessedBy.push(userId);
        await client.query(
          'UPDATE hipaa_phi_records SET accessed_by = $1 WHERE id = $2',
          [JSON.stringify(accessedBy), phiRecordId]
        );
      }

      await client.query('COMMIT');

      this.logger.info('PHI decrypted', {
        phiRecordId,
        userId,
        justification,
      });

      return decryptedValue;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to decrypt PHI', { error, phiRecordId, userId });
      throw error;
    } finally {
      client.release();
    }
  }

  async identifyPHI(text: string): Promise<Array<{ type: PHICategory; value: string; position: number }>> {
    const identifiedPHI: Array<{ type: PHICategory; value: string; position: number }> = [];

    const patterns = {
      [PHICategory.SSN]: /\b\d{3}-\d{2}-\d{4}\b/g,
      [PHICategory.PHONE]: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      [PHICategory.EMAIL]: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      [PHICategory.IP_ADDRESS]: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      [PHICategory.DATES]: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        identifiedPHI.push({
          type: type as PHICategory,
          value: match[0],
          position: match.index,
        });
      }
    }

    this.logger.debug('PHI identified in text', {
      identifiedCount: identifiedPHI.length,
      types: [...new Set(identifiedPHI.map(p => p.type))],
    });

    return identifiedPHI;
  }

  async createSafeguard(safeguard: Omit<HIPAASafeguard, 'id'>): Promise<HIPAASafeguard> {
    const client = await this.pool.connect();
    try {
      const nextReview = safeguard.lastReviewed ? new Date(safeguard.lastReviewed) : new Date();
      nextReview.setMonth(nextReview.getMonth() + 6);

      const result = await client.query(
        `INSERT INTO hipaa_safeguards (
          safeguard_type, category, title, description, implementation,
          required, implemented, implemented_at, responsible_party,
          review_frequency, last_reviewed, next_review, evidence
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          safeguard.safeguardType,
          safeguard.category,
          safeguard.title,
          safeguard.description,
          safeguard.implementation,
          safeguard.required,
          safeguard.implemented,
          safeguard.implementedAt,
          safeguard.responsibleParty,
          safeguard.reviewFrequency,
          safeguard.lastReviewed,
          nextReview,
          JSON.stringify(safeguard.evidence),
        ]
      );

      this.logger.info('HIPAA safeguard created', {
        safeguardId: result.rows[0].id,
        type: safeguard.safeguardType,
      });

      return this.mapRowToSafeguard(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to create safeguard', { error, safeguard });
      throw error;
    } finally {
      client.release();
    }
  }

  async createBusinessAssociateAgreement(baa: Omit<BusinessAssociateAgreement, 'id'>): Promise<BusinessAssociateAgreement> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO hipaa_business_associate_agreements (
          associate_name, associate_type, services_provided, signed_date,
          effective_date, expiration_date, termination_date, status,
          attestation_received, last_attestation_date, phi_access_level,
          subcontractors_allowed, subcontractors, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          baa.associateName,
          baa.associateType,
          JSON.stringify(baa.servicesProvided),
          baa.signedDate,
          baa.effectiveDate,
          baa.expirationDate,
          baa.terminationDate,
          baa.status,
          baa.attestationReceived,
          baa.lastAttestationDate,
          baa.phiAccessLevel,
          baa.subcontractorsAllowed,
          JSON.stringify(baa.subcontractors),
          JSON.stringify(baa.metadata),
        ]
      );

      this.logger.info('Business Associate Agreement created', {
        baaId: result.rows[0].id,
        associateName: baa.associateName,
      });

      return this.mapRowToBAA(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to create BAA', { error, baa });
      throw error;
    } finally {
      client.release();
    }
  }

  async reportBreach(
    breachType: BreachType,
    description: string,
    affectedRecords: string[],
    causeDescription: string
  ): Promise<HIPAABreach> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const affectedIndividuals = affectedRecords.length;
      const phiInvolved: PHICategory[] = [];

      for (const recordId of affectedRecords) {
        const record = await client.query(
          'SELECT data_type FROM hipaa_phi_records WHERE id = $1',
          [recordId]
        );
        if (record.rows.length > 0 && !phiInvolved.includes(record.rows[0].data_type)) {
          phiInvolved.push(record.rows[0].data_type);
        }
      }

      const hhsNotificationRequired = affectedIndividuals >= 500;
      const mediaNotificationRequired = affectedIndividuals >= 500;

      const riskAssessment = this.performBreachRiskAssessment(
        breachType,
        affectedIndividuals,
        phiInvolved
      );

      const breachId = `BREACH-${Date.now()}`;

      const result = await client.query(
        `INSERT INTO hipaa_breaches (
          breach_id, detected_at, reported_at, breach_type,
          affected_individuals, affected_records, description,
          cause_description, phi_involved, risk_assessment,
          mitigation_steps, hhs_notification_required,
          media_notification_required, status
        ) VALUES ($1, NOW(), NOW(), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'detected')
        RETURNING *`,
        [
          breachId,
          breachType,
          affectedIndividuals,
          JSON.stringify(affectedRecords),
          description,
          causeDescription,
          JSON.stringify(phiInvolved),
          riskAssessment,
          JSON.stringify([]),
          hhsNotificationRequired,
          mediaNotificationRequired,
        ]
      );

      await this.breachQueue.add('hipaa-breach-notification', {
        breachId: result.rows[0].id,
        affectedIndividuals,
        hhsNotificationRequired,
      }, {
        delay: 0,
        attempts: 3,
      });

      await client.query('COMMIT');

      this.logger.error('HIPAA breach reported', {
        breachId: result.rows[0].id,
        affectedIndividuals,
        breachType,
      });

      return this.mapRowToBreach(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to report breach', { error, breachType });
      throw error;
    } finally {
      client.release();
    }
  }

  async notifyBreach(breachId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const breach = await client.query(
        'SELECT * FROM hipaa_breaches WHERE id = $1',
        [breachId]
      );

      if (breach.rows.length === 0) {
        throw new Error('Breach not found');
      }

      const breachData = this.mapRowToBreach(breach.rows[0]);
      const daysSinceDetection = (Date.now() - breachData.detectedAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceDetection > this.breachNotificationDays) {
        this.logger.warn('Breach notification deadline exceeded', {
          breachId,
          daysSinceDetection,
          deadline: this.breachNotificationDays,
        });
      }

      await client.query(
        `UPDATE hipaa_breaches
        SET hhs_notified_at = NOW(),
            individuals_notified_at = NOW(),
            status = 'reported'
        WHERE id = $1`,
        [breachId]
      );

      await client.query('COMMIT');

      this.logger.info('HIPAA breach notification completed', {
        breachId,
        daysSinceDetection,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to notify breach', { error, breachId });
      throw error;
    } finally {
      client.release();
    }
  }

  async conductRiskAnalysis(
    scope: string,
    conductedBy: string
  ): Promise<RiskAnalysis> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const safeguards = await client.query(
        'SELECT * FROM hipaa_safeguards WHERE implemented = false'
      );

      const gaps = safeguards.rows.map(s => `${s.title}: Not implemented`);

      const threatsIdentified = [
        {
          threat: 'Unauthorized access to PHI',
          vulnerability: 'Weak access controls',
          likelihood: 3,
          impact: 4,
          riskLevel: 12,
        },
        {
          threat: 'Data breach from external attack',
          vulnerability: 'Insufficient network security',
          likelihood: 2,
          impact: 5,
          riskLevel: 10,
        },
        {
          threat: 'Insider threat',
          vulnerability: 'Lack of employee monitoring',
          likelihood: 2,
          impact: 4,
          riskLevel: 8,
        },
        {
          threat: 'Loss of data availability',
          vulnerability: 'Inadequate backup procedures',
          likelihood: 2,
          impact: 3,
          riskLevel: 6,
        },
      ];

      const safeguardsReviewed = safeguards.rows.map(s => s.id);

      const recommendations = [
        'Implement multi-factor authentication for all PHI access',
        'Conduct regular security awareness training',
        'Enhance encryption for data at rest and in transit',
        'Implement comprehensive audit logging',
        'Establish incident response procedures',
      ];

      const nextReviewDate = new Date();
      nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1);

      const analysisId = `RISK-${Date.now()}`;

      const result = await client.query(
        `INSERT INTO hipaa_risk_analyses (
          analysis_id, conducted_at, conducted_by, scope,
          threats_identified, safeguards_reviewed, gaps,
          recommendations, next_review_date, status
        ) VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, 'completed')
        RETURNING *`,
        [
          analysisId,
          conductedBy,
          scope,
          JSON.stringify(threatsIdentified),
          JSON.stringify(safeguardsReviewed),
          JSON.stringify(gaps),
          JSON.stringify(recommendations),
          nextReviewDate,
        ]
      );

      await client.query('COMMIT');

      this.logger.info('Risk analysis conducted', {
        analysisId,
        conductedBy,
        threatsCount: threatsIdentified.length,
      });

      return this.mapRowToRiskAnalysis(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to conduct risk analysis', { error, scope });
      throw error;
    } finally {
      client.release();
    }
  }

  async assignWorkforceTraining(
    userId: string,
    trainingType: string,
    topics: string[],
    duration: number
  ): Promise<WorkforceTraining> {
    const client = await this.pool.connect();
    try {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const result = await client.query(
        `INSERT INTO hipaa_workforce_training (
          user_id, training_type, training_date, status, expires_at,
          topics, duration
        ) VALUES ($1, $2, NOW(), $3, $4, $5, $6)
        RETURNING *`,
        [
          userId,
          trainingType,
          TrainingStatus.NOT_STARTED,
          expiresAt,
          JSON.stringify(topics),
          duration,
        ]
      );

      this.logger.info('Workforce training assigned', {
        trainingId: result.rows[0].id,
        userId,
        trainingType,
      });

      return this.mapRowToTraining(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to assign training', { error, userId, trainingType });
      throw error;
    } finally {
      client.release();
    }
  }

  async completeWorkforceTraining(trainingId: string, score: number): Promise<WorkforceTraining> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `UPDATE hipaa_workforce_training
        SET status = $1, completed_at = NOW(), score = $2
        WHERE id = $3
        RETURNING *`,
        [TrainingStatus.COMPLETED, score, trainingId]
      );

      if (result.rows.length === 0) {
        throw new Error('Training not found');
      }

      this.logger.info('Workforce training completed', {
        trainingId,
        score,
      });

      return this.mapRowToTraining(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to complete training', { error, trainingId });
      throw error;
    } finally {
      client.release();
    }
  }

  async createMinimumNecessaryPolicy(
    policy: Omit<MinimumNecessaryPolicy, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MinimumNecessaryPolicy> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO hipaa_minimum_necessary_policies (
          policy_name, role, allowed_phi_categories, allowed_operations,
          conditions, justification_required, approval_required,
          approvers, created_at, updated_at, active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9)
        RETURNING *`,
        [
          policy.policyName,
          policy.role,
          JSON.stringify(policy.allowedPHICategories),
          JSON.stringify(policy.allowedOperations),
          JSON.stringify(policy.conditions),
          policy.justificationRequired,
          policy.approvalRequired,
          JSON.stringify(policy.approvers),
          policy.active,
        ]
      );

      this.logger.info('Minimum necessary policy created', {
        policyId: result.rows[0].id,
        policyName: policy.policyName,
      });

      return this.mapRowToMinimumNecessaryPolicy(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to create minimum necessary policy', { error, policy });
      throw error;
    } finally {
      client.release();
    }
  }

  async checkMinimumNecessary(
    client: PoolClient,
    userId: string,
    phiCategory: PHICategory,
    operation: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    const userRole = await client.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (userRole.rows.length === 0) {
      return false;
    }

    const role = userRole.rows[0].role;

    const policies = await client.query(
      `SELECT * FROM hipaa_minimum_necessary_policies
      WHERE role = $1 AND active = true`,
      [role]
    );

    for (const policyRow of policies.rows) {
      const policy = this.mapRowToMinimumNecessaryPolicy(policyRow);

      const categoryAllowed = policy.allowedPHICategories.includes(phiCategory);
      const operationAllowed = policy.allowedOperations.includes(operation);

      if (categoryAllowed && operationAllowed) {
        return true;
      }
    }

    return false;
  }

  async generateAuditReport(
    reportType: 'internal' | 'external' | 'regulatory',
    period: { start: Date; end: Date },
    generatedBy: string
  ): Promise<AuditReport> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const accessLogs = await client.query(
        `SELECT * FROM hipaa_phi_access_logs
        WHERE accessed_at BETWEEN $1 AND $2`,
        [period.start, period.end]
      );

      const breaches = await client.query(
        `SELECT * FROM hipaa_breaches
        WHERE detected_at BETWEEN $1 AND $2`,
        [period.start, period.end]
      );

      const safeguards = await client.query(
        'SELECT * FROM hipaa_safeguards'
      );

      const findings = [];

      const implementedSafeguards = safeguards.rows.filter(s => s.implemented).length;
      const totalSafeguards = safeguards.rows.length;
      const safeguardCompliance = (implementedSafeguards / totalSafeguards) * 100;

      if (safeguardCompliance < 90) {
        findings.push({
          finding: `Only ${safeguardCompliance.toFixed(1)}% of safeguards are implemented`,
          severity: 'high' as const,
          recommendation: 'Prioritize implementation of remaining safeguards',
        });
      }

      if (breaches.rows.length > 0) {
        findings.push({
          finding: `${breaches.rows.length} breach(es) detected during audit period`,
          severity: 'critical' as const,
          recommendation: 'Review and strengthen security controls',
        });
      }

      const unauthorizedAccess = accessLogs.rows.filter(log => !log.approved).length;
      if (unauthorizedAccess > 0) {
        findings.push({
          finding: `${unauthorizedAccess} unauthorized PHI access attempts`,
          severity: 'medium' as const,
          recommendation: 'Enhance access controls and monitoring',
        });
      }

      const complianceScore = Math.max(0, 100 - (findings.length * 10));

      const reportContent = {
        reportType,
        period,
        generatedAt: new Date(),
        generatedBy,
        statistics: {
          totalAccessLogs: accessLogs.rows.length,
          totalBreaches: breaches.rows.length,
          safeguardCompliance,
          unauthorizedAccess,
        },
        findings,
        complianceScore,
      };

      const reportId = `AUDIT-${Date.now()}`;
      const s3Key = `hipaa-audit-reports/${reportId}.json`;

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.s3BucketName,
        Key: s3Key,
        Body: JSON.stringify(reportContent, null, 2),
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: this.kmsKeyId,
      }));

      const result = await client.query(
        `INSERT INTO hipaa_audit_reports (
          report_id, report_type, period_start, period_end,
          generated_at, generated_by, findings, compliance_score,
          s3_key, status
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, 'final')
        RETURNING *`,
        [
          reportId,
          reportType,
          period.start,
          period.end,
          generatedBy,
          JSON.stringify(findings),
          complianceScore,
          s3Key,
        ]
      );

      await client.query('COMMIT');

      this.logger.info('Audit report generated', {
        reportId,
        reportType,
        complianceScore,
      });

      return this.mapRowToAuditReport(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to generate audit report', { error, reportType });
      throw error;
    } finally {
      client.release();
    }
  }

  async enforceDataRetention(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const expiredRecords = await client.query(
        `SELECT id FROM hipaa_phi_records
        WHERE retention_expires_at < NOW()`
      );

      for (const record of expiredRecords.rows) {
        await client.query(
          'DELETE FROM hipaa_phi_records WHERE id = $1',
          [record.id]
        );
      }

      await client.query('COMMIT');

      this.logger.info('Data retention enforced', {
        deletedRecords: expiredRecords.rows.length,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to enforce data retention', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  async getComplianceScore(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const safeguards = await client.query(
        `SELECT
          COUNT(*) FILTER (WHERE implemented = true) as implemented,
          COUNT(*) as total
        FROM hipaa_safeguards`
      );

      const safeguardScore = (safeguards.rows[0].implemented / safeguards.rows[0].total) * 40;

      const trainingStats = await client.query(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'completed' AND expires_at > NOW()) as current,
          COUNT(DISTINCT user_id) as total_users
        FROM hipaa_workforce_training`
      );

      const trainingScore = trainingStats.rows[0].total_users > 0
        ? (trainingStats.rows[0].current / trainingStats.rows[0].total_users) * 30
        : 0;

      const baaStats = await client.query(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) as total
        FROM hipaa_business_associate_agreements`
      );

      const baaScore = baaStats.rows[0].total > 0
        ? (baaStats.rows[0].active / baaStats.rows[0].total) * 20
        : 20;

      const breachStats = await client.query(
        `SELECT COUNT(*) as total
        FROM hipaa_breaches
        WHERE detected_at > NOW() - INTERVAL '90 days'`
      );

      const breachScore = Math.max(0, 10 - (breachStats.rows[0].total * 2));

      const totalScore = safeguardScore + trainingScore + baaScore + breachScore;

      return Math.round(totalScore);
    } catch (error) {
      this.logger.error('Failed to calculate compliance score', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  private async logPHIAccess(
    client: PoolClient,
    access: Omit<PHIAccessLog, 'id' | 'accessedAt'>
  ): Promise<void> {
    await client.query(
      `INSERT INTO hipaa_phi_access_logs (
        phi_record_id, user_id, access_type, accessed_at, ip_address,
        justification, minimum_necessary, approved, approved_by
      ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8)`,
      [
        access.phiRecordId,
        access.userId,
        access.accessType,
        access.ipAddress,
        access.justification,
        access.minimumNecessary,
        access.approved,
        access.approvedBy,
      ]
    );
  }

  private performBreachRiskAssessment(
    breachType: BreachType,
    affectedIndividuals: number,
    phiInvolved: PHICategory[]
  ): string {
    let riskLevel = 'Low';

    if (affectedIndividuals > 500 || phiInvolved.includes(PHICategory.SSN)) {
      riskLevel = 'High';
    } else if (affectedIndividuals > 100 || phiInvolved.length > 3) {
      riskLevel = 'Medium';
    }

    return `Risk Level: ${riskLevel}. Affected individuals: ${affectedIndividuals}. PHI categories: ${phiInvolved.join(', ')}.`;
  }

  private mapRowToPHIRecord(row: any): PHIRecord {
    return {
      id: row.id,
      patientId: row.patient_id,
      dataType: row.data_type,
      encryptedValue: row.encrypted_value,
      encryptionKeyId: row.encryption_key_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      accessedBy: typeof row.accessed_by === 'string' ? JSON.parse(row.accessed_by) : row.accessed_by,
      retentionExpiresAt: row.retention_expires_at,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    };
  }

  private mapRowToSafeguard(row: any): HIPAASafeguard {
    return {
      id: row.id,
      safeguardType: row.safeguard_type,
      category: row.category,
      title: row.title,
      description: row.description,
      implementation: row.implementation,
      required: row.required,
      implemented: row.implemented,
      implementedAt: row.implemented_at,
      responsibleParty: row.responsible_party,
      reviewFrequency: row.review_frequency,
      lastReviewed: row.last_reviewed,
      nextReview: row.next_review,
      evidence: typeof row.evidence === 'string' ? JSON.parse(row.evidence) : row.evidence,
    };
  }

  private mapRowToBAA(row: any): BusinessAssociateAgreement {
    return {
      id: row.id,
      associateName: row.associate_name,
      associateType: row.associate_type,
      servicesProvided: typeof row.services_provided === 'string'
        ? JSON.parse(row.services_provided)
        : row.services_provided,
      signedDate: row.signed_date,
      effectiveDate: row.effective_date,
      expirationDate: row.expiration_date,
      terminationDate: row.termination_date,
      status: row.status,
      attestationReceived: row.attestation_received,
      lastAttestationDate: row.last_attestation_date,
      phiAccessLevel: row.phi_access_level,
      subcontractorsAllowed: row.subcontractors_allowed,
      subcontractors: typeof row.subcontractors === 'string'
        ? JSON.parse(row.subcontractors)
        : row.subcontractors,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    };
  }

  private mapRowToBreach(row: any): HIPAABreach {
    return {
      id: row.id,
      breachId: row.breach_id,
      detectedAt: row.detected_at,
      reportedAt: row.reported_at,
      breachType: row.breach_type,
      affectedIndividuals: row.affected_individuals,
      affectedRecords: typeof row.affected_records === 'string'
        ? JSON.parse(row.affected_records)
        : row.affected_records,
      description: row.description,
      causeDescription: row.cause_description,
      phiInvolved: typeof row.phi_involved === 'string' ? JSON.parse(row.phi_involved) : row.phi_involved,
      riskAssessment: row.risk_assessment,
      mitigationSteps: typeof row.mitigation_steps === 'string'
        ? JSON.parse(row.mitigation_steps)
        : row.mitigation_steps,
      hhsNotificationRequired: row.hhs_notification_required,
      hhsNotifiedAt: row.hhs_notified_at,
      individualsNotifiedAt: row.individuals_notified_at,
      mediaNotificationRequired: row.media_notification_required,
      status: row.status,
      closedAt: row.closed_at,
    };
  }

  private mapRowToRiskAnalysis(row: any): RiskAnalysis {
    return {
      id: row.id,
      analysisId: row.analysis_id,
      conductedAt: row.conducted_at,
      conductedBy: row.conducted_by,
      scope: row.scope,
      threatsIdentified: typeof row.threats_identified === 'string'
        ? JSON.parse(row.threats_identified)
        : row.threats_identified,
      safeguardsReviewed: typeof row.safeguards_reviewed === 'string'
        ? JSON.parse(row.safeguards_reviewed)
        : row.safeguards_reviewed,
      gaps: typeof row.gaps === 'string' ? JSON.parse(row.gaps) : row.gaps,
      recommendations: typeof row.recommendations === 'string'
        ? JSON.parse(row.recommendations)
        : row.recommendations,
      nextReviewDate: row.next_review_date,
      status: row.status,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
    };
  }

  private mapRowToTraining(row: any): WorkforceTraining {
    return {
      id: row.id,
      userId: row.user_id,
      trainingType: row.training_type,
      trainingDate: row.training_date,
      completedAt: row.completed_at,
      status: row.status,
      score: row.score,
      expiresAt: row.expires_at,
      certificateUrl: row.certificate_url,
      topics: typeof row.topics === 'string' ? JSON.parse(row.topics) : row.topics,
      duration: row.duration,
      instructor: row.instructor,
    };
  }

  private mapRowToMinimumNecessaryPolicy(row: any): MinimumNecessaryPolicy {
    return {
      id: row.id,
      policyName: row.policy_name,
      role: row.role,
      allowedPHICategories: typeof row.allowed_phi_categories === 'string'
        ? JSON.parse(row.allowed_phi_categories)
        : row.allowed_phi_categories,
      allowedOperations: typeof row.allowed_operations === 'string'
        ? JSON.parse(row.allowed_operations)
        : row.allowed_operations,
      conditions: typeof row.conditions === 'string' ? JSON.parse(row.conditions) : row.conditions,
      justificationRequired: row.justification_required,
      approvalRequired: row.approval_required,
      approvers: typeof row.approvers === 'string' ? JSON.parse(row.approvers) : row.approvers,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      active: row.active,
    };
  }

  private mapRowToAuditReport(row: any): AuditReport {
    return {
      id: row.id,
      reportId: row.report_id,
      reportType: row.report_type,
      period: { start: row.period_start, end: row.period_end },
      generatedAt: row.generated_at,
      generatedBy: row.generated_by,
      findings: typeof row.findings === 'string' ? JSON.parse(row.findings) : row.findings,
      complianceScore: row.compliance_score,
      s3Key: row.s3_key,
      status: row.status,
    };
  }
}
