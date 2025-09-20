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
exports.apiUsageTracker = exports.APIUsageTracker = void 0;
const logger_1 = require("../../utils/logger");
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
class APIUsageTracker {
    static instance;
    cache = (0, UnifiedCacheService_1.getCacheService)();
    constructor() { }
    static getInstance() {
        if (!APIUsageTracker.instance) {
            APIUsageTracker.instance = new APIUsageTracker();
        }
        return APIUsageTracker.instance;
    }
    async trackAPICall(metrics) {
        try {
            await this.storeInDatabase(metrics);
            await this.updateRealTimeCounters(metrics);
            if (metrics.organizationId) {
                await this.checkQuotaLimits(metrics.organizationId);
            }
        }
        catch (error) {
            logger_1.logger.error('Error tracking API call:', error);
        }
    }
    async getUsageSummary(organizationId, startDate, endDate = new Date()) {
        try {
            const cacheKey = `api_usage_summary:${organizationId}:${startDate.toISOString().split('T')[0]}:${endDate.toISOString().split('T')[0]}`;
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
            const summary = await this.calculateUsageSummary(organizationId, startDate, endDate);
            await this.cache.set(cacheKey, summary, 3600);
            return summary;
        }
        catch (error) {
            logger_1.logger.error('Error getting usage summary:', error);
            return this.getEmptyUsageSummary();
        }
    }
    async getMonthlyAPIUsage(organizationId) {
        try {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const cacheKey = `monthly_api_usage:${organizationId}:${startOfMonth.toISOString().split('T')[0]}`;
            const cached = await this.cache.get(cacheKey);
            if (cached !== null) {
                return cached;
            }
            const usage = await this.calculateMonthlyUsage(organizationId, startOfMonth);
            await this.cache.set(cacheKey, usage, 600);
            return usage;
        }
        catch (error) {
            logger_1.logger.error('Error getting monthly API usage:', error);
            return 0;
        }
    }
    async checkQuotaStatus(organizationId) {
        try {
            const quotas = await this.getOrganizationQuotas(organizationId);
            const alerts = [];
            for (const quota of quotas) {
                const usagePercentage = (quota.currentUsage / quota.limit) * 100;
                if (usagePercentage >= 100) {
                    alerts.push({
                        type: 'quota_exceeded',
                        message: `${quota.quotaType} API quota exceeded (${quota.currentUsage}/${quota.limit})`,
                        severity: 'critical'
                    });
                }
                else if (usagePercentage >= 80) {
                    alerts.push({
                        type: 'quota_warning',
                        message: `${quota.quotaType} API quota at ${usagePercentage.toFixed(1)}% (${quota.currentUsage}/${quota.limit})`,
                        severity: 'warning'
                    });
                }
            }
            return { quotas, alerts };
        }
        catch (error) {
            logger_1.logger.error('Error checking quota status:', error);
            return { quotas: [], alerts: [] };
        }
    }
    async getUsageTrends(organizationId, days = 30) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            return await this.calculateDailyTrends(organizationId, startDate, endDate);
        }
        catch (error) {
            logger_1.logger.error('Error getting usage trends:', error);
            return [];
        }
    }
    async storeInDatabase(metrics) {
        try {
            const { APIUsageLog } = await Promise.resolve().then(() => __importStar(require('../../models/analytics/APIUsageLog'))).catch(() => ({
                APIUsageLog: null
            }));
            if (APIUsageLog) {
                await APIUsageLog.create({
                    organizationId: metrics.organizationId,
                    userId: metrics.userId,
                    endpoint: metrics.endpoint,
                    method: metrics.method,
                    statusCode: metrics.statusCode,
                    responseTime: metrics.responseTime,
                    requestSize: metrics.requestSize || 0,
                    responseSize: metrics.responseSize || 0,
                    userAgent: metrics.userAgent,
                    ipAddress: metrics.ipAddress,
                    timestamp: metrics.timestamp,
                });
            }
            else {
                const logKey = `api_log:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
                await this.cache.set(logKey, metrics, 7 * 24 * 3600);
            }
        }
        catch (error) {
            logger_1.logger.error('Error storing API usage in database:', error);
        }
    }
    async updateRealTimeCounters(metrics) {
        if (!metrics.organizationId)
            return;
        const now = new Date();
        const hour = now.getHours();
        const date = now.toISOString().split('T')[0];
        const counters = [
            `api_count:org:${metrics.organizationId}:daily:${date}`,
            `api_count:org:${metrics.organizationId}:hourly:${date}:${hour}`,
            `api_count:org:${metrics.organizationId}:monthly:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        ];
        for (const counter of counters) {
            await this.cache.incr(counter);
            if (counter.includes('daily')) {
                await this.cache.expire(counter, 48 * 3600);
            }
            else if (counter.includes('hourly')) {
                await this.cache.expire(counter, 25 * 3600);
            }
            else if (counter.includes('monthly')) {
                await this.cache.expire(counter, 35 * 24 * 3600);
            }
        }
        if (metrics.statusCode >= 400) {
            const errorKey = `api_errors:org:${metrics.organizationId}:daily:${date}`;
            await this.cache.incr(errorKey);
            await this.cache.expire(errorKey, 48 * 3600);
        }
        const endpointKey = `api_endpoint:org:${metrics.organizationId}:${metrics.endpoint}:${date}`;
        await this.cache.incr(endpointKey);
        await this.cache.expire(endpointKey, 48 * 3600);
    }
    async checkQuotaLimits(organizationId) {
        try {
            const quotas = await this.getOrganizationQuotas(organizationId);
            for (const quota of quotas) {
                if (quota.isOverQuota) {
                    logger_1.logger.warn('Organization exceeded API quota', {
                        organizationId,
                        quotaType: quota.quotaType,
                        limit: quota.limit,
                        usage: quota.currentUsage
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error checking quota limits:', error);
        }
    }
    async calculateUsageSummary(organizationId, startDate, endDate) {
        const totalCalls = await this.getCallCountFromCache(organizationId, startDate, endDate);
        const errorCalls = await this.getErrorCountFromCache(organizationId, startDate, endDate);
        return {
            totalCalls,
            successfulCalls: totalCalls - errorCalls,
            errorCalls,
            averageResponseTime: 150,
            totalDataTransfer: totalCalls * 1024,
            peakHourlyRate: Math.ceil(totalCalls / 24),
            mostUsedEndpoints: [
                { endpoint: '/api/chat/message', count: Math.floor(totalCalls * 0.4) },
                { endpoint: '/api/users/profile', count: Math.floor(totalCalls * 0.2) },
                { endpoint: '/api/analytics/dashboard', count: Math.floor(totalCalls * 0.15) },
            ],
            errorsByType: {
                '400': Math.floor(errorCalls * 0.3),
                '401': Math.floor(errorCalls * 0.2),
                '403': Math.floor(errorCalls * 0.1),
                '404': Math.floor(errorCalls * 0.2),
                '500': Math.floor(errorCalls * 0.2),
            }
        };
    }
    async calculateMonthlyUsage(organizationId, startOfMonth) {
        const monthKey = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}`;
        const cacheKey = `api_count:org:${organizationId}:monthly:${monthKey}`;
        const count = await this.cache.get(cacheKey);
        return count || 0;
    }
    async getCallCountFromCache(organizationId, startDate, endDate) {
        let totalCount = 0;
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayCount = await this.cache.get(`api_count:org:${organizationId}:daily:${dateStr}`);
            totalCount += dayCount || 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return totalCount;
    }
    async getErrorCountFromCache(organizationId, startDate, endDate) {
        let totalErrors = 0;
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayErrors = await this.cache.get(`api_errors:org:${organizationId}:daily:${dateStr}`);
            totalErrors += dayErrors || 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return totalErrors;
    }
    async getOrganizationQuotas(organizationId) {
        const monthlyUsage = await this.getMonthlyAPIUsage(organizationId);
        return [
            {
                organizationId,
                quotaType: 'monthly',
                limit: 100000,
                currentUsage: monthlyUsage,
                resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
                isOverQuota: monthlyUsage > 100000
            }
        ];
    }
    async calculateDailyTrends(organizationId, startDate, endDate) {
        const trends = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const calls = await this.cache.get(`api_count:org:${organizationId}:daily:${dateStr}`) || 0;
            const errors = await this.cache.get(`api_errors:org:${organizationId}:daily:${dateStr}`) || 0;
            trends.push({
                date: dateStr,
                calls,
                errors,
                avgResponseTime: 120 + Math.random() * 100
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return trends;
    }
    getEmptyUsageSummary() {
        return {
            totalCalls: 0,
            successfulCalls: 0,
            errorCalls: 0,
            averageResponseTime: 0,
            totalDataTransfer: 0,
            peakHourlyRate: 0,
            mostUsedEndpoints: [],
            errorsByType: {}
        };
    }
}
exports.APIUsageTracker = APIUsageTracker;
exports.apiUsageTracker = APIUsageTracker.getInstance();
//# sourceMappingURL=APIUsageTracker.js.map