/**
 * Engagement Analytics Dashboard
 *
 * User engagement metrics and behavioral analytics
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Stack,
  Button,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  TrendingUp,
  TrendingDown,
  People,
  AccessTime,
  TouchApp,
  Visibility,
  Loop,
  Timeline,
  BarChart,
  PieChart,
  Refresh,
  Download,
  FilterList,
  PersonAdd,
  ExitToApp,
  Speed,
  Flag,
  LocalFireDepartment,
  EmojiEvents,
  Groups,
  CalendarMonth,
} from '@mui/icons-material';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: '1px solid',
  borderColor: theme.palette.mode === 'light' ? '#f0f0f0' : theme.palette.divider,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
  },
}));

const MetricCard = styled(Card)<{ gradient?: string }>(({ theme, gradient }) => ({
  background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  borderRadius: 16,
  padding: theme.spacing(2.5),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '150px',
    height: '150px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    transform: 'translate(50px, -50px)',
  },
}));

// Types
type AnalyticsPeriod = 'week' | 'month' | 'quarter' | 'year';
type TabValue = 'overview' | 'cohorts' | 'segments' | 'features';

interface EngagementMetrics {
  dau: number;
  dauChange: number;
  mau: number;
  mauChange: number;
  stickiness: number;
  avgSessionDuration: number;
  sessionsPerUser: number;
  retentionRate: number;
  churnRate: number;
  engagementScore: number;
}

interface CohortData {
  month: string;
  users: number;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  week8: number;
  week12: number;
}

interface UserSegment {
  name: string;
  count: number;
  percentage: number;
  engagement: number;
  revenue: number;
  color: string;
}

interface FeatureUsage {
  feature: string;
  users: number;
  sessions: number;
  avgDuration: number;
  satisfaction: number;
}

interface HeatmapCell {
  hour: number;
  day: string;
  value: number;
}

// Mock data
const mockMetrics: EngagementMetrics = {
  dau: 3245,
  dauChange: 8.5,
  mau: 12450,
  mauChange: 12.3,
  stickiness: 26.1,
  avgSessionDuration: 8.5,
  sessionsPerUser: 3.2,
  retentionRate: 78.5,
  churnRate: 4.2,
  engagementScore: 72,
};

const mockCohorts: CohortData[] = [
  { month: 'Dec 2023', users: 1250, week1: 85, week2: 72, week3: 65, week4: 58, week8: 48, week12: 42 },
  { month: 'Nov 2023', users: 1180, week1: 82, week2: 68, week3: 61, week4: 55, week8: 45, week12: 38 },
  { month: 'Oct 2023', users: 1320, week1: 88, week2: 75, week3: 68, week4: 62, week8: 52, week12: 45 },
  { month: 'Sep 2023', users: 980, week1: 80, week2: 65, week3: 58, week4: 50, week8: 40, week12: 35 },
  { month: 'Aug 2023', users: 1450, week1: 86, week2: 73, week3: 66, week4: 60, week8: 50, week12: 44 },
];

const mockSegments: UserSegment[] = [
  { name: 'Power Users', count: 1245, percentage: 10, engagement: 95, revenue: 45, color: '#667eea' },
  { name: 'Regular Users', count: 4980, percentage: 40, engagement: 72, revenue: 35, color: '#4facfe' },
  { name: 'Casual Users', count: 3735, percentage: 30, engagement: 45, revenue: 15, color: '#43e97b' },
  { name: 'At-Risk Users', count: 1495, percentage: 12, engagement: 25, revenue: 4, color: '#f59e0b' },
  { name: 'Dormant Users', count: 995, percentage: 8, engagement: 5, revenue: 1, color: '#ef4444' },
];

const mockFeatures: FeatureUsage[] = [
  { feature: 'Coaching Sessions', users: 8500, sessions: 45000, avgDuration: 45, satisfaction: 92 },
  { feature: 'Goal Tracking', users: 10200, sessions: 125000, avgDuration: 5, satisfaction: 88 },
  { feature: 'Habit Tracker', users: 9800, sessions: 280000, avgDuration: 2, satisfaction: 90 },
  { feature: 'AI Chat', users: 6500, sessions: 32000, avgDuration: 8, satisfaction: 85 },
  { feature: 'Progress Reports', users: 7200, sessions: 18000, avgDuration: 12, satisfaction: 82 },
  { feature: 'Community Forums', users: 4500, sessions: 22000, avgDuration: 15, satisfaction: 78 },
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = [6, 8, 10, 12, 14, 16, 18, 20, 22];

const mockHeatmap: HeatmapCell[] = days.flatMap((day) =>
  hours.map((hour) => ({
    day,
    hour,
    value: Math.random() * 100,
  }))
);

export default function EngagementAnalyticsDashboard() {
  const theme = useTheme();
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [tab, setTab] = useState<TabValue>('overview');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePeriodChange = (newPeriod: AnalyticsPeriod) => {
    setPeriod(newPeriod);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  const getHeatmapColor = (value: number) => {
    if (value >= 80) return '#166534';
    if (value >= 60) return '#22c55e';
    if (value >= 40) return '#86efac';
    if (value >= 20) return '#bbf7d0';
    return '#f0fdf4';
  };

  const getRetentionColor = (value: number) => {
    if (value >= 70) return theme.palette.success.main;
    if (value >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Engagement Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            User behavior, retention, and engagement insights
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            size="small"
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Button>
          <Tooltip title="Refresh data">
            <IconButton onClick={() => handlePeriodChange(period)}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export report">
            <IconButton>
              <Download />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {(['week', 'month', 'quarter', 'year'] as AnalyticsPeriod[]).map((p) => (
          <MenuItem
            key={p}
            selected={period === p}
            onClick={() => {
              handlePeriodChange(p);
              setAnchorEl(null);
            }}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </MenuItem>
        ))}
      </Menu>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Key Metrics Row */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  DAU
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {mockMetrics.dau.toLocaleString()}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TrendingUp sx={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {mockMetrics.dauChange}% vs last {period}
                  </Typography>
                </Stack>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <People />
              </Avatar>
            </Stack>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  MAU
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {mockMetrics.mau.toLocaleString()}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TrendingUp sx={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {mockMetrics.mauChange}% growth
                  </Typography>
                </Stack>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <Groups />
              </Avatar>
            </Stack>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  STICKINESS
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {mockMetrics.stickiness}%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  DAU / MAU ratio
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <TouchApp />
              </Avatar>
            </Stack>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  RETENTION
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {mockMetrics.retentionRate}%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  30-day retention
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <Loop />
              </Avatar>
            </Stack>
          </MetricCard>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" value="overview" />
          <Tab label="Cohort Analysis" value="cohorts" />
          <Tab label="User Segments" value="segments" />
          <Tab label="Feature Usage" value="features" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tab === 'overview' && (
        <Grid container spacing={3}>
          {/* Engagement Stats */}
          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" fontWeight="600" mb={3}>
                  Engagement Score
                </Typography>

                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'inline-flex',
                      width: 160,
                      height: 160,
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: `conic-gradient(
                          ${theme.palette.primary.main} ${mockMetrics.engagementScore * 3.6}deg,
                          ${theme.palette.grey[200]} ${mockMetrics.engagementScore * 3.6}deg
                        )`,
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        right: 12,
                        bottom: 12,
                        borderRadius: '50%',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                      }}
                    >
                      <Typography variant="h3" fontWeight="bold">
                        {mockMetrics.engagementScore}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        out of 100
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="body2">Avg Session</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="bold">
                      {mockMetrics.avgSessionDuration} min
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Visibility fontSize="small" color="action" />
                      <Typography variant="body2">Sessions/User</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="bold">
                      {mockMetrics.sessionsPerUser}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ExitToApp fontSize="small" color="action" />
                      <Typography variant="body2">Churn Rate</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="bold" color="error.main">
                      {mockMetrics.churnRate}%
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Activity Heatmap */}
          <Grid item xs={12} md={8}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" fontWeight="600" mb={3}>
                  Activity Heatmap
                </Typography>

                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell />
                        {hours.map((hour) => (
                          <TableCell key={hour} align="center" sx={{ px: 1 }}>
                            <Typography variant="caption">{hour}:00</Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {days.map((day) => (
                        <TableRow key={day}>
                          <TableCell sx={{ fontWeight: 500 }}>{day}</TableCell>
                          {hours.map((hour) => {
                            const cell = mockHeatmap.find(
                              (c) => c.day === day && c.hour === hour
                            );
                            return (
                              <TableCell
                                key={hour}
                                align="center"
                                sx={{
                                  bgcolor: getHeatmapColor(cell?.value || 0),
                                  px: 1,
                                  py: 1.5,
                                }}
                              >
                                <Typography variant="caption" color="text.primary">
                                  {cell?.value.toFixed(0)}
                                </Typography>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>

                <Stack direction="row" justifyContent="center" spacing={2} mt={2}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: '#f0fdf4',
                        borderRadius: 0.5,
                      }}
                    />
                    <Typography variant="caption">Low</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: '#86efac',
                        borderRadius: 0.5,
                      }}
                    />
                    <Typography variant="caption">Medium</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: '#166534',
                        borderRadius: 0.5,
                      }}
                    />
                    <Typography variant="caption">High</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      )}

      {tab === 'cohorts' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" fontWeight="600" mb={3}>
                  Cohort Retention Analysis
                </Typography>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Cohort</TableCell>
                        <TableCell align="right">Users</TableCell>
                        <TableCell align="center">Week 1</TableCell>
                        <TableCell align="center">Week 2</TableCell>
                        <TableCell align="center">Week 3</TableCell>
                        <TableCell align="center">Week 4</TableCell>
                        <TableCell align="center">Week 8</TableCell>
                        <TableCell align="center">Week 12</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockCohorts.map((cohort) => (
                        <TableRow key={cohort.month} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <CalendarMonth fontSize="small" color="action" />
                              <Typography variant="body2" fontWeight="500">
                                {cohort.month}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            {cohort.users.toLocaleString()}
                          </TableCell>
                          {[
                            cohort.week1,
                            cohort.week2,
                            cohort.week3,
                            cohort.week4,
                            cohort.week8,
                            cohort.week12,
                          ].map((value, index) => (
                            <TableCell key={index} align="center">
                              <Chip
                                label={`${value}%`}
                                size="small"
                                sx={{
                                  minWidth: 50,
                                  bgcolor:
                                    value >= 70
                                      ? '#dcfce7'
                                      : value >= 50
                                      ? '#fef3c7'
                                      : '#fee2e2',
                                  color:
                                    value >= 70
                                      ? '#166534'
                                      : value >= 50
                                      ? '#92400e'
                                      : '#991b1b',
                                }}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      )}

      {tab === 'segments' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" fontWeight="600" mb={3}>
                  User Segments
                </Typography>

                <Stack spacing={3}>
                  {mockSegments.map((segment) => (
                    <Box key={segment.name}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: 1,
                              bgcolor: segment.color,
                            }}
                          />
                          <Typography variant="body2" fontWeight="500">
                            {segment.name}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight="bold">
                          {segment.count.toLocaleString()} ({segment.percentage}%)
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={segment.percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: segment.color,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" fontWeight="600" mb={3}>
                  Segment Details
                </Typography>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Segment</TableCell>
                        <TableCell align="right">Engagement</TableCell>
                        <TableCell align="right">Revenue %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockSegments.map((segment) => (
                        <TableRow key={segment.name} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 0.5,
                                  bgcolor: segment.color,
                                }}
                              />
                              <Typography variant="body2">{segment.name}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <LinearProgress
                              variant="determinate"
                              value={segment.engagement}
                              sx={{
                                width: 80,
                                display: 'inline-block',
                                mr: 1,
                                height: 6,
                                borderRadius: 3,
                              }}
                            />
                            {segment.engagement}%
                          </TableCell>
                          <TableCell align="right">{segment.revenue}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      )}

      {tab === 'features' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" fontWeight="600" mb={3}>
                  Feature Usage Analytics
                </Typography>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Feature</TableCell>
                        <TableCell align="right">Active Users</TableCell>
                        <TableCell align="right">Total Sessions</TableCell>
                        <TableCell align="right">Avg Duration</TableCell>
                        <TableCell align="right">Satisfaction</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockFeatures.map((feature) => (
                        <TableRow key={feature.feature} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500">
                              {feature.feature}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {feature.users.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {feature.sessions.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">{feature.avgDuration} min</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${feature.satisfaction}%`}
                              size="small"
                              sx={{
                                bgcolor:
                                  feature.satisfaction >= 85
                                    ? '#dcfce7'
                                    : feature.satisfaction >= 70
                                    ? '#fef3c7'
                                    : '#fee2e2',
                                color:
                                  feature.satisfaction >= 85
                                    ? '#166534'
                                    : feature.satisfaction >= 70
                                    ? '#92400e'
                                    : '#991b1b',
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
