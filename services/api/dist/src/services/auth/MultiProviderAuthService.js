"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiProviderAuthService = exports.MultiProviderAuthService = void 0;
const GoogleAuthService_1 = require("./GoogleAuthService");
const SecureGoogleAuthService_1 = require("./SecureGoogleAuthService");
const AppleAuthService_1 = require("./AppleAuthService");
const FacebookAuthService_1 = require("./FacebookAuthService");
const logger_1 = require("../../utils/logger");
const apiError_1 = require("../../utils/apiError");
const redis_1 = require("../redis");
const database_1 = require("../database");
class MultiProviderAuthService {
    static instance;
    PROVIDER_CAPABILITIES = {
        google: {
            emailVerification: true,
            realUserValidation: false,
            refreshTokenSupport: true,
            webhookSupport: false,
            securityFeatures: ['PKCE', 'nonce', 'state', 'hosted_domain'],
        },
        apple: {
            emailVerification: true,
            realUserValidation: true,
            refreshTokenSupport: true,
            webhookSupport: false,
            securityFeatures: ['PKCE', 'nonce', 'real_user_status'],
        },
        facebook: {
            emailVerification: false,
            realUserValidation: false,
            refreshTokenSupport: true,
            webhookSupport: true,
            securityFeatures: ['webhook_verification', 'long_lived_tokens'],
        },
    };
    constructor() { }
    static getInstance() {
        if (!MultiProviderAuthService.instance) {
            MultiProviderAuthService.instance = new MultiProviderAuthService();
        }
        return MultiProviderAuthService.instance;
    }
    async authenticate(request) {
        const startTime = process.hrtime.bigint();
        try {
            this.validateAuthRequest(request);
            await this.checkProviderRateLimit(request.provider, request.deviceInfo?.ipAddress);
            let authResult;
            switch (request.provider) {
                case 'google':
                    authResult = await this.authenticateWithGoogle(request);
                    break;
                case 'apple':
                    authResult = await this.authenticateWithApple(request);
                    break;
                case 'facebook':
                    authResult = await this.authenticateWithFacebook(request);
                    break;
                default:
                    throw new apiError_1.ApiError(400, `Unsupported authentication provider: ${request.provider}`);
            }
            const linkedAccounts = await this.getLinkedAccounts(authResult.user.id);
            await this.logUnifiedAuthEvent(authResult.user.id, request.provider, {
                platform: request.platform,
                isNewUser: authResult.isNewUser,
                linkedAccounts,
                securityLevel: request.securityLevel || 'standard',
                deviceInfo: request.deviceInfo,
            });
            const endTime = process.hrtime.bigint();
            const totalTime = Number(endTime - startTime) / 1000000;
            logger_1.logger.info('Unified authentication completed', {
                provider: request.provider,
                userId: authResult.user.id,
                platform: request.platform,
                isNewUser: authResult.isNewUser,
                linkedAccountsCount: linkedAccounts.length,
                processingTime: `${totalTime.toFixed(2)}ms`,
            });
            return {
                ...authResult,
                provider: request.provider,
                accountsLinked: linkedAccounts,
            };
        }
        catch (error) {
            await this.logUnifiedAuthEvent(null, request.provider, {
                platform: request.platform,
                error: error instanceof Error ? error.message : 'Unknown error',
                deviceInfo: request.deviceInfo,
                success: false,
            });
            logger_1.logger.error('Unified authentication failed:', {
                provider: request.provider,
                platform: request.platform,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async authenticateWithGoogle(request) {
        if (!request.credentials.idToken) {
            throw new apiError_1.ApiError(400, 'Google ID token is required');
        }
        const service = request.securityLevel === 'enhanced'
            ? SecureGoogleAuthService_1.secureGoogleAuthService
            : GoogleAuthService_1.googleAuthService;
        if (request.securityLevel === 'enhanced') {
            return service.signIn({
                idToken: request.credentials.idToken,
                platform: request.platform,
                deviceInfo: request.deviceInfo,
                nonce: request.nonce,
            });
        }
        else {
            return service.signIn(request.credentials.idToken, request.platform, request.deviceInfo);
        }
    }
    async authenticateWithApple(request) {
        if (!request.credentials.idToken) {
            throw new apiError_1.ApiError(400, 'Apple identity token is required');
        }
        return AppleAuthService_1.appleAuthService.signIn({
            identityToken: request.credentials.idToken,
            authorizationCode: request.credentials.authorizationCode,
            user: request.credentials.user,
            platform: request.platform,
            deviceInfo: request.deviceInfo,
            nonce: request.nonce,
        });
    }
    async authenticateWithFacebook(request) {
        if (!request.credentials.accessToken) {
            throw new apiError_1.ApiError(400, 'Facebook access token is required');
        }
        return FacebookAuthService_1.facebookAuthService.signIn({
            accessToken: request.credentials.accessToken,
            platform: request.platform,
            deviceInfo: request.deviceInfo,
            permissions: request.credentials.permissions,
        });
    }
    async linkProvider(userId, provider, credentials, platform = 'web') {
        try {
            const user = await this.getUserById(userId);
            if (!user) {
                throw new apiError_1.ApiError(404, 'User not found');
            }
            if (await this.isProviderLinked(userId, provider)) {
                throw new apiError_1.ApiError(409, `${provider} account is already linked to this user`);
            }
            let providerUserId;
            let providerEmail;
            switch (provider) {
                case 'google':
                    const googleResult = await GoogleAuthService_1.googleAuthService.verifyIdToken(credentials.idToken, platform);
                    providerUserId = googleResult.sub;
                    providerEmail = googleResult.email;
                    break;
                case 'apple':
                    const appleResult = await AppleAuthService_1.appleAuthService.verifyIdentityToken(credentials.idToken, platform);
                    providerUserId = appleResult.sub;
                    providerEmail = appleResult.email;
                    break;
                case 'facebook':
                    const facebookTokenValidation = await FacebookAuthService_1.facebookAuthService.validateAccessToken(credentials.accessToken);
                    const facebookUser = await FacebookAuthService_1.facebookAuthService.getUserInfo(credentials.accessToken);
                    providerUserId = facebookUser.id;
                    providerEmail = facebookUser.email;
                    break;
                default:
                    throw new apiError_1.ApiError(400, `Unsupported provider for linking: ${provider}`);
            }
            if (user.email && providerEmail &&
                user.email.toLowerCase() !== providerEmail.toLowerCase()) {
                throw new apiError_1.ApiError(403, 'Email addresses do not match between accounts');
            }
            const existingUserWithProvider = await this.findUserByProviderId(provider, providerUserId);
            if (existingUserWithProvider && existingUserWithProvider.id !== userId) {
                throw new apiError_1.ApiError(409, `This ${provider} account is already linked to another user`);
            }
            await this.linkProviderToUser(userId, provider, providerUserId, providerEmail);
            const linkedAccounts = await this.getLinkedAccounts(userId);
            await this.logUnifiedAuthEvent(userId, provider, {
                action: 'account_linked',
                platform,
                linkedAccounts,
            });
            logger_1.logger.info('Provider account linked successfully', {
                userId,
                provider,
                providerUserId,
                totalLinkedAccounts: linkedAccounts.length,
            });
            return {
                success: true,
                linkedProvider: provider,
                accountsLinked: linkedAccounts,
            };
        }
        catch (error) {
            logger_1.logger.error('Provider linking failed:', {
                userId,
                provider,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async unlinkProvider(userId, provider) {
        try {
            const user = await this.getUserById(userId);
            if (!user) {
                throw new apiError_1.ApiError(404, 'User not found');
            }
            const linkedAccounts = await this.getLinkedAccounts(userId);
            if (linkedAccounts.length <= 1 && !user.password_hash) {
                throw new apiError_1.ApiError(400, 'Cannot unlink the only authentication method. Please set a password or link another account first.');
            }
            if (!linkedAccounts.includes(provider)) {
                throw new apiError_1.ApiError(404, `${provider} account is not linked to this user`);
            }
            await this.unlinkProviderFromUser(userId, provider);
            const updatedLinkedAccounts = await this.getLinkedAccounts(userId);
            await this.logUnifiedAuthEvent(userId, provider, {
                action: 'account_unlinked',
                remainingProviders: updatedLinkedAccounts,
            });
            logger_1.logger.info('Provider account unlinked successfully', {
                userId,
                provider,
                remainingLinkedAccounts: updatedLinkedAccounts.length,
            });
            return {
                success: true,
                unlinkedProvider: provider,
                accountsLinked: updatedLinkedAccounts,
            };
        }
        catch (error) {
            logger_1.logger.error('Provider unlinking failed:', {
                userId,
                provider,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getUserAuthStatus(userId) {
        try {
            const user = await this.getUserById(userId);
            if (!user) {
                throw new apiError_1.ApiError(404, 'User not found');
            }
            const linkedAccounts = await this.getLinkedAccounts(userId);
            const primaryProvider = user.auth_provider;
            const linkedProviders = await Promise.all(linkedAccounts.map(async (provider) => {
                const linkInfo = await this.getProviderLinkInfo(userId, provider);
                return {
                    provider,
                    linkedAt: linkInfo.linkedAt,
                    verified: linkInfo.verified,
                    capabilities: this.PROVIDER_CAPABILITIES[provider],
                };
            }));
            const securityScore = this.calculateSecurityScore(user, linkedProviders);
            const recommendations = this.generateSecurityRecommendations(user, linkedProviders);
            return {
                userId,
                primaryProvider,
                linkedProviders,
                hasPassword: !!user.password_hash,
                securityScore,
                recommendations,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user auth status:', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    getProviderCapabilities(provider) {
        if (provider) {
            return this.PROVIDER_CAPABILITIES[provider];
        }
        return this.PROVIDER_CAPABILITIES;
    }
    async handleProviderWebhook(provider, event, payload, signature) {
        try {
            let processed = false;
            switch (provider) {
                case 'facebook':
                    if (signature) {
                        const isValid = FacebookAuthService_1.facebookAuthService.verifyWebhookSignature(JSON.stringify(payload), signature);
                        if (!isValid) {
                            throw new apiError_1.ApiError(401, 'Invalid Facebook webhook signature');
                        }
                    }
                    if (event === 'deauthorize' && payload.user_id) {
                        await FacebookAuthService_1.facebookAuthService.handleDeauthorization(payload.user_id);
                        processed = true;
                    }
                    break;
                default:
                    logger_1.logger.warn('Webhook not supported for provider', { provider, event });
                    break;
            }
            await this.logUnifiedAuthEvent(null, provider, {
                action: 'webhook_received',
                event,
                processed,
            });
            return { success: true, processed };
        }
        catch (error) {
            logger_1.logger.error('Provider webhook handling failed:', {
                provider,
                event,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    validateAuthRequest(request) {
        if (!request.provider) {
            throw new apiError_1.ApiError(400, 'Authentication provider is required');
        }
        if (!request.platform) {
            throw new apiError_1.ApiError(400, 'Platform is required');
        }
        if (!request.credentials) {
            throw new apiError_1.ApiError(400, 'Provider credentials are required');
        }
        switch (request.provider) {
            case 'google':
            case 'apple':
                if (!request.credentials.idToken) {
                    throw new apiError_1.ApiError(400, `${request.provider} ID token is required`);
                }
                break;
            case 'facebook':
                if (!request.credentials.accessToken) {
                    throw new apiError_1.ApiError(400, 'Facebook access token is required');
                }
                break;
        }
    }
    async checkProviderRateLimit(provider, ipAddress) {
        const rateLimitKey = `multi_provider_auth:${provider}:${ipAddress || 'unknown'}`;
        const attempts = await redis_1.redis.incr(rateLimitKey);
        if (attempts === 1) {
            await redis_1.redis.expire(rateLimitKey, 300);
        }
        const limits = {
            google: 10,
            apple: 8,
            facebook: 6,
        };
        if (attempts > limits[provider]) {
            throw new apiError_1.ApiError(429, `Too many ${provider} authentication attempts. Please try again later.`);
        }
    }
    async getUserById(userId) {
        try {
            const result = await database_1.db.query('SELECT * FROM users WHERE id = $1', [userId]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('Error getting user by ID:', error);
            return null;
        }
    }
    async getLinkedAccounts(userId) {
        try {
            const result = await database_1.db.query(`SELECT google_id, apple_id, facebook_id FROM users WHERE id = $1`, [userId]);
            if (!result.rows[0]) {
                return [];
            }
            const user = result.rows[0];
            const linked = [];
            if (user.google_id)
                linked.push('google');
            if (user.apple_id)
                linked.push('apple');
            if (user.facebook_id)
                linked.push('facebook');
            return linked;
        }
        catch (error) {
            logger_1.logger.error('Error getting linked accounts:', error);
            return [];
        }
    }
    async isProviderLinked(userId, provider) {
        const linkedAccounts = await this.getLinkedAccounts(userId);
        return linkedAccounts.includes(provider);
    }
    async findUserByProviderId(provider, providerId) {
        try {
            const column = `${provider}_id`;
            const result = await database_1.db.query(`SELECT * FROM users WHERE ${column} = $1`, [providerId]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('Error finding user by provider ID:', error);
            return null;
        }
    }
    async linkProviderToUser(userId, provider, providerId, email) {
        try {
            const column = `${provider}_id`;
            await database_1.db.query(`UPDATE users SET ${column} = $1, updated_at = NOW() WHERE id = $2`, [providerId, userId]);
        }
        catch (error) {
            logger_1.logger.error('Error linking provider to user:', error);
            throw new apiError_1.ApiError(500, 'Failed to link provider account');
        }
    }
    async unlinkProviderFromUser(userId, provider) {
        try {
            const column = `${provider}_id`;
            await database_1.db.query(`UPDATE users SET ${column} = NULL, updated_at = NOW() WHERE id = $1`, [userId]);
        }
        catch (error) {
            logger_1.logger.error('Error unlinking provider from user:', error);
            throw new apiError_1.ApiError(500, 'Failed to unlink provider account');
        }
    }
    async getProviderLinkInfo(userId, provider) {
        try {
            const result = await database_1.db.query('SELECT created_at, email_verified FROM users WHERE id = $1', [userId]);
            const user = result.rows[0];
            return {
                linkedAt: user?.created_at || new Date().toISOString(),
                verified: user?.email_verified || false,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting provider link info:', error);
            return {
                linkedAt: new Date().toISOString(),
                verified: false,
            };
        }
    }
    calculateSecurityScore(user, linkedProviders) {
        let score = 0;
        score += 20;
        if (user.email_verified)
            score += 15;
        if (user.password_hash)
            score += 15;
        score += Math.min(linkedProviders.length * 10, 30);
        for (const provider of linkedProviders) {
            if (provider.capabilities.realUserValidation)
                score += 5;
            if (provider.capabilities.emailVerification)
                score += 5;
            score += provider.capabilities.securityFeatures.length * 2;
        }
        return Math.min(score, 100);
    }
    generateSecurityRecommendations(user, linkedProviders) {
        const recommendations = [];
        if (!user.email_verified) {
            recommendations.push('Verify your email address to improve account security');
        }
        if (!user.password_hash) {
            recommendations.push('Set a password as a backup authentication method');
        }
        if (linkedProviders.length < 2) {
            recommendations.push('Link additional authentication providers for better security');
        }
        const hasRealUserValidation = linkedProviders.some(p => p.capabilities.realUserValidation);
        if (!hasRealUserValidation) {
            recommendations.push('Consider linking Apple Sign-In for enhanced user verification');
        }
        if (linkedProviders.length === 1 && !user.password_hash) {
            recommendations.push('Add a backup authentication method to prevent account lockout');
        }
        return recommendations;
    }
    async logUnifiedAuthEvent(userId, provider, details) {
        try {
            await database_1.db.query(`INSERT INTO security_events (
          user_id, event_type, platform, details,
          ip_address, user_agent, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`, [
                userId,
                `multi_provider_auth_${provider}`,
                details.platform || 'unknown',
                JSON.stringify(details),
                details.deviceInfo?.ipAddress || null,
                details.deviceInfo?.userAgent || null,
            ]);
        }
        catch (error) {
            logger_1.logger.error('Error logging unified auth event:', error);
        }
    }
}
exports.MultiProviderAuthService = MultiProviderAuthService;
exports.multiProviderAuthService = MultiProviderAuthService.getInstance();
//# sourceMappingURL=MultiProviderAuthService.js.map