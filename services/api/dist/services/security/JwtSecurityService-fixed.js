"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtSecurityService = exports.JwtSecurityService = void 0;
const tslib_1 = require("tslib");
const crypto = tslib_1.__importStar(require("crypto"));
const jsonwebtoken_1 = require("jsonwebtoken");
const redis_1 = require("../redis");
const logger_1 = require("../../utils/logger");
const apiError_1 = require("../../utils/apiError");
class JwtSecurityService {
    static instance;
    secrets;
    rotationIntervalMs = 24 * 60 * 60 * 1000;
    constructor() {
        this.validateEnvironment();
        this.initializeSecrets();
    }
    static getInstance() {
        if (!JwtSecurityService.instance) {
            JwtSecurityService.instance = new JwtSecurityService();
        }
        return JwtSecurityService.instance;
    }
    validateEnvironment() {
        const masterKey = process.env.MASTER_KEY;
        if (!masterKey) {
            throw new Error('MASTER_KEY environment variable is required for JWT security');
        }
        if (masterKey.length < 32) {
            throw new Error('MASTER_KEY must be at least 32 characters long');
        }
        if (process.env.NODE_ENV === 'production' && masterKey === 'default-master-key') {
            throw new Error('Default master key detected in production - security violation');
        }
    }
    async initializeSecrets() {
        try {
            const storedSecrets = await redis_1.redis.get('jwt:secrets');
            if (storedSecrets) {
                this.secrets = JSON.parse(this.decryptSecrets(storedSecrets));
                const age = Date.now() - new Date(this.secrets.current.createdAt).getTime();
                if (age > this.rotationIntervalMs) {
                    await this.rotateSecrets();
                }
            }
            else {
                await this.generateInitialSecrets();
            }
            this.scheduleSecretRotation();
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize JWT secrets:', error);
            throw new Error('JWT security initialization failed');
        }
    }
    generateSecureSecret() {
        const randomBytes = crypto.randomBytes(64);
        const timestamp = Buffer.from(Date.now().toString());
        const pid = Buffer.from(process.pid.toString());
        const combinedEntropy = Buffer.concat([randomBytes, timestamp, pid]);
        const secret = crypto.pbkdf2Sync(combinedEntropy, 'upcoach-jwt-salt-2025', 100000, 64, 'sha512');
        return secret.toString('base64');
    }
    async generateInitialSecrets() {
        const secretId = crypto.randomUUID();
        const secret = this.generateSecureSecret();
        this.secrets = {
            current: {
                id: secretId,
                secret,
                createdAt: new Date(),
                algorithm: 'HS512'
            }
        };
        await this.persistSecrets();
        await this.auditLog({
            timestamp: new Date(),
            event: 'SECRET_ROTATED',
            details: { secretId, action: 'initial_generation' },
            severity: 'INFO'
        });
        logger_1.logger.info('JWT secrets initialized', { secretId });
    }
    async rotateSecrets() {
        try {
            const newSecretId = crypto.randomUUID();
            const newSecret = this.generateSecureSecret();
            const previousSecret = this.secrets.current;
            this.secrets = {
                current: {
                    id: newSecretId,
                    secret: newSecret,
                    createdAt: new Date(),
                    algorithm: 'HS512'
                },
                previous: previousSecret
            };
            await this.persistSecrets();
            await this.auditLog({
                timestamp: new Date(),
                event: 'SECRET_ROTATED',
                details: {
                    newSecretId,
                    previousSecretId: previousSecret.id,
                    rotationReason: 'scheduled_rotation'
                },
                severity: 'INFO'
            });
            logger_1.logger.info('JWT secrets rotated', {
                newSecretId,
                previousSecretId: previousSecret.id
            });
            setTimeout(() => {
                this.cleanupOldSecret();
            }, 60 * 60 * 1000);
        }
        catch (error) {
            logger_1.logger.error('Secret rotation failed:', error);
            await this.auditLog({
                timestamp: new Date(),
                event: 'SECRET_ROTATED',
                details: { error: error.message, action: 'rotation_failed' },
                severity: 'CRITICAL'
            });
            throw error;
        }
    }
    async cleanupOldSecret() {
        if (this.secrets.previous) {
            const oldSecretId = this.secrets.previous.id;
            delete this.secrets.previous;
            await this.persistSecrets();
            logger_1.logger.info('Old JWT secret cleaned up', { secretId: oldSecretId });
        }
    }
    async persistSecrets() {
        const encryptedSecrets = this.encryptSecrets(JSON.stringify(this.secrets));
        await redis_1.redis.setEx('jwt:secrets', 7 * 24 * 60 * 60, encryptedSecrets);
    }
    encryptSecrets(data) {
        const masterKey = process.env.MASTER_KEY;
        if (!masterKey) {
            throw new Error('MASTER_KEY environment variable is required for secret encryption');
        }
        if (masterKey.length < 32) {
            throw new Error('MASTER_KEY must be at least 32 characters long');
        }
        const key = crypto.scryptSync(masterKey, 'upcoach-jwt-salt-2025', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipherGCM('aes-256-gcm', key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
    }
    decryptSecrets(encryptedData) {
        try {
            const [ivHex, encrypted, authTagHex] = encryptedData.split(':');
            if (!ivHex || !encrypted || !authTagHex) {
                throw new Error('Invalid encrypted data format');
            }
            const masterKey = process.env.MASTER_KEY;
            const key = crypto.scryptSync(masterKey, 'upcoach-jwt-salt-2025', 32);
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            const decipher = crypto.createDecipherGCM('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            logger_1.logger.error('Secret decryption failed:', error);
            throw new Error('Failed to decrypt JWT secrets');
        }
    }
    scheduleSecretRotation() {
        setInterval(async () => {
            try {
                await this.rotateSecrets();
            }
            catch (error) {
                logger_1.logger.error('Scheduled secret rotation failed:', error);
            }
        }, this.rotationIntervalMs);
    }
    async generateToken(metadata, expiresIn = '15m', options = {}) {
        try {
            const tokenId = crypto.randomUUID();
            const sessionId = crypto.randomUUID();
            let fingerprint;
            if (options.includeFingerprint) {
                fingerprint = this.generateDeviceFingerprint(metadata);
            }
            const payload = {
                sub: metadata.userId,
                email: metadata.email,
                role: metadata.role,
                jti: tokenId,
                sid: sessionId,
                iss: 'upcoach-api',
                aud: 'upcoach-client',
                ...(fingerprint && { fingerprint }),
                ...(metadata.deviceId && { deviceId: metadata.deviceId }),
                ...(options.restrictToIP && metadata.ipAddress && { ipAddress: metadata.ipAddress })
            };
            const token = (0, jsonwebtoken_1.sign)(payload, this.secrets.current.secret, {
                algorithm: this.secrets.current.algorithm,
                expiresIn,
                issuer: 'upcoach-api',
                audience: 'upcoach-client',
                jwtid: tokenId
            });
            await this.storeTokenMetadata(tokenId, {
                ...metadata,
                fingerprint,
                sessionId,
                issuedAt: new Date(),
                expiresAt: new Date(Date.now() + this.parseExpiry(expiresIn))
            });
            await this.auditLog({
                timestamp: new Date(),
                userId: metadata.userId,
                event: 'TOKEN_ISSUED',
                details: { tokenId, expiresIn, hasFingerprint: !!fingerprint },
                severity: 'INFO',
                ipAddress: metadata.ipAddress,
                userAgent: metadata.userAgent
            });
            return { token, tokenId, fingerprint };
        }
        catch (error) {
            logger_1.logger.error('Token generation failed:', error);
            throw new apiError_1.ApiError(500, 'Token generation failed');
        }
    }
    async verifyToken(token, options = {}) {
        const violations = [];
        try {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const isBlacklisted = await redis_1.redis.get(`blacklist:${tokenHash}`);
            if (isBlacklisted) {
                violations.push('TOKEN_BLACKLISTED');
                await this.auditLog({
                    timestamp: new Date(),
                    event: 'SECURITY_VIOLATION',
                    details: { violation: 'blacklisted_token_used', tokenHash: tokenHash.substring(0, 16) },
                    severity: 'WARN'
                });
                return { valid: false, violations };
            }
            let payload;
            try {
                payload = (0, jsonwebtoken_1.verify)(token, this.secrets.current.secret, {
                    algorithms: [this.secrets.current.algorithm],
                    issuer: 'upcoach-api',
                    audience: 'upcoach-client'
                });
            }
            catch (error) {
                if (this.secrets.previous) {
                    try {
                        payload = (0, jsonwebtoken_1.verify)(token, this.secrets.previous.secret, {
                            algorithms: [this.secrets.previous.algorithm],
                            issuer: 'upcoach-api',
                            audience: 'upcoach-client'
                        });
                    }
                    catch (previousError) {
                        throw error;
                    }
                }
                else {
                    throw error;
                }
            }
            const tokenMetadata = await this.getTokenMetadata(payload.jti);
            if (!tokenMetadata) {
                violations.push('TOKEN_METADATA_MISSING');
            }
            if (options.checkFingerprint && options.expectedFingerprint) {
                if (payload.fingerprint !== options.expectedFingerprint) {
                    violations.push('FINGERPRINT_MISMATCH');
                }
            }
            if (options.checkIPBinding && options.currentIP) {
                if (payload.ipAddress && payload.ipAddress !== options.currentIP) {
                    violations.push('IP_ADDRESS_MISMATCH');
                }
            }
            if (options.checkDeviceBinding && options.currentDeviceId) {
                if (payload.deviceId && payload.deviceId !== options.currentDeviceId) {
                    violations.push('DEVICE_ID_MISMATCH');
                }
            }
            await this.detectAnomalies(payload, tokenMetadata);
            await this.auditLog({
                timestamp: new Date(),
                userId: payload.sub,
                event: 'TOKEN_VERIFIED',
                details: {
                    tokenId: payload.jti,
                    violations: violations.length > 0 ? violations : undefined
                },
                severity: violations.length > 0 ? 'WARN' : 'INFO'
            });
            return {
                valid: violations.length === 0,
                payload: violations.length === 0 ? payload : undefined,
                violations: violations.length > 0 ? violations : undefined
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.TokenExpiredError) {
                violations.push('TOKEN_EXPIRED');
            }
            else if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
                violations.push('TOKEN_INVALID');
            }
            else {
                violations.push('VERIFICATION_ERROR');
            }
            await this.auditLog({
                timestamp: new Date(),
                event: 'SECURITY_VIOLATION',
                details: {
                    violation: violations[0],
                    error: error.message
                },
                severity: 'WARN'
            });
            return { valid: false, violations };
        }
    }
    async revokeToken(token, reason) {
        try {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const decoded = (0, jsonwebtoken_1.decode)(token);
            if (decoded && decoded.exp) {
                const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
                if (ttl > 0) {
                    await redis_1.redis.setEx(`blacklist:${tokenHash}`, ttl, JSON.stringify({
                        revokedAt: new Date(),
                        reason: reason || 'manual_revocation',
                        tokenId: decoded.jti
                    }));
                    if (decoded.jti) {
                        await redis_1.redis.del(`token:metadata:${decoded.jti}`);
                    }
                    await this.auditLog({
                        timestamp: new Date(),
                        userId: decoded.sub,
                        event: 'TOKEN_REVOKED',
                        details: {
                            tokenId: decoded.jti,
                            reason: reason || 'manual_revocation'
                        },
                        severity: 'INFO'
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Token revocation failed:', error);
            throw new apiError_1.ApiError(500, 'Token revocation failed');
        }
    }
    generateDeviceFingerprint(metadata) {
        const components = [
            metadata.ipAddress || '',
            metadata.userAgent || '',
            metadata.deviceId || ''
        ].join('|');
        return crypto.createHash('sha256').update(components).digest('hex').substring(0, 32);
    }
    async storeTokenMetadata(tokenId, metadata) {
        await redis_1.redis.setEx(`token:metadata:${tokenId}`, 7 * 24 * 60 * 60, JSON.stringify(metadata));
    }
    async getTokenMetadata(tokenId) {
        const metadata = await redis_1.redis.get(`token:metadata:${tokenId}`);
        return metadata ? JSON.parse(metadata) : null;
    }
    async detectAnomalies(payload, metadata) {
        const recentUsage = await redis_1.redis.get(`token:usage:${payload.jti}`);
        if (recentUsage) {
            const usageData = JSON.parse(recentUsage);
            if (Date.now() - usageData.lastUsed < 1000) {
                await this.auditLog({
                    timestamp: new Date(),
                    userId: payload.sub,
                    event: 'SECURITY_VIOLATION',
                    details: {
                        violation: 'rapid_token_reuse',
                        tokenId: payload.jti,
                        interval: Date.now() - usageData.lastUsed
                    },
                    severity: 'WARN'
                });
            }
        }
        await redis_1.redis.setEx(`token:usage:${payload.jti}`, 300, JSON.stringify({ lastUsed: Date.now() }));
    }
    parseExpiry(expiresIn) {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match)
            return 15 * 60 * 1000;
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return 15 * 60 * 1000;
        }
    }
    async auditLog(log) {
        const logId = crypto.randomUUID();
        await redis_1.redis.zadd('security:audit_log', Date.now(), JSON.stringify({ ...log, logId }));
        await redis_1.redis.zremrangebyrank('security:audit_log', 0, -10001);
        if (log.severity === 'CRITICAL') {
            logger_1.logger.error('CRITICAL SECURITY EVENT:', log);
        }
    }
    async getAuditLogs(startTime, endTime, userId, event) {
        const start = startTime ? startTime.getTime() : '-inf';
        const end = endTime ? endTime.getTime() : '+inf';
        const logs = await redis_1.redis.zrangebyscore('security:audit_log', start, end);
        return logs
            .map(log => JSON.parse(log))
            .filter(log => !userId || log.userId === userId)
            .filter(log => !event || log.event === event)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    async forceSecretRotation(reason) {
        await this.auditLog({
            timestamp: new Date(),
            event: 'SECRET_ROTATED',
            details: { rotationReason: 'emergency_rotation', reason },
            severity: 'CRITICAL'
        });
        await this.rotateSecrets();
    }
    getCurrentSecretInfo() {
        return {
            id: this.secrets.current.id,
            createdAt: this.secrets.current.createdAt,
            algorithm: this.secrets.current.algorithm
        };
    }
}
exports.JwtSecurityService = JwtSecurityService;
exports.jwtSecurityService = JwtSecurityService.getInstance();
