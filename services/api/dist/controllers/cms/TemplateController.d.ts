import { Request, Response } from 'express';
/**
 * TemplateController
 * Handles content templates and automation workflows
 */
export declare class TemplateController {
    /**
     * Get all templates with filtering
     */
    static getTemplates(req: Request, _res: Response): Promise<void>;
    /**
     * Get popular templates
     */
    static getPopularTemplates(req: Request, _res: Response): Promise<void>;
    /**
     * Search templates
     */
    static searchTemplates(req: Request, _res: Response): Promise<void>;
    /**
     * Create a new template
     */
    static createTemplate(req: Request, _res: Response): Promise<void>;
    /**
     * Get a single template
     */
    static getTemplate(req: Request, _res: Response): Promise<void>;
    /**
     * Update a template
     */
    static updateTemplate(req: Request, _res: Response): Promise<void>;
    /**
     * Delete a template
     */
    static deleteTemplate(req: Request, _res: Response): Promise<void>;
    /**
     * Duplicate a template
     */
    static duplicateTemplate(req: Request, _res: Response): Promise<void>;
    /**
     * Create content from template
     */
    static createContentFromTemplate(req: Request, _res: Response): Promise<void>;
    /**
     * Get user's templates
     */
    static getUserTemplates(req: Request, _res: Response): Promise<void>;
    /**
     * Get template categories
     */
    static getCategories_(req: Request, _res: Response): Promise<void>;
    /**
     * Get template preview
     */
    static getTemplatePreview(req: Request, _res: Response): Promise<void>;
    /**
     * Get automation suggestions
     */
    static getAutomationSuggestions(req: Request, _res: Response): Promise<void>;
}
export default TemplateController;
//# sourceMappingURL=TemplateController.d.ts.map