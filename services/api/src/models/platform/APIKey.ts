import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

/**
 * API Key Scopes
 */
export type APIKeyScope =
  | 'read:users'
  | 'write:users'
  | 'read:goals'
  | 'write:goals'
  | 'read:habits'
  | 'write:habits'
  | 'read:analytics'
  | 'write:analytics'
  | 'ai:coach'
  | 'webhooks:manage'
  | 'admin:all';

export type APIKeyTier = 'free' | 'developer' | 'business' | 'enterprise';
export type APIKeyStatus = 'active' | 'revoked' | 'expired' | 'suspended';

/**
 * API Key Attributes
 */
export interface APIKeyAttributes {
  id: string;
  userId: string;
  organizationId?: string;
  name: string;
  keyHash: string; // SHA-256 hash of the key
  keyPrefix: string; // First 16 chars for display
  tier: APIKeyTier;
  scopes: APIKeyScope[];
  status: APIKeyStatus;
  rateLimit: {
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit: number;
  };
  ipWhitelist?: string[];
  usageStats: {
    totalRequests: number;
    lastUsedAt?: Date;
    monthlyRequests: number;
    quotaExceeded: number;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  metadata?: Record<string, any>;
}

export interface APIKeyCreationAttributes
  extends Optional<APIKeyAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

/**
 * APIKey Model
 */
export class APIKey
  extends Model<APIKeyAttributes, APIKeyCreationAttributes>
  implements APIKeyAttributes
{
  public id!: string;
  public userId!: string;
  public organizationId?: string;
  public name!: string;
  public keyHash!: string;
  public keyPrefix!: string;
  public tier!: APIKeyTier;
  public scopes!: APIKeyScope[];
  public status!: APIKeyStatus;
  public rateLimit!: {
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit: number;
  };
  public ipWhitelist?: string[];
  public usageStats!: {
    totalRequests: number;
    lastUsedAt?: Date;
    monthlyRequests: number;
    quotaExceeded: number;
  };
  public createdAt!: Date;
  public updatedAt!: Date;
  public expiresAt?: Date;
  public revokedAt?: Date;
  public metadata?: Record<string, any>;
}

APIKey.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    keyHash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    keyPrefix: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    tier: {
      type: DataTypes.ENUM('free', 'developer', 'business', 'enterprise'),
      allowNull: false,
      defaultValue: 'free',
    },
    scopes: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('active', 'revoked', 'expired', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
    },
    rateLimit: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        requestsPerHour: 100,
        requestsPerDay: 1000,
        burstLimit: 10,
      },
    },
    ipWhitelist: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    usageStats: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        totalRequests: 0,
        monthlyRequests: 0,
        quotaExceeded: 0,
      },
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
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'api_keys',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['organizationId'],
      },
      {
        fields: ['keyHash'],
        unique: true,
      },
      {
        fields: ['status'],
      },
      {
        fields: ['tier'],
      },
    ],
  }
);

/**
 * Helper Functions
 */
export class APIKeyHelper {
  /**
   * Create API Key
   */
  static async create(
    userId: string,
    name: string,
    keyHash: string,
    keyPrefix: string,
    config: {
      tier: APIKeyTier;
      scopes: APIKeyScope[];
      rateLimit: { requestsPerHour: number; requestsPerDay: number; burstLimit: number };
      organizationId?: string;
      ipWhitelist?: string[];
      expiresAt?: Date;
      metadata?: Record<string, any>;
    }
  ): Promise<APIKey> {
    return await APIKey.create({
      userId,
      name,
      keyHash,
      keyPrefix,
      tier: config.tier,
      scopes: config.scopes,
      rateLimit: config.rateLimit,
      organizationId: config.organizationId,
      ipWhitelist: config.ipWhitelist,
      expiresAt: config.expiresAt,
      metadata: config.metadata,
      status: 'active',
      usageStats: {
        totalRequests: 0,
        monthlyRequests: 0,
        quotaExceeded: 0,
      },
    });
  }

  /**
   * Get by Key Hash
   */
  static async getByKeyHash(keyHash: string): Promise<APIKey | null> {
    return await APIKey.findOne({ where: { keyHash } });
  }

  /**
   * Get User API Keys
   */
  static async getUserKeys(userId: string): Promise<APIKey[]> {
    return await APIKey.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get Organization API Keys
   */
  static async getOrganizationKeys(organizationId: string): Promise<APIKey[]> {
    return await APIKey.findAll({
      where: { organizationId },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Update Status
   */
  static async updateStatus(
    keyId: string,
    status: APIKeyStatus,
    revokedAt?: Date
  ): Promise<APIKey> {
    const key = await APIKey.findByPk(keyId);
    if (!key) {
      throw new Error('API key not found');
    }

    key.status = status;
    if (revokedAt) {
      key.revokedAt = revokedAt;
    }

    await key.save();
    return key;
  }

  /**
   * Update Usage Stats
   */
  static async updateUsageStats(
    keyId: string,
    updates: {
      totalRequests?: number;
      lastUsedAt?: Date;
      monthlyRequests?: number;
      quotaExceeded?: number;
    }
  ): Promise<APIKey> {
    const key = await APIKey.findByPk(keyId);
    if (!key) {
      throw new Error('API key not found');
    }

    key.usageStats = {
      ...key.usageStats,
      ...updates,
    };

    await key.save();
    return key;
  }

  /**
   * Reset Monthly Usage
   */
  static async resetMonthlyUsage(): Promise<number> {
    const [affectedRows] = await APIKey.update(
      {
        usageStats: sequelize.literal(`
          jsonb_set(
            "usageStats",
            '{monthlyRequests}',
            '0'::jsonb
          )
        `),
      },
      {
        where: {},
      }
    );

    return affectedRows;
  }

  /**
   * Delete API Key
   */
  static async delete(keyId: string): Promise<void> {
    await APIKey.destroy({ where: { id: keyId } });
  }
}

export default APIKey;
