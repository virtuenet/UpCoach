/**
 * Unified Tag Model
 * Consolidates ContentTag and other tag models
 */

import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface UnifiedTagAttributes {
  id: string;
  name: string;
  slug: string;
  type: 'content' | 'skill' | 'topic' | 'general';
  color?: string;
  icon?: string;
  description?: string;
  usageCount: number;
  isActive: boolean;
  metadata?: {
    synonyms?: string[];
    relatedTags?: string[];
    priority?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UnifiedTagCreationAttributes
  extends Optional<
    UnifiedTagAttributes,
    | 'id'
    | 'color'
    | 'icon'
    | 'description'
    | 'usageCount'
    | 'isActive'
    | 'metadata'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class UnifiedTag
  extends Model<UnifiedTagAttributes, UnifiedTagCreationAttributes>
  implements UnifiedTagAttributes
{
  public id!: string;
  public name!: string;
  public slug!: string;
  public type!: 'content' | 'skill' | 'topic' | 'general';
  public color?: string;
  public icon?: string;
  public description?: string;
  public usageCount!: number;
  public isActive!: boolean;
  public metadata?: UnifiedTagAttributes['metadata'];

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public static initialize(sequelize: Sequelize): void {
    UnifiedTag.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        type: {
          type: DataTypes.ENUM('content', 'skill', 'topic', 'general'),
          allowNull: false,
          defaultValue: 'general',
        },
        color: {
          type: DataTypes.STRING(7),
          allowNull: true,
        },
        icon: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        usageCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
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
        modelName: 'UnifiedTag',
        tableName: 'unified_tags',
        timestamps: true,
        indexes: [
          { fields: ['slug'], unique: true },
          { fields: ['type'] },
          { fields: ['usageCount'] },
          { fields: ['isActive'] },
        ],
      }
    );
  }
}

export default UnifiedTag;
