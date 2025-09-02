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
    /**
     * Get assessment questions based on type
     */
    static getAssessmentQuestions(assessmentType?: 'big_five' | 'short' | 'comprehensive'): AssessmentQuestion[];
    /**
     * Process assessment responses and create personality profile
     */
    static processAssessment(userId: string, responses: AssessmentResponse[], assessmentType?: 'big_five' | 'mbti' | 'disc' | 'custom'): Promise<PersonalityAssessmentResult>;
    /**
     * Calculate Big Five traits from assessment responses
     */
    private static calculateTraits;
    /**
     * Calculate individual trait score
     */
    private static calculateTraitScore;
    /**
     * Get avatar recommendations based on personality traits
     */
    private static getAvatarRecommendations;
    /**
     * Generate reasons for avatar compatibility
     */
    private static generateCompatibilityReasons;
    /**
     * Get dominant personality trait
     */
    private static getDominantTrait;
    /**
     * Generate personalized insights
     */
    private static generatePersonalizedInsights;
    /**
     * Generate personality summary
     */
    private static generatePersonalitySummary;
    /**
     * Generate coaching recommendations
     */
    private static generateCoachingRecommendations;
    /**
     * Get environment preference based on dominant trait
     */
    private static getEnvironmentPreference;
    /**
     * Get growth preference based on secondary traits
     */
    private static getGrowthPreference;
    /**
     * Get personality profile for user
     */
    static getUserProfile(userId: string): Promise<PersonalityProfile | null>;
    /**
     * Update user's avatar selection
     */
    static selectAvatar(userId: string, avatarId: string, customizations?: any): Promise<UserAvatarPreference>;
    /**
     * Record interaction with avatar
     */
    static recordInteraction(userId: string, sessionLength: number, topics?: string[], rating?: number): Promise<void>;
    /**
     * Get avatar analytics for admin
     */
    static getAvatarAnalytics(avatarId: string): Promise<{
        totalUsers: number;
        activeUsers: number;
        averageRating: number;
        averageSessionTime: number;
        retentionRate: number;
        commonCustomizations: Record<string, any>;
    }>;
    /**
     * Get user recommendations
     */
    static getUserRecommendations(userId: string): Promise<{
        suggestedAvatars: string[];
        reasons: string[];
    }>;
}
export default PersonalityService;
//# sourceMappingURL=PersonalityService.d.ts.map