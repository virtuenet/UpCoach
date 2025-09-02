import { Model, Optional } from 'sequelize';
export interface ContentAnalyticsAttributes {
    id: string;
    contentType: 'article' | 'course';
    contentId: string;
    userId: string | null;
    sessionId: string;
    event: 'view' | 'read' | 'share' | 'like' | 'comment' | 'download' | 'complete';
    metadata: {
        readTime?: number;
        scrollDepth?: number;
        referrer?: string;
        userAgent?: string;
        deviceType?: string;
        location?: {
            country?: string;
            city?: string;
            coordinates?: [number, number];
        };
        progress?: number;
    };
    ipAddress: string | null;
    timestamp: Date;
    createdAt: Date;
}
export interface ContentAnalyticsCreationAttributes extends Optional<ContentAnalyticsAttributes, 'id' | 'userId' | 'metadata' | 'ipAddress' | 'createdAt'> {
}
export declare class ContentAnalytics extends Model<ContentAnalyticsAttributes, ContentAnalyticsCreationAttributes> implements ContentAnalyticsAttributes {
    id: string;
    contentType: 'article' | 'course';
    contentId: string;
    userId: string | null;
    sessionId: string;
    event: 'view' | 'read' | 'share' | 'like' | 'comment' | 'download' | 'complete';
    metadata: ContentAnalyticsAttributes['metadata'];
    ipAddress: string | null;
    timestamp: Date;
    readonly createdAt: Date;
    static getContentViews(contentType: string, contentId: string, timeframe?: 'day' | 'week' | 'month'): Promise<number>;
    static getPopularContent(contentType: string, limit?: number): Promise<any[]>;
    static getUserEngagement(userId: string): Promise<{
        totalViews: number;
        totalReadTime: number;
        articlesRead: number;
        coursesStarted: number;
        coursesCompleted: number;
    }>;
    static getContentPerformance(contentType: string, contentId: string): Promise<{
        totalViews: number;
        uniqueUsers: number;
        averageReadTime: number;
        completionRate: number;
        engagementScore: number;
        topReferrers: string[];
        deviceBreakdown: {
            [key: string]: number;
        };
        locationBreakdown: {
            [key: string]: number;
        };
    }>;
    static getTrendingContent(days?: number): Promise<any[]>;
    static getAnalyticsSummary(timeframe?: 'day' | 'week' | 'month'): Promise<{
        totalViews: number;
        uniqueUsers: number;
        averageSessionDuration: number;
        topContent: any[];
        userGrowth: number;
    }>;
    private static getPeriodStats;
    private static calculateEngagementScore;
    private static getTopItems;
    private static getItemCounts;
}
export default ContentAnalytics;
//# sourceMappingURL=ContentAnalytics.d.ts.map