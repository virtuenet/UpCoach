import { Request, Response } from 'express';
export declare class MediaController {
    static uploadSingle: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    static uploadMultiple: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    static processUpload(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    static processMultipleUploads(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    static getAll(req: Request, _res: Response): Promise<void>;
    static getOne(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    static update(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    static delete(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    static getStats(req: Request, res: Response): Promise<void>;
}
export default MediaController;
//# sourceMappingURL=MediaController.d.ts.map