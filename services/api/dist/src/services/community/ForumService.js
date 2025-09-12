"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forumService = exports.ForumService = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
const ForumCategory_1 = __importDefault(require("../../models/community/ForumCategory"));
const ForumPost_1 = __importDefault(require("../../models/community/ForumPost"));
const ForumThread_1 = __importDefault(require("../../models/community/ForumThread"));
const ForumVote_1 = __importDefault(require("../../models/community/ForumVote"));
const User_1 = require("../../models/User");
const logger_1 = require("../../utils/logger");
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
const ForumCategory = (0, ForumCategory_1.default)(database_1.sequelize);
const ForumThread = (0, ForumThread_1.default)(database_1.sequelize);
const ForumPost = (0, ForumPost_1.default)(database_1.sequelize);
const ForumVote = (0, ForumVote_1.default)(database_1.sequelize);
class ForumService {
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
        await (0, UnifiedCacheService_1.getCacheService)().set(cacheKey, categories, { ttl: 3600 });
        return categories;
    }
    async createThread(data) {
        const transaction = await database_1.sequelize.transaction();
        try {
            const category = await ForumCategory.findByPk(data.categoryId);
            if (!category || !category.isActive) {
                throw new Error('Invalid category');
            }
            const sanitizedContent = this.sanitizeContent(data.content);
            const thread = await ForumThread.create({
                categoryId: data.categoryId,
                userId: data.userId,
                title: data.title.trim(),
                content: sanitizedContent,
                tags: data.tags || [],
            }, { transaction });
            await ForumPost.create({
                threadId: thread.id,
                userId: data.userId,
                content: sanitizedContent,
            }, { transaction });
            await transaction.commit();
            await (0, UnifiedCacheService_1.getCacheService)().del(`forum:threads:${data.categoryId}:*`);
            await this.trackActivity(data.userId, 'thread_created', 'thread', thread.id);
            return thread;
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('Failed to create thread', { error, data });
            throw error;
        }
    }
    async getThreads(params) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const offset = (page - 1) * limit;
        const where = {};
        const order = [];
        if (params.categoryId) {
            where.categoryId = params.categoryId;
        }
        if (params.tags && params.tags.length > 0) {
            where.tags = { [sequelize_1.Op.overlap]: params.tags };
        }
        if (params.userId) {
            where.userId = params.userId;
        }
        if (params.query) {
            where[sequelize_1.Op.or] = [
                { title: { [sequelize_1.Op.iLike]: `%${params.query}%` } },
                { content: { [sequelize_1.Op.iLike]: `%${params.query}%` } },
            ];
        }
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
        await thread.incrementViews();
        if (thread.posts) {
            thread.posts.forEach((post) => {
                const votes = post.votes || [];
                post.voteScore = votes.reduce((sum, vote) => sum + vote.voteType, 0);
                if (userId) {
                    const userVote = votes.find((v) => v.userId === userId);
                    post.userVote = userVote ? userVote.voteType : 0;
                }
            });
        }
        return thread;
    }
    async createPost(data) {
        const transaction = await database_1.sequelize.transaction();
        try {
            const thread = await ForumThread.findByPk(data.threadId);
            if (!thread) {
                throw new Error('Thread not found');
            }
            if (thread.isLocked) {
                throw new Error('Thread is locked');
            }
            if (data.parentId) {
                const parentPost = await ForumPost.findByPk(data.parentId);
                if (!parentPost || parentPost.threadId !== data.threadId) {
                    throw new Error('Invalid parent post');
                }
            }
            const sanitizedContent = this.sanitizeContent(data.content);
            const post = await ForumPost.create({
                threadId: data.threadId,
                userId: data.userId,
                parentId: data.parentId,
                content: sanitizedContent,
            }, { transaction });
            await transaction.commit();
            const fullPost = await ForumPost.findByPk(post.id, {
                include: [
                    {
                        model: User_1.User,
                        as: 'user',
                        attributes: ['id', 'name', 'avatar', 'reputation_points'],
                    },
                ],
            });
            await this.trackActivity(data.userId, 'post_created', 'post', post.id);
            await this.notifyThreadParticipants(data.threadId, data.userId, post.id);
            return fullPost;
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('Failed to create post', { error, data });
            throw error;
        }
    }
    async votePost(postId, userId, voteType) {
        const transaction = await database_1.sequelize.transaction();
        try {
            const existingVote = await ForumVote.findOne({
                where: { postId, userId },
            });
            if (existingVote) {
                if (existingVote.voteType === voteType) {
                    await existingVote.destroy({ transaction });
                }
                else {
                    existingVote.voteType = voteType;
                    await existingVote.save({ transaction });
                }
            }
            else {
                await ForumVote.create({
                    postId,
                    userId,
                    voteType,
                }, { transaction });
            }
            const votes = await ForumVote.findAll({
                where: { postId },
                attributes: ['voteType'],
                transaction,
            });
            const score = votes.reduce((sum, vote) => sum + vote.voteType, 0);
            await transaction.commit();
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
        const sanitizedContent = this.sanitizeContent(content);
        post.content = sanitizedContent;
        post.editCount += 1;
        post.lastEditedAt = new Date();
        await post.save();
        return post;
    }
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
        if (post.thread.userId !== userId) {
            throw new Error('Only thread author can mark solution');
        }
        await ForumPost.update({ isSolution: false }, { where: { threadId: post.threadId } });
        post.isSolution = true;
        await post.save();
        await this.updateUserReputation(post.userId, 50);
    }
    sanitizeContent(content) {
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
            const participants = await database_1.sequelize.query(`SELECT DISTINCT user_id FROM forum_posts 
         WHERE thread_id = :threadId 
         AND user_id != :authorId 
         AND is_deleted = false`, {
                replacements: { threadId, authorId },
                type: 'SELECT',
            });
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