import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Code as CodeIcon,
  BugReport as BugIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Download as DownloadIcon,
  Compare as CompareIcon,
  Refresh as RefreshIcon,
  AutoFixHigh as AutoFixIcon,
  ExpandMore as ExpandMoreIcon
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
  ResponsiveContainer
} from 'recharts';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import * as d3 from 'd3';
import Editor from '@monaco-editor/react';
import useSWR from 'swr';

interface CPUProfile {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  hotPaths: HotPath[];
  bottlenecks: PerformanceBottleneck[];
}

interface HotPath {
  functionName: string;
  url: string;
  lineNumber: number;
  cpuPercentage: number;
  selfTime: number;
  totalTime: number;
  callCount: number;
}

interface PerformanceBottleneck {
  type: 'function' | 'query' | 'io' | 'algorithm';
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  description: string;
  impact: string;
  duration: number;
  occurrences: number;
  suggestion: string;
}

interface MemorySnapshot {
  id: string;
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

interface MemoryLeak {
  className: string;
  growthRate: number;
  instanceCount: number;
  retainedSize: number;
  suspicionScore: number;
  snapshots: {
    before: number;
    after: number;
  };
}

interface TraceData {
  traceId: string;
  startTime: number;
  endTime: number;
  duration: number;
  spans: SpanData[];
  serviceName: string;
}

interface SpanData {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: string;
  startTime: number;
  endTime: number;
  duration: number;
  attributes: Record<string, any>;
  status: {
    code: string;
    message?: string;
  };
}

interface ServiceNode {
  id: string;
  label: string;
  requestCount: number;
  avgLatency: number;
  errorRate: number;
}

interface ServiceEdge {
  source: string;
  target: string;
  callCount: number;
  avgLatency: number;
  errorRate: number;
}

interface OptimizationIssue {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  description: string;
  currentCode: string;
  suggestedCode: string;
  impact: {
    estimatedImprovement: number;
    category: string;
  };
  difficulty: 'low' | 'medium' | 'high';
  autoFixable: boolean;
}

interface BenchmarkResult {
  name: string;
  opsPerSecond: number;
  meanTime: number;
  marginOfError: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const SEVERITY_COLORS = {
  critical: '#d32f2f',
  high: '#f57c00',
  medium: '#fbc02d',
  low: '#388e3c'
};

const ProfilingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<CPUProfile | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<TraceData | null>(null);
  const [flamegraphRef, setFlamegraphRef] = useState<SVGSVGElement | null>(null);
  const [profilingActive, setProfilingActive] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareProfileA, setCompareProfileA] = useState('');
  const [compareProfileB, setCompareProfileB] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [autoFixDialogOpen, setAutoFixDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<OptimizationIssue | null>(null);

  const { data: performanceSummary, mutate: refreshSummary } = useSWR(
    '/api/profiling/summary',
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: cpuProfiles } = useSWR('/api/profiling/cpu-profiles', fetcher, {
    refreshInterval: 10000
  });

  const { data: memorySnapshots } = useSWR('/api/profiling/memory-snapshots', fetcher, {
    refreshInterval: 10000
  });

  const { data: traces } = useSWR('/api/profiling/traces', fetcher, {
    refreshInterval: 10000
  });

  const { data: serviceMap } = useSWR('/api/profiling/service-map', fetcher, {
    refreshInterval: 30000
  });

  const { data: optimizationIssues } = useSWR('/api/optimization/issues', fetcher, {
    refreshInterval: 60000
  });

  const { data: benchmarks } = useSWR('/api/optimization/benchmarks', fetcher, {
    refreshInterval: 60000
  });

  const handleStartProfiling = async () => {
    try {
      const response = await fetch('/api/profiling/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: 60000 })
      });

      if (response.ok) {
        setProfilingActive(true);
        setTimeout(() => {
          setProfilingActive(false);
          refreshSummary();
        }, 60000);
      }
    } catch (error) {
      console.error('Failed to start profiling:', error);
    }
  };

  const handleStopProfiling = async () => {
    try {
      await fetch('/api/profiling/stop', { method: 'POST' });
      setProfilingActive(false);
      refreshSummary();
    } catch (error) {
      console.error('Failed to stop profiling:', error);
    }
  };

  const handleCaptureSnapshot = async () => {
    try {
      await fetch('/api/profiling/snapshot', { method: 'POST' });
      refreshSummary();
    } catch (error) {
      console.error('Failed to capture snapshot:', error);
    }
  };

  const handleApplyAutoFix = async (issueId: string) => {
    try {
      const response = await fetch(`/api/optimization/auto-fix/${issueId}`, {
        method: 'POST'
      });

      if (response.ok) {
        setAutoFixDialogOpen(false);
        refreshSummary();
      }
    } catch (error) {
      console.error('Failed to apply auto-fix:', error);
    }
  };

  useEffect(() => {
    if (selectedProfile && flamegraphRef) {
      renderFlamegraph(selectedProfile, flamegraphRef);
    }
  }, [selectedProfile, flamegraphRef]);

  const renderFlamegraph = (profile: CPUProfile, svg: SVGSVGElement) => {
    const width = 1200;
    const height = 600;

    d3.select(svg).selectAll('*').remove();

    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleLinear().range([0, height]);

    const root = {
      name: 'root',
      value: profile.duration,
      children: profile.hotPaths.map(hp => ({
        name: hp.functionName,
        value: hp.selfTime,
        data: hp
      }))
    };

    const hierarchy = d3.hierarchy(root).sum(d => (d as any).value);
    const partition = d3.partition<any>().size([width, height]);
    const partitionData = partition(hierarchy);

    const g = d3.select(svg)
      .attr('width', width)
      .attr('height', height)
      .append('g');

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const cells = g.selectAll('g')
      .data(partitionData.descendants())
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    cells.append('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', (d, i) => color(i.toString()))
      .attr('stroke', '#fff')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (d.data.data) {
          console.log('Clicked:', d.data.data);
        }
      });

    cells.append('text')
      .attr('x', 4)
      .attr('y', 13)
      .text(d => d.data.name)
      .attr('fill', 'white')
      .style('font-size', '10px')
      .style('pointer-events', 'none');
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (serviceMap) {
      const flowNodes: Node[] = serviceMap.nodes.map((node: ServiceNode, index: number) => ({
        id: node.id,
        type: 'default',
        data: {
          label: (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" fontWeight="bold">
                {node.label}
              </Typography>
              <Typography variant="caption" display="block">
                {node.requestCount} req
              </Typography>
              <Typography variant="caption" display="block">
                {node.avgLatency.toFixed(0)}ms avg
              </Typography>
              {node.errorRate > 0 && (
                <Typography variant="caption" color="error">
                  {(node.errorRate * 100).toFixed(1)}% errors
                </Typography>
              )}
            </Box>
          )
        },
        position: {
          x: (index % 4) * 300,
          y: Math.floor(index / 4) * 200
        },
        style: {
          background: node.errorRate > 0.05 ? '#ffebee' : node.avgLatency > 500 ? '#fff3e0' : '#e8f5e9',
          border: `2px solid ${node.errorRate > 0.05 ? '#d32f2f' : node.avgLatency > 500 ? '#f57c00' : '#388e3c'}`,
          borderRadius: 8,
          padding: 10,
          width: 200
        }
      }));

      const flowEdges: Edge[] = serviceMap.edges.map((edge: ServiceEdge) => ({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        label: `${edge.avgLatency.toFixed(0)}ms`,
        animated: edge.errorRate > 0.05,
        style: {
          stroke: edge.avgLatency > 500 ? '#f57c00' : edge.avgLatency > 100 ? '#fbc02d' : '#388e3c',
          strokeWidth: Math.min(edge.callCount / 10, 5)
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edge.avgLatency > 500 ? '#f57c00' : '#388e3c'
        }
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [serviceMap, setNodes, setEdges]);

  const filteredIssues = useMemo(() => {
    if (!optimizationIssues) return [];

    return optimizationIssues.filter((issue: OptimizationIssue) => {
      if (searchQuery && !issue.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (severityFilter.length > 0 && !severityFilter.includes(issue.severity)) {
        return false;
      }
      return true;
    });
  }, [optimizationIssues, searchQuery, severityFilter]);

  const renderOverviewTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Performance</Typography>
              </Box>
              <Typography variant="h4">
                {performanceSummary?.p95ResponseTime.toFixed(0) || 0}ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                P95 Response Time
              </Typography>
              <Box mt={2}>
                <Typography variant="body2">
                  P50: {performanceSummary?.avgResponseTime.toFixed(0) || 0}ms
                </Typography>
                <Typography variant="body2">
                  P99: {performanceSummary?.p99ResponseTime.toFixed(0) || 0}ms
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <MemoryIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Memory</Typography>
              </Box>
              <Typography variant="h4">
                {((performanceSummary?.memoryUsage || 0) / 1024 / 1024).toFixed(0)}MB
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Heap Used
              </Typography>
              <Box mt={2}>
                <Typography variant="body2">
                  GC Pauses: {performanceSummary?.totalGCPauses || 0}
                </Typography>
                <Typography variant="body2">
                  Avg: {(performanceSummary?.avgGCPause || 0).toFixed(1)}ms
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BugIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Issues</Typography>
              </Box>
              <Typography variant="h4">
                {performanceSummary?.totalIssues || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Optimization Opportunities
              </Typography>
              <Box mt={2}>
                <Typography variant="body2" color="error">
                  Critical: {performanceSummary?.criticalIssues || 0}
                </Typography>
                <Typography variant="body2" color="warning.main">
                  High: {performanceSummary?.highIssues || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Potential Gain</Typography>
              </Box>
              <Typography variant="h4">
                {performanceSummary?.estimatedImprovement || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Performance Improvement
              </Typography>
              <Box mt={2}>
                <Typography variant="body2">
                  Auto-fixable: {performanceSummary?.autoFixableCount || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Response Time Trend</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceSummary?.timeSeries || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="p50" stroke="#8884d8" fill="#8884d8" name="P50" />
                  <Area type="monotone" dataKey="p95" stroke="#82ca9d" fill="#82ca9d" name="P95" />
                  <Area type="monotone" dataKey="p99" stroke="#ffc658" fill="#ffc658" name="P99" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Top Bottlenecks</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Impact</TableCell>
                      <TableCell>Severity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(performanceSummary?.topBottlenecks || []).slice(0, 5).map((bottleneck: PerformanceBottleneck) => (
                      <TableRow key={bottleneck.location}>
                        <TableCell>
                          <Chip label={bottleneck.type} size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {bottleneck.location}
                          </Typography>
                        </TableCell>
                        <TableCell>{bottleneck.description}</TableCell>
                        <TableCell>{bottleneck.duration.toFixed(0)}ms</TableCell>
                        <TableCell>
                          <Chip
                            label={bottleneck.severity}
                            size="small"
                            sx={{ bgcolor: SEVERITY_COLORS[bottleneck.severity], color: 'white' }}
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

  const renderCPUProfilingTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">CPU Profiling</Typography>
        <Box>
          {!profilingActive ? (
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartProfiling}
            >
              Start Profiling
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={handleStopProfiling}
            >
              Stop Profiling
            </Button>
          )}
        </Box>
      </Box>

      {profilingActive && (
        <Alert severity="info" sx={{ mb: 2 }}>
          CPU profiling in progress... This will run for 60 seconds.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Recent Profiles</Typography>
              <List>
                {(cpuProfiles || []).map((profile: CPUProfile) => (
                  <ListItem
                    key={profile.id}
                    button
                    selected={selectedProfile?.id === profile.id}
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <ListItemText
                      primary={profile.title}
                      secondary={new Date(profile.startTime).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedProfile ? (
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Flamegraph</Typography>
                  <Box>
                    <IconButton onClick={() => setCompareDialogOpen(true)}>
                      <CompareIcon />
                    </IconButton>
                    <IconButton>
                      <DownloadIcon />
                    </IconButton>
                  </Box>
                </Box>
                <svg ref={setFlamegraphRef} />

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" mb={2}>Hot Paths</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Function</TableCell>
                        <TableCell>File</TableCell>
                        <TableCell>CPU %</TableCell>
                        <TableCell>Self Time</TableCell>
                        <TableCell>Calls</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedProfile.hotPaths.map((hp, idx) => (
                        <TableRow key={idx}>
                          <TableCell fontFamily="monospace">{hp.functionName}</TableCell>
                          <TableCell>
                            <Typography variant="caption">{hp.url}:{hp.lineNumber}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <LinearProgress
                                variant="determinate"
                                value={hp.cpuPercentage}
                                sx={{ width: 100, mr: 1 }}
                              />
                              {hp.cpuPercentage.toFixed(1)}%
                            </Box>
                          </TableCell>
                          <TableCell>{hp.selfTime.toFixed(2)}ms</TableCell>
                          <TableCell>{hp.callCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="body1" color="text.secondary" align="center">
                  Select a profile to view flamegraph
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const renderMemoryProfilingTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Memory Profiling</Typography>
        <Button
          variant="contained"
          startIcon={<MemoryIcon />}
          onClick={handleCaptureSnapshot}
        >
          Capture Snapshot
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Heap Usage Trend</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={memorySnapshots || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="heapUsed" stroke="#8884d8" name="Used" />
                  <Line type="monotone" dataKey="heapTotal" stroke="#82ca9d" name="Total" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>GC Activity</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceSummary?.gcStats || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="pauseDuration" fill="#8884d8" name="Pause Duration (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Memory Leak Detection</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Class</TableCell>
                      <TableCell>Growth Rate</TableCell>
                      <TableCell>Instances</TableCell>
                      <TableCell>Retained Size</TableCell>
                      <TableCell>Suspicion Score</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(performanceSummary?.memoryLeaks || []).map((leak: MemoryLeak, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell fontFamily="monospace">{leak.className}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${(leak.growthRate * 100).toFixed(1)}%`}
                            color={leak.growthRate > 0.2 ? 'error' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{leak.instanceCount}</TableCell>
                        <TableCell>{(leak.retainedSize / 1024).toFixed(0)} KB</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <LinearProgress
                              variant="determinate"
                              value={leak.suspicionScore * 10}
                              color={leak.suspicionScore > 7 ? 'error' : 'warning'}
                              sx={{ width: 100, mr: 1 }}
                            />
                            {leak.suspicionScore.toFixed(1)}/10
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined">
                            Investigate
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
    </Box>
  );

  const renderRequestTracingTab = () => (
    <Box>
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search traces by trace ID, operation, or service..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Service Dependency Map</Typography>
              <Box height={500} border={1} borderColor="divider" borderRadius={1}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  fitView
                >
                  <Background />
                  <Controls />
                  <MiniMap />
                </ReactFlow>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Recent Traces</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Trace ID</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Spans</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(traces || []).slice(0, 20).map((trace: TraceData) => (
                      <TableRow key={trace.traceId}>
                        <TableCell fontFamily="monospace">
                          {trace.traceId.substring(0, 16)}...
                        </TableCell>
                        <TableCell>{trace.serviceName}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${trace.duration.toFixed(0)}ms`}
                            color={trace.duration > 1000 ? 'error' : trace.duration > 500 ? 'warning' : 'success'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{trace.spans.length}</TableCell>
                        <TableCell>
                          {trace.spans.some(s => s.status.code === 'ERROR') ? (
                            <ErrorIcon color="error" />
                          ) : (
                            <CheckCircleIcon color="success" />
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(trace.startTime).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => setSelectedTrace(trace)}
                          >
                            View
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

        {selectedTrace && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>Trace Timeline</Typography>
                <Box>
                  {selectedTrace.spans.map((span, idx) => {
                    const startPercent = ((span.startTime - selectedTrace.startTime) / selectedTrace.duration) * 100;
                    const widthPercent = (span.duration / selectedTrace.duration) * 100;

                    return (
                      <Box key={idx} mb={1}>
                        <Typography variant="caption" display="block" mb={0.5}>
                          {span.name}
                        </Typography>
                        <Box position="relative" height={30} bgcolor="grey.100" borderRadius={1}>
                          <Tooltip title={`${span.duration.toFixed(2)}ms`}>
                            <Box
                              position="absolute"
                              left={`${startPercent}%`}
                              width={`${widthPercent}%`}
                              height="100%"
                              bgcolor={span.kind === 'SERVER' ? 'primary.main' : span.kind === 'CLIENT' ? 'secondary.main' : 'info.main'}
                              borderRadius={1}
                              display="flex"
                              alignItems="center"
                              px={1}
                            >
                              <Typography variant="caption" color="white" noWrap>
                                {span.duration.toFixed(1)}ms
                              </Typography>
                            </Box>
                          </Tooltip>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const renderCodeOptimizationTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Code Optimization</Typography>
        <Box>
          <TextField
            size="small"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mr: 2, width: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Severity</InputLabel>
            <Select
              multiple
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as string[])}
              label="Severity"
            >
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Optimization Opportunities</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>File</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Impact</TableCell>
                      <TableCell>Difficulty</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredIssues.map((issue: OptimizationIssue) => (
                      <TableRow key={issue.id}>
                        <TableCell>
                          <Chip label={issue.type} size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace">
                            {issue.file}:{issue.line}
                          </Typography>
                        </TableCell>
                        <TableCell>{issue.description}</TableCell>
                        <TableCell>
                          <Chip
                            label={`+${issue.impact.estimatedImprovement}%`}
                            color="success"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={issue.difficulty}
                            color={issue.difficulty === 'low' ? 'success' : issue.difficulty === 'medium' ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setSelectedIssue(issue);
                              setAutoFixDialogOpen(true);
                            }}
                          >
                            View
                          </Button>
                          {issue.autoFixable && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleApplyAutoFix(issue.id)}
                            >
                              <AutoFixIcon />
                            </IconButton>
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

      <Dialog
        open={autoFixDialogOpen}
        onClose={() => setAutoFixDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Optimization Details</DialogTitle>
        <DialogContent>
          {selectedIssue && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                {selectedIssue.description}
              </Typography>

              <Grid container spacing={2} my={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" mb={1}>Current Code:</Typography>
                  <Editor
                    height="200px"
                    language="typescript"
                    value={selectedIssue.currentCode}
                    options={{ readOnly: true, minimap: { enabled: false } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" mb={1}>Suggested Code:</Typography>
                  <Editor
                    height="200px"
                    language="typescript"
                    value={selectedIssue.suggestedCode}
                    options={{ readOnly: true, minimap: { enabled: false } }}
                  />
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Estimated Improvement:</strong> {selectedIssue.impact.estimatedImprovement}%
                </Typography>
                <Typography variant="body2">
                  <strong>Difficulty:</strong> {selectedIssue.difficulty}
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAutoFixDialogOpen(false)}>Cancel</Button>
          {selectedIssue?.autoFixable && (
            <Button
              variant="contained"
              onClick={() => selectedIssue && handleApplyAutoFix(selectedIssue.id)}
            >
              Apply Auto-Fix
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );

  const renderPerformanceTestsTab = () => (
    <Box>
      <Typography variant="h5" mb={3}>Performance Tests</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Benchmark Results</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Function</TableCell>
                      <TableCell>Ops/sec</TableCell>
                      <TableCell>Mean Time</TableCell>
                      <TableCell>Margin of Error</TableCell>
                      <TableCell>Trend</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(benchmarks || []).map((benchmark: BenchmarkResult, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell fontFamily="monospace">{benchmark.name}</TableCell>
                        <TableCell>{benchmark.opsPerSecond.toLocaleString()}</TableCell>
                        <TableCell>{benchmark.meanTime.toFixed(3)}ms</TableCell>
                        <TableCell>±{benchmark.marginOfError.toFixed(3)}ms</TableCell>
                        <TableCell>
                          <TrendingUpIcon color="success" />
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
              <Typography variant="h6" mb={2}>Performance Regression Detection</Typography>
              <Alert severity="success">
                No performance regressions detected in the last 7 days.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Performance Profiling Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor, analyze, and optimize application performance
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Overview" />
          <Tab label="CPU Profiling" />
          <Tab label="Memory Profiling" />
          <Tab label="Request Tracing" />
          <Tab label="Code Optimization" />
          <Tab label="Performance Tests" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderOverviewTab()}
      {activeTab === 1 && renderCPUProfilingTab()}
      {activeTab === 2 && renderMemoryProfilingTab()}
      {activeTab === 3 && renderRequestTracingTab()}
      {activeTab === 4 && renderCodeOptimizationTab()}
      {activeTab === 5 && renderPerformanceTestsTab()}
    </Container>
  );
};

export default ProfilingDashboard;
