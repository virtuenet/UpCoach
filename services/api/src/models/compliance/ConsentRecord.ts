/**
 * Consent Record Model - Phase 14 Week 4
 * Database schema for storing user consents for GDPR/CCPA compliance
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

export type ConsentType =
  | 'essential'
  | 'analytics'
  | 'marketing'
  | 'personalization'
  | 'third_party_sharing';

export type ConsentStatus = 'granted' | 'denied' | 'withdrawn' | 'expired';

export interface ConsentRecordAttributes {
  id: string;
  userId: string;
  consentType: ConsentType;
  status: ConsentStatus;
  granted: boolean; // Quick access field
  explicitConsent: boolean; // True if user explicitly opted in/out
  purpose: string;
  legalBasis: string; // e.g., "GDPR Article 6(1)(a)", "CCPA opt-out"
  version: string; // Version of privacy policy/terms
  ipAddress?: string;
  userAgent?: string;
  countryCode?: string;
  stateCode?: string;
  consentDate: Date;
  expiryDate?: Date;
  withdrawnDate?: Date;
  metadata?: {
    source?: 'web' | 'mobile' | 'api';
    campaignId?: string;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentRecordCreationAttributes
  extends Optional<
    ConsentRecordAttributes,
    'id' | 'ipAddress' | 'userAgent' | 'countryCode' | 'stateCode' | 'expiryDate' | 'withdrawnDate' | 'metadata' | 'createdAt' | 'updatedAt'
  > {}

export class ConsentRecord
  extends Model<ConsentRecordAttributes, ConsentRecordCreationAttributes>
  implements ConsentRecordAttributes
{
  public id!: string;
  public userId!: string;
  public consentType!: ConsentType;
  public status!: ConsentStatus;
  public granted!: boolean;
  public explicitConsent!: boolean;
  public purpose!: string;
  public legalBasis!: string;
  public version!: string;
  public ipAddress?: string;
  public userAgent?: string;
  public countryCode?: string;
  public stateCode?: string;
  public consentDate!: Date;
  public expiryDate?: Date;
  public withdrawnDate?: Date;
  public metadata?: ConsentRecordAttributes['metadata'];

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ConsentRecord.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'User who gave/denied consent',
    },
    consentType: {
      type: DataTypes.ENUM(
        'essential',
        'analytics',
        'marketing',
        'personalization',
        'third_party_sharing'
      ),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('granted', 'denied', 'withdrawn', 'expired'),
      allowNull: false,
    },
    granted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      comment: 'Quick access: true if status is granted',
    },
    explicitConsent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'True if user explicitly opted in/out (required for GDPR)',
    },
    purpose: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Clear description of what the consent is for',
    },
    legalBasis: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Legal basis for processing (e.g., GDPR Article 6(1)(a))',
    },
    version: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Version of privacy policy/terms when consent was given',
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP address when consent was recorded (for audit)',
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent string when consent was recorded',
    },
    countryCode: {
      type: DataTypes.STRING(2),
      allowNull: true,
      comment: 'Country code when consent was recorded',
    },
    stateCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'State/province code (for US states, etc.)',
    },
    consentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'When consent was given/denied',
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When consent expires (if applicable)',
    },
    withdrawnDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When consent was withdrawn (if applicable)',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'consent_records',
    indexes: [
      {
        fields: ['userId'],
        name: 'consent_records_user_idx',
      },
      {
        fields: ['userId', 'consentType'],
        name: 'consent_records_user_type_idx',
      },
      {
        fields: ['userId', 'consentType', 'status'],
        name: 'consent_records_user_type_status_idx',
      },
      {
        fields: ['status'],
        name: 'consent_records_status_idx',
      },
      {
        fields: ['consentDate'],
        name: 'consent_records_date_idx',
      },
      {
        fields: ['expiryDate'],
        name: 'consent_records_expiry_idx',
      },
    ],
  }
);

/**
 * Helper functions for consent management
 */
export class ConsentRecordHelper {
  /**
   * Record new consent
   */
  static async recordConsent(data: {
    userId: string;
    consentType: ConsentType;
    granted: boolean;
    explicitConsent: boolean;
    purpose: string;
    legalBasis: string;
    version: string;
    ipAddress?: string;
    userAgent?: string;
    countryCode?: string;
    stateCode?: string;
    expiryDays?: number;
    metadata?: ConsentRecordAttributes['metadata'];
  }): Promise<ConsentRecord> {
    const consentDate = new Date();
    const expiryDate = data.expiryDays
      ? new Date(consentDate.getTime() + data.expiryDays * 24 * 60 * 60 * 1000)
      : undefined;

    return await ConsentRecord.create({
      userId: data.userId,
      consentType: data.consentType,
      status: data.granted ? 'granted' : 'denied',
      granted: data.granted,
      explicitConsent: data.explicitConsent,
      purpose: data.purpose,
      legalBasis: data.legalBasis,
      version: data.version,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      countryCode: data.countryCode,
      stateCode: data.stateCode,
      consentDate,
      expiryDate,
      metadata: data.metadata,
    });
  }

  /**
   * Get current consent status for user and type
   */
  static async getCurrentConsent(
    userId: string,
    consentType: ConsentType
  ): Promise<ConsentRecord | null> {
    const consent = await ConsentRecord.findOne({
      where: {
        userId,
        consentType,
      },
      order: [['consentDate', 'DESC']],
    });

    // Check if consent is expired
    if (consent && consent.expiryDate && new Date() > consent.expiryDate) {
      await consent.update({ status: 'expired', granted: false });
    }

    return consent;
  }

  /**
   * Get all current consents for user
   */
  static async getAllUserConsents(userId: string): Promise<ConsentRecord[]> {
    // Get latest consent for each type
    const allConsents = await ConsentRecord.findAll({
      where: { userId },
      order: [['consentDate', 'DESC']],
    });

    // Filter to get latest for each type
    const latestConsents = new Map<ConsentType, ConsentRecord>();

    for (const consent of allConsents) {
      if (!latestConsents.has(consent.consentType)) {
        // Check expiry
        if (consent.expiryDate && new Date() > consent.expiryDate) {
          await consent.update({ status: 'expired', granted: false });
        }

        latestConsents.set(consent.consentType, consent);
      }
    }

    return Array.from(latestConsents.values());
  }

  /**
   * Withdraw consent
   */
  static async withdrawConsent(
    userId: string,
    consentType: ConsentType
  ): Promise<ConsentRecord | null> {
    const currentConsent = await ConsentRecord.findOne({
      where: {
        userId,
        consentType,
        status: 'granted',
      },
      order: [['consentDate', 'DESC']],
    });

    if (!currentConsent) {
      return null;
    }

    await currentConsent.update({
      status: 'withdrawn',
      granted: false,
      withdrawnDate: new Date(),
    });

    return currentConsent;
  }

  /**
   * Check if user has granted specific consent
   */
  static async hasConsent(
    userId: string,
    consentType: ConsentType
  ): Promise<boolean> {
    const consent = await ConsentRecordHelper.getCurrentConsent(userId, consentType);
    return consent?.granted || false;
  }

  /**
   * Get consent history for user
   */
  static async getConsentHistory(
    userId: string,
    consentType?: ConsentType
  ): Promise<ConsentRecord[]> {
    const where: any = { userId };

    if (consentType) {
      where.consentType = consentType;
    }

    return await ConsentRecord.findAll({
      where,
      order: [['consentDate', 'DESC']],
    });
  }

  /**
   * Bulk record consents (for onboarding)
   */
  static async recordBulkConsents(
    userId: string,
    consents: Array<{
      consentType: ConsentType;
      granted: boolean;
      explicitConsent: boolean;
      purpose: string;
    }>,
    commonData: {
      legalBasis: string;
      version: string;
      ipAddress?: string;
      userAgent?: string;
      countryCode?: string;
      stateCode?: string;
    }
  ): Promise<ConsentRecord[]> {
    const records = consents.map(consent =>
      ConsentRecordHelper.recordConsent({
        userId,
        ...consent,
        ...commonData,
      })
    );

    return await Promise.all(records);
  }

  /**
   * Get expired consents that need renewal
   */
  static async getExpiredConsents(userId: string): Promise<ConsentRecord[]> {
    return await ConsentRecord.findAll({
      where: {
        userId,
        status: 'granted',
        expiryDate: {
          [sequelize.Op.lt]: new Date(),
        },
      },
    });
  }

  /**
   * Get consents expiring soon (within days)
   */
  static async getExpiringSoonConsents(
    userId: string,
    withinDays: number = 30
  ): Promise<ConsentRecord[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);

    return await ConsentRecord.findAll({
      where: {
        userId,
        status: 'granted',
        expiryDate: {
          [sequelize.Op.between]: [new Date(), futureDate],
        },
      },
    });
  }

  /**
   * Validate consent compliance
   */
  static async validateConsentCompliance(
    userId: string,
    requiredConsents: ConsentType[]
  ): Promise<{
    compliant: boolean;
    missing: ConsentType[];
    expired: ConsentType[];
  }> {
    const userConsents = await ConsentRecordHelper.getAllUserConsents(userId);
    const consentMap = new Map(userConsents.map(c => [c.consentType, c]));

    const missing: ConsentType[] = [];
    const expired: ConsentType[] = [];

    for (const requiredType of requiredConsents) {
      const consent = consentMap.get(requiredType);

      if (!consent || !consent.granted) {
        missing.push(requiredType);
      } else if (consent.status === 'expired') {
        expired.push(requiredType);
      }
    }

    return {
      compliant: missing.length === 0 && expired.length === 0,
      missing,
      expired,
    };
  }

  /**
   * Export user consent data (for data portability requests)
   */
  static async exportUserConsentData(userId: string): Promise<any> {
    const consents = await ConsentRecord.findAll({
      where: { userId },
      order: [['consentDate', 'DESC']],
    });

    return {
      userId,
      exportDate: new Date(),
      totalRecords: consents.length,
      consents: consents.map(c => ({
        type: c.consentType,
        status: c.status,
        granted: c.granted,
        explicitConsent: c.explicitConsent,
        purpose: c.purpose,
        legalBasis: c.legalBasis,
        version: c.version,
        consentDate: c.consentDate,
        expiryDate: c.expiryDate,
        withdrawnDate: c.withdrawnDate,
        countryCode: c.countryCode,
        stateCode: c.stateCode,
      })),
    };
  }

  /**
   * Delete user consent data (for deletion requests)
   */
  static async deleteUserConsentData(userId: string): Promise<number> {
    const result = await ConsentRecord.destroy({
      where: { userId },
    });

    return result;
  }

  /**
   * Get consent statistics
   */
  static async getStatistics(): Promise<{
    totalConsents: number;
    grantedConsents: number;
    deniedConsents: number;
    withdrawnConsents: number;
    expiredConsents: number;
    byType: Record<ConsentType, number>;
  }> {
    const allConsents = await ConsentRecord.findAll();

    const stats = {
      totalConsents: allConsents.length,
      grantedConsents: 0,
      deniedConsents: 0,
      withdrawnConsents: 0,
      expiredConsents: 0,
      byType: {} as Record<ConsentType, number>,
    };

    for (const consent of allConsents) {
      switch (consent.status) {
        case 'granted':
          stats.grantedConsents++;
          break;
        case 'denied':
          stats.deniedConsents++;
          break;
        case 'withdrawn':
          stats.withdrawnConsents++;
          break;
        case 'expired':
          stats.expiredConsents++;
          break;
      }

      stats.byType[consent.consentType] = (stats.byType[consent.consentType] || 0) + 1;
    }

    return stats;
  }
}

export default ConsentRecord;
