import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Alert,
  AlertTitle,
  LinearProgress,
  Switch,
  FormControlLabel,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Code as CodeIcon,
  AutoFixHigh as AutoFixHighIcon,
  Notifications as NotificationsIcon,
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
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import Editor from '@monaco-editor/react';
import useSWR from 'swr';
import { jsPDF } from 'jspdf';
import 'leaflet/dist/leaflet.css';

interface PerformanceMetrics {
  overview: {
    responseTime: { current: number; trend: number };
    throughput: { current: number; trend: number };
    errorRate: { current: number; trend: number };
    uptime: { current: number; trend: number };
  };
  caching: {
    l1: {
      hitRatio: number;
      size: number;
      evictions: number;
      memoryUsage: number;
    };
    l2: {
      hitRatio: number;
      memoryUsage: number;
      connectionPool: number;
    };
    l3: {
      hitRatio: number;
      bandwidth: number;
    };
  };
  cdn: {
    bandwidth: {
      total: number;
      byRegion: Record<string, number>;
      trend: Array<{ timestamp: number; bytes: number }>;
    };
    requests: {
      total: number;
      cached: number;
      uncached: number;
    };
    hitRatio: number;
    topContent: Array<{
      url: string;
      requests: number;
      bandwidth: number;
    }>;
    edgeLocations: Array<{
      location: string;
      lat: number;
      lng: number;
      requests: number;
      latency: number;
    }>;
  };
  database: {
    queries: {
      active: number;
      slow: number;
      total: number;
    };
    pool: {
      total: number;
      active: number;
      idle: number;
      waiting: number;
    };
    replicas: Array<{
      host: string;
      status: string;
      lag: number;
    }>;
    locks: number;
    bloat: number;
  };
  api: {
    endpoints: Array<{
      path: string;
      method: string;
      latency: { p50: number; p95: number; p99: number };
      throughput: number;
      errorRate: number;
    }>;
    latencyDistribution: Array<{
      bucket: string;
      count: number;
    }>;
  };
}

interface Alert {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

interface QueryAnalysis {
  query: string;
  executionTime: number;
  plan: any;
  recommendations: string[];
  indexSuggestions: Array<{
    table: string;
    columns: string[];
    type: string;
    reason: string;
  }>;
}

interface AutoTuningConfig {
  enabled: boolean;
  autoScaling: boolean;
  cacheWarming: string;
  vacuumSchedule: string;
  cdnPurgeAuto: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const COLORS = {
  primary: '#1976d2',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  neutral: '#757575',
};

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

export default function PerformanceDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('1h');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users WHERE created_at > NOW() - INTERVAL \'7 days\'');
  const [queryAnalysis, setQueryAnalysis] = useState<QueryAnalysis | null>(null);
  const [analyzingQuery, setAnalyzingQuery] = useState(false);
  const [autoTuning, setAutoTuning] = useState<AutoTuningConfig>({
    enabled: false,
    autoScaling: false,
    cacheWarming: '0 0 * * *',
    vacuumSchedule: '0 2 * * *',
    cdnPurgeAuto: false,
  });
  const [showExportDialog, setShowExportDialog] = useState(false);

  const { data: metrics, error, mutate } = useSWR<PerformanceMetrics>(
    `/api/performance/metrics?range=${timeRange}`,
    fetcher,
    { refreshInterval: 5000 }
  );

  useEffect(() => {
    if (metrics) {
      checkForAlerts(metrics);
    }
  }, [metrics]);

  const checkForAlerts = (data: PerformanceMetrics) => {
    const newAlerts: Alert[] = [];

    if (data.overview.errorRate.current > 5) {
      newAlerts.push({
        id: `error-rate-${Date.now()}`,
        severity: 'error',
        title: 'High Error Rate',
        message: `Error rate is ${data.overview.errorRate.current.toFixed(2)}%, exceeding threshold of 5%`,
        timestamp: Date.now(),
        acknowledged: false,
      });
    }

    if (data.caching.l1.hitRatio < 90) {
      newAlerts.push({
        id: `cache-hit-${Date.now()}`,
        severity: 'warning',
        title: 'Low Cache Hit Ratio',
        message: `L1 cache hit ratio is ${data.caching.l1.hitRatio.toFixed(1)}%, below threshold of 90%`,
        timestamp: Date.now(),
        acknowledged: false,
      });
    }

    if (data.database.pool.waiting > 10) {
      newAlerts.push({
        id: `db-pool-${Date.now()}`,
        severity: 'warning',
        title: 'Database Connection Pool Saturation',
        message: `${data.database.pool.waiting} connections waiting in queue`,
        timestamp: Date.now(),
        acknowledged: false,
      });
    }

    if (data.overview.responseTime.current > 1000) {
      newAlerts.push({
        id: `response-time-${Date.now()}`,
        severity: 'error',
        title: 'High Response Time',
        message: `Average response time is ${data.overview.responseTime.current}ms, exceeding threshold of 1000ms`,
        timestamp: Date.now(),
        acknowledged: false,
      });
    }

    setAlerts((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const toAdd = newAlerts.filter((a) => !existingIds.has(a.id));
      return [...prev, ...toAdd].slice(-20);
    });
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const analyzeQuery = async () => {
    setAnalyzingQuery(true);
    try {
      const response = await fetch('/api/database/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery }),
      });
      const data = await response.json();
      setQueryAnalysis(data);
    } catch (error) {
      console.error('Query analysis failed:', error);
    } finally {
      setAnalyzingQuery(false);
    }
  };

  const exportToCSV = () => {
    if (!metrics) return;

    const csv = [
      ['Metric', 'Value', 'Trend'],
      ['Response Time', metrics.overview.responseTime.current, metrics.overview.responseTime.trend],
      ['Throughput', metrics.overview.throughput.current, metrics.overview.throughput.trend],
      ['Error Rate', metrics.overview.errorRate.current, metrics.overview.errorRate.trend],
      ['Cache Hit Ratio L1', metrics.caching.l1.hitRatio, ''],
      ['Cache Hit Ratio L2', metrics.caching.l2.hitRatio, ''],
      ['CDN Hit Ratio', metrics.cdn.hitRatio, ''],
      ['Active Queries', metrics.database.queries.active, ''],
      ['Database Connections', metrics.database.pool.active, ''],
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    if (!metrics) return;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Performance Report', 20, 20);

    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);

    doc.setFontSize(14);
    doc.text('Overview Metrics', 20, 45);

    doc.setFontSize(10);
    doc.text(`Response Time: ${metrics.overview.responseTime.current}ms`, 30, 55);
    doc.text(`Throughput: ${metrics.overview.throughput.current} req/s`, 30, 62);
    doc.text(`Error Rate: ${metrics.overview.errorRate.current.toFixed(2)}%`, 30, 69);
    doc.text(`Uptime: ${metrics.overview.uptime.current.toFixed(2)}%`, 30, 76);

    doc.setFontSize(14);
    doc.text('Cache Metrics', 20, 90);

    doc.setFontSize(10);
    doc.text(`L1 Hit Ratio: ${metrics.caching.l1.hitRatio.toFixed(2)}%`, 30, 100);
    doc.text(`L2 Hit Ratio: ${metrics.caching.l2.hitRatio.toFixed(2)}%`, 30, 107);
    doc.text(`CDN Hit Ratio: ${metrics.cdn.hitRatio.toFixed(2)}%`, 30, 114);

    doc.setFontSize(14);
    doc.text('Database Metrics', 20, 128);

    doc.setFontSize(10);
    doc.text(`Active Queries: ${metrics.database.queries.active}`, 30, 138);
    doc.text(`Slow Queries: ${metrics.database.queries.slow}`, 30, 145);
    doc.text(`Connection Pool: ${metrics.database.pool.active}/${metrics.database.pool.total}`, 30, 152);

    doc.save(`performance-report-${Date.now()}.pdf`);
  };

  const renderOverviewTab = () => {
    if (!metrics) return <CircularProgress />;

    const timeSeriesData = Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      responseTime: Math.random() * 500 + 200,
      throughput: Math.random() * 1000 + 500,
      errorRate: Math.random() * 2,
    }));

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" gap={2} mb={3}>
            {alerts.filter((a) => !a.acknowledged).length > 0 && (
              <Alert severity="warning" sx={{ flex: 1 }}>
                <AlertTitle>Active Alerts</AlertTitle>
                {alerts.filter((a) => !a.acknowledged).length} alerts require attention
              </Alert>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Response Time
                  </Typography>
                  <Typography variant="h4">
                    {metrics.overview.responseTime.current}ms
                  </Typography>
                </Box>
                <SpeedIcon sx={{ fontSize: 48, color: COLORS.primary }} />
              </Box>
              <Box display="flex" alignItems="center" mt={1}>
                {metrics.overview.responseTime.trend > 0 ? (
                  <TrendingUpIcon color="error" />
                ) : (
                  <TrendingDownIcon color="success" />
                )}
                <Typography variant="body2" color={metrics.overview.responseTime.trend > 0 ? 'error' : 'success.main'}>
                  {Math.abs(metrics.overview.responseTime.trend).toFixed(1)}% vs last hour
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Throughput
                  </Typography>
                  <Typography variant="h4">
                    {metrics.overview.throughput.current} req/s
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, color: COLORS.success }} />
              </Box>
              <Box display="flex" alignItems="center" mt={1}>
                {metrics.overview.throughput.trend > 0 ? (
                  <TrendingUpIcon color="success" />
                ) : (
                  <TrendingDownIcon color="error" />
                )}
                <Typography variant="body2" color={metrics.overview.throughput.trend > 0 ? 'success.main' : 'error'}>
                  {Math.abs(metrics.overview.throughput.trend).toFixed(1)}% vs last hour
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Error Rate
                  </Typography>
                  <Typography variant="h4">
                    {metrics.overview.errorRate.current.toFixed(2)}%
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 48, color: metrics.overview.errorRate.current > 5 ? COLORS.error : COLORS.success }} />
              </Box>
              <Box display="flex" alignItems="center" mt={1}>
                {metrics.overview.errorRate.current > 5 ? (
                  <WarningIcon color="error" />
                ) : (
                  <CheckCircleIcon color="success" />
                )}
                <Typography variant="body2" color={metrics.overview.errorRate.current > 5 ? 'error' : 'success.main'}>
                  {metrics.overview.errorRate.current > 5 ? 'Above threshold' : 'Normal'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Uptime
                  </Typography>
                  <Typography variant="h4">
                    {metrics.overview.uptime.current.toFixed(2)}%
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, color: COLORS.success }} />
              </Box>
              <Box display="flex" alignItems="center" mt={1}>
                <CheckCircleIcon color="success" />
                <Typography variant="body2" color="success.main">
                  All systems operational
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response Time Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="responseTime" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Throughput Trend
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="throughput" stroke={COLORS.success} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Error Rate Trend
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="errorRate" stroke={COLORS.error} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Alerts
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Severity</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alerts.slice(0, 10).map((alert) => (
                      <TableRow key={alert.id} sx={{ opacity: alert.acknowledged ? 0.5 : 1 }}>
                        <TableCell>
                          <Chip
                            label={alert.severity}
                            color={alert.severity === 'error' ? 'error' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{alert.title}</TableCell>
                        <TableCell>{alert.message}</TableCell>
                        <TableCell>{new Date(alert.timestamp).toLocaleTimeString()}</TableCell>
                        <TableCell>
                          {!alert.acknowledged && (
                            <Button size="small" onClick={() => acknowledgeAlert(alert.id)}>
                              Acknowledge
                            </Button>
                          )}
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
    );
  };

  const renderCachingTab = () => {
    if (!metrics) return <CircularProgress />;

    const cacheData = [
      { name: 'L1 Cache', hitRatio: metrics.caching.l1.hitRatio, memoryUsage: metrics.caching.l1.memoryUsage },
      { name: 'L2 Cache', hitRatio: metrics.caching.l2.hitRatio, memoryUsage: metrics.caching.l2.memoryUsage },
      { name: 'CDN Cache', hitRatio: metrics.cdn.hitRatio, memoryUsage: 0 },
    ];

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                L1 Cache (In-Memory)
              </Typography>
              <Box my={2}>
                <Typography variant="body2" color="text.secondary">
                  Hit Ratio
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.caching.l1.hitRatio}
                    sx={{ flex: 1, height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="h6">{metrics.caching.l1.hitRatio.toFixed(1)}%</Typography>
                </Box>
              </Box>
              <Box my={2}>
                <Typography variant="body2" color="text.secondary">
                  Memory Usage
                </Typography>
                <Typography variant="h6">
                  {(metrics.caching.l1.memoryUsage / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
              <Box my={2}>
                <Typography variant="body2" color="text.secondary">
                  Evictions
                </Typography>
                <Typography variant="h6">{metrics.caching.l1.evictions}</Typography>
              </Box>
              <Box my={2}>
                <Typography variant="body2" color="text.secondary">
                  Cache Size
                </Typography>
                <Typography variant="h6">{metrics.caching.l1.size} entries</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                L2 Cache (Redis Cluster)
              </Typography>
              <Box my={2}>
                <Typography variant="body2" color="text.secondary">
                  Hit Ratio
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.caching.l2.hitRatio}
                    sx={{ flex: 1, height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="h6">{metrics.caching.l2.hitRatio.toFixed(1)}%</Typography>
                </Box>
              </Box>
              <Box my={2}>
                <Typography variant="body2" color="text.secondary">
                  Memory Usage
                </Typography>
                <Typography variant="h6">
                  {(metrics.caching.l2.memoryUsage / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
              <Box my={2}>
                <Typography variant="body2" color="text.secondary">
                  Connection Pool
                </Typography>
                <Typography variant="h6">{metrics.caching.l2.connectionPool} connections</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                L3 Cache (CDN Edge)
              </Typography>
              <Box my={2}>
                <Typography variant="body2" color="text.secondary">
                  Hit Ratio
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.caching.l3.hitRatio}
                    sx={{ flex: 1, height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="h6">{metrics.caching.l3.hitRatio.toFixed(1)}%</Typography>
                </Box>
              </Box>
              <Box my={2}>
                <Typography variant="body2" color="text.secondary">
                  Bandwidth Saved
                </Typography>
                <Typography variant="h6">
                  {(metrics.caching.l3.bandwidth / 1024 / 1024 / 1024).toFixed(2)} GB
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cache Hit Ratio Comparison
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cacheData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="hitRatio" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Memory Usage Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={cacheData.filter((d) => d.memoryUsage > 0)}
                    dataKey="memoryUsage"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {cacheData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderCDNTab = () => {
    if (!metrics) return <CircularProgress />;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Bandwidth
              </Typography>
              <Typography variant="h4">
                {(metrics.cdn.bandwidth.total / 1024 / 1024 / 1024).toFixed(2)} GB
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Requests
              </Typography>
              <Typography variant="h4">
                {metrics.cdn.requests.total.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Cached Requests
              </Typography>
              <Typography variant="h4">
                {metrics.cdn.requests.cached.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {((metrics.cdn.requests.cached / metrics.cdn.requests.total) * 100).toFixed(1)}% of total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                CDN Hit Ratio
              </Typography>
              <Typography variant="h4">
                {metrics.cdn.hitRatio.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bandwidth Trend (Last 24 Hours)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics.cdn.bandwidth.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                  />
                  <YAxis tickFormatter={(bytes) => `${(bytes / 1024 / 1024).toFixed(0)} MB`} />
                  <RechartsTooltip
                    labelFormatter={(ts) => new Date(ts).toLocaleString()}
                    formatter={(bytes: number) => [`${(bytes / 1024 / 1024).toFixed(2)} MB`, 'Bandwidth']}
                  />
                  <Area type="monotone" dataKey="bytes" stroke={COLORS.info} fill={COLORS.info} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bandwidth by Region
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(metrics.cdn.bandwidth.byRegion).map(([region, bytes]) => ({
                    region,
                    bandwidth: bytes / 1024 / 1024,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <RechartsTooltip formatter={(value: number) => `${value.toFixed(2)} MB`} />
                  <Bar dataKey="bandwidth" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Content
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>URL</TableCell>
                      <TableCell align="right">Requests</TableCell>
                      <TableCell align="right">Bandwidth</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.cdn.topContent.slice(0, 5).map((content, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Tooltip title={content.url}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {content.url}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">{content.requests.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          {(content.bandwidth / 1024 / 1024).toFixed(2)} MB
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Edge Locations Performance
              </Typography>
              <Box height={400}>
                <MapContainer
                  center={[20, 0]}
                  zoom={2}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {metrics.cdn.edgeLocations.map((location, idx) => (
                    <CircleMarker
                      key={idx}
                      center={[location.lat, location.lng]}
                      radius={Math.min(location.requests / 1000, 20)}
                      fillColor={location.latency < 50 ? COLORS.success : location.latency < 100 ? COLORS.warning : COLORS.error}
                      color="white"
                      weight={1}
                      fillOpacity={0.7}
                    >
                      <Popup>
                        <Box>
                          <Typography variant="subtitle2">{location.location}</Typography>
                          <Typography variant="body2">Requests: {location.requests.toLocaleString()}</Typography>
                          <Typography variant="body2">Latency: {location.latency}ms</Typography>
                        </Box>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderDatabaseTab = () => {
    if (!metrics) return <CircularProgress />;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Queries
              </Typography>
              <Typography variant="h4">{metrics.database.queries.active}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Slow Queries
              </Typography>
              <Typography variant="h4" color={metrics.database.queries.slow > 10 ? 'error' : 'inherit'}>
                {metrics.database.queries.slow}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Connection Pool
              </Typography>
              <Typography variant="h4">
                {metrics.database.pool.active}/{metrics.database.pool.total}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(metrics.database.pool.active / metrics.database.pool.total) * 100}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Waiting Connections
              </Typography>
              <Typography variant="h4" color={metrics.database.pool.waiting > 10 ? 'error' : 'inherit'}>
                {metrics.database.pool.waiting}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Query Analyzer
              </Typography>
              <Box mb={2}>
                <Editor
                  height="200px"
                  defaultLanguage="sql"
                  value={sqlQuery}
                  onChange={(value) => setSqlQuery(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    fontSize: 14,
                  }}
                />
              </Box>
              <Button
                variant="contained"
                onClick={analyzeQuery}
                disabled={analyzingQuery}
                startIcon={analyzingQuery ? <CircularProgress size={20} /> : <CodeIcon />}
              >
                Analyze Query
              </Button>

              {queryAnalysis && (
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Execution Time: {queryAnalysis.executionTime.toFixed(2)}ms
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    Planning Time: {queryAnalysis.planningTime.toFixed(2)}ms
                  </Typography>

                  {queryAnalysis.recommendations.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Recommendations:
                      </Typography>
                      {queryAnalysis.recommendations.map((rec, idx) => (
                        <Alert key={idx} severity="info" sx={{ mt: 1 }}>
                          {rec}
                        </Alert>
                      ))}
                    </Box>
                  )}

                  {queryAnalysis.indexSuggestions.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Index Suggestions:
                      </Typography>
                      {queryAnalysis.indexSuggestions.map((suggestion, idx) => (
                        <Alert key={idx} severity="warning" sx={{ mt: 1 }}>
                          Create {suggestion.type} index on {suggestion.table}({suggestion.columns.join(', ')})
                          <br />
                          Reason: {suggestion.reason}
                        </Alert>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Read Replicas Health
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Host</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Lag (ms)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.database.replicas.map((replica, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{replica.host}</TableCell>
                        <TableCell>
                          <Chip
                            label={replica.status}
                            color={replica.status === 'healthy' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            color={replica.lag > 1000 ? 'error' : 'inherit'}
                          >
                            {replica.lag}
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

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Connection Pool Metrics
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    { name: 'Active', value: metrics.database.pool.active },
                    { name: 'Idle', value: metrics.database.pool.idle },
                    { name: 'Waiting', value: metrics.database.pool.waiting },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderAPITab = () => {
    if (!metrics) return <CircularProgress />;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API Endpoint Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Endpoint</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell align="right">P50 (ms)</TableCell>
                      <TableCell align="right">P95 (ms)</TableCell>
                      <TableCell align="right">P99 (ms)</TableCell>
                      <TableCell align="right">Throughput</TableCell>
                      <TableCell align="right">Error Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.api.endpoints.map((endpoint, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{endpoint.path}</TableCell>
                        <TableCell>
                          <Chip label={endpoint.method} size="small" />
                        </TableCell>
                        <TableCell align="right">{endpoint.latency.p50}</TableCell>
                        <TableCell align="right">{endpoint.latency.p95}</TableCell>
                        <TableCell align="right">{endpoint.latency.p99}</TableCell>
                        <TableCell align="right">{endpoint.throughput} req/s</TableCell>
                        <TableCell align="right">
                          <Typography color={endpoint.errorRate > 5 ? 'error' : 'inherit'}>
                            {endpoint.errorRate.toFixed(2)}%
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
                Latency Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.api.latencyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Request Method Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'GET', value: 65 },
                      { name: 'POST', value: 20 },
                      { name: 'PUT', value: 10 },
                      { name: 'DELETE', value: 5 },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {CHART_COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderOptimizationTab = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Auto-Tuning Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoTuning.enabled}
                        onChange={(e) => setAutoTuning({ ...autoTuning, enabled: e.target.checked })}
                      />
                    }
                    label="Enable Auto-Tuning"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoTuning.autoScaling}
                        onChange={(e) => setAutoTuning({ ...autoTuning, autoScaling: e.target.checked })}
                        disabled={!autoTuning.enabled}
                      />
                    }
                    label="Auto-Scaling"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Cache Warming Schedule (Cron)"
                    value={autoTuning.cacheWarming}
                    onChange={(e) => setAutoTuning({ ...autoTuning, cacheWarming: e.target.value })}
                    disabled={!autoTuning.enabled}
                    helperText="Format: minute hour day month weekday"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Database Vacuum Schedule (Cron)"
                    value={autoTuning.vacuumSchedule}
                    onChange={(e) => setAutoTuning({ ...autoTuning, vacuumSchedule: e.target.value })}
                    disabled={!autoTuning.enabled}
                    helperText="Format: minute hour day month weekday"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoTuning.cdnPurgeAuto}
                        onChange={(e) => setAutoTuning({ ...autoTuning, cdnPurgeAuto: e.target.checked })}
                        disabled={!autoTuning.enabled}
                      />
                    }
                    label="Automatic CDN Purge on Updates"
                  />
                </Grid>
              </Grid>
              <Box mt={3}>
                <Button variant="contained" startIcon={<AutoFixHighIcon />}>
                  Save Auto-Tuning Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Recommendations
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <AlertTitle>Cache Optimization</AlertTitle>
                Consider increasing L1 cache size to improve hit ratio. Current hit ratio is below optimal threshold.
              </Alert>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <AlertTitle>Database Optimization</AlertTitle>
                3 slow queries detected. Review query analyzer for optimization suggestions.
              </Alert>
              <Alert severity="success" sx={{ mb: 2 }}>
                <AlertTitle>CDN Performance</AlertTitle>
                CDN hit ratio is excellent at 95.2%. No action needed.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Performance Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <TextField
            select
            size="small"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            sx={{ width: 120 }}
          >
            <MenuItem value="15m">Last 15m</MenuItem>
            <MenuItem value="1h">Last 1h</MenuItem>
            <MenuItem value="6h">Last 6h</MenuItem>
            <MenuItem value="24h">Last 24h</MenuItem>
            <MenuItem value="7d">Last 7d</MenuItem>
          </TextField>
          <Button startIcon={<RefreshIcon />} onClick={() => mutate()}>
            Refresh
          </Button>
          <Button startIcon={<DownloadIcon />} onClick={() => setShowExportDialog(true)}>
            Export
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab label="Overview" icon={<SpeedIcon />} iconPosition="start" />
          <Tab label="Caching" icon={<StorageIcon />} iconPosition="start" />
          <Tab label="CDN" icon={<CloudIcon />} iconPosition="start" />
          <Tab label="Database" icon={<StorageIcon />} iconPosition="start" />
          <Tab label="API" icon={<CodeIcon />} iconPosition="start" />
          <Tab label="Optimization" icon={<AutoFixHighIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      <Box>
        {activeTab === 0 && renderOverviewTab()}
        {activeTab === 1 && renderCachingTab()}
        {activeTab === 2 && renderCDNTab()}
        {activeTab === 3 && renderDatabaseTab()}
        {activeTab === 4 && renderAPITab()}
        {activeTab === 5 && renderOptimizationTab()}
      </Box>

      <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)}>
        <DialogTitle>Export Performance Metrics</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Choose export format:
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
          <Button onClick={() => { exportToCSV(); setShowExportDialog(false); }} variant="outlined">
            Export CSV
          </Button>
          <Button onClick={() => { exportToPDF(); setShowExportDialog(false); }} variant="contained">
            Export PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
