import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

/**
 * Subscription Model
 * Manages subscription lifecycle, billing cycles, and plan changes
 */

export interface SubscriptionAttributes {
  id: string;
  userId: string;
  customerId: string; // Payment provider customer ID
  
  // Plan Information
  planId: string;
  planName: string;
  planType: 'free' | 'basic' | 'pro' | 'enterprise' | 'custom';
  
  // Subscription Status
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused' | 'expired';
  
  // Billing Information
  billingInterval: 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
  billingAmount: number;
  currency: string;
  
  // Trial Information
  trialStart?: Date;
  trialEnd?: Date;
  trialDays?: number;
  
  // Subscription Dates
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  startDate: Date;
  endDate?: Date;
  canceledAt?: Date;
  pausedAt?: Date;
  resumeAt?: Date;
  
  // Payment Information
  paymentMethodId?: string;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  lastPaymentStatus?: string;
  nextBillingDate?: Date;
  
  // Discounts & Promotions
  discountPercentage: number;
  discountAmount: number;
  promoCode?: string;
  promoCodeId?: string;
  discountEndDate?: Date;
  
  // Usage & Limits
  usageMetrics: {
    sessionsUsed: number;
    sessionsLimit: number;
    storageUsed: number; // in MB
    storageLimit: number; // in MB
    coachingHoursUsed: number;
    coachingHoursLimit: number;
    aiCreditsUsed: number;
    aiCreditsLimit: number;
  };
  
  // Subscription Changes
  previousPlanId?: string;
  upgradedAt?: Date;
  downgradedAt?: Date;
  changeEffectiveDate?: Date;
  pendingChanges?: {
    planId: string;
    effectiveDate: Date;
    reason: string;
  };
  
  // Cancellation Details
  cancellationReason?: string;
  cancellationFeedback?: string;
  cancellationCategory?: 'voluntary' | 'payment_failed' | 'fraud' | 'other';
  winBackAttempts: number;
  
  // Metadata
  metadata?: Record<string, any>;
  notes?: string;
  tags: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionCreationAttributes extends Optional<SubscriptionAttributes, 
  'id' | 'trialStart' | 'trialEnd' | 'trialDays' | 'endDate' | 'canceledAt' | 
  'pausedAt' | 'resumeAt' | 'paymentMethodId' | 'lastPaymentDate' | 'lastPaymentAmount' |
  'lastPaymentStatus' | 'nextBillingDate' | 'promoCode' | 'promoCodeId' | 'discountEndDate' |
  'previousPlanId' | 'upgradedAt' | 'downgradedAt' | 'changeEffectiveDate' | 'pendingChanges' |
  'cancellationReason' | 'cancellationFeedback' | 'cancellationCategory' | 'metadata' | 
  'notes' | 'createdAt' | 'updatedAt'> {}

export class Subscription extends Model<SubscriptionAttributes, SubscriptionCreationAttributes> 
  implements SubscriptionAttributes {
  
  public id!: string;
  public userId!: string;
  public customerId!: string;
  
  public planId!: string;
  public planName!: string;
  public planType!: 'free' | 'basic' | 'pro' | 'enterprise' | 'custom';
  
  public status!: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused' | 'expired';
  
  public billingInterval!: 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
  public billingAmount!: number;
  public currency!: string;
  
  public trialStart?: Date;
  public trialEnd?: Date;
  public trialDays?: number;
  
  public currentPeriodStart!: Date;
  public currentPeriodEnd!: Date;
  public startDate!: Date;
  public endDate?: Date;
  public canceledAt?: Date;
  public pausedAt?: Date;
  public resumeAt?: Date;
  
  public paymentMethodId?: string;
  public lastPaymentDate?: Date;
  public lastPaymentAmount?: number;
  public lastPaymentStatus?: string;
  public nextBillingDate?: Date;
  
  public discountPercentage!: number;
  public discountAmount!: number;
  public promoCode?: string;
  public promoCodeId?: string;
  public discountEndDate?: Date;
  
  public usageMetrics!: {
    sessionsUsed: number;
    sessionsLimit: number;
    storageUsed: number;
    storageLimit: number;
    coachingHoursUsed: number;
    coachingHoursLimit: number;
    aiCreditsUsed: number;
    aiCreditsLimit: number;
  };
  
  public previousPlanId?: string;
  public upgradedAt?: Date;
  public downgradedAt?: Date;
  public changeEffectiveDate?: Date;
  public pendingChanges?: {
    planId: string;
    effectiveDate: Date;
    reason: string;
  };
  
  public cancellationReason?: string;
  public cancellationFeedback?: string;
  public cancellationCategory?: 'voluntary' | 'payment_failed' | 'fraud' | 'other';
  public winBackAttempts!: number;
  
  public metadata?: Record<string, any>;
  public notes?: string;
  public tags!: string[];
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Check if subscription is in trial period
   */
  public isInTrial(): boolean {
    if (!this.trialEnd) return false;
    return new Date() < this.trialEnd && this.status === 'trialing';
  }

  /**
   * Check if subscription is active (including trial)
   */
  public isActive(): boolean {
    return ['active', 'trialing'].includes(this.status);
  }

  /**
   * Get days remaining in trial
   */
  public getTrialDaysRemaining(): number {
    if (!this.isInTrial() || !this.trialEnd) return 0;
    const now = new Date();
    const diffTime = this.trialEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate monthly recurring revenue (MRR)
   */
  public getMRR(): number {
    if (!this.isActive()) return 0;
    
    const effectiveAmount = this.billingAmount - this.discountAmount;
    
    switch (this.billingInterval) {
      case 'monthly':
        return effectiveAmount;
      case 'quarterly':
        return effectiveAmount / 3;
      case 'yearly':
        return effectiveAmount / 12;
      case 'lifetime':
        return 0; // Lifetime subscriptions don't contribute to MRR
      default:
        return 0;
    }
  }

  /**
   * Calculate annual recurring revenue (ARR)
   */
  public getARR(): number {
    return this.getMRR() * 12;
  }

  /**
   * Check if subscription needs payment retry
   */
  public needsPaymentRetry(): boolean {
    return ['past_due', 'unpaid'].includes(this.status);
  }

  /**
   * Get usage percentage for a metric
   */
  public getUsagePercentage(metric: keyof typeof this.usageMetrics): number {
    const used = this.usageMetrics[metric];
    const limit = this.usageMetrics[metric.replace('Used', 'Limit') as keyof typeof this.usageMetrics];
    
    if (typeof used === 'number' && typeof limit === 'number' && limit > 0) {
      return (used / limit) * 100;
    }
    
    return 0;
  }

  /**
   * Check if subscription is at risk of churn
   */
  public isChurnRisk(): boolean {
    // High usage indicates engagement, low risk
    const avgUsage = (
      this.getUsagePercentage('sessionsUsed') +
      this.getUsagePercentage('coachingHoursUsed')
    ) / 2;
    
    // Past due or multiple win-back attempts indicate high risk
    if (this.status === 'past_due' || this.winBackAttempts > 2) {
      return true;
    }
    
    // Low usage indicates risk
    return avgUsage < 20;
  }

  /**
   * Static method to get active subscriptions count
   */
  static async getActiveCount(): Promise<number> {
    return this.count({
      where: {
        status: ['active', 'trialing'],
      },
    });
  }

  /**
   * Static method to calculate total MRR
   */
  static async calculateTotalMRR(): Promise<number> {
    const activeSubscriptions = await this.findAll({
      where: {
        status: ['active', 'trialing'],
      },
    });
    
    return activeSubscriptions.reduce((total, sub) => total + sub.getMRR(), 0);
  }

  /**
   * Static method to get churn rate for a period
   */
  static async getChurnRate(startDate: Date, endDate: Date): Promise<number> {
    const startCount = await this.count({
      where: {
        createdAt: { [sequelize.Op.lte]: startDate },
        [sequelize.Op.or]: [
          { canceledAt: { [sequelize.Op.gt]: startDate } },
          { canceledAt: null },
        ],
      },
    });
    
    const churnedCount = await this.count({
      where: {
        canceledAt: {
          [sequelize.Op.between]: [startDate, endDate],
        },
      },
    });
    
    return startCount > 0 ? (churnedCount / startCount) * 100 : 0;
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
    customerId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Payment provider customer ID',
    },
    planId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    planName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    planType: {
      type: DataTypes.ENUM('free', 'basic', 'pro', 'enterprise', 'custom'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused', 'expired'),
      allowNull: false,
    },
    billingInterval: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'yearly', 'lifetime'),
      allowNull: false,
    },
    billingAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    trialStart: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    trialEnd: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    trialDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    currentPeriodStart: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    canceledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pausedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resumeAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paymentMethodId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastPaymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastPaymentAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    lastPaymentStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nextBillingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    promoCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    promoCodeId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    discountEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    usageMetrics: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        sessionsUsed: 0,
        sessionsLimit: -1, // -1 means unlimited
        storageUsed: 0,
        storageLimit: 1000, // 1GB default
        coachingHoursUsed: 0,
        coachingHoursLimit: 10,
        aiCreditsUsed: 0,
        aiCreditsLimit: 1000,
      },
    },
    previousPlanId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    upgradedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    downgradedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    changeEffectiveDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pendingChanges: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    cancellationReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    cancellationFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancellationCategory: {
      type: DataTypes.ENUM('voluntary', 'payment_failed', 'fraud', 'other'),
      allowNull: true,
    },
    winBackAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'subscriptions',
    modelName: 'Subscription',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
        name: 'idx_subscriptions_user_id',
      },
      {
        fields: ['customerId'],
        name: 'idx_subscriptions_customer_id',
      },
      {
        fields: ['status'],
        name: 'idx_subscriptions_status',
      },
      {
        fields: ['planId'],
        name: 'idx_subscriptions_plan_id',
      },
      {
        fields: ['planType'],
        name: 'idx_subscriptions_plan_type',
      },
      {
        fields: ['currentPeriodEnd'],
        name: 'idx_subscriptions_period_end',
      },
      {
        fields: ['nextBillingDate'],
        name: 'idx_subscriptions_next_billing',
      },
      {
        fields: ['canceledAt'],
        name: 'idx_subscriptions_canceled_at',
      },
      {
        fields: ['status', 'planType'],
        name: 'idx_subscriptions_status_plan',
      },
      {
        fields: ['tags'],
        using: 'GIN',
        name: 'idx_subscriptions_tags',
      },
    ],
  }
);

export default Subscription; 