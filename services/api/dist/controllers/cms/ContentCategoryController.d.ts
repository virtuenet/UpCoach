import { Request, Response } from 'express';
export declare class ContentCategoryController {
    static getAll(req: Request, _res: Response): Promise<void>;
    static getOne(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static create(req: Request, _res: Response): Promise<void>;
    static update(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static delete(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static reorder(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getContentCount(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=ContentCategoryController.d.ts.map