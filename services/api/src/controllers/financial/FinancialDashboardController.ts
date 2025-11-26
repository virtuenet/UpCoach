import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import * as ExcelJS from 'exceljs';
// @ts-ignore - Optional dependency for PDF generation - loaded dynamically
let puppeteer: any = null;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  console.warn('Puppeteer not installed - PDF generation will be disabled');
}

import {
  Transaction,
  Subscription,
  CostTracking,
  FinancialSnapshot,
  FinancialReport,
  BillingEvent,
} from '../../models';
import { ReportStatus } from '../../models/financial/FinancialReport';
import emailService from '../../services/email/UnifiedEmailService';
import { financialService } from '../../services/financial/FinancialService';
import { reportingService } from '../../services/financial/ReportingService';
import { SchedulerService } from '../../services/SchedulerService';
import { ApiError } from '../../utils/apiError';
import { getErrorStatusCode } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

// Types and interfaces for export functionality
interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  includeMetadata?: boolean;
  includeCharts?: boolean;
  reportType?: string;
}

interface ReportData {
  date?: string;
  amount?: number;
  currency?: string;
  status?: string;
  country?: string;
  paymentMethod?: string;
  plan?: string;
  interval?: string;
  canceledAt?: string | null;
  userId?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface ExportSummary {
  totalItems: number;
  totalRevenue?: number;
  avgTransaction?: number;
  activeCount?: number;
  canceledCount?: number;
}

export class FinancialDashboardController {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(req: Request, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;

      if (!this.canUserAccessMetrics(userRole, 'dashboard')) {
        this.logSecurityEvent(req, 'UNAUTHORIZED_DASHBOARD_ACCESS');
        throw new ApiError(403, 'Insufficient permissions to access dashboard metrics');
      }

      const metrics = await financialService.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(getErrorStatusCode(error) || 500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(req: Request, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;

      if (!this.canUserAccessMetrics(userRole, 'revenue')) {
        this.logSecurityEvent(req, 'UNAUTHORIZED_REVENUE_ACCESS');
        throw new ApiError(403, 'Insufficient permissions to access revenue metrics');
      }

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
      res.status(getErrorStatusCode(error) || 500).json({ error: (error as Error).message });
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
      const userRole = req.user?.role;

      if (!this.canUserAccessMetrics(userRole, 'costs')) {
        this.logSecurityEvent(req, 'UNAUTHORIZED_COST_ACCESS');
        throw new ApiError(403, 'Insufficient permissions to access cost metrics');
      }

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
      res.status(getErrorStatusCode(error) || 500).json({ error: (error as Error).message });
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

      const formattedData = revenueByCountry.map((record: unknown) => ({
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

  private calculateLinearRegression(data: unknown[], forecastMonths: number): unknown[] {
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

  private calculateForecastAccuracy(data: unknown[]): number {
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

  private calculateForecastConfidence(data: unknown[]): number {
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

      const where: unknown = {};
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

      const where: unknown = {};
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
      const userRole = req.user?.role;

      // Only admin and financial_analyst can create cost entries
      if (!['admin', 'super_admin', 'financial_analyst'].includes(userRole)) {
        this.logSecurityEvent(req, 'UNAUTHORIZED_COST_CREATE_ATTEMPT');
        throw new ApiError(403, 'Insufficient permissions to create cost entries');
      }

      const cost = await CostTracking.create(req.body);
      res.status(201).json(cost);
    } catch (error) {
      res.status(getErrorStatusCode(error) || 500).json({ error: (error as Error).message });
    }
  }

  /**
   * Update cost
   */
  async updateCost(req: Request, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;

      // Only admin and financial_analyst can update cost entries
      if (!['admin', 'super_admin', 'financial_analyst'].includes(userRole)) {
        this.logSecurityEvent(req, 'UNAUTHORIZED_COST_UPDATE_ATTEMPT', { costId: req.params.id });
        throw new ApiError(403, 'Insufficient permissions to update cost entries');
      }

      const { id } = req.params;
      const cost = await CostTracking.findByPk(id);

      if (!cost) {
        throw new ApiError(404, 'Cost not found');
      }

      await cost.update(req.body);
      res.json(cost);
    } catch (error) {
      res.status(getErrorStatusCode(error) || 500).json({ error: (error as Error).message });
    }
  }

  /**
   * Delete cost
   */
  async deleteCost(req: Request, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;

      // Only admin can delete cost entries (more restrictive than create/update)
      if (!['admin', 'super_admin'].includes(userRole)) {
        this.logSecurityEvent(req, 'UNAUTHORIZED_COST_DELETE_ATTEMPT', { costId: req.params.id });
        throw new ApiError(403, 'Insufficient permissions to delete cost entries');
      }

      const { id } = req.params;
      const cost = await CostTracking.findByPk(id);

      if (!cost) {
        throw new ApiError(404, 'Cost not found');
      }

      await cost.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(getErrorStatusCode(error) || 500).json({ error: (error as Error).message });
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
      const suggestions = await this.generateCostOptimizationSuggestions();
      const potentialSavings = suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);

      res.json({
        suggestions,
        potentialSavings,
        optimizationScore: this.calculateOptimizationScore(suggestions),
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
      const where: unknown = {};

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

      const where: unknown = {};
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
      const userRole = req.user?.role;
      const userId = req.user?.id;

      // Only admin, financial_analyst, and manager can create reports
      if (!['admin', 'super_admin', 'financial_analyst', 'manager'].includes(userRole)) {
        this.logSecurityEvent(req, 'UNAUTHORIZED_REPORT_CREATE_ATTEMPT');
        throw new ApiError(403, 'Insufficient permissions to create reports');
      }

      // Add creator information to report metadata
      const reportData = {
        ...req.body,
        metadata: {
          ...req.body.metadata,
          createdBy: userId,
          createdByRole: userRole,
          createdAt: new Date().toISOString()
        }
      };

      const report = await FinancialReport.create(reportData);
      res.status(201).json(report);
    } catch (error) {
      res.status(getErrorStatusCode(error) || 500).json({ error: (error as Error).message });
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
      res.status(getErrorStatusCode(error) || 500).json({ error: (error as Error).message });
    }
  }

  /**
   * Download report
   */
  async downloadReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { format = 'pdf' } = req.query;

      // Validate format parameter
      if (!['pdf', 'excel', 'csv'].includes(format as string)) {
        throw new ApiError(400, 'Invalid format. Supported formats: pdf, excel, csv');
      }

      const report = await FinancialReport.findByPk(id);

      if (!report) {
        throw new ApiError(404, 'Report not found');
      }

      // Check if user has permission to access this report
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!this.canUserAccessReport(userId, userRole, report)) {
        throw new ApiError(403, 'Insufficient permissions to access this report');
      }

      // Log export activity for audit purposes
      logger.info('Report export requested', {
        reportId: id,
        format,
        reportType: report.type,
        requestTime: new Date().toISOString(),
        userId: req.user?.id,
        userRole: req.user?.role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        event: 'REPORT_EXPORT_REQUESTED'
      });

      // Generate report content based on format
      if (format === 'csv') {
        await this.generateCSVReport(report, res);
      } else if (format === 'excel') {
        await this.generateExcelReport(report, res);
      } else {
        await this.generatePDFReport(report, res);
      }

      // Log successful export
      logger.info('Report export completed successfully', {
        reportId: id,
        format,
        reportType: report.type,
        completionTime: new Date().toISOString(),
        userId: req.user?.id,
        userRole: req.user?.role,
        event: 'REPORT_EXPORT_COMPLETED'
      });

    } catch (error) {
      logger.error('Report export failed', {
        reportId: req.params.id,
        format: req.query.format,
        error: (error as Error).message,
        stack: (error as Error).stack,
        userId: req.user?.id,
        userRole: req.user?.role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        event: 'REPORT_EXPORT_FAILED'
      });

      res.status(getErrorStatusCode(error) || 500).json({
        error: (error as Error).message,
        code: 'EXPORT_FAILED'
      });
    }
  }

  private async generateCSVReport(report: unknown, res: Response): Promise<void> {
    // Get report data based on report type
    const data = await this.getReportData(report.type, report.parameters);

    // Convert data to CSV format
    const csvContent = this.convertToCSV(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${report.name}_${format(new Date(), 'yyyy-MM-dd')}.csv"`);
    res.send(csvContent);
  }

  private async generateExcelReport(report: unknown, res: Response): Promise<void> {
    try {
      // Validate report parameters
      const validation = this.validateExportParams(report.parameters);
      if (!validation.isValid) {
        throw new ApiError(400, `Invalid parameters: ${validation.errors.join(', ')}`);
      }

      // Get report data based on report type
      const data = await this.getReportData(report.type, report.parameters);

      if (!data || data.length === 0) {
        throw new ApiError(400, 'No data available for export');
      }

      // Check if data size is within limits
      if (!this.validateDataSize(data, 'excel')) {
        throw new ApiError(413, 'Report data is too large to export as Excel. Please reduce the date range or use CSV format.');
      }

      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'UpCoach Financial Dashboard';
      workbook.lastModifiedBy = 'System';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Create worksheet
      const worksheet = workbook.addWorksheet(`${report.name} Report`);

      // Add header styling
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: '366EF7' } },
        border: {
          top: { style: 'thin' as const },
          left: { style: 'thin' as const },
          bottom: { style: 'thin' as const },
          right: { style: 'thin' as const }
        },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
      };

      // Add report title and metadata
      worksheet.mergeCells('A1:E1');
      worksheet.getCell('A1').value = `${report.name} - Financial Report`;
      worksheet.getCell('A1').style = {
        font: { size: 16, bold: true },
        alignment: { horizontal: 'center' as const }
      };

      worksheet.mergeCells('A2:E2');
      worksheet.getCell('A2').value = `Generated on: ${format(new Date(), 'PPP')}`;
      worksheet.getCell('A2').style = {
        font: { size: 12 },
        alignment: { horizontal: 'center' as const }
      };

      // Add data headers
      const headers = Object.keys(data[0]);
      const headerRow = worksheet.addRow([]);
      // Headers will start from row 4

      headers.forEach((header, index) => {
        const cell = worksheet.getCell(4, index + 1);
        cell.value = this.formatHeaderName(header);
        cell.style = headerStyle;
      });

      // Add data rows
      data.forEach((row, rowIndex) => {
        const dataRow = worksheet.addRow([]);
        headers.forEach((header, colIndex) => {
          const cell = worksheet.getCell(rowIndex + 5, colIndex + 1);
          let value = row[header];

          // Format different data types
          if (header.includes('amount') || header.includes('revenue') || header.includes('cost')) {
            value = typeof value === 'number' ? value : parseFloat(value || '0');
          } else if (header.includes('date') || header.includes('At')) {
            value = value ? new Date(value) : '';
          }

          cell.value = value;

          // Apply formatting based on data type
          if (typeof value === 'number' && (header.includes('amount') || header.includes('revenue') || header.includes('cost'))) {
            cell.numFmt = '$#,##0.00';
          } else if (value instanceof Date) {
            cell.numFmt = 'mm/dd/yyyy';
          }

          // Add borders
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Auto-fit columns
      worksheet.columns.forEach((column, index) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 15), 50);
      });

      // Add summary if it's a revenue report
      if (report.type === 'revenue' && data.length > 0) {
        const summaryRow = worksheet.addRow([]);
        summaryRow.getCell(1).value = 'Total Revenue:';
        summaryRow.getCell(1).style = { font: { bold: true } };

        const totalRevenue = data.reduce((sum: number, row: unknown) => sum + (parseFloat(String(row.amount)) || 0), 0);
        summaryRow.getCell(2).value = totalRevenue;
        summaryRow.getCell(2).numFmt = '$#,##0.00';
        summaryRow.getCell(2).style = { font: { bold: true } };
      }

      // Set response headers for Excel download
      const baseFilename = `${report.name}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      const sanitizedFilename = this.sanitizeFilename(baseFilename);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);

      // Write to response
      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      logger.error('Error generating Excel report:', error);
      res.status(500).json({ error: 'Failed to generate Excel report' });
    }
  }

  private async generatePDFReport(report: unknown, res: Response): Promise<void> {
    try {
      // Validate report parameters
      const validation = this.validateExportParams(report.parameters);
      if (!validation.isValid) {
        throw new ApiError(400, `Invalid parameters: ${validation.errors.join(', ')}`);
      }

      // Get report data
      const data = await this.getReportData(report.type, report.parameters);

      if (!data || data.length === 0) {
        throw new ApiError(400, 'No data available for export');
      }

      // Check if data size is within limits
      if (!this.validateDataSize(data, 'pdf')) {
        throw new ApiError(413, 'Report data is too large to export as PDF. Please reduce the date range or use CSV format.');
      }

      // Create HTML template for PDF
      const htmlContent = this.generatePDFHTML(report, data);

      // Launch puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // Set content and generate PDF
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '10mm',
          right: '10mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            UpCoach Financial Dashboard
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on ${format(new Date(), 'PPP')}
          </div>
        `
      });

      await browser.close();

      // Set response headers for PDF download
      const baseFilename = `${report.name}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      const sanitizedFilename = this.sanitizeFilename(baseFilename);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);

    } catch (error) {
      logger.error('Error generating PDF report:', error);
      res.status(500).json({ error: 'Failed to generate PDF report' });
    }
  }

  private async getReportData(reportType: string, parameters: unknown): Promise<ReportData[]> {
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

  private async getRevenueReportData(parameters: unknown): Promise<ReportData[]> {
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

  private async getSubscriptionReportData(parameters: unknown): Promise<ReportData[]> {
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
      interval: s.billingInterval,
      canceledAt: s.canceledAt ? format(new Date(s.canceledAt), 'yyyy-MM-dd HH:mm:ss') : null,
    }));
  }

  private convertToCSV(data: unknown[]): string {
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
      const { recipients, format = 'pdf', message, subject } = req.body;

      // Validate required fields
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        throw new ApiError(400, 'Recipients array is required and must not be empty');
      }

      // Validate email addresses
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = recipients.filter((email: string) => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        throw new ApiError(400, `Invalid email addresses: ${invalidEmails.join(', ')}`);
      }

      const report = await FinancialReport.findByPk(id);

      if (!report) {
        throw new ApiError(404, 'Report not found');
      }

      // Validate format
      if (!['pdf', 'excel', 'csv'].includes(format)) {
        throw new ApiError(400, 'Invalid format. Supported formats: pdf, excel, csv');
      }

      // Generate report data
      const reportData = await this.getReportData(report.type, report.parameters);

      if (!reportData || reportData.length === 0) {
        throw new ApiError(400, 'No data available in report to send');
      }

      // Check data size limits
      if (!this.validateDataSize(reportData, format)) {
        throw new ApiError(413, 'Report data is too large to send via email. Please reduce the date range.');
      }

      let attachmentBuffer: Buffer;
      let filename: string;
      let contentType: string;

      // Generate attachment based on format
      if (format === 'pdf') {
        // Generate PDF
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        const htmlContent = this.generatePDFHTML(report, reportData);
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        attachmentBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', bottom: '20mm', left: '10mm', right: '10mm' }
        });

        await browser.close();
        filename = `${report.name}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        contentType = 'application/pdf';

      } else if (format === 'excel') {
        // Generate Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`${report.name} Report`);

        // Add headers
        const headers = Object.keys(reportData[0]);
        worksheet.addRow(headers);

        // Add data
        reportData.forEach(row => {
          const values = headers.map(header => row[header]);
          worksheet.addRow(values);
        });

        // Auto-fit columns
        worksheet.columns.forEach(column => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 15), 50);
        });

        attachmentBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
        filename = `${report.name}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      } else {
        // Generate CSV
        const csvContent = this.convertToCSV(reportData);
        attachmentBuffer = Buffer.from(csvContent, 'utf8');
        filename = `${report.name}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        contentType = 'text/csv';
      }

      // Prepare email content
      const emailSubject = subject || `Financial Report: ${report.name}`;
      const emailMessage = message || `Please find attached the ${report.name} financial report generated on ${format(new Date(), 'PPP')}.`;

      // Send emails to all recipients
      const emailPromises = recipients.map(async (email: string) => {
        try {
          await emailService.send({
            to: email,
            subject: emailSubject,
            html: `
              <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #366EF7;">Financial Report</h2>
                <p>${emailMessage}</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">
                  This report was generated automatically by UpCoach Financial Dashboard.<br>
                  Report Type: ${report.type}<br>
                  Generated: ${format(new Date(), 'PPP pp')}<br>
                  Format: ${format.toUpperCase()}
                </p>
              </div>
            `,
            text: `${emailMessage}\n\nThis report was generated automatically by UpCoach Financial Dashboard.`,
            attachments: [{
              filename: this.sanitizeFilename(filename),
              content: attachmentBuffer,
              contentType: contentType
            }]
          });

          logger.info('Report sent successfully', {
            reportId: id,
            recipient: email,
            format,
            filename,
            reportType: report.type
          });

          return { email, success: true };
        } catch (emailError) {
          logger.error('Failed to send report email', {
            reportId: id,
            recipient: email,
            error: (emailError as Error).message
          });

          return { email, success: false, error: (emailError as Error).message };
        }
      });

      // Wait for all emails to be sent
      const results = await Promise.all(emailPromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      // Update report status to indicate it was sent
      await report.update({
        status: ReportStatus.COMPLETED,
        metadata: {
          ...report.metadata,
          lastSent: new Date().toISOString(),
          sentTo: recipients,
          sentFormat: format,
          sendResults: results
        }
      });

      res.json({
        success: true,
        message: `Report sent to ${successful.length} of ${recipients.length} recipients`,
        results: {
          successful: successful.length,
          failed: failed.length,
          recipients: results
        },
        reportId: id,
        format,
        filename: this.sanitizeFilename(filename)
      });

    } catch (error) {
      logger.error('Report sending failed', {
        reportId: req.params.id,
        error: (error as Error).message,
        stack: (error as Error).stack
      });

      res.status(getErrorStatusCode(error) || 500).json({
        error: (error as Error).message,
        code: 'SEND_FAILED'
      });
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

      // Validate month parameter (format: YYYY-MM)
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        throw new ApiError(400, 'Invalid month format. Expected format: YYYY-MM');
      }

      const cohortDate = new Date(`${month}-01`);
      if (isNaN(cohortDate.getTime())) {
        throw new ApiError(400, 'Invalid month value');
      }

      const cohortStart = startOfMonth(cohortDate);
      const cohortEnd = endOfMonth(cohortDate);

      // Get all subscriptions that started in this cohort month
      const cohortSubscriptions = await Subscription.findAll({
        where: {
          createdAt: { [Op.between]: [cohortStart, cohortEnd] },
        },
        attributes: ['id', 'userId', 'createdAt', 'canceledAt', 'plan', 'amount', 'status', 'interval'],
        order: [['createdAt', 'ASC']],
      });

      if (cohortSubscriptions.length === 0) {
        res.json({
          cohort: month,
          totalUsers: 0,
          cohortStart: cohortStart.toISOString(),
          cohortEnd: cohortEnd.toISOString(),
          users: [],
          retentionAnalysis: {
            retentionByMonth: [],
            averageRetentionRate: 0,
            totalCohortRevenue: 0,
            revenuePerUser: 0
          },
          planDistribution: [],
          summary: {
            activeUsers: 0,
            churnedUsers: 0,
            currentChurnRate: 0
          }
        });
        return;
      }

      // Calculate detailed user information
      const usersDetails = await Promise.all(
        cohortSubscriptions.map(async (subscription) => {
          // Get total revenue from this user
          const userRevenue = await Transaction.sum('amount', {
            where: {
              userId: subscription.userId,
              status: 'completed',
              createdAt: { [Op.gte]: cohortStart }
            }
          });

          // Calculate user lifetime (in months)
          const endDate = subscription.canceledAt
            ? new Date(subscription.canceledAt)
            : new Date();

          const lifetimeMonths = Math.max(1, Math.ceil(
            (endDate.getTime() - new Date(subscription.createdAt).getTime()) / (30.44 * 24 * 60 * 60 * 1000)
          ));

          return {
            userId: subscription.userId,
            subscriptionId: subscription.id,
            joinedAt: subscription.createdAt,
            canceledAt: subscription.canceledAt,
            plan: subscription.plan,
            monthlyAmount: subscription.amount,
            interval: subscription.billingInterval,
            status: subscription.status,
            lifetimeMonths,
            totalRevenue: userRevenue || 0,
            isActive: !subscription.canceledAt || new Date(subscription.canceledAt) > new Date(),
            daysActive: Math.ceil((endDate.getTime() - new Date(subscription.createdAt).getTime()) / (24 * 60 * 60 * 1000))
          };
        })
      );

      // Calculate retention by month for this specific cohort
      const retentionByMonth = [];
      const currentDate = new Date();
      const maxMonths = Math.min(24, Math.ceil((currentDate.getTime() - cohortStart.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));

      for (let monthIndex = 0; monthIndex <= maxMonths; monthIndex++) {
        const retentionDate = new Date(cohortStart);
        retentionDate.setMonth(retentionDate.getMonth() + monthIndex);
        const retentionMonthEnd = endOfMonth(retentionDate);

        // Count active users in this retention month
        const activeUsersInMonth = usersDetails.filter(user => {
          const userStart = new Date(user.joinedAt);
          const userEnd = user.canceledAt ? new Date(user.canceledAt) : currentDate;

          // User is active if they started before this month ends and haven't canceled before this month starts
          return userStart <= retentionMonthEnd && userEnd >= startOfMonth(retentionDate);
        });

        const retentionRate = (activeUsersInMonth.length / cohortSubscriptions.length) * 100;

        retentionByMonth.push({
          monthIndex,
          month: format(retentionDate, 'yyyy-MM'),
          activeUsers: activeUsersInMonth.length,
          retentionRate: Math.round(retentionRate * 100) / 100,
          churnedUsers: cohortSubscriptions.length - activeUsersInMonth.length,
          churnRate: Math.round((100 - retentionRate) * 100) / 100
        });
      }

      // Calculate plan distribution
      const planDistribution = cohortSubscriptions.reduce((acc, sub) => {
        const plan = sub.plan || 'Unknown';
        if (!acc[plan]) {
          acc[plan] = { count: 0, revenue: 0 };
        }
        acc[plan].count += 1;
        acc[plan].revenue += Number(sub.amount) || 0;
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>);

      const planDistributionArray = Object.entries(planDistribution).map(([plan, data]: [string, { count: number; revenue: number }]) => ({
        plan,
        users: data.count,
        percentage: Math.round((data.count / cohortSubscriptions.length) * 10000) / 100,
        monthlyRevenue: data.revenue,
        averageRevenuePerUser: Math.round((data.revenue / data.count) * 100) / 100
      }));

      // Calculate summary statistics
      const activeUsers = usersDetails.filter(user => user.isActive).length;
      const churnedUsers = usersDetails.filter(user => !user.isActive).length;
      const currentChurnRate = Math.round((churnedUsers / cohortSubscriptions.length) * 10000) / 100;

      const totalCohortRevenue = usersDetails.reduce((sum, user) => sum + user.totalRevenue, 0);
      const revenuePerUser = Math.round((totalCohortRevenue / cohortSubscriptions.length) * 100) / 100;

      const averageLifetimeMonths = Math.round(
        (usersDetails.reduce((sum, user) => sum + user.lifetimeMonths, 0) / usersDetails.length) * 100
      ) / 100;

      const averageRetentionRate = retentionByMonth.length > 0
        ? Math.round((retentionByMonth.reduce((sum, month) => sum + month.retentionRate, 0) / retentionByMonth.length) * 100) / 100
        : 0;

      // Sort users by total revenue for insights
      const topUsersDetails = usersDetails
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10); // Top 10 users by revenue

      res.json({
        cohort: month,
        totalUsers: cohortSubscriptions.length,
        cohortStart: cohortStart.toISOString(),
        cohortEnd: cohortEnd.toISOString(),
        users: usersDetails.sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()),
        topUsers: topUsersDetails,
        retentionAnalysis: {
          retentionByMonth,
          averageRetentionRate,
          totalCohortRevenue,
          revenuePerUser,
          averageLifetimeMonths,
          maxRetentionMonths: maxMonths
        },
        planDistribution: planDistributionArray,
        summary: {
          activeUsers,
          churnedUsers,
          currentChurnRate,
          cohortSize: cohortSubscriptions.length,
          retentionPeriodMonths: maxMonths + 1,
          currentMonthRetention: retentionByMonth.length > 0 ? retentionByMonth[retentionByMonth.length - 1].retentionRate : 0
        },
        insights: {
          bestRetentionMonth: retentionByMonth.length > 1
            ? retentionByMonth.reduce((max, month) => month.retentionRate > max.retentionRate ? month : max)
            : null,
          biggestChurnMonth: retentionByMonth.length > 1
            ? retentionByMonth.reduce((max, month) => month.churnRate > max.churnRate ? month : max)
            : null,
          mostPopularPlan: planDistributionArray.length > 0
            ? planDistributionArray.reduce((max, plan) => plan.users > max.users ? plan : max)
            : null,
          highestValuePlan: planDistributionArray.length > 0
            ? planDistributionArray.reduce((max, plan) => plan.averageRevenuePerUser > max.averageRevenuePerUser ? plan : max)
            : null
        }
      });

    } catch (error) {
      logger.error('Error getting cohort details', {
        month: req.params.month,
        error: (error as Error).message,
        stack: (error as Error).stack
      });

      res.status(getErrorStatusCode(error) || 500).json({
        error: (error as Error).message,
        code: 'COHORT_DETAILS_ERROR'
      });
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

      const where: unknown = {};
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
      res.status(getErrorStatusCode(error) || 500).json({ error: (error as Error).message });
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
      const userRole = req.user?.role;
      const { type } = req.params;

      // Only admin and financial_analyst can trigger automation
      if (!['admin', 'super_admin', 'financial_analyst'].includes(userRole)) {
        this.logSecurityEvent(req, 'UNAUTHORIZED_AUTOMATION_TRIGGER', { automationType: type });
        throw new ApiError(403, 'Insufficient permissions to trigger automation');
      }

      // Log automation trigger for audit
      logger.info('Manual automation triggered', {
        type,
        userId: req.user?.id,
        userRole,
        timestamp: new Date().toISOString(),
        event: 'AUTOMATION_TRIGGERED'
      });

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
      res.status(getErrorStatusCode(error) || 500).json({ error: (error as Error).message });
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
      res.status(getErrorStatusCode(error) || 500).json({ error: (error as Error).message });
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

  /**
   * Generate cost optimization suggestions based on current spending patterns
   */
  private async generateCostOptimizationSuggestions(): Promise<Array<{
    category: string;
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
    potentialSavings: number;
    implementation: string;
    timeframe: string;
  }>> {
    const suggestions = [];

    try {
      // Import cost tracking model dynamically
      const { CostTracking } = await import('../../models/financial/CostTracking');

      // Get cost data for the last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const costs = await CostTracking.findAll({
        where: {
          periodStart: { [Op.gte]: threeMonthsAgo }
        },
        order: [['periodStart', 'DESC']]
      });

      // Analyze cost patterns by category
      const costsByCategory = costs.reduce((acc, cost) => {
        const category = cost.category;
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0, recent: 0 };
        }
        acc[category].total += Number(cost.amount);
        acc[category].count += 1;

        // Track recent costs (last month)
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        if (cost.periodStart >= lastMonth) {
          acc[category].recent += Number(cost.amount);
        }

        return acc;
      }, {} as Record<string, { total: number; count: number; recent: number }>);

      // Generate suggestions based on analysis
      for (const [category, data] of Object.entries(costsByCategory)) {
        const categoryData = data as { total: number; count: number; recent: number };
        const avgMonthlyCost = categoryData.total / 3; // 3 months average
        const recentMonthlyCost = categoryData.recent;

        // Suggestion 1: High recent costs
        if (recentMonthlyCost > avgMonthlyCost * 1.5) {
          suggestions.push({
            category,
            suggestion: `${category} costs have increased by ${((recentMonthlyCost / avgMonthlyCost - 1) * 100).toFixed(1)}% recently`,
            impact: 'high' as const,
            potentialSavings: recentMonthlyCost - avgMonthlyCost,
            implementation: 'Review recent usage patterns and optimize configuration',
            timeframe: '1-2 weeks'
          });
        }

        // Suggestion 2: Category-specific optimizations
        switch (category) {
          case 'OPENAI':
            if (avgMonthlyCost > 500) {
              suggestions.push({
                category,
                suggestion: 'Consider implementing request caching and prompt optimization',
                impact: 'medium' as const,
                potentialSavings: avgMonthlyCost * 0.2,
                implementation: 'Implement response caching and optimize prompt length',
                timeframe: '2-3 weeks'
              });
            }
            break;

          case 'AWS':
            if (avgMonthlyCost > 1000) {
              suggestions.push({
                category,
                suggestion: 'Review AWS resource utilization and consider reserved instances',
                impact: 'high' as const,
                potentialSavings: avgMonthlyCost * 0.3,
                implementation: 'Analyze resource usage and purchase reserved instances for predictable workloads',
                timeframe: '1 month'
              });
            }
            break;

          case 'STRIPE':
            if (avgMonthlyCost > 200) {
              suggestions.push({
                category,
                suggestion: 'Optimize payment processing fees through volume discounts',
                impact: 'low' as const,
                potentialSavings: avgMonthlyCost * 0.1,
                implementation: 'Contact Stripe for volume pricing options',
                timeframe: '2-4 weeks'
              });
            }
            break;
        }
      }

      // General suggestions if no specific patterns found
      if (suggestions.length === 0) {
        suggestions.push({
          category: 'General',
          suggestion: 'Your cost patterns look stable. Consider setting up budget alerts.',
          impact: 'low' as const,
          potentialSavings: 0,
          implementation: 'Set up automated budget monitoring and alerts',
          timeframe: '1 week'
        });
      }

    } catch (error) {
      logger.error('Error generating cost optimization suggestions:', error);
      // Fallback suggestions
      suggestions.push({
        category: 'General',
        suggestion: 'Unable to analyze current costs. Consider implementing cost tracking.',
        impact: 'medium' as const,
        potentialSavings: 0,
        implementation: 'Set up comprehensive cost tracking and monitoring',
        timeframe: '2-3 weeks'
      });
    }

    return suggestions;
  }

  /**
   * Calculate optimization score based on suggestions
   */
  private calculateOptimizationScore(suggestions: Array<{ impact: string; potentialSavings: number }>): number {
    if (suggestions.length === 0) return 100;

    const totalPotentialSavings = suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);
    const highImpactCount = suggestions.filter(s => s.impact === 'high').length;
    const mediumImpactCount = suggestions.filter(s => s.impact === 'medium').length;

    // Score calculation: higher potential savings and impact = lower optimization score
    let score = 100;
    score -= Math.min(30, totalPotentialSavings / 100); // Reduce by potential savings
    score -= highImpactCount * 10; // High impact suggestions reduce score more
    score -= mediumImpactCount * 5; // Medium impact suggestions

    return Math.max(0, Math.round(score));
  }

  /**
   * Format header names for better readability in exports
   */
  private formatHeaderName(header: string): string {
    return header
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/id/i, 'ID') // Replace 'id' with 'ID'
      .replace(/at$/i, 'Date') // Replace 'At' suffix with 'Date'
      .trim();
  }

  /**
   * Generate HTML content for PDF reports
   */
  private generatePDFHTML(report: unknown, data: ReportData[]): string {
    const headers = Object.keys(data[0]);

    // Calculate summary statistics if it's a revenue report
    let summaryHTML = '';
    if (report.type === 'revenue') {
      const totalRevenue = data.reduce((sum, row) => sum + (parseFloat(String(row.amount)) || 0), 0);
      const avgTransaction = totalRevenue / data.length;
      const totalTransactions = data.length;

      summaryHTML = `
        <div class="summary-section">
          <h3>Summary Statistics</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Total Revenue:</span>
              <span class="value">$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="summary-item">
              <span class="label">Total Transactions:</span>
              <span class="value">${totalTransactions}</span>
            </div>
            <div class="summary-item">
              <span class="label">Average Transaction:</span>
              <span class="value">$${avgTransaction.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      `;
    } else if (report.type === 'subscriptions') {
      const activeSubscriptions = data.filter(row => row.status === 'active').length;
      const canceledSubscriptions = data.filter(row => row.canceledAt).length;
      const totalRevenue = data.reduce((sum, row) => sum + (parseFloat(String(row.amount)) || 0), 0);

      summaryHTML = `
        <div class="summary-section">
          <h3>Summary Statistics</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Total Subscriptions:</span>
              <span class="value">${data.length}</span>
            </div>
            <div class="summary-item">
              <span class="label">Active Subscriptions:</span>
              <span class="value">${activeSubscriptions}</span>
            </div>
            <div class="summary-item">
              <span class="label">Canceled Subscriptions:</span>
              <span class="value">${canceledSubscriptions}</span>
            </div>
            <div class="summary-item">
              <span class="label">Total Subscription Revenue:</span>
              <span class="value">$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      `;
    }

    // Generate table rows
    const tableRows = data.map(row => {
      const cells = headers.map(header => {
        let value = row[header];

        // Format different data types
        if (header.includes('amount') || header.includes('revenue') || header.includes('cost')) {
          value = typeof value === 'number' ?
            `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` :
            `$${parseFloat(value || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        } else if (header.includes('date') || header.includes('At')) {
          value = value ? format(new Date(value), 'MM/dd/yyyy HH:mm') : '';
        } else if (typeof value === 'boolean') {
          value = value ? 'Yes' : 'No';
        } else if (value === null || value === undefined) {
          value = '';
        }

        return `<td>${value}</td>`;
      }).join('');

      return `<tr>${cells}</tr>`;
    }).join('');

    // Generate table headers
    const tableHeaders = headers.map(header =>
      `<th>${this.formatHeaderName(header)}</th>`
    ).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${report.name} - Financial Report</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #366EF7;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #366EF7;
              margin: 0 0 10px 0;
              font-size: 28px;
              font-weight: 600;
            }
            .header .subtitle {
              color: #666;
              font-size: 14px;
              margin: 0;
            }
            .summary-section {
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 30px;
              border: 1px solid #e9ecef;
            }
            .summary-section h3 {
              margin: 0 0 15px 0;
              color: #366EF7;
              font-size: 18px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
            }
            .summary-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: white;
              padding: 12px;
              border-radius: 6px;
              border: 1px solid #dee2e6;
            }
            .summary-item .label {
              font-weight: 500;
              color: #495057;
            }
            .summary-item .value {
              font-weight: 700;
              color: #366EF7;
              font-size: 16px;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .data-table th {
              background-color: #366EF7;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-weight: 600;
              font-size: 14px;
              border-bottom: 2px solid #2958d9;
            }
            .data-table td {
              padding: 10px 8px;
              border-bottom: 1px solid #e9ecef;
              font-size: 13px;
            }
            .data-table tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .data-table tr:hover {
              background-color: #e3f2fd;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #e9ecef;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${report.name} - Financial Report</h1>
            <p class="subtitle">Generated on ${format(new Date(), 'PPP pp')}</p>
            <p class="subtitle">Report Period: ${report.parameters?.startDate ? format(new Date(report.parameters.startDate), 'PP') : 'N/A'} to ${report.parameters?.endDate ? format(new Date(report.parameters.endDate), 'PP') : 'N/A'}</p>
          </div>

          ${summaryHTML}

          <div class="table-section">
            <h3>Detailed Data</h3>
            <table class="data-table">
              <thead>
                <tr>${tableHeaders}</tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>This report was automatically generated by UpCoach Financial Dashboard</p>
            <p>© ${new Date().getFullYear()} UpCoach. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Validate export parameters
   */
  private validateExportParams(params: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params) {
      errors.push('Parameters are required');
      return { isValid: false, errors };
    }

    // Check date parameters
    if (params.startDate && !this.isValidDate(params.startDate)) {
      errors.push('Invalid start date format');
    }

    if (params.endDate && !this.isValidDate(params.endDate)) {
      errors.push('Invalid end date format');
    }

    if (params.startDate && params.endDate) {
      const start = new Date(params.startDate);
      const end = new Date(params.endDate);

      if (start > end) {
        errors.push('Start date cannot be after end date');
      }

      // Check if date range is reasonable (not more than 2 years)
      const diffInMs = end.getTime() - start.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      if (diffInDays > 730) { // 2 years
        errors.push('Date range cannot exceed 2 years');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a date string is valid
   */
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Get file size limit based on format
   */
  private getFileSizeLimit(format: string): number {
    switch (format) {
      case 'pdf':
        return 50 * 1024 * 1024; // 50MB for PDF
      case 'excel':
        return 100 * 1024 * 1024; // 100MB for Excel
      case 'csv':
        return 10 * 1024 * 1024; // 10MB for CSV
      default:
        return 50 * 1024 * 1024;
    }
  }

  /**
   * Check if data size is within limits
   */
  private validateDataSize(data: ReportData[], format: string): boolean {
    const estimatedSize = this.estimateFileSize(data, format);
    const limit = this.getFileSizeLimit(format);

    return estimatedSize <= limit;
  }

  /**
   * Estimate file size based on data and format
   */
  private estimateFileSize(data: ReportData[], format: string): number {
    if (!data || data.length === 0) return 0;

    const avgRowSize = this.calculateAverageRowSize(data[0]);
    const headerSize = Object.keys(data[0]).length * 20; // Approximate header size

    switch (format) {
      case 'pdf':
        // PDF has more overhead due to formatting, fonts, etc.
        return (data.length * avgRowSize * 1.5) + (headerSize * 2) + 50000; // Base PDF overhead
      case 'excel':
        // Excel has moderate overhead
        return (data.length * avgRowSize * 1.2) + headerSize + 10000; // Base Excel overhead
      case 'csv':
        // CSV is the most compact
        return (data.length * avgRowSize) + headerSize;
      default:
        return (data.length * avgRowSize) + headerSize;
    }
  }

  /**
   * Calculate average row size in bytes
   */
  private calculateAverageRowSize(sampleRow: ReportData): number {
    let totalSize = 0;

    for (const [key, value] of Object.entries(sampleRow)) {
      // Estimate field size
      const keySize = key.length;
      const valueSize = value ? value.toString().length : 0;
      totalSize += keySize + valueSize + 4; // +4 for separators/formatting
    }

    return totalSize;
  }

  /**
   * Sanitize filename to prevent path traversal and other security issues
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .substring(0, 255); // Limit length
  }

  /**
   * Check if user has permission to access report
   */
  private canUserAccessReport(userId: string, userRole: string, report: unknown): boolean {
    // Basic validation
    if (!userId || !userRole) {
      logger.warn('Authorization failed: Missing user ID or role', { userId, userRole });
      return false;
    }

    // Admin users can access all reports
    if (userRole === 'admin' || userRole === 'super_admin') {
      return true;
    }

    // Financial analysts can access financial reports
    if (userRole === 'financial_analyst' && this.isFinancialReport(report.type)) {
      return true;
    }

    // Managers can access reports for their organization
    if (userRole === 'manager' && this.canManagerAccessReport(userId, report)) {
      return true;
    }

    // Regular users can only access their own reports (if report has user-specific data)
    if (userRole === 'user' && this.isUserOwnReport(userId, report)) {
      return true;
    }

    // Default deny
    logger.warn('Authorization failed: Insufficient permissions', {
      userId,
      userRole,
      reportType: report.type,
      reportId: report.id
    });

    return false;
  }

  /**
   * Check if report type is considered financial
   */
  private isFinancialReport(reportType: string): boolean {
    const financialReportTypes = [
      'revenue',
      'subscriptions',
      'costs',
      'profit_loss',
      'churn_analysis',
      'cohort_analysis',
      'financial_summary'
    ];

    return financialReportTypes.includes(reportType.toLowerCase());
  }

  /**
   * Check if manager can access specific report based on organization
   */
  private canManagerAccessReport(userId: string, report: unknown): boolean {
    // In a real implementation, this would check:
    // - User's organization/team membership
    // - Report's organization scope
    // - Manager's access level within organization

    // For now, allow managers to access general financial reports
    // but restrict access to user-specific or sensitive reports
    const restrictedTypes = ['user_activity', 'personal_data', 'payment_details'];

    if (restrictedTypes.includes(report.type?.toLowerCase())) {
      return false;
    }

    return this.isFinancialReport(report.type);
  }

  /**
   * Check if report belongs to the requesting user
   */
  private isUserOwnReport(userId: string, report: unknown): boolean {
    // Check if report has user-specific data and belongs to requesting user
    if (report.parameters?.userId) {
      return report.parameters.userId === userId;
    }

    // Check if report metadata indicates user ownership
    if (report.metadata?.createdBy) {
      return report.metadata.createdBy === userId;
    }

    // For general reports, users cannot access them
    return false;
  }

  /**
   * Check if user has permission to send reports via email
   */
  private canUserSendReports(userRole: string): boolean {
    // Only admin, financial_analyst, and manager roles can send reports
    const allowedRoles = ['admin', 'super_admin', 'financial_analyst', 'manager'];
    return allowedRoles.includes(userRole);
  }

  /**
   * Check if user can access specific dashboard metrics
   */
  private canUserAccessMetrics(userRole: string, metricType: string): boolean {
    // Define role-based access to different metric types
    const rolePermissions: Record<string, string[]> = {
      'admin': ['*'], // All metrics
      'super_admin': ['*'], // All metrics
      'financial_analyst': ['revenue', 'subscriptions', 'costs', 'mrr', 'arr', 'churn', 'ltv'],
      'manager': ['revenue', 'subscriptions', 'mrr', 'dashboard'],
      'user': ['dashboard'] // Only basic dashboard metrics
    };

    const allowedMetrics = rolePermissions[userRole] || [];

    // Check for wildcard permission
    if (allowedMetrics.includes('*')) {
      return true;
    }

    return allowedMetrics.includes(metricType);
  }

  /**
   * Log security event for audit purposes
   */
  private logSecurityEvent(req: Request, event: string, details: Record<string, any> = {}): void {
    logger.warn(`Security Event: ${event}`, {
      event,
      userId: req.user?.id,
      userRole: req.user?.role,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      url: req.originalUrl,
      method: req.method,
      ...details
    });
  }
}
