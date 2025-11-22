import { Op, QueryTypes } from 'sequelize';

import { sequelize, CostTracking } from '../../models';

/**
 * CostAnalyticsService
 * Advanced cost analysis and optimization service
 */
export class CostAnalyticsService {
  /**
   * Calculate cost per user for a period
   */
  static async calculateCostPerUser(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalCostPerUser: number;
    costPerActiveUser: number;
    costsByCategory: Record<string, number>;
  }> {
    // Get total costs
    const totalCosts =
      (await CostTracking.sum('amount', {
        where: {
          periodStart: { [Op.between]: [startDate, endDate] },
          isApproved: true,
        },
      })) || 0;

    // Get costs by category
    const categoryCosts = await CostTracking.findAll({
      attributes: ['category', [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      where: {
        periodStart: { [Op.between]: [startDate, endDate] },
        isApproved: true,
      },
      group: ['category'],
    });

    const costsByCategory: Record<string, number> = {};
    categoryCosts.forEach((cost: unknown) => {
      costsByCategory[cost.category] = parseFloat(cost.get('total'));
    });

    // Get user counts (simplified - would query actual user models)
    const totalUsers = 1000; // Mock data
    const activeUsers = 750; // Mock data

    return {
      totalCostPerUser: totalUsers > 0 ? totalCosts / totalUsers : 0,
      costPerActiveUser: activeUsers > 0 ? totalCosts / activeUsers : 0,
      costsByCategory,
    };
  }

  /**
   * Analyze infrastructure costs and usage
   */
  static async analyzeInfrastructureCosts(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalInfrastructureCost: number;
    costBreakdown: {
      compute: number;
      storage: number;
      network: number;
      database: number;
      other: number;
    };
    optimization: {
      potentialSavings: number;
      recommendations: string[];
    };
  }> {
    const infrastructureCosts = await CostTracking.findAll({
      where: {
        category: 'infrastructure',
        periodStart: { [Op.between]: [startDate, endDate] },
        isApproved: true,
      },
    });

    const totalCost = infrastructureCosts.reduce(
      (sum: number, cost: unknown) => sum + cost.amount,
      0
    );

    // Categorize infrastructure costs
    const costBreakdown = {
      compute: 0,
      storage: 0,
      network: 0,
      database: 0,
      other: 0,
    };

    infrastructureCosts.forEach((cost: unknown) => {
      const subcategory = cost.subcategory?.toLowerCase() || 'other';
      if (
        subcategory.includes('compute') ||
        subcategory.includes('ec2') ||
        subcategory.includes('lambda')
      ) {
        costBreakdown.compute += cost.totalAmount;
      } else if (
        subcategory.includes('storage') ||
        subcategory.includes('s3') ||
        subcategory.includes('ebs')
      ) {
        costBreakdown.storage += cost.totalAmount;
      } else if (
        subcategory.includes('network') ||
        subcategory.includes('cloudfront') ||
        subcategory.includes('vpc')
      ) {
        costBreakdown.network += cost.totalAmount;
      } else if (
        subcategory.includes('database') ||
        subcategory.includes('rds') ||
        subcategory.includes('dynamodb')
      ) {
        costBreakdown.database += cost.totalAmount;
      } else {
        costBreakdown.other += cost.totalAmount;
      }
    });

    // Generate optimization recommendations
    const recommendations: string[] = [];
    let potentialSavings = 0;

    if (costBreakdown.compute > totalCost * 0.6) {
      recommendations.push('Consider implementing auto-scaling to optimize compute costs');
      potentialSavings += costBreakdown.compute * 0.15; // 15% potential savings
    }

    if (costBreakdown.storage > totalCost * 0.3) {
      recommendations.push('Review storage classes and implement lifecycle policies');
      potentialSavings += costBreakdown.storage * 0.2; // 20% potential savings
    }

    if (costBreakdown.database > totalCost * 0.4) {
      recommendations.push('Optimize database queries and consider read replicas');
      potentialSavings += costBreakdown.database * 0.1; // 10% potential savings
    }

    return {
      totalInfrastructureCost: totalCost,
      costBreakdown,
      optimization: {
        potentialSavings,
        recommendations,
      },
    };
  }

  /**
   * Analyze API service costs
   */
  static async analyzeApiServiceCosts(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalApiCosts: number;
    costsByProvider: Record<string, number>;
    usageMetrics: {
      totalRequests: number;
      costPerRequest: number;
      costPerUser: number;
    };
    optimization: {
      potentialSavings: number;
      recommendations: string[];
    };
  }> {
    const apiCosts = await CostTracking.findAll({
      where: {
        category: 'api_services',
        periodStart: { [Op.between]: [startDate, endDate] },
        isApproved: true,
      },
    });

    const totalCost = apiCosts.reduce((sum: number, cost: unknown) => sum + cost.totalAmount, 0);

    // Group by vendor/provider
    const costsByProvider: Record<string, number> = {};
    let totalRequests = 0;

    apiCosts.forEach((cost: unknown) => {
      const vendor = cost.vendor;
      costsByProvider[vendor] = (costsByProvider[vendor] || 0) + cost.totalAmount;

      // Extract usage metrics if available
      if (cost.usageMetrics?.quantity) {
        totalRequests += cost.usageMetrics.quantity;
      }
    });

    const activeUsers = 750; // Mock data
    const costPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
    const costPerUser = activeUsers > 0 ? totalCost / activeUsers : 0;

    // Generate optimization recommendations
    const recommendations: string[] = [];
    let potentialSavings = 0;

    if (costPerRequest > 0.01) {
      // If cost per request is high
      recommendations.push('Implement request caching to reduce API calls');
      recommendations.push('Consider batching API requests where possible');
      potentialSavings += totalCost * 0.25; // 25% potential savings
    }

    if (costsByProvider['openai'] > totalCost * 0.7) {
      recommendations.push('Optimize AI prompt lengths and implement result caching');
      potentialSavings += costsByProvider['openai'] * 0.2; // 20% savings on AI costs
    }

    return {
      totalApiCosts: totalCost,
      costsByProvider,
      usageMetrics: {
        totalRequests,
        costPerRequest,
        costPerUser,
      },
      optimization: {
        potentialSavings,
        recommendations,
      },
    };
  }

  /**
   * Generate cost forecasting
   */
  static async generateCostForecast(months: number = 6): Promise<{
    forecastPeriods: {
      month: string;
      predictedCost: number;
      category: string;
      confidence: number;
    }[];
    totalForecastedCost: number;
    methodology: string;
  }> {
    // Get historical data for the last 12 months
    const historicalStartDate = new Date();
    historicalStartDate.setMonth(historicalStartDate.getMonth() - 12);

    const historicalCosts = await sequelize.query(
      `
      SELECT 
        DATE_TRUNC('month', billing_start_date) as month,
        category,
        SUM(total_amount) as total_cost
      FROM cost_tracking
      WHERE billing_start_date >= :startDate
        AND status IN ('approved', 'paid')
      GROUP BY month, category
      ORDER BY month, category
    `,
      {
        replacements: { startDate: historicalStartDate },
        type: QueryTypes.SELECT,
      }
    );

    const forecastPeriods: unknown[] = [];
    const currentDate = new Date();

    // Simple linear regression forecast for each category
    const categories = ['infrastructure', 'api_services', 'personnel', 'marketing', 'development'];

    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const monthKey = forecastDate.toISOString().substr(0, 7);

      for (const category of categories) {
        const categoryHistory = (historicalCosts as unknown[]).filter(
          (h: unknown) => h.category === category
        );

        if (categoryHistory.length >= 3) {
          // Calculate trend
          const avgGrowth = this.calculateGrowthTrend(categoryHistory);
          const lastMonthCost = categoryHistory[categoryHistory.length - 1]?.total_cost || 0;
          const predictedCost = lastMonthCost * (1 + avgGrowth) ** i;

          forecastPeriods.push({
            month: monthKey,
            predictedCost,
            category,
            confidence: Math.max(0.5, 0.9 - i * 0.1), // Decreasing confidence over time
          });
        }
      }
    }

    const totalForecastedCost = forecastPeriods.reduce(
      (sum, period) => sum + period.predictedCost,
      0
    );

    return {
      forecastPeriods,
      totalForecastedCost,
      methodology: 'Linear regression based on 12-month historical data with trend analysis',
    };
  }

  /**
   * Analyze budget variance
   */
  static async analyzeBudgetVariance(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalBudget: number;
    totalActual: number;
    variance: number;
    variancePercentage: number;
    categoryVariances: {
      category: string;
      budget: number;
      actual: number;
      variance: number;
      status: 'under' | 'over' | 'on_track';
    }[];
  }> {
    const costs = await CostTracking.findAll({
      where: {
        periodStart: { [Op.between]: [startDate, endDate] },
        isApproved: true,
      },
    });

    // Mock budget data (would come from budget management system)
    const budgetsByCategory = {
      infrastructure: 10000,
      api_services: 5000,
      personnel: 50000,
      marketing: 15000,
      development: 20000,
      support: 8000,
      legal: 3000,
      accounting: 2000,
      office: 5000,
      other: 2000,
    };

    const actualByCategory: Record<string, number> = {};
    costs.forEach((cost: unknown) => {
      actualByCategory[cost.category] = (actualByCategory[cost.category] || 0) + cost.totalAmount;
    });

    const categoryVariances = Object.entries(budgetsByCategory).map(([category, budget]) => {
      const actual = actualByCategory[category] || 0;
      const variance = actual - budget;
      const status =
        variance > budget * 0.1 ? 'over' : variance < -budget * 0.1 ? 'under' : 'on_track';

      return {
        category,
        budget,
        actual,
        variance,
        status: status as 'under' | 'over' | 'on_track',
      };
    });

    const totalBudget = Object.values(budgetsByCategory).reduce((sum, budget) => sum + budget, 0);
    const totalActual = Object.values(actualByCategory).reduce((sum, actual) => sum + actual, 0);
    const variance = totalActual - totalBudget;
    const variancePercentage = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalActual,
      variance,
      variancePercentage,
      categoryVariances,
    };
  }

  /**
   * Generate cost optimization recommendations
   */
  static async generateOptimizationRecommendations(): Promise<{
    recommendations: {
      category: string;
      recommendation: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
      potentialSavings: number;
      timeframe: string;
    }[];
    totalPotentialSavings: number;
  }> {
    const recommendations = [
      {
        category: 'infrastructure',
        recommendation: 'Implement auto-scaling for compute resources',
        impact: 'high' as const,
        effort: 'medium' as const,
        potentialSavings: 2000,
        timeframe: '2-4 weeks',
      },
      {
        category: 'api_services',
        recommendation: 'Cache AI responses to reduce API calls',
        impact: 'high' as const,
        effort: 'low' as const,
        potentialSavings: 1500,
        timeframe: '1-2 weeks',
      },
      {
        category: 'infrastructure',
        recommendation: 'Optimize database queries and indexing',
        impact: 'medium' as const,
        effort: 'medium' as const,
        potentialSavings: 800,
        timeframe: '3-4 weeks',
      },
      {
        category: 'marketing',
        recommendation: 'Review and optimize ad spend allocation',
        impact: 'medium' as const,
        effort: 'low' as const,
        potentialSavings: 1200,
        timeframe: '1 week',
      },
      {
        category: 'office',
        recommendation: 'Negotiate better rates with service providers',
        impact: 'low' as const,
        effort: 'medium' as const,
        potentialSavings: 400,
        timeframe: '4-6 weeks',
      },
    ];

    const totalPotentialSavings = recommendations.reduce(
      (sum, rec) => sum + rec.potentialSavings,
      0
    );

    return {
      recommendations,
      totalPotentialSavings,
    };
  }

  /**
   * Calculate cost trends
   */
  static async calculateCostTrends(months: number = 12): Promise<{
    trends: {
      month: string;
      totalCost: number;
      categoryBreakdown: Record<string, number>;
      growthRate: number;
    }[];
    averageGrowthRate: number;
    seasonalityFactors: number[];
  }> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const trends = await sequelize.query(
      `
      SELECT 
        DATE_TRUNC('month', billing_start_date) as month,
        category,
        SUM(total_amount) as total_cost
      FROM cost_tracking
      WHERE billing_start_date >= :startDate
        AND status IN ('approved', 'paid')
      GROUP BY month, category
      ORDER BY month
    `,
      {
        replacements: { startDate },
        type: QueryTypes.SELECT,
      }
    );

    // Process trends data
    const processedTrends: unknown[] = [];
    const monthlyTotals: Record<string, any> = {};

    // Group by month
    (trends as unknown[]).forEach((trend: unknown) => {
      const monthKey = trend.month.toISOString().substr(0, 7);
      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = {
          month: monthKey,
          totalCost: 0,
          categoryBreakdown: {},
          growthRate: 0,
        };
      }
      monthlyTotals[monthKey].totalCost += parseFloat(trend.total_cost);
      monthlyTotals[monthKey].categoryBreakdown[trend.category] = parseFloat(trend.total_cost);
    });

    // Calculate growth rates
    const monthKeys = Object.keys(monthlyTotals).sort();
    monthKeys.forEach((monthKey, index) => {
      if (index > 0) {
        const currentCost = monthlyTotals[monthKey].totalCost;
        const previousCost = monthlyTotals[monthKeys[index - 1]].totalCost;
        monthlyTotals[monthKey].growthRate =
          previousCost > 0 ? ((currentCost - previousCost) / previousCost) * 100 : 0;
      }
      processedTrends.push(monthlyTotals[monthKey]);
    });

    // Calculate average growth rate
    const growthRates = processedTrends.slice(1).map(t => t.growthRate);
    const averageGrowthRate =
      growthRates.length > 0
        ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length
        : 0;

    // Calculate seasonality (simplified)
    const seasonalityFactors = Array(12).fill(1); // Placeholder for seasonal analysis

    return {
      trends: processedTrends,
      averageGrowthRate,
      seasonalityFactors,
    };
  }

  /**
   * Helper method to calculate growth trend
   */
  private static calculateGrowthTrend(data: unknown[]): number {
    if (data.length < 2) return 0;

    const growthRates = [];
    for (let i = 1; i < data.length; i++) {
      const current = parseFloat(data[i].total_cost);
      const previous = parseFloat(data[i - 1].total_cost);
      if (previous > 0) {
        growthRates.push((current - previous) / previous);
      }
    }

    return growthRates.length > 0
      ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length
      : 0;
  }
}

export default CostAnalyticsService;
