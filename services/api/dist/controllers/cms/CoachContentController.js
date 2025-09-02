"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachContentController = void 0;
const ContentArticle_1 = require("../../models/cms/ContentArticle");
const ContentCategory_1 = require("../../models/cms/ContentCategory");
const ContentMedia_1 = require("../../models/cms/ContentMedia");
// import ContentVersion from '../../models/cms/ContentVersion';
// import { User } from '../../models/User';
const PublishingService_1 = require("../../services/cms/PublishingService");
const logger_1 = require("../../utils/logger");
const sequelize_1 = require("sequelize");
const publishingService = new PublishingService_1.PublishingService();
class CoachContentController {
    // Get coach's content dashboard
    async getDashboard(req, _res) {
        try {
            const coachId = req.user.id;
            // Get coach's content stats
            const [totalArticles, publishedArticles, draftArticles, totalViews] = await Promise.all([
                ContentArticle_1.ContentArticle.count({ where: { authorId: coachId } }),
                ContentArticle_1.ContentArticle.count({ where: { authorId: coachId, status: 'published' } }),
                ContentArticle_1.ContentArticle.count({ where: { authorId: coachId, status: 'draft' } }),
                ContentArticle_1.ContentArticle.sum('viewCount', { where: { authorId: coachId } }) || 0,
            ]);
            // Get recent articles
            const recentArticles = await ContentArticle_1.ContentArticle.findAll({
                where: { authorId: coachId },
                include: [{ model: ContentCategory_1.ContentCategory, as: 'category' }],
                order: [['updatedAt', 'DESC']],
                limit: 5,
            });
            // Get popular articles
            const popularArticles = await ContentArticle_1.ContentArticle.findAll({
                where: {
                    authorId: coachId,
                    status: 'published',
                },
                order: [['viewCount', 'DESC']],
                limit: 5,
            });
            _res.json({
                success: true,
                data: {
                    stats: {
                        totalArticles,
                        publishedArticles,
                        draftArticles,
                        totalViews,
                    },
                    recentArticles,
                    popularArticles,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get coach dashboard', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to load dashboard',
            });
        }
    }
    // Get coach's articles
    async getArticles(req, _res) {
        try {
            const coachId = req.user.id;
            const { status, search, page = 1, limit = 10 } = req.query;
            const where = { authorId: coachId };
            if (status) {
                where.status = status;
            }
            if (search) {
                where[sequelize_1.Op.or] = [
                    { title: { [sequelize_1.Op.iLike]: `%${search}%` } },
                    { summary: { [sequelize_1.Op.iLike]: `%${search}%` } },
                ];
            }
            const offset = (Number(page) - 1) * Number(limit);
            const { count, rows } = await ContentArticle_1.ContentArticle.findAndCountAll({
                where,
                include: [{ model: ContentCategory_1.ContentCategory, as: 'category' }],
                order: [['updatedAt', 'DESC']],
                limit: Number(limit),
                offset,
            });
            _res.json({
                success: true,
                data: rows,
                pagination: {
                    total: count,
                    pages: Math.ceil(count / Number(limit)),
                    currentPage: Number(page),
                    perPage: Number(limit),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get coach articles', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to load articles',
            });
        }
    }
    // Create new article
    async createArticle(req, _res) {
        try {
            const coachId = req.user.id;
            const articleData = {
                ...req.body,
                authorId: coachId,
                status: 'draft',
            };
            const article = await ContentArticle_1.ContentArticle.create(articleData);
            // Create initial version
            await article.createVersion(Number(coachId), 'Initial draft');
            _res.status(201).json({
                success: true,
                data: article,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create article', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to create article',
            });
        }
    }
    // Update article
    async updateArticle(req, _res) {
        try {
            const coachId = req.user.id;
            const { id } = req.params;
            const article = await ContentArticle_1.ContentArticle.findOne({
                where: { id, authorId: coachId },
            });
            if (!article) {
                return _res.status(404).json({
                    success: false,
                    error: 'Article not found',
                });
            }
            // Coaches can only update their own articles in draft or review status
            if (article.status === 'published' && !req.body.forceUpdate) {
                return _res.status(403).json({
                    success: false,
                    error: 'Cannot edit published articles. Create a new version instead.',
                });
            }
            await article.update(req.body);
            // Create version snapshot
            await article.createVersion(Number(coachId), 'Updated by coach');
            _res.json({
                success: true,
                data: article,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update article', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to update article',
            });
        }
    }
    // Submit article for review
    async submitForReview(req, _res) {
        try {
            const coachId = req.user.id;
            const { id } = req.params;
            const { reviewerNotes } = req.body;
            const article = await ContentArticle_1.ContentArticle.findOne({
                where: { id, authorId: coachId },
            });
            if (!article) {
                return _res.status(404).json({
                    success: false,
                    error: 'Article not found',
                });
            }
            if (article.status !== 'draft') {
                return _res.status(400).json({
                    success: false,
                    error: 'Only draft articles can be submitted for review',
                });
            }
            // Validate article before submission
            const validation = await publishingService.validateArticle(article);
            if (!validation.isValid) {
                return _res.status(400).json({
                    success: false,
                    error: 'Article validation failed',
                    details: validation.errors,
                });
            }
            // Submit for review
            await publishingService.submitForReview(article.id);
            // Add review notes if provided
            if (reviewerNotes) {
                await article.createVersion(Number(coachId), `Submitted for review: ${reviewerNotes}`);
            }
            _res.json({
                success: true,
                data: article,
                message: 'Article submitted for review successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to submit article for review', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to submit article for review',
            });
        }
    }
    // Schedule article publishing
    async scheduleArticle(req, _res) {
        try {
            const coachId = req.user.id;
            const { id } = req.params;
            const { publishDate, options } = req.body;
            const article = await ContentArticle_1.ContentArticle.findOne({
                where: { id, authorId: coachId },
            });
            if (!article) {
                return _res.status(404).json({
                    success: false,
                    error: 'Article not found',
                });
            }
            // Coaches can only schedule their approved articles
            if (article.status !== 'review' && article.status !== 'published') {
                return _res.status(400).json({
                    success: false,
                    error: 'Article must be approved before scheduling',
                });
            }
            const schedule = await publishingService.schedulePublishing(article.id, new Date(publishDate), { ...options, createdBy: coachId });
            _res.json({
                success: true,
                data: schedule,
                message: 'Article scheduled successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to schedule article', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to schedule article',
            });
        }
    }
    // Get article analytics
    async getArticleAnalytics(req, _res) {
        try {
            const coachId = req.user.id;
            const { id } = req.params;
            const {} = req.query;
            const article = await ContentArticle_1.ContentArticle.findOne({
                where: { id, authorId: coachId },
            });
            if (!article) {
                return _res.status(404).json({
                    success: false,
                    error: 'Article not found',
                });
            }
            // Get view analytics (would connect to analytics service)
            const analytics = {
                totalViews: article.viewCount,
                uniqueViews: Math.floor(article.viewCount * 0.7), // Placeholder
                avgTimeOnPage: '3:45', // Placeholder
                bounceRate: '35%', // Placeholder
                shares: {
                    total: Math.floor(article.viewCount * 0.1),
                    facebook: Math.floor(article.viewCount * 0.04),
                    twitter: Math.floor(article.viewCount * 0.03),
                    linkedin: Math.floor(article.viewCount * 0.02),
                    email: Math.floor(article.viewCount * 0.01),
                },
                engagement: {
                    likes: Math.floor(article.viewCount * 0.15),
                    comments: Math.floor(article.viewCount * 0.05),
                    bookmarks: Math.floor(article.viewCount * 0.08),
                },
                demographics: {
                    topCountries: [
                        { country: 'United States', percentage: 45 },
                        { country: 'United Kingdom', percentage: 15 },
                        { country: 'Canada', percentage: 10 },
                        { country: 'Australia', percentage: 8 },
                        { country: 'Others', percentage: 22 },
                    ],
                    devices: {
                        desktop: 55,
                        mobile: 35,
                        tablet: 10,
                    },
                },
            };
            _res.json({
                success: true,
                data: analytics,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get article analytics', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to load analytics',
            });
        }
    }
    // Upload media for articles
    async uploadMedia(req, _res) {
        try {
            const coachId = req.user.id;
            const { file } = req;
            if (!file) {
                return _res.status(400).json({
                    success: false,
                    error: 'No file provided',
                });
            }
            // Create media record
            const media = await ContentMedia_1.ContentMedia.create({
                filename: file.filename,
                originalFilename: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                url: `/uploads/content/${file.filename}`,
                uploadedBy: coachId,
                type: file.mimetype.startsWith('image/')
                    ? 'image'
                    : file.mimetype.startsWith('video/')
                        ? 'video'
                        : file.mimetype.startsWith('audio/')
                            ? 'audio'
                            : 'document',
                isPublic: false,
            });
            _res.json({
                success: true,
                data: media,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to upload media', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to upload media',
            });
        }
    }
    // Get coach's media library
    async getMediaLibrary(req, _res) {
        try {
            const coachId = req.user.id;
            const { type, page = 1, limit = 20 } = req.query;
            const where = { uploadedBy: coachId };
            if (type) {
                where.mimeType = { [sequelize_1.Op.like]: `${type}%` };
            }
            const offset = (Number(page) - 1) * Number(limit);
            const { count, rows } = await ContentMedia_1.ContentMedia.findAndCountAll({
                where,
                order: [['createdAt', 'DESC']],
                limit: Number(limit),
                offset,
            });
            _res.json({
                success: true,
                data: rows,
                pagination: {
                    total: count,
                    pages: Math.ceil(count / Number(limit)),
                    currentPage: Number(page),
                    perPage: Number(limit),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get media library', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to load media library',
            });
        }
    }
    // Get available categories for coaches
    async getCategories(req, res) {
        try {
            const categories = await ContentCategory_1.ContentCategory.findAll({
                where: { isActive: true },
                order: [['name', 'ASC']],
            });
            res.json({
                success: true,
                data: categories,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get categories', error);
            res.status(500).json({
                success: false,
                error: 'Failed to load categories',
            });
        }
    }
    // Get coach's content performance overview
    async getPerformanceOverview(req, _res) {
        try {
            const coachId = req.user.id;
            const { period = '30d' } = req.query;
            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            switch (period) {
                case '7d':
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(startDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(startDate.getDate() - 90);
                    break;
                case '1y':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    break;
            }
            // Get performance metrics
            const articles = await ContentArticle_1.ContentArticle.findAll({
                where: {
                    authorId: coachId,
                    status: 'published',
                    publishDate: {
                        [sequelize_1.Op.between]: [startDate, endDate],
                    },
                },
            });
            const totalViews = articles.reduce((sum, article) => sum + article.viewCount, 0);
            const avgViews = articles.length > 0 ? Math.round(totalViews / articles.length) : 0;
            // Calculate growth
            const previousEndDate = new Date(startDate);
            const previousStartDate = new Date(startDate);
            previousStartDate.setDate(previousStartDate.getDate() -
                (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const previousArticles = await ContentArticle_1.ContentArticle.findAll({
                where: {
                    authorId: coachId,
                    status: 'published',
                    publishDate: {
                        [sequelize_1.Op.between]: [previousStartDate, previousEndDate],
                    },
                },
            });
            const previousViews = previousArticles.reduce((sum, article) => sum + article.viewCount, 0);
            const viewsGrowth = previousViews > 0 ? ((totalViews - previousViews) / previousViews) * 100 : 0;
            _res.json({
                success: true,
                data: {
                    period,
                    metrics: {
                        totalArticles: articles.length,
                        totalViews,
                        avgViewsPerArticle: avgViews,
                        viewsGrowth: Math.round(viewsGrowth),
                    },
                    topPerformers: articles
                        .sort((a, b) => b.viewCount - a.viewCount)
                        .slice(0, 5)
                        .map(article => ({
                        id: article.id,
                        title: article.title,
                        views: article.viewCount,
                        publishDate: article.publishDate,
                    })),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get performance overview', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to load performance data',
            });
        }
    }
}
exports.CoachContentController = CoachContentController;
exports.default = new CoachContentController();
//# sourceMappingURL=CoachContentController.js.map