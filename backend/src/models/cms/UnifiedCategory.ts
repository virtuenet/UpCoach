/**
 * Unified Category Model
 * Consolidates Category, ContentCategory, and related category models
 */

import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface UnifiedCategoryAttributes {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: 'content' | 'course' | 'product' | 'general';
  parentId?: string;
  icon?: string;
  image?: string;
  color?: string;
  order?: number;
  isActive: boolean;
  metadata?: {
    contentCount?: number;
    viewCount?: number;
    seoTitle?: string;
    seoDescription?: string;
    keywords?: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UnifiedCategoryCreationAttributes extends Optional<
  UnifiedCategoryAttributes,
  | 'id'
  | 'description'
  | 'parentId'
  | 'icon'
  | 'image'
  | 'color'
  | 'order'
  | 'isActive'
  | 'metadata'
  | 'createdAt'
  | 'updatedAt'
> {}

export class UnifiedCategory extends Model<UnifiedCategoryAttributes, UnifiedCategoryCreationAttributes> 
  implements UnifiedCategoryAttributes {
  
  public id!: string;
  public name!: string;
  public slug!: string;
  public description?: string;
  public type!: 'content' | 'course' | 'product' | 'general';
  public parentId?: string;
  public icon?: string;
  public image?: string;
  public color?: string;
  public order?: number;
  public isActive!: boolean;
  public metadata?: UnifiedCategoryAttributes['metadata'];
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  
  // Associations
  public readonly parent?: UnifiedCategory;
  public readonly children?: UnifiedCategory[];
  
  public static initialize(sequelize: Sequelize): void {
    UnifiedCategory.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        type: {
          type: DataTypes.ENUM('content', 'course', 'product', 'general'),
          allowNull: false,
          defaultValue: 'general',
        },
        parentId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'unified_categories',
            key: 'id',
          },
        },
        icon: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        image: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        color: {
          type: DataTypes.STRING(7),
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
          defaultValue: {},
        },
      },
      {
        sequelize,
        modelName: 'UnifiedCategory',
        tableName: 'unified_categories',
        timestamps: true,
        indexes: [
          { fields: ['slug'], unique: true },
          { fields: ['type'] },
          { fields: ['parentId'] },
          { fields: ['isActive'] },
        ],
      }
    );
  }
  
  public static associate(): void {
    UnifiedCategory.belongsTo(UnifiedCategory, {
      foreignKey: 'parentId',
      as: 'parent',
    });
    
    UnifiedCategory.hasMany(UnifiedCategory, {
      foreignKey: 'parentId',
      as: 'children',
    });
  }
}

export default UnifiedCategory;