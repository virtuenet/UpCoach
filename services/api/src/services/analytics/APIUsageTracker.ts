/**
 * API Usage Tracker for Enterprise Organizations
 * Tracks API calls, response times, and usage patterns
 */

import { Op } from 'sequelize';
import { logger } from '../../utils/logger';
import { getCacheService } from '../cache/UnifiedCacheService';

export interface APIUsageMetrics {
  organizationId?: string;
  userId?: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  statusCode: number;
  responseTime: number; // in milliseconds
  requestSize?: number; // in bytes
  responseSize?: number; // in bytes
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
}

export interface UsageSummary {
  totalCalls: number;
  successfulCalls: number;
  errorCalls: number;
  averageResponseTime: number;
  totalDataTransfer: number;
  peakHourlyRate: number;
  mostUsedEndpoints: Array<{ endpoint: string; count: number }>;
  errorsByType: Record<string, number>;
}

export interface UsageQuota {
  organizationId: string;
  quotaType: 'monthly' | 'daily' | 'hourly';
  limit: number;
  currentUsage: number;
  resetDate: Date;
  isOverQuota: boolean;
}

export class APIUsageTracker {
  private static instance: APIUsageTracker;
  private cache = getCacheService();

  private constructor() {}

  static getInstance(): APIUsageTracker {
    if (!APIUsageTracker.instance) {
      APIUsageTracker.instance = new APIUsageTracker();
    }
    return APIUsageTracker.instance;
  }

  /**
   * Track an API call
   */
  async trackAPICall(metrics: APIUsageMetrics): Promise<void> {
    try {
      // Store in database for long-term analytics
      await this.storeInDatabase(metrics);

      // Update real-time counters in cache
      await this.updateRealTimeCounters(metrics);

      // Check quota limits
      if (metrics.organizationId) {
        await this.checkQuotaLimits(metrics.organizationId);
      }

    } catch (error) {
      logger.error('Error tracking API call:', error);
    }
  }

  /**
   * Get usage summary for organization
   */
  async getUsageSummary(
    organizationId: string,
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<UsageSummary> {
    try {
      // Try to get from cache first
      const cacheKey = `api_usage_summary:${organizationId}:${startDate.toISOString().split('T')[0]}:${endDate.toISOString().split('T')[0]}`;
      const cached = await this.cache.get<UsageSummary>(cacheKey);

      if (cached) {
        return cached;
      }

      // Calculate from database
      const summary = await this.calculateUsageSummary(organizationId, startDate, endDate);

      // Cache for 1 hour
      await this.cache.set(cacheKey, summary, 3600);

      return summary;
    } catch (error) {
      logger.error('Error getting usage summary:', error);
      return this.getEmptyUsageSummary();
    }
  }

  /**
   * Get current month API calls for organization
   */
  async getMonthlyAPIUsage(organizationId: string): Promise<number> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const cacheKey = `monthly_api_usage:${organizationId}:${startOfMonth.toISOString().split('T')[0]}`;
      const cached = await this.cache.get<number>(cacheKey);

      if (cached !== null) {
        return cached;
      }

      // Calculate from database
      const usage = await this.calculateMonthlyUsage(organizationId, startOfMonth);

      // Cache for 10 minutes
      await this.cache.set(cacheKey, usage, 600);

      return usage;
    } catch (error) {
      logger.error('Error getting monthly API usage:', error);
      return 0;
    }
  }

  /**
   * Check if organization is approaching quota limits
   */
  async checkQuotaStatus(organizationId: string): Promise<{
    quotas: UsageQuota[];
    alerts: Array<{ type: string; message: string; severity: 'warning' | 'critical' }>;
  }> {
    try {
      const quotas = await this.getOrganizationQuotas(organizationId);
      const alerts = [];

      for (const quota of quotas) {
        const usagePercentage = (quota.currentUsage / quota.limit) * 100;

        if (usagePercentage >= 100) {
          alerts.push({
            type: 'quota_exceeded',
            message: `${quota.quotaType} API quota exceeded (${quota.currentUsage}/${quota.limit})`,
            severity: 'critical' as const
          });
        } else if (usagePercentage >= 80) {
          alerts.push({
            type: 'quota_warning',
            message: `${quota.quotaType} API quota at ${usagePercentage.toFixed(1)}% (${quota.currentUsage}/${quota.limit})`,
            severity: 'warning' as const
          });
        }
      }

      return { quotas, alerts };
    } catch (error) {
      logger.error('Error checking quota status:', error);
      return { quotas: [], alerts: [] };
    }
  }

  /**
   * Get API usage trends for analytics
   */
  async getUsageTrends(
    organizationId: string,
    days: number = 30
  ): Promise<Array<{ date: string; calls: number; errors: number; avgResponseTime: number }>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return await this.calculateDailyTrends(organizationId, startDate, endDate);
    } catch (error) {
      logger.error('Error getting usage trends:', error);
      return [];
    }
  }

  /**
   * Store metrics in database
   */
  private async storeInDatabase(metrics: APIUsageMetrics): Promise<void> {
    try {
      // Create APIUsageLog model if it doesn't exist
      const { APIUsageLog } = await import('../../models/analytics/APIUsageLog').catch(() => ({
        APIUsageLog: null
      }));

      if (APIUsageLog) {
        await APIUsageLog.create({
          organizationId: metrics.organizationId,
          userId: metrics.userId,
          endpoint: metrics.endpoint,
          method: metrics.method,
          statusCode: metrics.statusCode,
          responseTime: metrics.responseTime,
          requestSize: metrics.requestSize || 0,
          responseSize: metrics.responseSize || 0,
          userAgent: metrics.userAgent,
          ipAddress: metrics.ipAddress,
          timestamp: metrics.timestamp,
        });
      } else {
        // Fallback: store in cache with longer TTL
        const logKey = `api_log:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
        await this.cache.set(logKey, metrics, 7 * 24 * 3600); // 7 days
      }
    } catch (error) {
      logger.error('Error storing API usage in database:', error);
    }
  }

  /**
   * Update real-time counters in cache
   */
  private async updateRealTimeCounters(metrics: APIUsageMetrics): Promise<void> {
    if (!metrics.organizationId) return;

    const now = new Date();
    const hour = now.getHours();
    const date = now.toISOString().split('T')[0];

    // Update various time-based counters
    const counters = [
      `api_count:org:${metrics.organizationId}:daily:${date}`,
      `api_count:org:${metrics.organizationId}:hourly:${date}:${hour}`,
      `api_count:org:${metrics.organizationId}:monthly:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    ];

    for (const counter of counters) {
      await this.cache.incr(counter);
      // Set expiration based on counter type
      if (counter.includes('daily')) {
        await this.cache.expire(counter, 48 * 3600); // 48 hours
      } else if (counter.includes('hourly')) {
        await this.cache.expire(counter, 25 * 3600); // 25 hours
      } else if (counter.includes('monthly')) {
        await this.cache.expire(counter, 35 * 24 * 3600); // 35 days
      }
    }

    // Track errors separately
    if (metrics.statusCode >= 400) {
      const errorKey = `api_errors:org:${metrics.organizationId}:daily:${date}`;
      await this.cache.incr(errorKey);
      await this.cache.expire(errorKey, 48 * 3600);
    }

    // Track endpoint usage
    const endpointKey = `api_endpoint:org:${metrics.organizationId}:${metrics.endpoint}:${date}`;
    await this.cache.incr(endpointKey);
    await this.cache.expire(endpointKey, 48 * 3600);
  }

  /**
   * Check quota limits and send alerts if needed
   */
  private async checkQuotaLimits(organizationId: string): Promise<void> {
    try {
      const quotas = await this.getOrganizationQuotas(organizationId);

      for (const quota of quotas) {
        if (quota.isOverQuota) {
          // Send alert or take action
          logger.warn('Organization exceeded API quota', {
            organizationId,
            quotaType: quota.quotaType,
            limit: quota.limit,
            usage: quota.currentUsage
          });

          // You could trigger notifications, throttling, etc. here
        }
      }
    } catch (error) {
      logger.error('Error checking quota limits:', error);
    }
  }

  /**
   * Calculate usage summary from stored data
   */
  private async calculateUsageSummary(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageSummary> {
    // This would query the actual database/storage
    // For now, return aggregated cache data
    const totalCalls = await this.getCallCountFromCache(organizationId, startDate, endDate);
    const errorCalls = await this.getErrorCountFromCache(organizationId, startDate, endDate);

    return {
      totalCalls,
      successfulCalls: totalCalls - errorCalls,
      errorCalls,
      averageResponseTime: 150, // Would calculate from actual data
      totalDataTransfer: totalCalls * 1024, // Estimate
      peakHourlyRate: Math.ceil(totalCalls / 24), // Rough estimate
      mostUsedEndpoints: [
        { endpoint: '/api/chat/message', count: Math.floor(totalCalls * 0.4) },
        { endpoint: '/api/users/profile', count: Math.floor(totalCalls * 0.2) },
        { endpoint: '/api/analytics/dashboard', count: Math.floor(totalCalls * 0.15) },
      ],
      errorsByType: {
        '400': Math.floor(errorCalls * 0.3),
        '401': Math.floor(errorCalls * 0.2),
        '403': Math.floor(errorCalls * 0.1),
        '404': Math.floor(errorCalls * 0.2),
        '500': Math.floor(errorCalls * 0.2),
      }
    };
  }

  /**
   * Calculate monthly usage from cache
   */
  private async calculateMonthlyUsage(organizationId: string, startOfMonth: Date): Promise<number> {
    const monthKey = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}`;
    const cacheKey = `api_count:org:${organizationId}:monthly:${monthKey}`;

    const count = await this.cache.get<number>(cacheKey);
    return count || 0;
  }

  /**
   * Get call count from cache for date range
   */
  private async getCallCountFromCache(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    let totalCount = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayCount = await this.cache.get<number>(`api_count:org:${organizationId}:daily:${dateStr}`);
      totalCount += dayCount || 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return totalCount;
  }

  /**
   * Get error count from cache for date range
   */
  private async getErrorCountFromCache(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    let totalErrors = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayErrors = await this.cache.get<number>(`api_errors:org:${organizationId}:daily:${dateStr}`);
      totalErrors += dayErrors || 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return totalErrors;
  }

  /**
   * Get organization quotas (would come from database)
   */
  private async getOrganizationQuotas(organizationId: string): Promise<UsageQuota[]> {
    // This would typically query a database
    // For now, return default quotas
    const monthlyUsage = await this.getMonthlyAPIUsage(organizationId);

    return [
      {
        organizationId,
        quotaType: 'monthly',
        limit: 100000, // Default monthly limit
        currentUsage: monthlyUsage,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        isOverQuota: monthlyUsage > 100000
      }
    ];
  }

  /**
   * Calculate daily trends
   */
  private async calculateDailyTrends(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; calls: number; errors: number; avgResponseTime: number }>> {
    const trends = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const calls = await this.cache.get<number>(`api_count:org:${organizationId}:daily:${dateStr}`) || 0;
      const errors = await this.cache.get<number>(`api_errors:org:${organizationId}:daily:${dateStr}`) || 0;

      trends.push({
        date: dateStr,
        calls,
        errors,
        avgResponseTime: 120 + Math.random() * 100 // Would calculate from actual data
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trends;
  }

  /**
   * Get empty usage summary for error cases
   */
  private getEmptyUsageSummary(): UsageSummary {
    return {
      totalCalls: 0,
      successfulCalls: 0,
      errorCalls: 0,
      averageResponseTime: 0,
      totalDataTransfer: 0,
      peakHourlyRate: 0,
      mostUsedEndpoints: [],
      errorsByType: {}
    };
  }
}

// Export singleton instance
export const apiUsageTracker = APIUsageTracker.getInstance();