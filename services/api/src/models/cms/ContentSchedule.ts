import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface ContentScheduleAttributes {
  id: number;
  contentId: number;
  scheduleType: 'publish' | 'unpublish' | 'update';
  scheduledFor: Date;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata?: any;
  createdBy: number;
  processedAt?: Date;
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentScheduleCreationAttributes
  extends Optional<
    ContentScheduleAttributes,
    'id' | 'status' | 'metadata' | 'processedAt' | 'error' | 'createdAt' | 'updatedAt'
  > {}

class ContentSchedule
  extends Model<ContentScheduleAttributes, ContentScheduleCreationAttributes>
  implements ContentScheduleAttributes
{
  declare id: number;
  public contentId!: number;
  public scheduleType!: 'publish' | 'unpublish' | 'update';
  public scheduledFor!: Date;
  public status!: 'pending' | 'completed' | 'failed' | 'cancelled';
  public metadata?: any;
  public createdBy!: number;
  public processedAt?: Date;
  public error?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ContentSchedule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    contentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'content_articles',
        key: 'id',
      },
    },
    scheduleType: {
      type: DataTypes.ENUM('publish', 'unpublish', 'update'),
      allowNull: false,
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ContentSchedule',
    tableName: 'content_schedules',
    timestamps: true,
    indexes: [
      {
        fields: ['scheduledFor', 'status'],
      },
      {
        fields: ['contentId'],
      },
    ],
  }
);

export default ContentSchedule;
