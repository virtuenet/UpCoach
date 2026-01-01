import { EventEmitter } from 'events';
import crypto from 'crypto';
import { SAML, SamlConfig } from '@node-saml/node-saml';
import { Issuer, Client, generators, TokenSet } from 'openid-client';
import { Pool, PoolClient } from 'pg';
import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Enterprise SSO Service
 *
 * Complete enterprise Single Sign-On (SSO) service with:
 * - SAML 2.0 implementation with full Service Provider flow
 * - OAuth 2.0 / OIDC (OpenID Connect) implementation
 * - Support for major identity providers: Okta, Azure AD, Google Workspace, OneLogin, Auth0
 * - JIT (Just-In-Time) user provisioning
 * - SCIM 2.0 user provisioning and deprovisioning
 * - Group/role mapping from IdP to tenant roles
 * - Session management with SSO/SLO (Single Logout)
 * - Certificate management for SAML
 * - PostgreSQL schemas for SSO configurations
 * - Audit logging for all SSO events
 */

export interface SSOConfiguration {
  id: string;
  tenantId: string;
  provider: 'saml' | 'oidc' | 'okta' | 'azure-ad' | 'google-workspace' | 'onelogin' | 'auth0';
  enabled: boolean;
  name: string;

  samlConfig?: {
    entryPoint: string;
    issuer: string;
    callbackUrl: string;
    logoutUrl?: string;
    cert: string;
    privateKey?: string;
    signatureAlgorithm?: 'sha1' | 'sha256' | 'sha512';
    digestAlgorithm?: 'sha1' | 'sha256' | 'sha512';
    wantAssertionsSigned?: boolean;
    wantAuthnResponseSigned?: boolean;
  };

  oidcConfig?: {
    issuer: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    postLogoutRedirectUri?: string;
    scope: string[];
    responseType: string[];
    responseMode?: 'query' | 'fragment' | 'form_post';
  };

  attributeMapping: {
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    groups?: string;
    roles?: string;
    department?: string;
    employeeId?: string;
    phoneNumber?: string;
    jobTitle?: string;
  };

  jitProvisioning: {
    enabled: boolean;
    defaultRole: string;
    updateExistingUsers: boolean;
    createTeamFromGroups: boolean;
    deactivateOnRemoval: boolean;
  };

  scimConfig?: {
    enabled: boolean;
    endpoint: string;
    bearerToken: string;
    syncInterval: number;
  };

  roleMapping: Array<{
    idpRole: string;
    tenantRole: string;
  }>;

  sessionConfig: {
    timeout: number;
    maxConcurrentSessions: number;
    singleLogoutEnabled: boolean;
  };

  allowedDomains?: string[];
  requiredGroups?: string[];

  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
}

export interface SSOSession {
  id: string;
  userId: string;
  tenantId: string;
  configId: string;
  sessionIndex?: string;
  nameId?: string;
  idpSessionId?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: Date;
  attributes: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

export interface SSOUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  groups?: string[];
  roles?: string[];
  department?: string;
  employeeId?: string;
  phoneNumber?: string;
  jobTitle?: string;
  isActive: boolean;
  ssoProvider?: string;
  ssoSubject?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SCIMUser {
  schemas: string[];
  id: string;
  userName: string;
  name: {
    givenName?: string;
    familyName?: string;
    formatted?: string;
  };
  emails: Array<{
    value: string;
    primary?: boolean;
  }>;
  active: boolean;
  groups?: Array<{
    value: string;
    display?: string;
  }>;
  roles?: Array<{
    value: string;
    display?: string;
  }>;
  meta?: {
    resourceType: string;
    created: string;
    lastModified: string;
    location?: string;
  };
}

export interface SAMLAssertion {
  issuer: string;
  sessionIndex?: string;
  nameID: string;
  nameIDFormat: string;
  attributes: Record<string, any>;
  notBefore?: Date;
  notOnOrAfter?: Date;
  audience?: string;
  inResponseTo?: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  configId: string;
  eventType: 'login' | 'logout' | 'provisioning' | 'deprovisioning' | 'sync' | 'config_change' | 'error';
  eventStatus: 'success' | 'failure';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export class EnterpriseSSOService extends EventEmitter {
  private db: Pool;
  private samlProviders: Map<string, SAML> = new Map();
  private oidcClients: Map<string, Client> = new Map();
  private oidcIssuers: Map<string, Issuer> = new Map();
  private encryptionKey: Buffer;

  constructor(db: Pool) {
    super();
    this.db = db;

    const key = process.env.SSO_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.encryptionKey = Buffer.from(key, 'hex').slice(0, 32);

    this.initializeDatabase().catch(err => {
      logger.error('Failed to initialize SSO database', err);
    });
  }

  private async initializeDatabase(): Promise<void> {
    const client = await this.db.connect();

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS sso_configurations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          provider VARCHAR(50) NOT NULL,
          enabled BOOLEAN DEFAULT true,
          name VARCHAR(255) NOT NULL,
          saml_config JSONB,
          oidc_config JSONB,
          attribute_mapping JSONB NOT NULL,
          jit_provisioning JSONB NOT NULL,
          scim_config JSONB,
          role_mapping JSONB,
          session_config JSONB NOT NULL,
          allowed_domains TEXT[],
          required_groups TEXT[],
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          last_sync_at TIMESTAMP,
          UNIQUE(tenant_id, provider)
        );

        CREATE INDEX IF NOT EXISTS idx_sso_config_tenant ON sso_configurations(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_sso_config_enabled ON sso_configurations(enabled);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS sso_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          tenant_id UUID NOT NULL,
          config_id UUID NOT NULL REFERENCES sso_configurations(id) ON DELETE CASCADE,
          session_index VARCHAR(255),
          name_id VARCHAR(255),
          idp_session_id TEXT,
          access_token TEXT,
          refresh_token TEXT,
          id_token TEXT,
          expires_at TIMESTAMP NOT NULL,
          attributes JSONB,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, tenant_id, session_index)
        );

        CREATE INDEX IF NOT EXISTS idx_sso_sessions_user ON sso_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sso_sessions_tenant ON sso_sessions(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_sso_sessions_expires ON sso_sessions(expires_at);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS sso_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          email VARCHAR(255) NOT NULL,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          display_name VARCHAR(255),
          groups TEXT[],
          roles TEXT[],
          department VARCHAR(255),
          employee_id VARCHAR(100),
          phone_number VARCHAR(50),
          job_title VARCHAR(255),
          is_active BOOLEAN DEFAULT true,
          sso_provider VARCHAR(50),
          sso_subject VARCHAR(255),
          last_login_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(tenant_id, email)
        );

        CREATE INDEX IF NOT EXISTS idx_sso_users_tenant ON sso_users(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_sso_users_email ON sso_users(email);
        CREATE INDEX IF NOT EXISTS idx_sso_users_subject ON sso_users(sso_subject);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS sso_certificates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          config_id UUID NOT NULL REFERENCES sso_configurations(id) ON DELETE CASCADE,
          certificate TEXT NOT NULL,
          private_key TEXT,
          issuer VARCHAR(255),
          subject VARCHAR(255),
          valid_from TIMESTAMP NOT NULL,
          valid_to TIMESTAMP NOT NULL,
          fingerprint VARCHAR(255),
          is_current BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(config_id, fingerprint)
        );

        CREATE INDEX IF NOT EXISTS idx_sso_certs_config ON sso_certificates(config_id);
        CREATE INDEX IF NOT EXISTS idx_sso_certs_valid ON sso_certificates(valid_to);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS sso_audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          user_id UUID,
          config_id UUID REFERENCES sso_configurations(id) ON DELETE SET NULL,
          event_type VARCHAR(50) NOT NULL,
          event_status VARCHAR(20) NOT NULL,
          details JSONB,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_sso_audit_tenant ON sso_audit_logs(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_sso_audit_user ON sso_audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_sso_audit_type ON sso_audit_logs(event_type);
        CREATE INDEX IF NOT EXISTS idx_sso_audit_created ON sso_audit_logs(created_at);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS scim_sync_state (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          config_id UUID NOT NULL REFERENCES sso_configurations(id) ON DELETE CASCADE,
          resource_type VARCHAR(50) NOT NULL,
          external_id VARCHAR(255) NOT NULL,
          internal_id UUID NOT NULL,
          last_synced_at TIMESTAMP NOT NULL,
          sync_status VARCHAR(20),
          error_message TEXT,
          UNIQUE(config_id, resource_type, external_id)
        );

        CREATE INDEX IF NOT EXISTS idx_scim_sync_config ON scim_sync_state(config_id);
        CREATE INDEX IF NOT EXISTS idx_scim_sync_external ON scim_sync_state(external_id);
      `);

      logger.info('SSO database tables initialized successfully');
    } finally {
      client.release();
    }
  }

  async createSSOConfiguration(config: Omit<SSOConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<SSOConfiguration> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const encryptedSamlConfig = config.samlConfig ? {
        ...config.samlConfig,
        privateKey: config.samlConfig.privateKey ? this.encrypt(config.samlConfig.privateKey) : undefined,
      } : null;

      const encryptedOidcConfig = config.oidcConfig ? {
        ...config.oidcConfig,
        clientSecret: this.encrypt(config.oidcConfig.clientSecret),
      } : null;

      const encryptedScimConfig = config.scimConfig ? {
        ...config.scimConfig,
        bearerToken: this.encrypt(config.scimConfig.bearerToken),
      } : null;

      const result = await client.query<SSOConfiguration>(
        `INSERT INTO sso_configurations (
          tenant_id, provider, enabled, name, saml_config, oidc_config,
          attribute_mapping, jit_provisioning, scim_config, role_mapping,
          session_config, allowed_domains, required_groups
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          config.tenantId,
          config.provider,
          config.enabled,
          config.name,
          encryptedSamlConfig,
          encryptedOidcConfig,
          config.attributeMapping,
          config.jitProvisioning,
          encryptedScimConfig,
          config.roleMapping,
          config.sessionConfig,
          config.allowedDomains,
          config.requiredGroups,
        ]
      );

      await this.logAudit(client, {
        tenantId: config.tenantId,
        configId: result.rows[0].id,
        eventType: 'config_change',
        eventStatus: 'success',
        details: { action: 'create', provider: config.provider },
      });

      await client.query('COMMIT');

      const ssoConfig = this.mapRowToConfig(result.rows[0]);

      if (config.provider === 'saml' && config.samlConfig) {
        await this.initializeSAMLProvider(ssoConfig);
      } else if (config.oidcConfig) {
        await this.initializeOIDCClient(ssoConfig);
      }

      this.emit('config:created', ssoConfig);
      logger.info('SSO configuration created', { configId: ssoConfig.id, provider: config.provider });

      return ssoConfig;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create SSO configuration', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateSSOConfiguration(configId: string, updates: Partial<SSOConfiguration>): Promise<SSOConfiguration> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const existingConfig = await this.getSSOConfiguration(configId);
      if (!existingConfig) {
        throw new Error('SSO configuration not found');
      }

      const encryptedSamlConfig = updates.samlConfig ? {
        ...updates.samlConfig,
        privateKey: updates.samlConfig.privateKey ? this.encrypt(updates.samlConfig.privateKey) : undefined,
      } : undefined;

      const encryptedOidcConfig = updates.oidcConfig ? {
        ...updates.oidcConfig,
        clientSecret: this.encrypt(updates.oidcConfig.clientSecret),
      } : undefined;

      const encryptedScimConfig = updates.scimConfig ? {
        ...updates.scimConfig,
        bearerToken: this.encrypt(updates.scimConfig.bearerToken),
      } : undefined;

      const result = await client.query<SSOConfiguration>(
        `UPDATE sso_configurations SET
          enabled = COALESCE($1, enabled),
          name = COALESCE($2, name),
          saml_config = COALESCE($3, saml_config),
          oidc_config = COALESCE($4, oidc_config),
          attribute_mapping = COALESCE($5, attribute_mapping),
          jit_provisioning = COALESCE($6, jit_provisioning),
          scim_config = COALESCE($7, scim_config),
          role_mapping = COALESCE($8, role_mapping),
          session_config = COALESCE($9, session_config),
          allowed_domains = COALESCE($10, allowed_domains),
          required_groups = COALESCE($11, required_groups),
          updated_at = NOW()
        WHERE id = $12
        RETURNING *`,
        [
          updates.enabled,
          updates.name,
          encryptedSamlConfig,
          encryptedOidcConfig,
          updates.attributeMapping,
          updates.jitProvisioning,
          encryptedScimConfig,
          updates.roleMapping,
          updates.sessionConfig,
          updates.allowedDomains,
          updates.requiredGroups,
          configId,
        ]
      );

      await this.logAudit(client, {
        tenantId: existingConfig.tenantId,
        configId,
        eventType: 'config_change',
        eventStatus: 'success',
        details: { action: 'update', changes: Object.keys(updates) },
      });

      await client.query('COMMIT');

      this.samlProviders.delete(configId);
      this.oidcClients.delete(configId);
      this.oidcIssuers.delete(configId);

      const ssoConfig = this.mapRowToConfig(result.rows[0]);
      this.emit('config:updated', ssoConfig);
      logger.info('SSO configuration updated', { configId });

      return ssoConfig;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to update SSO configuration', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getSSOConfiguration(configId: string): Promise<SSOConfiguration | null> {
    const result = await this.db.query<any>(
      'SELECT * FROM sso_configurations WHERE id = $1',
      [configId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToConfig(result.rows[0]);
  }

  async getTenantSSOConfigurations(tenantId: string): Promise<SSOConfiguration[]> {
    const result = await this.db.query<any>(
      'SELECT * FROM sso_configurations WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );

    return result.rows.map(row => this.mapRowToConfig(row));
  }

  async initiateSAMLLogin(configId: string, relayState?: string): Promise<string> {
    const config = await this.getSSOConfiguration(configId);
    if (!config || !config.samlConfig) {
      throw new Error('SAML configuration not found');
    }

    const saml = await this.getSAMLProvider(config);
    const loginUrl = await saml.getAuthorizeUrlAsync(relayState || '', {}, {});

    await this.logAudit(null, {
      tenantId: config.tenantId,
      configId,
      eventType: 'login',
      eventStatus: 'success',
      details: { action: 'initiate', protocol: 'saml' },
    });

    logger.info('SAML login initiated', { configId, tenantId: config.tenantId });
    return loginUrl;
  }

  async handleSAMLCallback(
    configId: string,
    samlResponse: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ user: SSOUser; session: SSOSession }> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const config = await this.getSSOConfiguration(configId);
      if (!config || !config.samlConfig) {
        throw new Error('SAML configuration not found');
      }

      const saml = await this.getSAMLProvider(config);
      const profile = await saml.validatePostResponseAsync({ SAMLResponse: samlResponse });

      if (!profile) {
        throw new Error('Invalid SAML response');
      }

      const assertion = this.extractSAMLAttributes(profile, config.attributeMapping);

      if (config.allowedDomains && config.allowedDomains.length > 0) {
        const emailDomain = assertion.attributes.email?.split('@')[1];
        if (!emailDomain || !config.allowedDomains.includes(emailDomain)) {
          throw new Error('Email domain not allowed');
        }
      }

      if (config.requiredGroups && config.requiredGroups.length > 0) {
        const userGroups = assertion.attributes.groups || [];
        const hasRequiredGroup = config.requiredGroups.some(rg => userGroups.includes(rg));
        if (!hasRequiredGroup) {
          throw new Error('User does not belong to required groups');
        }
      }

      let user = await this.findUserByEmail(config.tenantId, assertion.attributes.email);

      if (!user && config.jitProvisioning.enabled) {
        user = await this.provisionUser(client, config, assertion.attributes);
      } else if (!user) {
        throw new Error('User not found and JIT provisioning is disabled');
      } else if (config.jitProvisioning.updateExistingUsers) {
        user = await this.updateUser(client, user.id, assertion.attributes, config);
      }

      const session = await this.createSession(client, {
        userId: user.id,
        tenantId: config.tenantId,
        configId,
        sessionIndex: assertion.sessionIndex,
        nameId: assertion.nameID,
        attributes: assertion.attributes,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + config.sessionConfig.timeout * 1000),
      });

      await this.enforceSessionLimits(client, user.id, config.tenantId, config.sessionConfig.maxConcurrentSessions);

      await client.query(
        'UPDATE sso_users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      await this.logAudit(client, {
        tenantId: config.tenantId,
        userId: user.id,
        configId,
        eventType: 'login',
        eventStatus: 'success',
        details: { protocol: 'saml', email: user.email },
        ipAddress,
        userAgent,
      });

      await client.query('COMMIT');

      this.emit('login:success', { user, session, config });
      logger.info('SAML login successful', { userId: user.id, email: user.email });

      return { user, session };
    } catch (error) {
      await client.query('ROLLBACK');

      const config = await this.getSSOConfiguration(configId);
      if (config) {
        await this.logAudit(null, {
          tenantId: config.tenantId,
          configId,
          eventType: 'login',
          eventStatus: 'failure',
          details: { protocol: 'saml', error: error instanceof Error ? error.message : 'Unknown error' },
          ipAddress,
          userAgent,
        });
      }

      logger.error('SAML login failed', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async initiateOIDCLogin(configId: string, state?: string, nonce?: string): Promise<{ url: string; state: string; nonce: string; codeVerifier: string }> {
    const config = await this.getSSOConfiguration(configId);
    if (!config || !config.oidcConfig) {
      throw new Error('OIDC configuration not found');
    }

    const client = await this.getOIDCClient(config);

    const actualState = state || generators.state();
    const actualNonce = nonce || generators.nonce();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    const url = client.authorizationUrl({
      redirect_uri: config.oidcConfig.redirectUri,
      scope: config.oidcConfig.scope.join(' '),
      response_type: config.oidcConfig.responseType.join(' '),
      response_mode: config.oidcConfig.responseMode,
      state: actualState,
      nonce: actualNonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    await this.logAudit(null, {
      tenantId: config.tenantId,
      configId,
      eventType: 'login',
      eventStatus: 'success',
      details: { action: 'initiate', protocol: 'oidc' },
    });

    logger.info('OIDC login initiated', { configId, tenantId: config.tenantId });

    return { url, state: actualState, nonce: actualNonce, codeVerifier };
  }

  async handleOIDCCallback(
    configId: string,
    code: string,
    codeVerifier: string,
    nonce: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ user: SSOUser; session: SSOSession }> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const config = await this.getSSOConfiguration(configId);
      if (!config || !config.oidcConfig) {
        throw new Error('OIDC configuration not found');
      }

      const oidcClient = await this.getOIDCClient(config);

      const tokenSet = await oidcClient.callback(
        config.oidcConfig.redirectUri,
        { code },
        { code_verifier: codeVerifier, nonce }
      );

      const claims = tokenSet.claims();
      const userInfo = await oidcClient.userinfo(tokenSet.access_token!);

      const attributes = this.extractOIDCAttributes({ ...claims, ...userInfo }, config.attributeMapping);

      if (config.allowedDomains && config.allowedDomains.length > 0) {
        const emailDomain = attributes.email?.split('@')[1];
        if (!emailDomain || !config.allowedDomains.includes(emailDomain)) {
          throw new Error('Email domain not allowed');
        }
      }

      if (config.requiredGroups && config.requiredGroups.length > 0) {
        const userGroups = attributes.groups || [];
        const hasRequiredGroup = config.requiredGroups.some(rg => userGroups.includes(rg));
        if (!hasRequiredGroup) {
          throw new Error('User does not belong to required groups');
        }
      }

      let user = await this.findUserByEmail(config.tenantId, attributes.email);

      if (!user && config.jitProvisioning.enabled) {
        user = await this.provisionUser(client, config, attributes);
      } else if (!user) {
        throw new Error('User not found and JIT provisioning is disabled');
      } else if (config.jitProvisioning.updateExistingUsers) {
        user = await this.updateUser(client, user.id, attributes, config);
      }

      const session = await this.createSession(client, {
        userId: user.id,
        tenantId: config.tenantId,
        configId,
        idpSessionId: tokenSet.id_token,
        accessToken: this.encrypt(tokenSet.access_token || ''),
        refreshToken: tokenSet.refresh_token ? this.encrypt(tokenSet.refresh_token) : undefined,
        idToken: this.encrypt(tokenSet.id_token || ''),
        attributes,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + config.sessionConfig.timeout * 1000),
      });

      await this.enforceSessionLimits(client, user.id, config.tenantId, config.sessionConfig.maxConcurrentSessions);

      await client.query(
        'UPDATE sso_users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      await this.logAudit(client, {
        tenantId: config.tenantId,
        userId: user.id,
        configId,
        eventType: 'login',
        eventStatus: 'success',
        details: { protocol: 'oidc', email: user.email },
        ipAddress,
        userAgent,
      });

      await client.query('COMMIT');

      this.emit('login:success', { user, session, config });
      logger.info('OIDC login successful', { userId: user.id, email: user.email });

      return { user, session };
    } catch (error) {
      await client.query('ROLLBACK');

      const config = await this.getSSOConfiguration(configId);
      if (config) {
        await this.logAudit(null, {
          tenantId: config.tenantId,
          configId,
          eventType: 'login',
          eventStatus: 'failure',
          details: { protocol: 'oidc', error: error instanceof Error ? error.message : 'Unknown error' },
          ipAddress,
          userAgent,
        });
      }

      logger.error('OIDC login failed', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async initiateSingleLogout(sessionId: string): Promise<{ logoutUrl?: string; success: boolean }> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const sessionResult = await client.query<any>(
        `SELECT s.*, c.* FROM sso_sessions s
         JOIN sso_configurations c ON s.config_id = c.id
         WHERE s.id = $1`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        return { success: false };
      }

      const sessionRow = sessionResult.rows[0];
      const config = this.mapRowToConfig(sessionRow);

      await client.query(
        'UPDATE sso_sessions SET expires_at = NOW() WHERE id = $1',
        [sessionId]
      );

      await this.logAudit(client, {
        tenantId: config.tenantId,
        userId: sessionRow.user_id,
        configId: config.id,
        eventType: 'logout',
        eventStatus: 'success',
        details: { protocol: config.provider },
      });

      await client.query('COMMIT');

      let logoutUrl: string | undefined;

      if (config.provider === 'saml' && config.samlConfig && config.sessionConfig.singleLogoutEnabled) {
        const saml = await this.getSAMLProvider(config);
        if (sessionRow.name_id && sessionRow.session_index) {
          logoutUrl = await saml.getLogoutUrlAsync(
            { nameID: sessionRow.name_id, sessionIndex: sessionRow.session_index },
            {},
            {}
          );
        }
      } else if (config.oidcConfig && config.sessionConfig.singleLogoutEnabled) {
        const oidcClient = await this.getOIDCClient(config);
        if (sessionRow.id_token && oidcClient.issuer.metadata.end_session_endpoint) {
          logoutUrl = oidcClient.endSessionUrl({
            id_token_hint: this.decrypt(sessionRow.id_token),
            post_logout_redirect_uri: config.oidcConfig.postLogoutRedirectUri,
          });
        }
      }

      this.emit('logout:success', { sessionId, config });
      logger.info('Single logout successful', { sessionId, tenantId: config.tenantId });

      return { logoutUrl, success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Single logout failed', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async handleSCIMUserCreate(configId: string, scimUser: SCIMUser): Promise<SSOUser> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const config = await this.getSSOConfiguration(configId);
      if (!config || !config.scimConfig?.enabled) {
        throw new Error('SCIM not enabled for this configuration');
      }

      const attributes = {
        email: scimUser.emails[0]?.value || scimUser.userName,
        firstName: scimUser.name?.givenName,
        lastName: scimUser.name?.familyName,
        displayName: scimUser.name?.formatted,
        groups: scimUser.groups?.map(g => g.value),
        roles: scimUser.roles?.map(r => r.value),
      };

      const user = await this.provisionUser(client, config, attributes);

      await client.query(
        `INSERT INTO scim_sync_state (config_id, resource_type, external_id, internal_id, last_synced_at, sync_status)
         VALUES ($1, 'user', $2, $3, NOW(), 'success')`,
        [configId, scimUser.id, user.id]
      );

      await this.logAudit(client, {
        tenantId: config.tenantId,
        userId: user.id,
        configId,
        eventType: 'provisioning',
        eventStatus: 'success',
        details: { protocol: 'scim', action: 'create', email: user.email },
      });

      await client.query('COMMIT');

      this.emit('scim:user:created', { user, config });
      logger.info('SCIM user created', { userId: user.id, email: user.email });

      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('SCIM user creation failed', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async handleSCIMUserUpdate(configId: string, externalId: string, scimUser: Partial<SCIMUser>): Promise<SSOUser> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const config = await this.getSSOConfiguration(configId);
      if (!config || !config.scimConfig?.enabled) {
        throw new Error('SCIM not enabled for this configuration');
      }

      const syncResult = await client.query<any>(
        'SELECT internal_id FROM scim_sync_state WHERE config_id = $1 AND external_id = $2',
        [configId, externalId]
      );

      if (syncResult.rows.length === 0) {
        throw new Error('User not found in SCIM sync state');
      }

      const userId = syncResult.rows[0].internal_id;

      const attributes = {
        email: scimUser.emails?.[0]?.value,
        firstName: scimUser.name?.givenName,
        lastName: scimUser.name?.familyName,
        displayName: scimUser.name?.formatted,
        groups: scimUser.groups?.map(g => g.value),
        roles: scimUser.roles?.map(r => r.value),
      };

      const user = await this.updateUser(client, userId, attributes, config);

      await client.query(
        `UPDATE scim_sync_state SET last_synced_at = NOW(), sync_status = 'success'
         WHERE config_id = $1 AND external_id = $2`,
        [configId, externalId]
      );

      await this.logAudit(client, {
        tenantId: config.tenantId,
        userId: user.id,
        configId,
        eventType: 'provisioning',
        eventStatus: 'success',
        details: { protocol: 'scim', action: 'update', email: user.email },
      });

      await client.query('COMMIT');

      this.emit('scim:user:updated', { user, config });
      logger.info('SCIM user updated', { userId: user.id, email: user.email });

      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('SCIM user update failed', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async handleSCIMUserDelete(configId: string, externalId: string): Promise<void> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const config = await this.getSSOConfiguration(configId);
      if (!config || !config.scimConfig?.enabled) {
        throw new Error('SCIM not enabled for this configuration');
      }

      const syncResult = await client.query<any>(
        'SELECT internal_id FROM scim_sync_state WHERE config_id = $1 AND external_id = $2',
        [configId, externalId]
      );

      if (syncResult.rows.length === 0) {
        throw new Error('User not found in SCIM sync state');
      }

      const userId = syncResult.rows[0].internal_id;

      if (config.jitProvisioning.deactivateOnRemoval) {
        await client.query(
          'UPDATE sso_users SET is_active = false WHERE id = $1',
          [userId]
        );
      } else {
        await client.query('DELETE FROM sso_users WHERE id = $1', [userId]);
      }

      await client.query(
        'DELETE FROM scim_sync_state WHERE config_id = $1 AND external_id = $2',
        [configId, externalId]
      );

      await this.logAudit(client, {
        tenantId: config.tenantId,
        userId,
        configId,
        eventType: 'deprovisioning',
        eventStatus: 'success',
        details: { protocol: 'scim', action: 'delete', deactivated: config.jitProvisioning.deactivateOnRemoval },
      });

      await client.query('COMMIT');

      this.emit('scim:user:deleted', { userId, config });
      logger.info('SCIM user deleted', { userId });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('SCIM user deletion failed', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.db.query(
      'DELETE FROM sso_sessions WHERE expires_at < NOW() RETURNING id'
    );

    const count = result.rowCount || 0;
    if (count > 0) {
      logger.info('Cleaned up expired SSO sessions', { count });
      this.emit('sessions:cleanup', { count });
    }

    return count;
  }

  async getAuditLogs(
    tenantId: string,
    filters?: {
      userId?: string;
      configId?: string;
      eventType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<AuditLog[]> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters?.userId) {
      conditions.push(`user_id = $${paramIndex}`);
      params.push(filters.userId);
      paramIndex++;
    }

    if (filters?.configId) {
      conditions.push(`config_id = $${paramIndex}`);
      params.push(filters.configId);
      paramIndex++;
    }

    if (filters?.eventType) {
      conditions.push(`event_type = $${paramIndex}`);
      params.push(filters.eventType);
      paramIndex++;
    }

    if (filters?.startDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(filters.endDate);
      paramIndex++;
    }

    const query = `
      SELECT * FROM sso_audit_logs
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(filters?.limit || 100, filters?.offset || 0);

    const result = await this.db.query<any>(query, params);

    return result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      configId: row.config_id,
      eventType: row.event_type,
      eventStatus: row.event_status,
      details: row.details,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
    }));
  }

  private async getSAMLProvider(config: SSOConfiguration): Promise<SAML> {
    if (!this.samlProviders.has(config.id)) {
      await this.initializeSAMLProvider(config);
    }

    return this.samlProviders.get(config.id)!;
  }

  private async initializeSAMLProvider(config: SSOConfiguration): Promise<void> {
    if (!config.samlConfig) {
      throw new Error('SAML configuration is missing');
    }

    const samlConfig: SamlConfig = {
      callbackUrl: config.samlConfig.callbackUrl,
      entryPoint: config.samlConfig.entryPoint,
      issuer: config.samlConfig.issuer,
      cert: config.samlConfig.cert,
      privateKey: config.samlConfig.privateKey ? this.decrypt(config.samlConfig.privateKey) : undefined,
      signatureAlgorithm: config.samlConfig.signatureAlgorithm || 'sha256',
      digestAlgorithm: config.samlConfig.digestAlgorithm || 'sha256',
      wantAssertionsSigned: config.samlConfig.wantAssertionsSigned ?? true,
      wantAuthnResponseSigned: config.samlConfig.wantAuthnResponseSigned ?? true,
      acceptedClockSkewMs: 5000,
    };

    const saml = new SAML(samlConfig);
    this.samlProviders.set(config.id, saml);
  }

  private async getOIDCClient(config: SSOConfiguration): Promise<Client> {
    if (!this.oidcClients.has(config.id)) {
      await this.initializeOIDCClient(config);
    }

    return this.oidcClients.get(config.id)!;
  }

  private async initializeOIDCClient(config: SSOConfiguration): Promise<void> {
    if (!config.oidcConfig) {
      throw new Error('OIDC configuration is missing');
    }

    let issuer: Issuer;

    if (this.oidcIssuers.has(config.id)) {
      issuer = this.oidcIssuers.get(config.id)!;
    } else {
      issuer = await Issuer.discover(config.oidcConfig.issuer);
      this.oidcIssuers.set(config.id, issuer);
    }

    const client = new issuer.Client({
      client_id: config.oidcConfig.clientId,
      client_secret: this.decrypt(config.oidcConfig.clientSecret),
      redirect_uris: [config.oidcConfig.redirectUri],
      response_types: config.oidcConfig.responseType,
      token_endpoint_auth_method: 'client_secret_post',
    });

    this.oidcClients.set(config.id, client);
  }

  private extractSAMLAttributes(profile: any, mapping: SSOConfiguration['attributeMapping']): SAMLAssertion {
    const attributes: Record<string, any> = {};

    for (const [key, samlKey] of Object.entries(mapping)) {
      if (samlKey && profile[samlKey]) {
        attributes[key] = Array.isArray(profile[samlKey]) ? profile[samlKey][0] : profile[samlKey];
      }
    }

    return {
      issuer: profile.issuer,
      sessionIndex: profile.sessionIndex,
      nameID: profile.nameID,
      nameIDFormat: profile.nameIDFormat,
      attributes,
      notBefore: profile.notBefore ? new Date(profile.notBefore) : undefined,
      notOnOrAfter: profile.notOnOrAfter ? new Date(profile.notOnOrAfter) : undefined,
      audience: profile.audience,
      inResponseTo: profile.inResponseTo,
    };
  }

  private extractOIDCAttributes(claims: any, mapping: SSOConfiguration['attributeMapping']): Record<string, any> {
    const attributes: Record<string, any> = {};

    for (const [key, claimKey] of Object.entries(mapping)) {
      if (claimKey && claims[claimKey]) {
        attributes[key] = claims[claimKey];
      }
    }

    return attributes;
  }

  private async findUserByEmail(tenantId: string, email: string): Promise<SSOUser | null> {
    const result = await this.db.query<any>(
      'SELECT * FROM sso_users WHERE tenant_id = $1 AND email = $2',
      [tenantId, email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  private async provisionUser(
    client: PoolClient,
    config: SSOConfiguration,
    attributes: Record<string, any>
  ): Promise<SSOUser> {
    const roles = this.mapRoles(attributes.roles || attributes.groups || [], config.roleMapping);
    const finalRole = roles.length > 0 ? roles[0] : config.jitProvisioning.defaultRole;

    const result = await client.query<any>(
      `INSERT INTO sso_users (
        tenant_id, email, first_name, last_name, display_name, groups, roles,
        department, employee_id, phone_number, job_title, sso_provider, sso_subject, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
      RETURNING *`,
      [
        config.tenantId,
        attributes.email,
        attributes.firstName,
        attributes.lastName,
        attributes.displayName,
        attributes.groups || [],
        [finalRole],
        attributes.department,
        attributes.employeeId,
        attributes.phoneNumber,
        attributes.jobTitle,
        config.provider,
        attributes.sub || attributes.nameID,
      ]
    );

    return this.mapRowToUser(result.rows[0]);
  }

  private async updateUser(
    client: PoolClient,
    userId: string,
    attributes: Record<string, any>,
    config: SSOConfiguration
  ): Promise<SSOUser> {
    const roles = this.mapRoles(attributes.roles || attributes.groups || [], config.roleMapping);

    const result = await client.query<any>(
      `UPDATE sso_users SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        display_name = COALESCE($3, display_name),
        groups = COALESCE($4, groups),
        roles = COALESCE($5, roles),
        department = COALESCE($6, department),
        employee_id = COALESCE($7, employee_id),
        phone_number = COALESCE($8, phone_number),
        job_title = COALESCE($9, job_title),
        updated_at = NOW()
      WHERE id = $10
      RETURNING *`,
      [
        attributes.firstName,
        attributes.lastName,
        attributes.displayName,
        attributes.groups,
        roles.length > 0 ? roles : undefined,
        attributes.department,
        attributes.employeeId,
        attributes.phoneNumber,
        attributes.jobTitle,
        userId,
      ]
    );

    return this.mapRowToUser(result.rows[0]);
  }

  private async createSession(
    client: PoolClient,
    sessionData: Omit<SSOSession, 'id' | 'createdAt'>
  ): Promise<SSOSession> {
    const result = await client.query<any>(
      `INSERT INTO sso_sessions (
        user_id, tenant_id, config_id, session_index, name_id, idp_session_id,
        access_token, refresh_token, id_token, expires_at, attributes, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        sessionData.userId,
        sessionData.tenantId,
        sessionData.configId,
        sessionData.sessionIndex,
        sessionData.nameId,
        sessionData.idpSessionId,
        sessionData.accessToken,
        sessionData.refreshToken,
        sessionData.idToken,
        sessionData.expiresAt,
        sessionData.attributes,
        sessionData.ipAddress,
        sessionData.userAgent,
      ]
    );

    return this.mapRowToSession(result.rows[0]);
  }

  private async enforceSessionLimits(
    client: PoolClient,
    userId: string,
    tenantId: string,
    maxSessions: number
  ): Promise<void> {
    const result = await client.query<any>(
      `SELECT id FROM sso_sessions
       WHERE user_id = $1 AND tenant_id = $2 AND expires_at > NOW()
       ORDER BY created_at DESC
       OFFSET $3`,
      [userId, tenantId, maxSessions]
    );

    if (result.rows.length > 0) {
      const sessionIds = result.rows.map(row => row.id);
      await client.query(
        'UPDATE sso_sessions SET expires_at = NOW() WHERE id = ANY($1)',
        [sessionIds]
      );

      logger.info('Enforced session limits', { userId, expiredSessions: sessionIds.length });
    }
  }

  private mapRoles(idpRoles: string[], roleMapping: SSOConfiguration['roleMapping']): string[] {
    const mappedRoles: string[] = [];

    for (const idpRole of idpRoles) {
      const mapping = roleMapping.find(m => m.idpRole === idpRole);
      if (mapping) {
        mappedRoles.push(mapping.tenantRole);
      }
    }

    return mappedRoles;
  }

  private async logAudit(
    client: PoolClient | null,
    log: Omit<AuditLog, 'id' | 'createdAt'>
  ): Promise<void> {
    const query = `
      INSERT INTO sso_audit_logs (tenant_id, user_id, config_id, event_type, event_status, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    const params = [
      log.tenantId,
      log.userId,
      log.configId,
      log.eventType,
      log.eventStatus,
      log.details,
      log.ipAddress,
      log.userAgent,
    ];

    if (client) {
      await client.query(query, params);
    } else {
      await this.db.query(query, params);
    }
  }

  private mapRowToConfig(row: any): SSOConfiguration {
    const samlConfig = row.saml_config ? {
      ...row.saml_config,
      privateKey: row.saml_config.privateKey ? this.decrypt(row.saml_config.privateKey) : undefined,
    } : undefined;

    const oidcConfig = row.oidc_config ? {
      ...row.oidc_config,
      clientSecret: this.decrypt(row.oidc_config.clientSecret),
    } : undefined;

    const scimConfig = row.scim_config ? {
      ...row.scim_config,
      bearerToken: this.decrypt(row.scim_config.bearerToken),
    } : undefined;

    return {
      id: row.id,
      tenantId: row.tenant_id,
      provider: row.provider,
      enabled: row.enabled,
      name: row.name,
      samlConfig,
      oidcConfig,
      attributeMapping: row.attribute_mapping,
      jitProvisioning: row.jit_provisioning,
      scimConfig,
      roleMapping: row.role_mapping || [],
      sessionConfig: row.session_config,
      allowedDomains: row.allowed_domains,
      requiredGroups: row.required_groups,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastSyncAt: row.last_sync_at,
    };
  }

  private mapRowToUser(row: any): SSOUser {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      displayName: row.display_name,
      groups: row.groups,
      roles: row.roles,
      department: row.department,
      employeeId: row.employee_id,
      phoneNumber: row.phone_number,
      jobTitle: row.job_title,
      isActive: row.is_active,
      ssoProvider: row.sso_provider,
      ssoSubject: row.sso_subject,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToSession(row: any): SSOSession {
    return {
      id: row.id,
      userId: row.user_id,
      tenantId: row.tenant_id,
      configId: row.config_id,
      sessionIndex: row.session_index,
      nameId: row.name_id,
      idpSessionId: row.idp_session_id,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      idToken: row.id_token,
      expiresAt: row.expires_at,
      attributes: row.attributes,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
    };
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
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

export default EnterpriseSSOService;
