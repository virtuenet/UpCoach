import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface ExperimentEventAttributes {
  id: string;
  experimentId: string;
  userId: string;
  variantId: string;
  eventType: string;
  eventValue?: number;
  properties?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  metadata?: Record<string, any>;
}

interface ExperimentEventCreationAttributes
  extends Optional<ExperimentEventAttributes, 'id' | 'timestamp'> {}

class ExperimentEvent
  extends Model<ExperimentEventAttributes, ExperimentEventCreationAttributes>
  implements ExperimentEventAttributes
{
  public id!: string;
  public experimentId!: string;
  public userId!: string;
  public variantId!: string;
  public eventType!: string;
  public eventValue?: number;
  public properties?: Record<string, any>;
  public timestamp!: Date;
  public sessionId?: string;
  public metadata?: Record<string, any>;

  // Static methods for analytics
  static async trackEvent(
    experimentId: string,
    userId: string,
    variantId: string,
    eventType: string,
    eventValue?: number,
    properties?: Record<string, any>
  ): Promise<ExperimentEvent> {
    return this.create({
      experimentId,
      userId,
      variantId,
      eventType,
      eventValue,
      properties,
    });
  }

  static async getConversionRate(
    experimentId: string,
    variantId: string,
    conversionEvent: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ totalUsers: number; conversions: number; conversionRate: number }> {
    const whereClause: any = {
      experimentId,
      variantId,
    };

    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp.gte = startDate;
      if (endDate) whereClause.timestamp.lte = endDate;
    }

    // Get total unique users in this variant
    const totalUsers = await this.count({
      where: whereClause,
      distinct: true,
      col: 'userId',
    });

    // Get users who converted
    const conversions = await this.count({
      where: {
        ...whereClause,
        eventType: conversionEvent,
      },
      distinct: true,
      col: 'userId',
    });

    const conversionRate = totalUsers > 0 ? conversions / totalUsers : 0;

    return {
      totalUsers,
      conversions,
      conversionRate,
    };
  }

  static async getEventMetrics(
    experimentId: string,
    variantId: string,
    eventType: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    count: number;
    uniqueUsers: number;
    averageValue?: number;
    totalValue?: number;
  }> {
    const whereClause: any = {
      experimentId,
      variantId,
      eventType,
    };

    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp.gte = startDate;
      if (endDate) whereClause.timestamp.lte = endDate;
    }

    const [countResult, uniqueUsersResult, valueResult] = await Promise.all([
      this.count({ where: whereClause }),
      this.count({ where: whereClause, distinct: true, col: 'userId' }),
      this.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn('AVG', sequelize.col('eventValue')), 'averageValue'],
          [sequelize.fn('SUM', sequelize.col('eventValue')), 'totalValue'],
        ],
        raw: true,
      }),
    ]);

    return {
      count: countResult,
      uniqueUsers: uniqueUsersResult,
      averageValue:
        valueResult[0] && 'averageValue' in valueResult[0]
          ? parseFloat(valueResult[0]['averageValue'] as string)
          : undefined,
      totalValue:
        valueResult[0] && 'totalValue' in valueResult[0]
          ? parseFloat(valueResult[0]['totalValue'] as string)
          : undefined,
    };
  }

  static async getEventFunnel(
    experimentId: string,
    variantId: string,
    events: string[],
    startDate?: Date,
    endDate?: Date
  ): Promise<{ event: string; users: number; conversionRate: number }[]> {
    const results = [];
    let previousUsers = 0;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const metrics = await this.getEventMetrics(
        experimentId,
        variantId,
        event,
        startDate,
        endDate
      );

      const conversionRate =
        i === 0 ? 1 : previousUsers > 0 ? metrics.uniqueUsers / previousUsers : 0;

      results.push({
        event,
        users: metrics.uniqueUsers,
        conversionRate,
      });

      previousUsers = metrics.uniqueUsers;
    }

    return results;
  }
}

ExperimentEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    experimentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'experiments',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    variantId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    properties: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ExperimentEvent',
    tableName: 'experiment_events',
    timestamps: false,
    indexes: [
      {
        fields: ['experimentId', 'variantId'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['eventType'],
      },
      {
        fields: ['timestamp'],
      },
      {
        fields: ['experimentId', 'variantId', 'eventType'],
      },
    ],
  }
);

export { ExperimentEvent };
