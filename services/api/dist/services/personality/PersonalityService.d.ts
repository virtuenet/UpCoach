import { PersonalityProfile, PersonalityTraits } from '../../models/personality/PersonalityProfile';
import { Avatar } from '../../models/personality/Avatar';
import { UserAvatarPreference } from '../../models/personality/UserAvatarPreference';
export interface AssessmentQuestion {
    id: string;
    question: string;
    trait: keyof PersonalityTraits;
    isReversed: boolean;
    scale: {
        min: number;
        max: number;
        labels: {
            value: number;
            label: string;
        }[];
    };
    category: string;
}
export interface AssessmentResponse {
    questionId: string;
    value: number;
    timeSpent: number;
    confidence: number;
}
export interface PersonalityAssessmentResult {
    profile: PersonalityProfile;
    recommendedAvatars: {
        avatar: Avatar;
        compatibilityScore: number;
        reasons: string[];
    }[];
    insights: {
        summary: string;
        strengths: string[];
        growthAreas: string[];
        coachingRecommendations: string[];
    };
}
export declare class PersonalityService {
    private static readonly BIG_FIVE_QUESTIONS;
    static getAssessmentQuestions(assessmentType?: 'big_five' | 'short' | 'comprehensive'): AssessmentQuestion[];
    static processAssessment(userId: string, responses: AssessmentResponse[], assessmentType?: 'big_five' | 'mbti' | 'disc' | 'custom'): Promise<PersonalityAssessmentResult>;
    private static calculateTraits;
    private static calculateTraitScore;
    private static getAvatarRecommendations;
    private static generateCompatibilityReasons;
    private static getDominantTrait;
    private static generatePersonalizedInsights;
    private static generatePersonalitySummary;
    private static generateCoachingRecommendations;
    private static getEnvironmentPreference;
    private static getGrowthPreference;
    static getUserProfile(userId: string): Promise<PersonalityProfile | null>;
    static selectAvatar(userId: string, avatarId: string, customizations?: any): Promise<UserAvatarPreference>;
    static recordInteraction(userId: string, sessionLength: number, topics?: string[], rating?: number): Promise<void>;
    static getAvatarAnalytics(avatarId: string): Promise<{
        totalUsers: number;
        activeUsers: number;
        averageRating: number;
        averageSessionTime: number;
        retentionRate: number;
        commonCustomizations: Record<string, any>;
    }>;
    static getUserRecommendations(userId: string): Promise<{
        suggestedAvatars: string[];
        reasons: string[];
    }>;
}
export default PersonalityService;
//# sourceMappingURL=PersonalityService.d.ts.map