import { Model, DataTypes, Sequelize, Association, Optional } from 'sequelize';
import { Content } from './Content';

export interface ContentTagAttributes {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive: boolean;
  usageCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentTagCreationAttributes
  extends Optional<
    ContentTagAttributes,
    'id' | 'description' | 'color' | 'usageCount' | 'createdAt' | 'updatedAt'
  > {}

export class ContentTag
  extends Model<ContentTagAttributes, ContentTagCreationAttributes>
  implements ContentTagAttributes
{
  public id!: string;
  public name!: string;
  public slug!: string;
  public description?: string;
  public color?: string;
  public isActive!: boolean;
  public usageCount!: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public readonly contents?: Content[];

  public static associations: {
    contents: Association<ContentTag, Content>;
  };

  public static initialize(sequelize: Sequelize): void {
    ContentTag.init(
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
        color: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: '#6B7280',
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        usageCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        modelName: 'ContentTag',
        tableName: 'content_tags',
        timestamps: true,
        indexes: [
          { fields: ['slug'], unique: true },
          { fields: ['isActive'] },
          { fields: ['usageCount'] },
        ],
      }
    );
  }

  public static associate(): void {
    ContentTag.belongsToMany(Content, {
      through: 'content_tag_relations',
      foreignKey: 'tagId',
      otherKey: 'contentId',
      as: 'contents',
    });
  }
}
