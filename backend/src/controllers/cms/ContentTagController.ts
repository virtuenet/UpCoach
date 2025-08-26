import { Request, Response } from 'express';
import { ContentTag } from '../../models/cms/ContentTag';
import { Content } from '../../models/cms/Content';
import { Op } from 'sequelize';
import slugify from 'slugify';

export class ContentTagController {
  // Get all tags
  static async getAll(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        isActive,
        sortBy = 'usageCount',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      
      const where: any = {};
      
      if (isActive !== undefined) where.isActive = isActive === 'true';
      
      if (search) {
        where[Op.or as any] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { rows: tags, count } = await ContentTag.findAndCountAll({
        where,
        order: [[sortBy as string, sortOrder as string]],
        limit: Number(limit),
        offset
      });

      (res as any).json({
        tags,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Error fetching tags:', error);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  }

  // Get single tag
  static async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const where = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        ? { id }
        : { slug: id };

      const tag = await ContentTag.findOne({
        where,
        include: [
          {
            model: Content,
            as: 'contents',
            attributes: ['id', 'title', 'slug', 'type', 'status', 'publishedAt'],
            where: { status: 'published' },
            required: false,
            through: { attributes: [] }
          }
        ]
      });

      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }

      (res as any).json(tag);
    } catch (error) {
      logger.error('Error fetching tag:', error);
      res.status(500).json({ error: 'Failed to fetch tag' });
    }
  }

  // Create new tag
  static async create(req: Request, res: Response) {
    try {
      const { name, description, color } = req.body;

      // Generate slug
      const baseSlug = slugify(name, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;
      
      // Ensure unique slug
      while (await ContentTag.findOne({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const tag = await ContentTag.create({
        name,
        slug,
        description,
        color: color || '#6B7280',
        isActive: true,
        usageCount: 0
      });

      res.status(201).json(tag);
    } catch (error) {
      logger.error('Error creating tag:', error);
      res.status(500).json({ error: 'Failed to create tag' });
    }
  }

  // Update tag
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const tag = await ContentTag.findByPk(id);
      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }

      // Update slug if name changed
      if (updates.name && updates.name !== tag.name) {
        const baseSlug = slugify(updates.name, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;
        
        while (await ContentTag.findOne({ where: { slug, id: { [Op.ne as any]: id } } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        updates.slug = slug;
      }

      await tag.update(updates);
      (res as any).json(tag);
    } catch (error) {
      logger.error('Error updating tag:', error);
      res.status(500).json({ error: 'Failed to update tag' });
    }
  }

  // Delete tag
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const tag = await ContentTag.findByPk(id);
      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }

      // Check if tag is in use
      if (tag.usageCount > 0) {
        return res.status(400).json({ error: 'Cannot delete tag that is in use' });
      }

      await tag.destroy();
      (res as any).json({ message: 'Tag deleted successfully' });
    } catch (error) {
      logger.error('Error deleting tag:', error);
      res.status(500).json({ error: 'Failed to delete tag' });
    }
  }

  // Merge tags
  static async merge(req: Request, res: Response) {
    try {
      const { sourceTagIds, targetTagId } = req.body;

      if (!Array.isArray(sourceTagIds) || sourceTagIds.length === 0) {
        return res.status(400).json({ error: 'Source tag IDs are required' });
      }

      if (!targetTagId) {
        return res.status(400).json({ error: 'Target tag ID is required' });
      }

      const targetTag = await ContentTag.findByPk(targetTagId);
      if (!targetTag) {
        return res.status(404).json({ error: 'Target tag not found' });
      }

      // Get all contents with source tags
      const contents = await Content.findAll({
        include: [
          {
            model: ContentTag,
            as: 'tags',
            where: { id: sourceTagIds },
            through: { attributes: [] }
          }
        ]
      });

      // Update content tags
      for (const content of contents) {
        const currentTags = await content.getTags();
        const currentTagIds = currentTags.map((t: ContentTag) => t.id);
        
        // Remove source tags
        const newTagIds = currentTagIds.filter((id: string) => !sourceTagIds.includes(id));
        
        // Add target tag if not already present
        if (!newTagIds.includes(targetTagId)) {
          newTagIds.push(targetTagId);
        }

        const tagInstances = await ContentTag.findAll({
          where: { id: newTagIds }
        });
        await content.setTags(tagInstances);
      }

      // Delete source tags
      await ContentTag.destroy({
        where: { id: sourceTagIds }
      });

      (res as any).json({ message: 'Tags merged successfully' });
    } catch (error) {
      logger.error('Error merging tags:', error);
      res.status(500).json({ error: 'Failed to merge tags' });
    }
  }

  // Get popular tags
  static async getPopular(req: Request, res: Response) {
    try {
      const { limit = 20 } = req.query;

      const tags = await ContentTag.findAll({
        where: {
          isActive: true,
          usageCount: { [Op.gt]: 0 }
        },
        order: [['usageCount', 'DESC']],
        limit: Number(limit)
      });

      (res as any).json(tags);
    } catch (error) {
      logger.error('Error fetching popular tags:', error);
      res.status(500).json({ error: 'Failed to fetch popular tags' });
    }
  }

  // Get tag suggestions
  static async getSuggestions(req: Request, res: Response) {
    try {
      const { query } = req.query;

      if (!query || String(query).trim().length < 2) {
        return (res as any).json([]);
      }

      const tags = await ContentTag.findAll({
        where: {
          isActive: true,
          name: { [Op.iLike]: `%${query}%` }
        },
        order: [['usageCount', 'DESC']],
        limit: 10,
        attributes: ['id', 'name', 'slug', 'color']
      });

      (res as any).json(tags);
    } catch (error) {
      logger.error('Error fetching tag suggestions:', error);
      res.status(500).json({ error: 'Failed to fetch tag suggestions' });
    }
  }
}