import { Model, Optional } from 'sequelize';
export interface TemplateAttributes {
    id: string;
    name: string;
    description: string;
    category: 'article' | 'course' | 'email' | 'landing-page';
    type: 'content' | 'structure' | 'automation';
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
    automation?: {
        autoPublish?: boolean;
        publishDelay?: number;
        scheduledPublishing?: boolean;
        autoTags?: string[];
        autoCategory?: string;
        aiContentGeneration?: boolean;
        seoOptimization?: boolean;
        socialMediaPost?: boolean;
    };
    usage: {
        timesUsed: number;
        lastUsed: string | null;
        popularVariations: string[];
    };
    isPublic: boolean;
    isActive: boolean;
    version: string;
    tags: string[];
    createdById: string;
    organizationId?: string;
    createdAt: string;
    updatedAt: string;
}
export interface TemplateCreationAttributes extends Optional<TemplateAttributes, 'id' | 'createdAt' | 'updatedAt' | 'usage' | 'version'> {
}
export declare class Template extends Model<TemplateAttributes, TemplateCreationAttributes> implements TemplateAttributes {
    id: string;
    name: string;
    description: string;
    category: 'article' | 'course' | 'email' | 'landing-page';
    type: 'content' | 'structure' | 'automation';
    template: TemplateAttributes['template'];
    automation: TemplateAttributes['automation'];
    usage: TemplateAttributes['usage'];
    isPublic: boolean;
    isActive: boolean;
    version: string;
    tags: string[];
    createdById: string;
    organizationId: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    static getPopularTemplates(category?: string): Promise<Template[]>;
    static searchTemplates(query: string, category?: string): Promise<Template[]>;
    static incrementUsage(templateId: string): Promise<void>;
    static getTemplatesByUser(userId: string): Promise<Template[]>;
    static duplicateTemplate(templateId: string, userId: string): Promise<Template>;
    createContentFromTemplate(data: {
        title?: string;
        customContent?: Record<string, any>;
        autoPublish?: boolean;
        userId: string;
    }): Promise<any>;
    scheduleAutomation(contentId: string): Promise<void>;
}
export default Template;
//# sourceMappingURL=Template.d.ts.map