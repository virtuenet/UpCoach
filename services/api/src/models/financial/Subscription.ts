import { Model, DataTypes, Optional, Association } from 'sequelize';

import { sequelize } from '../../config/sequelize';
import { User } from '../User';
import { tierService } from '../../services/financial/TierService';
import { logger } from '../../utils/logger';

/**
 * Feature configuration flag.
 * Set to 'database' to read from the new tier management system.
 * Set to 'hardcoded' to use the original hardcoded values.
 */
const TIER_CONFIG_SOURCE = process.env.TIER_CONFIG_SOURCE || 'database';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  PAUSED = 'paused',
}

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  TEAM = 'team',
  ENTERPRISE = 'enterprise',
}

export enum BillingInterval {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export interface SubscriptionAttributes {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  amount: number;
  currency: string;
  trialStartDate?: Date;
  trialEndDate?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt?: Date;
  cancelReason?: string;
  discountPercentage?: number;
  discountValidUntil?: Date;
  metadata?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionCreationAttributes
  extends Optional<
    SubscriptionAttributes,
    | 'id'
    | 'stripeCustomerId'
    | 'status'
    | 'billingInterval'
    | 'currency'
    | 'trialStartDate'
    | 'trialEndDate'
    | 'canceledAt'
    | 'cancelReason'
    | 'discountPercentage'
    | 'discountValidUntil'
    | 'metadata'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class Subscription
  extends Model<SubscriptionAttributes, SubscriptionCreationAttributes>
  implements SubscriptionAttributes
{
  public id!: string;
  public userId!: string;
  public stripeSubscriptionId!: string;
  public stripeCustomerId?: string;
  public plan!: SubscriptionPlan;
  public status!: SubscriptionStatus;
  public billingInterval!: BillingInterval;
  public amount!: number;
  public currency!: string;
  public trialStartDate?: Date;
  public trialEndDate?: Date;
  public currentPeriodStart!: Date;
  public currentPeriodEnd!: Date;
  public canceledAt?: Date;
  public cancelReason?: string;
  public discountPercentage?: number;
  public discountValidUntil?: Date;
  public metadata?: unknown;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public readonly user?: User;
  public readonly transactions?: unknown[];

  public static associations: {
    user: Association<Subscription, User>;
    transactions: Association<Subscription, any>;
  };

  // Calculated properties
  get isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE || this.status === SubscriptionStatus.TRIALING;
  }

  get isTrialing(): boolean {
    return this.status === SubscriptionStatus.TRIALING;
  }

  get hasTrial(): boolean {
    return !!this.trialEndDate;
  }

  get daysUntilTrialEnd(): number | null {
    if (!this.trialEndDate || this.status !== SubscriptionStatus.TRIALING) {
      return null;
    }
    const now = new Date();
    const diff = this.trialEndDate.getTime() - now.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  get daysUntilRenewal(): number | null {
    if (!this.isActive || !this.currentPeriodEnd) {
      return null;
    }
    const now = new Date();
    const diff = this.currentPeriodEnd.getTime() - now.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  get monthlyAmount(): number {
    switch (this.billingInterval) {
      case BillingInterval.MONTHLY:
        return this.amount;
      case BillingInterval.QUARTERLY:
        return Math.round(this.amount / 3);
      case BillingInterval.YEARLY:
        return Math.round(this.amount / 12);
      default:
        return this.amount;
    }
  }

  get annualAmount(): number {
    switch (this.billingInterval) {
      case BillingInterval.MONTHLY:
        return this.amount * 12;
      case BillingInterval.QUARTERLY:
        return this.amount * 4;
      case BillingInterval.YEARLY:
        return this.amount;
      default:
        return this.amount * 12;
    }
  }

  get effectiveAmount(): number {
    if (this.discountPercentage && this.discountValidUntil) {
      const now = new Date();
      if (now <= this.discountValidUntil) {
        return this.amount * (1 - this.discountPercentage / 100);
      }
    }
    return this.amount;
  }

  /**
   * Get the features for this subscription's plan.
   *
   * DUAL-READ MODE:
   * 1. If TIER_CONFIG_SOURCE is 'database', try to read from the tier database first
   * 2. Fall back to hardcoded values if database lookup fails or returns null
   * 3. If TIER_CONFIG_SOURCE is 'hardcoded', use hardcoded values only
   *
   * This allows gradual migration from hardcoded to database-driven tier configuration.
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
    hasSsoIntegration?: boolean;
    hasDedicatedSupport?: boolean;
  } {
    // Try database-driven configuration first
    if (TIER_CONFIG_SOURCE === 'database') {
      try {
        const dbFeatures = tierService.getCachedFeatures(this.plan);
        if (dbFeatures) {
          return dbFeatures;
        }
        // Cache miss - log a warning but continue with fallback
        logger.debug(
          `Tier features cache miss for plan "${this.plan}", using hardcoded fallback`
        );
      } catch (error) {
        // Log error but continue with fallback
        logger.warn(
          `Failed to get tier features from database for plan "${this.plan}": ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Fallback to hardcoded values
    return this.getHardcodedPlanFeatures();
  }

  /**
   * Original hardcoded plan features (used as fallback)
   */
  private getHardcodedPlanFeatures(): {
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
    hasSsoIntegration: boolean;
    hasDedicatedSupport: boolean;
  } {
    switch (this.plan) {
      case SubscriptionPlan.FREE:
        return {
          maxCoaches: 1,
          maxGoals: 3,
          maxChatsPerDay: 5,
          hasVoiceJournaling: false,
          hasProgressPhotos: false,
          hasAdvancedAnalytics: false,
          hasTeamFeatures: false,
          hasPrioritySupport: false,
          hasCustomBranding: false,
          hasApiAccess: false,
          hasSsoIntegration: false,
          hasDedicatedSupport: false,
        };
      case SubscriptionPlan.BASIC:
        return {
          maxCoaches: 3,
          maxGoals: 10,
          maxChatsPerDay: 50,
          hasVoiceJournaling: true,
          hasProgressPhotos: true,
          hasAdvancedAnalytics: false,
          hasTeamFeatures: false,
          hasPrioritySupport: false,
          hasCustomBranding: false,
          hasApiAccess: false,
          hasSsoIntegration: false,
          hasDedicatedSupport: false,
        };
      case SubscriptionPlan.PRO:
        return {
          maxCoaches: -1, // unlimited
          maxGoals: -1,
          maxChatsPerDay: -1,
          hasVoiceJournaling: true,
          hasProgressPhotos: true,
          hasAdvancedAnalytics: true,
          hasTeamFeatures: false,
          hasPrioritySupport: true,
          hasCustomBranding: false,
          hasApiAccess: true,
          hasSsoIntegration: false,
          hasDedicatedSupport: false,
        };
      case SubscriptionPlan.TEAM:
        return {
          maxCoaches: -1,
          maxGoals: -1,
          maxChatsPerDay: -1,
          hasVoiceJournaling: true,
          hasProgressPhotos: true,
          hasAdvancedAnalytics: true,
          hasTeamFeatures: true,
          hasPrioritySupport: true,
          hasCustomBranding: true,
          hasApiAccess: true,
          hasSsoIntegration: false,
          hasDedicatedSupport: false,
        };
      case SubscriptionPlan.ENTERPRISE:
        return {
          maxCoaches: -1,
          maxGoals: -1,
          maxChatsPerDay: -1,
          hasVoiceJournaling: true,
          hasProgressPhotos: true,
          hasAdvancedAnalytics: true,
          hasTeamFeatures: true,
          hasPrioritySupport: true,
          hasCustomBranding: true,
          hasApiAccess: true,
          hasSsoIntegration: true,
          hasDedicatedSupport: true,
        };
      default:
        // TypeScript exhaustiveness check
        const _exhaustiveCheck: never = this.plan;
        return _exhaustiveCheck;
    }
  }

  public static associate(models: unknown) {
    Subscription.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Subscription.hasMany(models.Transaction, { foreignKey: 'subscriptionId', as: 'transactions' });
  }
}

Subscription.init(
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
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    plan: {
      type: DataTypes.ENUM(...Object.values(SubscriptionPlan)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SubscriptionStatus)),
      allowNull: false,
      defaultValue: SubscriptionStatus.INCOMPLETE,
    },
    billingInterval: {
      type: DataTypes.ENUM(...Object.values(BillingInterval)),
      allowNull: false,
      defaultValue: BillingInterval.MONTHLY,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'usd',
    },
    trialStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    trialEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    currentPeriodStart: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    canceledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    discountValidUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Subscription',
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['stripeSubscriptionId'] },
      { fields: ['plan'] },
      { fields: ['status'] },
    ],
    hooks: {
      beforeUpdate: (subscription: Subscription) => {
        if (
          subscription.changed('status') &&
          subscription.status === SubscriptionStatus.CANCELED &&
          !subscription.canceledAt
        ) {
          subscription.canceledAt = new Date();
        }
      },
    },
  }
);
