import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger';

/**
 * Program Template Library
 *
 * Manages reusable coaching program templates for enterprise deployments.
 * Provides pre-built programs that can be customized and deployed quickly.
 *
 * Features:
 * - Template creation and management
 * - Template categories and tags
 * - Customization options
 * - Version control
 * - Usage analytics
 * - Template marketplace
 */

export interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  duration: number; // in days
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  modules: TemplateModule[];
  outcomes: string[];
  requirements: string[];
  customizable: boolean;
  isPublic: boolean;
  authorId: string;
  version: string;
  usageCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateModule {
  id: string;
  title: string;
  description: string;
  order: number;
  duration: number; // in days
  content: ModuleContent[];
  assessments: Assessment[];
  resources: Resource[];
}

export interface ModuleContent {
  id: string;
  type: 'lesson' | 'exercise' | 'reflection' | 'action-item';
  title: string;
  content: string;
  order: number;
  estimatedTime: number; // minutes
}

export interface Assessment {
  id: string;
  title: string;
  type: 'quiz' | 'survey' | 'self-assessment' | 'peer-review';
  questions: Question[];
  passingScore?: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'text' | 'scale' | 'boolean';
  options?: string[];
  correctAnswer?: string | number;
}

export interface Resource {
  id: string;
  title: string;
  type: 'document' | 'video' | 'audio' | 'link' | 'tool';
  url: string;
  description: string;
}

export interface TemplateDeployment {
  id: string;
  templateId: string;
  organizationId: string;
  customizations: Record<string, any>;
  participantCount: number;
  status: 'active' | 'completed' | 'archived';
  startDate: Date;
  endDate?: Date;
}

export class ProgramTemplateLibrary extends EventEmitter {
  private logger: Logger;
  private templates: Map<string, ProgramTemplate>;
  private deployments: Map<string, TemplateDeployment>;
  private categories: Set<string>;

  constructor() {
    super();
    this.logger = new Logger('ProgramTemplateLibrary');
    this.templates = new Map();
    this.deployments = new Map();
    this.categories = new Set([
      'Leadership',
      'Communication',
      'Team Building',
      'Performance',
      'Personal Development',
      'Sales',
      'Management',
      'Wellness',
    ]);
  }

  /**
   * Initialize the template library
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing program template library...');

      await this.loadTemplates();
      await this.loadDeployments();
      this.setupDefaultTemplates();

      this.logger.info('Program template library initialized', {
        templateCount: this.templates.size,
      });
    } catch (error) {
      this.logger.error('Failed to initialize template library', error);
      throw error;
    }
  }

  /**
   * Create new program template
   */
  async createTemplate(config: Partial<ProgramTemplate>): Promise<ProgramTemplate> {
    try {
      const template: ProgramTemplate = {
        id: this.generateTemplateId(),
        name: config.name || '',
        description: config.description || '',
        category: config.category || 'General',
        tags: config.tags || [],
        duration: config.duration || 30,
        difficulty: config.difficulty || 'intermediate',
        modules: config.modules || [],
        outcomes: config.outcomes || [],
        requirements: config.requirements || [],
        customizable: config.customizable !== false,
        isPublic: config.isPublic || false,
        authorId: config.authorId || '',
        version: '1.0.0',
        usageCount: 0,
        rating: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.saveTemplate(template);
      this.templates.set(template.id, template);

      this.emit('template:created', template);
      this.logger.info('Template created', { templateId: template.id, name: template.name });

      return template;
    } catch (error) {
      this.logger.error('Failed to create template', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<ProgramTemplate>
  ): Promise<ProgramTemplate> {
    try {
      const template = this.templates.get(templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      const updated: ProgramTemplate = {
        ...template,
        ...updates,
        updatedAt: new Date(),
      };

      await this.saveTemplate(updated);
      this.templates.set(templateId, updated);

      this.emit('template:updated', updated);

      return updated;
    } catch (error) {
      this.logger.error('Failed to update template', { templateId, error });
      throw error;
    }
  }

  /**
   * Add module to template
   */
  async addModule(templateId: string, module: Partial<TemplateModule>): Promise<TemplateModule> {
    try {
      const template = this.templates.get(templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      const newModule: TemplateModule = {
        id: this.generateModuleId(),
        title: module.title || '',
        description: module.description || '',
        order: template.modules.length + 1,
        duration: module.duration || 7,
        content: module.content || [],
        assessments: module.assessments || [],
        resources: module.resources || [],
      };

      template.modules.push(newModule);
      template.updatedAt = new Date();

      await this.saveTemplate(template);

      this.emit('template:module:added', { templateId, module: newModule });

      return newModule;
    } catch (error) {
      this.logger.error('Failed to add module', { templateId, error });
      throw error;
    }
  }

  /**
   * Deploy template to organization
   */
  async deployTemplate(
    templateId: string,
    organizationId: string,
    customizations?: Record<string, any>
  ): Promise<TemplateDeployment> {
    try {
      const template = this.templates.get(templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      const deployment: TemplateDeployment = {
        id: this.generateDeploymentId(),
        templateId,
        organizationId,
        customizations: customizations || {},
        participantCount: 0,
        status: 'active',
        startDate: new Date(),
      };

      // Increment usage count
      template.usageCount++;
      await this.saveTemplate(template);

      await this.saveDeployment(deployment);
      this.deployments.set(deployment.id, deployment);

      this.emit('template:deployed', deployment);
      this.logger.info('Template deployed', {
        deploymentId: deployment.id,
        templateId,
        organizationId,
      });

      return deployment;
    } catch (error) {
      this.logger.error('Failed to deploy template', { templateId, organizationId, error });
      throw error;
    }
  }

  /**
   * Clone template
   */
  async cloneTemplate(
    templateId: string,
    authorId: string,
    modifications?: Partial<ProgramTemplate>
  ): Promise<ProgramTemplate> {
    try {
      const original = this.templates.get(templateId);

      if (!original) {
        throw new Error('Template not found');
      }

      const cloned: ProgramTemplate = {
        ...original,
        ...modifications,
        id: this.generateTemplateId(),
        name: `${original.name} (Copy)`,
        authorId,
        version: '1.0.0',
        usageCount: 0,
        rating: 0,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.saveTemplate(cloned);
      this.templates.set(cloned.id, cloned);

      this.emit('template:cloned', { original: templateId, cloned: cloned.id });

      return cloned;
    } catch (error) {
      this.logger.error('Failed to clone template', { templateId, error });
      throw error;
    }
  }

  /**
   * Search templates
   */
  searchTemplates(query: {
    category?: string;
    tags?: string[];
    difficulty?: string;
    minDuration?: number;
    maxDuration?: number;
    isPublic?: boolean;
  }): ProgramTemplate[] {
    let results = Array.from(this.templates.values());

    if (query.category) {
      results = results.filter(t => t.category === query.category);
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(t => query.tags!.some(tag => t.tags.includes(tag)));
    }

    if (query.difficulty) {
      results = results.filter(t => t.difficulty === query.difficulty);
    }

    if (query.minDuration !== undefined) {
      results = results.filter(t => t.duration >= query.minDuration!);
    }

    if (query.maxDuration !== undefined) {
      results = results.filter(t => t.duration <= query.maxDuration!);
    }

    if (query.isPublic !== undefined) {
      results = results.filter(t => t.isPublic === query.isPublic);
    }

    return results.sort((a, b) => b.rating - a.rating || b.usageCount - a.usageCount);
  }

  /**
   * Get popular templates
   */
  getPopularTemplates(limit: number = 10): ProgramTemplate[] {
    return Array.from(this.templates.values())
      .filter(t => t.isPublic)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): ProgramTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Get templates by author
   */
  getTemplatesByAuthor(authorId: string): ProgramTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.authorId === authorId);
  }

  /**
   * Get template analytics
   */
  async getTemplateAnalytics(templateId: string): Promise<any> {
    try {
      const template = this.templates.get(templateId);

      if (!template) {
        return null;
      }

      const deployments = Array.from(this.deployments.values()).filter(
        d => d.templateId === templateId
      );

      const totalParticipants = deployments.reduce(
        (sum, d) => sum + d.participantCount,
        0
      );

      return {
        templateId,
        name: template.name,
        totalDeployments: deployments.length,
        activeDeployments: deployments.filter(d => d.status === 'active').length,
        completedDeployments: deployments.filter(d => d.status === 'completed').length,
        totalParticipants,
        averageRating: template.rating,
        usageCount: template.usageCount,
      };
    } catch (error) {
      this.logger.error('Failed to get template analytics', { templateId, error });
      return null;
    }
  }

  /**
   * Rate template
   */
  async rateTemplate(templateId: string, rating: number): Promise<void> {
    try {
      const template = this.templates.get(templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      // Simple rating calculation (would be more sophisticated in production)
      const currentTotal = template.rating * template.usageCount;
      template.rating = (currentTotal + rating) / (template.usageCount + 1);

      await this.saveTemplate(template);

      this.emit('template:rated', { templateId, rating });
    } catch (error) {
      this.logger.error('Failed to rate template', { templateId, error });
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const template = this.templates.get(templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      // Check for active deployments
      const activeDeployments = Array.from(this.deployments.values()).filter(
        d => d.templateId === templateId && d.status === 'active'
      );

      if (activeDeployments.length > 0) {
        throw new Error('Cannot delete template with active deployments');
      }

      await this.removeTemplate(templateId);
      this.templates.delete(templateId);

      this.emit('template:deleted', { templateId });
      this.logger.info('Template deleted', { templateId });
    } catch (error) {
      this.logger.error('Failed to delete template', { templateId, error });
      throw error;
    }
  }

  /**
   * Get available categories
   */
  getCategories(): string[] {
    return Array.from(this.categories);
  }

  // Private helper methods

  private setupDefaultTemplates(): void {
    // Create default templates
    const defaults: Partial<ProgramTemplate>[] = [
      {
        name: 'Leadership Essentials',
        description: '30-day leadership development program',
        category: 'Leadership',
        tags: ['leadership', 'management', 'skills'],
        duration: 30,
        difficulty: 'intermediate',
        isPublic: true,
        authorId: 'system',
      },
      {
        name: 'Effective Communication',
        description: 'Master communication skills in 21 days',
        category: 'Communication',
        tags: ['communication', 'soft-skills'],
        duration: 21,
        difficulty: 'beginner',
        isPublic: true,
        authorId: 'system',
      },
    ];

    defaults.forEach(async (template) => {
      if (!Array.from(this.templates.values()).some(t => t.name === template.name)) {
        await this.createTemplate(template);
      }
    });
  }

  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateModuleId(): string {
    return `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeploymentId(): string {
    return `deployment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadTemplates(): Promise<void> {
    // Mock implementation - would load from database
    this.logger.info('Loaded templates', { count: this.templates.size });
  }

  private async loadDeployments(): Promise<void> {
    // Mock implementation - would load from database
    this.logger.info('Loaded deployments', { count: this.deployments.size });
  }

  private async saveTemplate(template: ProgramTemplate): Promise<void> {
    // Mock implementation - would save to database
  }

  private async saveDeployment(deployment: TemplateDeployment): Promise<void> {
    // Mock implementation - would save to database
  }

  private async removeTemplate(templateId: string): Promise<void> {
    // Mock implementation - would delete from database
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down program template library...');
    this.templates.clear();
    this.deployments.clear();
    this.removeAllListeners();
  }
}

export default ProgramTemplateLibrary;
