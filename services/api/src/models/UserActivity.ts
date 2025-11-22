import { Model, DataTypes, Optional } from 'sequelize';

import { sequelize } from '../config/sequelize';

export interface UserActivityAttributes {
  id: number;
  userId: string;
  activityType: string;
  activityData?: unknown;
  sessionId?: string;
  durationSeconds?: number;
  platform?: string;
  deviceType?: string;
  appVersion?: string;
  createdAt?: Date;
}

export interface UserActivityCreationAttributes
  extends Optional<
    UserActivityAttributes,
    | 'id'
    | 'activityData'
    | 'sessionId'
    | 'durationSeconds'
    | 'platform'
    | 'deviceType'
    | 'appVersion'
    | 'createdAt'
  > {}

export class UserActivity
  extends Model<UserActivityAttributes, UserActivityCreationAttributes>
  implements UserActivityAttributes
{
  public id!: number;
  public userId!: string;
  public activityType!: string;
  public activityData?: unknown;
  public sessionId?: string;
  public durationSeconds?: number;
  public platform?: string;
  public deviceType?: string;
  public appVersion?: string;
  declare readonly createdAt: Date;

  // Association properties
  public readonly user?: unknown;

  public static associate(models: unknown) {
    UserActivity.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

UserActivity.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
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
    activityType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'activity_type',
    },
    activityData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'activity_data',
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'session_id',
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'duration_seconds',
    },
    platform: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    deviceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'device_type',
    },
    appVersion: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'app_version',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    modelName: 'UserActivity',
    tableName: 'user_activity_logs',
    timestamps: false, // We handle createdAt manually
    indexes: [
      { fields: ['user_id'] },
      { fields: ['activity_type'] },
      { fields: ['created_at'] },
      { fields: ['session_id'] },
    ],
  }
);