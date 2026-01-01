import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  CircularProgress,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
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
  ComposedChart,
} from 'recharts';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { format, formatDistanceToNow } from 'date-fns';
import useSWR from 'swr';

interface ScalingPolicy {
  id: string;
  name: string;
  serviceId: string;
  type: 'horizontal' | 'vertical' | 'predictive' | 'database' | 'queue';
  enabled: boolean;
  priority: number;
  conditions: ScalingCondition[];
  actions: ScalingAction[];
  cooldownMinutes: number;
  lastExecuted?: string;
  createdAt: string;
  updatedAt: string;
}

interface ScalingCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==';
  threshold: number;
  durationMinutes: number;
}

interface ScalingAction {
  type: 'scale_up' | 'scale_down' | 'scale_to' | 'adjust_resources';
  value: number;
  unit: 'percent' | 'absolute' | 'cpu' | 'memory';
  maxInstances?: number;
  minInstances?: number;
}

interface CapacityMetrics {
  serviceId: string;
  currentReplicas: number;
  desiredReplicas: number;
  maxReplicas: number;
  minReplicas: number;
  cpuUtilization: number;
  memoryUtilization: number;
  onDemandInstances: number;
  spotInstances: number;
  reservedInstances: number;
}

interface ScalingEvent {
  id: string;
  timestamp: string;
  serviceId: string;
  type: 'scale_up' | 'scale_down' | 'vertical_scale' | 'database_scale';
  reason: string;
  previousValue: number;
  newValue: number;
  userId?: string;
  automatic: boolean;
  costImpact: number;
}

interface TrafficPrediction {
  timestamp: string;
  predictedRPS: number;
  confidence: number;
  recommendedReplicas: number;
  upperBound: number;
  lowerBound: number;
}

interface CostMetrics {
  currentMonthlyCost: number;
  previousMonthlyCost: number;
  savingsPercent: number;
  spotSavingsPercent: number;
  costPerRequest: number;
  costPerUser: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const COLORS = {
  primary: '#1976d2',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  onDemand: '#3f51b5',
  spot: '#4caf50',
  reserved: '#ff9800',
};

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AutoScalingDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedService, setSelectedService] = useState('api-service');
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [manualScaleDialogOpen, setManualScaleDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<ScalingPolicy | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  const { data: policies, mutate: mutatePolicies } = useSWR<ScalingPolicy[]>(
    '/api/scaling/policies',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: capacity } = useSWR<CapacityMetrics[]>(
    '/api/scaling/capacity',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: events } = useSWR<ScalingEvent[]>(
    `/api/scaling/events?timeRange=${timeRange}`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: predictions } = useSWR<TrafficPrediction[]>(
    '/api/scaling/predictions',
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: costMetrics } = useSWR<CostMetrics>(
    '/api/scaling/cost-metrics',
    fetcher,
    { refreshInterval: 60000 }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleOpenPolicyDialog = (policy?: ScalingPolicy) => {
    setEditingPolicy(policy || null);
    setPolicyDialogOpen(true);
  };

  const handleClosePolicyDialog = () => {
    setPolicyDialogOpen(false);
    setEditingPolicy(null);
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      await fetch(`/api/scaling/policies/${policyId}`, { method: 'DELETE' });
      mutatePolicies();
    } catch (error) {
      console.error('Failed to delete policy', error);
    }
  };

  const handleTogglePolicy = async (policyId: string, enabled: boolean) => {
    try {
      await fetch(`/api/scaling/policies/${policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      mutatePolicies();
    } catch (error) {
      console.error('Failed to toggle policy', error);
    }
  };

  const handleManualScale = async (replicas: number) => {
    try {
      await fetch('/api/scaling/manual-scale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: selectedService, replicas }),
      });
      setManualScaleDialogOpen(false);
    } catch (error) {
      console.error('Failed to manually scale', error);
    }
  };

  const selectedCapacity = capacity?.find(c => c.serviceId === selectedService);

  const resourceUtilizationData = useMemo(() => {
    if (!capacity) return [];

    return capacity.map(c => ({
      service: c.serviceId,
      cpu: c.cpuUtilization,
      memory: c.memoryUtilization,
      replicas: c.currentReplicas,
    }));
  }, [capacity]);

  const instanceTypeData = useMemo(() => {
    if (!selectedCapacity) return [];

    return [
      { name: 'On-Demand', value: selectedCapacity.onDemandInstances, color: COLORS.onDemand },
      { name: 'Spot', value: selectedCapacity.spotInstances, color: COLORS.spot },
      { name: 'Reserved', value: selectedCapacity.reservedInstances, color: COLORS.reserved },
    ];
  }, [selectedCapacity]);

  const scalingActivityData = useMemo(() => {
    if (!events) return [];

    const hourlyActivity = new Map<string, { scaleUp: number; scaleDown: number }>();

    events.forEach(event => {
      const hour = format(new Date(event.timestamp), 'HH:00');
      const activity = hourlyActivity.get(hour) || { scaleUp: 0, scaleDown: 0 };

      if (event.type === 'scale_up') {
        activity.scaleUp++;
      } else if (event.type === 'scale_down') {
        activity.scaleDown++;
      }

      hourlyActivity.set(hour, activity);
    });

    return Array.from(hourlyActivity.entries())
      .map(([hour, activity]) => ({
        hour,
        scaleUp: activity.scaleUp,
        scaleDown: activity.scaleDown,
      }))
      .slice(-24);
  }, [events]);

  const predictionChartData = useMemo(() => {
    if (!predictions) return [];

    return predictions.map(p => ({
      time: format(new Date(p.timestamp), 'HH:mm'),
      predicted: p.predictedRPS,
      upper: p.upperBound,
      lower: p.lowerBound,
      confidence: p.confidence * 100,
    }));
  }, [predictions]);

  const costTrendData = useMemo(() => {
    if (!events) return [];

    const dailyCost = new Map<string, number>();

    events.forEach(event => {
      const date = format(new Date(event.timestamp), 'MM/dd');
      const cost = dailyCost.get(date) || 0;
      dailyCost.set(date, cost + event.costImpact);
    });

    return Array.from(dailyCost.entries())
      .map(([date, cost]) => ({
        date,
        cost: Math.abs(cost),
      }))
      .slice(-30);
  }, [events]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Auto-Scaling Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Service</InputLabel>
            <Select
              value={selectedService}
              label="Service"
              onChange={(e) => setSelectedService(e.target.value)}
            >
              <MenuItem value="api-service">API Service</MenuItem>
              <MenuItem value="worker-service">Worker Service</MenuItem>
              <MenuItem value="notification-service">Notification Service</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              mutatePolicies();
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
            onClick={() => setManualScaleDialogOpen(true)}
          >
            Manual Scale
          </Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Policies" />
        <Tab label="Metrics" />
        <Tab label="History" />
        <Tab label="Predictions" />
      </Tabs>

      {activeTab === 0 && (
        <OverviewTab
          capacity={selectedCapacity}
          costMetrics={costMetrics}
          events={events}
          instanceTypeData={instanceTypeData}
          scalingActivityData={scalingActivityData}
        />
      )}

      {activeTab === 1 && (
        <PoliciesTab
          policies={policies || []}
          onOpenDialog={handleOpenPolicyDialog}
          onDeletePolicy={handleDeletePolicy}
          onTogglePolicy={handleTogglePolicy}
        />
      )}

      {activeTab === 2 && (
        <MetricsTab
          capacity={capacity || []}
          resourceUtilizationData={resourceUtilizationData}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      )}

      {activeTab === 3 && (
        <HistoryTab
          events={events || []}
          costTrendData={costTrendData}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      )}

      {activeTab === 4 && (
        <PredictionsTab
          predictions={predictions || []}
          predictionChartData={predictionChartData}
        />
      )}

      <PolicyDialog
        open={policyDialogOpen}
        policy={editingPolicy}
        onClose={handleClosePolicyDialog}
        onSave={mutatePolicies}
      />

      <ManualScaleDialog
        open={manualScaleDialogOpen}
        capacity={selectedCapacity}
        onClose={() => setManualScaleDialogOpen(false)}
        onScale={handleManualScale}
      />
    </Box>
  );
}

interface OverviewTabProps {
  capacity?: CapacityMetrics;
  costMetrics?: CostMetrics;
  events?: ScalingEvent[];
  instanceTypeData: Array<{ name: string; value: number; color: string }>;
  scalingActivityData: Array<{ hour: string; scaleUp: number; scaleDown: number }>;
}

function OverviewTab({
  capacity,
  costMetrics,
  events,
  instanceTypeData,
  scalingActivityData,
}: OverviewTabProps) {
  const recentEvents = events?.slice(-10) || [];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Current Capacity
            </Typography>
            <Typography variant="h3" component="div">
              {capacity?.currentReplicas || 0}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Desired: {capacity?.desiredReplicas || 0}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(capacity?.currentReplicas || 0) / (capacity?.maxReplicas || 1) * 100}
              sx={{ mt: 2 }}
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
              Max: {capacity?.maxReplicas || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              CPU Utilization
            </Typography>
            <Typography variant="h3" component="div">
              {capacity?.cpuUtilization.toFixed(1) || 0}%
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {(capacity?.cpuUtilization || 0) > 70 ? (
                <Chip
                  label="High"
                  color="warning"
                  size="small"
                  icon={<WarningIcon />}
                />
              ) : (
                <Chip
                  label="Normal"
                  color="success"
                  size="small"
                  icon={<CheckCircleIcon />}
                />
              )}
            </Box>
            <LinearProgress
              variant="determinate"
              value={capacity?.cpuUtilization || 0}
              color={(capacity?.cpuUtilization || 0) > 70 ? 'warning' : 'primary'}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Memory Utilization
            </Typography>
            <Typography variant="h3" component="div">
              {capacity?.memoryUtilization.toFixed(1) || 0}%
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {(capacity?.memoryUtilization || 0) > 80 ? (
                <Chip
                  label="High"
                  color="error"
                  size="small"
                  icon={<WarningIcon />}
                />
              ) : (
                <Chip
                  label="Normal"
                  color="success"
                  size="small"
                  icon={<CheckCircleIcon />}
                />
              )}
            </Box>
            <LinearProgress
              variant="determinate"
              value={capacity?.memoryUtilization || 0}
              color={(capacity?.memoryUtilization || 0) > 80 ? 'error' : 'primary'}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Monthly Cost
            </Typography>
            <Typography variant="h3" component="div">
              ${costMetrics?.currentMonthlyCost.toLocaleString() || 0}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
              <TrendingDownIcon color="success" fontSize="small" />
              <Typography variant="body2" color="success.main">
                {costMetrics?.savingsPercent.toFixed(0) || 0}% savings
              </Typography>
            </Box>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Previous: ${costMetrics?.previousMonthlyCost.toLocaleString() || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Scaling Activity (Last 24 Hours)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scalingActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="scaleUp" fill={COLORS.success} name="Scale Up" />
                <Bar dataKey="scaleDown" fill={COLORS.warning} name="Scale Down" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Instance Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={instanceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {instanceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Scaling Events
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell align="right">Change</TableCell>
                    <TableCell align="right">Cost Impact</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </TableCell>
                      <TableCell>{event.serviceId}</TableCell>
                      <TableCell>
                        <Chip
                          label={event.type.replace('_', ' ')}
                          size="small"
                          color={event.type.includes('up') ? 'success' : 'warning'}
                          icon={event.type.includes('up') ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        />
                      </TableCell>
                      <TableCell>{event.reason}</TableCell>
                      <TableCell align="right">
                        {event.previousValue} → {event.newValue}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          color={event.costImpact > 0 ? 'error' : 'success'}
                          variant="body2"
                        >
                          ${Math.abs(event.costImpact).toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cost Savings Breakdown
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Auto-Scaling Savings</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {costMetrics?.savingsPercent.toFixed(0) || 0}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={costMetrics?.savingsPercent || 0}
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Spot Instance Savings</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {costMetrics?.spotSavingsPercent.toFixed(0) || 0}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={costMetrics?.spotSavingsPercent || 0}
                color="success"
                sx={{ mb: 3 }}
              />

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Cost per Request</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${costMetrics?.costPerRequest.toFixed(4) || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2">Cost per User</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${costMetrics?.costPerUser.toFixed(2) || 0}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Optimization Recommendations
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Consider purchasing 5x t3.large reserved instances for 1 year to save an additional $2,400/year
              </Alert>
              <Alert severity="success" sx={{ mb: 2 }}>
                Spot instance usage is optimal at 70% - maintaining good balance
              </Alert>
              <Alert severity="warning">
                3 idle volumes detected - snapshot and delete to save $30/month
              </Alert>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

interface PoliciesTabProps {
  policies: ScalingPolicy[];
  onOpenDialog: (policy?: ScalingPolicy) => void;
  onDeletePolicy: (policyId: string) => void;
  onTogglePolicy: (policyId: string, enabled: boolean) => void;
}

function PoliciesTab({ policies, onOpenDialog, onDeletePolicy, onTogglePolicy }: PoliciesTabProps) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Scaling Policies</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => onOpenDialog()}
        >
          Create Policy
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Conditions</TableCell>
              <TableCell>Cooldown</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Executed</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy.id}>
                <TableCell>{policy.name}</TableCell>
                <TableCell>{policy.serviceId}</TableCell>
                <TableCell>
                  <Chip label={policy.type} size="small" />
                </TableCell>
                <TableCell>{policy.priority}</TableCell>
                <TableCell>
                  {policy.conditions.map((c, i) => (
                    <Typography key={i} variant="caption" display="block">
                      {c.metric} {c.operator} {c.threshold}
                    </Typography>
                  ))}
                </TableCell>
                <TableCell>{policy.cooldownMinutes} min</TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={policy.enabled}
                        onChange={(e) => onTogglePolicy(policy.id, e.target.checked)}
                        size="small"
                      />
                    }
                    label={policy.enabled ? 'Enabled' : 'Disabled'}
                  />
                </TableCell>
                <TableCell>
                  {policy.lastExecuted
                    ? formatDistanceToNow(new Date(policy.lastExecuted), { addSuffix: true })
                    : 'Never'}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => onOpenDialog(policy)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onDeletePolicy(policy.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

interface MetricsTabProps {
  capacity: CapacityMetrics[];
  resourceUtilizationData: Array<{
    service: string;
    cpu: number;
    memory: number;
    replicas: number;
  }>;
  timeRange: string;
  onTimeRangeChange: (range: '1h' | '6h' | '24h' | '7d') => void;
}

function MetricsTab({ capacity, resourceUtilizationData, timeRange, onTimeRangeChange }: MetricsTabProps) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Resource Utilization</Typography>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(e, value) => value && onTimeRangeChange(value)}
          size="small"
        >
          <ToggleButton value="1h">1H</ToggleButton>
          <ToggleButton value="6h">6H</ToggleButton>
          <ToggleButton value="24h">24H</ToggleButton>
          <ToggleButton value="7d">7D</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                CPU & Memory Utilization by Service
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={resourceUtilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service" />
                  <YAxis yAxisId="left" label={{ value: 'Utilization (%)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Replicas', angle: 90, position: 'insideRight' }} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="cpu" fill={COLORS.primary} name="CPU %" />
                  <Bar yAxisId="left" dataKey="memory" fill={COLORS.warning} name="Memory %" />
                  <Line yAxisId="right" type="monotone" dataKey="replicas" stroke={COLORS.success} name="Replicas" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {capacity.map((service) => (
          <Grid item xs={12} md={4} key={service.serviceId}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {service.serviceId}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">CPU</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {service.cpuUtilization.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={service.cpuUtilization}
                    color={service.cpuUtilization > 70 ? 'warning' : 'primary'}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Memory</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {service.memoryUtilization.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={service.memoryUtilization}
                    color={service.memoryUtilization > 80 ? 'error' : 'primary'}
                    sx={{ mb: 2 }}
                  />

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Replicas</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {service.currentReplicas} / {service.maxReplicas}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

interface HistoryTabProps {
  events: ScalingEvent[];
  costTrendData: Array<{ date: string; cost: number }>;
  timeRange: string;
  onTimeRangeChange: (range: '1h' | '6h' | '24h' | '7d') => void;
}

function HistoryTab({ events, costTrendData, timeRange, onTimeRangeChange }: HistoryTabProps) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Scaling History</Typography>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(e, value) => value && onTimeRangeChange(value)}
          size="small"
        >
          <ToggleButton value="1h">1H</ToggleButton>
          <ToggleButton value="6h">6H</ToggleButton>
          <ToggleButton value="24h">24H</ToggleButton>
          <ToggleButton value="7d">7D</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cost Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={costTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="cost" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Event Timeline
              </Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {events.slice(0, 20).map((event, index) => (
                  <Box
                    key={event.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      mb: 2,
                      pb: 2,
                      borderBottom: index < events.length - 1 ? '1px solid #eee' : 'none',
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: event.type.includes('up') ? COLORS.success : COLORS.warning,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        flexShrink: 0,
                      }}
                    >
                      {event.type.includes('up') ? (
                        <TrendingUpIcon sx={{ color: 'white' }} />
                      ) : (
                        <TrendingDownIcon sx={{ color: 'white' }} />
                      )}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {event.type.replace('_', ' ')}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {event.reason}
                      </Typography>
                      <Typography variant="caption" display="block" color="textSecondary">
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2">
                        {event.previousValue} → {event.newValue}
                      </Typography>
                      <Typography variant="caption" color={event.costImpact > 0 ? 'error' : 'success'}>
                        ${Math.abs(event.costImpact).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                All Events
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell align="right">Change</TableCell>
                      <TableCell align="right">Cost Impact</TableCell>
                      <TableCell>Source</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          {format(new Date(event.timestamp), 'MMM dd, HH:mm:ss')}
                        </TableCell>
                        <TableCell>{event.serviceId}</TableCell>
                        <TableCell>
                          <Chip
                            label={event.type.replace('_', ' ')}
                            size="small"
                            color={event.type.includes('up') ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>{event.reason}</TableCell>
                        <TableCell align="right">
                          {event.previousValue} → {event.newValue}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            color={event.costImpact > 0 ? 'error' : 'success'}
                            variant="body2"
                          >
                            ${Math.abs(event.costImpact).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.automatic ? 'Auto' : 'Manual'}
                            size="small"
                            variant="outlined"
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
      </Grid>
    </Box>
  );
}

interface PredictionsTabProps {
  predictions: TrafficPrediction[];
  predictionChartData: Array<{
    time: string;
    predicted: number;
    upper: number;
    lower: number;
    confidence: number;
  }>;
}

function PredictionsTab({ predictions, predictionChartData }: PredictionsTabProps) {
  const avgConfidence = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    : 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Traffic Predictions & Recommendations
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                24-Hour Traffic Prediction
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={predictionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" label={{ value: 'RPS', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Confidence %', angle: 90, position: 'insideRight' }} />
                  <RechartsTooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="upper"
                    stroke={COLORS.info}
                    fill={COLORS.info}
                    fillOpacity={0.1}
                    name="Upper Bound"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="predicted"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.3}
                    name="Predicted RPS"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="lower"
                    stroke={COLORS.warning}
                    fill={COLORS.warning}
                    fillOpacity={0.1}
                    name="Lower Bound"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="confidence"
                    stroke={COLORS.success}
                    name="Confidence %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Prediction Accuracy
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={avgConfidence * 100}
                    size={120}
                    thickness={5}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h4" component="div" color="text.secondary">
                      {(avgConfidence * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary" align="center">
                Average prediction confidence
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recommended Scaling Schedule
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Predicted RPS</TableCell>
                      <TableCell>Confidence</TableCell>
                      <TableCell>Recommended Replicas</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {predictions.slice(0, 10).map((prediction, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {format(new Date(prediction.timestamp), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell>{prediction.predictedRPS.toFixed(0)}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${(prediction.confidence * 100).toFixed(0)}%`}
                            size="small"
                            color={prediction.confidence > 0.8 ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>{prediction.recommendedReplicas}</TableCell>
                        <TableCell>
                          <Chip
                            label="Pre-scale"
                            size="small"
                            icon={<ScheduleIcon />}
                            variant="outlined"
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
      </Grid>
    </Box>
  );
}

interface PolicyDialogProps {
  open: boolean;
  policy: ScalingPolicy | null;
  onClose: () => void;
  onSave: () => void;
}

function PolicyDialog({ open, policy, onClose, onSave }: PolicyDialogProps) {
  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    serviceId: Yup.string().required('Service is required'),
    type: Yup.string().required('Type is required'),
    priority: Yup.number().min(1).required('Priority is required'),
    cooldownMinutes: Yup.number().min(1).required('Cooldown is required'),
  });

  const formik = useFormik({
    initialValues: {
      name: policy?.name || '',
      serviceId: policy?.serviceId || 'api-service',
      type: policy?.type || 'horizontal',
      priority: policy?.priority || 1,
      cooldownMinutes: policy?.cooldownMinutes || 5,
      enabled: policy?.enabled ?? true,
      metric: 'cpu_utilization',
      operator: '>',
      threshold: 70,
      durationMinutes: 2,
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const method = policy ? 'PATCH' : 'POST';
        const url = policy ? `/api/scaling/policies/${policy.id}` : '/api/scaling/policies';

        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: values.name,
            serviceId: values.serviceId,
            type: values.type,
            priority: values.priority,
            cooldownMinutes: values.cooldownMinutes,
            enabled: values.enabled,
            conditions: [
              {
                metric: values.metric,
                operator: values.operator,
                threshold: values.threshold,
                durationMinutes: values.durationMinutes,
              },
            ],
            actions: [
              {
                type: 'scale_up',
                value: 100,
                unit: 'percent',
                maxInstances: 100,
                minInstances: 3,
              },
            ],
          }),
        });

        onSave();
        onClose();
      } catch (error) {
        console.error('Failed to save policy', error);
      }
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>
          {policy ? 'Edit Scaling Policy' : 'Create Scaling Policy'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Policy Name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Service</InputLabel>
                <Select
                  name="serviceId"
                  value={formik.values.serviceId}
                  onChange={formik.handleChange}
                  label="Service"
                >
                  <MenuItem value="api-service">API Service</MenuItem>
                  <MenuItem value="worker-service">Worker Service</MenuItem>
                  <MenuItem value="notification-service">Notification Service</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={formik.values.type}
                  onChange={formik.handleChange}
                  label="Type"
                >
                  <MenuItem value="horizontal">Horizontal</MenuItem>
                  <MenuItem value="vertical">Vertical</MenuItem>
                  <MenuItem value="predictive">Predictive</MenuItem>
                  <MenuItem value="database">Database</MenuItem>
                  <MenuItem value="queue">Queue</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Priority"
                name="priority"
                value={formik.values.priority}
                onChange={formik.handleChange}
                error={formik.touched.priority && Boolean(formik.errors.priority)}
                helperText={formik.touched.priority && formik.errors.priority}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Cooldown (minutes)"
                name="cooldownMinutes"
                value={formik.values.cooldownMinutes}
                onChange={formik.handleChange}
                error={formik.touched.cooldownMinutes && Boolean(formik.errors.cooldownMinutes)}
                helperText={formik.touched.cooldownMinutes && formik.errors.cooldownMinutes}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Condition
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Metric</InputLabel>
                <Select
                  name="metric"
                  value={formik.values.metric}
                  onChange={formik.handleChange}
                  label="Metric"
                >
                  <MenuItem value="cpu_utilization">CPU Utilization</MenuItem>
                  <MenuItem value="memory_utilization">Memory Utilization</MenuItem>
                  <MenuItem value="requests_per_second">Requests/Second</MenuItem>
                  <MenuItem value="response_time">Response Time</MenuItem>
                  <MenuItem value="queue_depth">Queue Depth</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Operator</InputLabel>
                <Select
                  name="operator"
                  value={formik.values.operator}
                  onChange={formik.handleChange}
                  label="Operator"
                >
                  <MenuItem value=">">&gt;</MenuItem>
                  <MenuItem value="<">&lt;</MenuItem>
                  <MenuItem value=">=">&gt;=</MenuItem>
                  <MenuItem value="<=">&lt;=</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Threshold"
                name="threshold"
                value={formik.values.threshold}
                onChange={formik.handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Duration (min)"
                name="durationMinutes"
                value={formik.values.durationMinutes}
                onChange={formik.handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="enabled"
                    checked={formik.values.enabled}
                    onChange={formik.handleChange}
                  />
                }
                label="Enabled"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {policy ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

interface ManualScaleDialogProps {
  open: boolean;
  capacity?: CapacityMetrics;
  onClose: () => void;
  onScale: (replicas: number) => void;
}

function ManualScaleDialog({ open, capacity, onClose, onScale }: ManualScaleDialogProps) {
  const [replicas, setReplicas] = useState(capacity?.currentReplicas || 3);

  useEffect(() => {
    if (capacity) {
      setReplicas(capacity.currentReplicas);
    }
  }, [capacity]);

  const handleScale = () => {
    onScale(replicas);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manual Scaling</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>
            Current Replicas: {capacity?.currentReplicas || 0}
          </Typography>
          <Typography gutterBottom color="textSecondary" variant="body2">
            Min: {capacity?.minReplicas || 3} | Max: {capacity?.maxReplicas || 100}
          </Typography>

          <Box sx={{ mt: 3, px: 2 }}>
            <Typography gutterBottom>
              Desired Replicas: {replicas}
            </Typography>
            <Slider
              value={replicas}
              onChange={(e, value) => setReplicas(value as number)}
              min={capacity?.minReplicas || 3}
              max={capacity?.maxReplicas || 100}
              marks
              valueLabelDisplay="auto"
            />
          </Box>

          <Alert severity="warning" sx={{ mt: 3 }}>
            Manual scaling will override auto-scaling policies temporarily. Auto-scaling will resume
            after the next policy evaluation.
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleScale} variant="contained">
          Scale
        </Button>
      </DialogActions>
    </Dialog>
  );
}
