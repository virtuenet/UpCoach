export interface Insight {
    id: string;
    type: InsightType;
    title: string;
    description: string;
    category: InsightCategory;
    priority: 'high' | 'medium' | 'low';
    confidence: number;
    evidence: Evidence[];
    actionItems: ActionItem[];
    visualizations?: Visualization[];
    relatedInsights?: string[];
    expiresAt?: Date;
    metadata?: any;
}
export type InsightType = 'pattern' | 'anomaly' | 'prediction' | 'recommendation' | 'achievement' | 'risk' | 'opportunity' | 'correlation';
export type InsightCategory = 'productivity' | 'wellbeing' | 'goals' | 'habits' | 'progress' | 'engagement' | 'health' | 'learning';
export interface Evidence {
    type: 'data' | 'pattern' | 'comparison' | 'trend';
    description: string;
    dataPoints: any[];
    strength: number;
}
export interface ActionItem {
    id: string;
    action: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    estimatedImpact: string;
    estimatedTime: number;
    category: string;
}
export interface Visualization {
    type: 'chart' | 'metric' | 'timeline' | 'comparison';
    data: any;
    config: any;
}
export interface InsightReport {
    userId: string;
    generatedAt: Date;
    period: {
        start: Date;
        end: Date;
    };
    insights: Insight[];
    summary: {
        totalInsights: number;
        highPriorityCount: number;
        categories: Record<InsightCategory, number>;
        keyTakeaways: string[];
    };
    trends: Trend[];
    recommendations: string[];
}
export interface Trend {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
    significance: 'high' | 'medium' | 'low';
    interpretation: string;
}
export declare class InsightGenerator {
    private insightCache;
    private generationStrategies;
    constructor();
    private initializeStrategies;
    generateInsightReport(userId: string, period?: {
        days?: number;
        start?: Date;
        end?: Date;
    }): Promise<InsightReport>;
    private gatherUserData;
    private calculateMetrics;
    private generatePatternInsights;
    private generateAnomalyInsights;
    private generatePredictionInsights;
    private generateRecommendationInsights;
    private generateAchievementInsights;
    private generateRiskInsights;
    private generateOpportunityInsights;
    private generateCorrelationInsights;
    private analyzeTaskPatterns;
    private buildProductivityHeatmap;
    private analyzeMoodPatterns;
    private detectMoodAnomaly;
    private generateProgressProjection;
    private mapRecommendationCategory;
    private calculateTaskMoodCorrelation;
    private analyzeTrends;
    private calculateTrend;
    private calculateMoodTrend;
    private calculateEngagementTrend;
    private calculateCurrentStreak;
    private calculateAverageMood;
    private calculateMoodVariability;
    private analyzeProductiveHours;
    private calculateTaskVelocity;
    private rankInsights;
    private generateSummary;
    private extractKeyTakeaways;
    private generateReportRecommendations;
    private cacheInsights;
    getActiveInsights(userId: string): Promise<Insight[]>;
    dismissInsight(userId: string, insightId: string): Promise<void>;
}
export declare const insightGenerator: InsightGenerator;
//# sourceMappingURL=InsightGenerator.d.ts.map