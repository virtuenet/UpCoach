import CoachMemory from '../../models/coaching/CoachMemory';
import UserAnalytics from '../../models/analytics/UserAnalytics';
interface CoachingContext {
    userId: string;
    avatarId: string;
    sessionId: string;
    currentTopic: string;
    userMood: string;
    conversationHistory: string[];
    goals: string[];
}
interface MemoryInsight {
    type: 'pattern' | 'improvement' | 'concern' | 'achievement';
    title: string;
    description: string;
    relevanceScore: number;
    actionable: boolean;
    recommendations: string[];
}
interface CoachingRecommendation {
    type: 'approach' | 'topic' | 'technique' | 'schedule' | 'goal';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    title: string;
    description: string;
    rationale: string;
    expectedOutcome: string;
    implementation: string[];
}
interface WeeklyReport {
    userId: string;
    weekStart: Date;
    weekEnd: Date;
    summary: {
        totalSessions: number;
        avgSessionDuration: number;
        goalsProgress: number;
        engagementScore: number;
        moodTrend: string;
    };
    achievements: string[];
    challenges: string[];
    insights: MemoryInsight[];
    recommendations: CoachingRecommendation[];
    nextWeekFocus: string[];
}
export declare class CoachIntelligenceService {
    processCoachingSession(context: CoachingContext, conversationContent: string, sessionDuration: number, userFeedback?: {
        rating: number;
        comments?: string;
    }): Promise<CoachMemory>;
    getRelevantMemories(userId: string, currentContext: {
        topics: string[];
        mood: string;
        recentGoals: string[];
    }, limit?: number): Promise<CoachMemory[]>;
    generateCoachingRecommendations(userId: string, _avatarId: string): Promise<CoachingRecommendation[]>;
    generateWeeklyReport(userId: string): Promise<WeeklyReport>;
    calculateUserAnalytics(userId: string, periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly'): Promise<UserAnalytics>;
    private extractConversationInsights;
    private calculateMemoryImportance;
    private updateRelatedMemories;
    private processMemoryWithAI;
    private updateUserAnalytics;
    private analyzeSentiment;
    private analyzeSentimentFallback;
    private extractActionItemsFallback;
    private calculateStreakCount;
    private calculateResponsiveness;
    private calculateParticipationScore;
    private calculateFollowThroughRate;
    private calculateAvatarEffectiveness;
    private calculateSkillImprovement;
    private calculateConfidenceIncrease;
    private calculateStressReduction;
    private calculateHabitFormation;
    private calculatePreferredTime;
    private analyzeCommunicationStyle;
    private extractTopicsOfInterest;
    private extractChallengeAreas;
    private calculateMoodTrends;
    private analyzeLearningPreferences;
    private calculateSatisfactionScore;
    private calculateRetentionProbability;
    private calculateChurnRisk;
    private identifyStrengthAreas;
    private identifyImprovementAreas;
    private predictOutcomes;
    private identifyRiskFactors;
    private calculateDataQualityScore;
    private analyzeEmotionalPatterns;
    private calculateWeeklyGoalProgress;
    private calculateMoodTrend;
    private extractAchievements;
    private extractChallenges;
    private generateWeeklyInsights;
    private generateNextWeekFocus;
}
export default CoachIntelligenceService;
//# sourceMappingURL=CoachIntelligenceService.d.ts.map