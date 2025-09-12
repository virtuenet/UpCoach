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
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthService = exports.GoogleAuthService = void 0;
const google_auth_library_1 = require("google-auth-library");
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("../../utils/logger");
const apiError_1 = require("../../utils/apiError");
const redis_1 = require("../redis");
const database_1 = require("../database");
class GoogleAuthService {
    static instance;
    oauthClient;
    supabaseClient;
    CLIENT_ID;
    MOBILE_CLIENT_ID;
    WEB_CLIENT_ID;
    constructor() {
        this.CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        this.MOBILE_CLIENT_ID = process.env.GOOGLE_MOBILE_CLIENT_ID || this.CLIENT_ID;
        this.WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID || this.CLIENT_ID;
        if (!this.CLIENT_ID) {
            throw new Error('Google OAuth client ID not configured');
        }
        this.oauthClient = new google_auth_library_1.OAuth2Client({
            clientId: this.CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        });
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && supabaseServiceKey) {
            this.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            });
        }
    }
    static getInstance() {
        if (!GoogleAuthService.instance) {
            GoogleAuthService.instance = new GoogleAuthService();
        }
        return GoogleAuthService.instance;
    }
    async verifyIdToken(idToken, platform) {
        try {
            const clientIds = [this.CLIENT_ID];
            if (platform === 'mobile' && this.MOBILE_CLIENT_ID !== this.CLIENT_ID) {
                clientIds.push(this.MOBILE_CLIENT_ID);
            }
            if (platform === 'web' && this.WEB_CLIENT_ID !== this.CLIENT_ID) {
                clientIds.push(this.WEB_CLIENT_ID);
            }
            const ticket = await this.oauthClient.verifyIdToken({
                idToken,
                audience: clientIds,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new apiError_1.ApiError(401, 'Invalid Google token payload');
            }
            this.validateTokenClaims(payload);
            return {
                sub: payload.sub,
                email: payload.email,
                email_verified: payload.email_verified || false,
                name: payload.name || '',
                given_name: payload.given_name,
                family_name: payload.family_name,
                picture: payload.picture,
                locale: payload.locale,
            };
        }
        catch (error) {
            logger_1.logger.error('Google token verification failed:', error);
            if (error.message?.includes('Token used too late')) {
                throw new apiError_1.ApiError(401, 'Google token has expired');
            }
            if (error.message?.includes('Wrong number of segments')) {
                throw new apiError_1.ApiError(400, 'Malformed Google token');
            }
            throw new apiError_1.ApiError(401, 'Invalid Google authentication token');
        }
    }
    validateTokenClaims(payload) {
        const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
        if (!validIssuers.includes(payload.iss)) {
            throw new apiError_1.ApiError(401, 'Invalid token issuer');
        }
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            throw new apiError_1.ApiError(401, 'Token has expired');
        }
        if (!payload.email) {
            throw new apiError_1.ApiError(400, 'Email not provided in Google token');
        }
        if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !payload.email_verified) {
            throw new apiError_1.ApiError(403, 'Email not verified with Google');
        }
    }
    async signIn(idToken, platform = 'web', deviceInfo) {
        try {
            const googleUser = await this.verifyIdToken(idToken, platform);
            let user = await this.findUserByGoogleId(googleUser.sub);
            let isNewUser = false;
            if (!user) {
                user = await this.findUserByEmail(googleUser.email);
                if (user) {
                    await this.linkGoogleAccount(user.id, googleUser);
                }
                else {
                    user = await this.createGoogleUser(googleUser);
                    isNewUser = true;
                }
            }
            else {
                await this.updateUserFromGoogle(user.id, googleUser);
            }
            if (this.supabaseClient) {
                await this.syncWithSupabase(user, googleUser);
            }
            const tokens = await this.generateTokens(user, deviceInfo);
            await this.logAuthEvent(user.id, 'google_signin', platform, deviceInfo);
            return {
                user: this.sanitizeUser(user),
                tokens,
                isNewUser,
            };
        }
        catch (error) {
            logger_1.logger.error('Google sign-in failed:', error);
            throw error;
        }
    }
    async getUserInfo(tokens) {
        return this.verifyIdToken(tokens.idToken);
    }
    async findUserByGoogleId(googleId) {
        try {
            const result = await database_1.db.query('SELECT * FROM users WHERE google_id = $1 AND is_active = true', [googleId]);
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
    async createGoogleUser(googleUser) {
        try {
            const result = await database_1.db.query(`INSERT INTO users (
          email, name, google_id, google_email, 
          avatar_url, is_email_verified, auth_provider,
          role, is_active, preferences, created_at, updated_at
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
                true,
                JSON.stringify({
                    theme: 'light',
                    notifications: true,
                    language: googleUser.locale || 'en',
                }),
            ]);
            logger_1.logger.info('Created new Google user:', {
                userId: result.rows[0].id,
                email: googleUser.email,
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
             is_email_verified = CASE 
               WHEN is_email_verified = false THEN $4 
               ELSE is_email_verified 
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
             is_email_verified = CASE 
               WHEN is_email_verified = false THEN $2 
               ELSE is_email_verified 
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
            const { data: supabaseUser } = await this.supabaseClient.auth.admin.getUserById(user.id);
            if (!supabaseUser) {
                await this.supabaseClient.auth.admin.createUser({
                    id: user.id,
                    email: user.email,
                    email_confirm: googleUser.email_verified,
                    user_metadata: {
                        name: user.name,
                        avatar_url: user.avatar_url,
                        provider: 'google',
                        google_id: googleUser.sub,
                    },
                });
            }
            else {
                await this.supabaseClient.auth.admin.updateUserById(user.id, {
                    user_metadata: {
                        ...supabaseUser.user_metadata,
                        google_id: googleUser.sub,
                        last_sign_in_provider: 'google',
                    },
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error syncing with Supabase:', error);
        }
    }
    async generateTokens(user, deviceInfo) {
        const { generateTokens } = await Promise.resolve().then(() => __importStar(require('../../middleware/auth')));
        const mockReq = {
            headers: {
                'user-agent': deviceInfo?.deviceName || 'Google Auth',
            },
            ip: '127.0.0.1',
        };
        const tokens = generateTokens(user.id, user.email, user.role, mockReq);
        const refreshTokenKey = `refresh_token:${user.id}`;
        const refreshTokenData = {
            token: tokens.refreshToken,
            deviceInfo,
            createdAt: new Date().toISOString(),
        };
        await redis_1.redis.setEx(refreshTokenKey, 30 * 24 * 60 * 60, JSON.stringify(refreshTokenData));
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: 3600,
        };
    }
    async logAuthEvent(userId, eventType, platform, deviceInfo) {
        try {
            await database_1.db.query(`INSERT INTO auth_events (
          user_id, event_type, platform, device_info, 
          ip_address, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`, [
                userId,
                eventType,
                platform,
                deviceInfo ? JSON.stringify(deviceInfo) : null,
                deviceInfo?.ipAddress || null,
            ]);
        }
        catch (error) {
            logger_1.logger.error('Error logging auth event:', error);
        }
    }
    async refreshToken(refreshToken) {
        try {
            const { verifyRefreshToken } = await Promise.resolve().then(() => __importStar(require('../../middleware/auth')));
            const { userId } = verifyRefreshToken(refreshToken);
            const result = await database_1.db.query('SELECT * FROM users WHERE id = $1 AND is_active = true', [userId]);
            if (result.rows.length === 0) {
                throw new apiError_1.ApiError(401, 'User not found or inactive');
            }
            const user = result.rows[0];
            const storedTokenData = await redis_1.redis.get(`refresh_token:${userId}`);
            if (!storedTokenData) {
                throw new apiError_1.ApiError(401, 'Invalid refresh token');
            }
            const tokenData = JSON.parse(storedTokenData);
            if (tokenData.token !== refreshToken) {
                throw new apiError_1.ApiError(401, 'Token mismatch');
            }
            const newTokens = await this.generateTokens(user, tokenData.deviceInfo);
            await this.logAuthEvent(userId, 'token_refresh', 'api', tokenData.deviceInfo);
            return newTokens;
        }
        catch (error) {
            logger_1.logger.error('Token refresh failed:', error);
            throw error;
        }
    }
    async validateSession(userId) {
        try {
            const result = await database_1.db.query('SELECT * FROM users WHERE id = $1 AND is_active = true', [userId]);
            if (result.rows.length === 0) {
                return { valid: false };
            }
            const user = result.rows[0];
            const refreshTokenExists = await redis_1.redis.exists(`refresh_token:${userId}`);
            if (!refreshTokenExists) {
                return { valid: false };
            }
            return {
                valid: true,
                user: this.sanitizeUser(user),
            };
        }
        catch (error) {
            logger_1.logger.error('Session validation failed:', error);
            return { valid: false };
        }
    }
    async revokeAllTokens(userId) {
        try {
            await redis_1.redis.del(`refresh_token:${userId}`);
            await this.logAuthEvent(userId, 'tokens_revoked', 'api');
            logger_1.logger.info('All tokens revoked for user:', { userId });
        }
        catch (error) {
            logger_1.logger.error('Error revoking tokens:', error);
            throw new apiError_1.ApiError(500, 'Failed to revoke tokens');
        }
    }
    async verifyAccessToken(accessToken) {
        try {
            const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
            if (!response.ok) {
                throw new Error('Invalid access token');
            }
            const userData = await response.json();
            return {
                sub: userData.id,
                email: userData.email,
                email_verified: userData.verified_email || false,
                name: userData.name || '',
                given_name: userData.given_name,
                family_name: userData.family_name,
                picture: userData.picture,
                locale: userData.locale,
            };
        }
        catch (error) {
            logger_1.logger.error('Access token verification failed:', error);
            throw new apiError_1.ApiError(401, 'Invalid access token');
        }
    }
    generateOAuthState() {
        const crypto = require('crypto');
        return crypto.randomBytes(32).toString('hex');
    }
    validateOAuthState(state, storedState) {
        return state === storedState;
    }
    sanitizeUser(user) {
        const { password_hash, ...sanitized } = user;
        return {
            ...sanitized,
            preferences: typeof user.preferences === 'string'
                ? JSON.parse(user.preferences)
                : user.preferences,
        };
    }
}
exports.GoogleAuthService = GoogleAuthService;
exports.googleAuthService = new GoogleAuthService();
//# sourceMappingURL=GoogleAuthService.js.map