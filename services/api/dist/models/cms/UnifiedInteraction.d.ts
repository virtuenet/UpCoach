/**
 * Unified Interaction Model
 * Consolidates ContentInteraction, Comment, ContentComment, and analytics models
 */
import { Model, Sequelize, Optional } from 'sequelize';
export interface UnifiedInteractionAttributes {
    id: string;
    type: 'view' | 'like' | 'share' | 'comment' | 'rating' | 'bookmark' | 'report' | 'download';
    contentId: string;
    userId: string;
    commentData?: {
        text: string;
        parentId?: string;
        isEdited?: boolean;
        editedAt?: Date;
        isApproved?: boolean;
        isPinned?: boolean;
    };
    ratingData?: {
        score: number;
        review?: string;
        isVerified?: boolean;
    };
    shareData?: {
        platform?: 'facebook' | 'twitter' | 'linkedin' | 'email' | 'whatsapp' | 'other';
        url?: string;
    };
    reportData?: {
        reason: string;
        description?: string;
        status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
        reviewedBy?: string;
        reviewedAt?: Date;
    };
    metadata?: {
        ipAddress?: string;
        userAgent?: string;
        referrer?: string;
        sessionId?: string;
        deviceType?: string;
        location?: {
            country?: string;
            city?: string;
        };
        duration?: number;
    };
    createdAt?: Date;
    updatedAt?: Date;
}
export interface UnifiedInteractionCreationAttributes extends Optional<UnifiedInteractionAttributes, 'id' | 'commentData' | 'ratingData' | 'shareData' | 'reportData' | 'metadata' | 'createdAt' | 'updatedAt'> {
}
export declare class UnifiedInteraction extends Model<UnifiedInteractionAttributes, UnifiedInteractionCreationAttributes> implements UnifiedInteractionAttributes {
    id: string;
    type: 'view' | 'like' | 'share' | 'comment' | 'rating' | 'bookmark' | 'report' | 'download';
    contentId: string;
    userId: string;
    commentData?: UnifiedInteractionAttributes['commentData'];
    ratingData?: UnifiedInteractionAttributes['ratingData'];
    shareData?: UnifiedInteractionAttributes['shareData'];
    reportData?: UnifiedInteractionAttributes['reportData'];
    metadata?: UnifiedInteractionAttributes['metadata'];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initialize(sequelize: Sequelize): void;
}
export default UnifiedInteraction;
//# sourceMappingURL=UnifiedInteraction.d.ts.map