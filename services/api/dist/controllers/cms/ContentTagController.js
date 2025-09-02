"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentTagController = void 0;
const ContentTag_1 = require("../../models/cms/ContentTag");
const Content_1 = require("../../models/cms/Content");
const sequelize_1 = require("sequelize");
const slugify_1 = __importDefault(require("slugify"));
const logger_1 = require("../../utils/logger");
class ContentTagController {
    // Get all tags
    static async getAll(req, _res) {
        try {
            const { page = 1, limit = 50, search, isActive, sortBy = 'usageCount', sortOrder = 'DESC', } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const where = {};
            if (isActive !== undefined)
                where.isActive = isActive === 'true';
            if (search) {
                where[sequelize_1.Op.or] = [
                    { name: { [sequelize_1.Op.iLike]: `%${search}%` } },
                    { description: { [sequelize_1.Op.iLike]: `%${search}%` } },
                ];
            }
            const { rows: tags, count } = await ContentTag_1.ContentTag.findAndCountAll({
                where,
                order: [[sortBy, sortOrder]],
                limit: Number(limit),
                offset,
            });
            _res.json({
                tags,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: count,
                    totalPages: Math.ceil(count / Number(limit)),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching tags:', error);
            _res.status(500).json({ error: 'Failed to fetch tags' });
        }
    }
    // Get single tag
    static async getOne(req, _res) {
        try {
            const { id } = req.params;
            const where = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
                ? { id }
                : { slug: id };
            const tag = await ContentTag_1.ContentTag.findOne({
                where,
                include: [
                    {
                        model: Content_1.Content,
                        as: 'contents',
                        attributes: ['id', 'title', 'slug', 'type', 'status', 'publishedAt'],
                        where: { status: 'published' },
                        required: false,
                        through: { attributes: [] },
                    },
                ],
            });
            if (!tag) {
                return _res.status(404).json({ error: 'Tag not found' });
            }
            _res.json(tag);
        }
        catch (error) {
            logger_1.logger.error('Error fetching tag:', error);
            _res.status(500).json({ error: 'Failed to fetch tag' });
        }
    }
    // Create new tag
    static async create(req, _res) {
        try {
            const { name, description, color } = req.body;
            // Generate slug
            const baseSlug = (0, slugify_1.default)(name, { lower: true, strict: true });
            let slug = baseSlug;
            let counter = 1;
            // Ensure unique slug
            while (await ContentTag_1.ContentTag.findOne({ where: { slug } })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
            const tag = await ContentTag_1.ContentTag.create({
                name,
                slug,
                description,
                color: color || '#6B7280',
                isActive: true,
                usageCount: 0,
            });
            _res.status(201).json(tag);
        }
        catch (error) {
            logger_1.logger.error('Error creating tag:', error);
            _res.status(500).json({ error: 'Failed to create tag' });
        }
    }
    // Update tag
    static async update(req, _res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const tag = await ContentTag_1.ContentTag.findByPk(id);
            if (!tag) {
                return _res.status(404).json({ error: 'Tag not found' });
            }
            // Update slug if name changed
            if (updates.name && updates.name !== tag.name) {
                const baseSlug = (0, slugify_1.default)(updates.name, { lower: true, strict: true });
                let slug = baseSlug;
                let counter = 1;
                while (await ContentTag_1.ContentTag.findOne({ where: { slug, id: { [sequelize_1.Op.ne]: id } } })) {
                    slug = `${baseSlug}-${counter}`;
                    counter++;
                }
                updates.slug = slug;
            }
            await tag.update(updates);
            _res.json(tag);
        }
        catch (error) {
            logger_1.logger.error('Error updating tag:', error);
            _res.status(500).json({ error: 'Failed to update tag' });
        }
    }
    // Delete tag
    static async delete(req, _res) {
        try {
            const { id } = req.params;
            const tag = await ContentTag_1.ContentTag.findByPk(id);
            if (!tag) {
                return _res.status(404).json({ error: 'Tag not found' });
            }
            // Check if tag is in use
            if (tag.usageCount > 0) {
                return _res.status(400).json({ error: 'Cannot delete tag that is in use' });
            }
            await tag.destroy();
            _res.json({ message: 'Tag deleted successfully' });
        }
        catch (error) {
            logger_1.logger.error('Error deleting tag:', error);
            _res.status(500).json({ error: 'Failed to delete tag' });
        }
    }
    // Merge tags
    static async merge(req, _res) {
        try {
            const { sourceTagIds, targetTagId } = req.body;
            if (!Array.isArray(sourceTagIds) || sourceTagIds.length === 0) {
                return _res.status(400).json({ error: 'Source tag IDs are required' });
            }
            if (!targetTagId) {
                return _res.status(400).json({ error: 'Target tag ID is required' });
            }
            const targetTag = await ContentTag_1.ContentTag.findByPk(targetTagId);
            if (!targetTag) {
                return _res.status(404).json({ error: 'Target tag not found' });
            }
            // Get all contents with source tags
            const contents = await Content_1.Content.findAll({
                include: [
                    {
                        model: ContentTag_1.ContentTag,
                        as: 'tags',
                        where: { id: sourceTagIds },
                        through: { attributes: [] },
                    },
                ],
            });
            // Update content tags
            for (const content of contents) {
                const currentTags = await content.getTags();
                const currentTagIds = currentTags.map((t) => t.id);
                // Remove source tags
                const newTagIds = currentTagIds.filter((id) => !sourceTagIds.includes(id));
                // Add target tag if not already present
                if (!newTagIds.includes(targetTagId)) {
                    newTagIds.push(targetTagId);
                }
                const tagInstances = await ContentTag_1.ContentTag.findAll({
                    where: { id: newTagIds },
                });
                await content.setTags(tagInstances);
            }
            // Delete source tags
            await ContentTag_1.ContentTag.destroy({
                where: { id: sourceTagIds },
            });
            _res.json({ message: 'Tags merged successfully' });
        }
        catch (error) {
            logger_1.logger.error('Error merging tags:', error);
            _res.status(500).json({ error: 'Failed to merge tags' });
        }
    }
    // Get popular tags
    static async getPopular(req, _res) {
        try {
            const { limit = 20 } = req.query;
            const tags = await ContentTag_1.ContentTag.findAll({
                where: {
                    isActive: true,
                    usageCount: { [sequelize_1.Op.gt]: 0 },
                },
                order: [['usageCount', 'DESC']],
                limit: Number(limit),
            });
            _res.json(tags);
        }
        catch (error) {
            logger_1.logger.error('Error fetching popular tags:', error);
            _res.status(500).json({ error: 'Failed to fetch popular tags' });
        }
    }
    // Get tag suggestions
    static async getSuggestions(req, _res) {
        try {
            const { query } = req.query;
            if (!query || String(query).trim().length < 2) {
                return _res.json([]);
            }
            const tags = await ContentTag_1.ContentTag.findAll({
                where: {
                    isActive: true,
                    name: { [sequelize_1.Op.iLike]: `%${query}%` },
                },
                order: [['usageCount', 'DESC']],
                limit: 10,
                attributes: ['id', 'name', 'slug', 'color'],
            });
            _res.json(tags);
        }
        catch (error) {
            logger_1.logger.error('Error fetching tag suggestions:', error);
            _res.status(500).json({ error: 'Failed to fetch tag suggestions' });
        }
    }
}
exports.ContentTagController = ContentTagController;
//# sourceMappingURL=ContentTagController.js.map