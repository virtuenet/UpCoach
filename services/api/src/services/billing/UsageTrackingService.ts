import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { TenantRedisClient } from '../../infrastructure/redis/TenantRedisClient';

/**
 * Usage Tracking Service
 *
 * Tracks tenant usage for billing purposes:
 * - API calls per endpoint
 * - Storage usage (GB-hours)
 * - AI credits consumed
 * - Active users per month
 * - Bandwidth (GB transferred)
 *
 * Features:
 * - Real-time metering
 * - Aggregation by billing period
 * - Overage detection and alerts
 * - Usage reporting
 */

export interface UsageEvent {
  tenantId: string;
  userId?: string;
  eventType: 'api_call' | 'storage' | 'ai_credit' | 'bandwidth';
  resource: string;
  quantity: number;
  metadata?: Record<string, any>;
}

export interface UsageSummary {
  tenantId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  apiCalls: number;
  storageGBHours: number;
  aiCredits: number;
  activeUsers: number;
  bandwidthGB: number;
  totalCost: number;
}

export interface UsageLimit {
  apiCalls?: number;
  storageGB?: number;
  aiCredits?: number;
  activeUsers?: number;
  bandwidthGB?: number;
}

export class UsageTrackingService {
  private db: Pool;
  private redisClientFactory: typeof import('../../infrastructure/redis/TenantRedisClient').TenantRedisClientFactory;

  constructor(db: Pool, redisClientFactory: any) {
    this.db = db;
    this.redisClientFactory = redisClientFactory;
  }

  /**
   * Track usage event
   */
  async trackUsage(event: UsageEvent): Promise<void> {
    try {
      // Write to database (async)
      this.persistUsageEvent(event).catch((err) => {
        logger.error('Failed to persist usage event', {
          event,
          error: err.message,
        });
      });

      // Update Redis counters for real-time tracking
      await this.updateRealTimeCounters(event);

      // Check for overage
      await this.checkOverage(event.tenantId);

      logger.debug('Usage tracked', {
        tenantId: event.tenantId,
        eventType: event.eventType,
        quantity: event.quantity,
      });
    } catch (error) {
      logger.error('Usage tracking failed', {
        event,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Track API call
   */
  async trackApiCall(
    tenantId: string,
    userId: string | undefined,
    endpoint: string,
    method: string
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      userId,
      eventType: 'api_call',
      resource: `${method} ${endpoint}`,
      quantity: 1,
      metadata: { method, endpoint },
    });
  }

  /**
   * Track storage usage
   */
  async trackStorage(tenantId: string, sizeBytes: number): Promise<void> {
    const sizeGB = sizeBytes / (1024 * 1024 * 1024);

    await this.trackUsage({
      tenantId,
      eventType: 'storage',
      resource: 'file_storage',
      quantity: sizeGB,
      metadata: { sizeBytes },
    });
  }

  /**
   * Track AI credit consumption
   */
  async trackAICredit(
    tenantId: string,
    userId: string,
    modelName: string,
    credits: number
  ): Promise<void> {
    await this.trackUsage({
      tenantId,
      userId,
      eventType: 'ai_credit',
      resource: modelName,
      quantity: credits,
      metadata: { modelName },
    });
  }

  /**
   * Track bandwidth usage
   */
  async trackBandwidth(tenantId: string, bytesTransferred: number): Promise<void> {
    const bandwidthGB = bytesTransferred / (1024 * 1024 * 1024);

    await this.trackUsage({
      tenantId,
      eventType: 'bandwidth',
      resource: 'data_transfer',
      quantity: bandwidthGB,
      metadata: { bytesTransferred },
    });
  }

  /**
   * Get usage summary for current billing period
   */
  async getUsageSummary(tenantId: string): Promise<UsageSummary> {
    const { start, end } = this.getCurrentBillingPeriod();

    const query = `
      WITH usage_stats AS (
        SELECT
          event_type,
          SUM(quantity) AS total_quantity,
          COUNT(*) AS event_count
        FROM tenant_usage_events
        WHERE tenant_id = $1
          AND created_at >= $2
          AND created_at < $3
        GROUP BY event_type
      ),

      active_users_count AS (
        SELECT COUNT(DISTINCT user_id) AS active_users
        FROM tenant_usage_events
        WHERE tenant_id = $1
          AND user_id IS NOT NULL
          AND created_at >= $2
          AND created_at < $3
      )

      SELECT
        COALESCE(SUM(CASE WHEN event_type = 'api_call' THEN total_quantity ELSE 0 END), 0) AS api_calls,
        COALESCE(SUM(CASE WHEN event_type = 'storage' THEN total_quantity ELSE 0 END), 0) AS storage_gb_hours,
        COALESCE(SUM(CASE WHEN event_type = 'ai_credit' THEN total_quantity ELSE 0 END), 0) AS ai_credits,
        COALESCE(SUM(CASE WHEN event_type = 'bandwidth' THEN total_quantity ELSE 0 END), 0) AS bandwidth_gb,
        (SELECT active_users FROM active_users_count) AS active_users
      FROM usage_stats
    `;

    const result = await this.db.query(query, [tenantId, start, end]);
    const row = result.rows[0];

    const apiCalls = parseInt(row.api_calls);
    const storageGBHours = parseFloat(row.storage_gb_hours);
    const aiCredits = parseFloat(row.ai_credits);
    const bandwidthGB = parseFloat(row.bandwidth_gb);
    const activeUsers = parseInt(row.active_users || 0);

    // Calculate total cost based on pricing tiers
    const totalCost = this.calculateCost({
      apiCalls,
      storageGBHours,
      aiCredits,
      bandwidthGB,
      activeUsers,
    });

    return {
      tenantId,
      billingPeriodStart: start.toISOString(),
      billingPeriodEnd: end.toISOString(),
      apiCalls,
      storageGBHours,
      aiCredits,
      activeUsers,
      bandwidthGB,
      totalCost,
    };
  }

  /**
   * Get usage breakdown by resource
   */
  async getUsageBreakdown(
    tenantId: string,
    eventType: string
  ): Promise<Array<{ resource: string; quantity: number }>> {
    const { start, end } = this.getCurrentBillingPeriod();

    const query = `
      SELECT
        resource,
        SUM(quantity) AS total_quantity
      FROM tenant_usage_events
      WHERE tenant_id = $1
        AND event_type = $2
        AND created_at >= $3
        AND created_at < $4
      GROUP BY resource
      ORDER BY total_quantity DESC
    `;

    const result = await this.db.query(query, [tenantId, eventType, start, end]);

    return result.rows.map((row) => ({
      resource: row.resource,
      quantity: parseFloat(row.total_quantity),
    }));
  }

  /**
   * Set usage limits for tenant
   */
  async setUsageLimits(tenantId: string, limits: UsageLimit): Promise<void> {
    const query = `
      INSERT INTO tenant_usage_limits (
        tenant_id, api_calls, storage_gb, ai_credits,
        active_users, bandwidth_gb, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (tenant_id) DO UPDATE
      SET api_calls = $2, storage_gb = $3, ai_credits = $4,
          active_users = $5, bandwidth_gb = $6, updated_at = NOW()
    `;

    await this.db.query(query, [
      tenantId,
      limits.apiCalls,
      limits.storageGB,
      limits.aiCredits,
      limits.activeUsers,
      limits.bandwidthGB,
    ]);

    logger.info('Usage limits updated', { tenantId, limits });
  }

  /**
   * Check if tenant has exceeded usage limits
   */
  async checkOverage(tenantId: string): Promise<void> {
    const usage = await this.getUsageSummary(tenantId);
    const limits = await this.getUsageLimits(tenantId);

    if (!limits) {
      return;
    }

    const overages: string[] = [];

    if (limits.apiCalls && usage.apiCalls > limits.apiCalls) {
      overages.push(`API calls: ${usage.apiCalls} / ${limits.apiCalls}`);
    }

    if (limits.storageGB && usage.storageGBHours > limits.storageGB) {
      overages.push(`Storage: ${usage.storageGBHours.toFixed(2)}GB / ${limits.storageGB}GB`);
    }

    if (limits.aiCredits && usage.aiCredits > limits.aiCredits) {
      overages.push(`AI credits: ${usage.aiCredits} / ${limits.aiCredits}`);
    }

    if (limits.activeUsers && usage.activeUsers > limits.activeUsers) {
      overages.push(`Active users: ${usage.activeUsers} / ${limits.activeUsers}`);
    }

    if (limits.bandwidthGB && usage.bandwidthGB > limits.bandwidthGB) {
      overages.push(`Bandwidth: ${usage.bandwidthGB.toFixed(2)}GB / ${limits.bandwidthGB}GB`);
    }

    if (overages.length > 0) {
      logger.warn('Usage overage detected', {
        tenantId,
        overages,
      });

      // Trigger overage alert (email, webhook, etc.)
      await this.triggerOverageAlert(tenantId, overages);
    }
  }

  /**
   * Get usage limits for tenant
   */
  private async getUsageLimits(tenantId: string): Promise<UsageLimit | null> {
    const query = `
      SELECT * FROM tenant_usage_limits
      WHERE tenant_id = $1
    `;
    const result = await this.db.query(query, [tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      apiCalls: row.api_calls,
      storageGB: row.storage_gb,
      aiCredits: row.ai_credits,
      activeUsers: row.active_users,
      bandwidthGB: row.bandwidth_gb,
    };
  }

  /**
   * Persist usage event to database
   */
  private async persistUsageEvent(event: UsageEvent): Promise<void> {
    const query = `
      INSERT INTO tenant_usage_events (
        tenant_id, user_id, event_type, resource,
        quantity, metadata, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;

    await this.db.query(query, [
      event.tenantId,
      event.userId,
      event.eventType,
      event.resource,
      event.quantity,
      JSON.stringify(event.metadata || {}),
    ]);
  }

  /**
   * Update real-time counters in Redis
   */
  private async updateRealTimeCounters(event: UsageEvent): Promise<void> {
    const redis = this.redisClientFactory.getClient(event.tenantId);
    const key = `usage:${event.eventType}`;

    await redis.increment('billing', key, event.quantity);
  }

  /**
   * Get current billing period (monthly cycle)
   */
  private getCurrentBillingPeriod(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return { start, end };
  }

  /**
   * Calculate total cost based on usage
   */
  private calculateCost(usage: {
    apiCalls: number;
    storageGBHours: number;
    aiCredits: number;
    bandwidthGB: number;
    activeUsers: number;
  }): number {
    // Pricing (example rates)
    const rates = {
      apiCallsPer1000: 0.01, // $0.01 per 1000 API calls
      storageGBPerMonth: 0.023, // $0.023 per GB-month (AWS S3 pricing)
      aiCreditPer1000: 0.50, // $0.50 per 1000 AI credits
      bandwidthGBPer1: 0.09, // $0.09 per GB bandwidth
      activeUserPerMonth: 5.00, // $5.00 per active user per month
    };

    const apiCost = (usage.apiCalls / 1000) * rates.apiCallsPer1000;
    const storageCost = usage.storageGBHours * rates.storageGBPerMonth;
    const aiCost = (usage.aiCredits / 1000) * rates.aiCreditPer1000;
    const bandwidthCost = usage.bandwidthGB * rates.bandwidthGBPer1;
    const userCost = usage.activeUsers * rates.activeUserPerMonth;

    return parseFloat((apiCost + storageCost + aiCost + bandwidthCost + userCost).toFixed(2));
  }

  /**
   * Trigger overage alert
   */
  private async triggerOverageAlert(tenantId: string, overages: string[]): Promise<void> {
    // Insert overage alert record
    const query = `
      INSERT INTO tenant_overage_alerts (tenant_id, overages, created_at)
      VALUES ($1, $2, NOW())
    `;
    await this.db.query(query, [tenantId, JSON.stringify(overages)]);

    // TODO: Send email notification to tenant admin
    // TODO: Post webhook to tenant's configured URL
  }
}
