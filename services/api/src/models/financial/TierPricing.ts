import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  Association,
  ForeignKey,
} from 'sequelize';

import type { SubscriptionTier } from './SubscriptionTier';

/**
 * Billing interval options for tier pricing
 */
export enum BillingInterval {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

/**
 * TierPricing Model
 *
 * Stores pricing information for each subscription tier.
 * Supports multiple billing intervals per tier (monthly, quarterly, yearly).
 * Integrates with Stripe price objects.
 */
export class TierPricing extends Model<
  InferAttributes<TierPricing>,
  InferCreationAttributes<TierPricing>
> {
  // Primary fields
  declare id: CreationOptional<string>;
  declare tierId: ForeignKey<string>;
  declare billingInterval: BillingInterval;

  // Pricing
  declare amount: number; // In smallest currency unit (cents for USD)
  declare currency: CreationOptional<string>;

  // Stripe integration
  declare stripePriceId: CreationOptional<string | null>;

  // Status
  declare isActive: CreationOptional<boolean>;

  // Trial configuration
  declare trialDays: CreationOptional<number>;

  // Promotional pricing
  declare discountPercentage: CreationOptional<number | null>;
  declare discountValidUntil: CreationOptional<Date | null>;

  // Extensibility
  declare metadata: CreationOptional<Record<string, unknown> | null>;

  // Timestamps
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare readonly tier?: SubscriptionTier;

  public static associations: {
    tier: Association<TierPricing, SubscriptionTier>;
  };

  // Computed properties

  /**
   * Amount in dollars (for USD) - converts from cents
   */
  get amountInDollars(): number {
    return this.amount / 100;
  }

  /**
   * Monthly equivalent amount for comparison
   */
  get monthlyEquivalent(): number {
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

  /**
   * Annual equivalent amount
   */
  get annualEquivalent(): number {
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

  /**
   * Savings percentage compared to monthly billing
   */
  get savingsPercentage(): number {
    if (this.billingInterval === BillingInterval.MONTHLY) {
      return 0;
    }
    // This would need the monthly price to calculate accurately
    // For now, return common discount rates
    switch (this.billingInterval) {
      case BillingInterval.QUARTERLY:
        return 10; // Typically 10% discount
      case BillingInterval.YEARLY:
        return 20; // Typically 20% discount
      default:
        return 0;
    }
  }

  /**
   * Check if discount is currently active
   */
  get isDiscountActive(): boolean {
    if (!this.discountPercentage || this.discountPercentage <= 0) {
      return false;
    }
    if (!this.discountValidUntil) {
      return true; // No expiry = always active
    }
    return new Date() <= this.discountValidUntil;
  }

  /**
   * Effective amount after discount
   */
  get effectiveAmount(): number {
    if (!this.isDiscountActive) {
      return this.amount;
    }
    return Math.round(this.amount * (1 - (this.discountPercentage ?? 0) / 100));
  }

  // Static method declaration for lazy initialization
  static initializeModel: (sequelize: Sequelize) => typeof TierPricing;

  // Association setup
  static associate(models: { SubscriptionTier: typeof SubscriptionTier }): void {
    TierPricing.belongsTo(models.SubscriptionTier, {
      foreignKey: 'tierId',
      as: 'tier',
    });
  }
}

// Static method for deferred initialization
TierPricing.initializeModel = function (sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for TierPricing initialization');
  }

  return TierPricing.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tierId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'subscription_tiers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      billingInterval: {
        type: DataTypes.ENUM(...Object.values(BillingInterval)),
        allowNull: false,
      },
      amount: {
        type: DataTypes.INTEGER, // Store in cents
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
        validate: {
          isUppercase: true,
          len: [3, 3],
        },
      },
      stripePriceId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      trialDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 365, // Max 1 year trial
        },
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
      modelName: 'TierPricing',
      tableName: 'tier_pricing',
      timestamps: true,
      indexes: [
        {
          fields: ['tier_id'],
        },
        {
          fields: ['billing_interval'],
        },
        {
          fields: ['is_active'],
        },
        {
          unique: true,
          fields: ['tier_id', 'billing_interval', 'currency'],
          name: 'unique_tier_interval_currency',
        },
        {
          unique: true,
          fields: ['stripe_price_id'],
          where: {
            stripe_price_id: { [DataTypes.Op?.ne ?? 'ne']: null },
          },
        },
      ],
      hooks: {
        beforeValidate: (instance: TierPricing) => {
          // Ensure currency is uppercase
          if (instance.currency) {
            instance.currency = instance.currency.toUpperCase();
          }
        },
      },
    }
  );
};

export default TierPricing;
