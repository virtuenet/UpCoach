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
exports.EnhancedAuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jwt = __importStar(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
const redis_1 = require("./redis");
class EnhancedAuthService {
    static ACCESS_TOKEN_TTL = '1h';
    static REFRESH_TOKEN_TTL = '24h';
    static TOKEN_FAMILY_PREFIX = 'token_family:';
    static REVOKED_TOKENS_PREFIX = 'revoked_tokens:';
    static MAX_REFRESH_CHAIN_LENGTH = 10;
    static hashDeviceFingerprint(fingerprint) {
        const data = `${fingerprint.userAgent}|${fingerprint.ip}|${fingerprint.acceptLanguage || ''}|${fingerprint.acceptEncoding || ''}`;
        return crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
    static async generateTokenPair(userId, deviceFingerprint) {
        const family = (0, uuid_1.v4)();
        const deviceId = this.hashDeviceFingerprint(deviceFingerprint);
        const accessJti = (0, uuid_1.v4)();
        const refreshJti = (0, uuid_1.v4)();
        const accessToken = jwt.sign({
            userId,
            type: 'access',
            deviceId,
            jti: accessJti,
        }, environment_1.config.jwt.secret, {
            expiresIn: this.ACCESS_TOKEN_TTL,
            issuer: 'upcoach-api',
            audience: 'upcoach-client',
        });
        const refreshToken = jwt.sign({
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
        await this.storeTokenFamily(family, refreshJti, userId);
        logger_1.logger.info('Token pair generated', {
            userId,
            family,
            deviceId: deviceId.substring(0, 8),
        });
        return { accessToken, refreshToken, family };
    }
    static async rotateRefreshToken(oldRefreshToken, deviceFingerprint) {
        try {
            const decoded = jwt.verify(oldRefreshToken, environment_1.config.jwt.refreshSecret || environment_1.config.jwt.secret);
            const { userId, family, jti: oldJti, deviceId } = decoded;
            const currentDeviceId = this.hashDeviceFingerprint(deviceFingerprint);
            if (deviceId !== currentDeviceId) {
                logger_1.logger.warn('Device fingerprint mismatch during token rotation', {
                    userId,
                    family,
                    expectedDevice: deviceId.substring(0, 8),
                    actualDevice: currentDeviceId.substring(0, 8),
                });
                await this.invalidateTokenFamily(family);
                return null;
            }
            const isValidFamily = await this.validateTokenFamily(family, oldJti);
            if (!isValidFamily) {
                logger_1.logger.warn('Invalid token family detected', { userId, family });
                await this.invalidateTokenFamily(family);
                return null;
            }
            const isRevoked = await this.isTokenRevoked(oldJti);
            if (isRevoked) {
                logger_1.logger.warn('Attempted use of revoked token', { userId, jti: oldJti });
                return null;
            }
            const newAccessJti = (0, uuid_1.v4)();
            const newRefreshJti = (0, uuid_1.v4)();
            const accessToken = jwt.sign({
                userId,
                type: 'access',
                deviceId,
                jti: newAccessJti,
            }, environment_1.config.jwt.secret, {
                expiresIn: this.ACCESS_TOKEN_TTL,
                issuer: 'upcoach-api',
                audience: 'upcoach-client',
            });
            const refreshToken = jwt.sign({
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
            await this.updateTokenFamily(family, oldJti, newRefreshJti);
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
            if (error instanceof jwt.TokenExpiredError) {
                logger_1.logger.warn('Expired refresh token used for rotation');
            }
            else if (error instanceof jwt.JsonWebTokenError) {
                logger_1.logger.error('Invalid refresh token used for rotation', { error });
            }
            else {
                logger_1.logger.error('Token rotation error', { error });
            }
            return null;
        }
    }
    static async validateAccessToken(token) {
        try {
            const decoded = jwt.verify(token, environment_1.config.jwt.secret, {
                issuer: 'upcoach-api',
                audience: 'upcoach-client',
            });
            const isRevoked = await this.isTokenRevoked(decoded.jti);
            if (isRevoked) {
                logger_1.logger.warn('Revoked access token used', { jti: decoded.jti });
                return null;
            }
            if (decoded.type !== 'access') {
                logger_1.logger.warn('Invalid token type for access', { type: decoded.type });
                return null;
            }
            return decoded;
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                logger_1.logger.debug('Access token expired');
            }
            else if (error instanceof jwt.JsonWebTokenError) {
                logger_1.logger.warn('Invalid access token', { error });
            }
            return null;
        }
    }
    static async logout(userId, refreshToken, logoutAllDevices = false) {
        try {
            if (logoutAllDevices) {
                await this.invalidateAllUserTokens(userId);
                logger_1.logger.info('User logged out from all devices', { userId });
            }
            else if (refreshToken) {
                const decoded = jwt.decode(refreshToken);
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
    static async storeTokenFamily(family, jti, userId) {
        const key = `${this.TOKEN_FAMILY_PREFIX}${family}`;
        const data = {
            currentJti: jti,
            userId,
            chainLength: 1,
            createdAt: new Date().toISOString(),
            lastRotated: new Date().toISOString(),
        };
        await redis_1.redis.setEx(key, 24 * 60 * 60, JSON.stringify(data));
        await redis_1.redis.sadd(`user_families:${userId}`, family);
        await redis_1.redis.expire(`user_families:${userId}`, 24 * 60 * 60);
    }
    static async updateTokenFamily(family, oldJti, newJti) {
        const key = `${this.TOKEN_FAMILY_PREFIX}${family}`;
        const dataStr = await redis_1.redis.get(key);
        if (!dataStr) {
            throw new Error('Token family not found');
        }
        const data = JSON.parse(dataStr);
        if (data.chainLength >= this.MAX_REFRESH_CHAIN_LENGTH) {
            throw new Error('Max refresh chain length exceeded');
        }
        data.previousJti = oldJti;
        data.currentJti = newJti;
        data.chainLength += 1;
        data.lastRotated = new Date().toISOString();
        await redis_1.redis.setEx(key, 24 * 60 * 60, JSON.stringify(data));
    }
    static async validateTokenFamily(family, jti) {
        const key = `${this.TOKEN_FAMILY_PREFIX}${family}`;
        const dataStr = await redis_1.redis.get(key);
        if (!dataStr) {
            return false;
        }
        const data = JSON.parse(dataStr);
        return data.currentJti === jti || data.previousJti === jti;
    }
    static async invalidateTokenFamily(family) {
        const key = `${this.TOKEN_FAMILY_PREFIX}${family}`;
        const dataStr = await redis_1.redis.get(key);
        if (dataStr) {
            const data = JSON.parse(dataStr);
            if (data.currentJti) {
                await this.revokeToken(data.currentJti);
            }
            if (data.previousJti) {
                await this.revokeToken(data.previousJti);
            }
            if (data.userId) {
                await redis_1.redis.srem(`user_families:${data.userId}`, family);
            }
        }
        await redis_1.redis.del(key);
    }
    static async invalidateAllUserTokens(userId) {
        const families = await redis_1.redis.smembers(`user_families:${userId}`);
        for (const family of families) {
            await this.invalidateTokenFamily(family);
        }
        await redis_1.redis.del(`user_families:${userId}`);
    }
    static async revokeToken(jti) {
        const key = `${this.REVOKED_TOKENS_PREFIX}${jti}`;
        await redis_1.redis.setEx(key, 24 * 60 * 60, '1');
    }
    static async isTokenRevoked(jti) {
        const key = `${this.REVOKED_TOKENS_PREFIX}${jti}`;
        const result = await redis_1.redis.get(key);
        return result === '1';
    }
    static async cleanupExpiredTokens() {
        try {
            const pattern = `${this.TOKEN_FAMILY_PREFIX}*`;
            const keys = await redis_1.redis.keys(pattern);
            let cleaned = 0;
            for (const key of keys) {
                const ttl = await redis_1.redis.ttl(key);
                if (ttl === -2 || ttl === -1) {
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
    async hashPassword(password) {
        const bcrypt = require('bcryptjs');
        return bcrypt.hash(password, 12);
    }
    async generateDeviceFingerprint(deviceInfo, options) {
        let data = JSON.stringify(deviceInfo);
        if (options?.ageInDays) {
            data += `|age:${options.ageInDays}`;
        }
        return crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
    validateFingerprintEntropy(fingerprint) {
        return /^[a-f0-9]{64}$/.test(fingerprint);
    }
    validateDeviceConsistency(deviceInfo) {
        return deviceInfo && typeof deviceInfo === 'object';
    }
    validateFingerprintSimilarity(fp1, fp2) {
        return fp1 === fp2;
    }
    isFingerprintFamily(fp1, fp2) {
        return fp1.substring(0, 32) === fp2.substring(0, 32);
    }
    async verifyTokenWithFingerprint(token, fingerprint) {
        try {
            const payload = await EnhancedAuthService.validateAccessToken(token);
            if (payload) {
                return { valid: true, userId: payload.userId };
            }
            else {
                return { valid: false, reason: 'Invalid token' };
            }
        }
        catch (error) {
            return { valid: false, reason: 'Token verification failed' };
        }
    }
}
exports.EnhancedAuthService = EnhancedAuthService;
exports.default = EnhancedAuthService;
//# sourceMappingURL=EnhancedAuthService.js.map