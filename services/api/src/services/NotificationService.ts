import { EventEmitter } from 'events';

import { UserFriendlyError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

import { getCacheService } from './cache/UnifiedCacheService';
import emailService from './email/UnifiedEmailService';

export interface NotificationOptions {
  userId: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'progress';
  title: string;
  message: string;
  actions?: NotificationAction[];
  persistent?: boolean;
  duration?: number; // in milliseconds
  metadata?: Record<string, any>;
  timestamp?: string; // ISO string for when notification was sent
}

export interface NotificationAction {
  label: string;
  action: string;
  primary?: boolean;
  icon?: string;
}

export interface ProgressNotification {
  operationId: string;
  operation: string;
  progress: number; // 0-100
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  estimatedTimeRemaining?: number; // in seconds
}

export class NotificationService extends EventEmitter {
  private static instance: NotificationService;
  private progressTrackers: Map<string, ProgressNotification> = new Map();
  private cache = getCacheService();
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    super();
    this.setupCleanup();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Show a success notification
   */
  async showSuccess(userId: string, message: string, action?: () => void): Promise<void> {
    const notification: NotificationOptions = {
      userId,
      type: 'success',
      title: 'Success',
      message,
      duration: 5000,
    };

    if (action) {
      notification.actions = [{ label: 'View', action: 'view', primary: true }];
    }

    await this.send(notification);
  }

  /**
   * Show an error notification with retry option
   */
  async showError(userId: string, error: UserFriendlyError): Promise<void> {
    const notification: NotificationOptions = {
      userId,
      type: 'error',
      title: 'Action Required',
      message: error.userMessage,
      actions: [],
      persistent: !error.retryable,
    };

    // Add retry action if retryable
    if (error.retryable) {
      notification.actions!.push({
        label: 'Retry',
        action: 'retry',
        primary: true,
        icon: 'refresh',
      });
    }

    // Add help action if help URL is available
    if (error.helpUrl) {
      notification.actions!.push({
        label: 'Get Help',
        action: 'help',
        icon: 'help',
      });
    }

    // Always add dismiss action
    notification.actions!.push({
      label: 'Dismiss',
      action: 'dismiss',
      icon: 'close',
    });

    await this.send(notification);
  }

  /**
   * Show a progress notification
   */
  async showProgress(
    operationId: string,
    operation: string,
    progress: number,
    message?: string
  ): Promise<void> {
    const progressNotification: ProgressNotification = {
      operationId,
      operation,
      progress: Math.min(100, Math.max(0, progress)),
      message: message || `${operation}: ${progress}% complete`,
      status: progress === 100 ? 'completed' : 'in_progress',
    };

    // Store progress tracker
    this.progressTrackers.set(operationId, progressNotification);

    // Emit progress event
    this.emit('progress', progressNotification);

    // Store in cache for retrieval
    await this.cache.set(
      `progress:${operationId}`,
      progressNotification,
      { ttl: 300 } // 5 minutes TTL
    );

    // Clean up completed operations after delay
    if (progress === 100) {
      setTimeout(() => {
        this.progressTrackers.delete(operationId);
      }, 30000); // 30 seconds
    }
  }

  /**
   * Get progress for an operation
   */
  async getProgress(operationId: string): Promise<ProgressNotification | null> {
    // Check memory first
    if (this.progressTrackers.has(operationId)) {
      return this.progressTrackers.get(operationId)!;
    }

    // Check cache
    const cached = await this.cache.get<ProgressNotification>(`progress:${operationId}`);
    return cached;
  }

  /**
   * Update progress with estimated time
   */
  async updateProgress(
    operationId: string,
    progress: number,
    estimatedTimeRemaining?: number
  ): Promise<void> {
    const existing = await this.getProgress(operationId);
    if (existing) {
      existing.progress = progress;
      existing.status = progress === 100 ? 'completed' : 'in_progress';
      if (estimatedTimeRemaining !== undefined) {
        existing.estimatedTimeRemaining = estimatedTimeRemaining;
      }
      await this.showProgress(operationId, existing.operation, progress, existing.message);
    }
  }

  /**
   * Show a warning notification
   */
  async showWarning(
    userId: string,
    message: string,
    actions?: NotificationAction[]
  ): Promise<void> {
    await this.send({
      userId,
      type: 'warning',
      title: 'Warning',
      message,
      actions,
      duration: 8000,
    });
  }

  /**
   * Show an info notification
   */
  async showInfo(userId: string, message: string, persistent: boolean = false): Promise<void> {
    await this.send({
      userId,
      type: 'info',
      title: 'Information',
      message,
      persistent,
      duration: persistent ? undefined : 5000,
    });
  }

  /**
   * Send notification through available channels
   */
  private async send(notification: NotificationOptions): Promise<void> {
    try {
      // Add timestamp if not present
      const timestampedNotification = {
        ...notification,
        timestamp: notification.timestamp || new Date().toISOString()
      };

      // Emit to WebSocket subscribers
      this.emit('notification', timestampedNotification);

      // Store in cache for polling clients
      const key = `notification:${notification.userId}:${Date.now()}`;
      await this.cache.set(key, timestampedNotification, { ttl: 300 }); // 5 minutes TTL

      // Store in notification history for user
      await this.addToNotificationHistory(timestampedNotification);

      // Log notification
      logger.info('Notification sent', {
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
      });

      // For critical errors, also send email
      if (notification.type === 'error' && notification.persistent) {
        await this.sendEmailNotification(timestampedNotification);
      }
    } catch (error) {
      logger.error('Failed to send notification', error);
    }
  }

  /**
   * Send email notification for critical issues
   */
  private async sendEmailNotification(notification: NotificationOptions): Promise<void> {
    try {
      // Get user email from cache or database
      const userEmail = await this.getUserEmail(notification.userId);
      if (!userEmail) return;

      await emailService.send({
        to: userEmail,
        subject: `[${notification.type.toUpperCase()}] ${notification.title}`,
        template: 'notification',
        data: {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          actions: notification.actions,
        },
      });
    } catch (error) {
      logger.error('Failed to send email notification', error);
    }
  }

  /**
   * Get user email from database with caching
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    try {
      // First check cache
      const cached = await this.cache.get<string>(`user:email:${userId}`);
      if (cached) {
        return cached;
      }

      // Import User model
      const { User } = await import('../models/User');

      // Fetch from database
      const user = await User.findByPk(userId, {
        attributes: ['email']
      });

      if (!user || !user.email) {
        return null;
      }

      // Cache the email for 30 minutes
      await this.cache.set(`user:email:${userId}`, user.email, 30 * 60);

      return user.email;
    } catch (error) {
      logger.error('Error fetching user email:', error);
      return null;
    }
  }

  /**
   * Get recent notifications for a user
   */
  async getRecentNotifications(
    userId: string,
    limit: number = 10
  ): Promise<NotificationOptions[]> {
    try {
      // Get the notification history for this user from cache
      const historyKey = `notifications:history:${userId}`;
      const history = await this.cache.get<NotificationOptions[]>(historyKey);

      if (!history || !Array.isArray(history)) {
        return [];
      }

      // Sort by most recent first and limit results
      return history
        .sort((a, b) => {
          const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, limit);
    } catch (error) {
      logger.error('Error fetching recent notifications:', error);
      return [];
    }
  }

  /**
   * Add notification to user's history
   */
  private async addToNotificationHistory(notification: NotificationOptions): Promise<void> {
    try {
      const historyKey = `notifications:history:${notification.userId}`;
      const maxHistorySize = 100; // Keep last 100 notifications

      // Get existing history
      const existingHistory = await this.cache.get<NotificationOptions[]>(historyKey) || [];

      // Add new notification to the beginning
      const updatedHistory = [notification, ...existingHistory];

      // Trim to maximum size
      if (updatedHistory.length > maxHistorySize) {
        updatedHistory.splice(maxHistorySize);
      }

      // Store back with 7-day TTL
      await this.cache.set(historyKey, updatedHistory, 7 * 24 * 60 * 60);
    } catch (error) {
      logger.error('Error adding notification to history:', error);
    }
  }

  /**
   * Clear notifications for a user
   */
  async clearNotifications(userId: string): Promise<void> {
    try {
      // Clear the notification history for this user
      const historyKey = `notifications:history:${userId}`;
      await this.cache.delete(historyKey);

      // Clear any pending notifications
      const pendingKey = `notifications:pending:${userId}`;
      await this.cache.delete(pendingKey);

      // Clear user email cache to force refresh
      const emailKey = `user:email:${userId}`;
      await this.cache.delete(emailKey);

      logger.info(`Successfully cleared all notifications for user ${userId}`);
    } catch (error) {
      logger.error(`Error clearing notifications for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Setup cleanup interval
   */
  private setupCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      // Clean up old progress trackers
      for (const [id, progress] of this.progressTrackers) {
        if (progress.status === 'completed') {
          this.progressTrackers.delete(id);
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Gracefully shutdown the service
   */
  public shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    // Clear all listeners
    this.removeAllListeners();

    // Clear progress trackers
    this.progressTrackers.clear();

    logger.info('NotificationService shutdown complete');
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
