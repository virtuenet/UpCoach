/**
 * Data Normalizer for Multi-Platform Advertising Data
 *
 * Standardizes data from different advertising platforms into a unified format
 * Features:
 * - Platform-specific data transformation
 * - Metric standardization
 * - Currency conversion
 * - Data validation and cleaning
 * - Schema mapping
 */

import { Logger } from 'winston';
import * as Joi from 'joi';

export interface NormalizedCampaign {
  platformId: string;
  campaignId: string;
  campaignName: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED' | 'DELETED';
  objective: string;
  startDate: Date;
  endDate?: Date;
  budget: number; // In USD
  budgetType: 'DAILY' | 'LIFETIME' | 'TOTAL';
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
  metadata: Record<string, any>;
}

export interface NormalizedMetrics {
  timestamp: Date;
  platformId: string;
  campaignId: string;
  adSetId?: string;
  creativeId?: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  reach?: number;
  frequency?: number;
  engagement?: number;
  videoViews?: number;
  videoCompletions?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  qualityScore?: number;
  relevanceScore?: number;
  demographics?: {
    age?: Record<string, number>;
    gender?: Record<string, number>;
    location?: Record<string, number>;
  };
  devices?: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

export class DataNormalizer {
  private logger: Logger;
  private currencyRates: Map<string, number>;
  private campaignSchema: Joi.Schema;
  private metricsSchema: Joi.Schema;

  constructor(logger?: Logger) {
    this.logger = logger || console as unknown;
    this.currencyRates = new Map([
      ['USD', 1.0],
      ['EUR', 1.18],
      ['GBP', 1.38],
      ['JPY', 0.0091],
      ['AUD', 0.73],
      ['CAD', 0.79]
    ]);

    // Define validation schemas
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

  /**
   * Normalize Google Ads data
   */
  public normalizeGoogleAdsData(data: unknown[]): NormalizedCampaign[] {
    const normalized: NormalizedCampaign[] = [];

    for (const campaign of data) {
      try {
        const budgetMicros = campaign.budget?.amount_micros || 0;
        const spendMicros = campaign.cost_micros || 0;

        const normalizedCampaign: NormalizedCampaign = {
          platformId: 'google_ads',
          campaignId: String(campaign.id),
          campaignName: campaign.name,
          status: this.mapGoogleStatus(campaign.status),
          objective: campaign.objective_type || campaign.bidding_strategy_type,
          startDate: new Date(campaign.start_date),
          endDate: campaign.end_date ? new Date(campaign.end_date) : undefined,
          budget: budgetMicros / 1000000, // Convert micros to dollars
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
      } catch (error) {
        this.logger.error('Failed to normalize Google Ads campaign', {
          campaignId: campaign.id,
          error
        });
      }
    }

    return normalized;
  }

  /**
   * Normalize Meta Ads data
   */
  public normalizeMetaAdsData(data: unknown[]): NormalizedCampaign[] {
    const normalized: NormalizedCampaign[] = [];

    for (const campaign of data) {
      try {
        const budget = campaign.daily_budget || campaign.lifetime_budget || 0;
        const spend = campaign.spend || 0;

        const normalizedCampaign: NormalizedCampaign = {
          platformId: 'meta_ads',
          campaignId: campaign.id,
          campaignName: campaign.name,
          status: this.mapMetaStatus(campaign.status),
          objective: campaign.objective,
          startDate: new Date(campaign.start_time || campaign.created_time),
          endDate: campaign.stop_time ? new Date(campaign.stop_time) : undefined,
          budget: budget / 100, // Convert cents to dollars
          budgetType: campaign.daily_budget ? 'DAILY' : 'LIFETIME',
          spend: spend,
          impressions: campaign.impressions || 0,
          clicks: campaign.clicks || 0,
          conversions: this.extractMetaConversions(campaign.actions),
          conversionValue: campaign.conversion_values?.value || 0,
          ctr: campaign.ctr || this.calculateCtr(campaign.clicks, campaign.impressions),
          cpc: campaign.cpc || this.calculateCpc(spend, campaign.clicks),
          cpa: campaign.cost_per_action_type?.find((a: unknown) => a.action_type === 'purchase')?.value || 0,
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
      } catch (error) {
        this.logger.error('Failed to normalize Meta Ads campaign', {
          campaignId: campaign.id,
          error
        });
      }
    }

    return normalized;
  }

  /**
   * Normalize LinkedIn Ads data
   */
  public normalizeLinkedInAdsData(data: unknown[]): NormalizedCampaign[] {
    const normalized: NormalizedCampaign[] = [];

    for (const campaign of data) {
      try {
        const budget = campaign.dailyBudget?.amount || campaign.totalBudget?.amount || 0;
        const spend = campaign.spend || 0;

        const normalizedCampaign: NormalizedCampaign = {
          platformId: 'linkedin_ads',
          campaignId: campaign.id,
          campaignName: campaign.name,
          status: this.mapLinkedInStatus(campaign.status),
          objective: campaign.objectiveType,
          startDate: new Date(campaign.runSchedule?.start || campaign.createdAt),
          endDate: campaign.runSchedule?.end ? new Date(campaign.runSchedule.end) : undefined,
          budget: parseFloat(budget) / 100, // Convert cents to dollars
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
      } catch (error) {
        this.logger.error('Failed to normalize LinkedIn Ads campaign', {
          campaignId: campaign.id,
          error
        });
      }
    }

    return normalized;
  }

  /**
   * Normalize webhook data from Google Ads
   */
  public normalizeGoogleAdsWebhook(data: unknown): unknown {
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

  /**
   * Normalize webhook data from Meta Ads
   */
  public normalizeMetaAdsWebhook(data: unknown): unknown {
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
        conversions: data.value?.actions?.find((a: unknown) =>
          a.action_type === 'purchase'
        )?.value
      }
    };
  }

  /**
   * Normalize webhook data from LinkedIn Ads
   */
  public normalizeLinkedInAdsWebhook(data: unknown): unknown {
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

  /**
   * Normalize real-time metrics across platforms
   */
  public normalizeRealTimeMetrics(
    platform: string,
    data: unknown
  ): NormalizedMetrics {
    const baseMetrics: NormalizedMetrics = {
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

  /**
   * Helper: Normalize Google Ads metrics
   */
  private normalizeGoogleMetrics(data: unknown, base: NormalizedMetrics): NormalizedMetrics {
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

  /**
   * Helper: Normalize Meta Ads metrics
   */
  private normalizeMetaMetrics(data: unknown, base: NormalizedMetrics): NormalizedMetrics {
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

  /**
   * Helper: Normalize LinkedIn Ads metrics
   */
  private normalizeLinkedInMetrics(data: unknown, base: NormalizedMetrics): NormalizedMetrics {
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

  /**
   * Map platform status to normalized status
   */
  private mapGoogleStatus(status: string): NormalizedCampaign['status'] {
    const statusMap: Record<string, NormalizedCampaign['status']> = {
      'ENABLED': 'ACTIVE',
      'PAUSED': 'PAUSED',
      'REMOVED': 'DELETED',
      'ENDED': 'COMPLETED'
    };
    return statusMap[status] || 'PAUSED';
  }

  private mapMetaStatus(status: string): NormalizedCampaign['status'] {
    const statusMap: Record<string, NormalizedCampaign['status']> = {
      'ACTIVE': 'ACTIVE',
      'PAUSED': 'PAUSED',
      'DELETED': 'DELETED',
      'ARCHIVED': 'ARCHIVED'
    };
    return statusMap[status] || 'PAUSED';
  }

  private mapLinkedInStatus(status: string): NormalizedCampaign['status'] {
    const statusMap: Record<string, NormalizedCampaign['status']> = {
      'ACTIVE': 'ACTIVE',
      'PAUSED': 'PAUSED',
      'ARCHIVED': 'ARCHIVED',
      'COMPLETED': 'COMPLETED',
      'CANCELED': 'DELETED'
    };
    return statusMap[status] || 'PAUSED';
  }

  /**
   * Extract conversions from Meta Ads actions array
   */
  private extractMetaConversions(actions: unknown[]): number {
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

  /**
   * Calculate metrics
   */
  private calculateCtr(clicks: number, impressions: number): number {
    if (!impressions || impressions === 0) return 0;
    return (clicks / impressions) * 100;
  }

  private calculateCpc(spend: number, clicks: number): number {
    if (!clicks || clicks === 0) return 0;
    return spend / clicks;
  }

  private calculateCpa(spend: number, conversions: number): number {
    if (!conversions || conversions === 0) return 0;
    return spend / conversions;
  }

  private calculateRoas(revenue: number, spend: number): number {
    if (!spend || spend === 0) return 0;
    return revenue / spend;
  }

  /**
   * Convert currency to USD
   */
  public convertToUsd(amount: number, currency: string): number {
    const rate = this.currencyRates.get(currency.toUpperCase());
    if (!rate) {
      this.logger.warn(`Unknown currency: ${currency}, using 1.0 rate`);
      return amount;
    }
    return amount * rate;
  }

  /**
   * Validate campaign data
   */
  private validateCampaign(campaign: NormalizedCampaign): NormalizedCampaign {
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

  /**
   * Validate metrics data
   */
  public validateMetrics(metrics: NormalizedMetrics): NormalizedMetrics {
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

  /**
   * Clean and sanitize data
   */
  public sanitizeData(data: unknown): unknown {
    if (typeof data === 'string') {
      // Remove special characters that might cause issues
      return data.replace(/[<>]/g, '').trim();
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    if (data && typeof data === 'object') {
      const sanitized: unknown = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeData(value);
      }
      return sanitized;
    }

    return data;
  }
}