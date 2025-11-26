import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface ContentScheduleAttributes {
  id: number;
  contentId: number;
  scheduleType: 'publish' | 'unpublish' | 'update';
  scheduledFor: Date;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata?: unknown;
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
  public metadata?: unknown;
  public createdBy!: number;
  public processedAt?: Date;
  public error?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Static method declaration for lazy initialization
  static initializeModel: (sequelize: Sequelize) => typeof ContentSchedule;
}

// Static method for deferred initialization
ContentSchedule.initializeModel = function(sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for ContentSchedule initialization');
  }

  return ContentSchedule.init(
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
      sequelize: sequelizeInstance,
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
};

// Comment out immediate initialization to prevent premature execution
// ContentSchedule.init(...) will be called via ContentSchedule.initializeModel() after database is ready

export default ContentSchedule;
