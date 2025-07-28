import { Op } from 'sequelize';
import { ContentArticle } from '../../models/cms/ContentArticle';
import { ContentCategory } from '../../models/cms/ContentCategory';
import ContentSchedule from '../../models/cms/ContentSchedule';
import ContentVersion from '../../models/cms/ContentVersion';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import emailService from '../email/EmailService';
import { cacheService } from '../cache/CacheService';
import cron from 'node-cron';

interface PublishingOptions {
  notifyAuthor?: boolean;
  notifySubscribers?: boolean;
  socialShare?: boolean;
  validateSEO?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  seoScore: number;
}

export class PublishingService {
  private publishingQueue: Map<number, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeScheduler();
  }

  // Initialize cron job for scheduled publishing
  private initializeScheduler() {
    // Run every minute to check for scheduled content
    cron.schedule('* * * * *', async () => {
      await this.processScheduledContent();
    });

    logger.info('Publishing scheduler initialized');
  }

  // Process scheduled content
  async processScheduledContent() {
    try {
      const now = new Date();
      const schedules = await ContentSchedule.findAll({
        where: {
          scheduledFor: { [Op.lte]: now },
          status: 'pending',
        },
        include: [{ model: ContentArticle, as: 'article' }],
      });

      for (const schedule of schedules) {
        try {
          await this.executeScheduledAction(schedule);
          
          // Mark as processed
          schedule.status = 'completed';
          schedule.processedAt = new Date();
          await schedule.save();
        } catch (error) {
          logger.error('Failed to process scheduled content', {
            scheduleId: schedule.id,
            error: error.message,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process scheduled content', error);
    }
  }

  // Execute scheduled action
  private async executeScheduledAction(schedule: ContentSchedule) {
    const article = await ContentArticle.findByPk(schedule.contentId);
    if (!article) {
      throw new Error(`Article not found for scheduled content ${schedule.id}`);
    }
    
    const action = schedule.scheduleType;
    const actionData = schedule.metadata || {};

    switch (action) {
      case 'publish':
        await this.publishArticle(article.id, {
          notifyAuthor: true,
          notifySubscribers: true,
          ...actionData,
        });
        break;

      case 'unpublish':
        await this.unpublishArticle(article.id);
        break;

      case 'update':
        await article.update(actionData);
        await this.invalidateArticleCache(article.id);
        break;

      default:
        logger.warn(`Unknown scheduled action: ${action}`);
    }
  }

  // Publish an article
  async publishArticle(
    articleId: number,
    options: PublishingOptions = {}
  ): Promise<ContentArticle> {
    const article = await ContentArticle.findByPk(articleId, {
      include: [
        { model: User, as: 'author' },
        { model: ContentCategory, as: 'category' },
      ],
    });

    if (!article) {
      throw new Error('Article not found');
    }

    // Validate before publishing
    if (options.validateSEO) {
      const validation = await this.validateArticle(article);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Update article status
    article.status = 'published';
    article.publishDate = article.publishDate || new Date();
    article.publishDate = new Date();
    await article.save();

    // Create version snapshot
    await article.createVersion(article.authorId, 'Published');

    // Clear cache
    await this.invalidateArticleCache(articleId);

    // Send notifications
    if (options.notifyAuthor) {
      await this.notifyAuthor(article);
    }

    if (options.notifySubscribers) {
      await this.notifySubscribers(article);
    }

    if (options.socialShare) {
      await this.scheduleSocialSharing(article);
    }

    logger.info('Article published', {
      articleId: article.id,
      title: article.title,
    });

    return article;
  }

  // Unpublish an article
  async unpublishArticle(articleId: number): Promise<ContentArticle> {
    const article = await ContentArticle.findByPk(articleId);

    if (!article) {
      throw new Error('Article not found');
    }

    article.status = 'draft';
    await article.save();

    // Create version snapshot
    await article.createVersion(article.authorId, 'Unpublished');

    // Clear cache
    await this.invalidateArticleCache(articleId);

    logger.info('Article unpublished', {
      articleId: article.id,
      title: article.title,
    });

    return article;
  }

  // Schedule article publishing
  async schedulePublishing(
    articleId: number,
    publishDate: Date,
    userId: number,
    options: PublishingOptions = {}
  ): Promise<ContentSchedule> {
    // Cancel any existing schedule
    await this.cancelSchedule(articleId);

    // Create new schedule
    const schedule = await ContentSchedule.create({
      contentId: articleId,
      scheduledFor: publishDate,
      scheduleType: 'publish',
      metadata: options,
      createdBy: userId,
    });

    // Set up immediate scheduling if within 24 hours
    const timeUntilPublish = publishDate.getTime() - Date.now();
    if (timeUntilPublish > 0 && timeUntilPublish < 24 * 60 * 60 * 1000) {
      const timeout = setTimeout(async () => {
        await this.publishArticle(articleId, options);
        this.publishingQueue.delete(articleId);
      }, timeUntilPublish);

      this.publishingQueue.set(articleId, timeout);
    }

    return schedule;
  }

  // Cancel scheduled publishing
  async cancelSchedule(articleId: number): Promise<void> {
    // Cancel in-memory timeout
    const timeout = this.publishingQueue.get(articleId);
    if (timeout) {
      clearTimeout(timeout);
      this.publishingQueue.delete(articleId);
    }

    // Mark database schedules as cancelled
    await ContentSchedule.update(
      { status: 'cancelled', processedAt: new Date() },
      {
        where: {
          contentId: articleId,
          status: 'pending',
        },
      }
    );
  }

  // Validate article before publishing
  async validateArticle(article: ContentArticle): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let seoScore = 100;

    // Required fields
    if (!article.title || article.title.length < 10) {
      errors.push('Title must be at least 10 characters long');
      seoScore -= 20;
    }

    const contentBody = typeof article.content === 'string' 
      ? article.content 
      : article.content?.body;
    
    if (!contentBody || contentBody.length < 100) {
      errors.push('Content must be at least 100 characters long');
      seoScore -= 30;
    }

    if (!article.summary || article.summary.length < 50) {
      warnings.push('Summary should be at least 50 characters long');
      seoScore -= 10;
    }

    // SEO checks
    if (!article.seoTitle) {
      warnings.push('SEO title is missing');
      seoScore -= 10;
    } else if (article.seoTitle.length > 60) {
      warnings.push('SEO title is too long (>60 characters)');
      seoScore -= 5;
    }

    if (!article.seoDescription) {
      warnings.push('SEO description is missing');
      seoScore -= 10;
    } else if (article.seoDescription.length > 160) {
      warnings.push('SEO description is too long (>160 characters)');
      seoScore -= 5;
    }

    if (!article.featuredImage) {
      warnings.push('Featured image is recommended');
      seoScore -= 5;
    }

    if (!article.categoryId) {
      warnings.push('Category should be selected');
      seoScore -= 5;
    }

    if (article.tags.length === 0) {
      warnings.push('Tags help with discoverability');
      seoScore -= 5;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      seoScore: Math.max(0, seoScore),
    };
  }

  // Review workflow
  async submitForReview(
    articleId: number,
    reviewerId?: number
  ): Promise<ContentArticle> {
    const article = await ContentArticle.findByPk(articleId, {
      include: [{ model: User, as: 'author' }],
    });

    if (!article) {
      throw new Error('Article not found');
    }

    article.status = 'review';
    await article.save();

    // Notify reviewer
    if (reviewerId) {
      const reviewer = await User.findByPk(reviewerId);
      if (reviewer) {
        await emailService.sendEmail({
          to: reviewer.email,
          subject: 'New article for review',
          template: 'article-review',
          data: {
            reviewerName: reviewer.name,
            articleTitle: article.title,
            authorName: article.author.name,
            reviewUrl: `${process.env.ADMIN_URL}/cms/content/${article.id}/edit`,
          },
        });
      }
    }

    return article;
  }

  // Approve article
  async approveArticle(
    articleId: number,
    reviewerId: number,
    comments?: string
  ): Promise<ContentArticle> {
    const article = await ContentArticle.findByPk(articleId);

    if (!article) {
      throw new Error('Article not found');
    }

    if (article.status !== 'review') {
      throw new Error('Article is not under review');
    }

    // Create approval version
    await article.createVersion(reviewerId, `Approved${comments ? `: ${comments}` : ''}`);

    // Update status
    article.status = 'published';
    article.publishDate = new Date();
    article.publishDate = new Date();
    await article.save();

    // Notify author
    await this.notifyAuthor(article, 'approved', comments);

    return article;
  }

  // Reject article
  async rejectArticle(
    articleId: number,
    reviewerId: number,
    reason: string
  ): Promise<ContentArticle> {
    const article = await ContentArticle.findByPk(articleId);

    if (!article) {
      throw new Error('Article not found');
    }

    if (article.status !== 'review') {
      throw new Error('Article is not under review');
    }

    // Create rejection version
    await article.createVersion(reviewerId, `Rejected: ${reason}`);

    // Update status
    article.status = 'draft';
    await article.save();

    // Notify author
    await this.notifyAuthor(article, 'rejected', reason);

    return article;
  }

  // Notification helpers
  private async notifyAuthor(
    article: ContentArticle,
    action: string = 'published',
    message?: string
  ) {
    const author = await User.findByPk(article.authorId);
    if (!author) return;

    const templates = {
      published: 'article-published',
      approved: 'article-approved',
      rejected: 'article-rejected',
    };

    await emailService.sendEmail({
      to: author.email,
      subject: `Your article has been ${action}`,
      template: templates[action] || 'article-update',
      data: {
        authorName: author.name,
        articleTitle: article.title,
        articleUrl: `${process.env.FRONTEND_URL}/articles/${article.slug}`,
        message,
      },
    });
  }

  private async notifySubscribers(article: ContentArticle) {
    // Get subscribers interested in this category
    // For now, get all verified users - in production, implement proper subscription preferences
    const { User } = require('../../models/User');
    const subscribers = await User.findAll({
      where: { emailVerified: true },
      limit: 100, // Limit for performance
    });

    for (const subscriber of subscribers) {
      await emailService.sendEmail({
        to: subscriber.email,
        subject: `New article: ${article.title}`,
        template: 'new-article',
        data: {
          subscriberName: subscriber.name,
          articleTitle: article.title,
          articleSummary: article.summary,
          articleUrl: `${process.env.FRONTEND_URL}/articles/${article.slug}`,
          unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`,
        },
      });
    }
  }

  private async scheduleSocialSharing(article: ContentArticle) {
    // Implement social media sharing
    // This would integrate with social media APIs
    logger.info('Social sharing scheduled', { articleId: article.id });
  }

  private async getSubscribers(categoryId?: number): Promise<User[]> {
    // Get users subscribed to content updates
    const where: any = {
      contentSubscription: true,
      status: 'active',
    };

    if (categoryId) {
      // Add category preference filter
      where.preferences = {
        categories: {
          [Op.contains]: [categoryId],
        },
      };
    }

    return User.findAll({ where, limit: 1000 });
  }

  private async invalidateArticleCache(articleId: number) {
    await cacheService.del(`cms:article:${articleId}`);
    await cacheService.invalidate('cms:articles:*');
  }

  // Analytics tracking
  async trackPublishingMetrics(articleId: number) {
    // Track publishing metrics
    const metrics = {
      articleId,
      publishDate: new Date(),
      timeToPublish: 0, // Calculate from creation to publish
      revisions: await ContentVersion.count({ where: { contentId: articleId } }),
    };

    logger.info('Publishing metrics', metrics);
  }
}