/**
 * ML Model Management Dashboard
 *
 * Comprehensive dashboard for managing machine learning models, training,
 * evaluation, deployment, and monitoring.
 *
 * @module pages/ml/MLModelManagement
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
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
  Tooltip,
  Alert,
  AlertTitle,
  Switch,
  FormControlLabel,
  Slider,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  PlayArrow as TrainIcon,
  CloudUpload as DeployIcon,
  CloudDownload as DownloadIcon,
  Delete as DeleteIcon,
  Settings as ConfigIcon,
  Timeline as MetricsIcon,
  CompareArrows as CompareIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ChartIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Heatmap,
} from 'recharts';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface Model {
  id: string;
  name: string;
  type: 'logistic_regression' | 'random_forest' | 'linear_regression' | 'neural_network';
  version: string;
  status: 'training' | 'deployed' | 'inactive' | 'failed';
  metrics: ModelMetrics;
  trainedAt: Date;
  deployedAt?: Date;
  trainingProgress?: number;
  config: ModelConfig;
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  aucRoc: number;
  confusionMatrix: number[][];
  featureImportance: Record<string, number>;
}

interface ModelConfig {
  type: string;
  hyperparameters: Record<string, any>;
  trainingDataset: string;
  validationSplit: number;
  epochs?: number;
  batchSize?: number;
}

interface TrainingJob {
  id: string;
  modelId: string;
  modelName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  logs: string[];
}

interface Dataset {
  id: string;
  name: string;
  size: number;
  features: number;
  samples: number;
  uploadedAt: Date;
  version: string;
}

interface ABTest {
  id: string;
  name: string;
  models: string[];
  traffic: number[];
  status: 'active' | 'completed' | 'paused';
  metrics: Record<string, any>;
  startedAt: Date;
}

// ============================================================================
// Main Component
// ============================================================================

const MLModelManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [abTests, setABTests] = useState<ABTest[]>([]);
  const [trainDialogOpen, setTrainDialogOpen] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [selectedModelsForComparison, setSelectedModelsForComparison] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // ============================================================================
  // Mock Data
  // ============================================================================

  useEffect(() => {
    loadMockData();
    setupWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const loadMockData = () => {
    const mockModels: Model[] = [
      {
        id: 'model_1',
        name: 'Goal Completion Predictor',
        type: 'logistic_regression',
        version: '2.1.0',
        status: 'deployed',
        metrics: {
          accuracy: 0.87,
          precision: 0.85,
          recall: 0.89,
          f1Score: 0.87,
          aucRoc: 0.92,
          confusionMatrix: [[850, 150], [110, 890]],
          featureImportance: {
            sessions_per_week: 0.18,
            completion_rate: 0.16,
            response_rate: 0.14,
            streak_days: 0.12,
            avg_session_duration: 0.10,
            total_sessions: 0.08,
            active_goals: 0.07,
            milestone_completion: 0.15,
          },
        },
        trainedAt: new Date('2025-12-20'),
        deployedAt: new Date('2025-12-22'),
        config: {
          type: 'logistic_regression',
          hyperparameters: {
            learningRate: 0.01,
            maxIterations: 1000,
            regularization: 0.1,
          },
          trainingDataset: 'dataset_2024_q4',
          validationSplit: 0.2,
        },
      },
      {
        id: 'model_2',
        name: 'Churn Prediction Model',
        type: 'random_forest',
        version: '1.5.0',
        status: 'deployed',
        metrics: {
          accuracy: 0.91,
          precision: 0.88,
          recall: 0.93,
          f1Score: 0.90,
          aucRoc: 0.95,
          confusionMatrix: [[920, 80], [70, 930]],
          featureImportance: {
            last_activity_days: 0.22,
            response_rate: 0.19,
            completion_rate: 0.17,
            sessions_per_week: 0.13,
            avg_satisfaction: 0.11,
            active_goals: 0.09,
            streak_days: 0.09,
          },
        },
        trainedAt: new Date('2025-12-18'),
        deployedAt: new Date('2025-12-19'),
        config: {
          type: 'random_forest',
          hyperparameters: {
            numTrees: 100,
            maxDepth: 10,
            minSamplesSplit: 5,
          },
          trainingDataset: 'dataset_2024_q4',
          validationSplit: 0.2,
        },
      },
      {
        id: 'model_3',
        name: 'Engagement Score Model',
        type: 'linear_regression',
        version: '1.2.0',
        status: 'training',
        trainingProgress: 67,
        metrics: {
          accuracy: 0.0,
          precision: 0.0,
          recall: 0.0,
          f1Score: 0.0,
          aucRoc: 0.0,
          confusionMatrix: [[0, 0], [0, 0]],
          featureImportance: {},
        },
        trainedAt: new Date('2025-12-30'),
        config: {
          type: 'linear_regression',
          hyperparameters: {
            learningRate: 0.01,
            maxIterations: 1500,
            regularization: 0.05,
          },
          trainingDataset: 'dataset_2025_q1',
          validationSplit: 0.15,
        },
      },
      {
        id: 'model_4',
        name: 'Time-to-Goal Estimator',
        type: 'linear_regression',
        version: '1.0.0',
        status: 'inactive',
        metrics: {
          accuracy: 0.79,
          precision: 0.76,
          recall: 0.82,
          f1Score: 0.79,
          aucRoc: 0.84,
          confusionMatrix: [[780, 220], [180, 820]],
          featureImportance: {
            current_progress: 0.25,
            completion_rate: 0.20,
            sessions_per_week: 0.18,
            avg_time_to_completion: 0.15,
            active_habits: 0.12,
            milestone_completion: 0.10,
          },
        },
        trainedAt: new Date('2025-12-15'),
        config: {
          type: 'linear_regression',
          hyperparameters: {
            learningRate: 0.015,
            maxIterations: 800,
            regularization: 0.12,
          },
          trainingDataset: 'dataset_2024_q3',
          validationSplit: 0.2,
        },
      },
    ];

    const mockTrainingJobs: TrainingJob[] = [
      {
        id: 'job_1',
        modelId: 'model_3',
        modelName: 'Engagement Score Model',
        status: 'running',
        progress: 67,
        startedAt: new Date('2025-12-30T14:30:00'),
        logs: [
          '[14:30:15] Loading training data...',
          '[14:30:22] Dataset loaded: 50,000 samples',
          '[14:30:25] Starting training...',
          '[14:35:10] Epoch 100/150 - Loss: 0.245',
          '[14:40:30] Epoch 120/150 - Loss: 0.198',
        ],
      },
    ];

    const mockDatasets: Dataset[] = [
      {
        id: 'dataset_2025_q1',
        name: 'Q1 2025 User Data',
        size: 125000000,
        features: 27,
        samples: 50000,
        uploadedAt: new Date('2025-12-28'),
        version: '1.0',
      },
      {
        id: 'dataset_2024_q4',
        name: 'Q4 2024 User Data',
        size: 98000000,
        features: 27,
        samples: 42000,
        uploadedAt: new Date('2025-11-01'),
        version: '1.0',
      },
      {
        id: 'dataset_2024_q3',
        name: 'Q3 2024 User Data',
        size: 87000000,
        features: 25,
        samples: 38000,
        uploadedAt: new Date('2025-08-15'),
        version: '1.0',
      },
    ];

    const mockABTests: ABTest[] = [
      {
        id: 'ab_1',
        name: 'Goal Completion Model v2.0 vs v2.1',
        models: ['model_1', 'model_2'],
        traffic: [50, 50],
        status: 'active',
        metrics: {
          model_1: { predictions: 5234, accuracy: 0.86 },
          model_2: { predictions: 5198, accuracy: 0.89 },
        },
        startedAt: new Date('2025-12-25'),
      },
    ];

    setModels(mockModels);
    setTrainingJobs(mockTrainingJobs);
    setDatasets(mockDatasets);
    setABTests(mockABTests);
  };

  const setupWebSocket = () => {
    // Mock WebSocket for training progress
    const mockWs = {
      close: () => {},
    } as WebSocket;
    setWs(mockWs);

    // Simulate training progress updates
    const interval = setInterval(() => {
      setTrainingJobs(prev =>
        prev.map(job =>
          job.status === 'running'
            ? { ...job, progress: Math.min(100, job.progress + Math.random() * 5) }
            : job
        )
      );

      setModels(prev =>
        prev.map(model =>
          model.status === 'training'
            ? { ...model, trainingProgress: Math.min(100, (model.trainingProgress || 0) + Math.random() * 5) }
            : model
        )
      );
    }, 2000);

    return () => clearInterval(interval);
  };

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleTrainModel = () => {
    setTrainDialogOpen(true);
  };

  const handleDeployModel = (model: Model) => {
    setSelectedModel(model);
    setDeployDialogOpen(true);
  };

  const handleCompareModels = () => {
    setCompareDialogOpen(true);
  };

  const handleDownloadModel = (modelId: string) => {
    console.log('Downloading model:', modelId);
    // In real implementation, trigger download
  };

  const handleDeleteModel = (modelId: string) => {
    if (confirm('Are you sure you want to delete this model?')) {
      setModels(prev => prev.filter(m => m.id !== modelId));
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      loadMockData();
      setLoading(false);
    }, 1000);
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  const renderModelsTab = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Model Registry</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<CompareIcon />}
            onClick={handleCompareModels}
            disabled={selectedModelsForComparison.length < 2}
            sx={{ mr: 1 }}
          >
            Compare Selected
          </Button>
          <Button
            variant="contained"
            startIcon={<TrainIcon />}
            onClick={handleTrainModel}
          >
            Train New Model
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <input type="checkbox" />
              </TableCell>
              <TableCell>Model Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Accuracy</TableCell>
              <TableCell>F1 Score</TableCell>
              <TableCell>AUC-ROC</TableCell>
              <TableCell>Trained</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {models.map((model) => (
              <TableRow
                key={model.id}
                hover
                onClick={() => setSelectedModel(model)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedModelsForComparison.includes(model.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSelectedModelsForComparison(prev =>
                        e.target.checked
                          ? [...prev, model.id]
                          : prev.filter(id => id !== model.id)
                      );
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {model.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={model.type.replace(/_/g, ' ')}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{model.version}</TableCell>
                <TableCell>
                  <Chip
                    label={model.status}
                    size="small"
                    color={
                      model.status === 'deployed' ? 'success' :
                      model.status === 'training' ? 'info' :
                      model.status === 'failed' ? 'error' : 'default'
                    }
                  />
                  {model.status === 'training' && (
                    <Box sx={{ width: '100%', mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={model.trainingProgress || 0}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(model.trainingProgress || 0)}%
                      </Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  {model.metrics.accuracy > 0
                    ? `${(model.metrics.accuracy * 100).toFixed(1)}%`
                    : '-'}
                </TableCell>
                <TableCell>
                  {model.metrics.f1Score > 0
                    ? model.metrics.f1Score.toFixed(3)
                    : '-'}
                </TableCell>
                <TableCell>
                  {model.metrics.aucRoc > 0
                    ? model.metrics.aucRoc.toFixed(3)
                    : '-'}
                </TableCell>
                <TableCell>
                  {model.trainedAt.toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Deploy">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeployModel(model);
                      }}
                      disabled={model.status === 'training'}
                    >
                      <DeployIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadModel(model.id);
                      }}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModel(model.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedModel && renderModelDetails()}
    </Box>
  );

  const renderModelDetails = () => {
    if (!selectedModel) return null;

    const featureImportanceData = Object.entries(selectedModel.metrics.featureImportance).map(
      ([feature, importance]) => ({
        feature: feature.replace(/_/g, ' '),
        importance: importance * 100,
      })
    );

    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Model Details: {selectedModel.name}
        </Typography>

        <Grid container spacing={3}>
          {/* Metrics Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Accuracy</Typography>
                <Typography variant="h4">
                  {(selectedModel.metrics.accuracy * 100).toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Precision</Typography>
                <Typography variant="h4">
                  {selectedModel.metrics.precision.toFixed(3)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Recall</Typography>
                <Typography variant="h4">
                  {selectedModel.metrics.recall.toFixed(3)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">F1 Score</Typography>
                <Typography variant="h4">
                  {selectedModel.metrics.f1Score.toFixed(3)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature Importance */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Feature Importance</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={featureImportanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="feature" type="category" width={150} />
                    <RechartsTooltip />
                    <Bar dataKey="importance" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Confusion Matrix */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Confusion Matrix</Typography>
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}></Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" align="center" display="block">
                        Predicted Negative
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" align="center" display="block">
                        Predicted Positive
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption">Actual Negative</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: '#4caf50',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h6">
                          {selectedModel.metrics.confusionMatrix[0][0]}
                        </Typography>
                        <Typography variant="caption">True Negative</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: '#f44336',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h6">
                          {selectedModel.metrics.confusionMatrix[0][1]}
                        </Typography>
                        <Typography variant="caption">False Positive</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption">Actual Positive</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: '#f44336',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h6">
                          {selectedModel.metrics.confusionMatrix[1][0]}
                        </Typography>
                        <Typography variant="caption">False Negative</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: '#4caf50',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h6">
                          {selectedModel.metrics.confusionMatrix[1][1]}
                        </Typography>
                        <Typography variant="caption">True Positive</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Configuration */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Configuration</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Training Dataset
                    </Typography>
                    <Typography variant="body1">
                      {selectedModel.config.trainingDataset}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Validation Split
                    </Typography>
                    <Typography variant="body1">
                      {(selectedModel.config.validationSplit * 100).toFixed(0)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Hyperparameters
                    </Typography>
                    <Box component="pre" sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                      {JSON.stringify(selectedModel.config.hyperparameters, null, 2)}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderTrainingTab = () => (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Active Training Jobs</Typography>
      </Box>

      {trainingJobs.map((job) => (
        <Card key={job.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">{job.modelName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Started: {job.startedAt.toLocaleString()}
                </Typography>
              </Box>
              <Chip
                label={job.status}
                color={job.status === 'running' ? 'primary' : 'default'}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Training Progress</Typography>
                <Typography variant="body2">{Math.round(job.progress)}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={job.progress} />
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>Training Logs</Typography>
              <Paper
                sx={{
                  bgcolor: 'grey.900',
                  color: 'grey.100',
                  p: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                {job.logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </Paper>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const renderDatasetsTab = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Training Datasets</Typography>
        <Button variant="contained" startIcon={<CloudUpload />}>
          Upload Dataset
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Dataset Name</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Samples</TableCell>
              <TableCell>Features</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datasets.map((dataset) => (
              <TableRow key={dataset.id} hover>
                <TableCell>{dataset.name}</TableCell>
                <TableCell>{dataset.version}</TableCell>
                <TableCell>{dataset.samples.toLocaleString()}</TableCell>
                <TableCell>{dataset.features}</TableCell>
                <TableCell>{(dataset.size / 1000000).toFixed(1)} MB</TableCell>
                <TableCell>{dataset.uploadedAt.toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Download">
                    <IconButton size="small">
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderABTestingTab = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">A/B Tests</Typography>
        <Button variant="contained">Create A/B Test</Button>
      </Box>

      {abTests.map((test) => (
        <Card key={test.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">{test.name}</Typography>
              <Chip
                label={test.status}
                color={test.status === 'active' ? 'success' : 'default'}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Started: {test.startedAt.toLocaleDateString()}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Traffic Split</Typography>
              <Grid container spacing={2}>
                {test.models.map((modelId, index) => {
                  const model = models.find(m => m.id === modelId);
                  return (
                    <Grid item xs={6} key={modelId}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="body2">{model?.name}</Typography>
                        <Typography variant="h4">{test.traffic[index]}%</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {test.metrics[modelId]?.predictions.toLocaleString()} predictions
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Accuracy: {(test.metrics[modelId]?.accuracy * 100).toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  // ============================================================================
  // Dialogs
  // ============================================================================

  const renderTrainDialog = () => (
    <Dialog open={trainDialogOpen} onClose={() => setTrainDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Train New Model</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Model Name"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Model Type</InputLabel>
                <Select defaultValue="logistic_regression">
                  <MenuItem value="logistic_regression">Logistic Regression</MenuItem>
                  <MenuItem value="random_forest">Random Forest</MenuItem>
                  <MenuItem value="linear_regression">Linear Regression</MenuItem>
                  <MenuItem value="neural_network">Neural Network</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Training Dataset</InputLabel>
                <Select defaultValue="dataset_2025_q1">
                  {datasets.map((dataset) => (
                    <MenuItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Validation Split: 20%</Typography>
              <Slider defaultValue={20} min={10} max={30} marks step={5} valueLabelDisplay="auto" />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Hyperparameters</Typography>
              <TextField
                fullWidth
                label="Learning Rate"
                type="number"
                defaultValue="0.01"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Max Iterations"
                type="number"
                defaultValue="1000"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Regularization"
                type="number"
                defaultValue="0.1"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setTrainDialogOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={() => setTrainDialogOpen(false)}>
          Start Training
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDeployDialog = () => (
    <Dialog open={deployDialogOpen} onClose={() => setDeployDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Deploy Model</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Deploy <strong>{selectedModel?.name}</strong> to production?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            This will replace the current production model. Ensure you've reviewed the metrics.
          </Alert>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Enable gradual rollout (10% traffic)"
            sx={{ mt: 2 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeployDialogOpen(false)}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={() => setDeployDialogOpen(false)}>
          Deploy
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderCompareDialog = () => {
    const comparisonModels = models.filter(m => selectedModelsForComparison.includes(m.id));

    const comparisonData = [
      {
        metric: 'Accuracy',
        ...Object.fromEntries(comparisonModels.map(m => [m.name, m.metrics.accuracy * 100])),
      },
      {
        metric: 'Precision',
        ...Object.fromEntries(comparisonModels.map(m => [m.name, m.metrics.precision * 100])),
      },
      {
        metric: 'Recall',
        ...Object.fromEntries(comparisonModels.map(m => [m.name, m.metrics.recall * 100])),
      },
      {
        metric: 'F1 Score',
        ...Object.fromEntries(comparisonModels.map(m => [m.name, m.metrics.f1Score * 100])),
      },
      {
        metric: 'AUC-ROC',
        ...Object.fromEntries(comparisonModels.map(m => [m.name, m.metrics.aucRoc * 100])),
      },
    ];

    return (
      <Dialog open={compareDialogOpen} onClose={() => setCompareDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Model Comparison</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip />
                <Legend />
                {comparisonModels.map((model, index) => (
                  <Bar
                    key={model.id}
                    dataKey={model.name}
                    fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'][index % 4]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Configuration Details</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Property</TableCell>
                    {comparisonModels.map(model => (
                      <TableCell key={model.id}>{model.name}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    {comparisonModels.map(model => (
                      <TableCell key={model.id}>{model.type}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Version</TableCell>
                    {comparisonModels.map(model => (
                      <TableCell key={model.id}>{model.version}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Training Dataset</TableCell>
                    {comparisonModels.map(model => (
                      <TableCell key={model.id}>{model.config.trainingDataset}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Trained Date</TableCell>
                    {comparisonModels.map(model => (
                      <TableCell key={model.id}>{model.trainedAt.toLocaleDateString()}</TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ML Model Management
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Train, evaluate, deploy, and monitor machine learning models for predictive analytics.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Models" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label="Training" icon={<TrainIcon />} iconPosition="start" />
          <Tab label="Datasets" icon={<CloudUpload />} iconPosition="start" />
          <Tab label="A/B Testing" icon={<CompareIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderModelsTab()}
      {activeTab === 1 && renderTrainingTab()}
      {activeTab === 2 && renderDatasetsTab()}
      {activeTab === 3 && renderABTestingTab()}

      {renderTrainDialog()}
      {renderDeployDialog()}
      {renderCompareDialog()}
    </Box>
  );
};

export default MLModelManagement;
