"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishingService = void 0;
const sequelize_1 = require("sequelize");
const ContentArticle_1 = require("../../models/cms/ContentArticle");
const ContentCategory_1 = require("../../models/cms/ContentCategory");
const ContentSchedule_1 = __importDefault(require("../../models/cms/ContentSchedule"));
const ContentVersion_1 = __importDefault(require("../../models/cms/ContentVersion"));
const User_1 = require("../../models/User");
const logger_1 = require("../../utils/logger");
const UnifiedEmailService_1 = __importDefault(require("../email/UnifiedEmailService"));
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
const node_cron_1 = __importDefault(require("node-cron"));
class PublishingService {
    publishingQueue = new Map();
    constructor() {
        this.initializeScheduler();
    }
    // Initialize cron job for scheduled publishing
    initializeScheduler() {
        // Run every minute to check for scheduled content
        node_cron_1.default.schedule('* * * * *', async () => {
            await this.processScheduledContent();
        });
        logger_1.logger.info('Publishing scheduler initialized');
    }
    // Process scheduled content
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
                    // Mark as processed
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
    // Execute scheduled action
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
    // Publish an article
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
        // Validate before publishing
        if (options.validateSEO) {
            const validation = await this.validateArticle(article);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
        }
        // Update article status
        article.status = 'published';
        article.publishDate = article.publishDate || new Date();
        article.publishDate = new Date();
        await article.save();
        // Create version snapshot
        await article.createVersion(article.authorId, 'Published');
        // Clear cache
        await this.invalidateArticleCache(articleId);
        // Send notifications
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
    // Unpublish an article
    async unpublishArticle(articleId) {
        const article = await ContentArticle_1.ContentArticle.findByPk(articleId);
        if (!article) {
            throw new Error('Article not found');
        }
        article.status = 'draft';
        await article.save();
        // Create version snapshot
        await article.createVersion(article.authorId, 'Unpublished');
        // Clear cache
        await this.invalidateArticleCache(articleId);
        logger_1.logger.info('Article unpublished', {
            articleId: article.id,
            title: article.title,
        });
        return article;
    }
    // Schedule article publishing
    async schedulePublishing(articleId, publishDate, userId, options = {}) {
        // Cancel any existing schedule
        await this.cancelSchedule(articleId);
        // Create new schedule
        const schedule = await ContentSchedule_1.default.create({
            contentId: articleId,
            scheduledFor: publishDate,
            scheduleType: 'publish',
            metadata: options,
            createdBy: userId,
        });
        // Set up immediate scheduling if within 24 hours
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
    // Cancel scheduled publishing
    async cancelSchedule(articleId) {
        // Cancel in-memory timeout
        const timeout = this.publishingQueue.get(articleId);
        if (timeout) {
            clearTimeout(timeout);
            this.publishingQueue.delete(articleId);
        }
        // Mark database schedules as cancelled
        await ContentSchedule_1.default.update({ status: 'cancelled', processedAt: new Date() }, {
            where: {
                contentId: articleId,
                status: 'pending',
            },
        });
    }
    // Validate article before publishing
    async validateArticle(article) {
        const errors = [];
        const warnings = [];
        let seoScore = 100;
        // Required fields
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
        // SEO checks
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
    // Review workflow
    async submitForReview(articleId, reviewerId) {
        const article = await ContentArticle_1.ContentArticle.findByPk(articleId, {
            include: [{ model: User_1.User, as: 'author' }],
        });
        if (!article) {
            throw new Error('Article not found');
        }
        article.status = 'review';
        await article.save();
        // Notify reviewer
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
    // Approve article
    async approveArticle(articleId, reviewerId, comments) {
        const article = await ContentArticle_1.ContentArticle.findByPk(articleId);
        if (!article) {
            throw new Error('Article not found');
        }
        if (article.status !== 'review') {
            throw new Error('Article is not under review');
        }
        // Create approval version
        await article.createVersion(reviewerId, `Approved${comments ? `: ${comments}` : ''}`);
        // Update status
        article.status = 'published';
        article.publishDate = new Date();
        article.publishDate = new Date();
        await article.save();
        // Notify author
        await this.notifyAuthor(article, 'approved', comments);
        return article;
    }
    // Reject article
    async rejectArticle(articleId, reviewerId, reason) {
        const article = await ContentArticle_1.ContentArticle.findByPk(articleId);
        if (!article) {
            throw new Error('Article not found');
        }
        if (article.status !== 'review') {
            throw new Error('Article is not under review');
        }
        // Create rejection version
        await article.createVersion(reviewerId, `Rejected: ${reason}`);
        // Update status
        article.status = 'draft';
        await article.save();
        // Notify author
        await this.notifyAuthor(article, 'rejected', reason);
        return article;
    }
    // Notification helpers
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
        // Get subscribers interested in this category
        // For now, get all verified users - in production, implement proper subscription preferences
        const { User } = require('../../models/User');
        const subscribers = await User.findAll({
            where: { emailVerified: true },
            limit: 100, // Limit for performance
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
        // Implement social media sharing
        // This would integrate with social media APIs
        logger_1.logger.info('Social sharing scheduled', { articleId: article.id });
    }
    async getSubscribers(categoryId) {
        // Get users subscribed to content updates
        const where = {
            contentSubscription: true,
            status: 'active',
        };
        if (categoryId) {
            // Add category preference filter
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
    // Analytics tracking
    async trackPublishingMetrics(articleId) {
        // Track publishing metrics
        const metrics = {
            articleId,
            publishDate: new Date(),
            timeToPublish: 0, // Calculate from creation to publish
            revisions: await ContentVersion_1.default.count({ where: { contentId: articleId } }),
        };
        logger_1.logger.info('Publishing metrics', metrics);
    }
}
exports.PublishingService = PublishingService;
//# sourceMappingURL=PublishingService.js.map