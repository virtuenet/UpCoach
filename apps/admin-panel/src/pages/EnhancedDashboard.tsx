import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  Button,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Alert,
  AlertTitle,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  Collapse,
} from '@mui/material';
import { Grid } from '@mui/material';
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
  Download,
  FilterList,
  CalendarMonth,
  Notifications,
  Settings,
  ArrowUpward,
  ArrowDownward,
  Info,
  Error,
  AccessTime,
  Analytics,
  Speed,
  Storage,
  CloudUpload,
  Group,
  PersonAdd,
  PersonRemove,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components for enhanced visual design
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: '1px solid',
  borderColor: theme.palette.mode === 'light' ? '#f0f0f0' : theme.palette.divider,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
  },
}));

const MetricCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  borderRadius: 16,
  padding: theme.spacing(3),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '200px',
    height: '200px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    transform: 'translate(50px, -50px)',
  },
}));

const StatusBadge = styled(Chip)(({ theme, severity }) => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  height: 24,
  ...(severity === 'success' && {
    backgroundColor: '#10b981',
    color: 'white',
  }),
  ...(severity === 'warning' && {
    backgroundColor: '#f59e0b',
    color: 'white',
  }),
  ...(severity === 'error' && {
    backgroundColor: '#ef4444',
    color: 'white',
  }),
  ...(severity === 'info' && {
    backgroundColor: '#3b82f6',
    color: 'white',
  }),
}));

const AnimatedNumber = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const endValue = parseInt(value);

    const updateValue = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(endValue * easeOutQuart));

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };

    requestAnimationFrame(updateValue);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
};

const CircularProgressWithLabel = ({ value, size = 60, thickness = 4 }) => {
  return (
    <Box position="relative" display="inline-flex">
      <Box
        sx={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        }}
      />
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - thickness) / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeDasharray={`${2 * Math.PI * ((size - thickness) / 2)}`}
          strokeDashoffset={`${2 * Math.PI * ((size - thickness) / 2) * (1 - value / 100)}`}
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out',
            strokeLinecap: 'round',
          }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" component="div" color="textSecondary">
          {`${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
  );
};

// Mock data with enhanced structure
const enhancedDashboardData = {
  metrics: {
    totalUsers: { value: 12450, change: 12.5, trend: 'up' },
    activeUsers: { value: 8930, change: 8.2, trend: 'up' },
    newUsers: { value: 1245, change: -3.4, trend: 'down' },
    revenue: { value: 89450, change: 15.7, trend: 'up' },
    conversionRate: { value: 3.8, change: 0.5, trend: 'up' },
    avgSessionTime: { value: '5m 32s', change: 12, trend: 'up' },
  },
  systemHealth: {
    apiLatency: { value: 45, status: 'excellent', threshold: 100 },
    errorRate: { value: 0.3, status: 'excellent', threshold: 1 },
    uptime: { value: 99.98, status: 'excellent', threshold: 99.5 },
    cpuUsage: { value: 62, status: 'good', threshold: 80 },
    memoryUsage: { value: 71, status: 'warning', threshold: 70 },
    diskUsage: { value: 48, status: 'excellent', threshold: 80 },
  },
  notifications: [
    { id: 1, type: 'info', title: 'System Update', message: 'Scheduled maintenance at 2 AM EST', time: '5 min ago' },
    { id: 2, type: 'warning', title: 'High Traffic Alert', message: 'Traffic spike detected on API endpoints', time: '1 hour ago' },
    { id: 3, type: 'success', title: 'Backup Complete', message: 'Daily backup completed successfully', time: '3 hours ago' },
  ],
  recentActivities: [
    { id: 1, user: 'Sarah Chen', action: 'Published new course content', time: '2 minutes ago', avatar: 'SC', type: 'content' },
    { id: 2, user: 'Michael Rodriguez', action: 'Updated user permissions', time: '15 minutes ago', avatar: 'MR', type: 'admin' },
    { id: 3, user: 'Emily Thompson', action: 'Resolved support ticket #1234', time: '1 hour ago', avatar: 'ET', type: 'support' },
    { id: 4, user: 'David Kim', action: 'Deployed API v2.3.1', time: '2 hours ago', avatar: 'DK', type: 'deployment' },
    { id: 5, user: 'Jessica Liu', action: 'Created marketing campaign', time: '4 hours ago', avatar: 'JL', type: 'marketing' },
  ],
};

export default function EnhancedDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);
  const [expandedMetric, setExpandedMetric] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    setIsLoading(true);
    // Simulate data loading
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey(prev => prev + 1);
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
      // Show success notification
    }, 1500);
  }, []);

  const handleExportData = () => {
    // Implement export functionality
    console.log('Exporting dashboard data...');
  };

  const getActivityIcon = (type) => {
    const icons = {
      content: <ContentCopy fontSize="small" />,
      admin: <Security fontSize="small" />,
      support: <People fontSize="small" />,
      deployment: <CloudUpload fontSize="small" />,
      marketing: <Analytics fontSize="small" />,
    };
    return icons[type] || <Info fontSize="small" />;
  };

  const getHealthStatusColor = (status) => {
    const colors = {
      excellent: '#10b981',
      good: '#3b82f6',
      warning: '#f59e0b',
      critical: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Enhanced Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
              Dashboard Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Welcome back! Here's what's happening with your platform today.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
              size="small"
            >
              {selectedPeriod === '24h' ? 'Last 24 Hours' :
               selectedPeriod === '7d' ? 'Last 7 Days' :
               selectedPeriod === '30d' ? 'Last 30 Days' :
               'Custom'}
            </Button>

            <Tooltip title="Refresh data">
              <IconButton
                onClick={handleRefresh}
                disabled={isLoading}
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

            <Tooltip title="Export data">
              <IconButton onClick={handleExportData}>
                <Download />
              </IconButton>
            </Tooltip>

            <Tooltip title="Settings">
              <IconButton>
                <Settings />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* Period Selection Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => { handlePeriodChange('24h'); setAnchorEl(null); }}>Last 24 Hours</MenuItem>
        <MenuItem onClick={() => { handlePeriodChange('7d'); setAnchorEl(null); }}>Last 7 Days</MenuItem>
        <MenuItem onClick={() => { handlePeriodChange('30d'); setAnchorEl(null); }}>Last 30 Days</MenuItem>
        <MenuItem onClick={() => { handlePeriodChange('90d'); setAnchorEl(null); }}>Last 90 Days</MenuItem>
        <Divider />
        <MenuItem onClick={() => { handlePeriodChange('custom'); setAnchorEl(null); }}>Custom Range...</MenuItem>
      </Menu>

      {/* Notifications Alert */}
      <Collapse in={showNotifications && enhancedDashboardData.notifications.length > 0}>
        <Alert
          severity="info"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowNotifications(false)}
            >
              <X />
            </IconButton>
          }
        >
          <AlertTitle>You have {enhancedDashboardData.notifications.length} new notifications</AlertTitle>
          {enhancedDashboardData.notifications[0].message}
        </Alert>
      </Collapse>

      {/* Key Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Users Metric */}
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in timeout={300}>
            <StyledCard>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      TOTAL USERS
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      <AnimatedNumber value={enhancedDashboardData.metrics.totalUsers.value} />
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5} mt={1}>
                      {enhancedDashboardData.metrics.totalUsers.trend === 'up' ? (
                        <ArrowUpward sx={{ fontSize: 16, color: '#10b981' }} />
                      ) : (
                        <ArrowDownward sx={{ fontSize: 16, color: '#ef4444' }} />
                      )}
                      <Typography variant="caption" color={enhancedDashboardData.metrics.totalUsers.trend === 'up' ? '#10b981' : '#ef4444'}>
                        {enhancedDashboardData.metrics.totalUsers.change}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        vs last period
                      </Typography>
                    </Stack>
                  </Box>
                  <Avatar sx={{ bgcolor: '#3b82f6', width: 48, height: 48 }}>
                    <People />
                  </Avatar>
                </Stack>
              </CardContent>
            </StyledCard>
          </Zoom>
        </Grid>

        {/* Active Users Metric */}
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in timeout={400}>
            <StyledCard>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      ACTIVE USERS
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      <AnimatedNumber value={enhancedDashboardData.metrics.activeUsers.value} />
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5} mt={1}>
                      <ArrowUpward sx={{ fontSize: 16, color: '#10b981' }} />
                      <Typography variant="caption" color="#10b981">
                        {enhancedDashboardData.metrics.activeUsers.change}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        vs last period
                      </Typography>
                    </Stack>
                  </Box>
                  <Avatar sx={{ bgcolor: '#10b981', width: 48, height: 48 }}>
                    <Group />
                  </Avatar>
                </Stack>
              </CardContent>
            </StyledCard>
          </Zoom>
        </Grid>

        {/* Revenue Metric */}
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in timeout={500}>
            <StyledCard>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      REVENUE
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      ${<AnimatedNumber value={enhancedDashboardData.metrics.revenue.value} />}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5} mt={1}>
                      <ArrowUpward sx={{ fontSize: 16, color: '#10b981' }} />
                      <Typography variant="caption" color="#10b981">
                        {enhancedDashboardData.metrics.revenue.change}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        vs last period
                      </Typography>
                    </Stack>
                  </Box>
                  <Avatar sx={{ bgcolor: '#f59e0b', width: 48, height: 48 }}>
                    <AttachMoney />
                  </Avatar>
                </Stack>
              </CardContent>
            </StyledCard>
          </Zoom>
        </Grid>

        {/* Conversion Rate Metric */}
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in timeout={600}>
            <StyledCard>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      CONVERSION RATE
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {enhancedDashboardData.metrics.conversionRate.value}%
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5} mt={1}>
                      <ArrowUpward sx={{ fontSize: 16, color: '#10b981' }} />
                      <Typography variant="caption" color="#10b981">
                        {enhancedDashboardData.metrics.conversionRate.change}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        vs last period
                      </Typography>
                    </Stack>
                  </Box>
                  <Avatar sx={{ bgcolor: '#8b5cf6', width: 48, height: 48 }}>
                    <TrendingUp />
                  </Avatar>
                </Stack>
              </CardContent>
            </StyledCard>
          </Zoom>
        </Grid>
      </Grid>

      {/* System Health and Activity Grid */}
      <Grid container spacing={3}>
        {/* System Health Card */}
        <Grid item xs={12} md={6} lg={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                System Health
              </Typography>

              <Stack spacing={3} mt={2}>
                {/* API Latency */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      API Latency
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="caption" fontWeight="600">
                        {enhancedDashboardData.systemHealth.apiLatency.value}ms
                      </Typography>
                      <StatusBadge
                        label={enhancedDashboardData.systemHealth.apiLatency.status}
                        severity="success"
                        size="small"
                      />
                    </Stack>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(enhancedDashboardData.systemHealth.apiLatency.value / enhancedDashboardData.systemHealth.apiLatency.threshold) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        backgroundColor: getHealthStatusColor(enhancedDashboardData.systemHealth.apiLatency.status),
                      },
                    }}
                  />
                </Box>

                {/* Error Rate */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Error Rate
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="caption" fontWeight="600">
                        {enhancedDashboardData.systemHealth.errorRate.value}%
                      </Typography>
                      <StatusBadge
                        label={enhancedDashboardData.systemHealth.errorRate.status}
                        severity="success"
                        size="small"
                      />
                    </Stack>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(enhancedDashboardData.systemHealth.errorRate.value / enhancedDashboardData.systemHealth.errorRate.threshold) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        backgroundColor: getHealthStatusColor(enhancedDashboardData.systemHealth.errorRate.status),
                      },
                    }}
                  />
                </Box>

                {/* CPU Usage */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      CPU Usage
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="caption" fontWeight="600">
                        {enhancedDashboardData.systemHealth.cpuUsage.value}%
                      </Typography>
                      <StatusBadge
                        label={enhancedDashboardData.systemHealth.cpuUsage.status}
                        severity="info"
                        size="small"
                      />
                    </Stack>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={enhancedDashboardData.systemHealth.cpuUsage.value}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        backgroundColor: getHealthStatusColor(enhancedDashboardData.systemHealth.cpuUsage.status),
                      },
                    }}
                  />
                </Box>

                {/* Memory Usage */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Memory Usage
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="caption" fontWeight="600">
                        {enhancedDashboardData.systemHealth.memoryUsage.value}%
                      </Typography>
                      <StatusBadge
                        label={enhancedDashboardData.systemHealth.memoryUsage.status}
                        severity="warning"
                        size="small"
                      />
                    </Stack>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={enhancedDashboardData.systemHealth.memoryUsage.value}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        backgroundColor: getHealthStatusColor(enhancedDashboardData.systemHealth.memoryUsage.status),
                      },
                    }}
                  />
                </Box>

                {/* Uptime */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Uptime
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CircularProgressWithLabel value={enhancedDashboardData.systemHealth.uptime.value} size={40} />
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Recent Activity Card */}
        <Grid item xs={12} md={6} lg={4}>
          <StyledCard>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="600">
                  Recent Activity
                </Typography>
                <Tooltip title="View all activities">
                  <IconButton size="small">
                    <MoreVert />
                  </IconButton>
                </Tooltip>
              </Stack>

              <List sx={{ p: 0 }}>
                {enhancedDashboardData.recentActivities.map((activity, index) => (
                  <Fade in timeout={300 * (index + 1)} key={activity.id}>
                    <Box>
                      <ListItem sx={{ px: 0, py: 1.5 }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.primary.light,
                              width: 36,
                              height: 36,
                              fontSize: '0.875rem',
                            }}
                          >
                            {activity.avatar}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight="500">
                              {activity.action}
                            </Typography>
                          }
                          secondary={
                            <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
                              {getActivityIcon(activity.type)}
                              <Typography variant="caption" color="text.secondary">
                                {activity.user} • {activity.time}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItem>
                      {index < enhancedDashboardData.recentActivities.length - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </Box>
                  </Fade>
                ))}
              </List>

              <Button
                fullWidth
                variant="text"
                size="small"
                sx={{ mt: 2 }}
                endIcon={<ArrowUpward sx={{ fontSize: 16 }} />}
              >
                View All Activities
              </Button>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Notifications Card */}
        <Grid item xs={12} md={12} lg={4}>
          <StyledCard>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="600">
                  Notifications
                </Typography>
                <IconButton size="small">
                  <Notifications />
                </IconButton>
              </Stack>

              <Stack spacing={2}>
                {enhancedDashboardData.notifications.map((notification) => (
                  <Paper
                    key={notification.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: theme.palette.grey[50],
                      borderLeft: 4,
                      borderColor:
                        notification.type === 'error' ? '#ef4444' :
                        notification.type === 'warning' ? '#f59e0b' :
                        notification.type === 'success' ? '#10b981' :
                        '#3b82f6',
                    }}
                  >
                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                      <Box>
                        {notification.type === 'error' && <Error sx={{ color: '#ef4444', fontSize: 20 }} />}
                        {notification.type === 'warning' && <Warning sx={{ color: '#f59e0b', fontSize: 20 }} />}
                        {notification.type === 'success' && <CheckCircle sx={{ color: '#10b981', fontSize: 20 }} />}
                        {notification.type === 'info' && <Info sx={{ color: '#3b82f6', fontSize: 20 }} />}
                      </Box>
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight="600" gutterBottom>
                          {notification.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
                          <AccessTime sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                          {notification.time}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>

              <Button
                fullWidth
                variant="outlined"
                size="small"
                sx={{ mt: 2 }}
              >
                View All Notifications
              </Button>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );
}