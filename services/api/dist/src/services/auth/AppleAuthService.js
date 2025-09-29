"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appleAuthService = exports.AppleAuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("../../utils/logger");
const apiError_1 = require("../../utils/apiError");
const redis_1 = require("../redis");
const database_1 = require("../database");
const environment_1 = require("../../config/environment");
const crypto = __importStar(require("crypto"));
class AppleAuthService {
    static instance;
    supabaseClient;
    applePublicKeys = new Map();
    CLIENT_IDS;
    TEAM_ID;
    KEY_ID;
    PRIVATE_KEY;
    APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';
    APPLE_ISSUER = 'https://appleid.apple.com';
    constructor() {
        this.CLIENT_IDS = {
            web: process.env.APPLE_WEB_CLIENT_ID,
            mobile: process.env.APPLE_MOBILE_CLIENT_ID,
            service: process.env.APPLE_SERVICE_CLIENT_ID,
        };
        this.TEAM_ID = process.env.APPLE_TEAM_ID;
        this.KEY_ID = process.env.APPLE_KEY_ID;
        this.PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY;
        this.validateConfiguration();
        this.initializeSupabase();
        this.refreshApplePublicKeys();
    }
    static getInstance() {
        if (!AppleAuthService.instance) {
            AppleAuthService.instance = new AppleAuthService();
        }
        return AppleAuthService.instance;
    }
    validateConfiguration() {
        const requiredEnvVars = [
            'APPLE_WEB_CLIENT_ID',
            'APPLE_MOBILE_CLIENT_ID',
            'APPLE_TEAM_ID',
            'APPLE_KEY_ID',
            'APPLE_PRIVATE_KEY',
        ];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            throw new Error(`Missing required Apple Sign-In environment variables: ${missingVars.join(', ')}`);
        }
        if (!this.PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
            logger_1.logger.warn('Apple private key may not be in correct format');
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
    async refreshApplePublicKeys() {
        try {
            const response = await fetch(this.APPLE_KEYS_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch Apple public keys: ${response.status}`);
            }
            const data = await response.json();
            for (const key of data.keys) {
                this.applePublicKeys.set(key.kid, key);
            }
            logger_1.logger.info('Apple public keys cached successfully', {
                keyCount: this.applePublicKeys.size,
            });
            await redis_1.redis.setEx('apple_public_keys', 3600, JSON.stringify(data.keys));
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch Apple public keys:', error);
            try {
                const cachedKeys = await redis_1.redis.get('apple_public_keys');
                if (cachedKeys) {
                    const keys = JSON.parse(cachedKeys);
                    for (const key of keys) {
                        this.applePublicKeys.set(key.kid, key);
                    }
                    logger_1.logger.info('Loaded Apple public keys from cache');
                }
            }
            catch (cacheError) {
                logger_1.logger.error('Failed to load Apple public keys from cache:', cacheError);
            }
        }
    }
    async verifyIdentityToken(identityToken, platform, options = {}) {
        try {
            const startTime = process.hrtime.bigint();
            const decoded = jsonwebtoken_1.default.decode(identityToken, { complete: true });
            if (!decoded || typeof decoded === 'string') {
                throw new apiError_1.ApiError(400, 'Invalid Apple identity token format');
            }
            const header = decoded.header;
            const payload = decoded.payload;
            if (!header.kid || !header.alg || header.alg !== 'RS256') {
                throw new apiError_1.ApiError(400, 'Invalid Apple token header');
            }
            const publicKey = await this.getApplePublicKey(header.kid);
            if (!publicKey) {
                await this.refreshApplePublicKeys();
                const refreshedKey = await this.getApplePublicKey(header.kid);
                if (!refreshedKey) {
                    throw new apiError_1.ApiError(401, 'Unable to verify Apple token - key not found');
                }
            }
            const verifiedPayload = jsonwebtoken_1.default.verify(identityToken, publicKey, {
                algorithms: ['RS256'],
                issuer: this.APPLE_ISSUER,
                audience: options.audience || this.getClientIdForPlatform(platform),
                clockTolerance: 60,
            });
            await this.validateAppleTokenClaims(verifiedPayload, options);
            const endTime = process.hrtime.bigint();
            const verificationTime = Number(endTime - startTime) / 1000000;
            logger_1.logger.info('Apple token verification completed', {
                platform,
                verificationTime: `${verificationTime.toFixed(2)}ms`,
                userId: verifiedPayload.sub,
                emailVerified: verifiedPayload.email_verified,
            });
            return {
                sub: verifiedPayload.sub,
                email: verifiedPayload.email || '',
                email_verified: verifiedPayload.email_verified || 'false',
                real_user_status: verifiedPayload.real_user_status,
                transfer_sub: verifiedPayload.transfer_sub,
            };
        }
        catch (error) {
            logger_1.logger.error('Apple token verification failed:', {
                error: error.message,
                platform,
            });
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
            if (error.name === 'TokenExpiredError') {
                throw new apiError_1.ApiError(401, 'Apple identity token has expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new apiError_1.ApiError(401, 'Invalid Apple identity token');
            }
            throw new apiError_1.ApiError(401, 'Apple authentication failed');
        }
    }
    async getApplePublicKey(kid) {
        const keyData = this.applePublicKeys.get(kid);
        if (!keyData) {
            return null;
        }
        try {
            const jwkToPem = require('jwk-to-pem');
            return jwkToPem(keyData);
        }
        catch (error) {
            logger_1.logger.error('Failed to convert Apple JWK to PEM:', error);
            return null;
        }
    }
    getClientIdForPlatform(platform) {
        return platform === 'mobile' ? this.CLIENT_IDS.mobile : this.CLIENT_IDS.web;
    }
    async validateAppleTokenClaims(payload, options) {
        if (payload.iss !== this.APPLE_ISSUER) {
            throw new apiError_1.ApiError(401, 'Invalid Apple token issuer');
        }
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            throw new apiError_1.ApiError(401, 'Apple token has expired');
        }
        if (payload.iat && (now - payload.iat) > 600) {
            throw new apiError_1.ApiError(401, 'Apple token is too old');
        }
        if (options.nonce) {
            const hashedNonce = crypto.createHash('sha256')
                .update(options.nonce)
                .digest('hex');
            const expectedNonceHash = hashedNonce.substring(0, 32);
            logger_1.logger.debug('Nonce validation (Apple)', {
                provided: !!options.nonce,
                expected: expectedNonceHash,
            });
        }
        if (payload.sub && payload.sub.length !== 41) {
            logger_1.logger.warn('Apple token has unusual subject format', {
                subLength: payload.sub.length,
            });
        }
        if (payload.real_user_status !== undefined) {
            if (payload.real_user_status < 1) {
                logger_1.logger.warn('Apple token indicates potentially fake user', {
                    realUserStatus: payload.real_user_status,
                });
            }
        }
    }
    async signIn(request) {
        const startTime = process.hrtime.bigint();
        const securityEvents = [];
        try {
            const appleUser = await this.verifyIdentityToken(request.identityToken, request.platform, {
                nonce: request.nonce,
            });
            securityEvents.push({
                type: 'apple_token_verified',
                timestamp: new Date().toISOString(),
                details: {
                    platform: request.platform,
                    email_verified: appleUser.email_verified,
                    real_user_status: appleUser.real_user_status,
                },
            });
            await this.checkRateLimit(appleUser.email || appleUser.sub, request.deviceInfo?.ipAddress);
            let user = await this.findUserByAppleId(appleUser.sub);
            let isNewUser = false;
            if (!user) {
                if (appleUser.email) {
                    user = await this.findUserByEmail(appleUser.email);
                    if (user) {
                        await this.validateAccountLinking(user, appleUser);
                        await this.linkAppleAccount(user.id, appleUser);
                        securityEvents.push({
                            type: 'apple_account_linked',
                            timestamp: new Date().toISOString(),
                            details: { existingUserId: user.id },
                        });
                    }
                }
                if (!user) {
                    user = await this.createAppleUser(appleUser, request);
                    isNewUser = true;
                    securityEvents.push({
                        type: 'apple_user_created',
                        timestamp: new Date().toISOString(),
                        details: { newUserId: user.id },
                    });
                }
            }
            else {
                await this.updateUserFromApple(user.id, appleUser);
                securityEvents.push({
                    type: 'apple_user_updated',
                    timestamp: new Date().toISOString(),
                    details: { userId: user.id },
                });
            }
            if (this.supabaseClient) {
                await this.syncWithSupabase(user, appleUser);
            }
            const tokens = await this.generateSecureTokens(user, request.deviceInfo);
            await this.logSecurityEvent(user.id, 'apple_signin_success', request.platform, {
                deviceInfo: request.deviceInfo,
                securityEvents,
                isNewUser,
                emailVerified: appleUser.email_verified === 'true',
                realUserStatus: appleUser.real_user_status,
            });
            const endTime = process.hrtime.bigint();
            const totalTime = Number(endTime - startTime) / 1000000;
            logger_1.logger.info('Apple Sign-In completed', {
                userId: user.id,
                email: appleUser.email,
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
            await this.logSecurityEvent(null, 'apple_signin_failed', request.platform, {
                error: error instanceof Error ? error.message : 'Unknown error',
                deviceInfo: request.deviceInfo,
            });
            logger_1.logger.error('Apple Sign-In failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                platform: request.platform,
                deviceInfo: request.deviceInfo,
            });
            throw error;
        }
    }
    generateClientSecret(audience = 'https://appleid.apple.com') {
        try {
            const now = Math.floor(Date.now() / 1000);
            const payload = {
                iss: this.TEAM_ID,
                iat: now,
                exp: now + 3600,
                aud: audience,
                sub: this.CLIENT_IDS.service || this.CLIENT_IDS.web,
            };
            const header = {
                alg: 'ES256',
                kid: this.KEY_ID,
            };
            return jsonwebtoken_1.default.sign(payload, this.PRIVATE_KEY, {
                algorithm: 'ES256',
                header,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to generate Apple client secret:', error);
            throw new apiError_1.ApiError(500, 'Failed to generate Apple client secret');
        }
    }
    async exchangeAuthorizationCode(authorizationCode, platform = 'web') {
        try {
            const clientSecret = this.generateClientSecret();
            const clientId = this.getClientIdForPlatform(platform);
            const response = await fetch('https://appleid.apple.com/auth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code: authorizationCode,
                    grant_type: 'authorization_code',
                }),
            });
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Apple token exchange failed: ${response.status} - ${errorData}`);
            }
            const tokenData = await response.json();
            logger_1.logger.info('Apple authorization code exchanged successfully', {
                platform,
                hasRefreshToken: !!tokenData.refresh_token,
                hasIdToken: !!tokenData.id_token,
            });
            return tokenData;
        }
        catch (error) {
            logger_1.logger.error('Apple authorization code exchange failed:', error);
            throw new apiError_1.ApiError(500, 'Failed to exchange Apple authorization code');
        }
    }
    async checkRateLimit(identifier, ipAddress) {
        const rateLimitKey = `apple_auth_rate_limit:${identifier}:${ipAddress || 'unknown'}`;
        const attempts = await redis_1.redis.incr(rateLimitKey);
        if (attempts === 1) {
            await redis_1.redis.expire(rateLimitKey, 300);
        }
        if (attempts > 5) {
            throw new apiError_1.ApiError(429, 'Too many Apple authentication attempts. Please try again later.');
        }
    }
    async validateAccountLinking(existingUser, appleUser) {
        if (existingUser.email && appleUser.email &&
            existingUser.email.toLowerCase() !== appleUser.email.toLowerCase()) {
            throw new apiError_1.ApiError(403, 'Email mismatch during Apple account linking');
        }
        if (existingUser.apple_id && existingUser.apple_id !== appleUser.sub) {
            throw new apiError_1.ApiError(409, 'A different Apple account is already linked to this user');
        }
        if (appleUser.email_verified === 'false') {
            logger_1.logger.warn('Apple account email not verified during linking', {
                userId: existingUser.id,
                appleId: appleUser.sub,
            });
        }
    }
    async findUserByAppleId(appleId) {
        try {
            const result = await database_1.db.query('SELECT * FROM users WHERE apple_id = $1 AND status IN ($2, $3)', [appleId, 'active', 'pending']);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('Error finding user by Apple ID:', error);
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
    async createAppleUser(appleUser, request) {
        try {
            let firstName = '';
            let lastName = '';
            let fullName = '';
            if (request.user?.name) {
                firstName = request.user.name.firstName || '';
                lastName = request.user.name.lastName || '';
                fullName = `${firstName} ${lastName}`.trim();
            }
            const email = request.user?.email || appleUser.email || '';
            const result = await database_1.db.query(`INSERT INTO users (
          email, name, first_name, last_name,
          apple_id, email_verified, auth_provider,
          role, status, preferences, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *`, [
                email.toLowerCase(),
                fullName || 'Apple User',
                firstName,
                lastName,
                appleUser.sub,
                appleUser.email_verified === 'true',
                'apple',
                'user',
                'active',
                JSON.stringify({
                    theme: 'light',
                    notifications: true,
                    language: 'en',
                    onboardingCompleted: false,
                    appleSignInPreferences: {
                        realUserStatus: appleUser.real_user_status,
                        firstSignInDate: new Date().toISOString(),
                    },
                }),
            ]);
            logger_1.logger.info('Created new Apple user:', {
                userId: result.rows[0].id,
                email: email,
                emailVerified: appleUser.email_verified,
                hasName: !!fullName,
            });
            return result.rows[0];
        }
        catch (error) {
            if (error.code === '23505') {
                throw new apiError_1.ApiError(409, 'User already exists');
            }
            logger_1.logger.error('Error creating Apple user:', error);
            throw new apiError_1.ApiError(500, 'Failed to create user account');
        }
    }
    async linkAppleAccount(userId, appleUser) {
        try {
            await database_1.db.query(`UPDATE users
         SET apple_id = $1,
             auth_provider = CASE
               WHEN auth_provider = 'email' THEN 'apple'
               ELSE auth_provider
             END,
             email_verified = CASE
               WHEN email_verified = false AND $2 = true THEN true
               ELSE email_verified
             END,
             updated_at = NOW()
         WHERE id = $3`, [appleUser.sub, appleUser.email_verified === 'true', userId]);
            logger_1.logger.info('Linked Apple account to existing user:', { userId });
        }
        catch (error) {
            logger_1.logger.error('Error linking Apple account:', error);
            throw new apiError_1.ApiError(500, 'Failed to link Apple account');
        }
    }
    async updateUserFromApple(userId, appleUser) {
        try {
            await database_1.db.query(`UPDATE users
         SET email_verified = CASE
               WHEN email_verified = false AND $1 = true THEN true
               ELSE email_verified
             END,
             last_login_at = NOW(),
             updated_at = NOW()
         WHERE id = $2`, [appleUser.email_verified === 'true', userId]);
        }
        catch (error) {
            logger_1.logger.error('Error updating user from Apple:', error);
        }
    }
    async generateSecureTokens(user, deviceInfo) {
        const { generateTokens } = await Promise.resolve().then(() => __importStar(require('../../middleware/auth')));
        const mockReq = {
            headers: {
                'user-agent': deviceInfo?.userAgent || deviceInfo?.deviceName || 'Apple Auth',
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
                provider: 'apple',
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
    async syncWithSupabase(user, appleUser) {
        if (!this.supabaseClient)
            return;
        try {
            const { data: supabaseUser } = await this.supabaseClient.auth.admin.getUserById(user.id);
            if (!supabaseUser) {
                await this.supabaseClient.auth.admin.createUser({
                    id: user.id,
                    email: user.email,
                    email_confirm: appleUser.email_verified === 'true',
                    user_metadata: {
                        name: user.name,
                        provider: 'apple',
                        apple_id: appleUser.sub,
                        real_user_status: appleUser.real_user_status,
                    },
                });
            }
            else {
                await this.supabaseClient.auth.admin.updateUserById(user.id, {
                    user_metadata: {
                        ...supabaseUser.user_metadata,
                        apple_id: appleUser.sub,
                        last_sign_in_provider: 'apple',
                    },
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error syncing with Supabase:', error);
        }
    }
    sanitizeUser(user) {
        const { password_hash, apple_refresh_token, stripe_customer_secret, ...sanitized } = user;
        return {
            ...sanitized,
            preferences: typeof user.preferences === 'string'
                ? JSON.parse(user.preferences)
                : user.preferences,
        };
    }
}
exports.AppleAuthService = AppleAuthService;
exports.appleAuthService = AppleAuthService.getInstance();
//# sourceMappingURL=AppleAuthService.js.map