"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticleController = void 0;
const models_1 = require("../../models");
const express_validator_1 = require("express-validator");
const sequelize_1 = require("sequelize");
const logger_1 = require("../../utils/logger");
/**
 * ArticleController
 * Handles CRUD operations for articles and content management
 */
class ArticleController {
    /**
     * Get all articles with filtering and pagination
     */
    static async getArticles(req, _res) {
        try {
            const { page = 1, limit = 10, status, category, author, search, sortBy = 'updatedAt', sortOrder = 'DESC', } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const whereClause = {};
            // Apply filters
            if (status) {
                whereClause.status = status;
            }
            if (category) {
                whereClause.categoryId = category;
            }
            if (author) {
                whereClause.authorId = author;
            }
            if (search) {
                whereClause[sequelize_1.Op.or] = [
                    { title: { [sequelize_1.Op.iLike]: `%${search}%` } },
                    { content: { [sequelize_1.Op.iLike]: `%${search}%` } },
                    { excerpt: { [sequelize_1.Op.iLike]: `%${search}%` } },
                ];
            }
            const articles = await models_1.Article.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: models_1.Category,
                        as: 'category',
                        attributes: ['id', 'name', 'slug'],
                    },
                ],
                order: [[sortBy, sortOrder]],
                limit: Number(limit),
                offset,
            });
            _res.json({
                success: true,
                data: articles.rows,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(articles.count / Number(limit)),
                    totalItems: articles.count,
                    itemsPerPage: Number(limit),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching articles:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to fetch articles',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Get a single article by ID or slug
     */
    static async getArticle(req, _res) {
        try {
            const { id } = req.params;
            const { trackView = 'true' } = req.query;
            // Try to find by ID first, then by slug
            let article = await models_1.Article.findByPk(id, {
                include: [
                    {
                        model: models_1.Category,
                        as: 'category',
                        attributes: ['id', 'name', 'slug', 'path'],
                    },
                ],
            });
            if (!article) {
                article = await models_1.Article.findOne({
                    where: { slug: id },
                    include: [
                        {
                            model: models_1.Category,
                            as: 'category',
                            attributes: ['id', 'name', 'slug', 'path'],
                        },
                    ],
                });
            }
            if (!article) {
                _res.status(404).json({
                    success: false,
                    message: 'Article not found',
                });
                return;
            }
            // Track view if requested
            if (trackView === 'true') {
                await article.incrementViewCount();
                // Create analytics record
                await models_1.ContentAnalytics.create({
                    contentType: 'article',
                    contentId: article.id,
                    userId: req.user?.id || null,
                    sessionId: req.headers['x-session-id'] || 'anonymous',
                    event: 'view',
                    metadata: {
                        referrer: req.get('Referrer'),
                        userAgent: req.get('User-Agent'),
                        deviceType: this.getDeviceType(req.get('User-Agent')),
                    },
                    ipAddress: req.ip,
                    timestamp: new Date(),
                });
            }
            _res.json({
                success: true,
                data: article,
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching article:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to fetch article',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Create a new article
     */
    static async createArticle(req, _res) {
        try {
            // Check validation errors
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { title, excerpt, content, categoryId, status = 'draft', featuredImage, seoTitle, seoDescription, seoKeywords, 
            // tags,
            settings, publishingSchedule, } = req.body;
            const article = await models_1.Article.create({
                title,
                excerpt,
                content,
                categoryId,
                authorId: req.user.id,
                status,
                featuredImage,
                seoTitle,
                seoDescription,
                seoKeywords,
                metadata: {
                    wordCount: content.split(/\s+/).length,
                    version: 1,
                    sources: [],
                },
                settings: {
                    allowComments: true,
                    enableNotifications: true,
                    isFeatured: false,
                    isTemplate: false,
                    ...settings,
                },
                publishingSchedule: {
                    scheduledPublishAt: null,
                    timezone: 'UTC',
                    autoPublish: false,
                    ...publishingSchedule,
                },
                analytics: {
                    avgReadTime: 0,
                    bounceRate: 0,
                    completionRate: 0,
                    engagementScore: 0,
                },
            });
            // Load the created article with associations
            const createdArticle = await models_1.Article.findByPk(article.id, {
                include: [
                    {
                        model: models_1.Category,
                        as: 'category',
                        attributes: ['id', 'name', 'slug'],
                    },
                ],
            });
            _res.status(201).json({
                success: true,
                data: createdArticle,
                message: 'Article created successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating article:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to create article',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Update an existing article
     */
    static async updateArticle(req, _res) {
        try {
            const { id } = req.params;
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const article = await models_1.Article.findByPk(id);
            if (!article) {
                _res.status(404).json({
                    success: false,
                    message: 'Article not found',
                });
                return;
            }
            // Check if user can edit this article
            if (article.authorId !== req.user.id && req.user.role !== 'admin') {
                _res.status(403).json({
                    success: false,
                    message: 'Not authorized to edit this article',
                });
                return;
            }
            const { title, excerpt, content, categoryId, status, featuredImage, seoTitle, seoDescription, seoKeywords, settings, publishingSchedule, } = req.body;
            // Update metadata
            if (content && content !== article.content) {
                article.metadata = {
                    ...article.metadata,
                    wordCount: content.split(/\s+/).length,
                    version: article.metadata.version + 1,
                    lastEditedBy: req.user.id,
                };
            }
            await article.update({
                title,
                excerpt,
                content,
                categoryId,
                status,
                featuredImage,
                seoTitle,
                seoDescription,
                seoKeywords,
                settings: { ...article.settings, ...settings },
                publishingSchedule: { ...article.publishingSchedule, ...publishingSchedule },
            });
            // Load updated article with associations
            const updatedArticle = await models_1.Article.findByPk(article.id, {
                include: [
                    {
                        model: models_1.Category,
                        as: 'category',
                        attributes: ['id', 'name', 'slug'],
                    },
                ],
            });
            _res.json({
                success: true,
                data: updatedArticle,
                message: 'Article updated successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating article:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to update article',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Delete an article
     */
    static async deleteArticle(req, _res) {
        try {
            const { id } = req.params;
            const article = await models_1.Article.findByPk(id);
            if (!article) {
                _res.status(404).json({
                    success: false,
                    message: 'Article not found',
                });
                return;
            }
            // Check if user can delete this article
            if (article.authorId !== req.user.id && req.user.role !== 'admin') {
                _res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this article',
                });
                return;
            }
            await article.destroy();
            _res.json({
                success: true,
                message: 'Article deleted successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error deleting article:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to delete article',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Publish an article
     */
    static async publishArticle(req, _res) {
        try {
            const { id } = req.params;
            const article = await models_1.Article.findByPk(id);
            if (!article) {
                _res.status(404).json({
                    success: false,
                    message: 'Article not found',
                });
                return;
            }
            // Check if user can publish this article
            if (article.authorId !== req.user.id && req.user.role !== 'admin') {
                _res.status(403).json({
                    success: false,
                    message: 'Not authorized to publish this article',
                });
                return;
            }
            await article.publish();
            _res.json({
                success: true,
                data: article,
                message: 'Article published successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error publishing article:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to publish article',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Archive an article
     */
    static async archiveArticle(req, _res) {
        try {
            const { id } = req.params;
            const article = await models_1.Article.findByPk(id);
            if (!article) {
                _res.status(404).json({
                    success: false,
                    message: 'Article not found',
                });
                return;
            }
            // Check if user can archive this article
            if (article.authorId !== req.user.id && req.user.role !== 'admin') {
                _res.status(403).json({
                    success: false,
                    message: 'Not authorized to archive this article',
                });
                return;
            }
            await article.archive();
            _res.json({
                success: true,
                data: article,
                message: 'Article archived successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error archiving article:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to archive article',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Get popular articles
     */
    static async getPopularArticles(req, _res) {
        try {
            const { limit = 10 } = req.query;
            // const { timeframe = 'month' } = req.query; // unused
            const articles = await models_1.Article.getPopular(Number(limit));
            _res.json({
                success: true,
                data: articles,
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching popular articles:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to fetch popular articles',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Search articles
     */
    static async searchArticles(req, _res) {
        try {
            const { q: query, category, status, author, tags } = req.query;
            if (!query) {
                _res.status(400).json({
                    success: false,
                    message: 'Search query is required',
                });
                return;
            }
            const filters = {};
            if (category)
                filters.category = category;
            if (status)
                filters.status = status;
            if (author)
                filters.author = author;
            if (tags)
                filters.tags = tags.split(',');
            const articles = await models_1.Article.searchArticles(query, filters);
            _res.json({
                success: true,
                data: articles,
            });
        }
        catch (error) {
            logger_1.logger.error('Error searching articles:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to search articles',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Get article analytics
     */
    static async getArticleAnalytics(req, _res) {
        try {
            const { id } = req.params;
            const article = await models_1.Article.findByPk(id);
            if (!article) {
                _res.status(404).json({
                    success: false,
                    message: 'Article not found',
                });
                return;
            }
            const analytics = await models_1.ContentAnalytics.getContentPerformance('article', id);
            _res.json({
                success: true,
                data: {
                    article: {
                        id: article.id,
                        title: article.title,
                        status: article.status,
                        publishedAt: article.publishedAt,
                    },
                    analytics,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching article analytics:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to fetch article analytics',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Helper method to determine device type from user agent
     */
    static getDeviceType(userAgent) {
        if (!userAgent)
            return 'unknown';
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
            return 'mobile';
        }
        else if (/Tablet/.test(userAgent)) {
            return 'tablet';
        }
        else {
            return 'desktop';
        }
    }
}
exports.ArticleController = ArticleController;
exports.default = ArticleController;
//# sourceMappingURL=ArticleController.js.map