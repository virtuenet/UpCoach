import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';

import { logger } from '../utils/logger';
import { flashERPService } from '../services/erp/FlashERPService';
import { flashERPSyncScheduler } from '../services/erp/FlashERPSyncScheduler';
import {
  ERPConfiguration,
  HealthStatus,
  SyncScope,
} from '../models/erp/ERPConfiguration';
import { ERPSync, SyncStatus } from '../models/erp/ERPSync';
import { ERPAuditLog } from '../models/erp/ERPAuditLog';
import { ERPError, ERPErrorCode } from '../types/flasherp';

const router = Router();

// Middleware to check admin role (placeholder - adjust based on your auth system)
const requireAdmin = (req: Request, res: Response, next: any) => {
  // TODO: Implement actual admin check based on your auth system
  // if (!req.user || req.user.role !== 'admin') {
  //   return res.status(403).json({ error: 'Admin access required' });
  // }
  next();
};

// Middleware to validate ERP is enabled
const requireERPEnabled = async (
  req: Request,
  res: Response,
  next: any
): Promise<void> => {
  const config = await ERPConfiguration.findOne({ where: { isEnabled: true } });

  if (!config) {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'FlashERP integration not configured or disabled',
    });
    return;
  }

  (req as any).erpConfig = config;
  next();
};

// ============================================================================
// Configuration Endpoints
// ============================================================================

/**
 * GET /api/erp/config
 * Get FlashERP configuration
 */
router.get('/config', requireAdmin, async (req: Request, res: Response) => {
  try {
    const config = await ERPConfiguration.findOne({
      attributes: {
        exclude: ['apiKey', 'apiSecret', 'webhookSecret'], // Exclude secrets
      },
    });

    if (!config) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'FlashERP configuration not found',
      });
    }

    // Add masked credentials
    const response = {
      ...config.toJSON(),
      apiKeyMasked: config.getMaskedApiKey(),
      apiSecretMasked: config.apiSecret ? '***********' : null,
      webhookSecretMasked: config.webhookSecret ? '***********' : null,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get ERP config', { error });
    res.status(500).json({
      error: 'Internal Server Error',
      message: (error as Error).message,
    });
  }
});

/**
 * PUT /api/erp/config
 * Update FlashERP configuration
 */
router.put(
  '/config',
  requireAdmin,
  [
    body('apiKey').optional().isString(),
    body('apiSecret').optional().isString(),
    body('baseURL').optional().isURL(),
    body('webhookSecret').optional().isString(),
    body('isEnabled').optional().isBoolean(),
    body('syncInterval').optional().isInt({ min: 300 }), // Min 5 minutes
    body('enableAutoSync').optional().isBoolean(),
    body('enableWebhooks').optional().isBoolean(),
    body('syncScope').optional().isObject(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let config = await ERPConfiguration.findOne();

      const updateData: any = {
        ...req.body,
        updatedBy: (req as any).user?.id || 'system',
      };

      if (config) {
        await config.update(updateData);
      } else {
        config = await ERPConfiguration.create({
          ...updateData,
          createdBy: (req as any).user?.id || 'system',
        });
      }

      // If enabled, restart scheduler
      if (config.isEnabled && config.enableAutoSync) {
        flashERPSyncScheduler.stop();
        await flashERPSyncScheduler.start();
      }

      // Exclude secrets from response
      const response = {
        ...config.toJSON(),
        apiKey: undefined,
        apiSecret: undefined,
        webhookSecret: undefined,
        apiKeyMasked: config.getMaskedApiKey(),
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to update ERP config', { error });
      res.status(500).json({
        error: 'Internal Server Error',
        message: (error as Error).message,
      });
    }
  }
);

/**
 * DELETE /api/erp/config
 * Delete FlashERP configuration
 */
router.delete('/config', requireAdmin, async (req: Request, res: Response) => {
  try {
    const config = await ERPConfiguration.findOne();

    if (!config) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'FlashERP configuration not found',
      });
    }

    // Stop scheduler first
    flashERPSyncScheduler.stop();

    await config.destroy();

    res.json({ message: 'FlashERP configuration deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete ERP config', { error });
    res.status(500).json({
      error: 'Internal Server Error',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/erp/config/test
 * Test connection to FlashERP
 */
router.post(
  '/config/test',
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const result = await flashERPService.healthCheck();

      res.json(result);
    } catch (error) {
      logger.error('Connection test failed', { error });
      res.status(500).json({
        error: 'Connection Test Failed',
        message: (error as Error).message,
      });
    }
  }
);

// ============================================================================
// Sync Operations
// ============================================================================

/**
 * POST /api/erp/sync/transaction/:id
 * Sync single transaction
 */
router.post(
  '/sync/transaction/:id',
  requireAdmin,
  requireERPEnabled,
  [param('id').isUUID()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await flashERPService.syncTransaction(req.params.id);
      res.json(result);
    } catch (error) {
      logger.error('Transaction sync failed', { error });
      res.status(500).json({
        error: 'Sync Failed',
        message: (error as Error).message,
      });
    }
  }
);

/**
 * POST /api/erp/sync/subscription/:id
 * Sync single subscription
 */
router.post(
  '/sync/subscription/:id',
  requireAdmin,
  requireERPEnabled,
  [param('id').isUUID()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await flashERPService.syncSubscription(req.params.id);
      res.json(result);
    } catch (error) {
      logger.error('Subscription sync failed', { error });
      res.status(500).json({
        error: 'Sync Failed',
        message: (error as Error).message,
      });
    }
  }
);

/**
 * POST /api/erp/sync/customer/:userId
 * Sync single customer
 */
router.post(
  '/sync/customer/:userId',
  requireAdmin,
  requireERPEnabled,
  [param('userId').isUUID()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await flashERPService.syncCustomer(req.params.userId);
      res.json(result);
    } catch (error) {
      logger.error('Customer sync failed', { error });
      res.status(500).json({
        error: 'Sync Failed',
        message: (error as Error).message,
      });
    }
  }
);

/**
 * POST /api/erp/sync/full
 * Trigger full sync
 */
router.post(
  '/sync/full',
  requireAdmin,
  requireERPEnabled,
  async (req: Request, res: Response) => {
    try {
      // Trigger async sync operations
      flashERPSyncScheduler
        .syncRecentTransactions()
        .catch((err) => logger.error('Transaction sync failed', { error: err }));

      flashERPSyncScheduler
        .syncSubscriptions()
        .catch((err) => logger.error('Subscription sync failed', { error: err }));

      res.json({
        message: 'Full sync initiated',
        status: 'processing',
      });
    } catch (error) {
      logger.error('Full sync failed', { error });
      res.status(500).json({
        error: 'Sync Failed',
        message: (error as Error).message,
      });
    }
  }
);

/**
 * POST /api/erp/sync/reconcile
 * Run reconciliation
 */
router.post(
  '/sync/reconcile',
  requireAdmin,
  requireERPEnabled,
  async (req: Request, res: Response) => {
    try {
      const report = await flashERPSyncScheduler.fullReconciliation();
      res.json(report);
    } catch (error) {
      logger.error('Reconciliation failed', { error });
      res.status(500).json({
        error: 'Reconciliation Failed',
        message: (error as Error).message,
      });
    }
  }
);

// ============================================================================
// Status & Monitoring
// ============================================================================

/**
 * GET /api/erp/status
 * Get sync status & health
 */
router.get(
  '/status',
  requireAdmin,
  requireERPEnabled,
  async (req: Request, res: Response) => {
    try {
      const config = await ERPConfiguration.findOne({
        where: { isEnabled: true },
      });

      const schedulerStatus = flashERPSyncScheduler.getStatus();

      // Get recent sync stats
      const recentSyncs = await ERPSync.count({
        where: {
          lastSyncAttempt: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      const failedSyncs = await ERPSync.count({
        where: {
          syncStatus: SyncStatus.FAILED,
        },
      });

      const pendingRetries = await ERPSync.count({
        where: {
          syncStatus: SyncStatus.FAILED,
          nextRetryAt: {
            $lte: new Date(),
          },
        },
      });

      res.json({
        enabled: config?.isEnabled || false,
        healthStatus: config?.healthStatus || HealthStatus.DOWN,
        lastFullSync: config?.lastFullSync,
        lastSyncStatus: config?.lastSyncStatus,
        scheduler: schedulerStatus,
        stats: {
          recentSyncs,
          failedSyncs,
          pendingRetries,
        },
      });
    } catch (error) {
      logger.error('Failed to get ERP status', { error });
      res.status(500).json({
        error: 'Internal Server Error',
        message: (error as Error).message,
      });
    }
  }
);

/**
 * GET /api/erp/sync-history
 * Get sync history (paginated)
 */
router.get(
  '/sync-history',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(Object.values(SyncStatus)),
    query('sourceType').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      const offset = (page - 1) * limit;

      const where: any = {};
      if (req.query.status) {
        where.syncStatus = req.query.status;
      }
      if (req.query.sourceType) {
        where.sourceType = req.query.sourceType;
      }

      const { rows, count } = await ERPSync.findAndCountAll({
        where,
        limit,
        offset,
        order: [['lastSyncAttempt', 'DESC']],
      });

      res.json({
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      logger.error('Failed to get sync history', { error });
      res.status(500).json({
        error: 'Internal Server Error',
        message: (error as Error).message,
      });
    }
  }
);

/**
 * GET /api/erp/audit-logs
 * Get audit logs (paginated)
 */
router.get(
  '/audit-logs',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('action').optional().isString(),
    query('status').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      const offset = (page - 1) * limit;

      const where: any = {};
      if (req.query.action) {
        where.action = req.query.action;
      }
      if (req.query.status) {
        where.status = req.query.status;
      }

      const { rows, count } = await ERPAuditLog.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.json({
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      logger.error('Failed to get audit logs', { error });
      res.status(500).json({
        error: 'Internal Server Error',
        message: (error as Error).message,
      });
    }
  }
);

/**
 * GET /api/erp/metrics
 * Get sync metrics
 */
router.get('/metrics', requireAdmin, async (req: Request, res: Response) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const metrics = {
      last24h: {
        total: await ERPSync.count({
          where: { lastSyncAttempt: { $gte: last24h } },
        }),
        success: await ERPSync.count({
          where: {
            syncStatus: SyncStatus.SYNCED,
            lastSyncSuccess: { $gte: last24h },
          },
        }),
        failed: await ERPSync.count({
          where: {
            syncStatus: SyncStatus.FAILED,
            lastSyncAttempt: { $gte: last24h },
          },
        }),
      },
      last7d: {
        total: await ERPSync.count({
          where: { lastSyncAttempt: { $gte: last7d } },
        }),
        success: await ERPSync.count({
          where: {
            syncStatus: SyncStatus.SYNCED,
            lastSyncSuccess: { $gte: last7d },
          },
        }),
        failed: await ERPSync.count({
          where: {
            syncStatus: SyncStatus.FAILED,
            lastSyncAttempt: { $gte: last7d },
          },
        }),
      },
      pending: await ERPSync.count({
        where: { syncStatus: SyncStatus.PENDING },
      }),
      retryQueue: await ERPSync.count({
        where: {
          syncStatus: SyncStatus.FAILED,
          nextRetryAt: { $lte: new Date() },
        },
      }),
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    res.status(500).json({
      error: 'Internal Server Error',
      message: (error as Error).message,
    });
  }
});

// ============================================================================
// Retry Operations
// ============================================================================

/**
 * POST /api/erp/retry/:syncId
 * Retry failed sync
 */
router.post(
  '/retry/:syncId',
  requireAdmin,
  requireERPEnabled,
  [param('syncId').isUUID()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const sync = await ERPSync.findByPk(req.params.syncId);

      if (!sync) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Sync record not found',
        });
      }

      if (!sync.canRetry()) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Sync record cannot be retried (max retries reached)',
        });
      }

      // Reset retry state
      sync.syncStatus = SyncStatus.PENDING;
      sync.nextRetryAt = new Date();
      await sync.save();

      res.json({
        message: 'Sync queued for retry',
        sync,
      });
    } catch (error) {
      logger.error('Failed to retry sync', { error });
      res.status(500).json({
        error: 'Internal Server Error',
        message: (error as Error).message,
      });
    }
  }
);

/**
 * POST /api/erp/skip/:syncId
 * Skip sync record
 */
router.post(
  '/skip/:syncId',
  requireAdmin,
  [param('syncId').isUUID()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const sync = await ERPSync.findByPk(req.params.syncId);

      if (!sync) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Sync record not found',
        });
      }

      sync.syncStatus = SyncStatus.SKIPPED;
      await sync.save();

      res.json({
        message: 'Sync record skipped',
        sync,
      });
    } catch (error) {
      logger.error('Failed to skip sync', { error });
      res.status(500).json({
        error: 'Internal Server Error',
        message: (error as Error).message,
      });
    }
  }
);

export default router;
