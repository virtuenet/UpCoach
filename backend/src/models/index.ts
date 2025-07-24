import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { User } from './User';
import { Goal } from './Goal';
import { Task } from './Task';
import { Mood } from './Mood';
import { Chat } from './Chat';
import { ChatMessage } from './ChatMessage';
import { PersonalityProfile } from './personality/PersonalityProfile';
import { Avatar } from './personality/Avatar';
import { UserAvatarPreference } from './personality/UserAvatarPreference';
import { KpiTracker } from './analytics/KpiTracker';
import { UserAnalytics } from './analytics/UserAnalytics';
import { CoachMemory } from './coaching/CoachMemory';
import { Article } from './cms/Article';
import { Category } from './cms/Category';
import { Comment } from './cms/Comment';
import { ContentAnalytics } from './cms/ContentAnalytics';
import { Course } from './cms/Course';
import { Media } from './cms/Media';
import { Template } from './cms/Template';
import { Content } from './cms/Content';
import { ContentCategory } from './cms/ContentCategory';
import { ContentTag } from './cms/ContentTag';
import { ContentMedia } from './cms/ContentMedia';
import { Experiment } from './experiments/Experiment';
import { ExperimentAssignment } from './experiments/ExperimentAssignment';
import { ExperimentEvent } from './experiments/ExperimentEvent';
import { 
  Transaction,
  TransactionStatus,
  TransactionType,
  PaymentMethod
} from './financial/Transaction';
import { 
  Subscription,
  SubscriptionStatus,
  SubscriptionPlan,
  BillingInterval
} from './financial/Subscription';
import { CostTracking } from './financial/CostTracking';
import { 
  FinancialSnapshot,
  SnapshotPeriod
} from './financial/FinancialSnapshot';
import { 
  BillingEvent,
  BillingEventType,
  BillingEventSource
} from './financial/BillingEvent';
import { 
  FinancialReport,
  ReportType,
  ReportStatus,
  ReportFormat
} from './financial/FinancialReport';
import { RevenueAnalytics } from './financial/RevenueAnalytics';

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
export {
  // Core Models
  User,
  Goal,
  Task,
  Mood,
  Chat,
  ChatMessage,
  // Financial Models
  Transaction,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
  Subscription,
  SubscriptionStatus,
  SubscriptionPlan,
  BillingInterval,
  CostTracking,
  FinancialSnapshot,
  SnapshotPeriod,
  BillingEvent,
  BillingEventType,
  BillingEventSource,
  FinancialReport,
  ReportType,
  ReportStatus,
  ReportFormat,
  RevenueAnalytics,
};
export { Experiment } from './experiments/Experiment';
export { ExperimentAssignment } from './experiments/ExperimentAssignment';
export { ExperimentEvent } from './experiments/ExperimentEvent';
export { PersonalityProfile } from './personality/PersonalityProfile';
export { Avatar } from './personality/Avatar';
export { UserAvatarPreference } from './personality/UserAvatarPreference';
export { CoachMemory } from './coaching/CoachMemory';
export { UserAnalytics } from './analytics/UserAnalytics';
export { KpiTracker } from './analytics/KpiTracker';

// CMS models
export { Article } from './cms/Article';
export { Course } from './cms/Course';
export { Category } from './cms/Category';
export { Media } from './cms/Media';
export { ContentAnalytics } from './cms/ContentAnalytics';
export { Content } from './cms/Content';
export { ContentCategory } from './cms/ContentCategory';
export { ContentTag } from './cms/ContentTag';
export { ContentMedia } from './cms/ContentMedia';
export { Template } from './cms/Template';

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