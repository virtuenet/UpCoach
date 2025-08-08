import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

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

export interface ContentCommentCreationAttributes extends Optional<ContentCommentAttributes, 'id' | 'parentId' | 'status' | 'likes' | 'createdAt' | 'updatedAt'> {}

class ContentComment extends Model<ContentCommentAttributes, ContentCommentCreationAttributes> implements ContentCommentAttributes {
  declare id: number;
  public contentId!: number;
  public userId!: number;
  public parentId?: number;
  public comment!: string;
  public status!: 'pending' | 'approved' | 'rejected' | 'flagged';
  public likes!: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ContentComment.init(
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
    sequelize,
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

export default ContentComment;