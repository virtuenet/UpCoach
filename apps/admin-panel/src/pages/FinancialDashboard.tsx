import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  Activity,
  RefreshCw,
  Download,
  Info,
  AlertTriangle,
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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Sankey,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import type { 
  MetricCardProps,
  FinancialMetrics,
  RevenueData,
  SubscriptionData,
  RetentionData,
  TrendDataPoint
} from '../types/financial';

// Custom metric card component
const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color, 
  trend,
  subtitle,
  loading = false 
}) => {
  const isPositive = change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
            <Box display="flex" alignItems="center" mt={1}>
              <TrendIcon 
                size={16} 
                color={isPositive ? '#10b981' : '#ef4444'} 
              />
              <Typography
                variant="body2"
                color={isPositive ? 'success.main' : 'error.main'}
                ml={0.5}
              >
                {Math.abs(change)}% vs last period
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={24} color={color} />
          </Box>
        </Box>
        
        {/* Mini sparkline chart */}
        {trend && (
          <Box mt={2} height={40}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Main Financial Dashboard Component
export default function FinancialDashboard() {
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Fetch financial metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<FinancialMetrics>({
    queryKey: ['financial-metrics', timeRange, refreshKey],
    queryFn: async () => {
      const response = await apiClient.get(`/api/financial/metrics?range=${timeRange}`);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch revenue analytics
  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenueData>({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: async () => {
      const response = await apiClient.get(`/api/financial/revenue?range=${timeRange}`);
      return response.data;
    },
  });

  // Fetch subscription analytics
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery<SubscriptionData>({
    queryKey: ['subscription-analytics', timeRange],
    queryFn: async () => {
      const response = await apiClient.get(`/api/financial/subscriptions/analytics?range=${timeRange}`);
      return response.data;
    },
  });

  // Fetch churn and retention data
  const { data: retentionData } = useQuery<RetentionData>({
    queryKey: ['retention-analytics', timeRange],
    queryFn: async () => {
      const response = await apiClient.get(`/api/financial/retention?range=${timeRange}`);
      return response.data;
    },
  });

  // Generate mock trend data for metric cards
  const generateTrend = (baseValue: number, days: number = 7): TrendDataPoint[] => {
    return Array.from({ length: days }, (_, i) => ({
      day: i,
      value: baseValue * (1 + (Math.random() - 0.5) * 0.2),
    }));
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetchMetrics();
  };

  const handleExport = () => {
    // Implement CSV export functionality
    const csvData = [
      ['Metric', 'Value', 'Change %'],
      ['MRR', metrics?.mrr || 0, metrics?.mrrChange || 0],
      ['ARR', metrics?.arr || 0, metrics?.arrChange || 0],
      ['Customers', metrics?.totalCustomers || 0, metrics?.customerChange || 0],
      ['ARPU', metrics?.arpu || 0, metrics?.arpuChange || 0],
    ];
    
    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-metrics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Financial Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Real-time financial metrics and analytics
          </Typography>
        </Box>
        
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh}>
              <RefreshCw size={20} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Export data">
            <IconButton onClick={handleExport}>
              <Download size={20} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Alerts */}
      {metrics?.alerts && metrics.alerts.length > 0 && (
        <Box mb={3}>
          {metrics.alerts.map((alert, index) => (
            <Alert
              key={index}
              severity={alert.severity}
              icon={<AlertTriangle size={20} />}
              sx={{ mb: 1 }}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Key Metrics Grid */}
      <Grid container spacing={3} mb={3}>
        {/* @ts-ignore - MUI Grid item props */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Monthly Recurring Revenue"
            value={`$${(metrics?.mrr || 0).toLocaleString()}`}
            change={metrics?.mrrChange || 0}
            icon={DollarSign}
            color="#3b82f6"
            trend={generateTrend(metrics?.mrr || 0)}
            subtitle="MRR"
            loading={metricsLoading}
          />
        </Grid>
        
        {/* @ts-ignore - MUI Grid item props */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Annual Recurring Revenue"
            value={`$${(metrics?.arr || 0).toLocaleString()}`}
            change={metrics?.arrChange || 0}
            icon={TrendingUp}
            color="#10b981"
            trend={generateTrend(metrics?.arr || 0)}
            subtitle="ARR"
            loading={metricsLoading}
          />
        </Grid>
        
        {/* @ts-ignore - MUI Grid item props */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Customers"
            value={(metrics?.totalCustomers || 0).toLocaleString()}
            change={metrics?.customerChange || 0}
            icon={Users}
            color="#f59e0b"
            trend={generateTrend(metrics?.totalCustomers || 0)}
            subtitle={`${metrics?.newCustomers || 0} new this month`}
            loading={metricsLoading}
          />
        </Grid>
        
        {/* @ts-ignore - MUI Grid item props */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Average Revenue Per User"
            value={`$${(metrics?.arpu || 0).toFixed(2)}`}
            change={metrics?.arpuChange || 0}
            icon={CreditCard}
            color="#8b5cf6"
            trend={generateTrend(metrics?.arpu || 0)}
            subtitle="ARPU"
            loading={metricsLoading}
          />
        </Grid>
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={3}>
        {/* Revenue Trend Chart */}
        {/* @ts-ignore - MUI Grid item props */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Revenue Trend</Typography>
              <Box display="flex" gap={1}>
                {['revenue', 'subscriptions', 'transactions'].map(metric => (
                  <Chip
                    key={metric}
                    label={metric.charAt(0).toUpperCase() + metric.slice(1)}
                    onClick={() => setSelectedMetric(metric)}
                    color={selectedMetric === metric ? 'primary' : 'default'}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
            
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={revenueData?.trend || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                  labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Subscription Distribution */}
        {/* @ts-ignore - MUI Grid item props */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" mb={2}>Subscription Distribution</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={subscriptionData?.distribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(subscriptionData?.distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Churn & Retention Metrics */}
        {/* @ts-ignore - MUI Grid item props */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" mb={2}>Churn & Retention Analysis</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={retentionData?.monthly || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <RechartsTooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="retention" fill="#10b981" name="Retention Rate" />
                <Bar dataKey="churn" fill="#ef4444" name="Churn Rate" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Customer Lifetime Value */}
        {/* @ts-ignore - MUI Grid item props */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" mb={2}>Customer Lifetime Value Analysis</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <RadarChart data={metrics?.ltvAnalysis || []}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="segment" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar
                  name="Current"
                  dataKey="current"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Target"
                  dataKey="target"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Transactions Table */}
        {/* @ts-ignore - MUI Grid item props */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Recent Transactions</Typography>
              <Chip
                label={`${metrics?.todayTransactions || 0} today`}
                color="primary"
                size="small"
              />
            </Box>
            
            {/* Add transaction table component here */}
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Transaction ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(metrics?.recentTransactions || []).map((transaction, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px' }}>{transaction.id}</td>
                      <td style={{ padding: '12px' }}>{transaction.customer}</td>
                      <td style={{ padding: '12px' }}>
                        <Chip
                          label={transaction.type}
                          size="small"
                          color={transaction.type === 'subscription' ? 'primary' : 'default'}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                        ${transaction.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Chip
                          label={transaction.status}
                          size="small"
                          color={transaction.status === 'completed' ? 'success' : 'warning'}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}