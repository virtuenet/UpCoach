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

  // Define associations after all models are initialized
  logger.info('Defining model associations...');
  defineAssociations(sequelize);
  logger.info('Model associations defined successfully.');
}

/**
 * Define associations between models
 * Called after all models are initialized
 */
function defineAssociations(sequelize: Sequelize): void {
  const models = sequelize.models;

  // User associations
  if (models.User && models.UserProfile) {
    models.User.hasOne(models.UserProfile, { foreignKey: 'userId', as: 'profile' });
    models.UserProfile.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }

  if (models.User && models.Goal) {
    models.User.hasMany(models.Goal, { foreignKey: 'userId', as: 'goals' });
    models.Goal.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }

  if (models.User && models.Task) {
    models.User.hasMany(models.Task, { foreignKey: 'userId', as: 'tasks' });
    models.Task.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }

  if (models.User && models.Mood) {
    models.User.hasMany(models.Mood, { foreignKey: 'userId', as: 'moods' });
    models.Mood.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }

  if (models.User && models.Chat) {
    models.User.hasMany(models.Chat, { foreignKey: 'userId', as: 'chats' });
    models.Chat.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }

  // Chat and ChatMessage associations
  if (models.Chat && models.ChatMessage) {
    models.Chat.hasMany(models.ChatMessage, { foreignKey: 'chatId', as: 'messages' });
    models.ChatMessage.belongsTo(models.Chat, { foreignKey: 'chatId', as: 'chat' });
  }

  // Goal and Task associations
  if (models.Goal && models.Task) {
    models.Goal.hasMany(models.Task, { foreignKey: 'goalId', as: 'tasks' });
    models.Task.belongsTo(models.Goal, { foreignKey: 'goalId', as: 'goal' });
  }

  // AI associations
  if (models.User && models.AIInteraction) {
    models.User.hasMany(models.AIInteraction, { foreignKey: 'userId', as: 'aiInteractions' });
    models.AIInteraction.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }

  if (models.User && models.AIFeedback) {
    models.User.hasMany(models.AIFeedback, { foreignKey: 'userId', as: 'aiFeedbacks' });
    models.AIFeedback.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }

  // Coaching associations
  if (models.User && models.CoachProfile) {
    models.User.hasOne(models.CoachProfile, { foreignKey: 'userId', as: 'coachProfile' });
    models.CoachProfile.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }

  if (models.CoachProfile && models.CoachPackage) {
    models.CoachProfile.hasMany(models.CoachPackage, { foreignKey: 'coachId', as: 'packages' });
    models.CoachPackage.belongsTo(models.CoachProfile, { foreignKey: 'coachId', as: 'coach' });
  }

  if (models.CoachProfile && models.CoachReview) {
    models.CoachProfile.hasMany(models.CoachReview, { foreignKey: 'coachId', as: 'reviews' });
    models.CoachReview.belongsTo(models.CoachProfile, { foreignKey: 'coachId', as: 'coach' });
  }

  if (models.CoachProfile && models.CoachSession) {
    models.CoachProfile.hasMany(models.CoachSession, { foreignKey: 'coachId', as: 'sessions' });
    models.CoachSession.belongsTo(models.CoachProfile, { foreignKey: 'coachId', as: 'coach' });
  }

  // Forum/Community associations
  if (models.ForumCategory && models.ForumThread) {
    models.ForumCategory.hasMany(models.ForumThread, { foreignKey: 'categoryId', as: 'threads' });
    models.ForumThread.belongsTo(models.ForumCategory, { foreignKey: 'categoryId', as: 'category' });
  }

  if (models.ForumThread && models.ForumPost) {
    models.ForumThread.hasMany(models.ForumPost, { foreignKey: 'threadId', as: 'posts' });
    models.ForumPost.belongsTo(models.ForumThread, { foreignKey: 'threadId', as: 'thread' });
  }

  if (models.ForumPost && models.ForumVote) {
    models.ForumPost.hasMany(models.ForumVote, { foreignKey: 'postId', as: 'votes' });
    models.ForumVote.belongsTo(models.ForumPost, { foreignKey: 'postId', as: 'post' });
  }

  if (models.User && models.ForumThread) {
    models.User.hasMany(models.ForumThread, { foreignKey: 'userId', as: 'forumThreads' });
    models.ForumThread.belongsTo(models.User, { foreignKey: 'userId', as: 'author' });
  }

  if (models.User && models.ForumPost) {
    models.User.hasMany(models.ForumPost, { foreignKey: 'userId', as: 'forumPosts' });
    models.ForumPost.belongsTo(models.User, { foreignKey: 'userId', as: 'author' });
  }

  // Content associations
  if (models.ContentArticle && models.ContentComment) {
    models.ContentArticle.hasMany(models.ContentComment, { foreignKey: 'articleId', as: 'comments' });
    models.ContentComment.belongsTo(models.ContentArticle, { foreignKey: 'articleId', as: 'article' });
  }

  if (models.ContentArticle && models.ContentVersion) {
    models.ContentArticle.hasMany(models.ContentVersion, { foreignKey: 'articleId', as: 'versions' });
    models.ContentVersion.belongsTo(models.ContentArticle, { foreignKey: 'articleId', as: 'article' });
  }

  // Experiment associations
  if (models.ExperimentEvent && models.ExperimentAssignment) {
    models.ExperimentAssignment.hasMany(models.ExperimentEvent, { foreignKey: 'assignmentId', as: 'events' });
    models.ExperimentEvent.belongsTo(models.ExperimentAssignment, { foreignKey: 'assignmentId', as: 'assignment' });
  }

  logger.debug('All model associations defined');
}