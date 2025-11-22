import { Model, DataTypes, Sequelize, Association, Optional } from 'sequelize';

import { Content } from './Content';

export interface ContentCategoryAttributes {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  icon?: string;
  color?: string;
  order?: number;
  isActive: boolean;
  metadata?: {
    seoTitle?: string;
    seoDescription?: string;
    keywords?: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentCategoryCreationAttributes
  extends Optional<
    ContentCategoryAttributes,
    | 'id'
    | 'description'
    | 'parentId'
    | 'icon'
    | 'color'
    | 'order'
    | 'metadata'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class ContentCategory
  extends Model<ContentCategoryAttributes, ContentCategoryCreationAttributes>
  implements ContentCategoryAttributes
{
  public id!: string;
  public name!: string;
  public slug!: string;
  public description?: string;
  public parentId?: string;
  public icon?: string;
  public color?: string;
  public order?: number;
  public isActive!: boolean;
  public metadata?: {
    seoTitle?: string;
    seoDescription?: string;
    keywords?: string[];
  };
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public readonly contents?: Content[];
  public readonly parent?: ContentCategory;
  public readonly children?: ContentCategory[];

  public static associations: {
    contents: Association<ContentCategory, Content>;
    parent: Association<ContentCategory, ContentCategory>;
    children: Association<ContentCategory, ContentCategory>;
  };

  public static initialize(sequelize: Sequelize): void {
    ContentCategory.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        parentId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'content_categories',
            key: 'id',
          },
        },
        icon: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        color: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        order: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'ContentCategory',
        tableName: 'content_categories',
        timestamps: true,
        indexes: [
          { fields: ['slug'], unique: true },
          { fields: ['parentId'] },
          { fields: ['isActive'] },
        ],
      }
    );
  }

  public static associate(): void {
    ContentCategory.hasMany(Content, {
      foreignKey: 'categoryId',
      as: 'contents',
    });

    ContentCategory.belongsTo(ContentCategory, {
      foreignKey: 'parentId',
      as: 'parent',
    });

    ContentCategory.hasMany(ContentCategory, {
      foreignKey: 'parentId',
      as: 'children',
    });
  }
}
