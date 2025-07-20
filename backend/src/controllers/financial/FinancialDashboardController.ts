import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { sequelize } from '../../models';
import { FinancialService } from '../../services/financial/FinancialService';
import { FinancialSnapshot, Transaction, Subscription, CostTracking, RevenueAnalytics } from '../../models';

/**
 * FinancialDashboardController
 * Handles financial dashboard and reporting endpoints
 */
export class FinancialDashboardController {
  /**
   * Get financial dashboard overview
   */
  static async getDashboardOverview(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'monthly' } = req.query;
      
      // Get current metrics
      const mrr = await FinancialService.calculateMRR();
      const arr = await FinancialService.calculateARR();
      const unitEconomics = await FinancialService.calculateUnitEconomics();
      const healthScore = await FinancialService.getFinancialHealthScore();
      
      // Get latest snapshot
      const latestSnapshot = await FinancialSnapshot.getLatest(period as string);
      
      // Get trends
      const trends = await FinancialSnapshot.calculateTrends();
      
      res.json({
        success: true,
        data: {
          currentMetrics: {
            mrr,
            arr,
            ltv: unitEconomics.ltv,
            cac: unitEconomics.cac,
            ltvCacRatio: unitEconomics.ltvCacRatio,
            paybackPeriod: unitEconomics.paybackPeriod,
          },
          healthScore,
          snapshot: latestSnapshot,
          trends,
        },
      });
    } catch (error) {
      console.error('Error getting dashboard overview:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard overview',
      });
    }
  }

  /**
   * Get MRR breakdown
   */
  static async getMRRBreakdown(req: Request, res: Response): Promise<void> {
    try {
      const currentDate = new Date();
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      
      // Calculate MRR components
      const currentMRR = await FinancialService.calculateMRR(currentDate);
      const lastMonthMRR = await FinancialService.calculateMRR(lastMonthDate);
      const mrrGrowth = await FinancialService.calculateMRRGrowthRate();
      
      // Get new MRR (from new subscriptions)
      const newMRR = await Subscription.sum('billingAmount', {
        where: {
          createdAt: {
            [sequelize.Op.between]: [lastMonthDate, currentDate],
          },
          status: ['active', 'trialing'],
        },
      }) || 0;
      
      // Get expansion MRR (from upgrades)
      const expansionMRR = await sequelize.query(`
        SELECT SUM(
          CAST(s.billing_amount AS DECIMAL) - 
          CAST(s.metadata->>'previousAmount' AS DECIMAL)
        ) as expansion_mrr
        FROM subscriptions s
        WHERE s.upgraded_at BETWEEN :startDate AND :endDate
          AND s.status IN ('active', 'trialing')
      `, {
        replacements: { startDate: lastMonthDate, endDate: currentDate },
        type: sequelize.QueryTypes.SELECT,
      });
      
      // Get contraction MRR (from downgrades)
      const contractionMRR = await sequelize.query(`
        SELECT SUM(
          CAST(s.metadata->>'previousAmount' AS DECIMAL) - 
          CAST(s.billing_amount AS DECIMAL)
        ) as contraction_mrr
        FROM subscriptions s
        WHERE s.downgraded_at BETWEEN :startDate AND :endDate
          AND s.status IN ('active', 'trialing')
      `, {
        replacements: { startDate: lastMonthDate, endDate: currentDate },
        type: sequelize.QueryTypes.SELECT,
      });
      
      // Get churned MRR
      const churnedMRR = await sequelize.query(`
        SELECT SUM(billing_amount) as churned_mrr
        FROM subscriptions
        WHERE canceled_at BETWEEN :startDate AND :endDate
      `, {
        replacements: { startDate: lastMonthDate, endDate: currentDate },
        type: sequelize.QueryTypes.SELECT,
      });
      
      res.json({
        success: true,
        data: {
          currentMRR,
          lastMonthMRR,
          mrrGrowth,
          mrrGrowthRate: mrrGrowth,
          breakdown: {
            newMRR,
            expansionMRR: expansionMRR[0]?.expansion_mrr || 0,
            contractionMRR: contractionMRR[0]?.contraction_mrr || 0,
            churnedMRR: churnedMRR[0]?.churned_mrr || 0,
            netNewMRR: currentMRR - lastMonthMRR,
          },
          byPlan: await this.getMRRByPlan(),
        },
      });
    } catch (error) {
      console.error('Error getting MRR breakdown:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch MRR breakdown',
      });
    }
  }

  /**
   * Get P&L statement
   */
  static async getProfitLoss(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'Start date and end date are required',
        });
        return;
      }
      
      const profitLoss = await FinancialService.generateProfitLoss(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.json({
        success: true,
        data: profitLoss,
      });
    } catch (error) {
      console.error('Error generating P&L:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate profit & loss statement',
      });
    }
  }

  /**
   * Get cost breakdown
   */
  static async getCostBreakdown(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'Start date and end date are required',
        });
        return;
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      // Get costs by category
      const costsByCategory = await CostTracking.getCostsByCategory(start, end);
      
      // Get top vendors
      const topVendors = await sequelize.query(`
        SELECT 
          vendor,
          SUM(total_amount) as total_cost,
          COUNT(*) as transaction_count
        FROM cost_tracking
        WHERE billing_start_date BETWEEN :startDate AND :endDate
          AND status IN ('approved', 'paid')
        GROUP BY vendor
        ORDER BY total_cost DESC
        LIMIT 10
      `, {
        replacements: { startDate: start, endDate: end },
        type: sequelize.QueryTypes.SELECT,
      });
      
      // Get cost trends
      const costTrends = await sequelize.query(`
        SELECT 
          DATE_TRUNC('month', billing_start_date) as month,
          category,
          SUM(total_amount) as total_cost
        FROM cost_tracking
        WHERE billing_start_date >= :startDate
          AND status IN ('approved', 'paid')
        GROUP BY month, category
        ORDER BY month, category
      `, {
        replacements: { startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        type: sequelize.QueryTypes.SELECT,
      });
      
      // Calculate burn rate
      const burnRate = await FinancialService.calculateBurnRate();
      
      // Get cost optimization opportunities
      const optimizationOpportunities = await CostTracking.findOptimizationOpportunities();
      
      res.json({
        success: true,
        data: {
          totalCosts: Object.values(costsByCategory).reduce((sum, cost) => sum + cost, 0),
          costsByCategory,
          topVendors,
          costTrends,
          burnRate,
          monthlyBurn: burnRate,
          optimizationOpportunities: optimizationOpportunities.map(opp => ({
            id: opp.id,
            vendor: opp.vendor,
            category: opp.category,
            currentCost: opp.totalAmount,
            potentialSavings: opp.optimizationPotential?.savingsAmount || 0,
            recommendations: opp.optimizationPotential?.recommendations || [],
          })),
        },
      });
    } catch (error) {
      console.error('Error getting cost breakdown:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch cost breakdown',
      });
    }
  }

  /**
   * Get subscription metrics
   */
  static async getSubscriptionMetrics(req: Request, res: Response): Promise<void> {
    try {
      const currentDate = new Date();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Get subscription counts by status
      const subscriptionsByStatus = await Subscription.count({
        group: ['status'],
      });
      
      // Get churn rate
      const churnRate = await FinancialService.calculateChurnRate(thirtyDaysAgo, currentDate);
      
      // Get trial conversion rate
      const trialConversions = await sequelize.query(`
        SELECT 
          COUNT(CASE WHEN status = 'active' THEN 1 END) as converted,
          COUNT(*) as total_trials
        FROM subscriptions
        WHERE trial_end BETWEEN :startDate AND :endDate
      `, {
        replacements: { startDate: thirtyDaysAgo, endDate: currentDate },
        type: sequelize.QueryTypes.SELECT,
      });
      
      const trialConversionRate = trialConversions[0]?.total_trials > 0
        ? (trialConversions[0]?.converted / trialConversions[0]?.total_trials) * 100
        : 0;
      
      // Get LTV by plan
      const ltvByPlan = await sequelize.query(`
        SELECT 
          plan_type,
          AVG(EXTRACT(MONTH FROM AGE(
            COALESCE(canceled_at, CURRENT_DATE),
            start_date
          )) * billing_amount) as ltv
        FROM subscriptions
        WHERE status != 'trialing'
        GROUP BY plan_type
      `, {
        type: sequelize.QueryTypes.SELECT,
      });
      
      res.json({
        success: true,
        data: {
          activeSubscriptions: await Subscription.getActiveCount(),
          totalMRR: await Subscription.calculateTotalMRR(),
          churnRate,
          trialConversionRate,
          subscriptionsByStatus: subscriptionsByStatus.map(s => ({
            status: s.status,
            count: s.count,
          })),
          ltvByPlan,
          averageSubscriptionValue: await FinancialService.calculateARPU(thirtyDaysAgo, currentDate),
        },
      });
    } catch (error) {
      console.error('Error getting subscription metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription metrics',
      });
    }
  }

  /**
   * Get revenue forecast
   */
  static async getRevenueForecast(req: Request, res: Response): Promise<void> {
    try {
      const { months = 6 } = req.query;
      
      // Get latest forecast or generate new one
      let forecast = await RevenueAnalytics.getLatestForecast();
      
      if (!forecast || 
          new Date().getTime() - forecast.createdAt.getTime() > 7 * 24 * 60 * 60 * 1000) {
        // Generate new forecast if none exists or older than 7 days
        const forecastData = await RevenueAnalytics.generateForecast(Number(months));
        
        forecast = await RevenueAnalytics.create({
          analysisType: 'forecast',
          analysisName: `Revenue Forecast - ${new Date().toISOString().split('T')[0]}`,
          description: `${months} month revenue forecast`,
          periodType: 'monthly',
          startDate: new Date(),
          endDate: new Date(Date.now() + Number(months) * 30 * 24 * 60 * 60 * 1000),
          forecastData,
          insights: {
            summary: 'Revenue forecast generated using historical data',
            keyFindings: [],
            recommendations: [],
            risks: [],
            opportunities: [],
          },
          metrics: {
            totalRevenue: 0,
            growthRate: 0,
            avgOrderValue: 0,
            conversionRate: 0,
            retentionRate: 0,
            expansionRate: 0,
            netRevenueRetention: 0,
          },
          dataQuality: {
            completeness: 100,
            sampleSize: 12,
            confidenceScore: 0.85,
            dataIssues: [],
          },
          createdBy: req.user?.id || 'system',
          isPublished: true,
          tags: ['forecast', 'revenue'],
        });
      }
      
      res.json({
        success: true,
        data: {
          forecast: forecast.forecastData,
          accuracy: forecast.forecastData?.accuracy,
          method: forecast.forecastData?.method,
          lastUpdated: forecast.createdAt,
        },
      });
    } catch (error) {
      console.error('Error getting revenue forecast:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch revenue forecast',
      });
    }
  }

  /**
   * Get cohort analysis
   */
  static async getCohortAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { cohortMonth } = req.query;
      
      if (!cohortMonth) {
        res.status(400).json({
          success: false,
          error: 'Cohort month is required (YYYY-MM)',
        });
        return;
      }
      
      // Get or generate cohort analysis
      let analysis = await RevenueAnalytics.getCohortAnalysis(cohortMonth as string);
      
      if (!analysis) {
        // Generate cohort analysis
        const cohortStart = new Date(`${cohortMonth}-01`);
        const cohortEnd = new Date(cohortStart);
        cohortEnd.setMonth(cohortEnd.getMonth() + 1);
        cohortEnd.setDate(0);
        
        const cohortUsers = await Subscription.findAll({
          where: {
            createdAt: {
              [sequelize.Op.between]: [cohortStart, cohortEnd],
            },
          },
          attributes: ['userId', 'billingAmount'],
        });
        
        // Calculate retention rates for each month
        const retentionRates = [];
        const revenueByMonth = [];
        
        for (let month = 0; month <= 12; month++) {
          const checkDate = new Date(cohortStart);
          checkDate.setMonth(checkDate.getMonth() + month);
          
          const activeUsers = await Subscription.count({
            where: {
              userId: cohortUsers.map(u => u.userId),
              status: ['active', 'trialing'],
              currentPeriodStart: { [sequelize.Op.lte]: checkDate },
              currentPeriodEnd: { [sequelize.Op.gte]: checkDate },
            },
          });
          
          const monthRevenue = await Subscription.sum('billingAmount', {
            where: {
              userId: cohortUsers.map(u => u.userId),
              status: ['active', 'trialing'],
              currentPeriodStart: { [sequelize.Op.lte]: checkDate },
              currentPeriodEnd: { [sequelize.Op.gte]: checkDate },
            },
          }) || 0;
          
          retentionRates.push(cohortUsers.length > 0 ? activeUsers / cohortUsers.length : 0);
          revenueByMonth.push(monthRevenue);
        }
        
        analysis = await RevenueAnalytics.create({
          analysisType: 'cohort',
          analysisName: `Cohort Analysis - ${cohortMonth}`,
          description: `Revenue cohort analysis for ${cohortMonth}`,
          periodType: 'monthly',
          startDate: cohortStart,
          endDate: new Date(),
          cohortData: {
            cohortMonth: cohortMonth as string,
            cohortSize: cohortUsers.length,
            retentionRates,
            revenueByMonth,
            ltv: revenueByMonth.reduce((sum, rev) => sum + rev, 0) / cohortUsers.length,
            paybackPeriod: 0, // Calculate based on CAC
            avgRevenuePerUser: revenueByMonth.map((rev, i) => 
              cohortUsers.length > 0 ? rev / (cohortUsers.length * retentionRates[i]) : 0
            ),
            churnRates: retentionRates.map((rate, i) => 
              i === 0 ? 0 : 1 - (rate / retentionRates[i - 1])
            ),
            expansionRevenue: [], // Would calculate from upgrades
          },
          insights: {
            summary: `Cohort analysis for ${cohortMonth}`,
            keyFindings: [],
            recommendations: [],
            risks: [],
            opportunities: [],
          },
          metrics: {
            totalRevenue: revenueByMonth.reduce((sum, rev) => sum + rev, 0),
            growthRate: 0,
            avgOrderValue: 0,
            conversionRate: 0,
            retentionRate: retentionRates[retentionRates.length - 1],
            expansionRate: 0,
            netRevenueRetention: 0,
          },
          dataQuality: {
            completeness: 100,
            sampleSize: cohortUsers.length,
            confidenceScore: cohortUsers.length > 30 ? 0.95 : 0.7,
            dataIssues: [],
          },
          createdBy: req.user?.id || 'system',
          isPublished: true,
          tags: ['cohort', cohortMonth as string],
        });
      }
      
      res.json({
        success: true,
        data: {
          cohort: analysis.cohortData,
          insights: analysis.insights,
          createdAt: analysis.createdAt,
        },
      });
    } catch (error) {
      console.error('Error getting cohort analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch cohort analysis',
      });
    }
  }

  /**
   * Generate financial snapshot
   */
  static async generateSnapshot(req: Request, res: Response): Promise<void> {
    try {
      const { type = 'daily' } = req.body;
      
      let snapshot;
      
      switch (type) {
        case 'daily':
          snapshot = await FinancialService.generateDailySnapshot();
          break;
        case 'monthly':
          // Generate monthly snapshot
          // Implementation would be similar but with monthly aggregation
          break;
        default:
          res.status(400).json({
            success: false,
            error: 'Invalid snapshot type',
          });
          return;
      }
      
      res.json({
        success: true,
        data: snapshot,
      });
    } catch (error) {
      console.error('Error generating snapshot:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate financial snapshot',
      });
    }
  }

  /**
   * Helper: Get MRR by plan
   */
  private static async getMRRByPlan(): Promise<any[]> {
    const result = await sequelize.query(`
      SELECT 
        plan_type,
        plan_name,
        COUNT(*) as subscription_count,
        SUM(
          CASE 
            WHEN billing_interval = 'monthly' THEN billing_amount
            WHEN billing_interval = 'quarterly' THEN billing_amount / 3
            WHEN billing_interval = 'yearly' THEN billing_amount / 12
            ELSE 0
          END
        ) as mrr
      FROM subscriptions
      WHERE status IN ('active', 'trialing')
      GROUP BY plan_type, plan_name
      ORDER BY mrr DESC
    `, {
      type: sequelize.QueryTypes.SELECT,
    });
    
    return result;
  }
}

export default FinancialDashboardController; 