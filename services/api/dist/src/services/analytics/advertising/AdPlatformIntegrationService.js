"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdPlatformIntegrationService = void 0;
const events_1 = require("events");
const GoogleAdsClient_1 = require("./platforms/GoogleAdsClient");
const MetaAdsClient_1 = require("./platforms/MetaAdsClient");
const LinkedInAdsClient_1 = require("./platforms/LinkedInAdsClient");
const DataNormalizer_1 = require("./DataNormalizer");
const RateLimiter_1 = require("../../../utils/RateLimiter");
const CircuitBreaker_1 = require("../../../utils/CircuitBreaker");
const MetricsCollector_1 = require("../../../utils/MetricsCollector");
class AdPlatformIntegrationService extends events_1.EventEmitter {
    logger;
    redis;
    db;
    googleAdsClient;
    metaAdsClient;
    linkedInAdsClient;
    normalizer;
    rateLimiter;
    circuitBreaker;
    metricsCollector;
    syncInterval;
    webhookHandlers;
    constructor(config, logger, redis, db) {
        super();
        this.logger = logger;
        this.redis = redis;
        this.db = db;
        this.normalizer = new DataNormalizer_1.DataNormalizer();
        this.rateLimiter = new RateLimiter_1.RateLimiter(redis);
        this.circuitBreaker = new CircuitBreaker_1.CircuitBreaker();
        this.metricsCollector = new MetricsCollector_1.MetricsCollector();
        this.webhookHandlers = new Map();
        this.initializePlatforms(config);
    }
    initializePlatforms(config) {
        if (config.googleAds) {
            this.googleAdsClient = new GoogleAdsClient_1.GoogleAdsClient(config.googleAds, this.logger, this.rateLimiter);
            this.logger.info('Google Ads client initialized');
        }
        if (config.metaAds) {
            this.metaAdsClient = new MetaAdsClient_1.MetaAdsClient(config.metaAds, this.logger, this.rateLimiter);
            this.logger.info('Meta Ads client initialized');
        }
        if (config.linkedInAds) {
            this.linkedInAdsClient = new LinkedInAdsClient_1.LinkedInAdsClient(config.linkedInAds, this.logger, this.rateLimiter);
            this.logger.info('LinkedIn Ads client initialized');
        }
    }
    async startSync(intervalMs = 300000) {
        this.logger.info('Starting ad platform sync', { intervalMs });
        await this.syncAllPlatforms();
        this.syncInterval = setInterval(async () => {
            try {
                await this.syncAllPlatforms();
            }
            catch (error) {
                this.logger.error('Sync failed', error);
                this.emit('sync:error', error);
            }
        }, intervalMs);
        this.setupWebhooks();
    }
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = undefined;
        }
        this.logger.info('Ad platform sync stopped');
    }
    async syncAllPlatforms() {
        const startTime = Date.now();
        const results = [];
        try {
            const syncPromises = [];
            if (this.googleAdsClient) {
                syncPromises.push(this.circuitBreaker.execute('google', () => this.syncGoogleAds()));
            }
            if (this.metaAdsClient) {
                syncPromises.push(this.circuitBreaker.execute('meta', () => this.syncMetaAds()));
            }
            if (this.linkedInAdsClient) {
                syncPromises.push(this.circuitBreaker.execute('linkedin', () => this.syncLinkedInAds()));
            }
            const syncResults = await Promise.allSettled(syncPromises);
            for (const result of syncResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    this.logger.error('Platform sync failed', {
                        error: result.reason
                    });
                }
            }
            const duration = Date.now() - startTime;
            this.metricsCollector.recordSyncDuration(duration);
            this.metricsCollector.recordSyncSuccess(results.length);
            this.logger.info('All platforms synced', {
                duration,
                platforms: results.length
            });
            this.emit('sync:complete', { results, duration });
        }
        catch (error) {
            this.logger.error('Sync all platforms failed', error);
            this.metricsCollector.recordSyncFailure();
            throw error;
        }
    }
    async syncGoogleAds() {
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
    async syncMetaAds() {
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
    async syncLinkedInAds() {
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
    async storeCampaignData(platform, campaigns) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            for (const campaign of campaigns) {
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
                await this.redis.setex(`campaign:${platform}:${campaign.campaignId}`, 3600, JSON.stringify(campaign));
            }
            await client.query('COMMIT');
            this.logger.info(`Stored ${campaigns.length} campaigns for ${platform}`);
        }
        catch (error) {
            await client.query('ROLLBACK');
            this.logger.error(`Failed to store ${platform} campaigns`, error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getUnifiedPerformance(startDate, endDate, filters) {
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
        if (filters?.platforms)
            params.push(filters.platforms);
        if (filters?.campaignIds)
            params.push(filters.campaignIds);
        if (filters?.status)
            params.push(filters.status);
        const result = await this.db.query(query, params);
        return result.rows;
    }
    async getRealTimeMetrics(platform, campaignId) {
        const cached = await this.redis.get(`metrics:${platform}:${campaignId}`);
        if (cached) {
            return JSON.parse(cached);
        }
        let metrics = null;
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
            await this.redis.setex(`metrics:${platform}:${campaignId}`, 300, JSON.stringify(metrics));
        }
        return metrics;
    }
    setupWebhooks() {
        this.webhookHandlers.set('google', async (data) => {
            try {
                const normalized = this.normalizer.normalizeGoogleAdsWebhook(data);
                await this.processWebhookUpdate('google', normalized);
            }
            catch (error) {
                this.logger.error('Google Ads webhook processing failed', error);
            }
        });
        this.webhookHandlers.set('meta', async (data) => {
            try {
                const normalized = this.normalizer.normalizeMetaAdsWebhook(data);
                await this.processWebhookUpdate('meta', normalized);
            }
            catch (error) {
                this.logger.error('Meta Ads webhook processing failed', error);
            }
        });
        this.webhookHandlers.set('linkedin', async (data) => {
            try {
                const normalized = this.normalizer.normalizeLinkedInAdsWebhook(data);
                await this.processWebhookUpdate('linkedin', normalized);
            }
            catch (error) {
                this.logger.error('LinkedIn Ads webhook processing failed', error);
            }
        });
    }
    async processWebhookUpdate(platform, data) {
        await this.redis.setex(`webhook:${platform}:${data.campaignId}`, 300, JSON.stringify(data));
        this.emit('webhook:update', {
            platform,
            data,
            timestamp: new Date()
        });
        await this.redis.rpush('webhook:queue', JSON.stringify({ platform, data }));
    }
    async handleWebhook(platform, payload) {
        const handler = this.webhookHandlers.get(platform);
        if (!handler) {
            throw new Error(`No webhook handler for platform: ${platform}`);
        }
        await handler(payload);
    }
    async getHealthStatus() {
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
    async cleanup() {
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
exports.AdPlatformIntegrationService = AdPlatformIntegrationService;
//# sourceMappingURL=AdPlatformIntegrationService.js.map