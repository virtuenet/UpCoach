/**
 * Coach Analytics Dashboard
 *
 * Comprehensive analytics view for coach performance monitoring
 */

import React, { useState, useMemo } from 'react';
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
  Rating,
  Fade,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  TrendingUp,
  TrendingDown,
  People,
  AttachMoney,
  Star,
  Schedule,
  EmojiEvents,
  Warning,
  CheckCircle,
  MoreVert,
  Refresh,
  Download,
  FilterList,
  Person,
  CalendarMonth,
  Flag,
  LocalFireDepartment,
  Speed,
  Timeline,
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
  padding: theme.spacing(2),
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

interface CoachMetrics {
  totalClients: number;
  activeClients: number;
  totalSessions: number;
  completedSessions: number;
  averageRating: number;
  totalReviews: number;
  revenue: number;
  revenueChange: number;
  goalsCompleted: number;
  goalsCompletionRate: number;
  avgSessionDuration: number;
  clientRetentionRate: number;
}

interface ClientProgress {
  id: string;
  name: string;
  avatar: string;
  goalProgress: number;
  engagementScore: number;
  lastSession: string;
  nextSession: string;
  riskLevel: 'low' | 'medium' | 'high';
  streak: number;
}

interface SessionData {
  date: string;
  count: number;
  revenue: number;
}

// Mock data
const mockMetrics: CoachMetrics = {
  totalClients: 45,
  activeClients: 38,
  totalSessions: 156,
  completedSessions: 142,
  averageRating: 4.8,
  totalReviews: 89,
  revenue: 12450,
  revenueChange: 15.3,
  goalsCompleted: 67,
  goalsCompletionRate: 78.5,
  avgSessionDuration: 52,
  clientRetentionRate: 92.4,
};

const mockClients: ClientProgress[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'SJ',
    goalProgress: 85,
    engagementScore: 92,
    lastSession: '2 days ago',
    nextSession: 'Tomorrow, 3 PM',
    riskLevel: 'low',
    streak: 15,
  },
  {
    id: '2',
    name: 'Michael Chen',
    avatar: 'MC',
    goalProgress: 62,
    engagementScore: 78,
    lastSession: '5 days ago',
    nextSession: 'Friday, 10 AM',
    riskLevel: 'medium',
    streak: 8,
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    avatar: 'ER',
    goalProgress: 45,
    engagementScore: 45,
    lastSession: '12 days ago',
    nextSession: 'Not scheduled',
    riskLevel: 'high',
    streak: 0,
  },
  {
    id: '4',
    name: 'David Kim',
    avatar: 'DK',
    goalProgress: 95,
    engagementScore: 98,
    lastSession: '1 day ago',
    nextSession: 'Today, 5 PM',
    riskLevel: 'low',
    streak: 28,
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    avatar: 'LT',
    goalProgress: 58,
    engagementScore: 65,
    lastSession: '8 days ago',
    nextSession: 'Monday, 2 PM',
    riskLevel: 'medium',
    streak: 3,
  },
];

const mockSessionData: SessionData[] = [
  { date: 'Mon', count: 8, revenue: 640 },
  { date: 'Tue', count: 12, revenue: 960 },
  { date: 'Wed', count: 6, revenue: 480 },
  { date: 'Thu', count: 10, revenue: 800 },
  { date: 'Fri', count: 14, revenue: 1120 },
  { date: 'Sat', count: 4, revenue: 320 },
  { date: 'Sun', count: 2, revenue: 160 },
];

export default function CoachAnalyticsDashboard() {
  const theme = useTheme();
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePeriodChange = (newPeriod: AnalyticsPeriod) => {
    setPeriod(newPeriod);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      default:
        return theme.palette.success.main;
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'At Risk';
      case 'medium':
        return 'Monitor';
      default:
        return 'On Track';
    }
  };

  const totalSessionRevenue = useMemo(
    () => mockSessionData.reduce((acc, d) => acc + d.revenue, 0),
    []
  );

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
            Coach Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor performance metrics and client progress
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
                  ACTIVE CLIENTS
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {mockMetrics.activeClients}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  of {mockMetrics.totalClients} total
                </Typography>
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
                  REVENUE
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  ${mockMetrics.revenue.toLocaleString()}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TrendingUp sx={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {mockMetrics.revenueChange}% vs last {period}
                  </Typography>
                </Stack>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <AttachMoney />
              </Avatar>
            </Stack>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  SESSIONS
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {mockMetrics.completedSessions}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  of {mockMetrics.totalSessions} scheduled
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <Schedule />
              </Avatar>
            </Stack>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  RATING
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h3" fontWeight="bold">
                    {mockMetrics.averageRating}
                  </Typography>
                  <Star />
                </Stack>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  from {mockMetrics.totalReviews} reviews
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <EmojiEvents />
              </Avatar>
            </Stack>
          </MetricCard>
        </Grid>
      </Grid>

      {/* Performance Stats and Client Progress */}
      <Grid container spacing={3}>
        {/* Performance Stats */}
        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" fontWeight="600" mb={3}>
                Performance Stats
              </Typography>

              <Stack spacing={3}>
                <Box>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Flag color="primary" fontSize="small" />
                      <Typography variant="body2">Goal Completion Rate</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="bold">
                      {mockMetrics.goalsCompletionRate}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={mockMetrics.goalsCompletionRate}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <People color="primary" fontSize="small" />
                      <Typography variant="body2">Client Retention</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="bold">
                      {mockMetrics.clientRetentionRate}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={mockMetrics.clientRetentionRate}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#10b981',
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Speed color="primary" fontSize="small" />
                      <Typography variant="body2">Session Completion</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="bold">
                      {((mockMetrics.completedSessions / mockMetrics.totalSessions) * 100).toFixed(1)}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(mockMetrics.completedSessions / mockMetrics.totalSessions) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#f59e0b',
                      },
                    }}
                  />
                </Box>

                <Divider />

                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Avg Session Duration
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {mockMetrics.avgSessionDuration} min
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Goals Completed
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {mockMetrics.goalsCompleted}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Active Client Ratio
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {((mockMetrics.activeClients / mockMetrics.totalClients) * 100).toFixed(0)}%
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Client Progress Table */}
        <Grid item xs={12} md={8}>
          <StyledCard>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h6" fontWeight="600">
                  Client Progress Overview
                </Typography>
                <Button size="small" endIcon={<Person />}>
                  View All Clients
                </Button>
              </Stack>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Client</TableCell>
                      <TableCell>Goal Progress</TableCell>
                      <TableCell>Engagement</TableCell>
                      <TableCell>Streak</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Next Session</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockClients.map((client) => (
                      <TableRow key={client.id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: theme.palette.primary.light,
                                fontSize: '0.75rem',
                              }}
                            >
                              {client.avatar}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="500">
                                {client.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Last: {client.lastSession}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ width: 100 }}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              mb={0.5}
                            >
                              <Typography variant="caption">
                                {client.goalProgress}%
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={client.goalProgress}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor:
                                  theme.palette.mode === 'light'
                                    ? '#e0e0e0'
                                    : '#424242',
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={`${client.engagementScore}%`}
                            sx={{
                              bgcolor:
                                client.engagementScore >= 80
                                  ? '#dcfce7'
                                  : client.engagementScore >= 60
                                  ? '#fef3c7'
                                  : '#fee2e2',
                              color:
                                client.engagementScore >= 80
                                  ? '#166534'
                                  : client.engagementScore >= 60
                                  ? '#92400e'
                                  : '#991b1b',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <LocalFireDepartment
                              sx={{
                                fontSize: 16,
                                color:
                                  client.streak > 0
                                    ? '#f97316'
                                    : theme.palette.text.disabled,
                              }}
                            />
                            <Typography variant="body2">{client.streak}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={getRiskLabel(client.riskLevel)}
                            icon={
                              client.riskLevel === 'high' ? (
                                <Warning sx={{ fontSize: 14 }} />
                              ) : client.riskLevel === 'low' ? (
                                <CheckCircle sx={{ fontSize: 14 }} />
                              ) : undefined
                            }
                            sx={{
                              bgcolor:
                                client.riskLevel === 'high'
                                  ? '#fee2e2'
                                  : client.riskLevel === 'medium'
                                  ? '#fef3c7'
                                  : '#dcfce7',
                              color:
                                client.riskLevel === 'high'
                                  ? '#991b1b'
                                  : client.riskLevel === 'medium'
                                  ? '#92400e'
                                  : '#166534',
                              '& .MuiChip-icon': {
                                color: 'inherit',
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {client.nextSession}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Weekly Session Summary */}
        <Grid item xs={12}>
          <StyledCard>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h6" fontWeight="600">
                  Weekly Session Summary
                </Typography>
                <Chip
                  label={`$${totalSessionRevenue.toLocaleString()} total`}
                  color="primary"
                  variant="outlined"
                />
              </Stack>

              <Grid container spacing={2}>
                {mockSessionData.map((day) => (
                  <Grid item xs={12 / 7} key={day.date}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: theme.palette.grey[50],
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {day.date}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" my={1}>
                        {day.count}
                      </Typography>
                      <Typography variant="caption" color="primary">
                        ${day.revenue}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );
}
