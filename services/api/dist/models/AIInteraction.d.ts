import { Model } from 'sequelize-typescript';
import { AIFeedback } from './AIFeedback';
export declare class AIInteraction extends Model {
    id: number;
    userId?: number;
    user?: any;
    type: 'conversation' | 'recommendation' | 'voice' | 'prediction' | 'insight';
    model: string;
    tokensUsed: number;
    responseTime?: number;
    sessionId?: string;
    requestData?: any;
    responseData?: any;
    metadata?: any;
    feedback?: AIFeedback[];
    createdAt: Date;
    updatedAt: Date;
    recordInteraction(data: {
        userId?: number;
        type: AIInteraction['type'];
        model: string;
        tokensUsed: number;
        responseTime: number;
        sessionId?: string;
        requestData?: any;
        responseData?: any;
        metadata?: any;
    }): Promise<AIInteraction>;
    static getRecentInteractions(limit?: number): Promise<AIInteraction[]>;
    static getUserInteractions(userId: number, limit?: number): Promise<AIInteraction[]>;
    static getInteractionsByType(type: AIInteraction['type'], startDate?: Date, endDate?: Date): Promise<AIInteraction[]>;
    static getTokenUsage(startDate: Date, endDate?: Date): Promise<number>;
}
//# sourceMappingURL=AIInteraction.d.ts.map