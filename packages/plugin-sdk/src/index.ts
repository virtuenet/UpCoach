/**
 * UpCoach Plugin SDK
 *
 * TypeScript SDK for building third-party plugins and integrations
 *
 * Features:
 * - OAuth2 credential flow
 * - Webhook subscription API
 * - Event emitters for lifecycle hooks
 * - Type-safe plugin development
 */

import axios, { AxiosInstance } from 'axios';
import EventEmitter from 'events';

/**
 * Plugin Manifest Schema
 */
export interface PluginManifest {
  name: string;
  version: string;
  author: string;
  description: string;
  permissions: Permission[];
  webhookUrl?: string;
  oauth?: OAuthConfig;
  category?: PluginCategory;
  pricing?: PluginPricing;
}

export type Permission =
  | 'habits:read'
  | 'habits:write'
  | 'goals:read'
  | 'goals:write'
  | 'users:read'
  | 'notifications:write'
  | 'analytics:read';

export type PluginCategory =
  | 'productivity'
  | 'communication'
  | 'analytics'
  | 'automation'
  | 'integration';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  authorizationUrl: string;
  tokenUrl: string;
}

export interface PluginPricing {
  type: 'free' | 'paid' | 'freemium';
  monthlyPrice?: number;
  currency?: string;
}

/**
 * Plugin Context (passed to plugin execution)
 */
export interface PluginContext {
  tenantId: string;
  userId?: string;
  apiKey: string;
  environment: 'production' | 'sandbox';
  data?: any;
}

/**
 * Plugin Response
 */
export interface PluginResponse {
  success: boolean;
  data?: any;
  error?: string;
  logs?: string[];
}

/**
 * Webhook Event
 */
export interface WebhookEvent {
  eventType: string;
  timestamp: string;
  data: any;
  metadata?: Record<string, any>;
}

/**
 * UpCoach Plugin Client
 */
export class UpCoachPluginClient extends EventEmitter {
  private apiClient: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; baseUrl?: string }) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.upcoach.com';

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Register plugin with UpCoach platform
   */
  async registerPlugin(manifest: PluginManifest): Promise<{ pluginId: string }> {
    const response = await this.apiClient.post('/api/plugins/register', manifest);
    return response.data;
  }

  /**
   * Subscribe to webhook events
   */
  async subscribeToEvent(eventType: string, callbackUrl: string): Promise<void> {
    await this.apiClient.post('/api/plugins/webhooks/subscribe', {
      eventType,
      callbackUrl,
    });
  }

  /**
   * Unsubscribe from webhook events
   */
  async unsubscribeFromEvent(eventType: string): Promise<void> {
    await this.apiClient.post('/api/plugins/webhooks/unsubscribe', {
      eventType,
    });
  }

  /**
   * Get user habits
   */
  async getHabits(userId: string): Promise<any[]> {
    const response = await this.apiClient.get(`/api/users/${userId}/habits`);
    return response.data;
  }

  /**
   * Create habit for user
   */
  async createHabit(userId: string, habit: {
    name: string;
    description?: string;
    frequency: string;
  }): Promise<any> {
    const response = await this.apiClient.post(`/api/users/${userId}/habits`, habit);
    return response.data;
  }

  /**
   * Get user goals
   */
  async getGoals(userId: string): Promise<any[]> {
    const response = await this.apiClient.get(`/api/users/${userId}/goals`);
    return response.data;
  }

  /**
   * Create goal for user
   */
  async createGoal(userId: string, goal: {
    title: string;
    description?: string;
    targetDate?: string;
  }): Promise<any> {
    const response = await this.apiClient.post(`/api/users/${userId}/goals`, goal);
    return response.data;
  }

  /**
   * Send notification to user
   */
  async sendNotification(userId: string, notification: {
    title: string;
    body: string;
    type?: string;
  }): Promise<void> {
    await this.apiClient.post(`/api/users/${userId}/notifications`, notification);
  }

  /**
   * Get analytics data
   */
  async getAnalytics(query: {
    startDate: string;
    endDate: string;
    metrics: string[];
  }): Promise<any> {
    const response = await this.apiClient.post('/api/analytics/query', query);
    return response.data;
  }

  /**
   * Store plugin data (key-value storage)
   */
  async setData(key: string, value: any): Promise<void> {
    await this.apiClient.post('/api/plugins/data', { key, value });
  }

  /**
   * Retrieve plugin data
   */
  async getData(key: string): Promise<any> {
    const response = await this.apiClient.get(`/api/plugins/data/${key}`);
    return response.data.value;
  }

  /**
   * Delete plugin data
   */
  async deleteData(key: string): Promise<void> {
    await this.apiClient.delete(`/api/plugins/data/${key}`);
  }

  /**
   * Log message (for debugging)
   */
  log(level: 'info' | 'warn' | 'error', message: string, metadata?: any): void {
    this.emit('log', { level, message, metadata, timestamp: new Date().toISOString() });
  }
}

/**
 * OAuth2 Client for plugin authentication
 */
export class OAuth2Client {
  private config: OAuthConfig;
  private redirectUri: string;

  constructor(config: OAuthConfig, redirectUri: string) {
    this.config = config;
    this.redirectUri = redirectUri;
  }

  /**
   * Generate authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      ...(state && { state }),
    });

    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }> {
    const response = await axios.post(
      this.config.tokenUrl,
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      },
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const response = await axios.post(
      this.config.tokenUrl,
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      },
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
    };
  }
}

/**
 * Webhook Subscriber
 */
export class WebhookSubscriber {
  private client: UpCoachPluginClient;
  private subscriptions: Map<string, (event: WebhookEvent) => void> = new Map();

  constructor(client: UpCoachPluginClient) {
    this.client = client;
  }

  /**
   * Subscribe to webhook event
   */
  async on(
    eventType: string,
    callbackUrl: string,
    handler: (event: WebhookEvent) => void
  ): Promise<void> {
    await this.client.subscribeToEvent(eventType, callbackUrl);
    this.subscriptions.set(eventType, handler);
  }

  /**
   * Unsubscribe from webhook event
   */
  async off(eventType: string): Promise<void> {
    await this.client.unsubscribeFromEvent(eventType);
    this.subscriptions.delete(eventType);
  }

  /**
   * Handle incoming webhook
   */
  handleWebhook(event: WebhookEvent): void {
    const handler = this.subscriptions.get(event.eventType);
    if (handler) {
      handler(event);
    }
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }
}

/**
 * Plugin Helper Functions
 */
export const PluginHelpers = {
  /**
   * Validate plugin manifest
   */
  validateManifest(manifest: PluginManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest.name || manifest.name.length < 3) {
      errors.push('Plugin name must be at least 3 characters');
    }

    if (!manifest.version || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      errors.push('Plugin version must follow semver format (e.g., 1.0.0)');
    }

    if (!manifest.author) {
      errors.push('Plugin author is required');
    }

    if (!manifest.description || manifest.description.length < 10) {
      errors.push('Plugin description must be at least 10 characters');
    }

    if (!manifest.permissions || manifest.permissions.length === 0) {
      errors.push('Plugin must request at least one permission');
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * Parse webhook payload
   */
  parseWebhookPayload(payload: string): WebhookEvent {
    try {
      return JSON.parse(payload);
    } catch (error) {
      throw new Error('Invalid webhook payload');
    }
  },
};

// Export all types and classes
export default UpCoachPluginClient;
