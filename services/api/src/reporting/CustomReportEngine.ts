import { EventEmitter } from 'events';
import * as nodemailer from 'nodemailer';
import * as schedule from 'node-schedule';
import PDFKit from 'pdfkit';
import ExcelJS from 'exceljs';
import { createObjectCsvStringifier } from 'csv-writer';
import { v4 as uuidv4 } from 'uuid';

/**
 * Custom Report Engine
 *
 * Allows users to create, schedule, and share custom reports
 * with flexible data sources, filters, and visualizations.
 *
 * Features:
 * - Report definition management
 * - Report generation from data sources
 * - Scheduled report delivery (cron jobs)
 * - Email delivery with attachments
 * - Report versioning
 * - Sharing and collaboration
 * - Export to PDF, Excel, CSV
 */

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  organizationId: string;
  dataSource: DataSource;
  filters: ReportFilter[];
  metrics: ReportMetric[];
  dimensions: string[];
  visualizations: Visualization[];
  layout: ReportLayout;
  schedule?: ReportSchedule;
  sharing: SharingConfig;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataSource {
  type: 'users' | 'goals' | 'habits' | 'sessions' | 'revenue' | 'engagement' | 'custom_query';
  collection?: string;
  query?: string;
  parameters: Record<string, any>;
  joinWith?: string[];
}

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'between';
  value: any;
  condition?: 'and' | 'or';
}

export interface ReportMetric {
  name: string;
  field: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct';
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  decimals?: number;
}

export interface Visualization {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'text' | 'image';
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';
  config: VisualizationConfig;
  position: { x: number; y: number; width: number; height: number };
}

export interface VisualizationConfig {
  title?: string;
  dataKey?: string;
  xAxis?: string;
  yAxis?: string;
  colorScheme?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  content?: string;
  imageUrl?: string;
}

export interface ReportLayout {
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  header?: string;
  footer?: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string;
  timezone: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  enabled: boolean;
}

export interface SharingConfig {
  type: 'private' | 'team' | 'organization' | 'public';
  sharedWith?: string[];
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canShare: boolean;
  };
}

export interface ReportOutput {
  reportId: string;
  generatedAt: Date;
  data: any[];
  metrics: Record<string, number>;
  visualizations: GeneratedVisualization[];
  metadata: {
    rowCount: number;
    executionTime: number;
    dataSourceVersion: string;
  };
}

export interface GeneratedVisualization {
  id: string;
  type: string;
  data: any;
  config: VisualizationConfig;
}

export class CustomReportEngine extends EventEmitter {
  private reports: Map<string, ReportDefinition> = new Map();
  private scheduledJobs: Map<string, schedule.Job> = new Map();
  private emailTransporter: nodemailer.Transporter;
  private database: any;

  constructor(database: any) {
    super();
    this.database = database;

    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  /**
   * Create new report definition
   */
  async createReport(
    userId: string,
    definition: Partial<ReportDefinition>
  ): Promise<ReportDefinition> {
    const report: ReportDefinition = {
      id: uuidv4(),
      name: definition.name || 'Untitled Report',
      description: definition.description || '',
      createdBy: userId,
      organizationId: definition.organizationId!,
      dataSource: definition.dataSource!,
      filters: definition.filters || [],
      metrics: definition.metrics || [],
      dimensions: definition.dimensions || [],
      visualizations: definition.visualizations || [],
      layout: definition.layout || this.getDefaultLayout(),
      schedule: definition.schedule,
      sharing: definition.sharing || {
        type: 'private',
        permissions: { canView: false, canEdit: false, canShare: false },
      },
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.saveReport(report);

    if (report.schedule?.enabled) {
      await this.scheduleReport(report);
    }

    this.emit('report:created', report);
    return report;
  }

  /**
   * Update existing report
   */
  async updateReport(
    reportId: string,
    updates: Partial<ReportDefinition>
  ): Promise<ReportDefinition> {
    const existing = await this.getReport(reportId);
    if (!existing) {
      throw new Error(`Report ${reportId} not found`);
    }

    const updated: ReportDefinition = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      updatedAt: new Date(),
    };

    await this.saveReport(updated);

    if (updated.schedule?.enabled) {
      await this.updateScheduledReport(updated);
    } else {
      await this.cancelScheduledReport(reportId);
    }

    this.emit('report:updated', updated);
    return updated;
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string): Promise<void> {
    await this.cancelScheduledReport(reportId);
    this.reports.delete(reportId);
    await this.database.collection('reports').deleteOne({ id: reportId });
    this.emit('report:deleted', { reportId });
  }

  /**
   * Get report by ID
   */
  async getReport(reportId: string): Promise<ReportDefinition> {
    let report = this.reports.get(reportId);
    if (!report) {
      const doc = await this.database.collection('reports').findOne({ id: reportId });
      if (doc) {
        report = doc as ReportDefinition;
        this.reports.set(reportId, report);
      }
    }
    return report!;
  }

  /**
   * List reports for organization
   */
  async listReports(
    organizationId: string,
    filters?: { createdBy?: string; type?: string }
  ): Promise<ReportDefinition[]> {
    const query: any = { organizationId };
    if (filters?.createdBy) {
      query.createdBy = filters.createdBy;
    }

    const reports = await this.database
      .collection('reports')
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray();

    return reports as ReportDefinition[];
  }

  /**
   * Generate report data
   */
  async generateReport(reportId: string): Promise<ReportOutput> {
    const startTime = Date.now();
    const definition = await this.getReport(reportId);

    const data = await this.executeQuery(definition.dataSource, definition.filters);

    const metrics = await this.calculateMetrics(data, definition.metrics);

    const visualizations = await this.generateVisualizations(
      data,
      definition.visualizations,
      metrics
    );

    const output: ReportOutput = {
      reportId,
      generatedAt: new Date(),
      data,
      metrics,
      visualizations,
      metadata: {
        rowCount: data.length,
        executionTime: Date.now() - startTime,
        dataSourceVersion: definition.version.toString(),
      },
    };

    this.emit('report:generated', { reportId, rowCount: data.length });
    return output;
  }

  /**
   * Execute data query
   */
  private async executeQuery(
    dataSource: DataSource,
    filters: ReportFilter[]
  ): Promise<any[]> {
    const query: any = {};

    filters.forEach(filter => {
      switch (filter.operator) {
        case 'eq':
          query[filter.field] = filter.value;
          break;
        case 'ne':
          query[filter.field] = { $ne: filter.value };
          break;
        case 'gt':
          query[filter.field] = { $gt: filter.value };
          break;
        case 'gte':
          query[filter.field] = { $gte: filter.value };
          break;
        case 'lt':
          query[filter.field] = { $lt: filter.value };
          break;
        case 'lte':
          query[filter.field] = { $lte: filter.value };
          break;
        case 'in':
          query[filter.field] = { $in: filter.value };
          break;
        case 'contains':
          query[filter.field] = { $regex: filter.value, $options: 'i' };
          break;
        case 'between':
          query[filter.field] = { $gte: filter.value[0], $lte: filter.value[1] };
          break;
      }
    });

    let collection = dataSource.type;
    if (dataSource.collection) {
      collection = dataSource.collection;
    }

    const data = await this.database
      .collection(collection)
      .find(query)
      .limit(10000)
      .toArray();

    return data;
  }

  /**
   * Calculate metrics from data
   */
  private async calculateMetrics(
    data: any[],
    metricDefs: ReportMetric[]
  ): Promise<Record<string, number>> {
    const metrics: Record<string, number> = {};

    for (const metric of metricDefs) {
      let value = 0;

      switch (metric.aggregation) {
        case 'count':
          value = data.length;
          break;
        case 'sum':
          value = data.reduce((sum, row) => sum + (row[metric.field] || 0), 0);
          break;
        case 'avg':
          value = data.reduce((sum, row) => sum + (row[metric.field] || 0), 0) / data.length;
          break;
        case 'min':
          value = Math.min(...data.map(row => row[metric.field] || Infinity));
          break;
        case 'max':
          value = Math.max(...data.map(row => row[metric.field] || -Infinity));
          break;
        case 'distinct':
          value = new Set(data.map(row => row[metric.field])).size;
          break;
      }

      if (metric.decimals !== undefined) {
        value = parseFloat(value.toFixed(metric.decimals));
      }

      metrics[metric.name] = value;
    }

    return metrics;
  }

  /**
   * Generate visualizations
   */
  private async generateVisualizations(
    data: any[],
    vizDefs: Visualization[],
    metrics: Record<string, number>
  ): Promise<GeneratedVisualization[]> {
    const visualizations: GeneratedVisualization[] = [];

    for (const vizDef of vizDefs) {
      let vizData: any = null;

      switch (vizDef.type) {
        case 'chart':
          vizData = this.generateChartData(data, vizDef);
          break;
        case 'table':
          vizData = this.generateTableData(data, vizDef);
          break;
        case 'metric':
          vizData = this.generateMetricData(metrics, vizDef);
          break;
        case 'text':
          vizData = vizDef.config.content;
          break;
        case 'image':
          vizData = vizDef.config.imageUrl;
          break;
      }

      visualizations.push({
        id: vizDef.id,
        type: vizDef.type,
        data: vizData,
        config: vizDef.config,
      });
    }

    return visualizations;
  }

  /**
   * Generate chart data
   */
  private generateChartData(data: any[], vizDef: Visualization): any {
    const { xAxis, yAxis, dataKey } = vizDef.config;

    if (vizDef.chartType === 'pie') {
      const grouped = this.groupBy(data, dataKey!);
      return Object.entries(grouped).map(([key, values]) => ({
        name: key,
        value: (values as any[]).length,
      }));
    }

    return data.map(row => ({
      x: row[xAxis!],
      y: row[yAxis!],
      label: row[dataKey!],
    }));
  }

  /**
   * Generate table data
   */
  private generateTableData(data: any[], vizDef: Visualization): any {
    return {
      columns: Object.keys(data[0] || {}),
      rows: data.slice(0, 100),
    };
  }

  /**
   * Generate metric data
   */
  private generateMetricData(
    metrics: Record<string, number>,
    vizDef: Visualization
  ): any {
    const metricName = vizDef.config.dataKey!;
    return {
      value: metrics[metricName] || 0,
      name: vizDef.config.title || metricName,
    };
  }

  /**
   * Export report to PDF
   */
  async exportToPDF(reportId: string): Promise<Buffer> {
    const output = await this.generateReport(reportId);
    const definition = await this.getReport(reportId);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFKit({
        size: definition.layout.pageSize,
        layout: definition.layout.orientation,
        margins: definition.layout.margins,
      });

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(24).text(definition.name, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(definition.description, { align: 'left' });
      doc.moveDown(2);

      doc.fontSize(14).text('Key Metrics', { underline: true });
      doc.moveDown();

      Object.entries(output.metrics).forEach(([name, value]) => {
        doc.fontSize(12).text(`${name}: ${this.formatNumber(value)}`);
      });

      doc.addPage();
      doc.fontSize(14).text('Data Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(10).text(`Total Records: ${output.data.length}`);
      doc.text(`Generated: ${output.generatedAt.toLocaleString()}`);
      doc.text(`Execution Time: ${output.metadata.executionTime}ms`);

      if (output.data.length > 0) {
        doc.addPage();
        doc.fontSize(14).text('Data Preview (First 20 rows)', { underline: true });
        doc.moveDown();

        const columns = Object.keys(output.data[0]);
        const preview = output.data.slice(0, 20);

        doc.fontSize(8);
        preview.forEach((row, idx) => {
          doc.text(`Row ${idx + 1}:`);
          columns.forEach(col => {
            doc.text(`  ${col}: ${row[col]}`);
          });
          doc.moveDown(0.5);
        });
      }

      doc.end();
    });
  }

  /**
   * Export report to Excel
   */
  async exportToExcel(reportId: string): Promise<Buffer> {
    const output = await this.generateReport(reportId);
    const definition = await this.getReport(reportId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'UpCoach Analytics';
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Report Name', definition.name]);
    summarySheet.addRow(['Description', definition.description]);
    summarySheet.addRow(['Generated', output.generatedAt.toISOString()]);
    summarySheet.addRow([]);
    summarySheet.addRow(['Key Metrics']);

    Object.entries(output.metrics).forEach(([name, value]) => {
      summarySheet.addRow([name, value]);
    });

    const dataSheet = workbook.addWorksheet('Data');
    if (output.data.length > 0) {
      const columns = Object.keys(output.data[0]);
      dataSheet.addRow(columns);

      output.data.forEach(row => {
        dataSheet.addRow(columns.map(col => row[col]));
      });

      dataSheet.getRow(1).font = { bold: true };
      dataSheet.columns = columns.map(col => ({
        key: col,
        width: 15,
      }));
    }

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  /**
   * Export report to CSV
   */
  async exportToCSV(reportId: string): Promise<Buffer> {
    const output = await this.generateReport(reportId);

    if (output.data.length === 0) {
      return Buffer.from('No data available');
    }

    const columns = Object.keys(output.data[0]);
    const csvStringifier = createObjectCsvStringifier({
      header: columns.map(col => ({ id: col, title: col })),
    });

    const header = csvStringifier.getHeaderString();
    const records = csvStringifier.stringifyRecords(output.data);

    return Buffer.from(header + records);
  }

  /**
   * Schedule report delivery
   */
  private async scheduleReport(report: ReportDefinition): Promise<void> {
    const schedule = report.schedule!;
    const cronExpression = this.getCronExpression(schedule);

    const job = nodeSchedule.scheduleJob(cronExpression, async () => {
      try {
        await this.deliverScheduledReport(report);
      } catch (error) {
        this.emit('report:delivery:error', { reportId: report.id, error });
      }
    });

    this.scheduledJobs.set(report.id, job);
    this.emit('report:scheduled', { reportId: report.id, schedule });
  }

  /**
   * Update scheduled report
   */
  private async updateScheduledReport(report: ReportDefinition): Promise<void> {
    await this.cancelScheduledReport(report.id);
    if (report.schedule?.enabled) {
      await this.scheduleReport(report);
    }
  }

  /**
   * Cancel scheduled report
   */
  private async cancelScheduledReport(reportId: string): Promise<void> {
    const job = this.scheduledJobs.get(reportId);
    if (job) {
      job.cancel();
      this.scheduledJobs.delete(reportId);
      this.emit('report:unscheduled', { reportId });
    }
  }

  /**
   * Deliver scheduled report
   */
  private async deliverScheduledReport(report: ReportDefinition): Promise<void> {
    const schedule = report.schedule!;

    let attachment: Buffer;
    let filename: string;
    let contentType: string;

    switch (schedule.format) {
      case 'pdf':
        attachment = await this.exportToPDF(report.id);
        filename = `${report.name}.pdf`;
        contentType = 'application/pdf';
        break;
      case 'excel':
        attachment = await this.exportToExcel(report.id);
        filename = `${report.name}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'csv':
        attachment = await this.exportToCSV(report.id);
        filename = `${report.name}.csv`;
        contentType = 'text/csv';
        break;
    }

    for (const recipient of schedule.recipients) {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'reports@upcoach.com',
        to: recipient,
        subject: `Scheduled Report: ${report.name}`,
        html: `
          <h2>${report.name}</h2>
          <p>${report.description}</p>
          <p>Your scheduled report is attached.</p>
          <p><small>Generated at ${new Date().toLocaleString()}</small></p>
        `,
        attachments: [
          {
            filename,
            content: attachment,
            contentType,
          },
        ],
      });
    }

    this.emit('report:delivered', {
      reportId: report.id,
      recipients: schedule.recipients,
      format: schedule.format,
    });
  }

  /**
   * Get cron expression from schedule
   */
  private getCronExpression(schedule: ReportSchedule): string {
    const [hour, minute] = schedule.time.split(':').map(Number);

    switch (schedule.frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        return `${minute} ${hour} * * ${schedule.dayOfWeek || 0}`;
      case 'monthly':
        return `${minute} ${hour} ${schedule.dayOfMonth || 1} * *`;
      case 'quarterly':
        return `${minute} ${hour} 1 */3 *`;
      default:
        throw new Error(`Unsupported frequency: ${schedule.frequency}`);
    }
  }

  /**
   * Save report to database
   */
  private async saveReport(report: ReportDefinition): Promise<void> {
    await this.database.collection('reports').updateOne(
      { id: report.id },
      { $set: report },
      { upsert: true }
    );
    this.reports.set(report.id, report);
  }

  /**
   * Get default layout
   */
  private getDefaultLayout(): ReportLayout {
    return {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 50, right: 50, bottom: 50, left: 50 },
    };
  }

  /**
   * Group array by key
   */
  private groupBy(array: any[], key: string): Record<string, any[]> {
    return array.reduce((result, item) => {
      const group = item[key] || 'Unknown';
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    }, {});
  }

  /**
   * Format number for display
   */
  private formatNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(2);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    for (const [reportId, job] of this.scheduledJobs) {
      job.cancel();
    }
    this.scheduledJobs.clear();
    this.reports.clear();
    this.emit('cleanup:complete');
  }
}

export default CustomReportEngine;
