'use client';

import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  MousePointer,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  BarChart3,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: string;
  bounceRate: number;
  conversionRate: number;
  topPages: Array<{ page: string; views: number }>;
  topReferrers: Array<{ source: string; visits: number }>;
  deviceStats: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  countryStats: Array<{ country: string; visits: number }>;
}

// Mock data - in production, this would come from Google Analytics API
const mockData: AnalyticsData = {
  pageViews: 45678,
  uniqueVisitors: 12345,
  avgSessionDuration: '3:45',
  bounceRate: 32.5,
  conversionRate: 4.8,
  topPages: [
    { page: '/', views: 15234 },
    { page: '/pricing', views: 8765 },
    { page: '/features', views: 6543 },
    { page: '/blog', views: 4321 },
    { page: '/contact', views: 2345 },
  ],
  topReferrers: [
    { source: 'Google', visits: 8765 },
    { source: 'Direct', visits: 6543 },
    { source: 'Facebook', visits: 3456 },
    { source: 'Twitter', visits: 2345 },
    { source: 'LinkedIn', visits: 1234 },
  ],
  deviceStats: {
    desktop: 55,
    mobile: 38,
    tablet: 7,
  },
  countryStats: [
    { country: 'United States', visits: 15234 },
    { country: 'United Kingdom', visits: 4567 },
    { country: 'Canada', visits: 3456 },
    { country: 'Australia', visits: 2345 },
    { country: 'Germany', visits: 1234 },
  ],
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-primary-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <div className="flex items-center gap-4">
            <p className="text-gray-600">Website performance overview</p>
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-sm text-green-600 font-medium">+12.5%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {data.pageViews.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Page Views</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <MousePointer className="w-8 h-8 text-green-600" />
              <span className="text-sm text-green-600 font-medium">+8.3%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {data.uniqueVisitors.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Unique Visitors</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-purple-600" />
              <span className="text-sm text-green-600 font-medium">+5.2%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.avgSessionDuration}</div>
            <div className="text-sm text-gray-600">Avg. Duration</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <span className="text-sm text-red-600 font-medium">-2.1%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.bounceRate}%</div>
            <div className="text-sm text-gray-600">Bounce Rate</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-pink-600" />
              <span className="text-sm text-green-600 font-medium">+15.7%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.conversionRate}%</div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Pages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
            <div className="space-y-3">
              {data.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{page.page}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: `${(page.views / data.topPages[0].views) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-16 text-right">
                      {page.views.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Traffic Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
            <div className="space-y-3">
              {data.topReferrers.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{source.source}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-secondary-600 h-2 rounded-full"
                        style={{
                          width: `${(source.visits / data.topReferrers[0].visits) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-16 text-right">
                      {source.visits.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Device Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-600">Desktop</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {data.deviceStats.desktop}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-600">Mobile</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {data.deviceStats.mobile}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-600">Tablet</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {data.deviceStats.tablet}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Geographic Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="bg-white rounded-xl p-6 shadow-sm mt-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Geographic Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {data.countryStats.map((country, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {country.visits.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">{country.country}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
