import { Request, Response } from 'express';
import { financialService } from '../../services/financial/FinancialService';
import { 
  Transaction,
  Subscription,
  CostTracking,
  FinancialSnapshot,
  FinancialReport,
  
  BillingEvent,
} from '../../models';
import { Op } from 'sequelize';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ApiError } from '../../utils/apiError';
import { reportingService } from '../../services/financial/ReportingService';
import emailService from '../../services/email/UnifiedEmailService';
import { SchedulerService } from '../../services/SchedulerService';

export class FinancialDashboardController {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(_req: Request, res: Response): Promise<void> {
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
  async getSubscriptionMetrics(_req: Request, res: Response): Promise<void> {
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

      const totalCosts = costs.reduce((sum, cost) => sum + parseFloat(cost.getDataValue('total')), 0);

      res.json({
        total: totalCosts,
        byCategory: costs.reduce((acc, cost) => {
          acc[cost.category] = parseFloat(cost.getDataValue('total'));
          return acc;
        }, {} as Record<string, number>),
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
      const { period = 'monthly' } = req.params;
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
  async getMRRMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const currentMRR = await financialService.calculateMRR();
      const lastMonthMRR = await financialService.calculateMRR(endOfMonth(subMonths(new Date(), 1)));
      
      const growth = lastMonthMRR > 0 
        ? ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100 
        : 0;

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
  async getARRMetrics(_req: Request, res: Response): Promise<void> {
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
  async getRevenueByCountry(_req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement revenue by country logic
      res.json([]);
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
      // TODO: Implement revenue forecasting logic
      res.json({
        forecast: [],
        accuracy: 0,
        confidence: 0,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
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
  async getActiveSubscriptions(_req: Request, res: Response): Promise<void> {
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
  async getLTVAnalytics(_req: Request, res: Response): Promise<void> {
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
  async getCostOptimizationSuggestions(_req: Request, res: Response): Promise<void> {
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
      const snapshot = await financialService.generateDailySnapshot(date ? new Date(date) : new Date());
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
        where: { period },
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
      const report = await FinancialReport.findByPk(id);
      
      if (!report) {
        throw new ApiError(404, 'Report not found');
      }

      // TODO: Implement report download logic
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      res.status((error as any).statusCode || 500).json({ error: (error as Error).message });
    }
  }

  /**
   * Send report
   */
  async sendReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { recipients } = req.body;
      
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
      
      // TODO: Implement cohort analysis logic
      res.json({
        cohorts: [],
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
  async getUnitEconomics(_req: Request, res: Response): Promise<void> {
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
      const start = startDate ? new Date(startDate as string) : startOfMonth(subMonths(new Date(), 3));
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
  async getLTVtoCACRatio(_req: Request, res: Response): Promise<void> {
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
  async getAutomationStatus(_req: Request, res: Response): Promise<void> {
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
        message: `${type} automation triggered successfully` 
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
        text: 'This is a test email to verify email service is working correctly.'
      });
      
      res.json({ 
        success: true, 
        message: `Test email sent to ${email}` 
      });
    } catch (error) {
      res.status((error as any).statusCode || 500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get scheduled jobs
   */
  async getScheduledJobs(_req: Request, res: Response): Promise<void> {
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
        message: `Job ${name} start requested` 
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
        message: stopped ? `Job ${name} stopped` : `Job ${name} not found` 
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
} 