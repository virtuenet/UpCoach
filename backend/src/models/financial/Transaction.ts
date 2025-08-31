import { Model, DataTypes, Optional, Association } from 'sequelize';
import { sequelize } from '../../config/sequelize';
import { User } from '../User';
import { Subscription } from './Subscription';

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
  CHARGEBACK = 'chargeback',
  PAYOUT = 'payout',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  CRYPTO = 'crypto',
  OTHER = 'other',
}

export interface TransactionAttributes {
  id: string;
  userId: string;
  subscriptionId?: string;
  stripeTransactionId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  description?: string;
  metadata?: any;
  stripeInvoiceId?: string;
  stripeChargeId?: string;
  stripeRefundId?: string;
  failureReason?: string;
  refundedAmount?: number;
  fee?: number;
  net?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TransactionCreationAttributes
  extends Optional<
    TransactionAttributes,
    | 'id'
    | 'subscriptionId'
    | 'description'
    | 'metadata'
    | 'stripeInvoiceId'
    | 'stripeChargeId'
    | 'stripeRefundId'
    | 'failureReason'
    | 'refundedAmount'
    | 'fee'
    | 'net'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class Transaction
  extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes
{
  public id!: string;
  public userId!: string;
  public subscriptionId?: string;
  public stripeTransactionId!: string;
  public type!: TransactionType;
  public status!: TransactionStatus;
  public amount!: number;
  public currency!: string;
  public paymentMethod!: PaymentMethod;
  public description?: string;
  public metadata?: any;
  public stripeInvoiceId?: string;
  public stripeChargeId?: string;
  public stripeRefundId?: string;
  public failureReason?: string;
  public refundedAmount?: number;
  public fee?: number;
  public net?: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public readonly user?: User;
  public readonly subscription?: Subscription;

  public static associations: {
    user: Association<Transaction, User>;
    subscription: Association<Transaction, Subscription>;
  };

  // Calculated properties
  get isRefundable(): boolean {
    return (
      this.status === TransactionStatus.COMPLETED &&
      this.type === TransactionType.PAYMENT &&
      (!this.refundedAmount || this.refundedAmount < this.amount)
    );
  }

  get remainingRefundableAmount(): number {
    if (!this.isRefundable) return 0;
    return this.amount - (this.refundedAmount || 0);
  }

  get netAmount(): number {
    if (this.net !== undefined) return this.net;
    return this.amount - (this.fee || 0);
  }

  public static associate(models: any) {
    Transaction.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Transaction.belongsTo(models.Subscription, {
      foreignKey: 'subscriptionId',
      as: 'subscription',
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
    stripeTransactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(TransactionType)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TransactionStatus)),
      allowNull: false,
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
    paymentMethod: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    stripeInvoiceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stripeChargeId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stripeRefundId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refundedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    net: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['subscriptionId'] },
      { fields: ['stripeTransactionId'] },
      { fields: ['type'] },
      { fields: ['status'] },
    ],
  }
);
