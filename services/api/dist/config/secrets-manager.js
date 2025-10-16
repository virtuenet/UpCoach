"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSecretsOnStartup = exports.getEncryptedSecret = exports.getSecret = exports.secretsManager = void 0;
const tslib_1 = require("tslib");
const crypto = tslib_1.__importStar(require("crypto"));
const logger_1 = require("../utils/logger");
class SecretsManager {
    static instance;
    encryptionKey;
    secretsCache = new Map();
    constructor() {
        this.encryptionKey = process.env.MASTER_KEY || this.generateMasterKey();
        if (!process.env.MASTER_KEY) {
            logger_1.logger.warn('MASTER_KEY not set, using generated key. This should only happen in development!');
        }
    }
    static getInstance() {
        if (!SecretsManager.instance) {
            SecretsManager.instance = new SecretsManager();
        }
        return SecretsManager.instance;
    }
    generateMasterKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    encrypt(text) {
        try {
            const algorithm = 'aes-256-gcm';
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher(algorithm, this.encryptionKey);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
        }
        catch (error) {
            logger_1.logger.error('Failed to encrypt secret', error);
            throw new Error('Encryption failed');
        }
    }
    decrypt(encryptedText) {
        try {
            const algorithm = 'aes-256-gcm';
            const parts = encryptedText.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted format');
            }
            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            logger_1.logger.error('Failed to decrypt secret', error);
            throw new Error('Decryption failed');
        }
    }
    validateSecret(key, value, config) {
        if (!value || value.trim().length === 0) {
            if (config.required) {
                throw new Error(`Required secret ${key} is missing or empty`);
            }
            return false;
        }
        if (value.includes('password') || value.includes('secret') || value.includes('key')) {
            logger_1.logger.warn(`Secret ${key} appears to contain the word 'password', 'secret', or 'key' in its value`);
        }
        if (config.validator && !config.validator(value)) {
            throw new Error(`Secret ${key} failed validation`);
        }
        return true;
    }
    getSecret(key, config = { key, encrypted: false, required: true }) {
        const cacheKey = `${key}_${config.encrypted ? 'encrypted' : 'plain'}`;
        if (this.secretsCache.has(cacheKey)) {
            return this.secretsCache.get(cacheKey);
        }
        let value = process.env[key];
        if (!value && config.defaultValue) {
            value = config.defaultValue;
        }
        if (!this.validateSecret(key, value || '', config)) {
            if (config.required) {
                throw new Error(`Required secret ${key} is not available`);
            }
            return '';
        }
        let finalValue = value;
        if (config.encrypted && value) {
            try {
                finalValue = this.decrypt(value);
            }
            catch (error) {
                logger_1.logger.error(`Failed to decrypt secret ${key}`, error);
                if (config.required) {
                    throw error;
                }
                return '';
            }
        }
        if (process.env.NODE_ENV !== 'production' || !config.encrypted) {
            this.secretsCache.set(cacheKey, finalValue);
        }
        return finalValue;
    }
    setSecret(key, value, encrypted = false) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Cannot set secrets in production environment');
        }
        const finalValue = encrypted ? this.encrypt(value) : value;
        process.env[key] = finalValue;
        const cacheKey = `${key}_${encrypted ? 'encrypted' : 'plain'}`;
        this.secretsCache.set(cacheKey, value);
    }
    clearCache() {
        this.secretsCache.clear();
    }
    validateAllSecrets() {
        const missing = [];
        const errors = [];
        const requiredSecrets = {
            DATABASE_URL: {
                key: 'DATABASE_URL',
                encrypted: false,
                required: true,
                validator: (value) => value.startsWith('postgresql://') && !value.includes('password')
            },
            JWT_SECRET: {
                key: 'JWT_SECRET',
                encrypted: false,
                required: true,
                validator: (value) => value.length >= 32
            },
            SESSION_SECRET: {
                key: 'SESSION_SECRET',
                encrypted: false,
                required: true,
                validator: (value) => value.length >= 32
            },
            OPENAI_API_KEY: {
                key: 'OPENAI_API_KEY',
                encrypted: false,
                required: true,
                validator: (value) => value.startsWith('sk-')
            },
            STRIPE_SECRET_KEY: {
                key: 'STRIPE_SECRET_KEY',
                encrypted: false,
                required: true,
                validator: (value) => value.startsWith('sk_')
            }
        };
        for (const [key, config] of Object.entries(requiredSecrets)) {
            try {
                const value = this.getSecret(key, config);
                if (!value && config.required) {
                    missing.push(key);
                }
            }
            catch (error) {
                errors.push(`${key}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return {
            valid: missing.length === 0 && errors.length === 0,
            missing,
            errors
        };
    }
    generateSecret(type = 'jwt') {
        switch (type) {
            case 'jwt':
            case 'session':
                return crypto.randomBytes(64).toString('hex');
            case 'encryption':
                return crypto.randomBytes(32).toString('hex');
            case 'api_key':
                return 'uk_' + crypto.randomBytes(32).toString('hex');
            default:
                return crypto.randomBytes(32).toString('hex');
        }
    }
    rotateEncryptionKey() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Key rotation must be done through secure admin interface');
        }
        const newKey = this.generateMasterKey();
        this.encryptionKey = newKey;
        this.clearCache();
        logger_1.logger.info('Encryption key rotated successfully');
        return newKey;
    }
}
exports.secretsManager = SecretsManager.getInstance();
const getSecret = (key, required = true) => {
    return exports.secretsManager.getSecret(key, { key, encrypted: false, required });
};
exports.getSecret = getSecret;
const getEncryptedSecret = (key, required = true) => {
    return exports.secretsManager.getSecret(key, { key, encrypted: true, required });
};
exports.getEncryptedSecret = getEncryptedSecret;
const validateSecretsOnStartup = () => {
    const validation = exports.secretsManager.validateAllSecrets();
    if (!validation.valid) {
        logger_1.logger.error('Secret validation failed', {
            missing: validation.missing,
            errors: validation.errors
        });
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Critical secrets are missing or invalid. Cannot start application.');
        }
        else {
            logger_1.logger.warn('Some secrets are missing in development mode. Application may not function correctly.');
        }
    }
    else {
        logger_1.logger.info('All required secrets validated successfully');
    }
};
exports.validateSecretsOnStartup = validateSecretsOnStartup;
exports.default = exports.secretsManager;
