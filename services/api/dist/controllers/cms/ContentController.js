"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentController = void 0;
const tslib_1 = require("tslib");
const sequelize_1 = require("sequelize");
const slugify_1 = tslib_1.__importDefault(require("slugify"));
const models_1 = require("../../models");
const Content_1 = require("../../models/cms/Content");
const ContentCategory_1 = require("../../models/cms/ContentCategory");
const ContentMedia_1 = require("../../models/cms/ContentMedia");
const ContentTag_1 = require("../../models/cms/ContentTag");
const models_2 = require("../../models");
const logger_1 = require("../../utils/logger");
class ContentController {
    static async getAll(req, _res) {
        try {
            const { page = 1, limit = 20, status, type, categoryId, authorId, isPremium, search, sortBy = 'publishedAt', sortOrder = 'DESC', } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const where = {};
            if (status)
                where.status = status;
            if (type)
                where.type = type;
            if (categoryId)
                where.categoryId = categoryId;
            if (authorId)
                where.authorId = authorId;
            if (isPremium !== undefined)
                where.isPremium = isPremium === 'true';
            if (search) {
                where[sequelize_1.Op.or] = [
                    { title: { [sequelize_1.Op.iLike]: `%${search}%` } },
                    { content: { [sequelize_1.Op.iLike]: `%${search}%` } },
                    { excerpt: { [sequelize_1.Op.iLike]: `%${search}%` } },
                ];
            }
            const { rows: contents, count } = await Content_1.Content.findAndCountAll({
                where,
                include: [
                    {
                        model: models_1.User,
                        as: 'author',
                        attributes: ['id', 'name', 'email', 'avatar'],
                    },
                    {
                        model: ContentCategory_1.ContentCategory,
                        as: 'category',
                        attributes: ['id', 'name', 'slug', 'color'],
                    },
                    {
                        model: ContentTag_1.ContentTag,
                        as: 'tags',
                        attributes: ['id', 'name', 'slug', 'color'],
                        through: { attributes: [] },
                    },
                    {
                        model: ContentMedia_1.ContentMedia,
                        as: 'media',
                        attributes: ['id', 'type', 'url', 'thumbnailUrl'],
                    },
                ],
                order: [[sortBy, sortOrder]],
                limit: Number(limit),
                offset,
            });
            _res.json({
                contents,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: count,
                    totalPages: Math.ceil(count / Number(limit)),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching content:', error);
            _res.status(500).json({ error: 'Failed to fetch content' });
        }
    }
    static async getOne(req, _res) {
        try {
            const { id } = req.params;
            const where = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
                ? { id }
                : { slug: id };
            const content = await Content_1.Content.findOne({
                where,
                include: [
                    {
                        model: models_1.User,
                        as: 'author',
                        attributes: ['id', 'name', 'email', 'avatar', 'bio'],
                    },
                    {
                        model: ContentCategory_1.ContentCategory,
                        as: 'category',
                    },
                    {
                        model: ContentTag_1.ContentTag,
                        as: 'tags',
                        through: { attributes: [] },
                    },
                    {
                        model: ContentMedia_1.ContentMedia,
                        as: 'media',
                    },
                ],
            });
            if (!content) {
                return _res.status(404).json({ error: 'Content not found' });
            }
            await content.increment('viewCount');
            _res.json(content);
        }
        catch (error) {
            logger_1.logger.error('Error fetching content:', error);
            _res.status(500).json({ error: 'Failed to fetch content' });
        }
    }
    static async create(req, _res) {
        try {
            const { title, content, excerpt, type, status, categoryId, featuredImageUrl, metaTitle, metaDescription, metaKeywords, publishedAt, scheduledAt, isPremium, settings, tags, } = req.body;
            const baseSlug = (0, slugify_1.default)(title, { lower: true, strict: true });
            let slug = baseSlug;
            let counter = 1;
            while (await Content_1.Content.findOne({ where: { slug } })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
            const wordCount = content.split(/\s+/).length;
            const readingTime = Math.ceil(wordCount / 200);
            const newContent = await Content_1.Content.create({
                title,
                slug,
                content,
                excerpt,
                type: type || 'article',
                status: status || 'draft',
                categoryId,
                authorId: req.user.id,
                featuredImageUrl,
                metaTitle: metaTitle || title,
                metaDescription: metaDescription || excerpt,
                metaKeywords,
                publishedAt: status === 'published' ? publishedAt || new Date() : null,
                scheduledAt,
                readingTime,
                isPremium: isPremium || false,
                settings,
            });
            if (tags && tags.length > 0) {
                const tagInstances = await ContentTag_1.ContentTag.findAll({
                    where: { id: tags },
                });
                await newContent.setTags(tagInstances);
            }
            const completeContent = await Content_1.Content.findByPk(newContent.id, {
                include: [
                    { model: models_1.User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] },
                    { model: ContentCategory_1.ContentCategory, as: 'category' },
                    { model: ContentTag_1.ContentTag, as: 'tags', through: { attributes: [] } },
                ],
            });
            _res.status(201).json(completeContent);
        }
        catch (error) {
            logger_1.logger.error('Error creating content:', error);
            _res.status(500).json({ error: 'Failed to create content' });
        }
    }
    static async update(req, _res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const content = await Content_1.Content.findByPk(id);
            if (!content) {
                return _res.status(404).json({ error: 'Content not found' });
            }
            if (content.authorId !== req.user.id && req.user.role !== 'admin') {
                return _res.status(403).json({ error: 'Unauthorized to update this content' });
            }
            if (updates.title && updates.title !== content.title) {
                const baseSlug = (0, slugify_1.default)(updates.title, { lower: true, strict: true });
                let slug = baseSlug;
                let counter = 1;
                while (await Content_1.Content.findOne({ where: { slug, id: { [sequelize_1.Op.ne]: id } } })) {
                    slug = `${baseSlug}-${counter}`;
                    counter++;
                }
                updates.slug = slug;
            }
            if (updates.content) {
                const wordCount = updates.content.split(/\s+/).length;
                updates.readingTime = Math.ceil(wordCount / 200);
            }
            if (updates.status === 'published' && content.status !== 'published') {
                updates.publishedAt = updates.publishedAt || new Date();
            }
            await content.update(updates);
            if (updates.tags !== undefined) {
                const tagInstances = await ContentTag_1.ContentTag.findAll({
                    where: { id: updates.tags },
                });
                await content.setTags(tagInstances);
            }
            const updatedContent = await Content_1.Content.findByPk(id, {
                include: [
                    { model: models_1.User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] },
                    { model: ContentCategory_1.ContentCategory, as: 'category' },
                    { model: ContentTag_1.ContentTag, as: 'tags', through: { attributes: [] } },
                    { model: ContentMedia_1.ContentMedia, as: 'media' },
                ],
            });
            _res.json(updatedContent);
        }
        catch (error) {
            logger_1.logger.error('Error updating content:', error);
            _res.status(500).json({ error: 'Failed to update content' });
        }
    }
    static async delete(req, _res) {
        try {
            const { id } = req.params;
            const content = await Content_1.Content.findByPk(id);
            if (!content) {
                return _res.status(404).json({ error: 'Content not found' });
            }
            if (content.authorId !== req.user.id && req.user.role !== 'admin') {
                return _res.status(403).json({ error: 'Unauthorized to delete this content' });
            }
            await content.destroy();
            _res.json({ message: 'Content deleted successfully' });
        }
        catch (error) {
            logger_1.logger.error('Error deleting content:', error);
            _res.status(500).json({ error: 'Failed to delete content' });
        }
    }
    static async bulkUpdate(req, _res) {
        try {
            const { ids, updates } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return _res.status(400).json({ error: 'No content IDs provided' });
            }
            if (req.user.role !== 'admin') {
                const contents = await Content_1.Content.findAll({
                    where: { id: ids },
                });
                const unauthorized = contents.some(c => c.authorId !== req.user.id);
                if (unauthorized) {
                    return _res.status(403).json({ error: 'Unauthorized to update some content' });
                }
            }
            await Content_1.Content.update(updates, {
                where: { id: ids },
            });
            _res.json({ message: `Updated ${ids.length} content items` });
        }
        catch (error) {
            logger_1.logger.error('Error bulk updating content:', error);
            _res.status(500).json({ error: 'Failed to bulk update content' });
        }
    }
    static async getAnalytics(req, _res) {
        try {
            const { id } = req.params;
            const { timeframe = '30d', includeDetailed = 'true' } = req.query;
            const content = await Content_1.Content.findByPk(id, {
                include: [
                    { model: models_1.User, as: 'author', attributes: ['id', 'name', 'email'] },
                    { model: ContentCategory_1.ContentCategory, as: 'category', attributes: ['id', 'name'] },
                    { model: ContentTag_1.ContentTag, as: 'tags', attributes: ['id', 'name'] },
                ],
            });
            if (!content) {
                return _res.status(404).json({ error: 'Content not found' });
            }
            const daysBack = this.parseTimeframe(timeframe);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);
            const basicAnalytics = {
                totalViews: content.viewCount || 0,
                totalLikes: content.likeCount || 0,
                totalShares: content.shareCount || 0,
                totalComments: content.commentCount || 0,
                readingTime: content.readingTime || 0,
                publishedAt: content.publishedAt,
                lastUpdated: content.updatedAt,
                status: content.status,
                contentInfo: {
                    title: content.title,
                    type: content.type,
                    wordCount: content.wordCount || 0,
                    author: content.author?.name || 'Unknown',
                    category: content.category?.name || 'Uncategorized',
                    tags: content.tags?.map((tag) => tag.name) || [],
                },
            };
            let detailedAnalytics = {};
            if (includeDetailed === 'true') {
                const viewAnalytics = await this.getViewAnalytics(id, startDate);
                const engagementAnalytics = await this.getEngagementAnalytics(id, startDate);
                const performanceAnalytics = await this.getPerformanceAnalytics(id);
                const demographicsAnalytics = await this.getDemographicsAnalytics(id, startDate);
                detailedAnalytics = {
                    viewAnalytics,
                    engagementAnalytics,
                    performanceAnalytics,
                    demographicsAnalytics,
                    timeframe: {
                        period: timeframe,
                        startDate,
                        endDate: new Date(),
                        daysAnalyzed: daysBack,
                    },
                };
            }
            const analytics = {
                contentId: id,
                ...basicAnalytics,
                ...detailedAnalytics,
                generatedAt: new Date(),
            };
            _res.json({
                success: true,
                data: analytics,
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching content analytics:', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to fetch content analytics',
            });
        }
    }
    static async getAggregatedAnalytics(req, _res) {
        try {
            const { timeframe = '30d', authorId, categoryId, contentType, limit = 50, } = req.query;
            const daysBack = ContentController.parseTimeframe(timeframe);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);
            let whereClause = 'WHERE c.status = \'published\'';
            const replacements = { startDate };
            if (authorId) {
                whereClause += ' AND c.author_id = :authorId';
                replacements.authorId = authorId;
            }
            if (categoryId) {
                whereClause += ' AND c.category_id = :categoryId';
                replacements.categoryId = categoryId;
            }
            if (contentType) {
                whereClause += ' AND c.type = :contentType';
                replacements.contentType = contentType;
            }
            const [topContent] = await models_2.sequelize.query(`SELECT
           c.id, c.title, c.type, c.view_count, c.like_count, c.share_count,
           c.published_at, u.name as author_name, cat.name as category_name,
           (c.view_count + (c.like_count * 5) + (c.share_count * 10)) as engagement_score
         FROM content c
         LEFT JOIN users u ON c.author_id = u.id
         LEFT JOIN content_categories cat ON c.category_id = cat.id
         ${whereClause}
         ORDER BY engagement_score DESC
         LIMIT :limit`, {
                replacements: { ...replacements, limit: parseInt(limit) },
                type: sequelize_1.QueryTypes.SELECT,
            });
            const [overallStats] = await models_2.sequelize.query(`SELECT
           COUNT(*) as total_content,
           SUM(c.view_count) as total_views,
           SUM(c.like_count) as total_likes,
           SUM(c.share_count) as total_shares,
           AVG(c.view_count) as avg_views,
           AVG(c.reading_time) as avg_reading_time
         FROM content c
         ${whereClause}`, {
                replacements,
                type: sequelize_1.QueryTypes.SELECT,
            });
            const [trendsData] = await models_2.sequelize.query(`SELECT
           DATE(c.published_at) as date,
           COUNT(*) as published_count,
           SUM(c.view_count) as total_views,
           AVG(c.view_count) as avg_views
         FROM content c
         ${whereClause}
         AND c.published_at >= :startDate
         GROUP BY DATE(c.published_at)
         ORDER BY date ASC`, {
                replacements,
                type: sequelize_1.QueryTypes.SELECT,
            });
            const [typeDistribution] = await models_2.sequelize.query(`SELECT
           c.type,
           COUNT(*) as count,
           SUM(c.view_count) as total_views,
           AVG(c.view_count) as avg_views
         FROM content c
         ${whereClause}
         GROUP BY c.type
         ORDER BY total_views DESC`, {
                replacements,
                type: sequelize_1.QueryTypes.SELECT,
            });
            _res.json({
                success: true,
                data: {
                    timeframe: {
                        period: timeframe,
                        startDate,
                        endDate: new Date(),
                        daysAnalyzed: daysBack,
                    },
                    overallStats: overallStats[0],
                    topContent,
                    trends: trendsData,
                    typeDistribution,
                    generatedAt: new Date(),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching aggregated analytics:', error);
            _res.status(500).json({
                success: false,
                error: 'Failed to fetch aggregated analytics',
            });
        }
    }
    static async getViewAnalytics(contentId, startDate) {
        try {
            const [viewsOverTime] = await models_2.sequelize.query(`SELECT
           DATE(created_at) as date,
           COUNT(*) as views,
           COUNT(DISTINCT user_id) as unique_viewers
         FROM content_views
         WHERE content_id = :contentId
         AND created_at >= :startDate
         GROUP BY DATE(created_at)
         ORDER BY date ASC`, {
                replacements: { contentId, startDate },
                type: sequelize_1.QueryTypes.SELECT,
            });
            const [deviceStats] = await models_2.sequelize.query(`SELECT
           device_type,
           COUNT(*) as views,
           COUNT(DISTINCT user_id) as unique_viewers
         FROM content_views
         WHERE content_id = :contentId
         AND created_at >= :startDate
         GROUP BY device_type`, {
                replacements: { contentId, startDate },
                type: sequelize_1.QueryTypes.SELECT,
            });
            const [referrerStats] = await models_2.sequelize.query(`SELECT
           referrer_source,
           COUNT(*) as views
         FROM content_views
         WHERE content_id = :contentId
         AND created_at >= :startDate
         AND referrer_source IS NOT NULL
         GROUP BY referrer_source
         ORDER BY views DESC
         LIMIT 10`, {
                replacements: { contentId, startDate },
                type: sequelize_1.QueryTypes.SELECT,
            });
            return {
                viewsOverTime,
                deviceStats,
                referrerStats,
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching view analytics:', error);
            return { viewsOverTime: [], deviceStats: [], referrerStats: [] };
        }
    }
    static async getEngagementAnalytics(contentId, startDate) {
        try {
            const [engagementOverTime] = await models_2.sequelize.query(`SELECT
           DATE(created_at) as date,
           SUM(CASE WHEN action_type = 'like' THEN 1 ELSE 0 END) as likes,
           SUM(CASE WHEN action_type = 'share' THEN 1 ELSE 0 END) as shares,
           SUM(CASE WHEN action_type = 'comment' THEN 1 ELSE 0 END) as comments,
           SUM(CASE WHEN action_type = 'bookmark' THEN 1 ELSE 0 END) as bookmarks
         FROM content_interactions
         WHERE content_id = :contentId
         AND created_at >= :startDate
         GROUP BY DATE(created_at)
         ORDER BY date ASC`, {
                replacements: { contentId, startDate },
                type: sequelize_1.QueryTypes.SELECT,
            });
            const [readingBehavior] = await models_2.sequelize.query(`SELECT
           AVG(time_spent) as avg_time_spent,
           AVG(scroll_depth) as avg_scroll_depth,
           COUNT(*) as total_readings
         FROM content_reading_sessions
         WHERE content_id = :contentId
         AND created_at >= :startDate`, {
                replacements: { contentId, startDate },
                type: sequelize_1.QueryTypes.SELECT,
            });
            return {
                engagementOverTime,
                readingBehavior: readingBehavior[0],
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching engagement analytics:', error);
            return { engagementOverTime: [], readingBehavior: {} };
        }
    }
    static async getPerformanceAnalytics(contentId) {
        try {
            const content = await Content_1.Content.findByPk(contentId);
            if (!content)
                return {};
            const totalEngagements = (content.likeCount || 0) + (content.shareCount || 0) + (content.commentCount || 0);
            const engagementRate = content.viewCount > 0 ? (totalEngagements / content.viewCount) * 100 : 0;
            const [similarContent] = await models_2.sequelize.query(`SELECT
           AVG(view_count) as avg_views,
           AVG(like_count) as avg_likes,
           AVG(share_count) as avg_shares
         FROM content
         WHERE type = (SELECT type FROM content WHERE id = :contentId)
         AND status = 'published'
         AND id != :contentId`, {
                replacements: { contentId },
                type: sequelize_1.QueryTypes.SELECT,
            });
            const comparison = similarContent[0];
            return {
                engagementRate: Math.round(engagementRate * 100) / 100,
                performanceVsAverage: {
                    views: comparison?.avg_views ? Math.round(((content.viewCount || 0) / comparison.avg_views - 1) * 100) : 0,
                    likes: comparison?.avg_likes ? Math.round(((content.likeCount || 0) / comparison.avg_likes - 1) * 100) : 0,
                    shares: comparison?.avg_shares ? Math.round(((content.shareCount || 0) / comparison.avg_shares - 1) * 100) : 0,
                },
                totalEngagements,
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching performance analytics:', error);
            return {};
        }
    }
    static async getDemographicsAnalytics(contentId, startDate) {
        try {
            const [ageGroups] = await models_2.sequelize.query(`SELECT
           CASE
             WHEN TIMESTAMPDIFF(YEAR, u.birth_date, CURDATE()) < 25 THEN '18-24'
             WHEN TIMESTAMPDIFF(YEAR, u.birth_date, CURDATE()) < 35 THEN '25-34'
             WHEN TIMESTAMPDIFF(YEAR, u.birth_date, CURDATE()) < 45 THEN '35-44'
             WHEN TIMESTAMPDIFF(YEAR, u.birth_date, CURDATE()) < 55 THEN '45-54'
             ELSE '55+'
           END as age_group,
           COUNT(*) as views
         FROM content_views cv
         JOIN users u ON cv.user_id = u.id
         WHERE cv.content_id = :contentId
         AND cv.created_at >= :startDate
         AND u.birth_date IS NOT NULL
         GROUP BY age_group
         ORDER BY views DESC`, {
                replacements: { contentId, startDate },
                type: sequelize_1.QueryTypes.SELECT,
            });
            const [locationStats] = await models_2.sequelize.query(`SELECT
           u.country,
           COUNT(*) as views
         FROM content_views cv
         JOIN users u ON cv.user_id = u.id
         WHERE cv.content_id = :contentId
         AND cv.created_at >= :startDate
         AND u.country IS NOT NULL
         GROUP BY u.country
         ORDER BY views DESC
         LIMIT 10`, {
                replacements: { contentId, startDate },
                type: sequelize_1.QueryTypes.SELECT,
            });
            return {
                ageGroups,
                topCountries: locationStats,
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching demographics analytics:', error);
            return { ageGroups: [], topCountries: [] };
        }
    }
    static parseTimeframe(timeframe) {
        const timeframeMap = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '1y': 365,
        };
        return timeframeMap[timeframe] || 30;
    }
}
exports.ContentController = ContentController;
