export interface Recommendation {
    id: string;
    type: 'habit' | 'goal' | 'task' | 'content' | 'coaching' | 'wellness';
    title: string;
    description: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    estimatedTime?: number;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    actionItems: string[];
    expectedOutcome: string;
    confidence: number;
    metadata?: any;
}
export interface RecommendationContext {
    userId: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek: number;
    currentMood?: string;
    energyLevel?: number;
    recentActivity?: any;
    preferences?: any;
}
export declare class RecommendationEngine {
    private recommendationStrategies;
    constructor();
    private initializeStrategies;
    generateRecommendations(userId: string, types?: string[], limit?: number): Promise<Recommendation[]>;
    private buildRecommendationContext;
    private generateHabitRecommendations;
    private generateGoalRecommendations;
    private generateTaskRecommendations;
    private generateWellnessRecommendations;
    private personalizeRecommendations;
    private hasRecentReflectionActivity;
    private hasFragmentedTasks;
    private formatGrowthArea;
    getOptimalTiming(userId: string, activityType: string): Promise<{
        bestTime: string;
        reason: string;
        alternativeTimes: string[];
    }>;
    generateAdaptiveSchedule(userId: string, _date: Date): Promise<{
        schedule: Array<{
            time: string;
            activity: string;
            duration: number;
            type: string;
            priority: string;
        }>;
        tips: string[];
    }>;
}
export declare const recommendationEngine: RecommendationEngine;
//# sourceMappingURL=RecommendationEngine.d.ts.map