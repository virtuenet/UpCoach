/**
 * Real-Time Dashboard Service for Multi-Platform Advertising Analytics
 *
 * Provides real-time metrics, streaming updates, and dashboard data aggregation
 * Features:
 * - WebSocket streaming for live updates
 * - Real-time metric aggregation
 * - Cross-platform comparison
 * - Alert triggering for anomalies
 * - Dashboard widget data preparation
 */

import { EventEmitter } from 'events';
import { Server as SocketServer } from 'socket.io';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { Logger } from 'winston';
import { AdPlatformIntegrationService } from './AdPlatformIntegrationService';
import { PredictiveAnalyticsService } from './PredictiveAnalyticsService';
import { PerformanceMonitor } from './PerformanceMonitor';

export interface DashboardMetrics {
  overview: {
    totalSpend: number;
    totalRevenue: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    averageROAS: number;
    profitMargin: number;
    activeCampaigns: number;
  };
  platformComparison: Array<{
    platform: string;
    spend: number;
    revenue: number;
    roas: number;
    conversions: number;
    cpa: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  topCampaigns: Array<{
    id: string;
    name: string;
    platform: string;
    spend: number;
    revenue: number;
    roas: number;
    status: string;
  }>;
  performanceTrends: {
    hourly: Array<{ hour: string; metrics: unknown }>;
    daily: Array<{ date: string; metrics: unknown }>;
    weekly: Array<{ week: string; metrics: unknown }>;
  };
  alerts: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info';
    type: string;
    message: string;
    timestamp: Date;
  }>;
  predictions: {
    nextDaySpend: number;
    nextDayRevenue: number;
    nextDayConversions: number;
    confidence: number;
  };
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'heatmap' | 'funnel';
  title: string;
  data: unknown;
  config: {
    refreshInterval?: number;
    chartType?: string;
    columns?: string[];
    filters?: unknown;
  };
}

export class RealTimeDashboardService extends EventEmitter {
  private logger: Logger;
  private redis: Redis;
  private db: Pool;
  private io?: SocketServer;
  private platformService: AdPlatformIntegrationService;
  private predictiveService: PredictiveAnalyticsService;
  private performanceMonitor: PerformanceMonitor;
  private updateInterval?: NodeJS.Timer;
  private connectedClients: Map<string, any>;
  private metricsCache: Map<string, any>;
  private alertThresholds: Map<string, number>;

  constructor(
    logger: Logger,
    redis: Redis,
    db: Pool,
    platformService: AdPlatformIntegrationService,
    predictiveService: PredictiveAnalyticsService
  ) {
    super();
    this.logger = logger;
    this.redis = redis;
    this.db = db;
    this.platformService = platformService;
    this.predictiveService = predictiveService;
    this.performanceMonitor = new PerformanceMonitor(logger, redis);
    this.connectedClients = new Map();
    this.metricsCache = new Map();
    this.alertThresholds = new Map([
      ['spend_spike', 1.5], // 50% increase
      ['roas_drop', 0.7], // 30% decrease
      ['cpa_increase', 1.3], // 30% increase
      ['impression_drop', 0.5] // 50% decrease
    ]);

    this.initializeEventListeners();
  }

  /**
   * Initialize WebSocket server
   */
  public initializeWebSocket(io: SocketServer): void {
    this.io = io;

    this.io.on('connection', (socket) => {
      this.logger.info(`Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, {
        socket,
        subscriptions: new Set(),
        lastActivity: new Date()
      });

      // Handle client subscriptions
      socket.on('subscribe', (data) => {
        this.handleSubscription(socket.id, data);
      });

      socket.on('unsubscribe', (data) => {
        this.handleUnsubscription(socket.id, data);
      });

      socket.on('request_metrics', async (data) => {
        await this.handleMetricsRequest(socket.id, data);
      });

      socket.on('disconnect', () => {
        this.logger.info(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });

      // Send initial dashboard data
      this.sendInitialData(socket.id);
    });
  }

  /**
   * Initialize event listeners for platform updates
   */
  private initializeEventListeners(): void {
    // Listen to platform service events
    this.platformService.on('sync:complete', (data) => {
      this.handlePlatformSync(data);
    });

    this.platformService.on('webhook:update', (data) => {
      this.handleWebhookUpdate(data);
    });

    // Listen to predictive service events
    this.predictiveService.on('prediction:ready', (data) => {
      this.handlePredictionUpdate(data);
    });

    // Performance monitor events
    this.performanceMonitor.on('anomaly:detected', (data) => {
      this.handleAnomaly(data);
    });
  }

  /**
   * Start real-time updates
   */
  public startRealtimeUpdates(intervalMs: number = 5000): void {
    this.logger.info('Starting real-time dashboard updates');

    this.updateInterval = setInterval(async () => {
      try {
        await this.refreshDashboardMetrics();
        await this.broadcastUpdates();
      } catch (error) {
        this.logger.error('Failed to update dashboard metrics', error);
      }
    }, intervalMs);

    // Start performance monitoring
    this.performanceMonitor.startMonitoring();
  }

  /**
   * Stop real-time updates
   */
  public stopRealtimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
    this.performanceMonitor.stopMonitoring();
    this.logger.info('Stopped real-time dashboard updates');
  }

  /**
   * Refresh dashboard metrics
   */
  private async refreshDashboardMetrics(): Promise<void> {
    const startTime = Date.now();

    try {
      // Fetch latest metrics from all platforms
      const [overview, platforms, campaigns, trends] = await Promise.all([
        this.fetchOverviewMetrics(),
        this.fetchPlatformComparison(),
        this.fetchTopCampaigns(),
        this.fetchPerformanceTrends()
      ]);

      // Get predictions
      const predictions = await this.predictiveService.getPredictions({
        horizon: 1,
        metrics: ['spend', 'revenue', 'conversions']
      });

      // Get active alerts
      const alerts = await this.getActiveAlerts();

      const dashboardMetrics: DashboardMetrics = {
        overview,
        platformComparison: platforms,
        topCampaigns: campaigns,
        performanceTrends: trends,
        alerts,
        predictions: {
          nextDaySpend: predictions.spend,
          nextDayRevenue: predictions.revenue,
          nextDayConversions: predictions.conversions,
          confidence: predictions.confidence
        }
      };

      // Cache metrics
      this.metricsCache.set('dashboard', dashboardMetrics);
      this.metricsCache.set('lastUpdate', new Date());

      // Store in Redis for persistence
      await this.redis.setex(
        'dashboard:metrics:latest',
        300, // 5 minutes TTL
        JSON.stringify(dashboardMetrics)
      );

      const duration = Date.now() - startTime;
      this.logger.debug(`Dashboard metrics refreshed in ${duration}ms`);
    } catch (error) {
      this.logger.error('Failed to refresh dashboard metrics', error);
      throw error;
    }
  }

  /**
   * Fetch overview metrics
   */
  private async fetchOverviewMetrics(): Promise<DashboardMetrics['overview']> {
    const query = `
      SELECT
        COUNT(DISTINCT campaign_key) as active_campaigns,
        SUM(spend) as total_spend,
        SUM(conversion_value) as total_revenue,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions,
        AVG(roas) as avg_roas
      FROM fact_campaign_performance f
      JOIN dim_campaigns c ON f.campaign_key = c.campaign_key
      JOIN dim_date d ON f.date_key = d.date_key
      WHERE c.status = 'ACTIVE'
        AND d.full_date = CURRENT_DATE
    `;

    const result = await this.db.query(query);
    const data = result.rows[0];

    return {
      totalSpend: parseFloat(data.total_spend) || 0,
      totalRevenue: parseFloat(data.total_revenue) || 0,
      totalImpressions: parseInt(data.total_impressions) || 0,
      totalClicks: parseInt(data.total_clicks) || 0,
      totalConversions: parseInt(data.total_conversions) || 0,
      averageROAS: parseFloat(data.avg_roas) || 0,
      profitMargin: data.total_revenue > 0 ?
        ((data.total_revenue - data.total_spend) / data.total_revenue) * 100 : 0,
      activeCampaigns: parseInt(data.active_campaigns) || 0
    };
  }

  /**
   * Fetch platform comparison data
   */
  private async fetchPlatformComparison(): Promise<DashboardMetrics['platformComparison']> {
    const query = `
      WITH current_period AS (
        SELECT
          p.platform_name,
          SUM(f.spend) as spend,
          SUM(f.conversion_value) as revenue,
          SUM(f.conversions) as conversions,
          AVG(f.roas) as roas,
          AVG(f.cpa) as cpa
        FROM fact_campaign_performance f
        JOIN dim_platforms p ON f.platform_id = p.platform_id
        JOIN dim_date d ON f.date_key = d.date_key
        WHERE d.full_date = CURRENT_DATE
        GROUP BY p.platform_name
      ),
      previous_period AS (
        SELECT
          p.platform_name,
          SUM(f.spend) as prev_spend
        FROM fact_campaign_performance f
        JOIN dim_platforms p ON f.platform_id = p.platform_id
        JOIN dim_date d ON f.date_key = d.date_key
        WHERE d.full_date = CURRENT_DATE - INTERVAL '1 day'
        GROUP BY p.platform_name
      )
      SELECT
        c.*,
        CASE
          WHEN c.spend > COALESCE(p.prev_spend, 0) * 1.1 THEN 'up'
          WHEN c.spend < COALESCE(p.prev_spend, 0) * 0.9 THEN 'down'
          ELSE 'stable'
        END as trend
      FROM current_period c
      LEFT JOIN previous_period p ON c.platform_name = p.platform_name
      ORDER BY c.spend DESC
    `;

    const result = await this.db.query(query);
    return result.rows.map(row => ({
      platform: row.platform_name,
      spend: parseFloat(row.spend) || 0,
      revenue: parseFloat(row.revenue) || 0,
      roas: parseFloat(row.roas) || 0,
      conversions: parseInt(row.conversions) || 0,
      cpa: parseFloat(row.cpa) || 0,
      trend: row.trend as 'up' | 'down' | 'stable'
    }));
  }

  /**
   * Fetch top performing campaigns
   */
  private async fetchTopCampaigns(limit: number = 10): Promise<DashboardMetrics['topCampaigns']> {
    const query = `
      SELECT
        c.campaign_id as id,
        c.campaign_name as name,
        p.platform_name as platform,
        c.status,
        SUM(f.spend) as spend,
        SUM(f.conversion_value) as revenue,
        AVG(f.roas) as roas
      FROM fact_campaign_performance f
      JOIN dim_campaigns c ON f.campaign_key = c.campaign_key
      JOIN dim_platforms p ON c.platform_id = p.platform_id
      JOIN dim_date d ON f.date_key = d.date_key
      WHERE d.full_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY c.campaign_id, c.campaign_name, p.platform_name, c.status
      ORDER BY revenue DESC
      LIMIT $1
    `;

    const result = await this.db.query(query, [limit]);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      platform: row.platform,
      status: row.status,
      spend: parseFloat(row.spend) || 0,
      revenue: parseFloat(row.revenue) || 0,
      roas: parseFloat(row.roas) || 0
    }));
  }

  /**
   * Fetch performance trends
   */
  private async fetchPerformanceTrends(): Promise<DashboardMetrics['performanceTrends']> {
    const [hourly, daily, weekly] = await Promise.all([
      this.fetchHourlyTrends(),
      this.fetchDailyTrends(),
      this.fetchWeeklyTrends()
    ]);

    return { hourly, daily, weekly };
  }

  /**
   * Fetch hourly trends for today
   */
  private async fetchHourlyTrends(): Promise<any[]> {
    const query = `
      SELECT
        t.hour_24 as hour,
        SUM(f.impressions) as impressions,
        SUM(f.clicks) as clicks,
        SUM(f.spend) as spend,
        SUM(f.conversions) as conversions,
        AVG(f.ctr) as ctr,
        AVG(f.roas) as roas
      FROM fact_campaign_performance f
      JOIN dim_time t ON f.time_key = t.time_key
      JOIN dim_date d ON f.date_key = d.date_key
      WHERE d.full_date = CURRENT_DATE
      GROUP BY t.hour_24
      ORDER BY t.hour_24
    `;

    const result = await this.db.query(query);
    return result.rows.map(row => ({
      hour: row.hour,
      metrics: {
        impressions: parseInt(row.impressions) || 0,
        clicks: parseInt(row.clicks) || 0,
        spend: parseFloat(row.spend) || 0,
        conversions: parseInt(row.conversions) || 0,
        ctr: parseFloat(row.ctr) || 0,
        roas: parseFloat(row.roas) || 0
      }
    }));
  }

  /**
   * Fetch daily trends for the last 30 days
   */
  private async fetchDailyTrends(): Promise<any[]> {
    const query = `
      SELECT
        d.full_date as date,
        SUM(f.impressions) as impressions,
        SUM(f.clicks) as clicks,
        SUM(f.spend) as spend,
        SUM(f.conversions) as conversions,
        SUM(f.conversion_value) as revenue
      FROM fact_campaign_performance f
      JOIN dim_date d ON f.date_key = d.date_key
      WHERE d.full_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY d.full_date
      ORDER BY d.full_date
    `;

    const result = await this.db.query(query);
    return result.rows.map(row => ({
      date: row.date,
      metrics: {
        impressions: parseInt(row.impressions) || 0,
        clicks: parseInt(row.clicks) || 0,
        spend: parseFloat(row.spend) || 0,
        conversions: parseInt(row.conversions) || 0,
        revenue: parseFloat(row.revenue) || 0
      }
    }));
  }

  /**
   * Fetch weekly trends
   */
  private async fetchWeeklyTrends(): Promise<any[]> {
    const query = `
      SELECT
        d.year || '-W' || LPAD(d.week_of_year::text, 2, '0') as week,
        SUM(f.impressions) as impressions,
        SUM(f.clicks) as clicks,
        SUM(f.spend) as spend,
        SUM(f.conversions) as conversions,
        SUM(f.conversion_value) as revenue,
        AVG(f.roas) as roas
      FROM fact_campaign_performance f
      JOIN dim_date d ON f.date_key = d.date_key
      WHERE d.full_date >= CURRENT_DATE - INTERVAL '12 weeks'
      GROUP BY d.year, d.week_of_year
      ORDER BY d.year, d.week_of_year
    `;

    const result = await this.db.query(query);
    return result.rows.map(row => ({
      week: row.week,
      metrics: {
        impressions: parseInt(row.impressions) || 0,
        clicks: parseInt(row.clicks) || 0,
        spend: parseFloat(row.spend) || 0,
        conversions: parseInt(row.conversions) || 0,
        revenue: parseFloat(row.revenue) || 0,
        roas: parseFloat(row.roas) || 0
      }
    }));
  }

  /**
   * Get active alerts
   */
  private async getActiveAlerts(): Promise<any[]> {
    const alerts = [];

    // Check cached alerts
    const cachedAlerts = await this.redis.lrange('alerts:active', 0, -1);
    for (const alert of cachedAlerts) {
      alerts.push(JSON.parse(alert));
    }

    // Check for new anomalies
    const anomalies = await this.performanceMonitor.checkAnomalies();
    for (const anomaly of anomalies) {
      alerts.push({
        id: anomaly.id,
        severity: anomaly.severity,
        type: anomaly.type,
        message: anomaly.message,
        timestamp: anomaly.timestamp
      });
    }

    return alerts.slice(0, 10); // Limit to 10 most recent
  }

  /**
   * Handle client subscription
   */
  private handleSubscription(clientId: string, data: unknown): void {
    const client = this.connectedClients.get(clientId);
    if (!client) return;

    const { topics } = data;
    if (Array.isArray(topics)) {
      topics.forEach(topic => client.subscriptions.add(topic));
    }

    this.logger.debug(`Client ${clientId} subscribed to topics:`, topics);
  }

  /**
   * Handle client unsubscription
   */
  private handleUnsubscription(clientId: string, data: unknown): void {
    const client = this.connectedClients.get(clientId);
    if (!client) return;

    const { topics } = data;
    if (Array.isArray(topics)) {
      topics.forEach(topic => client.subscriptions.delete(topic));
    }

    this.logger.debug(`Client ${clientId} unsubscribed from topics:`, topics);
  }

  /**
   * Handle metrics request
   */
  private async handleMetricsRequest(clientId: string, data: unknown): Promise<void> {
    const client = this.connectedClients.get(clientId);
    if (!client) return;

    try {
      const { type, filters, options } = data;
      let metrics;

      switch (type) {
        case 'overview':
          metrics = await this.fetchOverviewMetrics();
          break;
        case 'platforms':
          metrics = await this.fetchPlatformComparison();
          break;
        case 'campaigns':
          metrics = await this.fetchTopCampaigns(options?.limit);
          break;
        case 'trends':
          metrics = await this.fetchPerformanceTrends();
          break;
        case 'custom':
          metrics = await this.fetchCustomMetrics(filters, options);
          break;
        default:
          metrics = this.metricsCache.get('dashboard');
      }

      client.socket.emit('metrics:response', {
        type,
        data: metrics,
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.error('Failed to handle metrics request', error);
      client.socket.emit('metrics:error', {
        error: error.message
      });
    }
  }

  /**
   * Fetch custom metrics based on filters
   */
  private async fetchCustomMetrics(filters: unknown, options: unknown): Promise<unknown> {
    // Build dynamic query based on filters
    let query = `
      SELECT * FROM fact_campaign_performance f
      JOIN dim_campaigns c ON f.campaign_key = c.campaign_key
      JOIN dim_platforms p ON c.platform_id = p.platform_id
      JOIN dim_date d ON f.date_key = d.date_key
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (filters.platform) {
      paramCount++;
      query += ` AND p.platform_name = $${paramCount}`;
      params.push(filters.platform);
    }

    if (filters.dateRange) {
      paramCount++;
      query += ` AND d.full_date >= $${paramCount}`;
      params.push(filters.dateRange.start);
      paramCount++;
      query += ` AND d.full_date <= $${paramCount}`;
      params.push(filters.dateRange.end);
    }

    if (options?.limit) {
      query += ` LIMIT ${options.limit}`;
    }

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Send initial dashboard data to new client
   */
  private async sendInitialData(clientId: string): Promise<void> {
    const client = this.connectedClients.get(clientId);
    if (!client) return;

    try {
      // Get cached or fresh metrics
      let metrics = this.metricsCache.get('dashboard');
      if (!metrics) {
        await this.refreshDashboardMetrics();
        metrics = this.metricsCache.get('dashboard');
      }

      client.socket.emit('dashboard:initial', {
        data: metrics,
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.error('Failed to send initial data', error);
    }
  }

  /**
   * Broadcast updates to connected clients
   */
  private async broadcastUpdates(): Promise<void> {
    const metrics = this.metricsCache.get('dashboard');
    if (!metrics) return;

    for (const [clientId, client] of this.connectedClients) {
      try {
        // Send updates based on client subscriptions
        if (client.subscriptions.has('overview')) {
          client.socket.emit('update:overview', {
            data: metrics.overview,
            timestamp: new Date()
          });
        }

        if (client.subscriptions.has('platforms')) {
          client.socket.emit('update:platforms', {
            data: metrics.platformComparison,
            timestamp: new Date()
          });
        }

        if (client.subscriptions.has('campaigns')) {
          client.socket.emit('update:campaigns', {
            data: metrics.topCampaigns,
            timestamp: new Date()
          });
        }

        if (client.subscriptions.has('trends')) {
          client.socket.emit('update:trends', {
            data: metrics.performanceTrends,
            timestamp: new Date()
          });
        }

        if (client.subscriptions.has('alerts')) {
          client.socket.emit('update:alerts', {
            data: metrics.alerts,
            timestamp: new Date()
          });
        }

        if (client.subscriptions.has('predictions')) {
          client.socket.emit('update:predictions', {
            data: metrics.predictions,
            timestamp: new Date()
          });
        }
      } catch (error) {
        this.logger.error(`Failed to broadcast to client ${clientId}`, error);
      }
    }
  }

  /**
   * Handle platform sync completion
   */
  private async handlePlatformSync(data: unknown): Promise<void> {
    this.logger.debug('Platform sync completed', data);

    // Refresh metrics after sync
    await this.refreshDashboardMetrics();

    // Notify clients
    this.broadcast('sync:complete', data);
  }

  /**
   * Handle webhook update
   */
  private async handleWebhookUpdate(data: unknown): Promise<void> {
    this.logger.debug('Webhook update received', data);

    // Update specific metrics
    if (data.platform && data.data) {
      const cacheKey = `realtime:${data.platform}:${data.data.campaignId}`;
      await this.redis.setex(cacheKey, 60, JSON.stringify(data.data));
    }

    // Notify clients
    this.broadcast('realtime:update', data);
  }

  /**
   * Handle prediction update
   */
  private handlePredictionUpdate(data: unknown): void {
    this.logger.debug('Prediction update received', data);

    // Update predictions in cache
    const metrics = this.metricsCache.get('dashboard');
    if (metrics) {
      metrics.predictions = data;
      this.metricsCache.set('dashboard', metrics);
    }

    // Notify clients
    this.broadcast('prediction:update', data);
  }

  /**
   * Handle anomaly detection
   */
  private async handleAnomaly(data: unknown): Promise<void> {
    this.logger.warn('Anomaly detected', data);

    // Create alert
    const alert = {
      id: `alert_${Date.now()}`,
      severity: data.severity || 'warning',
      type: data.type,
      message: data.message,
      timestamp: new Date(),
      data: data.details
    };

    // Store alert
    await this.redis.lpush('alerts:active', JSON.stringify(alert));
    await this.redis.ltrim('alerts:active', 0, 99); // Keep last 100

    // Notify clients immediately
    this.broadcast('alert:new', alert);
  }

  /**
   * Broadcast to all connected clients
   */
  private broadcast(event: string, data: unknown): void {
    if (!this.io) return;

    this.io.emit(event, {
      data,
      timestamp: new Date()
    });
  }

  /**
   * Get dashboard widget data
   */
  public async getWidgetData(widgetId: string, config: unknown): Promise<DashboardWidget> {
    let data;
    const widget: DashboardWidget = {
      id: widgetId,
      type: config.type,
      title: config.title,
      data: null,
      config
    };

    switch (config.type) {
      case 'metric':
        data = await this.fetchMetricWidget(config);
        break;
      case 'chart':
        data = await this.fetchChartWidget(config);
        break;
      case 'table':
        data = await this.fetchTableWidget(config);
        break;
      case 'heatmap':
        data = await this.fetchHeatmapWidget(config);
        break;
      case 'funnel':
        data = await this.fetchFunnelWidget(config);
        break;
    }

    widget.data = data;
    return widget;
  }

  /**
   * Fetch metric widget data
   */
  private async fetchMetricWidget(config: unknown): Promise<unknown> {
    const { metric, platform, dateRange } = config;

    let query = `
      SELECT ${metric} as value
      FROM fact_campaign_performance f
      JOIN dim_date d ON f.date_key = d.date_key
    `;

    const params = [];
    if (platform) {
      query += ` JOIN dim_platforms p ON f.platform_id = p.platform_id
                 WHERE p.platform_name = $1`;
      params.push(platform);
    }

    if (dateRange) {
      query += params.length ? ' AND' : ' WHERE';
      query += ` d.full_date >= $${params.length + 1}
                 AND d.full_date <= $${params.length + 2}`;
      params.push(dateRange.start, dateRange.end);
    }

    const result = await this.db.query(query, params);
    return result.rows[0]?.value || 0;
  }

  /**
   * Fetch chart widget data
   */
  private async fetchChartWidget(config: unknown): Promise<unknown> {
    const { chartType, metrics, groupBy, dateRange } = config;

    // Implementation depends on chart type
    switch (chartType) {
      case 'line':
        return await this.fetchTimeSeriesData(metrics, dateRange);
      case 'bar':
        return await this.fetchBarChartData(metrics, groupBy, dateRange);
      case 'pie':
        return await this.fetchPieChartData(metrics, groupBy, dateRange);
      default:
        return [];
    }
  }

  /**
   * Fetch table widget data
   */
  private async fetchTableWidget(config: unknown): Promise<unknown> {
    const { columns, filters, sorting, pagination } = config;

    let query = `
      SELECT ${columns.join(', ')}
      FROM fact_campaign_performance f
      JOIN dim_campaigns c ON f.campaign_key = c.campaign_key
      JOIN dim_platforms p ON c.platform_id = p.platform_id
      JOIN dim_date d ON f.date_key = d.date_key
    `;

    // Apply filters
    if (filters) {
      const conditions = [];
      for (const [key, value] of Object.entries(filters)) {
        conditions.push(`${key} = '${value}'`);
      }
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Apply sorting
    if (sorting) {
      query += ` ORDER BY ${sorting.column} ${sorting.direction}`;
    }

    // Apply pagination
    if (pagination) {
      query += ` LIMIT ${pagination.limit} OFFSET ${pagination.offset}`;
    }

    const result = await this.db.query(query);
    return result.rows;
  }

  /**
   * Fetch heatmap widget data
   */
  private async fetchHeatmapWidget(config: unknown): Promise<unknown> {
    const { metric, xAxis, yAxis, dateRange } = config;

    const query = `
      SELECT
        ${xAxis} as x,
        ${yAxis} as y,
        ${metric} as value
      FROM fact_campaign_performance f
      JOIN dim_date d ON f.date_key = d.date_key
      WHERE d.full_date >= $1 AND d.full_date <= $2
      GROUP BY ${xAxis}, ${yAxis}
    `;

    const result = await this.db.query(query, [dateRange.start, dateRange.end]);
    return result.rows;
  }

  /**
   * Fetch funnel widget data
   */
  private async fetchFunnelWidget(config: unknown): Promise<unknown> {
    const { stages, dateRange } = config;

    const funnelData = [];
    for (const stage of stages) {
      const query = `
        SELECT
          '${stage.name}' as stage,
          SUM(${stage.metric}) as value
        FROM fact_campaign_performance f
        JOIN dim_date d ON f.date_key = d.date_key
        WHERE d.full_date >= $1 AND d.full_date <= $2
      `;

      const result = await this.db.query(query, [dateRange.start, dateRange.end]);
      funnelData.push({
        stage: stage.name,
        value: result.rows[0]?.value || 0
      });
    }

    return funnelData;
  }

  /**
   * Helper: Fetch time series data
   */
  private async fetchTimeSeriesData(metrics: string[], dateRange: unknown): Promise<unknown> {
    const metricSelects = metrics.map(m => `SUM(${m}) as ${m}`).join(', ');

    const query = `
      SELECT
        d.full_date as date,
        ${metricSelects}
      FROM fact_campaign_performance f
      JOIN dim_date d ON f.date_key = d.date_key
      WHERE d.full_date >= $1 AND d.full_date <= $2
      GROUP BY d.full_date
      ORDER BY d.full_date
    `;

    const result = await this.db.query(query, [dateRange.start, dateRange.end]);
    return result.rows;
  }

  /**
   * Helper: Fetch bar chart data
   */
  private async fetchBarChartData(metrics: string[], groupBy: string, dateRange: unknown): Promise<unknown> {
    const metricSelects = metrics.map(m => `SUM(${m}) as ${m}`).join(', ');

    const query = `
      SELECT
        ${groupBy} as category,
        ${metricSelects}
      FROM fact_campaign_performance f
      JOIN dim_date d ON f.date_key = d.date_key
      WHERE d.full_date >= $1 AND d.full_date <= $2
      GROUP BY ${groupBy}
      ORDER BY ${metrics[0]} DESC
    `;

    const result = await this.db.query(query, [dateRange.start, dateRange.end]);
    return result.rows;
  }

  /**
   * Helper: Fetch pie chart data
   */
  private async fetchPieChartData(metric: string, groupBy: string, dateRange: unknown): Promise<unknown> {
    const query = `
      SELECT
        ${groupBy} as label,
        SUM(${metric}) as value
      FROM fact_campaign_performance f
      JOIN dim_date d ON f.date_key = d.date_key
      WHERE d.full_date >= $1 AND d.full_date <= $2
      GROUP BY ${groupBy}
      ORDER BY value DESC
    `;

    const result = await this.db.query(query, [dateRange.start, dateRange.end]);
    return result.rows;
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    this.stopRealtimeUpdates();

    if (this.io) {
      this.io.close();
    }

    this.connectedClients.clear();
    this.metricsCache.clear();
    this.removeAllListeners();

    this.logger.info('Real-time dashboard service cleaned up');
  }
}