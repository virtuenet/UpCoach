"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financialService = exports.FinancialService = void 0;
const date_fns_1 = require("date-fns");
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
class FinancialService {
    async calculateMRR(date = new Date()) {
        const activeSubscriptions = await models_1.Subscription.findAll({
            where: {
                status: [models_1.SubscriptionStatus.ACTIVE, models_1.SubscriptionStatus.TRIALING],
                currentPeriodEnd: { [sequelize_1.Op.gte]: date },
            },
        });
        return activeSubscriptions.reduce((total, sub) => {
            return total + sub.monthlyAmount;
        }, 0);
    }
    async calculateARR(date = new Date()) {
        const mrr = await this.calculateMRR(date);
        return mrr * 12;
    }
    async calculateChurnRate(startDate, endDate) {
        const [startCountResult] = (await models_1.sequelize.query(`SELECT COUNT(*) as count 
       FROM subscriptions 
       WHERE created_at <= :startDate 
       AND (canceled_at > :startDate OR canceled_at IS NULL)`, {
            replacements: { startDate },
            type: sequelize_1.QueryTypes.SELECT,
        }));
        const [churnedCountResult] = (await models_1.sequelize.query(`SELECT COUNT(*) as count 
       FROM subscriptions 
       WHERE canceled_at BETWEEN :startDate AND :endDate`, {
            replacements: { startDate, endDate },
            type: sequelize_1.QueryTypes.SELECT,
        }));
        const startCount = parseInt(startCountResult.count);
        const churnedCount = parseInt(churnedCountResult.count);
        return startCount > 0 ? (churnedCount / startCount) * 100 : 0;
    }
    async getRevenueByPlan(startDate, endDate) {
        const result = await models_1.sequelize.query(`SELECT 
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
      GROUP BY s.plan`, {
            replacements: { endDate },
            type: sequelize_1.QueryTypes.SELECT,
        });
        return result;
    }
    async calculateLTV(cohortMonth) {
        const avgRevenuePerUser = await this.calculateARPU();
        const avgLifetimeMonths = 24;
        return avgRevenuePerUser * avgLifetimeMonths;
    }
    async calculateARPU() {
        const mrr = await this.calculateMRR();
        const activeUsers = await models_1.Subscription.count({
            where: {
                status: [models_1.SubscriptionStatus.ACTIVE, models_1.SubscriptionStatus.TRIALING],
            },
        });
        return activeUsers > 0 ? mrr / activeUsers : 0;
    }
    async calculateCAC(startDate, endDate) {
        const marketingCosts = await models_1.CostTracking.sum('amount', {
            where: {
                category: 'marketing',
                periodStart: { [sequelize_1.Op.gte]: startDate },
                periodEnd: { [sequelize_1.Op.lte]: endDate },
            },
        });
        const newCustomers = await models_1.Subscription.count({
            where: {
                createdAt: {
                    [sequelize_1.Op.between]: [startDate, endDate],
                },
            },
        });
        return newCustomers > 0 ? (marketingCosts || 0) / newCustomers : 0;
    }
    async getDashboardMetrics() {
        const now = new Date();
        const monthStart = (0, date_fns_1.startOfMonth)(now);
        const lastMonthStart = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(now, 1));
        const lastMonthEnd = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(now, 1));
        const currentMRR = await this.calculateMRR();
        const lastMonthMRR = await this.calculateMRR(lastMonthEnd);
        const mrrGrowth = lastMonthMRR > 0 ? ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100 : 0;
        const revenue = await models_1.Transaction.sum('amount', {
            where: {
                status: models_1.TransactionStatus.COMPLETED,
                createdAt: { [sequelize_1.Op.gte]: monthStart },
            },
        });
        const totalCosts = await models_1.CostTracking.sum('amount', {
            where: {
                periodStart: { [sequelize_1.Op.gte]: monthStart },
            },
        });
        const activeSubscriptions = await models_1.Subscription.count({
            where: {
                status: [models_1.SubscriptionStatus.ACTIVE, models_1.SubscriptionStatus.TRIALING],
            },
        });
        const newSubscriptions = await models_1.Subscription.count({
            where: {
                createdAt: { [sequelize_1.Op.gte]: monthStart },
            },
        });
        const churnedSubscriptions = await models_1.Subscription.count({
            where: {
                canceledAt: { [sequelize_1.Op.gte]: monthStart },
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
                burnRate: totalCosts || 0,
                runway: 0,
            },
            profitLoss: {
                revenue: revenue || 0,
                costs: totalCosts || 0,
                grossProfit: (revenue || 0) - (totalCosts || 0),
                margin: revenue > 0 ? ((revenue - totalCosts) / revenue) * 100 : 0,
            },
        };
    }
    async generateDailySnapshot(date = new Date()) {
        const metrics = await this.getDashboardMetrics();
        const costsByCategory = await models_1.sequelize.query(`SELECT 
        category,
        SUM(amount) as total
      FROM cost_tracking
      WHERE period_start >= :monthStart
      GROUP BY category`, {
            replacements: { monthStart: (0, date_fns_1.startOfMonth)(date) },
            type: sequelize_1.QueryTypes.SELECT,
        });
        const costBreakdown = costsByCategory.reduce((acc, row) => {
            acc[row.category] = parseFloat(row.total);
            return acc;
        }, {});
        const snapshot = await models_1.FinancialSnapshot.create({
            date,
            period: models_1.SnapshotPeriod.DAILY,
            revenue: metrics.revenue.totalRevenue,
            recurringRevenue: metrics.revenue.mrr,
            mrr: metrics.revenue.mrr,
            arr: metrics.revenue.arr,
            totalCosts: metrics.costs.total,
            infrastructureCosts: costBreakdown.infrastructure || 0,
            apiCosts: costBreakdown.api_services || 0,
            personnelCosts: costBreakdown.personnel || 0,
            marketingCosts: costBreakdown.marketing || 0,
            operationalCosts: costBreakdown.operations || 0,
            grossProfit: metrics.profitLoss.grossProfit,
            netProfit: metrics.profitLoss.grossProfit,
            grossMargin: metrics.profitLoss.margin,
            netMargin: metrics.profitLoss.margin,
            activeCustomers: metrics.subscriptions.active,
            newCustomers: metrics.subscriptions.new,
            churnedCustomers: metrics.subscriptions.churned,
            churnRate: metrics.subscriptions.churnRate,
            avgRevenuePerUser: metrics.unitEconomics.arpu,
            customerAcquisitionCost: metrics.unitEconomics.cac,
            customerLifetimeValue: metrics.unitEconomics.ltv,
            ltvToCacRatio: metrics.unitEconomics.ltvToCacRatio,
        });
        return snapshot;
    }
    async getProfitLossStatement(startDate, endDate) {
        const revenue = await models_1.Transaction.sum('amount', {
            where: {
                status: models_1.TransactionStatus.COMPLETED,
                createdAt: { [sequelize_1.Op.between]: [startDate, endDate] },
            },
        });
        const refunds = await models_1.Transaction.sum('amount', {
            where: {
                status: models_1.TransactionStatus.REFUNDED,
                createdAt: { [sequelize_1.Op.between]: [startDate, endDate] },
            },
        });
        const costs = await models_1.sequelize.query(`SELECT 
        category,
        SUM(amount) as total
      FROM cost_tracking
      WHERE period_start >= :startDate
        AND period_end <= :endDate
      GROUP BY category`, {
            replacements: { startDate, endDate },
            type: sequelize_1.QueryTypes.SELECT,
        });
        const costsByCategory = costs.reduce((acc, row) => {
            acc[row.category] = parseFloat(row.total);
            return acc;
        }, {});
        const totalCosts = Object.values(costsByCategory).reduce((sum, cost) => sum + cost, 0);
        const netRevenue = (revenue || 0) - (refunds || 0);
        const grossProfit = netRevenue - (costsByCategory.api_services || 0);
        const operatingExpenses = totalCosts - (costsByCategory.api_services || 0);
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
    async getCostsByCategory(startDate, endDate) {
        const costs = await models_1.sequelize.query(`SELECT 
        category,
        SUM(amount) as total,
        COUNT(*) as count,
        AVG(amount) as average
      FROM cost_tracking
      WHERE period_start >= :startDate
        AND period_end <= :endDate
      GROUP BY category
      ORDER BY total DESC`, {
            replacements: { startDate, endDate },
            type: sequelize_1.QueryTypes.SELECT,
        });
        return costs.map((row) => ({
            category: row.category,
            total: parseFloat(row.total),
            count: parseInt(row.count),
            average: parseFloat(row.average),
            percentage: 0,
        }));
    }
    async getCostBreakdown(startDate, endDate) {
        const breakdown = await models_1.CostTracking.findAll({
            where: {
                periodStart: { [sequelize_1.Op.gte]: startDate },
                periodEnd: { [sequelize_1.Op.lte]: endDate },
            },
            attributes: [
                'category',
                'vendor',
                [models_1.sequelize.fn('SUM', models_1.sequelize.col('amount')), 'total'],
                [models_1.sequelize.fn('COUNT', models_1.sequelize.col('id')), 'count'],
                [models_1.sequelize.fn('AVG', models_1.sequelize.col('amount')), 'average'],
            ],
            group: ['category', 'vendor'],
            order: [[models_1.sequelize.fn('SUM', models_1.sequelize.col('amount')), 'DESC']],
        });
        const totalCosts = await models_1.CostTracking.sum('amount', {
            where: {
                periodStart: { [sequelize_1.Op.gte]: startDate },
                periodEnd: { [sequelize_1.Op.lte]: endDate },
            },
        });
        return breakdown.map((item) => ({
            category: item.category,
            vendor: item.vendor,
            total: parseFloat(item.get('total')),
            count: parseInt(item.get('count')),
            average: parseFloat(item.get('average')),
            percentage: totalCosts > 0 ? (parseFloat(item.get('total')) / totalCosts) * 100 : 0,
        }));
    }
}
exports.FinancialService = FinancialService;
exports.financialService = new FinancialService();
//# sourceMappingURL=FinancialService.js.map