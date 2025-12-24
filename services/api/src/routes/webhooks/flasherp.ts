import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

import { logger } from '../../utils/logger';
import { flashERPWebhookHandler } from '../../services/erp/FlashERPWebhookHandler';
import { ERPError, ERPErrorCode } from '../../types/flasherp';

const router = Router();

/**
 * Rate limiter for webhook endpoint
 * Allow 100 requests per minute per IP
 */
const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many webhook requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Middleware to parse raw body for signature verification
 * Note: This should be configured at the app level to preserve raw body
 */
const preserveRawBody = (req: Request, res: Response, next: any) => {
  // Raw body should already be available via express.raw() middleware
  // configured at app level for this route
  next();
};

/**
 * POST /api/webhooks/flasherp
 * Receive and process FlashERP webhooks
 *
 * Security:
 * - HMAC-SHA256 signature verification
 * - Timestamp validation (5-minute window)
 * - Deduplication (24-hour window)
 * - Rate limiting (100 req/min)
 * - Optional IP whitelisting
 */
router.post(
  '/',
  webhookRateLimiter,
  preserveRawBody,
  async (req: Request, res: Response) => {
    const requestId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info('FlashERP webhook received', {
      requestId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    try {
      // Process webhook (includes signature validation)
      await flashERPWebhookHandler.handleWebhook(req);

      // Return 200 immediately (Stripe/FlashERP best practice)
      res.status(200).json({
        received: true,
        requestId,
      });
    } catch (error) {
      logger.error('Webhook processing failed', {
        requestId,
        error: (error as Error).message,
      });

      // Determine appropriate status code
      if (error instanceof ERPError) {
        switch (error.code) {
          case ERPErrorCode.WEBHOOK_VALIDATION_FAILED:
            return res.status(401).json({
              error: 'Unauthorized',
              message: error.message,
              requestId,
            });

          case ERPErrorCode.CONFIGURATION_ERROR:
            return res.status(503).json({
              error: 'Service Unavailable',
              message: error.message,
              requestId,
            });

          default:
            return res.status(500).json({
              error: 'Internal Server Error',
              message: error.message,
              requestId,
            });
        }
      }

      // Generic error
      res.status(500).json({
        error: 'Internal Server Error',
        message: (error as Error).message,
        requestId,
      });
    }
  }
);

/**
 * GET /api/webhooks/flasherp/health
 * Health check endpoint for webhook receiver
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'flasherp-webhook-receiver',
    timestamp: new Date().toISOString(),
  });
});

export default router;
