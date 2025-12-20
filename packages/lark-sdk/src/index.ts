/**
 * @upcoach/lark-sdk
 * Lark Suite SDK for UpCoach - Bot commands, notifications, and webhooks
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

// Types
export * from './types';
