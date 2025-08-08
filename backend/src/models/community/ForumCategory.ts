import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ForumCategoryAttributes {
  id: string;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  color?: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumCategoryCreationAttributes extends Omit<ForumCategoryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class ForumCategory extends Model<ForumCategoryAttributes, ForumCategoryCreationAttributes> implements ForumCategoryAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public slug!: string;
  public icon?: string;
  public color?: string;
  public orderIndex!: number;
  public isActive!: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public readonly threads?: any[];

  public static associate(models: any) {
    ForumCategory.hasMany(models.ForumThread, {
      foreignKey: 'categoryId',
      as: 'threads'
    });
  }
}

export default (sequelize: Sequelize) => {
  ForumCategory.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      icon: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
      },
      orderIndex: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'order_index',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
      createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      modelName: 'ForumCategory',
      tableName: 'forum_categories',
      timestamps: true,
      underscored: true,
    }
  );

  return ForumCategory;
};