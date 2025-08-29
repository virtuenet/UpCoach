import { Request, Response } from 'express';
import { Template } from '../../models';
import { Op } from 'sequelize';
import { validationResult } from 'express-validator';
import { logger } from '../../utils/logger';

/**
 * TemplateController
 * Handles content templates and automation workflows
 */
export class TemplateController {
  /**
   * Get all templates with filtering
   */
  static async getTemplates(req: Request, _res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        type,
        search,
        tags,
        sortBy = 'updatedAt',
        sortOrder = 'DESC',
        includePublic = true,
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {
        isActive: true,
      };

      // Apply filters
      if (category) {
        whereClause.category = category;
      }

      if (type) {
        whereClause.type = type;
      }

      if (search) {
        whereClause[Op.or as any] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (tags) {
        const tagArray = (tags as string).split(',').map(tag => tag.trim());
        whereClause.tags = { [Op.overlap]: tagArray };
      }

      // Filter by ownership and public templates
      if (includePublic === 'true') {
        whereClause[Op.or as any] = [
          { createdById: (req as any).user!.id },
          { isPublic: true },
        ];
      } else {
        whereClause.createdById = (req as any).user!.id;
      }

      const templates = await Template.findAndCountAll({
        where: whereClause,
        order: [[sortBy as string, sortOrder as string]],
        limit: Number(limit),
        offset,
      });

      _res.json({
        success: true,
        data: templates.rows,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(templates.count / Number(limit)),
          totalItems: templates.count,
          itemsPerPage: Number(limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching templates:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to fetch templates',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Get popular templates
   */
  static async getPopularTemplates(req: Request, _res: Response): Promise<void> {
    try {
      const { category, limit = 10 } = req.query;

      const templates = await Template.getPopularTemplates(category as string);

      _res.json({
        success: true,
        data: templates.slice(0, Number(limit)),
      });
    } catch (error) {
      logger.error('Error fetching popular templates:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to fetch popular templates',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Search templates
   */
  static async searchTemplates(req: Request, _res: Response): Promise<void> {
    try {
      const { q: query, category } = req.query;

      if (!query) {
        _res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
        return;
      }

      const templates = await Template.searchTemplates(query as string, category as string);

      _res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      logger.error('Error searching templates:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to search templates',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Create a new template
   */
  static async createTemplate(req: Request, _res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        _res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const {
        name,
        description,
        category,
        type,
        template,
        automation,
        isPublic,
        tags,
      } = req.body;

      const newTemplate = await Template.create({
        name,
        description,
        category,
        type: type || 'content',
        template,
        automation: automation || null,
        isPublic: isPublic || false,
        isActive: true,
        version: '1.0.0',
        tags: tags || [],
        createdById: (req as any).user!.id,
        usage: {
          timesUsed: 0,
          lastUsed: null,
          popularVariations: [],
        },
      });

      _res.status(201).json({
        success: true,
        data: newTemplate,
        message: 'Template created successfully',
      });
    } catch (error) {
      logger.error('Error creating template:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to create template',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Get a single template
   */
  static async getTemplate(req: Request, _res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const template = await Template.findByPk(id);
      if (!template) {
        _res.status(404).json({
          success: false,
          message: 'Template not found',
        });
        return;
      }

      // Check access permissions
      if (!template.isPublic && template.createdById !== (req as any).user!.id && (req as any).user!.role !== 'admin') {
        _res.status(403).json({
          success: false,
          message: 'Access denied to this template',
        });
        return;
      }

      _res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      logger.error('Error fetching template:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to fetch template',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Update a template
   */
  static async updateTemplate(req: Request, _res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        template,
        automation,
        isPublic,
        tags,
        isActive,
      } = req.body;

      const existingTemplate = await Template.findByPk(id);
      if (!existingTemplate) {
        _res.status(404).json({
          success: false,
          message: 'Template not found',
        });
        return;
      }

      // Check permissions
      if (existingTemplate.createdById !== (req as any).user!.id && (req as any).user!.role !== 'admin') {
        _res.status(403).json({
          success: false,
          message: 'Not authorized to edit this template',
        });
        return;
      }

      await existingTemplate.update({
        name: name !== undefined ? name : existingTemplate.name,
        description: description !== undefined ? description : existingTemplate.description,
        template: template !== undefined ? template : existingTemplate.template,
        automation: automation !== undefined ? automation : existingTemplate.automation,
        isPublic: isPublic !== undefined ? isPublic : existingTemplate.isPublic,
        tags: tags !== undefined ? tags : existingTemplate.tags,
        isActive: isActive !== undefined ? isActive : existingTemplate.isActive,
        version: '1.0.1', // Increment version on updates
      });

      _res.json({
        success: true,
        data: existingTemplate,
        message: 'Template updated successfully',
      });
    } catch (error) {
      logger.error('Error updating template:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to update template',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(req: Request, _res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const template = await Template.findByPk(id);
      if (!template) {
        _res.status(404).json({
          success: false,
          message: 'Template not found',
        });
        return;
      }

      // Check permissions
      if (template.createdById !== (req as any).user!.id && (req as any).user!.role !== 'admin') {
        _res.status(403).json({
          success: false,
          message: 'Not authorized to delete this template',
        });
        return;
      }

      // Soft delete by marking as inactive
      await template.update({ isActive: false });

      _res.json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting template:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to delete template',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Duplicate a template
   */
  static async duplicateTemplate(req: Request, _res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const duplicated = await Template.duplicateTemplate(id, (req as any).user!.id);

      _res.status(201).json({
        success: true,
        data: duplicated,
        message: 'Template duplicated successfully',
      });
    } catch (error) {
      logger.error('Error duplicating template:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to duplicate template',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Create content from template
   */
  static async createContentFromTemplate(req: Request, _res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, customContent, autoPublish } = req.body;

      const template = await Template.findByPk(id);
      if (!template) {
        _res.status(404).json({
          success: false,
          message: 'Template not found',
        });
        return;
      }

      // Check access permissions
      if (!template.isPublic && template.createdById !== (req as any).user!.id && (req as any).user!.role !== 'admin') {
        _res.status(403).json({
          success: false,
          message: 'Access denied to this template',
        });
        return;
      }

      const contentData = await template.createContentFromTemplate({
        title,
        customContent,
        autoPublish,
        userId: (req as any).user!.id,
      });

      _res.status(201).json({
        success: true,
        data: contentData,
        message: 'Content created from template successfully',
      });
    } catch (error) {
      logger.error('Error creating content from template:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to create content from template',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Get user's templates
   */
  static async getUserTemplates(req: Request, _res: Response): Promise<void> {
    try {
      const templates = await Template.getTemplatesByUser((req as any).user!.id);

      _res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      logger.error('Error fetching user templates:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to fetch user templates',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Get template categories
   */
  static async getCategories_(req: Request, _res: Response): Promise<void> {
    try {
      const categories = [
        {
          id: 'article',
          name: 'Article Templates',
          description: 'Templates for blog posts and articles',
          icon: '📄',
          templates: await Template.count({ where: { category: 'article', isActive: true } }),
        },
        {
          id: 'course',
          name: 'Course Templates',
          description: 'Templates for creating courses and lessons',
          icon: '📚',
          templates: await Template.count({ where: { category: 'course', isActive: true } }),
        },
        {
          id: 'email',
          name: 'Email Templates',
          description: 'Templates for email campaigns and newsletters',
          icon: '📧',
          templates: await Template.count({ where: { category: 'email', isActive: true } }),
        },
        {
          id: 'landing-page',
          name: 'Landing Page Templates',
          description: 'Templates for landing pages and sales pages',
          icon: '🎯',
          templates: await Template.count({ where: { category: 'landing-page', isActive: true } }),
        },
      ];

      _res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      logger.error('Error fetching template categories:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to fetch template categories',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Get template preview
   */
  static async getTemplatePreview(req: Request, _res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { sampleData } = req.query;

      const template = await Template.findByPk(id);
      if (!template) {
        _res.status(404).json({
          success: false,
          message: 'Template not found',
        });
        return;
      }

      // Check access permissions
      if (!template.isPublic && template.createdById !== (req as any).user!.id && (req as any).user!.role !== 'admin') {
        _res.status(403).json({
          success: false,
          message: 'Access denied to this template',
        });
        return;
      }

      // Generate preview data
      const mockData = sampleData ? JSON.parse(sampleData as string) : {
        title: 'Sample Article Title',
        author: 'John Doe',
        date: new Date().toISOString().split('T')[0],
        year: new Date().getFullYear().toString(),
      };

      const previewData = await template.createContentFromTemplate({
        title: mockData.title,
        customContent: mockData,
        userId: (req as any).user!.id,
        autoPublish: false,
      });

      _res.json({
        success: true,
        data: {
          preview: previewData,
          template: {
            id: template.id,
            name: template.name,
            description: template.description,
            category: template.category,
            type: template.type,
          },
        },
      });
    } catch (error) {
      logger.error('Error generating template preview:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to generate template preview',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }

  /**
   * Get automation suggestions
   */
  static async getAutomationSuggestions(req: Request, _res: Response): Promise<void> {
    try {
      const { category } = req.query;

      const suggestions = {
        article: [
          {
            id: 'auto_seo',
            name: 'Auto SEO Optimization',
            description: 'Automatically optimize title and meta description',
            enabled: true,
          },
          {
            id: 'social_share',
            name: 'Social Media Sharing',
            description: 'Auto-post to social media when published',
            enabled: false,
          },
          {
            id: 'newsletter',
            name: 'Newsletter Inclusion',
            description: 'Include in next newsletter automatically',
            enabled: false,
          },
        ],
        course: [
          {
            id: 'enrollment',
            name: 'Auto Enrollment',
            description: 'Automatically enroll users when they meet criteria',
            enabled: false,
          },
          {
            id: 'progress_tracking',
            name: 'Progress Tracking',
            description: 'Track user progress and send reminders',
            enabled: true,
          },
          {
            id: 'certificate',
            name: 'Certificate Generation',
            description: 'Auto-generate certificates upon completion',
            enabled: false,
          },
        ],
      };

      _res.json({
        success: true,
        data: suggestions[category as keyof typeof suggestions] || [],
      });
    } catch (error) {
      logger.error('Error fetching automation suggestions:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to fetch automation suggestions',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
}

export default TemplateController; 