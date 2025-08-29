import { Request, Response } from 'express';
import { Content } from '../../models/cms/Content';
import { ContentCategory } from '../../models/cms/ContentCategory';
import { ContentTag } from '../../models/cms/ContentTag';
import { ContentMedia } from '../../models/cms/ContentMedia';
import { User } from '../../models';
import { Op } from 'sequelize';
import slugify from 'slugify';
import { logger } from '../../utils/logger';

export class ContentController {
  // Get all content with filters
  static async getAll(req: Request, _res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        categoryId,
        authorId,
        isPremium,
        search,
        // tags,
        sortBy = 'publishedAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      
      const where: any = {};
      
      if (status) where.status = status;
      if (type) where.type = type;
      if (categoryId) where.categoryId = categoryId;
      if (authorId) where.authorId = authorId;
      if (isPremium !== undefined) where.isPremium = isPremium === 'true';
      
      if (search) {
        where[Op.or as any] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
          { excerpt: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { rows: contents, count } = await Content.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'avatar']
          },
          {
            model: ContentCategory,
            as: 'category',
            attributes: ['id', 'name', 'slug', 'color']
          },
          {
            model: ContentTag,
            as: 'tags',
            attributes: ['id', 'name', 'slug', 'color'],
            through: { attributes: [] }
          },
          {
            model: ContentMedia,
            as: 'media',
            attributes: ['id', 'type', 'url', 'thumbnailUrl']
          }
        ],
        order: [[sortBy as string, sortOrder as string]],
        limit: Number(limit),
        offset
      });

      _res.json({
        contents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Error fetching content:', error);
      _res.status(500).json({ error: 'Failed to fetch content' });
    }
  }

  // Get single content by ID or slug
  static async getOne(req: Request, _res: Response) {
    try {
      const { id } = req.params;
      
      const where = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        ? { id }
        : { slug: id };

      const content = await Content.findOne({
        where,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email', 'avatar', 'bio']
          },
          {
            model: ContentCategory,
            as: 'category'
          },
          {
            model: ContentTag,
            as: 'tags',
            through: { attributes: [] }
          },
          {
            model: ContentMedia,
            as: 'media'
          }
        ]
      });

      if (!content) {
        return _res.status(404).json({ error: 'Content not found' });
      }

      // Increment view count
      await content.increment('viewCount');

      _res.json(content);
    } catch (error) {
      logger.error('Error fetching content:', error);
      _res.status(500).json({ error: 'Failed to fetch content' });
    }
  }

  // Create new content
  static async create(req: Request, _res: Response) {
    try {
      const {
        title,
        content,
        excerpt,
        type,
        status,
        categoryId,
        featuredImageUrl,
        metaTitle,
        metaDescription,
        metaKeywords,
        publishedAt,
        scheduledAt,
        isPremium,
        settings,
        tags
      } = req.body;

      // Generate slug
      const baseSlug = slugify(title, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;
      
      // Ensure unique slug
      while (await Content.findOne({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Calculate reading time (average 200 words per minute)
      const wordCount = content.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);

      const newContent = await Content.create({
        title,
        slug,
        content,
        excerpt,
        type: type || 'article',
        status: status || 'draft',
        categoryId,
        authorId: (req as any).user!.id,
        featuredImageUrl,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt,
        metaKeywords,
        publishedAt: status === 'published' ? publishedAt || new Date() : null,
        scheduledAt,
        readingTime,
        isPremium: isPremium || false,
        settings
      });

      // Add tags if provided
      if (tags && tags.length > 0) {
        const tagInstances = await ContentTag.findAll({
          where: { id: tags }
        });
        await newContent.setTags(tagInstances);
      }

      // Fetch complete content with associations
      const completeContent = await Content.findByPk(newContent.id, {
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] },
          { model: ContentCategory, as: 'category' },
          { model: ContentTag, as: 'tags', through: { attributes: [] } }
        ]
      });

      _res.status(201).json(completeContent);
    } catch (error) {
      logger.error('Error creating content:', error);
      _res.status(500).json({ error: 'Failed to create content' });
    }
  }

  // Update content
  static async update(req: Request, _res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const content = await Content.findByPk(id);
      if (!content) {
        return _res.status(404).json({ error: 'Content not found' });
      }

      // Check permissions
      if (content.authorId !== (req as any).user!.id && (req as any).user!.role !== 'admin') {
        return _res.status(403).json({ error: 'Unauthorized to update this content' });
      }

      // Update slug if title changed
      if (updates.title && updates.title !== content.title) {
        const baseSlug = slugify(updates.title, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;
        
        while (await Content.findOne({ where: { slug, id: { [Op.ne as any]: id } } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        updates.slug = slug;
      }

      // Update reading time if content changed
      if (updates.content) {
        const wordCount = updates.content.split(/\s+/).length;
        updates.readingTime = Math.ceil(wordCount / 200);
      }

      // Handle publishing
      if (updates.status === 'published' && content.status !== 'published') {
        updates.publishedAt = updates.publishedAt || new Date();
      }

      await content.update(updates);

      // Update tags if provided
      if (updates.tags !== undefined) {
        const tagInstances = await ContentTag.findAll({
          where: { id: updates.tags }
        });
        await content.setTags(tagInstances);
      }

      // Fetch updated content with associations
      const updatedContent = await Content.findByPk(id, {
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] },
          { model: ContentCategory, as: 'category' },
          { model: ContentTag, as: 'tags', through: { attributes: [] } },
          { model: ContentMedia, as: 'media' }
        ]
      });

      _res.json(updatedContent);
    } catch (error) {
      logger.error('Error updating content:', error);
      _res.status(500).json({ error: 'Failed to update content' });
    }
  }

  // Delete content
  static async delete(req: Request, _res: Response) {
    try {
      const { id } = req.params;

      const content = await Content.findByPk(id);
      if (!content) {
        return _res.status(404).json({ error: 'Content not found' });
      }

      // Check permissions
      if (content.authorId !== (req as any).user!.id && (req as any).user!.role !== 'admin') {
        return _res.status(403).json({ error: 'Unauthorized to delete this content' });
      }

      await content.destroy();
      _res.json({ message: 'Content deleted successfully' });
    } catch (error) {
      logger.error('Error deleting content:', error);
      _res.status(500).json({ error: 'Failed to delete content' });
    }
  }

  // Bulk operations
  static async bulkUpdate(req: Request, _res: Response) {
    try {
      const { ids, updates } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return _res.status(400).json({ error: 'No content IDs provided' });
      }

      // Check permissions
      if ((req as any).user!.role !== 'admin') {
        const contents = await Content.findAll({
          where: { id: ids }
        });
        
        const unauthorized = contents.some(c => c.authorId !== (req as any).user!.id);
        if (unauthorized) {
          return _res.status(403).json({ error: 'Unauthorized to update some content' });
        }
      }

      await Content.update(updates, {
        where: { id: ids }
      });

      _res.json({ message: `Updated ${ids.length} content items` });
    } catch (error) {
      logger.error('Error bulk updating content:', error);
      _res.status(500).json({ error: 'Failed to bulk update content' });
    }
  }

  // Get content analytics
  static async getAnalytics(req: Request, _res: Response) {
    try {
      const { id } = req.params;
      const {} = req.query;

      const content = await Content.findByPk(id);
      if (!content) {
        return _res.status(404).json({ error: 'Content not found' });
      }

      // Basic analytics from content model
      const analytics = {
        totalViews: content.viewCount,
        totalLikes: content.likeCount,
        totalShares: content.shareCount,
        readingTime: content.readingTime,
        publishedAt: content.publishedAt
      };

      // TODO: Add more detailed analytics from content_views table
      // This would include views over time, unique visitors, etc.

      _res.json(analytics);
    } catch (error) {
      logger.error('Error fetching content analytics:', error);
      _res.status(500).json({ error: 'Failed to fetch content analytics' });
    }
  }
}