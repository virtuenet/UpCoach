import cron from 'node-cron';
import { pushNotificationService } from './PushNotificationService';
import {
  notificationTemplates,
  NotificationType,
  TemplateData,
} from './NotificationTemplateService';
import { logger } from '../../utils/logger';

/**
 * Notification Scheduler Service
 * Handles scheduled notifications using cron jobs
 */

export interface ScheduledNotification {
  id: string;
  userId: string;
  type: NotificationType;
  data: TemplateData;
  cronExpression: string;
  deviceTokens: string[];
  enabled: boolean;
  createdAt: Date;
  lastSentAt?: Date;
}

export class NotificationScheduler {
  private static instance: NotificationScheduler;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  private constructor() {
    logger.info('Notification Scheduler initialized');
  }

  public static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  /**
   * Schedule a recurring notification
   * @param notification - Scheduled notification configuration
   * @returns Job ID
   */
  scheduleNotification(notification: ScheduledNotification): string {
    try {
      // Validate cron expression
      if (!cron.validate(notification.cronExpression)) {
        throw new Error(`Invalid cron expression: ${notification.cronExpression}`);
      }

      // Cancel existing job if it exists
      if (this.scheduledJobs.has(notification.id)) {
        this.cancelNotification(notification.id);
      }

      // Create cron job
      const job = cron.schedule(
        notification.cronExpression,
        async () => {
          await this.sendScheduledNotification(notification);
        },
        {
          scheduled: notification.enabled,
        }
      );

      this.scheduledJobs.set(notification.id, job);

      logger.info(
        `Scheduled notification ${notification.id} for user ${notification.userId} with cron: ${notification.cronExpression}`
      );
      return notification.id;
    } catch (error) {
      logger.error(`Failed to schedule notification ${notification.id}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  cancelNotification(notificationId: string): boolean {
    const job = this.scheduledJobs.get(notificationId);
    if (job) {
      job.stop();
      this.scheduledJobs.delete(notificationId);
      logger.info(`Cancelled scheduled notification: ${notificationId}`);
      return true;
    }
    return false;
  }

  /**
   * Pause a scheduled notification
   */
  pauseNotification(notificationId: string): boolean {
    const job = this.scheduledJobs.get(notificationId);
    if (job) {
      job.stop();
      logger.info(`Paused scheduled notification: ${notificationId}`);
      return true;
    }
    return false;
  }

  /**
   * Resume a paused notification
   */
  resumeNotification(notificationId: string): boolean {
    const job = this.scheduledJobs.get(notificationId);
    if (job) {
      job.start();
      logger.info(`Resumed scheduled notification: ${notificationId}`);
      return true;
    }
    return false;
  }

  /**
   * Send a one-time notification at a specific time
   */
  scheduleOneTimeNotification(
    userId: string,
    type: NotificationType,
    data: TemplateData,
    deviceTokens: string[],
    sendAt: Date
  ): string {
    const notificationId = `one-time-${userId}-${type}-${Date.now()}`;
    const delay = sendAt.getTime() - Date.now();

    if (delay <= 0) {
      logger.warn(
        `Send time is in the past for notification ${notificationId}, sending immediately`
      );
      this.sendImmediateNotification(userId, type, data, deviceTokens);
      return notificationId;
    }

    const timeout = setTimeout(async () => {
      await this.sendImmediateNotification(userId, type, data, deviceTokens);
      this.scheduledJobs.delete(notificationId);
    }, delay);

    // Store timeout as a "fake" cron job for consistent management
    this.scheduledJobs.set(notificationId, {
      stop: () => clearTimeout(timeout),
      start: () => {},
      destroy: () => clearTimeout(timeout),
    } as any);

    logger.info(`Scheduled one-time notification ${notificationId} for ${sendAt.toISOString()}`);
    return notificationId;
  }

  /**
   * Send notification immediately
   */
  private async sendImmediateNotification(
    userId: string,
    type: NotificationType,
    data: TemplateData,
    deviceTokens: string[]
  ): Promise<void> {
    try {
      // Validate template data
      if (!notificationTemplates.validateTemplateData(type, data)) {
        throw new Error(`Invalid template data for ${type}`);
      }

      const payload = notificationTemplates.getTemplate(type, data);

      if (deviceTokens.length === 1) {
        await pushNotificationService.sendToToken(deviceTokens[0], payload);
      } else {
        const result = await pushNotificationService.sendToTokens(deviceTokens, payload);

        // Handle invalid tokens (should be removed from database in production)
        if (result.invalidTokens.length > 0) {
          logger.warn(`Found ${result.invalidTokens.length} invalid tokens for user ${userId}`);
          // In production, trigger a database cleanup job here
        }
      }

      logger.info(`Sent immediate notification to user ${userId}, type: ${type}`);
    } catch (error) {
      logger.error(`Failed to send immediate notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Internal method to send scheduled notification
   */
  private async sendScheduledNotification(notification: ScheduledNotification): Promise<void> {
    try {
      // Validate template data
      if (!notificationTemplates.validateTemplateData(notification.type, notification.data)) {
        logger.error(`Invalid template data for scheduled notification ${notification.id}`);
        return;
      }

      const payload = notificationTemplates.getTemplate(notification.type, notification.data);

      if (notification.deviceTokens.length === 0) {
        logger.warn(`No device tokens for scheduled notification ${notification.id}`);
        return;
      }

      if (notification.deviceTokens.length === 1) {
        await pushNotificationService.sendToToken(notification.deviceTokens[0], payload);
      } else {
        const result = await pushNotificationService.sendToTokens(
          notification.deviceTokens,
          payload
        );

        // Handle invalid tokens
        if (result.invalidTokens.length > 0) {
          logger.warn(
            `Found ${result.invalidTokens.length} invalid tokens for notification ${notification.id}`
          );
          // In production, trigger a database cleanup job here
        }
      }

      logger.info(`Sent scheduled notification ${notification.id} to user ${notification.userId}`);
    } catch (error) {
      logger.error(`Failed to send scheduled notification ${notification.id}:`, error);
    }
  }

  /**
   * Get all active scheduled jobs
   */
  getActiveJobs(): string[] {
    return Array.from(this.scheduledJobs.keys());
  }

  /**
   * Clear all scheduled jobs
   */
  clearAll(): void {
    this.scheduledJobs.forEach((job, id) => {
      job.stop();
      logger.info(`Stopped job: ${id}`);
    });
    this.scheduledJobs.clear();
    logger.info('Cleared all scheduled notifications');
  }

  /**
   * Common cron expressions for convenience
   */
  static readonly CRON_EXPRESSIONS = {
    EVERY_MINUTE: '* * * * *',
    EVERY_5_MINUTES: '*/5 * * * *',
    EVERY_15_MINUTES: '*/15 * * * *',
    EVERY_30_MINUTES: '*/30 * * * *',
    EVERY_HOUR: '0 * * * *',
    DAILY_AT_9AM: '0 9 * * *',
    DAILY_AT_12PM: '0 12 * * *',
    DAILY_AT_6PM: '0 18 * * *',
    DAILY_AT_9PM: '0 21 * * *',
    WEEKDAYS_AT_9AM: '0 9 * * 1-5',
    WEEKENDS_AT_10AM: '0 10 * * 0,6',
    MONDAYS_AT_9AM: '0 9 * * 1',
    FIRST_OF_MONTH: '0 9 1 * *',
  };
}

// Export singleton instance
export const notificationScheduler = NotificationScheduler.getInstance();
