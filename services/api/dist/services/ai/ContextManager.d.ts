export interface UserContext {
    userId: string;
    userName?: string;
    userGoals?: any[];
    recentProgress?: string;
    currentMood?: string;
    streakDays?: number;
    learningStyle?: string;
    communicationPreference?: string;
    energyLevel?: number;
    progressStage?: string;
    currentGoal?: any;
    targetHabit?: any;
    dailyRoutine?: any;
    metrics?: any;
    todayAccomplishments?: string;
    todayChallenges?: string;
    currentChallenge?: any;
    availableResources?: string;
    preferredMethods?: string[];
    recentConversations?: any[];
    achievements?: any[];
    patterns?: any;
}
export declare class ContextManager {
    private contextCache;
    private readonly CACHE_TTL;
    constructor();
    getUserContext(userId: string): Promise<UserContext>;
    private buildUserContext;
    private calculateStreakDays;
    private determineProgressStage;
    private extractTargetHabit;
    private summarizeDailyRoutine;
    private calculateMotivationLevel;
    private calculateConsistencyScore;
    private calculateEngagementLevel;
    private getTodayAccomplishments;
    private extractChallenges;
    private identifyCurrentChallenge;
    private identifyAvailableResources;
    private summarizeRecentConversations;
    private extractTopics;
    private extractConversationPatterns;
    private calculateCommunicationFrequency;
    private calculateAverageMessageLength;
    private extractTimePreferences;
    private getUserAchievements;
    private getDefaultContext;
    enrichMessages(messages: any[], context: any): Promise<any[]>;
    clearCache(userId?: string): void;
}
export declare const contextManager: ContextManager;
//# sourceMappingURL=ContextManager.d.ts.map