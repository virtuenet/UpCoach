import { Request, Response } from 'express';
export declare class TemplateController {
    static getTemplates(req: Request, _res: Response): Promise<void>;
    static getPopularTemplates(req: Request, _res: Response): Promise<void>;
    static searchTemplates(req: Request, _res: Response): Promise<void>;
    static createTemplate(req: Request, _res: Response): Promise<void>;
    static getTemplate(req: Request, _res: Response): Promise<void>;
    static updateTemplate(req: Request, _res: Response): Promise<void>;
    static deleteTemplate(req: Request, _res: Response): Promise<void>;
    static duplicateTemplate(req: Request, _res: Response): Promise<void>;
    static createContentFromTemplate(req: Request, _res: Response): Promise<void>;
    static getUserTemplates(req: Request, _res: Response): Promise<void>;
    static getCategories_(req: Request, _res: Response): Promise<void>;
    static getTemplatePreview(req: Request, _res: Response): Promise<void>;
    static getAutomationSuggestions(req: Request, _res: Response): Promise<void>;
}
export default TemplateController;
//# sourceMappingURL=TemplateController.d.ts.map