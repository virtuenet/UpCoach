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
exports.secureCredentialManager = exports.SecureCredentialManager = void 0;
const crypto = __importStar(require("crypto"));
const logger_1 = require("../utils/logger");
class SecureCredentialManager {
    config;
    credentials = new Map();
    encryptionKeys = new Map();
    currentKeyId;
    usageLogs = [];
    rotationTimer;
    constructor(config = {}) {
        this.config = {
            rotationIntervalHours: 24,
            enableAuditLogging: true,
            enableKeyRotation: true,
            maxKeyAge: 7 * 24 * 60 * 60 * 1000,
            ...config,
        };
        this.currentKeyId = this.generateKeyId();
        this.initializeEncryptionKeys();
        if (this.config.enableKeyRotation) {
            this.startKeyRotation();
        }
    }
    async storeCredential(id, value, metadata, expiresAt) {
        try {
            if (!value || value.trim().length === 0) {
                throw new Error('Credential value cannot be empty');
            }
            const encryptedValue = this.encryptValue(value);
            const credential = {
                id,
                encryptedValue,
                keyId: this.currentKeyId,
                createdAt: new Date(),
                lastUsed: new Date(),
                expiresAt,
                metadata,
            };
            this.credentials.set(id, credential);
            this.logCredentialUsage({
                credentialId: id,
                timestamp: new Date(),
                operation: 'encrypt',
                success: true,
                source: 'SecureCredentialManager.storeCredential',
            });
            logger_1.logger.info('Credential stored securely:', {
                credentialId: id,
                service: metadata.service,
                purpose: metadata.purpose,
                environment: metadata.environment,
                hasExpiry: !!expiresAt,
            });
        }
        catch (error) {
            this.logCredentialUsage({
                credentialId: id,
                timestamp: new Date(),
                operation: 'encrypt',
                success: false,
                source: 'SecureCredentialManager.storeCredential',
                errorMessage: error.message,
            });
            logger_1.logger.error('Failed to store credential:', {
                credentialId: id,
                error: error.message,
            });
            throw new Error('Failed to store credential securely');
        }
    }
    async getCredential(id, source = 'unknown') {
        try {
            const credential = this.credentials.get(id);
            if (!credential) {
                this.logCredentialUsage({
                    credentialId: id,
                    timestamp: new Date(),
                    operation: 'read',
                    success: false,
                    source,
                    errorMessage: 'Credential not found',
                });
                return null;
            }
            if (credential.expiresAt && credential.expiresAt < new Date()) {
                this.logCredentialUsage({
                    credentialId: id,
                    timestamp: new Date(),
                    operation: 'read',
                    success: false,
                    source,
                    errorMessage: 'Credential has expired',
                });
                this.credentials.delete(id);
                logger_1.logger.warn('Expired credential removed:', { credentialId: id });
                return null;
            }
            const decryptedValue = this.decryptValue(credential.encryptedValue, credential.keyId);
            credential.lastUsed = new Date();
            this.logCredentialUsage({
                credentialId: id,
                timestamp: new Date(),
                operation: 'read',
                success: true,
                source,
            });
            return decryptedValue;
        }
        catch (error) {
            this.logCredentialUsage({
                credentialId: id,
                timestamp: new Date(),
                operation: 'read',
                success: false,
                source,
                errorMessage: error.message,
            });
            logger_1.logger.error('Failed to retrieve credential:', {
                credentialId: id,
                source,
                error: error.message,
            });
            return null;
        }
    }
    async initializeFromEnvironment() {
        const environment = process.env.NODE_ENV || 'development';
        const openaiKey = process.env.OPENAI_API_KEY;
        if (openaiKey) {
            await this.storeCredential('openai_api_key', openaiKey, {
                service: 'openai',
                purpose: 'api_access',
                environment,
            });
            delete process.env.OPENAI_API_KEY;
        }
        const claudeKey = process.env.CLAUDE_API_KEY;
        if (claudeKey) {
            await this.storeCredential('claude_api_key', claudeKey, {
                service: 'anthropic',
                purpose: 'api_access',
                environment,
            });
            delete process.env.CLAUDE_API_KEY;
        }
        const customKeys = Object.keys(process.env).filter(key => key.includes('API_KEY') && (key.includes('AI') || key.includes('GPT') || key.includes('CLAUDE')));
        for (const keyName of customKeys) {
            const value = process.env[keyName];
            if (value) {
                const normalizedName = keyName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                await this.storeCredential(normalizedName, value, {
                    service: 'custom',
                    purpose: 'api_access',
                    environment,
                });
                delete process.env[keyName];
            }
        }
        logger_1.logger.info('API credentials initialized securely from environment');
    }
    createSecureErrorMessage(originalError, operation) {
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction) {
            return new Error(`${operation} failed - please check configuration`);
        }
        else {
            const sanitizedMessage = this.sanitizeErrorMessage(originalError.message || 'Unknown error');
            return new Error(`${operation} failed: ${sanitizedMessage}`);
        }
    }
    sanitizeErrorMessage(message) {
        return message
            .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED_OPENAI_KEY]')
            .replace(/claude_[a-zA-Z0-9_-]{20,}/g, '[REDACTED_CLAUDE_KEY]')
            .replace(/ant_[a-zA-Z0-9_-]{20,}/g, '[REDACTED_ANTHROPIC_KEY]')
            .replace(/[a-zA-Z0-9_-]{20,}/g, '[REDACTED_KEY]')
            .replace(/token[:\s=]+[a-zA-Z0-9_-]+/gi, 'token: [REDACTED]')
            .replace(/bearer\s+[a-zA-Z0-9_-]+/gi, 'bearer [REDACTED]')
            .replace(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]')
            .replace(/[A-Za-z0-9+/]{30,}={0,2}/g, '[REDACTED_B64]')
            .replace(/authorization[:\s=]+[^\s,]+/gi, 'authorization: [REDACTED]')
            .replace(/api\s*key\s*[:\s=]+[^\s,]+/gi, 'api key: [REDACTED]')
            .replace(/secret\s*[:\s=]+[^\s,]+/gi, 'secret: [REDACTED]')
            .replace(/password\s*[:\s=]+[^\s,]+/gi, 'password: [REDACTED]')
            .replace(/["']sk-[a-zA-Z0-9]{20,}["']/g, '"[REDACTED_OPENAI_KEY]"')
            .replace(/["']claude_[a-zA-Z0-9_-]{20,}["']/g, '"[REDACTED_CLAUDE_KEY]"')
            .replace(/["']ant_[a-zA-Z0-9_-]{20,}["']/g, '"[REDACTED_ANTHROPIC_KEY]"');
    }
    encryptValue(value) {
        const key = this.getCurrentEncryptionKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }
    decryptValue(encryptedValue, keyId) {
        const parts = encryptedValue.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted value format');
        }
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const key = this.getEncryptionKey(keyId);
        if (!key) {
            throw new Error('Encryption key not found');
        }
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    initializeEncryptionKeys() {
        const keyMaterial = this.config.encryptionKey || crypto.randomBytes(32);
        const key = typeof keyMaterial === 'string' ? Buffer.from(keyMaterial, 'hex') : keyMaterial;
        this.encryptionKeys.set(this.currentKeyId, key);
    }
    getCurrentEncryptionKey() {
        const key = this.encryptionKeys.get(this.currentKeyId);
        if (!key) {
            throw new Error('Current encryption key not found');
        }
        return key;
    }
    getEncryptionKey(keyId) {
        return this.encryptionKeys.get(keyId);
    }
    generateKeyId() {
        return crypto.randomBytes(8).toString('hex');
    }
    startKeyRotation() {
        const intervalMs = this.config.rotationIntervalHours * 60 * 60 * 1000;
        this.rotationTimer = setInterval(() => {
            this.rotateEncryptionKeys();
        }, intervalMs);
        logger_1.logger.info('Key rotation started:', {
            intervalHours: this.config.rotationIntervalHours,
        });
    }
    async rotateEncryptionKeys() {
        try {
            const oldKeyId = this.currentKeyId;
            this.currentKeyId = this.generateKeyId();
            const newKey = crypto.randomBytes(32);
            this.encryptionKeys.set(this.currentKeyId, newKey);
            const reencryptionPromises = Array.from(this.credentials.entries()).map(async ([id, credential]) => {
                try {
                    const plaintext = this.decryptValue(credential.encryptedValue, credential.keyId);
                    const newEncryptedValue = this.encryptValue(plaintext);
                    credential.encryptedValue = newEncryptedValue;
                    credential.keyId = this.currentKeyId;
                    this.logCredentialUsage({
                        credentialId: id,
                        timestamp: new Date(),
                        operation: 'rotate',
                        success: true,
                        source: 'SecureCredentialManager.rotateEncryptionKeys',
                    });
                }
                catch (error) {
                    logger_1.logger.error('Failed to rotate credential:', {
                        credentialId: id,
                        error: error.message,
                    });
                    this.logCredentialUsage({
                        credentialId: id,
                        timestamp: new Date(),
                        operation: 'rotate',
                        success: false,
                        source: 'SecureCredentialManager.rotateEncryptionKeys',
                        errorMessage: error.message,
                    });
                }
            });
            await Promise.all(reencryptionPromises);
            setTimeout(() => {
                this.encryptionKeys.delete(oldKeyId);
                logger_1.logger.debug('Old encryption key removed after rotation:', { oldKeyId });
            }, 60 * 60 * 1000);
            logger_1.logger.info('Encryption keys rotated successfully:', {
                newKeyId: this.currentKeyId,
                credentialsReencrypted: this.credentials.size,
            });
        }
        catch (error) {
            logger_1.logger.error('Key rotation failed:', error);
        }
    }
    logCredentialUsage(log) {
        if (!this.config.enableAuditLogging)
            return;
        this.usageLogs.push(log);
        if (this.usageLogs.length > 1000) {
            this.usageLogs.splice(0, this.usageLogs.length - 1000);
        }
        if (!log.success || log.operation === 'rotate') {
            logger_1.logger.info('Credential usage audit:', {
                credentialId: log.credentialId,
                operation: log.operation,
                success: log.success,
                source: log.source,
                timestamp: log.timestamp,
                errorMessage: log.errorMessage,
            });
        }
    }
    getAuditLogs(limit = 100) {
        return this.usageLogs
            .slice(-limit)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    getCredentialMetadata(id) {
        const credential = this.credentials.get(id);
        if (!credential)
            return null;
        const { encryptedValue, ...metadata } = credential;
        return metadata;
    }
    async removeCredential(id) {
        const credential = this.credentials.get(id);
        if (!credential)
            return false;
        this.credentials.delete(id);
        this.logCredentialUsage({
            credentialId: id,
            timestamp: new Date(),
            operation: 'read',
            success: true,
            source: 'SecureCredentialManager.removeCredential',
        });
        logger_1.logger.info('Credential removed:', { credentialId: id });
        return true;
    }
    async healthCheck() {
        const credentialCount = this.credentials.size;
        const keyCount = this.encryptionKeys.size;
        const auditLogsCount = this.usageLogs.length;
        let status = 'healthy';
        if (keyCount === 0) {
            status = 'unhealthy';
        }
        if (!this.encryptionKeys.has(this.currentKeyId)) {
            status = 'unhealthy';
        }
        return {
            status,
            details: {
                encryptionKeys: keyCount,
                credentials: credentialCount,
                keyRotationEnabled: this.config.enableKeyRotation,
                auditLogsCount,
            },
        };
    }
    async cleanup() {
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
        }
        this.encryptionKeys.clear();
        this.credentials.clear();
        this.usageLogs.length = 0;
        logger_1.logger.info('Credential manager cleaned up');
    }
}
exports.SecureCredentialManager = SecureCredentialManager;
exports.secureCredentialManager = new SecureCredentialManager();
//# sourceMappingURL=SecureCredentialManager.js.map