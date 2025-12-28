import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

/**
 * Webhook Event Types
 */
export type WebhookEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'goal.created'
  | 'goal.updated'
  | 'goal.completed'
  | 'goal.deleted'
  | 'habit.created'
  | 'habit.logged'
  | 'habit.streak_milestone'
  | 'habit.deleted'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'ai.insight_generated'
  | 'team.member_added'
  | 'team.member_removed';

export type WebhookStatus = 'active' | 'paused' | 'failed';

/**
 * Webhook Subscription Attributes
 */
export interface WebhookSubscriptionAttributes {
  id: string;
  userId: string;
  organizationId?: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  status: WebhookStatus;
  retryConfig: {
    maxRetries: number;
    retryDelays: number[];
  };
  statistics: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    lastDeliveryAt?: Date;
    lastSuccessAt?: Date;
    lastFailureAt?: Date;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookSubscriptionCreationAttributes
  extends Optional<WebhookSubscriptionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

/**
 * WebhookSubscription Model
 */
export class WebhookSubscription
  extends Model<WebhookSubscriptionAttributes, WebhookSubscriptionCreationAttributes>
  implements WebhookSubscriptionAttributes
{
  public id!: string;
  public userId!: string;
  public organizationId?: string;
  public url!: string;
  public events!: WebhookEventType[];
  public secret!: string;
  public status!: WebhookStatus;
  public retryConfig!: {
    maxRetries: number;
    retryDelays: number[];
  };
  public statistics!: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    lastDeliveryAt?: Date;
    lastSuccessAt?: Date;
    lastFailureAt?: Date;
  };
  public metadata?: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;
}

WebhookSubscription.init(
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
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id',
      },
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
    events: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    secret: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'paused', 'failed'),
      allowNull: false,
      defaultValue: 'active',
    },
    retryConfig: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        maxRetries: 3,
        retryDelays: [60, 300, 900],
      },
    },
    statistics: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
      },
    },
    metadata: {
      type: DataTypes.JSON,
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
    sequelize,
    tableName: 'webhook_subscriptions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['organizationId'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

/**
 * Helper Functions
 */
export class WebhookSubscriptionHelper {
  /**
   * Create Subscription
   */
  static async create(
    userId: string,
    url: string,
    events: WebhookEventType[],
    secret: string,
    organizationId?: string,
    metadata?: Record<string, any>
  ): Promise<WebhookSubscription> {
    return await WebhookSubscription.create({
      userId,
      url,
      events,
      secret,
      organizationId,
      metadata,
      status: 'active',
      retryConfig: {
        maxRetries: 3,
        retryDelays: [60, 300, 900],
      },
      statistics: {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
      },
    });
  }

  /**
   * Get User Subscriptions
   */
  static async getUserSubscriptions(userId: string): Promise<WebhookSubscription[]> {
    return await WebhookSubscription.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get Organization Subscriptions
   */
  static async getOrganizationSubscriptions(
    organizationId: string
  ): Promise<WebhookSubscription[]> {
    return await WebhookSubscription.findAll({
      where: { organizationId },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get Active Subscriptions for Event
   */
  static async getActiveSubscriptionsForEvent(
    eventType: WebhookEventType
  ): Promise<WebhookSubscription[]> {
    return await WebhookSubscription.findAll({
      where: {
        status: 'active',
        events: sequelize.literal(`events @> '["${eventType}"]'::jsonb`),
      },
    });
  }

  /**
   * Update Status
   */
  static async updateStatus(id: string, status: WebhookStatus): Promise<WebhookSubscription> {
    const subscription = await WebhookSubscription.findByPk(id);
    if (!subscription) {
      throw new Error('Webhook subscription not found');
    }

    subscription.status = status;
    await subscription.save();
    return subscription;
  }

  /**
   * Update Statistics
   */
  static async updateStatistics(
    id: string,
    success: boolean
  ): Promise<WebhookSubscription> {
    const subscription = await WebhookSubscription.findByPk(id);
    if (!subscription) {
      throw new Error('Webhook subscription not found');
    }

    const now = new Date();
    subscription.statistics = {
      ...subscription.statistics,
      totalDeliveries: subscription.statistics.totalDeliveries + 1,
      successfulDeliveries: success
        ? subscription.statistics.successfulDeliveries + 1
        : subscription.statistics.successfulDeliveries,
      failedDeliveries: !success
        ? subscription.statistics.failedDeliveries + 1
        : subscription.statistics.failedDeliveries,
      lastDeliveryAt: now,
      lastSuccessAt: success ? now : subscription.statistics.lastSuccessAt,
      lastFailureAt: !success ? now : subscription.statistics.lastFailureAt,
    };

    await subscription.save();
    return subscription;
  }

  /**
   * Delete Subscription
   */
  static async delete(id: string): Promise<void> {
    await WebhookSubscription.destroy({ where: { id } });
  }
}

export default WebhookSubscription;
