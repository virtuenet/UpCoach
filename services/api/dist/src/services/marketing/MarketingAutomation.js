"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketingAutomation = exports.MarketingAutomationService = void 0;
const axios_1 = __importDefault(require("axios"));
const User_1 = require("../../models/User");
const logger_1 = require("../../utils/logger");
const AnalyticsService_1 = require("../analytics/AnalyticsService");
class MarketingAutomationService {
    campaigns = new Map();
    segmentEngine;
    contentPersonalizer;
    constructor() {
        this.segmentEngine = new SegmentEngine();
        this.contentPersonalizer = new ContentPersonalizer();
        this.initializeDefaultCampaigns();
    }
    initializeDefaultCampaigns() {
        this.campaigns.set('welcome-series', {
            id: 'welcome-series',
            name: 'Welcome Series',
            type: 'email',
            triggers: [{ event: 'user_registered' }],
            audience: { segments: ['new_users'] },
            content: {
                templateId: 'welcome-email-v2',
                body: '',
                personalization: true,
            },
            active: true,
        });
        this.campaigns.set('re-engagement', {
            id: 're-engagement',
            name: 'Win Back Inactive Users',
            type: 'email',
            triggers: [{ event: 'user_inactive_7_days' }],
            audience: {
                behaviors: [
                    {
                        action: 'app_open',
                        timeframe: 'last_7_days',
                        count: 0,
                        operator: 'equals',
                    },
                ],
            },
            content: {
                subject: "We miss you! Here's what you've been missing...",
                body: 'personalized_content',
                abTest: {
                    variants: [
                        {
                            id: 'discount',
                            weight: 0.5,
                            content: { subject: '🎁 Come back for 50% off your next month!' },
                        },
                        {
                            id: 'feature',
                            weight: 0.5,
                            content: { subject: '🚀 New features just for you!' },
                        },
                    ],
                },
            },
            active: true,
        });
        this.campaigns.set('goal-achieved', {
            id: 'goal-achieved',
            name: 'Goal Achievement Celebration',
            type: 'push',
            triggers: [{ event: 'goal_completed' }],
            audience: { segments: ['active_users'] },
            content: {
                body: '🎉 Congratulations on achieving your goal!',
                personalization: true,
            },
            active: true,
        });
        this.campaigns.set('subscription-renewal', {
            id: 'subscription-renewal',
            name: 'Subscription Renewal Reminder',
            type: 'email',
            triggers: [
                {
                    event: 'subscription_ending_soon',
                    conditions: { days_until_expiry: 7 },
                },
            ],
            audience: { segments: ['paid_users'] },
            content: {
                subject: 'Your UpCoach subscription is ending soon',
                body: 'renewal_reminder_template',
                personalization: true,
            },
            active: true,
        });
    }
    async trackEvent(event) {
        try {
            await Promise.all([
                this.sendToMixpanel(event),
                this.sendToGA4(event),
                this.sendToSegment(event),
            ]);
            await this.processCampaignTriggers(event);
            await this.segmentEngine.updateUserSegments(event.userId);
            logger_1.logger.info('Marketing event tracked', { event });
        }
        catch (error) {
            logger_1.logger.error('Failed to track marketing event', { error, event });
        }
    }
    async processCampaignTriggers(event) {
        for (const [id, campaign] of this.campaigns) {
            if (!campaign.active)
                continue;
            const matchingTrigger = campaign.triggers.find(trigger => trigger.event === event.event &&
                this.matchesConditions(trigger.conditions, event.properties));
            if (matchingTrigger) {
                await this.scheduleCampaignDelivery(campaign, event.userId, matchingTrigger.delay || 0);
            }
        }
    }
    async scheduleCampaignDelivery(campaign, userId, delayMinutes) {
        const user = await User_1.User.findByPk(userId);
        if (!user || !(await this.matchesAudience(user, campaign.audience))) {
            return;
        }
        const content = campaign.content.abTest
            ? this.selectABTestVariant(campaign.content.abTest)
            : campaign.content;
        const personalizedContent = campaign.content.personalization
            ? await this.contentPersonalizer.personalize(content, user)
            : content;
        const deliveryTime = new Date(Date.now() + delayMinutes * 60 * 1000);
        await this.scheduleDelivery({
            campaignId: campaign.id,
            userId,
            type: campaign.type,
            content: personalizedContent,
            scheduledFor: deliveryTime,
        });
        logger_1.logger.info('Campaign scheduled', {
            campaignId: campaign.id,
            userId,
            scheduledFor: deliveryTime,
        });
    }
    async matchesAudience(user, audience) {
        if (audience.segments) {
            const userSegments = await this.segmentEngine.getUserSegments(user.id);
            const hasRequiredSegment = audience.segments.some(segment => userSegments.includes(segment));
            if (!hasRequiredSegment)
                return false;
        }
        if (audience.properties) {
            for (const [key, value] of Object.entries(audience.properties)) {
                if (user[key] !== value)
                    return false;
            }
        }
        if (audience.behaviors) {
            for (const behavior of audience.behaviors) {
                if (!(await this.matchesBehavior(user.id, behavior))) {
                    return false;
                }
            }
        }
        return true;
    }
    async sendToMixpanel(event) {
        if (!process.env.MIXPANEL_TOKEN)
            return;
        try {
            await axios_1.default.post('https://api.mixpanel.com/track', {
                event: event.event,
                properties: {
                    distinct_id: event.userId,
                    time: event.timestamp || new Date(),
                    ...event.properties,
                },
            }, {
                headers: {
                    Authorization: `Basic ${Buffer.from(process.env.MIXPANEL_TOKEN).toString('base64')}`,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to send to Mixpanel', { error });
        }
    }
    async sendToGA4(event) {
        if (!process.env.GA4_MEASUREMENT_ID || !process.env.GA4_API_SECRET)
            return;
        try {
            await axios_1.default.post(`https://www.google-analytics.com/mp/collect`, {
                client_id: event.userId,
                events: [
                    {
                        name: event.event,
                        params: event.properties,
                    },
                ],
            }, {
                params: {
                    measurement_id: process.env.GA4_MEASUREMENT_ID,
                    api_secret: process.env.GA4_API_SECRET,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to send to GA4', { error });
        }
    }
    async sendToSegment(event) {
        if (!process.env.SEGMENT_WRITE_KEY)
            return;
        try {
            await axios_1.default.post('https://api.segment.io/v1/track', {
                userId: event.userId,
                event: event.event,
                properties: event.properties,
                timestamp: event.timestamp,
            }, {
                headers: {
                    Authorization: `Basic ${Buffer.from(process.env.SEGMENT_WRITE_KEY + ':').toString('base64')}`,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to send to Segment', { error });
        }
    }
    matchesConditions(conditions, properties) {
        if (!conditions)
            return true;
        if (!properties)
            return false;
        return Object.entries(conditions).every(([key, value]) => properties[key] === value);
    }
    selectABTestVariant(abTest) {
        const random = Math.random();
        let cumulativeWeight = 0;
        for (const variant of abTest.variants) {
            cumulativeWeight += variant.weight;
            if (random < cumulativeWeight) {
                return variant.content;
            }
        }
        return abTest.variants[0].content;
    }
    async matchesBehavior(userId, behavior) {
        try {
            const count = await AnalyticsService_1.analyticsService.getUserActionCount(userId, behavior.action, behavior.timeframe);
            switch (behavior.operator) {
                case 'equals':
                    return count === behavior.count;
                case 'greater_than':
                    return count > (behavior.count || 0);
                case 'less_than':
                    return count < (behavior.count || 0);
                default:
                    return false;
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to match behavior', { error, userId, behavior });
            return false;
        }
    }
    async scheduleDelivery(delivery) {
        setTimeout(async () => {
            await this.deliverCampaign(delivery);
        }, delivery.scheduledFor.getTime() - Date.now());
    }
    async deliverCampaign(delivery) {
        switch (delivery.type) {
            case 'email':
                break;
            case 'push':
                break;
            case 'in-app':
                break;
            case 'sms':
                break;
        }
    }
}
exports.MarketingAutomationService = MarketingAutomationService;
class SegmentEngine {
    async getUserSegments(userId) {
        const segments = [];
        const user = await User_1.User.findByPk(userId, {
            include: ['goals', 'subscriptions', 'activities'],
        });
        if (!user)
            return segments;
        if (user.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
            segments.push('new_users');
        }
        if (user.subscriptions?.some((s) => s.status === 'active')) {
            segments.push('paid_users');
        }
        else {
            segments.push('free_users');
        }
        const recentActivity = user.activities?.filter((a) => a.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) || [];
        if (recentActivity?.length > 20) {
            segments.push('power_users');
        }
        else if (recentActivity?.length > 5) {
            segments.push('active_users');
        }
        else {
            segments.push('at_risk_users');
        }
        const completedGoals = user.goals?.filter((g) => g.status === 'completed');
        if (completedGoals && completedGoals.length > 0) {
            segments.push('goal_achievers');
        }
        return segments;
    }
    async updateUserSegments(userId) {
        try {
            const segments = await this.getUserSegments(userId);
            await AnalyticsService_1.analyticsService.updateUserProperty(userId, 'segments', segments);
            logger_1.logger.info('User segments updated', { userId, segments });
        }
        catch (error) {
            logger_1.logger.error('Failed to update user segments', { error, userId });
        }
    }
}
class ContentPersonalizer {
    async personalize(content, user) {
        const personalizedContent = { ...content };
        if (typeof personalizedContent.subject === 'string') {
            personalizedContent.subject = this.replaceMergeTags(personalizedContent.subject, user);
        }
        if (typeof personalizedContent.body === 'string') {
            personalizedContent.body = this.replaceMergeTags(personalizedContent.body, user);
        }
        if (personalizedContent.body === 'personalized_content') {
            personalizedContent.body = await this.generatePersonalizedContent(user);
        }
        return personalizedContent;
    }
    replaceMergeTags(text, user) {
        const tags = {
            '{first_name}': user.name.split(' ')[0],
            '{name}': user.name,
            '{email}': user.email,
            '{join_date}': user.createdAt.toLocaleDateString(),
        };
        return Object.entries(tags).reduce((result, [tag, value]) => result.replace(new RegExp(tag, 'g'), value), text);
    }
    async generatePersonalizedContent(user) {
        return `Hi ${user.name.split(' ')[0]}, here's your personalized update...`;
    }
}
exports.marketingAutomation = new MarketingAutomationService();
//# sourceMappingURL=MarketingAutomation.js.map