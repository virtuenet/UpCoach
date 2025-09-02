"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentCategoryController = void 0;
const ContentCategory_1 = require("../../models/cms/ContentCategory");
const Content_1 = require("../../models/cms/Content");
const sequelize_1 = require("sequelize");
const slugify_1 = __importDefault(require("slugify"));
const logger_1 = require("../../utils/logger");
class ContentCategoryController {
    // Get all categories with hierarchy
    static async getAll(req, _res) {
        try {
            const { isActive = true } = req.query;
            const where = {};
            if (isActive !== undefined)
                where.isActive = isActive === 'true';
            const categories = await ContentCategory_1.ContentCategory.findAll({
                where,
                include: [
                    {
                        model: ContentCategory_1.ContentCategory,
                        as: 'children',
                        include: [
                            {
                                model: ContentCategory_1.ContentCategory,
                                as: 'children',
                            },
                        ],
                    },
                ],
                order: [
                    ['order', 'ASC'],
                    ['name', 'ASC'],
                ],
            });
            // Build hierarchical structure
            const rootCategories = categories.filter(cat => !cat.parentId);
            _res.json(rootCategories);
        }
        catch (error) {
            logger_1.logger.error('Error fetching categories:', error);
            _res.status(500).json({ error: 'Failed to fetch categories' });
        }
    }
    // Get single category
    static async getOne(req, _res) {
        try {
            const { id } = req.params;
            const where = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
                ? { id }
                : { slug: id };
            const category = await ContentCategory_1.ContentCategory.findOne({
                where,
                include: [
                    {
                        model: ContentCategory_1.ContentCategory,
                        as: 'parent',
                    },
                    {
                        model: ContentCategory_1.ContentCategory,
                        as: 'children',
                    },
                    {
                        model: Content_1.Content,
                        as: 'contents',
                        attributes: ['id', 'title', 'slug', 'type', 'status', 'publishedAt'],
                        where: { status: 'published' },
                        required: false,
                    },
                ],
            });
            if (!category) {
                return _res.status(404).json({ error: 'Category not found' });
            }
            _res.json(category);
        }
        catch (error) {
            logger_1.logger.error('Error fetching category:', error);
            _res.status(500).json({ error: 'Failed to fetch category' });
        }
    }
    // Create new category
    static async create(req, _res) {
        try {
            const { name, description, parentId, icon, color, order, isActive, metadata } = req.body;
            // Generate slug
            const baseSlug = (0, slugify_1.default)(name, { lower: true, strict: true });
            let slug = baseSlug;
            let counter = 1;
            // Ensure unique slug
            while (await ContentCategory_1.ContentCategory.findOne({ where: { slug } })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
            const category = await ContentCategory_1.ContentCategory.create({
                name,
                slug,
                description,
                parentId,
                icon,
                color,
                order: order || 0,
                isActive: isActive !== false,
                metadata,
            });
            _res.status(201).json(category);
        }
        catch (error) {
            logger_1.logger.error('Error creating category:', error);
            _res.status(500).json({ error: 'Failed to create category' });
        }
    }
    // Update category
    static async update(req, _res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const category = await ContentCategory_1.ContentCategory.findByPk(id);
            if (!category) {
                return _res.status(404).json({ error: 'Category not found' });
            }
            // Update slug if name changed
            if (updates.name && updates.name !== category.name) {
                const baseSlug = (0, slugify_1.default)(updates.name, { lower: true, strict: true });
                let slug = baseSlug;
                let counter = 1;
                while (await ContentCategory_1.ContentCategory.findOne({ where: { slug, id: { [sequelize_1.Op.ne]: id } } })) {
                    slug = `${baseSlug}-${counter}`;
                    counter++;
                }
                updates.slug = slug;
            }
            // Prevent circular parent reference
            if (updates.parentId === id) {
                return _res.status(400).json({ error: 'Category cannot be its own parent' });
            }
            await category.update(updates);
            const updatedCategory = await ContentCategory_1.ContentCategory.findByPk(id, {
                include: [
                    { model: ContentCategory_1.ContentCategory, as: 'parent' },
                    { model: ContentCategory_1.ContentCategory, as: 'children' },
                ],
            });
            _res.json(updatedCategory);
        }
        catch (error) {
            logger_1.logger.error('Error updating category:', error);
            _res.status(500).json({ error: 'Failed to update category' });
        }
    }
    // Delete category
    static async delete(req, _res) {
        try {
            const { id } = req.params;
            const category = await ContentCategory_1.ContentCategory.findByPk(id, {
                include: [
                    { model: ContentCategory_1.ContentCategory, as: 'children' },
                    { model: Content_1.Content, as: 'contents' },
                ],
            });
            if (!category) {
                return _res.status(404).json({ error: 'Category not found' });
            }
            // Check if category has children
            if (category.children && category.children.length > 0) {
                return _res.status(400).json({ error: 'Cannot delete category with child categories' });
            }
            // Check if category has content
            if (category.contents && category.contents.length > 0) {
                return _res.status(400).json({ error: 'Cannot delete category with associated content' });
            }
            await category.destroy();
            _res.json({ message: 'Category deleted successfully' });
        }
        catch (error) {
            logger_1.logger.error('Error deleting category:', error);
            _res.status(500).json({ error: 'Failed to delete category' });
        }
    }
    // Reorder categories
    static async reorder(req, _res) {
        try {
            const { categories } = req.body; // Array of { id, order }
            if (!Array.isArray(categories)) {
                return _res.status(400).json({ error: 'Categories array is required' });
            }
            // Update order for each category
            for (const cat of categories) {
                await ContentCategory_1.ContentCategory.update({ order: cat.order }, { where: { id: cat.id } });
            }
            _res.json({ message: 'Categories reordered successfully' });
        }
        catch (error) {
            logger_1.logger.error('Error reordering categories:', error);
            _res.status(500).json({ error: 'Failed to reorder categories' });
        }
    }
    // Get category content count
    static async getContentCount(req, res) {
        try {
            const categories = await ContentCategory_1.ContentCategory.findAll({
                attributes: [
                    'id',
                    'name',
                    'slug',
                    [
                        ContentCategory_1.ContentCategory.sequelize.literal(`(
              SELECT COUNT(*)
              FROM contents
              WHERE contents.category_id = "ContentCategory"."id"
              AND contents.status = 'published'
            )`),
                        'contentCount',
                    ],
                ],
                where: { isActive: true },
            });
            res.json(categories);
        }
        catch (error) {
            logger_1.logger.error('Error fetching category content count:', error);
            res.status(500).json({ error: 'Failed to fetch category content count' });
        }
    }
}
exports.ContentCategoryController = ContentCategoryController;
//# sourceMappingURL=ContentCategoryController.js.map