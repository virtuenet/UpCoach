"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureGoogleAuthService = exports.SecureGoogleAuthService = void 0;
const tslib_1 = require("tslib");
const google_auth_library_1 = require("google-auth-library");
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("../../utils/logger");
const apiError_1 = require("../../utils/apiError");
const redis_1 = require("../redis");
const database_1 = require("../database");
const environment_1 = require("../../config/environment");
const crypto = tslib_1.__importStar(require("crypto"));
class SecureGoogleAuthService {
    static instance;
    oauthClients = new Map();
    supabaseClient;
    CLIENT_IDS;
    constructor() {
        this.CLIENT_IDS = {
            web: {
                production: process.env.GOOGLE_WEB_CLIENT_ID_PROD,
                staging: process.env.GOOGLE_WEB_CLIENT_ID_STAGING,
                development: process.env.GOOGLE_WEB_CLIENT_ID_DEV || process.env.GOOGLE_CLIENT_ID,
            },
            mobile: {
                production: process.env.GOOGLE_MOBILE_CLIENT_ID_PROD,
                staging: process.env.GOOGLE_MOBILE_CLIENT_ID_STAGING,
                development: process.env.GOOGLE_MOBILE_CLIENT_ID_DEV || process.env.GOOGLE_CLIENT_ID,
            },
            server: {
                production: process.env.GOOGLE_SERVER_CLIENT_ID_PROD,
                staging: process.env.GOOGLE_SERVER_CLIENT_ID_STAGING,
                development: process.env.GOOGLE_SERVER_CLIENT_ID_DEV || process.env.GOOGLE_CLIENT_ID,
            },
        };
        this.initializeOAuthClients();
        this.initializeSupabase();
    }
    initializeOAuthClients() {
        const environments = ['production', 'staging', 'development'];
        const platforms = ['web', 'mobile', 'server'];
        for (const env of environments) {
            for (const platform of platforms) {
                const clientId = this.CLIENT_IDS[platform][env];
                if (clientId && clientId !== 'undefined') {
                    const key = `${platform}_${env}`;
                    this.oauthClients.set(key, new google_auth_library_1.OAuth2Client({
                        clientId,
                        clientSecret: process.env[`GOOGLE_CLIENT_SECRET_${env.toUpperCase()}`] || process.env.GOOGLE_CLIENT_SECRET,
                    }));
                }
            }
        }
        if (this.oauthClients.size === 0) {
            throw new Error('No valid Google OAuth clients configured');
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
    static getInstance() {
        if (!SecureGoogleAuthService.instance) {
            SecureGoogleAuthService.instance = new SecureGoogleAuthService();
        }
        return SecureGoogleAuthService.instance;
    }
    generatePKCE() {
        const codeVerifier = crypto.randomBytes(32).toString('base64url');
        const codeChallenge = crypto
            .createHash('sha256')
            .update(codeVerifier)
            .digest('base64url');
        return {
            codeVerifier,
            codeChallenge,
            codeChallengeMethod: 'S256',
        };
    }
    verifyPKCE(codeVerifier, expectedChallenge) {
        const computedChallenge = crypto
            .createHash('sha256')
            .update(codeVerifier)
            .digest('base64url');
        return computedChallenge === expectedChallenge;
    }
    getOAuthClient(platform, environment) {
        const env = environment || environment_1.config.env;
        const clientKey = `${platform}_${env}`;
        let client = this.oauthClients.get(clientKey);
        if (!client) {
            client = this.oauthClients.get(`${platform}_development`);
        }
        if (!client) {
            throw new apiError_1.ApiError(500, `OAuth client not configured for ${platform} in ${env}`);
        }
        return client;
    }
    async verifyIdToken(idToken, platform, options = {}) {
        try {
            const startTime = process.hrtime.bigint();
            const oauthClient = this.getOAuthClient(platform);
            const validClientIds = Array.from(this.oauthClients.keys())
                .filter(key => key.startsWith(platform))
                .map(key => this.oauthClients.get(key))
                .map(client => client._clientId)
                .filter(Boolean);
            const ticket = await oauthClient.verifyIdToken({
                idToken,
                audience: validClientIds,
                maxExpiry: options.maxAgeSeconds,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new apiError_1.ApiError(401, 'Invalid Google token payload');
            }
            await this.validateTokenClaims(payload, options);
            const endTime = process.hrtime.bigint();
            const verificationTime = Number(endTime - startTime) / 1000000;
            logger_1.logger.info('Google token verification completed', {
                platform,
                verificationTime: `${verificationTime.toFixed(2)}ms`,
                userId: payload.sub,
                domain: payload.hd,
            });
            return {
                sub: payload.sub,
                email: payload.email,
                email_verified: payload.email_verified || false,
                name: payload.name || '',
                given_name: payload.given_name,
                family_name: payload.family_name,
                picture: payload.picture,
                locale: payload.locale,
                hd: payload.hd,
            };
        }
        catch (error) {
            logger_1.logger.error('Google token verification failed:', {
                error: error.message,
                platform,
            });
            if (error.message?.includes('Token used too late')) {
                throw new apiError_1.ApiError(401, 'Google token has expired');
            }
            if (error.message?.includes('Wrong number of segments')) {
                throw new apiError_1.ApiError(400, 'Malformed Google token');
            }
            if (error.message?.includes('Invalid token signature')) {
                throw new apiError_1.ApiError(401, 'Invalid token signature');
            }
            throw new apiError_1.ApiError(401, 'Invalid Google authentication token');
        }
    }
    async validateTokenClaims(payload, options) {
        const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
        if (!validIssuers.includes(payload.iss)) {
            throw new apiError_1.ApiError(401, 'Invalid token issuer');
        }
        const now = Math.floor(Date.now() / 1000);
        const buffer = 60;
        if (payload.exp && payload.exp < (now - buffer)) {
            throw new apiError_1.ApiError(401, 'Token has expired');
        }
        if (payload.nbf && payload.nbf > (now + buffer)) {
            throw new apiError_1.ApiError(401, 'Token not yet valid');
        }
        const maxAge = options.maxAgeSeconds || 300;
        if (payload.iat && (now - payload.iat) > maxAge) {
            throw new apiError_1.ApiError(401, 'Token is too old');
        }
        if (!payload.email) {
            throw new apiError_1.ApiError(400, 'Email not provided in Google token');
        }
        if (environment_1.config.env === 'production' && !payload.email_verified) {
            throw new apiError_1.ApiError(403, 'Email not verified with Google');
        }
        if (options.nonce && payload.nonce !== options.nonce) {
            throw new apiError_1.ApiError(401, 'Invalid nonce in token');
        }
        if (options.hostedDomain && payload.hd !== options.hostedDomain) {
            throw new apiError_1.ApiError(403, 'Invalid hosted domain');
        }
        const suspiciousPatterns = [
            /[<>"'%;()&+]/,
            /javascript:/i,
            /vbscript:/i,
            /onload=/i,
            /onerror=/i,
        ];
        const fieldsToCheck = [payload.name, payload.given_name, payload.family_name, payload.email];
        for (const field of fieldsToCheck) {
            if (field && suspiciousPatterns.some(pattern => pattern.test(field))) {
                logger_1.logger.warn('Suspicious patterns detected in Google token payload', {
                    userId: payload.sub,
                    field: field.substring(0, 20),
                });
                throw new apiError_1.ApiError(400, 'Invalid character patterns in user data');
            }
        }
    }
    async signIn(request) {
        const startTime = process.hrtime.bigint();
        const securityEvents = [];
        try {
            if (request.platform === 'mobile' && request.pkce) {
                securityEvents.push({
                    type: 'pkce_validated',
                    timestamp: new Date().toISOString(),
                    details: { platform: request.platform },
                });
            }
            const googleUser = await this.verifyIdToken(request.idToken, request.platform, {
                nonce: request.nonce,
                maxAgeSeconds: 300,
            });
            await this.checkRateLimit(googleUser.email, request.deviceInfo?.ipAddress);
            securityEvents.push({
                type: 'token_verified',
                timestamp: new Date().toISOString(),
                details: {
                    platform: request.platform,
                    email_verified: googleUser.email_verified,
                    hosted_domain: googleUser.hd,
                },
            });
            let user = await this.findUserByGoogleId(googleUser.sub);
            let isNewUser = false;
            if (!user) {
                user = await this.findUserByEmail(googleUser.email);
                if (user) {
                    await this.validateAccountLinking(user, googleUser);
                    await this.linkGoogleAccount(user.id, googleUser);
                    securityEvents.push({
                        type: 'account_linked',
                        timestamp: new Date().toISOString(),
                        details: { existingUserId: user.id },
                    });
                }
                else {
                    user = await this.createGoogleUser(googleUser, request.deviceInfo);
                    isNewUser = true;
                    securityEvents.push({
                        type: 'user_created',
                        timestamp: new Date().toISOString(),
                        details: { newUserId: user.id },
                    });
                }
            }
            else {
                await this.updateUserFromGoogle(user.id, googleUser);
                securityEvents.push({
                    type: 'user_updated',
                    timestamp: new Date().toISOString(),
                    details: { userId: user.id },
                });
            }
            if (this.supabaseClient) {
                await this.syncWithSupabase(user, googleUser);
            }
            const tokens = await this.generateSecureTokens(user, request.deviceInfo);
            await this.logSecurityEvent(user.id, 'google_signin_success', request.platform, {
                deviceInfo: request.deviceInfo,
                securityEvents,
                isNewUser,
                emailVerified: googleUser.email_verified,
                hostedDomain: googleUser.hd,
            });
            const endTime = process.hrtime.bigint();
            const totalTime = Number(endTime - startTime) / 1000000;
            logger_1.logger.info('Secure Google sign-in completed', {
                userId: user.id,
                email: googleUser.email,
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
            await this.logSecurityEvent(null, 'google_signin_failed', request.platform, {
                error: error instanceof Error ? error.message : 'Unknown error',
                deviceInfo: request.deviceInfo,
            });
            logger_1.logger.error('Secure Google sign-in failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                platform: request.platform,
                deviceInfo: request.deviceInfo,
            });
            throw error;
        }
    }
    async checkRateLimit(email, ipAddress) {
        const rateLimitKey = `auth_rate_limit:${email}:${ipAddress || 'unknown'}`;
        const attempts = await redis_1.redis.incr(rateLimitKey);
        if (attempts === 1) {
            await redis_1.redis.expire(rateLimitKey, 300);
        }
        if (attempts > 10) {
            throw new apiError_1.ApiError(429, 'Too many authentication attempts. Please try again later.');
        }
    }
    async validateAccountLinking(existingUser, googleUser) {
        if (existingUser.email.toLowerCase() !== googleUser.email.toLowerCase()) {
            throw new apiError_1.ApiError(403, 'Email mismatch during account linking');
        }
        if (existingUser.google_id && existingUser.google_id !== googleUser.sub) {
            throw new apiError_1.ApiError(409, 'A different Google account is already linked to this user');
        }
        if (!googleUser.email_verified) {
            throw new apiError_1.ApiError(403, 'Cannot link unverified Google account');
        }
    }
    async generateSecureTokens(user, deviceInfo) {
        const { generateTokens } = await Promise.resolve().then(() => tslib_1.__importStar(require('../../middleware/auth')));
        const mockReq = {
            headers: {
                'user-agent': deviceInfo?.userAgent || deviceInfo?.deviceName || 'Google Auth',
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
                fingerprint: deviceInfo ? this.generateDeviceFingerprint(deviceInfo) : null,
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
    generateDeviceFingerprint(deviceInfo) {
        const components = [
            deviceInfo.deviceId,
            deviceInfo.platform,
            deviceInfo.deviceName,
            deviceInfo.appVersion,
        ].filter(Boolean);
        return crypto
            .createHash('sha256')
            .update(components.join('|'))
            .digest('hex')
            .substring(0, 16);
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
    sanitizeUser(user) {
        const { password_hash, google_access_token, google_refresh_token, stripe_customer_secret, ...sanitized } = user;
        return {
            ...sanitized,
            preferences: typeof user.preferences === 'string'
                ? JSON.parse(user.preferences)
                : user.preferences,
        };
    }
    async findUserByGoogleId(googleId) {
        try {
            const result = await database_1.db.query('SELECT * FROM users WHERE google_id = $1 AND status IN ($2, $3)', [googleId, 'active', 'pending']);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('Error finding user by Google ID:', error);
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
    async createGoogleUser(googleUser, deviceInfo) {
        try {
            const result = await database_1.db.query(`INSERT INTO users (
          email, name, google_id, google_email, 
          avatar_url, email_verified, auth_provider,
          role, status, preferences, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *`, [
                googleUser.email.toLowerCase(),
                googleUser.name,
                googleUser.sub,
                googleUser.email,
                googleUser.picture,
                googleUser.email_verified,
                'google',
                'user',
                'active',
                JSON.stringify({
                    theme: 'light',
                    notifications: true,
                    language: googleUser.locale || 'en',
                    onboardingCompleted: false,
                }),
            ]);
            logger_1.logger.info('Created new Google user:', {
                userId: result.rows[0].id,
                email: googleUser.email,
                emailVerified: googleUser.email_verified,
            });
            return result.rows[0];
        }
        catch (error) {
            if (error.code === '23505') {
                throw new apiError_1.ApiError(409, 'User already exists');
            }
            logger_1.logger.error('Error creating Google user:', error);
            throw new apiError_1.ApiError(500, 'Failed to create user account');
        }
    }
    async linkGoogleAccount(userId, googleUser) {
        try {
            await database_1.db.query(`UPDATE users 
         SET google_id = $1, 
             google_email = $2,
             auth_provider = CASE 
               WHEN auth_provider = 'email' THEN 'google'
               ELSE auth_provider 
             END,
             avatar_url = COALESCE(avatar_url, $3),
             email_verified = CASE 
               WHEN email_verified = false THEN $4 
               ELSE email_verified 
             END,
             updated_at = NOW()
         WHERE id = $5`, [googleUser.sub, googleUser.email, googleUser.picture, googleUser.email_verified, userId]);
            logger_1.logger.info('Linked Google account to existing user:', { userId });
        }
        catch (error) {
            logger_1.logger.error('Error linking Google account:', error);
            throw new apiError_1.ApiError(500, 'Failed to link Google account');
        }
    }
    async updateUserFromGoogle(userId, googleUser) {
        try {
            await database_1.db.query(`UPDATE users 
         SET avatar_url = COALESCE($1, avatar_url),
             email_verified = CASE 
               WHEN email_verified = false THEN $2 
               ELSE email_verified 
             END,
             last_login_at = NOW(),
             updated_at = NOW()
         WHERE id = $3`, [googleUser.picture, googleUser.email_verified, userId]);
        }
        catch (error) {
            logger_1.logger.error('Error updating user from Google:', error);
        }
    }
    async syncWithSupabase(user, googleUser) {
        if (!this.supabaseClient)
            return;
        try {
        }
        catch (error) {
            logger_1.logger.error('Error syncing with Supabase:', error);
        }
    }
}
exports.SecureGoogleAuthService = SecureGoogleAuthService;
exports.secureGoogleAuthService = SecureGoogleAuthService.getInstance();
