import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  Stack,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
} from '@mui/material';
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
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { format, subHours, subDays, subMinutes } from 'date-fns';
import useSWR from 'swr';
import { io, Socket } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { FixedSizeList } from 'react-window';

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

interface TimeSeriesData {
  timestamp: number;
  value: number;
  label?: string;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  latency: number;
  errorRate: number;
  lastCheck: number;
}

interface Trace {
  traceId: string;
  serviceName: string;
  operationName: string;
  startTime: number;
  duration: number;
  spanCount: number;
  errorCount: number;
  status: 'success' | 'error';
}

interface TraceSpan {
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  startTime: number;
  duration: number;
  status: string;
  attributes: Record<string, any>;
  events: Array<{
    name: string;
    timestamp: number;
    attributes?: Record<string, any>;
  }>;
}

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  service: string;
  metadata?: Record<string, any>;
  traceId?: string;
  spanId?: string;
}

interface ErrorGroup {
  id: string;
  type: string;
  message: string;
  count: number;
  lastSeen: number;
  firstSeen: number;
  stackTrace: string;
  service: string;
  affectedUsers: number;
}

interface Alert {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'firing' | 'resolved' | 'silenced';
  startTime: number;
  endTime?: number;
  message: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

interface SLO {
  name: string;
  target: number;
  current: number;
  errorBudget: number;
  budgetRemaining: number;
  window: string;
  status: 'healthy' | 'at-risk' | 'breached';
}

interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert';
  title: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
};

const ObservabilityDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState<'5m' | '15m' | '1h' | '6h' | '24h' | '7d'>('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState({
    level: 'all',
    service: 'all',
    search: '',
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<Map<string, TimeSeriesData[]>>(new Map());

  // Fetch service health
  const { data: serviceHealth, error: serviceHealthError } = useSWR<ServiceHealth[]>(
    '/api/observability/health',
    fetcher,
    { refreshInterval: autoRefresh ? refreshInterval : 0 }
  );

  // Fetch metrics
  const { data: metrics, error: metricsError } = useSWR<Record<string, TimeSeriesData[]>>(
    `/api/observability/metrics?range=${timeRange}`,
    fetcher,
    { refreshInterval: autoRefresh ? refreshInterval : 0 }
  );

  // Fetch traces
  const { data: traces, error: tracesError } = useSWR<Trace[]>(
    `/api/observability/traces?range=${timeRange}&limit=100`,
    fetcher,
    { refreshInterval: autoRefresh ? refreshInterval : 0 }
  );

  // Fetch logs
  const { data: logs, error: logsError } = useSWR<LogEntry[]>(
    `/api/observability/logs?range=${timeRange}&level=${logFilter.level}&service=${logFilter.service}&search=${logFilter.search}`,
    fetcher,
    { refreshInterval: autoRefresh ? refreshInterval : 0 }
  );

  // Fetch errors
  const { data: errors, error: errorsError } = useSWR<ErrorGroup[]>(
    `/api/observability/errors?range=${timeRange}`,
    fetcher,
    { refreshInterval: autoRefresh ? refreshInterval : 0 }
  );

  // Fetch alerts
  const { data: alerts, error: alertsError } = useSWR<Alert[]>(
    '/api/observability/alerts',
    fetcher,
    { refreshInterval: autoRefresh ? refreshInterval : 0 }
  );

  // Fetch SLOs
  const { data: slos, error: slosError } = useSWR<SLO[]>(
    '/api/observability/slos',
    fetcher,
    { refreshInterval: autoRefresh ? refreshInterval : 0 }
  );

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = io('http://localhost:3000', {
      path: '/api/observability/socket',
    });

    ws.on('connect', () => {
      console.log('WebSocket connected');
    });

    ws.on('metric', (data: Metric) => {
      setRealtimeMetrics((prev) => {
        const current = prev.get(data.name) || [];
        const updated = [
          ...current,
          { timestamp: data.timestamp, value: data.value, label: data.labels?.label },
        ].slice(-100); // Keep last 100 points

        const newMap = new Map(prev);
        newMap.set(data.name, updated);
        return newMap;
      });
    });

    ws.on('alert', (alert: Alert) => {
      console.log('New alert:', alert);
    });

    ws.on('error', (error: ErrorGroup) => {
      console.log('New error:', error);
    });

    ws.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  // Active alerts count
  const activeAlertsCount = useMemo(() => {
    return alerts?.filter((a) => a.status === 'firing').length || 0;
  }, [alerts]);

  // Critical alerts count
  const criticalAlertsCount = useMemo(() => {
    return alerts?.filter((a) => a.status === 'firing' && a.severity === 'critical').length || 0;
  }, [alerts]);

  // Service status distribution
  const serviceStatusDistribution = useMemo(() => {
    if (!serviceHealth) return [];

    const distribution = {
      healthy: 0,
      degraded: 0,
      down: 0,
    };

    serviceHealth.forEach((service) => {
      distribution[service.status]++;
    });

    return [
      { name: 'Healthy', value: distribution.healthy, color: '#4caf50' },
      { name: 'Degraded', value: distribution.degraded, color: '#ff9800' },
      { name: 'Down', value: distribution.down, color: '#f44336' },
    ];
  }, [serviceHealth]);

  // Error rate over time
  const errorRateData = useMemo(() => {
    if (!metrics?.['http_requests_total']) return [];

    const data: TimeSeriesData[] = [];
    const errorMetrics = metrics['http_requests_total'].filter(
      (m) => m.label && parseInt(m.label) >= 400
    );
    const totalMetrics = metrics['http_requests_total'];

    for (let i = 0; i < totalMetrics.length; i++) {
      const errors = errorMetrics[i]?.value || 0;
      const total = totalMetrics[i]?.value || 1;
      const errorRate = (errors / total) * 100;

      data.push({
        timestamp: totalMetrics[i].timestamp,
        value: errorRate,
      });
    }

    return data;
  }, [metrics]);

  // Latency percentiles
  const latencyPercentilesData = useMemo(() => {
    if (!metrics?.['http_request_duration_seconds']) return [];

    return metrics['http_request_duration_seconds'].map((m) => ({
      timestamp: m.timestamp,
      value: m.value * 1000, // Convert to ms
      label: m.label,
    }));
  }, [metrics]);

  // Top endpoints by traffic
  const topEndpoints = useMemo(() => {
    if (!metrics?.['http_requests_total']) return [];

    const endpointCounts: Record<string, number> = {};

    metrics['http_requests_total'].forEach((m) => {
      if (m.label) {
        endpointCounts[m.label] = (endpointCounts[m.label] || 0) + m.value;
      }
    });

    return Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [metrics]);

  // Database query performance
  const dbQueryPerformance = useMemo(() => {
    if (!metrics?.['db_query_duration_seconds']) return [];

    return metrics['db_query_duration_seconds']
      .map((m) => ({
        timestamp: m.timestamp,
        value: m.value * 1000,
        table: m.label,
      }))
      .slice(-50);
  }, [metrics]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleExport = (format: 'pdf' | 'csv' | 'json') => {
    console.log(`Exporting as ${format}...`);
    // Implementation would generate and download file
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    fetch(`/api/observability/alerts/${alertId}/acknowledge`, {
      method: 'POST',
    }).then(() => {
      console.log('Alert acknowledged');
    });
  };

  const handleResolveAlert = (alertId: string) => {
    fetch(`/api/observability/alerts/${alertId}/resolve`, {
      method: 'POST',
    }).then(() => {
      console.log('Alert resolved');
    });
  };

  const handleSilenceAlert = (alertId: string, duration: number) => {
    fetch(`/api/observability/alerts/${alertId}/silence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration }),
    }).then(() => {
      console.log('Alert silenced');
    });
  };

  const renderOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <DashboardIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{serviceHealth?.length || 0}</Typography>
                <Typography color="text.secondary">Services</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Badge badgeContent={activeAlertsCount} color="error">
                <Avatar sx={{ bgcolor: activeAlertsCount > 0 ? 'error.main' : 'success.main' }}>
                  <NotificationsIcon />
                </Avatar>
              </Badge>
              <Box>
                <Typography variant="h4">{activeAlertsCount}</Typography>
                <Typography color="text.secondary">Active Alerts</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <ErrorIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{errors?.length || 0}</Typography>
                <Typography color="text.secondary">Error Groups</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <TimelineIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{traces?.length || 0}</Typography>
                <Typography color="text.secondary">Recent Traces</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {criticalAlertsCount > 0 && (
        <Grid item xs={12}>
          <Alert severity="error">
            <AlertTitle>Critical Alerts</AlertTitle>
            You have {criticalAlertsCount} critical alert{criticalAlertsCount !== 1 ? 's' : ''} that require immediate attention.
          </Alert>
        </Grid>
      )}

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Service Health" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceStatusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {serviceStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
          <CardHeader title="Error Rate" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={errorRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) => format(new Date(ts), 'HH:mm')}
                />
                <YAxis label={{ value: 'Error Rate (%)', angle: -90, position: 'insideLeft' }} />
                <RechartsTooltip
                  labelFormatter={(ts) => format(new Date(ts as number), 'yyyy-MM-dd HH:mm:ss')}
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                />
                <Area type="monotone" dataKey="value" stroke="#f44336" fill="#f44336" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Services Status" />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Uptime</TableCell>
                    <TableCell>Latency</TableCell>
                    <TableCell>Error Rate</TableCell>
                    <TableCell>Last Check</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {serviceHealth?.map((service) => (
                    <TableRow key={service.name}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>
                        <Chip
                          icon={
                            service.status === 'healthy' ? (
                              <CheckCircleIcon />
                            ) : service.status === 'degraded' ? (
                              <WarningIcon />
                            ) : (
                              <ErrorIcon />
                            )
                          }
                          label={service.status}
                          color={
                            service.status === 'healthy'
                              ? 'success'
                              : service.status === 'degraded'
                              ? 'warning'
                              : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{service.uptime.toFixed(2)}%</TableCell>
                      <TableCell>{service.latency.toFixed(0)}ms</TableCell>
                      <TableCell>{service.errorRate.toFixed(2)}%</TableCell>
                      <TableCell>{format(new Date(service.lastCheck), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
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

  const renderMetrics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Request Latency"
            subheader="P50, P95, P99 percentiles"
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={latencyPercentilesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) => format(new Date(ts), 'HH:mm')}
                />
                <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
                <RechartsTooltip
                  labelFormatter={(ts) => format(new Date(ts as number), 'yyyy-MM-dd HH:mm:ss')}
                />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" name="Latency" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Database Query Performance" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dbQueryPerformance.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) => format(new Date(ts), 'HH:mm')}
                />
                <YAxis label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }} />
                <RechartsTooltip
                  labelFormatter={(ts) => format(new Date(ts as number), 'yyyy-MM-dd HH:mm:ss')}
                />
                <Bar dataKey="value" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Top Endpoints by Traffic" />
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topEndpoints} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="endpoint" type="category" width={200} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <SpeedIcon fontSize="large" color="primary" />
              <Box>
                <Typography variant="h5">
                  {metrics?.['infrastructure_cpu_percent']?.[0]?.value.toFixed(1) || 0}%
                </Typography>
                <Typography color="text.secondary">CPU Usage</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <MemoryIcon fontSize="large" color="primary" />
              <Box>
                <Typography variant="h5">
                  {((metrics?.['infrastructure_memory_bytes']?.[0]?.value || 0) / 1073741824).toFixed(2)} GB
                </Typography>
                <Typography color="text.secondary">Memory Usage</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <StorageIcon fontSize="large" color="primary" />
              <Box>
                <Typography variant="h5">
                  {((metrics?.['infrastructure_disk_bytes']?.[0]?.value || 0) / 1073741824).toFixed(2)} GB
                </Typography>
                <Typography color="text.secondary">Disk Usage</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <NetworkIcon fontSize="large" color="primary" />
              <Box>
                <Typography variant="h5">
                  {metrics?.['infrastructure_connections']?.[0]?.value || 0}
                </Typography>
                <Typography color="text.secondary">Connections</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTraces = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Recent Traces"
            action={
              <TextField
                placeholder="Search traces..."
                size="small"
                InputProps={{
                  startAdornment: <SearchIcon />,
                }}
              />
            }
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Trace ID</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Operation</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Spans</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {traces?.map((trace) => (
                    <TableRow key={trace.traceId}>
                      <TableCell>
                        <code>{trace.traceId.substring(0, 16)}...</code>
                      </TableCell>
                      <TableCell>{trace.serviceName}</TableCell>
                      <TableCell>{trace.operationName}</TableCell>
                      <TableCell>{format(new Date(trace.startTime), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                      <TableCell>{trace.duration.toFixed(0)}ms</TableCell>
                      <TableCell>{trace.spanCount}</TableCell>
                      <TableCell>
                        <Chip
                          label={trace.status}
                          color={trace.status === 'success' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => setSelectedTrace(trace.traceId)}
                        >
                          View Details
                        </Button>
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

  const renderLogs = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Logs"
            action={
              <Stack direction="row" spacing={2}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Level</InputLabel>
                  <Select
                    value={logFilter.level}
                    label="Level"
                    onChange={(e) => setLogFilter({ ...logFilter, level: e.target.value })}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="debug">Debug</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="warn">Warning</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                    <MenuItem value="fatal">Fatal</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Service</InputLabel>
                  <Select
                    value={logFilter.service}
                    label="Service"
                    onChange={(e) => setLogFilter({ ...logFilter, service: e.target.value })}
                  >
                    <MenuItem value="all">All Services</MenuItem>
                    {serviceHealth?.map((service) => (
                      <MenuItem key={service.name} value={service.name}>
                        {service.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  placeholder="Search logs..."
                  size="small"
                  value={logFilter.search}
                  onChange={(e) => setLogFilter({ ...logFilter, search: e.target.value })}
                  InputProps={{
                    startAdornment: <SearchIcon />,
                  }}
                />
              </Stack>
            }
          />
          <CardContent>
            <Box sx={{ height: 600, fontFamily: 'monospace', fontSize: '0.875rem' }}>
              <Editor
                height="100%"
                defaultLanguage="json"
                value={JSON.stringify(logs || [], null, 2)}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                }}
                theme="vs-dark"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderErrors = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title="Error Groups" />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Error Type</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Count</TableCell>
                    <TableCell>Affected Users</TableCell>
                    <TableCell>First Seen</TableCell>
                    <TableCell>Last Seen</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errors?.map((error) => (
                    <TableRow key={error.id}>
                      <TableCell>
                        <code>{error.type}</code>
                      </TableCell>
                      <TableCell>{error.message.substring(0, 50)}...</TableCell>
                      <TableCell>{error.service}</TableCell>
                      <TableCell>
                        <Chip label={error.count} color="error" size="small" />
                      </TableCell>
                      <TableCell>{error.affectedUsers}</TableCell>
                      <TableCell>{format(new Date(error.firstSeen), 'yyyy-MM-dd HH:mm')}</TableCell>
                      <TableCell>{format(new Date(error.lastSeen), 'yyyy-MM-dd HH:mm')}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => setSelectedError(error.id)}
                        >
                          View Details
                        </Button>
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

  const renderAlerts = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title="Active Alerts" />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Alert</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alerts?.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>{alert.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={alert.severity}
                          color={
                            alert.severity === 'critical'
                              ? 'error'
                              : alert.severity === 'high'
                              ? 'warning'
                              : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={alert.status} size="small" />
                      </TableCell>
                      <TableCell>{format(new Date(alert.startTime), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                      <TableCell>
                        {alert.endTime
                          ? `${((alert.endTime - alert.startTime) / 60000).toFixed(0)}m`
                          : `${((Date.now() - alert.startTime) / 60000).toFixed(0)}m`}
                      </TableCell>
                      <TableCell>{alert.message}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            disabled={alert.status !== 'firing'}
                          >
                            Ack
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleResolveAlert(alert.id)}
                            disabled={alert.status === 'resolved'}
                          >
                            Resolve
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleSilenceAlert(alert.id, 3600000)}
                            disabled={alert.status === 'silenced'}
                          >
                            Silence
                          </Button>
                        </Stack>
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

  const renderSLOs = () => (
    <Grid container spacing={3}>
      {slos?.map((slo) => (
        <Grid item xs={12} md={6} key={slo.name}>
          <Card>
            <CardHeader
              title={slo.name}
              subheader={`Target: ${(slo.target * 100).toFixed(2)}%`}
              action={
                <Chip
                  label={slo.status}
                  color={
                    slo.status === 'healthy'
                      ? 'success'
                      : slo.status === 'at-risk'
                      ? 'warning'
                      : 'error'
                  }
                />
              }
            />
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Current SLI
                  </Typography>
                  <Typography variant="h4">
                    {(slo.current * 100).toFixed(3)}%
                    {slo.current >= slo.target ? (
                      <TrendingUpIcon color="success" />
                    ) : (
                      <TrendingDownIcon color="error" />
                    )}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Error Budget Remaining
                  </Typography>
                  <Typography variant="h5">
                    {(slo.budgetRemaining * 100).toFixed(2)}%
                  </Typography>
                </Box>
                <Box sx={{ width: '100%' }}>
                  <Box
                    sx={{
                      width: '100%',
                      height: 20,
                      bgcolor: 'grey.300',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${slo.budgetRemaining * 100}%`,
                        height: '100%',
                        bgcolor:
                          slo.budgetRemaining > 0.5
                            ? 'success.main'
                            : slo.budgetRemaining > 0.2
                            ? 'warning.main'
                            : 'error.main',
                      }}
                    />
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Window: {slo.window}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Observability Dashboard
          </Typography>
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value as any)}
              >
                <MenuItem value="5m">Last 5 minutes</MenuItem>
                <MenuItem value="15m">Last 15 minutes</MenuItem>
                <MenuItem value="1h">Last hour</MenuItem>
                <MenuItem value="6h">Last 6 hours</MenuItem>
                <MenuItem value="24h">Last 24 hours</MenuItem>
                <MenuItem value="7d">Last 7 days</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
              }
              label="Auto Refresh"
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                window.location.reload();
              }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('pdf')}
            >
              Export
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Metrics" />
          <Tab label="Traces" />
          <Tab label="Logs" />
          <Tab label="Errors" />
          <Tab label="Alerts" />
          <Tab label="SLO" />
        </Tabs>
      </Box>

      <Box>
        {activeTab === 0 && renderOverview()}
        {activeTab === 1 && renderMetrics()}
        {activeTab === 2 && renderTraces()}
        {activeTab === 3 && renderLogs()}
        {activeTab === 4 && renderErrors()}
        {activeTab === 5 && renderAlerts()}
        {activeTab === 6 && renderSLOs()}
      </Box>
    </Container>
  );
};

export default ObservabilityDashboard;
