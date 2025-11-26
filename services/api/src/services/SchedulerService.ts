import * as cron from 'node-cron';

import { logger } from '../utils/logger';

import { financialService } from './financial/FinancialService';
import { reportingService } from './financial/ReportingService';
import { dailyPulseService } from './ai/DailyPulseService';
import { streakGuardianService } from './gamification/StreakGuardianService';

export class SchedulerService {
  private static jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize all scheduled jobs
   */
  static initialize(): void {
    logger.info('Initializing scheduled financial jobs...');

    // Daily snapshot generation (every day at 6 AM)
    this.scheduleJob('daily-snapshot', '0 6 * * *', async () => {
      logger.info('Running daily financial snapshot generation...');
      try {
        await reportingService.generateDailySnapshot();
        logger.info('Daily snapshot generated successfully');
      } catch (error) {
        logger.error('Failed to generate daily snapshot:', error);
      }
    });

    // Hourly report generation check (every hour)
    this.scheduleJob('hourly-reports', '0 * * * *', async () => {
      logger.info('Checking for scheduled reports...');
      try {
        await reportingService.generateScheduledReports();
        logger.info('Scheduled reports check completed');
      } catch (error) {
        logger.error('Failed to generate scheduled reports:', error);
      }
    });

    // Weekly cost analysis (every Monday at 8 AM)
    this.scheduleJob('weekly-cost-analysis', '0 8 * * 1', async () => {
      logger.info('Running weekly cost analysis...');
      try {
        await this.performWeeklyCostAnalysis();
        logger.info('Weekly cost analysis completed');
      } catch (error) {
        logger.error('Failed to perform weekly cost analysis:', error);
      }
    });

    // Monthly financial health check (1st of every month at 9 AM)
    this.scheduleJob('monthly-health-check', '0 9 1 * *', async () => {
      logger.info('Running monthly financial health check...');
      try {
        await this.performMonthlyHealthCheck();
        logger.info('Monthly health check completed');
      } catch (error) {
        logger.error('Failed to perform monthly health check:', error);
      }
    });

    // Quarterly projections (1st of quarter months at 10 AM)
    this.scheduleJob('quarterly-projections', '0 10 1 1,4,7,10 *', async () => {
      logger.info('Running quarterly projections...');
      try {
        await this.generateQuarterlyProjections();
        logger.info('Quarterly projections completed');
      } catch (error) {
        logger.error('Failed to generate quarterly projections:', error);
      }
    });

    // Morning pulse (6:30 AM UTC)
    this.scheduleJob('daily-pulse-morning', '30 6 * * *', async () => {
      logger.info('Generating morning daily pulse');
      try {
        await dailyPulseService.broadcastPulse('morning');
        logger.info('Morning daily pulse broadcast completed');
      } catch (error) {
        logger.error('Failed to broadcast morning daily pulse', error);
      }
    });

    // Evening pulse (10:00 PM UTC)
    this.scheduleJob('daily-pulse-evening', '0 22 * * *', async () => {
      logger.info('Generating evening daily pulse');
      try {
        await dailyPulseService.broadcastPulse('evening');
        logger.info('Evening daily pulse broadcast completed');
      } catch (error) {
        logger.error('Failed to broadcast evening daily pulse', error);
      }
    });

    // Guardian risk scan (every hour)
    this.scheduleJob('guardian-risk-scan', '15 * * * *', async () => {
      try {
        await streakGuardianService.scanForAtRiskUsers();
      } catch (error) {
        logger.error('Failed streak guardian scan', error);
      }
    });

    // Real-time alert monitoring (every 15 minutes)
    this.scheduleJob('alert-monitoring', '*/15 * * * *', async () => {
      logger.debug('Checking for financial alerts...');
      try {
        await this.checkRealTimeAlerts();
      } catch (error) {
        logger.error('Failed to check real-time alerts:', error);
      }
    });

    logger.info(`Initialized ${this.jobs.size} scheduled financial jobs`);
  }

  /**
   * Schedule a new job
   */
  private static scheduleJob(name: string, schedule: string, task: () => Promise<void>): void {
    try {
      if (this.jobs.has(name)) {
        logger.warn(`Job ${name} already exists, stopping previous job`);
        this.jobs.get(name)?.stop();
      }

      const job = cron.schedule(schedule, task, {
        timezone: 'UTC',
      });

      this.jobs.set(name, job);
      logger.info(`Scheduled job: ${name} with cron pattern: ${schedule}`);
    } catch (error) {
      logger.error(`Failed to schedule job ${name}:`, error);
    }
  }

  /**
   * Stop a scheduled job
   */
  static stopJob(name: string): boolean {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      logger.info(`Stopped job: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Stop all jobs
   */
  static stopAllJobs(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped job: ${name}`);
    });
    this.jobs.clear();
    logger.info('All scheduled jobs stopped');
  }

  /**
   * Get job status
   */
  static getJobStatus(): { name: string; running: boolean }[] {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      running: job.getStatus() === 'scheduled',
    }));
  }

  /**
   * Perform weekly cost analysis
   */
  private static async performWeeklyCostAnalysis(): Promise<void> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get cost metrics for the week
      const costMetrics = await financialService.getCostsByCategory(startDate, endDate);

      // Analyze cost trends
      const analysis = {
        totalCosts: costMetrics.reduce((sum: number, cost: unknown) => sum + parseFloat(cost.total), 0),
        categories: costMetrics,
        trends: await this.analyzeCostTrends(startDate, endDate),
        recommendations: await this.generateCostRecommendations(costMetrics),
      };

      // Generate alerts if needed
      await this.checkCostAlerts(analysis);

      logger.info('Weekly cost analysis completed', { analysis });
    } catch (error) {
      logger.error('Weekly cost analysis failed:', error);
      throw error;
    }
  }

  /**
   * Perform monthly financial health check
   */
  private static async performMonthlyHealthCheck(): Promise<void> {
    try {
      // Get comprehensive financial metrics
      const metrics = await financialService.getDashboardMetrics();

      // Calculate health score
      const healthScore = this.calculateHealthScore(metrics);

      // Generate health report
      const healthReport = {
        score: healthScore,
        metrics,
        risks: this.identifyRisks(metrics),
        opportunities: this.identifyOpportunities(metrics),
        recommendations: this.generateHealthRecommendations(healthScore, metrics),
      };

      // Send health report to stakeholders
      await this.sendHealthReport(healthReport);

      logger.info('Monthly health check completed', { healthScore });
    } catch (error) {
      logger.error('Monthly health check failed:', error);
      throw error;
    }
  }

  /**
   * Generate quarterly projections
   */
  private static async generateQuarterlyProjections(): Promise<void> {
    try {
      const currentDate = new Date();
      const quarter = Math.floor(currentDate.getMonth() / 3) + 1;

      // Get historical data for projections
      const historicalData = await this.getHistoricalQuarterlyData();

      // Generate projections
      const projections = {
        quarter: `Q${quarter} ${currentDate.getFullYear()}`,
        revenue: await this.projectRevenue(historicalData),
        costs: await this.projectCosts(historicalData),
        growth: await this.projectGrowth(historicalData),
        risks: await this.identifyProjectionRisks(historicalData),
      };

      // Save projections
      await this.saveProjections(projections);

      logger.info('Quarterly projections generated', { projections });
    } catch (error) {
      logger.error('Quarterly projections failed:', error);
      throw error;
    }
  }

  /**
   * Check real-time alerts
   */
  private static async checkRealTimeAlerts(): Promise<void> {
    try {
      // Get latest financial snapshot
      const latestSnapshot = await financialService.generateDailySnapshot();

      // Check critical thresholds
      const criticalAlerts = [];

      // Check burn rate
      const monthlyBurn = latestSnapshot.totalCosts;
      if (monthlyBurn > 100000) {
        // $100k threshold
        criticalAlerts.push({
          type: 'HIGH_BURN_RATE',
          severity: 'HIGH',
          message: `Monthly burn rate exceeded $100k: $${monthlyBurn.toLocaleString()}`,
          value: monthlyBurn,
          threshold: 100000,
        });
      }

      // Check revenue drop
      const revenueDropThreshold = 0.1; // 10% drop
      const previousRevenue = await this.getPreviousRevenue();
      if (
        previousRevenue &&
        latestSnapshot.revenue < previousRevenue * (1 - revenueDropThreshold)
      ) {
        criticalAlerts.push({
          type: 'REVENUE_DROP',
          severity: 'CRITICAL',
          message: `Revenue dropped by ${(((previousRevenue - latestSnapshot.revenue) / previousRevenue) * 100).toFixed(1)}%`,
          value: latestSnapshot.revenue,
          threshold: previousRevenue * (1 - revenueDropThreshold),
        });
      }

      // Send alerts if any
      if (criticalAlerts.length > 0) {
        await this.sendCriticalAlerts(criticalAlerts);
      }
    } catch (error) {
      logger.error('Real-time alerts check failed:', error);
    }
  }

  // Helper methods (simplified implementations)
  private static async analyzeCostTrends(_startDate: Date, _endDate: Date): Promise<unknown> {
    // Implementation would analyze cost trends over time
    return { trend: 'stable', variance: 5 };
  }

  private static async generateCostRecommendations(_costMetrics: unknown[]): Promise<string[]> {
    // Implementation would generate AI-powered recommendations
    return ['Consider optimizing infrastructure costs', 'Review vendor contracts'];
  }

  private static async checkCostAlerts(analysis: unknown): Promise<void> {
    // Implementation would check for cost-related alerts
    if (analysis.totalCosts > 50000) {
      logger.warn('Weekly costs exceeded $50k threshold');
    }
  }

  private static calculateHealthScore(metrics: unknown): number {
    // Implementation would calculate a composite health score
    let score = 100;

    // Deduct points for poor metrics
    if (metrics.subscriptions.churnRate > 5) score -= 20;
    if (metrics.unitEconomics.ltvToCacRatio < 3) score -= 15;
    if (metrics.profitLoss.margin < 20) score -= 25;

    return Math.max(0, score);
  }

  private static identifyRisks(metrics: unknown): string[] {
    const risks = [];
    if (metrics.subscriptions.churnRate > 10) risks.push('High churn rate');
    if (metrics.costs.burnRate > metrics.revenue.mrr * 2) risks.push('Unsustainable burn rate');
    return risks;
  }

  private static identifyOpportunities(metrics: unknown): string[] {
    const opportunities = [];
    if (metrics.unitEconomics.ltvToCacRatio > 5)
      opportunities.push('Strong unit economics for scaling');
    if (metrics.subscriptions.churnRate < 3)
      opportunities.push('Excellent retention for premium pricing');
    return opportunities;
  }

  private static generateHealthRecommendations(score: number, metrics: unknown): string[] {
    const recommendations = [];
    if (score < 70) recommendations.push('Review cost structure and pricing strategy');
    if (metrics.subscriptions.churnRate > 5) recommendations.push('Implement retention campaigns');
    return recommendations;
  }

  private static async sendHealthReport(report: unknown): Promise<void> {
    // Implementation would send health report via email
    logger.info('Health report would be sent to stakeholders', { report });
  }

  private static async getHistoricalQuarterlyData(): Promise<unknown> {
    // Implementation would fetch historical quarterly data
    return {};
  }

  private static async projectRevenue(_data: unknown): Promise<unknown> {
    // Implementation would project revenue based on historical data
    return { q1: 100000, q2: 120000, q3: 140000, q4: 160000 };
  }

  private static async projectCosts(_data: unknown): Promise<unknown> {
    // Implementation would project costs
    return { q1: 80000, q2: 85000, q3: 90000, q4: 95000 };
  }

  private static async projectGrowth(_data: unknown): Promise<unknown> {
    // Implementation would project growth metrics
    return { mrrGrowth: 15, userGrowth: 25 };
  }

  private static async identifyProjectionRisks(_data: unknown): Promise<string[]> {
    // Implementation would identify risks in projections
    return ['Market saturation risk', 'Competition pressure'];
  }

  private static async saveProjections(projections: unknown): Promise<void> {
    // Implementation would save projections to database
    logger.info('Projections saved', { projections });
  }

  private static async getPreviousRevenue(): Promise<number | null> {
    // Implementation would get previous period revenue
    return 50000; // Mock value
  }

  private static async sendCriticalAlerts(alerts: unknown[]): Promise<void> {
    // Implementation would send critical alerts immediately
    logger.warn('Critical alerts detected', { alerts });
  }
}

// Auto-initialize if not in test environment
if (process.env.NODE_ENV !== 'test') {
  SchedulerService.initialize();
}
