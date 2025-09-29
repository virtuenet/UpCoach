import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';

// Types for Analytics Data
interface AnalyticsMetric {
  label: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon?: React.FC;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

interface Platform {
  id: string;
  name: string;
  icon: React.FC;
  connected: boolean;
}

// Mock Icons
const Icons = {
  Users: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  ArrowUp: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ),
  ArrowDown: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  ),
  Google: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  Facebook: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  Twitter: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
    </svg>
  ),
  Instagram: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
    </svg>
  ),
  LinkedIn: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
};

// Sample data
const metricsData: AnalyticsMetric[] = [
  {
    label: 'Total Users',
    value: '45,231',
    change: 12.5,
    changeType: 'increase',
    icon: Icons.Users,
  },
  {
    label: 'Page Views',
    value: '1.2M',
    change: 8.3,
    changeType: 'increase',
    icon: Icons.Eye,
  },
  {
    label: 'Avg. Session',
    value: '4m 32s',
    change: -2.1,
    changeType: 'decrease',
    icon: Icons.Clock,
  },
  {
    label: 'Conversion Rate',
    value: '3.24%',
    change: 15.8,
    changeType: 'increase',
    icon: Icons.TrendingUp,
  },
];

const platformsData: Platform[] = [
  { id: 'google', name: 'Google Analytics', icon: Icons.Google, connected: true },
  { id: 'facebook', name: 'Facebook Pixel', icon: Icons.Facebook, connected: true },
  { id: 'twitter', name: 'Twitter Analytics', icon: Icons.Twitter, connected: false },
  { id: 'instagram', name: 'Instagram Insights', icon: Icons.Instagram, connected: true },
  { id: 'linkedin', name: 'LinkedIn Analytics', icon: Icons.LinkedIn, connected: false },
];

export interface AnalyticsDashboardProps {
  dateRange?: { start: Date; end: Date };
  onDateRangeChange?: (range: { start: Date; end: Date }) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  dateRange,
  onDateRangeChange,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [selectedMetric, setSelectedMetric] = useState<string>('users');
  const [compareMode, setCompareMode] = useState(false);

  // Generate chart data based on selected period
  const chartData = useMemo<ChartData>(() => {
    const labels = {
      day: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      month: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      year: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    };

    const generateData = (base: number, variance: number) => {
      return labels[selectedPeriod].map(() =>
        Math.floor(base + (Math.random() - 0.5) * variance)
      );
    };

    return {
      labels: labels[selectedPeriod],
      datasets: [
        {
          label: 'Current Period',
          data: generateData(1000, 400),
          color: '#3B82F6',
        },
        ...(compareMode ? [{
          label: 'Previous Period',
          data: generateData(800, 300),
          color: '#94A3B8',
        }] : []),
      ],
    };
  }, [selectedPeriod, compareMode]);

  // Render metric card
  const renderMetricCard = (metric: AnalyticsMetric) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            {metric.icon && <metric.icon />}
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{metric.value}</p>
          </div>
        </div>
        <div className={clsx(
          'flex items-center px-2 py-1 rounded-full text-sm font-medium',
          metric.changeType === 'increase'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : metric.changeType === 'decrease'
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        )}>
          {metric.changeType === 'increase' ? <Icons.ArrowUp /> : <Icons.ArrowDown />}
          <span className="ml-1">{Math.abs(metric.change)}%</span>
        </div>
      </div>
    </div>
  );

  // Simple chart visualization
  const renderChart = () => {
    const maxValue = Math.max(...chartData.datasets.flatMap(d => d.data));

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Traffic Overview
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={clsx(
                'px-3 py-1 text-sm rounded-lg transition-colors',
                compareMode
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              )}
            >
              Compare
            </button>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center space-x-4 mb-4">
          {chartData.datasets.map((dataset) => (
            <div key={dataset.label} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: dataset.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {dataset.label}
              </span>
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="relative h-64">
          <div className="absolute inset-0 flex items-end justify-between space-x-2">
            {chartData.labels.map((label, index) => (
              <div key={label} className="flex-1 flex flex-col items-center">
                {chartData.datasets.map((dataset) => {
                  const height = (dataset.data[index] / maxValue) * 100;
                  return (
                    <div
                      key={dataset.label}
                      className="w-full mb-1 rounded-t transition-all duration-300 hover:opacity-80"
                      style={{
                        height: `${height}%`,
                        backgroundColor: dataset.color,
                        opacity: dataset.label === 'Previous Period' ? 0.5 : 1,
                      }}
                      title={`${dataset.label}: ${dataset.data[index]}`}
                    />
                  );
                })}
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render platform connections
  const renderPlatformConnections = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Platform Integrations
      </h3>
      <div className="space-y-3">
        {platformsData.map((platform) => (
          <div
            key={platform.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <platform.icon />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                {platform.name}
              </span>
            </div>
            <div className="flex items-center">
              {platform.connected ? (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                  Connected
                </span>
              ) : (
                <button className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render real-time stats
  const renderRealTimeStats = () => (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Real-Time Users</h3>
        <span className="px-2 py-1 bg-white/20 rounded-full text-xs">Live</span>
      </div>
      <div className="text-4xl font-bold mb-2">342</div>
      <div className="text-sm opacity-90">Active users on site</div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-semibold">68%</div>
          <div className="text-xs opacity-75">Desktop</div>
        </div>
        <div>
          <div className="text-2xl font-semibold">32%</div>
          <div className="text-xs opacity-75">Mobile</div>
        </div>
      </div>

      {/* Activity Wave Animation */}
      <div className="mt-6 flex items-end justify-between h-12 space-x-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-white/30 rounded-t animate-pulse"
            style={{
              height: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );

  // Top Pages Table
  const renderTopPages = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Top Pages
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="pb-3">Page</th>
              <th className="pb-3 text-right">Views</th>
              <th className="pb-3 text-right">Unique</th>
              <th className="pb-3 text-right">Avg. Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {[
              { page: '/dashboard', views: '12,543', unique: '8,234', time: '3:45' },
              { page: '/products', views: '9,823', unique: '6,542', time: '5:12' },
              { page: '/blog/getting-started', views: '7,234', unique: '5,123', time: '7:23' },
              { page: '/pricing', views: '6,542', unique: '4,321', time: '2:15' },
              { page: '/contact', views: '4,123', unique: '3,234', time: '1:45' },
            ].map((item) => (
              <tr key={item.page} className="text-sm">
                <td className="py-3 text-gray-900 dark:text-white">{item.page}</td>
                <td className="py-3 text-right text-gray-600 dark:text-gray-300">{item.views}</td>
                <td className="py-3 text-right text-gray-600 dark:text-gray-300">{item.unique}</td>
                <td className="py-3 text-right text-gray-600 dark:text-gray-300">{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor your website performance across all platforms
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Export Report
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Custom Dashboard
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((metric) => (
          <div key={metric.label}>{renderMetricCard(metric)}</div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          {renderChart()}
        </div>

        {/* Real-time Stats */}
        <div>
          {renderRealTimeStats()}
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        {renderTopPages()}

        {/* Platform Connections */}
        {renderPlatformConnections()}
      </div>

      {/* Heatmap Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Activity Heatmap
          </h3>
          <select className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>

        {/* Simple Heatmap Grid */}
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
              {day}
            </div>
          ))}
          {Array.from({ length: 28 }).map((_, i) => {
            const intensity = Math.random();
            return (
              <div
                key={i}
                className="aspect-square rounded"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                }}
                title={`${Math.floor(intensity * 1000)} activities`}
              />
            );
          })}
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center justify-center mt-4 space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Less</span>
          {[0.2, 0.4, 0.6, 0.8, 1].map(intensity => (
            <div
              key={intensity}
              className="w-4 h-4 rounded"
              style={{ backgroundColor: `rgba(59, 130, 246, ${intensity})` }}
            />
          ))}
          <span className="text-xs text-gray-500 dark:text-gray-400">More</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;