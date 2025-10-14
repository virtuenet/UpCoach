"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.facebookAuthService = exports.FacebookAuthService = void 0;
const tslib_1 = require("tslib");
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("../../utils/logger");
const apiError_1 = require("../../utils/apiError");
const redis_1 = require("../redis");
const database_1 = require("../database");
const environment_1 = require("../../config/environment");
const crypto = tslib_1.__importStar(require("crypto"));
class FacebookAuthService {
    static instance;
    supabaseClient;
    APP_ID;
    APP_SECRET;
    GRAPH_API_URL = 'https://graph.facebook.com/v18.0';
    REQUIRED_PERMISSIONS = ['email', 'public_profile'];
    constructor() {
        this.APP_ID = process.env.FACEBOOK_APP_ID;
        this.APP_SECRET = process.env.FACEBOOK_APP_SECRET;
        this.validateConfiguration();
        this.initializeSupabase();
    }
    static getInstance() {
        if (!FacebookAuthService.instance) {
            FacebookAuthService.instance = new FacebookAuthService();
        }
        return FacebookAuthService.instance;
    }
    validateConfiguration() {
        if (!this.APP_ID || !this.APP_SECRET) {
            throw new Error('Facebook App ID and App Secret are required');
        }
        if (this.APP_ID.length < 10 || this.APP_SECRET.length < 20) {
            logger_1.logger.warn('Facebook credentials may be invalid - check APP_ID and APP_SECRET');
        }
    }
    initializeSupabase() {
        const supabaseUrl = environment_1.config.supabase.url;
        const supabaseServiceKey = environment_1.config.supabase.serviceRoleKey;
        if (supabaseUrl && supabaseServiceKey) {
            this.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
                db: {
                    schema: 'public',
                },
                global: {
                    headers: {
                        'X-Client-Info': 'upcoach-backend@1.0.0',
                    },
                },
            });
        }
    }
    async validateAccessToken(accessToken) {
        try {
            const appAccessToken = `${this.APP_ID}|${this.APP_SECRET}`;
            const response = await fetch(`${this.GRAPH_API_URL}/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appAccessToken)}`);
            if (!response.ok) {
                throw new Error(`Facebook token validation failed: ${response.status}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(`Facebook API error: ${data.error.message}`);
            }
            const tokenData = data.data;
            if (!tokenData.is_valid) {
                throw new apiError_1.ApiError(401, 'Facebook access token is invalid');
            }
            if (tokenData.app_id !== this.APP_ID) {
                throw new apiError_1.ApiError(401, 'Facebook token is for different app');
            }
            const now = Math.floor(Date.now() / 1000);
            if (tokenData.expires_at && tokenData.expires_at < now) {
                throw new apiError_1.ApiError(401, 'Facebook access token has expired');
            }
            const hasRequiredPermissions = this.REQUIRED_PERMISSIONS.every(permission => tokenData.scopes.includes(permission));
            if (!hasRequiredPermissions) {
                throw new apiError_1.ApiError(403, `Missing required Facebook permissions: ${this.REQUIRED_PERMISSIONS.join(', ')}`);
            }
            logger_1.logger.debug('Facebook token validated successfully', {
                userId: tokenData.user_id,
                scopes: tokenData.scopes,
                expiresAt: tokenData.expires_at,
            });
            return tokenData;
        }
        catch (error) {
            logger_1.logger.error('Facebook token validation failed:', {
                error: error.message,
            });
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
            throw new apiError_1.ApiError(401, 'Failed to validate Facebook access token');
        }
    }
    async getUserInfo(accessToken) {
        try {
            const fields = [
                'id',
                'email',
                'name',
                'first_name',
                'last_name',
                'picture.width(200).height(200)',
                'verified',
            ].join(',');
            const response = await fetch(`${this.GRAPH_API_URL}/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`);
            if (!response.ok) {
                throw new Error(`Facebook user info request failed: ${response.status}`);
            }
            const userData = await response.json();
            if (userData.error) {
                throw new Error(`Facebook API error: ${userData.error.message}`);
            }
            if (!userData.id) {
                throw new apiError_1.ApiError(400, 'Facebook user ID not provided');
            }
            logger_1.logger.debug('Facebook user info retrieved', {
                userId: userData.id,
                hasEmail: !!userData.email,
                hasName: !!userData.name,
                verified: userData.verified,
            });
            return userData;
        }
        catch (error) {
            logger_1.logger.error('Failed to get Facebook user info:', {
                error: error.message,
            });
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
            throw new apiError_1.ApiError(500, 'Failed to retrieve Facebook user information');
        }
    }
    async signIn(request) {
        const startTime = process.hrtime.bigint();
        const securityEvents = [];
        try {
            const tokenValidation = await this.validateAccessToken(request.accessToken);
            securityEvents.push({
                type: 'facebook_token_validated',
                timestamp: new Date().toISOString(),
                details: {
                    platform: request.platform,
                    scopes: tokenValidation.scopes,
                    app_id: tokenValidation.app_id,
                },
            });
            const facebookUser = await this.getUserInfo(request.accessToken);
            securityEvents.push({
                type: 'facebook_user_info_retrieved',
                timestamp: new Date().toISOString(),
                details: {
                    hasEmail: !!facebookUser.email,
                    hasName: !!facebookUser.name,
                    verified: facebookUser.verified,
                },
            });
            await this.checkRateLimit(facebookUser.email || facebookUser.id, request.deviceInfo?.ipAddress);
            let user = await this.findUserByFacebookId(facebookUser.id);
            let isNewUser = false;
            if (!user) {
                if (facebookUser.email) {
                    user = await this.findUserByEmail(facebookUser.email);
                    if (user) {
                        await this.validateAccountLinking(user, facebookUser);
                        await this.linkFacebookAccount(user.id, facebookUser);
                        securityEvents.push({
                            type: 'facebook_account_linked',
                            timestamp: new Date().toISOString(),
                            details: { existingUserId: user.id },
                        });
                    }
                }
                if (!user) {
                    user = await this.createFacebookUser(facebookUser, request);
                    isNewUser = true;
                    securityEvents.push({
                        type: 'facebook_user_created',
                        timestamp: new Date().toISOString(),
                        details: { newUserId: user.id },
                    });
                }
            }
            else {
                await this.updateUserFromFacebook(user.id, facebookUser);
                securityEvents.push({
                    type: 'facebook_user_updated',
                    timestamp: new Date().toISOString(),
                    details: { userId: user.id },
                });
            }
            if (this.supabaseClient) {
                await this.syncWithSupabase(user, facebookUser);
            }
            const tokens = await this.generateSecureTokens(user, request.deviceInfo);
            await this.logSecurityEvent(user.id, 'facebook_signin_success', request.platform, {
                deviceInfo: request.deviceInfo,
                securityEvents,
                isNewUser,
                facebookVerified: facebookUser.verified,
            });
            const endTime = process.hrtime.bigint();
            const totalTime = Number(endTime - startTime) / 1000000;
            logger_1.logger.info('Facebook Sign-In completed', {
                userId: user.id,
                email: facebookUser.email,
                platform: request.platform,
                isNewUser,
                processingTime: `${totalTime.toFixed(2)}ms`,
                securityEventCount: securityEvents.length,
            });
            return {
                user: this.sanitizeUser(user),
                tokens,
                isNewUser,
                securityEvents,
            };
        }
        catch (error) {
            await this.logSecurityEvent(null, 'facebook_signin_failed', request.platform, {
                error: error instanceof Error ? error.message : 'Unknown error',
                deviceInfo: request.deviceInfo,
            });
            logger_1.logger.error('Facebook Sign-In failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                platform: request.platform,
                deviceInfo: request.deviceInfo,
            });
            throw error;
        }
    }
    verifyWebhookSignature(payload, signature) {
        try {
            const expectedSignature = crypto
                .createHmac('sha256', this.APP_SECRET)
                .update(payload)
                .digest('hex');
            const providedSignature = signature.replace('sha256=', '');
            return crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(providedSignature, 'hex'));
        }
        catch (error) {
            logger_1.logger.error('Facebook webhook signature verification failed:', error);
            return false;
        }
    }
    async handleDeauthorization(userId) {
        try {
            await database_1.db.query(`UPDATE users
         SET facebook_id = NULL,
             facebook_access_token = NULL,
             auth_provider = CASE
               WHEN auth_provider = 'facebook' THEN 'email'
               ELSE auth_provider
             END,
             updated_at = NOW()
         WHERE facebook_id = $1`, [userId]);
            await this.logSecurityEvent(null, 'facebook_deauthorized', 'webhook', {
                facebookUserId: userId,
            });
            logger_1.logger.info('Facebook deauthorization processed', {
                facebookUserId: userId,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to process Facebook deauthorization:', error);
            throw new apiError_1.ApiError(500, 'Failed to process deauthorization');
        }
    }
    async getLongLivedToken(shortLivedToken) {
        try {
            const response = await fetch(`${this.GRAPH_API_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.APP_ID}&client_secret=${this.APP_SECRET}&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`);
            if (!response.ok) {
                throw new Error(`Facebook token exchange failed: ${response.status}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(`Facebook API error: ${data.error.message}`);
            }
            logger_1.logger.info('Facebook long-lived token obtained', {
                expiresIn: data.expires_in,
            });
            return data;
        }
        catch (error) {
            logger_1.logger.error('Failed to get Facebook long-lived token:', error);
            throw new apiError_1.ApiError(500, 'Failed to exchange for long-lived token');
        }
    }
    async checkRateLimit(identifier, ipAddress) {
        const rateLimitKey = `facebook_auth_rate_limit:${identifier}:${ipAddress || 'unknown'}`;
        const attempts = await redis_1.redis.incr(rateLimitKey);
        if (attempts === 1) {
            await redis_1.redis.expire(rateLimitKey, 300);
        }
        if (attempts > 5) {
            throw new apiError_1.ApiError(429, 'Too many Facebook authentication attempts. Please try again later.');
        }
    }
    async validateAccountLinking(existingUser, facebookUser) {
        if (existingUser.email && facebookUser.email &&
            existingUser.email.toLowerCase() !== facebookUser.email.toLowerCase()) {
            throw new apiError_1.ApiError(403, 'Email mismatch during Facebook account linking');
        }
        if (existingUser.facebook_id && existingUser.facebook_id !== facebookUser.id) {
            throw new apiError_1.ApiError(409, 'A different Facebook account is already linked to this user');
        }
        if (!facebookUser.verified) {
            logger_1.logger.warn('Facebook account not verified during linking', {
                userId: existingUser.id,
                facebookId: facebookUser.id,
            });
        }
    }
    async findUserByFacebookId(facebookId) {
        try {
            const result = await database_1.db.query('SELECT * FROM users WHERE facebook_id = $1 AND status IN ($2, $3)', [facebookId, 'active', 'pending']);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('Error finding user by Facebook ID:', error);
            return null;
        }
    }
    async findUserByEmail(email) {
        try {
            const result = await database_1.db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('Error finding user by email:', error);
            return null;
        }
    }
    async createFacebookUser(facebookUser, request) {
        try {
            const email = facebookUser.email || '';
            const name = facebookUser.name ||
                `${facebookUser.first_name || ''} ${facebookUser.last_name || ''}`.trim() ||
                'Facebook User';
            const avatarUrl = facebookUser.picture?.data?.url;
            const result = await database_1.db.query(`INSERT INTO users (
          email, name, first_name, last_name,
          facebook_id, avatar_url, email_verified, auth_provider,
          role, status, preferences, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *`, [
                email.toLowerCase(),
                name,
                facebookUser.first_name || '',
                facebookUser.last_name || '',
                facebookUser.id,
                avatarUrl,
                !!facebookUser.email,
                'facebook',
                'user',
                'active',
                JSON.stringify({
                    theme: 'light',
                    notifications: true,
                    language: 'en',
                    onboardingCompleted: false,
                    facebookSignInPreferences: {
                        verified: facebookUser.verified,
                        firstSignInDate: new Date().toISOString(),
                    },
                }),
            ]);
            logger_1.logger.info('Created new Facebook user:', {
                userId: result.rows[0].id,
                email: email,
                hasName: !!name,
                verified: facebookUser.verified,
            });
            return result.rows[0];
        }
        catch (error) {
            if (error.code === '23505') {
                throw new apiError_1.ApiError(409, 'User already exists');
            }
            logger_1.logger.error('Error creating Facebook user:', error);
            throw new apiError_1.ApiError(500, 'Failed to create user account');
        }
    }
    async linkFacebookAccount(userId, facebookUser) {
        try {
            const avatarUrl = facebookUser.picture?.data?.url;
            await database_1.db.query(`UPDATE users
         SET facebook_id = $1,
             auth_provider = CASE
               WHEN auth_provider = 'email' THEN 'facebook'
               ELSE auth_provider
             END,
             avatar_url = COALESCE(avatar_url, $2),
             email_verified = CASE
               WHEN email_verified = false AND $3 != '' THEN true
               ELSE email_verified
             END,
             updated_at = NOW()
         WHERE id = $4`, [facebookUser.id, avatarUrl, facebookUser.email || '', userId]);
            logger_1.logger.info('Linked Facebook account to existing user:', { userId });
        }
        catch (error) {
            logger_1.logger.error('Error linking Facebook account:', error);
            throw new apiError_1.ApiError(500, 'Failed to link Facebook account');
        }
    }
    async updateUserFromFacebook(userId, facebookUser) {
        try {
            const avatarUrl = facebookUser.picture?.data?.url;
            await database_1.db.query(`UPDATE users
         SET avatar_url = COALESCE($1, avatar_url),
             last_login_at = NOW(),
             updated_at = NOW()
         WHERE id = $2`, [avatarUrl, userId]);
        }
        catch (error) {
            logger_1.logger.error('Error updating user from Facebook:', error);
        }
    }
    async generateSecureTokens(user, deviceInfo) {
        const { generateTokens } = await Promise.resolve().then(() => tslib_1.__importStar(require('../../middleware/auth')));
        const mockReq = {
            headers: {
                'user-agent': deviceInfo?.userAgent || deviceInfo?.deviceName || 'Facebook Auth',
                'x-device-id': deviceInfo?.deviceId,
                'x-app-version': deviceInfo?.appVersion,
            },
            ip: deviceInfo?.ipAddress || '127.0.0.1',
            connection: {
                remoteAddress: deviceInfo?.ipAddress || '127.0.0.1',
            },
        };
        const tokens = generateTokens(user.id, user.email, user.role, mockReq);
        const refreshTokenKey = `refresh_token:${user.id}`;
        const refreshTokenData = {
            token: tokens.refreshToken,
            deviceInfo: {
                ...deviceInfo,
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString(),
            },
            security: {
                ipAddress: deviceInfo?.ipAddress,
                userAgent: deviceInfo?.userAgent,
                provider: 'facebook',
            },
        };
        const refreshTokenTTL = environment_1.config.env === 'production' ? 7 * 24 * 60 * 60 : 30 * 24 * 60 * 60;
        await redis_1.redis.setEx(refreshTokenKey, refreshTokenTTL, JSON.stringify(refreshTokenData));
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: 3600,
        };
    }
    async logSecurityEvent(userId, eventType, platform, details) {
        try {
            await database_1.db.query(`INSERT INTO security_events (
          user_id, event_type, platform, details,
          ip_address, user_agent, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`, [
                userId,
                eventType,
                platform,
                details ? JSON.stringify(details) : null,
                details?.deviceInfo?.ipAddress || null,
                details?.deviceInfo?.userAgent || null,
            ]);
        }
        catch (error) {
            logger_1.logger.error('Error logging security event:', error);
        }
    }
    async syncWithSupabase(user, facebookUser) {
        if (!this.supabaseClient)
            return;
        try {
            const { data: supabaseUser } = await this.supabaseClient.auth.admin.getUserById(user.id);
            if (!supabaseUser) {
                await this.supabaseClient.auth.admin.createUser({
                    id: user.id,
                    email: user.email,
                    email_confirm: !!facebookUser.email,
                    user_metadata: {
                        name: user.name,
                        avatar_url: facebookUser.picture?.data?.url,
                        provider: 'facebook',
                        facebook_id: facebookUser.id,
                        facebook_verified: facebookUser.verified,
                    },
                });
            }
            else {
                await this.supabaseClient.auth.admin.updateUserById(user.id, {
                    user_metadata: {
                        ...supabaseUser.user_metadata,
                        facebook_id: facebookUser.id,
                        last_sign_in_provider: 'facebook',
                    },
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error syncing with Supabase:', error);
        }
    }
    sanitizeUser(user) {
        const { password_hash, facebook_access_token, stripe_customer_secret, ...sanitized } = user;
        return {
            ...sanitized,
            preferences: typeof user.preferences === 'string'
                ? JSON.parse(user.preferences)
                : user.preferences,
        };
    }
}
exports.FacebookAuthService = FacebookAuthService;
exports.facebookAuthService = FacebookAuthService.getInstance();
