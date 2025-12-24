import cron from 'node-cron';
import { Op } from 'sequelize';

import { logger } from '../../utils/logger';
import { flashERPService } from './FlashERPService';
import {
  ERPSync,
  SyncStatus,
  SyncSystem,
  SyncEntityType,
} from '../../models/erp/ERPSync';
import { ERPConfiguration, HealthStatus } from '../../models/erp/ERPConfiguration';
import { Transaction } from '../../models/financial/Transaction';
import { Subscription } from '../../models/financial/Subscription';
import { User } from '../../models/User';
import {
  SyncStats,
  RetryStats,
  ReconciliationReport,
  HealthCheckResult,
} from '../../types/flasherp';

/**
 * FlashERP Sync Scheduler
 * Manages cron-based batch synchronization with FlashERP
 */
export class FlashERPSyncScheduler {
  private static instance: FlashERPSyncScheduler;
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  private constructor() {}

  public static getInstance(): FlashERPSyncScheduler {
    if (!FlashERPSyncScheduler.instance) {
      FlashERPSyncScheduler.instance = new FlashERPSyncScheduler();
    }
    return FlashERPSyncScheduler.instance;
  }

  /**
   * Start all scheduled jobs
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('FlashERP Sync Scheduler already running');
      return;
    }

    const config = await ERPConfiguration.findOne({
      where: { isEnabled: true },
    });

    if (!config || !config.isReadyForSync()) {
      logger.info('FlashERP integration not configured, skipping scheduler start');
      return;
    }

    logger.info('Starting FlashERP Sync Scheduler');

    // Hourly: Sync recent transactions
    this.jobs.set(
      'sync-transactions',
      cron.schedule('0 * * * *', async () => {
        await this.syncRecentTransactions();
      })
    );

    // Every 6 hours: Sync subscriptions
    this.jobs.set(
      'sync-subscriptions',
      cron.schedule('0 */6 * * *', async () => {
        await this.syncSubscriptions();
      })
    );

    // Daily at 2 AM: Full reconciliation
    this.jobs.set(
      'reconciliation',
      cron.schedule('0 2 * * *', async () => {
        await this.fullReconciliation();
      })
    );

    // Every 5 minutes: Process retry queue
    this.jobs.set(
      'retry-queue',
      cron.schedule('*/5 * * * *', async () => {
        await this.processRetryQueue();
      })
    );

    // Every 15 minutes: Health check
    this.jobs.set(
      'health-check',
      cron.schedule('*/15 * * * *', async () => {
        await this.performHealthCheck();
      })
    );

    this.isRunning = true;
    logger.info('FlashERP Sync Scheduler started successfully');
  }

  /**
   * Stop all scheduled jobs
   */
  public stop(): void {
    if (!this.isRunning) {
      logger.warn('FlashERP Sync Scheduler not running');
      return;
    }

    logger.info('Stopping FlashERP Sync Scheduler');

    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped job: ${name}`);
    });

    this.jobs.clear();
    this.isRunning = false;

    logger.info('FlashERP Sync Scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  public getStatus(): { running: boolean; jobs: string[] } {
    return {
      running: this.isRunning,
      jobs: Array.from(this.jobs.keys()),
    };
  }

  /**
   * Sync recent transactions (last 24 hours)
   */
  public async syncRecentTransactions(): Promise<SyncStats> {
    const startTime = Date.now();
    logger.info('Starting recent transaction sync');

    try {
      const config = await ERPConfiguration.findOne({
        where: { isEnabled: true },
      });

      if (!config || !config.syncScope.transactions) {
        logger.info('Transaction sync disabled');
        return this.emptyStats();
      }

      // Get transactions from last 24 hours that haven't been synced
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const transactions = await Transaction.findAll({
        where: {
          createdAt: {
            [Op.gte]: oneDayAgo,
          },
        },
        include: [
          {
            model: ERPSync,
            as: 'erpSync',
            required: false,
            where: {
              sourceSystem: SyncSystem.UPCOACH,
              sourceType: SyncEntityType.TRANSACTION,
              syncStatus: {
                [Op.in]: [SyncStatus.SYNCED, SyncStatus.SYNCING],
              },
            },
          },
        ],
      });

      // Filter out already synced transactions
      const unsyncedTransactions = transactions.filter(
        (t: any) => !t.erpSync || t.erpSync.length === 0
      );

      logger.info(`Found ${unsyncedTransactions.length} unsynced transactions`);

      let successCount = 0;
      let failureCount = 0;
      let skippedCount = 0;

      // Sync in batches of 50
      const batchSize = 50;
      for (let i = 0; i < unsyncedTransactions.length; i += batchSize) {
        const batch = unsyncedTransactions
          .slice(i, i + batchSize)
          .map((t) => t.id);

        const result = await flashERPService.syncTransactionBatch(batch);
        successCount += result.successCount;
        failureCount += result.failureCount;
        skippedCount += result.skippedCount;
      }

      const duration = Date.now() - startTime;

      logger.info('Recent transaction sync completed', {
        total: unsyncedTransactions.length,
        success: successCount,
        failed: failureCount,
        skipped: skippedCount,
        duration,
      });

      return {
        total: unsyncedTransactions.length,
        successCount,
        failureCount,
        skippedCount,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Recent transaction sync failed', { error });
      return this.emptyStats();
    }
  }

  /**
   * Sync all active subscriptions
   */
  public async syncSubscriptions(): Promise<SyncStats> {
    const startTime = Date.now();
    logger.info('Starting subscription sync');

    try {
      const config = await ERPConfiguration.findOne({
        where: { isEnabled: true },
      });

      if (!config || !config.syncScope.subscriptions) {
        logger.info('Subscription sync disabled');
        return this.emptyStats();
      }

      // Get active subscriptions
      const subscriptions = await Subscription.findAll({
        where: {
          status: {
            [Op.in]: ['active', 'trialing', 'past_due'],
          },
        },
      });

      logger.info(`Found ${subscriptions.length} active subscriptions`);

      let successCount = 0;
      let failureCount = 0;
      let skippedCount = 0;

      // Sync sequentially to avoid rate limits
      for (const subscription of subscriptions) {
        const result = await flashERPService.syncSubscription(subscription.id);

        if (result.success) {
          successCount++;
        } else if (result.skipped) {
          skippedCount++;
        } else {
          failureCount++;
        }

        // Rate limiting: 10 requests per second max
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const duration = Date.now() - startTime;

      logger.info('Subscription sync completed', {
        total: subscriptions.length,
        success: successCount,
        failed: failureCount,
        skipped: skippedCount,
        duration,
      });

      return {
        total: subscriptions.length,
        successCount,
        failureCount,
        skippedCount,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Subscription sync failed', { error });
      return this.emptyStats();
    }
  }

  /**
   * Process retry queue for failed syncs
   */
  public async processRetryQueue(): Promise<RetryStats> {
    const startTime = Date.now();
    logger.info('Processing retry queue');

    try {
      // Get failed syncs that are ready for retry
      const failedSyncs = await ERPSync.findAll({
        where: {
          syncStatus: SyncStatus.FAILED,
          nextRetryAt: {
            [Op.lte]: new Date(),
          },
          retryCount: {
            [Op.lt]: 5, // Max 5 retries
          },
        },
        limit: 100, // Process max 100 at a time
        order: [['nextRetryAt', 'ASC']],
      });

      logger.info(`Found ${failedSyncs.length} syncs ready for retry`);

      let successCount = 0;
      let failureCount = 0;
      let skippedCount = 0;

      for (const sync of failedSyncs) {
        try {
          let result;

          switch (sync.sourceType) {
            case SyncEntityType.TRANSACTION:
              result = await flashERPService.syncTransaction(sync.sourceId);
              break;
            case SyncEntityType.SUBSCRIPTION:
              result = await flashERPService.syncSubscription(sync.sourceId);
              break;
            case SyncEntityType.CUSTOMER:
              result = await flashERPService.syncCustomer(sync.sourceId);
              break;
            default:
              skippedCount++;
              continue;
          }

          if (result.success) {
            successCount++;
          } else {
            failureCount++;
          }

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          logger.error('Retry failed', {
            syncId: sync.id,
            sourceType: sync.sourceType,
            error,
          });
          failureCount++;
        }
      }

      const duration = Date.now() - startTime;

      logger.info('Retry queue processing completed', {
        total: failedSyncs.length,
        success: successCount,
        failed: failureCount,
        skipped: skippedCount,
        duration,
      });

      return {
        totalRetried: failedSyncs.length,
        successCount,
        failureCount,
        skippedCount,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Retry queue processing failed', { error });
      return {
        totalRetried: 0,
        successCount: 0,
        failureCount: 0,
        skippedCount: 0,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Perform full reconciliation
   */
  public async fullReconciliation(): Promise<ReconciliationReport> {
    const startTime = Date.now();
    logger.info('Starting full reconciliation');

    try {
      const config = await ERPConfiguration.findOne({
        where: { isEnabled: true },
      });

      if (!config) {
        throw new Error('FlashERP not configured');
      }

      // Get all synced records
      const syncedRecords = await ERPSync.findAll({
        where: {
          syncStatus: SyncStatus.SYNCED,
        },
      });

      const missingInFlashERP: string[] = [];
      const discrepancies: Array<{
        id: string;
        type: string;
        issue: string;
      }> = [];

      // Check transactions
      if (config.syncScope.transactions) {
        const transactions = await Transaction.findAll({
          where: {
            createdAt: {
              [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            },
          },
        });

        for (const transaction of transactions) {
          const syncRecord = syncedRecords.find(
            (s) =>
              s.sourceType === SyncEntityType.TRANSACTION &&
              s.sourceId === transaction.id
          );

          if (!syncRecord) {
            missingInFlashERP.push(`transaction:${transaction.id}`);
          }
        }
      }

      // Check subscriptions
      if (config.syncScope.subscriptions) {
        const subscriptions = await Subscription.findAll({
          where: {
            status: {
              [Op.in]: ['active', 'trialing', 'past_due'],
            },
          },
        });

        for (const subscription of subscriptions) {
          const syncRecord = syncedRecords.find(
            (s) =>
              s.sourceType === SyncEntityType.SUBSCRIPTION &&
              s.sourceId === subscription.id
          );

          if (!syncRecord) {
            missingInFlashERP.push(`subscription:${subscription.id}`);
          }
        }
      }

      const duration = Date.now() - startTime;

      // Update config with last full sync
      config.lastFullSync = new Date();
      config.lastSyncStatus =
        missingInFlashERP.length === 0 && discrepancies.length === 0
          ? 'success'
          : 'partial';
      await config.save();

      const report: ReconciliationReport = {
        totalChecked: syncedRecords.length,
        missingInFlashERP,
        missingInUpCoach: [],
        discrepancies,
        syncedCorrectly:
          syncedRecords.length -
          missingInFlashERP.length -
          discrepancies.length,
        duration,
        timestamp: new Date(),
      };

      logger.info('Full reconciliation completed', report);

      return report;
    } catch (error) {
      logger.error('Full reconciliation failed', { error });
      throw error;
    }
  }

  /**
   * Perform health check
   */
  public async performHealthCheck(): Promise<HealthCheckResult> {
    logger.info('Performing FlashERP health check');

    try {
      const result = await flashERPService.healthCheck();

      // Update configuration health status
      const config = await ERPConfiguration.findOne({
        where: { isEnabled: true },
      });

      if (config) {
        config.healthStatus = result.healthy
          ? HealthStatus.HEALTHY
          : HealthStatus.DOWN;
        config.healthCheckAt = new Date();
        await config.save();
      }

      return result;
    } catch (error) {
      logger.error('Health check failed', { error });

      // Update configuration
      const config = await ERPConfiguration.findOne({
        where: { isEnabled: true },
      });

      if (config) {
        config.healthStatus = HealthStatus.DOWN;
        config.healthCheckAt = new Date();
        await config.save();
      }

      return {
        healthy: false,
        message: (error as Error).message,
        checks: {},
        timestamp: new Date(),
      };
    }
  }

  /**
   * Helper: Empty stats object
   */
  private emptyStats(): SyncStats {
    return {
      total: 0,
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
      duration: 0,
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const flashERPSyncScheduler = FlashERPSyncScheduler.getInstance();
