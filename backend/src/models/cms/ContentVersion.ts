import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface ContentVersionAttributes {
  id: number;
  contentId: number;
  version: number;
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  metadata?: any;
  changes?: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentVersionCreationAttributes extends Optional<ContentVersionAttributes, 'id' | 'version' | 'excerpt' | 'featuredImage' | 'metadata' | 'changes' | 'createdAt' | 'updatedAt'> {}

class ContentVersion extends Model<ContentVersionAttributes, ContentVersionCreationAttributes> implements ContentVersionAttributes {
  declare id: number;
  public contentId!: number;
  public version!: number;
  public title!: string;
  public content!: string;
  public excerpt?: string;
  public featuredImage?: string;
  public metadata?: any;
  public changes?: string;
  public createdBy!: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ContentVersion.init(
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
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    featuredImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    changes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'ContentVersion',
    tableName: 'content_versions',
    timestamps: true,
    indexes: [
      {
        fields: ['contentId', 'version'],
        unique: true,
      },
    ],
  }
);

export default ContentVersion;