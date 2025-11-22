/**
 * Multi-Platform Advertising Integration Service
 *
 * Central service for managing integrations with multiple advertising platforms
 * including Google Ads, Meta Ads, and LinkedIn Ads.
 *
 * Features:
 * - Unified API interface for all ad platforms
 * - Real-time data synchronization
 * - Error handling and retry mechanisms
 * - Rate limiting and quota management
 * - Data normalization across platforms
 */

import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { GoogleAdsClient } from './platforms/GoogleAdsClient';
import { MetaAdsClient } from './platforms/MetaAdsClient';
import { LinkedInAdsClient } from './platforms/LinkedInAdsClient';
import { DataNormalizer } from './DataNormalizer';
import { RateLimiter } from '../../../utils/RateLimiter';
import { CircuitBreaker } from '../../../utils/CircuitBreaker';
import { MetricsCollector } from '../../../utils/MetricsCollector';

export interface AdPlatformConfig {
  googleAds?: {
    developerToken: string;
    clientCustomerId: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
  metaAds?: {
    appId: string;
    appSecret: string;
    accessToken: string;
    businessId: string;
  };
  linkedInAds?: {
    clientId: string;
    clientSecret: string;
    accessToken: string;
    accountId: string;
  };
}

export interface CampaignData {
  platform: 'google' | 'meta' | 'linkedin';
  campaignId: string;
  campaignName: string;
  status: string;
  startDate: Date;
  endDate?: Date;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
  metadata: Record<string, any>;
}

export interface AdPerformanceMetrics {
  timestamp: Date;
  platform: string;
  campaignId: string;
  adSetId?: string;
  adId?: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  videoViews?: number;
  engagement?: number;
  reach?: number;
  frequency?: number;
  qualityScore?: number;
  relevanceScore?: number;
  demographics?: {
    age?: string[];
    gender?: string[];
    location?: string[];
    interests?: string[];
  };
  devices?: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

export class AdPlatformIntegrationService extends EventEmitter {
  private logger: Logger;
  private redis: Redis;
  private db: Pool;
  private googleAdsClient?: GoogleAdsClient;
  private metaAdsClient?: MetaAdsClient;
  private linkedInAdsClient?: LinkedInAdsClient;
  private normalizer: DataNormalizer;
  private rateLimiter: RateLimiter;
  private circuitBreaker: CircuitBreaker;
  private metricsCollector: MetricsCollector;
  private syncInterval?: NodeJS.Timer;
  private webhookHandlers: Map<string, Function>;

  constructor(
    config: AdPlatformConfig,
    logger: Logger,
    redis: Redis,
    db: Pool
  ) {
    super();
    this.logger = logger;
    this.redis = redis;
    this.db = db;
    this.normalizer = new DataNormalizer();
    this.rateLimiter = new RateLimiter(redis);
    this.circuitBreaker = new CircuitBreaker();
    this.metricsCollector = new MetricsCollector();
    this.webhookHandlers = new Map();

    this.initializePlatforms(config);
  }

  private initializePlatforms(config: AdPlatformConfig): void {
    if (config.googleAds) {
      this.googleAdsClient = new GoogleAdsClient(
        config.googleAds,
        this.logger,
        this.rateLimiter
      );
      this.logger.info('Google Ads client initialized');
    }

    if (config.metaAds) {
      this.metaAdsClient = new MetaAdsClient(
        config.metaAds,
        this.logger,
        this.rateLimiter
      );
      this.logger.info('Meta Ads client initialized');
    }

    if (config.linkedInAds) {
      this.linkedInAdsClient = new LinkedInAdsClient(
        config.linkedInAds,
        this.logger,
        this.rateLimiter
      );
      this.logger.info('LinkedIn Ads client initialized');
    }
  }

  /**
   * Start real-time data synchronization
   */
  public async startSync(intervalMs: number = 300000): Promise<void> {
    this.logger.info('Starting ad platform sync', { intervalMs });

    // Initial sync
    await this.syncAllPlatforms();

    // Set up interval sync
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncAllPlatforms();
      } catch (error) {
        this.logger.error('Sync failed', error);
        this.emit('sync:error', error);
      }
    }, intervalMs);

    // Set up webhook listeners for real-time updates
    this.setupWebhooks();
  }

  /**
   * Stop data synchronization
   */
  public stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
    this.logger.info('Ad platform sync stopped');
  }

  /**
   * Sync data from all configured platforms
   */
  private async syncAllPlatforms(): Promise<void> {
    const startTime = Date.now();
    const results = [];

    try {
      // Sync in parallel with circuit breaker protection
      const syncPromises = [];

      if (this.googleAdsClient) {
        syncPromises.push(
          this.circuitBreaker.execute('google', () =>
            this.syncGoogleAds()
          )
        );
      }

      if (this.metaAdsClient) {
        syncPromises.push(
          this.circuitBreaker.execute('meta', () =>
            this.syncMetaAds()
          )
        );
      }

      if (this.linkedInAdsClient) {
        syncPromises.push(
          this.circuitBreaker.execute('linkedin', () =>
            this.syncLinkedInAds()
          )
        );
      }

      const syncResults = await Promise.allSettled(syncPromises);

      // Process results
      for (const result of syncResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          this.logger.error('Platform sync failed', {
            error: result.reason
          });
        }
      }

      // Update metrics
      const duration = Date.now() - startTime;
      this.metricsCollector.recordSyncDuration(duration);
      this.metricsCollector.recordSyncSuccess(results.length);

      this.logger.info('All platforms synced', {
        duration,
        platforms: results.length
      });

      this.emit('sync:complete', { results, duration });
    } catch (error) {
      this.logger.error('Sync all platforms failed', error);
      this.metricsCollector.recordSyncFailure();
      throw error;
    }
  }

  /**
   * Sync Google Ads data
   */
  private async syncGoogleAds(): Promise<unknown> {
    if (!this.googleAdsClient) {
      throw new Error('Google Ads client not configured');
    }

    const data = await this.googleAdsClient.fetchCampaignData();
    const normalized = this.normalizer.normalizeGoogleAdsData(data);
    await this.storeCampaignData('google', normalized);

    return {
      platform: 'google',
      campaigns: normalized.length,
      timestamp: new Date()
    };
  }

  /**
   * Sync Meta Ads data
   */
  private async syncMetaAds(): Promise<unknown> {
    if (!this.metaAdsClient) {
      throw new Error('Meta Ads client not configured');
    }

    const data = await this.metaAdsClient.fetchCampaignData();
    const normalized = this.normalizer.normalizeMetaAdsData(data);
    await this.storeCampaignData('meta', normalized);

    return {
      platform: 'meta',
      campaigns: normalized.length,
      timestamp: new Date()
    };
  }

  /**
   * Sync LinkedIn Ads data
   */
  private async syncLinkedInAds(): Promise<unknown> {
    if (!this.linkedInAdsClient) {
      throw new Error('LinkedIn Ads client not configured');
    }

    const data = await this.linkedInAdsClient.fetchCampaignData();
    const normalized = this.normalizer.normalizeLinkedInAdsData(data);
    await this.storeCampaignData('linkedin', normalized);

    return {
      platform: 'linkedin',
      campaigns: normalized.length,
      timestamp: new Date()
    };
  }

  /**
   * Store campaign data in database and cache
   */
  private async storeCampaignData(
    platform: string,
    campaigns: CampaignData[]
  ): Promise<void> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      for (const campaign of campaigns) {
        // Upsert campaign data
        await client.query(`
          INSERT INTO ad_campaigns (
            platform, campaign_id, campaign_name, status,
            start_date, end_date, budget, spend,
            impressions, clicks, conversions,
            ctr, cpc, cpa, roas, metadata,
            last_synced
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
          ON CONFLICT (platform, campaign_id) DO UPDATE SET
            campaign_name = EXCLUDED.campaign_name,
            status = EXCLUDED.status,
            end_date = EXCLUDED.end_date,
            budget = EXCLUDED.budget,
            spend = EXCLUDED.spend,
            impressions = EXCLUDED.impressions,
            clicks = EXCLUDED.clicks,
            conversions = EXCLUDED.conversions,
            ctr = EXCLUDED.ctr,
            cpc = EXCLUDED.cpc,
            cpa = EXCLUDED.cpa,
            roas = EXCLUDED.roas,
            metadata = EXCLUDED.metadata,
            last_synced = NOW()
        `, [
          platform,
          campaign.campaignId,
          campaign.campaignName,
          campaign.status,
          campaign.startDate,
          campaign.endDate,
          campaign.budget,
          campaign.spend,
          campaign.impressions,
          campaign.clicks,
          campaign.conversions,
          campaign.ctr,
          campaign.cpc,
          campaign.cpa,
          campaign.roas,
          JSON.stringify(campaign.metadata)
        ]);

        // Cache recent data for real-time access
        await this.redis.setex(
          `campaign:${platform}:${campaign.campaignId}`,
          3600, // 1 hour TTL
          JSON.stringify(campaign)
        );
      }

      await client.query('COMMIT');

      this.logger.info(`Stored ${campaigns.length} campaigns for ${platform}`);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Failed to store ${platform} campaigns`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get unified campaign performance across all platforms
   */
  public async getUnifiedPerformance(
    startDate: Date,
    endDate: Date,
    filters?: {
      platforms?: string[];
      campaignIds?: string[];
      status?: string[];
    }
  ): Promise<unknown> {
    const query = `
      SELECT
        platform,
        campaign_id,
        campaign_name,
        status,
        SUM(spend) as total_spend,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions,
        AVG(ctr) as avg_ctr,
        AVG(cpc) as avg_cpc,
        AVG(cpa) as avg_cpa,
        AVG(roas) as avg_roas
      FROM ad_campaigns
      WHERE start_date >= $1 AND (end_date <= $2 OR end_date IS NULL)
        ${filters?.platforms ? `AND platform = ANY($3)` : ''}
        ${filters?.campaignIds ? `AND campaign_id = ANY($4)` : ''}
        ${filters?.status ? `AND status = ANY($5)` : ''}
      GROUP BY platform, campaign_id, campaign_name, status
      ORDER BY total_spend DESC
    `;

    const params = [startDate, endDate];
    if (filters?.platforms) params.push(filters.platforms);
    if (filters?.campaignIds) params.push(filters.campaignIds);
    if (filters?.status) params.push(filters.status);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Get real-time campaign metrics
   */
  public async getRealTimeMetrics(
    platform: string,
    campaignId: string
  ): Promise<AdPerformanceMetrics | null> {
    // Check cache first
    const cached = await this.redis.get(`metrics:${platform}:${campaignId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from platform API
    let metrics: AdPerformanceMetrics | null = null;

    switch (platform) {
      case 'google':
        if (this.googleAdsClient) {
          metrics = await this.googleAdsClient.getRealTimeMetrics(campaignId);
        }
        break;
      case 'meta':
        if (this.metaAdsClient) {
          metrics = await this.metaAdsClient.getRealTimeMetrics(campaignId);
        }
        break;
      case 'linkedin':
        if (this.linkedInAdsClient) {
          metrics = await this.linkedInAdsClient.getRealTimeMetrics(campaignId);
        }
        break;
    }

    if (metrics) {
      // Cache for 5 minutes
      await this.redis.setex(
        `metrics:${platform}:${campaignId}`,
        300,
        JSON.stringify(metrics)
      );
    }

    return metrics;
  }

  /**
   * Set up webhook handlers for real-time updates
   */
  private setupWebhooks(): void {
    // Google Ads webhook
    this.webhookHandlers.set('google', async (data: unknown) => {
      try {
        const normalized = this.normalizer.normalizeGoogleAdsWebhook(data);
        await this.processWebhookUpdate('google', normalized);
      } catch (error) {
        this.logger.error('Google Ads webhook processing failed', error);
      }
    });

    // Meta Ads webhook
    this.webhookHandlers.set('meta', async (data: unknown) => {
      try {
        const normalized = this.normalizer.normalizeMetaAdsWebhook(data);
        await this.processWebhookUpdate('meta', normalized);
      } catch (error) {
        this.logger.error('Meta Ads webhook processing failed', error);
      }
    });

    // LinkedIn Ads webhook
    this.webhookHandlers.set('linkedin', async (data: unknown) => {
      try {
        const normalized = this.normalizer.normalizeLinkedInAdsWebhook(data);
        await this.processWebhookUpdate('linkedin', normalized);
      } catch (error) {
        this.logger.error('LinkedIn Ads webhook processing failed', error);
      }
    });
  }

  /**
   * Process webhook update
   */
  private async processWebhookUpdate(
    platform: string,
    data: unknown
  ): Promise<void> {
    // Update cache immediately
    await this.redis.setex(
      `webhook:${platform}:${data.campaignId}`,
      300,
      JSON.stringify(data)
    );

    // Emit event for real-time dashboard updates
    this.emit('webhook:update', {
      platform,
      data,
      timestamp: new Date()
    });

    // Queue for database update
    await this.redis.rpush(
      'webhook:queue',
      JSON.stringify({ platform, data })
    );
  }

  /**
   * Handle webhook request
   */
  public async handleWebhook(
    platform: string,
    payload: unknown
  ): Promise<void> {
    const handler = this.webhookHandlers.get(platform);
    if (!handler) {
      throw new Error(`No webhook handler for platform: ${platform}`);
    }

    await handler(payload);
  }

  /**
   * Get platform health status
   */
  public async getHealthStatus(): Promise<unknown> {
    const status = {
      google: this.googleAdsClient ?
        await this.googleAdsClient.healthCheck() :
        { status: 'not_configured' },
      meta: this.metaAdsClient ?
        await this.metaAdsClient.healthCheck() :
        { status: 'not_configured' },
      linkedin: this.linkedInAdsClient ?
        await this.linkedInAdsClient.healthCheck() :
        { status: 'not_configured' },
      circuitBreaker: this.circuitBreaker.getStatus(),
      metrics: this.metricsCollector.getMetrics()
    };

    return status;
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    this.stopSync();

    if (this.googleAdsClient) {
      await this.googleAdsClient.cleanup();
    }

    if (this.metaAdsClient) {
      await this.metaAdsClient.cleanup();
    }

    if (this.linkedInAdsClient) {
      await this.linkedInAdsClient.cleanup();
    }

    this.removeAllListeners();
  }
}