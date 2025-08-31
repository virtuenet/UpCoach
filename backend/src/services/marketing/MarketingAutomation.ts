import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import axios from 'axios';

interface MarketingEvent {
  userId: string;
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'push' | 'in-app' | 'sms';
  triggers: CampaignTrigger[];
  audience: AudienceFilter;
  content: CampaignContent;
  schedule?: CampaignSchedule;
  active: boolean;
}

interface CampaignTrigger {
  event: string;
  conditions?: Record<string, any>;
  delay?: number; // minutes
}

interface AudienceFilter {
  segments?: string[];
  properties?: Record<string, any>;
  behaviors?: BehaviorFilter[];
}

interface BehaviorFilter {
  action: string;
  timeframe: string; // e.g., "last_30_days"
  count?: number;
  operator?: 'equals' | 'greater_than' | 'less_than';
}

interface CampaignContent {
  subject?: string;
  body: string;
  templateId?: string;
  personalization?: boolean;
  abTest?: ABTestConfig;
}

interface ABTestConfig {
  variants: Array<{
    id: string;
    weight: number;
    content: Partial<CampaignContent>;
  }>;
}

interface CampaignSchedule {
  startDate: Date;
  endDate?: Date;
  timezone?: string;
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
}

export class MarketingAutomationService {
  private campaigns: Map<string, Campaign> = new Map();
  private segmentEngine: SegmentEngine;
  private contentPersonalizer: ContentPersonalizer;

  constructor() {
    this.segmentEngine = new SegmentEngine();
    this.contentPersonalizer = new ContentPersonalizer();
    this.initializeDefaultCampaigns();
  }

  private initializeDefaultCampaigns() {
    // Welcome Series
    this.campaigns.set('welcome-series', {
      id: 'welcome-series',
      name: 'Welcome Series',
      type: 'email',
      triggers: [{ event: 'user_registered' }],
      audience: { segments: ['new_users'] },
      content: {
        templateId: 'welcome-email-v2',
        body: '',
        personalization: true,
      },
      active: true,
    });

    // Re-engagement Campaign
    this.campaigns.set('re-engagement', {
      id: 're-engagement',
      name: 'Win Back Inactive Users',
      type: 'email',
      triggers: [{ event: 'user_inactive_7_days' }],
      audience: {
        behaviors: [
          {
            action: 'app_open',
            timeframe: 'last_7_days',
            count: 0,
            operator: 'equals',
          },
        ],
      },
      content: {
        subject: "We miss you! Here's what you've been missing...",
        body: 'personalized_content',
        abTest: {
          variants: [
            {
              id: 'discount',
              weight: 0.5,
              content: { subject: '🎁 Come back for 50% off your next month!' },
            },
            {
              id: 'feature',
              weight: 0.5,
              content: { subject: '🚀 New features just for you!' },
            },
          ],
        },
      },
      active: true,
    });

    // Goal Achievement Campaign
    this.campaigns.set('goal-achieved', {
      id: 'goal-achieved',
      name: 'Goal Achievement Celebration',
      type: 'push',
      triggers: [{ event: 'goal_completed' }],
      audience: { segments: ['active_users'] },
      content: {
        body: '🎉 Congratulations on achieving your goal!',
        personalization: true,
      },
      active: true,
    });

    // Subscription Renewal
    this.campaigns.set('subscription-renewal', {
      id: 'subscription-renewal',
      name: 'Subscription Renewal Reminder',
      type: 'email',
      triggers: [
        {
          event: 'subscription_ending_soon',
          conditions: { days_until_expiry: 7 },
        },
      ],
      audience: { segments: ['paid_users'] },
      content: {
        subject: 'Your UpCoach subscription is ending soon',
        body: 'renewal_reminder_template',
        personalization: true,
      },
      active: true,
    });
  }

  // Track marketing events
  async trackEvent(event: MarketingEvent): Promise<void> {
    try {
      // Send to analytics platforms
      await Promise.all([
        this.sendToMixpanel(event),
        this.sendToGA4(event),
        this.sendToSegment(event),
      ]);

      // Check campaign triggers
      await this.processCampaignTriggers(event);

      // Update user segments
      await this.segmentEngine.updateUserSegments(event.userId);

      logger.info('Marketing event tracked', { event });
    } catch (error) {
      logger.error('Failed to track marketing event', { error, event });
    }
  }

  // Process campaign triggers
  private async processCampaignTriggers(event: MarketingEvent): Promise<void> {
    for (const [id, campaign] of this.campaigns) {
      if (!campaign.active) continue;

      const matchingTrigger = campaign.triggers.find(
        trigger =>
          trigger.event === event.event &&
          this.matchesConditions(trigger.conditions, event.properties)
      );

      if (matchingTrigger) {
        await this.scheduleCampaignDelivery(campaign, event.userId, matchingTrigger.delay || 0);
      }
    }
  }

  // Schedule campaign delivery
  private async scheduleCampaignDelivery(
    campaign: Campaign,
    userId: string,
    delayMinutes: number
  ): Promise<void> {
    // Check if user matches audience criteria
    const user = await User.findByPk(userId);
    if (!user || !(await this.matchesAudience(user, campaign.audience))) {
      return;
    }

    // Select A/B test variant if applicable
    const content = campaign.content.abTest
      ? this.selectABTestVariant(campaign.content.abTest)
      : campaign.content;

    // Personalize content
    const personalizedContent = campaign.content.personalization
      ? await this.contentPersonalizer.personalize(content, user)
      : content;

    // Schedule delivery
    const deliveryTime = new Date(Date.now() + delayMinutes * 60 * 1000);

    await this.scheduleDelivery({
      campaignId: campaign.id,
      userId,
      type: campaign.type,
      content: personalizedContent,
      scheduledFor: deliveryTime,
    });

    logger.info('Campaign scheduled', {
      campaignId: campaign.id,
      userId,
      scheduledFor: deliveryTime,
    });
  }

  // Match audience criteria
  private async matchesAudience(user: User, audience: AudienceFilter): Promise<boolean> {
    // Check segments
    if (audience.segments) {
      const userSegments = await this.segmentEngine.getUserSegments(user.id);
      const hasRequiredSegment = audience.segments.some(segment => userSegments.includes(segment));
      if (!hasRequiredSegment) return false;
    }

    // Check properties
    if (audience.properties) {
      for (const [key, value] of Object.entries(audience.properties)) {
        if ((user as any)[key] !== value) return false;
      }
    }

    // Check behaviors
    if (audience.behaviors) {
      for (const behavior of audience.behaviors) {
        if (!(await this.matchesBehavior(user.id, behavior))) {
          return false;
        }
      }
    }

    return true;
  }

  // Analytics integrations
  private async sendToMixpanel(event: MarketingEvent): Promise<void> {
    if (!process.env.MIXPANEL_TOKEN) return;

    try {
      await axios.post(
        'https://api.mixpanel.com/track',
        {
          event: event.event,
          properties: {
            distinct_id: event.userId,
            time: event.timestamp || new Date(),
            ...event.properties,
          },
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(process.env.MIXPANEL_TOKEN).toString('base64')}`,
          },
        }
      );
    } catch (error) {
      logger.error('Failed to send to Mixpanel', { error });
    }
  }

  private async sendToGA4(event: MarketingEvent): Promise<void> {
    if (!process.env.GA4_MEASUREMENT_ID || !process.env.GA4_API_SECRET) return;

    try {
      await axios.post(
        `https://www.google-analytics.com/mp/collect`,
        {
          client_id: event.userId,
          events: [
            {
              name: event.event,
              params: event.properties,
            },
          ],
        },
        {
          params: {
            measurement_id: process.env.GA4_MEASUREMENT_ID,
            api_secret: process.env.GA4_API_SECRET,
          },
        }
      );
    } catch (error) {
      logger.error('Failed to send to GA4', { error });
    }
  }

  private async sendToSegment(event: MarketingEvent): Promise<void> {
    if (!process.env.SEGMENT_WRITE_KEY) return;

    try {
      await axios.post(
        'https://api.segment.io/v1/track',
        {
          userId: event.userId,
          event: event.event,
          properties: event.properties,
          timestamp: event.timestamp,
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(process.env.SEGMENT_WRITE_KEY + ':').toString('base64')}`,
          },
        }
      );
    } catch (error) {
      logger.error('Failed to send to Segment', { error });
    }
  }

  // Helper methods
  private matchesConditions(
    conditions?: Record<string, any>,
    properties?: Record<string, any>
  ): boolean {
    if (!conditions) return true;
    if (!properties) return false;

    return Object.entries(conditions).every(([key, value]) => properties[key] === value);
  }

  private selectABTestVariant(abTest: ABTestConfig): CampaignContent {
    const random = Math.random();
    let cumulativeWeight = 0;

    for (const variant of abTest.variants) {
      cumulativeWeight += variant.weight;
      if (random < cumulativeWeight) {
        return variant.content as CampaignContent;
      }
    }

    return abTest.variants[0].content as CampaignContent;
  }

  private async matchesBehavior(_userId: string, behavior: BehaviorFilter): Promise<boolean> {
    // Query user behavior from analytics
    // TODO: Implement getUserActionCount in analyticsService
    const count = 0; // await analyticsService.getUserActionCount(
    //   userId,
    //   behavior.action,
    //   behavior.timeframe
    // );

    switch (behavior.operator) {
      case 'equals':
        return count === behavior.count;
      case 'greater_than':
        return count > (behavior.count || 0);
      case 'less_than':
        return count < (behavior.count || 0);
      default:
        return false;
    }
  }

  private async scheduleDelivery(delivery: any): Promise<void> {
    // Implementation would depend on your queue/scheduling system
    // For now, we'll use a simple in-memory approach
    setTimeout(async () => {
      await this.deliverCampaign(delivery);
    }, delivery.scheduledFor.getTime() - Date.now());
  }

  private async deliverCampaign(delivery: any): Promise<void> {
    switch (delivery.type) {
      case 'email':
        // Send via email service
        break;
      case 'push':
        // Send via push notification service
        break;
      case 'in-app':
        // Store for in-app display
        break;
      case 'sms':
        // Send via SMS service
        break;
    }
  }
}

// Segment Engine for user categorization
class SegmentEngine {
  async getUserSegments(userId: string): Promise<string[]> {
    const segments: string[] = [];

    const user = await User.findByPk(userId, {
      include: ['goals'],
    });

    if (!user) return segments;

    // Basic segments
    if (user.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      segments.push('new_users');
    }

    // TODO: Add subscriptions relation to User model
    // if (user.subscriptions?.some((s: any) => s.status === 'active')) {
    //   segments.push('paid_users');
    // } else {
    //   segments.push('free_users');
    // }

    // TODO: Add activities relation to User model
    // const recentActivity = user.activities?.filter(
    //   (a: any) => a.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    // );
    const recentActivity = [];

    if (recentActivity?.length > 20) {
      segments.push('power_users');
    } else if (recentActivity?.length > 5) {
      segments.push('active_users');
    } else {
      segments.push('at_risk_users');
    }

    // Goal-based segments
    const completedGoals = user.goals?.filter((g: any) => g.status === 'completed');
    if (completedGoals && completedGoals.length > 0) {
      segments.push('goal_achievers');
    }

    return segments;
  }

  async updateUserSegments(userId: string): Promise<void> {
    const _segments = await this.getUserSegments(userId);

    // Store segments in cache or database
    // TODO: Implement updateUserProperty in analyticsService
    // await analyticsService.updateUserProperty(userId, 'segments', segments);
  }
}

// Content Personalizer
class ContentPersonalizer {
  async personalize(content: any, user: User): Promise<any> {
    const personalizedContent = { ...content };

    // Replace merge tags
    if (typeof personalizedContent.subject === 'string') {
      personalizedContent.subject = this.replaceMergeTags(personalizedContent.subject, user);
    }

    if (typeof personalizedContent.body === 'string') {
      personalizedContent.body = this.replaceMergeTags(personalizedContent.body, user);
    }

    // Add dynamic content
    if (personalizedContent.body === 'personalized_content') {
      personalizedContent.body = await this.generatePersonalizedContent(user);
    }

    return personalizedContent;
  }

  private replaceMergeTags(text: string, user: User): string {
    const tags: Record<string, any> = {
      '{first_name}': user.name.split(' ')[0],
      '{name}': user.name,
      '{email}': user.email,
      '{join_date}': user.createdAt.toLocaleDateString(),
    };

    return Object.entries(tags).reduce(
      (result, [tag, value]) => result.replace(new RegExp(tag, 'g'), value),
      text
    );
  }

  private async generatePersonalizedContent(user: User): Promise<string> {
    // Generate personalized content based on user data
    // This could use AI to create truly personalized messages
    return `Hi ${user.name.split(' ')[0]}, here's your personalized update...`;
  }
}

export const marketingAutomation = new MarketingAutomationService();
