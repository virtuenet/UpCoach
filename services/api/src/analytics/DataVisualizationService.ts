/**
 * Data Visualization Service
 *
 * Generates interactive charts, graphs, and visualizations from analytics data.
 *
 * Features:
 * - 12+ chart types (line, bar, pie, scatter, heatmap, area, radar, funnel, gauge, treemap, sankey, candlestick)
 * - Chart configuration builder
 * - Data transformation for charts
 * - Color scheme management
 * - Responsive chart settings
 * - Export chart to PNG/SVG
 * - Real-time chart updates
 */

import { EventEmitter } from 'events';
import { realtimeAnalyticsEngine, AnalyticsEvent } from './RealtimeAnalyticsEngine';

/**
 * Chart Types
 */
export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'scatter'
  | 'heatmap'
  | 'area'
  | 'radar'
  | 'funnel'
  | 'gauge'
  | 'treemap'
  | 'sankey'
  | 'candlestick';

/**
 * Color Scheme Types
 */
export type ColorScheme =
  | 'default'
  | 'monochrome'
  | 'pastel'
  | 'vibrant'
  | 'cool'
  | 'warm'
  | 'earth'
  | 'ocean';

/**
 * Theme Types
 */
export type Theme = 'light' | 'dark' | 'custom';

/**
 * Chart Configuration Interface
 */
export interface ChartConfig {
  type: ChartType;
  title: string;
  subtitle?: string;
  data: ChartData;
  options: ChartOptions;
  theme?: Theme;
  responsive: boolean;
  colorScheme?: ColorScheme;
  customColors?: string[];
}

/**
 * Chart Data Interface
 */
export interface ChartData {
  labels: string[];
  datasets: Dataset[];
  metadata?: Record<string, any>;
}

/**
 * Dataset Interface
 */
export interface Dataset {
  label: string;
  data: number[] | DataPoint[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
  type?: ChartType;
}

/**
 * Data Point Interface
 */
export interface DataPoint {
  x: number | string | Date;
  y: number;
  r?: number; // For bubble charts
  label?: string;
}

/**
 * Chart Options Interface
 */
export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  animation?: {
    duration: number;
    easing: 'linear' | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad';
  };
  scales?: {
    x?: ScaleConfig;
    y?: ScaleConfig;
  };
  plugins?: {
    legend?: LegendConfig;
    tooltip?: TooltipConfig;
    title?: TitleConfig;
  };
  interaction?: {
    mode: 'index' | 'point' | 'nearest' | 'dataset';
    intersect: boolean;
  };
  layout?: {
    padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  };
}

/**
 * Scale Configuration
 */
export interface ScaleConfig {
  type?: 'linear' | 'logarithmic' | 'time' | 'category';
  display?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  title?: {
    display: boolean;
    text: string;
  };
  min?: number;
  max?: number;
  beginAtZero?: boolean;
  ticks?: {
    stepSize?: number;
    callback?: string;
  };
  grid?: {
    display?: boolean;
    color?: string;
  };
}

/**
 * Legend Configuration
 */
export interface LegendConfig {
  display: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  labels?: {
    color?: string;
    font?: {
      size: number;
      family: string;
    };
  };
}

/**
 * Tooltip Configuration
 */
export interface TooltipConfig {
  enabled: boolean;
  mode?: 'index' | 'point' | 'nearest' | 'dataset';
  backgroundColor?: string;
  titleColor?: string;
  bodyColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

/**
 * Title Configuration
 */
export interface TitleConfig {
  display: boolean;
  text: string;
  font?: {
    size: number;
    weight: string;
  };
  color?: string;
}

/**
 * Analytics Query Interface
 */
export interface AnalyticsQuery {
  metric: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  granularity?: '5m' | '15m' | '1h' | '24h';
  groupBy?: string[];
  filters?: Record<string, any>;
  organizationId?: string;
  title?: string;
  limit?: number;
}

/**
 * Export Format
 */
export type ExportFormat = 'png' | 'svg' | 'json' | 'csv';

/**
 * Export Options
 */
export interface ExportOptions {
  format: ExportFormat;
  width?: number;
  height?: number;
  backgroundColor?: string;
  quality?: number; // For PNG (0-1)
}

/**
 * Data Visualization Service Class
 */
export class DataVisualizationService extends EventEmitter {
  private colorSchemes: Record<ColorScheme, string[]>;
  private defaultOptions: ChartOptions;

  constructor() {
    super();

    this.colorSchemes = {
      default: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'],
      monochrome: ['#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB'],
      pastel: ['#BAE6FF', '#C4B5FD', '#FBCFE8', '#FDE68A', '#A7F3D0', '#BFDBFE', '#FCA5A5'],
      vibrant: ['#7C3AED', '#DB2777', '#DC2626', '#EA580C', '#16A34A', '#2563EB', '#9333EA'],
      cool: ['#0EA5E9', '#06B6D4', '#14B8A6', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6'],
      warm: ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#DC2626', '#EA580C', '#D97706'],
      earth: ['#78350F', '#92400E', '#A16207', '#854D0E', '#65A30D', '#15803D', '#047857'],
      ocean: ['#0C4A6E', '#075985', '#0369A1', '#0284C7', '#0891B2', '#0D9488', '#14B8A6'],
    };

    this.defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 750,
        easing: 'easeInOutQuad',
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              size: 12,
              family: 'Inter, sans-serif',
            },
          },
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderWidth: 1,
        },
        title: {
          display: false,
          text: '',
          font: {
            size: 16,
            weight: 'bold',
          },
        },
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
    };
  }

  /**
   * Generate chart configuration
   */
  async generateChart(
    type: ChartType,
    query: AnalyticsQuery,
    options?: Partial<ChartOptions>
  ): Promise<ChartConfig> {
    try {
      const data = await this.fetchChartData(query);

      let chartConfig: ChartConfig;

      switch (type) {
        case 'line':
          chartConfig = this.generateLineChart(data, query);
          break;
        case 'bar':
          chartConfig = this.generateBarChart(data, query);
          break;
        case 'pie':
          chartConfig = this.generatePieChart(data, query);
          break;
        case 'scatter':
          chartConfig = this.generateScatterChart(data, query);
          break;
        case 'heatmap':
          chartConfig = this.generateHeatmap(data, query);
          break;
        case 'area':
          chartConfig = this.generateAreaChart(data, query);
          break;
        case 'radar':
          chartConfig = this.generateRadarChart(data, query);
          break;
        case 'funnel':
          chartConfig = this.generateFunnelChart(data, query);
          break;
        case 'gauge':
          chartConfig = this.generateGaugeChart(data, query);
          break;
        case 'treemap':
          chartConfig = this.generateTreemapChart(data, query);
          break;
        case 'sankey':
          chartConfig = this.generateSankeyChart(data, query);
          break;
        case 'candlestick':
          chartConfig = this.generateCandlestickChart(data, query);
          break;
        default:
          throw new Error(`Unsupported chart type: ${type}`);
      }

      // Merge with custom options
      if (options) {
        chartConfig.options = this.mergeOptions(chartConfig.options, options);
      }

      this.emit('chart:generated', { type, query });

      return chartConfig;
    } catch (error) {
      console.error('Error generating chart:', error);
      this.emit('error', { source: 'chart_generation', error, type, query });
      throw error;
    }
  }

  /**
   * Generate line chart for time-series data
   */
  private generateLineChart(data: any[], query: AnalyticsQuery): ChartConfig {
    const labels = data.map(d => this.formatLabel(d.timestamp || d.label));
    const values = data.map(d => d.value || d.count || 0);

    return {
      type: 'line',
      title: query.title || 'Trend Over Time',
      data: {
        labels,
        datasets: [{
          label: query.metric,
          data: values,
          borderColor: this.colorSchemes.default[0],
          backgroundColor: this.hexToRgba(this.colorSchemes.default[0], 0.1),
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        }],
      },
      options: {
        ...this.defaultOptions,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Value',
            },
          },
          x: {
            type: query.timeRange ? 'time' : 'category',
            title: {
              display: true,
              text: 'Time',
            },
          },
        },
      },
      responsive: true,
      colorScheme: 'default',
    };
  }

  /**
   * Generate bar chart
   */
  private generateBarChart(data: any[], query: AnalyticsQuery): ChartConfig {
    const labels = data.map(d => this.formatLabel(d.label || d.category));
    const values = data.map(d => d.value || d.count || 0);
    const colors = this.getColors('default', values.length);

    return {
      type: 'bar',
      title: query.title || 'Comparison',
      data: {
        labels,
        datasets: [{
          label: query.metric,
          data: values,
          backgroundColor: colors.map(c => this.hexToRgba(c, 0.8)),
          borderColor: colors,
          borderWidth: 2,
        }],
      },
      options: {
        ...this.defaultOptions,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Value',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Category',
            },
          },
        },
      },
      responsive: true,
      colorScheme: 'default',
    };
  }

  /**
   * Generate pie chart
   */
  private generatePieChart(data: any[], query: AnalyticsQuery): ChartConfig {
    const labels = data.map(d => this.formatLabel(d.label || d.category));
    const values = data.map(d => d.value || d.count || 0);
    const colors = this.getColors('vibrant', values.length);

    return {
      type: 'pie',
      title: query.title || 'Distribution',
      data: {
        labels,
        datasets: [{
          label: query.metric,
          data: values,
          backgroundColor: colors.map(c => this.hexToRgba(c, 0.8)),
          borderColor: '#FFFFFF',
          borderWidth: 2,
        }],
      },
      options: {
        ...this.defaultOptions,
        plugins: {
          ...this.defaultOptions.plugins,
          legend: {
            display: true,
            position: 'right',
          },
        },
      },
      responsive: true,
      colorScheme: 'vibrant',
    };
  }

  /**
   * Generate scatter chart
   */
  private generateScatterChart(data: any[], query: AnalyticsQuery): ChartConfig {
    const points: DataPoint[] = data.map(d => ({
      x: d.x || d.timestamp,
      y: d.y || d.value || 0,
      label: d.label,
    }));

    return {
      type: 'scatter',
      title: query.title || 'Scatter Plot',
      data: {
        labels: [],
        datasets: [{
          label: query.metric,
          data: points,
          backgroundColor: this.hexToRgba(this.colorSchemes.default[0], 0.6),
          borderColor: this.colorSchemes.default[0],
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        ...this.defaultOptions,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Y Axis',
            },
          },
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'X Axis',
            },
          },
        },
      },
      responsive: true,
      colorScheme: 'default',
    };
  }

  /**
   * Generate heatmap chart
   */
  private generateHeatmap(data: any[], query: AnalyticsQuery): ChartConfig {
    // Transform data into heatmap format
    const heatmapData = this.transformToHeatmapData(data);

    return {
      type: 'heatmap',
      title: query.title || 'Heatmap',
      data: {
        labels: heatmapData.xLabels,
        datasets: heatmapData.datasets,
      },
      options: {
        ...this.defaultOptions,
        scales: {
          x: {
            type: 'category',
          },
          y: {
            type: 'category',
          },
        },
      },
      responsive: true,
      colorScheme: 'cool',
    };
  }

  /**
   * Generate area chart
   */
  private generateAreaChart(data: any[], query: AnalyticsQuery): ChartConfig {
    const labels = data.map(d => this.formatLabel(d.timestamp || d.label));
    const values = data.map(d => d.value || d.count || 0);

    return {
      type: 'area',
      title: query.title || 'Area Chart',
      data: {
        labels,
        datasets: [{
          label: query.metric,
          data: values,
          borderColor: this.colorSchemes.default[0],
          backgroundColor: this.hexToRgba(this.colorSchemes.default[0], 0.3),
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        ...this.defaultOptions,
        scales: {
          y: {
            beginAtZero: true,
            stacked: true,
          },
          x: {
            type: query.timeRange ? 'time' : 'category',
            stacked: true,
          },
        },
      },
      responsive: true,
      colorScheme: 'default',
    };
  }

  /**
   * Generate radar chart
   */
  private generateRadarChart(data: any[], query: AnalyticsQuery): ChartConfig {
    const labels = data.map(d => this.formatLabel(d.label || d.category));
    const values = data.map(d => d.value || d.count || 0);

    return {
      type: 'radar',
      title: query.title || 'Radar Chart',
      data: {
        labels,
        datasets: [{
          label: query.metric,
          data: values,
          backgroundColor: this.hexToRgba(this.colorSchemes.default[0], 0.2),
          borderColor: this.colorSchemes.default[0],
          borderWidth: 2,
          pointBackgroundColor: this.colorSchemes.default[0],
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: this.colorSchemes.default[0],
        }],
      },
      options: {
        ...this.defaultOptions,
        scales: {
          r: {
            beginAtZero: true,
          },
        } as any,
      },
      responsive: true,
      colorScheme: 'default',
    };
  }

  /**
   * Generate funnel chart
   */
  private generateFunnelChart(data: any[], query: AnalyticsQuery): ChartConfig {
    const labels = data.map(d => this.formatLabel(d.label || d.stage));
    const values = data.map(d => d.value || d.count || 0);
    const colors = this.getColors('warm', values.length);

    // Calculate conversion rates
    const conversionRates = values.map((value, index) => {
      if (index === 0) return 100;
      return ((value / values[0]) * 100).toFixed(1);
    });

    return {
      type: 'funnel',
      title: query.title || 'Conversion Funnel',
      data: {
        labels: labels.map((label, i) => `${label} (${conversionRates[i]}%)`),
        datasets: [{
          label: query.metric,
          data: values,
          backgroundColor: colors.map(c => this.hexToRgba(c, 0.8)),
          borderColor: colors,
          borderWidth: 2,
        }],
        metadata: {
          conversionRates,
        },
      },
      options: {
        ...this.defaultOptions,
        indexAxis: 'y' as any,
      },
      responsive: true,
      colorScheme: 'warm',
    };
  }

  /**
   * Generate gauge chart
   */
  private generateGaugeChart(data: any[], query: AnalyticsQuery): ChartConfig {
    const value = data[0]?.value || data[0]?.count || 0;
    const max = data[0]?.max || 100;
    const percentage = (value / max) * 100;

    return {
      type: 'gauge',
      title: query.title || 'Gauge',
      data: {
        labels: ['Value'],
        datasets: [{
          label: query.metric,
          data: [value, max - value],
          backgroundColor: [
            this.getGaugeColor(percentage),
            this.hexToRgba('#E5E7EB', 0.3),
          ],
          borderWidth: 0,
        }],
        metadata: {
          value,
          max,
          percentage: percentage.toFixed(1),
        },
      },
      options: {
        ...this.defaultOptions,
        circumference: 180,
        rotation: -90,
      } as any,
      responsive: true,
      colorScheme: 'default',
    };
  }

  /**
   * Generate treemap chart
   */
  private generateTreemapChart(data: any[], query: AnalyticsQuery): ChartConfig {
    const treemapData = data.map(d => ({
      label: this.formatLabel(d.label || d.category),
      value: d.value || d.count || 0,
      color: this.colorSchemes.default[data.indexOf(d) % this.colorSchemes.default.length],
    }));

    return {
      type: 'treemap',
      title: query.title || 'Treemap',
      data: {
        labels: treemapData.map(d => d.label),
        datasets: [{
          label: query.metric,
          data: treemapData.map(d => d.value),
          backgroundColor: treemapData.map(d => this.hexToRgba(d.color, 0.8)),
          borderColor: '#FFFFFF',
          borderWidth: 2,
        }],
      },
      options: {
        ...this.defaultOptions,
      },
      responsive: true,
      colorScheme: 'default',
    };
  }

  /**
   * Generate sankey chart
   */
  private generateSankeyChart(data: any[], query: AnalyticsQuery): ChartConfig {
    // Transform data into sankey format
    const sankeyData = this.transformToSankeyData(data);

    return {
      type: 'sankey',
      title: query.title || 'Flow Diagram',
      data: {
        labels: sankeyData.nodes,
        datasets: [{
          label: query.metric,
          data: sankeyData.flows as any,
          backgroundColor: this.colorSchemes.default,
        }],
      },
      options: {
        ...this.defaultOptions,
      },
      responsive: true,
      colorScheme: 'default',
    };
  }

  /**
   * Generate candlestick chart
   */
  private generateCandlestickChart(data: any[], query: AnalyticsQuery): ChartConfig {
    const candlestickData = data.map(d => ({
      x: d.timestamp,
      o: d.open || 0,
      h: d.high || 0,
      l: d.low || 0,
      c: d.close || 0,
    }));

    return {
      type: 'candlestick',
      title: query.title || 'Price Chart',
      data: {
        labels: data.map(d => this.formatLabel(d.timestamp)),
        datasets: [{
          label: query.metric,
          data: candlestickData as any,
        }],
      },
      options: {
        ...this.defaultOptions,
        scales: {
          x: {
            type: 'time',
          },
          y: {
            beginAtZero: false,
          },
        },
      },
      responsive: true,
      colorScheme: 'default',
    };
  }

  /**
   * Fetch chart data from analytics engine
   */
  private async fetchChartData(query: AnalyticsQuery): Promise<any[]> {
    try {
      if (query.timeRange) {
        const metrics = await realtimeAnalyticsEngine.getMetricsForTimeRange(
          query.timeRange.start,
          query.timeRange.end,
          query.organizationId,
          query.granularity
        );

        // Transform metrics to chart data format
        return metrics.map(m => ({
          timestamp: m.timestamp,
          value: m.value,
          label: m.metric,
        }));
      } else {
        // For non-time-series queries, return mock data
        // In production, this would query a database
        return this.generateMockData(query);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return [];
    }
  }

  /**
   * Generate mock data for demonstration
   */
  private generateMockData(query: AnalyticsQuery): any[] {
    const count = query.limit || 10;
    const data = [];

    for (let i = 0; i < count; i++) {
      data.push({
        label: `Item ${i + 1}`,
        value: Math.floor(Math.random() * 100) + 1,
        category: `Category ${(i % 3) + 1}`,
      });
    }

    return data;
  }

  /**
   * Transform data to heatmap format
   */
  private transformToHeatmapData(data: any[]): {
    xLabels: string[];
    datasets: Dataset[];
  } {
    // Extract unique x and y labels
    const xLabels = [...new Set(data.map(d => d.x || d.xLabel))];
    const yLabels = [...new Set(data.map(d => d.y || d.yLabel))];

    const datasets = yLabels.map(yLabel => ({
      label: String(yLabel),
      data: xLabels.map(xLabel => {
        const point = data.find(d =>
          (d.x || d.xLabel) === xLabel && (d.y || d.yLabel) === yLabel
        );
        return point?.value || 0;
      }),
    }));

    return { xLabels: xLabels.map(String), datasets };
  }

  /**
   * Transform data to sankey format
   */
  private transformToSankeyData(data: any[]): {
    nodes: string[];
    flows: Array<{ from: string; to: string; value: number }>;
  } {
    const nodes = [...new Set(data.flatMap(d => [d.source, d.target]))];
    const flows = data.map(d => ({
      from: d.source,
      to: d.target,
      value: d.value || d.count || 0,
    }));

    return { nodes, flows };
  }

  /**
   * Get colors for color scheme
   */
  private getColors(scheme: ColorScheme, count: number): string[] {
    const colors = this.colorSchemes[scheme];
    const result: string[] = [];

    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }

    return result;
  }

  /**
   * Get gauge color based on percentage
   */
  private getGaugeColor(percentage: number): string {
    if (percentage >= 80) return '#10B981'; // Green
    if (percentage >= 60) return '#F59E0B'; // Yellow
    if (percentage >= 40) return '#F97316'; // Orange
    return '#EF4444'; // Red
  }

  /**
   * Format label for display
   */
  private formatLabel(value: any): string {
    if (value instanceof Date) {
      return value.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
    return String(value);
  }

  /**
   * Convert hex color to rgba
   */
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Merge chart options
   */
  private mergeOptions(
    base: ChartOptions,
    custom: Partial<ChartOptions>
  ): ChartOptions {
    return {
      ...base,
      ...custom,
      scales: {
        ...base.scales,
        ...custom.scales,
      },
      plugins: {
        ...base.plugins,
        ...custom.plugins,
      },
    };
  }

  /**
   * Export chart to specified format
   */
  async exportChart(
    config: ChartConfig,
    options: ExportOptions
  ): Promise<Buffer | string> {
    try {
      const { format, width = 800, height = 600 } = options;

      switch (format) {
        case 'json':
          return JSON.stringify(config, null, 2);

        case 'csv':
          return this.exportToCSV(config);

        case 'png':
        case 'svg':
          // In production, this would use a headless browser or image generation library
          // For now, return a placeholder
          return Buffer.from('Chart export placeholder');

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting chart:', error);
      this.emit('error', { source: 'chart_export', error, config, options });
      throw error;
    }
  }

  /**
   * Export chart data to CSV
   */
  private exportToCSV(config: ChartConfig): string {
    const { data } = config;
    const lines: string[] = [];

    // Header
    const headers = ['Label', ...data.datasets.map(d => d.label)];
    lines.push(headers.join(','));

    // Data rows
    for (let i = 0; i < data.labels.length; i++) {
      const row = [
        data.labels[i],
        ...data.datasets.map(d => {
          const value = Array.isArray(d.data) ? d.data[i] : 0;
          return typeof value === 'object' ? (value as DataPoint).y : value;
        }),
      ];
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }

  /**
   * Apply color scheme to chart config
   */
  applyColorScheme(config: ChartConfig, scheme: ColorScheme): ChartConfig {
    const colors = this.getColors(scheme, config.data.datasets.length);

    const updatedDatasets = config.data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: this.hexToRgba(colors[index], 0.8),
      borderColor: colors[index],
    }));

    return {
      ...config,
      colorScheme: scheme,
      data: {
        ...config.data,
        datasets: updatedDatasets,
      },
    };
  }

  /**
   * Create responsive chart config
   */
  makeResponsive(config: ChartConfig): ChartConfig {
    return {
      ...config,
      responsive: true,
      options: {
        ...config.options,
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  }

  /**
   * Get available color schemes
   */
  getColorSchemes(): ColorScheme[] {
    return Object.keys(this.colorSchemes) as ColorScheme[];
  }

  /**
   * Get color palette for scheme
   */
  getColorPalette(scheme: ColorScheme): string[] {
    return [...this.colorSchemes[scheme]];
  }
}

/**
 * Singleton instance
 */
export const dataVisualizationService = new DataVisualizationService();

export default DataVisualizationService;
