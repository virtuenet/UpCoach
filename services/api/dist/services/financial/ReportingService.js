"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportingService = exports.ReportingService = void 0;
// import { Op } from 'sequelize';
const date_fns_1 = require("date-fns");
const models_1 = require("../../models");
const FinancialService_1 = require("./FinancialService");
const UnifiedEmailService_1 = require("../email/UnifiedEmailService");
const logger_1 = require("../../utils/logger");
class ReportingService {
    /**
     * Generate daily financial snapshot
     */
    async generateDailySnapshot() {
        try {
            const snapshot = await FinancialService_1.financialService.generateDailySnapshot();
            // Check for alerts
            await this.checkFinancialAlerts(snapshot);
            return snapshot;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate daily snapshot:', error);
            throw error;
        }
    }
    /**
     * Generate scheduled reports
     */
    async generateScheduledReports() {
        try {
            const now = new Date();
            // Generate daily reports
            if (this.shouldGenerateDailyReport(now)) {
                await this.generateDailyReport();
            }
            // Generate weekly reports (Mondays)
            if (this.shouldGenerateWeeklyReport(now)) {
                await this.generateWeeklyReport();
            }
            // Generate monthly reports (1st of month)
            if (this.shouldGenerateMonthlyReport(now)) {
                await this.generateMonthlyReport();
            }
            // Generate quarterly reports
            if (this.shouldGenerateQuarterlyReport(now)) {
                await this.generateQuarterlyReport();
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to generate scheduled reports:', error);
            throw error;
        }
    }
    /**
     * Generate daily summary report
     */
    async generateDailyReport() {
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const report = await models_1.FinancialReport.create({
            type: models_1.ReportType.DAILY_SUMMARY,
            title: `Daily Financial Summary - ${(0, date_fns_1.format)(today, 'yyyy-MM-dd')}`,
            description: 'Automated daily financial performance report',
            status: models_1.ReportStatus.GENERATING,
            format: models_1.ReportFormat.JSON,
            scheduledFor: today,
            parameters: {
                date: (0, date_fns_1.format)(today, 'yyyy-MM-dd'),
                includeComparisons: true,
            },
        });
        try {
            // Generate report data
            const [todayMetrics, yesterdayMetrics] = await Promise.all([
                FinancialService_1.financialService.getDashboardMetrics(),
                this.getHistoricalMetrics(yesterday),
            ]);
            const reportData = {
                date: (0, date_fns_1.format)(today, 'yyyy-MM-dd'),
                metrics: todayMetrics,
                comparisons: {
                    yesterday: yesterdayMetrics,
                    changes: this.calculateChanges(todayMetrics, yesterdayMetrics),
                },
                alerts: await this.generateAlerts(todayMetrics),
                summary: this.generateExecutiveSummary(todayMetrics, yesterdayMetrics),
            };
            // Update report with data
            await report.update({
                status: models_1.ReportStatus.COMPLETED,
                data: reportData,
                generatedAt: new Date(),
            });
            // Send to stakeholders
            await this.sendReportToStakeholders(report);
            return report;
        }
        catch (error) {
            await report.update({
                status: models_1.ReportStatus.FAILED,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Generate weekly business review
     */
    async generateWeeklyReport() {
        const today = new Date();
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const report = await models_1.FinancialReport.create({
            type: models_1.ReportType.WEEKLY_BUSINESS_REVIEW,
            title: `Weekly Business Review - ${(0, date_fns_1.format)(weekStart, 'yyyy-MM-dd')} to ${(0, date_fns_1.format)(today, 'yyyy-MM-dd')}`,
            description: 'Weekly performance analysis and business insights',
            status: models_1.ReportStatus.GENERATING,
            format: models_1.ReportFormat.PDF,
            scheduledFor: today,
            parameters: {
                startDate: (0, date_fns_1.format)(weekStart, 'yyyy-MM-dd'),
                endDate: (0, date_fns_1.format)(today, 'yyyy-MM-dd'),
            },
        });
        try {
            const [currentWeek, previousWeek] = await Promise.all([
                this.getWeeklyMetrics(weekStart, today),
                this.getWeeklyMetrics(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000), weekStart),
            ]);
            const reportData = {
                period: {
                    start: (0, date_fns_1.format)(weekStart, 'yyyy-MM-dd'),
                    end: (0, date_fns_1.format)(today, 'yyyy-MM-dd'),
                },
                metrics: currentWeek,
                trends: this.calculateTrends(currentWeek, previousWeek),
                insights: this.generateBusinessInsights(currentWeek, previousWeek),
                recommendations: this.generateRecommendations(currentWeek),
                kpis: this.calculateKPIs(currentWeek),
            };
            await report.update({
                status: models_1.ReportStatus.COMPLETED,
                data: reportData,
                generatedAt: new Date(),
            });
            await this.sendReportToStakeholders(report);
            return report;
        }
        catch (error) {
            await report.update({
                status: models_1.ReportStatus.FAILED,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Generate monthly P&L report
     */
    async generateMonthlyReport() {
        const now = new Date();
        const monthStart = (0, date_fns_1.startOfMonth)(now);
        const monthEnd = (0, date_fns_1.endOfMonth)(now);
        const report = await models_1.FinancialReport.create({
            type: models_1.ReportType.MONTHLY_P_AND_L,
            title: `Monthly P&L Report - ${(0, date_fns_1.format)(monthStart, 'MMMM yyyy')}`,
            description: 'Comprehensive monthly profit and loss statement',
            status: models_1.ReportStatus.GENERATING,
            format: models_1.ReportFormat.PDF,
            scheduledFor: now,
            parameters: {
                month: (0, date_fns_1.format)(monthStart, 'yyyy-MM'),
            },
        });
        try {
            const [pnl, snapshots, cohortData] = await Promise.all([
                FinancialService_1.financialService.getProfitLossStatement(monthStart, monthEnd),
                this.getMonthlySnapshots(monthStart, monthEnd),
                this.getCohortAnalysis(monthStart),
            ]);
            const reportData = {
                month: (0, date_fns_1.format)(monthStart, 'MMMM yyyy'),
                pnl,
                snapshots,
                cohorts: cohortData,
                trends: this.calculateMonthlyTrends(snapshots),
                variance: this.calculateBudgetVariance(pnl),
                forecast: this.generateForecast(snapshots),
            };
            await report.update({
                status: models_1.ReportStatus.COMPLETED,
                data: reportData,
                generatedAt: new Date(),
            });
            await this.sendReportToStakeholders(report);
            return report;
        }
        catch (error) {
            await report.update({
                status: models_1.ReportStatus.FAILED,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Generate quarterly investor report
     */
    async generateQuarterlyReport() {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        const quarterStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), quarter * 3, 0);
        const report = await models_1.FinancialReport.create({
            type: models_1.ReportType.QUARTERLY_INVESTOR,
            title: `Q${quarter} ${now.getFullYear()} Investor Report`,
            description: 'Quarterly business performance and investor update',
            status: models_1.ReportStatus.GENERATING,
            format: models_1.ReportFormat.PDF,
            scheduledFor: now,
            parameters: {
                quarter: `Q${quarter}`,
                year: now.getFullYear().toString(),
            },
        });
        try {
            const [quarterlyMetrics, yearToDateMetrics, benchmarks, projections] = await Promise.all([
                this.getQuarterlyMetrics(quarterStart, quarterEnd),
                this.getYearToDateMetrics(new Date(now.getFullYear(), 0, 1), quarterEnd),
                this.getIndustryBenchmarks(),
                this.generateProjections(quarterEnd),
            ]);
            const reportData = {
                quarter: `Q${quarter} ${now.getFullYear()}`,
                quarterlyMetrics,
                yearToDate: yearToDateMetrics,
                benchmarks,
                projections,
                highlights: this.generateQuarterlyHighlights(quarterlyMetrics),
                risks: this.identifyRisks(quarterlyMetrics),
                opportunities: this.identifyOpportunities(quarterlyMetrics),
            };
            await report.update({
                status: models_1.ReportStatus.COMPLETED,
                data: reportData,
                generatedAt: new Date(),
            });
            await this.sendReportToStakeholders(report);
            return report;
        }
        catch (error) {
            await report.update({
                status: models_1.ReportStatus.FAILED,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Check for financial alerts
     */
    async checkFinancialAlerts(snapshot) {
        const alerts = [];
        // Churn rate alert
        if (snapshot.churnRate > 10) {
            alerts.push({
                type: 'HIGH_CHURN',
                severity: 'HIGH',
                message: `Churn rate is ${snapshot.churnRate.toFixed(1)}%, exceeding 10% threshold`,
                value: snapshot.churnRate,
                threshold: 10,
            });
        }
        // Burn rate alert
        const runway = snapshot.totalCosts > 0 ? 12 : 0; // Simplified calculation
        if (runway < 6) {
            alerts.push({
                type: 'LOW_RUNWAY',
                severity: 'CRITICAL',
                message: `Cash runway is below 6 months (${runway} months remaining)`,
                value: runway,
                threshold: 6,
            });
        }
        // LTV:CAC ratio alert
        if (snapshot.ltvToCacRatio < 3) {
            alerts.push({
                type: 'LOW_LTV_CAC',
                severity: 'MEDIUM',
                message: `LTV:CAC ratio is ${snapshot.ltvToCacRatio.toFixed(1)}x, below 3x threshold`,
                value: snapshot.ltvToCacRatio,
                threshold: 3,
            });
        }
        // Gross margin alert
        if (snapshot.grossMargin < 70) {
            alerts.push({
                type: 'LOW_GROSS_MARGIN',
                severity: 'MEDIUM',
                message: `Gross margin is ${snapshot.grossMargin.toFixed(1)}%, below 70% target`,
                value: snapshot.grossMargin,
                threshold: 70,
            });
        }
        // Send alerts if any
        if (alerts.length > 0) {
            await this.sendAlerts(alerts);
        }
    }
    /**
     * Send alerts to stakeholders
     */
    async sendAlerts(alerts) {
        try {
            const criticalAlerts = alerts.filter(alert => alert.severity === 'CRITICAL');
            const highAlerts = alerts.filter(alert => alert.severity === 'HIGH');
            const mediumAlerts = alerts.filter(alert => alert.severity === 'MEDIUM');
            // Send critical alerts immediately
            if (criticalAlerts.length > 0) {
                await UnifiedEmailService_1.emailService.sendFinancialAlert({
                    to: ['ceo@upcoach.app', 'cfo@upcoach.app'],
                    subject: '🚨 CRITICAL Financial Alert',
                    alerts: criticalAlerts,
                    priority: 'high',
                });
            }
            // Send high priority alerts
            if (highAlerts.length > 0) {
                await UnifiedEmailService_1.emailService.sendFinancialAlert({
                    to: ['cfo@upcoach.app', 'finance@upcoach.app'],
                    subject: '⚠️ High Priority Financial Alert',
                    alerts: highAlerts,
                    priority: 'high',
                });
            }
            // Send medium priority alerts in daily digest
            if (mediumAlerts.length > 0) {
                await UnifiedEmailService_1.emailService.sendFinancialAlert({
                    to: ['finance@upcoach.app'],
                    subject: '📊 Financial Alert Digest',
                    alerts: mediumAlerts,
                    priority: 'normal',
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send financial alerts:', error);
        }
    }
    /**
     * Send report to stakeholders
     */
    async sendReportToStakeholders(report) {
        try {
            const recipients = this.getReportRecipients(report.type);
            await UnifiedEmailService_1.emailService.sendFinancialReport({
                to: recipients,
                subject: `Financial Report: ${report.title}`,
                report: report,
                attachments: [`https://app.upcoach.ai/reports/${report.id}`],
            });
            logger_1.logger.info(`Report sent successfully: ${report.title}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to send report: ${report.title}`, error);
        }
    }
    /**
     * Get report recipients based on type
     */
    getReportRecipients(type) {
        const recipients = {
            [models_1.ReportType.DAILY_SUMMARY]: ['finance@upcoach.app'],
            [models_1.ReportType.WEEKLY_BUSINESS_REVIEW]: [
                'ceo@upcoach.app',
                'cfo@upcoach.app',
                'finance@upcoach.app',
            ],
            [models_1.ReportType.MONTHLY_P_AND_L]: ['ceo@upcoach.app', 'cfo@upcoach.app', 'board@upcoach.app'],
            [models_1.ReportType.QUARTERLY_INVESTOR]: ['investors@upcoach.app', 'board@upcoach.app'],
            [models_1.ReportType.CUSTOM]: ['finance@upcoach.app'],
        };
        return recipients[type] || ['finance@upcoach.app'];
    }
    // Helper methods for schedule checking
    shouldGenerateDailyReport(date) {
        const hour = date.getHours();
        return hour === 9; // 9 AM daily
    }
    shouldGenerateWeeklyReport(date) {
        const day = date.getDay();
        const hour = date.getHours();
        return day === 1 && hour === 10; // Monday 10 AM
    }
    shouldGenerateMonthlyReport(date) {
        const day = date.getDate();
        const hour = date.getHours();
        return day === 1 && hour === 11; // 1st of month 11 AM
    }
    shouldGenerateQuarterlyReport(date) {
        const month = date.getMonth();
        const day = date.getDate();
        const hour = date.getHours();
        return [2, 5, 8, 11].includes(month) && day === 1 && hour === 12; // Quarterly 12 PM
    }
    // Placeholder methods for data calculations
    async getHistoricalMetrics(_date) {
        // Implementation would fetch historical snapshot
        return {};
    }
    calculateChanges(_current, _previous) {
        // Implementation would calculate percentage changes
        return {};
    }
    async generateAlerts(_metrics) {
        // Implementation would generate contextual alerts
        return [];
    }
    generateExecutiveSummary(_current, _previous) {
        // Implementation would generate AI summary
        return 'Executive summary generated by AI';
    }
    async getWeeklyMetrics(_start, _end) {
        // Implementation would aggregate weekly data
        return {};
    }
    calculateTrends(_current, _previous) {
        // Implementation would calculate trend analysis
        return {};
    }
    generateBusinessInsights(_current, _previous) {
        // Implementation would generate business insights
        return [];
    }
    generateRecommendations(_metrics) {
        // Implementation would generate actionable recommendations
        return [];
    }
    calculateKPIs(_metrics) {
        // Implementation would calculate key performance indicators
        return {};
    }
    async getMonthlySnapshots(_start, _end) {
        return [];
    }
    async getCohortAnalysis(_date) {
        return {};
    }
    calculateMonthlyTrends(_snapshots) {
        return {};
    }
    calculateBudgetVariance(_pnl) {
        return {};
    }
    generateForecast(_snapshots) {
        return {};
    }
    async getQuarterlyMetrics(_start, _end) {
        return {};
    }
    async getYearToDateMetrics(_start, _end) {
        return {};
    }
    async getIndustryBenchmarks() {
        return {};
    }
    async generateProjections(_fromDate) {
        return {};
    }
    generateQuarterlyHighlights(_metrics) {
        return [];
    }
    identifyRisks(_metrics) {
        return [];
    }
    identifyOpportunities(_metrics) {
        return [];
    }
}
exports.ReportingService = ReportingService;
exports.reportingService = new ReportingService();
//# sourceMappingURL=ReportingService.js.map