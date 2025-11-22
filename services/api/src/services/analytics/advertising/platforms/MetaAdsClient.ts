/**
 * Meta Ads API Client (Facebook & Instagram)
 *
 * Handles interactions with Meta Marketing API v17.0
 * Features:
 * - Campaign and ad set management
 * - Cross-platform insights (Facebook & Instagram)
 * - Audience targeting data
 * - Creative performance tracking
 * - Real-time metrics streaming
 */

import axios, { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { RateLimiter } from '../../../../utils/RateLimiter';
import { RetryPolicy } from '../../../../utils/RetryPolicy';
import crypto from 'crypto';

const META_API_VERSION = 'v17.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaAdsConfig {
  appId: string;
  appSecret: string;
  accessToken: string;
  businessId: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time: string;
  stop_time?: string;
  created_time: string;
  updated_time: string;
  bid_strategy?: string;
  optimization_goal?: string;
  adsets?: MetaAdSet[];
}

export interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time: string;
  end_time?: string;
  targeting: unknown;
  promoted_object?: unknown;
  billing_event: string;
  optimization_goal: string;
}

export interface MetaInsights {
  date_start: string;
  date_stop: string;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  frequency: number;
  cpm: number;
  cpp: number;
  ctr: number;
  cpc: number;
  actions?: Array<{
    action_type: string;
    value: number;
  }>;
  conversions?: number;
  conversion_values?: number;
  cost_per_action_type?: Array<{
    action_type: string;
    value: number;
  }>;
  video_avg_time_watched_actions?: Array<{
    action_type: string;
    value: number;
  }>;
  video_p25_watched_actions?: number;
  video_p50_watched_actions?: number;
  video_p75_watched_actions?: number;
  video_p100_watched_actions?: number;
}

export class MetaAdsClient {
  private logger: Logger;
  private rateLimiter: RateLimiter;
  private config: MetaAdsConfig;
  private axiosClient: AxiosInstance;
  private retryPolicy: RetryPolicy;
  private appAccessToken?: string;

  constructor(
    config: MetaAdsConfig,
    logger: Logger,
    rateLimiter: RateLimiter
  ) {
    this.config = config;
    this.logger = logger;
    this.rateLimiter = rateLimiter;
    this.retryPolicy = new RetryPolicy();

    // Initialize axios client
    this.axiosClient = axios.create({
      baseURL: META_API_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.axiosClient.interceptors.request.use((config) => {
      config.params = config.params || {};
      config.params.access_token = this.config.accessToken;
      return config;
    });

    // Add response interceptor for error handling
    this.axiosClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.data?.error) {
          const fbError = error.response.data.error;
          this.logger.error('Meta API Error', {
            message: fbError.message,
            type: fbError.type,
            code: fbError.code,
            subcode: fbError.error_subcode
          });

          // Handle rate limiting
          if (fbError.code === 4 || fbError.code === 17) {
            await this.handleRateLimit(fbError);
          }
        }
        throw error;
      }
    );
  }

  /**
   * Handle Meta API rate limiting
   */
  private async handleRateLimit(error: unknown): Promise<void> {
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

      // Back off if usage is high
      if (callCount > 95 || totalTime > 95 || totalCPUTime > 95) {
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
      }
    }
  }

  /**
   * Generate app access token
   */
  private async getAppAccessToken(): Promise<string> {
    if (this.appAccessToken) {
      return this.appAccessToken;
    }

    const proof = crypto
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
    } catch (error) {
      this.logger.error('Failed to get app access token', error);
      throw error;
    }
  }

  /**
   * Fetch campaign data
   */
  public async fetchCampaignData(): Promise<MetaCampaign[]> {
    await this.rateLimiter.checkLimit('meta_ads', 200, 3600000); // 200 per hour

    try {
      const response = await this.retryPolicy.execute(async () => {
        return await this.axiosClient.get(
          `/act_${this.config.businessId}/campaigns`,
          {
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
          }
        );
      });

      const campaigns: MetaCampaign[] = response.data.data || [];

      // Handle pagination
      let nextPage = response.data.paging?.next;
      while (nextPage) {
        const nextResponse = await axios.get(nextPage);
        campaigns.push(...(nextResponse.data.data || []));
        nextPage = nextResponse.data.paging?.next;
      }

      this.logger.info(`Fetched ${campaigns.length} Meta campaigns`);
      return campaigns;
    } catch (error) {
      this.logger.error('Failed to fetch Meta campaigns', error);
      throw error;
    }
  }

  /**
   * Fetch insights for campaigns
   */
  public async fetchInsights(
    objectId: string,
    objectType: 'campaign' | 'adset' | 'ad',
    dateRange: { since: string; until: string }
  ): Promise<MetaInsights[]> {
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

      const insights: MetaInsights[] = response.data.data || [];

      // Process conversions from actions
      insights.forEach(insight => {
        if (insight.actions) {
          const conversions = insight.actions.filter(
            action => action.action_type.includes('conversion')
          );
          insight.conversions = conversions.reduce(
            (sum, conv) => sum + conv.value,
            0
          );
        }
      });

      return insights;
    } catch (error) {
      this.logger.error('Failed to fetch Meta insights', error);
      throw error;
    }
  }

  /**
   * Get real-time metrics for a campaign
   */
  public async getRealTimeMetrics(campaignId: string): Promise<unknown> {
    await this.rateLimiter.checkLimit('meta_realtime', 100, 3600000);

    try {
      const today = new Date().toISOString().split('T')[0];

      const response = await this.axiosClient.get(
        `/${campaignId}/insights`,
        {
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
        }
      );

      if (response.data.data?.length > 0) {
        const data = response.data.data[0];

        // Extract conversions from actions
        let conversions = 0;
        let revenue = 0;
        if (data.actions) {
          data.actions.forEach((action: unknown) => {
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
    } catch (error) {
      this.logger.error('Failed to fetch real-time Meta metrics', error);
      throw error;
    }
  }

  /**
   * Create custom audience
   */
  public async createCustomAudience(
    name: string,
    description: string,
    rules: unknown
  ): Promise<string> {
    await this.rateLimiter.checkLimit('meta_mutation', 50, 3600000);

    try {
      const response = await this.axiosClient.post(
        `/act_${this.config.businessId}/customaudiences`,
        {
          name,
          description,
          subtype: 'CUSTOM',
          rule: JSON.stringify(rules)
        }
      );

      const audienceId = response.data.id;
      this.logger.info(`Created custom audience: ${audienceId}`);
      return audienceId;
    } catch (error) {
      this.logger.error('Failed to create custom audience', error);
      throw error;
    }
  }

  /**
   * Create lookalike audience
   */
  public async createLookalikeAudience(
    name: string,
    sourceAudienceId: string,
    country: string,
    ratio: number = 0.01
  ): Promise<string> {
    await this.rateLimiter.checkLimit('meta_mutation', 50, 3600000);

    try {
      const response = await this.axiosClient.post(
        `/act_${this.config.businessId}/customaudiences`,
        {
          name,
          subtype: 'LOOKALIKE',
          origin_audience_id: sourceAudienceId,
          lookalike_spec: JSON.stringify({
            country,
            ratio,
            type: 'similarity'
          })
        }
      );

      const audienceId = response.data.id;
      this.logger.info(`Created lookalike audience: ${audienceId}`);
      return audienceId;
    } catch (error) {
      this.logger.error('Failed to create lookalike audience', error);
      throw error;
    }
  }

  /**
   * Get ad creative performance
   */
  public async getCreativePerformance(
    adId: string,
    dateRange: { since: string; until: string }
  ): Promise<unknown> {
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
    } catch (error) {
      this.logger.error('Failed to fetch creative performance', error);
      throw error;
    }
  }

  /**
   * Update campaign budget
   */
  public async updateCampaignBudget(
    campaignId: string,
    dailyBudget?: number,
    lifetimeBudget?: number
  ): Promise<void> {
    await this.rateLimiter.checkLimit('meta_mutation', 50, 3600000);

    const updates: unknown = {};
    if (dailyBudget !== undefined) {
      updates.daily_budget = Math.round(dailyBudget * 100); // Convert to cents
    }
    if (lifetimeBudget !== undefined) {
      updates.lifetime_budget = Math.round(lifetimeBudget * 100);
    }

    try {
      await this.axiosClient.post(`/${campaignId}`, updates);
      this.logger.info(`Updated budget for campaign ${campaignId}`);
    } catch (error) {
      this.logger.error('Failed to update campaign budget', error);
      throw error;
    }
  }

  /**
   * Pause/resume campaign
   */
  public async updateCampaignStatus(
    campaignId: string,
    status: 'ACTIVE' | 'PAUSED'
  ): Promise<void> {
    await this.rateLimiter.checkLimit('meta_mutation', 50, 3600000);

    try {
      await this.axiosClient.post(`/${campaignId}`, { status });
      this.logger.info(`Updated status for campaign ${campaignId} to ${status}`);
    } catch (error) {
      this.logger.error('Failed to update campaign status', error);
      throw error;
    }
  }

  /**
   * Get audience insights
   */
  public async getAudienceInsights(audienceId: string): Promise<unknown> {
    await this.rateLimiter.checkLimit('meta_insights', 200, 3600000);

    try {
      const response = await this.axiosClient.get(
        `/act_${this.config.businessId}/reachestimate`,
        {
          params: {
            targeting_spec: JSON.stringify({
              custom_audiences: [{ id: audienceId }]
            })
          }
        }
      );

      return response.data.data?.[0] || null;
    } catch (error) {
      this.logger.error('Failed to fetch audience insights', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<unknown> {
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
    this.logger.info('Meta Ads client cleaned up');
  }
}