import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Users, 
  Clock, 
  FileText, 
  BookOpen,
  Calendar,
  ArrowUp,
  ArrowDown,
  Filter,
  Download
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { contentApi } from '../api/content'
import LoadingSpinner from '../components/LoadingSpinner'
import { format, startOfWeek, endOfWeek, subDays, subWeeks } from 'date-fns'

interface AnalyticsCard {
  title: string
  value: string | number
  change: number
  icon: React.ComponentType<any>
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

interface ContentMetrics {
  totalViews: number
  uniqueUsers: number
  averageReadTime: number
  completionRate: number
  engagementScore: number
  topReferrers: string[]
  deviceBreakdown: Record<string, number>
  locationBreakdown: Record<string, number>
}

interface DashboardData {
  totalArticles: number
  totalCourses: number
  totalViews: number
  activeLearners: number
  articlesGrowth: number
  coursesGrowth: number
  viewsGrowth: number
  learnersGrowth: number
}

const StatCard = ({ title, value, change, icon: Icon, color }: AnalyticsCard) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200', 
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  }

  const isPositive = change >= 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? (
            <ArrowUp className="h-4 w-4 mr-1" />
          ) : (
            <ArrowDown className="h-4 w-4 mr-1" />
          )}
          <span className="text-sm font-medium">
            {Math.abs(change)}%
          </span>
        </div>
        <span className="text-sm text-gray-500 ml-2">vs last period</span>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month')
  const [contentType, setContentType] = useState<'all' | 'article' | 'course'>('all')

  // Mock data - in production would come from API
  const dashboardData: DashboardData = {
    totalArticles: 125,
    totalCourses: 23,
    totalViews: 45670,
    activeLearners: 2840,
    articlesGrowth: 12.5,
    coursesGrowth: 8.3,
    viewsGrowth: 18.7,
    learnersGrowth: 6.2,
  }

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['content-analytics', timeframe, contentType],
    queryFn: () => {
      // Mock analytics data
      return Promise.resolve({
        totalViews: 45670,
        uniqueUsers: 12430,
        averageReadTime: 285,
        completionRate: 72.5,
        engagementScore: 85.2,
        topReferrers: ['Google', 'Direct', 'Social Media', 'Email'],
        deviceBreakdown: {
          Desktop: 45,
          Mobile: 35,
          Tablet: 20,
        },
        locationBreakdown: {
          'United States': 35,
          'United Kingdom': 15,
          'Canada': 12,
          'Australia': 10,
          'Other': 28,
        },
      })
    },
  })

  // Mock trend data
  const viewsTrendData = Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'MMM dd'),
    views: Math.floor(Math.random() * 2000) + 1000,
    uniqueUsers: Math.floor(Math.random() * 800) + 400,
  }))

  const contentPerformanceData = [
    { name: 'Week 1', articles: 45, courses: 12, engagement: 85 },
    { name: 'Week 2', articles: 52, courses: 15, engagement: 88 },
    { name: 'Week 3', articles: 48, courses: 18, engagement: 82 },
    { name: 'Week 4', articles: 61, courses: 22, engagement: 91 },
  ]

  const topContentData = [
    { title: 'Effective Leadership Strategies', views: 12500, readTime: 8.5, engagement: 92 },
    { title: 'Productivity Hacks for Managers', views: 9800, readTime: 6.2, engagement: 87 },
    { title: 'Building High-Performance Teams', views: 8600, readTime: 12.1, engagement: 89 },
    { title: 'Communication Skills Masterclass', views: 7200, readTime: 15.3, engagement: 85 },
    { title: 'Time Management Fundamentals', views: 6900, readTime: 7.8, engagement: 83 },
  ]

  const deviceData = analytics ? Object.entries(analytics.deviceBreakdown).map(([device, percentage]) => ({
    name: device,
    value: percentage,
    fill: device === 'Desktop' ? '#3B82F6' : device === 'Mobile' ? '#10B981' : '#F59E0B'
  })) : []

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Content Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track performance and engagement across your content
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
          >
            <option value="all">All Content</option>
            <option value="article">Articles Only</option>
            <option value="course">Courses Only</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700">
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Views"
          value={dashboardData.totalViews.toLocaleString()}
          change={dashboardData.viewsGrowth}
          icon={Eye}
          color="blue"
        />
        <StatCard
          title="Active Learners"
          value={dashboardData.activeLearners.toLocaleString()}
          change={dashboardData.learnersGrowth}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Avg. Read Time"
          value={`${Math.round(analytics?.averageReadTime / 60)}m`}
          change={5.2}
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Engagement Score"
          value={`${analytics?.engagementScore}%`}
          change={2.8}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Trend */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Views & Users Trend</h3>
            <div className="flex space-x-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Views</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Users</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={viewsTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="uniqueUsers" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Device Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {deviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Content Performance */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Content Performance Over Time</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={contentPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="articles"
              stackId="1"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="courses"
              stackId="1"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Performing Content */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top Performing Content</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Read Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topContentData.map((content, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{content.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{content.views.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{content.readTime}m</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${content.engagement}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{content.engagement}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      content.engagement >= 90 ? 'bg-green-100 text-green-800' :
                      content.engagement >= 80 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {content.engagement >= 90 ? 'Excellent' :
                       content.engagement >= 80 ? 'Good' :
                       'Needs Improvement'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row - Referrers and Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Top Referrers</h3>
          <div className="space-y-4">
            {analytics?.topReferrers.map((referrer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{referrer}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.max(20, 100 - index * 20)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">{Math.max(5, 40 - index * 8)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Top Locations</h3>
          <div className="space-y-4">
            {analytics && Object.entries(analytics.locationBreakdown).map(([location, percentage], index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-green-600">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{location}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">{percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Insights & Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-900">Growing Engagement</h4>
            </div>
            <p className="text-sm text-blue-700">
              Mobile engagement is up 23% this month. Consider optimizing more content for mobile readers.
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center mb-2">
              <Users className="h-5 w-5 text-green-600 mr-2" />
              <h4 className="font-medium text-green-900">Audience Growth</h4>
            </div>
            <p className="text-sm text-green-700">
              New user acquisition is strong. Your content is reaching 15% more unique visitors.
            </p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center mb-2">
              <Clock className="h-5 w-5 text-orange-600 mr-2" />
              <h4 className="font-medium text-orange-900">Content Length</h4>
            </div>
            <p className="text-sm text-orange-700">
              Shorter articles (5-8 min read) have 30% higher completion rates than longer ones.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 