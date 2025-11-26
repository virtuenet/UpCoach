import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface ContentVersionAttributes {
  id: number;
  contentId: number;
  version: number;
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  metadata?: unknown;
  changes?: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentVersionCreationAttributes
  extends Optional<
    ContentVersionAttributes,
    | 'id'
    | 'version'
    | 'excerpt'
    | 'featuredImage'
    | 'metadata'
    | 'changes'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class ContentVersion
  extends Model<ContentVersionAttributes, ContentVersionCreationAttributes>
  implements ContentVersionAttributes
{
  declare id: number;
  public contentId!: number;
  public version!: number;
  public title!: string;
  public content!: string;
  public excerpt?: string;
  public featuredImage?: string;
  public metadata?: unknown;
  public changes?: string;
  public createdBy!: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Static method declaration for lazy initialization
  static initializeModel: (sequelize: Sequelize) => typeof ContentVersion;
}

// Static method for deferred initialization
ContentVersion.initializeModel = function(sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for ContentVersion initialization');
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
      sequelize: sequelizeInstance,
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

  return ContentVersion;
};

// Comment out immediate initialization to prevent premature execution
// ContentVersion.init(...) will be called via ContentVersion.initializeModel() after database is ready

export default ContentVersion;
