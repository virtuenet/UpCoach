export declare class SchedulerService {
    private static jobs;
    /**
     * Initialize all scheduled jobs
     */
    static initialize(): void;
    /**
     * Schedule a new job
     */
    private static scheduleJob;
    /**
     * Stop a scheduled job
     */
    static stopJob(name: string): boolean;
    /**
     * Stop all jobs
     */
    static stopAllJobs(): void;
    /**
     * Get job status
     */
    static getJobStatus(): {
        name: string;
        running: boolean;
    }[];
    /**
     * Perform weekly cost analysis
     */
    private static performWeeklyCostAnalysis;
    /**
     * Perform monthly financial health check
     */
    private static performMonthlyHealthCheck;
    /**
     * Generate quarterly projections
     */
    private static generateQuarterlyProjections;
    /**
     * Check real-time alerts
     */
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