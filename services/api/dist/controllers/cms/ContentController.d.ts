import { Request, Response } from 'express';
export declare class ContentController {
    static getAll(req: Request, _res: Response): Promise<void>;
    static getOne(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static create(req: Request, _res: Response): Promise<void>;
    static update(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static delete(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static bulkUpdate(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getAnalytics(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=ContentController.d.ts.map