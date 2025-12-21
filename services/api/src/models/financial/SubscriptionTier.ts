import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  Association,
  Op,
} from 'sequelize';

import type { TierPricing } from './TierPricing';

/**
 * SubscriptionTier Model
 *
 * Database-driven subscription tier configuration.
 * Replaces hardcoded planFeatures in Subscription.ts
 * Enables admin control over tiers and features.
 */
export class SubscriptionTier extends Model<
  InferAttributes<SubscriptionTier, { omit: 'planFeatures' | 'isUnlimited' | 'featureCount' }>,
  InferCreationAttributes<SubscriptionTier, { omit: 'planFeatures' | 'isUnlimited' | 'featureCount' }>
> {
  // Primary fields
  declare id: CreationOptional<string>;
  declare name: string; // Unique identifier: 'free', 'basic', 'pro', 'team', 'enterprise'
  declare displayName: string; // UI display name: 'Free', 'Basic', 'Pro', etc.
  declare description: CreationOptional<string | null>;
  declare sortOrder: CreationOptional<number>;

  // Status flags
  declare isActive: CreationOptional<boolean>;
  declare isPublic: CreationOptional<boolean>; // Show on pricing page

  // Stripe integration
  declare stripeProductId: CreationOptional<string | null>;

  // Feature limits (-1 = unlimited)
  declare maxCoaches: number;
  declare maxGoals: number;
  declare maxChatsPerDay: number;

  // Boolean feature flags
  declare hasVoiceJournaling: CreationOptional<boolean>;
  declare hasProgressPhotos: CreationOptional<boolean>;
  declare hasAdvancedAnalytics: CreationOptional<boolean>;
  declare hasTeamFeatures: CreationOptional<boolean>;
  declare hasPrioritySupport: CreationOptional<boolean>;
  declare hasCustomBranding: CreationOptional<boolean>;
  declare hasApiAccess: CreationOptional<boolean>;
  declare hasSsoIntegration: CreationOptional<boolean>;
  declare hasDedicatedSupport: CreationOptional<boolean>;

  // Extensibility
  declare customFeatures: CreationOptional<Record<string, unknown> | null>;
  declare metadata: CreationOptional<Record<string, unknown> | null>;

  // Timestamps
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare readonly pricing?: TierPricing[];

  public static associations: {
    pricing: Association<SubscriptionTier, TierPricing>;
  };

  // Computed properties
  get isUnlimited(): boolean {
    return this.maxCoaches === -1 && this.maxGoals === -1 && this.maxChatsPerDay === -1;
  }

  get featureCount(): number {
    const features = [
      this.hasVoiceJournaling,
      this.hasProgressPhotos,
      this.hasAdvancedAnalytics,
      this.hasTeamFeatures,
      this.hasPrioritySupport,
      this.hasCustomBranding,
      this.hasApiAccess,
      this.hasSsoIntegration,
      this.hasDedicatedSupport,
    ];
    return features.filter(Boolean).length;
  }

  /**
   * Returns the legacy planFeatures format for backward compatibility
   * with existing Subscription.planFeatures consumers
   */
  get planFeatures(): {
    maxCoaches: number;
    maxGoals: number;
    maxChatsPerDay: number;
    hasVoiceJournaling: boolean;
    hasProgressPhotos: boolean;
    hasAdvancedAnalytics: boolean;
    hasTeamFeatures: boolean;
    hasPrioritySupport: boolean;
    hasCustomBranding: boolean;
    hasApiAccess: boolean;
  } {
    return {
      maxCoaches: this.maxCoaches,
      maxGoals: this.maxGoals,
      maxChatsPerDay: this.maxChatsPerDay,
      hasVoiceJournaling: this.hasVoiceJournaling ?? false,
      hasProgressPhotos: this.hasProgressPhotos ?? false,
      hasAdvancedAnalytics: this.hasAdvancedAnalytics ?? false,
      hasTeamFeatures: this.hasTeamFeatures ?? false,
      hasPrioritySupport: this.hasPrioritySupport ?? false,
      hasCustomBranding: this.hasCustomBranding ?? false,
      hasApiAccess: this.hasApiAccess ?? false,
    };
  }

  // Static method declaration for lazy initialization
  static initializeModel: (sequelize: Sequelize) => typeof SubscriptionTier;

  // Association setup
  static associate(models: { TierPricing: typeof TierPricing }): void {
    SubscriptionTier.hasMany(models.TierPricing, {
      foreignKey: 'tierId',
      as: 'pricing',
    });
  }
}

// Static method for deferred initialization
SubscriptionTier.initializeModel = function (sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for SubscriptionTier initialization');
  }

  return SubscriptionTier.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[a-z][a-z0-9_]*$/, // lowercase alphanumeric, starts with letter
        },
      },
      displayName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      stripeProductId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      maxCoaches: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: -1, // -1 = unlimited
        },
      },
      maxGoals: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
        validate: {
          min: -1,
        },
      },
      maxChatsPerDay: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
          min: -1,
        },
      },
      hasVoiceJournaling: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasProgressPhotos: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasAdvancedAnalytics: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasTeamFeatures: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasPrioritySupport: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasCustomBranding: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasApiAccess: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasSsoIntegration: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hasDedicatedSupport: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      customFeatures: {
        type: DataTypes.JSONB,
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
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize: sequelizeInstance,
      modelName: 'SubscriptionTier',
      tableName: 'subscription_tiers',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['name'],
        },
        {
          fields: ['is_active'],
        },
        {
          fields: ['is_public'],
        },
        {
          fields: ['sort_order'],
        },
        {
          unique: true,
          fields: ['stripe_product_id'],
          where: {
            stripe_product_id: { [Op.ne]: null },
          },
        },
      ],
    }
  );
};

export default SubscriptionTier;
