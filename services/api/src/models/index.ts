import { sequelize } from '../config/sequelize';
import { logger } from '../utils/logger';

import { Chat } from './Chat';
import { ChatMessage } from './ChatMessage';
// import { PersonalityProfile } from './personality/PersonalityProfile';
// import { Avatar } from './personality/Avatar';
// import { UserAvatarPreference } from './personality/UserAvatarPreference';
// import { KpiTracker } from './analytics/KpiTracker';
// import { UserAnalytics } from './analytics/UserAnalytics';
// import { CoachMemory } from './coaching/CoachMemory';
// import { Article } from './cms/Article';
// import { Category } from './cms/Category';
// import { Comment } from './cms/Comment';
// import { ContentAnalytics } from './cms/ContentAnalytics';
// import { Course } from './cms/Course';
// import { Media } from './cms/Media';
// import { Template } from './cms/Template';
// import { Content } from './cms/Content';
// import { ContentCategory } from './cms/ContentCategory';
// import { ContentTag } from './cms/ContentTag';
// import { ContentMedia } from './cms/ContentMedia';
// import { Experiment } from './experiments/Experiment';
// import { ExperimentAssignment } from './experiments/ExperimentAssignment';
// import { ExperimentEvent } from './experiments/ExperimentEvent';
import { BillingEvent, BillingEventType, BillingEventSource } from './financial/BillingEvent';
// ✅ FIXED: CostTracking converted to Model.init() pattern - no longer uses sequelize-typescript decorators
import { CostTracking } from './financial/CostTracking';
import {
  FinancialReport,
  ReportType,
  ReportStatus,
  ReportFormat,
} from './financial/FinancialReport';
// Temporarily commented out - will be initialized via modelInitializer.ts
// import { FinancialSnapshot, SnapshotPeriod } from './financial/FinancialSnapshot';
// import { RevenueAnalytics } from './financial/RevenueAnalytics';
import {
  Subscription,
  SubscriptionStatus,
  SubscriptionPlan,
  BillingInterval,
} from './financial/Subscription';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
} from './financial/Transaction';
import { Goal } from './Goal';
import { Mood } from './Mood';
import { Task } from './Task';
import { User } from './User';
import { UserActivity } from './UserActivity';
import { Organization } from './Organization';
import { OrganizationMember } from './OrganizationMember';
import { StreakGuardianLink } from './StreakGuardianLink';
// import { UserProfile } from './UserProfile';
// ✅ FIXED: AIInteraction converted to Model.init() pattern - no longer uses sequelize-typescript decorators
import { AIInteraction } from './AIInteraction';
// import { AIFeedback } from './AIFeedback';


// Export sequelize instance
export { sequelize };

// Import models
export {
  // Core Models
  User,
  UserActivity,
  Organization,
  OrganizationMember,
  StreakGuardianLink,
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
  CostTracking, // ✅ FIXED: Now using Model.init() pattern
  // FinancialSnapshot, // Temporarily commented - initialized via modelInitializer.ts
  // SnapshotPeriod,
  BillingEvent,
  BillingEventType,
  BillingEventSource,
  AIInteraction, // ✅ FIXED: Now using Model.init() pattern
  FinancialReport,
  ReportType,
  ReportStatus,
  ReportFormat,
  // RevenueAnalytics, // Temporarily commented - initialized via modelInitializer.ts
};
export { Experiment } from './experiments/Experiment';
// export { ExperimentAssignment } from './experiments/ExperimentAssignment';
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
export {
  LandingSection,
  LandingCtaBlock,
  LandingPricingTier,
  LandingTestimonialCard,
  RemoteCopyEntry,
} from './cms/LandingBlocks';

// AI models
export { UserProfile } from './UserProfile';
export { AIInteraction } from './AIInteraction';
export { AIFeedback } from './AIFeedback';

// Compliance models
export { PHIAccessLog } from './compliance/PHIAccessLog';
export { SOC2Control } from './compliance/SOC2Control';
export { SOC2Incident } from './compliance/SOC2Incident';
export { SOC2Assessment } from './compliance/SOC2Assessment';
export { SOC2Audit } from './compliance/SOC2Audit';
export { SystemMetrics } from './compliance/SystemMetrics';

// Define associations
export function defineAssociations() {
  // Import models for associations
  const {
    Transaction,
    Subscription,
    BillingEvent,
    Article,
    Course,
    Category,
    ContentAnalytics,
    User,
    UserActivity,
    Organization,
    OrganizationMember
  } = sequelize.models;

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

  // User activity associations
  if (User && UserActivity) {
    User.hasMany(UserActivity, { foreignKey: 'userId', as: 'activities' });
    UserActivity.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }

  if (User && StreakGuardianLink) {
    User.hasMany(StreakGuardianLink, { foreignKey: 'ownerUserId', as: 'streakGuardians' });
    User.hasMany(StreakGuardianLink, { foreignKey: 'guardianUserId', as: 'guardianOf' });
    StreakGuardianLink.belongsTo(User, { foreignKey: 'ownerUserId', as: 'owner' });
    StreakGuardianLink.belongsTo(User, { foreignKey: 'guardianUserId', as: 'guardian' });
  }

  // Subscription associations
  if (User && Subscription) {
    User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
    Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }

  // Organization and membership associations
  if (User && Organization && OrganizationMember) {
    // Organization -> User (owner)
    Organization.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
    User.hasMany(Organization, { foreignKey: 'ownerId', as: 'ownedOrganizations' });

    // OrganizationMember associations
    OrganizationMember.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
    OrganizationMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    OrganizationMember.belongsTo(User, { foreignKey: 'invitedBy', as: 'inviter' });

    Organization.hasMany(OrganizationMember, { foreignKey: 'organizationId', as: 'memberships' });
    User.hasMany(OrganizationMember, { foreignKey: 'userId', as: 'organizationMemberships' });
    User.hasMany(OrganizationMember, { foreignKey: 'invitedBy', as: 'invitedMemberships' });
  }
}

// Initialize database
export async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Define associations
    defineAssociations();

    // Database sync strategy based on environment
    const syncMode = process.env.DB_SYNC_MODE || 'none';
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      // In production, never auto-sync - use migrations instead
      logger.info('Production mode: Database sync disabled. Use migrations for schema changes.');
    } else if (syncMode === 'alter') {
      // Development: alter tables to match models (safe, preserves data)
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized with alter mode.');
    } else if (syncMode === 'force') {
      // Test only: drop and recreate tables (destroys data!)
      if (process.env.NODE_ENV === 'test') {
        await sequelize.sync({ force: true });
        logger.info('Database models synchronized with force mode (test environment).');
      } else {
        logger.warn('Force sync requested but not in test environment - ignoring.');
      }
    } else {
      // Default: no sync, rely on migrations
      logger.info('Database sync disabled. Set DB_SYNC_MODE=alter for development auto-sync.');
    }
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
}
