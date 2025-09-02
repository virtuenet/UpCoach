"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forumService = exports.ForumService = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
const ForumCategory_1 = __importDefault(require("../../models/community/ForumCategory"));
const ForumThread_1 = __importDefault(require("../../models/community/ForumThread"));
const ForumPost_1 = __importDefault(require("../../models/community/ForumPost"));
const ForumVote_1 = __importDefault(require("../../models/community/ForumVote"));
const User_1 = require("../../models/User");
const logger_1 = require("../../utils/logger");
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
// import DOMPurify from 'isomorphic-dompurify';
// import { marked } from 'marked';
// Initialize forum models
const ForumCategory = (0, ForumCategory_1.default)(database_1.sequelize);
const ForumThread = (0, ForumThread_1.default)(database_1.sequelize);
const ForumPost = (0, ForumPost_1.default)(database_1.sequelize);
const ForumVote = (0, ForumVote_1.default)(database_1.sequelize);
class ForumService {
    // Get all forum categories
    async getCategories() {
        const cacheKey = 'forum:categories';
        const cached = await (0, UnifiedCacheService_1.getCacheService)().get(cacheKey);
        if (cached) {
            return cached;
        }
        const categories = await ForumCategory.findAll({
            where: { isActive: true },
            order: [['orderIndex', 'ASC']],
            attributes: ['id', 'name', 'description', 'slug', 'icon', 'color'],
        });
        await (0, UnifiedCacheService_1.getCacheService)().set(cacheKey, categories, { ttl: 3600 }); // Cache for 1 hour
        return categories;
    }
    // Create a new thread
    async createThread(data) {
        const transaction = await database_1.sequelize.transaction();
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
            await (0, UnifiedCacheService_1.getCacheService)().del(`forum:threads:${data.categoryId}:*`);
            // Track activity
            await this.trackActivity(data.userId, 'thread_created', 'thread', thread.id);
            return thread;
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('Failed to create thread', { error, data });
            throw error;
        }
    }
    // Get threads with pagination
    async getThreads(params) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const offset = (page - 1) * limit;
        const where = {};
        const order = [];
        // Filter by category
        if (params.categoryId) {
            where.categoryId = params.categoryId;
        }
        // Filter by tags
        if (params.tags && params.tags.length > 0) {
            where.tags = { [sequelize_1.Op.overlap]: params.tags };
        }
        // Filter by user
        if (params.userId) {
            where.userId = params.userId;
        }
        // Search query
        if (params.query) {
            where[sequelize_1.Op.or] = [
                { title: { [sequelize_1.Op.iLike]: `%${params.query}%` } },
                { content: { [sequelize_1.Op.iLike]: `%${params.query}%` } },
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
                    model: User_1.User,
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
    async getThread(threadId, userId) {
        const thread = await ForumThread.findByPk(threadId, {
            include: [
                {
                    model: User_1.User,
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
                            model: User_1.User,
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
            thread.posts.forEach((post) => {
                const votes = post.votes || [];
                post.voteScore = votes.reduce((sum, vote) => sum + vote.voteType, 0);
                // Add user vote if userId provided
                if (userId) {
                    const userVote = votes.find((v) => v.userId === userId);
                    post.userVote = userVote ? userVote.voteType : 0;
                }
            });
        }
        return thread;
    }
    // Create a reply
    async createPost(data) {
        const transaction = await database_1.sequelize.transaction();
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
                        model: User_1.User,
                        as: 'user',
                        attributes: ['id', 'name', 'avatar', 'reputation_points'],
                    },
                ],
            });
            // Track activity
            await this.trackActivity(data.userId, 'post_created', 'post', post.id);
            // Send notifications
            await this.notifyThreadParticipants(data.threadId, data.userId, post.id);
            return fullPost;
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('Failed to create post', { error, data });
            throw error;
        }
    }
    // Vote on a post
    async votePost(postId, userId, voteType) {
        const transaction = await database_1.sequelize.transaction();
        try {
            // Check if vote exists
            const existingVote = await ForumVote.findOne({
                where: { postId, userId },
            });
            if (existingVote) {
                if (existingVote.voteType === voteType) {
                    // Remove vote if same type
                    await existingVote.destroy({ transaction });
                }
                else {
                    // Update vote type
                    existingVote.voteType = voteType;
                    await existingVote.save({ transaction });
                }
            }
            else {
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
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('Failed to vote on post', { error, postId, userId });
            throw error;
        }
    }
    // Edit a post
    async editPost(postId, userId, content) {
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
    async deletePost(postId, userId, isAdmin = false) {
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
    async markAsSolution(postId, userId) {
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
    sanitizeContent(content) {
        // TODO: Implement proper sanitization
        // For now, just do basic cleaning
        return content
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
            .trim();
    }
    async trackActivity(userId, type, targetType, targetId) {
        try {
            await database_1.sequelize.query(`INSERT INTO activities (user_id, activity_type, target_type, target_id, created_at)
         VALUES (:userId, :type, :targetType, :targetId, NOW())`, {
                replacements: { userId, type, targetType, targetId },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to track activity', { error, userId, type });
        }
    }
    async updateUserReputation(userId, points) {
        try {
            await database_1.sequelize.query(`UPDATE users SET reputation_points = reputation_points + :points WHERE id = :userId`, {
                replacements: { userId, points },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update user reputation', { error, userId, points });
        }
    }
    async notifyThreadParticipants(threadId, authorId, postId) {
        try {
            // Get all unique participants in thread
            const participants = await database_1.sequelize.query(`SELECT DISTINCT user_id FROM forum_posts 
         WHERE thread_id = :threadId 
         AND user_id != :authorId 
         AND is_deleted = false`, {
                replacements: { threadId, authorId },
                type: 'SELECT',
            });
            // Create notifications for each participant
            const notifications = participants.map((p) => ({
                user_id: p.user_id,
                type: 'forum_reply',
                title: 'New reply in thread',
                message: 'Someone replied to a thread you participated in',
                data: { threadId, postId },
                created_at: new Date(),
            }));
            if (notifications.length > 0) {
                await database_1.sequelize.query(`INSERT INTO notifications (user_id, type, title, message, data, created_at)
           VALUES ${notifications.map(() => '(?, ?, ?, ?, ?, ?)').join(', ')}`, {
                    replacements: notifications.flatMap(n => [
                        n.user_id,
                        n.type,
                        n.title,
                        n.message,
                        JSON.stringify(n.data),
                        n.created_at,
                    ]),
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to notify thread participants', { error, threadId });
        }
    }
}
exports.ForumService = ForumService;
exports.forumService = new ForumService();
//# sourceMappingURL=ForumService.js.map