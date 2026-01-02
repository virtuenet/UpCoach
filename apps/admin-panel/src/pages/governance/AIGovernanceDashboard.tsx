import React, { useState, useMemo } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
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
  IconButton,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Cancel,
  Search,
  FilterList,
  Download,
  Upload,
  Visibility,
  Edit,
  Delete,
  PlayArrow,
  Stop,
  Refresh,
  ExpandMore,
  Settings,
  Security,
  Assessment,
  Science,
  Policy,
  AccountTree,
  Timeline,
  BubbleChart,
  ShowChart,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  Pie,
  PieChart
} from 'recharts';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import useSWR from 'swr';
import Plot from 'react-plotly.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  owner: string;
  status: 'development' | 'review' | 'approved' | 'deployed' | 'deprecated';
  deployedAt?: string;
  accuracy: number;
  tags: string[];
}

interface PerformanceMetric {
  timestamp: string;
  accuracy: number;
  latency: number;
  throughput: number;
}

interface DriftAlert {
  id: string;
  modelId: string;
  featureName: string;
  driftScore: number;
  driftType: 'data' | 'concept' | 'prediction';
  status: 'active' | 'resolved';
  detectedAt: string;
}

interface BiasMetric {
  protectedAttribute: string;
  group: string;
  demographicParity: number;
  truePositiveRate: number;
  falsePositiveRate: number;
}

interface FeatureImportance {
  feature: string;
  importance: number;
}

interface ExperimentRun {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  accuracy: number;
  loss: number;
  learningRate: number;
  batchSize: number;
  startTime: string;
  duration?: number;
}

interface ComplianceItem {
  category: string;
  status: 'complete' | 'incomplete' | 'in_progress';
  description: string;
  lastChecked: string;
}

interface RiskItem {
  category: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  description: string;
  mitigation: string;
}

// ============================================================================
// Mock Data Fetcher
// ============================================================================

const fetcher = async (url: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock data based on URL
  if (url.includes('/models')) {
    return generateMockModels();
  } else if (url.includes('/performance')) {
    return generateMockPerformance();
  } else if (url.includes('/drift')) {
    return generateMockDriftAlerts();
  } else if (url.includes('/bias')) {
    return generateMockBiasMetrics();
  } else if (url.includes('/experiments')) {
    return generateMockExperiments();
  } else if (url.includes('/compliance')) {
    return generateMockCompliance();
  } else if (url.includes('/risks')) {
    return generateMockRisks();
  }

  return null;
};

// ============================================================================
// Mock Data Generators
// ============================================================================

function generateMockModels(): ModelMetadata[] {
  return [
    {
      id: '1',
      name: 'Credit Scoring Model',
      version: '2.3.1',
      owner: 'Alice Johnson',
      status: 'deployed',
      deployedAt: '2024-01-15',
      accuracy: 0.92,
      tags: ['production', 'high-risk']
    },
    {
      id: '2',
      name: 'Churn Prediction',
      version: '1.5.0',
      owner: 'Bob Smith',
      status: 'deployed',
      deployedAt: '2024-02-01',
      accuracy: 0.88,
      tags: ['production']
    },
    {
      id: '3',
      name: 'Recommendation Engine',
      version: '3.0.0-beta',
      owner: 'Carol White',
      status: 'review',
      accuracy: 0.85,
      tags: ['beta', 'testing']
    },
    {
      id: '4',
      name: 'Fraud Detection',
      version: '1.0.0',
      owner: 'David Brown',
      status: 'approved',
      accuracy: 0.94,
      tags: ['security', 'high-risk']
    },
    {
      id: '5',
      name: 'Sentiment Analysis',
      version: '2.1.0',
      owner: 'Eve Davis',
      status: 'development',
      accuracy: 0.78,
      tags: ['nlp', 'experimental']
    }
  ];
}

function generateMockPerformance(): PerformanceMetric[] {
  const data: PerformanceMetric[] = [];
  const now = Date.now();

  for (let i = 30; i >= 0; i--) {
    data.push({
      timestamp: new Date(now - i * 24 * 60 * 60 * 1000).toISOString(),
      accuracy: 0.9 + Math.random() * 0.08 - (i < 5 ? 0.05 : 0),
      latency: 50 + Math.random() * 20 + (i < 5 ? 30 : 0),
      throughput: 1000 + Math.random() * 200
    });
  }

  return data;
}

function generateMockDriftAlerts(): DriftAlert[] {
  return [
    {
      id: '1',
      modelId: '1',
      featureName: 'credit_score',
      driftScore: 0.23,
      driftType: 'data',
      status: 'active',
      detectedAt: '2024-03-10'
    },
    {
      id: '2',
      modelId: '1',
      featureName: 'income',
      driftScore: 0.18,
      driftType: 'data',
      status: 'active',
      detectedAt: '2024-03-09'
    },
    {
      id: '3',
      modelId: '2',
      featureName: 'model_accuracy',
      driftScore: 0.12,
      driftType: 'concept',
      status: 'resolved',
      detectedAt: '2024-03-05'
    }
  ];
}

function generateMockBiasMetrics(): BiasMetric[] {
  return [
    {
      protectedAttribute: 'gender',
      group: 'male',
      demographicParity: 0.65,
      truePositiveRate: 0.82,
      falsePositiveRate: 0.12
    },
    {
      protectedAttribute: 'gender',
      group: 'female',
      demographicParity: 0.58,
      truePositiveRate: 0.78,
      falsePositiveRate: 0.15
    },
    {
      protectedAttribute: 'age',
      group: '18-30',
      demographicParity: 0.70,
      truePositiveRate: 0.85,
      falsePositiveRate: 0.10
    },
    {
      protectedAttribute: 'age',
      group: '31-50',
      demographicParity: 0.62,
      truePositiveRate: 0.80,
      falsePositiveRate: 0.13
    },
    {
      protectedAttribute: 'age',
      group: '51+',
      demographicParity: 0.55,
      truePositiveRate: 0.75,
      falsePositiveRate: 0.18
    }
  ];
}

function generateMockExperiments(): ExperimentRun[] {
  return [
    {
      id: '1',
      name: 'baseline_model',
      status: 'completed',
      accuracy: 0.85,
      loss: 0.32,
      learningRate: 0.001,
      batchSize: 32,
      startTime: '2024-03-01T10:00:00Z',
      duration: 3600000
    },
    {
      id: '2',
      name: 'increased_lr',
      status: 'completed',
      accuracy: 0.87,
      loss: 0.28,
      learningRate: 0.01,
      batchSize: 32,
      startTime: '2024-03-01T12:00:00Z',
      duration: 3200000
    },
    {
      id: '3',
      name: 'larger_batch',
      status: 'completed',
      accuracy: 0.88,
      loss: 0.26,
      learningRate: 0.001,
      batchSize: 64,
      startTime: '2024-03-01T14:00:00Z',
      duration: 2800000
    },
    {
      id: '4',
      name: 'optimized',
      status: 'running',
      accuracy: 0.90,
      loss: 0.22,
      learningRate: 0.005,
      batchSize: 64,
      startTime: '2024-03-01T16:00:00Z'
    }
  ];
}

function generateMockCompliance(): ComplianceItem[] {
  return [
    {
      category: 'Fairness',
      status: 'complete',
      description: 'Bias assessment completed for all protected attributes',
      lastChecked: '2024-03-10'
    },
    {
      category: 'Transparency',
      status: 'complete',
      description: 'Model cards generated and up-to-date',
      lastChecked: '2024-03-10'
    },
    {
      category: 'Accountability',
      status: 'in_progress',
      description: 'Audit trail implementation in progress',
      lastChecked: '2024-03-08'
    },
    {
      category: 'Privacy',
      status: 'complete',
      description: 'Differential privacy mechanisms deployed',
      lastChecked: '2024-03-09'
    },
    {
      category: 'Safety',
      status: 'incomplete',
      description: 'Adversarial robustness testing pending',
      lastChecked: '2024-03-05'
    }
  ];
}

function generateMockRisks(): RiskItem[] {
  return [
    {
      category: 'Data Drift',
      likelihood: 4,
      impact: 5,
      description: 'Input data distribution changing over time',
      mitigation: 'Continuous monitoring with automated alerts'
    },
    {
      category: 'Bias Amplification',
      likelihood: 3,
      impact: 5,
      description: 'Model amplifying existing biases in training data',
      mitigation: 'Regular fairness audits and bias mitigation'
    },
    {
      category: 'Privacy Breach',
      likelihood: 2,
      impact: 5,
      description: 'Potential for model inversion or membership inference attacks',
      mitigation: 'Differential privacy and access controls'
    },
    {
      category: 'Model Degradation',
      likelihood: 3,
      impact: 4,
      description: 'Performance decline due to concept drift',
      mitigation: 'Regular retraining and validation'
    },
    {
      category: 'Adversarial Attack',
      likelihood: 2,
      impact: 4,
      description: 'Malicious inputs designed to fool the model',
      mitigation: 'Input validation and adversarial training'
    }
  ];
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function AIGovernanceDashboard() {
  const [currentTab, setCurrentTab] = useState(0);

  // Data fetching with SWR
  const { data: models, mutate: mutateModels } = useSWR('/api/models', fetcher, {
    refreshInterval: 10000
  });

  const { data: performance } = useSWR('/api/performance', fetcher, {
    refreshInterval: 10000
  });

  const { data: driftAlerts } = useSWR('/api/drift', fetcher, {
    refreshInterval: 10000
  });

  const { data: biasMetrics } = useSWR('/api/bias', fetcher, {
    refreshInterval: 10000
  });

  const { data: experiments } = useSWR('/api/experiments', fetcher, {
    refreshInterval: 10000
  });

  const { data: compliance } = useSWR('/api/compliance', fetcher, {
    refreshInterval: 10000
  });

  const { data: risks } = useSWR('/api/risks', fetcher, {
    refreshInterval: 10000
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          AI Governance Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor model performance, compliance, and responsible AI metrics
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Assessment />} label="Overview" iconPosition="start" />
          <Tab icon={<AccountTree />} label="Model Registry" iconPosition="start" />
          <Tab icon={<Timeline />} label="Monitoring" iconPosition="start" />
          <Tab icon={<BubbleChart />} label="Explainability" iconPosition="start" />
          <Tab icon={<Science />} label="Experiments" iconPosition="start" />
          <Tab icon={<Policy />} label="Compliance" iconPosition="start" />
        </Tabs>
      </Paper>

      {currentTab === 0 && <OverviewTab models={models} performance={performance} driftAlerts={driftAlerts} compliance={compliance} />}
      {currentTab === 1 && <ModelRegistryTab models={models} mutateModels={mutateModels} />}
      {currentTab === 2 && <MonitoringTab models={models} performance={performance} driftAlerts={driftAlerts} biasMetrics={biasMetrics} />}
      {currentTab === 3 && <ExplainabilityTab />}
      {currentTab === 4 && <ExperimentsTab experiments={experiments} />}
      {currentTab === 5 && <ComplianceTab compliance={compliance} biasMetrics={biasMetrics} risks={risks} />}
    </Container>
  );
}

// ============================================================================
// Tab 1: Overview
// ============================================================================

function OverviewTab({ models, performance, driftAlerts, compliance }: any) {
  const stats = useMemo(() => {
    if (!models) return null;

    return {
      total: models.length,
      deployed: models.filter((m: ModelMetadata) => m.status === 'deployed').length,
      inDevelopment: models.filter((m: ModelMetadata) => m.status === 'development').length,
      deprecated: models.filter((m: ModelMetadata) => m.status === 'deprecated').length
    };
  }, [models]);

  const activeDriftAlerts = driftAlerts?.filter((a: DriftAlert) => a.status === 'active').length || 0;

  return (
    <Box>
      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Models
              </Typography>
              <Typography variant="h3">{stats?.total || 0}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="success" />
                <Typography variant="body2" color="success.main" sx={{ ml: 1 }}>
                  +2 this month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Deployed Models
              </Typography>
              <Typography variant="h3">{stats?.deployed || 0}</Typography>
              <Chip label="Production" color="success" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Alerts
              </Typography>
              <Typography variant="h3" color={activeDriftAlerts > 0 ? 'warning.main' : 'text.primary'}>
                {activeDriftAlerts}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Warning color="warning" />
                <Typography variant="body2" color="warning.main" sx={{ ml: 1 }}>
                  Drift detected
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Compliance Score
              </Typography>
              <Typography variant="h3">85%</Typography>
              <LinearProgress variant="determinate" value={85} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Trend */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Model Performance Trends (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#8884d8"
                  name="Accuracy"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="latency"
                  stroke="#82ca9d"
                  name="Latency (ms)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Alerts
            </Typography>
            <List>
              {driftAlerts?.slice(0, 5).map((alert: DriftAlert) => (
                <ListItem key={alert.id}>
                  <ListItemIcon>
                    <Warning color={alert.status === 'active' ? 'warning' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${alert.featureName} drift`}
                    secondary={`Score: ${alert.driftScore.toFixed(2)}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Compliance Status */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Compliance Overview
        </Typography>
        <Grid container spacing={2}>
          {compliance?.map((item: ComplianceItem) => (
            <Grid item xs={12} sm={6} md={4} key={item.category}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography>{item.category}</Typography>
                {item.status === 'complete' && <CheckCircle color="success" />}
                {item.status === 'in_progress' && <Warning color="warning" />}
                {item.status === 'incomplete' && <Cancel color="error" />}
              </Box>
              <LinearProgress
                variant="determinate"
                value={item.status === 'complete' ? 100 : item.status === 'in_progress' ? 50 : 0}
                sx={{ mt: 1 }}
                color={item.status === 'complete' ? 'success' : item.status === 'in_progress' ? 'warning' : 'error'}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}

// ============================================================================
// Tab 2: Model Registry
// ============================================================================

function ModelRegistryTab({ models, mutateModels }: any) {
  const [selectedModel, setSelectedModel] = useState<ModelMetadata | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'lineage' | 'card'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredModels = useMemo(() => {
    if (!models) return [];
    return models.filter((m: ModelMetadata) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.owner.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [models, searchTerm]);

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Model Name',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2">{params.row.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            v{params.row.version}
          </Typography>
        </Box>
      )
    },
    { field: 'owner', headerName: 'Owner', flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'deployed'
              ? 'success'
              : params.value === 'approved'
              ? 'info'
              : params.value === 'review'
              ? 'warning'
              : 'default'
          }
        />
      )
    },
    {
      field: 'accuracy',
      headerName: 'Accuracy',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => `${(params.value * 100).toFixed(1)}%`
    },
    {
      field: 'deployedAt',
      headerName: 'Deployed',
      flex: 1,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? new Date(params.value).toLocaleDateString() : '-'
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton size="small" onClick={() => setSelectedModel(params.row)}>
            <Visibility />
          </IconButton>
          <IconButton size="small">
            <Edit />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          placeholder="Search models..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search />
          }}
          sx={{ width: 300 }}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
          <Button
            variant={viewMode === 'lineage' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('lineage')}
          >
            Lineage
          </Button>
          <Button
            variant={viewMode === 'card' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('card')}
          >
            Cards
          </Button>
        </Box>
      </Box>

      {/* Content */}
      {viewMode === 'table' && (
        <Paper sx={{ height: 600 }}>
          <DataGrid
            rows={filteredModels || []}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
          />
        </Paper>
      )}

      {viewMode === 'lineage' && <ModelLineageView />}
      {viewMode === 'card' && <ModelCardView model={selectedModel || filteredModels?.[0]} />}

      {/* Model Details Dialog */}
      {selectedModel && (
        <ModelDetailsDialog
          model={selectedModel}
          open={!!selectedModel}
          onClose={() => setSelectedModel(null)}
        />
      )}
    </Box>
  );
}

function ModelLineageView() {
  const nodes: Node[] = [
    {
      id: '1',
      type: 'input',
      data: { label: 'Training Data\nv2.1' },
      position: { x: 50, y: 100 },
      sourcePosition: Position.Right
    },
    {
      id: '2',
      data: { label: 'Preprocessing\nv1.5' },
      position: { x: 250, y: 100 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left
    },
    {
      id: '3',
      data: { label: 'Training\ncommit: abc123' },
      position: { x: 450, y: 100 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left
    },
    {
      id: '4',
      data: { label: 'Model v2.3.1\nAccuracy: 92%' },
      position: { x: 650, y: 100 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left
    },
    {
      id: '5',
      type: 'output',
      data: { label: 'Production\nDeployed: 2024-01-15' },
      position: { x: 850, y: 100 },
      targetPosition: Position.Left
    }
  ];

  const edges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e2-3', source: '2', target: '3', animated: true },
    { id: 'e3-4', source: '3', target: '4', animated: true },
    { id: 'e4-5', source: '4', target: '5', animated: true }
  ];

  return (
    <Paper sx={{ height: 600, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Model Lineage
      </Typography>
      <Box sx={{ height: 500 }}>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </Box>
    </Paper>
  );
}

function ModelCardView({ model }: { model?: ModelMetadata }) {
  if (!model) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Select a model to view its card</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Model Card: {model.name}
      </Typography>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Model Details</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Version
              </Typography>
              <Typography>{model.version}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Owner
              </Typography>
              <Typography>{model.owner}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip label={model.status} size="small" />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Accuracy
              </Typography>
              <Typography>{(model.accuracy * 100).toFixed(1)}%</Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Intended Use</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            This model is designed for credit risk assessment in consumer lending applications.
            It predicts the likelihood of loan default based on applicant financial and demographic data.
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            Out of Scope
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Should not be used for employment decisions" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Not validated for commercial lending" />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Performance Metrics</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2">Accuracy: 92%</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Precision: 89%</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Recall: 85%</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">F1 Score: 87%</Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Ethical Considerations</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" gutterBottom>
            Fairness Assessment
          </Typography>
          <Typography paragraph>
            Model has been evaluated for bias across protected attributes (gender, age, race).
            Disparate impact ratio: 0.85 (meets 80% rule).
          </Typography>
          <Typography variant="body2" gutterBottom>
            Recommendations
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Regular bias audits required (quarterly)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Human review mandatory for high-risk decisions" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Explanation must be provided for all denials" />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}

function ModelDetailsDialog({ model, open, onClose }: { model: ModelMetadata; open: boolean; onClose: () => void }) {
  const [activeStep, setActiveStep] = useState(0);

  const approvalSteps = ['Submit', 'Review', 'Approve', 'Deploy'];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{model.name} - v{model.version}</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {approvalSteps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Typography variant="h6" gutterBottom>
          Model Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Owner
            </Typography>
            <Typography>{model.owner}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Chip label={model.status} size="small" />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Accuracy
            </Typography>
            <Typography>{(model.accuracy * 100).toFixed(1)}%</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Deployed At
            </Typography>
            <Typography>{model.deployedAt || 'Not deployed'}</Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Tags
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {model.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" color="primary">
          View Full Details
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================================
// Tab 3: Monitoring
// ============================================================================

function MonitoringTab({ models, performance, driftAlerts, biasMetrics }: any) {
  const [selectedModel, setSelectedModel] = useState('all');

  return (
    <Box>
      {/* Model Selector */}
      <FormControl sx={{ mb: 3, minWidth: 200 }}>
        <InputLabel>Select Model</InputLabel>
        <Select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} label="Select Model">
          <MenuItem value="all">All Models</MenuItem>
          {models?.map((m: ModelMetadata) => (
            <MenuItem key={m.id} value={m.id}>
              {m.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Performance Dashboard */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Current Accuracy
              </Typography>
              <Typography variant="h3">92.3%</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingDown color="error" />
                <Typography variant="body2" color="error.main" sx={{ ml: 1 }}>
                  -1.2% from baseline
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Avg Latency
              </Typography>
              <Typography variant="h3">68ms</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="warning" />
                <Typography variant="body2" color="warning.main" sx={{ ml: 1 }}>
                  +18ms from baseline
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Throughput
              </Typography>
              <Typography variant="h3">1,200/s</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="success" />
                <Typography variant="body2" color="success.main" sx={{ ml: 1 }}>
                  Normal
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Drift Alerts */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Data Drift Alerts
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Model</TableCell>
                <TableCell>Feature</TableCell>
                <TableCell>Drift Type</TableCell>
                <TableCell>Drift Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Detected At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {driftAlerts?.map((alert: DriftAlert) => (
                <TableRow key={alert.id}>
                  <TableCell>Credit Scoring Model</TableCell>
                  <TableCell>{alert.featureName}</TableCell>
                  <TableCell>
                    <Chip label={alert.driftType} size="small" />
                  </TableCell>
                  <TableCell>{alert.driftScore.toFixed(3)}</TableCell>
                  <TableCell>
                    <Chip
                      label={alert.status}
                      size="small"
                      color={alert.status === 'active' ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{new Date(alert.detectedAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Distribution Comparison */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Feature Distribution Comparison
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              { feature: 'credit_score', training: 650, production: 620 },
              { feature: 'income', training: 50000, production: 48000 },
              { feature: 'age', training: 38, production: 40 },
              { feature: 'loan_amount', training: 15000, production: 16000 }
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="feature" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="training" fill="#8884d8" name="Training Data" />
            <Bar dataKey="production" fill="#82ca9d" name="Production Data" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Bias Monitoring */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Bias Monitoring
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Protected Attribute</TableCell>
                <TableCell>Group</TableCell>
                <TableCell>Demographic Parity</TableCell>
                <TableCell>True Positive Rate</TableCell>
                <TableCell>False Positive Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {biasMetrics?.map((metric: BiasMetric, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{metric.protectedAttribute}</TableCell>
                  <TableCell>{metric.group}</TableCell>
                  <TableCell>{metric.demographicParity.toFixed(2)}</TableCell>
                  <TableCell>{metric.truePositiveRate.toFixed(2)}</TableCell>
                  <TableCell>{metric.falsePositiveRate.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

// ============================================================================
// Tab 4: Explainability
// ============================================================================

function ExplainabilityTab() {
  const featureImportances: FeatureImportance[] = [
    { feature: 'credit_score', importance: 0.35 },
    { feature: 'income', importance: 0.28 },
    { feature: 'employment_length', importance: 0.15 },
    { feature: 'debt_to_income', importance: 0.12 },
    { feature: 'loan_amount', importance: 0.10 }
  ];

  const shapData = [
    { feature: 'credit_score', value: 720, contribution: 0.15 },
    { feature: 'income', value: 75000, contribution: 0.12 },
    { feature: 'employment_length', value: 5, contribution: 0.08 },
    { feature: 'debt_to_income', value: 0.3, contribution: -0.05 },
    { feature: 'loan_amount', value: 20000, contribution: -0.03 }
  ];

  return (
    <Box>
      {/* Feature Importance */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Global Feature Importance
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={featureImportances} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="feature" width={150} />
            <RechartsTooltip />
            <Bar dataKey="importance" fill="#8884d8">
              {featureImportances.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`hsl(${220 - index * 20}, 70%, 50%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* SHAP Values */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          SHAP Values (Sample Prediction)
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Prediction: 0.78 (Approved) | Base Value: 0.50
        </Typography>

        <Box sx={{ my: 3 }}>
          <Plot
            data={[
              {
                type: 'bar',
                x: shapData.map((d) => d.contribution),
                y: shapData.map((d) => d.feature),
                orientation: 'h',
                marker: {
                  color: shapData.map((d) => (d.contribution > 0 ? 'green' : 'red'))
                }
              }
            ]}
            layout={{
              title: 'Feature Contributions',
              xaxis: { title: 'SHAP Value' },
              yaxis: { title: 'Feature' },
              height: 300,
              margin: { l: 150 }
            }}
            config={{ displayModeBar: false }}
            style={{ width: '100%' }}
          />
        </Box>
      </Paper>

      {/* LIME Explanation */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          LIME Local Explanation
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Feature</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Weight</TableCell>
                <TableCell>Impact</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>credit_score</TableCell>
                <TableCell>720</TableCell>
                <TableCell>0.42</TableCell>
                <TableCell>
                  <Chip label="Positive" color="success" size="small" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>income</TableCell>
                <TableCell>$75,000</TableCell>
                <TableCell>0.35</TableCell>
                <TableCell>
                  <Chip label="Positive" color="success" size="small" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>debt_to_income</TableCell>
                <TableCell>0.30</TableCell>
                <TableCell>-0.18</TableCell>
                <TableCell>
                  <Chip label="Negative" color="error" size="small" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Counterfactual Generator */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Counterfactual Explanation
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          To change the prediction from "Denied" to "Approved", the following changes are needed:
        </Alert>
        <List>
          <ListItem>
            <ListItemText
              primary="Increase credit score from 620 to 680"
              secondary="Impact: +0.15 prediction score"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Reduce debt-to-income ratio from 0.45 to 0.35"
              secondary="Impact: +0.08 prediction score"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Increase income from $45,000 to $55,000"
              secondary="Impact: +0.05 prediction score"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}

// ============================================================================
// Tab 5: Experiments
// ============================================================================

function ExperimentsTab({ experiments }: any) {
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Run Name', flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'completed' ? 'success' : params.value === 'running' ? 'info' : 'error'}
        />
      )
    },
    {
      field: 'accuracy',
      headerName: 'Accuracy',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => `${(params.value * 100).toFixed(2)}%`
    },
    {
      field: 'loss',
      headerName: 'Loss',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => params.value.toFixed(4)
    },
    { field: 'learningRate', headerName: 'Learning Rate', flex: 1 },
    { field: 'batchSize', headerName: 'Batch Size', flex: 1 },
    {
      field: 'duration',
      headerName: 'Duration',
      flex: 1,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? `${(params.value / 60000).toFixed(1)}m` : '-'
    }
  ];

  // Parallel coordinates data for hyperparameter visualization
  const parallelData = experiments?.map((exp: ExperimentRun) => ({
    learningRate: exp.learningRate,
    batchSize: exp.batchSize,
    accuracy: exp.accuracy,
    loss: exp.loss
  })) || [];

  return (
    <Box>
      {/* Experiment Leaderboard */}
      <Paper sx={{ mb: 3, height: 400 }}>
        <DataGrid
          rows={experiments || []}
          columns={columns}
          pageSize={10}
          checkboxSelection
          onSelectionModelChange={(ids) => setSelectedRuns(ids as string[])}
        />
      </Paper>

      {/* Hyperparameter Visualization */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Hyperparameter Analysis
        </Typography>
        <Box sx={{ height: 400 }}>
          <Plot
            data={[
              {
                type: 'parcoords',
                line: {
                  color: parallelData.map((d: any) => d.accuracy),
                  colorscale: 'Viridis'
                },
                dimensions: [
                  {
                    label: 'Learning Rate',
                    values: parallelData.map((d: any) => d.learningRate)
                  },
                  {
                    label: 'Batch Size',
                    values: parallelData.map((d: any) => d.batchSize)
                  },
                  {
                    label: 'Accuracy',
                    values: parallelData.map((d: any) => d.accuracy)
                  },
                  {
                    label: 'Loss',
                    values: parallelData.map((d: any) => d.loss)
                  }
                ]
              }
            ]}
            layout={{
              height: 350,
              margin: { t: 50, b: 50 }
            }}
            config={{ displayModeBar: false }}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
      </Paper>

      {/* Training Curves Comparison */}
      {selectedRuns.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Training Curves Comparison
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Accuracy', angle: -90, position: 'insideLeft' }} />
              <RechartsTooltip />
              <Legend />
              {selectedRuns.map((runId, idx) => {
                const run = experiments.find((e: ExperimentRun) => e.id === runId);
                const data = Array.from({ length: 10 }, (_, i) => ({
                  epoch: i + 1,
                  accuracy: run.accuracy * (0.5 + i * 0.05) + Math.random() * 0.02
                }));

                return (
                  <Line
                    key={runId}
                    data={data}
                    type="monotone"
                    dataKey="accuracy"
                    stroke={`hsl(${idx * 60}, 70%, 50%)`}
                    name={run.name}
                    strokeWidth={2}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}
    </Box>
  );
}

// ============================================================================
// Tab 6: Compliance
// ============================================================================

function ComplianceTab({ compliance, biasMetrics, risks }: any) {
  return (
    <Box>
      {/* Ethics Checklist */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          AI Ethics Checklist
        </Typography>
        <Grid container spacing={2}>
          {compliance?.map((item: ComplianceItem) => (
            <Grid item xs={12} md={6} key={item.category}>
              <FormControlLabel
                control={<Checkbox checked={item.status === 'complete'} />}
                label={item.category}
              />
              <Typography variant="body2" color="text.secondary">
                {item.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last checked: {new Date(item.lastChecked).toLocaleDateString()}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Fairness Assessment */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Fairness Assessment
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={biasMetrics?.slice(0, 5)}>
            <PolarGrid />
            <PolarAngleAxis dataKey="group" />
            <PolarRadiusAxis angle={90} domain={[0, 1]} />
            <Radar
              name="Demographic Parity"
              dataKey="demographicParity"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Radar
              name="True Positive Rate"
              dataKey="truePositiveRate"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.6}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Privacy Dashboard */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Privacy Protection Status
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Differential Privacy Budget
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Box sx={{ flex: 1, mr: 2 }}>
                <LinearProgress variant="determinate" value={35} />
              </Box>
              <Typography variant="body2">ε = 0.35 / 1.0</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              K-Anonymity Status
            </Typography>
            <Chip label="K=5 Satisfied" color="success" sx={{ mt: 1 }} />
          </Grid>
        </Grid>
      </Paper>

      {/* Risk Assessment */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Risk Assessment Matrix
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Risk Category</TableCell>
                <TableCell>Likelihood (1-5)</TableCell>
                <TableCell>Impact (1-5)</TableCell>
                <TableCell>Risk Score</TableCell>
                <TableCell>Mitigation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {risks?.map((risk: RiskItem) => {
                const riskScore = risk.likelihood * risk.impact;
                let color: 'success' | 'warning' | 'error' = 'success';
                if (riskScore > 15) color = 'error';
                else if (riskScore > 8) color = 'warning';

                return (
                  <TableRow key={risk.category}>
                    <TableCell>{risk.category}</TableCell>
                    <TableCell>{risk.likelihood}</TableCell>
                    <TableCell>{risk.impact}</TableCell>
                    <TableCell>
                      <Chip label={riskScore} color={color} size="small" />
                    </TableCell>
                    <TableCell>{risk.mitigation}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Regulatory Compliance */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Regulatory Compliance
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="GDPR Article 22" />
              <CardContent>
                <LinearProgress variant="determinate" value={90} color="success" sx={{ mb: 1 }} />
                <Typography variant="body2">90% Complete</Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Right to explanation" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Automated decision disclosure" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Warning color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Contest mechanism" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="CCPA" />
              <CardContent>
                <LinearProgress variant="determinate" value={85} color="success" sx={{ mb: 1 }} />
                <Typography variant="body2">85% Complete</Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Data inventory" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Opt-out mechanism" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="EU AI Act" />
              <CardContent>
                <LinearProgress variant="determinate" value={75} color="warning" sx={{ mb: 1 }} />
                <Typography variant="body2">75% Complete</Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Risk assessment" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Warning color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Human oversight" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Warning color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Conformity assessment" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
