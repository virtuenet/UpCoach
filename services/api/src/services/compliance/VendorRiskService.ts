import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Vendor Risk Service
 *
 * Third-party vendor risk assessment for SOC2 compliance:
 * - Vendor questionnaire templates
 * - Risk scoring (SOC2, ISO27001, penetration tests)
 * - Vendor security documentation storage
 * - Annual re-assessment scheduling
 * - Vendor risk dashboard
 *
 * Risk Criteria:
 * - SOC2 Type II certification (30 points)
 * - ISO 27001 certification (20 points)
 * - Recent penetration test (<12 months) (20 points)
 * - Data processing agreement signed (15 points)
 * - GDPR/CCPA compliance (10 points)
 * - No recent security incidents (5 points)
 *
 * Risk Score: 0-100
 * - 80-100: Low Risk (Green)
 * - 60-79: Medium Risk (Yellow)
 * - 0-59: High Risk (Red)
 */

export interface Vendor {
  id: string;
  name: string;
  website: string;
  contactEmail: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastAssessedAt?: Date;
  nextReassessmentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorQuestionnaire {
  hasSoc2: boolean;
  soc2Type?: 'type1' | 'type2';
  soc2ExpiryDate?: string;
  hasIso27001: boolean;
  iso27001ExpiryDate?: string;
  hasPenetrationTest: boolean;
  penetrationTestDate?: string;
  hasDPA: boolean;
  dpaSignedDate?: string;
  isGdprCompliant: boolean;
  isCcpaCompliant: boolean;
  recentIncidents: number;
  dataLocation: string;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  backupFrequency: string;
  incidentResponsePlan: boolean;
}

export interface VendorAssessment {
  id: string;
  vendorId: string;
  questionnaireData: VendorQuestionnaire;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  assessedBy: string;
  assessedAt: Date;
  notes?: string;
}

export interface VendorCertificate {
  id: string;
  vendorId: string;
  certificateType: 'soc2' | 'iso27001' | 'pentest' | 'dpa' | 'other';
  fileUrl: string;
  expiryDate?: Date;
  uploadedAt: Date;
}

export interface VendorRiskReport {
  vendorId: string;
  vendorName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastAssessed: Date;
  nextReassessment: Date;
  certificatesCount: number;
  complianceGaps: string[];
}

export class VendorRiskService {
  private db: Pool;
  private s3Client: S3Client;

  constructor(db: Pool) {
    this.db = db;
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Create new vendor
   */
  async createVendor(
    name: string,
    website: string,
    contactEmail: string
  ): Promise<Vendor> {
    try {
      const query = `
        INSERT INTO vendors (name, website, contact_email, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `;
      const result = await this.db.query(query, [name, website, contactEmail]);

      logger.info('Vendor created', { vendorId: result.rows[0].id, name });

      return this.mapRowToVendor(result.rows[0]);
    } catch (error) {
      logger.error('Vendor creation failed', {
        name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Assess vendor risk
   */
  async assessVendor(
    vendorId: string,
    questionnaire: VendorQuestionnaire,
    assessedBy: string,
    notes?: string
  ): Promise<VendorAssessment> {
    try {
      // Calculate risk score
      const riskScore = this.calculateRiskScore(questionnaire);
      const riskLevel = this.getRiskLevel(riskScore);

      // Save assessment
      const query = `
        INSERT INTO vendor_assessments (
          vendor_id, questionnaire_data, risk_score,
          assessed_by, assessed_at, notes
        )
        VALUES ($1, $2, $3, $4, NOW(), $5)
        RETURNING *
      `;
      const result = await this.db.query(query, [
        vendorId,
        JSON.stringify(questionnaire),
        riskScore,
        assessedBy,
        notes,
      ]);

      // Update vendor risk score
      await this.db.query(
        `UPDATE vendors
         SET risk_score = $1, last_assessed_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [riskScore, vendorId]
      );

      // Schedule next reassessment (12 months)
      const nextReassessment = new Date();
      nextReassessment.setMonth(nextReassessment.getMonth() + 12);
      await this.scheduleReassessment(vendorId, 12);

      logger.info('Vendor assessed', {
        vendorId,
        riskScore,
        riskLevel,
        assessedBy,
      });

      return {
        id: result.rows[0].id,
        vendorId: result.rows[0].vendor_id,
        questionnaireData: questionnaire,
        riskScore,
        riskLevel,
        assessedBy: result.rows[0].assessed_by,
        assessedAt: result.rows[0].assessed_at,
        notes: result.rows[0].notes,
      };
    } catch (error) {
      logger.error('Vendor assessment failed', {
        vendorId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Upload vendor certificate
   */
  async uploadVendorCertificate(
    vendorId: string,
    certificateType: 'soc2' | 'iso27001' | 'pentest' | 'dpa' | 'other',
    file: Buffer,
    fileName: string,
    expiryDate?: Date
  ): Promise<VendorCertificate> {
    try {
      // Upload to S3
      const s3Key = `vendor-certificates/${vendorId}/${Date.now()}-${fileName}`;
      const bucketName = process.env.S3_BUCKET_NAME || 'upcoach-compliance';

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: file,
          ContentType: 'application/pdf',
          ServerSideEncryption: 'AES256',
        })
      );

      const fileUrl = `s3://${bucketName}/${s3Key}`;

      // Save certificate metadata
      const query = `
        INSERT INTO vendor_certificates (
          vendor_id, certificate_type, file_url, expiry_date, uploaded_at
        )
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;
      const result = await this.db.query(query, [
        vendorId,
        certificateType,
        fileUrl,
        expiryDate,
      ]);

      logger.info('Vendor certificate uploaded', {
        vendorId,
        certificateType,
        fileUrl,
      });

      return {
        id: result.rows[0].id,
        vendorId: result.rows[0].vendor_id,
        certificateType: result.rows[0].certificate_type,
        fileUrl: result.rows[0].file_url,
        expiryDate: result.rows[0].expiry_date,
        uploadedAt: result.rows[0].uploaded_at,
      };
    } catch (error) {
      logger.error('Vendor certificate upload failed', {
        vendorId,
        certificateType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Schedule vendor reassessment
   */
  async scheduleReassessment(vendorId: string, intervalMonths: number): Promise<void> {
    const nextReassessment = new Date();
    nextReassessment.setMonth(nextReassessment.getMonth() + intervalMonths);

    await this.db.query(
      `UPDATE vendors SET next_reassessment_at = $1, updated_at = NOW() WHERE id = $2`,
      [nextReassessment, vendorId]
    );

    logger.info('Vendor reassessment scheduled', {
      vendorId,
      nextReassessment,
    });
  }

  /**
   * Get vendor risk report
   */
  async getVendorRiskReport(tenantId: string): Promise<VendorRiskReport[]> {
    const query = `
      SELECT
        v.id AS vendor_id,
        v.name AS vendor_name,
        v.risk_score,
        v.last_assessed_at,
        v.next_reassessment_at,
        COUNT(DISTINCT vc.id) AS certificates_count
      FROM vendors v
      LEFT JOIN vendor_certificates vc ON v.id = vc.vendor_id
      WHERE v.tenant_id = $1
      GROUP BY v.id, v.name, v.risk_score, v.last_assessed_at, v.next_reassessment_at
      ORDER BY v.risk_score ASC
    `;
    const result = await this.db.query(query, [tenantId]);

    return result.rows.map((row) => ({
      vendorId: row.vendor_id,
      vendorName: row.vendor_name,
      riskScore: row.risk_score || 0,
      riskLevel: this.getRiskLevel(row.risk_score || 0),
      lastAssessed: row.last_assessed_at,
      nextReassessment: row.next_reassessment_at,
      certificatesCount: parseInt(row.certificates_count),
      complianceGaps: this.identifyComplianceGaps(row),
    }));
  }

  /**
   * Get vendors due for reassessment
   */
  async getVendorsDueForReassessment(): Promise<Vendor[]> {
    const query = `
      SELECT * FROM vendors
      WHERE next_reassessment_at <= NOW()
        OR (last_assessed_at IS NULL AND created_at < NOW() - INTERVAL '30 days')
      ORDER BY next_reassessment_at ASC
    `;
    const result = await this.db.query(query);
    return result.rows.map(this.mapRowToVendor);
  }

  /**
   * Get expiring certificates
   */
  async getExpiringCertificates(daysThreshold: number = 60): Promise<VendorCertificate[]> {
    const query = `
      SELECT * FROM vendor_certificates
      WHERE expiry_date IS NOT NULL
        AND expiry_date <= NOW() + INTERVAL '${daysThreshold} days'
        AND expiry_date >= NOW()
      ORDER BY expiry_date ASC
    `;
    const result = await this.db.query(query);
    return result.rows.map(this.mapRowToCertificate);
  }

  /**
   * Private helper methods
   */

  private calculateRiskScore(questionnaire: VendorQuestionnaire): number {
    let score = 0;

    // SOC2 Type II (30 points)
    if (questionnaire.hasSoc2 && questionnaire.soc2Type === 'type2') {
      score += 30;
    } else if (questionnaire.hasSoc2 && questionnaire.soc2Type === 'type1') {
      score += 20;
    }

    // ISO 27001 (20 points)
    if (questionnaire.hasIso27001) {
      score += 20;
    }

    // Penetration Test (20 points)
    if (questionnaire.hasPenetrationTest) {
      const testDate = new Date(questionnaire.penetrationTestDate || '');
      const monthsSinceTest = this.getMonthsDifference(testDate, new Date());
      if (monthsSinceTest < 12) {
        score += 20;
      } else if (monthsSinceTest < 24) {
        score += 10;
      }
    }

    // Data Processing Agreement (15 points)
    if (questionnaire.hasDPA) {
      score += 15;
    }

    // GDPR/CCPA Compliance (10 points)
    if (questionnaire.isGdprCompliant && questionnaire.isCcpaCompliant) {
      score += 10;
    } else if (questionnaire.isGdprCompliant || questionnaire.isCcpaCompliant) {
      score += 5;
    }

    // No Recent Incidents (5 points)
    if (questionnaire.recentIncidents === 0) {
      score += 5;
    }

    // Deduct points for incidents
    score -= Math.min(questionnaire.recentIncidents * 10, 30);

    return Math.max(0, Math.min(100, score));
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    return 'high';
  }

  private identifyComplianceGaps(vendor: any): string[] {
    const gaps: string[] = [];

    if (!vendor.risk_score || vendor.risk_score < 80) {
      if (vendor.risk_score < 30) gaps.push('Missing SOC2 certification');
      if (vendor.risk_score < 50) gaps.push('Missing ISO 27001 certification');
      if (vendor.risk_score < 70) gaps.push('No recent penetration test');
    }

    if (!vendor.last_assessed_at) {
      gaps.push('Never assessed');
    } else {
      const monthsSinceAssessment = this.getMonthsDifference(
        vendor.last_assessed_at,
        new Date()
      );
      if (monthsSinceAssessment > 12) {
        gaps.push('Assessment overdue');
      }
    }

    return gaps;
  }

  private getMonthsDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
  }

  private mapRowToVendor(row: any): Vendor {
    return {
      id: row.id,
      name: row.name,
      website: row.website,
      contactEmail: row.contact_email,
      riskScore: row.risk_score || 0,
      riskLevel: this.getRiskLevel(row.risk_score || 0),
      lastAssessedAt: row.last_assessed_at,
      nextReassessmentAt: row.next_reassessment_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToCertificate(row: any): VendorCertificate {
    return {
      id: row.id,
      vendorId: row.vendor_id,
      certificateType: row.certificate_type,
      fileUrl: row.file_url,
      expiryDate: row.expiry_date,
      uploadedAt: row.uploaded_at,
    };
  }
}
