"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Template = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
const logger_1 = require("../../utils/logger");
class Template extends sequelize_1.Model {
    id;
    name;
    description;
    category;
    type;
    template;
    automation;
    usage;
    isPublic;
    isActive;
    version;
    tags;
    createdById;
    organizationId;
    createdAt;
    updatedAt;
    // Static methods for business logic
    static async getPopularTemplates(category) {
        const whereClause = {
            isActive: true,
            isPublic: true,
        };
        if (category) {
            whereClause.category = category;
        }
        return await Template.findAll({
            where: whereClause,
            order: [['usage.timesUsed', 'DESC']],
            limit: 10,
        });
    }
    static async searchTemplates(query, category) {
        const whereClause = {
            isActive: true,
            [sequelize_1.Op.or]: [
                { name: { [sequelize_1.Op.iLike]: `%${query}%` } },
                { description: { [sequelize_1.Op.iLike]: `%${query}%` } },
                { tags: { [sequelize_1.Op.overlap]: [query] } },
            ],
        };
        if (category) {
            whereClause.category = category;
        }
        return await Template.findAll({
            where: whereClause,
            order: [['usage.timesUsed', 'DESC']],
        });
    }
    static async incrementUsage(templateId) {
        const template = await Template.findByPk(templateId);
        if (template) {
            await template.update({
                usage: {
                    ...template.usage,
                    timesUsed: template.usage.timesUsed + 1,
                    lastUsed: new Date().toISOString(),
                },
            });
        }
    }
    static async getTemplatesByUser(userId) {
        return await Template.findAll({
            where: {
                createdById: userId,
                isActive: true,
            },
            order: [['updatedAt', 'DESC']],
        });
    }
    static async duplicateTemplate(templateId, userId) {
        const original = await Template.findByPk(templateId);
        if (!original) {
            throw new Error('Template not found');
        }
        return await Template.create({
            name: `${original.name} (Copy)`,
            description: original.description,
            category: original.category,
            type: original.type,
            template: original.template,
            automation: original.automation,
            isPublic: false,
            isActive: true,
            version: '1.0.0',
            tags: original.tags,
            createdById: userId,
            usage: {
                timesUsed: 0,
                lastUsed: null,
                popularVariations: [],
            },
        });
    }
    // Instance methods
    async createContentFromTemplate(data) {
        await Template.incrementUsage(this.id);
        // Process template variables
        let processedContent = this.template.content || '';
        let processedTitle = data.title || this.template.title || '';
        // Replace template variables
        const variables = {
            '{{title}}': processedTitle,
            '{{date}}': new Date().toISOString().split('T')[0],
            '{{author}}': data.userId,
            '{{year}}': new Date().getFullYear().toString(),
            ...data.customContent,
        };
        Object.entries(variables).forEach(([key, value]) => {
            processedContent = processedContent.replace(new RegExp(key, 'g'), String(value));
            processedTitle = processedTitle.replace(new RegExp(key, 'g'), String(value));
        });
        // Create content structure
        const contentData = {
            title: processedTitle,
            content: processedContent,
            authorId: data.userId,
            status: data.autoPublish && this.automation?.autoPublish ? 'published' : 'draft',
            seo: this.template.seoTemplate
                ? {
                    title: this.template.seoTemplate.titleTemplate?.replace('{{title}}', processedTitle),
                    description: this.template.seoTemplate.descriptionTemplate?.replace('{{title}}', processedTitle),
                    keywords: this.template.seoTemplate.keywordsTemplate || [],
                }
                : undefined,
            metadata: this.template.metadata,
            tags: [...(this.template.metadata?.tags || []), ...(this.automation?.autoTags || [])],
            templateId: this.id,
        };
        return contentData;
    }
    async scheduleAutomation(contentId) {
        if (!this.automation)
            return;
        // Schedule publishing if enabled
        if (this.automation.scheduledPublishing && this.automation.publishDelay) {
            const publishAt = new Date();
            publishAt.setMinutes(publishAt.getMinutes() + this.automation.publishDelay);
            // In a real implementation, you would use a job queue like Bull or Agenda
            logger_1.logger.info(`Scheduling content ${contentId} to publish at ${publishAt}`);
        }
        // Schedule social media posting
        if (this.automation.socialMediaPost) {
            logger_1.logger.info(`Scheduling social media post for content ${contentId}`);
        }
        // Schedule SEO optimization
        if (this.automation.seoOptimization) {
            logger_1.logger.info(`Scheduling SEO optimization for content ${contentId}`);
        }
    }
}
exports.Template = Template;
Template.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [1, 200],
        },
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [10, 1000],
        },
    },
    category: {
        type: sequelize_1.DataTypes.ENUM('article', 'course', 'email', 'landing-page'),
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('content', 'structure', 'automation'),
        allowNull: false,
        defaultValue: 'content',
    },
    template: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
    automation: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
    },
    usage: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            timesUsed: 0,
            lastUsed: null,
            popularVariations: [],
        },
    },
    isPublic: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    version: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: '1.0.0',
    },
    tags: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
    },
    createdById: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    organizationId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: sequelize_2.sequelize,
    tableName: 'templates',
    indexes: [
        {
            fields: ['category'],
        },
        {
            fields: ['type'],
        },
        {
            fields: ['isPublic', 'isActive'],
        },
        {
            fields: ['createdById'],
        },
        {
            fields: ['tags'],
            using: 'gin',
        },
        {
            fields: ['usage'],
            using: 'gin',
        },
    ],
});
exports.default = Template;
//# sourceMappingURL=Template.js.map