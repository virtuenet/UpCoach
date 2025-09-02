import { FinancialSnapshot } from '../../models';
export declare class ReportingService {
    /**
     * Generate daily financial snapshot
     */
    generateDailySnapshot(): Promise<FinancialSnapshot>;
    /**
     * Generate scheduled reports
     */
    generateScheduledReports(): Promise<void>;
    /**
     * Generate daily summary report
     */
    private generateDailyReport;
    /**
     * Generate weekly business review
     */
    private generateWeeklyReport;
    /**
     * Generate monthly P&L report
     */
    private generateMonthlyReport;
    /**
     * Generate quarterly investor report
     */
    private generateQuarterlyReport;
    /**
     * Check for financial alerts
     */
    private checkFinancialAlerts;
    /**
     * Send alerts to stakeholders
     */
    private sendAlerts;
    /**
     * Send report to stakeholders
     */
    private sendReportToStakeholders;
    /**
     * Get report recipients based on type
     */
    private getReportRecipients;
    private shouldGenerateDailyReport;
    private shouldGenerateWeeklyReport;
    private shouldGenerateMonthlyReport;
    private shouldGenerateQuarterlyReport;
    private getHistoricalMetrics;
    private calculateChanges;
    private generateAlerts;
    private generateExecutiveSummary;
    private getWeeklyMetrics;
    private calculateTrends;
    private generateBusinessInsights;
    private generateRecommendations;
    private calculateKPIs;
    private getMonthlySnapshots;
    private getCohortAnalysis;
    private calculateMonthlyTrends;
    private calculateBudgetVariance;
    private generateForecast;
    private getQuarterlyMetrics;
    private getYearToDateMetrics;
    private getIndustryBenchmarks;
    private generateProjections;
    private generateQuarterlyHighlights;
    private identifyRisks;
    private identifyOpportunities;
}
export declare const reportingService: ReportingService;
//# sourceMappingURL=ReportingService.d.ts.map