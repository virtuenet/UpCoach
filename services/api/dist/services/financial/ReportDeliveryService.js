"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportDeliveryService = exports.ReportDeliveryService = void 0;
const tslib_1 = require("tslib");
const date_fns_1 = require("date-fns");
const logger_1 = require("../../utils/logger");
const EmailService_1 = require("../EmailService");
const FinancialReport_1 = require("../../models/financial/FinancialReport");
const FinancialDashboardControllerEnhanced_1 = require("../../controllers/financial/FinancialDashboardControllerEnhanced");
const puppeteer_1 = tslib_1.__importDefault(require("puppeteer"));
const csv_writer_1 = require("csv-writer");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
class ReportDeliveryService {
    schedules = new Map();
    async sendFinancialReport(options) {
        try {
            logger_1.logger.info('Starting financial report generation and delivery', { options });
            const reportData = await this.generateReportData(options.period, options.reportType);
            const report = await FinancialReport_1.FinancialReport.create({
                type: options.reportType,
                title: `Financial Report - ${options.period}`,
                description: `Automated financial report generated for ${options.period}`,
                status: FinancialReport_1.ReportStatus.IN_PROGRESS,
                format: options.format,
                generatedAt: new Date(),
                data: reportData
            });
            let attachmentPath;
            let attachmentFilename;
            if (options.format === FinancialReport_1.ReportFormat.PDF) {
                const { filePath, filename } = await this.generatePDFReport(reportData, options);
                attachmentPath = filePath;
                attachmentFilename = filename;
            }
            else if (options.format === FinancialReport_1.ReportFormat.CSV) {
                const { filePath, filename } = await this.generateCSVReport(reportData, options);
                attachmentPath = filePath;
                attachmentFilename = filename;
            }
            else {
                const filename = `financial-report-${(0, date_fns_1.format)(new Date(), 'yyyy-MM-dd')}.json`;
                attachmentPath = path_1.default.join('/tmp', filename);
                fs_1.default.writeFileSync(attachmentPath, JSON.stringify(reportData, null, 2));
                attachmentFilename = filename;
            }
            const emailResults = await Promise.all(options.recipients.map(recipient => this.sendReportEmail(recipient, reportData, attachmentPath, attachmentFilename, options)));
            const allSent = emailResults.every(result => result.success);
            await report.update({
                status: allSent ? FinancialReport_1.ReportStatus.COMPLETED : FinancialReport_1.ReportStatus.FAILED,
                sentTo: options.recipients,
                sentAt: allSent ? new Date() : null
            });
            if (fs_1.default.existsSync(attachmentPath)) {
                fs_1.default.unlinkSync(attachmentPath);
            }
            return {
                success: allSent,
                reportId: report.id,
                error: allSent ? undefined : 'Failed to send to some recipients'
            };
        }
        catch (error) {
            logger_1.logger.error('Report delivery error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async scheduleRecurringReport(schedule) {
        const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const nextSend = this.calculateNextSendDate(schedule.frequency);
        const fullSchedule = {
            ...schedule,
            id: scheduleId,
            nextSend
        };
        this.schedules.set(scheduleId, fullSchedule);
        logger_1.logger.info('Scheduled recurring financial report', { scheduleId, schedule: fullSchedule });
        return scheduleId;
    }
    async processScheduledReports() {
        const now = new Date();
        for (const [scheduleId, schedule] of this.schedules.entries()) {
            if (schedule.isActive && schedule.nextSend <= now) {
                try {
                    await this.sendScheduledReport(schedule);
                    schedule.lastSent = now;
                    schedule.nextSend = this.calculateNextSendDate(schedule.frequency);
                    this.schedules.set(scheduleId, schedule);
                }
                catch (error) {
                    logger_1.logger.error('Failed to send scheduled report', { scheduleId, error });
                }
            }
        }
    }
    async getEnhancedCohortAnalysis(cohortMonth) {
        try {
            const cohortDate = cohortMonth ? new Date(cohortMonth) : new Date();
            const cohorts = await this.getMultipleCohortAnalysis(6);
            const totalCohorts = cohorts.length;
            const averageRetention = totalCohorts > 0
                ? cohorts.reduce((sum, c) => sum + c.retention.month1, 0) / totalCohorts
                : 0;
            const averageLTV = totalCohorts > 0
                ? cohorts.reduce((sum, c) => sum + c.ltv, 0) / totalCohorts
                : 0;
            const bestPerformingCohort = cohorts.length > 0
                ? cohorts.reduce((best, current) => current.ltv > best.ltv ? current : best).cohortId
                : 'N/A';
            const worstPerformingCohort = cohorts.length > 0
                ? cohorts.reduce((worst, current) => current.ltv < worst.ltv ? current : worst).cohortId
                : 'N/A';
            const insights = this.generateCohortInsights(cohorts, {
                averageRetention,
                averageLTV,
                bestPerformingCohort,
                worstPerformingCohort
            });
            return {
                cohorts,
                summary: {
                    totalCohorts,
                    averageRetention,
                    averageLTV,
                    bestPerformingCohort,
                    worstPerformingCohort
                },
                insights
            };
        }
        catch (error) {
            logger_1.logger.error('Enhanced cohort analysis error:', error);
            throw error;
        }
    }
    async generateReportData(period, reportType) {
        const controller = FinancialDashboardControllerEnhanced_1.financialDashboardControllerEnhanced;
        const reportData = {
            period,
            generatedAt: new Date(),
            metrics: await controller.getEnhancedDashboardMetrics({ query: { period } }, { json: () => { } }),
            cohortAnalysis: await this.getEnhancedCohortAnalysis(),
            subscriptionAnalytics: await controller.getSubscriptionAnalytics(),
            forecast: await controller.generateRevenueForecasts(),
            optimization: await controller.calculateCostOptimization(),
            kpis: await controller.calculateFinancialKPIs()
        };
        return reportData;
    }
    async generatePDFReport(reportData, options) {
        const browser = await puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        try {
            const page = await browser.newPage();
            const htmlContent = this.generateReportHTML(reportData, options);
            await page.setContent(htmlContent, {
                waitUntil: ['domcontentloaded', 'networkidle0']
            });
            const filename = `financial-report-${(0, date_fns_1.format)(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
            const filePath = path_1.default.join('/tmp', filename);
            await page.pdf({
                path: filePath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                }
            });
            return { filePath, filename };
        }
        finally {
            await browser.close();
        }
    }
    async generateCSVReport(reportData, options) {
        const filename = `financial-report-${(0, date_fns_1.format)(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
        const filePath = path_1.default.join('/tmp', filename);
        const csvData = this.flattenReportDataForCSV(reportData);
        const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
            path: filePath,
            header: Object.keys(csvData[0] || {}).map(key => ({ id: key, title: key }))
        });
        await csvWriter.writeRecords(csvData);
        return { filePath, filename };
    }
    generateReportHTML(reportData, options) {
        return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>UpCoach Financial Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .metric-card {
          display: inline-block;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          margin: 10px;
          width: 200px;
          vertical-align: top;
        }
        .metric-title {
          color: #64748b;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #1e293b;
          margin: 5px 0;
        }
        .metric-change {
          font-size: 14px;
          color: #10b981;
        }
        .chart-placeholder {
          width: 100%;
          height: 300px;
          background: #f1f5f9;
          border: 1px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          margin: 20px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #e2e8f0;
          padding: 12px;
          text-align: left;
        }
        th {
          background: #f8fafc;
          font-weight: bold;
        }
        .alert {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #dc2626;
          padding: 12px;
          border-radius: 6px;
          margin: 10px 0;
        }
        .insight {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>UpCoach Financial Report</h1>
        <p>Generated on ${(0, date_fns_1.format)(new Date(), 'MMMM dd, yyyy at h:mm a')}</p>
        <p>Period: ${options.period}</p>
      </div>

      <div class="section">
        <h2>Executive Summary</h2>
        ${reportData.insights ? reportData.insights.map((insight) => `<div class="insight">${insight}</div>`).join('') : ''}
      </div>

      <div class="section">
        <h2>Key Metrics</h2>
        <div class="metric-card">
          <div class="metric-title">Monthly Recurring Revenue</div>
          <div class="metric-value">$${(reportData.metrics?.current?.mrr || 0).toLocaleString()}</div>
          <div class="metric-change">+${(reportData.metrics?.current?.mrrChange || 0).toFixed(1)}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Annual Recurring Revenue</div>
          <div class="metric-value">$${(reportData.metrics?.current?.arr || 0).toLocaleString()}</div>
          <div class="metric-change">+${(reportData.metrics?.current?.arrChange || 0).toFixed(1)}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Total Customers</div>
          <div class="metric-value">${(reportData.metrics?.current?.totalCustomers || 0).toLocaleString()}</div>
          <div class="metric-change">+${(reportData.metrics?.current?.customerChange || 0).toFixed(1)}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Average Revenue Per User</div>
          <div class="metric-value">$${(reportData.metrics?.current?.arpu || 0).toFixed(2)}</div>
          <div class="metric-change">+${(reportData.metrics?.current?.arpuChange || 0).toFixed(1)}%</div>
        </div>
      </div>

      ${options.includeCharts ? `
      <div class="section">
        <h2>Revenue Trend</h2>
        <div class="chart-placeholder">
          Revenue trend chart would be displayed here
        </div>
      </div>
      ` : ''}

      <div class="section">
        <h2>Cohort Analysis Summary</h2>
        <p>Total Cohorts: ${reportData.cohortAnalysis?.summary?.totalCohorts || 0}</p>
        <p>Average Retention (Month 1): ${((reportData.cohortAnalysis?.summary?.averageRetention || 0) * 100).toFixed(1)}%</p>
        <p>Average LTV: $${(reportData.cohortAnalysis?.summary?.averageLTV || 0).toFixed(2)}</p>
        <p>Best Performing Cohort: ${reportData.cohortAnalysis?.summary?.bestPerformingCohort || 'N/A'}</p>

        <h3>Cohort Insights</h3>
        ${reportData.cohortAnalysis?.insights ? reportData.cohortAnalysis.insights.map((insight) => `<div class="insight">${insight}</div>`).join('') : ''}
      </div>

      <div class="section">
        <h2>Revenue Forecast</h2>
        <table>
          <tr>
            <th>Period</th>
            <th>Forecasted Revenue</th>
            <th>Confidence</th>
            <th>Best Case</th>
            <th>Worst Case</th>
          </tr>
          <tr>
            <td>${reportData.forecast?.shortTerm?.period || 'Next Month'}</td>
            <td>$${(reportData.forecast?.shortTerm?.forecasted || 0).toLocaleString()}</td>
            <td>${((reportData.forecast?.shortTerm?.confidence || 0) * 100).toFixed(0)}%</td>
            <td>$${(reportData.forecast?.shortTerm?.bestCase || 0).toLocaleString()}</td>
            <td>$${(reportData.forecast?.shortTerm?.worstCase || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td>${reportData.forecast?.mediumTerm?.period || 'Next Quarter'}</td>
            <td>$${(reportData.forecast?.mediumTerm?.forecasted || 0).toLocaleString()}</td>
            <td>${((reportData.forecast?.mediumTerm?.confidence || 0) * 100).toFixed(0)}%</td>
            <td>$${(reportData.forecast?.mediumTerm?.bestCase || 0).toLocaleString()}</td>
            <td>$${(reportData.forecast?.mediumTerm?.worstCase || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td>${reportData.forecast?.longTerm?.period || 'Next Year'}</td>
            <td>$${(reportData.forecast?.longTerm?.forecasted || 0).toLocaleString()}</td>
            <td>${((reportData.forecast?.longTerm?.confidence || 0) * 100).toFixed(0)}%</td>
            <td>$${(reportData.forecast?.longTerm?.bestCase || 0).toLocaleString()}</td>
            <td>$${(reportData.forecast?.longTerm?.worstCase || 0).toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>Cost Optimization</h2>
        <p>Potential Savings: $${(reportData.optimization?.potentialSavings || 0).toLocaleString()}</p>
        <p>Current Efficiency: ${((reportData.optimization?.currentEfficiency || 0) * 100).toFixed(1)}%</p>

        <h3>Top Recommendations</h3>
        ${reportData.optimization?.recommendations ? reportData.optimization.recommendations.slice(0, 5).map((rec) => `<div class="insight">
            <strong>${rec.category}:</strong> Save $${rec.savings.toFixed(2)} - ${rec.implementation}
          </div>`).join('') : ''}
      </div>

      <div class="section">
        <h2>Alerts & Action Items</h2>
        ${reportData.metrics?.alerts ? reportData.metrics.alerts.map((alert) => `<div class="alert">${alert.title}: ${alert.description}</div>`).join('') : '<p>No active alerts</p>'}
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
        <p>This report was automatically generated by UpCoach Financial Analytics</p>
        <p>For questions or support, contact: support@upcoach.ai</p>
      </div>
    </body>
    </html>
    `;
    }
    flattenReportDataForCSV(reportData) {
        const flatData = [];
        if (reportData.metrics?.current) {
            const metrics = reportData.metrics.current;
            flatData.push({
                Category: 'Metrics',
                Item: 'MRR',
                Value: metrics.mrr || 0,
                Change: `${metrics.mrrChange || 0}%`,
                Period: reportData.period
            });
            flatData.push({
                Category: 'Metrics',
                Item: 'ARR',
                Value: metrics.arr || 0,
                Change: `${metrics.arrChange || 0}%`,
                Period: reportData.period
            });
            flatData.push({
                Category: 'Metrics',
                Item: 'Total Customers',
                Value: metrics.totalCustomers || 0,
                Change: `${metrics.customerChange || 0}%`,
                Period: reportData.period
            });
            flatData.push({
                Category: 'Metrics',
                Item: 'ARPU',
                Value: metrics.arpu || 0,
                Change: `${metrics.arpuChange || 0}%`,
                Period: reportData.period
            });
        }
        if (reportData.cohortAnalysis?.cohorts) {
            reportData.cohortAnalysis.cohorts.forEach((cohort) => {
                flatData.push({
                    Category: 'Cohort',
                    Item: `Cohort ${cohort.cohortId}`,
                    Value: cohort.ltv,
                    Change: `${cohort.retention.month1 * 100}% retention`,
                    Period: cohort.period
                });
            });
        }
        if (reportData.kpis) {
            reportData.kpis.forEach((kpi) => {
                flatData.push({
                    Category: 'KPI',
                    Item: kpi.name,
                    Value: kpi.value,
                    Change: kpi.status,
                    Period: reportData.period
                });
            });
        }
        return flatData.length > 0 ? flatData : [{
                Category: 'No Data',
                Item: 'No data available',
                Value: 0,
                Change: '',
                Period: reportData.period
            }];
    }
    async sendReportEmail(recipient, reportData, attachmentPath, attachmentFilename, options) {
        try {
            const subject = `UpCoach Financial Report - ${options.period}`;
            const body = this.generateEmailBody(reportData, options);
            await EmailService_1.emailService.sendEmail({
                to: recipient,
                subject,
                html: body,
                attachments: [{
                        filename: attachmentFilename,
                        path: attachmentPath
                    }]
            });
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    generateEmailBody(reportData, options) {
        return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
        <h1>UpCoach Financial Report</h1>
        <p>${options.period}</p>
      </div>

      <div style="padding: 20px;">
        <h2>Executive Summary</h2>
        <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span><strong>MRR:</strong></span>
            <span>$${(reportData.metrics?.current?.mrr || 0).toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span><strong>Total Customers:</strong></span>
            <span>${(reportData.metrics?.current?.totalCustomers || 0).toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span><strong>ARPU:</strong></span>
            <span>$${(reportData.metrics?.current?.arpu || 0).toFixed(2)}</span>
          </div>
        </div>

        <h3>Key Insights</h3>
        ${reportData.insights ? reportData.insights.slice(0, 3).map((insight) => `<div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; margin: 10px 0;">
            ${insight}
          </div>`).join('') : ''}

        <p>The complete report is attached to this email in ${options.format.toUpperCase()} format.</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">

        <p style="color: #64748b; font-size: 12px; text-align: center;">
          This is an automated report from UpCoach Financial Analytics.<br>
          For questions, contact: <a href="mailto:support@upcoach.ai">support@upcoach.ai</a>
        </p>
      </div>
    </div>
    `;
    }
    calculateNextSendDate(frequency) {
        const now = new Date();
        switch (frequency) {
            case 'daily':
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
            case 'weekly':
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            case 'monthly':
                const nextMonth = new Date(now);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                return nextMonth;
            case 'quarterly':
                const nextQuarter = new Date(now);
                nextQuarter.setMonth(nextQuarter.getMonth() + 3);
                return nextQuarter;
            default:
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }
    }
    async sendScheduledReport(schedule) {
        await this.sendFinancialReport({
            recipients: schedule.recipients,
            reportType: schedule.reportType,
            format: schedule.format,
            period: this.getPeriodForFrequency(schedule.frequency),
            includeCharts: true,
            includeRawData: false
        });
    }
    getPeriodForFrequency(frequency) {
        switch (frequency) {
            case 'daily':
                return 'yesterday';
            case 'weekly':
                return 'last-week';
            case 'monthly':
                return 'last-month';
            case 'quarterly':
                return 'last-quarter';
            default:
                return 'last-month';
        }
    }
    async getMultipleCohortAnalysis(months) {
        const cohorts = [];
        const controller = FinancialDashboardControllerEnhanced_1.financialDashboardControllerEnhanced;
        for (let i = 0; i < months; i++) {
            const cohortDate = new Date();
            cohortDate.setMonth(cohortDate.getMonth() - i);
            try {
                const cohortAnalysis = await controller.analyzeCohort(cohortDate);
                cohorts.push(cohortAnalysis);
            }
            catch (error) {
                logger_1.logger.error('Error analyzing cohort', { cohortDate, error });
            }
        }
        return cohorts;
    }
    generateCohortInsights(cohorts, summary) {
        const insights = [];
        if (cohorts.length > 0) {
            const retentionTrend = cohorts.length > 1
                ? cohorts[0].retention.month1 - cohorts[1].retention.month1
                : 0;
            if (retentionTrend > 0.05) {
                insights.push(`Retention improved by ${(retentionTrend * 100).toFixed(1)}% compared to previous cohort`);
            }
            else if (retentionTrend < -0.05) {
                insights.push(`Retention declined by ${Math.abs(retentionTrend * 100).toFixed(1)}% compared to previous cohort`);
            }
            else {
                insights.push('Retention rates are stable across cohorts');
            }
            const ltvTrend = cohorts.length > 1
                ? cohorts[0].ltv - cohorts[1].ltv
                : 0;
            if (ltvTrend > 50) {
                insights.push(`Customer LTV increased by $${ltvTrend.toFixed(2)} in recent cohorts`);
            }
            else if (ltvTrend < -50) {
                insights.push(`Customer LTV decreased by $${Math.abs(ltvTrend).toFixed(2)} in recent cohorts`);
            }
            const sizeTrend = cohorts.length > 1
                ? cohorts[0].size - cohorts[1].size
                : 0;
            if (sizeTrend > 10) {
                insights.push(`Customer acquisition accelerated with ${sizeTrend} more customers in recent cohort`);
            }
            else if (sizeTrend < -10) {
                insights.push(`Customer acquisition slowed with ${Math.abs(sizeTrend)} fewer customers in recent cohort`);
            }
            if (summary.bestPerformingCohort !== 'N/A') {
                insights.push(`Best performing cohort (${summary.bestPerformingCohort}) shows strong product-market fit indicators`);
            }
            if (summary.averageRetention > 0.8) {
                insights.push('Strong cohort performance indicates excellent customer satisfaction and product value');
            }
            else if (summary.averageRetention < 0.6) {
                insights.push('Cohort retention below optimal levels - consider customer success initiatives');
            }
        }
        else {
            insights.push('Insufficient cohort data for comprehensive analysis');
        }
        return insights;
    }
}
exports.ReportDeliveryService = ReportDeliveryService;
exports.reportDeliveryService = new ReportDeliveryService();
