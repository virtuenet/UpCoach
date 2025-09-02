interface CohortDefinition {
    name: string;
    description?: string;
    type: 'signup_date' | 'subscription' | 'behavior' | 'custom';
    startDate?: Date;
    endDate?: Date;
    filters?: any;
}
interface RetentionData {
    period: number;
    usersRetained: number;
    retentionRate: number;
    churnRate: number;
    activeUsers: number;
}
interface FunnelStep {
    name: string;
    eventType: string;
    filters?: any;
}
interface FunnelData {
    step: string;
    users: number;
    conversionRate: number;
    dropoffRate: number;
    avgTimeToComplete?: number;
}
export declare class AdvancedAnalyticsService {
    createCohort(definition: CohortDefinition, createdBy: number): Promise<number>;
    private populateCohortMembers;
    private buildCustomCohortQuery;
    calculateRetention(cohortId: number, periodType?: 'day' | 'week' | 'month'): Promise<RetentionData[]>;
    trackActivity(userId: number, activityType: string, data?: any, sessionId?: string): Promise<void>;
    private updateFeatureUsage;
    createFunnel(name: string, steps: FunnelStep[], description?: string): Promise<number>;
    trackFunnelStep(funnelId: number, userId: number, stepIndex: number, attribution?: {
        source?: string;
        medium?: string;
        campaign?: string;
    }): Promise<void>;
    getFunnelAnalytics(funnelId: number, startDate?: Date, endDate?: Date): Promise<FunnelData[]>;
    calculateRevenueAnalytics(date: Date): Promise<void>;
    compareCohorts(cohortIds: number[], metricType: 'retention' | 'revenue' | 'engagement'): Promise<any>;
    getFeatureAdoption(featureName?: string, startDate?: Date, endDate?: Date): Promise<any>;
    getUserLifecycleStage(userId: number): Promise<string>;
    runDailyAnalytics(): Promise<void>;
}
export declare const advancedAnalyticsService: AdvancedAnalyticsService;
export {};
//# sourceMappingURL=AdvancedAnalyticsService.d.ts.map