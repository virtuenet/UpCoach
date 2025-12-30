import { EventEmitter } from 'events';
import axios, { AxiosInstance } from 'axios';
import { Redis } from 'ioredis';
import crypto from 'crypto';

export enum IntegrationType {
  SLACK = 'slack',
  MICROSOFT_TEAMS = 'microsoft_teams',
  SALESFORCE = 'salesforce',
  WORKDAY = 'workday',
  SAP_SUCCESSFACTORS = 'sap_successfactors',
  GOOGLE_WORKSPACE = 'google_workspace',
  OKTA = 'okta',
  AZURE_AD = 'azure_ad'
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending',
  DISCONNECTED = 'disconnected'
}

export enum SyncDirection {
  BIDIRECTIONAL = 'bidirectional',
  INBOUND = 'inbound',
  OUTBOUND = 'outbound'
}

export interface IntegrationConfig {
  id: string;
  organizationId: string;
  type: IntegrationType;
  status: IntegrationStatus;
  credentials: {
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: Date;
    instanceUrl?: string;
    tenantId?: string;
  };
  settings: {
    syncDirection: SyncDirection;
    syncFrequency?: number; // minutes
    autoSync: boolean;
    enableWebhooks: boolean;
    fieldMappings: Record<string, string>;
    filters?: Record<string, any>;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastSyncAt?: Date;
    lastHealthCheck?: Date;
    errorCount: number;
    successCount: number;
  };
}

export interface OAuthConfig {
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

export interface IntegrationHealth {
  integrationId: string;
  status: IntegrationStatus;
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  uptime: number;
  issues: string[];
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: Array<{ record: any; error: string }>;
  duration: number;
}

class EnterpriseIntegrationHub extends EventEmitter {
  private redis: Redis;
  private integrations: Map<string, IntegrationConfig>;
  private httpClients: Map<string, AxiosInstance>;
  private healthCheckIntervals: Map<string, NodeJS.Timeout>;
  private readonly CACHE_PREFIX = 'integration:';
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor(redis: Redis) {
    super();
    this.redis = redis;
    this.integrations = new Map();
    this.httpClients = new Map();
    this.healthCheckIntervals = new Map();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadIntegrationsFromCache();
      this.emit('hub:initialized');
    } catch (error) {
      this.emit('hub:error', { error: 'Failed to initialize hub', details: error });
      throw error;
    }
  }

  private async loadIntegrationsFromCache(): Promise<void> {
    const keys = await this.redis.keys(`${this.CACHE_PREFIX}*`);

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const config = JSON.parse(data);
        this.integrations.set(config.id, config);
        if (config.status === IntegrationStatus.ACTIVE) {
          await this.initializeHttpClient(config);
          this.startHealthCheck(config.id);
        }
      }
    }
  }

  public async registerIntegration(config: Omit<IntegrationConfig, 'id' | 'metadata'>): Promise<IntegrationConfig> {
    const integrationConfig: IntegrationConfig = {
      ...config,
      id: crypto.randomUUID(),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        errorCount: 0,
        successCount: 0
      }
    };

    this.integrations.set(integrationConfig.id, integrationConfig);
    await this.saveIntegrationToCache(integrationConfig);

    if (integrationConfig.status === IntegrationStatus.ACTIVE) {
      await this.initializeHttpClient(integrationConfig);
      this.startHealthCheck(integrationConfig.id);
    }

    this.emit('integration:registered', { integrationId: integrationConfig.id });
    return integrationConfig;
  }

  public async updateIntegration(integrationId: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig> {
    const config = this.integrations.get(integrationId);
    if (!config) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    const updatedConfig: IntegrationConfig = {
      ...config,
      ...updates,
      metadata: {
        ...config.metadata,
        updatedAt: new Date()
      }
    };

    this.integrations.set(integrationId, updatedConfig);
    await this.saveIntegrationToCache(updatedConfig);

    if (updatedConfig.status === IntegrationStatus.ACTIVE && !this.httpClients.has(integrationId)) {
      await this.initializeHttpClient(updatedConfig);
      this.startHealthCheck(integrationId);
    } else if (updatedConfig.status !== IntegrationStatus.ACTIVE && this.httpClients.has(integrationId)) {
      this.stopHealthCheck(integrationId);
      this.httpClients.delete(integrationId);
    }

    this.emit('integration:updated', { integrationId });
    return updatedConfig;
  }

  public async deleteIntegration(integrationId: string): Promise<void> {
    const config = this.integrations.get(integrationId);
    if (!config) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    this.stopHealthCheck(integrationId);
    this.httpClients.delete(integrationId);
    this.integrations.delete(integrationId);
    await this.redis.del(`${this.CACHE_PREFIX}${integrationId}`);

    this.emit('integration:deleted', { integrationId });
  }

  public async initiateOAuthFlow(type: IntegrationType, organizationId: string): Promise<{ authorizationUrl: string; state: string }> {
    const oauthConfig = this.getOAuthConfig(type);
    const state = crypto.randomBytes(32).toString('hex');

    await this.redis.setex(
      `oauth:state:${state}`,
      600, // 10 minutes
      JSON.stringify({ type, organizationId })
    );

    const params = new URLSearchParams({
      client_id: process.env[`${type.toUpperCase()}_CLIENT_ID`] || '',
      redirect_uri: oauthConfig.redirectUri,
      scope: oauthConfig.scopes.join(' '),
      state,
      response_type: 'code'
    });

    const authorizationUrl = `${oauthConfig.authorizationUrl}?${params.toString()}`;

    this.emit('oauth:initiated', { type, organizationId, state });
    return { authorizationUrl, state };
  }

  public async handleOAuthCallback(code: string, state: string): Promise<IntegrationConfig> {
    const stateData = await this.redis.get(`oauth:state:${state}`);
    if (!stateData) {
      throw new Error('Invalid or expired OAuth state');
    }

    const { type, organizationId } = JSON.parse(stateData);
    await this.redis.del(`oauth:state:${state}`);

    const oauthConfig = this.getOAuthConfig(type);
    const tokens = await this.exchangeCodeForTokens(type, code, oauthConfig);

    const integrationConfig = await this.registerIntegration({
      organizationId,
      type,
      status: IntegrationStatus.ACTIVE,
      credentials: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
        instanceUrl: tokens.instanceUrl,
        tenantId: tokens.tenantId
      },
      settings: {
        syncDirection: SyncDirection.BIDIRECTIONAL,
        autoSync: true,
        enableWebhooks: true,
        fieldMappings: this.getDefaultFieldMappings(type)
      }
    });

    this.emit('oauth:completed', { integrationId: integrationConfig.id, type });
    return integrationConfig;
  }

  private async exchangeCodeForTokens(
    type: IntegrationType,
    code: string,
    oauthConfig: OAuthConfig
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number; instanceUrl?: string; tenantId?: string }> {
    try {
      const response = await axios.post(oauthConfig.tokenUrl, {
        grant_type: 'authorization_code',
        code,
        redirect_uri: oauthConfig.redirectUri,
        client_id: process.env[`${type.toUpperCase()}_CLIENT_ID`],
        client_secret: process.env[`${type.toUpperCase()}_CLIENT_SECRET`]
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        instanceUrl: response.data.instance_url,
        tenantId: response.data.tenant_id
      };
    } catch (error) {
      this.emit('oauth:error', { type, error });
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }
  }

  public async refreshAccessToken(integrationId: string): Promise<void> {
    const config = this.integrations.get(integrationId);
    if (!config || !config.credentials.refreshToken) {
      throw new Error('Integration not found or missing refresh token');
    }

    const oauthConfig = this.getOAuthConfig(config.type);

    try {
      const response = await axios.post(oauthConfig.tokenUrl, {
        grant_type: 'refresh_token',
        refresh_token: config.credentials.refreshToken,
        client_id: process.env[`${config.type.toUpperCase()}_CLIENT_ID`],
        client_secret: process.env[`${config.type.toUpperCase()}_CLIENT_SECRET`]
      });

      await this.updateIntegration(integrationId, {
        credentials: {
          ...config.credentials,
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token || config.credentials.refreshToken,
          tokenExpiry: new Date(Date.now() + response.data.expires_in * 1000)
        }
      });

      this.emit('token:refreshed', { integrationId });
    } catch (error) {
      this.emit('token:refresh:error', { integrationId, error });
      throw error;
    }
  }

  private async initializeHttpClient(config: IntegrationConfig): Promise<void> {
    const baseURL = this.getBaseUrl(config);

    const client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    client.interceptors.request.use(async (requestConfig) => {
      if (config.credentials.tokenExpiry && new Date() >= config.credentials.tokenExpiry) {
        await this.refreshAccessToken(config.id);
        const updatedConfig = this.integrations.get(config.id);
        if (updatedConfig && requestConfig.headers) {
          requestConfig.headers.Authorization = `Bearer ${updatedConfig.credentials.accessToken}`;
        }
      }
      return requestConfig;
    });

    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.refreshAccessToken(config.id);
          const updatedConfig = this.integrations.get(config.id);
          if (updatedConfig && error.config.headers) {
            error.config.headers.Authorization = `Bearer ${updatedConfig.credentials.accessToken}`;
            return axios.request(error.config);
          }
        }
        throw error;
      }
    );

    this.httpClients.set(config.id, client);
  }

  public async handleWebhook(integrationId: string, payload: any, signature?: string): Promise<void> {
    const config = this.integrations.get(integrationId);
    if (!config) {
      throw new Error('Integration not found');
    }

    if (signature) {
      const isValid = await this.verifyWebhookSignature(config, payload, signature);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
    }

    this.emit('webhook:received', {
      integrationId,
      type: config.type,
      payload
    });

    await this.processWebhookPayload(config, payload);
  }

  private async verifyWebhookSignature(config: IntegrationConfig, payload: any, signature: string): Promise<boolean> {
    const secret = process.env[`${config.type.toUpperCase()}_WEBHOOK_SECRET`] || '';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  private async processWebhookPayload(config: IntegrationConfig, payload: any): Promise<void> {
    try {
      switch (config.type) {
        case IntegrationType.SLACK:
          await this.processSlackWebhook(config, payload);
          break;
        case IntegrationType.MICROSOFT_TEAMS:
          await this.processTeamsWebhook(config, payload);
          break;
        case IntegrationType.SALESFORCE:
          await this.processSalesforceWebhook(config, payload);
          break;
        case IntegrationType.WORKDAY:
          await this.processWorkdayWebhook(config, payload);
          break;
        case IntegrationType.SAP_SUCCESSFACTORS:
          await this.processSAPWebhook(config, payload);
          break;
        default:
          this.emit('webhook:unsupported', { type: config.type });
      }
    } catch (error) {
      this.emit('webhook:error', { integrationId: config.id, error });
      throw error;
    }
  }

  private async processSlackWebhook(config: IntegrationConfig, payload: any): Promise<void> {
    if (payload.type === 'url_verification') {
      return;
    }

    if (payload.event) {
      this.emit('slack:event', {
        integrationId: config.id,
        event: payload.event
      });
    }
  }

  private async processTeamsWebhook(config: IntegrationConfig, payload: any): Promise<void> {
    this.emit('teams:event', {
      integrationId: config.id,
      event: payload
    });
  }

  private async processSalesforceWebhook(config: IntegrationConfig, payload: any): Promise<void> {
    this.emit('salesforce:event', {
      integrationId: config.id,
      event: payload
    });
  }

  private async processWorkdayWebhook(config: IntegrationConfig, payload: any): Promise<void> {
    this.emit('workday:event', {
      integrationId: config.id,
      event: payload
    });
  }

  private async processSAPWebhook(config: IntegrationConfig, payload: any): Promise<void> {
    this.emit('sap:event', {
      integrationId: config.id,
      event: payload
    });
  }

  private startHealthCheck(integrationId: string): void {
    if (this.healthCheckIntervals.has(integrationId)) {
      return;
    }

    const interval = setInterval(async () => {
      await this.performHealthCheck(integrationId);
    }, this.HEALTH_CHECK_INTERVAL);

    this.healthCheckIntervals.set(integrationId, interval);
  }

  private stopHealthCheck(integrationId: string): void {
    const interval = this.healthCheckIntervals.get(integrationId);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(integrationId);
    }
  }

  public async performHealthCheck(integrationId: string): Promise<IntegrationHealth> {
    const config = this.integrations.get(integrationId);
    if (!config) {
      throw new Error('Integration not found');
    }

    const startTime = Date.now();
    const issues: string[] = [];
    let status = IntegrationStatus.ACTIVE;

    try {
      const client = this.httpClients.get(integrationId);
      if (!client) {
        throw new Error('HTTP client not initialized');
      }

      const healthEndpoint = this.getHealthCheckEndpoint(config.type);
      await client.get(healthEndpoint);

      if (config.credentials.tokenExpiry && new Date() >= config.credentials.tokenExpiry) {
        issues.push('Access token expired');
      }

      const errorRate = config.metadata.errorCount /
        (config.metadata.errorCount + config.metadata.successCount || 1);

      if (errorRate > 0.1) {
        issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
      }

    } catch (error) {
      status = IntegrationStatus.ERROR;
      issues.push(`Health check failed: ${error}`);
    }

    const responseTime = Date.now() - startTime;
    const uptime = config.metadata.lastHealthCheck
      ? Date.now() - config.metadata.lastHealthCheck.getTime()
      : 0;

    const health: IntegrationHealth = {
      integrationId,
      status,
      lastCheck: new Date(),
      responseTime,
      errorRate: config.metadata.errorCount / (config.metadata.errorCount + config.metadata.successCount || 1),
      uptime,
      issues
    };

    await this.updateIntegration(integrationId, {
      status,
      metadata: {
        ...config.metadata,
        lastHealthCheck: new Date()
      }
    });

    this.emit('health:checked', health);
    return health;
  }

  private getOAuthConfig(type: IntegrationType): OAuthConfig {
    const configs: Record<IntegrationType, OAuthConfig> = {
      [IntegrationType.SLACK]: {
        authorizationUrl: 'https://slack.com/oauth/v2/authorize',
        tokenUrl: 'https://slack.com/api/oauth.v2.access',
        scopes: ['channels:read', 'chat:write', 'users:read'],
        redirectUri: `${process.env.API_URL}/integrations/slack/callback`
      },
      [IntegrationType.MICROSOFT_TEAMS]: {
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scopes: ['Team.ReadBasic.All', 'Channel.ReadBasic.All', 'ChatMessage.Send'],
        redirectUri: `${process.env.API_URL}/integrations/teams/callback`
      },
      [IntegrationType.SALESFORCE]: {
        authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
        tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
        scopes: ['api', 'refresh_token', 'offline_access'],
        redirectUri: `${process.env.API_URL}/integrations/salesforce/callback`
      },
      [IntegrationType.WORKDAY]: {
        authorizationUrl: 'https://wd2-impl-services1.workday.com/authorize',
        tokenUrl: 'https://wd2-impl-services1.workday.com/token',
        scopes: ['openid', 'profile'],
        redirectUri: `${process.env.API_URL}/integrations/workday/callback`
      },
      [IntegrationType.SAP_SUCCESSFACTORS]: {
        authorizationUrl: 'https://api.successfactors.com/oauth/authorize',
        tokenUrl: 'https://api.successfactors.com/oauth/token',
        scopes: ['user_api', 'company_api'],
        redirectUri: `${process.env.API_URL}/integrations/sap/callback`
      },
      [IntegrationType.GOOGLE_WORKSPACE]: {
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
        redirectUri: `${process.env.API_URL}/integrations/google/callback`
      },
      [IntegrationType.OKTA]: {
        authorizationUrl: 'https://dev-00000000.okta.com/oauth2/v1/authorize',
        tokenUrl: 'https://dev-00000000.okta.com/oauth2/v1/token',
        scopes: ['okta.users.read', 'okta.groups.read'],
        redirectUri: `${process.env.API_URL}/integrations/okta/callback`
      },
      [IntegrationType.AZURE_AD]: {
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scopes: ['User.Read.All', 'Group.Read.All'],
        redirectUri: `${process.env.API_URL}/integrations/azure/callback`
      }
    };

    return configs[type];
  }

  private getBaseUrl(config: IntegrationConfig): string {
    const urls: Record<IntegrationType, string> = {
      [IntegrationType.SLACK]: 'https://slack.com/api',
      [IntegrationType.MICROSOFT_TEAMS]: 'https://graph.microsoft.com/v1.0',
      [IntegrationType.SALESFORCE]: config.credentials.instanceUrl || 'https://api.salesforce.com',
      [IntegrationType.WORKDAY]: 'https://wd2-impl-services1.workday.com/ccx/api/v1',
      [IntegrationType.SAP_SUCCESSFACTORS]: 'https://api.successfactors.com/odata/v2',
      [IntegrationType.GOOGLE_WORKSPACE]: 'https://www.googleapis.com',
      [IntegrationType.OKTA]: 'https://dev-00000000.okta.com/api/v1',
      [IntegrationType.AZURE_AD]: 'https://graph.microsoft.com/v1.0'
    };

    return urls[config.type];
  }

  private getHealthCheckEndpoint(type: IntegrationType): string {
    const endpoints: Record<IntegrationType, string> = {
      [IntegrationType.SLACK]: '/auth.test',
      [IntegrationType.MICROSOFT_TEAMS]: '/me',
      [IntegrationType.SALESFORCE]: '/services/data/v52.0/limits',
      [IntegrationType.WORKDAY]: '/workers',
      [IntegrationType.SAP_SUCCESSFACTORS]: '/User',
      [IntegrationType.GOOGLE_WORKSPACE]: '/admin/directory/v1/users',
      [IntegrationType.OKTA]: '/users/me',
      [IntegrationType.AZURE_AD]: '/me'
    };

    return endpoints[type];
  }

  private getDefaultFieldMappings(type: IntegrationType): Record<string, string> {
    const mappings: Record<IntegrationType, Record<string, string>> = {
      [IntegrationType.SLACK]: {
        'user.email': 'profile.email',
        'user.name': 'profile.real_name',
        'user.avatar': 'profile.image_512'
      },
      [IntegrationType.MICROSOFT_TEAMS]: {
        'user.email': 'mail',
        'user.name': 'displayName',
        'user.avatar': 'photo'
      },
      [IntegrationType.SALESFORCE]: {
        'user.email': 'Email',
        'user.name': 'Name',
        'user.title': 'Title'
      },
      [IntegrationType.WORKDAY]: {
        'user.email': 'emailAddress',
        'user.name': 'legalName',
        'user.employeeId': 'employeeID'
      },
      [IntegrationType.SAP_SUCCESSFACTORS]: {
        'user.email': 'email',
        'user.name': 'defaultFullName',
        'user.employeeId': 'userId'
      },
      [IntegrationType.GOOGLE_WORKSPACE]: {
        'user.email': 'primaryEmail',
        'user.name': 'name.fullName',
        'user.avatar': 'thumbnailPhotoUrl'
      },
      [IntegrationType.OKTA]: {
        'user.email': 'profile.email',
        'user.name': 'profile.displayName',
        'user.status': 'status'
      },
      [IntegrationType.AZURE_AD]: {
        'user.email': 'mail',
        'user.name': 'displayName',
        'user.jobTitle': 'jobTitle'
      }
    };

    return mappings[type];
  }

  private async saveIntegrationToCache(config: IntegrationConfig): Promise<void> {
    await this.redis.set(
      `${this.CACHE_PREFIX}${config.id}`,
      JSON.stringify(config)
    );
  }

  public getIntegration(integrationId: string): IntegrationConfig | undefined {
    return this.integrations.get(integrationId);
  }

  public getIntegrationsByOrganization(organizationId: string): IntegrationConfig[] {
    return Array.from(this.integrations.values())
      .filter(config => config.organizationId === organizationId);
  }

  public getHttpClient(integrationId: string): AxiosInstance | undefined {
    return this.httpClients.get(integrationId);
  }

  public async shutdown(): Promise<void> {
    for (const integrationId of this.healthCheckIntervals.keys()) {
      this.stopHealthCheck(integrationId);
    }
    this.removeAllListeners();
    this.emit('hub:shutdown');
  }
}

export default EnterpriseIntegrationHub;
