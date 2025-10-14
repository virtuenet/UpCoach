"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
const logger_1 = require("../../utils/logger");
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
class AnalyticsService {
    mixpanelToken;
    googleAnalyticsId;
    segmentWriteKey;
    amplitudeApiKey;
    batchQueue = [];
    batchInterval;
    constructor() {
        this.mixpanelToken = process.env.MIXPANEL_TOKEN || '';
        this.googleAnalyticsId = process.env.GA_MEASUREMENT_ID || '';
        this.segmentWriteKey = process.env.SEGMENT_WRITE_KEY;
        this.amplitudeApiKey = process.env.AMPLITUDE_API_KEY;
        this.batchInterval = setInterval(() => {
            this.flushBatch();
        }, 5000);
    }
    async track(event) {
        try {
            this.batchQueue.push({
                ...event,
                timestamp: event.timestamp || new Date(),
                context: {
                    ...event.context,
                    app: {
                        name: 'UpCoach',
                        version: process.env.APP_VERSION || '1.0.0',
                    },
                },
            });
            if (this.batchQueue.length >= 100) {
                await this.flushBatch();
            }
            if (this.isCriticalEvent(event.event)) {
                await this.sendRealTimeEvent(event);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to track event', { error, event });
        }
    }
    async identify(traits) {
        try {
            const promises = [];
            if (this.mixpanelToken) {
                promises.push(this.identifyMixpanel(traits));
            }
            if (this.segmentWriteKey) {
                promises.push(this.identifySegment(traits));
            }
            if (this.amplitudeApiKey) {
                promises.push(this.identifyAmplitude(traits));
            }
            await Promise.all(promises);
            await (0, UnifiedCacheService_1.getCacheService)().set(`analytics:user:${traits.userId}`, traits, { ttl: 3600 });
        }
        catch (error) {
            logger_1.logger.error('Failed to identify user', { error, traits });
        }
    }
    async trackPageView(req, pagePath, pageTitle) {
        const userId = req.user?.id;
        const sessionId = req.session?.id || req.get('x-session-id');
        const ip = req.ip;
        const userAgent = req.get('user-agent');
        const referrer = req.get('referrer');
        await this.track({
            userId: userId ? Number(userId) : undefined,
            anonymousId: sessionId,
            event: 'Page Viewed',
            properties: {
                path: pagePath,
                title: pageTitle,
                url: `${req.protocol}://${req.get('host')}${pagePath}`,
                referrer,
            },
            context: {
                ip,
                userAgent,
                campaign: this.extractCampaignParams(req),
            },
        });
    }
    async trackUserAction(userId, action, properties) {
        await this.track({
            userId,
            event: action,
            properties,
        });
    }
    async trackConversion(userId, conversionType, value, currency = 'USD', properties) {
        await this.track({
            userId,
            event: `Conversion: ${conversionType}`,
            properties: {
                ...properties,
                value,
                currency,
                conversionType,
            },
        });
        if (this.googleAnalyticsId) {
            await this.sendGoogleAnalyticsConversion(userId, conversionType, value, currency);
        }
    }
    async trackRevenue(userId, amount, currency = 'USD', productId, properties) {
        await this.track({
            userId,
            event: 'Revenue',
            properties: {
                ...properties,
                amount,
                currency,
                productId,
                revenueType: properties?.revenueType || 'subscription',
            },
        });
    }
    async trackError(error, context, userId) {
        await this.track({
            userId,
            event: 'Error Occurred',
            properties: {
                errorMessage: error.message,
                errorStack: error.stack,
                errorName: error.name,
                ...context,
            },
        });
    }
    async getUserAnalytics(userId) {
        const cacheKey = `analytics:summary:${userId}`;
        const cached = await (0, UnifiedCacheService_1.getCacheService)().get(cacheKey);
        if (cached)
            return cached;
        try {
            const summary = {
                totalSessions: await this.getUserSessionCount(userId),
                totalEvents: await this.getUserEventCount(userId),
                lastActive: await this.getUserLastActive(userId),
                engagementScore: await this.calculateEngagementScore(userId),
                behaviorSegment: await this.getUserSegment(userId),
            };
            await (0, UnifiedCacheService_1.getCacheService)().set(cacheKey, summary, { ttl: 300 });
            return summary;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user analytics', { error, userId });
            return null;
        }
    }
    async flushBatch() {
        if (this.batchQueue.length === 0)
            return;
        const events = [...this.batchQueue];
        this.batchQueue = [];
        try {
            const promises = [];
            if (this.mixpanelToken) {
                promises.push(this.sendToMixpanel(events));
            }
            if (this.segmentWriteKey) {
                promises.push(this.sendToSegment(events));
            }
            if (this.amplitudeApiKey) {
                promises.push(this.sendToAmplitude(events));
            }
            await Promise.all(promises);
        }
        catch (error) {
            logger_1.logger.error('Failed to flush analytics batch', { error });
            this.batchQueue.unshift(...events);
        }
    }
    async sendToMixpanel(events) {
        const mixpanelEvents = events.map(event => ({
            event: event.event,
            properties: {
                ...event.properties,
                distinct_id: event.userId || event.anonymousId,
                time: Math.floor(event.timestamp.getTime() / 1000),
                token: this.mixpanelToken,
            },
        }));
        await axios_1.default.post('https://api.mixpanel.com/track', mixpanelEvents, {
            headers: { 'Content-Type': 'application/json' },
        });
    }
    async sendToSegment(events) {
        const segmentEvents = events.map(event => ({
            type: 'track',
            userId: event.userId?.toString(),
            anonymousId: event.anonymousId,
            event: event.event,
            properties: event.properties,
            context: event.context,
            timestamp: event.timestamp?.toISOString(),
        }));
        await axios_1.default.post('https://api.segment.io/v1/batch', { batch: segmentEvents }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${Buffer.from(this.segmentWriteKey + ':').toString('base64')}`,
            },
        });
    }
    async sendToAmplitude(events) {
        const amplitudeEvents = events.map(event => ({
            user_id: event.userId?.toString(),
            device_id: event.anonymousId,
            event_type: event.event,
            event_properties: event.properties,
            user_properties: event.context,
            time: event.timestamp.getTime(),
        }));
        await axios_1.default.post('https://api.amplitude.com/2/httpapi', {
            api_key: this.amplitudeApiKey,
            events: amplitudeEvents,
        }, {
            headers: { 'Content-Type': 'application/json' },
        });
    }
    async sendGoogleAnalyticsConversion(userId, conversionType, value, currency) {
        await axios_1.default.post(`https://www.google-analytics.com/mp/collect?measurement_id=${this.googleAnalyticsId}&api_secret=${process.env.GA_API_SECRET}`, {
            client_id: userId.toString(),
            events: [
                {
                    name: 'conversion',
                    params: {
                        conversion_type: conversionType,
                        value,
                        currency,
                    },
                },
            ],
        });
    }
    async identifyMixpanel(traits) {
        await axios_1.default.post('https://api.mixpanel.com/engage', {
            $token: this.mixpanelToken,
            $distinct_id: traits.userId.toString(),
            $set: {
                $email: traits.email,
                $name: traits.name,
                plan: traits.plan,
                role: traits.role,
                ...traits.customTraits,
            },
        }, {
            headers: { 'Content-Type': 'application/json' },
        });
    }
    async identifySegment(traits) {
        await axios_1.default.post('https://api.segment.io/v1/identify', {
            userId: traits.userId.toString(),
            traits: {
                email: traits.email,
                name: traits.name,
                plan: traits.plan,
                role: traits.role,
                createdAt: traits.createdAt,
                ...traits.customTraits,
            },
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${Buffer.from(this.segmentWriteKey + ':').toString('base64')}`,
            },
        });
    }
    async identifyAmplitude(traits) {
        await axios_1.default.post('https://api.amplitude.com/2/httpapi', {
            api_key: this.amplitudeApiKey,
            events: [
                {
                    user_id: traits.userId.toString(),
                    event_type: '$identify',
                    user_properties: {
                        $set: {
                            email: traits.email,
                            name: traits.name,
                            plan: traits.plan,
                            role: traits.role,
                            ...traits.customTraits,
                        },
                    },
                },
            ],
        }, {
            headers: { 'Content-Type': 'application/json' },
        });
    }
    isCriticalEvent(eventName) {
        const criticalEvents = [
            'User Signed Up',
            'Subscription Started',
            'Payment Failed',
            'Error Occurred',
            'User Churned',
        ];
        return criticalEvents.includes(eventName);
    }
    async sendRealTimeEvent(event) {
        logger_1.logger.info('Critical event tracked', { event });
    }
    extractCampaignParams(req) {
        const query = req.query;
        return {
            source: query.utm_source,
            medium: query.utm_medium,
            campaign: query.utm_campaign,
            term: query.utm_term,
            content: query.utm_content,
        };
    }
    async getUserActionCount(userId, action, timeframe) {
        try {
            const cacheKey = `analytics:action_count:${userId}:${action}:${timeframe}`;
            const cached = await (0, UnifiedCacheService_1.getCacheService)().get(cacheKey);
            if (cached)
                return cached;
            const timeframeParts = timeframe.match(/last_(\d+)_(\w+)/);
            if (!timeframeParts) {
                logger_1.logger.warn('Invalid timeframe format', { timeframe });
                return 0;
            }
            const [, amount, unit] = timeframeParts;
            const duration = this.parseTimeframeToDuration(parseInt(amount), unit);
            const since = new Date(Date.now() - duration);
            const result = await models_1.sequelize.query(`
        SELECT COUNT(*) as count
        FROM user_activity_logs
        WHERE user_id = $1
          AND activity_type = $2
          AND created_at >= $3
      `, {
                bind: [userId, action, since],
                type: sequelize_1.QueryTypes.SELECT
            });
            const count = parseInt(result[0]?.count || '0');
            await (0, UnifiedCacheService_1.getCacheService)().set(cacheKey, count, { ttl: 300 });
            return count;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user action count', { error, userId, action, timeframe });
            return 0;
        }
    }
    async updateUserProperty(userId, property, value) {
        try {
            const traits = {
                userId: parseInt(userId),
                customTraits: {
                    [property]: value,
                },
            };
            await this.identify(traits);
            const cacheKey = `analytics:user_property:${userId}:${property}`;
            await (0, UnifiedCacheService_1.getCacheService)().set(cacheKey, value, { ttl: 3600 });
            logger_1.logger.info('User property updated', { userId, property, value });
        }
        catch (error) {
            logger_1.logger.error('Failed to update user property', { error, userId, property, value });
            throw error;
        }
    }
    parseTimeframeToDuration(amount, unit) {
        const multipliers = {
            minutes: 60 * 1000,
            minute: 60 * 1000,
            hours: 60 * 60 * 1000,
            hour: 60 * 60 * 1000,
            days: 24 * 60 * 60 * 1000,
            day: 24 * 60 * 60 * 1000,
            weeks: 7 * 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            months: 30 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000,
        };
        return amount * (multipliers[unit] || multipliers.day);
    }
    async getUserSessionCount(userId) {
        try {
            const result = await models_1.sequelize.query(`
        SELECT COUNT(DISTINCT session_id) as count
        FROM user_activity_logs
        WHERE user_id = $1
          AND activity_type = 'session_start'
          AND created_at >= NOW() - INTERVAL '30 days'
      `, {
                bind: [userId],
                type: sequelize_1.QueryTypes.SELECT
            });
            return parseInt(result[0]?.count || '0');
        }
        catch (error) {
            logger_1.logger.error('Failed to get user session count', { error, userId });
            return 0;
        }
    }
    async getUserEventCount(userId) {
        try {
            const result = await models_1.sequelize.query(`
        SELECT COUNT(*) as count
        FROM user_activity_logs
        WHERE user_id = $1
          AND created_at >= NOW() - INTERVAL '30 days'
      `, {
                bind: [userId],
                type: sequelize_1.QueryTypes.SELECT
            });
            return parseInt(result[0]?.count || '0');
        }
        catch (error) {
            logger_1.logger.error('Failed to get user event count', { error, userId });
            return 0;
        }
    }
    async getUserLastActive(userId) {
        return null;
    }
    async calculateEngagementScore(userId) {
        return 0;
    }
    async getUserSegment(userId) {
        return 'active';
    }
    destroy() {
        if (this.batchInterval) {
            clearInterval(this.batchInterval);
        }
        this.flushBatch();
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
