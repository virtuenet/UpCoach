import { Model, Optional } from 'sequelize';
export interface CoachMemoryAttributes {
    id: string;
    userId: string;
    avatarId: string;
    sessionId: string;
    memoryType: 'conversation' | 'insight' | 'goal' | 'pattern' | 'preference' | 'milestone';
    content: string;
    summary: string;
    tags: string[];
    emotionalContext: {
        mood: string;
        sentiment: number;
        emotionalTrends: string[];
    };
    coachingContext: {
        topic: string;
        category: string;
        importance: number;
        actionItems: string[];
        followUpNeeded: boolean;
    };
    conversationDate: Date;
    lastReferencedDate?: Date;
    expiryDate?: Date;
    importance: number;
    relevanceScore: number;
    accessCount: number;
    relatedMemoryIds: string[];
    parentMemoryId?: string;
    childMemoryIds: string[];
    aiProcessed: boolean;
    insightsGenerated: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface CoachMemoryCreationAttributes extends Optional<CoachMemoryAttributes, 'id' | 'lastReferencedDate' | 'expiryDate' | 'relevanceScore' | 'accessCount' | 'relatedMemoryIds' | 'parentMemoryId' | 'childMemoryIds' | 'aiProcessed' | 'insightsGenerated' | 'createdAt' | 'updatedAt'> {
}
export declare class CoachMemory extends Model<CoachMemoryAttributes, CoachMemoryCreationAttributes> implements CoachMemoryAttributes {
    id: string;
    userId: string;
    avatarId: string;
    sessionId: string;
    memoryType: 'conversation' | 'insight' | 'goal' | 'pattern' | 'preference' | 'milestone';
    content: string;
    summary: string;
    tags: string[];
    emotionalContext: {
        mood: string;
        sentiment: number;
        emotionalTrends: string[];
    };
    coachingContext: {
        topic: string;
        category: string;
        importance: number;
        actionItems: string[];
        followUpNeeded: boolean;
    };
    conversationDate: Date;
    lastReferencedDate?: Date;
    expiryDate?: Date;
    importance: number;
    relevanceScore: number;
    accessCount: number;
    relatedMemoryIds: string[];
    parentMemoryId?: string;
    childMemoryIds: string[];
    aiProcessed: boolean;
    insightsGenerated: string[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    isRelevant(): boolean;
    updateRelevanceScore(currentContext: {
        topics: string[];
        mood: string;
        recentGoals: string[];
    }): void;
    recordAccess(): void;
}
export default CoachMemory;
//# sourceMappingURL=CoachMemory.d.ts.map