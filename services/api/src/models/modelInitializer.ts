import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';

// Import model classes (not instances) to avoid premature initialization
// Core models
import { User } from './User';
import { UserProfile } from './UserProfile';
import { Goal } from './Goal';
import { Task } from './Task';
import { Chat } from './Chat';
import { ChatMessage } from './ChatMessage';
import { Mood } from './Mood';
import AIInteraction from './AIInteraction';
import AIFeedback from './AIFeedback';
import CoachPackage, { ClientCoachPackage } from './CoachPackage';
import CoachProfile from './CoachProfile';
import CoachReview from './CoachReview';
import CoachSession from './CoachSession';
import Referral from './Referral';

// CMS models
import ContentVersion from './cms/ContentVersion';
import ContentArticle from './cms/ContentArticle';
import ContentComment from './cms/ContentComment';
import ContentInteraction from './cms/ContentInteraction';
import ContentSchedule from './cms/ContentSchedule';
import ContentTemplate from './cms/ContentTemplate';
import {
  LandingSection,
  LandingCtaBlock,
  LandingPricingTier,
  LandingTestimonialCard,
  LandingBlogCard,
  LandingComparisonTable,
  RemoteCopyEntry,
} from './cms/LandingBlocks';

// Financial models
import CostTracking from './financial/CostTracking';
import FinancialSnapshot from './financial/FinancialSnapshot';
import RevenueAnalytics from './financial/RevenueAnalytics';

// Experiments models
import { ExperimentEvent } from './experiments/ExperimentEvent';
import { ExperimentAssignment } from './experiments/ExperimentAssignment';

// Community models
import ForumCategory from './community/ForumCategory';
import ForumThread from './community/ForumThread';
import ForumPost from './community/ForumPost';
import ForumVote from './community/ForumVote';

/**
 * Initialize all models that require deferred initialization
 * This ensures models are initialized only after database connection is ready
 */
export async function initializeAllModels(sequelize: Sequelize): Promise<void> {
  logger.info('Initializing deferred models...');

  // Initialize models that were previously failing due to premature initialization
  // Models are initialized in dependency order where possible
  const modelsToInitialize = [
    // Core models - foundational models that others depend on
    User,
    UserProfile,
    Goal,
    Task,
    Chat,
    ChatMessage,
    Mood,
    Referral,

    // AI & Coaching models
    AIInteraction,
    AIFeedback,
    CoachPackage,
    ClientCoachPackage,
    CoachProfile,
    CoachReview,
    CoachSession,

    // CMS models
    ContentVersion,
    ContentArticle,
    ContentComment,
    ContentInteraction,
    ContentSchedule,
    ContentTemplate,
    LandingSection,
    LandingCtaBlock,
    LandingPricingTier,
    LandingTestimonialCard,
    LandingBlogCard,
    LandingComparisonTable,
    RemoteCopyEntry,

    // Financial models
    CostTracking,
    FinancialSnapshot,
    RevenueAnalytics,

    // Experiments models
    ExperimentEvent,
    ExperimentAssignment,

    // Community models
    ForumCategory,
    ForumThread,
    ForumPost,
    ForumVote,
  ];

  let initializedCount = 0;
  let failedCount = 0;

  for (const ModelClass of modelsToInitialize) {
    try {
      // Check if model is already initialized
      if (!sequelize.models[ModelClass.name]) {
        // Initialize the model if it has a manual init method
        if (typeof ModelClass.initializeModel === 'function') {
          await ModelClass.initializeModel(sequelize);
          logger.debug(`Initialized model: ${ModelClass.name}`);
          initializedCount++;
        } else {
          logger.debug(`Model ${ModelClass.name} is already initialized or doesn't need deferred initialization`);
        }
      } else {
        logger.debug(`Model ${ModelClass.name} is already initialized`);
        initializedCount++;
      }
    } catch (error) {
      logger.error(`Failed to initialize model ${ModelClass.name}:`, {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        error: error
      });
      failedCount++;
    }
  }

  logger.info(`Model initialization complete. Initialized: ${initializedCount}, Failed: ${failedCount}`);

  if (failedCount > 0) {
    throw new Error(`Failed to initialize ${failedCount} models`);
  }
}