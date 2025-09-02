import { Request, Response } from 'express';
export declare class ForumController {
    getCategories(req: Request, res: Response): Promise<void>;
    getThreads(req: Request, _res: Response): Promise<void>;
    getThread(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    createThread(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    createPost(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    votePost(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    editPost(req: Request, _res: Response): Promise<void>;
    deletePost(req: Request, _res: Response): Promise<void>;
    markAsSolution(req: Request, _res: Response): Promise<void>;
}
declare const _default: ForumController;
export default _default;
//# sourceMappingURL=ForumController.d.ts.map