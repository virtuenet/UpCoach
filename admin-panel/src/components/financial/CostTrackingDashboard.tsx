import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  PieChart,
  BarChart3,
  Filter,
  Download,
  Calendar,
  Search,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { financialApi } from '../../services/financialApi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface CostEntry {
  id: string;
  category: string;
  subcategory: string;
  vendor: string;
  amount: number;
  date: string;
  description: string;
  status: string;
}

interface OptimizationRecommendation {
  category: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  potentialSavings: number;
  timeframe: string;
}

export const CostTrackingDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('monthly');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Data states
  const [costData, setCostData] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [topVendors, setTopVendors] = useState<any[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('all');

  useEffect(() => {
    fetchCostData();
  }, [dateRange, selectedCategory]);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      if (dateRange === 'weekly') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === 'monthly') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (dateRange === 'quarterly') {
        startDate.setMonth(startDate.getMonth() - 3);
      }

      const [costs, trends] = await Promise.all([
        financialApi.getCostBreakdown(startDate.toISOString(), endDate.toISOString()),
        // Mock API calls for now
        Promise.resolve(generateMockTrends()),
      ]);

      setCostData(costs);
      setTrends(trends);
      setBreakdown(generateBreakdownData(costs));
      setRecommendations(generateMockRecommendations());
      setTopVendors(costs.topVendors || []);
      
    } catch (error) {
      console.error('Error fetching cost data:', error);
    } finally {
      setLoading(false);
    }
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

  const generateMockTrends = () => {
    const data = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        infrastructure: 1500 + Math.random() * 500,
        apiServices: 800 + Math.random() * 300,
        personnel: 12000 + Math.random() * 2000,
        marketing: 3000 + Math.random() * 1000,
        office: 500 + Math.random() * 200,
      });
    }
    return data;
  };

  const generateBreakdownData = (costs: any) => {
    if (!costs?.costsByCategory) return [];
    
    return Object.entries(costs.costsByCategory).map(([category, amount]) => ({
      name: category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: amount as number,
      percentage: ((amount as number) / costs.totalCosts) * 100,
    }));
  };

  const generateMockRecommendations = (): OptimizationRecommendation[] => [
    {
      category: 'Infrastructure',
      recommendation: 'Implement auto-scaling to reduce compute costs during low usage periods',
      impact: 'high',
      effort: 'medium',
      potentialSavings: 2500,
      timeframe: '2-3 weeks',
    },
    {
      category: 'API Services',
      recommendation: 'Cache frequently requested data to reduce API calls',
      impact: 'high',
      effort: 'low',
      potentialSavings: 1800,
      timeframe: '1 week',
    },
    {
      category: 'Marketing',
      recommendation: 'Optimize ad spend allocation based on conversion data',
      impact: 'medium',
      effort: 'low',
      potentialSavings: 1200,
      timeframe: '1-2 weeks',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalCosts = costData?.totalCosts || 0;
  const burnRate = costData?.burnRate || 0;
  const costPerUser = costData?.costPerUser || 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cost Tracking</h1>
          <p className="text-gray-600">Monitor and optimize your operational expenses</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            aria-label="Date range selector"
            className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="weekly">Last Week</option>
            <option value="monthly">Last Month</option>
            <option value="quarterly">Last Quarter</option>
          </select>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Costs</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(totalCosts)}
                  </dd>
                  <dd className="text-sm text-gray-600">
                    <span className="text-red-600">
                      {formatPercentage(5.2)} from last period
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDown className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Monthly Burn Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(burnRate)}
                  </dd>
                  <dd className="text-sm text-gray-600">
                    Critical metric to monitor
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cost Per User</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(costPerUser)}
                  </dd>
                  <dd className="text-sm text-gray-600">
                    <span className="text-green-600">
                      {formatPercentage(-2.1)} from last period
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Potential Savings</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0))}
                  </dd>
                  <dd className="text-sm text-gray-600">
                    From optimization
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'trends', name: 'Trends', icon: TrendingUp },
              { id: 'breakdown', name: 'Breakdown', icon: PieChart },
              { id: 'optimization', name: 'Optimization', icon: Target },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Cost Distribution */}
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Cost Distribution
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={breakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {breakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Vendors */}
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Top Vendors
                  </h3>
                  <div className="space-y-3">
                    {topVendors.slice(0, 8).map((vendor, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
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
                            {((vendor.total_cost / totalCosts) * 100).toFixed(1)}% of total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Budget vs Actual */}
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Budget vs Actual
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={breakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="value" name="Actual" fill="#3B82F6" />
                      <Bar dataKey="budget" name="Budget" fill="#E5E7EB" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Cost Trends Over Time
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="infrastructure"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        name="Infrastructure"
                      />
                      <Area
                        type="monotone"
                        dataKey="apiServices"
                        stackId="1"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        name="API Services"
                      />
                      <Area
                        type="monotone"
                        dataKey="personnel"
                        stackId="1"
                        stroke="#ffc658"
                        fill="#ffc658"
                        name="Personnel"
                      />
                      <Area
                        type="monotone"
                        dataKey="marketing"
                        stackId="1"
                        stroke="#ff7300"
                        fill="#ff7300"
                        name="Marketing"
                      />
                      <Area
                        type="monotone"
                        dataKey="office"
                        stackId="1"
                        stroke="#00ff00"
                        fill="#00ff00"
                        name="Office"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {Object.entries(costData?.costsByCategory || {}).map(([category, amount], index) => (
                  <div key={category} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      {category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </h4>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(amount as number)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {((amount as number / totalCosts) * 100).toFixed(1)}% of total spend
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown Tab */}
          {activeTab === 'breakdown' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search costs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                                 <select
                   value={selectedCategory}
                   onChange={(e) => setSelectedCategory(e.target.value)}
                   aria-label="Category filter"
                   className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                 >
                  <option value="all">All Categories</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="api_services">API Services</option>
                  <option value="personnel">Personnel</option>
                  <option value="marketing">Marketing</option>
                  <option value="office">Office</option>
                </select>
              </div>

              {/* Detailed breakdown table would go here */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:p-6">
                  <p className="text-gray-500">Detailed cost breakdown table would be implemented here with filterable and sortable data.</p>
                </div>
              </div>
            </div>
          )}

          {/* Optimization Tab */}
          {activeTab === 'optimization' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <Target className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Optimization Opportunities
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      Potential savings of {formatCurrency(recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0))} identified across {recommendations.length} categories.
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{rec.category}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            rec.impact === 'high' ? 'bg-red-100 text-red-800' :
                            rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {rec.impact.toUpperCase()} IMPACT
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            rec.effort === 'high' ? 'bg-red-100 text-red-800' :
                            rec.effort === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {rec.effort.toUpperCase()} EFFORT
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{rec.recommendation}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Potential Savings: <strong className="text-green-600">{formatCurrency(rec.potentialSavings)}</strong></span>
                          <span>Timeframe: <strong>{rec.timeframe}</strong></span>
                        </div>
                      </div>
                      <button className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Implement
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 