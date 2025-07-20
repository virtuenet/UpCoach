import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  AlertTriangle,
  Activity,
  RefreshCw,
} from 'lucide-react';
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
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { financialApi } from '../../services/financialApi';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<any>;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const FinancialDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('monthly');
  const [activeTab, setActiveTab] = useState('revenue');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [mrrData, setMrrData] = useState<any>(null);
  const [costData, setCostData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboard, mrr, costs, subscriptions] = await Promise.all([
        financialApi.getDashboard(period),
        financialApi.getMRRBreakdown(),
        financialApi.getCostBreakdown(
          startOfMonth(new Date()).toISOString(),
          endOfMonth(new Date()).toISOString()
        ),
        financialApi.getSubscriptionMetrics(),
      ]);

      setDashboardData(dashboard);
      setMrrData(mrr);
      setCostData(costs);
      setSubscriptionData(subscriptions);
    } catch (err) {
      setError('Failed to load financial data. Please try again.');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const metrics: MetricCard[] = [
    {
      title: 'Monthly Recurring Revenue',
      value: formatCurrency(dashboardData?.currentMetrics?.mrr || 0),
      change: mrrData?.mrrGrowthRate || 0,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Annual Recurring Revenue',
      value: formatCurrency(dashboardData?.currentMetrics?.arr || 0),
      change: mrrData?.mrrGrowthRate || 0,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: 'Active Subscriptions',
      value: subscriptionData?.activeSubscriptions || 0,
      change: 0,
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'LTV:CAC Ratio',
      value: `${dashboardData?.currentMetrics?.ltvCacRatio?.toFixed(1) || 0}:1`,
      change: 0,
      icon: Activity,
      color: 'text-orange-600',
    },
  ];

  const mrrBreakdownData = [
    { name: 'New MRR', value: mrrData?.breakdown?.newMRR || 0 },
    { name: 'Expansion MRR', value: mrrData?.breakdown?.expansionMRR || 0 },
    { name: 'Contraction MRR', value: -(mrrData?.breakdown?.contractionMRR || 0) },
    { name: 'Churned MRR', value: -(mrrData?.breakdown?.churnedMRR || 0) },
  ];

  const costCategoryData = Object.entries(costData?.costsByCategory || {}).map(
    ([category, amount]) => ({
      name: category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: amount as number,
    })
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">
            Monitor your business metrics and financial health
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Health Score Alert */}
      {dashboardData?.healthScore && (
        <div className={`rounded-lg p-4 ${
          dashboardData.healthScore.status === 'critical' || dashboardData.healthScore.status === 'poor'
            ? 'bg-red-50 border border-red-200'
            : dashboardData.healthScore.status === 'fair'
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-green-50 border border-green-200'
        }`}>
          <div className="flex">
            <Activity className={`h-5 w-5 ${
              dashboardData.healthScore.status === 'critical' || dashboardData.healthScore.status === 'poor'
                ? 'text-red-400'
                : dashboardData.healthScore.status === 'fair'
                ? 'text-yellow-400'
                : 'text-green-400'
            }`} />
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                dashboardData.healthScore.status === 'critical' || dashboardData.healthScore.status === 'poor'
                  ? 'text-red-800'
                  : dashboardData.healthScore.status === 'fair'
                  ? 'text-yellow-800'
                  : 'text-green-800'
              }`}>
                Financial Health Score: {dashboardData.healthScore.score.toFixed(0)}/100 -{' '}
                {dashboardData.healthScore.status.charAt(0).toUpperCase() +
                  dashboardData.healthScore.status.slice(1)}
              </h3>
              <div className={`mt-2 text-sm ${
                dashboardData.healthScore.status === 'critical' || dashboardData.healthScore.status === 'poor'
                  ? 'text-red-700'
                  : dashboardData.healthScore.status === 'fair'
                  ? 'text-yellow-700'
                  : 'text-green-700'
              }`}>
                Your financial health is based on growth rate, retention, runway, and unit economics.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {metric.title}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {metric.value}
                    </dd>
                    {metric.change !== 0 && (
                      <dd className="text-sm text-gray-600">
                        <span className={metric.change > 0 ? 'text-green-600' : 'text-red-600'}>
                          {metric.change > 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
                          {formatPercentage(metric.change)}
                        </span>{' '}
                        from last period
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'revenue', name: 'Revenue' },
              { id: 'costs', name: 'Costs' },
              { id: 'subscriptions', name: 'Subscriptions' },
              { id: 'health', name: 'Health Metrics' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* MRR Trend Chart */}
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    MRR Trend
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardData?.trends?.mrrTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                        />
                        <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3B82F6"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* MRR Breakdown Chart */}
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    MRR Movement
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mrrBreakdownData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                        <Tooltip formatter={(value: number) => formatCurrency(Math.abs(value))} />
                        <Bar dataKey="value">
                          {mrrBreakdownData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.value >= 0 ? '#10B981' : '#EF4444'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Revenue by Plan */}
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Revenue by Plan
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mrrData?.byPlan || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="plan_name" />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded shadow-lg">
                              <p className="font-semibold">{data.plan_name}</p>
                              <p>MRR: {formatCurrency(data.mrr)}</p>
                              <p>Subscribers: {data.subscription_count}</p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="mrr" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Costs Tab */}
          {activeTab === 'costs' && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Cost Distribution */}
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Cost Distribution
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={costCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {costCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Burn Rate Metrics */}
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Burn Rate & Runway
                  </h3>
                  <div className="space-y-6">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Monthly Burn Rate</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(costData?.burnRate || 0)}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Runway</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {dashboardData?.snapshot?.cashFlow?.runway || 0} months
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Monthly Costs</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatCurrency(costData?.totalCosts || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Vendors */}
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Top Vendors
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {costData?.topVendors?.map((vendor: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{vendor.vendor}</p>
                            <p className="text-xs text-gray-500">
                              {vendor.transaction_count} transactions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(vendor.total_cost)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {((vendor.total_cost / costData.totalCosts) * 100).toFixed(1)}% of total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Churn Rate</h3>
                  <p className="text-sm text-gray-600">Monthly subscription churn</p>
                  <div className="text-2xl font-bold text-red-600 mt-2">
                    {subscriptionData?.churnRate?.toFixed(1) || 0}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Industry average: 5-7%</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Trial Conversion</h3>
                  <p className="text-sm text-gray-600">Trial to paid conversion rate</p>
                  <div className="text-2xl font-bold text-green-600 mt-2">
                    {subscriptionData?.trialConversionRate?.toFixed(1) || 0}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Industry average: 15-20%</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Average Subscription</h3>
                  <p className="text-sm text-gray-600">Average monthly subscription</p>
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    {formatCurrency(subscriptionData?.averageSubscriptionValue || 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Per active user</p>
                </div>
              </div>

              {/* Subscription Status Distribution */}
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Subscription Status Distribution
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subscriptionData?.subscriptionsByStatus || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percent }) =>
                          `${status} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(subscriptionData?.subscriptionsByStatus || []).map(
                          (entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          )
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Health Metrics Tab */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              {/* Health Score Breakdown */}
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Financial Health Score Breakdown
                </h3>
                <div className="space-y-4">
                  {Object.entries(dashboardData?.healthScore?.factors || {}).map(
                    ([factor, value]: [string, any], index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {factor.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm text-gray-500">{value.toFixed(0)}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              value >= 80
                                ? 'bg-green-500'
                                : value >= 60
                                ? 'bg-yellow-500'
                                : value >= 40
                                ? 'bg-orange-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${value}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Unit Economics */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Unit Economics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Customer Acquisition Cost (CAC)</span>
                      <span className="font-semibold">
                        {formatCurrency(dashboardData?.currentMetrics?.cac || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Lifetime Value (LTV)</span>
                      <span className="font-semibold">
                        {formatCurrency(dashboardData?.currentMetrics?.ltv || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payback Period</span>
                      <span className="font-semibold">
                        {dashboardData?.currentMetrics?.paybackPeriod?.toFixed(1) || 0} months
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Growth Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">MRR Growth Rate</span>
                      <span
                        className={`font-semibold ${
                          (mrrData?.mrrGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatPercentage(mrrData?.mrrGrowthRate || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Net Revenue Retention</span>
                      <span className="font-semibold">
                        {dashboardData?.snapshot?.metrics?.netRevenueRetention || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Gross Margin</span>
                      <span className="font-semibold">
                        {dashboardData?.snapshot?.profitLoss?.margins?.gross?.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 