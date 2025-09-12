"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialDashboardController = void 0;
const date_fns_1 = require("date-fns");
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
const UnifiedEmailService_1 = __importDefault(require("../../services/email/UnifiedEmailService"));
const FinancialService_1 = require("../../services/financial/FinancialService");
const ReportingService_1 = require("../../services/financial/ReportingService");
const SchedulerService_1 = require("../../services/SchedulerService");
const apiError_1 = require("../../utils/apiError");
class FinancialDashboardController {
    async getDashboardMetrics(req, res) {
        try {
            const metrics = await FinancialService_1.financialService.getDashboardMetrics();
            res.json(metrics);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
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
            const totalCosts = costs.reduce((sum, cost) => sum + parseFloat(cost.get('total') || '0'), 0);
            res.json({
                total: totalCosts,
                byCategory: costs.reduce((acc, cost) => {
                    acc[cost.category] = parseFloat(cost.get('total') || '0');
                    return acc;
                }, {}),
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
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
    async getMRRMetrics(req, res) {
        try {
            const currentMRR = await FinancialService_1.financialService.calculateMRR();
            const lastMonthMRR = await FinancialService_1.financialService.calculateMRR((0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(new Date(), 1)));
            const growth = lastMonthMRR > 0 ? ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100 : 0;
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
    async getARRMetrics(req, res) {
        try {
            const arr = await FinancialService_1.financialService.calculateARR();
            res.json({ arr });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
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
    async getRevenueByCountry(req, res) {
        try {
            res.json([]);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getRevenueForecast(req, res) {
        try {
            const {} = req.query;
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
    async getLTVAnalytics(req, res) {
        try {
            const ltv = await FinancialService_1.financialService.calculateLTV();
            const arpu = await FinancialService_1.financialService.calculateARPU();
            res.json({
                ltv,
                arpu,
                avgLifetimeMonths: 24,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
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
    async createCost(req, res) {
        try {
            const cost = await models_1.CostTracking.create(req.body);
            res.status(201).json(cost);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
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
    async getCostOptimizationSuggestions(req, res) {
        try {
            res.json({
                suggestions: [],
                potentialSavings: 0,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
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
    async getLatestSnapshot(req, res) {
        try {
            const { period = 'daily' } = req.query;
            const snapshot = await models_1.FinancialSnapshot.findOne({
                where: { period: period },
                order: [['date', 'DESC']],
            });
            res.json(snapshot);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
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
    async createReport(req, res) {
        try {
            const report = await models_1.FinancialReport.create(req.body);
            res.status(201).json(report);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
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
    async downloadReport(req, res) {
        try {
            const { id } = req.params;
            const report = await models_1.FinancialReport.findByPk(id);
            if (!report) {
                throw new apiError_1.ApiError(404, 'Report not found');
            }
            res.status(501).json({ error: 'Not implemented' });
        }
        catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
    async sendReport(req, res) {
        try {
            const { id } = req.params;
            const {} = req.body;
            const report = await models_1.FinancialReport.findByPk(id);
            if (!report) {
                throw new apiError_1.ApiError(404, 'Report not found');
            }
            res.status(501).json({ error: 'Not implemented' });
        }
        catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
    async getCohortAnalysis(req, res) {
        try {
            const {} = req.query;
            res.json({
                cohorts: [],
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getCohortDetails(req, res) {
        try {
            const { month } = req.params;
            res.json({
                cohort: month,
                data: [],
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
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
    async getScheduledJobs(req, res) {
        try {
            const jobs = SchedulerService_1.SchedulerService.getJobStatus();
            res.json(jobs);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async startJob(req, res) {
        try {
            const { name } = req.params;
            res.json({
                success: true,
                message: `Job ${name} start requested`,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
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