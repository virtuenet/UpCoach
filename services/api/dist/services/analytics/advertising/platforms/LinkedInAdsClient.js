"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedInAdsClient = void 0;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const RetryPolicy_1 = require("../../../../utils/RetryPolicy");
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_ADS_API_BASE = 'https://api.linkedin.com/rest';
class LinkedInAdsClient {
    logger;
    rateLimiter;
    config;
    axiosClient;
    adsApiClient;
    retryPolicy;
    constructor(config, logger, rateLimiter) {
        this.config = config;
        this.logger = logger;
        this.rateLimiter = rateLimiter;
        this.retryPolicy = new RetryPolicy_1.RetryPolicy();
        this.axiosClient = axios_1.default.create({
            baseURL: LINKEDIN_API_BASE,
            timeout: 30000,
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });
        this.adsApiClient = axios_1.default.create({
            baseURL: LINKEDIN_ADS_API_BASE,
            timeout: 30000,
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json',
                'LinkedIn-Version': '202309',
                'X-RestLi-Protocol-Version': '2.0.0'
            }
        });
        const errorHandler = async (error) => {
            if (error.response?.status === 429) {
                const retryAfter = error.response.headers['retry-after'] || 60;
                this.logger.warn(`LinkedIn API rate limited, waiting ${retryAfter}s`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                return this.axiosClient.request(error.config);
            }
            if (error.response?.status === 401) {
                this.logger.error('LinkedIn access token expired or invalid');
            }
            throw error;
        };
        this.axiosClient.interceptors.response.use((response) => response, errorHandler);
        this.adsApiClient.interceptors.response.use((response) => response, errorHandler);
    }
    async fetchCampaignData() {
        await this.rateLimiter.checkLimit('linkedin_ads', 100, 86400000);
        try {
            const response = await this.retryPolicy.execute(async () => {
                return await this.adsApiClient.get('/adCampaigns', {
                    params: {
                        q: 'account',
                        account: `urn:li:sponsoredAccount:${this.config.accountId}`,
                        count: 100
                    }
                });
            });
            const campaigns = [];
            const elements = response.data.elements || [];
            for (const element of elements) {
                campaigns.push(this.transformCampaignData(element));
            }
            let nextUrl = response.data.paging?.links?.find((link) => link.rel === 'next')?.href;
            while (nextUrl) {
                const nextResponse = await axios_1.default.get(nextUrl, {
                    headers: this.adsApiClient.defaults.headers
                });
                const nextElements = nextResponse.data.elements || [];
                for (const element of nextElements) {
                    campaigns.push(this.transformCampaignData(element));
                }
                nextUrl = nextResponse.data.paging?.links?.find((link) => link.rel === 'next')?.href;
            }
            this.logger.info(`Fetched ${campaigns.length} LinkedIn campaigns`);
            return campaigns;
        }
        catch (error) {
            this.logger.error('Failed to fetch LinkedIn campaigns', error);
            throw error;
        }
    }
    async fetchAnalytics(campaignIds, startDate, endDate) {
        await this.rateLimiter.checkLimit('linkedin_analytics', 100, 86400000);
        const dateRange = {
            start: {
                year: startDate.getFullYear(),
                month: startDate.getMonth() + 1,
                day: startDate.getDate()
            },
            end: {
                year: endDate.getFullYear(),
                month: endDate.getMonth() + 1,
                day: endDate.getDate()
            }
        };
        try {
            const analytics = [];
            const batchSize = 20;
            for (let i = 0; i < campaignIds.length; i += batchSize) {
                const batch = campaignIds.slice(i, i + batchSize);
                const response = await this.retryPolicy.execute(async () => {
                    return await this.adsApiClient.get('/adAnalytics', {
                        params: {
                            q: 'analytics',
                            campaigns: batch.map(id => `urn:li:sponsoredCampaign:${id}`),
                            dateRange,
                            fields: [
                                'impressions',
                                'clicks',
                                'costInLocalCurrency',
                                'costInUsd',
                                'leads',
                                'conversions',
                                'conversionValueInLocalCurrency',
                                'videoStarts',
                                'videoFirstQuartileCompletions',
                                'videoMidpointCompletions',
                                'videoThirdQuartileCompletions',
                                'videoCompletions',
                                'landingPageClicks',
                                'likes',
                                'comments',
                                'shares',
                                'follows',
                                'otherEngagements',
                                'opens',
                                'textUrlClicks',
                                'totalEngagements',
                                'oneClickLeads',
                                'sends'
                            ].join(','),
                            pivot: 'CAMPAIGN',
                            timeGranularity: 'DAILY'
                        }
                    });
                });
                const elements = response.data.elements || [];
                for (const element of elements) {
                    analytics.push({
                        dateRange: element.dateRange,
                        impressions: element.impressions || 0,
                        clicks: element.clicks || 0,
                        costInLocalCurrency: element.costInLocalCurrency || 0,
                        costInUsd: element.costInUsd || 0,
                        leads: element.leads || 0,
                        conversions: element.conversions || 0,
                        conversionValueInLocalCurrency: element.conversionValueInLocalCurrency,
                        videoStarts: element.videoStarts,
                        videoFirstQuartileCompletions: element.videoFirstQuartileCompletions,
                        videoMidpointCompletions: element.videoMidpointCompletions,
                        videoThirdQuartileCompletions: element.videoThirdQuartileCompletions,
                        videoCompletions: element.videoCompletions,
                        landingPageClicks: element.landingPageClicks,
                        likes: element.likes,
                        comments: element.comments,
                        shares: element.shares,
                        follows: element.follows,
                        otherEngagements: element.otherEngagements,
                        opens: element.opens,
                        textUrlClicks: element.textUrlClicks,
                        totalEngagements: element.totalEngagements,
                        oneClickLeads: element.oneClickLeads,
                        sends: element.sends
                    });
                }
            }
            return analytics;
        }
        catch (error) {
            this.logger.error('Failed to fetch LinkedIn analytics', error);
            throw error;
        }
    }
    async getRealTimeMetrics(campaignId) {
        await this.rateLimiter.checkLimit('linkedin_realtime', 100, 86400000);
        const today = new Date();
        const dateRange = {
            start: {
                year: today.getFullYear(),
                month: today.getMonth() + 1,
                day: today.getDate()
            },
            end: {
                year: today.getFullYear(),
                month: today.getMonth() + 1,
                day: today.getDate()
            }
        };
        try {
            const response = await this.adsApiClient.get('/adAnalytics', {
                params: {
                    q: 'analytics',
                    campaigns: `urn:li:sponsoredCampaign:${campaignId}`,
                    dateRange,
                    fields: [
                        'impressions',
                        'clicks',
                        'costInUsd',
                        'leads',
                        'conversions',
                        'conversionValueInLocalCurrency',
                        'totalEngagements',
                        'videoCompletions',
                        'landingPageClicks'
                    ].join(',')
                }
            });
            if (response.data.elements?.length > 0) {
                const data = response.data.elements[0];
                return {
                    timestamp: new Date(),
                    platform: 'linkedin',
                    campaignId,
                    impressions: data.impressions || 0,
                    clicks: data.clicks || 0,
                    spend: data.costInUsd || 0,
                    conversions: data.conversions || 0,
                    revenue: data.conversionValueInLocalCurrency || 0,
                    leads: data.leads || 0,
                    engagement: data.totalEngagements || 0,
                    videoViews: data.videoCompletions || 0,
                    ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
                    cpc: data.clicks > 0 ? data.costInUsd / data.clicks : 0,
                    cpl: data.leads > 0 ? data.costInUsd / data.leads : 0
                };
            }
            return null;
        }
        catch (error) {
            this.logger.error('Failed to fetch real-time LinkedIn metrics', error);
            throw error;
        }
    }
    async createCampaign(name, objectiveType, dailyBudget, targeting) {
        await this.rateLimiter.checkLimit('linkedin_mutation', 100, 86400000);
        const campaignData = {
            account: `urn:li:sponsoredAccount:${this.config.accountId}`,
            name,
            objectiveType,
            type: 'SPONSORED_UPDATES',
            status: 'PAUSED',
            costType: 'CPM',
            dailyBudget: {
                amount: String(dailyBudget * 100),
                currencyCode: 'USD'
            },
            targeting,
            locale: {
                country: 'US',
                language: 'en'
            }
        };
        try {
            const response = await this.adsApiClient.post('/adCampaigns', campaignData);
            const campaignId = response.headers['x-linkedin-id'];
            this.logger.info(`Created LinkedIn campaign: ${campaignId}`);
            return campaignId;
        }
        catch (error) {
            this.logger.error('Failed to create LinkedIn campaign', error);
            throw error;
        }
    }
    async updateCampaignStatus(campaignId, status) {
        await this.rateLimiter.checkLimit('linkedin_mutation', 100, 86400000);
        try {
            await this.adsApiClient.patch(`/adCampaigns/${campaignId}`, {
                patch: {
                    $set: {
                        status
                    }
                }
            });
            this.logger.info(`Updated LinkedIn campaign ${campaignId} status to ${status}`);
        }
        catch (error) {
            this.logger.error('Failed to update campaign status', error);
            throw error;
        }
    }
    async getAudienceInsights(targeting) {
        await this.rateLimiter.checkLimit('linkedin_insights', 100, 86400000);
        try {
            const response = await this.adsApiClient.post('/audienceCount', {
                targeting
            });
            return {
                activeAudienceCount: response.data.activeAudienceCount,
                totalAudienceCount: response.data.totalAudienceCount
            };
        }
        catch (error) {
            this.logger.error('Failed to fetch audience insights', error);
            throw error;
        }
    }
    async getLeadForms(campaignId) {
        await this.rateLimiter.checkLimit('linkedin_ads', 100, 86400000);
        try {
            const response = await this.adsApiClient.get('/leadForms', {
                params: {
                    q: 'campaign',
                    campaign: `urn:li:sponsoredCampaign:${campaignId}`
                }
            });
            return response.data.elements || [];
        }
        catch (error) {
            this.logger.error('Failed to fetch lead forms', error);
            throw error;
        }
    }
    async downloadLeads(campaignId, startDate, endDate) {
        await this.rateLimiter.checkLimit('linkedin_leads', 100, 86400000);
        try {
            const response = await this.adsApiClient.get('/leadFormResponses', {
                params: {
                    q: 'campaign',
                    campaign: `urn:li:sponsoredCampaign:${campaignId}`,
                    submittedAtStart: startDate.getTime(),
                    submittedAtEnd: endDate.getTime()
                }
            });
            const leads = [];
            for (const element of response.data.elements || []) {
                leads.push({
                    id: element.id,
                    submittedAt: new Date(element.submittedAt),
                    leadType: element.leadType,
                    formId: element.associatedFormId,
                    campaignId: element.associatedCampaignId,
                    creativeId: element.associatedCreativeId,
                    answers: element.answers
                });
            }
            return leads;
        }
        catch (error) {
            this.logger.error('Failed to download leads', error);
            throw error;
        }
    }
    transformCampaignData(data) {
        return {
            id: data.id,
            name: data.name,
            account: data.account,
            status: data.status,
            type: data.type,
            objectiveType: data.objectiveType,
            costType: data.costType,
            dailyBudget: data.dailyBudget,
            totalBudget: data.totalBudget,
            runSchedule: data.runSchedule,
            targeting: data.targeting,
            createdAt: data.createdAt,
            lastModifiedAt: data.lastModifiedAt
        };
    }
    async healthCheck() {
        try {
            const response = await this.adsApiClient.get(`/adAccounts/${this.config.accountId}`);
            return {
                status: 'healthy',
                authenticated: true,
                accountId: this.config.accountId,
                accountName: response.data.name
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
        this.logger.info('LinkedIn Ads client cleaned up');
    }
}
exports.LinkedInAdsClient = LinkedInAdsClient;
