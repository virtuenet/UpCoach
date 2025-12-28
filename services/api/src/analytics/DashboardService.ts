/**
 * Dashboard Service
 * Configurable, role-based dashboards with real-time data visualization
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { analyticsDataPipeline, AnalyticsMetrics } from './AnalyticsDataPipeline';

/**
 * Dashboard Types
 */
export type DashboardType = 'user' | 'coach' | 'organization' | 'admin';

/**
 * Widget Types
 */
export type WidgetType =
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'heatmap'
  | 'scorecard'
  | 'table'
  | 'funnel'
  | 'cohort_retention';

/**
 * Widget Configuration
 */
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
  config: {
    metric?: string;
    dataSource?: string;
    timeRange?: '24h' | '7d' | '30d' | '90d' | 'custom';
    customDateRange?: { start: Date; end: Date };
    groupBy?: 'hour' | 'day' | 'week' | 'month';
    filters?: Record<string, any>;
    chartOptions?: Record<string, any>;
  };
  refreshInterval?: number; // seconds, 0 = manual only
}

/**
 * Dashboard Configuration
 */
export interface Dashboard {
  id: string;
  tenantId: string;
  userId?: string; // null for shared dashboards
  name: string;
  description?: string;
  type: DashboardType;
  widgets: Widget[];
  isPublic: boolean;
  settings: {
    autoRefresh: boolean;
    refreshInterval: number; // seconds
    theme: 'light' | 'dark' | 'auto';
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dashboard Data
 */
export interface DashboardData {
  dashboardId: string;
  widgets: Array<{
    widgetId: string;
    data: any;
    lastUpdated: Date;
    error?: string;
  }>;
  generatedAt: Date;
}

/**
 * Alert Configuration
 */
export interface Alert {
  id: string;
  dashboardId: string;
  widgetId: string;
  name: string;
  condition: {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number;
    duration?: number; // minutes - how long condition must be true
  };
  actions: Array<{
    type: 'email' | 'slack' | 'webhook';
    config: Record<string, any>;
  }>;
  enabled: boolean;
  lastTriggered?: Date;
  createdAt: Date;
}

/**
 * Dashboard Service
 */
export class DashboardService extends EventEmitter {
  private static instance: DashboardService;
  private dashboards: Map<string, Dashboard> = new Map();
  private dashboardData: Map<string, DashboardData> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private liveConnections: Map<string, Set<string>> = new Map(); // dashboardId -> userIds

  private constructor() {
    super();
    this.initializeDefaultDashboards();
  }

  static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  /**
   * Create Dashboard
   */
  async createDashboard(config: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard> {
    const dashboard: Dashboard = {
      ...config,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dashboards.set(dashboard.id, dashboard);
    this.emit('dashboard:created', dashboard);

    return dashboard;
  }

  /**
   * Update Dashboard
   */
  async updateDashboard(
    dashboardId: string,
    updates: Partial<Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Dashboard> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) throw new Error('Dashboard not found');

    Object.assign(dashboard, updates, { updatedAt: new Date() });
    this.emit('dashboard:updated', dashboard);

    return dashboard;
  }

  /**
   * Delete Dashboard
   */
  async deleteDashboard(dashboardId: string): Promise<void> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) throw new Error('Dashboard not found');

    this.dashboards.delete(dashboardId);
    this.dashboardData.delete(dashboardId);
    this.emit('dashboard:deleted', { dashboardId });
  }

  /**
   * Get Dashboard
   */
  async getDashboard(dashboardId: string): Promise<Dashboard> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) throw new Error('Dashboard not found');
    return dashboard;
  }

  /**
   * List Dashboards
   */
  async listDashboards(filters: {
    tenantId?: string;
    userId?: string;
    type?: DashboardType;
  }): Promise<Dashboard[]> {
    return Array.from(this.dashboards.values()).filter(d => {
      if (filters.tenantId && d.tenantId !== filters.tenantId) return false;
      if (filters.userId && d.userId !== filters.userId) return false;
      if (filters.type && d.type !== filters.type) return false;
      return true;
    });
  }

  /**
   * Add Widget to Dashboard
   */
  async addWidget(dashboardId: string, widget: Omit<Widget, 'id'>): Promise<Widget> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) throw new Error('Dashboard not found');

    const newWidget: Widget = {
      ...widget,
      id: crypto.randomUUID(),
    };

    dashboard.widgets.push(newWidget);
    dashboard.updatedAt = new Date();

    this.emit('widget:added', { dashboardId, widget: newWidget });

    return newWidget;
  }

  /**
   * Update Widget
   */
  async updateWidget(
    dashboardId: string,
    widgetId: string,
    updates: Partial<Omit<Widget, 'id'>>
  ): Promise<Widget> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) throw new Error('Dashboard not found');

    const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) throw new Error('Widget not found');

    Object.assign(dashboard.widgets[widgetIndex], updates);
    dashboard.updatedAt = new Date();

    this.emit('widget:updated', { dashboardId, widget: dashboard.widgets[widgetIndex] });

    return dashboard.widgets[widgetIndex];
  }

  /**
   * Remove Widget
   */
  async removeWidget(dashboardId: string, widgetId: string): Promise<void> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) throw new Error('Dashboard not found');

    dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
    dashboard.updatedAt = new Date();

    this.emit('widget:removed', { dashboardId, widgetId });
  }

  /**
   * Generate Dashboard Data
   */
  async generateDashboardData(dashboardId: string): Promise<DashboardData> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) throw new Error('Dashboard not found');

    const widgetData = await Promise.all(
      dashboard.widgets.map(async widget => {
        try {
          const data = await this.generateWidgetData(dashboard.tenantId, widget);
          return {
            widgetId: widget.id,
            data,
            lastUpdated: new Date(),
          };
        } catch (error: any) {
          return {
            widgetId: widget.id,
            data: null,
            lastUpdated: new Date(),
            error: error.message,
          };
        }
      })
    );

    const dashboardData: DashboardData = {
      dashboardId,
      widgets: widgetData,
      generatedAt: new Date(),
    };

    this.dashboardData.set(dashboardId, dashboardData);
    this.emit('dashboard:data_generated', dashboardData);

    // Check alerts
    await this.checkAlerts(dashboardId, dashboardData);

    return dashboardData;
  }

  /**
   * Generate Widget Data
   */
  private async generateWidgetData(tenantId: string, widget: Widget): Promise<any> {
    const { config } = widget;
    const { timeRange, customDateRange, groupBy, metric } = config;

    // Calculate date range
    let startDate: Date;
    let endDate = new Date();

    if (timeRange === 'custom' && customDateRange) {
      startDate = customDateRange.start;
      endDate = customDateRange.end;
    } else {
      const hours = {
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
        '90d': 24 * 90,
      }[timeRange || '24h'];

      startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    }

    // Query analytics data
    const result = await analyticsDataPipeline.query({
      tenantId,
      startDate,
      endDate,
      groupBy,
      filters: config.filters,
    });

    // Format data based on widget type
    switch (widget.type) {
      case 'scorecard':
        return this.formatScorecardData(result.metrics, metric);

      case 'line_chart':
      case 'bar_chart':
        return this.formatChartData(result.timeSeries || [], widget.type);

      case 'pie_chart':
        return this.formatPieChartData(result.metrics, metric);

      case 'table':
        return this.formatTableData(result.events || []);

      case 'heatmap':
        return this.formatHeatmapData(result.events || []);

      case 'cohort_retention':
        return this.formatCohortData(result);

      default:
        return result;
    }
  }

  /**
   * Format Scorecard Data
   */
  private formatScorecardData(metrics: Partial<AnalyticsMetrics>, metricPath?: string): any {
    if (!metricPath) return { value: 0, label: 'No metric specified' };

    const keys = metricPath.split('.');
    let value: any = metrics;

    for (const key of keys) {
      value = value?.[key];
    }

    return {
      value: value ?? 0,
      label: metricPath,
      trend: 0, // TODO: Calculate trend from historical data
    };
  }

  /**
   * Format Chart Data
   */
  private formatChartData(
    timeSeries: Array<{ timestamp: Date; value: number }>,
    type: 'line_chart' | 'bar_chart'
  ): any {
    return {
      labels: timeSeries.map(d => d.timestamp.toISOString()),
      datasets: [
        {
          label: 'Value',
          data: timeSeries.map(d => d.value),
        },
      ],
    };
  }

  /**
   * Format Pie Chart Data
   */
  private formatPieChartData(metrics: Partial<AnalyticsMetrics>, metricPath?: string): any {
    // Example: feature usage breakdown
    const featureUsage = metrics.engagement?.featureUsage || {};

    return {
      labels: Object.keys(featureUsage),
      datasets: [
        {
          data: Object.values(featureUsage),
        },
      ],
    };
  }

  /**
   * Format Table Data
   */
  private formatTableData(events: any[]): any {
    return {
      columns: ['Event Type', 'User ID', 'Timestamp', 'Details'],
      rows: events.slice(0, 100).map(e => [
        e.eventType,
        e.userId || 'Anonymous',
        e.timestamp.toISOString(),
        JSON.stringify(e.eventData),
      ]),
    };
  }

  /**
   * Format Heatmap Data
   */
  private formatHeatmapData(events: any[]): any {
    // Activity heatmap by hour and day of week
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));

    events.forEach(event => {
      const day = event.timestamp.getDay();
      const hour = event.timestamp.getHours();
      heatmap[day][hour]++;
    });

    return {
      data: heatmap,
      labels: {
        x: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        y: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      },
    };
  }

  /**
   * Format Cohort Data
   */
  private formatCohortData(result: any): any {
    // Simplified cohort retention matrix
    return {
      cohorts: [],
      retentionMatrix: [],
      labels: ['Week 0', 'Week 1', 'Week 2', 'Week 3', 'Week 4'],
    };
  }

  /**
   * Create Alert
   */
  async createAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    this.alerts.set(newAlert.id, newAlert);
    this.emit('alert:created', newAlert);

    return newAlert;
  }

  /**
   * Check Alerts
   */
  private async checkAlerts(dashboardId: string, dashboardData: DashboardData): Promise<void> {
    const alerts = Array.from(this.alerts.values()).filter(
      a => a.dashboardId === dashboardId && a.enabled
    );

    for (const alert of alerts) {
      const widgetData = dashboardData.widgets.find(w => w.widgetId === alert.widgetId);
      if (!widgetData || widgetData.error) continue;

      const metricValue = this.extractMetricValue(widgetData.data, alert.condition.metric);
      const triggered = this.evaluateCondition(metricValue, alert.condition);

      if (triggered) {
        await this.triggerAlert(alert, metricValue);
      }
    }
  }

  /**
   * Extract Metric Value
   */
  private extractMetricValue(data: any, metricPath: string): number {
    const keys = metricPath.split('.');
    let value: any = data;

    for (const key of keys) {
      value = value?.[key];
    }

    return typeof value === 'number' ? value : 0;
  }

  /**
   * Evaluate Condition
   */
  private evaluateCondition(value: number, condition: Alert['condition']): boolean {
    const { operator, threshold } = condition;

    switch (operator) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      case '==':
        return value === threshold;
      case '!=':
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Trigger Alert
   */
  private async triggerAlert(alert: Alert, value: number): Promise<void> {
    alert.lastTriggered = new Date();

    this.emit('alert:triggered', {
      alertId: alert.id,
      alertName: alert.name,
      value,
      threshold: alert.condition.threshold,
      timestamp: new Date(),
    });

    // Execute alert actions
    for (const action of alert.actions) {
      try {
        await this.executeAlertAction(action, alert, value);
      } catch (error: any) {
        this.emit('alert:action_failed', {
          alertId: alert.id,
          actionType: action.type,
          error: error.message,
        });
      }
    }
  }

  /**
   * Execute Alert Action
   */
  private async executeAlertAction(
    action: Alert['actions'][0],
    alert: Alert,
    value: number
  ): Promise<void> {
    switch (action.type) {
      case 'email':
        // Send email notification
        this.emit('alert:email_sent', {
          to: action.config.recipients,
          subject: `Alert: ${alert.name}`,
          body: `Metric ${alert.condition.metric} is ${value} (threshold: ${alert.condition.threshold})`,
        });
        break;

      case 'slack':
        // Send Slack notification
        this.emit('alert:slack_sent', {
          channel: action.config.channel,
          message: `🚨 Alert: ${alert.name} - Value: ${value}`,
        });
        break;

      case 'webhook':
        // Call webhook
        this.emit('alert:webhook_called', {
          url: action.config.url,
          payload: { alert, value, timestamp: new Date() },
        });
        break;
    }
  }

  /**
   * Subscribe to Live Updates
   */
  async subscribeToDashboard(dashboardId: string, userId: string): Promise<void> {
    if (!this.liveConnections.has(dashboardId)) {
      this.liveConnections.set(dashboardId, new Set());
    }

    this.liveConnections.get(dashboardId)!.add(userId);
    this.emit('dashboard:subscription_added', { dashboardId, userId });
  }

  /**
   * Unsubscribe from Live Updates
   */
  async unsubscribeFromDashboard(dashboardId: string, userId: string): Promise<void> {
    const connections = this.liveConnections.get(dashboardId);
    if (connections) {
      connections.delete(userId);
      if (connections.size === 0) {
        this.liveConnections.delete(dashboardId);
      }
    }

    this.emit('dashboard:subscription_removed', { dashboardId, userId });
  }

  /**
   * Initialize Default Dashboards
   */
  private initializeDefaultDashboards(): void {
    // User Dashboard Template
    const userDashboardTemplate: Omit<Dashboard, 'id' | 'tenantId' | 'userId' | 'createdBy' | 'createdAt' | 'updatedAt'> = {
      name: 'Personal Progress Dashboard',
      description: 'Track your goals, habits, and overall progress',
      type: 'user',
      isPublic: false,
      settings: {
        autoRefresh: true,
        refreshInterval: 300,
        theme: 'auto',
      },
      widgets: [
        {
          id: crypto.randomUUID(),
          type: 'scorecard',
          title: 'Active Goals',
          size: 'small',
          position: { x: 0, y: 0 },
          config: {
            metric: 'goals.activeGoals',
            timeRange: '30d',
          },
        },
        {
          id: crypto.randomUUID(),
          type: 'scorecard',
          title: 'Completion Rate',
          size: 'small',
          position: { x: 1, y: 0 },
          config: {
            metric: 'goals.completionRate',
            timeRange: '30d',
          },
        },
        {
          id: crypto.randomUUID(),
          type: 'line_chart',
          title: 'Goal Progress Over Time',
          size: 'large',
          position: { x: 0, y: 1 },
          config: {
            metric: 'goals.completed',
            timeRange: '30d',
            groupBy: 'day',
          },
        },
        {
          id: crypto.randomUUID(),
          type: 'heatmap',
          title: 'Activity Heatmap',
          size: 'medium',
          position: { x: 0, y: 2 },
          config: {
            timeRange: '7d',
          },
        },
      ],
    };

    // Store template (will be cloned when user creates their dashboard)
    this.emit('templates:initialized', { userDashboard: userDashboardTemplate });
  }

  /**
   * Clone Template Dashboard
   */
  async cloneDashboardTemplate(
    templateType: DashboardType,
    tenantId: string,
    userId: string
  ): Promise<Dashboard> {
    // Implementation would clone the template with new IDs
    const dashboard = await this.createDashboard({
      tenantId,
      userId,
      name: `My ${templateType} Dashboard`,
      description: 'Cloned from template',
      type: templateType,
      isPublic: false,
      settings: {
        autoRefresh: true,
        refreshInterval: 300,
        theme: 'auto',
      },
      widgets: [],
      createdBy: userId,
    });

    return dashboard;
  }

  /**
   * Export Dashboard Data
   */
  async exportDashboardData(
    dashboardId: string,
    format: 'json' | 'csv' | 'pdf'
  ): Promise<{ data: any; filename: string }> {
    const dashboardData = await this.generateDashboardData(dashboardId);
    const dashboard = await this.getDashboard(dashboardId);

    const filename = `dashboard_${dashboard.name.replace(/\s+/g, '_')}_${new Date().toISOString()}`;

    switch (format) {
      case 'json':
        return {
          data: JSON.stringify(dashboardData, null, 2),
          filename: `${filename}.json`,
        };

      case 'csv':
        // Convert to CSV format
        const csv = this.convertToCSV(dashboardData);
        return {
          data: csv,
          filename: `${filename}.csv`,
        };

      case 'pdf':
        // Generate PDF (would use a library like pdfkit)
        return {
          data: 'PDF generation not implemented',
          filename: `${filename}.pdf`,
        };

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Convert Dashboard Data to CSV
   */
  private convertToCSV(dashboardData: DashboardData): string {
    const rows: string[] = [];
    rows.push('Widget ID,Widget Type,Metric,Value,Last Updated');

    dashboardData.widgets.forEach(widget => {
      const value = JSON.stringify(widget.data);
      rows.push(`${widget.widgetId},${value},${widget.lastUpdated.toISOString()}`);
    });

    return rows.join('\n');
  }
}

export const dashboardService = DashboardService.getInstance();
