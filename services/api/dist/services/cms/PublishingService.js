"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishingService = void 0;
const tslib_1 = require("tslib");
const cron = tslib_1.__importStar(require("node-cron"));
const sequelize_1 = require("sequelize");
const ContentArticle_1 = require("../../models/cms/ContentArticle");
const ContentCategory_1 = require("../../models/cms/ContentCategory");
const ContentSchedule_1 = tslib_1.__importDefault(require("../../models/cms/ContentSchedule"));
const ContentVersion_1 = tslib_1.__importDefault(require("../../models/cms/ContentVersion"));
const User_1 = require("../../models/User");
const logger_1 = require("../../utils/logger");
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
const UnifiedEmailService_1 = tslib_1.__importDefault(require("../email/UnifiedEmailService"));
class PublishingService {
    publishingQueue = new Map();
    constructor() {
        this.initializeScheduler();
    }
    initializeScheduler() {
        cron.schedule('* * * * *', async () => {
            await this.processScheduledContent();
        });
        logger_1.logger.info('Publishing scheduler initialized');
    }
    async processScheduledContent() {
        try {
            const now = new Date();
            const schedules = await ContentSchedule_1.default.findAll({
                where: {
                    scheduledFor: { [sequelize_1.Op.lte]: now },
                    status: 'pending',
                },
                include: [{ model: ContentArticle_1.ContentArticle, as: 'article' }],
            });
            for (const schedule of schedules) {
                try {
                    await this.executeScheduledAction(schedule);
                    schedule.status = 'completed';
                    schedule.processedAt = new Date();
                    await schedule.save();
                }
                catch (error) {
                    logger_1.logger.error('Failed to process scheduled content', {
                        scheduleId: schedule.id,
                        error: error.message,
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to process scheduled content', error);
        }
    }
    async executeScheduledAction(schedule) {
        const article = await ContentArticle_1.ContentArticle.findByPk(schedule.contentId);
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
                logger_1.logger.warn(`Unknown scheduled action: ${action}`);
        }
    }
    async publishArticle(articleId, options = {}) {
        const article = await ContentArticle_1.ContentArticle.findByPk(articleId, {
            include: [
                { model: User_1.User, as: 'author' },
                { model: ContentCategory_1.ContentCategory, as: 'category' },
            ],
        });
        if (!article) {
            throw new Error('Article not found');
        }
        if (options.validateSEO) {
            const validation = await this.validateArticle(article);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
        }
        article.status = 'published';
        article.publishDate = article.publishDate || new Date();
        article.publishDate = new Date();
        await article.save();
        await article.createVersion(article.authorId, 'Published');
        await this.invalidateArticleCache(articleId);
        if (options.notifyAuthor) {
            await this.notifyAuthor(article);
        }
        if (options.notifySubscribers) {
            await this.notifySubscribers(article);
        }
        if (options.socialShare) {
            await this.scheduleSocialSharing(article);
        }
        logger_1.logger.info('Article published', {
            articleId: article.id,
            title: article.title,
        });
        return article;
    }
    async unpublishArticle(articleId) {
        const article = await ContentArticle_1.ContentArticle.findByPk(articleId);
        if (!article) {
            throw new Error('Article not found');
        }
        article.status = 'draft';
        await article.save();
        await article.createVersion(article.authorId, 'Unpublished');
        await this.invalidateArticleCache(articleId);
        logger_1.logger.info('Article unpublished', {
            articleId: article.id,
            title: article.title,
        });
        return article;
    }
    async schedulePublishing(articleId, publishDate, userId, options = {}) {
        await this.cancelSchedule(articleId);
        const schedule = await ContentSchedule_1.default.create({
            contentId: articleId,
            scheduledFor: publishDate,
            scheduleType: 'publish',
            metadata: options,
            createdBy: userId,
        });
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
    async cancelSchedule(articleId) {
        const timeout = this.publishingQueue.get(articleId);
        if (timeout) {
            clearTimeout(timeout);
            this.publishingQueue.delete(articleId);
        }
        await ContentSchedule_1.default.update({ status: 'cancelled', processedAt: new Date() }, {
            where: {
                contentId: articleId,
                status: 'pending',
            },
        });
    }
    async validateArticle(article) {
        const errors = [];
        const warnings = [];
        let seoScore = 100;
        if (!article.title || article.title.length < 10) {
            errors.push('Title must be at least 10 characters long');
            seoScore -= 20;
        }
        const contentBody = typeof article.content === 'string' ? article.content : article.content?.body;
        if (!contentBody || contentBody.length < 100) {
            errors.push('Content must be at least 100 characters long');
            seoScore -= 30;
        }
        if (!article.summary || article.summary.length < 50) {
            warnings.push('Summary should be at least 50 characters long');
            seoScore -= 10;
        }
        if (!article.seoTitle) {
            warnings.push('SEO title is missing');
            seoScore -= 10;
        }
        else if (article.seoTitle.length > 60) {
            warnings.push('SEO title is too long (>60 characters)');
            seoScore -= 5;
        }
        if (!article.seoDescription) {
            warnings.push('SEO description is missing');
            seoScore -= 10;
        }
        else if (article.seoDescription.length > 160) {
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
    async submitForReview(articleId, reviewerId) {
        const article = await ContentArticle_1.ContentArticle.findByPk(articleId, {
            include: [{ model: User_1.User, as: 'author' }],
        });
        if (!article) {
            throw new Error('Article not found');
        }
        article.status = 'review';
        await article.save();
        if (reviewerId) {
            const reviewer = await User_1.User.findByPk(reviewerId);
            if (reviewer) {
                await UnifiedEmailService_1.default.send({
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
    async approveArticle(articleId, reviewerId, comments) {
        const article = await ContentArticle_1.ContentArticle.findByPk(articleId);
        if (!article) {
            throw new Error('Article not found');
        }
        if (article.status !== 'review') {
            throw new Error('Article is not under review');
        }
        await article.createVersion(reviewerId, `Approved${comments ? `: ${comments}` : ''}`);
        article.status = 'published';
        article.publishDate = new Date();
        article.publishDate = new Date();
        await article.save();
        await this.notifyAuthor(article, 'approved', comments);
        return article;
    }
    async rejectArticle(articleId, reviewerId, reason) {
        const article = await ContentArticle_1.ContentArticle.findByPk(articleId);
        if (!article) {
            throw new Error('Article not found');
        }
        if (article.status !== 'review') {
            throw new Error('Article is not under review');
        }
        await article.createVersion(reviewerId, `Rejected: ${reason}`);
        article.status = 'draft';
        await article.save();
        await this.notifyAuthor(article, 'rejected', reason);
        return article;
    }
    async notifyAuthor(article, action = 'published', message) {
        const author = await User_1.User.findByPk(article.authorId);
        if (!author)
            return;
        const templates = {
            published: 'article-published',
            approved: 'article-approved',
            rejected: 'article-rejected',
        };
        await UnifiedEmailService_1.default.send({
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
    async notifySubscribers(article) {
        const { User } = require('../../models/User');
        const subscribers = await User.findAll({
            where: { emailVerified: true },
            limit: 100,
        });
        for (const subscriber of subscribers) {
            await UnifiedEmailService_1.default.send({
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
    async scheduleSocialSharing(article) {
        logger_1.logger.info('Social sharing scheduled', { articleId: article.id });
    }
    async getSubscribers(categoryId) {
        const where = {
            contentSubscription: true,
            status: 'active',
        };
        if (categoryId) {
            where.preferences = {
                categories: {
                    [sequelize_1.Op.contains]: [categoryId],
                },
            };
        }
        return User_1.User.findAll({ where, limit: 1000 });
    }
    async invalidateArticleCache(articleId) {
        await (0, UnifiedCacheService_1.getCacheService)().del(`cms:article:${articleId}`);
        await (0, UnifiedCacheService_1.getCacheService)().invalidate('cms:articles:*');
    }
    async trackPublishingMetrics(articleId) {
        const metrics = {
            articleId,
            publishDate: new Date(),
            timeToPublish: 0,
            revisions: await ContentVersion_1.default.count({ where: { contentId: articleId } }),
        };
        logger_1.logger.info('Publishing metrics', metrics);
    }
}
exports.PublishingService = PublishingService;
