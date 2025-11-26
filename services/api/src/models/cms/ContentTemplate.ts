import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface ContentTemplateAttributes {
  id: number;
  name: string;
  description?: string;
  category: string;
  structure: unknown;
  thumbnail?: string;
  isActive: boolean;
  usageCount: number;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentTemplateCreationAttributes
  extends Optional<
    ContentTemplateAttributes,
    'id' | 'description' | 'thumbnail' | 'isActive' | 'usageCount' | 'createdAt' | 'updatedAt'
  > {}

class ContentTemplate
  extends Model<ContentTemplateAttributes, ContentTemplateCreationAttributes>
  implements ContentTemplateAttributes
{
  declare id: number;
  public name!: string;
  public description?: string;
  public category!: string;
  public structure!: unknown;
  public thumbnail?: string;
  public isActive!: boolean;
  public usageCount!: number;
  public createdBy!: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Static method declaration for lazy initialization
  static initializeModel: (sequelize: Sequelize) => typeof ContentTemplate;
}

// Static method for deferred initialization
ContentTemplate.initializeModel = function(sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for ContentTemplate initialization');
  }

  return ContentTemplate.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      structure: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
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
      modelName: 'ContentTemplate',
      tableName: 'content_templates',
      timestamps: true,
      indexes: [
        {
          fields: ['category', 'isActive'],
        },
      ],
    }
  );
};

// Comment out immediate initialization to prevent premature execution
// ContentTemplate.init(...) will be called via ContentTemplate.initializeModel() after database is ready

export default ContentTemplate;
