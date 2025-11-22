import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { Op, QueryTypes } from 'sequelize';

import { sequelize ,
  Transaction,
  Subscription,
  CostTracking,
  FinancialSnapshot,
  SubscriptionStatus,
  TransactionStatus,
  SnapshotPeriod,
} from '../../models';

export class FinancialService {
  /**
   * Calculate Monthly Recurring Revenue (MRR)
   */
  async calculateMRR(date: Date = new Date()): Promise<number> {
    const activeSubscriptions = await Subscription.findAll({
      where: {
        status: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
        currentPeriodEnd: { [Op.gte]: date },
      },
    });

    return activeSubscriptions.reduce((total, sub) => {
      return total + sub.monthlyAmount;
    }, 0);
  }

  /**
   * Calculate Annual Recurring Revenue (ARR)
   */
  async calculateARR(date: Date = new Date()): Promise<number> {
    const mrr = await this.calculateMRR(date);
    return mrr * 12;
  }

  /**
   * Calculate churn rate for a given period
   */
  async calculateChurnRate(startDate: Date, endDate: Date): Promise<number> {
    // Count subscriptions that were active at start of period
    const [startCountResult] = (await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM subscriptions 
       WHERE created_at <= :startDate 
       AND (canceled_at > :startDate OR canceled_at IS NULL)`,
      {
        replacements: { startDate },
        type: QueryTypes.SELECT,
      }
    )) as unknown;

    // Count subscriptions that churned during the period
    const [churnedCountResult] = (await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM subscriptions 
       WHERE canceled_at BETWEEN :startDate AND :endDate`,
      {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      }
    )) as unknown;

    const startCount = parseInt(startCountResult.count);
    const churnedCount = parseInt(churnedCountResult.count);

    return startCount > 0 ? (churnedCount / startCount) * 100 : 0;
  }

  /**
   * Get revenue breakdown by plan
   */
  async getRevenueByPlan(startDate: Date, endDate: Date): Promise<unknown> {
    const result = await sequelize.query(
      `SELECT 
        s.plan,
        COUNT(DISTINCT s.id) as subscription_count,
        SUM(CASE 
          WHEN s.billing_interval = 'monthly' THEN s.amount
          WHEN s.billing_interval = 'quarterly' THEN s.amount / 3
          WHEN s.billing_interval = 'yearly' THEN s.amount / 12
        END) as mrr
      FROM subscriptions s
      WHERE s.status IN ('active', 'trialing')
        AND s.current_period_end >= :endDate
      GROUP BY s.plan`,
      {
        replacements: { endDate },
        type: QueryTypes.SELECT,
      }
    );

    return result;
  }

  /**
   * Calculate Customer Lifetime Value (LTV)
   */
  async calculateLTV(cohortMonth?: string): Promise<number> {
    const avgRevenuePerUser = await this.calculateARPU();
    const avgLifetimeMonths = 24; // Default estimate, should be calculated from historical data

    return avgRevenuePerUser * avgLifetimeMonths;
  }

  /**
   * Calculate Average Revenue Per User (ARPU)
   */
  async calculateARPU(): Promise<number> {
    const mrr = await this.calculateMRR();
    const activeUsers = await Subscription.count({
      where: {
        status: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
      },
    });

    return activeUsers > 0 ? mrr / activeUsers : 0;
  }

  /**
   * Calculate Customer Acquisition Cost (CAC)
   */
  async calculateCAC(startDate: Date, endDate: Date): Promise<number> {
    const marketingCosts = await CostTracking.sum('amount', {
      where: {
        category: 'marketing',
        periodStart: { [Op.gte]: startDate },
        periodEnd: { [Op.lte]: endDate },
      },
    });

    const newCustomers = await Subscription.count({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    return newCustomers > 0 ? (marketingCosts || 0) / newCustomers : 0;
  }

  /**
   * Get financial metrics dashboard data
   */
  async getDashboardMetrics(): Promise<unknown> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Current metrics
    const currentMRR = await this.calculateMRR();
    const lastMonthMRR = await this.calculateMRR(lastMonthEnd);
    const mrrGrowth = lastMonthMRR > 0 ? ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100 : 0;

    // Revenue metrics
    const revenue = await Transaction.sum('amount', {
      where: {
        status: TransactionStatus.COMPLETED,
        createdAt: { [Op.gte]: monthStart },
      },
    });

    // Cost metrics
    const totalCosts = await CostTracking.sum('amount', {
      where: {
        periodStart: { [Op.gte]: monthStart },
      },
    });

    // Subscription metrics
    const activeSubscriptions = await Subscription.count({
      where: {
        status: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
      },
    });

    const newSubscriptions = await Subscription.count({
      where: {
        createdAt: { [Op.gte]: monthStart },
      },
    });

    const churnedSubscriptions = await Subscription.count({
      where: {
        canceledAt: { [Op.gte]: monthStart },
      },
    });

    const churnRate = await this.calculateChurnRate(lastMonthStart, now);
    const ltv = await this.calculateLTV();
    const cac = await this.calculateCAC(lastMonthStart, now);
    const arpu = await this.calculateARPU();

    return {
      revenue: {
        mrr: currentMRR,
        mrrGrowth,
        arr: currentMRR * 12,
        totalRevenue: revenue || 0,
      },
      subscriptions: {
        active: activeSubscriptions,
        new: newSubscriptions,
        churned: churnedSubscriptions,
        churnRate,
        netNew: newSubscriptions - churnedSubscriptions,
      },
      unitEconomics: {
        ltv,
        cac,
        ltvToCacRatio: cac > 0 ? ltv / cac : 0,
        arpu,
      },
      costs: {
        total: totalCosts || 0,
        burnRate: totalCosts || 0, // Monthly burn rate
        runway: 0, // Calculate based on cash balance
      },
      profitLoss: {
        revenue: revenue || 0,
        costs: totalCosts || 0,
        grossProfit: (revenue || 0) - (totalCosts || 0),
        margin: revenue > 0 ? ((revenue - totalCosts) / revenue) * 100 : 0,
      },
    };
  }

  /**
   * Generate daily financial snapshot
   */
  async generateDailySnapshot(date: Date = new Date()): Promise<FinancialSnapshot> {
    const metrics = await this.getDashboardMetrics();

    // Get detailed cost breakdown
    const costsByCategory = await sequelize.query(
      `SELECT 
        category,
        SUM(amount) as total
      FROM cost_tracking
      WHERE period_start >= :monthStart
      GROUP BY category`,
      {
        replacements: { monthStart: startOfMonth(date) },
        type: QueryTypes.SELECT,
      }
    );

    const costBreakdown = costsByCategory.reduce((acc: unknown, row: unknown) => {
      acc[row.category] = parseFloat(row.total);
      return acc;
    }, {});

    // Create snapshot
    const snapshot = await FinancialSnapshot.create({
      date,
      period: SnapshotPeriod.DAILY,

      // Revenue metrics
      revenue: metrics.revenue.totalRevenue,
      recurringRevenue: metrics.revenue.mrr,
      mrr: metrics.revenue.mrr,
      arr: metrics.revenue.arr,

      // Cost metrics
      totalCosts: metrics.costs.total,
      infrastructureCosts: costBreakdown.infrastructure || 0,
      apiCosts: costBreakdown.api_services || 0,
      personnelCosts: costBreakdown.personnel || 0,
      marketingCosts: costBreakdown.marketing || 0,
      operationalCosts: costBreakdown.operations || 0,

      // Profit metrics
      grossProfit: metrics.profitLoss.grossProfit,
      netProfit: metrics.profitLoss.grossProfit, // Simplified for now
      grossMargin: metrics.profitLoss.margin,
      netMargin: metrics.profitLoss.margin,

      // Customer metrics
      activeCustomers: metrics.subscriptions.active,
      newCustomers: metrics.subscriptions.new,
      churnedCustomers: metrics.subscriptions.churned,
      churnRate: metrics.subscriptions.churnRate,
      avgRevenuePerUser: metrics.unitEconomics.arpu,
      customerAcquisitionCost: metrics.unitEconomics.cac,
      customerLifetimeValue: metrics.unitEconomics.ltv,

      // Unit economics
      ltvToCacRatio: metrics.unitEconomics.ltvToCacRatio,
    });

    return snapshot;
  }

  /**
   * Get P&L statement for a period
   */
  async getProfitLossStatement(startDate: Date, endDate: Date): Promise<unknown> {
    // Revenue
    const revenue = await Transaction.sum('amount', {
      where: {
        status: TransactionStatus.COMPLETED,
        createdAt: { [Op.between]: [startDate, endDate] },
      },
    });

    const refunds = await Transaction.sum('amount', {
      where: {
        status: TransactionStatus.REFUNDED,
        createdAt: { [Op.between]: [startDate, endDate] },
      },
    });

    // Costs by category
    const costs = await sequelize.query(
      `SELECT 
        category,
        SUM(amount) as total
      FROM cost_tracking
      WHERE period_start >= :startDate
        AND period_end <= :endDate
      GROUP BY category`,
      {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      }
    );

    const costsByCategory = costs.reduce((acc: unknown, row: unknown) => {
      acc[row.category] = parseFloat(row.total);
      return acc;
    }, {});

    const totalCosts = Object.values(costsByCategory).reduce(
      (sum: number, cost: unknown) => sum + (cost as number),
      0
    );
    const netRevenue = (revenue || 0) - (refunds || 0);
    const grossProfit = netRevenue - (costsByCategory.api_services || 0);
    const operatingExpenses = (totalCosts as number) - (costsByCategory.api_services || 0);
    const netProfit = grossProfit - operatingExpenses;

    return {
      revenue: {
        gross: revenue || 0,
        refunds: refunds || 0,
        net: netRevenue,
      },
      costs: {
        directCosts: costsByCategory.api_services || 0,
        operatingExpenses,
        byCategory: costsByCategory,
        total: totalCosts,
      },
      profit: {
        gross: grossProfit,
        grossMargin: netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0,
        operating: netProfit,
        operatingMargin: netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0,
        net: netProfit,
        netMargin: netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0,
      },
    };
  }

  /**
   * Get costs grouped by category
   */
  async getCostsByCategory(startDate: Date, endDate: Date) {
    const costs = await sequelize.query(
      `SELECT 
        category,
        SUM(amount) as total,
        COUNT(*) as count,
        AVG(amount) as average
      FROM cost_tracking
      WHERE period_start >= :startDate
        AND period_end <= :endDate
      GROUP BY category
      ORDER BY total DESC`,
      {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      }
    );

    return costs.map((row: unknown) => ({
      category: row.category,
      total: parseFloat(row.total),
      count: parseInt(row.count),
      average: parseFloat(row.average),
      percentage: 0, // Will be calculated in the controller
    }));
  }

  /**
   * Get detailed cost breakdown
   */
  async getCostBreakdown(startDate: Date, endDate: Date) {
    const breakdown = await CostTracking.findAll({
      where: {
        periodStart: { [Op.gte]: startDate },
        periodEnd: { [Op.lte]: endDate },
      },
      attributes: [
        'category',
        'vendor',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'average'],
      ],
      group: ['category', 'vendor'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']],
    });

    // Get total for percentage calculation
    const totalCosts = await CostTracking.sum('amount', {
      where: {
        periodStart: { [Op.gte]: startDate },
        periodEnd: { [Op.lte]: endDate },
      },
    });

    return breakdown.map((item: unknown) => ({
      category: item.category,
      vendor: item.vendor,
      total: parseFloat(item.get('total')),
      count: parseInt(item.get('count')),
      average: parseFloat(item.get('average')),
      percentage: totalCosts > 0 ? (parseFloat(item.get('total')) / totalCosts) * 100 : 0,
    }));
  }
}

export const financialService = new FinancialService();
