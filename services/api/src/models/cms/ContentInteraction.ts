import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface ContentInteractionAttributes {
  id: number;
  contentId: number;
  userId: number;
  interactionType: 'view' | 'like' | 'share' | 'save' | 'comment';
  metadata?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentInteractionCreationAttributes
  extends Optional<ContentInteractionAttributes, 'id' | 'metadata' | 'createdAt' | 'updatedAt'> {}

class ContentInteraction
  extends Model<ContentInteractionAttributes, ContentInteractionCreationAttributes>
  implements ContentInteractionAttributes
{
  declare id: number;
  public contentId!: number;
  public userId!: number;
  public interactionType!: 'view' | 'like' | 'share' | 'save' | 'comment';
  public metadata?: unknown;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Static method declaration for lazy initialization
  static initializeModel: (sequelize: Sequelize) => typeof ContentInteraction;
}

// Static method for deferred initialization
ContentInteraction.initializeModel = function(sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for ContentInteraction initialization');
  }

  return ContentInteraction.init(
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
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      interactionType: {
        type: DataTypes.ENUM('view', 'like', 'share', 'save', 'comment'),
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
    },
    {
      sequelize: sequelizeInstance,
      modelName: 'ContentInteraction',
      tableName: 'content_interactions',
      timestamps: true,
      indexes: [
        {
          fields: ['contentId', 'userId', 'interactionType'],
          unique: true,
        },
        {
          fields: ['userId'],
        },
      ],
    }
  );
};

// Comment out immediate initialization to prevent premature execution
// ContentInteraction.init(...) will be called via ContentInteraction.initializeModel() after database is ready

export default ContentInteraction;
