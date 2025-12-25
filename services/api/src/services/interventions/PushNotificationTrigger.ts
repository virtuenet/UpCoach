import { Pool } from 'pg';
import admin from 'firebase-admin';
import { InterventionEvent, DeliveryResult } from './InterventionDeliveryService';
import { logger } from '../../utils/logger';

/**
 * Push Notification Trigger Service
 *
 * Sends push notifications via Firebase Cloud Messaging (FCM)
 * Supports iOS and Android with rich content
 */

export class PushNotificationTriggerService {
  private db: Pool;
  private fcm: admin.messaging.Messaging;

  constructor(db: Pool) {
    this.db = db;

    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }

    this.fcm = admin.messaging();
  }

  /**
   * Send motivational push notification
   */
  async sendMotivationalPush(event: InterventionEvent): Promise<DeliveryResult> {
    try {
      const deviceTokens = await this.getUserDeviceTokens(event.userId);

      if (deviceTokens.length === 0) {
        return {
          userId: event.userId,
          interventionType: event.interventionType,
          channel: 'push',
          status: 'skipped',
          error: 'No device tokens found',
        };
      }

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: '🌟 Keep Your Momentum Going!',
          body: "You've come so far! Check in now to maintain your streak.",
        },
        data: {
          type: 'motivational_intervention',
          interventionType: event.interventionType,
          userId: event.userId,
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'mutable-content': 1,
              category: 'HABIT_REMINDER',
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_notification',
            color: '#4F46E5',
            sound: 'default',
            channelId: 'interventions',
          },
        },
        tokens: deviceTokens,
      };

      const response = await this.fcm.sendEachForMulticast(message);

      logger.info('Motivational push sent', {
        userId: event.userId,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      // Clean up invalid tokens
      await this.removeInvalidTokens(deviceTokens, response.responses);

      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'push',
        status: response.successCount > 0 ? 'sent' : 'failed',
        deliveredAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to send motivational push', { error });
      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'push',
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Send goal reminder push notification
   */
  async sendGoalReminderPush(event: InterventionEvent): Promise<DeliveryResult> {
    try {
      const deviceTokens = await this.getUserDeviceTokens(event.userId);

      if (deviceTokens.length === 0) {
        return {
          userId: event.userId,
          interventionType: event.interventionType,
          channel: 'push',
          status: 'skipped',
          error: 'No device tokens found',
        };
      }

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: '🎯 Your Goal Needs Attention',
          body: 'Take a moment to work on your goal today. Small progress adds up!',
        },
        data: {
          type: 'goal_coaching_intervention',
          interventionType: event.interventionType,
          userId: event.userId,
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'mutable-content': 1,
              category: 'GOAL_REMINDER',
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_notification',
            color: '#7C3AED',
            sound: 'default',
            channelId: 'interventions',
          },
        },
        tokens: deviceTokens,
      };

      const response = await this.fcm.sendEachForMulticast(message);

      await this.removeInvalidTokens(deviceTokens, response.responses);

      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'push',
        status: response.successCount > 0 ? 'sent' : 'failed',
        deliveredAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to send goal reminder push', { error });
      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'push',
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Send high churn risk alert
   */
  async sendChurnRiskAlert(event: InterventionEvent): Promise<DeliveryResult> {
    try {
      const deviceTokens = await this.getUserDeviceTokens(event.userId);

      if (deviceTokens.length === 0) {
        return {
          userId: event.userId,
          interventionType: event.interventionType,
          channel: 'push',
          status: 'skipped',
          error: 'No device tokens found',
        };
      }

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: '👋 We Miss You!',
          body: "It's been a while since your last check-in. Let's get back on track together!",
        },
        data: {
          type: 'churn_risk_intervention',
          interventionType: event.interventionType,
          userId: event.userId,
          churnProbability: String(event.metadata.churnProbability || 0),
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'mutable-content': 1,
              category: 'REENGAGEMENT',
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_notification',
            color: '#EF4444',
            sound: 'default',
            channelId: 'interventions',
          },
        },
        tokens: deviceTokens,
      };

      const response = await this.fcm.sendEachForMulticast(message);

      await this.removeInvalidTokens(deviceTokens, response.responses);

      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'push',
        status: response.successCount > 0 ? 'sent' : 'failed',
        deliveredAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to send churn risk alert', { error });
      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'push',
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Get user's device tokens
   */
  private async getUserDeviceTokens(userId: string): Promise<string[]> {
    const query = `
      SELECT fcm_token
      FROM user_devices
      WHERE user_id = $1
        AND fcm_token IS NOT NULL
        AND is_active = true
      ORDER BY last_active_at DESC
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows.map(row => row.fcm_token);
  }

  /**
   * Remove invalid device tokens
   */
  private async removeInvalidTokens(
    tokens: string[],
    responses: admin.messaging.SendResponse[]
  ): Promise<void> {
    const invalidTokens: string[] = [];

    responses.forEach((response, index) => {
      if (!response.success) {
        const error = response.error;
        if (
          error?.code === 'messaging/invalid-registration-token' ||
          error?.code === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      const query = `
        UPDATE user_devices
        SET is_active = false, updated_at = NOW()
        WHERE fcm_token = ANY($1)
      `;

      await this.db.query(query, [invalidTokens]);

      logger.info('Removed invalid device tokens', {
        count: invalidTokens.length,
      });
    }
  }
}
