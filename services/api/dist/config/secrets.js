"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureConfig = exports.secretManager = exports.SecretManager = void 0;
const tslib_1 = require("tslib");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const dotenv_1 = require("dotenv");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const logger_1 = require("../utils/logger");
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
(0, dotenv_1.config)({ path: path.resolve(process.cwd(), envFile) });
class SecretManager {
    static instance;
    secrets = new Map();
    encryptionKey;
    algorithm = 'aes-256-gcm';
    rotationInterval = 90 * 24 * 60 * 60 * 1000;
    constructor() {
        this.encryptionKey = this.getOrCreateEncryptionKey();
        this.loadSecrets();
        this.validateSecrets();
    }
    static getInstance() {
        if (!SecretManager.instance) {
            SecretManager.instance = new SecretManager();
        }
        return SecretManager.instance;
    }
    getOrCreateEncryptionKey() {
        const keyPath = path.join(process.cwd(), '.secrets', 'master.key');
        try {
            if (fs.existsSync(keyPath)) {
                const key = fs.readFileSync(keyPath);
                if (key.length !== 32) {
                    throw new Error('Invalid encryption key length');
                }
                return key;
            }
        }
        catch (error) {
            logger_1.logger.warn('Failed to read encryption key, generating new one:', error);
        }
        const key = crypto_1.default.randomBytes(32);
        const dir = path.dirname(keyPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
        }
        fs.writeFileSync(keyPath, key, { mode: 0o600 });
        logger_1.logger.info('Generated new master encryption key');
        return key;
    }
    encrypt(text) {
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(this.algorithm, this.encryptionKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }
    decrypt(encryptedData) {
        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const decipher = crypto_1.default.createDecipheriv(this.algorithm, this.encryptionKey, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    loadSecrets() {
        const secretsPath = path.join(process.cwd(), '.secrets', 'encrypted.json');
        if (fs.existsSync(secretsPath)) {
            try {
                const encryptedSecrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
                for (const [key, value] of Object.entries(encryptedSecrets)) {
                    if (typeof value === 'string') {
                        this.secrets.set(key, this.decrypt(value));
                    }
                }
                logger_1.logger.info('Loaded encrypted secrets successfully');
            }
            catch (error) {
                logger_1.logger.error('Failed to load encrypted secrets:', error);
            }
        }
        this.loadFromEnvironment();
    }
    loadFromEnvironment() {
        const requiredSecrets = [
            'JWT_SECRET',
            'JWT_REFRESH_SECRET',
            'DATABASE_URL',
            'DB_PASSWORD',
            'REDIS_URL',
            'SESSION_SECRET',
            'CSRF_SECRET',
            'API_KEY_SALT',
        ];
        for (const key of requiredSecrets) {
            const value = process.env[key];
            if (value && value !== 'placeholder') {
                this.secrets.set(key, value);
            }
        }
    }
    validateSecrets() {
        const requiredSecrets = {
            JWT_SECRET: { minLength: 64, pattern: /^[A-Za-z0-9+/=]{64,}$/ },
            JWT_REFRESH_SECRET: { minLength: 64, pattern: /^[A-Za-z0-9+/=]{64,}$/ },
            DATABASE_URL: { minLength: 20, pattern: /^(postgresql|mysql|mssql):\/\// },
            DB_PASSWORD: { minLength: 16, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{16,}$/ },
            SESSION_SECRET: { minLength: 32, pattern: /^[A-Za-z0-9+/=]{32,}$/ },
            CSRF_SECRET: { minLength: 32, pattern: /^[A-Za-z0-9+/=]{32,}$/ },
            API_KEY_SALT: { minLength: 32, pattern: /^[A-Za-z0-9+/=]{32,}$/ },
        };
        const missingSecrets = [];
        const weakSecrets = [];
        for (const [key, validation] of Object.entries(requiredSecrets)) {
            const value = this.secrets.get(key);
            if (!value || value === 'placeholder') {
                missingSecrets.push(key);
                if (process.env.NODE_ENV !== 'production') {
                    const generated = this.generateSecureSecret(validation.minLength);
                    this.secrets.set(key, generated);
                    logger_1.logger.warn(`Generated development secret for ${key}`);
                }
            }
            else if (value.length < validation.minLength) {
                weakSecrets.push(`${key} (min length: ${validation.minLength})`);
            }
            else if (!validation.pattern.test(value)) {
                weakSecrets.push(`${key} (invalid format)`);
            }
        }
        if (process.env.NODE_ENV === 'production') {
            if (missingSecrets.length > 0) {
                throw new Error(`Missing required secrets: ${missingSecrets.join(', ')}`);
            }
            if (weakSecrets.length > 0) {
                throw new Error(`Weak or invalid secrets: ${weakSecrets.join(', ')}`);
            }
        }
    }
    generateSecureSecret(length = 64) {
        return crypto_1.default.randomBytes(Math.ceil(length * 3 / 4))
            .toString('base64')
            .slice(0, length)
            .replace(/\+/g, '0')
            .replace(/\//g, '0');
    }
    getSecret(key) {
        return this.secrets.get(key);
    }
    setSecret(key, value) {
        this.secrets.set(key, value);
        this.saveSecrets();
    }
    saveSecrets() {
        const secretsPath = path.join(process.cwd(), '.secrets', 'encrypted.json');
        const encryptedSecrets = {};
        for (const [key, value] of this.secrets.entries()) {
            if (!process.env[key]) {
                encryptedSecrets[key] = this.encrypt(value);
            }
        }
        const dir = path.dirname(secretsPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
        }
        fs.writeFileSync(secretsPath, JSON.stringify(encryptedSecrets, null, 2), { mode: 0o600 });
    }
    async rotateSecret(key) {
        const newSecret = this.generateSecureSecret();
        this.setSecret(key, newSecret);
        logger_1.logger.info(`Rotated secret: ${key}`);
        return newSecret;
    }
    async checkRotation() {
        const rotationMetadataPath = path.join(process.cwd(), '.secrets', 'rotation.json');
        let rotationData = {};
        if (fs.existsSync(rotationMetadataPath)) {
            rotationData = JSON.parse(fs.readFileSync(rotationMetadataPath, 'utf8'));
        }
        const now = Date.now();
        const secretsToRotate = [];
        for (const key of this.secrets.keys()) {
            const lastRotation = rotationData[key] || 0;
            if (now - lastRotation > this.rotationInterval) {
                secretsToRotate.push(key);
            }
        }
        if (secretsToRotate.length > 0) {
            logger_1.logger.warn(`Secrets requiring rotation: ${secretsToRotate.join(', ')}`);
            if (process.env.NODE_ENV !== 'production') {
                for (const key of secretsToRotate) {
                    await this.rotateSecret(key);
                    rotationData[key] = now;
                }
                fs.writeFileSync(rotationMetadataPath, JSON.stringify(rotationData, null, 2), { mode: 0o600 });
            }
        }
    }
    generateProductionSecrets() {
        return {
            JWT_SECRET: this.generateSecureSecret(128),
            JWT_REFRESH_SECRET: this.generateSecureSecret(128),
            SESSION_SECRET: this.generateSecureSecret(64),
            CSRF_SECRET: this.generateSecureSecret(64),
            API_KEY_SALT: this.generateSecureSecret(32),
            DB_PASSWORD: this.generateStrongPassword(),
            ENCRYPTION_KEY: this.generateSecureSecret(64),
            WEBHOOK_SECRET: this.generateSecureSecret(64),
        };
    }
    generateStrongPassword() {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '@$!%*?&^#';
        const all = uppercase + lowercase + numbers + special;
        let password = '';
        password += uppercase[crypto_1.default.randomInt(0, uppercase.length)];
        password += lowercase[crypto_1.default.randomInt(0, lowercase.length)];
        password += numbers[crypto_1.default.randomInt(0, numbers.length)];
        password += special[crypto_1.default.randomInt(0, special.length)];
        for (let i = password.length; i < 24; i++) {
            password += all[crypto_1.default.randomInt(0, all.length)];
        }
        return password.split('').sort(() => crypto_1.default.randomInt(0, 2) - 1).join('');
    }
}
exports.SecretManager = SecretManager;
exports.secretManager = SecretManager.getInstance();
exports.secureConfig = {
    jwt: {
        secret: exports.secretManager.getSecret('JWT_SECRET') || exports.secretManager.generateSecureSecret(128),
        refreshSecret: exports.secretManager.getSecret('JWT_REFRESH_SECRET') || exports.secretManager.generateSecureSecret(128),
        expiresIn: '15m',
        refreshExpiresIn: '7d',
        algorithm: 'HS512',
        audience: process.env.JWT_AUDIENCE || 'upcoach-api',
        issuer: process.env.JWT_ISSUER || 'upcoach.ai',
    },
    session: {
        secret: exports.secretManager.getSecret('SESSION_SECRET') || exports.secretManager.generateSecureSecret(64),
        name: 'upcoach.sid',
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000,
            domain: process.env.COOKIE_DOMAIN || undefined,
        },
    },
    csrf: {
        secret: exports.secretManager.getSecret('CSRF_SECRET') || exports.secretManager.generateSecureSecret(64),
        saltLength: 16,
        secretLength: 32,
    },
    encryption: {
        key: exports.secretManager.getSecret('ENCRYPTION_KEY') || exports.secretManager.generateSecureSecret(64),
        algorithm: 'aes-256-gcm',
    },
    apiKeys: {
        salt: exports.secretManager.getSecret('API_KEY_SALT') || exports.secretManager.generateSecureSecret(32),
        iterations: 100000,
        keyLength: 64,
        digest: 'sha512',
    },
};
