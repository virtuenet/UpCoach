/**
 * OAuth Flow Manager
 *
 * Complete OAuth 2.0 flow management with support for multiple providers,
 * PKCE, token refresh, and secure credential storage.
 *
 * Features:
 * - OAuth 2.0 authorization code flow
 * - PKCE (Proof Key for Code Exchange) support
 * - State parameter generation and validation
 * - Token exchange (code for access token)
 * - Automatic token refresh with retry logic
 * - Encrypted token storage in Redis
 * - Multiple provider support (Google, Microsoft, Slack, etc.)
 * - Scope management
 * - Callback URL handling
 * - Comprehensive error handling
 * - Event-driven architecture
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import crypto from 'crypto';
import axios, { AxiosError } from 'axios';

export interface OAuthProvider {
  id: string;
  name: string;
  authorizationUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  userInfoUrl?: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUri: string;
  pkceEnabled: boolean;
  tokenEndpointAuthMethod?: 'client_secret_post' | 'client_secret_basic';
  grantType?: string;
  responseType?: string;
}

export interface OAuthState {
  state: string;
  provider: string;
  organizationId: string;
  userId: string;
  codeVerifier?: string;
  createdAt: Date;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date;
  scope?: string;
  idToken?: string;
}

export interface OAuthSession {
  id: string;
  provider: string;
  organizationId: string;
  userId: string;
  tokens: OAuthTokens;
  createdAt: Date;
  updatedAt: Date;
  lastRefreshedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AuthorizationUrlParams {
  provider: string;
  organizationId: string;
  userId: string;
  scopes?: string[];
  metadata?: Record<string, any>;
}

export interface TokenExchangeParams {
  provider: string;
  code: string;
  state: string;
}

export interface TokenRefreshParams {
  sessionId: string;
}

export interface OAuthError {
  error: string;
  errorDescription?: string;
  errorUri?: string;
  state?: string;
}

export class OAuthFlowManager extends EventEmitter {
  private redis: Redis;
  private providers: Map<string, OAuthProvider>;
  private encryptionKey: Buffer;
  private readonly STATE_TTL = 600; // 10 minutes
  private readonly SESSION_TTL = 86400 * 365; // 1 year

  constructor() {
    super();

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 11, // OAuth DB
    });

    this.providers = new Map();
    this.encryptionKey = Buffer.from(
      process.env.OAUTH_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
      'hex'
    );

    this.initializeProviders();
  }

  /**
   * Initialize OAuth providers
   */
  private initializeProviders(): void {
    const providers: OAuthProvider[] = [
      {
        id: 'google',
        name: 'Google',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        revokeUrl: 'https://oauth2.googleapis.com/revoke',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        scopes: ['openid', 'email', 'profile'],
        redirectUri: `${process.env.APP_URL}/oauth/callback/google`,
        pkceEnabled: true,
        tokenEndpointAuthMethod: 'client_secret_post',
        grantType: 'authorization_code',
        responseType: 'code',
      },
      {
        id: 'microsoft',
        name: 'Microsoft',
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
        clientId: process.env.MICROSOFT_CLIENT_ID || '',
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
        scopes: ['openid', 'email', 'profile', 'User.Read'],
        redirectUri: `${process.env.APP_URL}/oauth/callback/microsoft`,
        pkceEnabled: true,
        tokenEndpointAuthMethod: 'client_secret_post',
        grantType: 'authorization_code',
        responseType: 'code',
      },
      {
        id: 'slack',
        name: 'Slack',
        authorizationUrl: 'https://slack.com/oauth/v2/authorize',
        tokenUrl: 'https://slack.com/api/oauth.v2.access',
        revokeUrl: 'https://slack.com/api/auth.revoke',
        userInfoUrl: 'https://slack.com/api/users.identity',
        clientId: process.env.SLACK_CLIENT_ID || '',
        clientSecret: process.env.SLACK_CLIENT_SECRET || '',
        scopes: ['chat:write', 'channels:read', 'users:read'],
        redirectUri: `${process.env.APP_URL}/oauth/callback/slack`,
        pkceEnabled: false,
        tokenEndpointAuthMethod: 'client_secret_post',
        grantType: 'authorization_code',
        responseType: 'code',
      },
      {
        id: 'github',
        name: 'GitHub',
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        scopes: ['user', 'repo'],
        redirectUri: `${process.env.APP_URL}/oauth/callback/github`,
        pkceEnabled: false,
        tokenEndpointAuthMethod: 'client_secret_post',
        grantType: 'authorization_code',
        responseType: 'code',
      },
      {
        id: 'salesforce',
        name: 'Salesforce',
        authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
        tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
        revokeUrl: 'https://login.salesforce.com/services/oauth2/revoke',
        userInfoUrl: 'https://login.salesforce.com/services/oauth2/userinfo',
        clientId: process.env.SALESFORCE_CLIENT_ID || '',
        clientSecret: process.env.SALESFORCE_CLIENT_SECRET || '',
        scopes: ['api', 'refresh_token', 'full'],
        redirectUri: `${process.env.APP_URL}/oauth/callback/salesforce`,
        pkceEnabled: false,
        tokenEndpointAuthMethod: 'client_secret_post',
        grantType: 'authorization_code',
        responseType: 'code',
      },
      {
        id: 'hubspot',
        name: 'HubSpot',
        authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
        tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
        clientId: process.env.HUBSPOT_CLIENT_ID || '',
        clientSecret: process.env.HUBSPOT_CLIENT_SECRET || '',
        scopes: ['crm.objects.contacts.write', 'crm.objects.deals.read'],
        redirectUri: `${process.env.APP_URL}/oauth/callback/hubspot`,
        pkceEnabled: false,
        tokenEndpointAuthMethod: 'client_secret_post',
        grantType: 'authorization_code',
        responseType: 'code',
      },
      {
        id: 'zoom',
        name: 'Zoom',
        authorizationUrl: 'https://zoom.us/oauth/authorize',
        tokenUrl: 'https://zoom.us/oauth/token',
        revokeUrl: 'https://zoom.us/oauth/revoke',
        clientId: process.env.ZOOM_CLIENT_ID || '',
        clientSecret: process.env.ZOOM_CLIENT_SECRET || '',
        scopes: ['meeting:write', 'meeting:read', 'user:read'],
        redirectUri: `${process.env.APP_URL}/oauth/callback/zoom`,
        pkceEnabled: false,
        tokenEndpointAuthMethod: 'client_secret_basic',
        grantType: 'authorization_code',
        responseType: 'code',
      },
      {
        id: 'dropbox',
        name: 'Dropbox',
        authorizationUrl: 'https://www.dropbox.com/oauth2/authorize',
        tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
        revokeUrl: 'https://api.dropboxapi.com/2/auth/token/revoke',
        clientId: process.env.DROPBOX_CLIENT_ID || '',
        clientSecret: process.env.DROPBOX_CLIENT_SECRET || '',
        scopes: ['files.content.write', 'files.content.read'],
        redirectUri: `${process.env.APP_URL}/oauth/callback/dropbox`,
        pkceEnabled: true,
        tokenEndpointAuthMethod: 'client_secret_post',
        grantType: 'authorization_code',
        responseType: 'code',
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        userInfoUrl: 'https://api.linkedin.com/v2/me',
        clientId: process.env.LINKEDIN_CLIENT_ID || '',
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
        scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
        redirectUri: `${process.env.APP_URL}/oauth/callback/linkedin`,
        pkceEnabled: false,
        tokenEndpointAuthMethod: 'client_secret_post',
        grantType: 'authorization_code',
        responseType: 'code',
      },
      {
        id: 'shopify',
        name: 'Shopify',
        authorizationUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
        tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
        clientId: process.env.SHOPIFY_CLIENT_ID || '',
        clientSecret: process.env.SHOPIFY_CLIENT_SECRET || '',
        scopes: ['read_products', 'write_products', 'read_orders'],
        redirectUri: `${process.env.APP_URL}/oauth/callback/shopify`,
        pkceEnabled: false,
        tokenEndpointAuthMethod: 'client_secret_post',
        grantType: 'authorization_code',
        responseType: 'code',
      },
    ];

    providers.forEach(provider => {
      this.providers.set(provider.id, provider);
    });

    this.emit('providers:initialized', { count: providers.length });
  }

  /**
   * Get authorization URL
   */
  async getAuthorizationUrl(params: AuthorizationUrlParams): Promise<string> {
    const provider = this.providers.get(params.provider);
    if (!provider) {
      throw new Error(`Provider not found: ${params.provider}`);
    }

    const state = this.generateState();
    const stateData: OAuthState = {
      state,
      provider: params.provider,
      organizationId: params.organizationId,
      userId: params.userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.STATE_TTL * 1000),
      metadata: params.metadata,
    };

    let codeVerifier: string | undefined;
    let codeChallenge: string | undefined;

    if (provider.pkceEnabled) {
      codeVerifier = this.generateCodeVerifier();
      codeChallenge = this.generateCodeChallenge(codeVerifier);
      stateData.codeVerifier = codeVerifier;
    }

    await this.saveState(state, stateData);

    const scopes = params.scopes || provider.scopes;
    const authParams = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: provider.redirectUri,
      response_type: provider.responseType || 'code',
      scope: scopes.join(' '),
      state,
    });

    if (codeChallenge) {
      authParams.append('code_challenge', codeChallenge);
      authParams.append('code_challenge_method', 'S256');
    }

    const url = `${provider.authorizationUrl}?${authParams.toString()}`;

    this.emit('authorization:url_generated', {
      provider: params.provider,
      organizationId: params.organizationId,
      userId: params.userId,
    });

    return url;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(params: TokenExchangeParams): Promise<OAuthSession> {
    const stateData = await this.getState(params.state);
    if (!stateData) {
      throw new Error('Invalid or expired state parameter');
    }

    if (stateData.provider !== params.provider) {
      throw new Error('Provider mismatch');
    }

    const provider = this.providers.get(params.provider);
    if (!provider) {
      throw new Error(`Provider not found: ${params.provider}`);
    }

    try {
      const tokenParams: Record<string, string> = {
        grant_type: provider.grantType || 'authorization_code',
        code: params.code,
        redirect_uri: provider.redirectUri,
      };

      if (provider.pkceEnabled && stateData.codeVerifier) {
        tokenParams.code_verifier = stateData.codeVerifier;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      };

      if (provider.tokenEndpointAuthMethod === 'client_secret_basic') {
        const credentials = Buffer.from(
          `${provider.clientId}:${provider.clientSecret}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      } else {
        tokenParams.client_id = provider.clientId;
        tokenParams.client_secret = provider.clientSecret;
      }

      const response = await axios.post(
        provider.tokenUrl,
        new URLSearchParams(tokenParams),
        { headers }
      );

      const tokens = this.normalizeTokenResponse(response.data);
      const session = await this.createSession(
        provider.id,
        stateData.organizationId,
        stateData.userId,
        tokens,
        stateData.metadata
      );

      await this.deleteState(params.state);

      this.emit('tokens:exchanged', {
        provider: params.provider,
        organizationId: stateData.organizationId,
        userId: stateData.userId,
        sessionId: session.id,
      });

      return session;
    } catch (error) {
      this.emit('tokens:exchange_failed', {
        provider: params.provider,
        error: this.normalizeOAuthError(error),
      });
      throw this.normalizeOAuthError(error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(params: TokenRefreshParams): Promise<OAuthSession> {
    const session = await this.getSession(params.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.tokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    const provider = this.providers.get(session.provider);
    if (!provider) {
      throw new Error(`Provider not found: ${session.provider}`);
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const tokenParams: Record<string, string> = {
          grant_type: 'refresh_token',
          refresh_token: session.tokens.refreshToken,
        };

        const headers: Record<string, string> = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        };

        if (provider.tokenEndpointAuthMethod === 'client_secret_basic') {
          const credentials = Buffer.from(
            `${provider.clientId}:${provider.clientSecret}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        } else {
          tokenParams.client_id = provider.clientId;
          tokenParams.client_secret = provider.clientSecret;
        }

        const response = await axios.post(
          provider.tokenUrl,
          new URLSearchParams(tokenParams),
          { headers }
        );

        const newTokens = this.normalizeTokenResponse(response.data);

        if (!newTokens.refreshToken && session.tokens.refreshToken) {
          newTokens.refreshToken = session.tokens.refreshToken;
        }

        session.tokens = newTokens;
        session.updatedAt = new Date();
        session.lastRefreshedAt = new Date();

        await this.saveSession(session);

        this.emit('tokens:refreshed', {
          provider: session.provider,
          organizationId: session.organizationId,
          userId: session.userId,
          sessionId: session.id,
          attempt,
        });

        return session;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await this.delay(delay);
        }
      }
    }

    this.emit('tokens:refresh_failed', {
      provider: session.provider,
      sessionId: session.id,
      error: lastError,
    });

    throw lastError || new Error('Token refresh failed after retries');
  }

  /**
   * Revoke tokens
   */
  async revokeTokens(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const provider = this.providers.get(session.provider);
    if (!provider || !provider.revokeUrl) {
      await this.deleteSession(sessionId);
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      const params = new URLSearchParams({
        token: session.tokens.accessToken,
      });

      if (provider.tokenEndpointAuthMethod === 'client_secret_basic') {
        const credentials = Buffer.from(
          `${provider.clientId}:${provider.clientSecret}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      } else {
        params.append('client_id', provider.clientId);
        params.append('client_secret', provider.clientSecret);
      }

      await axios.post(provider.revokeUrl, params, { headers });

      await this.deleteSession(sessionId);

      this.emit('tokens:revoked', {
        provider: session.provider,
        sessionId,
      });
    } catch (error) {
      await this.deleteSession(sessionId);

      this.emit('tokens:revoke_failed', {
        provider: session.provider,
        sessionId,
        error,
      });
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(organizationId: string, userId: string): Promise<OAuthSession[]> {
    const sessionIds = await this.redis.smembers(
      `oauth:sessions:${organizationId}:${userId}`
    );

    const sessions: OAuthSession[] = [];
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Get session by provider
   */
  async getSessionByProvider(
    organizationId: string,
    userId: string,
    provider: string
  ): Promise<OAuthSession | null> {
    const sessions = await this.getUserSessions(organizationId, userId);
    return sessions.find(s => s.provider === provider) || null;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(session: OAuthSession, bufferSeconds = 300): boolean {
    const expiresAt = new Date(session.tokens.expiresAt);
    const bufferTime = new Date(Date.now() + bufferSeconds * 1000);
    return expiresAt <= bufferTime;
  }

  /**
   * Ensure valid token (refresh if needed)
   */
  async ensureValidToken(sessionId: string): Promise<OAuthSession> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (this.isTokenExpired(session)) {
      return await this.refreshToken({ sessionId });
    }

    return session;
  }

  /**
   * Create session
   */
  private async createSession(
    provider: string,
    organizationId: string,
    userId: string,
    tokens: OAuthTokens,
    metadata?: Record<string, any>
  ): Promise<OAuthSession> {
    const session: OAuthSession = {
      id: this.generateSessionId(),
      provider,
      organizationId,
      userId,
      tokens,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata,
    };

    await this.saveSession(session);

    return session;
  }

  /**
   * Save session to Redis
   */
  private async saveSession(session: OAuthSession): Promise<void> {
    const encrypted = this.encryptTokens(session.tokens);
    const sessionData = { ...session, tokens: encrypted };

    await this.redis.set(
      `oauth:session:${session.id}`,
      JSON.stringify(sessionData),
      'EX',
      this.SESSION_TTL
    );

    await this.redis.sadd(
      `oauth:sessions:${session.organizationId}:${session.userId}`,
      session.id
    );
  }

  /**
   * Get session from Redis
   */
  private async getSession(sessionId: string): Promise<OAuthSession | null> {
    const data = await this.redis.get(`oauth:session:${sessionId}`);
    if (!data) return null;

    const session = JSON.parse(data);
    session.tokens = this.decryptTokens(session.tokens);

    session.createdAt = new Date(session.createdAt);
    session.updatedAt = new Date(session.updatedAt);
    if (session.lastRefreshedAt) {
      session.lastRefreshedAt = new Date(session.lastRefreshedAt);
    }
    session.tokens.expiresAt = new Date(session.tokens.expiresAt);

    return session;
  }

  /**
   * Delete session from Redis
   */
  private async deleteSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      await this.redis.del(`oauth:session:${sessionId}`);
      await this.redis.srem(
        `oauth:sessions:${session.organizationId}:${session.userId}`,
        sessionId
      );
    }
  }

  /**
   * Save state to Redis
   */
  private async saveState(state: string, data: OAuthState): Promise<void> {
    await this.redis.set(
      `oauth:state:${state}`,
      JSON.stringify(data),
      'EX',
      this.STATE_TTL
    );
  }

  /**
   * Get state from Redis
   */
  private async getState(state: string): Promise<OAuthState | null> {
    const data = await this.redis.get(`oauth:state:${state}`);
    if (!data) return null;

    const stateData = JSON.parse(data);
    stateData.createdAt = new Date(stateData.createdAt);
    stateData.expiresAt = new Date(stateData.expiresAt);

    return stateData;
  }

  /**
   * Delete state from Redis
   */
  private async deleteState(state: string): Promise<void> {
    await this.redis.del(`oauth:state:${state}`);
  }

  /**
   * Normalize token response
   */
  private normalizeTokenResponse(data: any): OAuthTokens {
    const expiresIn = parseInt(data.expires_in || data.expiresIn || '3600', 10);

    return {
      accessToken: data.access_token || data.accessToken,
      refreshToken: data.refresh_token || data.refreshToken,
      tokenType: data.token_type || data.tokenType || 'Bearer',
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      scope: data.scope,
      idToken: data.id_token || data.idToken,
    };
  }

  /**
   * Encrypt tokens
   */
  private encryptTokens(tokens: OAuthTokens): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    let encrypted = cipher.update(JSON.stringify(tokens), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      data: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    });
  }

  /**
   * Decrypt tokens
   */
  private decryptTokens(encrypted: string): OAuthTokens {
    const { data, iv, authTag } = JSON.parse(encrypted);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /**
   * Generate state parameter
   */
  private generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate code verifier (PKCE)
   */
  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate code challenge (PKCE)
   */
  private generateCodeChallenge(verifier: string): string {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `oauth_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Normalize OAuth error
   */
  private normalizeOAuthError(error: any): Error {
    if (error.isAxiosError) {
      const axiosError = error as AxiosError;
      const data = axiosError.response?.data as any;

      if (data?.error) {
        const message = data.error_description || data.error;
        return new Error(`OAuth Error: ${message}`);
      }

      return new Error(`OAuth Request Failed: ${axiosError.message}`);
    }

    return error;
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    await this.redis.quit();
    this.removeAllListeners();
  }
}

export default OAuthFlowManager;
