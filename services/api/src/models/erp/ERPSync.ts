import { Model, DataTypes, Optional } from 'sequelize';

import { sequelize } from '../../config/sequelize';

export enum SyncStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum SyncSystem {
  UPCOACH = 'upcoach',
  FLASHERP = 'flasherp',
}

export enum SyncEntityType {
  TRANSACTION = 'transaction',
  SUBSCRIPTION = 'subscription',
  CUSTOMER = 'customer',
  INVOICE = 'invoice',
}

export enum SyncDirection {
  UPCOACH_TO_FLASHERP = 'upcoach_to_flasherp',
  FLASHERP_TO_UPCOACH = 'flasherp_to_upcoach',
  BIDIRECTIONAL = 'bidirectional',
}

export interface ERPSyncAttributes {
  id: string;
  sourceSystem: SyncSystem;
  sourceId: string;
  sourceType: SyncEntityType;
  targetSystem: SyncSystem;
  targetId?: string;
  targetType: SyncEntityType;
  syncStatus: SyncStatus;
  syncDirection: SyncDirection;
  errorMessage?: string;
  errorCode?: string;
  lastSyncAttempt?: Date;
  lastSyncSuccess?: Date;
  retryCount: number;
  nextRetryAt?: Date;
  syncDuration?: number;
  metadata?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ERPSyncCreationAttributes
  extends Optional<
    ERPSyncAttributes,
    | 'id'
    | 'targetId'
    | 'errorMessage'
    | 'errorCode'
    | 'lastSyncAttempt'
    | 'lastSyncSuccess'
    | 'nextRetryAt'
    | 'syncDuration'
    | 'metadata'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class ERPSync
  extends Model<ERPSyncAttributes, ERPSyncCreationAttributes>
  implements ERPSyncAttributes
{
  public id!: string;
  public sourceSystem!: SyncSystem;
  public sourceId!: string;
  public sourceType!: SyncEntityType;
  public targetSystem!: SyncSystem;
  public targetId?: string;
  public targetType!: SyncEntityType;
  public syncStatus!: SyncStatus;
  public syncDirection!: SyncDirection;
  public errorMessage?: string;
  public errorCode?: string;
  public lastSyncAttempt?: Date;
  public lastSyncSuccess?: Date;
  public retryCount!: number;
  public nextRetryAt?: Date;
  public syncDuration?: number;
  public metadata?: unknown;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  /**
   * Check if sync can be retried
   */
  public canRetry(): boolean {
    const MAX_RETRIES = 5;
    return this.retryCount < MAX_RETRIES && this.syncStatus === SyncStatus.FAILED;
  }

  /**
   * Calculate next retry timestamp using exponential backoff
   */
  public calculateNextRetry(): Date {
    const BASE_DELAY = 60000; // 1 minute
    const delay = BASE_DELAY * Math.pow(2, this.retryCount);
    return new Date(Date.now() + delay);
  }

  /**
   * Check if sync is pending retry
   */
  public isPendingRetry(): boolean {
    return (
      this.syncStatus === SyncStatus.FAILED &&
      this.canRetry() &&
      this.nextRetryAt !== undefined &&
      this.nextRetryAt <= new Date()
    );
  }

  /**
   * Get human-readable sync age
   */
  public getSyncAge(): string {
    if (!this.lastSyncAttempt) return 'Never';

    const now = new Date();
    const diff = now.getTime() - this.lastSyncAttempt.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }
}

ERPSync.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sourceSystem: {
      type: DataTypes.ENUM(...Object.values(SyncSystem)),
      allowNull: false,
    },
    sourceId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sourceType: {
      type: DataTypes.ENUM(...Object.values(SyncEntityType)),
      allowNull: false,
    },
    targetSystem: {
      type: DataTypes.ENUM(...Object.values(SyncSystem)),
      allowNull: false,
    },
    targetId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    targetType: {
      type: DataTypes.ENUM(...Object.values(SyncEntityType)),
      allowNull: false,
    },
    syncStatus: {
      type: DataTypes.ENUM(...Object.values(SyncStatus)),
      allowNull: false,
      defaultValue: SyncStatus.PENDING,
    },
    syncDirection: {
      type: DataTypes.ENUM(...Object.values(SyncDirection)),
      allowNull: false,
      defaultValue: SyncDirection.UPCOACH_TO_FLASHERP,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    errorCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastSyncAttempt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastSyncSuccess: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    nextRetryAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    syncDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Sync duration in milliseconds',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'erp_syncs',
    indexes: [
      {
        unique: true,
        fields: ['sourceSystem', 'sourceId', 'sourceType'],
        name: 'erp_syncs_source_unique',
      },
      {
        fields: ['syncStatus', 'nextRetryAt'],
        name: 'erp_syncs_retry_queue',
      },
      {
        fields: ['lastSyncAttempt'],
        name: 'erp_syncs_last_attempt',
      },
      {
        fields: ['targetSystem', 'targetId'],
        name: 'erp_syncs_target',
      },
    ],
  }
);
