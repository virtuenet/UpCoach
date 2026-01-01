import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  AlertTitle,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Slider,
} from '@mui/material';
import {
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
  AreaChart,
  Area,
} from 'recharts';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Editor from '@monaco-editor/react';
import { format, formatDistanceToNow } from 'date-fns';
import useSWR from 'swr';
import {
  CheckCircle,
  Error,
  Warning,
  PlayArrow,
  Stop,
  Refresh,
  Assessment,
  Dns,
  CloudQueue,
  Speed,
  Shield,
  BugReport,
  BookmarkBorder,
  Restore,
  SettingsBackupRestore,
  Traffic,
  SwapHoriz,
  Flag,
  Timeline,
  Code,
  BarChart as BarChartIcon,
} from '@mui/icons-material';

/**
 * SRE Dashboard - Site Reliability Engineering Command Center
 *
 * Provides comprehensive visibility into system reliability, SLO tracking,
 * incident management, deployment controls, and on-call scheduling.
 */

interface SLO {
  name: string;
  target: number;
  current: number;
  errorBudget: number;
  budgetRemaining: number;
  burnRate: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface Incident {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  startTime: number;
  resolvedTime?: number;
  affectedServices: string[];
  assignee?: string;
  updates: {
    timestamp: number;
    message: string;
    author: string;
  }[];
}

interface Deployment {
  id: string;
  version: string;
  environment: 'production' | 'staging' | 'development';
  status: 'pending' | 'deploying' | 'success' | 'failed' | 'rolled_back';
  timestamp: number;
  author: string;
  changes: string[];
  health: {
    errorRate: number;
    latency: number;
    throughput: number;
  };
}

interface Service {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  latency: number;
  errorRate: number;
  dependencies: string[];
}

interface Runbook {
  id: string;
  title: string;
  description: string;
  trigger: string;
  steps: string[];
  lastExecuted?: number;
  successRate: number;
}

interface CanaryDeployment {
  id: string;
  version: string;
  trafficPercentage: number;
  status: 'active' | 'promoting' | 'rolling_back';
  metrics: {
    errorRate: number;
    latency: number;
    successRate: number;
  };
  startTime: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const COLORS = {
  healthy: '#4caf50',
  warning: '#ff9800',
  critical: '#f44336',
  info: '#2196f3',
};

export default function SREDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [deploymentDialogOpen, setDeploymentDialogOpen] = useState(false);
  const [runbookDialogOpen, setRunbookDialogOpen] = useState(false);
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null);
  const [canaryTrafficPercentage, setCanaryTrafficPercentage] = useState(10);

  const { data: slos, mutate: mutateSLOs } = useSWR<SLO[]>('/api/sre/slos', fetcher, {
    refreshInterval: 30000,
  });

  const { data: incidents, mutate: mutateIncidents } = useSWR<Incident[]>('/api/sre/incidents', fetcher, {
    refreshInterval: 10000,
  });

  const { data: deployments, mutate: mutateDeployments } = useSWR<Deployment[]>('/api/sre/deployments', fetcher, {
    refreshInterval: 5000,
  });

  const { data: services, mutate: mutateServices } = useSWR<Service[]>('/api/sre/services', fetcher, {
    refreshInterval: 5000,
  });

  const { data: runbooks } = useSWR<Runbook[]>('/api/sre/runbooks', fetcher);

  const { data: canaryDeployment } = useSWR<CanaryDeployment | null>('/api/sre/canary', fetcher, {
    refreshInterval: 5000,
  });

  const [mockSLOs] = useState<SLO[]>([
    {
      name: 'API Availability',
      target: 99.9,
      current: 99.95,
      errorBudget: 43.8,
      budgetRemaining: 38.2,
      burnRate: 0.8,
      status: 'healthy',
    },
    {
      name: 'API Latency (p95)',
      target: 200,
      current: 185,
      errorBudget: 100,
      budgetRemaining: 85,
      burnRate: 0.5,
      status: 'healthy',
    },
    {
      name: 'API Error Rate',
      target: 0.1,
      current: 0.08,
      errorBudget: 1000,
      budgetRemaining: 800,
      burnRate: 0.4,
      status: 'healthy',
    },
    {
      name: 'Database Query Latency',
      target: 50,
      current: 68,
      errorBudget: 100,
      budgetRemaining: 32,
      burnRate: 1.8,
      status: 'warning',
    },
  ]);

  const [mockIncidents] = useState<Incident[]>([
    {
      id: 'inc_001',
      title: 'Database connection pool exhaustion',
      severity: 'high',
      status: 'monitoring',
      startTime: Date.now() - 3600000,
      affectedServices: ['api', 'database'],
      assignee: 'alice@upcoach.com',
      updates: [
        {
          timestamp: Date.now() - 3600000,
          message: 'Detected connection pool exhaustion',
          author: 'System',
        },
        {
          timestamp: Date.now() - 3000000,
          message: 'Increased pool size from 20 to 50',
          author: 'alice@upcoach.com',
        },
        {
          timestamp: Date.now() - 1800000,
          message: 'Monitoring for stability',
          author: 'alice@upcoach.com',
        },
      ],
    },
    {
      id: 'inc_002',
      title: 'Elevated error rates in payment service',
      severity: 'medium',
      status: 'investigating',
      startTime: Date.now() - 1800000,
      affectedServices: ['payment'],
      assignee: 'bob@upcoach.com',
      updates: [
        {
          timestamp: Date.now() - 1800000,
          message: 'Stripe API showing increased latency',
          author: 'System',
        },
      ],
    },
  ]);

  const [mockDeployments] = useState<Deployment[]>([
    {
      id: 'dep_001',
      version: 'v2.34.1',
      environment: 'production',
      status: 'success',
      timestamp: Date.now() - 7200000,
      author: 'charlie@upcoach.com',
      changes: [
        'Fix memory leak in session handler',
        'Optimize database queries',
        'Update dependencies',
      ],
      health: {
        errorRate: 0.05,
        latency: 180,
        throughput: 1250,
      },
    },
    {
      id: 'dep_002',
      version: 'v2.34.0',
      environment: 'production',
      status: 'rolled_back',
      timestamp: Date.now() - 14400000,
      author: 'dave@upcoach.com',
      changes: [
        'New caching layer',
        'API endpoint refactoring',
      ],
      health: {
        errorRate: 2.5,
        latency: 450,
        throughput: 800,
      },
    },
  ]);

  const [mockServices] = useState<Service[]>([
    {
      id: 'api',
      name: 'API Server',
      status: 'healthy',
      uptime: 99.95,
      latency: 185,
      errorRate: 0.08,
      dependencies: ['database', 'cache', 'queue'],
    },
    {
      id: 'database',
      name: 'PostgreSQL',
      status: 'degraded',
      uptime: 99.8,
      latency: 68,
      errorRate: 0.05,
      dependencies: [],
    },
    {
      id: 'cache',
      name: 'Redis',
      status: 'healthy',
      uptime: 99.99,
      latency: 2,
      errorRate: 0.01,
      dependencies: [],
    },
    {
      id: 'queue',
      name: 'RabbitMQ',
      status: 'healthy',
      uptime: 99.95,
      latency: 15,
      errorRate: 0.02,
      dependencies: [],
    },
  ]);

  const [mockRunbooks] = useState<Runbook[]>([
    {
      id: 'rb_001',
      title: 'Database Connection Pool Exhaustion',
      description: 'Steps to handle database connection pool exhaustion',
      trigger: 'Connection pool utilization > 90%',
      steps: [
        'Check current connection count: SELECT count(*) FROM pg_stat_activity;',
        'Identify long-running queries: SELECT * FROM pg_stat_activity WHERE state = \'active\' ORDER BY query_start;',
        'Kill problematic connections if needed: SELECT pg_terminate_backend(pid);',
        'Increase pool size in configuration',
        'Restart application servers',
        'Monitor connection count for 30 minutes',
      ],
      lastExecuted: Date.now() - 3600000,
      successRate: 95,
    },
    {
      id: 'rb_002',
      title: 'High API Latency Response',
      description: 'Diagnose and resolve high API latency',
      trigger: 'P95 latency > 500ms',
      steps: [
        'Check application logs for slow requests',
        'Review database slow query log',
        'Check cache hit rate',
        'Review CloudWatch metrics',
        'Scale up if needed',
        'Enable query caching if not enabled',
      ],
      successRate: 88,
    },
  ]);

  const serviceDependencyNodes: Node[] = mockServices.map((service, index) => ({
    id: service.id,
    type: 'default',
    data: {
      label: (
        <Box textAlign="center">
          <Typography variant="body2" fontWeight="bold">
            {service.name}
          </Typography>
          <Chip
            size="small"
            label={service.status}
            color={
              service.status === 'healthy'
                ? 'success'
                : service.status === 'degraded'
                ? 'warning'
                : 'error'
            }
            sx={{ mt: 0.5 }}
          />
        </Box>
      ),
    },
    position: { x: (index % 2) * 300 + 50, y: Math.floor(index / 2) * 150 + 50 },
    style: {
      background: service.status === 'healthy' ? '#e8f5e9' : service.status === 'degraded' ? '#fff3e0' : '#ffebee',
      border: `2px solid ${service.status === 'healthy' ? '#4caf50' : service.status === 'degraded' ? '#ff9800' : '#f44336'}`,
      borderRadius: 8,
      padding: 10,
      width: 180,
    },
  }));

  const serviceDependencyEdges: Edge[] = mockServices.flatMap((service) =>
    service.dependencies.map((dep) => ({
      id: `${service.id}-${dep}`,
      source: service.id,
      target: dep,
      animated: true,
      style: { stroke: '#666' },
    }))
  );

  const sloChartData = mockSLOs.map((slo) => ({
    name: slo.name,
    current: slo.current,
    target: slo.target,
  }));

  const errorBudgetData = mockSLOs.map((slo) => ({
    name: slo.name,
    remaining: slo.budgetRemaining,
    used: 100 - slo.budgetRemaining,
  }));

  const deploymentTrendData = Array.from({ length: 7 }, (_, i) => ({
    day: format(new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000), 'EEE'),
    success: Math.floor(Math.random() * 10) + 5,
    failed: Math.floor(Math.random() * 3),
  }));

  const onCallSchedule = [
    {
      title: 'Alice (Primary)',
      start: new Date(),
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      color: COLORS.healthy,
    },
    {
      title: 'Bob (Secondary)',
      start: new Date(),
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      color: COLORS.info,
    },
  ];

  const handleCreateIncident = () => {
    setSelectedIncident(null);
    setIncidentDialogOpen(true);
  };

  const handleUpdateIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setIncidentDialogOpen(true);
  };

  const handleDeployRollback = async (deploymentId: string) => {
    console.log('Rolling back deployment:', deploymentId);
    await mutateDeployments();
  };

  const handleExecuteRunbook = (runbook: Runbook) => {
    setSelectedRunbook(runbook);
    setRunbookDialogOpen(true);
  };

  const handleCanaryPromote = async () => {
    console.log('Promoting canary deployment');
  };

  const handleCanaryRollback = async () => {
    console.log('Rolling back canary deployment');
  };

  const handleCanaryTrafficChange = async (percentage: number) => {
    setCanaryTrafficPercentage(percentage);
    console.log('Updating canary traffic to', percentage, '%');
  };

  const renderSLOOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Service Level Objectives
        </Typography>
      </Grid>

      {mockSLOs.map((slo) => (
        <Grid item xs={12} md={6} key={slo.name}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">{slo.name}</Typography>
                <Chip
                  label={slo.status}
                  color={
                    slo.status === 'healthy'
                      ? 'success'
                      : slo.status === 'warning'
                      ? 'warning'
                      : 'error'
                  }
                  size="small"
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Current
                  </Typography>
                  <Typography variant="h4">
                    {slo.name.includes('Latency') ? `${slo.current}ms` : `${slo.current}%`}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Target
                  </Typography>
                  <Typography variant="h4">
                    {slo.name.includes('Latency') ? `${slo.target}ms` : `${slo.target}%`}
                  </Typography>
                </Grid>
              </Grid>

              <Box mt={2}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Error Budget Remaining
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={slo.budgetRemaining}
                  color={
                    slo.budgetRemaining > 50
                      ? 'success'
                      : slo.budgetRemaining > 20
                      ? 'warning'
                      : 'error'
                  }
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                  {slo.budgetRemaining.toFixed(1)}% remaining • Burn rate: {slo.burnRate}x
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="SLO Performance" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sloChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="current" fill={COLORS.healthy} name="Current" />
                <Bar dataKey="target" fill={COLORS.info} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Error Budget Status" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={errorBudgetData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="remaining" fill={COLORS.healthy} name="Remaining" stackId="a" />
                <Bar dataKey="used" fill={COLORS.critical} name="Used" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderIncidents = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Active Incidents</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<BugReport />}
            onClick={handleCreateIncident}
          >
            Create Incident
          </Button>
        </Box>
      </Grid>

      {mockIncidents.map((incident) => (
        <Grid item xs={12} key={incident.id}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="h6">{incident.title}</Typography>
                    <Chip
                      label={incident.severity}
                      color={
                        incident.severity === 'critical'
                          ? 'error'
                          : incident.severity === 'high'
                          ? 'warning'
                          : 'default'
                      }
                      size="small"
                    />
                    <Chip
                      label={incident.status}
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Started {formatDistanceToNow(incident.startTime)} ago
                  </Typography>

                  <Box mt={1}>
                    <Typography variant="body2" color="textSecondary">
                      Affected Services:
                    </Typography>
                    <Box display="flex" gap={1} mt={0.5}>
                      {incident.affectedServices.map((service) => (
                        <Chip key={service} label={service} size="small" />
                      ))}
                    </Box>
                  </Box>

                  {incident.assignee && (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Assignee: {incident.assignee}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Updates
                  </Typography>
                  <List dense>
                    {incident.updates.map((update, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={update.message}
                          secondary={`${format(update.timestamp, 'PPpp')} - ${update.author}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleUpdateIncident(incident)}
                  >
                    Update
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}

      <Grid item xs={12}>
        <Card>
          <CardHeader title="MTTR Trend" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={Array.from({ length: 7 }, (_, i) => ({
                  day: format(new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000), 'EEE'),
                  mttr: Math.floor(Math.random() * 30) + 10,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="mttr" stroke={COLORS.info} name="MTTR" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderDeployments = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Recent Deployments</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudQueue />}
            onClick={() => setDeploymentDialogOpen(true)}
          >
            New Deployment
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Version</TableCell>
                <TableCell>Environment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Health</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockDeployments.map((deployment) => (
                <TableRow key={deployment.id}>
                  <TableCell>{deployment.version}</TableCell>
                  <TableCell>
                    <Chip label={deployment.environment} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={deployment.status}
                      color={
                        deployment.status === 'success'
                          ? 'success'
                          : deployment.status === 'failed' || deployment.status === 'rolled_back'
                          ? 'error'
                          : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDistanceToNow(deployment.timestamp)} ago</TableCell>
                  <TableCell>{deployment.author}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="caption" display="block">
                        Error: {deployment.health.errorRate}%
                      </Typography>
                      <Typography variant="caption" display="block">
                        Latency: {deployment.health.latency}ms
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {deployment.status === 'success' && (
                      <Tooltip title="Rollback">
                        <IconButton
                          size="small"
                          onClick={() => handleDeployRollback(deployment.id)}
                        >
                          <Restore />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Deployment Frequency" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deploymentTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="success" fill={COLORS.healthy} name="Success" stackId="a" />
                <Bar dataKey="failed" fill={COLORS.critical} name="Failed" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Change Failure Rate" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={Array.from({ length: 7 }, (_, i) => ({
                  day: format(new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000), 'EEE'),
                  rate: Math.random() * 5,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis label={{ value: 'Failure Rate %', angle: -90, position: 'insideLeft' }} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="rate" stroke={COLORS.critical} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderServiceDependencies = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Service Dependency Map
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box height={500}>
              <ReactFlow
                nodes={serviceDependencyNodes}
                edges={serviceDependencyEdges}
                fitView
              >
                <Controls />
                <MiniMap />
                <Background />
              </ReactFlow>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Service Health" />
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
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>
                        <Chip
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
                      <TableCell>{service.uptime}%</TableCell>
                      <TableCell>{service.latency}ms</TableCell>
                      <TableCell>{service.errorRate}%</TableCell>
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

  const renderRunbooks = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Runbook Repository
        </Typography>
      </Grid>

      {mockRunbooks.map((runbook) => (
        <Grid item xs={12} md={6} key={runbook.id}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {runbook.title}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                {runbook.description}
              </Typography>

              <Box mb={2}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Trigger:
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {runbook.trigger}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Success Rate: {runbook.successRate}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={runbook.successRate}
                  color="success"
                />
              </Box>

              {runbook.lastExecuted && (
                <Typography variant="caption" color="textSecondary" display="block" mb={2}>
                  Last executed {formatDistanceToNow(runbook.lastExecuted)} ago
                </Typography>
              )}

              <Button
                variant="outlined"
                fullWidth
                onClick={() => handleExecuteRunbook(runbook)}
              >
                View Steps
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderCanaryDeployment = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Canary Deployment
        </Typography>
      </Grid>

      {canaryDeployment || true ? (
        <>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">v2.35.0 Canary</Typography>
                  <Chip label="active" color="primary" />
                </Box>

                <Box mb={3}>
                  <Typography variant="body2" gutterBottom>
                    Traffic Distribution: {canaryTrafficPercentage}%
                  </Typography>
                  <Slider
                    value={canaryTrafficPercentage}
                    onChange={(_, value) => handleCanaryTrafficChange(value as number)}
                    step={5}
                    marks
                    min={0}
                    max={100}
                    valueLabelDisplay="auto"
                  />
                </Box>

                <Grid container spacing={2} mb={3}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary">
                        Error Rate
                      </Typography>
                      <Typography variant="h4" color={0.12 < 0.5 ? 'success.main' : 'error.main'}>
                        0.12%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary">
                        Latency
                      </Typography>
                      <Typography variant="h4" color={175 < 200 ? 'success.main' : 'warning.main'}>
                        175ms
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary">
                        Success Rate
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        99.88%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={handleCanaryPromote}
                    fullWidth
                  >
                    Promote to 100%
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Stop />}
                    onClick={handleCanaryRollback}
                    fullWidth
                  >
                    Rollback
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardHeader title="Canary vs Baseline Metrics" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={Array.from({ length: 20 }, (_, i) => ({
                      time: i,
                      canary: 170 + Math.random() * 20,
                      baseline: 180 + Math.random() * 20,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" label={{ value: 'Time (minutes)', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="canary" stroke={COLORS.info} name="Canary" />
                    <Line type="monotone" dataKey="baseline" stroke={COLORS.warning} name="Baseline" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </>
      ) : (
        <Grid item xs={12}>
          <Alert severity="info">
            <AlertTitle>No Active Canary Deployment</AlertTitle>
            There are currently no canary deployments in progress.
          </Alert>
        </Grid>
      )}
    </Grid>
  );

  const renderOnCall = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          On-Call Schedule
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={onCallSchedule}
              height={600}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        SRE Dashboard
      </Typography>

      <Box mb={3}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label="SLO Overview" icon={<Assessment />} iconPosition="start" />
          <Tab label="Incidents" icon={<Warning />} iconPosition="start" />
          <Tab label="Deployments" icon={<CloudQueue />} iconPosition="start" />
          <Tab label="Dependencies" icon={<Dns />} iconPosition="start" />
          <Tab label="Runbooks" icon={<BookmarkBorder />} iconPosition="start" />
          <Tab label="Canary" icon={<Flag />} iconPosition="start" />
          <Tab label="On-Call" icon={<Shield />} iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderSLOOverview()}
      {activeTab === 1 && renderIncidents()}
      {activeTab === 2 && renderDeployments()}
      {activeTab === 3 && renderServiceDependencies()}
      {activeTab === 4 && renderRunbooks()}
      {activeTab === 5 && renderCanaryDeployment()}
      {activeTab === 6 && renderOnCall()}

      <Dialog
        open={runbookDialogOpen}
        onClose={() => setRunbookDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedRunbook?.title}</DialogTitle>
        <DialogContent>
          {selectedRunbook && (
            <Box>
              <Typography variant="body2" paragraph>
                {selectedRunbook.description}
              </Typography>

              <Typography variant="h6" gutterBottom>
                Steps
              </Typography>
              <List>
                {selectedRunbook.steps.map((step, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`${index + 1}. ${step}`}
                      primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRunbookDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
