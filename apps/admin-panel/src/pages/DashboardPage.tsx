import {
  Box,
  Grid,
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
} from '@mui/material';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

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
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.main`, color: 'white' }}>
            {icon}
          </Avatar>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {trend > 0 ? (
                <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
              ) : (
                <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: trend > 0 ? 'success.main' : 'error.main',
                  fontWeight: 600,
                }}
              >
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          System Overview
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Users"
            value="2,134"
            subtitle="Active users: 1,687"
            trend={12}
            icon={<People />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending Moderation"
            value="23"
            subtitle="Requires attention"
            trend={-8}
            icon={<Security />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Monthly Revenue"
            value="$48,250"
            subtitle="vs last month"
            trend={15}
            icon={<AttachMoney />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Content Items"
            value="1,456"
            subtitle="Published: 1,392"
            trend={5}
            icon={<ContentCopy />}
            color="info"
          />
        </Grid>

        {/* User Growth Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                User Growth & Activity
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Bar dataKey="users" fill="#3b82f6" name="Total Users" />
                  <Bar dataKey="active" fill="#10b981" name="Active Users" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Content Moderation Status */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Content Moderation
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={contentModerationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {contentModerationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {contentModerationData.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: item.color,
                        mr: 1,
                      }}
                    />
                    <Typography variant="body2">
                      {item.name}: {item.value}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                System Health
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">API Response Time</Typography>
                  <Chip
                    label="Excellent"
                    color="success"
                    size="small"
                    icon={<CheckCircle />}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={95}
                  sx={{ height: 8, borderRadius: 4 }}
                  color="success"
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Database Performance</Typography>
                  <Chip
                    label="Good"
                    color="warning"
                    size="small"
                    icon={<Warning />}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={78}
                  sx={{ height: 8, borderRadius: 4 }}
                  color="warning"
                />
              </Box>
              
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Server Uptime</Typography>
                  <Chip
                    label="99.9%"
                    color="success"
                    size="small"
                    icon={<CheckCircle />}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={99.9}
                  sx={{ height: 8, borderRadius: 4 }}
                  color="success"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Recent Activity
                </Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {recentActivities.map((activity, index) => (
                  <Box key={activity.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
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
                        >
                          {activity.user.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.action}
                        secondary={`${activity.user} • ${activity.time}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}