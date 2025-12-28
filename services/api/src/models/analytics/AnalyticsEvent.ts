import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

export interface AnalyticsEventAttributes {
  id: string;
  tenantId: string;
  userId?: string;
  sessionId?: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp: Date;
  deviceType?: string;
  platform?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsEventCreationAttributes
  extends Optional<AnalyticsEventAttributes, 'id' | 'timestamp'> {}

export class AnalyticsEvent
  extends Model<AnalyticsEventAttributes, AnalyticsEventCreationAttributes>
  implements AnalyticsEventAttributes
{
  public id!: string;
  public tenantId!: string;
  public userId?: string;
  public sessionId?: string;
  public eventType!: string;
  public eventData!: Record<string, any>;
  public timestamp!: Date;
  public deviceType?: string;
  public platform?: string;
  public ipAddress?: string;
  public userAgent?: string;
  public metadata?: Record<string, any>;
}

AnalyticsEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventData: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deviceType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    platform: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'analytics_events',
    timestamps: false,
    indexes: [
      { fields: ['tenantId', 'timestamp'] },
      { fields: ['userId', 'timestamp'] },
      { fields: ['eventType', 'timestamp'] },
      { fields: ['sessionId'] },
    ],
  }
);

export default AnalyticsEvent;
