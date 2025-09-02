import { Model, Optional } from 'sequelize';
export interface CommentAttributes {
    id: string;
    content: string;
    contentType: 'article' | 'course' | 'template';
    contentId: string;
    type: 'comment' | 'suggestion' | 'approval' | 'revision_request';
    status: 'active' | 'resolved' | 'hidden' | 'deleted';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    position?: {
        startOffset: number;
        endOffset: number;
        selectedText: string;
        elementId?: string;
    };
    parentId?: string;
    threadId: string;
    depth: number;
    mentions: string[];
    attachments: Array<{
        id: string;
        name: string;
        url: string;
        type: string;
        size: number;
    }>;
    reactions: Record<string, string[]>;
    isResolved: boolean;
    resolvedBy?: string;
    resolvedAt?: string;
    revisionId?: string;
    changesSuggested?: {
        field: string;
        originalValue: string;
        suggestedValue: string;
        applied: boolean;
    }[];
    workflowState?: 'pending_review' | 'approved' | 'rejected' | 'needs_changes';
    reviewerAssigned?: string;
    dueDate?: string;
    authorId: string;
    createdAt: string;
    updatedAt: string;
    editedAt?: string;
}
export interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'createdAt' | 'updatedAt' | 'threadId' | 'depth' | 'mentions' | 'attachments' | 'reactions' | 'isResolved'> {
}
export declare class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
    id: string;
    content: string;
    contentType: 'article' | 'course' | 'template';
    contentId: string;
    type: 'comment' | 'suggestion' | 'approval' | 'revision_request';
    status: 'active' | 'resolved' | 'hidden' | 'deleted';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    position: CommentAttributes['position'];
    parentId: string;
    threadId: string;
    depth: number;
    mentions: string[];
    attachments: CommentAttributes['attachments'];
    reactions: Record<string, string[]>;
    isResolved: boolean;
    resolvedBy: string;
    resolvedAt: string;
    revisionId: string;
    changesSuggested: CommentAttributes['changesSuggested'];
    workflowState: CommentAttributes['workflowState'];
    reviewerAssigned: string;
    dueDate: string;
    authorId: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    editedAt: string;
    static getCommentThread(threadId: string): Promise<Comment[]>;
    static getCommentsForContent(contentType: string, contentId: string, options?: {
        includeResolved?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<{
        comments: Comment[];
        total: number;
    }>;
    static createThread(data: {
        contentType: 'article' | 'course' | 'template';
        contentId: string;
        authorId: string;
        content: string;
        type?: 'comment' | 'suggestion' | 'approval' | 'revision_request';
        position?: CommentAttributes['position'];
        priority?: 'low' | 'medium' | 'high' | 'urgent';
    }): Promise<Comment>;
    static replyToComment(parentId: string, data: {
        authorId: string;
        content: string;
        type?: 'comment' | 'suggestion' | 'approval' | 'revision_request';
    }): Promise<Comment>;
    static extractMentions(content: string): string[];
    static getUnresolvedComments(contentType: string, contentId: string): Promise<Comment[]>;
    static getPendingReviews(reviewerId: string): Promise<Comment[]>;
    static getCommentStats(contentType: string, contentId: string): Promise<{
        total: number;
        unresolved: number;
        suggestions: number;
        approvals: number;
        revisionRequests: number;
    }>;
    addReaction(emoji: string, userId: string): Promise<void>;
    removeReaction(emoji: string, userId: string): Promise<void>;
    resolve(resolvedBy: string): Promise<void>;
    assignReviewer(reviewerId: string, dueDate?: string): Promise<void>;
    approveChanges(approverId: string): Promise<void>;
    rejectChanges(reviewerId: string, reason?: string): Promise<void>;
}
export default Comment;
//# sourceMappingURL=Comment.d.ts.map