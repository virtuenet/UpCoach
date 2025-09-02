"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentAnalytics = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
// ContentAnalytics model class
class ContentAnalytics extends sequelize_1.Model {
    id;
    contentType;
    contentId;
    userId;
    sessionId;
    event;
    metadata;
    ipAddress;
    timestamp;
    // Static methods for analytics
    static async getContentViews(contentType, contentId, timeframe = 'week') {
        const startDate = new Date();
        if (timeframe === 'day') {
            startDate.setDate(startDate.getDate() - 1);
        }
        else if (timeframe === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        }
        else {
            startDate.setMonth(startDate.getMonth() - 1);
        }
        return ContentAnalytics.count({
            where: {
                contentType,
                contentId,
                event: 'view',
                timestamp: { [sequelize_1.Op.gte]: startDate },
            },
        });
    }
    static async getPopularContent(contentType, limit = 10) {
        const result = await sequelize_2.sequelize.query(`
      SELECT 
        content_id,
        COUNT(*) as view_count,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(CASE WHEN metadata->>'readTime' IS NOT NULL 
            THEN (metadata->>'readTime')::integer 
            ELSE NULL END) as avg_read_time
      FROM content_analytics
      WHERE content_type = :contentType
        AND event = 'view'
        AND timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY content_id
      ORDER BY view_count DESC
      LIMIT :limit
    `, {
            replacements: { contentType, limit },
            type: sequelize_1.QueryTypes.SELECT,
        });
        return result;
    }
    static async getUserEngagement(userId) {
        const analytics = await ContentAnalytics.findAll({
            where: { userId },
            attributes: ['event', 'contentType', 'metadata'],
            raw: true,
        });
        const stats = {
            totalViews: 0,
            totalReadTime: 0,
            articlesRead: 0,
            coursesStarted: 0,
            coursesCompleted: 0,
        };
        analytics.forEach((record) => {
            if (record.event === 'view') {
                stats.totalViews++;
                if (record.metadata?.readTime) {
                    stats.totalReadTime += record.metadata.readTime;
                }
            }
            if (record.event === 'read' && record.contentType === 'article') {
                stats.articlesRead++;
            }
            if (record.event === 'view' && record.contentType === 'course') {
                stats.coursesStarted++;
            }
            if (record.event === 'complete' && record.contentType === 'course') {
                stats.coursesCompleted++;
            }
        });
        return stats;
    }
    static async getContentPerformance(contentType, contentId) {
        const analytics = await ContentAnalytics.findAll({
            where: { contentType, contentId },
            attributes: ['event', 'userId', 'metadata'],
            raw: true,
        });
        const uniqueUsers = new Set(analytics.filter(a => a.userId).map((a) => a.userId)).size;
        const views = analytics.filter((a) => a.event === 'view');
        const completes = analytics.filter((a) => a.event === 'complete');
        const readTimes = analytics
            .filter((a) => a.metadata?.readTime)
            .map((a) => a.metadata.readTime);
        const referrers = analytics
            .filter((a) => a.metadata?.referrer)
            .map((a) => a.metadata.referrer);
        const devices = analytics
            .filter((a) => a.metadata?.deviceType)
            .map((a) => a.metadata.deviceType);
        const locations = analytics
            .filter((a) => a.metadata?.location?.country)
            .map((a) => a.metadata.location.country);
        return {
            totalViews: views.length,
            uniqueUsers,
            averageReadTime: readTimes.length > 0
                ? readTimes.reduce((sum, time) => sum + time, 0) / readTimes.length
                : 0,
            completionRate: views.length > 0 ? (completes.length / views.length) * 100 : 0,
            engagementScore: this.calculateEngagementScore(analytics),
            topReferrers: this.getTopItems(referrers, 5),
            deviceBreakdown: this.getItemCounts(devices),
            locationBreakdown: this.getItemCounts(locations),
        };
    }
    static async getTrendingContent(days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const result = await sequelize_2.sequelize.query(`
      SELECT 
        content_type,
        content_id,
        COUNT(*) as recent_views,
        COUNT(*) / NULLIF(
          (SELECT COUNT(*) FROM content_analytics ca2 
           WHERE ca2.content_id = ca.content_id 
           AND ca2.content_type = ca.content_type
           AND ca2.event = 'view'
           AND ca2.timestamp < :startDate), 0
        ) as growth_factor
      FROM content_analytics ca
      WHERE event = 'view'
        AND timestamp >= :startDate
      GROUP BY content_type, content_id
      HAVING COUNT(*) >= 5
      ORDER BY growth_factor DESC, recent_views DESC
      LIMIT 20
    `, {
            replacements: { startDate },
            type: sequelize_1.QueryTypes.SELECT,
        });
        return result;
    }
    static async getAnalyticsSummary(timeframe = 'week') {
        const startDate = new Date();
        const previousPeriodStart = new Date();
        if (timeframe === 'day') {
            startDate.setDate(startDate.getDate() - 1);
            previousPeriodStart.setDate(previousPeriodStart.getDate() - 2);
        }
        else if (timeframe === 'week') {
            startDate.setDate(startDate.getDate() - 7);
            previousPeriodStart.setDate(previousPeriodStart.getDate() - 14);
        }
        else {
            startDate.setMonth(startDate.getMonth() - 1);
            previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 2);
        }
        const [currentPeriod, previousPeriod, topContent] = await Promise.all([
            this.getPeriodStats(startDate, new Date()),
            this.getPeriodStats(previousPeriodStart, startDate),
            this.getPopularContent('article', 5),
        ]);
        const userGrowth = previousPeriod.uniqueUsers > 0
            ? ((currentPeriod.uniqueUsers - previousPeriod.uniqueUsers) / previousPeriod.uniqueUsers) *
                100
            : 0;
        return {
            totalViews: currentPeriod.totalViews,
            uniqueUsers: currentPeriod.uniqueUsers,
            averageSessionDuration: currentPeriod.averageSessionDuration,
            topContent,
            userGrowth,
        };
    }
    static async getPeriodStats(startDate, endDate) {
        const analytics = await ContentAnalytics.findAll({
            where: {
                event: 'view',
                timestamp: {
                    [sequelize_1.Op.gte]: startDate,
                    [sequelize_1.Op.lt]: endDate,
                },
            },
            attributes: ['userId', 'sessionId', 'metadata'],
            raw: true,
        });
        const uniqueUsers = new Set(analytics.filter(a => a.userId).map((a) => a.userId)).size;
        const sessionDurations = analytics
            .filter((a) => a.metadata?.readTime)
            .map((a) => a.metadata.readTime);
        return {
            totalViews: analytics.length,
            uniqueUsers,
            averageSessionDuration: sessionDurations.length > 0
                ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
                : 0,
        };
    }
    static calculateEngagementScore(analytics) {
        let score = 0;
        const weights = {
            view: 1,
            read: 3,
            like: 5,
            share: 8,
            comment: 10,
            complete: 15,
        };
        analytics.forEach((record) => {
            score += weights[record.event] || 0;
        });
        return Math.min(100, score / analytics.length);
    }
    static getTopItems(items, limit) {
        const counts = this.getItemCounts(items);
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([item]) => item);
    }
    static getItemCounts(items) {
        return items.reduce((counts, item) => {
            counts[item] = (counts[item] || 0) + 1;
            return counts;
        }, {});
    }
}
exports.ContentAnalytics = ContentAnalytics;
// Initialize the model
ContentAnalytics.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    contentType: {
        type: sequelize_1.DataTypes.ENUM('article', 'course'),
        allowNull: false,
    },
    contentId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    sessionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    event: {
        type: sequelize_1.DataTypes.ENUM('view', 'read', 'share', 'like', 'comment', 'download', 'complete'),
        allowNull: false,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
    ipAddress: {
        type: sequelize_1.DataTypes.INET,
        allowNull: true,
    },
    timestamp: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'ContentAnalytics',
    tableName: 'content_analytics',
    timestamps: true,
    updatedAt: false, // Only need createdAt for analytics
    indexes: [
        {
            fields: ['contentType', 'contentId'],
        },
        {
            fields: ['userId'],
        },
        {
            fields: ['sessionId'],
        },
        {
            fields: ['event'],
        },
        {
            fields: ['timestamp'],
        },
        {
            fields: ['contentType', 'contentId', 'event'],
        },
        {
            using: 'gin',
            fields: ['metadata'],
        },
    ],
});
exports.default = ContentAnalytics;
//# sourceMappingURL=ContentAnalytics.js.map