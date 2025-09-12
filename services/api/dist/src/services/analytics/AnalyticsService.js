"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const axios_1 = __importDefault(require("axios"));
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
    async getUserSessionCount(userId) {
        return 0;
    }
    async getUserEventCount(userId) {
        return 0;
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
//# sourceMappingURL=AnalyticsService.js.map