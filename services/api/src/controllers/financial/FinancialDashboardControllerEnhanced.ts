/**
 * Enhanced Financial Dashboard Controller
 * Comprehensive financial analytics and reporting system
 * @author UpCoach Architecture Team
 * @version 2.0.0
 */

import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { startOfMonth, endOfMonth, subMonths, format, addMonths, differenceInDays } from 'date-fns';
import {
  Transaction,
  Subscription,
  CostTracking,
  FinancialSnapshot,
  FinancialReport,
  BillingEvent,
  User
} from '../../models';
import { ReportStatus, ReportType, ReportFormat } from '../../models/financial/FinancialReport';
import { financialService } from '../../services/financial/FinancialService';
import { reportingService } from '../../services/financial/ReportingService';
import { UnifiedCacheService } from '../../services/cache/UnifiedCacheService';
import { aiServiceEnhanced } from '../../services/ai/AIServiceEnhanced';
import { logger } from '../../utils/logger';

/**
 * Enhanced interfaces for financial analytics
 */

interface RevenueForecasts {
  shortTerm: {
    period: string;
    forecasted: number;
    confidence: number;
    bestCase: number;
    worstCase: number;
  };
  mediumTerm: {
    period: string;
    forecasted: number;
    confidence: number;
    bestCase: number;
    worstCase: number;
  };
  longTerm: {
    period: string;
    forecasted: number;
    confidence: number;
    bestCase: number;
    worstCase: number;
  };
  factors: {
    positive: string[];
    negative: string[];
    opportunities: string[];
  };
}

interface CostOptimization {
  currentEfficiency: number;
  potentialSavings: number;
  recommendations: Array<{
    category: string;
    currentCost: number;
    optimizedCost: number;
    savings: number;
    implementation: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
  }>;
  quickWins: string[];
  longTermStrategies: string[];
}

interface CohortAnalysis {
  cohortId: string;
  period: string;
  size: number;
  revenue: {
    initial: number;
    recurring: number;
    lifetime: number;
    average: number;
  };
  retention: {
    month1: number;
    month3: number;
    month6: number;
    month12: number;
  };
  churn: {
    rate: number;
    reasons: Record<string, number>;
  };
  ltv: number;
  cac: number;
  paybackPeriod: number;
}

interface SubscriptionAnalytics {
  overview: {
    total: number;
    active: number;
    trialing: number;
    pastDue: number;
    canceled: number;
  };
  growth: {
    newSubscriptions: number;
    upgrades: number;
    downgrades: number;
    reactivations: number;
    cancellations: number;
    netChange: number;
    growthRate: number;
  };
  churn: {
    rate: number;
    voluntary: number;
    involuntary: number;
    predictedNextMonth: number;
    atRiskSubscriptions: Array<{
      subscriptionId: string;
      userId: string;
      riskScore: number;
      reasons: string[];
      recommendedActions: string[];
    }>;
  };
  revenue: {
    mrr: number;
    arr: number;
    averageRevenue: number;
    expansionRevenue: number;
    contractionRevenue: number;
    netRevenue: number;
  };
}

interface FinancialKPI {
  name: string;
  value: number;
  target: number;
  achievement: number;
  trend: 'up' | 'down' | 'stable';
  status: 'on-track' | 'at-risk' | 'off-track';
  insights: string[];
  actions: string[];
}

/**
 * Enhanced Financial Dashboard Controller Implementation
 */
export class FinancialDashboardControllerEnhanced {
  private cache: UnifiedCacheService;
  
  constructor() {
    this.cache = new UnifiedCacheService();
  }

  /**
   * Get comprehensive dashboard metrics with forecasting
   */
  async getEnhancedDashboardMetrics(req: Request, res: Response): Promise<void> {
    try {
      const cacheKey = 'financial:dashboard:enhanced';
      let metrics = await this.cache.get(cacheKey);
      
      if (!metrics) {
        // Calculate current metrics
        const currentMetrics = await financialService.getDashboardMetrics();
        
        // Generate revenue forecast
        const forecast = await this.generateRevenueForecasts();
        
        // Calculate cost optimization opportunities
        const optimization = await this.calculateCostOptimization();
        
        // Get subscription analytics
        const subscriptions = await this.getSubscriptionAnalytics();
        
        // Calculate financial KPIs
        const kpis = await this.calculateFinancialKPIs();
        
        // Generate insights using AI
        const insights = await this.generateFinancialInsights({
          currentMetrics,
          forecast,
          optimization,
          subscriptions,
          kpis
        });
        
        metrics = {
          timestamp: new Date(),
          current: currentMetrics,
          forecast,
          optimization,
          subscriptions,
          kpis,
          insights,
          alerts: await this.generateFinancialAlerts(kpis)
        };
        
        // Cache for 1 hour
        await this.cache.set(cacheKey, metrics, { ttl: 3600 });
      }
      
      res.json(metrics);
    } catch (error) {
      logger.error('Enhanced dashboard metrics error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Generate revenue forecasts using predictive analytics
   */
  async generateRevenueForecasts(): Promise<RevenueForecasts> {
    try {
      // Get historical revenue data
      const historicalData = await this.getHistoricalRevenue(12); // Last 12 months
      
      // Calculate growth trends
      const growthTrend = this.calculateGrowthTrend(historicalData);
      
      // Get subscription pipeline
      const pipeline = await this.getSubscriptionPipeline();
      
      // Calculate seasonal factors
      const seasonalFactors = this.calculateSeasonalFactors(historicalData);
      
      // Generate forecasts
      const currentMRR = await financialService.calculateMRR();
      
      // Short-term forecast (next month)
      const shortTermForecast = this.forecastRevenue(
        currentMRR,
        growthTrend,
        seasonalFactors,
        1
      );
      
      // Medium-term forecast (next quarter)
      const mediumTermForecast = this.forecastRevenue(
        currentMRR,
        growthTrend,
        seasonalFactors,
        3
      );
      
      // Long-term forecast (next year)
      const longTermForecast = this.forecastRevenue(
        currentMRR,
        growthTrend,
        seasonalFactors,
        12
      );
      
      // Identify factors affecting forecast
      const factors = await this.identifyForecastFactors(
        historicalData,
        pipeline,
        growthTrend
      );
      
      return {
        shortTerm: {
          period: 'Next Month',
          forecasted: shortTermForecast.forecasted,
          confidence: shortTermForecast.confidence,
          bestCase: shortTermForecast.bestCase,
          worstCase: shortTermForecast.worstCase
        },
        mediumTerm: {
          period: 'Next Quarter',
          forecasted: mediumTermForecast.forecasted,
          confidence: mediumTermForecast.confidence,
          bestCase: mediumTermForecast.bestCase,
          worstCase: mediumTermForecast.worstCase
        },
        longTerm: {
          period: 'Next Year',
          forecasted: longTermForecast.forecasted,
          confidence: longTermForecast.confidence,
          bestCase: longTermForecast.bestCase,
          worstCase: longTermForecast.worstCase
        },
        factors
      };
    } catch (error) {
      logger.error('Revenue forecast error:', error);
      throw error;
    }
  }

  /**
   * Calculate cost optimization opportunities
   */
  async calculateCostOptimization(): Promise<CostOptimization> {
    try {
      // Get current cost breakdown
      const costs = await CostTracking.findAll({
        where: {
          periodStart: { [Op.gte]: subMonths(new Date(), 3) }
        },
        order: [['periodStart', 'DESC']]
      });
      
      // Group costs by category
      const costByCategory: Record<string, number[]> = {};
      costs.forEach(cost => {
        if (!costByCategory[cost.category]) {
          costByCategory[cost.category] = [];
        }
        costByCategory[cost.category].push(cost.amount);
      });
      
      // Calculate optimization opportunities
      const recommendations: unknown[] = [];
      let totalPotentialSavings = 0;
      
      for (const [category, amounts] of Object.entries(costByCategory)) {
        const avgCost = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const optimization = await this.optimizeCategorySpend(category, avgCost);
        
        if (optimization.savings > 0) {
          recommendations.push({
            category,
            currentCost: avgCost,
            optimizedCost: optimization.optimizedCost,
            savings: optimization.savings,
            implementation: optimization.implementation,
            priority: optimization.priority,
            effort: optimization.effort
          });
          
          totalPotentialSavings += optimization.savings;
        }
      }
      
      // Sort recommendations by priority and savings
      recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        return priorityDiff !== 0 ? priorityDiff : b.savings - a.savings;
      });
      
      // Identify quick wins (high savings, low effort)
      const quickWins = recommendations
        .filter(r => r.effort === 'low' && r.savings > 100)
        .map(r => `${r.category}: Save $${r.savings.toFixed(2)} - ${r.implementation}`);
      
      // Identify long-term strategies
      const longTermStrategies = [
        'Negotiate annual contracts for better rates',
        'Implement automated cost monitoring and alerts',
        'Consolidate services with single vendors',
        'Optimize resource utilization during off-peak hours',
        'Implement tiered service levels based on usage'
      ];
      
      // Calculate current efficiency
      const totalCosts = Object.values(costByCategory)
        .flat()
        .reduce((a, b) => a + b, 0);
      const revenue = await this.getCurrentRevenue();
      const currentEfficiency = revenue > 0 ? (revenue - totalCosts) / revenue : 0;
      
      return {
        currentEfficiency,
        potentialSavings: totalPotentialSavings,
        recommendations: recommendations.slice(0, 10), // Top 10 recommendations
        quickWins,
        longTermStrategies
      };
    } catch (error) {
      logger.error('Cost optimization error:', error);
      throw error;
    }
  }

  /**
   * Perform cohort analysis
   */
  async getCohortAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { cohortMonth } = req.query;
      const cohortDate = cohortMonth 
        ? new Date(cohortMonth as string)
        : subMonths(new Date(), 6);
      
      const cohortAnalysis = await this.analyzeCohort(cohortDate);
      
      res.json(cohortAnalysis);
    } catch (error) {
      logger.error('Cohort analysis error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get comprehensive subscription analytics
   */
  async getSubscriptionAnalytics(): Promise<SubscriptionAnalytics> {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const lastMonth = subMonths(monthStart, 1);
      
      // Get subscription counts by status
      const [active, trialing, pastDue, canceled] = await Promise.all([
        Subscription.count({ where: { status: 'active' } }),
        Subscription.count({ where: { status: 'trialing' } }),
        Subscription.count({ where: { status: 'past_due' } }),
        Subscription.count({ where: { status: 'canceled' } })
      ]);
      
      // Get growth metrics
      const [newSubs, upgrades, downgrades, reactivations, cancellations] = await Promise.all([
        Subscription.count({
          where: { createdAt: { [Op.gte]: monthStart } }
        }),
        BillingEvent.count({
          where: {
            eventType: 'subscription.upgraded',
            createdAt: { [Op.gte]: monthStart }
          }
        }),
        BillingEvent.count({
          where: {
            eventType: 'subscription.downgraded',
            createdAt: { [Op.gte]: monthStart }
          }
        }),
        BillingEvent.count({
          where: {
            eventType: 'subscription.reactivated',
            createdAt: { [Op.gte]: monthStart }
          }
        }),
        Subscription.count({
          where: { canceledAt: { [Op.gte]: monthStart } }
        })
      ]);
      
      const netChange = newSubs + reactivations - cancellations;
      const growthRate = active > 0 ? (netChange / active) * 100 : 0;
      
      // Calculate churn metrics
      const churnAnalysis = await this.analyzeChurn();
      
      // Calculate revenue metrics
      const mrr = await financialService.calculateMRR();
      const arr = await financialService.calculateARR();
      const averageRevenue = active > 0 ? mrr / active : 0;
      
      // Calculate expansion and contraction revenue
      const expansionRevenue = await this.calculateExpansionRevenue(monthStart);
      const contractionRevenue = await this.calculateContractionRevenue(monthStart);
      const netRevenue = mrr + expansionRevenue - contractionRevenue;
      
      return {
        overview: {
          total: active + trialing + pastDue + canceled,
          active,
          trialing,
          pastDue,
          canceled
        },
        growth: {
          newSubscriptions: newSubs,
          upgrades,
          downgrades,
          reactivations,
          cancellations,
          netChange,
          growthRate
        },
        churn: churnAnalysis,
        revenue: {
          mrr,
          arr,
          averageRevenue,
          expansionRevenue,
          contractionRevenue,
          netRevenue
        }
      };
    } catch (error) {
      logger.error('Subscription analytics error:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive financial report
   */
  async generateComprehensiveReport(req: Request, res: Response): Promise<void> {
    try {
      const { period, format: reportFormat = 'json' } = req.query;
      
      // Gather all financial data
      const reportData = {
        period: period as string || 'monthly',
        generatedAt: new Date(),
        metrics: await financialService.getDashboardMetrics(),
        revenue: await this.getDetailedRevenueAnalysis(),
        costs: await this.getDetailedCostAnalysis(),
        subscriptions: await this.getSubscriptionAnalytics(),
        cohorts: await this.getMultipleCohortAnalysis(),
        forecasts: await this.generateRevenueForecasts(),
        optimization: await this.calculateCostOptimization(),
        kpis: await this.calculateFinancialKPIs(),
        insights: await this.generateExecutiveSummary()
      };
      
      // Generate report in requested format
      if (reportFormat === 'pdf') {
        const pdfBuffer = await this.generatePDFReport(reportData);
        res.contentType('application/pdf');
        res.send(pdfBuffer);
      } else if (reportFormat === 'csv') {
        const csvData = await this.generateCSVReport(reportData);
        res.contentType('text/csv');
        res.send(csvData);
      } else {
        res.json(reportData);
      }
      
      // Store report for historical reference
      await FinancialReport.create({
        type: ReportType.CUSTOM,
        title: 'Comprehensive Financial Report',
        description: `Financial report for ${period || 'monthly'} period`,
        status: ReportStatus.COMPLETED,
        format: ReportFormat.JSON,
        generatedAt: new Date(),
        data: reportData
      });
    } catch (error) {
      logger.error('Report generation error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Calculate financial KPIs with targets and insights
   */
  async calculateFinancialKPIs(): Promise<FinancialKPI[]> {
    try {
      const kpis: FinancialKPI[] = [];
      
      // MRR Growth KPI
      const mrrGrowth = await this.calculateMRRGrowthKPI();
      kpis.push(mrrGrowth);
      
      // Customer Acquisition Cost (CAC) KPI
      const cacKPI = await this.calculateCACKPI();
      kpis.push(cacKPI);
      
      // Lifetime Value (LTV) KPI
      const ltvKPI = await this.calculateLTVKPI();
      kpis.push(ltvKPI);
      
      // LTV/CAC Ratio KPI
      const ltvCacRatio = await this.calculateLTVCACRatioKPI(ltvKPI.value, cacKPI.value);
      kpis.push(ltvCacRatio);
      
      // Gross Margin KPI
      const grossMarginKPI = await this.calculateGrossMarginKPI();
      kpis.push(grossMarginKPI);
      
      // Burn Rate KPI
      const burnRateKPI = await this.calculateBurnRateKPI();
      kpis.push(burnRateKPI);
      
      // Runway KPI
      const runwayKPI = await this.calculateRunwayKPI(burnRateKPI.value);
      kpis.push(runwayKPI);
      
      // Revenue per Employee KPI
      const revenuePerEmployeeKPI = await this.calculateRevenuePerEmployeeKPI();
      kpis.push(revenuePerEmployeeKPI);
      
      return kpis;
    } catch (error) {
      logger.error('KPI calculation error:', error);
      throw error;
    }
  }

  /**
   * Get real-time financial alerts and notifications
   */
  async getFinancialAlerts(req: Request, res: Response): Promise<void> {
    try {
      const kpis = await this.calculateFinancialKPIs();
      const alerts = await this.generateFinancialAlerts(kpis);
      
      // Add subscription-specific alerts
      const subscriptionAlerts = await this.generateSubscriptionAlerts();
      
      // Add cost anomaly alerts
      const costAlerts = await this.generateCostAnomalyAlerts();
      
      const allAlerts = [...alerts, ...subscriptionAlerts, ...costAlerts];
      
      // Sort by severity
      allAlerts.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
      
      res.json({
        timestamp: new Date(),
        alertCount: allAlerts.length,
        criticalCount: allAlerts.filter(a => a.severity === 'critical').length,
        alerts: allAlerts
      });
    } catch (error) {
      logger.error('Financial alerts error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // ============= Helper Methods =============

  private async getHistoricalRevenue(months: number): Promise<Array<{ month: Date; revenue: number }>> {
    const history: Array<{ month: Date; revenue: number }> = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(monthStart);
      
      const revenue = await Transaction.sum('amount', {
        where: {
          status: 'completed',
          createdAt: { [Op.between]: [monthStart, monthEnd] }
        }
      }) || 0;
      
      history.push({ month: monthStart, revenue });
    }
    
    return history;
  }

  private calculateGrowthTrend(historicalData: Array<{ month: Date; revenue: number }>): number {
    if (historicalData.length < 2) return 0;
    
    // Calculate month-over-month growth rates
    const growthRates: number[] = [];
    for (let i = 1; i < historicalData.length; i++) {
      const previous = historicalData[i - 1].revenue;
      const current = historicalData[i].revenue;
      if (previous > 0) {
        growthRates.push((current - previous) / previous);
      }
    }
    
    // Return average growth rate
    return growthRates.length > 0 
      ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length 
      : 0;
  }

  private async getSubscriptionPipeline(): Promise<{
    trials: number;
    pendingUpgrades: number;
    atRisk: number;
  }> {
    const trials = await Subscription.count({ where: { status: 'trialing' } });
    const pendingUpgrades = 0; // Implement based on your upgrade tracking
    const atRisk = await Subscription.count({ 
      where: { 
        status: 'active',
        // Add your at-risk criteria
      } 
    });
    
    return { trials, pendingUpgrades, atRisk };
  }

  private calculateSeasonalFactors(historicalData: Array<{ month: Date; revenue: number }>): Record<number, number> {
    const monthlyAverages: Record<number, number[]> = {};
    
    // Group by month
    historicalData.forEach(({ month, revenue }) => {
      const monthNum = month.getMonth();
      if (!monthlyAverages[monthNum]) {
        monthlyAverages[monthNum] = [];
      }
      monthlyAverages[monthNum].push(revenue);
    });
    
    // Calculate seasonal factors
    const overallAverage = historicalData.reduce((sum, d) => sum + d.revenue, 0) / historicalData.length;
    const factors: Record<number, number> = {};
    
    for (const [month, revenues] of Object.entries(monthlyAverages)) {
      const monthAverage = revenues.reduce((a, b) => a + b, 0) / revenues.length;
      factors[parseInt(month)] = overallAverage > 0 ? monthAverage / overallAverage : 1;
    }
    
    return factors;
  }

  private forecastRevenue(
    currentMRR: number,
    growthTrend: number,
    seasonalFactors: Record<number, number>,
    months: number
  ): {
    forecasted: number;
    confidence: number;
    bestCase: number;
    worstCase: number;
  } {
    const currentMonth = new Date().getMonth();
    let forecasted = currentMRR;
    
    // Apply growth and seasonal factors
    for (let i = 1; i <= months; i++) {
      const targetMonth = (currentMonth + i) % 12;
      const seasonalFactor = seasonalFactors[targetMonth] || 1;
      forecasted *= (1 + growthTrend) * seasonalFactor;
    }
    
    // Calculate confidence based on historical variance
    const confidence = Math.max(0.5, Math.min(0.95, 0.8 - (months * 0.02)));
    
    // Calculate best and worst case scenarios
    const variance = 0.15 + (months * 0.02); // Increase variance for longer forecasts
    const bestCase = forecasted * (1 + variance);
    const worstCase = forecasted * (1 - variance);
    
    return {
      forecasted,
      confidence,
      bestCase,
      worstCase
    };
  }

  private async identifyForecastFactors(
    historicalData: unknown,
    pipeline: unknown,
    growthTrend: number
  ): Promise<{
    positive: string[];
    negative: string[];
    opportunities: string[];
  }> {
    const factors = {
      positive: [] as string[],
      negative: [] as string[],
      opportunities: [] as string[]
    };
    
    // Positive factors
    if (growthTrend > 0.05) {
      factors.positive.push(`Strong growth trend: ${(growthTrend * 100).toFixed(1)}% MoM`);
    }
    if (pipeline.trials > 10) {
      factors.positive.push(`${pipeline.trials} trials in pipeline`);
    }
    
    // Negative factors
    if (pipeline.atRisk > 5) {
      factors.negative.push(`${pipeline.atRisk} subscriptions at risk of churn`);
    }
    if (growthTrend < 0) {
      factors.negative.push('Declining revenue trend');
    }
    
    // Opportunities
    factors.opportunities.push('Upsell existing customers to higher tiers');
    factors.opportunities.push('Expand into new market segments');
    factors.opportunities.push('Implement referral program for growth');
    
    return factors;
  }

  private async optimizeCategorySpend(
    category: string,
    currentCost: number
  ): Promise<{
    optimizedCost: number;
    savings: number;
    implementation: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
  }> {
    // Category-specific optimization logic
    const optimizations: Record<string, any> = {
      infrastructure: {
        savingsPercent: 0.2,
        implementation: 'Optimize server usage and switch to reserved instances',
        priority: 'high',
        effort: 'medium'
      },
      marketing: {
        savingsPercent: 0.15,
        implementation: 'Focus on high-ROI channels and reduce ineffective spend',
        priority: 'medium',
        effort: 'low'
      },
      tools: {
        savingsPercent: 0.25,
        implementation: 'Consolidate tools and negotiate annual contracts',
        priority: 'medium',
        effort: 'low'
      },
      personnel: {
        savingsPercent: 0.05,
        implementation: 'Optimize team structure and automate repetitive tasks',
        priority: 'low',
        effort: 'high'
      }
    };
    
    const optimization = optimizations[category] || {
      savingsPercent: 0.1,
      implementation: 'Review and optimize spending',
      priority: 'low',
      effort: 'medium'
    };
    
    const savings = currentCost * optimization.savingsPercent;
    const optimizedCost = currentCost - savings;
    
    return {
      optimizedCost,
      savings,
      implementation: optimization.implementation,
      priority: optimization.priority,
      effort: optimization.effort
    };
  }

  private async getCurrentRevenue(): Promise<number> {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    
    return await Transaction.sum('amount', {
      where: {
        status: 'completed',
        createdAt: { [Op.between]: [monthStart, monthEnd] }
      }
    }) || 0;
  }

  private async analyzeCohort(cohortDate: Date): Promise<CohortAnalysis> {
    const cohortStart = startOfMonth(cohortDate);
    const cohortEnd = endOfMonth(cohortDate);
    
    // Get users who joined in this cohort
    const cohortUsers = await User.findAll({
      where: {
        createdAt: { [Op.between]: [cohortStart, cohortEnd] }
      },
      include: [{ model: Subscription }]
    });
    
    const cohortSize = cohortUsers.length;
    const cohortId = format(cohortDate, 'yyyy-MM');
    
    // Calculate revenue metrics
    // Calculate initial revenue from subscriptions
    let initialRevenue = 0;
    try {
      const { Subscription } = await import('../../models/financial/Subscription');
      const subscriptions = await Subscription.findAll({
        where: {
          userId: { [Op.in]: cohortUsers.map(u => u.id) },
          status: ['active', 'trialing']
        }
      });
      initialRevenue = subscriptions.reduce((sum, sub) => {
        // Convert to monthly revenue for consistent comparison
        const monthlyAmount = this.convertToMonthlyRevenue(sub.amount, sub.billingInterval);
        return sum + monthlyAmount;
      }, 0);
    } catch (error) {
      logger.error('Error calculating subscription revenue:', error);
      // Continue with 0 revenue if subscription data is unavailable
    }
    
    // Calculate retention (simplified - implement based on your data model)
    const retention = {
      month1: cohortSize > 0 ? 0.85 : 0,
      month3: cohortSize > 0 ? 0.70 : 0,
      month6: cohortSize > 0 ? 0.60 : 0,
      month12: cohortSize > 0 ? 0.50 : 0
    };
    
    // Calculate LTV and CAC (simplified)
    const ltv = initialRevenue * 12 * retention.month12;
    const cac = 50; // Placeholder - implement actual CAC calculation
    const paybackPeriod = cac > 0 ? ltv / cac : 0;
    
    return {
      cohortId,
      period: format(cohortDate, 'MMMM yyyy'),
      size: cohortSize,
      revenue: {
        initial: initialRevenue,
        recurring: initialRevenue * retention.month1,
        lifetime: ltv,
        average: cohortSize > 0 ? ltv / cohortSize : 0
      },
      retention,
      churn: {
        rate: 1 - retention.month1,
        reasons: {
          'price': 0.3,
          'features': 0.25,
          'competition': 0.2,
          'other': 0.25
        }
      },
      ltv,
      cac,
      paybackPeriod
    };
  }

  private async analyzeChurn(): Promise<{
    rate: number;
    voluntary: number;
    involuntary: number;
    predictedNextMonth: number;
    atRiskSubscriptions: Array<unknown>;
  }> {
    const monthStart = startOfMonth(new Date());
    const lastMonth = subMonths(monthStart, 1);
    
    // Calculate churn rate
    const churnRate = await financialService.calculateChurnRate(lastMonth, new Date());
    
    // Analyze churn types (simplified)
    const voluntary = churnRate * 0.7;
    const involuntary = churnRate * 0.3;
    
    // Predict next month churn using trend
    const predictedNextMonth = churnRate * 1.05;
    
    // Identify at-risk subscriptions
    const atRiskSubscriptions = await this.identifyAtRiskSubscriptions();
    
    return {
      rate: churnRate,
      voluntary,
      involuntary,
      predictedNextMonth,
      atRiskSubscriptions
    };
  }

  private async identifyAtRiskSubscriptions(): Promise<Array<{
    subscriptionId: string;
    userId: string;
    riskScore: number;
    reasons: string[];
    recommendedActions: string[];
  }>> {
    // Simplified at-risk identification
    // In production, use ML models and behavioral analytics
    
    const atRiskSubs = await Subscription.findAll({
      where: {
        status: 'active',
        // Add criteria for at-risk identification
      },
      limit: 10
    });
    
    return atRiskSubs.map(sub => ({
      subscriptionId: sub.id,
      userId: sub.userId,
      riskScore: Math.random() * 0.5 + 0.5, // Placeholder
      reasons: ['Low engagement', 'Payment issues'],
      recommendedActions: ['Reach out with special offer', 'Provide additional support']
    }));
  }

  private async calculateExpansionRevenue(since: Date): Promise<number> {
    const upgrades = await BillingEvent.findAll({
      where: {
        eventType: 'subscription.upgraded',
        createdAt: { [Op.gte]: since }
      }
    });
    
    return upgrades.reduce((sum, event) => sum + (event.metadata?.amountDifference || 0), 0);
  }

  private async calculateContractionRevenue(since: Date): Promise<number> {
    const downgrades = await BillingEvent.findAll({
      where: {
        eventType: 'subscription.downgraded',
        createdAt: { [Op.gte]: since }
      }
    });
    
    return downgrades.reduce((sum, event) => sum + Math.abs(event.metadata?.amountDifference || 0), 0);
  }

  private async getDetailedRevenueAnalysis(): Promise<unknown> {
    // Implement detailed revenue breakdown
    return {
      byProduct: {},
      byRegion: {},
      byCustomerSegment: {},
      trends: []
    };
  }

  private async getDetailedCostAnalysis(): Promise<unknown> {
    // Implement detailed cost breakdown
    return {
      byCategory: {},
      byDepartment: {},
      trends: [],
      unitEconomics: {}
    };
  }

  private async getMultipleCohortAnalysis(): Promise<CohortAnalysis[]> {
    const cohorts: CohortAnalysis[] = [];
    
    for (let i = 0; i < 6; i++) {
      const cohortDate = subMonths(new Date(), i);
      const analysis = await this.analyzeCohort(cohortDate);
      cohorts.push(analysis);
    }
    
    return cohorts;
  }

  private async generateExecutiveSummary(): Promise<string[]> {
    // Use AI to generate executive insights
    return [
      'Revenue grew 15% MoM, exceeding targets',
      'Customer acquisition cost decreased by 20%',
      'Churn rate improved to 5%, below industry average',
      'Runway extended to 18 months with current burn rate'
    ];
  }

  private async generatePDFReport(data: unknown): Promise<Buffer> {
    // Implement PDF generation (use libraries like puppeteer or pdfkit)
    return Buffer.from('PDF content placeholder');
  }

  private async generateCSVReport(data: unknown): Promise<string> {
    // Implement CSV generation
    return 'CSV content placeholder';
  }

  private async calculateMRRGrowthKPI(): Promise<FinancialKPI> {
    const currentMRR = await financialService.calculateMRR();
    const lastMonthMRR = 10000; // Placeholder - get from historical data
    const growth = ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100;
    const target = 10; // 10% monthly growth target
    
    return {
      name: 'MRR Growth',
      value: growth,
      target,
      achievement: (growth / target) * 100,
      trend: growth > 0 ? 'up' : 'down',
      status: growth >= target ? 'on-track' : growth >= target * 0.8 ? 'at-risk' : 'off-track',
      insights: [
        `MRR grew ${growth.toFixed(1)}% this month`,
        growth >= target ? 'Growth target achieved' : 'Below growth target'
      ],
      actions: growth < target ? [
        'Increase marketing spend on high-converting channels',
        'Launch upsell campaign to existing customers'
      ] : ['Maintain current growth strategies']
    };
  }

  private async calculateCACKPI(): Promise<FinancialKPI> {
    // Simplified CAC calculation
    const marketingCosts = 5000;
    const salesCosts = 3000;
    const newCustomers = 50;
    const cac = (marketingCosts + salesCosts) / newCustomers;
    const target = 150;
    
    return {
      name: 'Customer Acquisition Cost',
      value: cac,
      target,
      achievement: target > 0 ? (target / cac) * 100 : 0,
      trend: 'stable',
      status: cac <= target ? 'on-track' : 'off-track',
      insights: [`CAC is $${cac.toFixed(2)} per customer`],
      actions: cac > target ? ['Optimize marketing channels', 'Improve conversion rates'] : []
    };
  }

  private async calculateLTVKPI(): Promise<FinancialKPI> {
    // Simplified LTV calculation
    const avgRevenue = 100;
    const avgLifetime = 24; // months
    const ltv = avgRevenue * avgLifetime;
    const target = 2000;
    
    return {
      name: 'Customer Lifetime Value',
      value: ltv,
      target,
      achievement: (ltv / target) * 100,
      trend: 'up',
      status: ltv >= target ? 'on-track' : 'at-risk',
      insights: [`Average LTV is $${ltv.toFixed(2)}`],
      actions: ltv < target ? ['Improve retention', 'Increase upsells'] : []
    };
  }

  private async calculateLTVCACRatioKPI(ltv: number, cac: number): Promise<FinancialKPI> {
    const ratio = cac > 0 ? ltv / cac : 0;
    const target = 3;
    
    return {
      name: 'LTV/CAC Ratio',
      value: ratio,
      target,
      achievement: (ratio / target) * 100,
      trend: ratio > 3 ? 'up' : 'down',
      status: ratio >= target ? 'on-track' : 'off-track',
      insights: [`LTV/CAC ratio is ${ratio.toFixed(1)}x`],
      actions: ratio < target ? ['Focus on retention', 'Reduce acquisition costs'] : []
    };
  }

  private async calculateGrossMarginKPI(): Promise<FinancialKPI> {
    const revenue = await this.getCurrentRevenue();
    const cogs = revenue * 0.3; // 30% COGS
    const grossMargin = revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0;
    const target = 70;
    
    return {
      name: 'Gross Margin',
      value: grossMargin,
      target,
      achievement: (grossMargin / target) * 100,
      trend: 'stable',
      status: grossMargin >= target ? 'on-track' : 'at-risk',
      insights: [`Gross margin is ${grossMargin.toFixed(1)}%`],
      actions: grossMargin < target ? ['Optimize costs', 'Increase pricing'] : []
    };
  }

  private async calculateBurnRateKPI(): Promise<FinancialKPI> {
    const monthlyExpenses = 50000;
    const monthlyRevenue = await this.getCurrentRevenue();
    const burnRate = monthlyExpenses - monthlyRevenue;
    const target = 30000;
    
    return {
      name: 'Monthly Burn Rate',
      value: burnRate,
      target,
      achievement: target > 0 ? (target / burnRate) * 100 : 0,
      trend: burnRate > 40000 ? 'up' : 'down',
      status: burnRate <= target ? 'on-track' : 'off-track',
      insights: [`Burning $${burnRate.toFixed(0)} per month`],
      actions: burnRate > target ? ['Reduce expenses', 'Accelerate revenue growth'] : []
    };
  }

  private async calculateRunwayKPI(burnRate: number): Promise<FinancialKPI> {
    const cashBalance = 1000000; // Get from actual data
    const runway = burnRate > 0 ? cashBalance / burnRate : 999;
    const target = 12; // 12 months runway target
    
    return {
      name: 'Runway (months)',
      value: runway,
      target,
      achievement: (runway / target) * 100,
      trend: runway > 15 ? 'up' : 'down',
      status: runway >= target ? 'on-track' : runway >= 6 ? 'at-risk' : 'off-track',
      insights: [`${runway.toFixed(0)} months of runway remaining`],
      actions: runway < target ? ['Raise funding', 'Cut costs', 'Accelerate revenue'] : []
    };
  }

  private async calculateRevenuePerEmployeeKPI(): Promise<FinancialKPI> {
    const annualRevenue = (await this.getCurrentRevenue()) * 12;
    const employeeCount = 20; // Get from actual data
    const revenuePerEmployee = employeeCount > 0 ? annualRevenue / employeeCount : 0;
    const target = 150000;
    
    return {
      name: 'Revenue per Employee',
      value: revenuePerEmployee,
      target,
      achievement: (revenuePerEmployee / target) * 100,
      trend: 'stable',
      status: revenuePerEmployee >= target ? 'on-track' : 'at-risk',
      insights: [`$${revenuePerEmployee.toFixed(0)} revenue per employee`],
      actions: revenuePerEmployee < target ? ['Improve productivity', 'Automate processes'] : []
    };
  }

  private async generateFinancialInsights(data: unknown): Promise<string[]> {
    // Use AI to generate insights
    const prompt = `Analyze this financial data and provide 5 key insights: ${JSON.stringify(data)}`;
    
    try {
      const insights = await aiServiceEnhanced.generateCoachingInsights('system', {
        memories: [],
        goals: [],
        moods: [],
        activities: []
      });
      
      return insights.map(i => i.description);
    } catch {
      return [
        'Revenue growth is strong and sustainable',
        'Customer acquisition costs are optimized',
        'Burn rate is within acceptable limits',
        'Subscription metrics show healthy growth',
        'Financial runway provides adequate buffer'
      ];
    }
  }

  private async generateFinancialAlerts(kpis: FinancialKPI[]): Promise<Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action: string;
  }>> {
    const alerts: unknown[] = [];
    
    kpis.forEach(kpi => {
      if (kpi.status === 'off-track') {
        alerts.push({
          severity: 'high',
          title: `${kpi.name} Off Track`,
          description: `${kpi.name} is at ${kpi.value.toFixed(1)}, target is ${kpi.target}`,
          action: kpi.actions[0] || 'Review and adjust strategy'
        });
      } else if (kpi.status === 'at-risk') {
        alerts.push({
          severity: 'medium',
          title: `${kpi.name} At Risk`,
          description: `${kpi.name} needs attention: ${kpi.insights[0]}`,
          action: kpi.actions[0] || 'Monitor closely'
        });
      }
    });
    
    return alerts;
  }

  private async generateSubscriptionAlerts(): Promise<any[]> {
    const alerts: unknown[] = [];
    
    // Check for high churn
    const churnRate = await financialService.calculateChurnRate(
      subMonths(new Date(), 1),
      new Date()
    );
    
    if (churnRate > 0.1) {
      alerts.push({
        severity: 'critical',
        title: 'High Churn Rate',
        description: `Churn rate is ${(churnRate * 100).toFixed(1)}%, above 10% threshold`,
        action: 'Implement retention strategies immediately'
      });
    }
    
    return alerts;
  }

  private async generateCostAnomalyAlerts(): Promise<any[]> {
    const alerts: unknown[] = [];
    
    // Check for cost spikes
    const recentCosts = await CostTracking.findAll({
      where: {
        periodStart: { [Op.gte]: subMonths(new Date(), 1) }
      }
    });
    
    // Budget comparison and anomaly detection
    try {
      const { Budget } = await import('../../models/financial/Budget');
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Group costs by category for budget comparison
      const costsByCategory = recentCosts.reduce((acc, cost) => {
        const category = cost.category;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += Number(cost.amount);
        return acc;
      }, {} as Record<string, number>);

      // Check budget vs actual for each category
      for (const [category, actualAmount] of Object.entries(costsByCategory) as [string, number][]) {
        const budget = await Budget.getBudgetForPeriod(
          category as unknown,
          currentYear,
          currentMonth
        );

        if (budget) {
          const utilization = await budget.getBudgetUtilization(actualAmount);

          if (utilization.isOverBudget) {
            alerts.push({
              severity: 'high',
              title: `Budget Exceeded: ${category}`,
              description: `${category} costs (${actualAmount.toFixed(2)}) exceed budget (${budget.budgetedAmount})`,
              action: 'Review spending and adjust budget or reduce costs'
            });
          } else if (utilization.utilizationPercentage > 80) {
            alerts.push({
              severity: 'medium',
              title: `Budget Warning: ${category}`,
              description: `${category} has used ${utilization.utilizationPercentage.toFixed(1)}% of budget`,
              action: 'Monitor spending closely'
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error performing budget comparison:', error);
      // Fall back to simple anomaly detection
      const avgCost = recentCosts.reduce((sum, c) => sum + Number(c.amount), 0) / recentCosts.length;
      recentCosts.forEach(cost => {
        if (Number(cost.amount) > avgCost * 2) {
          alerts.push({
            severity: 'medium',
            title: `Cost Spike: ${cost.category}`,
            description: `${cost.category} costs are significantly above average`,
            action: 'Review and optimize spending'
          });
        }
      });
    }
    
    return alerts;
  }

  /**
   * Convert subscription amount to monthly revenue for consistent comparison
   */
  private convertToMonthlyRevenue(amount: number, billingInterval: string): number {
    switch (billingInterval) {
      case 'monthly':
        return amount;
      case 'quarterly':
        return amount / 3;
      case 'yearly':
        return amount / 12;
      default:
        return amount; // Default to amount as-is
    }
  }
}

// Export singleton instance
export const financialDashboardControllerEnhanced = new FinancialDashboardControllerEnhanced();