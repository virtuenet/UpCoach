"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedAuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
const redis_1 = require("./redis");
class EnhancedAuthService {
    static ACCESS_TOKEN_TTL = '1h';
    static REFRESH_TOKEN_TTL = '24h';
    static TOKEN_FAMILY_PREFIX = 'token_family:';
    static REVOKED_TOKENS_PREFIX = 'revoked_tokens:';
    static MAX_REFRESH_CHAIN_LENGTH = 10;
    /**
     * Generate a hash of the device fingerprint for consistent device identification
     */
    static hashDeviceFingerprint(fingerprint) {
        const data = `${fingerprint.userAgent}|${fingerprint.ip}|${fingerprint.acceptLanguage || ''}|${fingerprint.acceptEncoding || ''}`;
        return crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
    /**
     * Generate a new token pair with rotation tracking
     */
    static async generateTokenPair(userId, deviceFingerprint) {
        const family = (0, uuid_1.v4)();
        const deviceId = this.hashDeviceFingerprint(deviceFingerprint);
        const accessJti = (0, uuid_1.v4)();
        const refreshJti = (0, uuid_1.v4)();
        // Generate access token
        const accessToken = jsonwebtoken_1.default.sign({
            userId,
            type: 'access',
            deviceId,
            jti: accessJti,
        }, environment_1.config.jwt.secret, {
            expiresIn: this.ACCESS_TOKEN_TTL,
            issuer: 'upcoach-api',
            audience: 'upcoach-client',
        });
        // Generate refresh token with family tracking
        const refreshToken = jsonwebtoken_1.default.sign({
            userId,
            type: 'refresh',
            deviceId,
            family,
            jti: refreshJti,
        }, environment_1.config.jwt.refreshSecret || environment_1.config.jwt.secret, {
            expiresIn: this.REFRESH_TOKEN_TTL,
            issuer: 'upcoach-api',
            audience: 'upcoach-client',
        });
        // Store token family in Redis for tracking
        await this.storeTokenFamily(family, refreshJti, userId);
        // Log authentication event
        logger_1.logger.info('Token pair generated', {
            userId,
            family,
            deviceId: deviceId.substring(0, 8), // Log only first 8 chars for privacy
        });
        return { accessToken, refreshToken, family };
    }
    /**
     * Rotate refresh token with security checks
     */
    static async rotateRefreshToken(oldRefreshToken, deviceFingerprint) {
        try {
            // Verify the old refresh token
            const decoded = jsonwebtoken_1.default.verify(oldRefreshToken, environment_1.config.jwt.refreshSecret || environment_1.config.jwt.secret);
            const { userId, family, jti: oldJti, deviceId } = decoded;
            // Verify device fingerprint matches
            const currentDeviceId = this.hashDeviceFingerprint(deviceFingerprint);
            if (deviceId !== currentDeviceId) {
                logger_1.logger.warn('Device fingerprint mismatch during token rotation', {
                    userId,
                    family,
                    expectedDevice: deviceId.substring(0, 8),
                    actualDevice: currentDeviceId.substring(0, 8),
                });
                // Potential token theft - invalidate entire family
                await this.invalidateTokenFamily(family);
                return null;
            }
            // Check if token is in the valid family chain
            const isValidFamily = await this.validateTokenFamily(family, oldJti);
            if (!isValidFamily) {
                logger_1.logger.warn('Invalid token family detected', { userId, family });
                await this.invalidateTokenFamily(family);
                return null;
            }
            // Check if token has been revoked
            const isRevoked = await this.isTokenRevoked(oldJti);
            if (isRevoked) {
                logger_1.logger.warn('Attempted use of revoked token', { userId, jti: oldJti });
                return null;
            }
            // Generate new token pair
            const newAccessJti = (0, uuid_1.v4)();
            const newRefreshJti = (0, uuid_1.v4)();
            const accessToken = jsonwebtoken_1.default.sign({
                userId,
                type: 'access',
                deviceId,
                jti: newAccessJti,
            }, environment_1.config.jwt.secret, {
                expiresIn: this.ACCESS_TOKEN_TTL,
                issuer: 'upcoach-api',
                audience: 'upcoach-client',
            });
            const refreshToken = jsonwebtoken_1.default.sign({
                userId,
                type: 'refresh',
                deviceId,
                family,
                jti: newRefreshJti,
            }, environment_1.config.jwt.refreshSecret || environment_1.config.jwt.secret, {
                expiresIn: this.REFRESH_TOKEN_TTL,
                issuer: 'upcoach-api',
                audience: 'upcoach-client',
            });
            // Update token family chain
            await this.updateTokenFamily(family, oldJti, newRefreshJti);
            // Revoke the old refresh token
            await this.revokeToken(oldJti);
            logger_1.logger.info('Token rotated successfully', {
                userId,
                family,
                oldJti: oldJti.substring(0, 8),
                newJti: newRefreshJti.substring(0, 8),
            });
            return { accessToken, refreshToken, family: family };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                logger_1.logger.warn('Expired refresh token used for rotation');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                logger_1.logger.error('Invalid refresh token used for rotation', { error });
            }
            else {
                logger_1.logger.error('Token rotation error', { error });
            }
            return null;
        }
    }
    /**
     * Validate access token
     */
    static async validateAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret, {
                issuer: 'upcoach-api',
                audience: 'upcoach-client',
            });
            // Check if token has been revoked
            const isRevoked = await this.isTokenRevoked(decoded.jti);
            if (isRevoked) {
                logger_1.logger.warn('Revoked access token used', { jti: decoded.jti });
                return null;
            }
            // Verify token type
            if (decoded.type !== 'access') {
                logger_1.logger.warn('Invalid token type for access', { type: decoded.type });
                return null;
            }
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                logger_1.logger.debug('Access token expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                logger_1.logger.warn('Invalid access token', { error });
            }
            return null;
        }
    }
    /**
     * Logout user by invalidating tokens
     */
    static async logout(userId, refreshToken, logoutAllDevices = false) {
        try {
            if (logoutAllDevices) {
                // Invalidate all token families for the user
                await this.invalidateAllUserTokens(userId);
                logger_1.logger.info('User logged out from all devices', { userId });
            }
            else if (refreshToken) {
                // Invalidate specific token family
                const decoded = jsonwebtoken_1.default.decode(refreshToken);
                if (decoded && decoded.family) {
                    await this.invalidateTokenFamily(decoded.family);
                    logger_1.logger.info('User logged out from device', {
                        userId,
                        family: decoded.family,
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Logout error', { userId, error });
            throw error;
        }
    }
    /**
     * Store token family in Redis
     */
    static async storeTokenFamily(family, jti, userId) {
        const key = `${this.TOKEN_FAMILY_PREFIX}${family}`;
        const data = {
            currentJti: jti,
            userId,
            chainLength: 1,
            createdAt: new Date().toISOString(),
            lastRotated: new Date().toISOString(),
        };
        await redis_1.redis.setEx(key, 24 * 60 * 60, // 24 hours TTL
        JSON.stringify(data));
        // Also maintain a set of active families per user
        await redis_1.redis.sadd(`user_families:${userId}`, family);
        await redis_1.redis.expire(`user_families:${userId}`, 24 * 60 * 60);
    }
    /**
     * Update token family chain
     */
    static async updateTokenFamily(family, oldJti, newJti) {
        const key = `${this.TOKEN_FAMILY_PREFIX}${family}`;
        const dataStr = await redis_1.redis.get(key);
        if (!dataStr) {
            throw new Error('Token family not found');
        }
        const data = JSON.parse(dataStr);
        // Check chain length to prevent infinite chains
        if (data.chainLength >= this.MAX_REFRESH_CHAIN_LENGTH) {
            throw new Error('Max refresh chain length exceeded');
        }
        data.previousJti = oldJti;
        data.currentJti = newJti;
        data.chainLength += 1;
        data.lastRotated = new Date().toISOString();
        await redis_1.redis.setEx(key, 24 * 60 * 60, // Reset TTL
        JSON.stringify(data));
    }
    /**
     * Validate token family
     */
    static async validateTokenFamily(family, jti) {
        const key = `${this.TOKEN_FAMILY_PREFIX}${family}`;
        const dataStr = await redis_1.redis.get(key);
        if (!dataStr) {
            return false;
        }
        const data = JSON.parse(dataStr);
        return data.currentJti === jti || data.previousJti === jti;
    }
    /**
     * Invalidate token family
     */
    static async invalidateTokenFamily(family) {
        const key = `${this.TOKEN_FAMILY_PREFIX}${family}`;
        const dataStr = await redis_1.redis.get(key);
        if (dataStr) {
            const data = JSON.parse(dataStr);
            // Revoke all tokens in the family
            if (data.currentJti) {
                await this.revokeToken(data.currentJti);
            }
            if (data.previousJti) {
                await this.revokeToken(data.previousJti);
            }
            // Remove family from user's active families
            if (data.userId) {
                await redis_1.redis.srem(`user_families:${data.userId}`, family);
            }
        }
        await redis_1.redis.del(key);
    }
    /**
     * Invalidate all tokens for a user
     */
    static async invalidateAllUserTokens(userId) {
        const families = await redis_1.redis.smembers(`user_families:${userId}`);
        for (const family of families) {
            await this.invalidateTokenFamily(family);
        }
        await redis_1.redis.del(`user_families:${userId}`);
    }
    /**
     * Revoke a specific token
     */
    static async revokeToken(jti) {
        const key = `${this.REVOKED_TOKENS_PREFIX}${jti}`;
        await redis_1.redis.setEx(key, 24 * 60 * 60, // Keep for 24 hours
        '1');
    }
    /**
     * Check if token is revoked
     */
    static async isTokenRevoked(jti) {
        const key = `${this.REVOKED_TOKENS_PREFIX}${jti}`;
        const result = await redis_1.redis.get(key);
        return result === '1';
    }
    /**
     * Clean up expired token data (maintenance task)
     */
    static async cleanupExpiredTokens() {
        try {
            // This should be called periodically (e.g., daily)
            const pattern = `${this.TOKEN_FAMILY_PREFIX}*`;
            const keys = await redis_1.redis.keys(pattern);
            let cleaned = 0;
            for (const key of keys) {
                const ttl = await redis_1.redis.ttl(key);
                if (ttl === -2 || ttl === -1) {
                    // Key doesn't exist or has no TTL
                    await redis_1.redis.del(key);
                    cleaned++;
                }
            }
            if (cleaned > 0) {
                logger_1.logger.info('Cleaned up expired token families', { count: cleaned });
            }
        }
        catch (error) {
            logger_1.logger.error('Token cleanup error', { error });
        }
    }
}
exports.EnhancedAuthService = EnhancedAuthService;
// Export for backward compatibility
exports.default = EnhancedAuthService;
//# sourceMappingURL=EnhancedAuthService.js.map