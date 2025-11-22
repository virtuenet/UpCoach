/**
 * LinkedIn Ads API Client
 *
 * Handles interactions with LinkedIn Marketing API v2
 * Features:
 * - Campaign management for B2B marketing
 * - Professional targeting capabilities
 * - Sponsored content and message ads
 * - Lead generation forms tracking
 * - Company and demographic insights
 */

import axios, { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { RateLimiter } from '../../../../utils/RateLimiter';
import { RetryPolicy } from '../../../../utils/RetryPolicy';

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_ADS_API_BASE = 'https://api.linkedin.com/rest';

export interface LinkedInAdsConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  accountId: string;
}

export interface LinkedInCampaign {
  id: string;
  name: string;
  account: string;
  status: string;
  type: string;
  objectiveType: string;
  costType: string;
  dailyBudget?: {
    amount: string;
    currencyCode: string;
  };
  totalBudget?: {
    amount: string;
    currencyCode: string;
  };
  runSchedule?: {
    start: number;
    end?: number;
  };
  targeting?: LinkedInTargeting;
  createdAt: number;
  lastModifiedAt: number;
}

export interface LinkedInTargeting {
  includedTargetingFacets?: {
    locations?: string[];
    industries?: string[];
    jobFunctions?: string[];
    seniorities?: string[];
    companyNames?: string[];
    companyFollowerCounts?: string[];
    degrees?: string[];
    fieldsOfStudy?: string[];
    memberGroups?: string[];
    memberInterests?: string[];
    memberTraits?: string[];
  };
  excludedTargetingFacets?: unknown;
}

export interface LinkedInAnalytics {
  dateRange: {
    start: {
      year: number;
      month: number;
      day: number;
    };
    end: {
      year: number;
      month: number;
      day: number;
    };
  };
  impressions: number;
  clicks: number;
  costInLocalCurrency: number;
  costInUsd: number;
  leads: number;
  conversions: number;
  conversionValueInLocalCurrency?: number;
  videoStarts?: number;
  videoFirstQuartileCompletions?: number;
  videoMidpointCompletions?: number;
  videoThirdQuartileCompletions?: number;
  videoCompletions?: number;
  landingPageClicks?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  follows?: number;
  otherEngagements?: number;
  opens?: number;
  textUrlClicks?: number;
  totalEngagements?: number;
  oneClickLeads?: number;
  sends?: number;
}

export class LinkedInAdsClient {
  private logger: Logger;
  private rateLimiter: RateLimiter;
  private config: LinkedInAdsConfig;
  private axiosClient: AxiosInstance;
  private adsApiClient: AxiosInstance;
  private retryPolicy: RetryPolicy;

  constructor(
    config: LinkedInAdsConfig,
    logger: Logger,
    rateLimiter: RateLimiter
  ) {
    this.config = config;
    this.logger = logger;
    this.rateLimiter = rateLimiter;
    this.retryPolicy = new RetryPolicy();

    // Initialize axios client for v2 API
    this.axiosClient = axios.create({
      baseURL: LINKEDIN_API_BASE,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    // Initialize axios client for REST API
    this.adsApiClient = axios.create({
      baseURL: LINKEDIN_ADS_API_BASE,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202309',
        'X-RestLi-Protocol-Version': '2.0.0'
      }
    });

    // Add response interceptor for error handling
    const errorHandler = async (error: unknown) => {
      if (error.response?.status === 429) {
        // Rate limited - wait and retry
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

    this.axiosClient.interceptors.response.use(
      (response) => response,
      errorHandler
    );

    this.adsApiClient.interceptors.response.use(
      (response) => response,
      errorHandler
    );
  }

  /**
   * Fetch campaign data
   */
  public async fetchCampaignData(): Promise<LinkedInCampaign[]> {
    await this.rateLimiter.checkLimit('linkedin_ads', 100, 86400000); // 100 per day

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

      const campaigns: LinkedInCampaign[] = [];
      const elements = response.data.elements || [];

      for (const element of elements) {
        campaigns.push(this.transformCampaignData(element));
      }

      // Handle pagination
      let nextUrl = response.data.paging?.links?.find(
        (link: unknown) => link.rel === 'next'
      )?.href;

      while (nextUrl) {
        const nextResponse = await axios.get(nextUrl, {
          headers: this.adsApiClient.defaults.headers
        });
        const nextElements = nextResponse.data.elements || [];

        for (const element of nextElements) {
          campaigns.push(this.transformCampaignData(element));
        }

        nextUrl = nextResponse.data.paging?.links?.find(
          (link: unknown) => link.rel === 'next'
        )?.href;
      }

      this.logger.info(`Fetched ${campaigns.length} LinkedIn campaigns`);
      return campaigns;
    } catch (error) {
      this.logger.error('Failed to fetch LinkedIn campaigns', error);
      throw error;
    }
  }

  /**
   * Fetch analytics data for campaigns
   */
  public async fetchAnalytics(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<LinkedInAnalytics[]> {
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
      const analytics: LinkedInAnalytics[] = [];

      // Fetch analytics in batches (max 20 campaigns per request)
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
    } catch (error) {
      this.logger.error('Failed to fetch LinkedIn analytics', error);
      throw error;
    }
  }

  /**
   * Get real-time metrics for a campaign
   */
  public async getRealTimeMetrics(campaignId: string): Promise<unknown> {
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
    } catch (error) {
      this.logger.error('Failed to fetch real-time LinkedIn metrics', error);
      throw error;
    }
  }

  /**
   * Create campaign
   */
  public async createCampaign(
    name: string,
    objectiveType: string,
    dailyBudget: number,
    targeting: LinkedInTargeting
  ): Promise<string> {
    await this.rateLimiter.checkLimit('linkedin_mutation', 100, 86400000);

    const campaignData = {
      account: `urn:li:sponsoredAccount:${this.config.accountId}`,
      name,
      objectiveType,
      type: 'SPONSORED_UPDATES',
      status: 'PAUSED',
      costType: 'CPM',
      dailyBudget: {
        amount: String(dailyBudget * 100), // Convert to cents
        currencyCode: 'USD'
      },
      targeting,
      locale: {
        country: 'US',
        language: 'en'
      }
    };

    try {
      const response = await this.adsApiClient.post(
        '/adCampaigns',
        campaignData
      );

      const campaignId = response.headers['x-linkedin-id'];
      this.logger.info(`Created LinkedIn campaign: ${campaignId}`);
      return campaignId;
    } catch (error) {
      this.logger.error('Failed to create LinkedIn campaign', error);
      throw error;
    }
  }

  /**
   * Update campaign status
   */
  public async updateCampaignStatus(
    campaignId: string,
    status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  ): Promise<void> {
    await this.rateLimiter.checkLimit('linkedin_mutation', 100, 86400000);

    try {
      await this.adsApiClient.patch(
        `/adCampaigns/${campaignId}`,
        {
          patch: {
            $set: {
              status
            }
          }
        }
      );

      this.logger.info(`Updated LinkedIn campaign ${campaignId} status to ${status}`);
    } catch (error) {
      this.logger.error('Failed to update campaign status', error);
      throw error;
    }
  }

  /**
   * Get audience insights
   */
  public async getAudienceInsights(targeting: LinkedInTargeting): Promise<unknown> {
    await this.rateLimiter.checkLimit('linkedin_insights', 100, 86400000);

    try {
      const response = await this.adsApiClient.post(
        '/audienceCount',
        {
          targeting
        }
      );

      return {
        activeAudienceCount: response.data.activeAudienceCount,
        totalAudienceCount: response.data.totalAudienceCount
      };
    } catch (error) {
      this.logger.error('Failed to fetch audience insights', error);
      throw error;
    }
  }

  /**
   * Get lead generation forms
   */
  public async getLeadForms(campaignId: string): Promise<any[]> {
    await this.rateLimiter.checkLimit('linkedin_ads', 100, 86400000);

    try {
      const response = await this.adsApiClient.get('/leadForms', {
        params: {
          q: 'campaign',
          campaign: `urn:li:sponsoredCampaign:${campaignId}`
        }
      });

      return response.data.elements || [];
    } catch (error) {
      this.logger.error('Failed to fetch lead forms', error);
      throw error;
    }
  }

  /**
   * Download leads
   */
  public async downloadLeads(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
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
    } catch (error) {
      this.logger.error('Failed to download leads', error);
      throw error;
    }
  }

  /**
   * Transform campaign data from API response
   */
  private transformCampaignData(data: unknown): LinkedInCampaign {
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

  /**
   * Health check
   */
  public async healthCheck(): Promise<unknown> {
    try {
      const response = await this.adsApiClient.get(
        `/adAccounts/${this.config.accountId}`
      );

      return {
        status: 'healthy',
        authenticated: true,
        accountId: this.config.accountId,
        accountName: response.data.name
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    // Clean up any open connections
    this.logger.info('LinkedIn Ads client cleaned up');
  }
}