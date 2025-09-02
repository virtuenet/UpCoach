"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateController = void 0;
const models_1 = require("../../models");
const sequelize_1 = require("sequelize");
const express_validator_1 = require("express-validator");
const logger_1 = require("../../utils/logger");
/**
 * TemplateController
 * Handles content templates and automation workflows
 */
class TemplateController {
    /**
     * Get all templates with filtering
     */
    static async getTemplates(req, _res) {
        try {
            const { page = 1, limit = 20, category, type, search, tags, sortBy = 'updatedAt', sortOrder = 'DESC', includePublic = true, } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const whereClause = {
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
                whereClause[sequelize_1.Op.or] = [
                    { name: { [sequelize_1.Op.iLike]: `%${search}%` } },
                    { description: { [sequelize_1.Op.iLike]: `%${search}%` } },
                ];
            }
            if (tags) {
                const tagArray = tags.split(',').map(tag => tag.trim());
                whereClause.tags = { [sequelize_1.Op.overlap]: tagArray };
            }
            // Filter by ownership and public templates
            if (includePublic === 'true') {
                whereClause[sequelize_1.Op.or] = [{ createdById: req.user.id }, { isPublic: true }];
            }
            else {
                whereClause.createdById = req.user.id;
            }
            const templates = await models_1.Template.findAndCountAll({
                where: whereClause,
                order: [[sortBy, sortOrder]],
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
        }
        catch (error) {
            logger_1.logger.error('Error fetching templates:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to fetch templates',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Get popular templates
     */
    static async getPopularTemplates(req, _res) {
        try {
            const { category, limit = 10 } = req.query;
            const templates = await models_1.Template.getPopularTemplates(category);
            _res.json({
                success: true,
                data: templates.slice(0, Number(limit)),
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching popular templates:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to fetch popular templates',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Search templates
     */
    static async searchTemplates(req, _res) {
        try {
            const { q: query, category } = req.query;
            if (!query) {
                _res.status(400).json({
                    success: false,
                    message: 'Search query is required',
                });
                return;
            }
            const templates = await models_1.Template.searchTemplates(query, category);
            _res.json({
                success: true,
                data: templates,
            });
        }
        catch (error) {
            logger_1.logger.error('Error searching templates:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to search templates',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Create a new template
     */
    static async createTemplate(req, _res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                _res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
                return;
            }
            const { name, description, category, type, template, automation, isPublic, tags } = req.body;
            const newTemplate = await models_1.Template.create({
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
                createdById: req.user.id,
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
        }
        catch (error) {
            logger_1.logger.error('Error creating template:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to create template',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Get a single template
     */
    static async getTemplate(req, _res) {
        try {
            const { id } = req.params;
            const template = await models_1.Template.findByPk(id);
            if (!template) {
                _res.status(404).json({
                    success: false,
                    message: 'Template not found',
                });
                return;
            }
            // Check access permissions
            if (!template.isPublic &&
                template.createdById !== req.user.id &&
                req.user.role !== 'admin') {
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
        }
        catch (error) {
            logger_1.logger.error('Error fetching template:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to fetch template',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Update a template
     */
    static async updateTemplate(req, _res) {
        try {
            const { id } = req.params;
            const { name, description, template, automation, isPublic, tags, isActive } = req.body;
            const existingTemplate = await models_1.Template.findByPk(id);
            if (!existingTemplate) {
                _res.status(404).json({
                    success: false,
                    message: 'Template not found',
                });
                return;
            }
            // Check permissions
            if (existingTemplate.createdById !== req.user.id &&
                req.user.role !== 'admin') {
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
        }
        catch (error) {
            logger_1.logger.error('Error updating template:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to update template',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Delete a template
     */
    static async deleteTemplate(req, _res) {
        try {
            const { id } = req.params;
            const template = await models_1.Template.findByPk(id);
            if (!template) {
                _res.status(404).json({
                    success: false,
                    message: 'Template not found',
                });
                return;
            }
            // Check permissions
            if (template.createdById !== req.user.id && req.user.role !== 'admin') {
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
        }
        catch (error) {
            logger_1.logger.error('Error deleting template:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to delete template',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Duplicate a template
     */
    static async duplicateTemplate(req, _res) {
        try {
            const { id } = req.params;
            const duplicated = await models_1.Template.duplicateTemplate(id, req.user.id);
            _res.status(201).json({
                success: true,
                data: duplicated,
                message: 'Template duplicated successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error duplicating template:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to duplicate template',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Create content from template
     */
    static async createContentFromTemplate(req, _res) {
        try {
            const { id } = req.params;
            const { title, customContent, autoPublish } = req.body;
            const template = await models_1.Template.findByPk(id);
            if (!template) {
                _res.status(404).json({
                    success: false,
                    message: 'Template not found',
                });
                return;
            }
            // Check access permissions
            if (!template.isPublic &&
                template.createdById !== req.user.id &&
                req.user.role !== 'admin') {
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
                userId: req.user.id,
            });
            _res.status(201).json({
                success: true,
                data: contentData,
                message: 'Content created from template successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating content from template:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to create content from template',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Get user's templates
     */
    static async getUserTemplates(req, _res) {
        try {
            const templates = await models_1.Template.getTemplatesByUser(req.user.id);
            _res.json({
                success: true,
                data: templates,
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching user templates:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to fetch user templates',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Get template categories
     */
    static async getCategories_(req, _res) {
        try {
            const categories = [
                {
                    id: 'article',
                    name: 'Article Templates',
                    description: 'Templates for blog posts and articles',
                    icon: '📄',
                    templates: await models_1.Template.count({ where: { category: 'article', isActive: true } }),
                },
                {
                    id: 'course',
                    name: 'Course Templates',
                    description: 'Templates for creating courses and lessons',
                    icon: '📚',
                    templates: await models_1.Template.count({ where: { category: 'course', isActive: true } }),
                },
                {
                    id: 'email',
                    name: 'Email Templates',
                    description: 'Templates for email campaigns and newsletters',
                    icon: '📧',
                    templates: await models_1.Template.count({ where: { category: 'email', isActive: true } }),
                },
                {
                    id: 'landing-page',
                    name: 'Landing Page Templates',
                    description: 'Templates for landing pages and sales pages',
                    icon: '🎯',
                    templates: await models_1.Template.count({ where: { category: 'landing-page', isActive: true } }),
                },
            ];
            _res.json({
                success: true,
                data: categories,
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching template categories:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to fetch template categories',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Get template preview
     */
    static async getTemplatePreview(req, _res) {
        try {
            const { id } = req.params;
            const { sampleData } = req.query;
            const template = await models_1.Template.findByPk(id);
            if (!template) {
                _res.status(404).json({
                    success: false,
                    message: 'Template not found',
                });
                return;
            }
            // Check access permissions
            if (!template.isPublic &&
                template.createdById !== req.user.id &&
                req.user.role !== 'admin') {
                _res.status(403).json({
                    success: false,
                    message: 'Access denied to this template',
                });
                return;
            }
            // Generate preview data
            const mockData = sampleData
                ? JSON.parse(sampleData)
                : {
                    title: 'Sample Article Title',
                    author: 'John Doe',
                    date: new Date().toISOString().split('T')[0],
                    year: new Date().getFullYear().toString(),
                };
            const previewData = await template.createContentFromTemplate({
                title: mockData.title,
                customContent: mockData,
                userId: req.user.id,
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
        }
        catch (error) {
            logger_1.logger.error('Error generating template preview:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to generate template preview',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
    /**
     * Get automation suggestions
     */
    static async getAutomationSuggestions(req, _res) {
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
                data: suggestions[category] || [],
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching automation suggestions:', error);
            _res.status(500).json({
                success: false,
                message: 'Failed to fetch automation suggestions',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
}
exports.TemplateController = TemplateController;
exports.default = TemplateController;
//# sourceMappingURL=TemplateController.js.map