import { Request, Response } from 'express';
export declare class ForumController {
    getCategories(req: Request, res: Response): Promise<void>;
    getThreads(req: Request, _res: Response): Promise<void>;
    getThread(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createThread(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createPost(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    votePost(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    editPost(req: Request, _res: Response): Promise<void>;
    deletePost(req: Request, _res: Response): Promise<void>;
    markAsSolution(req: Request, _res: Response): Promise<void>;
}
declare const _default: ForumController;
export default _default;
//# sourceMappingURL=ForumController.d.ts.map