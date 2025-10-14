"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoSecurity = void 0;
const tslib_1 = require("tslib");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const logger_1 = require("./logger");
class CryptoSecurity {
    static ALGORITHM = 'aes-256-gcm';
    static KEY_LENGTH = 32;
    static IV_LENGTH = 16;
    static TAG_LENGTH = 16;
    static SALT_LENGTH = 32;
    static deriveKey(masterKey, salt) {
        return crypto_1.default.pbkdf2Sync(masterKey, salt, 100000, this.KEY_LENGTH, 'sha256');
    }
    static getMasterKey() {
        const masterKey = process.env.CRYPTO_MASTER_KEY || process.env.DATABASE_ENCRYPTION_KEY;
        if (!masterKey) {
            throw new Error('CRYPTO_MASTER_KEY or DATABASE_ENCRYPTION_KEY must be set for sensitive data encryption');
        }
        return masterKey;
    }
    static encryptSensitiveData(plaintext) {
        try {
            const masterKey = this.getMasterKey();
            const salt = crypto_1.default.randomBytes(this.SALT_LENGTH);
            const iv = crypto_1.default.randomBytes(this.IV_LENGTH);
            const key = this.deriveKey(masterKey, salt);
            const cipher = crypto_1.default.createCipheriv(this.ALGORITHM, key, iv);
            cipher.setAAD(Buffer.from('sensitive-data', 'utf8'));
            let ciphertext = cipher.update(plaintext, 'utf8');
            ciphertext = Buffer.concat([ciphertext, cipher.final()]);
            const tag = cipher.getAuthTag();
            const combined = Buffer.concat([salt, iv, tag, ciphertext]);
            return combined.toString('base64');
        }
        catch (error) {
            logger_1.logger.error('Error encrypting sensitive data', error);
            throw new Error('Failed to encrypt sensitive data');
        }
    }
    static decryptSensitiveData(encryptedData) {
        try {
            const masterKey = this.getMasterKey();
            const combined = Buffer.from(encryptedData, 'base64');
            const salt = combined.subarray(0, this.SALT_LENGTH);
            const iv = combined.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
            const tag = combined.subarray(this.SALT_LENGTH + this.IV_LENGTH, this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
            const ciphertext = combined.subarray(this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
            const key = this.deriveKey(masterKey, salt);
            const decipher = crypto_1.default.createDecipheriv(this.ALGORITHM, key, iv);
            decipher.setAuthTag(tag);
            decipher.setAAD(Buffer.from('sensitive-data', 'utf8'));
            let plaintext = decipher.update(ciphertext);
            plaintext = Buffer.concat([plaintext, decipher.final()]);
            return plaintext.toString('utf8');
        }
        catch (error) {
            logger_1.logger.error('Error decrypting sensitive data', error);
            throw new Error('Failed to decrypt sensitive data');
        }
    }
    static timingSafeStringCompare(a, b) {
        try {
            const normalizedA = Buffer.from(a, 'utf8');
            const normalizedB = Buffer.from(b, 'utf8');
            if (normalizedA.length !== normalizedB.length) {
                const maxLength = Math.max(normalizedA.length, normalizedB.length);
                const paddedA = Buffer.alloc(maxLength, 0);
                const paddedB = Buffer.alloc(maxLength, 0);
                normalizedA.copy(paddedA);
                normalizedB.copy(paddedB);
                crypto_1.default.timingSafeEqual(paddedA, paddedB);
                return false;
            }
            return crypto_1.default.timingSafeEqual(normalizedA, normalizedB);
        }
        catch (error) {
            logger_1.logger.error('Error in timing-safe comparison', error);
            return false;
        }
    }
    static generateSecureCode(length = 6) {
        try {
            const byteLength = Math.ceil(length * 1.5);
            const randomBytes = crypto_1.default.randomBytes(byteLength);
            let code = '';
            let byteIndex = 0;
            while (code.length < length && byteIndex < randomBytes.length) {
                const byte = randomBytes[byteIndex];
                if (byte < 250) {
                    code += (byte % 10).toString();
                }
                byteIndex++;
            }
            while (code.length < length) {
                const fallbackByte = crypto_1.default.randomBytes(1)[0];
                if (fallbackByte < 250) {
                    code += (fallbackByte % 10).toString();
                }
            }
            return code;
        }
        catch (error) {
            logger_1.logger.error('Error generating secure code', error);
            throw new Error('Failed to generate secure code');
        }
    }
    static generateSecureBackupCodes(count = 10, codeLength = 8) {
        try {
            const codes = [];
            const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
            for (let i = 0; i < count; i++) {
                let code = '';
                const randomBytes = crypto_1.default.randomBytes(codeLength * 2);
                let byteIndex = 0;
                while (code.length < codeLength && byteIndex < randomBytes.length) {
                    const byte = randomBytes[byteIndex];
                    if (byte < Math.floor(256 / charset.length) * charset.length) {
                        code += charset[byte % charset.length];
                    }
                    byteIndex++;
                }
                if (codeLength >= 6) {
                    const mid = Math.floor(codeLength / 2);
                    code = code.substring(0, mid) + '-' + code.substring(mid);
                }
                codes.push(code);
            }
            return codes;
        }
        catch (error) {
            logger_1.logger.error('Error generating secure backup codes', error);
            throw new Error('Failed to generate secure backup codes');
        }
    }
    static generateSecureDeviceFingerprint(userAgent, ipAddress, additionalData) {
        try {
            const timestamp = Date.now();
            const salt = crypto_1.default.randomBytes(16).toString('hex');
            const data = `${userAgent}:${ipAddress}:${additionalData || ''}:${timestamp}:${salt}`;
            const hmac = crypto_1.default.createHmac('sha256', this.getMasterKey());
            hmac.update(data);
            return hmac.digest('hex');
        }
        catch (error) {
            logger_1.logger.error('Error generating secure device fingerprint', error);
            throw new Error('Failed to generate secure device fingerprint');
        }
    }
    static validateDeviceInfo(deviceInfo) {
        const errors = [];
        try {
            if (!deviceInfo.name || deviceInfo.name.length > 100) {
                errors.push('Device name must be 1-100 characters');
            }
            if (!deviceInfo.fingerprint || !/^[a-fA-F0-9]{64}$/.test(deviceInfo.fingerprint)) {
                errors.push('Invalid device fingerprint format');
            }
            if (!deviceInfo.userAgent || deviceInfo.userAgent.length > 500) {
                errors.push('User agent must be 1-500 characters');
            }
            const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
            if (!deviceInfo.ipAddress || !ipRegex.test(deviceInfo.ipAddress)) {
                errors.push('Invalid IP address format');
            }
            if (errors.length > 0) {
                return { isValid: false, errors };
            }
            const sanitized = {
                name: deviceInfo.name.trim(),
                fingerprint: deviceInfo.fingerprint.toLowerCase(),
                userAgent: deviceInfo.userAgent.trim(),
                ipAddress: deviceInfo.ipAddress.trim(),
            };
            return { isValid: true, sanitized };
        }
        catch (error) {
            logger_1.logger.error('Error validating device info', error);
            return { isValid: false, errors: ['Device validation failed'] };
        }
    }
    static generateHMAC(data, key) {
        try {
            const hmacKey = key || this.getMasterKey();
            const hmac = crypto_1.default.createHmac('sha256', hmacKey);
            hmac.update(data);
            return hmac.digest('hex');
        }
        catch (error) {
            logger_1.logger.error('Error generating HMAC', error);
            throw new Error('Failed to generate HMAC');
        }
    }
    static verifyHMAC(data, expectedHmac, key) {
        try {
            const actualHmac = this.generateHMAC(data, key);
            return this.timingSafeStringCompare(actualHmac, expectedHmac);
        }
        catch (error) {
            logger_1.logger.error('Error verifying HMAC', error);
            return false;
        }
    }
}
exports.CryptoSecurity = CryptoSecurity;
exports.default = CryptoSecurity;
