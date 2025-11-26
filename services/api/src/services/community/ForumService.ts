import { Op } from 'sequelize';

import ForumCategory from '../../models/community/ForumCategory';
import ForumPost from '../../models/community/ForumPost';
import ForumThread from '../../models/community/ForumThread';
import ForumVote from '../../models/community/ForumVote';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import { getCacheService } from '../cache/UnifiedCacheService';
import DOMPurify from 'isomorphic-dompurify';
import { sequelize } from '../../config/database';

interface CreateThreadData {
  categoryId: string;
  userId: string;
  title: string;
  content: string;
  tags?: string[];
}

interface CreatePostData {
  threadId: string;
  userId: string;
  content: string;
  parentId?: string;
}

interface ForumSearchParams {
  query?: string;
  categoryId?: string;
  tags?: string[];
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'latest' | 'popular' | 'unanswered';
}

export class ForumService {
  // Get all forum categories
  async getCategories(): Promise<any[]> {
    const cacheKey = 'forum:categories';
    const cached = await getCacheService().get<any[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const categories = await ForumCategory.findAll({
      where: { isActive: true },
      order: [['orderIndex', 'ASC']],
      attributes: ['id', 'name', 'description', 'slug', 'icon', 'color'],
    });

    await getCacheService().set(cacheKey, categories, { ttl: 3600 }); // Cache for 1 hour
    return categories;
  }

  // Create a new thread
  async createThread(data: CreateThreadData): Promise<unknown> {
    const transaction = await sequelize.transaction();

    try {
      // Validate category exists
      const category = await ForumCategory.findByPk(data.categoryId);
      if (!category || !category.isActive) {
        throw new Error('Invalid category');
      }

      // Sanitize content
      const sanitizedContent = this.sanitizeContent(data.content);

      // Create thread
      const thread = await ForumThread.create(
        {
          categoryId: data.categoryId,
          userId: data.userId,
          title: data.title.trim(),
          content: sanitizedContent,
          tags: data.tags || [],
        },
        { transaction }
      );

      // Create initial post
      await ForumPost.create(
        {
          threadId: thread.id,
          userId: data.userId,
          content: sanitizedContent,
        },
        { transaction }
      );

      await transaction.commit();

      // Clear category threads cache
      await getCacheService().del(`forum:threads:${data.categoryId}:*`);

      // Track activity
      await this.trackActivity(data.userId, 'thread_created', 'thread', thread.id);

      return thread;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create thread', { error, data });
      throw error;
    }
  }

  // Get threads with pagination
  async getThreads(params: ForumSearchParams): Promise<{
    threads: unknown[];
    total: number;
    pages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const where: unknown = {};
    const order: unknown[] = [];

    // Filter by category
    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    // Filter by tags
    if (params.tags && params.tags.length > 0) {
      where.tags = { [Op.overlap]: params.tags };
    }

    // Filter by user
    if (params.userId) {
      where.userId = params.userId;
    }

    // Search query
    if (params.query) {
      where[Op.or as unknown] = [
        { title: { [Op.iLike]: `%${params.query}%` } },
        { content: { [Op.iLike]: `%${params.query}%` } },
      ];
    }

    // Sorting
    switch (params.sortBy) {
      case 'popular':
        order.push(['views', 'DESC']);
        break;
      case 'unanswered':
        where.replyCount = 0;
        order.push(['createdAt', 'DESC']);
        break;
      case 'latest':
      default:
        order.push(['createdAt', 'DESC']);
    }

    // Add pinned threads first
    order.unshift(['isPinned', 'DESC']);

    const { count, rows: threads } = await ForumThread.findAndCountAll({
      where,
      order,
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar'],
        },
        {
          model: ForumCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'color'],
        },
      ],
    });

    return {
      threads,
      total: count,
      pages: Math.ceil(count / limit),
    };
  }

  // Get thread details with posts
  async getThread(threadId: string, userId?: string): Promise<any | null> {
    const thread = await ForumThread.findByPk(threadId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar', 'reputation_points'],
        },
        {
          model: ForumCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'color'],
        },
        {
          model: ForumPost,
          as: 'posts',
          where: { isDeleted: false },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'avatar', 'reputation_points'],
            },
            {
              model: ForumVote,
              as: 'votes',
              attributes: ['userId', 'voteType'],
            },
          ],
          order: [['createdAt', 'ASC']],
        },
      ],
    });

    if (!thread) {
      return null;
    }

    // Increment view count
    await thread.incrementViews();

    // Calculate vote scores for posts
    if (thread.posts) {
      thread.posts.forEach((post: unknown) => {
        const votes = post.votes || [];
        post.voteScore = votes.reduce((sum: number, vote: unknown) => sum + vote.voteType, 0);

        // Add user vote if userId provided
        if (userId) {
          const userVote = votes.find((v: unknown) => v.userId === userId);
          post.userVote = userVote ? userVote.voteType : 0;
        }
      });
    }

    return thread;
  }

  // Create a reply
  async createPost(data: CreatePostData): Promise<unknown> {
    const transaction = await sequelize.transaction();

    try {
      // Validate thread exists and is not locked
      const thread = await ForumThread.findByPk(data.threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }
      if (thread.isLocked) {
        throw new Error('Thread is locked');
      }

      // Validate parent post if provided
      if (data.parentId) {
        const parentPost = await ForumPost.findByPk(data.parentId);
        if (!parentPost || parentPost.threadId !== data.threadId) {
          throw new Error('Invalid parent post');
        }
      }

      // Sanitize content
      const sanitizedContent = this.sanitizeContent(data.content);

      // Create post
      const post = await ForumPost.create(
        {
          threadId: data.threadId,
          userId: data.userId,
          parentId: data.parentId,
          content: sanitizedContent,
        },
        { transaction }
      );

      await transaction.commit();

      // Get post with associations
      const fullPost = await ForumPost.findByPk(post.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar', 'reputation_points'],
          },
        ],
      });

      // Track activity
      await this.trackActivity(data.userId, 'post_created', 'post', post.id);

      // Send notifications
      await this.notifyThreadParticipants(data.threadId, data.userId, post.id);

      return fullPost!;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create post', { error, data });
      throw error;
    }
  }

  // Vote on a post
  async votePost(postId: string, userId: string, voteType: 1 | -1): Promise<number> {
    const transaction = await sequelize.transaction();

    try {
      // Check if vote exists
      const existingVote = await ForumVote.findOne({
        where: { postId, userId },
      });

      if (existingVote) {
        if (existingVote.voteType === voteType) {
          // Remove vote if same type
          await existingVote.destroy({ transaction });
        } else {
          // Update vote type
          existingVote.voteType = voteType;
          await existingVote.save({ transaction });
        }
      } else {
        // Create new vote
        await ForumVote.create(
          {
            postId,
            userId,
            voteType,
          },
          { transaction }
        );
      }

      // Calculate new score
      const votes = await ForumVote.findAll({
        where: { postId },
        attributes: ['voteType'],
        transaction,
      });

      const score = votes.reduce((sum, vote) => sum + vote.voteType, 0);

      await transaction.commit();

      // Update post author reputation
      const post = await ForumPost.findByPk(postId);
      if (post) {
        await this.updateUserReputation(post.userId, voteType * 5);
      }

      return score;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to vote on post', { error, postId, userId });
      throw error;
    }
  }

  // Edit a post
  async editPost(postId: string, userId: string, content: string): Promise<unknown> {
    const post = await ForumPost.findByPk(postId);

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (post.isDeleted) {
      throw new Error('Cannot edit deleted post');
    }

    // Sanitize content
    const sanitizedContent = this.sanitizeContent(content);

    // Update post
    post.content = sanitizedContent;
    post.editCount += 1;
    post.lastEditedAt = new Date();
    await post.save();

    return post;
  }

  // Delete a post (soft delete)
  async deletePost(postId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const post = await ForumPost.findByPk(postId);

    if (!post) {
      throw new Error('Post not found');
    }

    if (!isAdmin && post.userId !== userId) {
      throw new Error('Unauthorized');
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    post.deletedBy = userId;
    await post.save();
  }

  // Mark post as solution
  async markAsSolution(postId: string, userId: string): Promise<void> {
    const post = await ForumPost.findByPk(postId, {
      include: [
        {
          model: ForumThread,
          as: 'thread',
        },
      ],
    });

    if (!post || !post.thread) {
      throw new Error('Post not found');
    }

    // Only thread author can mark solution
    if (post.thread.userId !== userId) {
      throw new Error('Only thread author can mark solution');
    }

    // Remove previous solution
    await ForumPost.update({ isSolution: false }, { where: { threadId: post.threadId } });

    // Mark new solution
    post.isSolution = true;
    await post.save();

    // Award reputation to solution author
    await this.updateUserReputation(post.userId, 50);
  }

  // Helper methods

  private sanitizeContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    // Configure DOMPurify for forum content
    const cleanConfig = {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 's',
        'blockquote', 'code', 'pre', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'a', 'img'
      ],
      ALLOWED_ATTR: {
        'a': ['href', 'title', 'target', 'rel'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
        '*': ['class']
      },
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'textarea', 'select', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'style'],
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      SANITIZE_DOM: true,
      SANITIZE_NAMED_PROPS: true,
      WHOLE_DOCUMENT: false,
      // Security-focused configurations
      FORCE_BODY: false,
      RETURN_TRUSTED_TYPE: false,
      SAFE_FOR_TEMPLATES: true
    };

    try {
      // First pass: Basic validation and length check
      if (content.length > 50000) { // 50KB limit for forum posts
        content = content.substring(0, 50000);
      }

      // Second pass: Remove potentially dangerous patterns
      content = content
        .replace(/javascript:/gi, 'blocked:')
        .replace(/data:/gi, 'blocked:')
        .replace(/vbscript:/gi, 'blocked:')
        .replace(/on\w+\s*=/gi, '')
        .replace(/<\s*script[^>]*>.*?<\s*\/\s*script\s*>/gis, '')
        .replace(/<\s*iframe[^>]*>.*?<\s*\/\s*iframe\s*>/gis, '')
        .replace(/<\s*object[^>]*>.*?<\s*\/\s*object\s*>/gis, '')
        .replace(/<\s*embed[^>]*>.*?<\s*\/\s*embed\s*>/gis, '');

      // Third pass: DOMPurify sanitization
      const sanitized = DOMPurify.sanitize(content, cleanConfig);

      // Fourth pass: Additional validation for links
      const linkRegex = /<a[^>]+href\s*=\s*["']([^"']+)["'][^>]*>/gi;
      const processedContent = sanitized.replace(linkRegex, (match, href) => {
        // Validate URL protocols
        const allowedProtocols = ['http:', 'https:', 'mailto:'];
        try {
          const url = new URL(href);
          if (!allowedProtocols.includes(url.protocol)) {
            return match.replace(href, '#blocked-url');
          }
          // Add security attributes to external links
          if (url.hostname !== 'localhost' && !url.hostname.includes('upcoach')) {
            return match.replace('>', ' rel="noopener noreferrer nofollow" target="_blank">');
          }
          return match;
        } catch {
          // Invalid URL - remove the link but keep content
          return match.replace(/<a[^>]*>/gi, '').replace(/<\/a>/gi, '');
        }
      });

      return processedContent.trim();
    } catch (error) {
      logger.error('Content sanitization failed', { error, contentLength: content.length });
      // Fallback to very basic sanitization
      return content
        .replace(/<[^>]*>/g, '') // Strip all HTML tags
        .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
        .trim()
        .substring(0, 10000); // Limit length
    }
  }

  private async trackActivity(
    userId: string,
    type: string,
    targetType: string,
    targetId: string
  ): Promise<void> {
    try {
      await sequelize.query(
        `INSERT INTO activities (user_id, activity_type, target_type, target_id, created_at)
         VALUES (:userId, :type, :targetType, :targetId, NOW())`,
        {
          replacements: { userId, type, targetType, targetId },
        }
      );
    } catch (error) {
      logger.error('Failed to track activity', { error, userId, type });
    }
  }

  private async updateUserReputation(userId: string, points: number): Promise<void> {
    try {
      await sequelize.query(
        `UPDATE users SET reputation_points = reputation_points + :points WHERE id = :userId`,
        {
          replacements: { userId, points },
        }
      );
    } catch (error) {
      logger.error('Failed to update user reputation', { error, userId, points });
    }
  }

  private async notifyThreadParticipants(
    threadId: string,
    authorId: string,
    postId: string
  ): Promise<void> {
    try {
      // Get all unique participants in thread
      const participants = await sequelize.query(
        `SELECT DISTINCT user_id FROM forum_posts 
         WHERE thread_id = :threadId 
         AND user_id != :authorId 
         AND is_deleted = false`,
        {
          replacements: { threadId, authorId },
          type: 'SELECT',
        }
      );

      // Create notifications for each participant
      const notifications = participants.map((p: unknown) => ({
        user_id: p.user_id,
        type: 'forum_reply',
        title: 'New reply in thread',
        message: 'Someone replied to a thread you participated in',
        data: { threadId, postId },
        created_at: new Date(),
      }));

      if (notifications.length > 0) {
        await sequelize.query(
          `INSERT INTO notifications (user_id, type, title, message, data, created_at)
           VALUES ${notifications.map(() => '(?, ?, ?, ?, ?, ?)').join(', ')}`,
          {
            replacements: notifications.flatMap(n => [
              n.user_id,
              n.type,
              n.title,
              n.message,
              JSON.stringify(n.data),
              n.created_at,
            ]),
          }
        );
      }
    } catch (error) {
      logger.error('Failed to notify thread participants', { error, threadId });
    }
  }
}

export const forumService = new ForumService();
