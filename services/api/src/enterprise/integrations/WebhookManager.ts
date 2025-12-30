import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import crypto from 'crypto';
import axios from 'axios';

export enum WebhookEventType {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  COACHING_SESSION_CREATED = 'coaching_session.created',
  COACHING_SESSION_COMPLETED = 'coaching_session.completed',
  GOAL_CREATED = 'goal.created',
  GOAL_ACHIEVED = 'goal.achieved',
  ORGANIZATION_UPDATED = 'organization.updated',
  INTEGRATION_SYNCED = 'integration.synced',
  ANALYTICS_REPORT_READY = 'analytics.report_ready'
}

export enum WebhookStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FAILED = 'failed',
  PENDING = 'pending'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

export interface WebhookSubscription {
  id: string;
  organizationId: string;
  url: string;
  events: WebhookEventType[];
  status: WebhookStatus;
  secret: string;
  headers?: Record<string, string>;
  config: {
    maxRetries: number;
    retryBackoff: 'linear' | 'exponential';
    timeout: number;
    verifySSL: boolean;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastTriggeredAt?: Date;
    successCount: number;
    failureCount: number;
  };
}

export interface WebhookDelivery {
  id: string;
  subscriptionId: string;
  organizationId: string;
  event: WebhookEventType;
  payload: any;
  status: DeliveryStatus;
  attempts: number;
  maxRetries: number;
  response?: {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  };
  error?: string;
  metadata: {
    createdAt: Date;
    lastAttemptAt?: Date;
    nextRetryAt?: Date;
    deliveredAt?: Date;
  };
}

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  organizationId: string;
  data: any;
  timestamp: Date;
}

class WebhookManager extends EventEmitter {
  private redis: Redis;
  private subscriptions: Map<string, WebhookSubscription>;
  private deliveryQueue: Map<string, WebhookDelivery>;
  private processingIntervals: Map<string, NodeJS.Timeout>;
  private readonly CACHE_PREFIX = 'webhook:';
  private readonly SUBSCRIPTION_PREFIX = 'webhook:subscription:';
  private readonly DELIVERY_PREFIX = 'webhook:delivery:';
  private readonly QUEUE_PREFIX = 'webhook:queue:';
  private readonly PROCESSING_INTERVAL = 5000; // 5 seconds

  constructor(redis: Redis) {
    super();
    this.redis = redis;
    this.subscriptions = new Map();
    this.deliveryQueue = new Map();
    this.processingIntervals = new Map();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadSubscriptionsFromCache();
      this.startDeliveryProcessor();
      this.emit('manager:initialized');
    } catch (error) {
      this.emit('manager:error', { error: 'Failed to initialize webhook manager', details: error });
      throw error;
    }
  }

  private async loadSubscriptionsFromCache(): Promise<void> {
    const keys = await this.redis.keys(`${this.SUBSCRIPTION_PREFIX}*`);

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const subscription = JSON.parse(data);
        this.subscriptions.set(subscription.id, subscription);
      }
    }
  }

  public async createSubscription(
    organizationId: string,
    url: string,
    events: WebhookEventType[],
    config?: Partial<WebhookSubscription['config']>,
    headers?: Record<string, string>
  ): Promise<WebhookSubscription> {
    const secret = this.generateSecret();

    const subscription: WebhookSubscription = {
      id: crypto.randomUUID(),
      organizationId,
      url,
      events,
      status: WebhookStatus.ACTIVE,
      secret,
      headers,
      config: {
        maxRetries: config?.maxRetries || 3,
        retryBackoff: config?.retryBackoff || 'exponential',
        timeout: config?.timeout || 10000,
        verifySSL: config?.verifySSL !== false
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        successCount: 0,
        failureCount: 0
      }
    };

    this.subscriptions.set(subscription.id, subscription);
    await this.saveSubscriptionToCache(subscription);

    this.emit('subscription:created', { subscriptionId: subscription.id });
    return subscription;
  }

  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  public async updateSubscription(
    subscriptionId: string,
    updates: Partial<Pick<WebhookSubscription, 'url' | 'events' | 'status' | 'headers' | 'config'>>
  ): Promise<WebhookSubscription> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    Object.assign(subscription, updates);
    subscription.metadata.updatedAt = new Date();

    await this.saveSubscriptionToCache(subscription);
    this.emit('subscription:updated', { subscriptionId });
    return subscription;
  }

  public async deleteSubscription(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    this.subscriptions.delete(subscriptionId);
    await this.redis.del(`${this.SUBSCRIPTION_PREFIX}${subscriptionId}`);

    this.emit('subscription:deleted', { subscriptionId });
  }

  public async rotateSecret(subscriptionId: string): Promise<string> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const newSecret = this.generateSecret();
    subscription.secret = newSecret;
    subscription.metadata.updatedAt = new Date();

    await this.saveSubscriptionToCache(subscription);
    this.emit('subscription:secret:rotated', { subscriptionId });

    return newSecret;
  }

  public async triggerEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<void> {
    const webhookEvent: WebhookEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    const subscriptions = Array.from(this.subscriptions.values()).filter(
      sub =>
        sub.organizationId === event.organizationId &&
        sub.status === WebhookStatus.ACTIVE &&
        sub.events.includes(event.type)
    );

    for (const subscription of subscriptions) {
      await this.queueDelivery(subscription, webhookEvent);
    }

    this.emit('event:triggered', { eventId: webhookEvent.id, subscriptionCount: subscriptions.length });
  }

  private async queueDelivery(subscription: WebhookSubscription, event: WebhookEvent): Promise<void> {
    const delivery: WebhookDelivery = {
      id: crypto.randomUUID(),
      subscriptionId: subscription.id,
      organizationId: subscription.organizationId,
      event: event.type,
      payload: {
        id: event.id,
        type: event.type,
        data: event.data,
        timestamp: event.timestamp,
        organizationId: event.organizationId
      },
      status: DeliveryStatus.PENDING,
      attempts: 0,
      maxRetries: subscription.config.maxRetries,
      metadata: {
        createdAt: new Date()
      }
    };

    this.deliveryQueue.set(delivery.id, delivery);
    await this.saveDeliveryToCache(delivery);

    const queueKey = `${this.QUEUE_PREFIX}${subscription.organizationId}`;
    await this.redis.lpush(queueKey, delivery.id);

    this.emit('delivery:queued', { deliveryId: delivery.id });
  }

  private startDeliveryProcessor(): void {
    const interval = setInterval(async () => {
      await this.processDeliveryQueue();
    }, this.PROCESSING_INTERVAL);

    this.processingIntervals.set('main', interval);
  }

  private async processDeliveryQueue(): Promise<void> {
    const organizationIds = new Set<string>(
      Array.from(this.subscriptions.values()).map(sub => sub.organizationId)
    );

    for (const orgId of organizationIds) {
      await this.processOrganizationQueue(orgId);
    }
  }

  private async processOrganizationQueue(organizationId: string): Promise<void> {
    const queueKey = `${this.QUEUE_PREFIX}${organizationId}`;
    const deliveryId = await this.redis.rpop(queueKey);

    if (!deliveryId) {
      return;
    }

    const delivery = await this.getDelivery(deliveryId);
    if (!delivery) {
      return;
    }

    if (delivery.status === DeliveryStatus.PENDING || delivery.status === DeliveryStatus.RETRYING) {
      await this.attemptDelivery(delivery);
    }
  }

  private async attemptDelivery(delivery: WebhookDelivery): Promise<void> {
    const subscription = this.subscriptions.get(delivery.subscriptionId);
    if (!subscription) {
      delivery.status = DeliveryStatus.FAILED;
      delivery.error = 'Subscription not found';
      await this.saveDeliveryToCache(delivery);
      return;
    }

    delivery.attempts++;
    delivery.metadata.lastAttemptAt = new Date();
    delivery.status = DeliveryStatus.RETRYING;

    try {
      const signature = this.generateSignature(delivery.payload, subscription.secret);

      const response = await axios.post(subscription.url, delivery.payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-ID': delivery.id,
          'X-Webhook-Timestamp': delivery.metadata.createdAt.toISOString(),
          ...subscription.headers
        },
        timeout: subscription.config.timeout,
        validateStatus: () => true,
        httpsAgent: subscription.config.verifySSL ? undefined : new (require('https').Agent)({ rejectUnauthorized: false })
      });

      delivery.response = {
        statusCode: response.status,
        body: JSON.stringify(response.data),
        headers: response.headers as Record<string, string>
      };

      if (response.status >= 200 && response.status < 300) {
        delivery.status = DeliveryStatus.DELIVERED;
        delivery.metadata.deliveredAt = new Date();

        subscription.metadata.successCount++;
        subscription.metadata.lastTriggeredAt = new Date();
        await this.saveSubscriptionToCache(subscription);

        this.emit('delivery:success', { deliveryId: delivery.id });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      delivery.error = error instanceof Error ? error.message : String(error);

      if (delivery.attempts >= delivery.maxRetries) {
        delivery.status = DeliveryStatus.FAILED;

        subscription.metadata.failureCount++;
        await this.saveSubscriptionToCache(subscription);

        if (subscription.metadata.failureCount >= 10) {
          subscription.status = WebhookStatus.FAILED;
          await this.saveSubscriptionToCache(subscription);
        }

        this.emit('delivery:failed', { deliveryId: delivery.id, error: delivery.error });
      } else {
        delivery.status = DeliveryStatus.RETRYING;
        const retryDelay = this.calculateRetryDelay(delivery.attempts, subscription.config.retryBackoff);
        delivery.metadata.nextRetryAt = new Date(Date.now() + retryDelay);

        setTimeout(async () => {
          const queueKey = `${this.QUEUE_PREFIX}${delivery.organizationId}`;
          await this.redis.lpush(queueKey, delivery.id);
        }, retryDelay);

        this.emit('delivery:retry', { deliveryId: delivery.id, attempt: delivery.attempts });
      }
    }

    await this.saveDeliveryToCache(delivery);
  }

  private generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  public verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  private calculateRetryDelay(attempt: number, backoff: 'linear' | 'exponential'): number {
    const baseDelay = 5000; // 5 seconds

    if (backoff === 'exponential') {
      return baseDelay * Math.pow(2, attempt - 1);
    } else {
      return baseDelay * attempt;
    }
  }

  public async getDelivery(deliveryId: string): Promise<WebhookDelivery | null> {
    let delivery = this.deliveryQueue.get(deliveryId);

    if (!delivery) {
      const data = await this.redis.get(`${this.DELIVERY_PREFIX}${deliveryId}`);
      if (data) {
        delivery = JSON.parse(data);
        this.deliveryQueue.set(deliveryId, delivery);
      }
    }

    return delivery || null;
  }

  public async getDeliveryHistory(
    subscriptionId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: DeliveryStatus;
    } = {}
  ): Promise<WebhookDelivery[]> {
    const pattern = `${this.DELIVERY_PREFIX}*`;
    const keys = await this.redis.keys(pattern);

    const deliveries: WebhookDelivery[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const delivery = JSON.parse(data);
        if (delivery.subscriptionId === subscriptionId) {
          if (!options.status || delivery.status === options.status) {
            deliveries.push(delivery);
          }
        }
      }
    }

    deliveries.sort((a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime());

    const offset = options.offset || 0;
    const limit = options.limit || 50;

    return deliveries.slice(offset, offset + limit);
  }

  public async retryDelivery(deliveryId: string): Promise<void> {
    const delivery = await this.getDelivery(deliveryId);
    if (!delivery) {
      throw new Error('Delivery not found');
    }

    if (delivery.status === DeliveryStatus.DELIVERED) {
      throw new Error('Cannot retry delivered webhook');
    }

    delivery.attempts = 0;
    delivery.status = DeliveryStatus.PENDING;
    delivery.error = undefined;
    delivery.metadata.nextRetryAt = undefined;

    await this.saveDeliveryToCache(delivery);

    const queueKey = `${this.QUEUE_PREFIX}${delivery.organizationId}`;
    await this.redis.lpush(queueKey, delivery.id);

    this.emit('delivery:retry:manual', { deliveryId });
  }

  public async testWebhook(subscriptionId: string): Promise<WebhookDelivery> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const testEvent: WebhookEvent = {
      id: crypto.randomUUID(),
      type: WebhookEventType.ORGANIZATION_UPDATED,
      organizationId: subscription.organizationId,
      data: {
        test: true,
        message: 'This is a test webhook event'
      },
      timestamp: new Date()
    };

    await this.queueDelivery(subscription, testEvent);

    const queueKey = `${this.QUEUE_PREFIX}${subscription.organizationId}`;
    const deliveryId = await this.redis.rpop(queueKey);

    if (!deliveryId) {
      throw new Error('Failed to queue test delivery');
    }

    const delivery = await this.getDelivery(deliveryId);
    if (!delivery) {
      throw new Error('Delivery not found');
    }

    await this.attemptDelivery(delivery);
    return delivery;
  }

  private async saveSubscriptionToCache(subscription: WebhookSubscription): Promise<void> {
    await this.redis.set(
      `${this.SUBSCRIPTION_PREFIX}${subscription.id}`,
      JSON.stringify(subscription)
    );
  }

  private async saveDeliveryToCache(delivery: WebhookDelivery): Promise<void> {
    await this.redis.setex(
      `${this.DELIVERY_PREFIX}${delivery.id}`,
      2592000, // 30 days
      JSON.stringify(delivery)
    );
  }

  public getSubscription(subscriptionId: string): WebhookSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  public getSubscriptionsByOrganization(organizationId: string): WebhookSubscription[] {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.organizationId === organizationId);
  }

  public async getWebhookStats(subscriptionId: string): Promise<{
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageAttempts: number;
    successRate: number;
  }> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const history = await this.getDeliveryHistory(subscriptionId, { limit: 1000 });

    const totalDeliveries = history.length;
    const successfulDeliveries = history.filter(d => d.status === DeliveryStatus.DELIVERED).length;
    const failedDeliveries = history.filter(d => d.status === DeliveryStatus.FAILED).length;
    const averageAttempts = history.reduce((sum, d) => sum + d.attempts, 0) / totalDeliveries || 0;
    const successRate = totalDeliveries > 0 ? successfulDeliveries / totalDeliveries : 0;

    return {
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      averageAttempts,
      successRate
    };
  }

  public async shutdown(): Promise<void> {
    for (const interval of this.processingIntervals.values()) {
      clearInterval(interval);
    }
    this.processingIntervals.clear();
    this.removeAllListeners();
    this.emit('manager:shutdown');
  }
}

export default WebhookManager;
