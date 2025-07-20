import { Request, Response } from 'express';
import { Template } from '../../models';
import { validationResult } from 'express-validator';

/**
 * TemplateController
 * Handles content templates and automation workflows
 */
export class TemplateController {
  /**
   * Get all templates with filtering
   */
  static async getTemplates(req: Request, res: Response): Promise<void> {
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
        whereClause[Template.sequelize!.Op.or] = [
          { name: { [Template.sequelize!.Op.iLike]: `%${search}%` } },
          { description: { [Template.sequelize!.Op.iLike]: `%${search}%` } },
        ];
      }

      if (tags) {
        const tagArray = (tags as string).split(',').map(tag => tag.trim());
        whereClause.tags = { [Template.sequelize!.Op.overlap]: tagArray };
      }

      // Filter by ownership and public templates
      if (includePublic === 'true') {
        whereClause[Template.sequelize!.Op.or] = [
          { createdById: req.user!.id },
          { isPublic: true },
        ];
      } else {
        whereClause.createdById = req.user!.id;
      }

      const templates = await Template.findAndCountAll({
        where: whereClause,
        order: [[sortBy as string, sortOrder as string]],
        limit: Number(limit),
        offset,
      });

      res.json({
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
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch templates',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get popular templates
   */
  static async getPopularTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { category, limit = 10 } = req.query;

      const templates = await Template.getPopularTemplates(category as string);

      res.json({
        success: true,
        data: templates.slice(0, Number(limit)),
      });
    } catch (error) {
      console.error('Error fetching popular templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch popular templates',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Search templates
   */
  static async searchTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { q: query, category } = req.query;

      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
        return;
      }

      const templates = await Template.searchTemplates(query as string, category as string);

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      console.error('Error searching templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search templates',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Create a new template
   */
  static async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
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
        createdById: req.user!.id,
        usage: {
          timesUsed: 0,
          lastUsed: null,
          popularVariations: [],
        },
      });

      res.status(201).json({
        success: true,
        data: newTemplate,
        message: 'Template created successfully',
      });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create template',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get a single template
   */
  static async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const template = await Template.findByPk(id);
      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Template not found',
        });
        return;
      }

      // Check access permissions
      if (!template.isPublic && template.createdById !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied to this template',
        });
        return;
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch template',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Update a template
   */
  static async updateTemplate(req: Request, res: Response): Promise<void> {
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
        res.status(404).json({
          success: false,
          message: 'Template not found',
        });
        return;
      }

      // Check permissions
      if (existingTemplate.createdById !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
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

      res.json({
        success: true,
        data: existingTemplate,
        message: 'Template updated successfully',
      });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update template',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const template = await Template.findByPk(id);
      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Template not found',
        });
        return;
      }

      // Check permissions
      if (template.createdById !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Not authorized to delete this template',
        });
        return;
      }

      // Soft delete by marking as inactive
      await template.update({ isActive: false });

      res.json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete template',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Duplicate a template
   */
  static async duplicateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const duplicated = await Template.duplicateTemplate(id, req.user!.id);

      res.status(201).json({
        success: true,
        data: duplicated,
        message: 'Template duplicated successfully',
      });
    } catch (error) {
      console.error('Error duplicating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to duplicate template',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Create content from template
   */
  static async createContentFromTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, customContent, autoPublish } = req.body;

      const template = await Template.findByPk(id);
      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Template not found',
        });
        return;
      }

      // Check access permissions
      if (!template.isPublic && template.createdById !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied to this template',
        });
        return;
      }

      const contentData = await template.createContentFromTemplate({
        title,
        customContent,
        autoPublish,
        userId: req.user!.id,
      });

      res.status(201).json({
        success: true,
        data: contentData,
        message: 'Content created from template successfully',
      });
    } catch (error) {
      console.error('Error creating content from template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create content from template',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get user's templates
   */
  static async getUserTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = await Template.getTemplatesByUser(req.user!.id);

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      console.error('Error fetching user templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user templates',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get template categories
   */
  static async getCategories(req: Request, res: Response): Promise<void> {
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

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error('Error fetching template categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch template categories',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get template preview
   */
  static async getTemplatePreview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { sampleData } = req.query;

      const template = await Template.findByPk(id);
      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Template not found',
        });
        return;
      }

      // Check access permissions
      if (!template.isPublic && template.createdById !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
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
        userId: req.user!.id,
        autoPublish: false,
      });

      res.json({
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
      console.error('Error generating template preview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate template preview',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get automation suggestions
   */
  static async getAutomationSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { category, contentType } = req.query;

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

      res.json({
        success: true,
        data: suggestions[category as keyof typeof suggestions] || [],
      });
    } catch (error) {
      console.error('Error fetching automation suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch automation suggestions',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default TemplateController; 