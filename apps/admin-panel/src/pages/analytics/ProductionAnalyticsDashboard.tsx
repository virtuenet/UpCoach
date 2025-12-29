import React, { useState, useEffect } from 'react';

export interface ProductionMetrics {
  users: UserMetrics;
  engagement: EngagementMetrics;
  performance: PerformanceMetrics;
  business: BusinessMetrics;
  system: SystemMetrics;
}

export interface UserMetrics {
  dau: number;
  wau: number;
  mau: number;
  newUsers: number;
  activeUsers: number;
  returningUsers: number;
  churnedUsers: number;
}

export interface EngagementMetrics {
  avgSessionDuration: number;
  avgActionsPerSession: number;
  avgDailyEngagement: number;
  topFeatures: { feature: string; usage: number }[];
  conversionRate: number;
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  uptime: number;
}

export interface BusinessMetrics {
  mrr: number;
  arr: number;
  newRevenue: number;
  churnedRevenue: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  customerAcquisitionCost: number;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeConnections: number;
  queueLength: number;
  cacheHitRate: number;
}

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  isPositive: boolean;
}

/**
 * Production Analytics Dashboard
 *
 * Real-time production metrics visualization with comprehensive insights.
 * Provides actionable analytics for business and technical decision-making.
 */
const ProductionAnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ProductionMetrics>({
    users: {
      dau: 12450,
      wau: 48200,
      mau: 156000,
      newUsers: 1240,
      activeUsers: 11210,
      returningUsers: 8950,
      churnedUsers: 320,
    },
    engagement: {
      avgSessionDuration: 1680, // seconds
      avgActionsPerSession: 24.5,
      avgDailyEngagement: 3.2,
      topFeatures: [
        { feature: 'Goal Tracking', usage: 8920 },
        { feature: 'Habit Logging', usage: 7840 },
        { feature: 'AI Coaching', usage: 6250 },
        { feature: 'Progress Dashboard', usage: 5430 },
        { feature: 'Social Feed', usage: 3210 },
      ],
      conversionRate: 12.4,
    },
    performance: {
      avgResponseTime: 145,
      p50ResponseTime: 98,
      p95ResponseTime: 287,
      p99ResponseTime: 456,
      errorRate: 0.24,
      uptime: 99.96,
    },
    business: {
      mrr: 124500,
      arr: 1494000,
      newRevenue: 8420,
      churnedRevenue: 1240,
      averageRevenuePerUser: 9.99,
      lifetimeValue: 287.50,
      customerAcquisitionCost: 42.30,
    },
    system: {
      cpuUsage: 42.5,
      memoryUsage: 68.3,
      diskUsage: 54.2,
      activeConnections: 1247,
      queueLength: 23,
      cacheHitRate: 94.7,
    },
  });

  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simulate real-time metric updates
      setMetrics(prev => ({
        ...prev,
        users: {
          ...prev.users,
          dau: prev.users.dau + Math.floor(Math.random() * 100 - 50),
        },
        system: {
          ...prev.system,
          cpuUsage: Math.max(0, Math.min(100, prev.system.cpuUsage + Math.random() * 10 - 5)),
        },
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const formatCurrency = (num: number): string => {
    return `$${formatNumber(num)}`;
  };

  const formatPercent = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const renderMetricCard = (card: MetricCard) => (
    <div key={card.title} className="metric-card">
      <h3 className="metric-title">{card.title}</h3>
      <div className="metric-value">{card.value}</div>
      <div className={`metric-change ${card.isPositive ? 'positive' : 'negative'}`}>
        <span className="trend-icon">{card.trend === 'up' ? '↑' : card.trend === 'down' ? '↓' : '→'}</span>
        <span className="change-value">{formatPercent(Math.abs(card.change))}</span>
      </div>
    </div>
  );

  const userMetricCards: MetricCard[] = [
    {
      title: 'Daily Active Users',
      value: formatNumber(metrics.users.dau),
      change: 8.4,
      trend: 'up',
      isPositive: true,
    },
    {
      title: 'Weekly Active Users',
      value: formatNumber(metrics.users.wau),
      change: 12.3,
      trend: 'up',
      isPositive: true,
    },
    {
      title: 'Monthly Active Users',
      value: formatNumber(metrics.users.mau),
      change: 18.7,
      trend: 'up',
      isPositive: true,
    },
    {
      title: 'New Users',
      value: formatNumber(metrics.users.newUsers),
      change: 15.2,
      trend: 'up',
      isPositive: true,
    },
  ];

  const engagementMetricCards: MetricCard[] = [
    {
      title: 'Avg Session Duration',
      value: formatDuration(metrics.engagement.avgSessionDuration),
      change: 6.8,
      trend: 'up',
      isPositive: true,
    },
    {
      title: 'Actions/Session',
      value: metrics.engagement.avgActionsPerSession.toFixed(1),
      change: 4.2,
      trend: 'up',
      isPositive: true,
    },
    {
      title: 'Daily Engagement',
      value: `${metrics.engagement.avgDailyEngagement.toFixed(1)}x`,
      change: 3.5,
      trend: 'up',
      isPositive: true,
    },
    {
      title: 'Conversion Rate',
      value: formatPercent(metrics.engagement.conversionRate),
      change: 2.8,
      trend: 'up',
      isPositive: true,
    },
  ];

  const performanceMetricCards: MetricCard[] = [
    {
      title: 'Avg Response Time',
      value: `${metrics.performance.avgResponseTime}ms`,
      change: -5.2,
      trend: 'down',
      isPositive: true,
    },
    {
      title: 'P95 Response Time',
      value: `${metrics.performance.p95ResponseTime}ms`,
      change: -3.8,
      trend: 'down',
      isPositive: true,
    },
    {
      title: 'Error Rate',
      value: formatPercent(metrics.performance.errorRate),
      change: -12.5,
      trend: 'down',
      isPositive: true,
    },
    {
      title: 'Uptime',
      value: formatPercent(metrics.performance.uptime),
      change: 0.02,
      trend: 'up',
      isPositive: true,
    },
  ];

  const businessMetricCards: MetricCard[] = [
    {
      title: 'MRR',
      value: formatCurrency(metrics.business.mrr),
      change: 14.2,
      trend: 'up',
      isPositive: true,
    },
    {
      title: 'ARR',
      value: formatCurrency(metrics.business.arr),
      change: 14.2,
      trend: 'up',
      isPositive: true,
    },
    {
      title: 'ARPU',
      value: formatCurrency(metrics.business.averageRevenuePerUser),
      change: 3.4,
      trend: 'up',
      isPositive: true,
    },
    {
      title: 'LTV',
      value: formatCurrency(metrics.business.lifetimeValue),
      change: 8.7,
      trend: 'up',
      isPositive: true,
    },
  ];

  return (
    <div className="production-analytics-dashboard">
      <div className="dashboard-header">
        <h1>Production Analytics Dashboard</h1>
        <div className="dashboard-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="time-range-selector"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <label className="auto-refresh">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button className="export-btn">Export Data</button>
        </div>
      </div>

      <section className="metrics-section">
        <h2>User Metrics</h2>
        <div className="metrics-grid">
          {userMetricCards.map(renderMetricCard)}
        </div>
      </section>

      <section className="metrics-section">
        <h2>Engagement Metrics</h2>
        <div className="metrics-grid">
          {engagementMetricCards.map(renderMetricCard)}
        </div>
      </section>

      <section className="metrics-section">
        <h2>Top Features</h2>
        <div className="feature-usage-chart">
          {metrics.engagement.topFeatures.map((feature, index) => (
            <div key={feature.feature} className="feature-bar">
              <span className="feature-rank">#{index + 1}</span>
              <span className="feature-name">{feature.feature}</span>
              <div className="usage-bar-container">
                <div
                  className="usage-bar"
                  style={{ width: `${(feature.usage / metrics.engagement.topFeatures[0].usage) * 100}%` }}
                />
              </div>
              <span className="feature-usage">{formatNumber(feature.usage)} users</span>
            </div>
          ))}
        </div>
      </section>

      <section className="metrics-section">
        <h2>Performance Metrics</h2>
        <div className="metrics-grid">
          {performanceMetricCards.map(renderMetricCard)}
        </div>
      </section>

      <section className="metrics-section">
        <h2>Business Metrics</h2>
        <div className="metrics-grid">
          {businessMetricCards.map(renderMetricCard)}
        </div>
        <div className="revenue-breakdown">
          <div className="revenue-item">
            <span className="label">New Revenue</span>
            <span className="value positive">+{formatCurrency(metrics.business.newRevenue)}</span>
          </div>
          <div className="revenue-item">
            <span className="label">Churned Revenue</span>
            <span className="value negative">-{formatCurrency(metrics.business.churnedRevenue)}</span>
          </div>
          <div className="revenue-item">
            <span className="label">CAC</span>
            <span className="value">{formatCurrency(metrics.business.customerAcquisitionCost)}</span>
          </div>
          <div className="revenue-item">
            <span className="label">LTV:CAC Ratio</span>
            <span className="value">{(metrics.business.lifetimeValue / metrics.business.customerAcquisitionCost).toFixed(1)}x</span>
          </div>
        </div>
      </section>

      <section className="metrics-section">
        <h2>System Health</h2>
        <div className="system-metrics">
          <div className="system-metric">
            <h3>CPU Usage</h3>
            <div className="gauge">
              <div className="gauge-fill" style={{ width: `${metrics.system.cpuUsage}%` }} />
            </div>
            <span className="gauge-value">{formatPercent(metrics.system.cpuUsage)}</span>
          </div>
          <div className="system-metric">
            <h3>Memory Usage</h3>
            <div className="gauge">
              <div className="gauge-fill" style={{ width: `${metrics.system.memoryUsage}%` }} />
            </div>
            <span className="gauge-value">{formatPercent(metrics.system.memoryUsage)}</span>
          </div>
          <div className="system-metric">
            <h3>Disk Usage</h3>
            <div className="gauge">
              <div className="gauge-fill" style={{ width: `${metrics.system.diskUsage}%` }} />
            </div>
            <span className="gauge-value">{formatPercent(metrics.system.diskUsage)}</span>
          </div>
          <div className="system-metric">
            <h3>Cache Hit Rate</h3>
            <div className="gauge">
              <div className="gauge-fill" style={{ width: `${metrics.system.cacheHitRate}%` }} />
            </div>
            <span className="gauge-value">{formatPercent(metrics.system.cacheHitRate)}</span>
          </div>
        </div>
        <div className="system-info">
          <div className="info-item">
            <span className="label">Active Connections</span>
            <span className="value">{formatNumber(metrics.system.activeConnections)}</span>
          </div>
          <div className="info-item">
            <span className="label">Queue Length</span>
            <span className="value">{metrics.system.queueLength}</span>
          </div>
        </div>
      </section>

      <style jsx>{`
        .production-analytics-dashboard {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .dashboard-controls {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .metrics-section {
          margin-bottom: 32px;
        }

        .metrics-section h2 {
          font-size: 20px;
          margin-bottom: 16px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .metric-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .metric-title {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 32px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .metric-change {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
        }

        .metric-change.positive {
          color: #10b981;
        }

        .metric-change.negative {
          color: #ef4444;
        }

        .feature-usage-chart {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .feature-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .feature-rank {
          font-weight: 600;
          color: #6b7280;
          min-width: 30px;
        }

        .feature-name {
          min-width: 140px;
        }

        .usage-bar-container {
          flex: 1;
          height: 24px;
          background: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
        }

        .usage-bar {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          transition: width 0.3s ease;
        }

        .system-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .system-metric {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .gauge {
          height: 8px;
          background: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
          margin: 12px 0;
        }

        .gauge-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          transition: width 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default ProductionAnalyticsDashboard;
