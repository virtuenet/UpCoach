"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSOService = void 0;
const tslib_1 = require("tslib");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const node_saml_1 = require("@node-saml/node-saml");
const openidClient = require('openid-client');
const { Issuer } = openidClient;
const models_1 = require("../../models");
const User_1 = require("../../models/User");
const errors_1 = require("../../utils/errors");
const logger_1 = require("../../utils/logger");
const SessionStore_1 = require("./SessionStore");
class SSOService {
    samlProviders = new Map();
    oidcClients = new Map();
    async createSSOConfiguration(organizationId, config) {
        const transaction = await models_1.sequelize.transaction();
        try {
            this.validateSSOConfig(config);
            const encryptedConfig = {
                ...config,
                saml_sp_key: config.samlSpKey ? this.encrypt(config.samlSpKey) : null,
                oidc_client_secret: config.oidcClientSecret ? this.encrypt(config.oidcClientSecret) : null,
            };
            const [result] = await models_1.sequelize.query(`INSERT INTO sso_configurations 
         (organization_id, provider, enabled, saml_idp_url, saml_idp_cert, 
          saml_sp_cert, saml_sp_key, saml_metadata_url, oidc_issuer_url, 
          oidc_client_id, oidc_client_secret, oidc_redirect_uri, oidc_scopes,
          attribute_mapping, auto_provision_users, default_role, allowed_domains)
         VALUES (:organizationId, :provider, :enabled, :samlIdpUrl, :samlIdpCert,
          :samlSpCert, :samlSpKey, :samlMetadataUrl, :oidcIssuerUrl,
          :oidcClientId, :oidcClientSecret, :oidcRedirectUri, :oidcScopes,
          :attributeMapping, :autoProvisionUsers, :defaultRole, :allowedDomains)
         RETURNING id`, {
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
            });
            await transaction.commit();
            const configId = result[0].id;
            await this.initializeProvider(configId);
            logger_1.logger.info('SSO configuration created', {
                organizationId,
                configId,
                provider: config.provider,
            });
            return configId;
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('Failed to create SSO configuration', error);
            throw error;
        }
    }
    async initiateSAMLLogin(configId) {
        const saml = await this.getSAMLProvider(configId);
        const loginUrl = await saml.getAuthorizeUrlAsync('', {}, {});
        logger_1.logger.info('SAML login initiated', { configId });
        return loginUrl;
    }
    async handleSAMLCallback(configId, samlResponse) {
        const transaction = await models_1.sequelize.transaction();
        try {
            const saml = await this.getSAMLProvider(configId);
            const profile = await saml.validatePostResponseAsync({ SAMLResponse: samlResponse });
            if (!profile) {
                throw new errors_1.AppError('Invalid SAML response', 400);
            }
            const [configs] = await models_1.sequelize.query(`SELECT * FROM sso_configurations WHERE id = :configId`, { replacements: { configId } });
            const config = configs[0];
            const attributes = this.extractSAMLAttributes(profile, config.attribute_mapping);
            if (config.allowed_domains && config.allowed_domains.length > 0) {
                const emailDomain = attributes.email.split('@')[1];
                if (!config.allowed_domains.includes(emailDomain)) {
                    throw new errors_1.AppError('Email domain not allowed', 403);
                }
            }
            let user = await User_1.User.findOne({ where: { email: attributes.email } });
            if (!user && config.auto_provision_users) {
                user = await this.provisionUser(config.organization_id, attributes, config.default_role, transaction);
            }
            else if (!user) {
                throw new errors_1.AppError('User not found and auto-provisioning is disabled', 404);
            }
            const sessionId = crypto_1.default.randomUUID();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 8);
            await models_1.sequelize.query(`INSERT INTO sso_sessions 
         (user_id, organization_id, sso_configuration_id, session_id, 
          idp_session_id, attributes, expires_at)
         VALUES (:userId, :organizationId, :configId, :sessionId, 
          :idpSessionId, :attributes, :expiresAt)`, {
                replacements: {
                    userId: user.id,
                    organizationId: config.organization_id,
                    configId,
                    sessionId,
                    idpSessionId: profile.sessionIndex,
                    attributes: JSON.stringify(attributes),
                    expiresAt,
                },
                transaction,
            });
            await transaction.commit();
            logger_1.logger.info('SAML login successful', {
                userId: user.id,
                organizationId: config.organization_id,
                email: attributes.email,
            });
            return { user, sessionId };
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('SAML callback failed', error);
            throw error;
        }
    }
    async initiateOIDCLogin(configId) {
        const client = await this.getOIDCClient(configId);
        const codeVerifier = crypto_1.default.randomBytes(32).toString('base64url');
        const codeChallenge = crypto_1.default.createHash('sha256').update(codeVerifier).digest('base64url');
        const [configs] = await models_1.sequelize.query(`SELECT oidc_redirect_uri FROM sso_configurations WHERE id = :configId`, { replacements: { configId } });
        const redirectUri = configs[0].oidc_redirect_uri;
        const state = await SessionStore_1.sessionStore.createSession(configId, redirectUri);
        const session = await SessionStore_1.sessionStore.getSession(state);
        if (session) {
            session.codeVerifier = codeVerifier;
            await SessionStore_1.sessionStore.createSession(configId, redirectUri);
        }
        const authUrl = client.authorizationUrl({
            scope: 'openid email profile',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            state,
            redirect_uri: redirectUri,
        });
        logger_1.logger.info('OIDC login initiated', { configId, state });
        return authUrl;
    }
    async handleOIDCCallback(configId, code, codeVerifier) {
        const transaction = await models_1.sequelize.transaction();
        try {
            const client = await this.getOIDCClient(configId);
            const tokenSet = await client.callback(undefined, { code }, { code_verifier: codeVerifier });
            const userinfo = await client.userinfo(tokenSet.access_token);
            const [configs] = await models_1.sequelize.query(`SELECT * FROM sso_configurations WHERE id = :configId`, { replacements: { configId } });
            const config = configs[0];
            const attributes = {
                email: userinfo.email,
                firstName: userinfo.given_name,
                lastName: userinfo.family_name,
                fullName: userinfo.name,
            };
            if (config.allowed_domains && config.allowed_domains.length > 0) {
                const emailDomain = attributes.email.split('@')[1];
                if (!config.allowed_domains.includes(emailDomain)) {
                    throw new errors_1.AppError('Email domain not allowed', 403);
                }
            }
            let user = await User_1.User.findOne({ where: { email: attributes.email } });
            if (!user && config.auto_provision_users) {
                user = await this.provisionUser(config.organization_id, attributes, config.default_role, transaction);
            }
            else if (!user) {
                throw new errors_1.AppError('User not found and auto-provisioning is disabled', 404);
            }
            const sessionId = crypto_1.default.randomUUID();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 8);
            await models_1.sequelize.query(`INSERT INTO sso_sessions 
         (user_id, organization_id, sso_configuration_id, session_id, 
          idp_session_id, attributes, expires_at)
         VALUES (:userId, :organizationId, :configId, :sessionId, 
          :idpSessionId, :attributes, :expiresAt)`, {
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
            });
            await transaction.commit();
            logger_1.logger.info('OIDC login successful', {
                userId: user.id,
                organizationId: config.organization_id,
                email: attributes.email,
            });
            return { user, sessionId };
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('OIDC callback failed', error);
            throw error;
        }
    }
    async initiateSSOLogout(sessionId) {
        const [sessions] = await models_1.sequelize.query(`SELECT s.*, c.provider, c.saml_idp_url
       FROM sso_sessions s
       JOIN sso_configurations c ON s.sso_configuration_id = c.id
       WHERE s.session_id = :sessionId`, { replacements: { sessionId } });
        if (sessions.length === 0) {
            return null;
        }
        const session = sessions[0];
        await models_1.sequelize.query(`UPDATE sso_sessions SET expires_at = NOW() WHERE session_id = :sessionId`, { replacements: { sessionId } });
        if (session.provider === 'saml') {
            const saml = await this.getSAMLProvider(session.sso_configuration_id);
            if (saml.getLogoutUrlAsync) {
                return await saml.getLogoutUrlAsync(session.idp_session_id, {}, {});
            }
            else if (saml.getLogoutUrl) {
                return await saml.getLogoutUrl({ nameID: session.idp_session_id });
            }
            return null;
        }
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
    async provisionUser(organizationId, attributes, defaultRole, transaction) {
        const user = await User_1.User.create({
            email: attributes.email,
            name: attributes.fullName ||
                `${attributes.firstName} ${attributes.lastName}` ||
                attributes.email,
            role: defaultRole || 'user',
        }, { transaction });
        await models_1.sequelize.query(`INSERT INTO organization_members 
       (organization_id, user_id, role, employee_id, department)
       VALUES (:organizationId, :userId, :role, :employeeId, :department)`, {
            replacements: {
                organizationId,
                userId: user.id,
                role: defaultRole,
                employeeId: attributes.employeeId,
                department: attributes.department,
            },
            transaction,
        });
        const [teams] = await models_1.sequelize.query(`SELECT id FROM teams 
       WHERE organization_id = :organizationId 
       AND settings->>'isDefault' = 'true'`, {
            replacements: { organizationId },
            transaction,
        });
        if (teams.length > 0) {
            await models_1.sequelize.query(`INSERT INTO team_members (team_id, user_id, role)
         VALUES (:teamId, :userId, 'member')`, {
                replacements: {
                    teamId: teams[0].id,
                    userId: user.id,
                },
                transaction,
            });
        }
        logger_1.logger.info('User provisioned via SSO', {
            userId: user.id,
            email: user.email,
            organizationId,
        });
        return user;
    }
    async getSAMLProvider(configId) {
        if (!this.samlProviders.has(configId)) {
            const [configs] = await models_1.sequelize.query(`SELECT * FROM sso_configurations WHERE id = :configId`, { replacements: { configId } });
            if (configs.length === 0) {
                throw new errors_1.AppError('SSO configuration not found', 404);
            }
            const config = configs[0];
            const saml = new node_saml_1.SAML({
                callbackUrl: `${process.env.BASE_URL}/api/sso/saml/callback/${configId}`,
                entryPoint: config.saml_idp_url,
                issuer: `${process.env.BASE_URL}/saml/${config.organization_id}`,
                idpCert: config.saml_idp_cert,
                privateKey: this.decrypt(config.saml_sp_key),
                signatureAlgorithm: 'sha256',
                authnRequestBinding: 'HTTP-POST',
            });
            this.samlProviders.set(configId, saml);
        }
        return this.samlProviders.get(configId);
    }
    async getOIDCClient(configId) {
        if (!this.oidcClients.has(configId)) {
            const [configs] = await models_1.sequelize.query(`SELECT * FROM sso_configurations WHERE id = :configId`, { replacements: { configId } });
            if (configs.length === 0) {
                throw new errors_1.AppError('SSO configuration not found', 404);
            }
            const config = configs[0];
            const issuer = await Issuer.discover(config.oidc_issuer_url);
            const client = new issuer.Client({
                client_id: config.oidc_client_id,
                client_secret: this.decrypt(config.oidc_client_secret),
                redirect_uris: [config.oidc_redirect_uri],
                response_types: ['code'],
            });
            this.oidcClients.set(configId, client);
        }
        return this.oidcClients.get(configId);
    }
    async initializeProvider(configId) {
        const [configs] = await models_1.sequelize.query(`SELECT provider FROM sso_configurations WHERE id = :configId`, { replacements: { configId } });
        if (configs.length > 0) {
            const provider = configs[0].provider;
            if (provider === 'saml') {
                await this.getSAMLProvider(configId);
            }
            else if (provider === 'oidc') {
                await this.getOIDCClient(configId);
            }
        }
    }
    validateSSOConfig(config) {
        if (!config.provider) {
            throw new errors_1.AppError('SSO provider is required', 400);
        }
        switch (config.provider) {
            case 'saml':
                if (!config.samlIdpUrl || !config.samlIdpCert) {
                    throw new errors_1.AppError('SAML IdP URL and certificate are required', 400);
                }
                break;
            case 'oidc':
                if (!config.oidcIssuerUrl || !config.oidcClientId || !config.oidcClientSecret) {
                    throw new errors_1.AppError('OIDC issuer URL, client ID, and secret are required', 400);
                }
                break;
        }
    }
    extractSAMLAttributes(profile, mapping) {
        const defaultMapping = {
            email: 'email',
            firstName: 'firstName',
            lastName: 'lastName',
            employeeId: 'employeeId',
            department: 'department',
        };
        const actualMapping = { ...defaultMapping, ...mapping };
        const attributes = {};
        for (const [key, samlKey] of Object.entries(actualMapping)) {
            attributes[key] = profile[samlKey];
        }
        if (!attributes.email) {
            throw new errors_1.AppError('Email attribute not found in SAML response', 400);
        }
        return attributes;
    }
    encrypt(text) {
        const algorithm = 'aes-256-gcm';
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }
    decrypt(encryptedText) {
        const algorithm = 'aes-256-gcm';
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    async getOrganizationSSOProviders(organizationId) {
        const [providers] = await models_1.sequelize.query(`SELECT 
        id,
        provider,
        enabled,
        allowed_domains,
        auto_provision_users,
        default_role,
        created_at,
        updated_at
       FROM sso_configurations
       WHERE organization_id = :organizationId`, {
            replacements: { organizationId },
        });
        return providers;
    }
    async updateSSOConfiguration(configId, updates) {
        const transaction = await models_1.sequelize.transaction();
        try {
            if (updates.provider) {
                throw new errors_1.AppError('Cannot change SSO provider type', 400);
            }
            const encryptedUpdates = { ...updates };
            if (updates.samlSpKey) {
                encryptedUpdates.saml_sp_key = this.encrypt(updates.samlSpKey);
                delete encryptedUpdates.samlSpKey;
            }
            if (updates.oidcClientSecret) {
                encryptedUpdates.oidc_client_secret = this.encrypt(updates.oidcClientSecret);
                delete encryptedUpdates.oidcClientSecret;
            }
            const updateFields = Object.keys(encryptedUpdates)
                .map(key => `${this.camelToSnake(key)} = :${key}`)
                .join(', ');
            await models_1.sequelize.query(`UPDATE sso_configurations
         SET ${updateFields}, updated_at = NOW()
         WHERE id = :configId`, {
                replacements: { ...encryptedUpdates, configId },
                transaction,
            });
            await transaction.commit();
            this.samlProviders.delete(configId);
            this.oidcClients.delete(configId);
            logger_1.logger.info('SSO configuration updated', { configId });
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('Failed to update SSO configuration', error);
            throw error;
        }
    }
    camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}
exports.SSOService = SSOService;
