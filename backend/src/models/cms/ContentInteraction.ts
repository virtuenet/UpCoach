import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface ContentInteractionAttributes {
  id: number;
  contentId: number;
  userId: number;
  interactionType: 'view' | 'like' | 'share' | 'save' | 'comment';
  metadata?: any;
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
  public metadata?: any;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ContentInteraction.init(
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
    sequelize,
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

export default ContentInteraction;
