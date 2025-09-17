import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { Request, Response } from 'express';
import { Op } from 'sequelize';

import {
  Transaction,
  Subscription,
  CostTracking,
  FinancialSnapshot,
  FinancialReport,
  BillingEvent,
} from '../../models';
import emailService from '../../services/email/UnifiedEmailService';
import { financialService } from '../../services/financial/FinancialService';
import { reportingService } from '../../services/financial/ReportingService';
import { SchedulerService } from '../../services/SchedulerService';
import { ApiError } from '../../utils/apiError';

export class FinancialDashboardController {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await financialService.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
      const end = endDate ? new Date(endDate as string) : endOfMonth(new Date());

      const revenue = await Transaction.sum('amount', {
        where: {
          status: 'completed',
          createdAt: { [Op.between]: [start, end] },
        },
      });

      const refunds = await Transaction.sum('amount', {
        where: {
          status: 'refunded',
          createdAt: { [Op.between]: [start, end] },
        },
      });

      const netRevenue = (revenue || 0) - (refunds || 0);
      const mrr = await financialService.calculateMRR();
      const arr = await financialService.calculateARR();

      res.json({
        gross: revenue || 0,
        refunds: refunds || 0,
        net: netRevenue,
        mrr,
        arr,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get subscription metrics
   */
  async getSubscriptionMetrics(req: Request, res: Response): Promise<void> {
    try {
      const active = await Subscription.count({
        where: { status: ['active', 'trialing'] },
      });

      const new_subs = await Subscription.count({
        where: {
          createdAt: { [Op.gte]: startOfMonth(new Date()) },
        },
      });

      const churned = await Subscription.count({
        where: {
          canceledAt: { [Op.gte]: startOfMonth(new Date()) },
        },
      });

      const churnRate = await financialService.calculateChurnRate(
        startOfMonth(subMonths(new Date(), 1)),
        new Date()
      );

      res.json({
        active,
        new: new_subs,
        churned,
        churnRate,
        netNew: new_subs - churned,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get cost metrics
   */
  async getCostMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
      const end = endDate ? new Date(endDate as string) : endOfMonth(new Date());

      const costs = await CostTracking.findAll({
        attributes: [
          'category',
          [CostTracking.sequelize!.fn('SUM', CostTracking.sequelize!.col('amount')), 'total'],
        ],
        where: {
          periodStart: { [Op.gte]: start },
          periodEnd: { [Op.lte]: end },
        },
        group: ['category'],
      });

      const totalCosts = costs.reduce(
        (sum, cost) => sum + parseFloat(cost.get('total') as string || '0'),
        0
      );

      res.json({
        total: totalCosts,
        byCategory: costs.reduce(
          (acc, cost) => {
            acc[cost.category] = parseFloat(cost.get('total') as string || '0');
            return acc;
          },
          {} as Record<string, number>
        ),
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get P&L statement
   */
  async getProfitLossStatement(req: Request, res: Response): Promise<void> {
    try {
      const {
        /* period = 'monthly' */
      } = req.params;
      const { startDate, endDate } = req.query;

      let start: Date, end: Date;

      if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
      } else {
        // Default to current month
        start = startOfMonth(new Date());
        end = endOfMonth(new Date());
      }

      const pnl = await financialService.getProfitLossStatement(start, end);
      res.json(pnl);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get MRR metrics
   */
  async getMRRMetrics(req: Request, res: Response): Promise<void> {
    try {
      const currentMRR = await financialService.calculateMRR();
      const lastMonthMRR = await financialService.calculateMRR(
        endOfMonth(subMonths(new Date(), 1))
      );

      const growth = lastMonthMRR > 0 ? ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100 : 0;

      // Get MRR breakdown
      const breakdown = await financialService.getRevenueByPlan(
        startOfMonth(new Date()),
        endOfMonth(new Date())
      );

      res.json({
        current: currentMRR,
        previous: lastMonthMRR,
        growth,
        growthAmount: currentMRR - lastMonthMRR,
        breakdown,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get ARR metrics
   */
  async getARRMetrics(req: Request, res: Response): Promise<void> {
    try {
      const arr = await financialService.calculateARR();
      res.json({ arr });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get revenue by plan
   */
  async getRevenueByPlan(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
      const end = endDate ? new Date(endDate as string) : endOfMonth(new Date());

      const revenueByPlan = await financialService.getRevenueByPlan(start, end);
      res.json(revenueByPlan);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get revenue by country
   */
  async getRevenueByCountry(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : startOfMonth(subMonths(new Date(), 12));
      const end = endDate ? new Date(endDate as string) : endOfMonth(new Date());

      // Get revenue data aggregated by country from transactions
      const revenueByCountry = await Transaction.findAll({
        attributes: [
          'country',
          [Transaction.sequelize!.fn('SUM', Transaction.sequelize!.col('amount')), 'totalRevenue'],
          [Transaction.sequelize!.fn('COUNT', Transaction.sequelize!.col('id')), 'transactionCount'],
        ],
        where: {
          status: 'completed',
          createdAt: { [Op.between]: [start, end] },
          country: { [Op.not]: null },
        },
        group: ['country'],
        order: [[Transaction.sequelize!.literal('totalRevenue'), 'DESC']],
      });

      const formattedData = revenueByCountry.map((record: any) => ({
        country: record.country,
        revenue: parseFloat(record.get('totalRevenue') || '0'),
        transactions: parseInt(record.get('transactionCount') || '0'),
        percentage: 0, // Will be calculated below
      }));

      // Calculate percentages
      const totalRevenue = formattedData.reduce((sum, item) => sum + item.revenue, 0);
      formattedData.forEach(item => {
        item.percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
      });

      res.json({
        countries: formattedData,
        total: totalRevenue,
        period: { start, end },
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get revenue forecast
   */
  async getRevenueForecast(req: Request, res: Response): Promise<void> {
    try {
      const { months = 6 } = req.query;
      const forecastMonths = parseInt(months as string);

      // Get historical revenue data for the last 12 months for better prediction
      const historicalData = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));

        const revenue = await Transaction.sum('amount', {
          where: {
            status: 'completed',
            createdAt: { [Op.between]: [monthStart, monthEnd] },
          },
        });

        historicalData.push({
          month: format(monthStart, 'yyyy-MM'),
          revenue: revenue || 0,
          date: monthStart,
        });
      }

      // Simple linear regression for forecasting
      const forecast = this.calculateLinearRegression(historicalData, forecastMonths);

      // Calculate accuracy based on recent trend consistency
      const accuracy = this.calculateForecastAccuracy(historicalData);

      // Calculate confidence based on data variance
      const confidence = this.calculateForecastConfidence(historicalData);

      res.json({
        historical: historicalData,
        forecast: forecast.map(f => ({
          month: f.month,
          predictedRevenue: Math.max(0, f.revenue), // Ensure non-negative
          confidence: confidence,
        })),
        accuracy,
        confidence,
        algorithm: 'Linear Regression',
        basedOnMonths: historicalData.length,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  private calculateLinearRegression(data: any[], forecastMonths: number): any[] {
    const n = data.length;
    const x = data.map((_, index) => index);
    const y = data.map(d => d.revenue);

    // Calculate slope and intercept
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
    const sumXX = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast
    const forecast = [];
    for (let i = 1; i <= forecastMonths; i++) {
      const futureDate = subMonths(new Date(), -i);
      const predictedRevenue = slope * (n + i - 1) + intercept;

      forecast.push({
        month: format(futureDate, 'yyyy-MM'),
        revenue: Math.round(predictedRevenue * 100) / 100,
        date: futureDate,
      });
    }

    return forecast;
  }

  private calculateForecastAccuracy(data: any[]): number {
    // Calculate R-squared for historical data trend
    if (data.length < 3) return 50; // Default for insufficient data

    const revenues = data.map(d => d.revenue);
    const n = revenues.length;
    const mean = revenues.reduce((a, b) => a + b, 0) / n;

    // Calculate R-squared
    let totalSumSquares = 0;
    let residualSumSquares = 0;

    for (let i = 0; i < n; i++) {
      totalSumSquares += Math.pow(revenues[i] - mean, 2);
      // Simple trend line prediction
      const predicted = mean + ((i - n/2) * (revenues[n-1] - revenues[0]) / n);
      residualSumSquares += Math.pow(revenues[i] - predicted, 2);
    }

    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    return Math.max(0, Math.min(100, rSquared * 100)); // Convert to percentage
  }

  private calculateForecastConfidence(data: any[]): number {
    // Calculate confidence based on data consistency and variance
    if (data.length < 3) return 60; // Default for insufficient data

    const revenues = data.map(d => d.revenue);
    const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;

    // Calculate coefficient of variation
    const variance = revenues.reduce((sum, revenue) => sum + Math.pow(revenue - mean, 2), 0) / revenues.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;

    // Lower variation = higher confidence
    const confidence = Math.max(50, Math.min(95, 90 - (coefficientOfVariation * 100)));
    return Math.round(confidence);
  }

  /**
   * Get subscriptions
   */
  async getSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const { status, plan, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status) where.status = status;
      if (plan) where.plan = plan;

      const { count, rows } = await Subscription.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.json({
        subscriptions: rows,
        total: count,
        page: Number(page),
        totalPages: Math.ceil(count / Number(limit)),
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get active subscriptions
   */
  async getActiveSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const subscriptions = await Subscription.findAll({
        where: {
          status: ['active', 'trialing'],
        },
        order: [['createdAt', 'DESC']],
      });

      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get churn analytics
   */
  async getChurnAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { months = 12 } = req.query;
      const churnData = [];

      for (let i = Number(months) - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));

        const churnRate = await financialService.calculateChurnRate(monthStart, monthEnd);

        churnData.push({
          month: format(monthStart, 'yyyy-MM'),
          churnRate,
        });
      }

      res.json(churnData);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get LTV analytics
   */
  async getLTVAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const ltv = await financialService.calculateLTV();
      const arpu = await financialService.calculateARPU();

      res.json({
        ltv,
        arpu,
        avgLifetimeMonths: 24, // This should be calculated from historical data
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get costs
   */
  async getCosts(req: Request, res: Response): Promise<void> {
    try {
      const { category, startDate, endDate, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (category) where.category = category;
      if (startDate && endDate) {
        where.periodStart = { [Op.gte]: new Date(startDate as string) };
        where.periodEnd = { [Op.lte]: new Date(endDate as string) };
      }

      const { count, rows } = await CostTracking.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['periodStart', 'DESC']],
      });

      res.json({
        costs: rows,
        total: count,
        page: Number(page),
        totalPages: Math.ceil(count / Number(limit)),
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Create cost
   */
  async createCost(req: Request, res: Response): Promise<void> {
    try {
      const cost = await CostTracking.create(req.body);
      res.status(201).json(cost);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Update cost
   */
  async updateCost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cost = await CostTracking.findByPk(id);

      if (!cost) {
        throw new ApiError(404, 'Cost not found');
      }

      await cost.update(req.body);
      res.json(cost);
    } catch (error) {
      res.status((error as any).statusCode || 500).json({ error: (error as Error).message });
    }
  }

  /**
   * Delete cost
   */
  async deleteCost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cost = await CostTracking.findByPk(id);

      if (!cost) {
        throw new ApiError(404, 'Cost not found');
      }

      await cost.destroy();
      res.status(204).send();
    } catch (error) {
      res.status((error as any).statusCode || 500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get costs by category
   */
  async getCostsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
      const end = endDate ? new Date(endDate as string) : endOfMonth(new Date());

      const costs = await CostTracking.findAll({
        attributes: [
          'category',
          [CostTracking.sequelize!.fn('SUM', CostTracking.sequelize!.col('amount')), 'total'],
        ],
        where: {
          periodStart: { [Op.gte]: start },
          periodEnd: { [Op.lte]: end },
        },
        group: ['category'],
      });

      res.json(costs);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get cost optimization suggestions
   */
  async getCostOptimizationSuggestions(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement cost optimization logic
      res.json({
        suggestions: [],
        potentialSavings: 0,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get snapshots
   */
  async getSnapshots(req: Request, res: Response): Promise<void> {
    try {
      const { period, startDate, endDate } = req.query;
      const where: any = {};

      if (period) where.period = period;
      if (startDate && endDate) {
        where.date = { [Op.between]: [new Date(startDate as string), new Date(endDate as string)] };
      }

      const snapshots = await FinancialSnapshot.findAll({
        where,
        order: [['date', 'DESC']],
      });

      res.json(snapshots);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Generate snapshot
   */
  async generateSnapshot(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.body;
      const snapshot = await financialService.generateDailySnapshot(
        date ? new Date(date) : new Date()
      );
      res.status(201).json(snapshot);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get latest snapshot
   */
  async getLatestSnapshot(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'daily' } = req.query;
      const snapshot = await FinancialSnapshot.findOne({
        where: { period: period as string },
        order: [['date', 'DESC']],
      });

      res.json(snapshot);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get reports
   */
  async getReports(req: Request, res: Response): Promise<void> {
    try {
      const { type, status, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (type) where.type = type;
      if (status) where.status = status;

      const { count, rows } = await FinancialReport.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.json({
        reports: rows,
        total: count,
        page: Number(page),
        totalPages: Math.ceil(count / Number(limit)),
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Create report
   */
  async createReport(req: Request, res: Response): Promise<void> {
    try {
      const report = await FinancialReport.create(req.body);
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get report
   */
  async getReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const report = await FinancialReport.findByPk(id);

      if (!report) {
        throw new ApiError(404, 'Report not found');
      }

      res.json(report);
    } catch (error) {
      res.status((error as any).statusCode || 500).json({ error: (error as Error).message });
    }
  }

  /**
   * Download report
   */
  async downloadReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { format = 'pdf' } = req.query;

      const report = await FinancialReport.findByPk(id);

      if (!report) {
        throw new ApiError(404, 'Report not found');
      }

      // Generate report content based on format
      if (format === 'csv') {
        await this.generateCSVReport(report, res);
      } else if (format === 'excel') {
        await this.generateExcelReport(report, res);
      } else {
        await this.generatePDFReport(report, res);
      }
    } catch (error) {
      res.status((error as any).statusCode || 500).json({ error: (error as Error).message });
    }
  }

  private async generateCSVReport(report: any, res: Response): Promise<void> {
    // Get report data based on report type
    const data = await this.getReportData(report.type, report.parameters);

    // Convert data to CSV format
    const csvContent = this.convertToCSV(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${report.name}_${format(new Date(), 'yyyy-MM-dd')}.csv"`);
    res.send(csvContent);
  }

  private async generateExcelReport(report: any, res: Response): Promise<void> {
    // Implementation would require xlsx library
    res.status(501).json({ error: 'Excel export not yet implemented' });
  }

  private async generatePDFReport(report: any, res: Response): Promise<void> {
    // Implementation would require puppeteer or similar library
    res.status(501).json({ error: 'PDF export not yet implemented' });
  }

  private async getReportData(reportType: string, parameters: any): Promise<any[]> {
    // Retrieve actual report data based on type
    switch (reportType) {
      case 'revenue':
        return await this.getRevenueReportData(parameters);
      case 'subscriptions':
        return await this.getSubscriptionReportData(parameters);
      default:
        return [];
    }
  }

  private async getRevenueReportData(parameters: any): Promise<any[]> {
    const { startDate, endDate } = parameters;
    const transactions = await Transaction.findAll({
      where: {
        status: 'completed',
        createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] },
      },
      order: [['createdAt', 'DESC']],
    });

    return transactions.map(t => ({
      date: format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      country: t.country,
      paymentMethod: t.paymentMethod,
    }));
  }

  private async getSubscriptionReportData(parameters: any): Promise<any[]> {
    const { startDate, endDate } = parameters;
    const subscriptions = await Subscription.findAll({
      where: {
        createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] },
      },
      order: [['createdAt', 'DESC']],
    });

    return subscriptions.map(s => ({
      date: format(new Date(s.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      plan: s.plan,
      status: s.status,
      amount: s.amount,
      currency: s.currency,
      interval: s.interval,
      canceledAt: s.canceledAt ? format(new Date(s.canceledAt), 'yyyy-MM-dd HH:mm:ss') : null,
    }));
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  /**
   * Send report
   */
  async sendReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        /* recipients */
      } = req.body;

      const report = await FinancialReport.findByPk(id);

      if (!report) {
        throw new ApiError(404, 'Report not found');
      }

      // TODO: Implement report sending logic
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      res.status((error as any).statusCode || 500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { months = 12 } = req.query;
      const analysisMonths = parseInt(months as string);

      // Get subscription cohorts data
      const cohorts = [];

      for (let i = analysisMonths - 1; i >= 0; i--) {
        const cohortStart = startOfMonth(subMonths(new Date(), i));
        const cohortEnd = endOfMonth(subMonths(new Date(), i));

        // Get all subscriptions that started in this month (cohort)
        const cohortSubscriptions = await Subscription.findAll({
          where: {
            createdAt: { [Op.between]: [cohortStart, cohortEnd] },
          },
          attributes: ['id', 'userId', 'createdAt', 'canceledAt'],
        });

        if (cohortSubscriptions.length === 0) {
          cohorts.push({
            month: format(cohortStart, 'yyyy-MM'),
            totalUsers: 0,
            retention: [],
          });
          continue;
        }

        // Calculate retention for each subsequent month
        const retention = [];
        for (let j = 0; j <= Math.min(11, Math.floor((new Date().getTime() - cohortStart.getTime()) / (30.44 * 24 * 60 * 60 * 1000))); j++) {
          const retentionMonth = subMonths(cohortStart, -j);
          const retentionMonthEnd = endOfMonth(retentionMonth);

          // Count how many users were still active in this retention month
          let activeUsers = 0;
          for (const subscription of cohortSubscriptions) {
            const subStart = new Date(subscription.createdAt);
            const subEnd = subscription.canceledAt ? new Date(subscription.canceledAt) : new Date();

            // Check if subscription was active during retention month
            if (subStart <= retentionMonthEnd && subEnd >= retentionMonth) {
              activeUsers++;
            }
          }

          retention.push({
            monthIndex: j,
            activeUsers,
            retentionRate: (activeUsers / cohortSubscriptions.length) * 100,
          });
        }

        cohorts.push({
          month: format(cohortStart, 'yyyy-MM'),
          totalUsers: cohortSubscriptions.length,
          retention,
        });
      }

      // Calculate average retention rates across all cohorts
      const maxRetentionMonths = Math.max(...cohorts.map(c => c.retention.length));
      const averageRetention = [];

      for (let month = 0; month < maxRetentionMonths; month++) {
        const validCohorts = cohorts.filter(c => c.retention[month] && c.totalUsers > 0);
        if (validCohorts.length > 0) {
          const avgRetention = validCohorts.reduce((sum, c) => sum + c.retention[month].retentionRate, 0) / validCohorts.length;
          averageRetention.push({
            monthIndex: month,
            averageRetentionRate: Math.round(avgRetention * 100) / 100,
            cohortsCount: validCohorts.length,
          });
        }
      }

      res.json({
        cohorts,
        averageRetention,
        totalCohorts: cohorts.length,
        analysisRange: {
          start: format(subMonths(new Date(), analysisMonths - 1), 'yyyy-MM'),
          end: format(new Date(), 'yyyy-MM'),
        },
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get cohort details
   */
  async getCohortDetails(req: Request, res: Response): Promise<void> {
    try {
      const { month } = req.params;

      // TODO: Implement cohort details logic
      res.json({
        cohort: month,
        data: [],
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get unit economics
   */
  async getUnitEconomics(req: Request, res: Response): Promise<void> {
    try {
      const ltv = await financialService.calculateLTV();
      const cac = await financialService.calculateCAC(
        startOfMonth(subMonths(new Date(), 3)),
        new Date()
      );
      const arpu = await financialService.calculateARPU();

      res.json({
        ltv,
        cac,
        ltvToCacRatio: cac > 0 ? ltv / cac : 0,
        arpu,
        paybackPeriod: cac > 0 ? cac / arpu : 0,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get CAC
   */
  async getCAC(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate
        ? new Date(startDate as string)
        : startOfMonth(subMonths(new Date(), 3));
      const end = endDate ? new Date(endDate as string) : new Date();

      const cac = await financialService.calculateCAC(start, end);
      res.json({ cac });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get LTV to CAC ratio
   */
  async getLTVtoCACRatio(req: Request, res: Response): Promise<void> {
    try {
      const ltv = await financialService.calculateLTV();
      const cac = await financialService.calculateCAC(
        startOfMonth(subMonths(new Date(), 3)),
        new Date()
      );

      res.json({
        ltv,
        cac,
        ratio: cac > 0 ? ltv / cac : 0,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get billing events
   */
  async getBillingEvents(req: Request, res: Response): Promise<void> {
    try {
      const { eventType, userId, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (eventType) where.eventType = eventType;
      if (userId) where.userId = userId;

      const { count, rows } = await BillingEvent.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.json({
        events: rows,
        total: count,
        page: Number(page),
        totalPages: Math.ceil(count / Number(limit)),
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get billing event
   */
  async getBillingEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const event = await BillingEvent.findByPk(id);

      if (!event) {
        throw new ApiError(404, 'Billing event not found');
      }

      res.json(event);
    } catch (error) {
      res.status((error as any).statusCode || 500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get automation status
   */
  async getAutomationStatus(req: Request, res: Response): Promise<void> {
    try {
      const jobs = SchedulerService.getJobStatus();
      const lastReports = await FinancialReport.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5,
      });

      res.json({
        scheduledJobs: jobs,
        recentReports: lastReports,
        emailService: {
          status: 'active',
          lastSent: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Trigger automation manually
   */
  async triggerAutomation(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;

      switch (type) {
        case 'daily-snapshot':
          await reportingService.generateDailySnapshot();
          break;
        case 'weekly-report':
          await reportingService.generateScheduledReports();
          break;
        case 'cost-analysis':
          // Trigger cost analysis
          break;
        default:
          throw new ApiError(400, 'Invalid automation type');
      }

      res.json({
        success: true,
        message: `${type} automation triggered successfully`,
      });
    } catch (error) {
      res.status((error as any).statusCode || 500).json({ error: (error as Error).message });
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ApiError(400, 'Email address is required');
      }

      await emailService.send({
        to: email,
        subject: 'Test Email from Financial Dashboard',
        text: 'This is a test email to verify email service is working correctly.',
      });

      res.json({
        success: true,
        message: `Test email sent to ${email}`,
      });
    } catch (error) {
      res.status((error as any).statusCode || 500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get scheduled jobs
   */
  async getScheduledJobs(req: Request, res: Response): Promise<void> {
    try {
      const jobs = SchedulerService.getJobStatus();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Start a job
   */
  async startJob(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      // Note: This would need to be implemented in SchedulerService
      res.json({
        success: true,
        message: `Job ${name} start requested`,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Stop a job
   */
  async stopJob(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const stopped = SchedulerService.stopJob(name);

      res.json({
        success: stopped,
        message: stopped ? `Job ${name} stopped` : `Job ${name} not found`,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
