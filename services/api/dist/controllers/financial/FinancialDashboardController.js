"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialDashboardController = void 0;
const FinancialService_1 = require("../../services/financial/FinancialService");
const models_1 = require("../../models");
const sequelize_1 = require("sequelize");
const date_fns_1 = require("date-fns");
const apiError_1 = require("../../utils/apiError");
const ReportingService_1 = require("../../services/financial/ReportingService");
const UnifiedEmailService_1 = __importDefault(require("../../services/email/UnifiedEmailService"));
const SchedulerService_1 = require("../../services/SchedulerService");
class FinancialDashboardController {
    /**
     * Get dashboard metrics
     */
    async getDashboardMetrics(req, res) {
        try {
            const metrics = await FinancialService_1.financialService.getDashboardMetrics();
            res.json(metrics);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get revenue metrics
     */
    async getRevenueMetrics(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : (0, date_fns_1.startOfMonth)(new Date());
            const end = endDate ? new Date(endDate) : (0, date_fns_1.endOfMonth)(new Date());
            const revenue = await models_1.Transaction.sum('amount', {
                where: {
                    status: 'completed',
                    createdAt: { [sequelize_1.Op.between]: [start, end] },
                },
            });
            const refunds = await models_1.Transaction.sum('amount', {
                where: {
                    status: 'refunded',
                    createdAt: { [sequelize_1.Op.between]: [start, end] },
                },
            });
            const netRevenue = (revenue || 0) - (refunds || 0);
            const mrr = await FinancialService_1.financialService.calculateMRR();
            const arr = await FinancialService_1.financialService.calculateARR();
            res.json({
                gross: revenue || 0,
                refunds: refunds || 0,
                net: netRevenue,
                mrr,
                arr,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get subscription metrics
     */
    async getSubscriptionMetrics(req, res) {
        try {
            const active = await models_1.Subscription.count({
                where: { status: ['active', 'trialing'] },
            });
            const new_subs = await models_1.Subscription.count({
                where: {
                    createdAt: { [sequelize_1.Op.gte]: (0, date_fns_1.startOfMonth)(new Date()) },
                },
            });
            const churned = await models_1.Subscription.count({
                where: {
                    canceledAt: { [sequelize_1.Op.gte]: (0, date_fns_1.startOfMonth)(new Date()) },
                },
            });
            const churnRate = await FinancialService_1.financialService.calculateChurnRate((0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 1)), new Date());
            res.json({
                active,
                new: new_subs,
                churned,
                churnRate,
                netNew: new_subs - churned,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get cost metrics
     */
    async getCostMetrics(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : (0, date_fns_1.startOfMonth)(new Date());
            const end = endDate ? new Date(endDate) : (0, date_fns_1.endOfMonth)(new Date());
            const costs = await models_1.CostTracking.findAll({
                attributes: [
                    'category',
                    [models_1.CostTracking.sequelize.fn('SUM', models_1.CostTracking.sequelize.col('amount')), 'total'],
                ],
                where: {
                    periodStart: { [sequelize_1.Op.gte]: start },
                    periodEnd: { [sequelize_1.Op.lte]: end },
                },
                group: ['category'],
            });
            const totalCosts = costs.reduce((sum, cost) => sum + parseFloat(cost.getDataValue('total')), 0);
            res.json({
                total: totalCosts,
                byCategory: costs.reduce((acc, cost) => {
                    acc[cost.category] = parseFloat(cost.getDataValue('total'));
                    return acc;
                }, {}),
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get P&L statement
     */
    async getProfitLossStatement(req, res) {
        try {
            const {} = req.params;
            const { startDate, endDate } = req.query;
            let start, end;
            if (startDate && endDate) {
                start = new Date(startDate);
                end = new Date(endDate);
            }
            else {
                // Default to current month
                start = (0, date_fns_1.startOfMonth)(new Date());
                end = (0, date_fns_1.endOfMonth)(new Date());
            }
            const pnl = await FinancialService_1.financialService.getProfitLossStatement(start, end);
            res.json(pnl);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get MRR metrics
     */
    async getMRRMetrics(req, res) {
        try {
            const currentMRR = await FinancialService_1.financialService.calculateMRR();
            const lastMonthMRR = await FinancialService_1.financialService.calculateMRR((0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(new Date(), 1)));
            const growth = lastMonthMRR > 0 ? ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100 : 0;
            // Get MRR breakdown
            const breakdown = await FinancialService_1.financialService.getRevenueByPlan((0, date_fns_1.startOfMonth)(new Date()), (0, date_fns_1.endOfMonth)(new Date()));
            res.json({
                current: currentMRR,
                previous: lastMonthMRR,
                growth,
                growthAmount: currentMRR - lastMonthMRR,
                breakdown,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get ARR metrics
     */
    async getARRMetrics(req, res) {
        try {
            const arr = await FinancialService_1.financialService.calculateARR();
            res.json({ arr });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get revenue by plan
     */
    async getRevenueByPlan(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : (0, date_fns_1.startOfMonth)(new Date());
            const end = endDate ? new Date(endDate) : (0, date_fns_1.endOfMonth)(new Date());
            const revenueByPlan = await FinancialService_1.financialService.getRevenueByPlan(start, end);
            res.json(revenueByPlan);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get revenue by country
     */
    async getRevenueByCountry(req, res) {
        try {
            // TODO: Implement revenue by country logic
            res.json([]);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get revenue forecast
     */
    async getRevenueForecast(req, res) {
        try {
            const {} = req.query;
            // TODO: Implement revenue forecasting logic
            res.json({
                forecast: [],
                accuracy: 0,
                confidence: 0,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get subscriptions
     */
    async getSubscriptions(req, res) {
        try {
            const { status, plan, page = 1, limit = 20 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const where = {};
            if (status)
                where.status = status;
            if (plan)
                where.plan = plan;
            const { count, rows } = await models_1.Subscription.findAndCountAll({
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get active subscriptions
     */
    async getActiveSubscriptions(req, res) {
        try {
            const subscriptions = await models_1.Subscription.findAll({
                where: {
                    status: ['active', 'trialing'],
                },
                order: [['createdAt', 'DESC']],
            });
            res.json(subscriptions);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get churn analytics
     */
    async getChurnAnalytics(req, res) {
        try {
            const { months = 12 } = req.query;
            const churnData = [];
            for (let i = Number(months) - 1; i >= 0; i--) {
                const monthStart = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), i));
                const monthEnd = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(new Date(), i));
                const churnRate = await FinancialService_1.financialService.calculateChurnRate(monthStart, monthEnd);
                churnData.push({
                    month: (0, date_fns_1.format)(monthStart, 'yyyy-MM'),
                    churnRate,
                });
            }
            res.json(churnData);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get LTV analytics
     */
    async getLTVAnalytics(req, res) {
        try {
            const ltv = await FinancialService_1.financialService.calculateLTV();
            const arpu = await FinancialService_1.financialService.calculateARPU();
            res.json({
                ltv,
                arpu,
                avgLifetimeMonths: 24, // This should be calculated from historical data
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get costs
     */
    async getCosts(req, res) {
        try {
            const { category, startDate, endDate, page = 1, limit = 20 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const where = {};
            if (category)
                where.category = category;
            if (startDate && endDate) {
                where.periodStart = { [sequelize_1.Op.gte]: new Date(startDate) };
                where.periodEnd = { [sequelize_1.Op.lte]: new Date(endDate) };
            }
            const { count, rows } = await models_1.CostTracking.findAndCountAll({
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Create cost
     */
    async createCost(req, res) {
        try {
            const cost = await models_1.CostTracking.create(req.body);
            res.status(201).json(cost);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Update cost
     */
    async updateCost(req, res) {
        try {
            const { id } = req.params;
            const cost = await models_1.CostTracking.findByPk(id);
            if (!cost) {
                throw new apiError_1.ApiError(404, 'Cost not found');
            }
            await cost.update(req.body);
            res.json(cost);
        }
        catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
    /**
     * Delete cost
     */
    async deleteCost(req, res) {
        try {
            const { id } = req.params;
            const cost = await models_1.CostTracking.findByPk(id);
            if (!cost) {
                throw new apiError_1.ApiError(404, 'Cost not found');
            }
            await cost.destroy();
            res.status(204).send();
        }
        catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
    /**
     * Get costs by category
     */
    async getCostsByCategory(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : (0, date_fns_1.startOfMonth)(new Date());
            const end = endDate ? new Date(endDate) : (0, date_fns_1.endOfMonth)(new Date());
            const costs = await models_1.CostTracking.findAll({
                attributes: [
                    'category',
                    [models_1.CostTracking.sequelize.fn('SUM', models_1.CostTracking.sequelize.col('amount')), 'total'],
                ],
                where: {
                    periodStart: { [sequelize_1.Op.gte]: start },
                    periodEnd: { [sequelize_1.Op.lte]: end },
                },
                group: ['category'],
            });
            res.json(costs);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get cost optimization suggestions
     */
    async getCostOptimizationSuggestions(req, res) {
        try {
            // TODO: Implement cost optimization logic
            res.json({
                suggestions: [],
                potentialSavings: 0,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get snapshots
     */
    async getSnapshots(req, res) {
        try {
            const { period, startDate, endDate } = req.query;
            const where = {};
            if (period)
                where.period = period;
            if (startDate && endDate) {
                where.date = { [sequelize_1.Op.between]: [new Date(startDate), new Date(endDate)] };
            }
            const snapshots = await models_1.FinancialSnapshot.findAll({
                where,
                order: [['date', 'DESC']],
            });
            res.json(snapshots);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Generate snapshot
     */
    async generateSnapshot(req, res) {
        try {
            const { date } = req.body;
            const snapshot = await FinancialService_1.financialService.generateDailySnapshot(date ? new Date(date) : new Date());
            res.status(201).json(snapshot);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get latest snapshot
     */
    async getLatestSnapshot(req, res) {
        try {
            const { period = 'daily' } = req.query;
            const snapshot = await models_1.FinancialSnapshot.findOne({
                where: { period },
                order: [['date', 'DESC']],
            });
            res.json(snapshot);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get reports
     */
    async getReports(req, res) {
        try {
            const { type, status, page = 1, limit = 20 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const where = {};
            if (type)
                where.type = type;
            if (status)
                where.status = status;
            const { count, rows } = await models_1.FinancialReport.findAndCountAll({
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Create report
     */
    async createReport(req, res) {
        try {
            const report = await models_1.FinancialReport.create(req.body);
            res.status(201).json(report);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get report
     */
    async getReport(req, res) {
        try {
            const { id } = req.params;
            const report = await models_1.FinancialReport.findByPk(id);
            if (!report) {
                throw new apiError_1.ApiError(404, 'Report not found');
            }
            res.json(report);
        }
        catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
    /**
     * Download report
     */
    async downloadReport(req, res) {
        try {
            const { id } = req.params;
            const report = await models_1.FinancialReport.findByPk(id);
            if (!report) {
                throw new apiError_1.ApiError(404, 'Report not found');
            }
            // TODO: Implement report download logic
            res.status(501).json({ error: 'Not implemented' });
        }
        catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
    /**
     * Send report
     */
    async sendReport(req, res) {
        try {
            const { id } = req.params;
            const {} = req.body;
            const report = await models_1.FinancialReport.findByPk(id);
            if (!report) {
                throw new apiError_1.ApiError(404, 'Report not found');
            }
            // TODO: Implement report sending logic
            res.status(501).json({ error: 'Not implemented' });
        }
        catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
    /**
     * Get cohort analysis
     */
    async getCohortAnalysis(req, res) {
        try {
            const {} = req.query;
            // TODO: Implement cohort analysis logic
            res.json({
                cohorts: [],
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get cohort details
     */
    async getCohortDetails(req, res) {
        try {
            const { month } = req.params;
            // TODO: Implement cohort details logic
            res.json({
                cohort: month,
                data: [],
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get unit economics
     */
    async getUnitEconomics(req, res) {
        try {
            const ltv = await FinancialService_1.financialService.calculateLTV();
            const cac = await FinancialService_1.financialService.calculateCAC((0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 3)), new Date());
            const arpu = await FinancialService_1.financialService.calculateARPU();
            res.json({
                ltv,
                cac,
                ltvToCacRatio: cac > 0 ? ltv / cac : 0,
                arpu,
                paybackPeriod: cac > 0 ? cac / arpu : 0,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get CAC
     */
    async getCAC(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate
                ? new Date(startDate)
                : (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 3));
            const end = endDate ? new Date(endDate) : new Date();
            const cac = await FinancialService_1.financialService.calculateCAC(start, end);
            res.json({ cac });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get LTV to CAC ratio
     */
    async getLTVtoCACRatio(req, res) {
        try {
            const ltv = await FinancialService_1.financialService.calculateLTV();
            const cac = await FinancialService_1.financialService.calculateCAC((0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 3)), new Date());
            res.json({
                ltv,
                cac,
                ratio: cac > 0 ? ltv / cac : 0,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get billing events
     */
    async getBillingEvents(req, res) {
        try {
            const { eventType, userId, page = 1, limit = 20 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const where = {};
            if (eventType)
                where.eventType = eventType;
            if (userId)
                where.userId = userId;
            const { count, rows } = await models_1.BillingEvent.findAndCountAll({
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Get billing event
     */
    async getBillingEvent(req, res) {
        try {
            const { id } = req.params;
            const event = await models_1.BillingEvent.findByPk(id);
            if (!event) {
                throw new apiError_1.ApiError(404, 'Billing event not found');
            }
            res.json(event);
        }
        catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
    /**
     * Get automation status
     */
    async getAutomationStatus(req, res) {
        try {
            const jobs = SchedulerService_1.SchedulerService.getJobStatus();
            const lastReports = await models_1.FinancialReport.findAll({
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Trigger automation manually
     */
    async triggerAutomation(req, res) {
        try {
            const { type } = req.params;
            switch (type) {
                case 'daily-snapshot':
                    await ReportingService_1.reportingService.generateDailySnapshot();
                    break;
                case 'weekly-report':
                    await ReportingService_1.reportingService.generateScheduledReports();
                    break;
                case 'cost-analysis':
                    // Trigger cost analysis
                    break;
                default:
                    throw new apiError_1.ApiError(400, 'Invalid automation type');
            }
            res.json({
                success: true,
                message: `${type} automation triggered successfully`,
            });
        }
        catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
    /**
     * Send test email
     */
    async sendTestEmail(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                throw new apiError_1.ApiError(400, 'Email address is required');
            }
            await UnifiedEmailService_1.default.send({
                to: email,
                subject: 'Test Email from Financial Dashboard',
                text: 'This is a test email to verify email service is working correctly.',
            });
            res.json({
                success: true,
                message: `Test email sent to ${email}`,
            });
        }
        catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
    /**
     * Get scheduled jobs
     */
    async getScheduledJobs(req, res) {
        try {
            const jobs = SchedulerService_1.SchedulerService.getJobStatus();
            res.json(jobs);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Start a job
     */
    async startJob(req, res) {
        try {
            const { name } = req.params;
            // Note: This would need to be implemented in SchedulerService
            res.json({
                success: true,
                message: `Job ${name} start requested`,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Stop a job
     */
    async stopJob(req, res) {
        try {
            const { name } = req.params;
            const stopped = SchedulerService_1.SchedulerService.stopJob(name);
            res.json({
                success: stopped,
                message: stopped ? `Job ${name} stopped` : `Job ${name} not found`,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.FinancialDashboardController = FinancialDashboardController;
//# sourceMappingURL=FinancialDashboardController.js.map