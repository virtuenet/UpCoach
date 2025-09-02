import { Model } from 'sequelize-typescript';
import { CoachProfile } from './CoachProfile';
import { CoachSession } from './CoachSession';
export declare class CoachReview extends Model {
    id: number;
    coachId: number;
    coach: CoachProfile;
    clientId: number;
    client: any;
    sessionId?: number;
    session?: CoachSession;
    rating: number;
    title?: string;
    comment: string;
    communicationRating?: number;
    knowledgeRating?: number;
    helpfulnessRating?: number;
    isVerified: boolean;
    isFeatured: boolean;
    isVisible: boolean;
    coachResponse?: string;
    coachResponseAt?: Date;
    helpfulCount: number;
    unhelpfulCount: number;
    createdAt: Date;
    updatedAt: Date;
    static updateCoachRating(instance: CoachReview): Promise<void>;
    updateCoachStats(): Promise<void>;
    markAsHelpful(userId: number): Promise<void>;
    markAsUnhelpful(userId: number): Promise<void>;
    addCoachResponse(response: string): Promise<void>;
    canBeEditedBy(userId: number): boolean;
    static getCoachReviews(coachId: number, options?: {
        limit?: number;
        offset?: number;
        sortBy?: 'recent' | 'rating' | 'helpful';
        minRating?: number;
    }): Promise<{
        reviews: CoachReview[];
        total: number;
    }>;
    static getReviewStats(coachId: number): Promise<{
        totalReviews: number;
        averageRating: number;
        ratingDistribution: Record<number, number>;
        detailedRatings: {
            communication: number;
            knowledge: number;
            helpfulness: number;
        };
    }>;
    private static calculateAverage;
    static hasUserReviewedCoach(clientId: number, coachId: number): Promise<boolean>;
}
//# sourceMappingURL=CoachReview.d.ts.map