"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionManager = exports.SessionManager = void 0;
exports.createSessionConfig = createSessionConfig;
exports.configureSession = configureSession;
exports.validateSession = validateSession;
exports.scheduleSessionCleanup = scheduleSessionCleanup;
const tslib_1 = require("tslib");
const express_session_1 = tslib_1.__importDefault(require("express-session"));
const redisModule = require('redis');
const { createClient } = redisModule;
const redis_1 = require("../services/redis");
const logger_1 = require("../utils/logger");
const secrets_1 = require("./secrets");
let RedisStore;
try {
    const connectRedis = require('connect-redis');
    RedisStore = connectRedis.default ? connectRedis.default(express_session_1.default) : connectRedis(express_session_1.default);
}
catch (error) {
    logger_1.logger.warn('connect-redis not available, sessions will use memory store');
}
function generateSecureSessionId() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
}
function createSessionConfig() {
    const isProduction = process.env.NODE_ENV === 'production';
    const sessionSecret = secrets_1.secretManager.getSecret('SESSION_SECRET') ||
        secrets_1.secretManager.generateSecureSecret(64);
    const config = {
        secret: sessionSecret,
        name: process.env.SESSION_NAME || 'upcoach.sid',
        resave: false,
        saveUninitialized: false,
        rolling: true,
        proxy: isProduction,
        cookie: {
            secure: isProduction,
            httpOnly: true,
            maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'),
            sameSite: 'strict',
            domain: process.env.COOKIE_DOMAIN || undefined,
            path: '/',
        },
        genid: generateSecureSessionId,
    };
    if (isProduction || process.env.USE_REDIS_SESSIONS === 'true') {
        config.store = new RedisStore({
            client: redis_1.redis,
            prefix: 'sess:',
            ttl: config.cookie.maxAge / 1000,
            disableTouch: false,
            logErrors: (error) => {
                logger_1.logger.error('Redis session store error:', error);
            },
        });
        logger_1.logger.info('Using Redis session store for distributed sessions');
    }
    else {
        logger_1.logger.info('Using in-memory session store (development mode)');
    }
    return config;
}
function configureSession(app) {
    const sessionConfig = createSessionConfig();
    app.use((0, express_session_1.default)(sessionConfig));
    app.use((req, res, next) => {
        if (req.body?.action === 'login' && req.session) {
            req.session.regenerate((err) => {
                if (err) {
                    logger_1.logger.error('Session regeneration error:', err);
                }
                next();
            });
        }
        else {
            next();
        }
    });
    app.use((req, res, next) => {
        if (req.session && req.session.userId) {
            const sessionAge = Date.now() - (req.session.createdAt || 0);
            const maxSessionAge = 24 * 60 * 60 * 1000;
            if (sessionAge > maxSessionAge) {
                req.session.destroy((err) => {
                    if (err) {
                        logger_1.logger.error('Session destruction error:', err);
                    }
                });
                return res.status(401).json({
                    success: false,
                    error: 'Session expired',
                    message: 'Please login again',
                });
            }
        }
        next();
    });
    logger_1.logger.info('Session middleware configured successfully');
}
class SessionManager {
    static instance;
    constructor() { }
    static getInstance() {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }
    async createSession(req, userId, metadata) {
        return new Promise((resolve, reject) => {
            req.session.regenerate((err) => {
                if (err) {
                    logger_1.logger.error('Session creation error:', err);
                    return reject(err);
                }
                req.session.userId = userId;
                req.session.createdAt = Date.now();
                req.session.lastActivity = Date.now();
                req.session.metadata = metadata || {};
                req.session.save((err) => {
                    if (err) {
                        logger_1.logger.error('Session save error:', err);
                        return reject(err);
                    }
                    logger_1.logger.info('Session created', {
                        userId,
                        sessionId: req.sessionID,
                    });
                    resolve();
                });
            });
        });
    }
    async destroySession(req) {
        return new Promise((resolve, reject) => {
            const sessionId = req.sessionID;
            const userId = req.session?.userId;
            req.session.destroy((err) => {
                if (err) {
                    logger_1.logger.error('Session destruction error:', err);
                    return reject(err);
                }
                logger_1.logger.info('Session destroyed', {
                    userId,
                    sessionId,
                });
                resolve();
            });
        });
    }
    updateActivity(req) {
        if (req.session) {
            req.session.lastActivity = Date.now();
        }
    }
    async getUserSessions(userId) {
        try {
            const pattern = `sess:*`;
            const keys = await redis_1.redis.keys(pattern);
            const userSessions = [];
            for (const key of keys) {
                const sessionData = await redis_1.redis.get(key);
                if (sessionData) {
                    try {
                        const session = JSON.parse(sessionData);
                        if (session.userId === userId) {
                            userSessions.push(key.replace('sess:', ''));
                        }
                    }
                    catch (parseError) {
                    }
                }
            }
            return userSessions;
        }
        catch (error) {
            logger_1.logger.error('Error fetching user sessions:', error);
            return [];
        }
    }
    async invalidateAllUserSessions(userId) {
        try {
            const sessions = await this.getUserSessions(userId);
            let invalidatedCount = 0;
            for (const sessionId of sessions) {
                const deleted = await redis_1.redis.del(`sess:${sessionId}`);
                if (deleted) {
                    invalidatedCount++;
                }
            }
            logger_1.logger.info(`Invalidated ${invalidatedCount} sessions for user ${userId}`);
            return invalidatedCount;
        }
        catch (error) {
            logger_1.logger.error('Error invalidating user sessions:', error);
            return 0;
        }
    }
    async cleanupExpiredSessions() {
        try {
            const pattern = `sess:*`;
            const keys = await redis_1.redis.keys(pattern);
            let cleanedCount = 0;
            const now = Date.now();
            const maxAge = parseInt(process.env.SESSION_MAX_AGE || '86400000');
            for (const key of keys) {
                const sessionData = await redis_1.redis.get(key);
                if (sessionData) {
                    try {
                        const session = JSON.parse(sessionData);
                        const sessionAge = now - (session.createdAt || 0);
                        if (sessionAge > maxAge) {
                            const deleted = await redis_1.redis.del(key);
                            if (deleted) {
                                cleanedCount++;
                            }
                        }
                    }
                    catch (parseError) {
                        await redis_1.redis.del(key);
                        cleanedCount++;
                    }
                }
            }
            if (cleanedCount > 0) {
                logger_1.logger.info(`Cleaned up ${cleanedCount} expired sessions`);
            }
            return cleanedCount;
        }
        catch (error) {
            logger_1.logger.error('Error cleaning up sessions:', error);
            return 0;
        }
    }
    async detectSessionAnomalies(req) {
        if (!req.session || !req.session.userId) {
            return false;
        }
        try {
            const sessions = await this.getUserSessions(req.session.userId);
            const sessionDetails = [];
            for (const sessionId of sessions) {
                const sessionData = await redis_1.redis.get(`sess:${sessionId}`);
                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    sessionDetails.push({
                        id: sessionId,
                        ip: session.metadata?.ip,
                        userAgent: session.metadata?.userAgent,
                        lastActivity: session.lastActivity,
                    });
                }
            }
            const currentIp = req.ip;
            const currentUserAgent = req.get('user-agent');
            const suspiciousSessions = sessionDetails.filter(s => {
                const recentActivity = Date.now() - s.lastActivity < 5 * 60 * 1000;
                const differentIp = s.ip && s.ip !== currentIp;
                const differentAgent = s.userAgent && s.userAgent !== currentUserAgent;
                return recentActivity && (differentIp || differentAgent);
            });
            if (suspiciousSessions.length > 0) {
                logger_1.logger.warn('Session anomaly detected', {
                    userId: req.session.userId,
                    currentIp,
                    suspiciousSessions,
                });
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error('Error detecting session anomalies:', error);
            return false;
        }
    }
}
exports.SessionManager = SessionManager;
exports.sessionManager = SessionManager.getInstance();
function validateSession(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            error: 'No active session',
            message: 'Please login to continue',
        });
    }
    exports.sessionManager.updateActivity(req);
    exports.sessionManager.detectSessionAnomalies(req).then(hasAnomalies => {
        if (hasAnomalies) {
            logger_1.logger.warn('Session anomaly detected but allowing request', {
                userId: req.session.userId,
                sessionId: req.sessionID,
            });
        }
    });
    next();
}
function scheduleSessionCleanup() {
    const cleanupInterval = parseInt(process.env.SESSION_CLEANUP_INTERVAL || '3600000');
    setInterval(async () => {
        try {
            await exports.sessionManager.cleanupExpiredSessions();
        }
        catch (error) {
            logger_1.logger.error('Session cleanup job error:', error);
        }
    }, cleanupInterval);
    logger_1.logger.info(`Session cleanup scheduled every ${cleanupInterval / 1000} seconds`);
}
