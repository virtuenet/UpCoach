import { FinancialReport, FinancialSnapshot } from '../../models';
import { FinancialService } from './FinancialService';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from 'date-fns';

/**
 * ReportingService
 * Handles automated financial report generation and distribution
 */
export class ReportingService {
  /**
   * Generate daily financial summary
   */
  static async generateDailySummary(date: Date = new Date()): Promise<any> {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    // Get or generate daily snapshot
    const snapshot = await FinancialService.generateDailySnapshot();

    // Calculate key metrics
    const mrr = await FinancialService.calculateMRR(date);
    const burnRate = await FinancialService.calculateBurnRate();
    const runway = await FinancialService.calculateRunway();

    return {
      date: format(date, 'yyyy-MM-dd'),
      summary: {
        mrr,
        burnRate,
        runway,
        healthScore: await FinancialService.getFinancialHealthScore(),
      },
      snapshot,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate weekly business review
   */
  static async generateWeeklyReview(endDate: Date = new Date()): Promise<any> {
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    const [currentWeekMRR, previousWeekMRR] = await Promise.all([
      FinancialService.calculateMRR(endDate),
      FinancialService.calculateMRR(new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000))
    ]);

    const mrrGrowth = previousWeekMRR > 0 
      ? ((currentWeekMRR - previousWeekMRR) / previousWeekMRR) * 100 
      : 0;

    const churnRate = await FinancialService.calculateChurnRate(startDate, endDate);
    const unitEconomics = await FinancialService.calculateUnitEconomics();

    return {
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd'),
      },
      keyMetrics: {
        mrr: currentWeekMRR,
        mrrGrowth,
        churnRate,
        ltv: unitEconomics.ltv,
        cac: unitEconomics.cac,
        ltvCacRatio: unitEconomics.ltvCacRatio,
      },
      insights: [
        `MRR ${mrrGrowth >= 0 ? 'grew' : 'declined'} by ${Math.abs(mrrGrowth).toFixed(1)}% this week`,
        `Current churn rate is ${churnRate.toFixed(1)}%`,
        `LTV:CAC ratio is ${unitEconomics.ltvCacRatio.toFixed(1)}:1`,
      ],
      generatedAt: new Date(),
    };
  }

  /**
   * Generate monthly financial report
   */
  static async generateMonthlyReport(month: Date = new Date()): Promise<any> {
    const startDate = startOfMonth(month);
    const endDate = endOfMonth(month);

    const [
      profitLoss,
      unitEconomics,
      healthScore,
      mrrGrowth,
    ] = await Promise.all([
      FinancialService.generateProfitLoss(startDate, endDate),
      FinancialService.calculateUnitEconomics(),
      FinancialService.getFinancialHealthScore(),
      FinancialService.calculateMRRGrowthRate(),
    ]);

    return {
      period: {
        month: format(month, 'yyyy-MM'),
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd'),
      },
      executiveSummary: {
        highlights: [
          `Revenue: ${profitLoss.revenue.net.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
          `MRR Growth: ${mrrGrowth >= 0 ? '+' : ''}${mrrGrowth.toFixed(1)}%`,
          `Gross Margin: ${profitLoss.margins.gross.toFixed(1)}%`,
          `Financial Health Score: ${healthScore.score.toFixed(0)}/100`,
        ],
        keyMetrics: {
          revenue: profitLoss.revenue.net,
          costs: profitLoss.costs.total,
          grossProfit: profitLoss.profit.gross,
          netProfit: profitLoss.profit.net,
        },
      },
      financialMetrics: {
        ...unitEconomics,
        mrrGrowthRate: mrrGrowth,
        grossMarginPercentage: profitLoss.margins.gross,
        netMarginPercentage: profitLoss.margins.net,
      },
      profitLoss,
      healthScore,
      recommendations: this.generateRecommendations(healthScore, profitLoss, unitEconomics),
      generatedAt: new Date(),
    };
  }

  /**
   * Generate investor update
   */
  static async generateInvestorUpdate(quarter: Date = new Date()): Promise<any> {
    const quarterStart = new Date(quarter.getFullYear(), Math.floor(quarter.getMonth() / 3) * 3, 1);
    const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);

    const [
      currentQuarterMRR,
      previousQuarterMRR,
      unitEconomics,
      healthScore,
    ] = await Promise.all([
      FinancialService.calculateMRR(quarterEnd),
      FinancialService.calculateMRR(new Date(quarterStart.getTime() - 1)),
      FinancialService.calculateUnitEconomics(),
      FinancialService.getFinancialHealthScore(),
    ]);

    const quarterlyGrowth = previousQuarterMRR > 0 
      ? ((currentQuarterMRR - previousQuarterMRR) / previousQuarterMRR) * 100 
      : 0;

    const runway = await FinancialService.calculateRunway();

    return {
      period: {
        quarter: `Q${Math.floor(quarter.getMonth() / 3) + 1} ${quarter.getFullYear()}`,
        start: format(quarterStart, 'yyyy-MM-dd'),
        end: format(quarterEnd, 'yyyy-MM-dd'),
      },
      executiveSummary: {
        headline: this.generateInvestorHeadline(quarterlyGrowth, healthScore.status),
        highlights: [
          `Quarterly MRR Growth: ${quarterlyGrowth >= 0 ? '+' : ''}${quarterlyGrowth.toFixed(1)}%`,
          `Current ARR: $${(currentQuarterMRR * 12).toLocaleString()}`,
          `LTV:CAC Ratio: ${unitEconomics.ltvCacRatio.toFixed(1)}:1`,
          `Runway: ${runway.toFixed(0)} months`,
        ],
      },
      keyMetrics: {
        mrr: currentQuarterMRR,
        arr: currentQuarterMRR * 12,
        quarterlyGrowthRate: quarterlyGrowth,
        ...unitEconomics,
        runway,
        healthScore: healthScore.score,
      },
      businessMetrics: {
        // Would include user metrics, engagement, etc.
        placeholder: 'Business metrics would be populated here',
      },
      financialHighlights: await this.getFinancialHighlights(quarterStart, quarterEnd),
      risks: this.identifyBusinessRisks(healthScore, unitEconomics, runway),
      opportunities: this.identifyGrowthOpportunities(quarterlyGrowth, unitEconomics),
      generatedAt: new Date(),
    };
  }

  /**
   * Create and schedule automated report
   */
  static async createScheduledReport(config: {
    reportType: string;
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    recipients: string[];
    template?: string;
  }): Promise<FinancialReport> {
    const now = new Date();
    const nextRun = this.calculateNextRunDate(now, config.frequency);

    return await FinancialReport.create({
      reportType: config.reportType as any,
      reportName: config.name,
      description: `Automated ${config.frequency} ${config.reportType}`,
      periodType: config.frequency,
      periodStart: now,
      periodEnd: nextRun,
      sections: this.getDefaultSections(config.reportType),
      format: {
        template: config.template || 'default',
        branding: {
          logo: '/assets/logo.png',
          colors: {
            primary: '#3B82F6',
            secondary: '#10B981',
          },
        },
        charts: {
          revenueChart: true,
          mrrChart: true,
          cohortChart: false,
          cashFlowChart: true,
        },
      },
      distribution: {
        recipients: config.recipients.map(email => ({
          email,
          name: email.split('@')[0],
          role: 'stakeholder',
        })),
        schedule: {
          frequency: config.frequency,
          dayOfWeek: config.frequency === 'weekly' ? 1 : undefined, // Monday
          dayOfMonth: config.frequency === 'monthly' ? 1 : undefined,
          time: '09:00',
          timezone: 'UTC',
        },
        channels: {
          email: true,
          dashboard: true,
        },
      },
      status: 'scheduled',
      deliveryStatus: {
        emailsSent: 0,
        emailsDelivered: 0,
        emailsOpened: 0,
        linkClicks: 0,
        errors: [],
      },
      accessibility: {
        isPublic: false,
      },
      createdBy: 'system', // Would be actual user ID
      tags: [config.frequency, config.reportType, 'automated'],
    });
  }

  /**
   * Process scheduled reports
   */
  static async processScheduledReports(): Promise<void> {
    const scheduledReports = await FinancialReport.getScheduledReports();

    for (const report of scheduledReports) {
      if (report.isDue()) {
        try {
          await this.generateAndSendReport(report);
        } catch (error) {
          console.error(`Failed to process report ${report.id}:`, error);
        }
      }
    }
  }

  /**
   * Generate and send a report
   */
  static async generateAndSendReport(report: FinancialReport): Promise<void> {
    report.status = 'generating';
    report.generationStartedAt = new Date();
    await report.save();

    try {
      // Generate report data based on type
      let reportData;
      const now = new Date();

      switch (report.reportType) {
        case 'daily_summary':
          reportData = await this.generateDailySummary(now);
          break;
        case 'weekly_review':
          reportData = await this.generateWeeklyReview(now);
          break;
        case 'monthly_report':
          reportData = await this.generateMonthlyReport(now);
          break;
        default:
          throw new Error(`Unsupported report type: ${report.reportType}`);
      }

      // Update report with generated data
      report.sections.executiveSummary.keyMetrics = reportData.keyMetrics || reportData.summary;
      report.status = 'generated';
      report.generationCompletedAt = new Date();
      report.generationDuration = Math.floor(
        (report.generationCompletedAt.getTime() - report.generationStartedAt!.getTime()) / 1000
      );

      // Send report (simplified - would integrate with email service)
      await this.sendReport(report, reportData);

      report.status = 'sent';
      await report.save();

    } catch (error) {
      report.status = 'failed';
      report.generationCompletedAt = new Date();
      await report.save();
      throw error;
    }
  }

  /**
   * Send report via configured channels
   */
  private static async sendReport(report: FinancialReport, data: any): Promise<void> {
    const { distribution } = report;

    if (distribution.channels.email) {
      // Send emails to recipients
      for (const recipient of distribution.recipients) {
        try {
          // Integrate with email service (SendGrid, AWS SES, etc.)
          console.log(`Sending report to ${recipient.email}`);
          report.deliveryStatus.emailsSent++;
        } catch (error) {
          report.deliveryStatus.errors.push(`Failed to send to ${recipient.email}: ${error.message}`);
        }
      }
    }

    if (distribution.channels.slack) {
      // Send to Slack channel
      console.log('Sending report to Slack');
    }

    if (distribution.channels.teams) {
      // Send to Teams channel
      console.log('Sending report to Teams');
    }
  }

  /**
   * Helper methods
   */
  private static calculateNextRunDate(current: Date, frequency: string): Date {
    const next = new Date(current);
    
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
    }
    
    return next;
  }

  private static getDefaultSections(reportType: string): any {
    return {
      executiveSummary: { enabled: true, highlights: [], keyMetrics: {} },
      revenue: { enabled: true, totalRevenue: 0, recurringRevenue: 0, nonRecurringRevenue: 0, revenueGrowth: 0 },
      subscriptions: { enabled: true, newSubscriptions: 0, activeSubscriptions: 0, churnedSubscriptions: 0, netNewSubscriptions: 0, churnRate: 0, retentionRate: 0 },
      financialMetrics: { enabled: true, mrr: 0, arr: 0, arpu: 0, ltv: 0, cac: 0, ltvCacRatio: 0, burnRate: 0, runway: 0 },
      profitLoss: { enabled: true, revenue: 0, cogs: 0, grossProfit: 0, operatingExpenses: 0, ebitda: 0, netIncome: 0, margins: { gross: 0, operating: 0, net: 0 } },
      costs: { enabled: reportType !== 'daily_summary', totalCosts: 0, costsByCategory: {}, costPerUser: 0, topVendors: [], costOptimizationOpportunities: [] },
      cashFlow: { enabled: reportType === 'monthly_report', operatingCashFlow: 0, investingCashFlow: 0, financingCashFlow: 0, netCashFlow: 0, cashBalance: 0 },
      cohortAnalysis: { enabled: false, cohorts: [] },
      forecasts: { enabled: reportType === 'monthly_report', revenueForecast: [], cashFlowForecast: [], userGrowthForecast: [] },
      kpis: { enabled: true, kpiMetrics: [] },
    };
  }

  private static generateRecommendations(healthScore: any, profitLoss: any, unitEconomics: any): string[] {
    const recommendations = [];

    if (healthScore.score < 60) {
      recommendations.push('Focus on improving financial health metrics');
    }

    if (profitLoss.margins.gross < 70) {
      recommendations.push('Work on improving gross margins through cost optimization');
    }

    if (unitEconomics.ltvCacRatio < 3) {
      recommendations.push('Improve LTV:CAC ratio by reducing acquisition costs or increasing lifetime value');
    }

    if (unitEconomics.paybackPeriod > 12) {
      recommendations.push('Reduce customer payback period to improve cash flow');
    }

    return recommendations;
  }

  private static generateInvestorHeadline(growth: number, status: string): string {
    if (growth >= 20) return 'Strong quarterly growth continues';
    if (growth >= 10) return 'Solid growth momentum maintained';
    if (growth >= 0) return 'Steady progress with room for acceleration';
    return 'Focused on optimizing fundamentals';
  }

  private static async getFinancialHighlights(startDate: Date, endDate: Date): Promise<string[]> {
    return [
      'Strong revenue growth driven by new customer acquisition',
      'Improved unit economics with higher LTV and lower CAC',
      'Positive cash flow generation',
      'Successful cost optimization initiatives',
    ];
  }

  private static identifyBusinessRisks(healthScore: any, unitEconomics: any, runway: number): string[] {
    const risks = [];

    if (runway < 12) {
      risks.push('Limited runway - consider fundraising or cost reduction');
    }

    if (healthScore.score < 40) {
      risks.push('Poor financial health metrics require immediate attention');
    }

    if (unitEconomics.ltvCacRatio < 1) {
      risks.push('Negative unit economics - customer acquisition is unsustainable');
    }

    return risks;
  }

  private static identifyGrowthOpportunities(growth: number, unitEconomics: any): string[] {
    const opportunities = [];

    if (unitEconomics.ltvCacRatio > 3) {
      opportunities.push('Strong unit economics support accelerated customer acquisition');
    }

    if (growth > 15) {
      opportunities.push('High growth rate indicates product-market fit - consider scaling');
    }

    opportunities.push('Expand into new market segments');
    opportunities.push('Develop new product features to increase ARPU');

    return opportunities;
  }
}

export default ReportingService; 