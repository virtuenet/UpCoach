"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authAuditMiddleware = exports.auditMiddleware = exports.AuditTrailService = void 0;
const tslib_1 = require("tslib");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
const redis_1 = require("../services/redis");
class AuditTrailService {
    static async logSecurityEvent(event, req) {
        const auditEvent = {
            id: crypto_1.default.randomUUID(),
            timestamp: new Date(),
            userId: req.user?.id,
            sessionId: req.sessionID || req.headers['x-session-id'],
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('user-agent') || 'unknown',
            fingerprint: this.generateEventFingerprint(req),
            riskScore: await this.calculateRiskScore(req),
            ...event,
            action: event.action || 'unknown',
            resource: event.resource || req.path,
            outcome: event.outcome || 'success'
        };
        logger_1.logger.info('Security audit event', auditEvent);
        await redis_1.redis.setEx(`audit:${auditEvent.id}`, 86400, JSON.stringify(auditEvent));
        if (auditEvent.riskScore > 0.8) {
            await this.triggerSecurityAlert(auditEvent);
        }
        await this.updateSecurityMetrics(auditEvent);
    }
    static generateEventFingerprint(req) {
        const components = [
            req.ip || 'unknown',
            req.get('user-agent') || 'unknown',
            req.path,
            req.user?.id || 'anonymous',
        ].join('|');
        return crypto_1.default.createHash('sha256').update(components).digest('hex').substring(0, 16);
    }
    static async calculateRiskScore(req) {
        let score = 0;
        try {
            const ipRisk = await this.getIPRiskScore(req.ip || '');
            score += ipRisk * 0.3;
            const userRisk = await this.getUserRiskScore(req.user?.id);
            score += userRisk * 0.4;
            const requestRisk = await this.getRequestRiskScore(req);
            score += requestRisk * 0.3;
            return Math.min(score, 1);
        }
        catch (error) {
            logger_1.logger.error('Error calculating risk score:', error);
            return 0.5;
        }
    }
    static async getIPRiskScore(ip) {
        if (!ip || ip === 'unknown')
            return 0.5;
        const violations = await redis_1.redis.get(`violations:${ip}`);
        if (violations && parseInt(violations) > 10) {
            return 0.9;
        }
        const isBlocked = await redis_1.redis.get(`blocked:${ip}`);
        if (isBlocked) {
            return 1.0;
        }
        const isTrusted = await redis_1.redis.get(`trusted:${ip}`);
        if (isTrusted) {
            return 0.1;
        }
        return 0.3;
    }
    static async getUserRiskScore(userId) {
        if (!userId)
            return 0.6;
        try {
            const trustScore = await redis_1.redis.get(`trust:${userId}`);
            if (trustScore) {
                return 1 - parseFloat(trustScore);
            }
            const authFailures = await redis_1.redis.get(`auth_failures:${userId}`);
            if (authFailures && parseInt(authFailures) > 5) {
                return 0.8;
            }
            return 0.2;
        }
        catch (error) {
            logger_1.logger.error('Error calculating user risk score:', error);
            return 0.5;
        }
    }
    static async getRequestRiskScore(req) {
        let risk = 0;
        const suspiciousPatterns = [
            /union.*select/i,
            /<script/i,
            /javascript:/i,
            /\.\.\/|\.\.\\/,
            /etc\/passwd/i,
            /cmd\.exe/i,
        ];
        const requestData = JSON.stringify(req.body) + req.url;
        const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(requestData));
        if (hasSuspiciousContent) {
            risk += 0.7;
        }
        const userId = req.user?.id || req.ip;
        const lastRequestTime = await redis_1.redis.get(`last_request:${userId}`);
        if (lastRequestTime) {
            const timeDiff = Date.now() - parseInt(lastRequestTime);
            if (timeDiff < 100) {
                risk += 0.3;
            }
        }
        await redis_1.redis.setEx(`last_request:${userId}`, 60, Date.now().toString());
        if (req.method === 'POST' && !req.get('content-type')?.includes('json')) {
            risk += 0.2;
        }
        return Math.min(risk, 1);
    }
    static async triggerSecurityAlert(event) {
        logger_1.logger.error('High-risk security event detected', {
            eventId: event.id,
            riskScore: event.riskScore,
            action: event.action,
            userId: event.userId,
            ipAddress: event.ipAddress,
            resource: event.resource,
        });
        await redis_1.redis.setEx(`alert:${event.id}`, 3600, JSON.stringify({
            ...event,
            alertLevel: 'HIGH',
            alertTime: new Date(),
        }));
    }
    static async updateSecurityMetrics(event) {
        const today = new Date().toISOString().split('T')[0];
        await redis_1.redis.incr(`metrics:${today}:total_events`);
        if (event.outcome === 'failure') {
            await redis_1.redis.incr(`metrics:${today}:failures`);
        }
        if (event.outcome === 'blocked') {
            await redis_1.redis.incr(`metrics:${today}:blocked`);
        }
        if (event.riskScore > 0.8) {
            await redis_1.redis.incr(`metrics:${today}:high_risk`);
        }
        await redis_1.redis.expire(`metrics:${today}:total_events`, 2592000);
        await redis_1.redis.expire(`metrics:${today}:failures`, 2592000);
        await redis_1.redis.expire(`metrics:${today}:blocked`, 2592000);
        await redis_1.redis.expire(`metrics:${today}:high_risk`, 2592000);
    }
}
exports.AuditTrailService = AuditTrailService;
const auditMiddleware = (action, resource) => {
    return async (req, res, next) => {
        const startTime = Date.now();
        const originalJson = res.json;
        let responseData;
        res.json = function (data) {
            responseData = data;
            return originalJson.call(this, data);
        };
        res.on('finish', async () => {
            const outcome = res.statusCode < 400 ? 'success' :
                res.statusCode < 500 ? 'blocked' : 'failure';
            await AuditTrailService.logSecurityEvent({
                action,
                resource: resource || req.route?.path || req.path,
                outcome,
                metadata: {
                    responseTime: Date.now() - startTime,
                    statusCode: res.statusCode,
                    contentLength: res.get('content-length'),
                    method: req.method,
                    hasError: !!responseData?.error,
                }
            }, req);
        });
        next();
    };
};
exports.auditMiddleware = auditMiddleware;
const authAuditMiddleware = async (req, res, next) => {
    const startTime = Date.now();
    res.on('finish', async () => {
        const isSuccess = res.statusCode === 200;
        const action = req.path.includes('login') ? 'login' :
            req.path.includes('register') ? 'register' :
                req.path.includes('logout') ? 'logout' : 'auth';
        await AuditTrailService.logSecurityEvent({
            action,
            resource: 'authentication',
            outcome: isSuccess ? 'success' : 'failure',
            metadata: {
                responseTime: Date.now() - startTime,
                statusCode: res.statusCode,
                email: req.body?.email,
                attemptedAction: action,
            }
        }, req);
        if (!isSuccess && req.body?.email) {
            const failures = await redis_1.redis.get(`auth_failures:${req.body.email}`) || '0';
            await redis_1.redis.setEx(`auth_failures:${req.body.email}`, 3600, (parseInt(failures) + 1).toString());
        }
    });
    next();
};
exports.authAuditMiddleware = authAuditMiddleware;
