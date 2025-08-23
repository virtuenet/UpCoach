import { Request, Response } from 'express';
import { Article, Category, ContentAnalytics } from '../../models';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';

/**
 * ArticleController
 * Handles CRUD operations for articles and content management
 */
export class ArticleController {
  /**
   * Get all articles with filtering and pagination
   */
  static async getArticles(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        category,
        author,
        search,
        sortBy = 'updatedAt',
        sortOrder = 'DESC',
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // Apply filters
      if (status) {
        whereClause.status = status;
      }

      if (category) {
        whereClause.categoryId = category;
      }

      if (author) {
        whereClause.authorId = author;
      }

      if (search) {
        whereClause[Op.or as any] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
          { excerpt: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const articles = await Article.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug'],
          },
        ],
        order: [[sortBy as string, sortOrder as string]],
        limit: Number(limit),
        offset,
      });

      (res as any).json({
        success: true,
        data: articles.rows,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(articles.count / Number(limit)),
          totalItems: articles.count,
          itemsPerPage: Number(limit),
        },
      });
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch articles',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Get a single article by ID or slug
   */
  static async getArticle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { trackView = 'true' } = req.query;

      // Try to find by ID first, then by slug
      let article = await Article.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug', 'path'],
          },
        ],
      });

      if (!article) {
        article = await Article.findOne({
          where: { slug: id },
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name', 'slug', 'path'],
            },
          ],
        });
      }

      if (!article) {
        res.status(404).json({
          success: false,
          message: 'Article not found',
        });
        return;
      }

      // Track view if requested
      if (trackView === 'true') {
        await article.incrementViewCount();
        
        // Create analytics record
        await ContentAnalytics.create({
          contentType: 'article',
          contentId: article.id,
          userId: (req as any).user?.id || null,
          sessionId: req.headers['x-session-id'] as string || 'anonymous',
          event: 'view',
          metadata: {
            referrer: req.get('Referrer'),
            userAgent: req.get('User-Agent'),
            deviceType: this.getDeviceType(req.get('User-Agent')),
          },
          ipAddress: req.ip,
          timestamp: new Date(),
        });
      }

      (res as any).json({
        success: true,
        data: article,
      });
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch article',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Create a new article
   */
  static async createArticle(req: Request, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const {
        title,
        excerpt,
        content,
        categoryId,
        status = 'draft',
        featuredImage,
        seoTitle,
        seoDescription,
        seoKeywords,
        // tags,
        settings,
        publishingSchedule,
      } = req.body;

      const article = await Article.create({
        title,
        excerpt,
        content,
        categoryId,
        authorId: (req as any).user!.id,
        status,
        featuredImage,
        seoTitle,
        seoDescription,
        seoKeywords,
        metadata: {
          wordCount: content.split(/\s+/).length,
          version: 1,
          sources: [],
        },
        settings: {
          allowComments: true,
          enableNotifications: true,
          isFeatured: false,
          isTemplate: false,
          ...settings,
        },
        publishingSchedule: {
          scheduledPublishAt: null,
          timezone: 'UTC',
          autoPublish: false,
          ...publishingSchedule,
        },
        analytics: {
          avgReadTime: 0,
          bounceRate: 0,
          completionRate: 0,
          engagementScore: 0,
        },
      });

      // Load the created article with associations
      const createdArticle = await Article.findByPk(article.id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug'],
          },
        ],
      });

      res.status(201).json({
        success: true,
        data: createdArticle,
        message: 'Article created successfully',
      });
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create article',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Update an existing article
   */
  static async updateArticle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const article = await Article.findByPk(id);
      if (!article) {
        res.status(404).json({
          success: false,
          message: 'Article not found',
        });
        return;
      }

      // Check if user can edit this article
      if (article.authorId !== (req as any).user!.id && (req as any).user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Not authorized to edit this article',
        });
        return;
      }

      const {
        title,
        excerpt,
        content,
        categoryId,
        status,
        featuredImage,
        seoTitle,
        seoDescription,
        seoKeywords,
        settings,
        publishingSchedule,
      } = req.body;

      // Update metadata
      if (content && content !== article.content) {
        article.metadata = {
          ...article.metadata,
          wordCount: content.split(/\s+/).length,
          version: article.metadata.version + 1,
          lastEditedBy: (req as any).user!.id,
        };
      }

      await article.update({
        title,
        excerpt,
        content,
        categoryId,
        status,
        featuredImage,
        seoTitle,
        seoDescription,
        seoKeywords,
        settings: { ...article.settings, ...settings },
        publishingSchedule: { ...article.publishingSchedule, ...publishingSchedule },
      });

      // Load updated article with associations
      const updatedArticle = await Article.findByPk(article.id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug'],
          },
        ],
      });

      (res as any).json({
        success: true,
        data: updatedArticle,
        message: 'Article updated successfully',
      });
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update article',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Delete an article
   */
  static async deleteArticle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const article = await Article.findByPk(id);
      if (!article) {
        res.status(404).json({
          success: false,
          message: 'Article not found',
        });
        return;
      }

      // Check if user can delete this article
      if (article.authorId !== (req as any).user!.id && (req as any).user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Not authorized to delete this article',
        });
        return;
      }

      await article.destroy();

      (res as any).json({
        success: true,
        message: 'Article deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting article:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete article',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Publish an article
   */
  static async publishArticle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const article = await Article.findByPk(id);
      if (!article) {
        res.status(404).json({
          success: false,
          message: 'Article not found',
        });
        return;
      }

      // Check if user can publish this article
      if (article.authorId !== (req as any).user!.id && (req as any).user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Not authorized to publish this article',
        });
        return;
      }

      await article.publish();

      (res as any).json({
        success: true,
        data: article,
        message: 'Article published successfully',
      });
    } catch (error) {
      console.error('Error publishing article:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to publish article',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Archive an article
   */
  static async archiveArticle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const article = await Article.findByPk(id);
      if (!article) {
        res.status(404).json({
          success: false,
          message: 'Article not found',
        });
        return;
      }

      // Check if user can archive this article
      if (article.authorId !== (req as any).user!.id && (req as any).user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Not authorized to archive this article',
        });
        return;
      }

      await article.archive();

      (res as any).json({
        success: true,
        data: article,
        message: 'Article archived successfully',
      });
    } catch (error) {
      console.error('Error archiving article:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to archive article',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Get popular articles
   */
  static async getPopularArticles(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;
      // const { timeframe = 'month' } = req.query; // unused

      const articles = await Article.getPopular(Number(limit));

      (res as any).json({
        success: true,
        data: articles,
      });
    } catch (error) {
      console.error('Error fetching popular articles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch popular articles',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Search articles
   */
  static async searchArticles(req: Request, res: Response): Promise<void> {
    try {
      const { q: query, category, status, author, tags } = req.query;

      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
        return;
      }

      const filters: any = {};
      if (category) filters.category = category as string;
      if (status) filters.status = status as string;
      if (author) filters.author = author as string;
      if (tags) filters.tags = (tags as string).split(',');

      const articles = await Article.searchArticles(query as string, filters);

      (res as any).json({
        success: true,
        data: articles,
      });
    } catch (error) {
      console.error('Error searching articles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search articles',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Get article analytics
   */
  static async getArticleAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const article = await Article.findByPk(id);
      if (!article) {
        res.status(404).json({
          success: false,
          message: 'Article not found',
        });
        return;
      }

      const analytics = await ContentAnalytics.getContentPerformance('article', id);

      (res as any).json({
        success: true,
        data: {
          article: {
            id: article.id,
            title: article.title,
            status: article.status,
            publishedAt: article.publishedAt,
          },
          analytics,
        },
      });
    } catch (error) {
      console.error('Error fetching article analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch article analytics',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Helper method to determine device type from user agent
   */
  private static getDeviceType(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'mobile';
    } else if (/Tablet/.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }
}

export default ArticleController; 