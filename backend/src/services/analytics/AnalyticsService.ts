import { Request } from 'express';
import axios from 'axios';
import { logger } from '../../utils/logger';
import { User } from '../../models/User';
import { cacheService } from '../cache/CacheService';

interface TrackingEvent {
  userId?: number;
  anonymousId?: string;
  event: string;
  properties?: Record<string, any>;
  context?: Record<string, any>;
  timestamp?: Date;
}

interface UserTraits {
  userId: number;
  email?: string;
  name?: string;
  plan?: string;
  role?: string;
  createdAt?: Date;
  lastLogin?: Date;
  customTraits?: Record<string, any>;
}

export class AnalyticsService {
  private mixpanelToken: string;
  private googleAnalyticsId: string;
  private segmentWriteKey?: string;
  private amplitudeApiKey?: string;
  private batchQueue: TrackingEvent[] = [];
  private batchInterval: NodeJS.Timeout;

  constructor() {
    this.mixpanelToken = process.env.MIXPANEL_TOKEN || '';
    this.googleAnalyticsId = process.env.GA_MEASUREMENT_ID || '';
    this.segmentWriteKey = process.env.SEGMENT_WRITE_KEY;
    this.amplitudeApiKey = process.env.AMPLITUDE_API_KEY;

    // Start batch processing
    this.batchInterval = setInterval(() => {
      this.flushBatch();
    }, 5000); // Flush every 5 seconds
  }

  // Track custom event
  async track(event: TrackingEvent): Promise<void> {
    try {
      // Add to batch queue
      this.batchQueue.push({
        ...event,
        timestamp: event.timestamp || new Date(),
        context: {
          ...event.context,
          app: {
            name: 'UpCoach',
            version: process.env.APP_VERSION || '1.0.0',
          },
        },
      });

      // Flush if batch is large
      if (this.batchQueue.length >= 100) {
        await this.flushBatch();
      }

      // Also send to real-time analytics if critical event
      if (this.isCriticalEvent(event.event)) {
        await this.sendRealTimeEvent(event);
      }
    } catch (error) {
      logger.error('Failed to track event', { error, event });
    }
  }

  // Identify user
  async identify(traits: UserTraits): Promise<void> {
    try {
      // Update user profile in analytics platforms
      const promises = [];

      // Mixpanel
      if (this.mixpanelToken) {
        promises.push(this.identifyMixpanel(traits));
      }

      // Segment
      if (this.segmentWriteKey) {
        promises.push(this.identifySegment(traits));
      }

      // Amplitude
      if (this.amplitudeApiKey) {
        promises.push(this.identifyAmplitude(traits));
      }

      await Promise.all(promises);

      // Cache user traits for faster lookups
      await cacheService.set(
        `analytics:user:${traits.userId}`,
        traits,
        { ttl: 3600 } // 1 hour
      );
    } catch (error) {
      logger.error('Failed to identify user', { error, traits });
    }
  }

  // Track page view
  async trackPageView(req: Request, pagePath: string, pageTitle?: string): Promise<void> {
    const userId = req.user?.id;
    const sessionId = (req as any).session?.id || req.get('x-session-id');
    const ip = req.ip;
    const userAgent = req.get('user-agent');
    const referrer = req.get('referrer');

    await this.track({
      userId: userId ? Number(userId) : undefined,
      anonymousId: sessionId,
      event: 'Page Viewed',
      properties: {
        path: pagePath,
        title: pageTitle,
        url: `${req.protocol}://${req.get('host')}${pagePath}`,
        referrer,
      },
      context: {
        ip,
        userAgent,
        campaign: this.extractCampaignParams(req),
      },
    });
  }

  // Track user actions
  async trackUserAction(
    userId: number,
    action: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.track({
      userId,
      event: action,
      properties,
    });
  }

  // Track conversion events
  async trackConversion(
    userId: number,
    conversionType: string,
    value?: number,
    currency: string = 'USD',
    properties?: Record<string, any>
  ): Promise<void> {
    await this.track({
      userId,
      event: `Conversion: ${conversionType}`,
      properties: {
        ...properties,
        value,
        currency,
        conversionType,
      },
    });

    // Send to Google Analytics for conversion tracking
    if (this.googleAnalyticsId) {
      await this.sendGoogleAnalyticsConversion(userId, conversionType, value, currency);
    }
  }

  // Track revenue
  async trackRevenue(
    userId: number,
    amount: number,
    currency: string = 'USD',
    productId?: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.track({
      userId,
      event: 'Revenue',
      properties: {
        ...properties,
        amount,
        currency,
        productId,
        revenueType: properties?.revenueType || 'subscription',
      },
    });
  }

  // Track errors
  async trackError(
    error: Error,
    context?: Record<string, any>,
    userId?: number
  ): Promise<void> {
    await this.track({
      userId,
      event: 'Error Occurred',
      properties: {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
        ...context,
      },
    });
  }

  // Get user analytics summary
  async getUserAnalytics(userId: number): Promise<any> {
    const cacheKey = `analytics:summary:${userId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      // Aggregate analytics data from various sources
      const summary = {
        totalSessions: await this.getUserSessionCount(userId),
        totalEvents: await this.getUserEventCount(userId),
        lastActive: await this.getUserLastActive(userId),
        engagementScore: await this.calculateEngagementScore(userId),
        behaviorSegment: await this.getUserSegment(userId),
      };

      await cacheService.set(cacheKey, summary, { ttl: 300 }); // 5 minutes
      return summary;
    } catch (error) {
      logger.error('Failed to get user analytics', { error, userId });
      return null;
    }
  }

  // Private methods

  private async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const events = [...this.batchQueue];
    this.batchQueue = [];

    try {
      const promises = [];

      // Send to Mixpanel
      if (this.mixpanelToken) {
        promises.push(this.sendToMixpanel(events));
      }

      // Send to Segment
      if (this.segmentWriteKey) {
        promises.push(this.sendToSegment(events));
      }

      // Send to Amplitude
      if (this.amplitudeApiKey) {
        promises.push(this.sendToAmplitude(events));
      }

      await Promise.all(promises);
    } catch (error) {
      logger.error('Failed to flush analytics batch', { error });
      // Re-add failed events to queue
      this.batchQueue.unshift(...events);
    }
  }

  private async sendToMixpanel(events: TrackingEvent[]): Promise<void> {
    const mixpanelEvents = events.map(event => ({
      event: event.event,
      properties: {
        ...event.properties,
        distinct_id: event.userId || event.anonymousId,
        time: Math.floor(event.timestamp!.getTime() / 1000),
        token: this.mixpanelToken,
      },
    }));

    await axios.post('https://api.mixpanel.com/track', mixpanelEvents, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async sendToSegment(events: TrackingEvent[]): Promise<void> {
    const segmentEvents = events.map(event => ({
      type: 'track',
      userId: event.userId?.toString(),
      anonymousId: event.anonymousId,
      event: event.event,
      properties: event.properties,
      context: event.context,
      timestamp: event.timestamp?.toISOString(),
    }));

    await axios.post(
      'https://api.segment.io/v1/batch',
      { batch: segmentEvents },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(this.segmentWriteKey + ':').toString('base64')}`,
        },
      }
    );
  }

  private async sendToAmplitude(events: TrackingEvent[]): Promise<void> {
    const amplitudeEvents = events.map(event => ({
      user_id: event.userId?.toString(),
      device_id: event.anonymousId,
      event_type: event.event,
      event_properties: event.properties,
      user_properties: event.context,
      time: event.timestamp!.getTime(),
    }));

    await axios.post(
      'https://api.amplitude.com/2/httpapi',
      {
        api_key: this.amplitudeApiKey,
        events: amplitudeEvents,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  private async sendGoogleAnalyticsConversion(
    userId: number,
    conversionType: string,
    value?: number,
    currency?: string
  ): Promise<void> {
    // Send conversion event to Google Analytics 4
    await axios.post(
      `https://www.google-analytics.com/mp/collect?measurement_id=${this.googleAnalyticsId}&api_secret=${process.env.GA_API_SECRET}`,
      {
        client_id: userId.toString(),
        events: [
          {
            name: 'conversion',
            params: {
              conversion_type: conversionType,
              value,
              currency,
            },
          },
        ],
      }
    );
  }

  private async identifyMixpanel(traits: UserTraits): Promise<void> {
    await axios.post(
      'https://api.mixpanel.com/engage',
      {
        $token: this.mixpanelToken,
        $distinct_id: traits.userId.toString(),
        $set: {
          $email: traits.email,
          $name: traits.name,
          plan: traits.plan,
          role: traits.role,
          ...traits.customTraits,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  private async identifySegment(traits: UserTraits): Promise<void> {
    await axios.post(
      'https://api.segment.io/v1/identify',
      {
        userId: traits.userId.toString(),
        traits: {
          email: traits.email,
          name: traits.name,
          plan: traits.plan,
          role: traits.role,
          createdAt: traits.createdAt,
          ...traits.customTraits,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(this.segmentWriteKey + ':').toString('base64')}`,
        },
      }
    );
  }

  private async identifyAmplitude(traits: UserTraits): Promise<void> {
    await axios.post(
      'https://api.amplitude.com/2/httpapi',
      {
        api_key: this.amplitudeApiKey,
        events: [
          {
            user_id: traits.userId.toString(),
            event_type: '$identify',
            user_properties: {
              $set: {
                email: traits.email,
                name: traits.name,
                plan: traits.plan,
                role: traits.role,
                ...traits.customTraits,
              },
            },
          },
        ],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  private isCriticalEvent(eventName: string): boolean {
    const criticalEvents = [
      'User Signed Up',
      'Subscription Started',
      'Payment Failed',
      'Error Occurred',
      'User Churned',
    ];
    return criticalEvents.includes(eventName);
  }

  private async sendRealTimeEvent(event: TrackingEvent): Promise<void> {
    // Send critical events immediately to monitoring systems
    logger.info('Critical event tracked', { event });
  }

  private extractCampaignParams(req: Request): Record<string, any> {
    const query = req.query;
    return {
      source: query.utm_source,
      medium: query.utm_medium,
      campaign: query.utm_campaign,
      term: query.utm_term,
      content: query.utm_content,
    };
  }

  private async getUserSessionCount(userId: number): Promise<number> {
    // Implement session counting logic
    return 0;
  }

  private async getUserEventCount(userId: number): Promise<number> {
    // Implement event counting logic
    return 0;
  }

  private async getUserLastActive(userId: number): Promise<Date | null> {
    // Implement last active tracking
    return null;
  }

  private async calculateEngagementScore(userId: number): Promise<number> {
    // Implement engagement scoring algorithm
    return 0;
  }

  private async getUserSegment(userId: number): Promise<string> {
    // Implement user segmentation logic
    return 'active';
  }

  // Cleanup
  destroy(): void {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
    }
    this.flushBatch();
  }
}

export const analyticsService = new AnalyticsService();