import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

export interface GoalAttributes {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDate?: Date;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  progress: number;
  milestones?: any;
  reminders?: any;
  isArchived: boolean;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GoalCreationAttributes
  extends Optional<
    GoalAttributes,
    | 'id'
    | 'description'
    | 'targetDate'
    | 'category'
    | 'priority'
    | 'status'
    | 'progress'
    | 'milestones'
    | 'reminders'
    | 'isArchived'
    | 'completedAt'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class Goal extends Model<GoalAttributes, GoalCreationAttributes> implements GoalAttributes {
  public id!: string;
  public userId!: string;
  public title!: string;
  public description?: string;
  public targetDate?: Date;
  public category?: string;
  public priority!: 'low' | 'medium' | 'high';
  public status!: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  public progress!: number;
  public milestones?: any;
  public reminders?: any;
  public isArchived!: boolean;
  public completedAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public static associate(models: any) {
    Goal.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Goal.hasMany(models.Task, { foreignKey: 'goalId', as: 'tasks' });
  }
}

Goal.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    targetDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'abandoned'),
      defaultValue: 'not_started',
      allowNull: false,
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    milestones: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    reminders: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Goal',
    tableName: 'goals',
    timestamps: true,
  }
);
