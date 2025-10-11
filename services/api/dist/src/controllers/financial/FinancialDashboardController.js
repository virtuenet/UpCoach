"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialDashboardController = void 0;
const date_fns_1 = require("date-fns");
const sequelize_1 = require("sequelize");
require("../../types/express");
const ExcelJS = __importStar(require("exceljs"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const models_1 = require("../../models");
const UnifiedEmailService_1 = __importDefault(require("../../services/email/UnifiedEmailService"));
const FinancialService_1 = require("../../services/financial/FinancialService");
const ReportingService_1 = require("../../services/financial/ReportingService");
const SchedulerService_1 = require("../../services/SchedulerService");
const apiError_1 = require("../../utils/apiError");
const logger_1 = require("../../utils/logger");
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
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 12));
            const end = endDate ? new Date(endDate) : (0, date_fns_1.endOfMonth)(new Date());
            const revenueByCountry = await models_1.Transaction.findAll({
                attributes: [
                    'country',
                    [models_1.Transaction.sequelize.fn('SUM', models_1.Transaction.sequelize.col('amount')), 'totalRevenue'],
                    [models_1.Transaction.sequelize.fn('COUNT', models_1.Transaction.sequelize.col('id')), 'transactionCount'],
                ],
                where: {
                    status: 'completed',
                    createdAt: { [sequelize_1.Op.between]: [start, end] },
                    country: { [sequelize_1.Op.not]: null },
                },
                group: ['country'],
                order: [[models_1.Transaction.sequelize.literal('totalRevenue'), 'DESC']],
            });
            const formattedData = revenueByCountry.map((record) => ({
                country: record.country,
                revenue: parseFloat(record.get('totalRevenue') || '0'),
                transactions: parseInt(record.get('transactionCount') || '0'),
                percentage: 0,
            }));
            const totalRevenue = formattedData.reduce((sum, item) => sum + item.revenue, 0);
            formattedData.forEach(item => {
                item.percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
            });
            res.json({
                countries: formattedData,
                total: totalRevenue,
                period: { start, end },
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getRevenueForecast(req, res) {
        try {
            const { months = 6 } = req.query;
            const forecastMonths = parseInt(months);
            const historicalData = [];
            for (let i = 11; i >= 0; i--) {
                const monthStart = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), i));
                const monthEnd = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(new Date(), i));
                const revenue = await models_1.Transaction.sum('amount', {
                    where: {
                        status: 'completed',
                        createdAt: { [sequelize_1.Op.between]: [monthStart, monthEnd] },
                    },
                });
                historicalData.push({
                    month: (0, date_fns_1.format)(monthStart, 'yyyy-MM'),
                    revenue: revenue || 0,
                    date: monthStart,
                });
            }
            const forecast = this.calculateLinearRegression(historicalData, forecastMonths);
            const accuracy = this.calculateForecastAccuracy(historicalData);
            const confidence = this.calculateForecastConfidence(historicalData);
            res.json({
                historical: historicalData,
                forecast: forecast.map(f => ({
                    month: f.month,
                    predictedRevenue: Math.max(0, f.revenue),
                    confidence: confidence,
                })),
                accuracy,
                confidence,
                algorithm: 'Linear Regression',
                basedOnMonths: historicalData.length,
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    calculateLinearRegression(data, forecastMonths) {
        const n = data.length;
        const x = data.map((_, index) => index);
        const y = data.map(d => d.revenue);
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
        const sumXX = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        const forecast = [];
        for (let i = 1; i <= forecastMonths; i++) {
            const futureDate = (0, date_fns_1.subMonths)(new Date(), -i);
            const predictedRevenue = slope * (n + i - 1) + intercept;
            forecast.push({
                month: (0, date_fns_1.format)(futureDate, 'yyyy-MM'),
                revenue: Math.round(predictedRevenue * 100) / 100,
                date: futureDate,
            });
        }
        return forecast;
    }
    calculateForecastAccuracy(data) {
        if (data.length < 3)
            return 50;
        const revenues = data.map(d => d.revenue);
        const n = revenues.length;
        const mean = revenues.reduce((a, b) => a + b, 0) / n;
        let totalSumSquares = 0;
        let residualSumSquares = 0;
        for (let i = 0; i < n; i++) {
            totalSumSquares += Math.pow(revenues[i] - mean, 2);
            const predicted = mean + ((i - n / 2) * (revenues[n - 1] - revenues[0]) / n);
            residualSumSquares += Math.pow(revenues[i] - predicted, 2);
        }
        const rSquared = 1 - (residualSumSquares / totalSumSquares);
        return Math.max(0, Math.min(100, rSquared * 100));
    }
    calculateForecastConfidence(data) {
        if (data.length < 3)
            return 60;
        const revenues = data.map(d => d.revenue);
        const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
        const variance = revenues.reduce((sum, revenue) => sum + Math.pow(revenue - mean, 2), 0) / revenues.length;
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = standardDeviation / mean;
        const confidence = Math.max(50, Math.min(95, 90 - (coefficientOfVariation * 100)));
        return Math.round(confidence);
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
            const suggestions = await this.generateCostOptimizationSuggestions();
            const potentialSavings = suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);
            res.json({
                suggestions,
                potentialSavings,
                optimizationScore: this.calculateOptimizationScore(suggestions),
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
            const { format = 'pdf' } = req.query;
            if (!['pdf', 'excel', 'csv'].includes(format)) {
                throw new apiError_1.ApiError(400, 'Invalid format. Supported formats: pdf, excel, csv');
            }
            const report = await models_1.FinancialReport.findByPk(id);
            if (!report) {
                throw new apiError_1.ApiError(404, 'Report not found');
            }
            logger_1.logger.info('Report export requested', {
                reportId: id,
                format,
                reportType: report.type,
                requestTime: new Date().toISOString(),
            });
            if (format === 'csv') {
                await this.generateCSVReport(report, res);
            }
            else if (format === 'excel') {
                await this.generateExcelReport(report, res);
            }
            else {
                await this.generatePDFReport(report, res);
            }
            logger_1.logger.info('Report export completed successfully', {
                reportId: id,
                format,
                reportType: report.type,
                completionTime: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error('Report export failed', {
                reportId: req.params.id,
                format: req.query.format,
                error: error.message,
                stack: error.stack
            });
            res.status(error.statusCode || 500).json({
                error: error.message,
                code: 'EXPORT_FAILED'
            });
        }
    }
    async generateCSVReport(report, res) {
        const data = await this.getReportData(report.type, report.parameters);
        const csvContent = this.convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${report.name}_${(0, date_fns_1.format)(new Date(), 'yyyy-MM-dd')}.csv"`);
        res.send(csvContent);
    }
    async generateExcelReport(report, res) {
        try {
            const validation = this.validateExportParams(report.parameters);
            if (!validation.isValid) {
                throw new apiError_1.ApiError(400, `Invalid parameters: ${validation.errors.join(', ')}`);
            }
            const data = await this.getReportData(report.type, report.parameters);
            if (!data || data.length === 0) {
                throw new apiError_1.ApiError(400, 'No data available for export');
            }
            if (!this.validateDataSize(data, 'excel')) {
                throw new apiError_1.ApiError(413, 'Report data is too large to export as Excel. Please reduce the date range or use CSV format.');
            }
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'UpCoach Financial Dashboard';
            workbook.lastModifiedBy = 'System';
            workbook.created = new Date();
            workbook.modified = new Date();
            const worksheet = workbook.addWorksheet(`${report.name} Report`);
            const headerStyle = {
                font: { bold: true, color: { argb: 'FFFFFF' } },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '366EF7' } },
                border: {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                },
                alignment: { horizontal: 'center', vertical: 'middle' }
            };
            worksheet.mergeCells('A1:E1');
            worksheet.getCell('A1').value = `${report.name} - Financial Report`;
            worksheet.getCell('A1').style = {
                font: { size: 16, bold: true },
                alignment: { horizontal: 'center' }
            };
            worksheet.mergeCells('A2:E2');
            worksheet.getCell('A2').value = `Generated on: ${(0, date_fns_1.format)(new Date(), 'PPP')}`;
            worksheet.getCell('A2').style = {
                font: { size: 12 },
                alignment: { horizontal: 'center' }
            };
            const headers = Object.keys(data[0]);
            const headerRow = worksheet.addRow([]);
            headers.forEach((header, index) => {
                const cell = worksheet.getCell(4, index + 1);
                cell.value = this.formatHeaderName(header);
                cell.style = headerStyle;
            });
            data.forEach((row, rowIndex) => {
                const dataRow = worksheet.addRow([]);
                headers.forEach((header, colIndex) => {
                    const cell = worksheet.getCell(rowIndex + 5, colIndex + 1);
                    let value = row[header];
                    if (header.includes('amount') || header.includes('revenue') || header.includes('cost')) {
                        value = typeof value === 'number' ? value : parseFloat(value || '0');
                    }
                    else if (header.includes('date') || header.includes('At')) {
                        value = value ? new Date(value) : '';
                    }
                    cell.value = value;
                    if (typeof value === 'number' && (header.includes('amount') || header.includes('revenue') || header.includes('cost'))) {
                        cell.numFmt = '$#,##0.00';
                    }
                    else if (value instanceof Date) {
                        cell.numFmt = 'mm/dd/yyyy';
                    }
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });
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
            if (report.type === 'revenue' && data.length > 0) {
                const summaryRow = worksheet.addRow([]);
                summaryRow.getCell(1).value = 'Total Revenue:';
                summaryRow.getCell(1).style = { font: { bold: true } };
                const totalRevenue = data.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
                summaryRow.getCell(2).value = totalRevenue;
                summaryRow.getCell(2).numFmt = '$#,##0.00';
                summaryRow.getCell(2).style = { font: { bold: true } };
            }
            const baseFilename = `${report.name}_${(0, date_fns_1.format)(new Date(), 'yyyy-MM-dd')}.xlsx`;
            const sanitizedFilename = this.sanitizeFilename(baseFilename);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
            await workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            logger_1.logger.error('Error generating Excel report:', error);
            res.status(500).json({ error: 'Failed to generate Excel report' });
        }
    }
    async generatePDFReport(report, res) {
        try {
            const validation = this.validateExportParams(report.parameters);
            if (!validation.isValid) {
                throw new apiError_1.ApiError(400, `Invalid parameters: ${validation.errors.join(', ')}`);
            }
            const data = await this.getReportData(report.type, report.parameters);
            if (!data || data.length === 0) {
                throw new apiError_1.ApiError(400, 'No data available for export');
            }
            if (!this.validateDataSize(data, 'pdf')) {
                throw new apiError_1.ApiError(413, 'Report data is too large to export as PDF. Please reduce the date range or use CSV format.');
            }
            const htmlContent = this.generatePDFHTML(report, data);
            const browser = await puppeteer_1.default.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
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
            Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on ${(0, date_fns_1.format)(new Date(), 'PPP')}
          </div>
        `
            });
            await browser.close();
            const baseFilename = `${report.name}_${(0, date_fns_1.format)(new Date(), 'yyyy-MM-dd')}.pdf`;
            const sanitizedFilename = this.sanitizeFilename(baseFilename);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.send(pdfBuffer);
        }
        catch (error) {
            logger_1.logger.error('Error generating PDF report:', error);
            res.status(500).json({ error: 'Failed to generate PDF report' });
        }
    }
    async getReportData(reportType, parameters) {
        switch (reportType) {
            case 'revenue':
                return await this.getRevenueReportData(parameters);
            case 'subscriptions':
                return await this.getSubscriptionReportData(parameters);
            default:
                return [];
        }
    }
    async getRevenueReportData(parameters) {
        const { startDate, endDate } = parameters;
        const transactions = await models_1.Transaction.findAll({
            where: {
                status: 'completed',
                createdAt: { [sequelize_1.Op.between]: [new Date(startDate), new Date(endDate)] },
            },
            order: [['createdAt', 'DESC']],
        });
        return transactions.map(t => ({
            date: (0, date_fns_1.format)(new Date(t.createdAt), 'yyyy-MM-dd HH:mm:ss'),
            amount: t.amount,
            currency: t.currency,
            status: t.status,
            country: t.country,
            paymentMethod: t.paymentMethod,
        }));
    }
    async getSubscriptionReportData(parameters) {
        const { startDate, endDate } = parameters;
        const subscriptions = await models_1.Subscription.findAll({
            where: {
                createdAt: { [sequelize_1.Op.between]: [new Date(startDate), new Date(endDate)] },
            },
            order: [['createdAt', 'DESC']],
        });
        return subscriptions.map(s => ({
            date: (0, date_fns_1.format)(new Date(s.createdAt), 'yyyy-MM-dd HH:mm:ss'),
            plan: s.plan,
            status: s.status,
            amount: s.amount,
            currency: s.currency,
            interval: s.billingInterval,
            canceledAt: s.canceledAt ? (0, date_fns_1.format)(new Date(s.canceledAt), 'yyyy-MM-dd HH:mm:ss') : null,
        }));
    }
    convertToCSV(data) {
        if (!data.length)
            return '';
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value || '';
            }).join(','))
        ];
        return csvRows.join('\n');
    }
    async sendReport(req, res) {
        try {
            const { id } = req.params;
            const { recipients, format = 'pdf', message, subject } = req.body;
            if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
                throw new apiError_1.ApiError(400, 'Recipients array is required and must not be empty');
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const invalidEmails = recipients.filter((email) => !emailRegex.test(email));
            if (invalidEmails.length > 0) {
                throw new apiError_1.ApiError(400, `Invalid email addresses: ${invalidEmails.join(', ')}`);
            }
            const report = await models_1.FinancialReport.findByPk(id);
            if (!report) {
                throw new apiError_1.ApiError(404, 'Report not found');
            }
            if (!['pdf', 'excel', 'csv'].includes(format)) {
                throw new apiError_1.ApiError(400, 'Invalid format. Supported formats: pdf, excel, csv');
            }
            const reportData = await this.getReportData(report.type, report.parameters);
            if (!reportData || reportData.length === 0) {
                throw new apiError_1.ApiError(400, 'No data available in report to send');
            }
            if (!this.validateDataSize(reportData, format)) {
                throw new apiError_1.ApiError(413, 'Report data is too large to send via email. Please reduce the date range.');
            }
            let attachmentBuffer;
            let filename;
            let contentType;
            if (format === 'pdf') {
                const browser = await puppeteer_1.default.launch({
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
            }
            else if (format === 'excel') {
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet(`${report.name} Report`);
                const headers = Object.keys(reportData[0]);
                worksheet.addRow(headers);
                reportData.forEach(row => {
                    const values = headers.map(header => row[header]);
                    worksheet.addRow(values);
                });
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
            }
            else {
                const csvContent = this.convertToCSV(reportData);
                attachmentBuffer = Buffer.from(csvContent, 'utf8');
                filename = `${report.name}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                contentType = 'text/csv';
            }
            const emailSubject = subject || `Financial Report: ${report.name}`;
            const emailMessage = message || `Please find attached the ${report.name} financial report generated on ${format(new Date(), 'PPP')}.`;
            const emailPromises = recipients.map(async (email) => {
                try {
                    await UnifiedEmailService_1.default.send({
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
                    logger_1.logger.info('Report sent successfully', {
                        reportId: id,
                        recipient: email,
                        format,
                        filename,
                        reportType: report.type
                    });
                    return { email, success: true };
                }
                catch (emailError) {
                    logger_1.logger.error('Failed to send report email', {
                        reportId: id,
                        recipient: email,
                        error: emailError.message
                    });
                    return { email, success: false, error: emailError.message };
                }
            });
            const results = await Promise.all(emailPromises);
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            await report.update({
                status: 'sent',
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
        }
        catch (error) {
            logger_1.logger.error('Report sending failed', {
                reportId: req.params.id,
                error: error.message,
                stack: error.stack
            });
            res.status(error.statusCode || 500).json({
                error: error.message,
                code: 'SEND_FAILED'
            });
        }
    }
    async getCohortAnalysis(req, res) {
        try {
            const { months = 12 } = req.query;
            const analysisMonths = parseInt(months);
            const cohorts = [];
            for (let i = analysisMonths - 1; i >= 0; i--) {
                const cohortStart = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), i));
                const cohortEnd = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(new Date(), i));
                const cohortSubscriptions = await models_1.Subscription.findAll({
                    where: {
                        createdAt: { [sequelize_1.Op.between]: [cohortStart, cohortEnd] },
                    },
                    attributes: ['id', 'userId', 'createdAt', 'canceledAt'],
                });
                if (cohortSubscriptions.length === 0) {
                    cohorts.push({
                        month: (0, date_fns_1.format)(cohortStart, 'yyyy-MM'),
                        totalUsers: 0,
                        retention: [],
                    });
                    continue;
                }
                const retention = [];
                for (let j = 0; j <= Math.min(11, Math.floor((new Date().getTime() - cohortStart.getTime()) / (30.44 * 24 * 60 * 60 * 1000))); j++) {
                    const retentionMonth = (0, date_fns_1.subMonths)(cohortStart, -j);
                    const retentionMonthEnd = (0, date_fns_1.endOfMonth)(retentionMonth);
                    let activeUsers = 0;
                    for (const subscription of cohortSubscriptions) {
                        const subStart = new Date(subscription.createdAt);
                        const subEnd = subscription.canceledAt ? new Date(subscription.canceledAt) : new Date();
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
                    month: (0, date_fns_1.format)(cohortStart, 'yyyy-MM'),
                    totalUsers: cohortSubscriptions.length,
                    retention,
                });
            }
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
                    start: (0, date_fns_1.format)((0, date_fns_1.subMonths)(new Date(), analysisMonths - 1), 'yyyy-MM'),
                    end: (0, date_fns_1.format)(new Date(), 'yyyy-MM'),
                },
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getCohortDetails(req, res) {
        try {
            const { month } = req.params;
            const monthRegex = /^\d{4}-\d{2}$/;
            if (!monthRegex.test(month)) {
                throw new apiError_1.ApiError(400, 'Invalid month format. Expected format: YYYY-MM');
            }
            const cohortDate = new Date(`${month}-01`);
            if (isNaN(cohortDate.getTime())) {
                throw new apiError_1.ApiError(400, 'Invalid month value');
            }
            const cohortStart = (0, date_fns_1.startOfMonth)(cohortDate);
            const cohortEnd = (0, date_fns_1.endOfMonth)(cohortDate);
            const cohortSubscriptions = await models_1.Subscription.findAll({
                where: {
                    createdAt: { [sequelize_1.Op.between]: [cohortStart, cohortEnd] },
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
            const usersDetails = await Promise.all(cohortSubscriptions.map(async (subscription) => {
                const userRevenue = await models_1.Transaction.sum('amount', {
                    where: {
                        userId: subscription.userId,
                        status: 'completed',
                        createdAt: { [sequelize_1.Op.gte]: cohortStart }
                    }
                });
                const endDate = subscription.canceledAt
                    ? new Date(subscription.canceledAt)
                    : new Date();
                const lifetimeMonths = Math.max(1, Math.ceil((endDate.getTime() - new Date(subscription.createdAt).getTime()) / (30.44 * 24 * 60 * 60 * 1000)));
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
            }));
            const retentionByMonth = [];
            const currentDate = new Date();
            const maxMonths = Math.min(24, Math.ceil((currentDate.getTime() - cohortStart.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));
            for (let monthIndex = 0; monthIndex <= maxMonths; monthIndex++) {
                const retentionDate = new Date(cohortStart);
                retentionDate.setMonth(retentionDate.getMonth() + monthIndex);
                const retentionMonthEnd = (0, date_fns_1.endOfMonth)(retentionDate);
                const activeUsersInMonth = usersDetails.filter(user => {
                    const userStart = new Date(user.joinedAt);
                    const userEnd = user.canceledAt ? new Date(user.canceledAt) : currentDate;
                    return userStart <= retentionMonthEnd && userEnd >= (0, date_fns_1.startOfMonth)(retentionDate);
                });
                const retentionRate = (activeUsersInMonth.length / cohortSubscriptions.length) * 100;
                retentionByMonth.push({
                    monthIndex,
                    month: (0, date_fns_1.format)(retentionDate, 'yyyy-MM'),
                    activeUsers: activeUsersInMonth.length,
                    retentionRate: Math.round(retentionRate * 100) / 100,
                    churnedUsers: cohortSubscriptions.length - activeUsersInMonth.length,
                    churnRate: Math.round((100 - retentionRate) * 100) / 100
                });
            }
            const planDistribution = cohortSubscriptions.reduce((acc, sub) => {
                const plan = sub.plan || 'Unknown';
                if (!acc[plan]) {
                    acc[plan] = { count: 0, revenue: 0 };
                }
                acc[plan].count += 1;
                acc[plan].revenue += Number(sub.amount) || 0;
                return acc;
            }, {});
            const planDistributionArray = Object.entries(planDistribution).map(([plan, data]) => ({
                plan,
                users: data.count,
                percentage: Math.round((data.count / cohortSubscriptions.length) * 10000) / 100,
                monthlyRevenue: data.revenue,
                averageRevenuePerUser: Math.round((data.revenue / data.count) * 100) / 100
            }));
            const activeUsers = usersDetails.filter(user => user.isActive).length;
            const churnedUsers = usersDetails.filter(user => !user.isActive).length;
            const currentChurnRate = Math.round((churnedUsers / cohortSubscriptions.length) * 10000) / 100;
            const totalCohortRevenue = usersDetails.reduce((sum, user) => sum + user.totalRevenue, 0);
            const revenuePerUser = Math.round((totalCohortRevenue / cohortSubscriptions.length) * 100) / 100;
            const averageLifetimeMonths = Math.round((usersDetails.reduce((sum, user) => sum + user.lifetimeMonths, 0) / usersDetails.length) * 100) / 100;
            const averageRetentionRate = retentionByMonth.length > 0
                ? Math.round((retentionByMonth.reduce((sum, month) => sum + month.retentionRate, 0) / retentionByMonth.length) * 100) / 100
                : 0;
            const topUsersDetails = usersDetails
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, 10);
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
        }
        catch (error) {
            logger_1.logger.error('Error getting cohort details', {
                month: req.params.month,
                error: error.message,
                stack: error.stack
            });
            res.status(error.statusCode || 500).json({
                error: error.message,
                code: 'COHORT_DETAILS_ERROR'
            });
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
    async generateCostOptimizationSuggestions() {
        const suggestions = [];
        try {
            const { CostTracking } = await Promise.resolve().then(() => __importStar(require('../../models/financial/CostTracking')));
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            const costs = await CostTracking.findAll({
                where: {
                    periodStart: { [sequelize_1.Op.gte]: threeMonthsAgo }
                },
                order: [['periodStart', 'DESC']]
            });
            const costsByCategory = costs.reduce((acc, cost) => {
                const category = cost.category;
                if (!acc[category]) {
                    acc[category] = { total: 0, count: 0, recent: 0 };
                }
                acc[category].total += Number(cost.amount);
                acc[category].count += 1;
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                if (cost.periodStart >= lastMonth) {
                    acc[category].recent += Number(cost.amount);
                }
                return acc;
            }, {});
            for (const [category, data] of Object.entries(costsByCategory)) {
                const avgMonthlyCost = data.total / 3;
                const recentMonthlyCost = data.recent;
                if (recentMonthlyCost > avgMonthlyCost * 1.5) {
                    suggestions.push({
                        category,
                        suggestion: `${category} costs have increased by ${((recentMonthlyCost / avgMonthlyCost - 1) * 100).toFixed(1)}% recently`,
                        impact: 'high',
                        potentialSavings: recentMonthlyCost - avgMonthlyCost,
                        implementation: 'Review recent usage patterns and optimize configuration',
                        timeframe: '1-2 weeks'
                    });
                }
                switch (category) {
                    case 'OPENAI':
                        if (avgMonthlyCost > 500) {
                            suggestions.push({
                                category,
                                suggestion: 'Consider implementing request caching and prompt optimization',
                                impact: 'medium',
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
                                impact: 'high',
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
                                impact: 'low',
                                potentialSavings: avgMonthlyCost * 0.1,
                                implementation: 'Contact Stripe for volume pricing options',
                                timeframe: '2-4 weeks'
                            });
                        }
                        break;
                }
            }
            if (suggestions.length === 0) {
                suggestions.push({
                    category: 'General',
                    suggestion: 'Your cost patterns look stable. Consider setting up budget alerts.',
                    impact: 'low',
                    potentialSavings: 0,
                    implementation: 'Set up automated budget monitoring and alerts',
                    timeframe: '1 week'
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error generating cost optimization suggestions:', error);
            suggestions.push({
                category: 'General',
                suggestion: 'Unable to analyze current costs. Consider implementing cost tracking.',
                impact: 'medium',
                potentialSavings: 0,
                implementation: 'Set up comprehensive cost tracking and monitoring',
                timeframe: '2-3 weeks'
            });
        }
        return suggestions;
    }
    calculateOptimizationScore(suggestions) {
        if (suggestions.length === 0)
            return 100;
        const totalPotentialSavings = suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);
        const highImpactCount = suggestions.filter(s => s.impact === 'high').length;
        const mediumImpactCount = suggestions.filter(s => s.impact === 'medium').length;
        let score = 100;
        score -= Math.min(30, totalPotentialSavings / 100);
        score -= highImpactCount * 10;
        score -= mediumImpactCount * 5;
        return Math.max(0, Math.round(score));
    }
    formatHeaderName(header) {
        return header
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/id/i, 'ID')
            .replace(/at$/i, 'Date')
            .trim();
    }
    generatePDFHTML(report, data) {
        const headers = Object.keys(data[0]);
        let summaryHTML = '';
        if (report.type === 'revenue') {
            const totalRevenue = data.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
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
        }
        else if (report.type === 'subscriptions') {
            const activeSubscriptions = data.filter(row => row.status === 'active').length;
            const canceledSubscriptions = data.filter(row => row.canceledAt).length;
            const totalRevenue = data.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
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
        const tableRows = data.map(row => {
            const cells = headers.map(header => {
                let value = row[header];
                if (header.includes('amount') || header.includes('revenue') || header.includes('cost')) {
                    value = typeof value === 'number' ?
                        `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` :
                        `$${parseFloat(value || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                }
                else if (header.includes('date') || header.includes('At')) {
                    value = value ? (0, date_fns_1.format)(new Date(value), 'MM/dd/yyyy HH:mm') : '';
                }
                else if (typeof value === 'boolean') {
                    value = value ? 'Yes' : 'No';
                }
                else if (value === null || value === undefined) {
                    value = '';
                }
                return `<td>${value}</td>`;
            }).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
        const tableHeaders = headers.map(header => `<th>${this.formatHeaderName(header)}</th>`).join('');
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
            <p class="subtitle">Generated on ${(0, date_fns_1.format)(new Date(), 'PPP pp')}</p>
            <p class="subtitle">Report Period: ${report.parameters?.startDate ? (0, date_fns_1.format)(new Date(report.parameters.startDate), 'PP') : 'N/A'} to ${report.parameters?.endDate ? (0, date_fns_1.format)(new Date(report.parameters.endDate), 'PP') : 'N/A'}</p>
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
    validateExportParams(params) {
        const errors = [];
        if (!params) {
            errors.push('Parameters are required');
            return { isValid: false, errors };
        }
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
            const diffInMs = end.getTime() - start.getTime();
            const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
            if (diffInDays > 730) {
                errors.push('Date range cannot exceed 2 years');
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }
    getFileSizeLimit(format) {
        switch (format) {
            case 'pdf':
                return 50 * 1024 * 1024;
            case 'excel':
                return 100 * 1024 * 1024;
            case 'csv':
                return 10 * 1024 * 1024;
            default:
                return 50 * 1024 * 1024;
        }
    }
    validateDataSize(data, format) {
        const estimatedSize = this.estimateFileSize(data, format);
        const limit = this.getFileSizeLimit(format);
        return estimatedSize <= limit;
    }
    estimateFileSize(data, format) {
        if (!data || data.length === 0)
            return 0;
        const avgRowSize = this.calculateAverageRowSize(data[0]);
        const headerSize = Object.keys(data[0]).length * 20;
        switch (format) {
            case 'pdf':
                return (data.length * avgRowSize * 1.5) + (headerSize * 2) + 50000;
            case 'excel':
                return (data.length * avgRowSize * 1.2) + headerSize + 10000;
            case 'csv':
                return (data.length * avgRowSize) + headerSize;
            default:
                return (data.length * avgRowSize) + headerSize;
        }
    }
    calculateAverageRowSize(sampleRow) {
        let totalSize = 0;
        for (const [key, value] of Object.entries(sampleRow)) {
            const keySize = key.length;
            const valueSize = value ? value.toString().length : 0;
            totalSize += keySize + valueSize + 4;
        }
        return totalSize;
    }
    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 255);
    }
    canUserAccessReport(userId, report) {
        if (!userId)
            return false;
        return true;
    }
}
exports.FinancialDashboardController = FinancialDashboardController;
//# sourceMappingURL=FinancialDashboardController.js.map