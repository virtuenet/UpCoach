import {
  Users,
  CheckSquare,
  Target,
  MessageSquare,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<any>;
  color: "blue" | "green" | "purple" | "orange";
}

function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-md ${colorClasses[color]}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
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
                <div
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {change >= 0 ? (
                    <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                  ) : (
                    <TrendingDown className="self-center flex-shrink-0 h-4 w-4" />
                  )}
                  <span className="ml-1">{Math.abs(change)}%</span>
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard Page V2 - Demonstrates usage of cancellable API requests
 * This version uses the new useApiRequest hooks with automatic cancellation
 */
export default function DashboardPageV2() {
  // Example 1: Single API request with automatic cancellation
  const { 
    data: stats, 
    loading: statsLoading, 
    error: statsError,
    execute: loadStats 
  } = useApiGet('/api/dashboard/stats', {
    immediate: true, // Load immediately on mount
    retryCount: 3,    // Retry up to 3 times on network failure
    retryDelay: 1000, // Start with 1 second delay
    onError: (error) => {
      console.error('Failed to load dashboard stats:', error);
    }
  });

  // Example 2: Parallel API requests for different data
  const {
    data: parallelData,
    loading: parallelLoading,
    execute: loadParallelData,
  } = useParallelApiRequests([
    { method: 'GET', url: '/api/dashboard/recent-activity' },
    { method: 'GET', url: '/api/dashboard/user-growth' },
    { method: 'GET', url: '/api/dashboard/revenue-metrics' },
    { method: 'GET', url: '/api/dashboard/engagement-stats' },
  ] as const);

  // Load parallel data on mount
  useEffect(() => {
    loadParallelData().catch(error => {
      console.error('Failed to load parallel dashboard data:', error);
    });
  }, []);

  // Handle loading state
  if (statsLoading || parallelLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Handle error state
  if (statsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Failed to load dashboard</h3>
        <p className="text-red-600 text-sm mt-1">
          {statsError.message || 'An error occurred while loading the dashboard.'}
        </p>
        <button 
          onClick={() => loadStats()}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Destructure parallel data with safe defaults
  const [recentActivity, userGrowth, revenueMetrics, engagementStats] = parallelData || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard V2</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enhanced dashboard with automatic request cancellation and retry logic.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          change={stats?.userGrowth || 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Goals"
          value={stats?.activeGoals || 0}
          change={stats?.goalGrowth || 0}
          icon={Target}
          color="green"
        />
        <StatCard
          title="Tasks Completed"
          value={stats?.tasksCompleted || 0}
          change={stats?.taskGrowth || 0}
          icon={CheckSquare}
          color="purple"
        />
        <StatCard
          title="Messages Sent"
          value={stats?.messagesSent || 0}
          change={stats?.messageGrowth || 0}
          icon={MessageSquare}
          color="orange"
        />
      </div>

      {/* Recent Activity Section */}
      {recentActivity && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {(recentActivity as any).items?.map((activity: any) => (
              <div key={activity.id} className="flex items-center text-sm">
                <span className="text-gray-500">{activity.timestamp}</span>
                <span className="ml-3 text-gray-900">{activity.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Growth Chart Placeholder */}
      {userGrowth && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            User Growth Trend
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            {/* Chart would go here - using data from userGrowth */}
            <p>Chart: {(userGrowth as any).summary}</p>
          </div>
        </div>
      )}

      {/* Revenue Metrics */}
      {revenueMetrics && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Revenue Metrics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Monthly Recurring Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(revenueMetrics as any).mrr || '0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Revenue Per User</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(revenueMetrics as any).arpu || '0'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Stats */}
      {engagementStats && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Engagement Statistics
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Daily Active Users</span>
              <span className="font-medium">{(engagementStats as any).dau || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Session Duration (avg)</span>
              <span className="font-medium">{(engagementStats as any).avgSessionDuration || '0m'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Retention Rate</span>
              <span className="font-medium">{(engagementStats as any).retentionRate || '0%'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}