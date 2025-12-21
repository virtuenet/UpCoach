/**
 * Revenue Analytics Service
 * Financial analytics, forecasting, and subscription metrics
 */

import { AnalyticsPeriod, TrendDataPoint } from './CoachAnalyticsService';

/**
 * Revenue metrics
 */
export interface RevenueMetrics {
  coachId: string;
  period: AnalyticsPeriod;
  periodStart: Date;
  periodEnd: Date;

  // Revenue totals
  totalRevenue: number;
  netRevenue: number;
  platformFees: number;
  refunds: number;

  // Revenue breakdown
  sessionRevenue: number;
  packageRevenue: number;
  subscriptionRevenue: number;
  groupSessionRevenue: number;
  otherRevenue: number;

  // Comparison
  previousPeriodRevenue: number;
  revenueGrowth: number;
  revenueGrowthPercentage: number;

  // Averages
  averageSessionPrice: number;
  averagePackagePrice: number;
  revenuePerClient: number;
  revenuePerSession: number;

  // Projections
  projectedMonthlyRevenue: number;
  projectedAnnualRevenue: number;
}

/**
 * Subscription metrics
 */
export interface SubscriptionMetrics {
  totalSubscribers: number;
  activeSubscribers: number;
  newSubscribers: number;
  churnedSubscribers: number;
  churnRate: number;

  // MRR metrics
  mrr: number;
  mrrGrowth: number;
  mrrGrowthPercentage: number;

  // ARR metrics
  arr: number;
  arrGrowth: number;

  // Subscription breakdown by tier
  byTier: Array<{
    tier: string;
    subscribers: number;
    revenue: number;
    percentage: number;
  }>;

  // Lifecycle metrics
  averageSubscriptionLength: number;
  lifetimeValue: number;
  customerAcquisitionCost: number;
  ltvCacRatio: number;
}

/**
 * Transaction record
 */
export interface Transaction {
  id: string;
  date: Date;
  type: 'session' | 'package' | 'subscription' | 'refund' | 'payout';
  amount: number;
  clientId?: string;
  clientName?: string;
  description: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod?: string;
}

/**
 * Payout record
 */
export interface Payout {
  id: string;
  date: Date;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bankAccount: string;
  periodStart: Date;
  periodEnd: Date;
  sessionsCount: number;
  packagesCount: number;
  subscriptionsCount: number;
}

/**
 * Revenue forecast
 */
export interface RevenueForecast {
  period: string;
  projectedRevenue: number;
  confidenceInterval: {
    low: number;
    high: number;
  };
  factors: Array<{
    factor: string;
    impact: number;
    direction: 'positive' | 'negative' | 'neutral';
  }>;
}

/**
 * Revenue Analytics Service
 */
export class RevenueAnalyticsService {
  /**
   * Get revenue metrics for a coach
   */
  async getRevenueMetrics(
    coachId: string,
    period: AnalyticsPeriod = 'month'
  ): Promise<RevenueMetrics> {
    const { startDate, endDate } = this.getPeriodDates(period);
    const previousPeriod = this.getPreviousPeriodDates(period);

    // Mock implementation - would query actual transaction data
    const currentRevenue = await this.calculatePeriodRevenue(coachId, startDate, endDate);
    const previousRevenue = await this.calculatePeriodRevenue(
      coachId,
      previousPeriod.startDate,
      previousPeriod.endDate
    );

    const revenueGrowth = currentRevenue.total - previousRevenue.total;
    const revenueGrowthPercentage = previousRevenue.total > 0
      ? (revenueGrowth / previousRevenue.total) * 100
      : 0;

    return {
      coachId,
      period,
      periodStart: startDate,
      periodEnd: endDate,

      totalRevenue: currentRevenue.total,
      netRevenue: currentRevenue.total - currentRevenue.fees - currentRevenue.refunds,
      platformFees: currentRevenue.fees,
      refunds: currentRevenue.refunds,

      sessionRevenue: currentRevenue.sessions,
      packageRevenue: currentRevenue.packages,
      subscriptionRevenue: currentRevenue.subscriptions,
      groupSessionRevenue: currentRevenue.groupSessions,
      otherRevenue: currentRevenue.other,

      previousPeriodRevenue: previousRevenue.total,
      revenueGrowth,
      revenueGrowthPercentage,

      averageSessionPrice: 75,
      averagePackagePrice: 450,
      revenuePerClient: currentRevenue.total / 28, // Mock client count
      revenuePerSession: currentRevenue.sessions / 42, // Mock session count

      projectedMonthlyRevenue: this.projectMonthlyRevenue(currentRevenue.total, period),
      projectedAnnualRevenue: this.projectAnnualRevenue(currentRevenue.total, period),
    };
  }

  /**
   * Get subscription metrics
   */
  async getSubscriptionMetrics(
    coachId: string,
    period: AnalyticsPeriod = 'month'
  ): Promise<SubscriptionMetrics> {
    // Mock implementation
    return {
      totalSubscribers: 45,
      activeSubscribers: 38,
      newSubscribers: 8,
      churnedSubscribers: 3,
      churnRate: 7.9,

      mrr: 4250,
      mrrGrowth: 350,
      mrrGrowthPercentage: 8.9,

      arr: 51000,
      arrGrowth: 4200,

      byTier: [
        { tier: 'Basic', subscribers: 15, revenue: 750, percentage: 17.6 },
        { tier: 'Pro', subscribers: 18, revenue: 1800, percentage: 42.4 },
        { tier: 'Premium', subscribers: 5, revenue: 1700, percentage: 40.0 },
      ],

      averageSubscriptionLength: 8.5, // months
      lifetimeValue: 952,
      customerAcquisitionCost: 85,
      ltvCacRatio: 11.2,
    };
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(
    coachId: string,
    period: AnalyticsPeriod = 'year',
    granularity: 'day' | 'week' | 'month' = 'month'
  ): Promise<TrendDataPoint[]> {
    const { startDate, endDate } = this.getPeriodDates(period);
    const points: TrendDataPoint[] = [];

    const intervals = this.getIntervalCount(period, granularity);
    const intervalDays = granularity === 'day' ? 1 : granularity === 'week' ? 7 : 30;

    for (let i = 0; i < intervals; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i * intervalDays);

      // Mock revenue with some variation and growth trend
      const baseRevenue = 3000 + i * 50; // Slight growth trend
      const variation = (Math.random() - 0.5) * 1000;
      const value = Math.max(0, baseRevenue + variation);

      points.push({ date, value });
    }

    return points;
  }

  /**
   * Get revenue by source
   */
  async getRevenueBySource(
    coachId: string,
    period: AnalyticsPeriod = 'month'
  ): Promise<Array<{ source: string; amount: number; percentage: number; trend: number }>> {
    // Mock implementation
    const sources = [
      { source: 'One-on-One Sessions', amount: 2800, percentage: 45.2, trend: 5.2 },
      { source: 'Coaching Packages', amount: 1500, percentage: 24.2, trend: 12.5 },
      { source: 'Subscriptions', amount: 1200, percentage: 19.4, trend: 8.3 },
      { source: 'Group Sessions', amount: 450, percentage: 7.3, trend: -2.1 },
      { source: 'Other', amount: 250, percentage: 4.0, trend: 0 },
    ];

    return sources;
  }

  /**
   * Get transactions list
   */
  async getTransactions(
    coachId: string,
    options: {
      limit?: number;
      offset?: number;
      type?: Transaction['type'];
      status?: Transaction['status'];
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const { limit = 50, offset = 0 } = options;

    // Mock transactions
    const transactions: Transaction[] = Array.from({ length: 100 }, (_, i) => ({
      id: `txn-${i + 1}`,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      type: ['session', 'package', 'subscription', 'refund'][Math.floor(Math.random() * 4)] as Transaction['type'],
      amount: Math.floor(Math.random() * 200) + 50,
      clientId: `client-${Math.floor(Math.random() * 28) + 1}`,
      clientName: `Client ${Math.floor(Math.random() * 28) + 1}`,
      description: 'Coaching session',
      status: 'completed',
      paymentMethod: 'card',
    }));

    return {
      transactions: transactions.slice(offset, offset + limit),
      total: transactions.length,
    };
  }

  /**
   * Get payout history
   */
  async getPayouts(
    coachId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ payouts: Payout[]; total: number }> {
    const { limit = 20, offset = 0 } = options;

    // Mock payouts
    const payouts: Payout[] = Array.from({ length: 24 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      return {
        id: `payout-${i + 1}`,
        date,
        amount: 2500 + Math.floor(Math.random() * 1500),
        status: i === 0 ? 'pending' : 'completed',
        bankAccount: '****4567',
        periodStart: new Date(date.getFullYear(), date.getMonth(), 1),
        periodEnd: new Date(date.getFullYear(), date.getMonth() + 1, 0),
        sessionsCount: 15 + Math.floor(Math.random() * 10),
        packagesCount: Math.floor(Math.random() * 5),
        subscriptionsCount: 8 + Math.floor(Math.random() * 5),
      };
    });

    return {
      payouts: payouts.slice(offset, offset + limit),
      total: payouts.length,
    };
  }

  /**
   * Get revenue forecast
   */
  async getRevenueForecast(
    coachId: string,
    months: number = 6
  ): Promise<RevenueForecast[]> {
    const forecasts: RevenueForecast[] = [];
    const baseRevenue = 4500; // Current monthly average

    for (let i = 1; i <= months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);

      // Simple linear growth model with seasonality
      const growthFactor = 1 + (0.05 * i); // 5% monthly growth
      const seasonalFactor = 1 + Math.sin((date.getMonth() / 12) * Math.PI * 2) * 0.1;
      const projected = baseRevenue * growthFactor * seasonalFactor;

      forecasts.push({
        period: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        projectedRevenue: Math.round(projected),
        confidenceInterval: {
          low: Math.round(projected * 0.85),
          high: Math.round(projected * 1.15),
        },
        factors: [
          {
            factor: 'Historical growth trend',
            impact: projected * 0.03,
            direction: 'positive',
          },
          {
            factor: 'Seasonal adjustment',
            impact: Math.abs(projected * (seasonalFactor - 1)),
            direction: seasonalFactor >= 1 ? 'positive' : 'negative',
          },
          {
            factor: 'New client acquisition',
            impact: projected * 0.02,
            direction: 'positive',
          },
        ],
      });
    }

    return forecasts;
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary(coachId: string): Promise<{
    currentMonth: RevenueMetrics;
    subscriptions: SubscriptionMetrics;
    forecast: RevenueForecast[];
    recentTransactions: Transaction[];
    pendingPayout: Payout | null;
  }> {
    const [currentMonth, subscriptions, forecast, transactionsResult, payoutsResult] =
      await Promise.all([
        this.getRevenueMetrics(coachId, 'month'),
        this.getSubscriptionMetrics(coachId, 'month'),
        this.getRevenueForecast(coachId, 3),
        this.getTransactions(coachId, { limit: 10 }),
        this.getPayouts(coachId, { limit: 1 }),
      ]);

    return {
      currentMonth,
      subscriptions,
      forecast,
      recentTransactions: transactionsResult.transactions,
      pendingPayout: payoutsResult.payouts.find(p => p.status === 'pending') || null,
    };
  }

  // Private helper methods

  private getPeriodDates(period: AnalyticsPeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate.setFullYear(2020, 0, 1);
        break;
    }

    return { startDate, endDate };
  }

  private getPreviousPeriodDates(period: AnalyticsPeriod): { startDate: Date; endDate: Date } {
    const { startDate: currentStart, endDate: currentEnd } = this.getPeriodDates(period);
    const duration = currentEnd.getTime() - currentStart.getTime();

    return {
      startDate: new Date(currentStart.getTime() - duration),
      endDate: new Date(currentStart.getTime() - 1),
    };
  }

  private async calculatePeriodRevenue(
    coachId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    sessions: number;
    packages: number;
    subscriptions: number;
    groupSessions: number;
    other: number;
    fees: number;
    refunds: number;
  }> {
    // Mock implementation
    const sessions = 2800 + Math.floor(Math.random() * 500);
    const packages = 1500 + Math.floor(Math.random() * 300);
    const subscriptions = 1200 + Math.floor(Math.random() * 200);
    const groupSessions = 450 + Math.floor(Math.random() * 100);
    const other = 250 + Math.floor(Math.random() * 50);
    const total = sessions + packages + subscriptions + groupSessions + other;

    return {
      total,
      sessions,
      packages,
      subscriptions,
      groupSessions,
      other,
      fees: Math.round(total * 0.15), // 15% platform fee
      refunds: Math.floor(Math.random() * 100),
    };
  }

  private projectMonthlyRevenue(currentRevenue: number, period: AnalyticsPeriod): number {
    const multiplier = {
      day: 30,
      week: 4.33,
      month: 1,
      quarter: 0.33,
      year: 0.083,
      all: 0.083,
    };

    return Math.round(currentRevenue * (multiplier[period] || 1));
  }

  private projectAnnualRevenue(currentRevenue: number, period: AnalyticsPeriod): number {
    return this.projectMonthlyRevenue(currentRevenue, period) * 12;
  }

  private getIntervalCount(period: AnalyticsPeriod, granularity: 'day' | 'week' | 'month'): number {
    const periodDays = {
      day: 1,
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
      all: 730,
    };

    const granularityDays = {
      day: 1,
      week: 7,
      month: 30,
    };

    return Math.ceil(periodDays[period] / granularityDays[granularity]);
  }
}

/**
 * Create revenue analytics service instance
 */
export function createRevenueAnalyticsService(): RevenueAnalyticsService {
  return new RevenueAnalyticsService();
}

export default RevenueAnalyticsService;
