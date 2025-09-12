export declare class SchedulerService {
    private static jobs;
    static initialize(): void;
    private static scheduleJob;
    static stopJob(name: string): boolean;
    static stopAllJobs(): void;
    static getJobStatus(): {
        name: string;
        running: boolean;
    }[];
    private static performWeeklyCostAnalysis;
    private static performMonthlyHealthCheck;
    private static generateQuarterlyProjections;
    private static checkRealTimeAlerts;
    private static analyzeCostTrends;
    private static generateCostRecommendations;
    private static checkCostAlerts;
    private static calculateHealthScore;
    private static identifyRisks;
    private static identifyOpportunities;
    private static generateHealthRecommendations;
    private static sendHealthReport;
    private static getHistoricalQuarterlyData;
    private static projectRevenue;
    private static projectCosts;
    private static projectGrowth;
    private static identifyProjectionRisks;
    private static saveProjections;
    private static getPreviousRevenue;
    private static sendCriticalAlerts;
}
//# sourceMappingURL=SchedulerService.d.ts.map