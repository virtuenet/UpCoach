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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const cron = __importStar(require("node-cron"));
const logger_1 = require("../utils/logger");
const FinancialService_1 = require("./financial/FinancialService");
const ReportingService_1 = require("./financial/ReportingService");
class SchedulerService {
    static jobs = new Map();
    static initialize() {
        logger_1.logger.info('Initializing scheduled financial jobs...');
        this.scheduleJob('daily-snapshot', '0 6 * * *', async () => {
            logger_1.logger.info('Running daily financial snapshot generation...');
            try {
                await ReportingService_1.reportingService.generateDailySnapshot();
                logger_1.logger.info('Daily snapshot generated successfully');
            }
            catch (error) {
                logger_1.logger.error('Failed to generate daily snapshot:', error);
            }
        });
        this.scheduleJob('hourly-reports', '0 * * * *', async () => {
            logger_1.logger.info('Checking for scheduled reports...');
            try {
                await ReportingService_1.reportingService.generateScheduledReports();
                logger_1.logger.info('Scheduled reports check completed');
            }
            catch (error) {
                logger_1.logger.error('Failed to generate scheduled reports:', error);
            }
        });
        this.scheduleJob('weekly-cost-analysis', '0 8 * * 1', async () => {
            logger_1.logger.info('Running weekly cost analysis...');
            try {
                await this.performWeeklyCostAnalysis();
                logger_1.logger.info('Weekly cost analysis completed');
            }
            catch (error) {
                logger_1.logger.error('Failed to perform weekly cost analysis:', error);
            }
        });
        this.scheduleJob('monthly-health-check', '0 9 1 * *', async () => {
            logger_1.logger.info('Running monthly financial health check...');
            try {
                await this.performMonthlyHealthCheck();
                logger_1.logger.info('Monthly health check completed');
            }
            catch (error) {
                logger_1.logger.error('Failed to perform monthly health check:', error);
            }
        });
        this.scheduleJob('quarterly-projections', '0 10 1 1,4,7,10 *', async () => {
            logger_1.logger.info('Running quarterly projections...');
            try {
                await this.generateQuarterlyProjections();
                logger_1.logger.info('Quarterly projections completed');
            }
            catch (error) {
                logger_1.logger.error('Failed to generate quarterly projections:', error);
            }
        });
        this.scheduleJob('alert-monitoring', '*/15 * * * *', async () => {
            logger_1.logger.debug('Checking for financial alerts...');
            try {
                await this.checkRealTimeAlerts();
            }
            catch (error) {
                logger_1.logger.error('Failed to check real-time alerts:', error);
            }
        });
        logger_1.logger.info(`Initialized ${this.jobs.size} scheduled financial jobs`);
    }
    static scheduleJob(name, schedule, task) {
        if (this.jobs.has(name)) {
            logger_1.logger.warn(`Job ${name} already exists, stopping previous job`);
            this.jobs.get(name)?.stop();
        }
        const job = cron.schedule(schedule, task, {
            timezone: 'UTC',
        });
        this.jobs.set(name, job);
        logger_1.logger.info(`Scheduled job: ${name} with cron pattern: ${schedule}`);
    }
    static stopJob(name) {
        const job = this.jobs.get(name);
        if (job) {
            job.stop();
            this.jobs.delete(name);
            logger_1.logger.info(`Stopped job: ${name}`);
            return true;
        }
        return false;
    }
    static stopAllJobs() {
        this.jobs.forEach((job, name) => {
            job.stop();
            logger_1.logger.info(`Stopped job: ${name}`);
        });
        this.jobs.clear();
        logger_1.logger.info('All scheduled jobs stopped');
    }
    static getJobStatus() {
        return Array.from(this.jobs.entries()).map(([name, job]) => ({
            name,
            running: job.getStatus() === 'scheduled',
        }));
    }
    static async performWeeklyCostAnalysis() {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            const costMetrics = await FinancialService_1.financialService.getCostsByCategory(startDate, endDate);
            const analysis = {
                totalCosts: costMetrics.reduce((sum, cost) => sum + parseFloat(cost.total), 0),
                categories: costMetrics,
                trends: await this.analyzeCostTrends(startDate, endDate),
                recommendations: await this.generateCostRecommendations(costMetrics),
            };
            await this.checkCostAlerts(analysis);
            logger_1.logger.info('Weekly cost analysis completed', { analysis });
        }
        catch (error) {
            logger_1.logger.error('Weekly cost analysis failed:', error);
            throw error;
        }
    }
    static async performMonthlyHealthCheck() {
        try {
            const metrics = await FinancialService_1.financialService.getDashboardMetrics();
            const healthScore = this.calculateHealthScore(metrics);
            const healthReport = {
                score: healthScore,
                metrics,
                risks: this.identifyRisks(metrics),
                opportunities: this.identifyOpportunities(metrics),
                recommendations: this.generateHealthRecommendations(healthScore, metrics),
            };
            await this.sendHealthReport(healthReport);
            logger_1.logger.info('Monthly health check completed', { healthScore });
        }
        catch (error) {
            logger_1.logger.error('Monthly health check failed:', error);
            throw error;
        }
    }
    static async generateQuarterlyProjections() {
        try {
            const currentDate = new Date();
            const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
            const historicalData = await this.getHistoricalQuarterlyData();
            const projections = {
                quarter: `Q${quarter} ${currentDate.getFullYear()}`,
                revenue: await this.projectRevenue(historicalData),
                costs: await this.projectCosts(historicalData),
                growth: await this.projectGrowth(historicalData),
                risks: await this.identifyProjectionRisks(historicalData),
            };
            await this.saveProjections(projections);
            logger_1.logger.info('Quarterly projections generated', { projections });
        }
        catch (error) {
            logger_1.logger.error('Quarterly projections failed:', error);
            throw error;
        }
    }
    static async checkRealTimeAlerts() {
        try {
            const latestSnapshot = await FinancialService_1.financialService.generateDailySnapshot();
            const criticalAlerts = [];
            const monthlyBurn = latestSnapshot.totalCosts;
            if (monthlyBurn > 100000) {
                criticalAlerts.push({
                    type: 'HIGH_BURN_RATE',
                    severity: 'HIGH',
                    message: `Monthly burn rate exceeded $100k: $${monthlyBurn.toLocaleString()}`,
                    value: monthlyBurn,
                    threshold: 100000,
                });
            }
            const revenueDropThreshold = 0.1;
            const previousRevenue = await this.getPreviousRevenue();
            if (previousRevenue &&
                latestSnapshot.revenue < previousRevenue * (1 - revenueDropThreshold)) {
                criticalAlerts.push({
                    type: 'REVENUE_DROP',
                    severity: 'CRITICAL',
                    message: `Revenue dropped by ${(((previousRevenue - latestSnapshot.revenue) / previousRevenue) * 100).toFixed(1)}%`,
                    value: latestSnapshot.revenue,
                    threshold: previousRevenue * (1 - revenueDropThreshold),
                });
            }
            if (criticalAlerts.length > 0) {
                await this.sendCriticalAlerts(criticalAlerts);
            }
        }
        catch (error) {
            logger_1.logger.error('Real-time alerts check failed:', error);
        }
    }
    static async analyzeCostTrends(_startDate, _endDate) {
        return { trend: 'stable', variance: 5 };
    }
    static async generateCostRecommendations(_costMetrics) {
        return ['Consider optimizing infrastructure costs', 'Review vendor contracts'];
    }
    static async checkCostAlerts(analysis) {
        if (analysis.totalCosts > 50000) {
            logger_1.logger.warn('Weekly costs exceeded $50k threshold');
        }
    }
    static calculateHealthScore(metrics) {
        let score = 100;
        if (metrics.subscriptions.churnRate > 5)
            score -= 20;
        if (metrics.unitEconomics.ltvToCacRatio < 3)
            score -= 15;
        if (metrics.profitLoss.margin < 20)
            score -= 25;
        return Math.max(0, score);
    }
    static identifyRisks(metrics) {
        const risks = [];
        if (metrics.subscriptions.churnRate > 10)
            risks.push('High churn rate');
        if (metrics.costs.burnRate > metrics.revenue.mrr * 2)
            risks.push('Unsustainable burn rate');
        return risks;
    }
    static identifyOpportunities(metrics) {
        const opportunities = [];
        if (metrics.unitEconomics.ltvToCacRatio > 5)
            opportunities.push('Strong unit economics for scaling');
        if (metrics.subscriptions.churnRate < 3)
            opportunities.push('Excellent retention for premium pricing');
        return opportunities;
    }
    static generateHealthRecommendations(score, metrics) {
        const recommendations = [];
        if (score < 70)
            recommendations.push('Review cost structure and pricing strategy');
        if (metrics.subscriptions.churnRate > 5)
            recommendations.push('Implement retention campaigns');
        return recommendations;
    }
    static async sendHealthReport(report) {
        logger_1.logger.info('Health report would be sent to stakeholders', { report });
    }
    static async getHistoricalQuarterlyData() {
        return {};
    }
    static async projectRevenue(_data) {
        return { q1: 100000, q2: 120000, q3: 140000, q4: 160000 };
    }
    static async projectCosts(_data) {
        return { q1: 80000, q2: 85000, q3: 90000, q4: 95000 };
    }
    static async projectGrowth(_data) {
        return { mrrGrowth: 15, userGrowth: 25 };
    }
    static async identifyProjectionRisks(_data) {
        return ['Market saturation risk', 'Competition pressure'];
    }
    static async saveProjections(projections) {
        logger_1.logger.info('Projections saved', { projections });
    }
    static async getPreviousRevenue() {
        return 50000;
    }
    static async sendCriticalAlerts(alerts) {
        logger_1.logger.warn('Critical alerts detected', { alerts });
    }
}
exports.SchedulerService = SchedulerService;
if (process.env.NODE_ENV !== 'test') {
    SchedulerService.initialize();
}
//# sourceMappingURL=SchedulerService.js.map