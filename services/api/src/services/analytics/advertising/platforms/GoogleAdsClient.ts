/**
 * Google Ads API Client
 *
 * Handles all interactions with Google Ads API v14
 * Features:
 * - OAuth2 authentication
 * - Campaign performance data retrieval
 * - Real-time metrics streaming
 * - Conversion tracking
 * - Budget management
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Logger } from 'winston';
import axios, { AxiosInstance } from 'axios';
import { RateLimiter } from '../../../../utils/RateLimiter';
import { RetryPolicy } from '../../../../utils/RetryPolicy';

const GOOGLE_ADS_API_VERSION = 'v14';
const GOOGLE_ADS_API_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

export interface GoogleAdsConfig {
  developerToken: string;
  clientCustomerId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: string;
  budget: {
    amount_micros: number;
    period: string;
  };
  start_date: string;
  end_date?: string;
  bidding_strategy_type: string;
  target_cpa?: number;
  target_roas?: number;
}

export interface GoogleAdsMetrics {
  campaign_id: string;
  date: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  conversion_value: number;
  average_cpc: number;
  average_cpm: number;
  ctr: number;
  conversion_rate: number;
  cost_per_conversion: number;
  roas: number;
  quality_score?: number;
  search_impression_share?: number;
  search_rank_lost_impression_share?: number;
}

export class GoogleAdsClient {
  private logger: Logger;
  private rateLimiter: RateLimiter;
  private config: GoogleAdsConfig;
  private oauth2Client: OAuth2Client;
  private axiosClient: AxiosInstance;
  private retryPolicy: RetryPolicy;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(
    config: GoogleAdsConfig,
    logger: Logger,
    rateLimiter: RateLimiter
  ) {
    this.config = config;
    this.logger = logger;
    this.rateLimiter = rateLimiter;
    this.retryPolicy = new RetryPolicy();

    // Initialize OAuth2 client
    this.oauth2Client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );

    this.oauth2Client.setCredentials({
      refresh_token: config.refreshToken
    });

    // Initialize axios client
    this.axiosClient = axios.create({
      baseURL: GOOGLE_ADS_API_BASE,
      timeout: 30000,
      headers: {
        'developer-token': config.developerToken,
        'login-customer-id': config.clientCustomerId
      }
    });

    // Add request interceptor for authentication
    this.axiosClient.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      config.headers['Authorization'] = `Bearer ${token}`;
      return config;
    });

    // Add response interceptor for error handling
    this.axiosClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, refresh and retry
          this.accessToken = undefined;
          const token = await this.getAccessToken();
          error.config.headers['Authorization'] = `Bearer ${token}`;
          return this.axiosClient.request(error.config);
        }
        throw error;
      }
    );
  }

  /**
   * Get access token (refresh if needed)
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.accessToken = credentials.access_token!;
      this.tokenExpiry = credentials.expiry_date ?
        new Date(credentials.expiry_date) :
        new Date(Date.now() + 3600000); // 1 hour default

      this.logger.debug('Google Ads access token refreshed');
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to refresh Google Ads access token', error);
      throw error;
    }
  }

  /**
   * Fetch campaign data
   */
  public async fetchCampaignData(): Promise<GoogleAdsCampaign[]> {
    await this.rateLimiter.checkLimit('google_ads', 10, 60000); // 10 requests per minute

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign_budget.amount_micros,
        campaign.start_date,
        campaign.end_date,
        campaign.bidding_strategy_type,
        campaign.target_cpa.target_cpa_micros,
        campaign.target_roas.target_roas
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ORDER BY campaign.name
    `;

    try {
      const response = await this.retryPolicy.execute(async () => {
        return await this.axiosClient.post(
          `/customers/${this.config.clientCustomerId}/googleAds:searchStream`,
          { query }
        );
      });

      const campaigns: GoogleAdsCampaign[] = [];

      for (const row of response.data.results || []) {
        campaigns.push(this.transformCampaignData(row));
      }

      this.logger.info(`Fetched ${campaigns.length} Google Ads campaigns`);
      return campaigns;
    } catch (error) {
      this.logger.error('Failed to fetch Google Ads campaigns', error);
      throw error;
    }
  }

  /**
   * Fetch campaign performance metrics
   */
  public async fetchPerformanceMetrics(
    campaignIds: string[],
    startDate: string,
    endDate: string
  ): Promise<GoogleAdsMetrics[]> {
    await this.rateLimiter.checkLimit('google_ads', 10, 60000);

    const query = `
      SELECT
        campaign.id,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.average_cpc,
        metrics.average_cpm,
        metrics.ctr,
        metrics.conversion_rate,
        metrics.cost_per_conversion,
        metrics.roas,
        campaign.optimization_score
      FROM campaign
      WHERE campaign.id IN (${campaignIds.join(',')})
        AND segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY segments.date DESC
    `;

    try {
      const response = await this.retryPolicy.execute(async () => {
        return await this.axiosClient.post(
          `/customers/${this.config.clientCustomerId}/googleAds:searchStream`,
          { query }
        );
      });

      const metrics: GoogleAdsMetrics[] = [];

      for (const row of response.data.results || []) {
        metrics.push(this.transformMetricsData(row));
      }

      this.logger.info(`Fetched ${metrics.length} performance metrics for Google Ads`);
      return metrics;
    } catch (error) {
      this.logger.error('Failed to fetch Google Ads metrics', error);
      throw error;
    }
  }

  /**
   * Get real-time metrics for a campaign
   */
  public async getRealTimeMetrics(campaignId: string): Promise<unknown> {
    await this.rateLimiter.checkLimit('google_ads_realtime', 20, 60000);

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversion_rate,
        metrics.roas,
        metrics.interaction_rate,
        metrics.engagement_rate,
        metrics.video_views,
        metrics.video_view_rate
      FROM campaign
      WHERE campaign.id = '${campaignId}'
        AND segments.date DURING TODAY
    `;

    try {
      const response = await this.axiosClient.post(
        `/customers/${this.config.clientCustomerId}/googleAds:search`,
        { query }
      );

      if (response.data.results?.length > 0) {
        const data = response.data.results[0];
        return {
          timestamp: new Date(),
          platform: 'google',
          campaignId,
          impressions: data.metrics.impressions || 0,
          clicks: data.metrics.clicks || 0,
          spend: (data.metrics.cost_micros || 0) / 1000000,
          conversions: data.metrics.conversions || 0,
          revenue: data.metrics.conversions_value || 0,
          ctr: data.metrics.ctr || 0,
          cpc: (data.metrics.average_cpc || 0) / 1000000,
          conversionRate: data.metrics.conversion_rate || 0,
          roas: data.metrics.roas || 0,
          videoViews: data.metrics.video_views || 0,
          engagement: data.metrics.engagement_rate || 0
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to fetch real-time Google Ads metrics', error);
      throw error;
    }
  }

  /**
   * Create conversion action
   */
  public async createConversionAction(
    name: string,
    category: string,
    value?: number
  ): Promise<string> {
    await this.rateLimiter.checkLimit('google_ads_mutation', 5, 60000);

    const conversionAction = {
      name,
      category,
      type: 'WEBPAGE',
      status: 'ENABLED',
      view_through_lookback_window_days: 1,
      value_settings: {
        default_value: value || 0,
        always_use_default_value: !value
      }
    };

    try {
      const response = await this.axiosClient.post(
        `/customers/${this.config.clientCustomerId}/conversionActions:mutate`,
        {
          operations: [{
            create: conversionAction
          }]
        }
      );

      const resourceName = response.data.results[0].resource_name;
      this.logger.info(`Created conversion action: ${resourceName}`);
      return resourceName;
    } catch (error) {
      this.logger.error('Failed to create conversion action', error);
      throw error;
    }
  }

  /**
   * Update campaign budget
   */
  public async updateCampaignBudget(
    campaignId: string,
    budgetMicros: number
  ): Promise<void> {
    await this.rateLimiter.checkLimit('google_ads_mutation', 5, 60000);

    try {
      await this.axiosClient.post(
        `/customers/${this.config.clientCustomerId}/campaigns:mutate`,
        {
          operations: [{
            update: {
              resource_name: `customers/${this.config.clientCustomerId}/campaigns/${campaignId}`,
              campaign_budget: {
                amount_micros: budgetMicros
              }
            },
            update_mask: 'campaign_budget.amount_micros'
          }]
        }
      );

      this.logger.info(`Updated budget for campaign ${campaignId}`);
    } catch (error) {
      this.logger.error('Failed to update campaign budget', error);
      throw error;
    }
  }

  /**
   * Get keyword performance
   */
  public async getKeywordPerformance(
    campaignId: string,
    limit: number = 50
  ): Promise<any[]> {
    await this.rateLimiter.checkLimit('google_ads', 10, 60000);

    const query = `
      SELECT
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.quality_info.quality_score,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM keyword_view
      WHERE campaign.id = '${campaignId}'
        AND segments.date DURING LAST_30_DAYS
      ORDER BY metrics.impressions DESC
      LIMIT ${limit}
    `;

    try {
      const response = await this.axiosClient.post(
        `/customers/${this.config.clientCustomerId}/googleAds:search`,
        { query }
      );

      return response.data.results || [];
    } catch (error) {
      this.logger.error('Failed to fetch keyword performance', error);
      throw error;
    }
  }

  /**
   * Transform campaign data from API response
   */
  private transformCampaignData(row: unknown): GoogleAdsCampaign {
    return {
      id: row.campaign.id,
      name: row.campaign.name,
      status: row.campaign.status,
      budget: {
        amount_micros: row.campaign_budget?.amount_micros || 0,
        period: row.campaign_budget?.period || 'DAILY'
      },
      start_date: row.campaign.start_date,
      end_date: row.campaign.end_date,
      bidding_strategy_type: row.campaign.bidding_strategy_type,
      target_cpa: row.campaign.target_cpa?.target_cpa_micros ?
        row.campaign.target_cpa.target_cpa_micros / 1000000 : undefined,
      target_roas: row.campaign.target_roas?.target_roas
    };
  }

  /**
   * Transform metrics data from API response
   */
  private transformMetricsData(row: unknown): GoogleAdsMetrics {
    return {
      campaign_id: row.campaign.id,
      date: row.segments.date,
      impressions: row.metrics.impressions || 0,
      clicks: row.metrics.clicks || 0,
      cost_micros: row.metrics.cost_micros || 0,
      conversions: row.metrics.conversions || 0,
      conversion_value: row.metrics.conversions_value || 0,
      average_cpc: row.metrics.average_cpc || 0,
      average_cpm: row.metrics.average_cpm || 0,
      ctr: row.metrics.ctr || 0,
      conversion_rate: row.metrics.conversion_rate || 0,
      cost_per_conversion: row.metrics.cost_per_conversion || 0,
      roas: row.metrics.roas || 0,
      quality_score: row.campaign.optimization_score
    };
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<unknown> {
    try {
      await this.getAccessToken();

      // Try a simple query
      const response = await this.axiosClient.post(
        `/customers/${this.config.clientCustomerId}/googleAds:search`,
        {
          query: 'SELECT campaign.id FROM campaign LIMIT 1'
        }
      );

      return {
        status: 'healthy',
        authenticated: true,
        customerId: this.config.clientCustomerId
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
    this.logger.info('Google Ads client cleaned up');
  }
}