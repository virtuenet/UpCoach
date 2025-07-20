import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

/**
 * BillingEvent Model
 * Comprehensive audit trail for all billing-related events
 */

export interface BillingEventAttributes {
  id: string;
  
  // Event Information
  eventType: 'subscription_created' | 'subscription_updated' | 'subscription_cancelled' |
            'payment_succeeded' | 'payment_failed' | 'payment_refunded' |
            'invoice_created' | 'invoice_paid' | 'invoice_failed' |
            'trial_started' | 'trial_ended' | 'trial_converted' |
            'plan_upgraded' | 'plan_downgraded' | 'plan_changed' |
            'discount_applied' | 'discount_removed' | 'promo_code_used' |
            'payment_method_added' | 'payment_method_removed' | 'payment_method_updated' |
            'chargeback_created' | 'chargeback_lost' | 'chargeback_won' |
            'dunning_started' | 'dunning_attempt' | 'dunning_recovered' | 'dunning_failed';
  
  // Related Entities
  userId?: string;
  subscriptionId?: string;
  transactionId?: string;
  invoiceId?: string;
  
  // Event Details
  eventData: {
    // Common fields
    amount?: number;
    currency?: string;
    description?: string;
    
    // Subscription events
    oldPlan?: string;
    newPlan?: string;
    oldAmount?: number;
    newAmount?: number;
    
    // Payment events
    paymentMethod?: string;
    failureReason?: string;
    failureCode?: string;
    retryAttempt?: number;
    
    // Invoice events
    invoiceNumber?: string;
    dueDate?: Date;
    
    // Trial events
    trialDays?: number;
    conversionProbability?: number;
    
    // Discount events
    discountType?: 'percentage' | 'fixed';
    discountValue?: number;
    promoCode?: string;
    
    // Chargeback events
    chargebackReason?: string;
    disputeAmount?: number;
    
    // Custom data
    metadata?: Record<string, any>;
  };
  
  // Source Information
  source: 'system' | 'api' | 'webhook' | 'admin' | 'automated' | 'manual';
  sourceIp?: string;
  userAgent?: string;
  
  // Webhook Information (if from payment provider)
  webhookId?: string;
  webhookProvider?: 'stripe' | 'paypal' | 'square' | 'other';
  webhookSignature?: string;
  webhookVerified: boolean;
  
  // Processing Information
  processedAt?: Date;
  processingDuration?: number; // in milliseconds
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'ignored';
  processingError?: string;
  
  // Side Effects
  sideEffects: {
    emailsSent?: string[];
    notificationsSent?: string[];
    webhooksTriggered?: string[];
    actionsPerformed?: string[];
  };
  
  // Impact Analysis
  impact: {
    mrrChange?: number;
    revenueImpact?: number;
    userStatusChange?: string;
    riskScoreChange?: number;
  };
  
  // Compliance & Audit
  compliance: {
    gdprCompliant?: boolean;
    pciCompliant?: boolean;
    dataRetentionDays?: number;
    auditRequired?: boolean;
  };
  
  // Related Events
  parentEventId?: string;
  childEventIds: string[];
  
  // Metadata
  environment: 'development' | 'staging' | 'production';
  version: string;
  tags: string[];
  
  // Timestamps
  eventTimestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingEventCreationAttributes extends Optional<BillingEventAttributes, 
  'id' | 'userId' | 'subscriptionId' | 'transactionId' | 'invoiceId' | 'sourceIp' | 
  'userAgent' | 'webhookId' | 'webhookProvider' | 'webhookSignature' | 'processedAt' |
  'processingDuration' | 'processingError' | 'parentEventId' | 'createdAt' | 'updatedAt'> {}

export class BillingEvent extends Model<BillingEventAttributes, BillingEventCreationAttributes> 
  implements BillingEventAttributes {
  
  public id!: string;
  
  public eventType!: 'subscription_created' | 'subscription_updated' | 'subscription_cancelled' |
                    'payment_succeeded' | 'payment_failed' | 'payment_refunded' |
                    'invoice_created' | 'invoice_paid' | 'invoice_failed' |
                    'trial_started' | 'trial_ended' | 'trial_converted' |
                    'plan_upgraded' | 'plan_downgraded' | 'plan_changed' |
                    'discount_applied' | 'discount_removed' | 'promo_code_used' |
                    'payment_method_added' | 'payment_method_removed' | 'payment_method_updated' |
                    'chargeback_created' | 'chargeback_lost' | 'chargeback_won' |
                    'dunning_started' | 'dunning_attempt' | 'dunning_recovered' | 'dunning_failed';
  
  public userId?: string;
  public subscriptionId?: string;
  public transactionId?: string;
  public invoiceId?: string;
  
  public eventData!: {
    amount?: number;
    currency?: string;
    description?: string;
    oldPlan?: string;
    newPlan?: string;
    oldAmount?: number;
    newAmount?: number;
    paymentMethod?: string;
    failureReason?: string;
    failureCode?: string;
    retryAttempt?: number;
    invoiceNumber?: string;
    dueDate?: Date;
    trialDays?: number;
    conversionProbability?: number;
    discountType?: 'percentage' | 'fixed';
    discountValue?: number;
    promoCode?: string;
    chargebackReason?: string;
    disputeAmount?: number;
    metadata?: Record<string, any>;
  };
  
  public source!: 'system' | 'api' | 'webhook' | 'admin' | 'automated' | 'manual';
  public sourceIp?: string;
  public userAgent?: string;
  
  public webhookId?: string;
  public webhookProvider?: 'stripe' | 'paypal' | 'square' | 'other';
  public webhookSignature?: string;
  public webhookVerified!: boolean;
  
  public processedAt?: Date;
  public processingDuration?: number;
  public processingStatus!: 'pending' | 'processing' | 'completed' | 'failed' | 'ignored';
  public processingError?: string;
  
  public sideEffects!: {
    emailsSent?: string[];
    notificationsSent?: string[];
    webhooksTriggered?: string[];
    actionsPerformed?: string[];
  };
  
  public impact!: {
    mrrChange?: number;
    revenueImpact?: number;
    userStatusChange?: string;
    riskScoreChange?: number;
  };
  
  public compliance!: {
    gdprCompliant?: boolean;
    pciCompliant?: boolean;
    dataRetentionDays?: number;
    auditRequired?: boolean;
  };
  
  public parentEventId?: string;
  public childEventIds!: string[];
  
  public environment!: 'development' | 'staging' | 'production';
  public version!: string;
  public tags!: string[];
  
  public eventTimestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Check if event is revenue impacting
   */
  public isRevenueImpacting(): boolean {
    const revenueEvents = [
      'subscription_created', 'subscription_cancelled',
      'payment_succeeded', 'payment_refunded',
      'plan_upgraded', 'plan_downgraded',
      'trial_converted', 'chargeback_lost'
    ];
    
    return revenueEvents.includes(this.eventType);
  }

  /**
   * Check if event requires immediate attention
   */
  public requiresAttention(): boolean {
    const criticalEvents = [
      'payment_failed', 'chargeback_created',
      'dunning_failed', 'subscription_cancelled'
    ];
    
    return criticalEvents.includes(this.eventType) || 
           this.processingStatus === 'failed';
  }

  /**
   * Get event severity level
   */
  public getSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.eventType.includes('failed') || this.eventType.includes('chargeback')) {
      return 'critical';
    }
    if (this.eventType.includes('cancelled') || this.eventType.includes('downgraded')) {
      return 'high';
    }
    if (this.eventType.includes('created') || this.eventType.includes('upgraded')) {
      return 'low';
    }
    return 'medium';
  }

  /**
   * Static method to get failed payment events
   */
  static async getFailedPayments(days: number = 7): Promise<BillingEvent[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    return this.findAll({
      where: {
        eventType: 'payment_failed',
        eventTimestamp: {
          [sequelize.Op.gte]: since,
        },
      },
      order: [['eventTimestamp', 'DESC']],
    });
  }

  /**
   * Static method to get revenue impact for a period
   */
  static async getRevenueImpact(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.literal("(impact->>'revenueImpact')::numeric")), 'totalImpact'],
      ],
      where: {
        eventTimestamp: {
          [sequelize.Op.between]: [startDate, endDate],
        },
      },
    });
    
    return parseFloat(result?.get('totalImpact') as string || '0');
  }

  /**
   * Static method to get event timeline for a user
   */
  static async getUserTimeline(userId: string): Promise<BillingEvent[]> {
    return this.findAll({
      where: { userId },
      order: [['eventTimestamp', 'DESC']],
      limit: 100,
    });
  }

  /**
   * Static method for webhook deduplication
   */
  static async isDuplicateWebhook(webhookId: string): Promise<boolean> {
    const existing = await this.findOne({
      where: { webhookId },
    });
    
    return !!existing;
  }
}

BillingEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    eventType: {
      type: DataTypes.ENUM(
        'subscription_created', 'subscription_updated', 'subscription_cancelled',
        'payment_succeeded', 'payment_failed', 'payment_refunded',
        'invoice_created', 'invoice_paid', 'invoice_failed',
        'trial_started', 'trial_ended', 'trial_converted',
        'plan_upgraded', 'plan_downgraded', 'plan_changed',
        'discount_applied', 'discount_removed', 'promo_code_used',
        'payment_method_added', 'payment_method_removed', 'payment_method_updated',
        'chargeback_created', 'chargeback_lost', 'chargeback_won',
        'dunning_started', 'dunning_attempt', 'dunning_recovered', 'dunning_failed'
      ),
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'subscriptions',
        key: 'id',
      },
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'transactions',
        key: 'id',
      },
    },
    invoiceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    eventData: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    source: {
      type: DataTypes.ENUM('system', 'api', 'webhook', 'admin', 'automated', 'manual'),
      allowNull: false,
    },
    sourceIp: {
      type: DataTypes.INET,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    webhookId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    webhookProvider: {
      type: DataTypes.ENUM('stripe', 'paypal', 'square', 'other'),
      allowNull: true,
    },
    webhookSignature: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    webhookVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    processingDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Processing time in milliseconds',
    },
    processingStatus: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'ignored'),
      allowNull: false,
      defaultValue: 'pending',
    },
    processingError: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sideEffects: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    impact: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    compliance: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        gdprCompliant: true,
        pciCompliant: true,
        dataRetentionDays: 2555, // 7 years
        auditRequired: false,
      },
    },
    parentEventId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'billing_events',
        key: 'id',
      },
    },
    childEventIds: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: false,
      defaultValue: [],
    },
    environment: {
      type: DataTypes.ENUM('development', 'staging', 'production'),
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '1.0.0',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    eventTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'billing_events',
    modelName: 'BillingEvent',
    timestamps: true,
    indexes: [
      {
        fields: ['eventType'],
        name: 'idx_billing_events_type',
      },
      {
        fields: ['userId'],
        name: 'idx_billing_events_user',
      },
      {
        fields: ['subscriptionId'],
        name: 'idx_billing_events_subscription',
      },
      {
        fields: ['transactionId'],
        name: 'idx_billing_events_transaction',
      },
      {
        fields: ['processingStatus'],
        name: 'idx_billing_events_status',
      },
      {
        fields: ['eventTimestamp'],
        name: 'idx_billing_events_timestamp',
      },
      {
        fields: ['webhookId'],
        name: 'idx_billing_events_webhook',
        unique: true,
      },
      {
        fields: ['source'],
        name: 'idx_billing_events_source',
      },
      {
        fields: ['parentEventId'],
        name: 'idx_billing_events_parent',
      },
      {
        fields: ['tags'],
        using: 'GIN',
        name: 'idx_billing_events_tags',
      },
    ],
  }
);

export default BillingEvent; 