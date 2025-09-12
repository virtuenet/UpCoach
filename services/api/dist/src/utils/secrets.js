"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSecret = generateSecret;
exports.validateSecret = validateSecret;
exports.generateApiKey = generateApiKey;
exports.hashSecret = hashSecret;
exports.compareSecrets = compareSecrets;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.rotateSecret = rotateSecret;
exports.validateEnvironmentSecrets = validateEnvironmentSecrets;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("./logger");
function generateSecret(bytes = 64) {
    return crypto_1.default.randomBytes(bytes).toString('hex');
}
function validateSecret(secret, minLength = 64) {
    if (!secret || secret.length < minLength) {
        return false;
    }
    const weakPatterns = [
        'secret',
        'key',
        'password',
        'test',
        'placeholder',
        'change',
        'example',
        '12345',
        'admin',
        'default',
    ];
    const lowerSecret = secret.toLowerCase();
    for (const pattern of weakPatterns) {
        if (lowerSecret.includes(pattern)) {
            logger_1.logger.warn(`Secret contains weak pattern: ${pattern}`);
            return false;
        }
    }
    return true;
}
function generateApiKey(prefix = 'key_') {
    const secret = generateSecret(32);
    return `${prefix}${secret}`;
}
function hashSecret(secret) {
    return crypto_1.default.createHash('sha256').update(secret).digest('hex');
}
function compareSecrets(plain, hashed) {
    const plainHashed = hashSecret(plain);
    return crypto_1.default.timingSafeEqual(Buffer.from(plainHashed), Buffer.from(hashed));
}
function encrypt(text, key) {
    const algorithm = 'aes-256-gcm';
    const salt = crypto_1.default.randomBytes(16);
    const derivedKey = crypto_1.default.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(algorithm, derivedKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, authTag, Buffer.from(encrypted, 'hex')]).toString('base64');
}
function decrypt(encryptedText, key) {
    const algorithm = 'aes-256-gcm';
    const buffer = Buffer.from(encryptedText, 'base64');
    const salt = buffer.slice(0, 16);
    const iv = buffer.slice(16, 32);
    const authTag = buffer.slice(32, 48);
    const encrypted = buffer.slice(48);
    const derivedKey = crypto_1.default.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
    const decipher = crypto_1.default.createDecipheriv(algorithm, derivedKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
function rotateSecret(currentSecret) {
    return {
        current: generateSecret(),
        previous: currentSecret || generateSecret(),
        rotatedAt: new Date(),
    };
}
function validateEnvironmentSecrets() {
    const requiredSecrets = [
        { name: 'JWT_SECRET', value: process.env.JWT_SECRET, minLength: 64 },
        { name: 'JWT_REFRESH_SECRET', value: process.env.JWT_REFRESH_SECRET, minLength: 64 },
        { name: 'DATABASE_URL', value: process.env.DATABASE_URL, minLength: 20 },
    ];
    const errors = [];
    for (const secret of requiredSecrets) {
        if (!secret.value) {
            errors.push(`Missing required secret: ${secret.name}`);
        }
        else if (!validateSecret(secret.value, secret.minLength)) {
            errors.push(`Weak or invalid secret: ${secret.name}`);
        }
    }
    if (errors.length > 0) {
        logger_1.logger.error('Environment secret validation failed:', errors);
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Invalid environment secrets detected. Please check configuration.');
        }
    }
}
//# sourceMappingURL=secrets.js.map