import { Model, Optional } from 'sequelize';
export interface AvatarPersonality {
    recommendedFor: {
        traits: Record<string, {
            min?: number;
            max?: number;
        }>;
        mbtiTypes?: string[];
        discProfiles?: string[];
    };
    characteristics: string[];
    coachingStyle: {
        approach: string;
        tone: string;
        communication: string;
        motivation: string;
    };
}
export interface AvatarVisuals {
    profileImage: string;
    thumbnailImage: string;
    animationSet: string[];
    colorScheme: {
        primary: string;
        secondary: string;
        accent: string;
    };
    expressions: {
        happy: string;
        encouraging: string;
        thinking: string;
        concerned: string;
        excited: string;
    };
}
export interface AvatarVoice {
    voiceId: string;
    language: string;
    accent: string;
    speed: number;
    pitch: number;
    tone: 'warm' | 'professional' | 'energetic' | 'calm';
}
export interface AvatarBehavior {
    greetingStyle: string[];
    encouragementPhrases: string[];
    questioningApproach: string[];
    celebrationStyle: string[];
    supportiveResponses: string[];
    challengingPrompts: string[];
}
export interface AvatarAttributes {
    id: string;
    name: string;
    description: string;
    category: 'mentor' | 'friend' | 'coach' | 'guide' | 'specialist';
    personality: AvatarPersonality;
    visuals: AvatarVisuals;
    voice: AvatarVoice;
    behavior: AvatarBehavior;
    isActive: boolean;
    isPremium: boolean;
    sortOrder: number;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}
interface AvatarCreationAttributes extends Optional<AvatarAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'sortOrder'> {
}
declare class Avatar extends Model<AvatarAttributes, AvatarCreationAttributes> implements AvatarAttributes {
    id: string;
    name: string;
    description: string;
    category: 'mentor' | 'friend' | 'coach' | 'guide' | 'specialist';
    personality: AvatarPersonality;
    visuals: AvatarVisuals;
    voice: AvatarVoice;
    behavior: AvatarBehavior;
    isActive: boolean;
    isPremium: boolean;
    sortOrder: number;
    createdBy: string;
    updatedBy: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    calculateCompatibilityScore(traits: Record<string, number>): number;
    getRandomGreeting(): string;
    getRandomEncouragement(): string;
    getRandomCelebration(): string;
    getExpressionForMood(mood: number): string;
    isCompatibleWithMBTI(mbtiType: string): boolean;
    isCompatibleWithDISC(discProfile: string): boolean;
    static getActiveAvatars(): Promise<Avatar[]>;
    static getRecommendedAvatars(traits: Record<string, number>, limit?: number): Promise<{
        avatar: Avatar;
        compatibilityScore: number;
    }[]>;
    static findByPersonalityType(traits: Record<string, number>, mbtiType?: string, discProfile?: string): Promise<Avatar[]>;
    static getPopularAvatars(limit?: number): Promise<Avatar[]>;
    static seedDefaultAvatars(): Promise<void>;
}
export { Avatar };
//# sourceMappingURL=Avatar.d.ts.map