import { Request, Response } from 'express';
import { forumService } from '../../services/community/ForumService';
import { logger } from '../../utils/logger';
import { validationResult } from 'express-validator';

export class ForumController {
  // Get all forum categories
  async getCategories_(req: Request, res: Response) {
    try {
      const categories = await forumService.getCategories();
      
      (res as any).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      logger.error('Failed to get forum categories', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get categories',
      });
    }
  }

  // Get threads
  async getThreads(req: Request, res: Response) {
    try {
      const {
        categoryId,
        tags,
        userId,
        query,
        page = '1',
        limit = '20',
        sortBy = 'latest',
      } = req.query;

      const result = await forumService.getThreads({
        categoryId: categoryId as string,
        tags: tags ? (tags as string).split(',') : undefined,
        userId: userId as string,
        query: query as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as 'latest' | 'popular' | 'unanswered',
      });

      (res as any).json({
        success: true,
        data: result.threads,
        pagination: {
          total: result.total,
          pages: result.pages,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        },
      });
    } catch (error) {
      logger.error('Failed to get threads', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get threads',
      });
    }
  }

  // Get thread details
  async getThread(req: Request, res: Response) {
    try {
      const { threadId } = req.params;
      const userId = (req as any).user?.id;

      const thread = await forumService.getThread(threadId, userId);

      if (!thread) {
        return res.status(404).json({
          success: false,
          error: 'Thread not found',
        });
      }

      (res as any).json({
        success: true,
        data: thread,
      });
    } catch (error) {
      logger.error('Failed to get thread', { error, threadId: req.params.threadId });
      res.status(500).json({
        success: false,
        error: 'Failed to get thread',
      });
    }
  }

  // Create new thread
  async createThread(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { categoryId, title, content, tags } = req.body;
      const userId = (req as any).user!.id;

      const thread = await forumService.createThread({
        categoryId,
        userId,
        title,
        content,
        tags,
      });

      res.status(201).json({
        success: true,
        data: thread,
      });
    } catch (error) {
      logger.error('Failed to create thread', { error, userId: (req as any).user!.id });
      res.status(500).json({
        success: false,
        error: 'Failed to create thread',
      });
    }
  }

  // Create post/reply
  async createPost(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { threadId, content, parentId } = req.body;
      const userId = (req as any).user!.id;

      const post = await forumService.createPost({
        threadId,
        userId,
        content,
        parentId,
      });

      res.status(201).json({
        success: true,
        data: post,
      });
    } catch (error) {
      logger.error('Failed to create post', { error, userId: (req as any).user!.id });
      res.status(500).json({
        success: false,
        error: (error as Error).message || 'Failed to create post',
      });
    }
  }

  // Vote on post
  async votePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const { voteType } = req.body;
      const userId = (req as any).user!.id;

      if (![1, -1].includes(voteType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid vote type',
        });
      }

      const score = await forumService.votePost(postId, userId, voteType);

      (res as any).json({
        success: true,
        data: { score },
      });
    } catch (error) {
      logger.error('Failed to vote on post', { error, postId: req.params.postId });
      res.status(500).json({
        success: false,
        error: 'Failed to vote',
      });
    }
  }

  // Edit post
  async editPost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const { content } = req.body;
      const userId = (req as any).user!.id;

      const post = await forumService.editPost(postId, userId, content);

      (res as any).json({
        success: true,
        data: post,
      });
    } catch (error) {
      logger.error('Failed to edit post', { error, postId: req.params.postId });
      res.status((error as Error).message === 'Unauthorized' ? 403 : 500).json({
        success: false,
        error: (error as Error).message || 'Failed to edit post',
      });
    }
  }

  // Delete post
  async deletePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const userId = (req as any).user!.id;
      const isAdmin = (req as any).user!.role === 'admin';

      await forumService.deletePost(postId, userId, isAdmin);

      (res as any).json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete post', { error, postId: req.params.postId });
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete post';
      res.status(errorMessage === 'Unauthorized' ? 403 : 500).json({
        success: false,
        error: errorMessage,
      });
    }
  }

  // Mark post as solution
  async markAsSolution(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const userId = (req as any).user!.id;

      await forumService.markAsSolution(postId, userId);

      (res as any).json({
        success: true,
        message: 'Post marked as solution',
      });
    } catch (error) {
      logger.error('Failed to mark as solution', { error, postId: req.params.postId });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark as solution',
      });
    }
  }
}

export default new ForumController();