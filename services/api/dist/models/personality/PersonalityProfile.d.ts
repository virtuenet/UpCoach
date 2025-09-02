import { Model, Optional } from 'sequelize';
export interface PersonalityTraits {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
}
export interface PersonalityInsights {
    primaryTraits: string[];
    strengths: string[];
    growthAreas: string[];
    coachingStyle: CoachingStylePreference;
    communicationStyle: CommunicationStyle;
    motivationFactors: MotivationFactor[];
}
export interface CoachingStylePreference {
    approach: 'directive' | 'collaborative' | 'supportive' | 'challenging';
    feedback: 'direct' | 'gentle' | 'encouraging' | 'analytical';
    pace: 'fast' | 'moderate' | 'slow';
    structure: 'high' | 'medium' | 'low';
}
export interface CommunicationStyle {
    tone: 'formal' | 'casual' | 'warm' | 'professional';
    detail: 'brief' | 'moderate' | 'detailed';
    examples: 'abstract' | 'concrete' | 'mixed';
    encouragement: 'high' | 'medium' | 'low';
}
export interface MotivationFactor {
    factor: string;
    importance: number;
    description: string;
}
export interface PersonalityProfileAttributes {
    id: string;
    userId: string;
    assessmentType: 'big_five' | 'mbti' | 'disc' | 'custom';
    traits: PersonalityTraits;
    mbtiType?: string;
    discProfile?: string;
    insights: PersonalityInsights;
    confidence: number;
    assessmentDate: Date;
    questionsAnswered: number;
    totalQuestions: number;
    responses: Record<string, any>[];
    version: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface PersonalityProfileCreationAttributes extends Optional<PersonalityProfileAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> {
}
declare class PersonalityProfile extends Model<PersonalityProfileAttributes, PersonalityProfileCreationAttributes> implements PersonalityProfileAttributes {
    id: string;
    userId: string;
    assessmentType: 'big_five' | 'mbti' | 'disc' | 'custom';
    traits: PersonalityTraits;
    mbtiType?: string;
    discProfile?: string;
    insights: PersonalityInsights;
    confidence: number;
    assessmentDate: Date;
    questionsAnswered: number;
    totalQuestions: number;
    responses: Record<string, any>[];
    version: string;
    isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    getDominantTrait(): string;
    getTraitDescription(trait: keyof PersonalityTraits): string;
    getRecommendedAvatar(): string;
    isCompleteAssessment(): boolean;
    getPersonalityScoreCard(): {
        trait: string;
        score: number;
        level: 'low' | 'moderate' | 'high';
        description: string;
    }[];
    static getActiveProfile(userId: string): Promise<PersonalityProfile | null>;
    static createFromAssessment(userId: string, responses: Record<string, any>[], assessmentType?: 'big_five' | 'mbti' | 'disc' | 'custom'): Promise<PersonalityProfile>;
    private static calculateTraitsFromResponses;
    private static generateInsights;
    private static getStrengthsForTraits;
    private static getGrowthAreasForTraits;
    private static getCoachingStyle;
    private static getCommunicationStyle;
    private static getMotivationFactors;
    private static calculateConfidence;
    private static calculateResponseConsistency;
    private static calculateVariance;
    private static getQuestionMapping;
    private static getTotalQuestions;
}
export { PersonalityProfile };
//# sourceMappingURL=PersonalityProfile.d.ts.map