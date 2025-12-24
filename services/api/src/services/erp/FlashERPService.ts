import { Op } from 'sequelize';

import { FlashERPClient } from './FlashERPClient';
import { logger } from '../../utils/logger';
import {
  ERPConfiguration,
  HealthStatus,
  SyncStatusEnum,
} from '../../models/erp/ERPConfiguration';
import {
  ERPSync,
  SyncStatus,
  SyncSystem,
  SyncEntityType,
  SyncDirection,
} from '../../models/erp/ERPSync';
import {
  ERPAuditLog,
  AuditAction,
  AuditEntityType,
  AuditStatus,
} from '../../models/erp/ERPAuditLog';
import { Transaction } from '../../models/financial/Transaction';
import { Subscription } from '../../models/financial/Subscription';
import { User } from '../../models/User';
import {
  SyncResult,
  BatchSyncResult,
  HealthCheckResult,
  ERPErrorCode,
  ERPError,
} from '../../types/flasherp';

/**
 * FlashERP Service
 * Business logic for syncing entities to FlashERP
 */
export class FlashERPService {
  private static instance: FlashERPService;
  private client: FlashERPClient | null = null;
  private config: ERPConfiguration | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): FlashERPService {
    if (!FlashERPService.instance) {
      FlashERPService.instance = new FlashERPService();
    }
    return FlashERPService.instance;
  }

  /**
   * Initialize service with configuration
   */
  async initialize(): Promise<void> {
    this.config = await ERPConfiguration.findOne({
      where: { isEnabled: true },
    });

    if (!this.config) {
      logger.warn('FlashERP configuration not found or disabled');
      return;
    }

    this.client = new FlashERPClient(this.config);
    logger.info('FlashERP service initialized');
  }

  /**
   * Get or initialize client
   */
  private async getClient(): Promise<FlashERPClient> {
    if (!this.client || !this.config) {
      await this.initialize();
    }

    if (!this.client) {
      throw new ERPError(
        ERPErrorCode.CONFIG_NOT_FOUND,
        'FlashERP not configured'
      );
    }

    if (!this.config?.isReadyForSync()) {
      throw new ERPError(
        ERPErrorCode.CONFIG_DISABLED,
        'FlashERP integration not enabled or not healthy'
      );
    }

    return this.client;
  }

  // ============================================================================
  // Customer Sync
  // ============================================================================

  /**
   * Sync customer to FlashERP
   */
  async syncCustomer(userId: string): Promise<SyncResult> {
    const startTime = Date.now();

    try {
      // Find existing sync record
      let syncRecord = await ERPSync.findOne({
        where: {
          sourceSystem: SyncSystem.UPCOACH,
          sourceId: userId,
          sourceType: SyncEntityType.CUSTOMER,
        },
      });

      // Create if doesn't exist
      if (!syncRecord) {
        syncRecord = await ERPSync.create({
          sourceSystem: SyncSystem.UPCOACH,
          sourceId: userId,
          sourceType: SyncEntityType.CUSTOMER,
          targetSystem: SyncSystem.FLASHERP,
          targetType: SyncEntityType.CUSTOMER,
          syncStatus: SyncStatus.PENDING,
          syncDirection: SyncDirection.UPCOACH_TO_FLASHERP,
          retryCount: 0,
        });
      }

      // Update sync status
      syncRecord.syncStatus = SyncStatus.SYNCING;
      syncRecord.lastSyncAttempt = new Date();
      await syncRecord.save();

      // Get user data
      const user = await User.findByPk(userId);
      if (!user) {
        throw new ERPError(ERPErrorCode.RESOURCE_NOT_FOUND, 'User not found');
      }

      const client = await this.getClient();

      // Create or update customer in FlashERP
      let flashERPCustomer;
      if (syncRecord.targetId) {
        // Update existing
        flashERPCustomer = await client.updateCustomer(syncRecord.targetId, {
          email: user.email,
          name: user.name || user.email,
          metadata: {
            upcoachUserId: user.id,
            syncedAt: new Date().toISOString(),
          },
        });
      } else {
        // Create new
        flashERPCustomer = await client.createCustomer({
          email: user.email,
          name: user.name || user.email,
          metadata: {
            upcoachUserId: user.id,
            syncedAt: new Date().toISOString(),
          },
        });
      }

      // Update sync record
      const duration = Date.now() - startTime;
      syncRecord.targetId = flashERPCustomer.id;
      syncRecord.syncStatus = SyncStatus.SYNCED;
      syncRecord.lastSyncSuccess = new Date();
      syncRecord.syncDuration = duration;
      syncRecord.errorMessage = null;
      syncRecord.errorCode = null;
      await syncRecord.save();

      // Create audit log
      await ERPAuditLog.create({
        action: AuditAction.SYNC,
        entityType: AuditEntityType.CUSTOMER,
        entityId: userId,
        erpSyncId: syncRecord.id,
        status: AuditStatus.SUCCESS,
        requestPayload: { email: user.email, name: user.name },
        responsePayload: flashERPCustomer,
        duration,
        performedBy: 'system',
      });

      logger.info('Customer synced to FlashERP', {
        userId,
        flashERPCustomerId: flashERPCustomer.id,
      });

      return {
        success: true,
        syncId: syncRecord.id,
        targetId: flashERPCustomer.id,
        message: 'Customer synced successfully',
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      return this.handleSyncError(
        userId,
        SyncEntityType.CUSTOMER,
        error,
        startTime
      );
    }
  }

  // ============================================================================
  // Transaction Sync
  // ============================================================================

  /**
   * Sync transaction to FlashERP
   */
  async syncTransaction(transactionId: string): Promise<SyncResult> {
    const startTime = Date.now();

    try {
      // Find existing sync record
      let syncRecord = await ERPSync.findOne({
        where: {
          sourceSystem: SyncSystem.UPCOACH,
          sourceId: transactionId,
          sourceType: SyncEntityType.TRANSACTION,
        },
      });

      if (!syncRecord) {
        syncRecord = await ERPSync.create({
          sourceSystem: SyncSystem.UPCOACH,
          sourceId: transactionId,
          sourceType: SyncEntityType.TRANSACTION,
          targetSystem: SyncSystem.FLASHERP,
          targetType: SyncEntityType.TRANSACTION,
          syncStatus: SyncStatus.PENDING,
          syncDirection: SyncDirection.UPCOACH_TO_FLASHERP,
          retryCount: 0,
        });
      }

      syncRecord.syncStatus = SyncStatus.SYNCING;
      syncRecord.lastSyncAttempt = new Date();
      await syncRecord.save();

      // Get transaction data
      const transaction = await Transaction.findByPk(transactionId);
      if (!transaction) {
        throw new ERPError(
          ERPErrorCode.RESOURCE_NOT_FOUND,
          'Transaction not found'
        );
      }

      // Ensure customer is synced first
      await this.syncCustomer(transaction.userId);

      // Get customer's FlashERP ID
      const customerSync = await ERPSync.findOne({
        where: {
          sourceSystem: SyncSystem.UPCOACH,
          sourceId: transaction.userId,
          sourceType: SyncEntityType.CUSTOMER,
        },
      });

      if (!customerSync?.targetId) {
        throw new ERPError(
          ERPErrorCode.SYNC_FAILED,
          'Customer not synced to FlashERP'
        );
      }

      const client = await this.getClient();

      // Create transaction in FlashERP
      const flashERPTransaction = await client.createTransaction({
        customerId: customerSync.targetId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status as any,
        type: transaction.type as any,
        paymentMethod: transaction.paymentMethod,
        description: transaction.description,
        upcoachReference: transaction.id,
        stripeTransactionId: transaction.stripeTransactionId,
        metadata: {
          upcoachTransactionId: transaction.id,
          syncedAt: new Date().toISOString(),
        },
      });

      // Update sync record
      const duration = Date.now() - startTime;
      syncRecord.targetId = flashERPTransaction.id;
      syncRecord.syncStatus = SyncStatus.SYNCED;
      syncRecord.lastSyncSuccess = new Date();
      syncRecord.syncDuration = duration;
      syncRecord.errorMessage = null;
      syncRecord.errorCode = null;
      await syncRecord.save();

      // Create audit log
      await ERPAuditLog.create({
        action: AuditAction.SYNC,
        entityType: AuditEntityType.TRANSACTION,
        entityId: transactionId,
        erpSyncId: syncRecord.id,
        status: AuditStatus.SUCCESS,
        requestPayload: {
          amount: transaction.amount,
          currency: transaction.currency,
        },
        responsePayload: flashERPTransaction,
        duration,
        performedBy: 'system',
      });

      logger.info('Transaction synced to FlashERP', {
        transactionId,
        flashERPTransactionId: flashERPTransaction.id,
      });

      return {
        success: true,
        syncId: syncRecord.id,
        targetId: flashERPTransaction.id,
        message: 'Transaction synced successfully',
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      return this.handleSyncError(
        transactionId,
        SyncEntityType.TRANSACTION,
        error,
        startTime
      );
    }
  }

  /**
   * Sync batch of transactions
   */
  async syncTransactionBatch(transactionIds: string[]): Promise<BatchSyncResult> {
    const startTime = Date.now();
    const results: SyncResult[] = [];

    for (const id of transactionIds) {
      const result = await this.syncTransaction(id);
      results.push(result);
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      total: transactionIds.length,
      successful,
      failed,
      skipped: 0,
      results,
      duration: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  // ============================================================================
  // Subscription Sync
  // ============================================================================

  /**
   * Sync subscription to FlashERP
   */
  async syncSubscription(subscriptionId: string): Promise<SyncResult> {
    const startTime = Date.now();

    try {
      let syncRecord = await ERPSync.findOne({
        where: {
          sourceSystem: SyncSystem.UPCOACH,
          sourceId: subscriptionId,
          sourceType: SyncEntityType.SUBSCRIPTION,
        },
      });

      if (!syncRecord) {
        syncRecord = await ERPSync.create({
          sourceSystem: SyncSystem.UPCOACH,
          sourceId: subscriptionId,
          sourceType: SyncEntityType.SUBSCRIPTION,
          targetSystem: SyncSystem.FLASHERP,
          targetType: SyncEntityType.SUBSCRIPTION,
          syncStatus: SyncStatus.PENDING,
          syncDirection: SyncDirection.UPCOACH_TO_FLASHERP,
          retryCount: 0,
        });
      }

      syncRecord.syncStatus = SyncStatus.SYNCING;
      syncRecord.lastSyncAttempt = new Date();
      await syncRecord.save();

      const subscription = await Subscription.findByPk(subscriptionId);
      if (!subscription) {
        throw new ERPError(
          ERPErrorCode.RESOURCE_NOT_FOUND,
          'Subscription not found'
        );
      }

      // Ensure customer is synced
      await this.syncCustomer(subscription.userId);

      const customerSync = await ERPSync.findOne({
        where: {
          sourceSystem: SyncSystem.UPCOACH,
          sourceId: subscription.userId,
          sourceType: SyncEntityType.CUSTOMER,
        },
      });

      if (!customerSync?.targetId) {
        throw new ERPError(
          ERPErrorCode.SYNC_FAILED,
          'Customer not synced to FlashERP'
        );
      }

      const client = await this.getClient();

      // Create or update subscription in FlashERP
      let flashERPSubscription;
      if (syncRecord.targetId) {
        flashERPSubscription = await client.updateSubscription(
          syncRecord.targetId,
          {
            status: subscription.status as any,
            amount: subscription.amount,
            currentPeriodStart: subscription.currentPeriodStart?.toISOString(),
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
            canceledAt: subscription.canceledAt?.toISOString(),
            metadata: {
              upcoachSubscriptionId: subscription.id,
              syncedAt: new Date().toISOString(),
            },
          }
        );
      } else {
        flashERPSubscription = await client.createSubscription({
          customerId: customerSync.targetId,
          plan: subscription.plan,
          status: subscription.status as any,
          billingInterval: subscription.billingInterval as any,
          amount: subscription.amount,
          currency: subscription.currency,
          currentPeriodStart: subscription.currentPeriodStart?.toISOString() || new Date().toISOString(),
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || new Date().toISOString(),
          upcoachReference: subscription.id,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          metadata: {
            upcoachSubscriptionId: subscription.id,
            syncedAt: new Date().toISOString(),
          },
        });
      }

      const duration = Date.now() - startTime;
      syncRecord.targetId = flashERPSubscription.id;
      syncRecord.syncStatus = SyncStatus.SYNCED;
      syncRecord.lastSyncSuccess = new Date();
      syncRecord.syncDuration = duration;
      syncRecord.errorMessage = null;
      syncRecord.errorCode = null;
      await syncRecord.save();

      await ERPAuditLog.create({
        action: AuditAction.SYNC,
        entityType: AuditEntityType.SUBSCRIPTION,
        entityId: subscriptionId,
        erpSyncId: syncRecord.id,
        status: AuditStatus.SUCCESS,
        requestPayload: { plan: subscription.plan, status: subscription.status },
        responsePayload: flashERPSubscription,
        duration,
        performedBy: 'system',
      });

      logger.info('Subscription synced to FlashERP', {
        subscriptionId,
        flashERPSubscriptionId: flashERPSubscription.id,
      });

      return {
        success: true,
        syncId: syncRecord.id,
        targetId: flashERPSubscription.id,
        message: 'Subscription synced successfully',
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      return this.handleSyncError(
        subscriptionId,
        SyncEntityType.SUBSCRIPTION,
        error,
        startTime
      );
    }
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  /**
   * Perform health check
   */
  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const client = await this.getClient();
      const result = await client.testConnection();

      // Update configuration health status
      if (this.config) {
        this.config.healthStatus = result.success
          ? HealthStatus.HEALTHY
          : HealthStatus.DOWN;
        this.config.healthCheckAt = new Date();
        await this.config.save();
      }

      return {
        healthy: result.success,
        status: result.success ? HealthStatus.HEALTHY : HealthStatus.DOWN,
        latency: result.latency,
        message: result.message,
        timestamp: new Date(),
      };
    } catch (error) {
      if (this.config) {
        this.config.healthStatus = HealthStatus.DOWN;
        this.config.healthCheckAt = new Date();
        await this.config.save();
      }

      return {
        healthy: false,
        status: HealthStatus.DOWN,
        message: (error as Error).message,
        timestamp: new Date(),
      };
    }
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Get configuration
   */
  async getConfiguration(): Promise<ERPConfiguration | null> {
    return ERPConfiguration.findOne({ where: { isEnabled: true } });
  }

  /**
   * Update configuration
   */
  async updateConfiguration(
    updates: Partial<ERPConfiguration>
  ): Promise<ERPConfiguration> {
    if (!this.config) {
      throw new ERPError(
        ERPErrorCode.CONFIG_NOT_FOUND,
        'Configuration not found'
      );
    }

    await this.config.update(updates);
    await this.initialize(); // Reinitialize client with new config

    return this.config;
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  /**
   * Handle sync error
   */
  private async handleSyncError(
    sourceId: string,
    sourceType: SyncEntityType,
    error: unknown,
    startTime: number
  ): Promise<SyncResult> {
    const duration = Date.now() - startTime;
    const erpError =
      error instanceof ERPError
        ? error
        : new ERPError(ERPErrorCode.SYNC_FAILED, (error as Error).message);

    try {
      const syncRecord = await ERPSync.findOne({
        where: {
          sourceSystem: SyncSystem.UPCOACH,
          sourceId,
          sourceType,
        },
      });

      if (syncRecord) {
        syncRecord.syncStatus = SyncStatus.FAILED;
        syncRecord.errorMessage = erpError.message;
        syncRecord.errorCode = erpError.code;
        syncRecord.retryCount += 1;
        syncRecord.syncDuration = duration;

        if (syncRecord.canRetry()) {
          syncRecord.nextRetryAt = syncRecord.calculateNextRetry();
        }

        await syncRecord.save();

        // Create audit log
        await ERPAuditLog.create({
          action: AuditAction.SYNC,
          entityType: sourceType as any,
          entityId: sourceId,
          erpSyncId: syncRecord.id,
          status: AuditStatus.FAILED,
          errorDetails: {
            code: erpError.code,
            message: erpError.message,
            details: erpError.details,
          },
          duration,
          performedBy: 'system',
        });
      }
    } catch (dbError) {
      logger.error('Failed to update sync record', { error: dbError });
    }

    logger.error('Sync failed', {
      sourceId,
      sourceType,
      error: erpError.message,
      code: erpError.code,
    });

    return {
      success: false,
      message: erpError.message,
      error: {
        code: erpError.code,
        message: erpError.message,
        details: erpError.details,
      },
      duration,
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const flashERPService = FlashERPService.getInstance();
