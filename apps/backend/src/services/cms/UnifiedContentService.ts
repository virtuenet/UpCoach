/**
 * Unified Content Service
 * Consolidates all CMS-related services into a single, efficient service
 */

import { Op, Transaction, WhereOptions } from 'sequelize';
import {
  UnifiedContent,
  UnifiedCategory,
  UnifiedTag,
  UnifiedMedia,
  UnifiedInteraction,
  ContentType,
  ContentStatus,
} from '../../models/cms';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import { getCacheService } from '../cache/UnifiedCacheService';
import emailService from '../email/UnifiedEmailService';
import cron from 'node-cron';
import { sequelize } from '../../models';

// ==================== Interfaces ====================

interface ContentOptions {
  notifyAuthor?: boolean;
  notifySubscribers?: boolean;
  socialShare?: boolean;
  validateSEO?: boolean;
  skipCache?: boolean;
}

interface ContentFilter {
  type?: ContentType | ContentType[];
  status?: ContentStatus | ContentStatus[];
  authorId?: string;
  categoryId?: string;
  tags?: string[];
  isPremium?: boolean;
  isPrivate?: boolean;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  seoScore: number;
  readabilityScore: number;
}

interface ContentAnalytics {
  views: number;
  uniqueViews: number;
  avgReadTime: number;
  completionRate: number;
  engagementRate: number;
  shares: number;
  comments: number;
  likes: number;
}

// ==================== Main Service Class ====================

export class UnifiedContentService {
  private static instance: UnifiedContentService;
  private cache = getCacheService();
  private email = getEmailService();
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.initializeScheduler();
  }

  public static getInstance(): UnifiedContentService {
    if (!UnifiedContentService.instance) {
      UnifiedContentService.instance = new UnifiedContentService();
    }
    return UnifiedContentService.instance;
  }

  // ==================== Initialization ====================

  private initializeScheduler() {
    // Check for scheduled publishing every minute
    cron.schedule('* * * * *', async () => {
      await this.processScheduledContent();
    });

    // Check for expired content every hour
    cron.schedule('0 * * * *', async () => {
      await this.processExpiredContent();
    });

    // Update analytics every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.updateContentAnalytics();
    });

    logger.info('Content scheduler initialized');
  }

  // ==================== CRUD Operations ====================

  /**
   * Create new content
   */
  async createContent(
    data: Partial<UnifiedContent>,
    options: ContentOptions = {}
  ): Promise<UnifiedContent> {
    const transaction = await sequelize.transaction();

    try {
      // Create content
      const content = await UnifiedContent.create(data as any, { transaction });

      // Handle tags
      if (data.tags?.length) {
        await this.attachTags(content.id, data.tags as string[], transaction);
      }

      // Handle media
      if (data.media?.length) {
        await this.attachMedia(content.id, data.media as string[], transaction);
      }

      // Validate if requested
      if (options.validateSEO) {
        const validation = await this.validateContent(content);
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      await transaction.commit();

      // Post-creation tasks
      if (!options.skipCache) {
        await this.cache.set(`content:${content.id}`, content, { ttl: 3600 });
      }

      if (options.notifyAuthor) {
        await this.notifyAuthor(content, 'created');
      }

      logger.info('Content created', { contentId: content.id, type: content.type });
      return content;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get content by ID
   */
  async getContent(
    id: string,
    options: { includeRelations?: boolean; skipCache?: boolean } = {}
  ): Promise<UnifiedContent | null> {
    // Check cache first
    if (!options.skipCache) {
      const cached = await this.cache.get<UnifiedContent>(`content:${id}`);
      if (cached) return cached;
    }

    const include = options.includeRelations
      ? [
          { model: User, as: 'author' },
          { model: UnifiedCategory, as: 'category' },
          { model: UnifiedTag, as: 'tags' },
          { model: UnifiedMedia, as: 'media' },
        ]
      : [];

    const content = await UnifiedContent.findByPk(id, { include });

    if (content && !options.skipCache) {
      await this.cache.set(`content:${id}`, content, { ttl: 3600 });
    }

    return content;
  }

  /**
   * Update content
   */
  async updateContent(
    id: string,
    data: Partial<UnifiedContent>,
    userId: string,
    options: ContentOptions = {}
  ): Promise<UnifiedContent> {
    const transaction = await sequelize.transaction();

    try {
      const content = await UnifiedContent.findByPk(id, { transaction });
      if (!content) {
        throw new Error('Content not found');
      }

      // Create version before update
      await content.createVersion(userId, 'Updated content');

      // Update content
      await content.update(data, { transaction });

      // Update tags if provided
      if (data.tags) {
        await this.updateTags(content.id, data.tags as string[], transaction);
      }

      // Update media if provided
      if (data.media) {
        await this.updateMedia(content.id, data.media as string[], transaction);
      }

      // Validate if requested
      if (options.validateSEO) {
        const validation = await this.validateContent(content);
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      await transaction.commit();

      // Clear cache
      await this.invalidateContentCache(content.id);

      if (options.notifyAuthor) {
        await this.notifyAuthor(content, 'updated');
      }

      logger.info('Content updated', { contentId: content.id });
      return content;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete content (soft delete)
   */
  async deleteContent(id: string, userId: string): Promise<boolean> {
    const content = await UnifiedContent.findByPk(id);
    if (!content) {
      throw new Error('Content not found');
    }

    // Create deletion version
    await content.createVersion(userId, 'Deleted content');

    // Soft delete
    await content.destroy();

    // Clear cache
    await this.invalidateContentCache(id);

    logger.info('Content deleted', { contentId: id });
    return true;
  }

  // ==================== Publishing Operations ====================

  /**
   * Publish content
   */
  async publishContent(id: string, options: ContentOptions = {}): Promise<UnifiedContent> {
    const content = await this.getContent(id, { includeRelations: true });
    if (!content) {
      throw new Error('Content not found');
    }

    // Validate before publishing
    if (options.validateSEO) {
      const validation = await this.validateContent(content);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Update status
    await content.publish();

    // Clear cache
    await this.invalidateContentCache(id);

    // Send notifications
    if (options.notifyAuthor) {
      await this.notifyAuthor(content, 'published');
    }

    if (options.notifySubscribers) {
      await this.notifySubscribers(content);
    }

    if (options.socialShare) {
      await this.scheduleSocialSharing(content);
    }

    logger.info('Content published', { contentId: id, title: content.title });
    return content;
  }

  /**
   * Schedule content publishing
   */
  async schedulePublishing(
    id: string,
    publishDate: Date,
    options: ContentOptions = {}
  ): Promise<UnifiedContent> {
    const content = await this.getContent(id);
    if (!content) {
      throw new Error('Content not found');
    }

    // Update scheduled date and status
    content.scheduledAt = publishDate;
    content.status = 'scheduled';
    await content.save();

    // Set up immediate scheduling if within 24 hours
    const timeUntilPublish = publishDate.getTime() - Date.now();
    if (timeUntilPublish > 0 && timeUntilPublish < 24 * 60 * 60 * 1000) {
      const timeout = setTimeout(async () => {
        await this.publishContent(id, options);
        this.scheduledTasks.delete(id);
      }, timeUntilPublish);

      this.scheduledTasks.set(id, timeout);
    }

    logger.info('Content scheduled', { contentId: id, publishDate });
    return content;
  }

  /**
   * Process scheduled content
   */
  private async processScheduledContent() {
    try {
      const contents = await UnifiedContent.getScheduledForPublishing();

      for (const content of contents) {
        try {
          await this.publishContent(content.id, {
            notifyAuthor: true,
            notifySubscribers: true,
          });
        } catch (error) {
          logger.error('Failed to publish scheduled content', {
            contentId: content.id,
            error: (error as Error).message,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process scheduled content', error);
    }
  }

  /**
   * Process expired content
   */
  private async processExpiredContent() {
    try {
      const contents = await UnifiedContent.getExpired();

      for (const content of contents) {
        content.status = 'expired';
        await content.save();
        await this.invalidateContentCache(content.id);
      }

      if (contents.length > 0) {
        logger.info(`Expired ${contents.length} content items`);
      }
    } catch (error) {
      logger.error('Failed to process expired content', error);
    }
  }

  // ==================== Search & Query Operations ====================

  /**
   * Search content with filters
   */
  async searchContent(
    filter: ContentFilter = {},
    pagination: PaginationOptions = {}
  ): Promise<{ data: UnifiedContent[]; total: number; pages: number }> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'DESC' } = pagination;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: WhereOptions = {};

    if (filter.type) {
      where.type = Array.isArray(filter.type) ? { [Op.in as any]: filter.type } : filter.type;
    }

    if (filter.status) {
      where.status = Array.isArray(filter.status)
        ? { [Op.in as any]: filter.status }
        : filter.status;
    }

    if (filter.authorId) where.authorId = filter.authorId;
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.isPremium !== undefined) where.isPremium = filter.isPremium;
    if (filter.isPrivate !== undefined) where.isPrivate = filter.isPrivate;

    if (filter.search) {
      where[Op.or as any] = [
        { title: { [Op.iLike]: `%${filter.search}%` } },
        { content: { [Op.iLike]: `%${filter.search}%` } },
        { excerpt: { [Op.iLike]: `%${filter.search}%` } },
      ];
    }

    if (filter.dateFrom || filter.dateTo) {
      where.publishedAt = {};
      if (filter.dateFrom) where.publishedAt[Op.gte] = filter.dateFrom;
      if (filter.dateTo) where.publishedAt[Op.lte] = filter.dateTo;
    }

    // Execute query
    const { count, rows } = await UnifiedContent.findAndCountAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: UnifiedCategory, as: 'category', attributes: ['id', 'name', 'slug'] },
      ],
      order: [[sort, order]],
      limit,
      offset,
    });

    return {
      data: rows,
      total: count,
      pages: Math.ceil(count / limit),
    };
  }

  /**
   * Get popular content
   */
  async getPopularContent(type?: ContentType, limit = 10): Promise<UnifiedContent[]> {
    const cacheKey = `content:popular:${type || 'all'}:${limit}`;
    const cached = await this.cache.get<UnifiedContent[]>(cacheKey);
    if (cached) return cached;

    const content = await UnifiedContent.getPopular(limit, type);

    await this.cache.set(cacheKey, content, { ttl: 600 }); // Cache for 10 minutes
    return content;
  }

  /**
   * Get related content
   */
  async getRelatedContent(contentId: string, limit = 5): Promise<UnifiedContent[]> {
    const content = await this.getContent(contentId, { includeRelations: true });
    if (!content) return [];

    // Find content with similar tags or in same category
    const related = await UnifiedContent.findAll({
      where: {
        id: { [Op.ne as any]: contentId },
        status: 'published',
        [Op.or as any]: [{ categoryId: content.categoryId }, { type: content.type }],
      },
      order: [['viewCount', 'DESC']],
      limit,
    });

    return related;
  }

  // ==================== Analytics & Tracking ====================

  /**
   * Track content interaction
   */
  async trackInteraction(
    contentId: string,
    userId: string,
    type: 'view' | 'like' | 'share' | 'comment' | 'rating',
    data?: any
  ): Promise<void> {
    try {
      // Create interaction record
      await UnifiedInteraction.create({
        type,
        contentId,
        userId,
        ...(type === 'comment' && { commentData: data }),
        ...(type === 'rating' && { ratingData: data }),
        ...(type === 'share' && { shareData: data }),
        metadata: {
          timestamp: new Date(),
          ...data?.metadata,
        },
      });

      // Update content counters
      const content = await UnifiedContent.findByPk(contentId);
      if (content) {
        switch (type) {
          case 'view':
            await content.incrementViewCount();
            break;
          case 'like':
            content.likeCount += 1;
            await content.save();
            break;
          case 'share':
            content.shareCount += 1;
            await content.save();
            break;
          case 'comment':
            content.commentCount += 1;
            await content.save();
            break;
        }
      }

      // Clear cache to reflect new counts
      await this.invalidateContentCache(contentId);
    } catch (error) {
      logger.error('Failed to track interaction', { contentId, userId, type, error });
    }
  }

  /**
   * Get content analytics
   */
  async getContentAnalytics(
    contentId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ContentAnalytics> {
    const where: any = { contentId };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = dateFrom;
      if (dateTo) where.createdAt[Op.lte] = dateTo;
    }

    const interactions = await UnifiedInteraction.findAll({ where });

    const views = interactions.filter(i => i.type === 'view');
    const uniqueViews = new Set(views.map(v => v.userId)).size;
    const likes = interactions.filter(i => i.type === 'like').length;
    const shares = interactions.filter(i => i.type === 'share').length;
    const comments = interactions.filter(i => i.type === 'comment').length;

    // Calculate average read time from view interactions
    const viewsWithDuration = views.filter(v => v.metadata?.duration);
    const avgReadTime =
      viewsWithDuration.length > 0
        ? viewsWithDuration.reduce((sum, v) => sum + (v.metadata?.duration || 0), 0) /
          viewsWithDuration.length
        : 0;

    // Calculate completion rate (views with duration > 80% of estimated reading time)
    const content = await UnifiedContent.findByPk(contentId);
    const estimatedReadTime = content?.readingTime || 5;
    const completedViews = viewsWithDuration.filter(
      v => (v.metadata?.duration || 0) > estimatedReadTime * 60 * 0.8
    ).length;
    const completionRate =
      viewsWithDuration.length > 0 ? (completedViews / viewsWithDuration.length) * 100 : 0;

    // Calculate engagement rate
    const engagementRate =
      views.length > 0 ? ((likes + shares + comments) / views.length) * 100 : 0;

    return {
      views: views.length,
      uniqueViews,
      avgReadTime: Math.round(avgReadTime / 60), // Convert to minutes
      completionRate: Math.round(completionRate),
      engagementRate: Math.round(engagementRate),
      shares,
      comments,
      likes,
    };
  }

  /**
   * Update content analytics (batch job)
   */
  private async updateContentAnalytics() {
    try {
      // Get content that needs analytics update
      const contents = await UnifiedContent.findAll({
        where: {
          status: 'published',
          updatedAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        limit: 100,
      });

      for (const content of contents) {
        const analytics = await this.getContentAnalytics(content.id);

        // Update content with latest analytics
        content.completionRate = analytics.completionRate;
        await content.save();
      }
    } catch (error) {
      logger.error('Failed to update content analytics', error);
    }
  }

  // ==================== Validation ====================

  /**
   * Validate content
   */
  async validateContent(content: UnifiedContent): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let seoScore = 100;
    let readabilityScore = 100;

    // Basic validation
    if (!content.title || content.title.length < 10) {
      errors.push('Title must be at least 10 characters');
      seoScore -= 20;
    }

    if (content.title.length > 60) {
      warnings.push('Title is too long for SEO (>60 characters)');
      seoScore -= 5;
    }

    if (!content.content || content.content.length < 100) {
      errors.push('Content must be at least 100 characters');
      readabilityScore -= 30;
    }

    // SEO validation
    if (!content.metaTitle) {
      warnings.push('Meta title is missing');
      seoScore -= 10;
    } else if (content.metaTitle.length > 60) {
      warnings.push('Meta title is too long (>60 characters)');
      seoScore -= 5;
    }

    if (!content.metaDescription) {
      warnings.push('Meta description is missing');
      seoScore -= 10;
    } else if (content.metaDescription.length > 160) {
      warnings.push('Meta description is too long (>160 characters)');
      seoScore -= 5;
    }

    if (!content.metaKeywords || content.metaKeywords.length === 0) {
      warnings.push('Keywords help with SEO');
      seoScore -= 5;
    }

    // Content quality checks
    if (!content.excerpt) {
      warnings.push('Excerpt improves content preview');
      readabilityScore -= 10;
    }

    if (!content.featuredImageUrl) {
      warnings.push('Featured image improves engagement');
      seoScore -= 5;
    }

    if (!content.categoryId) {
      warnings.push('Category helps with organization');
      readabilityScore -= 5;
    }

    // Calculate readability (simplified)
    const words = content.content.split(/\s+/).length;
    const sentences = content.content.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;

    if (avgWordsPerSentence > 25) {
      warnings.push('Sentences are too long for easy reading');
      readabilityScore -= 10;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      seoScore: Math.max(0, seoScore),
      readabilityScore: Math.max(0, readabilityScore),
    };
  }

  // ==================== Helper Methods ====================

  /**
   * Attach tags to content
   */
  private async attachTags(
    contentId: string,
    tagIds: string[],
    transaction?: Transaction
  ): Promise<void> {
    const content = await UnifiedContent.findByPk(contentId, { transaction });
    if (!content) return;

    const tags = await UnifiedTag.findAll({
      where: { id: { [Op.in as any]: tagIds } },
      transaction,
    });

    await content.setTags(tags);

    // Update tag usage counts
    for (const tag of tags) {
      tag.usageCount += 1;
      await tag.save({ transaction });
    }
  }

  /**
   * Update tags for content
   */
  private async updateTags(
    contentId: string,
    tagIds: string[],
    transaction?: Transaction
  ): Promise<void> {
    const content = await UnifiedContent.findByPk(contentId, {
      include: [{ model: UnifiedTag, as: 'tags' }],
      transaction,
    });
    if (!content) return;

    // Get current tags
    const currentTags = content.tags || [];
    // const currentTagIds = currentTags.map(t => t.id);

    // Find tags to remove
    const tagsToRemove = currentTags.filter(t => !tagIds.includes(t.id));
    for (const tag of tagsToRemove) {
      tag.usageCount = Math.max(0, tag.usageCount - 1);
      await tag.save({ transaction });
    }

    // Attach new tags
    await this.attachTags(contentId, tagIds, transaction);
  }

  /**
   * Attach media to content
   */
  private async attachMedia(
    contentId: string,
    mediaIds: string[],
    transaction?: Transaction
  ): Promise<void> {
    await UnifiedMedia.update(
      { contentId },
      {
        where: { id: { [Op.in as any]: mediaIds } },
        transaction,
      }
    );
  }

  /**
   * Update media for content
   */
  private async updateMedia(
    contentId: string,
    mediaIds: string[],
    transaction?: Transaction
  ): Promise<void> {
    // Remove old associations
    await UnifiedMedia.update({ contentId: null } as any, {
      where: { contentId },
      transaction,
    });

    // Add new associations
    await this.attachMedia(contentId, mediaIds, transaction);
  }

  /**
   * Invalidate content cache
   */
  private async invalidateContentCache(contentId: string): Promise<void> {
    await this.cache.del(`content:${contentId}`);
    await this.cache.invalidate('content:popular:*');
    await this.cache.invalidate('content:featured:*');
  }

  /**
   * Notify author about content changes
   */
  private async notifyAuthor(
    content: UnifiedContent,
    action: string,
    message?: string
  ): Promise<void> {
    try {
      const author = await User.findByPk(content.authorId);
      if (!author) return;

      await this.email.send({
        to: author.email,
        subject: `Your ${content.type} has been ${action}`,
        template: `content-${action}`,
        data: {
          authorName: author.name,
          contentTitle: content.title,
          contentType: content.type,
          contentUrl: `${process.env.FRONTEND_URL}/content/${content.slug}`,
          message,
        },
      });
    } catch (error) {
      logger.error('Failed to notify author', { error, contentId: content.id });
    }
  }

  /**
   * Notify subscribers about new content
   */
  private async notifySubscribers(content: UnifiedContent): Promise<void> {
    try {
      // Get subscribers based on category and preferences
      const subscribers = await this.getSubscribers(content.categoryId);

      for (const subscriber of subscribers) {
        await this.email.send({
          to: subscriber.email,
          subject: `New ${content.type}: ${content.title}`,
          template: 'new-content',
          data: {
            subscriberName: subscriber.name,
            contentTitle: content.title,
            contentExcerpt: content.excerpt,
            contentUrl: `${process.env.FRONTEND_URL}/content/${content.slug}`,
            unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe`,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to notify subscribers', { error, contentId: content.id });
    }
  }

  /**
   * Get subscribers for a category
   */
  private async getSubscribers(categoryId?: string): Promise<User[]> {
    const where: any = {
      emailVerified: true,
      status: 'active',
    };

    // Add category preference filter if provided
    if (categoryId) {
      // This would need to be implemented based on your user preferences structure
      // For now, returning a limited set of users
    }

    return User.findAll({ where, limit: 100 });
  }

  /**
   * Schedule social media sharing
   */
  private async scheduleSocialSharing(content: UnifiedContent): Promise<void> {
    // This would integrate with social media APIs
    // For now, just log the action
    logger.info('Social sharing scheduled', {
      contentId: content.id,
      title: content.title,
    });
  }
}

// Export singleton instance
export const getContentService = () => UnifiedContentService.getInstance();
export default UnifiedContentService;
