import { Model, DataTypes, Optional } from 'sequelize';

import { sequelize } from '../../config/sequelize';

export enum AuditAction {
  SYNC = 'sync',
  WEBHOOK_RECEIVED = 'webhook_received',
  CONFIG_UPDATED = 'config_updated',
  MANUAL_SYNC = 'manual_sync',
  HEALTH_CHECK = 'health_check',
}

export enum AuditEntityType {
  TRANSACTION = 'transaction',
  SUBSCRIPTION = 'subscription',
  CUSTOMER = 'customer',
  INVOICE = 'invoice',
  CONFIGURATION = 'configuration',
}

export enum AuditStatus {
  INITIATED = 'initiated',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export interface ERPAuditLogAttributes {
  id: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  erpSyncId?: string;
  status: AuditStatus;
  requestPayload?: unknown;
  responsePayload?: unknown;
  errorDetails?: unknown;
  duration?: number;
  ipAddress?: string;
  userAgent?: string;
  performedBy?: string;
  requestId?: string;
  metadata?: unknown;
  createdAt?: Date;
}

export interface ERPAuditLogCreationAttributes
  extends Optional<
    ERPAuditLogAttributes,
    | 'id'
    | 'entityId'
    | 'erpSyncId'
    | 'requestPayload'
    | 'responsePayload'
    | 'errorDetails'
    | 'duration'
    | 'ipAddress'
    | 'userAgent'
    | 'performedBy'
    | 'requestId'
    | 'metadata'
    | 'createdAt'
  > {}

export class ERPAuditLog
  extends Model<ERPAuditLogAttributes, ERPAuditLogCreationAttributes>
  implements ERPAuditLogAttributes
{
  public id!: string;
  public action!: AuditAction;
  public entityType!: AuditEntityType;
  public entityId?: string;
  public erpSyncId?: string;
  public status!: AuditStatus;
  public requestPayload?: unknown;
  public responsePayload?: unknown;
  public errorDetails?: unknown;
  public duration?: number;
  public ipAddress?: string;
  public userAgent?: string;
  public performedBy?: string;
  public requestId?: string;
  public metadata?: unknown;
  declare readonly createdAt: Date;

  /**
   * Get human-readable action description
   */
  public getActionDescription(): string {
    const descriptions: Record<AuditAction, string> = {
      [AuditAction.SYNC]: 'Sync Operation',
      [AuditAction.WEBHOOK_RECEIVED]: 'Webhook Received',
      [AuditAction.CONFIG_UPDATED]: 'Configuration Updated',
      [AuditAction.MANUAL_SYNC]: 'Manual Sync',
      [AuditAction.HEALTH_CHECK]: 'Health Check',
    };
    return descriptions[this.action] || this.action;
  }

  /**
   * Get formatted duration
   */
  public getFormattedDuration(): string {
    if (!this.duration) return 'N/A';
    if (this.duration < 1000) return `${this.duration}ms`;
    return `${(this.duration / 1000).toFixed(2)}s`;
  }

  /**
   * Check if log is recent (within last hour)
   */
  public isRecent(): boolean {
    const oneHourAgo = new Date(Date.now() - 3600000);
    return this.createdAt > oneHourAgo;
  }

  /**
   * Get error summary
   */
  public getErrorSummary(): string | null {
    if (this.status !== AuditStatus.FAILED || !this.errorDetails) return null;

    if (typeof this.errorDetails === 'object' && this.errorDetails !== null) {
      const error = this.errorDetails as { message?: string; code?: string };
      return error.message || error.code || 'Unknown error';
    }

    return String(this.errorDetails);
  }

  /**
   * Get actor (who performed the action)
   */
  public getActor(): string {
    return this.performedBy || 'System';
  }
}

ERPAuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    action: {
      type: DataTypes.ENUM(...Object.values(AuditAction)),
      allowNull: false,
    },
    entityType: {
      type: DataTypes.ENUM(...Object.values(AuditEntityType)),
      allowNull: false,
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    erpSyncId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AuditStatus)),
      allowNull: false,
    },
    requestPayload: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    responsePayload: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    errorDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in milliseconds',
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    performedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User ID or "system"',
    },
    requestId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Correlation ID for distributed tracing',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'erp_audit_logs',
    timestamps: true,
    updatedAt: false, // Immutable audit logs
    indexes: [
      {
        fields: ['action', 'createdAt'],
        name: 'erp_audit_logs_action_time',
      },
      {
        fields: ['entityType', 'entityId'],
        name: 'erp_audit_logs_entity',
      },
      {
        fields: ['erpSyncId'],
        name: 'erp_audit_logs_sync',
      },
      {
        fields: ['status', 'createdAt'],
        name: 'erp_audit_logs_status_time',
      },
      {
        fields: ['requestId'],
        name: 'erp_audit_logs_request_id',
      },
    ],
  }
);
