import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Group,
  Assignment,
  Psychology,
  Timeline,
  Download,
  Refresh,
  Calculate,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface KPI {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'success' | 'warning' | 'error';
}

interface TeamMetrics {
  teamId: string;
  teamName: string;
  memberCount: number;
  activeCoachingSessions: number;
  completedGoals: number;
  averageEngagement: number;
  performance: number;
}

interface TransformationMetrics {
  period: string;
  employeeEngagement: number;
  skillDevelopment: number;
  goalCompletion: number;
  coachingUtilization: number;
  leadershipGrowth: number;
  culturalAlignment: number;
}

interface ROICalculation {
  investment: number;
  benefits: {
    productivityGains: number;
    retentionSavings: number;
    timeEfficiency: number;
    qualityImprovement: number;
  };
  totalBenefits: number;
  roi: number;
  paybackPeriod: number;
}

const OrganizationalTransformationDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [roiDialogOpen, setRoiDialogOpen] = useState(false);

  const [kpis, setKpis] = useState<KPI[]>([
    {
      id: '1',
      name: 'Employee Engagement',
      value: 87,
      previousValue: 82,
      target: 90,
      unit: '%',
      trend: 'up',
      status: 'success',
    },
    {
      id: '2',
      name: 'Goal Completion Rate',
      value: 73,
      previousValue: 78,
      target: 85,
      unit: '%',
      trend: 'down',
      status: 'warning',
    },
    {
      id: '3',
      name: 'Active Coaching Sessions',
      value: 342,
      previousValue: 298,
      target: 400,
      unit: '',
      trend: 'up',
      status: 'success',
    },
    {
      id: '4',
      name: 'Leadership Development',
      value: 64,
      previousValue: 59,
      target: 75,
      unit: '%',
      trend: 'up',
      status: 'warning',
    },
    {
      id: '5',
      name: 'Skills Acquired',
      value: 1248,
      previousValue: 1102,
      target: 1500,
      unit: '',
      trend: 'up',
      status: 'success',
    },
    {
      id: '6',
      name: 'Cultural Alignment',
      value: 81,
      previousValue: 79,
      target: 85,
      unit: '%',
      trend: 'up',
      status: 'success',
    },
  ]);

  const [transformationData, setTransformationData] = useState<TransformationMetrics[]>([
    { period: 'Jan', employeeEngagement: 75, skillDevelopment: 62, goalCompletion: 68, coachingUtilization: 55, leadershipGrowth: 58, culturalAlignment: 72 },
    { period: 'Feb', employeeEngagement: 78, skillDevelopment: 65, goalCompletion: 71, coachingUtilization: 61, leadershipGrowth: 60, culturalAlignment: 74 },
    { period: 'Mar', employeeEngagement: 80, skillDevelopment: 68, goalCompletion: 69, coachingUtilization: 64, leadershipGrowth: 62, culturalAlignment: 76 },
    { period: 'Apr', employeeEngagement: 82, skillDevelopment: 71, goalCompletion: 73, coachingUtilization: 68, leadershipGrowth: 61, culturalAlignment: 78 },
    { period: 'May', employeeEngagement: 84, skillDevelopment: 74, goalCompletion: 75, coachingUtilization: 72, leadershipGrowth: 63, culturalAlignment: 79 },
    { period: 'Jun', employeeEngagement: 87, skillDevelopment: 77, goalCompletion: 73, coachingUtilization: 76, leadershipGrowth: 64, culturalAlignment: 81 },
  ]);

  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics[]>([
    { teamId: '1', teamName: 'Engineering', memberCount: 45, activeCoachingSessions: 38, completedGoals: 87, averageEngagement: 89, performance: 92 },
    { teamId: '2', teamName: 'Product', memberCount: 28, activeCoachingSessions: 24, completedGoals: 91, averageEngagement: 94, performance: 88 },
    { teamId: '3', teamName: 'Sales', memberCount: 62, activeCoachingSessions: 52, completedGoals: 78, averageEngagement: 82, performance: 85 },
    { teamId: '4', teamName: 'Marketing', memberCount: 34, activeCoachingSessions: 29, completedGoals: 84, averageEngagement: 87, performance: 86 },
    { teamId: '5', teamName: 'Customer Success', memberCount: 41, activeCoachingSessions: 35, completedGoals: 89, averageEngagement: 91, performance: 90 },
    { teamId: '6', teamName: 'Operations', memberCount: 38, activeCoachingSessions: 31, completedGoals: 81, averageEngagement: 85, performance: 83 },
  ]);

  const [roiData, setRoiData] = useState<ROICalculation>({
    investment: 250000,
    benefits: {
      productivityGains: 380000,
      retentionSavings: 150000,
      timeEfficiency: 95000,
      qualityImprovement: 125000,
    },
    totalBenefits: 750000,
    roi: 200,
    paybackPeriod: 4,
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In production, fetch real data here
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting dashboard data as ${format}`);
    // In production, implement actual export functionality
  };

  const calculateROI = () => {
    const totalBenefits = Object.values(roiData.benefits).reduce((sum, val) => sum + val, 0);
    const roi = ((totalBenefits - roiData.investment) / roiData.investment) * 100;
    const paybackPeriod = roiData.investment / (totalBenefits / 12);

    setRoiData({
      ...roiData,
      totalBenefits,
      roi,
      paybackPeriod,
    });
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp color="success" />;
    if (trend === 'down') return <TrendingDown color="error" />;
    return null;
  };

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const radarData = [
    { subject: 'Engagement', value: kpis[0].value, fullMark: 100 },
    { subject: 'Goals', value: kpis[1].value, fullMark: 100 },
    { subject: 'Coaching', value: (kpis[2].value / kpis[2].target) * 100, fullMark: 100 },
    { subject: 'Leadership', value: kpis[3].value, fullMark: 100 },
    { subject: 'Skills', value: (kpis[4].value / kpis[4].target) * 100, fullMark: 100 },
    { subject: 'Culture', value: kpis[5].value, fullMark: 100 },
  ];

  const pieData = Object.entries(roiData.benefits).map(([key, value]) => ({
    name: key.replace(/([A-Z])/g, ' $1').trim(),
    value,
  }));

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Organizational Transformation Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={selectedPeriod}
              label="Period"
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Calculate />}
            onClick={() => setRoiDialogOpen(true)}
          >
            ROI Calculator
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => handleExport('pdf')}
          >
            Export
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={kpi.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {kpi.name}
                  </Typography>
                  {getTrendIcon(kpi.trend)}
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {kpi.value}{kpi.unit}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(kpi.value / kpi.target) * 100}
                    color={getStatusColor(kpi.status)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Target: {kpi.target}{kpi.unit} • {kpi.value > kpi.previousValue ? '+' : ''}{kpi.value - kpi.previousValue}{kpi.unit}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
          <Tab label="Overview" icon={<Timeline />} iconPosition="start" />
          <Tab label="Team Analytics" icon={<Group />} iconPosition="start" />
          <Tab label="Performance Metrics" icon={<Assignment />} iconPosition="start" />
          <Tab label="Insights" icon={<Psychology />} iconPosition="start" />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {/* Transformation Trends */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Transformation Metrics Trend
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={transformationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="employeeEngagement" stackId="1" stroke="#8884d8" fill="#8884d8" name="Engagement" />
                    <Area type="monotone" dataKey="skillDevelopment" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Skills" />
                    <Area type="monotone" dataKey="goalCompletion" stackId="1" stroke="#ffc658" fill="#ffc658" name="Goals" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Organizational Health Radar */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Organizational Health
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Current" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Coaching Utilization */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Coaching Utilization by Month
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={transformationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="coachingUtilization" fill="#8884d8" name="Utilization %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Leadership Growth */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Leadership Development Progress
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={transformationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="leadershipGrowth" stroke="#82ca9d" strokeWidth={3} name="Leadership Score" />
                    <Line type="monotone" dataKey="culturalAlignment" stroke="#ffc658" strokeWidth={3} name="Culture Score" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedTab === 1 && (
        <Grid container spacing={3}>
          {/* Team Performance Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Performance Overview
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Team</TableCell>
                        <TableCell align="right">Members</TableCell>
                        <TableCell align="right">Active Sessions</TableCell>
                        <TableCell align="right">Completed Goals</TableCell>
                        <TableCell align="right">Engagement</TableCell>
                        <TableCell align="right">Performance</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teamMetrics.map((team) => (
                        <TableRow key={team.teamId} hover>
                          <TableCell>
                            <Typography fontWeight="bold">{team.teamName}</Typography>
                          </TableCell>
                          <TableCell align="right">{team.memberCount}</TableCell>
                          <TableCell align="right">{team.activeCoachingSessions}</TableCell>
                          <TableCell align="right">{team.completedGoals}%</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                              {team.averageEngagement}%
                              <LinearProgress
                                variant="determinate"
                                value={team.averageEngagement}
                                sx={{ width: 50, height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="right">{team.performance}%</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={team.performance >= 90 ? 'Excellent' : team.performance >= 80 ? 'Good' : 'Needs Attention'}
                              color={team.performance >= 90 ? 'success' : team.performance >= 80 ? 'primary' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Team Comparison Chart */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Performance Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={teamMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="teamName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="averageEngagement" fill="#8884d8" name="Engagement %" />
                    <Bar dataKey="completedGoals" fill="#82ca9d" name="Goal Completion %" />
                    <Bar dataKey="performance" fill="#ffc658" name="Performance %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedTab === 2 && (
        <Grid container spacing={3}>
          {/* Performance Metrics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Key Performance Indicators
                </Typography>
                {kpis.map((kpi) => (
                  <Box key={kpi.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{kpi.name}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {kpi.value}{kpi.unit} / {kpi.target}{kpi.unit}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(kpi.value / kpi.target) * 100}
                      color={getStatusColor(kpi.status)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly Progress */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Progress
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={transformationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="employeeEngagement" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="goalCompletion" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="skillDevelopment" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedTab === 3 && (
        <Grid container spacing={3}>
          {/* Insights and Recommendations */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" />
                  Strengths
                </Typography>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Employee engagement has increased by 5% this month, exceeding industry benchmarks.
                </Alert>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Customer Success team shows exceptional performance with 91% engagement rate.
                </Alert>
                <Alert severity="success">
                  Coaching utilization has grown by 15% compared to last quarter.
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning color="warning" />
                  Areas for Improvement
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Goal completion rate has decreased by 5%. Consider reviewing goal-setting processes.
                </Alert>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Leadership development score is below target. Recommend additional training programs.
                </Alert>
                <Alert severity="info">
                  Sales team engagement (82%) is lower than average. Schedule focus group sessions.
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          {/* AI-Powered Recommendations */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology color="primary" />
                  AI-Powered Recommendations
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Boost Goal Completion
                      </Typography>
                      <Typography variant="body2">
                        Implement bi-weekly check-ins for teams with completion rates below 75%. Expected impact: +12% improvement.
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Enhance Coaching Programs
                      </Typography>
                      <Typography variant="body2">
                        Expand peer coaching initiatives in high-performing teams. Predicted ROI: 185% within 6 months.
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Leadership Pipeline
                      </Typography>
                      <Typography variant="body2">
                        Identify and fast-track 15-20 high-potential individuals for leadership roles based on engagement scores.
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ROI Calculator Dialog */}
      <Dialog open={roiDialogOpen} onClose={() => setRoiDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>ROI Calculator</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Total Investment"
                type="number"
                value={roiData.investment}
                onChange={(e) => setRoiData({ ...roiData, investment: Number(e.target.value) })}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Productivity Gains"
                type="number"
                value={roiData.benefits.productivityGains}
                onChange={(e) => setRoiData({
                  ...roiData,
                  benefits: { ...roiData.benefits, productivityGains: Number(e.target.value) }
                })}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Retention Savings"
                type="number"
                value={roiData.benefits.retentionSavings}
                onChange={(e) => setRoiData({
                  ...roiData,
                  benefits: { ...roiData.benefits, retentionSavings: Number(e.target.value) }
                })}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Time Efficiency"
                type="number"
                value={roiData.benefits.timeEfficiency}
                onChange={(e) => setRoiData({
                  ...roiData,
                  benefits: { ...roiData.benefits, timeEfficiency: Number(e.target.value) }
                })}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quality Improvement"
                type="number"
                value={roiData.benefits.qualityImprovement}
                onChange={(e) => setRoiData({
                  ...roiData,
                  benefits: { ...roiData.benefits, qualityImprovement: Number(e.target.value) }
                })}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" fullWidth onClick={calculateROI}>
                Calculate ROI
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2">Total Benefits</Typography>
                      <Typography variant="h5" fontWeight="bold">
                        ${roiData.totalBenefits.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2">ROI</Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {roiData.roi.toFixed(1)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2">Payback Period</Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {roiData.paybackPeriod.toFixed(1)} months
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Benefit Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: $${entry.value.toLocaleString()}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoiDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => handleExport('pdf')}>
            Export Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrganizationalTransformationDashboard;
