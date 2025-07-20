import { useQuery } from '@tanstack/react-query'
import { FileText, BookOpen, Eye, Users, TrendingUp, Calendar, Target, Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { contentApi } from '../api/content'
import { mediaApi } from '../api/media'
import LoadingSpinner from '../components/LoadingSpinner'
import { format, subDays } from 'date-fns'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<any>
  color: 'purple' | 'blue' | 'green' | 'orange'
  change?: number
  subtitle?: string
}

const StatCard = ({ title, value, icon: Icon, color, change, subtitle }: StatCardProps) => {
  const colorClasses = {
    purple: 'bg-purple-500',
    blue: 'bg-blue-500', 
    green: 'bg-green-500',
    orange: 'bg-orange-500',
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 text-white p-1 rounded ${colorClasses[color]}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {change !== undefined && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change >= 0 ? '+' : ''}{change}%
                  </div>
                )}
              </dd>
              {subtitle && (
                <dd className="text-sm text-gray-500 mt-1">
                  {subtitle}
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ActivityItem {
  id: string
  type: 'article' | 'course' | 'media'
  title: string
  action: string
  time: string
  user: string
}

const ActivityFeed = ({ activities }: { activities: ActivityItem[] }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText className="h-4 w-4" />
      case 'course': return <BookOpen className="h-4 w-4" />
      case 'media': return <Eye className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'article': return 'text-blue-600 bg-blue-100'
      case 'course': return 'text-green-600 bg-green-100'
      case 'media': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, index) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {index !== activities.length - 1 && (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getColor(activity.type)}`}>
                    {getIcon(activity.type)}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">{activity.user}</span>{' '}
                      {activity.action}{' '}
                      <span className="font-medium text-gray-900">{activity.title}</span>
                    </p>
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                    {activity.time}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function DashboardPage() {
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['cms-dashboard-stats'],
    queryFn: async () => {
      // Mock data - in production would fetch from actual API
      return {
        totalArticles: 42,
        totalCourses: 15,
        totalViews: 25840,
        activeLearners: 1205,
        articlesGrowth: 12.5,
        coursesGrowth: 8.3,
        viewsGrowth: 18.7,
        learnersGrowth: 6.2,
        totalMedia: 156,
        storageUsed: 2.4, // GB
      }
    },
  })

  // Fetch recent content
  const { data: recentArticles } = useQuery({
    queryKey: ['recent-articles'],
    queryFn: () => contentApi.getArticles({ limit: 5, sortBy: 'updatedAt', sortOrder: 'DESC' }),
  })

  // Fetch storage stats
  const { data: storageStats } = useQuery({
    queryKey: ['storage-stats'],
    queryFn: mediaApi.getStorageStats,
  })

  // Mock chart data
  const viewsData = Array.from({ length: 7 }, (_, i) => ({
    date: format(subDays(new Date(), 6 - i), 'MMM dd'),
    views: Math.floor(Math.random() * 1000) + 500,
    users: Math.floor(Math.random() * 400) + 200,
  }))

  const contentTypeData = [
    { name: 'Articles', count: stats?.totalArticles || 0, color: '#3B82F6' },
    { name: 'Courses', count: stats?.totalCourses || 0, color: '#10B981' },
    { name: 'Media Files', count: stats?.totalMedia || 0, color: '#F59E0B' },
  ]

  // Mock recent activity
  const recentActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'article',
      title: 'Advanced Leadership Techniques',
      action: 'published',
      time: '2 hours ago',
      user: 'Sarah Johnson'
    },
    {
      id: '2',
      type: 'course',
      title: 'Product Management Fundamentals',
      action: 'updated',
      time: '4 hours ago',
      user: 'Mike Chen'
    },
    {
      id: '3',
      type: 'media',
      title: 'Leadership Workshop Video',
      action: 'uploaded',
      time: '6 hours ago',
      user: 'Emily Davis'
    },
    {
      id: '4',
      type: 'article',
      title: 'Remote Team Management',
      action: 'created draft',
      time: '1 day ago',
      user: 'Alex Thompson'
    },
    {
      id: '5',
      type: 'course',
      title: 'Communication Skills for Leaders',
      action: 'completed',
      time: '2 days ago',
      user: 'Lisa Park'
    },
  ]

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Content Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back! Here's an overview of your content performance.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/content/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary-600 hover:bg-secondary-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              New Article
            </Link>
            <Link
              to="/courses/create"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              New Course
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Articles"
          value={stats?.totalArticles || 0}
          icon={FileText}
          color="purple"
          change={stats?.articlesGrowth}
          subtitle="Published content"
        />
        <StatCard
          title="Total Courses"
          value={stats?.totalCourses || 0}
          icon={BookOpen}
          color="blue"
          change={stats?.coursesGrowth}
          subtitle="Learning paths"
        />
        <StatCard
          title="Total Views"
          value={(stats?.totalViews || 0).toLocaleString()}
          icon={Eye}
          color="green"
          change={stats?.viewsGrowth}
          subtitle="This month"
        />
        <StatCard
          title="Active Learners"
          value={(stats?.activeLearners || 0).toLocaleString()}
          icon={Users}
          color="orange"
          change={stats?.learnersGrowth}
          subtitle="Engaged users"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Trend Chart */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Views & Users (Last 7 Days)
              </h3>
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
            <div className="mt-5">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={viewsData}>
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
                    dataKey="users" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Content Distribution */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Content Distribution
            </h3>
            <div className="mt-5">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={contentTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Content & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Articles */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Articles
              </h3>
              <Link 
                to="/content" 
                className="text-sm text-secondary-600 hover:text-secondary-500"
              >
                View all
              </Link>
            </div>
            <div className="mt-5">
              {recentArticles?.data?.length ? (
                <div className="space-y-4">
                  {recentArticles.data.slice(0, 5).map((article) => (
                    <div key={article.id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`h-2 w-2 rounded-full ${
                          article.status === 'published' ? 'bg-green-400' :
                          article.status === 'draft' ? 'bg-yellow-400' :
                          'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/content/edit/${article.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-secondary-600 truncate block"
                        >
                          {article.title}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {format(new Date(article.updatedAt), 'MMM d, yyyy')} • {article.viewCount} views
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          article.status === 'published' ? 'bg-green-100 text-green-800' :
                          article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {article.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No articles yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first article.</p>
                  <div className="mt-6">
                    <Link
                      to="/content/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-secondary-600 hover:bg-secondary-700"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Create Article
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Activity
            </h3>
            <div className="mt-5">
              <ActivityFeed activities={recentActivity} />
            </div>
          </div>
        </div>
      </div>

      {/* Storage & Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Usage */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Storage Usage
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats?.storageUsed || 0} GB
                  </dd>
                  <dd className="text-sm text-gray-500">
                    {storageStats?.totalFiles || 0} files
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-5">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (stats?.storageUsed || 0) / 10 * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">of 10 GB limit</p>
            </div>
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg. Engagement
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    84.2%
                  </dd>
                  <dd className="text-sm text-green-600">
                    +5.4% from last month
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Content Score */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Content Score
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    92/100
                  </dd>
                  <dd className="text-sm text-purple-600">
                    Excellent quality
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/content/create"
              className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white hover:from-purple-600 hover:to-purple-700 transition-all"
            >
              <FileText className="h-8 w-8 mb-3" />
              <h4 className="text-lg font-medium">Create Article</h4>
              <p className="text-sm text-purple-100">Write and publish new content</p>
            </Link>
            
            <Link
              to="/courses/create"
              className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <BookOpen className="h-8 w-8 mb-3" />
              <h4 className="text-lg font-medium">Build Course</h4>
              <p className="text-sm text-blue-100">Create structured learning paths</p>
            </Link>
            
            <Link
              to="/media"
              className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white hover:from-green-600 hover:to-green-700 transition-all"
            >
              <Eye className="h-8 w-8 mb-3" />
              <h4 className="text-lg font-medium">Media Library</h4>
              <p className="text-sm text-green-100">Manage files and assets</p>
            </Link>
            
            <Link
              to="/analytics"
              className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              <TrendingUp className="h-8 w-8 mb-3" />
              <h4 className="text-lg font-medium">View Analytics</h4>
              <p className="text-sm text-orange-100">Track content performance</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 