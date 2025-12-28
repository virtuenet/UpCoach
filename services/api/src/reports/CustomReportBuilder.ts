import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface ReportTemplate {
  id: string;
  tenantId: string;
  name: string;
  type: 'revenue' | 'users' | 'goals' | 'engagement' | 'custom';
  config: { dataSources: string[]; filters: any; groupBy: string[]; visualizations: any[]; };
  schedule?: { frequency: 'daily' | 'weekly' | 'monthly'; recipients: string[]; };
  createdBy: string;
  createdAt: Date;
}

export class CustomReportBuilder extends EventEmitter {
  private static instance: CustomReportBuilder;
  private templates: Map<string, ReportTemplate> = new Map();

  private constructor() { super(); }

  static getInstance(): CustomReportBuilder {
    if (!CustomReportBuilder.instance) {
      CustomReportBuilder.instance = new CustomReportBuilder();
    }
    return CustomReportBuilder.instance;
  }

  async createTemplate(config: Omit<ReportTemplate, 'id' | 'createdAt'>): Promise<ReportTemplate> {
    const template: ReportTemplate = { ...config, id: crypto.randomUUID(), createdAt: new Date() };
    this.templates.set(template.id, template);
    this.emit('template:created', template);
    return template;
  }

  async generateReport(templateId: string): Promise<any> {
    const template = this.templates.get(templateId);
    if (!template) throw new Error('Template not found');
    return { templateId, data: {}, generatedAt: new Date() };
  }

  async exportReport(templateId: string, format: 'pdf' | 'excel' | 'csv'): Promise<{ data: string; filename: string }> {
    return { data: 'Report data', filename: `report_${templateId}.${format}` };
  }
}

export const customReportBuilder = CustomReportBuilder.getInstance();
