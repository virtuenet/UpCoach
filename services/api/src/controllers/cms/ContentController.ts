import { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import slugify from 'slugify';

import { User } from '../../models';
import { Content } from '../../models/cms/Content';
import { ContentCategory } from '../../models/cms/ContentCategory';
import { ContentMedia } from '../../models/cms/ContentMedia';
import { ContentTag } from '../../models/cms/ContentTag';
import { sequelize } from '../../models';
import { logger } from '../../utils/logger';

export class ContentController {
  // Get all content with filters
  static async getAll(req: Request, _res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        categoryId,
        authorId,
        isPremium,
        search,
        // tags,
        sortBy = 'publishedAt',
        sortOrder = 'DESC',
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const where: unknown = {};

      if (status) where.status = status;
      if (type) where.type = type;
      if (categoryId) where.categoryId = categoryId;
      if (authorId) where.authorId = authorId;
      if (isPremium !== undefined) where.isPremium = isPremium === 'true';

      if (search) {
        where[Op.or as unknown] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
          { excerpt: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { rows: contents, count } = await Content.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'avatar'],
          },
          {
            model: ContentCategory,
            as: 'category',
            attributes: ['id', 'name', 'slug', 'color'],
          },
          {
            model: ContentTag,
            as: 'tags',
            attributes: ['id', 'name', 'slug', 'color'],
            through: { attributes: [] },
          },
          {
            model: ContentMedia,
            as: 'media',
            attributes: ['id', 'type', 'url', 'thumbnailUrl'],
          },
        ],
        order: [[sortBy as string, sortOrder as string]],
        limit: Number(limit),
        offset,
      });

      _res.json({
        contents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching content:', error);
      _res.status(500).json({ error: 'Failed to fetch content' });
    }
  }

  // Get single content by ID or slug
  static async getOne(req: Request, _res: Response) {
    try {
      const { id } = req.params;

      const where = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        ? { id }
        : { slug: id };

      const content = await Content.findOne({
        where,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'avatar', 'bio'],
          },
          {
            model: ContentCategory,
            as: 'category',
          },
          {
            model: ContentTag,
            as: 'tags',
            through: { attributes: [] },
          },
          {
            model: ContentMedia,
            as: 'media',
          },
        ],
      });

      if (!content) {
        return _res.status(404).json({ error: 'Content not found' });
      }

      // Increment view count
      await content.increment('viewCount');

      _res.json(content);
    } catch (error) {
      logger.error('Error fetching content:', error);
      _res.status(500).json({ error: 'Failed to fetch content' });
    }
  }

  // Create new content
  static async create(req: Request, _res: Response) {
    try {
      const {
        title,
        content,
        excerpt,
        type,
        status,
        categoryId,
        featuredImageUrl,
        metaTitle,
        metaDescription,
        metaKeywords,
        publishedAt,
        scheduledAt,
        isPremium,
        settings,
        tags,
      } = req.body;

      // Generate slug
      const baseSlug = slugify(title, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;

      // Ensure unique slug
      while (await Content.findOne({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Calculate reading time (average 200 words per minute)
      const wordCount = content.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);

      const newContent = await Content.create({
        title,
        slug,
        content,
        excerpt,
        type: type || 'article',
        status: status || 'draft',
        categoryId,
        authorId: req.user!.id,
        featuredImageUrl,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt,
        metaKeywords,
        publishedAt: status === 'published' ? publishedAt || new Date() : null,
        scheduledAt,
        readingTime,
        isPremium: isPremium || false,
        settings,
      });

      // Add tags if provided
      if (tags && tags.length > 0) {
        const tagInstances = await ContentTag.findAll({
          where: { id: tags },
        });
        await newContent.setTags(tagInstances);
      }

      // Fetch complete content with associations
      const completeContent = await Content.findByPk(newContent.id, {
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] },
          { model: ContentCategory, as: 'category' },
          { model: ContentTag, as: 'tags', through: { attributes: [] } },
        ],
      });

      _res.status(201).json(completeContent);
    } catch (error) {
      logger.error('Error creating content:', error);
      _res.status(500).json({ error: 'Failed to create content' });
    }
  }

  // Update content
  static async update(req: Request, _res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const content = await Content.findByPk(id);
      if (!content) {
        return _res.status(404).json({ error: 'Content not found' });
      }

      // Check permissions
      if (content.authorId !== req.user!.id && req.user!.role !== 'admin') {
        return _res.status(403).json({ error: 'Unauthorized to update this content' });
      }

      // Update slug if title changed
      if (updates.title && updates.title !== content.title) {
        const baseSlug = slugify(updates.title, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;

        while (await Content.findOne({ where: { slug, id: { [Op.ne as unknown]: id } } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        updates.slug = slug;
      }

      // Update reading time if content changed
      if (updates.content) {
        const wordCount = updates.content.split(/\s+/).length;
        updates.readingTime = Math.ceil(wordCount / 200);
      }

      // Handle publishing
      if (updates.status === 'published' && content.status !== 'published') {
        updates.publishedAt = updates.publishedAt || new Date();
      }

      await content.update(updates);

      // Update tags if provided
      if (updates.tags !== undefined) {
        const tagInstances = await ContentTag.findAll({
          where: { id: updates.tags },
        });
        await content.setTags(tagInstances);
      }

      // Fetch updated content with associations
      const updatedContent = await Content.findByPk(id, {
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] },
          { model: ContentCategory, as: 'category' },
          { model: ContentTag, as: 'tags', through: { attributes: [] } },
          { model: ContentMedia, as: 'media' },
        ],
      });

      _res.json(updatedContent);
    } catch (error) {
      logger.error('Error updating content:', error);
      _res.status(500).json({ error: 'Failed to update content' });
    }
  }

  // Delete content
  static async delete(req: Request, _res: Response) {
    try {
      const { id } = req.params;

      const content = await Content.findByPk(id);
      if (!content) {
        return _res.status(404).json({ error: 'Content not found' });
      }

      // Check permissions
      if (content.authorId !== req.user!.id && req.user!.role !== 'admin') {
        return _res.status(403).json({ error: 'Unauthorized to delete this content' });
      }

      await content.destroy();
      _res.json({ message: 'Content deleted successfully' });
    } catch (error) {
      logger.error('Error deleting content:', error);
      _res.status(500).json({ error: 'Failed to delete content' });
    }
  }

  // Bulk operations
  static async bulkUpdate(req: Request, _res: Response) {
    try {
      const { ids, updates } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return _res.status(400).json({ error: 'No content IDs provided' });
      }

      // Check permissions
      if (req.user!.role !== 'admin') {
        const contents = await Content.findAll({
          where: { id: ids },
        });

        const unauthorized = contents.some(c => c.authorId !== req.user!.id);
        if (unauthorized) {
          return _res.status(403).json({ error: 'Unauthorized to update some content' });
        }
      }

      await Content.update(updates, {
        where: { id: ids },
      });

      _res.json({ message: `Updated ${ids.length} content items` });
    } catch (error) {
      logger.error('Error bulk updating content:', error);
      _res.status(500).json({ error: 'Failed to bulk update content' });
    }
  }

  // Get comprehensive content analytics
  static async getAnalytics(req: Request, _res: Response) {
    try {
      const { id } = req.params;
      const { timeframe = '30d', includeDetailed = 'true' } = req.query;

      const content = await Content.findByPk(id, {
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
          { model: ContentCategory, as: 'category', attributes: ['id', 'name'] },
          { model: ContentTag, as: 'tags', attributes: ['id', 'name'] },
        ],
      });

      if (!content) {
        return _res.status(404).json({ error: 'Content not found' });
      }

      // Calculate timeframe for detailed analytics
      const daysBack = this.parseTimeframe(timeframe as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Basic analytics from content model
      const basicAnalytics = {
        totalViews: content.viewCount || 0,
        totalLikes: content.likeCount || 0,
        totalShares: content.shareCount || 0,
        totalComments: content.commentCount || 0,
        readingTime: content.readingTime || 0,
        publishedAt: content.publishedAt,
        lastUpdated: content.updatedAt,
        status: content.status,
        contentInfo: {
          title: content.title,
          type: content.type,
          wordCount: content.wordCount || 0,
          author: content.author?.name || 'Unknown',
          category: content.category?.name || 'Uncategorized',
          tags: content.tags?.map((tag: unknown) => tag.name) || [],
        },
      };

      let detailedAnalytics = {};

      if (includeDetailed === 'true') {
        // Get detailed analytics from views table
        const viewAnalytics = await this.getViewAnalytics(id, startDate);
        const engagementAnalytics = await this.getEngagementAnalytics(id, startDate);
        const performanceAnalytics = await this.getPerformanceAnalytics(id);
        const demographicsAnalytics = await this.getDemographicsAnalytics(id, startDate);

        detailedAnalytics = {
          viewAnalytics,
          engagementAnalytics,
          performanceAnalytics,
          demographicsAnalytics,
          timeframe: {
            period: timeframe,
            startDate,
            endDate: new Date(),
            daysAnalyzed: daysBack,
          },
        };
      }

      const analytics = {
        contentId: id,
        ...basicAnalytics,
        ...detailedAnalytics,
        generatedAt: new Date(),
      };

      _res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error fetching content analytics:', error);
      _res.status(500).json({
        success: false,
        error: 'Failed to fetch content analytics',
      });
    }
  }

  // Get aggregated analytics for multiple content items
  static async getAggregatedAnalytics(req: Request, _res: Response) {
    try {
      const {
        timeframe = '30d',
        authorId,
        categoryId,
        contentType,
        limit = 50,
      } = req.query;

      const daysBack = ContentController.parseTimeframe(timeframe as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      let whereClause = 'WHERE c.status = \'published\'';
      const replacements: unknown = { startDate };

      if (authorId) {
        whereClause += ' AND c.author_id = :authorId';
        replacements.authorId = authorId;
      }

      if (categoryId) {
        whereClause += ' AND c.category_id = :categoryId';
        replacements.categoryId = categoryId;
      }

      if (contentType) {
        whereClause += ' AND c.type = :contentType';
        replacements.contentType = contentType;
      }

      // Get top performing content
      const [topContent] = await sequelize.query(
        `SELECT
           c.id, c.title, c.type, c.view_count, c.like_count, c.share_count,
           c.published_at, u.name as author_name, cat.name as category_name,
           (c.view_count + (c.like_count * 5) + (c.share_count * 10)) as engagement_score
         FROM content c
         LEFT JOIN users u ON c.author_id = u.id
         LEFT JOIN content_categories cat ON c.category_id = cat.id
         ${whereClause}
         ORDER BY engagement_score DESC
         LIMIT :limit`,
        {
          replacements: { ...replacements, limit: parseInt(limit as string) },
          type: QueryTypes.SELECT,
        }
      );

      // Get overall statistics
      const [overallStats] = await sequelize.query(
        `SELECT
           COUNT(*) as total_content,
           SUM(c.view_count) as total_views,
           SUM(c.like_count) as total_likes,
           SUM(c.share_count) as total_shares,
           AVG(c.view_count) as avg_views,
           AVG(c.reading_time) as avg_reading_time
         FROM content c
         ${whereClause}`,
        {
          replacements,
          type: QueryTypes.SELECT,
        }
      );

      // Get content performance trends
      const [trendsData] = await sequelize.query(
        `SELECT
           DATE(c.published_at) as date,
           COUNT(*) as published_count,
           SUM(c.view_count) as total_views,
           AVG(c.view_count) as avg_views
         FROM content c
         ${whereClause}
         AND c.published_at >= :startDate
         GROUP BY DATE(c.published_at)
         ORDER BY date ASC`,
        {
          replacements,
          type: QueryTypes.SELECT,
        }
      );

      // Get content type distribution
      const [typeDistribution] = await sequelize.query(
        `SELECT
           c.type,
           COUNT(*) as count,
           SUM(c.view_count) as total_views,
           AVG(c.view_count) as avg_views
         FROM content c
         ${whereClause}
         GROUP BY c.type
         ORDER BY total_views DESC`,
        {
          replacements,
          type: QueryTypes.SELECT,
        }
      );

      _res.json({
        success: true,
        data: {
          timeframe: {
            period: timeframe,
            startDate,
            endDate: new Date(),
            daysAnalyzed: daysBack,
          },
          overallStats: overallStats[0],
          topContent,
          trends: trendsData,
          typeDistribution,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error fetching aggregated analytics:', error);
      _res.status(500).json({
        success: false,
        error: 'Failed to fetch aggregated analytics',
      });
    }
  }

  // Helper methods for detailed analytics
  private static async getViewAnalytics(contentId: string, startDate: Date) {
    try {
      const [viewsOverTime] = await sequelize.query(
        `SELECT
           DATE(created_at) as date,
           COUNT(*) as views,
           COUNT(DISTINCT user_id) as unique_viewers
         FROM content_views
         WHERE content_id = :contentId
         AND created_at >= :startDate
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        {
          replacements: { contentId, startDate },
          type: QueryTypes.SELECT,
        }
      );

      const [deviceStats] = await sequelize.query(
        `SELECT
           device_type,
           COUNT(*) as views,
           COUNT(DISTINCT user_id) as unique_viewers
         FROM content_views
         WHERE content_id = :contentId
         AND created_at >= :startDate
         GROUP BY device_type`,
        {
          replacements: { contentId, startDate },
          type: QueryTypes.SELECT,
        }
      );

      const [referrerStats] = await sequelize.query(
        `SELECT
           referrer_source,
           COUNT(*) as views
         FROM content_views
         WHERE content_id = :contentId
         AND created_at >= :startDate
         AND referrer_source IS NOT NULL
         GROUP BY referrer_source
         ORDER BY views DESC
         LIMIT 10`,
        {
          replacements: { contentId, startDate },
          type: QueryTypes.SELECT,
        }
      );

      return {
        viewsOverTime,
        deviceStats,
        referrerStats,
      };
    } catch (error) {
      logger.error('Error fetching view analytics:', error);
      return { viewsOverTime: [], deviceStats: [], referrerStats: [] };
    }
  }

  private static async getEngagementAnalytics(contentId: string, startDate: Date) {
    try {
      const [engagementOverTime] = await sequelize.query(
        `SELECT
           DATE(created_at) as date,
           SUM(CASE WHEN action_type = 'like' THEN 1 ELSE 0 END) as likes,
           SUM(CASE WHEN action_type = 'share' THEN 1 ELSE 0 END) as shares,
           SUM(CASE WHEN action_type = 'comment' THEN 1 ELSE 0 END) as comments,
           SUM(CASE WHEN action_type = 'bookmark' THEN 1 ELSE 0 END) as bookmarks
         FROM content_interactions
         WHERE content_id = :contentId
         AND created_at >= :startDate
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        {
          replacements: { contentId, startDate },
          type: QueryTypes.SELECT,
        }
      );

      const [readingBehavior] = await sequelize.query(
        `SELECT
           AVG(time_spent) as avg_time_spent,
           AVG(scroll_depth) as avg_scroll_depth,
           COUNT(*) as total_readings
         FROM content_reading_sessions
         WHERE content_id = :contentId
         AND created_at >= :startDate`,
        {
          replacements: { contentId, startDate },
          type: QueryTypes.SELECT,
        }
      );

      return {
        engagementOverTime,
        readingBehavior: readingBehavior[0],
      };
    } catch (error) {
      logger.error('Error fetching engagement analytics:', error);
      return { engagementOverTime: [], readingBehavior: {} };
    }
  }

  private static async getPerformanceAnalytics(contentId: string) {
    try {
      // Calculate engagement rate
      const content = await Content.findByPk(contentId);
      if (!content) return {};

      const totalEngagements = (content.likeCount || 0) + (content.shareCount || 0) + (content.commentCount || 0);
      const engagementRate = content.viewCount > 0 ? (totalEngagements / content.viewCount) * 100 : 0;

      // Get performance compared to similar content
      const [similarContent] = await sequelize.query(
        `SELECT
           AVG(view_count) as avg_views,
           AVG(like_count) as avg_likes,
           AVG(share_count) as avg_shares
         FROM content
         WHERE type = (SELECT type FROM content WHERE id = :contentId)
         AND status = 'published'
         AND id != :contentId`,
        {
          replacements: { contentId },
          type: QueryTypes.SELECT,
        }
      );

      const comparison = similarContent[0] as unknown;

      return {
        engagementRate: Math.round(engagementRate * 100) / 100,
        performanceVsAverage: {
          views: comparison?.avg_views ? Math.round(((content.viewCount || 0) / comparison.avg_views - 1) * 100) : 0,
          likes: comparison?.avg_likes ? Math.round(((content.likeCount || 0) / comparison.avg_likes - 1) * 100) : 0,
          shares: comparison?.avg_shares ? Math.round(((content.shareCount || 0) / comparison.avg_shares - 1) * 100) : 0,
        },
        totalEngagements,
      };
    } catch (error) {
      logger.error('Error fetching performance analytics:', error);
      return {};
    }
  }

  private static async getDemographicsAnalytics(contentId: string, startDate: Date) {
    try {
      const [ageGroups] = await sequelize.query(
        `SELECT
           CASE
             WHEN TIMESTAMPDIFF(YEAR, u.birth_date, CURDATE()) < 25 THEN '18-24'
             WHEN TIMESTAMPDIFF(YEAR, u.birth_date, CURDATE()) < 35 THEN '25-34'
             WHEN TIMESTAMPDIFF(YEAR, u.birth_date, CURDATE()) < 45 THEN '35-44'
             WHEN TIMESTAMPDIFF(YEAR, u.birth_date, CURDATE()) < 55 THEN '45-54'
             ELSE '55+'
           END as age_group,
           COUNT(*) as views
         FROM content_views cv
         JOIN users u ON cv.user_id = u.id
         WHERE cv.content_id = :contentId
         AND cv.created_at >= :startDate
         AND u.birth_date IS NOT NULL
         GROUP BY age_group
         ORDER BY views DESC`,
        {
          replacements: { contentId, startDate },
          type: QueryTypes.SELECT,
        }
      );

      const [locationStats] = await sequelize.query(
        `SELECT
           u.country,
           COUNT(*) as views
         FROM content_views cv
         JOIN users u ON cv.user_id = u.id
         WHERE cv.content_id = :contentId
         AND cv.created_at >= :startDate
         AND u.country IS NOT NULL
         GROUP BY u.country
         ORDER BY views DESC
         LIMIT 10`,
        {
          replacements: { contentId, startDate },
          type: QueryTypes.SELECT,
        }
      );

      return {
        ageGroups,
        topCountries: locationStats,
      };
    } catch (error) {
      logger.error('Error fetching demographics analytics:', error);
      return { ageGroups: [], topCountries: [] };
    }
  }

  private static parseTimeframe(timeframe: string): number {
    const timeframeMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    return timeframeMap[timeframe] || 30;
  }
}
