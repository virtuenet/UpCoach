import { Model, DataTypes, Optional, Association } from 'sequelize';
import { sequelize } from '../index';
import { User } from '../User';
import { Subscription } from './Subscription';
import { Transaction } from './Transaction';

export enum BillingEventType {
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPDATED = 'subscription_updated',
  SUBSCRIPTION_CANCELED = 'subscription_canceled',
  SUBSCRIPTION_REACTIVATED = 'subscription_reactivated',
  PAYMENT_SUCCEEDED = 'payment_succeeded',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_RETRY = 'payment_retry',
  REFUND_ISSUED = 'refund_issued',
  CHARGEBACK_CREATED = 'chargeback_created',
  TRIAL_STARTED = 'trial_started',
  TRIAL_ENDED = 'trial_ended',
  PLAN_CHANGED = 'plan_changed',
  DISCOUNT_APPLIED = 'discount_applied',
  DISCOUNT_REMOVED = 'discount_removed',
  INVOICE_CREATED = 'invoice_created',
  INVOICE_SENT = 'invoice_sent',
  INVOICE_PAID = 'invoice_paid',
  CREDIT_APPLIED = 'credit_applied',
  DUNNING_STARTED = 'dunning_started',
  DUNNING_RESOLVED = 'dunning_resolved',
}

export enum BillingEventSource {
  STRIPE_WEBHOOK = 'stripe_webhook',
  ADMIN_ACTION = 'admin_action',
  SYSTEM_AUTOMATION = 'system_automation',
  USER_ACTION = 'user_action',
  API_CALL = 'api_call',
}

export interface BillingEventAttributes {
  id: string;
  eventType: BillingEventType;
  source: BillingEventSource;
  userId: string;
  subscriptionId?: string;
  transactionId?: string;
  stripeEventId?: string;
  description: string;
  amount?: number;
  currency?: string;
  previousValue?: string;
  newValue?: string;
  eventData?: any;
  ipAddress?: string;
  userAgent?: string;
  performedBy?: string;
  isProcessed: boolean;
  processedAt?: Date;
  processingError?: string;
  retryCount: number;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BillingEventCreationAttributes extends Optional<BillingEventAttributes, 'id' | 'subscriptionId' | 'transactionId' | 'stripeEventId' | 'amount' | 'currency' | 'previousValue' | 'newValue' | 'eventData' | 'ipAddress' | 'userAgent' | 'performedBy' | 'isProcessed' | 'processedAt' | 'processingError' | 'retryCount' | 'metadata' | 'createdAt' | 'updatedAt'> {}

export class BillingEvent extends Model<BillingEventAttributes, BillingEventCreationAttributes> implements BillingEventAttributes {
  public id!: string;
  public eventType!: BillingEventType;
  public source!: BillingEventSource;
  public userId!: string;
  public subscriptionId?: string;
  public transactionId?: string;
  public stripeEventId?: string;
  public description!: string;
  public amount?: number;
  public currency?: string;
  public previousValue?: string;
  public newValue?: string;
  public eventData?: any;
  public ipAddress?: string;
  public userAgent?: string;
  public performedBy?: string;
  public isProcessed!: boolean;
  public processedAt?: Date;
  public processingError?: string;
  public retryCount!: number;
  public metadata?: any;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public readonly user?: User;
  public readonly subscription?: Subscription;
  public readonly transaction?: Transaction;

  public static associations: {
    user: Association<BillingEvent, User>;
    subscription: Association<BillingEvent, Subscription>;
    transaction: Association<BillingEvent, Transaction>;
  };

  // Calculated properties
  get isMonetaryEvent(): boolean {
    return [
      BillingEventType.PAYMENT_SUCCEEDED,
      BillingEventType.PAYMENT_FAILED,
      BillingEventType.REFUND_ISSUED,
      BillingEventType.CHARGEBACK_CREATED,
      BillingEventType.CREDIT_APPLIED,
    ].includes(this.eventType);
  }

  get requiresAction(): boolean {
    return [
      BillingEventType.PAYMENT_FAILED,
      BillingEventType.CHARGEBACK_CREATED,
      BillingEventType.DUNNING_STARTED,
    ].includes(this.eventType) && !this.isProcessed;
  }

  get severity(): 'low' | 'medium' | 'high' | 'critical' {
    switch (this.eventType) {
      case BillingEventType.PAYMENT_FAILED:
      case BillingEventType.CHARGEBACK_CREATED:
        return 'high';
      case BillingEventType.SUBSCRIPTION_CANCELED:
      case BillingEventType.DUNNING_STARTED:
        return 'medium';
      default:
        return 'low';
    }
  }

  public static associate(models: any) {
    BillingEvent.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    BillingEvent.belongsTo(models.Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });
    BillingEvent.belongsTo(models.Transaction, { foreignKey: 'transactionId', as: 'transaction' });
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
      type: DataTypes.ENUM(...Object.values(BillingEventType)),
      allowNull: false,
    },
    source: {
      type: DataTypes.ENUM(...Object.values(BillingEventSource)),
      allowNull: false,
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
    transactionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'transactions',
        key: 'id',
      },
    },
    stripeEventId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: true,
    },
    previousValue: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    newValue: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    eventData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    performedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isProcessed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    processingError: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'BillingEvent',
    tableName: 'billing_events',
    timestamps: true,
    indexes: [
      { fields: ['eventType'] },
      { fields: ['source'] },
      { fields: ['userId'] },
      { fields: ['subscriptionId'] },
    ],
  }
);