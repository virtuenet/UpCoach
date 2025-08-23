import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../index';

export interface TemplateAttributes {
  id: string;
  name: string;
  description: string;
  category: 'article' | 'course' | 'email' | 'landing-page';
  type: 'content' | 'structure' | 'automation';
  
  // Template content
  template: {
    title?: string;
    titleTemplate?: string;
    content?: string;
    contentBlocks?: Array<{
      type: 'text' | 'image' | 'video' | 'quote' | 'list' | 'code';
      content: string;
      placeholder?: string;
      required?: boolean;
    }>;
    seoTemplate?: {
      titleTemplate?: string;
      descriptionTemplate?: string;
      keywordsTemplate?: string[];
    };
    metadata?: {
      estimatedReadTime?: number;
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      tags?: string[];
    };
  };

  // Automation settings
  automation?: {
    autoPublish?: boolean;
    publishDelay?: number; // minutes
    scheduledPublishing?: boolean;
    autoTags?: string[];
    autoCategory?: string;
    aiContentGeneration?: boolean;
    seoOptimization?: boolean;
    socialMediaPost?: boolean;
  };

  // Usage tracking
  usage: {
    timesUsed: number;
    lastUsed: string | null;
    popularVariations: string[];
  };

  // Template settings
  isPublic: boolean;
  isActive: boolean;
  version: string;
  tags: string[];
  
  // Relationships
  createdById: string;
  organizationId?: string;

  createdAt: string;
  updatedAt: string;
}

export interface TemplateCreationAttributes extends Optional<TemplateAttributes, 'id' | 'createdAt' | 'updatedAt' | 'usage' | 'version'> {}

export class Template extends Model<TemplateAttributes, TemplateCreationAttributes> implements TemplateAttributes {
  public id!: string;
  public name!: string;
  public description!: string;
  public category!: 'article' | 'course' | 'email' | 'landing-page';
  public type!: 'content' | 'structure' | 'automation';
  public template!: TemplateAttributes['template'];
  public automation!: TemplateAttributes['automation'];
  public usage!: TemplateAttributes['usage'];
  public isPublic!: boolean;
  public isActive!: boolean;
  public version!: string;
  public tags!: string[];
  public createdById!: string;
  public organizationId!: string;
  public readonly createdAt!: string;
  public readonly updatedAt!: string;

  // Static methods for business logic
  static async getPopularTemplates(category?: string): Promise<Template[]> {
    const whereClause: any = {
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

  static async searchTemplates(query: string, category?: string): Promise<Template[]> {
    const whereClause: any = {
      isActive: true,
      [Op.or as any]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } },
        { tags: { [Op.overlap]: [query] } },
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

  static async incrementUsage(templateId: string): Promise<void> {
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

  static async getTemplatesByUser(userId: string): Promise<Template[]> {
    return await Template.findAll({
      where: {
        createdById: userId,
        isActive: true,
      },
      order: [['updatedAt', 'DESC']],
    });
  }

  static async duplicateTemplate(templateId: string, userId: string): Promise<Template> {
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
  async createContentFromTemplate(data: {
    title?: string;
    customContent?: Record<string, any>;
    autoPublish?: boolean;
    userId: string;
  }): Promise<any> {
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
      seo: this.template.seoTemplate ? {
        title: this.template.seoTemplate.titleTemplate?.replace('{{title}}', processedTitle),
        description: this.template.seoTemplate.descriptionTemplate?.replace('{{title}}', processedTitle),
        keywords: this.template.seoTemplate.keywordsTemplate || [],
      } : undefined,
      metadata: this.template.metadata,
      tags: [
        ...(this.template.metadata?.tags || []),
        ...(this.automation?.autoTags || []),
      ],
      templateId: this.id,
    };

    return contentData;
  }

  async scheduleAutomation(contentId: string): Promise<void> {
    if (!this.automation) return;

    // Schedule publishing if enabled
    if (this.automation.scheduledPublishing && this.automation.publishDelay) {
      const publishAt = new Date();
      publishAt.setMinutes(publishAt.getMinutes() + this.automation.publishDelay);

      // In a real implementation, you would use a job queue like Bull or Agenda
      console.log(`Scheduling content ${contentId} to publish at ${publishAt}`);
    }

    // Schedule social media posting
    if (this.automation.socialMediaPost) {
      console.log(`Scheduling social media post for content ${contentId}`);
    }

    // Schedule SEO optimization
    if (this.automation.seoOptimization) {
      console.log(`Scheduling SEO optimization for content ${contentId}`);
    }
  }
}

Template.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 200],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 1000],
      },
    },
    category: {
      type: DataTypes.ENUM('article', 'course', 'email', 'landing-page'),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('content', 'structure', 'automation'),
      allowNull: false,
      defaultValue: 'content',
    },
    template: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    automation: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    },
    usage: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        timesUsed: 0,
        lastUsed: null,
        popularVariations: [],
      },
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '1.0.0',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
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
  }
);

export default Template; 