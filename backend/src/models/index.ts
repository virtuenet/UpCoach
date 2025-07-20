import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Sequelize with PostgreSQL connection
export const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://localhost:5432/upcoach',
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Import models
export { Experiment } from './experiments/Experiment';
export { ExperimentAssignment } from './experiments/ExperimentAssignment';
export { ExperimentEvent } from './experiments/ExperimentEvent';
export { PersonalityProfile } from './personality/PersonalityProfile';
export { Avatar } from './personality/Avatar';
export { UserAvatarPreference } from './personality/UserAvatarPreference';
export { CoachMemory } from './coaching/CoachMemory';
export { UserAnalytics } from './analytics/UserAnalytics';
export { KpiTracker } from './analytics/KpiTracker';

// Financial models
export { Transaction } from './financial/Transaction';
export { Subscription } from './financial/Subscription';
export { CostTracking } from './financial/CostTracking';
export { FinancialSnapshot } from './financial/FinancialSnapshot';
export { RevenueAnalytics } from './financial/RevenueAnalytics';
export { BillingEvent } from './financial/BillingEvent';
export { FinancialReport } from './financial/FinancialReport';

// CMS models
export { Article } from './cms/Article';
export { Course } from './cms/Course';
export { Category } from './cms/Category';
export { Media } from './cms/Media';
export { ContentAnalytics } from './cms/ContentAnalytics';

// Define associations
export function defineAssociations() {
  // Import models for associations
  const { Transaction, Subscription, BillingEvent, Article, Course, Category, Media, ContentAnalytics } = sequelize.models;
  
  // Financial associations
  if (Transaction && Subscription) {
    Transaction.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });
    Subscription.hasMany(Transaction, { foreignKey: 'subscriptionId', as: 'transactions' });
  }
  
  if (BillingEvent) {
    BillingEvent.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });
    BillingEvent.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });
  }
  
  // CMS associations
  if (Article && Category) {
    Article.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
    Category.hasMany(Article, { foreignKey: 'categoryId', as: 'articles' });
  }
  
  if (Course && Category) {
    Course.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
    Category.hasMany(Course, { foreignKey: 'categoryId', as: 'courses' });
  }
  
  if (Category) {
    Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });
    Category.hasMany(Category, { foreignKey: 'parentId', as: 'children' });
  }
  
  if (ContentAnalytics && Article && Course) {
    // ContentAnalytics polymorphic associations would be handled in queries
  }
}

// Initialize database
export async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Define associations
    defineAssociations();
    
    // Sync models with database
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
} 