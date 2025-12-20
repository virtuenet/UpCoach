import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Badge,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Activity,
  Users,
  MessageSquare,
  Shield,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Radio,
  Bell,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { format } from 'date-fns';

// Types
interface EngagementMetrics {
  activeUsers: number;
  activeSessions: number;
  avgSessionDuration: number;
  peakConcurrentUsers: number;
  messagesSent: number;
  aiResponsesGenerated: number;
  goalsInProgress: number;
  habitsTrackedToday: number;
  churnRiskUsers: number;
  engagementScore: number;
}

interface SafetyStats {
  totalChecks: number;
  detectionsByCategory: Record<string, number>;
  detectionsBySeverity: Record<string, number>;
  actionsTaken: Record<string, number>;
  falsePositiveRate: number;
  averageProcessingTimeMs: number;
  activeEscalations: number;
}

interface StreamStats {
  totalStreamsCreated: number;
  activeStreams: number;
  totalTokensStreamed: number;
  averageLatencyToFirstToken: number;
  streamsByProvider: Record<string, number>;
  streamsByStatus: Record<string, number>;
}

interface PredictionStats {
  totalPredictions: number;
  cacheHitRate: number;
  averageLatencyMs: number;
  modelsCached: number;
  p95LatencyMs: number;
  predictionsByType: Record<string, number>;
}

interface ChurnAlert {
  id: string;
  userId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  signals: string[];
  detectedAt: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

interface SafetyDetection {
  id: string;
  userId: string;
  category: string;
  severity: string;
  content: string;
  detectedAt: number;
  reviewed: boolean;
  action: string;
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  loading = false,
  subtitle,
}) => {
  const isPositive = change !== undefined && change >= 0;
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
            {change !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                <TrendIcon size={16} color={isPositive ? '#10b981' : '#ef4444'} />
                <Typography
                  variant="body2"
                  color={isPositive ? 'success.main' : 'error.main'}
                  ml={0.5}
                >
                  {Math.abs(change)}% vs last hour
                </Typography>
              </Box>
            )}
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
      </CardContent>
    </Card>
  );
};

// Main Component
export default function RealtimeDashboard() {
  const [currentTab, setCurrentTab] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [selectedDetection, setSelectedDetection] = useState<SafetyDetection | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const queryClient = useQueryClient();

  // Fetch engagement metrics
  const { data: engagementMetrics, isLoading: engagementLoading } = useQuery<EngagementMetrics>({
    queryKey: ['realtime-engagement'],
    queryFn: async () => {
      const response = await apiClient.get('/api/realtime/engagement/metrics');
      return response.data.data;
    },
    refetchInterval: refreshInterval,
  });

  // Fetch safety stats
  const { data: safetyStats, isLoading: safetyLoading } = useQuery<SafetyStats>({
    queryKey: ['realtime-safety-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/realtime/safety/stats');
      return response.data.data;
    },
    refetchInterval: refreshInterval,
  });

  // Fetch streaming stats
  const { data: streamStats, isLoading: streamLoading } = useQuery<StreamStats>({
    queryKey: ['realtime-stream-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/realtime/stream/stats');
      return response.data.data;
    },
    refetchInterval: refreshInterval,
  });

  // Fetch prediction stats
  const { data: predictionStats, isLoading: predictionLoading } = useQuery<PredictionStats>({
    queryKey: ['realtime-prediction-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/realtime/predictions/stats');
      return response.data.data;
    },
    refetchInterval: refreshInterval,
  });

  // Fetch churn alerts
  const { data: churnAlerts = [] } = useQuery<ChurnAlert[]>({
    queryKey: ['realtime-churn-alerts'],
    queryFn: async () => {
      const response = await apiClient.get('/api/realtime/engagement/churn-alerts');
      return response.data.data || [];
    },
    refetchInterval: refreshInterval,
  });

  // Fetch safety detections
  const { data: safetyDetections = [] } = useQuery<SafetyDetection[]>({
    queryKey: ['realtime-safety-detections'],
    queryFn: async () => {
      const response = await apiClient.get('/api/realtime/safety/detections?reviewed=false');
      return response.data.data || [];
    },
    refetchInterval: refreshInterval,
  });

  // Acknowledge churn alert mutation
  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      await apiClient.post(`/api/realtime/engagement/churn-alerts/${alertId}/acknowledge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realtime-churn-alerts'] });
    },
  });

  // Review detection mutation
  const reviewDetection = useMutation({
    mutationFn: async ({
      detectionId,
      outcome,
      notes,
    }: {
      detectionId: string;
      outcome: string;
      notes: string;
    }) => {
      await apiClient.post(`/api/realtime/safety/detections/${detectionId}/review`, {
        outcome,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realtime-safety-detections'] });
      setReviewDialogOpen(false);
      setSelectedDetection(null);
      setReviewNotes('');
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['realtime-engagement'] });
    queryClient.invalidateQueries({ queryKey: ['realtime-safety-stats'] });
    queryClient.invalidateQueries({ queryKey: ['realtime-stream-stats'] });
    queryClient.invalidateQueries({ queryKey: ['realtime-prediction-stats'] });
  };

  const handleReviewDetection = (detection: SafetyDetection) => {
    setSelectedDetection(detection);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = (outcome: string) => {
    if (selectedDetection) {
      reviewDetection.mutate({
        detectionId: selectedDetection.id,
        outcome,
        notes: reviewNotes,
      });
    }
  };

  // Colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const severityColors: Record<string, string> = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Radio size={24} color="#3b82f6" />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Real-time Dashboard
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Live monitoring of AI, engagement, and safety systems
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={2} alignItems="center">
          <Chip
            icon={<Activity size={14} />}
            label="Live"
            color="success"
            size="small"
            sx={{ animation: 'pulse 2s infinite' }}
          />
          <Badge badgeContent={safetyDetections.length} color="error">
            <Tooltip title="Unreviewed Safety Detections">
              <IconButton size="small">
                <Shield size={20} />
              </IconButton>
            </Tooltip>
          </Badge>
          <Badge badgeContent={churnAlerts.filter(a => !a.acknowledged).length} color="warning">
            <Tooltip title="Active Churn Alerts">
              <IconButton size="small">
                <Bell size={20} />
              </IconButton>
            </Tooltip>
          </Badge>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh}>
              <RefreshCw size={20} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={3}>
        {/* @ts-ignore */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Users"
            value={engagementMetrics?.activeUsers || 0}
            icon={Users}
            color="#3b82f6"
            loading={engagementLoading}
            subtitle={`Peak: ${engagementMetrics?.peakConcurrentUsers || 0}`}
          />
        </Grid>
        {/* @ts-ignore */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Streams"
            value={streamStats?.activeStreams || 0}
            icon={MessageSquare}
            color="#10b981"
            loading={streamLoading}
            subtitle={`${streamStats?.totalTokensStreamed?.toLocaleString() || 0} tokens streamed`}
          />
        </Grid>
        {/* @ts-ignore */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Prediction Latency"
            value={`${predictionStats?.averageLatencyMs || 0}ms`}
            icon={Zap}
            color="#f59e0b"
            loading={predictionLoading}
            subtitle={`Cache hit: ${((predictionStats?.cacheHitRate || 0) * 100).toFixed(1)}%`}
          />
        </Grid>
        {/* @ts-ignore */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Safety Checks"
            value={safetyStats?.totalChecks || 0}
            icon={Shield}
            color="#8b5cf6"
            loading={safetyLoading}
            subtitle={`${safetyStats?.activeEscalations || 0} active escalations`}
          />
        </Grid>
      </Grid>

      {/* Tabs for different sections */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Engagement" icon={<Users size={16} />} iconPosition="start" />
          <Tab label="AI Streaming" icon={<MessageSquare size={16} />} iconPosition="start" />
          <Tab
            label={
              <Badge badgeContent={safetyDetections.length} color="error">
                Safety
              </Badge>
            }
            icon={<Shield size={16} />}
            iconPosition="start"
          />
          <Tab
            label={
              <Badge badgeContent={churnAlerts.filter(a => !a.acknowledged).length} color="warning">
                Churn Alerts
              </Badge>
            }
            icon={<AlertTriangle size={16} />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {currentTab === 0 && (
        <Grid container spacing={3}>
          {/* Engagement Overview */}
          {/* @ts-ignore */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" mb={2}>
                Engagement Score Over Time
              </Typography>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart
                  data={[
                    { time: '00:00', score: 65 },
                    { time: '04:00', score: 45 },
                    { time: '08:00', score: 72 },
                    { time: '12:00', score: 85 },
                    { time: '16:00', score: 78 },
                    { time: '20:00', score: 82 },
                    { time: 'Now', score: engagementMetrics?.engagementScore || 75 },
                  ]}
                >
                  <defs>
                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="url(#colorEngagement)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Quick Stats */}
          {/* @ts-ignore */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" mb={2}>
                Activity Summary
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="textSecondary">
                    Messages Sent
                  </Typography>
                  <Typography variant="h6">
                    {engagementMetrics?.messagesSent?.toLocaleString() || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="textSecondary">
                    AI Responses
                  </Typography>
                  <Typography variant="h6">
                    {engagementMetrics?.aiResponsesGenerated?.toLocaleString() || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="textSecondary">
                    Goals In Progress
                  </Typography>
                  <Typography variant="h6">{engagementMetrics?.goalsInProgress || 0}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="textSecondary">
                    Habits Tracked Today
                  </Typography>
                  <Typography variant="h6">{engagementMetrics?.habitsTrackedToday || 0}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="textSecondary">
                    Avg Session Duration
                  </Typography>
                  <Typography variant="h6">
                    {Math.round((engagementMetrics?.avgSessionDuration || 0) / 60)}m
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="textSecondary">
                    Churn Risk Users
                  </Typography>
                  <Chip
                    label={engagementMetrics?.churnRiskUsers || 0}
                    color={
                      (engagementMetrics?.churnRiskUsers || 0) > 10 ? 'error' : 'warning'
                    }
                    size="small"
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {currentTab === 1 && (
        <Grid container spacing={3}>
          {/* Streaming Stats */}
          {/* @ts-ignore */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: 350 }}>
              <Typography variant="h6" mb={2}>
                Streams by Provider
              </Typography>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={Object.entries(streamStats?.streamsByProvider || {}).map(
                      ([name, value]) => ({ name, value })
                    )}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {Object.entries(streamStats?.streamsByProvider || {}).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Stream Performance */}
          {/* @ts-ignore */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: 350 }}>
              <Typography variant="h6" mb={2}>
                Stream Performance
              </Typography>
              <Box display="flex" flexDirection="column" gap={3}>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Total Streams Created</Typography>
                    <Typography fontWeight="bold">
                      {streamStats?.totalStreamsCreated?.toLocaleString() || 0}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Active Streams</Typography>
                    <Chip
                      label={streamStats?.activeStreams || 0}
                      color="success"
                      size="small"
                    />
                  </Box>
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Avg First Token Latency</Typography>
                    <Typography fontWeight="bold">
                      {streamStats?.averageLatencyToFirstToken || 0}ms
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Total Tokens Streamed</Typography>
                    <Typography fontWeight="bold">
                      {streamStats?.totalTokensStreamed?.toLocaleString() || 0}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {currentTab === 2 && (
        <Grid container spacing={3}>
          {/* Safety Detections Table */}
          {/* @ts-ignore */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Unreviewed Safety Detections</Typography>
                <Chip
                  label={`${safetyDetections.length} pending review`}
                  color={safetyDetections.length > 0 ? 'warning' : 'success'}
                  size="small"
                />
              </Box>

              {safetyDetections.length === 0 ? (
                <Alert severity="success" icon={<CheckCircle size={20} />}>
                  No pending safety detections to review.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Detected</TableCell>
                        <TableCell>User ID</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Content Preview</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Review</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {safetyDetections.slice(0, 10).map(detection => (
                        <TableRow key={detection.id}>
                          <TableCell>
                            {format(new Date(detection.detectedAt), 'HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {detection.userId.substring(0, 8)}...
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={detection.category} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={detection.severity}
                              size="small"
                              sx={{
                                backgroundColor: severityColors[detection.severity] + '20',
                                color: severityColors[detection.severity],
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 300 }} noWrap>
                              {detection.content}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={detection.action} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<Eye size={14} />}
                              onClick={() => handleReviewDetection(detection)}
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>

          {/* Safety Stats */}
          {/* @ts-ignore */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" mb={2}>
                Detections by Category
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={Object.entries(safetyStats?.detectionsByCategory || {}).map(
                    ([name, value]) => ({ name, value })
                  )}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* False Positive Rate */}
          {/* @ts-ignore */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" mb={2}>
                Safety Metrics
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">False Positive Rate</Typography>
                  <Typography variant="h6">
                    {((safetyStats?.falsePositiveRate || 0) * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Avg Processing Time</Typography>
                  <Typography variant="h6">
                    {safetyStats?.averageProcessingTimeMs?.toFixed(0) || 0}ms
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Active Escalations</Typography>
                  <Chip
                    label={safetyStats?.activeEscalations || 0}
                    color={
                      (safetyStats?.activeEscalations || 0) > 0 ? 'error' : 'success'
                    }
                    size="small"
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {currentTab === 3 && (
        <Grid container spacing={3}>
          {/* Churn Alerts Table */}
          {/* @ts-ignore */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Active Churn Risk Alerts</Typography>
                <Chip
                  label={`${churnAlerts.filter(a => !a.acknowledged).length} unacknowledged`}
                  color="warning"
                  size="small"
                />
              </Box>

              {churnAlerts.length === 0 ? (
                <Alert severity="success" icon={<CheckCircle size={20} />}>
                  No active churn risk alerts.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Detected</TableCell>
                        <TableCell>User ID</TableCell>
                        <TableCell>Risk Score</TableCell>
                        <TableCell>Risk Level</TableCell>
                        <TableCell>Signals</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {churnAlerts.map(alert => (
                        <TableRow
                          key={alert.id}
                          sx={{
                            backgroundColor: alert.acknowledged ? 'transparent' : '#fef3c7',
                          }}
                        >
                          <TableCell>
                            {format(new Date(alert.detectedAt), 'MMM dd, HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {alert.userId.substring(0, 8)}...
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight="bold">
                              {(alert.riskScore * 100).toFixed(0)}%
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={alert.riskLevel}
                              size="small"
                              sx={{
                                backgroundColor: severityColors[alert.riskLevel] + '20',
                                color: severityColors[alert.riskLevel],
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={0.5} flexWrap="wrap">
                              {alert.signals.slice(0, 3).map((signal, i) => (
                                <Chip key={i} label={signal} size="small" variant="outlined" />
                              ))}
                              {alert.signals.length > 3 && (
                                <Chip
                                  label={`+${alert.signals.length - 3}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {alert.acknowledged ? (
                              <Chip
                                label="Acknowledged"
                                icon={<CheckCircle size={14} />}
                                size="small"
                                color="success"
                              />
                            ) : (
                              <Chip
                                label="Pending"
                                icon={<Clock size={14} />}
                                size="small"
                                color="warning"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {!alert.acknowledged && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => acknowledgeAlert.mutate(alert.id)}
                                disabled={acknowledgeAlert.isPending}
                              >
                                Acknowledge
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Review Detection Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Safety Detection</DialogTitle>
        <DialogContent>
          {selectedDetection && (
            <Box>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Content
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: '#f9fafb' }}>
                <Typography variant="body2">{selectedDetection.content}</Typography>
              </Paper>

              <Box display="flex" gap={2} mb={2}>
                <Chip label={selectedDetection.category} />
                <Chip
                  label={selectedDetection.severity}
                  sx={{
                    backgroundColor: severityColors[selectedDetection.severity] + '20',
                    color: severityColors[selectedDetection.severity],
                  }}
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Review Notes (optional)"
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="Add any notes about this detection..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button
            color="success"
            variant="outlined"
            startIcon={<CheckCircle size={16} />}
            onClick={() => handleSubmitReview('confirmed')}
          >
            Confirm
          </Button>
          <Button
            color="warning"
            variant="outlined"
            startIcon={<XCircle size={16} />}
            onClick={() => handleSubmitReview('false_positive')}
          >
            False Positive
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
