"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataNormalizer = void 0;
const tslib_1 = require("tslib");
const Joi = tslib_1.__importStar(require("joi"));
class DataNormalizer {
    logger;
    currencyRates;
    campaignSchema;
    metricsSchema;
    constructor(logger) {
        this.logger = logger || console;
        this.currencyRates = new Map([
            ['USD', 1.0],
            ['EUR', 1.18],
            ['GBP', 1.38],
            ['JPY', 0.0091],
            ['AUD', 0.73],
            ['CAD', 0.79]
        ]);
        this.campaignSchema = Joi.object({
            platformId: Joi.string().required(),
            campaignId: Joi.string().required(),
            campaignName: Joi.string().required(),
            status: Joi.string().valid('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED', 'DELETED').required(),
            objective: Joi.string().required(),
            startDate: Joi.date().required(),
            endDate: Joi.date().optional(),
            budget: Joi.number().min(0).required(),
            budgetType: Joi.string().valid('DAILY', 'LIFETIME', 'TOTAL').required(),
            spend: Joi.number().min(0).required(),
            impressions: Joi.number().min(0).required(),
            clicks: Joi.number().min(0).required(),
            conversions: Joi.number().min(0).required(),
            conversionValue: Joi.number().min(0).required(),
            ctr: Joi.number().min(0).max(100).required(),
            cpc: Joi.number().min(0).required(),
            cpa: Joi.number().min(0).required(),
            roas: Joi.number().min(0).required(),
            metadata: Joi.object().required()
        });
        this.metricsSchema = Joi.object({
            timestamp: Joi.date().required(),
            platformId: Joi.string().required(),
            campaignId: Joi.string().required(),
            adSetId: Joi.string().optional(),
            creativeId: Joi.string().optional(),
            impressions: Joi.number().min(0).required(),
            clicks: Joi.number().min(0).required(),
            spend: Joi.number().min(0).required(),
            conversions: Joi.number().min(0).required(),
            revenue: Joi.number().min(0).required(),
            reach: Joi.number().min(0).optional(),
            frequency: Joi.number().min(0).optional(),
            engagement: Joi.number().min(0).optional(),
            videoViews: Joi.number().min(0).optional(),
            videoCompletions: Joi.number().min(0).optional(),
            likes: Joi.number().min(0).optional(),
            shares: Joi.number().min(0).optional(),
            comments: Joi.number().min(0).optional(),
            qualityScore: Joi.number().min(0).max(10).optional(),
            relevanceScore: Joi.number().min(0).max(10).optional(),
            demographics: Joi.object().optional(),
            devices: Joi.object().optional()
        });
    }
    normalizeGoogleAdsData(data) {
        const normalized = [];
        for (const campaign of data) {
            try {
                const budgetMicros = campaign.budget?.amount_micros || 0;
                const spendMicros = campaign.cost_micros || 0;
                const normalizedCampaign = {
                    platformId: 'google_ads',
                    campaignId: String(campaign.id),
                    campaignName: campaign.name,
                    status: this.mapGoogleStatus(campaign.status),
                    objective: campaign.objective_type || campaign.bidding_strategy_type,
                    startDate: new Date(campaign.start_date),
                    endDate: campaign.end_date ? new Date(campaign.end_date) : undefined,
                    budget: budgetMicros / 1000000,
                    budgetType: campaign.budget?.period === 'DAILY' ? 'DAILY' : 'TOTAL',
                    spend: spendMicros / 1000000,
                    impressions: campaign.impressions || 0,
                    clicks: campaign.clicks || 0,
                    conversions: campaign.conversions || 0,
                    conversionValue: campaign.conversion_value || 0,
                    ctr: this.calculateCtr(campaign.clicks, campaign.impressions),
                    cpc: this.calculateCpc(spendMicros / 1000000, campaign.clicks),
                    cpa: this.calculateCpa(spendMicros / 1000000, campaign.conversions),
                    roas: this.calculateRoas(campaign.conversion_value, spendMicros / 1000000),
                    metadata: {
                        targetCpa: campaign.target_cpa,
                        targetRoas: campaign.target_roas,
                        qualityScore: campaign.quality_score,
                        optimizationScore: campaign.optimization_score,
                        biddingStrategy: campaign.bidding_strategy_type
                    }
                };
                const validated = this.validateCampaign(normalizedCampaign);
                normalized.push(validated);
            }
            catch (error) {
                this.logger.error('Failed to normalize Google Ads campaign', {
                    campaignId: campaign.id,
                    error
                });
            }
        }
        return normalized;
    }
    normalizeMetaAdsData(data) {
        const normalized = [];
        for (const campaign of data) {
            try {
                const budget = campaign.daily_budget || campaign.lifetime_budget || 0;
                const spend = campaign.spend || 0;
                const normalizedCampaign = {
                    platformId: 'meta_ads',
                    campaignId: campaign.id,
                    campaignName: campaign.name,
                    status: this.mapMetaStatus(campaign.status),
                    objective: campaign.objective,
                    startDate: new Date(campaign.start_time || campaign.created_time),
                    endDate: campaign.stop_time ? new Date(campaign.stop_time) : undefined,
                    budget: budget / 100,
                    budgetType: campaign.daily_budget ? 'DAILY' : 'LIFETIME',
                    spend: spend,
                    impressions: campaign.impressions || 0,
                    clicks: campaign.clicks || 0,
                    conversions: this.extractMetaConversions(campaign.actions),
                    conversionValue: campaign.conversion_values?.value || 0,
                    ctr: campaign.ctr || this.calculateCtr(campaign.clicks, campaign.impressions),
                    cpc: campaign.cpc || this.calculateCpc(spend, campaign.clicks),
                    cpa: campaign.cost_per_action_type?.find((a) => a.action_type === 'purchase')?.value || 0,
                    roas: this.calculateRoas(campaign.conversion_values?.value, spend),
                    metadata: {
                        bidStrategy: campaign.bid_strategy,
                        optimizationGoal: campaign.optimization_goal,
                        reach: campaign.reach,
                        frequency: campaign.frequency,
                        relevanceScore: campaign.relevance_score,
                        qualityRanking: campaign.quality_ranking,
                        engagementRateRanking: campaign.engagement_rate_ranking
                    }
                };
                const validated = this.validateCampaign(normalizedCampaign);
                normalized.push(validated);
            }
            catch (error) {
                this.logger.error('Failed to normalize Meta Ads campaign', {
                    campaignId: campaign.id,
                    error
                });
            }
        }
        return normalized;
    }
    normalizeLinkedInAdsData(data) {
        const normalized = [];
        for (const campaign of data) {
            try {
                const budget = campaign.dailyBudget?.amount || campaign.totalBudget?.amount || 0;
                const spend = campaign.spend || 0;
                const normalizedCampaign = {
                    platformId: 'linkedin_ads',
                    campaignId: campaign.id,
                    campaignName: campaign.name,
                    status: this.mapLinkedInStatus(campaign.status),
                    objective: campaign.objectiveType,
                    startDate: new Date(campaign.runSchedule?.start || campaign.createdAt),
                    endDate: campaign.runSchedule?.end ? new Date(campaign.runSchedule.end) : undefined,
                    budget: parseFloat(budget) / 100,
                    budgetType: campaign.dailyBudget ? 'DAILY' : 'TOTAL',
                    spend: spend,
                    impressions: campaign.impressions || 0,
                    clicks: campaign.clicks || 0,
                    conversions: campaign.conversions || 0,
                    conversionValue: campaign.conversionValueInLocalCurrency || 0,
                    ctr: this.calculateCtr(campaign.clicks, campaign.impressions),
                    cpc: this.calculateCpc(spend, campaign.clicks),
                    cpa: this.calculateCpa(spend, campaign.conversions),
                    roas: this.calculateRoas(campaign.conversionValueInLocalCurrency, spend),
                    metadata: {
                        costType: campaign.costType,
                        leads: campaign.leads,
                        videoViews: campaign.videoCompletions,
                        engagement: campaign.totalEngagements,
                        targeting: campaign.targeting,
                        accountId: campaign.account
                    }
                };
                const validated = this.validateCampaign(normalizedCampaign);
                normalized.push(validated);
            }
            catch (error) {
                this.logger.error('Failed to normalize LinkedIn Ads campaign', {
                    campaignId: campaign.id,
                    error
                });
            }
        }
        return normalized;
    }
    normalizeGoogleAdsWebhook(data) {
        return {
            type: 'campaign_update',
            platform: 'google_ads',
            campaignId: data.campaign_id,
            timestamp: new Date(),
            changes: data.changes,
            metrics: {
                impressions: data.metrics?.impressions,
                clicks: data.metrics?.clicks,
                spend: (data.metrics?.cost_micros || 0) / 1000000,
                conversions: data.metrics?.conversions
            }
        };
    }
    normalizeMetaAdsWebhook(data) {
        return {
            type: data.field,
            platform: 'meta_ads',
            campaignId: data.value?.campaign_id,
            timestamp: new Date(data.time * 1000),
            changes: data.value,
            metrics: {
                impressions: data.value?.impressions,
                clicks: data.value?.clicks,
                spend: data.value?.spend,
                conversions: data.value?.actions?.find((a) => a.action_type === 'purchase')?.value
            }
        };
    }
    normalizeLinkedInAdsWebhook(data) {
        return {
            type: 'campaign_update',
            platform: 'linkedin_ads',
            campaignId: data.campaignUrn?.split(':').pop(),
            timestamp: new Date(),
            changes: data.changeType,
            metrics: {
                impressions: data.metrics?.impressions,
                clicks: data.metrics?.clicks,
                spend: data.metrics?.costInUsd,
                conversions: data.metrics?.conversions
            }
        };
    }
    normalizeRealTimeMetrics(platform, data) {
        const baseMetrics = {
            timestamp: new Date(),
            platformId: platform,
            campaignId: '',
            impressions: 0,
            clicks: 0,
            spend: 0,
            conversions: 0,
            revenue: 0
        };
        switch (platform) {
            case 'google_ads':
                return this.normalizeGoogleMetrics(data, baseMetrics);
            case 'meta_ads':
                return this.normalizeMetaMetrics(data, baseMetrics);
            case 'linkedin_ads':
                return this.normalizeLinkedInMetrics(data, baseMetrics);
            default:
                return baseMetrics;
        }
    }
    normalizeGoogleMetrics(data, base) {
        return {
            ...base,
            campaignId: String(data.campaign_id),
            adSetId: data.ad_group_id ? String(data.ad_group_id) : undefined,
            creativeId: data.ad_id ? String(data.ad_id) : undefined,
            impressions: data.impressions || 0,
            clicks: data.clicks || 0,
            spend: (data.cost_micros || 0) / 1000000,
            conversions: data.conversions || 0,
            revenue: data.conversions_value || 0,
            qualityScore: data.quality_score,
            videoViews: data.video_views,
            engagement: data.engagements
        };
    }
    normalizeMetaMetrics(data, base) {
        return {
            ...base,
            campaignId: data.campaign_id,
            adSetId: data.adset_id,
            creativeId: data.ad_id,
            impressions: parseInt(data.impressions) || 0,
            clicks: parseInt(data.clicks) || 0,
            spend: parseFloat(data.spend) || 0,
            conversions: this.extractMetaConversions(data.actions),
            revenue: parseFloat(data.conversion_values?.value) || 0,
            reach: parseInt(data.reach) || 0,
            frequency: parseFloat(data.frequency) || 0,
            engagement: parseInt(data.inline_link_clicks) || 0,
            videoViews: data.video_play_actions?.[0]?.value || 0,
            likes: parseInt(data.likes) || 0,
            shares: parseInt(data.shares) || 0,
            comments: parseInt(data.comments) || 0,
            relevanceScore: data.relevance_score?.score
        };
    }
    normalizeLinkedInMetrics(data, base) {
        return {
            ...base,
            campaignId: data.campaign_id,
            impressions: data.impressions || 0,
            clicks: data.clicks || 0,
            spend: data.costInUsd || 0,
            conversions: data.conversions || 0,
            revenue: data.conversionValueInLocalCurrency || 0,
            engagement: data.totalEngagements || 0,
            videoViews: data.videoCompletions || 0,
            likes: data.likes || 0,
            shares: data.shares || 0,
            comments: data.comments || 0
        };
    }
    mapGoogleStatus(status) {
        const statusMap = {
            'ENABLED': 'ACTIVE',
            'PAUSED': 'PAUSED',
            'REMOVED': 'DELETED',
            'ENDED': 'COMPLETED'
        };
        return statusMap[status] || 'PAUSED';
    }
    mapMetaStatus(status) {
        const statusMap = {
            'ACTIVE': 'ACTIVE',
            'PAUSED': 'PAUSED',
            'DELETED': 'DELETED',
            'ARCHIVED': 'ARCHIVED'
        };
        return statusMap[status] || 'PAUSED';
    }
    mapLinkedInStatus(status) {
        const statusMap = {
            'ACTIVE': 'ACTIVE',
            'PAUSED': 'PAUSED',
            'ARCHIVED': 'ARCHIVED',
            'COMPLETED': 'COMPLETED',
            'CANCELED': 'DELETED'
        };
        return statusMap[status] || 'PAUSED';
    }
    extractMetaConversions(actions) {
        if (!actions || !Array.isArray(actions)) {
            return 0;
        }
        const conversionActions = ['purchase', 'lead', 'complete_registration', 'add_to_cart'];
        let totalConversions = 0;
        for (const action of actions) {
            if (conversionActions.includes(action.action_type)) {
                totalConversions += parseFloat(action.value) || 0;
            }
        }
        return totalConversions;
    }
    calculateCtr(clicks, impressions) {
        if (!impressions || impressions === 0)
            return 0;
        return (clicks / impressions) * 100;
    }
    calculateCpc(spend, clicks) {
        if (!clicks || clicks === 0)
            return 0;
        return spend / clicks;
    }
    calculateCpa(spend, conversions) {
        if (!conversions || conversions === 0)
            return 0;
        return spend / conversions;
    }
    calculateRoas(revenue, spend) {
        if (!spend || spend === 0)
            return 0;
        return revenue / spend;
    }
    convertToUsd(amount, currency) {
        const rate = this.currencyRates.get(currency.toUpperCase());
        if (!rate) {
            this.logger.warn(`Unknown currency: ${currency}, using 1.0 rate`);
            return amount;
        }
        return amount * rate;
    }
    validateCampaign(campaign) {
        const { error, value } = this.campaignSchema.validate(campaign, {
            stripUnknown: true,
            abortEarly: false
        });
        if (error) {
            this.logger.warn('Campaign validation warnings', {
                campaignId: campaign.campaignId,
                errors: error.details.map(d => d.message)
            });
        }
        return value;
    }
    validateMetrics(metrics) {
        const { error, value } = this.metricsSchema.validate(metrics, {
            stripUnknown: true,
            abortEarly: false
        });
        if (error) {
            this.logger.warn('Metrics validation warnings', {
                campaignId: metrics.campaignId,
                errors: error.details.map(d => d.message)
            });
        }
        return value;
    }
    sanitizeData(data) {
        if (typeof data === 'string') {
            return data.replace(/[<>]/g, '').trim();
        }
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeData(item));
        }
        if (data && typeof data === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[key] = this.sanitizeData(value);
            }
            return sanitized;
        }
        return data;
    }
}
exports.DataNormalizer = DataNormalizer;
