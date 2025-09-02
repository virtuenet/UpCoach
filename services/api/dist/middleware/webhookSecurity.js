"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.webhookRateLimit = webhookRateLimit;
exports.webhookIPWhitelist = webhookIPWhitelist;
exports.deduplicateWebhook = deduplicateWebhook;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
const redis_1 = require("../services/redis");
/**
 * Generic webhook signature verification middleware
 */
function verifyWebhookSignature(config) {
    return async (req, _res, next) => {
        const { secret, algorithm = 'sha256', headerName = 'x-webhook-signature', maxAge = 300, // 5 minutes default
        replayProtection = true, } = config;
        try {
            // Get signature from header
            const signature = req.headers[headerName];
            if (!signature) {
                logger_1.logger.error(`Missing webhook signature header: ${headerName}`);
                return _res.status(401).json({
                    error: 'Missing signature',
                    code: 'MISSING_SIGNATURE',
                });
            }
            // Get timestamp if included in signature
            const timestamp = req.headers['x-webhook-timestamp'];
            // Check timestamp to prevent replay attacks
            if (replayProtection && timestamp) {
                const currentTime = Math.floor(Date.now() / 1000);
                const webhookTime = parseInt(timestamp, 10);
                if (isNaN(webhookTime)) {
                    return _res.status(401).json({
                        error: 'Invalid timestamp',
                        code: 'INVALID_TIMESTAMP',
                    });
                }
                const age = currentTime - webhookTime;
                if (age > maxAge || age < -maxAge) {
                    logger_1.logger.warn('Webhook timestamp outside allowed window', {
                        age,
                        maxAge,
                    });
                    return _res.status(401).json({
                        error: 'Request too old',
                        code: 'REQUEST_TOO_OLD',
                    });
                }
            }
            // Calculate expected signature
            const payload = timestamp
                ? `${timestamp}.${JSON.stringify(req.body)}`
                : JSON.stringify(req.body);
            const expectedSignature = crypto_1.default
                .createHmac(algorithm, secret)
                .update(payload, 'utf8')
                .digest('hex');
            // Compare signatures using timing-safe comparison
            const signatureBuffer = Buffer.from(signature, 'hex');
            const expectedBuffer = Buffer.from(expectedSignature, 'hex');
            if (signatureBuffer.length !== expectedBuffer.length) {
                logger_1.logger.error('Signature length mismatch');
                return _res.status(401).json({
                    error: 'Invalid signature',
                    code: 'INVALID_SIGNATURE',
                });
            }
            if (!crypto_1.default.timingSafeEqual(signatureBuffer, expectedBuffer)) {
                logger_1.logger.error('Webhook signature verification failed');
                return _res.status(401).json({
                    error: 'Invalid signature',
                    code: 'INVALID_SIGNATURE',
                });
            }
            // Check for replay if we have an event ID
            if (replayProtection && req.body.id) {
                const eventKey = `webhook:processed:${req.body.id}`;
                const wasProcessed = await redis_1.redis.get(eventKey);
                if (wasProcessed) {
                    logger_1.logger.warn('Duplicate webhook detected', { eventId: req.body.id });
                    return _res.status(200).json({
                        received: true,
                        duplicate: true,
                    });
                }
                // Mark as processed (expire after 24 hours)
                await redis_1.redis.setEx(eventKey, 86400, 'true');
            }
            logger_1.logger.info('Webhook signature verified successfully');
            next();
        }
        catch (error) {
            logger_1.logger.error('Webhook verification error:', error);
            _res.status(500).json({
                error: 'Verification error',
                code: 'VERIFICATION_ERROR',
            });
        }
    };
}
/**
 * Rate limiting for webhooks
 */
function webhookRateLimit(maxRequests = 100, windowMs = 60000) {
    const requests = new Map();
    return (req, _res, next) => {
        const identifier = req.ip || 'unknown';
        const now = Date.now();
        const windowStart = now - windowMs;
        // Get existing requests for this identifier
        const existingRequests = requests.get(identifier) || [];
        // Filter out old requests
        const recentRequests = existingRequests.filter(time => time > windowStart);
        if (recentRequests.length >= maxRequests) {
            logger_1.logger.warn('Webhook rate limit exceeded', {
                identifier,
                requests: recentRequests.length,
            });
            return _res.status(429).json({
                error: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED',
            });
        }
        // Add current request
        recentRequests.push(now);
        requests.set(identifier, recentRequests);
        // Clean up old entries periodically
        if (Math.random() < 0.01) {
            // 1% chance
            for (const [key, times] of requests.entries()) {
                const recent = times.filter(time => time > windowStart);
                if (recent.length === 0) {
                    requests.delete(key);
                }
                else {
                    requests.set(key, recent);
                }
            }
        }
        next();
    };
}
/**
 * IP whitelist for webhooks
 */
function webhookIPWhitelist(allowedIPs) {
    return (req, _res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress || '';
        // Check if IP is in whitelist
        const isAllowed = allowedIPs.some(ip => {
            if (ip.includes('/')) {
                // CIDR notation support
                return isIPInCIDR(clientIP, ip);
            }
            return clientIP === ip;
        });
        if (!isAllowed) {
            logger_1.logger.warn('Webhook from unauthorized IP', { clientIP });
            return _res.status(403).json({
                error: 'Unauthorized IP',
                code: 'UNAUTHORIZED_IP',
            });
        }
        next();
    };
}
/**
 * Check if IP is in CIDR range
 */
function isIPInCIDR(ip, cidr) {
    const [range, bits] = cidr.split('/');
    const mask = (0xffffffff << (32 - parseInt(bits, 10))) >>> 0;
    const ipNum = ipToNumber(ip);
    const rangeNum = ipToNumber(range);
    return (ipNum & mask) === (rangeNum & mask);
}
/**
 * Convert IP address to number
 */
function ipToNumber(ip) {
    const parts = ip.split('.');
    return (parts.reduce((acc, part, i) => {
        return acc + (parseInt(part, 10) << (8 * (3 - i)));
    }, 0) >>> 0);
}
/**
 * Webhook event deduplication
 */
async function deduplicateWebhook(eventId, ttl = 86400 // 24 hours default
) {
    const key = `webhook:event:${eventId}`;
    try {
        // Check if event was already processed
        const exists = await redis_1.redis.get(key);
        if (exists) {
            logger_1.logger.info('Duplicate webhook event detected', { eventId });
            return true; // Is duplicate
        }
        // Mark as processed
        await redis_1.redis.setEx(key, ttl, JSON.stringify({
            processedAt: new Date().toISOString(),
            eventId,
        }));
        return false; // Not duplicate
    }
    catch (error) {
        logger_1.logger.error('Error checking webhook deduplication', { error, eventId });
        return false; // Process anyway on error
    }
}
//# sourceMappingURL=webhookSecurity.js.map