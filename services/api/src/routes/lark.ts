/**
 * Lark Webhook Routes
 * Handles incoming Lark webhook events for bot commands and notifications
 */

import { Router, Request, Response } from 'express';

import { getLarkService, isLarkConfigured } from '../services/lark';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Lark webhook endpoint
 * Receives events from Lark platform
 */
router.post('/webhook', async (req: Request, res: Response) => {
  if (!isLarkConfigured()) {
    logger.warn('Lark webhook received but Lark is not configured');
    return res.status(503).json({
      code: -1,
      msg: 'Lark integration not configured',
    });
  }

  const larkService = getLarkService();
  if (!larkService) {
    logger.error('Lark service not initialized');
    return res.status(503).json({
      code: -1,
      msg: 'Lark service not available',
    });
  }

  try {
    const response = await larkService.handleWebhook({
      body: req.body,
      headers: req.headers as Record<string, string | string[] | undefined>,
    });

    return res.status(response.statusCode).json(response.body);
  } catch (error) {
    logger.error('Lark webhook error', {
      error: (error as Error).message,
      body: req.body,
    });
    return res.status(500).json({
      code: -1,
      msg: 'Internal server error',
    });
  }
});

/**
 * Health check for Lark integration
 */
router.get('/health', (_req: Request, res: Response) => {
  const configured = isLarkConfigured();
  const service = getLarkService();

  return res.json({
    status: configured && service ? 'healthy' : 'not_configured',
    configured,
    serviceInitialized: !!service,
  });
});

/**
 * Send a test notification (admin only)
 */
router.post('/test-notification', async (req: Request, res: Response) => {
  if (!isLarkConfigured()) {
    return res.status(503).json({
      code: -1,
      msg: 'Lark integration not configured',
    });
  }

  const larkService = getLarkService();
  if (!larkService) {
    return res.status(503).json({
      code: -1,
      msg: 'Lark service not available',
    });
  }

  try {
    const { type = 'text', message = 'Test notification from UpCoach', chatId } = req.body;

    const publisher = larkService.getNotificationPublisher();

    if (type === 'text') {
      await publisher.sendText(message, chatId ? { receiveId: chatId } : undefined);
    } else {
      await publisher.send(
        {
          title: 'Test Notification',
          message,
          level: 'info',
          category: 'system',
        },
        chatId ? { receiveId: chatId } : undefined
      );
    }

    return res.json({
      code: 0,
      msg: 'Notification sent successfully',
    });
  } catch (error) {
    logger.error('Failed to send test notification', { error: (error as Error).message });
    return res.status(500).json({
      code: -1,
      msg: `Failed to send notification: ${(error as Error).message}`,
    });
  }
});

/**
 * Get bot commands list
 */
router.get('/commands', (_req: Request, res: Response) => {
  const commands = [
    { name: 'help', description: 'Show available commands' },
    { name: 'status', description: 'Show system health status' },
    { name: 'coaches', description: 'Show coach overview' },
    { name: 'sessions', description: "Show today's sessions" },
    { name: 'clients', description: 'Show client overview and recent signups' },
    { name: 'alerts', description: 'Show ML/Security alerts' },
    { name: 'revenue', description: 'Show daily MRR summary' },
  ];

  return res.json({
    prefix: '/upcoach',
    commands,
  });
});

export default router;
