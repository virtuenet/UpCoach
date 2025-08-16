import { Request, Response } from 'express';
import { ContentArticle } from '../../models/cms/ContentArticle';
import { ContentCategory } from '../../models/cms/ContentCategory';
import { ContentMedia } from '../../models/cms/ContentMedia';
// import ContentVersion from '../../models/cms/ContentVersion';
// import { User } from '../../models/User';
import { PublishingService } from '../../services/cms/PublishingService';
import { logger } from '../../utils/logger';
import { Op } from 'sequelize';

const publishingService = new PublishingService();

export class CoachContentController {
  // Get coach's content dashboard
  async getDashboard(req: Request, res: Response) {
    try {
      const coachId = req.user!.id;

      // Get coach's content stats
      const [totalArticles, publishedArticles, draftArticles, totalViews] = await Promise.all([
        ContentArticle.count({ where: { authorId: coachId } }),
        ContentArticle.count({ where: { authorId: coachId, status: 'published' } }),
        ContentArticle.count({ where: { authorId: coachId, status: 'draft' } }),
        ContentArticle.sum('viewCount', { where: { authorId: coachId } }) || 0,
      ]);

      // Get recent articles
      const recentArticles = await ContentArticle.findAll({
        where: { authorId: coachId },
        include: [
          { model: ContentCategory, as: 'category' },
        ],
        order: [['updatedAt', 'DESC']],
        limit: 5,
      });

      // Get popular articles
      const popularArticles = await ContentArticle.findAll({
        where: { 
          authorId: coachId,
          status: 'published',
        },
        order: [['viewCount', 'DESC']],
        limit: 5,
      });

      res.json({
        success: true,
        data: {
          stats: {
            totalArticles,
            publishedArticles,
            draftArticles,
            totalViews,
          },
          recentArticles,
          popularArticles,
        },
      });
    } catch (error) {
      logger.error('Failed to get coach dashboard', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load dashboard',
      });
    }
  }

  // Get coach's articles
  async getArticles(req: Request, res: Response) {
    try {
      const coachId = req.user!.id;
      const { status, search, page = 1, limit = 10 } = req.query;

      const where: any = { authorId: coachId };

      if (status) {
        where.status = status;
      }

      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { summary: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await ContentArticle.findAndCountAll({
        where,
        include: [
          { model: ContentCategory, as: 'category' },
        ],
        order: [['updatedAt', 'DESC']],
        limit: Number(limit),
        offset,
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          pages: Math.ceil(count / Number(limit)),
          currentPage: Number(page),
          perPage: Number(limit),
        },
      });
    } catch (error) {
      logger.error('Failed to get coach articles', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load articles',
      });
    }
  }

  // Create new article
  async createArticle(req: Request, res: Response) {
    try {
      const coachId = req.user!.id;
      const articleData = {
        ...req.body,
        authorId: coachId,
        status: 'draft',
      };

      const article = await ContentArticle.create(articleData);

      // Create initial version
      await article.createVersion(Number(coachId), 'Initial draft');

      res.status(201).json({
        success: true,
        data: article,
      });
    } catch (error) {
      logger.error('Failed to create article', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create article',
      });
    }
  }

  // Update article
  async updateArticle(req: Request, res: Response) {
    try {
      const coachId = req.user!.id;
      const { id } = req.params;

      const article = await ContentArticle.findOne({
        where: { id, authorId: coachId },
      });

      if (!article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
        });
      }

      // Coaches can only update their own articles in draft or review status
      if (article.status === 'published' && !req.body.forceUpdate) {
        return res.status(403).json({
          success: false,
          error: 'Cannot edit published articles. Create a new version instead.',
        });
      }

      await article.update(req.body);

      // Create version snapshot
      await article.createVersion(Number(coachId), 'Updated by coach');

      res.json({
        success: true,
        data: article,
      });
    } catch (error) {
      logger.error('Failed to update article', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update article',
      });
    }
  }

  // Submit article for review
  async submitForReview(req: Request, res: Response) {
    try {
      const coachId = req.user!.id;
      const { id } = req.params;
      const { reviewerNotes } = req.body;

      const article = await ContentArticle.findOne({
        where: { id, authorId: coachId },
      });

      if (!article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
        });
      }

      if (article.status !== 'draft') {
        return res.status(400).json({
          success: false,
          error: 'Only draft articles can be submitted for review',
        });
      }

      // Validate article before submission
      const validation = await publishingService.validateArticle(article);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Article validation failed',
          details: validation.errors,
        });
      }

      // Submit for review
      await publishingService.submitForReview(article.id);

      // Add review notes if provided
      if (reviewerNotes) {
        await article.createVersion(Number(coachId), `Submitted for review: ${reviewerNotes}`);
      }

      res.json({
        success: true,
        data: article,
        message: 'Article submitted for review successfully',
      });
    } catch (error) {
      logger.error('Failed to submit article for review', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit article for review',
      });
    }
  }

  // Schedule article publishing
  async scheduleArticle(req: Request, res: Response) {
    try {
      const coachId = req.user!.id;
      const { id } = req.params;
      const { publishDate, options } = req.body;

      const article = await ContentArticle.findOne({
        where: { id, authorId: coachId },
      });

      if (!article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
        });
      }

      // Coaches can only schedule their approved articles
      if (article.status !== 'review' && article.status !== 'published') {
        return res.status(400).json({
          success: false,
          error: 'Article must be approved before scheduling',
        });
      }

      const schedule = await publishingService.schedulePublishing(
        article.id,
        new Date(publishDate),
        { ...options, createdBy: coachId }
      );

      res.json({
        success: true,
        data: schedule,
        message: 'Article scheduled successfully',
      });
    } catch (error) {
      logger.error('Failed to schedule article', error);
      res.status(500).json({
        success: false,
        error: 'Failed to schedule article',
      });
    }
  }

  // Get article analytics
  async getArticleAnalytics(req: Request, res: Response) {
    try {
      const coachId = req.user!.id;
      const { id } = req.params;
      const {} = req.query;

      const article = await ContentArticle.findOne({
        where: { id, authorId: coachId },
      });

      if (!article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
        });
      }

      // Get view analytics (would connect to analytics service)
      const analytics = {
        totalViews: article.viewCount,
        uniqueViews: Math.floor(article.viewCount * 0.7), // Placeholder
        avgTimeOnPage: '3:45', // Placeholder
        bounceRate: '35%', // Placeholder
        shares: {
          total: Math.floor(article.viewCount * 0.1),
          facebook: Math.floor(article.viewCount * 0.04),
          twitter: Math.floor(article.viewCount * 0.03),
          linkedin: Math.floor(article.viewCount * 0.02),
          email: Math.floor(article.viewCount * 0.01),
        },
        engagement: {
          likes: Math.floor(article.viewCount * 0.15),
          comments: Math.floor(article.viewCount * 0.05),
          bookmarks: Math.floor(article.viewCount * 0.08),
        },
        demographics: {
          topCountries: [
            { country: 'United States', percentage: 45 },
            { country: 'United Kingdom', percentage: 15 },
            { country: 'Canada', percentage: 10 },
            { country: 'Australia', percentage: 8 },
            { country: 'Others', percentage: 22 },
          ],
          devices: {
            desktop: 55,
            mobile: 35,
            tablet: 10,
          },
        },
      };

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Failed to get article analytics', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load analytics',
      });
    }
  }

  // Upload media for articles
  async uploadMedia(req: Request, res: Response) {
    try {
      const coachId = req.user!.id;
      const { file } = req;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided',
        });
      }

      // Create media record
      const media = await ContentMedia.create({
        filename: file.filename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/content/${file.filename}`,
        uploadedBy: coachId,
        type: file.mimetype.startsWith('image/') ? 'image' : 
              file.mimetype.startsWith('video/') ? 'video' : 
              file.mimetype.startsWith('audio/') ? 'audio' : 'document',
        isPublic: false,
      });

      res.json({
        success: true,
        data: media,
      });
    } catch (error) {
      logger.error('Failed to upload media', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload media',
      });
    }
  }

  // Get coach's media library
  async getMediaLibrary(req: Request, res: Response) {
    try {
      const coachId = req.user!.id;
      const { type, page = 1, limit = 20 } = req.query;

      const where: any = { uploadedBy: coachId };

      if (type) {
        where.mimeType = { [Op.like]: `${type}%` };
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows } = await ContentMedia.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset,
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          pages: Math.ceil(count / Number(limit)),
          currentPage: Number(page),
          perPage: Number(limit),
        },
      });
    } catch (error) {
      logger.error('Failed to get media library', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load media library',
      });
    }
  }

  // Get available categories for coaches
  async getCategories(_req: Request, res: Response) {
    try {
      const categories = await ContentCategory.findAll({
        where: { isActive: true },
        order: [['name', 'ASC']],
      });

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      logger.error('Failed to get categories', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load categories',
      });
    }
  }

  // Get coach's content performance overview
  async getPerformanceOverview(req: Request, res: Response) {
    try {
      const coachId = req.user!.id;
      const { period = '30d' } = req.query;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Get performance metrics
      const articles = await ContentArticle.findAll({
        where: {
          authorId: coachId,
          status: 'published',
          publishDate: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      const totalViews = articles.reduce((sum, article) => sum + article.viewCount, 0);
      const avgViews = articles.length > 0 ? Math.round(totalViews / articles.length) : 0;

      // Calculate growth
      const previousEndDate = new Date(startDate);
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const previousArticles = await ContentArticle.findAll({
        where: {
          authorId: coachId,
          status: 'published',
          publishDate: {
            [Op.between]: [previousStartDate, previousEndDate],
          },
        },
      });

      const previousViews = previousArticles.reduce((sum, article) => sum + article.viewCount, 0);
      const viewsGrowth = previousViews > 0 ? ((totalViews - previousViews) / previousViews) * 100 : 0;

      res.json({
        success: true,
        data: {
          period,
          metrics: {
            totalArticles: articles.length,
            totalViews,
            avgViewsPerArticle: avgViews,
            viewsGrowth: Math.round(viewsGrowth),
          },
          topPerformers: articles
            .sort((a, b) => b.viewCount - a.viewCount)
            .slice(0, 5)
            .map(article => ({
              id: article.id,
              title: article.title,
              views: article.viewCount,
              publishDate: article.publishDate,
            })),
        },
      });
    } catch (error) {
      logger.error('Failed to get performance overview', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load performance data',
      });
    }
  }
}

export default new CoachContentController();