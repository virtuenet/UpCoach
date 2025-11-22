// Test Environment Setup for AI Services
import * as dotenv from 'dotenv';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';

// Configure test environment
dotenv.config({ path: path.resolve(__dirname, '../../../../.env.test') });

// Import models to ensure they are initialized
import { Goal } from '../../models/Goal';
import { User } from '../../models/User';
import { Task } from '../../models/Task';

// Create an in-memory test database
const sequelize = new Sequelize('sqlite::memory:', {
  logging: false,
  dialect: 'sqlite'
});

// Initialize models with the test database
// We need to create proper attribute definitions for the test models
const goalAttributes = {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  targetDate: { type: DataTypes.DATE, allowNull: true },
  category: { type: DataTypes.STRING, allowNull: true },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium', allowNull: false },
  status: { type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'abandoned'), defaultValue: 'not_started', allowNull: false },
  progress: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  milestones: { type: DataTypes.JSON, allowNull: true },
  reminders: { type: DataTypes.JSON, allowNull: true },
  isArchived: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  completedAt: { type: DataTypes.DATE, allowNull: true }
};

const userAttributes = {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('user', 'admin', 'coach'), defaultValue: 'user', allowNull: false },
  avatar: { type: DataTypes.STRING, allowNull: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
  googleId: { type: DataTypes.STRING, allowNull: true, unique: true },
  organizationId: { type: DataTypes.STRING, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
  emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  onboardingCompleted: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: true },
  onboardingCompletedAt: { type: DataTypes.DATE, allowNull: true },
  onboardingSkipped: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: true },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true }
};

const taskAttributes = {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  goalId: { type: DataTypes.UUID, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  dueDate: { type: DataTypes.DATE, allowNull: true },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium', allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'), defaultValue: 'pending', allowNull: false },
  category: { type: DataTypes.STRING, allowNull: true },
  tags: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  estimatedTime: { type: DataTypes.INTEGER, allowNull: true },
  actualTime: { type: DataTypes.INTEGER, allowNull: true },
  isRecurring: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  recurringPattern: { type: DataTypes.JSON, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true }
};

Goal.init(goalAttributes, { 
  sequelize, 
  modelName: 'Goal', 
  tableName: 'goals',
  timestamps: true 
});

User.init(userAttributes, { 
  sequelize, 
  modelName: 'User', 
  tableName: 'users',
  timestamps: true 
});

Task.init(taskAttributes, { 
  sequelize, 
  modelName: 'Task', 
  tableName: 'tasks',
  timestamps: true 
});

// Set up associations
Goal.associate({ User, Task });
User.associate({ Goal, Task });
Task.associate({ Goal, User });

// Sync all models with the database
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

export { sequelize };