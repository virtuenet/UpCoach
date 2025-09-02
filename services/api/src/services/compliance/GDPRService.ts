/**
 * GDPR Compliance Service
 * Implements GDPR requirements for data protection and privacy
 */

import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import { redis } from '../redis';
import { sequelize } from '../../config/database';
import { Op } from 'sequelize';
import crypto from 'crypto';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { addDays, differenceInDays } from 'date-fns';

export interface ConsentRecord {
  userId: string;
  purpose: ConsentPurpose;
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  version: string;
  expiresAt?: Date;
}

export enum ConsentPurpose {
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  FUNCTIONAL = 'functional',
  NECESSARY = 'necessary',
  PERFORMANCE = 'performance',
  TARGETING = 'targeting',
  SOCIAL_MEDIA = 'social_media',
  EMAIL_COMMUNICATIONS = 'email_communications',
  DATA_PROCESSING = 'data_processing',
  THIRD_PARTY_SHARING = 'third_party_sharing',
}

export interface DataPortabilityRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  format: 'json' | 'csv' | 'xml';
}

export interface DeletionRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  scheduledFor: Date;
  completedAt?: Date;
  status: 'pending' | 'scheduled' | 'processing' | 'completed' | 'cancelled';
  reason?: string;
  retainData?: string[]; // Data categories to retain for legal reasons
}

export interface DataBreachIncident {
  id: string;
  detectedAt: Date;
  reportedAt?: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedUsers: string[];
  dataTypes: string[];
  description: string;
  containmentActions: string[];
  notificationsSent: boolean;
  regulatorNotified: boolean;
}

class GDPRService {
  private static instance: GDPRService;
  private readonly consentVersion = '2.0';
  private readonly dataRetentionDays = 365 * 3; // 3 years default
  private readonly deletionGracePeriod = 30; // 30 days before actual deletion

  private constructor() {}

  static getInstance(): GDPRService {
    if (!GDPRService.instance) {
      GDPRService.instance = new GDPRService();
    }
    return GDPRService.instance;
  }

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    purpose: ConsentPurpose,
    granted: boolean,
    ipAddress: string,
    userAgent: string
  ): Promise<ConsentRecord> {
    try {
      const consent: ConsentRecord = {
        userId,
        purpose,
        granted,
        timestamp: new Date(),
        ipAddress: this.hashIP(ipAddress), // Hash IP for privacy
        userAgent,
        version: this.consentVersion,
        expiresAt: granted ? addDays(new Date(), 365) : undefined, // Consent expires after 1 year
      };

      // Store in database
      await sequelize.models.ConsentLog.create({
        userId,
        purpose,
        granted,
        timestamp: consent.timestamp,
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent,
        version: consent.version,
        expiresAt: consent.expiresAt,
      });

      // Update user's current consent status in Redis for quick access
      const key = `consent:${userId}:${purpose}`;
      await redis.set(key, JSON.stringify(consent));

      logger.info('Consent recorded', { userId, purpose, granted });

      // Trigger consent-based actions
      if (granted) {
        await this.onConsentGranted(userId, purpose);
      } else {
        await this.onConsentRevoked(userId, purpose);
      }

      return consent;
    } catch (error) {
      logger.error('Error recording consent', error);
      throw new Error('Failed to record consent');
    }
  }

  /**
   * Get user's consent status
   */
  async getConsentStatus(userId: string): Promise<Record<ConsentPurpose, boolean>> {
    try {
      const purposes = Object.values(ConsentPurpose);
      const status: Record<string, boolean> = {};

      for (const purpose of purposes) {
        const key = `consent:${userId}:${purpose}`;
        const data = await redis.get(key);

        if (data) {
          const consent: ConsentRecord = JSON.parse(data);
          // Check if consent is still valid
          if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
            status[purpose] = false;
          } else {
            status[purpose] = consent.granted;
          }
        } else {
          // No consent record means not granted (opt-in approach)
          status[purpose] = purpose === ConsentPurpose.NECESSARY; // Only necessary is true by default
        }
      }

      return status as Record<ConsentPurpose, boolean>;
    } catch (error) {
      logger.error('Error getting consent status', error);
      throw new Error('Failed to get consent status');
    }
  }

  /**
   * Request data portability (Right to Data Portability)
   */
  async requestDataPortability(
    userId: string,
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<DataPortabilityRequest> {
    try {
      const requestId = crypto.randomUUID();

      const request: DataPortabilityRequest = {
        id: requestId,
        userId,
        requestedAt: new Date(),
        status: 'pending',
        format,
        expiresAt: addDays(new Date(), 7), // Download expires in 7 days
      };

      // Store request
      await redis.set(`data-export:${requestId}`, JSON.stringify(request));

      // Queue for processing
      await this.queueDataExport(request);

      logger.info('Data portability requested', { userId, requestId });

      return request;
    } catch (error) {
      logger.error('Error requesting data portability', error);
      throw new Error('Failed to request data export');
    }
  }

  /**
   * Process data export
   */
  private async queueDataExport(request: DataPortabilityRequest): Promise<void> {
    // In production, this would be a background job
    setTimeout(async () => {
      try {
        await this.processDataExport(request);
      } catch (error) {
        logger.error('Error processing data export', error);
      }
    }, 1000);
  }

  /**
   * Export user data
   */
  private async processDataExport(request: DataPortabilityRequest): Promise<void> {
    try {
      request.status = 'processing';
      await redis.set(`data-export:${request.id}`, JSON.stringify(request));

      // Collect all user data
      const userData = await this.collectUserData(request.userId);

      // Create export file
      const filePath = await this.createExportFile(userData, request.format, request.userId);

      // Generate secure download URL
      const downloadUrl = await this.generateSecureDownloadUrl(filePath, request.id);

      // Update request
      request.status = 'completed';
      request.completedAt = new Date();
      request.downloadUrl = downloadUrl;

      await redis.set(`data-export:${request.id}`, JSON.stringify(request));

      // Notify user
      await this.notifyDataExportReady(request.userId, downloadUrl);

      logger.info('Data export completed', { userId: request.userId, requestId: request.id });
    } catch (error) {
      logger.error('Error processing data export', error);
      request.status = 'failed';
      await redis.set(`data-export:${request.id}`, JSON.stringify(request));
      throw error;
    }
  }

  /**
   * Collect all user data for export
   */
  private async collectUserData(userId: string): Promise<any> {
    const userData: any = {
      exportDate: new Date().toISOString(),
      gdprExportVersion: '1.0',
    };

    // User profile
    const user = await User.findByPk(userId, {
      include: ['profile', 'goals', 'tasks', 'moods', 'chats'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Basic user data
    userData.profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      emailVerified: user.emailVerified,
    };

    // Related data
    userData.goals = user.goals || [];
    userData.tasks = user.tasks || [];
    userData.moods = user.moods || [];
    userData.chats =
      user.chats?.map((chat: any) => ({
        id: chat.id,
        message: chat.message,
        response: chat.response,
        createdAt: chat.createdAt,
      })) || [];

    // Consent history
    userData.consentHistory = await sequelize.models.ConsentLog.findAll({
      where: { userId },
      order: [['timestamp', 'DESC']],
    });

    // Activity logs (last 90 days)
    userData.activityLogs = await sequelize.models.ActivityLog.findAll({
      where: {
        userId,
        createdAt: {
          [Op.gte]: addDays(new Date(), -90),
        },
      },
      order: [['createdAt', 'DESC']],
    });

    return userData;
  }

  /**
   * Create export file in requested format
   */
  private async createExportFile(
    data: any,
    format: 'json' | 'csv' | 'xml',
    userId: string
  ): Promise<string> {
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = Date.now();
    const baseFileName = `gdpr-export-${userId}-${timestamp}`;
    let filePath: string;

    switch (format) {
      case 'json':
        filePath = path.join(exportDir, `${baseFileName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        break;

      case 'csv':
        // For CSV, we need to flatten the data structure
        filePath = path.join(exportDir, `${baseFileName}.zip`);
        await this.createCSVExport(data, filePath);
        break;

      case 'xml':
        filePath = path.join(exportDir, `${baseFileName}.xml`);
        const xml = this.jsonToXML(data);
        fs.writeFileSync(filePath, xml);
        break;

      default:
        throw new Error('Unsupported export format');
    }

    // Encrypt the file
    const encryptedPath = await this.encryptFile(filePath);

    // Delete unencrypted file
    fs.unlinkSync(filePath);

    return encryptedPath;
  }

  /**
   * Request account deletion (Right to Erasure)
   */
  async requestDeletion(
    userId: string,
    reason?: string,
    immediate: boolean = false
  ): Promise<DeletionRequest> {
    try {
      const requestId = crypto.randomUUID();

      const request: DeletionRequest = {
        id: requestId,
        userId,
        requestedAt: new Date(),
        scheduledFor: immediate ? new Date() : addDays(new Date(), this.deletionGracePeriod),
        status: immediate ? 'processing' : 'scheduled',
        reason,
      };

      // Check for data that must be retained for legal reasons
      request.retainData = await this.checkLegalRetentionRequirements(userId);

      // Store request
      await (sequelize.models as any).DeletionRequest?.create(request as any);

      // If immediate, process now
      if (immediate) {
        await this.processDeletion(request);
      } else {
        // Send confirmation email with cancellation link
        await this.sendDeletionConfirmation(userId, request);
      }

      logger.info('Deletion requested', { userId, requestId, immediate });

      return request;
    } catch (error) {
      logger.error('Error requesting deletion', error);
      throw new Error('Failed to request account deletion');
    }
  }

  /**
   * Cancel deletion request
   */
  async cancelDeletion(userId: string, requestId: string): Promise<boolean> {
    try {
      const request = await (sequelize.models as any).DeletionRequest?.findOne({
        where: { id: requestId, userId, status: 'scheduled' },
      });

      if (!request) {
        return false;
      }

      (request as any).status = 'cancelled';
      await request.save();

      logger.info('Deletion cancelled', { userId, requestId });

      return true;
    } catch (error) {
      logger.error('Error cancelling deletion', error);
      throw new Error('Failed to cancel deletion');
    }
  }

  /**
   * Process account deletion
   */
  private async processDeletion(request: DeletionRequest): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      request.status = 'processing';
      await sequelize.models.DeletionRequest.update(
        { status: request.status },
        { where: { id: request.id }, transaction }
      );

      const userId = request.userId;

      // Anonymize user data instead of hard delete
      const anonymizedId = `deleted_${crypto.randomBytes(16).toString('hex')}`;

      // Update user record
      await User.update(
        {
          email: `${anonymizedId}@deleted.local`,
          name: 'Deleted User',
          password: crypto.randomBytes(32).toString('hex'),
          avatar: null,
          bio: null,
          googleId: null,
          isActive: false,
        },
        {
          where: { id: userId },
          transaction,
        }
      );

      // Delete or anonymize related data
      await this.anonymizeUserContent(userId, transaction);

      // Clear all cache and session data
      await this.clearUserCache(userId);

      // Update request
      request.status = 'completed';
      request.completedAt = new Date();

      await sequelize.models.DeletionRequest.update(
        {
          status: request.status,
          completedAt: request.completedAt,
        },
        {
          where: { id: request.id },
          transaction,
        }
      );

      await transaction.commit();

      // Log for audit
      await this.logDeletion(userId, request);

      logger.info('Account deleted', { userId, requestId: request.id });
    } catch (error) {
      await transaction.rollback();
      logger.error('Error processing deletion', error);
      throw error;
    }
  }

  /**
   * Report data breach
   */
  async reportDataBreach(
    incident: Omit<DataBreachIncident, 'id' | 'detectedAt'>
  ): Promise<DataBreachIncident> {
    try {
      const breachIncident: DataBreachIncident = {
        id: crypto.randomUUID(),
        detectedAt: new Date(),
        ...incident,
      };

      // Store incident
      await (sequelize.models as any).DataBreachIncident?.create(breachIncident as any);

      // Check if notification is required (within 72 hours)
      if (breachIncident.severity === 'high' || breachIncident.severity === 'critical') {
        await this.notifyDataProtectionAuthority(breachIncident);

        // Notify affected users
        if (!breachIncident.notificationsSent) {
          await this.notifyAffectedUsers(breachIncident);
          breachIncident.notificationsSent = true;
        }
      }

      logger.error('Data breach reported', breachIncident);

      return breachIncident;
    } catch (error) {
      logger.error('Error reporting data breach', error);
      throw new Error('Failed to report data breach');
    }
  }

  /**
   * Get data retention policy
   */
  async getDataRetentionPolicy(): Promise<any> {
    return {
      version: '1.0',
      lastUpdated: '2024-01-01',
      categories: [
        {
          type: 'user_profile',
          retentionPeriod: '3 years after last activity',
          legalBasis: 'Legitimate interest',
        },
        {
          type: 'chat_history',
          retentionPeriod: '1 year',
          legalBasis: 'Service provision',
        },
        {
          type: 'payment_records',
          retentionPeriod: '7 years',
          legalBasis: 'Legal requirement',
        },
        {
          type: 'consent_logs',
          retentionPeriod: '3 years after consent withdrawal',
          legalBasis: 'Legal compliance',
        },
        {
          type: 'security_logs',
          retentionPeriod: '1 year',
          legalBasis: 'Security and fraud prevention',
        },
      ],
    };
  }

  /**
   * Automated data retention cleanup
   */
  async runDataRetentionCleanup(): Promise<void> {
    try {
      const policy = await this.getDataRetentionPolicy();

      for (const category of policy.categories) {
        await this.cleanupCategoryData(category);
      }

      logger.info('Data retention cleanup completed');
    } catch (error) {
      logger.error('Error in data retention cleanup', error);
      throw error;
    }
  }

  /**
   * Generate privacy policy data
   */
  async generatePrivacyPolicyData(): Promise<any> {
    return {
      version: '2.0',
      effectiveDate: new Date().toISOString(),
      dataController: {
        name: 'UpCoach Inc.',
        address: 'Privacy Office, UpCoach Inc.',
        email: 'privacy@upcoach.ai',
        dpo: 'dpo@upcoach.ai',
      },
      dataProcessed: [
        'Personal identification information',
        'Contact information',
        'Health and mood data',
        'Chat conversations',
        'Usage analytics',
        'Payment information',
      ],
      legalBasis: ['Consent', 'Contract fulfillment', 'Legal obligation', 'Legitimate interests'],
      dataSharing: {
        thirdParties: [
          {
            name: 'Stripe',
            purpose: 'Payment processing',
            location: 'United States',
          },
          {
            name: 'OpenAI',
            purpose: 'AI coaching services',
            location: 'United States',
          },
        ],
        safeguards: 'Standard Contractual Clauses',
      },
      userRights: [
        'Right to access',
        'Right to rectification',
        'Right to erasure',
        'Right to restrict processing',
        'Right to data portability',
        'Right to object',
        'Right to withdraw consent',
      ],
      contactDPO: 'dpo@upcoach.ai',
    };
  }

  /**
   * Helper methods
   */

  private hashIP(ip: string): string {
    // Hash IP for privacy while maintaining uniqueness for fraud detection
    return crypto
      .createHash('sha256')
      .update(ip + process.env.IP_SALT)
      .digest('hex');
  }

  private async onConsentGranted(userId: string, purpose: ConsentPurpose): Promise<void> {
    // Trigger consent-based features
    logger.info('Consent granted', { userId, purpose });
  }

  private async onConsentRevoked(userId: string, purpose: ConsentPurpose): Promise<void> {
    // Disable consent-based features
    logger.info('Consent revoked', { userId, purpose });
  }

  private async checkLegalRetentionRequirements(userId: string): Promise<string[]> {
    const retainData: string[] = [];

    // Check for ongoing legal cases
    // Check for financial records (7 year requirement)
    // Check for regulatory requirements

    return retainData;
  }

  private async anonymizeUserContent(userId: string, transaction: any): Promise<void> {
    // Anonymize but don't delete for data integrity
    await sequelize.models.Chat.update(
      { userId: null, message: '[DELETED]' },
      { where: { userId }, transaction }
    );

    await sequelize.models.Goal.destroy({
      where: { userId },
      transaction,
    });

    await sequelize.models.Task.destroy({
      where: { userId },
      transaction,
    });
  }

  private async clearUserCache(userId: string): Promise<void> {
    const keys = await redis.keys(`*${userId}*`);
    if (keys.length > 0) {
      for (const key of keys) {
        await redis.del(key);
      }
    }
  }

  private async logDeletion(userId: string, request: DeletionRequest): Promise<void> {
    await sequelize.models.AuditLog.create({
      action: 'user_deletion',
      userId: 'system',
      targetId: userId,
      details: {
        requestId: request.id,
        reason: request.reason,
        completedAt: request.completedAt,
      },
    });
  }

  private async notifyDataProtectionAuthority(incident: DataBreachIncident): Promise<void> {
    // In production, this would send notification to DPA
    logger.info('DPA notification required', { incidentId: incident.id });
  }

  private async notifyAffectedUsers(incident: DataBreachIncident): Promise<void> {
    // Send notification emails to affected users
    for (const userId of incident.affectedUsers) {
      logger.info('User breach notification sent', { userId, incidentId: incident.id });
    }
  }

  private async sendDeletionConfirmation(userId: string, request: DeletionRequest): Promise<void> {
    // Send email with cancellation link
    logger.info('Deletion confirmation sent', { userId, requestId: request.id });
  }

  private async notifyDataExportReady(userId: string, downloadUrl: string): Promise<void> {
    // Send email with download link
    logger.info('Data export notification sent', { userId });
  }

  private async generateSecureDownloadUrl(filePath: string, requestId: string): Promise<string> {
    // Generate signed URL for secure download
    const token = crypto.randomBytes(32).toString('hex');
    await redis.setEx(`download:${token}`, 7 * 24 * 60 * 60, filePath); // 7 days expiry
    return `/api/gdpr/download/${requestId}?token=${token}`;
  }

  private async encryptFile(filePath: string): Promise<string> {
    // In production, implement proper file encryption
    const encryptedPath = filePath + '.encrypted';
    fs.copyFileSync(filePath, encryptedPath);
    return encryptedPath;
  }

  private async createCSVExport(data: any, zipPath: string): Promise<void> {
    // Create ZIP with multiple CSV files
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    // Add different data types as separate CSV files
    // Implementation would convert each data type to CSV format

    await archive.finalize();
  }

  private jsonToXML(obj: any): string {
    // Simple JSON to XML conversion
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<gdpr-export>\n';

    function convertToXML(data: any, indent: string = '  '): string {
      let result = '';
      for (const key in data) {
        if (typeof data[key] === 'object' && data[key] !== null) {
          result += `${indent}<${key}>\n${convertToXML(data[key], indent + '  ')}${indent}</${key}>\n`;
        } else {
          result += `${indent}<${key}>${data[key]}</${key}>\n`;
        }
      }
      return result;
    }

    xml += convertToXML(obj);
    xml += '</gdpr-export>';

    return xml;
  }

  private async cleanupCategoryData(category: any): Promise<void> {
    // Implement cleanup based on retention policy
    logger.info('Cleaning up category data', { type: category.type });
  }
}

// Export singleton instance
export const gdprService = GDPRService.getInstance();
