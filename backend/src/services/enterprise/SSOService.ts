import { Request, Response } from 'express';
import { sequelize } from '../../models';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { SAML } from '@node-saml/node-saml';
// @ts-ignore - openid-client types may not be available
import { Issuer, generators } from 'openid-client';
import { sessionStore } from './SessionStore';

export interface SSOConfiguration {
  id: number;
  organizationId: number;
  provider: 'saml' | 'oidc' | 'google' | 'microsoft' | 'okta';
  enabled: boolean;
  samlIdpUrl?: string;
  samlIdpCert?: string;
  samlSpCert?: string;
  samlSpKey?: string;
  samlMetadataUrl?: string;
  oidcIssuerUrl?: string;
  oidcClientId?: string;
  oidcClientSecret?: string;
  oidcRedirectUri?: string;
  oidcScopes?: string[];
  attributeMapping?: any;
  autoProvisionUsers?: boolean;
  defaultRole?: string;
  allowedDomains?: string[];
}

export interface SSOUserAttributes {
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  employeeId?: string;
  department?: string;
  groups?: string[];
}

export class SSOService {
  private samlProviders: Map<number, SAML> = new Map();
  private oidcClients: Map<number, any> = new Map();

  async createSSOConfiguration(
    organizationId: number,
    config: Partial<SSOConfiguration>
  ): Promise<number> {
    const transaction = await sequelize.transaction();

    try {
      // Validate configuration based on provider
      this.validateSSOConfig(config);

      // Encrypt sensitive data
      const encryptedConfig = {
        ...config,
        saml_sp_key: config.samlSpKey ? this.encrypt(config.samlSpKey) : null,
        oidc_client_secret: config.oidcClientSecret ? this.encrypt(config.oidcClientSecret) : null,
      };

      const [result] = await sequelize.query(
        `INSERT INTO sso_configurations 
         (organization_id, provider, enabled, saml_idp_url, saml_idp_cert, 
          saml_sp_cert, saml_sp_key, saml_metadata_url, oidc_issuer_url, 
          oidc_client_id, oidc_client_secret, oidc_redirect_uri, oidc_scopes,
          attribute_mapping, auto_provision_users, default_role, allowed_domains)
         VALUES (:organizationId, :provider, :enabled, :samlIdpUrl, :samlIdpCert,
          :samlSpCert, :samlSpKey, :samlMetadataUrl, :oidcIssuerUrl,
          :oidcClientId, :oidcClientSecret, :oidcRedirectUri, :oidcScopes,
          :attributeMapping, :autoProvisionUsers, :defaultRole, :allowedDomains)
         RETURNING id`,
        {
          replacements: {
            organizationId,
            provider: config.provider,
            enabled: config.enabled || false,
            samlIdpUrl: config.samlIdpUrl,
            samlIdpCert: config.samlIdpCert,
            samlSpCert: config.samlSpCert,
            samlSpKey: encryptedConfig.saml_sp_key,
            samlMetadataUrl: config.samlMetadataUrl,
            oidcIssuerUrl: config.oidcIssuerUrl,
            oidcClientId: config.oidcClientId,
            oidcClientSecret: encryptedConfig.oidc_client_secret,
            oidcRedirectUri: config.oidcRedirectUri,
            oidcScopes: config.oidcScopes,
            attributeMapping: JSON.stringify(config.attributeMapping || {}),
            autoProvisionUsers: config.autoProvisionUsers ?? true,
            defaultRole: config.defaultRole || 'member',
            allowedDomains: config.allowedDomains,
          },
          transaction,
        }
      );

      await transaction.commit();

      const configId = (result[0] as any).id;

      // Initialize provider
      await this.initializeProvider(configId);

      logger.info('SSO configuration created', {
        organizationId,
        configId,
        provider: config.provider,
      });

      return configId;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create SSO configuration', error);
      throw error;
    }
  }

  async initiateSAMLLogin(configId: number): Promise<string> {
    const saml = await this.getSAMLProvider(configId);
    
    const loginUrl = await saml.getAuthorizeUrlAsync('', '', '');
    
    logger.info('SAML login initiated', { configId });
    
    return loginUrl;
  }

  async handleSAMLCallback(
    configId: number,
    samlResponse: string
  ): Promise<{ user: User; sessionId: string }> {
    const transaction = await sequelize.transaction();

    try {
      const saml = await this.getSAMLProvider(configId);
      const profile = await saml.validatePostResponseAsync({ SAMLResponse: samlResponse });

      if (!profile) {
        throw new AppError('Invalid SAML response', 400);
      }

      // Get SSO config
      const [configs] = await sequelize.query(
        `SELECT * FROM sso_configurations WHERE id = :configId`,
        { replacements: { configId } }
      );

      const config = configs[0] as any;

      // Extract user attributes
      const attributes = this.extractSAMLAttributes(profile, config.attribute_mapping);

      // Check allowed domains
      if (config.allowed_domains && config.allowed_domains.length > 0) {
        const emailDomain = attributes.email.split('@')[1];
        if (!config.allowed_domains.includes(emailDomain)) {
          throw new AppError('Email domain not allowed', 403);
        }
      }

      // Find or create user
      let user = await User.findOne({ where: { email: attributes.email } });

      if (!user && config.auto_provision_users) {
        user = await this.provisionUser(
          config.organization_id,
          attributes,
          config.default_role,
          transaction
        );
      } else if (!user) {
        throw new AppError('User not found and auto-provisioning is disabled', 404);
      }

      // Create SSO session
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8); // 8 hour session

      await sequelize.query(
        `INSERT INTO sso_sessions 
         (user_id, organization_id, sso_configuration_id, session_id, 
          idp_session_id, attributes, expires_at)
         VALUES (:userId, :organizationId, :configId, :sessionId, 
          :idpSessionId, :attributes, :expiresAt)`,
        {
          replacements: {
            userId: user.id,
            organizationId: config.organization_id,
            configId,
            sessionId,
            idpSessionId: (profile as any).sessionIndex,
            attributes: JSON.stringify(attributes),
            expiresAt,
          },
          transaction,
        }
      );

      await transaction.commit();

      logger.info('SAML login successful', {
        userId: user.id,
        organizationId: config.organization_id,
        email: attributes.email,
      });

      return { user, sessionId };
    } catch (error) {
      await transaction.rollback();
      logger.error('SAML callback failed', error);
      throw error;
    }
  }

  async initiateOIDCLogin(configId: number): Promise<string> {
    const client = await this.getOIDCClient(configId);
    
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    
    // Get redirect URI from config
    const [configs] = await sequelize.query(
      `SELECT oidc_redirect_uri FROM sso_configurations WHERE id = :configId`,
      { replacements: { configId } }
    );
    
    const redirectUri = (configs[0] as any).oidc_redirect_uri;
    
    // Create session with code verifier
    const state = await sessionStore.createSession(configId, redirectUri);
    
    // Store code verifier in session
    const session = await sessionStore.getSession(state);
    if (session) {
      session.codeVerifier = codeVerifier;
      await sessionStore.createSession(configId, redirectUri); // Re-save with verifier
    }
    
    const authUrl = client.authorizationUrl({
      scope: 'openid email profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      redirect_uri: redirectUri,
    });
    
    logger.info('OIDC login initiated', { configId, state });
    
    return authUrl;
  }

  async handleOIDCCallback(
    configId: number,
    code: string,
    codeVerifier: string
  ): Promise<{ user: User; sessionId: string }> {
    const transaction = await sequelize.transaction();

    try {
      const client = await this.getOIDCClient(configId);
      
      // Exchange code for tokens
      const tokenSet = await client.callback(
        undefined,
        { code },
        { code_verifier: codeVerifier }
      );

      // Get user info
      const userinfo = await client.userinfo(tokenSet.access_token);

      // Get SSO config
      const [configs] = await sequelize.query(
        `SELECT * FROM sso_configurations WHERE id = :configId`,
        { replacements: { configId } }
      );

      const config = configs[0] as any;

      // Extract user attributes
      const attributes: SSOUserAttributes = {
        email: userinfo.email,
        firstName: userinfo.given_name,
        lastName: userinfo.family_name,
        fullName: userinfo.name,
      };

      // Check allowed domains
      if (config.allowed_domains && config.allowed_domains.length > 0) {
        const emailDomain = attributes.email.split('@')[1];
        if (!config.allowed_domains.includes(emailDomain)) {
          throw new AppError('Email domain not allowed', 403);
        }
      }

      // Find or create user
      let user = await User.findOne({ where: { email: attributes.email } });

      if (!user && config.auto_provision_users) {
        user = await this.provisionUser(
          config.organization_id,
          attributes,
          config.default_role,
          transaction
        );
      } else if (!user) {
        throw new AppError('User not found and auto-provisioning is disabled', 404);
      }

      // Create SSO session
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8);

      await sequelize.query(
        `INSERT INTO sso_sessions 
         (user_id, organization_id, sso_configuration_id, session_id, 
          idp_session_id, attributes, expires_at)
         VALUES (:userId, :organizationId, :configId, :sessionId, 
          :idpSessionId, :attributes, :expiresAt)`,
        {
          replacements: {
            userId: user.id,
            organizationId: config.organization_id,
            configId,
            sessionId,
            idpSessionId: tokenSet.id_token,
            attributes: JSON.stringify(attributes),
            expiresAt,
          },
          transaction,
        }
      );

      await transaction.commit();

      logger.info('OIDC login successful', {
        userId: user.id,
        organizationId: config.organization_id,
        email: attributes.email,
      });

      return { user, sessionId };
    } catch (error) {
      await transaction.rollback();
      logger.error('OIDC callback failed', error);
      throw error;
    }
  }

  async initiateSSOLogout(sessionId: string): Promise<string | null> {
    const [sessions] = await sequelize.query(
      `SELECT s.*, c.provider, c.saml_idp_url
       FROM sso_sessions s
       JOIN sso_configurations c ON s.sso_configuration_id = c.id
       WHERE s.session_id = :sessionId`,
      { replacements: { sessionId } }
    );

    if (sessions.length === 0) {
      return null;
    }

    const session = sessions[0] as any;

    // Mark session as expired
    await sequelize.query(
      `UPDATE sso_sessions SET expires_at = NOW() WHERE session_id = :sessionId`,
      { replacements: { sessionId } }
    );

    // Return logout URL based on provider
    if (session.provider === 'saml') {
      const saml = await this.getSAMLProvider(session.sso_configuration_id);
      // @ts-ignore - method name may vary
      if (saml.getLogoutUrlAsync) {
        return await saml.getLogoutUrlAsync({ nameID: session.idp_session_id });
      } else if (saml.getLogoutUrl) {
        return await saml.getLogoutUrl({ nameID: session.idp_session_id });
      }
      return null;
    }

    // For OIDC, return end session endpoint
    if (session.provider === 'oidc') {
      const client = await this.getOIDCClient(session.sso_configuration_id);
      if (client.endSessionUrl) {
        return client.endSessionUrl({
          id_token_hint: session.idp_session_id,
          post_logout_redirect_uri: `${process.env.FRONTEND_URL}/logout-complete`,
        });
      }
    }

    return null;
  }

  private async provisionUser(
    organizationId: number,
    attributes: SSOUserAttributes,
    defaultRole: string,
    transaction: any
  ): Promise<User> {
    // Create user
    const user = await User.create({
      email: attributes.email,
      name: attributes.fullName || `${attributes.firstName} ${attributes.lastName}` || attributes.email,
      password: 'sso-user-no-password', // SSO users don't need passwords
      emailVerified: true, // SSO users are pre-verified
    }, { transaction });

    // Add to organization
    await sequelize.query(
      `INSERT INTO organization_members 
       (organization_id, user_id, role, employee_id, department)
       VALUES (:organizationId, :userId, :role, :employeeId, :department)`,
      {
        replacements: {
          organizationId,
          userId: user.id,
          role: defaultRole,
          employeeId: attributes.employeeId,
          department: attributes.department,
        },
        transaction,
      }
    );

    // Add to default team
    const [teams] = await sequelize.query(
      `SELECT id FROM teams 
       WHERE organization_id = :organizationId 
       AND settings->>'isDefault' = 'true'`,
      {
        replacements: { organizationId },
        transaction,
      }
    );

    if (teams.length > 0) {
      await sequelize.query(
        `INSERT INTO team_members (team_id, user_id, role)
         VALUES (:teamId, :userId, 'member')`,
        {
          replacements: {
            teamId: (teams[0] as any).id,
            userId: user.id,
          },
          transaction,
        }
      );
    }

    logger.info('User provisioned via SSO', {
      userId: user.id,
      email: user.email,
      organizationId,
    });

    return user;
  }

  private async getSAMLProvider(configId: number): Promise<SAML> {
    if (!this.samlProviders.has(configId)) {
      const [configs] = await sequelize.query(
        `SELECT * FROM sso_configurations WHERE id = :configId`,
        { replacements: { configId } }
      );

      if (configs.length === 0) {
        throw new AppError('SSO configuration not found', 404);
      }

      const config = configs[0] as any;

      const saml = new SAML({
        callbackUrl: `${process.env.BASE_URL}/api/sso/saml/callback/${configId}`,
        entryPoint: config.saml_idp_url,
        issuer: `${process.env.BASE_URL}/saml/${config.organization_id}`,
        // @ts-ignore - cert/idpCert compatibility
        cert: config.saml_idp_cert,
        idpCert: config.saml_idp_cert,
        privateKey: this.decrypt(config.saml_sp_key),
        signatureAlgorithm: 'sha256',
        authnRequestBinding: 'HTTP-POST',
      });

      this.samlProviders.set(configId, saml);
    }

    return this.samlProviders.get(configId)!;
  }

  private async getOIDCClient(configId: number): Promise<any> {
    if (!this.oidcClients.has(configId)) {
      const [configs] = await sequelize.query(
        `SELECT * FROM sso_configurations WHERE id = :configId`,
        { replacements: { configId } }
      );

      if (configs.length === 0) {
        throw new AppError('SSO configuration not found', 404);
      }

      const config = configs[0] as any;

      const issuer = await Issuer.discover(config.oidc_issuer_url);
      const client = new issuer.Client({
        client_id: config.oidc_client_id,
        client_secret: this.decrypt(config.oidc_client_secret),
        redirect_uris: [config.oidc_redirect_uri],
        response_types: ['code'],
      });

      this.oidcClients.set(configId, client);
    }

    return this.oidcClients.get(configId)!;
  }

  private async initializeProvider(configId: number): Promise<void> {
    const [configs] = await sequelize.query(
      `SELECT provider FROM sso_configurations WHERE id = :configId`,
      { replacements: { configId } }
    );

    if (configs.length > 0) {
      const provider = (configs[0] as any).provider;
      if (provider === 'saml') {
        await this.getSAMLProvider(configId);
      } else if (provider === 'oidc') {
        await this.getOIDCClient(configId);
      }
    }
  }

  private validateSSOConfig(config: Partial<SSOConfiguration>): void {
    if (!config.provider) {
      throw new AppError('SSO provider is required', 400);
    }

    switch (config.provider) {
      case 'saml':
        if (!config.samlIdpUrl || !config.samlIdpCert) {
          throw new AppError('SAML IdP URL and certificate are required', 400);
        }
        break;
      case 'oidc':
        if (!config.oidcIssuerUrl || !config.oidcClientId || !config.oidcClientSecret) {
          throw new AppError('OIDC issuer URL, client ID, and secret are required', 400);
        }
        break;
    }
  }

  private extractSAMLAttributes(profile: any, mapping: any): SSOUserAttributes {
    const defaultMapping = {
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      employeeId: 'employeeId',
      department: 'department',
    };

    const actualMapping = { ...defaultMapping, ...mapping };
    const attributes: any = {};

    for (const [key, samlKey] of Object.entries(actualMapping)) {
      attributes[key] = profile[samlKey as string];
    }

    // Ensure email is present
    if (!attributes.email) {
      throw new AppError('Email attribute not found in SAML response', 400);
    }

    return attributes;
  }

  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async getOrganizationSSOProviders(organizationId: number): Promise<any[]> {
    const [providers] = await sequelize.query(
      `SELECT 
        id,
        provider,
        enabled,
        allowed_domains,
        auto_provision_users,
        default_role,
        created_at,
        updated_at
       FROM sso_configurations
       WHERE organization_id = :organizationId`,
      {
        replacements: { organizationId },
      }
    );

    return providers as any[];
  }

  async updateSSOConfiguration(
    configId: number,
    updates: Partial<SSOConfiguration>
  ): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      // Validate updates
      if (updates.provider) {
        throw new AppError('Cannot change SSO provider type', 400);
      }

      // Encrypt sensitive data if provided
      const encryptedUpdates: any = { ...updates };
      if (updates.samlSpKey) {
        encryptedUpdates.saml_sp_key = this.encrypt(updates.samlSpKey);
        delete encryptedUpdates.samlSpKey;
      }
      if (updates.oidcClientSecret) {
        encryptedUpdates.oidc_client_secret = this.encrypt(updates.oidcClientSecret);
        delete encryptedUpdates.oidcClientSecret;
      }

      // Build update query
      const updateFields = Object.keys(encryptedUpdates)
        .map(key => `${this.camelToSnake(key)} = :${key}`)
        .join(', ');

      await sequelize.query(
        `UPDATE sso_configurations
         SET ${updateFields}, updated_at = NOW()
         WHERE id = :configId`,
        {
          replacements: { ...encryptedUpdates, configId },
          transaction,
        }
      );

      await transaction.commit();

      // Clear cached provider
      this.samlProviders.delete(configId);
      this.oidcClients.delete(configId);

      logger.info('SSO configuration updated', { configId });
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to update SSO configuration', error);
      throw error;
    }
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}