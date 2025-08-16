import { Op, Transaction } from 'sequelize';
import { sequelize } from '../../config/database';
import ForumCategory from '../../models/community/ForumCategory';
import ForumThread from '../../models/community/ForumThread';
import ForumPost from '../../models/community/ForumPost';
import ForumVote from '../../models/community/ForumVote';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import { getCacheService } from '../cache/UnifiedCacheService';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

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
  async getCategories(): Promise<ForumCategory[]> {
    const cacheKey = 'forum:categories';
    const cached = await getCacheService().get<ForumCategory[]>(cacheKey);
    
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
  async createThread(data: CreateThreadData): Promise<ForumThread> {
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
      const thread = await ForumThread.create({
        categoryId: data.categoryId,
        userId: data.userId,
        title: data.title.trim(),
        content: sanitizedContent,
        tags: data.tags || [],
      }, { transaction });

      // Create initial post
      await ForumPost.create({
        threadId: thread.id,
        userId: data.userId,
        content: sanitizedContent,
      }, { transaction });

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
    threads: ForumThread[];
    total: number;
    pages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const where: any = {};
    const order: any[] = [];

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
      where[Op.or] = [
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
  async getThread(threadId: string, userId?: string): Promise<ForumThread | null> {
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
      thread.posts.forEach((post: any) => {
        const votes = post.votes || [];
        post.voteScore = votes.reduce((sum: number, vote: any) => sum + vote.voteType, 0);
        
        // Add user vote if userId provided
        if (userId) {
          const userVote = votes.find((v: any) => v.userId === userId);
          post.userVote = userVote ? userVote.voteType : 0;
        }
      });
    }

    return thread;
  }

  // Create a reply
  async createPost(data: CreatePostData): Promise<ForumPost> {
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
      const post = await ForumPost.create({
        threadId: data.threadId,
        userId: data.userId,
        parentId: data.parentId,
        content: sanitizedContent,
      }, { transaction });

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
        await ForumVote.create({
          postId,
          userId,
          voteType,
        }, { transaction });
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
  async editPost(postId: string, userId: string, content: string): Promise<ForumPost> {
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
      include: [{
        model: ForumThread,
        as: 'thread',
      }],
    });

    if (!post || !post.thread) {
      throw new Error('Post not found');
    }

    // Only thread author can mark solution
    if (post.thread.userId !== userId) {
      throw new Error('Only thread author can mark solution');
    }

    // Remove previous solution
    await ForumPost.update(
      { isSolution: false },
      { where: { threadId: post.threadId } }
    );

    // Mark new solution
    post.isSolution = true;
    await post.save();

    // Award reputation to solution author
    await this.updateUserReputation(post.userId, 50);
  }

  // Helper methods

  private sanitizeContent(content: string): string {
    // Convert markdown to HTML
    const html = marked(content);
    
    // Sanitize HTML
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                     'blockquote', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'img'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    });
  }

  private async trackActivity(userId: string, type: string, targetType: string, targetId: string): Promise<void> {
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
      await User.increment('reputation_points', {
        by: points,
        where: { id: userId },
      });
    } catch (error) {
      logger.error('Failed to update user reputation', { error, userId, points });
    }
  }

  private async notifyThreadParticipants(threadId: string, authorId: string, postId: string): Promise<void> {
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
      const notifications = participants.map((p: any) => ({
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
            replacements: notifications.flatMap(n => [n.user_id, n.type, n.title, n.message, JSON.stringify(n.data), n.created_at]),
          }
        );
      }
    } catch (error) {
      logger.error('Failed to notify thread participants', { error, threadId });
    }
  }
}

export const forumService = new ForumService();