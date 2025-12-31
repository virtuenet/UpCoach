import { EventEmitter } from 'events';
import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Analytics Webhooks
 *
 * Webhook integration for analytics events with delivery management,
 * retry logic, and signature verification.
 *
 * Features:
 * - Webhook management (CRUD)
 * - Event subscription
 * - Webhook delivery with retries
 * - Signature verification (HMAC-SHA256)
 * - Delivery logs and analytics
 * - Batch delivery
 * - Circuit breaker pattern
 */

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  secret: string;
  headers?: Record<string, string>;
  retryConfig: RetryConfig;
  circuitBreaker: CircuitBreakerConfig;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type WebhookEvent =
  | 'anomaly.detected'
  | 'forecast.generated'
  | 'report.completed'
  | 'alert.triggered'
  | 'insight.generated'
  | 'threshold.exceeded'
  | 'data.exported'
  | 'query.completed';

export interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  attempt: number;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  statusCode?: number;
  responseBody?: string;
  error?: string;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface WebhookLog {
  webhookId: string;
  event: WebhookEvent;
  deliveryId: string;
  success: boolean;
  duration: number;
  timestamp: Date;
}

export class AnalyticsWebhooks extends EventEmitter {
  private webhooks: Map<string, Webhook> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private logs: WebhookLog[] = [];
  private circuitStates: Map<string, CircuitState> = new Map();

  /**
   * Create webhook
   */
  async createWebhook(
    organizationId: string,
    config: Partial<Webhook>
  ): Promise<Webhook> {
    const webhook: Webhook = {
      id: uuidv4(),
      name: config.name || 'Untitled Webhook',
      url: config.url!,
      events: config.events || [],
      active: config.active !== undefined ? config.active : true,
      secret: config.secret || this.generateSecret(),
      headers: config.headers || {},
      retryConfig: config.retryConfig || this.getDefaultRetryConfig(),
      circuitBreaker: config.circuitBreaker || this.getDefaultCircuitBreakerConfig(),
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.webhooks.set(webhook.id, webhook);
    this.circuitStates.set(webhook.id, {
      state: 'closed',
      failureCount: 0,
      successCount: 0,
      lastFailure: null,
    });

    this.emit('webhook:created', webhook);
    return webhook;
  }

  /**
   * Update webhook
   */
  async updateWebhook(
    webhookId: string,
    updates: Partial<Webhook>
  ): Promise<Webhook> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const updated: Webhook = {
      ...webhook,
      ...updates,
      updatedAt: new Date(),
    };

    this.webhooks.set(webhookId, updated);
    this.emit('webhook:updated', updated);

    return updated;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    this.webhooks.delete(webhookId);
    this.circuitStates.delete(webhookId);
    this.emit('webhook:deleted', { webhookId });
  }

  /**
   * Get webhook by ID
   */
  async getWebhook(webhookId: string): Promise<Webhook | null> {
    return this.webhooks.get(webhookId) || null;
  }

  /**
   * List webhooks for organization
   */
  async listWebhooks(organizationId: string): Promise<Webhook[]> {
    return Array.from(this.webhooks.values()).filter(
      w => w.organizationId === organizationId
    );
  }

  /**
   * Trigger webhook event
   */
  async trigger(
    event: WebhookEvent,
    payload: any,
    organizationId?: string
  ): Promise<void> {
    const webhooks = Array.from(this.webhooks.values()).filter(
      w =>
        w.active &&
        w.events.includes(event) &&
        (!organizationId || w.organizationId === organizationId)
    );

    for (const webhook of webhooks) {
      await this.deliverWebhook(webhook, event, payload);
    }
  }

  /**
   * Deliver webhook
   */
  private async deliverWebhook(
    webhook: Webhook,
    event: WebhookEvent,
    payload: any
  ): Promise<void> {
    if (!this.canDeliver(webhook.id)) {
      this.emit('webhook:circuit_open', { webhookId: webhook.id });
      return;
    }

    const delivery: WebhookDelivery = {
      id: uuidv4(),
      webhookId: webhook.id,
      event,
      payload,
      attempt: 0,
      status: 'pending',
      createdAt: new Date(),
    };

    this.deliveries.set(delivery.id, delivery);

    await this.executeDelivery(webhook, delivery);
  }

  /**
   * Execute delivery with retries
   */
  private async executeDelivery(
    webhook: Webhook,
    delivery: WebhookDelivery
  ): Promise<void> {
    const startTime = Date.now();

    try {
      delivery.attempt++;
      delivery.status = 'retrying';

      const signature = this.generateSignature(delivery.payload, webhook.secret);

      const response = await axios.post(webhook.url, delivery.payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': delivery.event,
          'X-Webhook-Delivery': delivery.id,
          ...webhook.headers,
        },
        timeout: 30000,
        validateStatus: () => true,
      });

      delivery.statusCode = response.status;
      delivery.responseBody = JSON.stringify(response.data).substring(0, 1000);

      if (response.status >= 200 && response.status < 300) {
        delivery.status = 'delivered';
        delivery.deliveredAt = new Date();
        this.recordSuccess(webhook.id, Date.now() - startTime, delivery);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      delivery.error = error.message;
      delivery.status = 'failed';

      this.recordFailure(webhook.id, Date.now() - startTime, delivery, error);

      if (delivery.attempt < webhook.retryConfig.maxAttempts) {
        const delay = this.calculateRetryDelay(delivery.attempt, webhook.retryConfig);

        setTimeout(() => {
          this.executeDelivery(webhook, delivery);
        }, delay);
      }
    }

    this.deliveries.set(delivery.id, delivery);
  }

  /**
   * Generate HMAC-SHA256 signature
   */
  private generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
      config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
      config.maxDelay
    );

    const jitter = Math.random() * delay * 0.1;
    return delay + jitter;
  }

  /**
   * Check if webhook can deliver (circuit breaker)
   */
  private canDeliver(webhookId: string): boolean {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook || !webhook.circuitBreaker.enabled) {
      return true;
    }

    const state = this.circuitStates.get(webhookId);
    if (!state) {
      return true;
    }

    const now = Date.now();

    switch (state.state) {
      case 'closed':
        return true;

      case 'open':
        if (
          state.lastFailure &&
          now - state.lastFailure.getTime() > webhook.circuitBreaker.timeout
        ) {
          state.state = 'half-open';
          state.successCount = 0;
          return true;
        }
        return false;

      case 'half-open':
        return true;

      default:
        return true;
    }
  }

  /**
   * Record successful delivery
   */
  private recordSuccess(
    webhookId: string,
    duration: number,
    delivery: WebhookDelivery
  ): void {
    const webhook = this.webhooks.get(webhookId);
    const state = this.circuitStates.get(webhookId);

    if (webhook && state && webhook.circuitBreaker.enabled) {
      state.successCount++;
      state.failureCount = 0;

      if (state.state === 'half-open') {
        if (state.successCount >= webhook.circuitBreaker.successThreshold) {
          state.state = 'closed';
          state.successCount = 0;
          this.emit('webhook:circuit_closed', { webhookId });
        }
      }
    }

    this.logDelivery(webhookId, delivery.event, delivery.id, true, duration);
    this.emit('webhook:delivered', { webhookId, delivery });
  }

  /**
   * Record failed delivery
   */
  private recordFailure(
    webhookId: string,
    duration: number,
    delivery: WebhookDelivery,
    error: Error
  ): void {
    const webhook = this.webhooks.get(webhookId);
    const state = this.circuitStates.get(webhookId);

    if (webhook && state && webhook.circuitBreaker.enabled) {
      state.failureCount++;
      state.lastFailure = new Date();

      if (state.state === 'closed') {
        if (state.failureCount >= webhook.circuitBreaker.failureThreshold) {
          state.state = 'open';
          this.emit('webhook:circuit_opened', { webhookId });
        }
      } else if (state.state === 'half-open') {
        state.state = 'open';
        state.successCount = 0;
      }
    }

    this.logDelivery(webhookId, delivery.event, delivery.id, false, duration);
    this.emit('webhook:failed', { webhookId, delivery, error });
  }

  /**
   * Log delivery attempt
   */
  private logDelivery(
    webhookId: string,
    event: WebhookEvent,
    deliveryId: string,
    success: boolean,
    duration: number
  ): void {
    const log: WebhookLog = {
      webhookId,
      event,
      deliveryId,
      success,
      duration,
      timestamp: new Date(),
    };

    this.logs.push(log);

    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-5000);
    }
  }

  /**
   * Get webhook logs
   */
  async getLogs(
    webhookId?: string,
    limit: number = 100
  ): Promise<WebhookLog[]> {
    let logs = [...this.logs];

    if (webhookId) {
      logs = logs.filter(log => log.webhookId === webhookId);
    }

    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get webhook statistics
   */
  async getStatistics(webhookId: string): Promise<WebhookStatistics> {
    const logs = this.logs.filter(log => log.webhookId === webhookId);

    const total = logs.length;
    const successful = logs.filter(log => log.success).length;
    const failed = logs.filter(log => !log.success).length;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    const durations = logs.map(log => log.duration);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const state = this.circuitStates.get(webhookId);

    return {
      total,
      successful,
      failed,
      successRate,
      avgDuration,
      circuitState: state?.state || 'closed',
    };
  }

  /**
   * Test webhook
   */
  async testWebhook(webhookId: string): Promise<WebhookDelivery> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const testPayload = {
      event: 'test.webhook' as WebhookEvent,
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
      },
    };

    const delivery: WebhookDelivery = {
      id: uuidv4(),
      webhookId: webhook.id,
      event: 'test.webhook' as WebhookEvent,
      payload: testPayload,
      attempt: 0,
      status: 'pending',
      createdAt: new Date(),
    };

    this.deliveries.set(delivery.id, delivery);
    await this.executeDelivery(webhook, delivery);

    return delivery;
  }

  /**
   * Get default retry configuration
   */
  private getDefaultRetryConfig(): RetryConfig {
    return {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 60000,
    };
  }

  /**
   * Get default circuit breaker configuration
   */
  private getDefaultCircuitBreakerConfig(): CircuitBreakerConfig {
    return {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
    };
  }

  /**
   * Generate webhook secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

interface CircuitState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailure: Date | null;
}

interface WebhookStatistics {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  avgDuration: number;
  circuitState: string;
}

export default AnalyticsWebhooks;
