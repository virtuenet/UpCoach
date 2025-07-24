import { Op } from 'sequelize';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from 'date-fns';
import { 
  FinancialReport, 
  FinancialSnapshot,
  ReportType,
  ReportStatus,
  ReportFormat 
} from '../../models';
import { financialService } from './FinancialService';
import { EmailService } from '../EmailService';
import { logger } from '../../utils/logger';

export class ReportingService {
  /**
   * Generate daily financial snapshot
   */
  async generateDailySnapshot(): Promise<FinancialSnapshot> {
    try {
      const snapshot = await financialService.generateDailySnapshot();
      
      // Check for alerts
      await this.checkFinancialAlerts(snapshot);
      
      return snapshot;
    } catch (error) {
      logger.error('Failed to generate daily snapshot:', error);
      throw error;
    }
  }

  /**
   * Generate scheduled reports
   */
  async generateScheduledReports(): Promise<void> {
    try {
      const now = new Date();
      
      // Generate daily reports
      if (this.shouldGenerateDailyReport(now)) {
        await this.generateDailyReport();
      }

      // Generate weekly reports (Mondays)
      if (this.shouldGenerateWeeklyReport(now)) {
        await this.generateWeeklyReport();
      }

      // Generate monthly reports (1st of month)
      if (this.shouldGenerateMonthlyReport(now)) {
        await this.generateMonthlyReport();
      }

      // Generate quarterly reports
      if (this.shouldGenerateQuarterlyReport(now)) {
        await this.generateQuarterlyReport();
      }

    } catch (error) {
      logger.error('Failed to generate scheduled reports:', error);
      throw error;
    }
  }

  /**
   * Generate daily summary report
   */
  private async generateDailyReport(): Promise<FinancialReport> {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const report = await FinancialReport.create({
      type: ReportType.DAILY_SUMMARY,
      title: `Daily Financial Summary - ${format(today, 'yyyy-MM-dd')}`,
      description: 'Automated daily financial performance report',
      status: ReportStatus.GENERATING,
      format: ReportFormat.JSON,
      scheduledFor: today,
      parameters: {
        date: format(today, 'yyyy-MM-dd'),
        includeComparisons: true,
      },
    });

    try {
      // Generate report data
      const [todayMetrics, yesterdayMetrics] = await Promise.all([
        financialService.getDashboardMetrics(),
        this.getHistoricalMetrics(yesterday),
      ]);

      const reportData = {
        date: format(today, 'yyyy-MM-dd'),
        metrics: todayMetrics,
        comparisons: {
          yesterday: yesterdayMetrics,
          changes: this.calculateChanges(todayMetrics, yesterdayMetrics),
        },
        alerts: await this.generateAlerts(todayMetrics),
        summary: this.generateExecutiveSummary(todayMetrics, yesterdayMetrics),
      };

      // Update report with data
      await report.update({
        status: ReportStatus.COMPLETED,
        data: reportData,
        generatedAt: new Date(),
      });

      // Send to stakeholders
      await this.sendReportToStakeholders(report);

      return report;
    } catch (error) {
      await report.update({
        status: ReportStatus.FAILED,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate weekly business review
   */
  private async generateWeeklyReport(): Promise<FinancialReport> {
    const today = new Date();
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const report = await FinancialReport.create({
      type: ReportType.WEEKLY_BUSINESS_REVIEW,
      title: `Weekly Business Review - ${format(weekStart, 'yyyy-MM-dd')} to ${format(today, 'yyyy-MM-dd')}`,
      description: 'Weekly performance analysis and business insights',
      status: ReportStatus.GENERATING,
      format: ReportFormat.PDF,
      scheduledFor: today,
      parameters: {
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      },
    });

    try {
      const [currentWeek, previousWeek] = await Promise.all([
        this.getWeeklyMetrics(weekStart, today),
        this.getWeeklyMetrics(
          new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000),
          weekStart
        ),
      ]);

      const reportData = {
        period: {
          start: format(weekStart, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd'),
        },
        metrics: currentWeek,
        trends: this.calculateTrends(currentWeek, previousWeek),
        insights: this.generateBusinessInsights(currentWeek, previousWeek),
        recommendations: this.generateRecommendations(currentWeek),
        kpis: this.calculateKPIs(currentWeek),
      };

      await report.update({
        status: ReportStatus.COMPLETED,
        data: reportData,
        generatedAt: new Date(),
      });

      await this.sendReportToStakeholders(report);
      return report;
    } catch (error) {
      await report.update({
        status: ReportStatus.FAILED,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate monthly P&L report
   */
  private async generateMonthlyReport(): Promise<FinancialReport> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const report = await FinancialReport.create({
      type: ReportType.MONTHLY_P_AND_L,
      title: `Monthly P&L Report - ${format(monthStart, 'MMMM yyyy')}`,
      description: 'Comprehensive monthly profit and loss statement',
      status: ReportStatus.GENERATING,
      format: ReportFormat.PDF,
      scheduledFor: now,
      parameters: {
        month: format(monthStart, 'yyyy-MM'),
      },
    });

    try {
      const [pnl, snapshots, cohortData] = await Promise.all([
        financialService.getProfitLossStatement(monthStart, monthEnd),
        this.getMonthlySnapshots(monthStart, monthEnd),
        this.getCohortAnalysis(monthStart),
      ]);

      const reportData = {
        month: format(monthStart, 'MMMM yyyy'),
        pnl,
        snapshots,
        cohorts: cohortData,
        trends: this.calculateMonthlyTrends(snapshots),
        variance: this.calculateBudgetVariance(pnl),
        forecast: this.generateForecast(snapshots),
      };

      await report.update({
        status: ReportStatus.COMPLETED,
        data: reportData,
        generatedAt: new Date(),
      });

      await this.sendReportToStakeholders(report);
      return report;
    } catch (error) {
      await report.update({
        status: ReportStatus.FAILED,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate quarterly investor report
   */
  private async generateQuarterlyReport(): Promise<FinancialReport> {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const quarterStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
    const quarterEnd = new Date(now.getFullYear(), quarter * 3, 0);

    const report = await FinancialReport.create({
      type: ReportType.QUARTERLY_INVESTOR,
      title: `Q${quarter} ${now.getFullYear()} Investor Report`,
      description: 'Quarterly business performance and investor update',
      status: ReportStatus.GENERATING,
      format: ReportFormat.PDF,
      scheduledFor: now,
      parameters: {
        quarter: `Q${quarter}`,
        year: now.getFullYear().toString(),
      },
    });

    try {
      const [
        quarterlyMetrics,
        yearToDateMetrics,
        benchmarks,
        projections
      ] = await Promise.all([
        this.getQuarterlyMetrics(quarterStart, quarterEnd),
        this.getYearToDateMetrics(new Date(now.getFullYear(), 0, 1), quarterEnd),
        this.getIndustryBenchmarks(),
        this.generateProjections(quarterEnd),
      ]);

      const reportData = {
        quarter: `Q${quarter} ${now.getFullYear()}`,
        quarterlyMetrics,
        yearToDate: yearToDateMetrics,
        benchmarks,
        projections,
        highlights: this.generateQuarterlyHighlights(quarterlyMetrics),
        risks: this.identifyRisks(quarterlyMetrics),
        opportunities: this.identifyOpportunities(quarterlyMetrics),
      };

      await report.update({
        status: ReportStatus.COMPLETED,
        data: reportData,
        generatedAt: new Date(),
      });

      await this.sendReportToStakeholders(report);
      return report;
    } catch (error) {
      await report.update({
        status: ReportStatus.FAILED,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check for financial alerts
   */
  private async checkFinancialAlerts(snapshot: FinancialSnapshot): Promise<void> {
    const alerts = [];

    // Churn rate alert
    if (snapshot.churnRate > 10) {
      alerts.push({
        type: 'HIGH_CHURN',
        severity: 'HIGH',
        message: `Churn rate is ${snapshot.churnRate.toFixed(1)}%, exceeding 10% threshold`,
        value: snapshot.churnRate,
        threshold: 10,
      });
    }

    // Burn rate alert
    const runway = snapshot.totalCosts > 0 ? 12 : 0; // Simplified calculation
    if (runway < 6) {
      alerts.push({
        type: 'LOW_RUNWAY',
        severity: 'CRITICAL',
        message: `Cash runway is below 6 months (${runway} months remaining)`,
        value: runway,
        threshold: 6,
      });
    }

    // LTV:CAC ratio alert
    if (snapshot.ltvToCacRatio < 3) {
      alerts.push({
        type: 'LOW_LTV_CAC',
        severity: 'MEDIUM',
        message: `LTV:CAC ratio is ${snapshot.ltvToCacRatio.toFixed(1)}x, below 3x threshold`,
        value: snapshot.ltvToCacRatio,
        threshold: 3,
      });
    }

    // Gross margin alert
    if (snapshot.grossMargin < 70) {
      alerts.push({
        type: 'LOW_GROSS_MARGIN',
        severity: 'MEDIUM',
        message: `Gross margin is ${snapshot.grossMargin.toFixed(1)}%, below 70% target`,
        value: snapshot.grossMargin,
        threshold: 70,
      });
    }

    // Send alerts if any
    if (alerts.length > 0) {
      await this.sendAlerts(alerts);
    }
  }

  /**
   * Send alerts to stakeholders
   */
  private async sendAlerts(alerts: any[]): Promise<void> {
    try {
      const criticalAlerts = alerts.filter(alert => alert.severity === 'CRITICAL');
      const highAlerts = alerts.filter(alert => alert.severity === 'HIGH');
      const mediumAlerts = alerts.filter(alert => alert.severity === 'MEDIUM');

      // Send critical alerts immediately
      if (criticalAlerts.length > 0) {
        await EmailService.sendAlert({
          to: ['ceo@upcoach.app', 'cfo@upcoach.app'],
          subject: '🚨 CRITICAL Financial Alert',
          alerts: criticalAlerts,
          priority: 'high',
        });
      }

      // Send high priority alerts
      if (highAlerts.length > 0) {
        await EmailService.sendAlert({
          to: ['cfo@upcoach.app', 'finance@upcoach.app'],
          subject: '⚠️ High Priority Financial Alert',
          alerts: highAlerts,
          priority: 'normal',
        });
      }

      // Send medium priority alerts in daily digest
      if (mediumAlerts.length > 0) {
        await EmailService.sendAlert({
          to: ['finance@upcoach.app'],
          subject: '📊 Financial Alert Digest',
          alerts: mediumAlerts,
          priority: 'low',
        });
      }

    } catch (error) {
      logger.error('Failed to send financial alerts:', error);
    }
  }

  /**
   * Send report to stakeholders
   */
  private async sendReportToStakeholders(report: FinancialReport): Promise<void> {
    try {
      const recipients = this.getReportRecipients(report.type);
      
      await EmailService.sendReport({
        to: recipients,
        subject: report.title,
        report: report,
        attachments: report.format === ReportFormat.PDF ? ['report.pdf'] : [],
      });

      logger.info(`Report sent successfully: ${report.title}`);
    } catch (error) {
      logger.error(`Failed to send report: ${report.title}`, error);
    }
  }

  /**
   * Get report recipients based on type
   */
  private getReportRecipients(type: ReportType): string[] {
    const recipients: Record<ReportType, string[]> = {
      [ReportType.DAILY_SUMMARY]: ['finance@upcoach.app'],
      [ReportType.WEEKLY_BUSINESS_REVIEW]: ['ceo@upcoach.app', 'cfo@upcoach.app', 'finance@upcoach.app'],
      [ReportType.MONTHLY_P_AND_L]: ['ceo@upcoach.app', 'cfo@upcoach.app', 'board@upcoach.app'],
      [ReportType.QUARTERLY_INVESTOR]: ['investors@upcoach.app', 'board@upcoach.app'],
      [ReportType.CUSTOM]: ['finance@upcoach.app'],
    };

    return recipients[type] || ['finance@upcoach.app'];
  }

  // Helper methods for schedule checking
  private shouldGenerateDailyReport(date: Date): boolean {
    const hour = date.getHours();
    return hour === 9; // 9 AM daily
  }

  private shouldGenerateWeeklyReport(date: Date): boolean {
    const day = date.getDay();
    const hour = date.getHours();
    return day === 1 && hour === 10; // Monday 10 AM
  }

  private shouldGenerateMonthlyReport(date: Date): boolean {
    const day = date.getDate();
    const hour = date.getHours();
    return day === 1 && hour === 11; // 1st of month 11 AM
  }

  private shouldGenerateQuarterlyReport(date: Date): boolean {
    const month = date.getMonth();
    const day = date.getDate();
    const hour = date.getHours();
    return [2, 5, 8, 11].includes(month) && day === 1 && hour === 12; // Quarterly 12 PM
  }

  // Placeholder methods for data calculations
  private async getHistoricalMetrics(date: Date): Promise<any> {
    // Implementation would fetch historical snapshot
    return {};
  }

  private calculateChanges(current: any, previous: any): any {
    // Implementation would calculate percentage changes
    return {};
  }

  private async generateAlerts(metrics: any): Promise<any[]> {
    // Implementation would generate contextual alerts
    return [];
  }

  private generateExecutiveSummary(current: any, previous: any): string {
    // Implementation would generate AI summary
    return 'Executive summary generated by AI';
  }

  private async getWeeklyMetrics(start: Date, end: Date): Promise<any> {
    // Implementation would aggregate weekly data
    return {};
  }

  private calculateTrends(current: any, previous: any): any {
    // Implementation would calculate trend analysis
    return {};
  }

  private generateBusinessInsights(current: any, previous: any): any[] {
    // Implementation would generate business insights
    return [];
  }

  private generateRecommendations(metrics: any): any[] {
    // Implementation would generate actionable recommendations
    return [];
  }

  private calculateKPIs(metrics: any): any {
    // Implementation would calculate key performance indicators
    return {};
  }

  private async getMonthlySnapshots(start: Date, end: Date): Promise<any[]> {
    return [];
  }

  private async getCohortAnalysis(date: Date): Promise<any> {
    return {};
  }

  private calculateMonthlyTrends(snapshots: any[]): any {
    return {};
  }

  private calculateBudgetVariance(pnl: any): any {
    return {};
  }

  private generateForecast(snapshots: any[]): any {
    return {};
  }

  private async getQuarterlyMetrics(start: Date, end: Date): Promise<any> {
    return {};
  }

  private async getYearToDateMetrics(start: Date, end: Date): Promise<any> {
    return {};
  }

  private async getIndustryBenchmarks(): Promise<any> {
    return {};
  }

  private async generateProjections(fromDate: Date): Promise<any> {
    return {};
  }

  private generateQuarterlyHighlights(metrics: any): any[] {
    return [];
  }

  private identifyRisks(metrics: any): any[] {
    return [];
  }

  private identifyOpportunities(metrics: any): any[] {
    return [];
  }
}

export const reportingService = new ReportingService(); 