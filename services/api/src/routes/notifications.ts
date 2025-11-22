import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { pushNotificationService } from '../services/notifications/PushNotificationService';
import {
  notificationTemplates,
  NotificationType,
} from '../services/notifications/NotificationTemplateService';
import { notificationScheduler } from '../services/notifications/NotificationScheduler';
import { Platform } from '../models/DeviceToken';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @swagger
 * /api/notifications/register-token:
 *   post:
 *     summary: Register device token for push notifications
 *     description: Register a device token (FCM/APNs) to receive push notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - platform
 *               - deviceId
 *             properties:
 *               token:
 *                 type: string
 *                 description: FCM registration token or APNs device token
 *                 example: "fMc7xKZPRU..."
 *               platform:
 *                 type: string
 *                 enum: [IOS, ANDROID, WEB]
 *                 description: Device platform
 *                 example: "IOS"
 *               deviceId:
 *                 type: string
 *                 description: Unique device identifier
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               deviceName:
 *                 type: string
 *                 description: Human-readable device name
 *                 example: "John's iPhone 14"
 *               appVersion:
 *                 type: string
 *                 description: App version
 *                 example: "1.0.0"
 *               osVersion:
 *                 type: string
 *                 description: OS version
 *                 example: "iOS 17.2"
 *     responses:
 *       200:
 *         description: Device token registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Device token registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     platform:
 *                       type: string
 *                       example: "IOS"
 *                     deviceId:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/register-token',
  [
    body('token').notEmpty().withMessage('Device token is required'),
    body('platform').isIn(['IOS', 'ANDROID', 'WEB']).withMessage('Invalid platform'),
    body('deviceId').notEmpty().withMessage('Device ID is required'),
    body('deviceName').optional().isString(),
    body('appVersion').optional().isString(),
    body('osVersion').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { token, platform, deviceId, deviceName, appVersion, osVersion } = req.body;

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // In production, save to database using Prisma
      // const deviceToken = await prisma.deviceToken.upsert({
      //   where: { token },
      //   update: {
      //     isActive: true,
      //     lastUsedAt: new Date(),
      //     deviceName,
      //     appVersion,
      //     osVersion
      //   },
      //   create: {
      //     userId,
      //     token,
      //     platform,
      //     deviceId,
      //     deviceName,
      //     appVersion,
      //     osVersion
      //   }
      // });

      logger.info(`Registered device token for user ${userId}, platform: ${platform}`);

      res.status(200).json({
        success: true,
        message: 'Device token registered successfully',
        data: {
          userId,
          platform,
          deviceId,
        },
      });
    } catch (error) {
      logger.error('Error registering device token:', error);
      res.status(500).json({ success: false, message: 'Failed to register device token' });
    }
  }
);

/**
 * @swagger
 * /api/notifications/unregister-token:
 *   delete:
 *     summary: Unregister device token
 *     description: Unregister a device token to stop receiving push notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Device token to unregister
 *                 example: "fMc7xKZPRU..."
 *     responses:
 *       200:
 *         description: Device token unregistered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete(
  '/unregister-token',
  [body('token').notEmpty().withMessage('Device token is required')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { token } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // In production, update database
      // await prisma.deviceToken.updateMany({
      //   where: { token, userId },
      //   data: { isActive: false }
      // });

      logger.info(`Unregistered device token for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Device token unregistered successfully',
      });
    } catch (error) {
      logger.error('Error unregistering device token:', error);
      res.status(500).json({ success: false, message: 'Failed to unregister device token' });
    }
  }
);

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Send push notification
 *     description: Send a push notification using a template (admin/system use)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationPayload'
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Notification sent successfully"
 *                 data:
 *                   type: object
 *                   description: Send result (messageId for single token, batch results for multiple)
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: No active device tokens found for user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/send',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('type')
      .isIn(notificationTemplates.getAvailableTypes())
      .withMessage('Invalid notification type'),
    body('data').isObject().withMessage('Template data must be an object'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { userId, type, data } = req.body;

      // Validate template data
      if (!notificationTemplates.validateTemplateData(type as NotificationType, data)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid template data for notification type',
        });
      }

      // In production, fetch user's device tokens from database
      // const deviceTokens = await prisma.deviceToken.findMany({
      //   where: { userId, isActive: true },
      //   select: { token: true }
      // });

      // For now, simulate with empty array
      const deviceTokens: string[] = [];

      if (deviceTokens.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No active device tokens found for user',
        });
      }

      const payload = notificationTemplates.getTemplate(type as NotificationType, data);

      let result;
      if (deviceTokens.length === 1) {
        result = await pushNotificationService.sendToToken(deviceTokens[0], payload);
      } else {
        result = await pushNotificationService.sendToTokens(deviceTokens, payload);
      }

      logger.info(`Sent notification to user ${userId}, type: ${type}`);

      res.status(200).json({
        success: true,
        message: 'Notification sent successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error sending notification:', error);
      res.status(500).json({ success: false, message: 'Failed to send notification' });
    }
  }
);

/**
 * @swagger
 * /api/notifications/subscribe-topic:
 *   post:
 *     summary: Subscribe to notification topic
 *     description: Subscribe user's devices to a notification topic for broadcast messages
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *             properties:
 *               topic:
 *                 type: string
 *                 description: Topic name (e.g., 'all-users', 'premium-users')
 *                 example: "habit-reminders"
 *     responses:
 *       200:
 *         description: Subscribed to topic successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: No active device tokens found
 */
router.post(
  '/subscribe-topic',
  [body('topic').notEmpty().withMessage('Topic is required')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { topic } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // In production, fetch user's device tokens
      // const deviceTokens = await prisma.deviceToken.findMany({
      //   where: { userId, isActive: true },
      //   select: { token: true }
      // });

      const deviceTokens: string[] = [];

      if (deviceTokens.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No active device tokens found',
        });
      }

      const result = await pushNotificationService.subscribeToTopic(deviceTokens, topic);

      logger.info(`Subscribed user ${userId} to topic: ${topic}`);

      res.status(200).json({
        success: true,
        message: 'Subscribed to topic successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error subscribing to topic:', error);
      res.status(500).json({ success: false, message: 'Failed to subscribe to topic' });
    }
  }
);

/**
 * @swagger
 * /api/notifications/unsubscribe-topic:
 *   post:
 *     summary: Unsubscribe from notification topic
 *     description: Unsubscribe user's devices from a notification topic
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *             properties:
 *               topic:
 *                 type: string
 *                 description: Topic name
 *                 example: "habit-reminders"
 *     responses:
 *       200:
 *         description: Unsubscribed from topic successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/unsubscribe-topic',
  [body('topic').notEmpty().withMessage('Topic is required')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { topic } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // In production, fetch user's device tokens
      // const deviceTokens = await prisma.deviceToken.findMany({
      //   where: { userId, isActive: true },
      //   select: { token: true }
      // });

      const deviceTokens: string[] = [];

      if (deviceTokens.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No active device tokens found',
        });
      }

      const result = await pushNotificationService.unsubscribeFromTopic(deviceTokens, topic);

      logger.info(`Unsubscribed user ${userId} from topic: ${topic}`);

      res.status(200).json({
        success: true,
        message: 'Unsubscribed from topic successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error unsubscribing from topic:', error);
      res.status(500).json({ success: false, message: 'Failed to unsubscribe from topic' });
    }
  }
);

/**
 * @swagger
 * /api/notifications/status:
 *   get:
 *     summary: Get notification system status
 *     description: Check the notification system status (initialization, templates, scheduled jobs)
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Notification system status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     initialized:
 *                       type: boolean
 *                       description: Whether Firebase is initialized
 *                       example: true
 *                     availableTemplates:
 *                       type: array
 *                       description: List of available notification templates
 *                       items:
 *                         type: string
 *                       example: ["habit_reminder", "goal_milestone", "welcome"]
 *                     activeScheduledJobs:
 *                       type: integer
 *                       description: Number of active scheduled notification jobs
 *                       example: 5
 */
router.get('/status', (req: Request, res: Response) => {
  const isInitialized = pushNotificationService.isInitialized();

  res.status(200).json({
    success: true,
    data: {
      initialized: isInitialized,
      availableTemplates: notificationTemplates.getAvailableTypes(),
      activeScheduledJobs: notificationScheduler.getActiveJobs().length,
    },
  });
});

export default router;
