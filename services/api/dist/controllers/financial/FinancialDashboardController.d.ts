import { Request, Response } from 'express';
export declare class FinancialDashboardController {
    /**
     * Get dashboard metrics
     */
    getDashboardMetrics(req: Request, res: Response): Promise<void>;
    /**
     * Get revenue metrics
     */
    getRevenueMetrics(req: Request, res: Response): Promise<void>;
    /**
     * Get subscription metrics
     */
    getSubscriptionMetrics(req: Request, res: Response): Promise<void>;
    /**
     * Get cost metrics
     */
    getCostMetrics(req: Request, res: Response): Promise<void>;
    /**
     * Get P&L statement
     */
    getProfitLossStatement(req: Request, res: Response): Promise<void>;
    /**
     * Get MRR metrics
     */
    getMRRMetrics(req: Request, res: Response): Promise<void>;
    /**
     * Get ARR metrics
     */
    getARRMetrics(req: Request, res: Response): Promise<void>;
    /**
     * Get revenue by plan
     */
    getRevenueByPlan(req: Request, res: Response): Promise<void>;
    /**
     * Get revenue by country
     */
    getRevenueByCountry(req: Request, res: Response): Promise<void>;
    /**
     * Get revenue forecast
     */
    getRevenueForecast(req: Request, res: Response): Promise<void>;
    /**
     * Get subscriptions
     */
    getSubscriptions(req: Request, res: Response): Promise<void>;
    /**
     * Get active subscriptions
     */
    getActiveSubscriptions(req: Request, res: Response): Promise<void>;
    /**
     * Get churn analytics
     */
    getChurnAnalytics(req: Request, res: Response): Promise<void>;
    /**
     * Get LTV analytics
     */
    getLTVAnalytics(req: Request, res: Response): Promise<void>;
    /**
     * Get costs
     */
    getCosts(req: Request, res: Response): Promise<void>;
    /**
     * Create cost
     */
    createCost(req: Request, res: Response): Promise<void>;
    /**
     * Update cost
     */
    updateCost(req: Request, res: Response): Promise<void>;
    /**
     * Delete cost
     */
    deleteCost(req: Request, res: Response): Promise<void>;
    /**
     * Get costs by category
     */
    getCostsByCategory(req: Request, res: Response): Promise<void>;
    /**
     * Get cost optimization suggestions
     */
    getCostOptimizationSuggestions(req: Request, res: Response): Promise<void>;
    /**
     * Get snapshots
     */
    getSnapshots(req: Request, res: Response): Promise<void>;
    /**
     * Generate snapshot
     */
    generateSnapshot(req: Request, res: Response): Promise<void>;
    /**
     * Get latest snapshot
     */
    getLatestSnapshot(req: Request, res: Response): Promise<void>;
    /**
     * Get reports
     */
    getReports(req: Request, res: Response): Promise<void>;
    /**
     * Create report
     */
    createReport(req: Request, res: Response): Promise<void>;
    /**
     * Get report
     */
    getReport(req: Request, res: Response): Promise<void>;
    /**
     * Download report
     */
    downloadReport(req: Request, res: Response): Promise<void>;
    /**
     * Send report
     */
    sendReport(req: Request, res: Response): Promise<void>;
    /**
     * Get cohort analysis
     */
    getCohortAnalysis(req: Request, res: Response): Promise<void>;
    /**
     * Get cohort details
     */
    getCohortDetails(req: Request, res: Response): Promise<void>;
    /**
     * Get unit economics
     */
    getUnitEconomics(req: Request, res: Response): Promise<void>;
    /**
     * Get CAC
     */
    getCAC(req: Request, res: Response): Promise<void>;
    /**
     * Get LTV to CAC ratio
     */
    getLTVtoCACRatio(req: Request, res: Response): Promise<void>;
    /**
     * Get billing events
     */
    getBillingEvents(req: Request, res: Response): Promise<void>;
    /**
     * Get billing event
     */
    getBillingEvent(req: Request, res: Response): Promise<void>;
    /**
     * Get automation status
     */
    getAutomationStatus(req: Request, res: Response): Promise<void>;
    /**
     * Trigger automation manually
     */
    triggerAutomation(req: Request, res: Response): Promise<void>;
    /**
     * Send test email
     */
    sendTestEmail(req: Request, res: Response): Promise<void>;
    /**
     * Get scheduled jobs
     */
    getScheduledJobs(req: Request, res: Response): Promise<void>;
    /**
     * Start a job
     */
    startJob(req: Request, res: Response): Promise<void>;
    /**
     * Stop a job
     */
    stopJob(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=FinancialDashboardController.d.ts.map