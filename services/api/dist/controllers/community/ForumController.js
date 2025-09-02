"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForumController = void 0;
const ForumService_1 = require("../../services/community/ForumService");
const logger_1 = require("../../utils/logger");
const express_validator_1 = require("express-validator");
class ForumController {
    // Get all forum categories
    async getCategories(req, res) {
        try {
            const categories = await ForumService_1.forumService.getCategories();
            res.json({
                success: true,
                data: categories,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get forum categories', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to get categories',
            });
        }
    }
    // Get threads
    async getThreads(req, _res) {
        try {
            const { categoryId, tags, userId, query, page = '1', limit = '20', sortBy = 'latest', } = req.query;
            const result = await ForumService_1.forumService.getThreads({
                categoryId: categoryId,
                tags: tags ? tags.split(',') : undefined,
                userId: userId,
                query: query,
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy: sortBy,
            });
            _res.json({
                success: true,
                data: result.threads,
                pagination: {
                    total: result.total,
                    pages: result.pages,
                    page: parseInt(page),
                    limit: parseInt(limit),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get threads', { error });
            _res.status(500).json({
                success: false,
                error: 'Failed to get threads',
            });
        }
    }
    // Get thread details
    async getThread(req, _res) {
        try {
            const { threadId } = req.params;
            const userId = req.user?.id;
            const thread = await ForumService_1.forumService.getThread(threadId, userId);
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get thread', { error, threadId: req.params.threadId });
            _res.status(500).json({
                success: false,
                error: 'Failed to get thread',
            });
        }
    }
    // Create new thread
    async createThread(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return _res.status(400).json({
                    success: false,
                    errors: errors.array(),
                });
            }
            const { categoryId, title, content, tags } = req.body;
            const userId = req.user.id;
            const thread = await ForumService_1.forumService.createThread({
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
        }
        catch (error) {
            logger_1.logger.error('Failed to create thread', { error, userId: req.user.id });
            _res.status(500).json({
                success: false,
                error: 'Failed to create thread',
            });
        }
    }
    // Create post/reply
    async createPost(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return _res.status(400).json({
                    success: false,
                    errors: errors.array(),
                });
            }
            const { threadId, content, parentId } = req.body;
            const userId = req.user.id;
            const post = await ForumService_1.forumService.createPost({
                threadId,
                userId,
                content,
                parentId,
            });
            _res.status(201).json({
                success: true,
                data: post,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create post', { error, userId: req.user.id });
            _res.status(500).json({
                success: false,
                error: error.message || 'Failed to create post',
            });
        }
    }
    // Vote on post
    async votePost(req, _res) {
        try {
            const { postId } = req.params;
            const { voteType } = req.body;
            const userId = req.user.id;
            if (![1, -1].includes(voteType)) {
                return _res.status(400).json({
                    success: false,
                    error: 'Invalid vote type',
                });
            }
            const score = await ForumService_1.forumService.votePost(postId, userId, voteType);
            _res.json({
                success: true,
                data: { score },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to vote on post', { error, postId: req.params.postId });
            _res.status(500).json({
                success: false,
                error: 'Failed to vote',
            });
        }
    }
    // Edit post
    async editPost(req, _res) {
        try {
            const { postId } = req.params;
            const { content } = req.body;
            const userId = req.user.id;
            const post = await ForumService_1.forumService.editPost(postId, userId, content);
            _res.json({
                success: true,
                data: post,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to edit post', { error, postId: req.params.postId });
            _res.status(error.message === 'Unauthorized' ? 403 : 500).json({
                success: false,
                error: error.message || 'Failed to edit post',
            });
        }
    }
    // Delete post
    async deletePost(req, _res) {
        try {
            const { postId } = req.params;
            const userId = req.user.id;
            const isAdmin = req.user.role === 'admin';
            await ForumService_1.forumService.deletePost(postId, userId, isAdmin);
            _res.json({
                success: true,
                message: 'Post deleted successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete post', { error, postId: req.params.postId });
            const errorMessage = error?.message || 'Failed to delete post';
            _res.status(errorMessage === 'Unauthorized' ? 403 : 500).json({
                success: false,
                error: errorMessage,
            });
        }
    }
    // Mark post as solution
    async markAsSolution(req, _res) {
        try {
            const { postId } = req.params;
            const userId = req.user.id;
            await ForumService_1.forumService.markAsSolution(postId, userId);
            _res.json({
                success: true,
                message: 'Post marked as solution',
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to mark as solution', { error, postId: req.params.postId });
            _res.status(500).json({
                success: false,
                error: error?.message || 'Failed to mark as solution',
            });
        }
    }
}
exports.ForumController = ForumController;
exports.default = new ForumController();
//# sourceMappingURL=ForumController.js.map