import { DataTypes, Model, Optional, Op, QueryTypes } from 'sequelize';
import { sequelize } from '../index';

// ContentAnalytics interface
export interface ContentAnalyticsAttributes {
  id: string;
  contentType: 'article' | 'course';
  contentId: string;
  userId: string | null; // null for anonymous users
  sessionId: string;
  event: 'view' | 'read' | 'share' | 'like' | 'comment' | 'download' | 'complete';
  metadata: {
    readTime?: number; // time spent reading in seconds
    scrollDepth?: number; // percentage of content scrolled
    referrer?: string;
    userAgent?: string;
    deviceType?: string;
    location?: {
      country?: string;
      city?: string;
      coordinates?: [number, number];
    };
    progress?: number; // for courses, percentage completed
  };
  ipAddress: string | null;
  timestamp: Date;
  createdAt: Date;
}

// Optional fields for creation
export interface ContentAnalyticsCreationAttributes extends Optional<ContentAnalyticsAttributes, 
  'id' | 'userId' | 'metadata' | 'ipAddress' | 'createdAt'
> {}

// ContentAnalytics model class
export class ContentAnalytics extends Model<ContentAnalyticsAttributes, ContentAnalyticsCreationAttributes> implements ContentAnalyticsAttributes {
  public id!: string;
  public contentType!: 'article' | 'course';
  public contentId!: string;
  public userId!: string | null;
  public sessionId!: string;
  public event!: 'view' | 'read' | 'share' | 'like' | 'comment' | 'download' | 'complete';
  public metadata!: ContentAnalyticsAttributes['metadata'];
  public ipAddress!: string | null;
  public timestamp!: Date;
  declare readonly createdAt: Date;

  // Static methods for analytics
  static async getContentViews(contentType: string, contentId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<number> {
    const startDate = new Date();
    if (timeframe === 'day') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (timeframe === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    return ContentAnalytics.count({
      where: {
        contentType,
        contentId,
        event: 'view',
        timestamp: { [Op.gte]: startDate }
      }
    });
  }

  static async getPopularContent(contentType: string, limit: number = 10): Promise<any[]> {
    const result = await sequelize.query(`
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
      type: QueryTypes.SELECT,
    });

    return result as any[];
  }

  static async getUserEngagement(userId: string): Promise<{
    totalViews: number;
    totalReadTime: number;
    articlesRead: number;
    coursesStarted: number;
    coursesCompleted: number;
  }> {
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

    analytics.forEach((record: any) => {
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

  static async getContentPerformance(contentType: string, contentId: string): Promise<{
    totalViews: number;
    uniqueUsers: number;
    averageReadTime: number;
    completionRate: number;
    engagementScore: number;
    topReferrers: string[];
    deviceBreakdown: { [key: string]: number };
    locationBreakdown: { [key: string]: number };
  }> {
    const analytics = await ContentAnalytics.findAll({
      where: { contentType, contentId },
      attributes: ['event', 'userId', 'metadata'],
      raw: true,
    });

    const uniqueUsers = new Set(analytics.filter(a => a.userId).map((a: any) => a.userId)).size;
    const views = analytics.filter((a: any) => a.event === 'view');
    const completes = analytics.filter((a: any) => a.event === 'complete');
    
    const readTimes = analytics
      .filter((a: any) => a.metadata?.readTime)
      .map((a: any) => a.metadata.readTime);
    
    const referrers = analytics
      .filter((a: any) => a.metadata?.referrer)
      .map((a: any) => a.metadata.referrer);
    
    const devices = analytics
      .filter((a: any) => a.metadata?.deviceType)
      .map((a: any) => a.metadata.deviceType);
    
    const locations = analytics
      .filter((a: any) => a.metadata?.location?.country)
      .map((a: any) => a.metadata.location.country);

    return {
      totalViews: views.length,
      uniqueUsers,
      averageReadTime: readTimes.length > 0 ? readTimes.reduce((sum, time) => sum + time, 0) / readTimes.length : 0,
      completionRate: views.length > 0 ? (completes.length / views.length) * 100 : 0,
      engagementScore: this.calculateEngagementScore(analytics),
      topReferrers: this.getTopItems(referrers, 5),
      deviceBreakdown: this.getItemCounts(devices),
      locationBreakdown: this.getItemCounts(locations),
    };
  }

  static async getTrendingContent(days: number = 7): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await sequelize.query(`
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
      type: QueryTypes.SELECT,
    });

    return result as any[];
  }

  static async getAnalyticsSummary(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalViews: number;
    uniqueUsers: number;
    averageSessionDuration: number;
    topContent: any[];
    userGrowth: number;
  }> {
    const startDate = new Date();
    const previousPeriodStart = new Date();
    
    if (timeframe === 'day') {
      startDate.setDate(startDate.getDate() - 1);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 2);
    } else if (timeframe === 'week') {
      startDate.setDate(startDate.getDate() - 7);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 14);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 2);
    }

    const [currentPeriod, previousPeriod, topContent] = await Promise.all([
      this.getPeriodStats(startDate, new Date()),
      this.getPeriodStats(previousPeriodStart, startDate),
      this.getPopularContent('article', 5),
    ]);

    const userGrowth = previousPeriod.uniqueUsers > 0 
      ? ((currentPeriod.uniqueUsers - previousPeriod.uniqueUsers) / previousPeriod.uniqueUsers) * 100 
      : 0;

    return {
      totalViews: currentPeriod.totalViews,
      uniqueUsers: currentPeriod.uniqueUsers,
      averageSessionDuration: currentPeriod.averageSessionDuration,
      topContent,
      userGrowth,
    };
  }

  private static async getPeriodStats(startDate: Date, endDate: Date): Promise<{
    totalViews: number;
    uniqueUsers: number;
    averageSessionDuration: number;
  }> {
    const analytics = await ContentAnalytics.findAll({
      where: {
        event: 'view',
        timestamp: {
          [Op.gte]: startDate,
          [Op.lt]: endDate,
        }
      },
      attributes: ['userId', 'sessionId', 'metadata'],
      raw: true,
    });

    const uniqueUsers = new Set(analytics.filter(a => a.userId).map((a: any) => a.userId)).size;
    const sessionDurations = analytics
      .filter((a: any) => a.metadata?.readTime)
      .map((a: any) => a.metadata.readTime);

    return {
      totalViews: analytics.length,
      uniqueUsers,
      averageSessionDuration: sessionDurations.length > 0 
        ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length 
        : 0,
    };
  }

  private static calculateEngagementScore(analytics: any[]): number {
    let score = 0;
    const weights = {
      view: 1,
      read: 3,
      like: 5,
      share: 8,
      comment: 10,
      complete: 15,
    };

    analytics.forEach((record: any) => {
      score += weights[record.event as keyof typeof weights] || 0;
    });

    return Math.min(100, score / analytics.length);
  }

  private static getTopItems(items: string[], limit: number): string[] {
    const counts = this.getItemCounts(items);
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([item]) => item);
  }

  private static getItemCounts(items: string[]): { [key: string]: number } {
    return items.reduce((counts, item) => {
      counts[item] = (counts[item] || 0) + 1;
      return counts;
    }, {} as { [key: string]: number });
  }
}

// Initialize the model
ContentAnalytics.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    contentType: {
      type: DataTypes.ENUM('article', 'course'),
      allowNull: false,
    },
    contentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    event: {
      type: DataTypes.ENUM('view', 'read', 'share', 'like', 'comment', 'download', 'complete'),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
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
  }
);

export default ContentAnalytics; 