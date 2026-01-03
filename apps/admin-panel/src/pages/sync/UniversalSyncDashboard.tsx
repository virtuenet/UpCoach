import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  SyncProblem as SyncProblemIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  DeviceHub as DeviceHubIcon,
  Visibility as VisibilityIcon,
  Compare as CompareIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  SkipPrevious as SkipPreviousIcon,
  SkipNext as SkipNextIcon,
  Close as CloseIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  CloudSync as CloudSyncIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
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
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
} from 'react-flow-renderer';
import Editor from '@monaco-editor/react';
import useSWR from 'swr';
import { create } from 'zustand';

interface SyncStatus {
  deviceId: string;
  deviceName: string;
  platform: string;
  online: boolean;
  lastSync: number;
  syncHealth: 'healthy' | 'degraded' | 'error';
  pendingOperations: number;
  bandwidth: number;
  latency: number;
}

interface ConflictData {
  id: string;
  entityType: string;
  entityId: string;
  localState: any;
  remoteState: any;
  detectedAt: number;
  status: 'pending' | 'resolving' | 'resolved';
  resolution?: 'local' | 'remote' | 'merged';
}

interface DeviceNode extends Node {
  data: {
    deviceId: string;
    deviceName: string;
    platform: string;
    online: boolean;
    syncHealth: 'healthy' | 'degraded' | 'error';
  };
}

interface SyncMetrics {
  timestamp: number;
  latency: number;
  bandwidth: number;
  successRate: number;
  operationCount: number;
}

interface StateVersion {
  version: number;
  timestamp: number;
  author: string;
  changes: StateChange[];
}

interface StateChange {
  path: string;
  op: 'add' | 'remove' | 'replace';
  oldValue?: any;
  newValue?: any;
}

interface SyncEvent {
  id: string;
  timestamp: number;
  type: 'sync' | 'conflict' | 'resolution' | 'error';
  deviceId: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
}

interface HeatMapData {
  hour: number;
  day: number;
  value: number;
}

interface DashboardStore {
  selectedDevice: string | null;
  selectedConflict: string | null;
  timeRange: '1h' | '6h' | '24h' | '7d';
  autoRefresh: boolean;
  setSelectedDevice: (deviceId: string | null) => void;
  setSelectedConflict: (conflictId: string | null) => void;
  setTimeRange: (range: '1h' | '6h' | '24h' | '7d') => void;
  setAutoRefresh: (enabled: boolean) => void;
}

const useDashboardStore = create<DashboardStore>((set) => ({
  selectedDevice: null,
  selectedConflict: null,
  timeRange: '24h',
  autoRefresh: true,
  setSelectedDevice: (deviceId) => set({ selectedDevice: deviceId }),
  setSelectedConflict: (conflictId) => set({ selectedConflict: conflictId }),
  setTimeRange: (range) => set({ timeRange: range }),
  setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),
}));

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
};

export const UniversalSyncDashboard: React.FC = () => {
  const {
    selectedDevice,
    selectedConflict,
    timeRange,
    autoRefresh,
    setSelectedDevice,
    setSelectedConflict,
    setTimeRange,
    setAutoRefresh,
  } = useDashboardStore();

  const [activeTab, setActiveTab] = useState(0);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: syncStatuses, mutate: mutateSyncStatuses } = useSWR<SyncStatus[]>(
    '/api/sync/status',
    fetcher,
    { refreshInterval: autoRefresh ? 5000 : 0 }
  );

  const { data: conflicts, mutate: mutateConflicts } = useSWR<ConflictData[]>(
    '/api/sync/conflicts',
    fetcher,
    { refreshInterval: autoRefresh ? 10000 : 0 }
  );

  const { data: metrics, mutate: mutateMetrics } = useSWR<SyncMetrics[]>(
    `/api/sync/metrics?range=${timeRange}`,
    fetcher,
    { refreshInterval: autoRefresh ? 5000 : 0 }
  );

  const { data: syncEvents, mutate: mutateSyncEvents } = useSWR<SyncEvent[]>(
    `/api/sync/events?range=${timeRange}`,
    fetcher,
    { refreshInterval: autoRefresh ? 5000 : 0 }
  );

  const { data: stateVersions } = useSWR<StateVersion[]>(
    selectedDevice ? `/api/sync/versions/${selectedDevice}` : null,
    fetcher
  );

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (syncStatuses) {
      const deviceNodes: DeviceNode[] = syncStatuses.map((status, index) => ({
        id: status.deviceId,
        type: 'default',
        position: {
          x: (index % 4) * 250,
          y: Math.floor(index / 4) * 200,
        },
        data: {
          deviceId: status.deviceId,
          deviceName: status.deviceName,
          platform: status.platform,
          online: status.online,
          syncHealth: status.syncHealth,
        },
        style: {
          background: getHealthColor(status.syncHealth),
          border: status.online ? '2px solid #4caf50' : '2px solid #9e9e9e',
          borderRadius: 8,
          padding: 10,
        },
      }));

      const deviceEdges: Edge[] = [];
      for (let i = 0; i < syncStatuses.length; i++) {
        for (let j = i + 1; j < syncStatuses.length; j++) {
          if (syncStatuses[i].online && syncStatuses[j].online) {
            deviceEdges.push({
              id: `${syncStatuses[i].deviceId}-${syncStatuses[j].deviceId}`,
              source: syncStatuses[i].deviceId,
              target: syncStatuses[j].deviceId,
              animated: true,
              style: { stroke: '#1976d2' },
            });
          }
        }
      }

      setNodes(deviceNodes);
      setEdges(deviceEdges);
    }
  }, [syncStatuses, setNodes, setEdges]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && stateVersions) {
      interval = setInterval(() => {
        setTimelinePosition((prev) => {
          if (prev >= stateVersions.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, stateVersions]);

  const getHealthColor = (health: string): string => {
    switch (health) {
      case 'healthy':
        return '#e8f5e9';
      case 'degraded':
        return '#fff3e0';
      case 'error':
        return '#ffebee';
      default:
        return '#f5f5f5';
    }
  };

  const getSyncHealthSummary = useMemo(() => {
    if (!syncStatuses) return { healthy: 0, degraded: 0, error: 0, offline: 0 };

    return syncStatuses.reduce(
      (acc, status) => {
        if (!status.online) {
          acc.offline++;
        } else {
          acc[status.syncHealth]++;
        }
        return acc;
      },
      { healthy: 0, degraded: 0, error: 0, offline: 0 }
    );
  }, [syncStatuses]);

  const getAverageMetrics = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return { latency: 0, bandwidth: 0, successRate: 0 };
    }

    const sum = metrics.reduce(
      (acc, m) => ({
        latency: acc.latency + m.latency,
        bandwidth: acc.bandwidth + m.bandwidth,
        successRate: acc.successRate + m.successRate,
      }),
      { latency: 0, bandwidth: 0, successRate: 0 }
    );

    return {
      latency: sum.latency / metrics.length,
      bandwidth: sum.bandwidth / metrics.length,
      successRate: sum.successRate / metrics.length,
    };
  }, [metrics]);

  const heatMapData = useMemo(() => {
    if (!syncEvents) return [];

    const heatMap: HeatMapData[] = [];
    const eventsByHour: Record<string, number> = {};

    syncEvents.forEach((event) => {
      const date = new Date(event.timestamp);
      const day = date.getDay();
      const hour = date.getHours();
      const key = `${day}-${hour}`;

      eventsByHour[key] = (eventsByHour[key] || 0) + 1;
    });

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        heatMap.push({
          day,
          hour,
          value: eventsByHour[key] || 0,
        });
      }
    }

    return heatMap;
  }, [syncEvents]);

  const handleRefresh = useCallback(() => {
    mutateSyncStatuses();
    mutateConflicts();
    mutateMetrics();
    mutateSyncEvents();
  }, [mutateSyncStatuses, mutateConflicts, mutateMetrics, mutateSyncEvents]);

  const handleResolveConflict = async (
    conflictId: string,
    resolution: 'local' | 'remote' | 'merged',
    mergedState?: any
  ) => {
    try {
      await fetch(`/api/sync/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, mergedState }),
      });

      mutateConflicts();
      setConflictDialogOpen(false);
      setSelectedConflict(null);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const handlePairDevices = async (deviceId1: string, deviceId2: string) => {
    try {
      await fetch('/api/sync/devices/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId1, deviceId2 }),
      });

      mutateSyncStatuses();
    } catch (error) {
      console.error('Failed to pair devices:', error);
    }
  };

  const handleUnpairDevices = async (deviceId1: string, deviceId2: string) => {
    try {
      await fetch('/api/sync/devices/unpair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId1, deviceId2 }),
      });

      mutateSyncStatuses();
    } catch (error) {
      console.error('Failed to unpair devices:', error);
    }
  };

  const renderSyncHealthMonitor = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" color="success.main">
                  {getSyncHealthSummary.healthy}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Healthy Devices
                </Typography>
              </Box>
              <CheckCircleIcon fontSize="large" color="success" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" color="warning.main">
                  {getSyncHealthSummary.degraded}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Degraded Devices
                </Typography>
              </Box>
              <WarningIcon fontSize="large" color="warning" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" color="error.main">
                  {getSyncHealthSummary.error}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Error Devices
                </Typography>
              </Box>
              <ErrorIcon fontSize="large" color="error" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" color="text.secondary">
                  {getSyncHealthSummary.offline}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Offline Devices
                </Typography>
              </Box>
              <SyncProblemIcon fontSize="large" color="disabled" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Device Status"
            action={
              <IconButton onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            }
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Device</TableCell>
                    <TableCell>Platform</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Health</TableCell>
                    <TableCell>Last Sync</TableCell>
                    <TableCell>Pending Ops</TableCell>
                    <TableCell>Latency</TableCell>
                    <TableCell>Bandwidth</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {syncStatuses?.map((status) => (
                    <TableRow key={status.deviceId}>
                      <TableCell>{status.deviceName}</TableCell>
                      <TableCell>
                        <Chip label={status.platform} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={status.online ? 'Online' : 'Offline'}
                          color={status.online ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={status.syncHealth}
                          color={
                            status.syncHealth === 'healthy'
                              ? 'success'
                              : status.syncHealth === 'degraded'
                              ? 'warning'
                              : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(status.lastSync).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge badgeContent={status.pendingOperations} color="primary">
                          <SyncIcon />
                        </Badge>
                      </TableCell>
                      <TableCell>{status.latency.toFixed(0)}ms</TableCell>
                      <TableCell>
                        {(status.bandwidth / 1024).toFixed(1)} KB/s
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedDevice(status.deviceId);
                            setDeviceDialogOpen(true);
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
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

  const renderConflictResolution = () => {
    const selectedConflictData = conflicts?.find((c) => c.id === selectedConflict);

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Sync Conflicts"
              action={
                <Chip
                  label={`${conflicts?.filter((c) => c.status === 'pending').length || 0} Pending`}
                  color="warning"
                />
              }
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Entity Type</TableCell>
                      <TableCell>Entity ID</TableCell>
                      <TableCell>Detected</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {conflicts?.map((conflict) => (
                      <TableRow key={conflict.id}>
                        <TableCell>{conflict.entityType}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {conflict.entityId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(conflict.detectedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={conflict.status}
                            color={
                              conflict.status === 'resolved'
                                ? 'success'
                                : conflict.status === 'resolving'
                                ? 'info'
                                : 'warning'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {conflict.status === 'pending' && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<CompareIcon />}
                              onClick={() => {
                                setSelectedConflict(conflict.id);
                                setConflictDialogOpen(true);
                              }}
                            >
                              Resolve
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

        <Dialog
          open={conflictDialogOpen}
          onClose={() => setConflictDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Resolve Conflict - {selectedConflictData?.entityType}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Local State
                </Typography>
                <Paper variant="outlined" sx={{ height: 400 }}>
                  <Editor
                    height="400px"
                    defaultLanguage="json"
                    value={JSON.stringify(
                      selectedConflictData?.localState,
                      null,
                      2
                    )}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                    }}
                  />
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Remote State
                </Typography>
                <Paper variant="outlined" sx={{ height: 400 }}>
                  <Editor
                    height="400px"
                    defaultLanguage="json"
                    value={JSON.stringify(
                      selectedConflictData?.remoteState,
                      null,
                      2
                    )}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                    }}
                  />
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConflictDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() =>
                selectedConflict &&
                handleResolveConflict(selectedConflict, 'local')
              }
            >
              Use Local
            </Button>
            <Button
              variant="contained"
              onClick={() =>
                selectedConflict &&
                handleResolveConflict(selectedConflict, 'remote')
              }
            >
              Use Remote
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() =>
                selectedConflict &&
                handleResolveConflict(selectedConflict, 'merged')
              }
            >
              Merge
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    );
  };

  const renderDeviceEcosystem = () => (
    <Card>
      <CardHeader
        title="Device Ecosystem"
        action={
          <Box>
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Box>
        }
      />
      <CardContent>
        <Box sx={{ height: 600 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            <Controls />
            <Background />
            <MiniMap />
          </ReactFlow>
        </Box>
      </CardContent>
    </Card>
  );

  const renderAnalytics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Average Latency
            </Typography>
            <Typography variant="h3" color="primary">
              {getAverageMetrics.latency.toFixed(0)}ms
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min((getAverageMetrics.latency / 1000) * 100, 100)}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Average Bandwidth
            </Typography>
            <Typography variant="h3" color="primary">
              {(getAverageMetrics.bandwidth / 1024).toFixed(1)} KB/s
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min((getAverageMetrics.bandwidth / 10240) * 100, 100)}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Success Rate
            </Typography>
            <Typography variant="h3" color="primary">
              {(getAverageMetrics.successRate * 100).toFixed(1)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={getAverageMetrics.successRate * 100}
              color={getAverageMetrics.successRate > 0.95 ? 'success' : 'warning'}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Latency Over Time" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleTimeString()
                  }
                />
                <YAxis />
                <RechartsTooltip
                  labelFormatter={(value) =>
                    new Date(value).toLocaleString()
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#1976d2"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Bandwidth Usage" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleTimeString()
                  }
                />
                <YAxis />
                <RechartsTooltip
                  labelFormatter={(value) =>
                    new Date(value).toLocaleString()
                  }
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="bandwidth"
                  stroke="#4caf50"
                  fill="#4caf50"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Success Rate" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleTimeString()
                  }
                />
                <YAxis domain={[0, 1]} />
                <RechartsTooltip
                  labelFormatter={(value) =>
                    new Date(value).toLocaleString()
                  }
                  formatter={(value: any) => `${(value * 100).toFixed(1)}%`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="successRate"
                  stroke="#ff9800"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Operation Count" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleTimeString()
                  }
                />
                <YAxis />
                <RechartsTooltip
                  labelFormatter={(value) =>
                    new Date(value).toLocaleString()
                  }
                />
                <Legend />
                <Bar dataKey="operationCount" fill="#9c27b0" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderStateInspector = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="State Inspector"
            subheader={selectedDevice || 'Select a device'}
            action={
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Device</InputLabel>
                <Select
                  value={selectedDevice || ''}
                  label="Device"
                  onChange={(e) => setSelectedDevice(e.target.value)}
                >
                  {syncStatuses?.map((status) => (
                    <MenuItem key={status.deviceId} value={status.deviceId}>
                      {status.deviceName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            }
          />
          <CardContent>
            {selectedDevice && stateVersions && (
              <Box>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <IconButton
                    onClick={() => setTimelinePosition(0)}
                    disabled={timelinePosition === 0}
                  >
                    <SkipPreviousIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setTimelinePosition(Math.max(0, timelinePosition - 1))}
                    disabled={timelinePosition === 0}
                  >
                    <SkipPreviousIcon />
                  </IconButton>
                  <IconButton onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                  </IconButton>
                  <IconButton
                    onClick={() =>
                      setTimelinePosition(
                        Math.min(stateVersions.length - 1, timelinePosition + 1)
                      )
                    }
                    disabled={timelinePosition >= stateVersions.length - 1}
                  >
                    <SkipNextIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setTimelinePosition(stateVersions.length - 1)}
                    disabled={timelinePosition >= stateVersions.length - 1}
                  >
                    <SkipNextIcon />
                  </IconButton>
                  <Box flex={1}>
                    <Typography variant="body2">
                      Version {stateVersions[timelinePosition]?.version} -{' '}
                      {new Date(
                        stateVersions[timelinePosition]?.timestamp
                      ).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>

                <Paper variant="outlined" sx={{ height: 500, mb: 2 }}>
                  <Editor
                    height="500px"
                    defaultLanguage="json"
                    value={JSON.stringify(
                      stateVersions[timelinePosition],
                      null,
                      2
                    )}
                    options={{
                      readOnly: true,
                      minimap: { enabled: true },
                    }}
                  />
                </Paper>

                <Typography variant="h6" gutterBottom>
                  Change History
                </Typography>
                <List>
                  {stateVersions[timelinePosition]?.changes.map(
                    (change, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemIcon>
                            {change.op === 'add' ? (
                              <CheckCircleIcon color="success" />
                            ) : change.op === 'remove' ? (
                              <ErrorIcon color="error" />
                            ) : (
                              <WarningIcon color="warning" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={`${change.op.toUpperCase()} - ${change.path}`}
                            secondary={
                              change.op === 'replace'
                                ? `${JSON.stringify(
                                    change.oldValue
                                  )} → ${JSON.stringify(change.newValue)}`
                                : change.op === 'add'
                                ? JSON.stringify(change.newValue)
                                : JSON.stringify(change.oldValue)
                            }
                          />
                        </ListItem>
                        {index < stateVersions[timelinePosition].changes.length - 1 && (
                          <Divider />
                        )}
                      </React.Fragment>
                    )
                  )}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTimeline = () => (
    <Card>
      <CardHeader title="Sync Timeline" />
      <CardContent>
        <Box sx={{ height: 400, overflowY: 'auto' }}>
          <List>
            {syncEvents?.map((event, index) => (
              <React.Fragment key={event.id}>
                <ListItem>
                  <ListItemIcon>
                    {event.type === 'sync' ? (
                      <CloudSyncIcon color="primary" />
                    ) : event.type === 'conflict' ? (
                      <SyncProblemIcon color="warning" />
                    ) : event.type === 'resolution' ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={event.description}
                    secondary={new Date(event.timestamp).toLocaleString()}
                  />
                  <Chip
                    label={event.severity}
                    size="small"
                    color={
                      event.severity === 'error'
                        ? 'error'
                        : event.severity === 'warning'
                        ? 'warning'
                        : 'default'
                    }
                  />
                </ListItem>
                {index < syncEvents.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Universal Sync Dashboard</Typography>
        <Box display="flex" gap={2}>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(_, value) => value && setTimeRange(value)}
            size="small"
          >
            <ToggleButton value="1h">1H</ToggleButton>
            <ToggleButton value="6h">6H</ToggleButton>
            <ToggleButton value="24h">24H</ToggleButton>
            <ToggleButton value="7d">7D</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant={autoRefresh ? 'contained' : 'outlined'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            startIcon={<SyncIcon />}
          >
            Auto Refresh
          </Button>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ mb: 3 }}>
        <Tab label="Health Monitor" />
        <Tab label="Conflicts" />
        <Tab label="Device Ecosystem" />
        <Tab label="Analytics" />
        <Tab label="State Inspector" />
        <Tab label="Timeline" />
      </Tabs>

      {activeTab === 0 && renderSyncHealthMonitor()}
      {activeTab === 1 && renderConflictResolution()}
      {activeTab === 2 && renderDeviceEcosystem()}
      {activeTab === 3 && renderAnalytics()}
      {activeTab === 4 && renderStateInspector()}
      {activeTab === 5 && renderTimeline()}
    </Box>
  );
};

export default UniversalSyncDashboard;
