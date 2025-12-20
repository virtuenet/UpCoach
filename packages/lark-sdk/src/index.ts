/**
 * @upcoach/lark-sdk
 * Lark Suite SDK for UpCoach - Bot commands, notifications, webhooks, and more
 */

// Client
export { LarkClient } from './client';

// Bot
export { UpCoachBot } from './bot';
export type {
  UpCoachBotConfig,
  SystemHealth,
  CoachOverview,
  SessionOverview,
  ClientOverview,
  AlertSummary,
  RevenueSummary,
  DataFetcher,
} from './bot';

// Notifications
export { NotificationPublisher } from './notifications';
export type {
  NotificationConfig,
  NotificationLevel,
  NotificationCategory,
  NotificationPayload,
  BillingAlertPayload,
  CoachingEventPayload,
  SecurityAlertPayload,
  MLAlertPayload,
} from './notifications';

// Webhooks
export { LarkWebhookHandler } from './webhooks';
export type {
  EventHandler,
  WebhookHandlerConfig,
  WebhookRequest,
  WebhookResponse,
} from './webhooks';

// Bitable (Base)
export { BitableService } from './bitable';
export type {
  CoachPipelineRecord,
  CoachPipelineSchema,
  SupportTicketRecord,
  SupportTicketSchema,
  CoachPayoutRecord,
  CoachPayoutSchema,
  SessionTrackingRecord,
  ActivityLogRecord,
  LarkBaseConfig,
  SyncResult,
  SyncError,
  SyncMapping,
  ConflictResolution,
  BitableFilter,
  BitableSort,
  BitableCondition,
} from './bitable';

// Sync Engine
export { SyncEngine } from './sync';
export type {
  SyncEngineConfig,
  ConflictInfo,
  SyncState,
  DataProvider,
  CoachData,
  TicketData,
  PayoutData,
} from './sync';

// Task Automation
export { TaskAutomation } from './tasks';
export type {
  TaskConfig,
  LarkTask,
  TaskCreationResult,
  EventPayload,
  CoachSignupEvent,
  ClientComplaintEvent,
  SessionNoShowEvent,
  SubscriptionCancellationEvent,
  PayoutPendingEvent,
  MilestoneReachedEvent,
  GoalAchievedEvent,
} from './tasks';

// Approval Workflows
export { ApprovalWorkflow } from './approvals';
export type {
  ApprovalConfig,
  PayoutApprovalTier,
  RefundApprovalTier,
  ApprovalRequest,
  ApprovalInstance,
  ApprovalTimeline,
  PayoutApprovalData,
  RefundApprovalData,
  ApprovalResult,
  ApprovalStatusResult,
} from './approvals';

// Types
export * from './types';
