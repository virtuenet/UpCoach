import { Request, Response } from 'express';
import { validationResult } from 'express-validator';

import { forumService } from '../../services/community/ForumService';
import { logger } from '../../utils/logger';

export class ForumController {
  // Get all forum categories
  async getCategories(req: Request, res: Response) {
    try {
      const categories = await forumService.getCategories();

      res.json({
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
  async getThreads(req: Request, _res: Response) {
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

      _res.json({
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
      _res.status(500).json({
        success: false,
        error: 'Failed to get threads',
      });
    }
  }

  // Get thread details
  async getThread(req: Request, _res: Response) {
    try {
      const { threadId } = req.params;
      const userId = req.user?.id;

      const thread = await forumService.getThread(threadId, userId);

      if (!thread) {
        return _res.status(404).json({
          success: false,
          error: 'Thread not found',
        });
      }

      _res.json({
        success: true,
        data: thread,
      });
    } catch (error) {
      logger.error('Failed to get thread', { error, threadId: req.params.threadId });
      _res.status(500).json({
        success: false,
        error: 'Failed to get thread',
      });
    }
  }

  // Create new thread
  async createThread(req: Request, _res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return _res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { categoryId, title, content, tags } = req.body;
      const userId = req.user!.id;

      const thread = await forumService.createThread({
        categoryId,
        userId,
        title,
        content,
        tags,
      });

      _res.status(201).json({
        success: true,
        data: thread,
      });
    } catch (error) {
      logger.error('Failed to create thread', { error, userId: req.user!.id });
      _res.status(500).json({
        success: false,
        error: 'Failed to create thread',
      });
    }
  }

  // Create post/reply
  async createPost(req: Request, _res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return _res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { threadId, content, parentId } = req.body;
      const userId = req.user!.id;

      const post = await forumService.createPost({
        threadId,
        userId,
        content,
        parentId,
      });

      _res.status(201).json({
        success: true,
        data: post,
      });
    } catch (error) {
      logger.error('Failed to create post', { error, userId: req.user!.id });
      _res.status(500).json({
        success: false,
        error: (error as Error).message || 'Failed to create post',
      });
    }
  }

  // Vote on post
  async votePost(req: Request, _res: Response) {
    try {
      const { postId } = req.params;
      const { voteType } = req.body;
      const userId = req.user!.id;

      if (![1, -1].includes(voteType)) {
        return _res.status(400).json({
          success: false,
          error: 'Invalid vote type',
        });
      }

      const score = await forumService.votePost(postId, userId, voteType);

      _res.json({
        success: true,
        data: { score },
      });
    } catch (error) {
      logger.error('Failed to vote on post', { error, postId: req.params.postId });
      _res.status(500).json({
        success: false,
        error: 'Failed to vote',
      });
    }
  }

  // Edit post
  async editPost(req: Request, _res: Response) {
    try {
      const { postId } = req.params;
      const { content } = req.body;
      const userId = req.user!.id;

      const post = await forumService.editPost(postId, userId, content);

      _res.json({
        success: true,
        data: post,
      });
    } catch (error) {
      logger.error('Failed to edit post', { error, postId: req.params.postId });
      _res.status((error as Error).message === 'Unauthorized' ? 403 : 500).json({
        success: false,
        error: (error as Error).message || 'Failed to edit post',
      });
    }
  }

  // Delete post
  async deletePost(req: Request, _res: Response) {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'admin';

      await forumService.deletePost(postId, userId, isAdmin);

      _res.json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete post', { error, postId: req.params.postId });
      const errorMessage = (error as Error)?.message || 'Failed to delete post';
      _res.status(errorMessage === 'Unauthorized' ? 403 : 500).json({
        success: false,
        error: errorMessage,
      });
    }
  }

  // Mark post as solution
  async markAsSolution(req: Request, _res: Response) {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;

      await forumService.markAsSolution(postId, userId);

      _res.json({
        success: true,
        message: 'Post marked as solution',
      });
    } catch (error) {
      logger.error('Failed to mark as solution', { error, postId: req.params.postId });
      _res.status(500).json({
        success: false,
        error: (error as Error)?.message || 'Failed to mark as solution',
      });
    }
  }
}

export default new ForumController();
