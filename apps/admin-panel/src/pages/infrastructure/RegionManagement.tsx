import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  Tooltip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
} from 'react-leaflet';
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
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Editor from '@monaco-editor/react';
import io, { Socket } from 'socket.io-client';
import useSWR from 'swr';
import axios from 'axios';
import { format, subHours, subDays } from 'date-fns';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface Region {
  id: string;
  name: string;
  location: string;
  endpoint: string;
  latitude: number;
  longitude: number;
  priority: 'primary' | 'secondary';
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  latencyP95: number;
  healthScore: number;
  currentLoad: number;
  maxCapacity: number;
  version: string;
}

interface TrafficAnalytics {
  requestsPerSecond: number;
  bandwidthMbps: number;
  cacheHitRate: number;
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  totalRequests: number;
  regionalDistribution: Record<string, number>;
  topEndpoints: Array<{ path: string; requests: number }>;
  timestamp: Date;
}

interface ReplicationStatus {
  region: string;
  lag: number;
  throughput: number;
  conflictRate: number;
  queueDepth: number;
}

interface DeploymentStatus {
  region: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  version: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

interface CostData {
  region: string;
  compute: number;
  storage: number;
  network: number;
  dataTransfer: number;
  total: number;
}

interface CapacityMetrics {
  region: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface FailoverHistory {
  id: string;
  fromRegion: string;
  toRegion: string;
  reason: string;
  triggeredAt: Date;
  completedAt?: Date;
  automatic: boolean;
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#8dd1e1',
];

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export const RegionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [failoverDialogOpen, setFailoverDialogOpen] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [deployVersion, setDeployVersion] = useState('');
  const [configJson, setConfigJson] = useState('{}');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [autoFailoverEnabled, setAutoFailoverEnabled] = useState(true);

  const { data: regions, mutate: mutateRegions } = useSWR<Region[]>(
    '/api/infrastructure/regions',
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: trafficAnalytics } = useSWR<TrafficAnalytics>(
    '/api/infrastructure/traffic-analytics',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: replicationStatus } = useSWR<ReplicationStatus[]>(
    '/api/infrastructure/replication-status',
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: deploymentStatus } = useSWR<DeploymentStatus[]>(
    '/api/infrastructure/deployment-status',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: costData } = useSWR<CostData[]>(
    '/api/infrastructure/costs',
    fetcher,
    { refreshInterval: 3600000 }
  );

  const { data: capacityMetrics } = useSWR<CapacityMetrics[]>(
    '/api/infrastructure/capacity',
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: failoverHistory } = useSWR<FailoverHistory[]>(
    '/api/infrastructure/failover-history',
    fetcher
  );

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:3000', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
    });

    newSocket.on('regionStatusUpdate', (data: Region) => {
      mutateRegions();
    });

    newSocket.on('failoverTriggered', (data: any) => {
      setSnackbarMessage(`Failover triggered: ${data.fromRegion} → ${data.toRegion}`);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      mutateRegions();
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [mutateRegions]);

  const handleFailover = async () => {
    if (!selectedRegion) return;

    try {
      await axios.post('/api/infrastructure/failover', {
        targetRegion: selectedRegion,
      });

      setSnackbarMessage(`Failover to ${selectedRegion} initiated successfully`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setFailoverDialogOpen(false);
      mutateRegions();
    } catch (error) {
      setSnackbarMessage('Failover failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDeploy = async () => {
    if (selectedRegions.length === 0 || !deployVersion) return;

    try {
      await axios.post('/api/infrastructure/deploy', {
        regions: selectedRegions,
        version: deployVersion,
      });

      setSnackbarMessage('Deployment initiated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setDeployDialogOpen(false);
    } catch (error) {
      setSnackbarMessage('Deployment failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedRegion) return;

    try {
      JSON.parse(configJson);

      await axios.put(`/api/infrastructure/regions/${selectedRegion}/config`, {
        config: JSON.parse(configJson),
      });

      setSnackbarMessage('Configuration saved successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setConfigDialogOpen(false);
    } catch (error) {
      setSnackbarMessage('Invalid JSON or save failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleToggleAutoFailover = async () => {
    try {
      await axios.put('/api/infrastructure/auto-failover', {
        enabled: !autoFailoverEnabled,
      });

      setAutoFailoverEnabled(!autoFailoverEnabled);
      setSnackbarMessage(
        `Auto-failover ${!autoFailoverEnabled ? 'enabled' : 'disabled'}`
      );
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to update auto-failover setting');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
      case 'completed':
        return '#4caf50';
      case 'degraded':
      case 'in-progress':
        return '#ff9800';
      case 'down':
      case 'failed':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const latencyHistoryData = useMemo(() => {
    const data = [];
    const now = Date.now();

    for (let i = 23; i >= 0; i--) {
      const timestamp = subHours(new Date(now), i);
      const dataPoint: any = {
        time: format(timestamp, 'HH:mm'),
      };

      regions?.forEach((region) => {
        dataPoint[region.id] = Math.random() * 100 + 50;
      });

      data.push(dataPoint);
    }

    return data;
  }, [regions]);

  const costTrendData = useMemo(() => {
    const data = [];
    const now = Date.now();

    for (let i = 29; i >= 0; i--) {
      const timestamp = subDays(new Date(now), i);
      data.push({
        date: format(timestamp, 'MM/dd'),
        compute: Math.random() * 10000 + 5000,
        storage: Math.random() * 5000 + 2000,
        network: Math.random() * 3000 + 1000,
        dataTransfer: Math.random() * 2000 + 500,
      });
    }

    return data;
  }, []);

  const regionalTrafficData = useMemo(() => {
    if (!trafficAnalytics) return [];

    return Object.entries(trafficAnalytics.regionalDistribution).map(
      ([region, requests]) => ({
        region,
        requests,
        percentage: (
          (requests / trafficAnalytics.totalRequests) *
          100
        ).toFixed(1),
      })
    );
  }, [trafficAnalytics]);

  const renderGlobalMap = () => {
    if (!regions) return null;

    const center: [number, number] = [20, 0];
    const healthyRegions = regions.filter((r) => r.status === 'healthy');

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Global Infrastructure Map
          </Typography>
          <Box sx={{ height: 500, position: 'relative' }}>
            <MapContainer
              center={center}
              zoom={2}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {regions.map((region) => (
                <React.Fragment key={region.id}>
                  <Marker position={[region.latitude, region.longitude]}>
                    <Popup>
                      <div>
                        <strong>{region.name}</strong>
                        <br />
                        Status: {region.status}
                        <br />
                        Latency: {region.latencyP95}ms
                        <br />
                        Load: {region.currentLoad}/{region.maxCapacity}
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={[region.latitude, region.longitude]}
                    radius={500000}
                    pathOptions={{
                      color: getStatusColor(region.status),
                      fillColor: getStatusColor(region.status),
                      fillOpacity: 0.2,
                    }}
                  />
                </React.Fragment>
              ))}
              {healthyRegions.map((region, idx) => {
                if (idx < healthyRegions.length - 1) {
                  const nextRegion = healthyRegions[idx + 1];
                  return (
                    <Polyline
                      key={`${region.id}-${nextRegion.id}`}
                      positions={[
                        [region.latitude, region.longitude],
                        [nextRegion.latitude, nextRegion.longitude],
                      ]}
                      pathOptions={{ color: '#0088FE', weight: 2, opacity: 0.5 }}
                    />
                  );
                }
                return null;
              })}
            </MapContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderRegionHealth = () => {
    if (!regions) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Region Health Status</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={autoFailoverEnabled}
                  onChange={handleToggleAutoFailover}
                  color="primary"
                />
              }
              label="Auto-Failover"
            />
          </Box>
          <Grid container spacing={2}>
            {regions.map((region) => (
              <Grid item xs={12} sm={6} md={4} key={region.id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderLeft: `4px solid ${getStatusColor(region.status)}`,
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 3 },
                  }}
                  onClick={() => setSelectedRegion(region.id)}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {region.name}
                      </Typography>
                      <Chip
                        label={region.status}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(region.status),
                          color: 'white',
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {region.location} ({region.priority})
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Uptime
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {region.uptime.toFixed(2)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Latency (p95)
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {region.latencyP95}ms
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Health Score
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {region.healthScore}/100
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Version
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {region.version}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Capacity
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(region.currentLoad / region.maxCapacity) * 100}
                        sx={{ mt: 0.5 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {region.currentLoad} / {region.maxCapacity}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderTrafficAnalytics = () => {
    if (!trafficAnalytics) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Traffic Analytics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Traffic Distribution by Region
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={regionalTrafficData}
                    dataKey="requests"
                    nameKey="region"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.region}: ${entry.percentage}%`}
                  >
                    {regionalTrafficData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Top Endpoints
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trafficAnalytics.topEndpoints}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="path" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="requests" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {trafficAnalytics.requestsPerSecond.toFixed(0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Requests/sec
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {trafficAnalytics.bandwidthMbps.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Bandwidth (Mbps)
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {(trafficAnalytics.cacheHitRate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Cache Hit Rate
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {(trafficAnalytics.errorRate * 100).toFixed(3)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Error Rate
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Latency Percentiles (24h)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={latencyHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip />
                  <Legend />
                  {regions?.slice(0, 3).map((region, idx) => (
                    <Line
                      key={region.id}
                      type="monotone"
                      dataKey={region.id}
                      stroke={COLORS[idx]}
                      name={region.name}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderReplicationStatus = () => {
    if (!replicationStatus) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Replication Status
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Replication Lag
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={replicationStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis label={{ value: 'Lag (ms)', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip />
                  <Bar dataKey="lag" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Throughput
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={replicationStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis label={{ value: 'MB/s', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip />
                  <Bar dataKey="throughput" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Region</TableCell>
                      <TableCell align="right">Lag (ms)</TableCell>
                      <TableCell align="right">Throughput (MB/s)</TableCell>
                      <TableCell align="right">Conflict Rate</TableCell>
                      <TableCell align="right">Queue Depth</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {replicationStatus.map((status) => (
                      <TableRow key={status.region}>
                        <TableCell>{status.region}</TableCell>
                        <TableCell align="right">{status.lag}</TableCell>
                        <TableCell align="right">{status.throughput.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          {status.conflictRate.toFixed(2)}/hr
                        </TableCell>
                        <TableCell align="right">{status.queueDepth}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderCapacity = () => {
    if (!capacityMetrics) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Capacity & Resource Utilization
          </Typography>
          <Grid container spacing={3}>
            {capacityMetrics.map((metrics) => (
              <Grid item xs={12} sm={6} md={3} key={metrics.region}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      {metrics.region}
                    </Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadialBarChart
                        innerRadius="10%"
                        outerRadius="80%"
                        data={[
                          { name: 'CPU', value: metrics.cpu, fill: '#8884d8' },
                          { name: 'Memory', value: metrics.memory, fill: '#83a6ed' },
                          { name: 'Disk', value: metrics.disk, fill: '#8dd1e1' },
                          { name: 'Network', value: metrics.network, fill: '#82ca9d' },
                        ]}
                        startAngle={180}
                        endAngle={0}
                      >
                        <RadialBar dataKey="value" />
                        <RechartsTooltip />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption">CPU: {metrics.cpu}%</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption">Mem: {metrics.memory}%</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption">Disk: {metrics.disk}%</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption">Net: {metrics.network}%</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderCostAnalysis = () => {
    if (!costData) return null;

    const totalCost = costData.reduce((sum, cost) => sum + cost.total, 0);

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cost Analysis
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, textAlign: 'center', mb: 2 }}>
                <Typography variant="h3" color="primary">
                  ${totalCost.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Monthly Cost
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Cost Trend (30 days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={costTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="compute"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                  />
                  <Area
                    type="monotone"
                    dataKey="storage"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                  />
                  <Area
                    type="monotone"
                    dataKey="network"
                    stackId="1"
                    stroke="#ffc658"
                    fill="#ffc658"
                  />
                  <Area
                    type="monotone"
                    dataKey="dataTransfer"
                    stackId="1"
                    stroke="#ff7c7c"
                    fill="#ff7c7c"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Cost by Region
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="compute" stackId="a" fill="#8884d8" />
                  <Bar dataKey="storage" stackId="a" fill="#82ca9d" />
                  <Bar dataKey="network" stackId="a" fill="#ffc658" />
                  <Bar dataKey="dataTransfer" stackId="a" fill="#ff7c7c" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderDeployments = () => {
    if (!deploymentStatus) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Deployment Management</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setDeployDialogOpen(true)}
            >
              Deploy to Regions
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Region</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Started At</TableCell>
                  <TableCell>Completed At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deploymentStatus.map((status) => (
                  <TableRow key={status.region}>
                    <TableCell>{status.region}</TableCell>
                    <TableCell>
                      <Chip
                        label={status.status}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(status.status),
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell>{status.version}</TableCell>
                    <TableCell>
                      {status.startedAt
                        ? format(new Date(status.startedAt), 'yyyy-MM-dd HH:mm:ss')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {status.completedAt
                        ? format(new Date(status.completedAt), 'yyyy-MM-dd HH:mm:ss')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button size="small" disabled={status.status !== 'completed'}>
                        Rollback
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Regional Infrastructure Management
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={() => setFailoverDialogOpen(true)}
        >
          Manual Failover
        </Button>
        <Button
          variant="outlined"
          onClick={() => setConfigDialogOpen(true)}
          disabled={!selectedRegion}
        >
          Configure Region
        </Button>
        <Button variant="outlined" onClick={() => setMigrationDialogOpen(true)}>
          Migrate Data
        </Button>
      </Box>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Traffic" />
        <Tab label="Replication" />
        <Tab label="Capacity" />
        <Tab label="Cost" />
        <Tab label="Deployments" />
      </Tabs>

      {activeTab === 0 && (
        <>
          {renderGlobalMap()}
          {renderRegionHealth()}
        </>
      )}

      {activeTab === 1 && renderTrafficAnalytics()}
      {activeTab === 2 && renderReplicationStatus()}
      {activeTab === 3 && renderCapacity()}
      {activeTab === 4 && renderCostAnalysis()}
      {activeTab === 5 && renderDeployments()}

      <Dialog open={failoverDialogOpen} onClose={() => setFailoverDialogOpen(false)}>
        <DialogTitle>Manual Failover</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a target region for failover. This will redirect all traffic to the
            selected region.
          </Typography>
          <Select
            fullWidth
            value={selectedRegion || ''}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            {regions?.map((region) => (
              <MenuItem key={region.id} value={region.id}>
                {region.name} - {region.status}
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFailoverDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleFailover} variant="contained" color="error">
            Confirm Failover
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deployDialogOpen}
        onClose={() => setDeployDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Deploy to Regions</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Version"
            value={deployVersion}
            onChange={(e) => setDeployVersion(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <Typography variant="body2" gutterBottom>
            Select Regions:
          </Typography>
          {regions?.map((region) => (
            <FormControlLabel
              key={region.id}
              control={
                <Switch
                  checked={selectedRegions.includes(region.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRegions([...selectedRegions, region.id]);
                    } else {
                      setSelectedRegions(
                        selectedRegions.filter((r) => r !== region.id)
                      );
                    }
                  }}
                />
              }
              label={region.name}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeployDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeploy} variant="contained" color="primary">
            Deploy
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Configure Region: {selectedRegion}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, height: 400 }}>
            <Editor
              height="100%"
              defaultLanguage="json"
              value={configJson}
              onChange={(value) => setConfigJson(value || '{}')}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveConfig} variant="contained" color="primary">
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
