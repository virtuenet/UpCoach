"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoFactorAuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const qrcode_1 = __importDefault(require("qrcode"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const logger_1 = require("../utils/logger");
const redis_1 = require("./redis");
class TwoFactorAuthService {
    static instance;
    issuer = process.env.APP_NAME || 'UpCoach';
    backupCodeCount = 10;
    backupCodeLength = 8;
    totpWindow = 2;
    constructor() { }
    static getInstance() {
        if (!TwoFactorAuthService.instance) {
            TwoFactorAuthService.instance = new TwoFactorAuthService();
        }
        return TwoFactorAuthService.instance;
    }
    async generateTOTPSecret(userId, email) {
        try {
            const secret = speakeasy_1.default.generateSecret({
                length: 32,
                name: `${this.issuer} (${email})`,
                issuer: this.issuer,
            });
            const qrCode = await qrcode_1.default.toDataURL(secret.otpauth_url);
            const backupCodes = this.generateBackupCodes();
            const tempKey = `2fa:setup:${userId}`;
            await redis_1.redis.setEx(tempKey, 600, JSON.stringify({
                secret: secret.base32,
                backupCodes,
                timestamp: Date.now(),
            }));
            logger_1.logger.info('Generated TOTP secret for user', { userId });
            return {
                secret,
                qrCode,
                backupCodes,
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating TOTP secret', error);
            throw new Error('Failed to generate 2FA secret');
        }
    }
    async verifyAndEnableTOTP(userId, token) {
        try {
            const tempKey = `2fa:setup:${userId}`;
            const tempData = await redis_1.redis.get(tempKey);
            if (!tempData) {
                throw new Error('2FA setup session expired. Please start again.');
            }
            const { secret, backupCodes } = JSON.parse(tempData);
            const verified = speakeasy_1.default.totp.verify({
                secret,
                encoding: 'base32',
                token,
                window: this.totpWindow,
            });
            if (!verified) {
                return { success: false };
            }
            const configKey = `2fa:config:${userId}`;
            const config = {
                userId,
                method: 'totp',
                enabled: true,
                secret,
                backupCodes,
                verifiedAt: new Date(),
            };
            await redis_1.redis.set(configKey, JSON.stringify(config));
            await redis_1.redis.del(tempKey);
            logger_1.logger.info('2FA enabled for user', { userId });
            return {
                success: true,
                backupCodes,
            };
        }
        catch (error) {
            logger_1.logger.error('Error verifying TOTP', error);
            throw error;
        }
    }
    async verifyTOTP(userId, token) {
        try {
            const config = await this.get2FAConfig(userId);
            if (!config || !config.enabled || config.method !== 'totp') {
                return false;
            }
            if (config.backupCodes?.includes(token)) {
                return await this.useBackupCode(userId, token);
            }
            const verified = speakeasy_1.default.totp.verify({
                secret: config.secret,
                encoding: 'base32',
                token,
                window: this.totpWindow,
            });
            if (verified) {
                config.lastUsedAt = new Date();
                await this.update2FAConfig(userId, config);
                logger_1.logger.info('TOTP verification successful', { userId });
            }
            return verified;
        }
        catch (error) {
            logger_1.logger.error('Error verifying TOTP', error);
            return false;
        }
    }
    async disable2FA(userId) {
        try {
            const configKey = `2fa:config:${userId}`;
            await redis_1.redis.del(configKey);
            const trustedDevicesKey = `2fa:trusted:${userId}`;
            await redis_1.redis.del(trustedDevicesKey);
            logger_1.logger.info('2FA disabled for user', { userId });
        }
        catch (error) {
            logger_1.logger.error('Error disabling 2FA', error);
            throw new Error('Failed to disable 2FA');
        }
    }
    generateBackupCodes(count = this.backupCodeCount) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = crypto_1.default
                .randomBytes(this.backupCodeLength)
                .toString('hex')
                .substring(0, this.backupCodeLength)
                .toUpperCase();
            codes.push(code);
        }
        return codes;
    }
    async regenerateBackupCodes(userId) {
        try {
            const config = await this.get2FAConfig(userId);
            if (!config || !config.enabled) {
                throw new Error('2FA is not enabled');
            }
            const newCodes = this.generateBackupCodes();
            config.backupCodes = newCodes;
            await this.update2FAConfig(userId, config);
            logger_1.logger.info('Regenerated backup codes for user', { userId });
            return newCodes;
        }
        catch (error) {
            logger_1.logger.error('Error regenerating backup codes', error);
            throw error;
        }
    }
    async useBackupCode(userId, code) {
        try {
            const config = await this.get2FAConfig(userId);
            if (!config || !config.backupCodes) {
                return false;
            }
            const codeIndex = config.backupCodes.indexOf(code);
            if (codeIndex === -1) {
                return false;
            }
            config.backupCodes.splice(codeIndex, 1);
            config.lastUsedAt = new Date();
            await this.update2FAConfig(userId, config);
            logger_1.logger.info('Backup code used', { userId, remainingCodes: config.backupCodes.length });
            if (config.backupCodes.length <= 2) {
                logger_1.logger.warn('User running low on backup codes', {
                    userId,
                    remaining: config.backupCodes.length,
                });
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error using backup code', error);
            return false;
        }
    }
    async addTrustedDevice(userId, deviceInfo) {
        try {
            const device = {
                id: crypto_1.default.randomBytes(16).toString('hex'),
                name: deviceInfo.name,
                fingerprint: deviceInfo.fingerprint,
                addedAt: new Date(),
                lastUsedAt: new Date(),
                userAgent: deviceInfo.userAgent,
                ipAddress: deviceInfo.ipAddress,
            };
            const trustedDevicesKey = `2fa:trusted:${userId}`;
            const existingDevices = await this.getTrustedDevices(userId);
            existingDevices.push(device);
            await redis_1.redis.set(trustedDevicesKey, JSON.stringify(existingDevices));
            logger_1.logger.info('Added trusted device', { userId, deviceId: device.id });
            return device;
        }
        catch (error) {
            logger_1.logger.error('Error adding trusted device', error);
            throw new Error('Failed to add trusted device');
        }
    }
    async isDeviceTrusted(userId, fingerprint) {
        try {
            const devices = await this.getTrustedDevices(userId);
            const device = devices.find(d => d.fingerprint === fingerprint);
            if (device) {
                device.lastUsedAt = new Date();
                const trustedDevicesKey = `2fa:trusted:${userId}`;
                await redis_1.redis.set(trustedDevicesKey, JSON.stringify(devices));
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error('Error checking trusted device', error);
            return false;
        }
    }
    async removeTrustedDevice(userId, deviceId) {
        try {
            const devices = await this.getTrustedDevices(userId);
            const filteredDevices = devices.filter(d => d.id !== deviceId);
            const trustedDevicesKey = `2fa:trusted:${userId}`;
            await redis_1.redis.set(trustedDevicesKey, JSON.stringify(filteredDevices));
            logger_1.logger.info('Removed trusted device', { userId, deviceId });
        }
        catch (error) {
            logger_1.logger.error('Error removing trusted device', error);
            throw new Error('Failed to remove trusted device');
        }
    }
    async getTrustedDevices(userId) {
        try {
            const trustedDevicesKey = `2fa:trusted:${userId}`;
            const data = await redis_1.redis.get(trustedDevicesKey);
            if (!data) {
                return [];
            }
            return JSON.parse(data);
        }
        catch (error) {
            logger_1.logger.error('Error getting trusted devices', error);
            return [];
        }
    }
    async get2FAConfig(userId) {
        try {
            const configKey = `2fa:config:${userId}`;
            const data = await redis_1.redis.get(configKey);
            if (!data) {
                return null;
            }
            return JSON.parse(data);
        }
        catch (error) {
            logger_1.logger.error('Error getting 2FA config', error);
            return null;
        }
    }
    async update2FAConfig(userId, config) {
        const configKey = `2fa:config:${userId}`;
        await redis_1.redis.set(configKey, JSON.stringify(config));
    }
    async is2FAEnabled(userId) {
        const config = await this.get2FAConfig(userId);
        return config?.enabled || false;
    }
    async get2FAMethod(userId) {
        const config = await this.get2FAConfig(userId);
        return config?.method || null;
    }
    generateDeviceFingerprint(userAgent, ipAddress, additionalData) {
        const data = `${userAgent}:${ipAddress}:${additionalData || ''}`;
        return crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
    async check2FARateLimit(userId) {
        const key = `2fa:ratelimit:${userId}`;
        const attempts = await redis_1.redis.get(key);
        if (!attempts) {
            await redis_1.redis.setEx(key, 300, '1');
            return true;
        }
        const count = parseInt(attempts);
        if (count >= 5) {
            logger_1.logger.warn('2FA rate limit exceeded', { userId });
            return false;
        }
        await redis_1.redis.incr(key);
        return true;
    }
    async clear2FARateLimit(userId) {
        const key = `2fa:ratelimit:${userId}`;
        await redis_1.redis.del(key);
    }
}
exports.twoFactorAuthService = TwoFactorAuthService.getInstance();
//# sourceMappingURL=TwoFactorAuthService.js.map