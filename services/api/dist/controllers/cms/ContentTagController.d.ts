import { Request, Response } from 'express';
export declare class ContentTagController {
    static getAll(req: Request, _res: Response): Promise<void>;
    static getOne(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    static create(req: Request, _res: Response): Promise<void>;
    static update(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    static delete(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    static merge(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    static getPopular(req: Request, _res: Response): Promise<void>;
    static getSuggestions(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=ContentTagController.d.ts.map