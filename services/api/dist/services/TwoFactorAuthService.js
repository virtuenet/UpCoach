"use strict";
/**
 * Two-Factor Authentication Service
 * Implements TOTP (Time-based One-Time Password) and WebAuthn support
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoFactorAuthService = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
const redis_1 = require("./redis");
class TwoFactorAuthService {
    static instance;
    issuer = process.env.APP_NAME || 'UpCoach';
    backupCodeCount = 10;
    backupCodeLength = 8;
    totpWindow = 2; // Allow 2 time windows for clock drift
    constructor() { }
    static getInstance() {
        if (!TwoFactorAuthService.instance) {
            TwoFactorAuthService.instance = new TwoFactorAuthService();
        }
        return TwoFactorAuthService.instance;
    }
    /**
     * Generate TOTP secret for user
     */
    async generateTOTPSecret(userId, email) {
        try {
            // Generate secret
            const secret = speakeasy_1.default.generateSecret({
                length: 32,
                name: `${this.issuer} (${email})`,
                issuer: this.issuer,
            });
            // Generate QR code
            const qrCode = await qrcode_1.default.toDataURL(secret.otpauth_url);
            // Generate backup codes
            const backupCodes = this.generateBackupCodes();
            // Store temporarily in Redis (expires in 10 minutes)
            const tempKey = `2fa:setup:${userId}`;
            await redis_1.redis.setEx(tempKey, 600, // 10 minutes
            JSON.stringify({
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
    /**
     * Verify TOTP token and enable 2FA
     */
    async verifyAndEnableTOTP(userId, token) {
        try {
            // Get temporary secret from Redis
            const tempKey = `2fa:setup:${userId}`;
            const tempData = await redis_1.redis.get(tempKey);
            if (!tempData) {
                throw new Error('2FA setup session expired. Please start again.');
            }
            const { secret, backupCodes } = JSON.parse(tempData);
            // Verify token
            const verified = speakeasy_1.default.totp.verify({
                secret,
                encoding: 'base32',
                token,
                window: this.totpWindow,
            });
            if (!verified) {
                return { success: false };
            }
            // Store permanent 2FA configuration
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
            // Clean up temporary data
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
    /**
     * Verify TOTP token for authentication
     */
    async verifyTOTP(userId, token) {
        try {
            // Get user's 2FA configuration
            const config = await this.get2FAConfig(userId);
            if (!config || !config.enabled || config.method !== 'totp') {
                return false;
            }
            // Check if it's a backup code
            if (config.backupCodes?.includes(token)) {
                return await this.useBackupCode(userId, token);
            }
            // Verify TOTP token
            const verified = speakeasy_1.default.totp.verify({
                secret: config.secret,
                encoding: 'base32',
                token,
                window: this.totpWindow,
            });
            if (verified) {
                // Update last used timestamp
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
    /**
     * Disable 2FA for user
     */
    async disable2FA(userId) {
        try {
            const configKey = `2fa:config:${userId}`;
            await redis_1.redis.del(configKey);
            // Clear trusted devices
            const trustedDevicesKey = `2fa:trusted:${userId}`;
            await redis_1.redis.del(trustedDevicesKey);
            logger_1.logger.info('2FA disabled for user', { userId });
        }
        catch (error) {
            logger_1.logger.error('Error disabling 2FA', error);
            throw new Error('Failed to disable 2FA');
        }
    }
    /**
     * Generate backup codes
     */
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
    /**
     * Regenerate backup codes
     */
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
    /**
     * Use a backup code
     */
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
            // Remove used backup code
            config.backupCodes.splice(codeIndex, 1);
            config.lastUsedAt = new Date();
            await this.update2FAConfig(userId, config);
            logger_1.logger.info('Backup code used', { userId, remainingCodes: config.backupCodes.length });
            // Notify user if running low on backup codes
            if (config.backupCodes.length <= 2) {
                // TODO: Send notification to user
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
    /**
     * Add trusted device
     */
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
    /**
     * Check if device is trusted
     */
    async isDeviceTrusted(userId, fingerprint) {
        try {
            const devices = await this.getTrustedDevices(userId);
            const device = devices.find(d => d.fingerprint === fingerprint);
            if (device) {
                // Update last used timestamp
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
    /**
     * Remove trusted device
     */
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
    /**
     * Get trusted devices
     */
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
    /**
     * Get 2FA configuration
     */
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
    /**
     * Update 2FA configuration
     */
    async update2FAConfig(userId, config) {
        const configKey = `2fa:config:${userId}`;
        await redis_1.redis.set(configKey, JSON.stringify(config));
    }
    /**
     * Check if user has 2FA enabled
     */
    async is2FAEnabled(userId) {
        const config = await this.get2FAConfig(userId);
        return config?.enabled || false;
    }
    /**
     * Get 2FA method for user
     */
    async get2FAMethod(userId) {
        const config = await this.get2FAConfig(userId);
        return config?.method || null;
    }
    /**
     * Generate device fingerprint
     */
    generateDeviceFingerprint(userAgent, ipAddress, additionalData) {
        const data = `${userAgent}:${ipAddress}:${additionalData || ''}`;
        return crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
    /**
     * Rate limit 2FA attempts
     */
    async check2FARateLimit(userId) {
        const key = `2fa:ratelimit:${userId}`;
        const attempts = await redis_1.redis.get(key);
        if (!attempts) {
            await redis_1.redis.setEx(key, 300, '1'); // 5 minutes window
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
    /**
     * Clear 2FA rate limit
     */
    async clear2FARateLimit(userId) {
        const key = `2fa:ratelimit:${userId}`;
        await redis_1.redis.del(key);
    }
}
// Export singleton instance
exports.twoFactorAuthService = TwoFactorAuthService.getInstance();
//# sourceMappingURL=TwoFactorAuthService.js.map