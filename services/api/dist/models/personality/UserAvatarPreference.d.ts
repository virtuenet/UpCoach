import { Model, Optional } from 'sequelize';
export interface CustomizationSettings {
    voiceSettings?: {
        speed?: number;
        pitch?: number;
        tone?: string;
    };
    visualSettings?: {
        preferredExpression?: string;
        colorPreference?: string;
    };
    behaviorSettings?: {
        encouragementFrequency?: 'low' | 'medium' | 'high';
        celebrationStyle?: 'subtle' | 'moderate' | 'enthusiastic';
        questioningDepth?: 'surface' | 'moderate' | 'deep';
    };
    communicationSettings?: {
        formality?: 'casual' | 'balanced' | 'formal';
        directness?: 'gentle' | 'balanced' | 'direct';
        supportLevel?: 'independent' | 'balanced' | 'nurturing';
    };
}
export interface InteractionHistory {
    totalInteractions: number;
    averageSessionLength: number;
    preferredTimeOfDay: string[];
    commonTopics: string[];
    satisfactionRatings: number[];
    lastInteractionDate: Date;
}
export interface UserAvatarPreferenceAttributes {
    id: string;
    userId: string;
    avatarId: string;
    isActive: boolean;
    selectedAt: Date;
    customizations: CustomizationSettings;
    interactionHistory: InteractionHistory;
    satisfactionScore: number;
    feedbackNotes: string;
    compatibilityScore: number;
    usageCount: number;
    totalSessionTime: number;
    lastUsedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
interface UserAvatarPreferenceCreationAttributes extends Optional<UserAvatarPreferenceAttributes, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'totalSessionTime' | 'satisfactionScore' | 'feedbackNotes'> {
}
declare class UserAvatarPreference extends Model<UserAvatarPreferenceAttributes, UserAvatarPreferenceCreationAttributes> implements UserAvatarPreferenceAttributes {
    id: string;
    userId: string;
    avatarId: string;
    isActive: boolean;
    selectedAt: Date;
    customizations: CustomizationSettings;
    interactionHistory: InteractionHistory;
    satisfactionScore: number;
    feedbackNotes: string;
    compatibilityScore: number;
    usageCount: number;
    totalSessionTime: number;
    lastUsedAt: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    recordInteraction(sessionLength: number, topics?: string[], rating?: number): void;
    getAverageRating(): number;
    isRecentlyUsed(dayThreshold?: number): boolean;
    getEngagementLevel(): 'low' | 'medium' | 'high';
    updateCustomization(settings: Partial<CustomizationSettings>): void;
    calculateRetentionRisk(): 'low' | 'medium' | 'high';
    static getActivePreference(userId: string): Promise<UserAvatarPreference | null>;
    static setActiveAvatar(userId: string, avatarId: string): Promise<UserAvatarPreference>;
    static getUserHistory(userId: string): Promise<UserAvatarPreference[]>;
    static getPopularAvatars(limit?: number): Promise<{
        avatarId: string;
        userCount: number;
        averageRating: number;
        totalUsage: number;
    }[]>;
    static getAvatarAnalytics(avatarId: string): Promise<{
        totalUsers: number;
        activeUsers: number;
        averageRating: number;
        averageSessionTime: number;
        retentionRate: number;
        commonCustomizations: Record<string, any>;
    }>;
    static getRecommendationsForUser(userId: string): Promise<{
        suggestedAvatars: string[];
        reasons: string[];
    }>;
    private static analyzeCommonCustomizations;
    private static getMostCommon;
}
export { UserAvatarPreference };
//# sourceMappingURL=UserAvatarPreference.d.ts.map