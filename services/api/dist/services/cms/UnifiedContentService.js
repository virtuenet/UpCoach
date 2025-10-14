"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContentService = exports.UnifiedContentService = void 0;
const tslib_1 = require("tslib");
const cron = tslib_1.__importStar(require("node-cron"));
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
const cms_1 = require("../../models/cms");
const User_1 = require("../../models/User");
const logger_1 = require("../../utils/logger");
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
const UnifiedEmailService_1 = tslib_1.__importDefault(require("../email/UnifiedEmailService"));
class UnifiedContentService {
    static instance;
    cache = (0, UnifiedCacheService_1.getCacheService)();
    email = UnifiedEmailService_1.default;
    scheduledTasks = new Map();
    constructor() {
        this.initializeScheduler();
    }
    static getInstance() {
        if (!UnifiedContentService.instance) {
            UnifiedContentService.instance = new UnifiedContentService();
        }
        return UnifiedContentService.instance;
    }
    initializeScheduler() {
        cron.schedule('* * * * *', async () => {
            await this.processScheduledContent();
        });
        cron.schedule('0 * * * *', async () => {
            await this.processExpiredContent();
        });
        cron.schedule('*/5 * * * *', async () => {
            await this.updateContentAnalytics();
        });
        logger_1.logger.info('Content scheduler initialized');
    }
    async createContent(data, options = {}) {
        const transaction = await models_1.sequelize.transaction();
        try {
            const content = await cms_1.UnifiedContent.create(data, { transaction });
            if (data.tags?.length) {
                await this.attachTags(content.id, data.tags, transaction);
            }
            if (data.media?.length) {
                await this.attachMedia(content.id, data.media, transaction);
            }
            if (options.validateSEO) {
                const validation = await this.validateContent(content);
                if (!validation.isValid) {
                    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                }
            }
            await transaction.commit();
            if (!options.skipCache) {
                await this.cache.set(`content:${content.id}`, content, { ttl: 3600 });
            }
            if (options.notifyAuthor) {
                await this.notifyAuthor(content, 'created');
            }
            logger_1.logger.info('Content created', { contentId: content.id, type: content.type });
            return content;
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    async getContent(id, options = {}) {
        if (!options.skipCache) {
            const cached = await this.cache.get(`content:${id}`);
            if (cached)
                return cached;
        }
        const include = options.includeRelations
            ? [
                { model: User_1.User, as: 'author' },
                { model: cms_1.UnifiedCategory, as: 'category' },
                { model: cms_1.UnifiedTag, as: 'tags' },
                { model: cms_1.UnifiedMedia, as: 'media' },
            ]
            : [];
        const content = await cms_1.UnifiedContent.findByPk(id, { include });
        if (content && !options.skipCache) {
            await this.cache.set(`content:${id}`, content, { ttl: 3600 });
        }
        return content;
    }
    async updateContent(id, data, userId, options = {}) {
        const transaction = await models_1.sequelize.transaction();
        try {
            const content = await cms_1.UnifiedContent.findByPk(id, { transaction });
            if (!content) {
                throw new Error('Content not found');
            }
            await content.createVersion(userId, 'Updated content');
            await content.update(data, { transaction });
            if (data.tags) {
                await this.updateTags(content.id, data.tags, transaction);
            }
            if (data.media) {
                await this.updateMedia(content.id, data.media, transaction);
            }
            if (options.validateSEO) {
                const validation = await this.validateContent(content);
                if (!validation.isValid) {
                    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                }
            }
            await transaction.commit();
            await this.invalidateContentCache(content.id);
            if (options.notifyAuthor) {
                await this.notifyAuthor(content, 'updated');
            }
            logger_1.logger.info('Content updated', { contentId: content.id });
            return content;
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    async deleteContent(id, userId) {
        const content = await cms_1.UnifiedContent.findByPk(id);
        if (!content) {
            throw new Error('Content not found');
        }
        await content.createVersion(userId, 'Deleted content');
        await content.destroy();
        await this.invalidateContentCache(id);
        logger_1.logger.info('Content deleted', { contentId: id });
        return true;
    }
    async publishContent(id, options = {}) {
        const content = await this.getContent(id, { includeRelations: true });
        if (!content) {
            throw new Error('Content not found');
        }
        if (options.validateSEO) {
            const validation = await this.validateContent(content);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
        }
        await content.publish();
        await this.invalidateContentCache(id);
        if (options.notifyAuthor) {
            await this.notifyAuthor(content, 'published');
        }
        if (options.notifySubscribers) {
            await this.notifySubscribers(content);
        }
        if (options.socialShare) {
            await this.scheduleSocialSharing(content);
        }
        logger_1.logger.info('Content published', { contentId: id, title: content.title });
        return content;
    }
    async schedulePublishing(id, publishDate, options = {}) {
        const content = await this.getContent(id);
        if (!content) {
            throw new Error('Content not found');
        }
        content.scheduledAt = publishDate;
        content.status = 'scheduled';
        await content.save();
        const timeUntilPublish = publishDate.getTime() - Date.now();
        if (timeUntilPublish > 0 && timeUntilPublish < 24 * 60 * 60 * 1000) {
            const timeout = setTimeout(async () => {
                await this.publishContent(id, options);
                this.scheduledTasks.delete(id);
            }, timeUntilPublish);
            this.scheduledTasks.set(id, timeout);
        }
        logger_1.logger.info('Content scheduled', { contentId: id, publishDate });
        return content;
    }
    async processScheduledContent() {
        try {
            const contents = await cms_1.UnifiedContent.getScheduledForPublishing();
            for (const content of contents) {
                try {
                    await this.publishContent(content.id, {
                        notifyAuthor: true,
                        notifySubscribers: true,
                    });
                }
                catch (error) {
                    logger_1.logger.error('Failed to publish scheduled content', {
                        contentId: content.id,
                        error: error.message,
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to process scheduled content', error);
        }
    }
    async processExpiredContent() {
        try {
            const contents = await cms_1.UnifiedContent.getExpired();
            for (const content of contents) {
                content.status = 'expired';
                await content.save();
                await this.invalidateContentCache(content.id);
            }
            if (contents.length > 0) {
                logger_1.logger.info(`Expired ${contents.length} content items`);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to process expired content', error);
        }
    }
    async searchContent(filter = {}, pagination = {}) {
        const { page = 1, limit = 20, sort = 'createdAt', order = 'DESC' } = pagination;
        const offset = (page - 1) * limit;
        const where = {};
        if (filter.type) {
            where.type = Array.isArray(filter.type) ? { [sequelize_1.Op.in]: filter.type } : filter.type;
        }
        if (filter.status) {
            where.status = Array.isArray(filter.status)
                ? { [sequelize_1.Op.in]: filter.status }
                : filter.status;
        }
        if (filter.authorId)
            where.authorId = filter.authorId;
        if (filter.categoryId)
            where.categoryId = filter.categoryId;
        if (filter.isPremium !== undefined)
            where.isPremium = filter.isPremium;
        if (filter.isPrivate !== undefined)
            where.isPrivate = filter.isPrivate;
        if (filter.search) {
            where[sequelize_1.Op.or] = [
                { title: { [sequelize_1.Op.iLike]: `%${filter.search}%` } },
                { content: { [sequelize_1.Op.iLike]: `%${filter.search}%` } },
                { excerpt: { [sequelize_1.Op.iLike]: `%${filter.search}%` } },
            ];
        }
        if (filter.dateFrom || filter.dateTo) {
            where.publishedAt = {};
            if (filter.dateFrom)
                where.publishedAt[sequelize_1.Op.gte] = filter.dateFrom;
            if (filter.dateTo)
                where.publishedAt[sequelize_1.Op.lte] = filter.dateTo;
        }
        const { count, rows } = await cms_1.UnifiedContent.findAndCountAll({
            where,
            include: [
                { model: User_1.User, as: 'author', attributes: ['id', 'name', 'email'] },
                { model: cms_1.UnifiedCategory, as: 'category', attributes: ['id', 'name', 'slug'] },
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
    async getPopularContent(type, limit = 10) {
        const cacheKey = `content:popular:${type || 'all'}:${limit}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        const content = await cms_1.UnifiedContent.getPopular(limit, type);
        await this.cache.set(cacheKey, content, { ttl: 600 });
        return content;
    }
    async getRelatedContent(contentId, limit = 5) {
        const content = await this.getContent(contentId, { includeRelations: true });
        if (!content)
            return [];
        const related = await cms_1.UnifiedContent.findAll({
            where: {
                id: { [sequelize_1.Op.ne]: contentId },
                status: 'published',
                [sequelize_1.Op.or]: [{ categoryId: content.categoryId }, { type: content.type }],
            },
            order: [['viewCount', 'DESC']],
            limit,
        });
        return related;
    }
    async trackInteraction(contentId, userId, type, data) {
        try {
            await cms_1.UnifiedInteraction.create({
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
            const content = await cms_1.UnifiedContent.findByPk(contentId);
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
            await this.invalidateContentCache(contentId);
        }
        catch (error) {
            logger_1.logger.error('Failed to track interaction', { contentId, userId, type, error });
        }
    }
    async getContentAnalytics(contentId, dateFrom, dateTo) {
        const where = { contentId };
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt[sequelize_1.Op.gte] = dateFrom;
            if (dateTo)
                where.createdAt[sequelize_1.Op.lte] = dateTo;
        }
        const interactions = await cms_1.UnifiedInteraction.findAll({ where });
        const views = interactions.filter(i => i.type === 'view');
        const uniqueViews = new Set(views.map(v => v.userId)).size;
        const likes = interactions.filter(i => i.type === 'like').length;
        const shares = interactions.filter(i => i.type === 'share').length;
        const comments = interactions.filter(i => i.type === 'comment').length;
        const viewsWithDuration = views.filter(v => v.metadata?.duration);
        const avgReadTime = viewsWithDuration.length > 0
            ? viewsWithDuration.reduce((sum, v) => sum + (v.metadata?.duration || 0), 0) /
                viewsWithDuration.length
            : 0;
        const content = await cms_1.UnifiedContent.findByPk(contentId);
        const estimatedReadTime = content?.readingTime || 5;
        const completedViews = viewsWithDuration.filter(v => (v.metadata?.duration || 0) > estimatedReadTime * 60 * 0.8).length;
        const completionRate = viewsWithDuration.length > 0 ? (completedViews / viewsWithDuration.length) * 100 : 0;
        const engagementRate = views.length > 0 ? ((likes + shares + comments) / views.length) * 100 : 0;
        return {
            views: views.length,
            uniqueViews,
            avgReadTime: Math.round(avgReadTime / 60),
            completionRate: Math.round(completionRate),
            engagementRate: Math.round(engagementRate),
            shares,
            comments,
            likes,
        };
    }
    async updateContentAnalytics() {
        try {
            const contents = await cms_1.UnifiedContent.findAll({
                where: {
                    status: 'published',
                    updatedAt: {
                        [sequelize_1.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                },
                limit: 100,
            });
            for (const content of contents) {
                const analytics = await this.getContentAnalytics(content.id);
                content.completionRate = analytics.completionRate;
                await content.save();
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to update content analytics', error);
        }
    }
    async validateContent(content) {
        const errors = [];
        const warnings = [];
        let seoScore = 100;
        let readabilityScore = 100;
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
        if (!content.metaTitle) {
            warnings.push('Meta title is missing');
            seoScore -= 10;
        }
        else if (content.metaTitle.length > 60) {
            warnings.push('Meta title is too long (>60 characters)');
            seoScore -= 5;
        }
        if (!content.metaDescription) {
            warnings.push('Meta description is missing');
            seoScore -= 10;
        }
        else if (content.metaDescription.length > 160) {
            warnings.push('Meta description is too long (>160 characters)');
            seoScore -= 5;
        }
        if (!content.metaKeywords || content.metaKeywords.length === 0) {
            warnings.push('Keywords help with SEO');
            seoScore -= 5;
        }
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
    async attachTags(contentId, tagIds, transaction) {
        const content = await cms_1.UnifiedContent.findByPk(contentId, { transaction });
        if (!content)
            return;
        const tags = await cms_1.UnifiedTag.findAll({
            where: { id: { [sequelize_1.Op.in]: tagIds } },
            transaction,
        });
        await content.setTags(tags);
        for (const tag of tags) {
            tag.usageCount += 1;
            await tag.save({ transaction });
        }
    }
    async updateTags(contentId, tagIds, transaction) {
        const content = await cms_1.UnifiedContent.findByPk(contentId, {
            include: [{ model: cms_1.UnifiedTag, as: 'tags' }],
            transaction,
        });
        if (!content)
            return;
        const currentTags = content.tags || [];
        const tagsToRemove = currentTags.filter(t => !tagIds.includes(t.id));
        for (const tag of tagsToRemove) {
            tag.usageCount = Math.max(0, tag.usageCount - 1);
            await tag.save({ transaction });
        }
        await this.attachTags(contentId, tagIds, transaction);
    }
    async attachMedia(contentId, mediaIds, transaction) {
        await cms_1.UnifiedMedia.update({ contentId }, {
            where: { id: { [sequelize_1.Op.in]: mediaIds } },
            transaction,
        });
    }
    async updateMedia(contentId, mediaIds, transaction) {
        await cms_1.UnifiedMedia.update({ contentId: null }, {
            where: { contentId },
            transaction,
        });
        await this.attachMedia(contentId, mediaIds, transaction);
    }
    async invalidateContentCache(contentId) {
        await this.cache.del(`content:${contentId}`);
        await this.cache.invalidate('content:popular:*');
        await this.cache.invalidate('content:featured:*');
    }
    async notifyAuthor(content, action, message) {
        try {
            const author = await User_1.User.findByPk(content.authorId);
            if (!author)
                return;
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
        }
        catch (error) {
            logger_1.logger.error('Failed to notify author', { error, contentId: content.id });
        }
    }
    async notifySubscribers(content) {
        try {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to notify subscribers', { error, contentId: content.id });
        }
    }
    async getSubscribers(categoryId) {
        const where = {
            emailVerified: true,
            status: 'active',
        };
        if (categoryId) {
        }
        return User_1.User.findAll({ where, limit: 100 });
    }
    async scheduleSocialSharing(content) {
        logger_1.logger.info('Social sharing scheduled', {
            contentId: content.id,
            title: content.title,
        });
    }
}
exports.UnifiedContentService = UnifiedContentService;
const getContentService = () => UnifiedContentService.getInstance();
exports.getContentService = getContentService;
exports.default = UnifiedContentService;
