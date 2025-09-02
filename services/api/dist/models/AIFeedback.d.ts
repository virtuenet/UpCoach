import { Model } from 'sequelize-typescript';
import { AIInteraction } from './AIInteraction';
export declare class AIFeedback extends Model {
    id: number;
    interactionId: number;
    interaction: AIInteraction;
    userId: number;
    user: any;
    sentiment?: 'positive' | 'neutral' | 'negative';
    rating?: number;
    feedbackText?: string;
    createdAt: Date;
    static recordFeedback(data: {
        interactionId: number;
        userId: number;
        sentiment?: 'positive' | 'neutral' | 'negative';
        rating?: number;
        feedbackText?: string;
    }): Promise<AIFeedback>;
    static getAverageSentiment(startDate?: Date, endDate?: Date): Promise<{
        positive: number;
        neutral: number;
        negative: number;
    }>;
    static getAverageRating(startDate?: Date, endDate?: Date): Promise<number>;
}
//# sourceMappingURL=AIFeedback.d.ts.map