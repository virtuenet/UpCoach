import { Request, Response } from 'express';
import { ContentCategory } from '../../models/cms/ContentCategory';
import { Content } from '../../models/cms/Content';
import { Op } from 'sequelize';
import slugify from 'slugify';

export class ContentCategoryController {
  // Get all categories with hierarchy
  static async getAll(req: Request, res: Response) {
    try {
      const { isActive = true } = req.query;

      const where: any = {};
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const categories = await ContentCategory.findAll({
        where,
        include: [
          {
            model: ContentCategory,
            as: 'children',
            include: [
              {
                model: ContentCategory,
                as: 'children'
              }
            ]
          }
        ],
        order: [['order', 'ASC'], ['name', 'ASC']]
      });

      // Build hierarchical structure
      const rootCategories = categories.filter(cat => !cat.parentId);

      (res as any).json(rootCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  // Get single category
  static async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const where = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        ? { id }
        : { slug: id };

      const category = await ContentCategory.findOne({
        where,
        include: [
          {
            model: ContentCategory,
            as: 'parent'
          },
          {
            model: ContentCategory,
            as: 'children'
          },
          {
            model: Content,
            as: 'contents',
            attributes: ['id', 'title', 'slug', 'type', 'status', 'publishedAt'],
            where: { status: 'published' },
            required: false
          }
        ]
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      (res as any).json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  }

  // Create new category
  static async create(req: Request, res: Response) {
    try {
      const {
        name,
        description,
        parentId,
        icon,
        color,
        order,
        isActive,
        metadata
      } = req.body;

      // Generate slug
      const baseSlug = slugify(name, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;
      
      // Ensure unique slug
      while (await ContentCategory.findOne({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const category = await ContentCategory.create({
        name,
        slug,
        description,
        parentId,
        icon,
        color,
        order: order || 0,
        isActive: isActive !== false,
        metadata
      });

      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  }

  // Update category
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const category = await ContentCategory.findByPk(id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Update slug if name changed
      if (updates.name && updates.name !== category.name) {
        const baseSlug = slugify(updates.name, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;
        
        while (await ContentCategory.findOne({ where: { slug, id: { [Op.ne as any]: id } } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        updates.slug = slug;
      }

      // Prevent circular parent reference
      if (updates.parentId === id) {
        return res.status(400).json({ error: 'Category cannot be its own parent' });
      }

      await category.update(updates);

      const updatedCategory = await ContentCategory.findByPk(id, {
        include: [
          { model: ContentCategory, as: 'parent' },
          { model: ContentCategory, as: 'children' }
        ]
      });

      (res as any).json(updatedCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  }

  // Delete category
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const category = await ContentCategory.findByPk(id, {
        include: [
          { model: ContentCategory, as: 'children' },
          { model: Content, as: 'contents' }
        ]
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Check if category has children
      if (category.children && category.children.length > 0) {
        return res.status(400).json({ error: 'Cannot delete category with child categories' });
      }

      // Check if category has content
      if (category.contents && category.contents.length > 0) {
        return res.status(400).json({ error: 'Cannot delete category with associated content' });
      }

      await category.destroy();
      (res as any).json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  }

  // Reorder categories
  static async reorder(req: Request, res: Response) {
    try {
      const { categories } = req.body; // Array of { id, order }

      if (!Array.isArray(categories)) {
        return res.status(400).json({ error: 'Categories array is required' });
      }

      // Update order for each category
      for (const cat of categories) {
        await ContentCategory.update(
          { order: cat.order },
          { where: { id: cat.id } }
        );
      }

      (res as any).json({ message: 'Categories reordered successfully' });
    } catch (error) {
      console.error('Error reordering categories:', error);
      res.status(500).json({ error: 'Failed to reorder categories' });
    }
  }

  // Get category content count
  static async getContentCount_(req: Request, res: Response) {
    try {
      const categories = await ContentCategory.findAll({
        attributes: [
          'id',
          'name',
          'slug',
          [
            ContentCategory.sequelize!.literal(`(
              SELECT COUNT(*)
              FROM contents
              WHERE contents.category_id = "ContentCategory"."id"
              AND contents.status = 'published'
            )`),
            'contentCount'
          ]
        ],
        where: { isActive: true }
      });

      (res as any).json(categories);
    } catch (error) {
      console.error('Error fetching category content count:', error);
      res.status(500).json({ error: 'Failed to fetch category content count' });
    }
  }
}