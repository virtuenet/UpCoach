import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  InputAdornment,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
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
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Editor from '@monaco-editor/react';
import useSWR from 'swr';
import {
  PlayArrow,
  Stop,
  Refresh,
  FilterList,
  Search,
  Add,
  Edit,
  Delete,
  Download,
  Upload,
  Settings,
  CheckCircle,
  Error,
  Warning,
  Schedule,
  Speed,
  TrendingUp,
  TrendingDown,
  ExpandMore,
  Replay,
  Visibility,
  Code,
} from '@mui/icons-material';

// ===========================
// Interfaces
// ===========================

interface WorkflowExecution {
  id: string;
  name: string;
  status: 'running' | 'queued' | 'failed' | 'completed';
  progress: number;
  duration: number;
  startTime: string;
  endTime?: string;
  tasks: TaskExecution[];
}

interface TaskExecution {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  duration?: number;
  workerId?: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  taskCount: number;
  avgDuration: number;
  successRate: number;
}

interface RPABot {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error';
  lastRun: string;
  successRate: number;
  totalRuns: number;
}

interface Connector {
  id: string;
  name: string;
  type: string;
  status: 'healthy' | 'degraded' | 'error';
  lastSync: string;
  errorCount: number;
}

interface Pipeline {
  id: string;
  name: string;
  source: string;
  destination: string;
  status: 'running' | 'idle' | 'failed';
  lastRun: string;
  recordsProcessed: number;
}

interface ProcessLog {
  id: string;
  timestamp: string;
  process: string;
  status: 'success' | 'failure';
  duration: number;
  message: string;
}

interface Bottleneck {
  taskId: string;
  taskName: string;
  avgDuration: number;
  impact: 'high' | 'medium' | 'low';
}

interface Alert {
  id: string;
  type: 'sla_violation' | 'failure' | 'anomaly';
  severity: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  workflowId?: string;
}

// ===========================
// Fetcher Function
// ===========================

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ===========================
// Main Dashboard Component
// ===========================

export default function AutomationDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowExecution | null>(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  // Fetch data with SWR (5-second refresh)
  const { data: executions, mutate: refetchExecutions } = useSWR<WorkflowExecution[]>(
    '/api/automation/executions',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: templates } = useSWR<WorkflowTemplate[]>('/api/automation/templates', fetcher);
  const { data: bots } = useSWR<RPABot[]>('/api/automation/bots', fetcher, { refreshInterval: 5000 });
  const { data: connectors } = useSWR<Connector[]>('/api/automation/connectors', fetcher, { refreshInterval: 5000 });
  const { data: pipelines } = useSWR<Pipeline[]>('/api/automation/pipelines', fetcher, { refreshInterval: 5000 });
  const { data: logs } = useSWR<ProcessLog[]>('/api/automation/logs', fetcher, { refreshInterval: 5000 });
  const { data: bottlenecks } = useSWR<Bottleneck[]>('/api/automation/bottlenecks', fetcher);
  const { data: alerts } = useSWR<Alert[]>('/api/automation/alerts', fetcher, { refreshInterval: 5000 });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      await fetch(`/api/automation/workflows/${workflowId}/execute`, { method: 'POST' });
      refetchExecutions();
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    }
  };

  const handleStopWorkflow = async (executionId: string) => {
    try {
      await fetch(`/api/automation/executions/${executionId}/cancel`, { method: 'POST' });
      refetchExecutions();
    } catch (error) {
      console.error('Failed to stop workflow:', error);
    }
  };

  const handleRetryWorkflow = async (executionId: string) => {
    try {
      await fetch(`/api/automation/executions/${executionId}/retry`, { method: 'POST' });
      refetchExecutions();
    } catch (error) {
      console.error('Failed to retry workflow:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Automation & Intelligent Workflows</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<Add />}>
            New Workflow
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetchExecutions()}>
            Refresh
          </Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Workflows" />
        <Tab label="Process Automation" />
        <Tab label="Data Pipelines" />
        <Tab label="Optimization" />
        <Tab label="Monitoring" />
      </Tabs>

      {activeTab === 0 && <OverviewTab executions={executions || []} />}
      {activeTab === 1 && (
        <WorkflowsTab
          executions={executions || []}
          templates={templates || []}
          onExecute={handleExecuteWorkflow}
          onStop={handleStopWorkflow}
          onViewDetails={(workflow) => {
            setSelectedWorkflow(workflow);
            setWorkflowDialogOpen(true);
          }}
        />
      )}
      {activeTab === 2 && <ProcessAutomationTab bots={bots || []} connectors={connectors || []} logs={logs || []} />}
      {activeTab === 3 && <DataPipelinesTab pipelines={pipelines || []} />}
      {activeTab === 4 && <OptimizationTab bottlenecks={bottlenecks || []} executions={executions || []} />}
      {activeTab === 5 && (
        <MonitoringTab
          logs={logs || []}
          alerts={alerts || []}
          executions={executions || []}
          onRetry={handleRetryWorkflow}
        />
      )}

      {/* Workflow Details Dialog */}
      <Dialog open={workflowDialogOpen} onClose={() => setWorkflowDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Workflow Details</DialogTitle>
        <DialogContent>
          {selectedWorkflow && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Workflow ID
                  </Typography>
                  <Typography variant="body1">{selectedWorkflow.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedWorkflow.status}
                    color={
                      selectedWorkflow.status === 'completed'
                        ? 'success'
                        : selectedWorkflow.status === 'failed'
                        ? 'error'
                        : selectedWorkflow.status === 'running'
                        ? 'primary'
                        : 'default'
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">{selectedWorkflow.duration}ms</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Progress
                  </Typography>
                  <LinearProgress variant="determinate" value={selectedWorkflow.progress} />
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Task Execution Timeline
              </Typography>
              <Stepper activeStep={-1} orientation="vertical">
                {selectedWorkflow.tasks.map((task, index) => (
                  <Step key={task.id} completed={task.status === 'completed'}>
                    <StepLabel
                      error={task.status === 'failed'}
                      icon={
                        task.status === 'completed' ? (
                          <CheckCircle color="success" />
                        ) : task.status === 'failed' ? (
                          <Error color="error" />
                        ) : task.status === 'running' ? (
                          <Speed color="primary" />
                        ) : (
                          <Schedule color="disabled" />
                        )
                      }
                    >
                      <Box>
                        <Typography variant="body1">{task.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {task.duration ? `${task.duration}ms` : 'Pending'} | Worker: {task.workerId || 'N/A'}
                        </Typography>
                      </Box>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkflowDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ===========================
// Overview Tab
// ===========================

function OverviewTab({ executions }: { executions: WorkflowExecution[] }) {
  // Calculate metrics
  const activeWorkflows = executions.filter((e) => e.status === 'running').length;
  const completedToday = executions.filter(
    (e) => e.status === 'completed' && new Date(e.startTime).toDateString() === new Date().toDateString()
  ).length;
  const failedToday = executions.filter(
    (e) => e.status === 'failed' && new Date(e.startTime).toDateString() === new Date().toDateString()
  ).length;
  const avgDuration =
    executions.reduce((sum, e) => sum + e.duration, 0) / (executions.length || 1);

  // Time saved calculation (mock)
  const timeSaved = Math.floor(completedToday * 15); // 15 minutes per workflow
  const costReduced = Math.floor(timeSaved * 0.5); // $0.5 per minute

  // Success rate data
  const successRateData = [
    { name: 'Success', value: completedToday, color: '#4caf50' },
    { name: 'Failed', value: failedToday, color: '#f44336' },
  ];

  // Execution timeline data
  const timelineData = executions.slice(0, 20).map((e) => ({
    name: e.name.substring(0, 10),
    duration: e.duration,
    status: e.status,
  }));

  // Resource utilization data
  const resourceData = [
    { time: '00:00', cpu: 45, memory: 60 },
    { time: '04:00', cpu: 35, memory: 55 },
    { time: '08:00', cpu: 65, memory: 70 },
    { time: '12:00', cpu: 75, memory: 80 },
    { time: '16:00', cpu: 55, memory: 65 },
    { time: '20:00', cpu: 40, memory: 50 },
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Active Workflows
              </Typography>
              <Typography variant="h3" color="primary">
                {activeWorkflows}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently running
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Time Saved
              </Typography>
              <Typography variant="h3" color="success.main">
                {timeSaved}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Cost Reduced
              </Typography>
              <Typography variant="h3" color="success.main">
                ${costReduced}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Success Rate
              </Typography>
              <Typography variant="h3" color="primary">
                {completedToday + failedToday > 0
                  ? Math.round((completedToday / (completedToday + failedToday)) * 100)
                  : 0}
                %
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Workflows Grid */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Workflows
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Started</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {executions.slice(0, 10).map((execution) => (
                      <TableRow key={execution.id}>
                        <TableCell>{execution.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={execution.status}
                            size="small"
                            color={
                              execution.status === 'completed'
                                ? 'success'
                                : execution.status === 'failed'
                                ? 'error'
                                : execution.status === 'running'
                                ? 'primary'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={execution.progress}
                              sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                            />
                            <Typography variant="body2">{execution.progress}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{execution.duration}ms</TableCell>
                        <TableCell>{new Date(execution.startTime).toLocaleTimeString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Success Rate Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Success vs Failure
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={successRateData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {successRateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Execution Timeline */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Workflow Execution Duration
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="duration" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Resource Utilization */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resource Utilization
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={resourceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cpu" stroke="#1976d2" name="CPU %" />
                  <Line type="monotone" dataKey="memory" stroke="#f44336" name="Memory %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// ===========================
// Workflows Tab
// ===========================

function WorkflowsTab({
  executions,
  templates,
  onExecute,
  onStop,
  onViewDetails,
}: {
  executions: WorkflowExecution[];
  templates: WorkflowTemplate[];
  onExecute: (workflowId: string) => void;
  onStop: (executionId: string) => void;
  onViewDetails: (workflow: WorkflowExecution) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [builderOpen, setBuilderOpen] = useState(false);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Templates Library */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Workflow Templates</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Category</InputLabel>
                    <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} label="Category">
                      <MenuItem value="all">All</MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button variant="contained" startIcon={<Add />} onClick={() => setBuilderOpen(true)}>
                    Create Workflow
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {filteredTemplates.map((template) => (
                  <Grid item xs={12} md={4} key={template.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {template.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {template.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Chip label={template.category} size="small" />
                          <Chip label={`${template.taskCount} tasks`} size="small" variant="outlined" />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Avg Duration: {template.avgDuration}ms
                          </Typography>
                          <Typography variant="caption" color="success.main">
                            Success: {template.successRate}%
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          fullWidth
                          startIcon={<PlayArrow />}
                          onClick={() => onExecute(template.id)}
                        >
                          Execute
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Workflow Execution History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Execution History
              </Typography>
              <DataGrid
                rows={executions}
                columns={[
                  { field: 'name', headerName: 'Workflow', flex: 1 },
                  {
                    field: 'status',
                    headerName: 'Status',
                    width: 120,
                    renderCell: (params) => (
                      <Chip
                        label={params.value}
                        size="small"
                        color={
                          params.value === 'completed'
                            ? 'success'
                            : params.value === 'failed'
                            ? 'error'
                            : params.value === 'running'
                            ? 'primary'
                            : 'default'
                        }
                      />
                    ),
                  },
                  {
                    field: 'progress',
                    headerName: 'Progress',
                    width: 150,
                    renderCell: (params) => (
                      <Box sx={{ width: '100%' }}>
                        <LinearProgress variant="determinate" value={params.value} />
                      </Box>
                    ),
                  },
                  { field: 'duration', headerName: 'Duration (ms)', width: 120 },
                  {
                    field: 'startTime',
                    headerName: 'Started',
                    width: 180,
                    valueFormatter: (params) => new Date(params.value).toLocaleString(),
                  },
                  {
                    field: 'actions',
                    headerName: 'Actions',
                    width: 200,
                    renderCell: (params) => (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {params.row.status === 'running' && (
                          <IconButton size="small" onClick={() => onStop(params.row.id)} color="error">
                            <Stop />
                          </IconButton>
                        )}
                        <IconButton size="small" onClick={() => onViewDetails(params.row)} color="primary">
                          <Visibility />
                        </IconButton>
                      </Box>
                    ),
                  },
                ]}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                autoHeight
                disableSelectionOnClick
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Workflow Builder Dialog */}
      <Dialog open={builderOpen} onClose={() => setBuilderOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>Workflow Builder</DialogTitle>
        <DialogContent>
          <WorkflowBuilder onClose={() => setBuilderOpen(false)} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

// ===========================
// Workflow Builder Component
// ===========================

function WorkflowBuilder({ onClose }: { onClose: () => void }) {
  const initialNodes: Node[] = [
    {
      id: '1',
      type: 'input',
      data: { label: 'Start' },
      position: { x: 250, y: 0 },
    },
  ];

  const initialEdges: Edge[] = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = (connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
  };

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: 'default',
      data: { label: `${type} Task` },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <Box sx={{ height: 600 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button variant="outlined" onClick={() => addNode('API')}>
          Add API Task
        </Button>
        <Button variant="outlined" onClick={() => addNode('Transform')}>
          Add Transform
        </Button>
        <Button variant="outlined" onClick={() => addNode('Decision')}>
          Add Decision
        </Button>
        <Button variant="outlined" onClick={() => addNode('Notification')}>
          Add Notification
        </Button>
      </Box>

      <Box sx={{ height: 500, border: '1px solid #ddd', borderRadius: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained">Save Workflow</Button>
      </Box>
    </Box>
  );
}

// ===========================
// Process Automation Tab
// ===========================

function ProcessAutomationTab({
  bots,
  connectors,
  logs,
}: {
  bots: RPABot[];
  connectors: Connector[];
  logs: ProcessLog[];
}) {
  return (
    <Box>
      <Grid container spacing={3}>
        {/* RPA Bot Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                RPA Bot Status
              </Typography>
              <Grid container spacing={2}>
                {bots.map((bot) => (
                  <Grid item xs={12} md={6} key={bot.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6">{bot.name}</Typography>
                          <Chip
                            label={bot.status}
                            size="small"
                            color={bot.status === 'active' ? 'success' : bot.status === 'idle' ? 'default' : 'error'}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Last Run: {new Date(bot.lastRun).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Runs: {bot.totalRuns}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={bot.successRate}
                            sx={{ flexGrow: 1, height: 8 }}
                            color={bot.successRate > 90 ? 'success' : bot.successRate > 70 ? 'warning' : 'error'}
                          />
                          <Typography variant="caption">{bot.successRate}%</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Integration Health */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Integration Health
              </Typography>
              <Grid container spacing={2}>
                {connectors.map((connector) => (
                  <Grid item xs={12} md={4} key={connector.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6">{connector.name}</Typography>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor:
                                connector.status === 'healthy'
                                  ? 'success.main'
                                  : connector.status === 'degraded'
                                  ? 'warning.main'
                                  : 'error.main',
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Type: {connector.type}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Last Sync: {new Date(connector.lastSync).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color={connector.errorCount > 0 ? 'error.main' : 'text.secondary'}>
                          Errors: {connector.errorCount}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Process Logs */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Process Logs
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Process</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.slice(0, 20).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{log.process}</TableCell>
                        <TableCell>
                          <Chip label={log.status} size="small" color={log.status === 'success' ? 'success' : 'error'} />
                        </TableCell>
                        <TableCell>{log.duration}ms</TableCell>
                        <TableCell>{log.message}</TableCell>
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

// ===========================
// Data Pipelines Tab
// ===========================

function DataPipelinesTab({ pipelines }: { pipelines: Pipeline[] }) {
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);

  // Pipeline DAG nodes and edges
  const dagNodes: Node[] = selectedPipeline
    ? [
        {
          id: 'source',
          type: 'input',
          data: { label: selectedPipeline.source },
          position: { x: 0, y: 100 },
        },
        {
          id: 'transform',
          type: 'default',
          data: { label: 'Transform' },
          position: { x: 200, y: 100 },
        },
        {
          id: 'destination',
          type: 'output',
          data: { label: selectedPipeline.destination },
          position: { x: 400, y: 100 },
        },
      ]
    : [];

  const dagEdges: Edge[] = selectedPipeline
    ? [
        { id: 'e1', source: 'source', target: 'transform', markerEnd: { type: MarkerType.ArrowClosed } },
        { id: 'e2', source: 'transform', target: 'destination', markerEnd: { type: MarkerType.ArrowClosed } },
      ]
    : [];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Pipeline List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Pipelines
              </Typography>
              {pipelines.map((pipeline) => (
                <Card
                  key={pipeline.id}
                  variant="outlined"
                  sx={{ mb: 2, cursor: 'pointer' }}
                  onClick={() => setSelectedPipeline(pipeline)}
                >
                  <CardContent>
                    <Typography variant="h6">{pipeline.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pipeline.source} → {pipeline.destination}
                    </Typography>
                    <Chip
                      label={pipeline.status}
                      size="small"
                      color={
                        pipeline.status === 'running' ? 'primary' : pipeline.status === 'idle' ? 'default' : 'error'
                      }
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Pipeline DAG */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pipeline DAG
              </Typography>
              {selectedPipeline ? (
                <Box sx={{ height: 400, border: '1px solid #ddd', borderRadius: 1 }}>
                  <ReactFlow nodes={dagNodes} edges={dagEdges} fitView>
                    <Background />
                    <Controls />
                  </ReactFlow>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select a pipeline to view its DAG
                </Typography>
              )}
            </CardContent>
          </Card>

          {selectedPipeline && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pipeline Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Last Run
                    </Typography>
                    <Typography variant="body1">{new Date(selectedPipeline.lastRun).toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Records Processed
                    </Typography>
                    <Typography variant="body1">{selectedPipeline.recordsProcessed.toLocaleString()}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

// ===========================
// Optimization Tab
// ===========================

function OptimizationTab({ bottlenecks, executions }: { bottlenecks: Bottleneck[]; executions: WorkflowExecution[] }) {
  // Performance trends data
  const performanceTrends = executions.slice(0, 20).map((e, index) => ({
    execution: index + 1,
    duration: e.duration,
  }));

  // Cost analysis data
  const costData = executions.slice(0, 10).map((e) => ({
    name: e.name.substring(0, 10),
    cost: Math.floor(e.duration / 1000) * 0.001, // $0.001 per second
  }));

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Bottleneck Analysis */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bottleneck Analysis
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Task</TableCell>
                      <TableCell>Avg Duration</TableCell>
                      <TableCell>Impact</TableCell>
                      <TableCell>Recommendation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bottlenecks.map((bottleneck) => (
                      <TableRow key={bottleneck.taskId}>
                        <TableCell>{bottleneck.taskName}</TableCell>
                        <TableCell>{bottleneck.avgDuration}ms</TableCell>
                        <TableCell>
                          <Chip
                            label={bottleneck.impact}
                            size="small"
                            color={
                              bottleneck.impact === 'high'
                                ? 'error'
                                : bottleneck.impact === 'medium'
                                ? 'warning'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {bottleneck.impact === 'high'
                            ? 'Consider parallelization or optimization'
                            : 'Monitor for performance degradation'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cost Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cost" fill="#1976d2" name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Trends */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="execution" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="duration" stroke="#1976d2" fill="#1976d2" fillOpacity={0.3} name="Duration (ms)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Optimization Recommendations */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Optimization Recommendations
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="info">
                  <strong>Parallel Execution:</strong> Tasks 'fetch-data' and 'validate-input' can run in parallel, reducing total execution time by 30%.
                </Alert>
                <Alert severity="warning">
                  <strong>Resource Right-sizing:</strong> Workflow 'data-processing' is over-provisioned. Consider reducing CPU allocation from 4 to 2 cores.
                </Alert>
                <Alert severity="success">
                  <strong>Caching Opportunity:</strong> API calls to external service can be cached for 5 minutes, reducing costs by $50/month.
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// ===========================
// Monitoring Tab
// ===========================

function MonitoringTab({
  logs,
  alerts,
  executions,
  onRetry,
}: {
  logs: ProcessLog[];
  alerts: Alert[];
  executions: WorkflowExecution[];
  onRetry: (executionId: string) => void;
}) {
  const [logFilter, setLogFilter] = useState('all');
  const [logContent, setLogContent] = useState(
    logs
      .map((log) => `[${new Date(log.timestamp).toISOString()}] [${log.status.toUpperCase()}] ${log.process}: ${log.message}`)
      .join('\n')
  );

  // Error distribution data
  const errorData = [
    { name: 'Timeout', value: 5, color: '#f44336' },
    { name: 'API Error', value: 3, color: '#ff9800' },
    { name: 'Validation', value: 2, color: '#ffc107' },
  ];

  const failedExecutions = executions.filter((e) => e.status === 'failed');

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Real-time Logs */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Real-time Logs</Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Filter</InputLabel>
                  <Select value={logFilter} onChange={(e) => setLogFilter(e.target.value)} label="Filter">
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="error">Errors</MenuItem>
                    <MenuItem value="warning">Warnings</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ height: 400 }}>
                <Editor
                  height="400px"
                  defaultLanguage="log"
                  value={logContent}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 12,
                  }}
                  theme="vs-dark"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Alerts
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {alerts.map((alert) => (
                  <Alert key={alert.id} severity={alert.severity}>
                    <Typography variant="body2" fontWeight="bold">
                      {alert.type.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="caption">{alert.message}</Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {new Date(alert.timestamp).toLocaleString()}
                    </Typography>
                  </Alert>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Error Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Error Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={errorData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {errorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Failed Workflows & Retry */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Failed Workflows
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Workflow</TableCell>
                      <TableCell>Failed At</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {failedExecutions.slice(0, 5).map((execution) => (
                      <TableRow key={execution.id}>
                        <TableCell>{execution.name}</TableCell>
                        <TableCell>{new Date(execution.startTime).toLocaleString()}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => onRetry(execution.id)} color="primary">
                            <Replay />
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

        {/* Audit Trail */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Audit Trail
              </Typography>
              <DataGrid
                rows={logs.map((log, index) => ({ ...log, id: index }))}
                columns={[
                  {
                    field: 'timestamp',
                    headerName: 'Timestamp',
                    width: 200,
                    valueFormatter: (params) => new Date(params.value).toLocaleString(),
                  },
                  { field: 'process', headerName: 'Process', flex: 1 },
                  {
                    field: 'status',
                    headerName: 'Status',
                    width: 120,
                    renderCell: (params) => (
                      <Chip label={params.value} size="small" color={params.value === 'success' ? 'success' : 'error'} />
                    ),
                  },
                  { field: 'duration', headerName: 'Duration (ms)', width: 120 },
                  { field: 'message', headerName: 'Message', flex: 1 },
                ]}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                autoHeight
                disableSelectionOnClick
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
