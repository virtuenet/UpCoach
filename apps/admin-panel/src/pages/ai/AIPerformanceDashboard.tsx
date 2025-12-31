/**
 * AI Performance Dashboard
 *
 * Real-time monitoring dashboard for AI system performance including:
 * - API usage and cost monitoring
 * - Model performance tracking
 * - Latency and throughput metrics
 * - Quality and accuracy metrics
 * - Optimization recommendations
 * - WebSocket real-time updates
 *
 * @module AIPerformanceDashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  MonetizationOn as MoneyIcon,
  Psychology as BrainIcon,
} from '@mui/icons-material';
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
  ScatterChart,
  Scatter,
} from 'recharts';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface ModelMetrics {
  modelId: string;
  modelName: string;
  totalCalls: number;
  successRate: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  totalTokens: number;
  totalCost: number;
  accuracy: number;
  lastUsed: Date;
}

interface APIUsageData {
  timestamp: string;
  gpt4Calls: number;
  gpt35Calls: number;
  claudeCalls: number;
  embeddingCalls: number;
  totalCalls: number;
}

interface CostData {
  model: string;
  cost: number;
  tokens: number;
  calls: number;
}

interface LatencyData {
  range: string;
  count: number;
}

interface ErrorData {
  timestamp: string;
  errorRate: number;
  totalErrors: number;
}

interface QualityMetrics {
  timestamp: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

interface OptimizationRecommendation {
  id: string;
  type: 'cost' | 'performance' | 'quality';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  potentialSavings?: number;
  estimatedImprovement?: string;
  action: string;
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

// ============================================================================
// AI Performance Dashboard Component
// ============================================================================

const AIPerformanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Metrics State
  const [keyMetrics, setKeyMetrics] = useState<MetricCard[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics[]>([]);
  const [apiUsageData, setApiUsageData] = useState<APIUsageData[]>([]);
  const [costData, setCostData] = useState<CostData[]>([]);
  const [latencyData, setLatencyData] = useState<LatencyData[]>([]);
  const [errorData, setErrorData] = useState<ErrorData[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(
      process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ai-metrics'
    );

    ws.onopen = () => {
      setWsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleRealtimeUpdate(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      setWsConnected(false);
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      // Simulate API calls to load dashboard data
      await Promise.all([
        loadKeyMetrics(),
        loadModelMetrics(),
        loadAPIUsageData(),
        loadCostData(),
        loadLatencyData(),
        loadErrorData(),
        loadQualityMetrics(),
        loadRecommendations(),
        loadAlerts(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKeyMetrics = async () => {
    // Simulate loading key metrics
    const metrics: MetricCard[] = [
      {
        title: 'Total API Calls',
        value: '1,234,567',
        change: 12.5,
        trend: 'up',
        icon: <BrainIcon />,
        color: '#3f51b5',
      },
      {
        title: 'Total Cost',
        value: '$4,567',
        change: -8.3,
        trend: 'down',
        icon: <MoneyIcon />,
        color: '#4caf50',
      },
      {
        title: 'Avg Latency',
        value: '245ms',
        change: -5.2,
        trend: 'down',
        icon: <SpeedIcon />,
        color: '#ff9800',
      },
      {
        title: 'Model Accuracy',
        value: '94.3%',
        change: 2.1,
        trend: 'up',
        icon: <CheckCircleIcon />,
        color: '#9c27b0',
      },
      {
        title: 'Token Usage',
        value: '45.2M',
        change: 15.7,
        trend: 'up',
        icon: <MemoryIcon />,
        color: '#f44336',
      },
      {
        title: 'Success Rate',
        value: '99.2%',
        change: 0.5,
        trend: 'up',
        icon: <CheckCircleIcon />,
        color: '#00bcd4',
      },
    ];

    setKeyMetrics(metrics);
  };

  const loadModelMetrics = async () => {
    // Simulate loading model metrics
    const metrics: ModelMetrics[] = [
      {
        modelId: 'gpt-4-turbo',
        modelName: 'GPT-4 Turbo',
        totalCalls: 45000,
        successRate: 99.5,
        avgLatency: 1250,
        p95Latency: 2100,
        p99Latency: 3500,
        totalTokens: 25000000,
        totalCost: 2500,
        accuracy: 95.2,
        lastUsed: new Date(),
      },
      {
        modelId: 'gpt-3.5-turbo',
        modelName: 'GPT-3.5 Turbo',
        totalCalls: 125000,
        successRate: 99.8,
        avgLatency: 450,
        p95Latency: 850,
        p99Latency: 1200,
        totalTokens: 35000000,
        totalCost: 1200,
        accuracy: 89.7,
        lastUsed: new Date(),
      },
      {
        modelId: 'claude-3-opus',
        modelName: 'Claude 3 Opus',
        totalCalls: 15000,
        successRate: 99.3,
        avgLatency: 1800,
        p95Latency: 3200,
        p99Latency: 4500,
        totalTokens: 12000000,
        totalCost: 850,
        accuracy: 96.8,
        lastUsed: new Date(),
      },
      {
        modelId: 'text-embedding-3-large',
        modelName: 'Embedding Large',
        totalCalls: 500000,
        successRate: 99.9,
        avgLatency: 85,
        p95Latency: 150,
        p99Latency: 250,
        totalTokens: 8000000,
        totalCost: 17,
        accuracy: 98.5,
        lastUsed: new Date(),
      },
    ];

    setModelMetrics(metrics);
  };

  const loadAPIUsageData = async () => {
    // Generate 24 hours of data
    const data: APIUsageData[] = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        timestamp: timestamp.toISOString().slice(11, 16),
        gpt4Calls: Math.floor(Math.random() * 2000) + 1000,
        gpt35Calls: Math.floor(Math.random() * 5000) + 3000,
        claudeCalls: Math.floor(Math.random() * 800) + 400,
        embeddingCalls: Math.floor(Math.random() * 20000) + 10000,
        totalCalls: 0,
      });
    }

    data.forEach((d) => {
      d.totalCalls = d.gpt4Calls + d.gpt35Calls + d.claudeCalls + d.embeddingCalls;
    });

    setApiUsageData(data);
  };

  const loadCostData = async () => {
    const data: CostData[] = [
      { model: 'GPT-4 Turbo', cost: 2500, tokens: 25000000, calls: 45000 },
      { model: 'GPT-3.5 Turbo', cost: 1200, tokens: 35000000, calls: 125000 },
      { model: 'Claude 3 Opus', cost: 850, tokens: 12000000, calls: 15000 },
      { model: 'Embeddings', cost: 17, tokens: 8000000, calls: 500000 },
    ];

    setCostData(data);
  };

  const loadLatencyData = async () => {
    const data: LatencyData[] = [
      { range: '0-100ms', count: 125000 },
      { range: '100-200ms', count: 95000 },
      { range: '200-500ms', count: 145000 },
      { range: '500-1000ms', count: 65000 },
      { range: '1000-2000ms', count: 35000 },
      { range: '2000-5000ms', count: 15000 },
      { range: '5000+ms', count: 5000 },
    ];

    setLatencyData(data);
  };

  const loadErrorData = async () => {
    const data: ErrorData[] = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const errorRate = Math.random() * 2;
      data.push({
        timestamp: timestamp.toISOString().slice(11, 16),
        errorRate,
        totalErrors: Math.floor(errorRate * 100),
      });
    }

    setErrorData(data);
  };

  const loadQualityMetrics = async () => {
    const data: QualityMetrics[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.push({
        timestamp: timestamp.toISOString().slice(5, 10),
        accuracy: 0.85 + Math.random() * 0.1,
        precision: 0.83 + Math.random() * 0.12,
        recall: 0.82 + Math.random() * 0.13,
        f1Score: 0.84 + Math.random() * 0.11,
      });
    }

    setQualityMetrics(data);
  };

  const loadRecommendations = async () => {
    const recs: OptimizationRecommendation[] = [
      {
        id: '1',
        type: 'cost',
        severity: 'high',
        title: 'Switch to GPT-3.5 for Simple Tasks',
        description: '45% of GPT-4 calls are for simple classification tasks that could use GPT-3.5',
        potentialSavings: 875,
        action: 'Configure routing rules',
      },
      {
        id: '2',
        type: 'performance',
        severity: 'medium',
        title: 'Enable Response Caching',
        description: '23% of requests are duplicates that could be cached',
        estimatedImprovement: '65% latency reduction',
        action: 'Enable semantic caching',
      },
      {
        id: '3',
        type: 'cost',
        severity: 'medium',
        title: 'Optimize Token Usage',
        description: 'Average prompt length is 30% longer than necessary',
        potentialSavings: 450,
        action: 'Review prompt templates',
      },
      {
        id: '4',
        type: 'quality',
        severity: 'low',
        title: 'Update Training Data',
        description: 'Model accuracy has decreased by 2.1% over the last week',
        estimatedImprovement: '3-5% accuracy gain',
        action: 'Retrain with recent data',
      },
      {
        id: '5',
        type: 'performance',
        severity: 'high',
        title: 'Implement Batch Processing',
        description: 'Embedding requests could be batched for 40% better throughput',
        estimatedImprovement: '40% throughput increase',
        action: 'Enable batch embedding API',
      },
    ];

    setRecommendations(recs);
  };

  const loadAlerts = async () => {
    const alertsList: Alert[] = [
      {
        id: '1',
        type: 'warning',
        message: 'GPT-4 API latency increased by 25% in the last hour',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        acknowledged: false,
      },
      {
        id: '2',
        type: 'info',
        message: 'Daily cost threshold (80%) reached',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        acknowledged: false,
      },
      {
        id: '3',
        type: 'error',
        message: 'Embedding service experiencing elevated error rate',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        acknowledged: true,
      },
    ];

    setAlerts(alertsList);
  };

  const handleRealtimeUpdate = (data: any) => {
    // Handle real-time WebSocket updates
    if (data.type === 'metric_update') {
      // Update metrics in real-time
      console.log('Metric update:', data);
    } else if (data.type === 'alert') {
      setAlerts((prev) => [
        {
          id: Date.now().toString(),
          type: data.severity,
          message: data.message,
          timestamp: new Date(),
          acknowledged: false,
        },
        ...prev,
      ]);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    const data = {
      keyMetrics,
      modelMetrics,
      apiUsageData,
      costData,
      timeRange,
      exportDate: new Date().toISOString(),
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-performance-${Date.now()}.json`;
      a.click();
    } else {
      // Convert to CSV
      let csv = 'Model,Total Calls,Success Rate,Avg Latency,Total Cost\n';
      modelMetrics.forEach((m) => {
        csv += `${m.modelName},${m.totalCalls},${m.successRate},${m.avgLatency},${m.totalCost}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-performance-${Date.now()}.csv`;
      a.click();
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  };

  // ============================================================================
  // Render Methods
  // ============================================================================

  const renderOverviewTab = () => (
    <Box>
      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {keyMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      {metric.title}
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 1 }}>
                      {metric.value}
                    </Typography>
                    <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                      {metric.trend === 'up' ? (
                        <TrendingUpIcon
                          fontSize="small"
                          color={metric.change > 0 ? 'success' : 'error'}
                        />
                      ) : (
                        <TrendingDownIcon
                          fontSize="small"
                          color={metric.change < 0 ? 'success' : 'error'}
                        />
                      )}
                      <Typography
                        variant="body2"
                        color={metric.change > 0 ? 'success.main' : 'error.main'}
                        sx={{ ml: 0.5 }}
                      >
                        {Math.abs(metric.change)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: metric.color,
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    {metric.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* API Calls Over Time */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            API Calls Over Time
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={apiUsageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="gpt4Calls"
                stackId="1"
                stroke="#3f51b5"
                fill="#3f51b5"
                name="GPT-4"
              />
              <Area
                type="monotone"
                dataKey="gpt35Calls"
                stackId="1"
                stroke="#4caf50"
                fill="#4caf50"
                name="GPT-3.5"
              />
              <Area
                type="monotone"
                dataKey="claudeCalls"
                stackId="1"
                stroke="#ff9800"
                fill="#ff9800"
                name="Claude"
              />
              <Area
                type="monotone"
                dataKey="embeddingCalls"
                stackId="1"
                stroke="#9c27b0"
                fill="#9c27b0"
                name="Embeddings"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.filter((a) => !a.acknowledged).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Active Alerts
            </Typography>
            {alerts
              .filter((a) => !a.acknowledged)
              .map((alert) => (
                <Alert
                  key={alert.id}
                  severity={alert.type}
                  sx={{ mb: 1 }}
                  action={
                    <Button size="small" onClick={() => acknowledgeAlert(alert.id)}>
                      Acknowledge
                    </Button>
                  }
                >
                  {alert.message}
                </Alert>
              ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const renderModelsTab = () => (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Model</TableCell>
              <TableCell align="right">Total Calls</TableCell>
              <TableCell align="right">Success Rate</TableCell>
              <TableCell align="right">Avg Latency</TableCell>
              <TableCell align="right">P95 Latency</TableCell>
              <TableCell align="right">P99 Latency</TableCell>
              <TableCell align="right">Total Tokens</TableCell>
              <TableCell align="right">Total Cost</TableCell>
              <TableCell align="right">Accuracy</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modelMetrics.map((model) => (
              <TableRow key={model.modelId}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {model.modelName}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {model.modelId}
                  </Typography>
                </TableCell>
                <TableCell align="right">{model.totalCalls.toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${model.successRate}%`}
                    size="small"
                    color={model.successRate > 99 ? 'success' : 'warning'}
                  />
                </TableCell>
                <TableCell align="right">{model.avgLatency}ms</TableCell>
                <TableCell align="right">{model.p95Latency}ms</TableCell>
                <TableCell align="right">{model.p99Latency}ms</TableCell>
                <TableCell align="right">
                  {(model.totalTokens / 1000000).toFixed(1)}M
                </TableCell>
                <TableCell align="right">${model.totalCost.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${model.accuracy}%`}
                    size="small"
                    color={model.accuracy > 95 ? 'success' : 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Latency Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#3f51b5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Error Rate Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={errorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="errorRate"
                    stroke="#f44336"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderAPIUsageTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cost Breakdown by Model
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costData}
                    dataKey="cost"
                    nameKey="model"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {costData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={['#3f51b5', '#4caf50', '#ff9800', '#9c27b0'][index]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Token Usage by Model
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="tokens" fill="#4caf50" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detailed Cost Analysis
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Model</TableCell>
                      <TableCell align="right">Total Calls</TableCell>
                      <TableCell align="right">Total Tokens</TableCell>
                      <TableCell align="right">Cost per Call</TableCell>
                      <TableCell align="right">Cost per 1K Tokens</TableCell>
                      <TableCell align="right">Total Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {costData.map((item) => (
                      <TableRow key={item.model}>
                        <TableCell>{item.model}</TableCell>
                        <TableCell align="right">{item.calls.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          {(item.tokens / 1000000).toFixed(2)}M
                        </TableCell>
                        <TableCell align="right">
                          ${(item.cost / item.calls).toFixed(4)}
                        </TableCell>
                        <TableCell align="right">
                          ${((item.cost / item.tokens) * 1000).toFixed(4)}
                        </TableCell>
                        <TableCell align="right">${item.cost.toFixed(2)}</TableCell>
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

  const renderQualityTab = () => (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Model Quality Metrics Over Time
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={qualityMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis domain={[0, 1]} />
              <RechartsTooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#3f51b5"
                strokeWidth={2}
                name="Accuracy"
              />
              <Line
                type="monotone"
                dataKey="precision"
                stroke="#4caf50"
                strokeWidth={2}
                name="Precision"
              />
              <Line
                type="monotone"
                dataKey="recall"
                stroke="#ff9800"
                strokeWidth={2}
                name="Recall"
              />
              <Line
                type="monotone"
                dataKey="f1Score"
                stroke="#9c27b0"
                strokeWidth={2}
                name="F1 Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Quality Metrics
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Accuracy"
                    secondary={`${(qualityMetrics[qualityMetrics.length - 1]?.accuracy * 100).toFixed(1)}%`}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Precision"
                    secondary={`${(qualityMetrics[qualityMetrics.length - 1]?.precision * 100).toFixed(1)}%`}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Recall"
                    secondary={`${(qualityMetrics[qualityMetrics.length - 1]?.recall * 100).toFixed(1)}%`}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="F1 Score"
                    secondary={`${(qualityMetrics[qualityMetrics.length - 1]?.f1Score * 100).toFixed(1)}%`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quality Trends
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="7-Day Average Accuracy"
                    secondary="93.8%"
                  />
                  <Chip label="+1.2%" size="small" color="success" />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="30-Day Average Accuracy"
                    secondary="92.5%"
                  />
                  <Chip label="+0.8%" size="small" color="success" />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Best Performing Model"
                    secondary="Claude 3 Opus (96.8%)"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Improvement Opportunity"
                    secondary="GPT-3.5 Turbo (-4.1% vs target)"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderOptimizationTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Optimization Recommendations
      </Typography>

      {recommendations.map((rec) => (
        <Card key={rec.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Chip
                    label={rec.type}
                    size="small"
                    color={
                      rec.type === 'cost'
                        ? 'success'
                        : rec.type === 'performance'
                        ? 'primary'
                        : 'secondary'
                    }
                  />
                  <Chip
                    label={rec.severity}
                    size="small"
                    color={
                      rec.severity === 'high'
                        ? 'error'
                        : rec.severity === 'medium'
                        ? 'warning'
                        : 'default'
                    }
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  {rec.title}
                </Typography>
                <Typography color="textSecondary" paragraph>
                  {rec.description}
                </Typography>
                <Box display="flex" gap={2}>
                  {rec.potentialSavings && (
                    <Typography variant="body2" color="success.main">
                      Potential Savings: ${rec.potentialSavings}/month
                    </Typography>
                  )}
                  {rec.estimatedImprovement && (
                    <Typography variant="body2" color="primary">
                      Estimated Improvement: {rec.estimatedImprovement}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Button variant="contained" color="primary">
                {rec.action}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            AI Performance Dashboard
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: wsConnected ? 'success.main' : 'error.main',
              }}
            />
            <Typography variant="body2" color="textSecondary">
              {wsConnected ? 'Live' : 'Disconnected'}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>

          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            onClick={loadDashboardData}
          >
            Refresh
          </Button>

          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={() => handleExport('csv')}
          >
            Export
          </Button>

          <IconButton onClick={() => setSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Overview" />
          <Tab label="Models" />
          <Tab label="API Usage" />
          <Tab label="Quality" />
          <Tab label="Optimization" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {activeTab === 0 && renderOverviewTab()}
        {activeTab === 1 && renderModelsTab()}
        {activeTab === 2 && renderAPIUsageTab()}
        {activeTab === 3 && renderQualityTab()}
        {activeTab === 4 && renderOptimizationTab()}
      </Box>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Dashboard Settings</DialogTitle>
        <DialogContent>
          <TextField
            label="Refresh Interval (seconds)"
            type="number"
            fullWidth
            margin="normal"
            defaultValue={30}
          />
          <TextField
            label="Alert Email"
            type="email"
            fullWidth
            margin="normal"
            placeholder="admin@example.com"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Alert Threshold</InputLabel>
            <Select defaultValue="medium">
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setSettingsOpen(false)}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIPerformanceDashboard;
