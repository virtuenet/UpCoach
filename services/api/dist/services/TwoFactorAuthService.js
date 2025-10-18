"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoFactorAuthService = exports.TwoFactorAuthService = void 0;
const tslib_1 = require("tslib");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const QRCode = tslib_1.__importStar(require("qrcode"));
const speakeasy = tslib_1.__importStar(require("speakeasy"));
const logger_1 = require("../utils/logger");
const cryptoSecurity_1 = tslib_1.__importDefault(require("../utils/cryptoSecurity"));
const redis_1 = require("./redis");
const NotificationService_1 = require("./NotificationService");
const UnifiedEmailService_1 = tslib_1.__importDefault(require("./email/UnifiedEmailService"));
class TwoFactorAuthService {
    static instance;
    issuer = process.env.APP_NAME || 'UpCoach';
    backupCodeCount = 10;
    backupCodeLength = 8;
    totpWindow = 2;
    notificationService = NotificationService_1.NotificationService.getInstance();
    constructor() { }
    static getInstance() {
        if (!TwoFactorAuthService.instance) {
            TwoFactorAuthService.instance = new TwoFactorAuthService();
        }
        return TwoFactorAuthService.instance;
    }
    async generateTOTPSecret(userId, email) {
        try {
            const secret = speakeasy.generateSecret({
                length: 32,
                name: `${this.issuer} (${email})`,
                issuer: this.issuer,
            });
            const qrCode = await QRCode.toDataURL(secret.otpauth_url);
            const backupCodes = this.generateBackupCodes();
            const tempKey = `2fa:setup:${userId}`;
            const tempData = {
                secret: secret.base32,
                backupCodes,
                timestamp: Date.now(),
            };
            const encryptedTempData = cryptoSecurity_1.default.encryptSensitiveData(JSON.stringify(tempData));
            await redis_1.redis.setEx(tempKey, 600, encryptedTempData);
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
            const encryptedTempData = await redis_1.redis.get(tempKey);
            if (!encryptedTempData) {
                throw new Error('2FA setup session expired. Please start again.');
            }
            const decryptedTempData = cryptoSecurity_1.default.decryptSensitiveData(encryptedTempData);
            const { secret, backupCodes } = JSON.parse(decryptedTempData);
            const verified = speakeasy.totp.verify({
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
            const encryptedConfig = cryptoSecurity_1.default.encryptSensitiveData(JSON.stringify(config));
            await redis_1.redis.set(configKey, encryptedConfig);
            await redis_1.redis.del(tempKey);
            await this.notificationService.showSuccess(userId.toString(), 'Two-Factor Authentication has been enabled on your account for enhanced security.');
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
    async verify2FA(userId, token) {
        try {
            const config = await this.get2FAConfig(userId);
            if (!config || !config.enabled) {
                return false;
            }
            let verified = false;
            switch (config.method) {
                case 'totp':
                    verified = await this.verifyTOTPToken(userId, token, config);
                    break;
                case 'sms':
                    verified = await this.verifySMSCode(userId, token);
                    break;
                case 'email':
                    verified = await this.verifyEmailCode(userId, token);
                    break;
                default:
                    logger_1.logger.warn('Unknown 2FA method', { userId, method: config.method });
                    return false;
            }
            if (verified) {
                config.lastUsedAt = new Date();
                await this.update2FAConfig(userId, config);
                await this.clearFailedAttempts(userId);
                logger_1.logger.info('2FA verification successful', { userId, method: config.method });
            }
            else {
                await this.trackFailedAttempt(userId);
            }
            return verified;
        }
        catch (error) {
            logger_1.logger.error('Error verifying 2FA', error);
            return false;
        }
    }
    async verifyTOTP(userId, token) {
        return this.verify2FA(userId, token);
    }
    async verifyTOTPToken(userId, token, config) {
        if (config.backupCodes?.includes(token)) {
            return await this.useBackupCode(userId, token);
        }
        const verified = speakeasy.totp.verify({
            secret: config.secret,
            encoding: 'base32',
            token,
            window: this.totpWindow,
        });
        return verified;
    }
    async disable2FA(userId) {
        try {
            const configKey = `2fa:config:${userId}`;
            await redis_1.redis.del(configKey);
            const trustedDevicesKey = `2fa:trusted:${userId}`;
            await redis_1.redis.del(trustedDevicesKey);
            await this.notificationService.showWarning(userId.toString(), 'Two-Factor Authentication has been disabled on your account. Your account security may be reduced.', [
                {
                    label: 'Re-enable 2FA',
                    action: 'enable-2fa',
                    primary: true,
                    icon: 'shield',
                },
            ]);
            logger_1.logger.info('2FA disabled for user', { userId });
        }
        catch (error) {
            logger_1.logger.error('Error disabling 2FA', error);
            throw new Error('Failed to disable 2FA');
        }
    }
    generateBackupCodes(count = this.backupCodeCount) {
        return cryptoSecurity_1.default.generateSecureBackupCodes(count, this.backupCodeLength);
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
                await this.notificationService.showWarning(userId.toString(), `You have ${config.backupCodes.length} backup codes remaining. Generate new backup codes to maintain account security.`, [
                    {
                        label: 'Generate New Codes',
                        action: 'generate-backup-codes',
                        primary: true,
                        icon: 'refresh',
                    },
                ]);
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
            const validation = cryptoSecurity_1.default.validateDeviceInfo(deviceInfo);
            if (!validation.isValid) {
                throw new Error(`Invalid device information: ${validation.errors?.join(', ')}`);
            }
            const sanitizedDeviceInfo = validation.sanitized;
            const device = {
                id: crypto_1.default.randomBytes(16).toString('hex'),
                name: sanitizedDeviceInfo.name,
                fingerprint: sanitizedDeviceInfo.fingerprint,
                addedAt: new Date(),
                lastUsedAt: new Date(),
                userAgent: sanitizedDeviceInfo.userAgent,
                ipAddress: sanitizedDeviceInfo.ipAddress,
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
            const encryptedData = await redis_1.redis.get(configKey);
            if (!encryptedData) {
                return null;
            }
            const decryptedData = cryptoSecurity_1.default.decryptSensitiveData(encryptedData);
            return JSON.parse(decryptedData);
        }
        catch (error) {
            logger_1.logger.error('Error getting 2FA config', error);
            return null;
        }
    }
    async update2FAConfig(userId, config) {
        const configKey = `2fa:config:${userId}`;
        const encryptedConfig = cryptoSecurity_1.default.encryptSensitiveData(JSON.stringify(config));
        await redis_1.redis.set(configKey, encryptedConfig);
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
        return cryptoSecurity_1.default.generateSecureDeviceFingerprint(userAgent, ipAddress, additionalData);
    }
    async check2FARateLimit(userId) {
        const key = `2fa:ratelimit:${userId}`;
        const attempts = await redis_1.redis.get(key);
        if (!attempts) {
            await redis_1.redis.setEx(key, 300, '1');
            return { allowed: true };
        }
        const count = parseInt(attempts);
        let delaySeconds = 0;
        let allowed = true;
        if (count >= 3 && count < 5) {
            delaySeconds = Math.pow(2, count - 2) * 30;
        }
        else if (count >= 5 && count < 10) {
            delaySeconds = 300;
            allowed = false;
        }
        else if (count >= 10) {
            delaySeconds = 1800;
            allowed = false;
        }
        if (allowed) {
            await redis_1.redis.incr(key);
        }
        if (!allowed) {
            logger_1.logger.warn('2FA rate limit exceeded', { userId, attempts: count, delaySeconds });
        }
        return { allowed, delaySeconds };
    }
    async clear2FARateLimit(userId) {
        const key = `2fa:ratelimit:${userId}`;
        await redis_1.redis.del(key);
    }
    async trackFailedAttempt(userId) {
        const key = `2fa:failed:${userId}`;
        const attempts = await redis_1.redis.get(key);
        if (!attempts) {
            await redis_1.redis.setEx(key, 3600, '1');
        }
        else {
            const count = parseInt(attempts) + 1;
            await redis_1.redis.setEx(key, 3600, count.toString());
            if (count >= 3) {
                await this.notificationService.showWarning(userId.toString(), `There have been ${count} failed two-factor authentication attempts on your account in the last hour.`, [
                    {
                        label: 'Review Account Security',
                        action: 'security-review',
                        primary: true,
                        icon: 'security',
                    },
                ]);
                logger_1.logger.warn('Multiple failed 2FA attempts detected', { userId, attempts: count });
            }
        }
    }
    async clearFailedAttempts(userId) {
        const key = `2fa:failed:${userId}`;
        await redis_1.redis.del(key);
    }
    async sendSMSCode(userId, phoneNumber) {
        try {
            const code = cryptoSecurity_1.default.generateSecureCode(6);
            const key = `2fa:sms:${userId}`;
            await redis_1.redis.setEx(key, 300, JSON.stringify({ code, phoneNumber, sentAt: new Date() }));
            const smsResult = await this.sendSMS(phoneNumber, `Your UpCoach verification code is: ${code}. This code expires in 5 minutes.`);
            if (smsResult.success) {
                logger_1.logger.info('SMS 2FA code sent', { userId, phoneNumber: this.maskPhoneNumber(phoneNumber) });
                return { success: true, message: 'Verification code sent successfully' };
            }
            else {
                throw new Error('Failed to send SMS');
            }
        }
        catch (error) {
            logger_1.logger.error('Error sending SMS code', error);
            return { success: false, message: 'Failed to send verification code' };
        }
    }
    async verifySMSCode(userId, code) {
        try {
            const key = `2fa:sms:${userId}`;
            const storedData = await redis_1.redis.get(key);
            if (!storedData) {
                logger_1.logger.warn('SMS verification failed: code expired or not found', { userId });
                return false;
            }
            const { code: storedCode, phoneNumber, sentAt } = JSON.parse(storedData);
            if (!cryptoSecurity_1.default.timingSafeStringCompare(code, storedCode)) {
                await this.trackFailedAttempt(userId);
                logger_1.logger.warn('SMS verification failed: invalid code', { userId });
                return false;
            }
            const sentTime = new Date(sentAt);
            const now = new Date();
            const diffMinutes = (now.getTime() - sentTime.getTime()) / (1000 * 60);
            if (diffMinutes > 5) {
                logger_1.logger.warn('SMS verification failed: code expired', { userId });
                return false;
            }
            await redis_1.redis.del(key);
            await this.clearFailedAttempts(userId);
            logger_1.logger.info('SMS verification successful', { userId, phoneNumber: this.maskPhoneNumber(phoneNumber) });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error verifying SMS code', error);
            return false;
        }
    }
    async enableSMS2FA(userId, phoneNumber, verificationCode) {
        try {
            const isCodeValid = await this.verifySMSCode(userId, verificationCode);
            if (!isCodeValid) {
                return { success: false, message: 'Invalid verification code' };
            }
            const configKey = `2fa:config:${userId}`;
            const config = {
                userId,
                method: 'sms',
                enabled: true,
                verifiedAt: new Date(),
                lastUsedAt: new Date(),
                trustedDevices: [],
            };
            const phoneKey = `2fa:phone:${userId}`;
            const encryptedPhoneNumber = cryptoSecurity_1.default.encryptSensitiveData(phoneNumber);
            await redis_1.redis.set(phoneKey, encryptedPhoneNumber);
            const encryptedConfig = cryptoSecurity_1.default.encryptSensitiveData(JSON.stringify(config));
            await redis_1.redis.set(configKey, encryptedConfig);
            await this.notificationService.showSuccess(userId.toString(), 'SMS Two-Factor Authentication has been enabled on your account for enhanced security.');
            logger_1.logger.info('SMS 2FA enabled for user', { userId, phoneNumber: this.maskPhoneNumber(phoneNumber) });
            return { success: true, message: 'SMS 2FA enabled successfully' };
        }
        catch (error) {
            logger_1.logger.error('Error enabling SMS 2FA', error);
            return { success: false, message: 'Failed to enable SMS 2FA' };
        }
    }
    async sendEmailCode(userId, email) {
        try {
            const code = cryptoSecurity_1.default.generateSecureCode(6);
            const key = `2fa:email:${userId}`;
            await redis_1.redis.setEx(key, 300, JSON.stringify({ code, email, sentAt: new Date() }));
            const emailResult = await UnifiedEmailService_1.default.send({
                to: email,
                subject: 'Your UpCoach Verification Code',
                template: 'two-factor-auth-email',
                data: {
                    code,
                    expiresIn: '5 minutes',
                    userEmail: email,
                },
            });
            if (emailResult) {
                logger_1.logger.info('Email 2FA code sent', { userId, email: this.maskEmail(email) });
                return { success: true, message: 'Verification code sent successfully' };
            }
            else {
                throw new Error('Failed to send email');
            }
        }
        catch (error) {
            logger_1.logger.error('Error sending email code', error);
            return { success: false, message: 'Failed to send verification code' };
        }
    }
    async verifyEmailCode(userId, code) {
        try {
            const key = `2fa:email:${userId}`;
            const storedData = await redis_1.redis.get(key);
            if (!storedData) {
                logger_1.logger.warn('Email verification failed: code expired or not found', { userId });
                return false;
            }
            const { code: storedCode, email, sentAt } = JSON.parse(storedData);
            if (!cryptoSecurity_1.default.timingSafeStringCompare(code, storedCode)) {
                await this.trackFailedAttempt(userId);
                logger_1.logger.warn('Email verification failed: invalid code', { userId });
                return false;
            }
            const sentTime = new Date(sentAt);
            const now = new Date();
            const diffMinutes = (now.getTime() - sentTime.getTime()) / (1000 * 60);
            if (diffMinutes > 5) {
                logger_1.logger.warn('Email verification failed: code expired', { userId });
                return false;
            }
            await redis_1.redis.del(key);
            await this.clearFailedAttempts(userId);
            logger_1.logger.info('Email verification successful', { userId, email: this.maskEmail(email) });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error verifying email code', error);
            return false;
        }
    }
    async enableEmail2FA(userId, email, verificationCode) {
        try {
            const isCodeValid = await this.verifyEmailCode(userId, verificationCode);
            if (!isCodeValid) {
                return { success: false, message: 'Invalid verification code' };
            }
            const configKey = `2fa:config:${userId}`;
            const config = {
                userId,
                method: 'email',
                enabled: true,
                verifiedAt: new Date(),
                lastUsedAt: new Date(),
                trustedDevices: [],
            };
            const emailKey = `2fa:email-addr:${userId}`;
            const encryptedEmail = cryptoSecurity_1.default.encryptSensitiveData(email);
            await redis_1.redis.set(emailKey, encryptedEmail);
            const encryptedConfig = cryptoSecurity_1.default.encryptSensitiveData(JSON.stringify(config));
            await redis_1.redis.set(configKey, encryptedConfig);
            await this.notificationService.showSuccess(userId.toString(), 'Email Two-Factor Authentication has been enabled on your account for enhanced security.');
            logger_1.logger.info('Email 2FA enabled for user', { userId, email: this.maskEmail(email) });
            return { success: true, message: 'Email 2FA enabled successfully' };
        }
        catch (error) {
            logger_1.logger.error('Error enabling email 2FA', error);
            return { success: false, message: 'Failed to enable email 2FA' };
        }
    }
    async sendSMS(phoneNumber, message) {
        try {
            const { smsService } = await Promise.resolve().then(() => tslib_1.__importStar(require('./sms/SMSService')));
            const result = await smsService.sendSMS(phoneNumber, message);
            if (result.success) {
                logger_1.logger.info('SMS sent successfully', {
                    provider: result.provider,
                    messageId: result.messageId
                });
                return { success: true };
            }
            else {
                logger_1.logger.error('SMS sending failed', {
                    provider: result.provider,
                    error: result.error
                });
                return {
                    success: false,
                    message: result.error || 'Failed to send SMS'
                };
            }
        }
        catch (error) {
            logger_1.logger.error('SMS service error', error);
            return {
                success: false,
                message: 'SMS service unavailable'
            };
        }
    }
    maskPhoneNumber(phoneNumber) {
        if (phoneNumber.length <= 4)
            return phoneNumber;
        return phoneNumber.slice(0, 3) + '*'.repeat(phoneNumber.length - 6) + phoneNumber.slice(-3);
    }
    maskEmail(email) {
        const [local, domain] = email.split('@');
        if (local.length <= 2)
            return email;
        return local.slice(0, 2) + '*'.repeat(local.length - 4) + local.slice(-2) + '@' + domain;
    }
    validateSecretStrength(secret) {
        const issues = [];
        const recommendations = [];
        let score = 0;
        if (secret.length < 16) {
            issues.push('Secret is too short (minimum 16 characters required)');
            recommendations.push('Use a longer secret for better security');
        }
        else {
            score += 20;
        }
        const entropy = this.calculateEntropy(secret);
        if (entropy < 4.0) {
            issues.push('Secret has low entropy (randomness)');
            recommendations.push('Use a more random secret with better character distribution');
        }
        else if (entropy >= 4.0 && entropy < 4.5) {
            score += 15;
            recommendations.push('Consider using a secret with higher entropy for maximum security');
        }
        else {
            score += 25;
        }
        const base32Pattern = /^[A-Z2-7]+$/;
        if (!base32Pattern.test(secret)) {
            issues.push('Secret contains invalid characters (must be Base32: A-Z, 2-7)');
            recommendations.push('Ensure secret uses only valid Base32 characters');
        }
        else {
            score += 15;
        }
        if (this.hasRepeatedPatterns(secret)) {
            issues.push('Secret contains repeated patterns');
            recommendations.push('Use a secret without obvious patterns or repetitions');
        }
        else {
            score += 20;
        }
        const weakPatterns = ['AAAA', 'BBBB', '2222', '3333', '4444', '5555', '6666', '7777'];
        const hasWeakPattern = weakPatterns.some(pattern => secret.includes(pattern));
        if (hasWeakPattern) {
            issues.push('Secret contains weak patterns');
            recommendations.push('Avoid repeated characters or predictable sequences');
        }
        else {
            score += 10;
        }
        if (secret.length >= 32) {
            score += 10;
        }
        else if (secret.length >= 24) {
            score += 5;
            recommendations.push('Consider using a 32+ character secret for maximum security');
        }
        const isValid = issues.length === 0 && score >= 70;
        if (score < 50) {
            recommendations.push('Generate a new secret using a cryptographically secure random generator');
        }
        else if (score < 80) {
            recommendations.push('Your secret is acceptable but could be improved');
        }
        return {
            isValid,
            score,
            issues,
            recommendations
        };
    }
    calculateEntropy(str) {
        const frequencies = {};
        for (const char of str) {
            frequencies[char] = (frequencies[char] || 0) + 1;
        }
        let entropy = 0;
        const length = str.length;
        for (const freq of Object.values(frequencies)) {
            const probability = freq / length;
            entropy -= probability * Math.log2(probability);
        }
        return entropy;
    }
    hasRepeatedPatterns(secret) {
        for (let i = 0; i < secret.length - 3; i++) {
            const pattern = secret.substring(i, i + 2);
            if (secret.substring(i + 2, i + 4) === pattern) {
                return true;
            }
        }
        for (let i = 0; i < secret.length - 5; i++) {
            const pattern = secret.substring(i, i + 3);
            if (secret.substring(i + 3, i + 6) === pattern) {
                return true;
            }
        }
        for (let i = 0; i < secret.length - 3; i++) {
            if (secret[i] === secret[i + 1] &&
                secret[i] === secret[i + 2] &&
                secret[i] === secret[i + 3]) {
                return true;
            }
        }
        return false;
    }
    generateSecureSecret(length = 32) {
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        const randomBytes = crypto_1.default.randomBytes(length);
        for (let i = 0; i < length; i++) {
            secret += base32Chars[randomBytes[i] % base32Chars.length];
        }
        return secret;
    }
    async validateAndRegenerateSecret(secret) {
        if (!secret) {
            const newSecret = this.generateSecureSecret();
            return {
                secret: newSecret,
                validation: this.validateSecretStrength(newSecret),
                regenerated: true
            };
        }
        const validation = this.validateSecretStrength(secret);
        if (!validation.isValid || validation.score < 70) {
            logger_1.logger.warn('Weak TOTP secret detected, regenerating', {
                score: validation.score,
                issues: validation.issues
            });
            const newSecret = this.generateSecureSecret();
            return {
                secret: newSecret,
                validation: this.validateSecretStrength(newSecret),
                regenerated: true
            };
        }
        return {
            secret,
            validation,
            regenerated: false
        };
    }
}
exports.TwoFactorAuthService = TwoFactorAuthService;
exports.twoFactorAuthService = TwoFactorAuthService.getInstance();
