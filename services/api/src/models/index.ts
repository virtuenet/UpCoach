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
import { SubscriptionTier } from './financial/SubscriptionTier';
import { TierPricing, BillingInterval as TierBillingInterval } from './financial/TierPricing';
import { TierAuditLog, AuditEntityType, AuditAction } from './financial/TierAuditLog';
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
  // Tier Management Models
  SubscriptionTier,
  TierPricing,
  TierBillingInterval,
  TierAuditLog,
  AuditEntityType,
  AuditAction,
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

// Note: Model associations and initialization are handled by modelInitializer.ts
// Use config/database.ts::initializeDatabase() to initialize the database and models
