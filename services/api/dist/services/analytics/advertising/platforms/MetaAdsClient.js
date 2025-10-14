"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaAdsClient = void 0;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const RetryPolicy_1 = require("../../../../utils/RetryPolicy");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const META_API_VERSION = 'v17.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;
class MetaAdsClient {
    logger;
    rateLimiter;
    config;
    axiosClient;
    retryPolicy;
    appAccessToken;
    constructor(config, logger, rateLimiter) {
        this.config = config;
        this.logger = logger;
        this.rateLimiter = rateLimiter;
        this.retryPolicy = new RetryPolicy_1.RetryPolicy();
        this.axiosClient = axios_1.default.create({
            baseURL: META_API_BASE,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        this.axiosClient.interceptors.request.use((config) => {
            config.params = config.params || {};
            config.params.access_token = this.config.accessToken;
            return config;
        });
        this.axiosClient.interceptors.response.use((response) => response, async (error) => {
            if (error.response?.data?.error) {
                const fbError = error.response.data.error;
                this.logger.error('Meta API Error', {
                    message: fbError.message,
                    type: fbError.type,
                    code: fbError.code,
                    subcode: fbError.error_subcode
                });
                if (fbError.code === 4 || fbError.code === 17) {
                    await this.handleRateLimit(fbError);
                }
            }
            throw error;
        });
    }
    async handleRateLimit(error) {
        const headers = error.response?.headers;
        if (headers) {
            const callCount = headers['x-app-usage']?.call_count;
            const totalTime = headers['x-app-usage']?.total_time;
            const totalCPUTime = headers['x-app-usage']?.total_cputime;
            this.logger.warn('Meta API rate limit approaching', {
                callCount,
                totalTime,
                totalCPUTime
            });
            if (callCount > 95 || totalTime > 95 || totalCPUTime > 95) {
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
        }
    }
    async getAppAccessToken() {
        if (this.appAccessToken) {
            return this.appAccessToken;
        }
        const proof = crypto_1.default
            .createHmac('sha256', this.config.appSecret)
            .update(this.config.accessToken)
            .digest('hex');
        try {
            const response = await this.axiosClient.get('/oauth/access_token', {
                params: {
                    grant_type: 'client_credentials',
                    client_id: this.config.appId,
                    client_secret: this.config.appSecret
                }
            });
            this.appAccessToken = response.data.access_token;
            return this.appAccessToken;
        }
        catch (error) {
            this.logger.error('Failed to get app access token', error);
            throw error;
        }
    }
    async fetchCampaignData() {
        await this.rateLimiter.checkLimit('meta_ads', 200, 3600000);
        try {
            const response = await this.retryPolicy.execute(async () => {
                return await this.axiosClient.get(`/act_${this.config.businessId}/campaigns`, {
                    params: {
                        fields: [
                            'id',
                            'name',
                            'objective',
                            'status',
                            'daily_budget',
                            'lifetime_budget',
                            'start_time',
                            'stop_time',
                            'created_time',
                            'updated_time',
                            'bid_strategy',
                            'optimization_goal',
                            'adsets{id,name,status,daily_budget,lifetime_budget,targeting}'
                        ].join(','),
                        limit: 500
                    }
                });
            });
            const campaigns = response.data.data || [];
            let nextPage = response.data.paging?.next;
            while (nextPage) {
                const nextResponse = await axios_1.default.get(nextPage);
                campaigns.push(...(nextResponse.data.data || []));
                nextPage = nextResponse.data.paging?.next;
            }
            this.logger.info(`Fetched ${campaigns.length} Meta campaigns`);
            return campaigns;
        }
        catch (error) {
            this.logger.error('Failed to fetch Meta campaigns', error);
            throw error;
        }
    }
    async fetchInsights(objectId, objectType, dateRange) {
        await this.rateLimiter.checkLimit('meta_insights', 200, 3600000);
        const fields = [
            'impressions',
            'clicks',
            'spend',
            'reach',
            'frequency',
            'cpm',
            'cpp',
            'ctr',
            'cpc',
            'actions',
            'conversions',
            'conversion_values',
            'cost_per_action_type',
            'video_avg_time_watched_actions',
            'video_p25_watched_actions',
            'video_p50_watched_actions',
            'video_p75_watched_actions',
            'video_p100_watched_actions'
        ];
        const breakdowns = ['age', 'gender', 'device_platform'];
        try {
            const response = await this.retryPolicy.execute(async () => {
                return await this.axiosClient.get(`/${objectId}/insights`, {
                    params: {
                        fields: fields.join(','),
                        time_range: JSON.stringify(dateRange),
                        breakdowns: breakdowns.join(','),
                        level: objectType,
                        limit: 500
                    }
                });
            });
            const insights = response.data.data || [];
            insights.forEach(insight => {
                if (insight.actions) {
                    const conversions = insight.actions.filter(action => action.action_type.includes('conversion'));
                    insight.conversions = conversions.reduce((sum, conv) => sum + conv.value, 0);
                }
            });
            return insights;
        }
        catch (error) {
            this.logger.error('Failed to fetch Meta insights', error);
            throw error;
        }
    }
    async getRealTimeMetrics(campaignId) {
        await this.rateLimiter.checkLimit('meta_realtime', 100, 3600000);
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await this.axiosClient.get(`/${campaignId}/insights`, {
                params: {
                    fields: [
                        'impressions',
                        'clicks',
                        'spend',
                        'reach',
                        'frequency',
                        'ctr',
                        'cpc',
                        'cpm',
                        'actions',
                        'video_play_actions',
                        'video_avg_time_watched_actions',
                        'inline_link_clicks',
                        'unique_clicks'
                    ].join(','),
                    time_range: JSON.stringify({
                        since: today,
                        until: today
                    }),
                    limit: 1
                }
            });
            if (response.data.data?.length > 0) {
                const data = response.data.data[0];
                let conversions = 0;
                let revenue = 0;
                if (data.actions) {
                    data.actions.forEach((action) => {
                        if (action.action_type.includes('purchase')) {
                            conversions += parseFloat(action.value);
                        }
                        if (action.action_type === 'purchase_value') {
                            revenue += parseFloat(action.value);
                        }
                    });
                }
                return {
                    timestamp: new Date(),
                    platform: 'meta',
                    campaignId,
                    impressions: parseInt(data.impressions) || 0,
                    clicks: parseInt(data.clicks) || 0,
                    spend: parseFloat(data.spend) || 0,
                    conversions,
                    revenue,
                    reach: parseInt(data.reach) || 0,
                    frequency: parseFloat(data.frequency) || 0,
                    ctr: parseFloat(data.ctr) || 0,
                    cpc: parseFloat(data.cpc) || 0,
                    cpm: parseFloat(data.cpm) || 0,
                    videoViews: data.video_play_actions?.[0]?.value || 0,
                    engagement: parseInt(data.inline_link_clicks) || 0
                };
            }
            return null;
        }
        catch (error) {
            this.logger.error('Failed to fetch real-time Meta metrics', error);
            throw error;
        }
    }
    async createCustomAudience(name, description, rules) {
        await this.rateLimiter.checkLimit('meta_mutation', 50, 3600000);
        try {
            const response = await this.axiosClient.post(`/act_${this.config.businessId}/customaudiences`, {
                name,
                description,
                subtype: 'CUSTOM',
                rule: JSON.stringify(rules)
            });
            const audienceId = response.data.id;
            this.logger.info(`Created custom audience: ${audienceId}`);
            return audienceId;
        }
        catch (error) {
            this.logger.error('Failed to create custom audience', error);
            throw error;
        }
    }
    async createLookalikeAudience(name, sourceAudienceId, country, ratio = 0.01) {
        await this.rateLimiter.checkLimit('meta_mutation', 50, 3600000);
        try {
            const response = await this.axiosClient.post(`/act_${this.config.businessId}/customaudiences`, {
                name,
                subtype: 'LOOKALIKE',
                origin_audience_id: sourceAudienceId,
                lookalike_spec: JSON.stringify({
                    country,
                    ratio,
                    type: 'similarity'
                })
            });
            const audienceId = response.data.id;
            this.logger.info(`Created lookalike audience: ${audienceId}`);
            return audienceId;
        }
        catch (error) {
            this.logger.error('Failed to create lookalike audience', error);
            throw error;
        }
    }
    async getCreativePerformance(adId, dateRange) {
        await this.rateLimiter.checkLimit('meta_insights', 200, 3600000);
        try {
            const response = await this.axiosClient.get(`/${adId}/insights`, {
                params: {
                    fields: [
                        'ad_id',
                        'ad_name',
                        'impressions',
                        'clicks',
                        'spend',
                        'actions',
                        'relevance_score',
                        'quality_ranking',
                        'engagement_rate_ranking',
                        'conversion_rate_ranking',
                        'video_play_actions',
                        'video_avg_time_watched_actions',
                        'video_p25_watched_actions',
                        'video_p50_watched_actions',
                        'video_p75_watched_actions',
                        'video_p100_watched_actions',
                        'outbound_clicks',
                        'unique_outbound_clicks'
                    ].join(','),
                    time_range: JSON.stringify(dateRange)
                }
            });
            return response.data.data || [];
        }
        catch (error) {
            this.logger.error('Failed to fetch creative performance', error);
            throw error;
        }
    }
    async updateCampaignBudget(campaignId, dailyBudget, lifetimeBudget) {
        await this.rateLimiter.checkLimit('meta_mutation', 50, 3600000);
        const updates = {};
        if (dailyBudget !== undefined) {
            updates.daily_budget = Math.round(dailyBudget * 100);
        }
        if (lifetimeBudget !== undefined) {
            updates.lifetime_budget = Math.round(lifetimeBudget * 100);
        }
        try {
            await this.axiosClient.post(`/${campaignId}`, updates);
            this.logger.info(`Updated budget for campaign ${campaignId}`);
        }
        catch (error) {
            this.logger.error('Failed to update campaign budget', error);
            throw error;
        }
    }
    async updateCampaignStatus(campaignId, status) {
        await this.rateLimiter.checkLimit('meta_mutation', 50, 3600000);
        try {
            await this.axiosClient.post(`/${campaignId}`, { status });
            this.logger.info(`Updated status for campaign ${campaignId} to ${status}`);
        }
        catch (error) {
            this.logger.error('Failed to update campaign status', error);
            throw error;
        }
    }
    async getAudienceInsights(audienceId) {
        await this.rateLimiter.checkLimit('meta_insights', 200, 3600000);
        try {
            const response = await this.axiosClient.get(`/act_${this.config.businessId}/reachestimate`, {
                params: {
                    targeting_spec: JSON.stringify({
                        custom_audiences: [{ id: audienceId }]
                    })
                }
            });
            return response.data.data?.[0] || null;
        }
        catch (error) {
            this.logger.error('Failed to fetch audience insights', error);
            throw error;
        }
    }
    async healthCheck() {
        try {
            const response = await this.axiosClient.get('/me', {
                params: {
                    fields: 'id,name'
                }
            });
            return {
                status: 'healthy',
                authenticated: true,
                userId: response.data.id,
                businessId: this.config.businessId
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
    async cleanup() {
        this.logger.info('Meta Ads client cleaned up');
    }
}
exports.MetaAdsClient = MetaAdsClient;
