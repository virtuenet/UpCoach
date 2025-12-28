import crypto from 'crypto';
import { EventEmitter } from 'events';
import axios, { AxiosError } from 'axios';

/**
 * Webhook Event Types
 */
export type WebhookEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'goal.created'
  | 'goal.updated'
  | 'goal.completed'
  | 'goal.deleted'
  | 'habit.created'
  | 'habit.logged'
  | 'habit.streak_milestone'
  | 'habit.deleted'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'ai.insight_generated'
  | 'team.member_added'
  | 'team.member_removed';

/**
 * Webhook Subscription
 */
export interface WebhookSubscription {
  id: string;
  userId: string;
  organizationId?: string;
  url: string;
  events: WebhookEventType[];
  secret: string; // For HMAC signature
  status: 'active' | 'paused' | 'failed';
  retryConfig: {
    maxRetries: number;
    retryDelays: number[]; // Exponential backoff delays in seconds
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Webhook Delivery
 */
export interface WebhookDelivery {
  id: string;
  subscriptionId: string;
  eventType: WebhookEventType;
  payload: any;
  attempt: number;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  request: {
    url: string;
    headers: Record<string, string>;
    body: string;
  };
  response?: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    duration: number; // milliseconds
  };
  error?: string;
  createdAt: Date;
  deliveredAt?: Date;
  nextRetryAt?: Date;
}

/**
 * Webhook Event
 */
export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  data: any;
  timestamp: Date;
  apiVersion: string;
}

/**
 * WebhookService
 *
 * Manages webhook subscriptions, event delivery, retries, and signature verification.
 */
export class WebhookService extends EventEmitter {
  private static instance: WebhookService;
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private apiVersion = 'v1';
  private readonly maxRetries = 3;
  private readonly retryDelays = [60, 300, 900]; // 1 min, 5 min, 15 min

  private constructor() {
    super();
    this.startDeliveryQueue();
  }

  static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  /**
   * Create Webhook Subscription
   */
  async createSubscription(
    userId: string,
    url: string,
    events: WebhookEventType[],
    organizationId?: string,
    metadata?: Record<string, any>
  ): Promise<WebhookSubscription> {
    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid webhook URL');
    }

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString('hex');

    const subscription: WebhookSubscription = {
      id: crypto.randomUUID(),
      userId,
      organizationId,
      url,
      events,
      secret,
      status: 'active',
      retryConfig: {
        maxRetries: this.maxRetries,
        retryDelays: this.retryDelays,
      },
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.subscriptions.set(subscription.id, subscription);

    this.emit('webhook:subscription_created', {
      subscriptionId: subscription.id,
      userId,
      events,
    });

    return subscription;
  }

  /**
   * Update Webhook Subscription
   */
  async updateSubscription(
    subscriptionId: string,
    updates: {
      url?: string;
      events?: WebhookEventType[];
      status?: 'active' | 'paused' | 'failed';
    }
  ): Promise<WebhookSubscription> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Webhook subscription not found');
    }

    if (updates.url) {
      try {
        new URL(updates.url);
        subscription.url = updates.url;
      } catch {
        throw new Error('Invalid webhook URL');
      }
    }

    if (updates.events) {
      subscription.events = updates.events;
    }

    if (updates.status) {
      subscription.status = updates.status;
    }

    subscription.updatedAt = new Date();

    this.emit('webhook:subscription_updated', {
      subscriptionId: subscription.id,
      updates,
    });

    return subscription;
  }

  /**
   * Delete Webhook Subscription
   */
  async deleteSubscription(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Webhook subscription not found');
    }

    this.subscriptions.delete(subscriptionId);

    this.emit('webhook:subscription_deleted', {
      subscriptionId,
      userId: subscription.userId,
    });
  }

  /**
   * Trigger Webhook Event
   */
  async triggerEvent(eventType: WebhookEventType, data: any): Promise<void> {
    const event: WebhookEvent = {
      id: crypto.randomUUID(),
      type: eventType,
      data,
      timestamp: new Date(),
      apiVersion: this.apiVersion,
    };

    // Find matching subscriptions
    const matchingSubscriptions = Array.from(this.subscriptions.values()).filter(
      sub => sub.status === 'active' && sub.events.includes(eventType)
    );

    if (matchingSubscriptions.length === 0) {
      return;
    }

    // Create deliveries for each subscription
    for (const subscription of matchingSubscriptions) {
      await this.createDelivery(subscription, event);
    }

    this.emit('webhook:event_triggered', {
      eventType,
      eventId: event.id,
      subscriptions: matchingSubscriptions.length,
    });
  }

  /**
   * Create Webhook Delivery
   */
  private async createDelivery(
    subscription: WebhookSubscription,
    event: WebhookEvent
  ): Promise<void> {
    const payload = {
      id: event.id,
      type: event.type,
      data: event.data,
      timestamp: event.timestamp.toISOString(),
      api_version: event.apiVersion,
    };

    const signature = this.generateSignature(payload, subscription.secret);

    const delivery: WebhookDelivery = {
      id: crypto.randomUUID(),
      subscriptionId: subscription.id,
      eventType: event.type,
      payload,
      attempt: 0,
      status: 'pending',
      request: {
        url: subscription.url,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event.type,
          'X-Webhook-ID': event.id,
          'User-Agent': 'UpCoach-Webhooks/1.0',
        },
        body: JSON.stringify(payload),
      },
      createdAt: new Date(),
    };

    this.deliveries.set(delivery.id, delivery);

    // Attempt immediate delivery
    await this.attemptDelivery(delivery.id);
  }

  /**
   * Attempt Webhook Delivery
   */
  private async attemptDelivery(deliveryId: string): Promise<void> {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery) {
      return;
    }

    const subscription = this.subscriptions.get(delivery.subscriptionId);
    if (!subscription) {
      delivery.status = 'cancelled';
      return;
    }

    delivery.attempt++;
    const startTime = Date.now();

    try {
      const response = await axios.post(delivery.request.url, delivery.payload, {
        headers: delivery.request.headers,
        timeout: 30000, // 30 seconds
      });

      const duration = Date.now() - startTime;

      delivery.response = {
        statusCode: response.status,
        headers: response.headers as Record<string, string>,
        body: JSON.stringify(response.data),
        duration,
      };

      delivery.status = 'success';
      delivery.deliveredAt = new Date();

      this.emit('webhook:delivery_success', {
        deliveryId,
        subscriptionId: delivery.subscriptionId,
        eventType: delivery.eventType,
        attempt: delivery.attempt,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const axiosError = error as AxiosError;

      delivery.error = axiosError.message;

      if (axiosError.response) {
        delivery.response = {
          statusCode: axiosError.response.status,
          headers: axiosError.response.headers as Record<string, string>,
          body: JSON.stringify(axiosError.response.data),
          duration,
        };
      }

      // Retry logic
      if (delivery.attempt < subscription.retryConfig.maxRetries) {
        const retryDelay = subscription.retryConfig.retryDelays[delivery.attempt - 1] || 900;
        delivery.nextRetryAt = new Date(Date.now() + retryDelay * 1000);
        delivery.status = 'pending';

        this.emit('webhook:delivery_retry_scheduled', {
          deliveryId,
          subscriptionId: delivery.subscriptionId,
          attempt: delivery.attempt,
          nextRetryAt: delivery.nextRetryAt,
        });

        // Schedule retry
        setTimeout(() => this.attemptDelivery(deliveryId), retryDelay * 1000);
      } else {
        delivery.status = 'failed';
        subscription.status = 'failed';

        this.emit('webhook:delivery_failed', {
          deliveryId,
          subscriptionId: delivery.subscriptionId,
          eventType: delivery.eventType,
          attempts: delivery.attempt,
          error: delivery.error,
        });
      }
    }
  }

  /**
   * Generate HMAC Signature
   */
  private generateSignature(payload: any, secret: string): string {
    const data = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify Webhook Signature
   */
  verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Get Subscription Deliveries
   */
  async getDeliveries(
    subscriptionId: string,
    limit: number = 50
  ): Promise<WebhookDelivery[]> {
    return Array.from(this.deliveries.values())
      .filter(d => d.subscriptionId === subscriptionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Retry Failed Delivery
   */
  async retryDelivery(deliveryId: string): Promise<void> {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery) {
      throw new Error('Delivery not found');
    }

    if (delivery.status !== 'failed') {
      throw new Error('Can only retry failed deliveries');
    }

    delivery.status = 'pending';
    delivery.attempt = 0;
    await this.attemptDelivery(deliveryId);
  }

  /**
   * Get User Subscriptions
   */
  async getUserSubscriptions(userId: string): Promise<WebhookSubscription[]> {
    return Array.from(this.subscriptions.values()).filter(s => s.userId === userId);
  }

  /**
   * Test Webhook Endpoint
   */
  async testEndpoint(url: string): Promise<{
    success: boolean;
    statusCode?: number;
    duration?: number;
    error?: string;
  }> {
    const testPayload = {
      id: 'test_' + crypto.randomUUID(),
      type: 'test.webhook',
      data: { message: 'This is a test webhook' },
      timestamp: new Date().toISOString(),
      api_version: this.apiVersion,
    };

    const startTime = Date.now();

    try {
      const response = await axios.post(url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'test.webhook',
          'User-Agent': 'UpCoach-Webhooks/1.0',
        },
        timeout: 10000,
      });

      const duration = Date.now() - startTime;

      return {
        success: response.status >= 200 && response.status < 300,
        statusCode: response.status,
        duration,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        statusCode: axiosError.response?.status,
        duration: Date.now() - startTime,
        error: axiosError.message,
      };
    }
  }

  /**
   * Start Delivery Queue Processing
   */
  private startDeliveryQueue(): void {
    setInterval(() => {
      const now = new Date();
      const pendingDeliveries = Array.from(this.deliveries.values()).filter(
        d => d.status === 'pending' && d.nextRetryAt && d.nextRetryAt <= now
      );

      pendingDeliveries.forEach(delivery => {
        this.attemptDelivery(delivery.id);
      });
    }, 30000); // Check every 30 seconds
  }
}

export const webhookService = WebhookService.getInstance();
