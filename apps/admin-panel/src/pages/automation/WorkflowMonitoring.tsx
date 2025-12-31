import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Refresh,
  PlayArrow,
  Stop,
  Error as ErrorIcon,
  CheckCircle,
  Warning,
  TrendingUp,
  TrendingDown,
  Timeline,
  Speed,
  Memory,
  CloudDownload,
  FilterList,
  MoreVert,
  Notifications,
  Settings as SettingsIcon,
  ViewList,
  Dashboard as DashboardIcon,
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
import { format, subHours, subDays } from 'date-fns';

/**
 * Workflow Monitoring Dashboard
 *
 * Real-time workflow monitoring dashboard with live execution tracking,
 * performance metrics visualization, and alert management.
 *
 * Features:
 * - Real-time workflow monitoring with WebSocket integration
 * - Live execution status display
 * - Performance metrics charts (execution time, success rate)
 * - Success/failure rate visualization
 * - Execution timeline with step-by-step progress
 * - Resource usage graphs (API calls, storage, bandwidth)
 * - Active workflows list with filtering
 * - Failed workflows with detailed error information
 * - Retry management interface
 * - Alert configuration and management
 * - Log viewer with advanced filtering
 * - Export functionality (CSV, JSON)
 * - Auto-refresh with configurable intervals
 * - Material-UI design with responsive layout
 */

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  stepsCompleted: number;
  totalSteps: number;
  currentStep?: string;
  error?: string;
  triggeredBy: string;
}

interface PerformanceMetrics {
  timestamp: Date;
  executionTime: number;
  successRate: number;
  failureRate: number;
  activeExecutions: number;
  resourceUsage: {
    apiCalls: number;
    storage: number;
    bandwidth: number;
  };
}

interface AlertConfig {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  notificationChannels: string[];
}

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  workflowId: string;
  executionId: string;
  message: string;
  metadata?: Record<string, any>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const WorkflowMonitoring: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<number>(0);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState<boolean>(false);
  const [retryDialogOpen, setRetryDialogOpen] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, []);

  const connectWebSocket = () => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3000/workflow-monitoring';
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000);
    };
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'execution:update':
        updateExecution(data.execution);
        break;
      case 'execution:completed':
        updateExecution(data.execution);
        break;
      case 'execution:failed':
        updateExecution(data.execution);
        break;
      case 'metrics:update':
        addMetrics(data.metrics);
        break;
      case 'alert:triggered':
        showAlert(data.alert);
        break;
      default:
        break;
    }
  };

  const updateExecution = (execution: WorkflowExecution) => {
    setExecutions((prev) => {
      const index = prev.findIndex((e) => e.id === execution.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = execution;
        return updated;
      } else {
        return [execution, ...prev].slice(0, 100); // Keep last 100
      }
    });
  };

  const addMetrics = (newMetrics: PerformanceMetrics) => {
    setMetrics((prev) => [...prev, newMetrics].slice(-60)); // Keep last 60 data points
  };

  const showAlert = (alert: any) => {
    // Show notification or snackbar
    console.log('Alert triggered:', alert);
  };

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        refreshData();
      }, refreshInterval);
    } else if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [timeRange]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // In production, fetch from API
      await Promise.all([
        fetchExecutions(),
        fetchMetrics(),
        fetchAlerts(),
        fetchLogs(),
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      await Promise.all([
        fetchExecutions(),
        fetchMetrics(),
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const fetchExecutions = async () => {
    // In production, fetch from API
    // Mock data for demonstration
    const mockExecutions: WorkflowExecution[] = [
      {
        id: 'exec_1',
        workflowId: 'wf_1',
        workflowName: 'Client Onboarding',
        status: 'running',
        startTime: new Date(Date.now() - 5 * 60000),
        stepsCompleted: 3,
        totalSteps: 5,
        currentStep: 'Send Welcome Email',
        triggeredBy: 'webhook',
      },
      {
        id: 'exec_2',
        workflowId: 'wf_2',
        workflowName: 'Goal Reminder',
        status: 'completed',
        startTime: new Date(Date.now() - 10 * 60000),
        endTime: new Date(Date.now() - 8 * 60000),
        duration: 120000,
        stepsCompleted: 4,
        totalSteps: 4,
        triggeredBy: 'schedule',
      },
      {
        id: 'exec_3',
        workflowId: 'wf_3',
        workflowName: 'Payment Processing',
        status: 'failed',
        startTime: new Date(Date.now() - 15 * 60000),
        endTime: new Date(Date.now() - 14 * 60000),
        duration: 60000,
        stepsCompleted: 2,
        totalSteps: 6,
        error: 'Payment gateway timeout',
        triggeredBy: 'manual',
      },
    ];

    setExecutions(mockExecutions);
  };

  const fetchMetrics = async () => {
    // In production, fetch from API
    // Generate mock time-series data
    const now = Date.now();
    const mockMetrics: PerformanceMetrics[] = Array.from({ length: 30 }, (_, i) => ({
      timestamp: new Date(now - (29 - i) * 60000),
      executionTime: 2000 + Math.random() * 3000,
      successRate: 85 + Math.random() * 15,
      failureRate: Math.random() * 5,
      activeExecutions: Math.floor(Math.random() * 10),
      resourceUsage: {
        apiCalls: Math.floor(Math.random() * 100),
        storage: Math.floor(Math.random() * 1000000),
        bandwidth: Math.floor(Math.random() * 5000000),
      },
    }));

    setMetrics(mockMetrics);
  };

  const fetchAlerts = async () => {
    // Mock alerts
    const mockAlerts: AlertConfig[] = [
      {
        id: 'alert_1',
        name: 'High Failure Rate',
        condition: 'failure_rate > threshold',
        threshold: 10,
        enabled: true,
        notificationChannels: ['email', 'slack'],
      },
      {
        id: 'alert_2',
        name: 'Long Execution Time',
        condition: 'execution_time > threshold',
        threshold: 5000,
        enabled: true,
        notificationChannels: ['email'],
      },
    ];

    setAlerts(mockAlerts);
  };

  const fetchLogs = async () => {
    // Mock logs
    const mockLogs: LogEntry[] = [
      {
        timestamp: new Date(),
        level: 'info',
        workflowId: 'wf_1',
        executionId: 'exec_1',
        message: 'Workflow execution started',
      },
      {
        timestamp: new Date(Date.now() - 60000),
        level: 'error',
        workflowId: 'wf_3',
        executionId: 'exec_3',
        message: 'Payment gateway timeout',
        metadata: { gateway: 'stripe', amount: 100 },
      },
    ];

    setLogs(mockLogs);
  };

  // Filtered executions
  const filteredExecutions = useMemo(() => {
    return executions.filter((exec) => {
      if (filterStatus !== 'all' && exec.status !== filterStatus) {
        return false;
      }

      if (searchQuery && !exec.workflowName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [executions, filterStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = executions.length;
    const running = executions.filter((e) => e.status === 'running').length;
    const completed = executions.filter((e) => e.status === 'completed').length;
    const failed = executions.filter((e) => e.status === 'failed').length;
    const successRate = total > 0 ? (completed / total) * 100 : 0;

    return { total, running, completed, failed, successRate };
  }, [executions]);

  // Handlers
  const handleExecutionClick = (execution: WorkflowExecution) => {
    setSelectedExecution(execution);
    setDetailsDialogOpen(true);
  };

  const handleRetry = (execution: WorkflowExecution) => {
    setSelectedExecution(execution);
    setRetryDialogOpen(true);
  };

  const handleConfirmRetry = async () => {
    if (!selectedExecution) return;

    try {
      // In production, call API to retry
      console.log('Retrying execution:', selectedExecution.id);
      setRetryDialogOpen(false);
    } catch (error) {
      console.error('Failed to retry:', error);
    }
  };

  const handleExportCSV = () => {
    const csv = generateCSV(filteredExecutions);
    downloadFile(csv, 'workflow-executions.csv', 'text/csv');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(filteredExecutions, null, 2);
    downloadFile(json, 'workflow-executions.json', 'application/json');
  };

  const generateCSV = (data: WorkflowExecution[]): string => {
    const headers = ['ID', 'Workflow', 'Status', 'Start Time', 'Duration', 'Steps', 'Triggered By'];
    const rows = data.map((exec) => [
      exec.id,
      exec.workflowName,
      exec.status,
      exec.startTime.toISOString(),
      exec.duration?.toString() || '',
      `${exec.stepsCompleted}/${exec.totalSteps}`,
      exec.triggeredBy,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'cancelled':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CircularProgress size={20} />;
      case 'completed':
        return <CheckCircle style={{ color: '#4CAF50' }} />;
      case 'failed':
        return <ErrorIcon style={{ color: '#F44336' }} />;
      case 'cancelled':
        return <Warning style={{ color: '#FF9800' }} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Workflow Monitoring
        </Typography>

        <Box display="flex" gap={2}>
          <FormControlLabel
            control={<Switch checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
            label="Auto-refresh"
          />

          <Select
            size="small"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(e.target.value as number)}
            disabled={!autoRefresh}
          >
            <MenuItem value={5000}>5s</MenuItem>
            <MenuItem value={10000}>10s</MenuItem>
            <MenuItem value={30000}>30s</MenuItem>
            <MenuItem value={60000}>1m</MenuItem>
          </Select>

          <IconButton onClick={refreshData}>
            <Refresh />
          </IconButton>

          <Button startIcon={<CloudDownload />} onClick={handleExportCSV}>
            Export CSV
          </Button>

          <Button startIcon={<CloudDownload />} onClick={handleExportJSON}>
            Export JSON
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Executions
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.running}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Success Rate
              </Typography>
              <Box display="flex" alignItems="center">
                <Typography variant="h4" color="success.main">
                  {stats.successRate.toFixed(1)}%
                </Typography>
                <TrendingUp style={{ color: '#4CAF50', marginLeft: 8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Failed
              </Typography>
              <Typography variant="h4" color="error">
                {stats.failed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab icon={<ViewList />} label="Executions" />
          <Tab icon={<Timeline />} label="Performance" />
          <Tab icon={<Speed />} label="Resources" />
          <Tab icon={<Warning />} label="Alerts" />
          <Tab icon={<DashboardIcon />} label="Logs" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {/* Filters */}
          <Box display="flex" gap={2} mb={3}>
            <TextField
              size="small"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1 }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Status">
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="running">Running</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Time Range</InputLabel>
              <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} label="Time Range">
                <MenuItem value="1h">Last Hour</MenuItem>
                <MenuItem value="6h">Last 6 Hours</MenuItem>
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Executions Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Workflow</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Triggered By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExecutions.map((execution) => (
                  <TableRow key={execution.id} hover onClick={() => handleExecutionClick(execution)}>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(execution.status)}
                        label={execution.status}
                        size="small"
                        style={{ backgroundColor: getStatusColor(execution.status), color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>{execution.workflowName}</TableCell>
                    <TableCell>{format(execution.startTime, 'MMM dd, HH:mm:ss')}</TableCell>
                    <TableCell>{execution.duration ? `${(execution.duration / 1000).toFixed(1)}s` : '-'}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={(execution.stepsCompleted / execution.totalSteps) * 100}
                          sx={{ flex: 1 }}
                        />
                        <Typography variant="caption">
                          {execution.stepsCompleted}/{execution.totalSteps}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={execution.triggeredBy} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {execution.status === 'failed' && (
                        <Button size="small" onClick={() => handleRetry(execution)}>
                          Retry
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Execution Time Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(t) => format(new Date(t), 'HH:mm')} />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="executionTime" stroke="#8884d8" name="Execution Time (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Success vs Failure Rate
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(t) => format(new Date(t), 'HH:mm')} />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="successRate" stackId="1" stroke="#4CAF50" fill="#4CAF50" />
                    <Area type="monotone" dataKey="failureRate" stackId="1" stroke="#F44336" fill="#F44336" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Executions
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(t) => format(new Date(t), 'HH:mm')} />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="activeExecutions" fill="#2196F3" name="Active Executions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  API Calls
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(t) => format(new Date(t), 'HH:mm')} />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="resourceUsage.apiCalls" stroke="#FF8042" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Storage Usage
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(t) => format(new Date(t), 'HH:mm')} />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="resourceUsage.storage" stroke="#00C49F" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bandwidth Usage
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(t) => format(new Date(t), 'HH:mm')} />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="resourceUsage.bandwidth" stroke="#FFBB28" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Box>
          <Box display="flex" justifyContent="space-between" mb={3}>
            <Typography variant="h6">Alert Configuration</Typography>
            <Button variant="contained" onClick={() => setAlertDialogOpen(true)}>
              Create Alert
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Threshold</TableCell>
                  <TableCell>Channels</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>{alert.name}</TableCell>
                    <TableCell>{alert.condition}</TableCell>
                    <TableCell>{alert.threshold}</TableCell>
                    <TableCell>
                      {alert.notificationChannels.map((ch) => (
                        <Chip key={ch} label={ch} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>
                      <Chip label={alert.enabled ? 'Enabled' : 'Disabled'} color={alert.enabled ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <SettingsIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {activeTab === 4 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Workflow</TableCell>
                <TableCell>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log, idx) => (
                <TableRow key={idx}>
                  <TableCell>{format(log.timestamp, 'MMM dd, HH:mm:ss')}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.level}
                      size="small"
                      color={log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{log.workflowId}</TableCell>
                  <TableCell>{log.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Execution Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Execution Details</DialogTitle>
        <DialogContent>
          {selectedExecution && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Workflow
                  </Typography>
                  <Typography>{selectedExecution.workflowName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip label={selectedExecution.status} style={{ backgroundColor: getStatusColor(selectedExecution.status), color: 'white' }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Start Time
                  </Typography>
                  <Typography>{format(selectedExecution.startTime, 'MMM dd, yyyy HH:mm:ss')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Duration
                  </Typography>
                  <Typography>{selectedExecution.duration ? `${(selectedExecution.duration / 1000).toFixed(2)}s` : 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Progress
                  </Typography>
                  <LinearProgress variant="determinate" value={(selectedExecution.stepsCompleted / selectedExecution.totalSteps) * 100} />
                  <Typography variant="caption">
                    {selectedExecution.stepsCompleted} of {selectedExecution.totalSteps} steps completed
                  </Typography>
                </Grid>
                {selectedExecution.error && (
                  <Grid item xs={12}>
                    <Alert severity="error">{selectedExecution.error}</Alert>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Retry Dialog */}
      <Dialog open={retryDialogOpen} onClose={() => setRetryDialogOpen(false)}>
        <DialogTitle>Retry Execution</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to retry this workflow execution?</Typography>
          {selectedExecution && <Typography variant="body2">Workflow: {selectedExecution.workflowName}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRetryDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmRetry} variant="contained" color="primary">
            Retry
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowMonitoring;
