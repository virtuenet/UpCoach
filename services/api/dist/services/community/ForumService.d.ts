interface CreateThreadData {
    categoryId: string;
    userId: string;
    title: string;
    content: string;
    tags?: string[];
}
interface CreatePostData {
    threadId: string;
    userId: string;
    content: string;
    parentId?: string;
}
interface ForumSearchParams {
    query?: string;
    categoryId?: string;
    tags?: string[];
    userId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'latest' | 'popular' | 'unanswered';
}
export declare class ForumService {
    getCategories(): Promise<any[]>;
    createThread(data: CreateThreadData): Promise<any>;
    getThreads(params: ForumSearchParams): Promise<{
        threads: any[];
        total: number;
        pages: number;
    }>;
    getThread(threadId: string, userId?: string): Promise<any | null>;
    createPost(data: CreatePostData): Promise<any>;
    votePost(postId: string, userId: string, voteType: 1 | -1): Promise<number>;
    editPost(postId: string, userId: string, content: string): Promise<any>;
    deletePost(postId: string, userId: string, isAdmin?: boolean): Promise<void>;
    markAsSolution(postId: string, userId: string): Promise<void>;
    private sanitizeContent;
    private trackActivity;
    private updateUserReputation;
    private notifyThreadParticipants;
}
export declare const forumService: ForumService;
export {};
//# sourceMappingURL=ForumService.d.ts.map