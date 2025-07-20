import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

/**
 * Transaction Model
 * Tracks all financial transactions including payments, refunds, and adjustments
 */

export interface TransactionAttributes {
  id: string;
  userId: string;
  subscriptionId?: string;
  
  // Transaction Details
  type: 'payment' | 'refund' | 'chargeback' | 'adjustment' | 'credit' | 'debit';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  currency: string;
  description: string;
  
  // Payment Information
  paymentMethod: 'card' | 'bank_transfer' | 'paypal' | 'apple_pay' | 'google_pay' | 'other';
  paymentProvider: 'stripe' | 'paypal' | 'square' | 'manual' | 'other';
  providerTransactionId?: string;
  providerCustomerId?: string;
  
  // Card Details (masked)
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  
  // Billing Information
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  
  // Tax Information
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  taxJurisdiction?: string;
  
  // Refund Information (if applicable)
  refundedAmount: number;
  refundReason?: string;
  refundedAt?: Date;
  originalTransactionId?: string;
  
  // Risk & Compliance
  riskScore?: number;
  riskFlags?: string[];
  fraudDetectionOutcome?: string;
  requiresReview: boolean;
  
  // Metadata
  metadata?: Record<string, any>;
  invoiceId?: string;
  receiptUrl?: string;
  
  // Timestamps
  processedAt?: Date;
  failedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionCreationAttributes extends Optional<TransactionAttributes, 
  'id' | 'subscriptionId' | 'providerTransactionId' | 'providerCustomerId' | 
  'cardLast4' | 'cardBrand' | 'cardExpMonth' | 'cardExpYear' | 'billingAddress' |
  'taxJurisdiction' | 'refundReason' | 'refundedAt' | 'originalTransactionId' |
  'riskScore' | 'riskFlags' | 'fraudDetectionOutcome' | 'metadata' | 'invoiceId' |
  'receiptUrl' | 'processedAt' | 'failedAt' | 'createdAt' | 'updatedAt'> {}

export class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> 
  implements TransactionAttributes {
  
  public id!: string;
  public userId!: string;
  public subscriptionId?: string;
  
  public type!: 'payment' | 'refund' | 'chargeback' | 'adjustment' | 'credit' | 'debit';
  public status!: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  public amount!: number;
  public currency!: string;
  public description!: string;
  
  public paymentMethod!: 'card' | 'bank_transfer' | 'paypal' | 'apple_pay' | 'google_pay' | 'other';
  public paymentProvider!: 'stripe' | 'paypal' | 'square' | 'manual' | 'other';
  public providerTransactionId?: string;
  public providerCustomerId?: string;
  
  public cardLast4?: string;
  public cardBrand?: string;
  public cardExpMonth?: number;
  public cardExpYear?: number;
  
  public billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  
  public subtotal!: number;
  public taxAmount!: number;
  public taxRate!: number;
  public taxJurisdiction?: string;
  
  public refundedAmount!: number;
  public refundReason?: string;
  public refundedAt?: Date;
  public originalTransactionId?: string;
  
  public riskScore?: number;
  public riskFlags?: string[];
  public fraudDetectionOutcome?: string;
  public requiresReview!: boolean;
  
  public metadata?: Record<string, any>;
  public invoiceId?: string;
  public receiptUrl?: string;
  
  public processedAt?: Date;
  public failedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Calculate net amount after refunds
   */
  public getNetAmount(): number {
    return this.amount - this.refundedAmount;
  }

  /**
   * Check if transaction is fully refunded
   */
  public isFullyRefunded(): boolean {
    return this.refundedAmount >= this.amount;
  }

  /**
   * Check if transaction is partially refunded
   */
  public isPartiallyRefunded(): boolean {
    return this.refundedAmount > 0 && this.refundedAmount < this.amount;
  }

  /**
   * Get transaction age in days
   */
  public getAgeInDays(): number {
    const now = new Date();
    const transactionDate = this.processedAt || this.createdAt;
    return Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if transaction is eligible for refund (within refund window)
   */
  public isRefundEligible(refundWindowDays: number = 30): boolean {
    if (this.status !== 'completed' || this.isFullyRefunded()) {
      return false;
    }
    return this.getAgeInDays() <= refundWindowDays;
  }

  /**
   * Get transaction summary for display
   */
  public getSummary(): string {
    const typeLabel = this.type.charAt(0).toUpperCase() + this.type.slice(1);
    const statusLabel = this.status.charAt(0).toUpperCase() + this.status.slice(1);
    return `${typeLabel} - ${this.currency} ${this.amount.toFixed(2)} - ${statusLabel}`;
  }

  /**
   * Static method to get transactions by date range
   */
  static async getByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return this.findAll({
      where: {
        createdAt: {
          [sequelize.Op.between]: [startDate, endDate],
        },
      },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Static method to calculate total revenue for a period
   */
  static async calculateRevenue(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.literal('amount - refunded_amount')), 'totalRevenue'],
      ],
      where: {
        type: 'payment',
        status: 'completed',
        createdAt: {
          [sequelize.Op.between]: [startDate, endDate],
        },
      },
    });
    
    return parseFloat(result?.get('totalRevenue') as string || '0');
  }

  /**
   * Static method to get failed transactions requiring review
   */
  static async getFailedTransactions(): Promise<Transaction[]> {
    return this.findAll({
      where: {
        [sequelize.Op.or]: [
          { status: 'failed' },
          { requiresReview: true },
        ],
      },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
  }
}

Transaction.init(
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
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'subscriptions',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('payment', 'refund', 'chargeback', 'adjustment', 'credit', 'debit'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    amount: {
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
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('card', 'bank_transfer', 'paypal', 'apple_pay', 'google_pay', 'other'),
      allowNull: false,
    },
    paymentProvider: {
      type: DataTypes.ENUM('stripe', 'paypal', 'square', 'manual', 'other'),
      allowNull: false,
    },
    providerTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    providerCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cardLast4: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    cardBrand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cardExpMonth: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 12,
      },
    },
    cardExpYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: new Date().getFullYear(),
      },
    },
    billingAddress: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0,
    },
    taxJurisdiction: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    refundedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    refundReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    originalTransactionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'transactions',
        key: 'id',
      },
    },
    riskScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    riskFlags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    fraudDetectionOutcome: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    requiresReview: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    invoiceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'transactions',
    modelName: 'Transaction',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
        name: 'idx_transactions_user_id',
      },
      {
        fields: ['subscriptionId'],
        name: 'idx_transactions_subscription_id',
      },
      {
        fields: ['type'],
        name: 'idx_transactions_type',
      },
      {
        fields: ['status'],
        name: 'idx_transactions_status',
      },
      {
        fields: ['providerTransactionId'],
        name: 'idx_transactions_provider_id',
        unique: true,
      },
      {
        fields: ['createdAt'],
        name: 'idx_transactions_created_at',
      },
      {
        fields: ['processedAt'],
        name: 'idx_transactions_processed_at',
      },
      {
        fields: ['requiresReview'],
        name: 'idx_transactions_requires_review',
      },
      {
        fields: ['userId', 'status'],
        name: 'idx_transactions_user_status',
      },
      {
        fields: ['riskFlags'],
        using: 'GIN',
        name: 'idx_transactions_risk_flags',
      },
    ],
  }
);

export default Transaction; 