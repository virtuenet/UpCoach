"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentController = void 0;
const sequelize_1 = require("sequelize");
const slugify_1 = __importDefault(require("slugify"));
const models_1 = require("../../models");
const Content_1 = require("../../models/cms/Content");
const ContentCategory_1 = require("../../models/cms/ContentCategory");
const ContentMedia_1 = require("../../models/cms/ContentMedia");
const ContentTag_1 = require("../../models/cms/ContentTag");
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
            const {} = req.query;
            const content = await Content_1.Content.findByPk(id);
            if (!content) {
                return _res.status(404).json({ error: 'Content not found' });
            }
            const analytics = {
                totalViews: content.viewCount,
                totalLikes: content.likeCount,
                totalShares: content.shareCount,
                readingTime: content.readingTime,
                publishedAt: content.publishedAt,
            };
            _res.json(analytics);
        }
        catch (error) {
            logger_1.logger.error('Error fetching content analytics:', error);
            _res.status(500).json({ error: 'Failed to fetch content analytics' });
        }
    }
}
exports.ContentController = ContentController;
//# sourceMappingURL=ContentController.js.map