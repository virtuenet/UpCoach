import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from './index';

export interface TaskAttributes {
  id: string;
  userId: string;
  goalId?: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category?: string;
  tags?: string[];
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  isRecurring: boolean;
  recurringPattern?: any;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'goalId' | 'description' | 'dueDate' | 'priority' | 'status' | 'category' | 'tags' | 'estimatedTime' | 'actualTime' | 'isRecurring' | 'recurringPattern' | 'completedAt' | 'createdAt' | 'updatedAt'> {}

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: string;
  public userId!: string;
  public goalId?: string;
  public title!: string;
  public description?: string;
  public dueDate?: Date;
  public priority!: 'low' | 'medium' | 'high';
  public status!: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  public category?: string;
  public tags?: string[];
  public estimatedTime?: number;
  public actualTime?: number;
  public isRecurring!: boolean;
  public recurringPattern?: any;
  public completedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associate(models: any) {
    Task.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Task.belongsTo(models.Goal, { foreignKey: 'goalId', as: 'goal' });
  }
}

Task.init(
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
    goalId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'goals',
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
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    estimatedTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    actualTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    recurringPattern: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true,
  }
);