import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import { Grid, TextField, Button } from '@mui/material';
import { lazy, Suspense, useMemo, useCallback, useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  People,
  ContentCopy,
  Security,
  AttachMoney,
  Warning,
  CheckCircle,
  MoreVert,
  Refresh,
} from '@mui/icons-material';
import dashboardService, { DashboardData } from '../services/dashboardService';
import { triggerWeeklyDoc, triggerWeeklySheet } from '../services/reportsService';
// Lazy load heavy chart components for better performance
const LazyBarChart = lazy(() => 
  import('recharts').then(module => ({
    default: ({ data, ...props }: any) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } = module;
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={data} 
            {...props}
            aria-label="User growth and activity bar chart"
            role="img"
          >
            <CartesianGrid strokeDasharray="3 3" aria-hidden="true" />
            <XAxis 
              dataKey="month" 
              aria-label="Month"
            />
            <YAxis 
              aria-label="Number of users"
            />
            <Tooltip 
              formatter={(value, name) => [
                value, 
                name === 'users' ? 'Total Users' : 'Active Users'
              ]}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar 
              dataKey="users" 
              fill="#1976d2" 
              name="Total Users"
              aria-label="Total users data"
            />
            <Bar 
              dataKey="active" 
              fill="#42a5f5" 
              name="Active Users"
              aria-label="Active users data"
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  }))
);

const LazyLineChart = lazy(() =>
  import('recharts').then(module => ({
    default: ({ data, ...props }: any) => {
      const { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } = module;
      return (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} {...props}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Line type="monotone" dataKey="users" stroke="#1976d2" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  }))
);

const LazyPieChart = lazy(() =>
  import('recharts').then(module => ({
    default: ({ data, ...props }: any) => {
      const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } = module;
      return (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart 
            {...props}
            aria-label="Content moderation status pie chart"
            role="img"
          >
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              aria-label="Content moderation distribution"
            >
              {data.map((entry: any, index: number) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  aria-label={`${entry.name}: ${entry.value}%`}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [`${value}%`, name]}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }
  }))
);

// Skeleton components for better loading UX
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <Box 
    sx={{ width: '100%', height }}
    role="status"
    aria-label="Chart loading"
    aria-live="polite"
  >
    <Skeleton 
      variant="rectangular" 
      width="100%" 
      height="80%" 
      aria-hidden="true"
    />
    <Skeleton 
      variant="text" 
      width="60%" 
      sx={{ mt: 1 }} 
      aria-hidden="true"
    />
    <Skeleton 
      variant="text" 
      width="40%" 
      aria-hidden="true"
    />
    <span className="sr-only">Loading chart data...</span>
  </Box>
);

const StatCardSkeleton = () => (
  <Card role="status" aria-label="Statistics card loading">
    <CardContent>
      <Skeleton variant="text" width="60%" aria-hidden="true" />
      <Skeleton variant="text" width="40%" height={40} aria-hidden="true" />
      <Skeleton variant="text" width="80%" aria-hidden="true" />
      <span className="sr-only">Loading statistics...</span>
    </CardContent>
  </Card>
);

// Mock data for dashboard
const userGrowthData = [
  { month: 'Jan', users: 1200, active: 980 },
  { month: 'Feb', users: 1350, active: 1100 },
  { month: 'Mar', users: 1500, active: 1200 },
  { month: 'Apr', users: 1680, active: 1350 },
  { month: 'May', users: 1850, active: 1480 },
  { month: 'Jun', users: 2100, active: 1680 },
];

const contentModerationData = [
  { name: 'Approved', value: 85, color: '#4caf50' },
  { name: 'Pending', value: 10, color: '#ff9800' },
  { name: 'Rejected', value: 5, color: '#f44336' },
];

const recentActivities = [
  { id: 1, user: 'John Smith', action: 'Created new content', time: '2 minutes ago', severity: 'info' },
  { id: 2, user: 'Sarah Johnson', action: 'Reported inappropriate content', time: '15 minutes ago', severity: 'warning' },
  { id: 3, user: 'Mike Davis', action: 'Upgraded to premium', time: '1 hour ago', severity: 'success' },
  { id: 4, user: 'Emma Wilson', action: 'Account suspended', time: '2 hours ago', severity: 'error' },
  { id: 5, user: 'Alex Brown', action: 'Completed onboarding', time: '3 hours ago', severity: 'info' },
];

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  color: string;
}

function StatsCard({ title, value, subtitle, trend, icon, color }: StatsCardProps) {
  const trendDirection = trend && trend > 0 ? 'increased' : 'decreased';
  const trendAnnouncement = trend ? `${title} has ${trendDirection} by ${Math.abs(trend)} percent` : '';
  
  return (
    <Card 
      sx={{ height: '100%' }}
      role="region"
      aria-labelledby={`stats-${title.replace(/\s+/g, '-').toLowerCase()}-title`}
      aria-describedby={`stats-${title.replace(/\s+/g, '-').toLowerCase()}-value`}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar 
            sx={{ bgcolor: `${color}.main`, color: 'white' }}
            aria-hidden="true"
          >
            {icon}
          </Avatar>
          {trend && (
            <Box 
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              role="img"
              aria-label={trendAnnouncement}
            >
              {trend > 0 ? (
                <TrendingUp 
                  sx={{ color: 'success.main', fontSize: 16 }} 
                  aria-hidden="true"
                />
              ) : (
                <TrendingDown 
                  sx={{ color: 'error.main', fontSize: 16 }} 
                  aria-hidden="true"
                />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: trend > 0 ? 'success.main' : 'error.main',
                  fontWeight: 600,
                }}
                aria-label={`${Math.abs(trend)} percent ${trendDirection}`}
              >
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Typography 
          variant="h4" 
          sx={{ fontWeight: 700, mb: 0.5 }}
          id={`stats-${title.replace(/\s+/g, '-').toLowerCase()}-value`}
          aria-live="polite"
        >
          {value}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          id={`stats-${title.replace(/\s+/g, '-').toLowerCase()}-title`}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            aria-label={`Additional info: ${subtitle}`}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  // State for dashboard functionality
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [exportUserId, setExportUserId] = useState('');
  const [exporting, setExporting] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await dashboardService.getDashboardData(forceRefresh);
      setDashboardData(data);
      setLastRefresh(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      dashboardService.enableAutoRefresh(30000); // 30 seconds

      // Listen for auto-refresh updates
      const handleDataUpdate = () => {
        setLastRefresh(new Date());
        // Optionally trigger a state update
        fetchDashboardData();
      };

      window.addEventListener('dashboardDataUpdated', handleDataUpdate);

      return () => {
        window.removeEventListener('dashboardDataUpdated', handleDataUpdate);
      };
    } else {
      dashboardService.disableAutoRefresh();
    }

    return () => {
      dashboardService.disableAutoRefresh();
    };
  }, [autoRefresh, fetchDashboardData]);

  // Memoize heavy data processing
  const memoizedUserGrowthData = useMemo(() =>
    dashboardData?.userGrowth || userGrowthData,
    [dashboardData?.userGrowth]
  );

  const memoizedContentModerationData = useMemo(() =>
    dashboardData?.contentModeration || contentModerationData,
    [dashboardData?.contentModeration]
  );

  const memoizedRecentActivities = useMemo(() =>
    dashboardData?.recentActivities || recentActivities,
    [dashboardData?.recentActivities]
  );

  // Handler for toggling auto-refresh
  const handleToggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  // Memoize refresh handler to prevent unnecessary re-renders
  const handleRefresh = useCallback(() => {
    fetchDashboardData(true); // Force refresh
  }, [fetchDashboardData]);

  return (
    <Box role="main" aria-labelledby="dashboard-title">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 600 }}
            id="dashboard-title"
            component="h1"
          >
            System Overview
          </Typography>
          {lastRefresh && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {error && (
            <Chip
              label={`Error: ${error}`}
              color="error"
              size="small"
              variant="outlined"
              sx={{ maxWidth: 200 }}
            />
          )}
          <Tooltip title={autoRefresh ? 'Disable auto-refresh (30s)' : 'Enable auto-refresh (30s)'}>
            <Chip
              label={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              color={autoRefresh ? 'success' : 'default'}
              variant={autoRefresh ? 'filled' : 'outlined'}
              onClick={handleToggleAutoRefresh}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Refresh dashboard data">
            <IconButton
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Refresh dashboard data"
              size="large"
              sx={{
                animation: isLoading ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            <TextField
              size="small"
              aria-label="User ID for export"
              placeholder="User ID"
              value={exportUserId}
              onChange={(e) => setExportUserId(e.target.value)}
              sx={{ width: 200 }}
            />
            <Button
              variant="contained"
              color="primary"
              aria-label="Export weekly report (Doc)"
              disabled={!exportUserId || exporting}
              onClick={async () => {
                try {
                  setExporting(true);
                  await triggerWeeklyDoc(exportUserId);
                } finally {
                  setExporting(false);
                }
              }}
            >
              Doc
            </Button>
            <Button
              variant="contained"
              color="info"
              aria-label="Export weekly report (Sheet)"
              disabled={!exportUserId || exporting}
              onClick={async () => {
                try {
                  setExporting(true);
                  await triggerWeeklySheet(exportUserId);
                } finally {
                  setExporting(false);
                }
              }}
            >
              Sheet
            </Button>
          </Box>
        </Box>
      </Box>

      <Box 
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}
        role="region"
        aria-labelledby="stats-section"
      >
        {/* Stats Cards */}
        <Box component="div" sx={{ display: 'none' }} id="stats-section">Key Performance Indicators</Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          {dashboardData ? (
            <StatsCard
              title="Total Users"
              value={dashboardData.stats.userStats.totalUsers.toLocaleString()}
              subtitle={`Active users: ${dashboardData.stats.userStats.activeUsers.toLocaleString()}`}
              trend={dashboardData.stats.userStats.growth}
              icon={<People />}
              color="primary"
            />
          ) : (
            <StatCardSkeleton />
          )}
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          {dashboardData ? (
            <StatsCard
              title="Pending Moderation"
              value={dashboardData.stats.contentStats.pendingModeration.toString()}
              subtitle="Requires attention"
              trend={dashboardData.stats.contentStats.moderationRate - 95}
              icon={<Security />}
              color="warning"
            />
          ) : (
            <StatCardSkeleton />
          )}
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          {dashboardData ? (
            <StatsCard
              title="Monthly Revenue"
              value={`$${dashboardData.stats.financialStats.revenue.toLocaleString()}`}
              subtitle="vs last month"
              trend={dashboardData.stats.financialStats.growth}
              icon={<AttachMoney />}
              color="success"
            />
          ) : (
            <StatCardSkeleton />
          )}
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          {dashboardData ? (
            <StatsCard
              title="Content Items"
              value={dashboardData.stats.contentStats.totalContent.toLocaleString()}
              subtitle={`Approved today: ${dashboardData.stats.contentStats.approvedToday}`}
              trend={Math.round((dashboardData.stats.contentStats.approvedToday / dashboardData.stats.contentStats.totalContent) * 1000) / 10}
              icon={<ContentCopy />}
              color="info"
            />
          ) : (
            <StatCardSkeleton />
          )}
        </Box>

      <Box 
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3 }}
        role="region"
        aria-labelledby="charts-section"
      >
        <Box component="div" sx={{ display: 'none' }} id="charts-section">Data Visualization Charts</Box>
        
        {/* User Growth Chart */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 65%' } }}>
          <Card 
            role="region" 
            aria-labelledby="user-growth-title"
            aria-describedby="user-growth-description"
          >
            <CardContent>
              <Typography 
                variant="h6" 
                sx={{ mb: 2 }}
                id="user-growth-title"
                component="h2"
              >
                User Growth & Activity
              </Typography>
              <div id="user-growth-description" className="sr-only">
                Bar chart showing user growth and activity over the past 6 months
              </div>
              <Suspense fallback={<ChartSkeleton height={300} />}>
                <div role="img" title="User Growth & Activity" aria-labelledby="user-growth-title" aria-describedby="user-growth-description">
                  <LazyBarChart data={memoizedUserGrowthData} />
                </div>
              </Suspense>
            </CardContent>
          </Card>
        </Box>

        {/* Content Moderation Status */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' } }}>
          <Card 
            role="region" 
            aria-labelledby="moderation-title"
            aria-describedby="moderation-description"
          >
            <CardContent>
              <Typography 
                variant="h6" 
                sx={{ mb: 2 }}
                id="moderation-title"
                component="h2"
              >
                Content Moderation
              </Typography>
              <div id="moderation-description" className="sr-only">
                Pie chart showing content moderation status distribution: approved, pending, and rejected content
              </div>
              <Suspense fallback={<ChartSkeleton height={300} />}>
                <div role="img" title="Content Moderation" aria-labelledby="moderation-title" aria-describedby="moderation-description">
                  <LazyPieChart data={memoizedContentModerationData} />
                </div>
              </Suspense>
              <Box 
                sx={{ mt: 2 }}
                role="list"
                aria-label="Content moderation legend"
              >
                {memoizedContentModerationData.map((item, index) => (
                  <Box 
                    key={index} 
                    sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                    role="listitem"
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: item.color,
                        mr: 1,
                      }}
                      role="img"
                      aria-label={`${item.name} indicator color`}
                    />
                    <Typography 
                      variant="body2"
                      aria-label={`${item.name} represents ${item.value} percent of content`}
                    >
                      {item.name}: {item.value}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box 
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3 }}
        role="region"
        aria-labelledby="health-activity-section"
      >
        <Box component="div" sx={{ display: 'none' }} id="health-activity-section">System Health and Recent Activity</Box>
        
        {/* System Health */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 45%' } }}>
          <Card 
            role="region" 
            aria-labelledby="system-health-title"
          >
            <CardContent>
              <Typography 
                variant="h6" 
                sx={{ mb: 2 }}
                id="system-health-title"
                component="h2"
              >
                System Health
              </Typography>
              
              {dashboardData?.systemHealth ? (
                <>
                  <Box sx={{ mb: 3 }} role="group" aria-labelledby="api-response-label">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography
                        variant="body2"
                        id="api-response-label"
                        component="h3"
                      >
                        API Response Time
                      </Typography>
                      <Chip
                        label={dashboardData.systemHealth.apiResponseTime.status}
                        color={dashboardData.systemHealth.apiResponseTime.status === 'excellent' ? 'success' : dashboardData.systemHealth.apiResponseTime.status === 'good' ? 'info' : 'warning'}
                        size="small"
                        icon={<CheckCircle aria-hidden="true" />}
                        aria-label={`API Response Time status: ${dashboardData.systemHealth.apiResponseTime.status}`}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={dashboardData.systemHealth.apiResponseTime.value}
                      sx={{ height: 8, borderRadius: 4 }}
                      color={dashboardData.systemHealth.apiResponseTime.status === 'excellent' ? 'success' : dashboardData.systemHealth.apiResponseTime.status === 'good' ? 'info' : 'warning'}
                      aria-label={`API Response Time: ${dashboardData.systemHealth.apiResponseTime.value} percent ${dashboardData.systemHealth.apiResponseTime.status}`}
                      role="progressbar"
                      aria-valuenow={dashboardData.systemHealth.apiResponseTime.value}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }} role="group" aria-labelledby="db-performance-label">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography
                        variant="body2"
                        id="db-performance-label"
                        component="h3"
                      >
                        Database Performance
                      </Typography>
                      <Chip
                        label={dashboardData.systemHealth.databasePerformance.status}
                        color={dashboardData.systemHealth.databasePerformance.status === 'excellent' ? 'success' : dashboardData.systemHealth.databasePerformance.status === 'good' ? 'warning' : 'error'}
                        size="small"
                        icon={dashboardData.systemHealth.databasePerformance.status === 'excellent' ? <CheckCircle aria-hidden="true" /> : <Warning aria-hidden="true" />}
                        aria-label={`Database Performance status: ${dashboardData.systemHealth.databasePerformance.status}`}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={dashboardData.systemHealth.databasePerformance.value}
                      sx={{ height: 8, borderRadius: 4 }}
                      color={dashboardData.systemHealth.databasePerformance.status === 'excellent' ? 'success' : dashboardData.systemHealth.databasePerformance.status === 'good' ? 'warning' : 'error'}
                      aria-label={`Database Performance: ${dashboardData.systemHealth.databasePerformance.value} percent ${dashboardData.systemHealth.databasePerformance.status}`}
                      role="progressbar"
                      aria-valuenow={dashboardData.systemHealth.databasePerformance.value}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </Box>

                  <Box role="group" aria-labelledby="server-uptime-label">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography
                        variant="body2"
                        id="server-uptime-label"
                        component="h3"
                      >
                        Server Uptime
                      </Typography>
                      <Chip
                        label={`${dashboardData.systemHealth.serverUptime.value}%`}
                        color="success"
                        size="small"
                        icon={<CheckCircle aria-hidden="true" />}
                        aria-label={`Server Uptime: ${dashboardData.systemHealth.serverUptime.value} percent excellent`}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={dashboardData.systemHealth.serverUptime.value}
                      sx={{ height: 8, borderRadius: 4 }}
                      color="success"
                      aria-label={`Server Uptime: ${dashboardData.systemHealth.serverUptime.value} percent excellent`}
                      role="progressbar"
                      aria-valuenow={dashboardData.systemHealth.serverUptime.value}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </Box>
                </>
              ) : (
                <>
                  <ChartSkeleton height={80} />
                  <ChartSkeleton height={80} />
                  <ChartSkeleton height={80} />
                </>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Recent Activity */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 45%' } }}>
          <Card 
            role="region" 
            aria-labelledby="recent-activity-title"
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography 
                  variant="h6"
                  id="recent-activity-title"
                  component="h2"
                >
                  Recent Activity
                </Typography>
                <Tooltip title="More activity options">
                  <IconButton 
                    size="small"
                    aria-label="More activity options"
                  >
                    <MoreVert />
                  </IconButton>
                </Tooltip>
              </Box>
              <List 
                sx={{ maxHeight: 300, overflow: 'auto' }}
                role="log"
                aria-label="Recent user activities"
                aria-live="polite"
              >
                {memoizedRecentActivities.map((activity, index) => (
                  <Box key={activity.id}>
                    <ListItem 
                      alignItems="flex-start" 
                      sx={{ px: 0 }}
                      role="listitem"
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor:
                              activity.severity === 'error'
                                ? 'error.main'
                                : activity.severity === 'warning'
                                ? 'warning.main'
                                : activity.severity === 'success'
                                ? 'success.main'
                                : 'info.main',
                            width: 32,
                            height: 32,
                            fontSize: '0.75rem',
                          }}
                          aria-label={`${activity.user} profile`}
                        >
                          {activity.user.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.action}
                        secondary={`${activity.user} • ${activity.time}`}
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          'aria-label': `Activity: ${activity.action}` 
                        }}
                        secondaryTypographyProps={{ 
                          variant: 'caption',
                          'aria-label': `By ${activity.user}, ${activity.time}` 
                        }}
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && (
                      <Divider 
                        aria-hidden="true" 
                        role="separator" 
                      />
                    )}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>
      </Box>
    </Box>
  );
}