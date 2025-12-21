import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  ForeignKey,
} from 'sequelize';

/**
 * Entity types that can be audited
 */
export enum AuditEntityType {
  TIER = 'tier',
  PRICING = 'pricing',
  STRIPE_SYNC = 'stripe_sync',
}

/**
 * Audit action types
 */
export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
  STRIPE_SYNC = 'stripe_sync',
  STRIPE_LINK = 'stripe_link',
  STRIPE_UNLINK = 'stripe_unlink',
}

/**
 * TierAuditLog Model
 *
 * Stores audit trail for all tier and pricing changes.
 * Tracks who made changes, when, and what was changed.
 * Required for compliance and debugging.
 */
export class TierAuditLog extends Model<
  InferAttributes<TierAuditLog, { omit: 'changeDescription' | 'isSignificantChange' }>,
  InferCreationAttributes<TierAuditLog, { omit: 'changeDescription' | 'isSignificantChange' }>
> {
  // Primary fields
  declare id: CreationOptional<string>;
  declare entityType: AuditEntityType;
  declare entityId: string;
  declare action: AuditAction;

  // Change tracking
  declare previousValue: CreationOptional<Record<string, unknown> | null>;
  declare newValue: CreationOptional<Record<string, unknown> | null>;
  declare changedFields: CreationOptional<string[] | null>; // List of fields that changed

  // Actor information
  declare changedBy: ForeignKey<string | null>; // User ID who made the change
  declare changedByEmail: CreationOptional<string | null>; // Denormalized for easy lookup
  declare changedByRole: CreationOptional<string | null>; // Role at time of change

  // Request context
  declare ipAddress: CreationOptional<string | null>;
  declare userAgent: CreationOptional<string | null>;
  declare requestId: CreationOptional<string | null>; // Correlation ID for request tracing

  // Additional context
  declare reason: CreationOptional<string | null>; // Optional reason for change
  declare metadata: CreationOptional<Record<string, unknown> | null>;

  // Timestamp (immutable - no updatedAt)
  declare createdAt: CreationOptional<Date>;

  // Computed properties

  /**
   * Returns a human-readable description of the change
   */
  get changeDescription(): string {
    const entityLabel =
      this.entityType === AuditEntityType.TIER ? 'Tier' : 'Pricing';

    switch (this.action) {
      case AuditAction.CREATE:
        return `Created ${entityLabel}`;
      case AuditAction.UPDATE:
        const fieldsChanged = this.changedFields?.join(', ') || 'fields';
        return `Updated ${entityLabel}: ${fieldsChanged}`;
      case AuditAction.DELETE:
        return `Deleted ${entityLabel}`;
      case AuditAction.ACTIVATE:
        return `Activated ${entityLabel}`;
      case AuditAction.DEACTIVATE:
        return `Deactivated ${entityLabel}`;
      case AuditAction.STRIPE_SYNC:
        return `Synced ${entityLabel} with Stripe`;
      case AuditAction.STRIPE_LINK:
        return `Linked ${entityLabel} to Stripe product/price`;
      case AuditAction.STRIPE_UNLINK:
        return `Unlinked ${entityLabel} from Stripe`;
      default:
        return `${this.action} on ${entityLabel}`;
    }
  }

  /**
   * Check if this was a significant change (create, delete, or critical field update)
   */
  get isSignificantChange(): boolean {
    if (
      this.action === AuditAction.CREATE ||
      this.action === AuditAction.DELETE
    ) {
      return true;
    }

    const criticalFields = [
      'amount',
      'isActive',
      'maxCoaches',
      'maxGoals',
      'maxChatsPerDay',
      'stripeProductId',
      'stripePriceId',
    ];

    return (
      this.changedFields?.some((field) => criticalFields.includes(field)) ??
      false
    );
  }

  // Static method declaration for lazy initialization
  static initializeModel: (sequelize: Sequelize) => typeof TierAuditLog;

  /**
   * Static helper to create audit log entry
   */
  static async logChange(params: {
    entityType: AuditEntityType;
    entityId: string;
    action: AuditAction;
    previousValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
    changedBy?: string | null;
    changedByEmail?: string | null;
    changedByRole?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
    reason?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<TierAuditLog> {
    // Calculate changed fields
    let changedFields: string[] | null = null;
    if (params.previousValue && params.newValue) {
      changedFields = Object.keys(params.newValue).filter(
        (key) =>
          JSON.stringify(params.previousValue![key]) !==
          JSON.stringify(params.newValue![key])
      );
    } else if (params.newValue) {
      changedFields = Object.keys(params.newValue);
    }

    return TierAuditLog.create({
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      previousValue: params.previousValue,
      newValue: params.newValue,
      changedFields,
      changedBy: params.changedBy,
      changedByEmail: params.changedByEmail,
      changedByRole: params.changedByRole,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      requestId: params.requestId,
      reason: params.reason,
      metadata: params.metadata,
    });
  }
}

// Static method for deferred initialization
TierAuditLog.initializeModel = function (sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for TierAuditLog initialization');
  }

  return TierAuditLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      entityType: {
        type: DataTypes.ENUM(...Object.values(AuditEntityType)),
        allowNull: false,
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      action: {
        type: DataTypes.ENUM(...Object.values(AuditAction)),
        allowNull: false,
      },
      previousValue: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      newValue: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      changedFields: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      changedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      changedByEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      changedByRole: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.INET,
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      requestId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize: sequelizeInstance,
      modelName: 'TierAuditLog',
      tableName: 'tier_audit_logs',
      timestamps: false, // Only createdAt, no updatedAt - audit logs are immutable
      indexes: [
        {
          fields: ['entity_type'],
        },
        {
          fields: ['entity_id'],
        },
        {
          fields: ['action'],
        },
        {
          fields: ['changed_by'],
        },
        {
          fields: ['created_at'],
        },
        {
          // Composite index for efficient lookups
          fields: ['entity_type', 'entity_id', 'created_at'],
        },
        {
          // Index for finding changes by user
          fields: ['changed_by', 'created_at'],
        },
      ],
    }
  );
};

export default TierAuditLog;
