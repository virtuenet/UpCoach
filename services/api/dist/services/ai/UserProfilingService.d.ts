import { UserProfile } from '../../models/UserProfile';
export interface ProfileInsight {
    category: string;
    insight: string;
    confidence: number;
    evidence: string[];
}
export interface ProfileAssessment {
    learningStyle: string;
    communicationPreference: string;
    personalityTraits: string[];
    strengths: string[];
    growthAreas: string[];
    motivators: string[];
    obstacles: string[];
    recommendations: string[];
}
export declare class UserProfilingService {
    createOrUpdateProfile(userId: string): Promise<UserProfile>;
    private updateProfileMetrics;
    private analyzeUserBehavior;
    private identifyPatternsAndInsights;
    private calculateCurrentStreak;
    private calculateAvgSessionDuration;
    private analyzeMessagePatterns;
    private analyzeMoodPatterns;
    private generateAIInsights;
    getProfileInsights(userId: string): Promise<ProfileInsight[]>;
    private getLearningStyleRecommendations;
    updateUserPreferences(userId: string, preferences: any): Promise<UserProfile>;
    getPersonalizedRecommendations(userId: string): Promise<string[]>;
    assessReadinessLevel(userId: string): Promise<{
        level: 'beginner' | 'intermediate' | 'advanced';
        reasoning: string;
        nextSteps: string[];
    }>;
}
export declare const userProfilingService: UserProfilingService;
//# sourceMappingURL=UserProfilingService.d.ts.map