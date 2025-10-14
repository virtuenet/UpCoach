"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicEndpointLimiter = exports.strictOperationLimiter = exports.intelligentApiLimiter = exports.enhancedAuthLimiter = void 0;
exports.createAdvancedRateLimiter = createAdvancedRateLimiter;
exports.isIpBlocked = isIpBlocked;
exports.blockIpAddress = blockIpAddress;
exports.unblockIpAddress = unblockIpAddress;
const tslib_1 = require("tslib");
const express_rate_limit_1 = tslib_1.__importDefault(require("express-rate-limit"));
const redis_1 = require("../services/redis");
const logger_1 = require("../utils/logger");
class AdvancedRateLimiter {
    static THREAT_PATTERNS = {
        ENDPOINT_SCANNING: {
            pattern: 'multiple_endpoints_rapid',
            weight: 30,
            description: 'Rapid requests to multiple different endpoints'
        },
        TIMING_ANOMALY: {
            pattern: 'timing_anomaly',
            weight: 25,
            description: 'Unusual request timing patterns'
        },
        PAYLOAD_ATTACK: {
            pattern: 'large_payload',
            weight: 20,
            description: 'Consistently large request payloads'
        },
        USER_AGENT_ROTATION: {
            pattern: 'ua_rotation',
            weight: 35,
            description: 'Frequent user agent changes'
        },
        HIGH_ERROR_RATE: {
            pattern: 'high_errors',
            weight: 40,
            description: 'High rate of error responses'
        },
        AUTH_BRUTE_FORCE: {
            pattern: 'auth_brute_force',
            weight: 50,
            description: 'Multiple authentication failures'
        }
    };
    static async analyzeThreatPattern(ipAddress, userAgent, endpoint, method) {
        const threatScore = {
            score: 0,
            reasons: [],
            severity: 'low'
        };
        try {
            const historyKey = `request_history:${ipAddress}`;
            const history = await redis_1.redis.lrange(historyKey, 0, 99);
            if (history.length < 5) {
                return threatScore;
            }
            const patterns = history.map(item => JSON.parse(item));
            const uniqueEndpoints = new Set(patterns.slice(0, 20).map(p => p.endpoint));
            if (uniqueEndpoints.size > 15) {
                threatScore.score += this.THREAT_PATTERNS.ENDPOINT_SCANNING.weight;
                threatScore.reasons.push(this.THREAT_PATTERNS.ENDPOINT_SCANNING.description);
            }
            const intervals = [];
            for (let i = 1; i < Math.min(patterns.length, 20); i++) {
                intervals.push(patterns[i - 1].timestamp - patterns[i].timestamp);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const rapidRequests = intervals.filter(interval => interval < 100).length;
            if (rapidRequests > intervals.length * 0.7) {
                threatScore.score += this.THREAT_PATTERNS.TIMING_ANOMALY.weight;
                threatScore.reasons.push(this.THREAT_PATTERNS.TIMING_ANOMALY.description);
            }
            const uniqueUserAgents = new Set(patterns.slice(0, 20).map(p => p.userAgent));
            if (uniqueUserAgents.size > 5) {
                threatScore.score += this.THREAT_PATTERNS.USER_AGENT_ROTATION.weight;
                threatScore.reasons.push(this.THREAT_PATTERNS.USER_AGENT_ROTATION.description);
            }
            const errorCount = patterns.slice(0, 20).filter(p => p.statusCode >= 400).length;
            const errorRate = errorCount / Math.min(patterns.length, 20);
            if (errorRate > 0.6) {
                threatScore.score += this.THREAT_PATTERNS.HIGH_ERROR_RATE.weight;
                threatScore.reasons.push(this.THREAT_PATTERNS.HIGH_ERROR_RATE.description);
            }
            const authEndpoints = patterns.slice(0, 20).filter(p => p.endpoint.includes('/auth/') || p.endpoint.includes('/login'));
            const authErrors = authEndpoints.filter(p => p.statusCode === 401 || p.statusCode === 403);
            if (authErrors.length > 5) {
                threatScore.score += this.THREAT_PATTERNS.AUTH_BRUTE_FORCE.weight;
                threatScore.reasons.push(this.THREAT_PATTERNS.AUTH_BRUTE_FORCE.description);
            }
            const largePaylods = patterns.slice(0, 10).filter(p => p.payloadSize > 1000000);
            if (largePaylods.length > 3) {
                threatScore.score += this.THREAT_PATTERNS.PAYLOAD_ATTACK.weight;
                threatScore.reasons.push(this.THREAT_PATTERNS.PAYLOAD_ATTACK.description);
            }
            if (threatScore.score >= 80) {
                threatScore.severity = 'critical';
            }
            else if (threatScore.score >= 60) {
                threatScore.severity = 'high';
            }
            else if (threatScore.score >= 40) {
                threatScore.severity = 'medium';
            }
            return threatScore;
        }
        catch (error) {
            logger_1.logger.error('Error analyzing threat patterns:', error);
            return threatScore;
        }
    }
    static async storeRequestPattern(req, res, responseTime) {
        try {
            const pattern = {
                timestamp: Date.now(),
                endpoint: req.path,
                method: req.method,
                userAgent: req.get('user-agent') || 'unknown',
                ipAddress: req.ip || 'unknown',
                responseTime,
                statusCode: res.statusCode,
                payloadSize: JSON.stringify(req.body || {}).length
            };
            const historyKey = `request_history:${req.ip}`;
            await redis_1.redis.lpush(historyKey, JSON.stringify(pattern));
            await redis_1.redis.ltrim(historyKey, 0, 99);
            await redis_1.redis.expire(historyKey, 3600);
        }
        catch (error) {
            logger_1.logger.error('Error storing request pattern:', error);
        }
    }
    static getAdaptiveLimit(baseLimitConfig, threatScore) {
        const adaptiveConfig = { ...baseLimitConfig };
        if (threatScore >= 80) {
            adaptiveConfig.maxRequests = Math.floor(baseLimitConfig.maxRequests * 0.1);
            adaptiveConfig.blockDuration = 3600;
        }
        else if (threatScore >= 60) {
            adaptiveConfig.maxRequests = Math.floor(baseLimitConfig.maxRequests * 0.3);
            adaptiveConfig.blockDuration = 1800;
        }
        else if (threatScore >= 40) {
            adaptiveConfig.maxRequests = Math.floor(baseLimitConfig.maxRequests * 0.6);
            adaptiveConfig.blockDuration = 900;
        }
        return adaptiveConfig;
    }
}
function createAdvancedRateLimiter(config) {
    return async (req, res, next) => {
        const startTime = process.hrtime.bigint();
        const ipAddress = req.ip || 'unknown';
        const userAgent = req.get('user-agent') || 'unknown';
        try {
            const blockKey = `blocked:${ipAddress}`;
            const isBlocked = await redis_1.redis.get(blockKey);
            if (isBlocked) {
                const blockData = JSON.parse(isBlocked);
                logger_1.logger.warn('Blocked IP attempted access', {
                    ip: ipAddress,
                    endpoint: req.path,
                    blockReason: blockData.reason,
                    blockedUntil: blockData.until
                });
                return res.status(429).json({
                    error: 'Access temporarily blocked',
                    message: 'Your IP has been temporarily blocked due to suspicious activity',
                    blockedUntil: blockData.until
                });
            }
            let threatScore = { score: 0, reasons: [], severity: 'low' };
            if (config.enableThreatDetection) {
                threatScore = await AdvancedRateLimiter.analyzeThreatPattern(ipAddress, userAgent, req.path, req.method);
            }
            let activeConfig = config;
            if (config.adaptiveThreshold && threatScore.score > 0) {
                activeConfig = AdvancedRateLimiter.getAdaptiveLimit(config, threatScore.score);
            }
            const limiter = (0, express_rate_limit_1.default)({
                windowMs: activeConfig.windowMs,
                max: activeConfig.maxRequests,
                skipSuccessfulRequests: activeConfig.skipSuccessfulRequests || false,
                keyGenerator: (req) => `${req.ip}:${req.path}`,
                handler: async (req, res) => {
                    if (threatScore.score >= 80) {
                        const blockDuration = activeConfig.blockDuration || 3600;
                        const blockUntil = Date.now() + (blockDuration * 1000);
                        await redis_1.redis.setEx(`blocked:${ipAddress}`, blockDuration, JSON.stringify({
                            reason: threatScore.reasons.join(', '),
                            score: threatScore.score,
                            until: new Date(blockUntil).toISOString(),
                            blockedAt: new Date().toISOString()
                        }));
                        logger_1.logger.error('IP blocked due to high threat score', {
                            ip: ipAddress,
                            threatScore: threatScore.score,
                            reasons: threatScore.reasons,
                            blockDuration: blockDuration
                        });
                    }
                    logger_1.logger.warn('Rate limit exceeded', {
                        ip: ipAddress,
                        endpoint: req.path,
                        method: req.method,
                        threatScore: threatScore.score,
                        adaptiveLimit: activeConfig.maxRequests,
                        originalLimit: config.maxRequests
                    });
                    res.status(429).json({
                        error: 'Rate limit exceeded',
                        message: 'Too many requests. Please slow down.',
                        threatScore: threatScore.severity,
                        retryAfter: Math.ceil(activeConfig.windowMs / 1000)
                    });
                },
                standardHeaders: true,
                legacyHeaders: false
            });
            limiter(req, res, (err) => {
                if (err) {
                    return next(err);
                }
                const endTime = process.hrtime.bigint();
                const responseTime = Number(endTime - startTime) / 1000000;
                AdvancedRateLimiter.storeRequestPattern(req, res, responseTime)
                    .catch(error => logger_1.logger.error('Error storing request pattern:', error));
                if (threatScore.score >= 40) {
                    logger_1.logger.warn('High threat score detected', {
                        ip: ipAddress,
                        endpoint: req.path,
                        threatScore: threatScore.score,
                        severity: threatScore.severity,
                        reasons: threatScore.reasons
                    });
                }
                next();
            });
        }
        catch (error) {
            logger_1.logger.error('Advanced rate limiter error:', error);
            next();
        }
    };
}
exports.enhancedAuthLimiter = createAdvancedRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    skipSuccessfulRequests: true,
    enableThreatDetection: true,
    adaptiveThreshold: true,
    blockDuration: 3600
});
exports.intelligentApiLimiter = createAdvancedRateLimiter({
    windowMs: 1 * 60 * 1000,
    maxRequests: 60,
    skipSuccessfulRequests: false,
    enableThreatDetection: true,
    adaptiveThreshold: true,
    blockDuration: 900
});
exports.strictOperationLimiter = createAdvancedRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    skipSuccessfulRequests: false,
    enableThreatDetection: true,
    adaptiveThreshold: true,
    blockDuration: 7200
});
exports.publicEndpointLimiter = createAdvancedRateLimiter({
    windowMs: 1 * 60 * 1000,
    maxRequests: 30,
    skipSuccessfulRequests: false,
    enableThreatDetection: true,
    adaptiveThreshold: true,
    blockDuration: 600
});
async function isIpBlocked(ipAddress) {
    try {
        const blockData = await redis_1.redis.get(`blocked:${ipAddress}`);
        return !!blockData;
    }
    catch (error) {
        logger_1.logger.error('Error checking IP block status:', error);
        return false;
    }
}
async function blockIpAddress(ipAddress, reason, durationSeconds = 3600) {
    try {
        const blockUntil = Date.now() + (durationSeconds * 1000);
        await redis_1.redis.setEx(`blocked:${ipAddress}`, durationSeconds, JSON.stringify({
            reason,
            score: 100,
            until: new Date(blockUntil).toISOString(),
            blockedAt: new Date().toISOString(),
            manual: true
        }));
        logger_1.logger.info('IP manually blocked', {
            ip: ipAddress,
            reason,
            duration: durationSeconds
        });
    }
    catch (error) {
        logger_1.logger.error('Error blocking IP:', error);
        throw error;
    }
}
async function unblockIpAddress(ipAddress) {
    try {
        await redis_1.redis.del(`blocked:${ipAddress}`);
        logger_1.logger.info('IP unblocked', { ip: ipAddress });
    }
    catch (error) {
        logger_1.logger.error('Error unblocking IP:', error);
        throw error;
    }
}
