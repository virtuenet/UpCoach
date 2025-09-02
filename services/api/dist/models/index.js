"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOC2Control = exports.PHIAccessLog = exports.AIFeedback = exports.AIInteraction = exports.UserProfile = exports.Template = exports.ContentMedia = exports.ContentTag = exports.ContentCategory = exports.Content = exports.ContentAnalytics = exports.Media = exports.Category = exports.Course = exports.Article = exports.KpiTracker = exports.UserAnalytics = exports.CoachMemory = exports.UserAvatarPreference = exports.Avatar = exports.PersonalityProfile = exports.ExperimentEvent = exports.ExperimentAssignment = exports.Experiment = exports.RevenueAnalytics = exports.ReportFormat = exports.ReportStatus = exports.ReportType = exports.FinancialReport = exports.BillingEventSource = exports.BillingEventType = exports.BillingEvent = exports.SnapshotPeriod = exports.FinancialSnapshot = exports.CostTracking = exports.BillingInterval = exports.SubscriptionPlan = exports.SubscriptionStatus = exports.Subscription = exports.PaymentMethod = exports.TransactionType = exports.TransactionStatus = exports.Transaction = exports.ChatMessage = exports.Chat = exports.Mood = exports.Task = exports.Goal = exports.User = exports.sequelize = void 0;
exports.SystemMetrics = exports.SOC2Audit = exports.SOC2Assessment = exports.SOC2Incident = void 0;
exports.defineAssociations = defineAssociations;
exports.initializeDatabase = initializeDatabase;
const logger_1 = require("../utils/logger");
const sequelize_1 = require("../config/sequelize");
Object.defineProperty(exports, "sequelize", { enumerable: true, get: function () { return sequelize_1.sequelize; } });
const User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
const Goal_1 = require("./Goal");
Object.defineProperty(exports, "Goal", { enumerable: true, get: function () { return Goal_1.Goal; } });
const Task_1 = require("./Task");
Object.defineProperty(exports, "Task", { enumerable: true, get: function () { return Task_1.Task; } });
const Mood_1 = require("./Mood");
Object.defineProperty(exports, "Mood", { enumerable: true, get: function () { return Mood_1.Mood; } });
const Chat_1 = require("./Chat");
Object.defineProperty(exports, "Chat", { enumerable: true, get: function () { return Chat_1.Chat; } });
const ChatMessage_1 = require("./ChatMessage");
Object.defineProperty(exports, "ChatMessage", { enumerable: true, get: function () { return ChatMessage_1.ChatMessage; } });
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
const Transaction_1 = require("./financial/Transaction");
Object.defineProperty(exports, "Transaction", { enumerable: true, get: function () { return Transaction_1.Transaction; } });
Object.defineProperty(exports, "TransactionStatus", { enumerable: true, get: function () { return Transaction_1.TransactionStatus; } });
Object.defineProperty(exports, "TransactionType", { enumerable: true, get: function () { return Transaction_1.TransactionType; } });
Object.defineProperty(exports, "PaymentMethod", { enumerable: true, get: function () { return Transaction_1.PaymentMethod; } });
const Subscription_1 = require("./financial/Subscription");
Object.defineProperty(exports, "Subscription", { enumerable: true, get: function () { return Subscription_1.Subscription; } });
Object.defineProperty(exports, "SubscriptionStatus", { enumerable: true, get: function () { return Subscription_1.SubscriptionStatus; } });
Object.defineProperty(exports, "SubscriptionPlan", { enumerable: true, get: function () { return Subscription_1.SubscriptionPlan; } });
Object.defineProperty(exports, "BillingInterval", { enumerable: true, get: function () { return Subscription_1.BillingInterval; } });
const CostTracking_1 = require("./financial/CostTracking");
Object.defineProperty(exports, "CostTracking", { enumerable: true, get: function () { return CostTracking_1.CostTracking; } });
const FinancialSnapshot_1 = require("./financial/FinancialSnapshot");
Object.defineProperty(exports, "FinancialSnapshot", { enumerable: true, get: function () { return FinancialSnapshot_1.FinancialSnapshot; } });
Object.defineProperty(exports, "SnapshotPeriod", { enumerable: true, get: function () { return FinancialSnapshot_1.SnapshotPeriod; } });
const BillingEvent_1 = require("./financial/BillingEvent");
Object.defineProperty(exports, "BillingEvent", { enumerable: true, get: function () { return BillingEvent_1.BillingEvent; } });
Object.defineProperty(exports, "BillingEventType", { enumerable: true, get: function () { return BillingEvent_1.BillingEventType; } });
Object.defineProperty(exports, "BillingEventSource", { enumerable: true, get: function () { return BillingEvent_1.BillingEventSource; } });
const FinancialReport_1 = require("./financial/FinancialReport");
Object.defineProperty(exports, "FinancialReport", { enumerable: true, get: function () { return FinancialReport_1.FinancialReport; } });
Object.defineProperty(exports, "ReportType", { enumerable: true, get: function () { return FinancialReport_1.ReportType; } });
Object.defineProperty(exports, "ReportStatus", { enumerable: true, get: function () { return FinancialReport_1.ReportStatus; } });
Object.defineProperty(exports, "ReportFormat", { enumerable: true, get: function () { return FinancialReport_1.ReportFormat; } });
const RevenueAnalytics_1 = require("./financial/RevenueAnalytics");
Object.defineProperty(exports, "RevenueAnalytics", { enumerable: true, get: function () { return RevenueAnalytics_1.RevenueAnalytics; } });
var Experiment_1 = require("./experiments/Experiment");
Object.defineProperty(exports, "Experiment", { enumerable: true, get: function () { return Experiment_1.Experiment; } });
var ExperimentAssignment_1 = require("./experiments/ExperimentAssignment");
Object.defineProperty(exports, "ExperimentAssignment", { enumerable: true, get: function () { return ExperimentAssignment_1.ExperimentAssignment; } });
var ExperimentEvent_1 = require("./experiments/ExperimentEvent");
Object.defineProperty(exports, "ExperimentEvent", { enumerable: true, get: function () { return ExperimentEvent_1.ExperimentEvent; } });
var PersonalityProfile_1 = require("./personality/PersonalityProfile");
Object.defineProperty(exports, "PersonalityProfile", { enumerable: true, get: function () { return PersonalityProfile_1.PersonalityProfile; } });
var Avatar_1 = require("./personality/Avatar");
Object.defineProperty(exports, "Avatar", { enumerable: true, get: function () { return Avatar_1.Avatar; } });
var UserAvatarPreference_1 = require("./personality/UserAvatarPreference");
Object.defineProperty(exports, "UserAvatarPreference", { enumerable: true, get: function () { return UserAvatarPreference_1.UserAvatarPreference; } });
var CoachMemory_1 = require("./coaching/CoachMemory");
Object.defineProperty(exports, "CoachMemory", { enumerable: true, get: function () { return CoachMemory_1.CoachMemory; } });
var UserAnalytics_1 = require("./analytics/UserAnalytics");
Object.defineProperty(exports, "UserAnalytics", { enumerable: true, get: function () { return UserAnalytics_1.UserAnalytics; } });
var KpiTracker_1 = require("./analytics/KpiTracker");
Object.defineProperty(exports, "KpiTracker", { enumerable: true, get: function () { return KpiTracker_1.KpiTracker; } });
// CMS models
var Article_1 = require("./cms/Article");
Object.defineProperty(exports, "Article", { enumerable: true, get: function () { return Article_1.Article; } });
var Course_1 = require("./cms/Course");
Object.defineProperty(exports, "Course", { enumerable: true, get: function () { return Course_1.Course; } });
var Category_1 = require("./cms/Category");
Object.defineProperty(exports, "Category", { enumerable: true, get: function () { return Category_1.Category; } });
var Media_1 = require("./cms/Media");
Object.defineProperty(exports, "Media", { enumerable: true, get: function () { return Media_1.Media; } });
var ContentAnalytics_1 = require("./cms/ContentAnalytics");
Object.defineProperty(exports, "ContentAnalytics", { enumerable: true, get: function () { return ContentAnalytics_1.ContentAnalytics; } });
var Content_1 = require("./cms/Content");
Object.defineProperty(exports, "Content", { enumerable: true, get: function () { return Content_1.Content; } });
var ContentCategory_1 = require("./cms/ContentCategory");
Object.defineProperty(exports, "ContentCategory", { enumerable: true, get: function () { return ContentCategory_1.ContentCategory; } });
var ContentTag_1 = require("./cms/ContentTag");
Object.defineProperty(exports, "ContentTag", { enumerable: true, get: function () { return ContentTag_1.ContentTag; } });
var ContentMedia_1 = require("./cms/ContentMedia");
Object.defineProperty(exports, "ContentMedia", { enumerable: true, get: function () { return ContentMedia_1.ContentMedia; } });
var Template_1 = require("./cms/Template");
Object.defineProperty(exports, "Template", { enumerable: true, get: function () { return Template_1.Template; } });
// AI models
var UserProfile_1 = require("./UserProfile");
Object.defineProperty(exports, "UserProfile", { enumerable: true, get: function () { return UserProfile_1.UserProfile; } });
var AIInteraction_1 = require("./AIInteraction");
Object.defineProperty(exports, "AIInteraction", { enumerable: true, get: function () { return AIInteraction_1.AIInteraction; } });
var AIFeedback_1 = require("./AIFeedback");
Object.defineProperty(exports, "AIFeedback", { enumerable: true, get: function () { return AIFeedback_1.AIFeedback; } });
// Compliance models
var PHIAccessLog_1 = require("./compliance/PHIAccessLog");
Object.defineProperty(exports, "PHIAccessLog", { enumerable: true, get: function () { return PHIAccessLog_1.PHIAccessLog; } });
var SOC2Control_1 = require("./compliance/SOC2Control");
Object.defineProperty(exports, "SOC2Control", { enumerable: true, get: function () { return SOC2Control_1.SOC2Control; } });
var SOC2Incident_1 = require("./compliance/SOC2Incident");
Object.defineProperty(exports, "SOC2Incident", { enumerable: true, get: function () { return SOC2Incident_1.SOC2Incident; } });
var SOC2Assessment_1 = require("./compliance/SOC2Assessment");
Object.defineProperty(exports, "SOC2Assessment", { enumerable: true, get: function () { return SOC2Assessment_1.SOC2Assessment; } });
var SOC2Audit_1 = require("./compliance/SOC2Audit");
Object.defineProperty(exports, "SOC2Audit", { enumerable: true, get: function () { return SOC2Audit_1.SOC2Audit; } });
var SystemMetrics_1 = require("./compliance/SystemMetrics");
Object.defineProperty(exports, "SystemMetrics", { enumerable: true, get: function () { return SystemMetrics_1.SystemMetrics; } });
// Define associations
function defineAssociations() {
    // Import models for associations
    const { Transaction, Subscription, BillingEvent, Article, Course, Category, ContentAnalytics } = sequelize_1.sequelize.models;
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
async function initializeDatabase() {
    try {
        await sequelize_1.sequelize.authenticate();
        logger_1.logger.info('Database connection established successfully.');
        // Define associations
        defineAssociations();
        // Sync models with database - temporarily disabled for debugging
        // if (process.env.NODE_ENV !== 'production') {
        //   await sequelize.sync({ alter: true });
        //   logger.info('Database models synchronized.');
        // }
        logger_1.logger.info('Database sync disabled for debugging.');
    }
    catch (error) {
        logger_1.logger.error('Unable to connect to the database:', error);
        throw error;
    }
}
//# sourceMappingURL=index.js.map