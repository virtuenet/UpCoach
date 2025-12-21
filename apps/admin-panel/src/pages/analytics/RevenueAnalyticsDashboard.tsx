/**
 * Revenue Analytics Dashboard
 *
 * Comprehensive financial analytics and revenue insights
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
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  AccountBalance,
  CreditCard,
  Receipt,
  ShowChart,
  PieChart,
  BarChart,
  Refresh,
  Download,
  FilterList,
  CalendarMonth,
  ArrowUpward,
  ArrowDownward,
  Subscriptions,
  LocalOffer,
  Payment,
  Wallet,
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
type TabValue = 'overview' | 'subscriptions' | 'transactions' | 'payouts';

interface RevenueMetrics {
  totalRevenue: number;
  revenueChange: number;
  mrr: number;
  mrrChange: number;
  arr: number;
  arpu: number;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
}

interface SubscriptionTier {
  name: string;
  subscribers: number;
  revenue: number;
  percentage: number;
  color: string;
}

interface Transaction {
  id: string;
  type: 'subscription' | 'session' | 'package' | 'refund';
  amount: number;
  user: string;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

interface Payout {
  id: string;
  coach: string;
  amount: number;
  sessions: number;
  date: string;
  status: 'completed' | 'pending' | 'processing';
}

interface RevenueForecast {
  month: string;
  projected: number;
  actual?: number;
  confidence: number;
}

// Mock data
const mockMetrics: RevenueMetrics = {
  totalRevenue: 89450,
  revenueChange: 15.3,
  mrr: 24500,
  mrrChange: 8.2,
  arr: 294000,
  arpu: 85,
  ltv: 1200,
  cac: 120,
  ltvCacRatio: 10,
};

const mockTiers: SubscriptionTier[] = [
  { name: 'Premium', subscribers: 145, revenue: 14500, percentage: 35, color: '#667eea' },
  { name: 'Professional', subscribers: 230, revenue: 11500, percentage: 28, color: '#f093fb' },
  { name: 'Basic', subscribers: 520, revenue: 10400, percentage: 25, color: '#4facfe' },
  { name: 'Enterprise', subscribers: 25, revenue: 5000, percentage: 12, color: '#43e97b' },
];

const mockTransactions: Transaction[] = [
  { id: '1', type: 'subscription', amount: 99, user: 'Sarah Johnson', description: 'Premium Monthly', date: '2 hours ago', status: 'completed' },
  { id: '2', type: 'session', amount: 150, user: 'Michael Chen', description: 'Coaching Session', date: '5 hours ago', status: 'completed' },
  { id: '3', type: 'package', amount: 499, user: 'Emily Rodriguez', description: '10-Session Package', date: '1 day ago', status: 'pending' },
  { id: '4', type: 'refund', amount: -49, user: 'David Kim', description: 'Basic Plan Refund', date: '2 days ago', status: 'completed' },
  { id: '5', type: 'subscription', amount: 199, user: 'Lisa Thompson', description: 'Professional Annual', date: '3 days ago', status: 'completed' },
];

const mockPayouts: Payout[] = [
  { id: '1', coach: 'Dr. Sarah Williams', amount: 3450, sessions: 23, date: '2024-01-15', status: 'completed' },
  { id: '2', coach: 'Mike Johnson', amount: 2890, sessions: 19, date: '2024-01-15', status: 'completed' },
  { id: '3', coach: 'Emily Davis', amount: 1560, sessions: 12, date: '2024-01-15', status: 'processing' },
  { id: '4', coach: 'Alex Chen', amount: 2100, sessions: 14, date: '2024-01-15', status: 'pending' },
];

const mockForecast: RevenueForecast[] = [
  { month: 'Jan', projected: 85000, actual: 89450, confidence: 95 },
  { month: 'Feb', projected: 92000, actual: undefined, confidence: 88 },
  { month: 'Mar', projected: 98000, actual: undefined, confidence: 82 },
  { month: 'Apr', projected: 105000, actual: undefined, confidence: 75 },
  { month: 'May', projected: 112000, actual: undefined, confidence: 68 },
  { month: 'Jun', projected: 120000, actual: undefined, confidence: 60 },
];

export default function RevenueAnalyticsDashboard() {
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

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'subscription':
        return <Subscriptions />;
      case 'session':
        return <CalendarMonth />;
      case 'package':
        return <LocalOffer />;
      case 'refund':
        return <Receipt />;
      default:
        return <Payment />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const totalSubscribers = useMemo(
    () => mockTiers.reduce((acc, tier) => acc + tier.subscribers, 0),
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
            Revenue Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Financial performance and subscription metrics
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
                  TOTAL REVENUE
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  ${mockMetrics.totalRevenue.toLocaleString()}
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
          <MetricCard gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  MRR
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  ${mockMetrics.mrr.toLocaleString()}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TrendingUp sx={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {mockMetrics.mrrChange}% growth
                  </Typography>
                </Stack>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <ShowChart />
              </Avatar>
            </Stack>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  ARR
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  ${(mockMetrics.arr / 1000).toFixed(0)}K
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Annual recurring revenue
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <AccountBalance />
              </Avatar>
            </Stack>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  LTV:CAC RATIO
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {mockMetrics.ltvCacRatio}:1
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Excellent health
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <PieChart />
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
          <Tab label="Subscriptions" value="subscriptions" />
          <Tab label="Transactions" value="transactions" />
          <Tab label="Payouts" value="payouts" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tab === 'overview' && (
        <Grid container spacing={3}>
          {/* Subscription Tiers */}
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" fontWeight="600" mb={3}>
                  Revenue by Tier
                </Typography>

                <Stack spacing={3}>
                  {mockTiers.map((tier) => (
                    <Box key={tier.name}>
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
                              bgcolor: tier.color,
                            }}
                          />
                          <Typography variant="body2" fontWeight="500">
                            {tier.name}
                          </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Typography variant="caption" color="text.secondary">
                            {tier.subscribers} users
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            ${tier.revenue.toLocaleString()}
                          </Typography>
                        </Stack>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={tier.percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: tier.color,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Total Subscribers
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {totalSubscribers.toLocaleString()}
                  </Typography>
                </Stack>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Key Financial Metrics */}
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" fontWeight="600" mb={3}>
                  Key Metrics
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper
                      elevation={0}
                      sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        ARPU
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        ${mockMetrics.arpu}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Per user/month
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      elevation={0}
                      sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        LTV
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        ${mockMetrics.ltv}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Lifetime value
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      elevation={0}
                      sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        CAC
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        ${mockMetrics.cac}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Acquisition cost
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      elevation={0}
                      sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Payback Period
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        1.4 mo
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        CAC recovery
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Revenue Forecast */}
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
                    Revenue Forecast
                  </Typography>
                  <Chip
                    label="AI Powered"
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Stack>

                <Grid container spacing={2}>
                  {mockForecast.map((month) => (
                    <Grid item xs={12 / 6} key={month.month}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          bgcolor: month.actual
                            ? theme.palette.success.light
                            : theme.palette.grey[50],
                          borderRadius: 2,
                          border: month.actual ? 2 : 0,
                          borderColor: theme.palette.success.main,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {month.month}
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" my={0.5}>
                          ${(month.actual || month.projected).toLocaleString()}
                        </Typography>
                        <Chip
                          label={`${month.confidence}%`}
                          size="small"
                          sx={{
                            bgcolor:
                              month.confidence >= 80
                                ? '#dcfce7'
                                : month.confidence >= 60
                                ? '#fef3c7'
                                : '#fee2e2',
                            color:
                              month.confidence >= 80
                                ? '#166534'
                                : month.confidence >= 60
                                ? '#92400e'
                                : '#991b1b',
                          }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      )}

      {tab === 'subscriptions' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" fontWeight="600" mb={3}>
                  Subscription Distribution
                </Typography>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tier</TableCell>
                        <TableCell align="right">Subscribers</TableCell>
                        <TableCell align="right">Monthly Revenue</TableCell>
                        <TableCell align="right">% of Total</TableCell>
                        <TableCell align="right">ARPU</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockTiers.map((tier) => (
                        <TableRow key={tier.name} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 1,
                                  bgcolor: tier.color,
                                }}
                              />
                              <Typography variant="body2" fontWeight="500">
                                {tier.name}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            {tier.subscribers.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            ${tier.revenue.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${tier.percentage}%`}
                              size="small"
                              sx={{ bgcolor: tier.color, color: 'white' }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            ${(tier.revenue / tier.subscribers).toFixed(0)}
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

      {tab === 'transactions' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" fontWeight="600" mb={3}>
                  Recent Transactions
                </Typography>

                <List>
                  {mockTransactions.map((tx, index) => (
                    <React.Fragment key={tx.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor:
                                tx.type === 'refund'
                                  ? theme.palette.error.light
                                  : theme.palette.primary.light,
                            }}
                          >
                            {getTransactionIcon(tx.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography variant="body2" fontWeight="500">
                                {tx.description}
                              </Typography>
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                color={tx.amount < 0 ? 'error.main' : 'success.main'}
                              >
                                {tx.amount < 0 ? '-' : '+'}$
                                {Math.abs(tx.amount).toLocaleString()}
                              </Typography>
                            </Stack>
                          }
                          secondary={
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              mt={0.5}
                            >
                              <Typography variant="caption" color="text.secondary">
                                {tx.user} • {tx.date}
                              </Typography>
                              <Chip
                                label={tx.status}
                                size="small"
                                color={getStatusColor(tx.status) as 'success' | 'warning' | 'error' | 'info' | 'default'}
                              />
                            </Stack>
                          }
                        />
                      </ListItem>
                      {index < mockTransactions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>

                <Button fullWidth variant="text" sx={{ mt: 2 }}>
                  View All Transactions
                </Button>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      )}

      {tab === 'payouts' && (
        <Grid container spacing={3}>
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
                    Coach Payouts
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Wallet />}
                    size="small"
                  >
                    Process Payouts
                  </Button>
                </Stack>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Coach</TableCell>
                        <TableCell align="right">Sessions</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Date</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockPayouts.map((payout) => (
                        <TableRow key={payout.id} hover>
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
                                {payout.coach
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </Avatar>
                              <Typography variant="body2" fontWeight="500">
                                {payout.coach}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">{payout.sessions}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              ${payout.amount.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{payout.date}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={payout.status}
                              size="small"
                              color={getStatusColor(payout.status) as 'success' | 'warning' | 'info' | 'default'}
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
