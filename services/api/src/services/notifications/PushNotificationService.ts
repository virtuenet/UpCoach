import * as admin from 'firebase-admin';
import { logger } from '../../utils/logger';

/**
 * Push Notification Service
 * Handles sending push notifications via Firebase Cloud Messaging (FCM)
 *
 * Setup Instructions:
 * 1. Download Firebase service account JSON from Firebase Console
 * 2. Set FIREBASE_SERVICE_ACCOUNT_PATH environment variable
 * 3. Ensure google-services.json exists in mobile apps
 */

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  image?: string;
  badge?: number;
}

export interface NotificationTarget {
  token?: string;
  tokens?: string[];
  topic?: string;
  condition?: string;
}

export interface NotificationOptions {
  priority?: 'high' | 'normal';
  ttl?: number; // Time to live in seconds
  collapseKey?: string;
  sound?: string;
  clickAction?: string;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private initialized: boolean = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  private initialize(): void {
    try {
      if (!admin.apps.length) {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

        if (!serviceAccountPath) {
          logger.warn('Firebase service account path not configured. Push notifications disabled.');
          return;
        }

        const serviceAccount = require(serviceAccountPath);

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL,
        });

        this.initialized = true;
        logger.info('Firebase Admin SDK initialized successfully');
      } else {
        this.initialized = true;
      }
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK:', error);
      this.initialized = false;
    }
  }

  /**
   * Send notification to a single device token
   */
  async sendToToken(
    token: string,
    payload: NotificationPayload,
    options?: NotificationOptions
  ): Promise<string | null> {
    if (!this.initialized) {
      logger.warn('Push notifications not initialized. Skipping send.');
      return null;
    }

    try {
      const message = this.buildMessage(payload, { token }, options);
      const response = await admin.messaging().send(message);

      logger.info(`Notification sent successfully to token: ${token.substring(0, 10)}...`);
      return response;
    } catch (error) {
      logger.error(`Failed to send notification to token: ${token.substring(0, 10)}...`, error);

      // Handle invalid tokens
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        logger.info(
          `Invalid token detected: ${token.substring(0, 10)}... - should be removed from database`
        );
        // Caller should remove this token from database
      }

      throw error;
    }
  }

  /**
   * Send notification to multiple device tokens (batch send)
   */
  async sendToTokens(
    tokens: string[],
    payload: NotificationPayload,
    options?: NotificationOptions
  ): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
    if (!this.initialized) {
      logger.warn('Push notifications not initialized. Skipping send.');
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    try {
      const message = this.buildMessage(payload, { tokens }, options);
      const response = await admin.messaging().sendMulticast(message);

      const invalidTokens: string[] = [];

      // Collect invalid tokens
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const error: any = resp.error;
            if (
              error?.code === 'messaging/invalid-registration-token' ||
              error?.code === 'messaging/registration-token-not-registered'
            ) {
              invalidTokens.push(tokens[idx]);
            }
          }
        });
      }

      logger.info(
        `Batch notification sent: ${response.successCount} succeeded, ${response.failureCount} failed`
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      };
    } catch (error) {
      logger.error('Failed to send batch notifications', error);
      throw error;
    }
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(
    topic: string,
    payload: NotificationPayload,
    options?: NotificationOptions
  ): Promise<string | null> {
    if (!this.initialized) {
      logger.warn('Push notifications not initialized. Skipping send.');
      return null;
    }

    try {
      const message = this.buildMessage(payload, { topic }, options);
      const response = await admin.messaging().send(message);

      logger.info(`Notification sent successfully to topic: ${topic}`);
      return response;
    } catch (error) {
      logger.error(`Failed to send notification to topic: ${topic}`, error);
      throw error;
    }
  }

  /**
   * Send notification based on a condition
   * Example: "'stock-GOOG' in topics || 'industry-tech' in topics"
   */
  async sendToCondition(
    condition: string,
    payload: NotificationPayload,
    options?: NotificationOptions
  ): Promise<string | null> {
    if (!this.initialized) {
      logger.warn('Push notifications not initialized. Skipping send.');
      return null;
    }

    try {
      const message = this.buildMessage(payload, { condition }, options);
      const response = await admin.messaging().send(message);

      logger.info(`Notification sent successfully to condition: ${condition}`);
      return response;
    } catch (error) {
      logger.error(`Failed to send notification to condition: ${condition}`, error);
      throw error;
    }
  }

  /**
   * Subscribe tokens to a topic
   */
  async subscribeToTopic(
    tokens: string[],
    topic: string
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.initialized) {
      logger.warn('Push notifications not initialized. Skipping subscribe.');
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);

      logger.info(`Subscribed ${response.successCount} tokens to topic: ${topic}`);
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      logger.error(`Failed to subscribe to topic: ${topic}`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe tokens from a topic
   */
  async unsubscribeFromTopic(
    tokens: string[],
    topic: string
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.initialized) {
      logger.warn('Push notifications not initialized. Skipping unsubscribe.');
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);

      logger.info(`Unsubscribed ${response.successCount} tokens from topic: ${topic}`);
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      logger.error(`Failed to unsubscribe from topic: ${topic}`, error);
      throw error;
    }
  }

  /**
   * Build FCM message from payload and target
   */
  private buildMessage(
    payload: NotificationPayload,
    target: NotificationTarget,
    options?: NotificationOptions
  ): admin.messaging.Message {
    const message: admin.messaging.Message = {
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.image,
      },
      data: payload.data,
      ...target,
    };

    // Android-specific options
    if (options) {
      message.android = {
        priority: options.priority || 'high',
        ttl: options.ttl ? options.ttl * 1000 : undefined,
        collapseKey: options.collapseKey,
        notification: {
          sound: options.sound || 'default',
          clickAction: options.clickAction,
          imageUrl: payload.image,
        },
      };

      // iOS-specific options
      message.apns = {
        payload: {
          aps: {
            sound: options.sound || 'default',
            badge: payload.badge,
            contentAvailable: true,
          },
        },
        fcmOptions: {
          imageUrl: payload.image,
        },
      };
    }

    return message;
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();
