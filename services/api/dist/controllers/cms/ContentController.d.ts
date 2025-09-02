import { Request, Response } from 'express';
export declare class ContentController {
    static getAll(req: Request, _res: Response): Promise<void>;
    static getOne(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    static create(req: Request, _res: Response): Promise<void>;
    static update(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    static delete(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    static bulkUpdate(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    static getAnalytics(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=ContentController.d.ts.map