"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScheduledContent = exports.scheduleContent = exports.getArticleAnalytics = exports.getContentAnalytics = exports.previewContent = exports.analyzeContent = exports.updateTemplate = exports.createTemplate = exports.getTemplates = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = exports.deleteMedia = exports.getMedia = exports.uploadMedia = exports.revertArticleVersion = exports.getArticleVersions = exports.unpublishArticle = exports.publishArticle = exports.deleteArticle = exports.updateArticle = exports.getArticle = exports.createArticle = exports.getArticles = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = __importDefault(require("sequelize"));
const ContentArticle_1 = require("../../models/cms/ContentArticle");
const ContentCategory_1 = require("../../models/cms/ContentCategory");
const ContentMedia_1 = require("../../models/cms/ContentMedia");
const ContentTemplate_1 = __importDefault(require("../../models/cms/ContentTemplate"));
const ContentVersion_1 = __importDefault(require("../../models/cms/ContentVersion"));
const ContentInteraction_1 = __importDefault(require("../../models/cms/ContentInteraction"));
const ContentSchedule_1 = __importDefault(require("../../models/cms/ContentSchedule"));
const ContentComment_1 = __importDefault(require("../../models/cms/ContentComment"));
const User_1 = require("../../models/User");
const UnifiedCacheService_1 = require("../../services/cache/UnifiedCacheService");
const UploadService_1 = __importDefault(require("../../services/upload/UploadService"));
const logger_1 = require("../../utils/logger");
const slugify_1 = __importDefault(require("slugify"));
// Article Controllers
const getArticles = async (req, _res) => {
    try {
        const { page = 1, limit = 20, status, category, author, tags, search, sort = '-createdAt', } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        // Apply filters
        if (status)
            where.status = status;
        if (category)
            where.categoryId = category;
        if (author)
            where.authorId = author;
        if (tags)
            where.tags = { [sequelize_1.Op.contains]: Array.isArray(tags) ? tags : [tags] };
        if (search) {
            where[sequelize_1.Op.or] = [
                { title: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { summary: { [sequelize_1.Op.iLike]: `%${search}%` } },
            ];
        }
        // Check if public access
        const isPublic = req.path.includes('/public');
        if (isPublic) {
            where.status = 'published';
            where.publishDate = { [sequelize_1.Op.lte]: new Date() };
        }
        // Parse sort
        const sortString = String(sort);
        const sortField = sortString.startsWith('-') ? sortString.slice(1) : sortString;
        const sortOrder = sortString.startsWith('-') ? 'DESC' : 'ASC';
        const { rows: articles, count } = await ContentArticle_1.ContentArticle.findAndCountAll({
            where,
            limit: Number(limit),
            offset,
            order: [[sortField, sortOrder]],
            include: [
                {
                    model: User_1.User,
                    as: 'author',
                    attributes: ['id', 'name', 'avatar'],
                },
                {
                    model: ContentCategory_1.ContentCategory,
                    as: 'category',
                    attributes: ['id', 'name', 'slug'],
                },
            ],
            distinct: true,
        });
        _res.json({
            success: true,
            data: articles,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: count,
                totalPages: Math.ceil(count / Number(limit)),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get articles:', error);
        _res.status(500).json({ success: false, error: 'Failed to get articles' });
    }
};
exports.getArticles = getArticles;
const createArticle = async (req, _res) => {
    try {
        const { title, slug, summary, content, categoryId, featuredImage, tags, seoTitle, seoDescription, seoKeywords, metadata, status = 'draft', visibility = 'public', publishDate, allowComments = true, } = req.body;
        // Generate slug if not provided
        const articleSlug = slug || (0, slugify_1.default)(title, { lower: true, strict: true });
        const article = await ContentArticle_1.ContentArticle.create({
            title,
            slug: articleSlug,
            summary,
            content,
            authorId: Number(req.user.id),
            categoryId,
            featuredImage,
            tags: tags || [],
            seoTitle: seoTitle || title,
            seoDescription: seoDescription || summary,
            seoKeywords: seoKeywords || [],
            metadata,
            status,
            visibility,
            publishDate,
            allowComments,
            lastModifiedBy: Number(req.user.id),
        });
        // Create initial version
        await article.createVersion(Number(req.user.id), 'Initial version');
        // Invalidate cache
        await (0, UnifiedCacheService_1.getCacheService)().invalidate('cms:articles:*');
        _res.status(201).json({
            success: true,
            data: article,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create article:', error);
        _res.status(500).json({ success: false, error: 'Failed to create article' });
    }
};
exports.createArticle = createArticle;
const getArticle = async (req, _res) => {
    try {
        const { id } = req.params;
        const isPublic = req.path.includes('/public');
        // Try cache first
        const cacheKey = `cms:article:${id}`;
        const cached = await (0, UnifiedCacheService_1.getCacheService)().get(cacheKey);
        if (cached) {
            return _res.json({ success: true, data: cached });
        }
        const where = isNaN(Number(id)) ? { slug: id } : { id };
        if (isPublic) {
            where.status = 'published';
            where.publishDate = { [sequelize_1.Op.lte]: new Date() };
        }
        const article = await ContentArticle_1.ContentArticle.scope(['full', 'withContent']).findOne({
            where,
        });
        if (!article) {
            return _res.status(404).json({ success: false, error: 'Article not found' });
        }
        // Track view if public
        if (isPublic && req.user) {
            await ContentInteraction_1.default.create({
                userId: Number(req.user.id),
                contentId: article.id,
                interactionType: 'view',
            });
            await article.incrementViewCount();
        }
        // Cache the result
        await (0, UnifiedCacheService_1.getCacheService)().set(cacheKey, article, { ttl: 3600 });
        _res.json({
            success: true,
            data: article,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get article:', error);
        _res.status(500).json({ success: false, error: 'Failed to get article' });
    }
};
exports.getArticle = getArticle;
const updateArticle = async (req, _res) => {
    try {
        const { id } = req.params;
        const article = await ContentArticle_1.ContentArticle.findByPk(id);
        if (!article) {
            return _res.status(404).json({ success: false, error: 'Article not found' });
        }
        // Check permissions
        if (!article.canEdit(Number(req.user.id), req.user.role)) {
            return _res.status(403).json({ success: false, error: 'Permission denied' });
        }
        // Create version before updating
        await article.createVersion(Number(req.user.id), req.body.changeSummary);
        // Update article
        await article.update({
            ...req.body,
            lastModifiedBy: Number(req.user.id),
        });
        // Invalidate cache
        await (0, UnifiedCacheService_1.getCacheService)().del(`cms:article:${id}`);
        await (0, UnifiedCacheService_1.getCacheService)().invalidate('cms:articles:*');
        _res.json({
            success: true,
            data: article,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update article:', error);
        _res.status(500).json({ success: false, error: 'Failed to update article' });
    }
};
exports.updateArticle = updateArticle;
const deleteArticle = async (req, _res) => {
    try {
        const { id } = req.params;
        const article = await ContentArticle_1.ContentArticle.findByPk(id);
        if (!article) {
            return _res.status(404).json({ success: false, error: 'Article not found' });
        }
        await article.destroy();
        // Invalidate cache
        await (0, UnifiedCacheService_1.getCacheService)().del(`cms:article:${id}`);
        await (0, UnifiedCacheService_1.getCacheService)().invalidate('cms:articles:*');
        _res.json({
            success: true,
            message: 'Article deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete article:', error);
        _res.status(500).json({ success: false, error: 'Failed to delete article' });
    }
};
exports.deleteArticle = deleteArticle;
const publishArticle = async (req, _res) => {
    try {
        const { id } = req.params;
        const article = await ContentArticle_1.ContentArticle.findByPk(id);
        if (!article) {
            return _res.status(404).json({ success: false, error: 'Article not found' });
        }
        if (!article.canPublish(req.user.role)) {
            return _res.status(403).json({ success: false, error: 'Permission denied' });
        }
        await article.publish();
        // Invalidate cache
        await (0, UnifiedCacheService_1.getCacheService)().del(`cms:article:${id}`);
        await (0, UnifiedCacheService_1.getCacheService)().invalidate('cms:articles:*');
        _res.json({
            success: true,
            data: article,
            message: 'Article published successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to publish article:', error);
        _res.status(500).json({ success: false, error: 'Failed to publish article' });
    }
};
exports.publishArticle = publishArticle;
const unpublishArticle = async (req, _res) => {
    try {
        const { id } = req.params;
        const article = await ContentArticle_1.ContentArticle.findByPk(id);
        if (!article) {
            return _res.status(404).json({ success: false, error: 'Article not found' });
        }
        if (!article.canPublish(req.user.role)) {
            return _res.status(403).json({ success: false, error: 'Permission denied' });
        }
        await article.unpublish();
        // Invalidate cache
        await (0, UnifiedCacheService_1.getCacheService)().del(`cms:article:${id}`);
        await (0, UnifiedCacheService_1.getCacheService)().invalidate('cms:articles:*');
        _res.json({
            success: true,
            data: article,
            message: 'Article unpublished successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to unpublish article:', error);
        _res.status(500).json({ success: false, error: 'Failed to unpublish article' });
    }
};
exports.unpublishArticle = unpublishArticle;
const getArticleVersions = async (req, _res) => {
    try {
        const { id } = req.params;
        const versions = await ContentVersion_1.default.findAll({
            where: { contentId: id },
            order: [['version', 'DESC']],
            include: [
                {
                    model: User_1.User,
                    as: 'author',
                    attributes: ['id', 'name', 'avatar'],
                },
            ],
        });
        _res.json({
            success: true,
            data: versions,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get article versions:', error);
        _res.status(500).json({ success: false, error: 'Failed to get versions' });
    }
};
exports.getArticleVersions = getArticleVersions;
const revertArticleVersion = async (req, _res) => {
    try {
        const { id, version } = req.params;
        const article = await ContentArticle_1.ContentArticle.findByPk(id);
        if (!article) {
            return _res.status(404).json({ success: false, error: 'Article not found' });
        }
        const versionData = await ContentVersion_1.default.findOne({
            where: {
                contentId: id,
                version: version,
            },
        });
        if (!versionData) {
            return _res.status(404).json({ success: false, error: 'Version not found' });
        }
        // Create new version before reverting
        await article.createVersion(Number(req.user.id), `Reverted to version ${version}`);
        // Revert to selected version
        await article.update({
            title: versionData.title,
            content: versionData.content,
            lastModifiedBy: Number(req.user.id),
        });
        // Invalidate cache
        await (0, UnifiedCacheService_1.getCacheService)().del(`cms:article:${id}`);
        await (0, UnifiedCacheService_1.getCacheService)().invalidate('cms:articles:*');
        _res.json({
            success: true,
            data: article,
            message: `Reverted to version ${version}`,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to revert article version:', error);
        _res.status(500).json({ success: false, error: 'Failed to revert version' });
    }
};
exports.revertArticleVersion = revertArticleVersion;
// Media Controllers
const uploadMedia = async (req, _res) => {
    try {
        if (!req.file) {
            return _res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        const { folder = 'general', altText, caption, tags } = req.body;
        // Upload to storage service
        const uploadResult = await UploadService_1.default.uploadFile(req.file, {
            folder: `cms/${folder}`,
            generateThumbnail: req.file.mimetype.startsWith('image/'),
        });
        const media = await ContentMedia_1.ContentMedia.create({
            filename: uploadResult.filename,
            originalFilename: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            url: uploadResult.url,
            thumbnailUrl: uploadResult.thumbnailUrl,
            type: req.file.mimetype.startsWith('image/')
                ? 'image'
                : req.file.mimetype.startsWith('video/')
                    ? 'video'
                    : req.file.mimetype.startsWith('audio/')
                        ? 'audio'
                        : 'document',
            width: uploadResult.dimensions?.width,
            height: uploadResult.dimensions?.height,
            uploadedBy: req.user.id,
            isPublic: true,
            metadata: {
                ...uploadResult.metadata,
                alt: altText,
                caption,
                folder,
                tags: tags ? tags.split(',').map((t) => t.trim()) : [],
            },
        });
        _res.json({
            success: true,
            data: media,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to upload media:', error);
        _res.status(500).json({ success: false, error: 'Failed to upload media' });
    }
};
exports.uploadMedia = uploadMedia;
const getMedia = async (req, _res) => {
    try {
        const { page = 1, limit = 50, folder, tags, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (folder)
            where.folder = folder;
        if (tags)
            where.tags = { [sequelize_1.Op.contains]: Array.isArray(tags) ? tags : [tags] };
        if (search) {
            where[sequelize_1.Op.or] = [
                { filename: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { originalFilename: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { altText: { [sequelize_1.Op.iLike]: `%${search}%` } },
            ];
        }
        const { rows: media, count } = await ContentMedia_1.ContentMedia.findAndCountAll({
            where,
            limit: Number(limit),
            offset,
            order: [['createdAt', 'DESC']],
        });
        _res.json({
            success: true,
            data: media,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: count,
                totalPages: Math.ceil(count / Number(limit)),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get media:', error);
        _res.status(500).json({ success: false, error: 'Failed to get media' });
    }
};
exports.getMedia = getMedia;
const deleteMedia = async (req, _res) => {
    try {
        const { id } = req.params;
        const media = await ContentMedia_1.ContentMedia.findByPk(id);
        if (!media) {
            return _res.status(404).json({ success: false, error: 'Media not found' });
        }
        // Delete from storage
        await UploadService_1.default.deleteFile(media.filename);
        if (media.thumbnailUrl) {
            await UploadService_1.default.deleteFile(media.thumbnailUrl);
        }
        await media.destroy();
        _res.json({
            success: true,
            message: 'Media deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete media:', error);
        _res.status(500).json({ success: false, error: 'Failed to delete media' });
    }
};
exports.deleteMedia = deleteMedia;
// Category Controllers
const getCategories = async (_req, _res) => {
    try {
        const categories = await ContentCategory_1.ContentCategory.findAll({
            where: { isActive: true },
            order: [
                ['orderIndex', 'ASC'],
                ['name', 'ASC'],
            ],
        });
        _res.json({
            success: true,
            data: categories,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get categories:', error);
        _res.status(500).json({ success: false, error: 'Failed to get categories' });
    }
};
exports.getCategories = getCategories;
const createCategory = async (req, _res) => {
    try {
        const { name, description, parentId, icon, color, orderIndex } = req.body;
        const slug = (0, slugify_1.default)(name, { lower: true, strict: true });
        const category = await ContentCategory_1.ContentCategory.create({
            name,
            slug,
            description,
            parentId,
            icon,
            color,
            order: orderIndex || 0,
            isActive: true,
        });
        _res.status(201).json({
            success: true,
            data: category,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create category:', error);
        _res.status(500).json({ success: false, error: 'Failed to create category' });
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, _res) => {
    try {
        const { id } = req.params;
        const category = await ContentCategory_1.ContentCategory.findByPk(id);
        if (!category) {
            return _res.status(404).json({ success: false, error: 'Category not found' });
        }
        await category.update(req.body);
        _res.json({
            success: true,
            data: category,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update category:', error);
        _res.status(500).json({ success: false, error: 'Failed to update category' });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, _res) => {
    try {
        const { id } = req.params;
        const category = await ContentCategory_1.ContentCategory.findByPk(id);
        if (!category) {
            return _res.status(404).json({ success: false, error: 'Category not found' });
        }
        // Check if category has articles
        const articleCount = await ContentArticle_1.ContentArticle.count({
            where: { categoryId: id },
        });
        if (articleCount > 0) {
            return _res.status(400).json({
                success: false,
                error: `Cannot delete category with ${articleCount} articles`,
            });
        }
        await category.destroy();
        _res.json({
            success: true,
            message: 'Category deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete category:', error);
        _res.status(500).json({ success: false, error: 'Failed to delete category' });
    }
};
exports.deleteCategory = deleteCategory;
// Template Controllers
const getTemplates = async (req, _res) => {
    try {
        const { type } = req.query;
        const where = { isActive: true };
        if (type)
            where.templateType = type;
        const templates = await ContentTemplate_1.default.findAll({
            where,
            order: [['name', 'ASC']],
        });
        _res.json({
            success: true,
            data: templates,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get templates:', error);
        _res.status(500).json({ success: false, error: 'Failed to get templates' });
    }
};
exports.getTemplates = getTemplates;
const createTemplate = async (req, _res) => {
    try {
        const template = await ContentTemplate_1.default.create({
            ...req.body,
            createdBy: Number(req.user.id),
        });
        _res.status(201).json({
            success: true,
            data: template,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create template:', error);
        _res.status(500).json({ success: false, error: 'Failed to create template' });
    }
};
exports.createTemplate = createTemplate;
const updateTemplate = async (req, _res) => {
    try {
        const { id } = req.params;
        const template = await ContentTemplate_1.default.findByPk(id);
        if (!template) {
            return _res.status(404).json({ success: false, error: 'Template not found' });
        }
        await template.update(req.body);
        _res.json({
            success: true,
            data: template,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update template:', error);
        _res.status(500).json({ success: false, error: 'Failed to update template' });
    }
};
exports.updateTemplate = updateTemplate;
// Content Analysis & Tools
const analyzeContent = async (req, _res) => {
    try {
        const { content, title } = req.body;
        // Perform content analysis
        const analysis = {
            readability: calculateReadability(content),
            seo: analyzeSEO(title, content),
            wordCount: content.split(/\s+/).length,
            readingTime: Math.ceil(content.split(/\s+/).length / 200),
            keywords: extractKeywords(content),
        };
        _res.json({
            success: true,
            data: analysis,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to analyze content:', error);
        _res.status(500).json({ success: false, error: 'Failed to analyze content' });
    }
};
exports.analyzeContent = analyzeContent;
const previewContent = async (req, _res) => {
    try {
        const { content, format = 'html' } = req.body;
        // Convert content to preview format
        const preview = await generatePreview(content, format);
        _res.json({
            success: true,
            data: preview,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to preview content:', error);
        _res.status(500).json({ success: false, error: 'Failed to preview content' });
    }
};
exports.previewContent = previewContent;
// Analytics
const getContentAnalytics = async (req, _res) => {
    try {
        const {} = req.query;
        const analytics = {
            totalArticles: await ContentArticle_1.ContentArticle.count(),
            publishedArticles: await ContentArticle_1.ContentArticle.count({
                where: { status: 'published' },
            }),
            totalViews: await ContentArticle_1.ContentArticle.sum('viewCount'),
            totalLikes: await ContentArticle_1.ContentArticle.sum('likeCount'),
            topArticles: await ContentArticle_1.ContentArticle.findAll({
                where: { status: 'published' },
                order: [['viewCount', 'DESC']],
                limit: 10,
                attributes: ['id', 'title', 'slug', 'viewCount', 'likeCount'],
            }),
            categoryBreakdown: await ContentCategory_1.ContentCategory.findAll({
                attributes: [
                    'id',
                    'name',
                    [sequelize_2.default.fn('COUNT', sequelize_2.default.col('articles.id')), 'articleCount'],
                ],
                include: [
                    {
                        model: ContentArticle_1.ContentArticle,
                        as: 'articles',
                        attributes: [],
                    },
                ],
                group: ['ContentCategory.id'],
            }),
        };
        _res.json({
            success: true,
            data: analytics,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get content analytics:', error);
        _res.status(500).json({ success: false, error: 'Failed to get analytics' });
    }
};
exports.getContentAnalytics = getContentAnalytics;
const getArticleAnalytics = async (req, _res) => {
    try {
        const { id } = req.params;
        const article = await ContentArticle_1.ContentArticle.findByPk(id);
        if (!article) {
            return _res.status(404).json({ success: false, error: 'Article not found' });
        }
        // Check permissions
        if (req.user.role !== 'admin' &&
            req.user.role !== 'editor' &&
            article.authorId !== Number(req.user.id)) {
            return _res.status(403).json({ success: false, error: 'Permission denied' });
        }
        const interactions = await ContentInteraction_1.default.findAll({
            where: { contentId: id },
            attributes: ['interactionType', [sequelize_2.default.fn('COUNT', sequelize_2.default.col('id')), 'count']],
            group: ['interactionType'],
        });
        const analytics = {
            article: {
                id: article.id,
                title: article.title,
                status: article.status,
                publishedAt: article.publishDate,
            },
            metrics: {
                views: article.viewCount,
                likes: article.likeCount,
                shares: article.shareCount,
                comments: await ContentComment_1.default.count({
                    where: { contentId: id },
                }),
            },
            interactions: interactions.reduce((acc, curr) => {
                acc[curr.interactionType] = curr.get('count');
                return acc;
            }, {}),
            engagementRate: article.viewCount > 0
                ? (((article.likeCount + article.shareCount) / article.viewCount) * 100).toFixed(2)
                : 0,
        };
        _res.json({
            success: true,
            data: analytics,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get article analytics:', error);
        _res.status(500).json({ success: false, error: 'Failed to get analytics' });
    }
};
exports.getArticleAnalytics = getArticleAnalytics;
// Scheduling
const scheduleContent = async (req, _res) => {
    try {
        const { articleId, scheduledDate, action, actionData } = req.body;
        const schedule = await ContentSchedule_1.default.create({
            contentId: articleId,
            scheduledFor: scheduledDate,
            scheduleType: action,
            metadata: actionData,
            createdBy: Number(req.user.id),
        });
        _res.status(201).json({
            success: true,
            data: schedule,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to schedule content:', error);
        _res.status(500).json({ success: false, error: 'Failed to schedule content' });
    }
};
exports.scheduleContent = scheduleContent;
const getScheduledContent = async (_req, _res) => {
    try {
        const schedules = await ContentSchedule_1.default.findAll({
            where: { status: 'pending' },
            include: [
                {
                    model: ContentArticle_1.ContentArticle,
                    as: 'article',
                    attributes: ['id', 'title', 'slug', 'status'],
                },
            ],
            order: [['scheduledFor', 'ASC']],
        });
        _res.json({
            success: true,
            data: schedules,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get scheduled content:', error);
        _res.status(500).json({ success: false, error: 'Failed to get schedules' });
    }
};
exports.getScheduledContent = getScheduledContent;
// Helper functions
function calculateReadability(content) {
    // Simple readability score based on sentence and word length
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    // Flesch Reading Ease approximation
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * (avgWordLength / 4.7);
    return Math.max(0, Math.min(100, score));
}
function analyzeSEO(title, content) {
    const issues = [];
    const suggestions = [];
    // Title checks
    if (title.length < 30)
        issues.push('Title is too short');
    if (title.length > 60)
        issues.push('Title is too long');
    // Content checks
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 300)
        issues.push('Content is too short for SEO');
    // Meta description check (simplified)
    if (!content.includes('meta') && !content.includes('description')) {
        suggestions.push('Add a meta description');
    }
    return {
        score: Math.max(0, 100 - issues.length * 20),
        issues,
        suggestions,
    };
}
function extractKeywords(content) {
    // Simple keyword extraction - in production, use NLP library
    const words = content
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 4)
        .filter(word => !['the', 'and', 'for', 'with', 'from'].includes(word));
    const wordCount = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    return Object.entries(wordCount)
        .sort(([, a], [, b]) => Number(b) - Number(a))
        .slice(0, 10)
        .map(([word]) => word);
}
async function generatePreview(content, format) {
    // Generate preview based on format
    // This is a simplified version - in production, use proper markdown/HTML processors
    if (format === 'markdown') {
        return content.body || content;
    }
    // Simple markdown to HTML conversion
    let html = content.body || content;
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+)\*/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br>');
    return html;
}
//# sourceMappingURL=CMSController.js.map