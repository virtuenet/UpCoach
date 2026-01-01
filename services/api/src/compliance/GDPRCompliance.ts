import { Pool, PoolClient } from 'pg';
import { Queue, Job } from 'bullmq';
import Redis from 'ioredis';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { Logger } from 'winston';
import crypto from 'crypto';
import archiver from 'archiver';
import { Readable } from 'stream';

export enum GDPRRight {
  ACCESS = 'access',
  ERASURE = 'erasure',
  RECTIFICATION = 'rectification',
  PORTABILITY = 'portability',
  RESTRICTION = 'restriction',
  OBJECTION = 'objection',
}

export enum DSRStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum ConsentType {
  ESSENTIAL = 'essential',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  PERSONALIZATION = 'personalization',
  THIRD_PARTY = 'third_party',
}

export enum DataCategory {
  PERSONAL_IDENTIFIABLE = 'personal_identifiable',
  FINANCIAL = 'financial',
  HEALTH = 'health',
  BIOMETRIC = 'biometric',
  BEHAVIORAL = 'behavioral',
  LOCATION = 'location',
  COMMUNICATION = 'communication',
}

export enum ProcessingPurpose {
  CONTRACT_PERFORMANCE = 'contract_performance',
  LEGAL_OBLIGATION = 'legal_obligation',
  LEGITIMATE_INTEREST = 'legitimate_interest',
  CONSENT = 'consent',
  VITAL_INTEREST = 'vital_interest',
  PUBLIC_INTEREST = 'public_interest',
}

export enum BreachSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  requestType: GDPRRight;
  status: DSRStatus;
  submittedAt: Date;
  completedAt?: Date;
  verificationToken: string;
  verifiedAt?: Date;
  metadata: Record<string, any>;
  processorId?: string;
  notes?: string;
  expiresAt: Date;
}

export interface ConsentPreference {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  version: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
}

export interface DataMapping {
  id: string;
  tableName: string;
  columnName: string;
  dataCategory: DataCategory;
  isPII: boolean;
  isEncrypted: boolean;
  retentionPeriodDays: number;
  processingPurpose: ProcessingPurpose[];
  legalBasis: string;
  dataSubjectColumn?: string;
  metadata: Record<string, any>;
}

export interface DataBreach {
  id: string;
  detectedAt: Date;
  reportedAt?: Date;
  notifiedAt?: Date;
  severity: BreachSeverity;
  affectedRecords: number;
  affectedUsers: string[];
  description: string;
  containmentActions: string[];
  notificationRequired: boolean;
  supervisoryAuthorityNotified: boolean;
  dataSubjectsNotified: boolean;
  rootCause?: string;
  remediation?: string;
  status: 'detected' | 'investigating' | 'contained' | 'resolved';
}

export interface CookieConsent {
  id: string;
  userId?: string;
  sessionId: string;
  preferences: Record<ConsentType, boolean>;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  version: string;
  domain: string;
}

export interface DataPortabilityExport {
  userId: string;
  exportId: string;
  requestedAt: Date;
  completedAt?: Date;
  format: 'json' | 'csv' | 'xml';
  s3Key?: string;
  downloadUrl?: string;
  expiresAt: Date;
  fileSize?: number;
  dataCategories: DataCategory[];
}

export interface ProcessingActivity {
  id: string;
  name: string;
  purpose: ProcessingPurpose;
  legalBasis: string;
  dataCategories: DataCategory[];
  dataSubjects: string[];
  recipients: string[];
  retentionPeriod: number;
  crossBorderTransfers: boolean;
  transferMechanism?: string;
  securityMeasures: string[];
  dpoApproved: boolean;
  approvedAt?: Date;
  lastReviewed: Date;
}

export interface GDPRComplianceConfig {
  databasePool: Pool;
  redis: Redis;
  s3Client: S3Client;
  kmsClient: KMSClient;
  logger: Logger;
  dsrQueue: Queue;
  breachNotificationQueue: Queue;
  kmsKeyId: string;
  s3BucketName: string;
  dpoEmail: string;
  organizationName: string;
  supervisoryAuthorityContact: string;
  dataRetentionPolicyDays: number;
  dsrResponseTimeDays: number;
  breachNotificationHours: number;
}

export class GDPRComplianceService {
  private pool: Pool;
  private redis: Redis;
  private s3Client: S3Client;
  private kmsClient: KMSClient;
  private logger: Logger;
  private dsrQueue: Queue;
  private breachNotificationQueue: Queue;
  private kmsKeyId: string;
  private s3BucketName: string;
  private dpoEmail: string;
  private organizationName: string;
  private supervisoryAuthorityContact: string;
  private dataRetentionPolicyDays: number;
  private dsrResponseTimeDays: number;
  private breachNotificationHours: number;

  constructor(config: GDPRComplianceConfig) {
    this.pool = config.databasePool;
    this.redis = config.redis;
    this.s3Client = config.s3Client;
    this.kmsClient = config.kmsClient;
    this.logger = config.logger;
    this.dsrQueue = config.dsrQueue;
    this.breachNotificationQueue = config.breachNotificationQueue;
    this.kmsKeyId = config.kmsKeyId;
    this.s3BucketName = config.s3BucketName;
    this.dpoEmail = config.dpoEmail;
    this.organizationName = config.organizationName;
    this.supervisoryAuthorityContact = config.supervisoryAuthorityContact;
    this.dataRetentionPolicyDays = config.dataRetentionPolicyDays;
    this.dsrResponseTimeDays = config.dsrResponseTimeDays;
    this.breachNotificationHours = config.breachNotificationHours;
  }

  async submitDataSubjectRequest(
    userId: string,
    requestType: GDPRRight,
    metadata: Record<string, any> = {}
  ): Promise<DataSubjectRequest> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.dsrResponseTimeDays);

      const result = await client.query(
        `INSERT INTO gdpr_data_subject_requests (
          user_id, request_type, status, submitted_at, verification_token,
          metadata, expires_at
        ) VALUES ($1, $2, $3, NOW(), $4, $5, $6)
        RETURNING *`,
        [userId, requestType, DSRStatus.PENDING, verificationToken, JSON.stringify(metadata), expiresAt]
      );

      const dsr = this.mapRowToDSR(result.rows[0]);

      await this.dsrQueue.add(`dsr-${requestType}`, {
        dsrId: dsr.id,
        userId,
        requestType,
        metadata,
      }, {
        delay: 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      });

      await this.logComplianceEvent(client, {
        eventType: 'dsr_submitted',
        userId,
        details: { dsrId: dsr.id, requestType },
        timestamp: new Date(),
      });

      await client.query('COMMIT');

      this.logger.info('Data subject request submitted', {
        dsrId: dsr.id,
        userId,
        requestType,
      });

      return dsr;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to submit data subject request', { error, userId, requestType });
      throw error;
    } finally {
      client.release();
    }
  }

  async verifyDataSubjectRequest(dsrId: string, verificationToken: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `UPDATE gdpr_data_subject_requests
        SET verified_at = NOW(), status = $1
        WHERE id = $2 AND verification_token = $3 AND verified_at IS NULL
        RETURNING *`,
        [DSRStatus.PROCESSING, dsrId, verificationToken]
      );

      if (result.rows.length === 0) {
        return false;
      }

      await this.logComplianceEvent(client, {
        eventType: 'dsr_verified',
        userId: result.rows[0].user_id,
        details: { dsrId },
        timestamp: new Date(),
      });

      this.logger.info('Data subject request verified', { dsrId });
      return true;
    } catch (error) {
      this.logger.error('Failed to verify data subject request', { error, dsrId });
      throw error;
    } finally {
      client.release();
    }
  }

  async processRightOfAccess(userId: string, dsrId: string): Promise<DataPortabilityExport> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const dataMappings = await this.getDataMappingsForUser();
      const userData: Record<string, any> = {};

      for (const mapping of dataMappings) {
        try {
          const query = `SELECT * FROM ${mapping.tableName} WHERE ${mapping.dataSubjectColumn || 'user_id'} = $1`;
          const result = await client.query(query, [userId]);

          if (result.rows.length > 0) {
            userData[mapping.tableName] = result.rows.map(row => {
              const cleanRow = { ...row };
              if (mapping.isEncrypted) {
                for (const key in cleanRow) {
                  if (typeof cleanRow[key] === 'string' && cleanRow[key].startsWith('encrypted:')) {
                    cleanRow[key] = '[ENCRYPTED]';
                  }
                }
              }
              return cleanRow;
            });
          }
        } catch (error) {
          this.logger.warn('Failed to fetch data from table', {
            tableName: mapping.tableName,
            error,
          });
        }
      }

      const consents = await client.query(
        'SELECT * FROM gdpr_consent_preferences WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      userData.consent_history = consents.rows;

      const processingActivities = await client.query(
        'SELECT * FROM gdpr_processing_activities WHERE data_subjects @> $1',
        [JSON.stringify([userId])]
      );

      userData.processing_activities = processingActivities.rows;

      const exportId = crypto.randomBytes(16).toString('hex');
      const exportData = JSON.stringify(userData, null, 2);
      const s3Key = `gdpr-exports/${userId}/${exportId}.json`;

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.s3BucketName,
        Key: s3Key,
        Body: exportData,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: this.kmsKeyId,
        Metadata: {
          userId,
          exportId,
          dsrId,
        },
      }));

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const exportRecord = await client.query(
        `INSERT INTO gdpr_data_exports (
          user_id, export_id, requested_at, completed_at, format,
          s3_key, expires_at, file_size, data_categories
        ) VALUES ($1, $2, NOW(), NOW(), $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          userId,
          exportId,
          'json',
          s3Key,
          expiresAt,
          exportData.length,
          JSON.stringify(Object.keys(userData)),
        ]
      );

      await client.query(
        `UPDATE gdpr_data_subject_requests
        SET status = $1, completed_at = NOW()
        WHERE id = $2`,
        [DSRStatus.COMPLETED, dsrId]
      );

      await this.logComplianceEvent(client, {
        eventType: 'right_of_access_processed',
        userId,
        details: { dsrId, exportId, recordCount: Object.keys(userData).length },
        timestamp: new Date(),
      });

      await client.query('COMMIT');

      this.logger.info('Right of access processed', { userId, dsrId, exportId });

      return this.mapRowToExport(exportRecord.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to process right of access', { error, userId, dsrId });
      throw error;
    } finally {
      client.release();
    }
  }

  async processRightToErasure(userId: string, dsrId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const userCheck = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        throw new Error('User not found');
      }

      const hasActiveContracts = await client.query(
        `SELECT COUNT(*) as count FROM contracts
        WHERE user_id = $1 AND status = 'active'`,
        [userId]
      );

      if (parseInt(hasActiveContracts.rows[0].count) > 0) {
        await client.query(
          `UPDATE gdpr_data_subject_requests
          SET status = $1, notes = $2
          WHERE id = $3`,
          [DSRStatus.REJECTED, 'Cannot erase data due to active contracts (legal obligation)', dsrId]
        );
        await client.query('COMMIT');
        throw new Error('Cannot erase data due to active contracts');
      }

      const dataMappings = await this.getDataMappingsForUser();
      const erasureLog: Record<string, number> = {};

      for (const mapping of dataMappings) {
        try {
          if (mapping.processingPurpose.includes(ProcessingPurpose.LEGAL_OBLIGATION)) {
            this.logger.info('Skipping erasure for legal obligation', {
              tableName: mapping.tableName,
            });
            continue;
          }

          const deleteQuery = `DELETE FROM ${mapping.tableName}
            WHERE ${mapping.dataSubjectColumn || 'user_id'} = $1`;
          const result = await client.query(deleteQuery, [userId]);

          erasureLog[mapping.tableName] = result.rowCount || 0;
        } catch (error) {
          this.logger.warn('Failed to erase data from table', {
            tableName: mapping.tableName,
            error,
          });
        }
      }

      await client.query(
        `UPDATE users
        SET email = $1,
            first_name = 'ERASED',
            last_name = 'ERASED',
            phone = NULL,
            date_of_birth = NULL,
            profile_picture = NULL,
            bio = NULL,
            deleted_at = NOW(),
            deletion_reason = 'GDPR Right to Erasure'
        WHERE id = $2`,
        [`erased-${userId}@gdpr-erased.local`, userId]
      );

      await client.query(
        `INSERT INTO gdpr_erasure_log (
          user_id, dsr_id, erased_at, tables_affected, records_deleted
        ) VALUES ($1, $2, NOW(), $3, $4)`,
        [userId, dsrId, JSON.stringify(Object.keys(erasureLog)), JSON.stringify(erasureLog)]
      );

      await client.query(
        `UPDATE gdpr_data_subject_requests
        SET status = $1, completed_at = NOW()
        WHERE id = $2`,
        [DSRStatus.COMPLETED, dsrId]
      );

      await this.logComplianceEvent(client, {
        eventType: 'right_to_erasure_processed',
        userId,
        details: { dsrId, erasureLog },
        timestamp: new Date(),
      });

      await client.query('COMMIT');

      await this.redis.del(`user:${userId}:*`);
      await this.redis.del(`session:${userId}:*`);

      this.logger.info('Right to erasure processed', { userId, dsrId, erasureLog });
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to process right to erasure', { error, userId, dsrId });
      throw error;
    } finally {
      client.release();
    }
  }

  async processRightToRectification(
    userId: string,
    dsrId: string,
    corrections: Record<string, any>
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const validFields = ['email', 'first_name', 'last_name', 'phone', 'date_of_birth', 'address'];
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      for (const [field, value] of Object.entries(corrections)) {
        if (validFields.includes(field)) {
          updates.push(`${field} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updates.length > 0) {
        values.push(userId);
        const updateQuery = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`;
        await client.query(updateQuery, values);
      }

      await client.query(
        `INSERT INTO gdpr_rectification_log (
          user_id, dsr_id, rectified_at, fields_corrected, previous_values
        ) VALUES ($1, $2, NOW(), $3, $4)`,
        [userId, dsrId, JSON.stringify(Object.keys(corrections)), JSON.stringify(corrections)]
      );

      await client.query(
        `UPDATE gdpr_data_subject_requests
        SET status = $1, completed_at = NOW()
        WHERE id = $2`,
        [DSRStatus.COMPLETED, dsrId]
      );

      await this.logComplianceEvent(client, {
        eventType: 'right_to_rectification_processed',
        userId,
        details: { dsrId, correctedFields: Object.keys(corrections) },
        timestamp: new Date(),
      });

      await client.query('COMMIT');

      this.logger.info('Right to rectification processed', { userId, dsrId });
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to process right to rectification', { error, userId, dsrId });
      throw error;
    } finally {
      client.release();
    }
  }

  async processRightToDataPortability(
    userId: string,
    dsrId: string,
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<DataPortabilityExport> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const portableData = await this.extractPortableData(client, userId);

      let exportData: string;
      let contentType: string;

      switch (format) {
        case 'csv':
          exportData = this.convertToCSV(portableData);
          contentType = 'text/csv';
          break;
        case 'xml':
          exportData = this.convertToXML(portableData);
          contentType = 'application/xml';
          break;
        default:
          exportData = JSON.stringify(portableData, null, 2);
          contentType = 'application/json';
      }

      const exportId = crypto.randomBytes(16).toString('hex');
      const s3Key = `gdpr-portability/${userId}/${exportId}.${format}`;

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.s3BucketName,
        Key: s3Key,
        Body: exportData,
        ContentType: contentType,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: this.kmsKeyId,
      }));

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const exportRecord = await client.query(
        `INSERT INTO gdpr_data_exports (
          user_id, export_id, requested_at, completed_at, format,
          s3_key, expires_at, file_size, data_categories
        ) VALUES ($1, $2, NOW(), NOW(), $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          userId,
          exportId,
          format,
          s3Key,
          expiresAt,
          exportData.length,
          JSON.stringify([DataCategory.PERSONAL_IDENTIFIABLE, DataCategory.BEHAVIORAL]),
        ]
      );

      await client.query(
        `UPDATE gdpr_data_subject_requests
        SET status = $1, completed_at = NOW()
        WHERE id = $2`,
        [DSRStatus.COMPLETED, dsrId]
      );

      await this.logComplianceEvent(client, {
        eventType: 'right_to_portability_processed',
        userId,
        details: { dsrId, exportId, format },
        timestamp: new Date(),
      });

      await client.query('COMMIT');

      this.logger.info('Right to data portability processed', { userId, dsrId, format });

      return this.mapRowToExport(exportRecord.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to process right to data portability', { error, userId, dsrId });
      throw error;
    } finally {
      client.release();
    }
  }

  async processRightToRestriction(userId: string, dsrId: string, reason: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE users SET processing_restricted = true, restriction_reason = $1 WHERE id = $2`,
        [reason, userId]
      );

      await client.query(
        `INSERT INTO gdpr_processing_restrictions (
          user_id, dsr_id, restricted_at, reason, active
        ) VALUES ($1, $2, NOW(), $3, true)`,
        [userId, dsrId, reason]
      );

      await client.query(
        `UPDATE gdpr_data_subject_requests
        SET status = $1, completed_at = NOW()
        WHERE id = $2`,
        [DSRStatus.COMPLETED, dsrId]
      );

      await this.logComplianceEvent(client, {
        eventType: 'right_to_restriction_processed',
        userId,
        details: { dsrId, reason },
        timestamp: new Date(),
      });

      await client.query('COMMIT');

      this.logger.info('Right to restriction processed', { userId, dsrId });
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to process right to restriction', { error, userId, dsrId });
      throw error;
    } finally {
      client.release();
    }
  }

  async recordConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    ipAddress: string,
    userAgent: string,
    version: string
  ): Promise<ConsentPreference> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO gdpr_consent_preferences (
          user_id, consent_type, granted, granted_at, revoked_at,
          version, ip_address, user_agent, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          userId,
          consentType,
          granted,
          granted ? new Date() : null,
          !granted ? new Date() : null,
          version,
          ipAddress,
          userAgent,
          JSON.stringify({}),
        ]
      );

      await this.logComplianceEvent(client, {
        eventType: granted ? 'consent_granted' : 'consent_revoked',
        userId,
        details: { consentType, version },
        timestamp: new Date(),
      });

      this.logger.info('Consent recorded', { userId, consentType, granted });

      return this.mapRowToConsent(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to record consent', { error, userId, consentType });
      throw error;
    } finally {
      client.release();
    }
  }

  async recordCookieConsent(
    sessionId: string,
    preferences: Record<ConsentType, boolean>,
    ipAddress: string,
    userAgent: string,
    domain: string,
    userId?: string
  ): Promise<CookieConsent> {
    const client = await this.pool.connect();
    try {
      const version = '1.0';

      const result = await client.query(
        `INSERT INTO gdpr_cookie_consents (
          user_id, session_id, preferences, timestamp, ip_address,
          user_agent, version, domain
        ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7)
        RETURNING *`,
        [userId, sessionId, JSON.stringify(preferences), ipAddress, userAgent, version, domain]
      );

      await this.redis.setex(
        `cookie-consent:${sessionId}`,
        86400 * 365,
        JSON.stringify(preferences)
      );

      this.logger.info('Cookie consent recorded', { sessionId, userId });

      return this.mapRowToCookieConsent(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to record cookie consent', { error, sessionId });
      throw error;
    } finally {
      client.release();
    }
  }

  async reportDataBreach(
    description: string,
    severity: BreachSeverity,
    affectedUsers: string[],
    containmentActions: string[]
  ): Promise<DataBreach> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const notificationRequired = severity === BreachSeverity.HIGH || severity === BreachSeverity.CRITICAL;

      const result = await client.query(
        `INSERT INTO gdpr_data_breaches (
          detected_at, severity, affected_records, affected_users,
          description, containment_actions, notification_required,
          supervisory_authority_notified, data_subjects_notified, status
        ) VALUES (NOW(), $1, $2, $3, $4, $5, $6, false, false, 'detected')
        RETURNING *`,
        [
          severity,
          affectedUsers.length,
          JSON.stringify(affectedUsers),
          description,
          JSON.stringify(containmentActions),
          notificationRequired,
        ]
      );

      const breach = this.mapRowToBreach(result.rows[0]);

      if (notificationRequired) {
        await this.breachNotificationQueue.add('breach-notification', {
          breachId: breach.id,
          severity,
          affectedUsers,
        }, {
          delay: 0,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 10000,
          },
        });
      }

      await this.logComplianceEvent(client, {
        eventType: 'data_breach_reported',
        userId: 'system',
        details: { breachId: breach.id, severity, affectedRecords: affectedUsers.length },
        timestamp: new Date(),
      });

      await client.query('COMMIT');

      this.logger.error('Data breach reported', {
        breachId: breach.id,
        severity,
        affectedRecords: affectedUsers.length,
      });

      return breach;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to report data breach', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  async notifyDataBreach(breachId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const breach = await client.query(
        'SELECT * FROM gdpr_data_breaches WHERE id = $1',
        [breachId]
      );

      if (breach.rows.length === 0) {
        throw new Error('Breach not found');
      }

      const breachData = this.mapRowToBreach(breach.rows[0]);
      const hoursSinceDetection = (Date.now() - breachData.detectedAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceDetection > this.breachNotificationHours) {
        this.logger.warn('Breach notification deadline exceeded', {
          breachId,
          hoursSinceDetection,
          deadline: this.breachNotificationHours,
        });
      }

      await client.query(
        `UPDATE gdpr_data_breaches
        SET supervisory_authority_notified = true,
            data_subjects_notified = true,
            notified_at = NOW(),
            status = 'investigating'
        WHERE id = $1`,
        [breachId]
      );

      await this.logComplianceEvent(client, {
        eventType: 'data_breach_notified',
        userId: 'system',
        details: { breachId, hoursSinceDetection },
        timestamp: new Date(),
      });

      await client.query('COMMIT');

      this.logger.info('Data breach notification completed', { breachId });
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to notify data breach', { error, breachId });
      throw error;
    } finally {
      client.release();
    }
  }

  async registerDataMapping(mapping: Omit<DataMapping, 'id'>): Promise<DataMapping> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO gdpr_data_mappings (
          table_name, column_name, data_category, is_pii, is_encrypted,
          retention_period_days, processing_purpose, legal_basis,
          data_subject_column, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          mapping.tableName,
          mapping.columnName,
          mapping.dataCategory,
          mapping.isPII,
          mapping.isEncrypted,
          mapping.retentionPeriodDays,
          JSON.stringify(mapping.processingPurpose),
          mapping.legalBasis,
          mapping.dataSubjectColumn,
          JSON.stringify(mapping.metadata),
        ]
      );

      this.logger.info('Data mapping registered', {
        tableName: mapping.tableName,
        columnName: mapping.columnName,
      });

      return this.mapRowToDataMapping(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to register data mapping', { error, mapping });
      throw error;
    } finally {
      client.release();
    }
  }

  async getDataMappingsForUser(): Promise<DataMapping[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM gdpr_data_mappings ORDER BY table_name, column_name'
      );

      return result.rows.map(row => this.mapRowToDataMapping(row));
    } catch (error) {
      this.logger.error('Failed to get data mappings', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  async enforceDataRetention(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const dataMappings = await this.getDataMappingsForUser();
      const deletionLog: Record<string, number> = {};

      for (const mapping of dataMappings) {
        try {
          const retentionDate = new Date();
          retentionDate.setDate(retentionDate.getDate() - mapping.retentionPeriodDays);

          const deleteQuery = `
            DELETE FROM ${mapping.tableName}
            WHERE created_at < $1
            AND (deleted_at IS NULL OR deleted_at < $1)
          `;

          const result = await client.query(deleteQuery, [retentionDate]);

          if (result.rowCount && result.rowCount > 0) {
            deletionLog[mapping.tableName] = result.rowCount;
          }
        } catch (error) {
          this.logger.warn('Failed to enforce retention for table', {
            tableName: mapping.tableName,
            error,
          });
        }
      }

      await this.logComplianceEvent(client, {
        eventType: 'data_retention_enforced',
        userId: 'system',
        details: { deletionLog },
        timestamp: new Date(),
      });

      await client.query('COMMIT');

      this.logger.info('Data retention enforced', { deletionLog });
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
      const metrics = {
        totalScore: 0,
        maxScore: 0,
      };

      const dsrStats = await client.query(
        `SELECT
          COUNT(*) FILTER (WHERE completed_at <= expires_at) as on_time,
          COUNT(*) as total
        FROM gdpr_data_subject_requests
        WHERE submitted_at > NOW() - INTERVAL '30 days'`
      );

      if (dsrStats.rows[0].total > 0) {
        const dsrCompletionRate = dsrStats.rows[0].on_time / dsrStats.rows[0].total;
        metrics.totalScore += dsrCompletionRate * 30;
      } else {
        metrics.totalScore += 30;
      }
      metrics.maxScore += 30;

      const consentStats = await client.query(
        `SELECT COUNT(*) as total FROM gdpr_consent_preferences
        WHERE created_at > NOW() - INTERVAL '30 days'`
      );

      if (consentStats.rows[0].total > 0) {
        metrics.totalScore += 20;
      } else {
        metrics.totalScore += 10;
      }
      metrics.maxScore += 20;

      const breachStats = await client.query(
        `SELECT
          COUNT(*) FILTER (WHERE notified_at <= detected_at + INTERVAL '72 hours') as on_time,
          COUNT(*) as total
        FROM gdpr_data_breaches
        WHERE detected_at > NOW() - INTERVAL '30 days'
        AND notification_required = true`
      );

      if (breachStats.rows[0].total > 0) {
        const breachNotificationRate = breachStats.rows[0].on_time / breachStats.rows[0].total;
        metrics.totalScore += breachNotificationRate * 25;
      } else {
        metrics.totalScore += 25;
      }
      metrics.maxScore += 25;

      const mappingStats = await client.query(
        'SELECT COUNT(*) as total FROM gdpr_data_mappings'
      );

      if (mappingStats.rows[0].total > 10) {
        metrics.totalScore += 25;
      } else if (mappingStats.rows[0].total > 5) {
        metrics.totalScore += 15;
      } else {
        metrics.totalScore += 5;
      }
      metrics.maxScore += 25;

      const score = (metrics.totalScore / metrics.maxScore) * 100;

      this.logger.info('Compliance score calculated', { score, metrics });

      return Math.round(score);
    } catch (error) {
      this.logger.error('Failed to calculate compliance score', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  private async extractPortableData(client: PoolClient, userId: string): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    const user = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (user.rows.length > 0) {
      data.profile = user.rows[0];
    }

    const sessions = await client.query(
      'SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [userId]
    );
    data.sessions = sessions.rows;

    const activities = await client.query(
      'SELECT * FROM user_activities WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1000',
      [userId]
    );
    data.activities = activities.rows;

    return data;
  }

  private convertToCSV(data: Record<string, any>): string {
    const lines: string[] = [];

    for (const [tableName, records] of Object.entries(data)) {
      if (!Array.isArray(records) || records.length === 0) continue;

      lines.push(`\n${tableName}`);
      const headers = Object.keys(records[0]);
      lines.push(headers.join(','));

      for (const record of records) {
        const values = headers.map(h => {
          const val = record[h];
          return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
        });
        lines.push(values.join(','));
      }
    }

    return lines.join('\n');
  }

  private convertToXML(data: Record<string, any>): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';

    for (const [key, value] of Object.entries(data)) {
      xml += `  <${key}>`;
      if (Array.isArray(value)) {
        xml += '\n';
        for (const item of value) {
          xml += '    <item>\n';
          for (const [k, v] of Object.entries(item)) {
            xml += `      <${k}>${this.escapeXML(String(v))}</${k}>\n`;
          }
          xml += '    </item>\n';
        }
        xml += `  `;
      } else {
        xml += this.escapeXML(String(value));
      }
      xml += `</${key}>\n`;
    }

    xml += '</data>';
    return xml;
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private async logComplianceEvent(
    client: PoolClient,
    event: {
      eventType: string;
      userId: string;
      details: Record<string, any>;
      timestamp: Date;
    }
  ): Promise<void> {
    await client.query(
      `INSERT INTO gdpr_compliance_events (
        event_type, user_id, details, timestamp
      ) VALUES ($1, $2, $3, $4)`,
      [event.eventType, event.userId, JSON.stringify(event.details), event.timestamp]
    );
  }

  private mapRowToDSR(row: any): DataSubjectRequest {
    return {
      id: row.id,
      userId: row.user_id,
      requestType: row.request_type,
      status: row.status,
      submittedAt: row.submitted_at,
      completedAt: row.completed_at,
      verificationToken: row.verification_token,
      verifiedAt: row.verified_at,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      processorId: row.processor_id,
      notes: row.notes,
      expiresAt: row.expires_at,
    };
  }

  private mapRowToConsent(row: any): ConsentPreference {
    return {
      id: row.id,
      userId: row.user_id,
      consentType: row.consent_type,
      granted: row.granted,
      grantedAt: row.granted_at,
      revokedAt: row.revoked_at,
      version: row.version,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    };
  }

  private mapRowToDataMapping(row: any): DataMapping {
    return {
      id: row.id,
      tableName: row.table_name,
      columnName: row.column_name,
      dataCategory: row.data_category,
      isPII: row.is_pii,
      isEncrypted: row.is_encrypted,
      retentionPeriodDays: row.retention_period_days,
      processingPurpose: typeof row.processing_purpose === 'string'
        ? JSON.parse(row.processing_purpose)
        : row.processing_purpose,
      legalBasis: row.legal_basis,
      dataSubjectColumn: row.data_subject_column,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    };
  }

  private mapRowToBreach(row: any): DataBreach {
    return {
      id: row.id,
      detectedAt: row.detected_at,
      reportedAt: row.reported_at,
      notifiedAt: row.notified_at,
      severity: row.severity,
      affectedRecords: row.affected_records,
      affectedUsers: typeof row.affected_users === 'string'
        ? JSON.parse(row.affected_users)
        : row.affected_users,
      description: row.description,
      containmentActions: typeof row.containment_actions === 'string'
        ? JSON.parse(row.containment_actions)
        : row.containment_actions,
      notificationRequired: row.notification_required,
      supervisoryAuthorityNotified: row.supervisory_authority_notified,
      dataSubjectsNotified: row.data_subjects_notified,
      rootCause: row.root_cause,
      remediation: row.remediation,
      status: row.status,
    };
  }

  private mapRowToCookieConsent(row: any): CookieConsent {
    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      preferences: typeof row.preferences === 'string' ? JSON.parse(row.preferences) : row.preferences,
      timestamp: row.timestamp,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      version: row.version,
      domain: row.domain,
    };
  }

  private mapRowToExport(row: any): DataPortabilityExport {
    return {
      userId: row.user_id,
      exportId: row.export_id,
      requestedAt: row.requested_at,
      completedAt: row.completed_at,
      format: row.format,
      s3Key: row.s3_key,
      downloadUrl: row.download_url,
      expiresAt: row.expires_at,
      fileSize: row.file_size,
      dataCategories: typeof row.data_categories === 'string'
        ? JSON.parse(row.data_categories)
        : row.data_categories,
    };
  }
}
