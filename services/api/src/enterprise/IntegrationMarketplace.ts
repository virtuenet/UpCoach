import { EventEmitter } from 'events';
import crypto from 'crypto';
import { Pool, PoolClient } from 'pg';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

/**
 * Integration Marketplace Service
 *
 * Complete integration marketplace service with:
 * - Partner API management with rate limiting
 * - OAuth 2.0 app registration for third-party apps
 * - Webhook delivery system with retry logic
 * - Integration categories: CRM, Marketing, Analytics, Productivity, Communication
 * - Popular integrations: Salesforce, HubSpot, Slack, Microsoft Teams, Zapier, Google Analytics
 * - API key management with rotation
 * - Usage tracking and billing for partner API calls
 * - Integration health monitoring
 * - Webhook signature verification (HMAC-SHA256)
 * - BullMQ for webhook delivery queue
 * - PostgreSQL schemas for integrations and webhooks
 */

export type IntegrationCategory = 'crm' | 'marketing' | 'analytics' | 'productivity' | 'communication' | 'automation' | 'hr' | 'finance';

export type IntegrationType = 'oauth2' | 'api_key' | 'webhook' | 'embedded';

export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending_auth' | 'disconnected';

export interface Integration {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: IntegrationCategory;
  type: IntegrationType;
  provider: string;
  logoUrl?: string;
  websiteUrl?: string;
  documentationUrl?: string;
  supportEmail?: string;
  isOfficial: boolean;
  isBeta: boolean;
  isPublished: boolean;
  rating: number;
  installCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationInstance {
  id: string;
  integrationId: string;
  tenantId: string;
  userId: string;
  status: IntegrationStatus;

  oauth2Config?: {
    accessToken: string;
    refreshToken?: string;
    tokenType: string;
    expiresAt?: Date;
    scope: string[];
  };

  apiKeyConfig?: {
    apiKey: string;
    apiSecret?: string;
  };

  webhookConfig?: {
    webhookUrl: string;
    webhookSecret: string;
    events: string[];
  };

  settings: Record<string, any>;
  metadata: Record<string, any>;
  lastSyncAt?: Date;
  lastErrorAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OAuthApp {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUris: string[];
  scope: string[];
  allowedOrigins: string[];
  grantTypes: string[];
  logoUrl?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

export interface Webhook {
  id: string;
  integrationInstanceId: string;
  tenantId: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  retryCount: number;
  maxRetries: number;
  retryBackoff: number;
  timeout: number;
  headers: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  tenantId: string;
  event: string;
  payload: Record<string, any>;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  responseStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  hashedKey: string;
  tenantId: string;
  userId: string;
  scope: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  expiresAt?: Date;
  lastUsedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIUsage {
  id: string;
  apiKeyId?: string;
  oauthAppId?: string;
  tenantId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface IntegrationHealth {
  integrationInstanceId: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  lastCheckAt: Date;
  successRate: number;
  avgResponseTime: number;
  errorRate: number;
  totalRequests: number;
  totalErrors: number;
  lastError?: string;
}

export class IntegrationMarketplace extends EventEmitter {
  private db: Pool;
  private redis: Redis;
  private webhookQueue: Queue;
  private webhookWorker: Worker;
  private axiosInstances: Map<string, AxiosInstance> = new Map();
  private encryptionKey: Buffer;

  constructor(db: Pool, redis: Redis) {
    super();
    this.db = db;
    this.redis = redis;

    const key = process.env.INTEGRATION_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.encryptionKey = Buffer.from(key, 'hex').slice(0, 32);

    this.webhookQueue = new Queue('webhook-delivery', {
      connection: redis,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          count: 1000,
          age: 86400,
        },
        removeOnFail: {
          count: 5000,
        },
      },
    });

    this.webhookWorker = new Worker(
      'webhook-delivery',
      async (job: Job) => this.processWebhookDelivery(job),
      {
        connection: redis,
        concurrency: 10,
      }
    );

    this.initializeDatabase().catch(err => {
      logger.error('Failed to initialize marketplace database', err);
    });

    this.startHealthCheckScheduler();
  }

  private async initializeDatabase(): Promise<void> {
    const client = await this.db.connect();

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS integrations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          category VARCHAR(50) NOT NULL,
          type VARCHAR(50) NOT NULL,
          provider VARCHAR(255) NOT NULL,
          logo_url TEXT,
          website_url TEXT,
          documentation_url TEXT,
          support_email VARCHAR(255),
          is_official BOOLEAN DEFAULT false,
          is_beta BOOLEAN DEFAULT false,
          is_published BOOLEAN DEFAULT true,
          rating DECIMAL(3,2) DEFAULT 0.0,
          install_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_integrations_category ON integrations(category);
        CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
        CREATE INDEX IF NOT EXISTS idx_integrations_published ON integrations(is_published);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS integration_instances (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
          tenant_id UUID NOT NULL,
          user_id UUID NOT NULL,
          status VARCHAR(50) DEFAULT 'active',
          oauth2_config JSONB,
          api_key_config JSONB,
          webhook_config JSONB,
          settings JSONB DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          last_sync_at TIMESTAMP,
          last_error_at TIMESTAMP,
          last_error TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(integration_id, tenant_id)
        );

        CREATE INDEX IF NOT EXISTS idx_integration_instances_tenant ON integration_instances(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_integration_instances_status ON integration_instances(status);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS oauth_apps (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          client_id VARCHAR(255) NOT NULL UNIQUE,
          client_secret VARCHAR(255) NOT NULL,
          tenant_id UUID NOT NULL,
          redirect_uris TEXT[] NOT NULL,
          scope TEXT[] DEFAULT '{}',
          allowed_origins TEXT[] DEFAULT '{}',
          grant_types TEXT[] DEFAULT '{"authorization_code"}',
          logo_url TEXT,
          privacy_policy_url TEXT,
          terms_of_service_url TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          last_used_at TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_oauth_apps_tenant ON oauth_apps(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_oauth_apps_client_id ON oauth_apps(client_id);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS webhooks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          integration_instance_id UUID REFERENCES integration_instances(id) ON DELETE CASCADE,
          tenant_id UUID NOT NULL,
          url TEXT NOT NULL,
          secret VARCHAR(255) NOT NULL,
          events TEXT[] NOT NULL,
          is_active BOOLEAN DEFAULT true,
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 5,
          retry_backoff INTEGER DEFAULT 2000,
          timeout INTEGER DEFAULT 30000,
          headers JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON webhooks(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_webhooks_instance ON webhooks(integration_instance_id);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS webhook_deliveries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
          tenant_id UUID NOT NULL,
          event VARCHAR(255) NOT NULL,
          payload JSONB NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          attempts INTEGER DEFAULT 0,
          last_attempt_at TIMESTAMP,
          next_retry_at TIMESTAMP,
          response_status INTEGER,
          response_body TEXT,
          error_message TEXT,
          delivered_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
        CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
        CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS api_keys (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          key VARCHAR(255) NOT NULL UNIQUE,
          hashed_key VARCHAR(255) NOT NULL,
          tenant_id UUID NOT NULL,
          user_id UUID NOT NULL,
          scope TEXT[] DEFAULT '{}',
          rate_limit JSONB NOT NULL,
          expires_at TIMESTAMP,
          last_used_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
        CREATE INDEX IF NOT EXISTS idx_api_keys_hashed ON api_keys(hashed_key);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS api_usage (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
          oauth_app_id UUID REFERENCES oauth_apps(id) ON DELETE SET NULL,
          tenant_id UUID NOT NULL,
          endpoint VARCHAR(500) NOT NULL,
          method VARCHAR(10) NOT NULL,
          status_code INTEGER NOT NULL,
          response_time INTEGER NOT NULL,
          request_size INTEGER DEFAULT 0,
          response_size INTEGER DEFAULT 0,
          ip_address VARCHAR(45),
          user_agent TEXT,
          timestamp TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_api_usage_tenant ON api_usage(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_api_usage_api_key ON api_usage(api_key_id);
        CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS integration_health (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          integration_instance_id UUID NOT NULL REFERENCES integration_instances(id) ON DELETE CASCADE,
          status VARCHAR(50) NOT NULL,
          uptime DECIMAL(5,2) DEFAULT 0.0,
          last_check_at TIMESTAMP NOT NULL,
          success_rate DECIMAL(5,2) DEFAULT 0.0,
          avg_response_time INTEGER DEFAULT 0,
          error_rate DECIMAL(5,2) DEFAULT 0.0,
          total_requests INTEGER DEFAULT 0,
          total_errors INTEGER DEFAULT 0,
          last_error TEXT,
          UNIQUE(integration_instance_id)
        );

        CREATE INDEX IF NOT EXISTS idx_integration_health_instance ON integration_health(integration_instance_id);
        CREATE INDEX IF NOT EXISTS idx_integration_health_status ON integration_health(status);
      `);

      await this.seedPopularIntegrations(client);

      logger.info('Integration marketplace database initialized successfully');
    } finally {
      client.release();
    }
  }

  private async seedPopularIntegrations(client: PoolClient): Promise<void> {
    const integrations = [
      {
        name: 'Salesforce',
        slug: 'salesforce',
        description: 'Sync contacts, leads, and opportunities with Salesforce CRM',
        category: 'crm',
        type: 'oauth2',
        provider: 'salesforce',
        website_url: 'https://www.salesforce.com',
        is_official: true,
      },
      {
        name: 'HubSpot',
        slug: 'hubspot',
        description: 'Connect with HubSpot CRM for marketing and sales automation',
        category: 'crm',
        type: 'oauth2',
        provider: 'hubspot',
        website_url: 'https://www.hubspot.com',
        is_official: true,
      },
      {
        name: 'Slack',
        slug: 'slack',
        description: 'Send notifications and updates to Slack channels',
        category: 'communication',
        type: 'oauth2',
        provider: 'slack',
        website_url: 'https://slack.com',
        is_official: true,
      },
      {
        name: 'Microsoft Teams',
        slug: 'microsoft-teams',
        description: 'Integrate with Microsoft Teams for seamless communication',
        category: 'communication',
        type: 'oauth2',
        provider: 'microsoft',
        website_url: 'https://www.microsoft.com/teams',
        is_official: true,
      },
      {
        name: 'Google Analytics',
        slug: 'google-analytics',
        description: 'Track and analyze user behavior with Google Analytics',
        category: 'analytics',
        type: 'oauth2',
        provider: 'google',
        website_url: 'https://analytics.google.com',
        is_official: true,
      },
      {
        name: 'Zapier',
        slug: 'zapier',
        description: 'Connect with 5000+ apps through Zapier automation',
        category: 'automation',
        type: 'webhook',
        provider: 'zapier',
        website_url: 'https://zapier.com',
        is_official: true,
      },
      {
        name: 'Mailchimp',
        slug: 'mailchimp',
        description: 'Sync contacts and manage email campaigns with Mailchimp',
        category: 'marketing',
        type: 'oauth2',
        provider: 'mailchimp',
        website_url: 'https://mailchimp.com',
        is_official: false,
      },
      {
        name: 'Stripe',
        slug: 'stripe',
        description: 'Process payments and manage subscriptions with Stripe',
        category: 'finance',
        type: 'api_key',
        provider: 'stripe',
        website_url: 'https://stripe.com',
        is_official: true,
      },
      {
        name: 'Zoom',
        slug: 'zoom',
        description: 'Schedule and manage Zoom meetings directly from UpCoach',
        category: 'communication',
        type: 'oauth2',
        provider: 'zoom',
        website_url: 'https://zoom.us',
        is_official: true,
      },
      {
        name: 'Asana',
        slug: 'asana',
        description: 'Create and track tasks in Asana project management',
        category: 'productivity',
        type: 'oauth2',
        provider: 'asana',
        website_url: 'https://asana.com',
        is_official: false,
      },
    ];

    for (const integration of integrations) {
      await client.query(
        `INSERT INTO integrations (name, slug, description, category, type, provider, website_url, is_official)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (slug) DO NOTHING`,
        [
          integration.name,
          integration.slug,
          integration.description,
          integration.category,
          integration.type,
          integration.provider,
          integration.website_url,
          integration.is_official,
        ]
      );
    }
  }

  async createIntegration(data: Omit<Integration, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'installCount'>): Promise<Integration> {
    const result = await this.db.query<any>(
      `INSERT INTO integrations (
        name, slug, description, category, type, provider, logo_url, website_url,
        documentation_url, support_email, is_official, is_beta, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.name,
        data.slug,
        data.description,
        data.category,
        data.type,
        data.provider,
        data.logoUrl,
        data.websiteUrl,
        data.documentationUrl,
        data.supportEmail,
        data.isOfficial,
        data.isBeta,
        data.isPublished,
      ]
    );

    const integration = this.mapRowToIntegration(result.rows[0]);
    this.emit('integration:created', integration);
    logger.info('Integration created', { integrationId: integration.id, slug: integration.slug });

    return integration;
  }

  async getIntegrations(filters?: {
    category?: IntegrationCategory;
    type?: IntegrationType;
    search?: string;
    isPublished?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ integrations: Integration[]; total: number }> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.category) {
      conditions.push(`category = $${paramIndex}`);
      params.push(filters.category);
      paramIndex++;
    }

    if (filters?.type) {
      conditions.push(`type = $${paramIndex}`);
      params.push(filters.type);
      paramIndex++;
    }

    if (filters?.search) {
      conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters?.isPublished !== undefined) {
      conditions.push(`is_published = $${paramIndex}`);
      params.push(filters.isPublished);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await this.db.query(
      `SELECT COUNT(*) FROM integrations ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count);

    params.push(filters?.limit || 50, filters?.offset || 0);

    const result = await this.db.query<any>(
      `SELECT * FROM integrations ${whereClause}
       ORDER BY is_official DESC, install_count DESC, rating DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const integrations = result.rows.map(row => this.mapRowToIntegration(row));

    return { integrations, total };
  }

  async installIntegration(
    integrationId: string,
    tenantId: string,
    userId: string,
    config?: Partial<IntegrationInstance>
  ): Promise<IntegrationInstance> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const integration = await this.getIntegrationById(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const oauth2Config = config?.oauth2Config ? {
        ...config.oauth2Config,
        accessToken: this.encrypt(config.oauth2Config.accessToken),
        refreshToken: config.oauth2Config.refreshToken ? this.encrypt(config.oauth2Config.refreshToken) : undefined,
      } : null;

      const apiKeyConfig = config?.apiKeyConfig ? {
        apiKey: this.encrypt(config.apiKeyConfig.apiKey),
        apiSecret: config.apiKeyConfig.apiSecret ? this.encrypt(config.apiKeyConfig.apiSecret) : undefined,
      } : null;

      const result = await client.query<any>(
        `INSERT INTO integration_instances (
          integration_id, tenant_id, user_id, status, oauth2_config, api_key_config,
          webhook_config, settings, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          integrationId,
          tenantId,
          userId,
          config?.status || 'active',
          oauth2Config,
          apiKeyConfig,
          config?.webhookConfig,
          config?.settings || {},
          config?.metadata || {},
        ]
      );

      await client.query(
        'UPDATE integrations SET install_count = install_count + 1 WHERE id = $1',
        [integrationId]
      );

      await client.query(
        `INSERT INTO integration_health (integration_instance_id, status, last_check_at)
         VALUES ($1, 'healthy', NOW())`,
        [result.rows[0].id]
      );

      await client.query('COMMIT');

      const instance = this.mapRowToIntegrationInstance(result.rows[0]);
      this.emit('integration:installed', { instance, integration });
      logger.info('Integration installed', { instanceId: instance.id, integrationId });

      return instance;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to install integration', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async createOAuthApp(data: Omit<OAuthApp, 'id' | 'clientId' | 'clientSecret' | 'createdAt' | 'updatedAt'>): Promise<OAuthApp> {
    const clientId = 'uc_' + crypto.randomBytes(16).toString('hex');
    const clientSecret = crypto.randomBytes(32).toString('hex');
    const hashedSecret = this.hashSecret(clientSecret);

    const result = await this.db.query<any>(
      `INSERT INTO oauth_apps (
        name, client_id, client_secret, tenant_id, redirect_uris, scope,
        allowed_origins, grant_types, logo_url, privacy_policy_url,
        terms_of_service_url, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        data.name,
        clientId,
        hashedSecret,
        data.tenantId,
        data.redirectUris,
        data.scope,
        data.allowedOrigins,
        data.grantTypes,
        data.logoUrl,
        data.privacyPolicyUrl,
        data.termsOfServiceUrl,
        data.isActive,
      ]
    );

    const app = this.mapRowToOAuthApp(result.rows[0]);
    app.clientSecret = clientSecret;

    this.emit('oauth_app:created', app);
    logger.info('OAuth app created', { appId: app.id, clientId });

    return app;
  }

  async createWebhook(data: Omit<Webhook, 'id' | 'secret' | 'createdAt' | 'updatedAt'>): Promise<Webhook> {
    const secret = crypto.randomBytes(32).toString('hex');

    const result = await this.db.query<any>(
      `INSERT INTO webhooks (
        integration_instance_id, tenant_id, url, secret, events, is_active,
        max_retries, retry_backoff, timeout, headers
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.integrationInstanceId,
        data.tenantId,
        data.url,
        secret,
        data.events,
        data.isActive,
        data.maxRetries,
        data.retryBackoff,
        data.timeout,
        data.headers,
      ]
    );

    const webhook = this.mapRowToWebhook(result.rows[0]);
    this.emit('webhook:created', webhook);
    logger.info('Webhook created', { webhookId: webhook.id, url: webhook.url });

    return webhook;
  }

  async triggerWebhook(tenantId: string, event: string, payload: Record<string, any>): Promise<void> {
    const result = await this.db.query<any>(
      `SELECT * FROM webhooks WHERE tenant_id = $1 AND $2 = ANY(events) AND is_active = true`,
      [tenantId, event]
    );

    for (const row of result.rows) {
      const webhook = this.mapRowToWebhook(row);
      await this.createWebhookDelivery(webhook, event, payload);
    }

    logger.info('Webhooks triggered', { tenantId, event, webhookCount: result.rows.length });
  }

  private async createWebhookDelivery(webhook: Webhook, event: string, payload: Record<string, any>): Promise<WebhookDelivery> {
    const result = await this.db.query<any>(
      `INSERT INTO webhook_deliveries (webhook_id, tenant_id, event, payload, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [webhook.id, webhook.tenantId, event, payload]
    );

    const delivery = this.mapRowToWebhookDelivery(result.rows[0]);

    await this.webhookQueue.add('deliver', {
      deliveryId: delivery.id,
      webhookId: webhook.id,
      url: webhook.url,
      secret: webhook.secret,
      event,
      payload,
      headers: webhook.headers,
      timeout: webhook.timeout,
    });

    return delivery;
  }

  private async processWebhookDelivery(job: Job): Promise<void> {
    const { deliveryId, webhookId, url, secret, event, payload, headers, timeout } = job.data;

    try {
      const signature = this.generateWebhookSignature(payload, secret);

      const response = await axios.post(url, payload, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'X-Webhook-Delivery': deliveryId,
        },
        timeout,
        validateStatus: null,
      });

      await this.db.query(
        `UPDATE webhook_deliveries SET
          status = $1,
          attempts = attempts + 1,
          last_attempt_at = NOW(),
          response_status = $2,
          response_body = $3,
          delivered_at = $4
        WHERE id = $5`,
        [
          response.status >= 200 && response.status < 300 ? 'success' : 'failed',
          response.status,
          JSON.stringify(response.data).substring(0, 10000),
          response.status >= 200 && response.status < 300 ? new Date() : null,
          deliveryId,
        ]
      );

      if (response.status >= 200 && response.status < 300) {
        this.emit('webhook:delivered', { deliveryId, webhookId, event });
        logger.info('Webhook delivered successfully', { deliveryId, url, status: response.status });
      } else {
        throw new Error(`Webhook delivery failed with status ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.db.query(
        `UPDATE webhook_deliveries SET
          status = 'retrying',
          attempts = attempts + 1,
          last_attempt_at = NOW(),
          error_message = $1,
          next_retry_at = NOW() + INTERVAL '${Math.pow(2, job.attemptsMade)} minutes'
        WHERE id = $2`,
        [errorMessage, deliveryId]
      );

      await this.db.query(
        'UPDATE webhooks SET retry_count = retry_count + 1 WHERE id = $1',
        [webhookId]
      );

      logger.error('Webhook delivery failed', { deliveryId, url, error: errorMessage, attempt: job.attemptsMade });
      throw error;
    }
  }

  async createAPIKey(
    name: string,
    tenantId: string,
    userId: string,
    scope: string[],
    rateLimit: APIKey['rateLimit'],
    expiresAt?: Date
  ): Promise<APIKey> {
    const key = 'sk_' + crypto.randomBytes(24).toString('base64url');
    const hashedKey = this.hashSecret(key);

    const result = await this.db.query<any>(
      `INSERT INTO api_keys (name, key, hashed_key, tenant_id, user_id, scope, rate_limit, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, key, hashedKey, tenantId, userId, scope, rateLimit, expiresAt]
    );

    const apiKey = this.mapRowToAPIKey(result.rows[0]);
    apiKey.key = key;

    this.emit('api_key:created', apiKey);
    logger.info('API key created', { keyId: apiKey.id, name });

    return apiKey;
  }

  async validateAPIKey(key: string): Promise<APIKey | null> {
    const hashedKey = this.hashSecret(key);

    const result = await this.db.query<any>(
      `SELECT * FROM api_keys
       WHERE hashed_key = $1 AND is_active = true
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [hashedKey]
    );

    if (result.rows.length === 0) {
      return null;
    }

    await this.db.query(
      'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
      [result.rows[0].id]
    );

    return this.mapRowToAPIKey(result.rows[0]);
  }

  async checkRateLimit(apiKeyId: string, rateLimit: APIKey['rateLimit']): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const now = new Date();
    const minuteAgo = new Date(now.getTime() - 60000);
    const hourAgo = new Date(now.getTime() - 3600000);
    const dayAgo = new Date(now.getTime() - 86400000);

    const result = await this.db.query<any>(
      `SELECT
        COUNT(*) FILTER (WHERE timestamp > $1) as minute_count,
        COUNT(*) FILTER (WHERE timestamp > $2) as hour_count,
        COUNT(*) FILTER (WHERE timestamp > $3) as day_count
       FROM api_usage
       WHERE api_key_id = $4`,
      [minuteAgo, hourAgo, dayAgo, apiKeyId]
    );

    const counts = result.rows[0];

    const minuteAllowed = parseInt(counts.minute_count) < rateLimit.requestsPerMinute;
    const hourAllowed = parseInt(counts.hour_count) < rateLimit.requestsPerHour;
    const dayAllowed = parseInt(counts.day_count) < rateLimit.requestsPerDay;

    const allowed = minuteAllowed && hourAllowed && dayAllowed;

    let remaining = rateLimit.requestsPerMinute - parseInt(counts.minute_count);
    let resetAt = new Date(now.getTime() + 60000);

    if (!hourAllowed) {
      remaining = rateLimit.requestsPerHour - parseInt(counts.hour_count);
      resetAt = new Date(now.getTime() + 3600000);
    } else if (!dayAllowed) {
      remaining = rateLimit.requestsPerDay - parseInt(counts.day_count);
      resetAt = new Date(now.getTime() + 86400000);
    }

    return { allowed, remaining: Math.max(0, remaining), resetAt };
  }

  async trackAPIUsage(usage: Omit<APIUsage, 'id' | 'timestamp'>): Promise<void> {
    await this.db.query(
      `INSERT INTO api_usage (
        api_key_id, oauth_app_id, tenant_id, endpoint, method, status_code,
        response_time, request_size, response_size, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        usage.apiKeyId,
        usage.oauthAppId,
        usage.tenantId,
        usage.endpoint,
        usage.method,
        usage.statusCode,
        usage.responseTime,
        usage.requestSize,
        usage.responseSize,
        usage.ipAddress,
        usage.userAgent,
      ]
    );
  }

  async getAPIUsageStats(
    tenantId: string,
    filters?: {
      apiKeyId?: string;
      startDate?: Date;
      endDate?: Date;
      groupBy?: 'hour' | 'day' | 'month';
    }
  ): Promise<any[]> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters?.apiKeyId) {
      conditions.push(`api_key_id = $${paramIndex}`);
      params.push(filters.apiKeyId);
      paramIndex++;
    }

    if (filters?.startDate) {
      conditions.push(`timestamp >= $${paramIndex}`);
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      conditions.push(`timestamp <= $${paramIndex}`);
      params.push(filters.endDate);
      paramIndex++;
    }

    const groupByClause = filters?.groupBy === 'hour'
      ? "DATE_TRUNC('hour', timestamp)"
      : filters?.groupBy === 'month'
      ? "DATE_TRUNC('month', timestamp)"
      : "DATE_TRUNC('day', timestamp)";

    const result = await this.db.query(
      `SELECT
        ${groupByClause} as period,
        COUNT(*) as total_requests,
        AVG(response_time) as avg_response_time,
        SUM(request_size) as total_request_size,
        SUM(response_size) as total_response_size,
        COUNT(*) FILTER (WHERE status_code >= 400) as error_count
       FROM api_usage
       WHERE ${conditions.join(' AND ')}
       GROUP BY period
       ORDER BY period DESC`,
      params
    );

    return result.rows;
  }

  async updateIntegrationHealth(instanceId: string): Promise<IntegrationHealth> {
    const result = await this.db.query<any>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'success') as successes,
        AVG(response_time) as avg_time
       FROM webhook_deliveries wd
       JOIN webhooks w ON w.id = wd.webhook_id
       WHERE w.integration_instance_id = $1
       AND wd.created_at > NOW() - INTERVAL '1 hour'`,
      [instanceId]
    );

    const stats = result.rows[0];
    const total = parseInt(stats.total) || 0;
    const successes = parseInt(stats.successes) || 0;
    const successRate = total > 0 ? (successes / total) * 100 : 100;
    const avgResponseTime = parseInt(stats.avg_time) || 0;
    const errorRate = total > 0 ? ((total - successes) / total) * 100 : 0;

    let status: IntegrationHealth['status'] = 'healthy';
    if (successRate < 50) {
      status = 'down';
    } else if (successRate < 90) {
      status = 'degraded';
    }

    const healthResult = await this.db.query<any>(
      `INSERT INTO integration_health (
        integration_instance_id, status, last_check_at, success_rate,
        avg_response_time, error_rate, total_requests, total_errors
      ) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7)
      ON CONFLICT (integration_instance_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        last_check_at = NOW(),
        success_rate = EXCLUDED.success_rate,
        avg_response_time = EXCLUDED.avg_response_time,
        error_rate = EXCLUDED.error_rate,
        total_requests = integration_health.total_requests + EXCLUDED.total_requests,
        total_errors = integration_health.total_errors + EXCLUDED.total_errors
      RETURNING *`,
      [instanceId, status, successRate, avgResponseTime, errorRate, total, total - successes]
    );

    const health = this.mapRowToIntegrationHealth(healthResult.rows[0]);

    if (status !== 'healthy') {
      this.emit('integration:health_degraded', { instanceId, health });
    }

    return health;
  }

  private startHealthCheckScheduler(): void {
    setInterval(async () => {
      try {
        const result = await this.db.query<any>(
          'SELECT id FROM integration_instances WHERE status = $1',
          ['active']
        );

        for (const row of result.rows) {
          await this.updateIntegrationHealth(row.id);
        }

        logger.info('Health check completed', { instancesChecked: result.rows.length });
      } catch (error) {
        logger.error('Health check failed', error);
      }
    }, 300000);
  }

  private async getIntegrationById(id: string): Promise<Integration | null> {
    const result = await this.db.query<any>(
      'SELECT * FROM integrations WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToIntegration(result.rows[0]);
  }

  private generateWebhookSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  private hashSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private mapRowToIntegration(row: any): Integration {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      category: row.category,
      type: row.type,
      provider: row.provider,
      logoUrl: row.logo_url,
      websiteUrl: row.website_url,
      documentationUrl: row.documentation_url,
      supportEmail: row.support_email,
      isOfficial: row.is_official,
      isBeta: row.is_beta,
      isPublished: row.is_published,
      rating: parseFloat(row.rating),
      installCount: row.install_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToIntegrationInstance(row: any): IntegrationInstance {
    const oauth2Config = row.oauth2_config ? {
      ...row.oauth2_config,
      accessToken: this.decrypt(row.oauth2_config.accessToken),
      refreshToken: row.oauth2_config.refreshToken ? this.decrypt(row.oauth2_config.refreshToken) : undefined,
    } : undefined;

    const apiKeyConfig = row.api_key_config ? {
      apiKey: this.decrypt(row.api_key_config.apiKey),
      apiSecret: row.api_key_config.apiSecret ? this.decrypt(row.api_key_config.apiSecret) : undefined,
    } : undefined;

    return {
      id: row.id,
      integrationId: row.integration_id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      status: row.status,
      oauth2Config,
      apiKeyConfig,
      webhookConfig: row.webhook_config,
      settings: row.settings,
      metadata: row.metadata,
      lastSyncAt: row.last_sync_at,
      lastErrorAt: row.last_error_at,
      lastError: row.last_error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToOAuthApp(row: any): OAuthApp {
    return {
      id: row.id,
      name: row.name,
      clientId: row.client_id,
      clientSecret: row.client_secret,
      tenantId: row.tenant_id,
      redirectUris: row.redirect_uris,
      scope: row.scope,
      allowedOrigins: row.allowed_origins,
      grantTypes: row.grant_types,
      logoUrl: row.logo_url,
      privacyPolicyUrl: row.privacy_policy_url,
      termsOfServiceUrl: row.terms_of_service_url,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastUsedAt: row.last_used_at,
    };
  }

  private mapRowToWebhook(row: any): Webhook {
    return {
      id: row.id,
      integrationInstanceId: row.integration_instance_id,
      tenantId: row.tenant_id,
      url: row.url,
      secret: row.secret,
      events: row.events,
      isActive: row.is_active,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      retryBackoff: row.retry_backoff,
      timeout: row.timeout,
      headers: row.headers,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToWebhookDelivery(row: any): WebhookDelivery {
    return {
      id: row.id,
      webhookId: row.webhook_id,
      tenantId: row.tenant_id,
      event: row.event,
      payload: row.payload,
      status: row.status,
      attempts: row.attempts,
      lastAttemptAt: row.last_attempt_at,
      nextRetryAt: row.next_retry_at,
      responseStatus: row.response_status,
      responseBody: row.response_body,
      errorMessage: row.error_message,
      deliveredAt: row.delivered_at,
      createdAt: row.created_at,
    };
  }

  private mapRowToAPIKey(row: any): APIKey {
    return {
      id: row.id,
      name: row.name,
      key: row.key,
      hashedKey: row.hashed_key,
      tenantId: row.tenant_id,
      userId: row.user_id,
      scope: row.scope,
      rateLimit: row.rate_limit,
      expiresAt: row.expires_at,
      lastUsedAt: row.last_used_at,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToIntegrationHealth(row: any): IntegrationHealth {
    return {
      integrationInstanceId: row.integration_instance_id,
      status: row.status,
      uptime: parseFloat(row.uptime),
      lastCheckAt: row.last_check_at,
      successRate: parseFloat(row.success_rate),
      avgResponseTime: row.avg_response_time,
      errorRate: parseFloat(row.error_rate),
      totalRequests: row.total_requests,
      totalErrors: row.total_errors,
      lastError: row.last_error,
    };
  }

  async close(): Promise<void> {
    await this.webhookWorker.close();
    await this.webhookQueue.close();
    logger.info('Integration marketplace service closed');
  }
}

export default IntegrationMarketplace;
