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
exports.sessionSecurityService = exports.SessionSecurityService = void 0;
const crypto = __importStar(require("crypto"));
const redis_1 = require("../redis");
const logger_1 = require("../../utils/logger");
const apiError_1 = require("../../utils/apiError");
const DEFAULT_SESSION_OPTIONS = {
    maxAge: 8 * 60 * 60,
    idleTimeout: 30 * 60,
    maxConcurrentSessions: 5,
    secureCookies: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
};
const DEFAULT_SECURITY_CONFIG = {
    enableCrossTabSync: true,
    enableSessionHijackProtection: true,
    enableConcurrentSessionLimiting: true,
    sessionRotationInterval: 60
};
class SessionSecurityService {
    static instance;
    options;
    securityConfig;
    constructor(options = {}, securityConfig = {}) {
        this.options = { ...DEFAULT_SESSION_OPTIONS, ...options };
        this.securityConfig = { ...DEFAULT_SECURITY_CONFIG, ...securityConfig };
    }
    static getInstance() {
        if (!SessionSecurityService.instance) {
            SessionSecurityService.instance = new SessionSecurityService();
        }
        return SessionSecurityService.instance;
    }
    generateSessionId() {
        const randomBytes = crypto.randomBytes(32);
        const timestamp = Buffer.from(Date.now().toString());
        const combined = Buffer.concat([randomBytes, timestamp]);
        let sessionId = crypto.createHash('sha256').update(combined).digest('hex');
        sessionId = crypto.createHash('sha256').update(sessionId + crypto.randomBytes(16).toString('hex')).digest('hex');
        return sessionId;
    }
    generateDeviceFingerprint(req) {
        const components = [
            req.ip,
            req.headers['user-agent'] || '',
            req.headers['accept-language'] || '',
            req.headers['accept-encoding'] || ''
        ].join('|');
        return crypto.createHash('sha256').update(components).digest('hex').substring(0, 32);
    }
    async createSession(userId, email, role, req, res, metadata = {}) {
        try {
            const sessionId = this.generateSessionId();
            const deviceFingerprint = this.generateDeviceFingerprint(req);
            if (this.securityConfig.enableConcurrentSessionLimiting) {
                await this.enforceConcurrentSessionLimit(userId);
            }
            const sessionData = {
                userId,
                email,
                role,
                createdAt: new Date(),
                lastActivityAt: new Date(),
                ipAddress: req.ip || 'unknown',
                userAgent: req.headers['user-agent'] || 'unknown',
                deviceFingerprint,
                isActive: true,
                metadata
            };
            await redis_1.redis.setEx(`session:${sessionId}`, this.options.maxAge, JSON.stringify(sessionData));
            await redis_1.redis.sadd(`user_sessions:${userId}`, sessionId);
            await redis_1.redis.expire(`user_sessions:${userId}`, this.options.maxAge);
            this.setSessionCookie(res, sessionId);
            if (this.securityConfig.sessionRotationInterval > 0) {
                setTimeout(() => {
                    this.scheduleSessionRotation(sessionId);
                }, this.securityConfig.sessionRotationInterval * 60 * 1000);
            }
            await this.logSessionEvent('SESSION_CREATED', sessionId, userId, {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                deviceFingerprint
            });
            logger_1.logger.info('Secure session created', {
                sessionId: sessionId.substring(0, 16) + '...',
                userId,
                ipAddress: req.ip
            });
            return sessionId;
        }
        catch (error) {
            logger_1.logger.error('Session creation failed:', error);
            throw new apiError_1.ApiError(500, 'Session creation failed');
        }
    }
    async validateSession(sessionId, req) {
        const violations = [];
        try {
            if (!sessionId) {
                return { valid: false, violations: ['SESSION_ID_MISSING'] };
            }
            const sessionDataString = await redis_1.redis.get(`session:${sessionId}`);
            if (!sessionDataString) {
                violations.push('SESSION_NOT_FOUND');
                return { valid: false, violations };
            }
            const sessionData = JSON.parse(sessionDataString);
            if (!sessionData.isActive) {
                violations.push('SESSION_INACTIVE');
            }
            const now = Date.now();
            const sessionAge = now - new Date(sessionData.createdAt).getTime();
            const idleTime = now - new Date(sessionData.lastActivityAt).getTime();
            if (sessionAge > this.options.maxAge * 1000) {
                violations.push('SESSION_EXPIRED');
            }
            if (idleTime > this.options.idleTimeout * 1000) {
                violations.push('SESSION_IDLE_TIMEOUT');
            }
            if (this.securityConfig.enableSessionHijackProtection) {
                const currentFingerprint = this.generateDeviceFingerprint(req);
                if (sessionData.deviceFingerprint !== currentFingerprint) {
                    violations.push('DEVICE_FINGERPRINT_MISMATCH');
                    await this.logSessionEvent('SECURITY_VIOLATION', sessionId, sessionData.userId, {
                        violation: 'device_fingerprint_mismatch',
                        expected: sessionData.deviceFingerprint,
                        actual: currentFingerprint,
                        ipAddress: req.ip
                    });
                }
                if (process.env.STRICT_IP_VALIDATION === 'true' && sessionData.ipAddress !== req.ip) {
                    violations.push('IP_ADDRESS_CHANGE');
                    await this.logSessionEvent('SECURITY_VIOLATION', sessionId, sessionData.userId, {
                        violation: 'ip_address_change',
                        originalIP: sessionData.ipAddress,
                        currentIP: req.ip
                    });
                }
            }
            if (violations.length === 0) {
                await this.updateSessionActivity(sessionId, sessionData);
            }
            else {
                await this.logSessionEvent('SESSION_VALIDATION_FAILED', sessionId, sessionData.userId, {
                    violations,
                    ipAddress: req.ip
                });
            }
            return {
                valid: violations.length === 0,
                sessionData: violations.length === 0 ? sessionData : undefined,
                violations: violations.length > 0 ? violations : undefined
            };
        }
        catch (error) {
            logger_1.logger.error('Session validation error:', error);
            return { valid: false, violations: ['VALIDATION_ERROR'] };
        }
    }
    async updateSessionActivity(sessionId, sessionData) {
        sessionData.lastActivityAt = new Date();
        await redis_1.redis.setEx(`session:${sessionId}`, this.options.maxAge, JSON.stringify(sessionData));
    }
    async destroySession(sessionId, res, reason = 'logout') {
        try {
            const sessionDataString = await redis_1.redis.get(`session:${sessionId}`);
            let userId = 'unknown';
            if (sessionDataString) {
                const sessionData = JSON.parse(sessionDataString);
                userId = sessionData.userId;
                await redis_1.redis.srem(`user_sessions:${userId}`, sessionId);
            }
            await redis_1.redis.del(`session:${sessionId}`);
            this.clearSessionCookie(res);
            await this.logSessionEvent('SESSION_DESTROYED', sessionId, userId, { reason });
            logger_1.logger.info('Session destroyed', {
                sessionId: sessionId.substring(0, 16) + '...',
                userId,
                reason
            });
        }
        catch (error) {
            logger_1.logger.error('Session destruction failed:', error);
            throw new apiError_1.ApiError(500, 'Session destruction failed');
        }
    }
    async destroyAllUserSessions(userId, reason = 'security') {
        try {
            const sessionIds = await redis_1.redis.smembers(`user_sessions:${userId}`);
            for (const sessionId of sessionIds) {
                await redis_1.redis.del(`session:${sessionId}`);
                await this.logSessionEvent('SESSION_DESTROYED', sessionId, userId, { reason });
            }
            await redis_1.redis.del(`user_sessions:${userId}`);
            logger_1.logger.info('All user sessions destroyed', { userId, count: sessionIds.length, reason });
        }
        catch (error) {
            logger_1.logger.error('Bulk session destruction failed:', error);
            throw new apiError_1.ApiError(500, 'Bulk session destruction failed');
        }
    }
    async enforceConcurrentSessionLimit(userId) {
        const sessionIds = await redis_1.redis.smembers(`user_sessions:${userId}`);
        if (sessionIds.length >= this.options.maxConcurrentSessions) {
            const sessionsToRemove = sessionIds.slice(0, sessionIds.length - this.options.maxConcurrentSessions + 1);
            for (const sessionId of sessionsToRemove) {
                await redis_1.redis.del(`session:${sessionId}`);
                await redis_1.redis.srem(`user_sessions:${userId}`, sessionId);
                await this.logSessionEvent('SESSION_DESTROYED', sessionId, userId, {
                    reason: 'concurrent_session_limit'
                });
            }
            logger_1.logger.info('Concurrent session limit enforced', {
                userId,
                removedSessions: sessionsToRemove.length
            });
        }
    }
    setSessionCookie(res, sessionId) {
        res.cookie('session_id', sessionId, {
            httpOnly: true,
            secure: this.options.secureCookies,
            sameSite: this.options.sameSite,
            maxAge: this.options.maxAge * 1000,
            domain: this.options.domain,
            path: this.options.path,
            signed: false
        });
    }
    clearSessionCookie(res) {
        res.clearCookie('session_id', {
            httpOnly: true,
            secure: this.options.secureCookies,
            sameSite: this.options.sameSite,
            domain: this.options.domain,
            path: this.options.path
        });
    }
    async scheduleSessionRotation(sessionId) {
        try {
            const sessionDataString = await redis_1.redis.get(`session:${sessionId}`);
            if (!sessionDataString)
                return;
            const sessionData = JSON.parse(sessionDataString);
            const newSessionId = this.generateSessionId();
            await redis_1.redis.setEx(`session:${newSessionId}`, this.options.maxAge, JSON.stringify(sessionData));
            await redis_1.redis.srem(`user_sessions:${sessionData.userId}`, sessionId);
            await redis_1.redis.sadd(`user_sessions:${sessionData.userId}`, newSessionId);
            await redis_1.redis.del(`session:${sessionId}`);
            await this.logSessionEvent('SESSION_ROTATED', newSessionId, sessionData.userId, {
                oldSessionId: sessionId,
                reason: 'scheduled_rotation'
            });
            logger_1.logger.info('Session rotated', {
                oldSessionId: sessionId.substring(0, 16) + '...',
                newSessionId: newSessionId.substring(0, 16) + '...',
                userId: sessionData.userId
            });
        }
        catch (error) {
            logger_1.logger.error('Session rotation failed:', error);
        }
    }
    async syncCrossTabSessions(userId) {
        if (!this.securityConfig.enableCrossTabSync) {
            return [];
        }
        const sessionIds = await redis_1.redis.smembers(`user_sessions:${userId}`);
        const activeSessions = [];
        for (const sessionId of sessionIds) {
            const sessionData = await redis_1.redis.get(`session:${sessionId}`);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                if (session.isActive) {
                    activeSessions.push(sessionId);
                }
            }
            else {
                await redis_1.redis.srem(`user_sessions:${userId}`, sessionId);
            }
        }
        return activeSessions;
    }
    async getUserSessions(userId) {
        const sessionIds = await redis_1.redis.smembers(`user_sessions:${userId}`);
        const sessions = [];
        for (const sessionId of sessionIds) {
            const sessionDataString = await redis_1.redis.get(`session:${sessionId}`);
            if (sessionDataString) {
                const sessionData = JSON.parse(sessionDataString);
                sessions.push({
                    sessionId: sessionId.substring(0, 16) + '...',
                    createdAt: sessionData.createdAt,
                    lastActivityAt: sessionData.lastActivityAt,
                    ipAddress: sessionData.ipAddress,
                    userAgent: sessionData.userAgent,
                    isActive: sessionData.isActive
                });
            }
        }
        return sessions;
    }
    middleware() {
        return async (req, res, next) => {
            try {
                const sessionId = req.cookies.session_id;
                if (!sessionId) {
                    return next();
                }
                const validation = await this.validateSession(sessionId, req);
                if (validation.valid && validation.sessionData) {
                    req.session = validation.sessionData;
                    req.sessionId = sessionId;
                }
                else {
                    this.clearSessionCookie(res);
                    if (validation.violations?.includes('DEVICE_FINGERPRINT_MISMATCH') ||
                        validation.violations?.includes('IP_ADDRESS_CHANGE')) {
                        logger_1.logger.warn('Session security violation detected', {
                            sessionId: sessionId.substring(0, 16) + '...',
                            violations: validation.violations,
                            ipAddress: req.ip
                        });
                    }
                }
                next();
            }
            catch (error) {
                logger_1.logger.error('Session middleware error:', error);
                next();
            }
        };
    }
    async logSessionEvent(event, sessionId, userId, details) {
        const logEntry = {
            timestamp: new Date(),
            event,
            sessionId: sessionId.substring(0, 16) + '...',
            userId,
            details
        };
        await redis_1.redis.zadd('session:audit_log', Date.now(), JSON.stringify(logEntry));
        await redis_1.redis.zremrangebyrank('session:audit_log', 0, -50001);
    }
    async getSessionAuditLogs(startTime, endTime, userId) {
        const start = startTime ? startTime.getTime() : '-inf';
        const end = endTime ? endTime.getTime() : '+inf';
        const logs = await redis_1.redis.zrangebyscore('session:audit_log', start, end);
        return logs
            .map(log => JSON.parse(log))
            .filter(log => !userId || log.userId === userId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
}
exports.SessionSecurityService = SessionSecurityService;
exports.sessionSecurityService = SessionSecurityService.getInstance();
//# sourceMappingURL=SessionSecurityService.js.map