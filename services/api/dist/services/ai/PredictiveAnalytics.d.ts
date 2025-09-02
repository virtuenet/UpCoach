export interface Prediction {
    type: 'success' | 'churn' | 'engagement' | 'goal_completion' | 'habit_formation';
    probability: number;
    timeframe: string;
    factors: {
        positive: string[];
        negative: string[];
    };
    recommendations: string[];
    confidence: number;
}
export interface BehaviorPattern {
    pattern: string;
    frequency: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    impact: 'positive' | 'neutral' | 'negative';
    insights: string[];
}
export interface RiskAssessment {
    riskType: string;
    severity: 'low' | 'medium' | 'high';
    probability: number;
    indicators: string[];
    mitigationStrategies: string[];
    timeToIntervention: number;
}
export declare class PredictiveAnalytics {
    predictUserSuccess(userId: string): Promise<Prediction>;
    predictChurnRisk(userId: string): Promise<RiskAssessment>;
    predictGoalCompletion(goalId: string): Promise<{
        probability: number;
        estimatedCompletionDate: Date;
        requiredWeeklyProgress: number;
        obstacles: string[];
        accelerators: string[];
    }>;
    analyzeBehaviorPatterns(userId: string): Promise<BehaviorPattern[]>;
    private gatherUserData;
    private calculateSuccessIndicators;
    private generateSuccessPrediction;
    private calculateEngagementMetrics;
    private generateMitigationStrategies;
    private calculateProgressVelocity;
    private analyzeCompletionPatterns;
    private identifyGoalFactors;
    private getAIGoalAnalysis;
    private analyzeTaskPatterns;
    private analyzeMoodPatterns;
    private analyzeEngagementPatterns;
    private analyzeGoalPatterns;
    private analyzeTimePatterns;
    private calculateMoodTrend;
    private detectStrategyChanges;
    private calculateResilience;
    private extractPositiveFactors;
    private extractNegativeFactors;
    private generatePersonalizedRecommendations;
    generateInterventionPlan(userId: string, _riskType: 'churn' | 'burnout' | 'stagnation'): Promise<{
        interventions: Array<{
            timing: string;
            action: string;
            channel: string;
            message: string;
            expectedImpact: string;
        }>;
        successMetrics: string[];
    }>;
}
export declare const predictiveAnalytics: PredictiveAnalytics;
//# sourceMappingURL=PredictiveAnalytics.d.ts.map