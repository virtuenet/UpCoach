import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface ContentCommentAttributes {
  id: number;
  contentId: number;
  userId: number;
  parentId?: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  likes: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentCommentCreationAttributes
  extends Optional<
    ContentCommentAttributes,
    'id' | 'parentId' | 'status' | 'likes' | 'createdAt' | 'updatedAt'
  > {}

class ContentComment
  extends Model<ContentCommentAttributes, ContentCommentCreationAttributes>
  implements ContentCommentAttributes
{
  declare id: number;
  public contentId!: number;
  public userId!: number;
  public parentId?: number;
  public comment!: string;
  public status!: 'pending' | 'approved' | 'rejected' | 'flagged';
  public likes!: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Static method declaration for lazy initialization
  static initializeModel: (sequelize: Sequelize) => typeof ContentComment;
}

// Static method for deferred initialization
ContentComment.initializeModel = function(sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for ContentComment initialization');
  }

  return ContentComment.init(
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
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'content_comments',
          key: 'id',
        },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
        allowNull: false,
        defaultValue: 'pending',
      },
      likes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize: sequelizeInstance,
      modelName: 'ContentComment',
      tableName: 'content_comments',
      timestamps: true,
      indexes: [
        {
          fields: ['contentId', 'status'],
        },
        {
          fields: ['userId'],
        },
        {
          fields: ['parentId'],
        },
      ],
    }
  );
};

// Comment out immediate initialization to prevent premature execution
// ContentComment.init(...) will be called via ContentComment.initializeModel() after database is ready

export default ContentComment;
