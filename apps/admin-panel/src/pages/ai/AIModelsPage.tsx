import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

/**
 * AI Models Management Page (Phase 8)
 *
 * Admin interface for monitoring and managing AI models:
 * - Model performance metrics
 * - Version tracking
 * - Retraining status
 * - Accuracy scores
 * - Data drift detection
 * - A/B test results
 */

interface AIModel {
  id: string;
  name: string;
  version: string;
  type: 'classification' | 'regression' | 'recommendation' | 'nlp';
  status: 'active' | 'training' | 'deprecated';
  accuracy: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  trainedAt: string;
  lastEvaluatedAt: string;
  datasetSize: number;
  features: number;
  inferenceTimeMs: number;
  dailyPredictions: number;
}

export default function AIModelsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);

    try {
      // Mock data - replace with actual API call
      const mockModels: AIModel[] = [
        {
          id: 'model-churn-prediction',
          name: 'Churn Prediction (XGBoost)',
          version: 'v2.3.1',
          type: 'classification',
          status: 'active',
          accuracy: 0.887,
          precision: 0.891,
          recall: 0.883,
          f1Score: 0.887,
          trainedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastEvaluatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          datasetSize: 125000,
          features: 47,
          inferenceTimeMs: 12,
          dailyPredictions: 15000,
        },
        {
          id: 'model-goal-success',
          name: 'Goal Success Predictor (LightGBM)',
          version: 'v1.8.0',
          type: 'regression',
          status: 'active',
          accuracy: 0.823,
          trainedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          lastEvaluatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          datasetSize: 89000,
          features: 35,
          inferenceTimeMs: 8,
          dailyPredictions: 8500,
        },
        {
          id: 'model-user2vec',
          name: 'User Embeddings (User2Vec)',
          version: 'v3.0.2',
          type: 'recommendation',
          status: 'active',
          accuracy: 0.756,
          trainedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          lastEvaluatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          datasetSize: 200000,
          features: 128,
          inferenceTimeMs: 15,
          dailyPredictions: 25000,
        },
        {
          id: 'model-sentiment',
          name: 'Sentiment Analysis (BERT)',
          version: 'v1.2.4',
          type: 'nlp',
          status: 'active',
          accuracy: 0.912,
          precision: 0.918,
          recall: 0.906,
          f1Score: 0.912,
          trainedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          lastEvaluatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          datasetSize: 50000,
          features: 768,
          inferenceTimeMs: 45,
          dailyPredictions: 5000,
        },
        {
          id: 'model-intent-classifier',
          name: 'Intent Classifier (BERT)',
          version: 'v2.1.0',
          type: 'nlp',
          status: 'training',
          accuracy: 0.0,
          trainedAt: new Date().toISOString(),
          lastEvaluatedAt: new Date().toISOString(),
          datasetSize: 35000,
          features: 768,
          inferenceTimeMs: 0,
          dailyPredictions: 0,
        },
      ];

      setModels(mockModels);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (model: AIModel) => {
    setSelectedModel(model);
    setDetailsDialogOpen(true);
  };

  const handleRetrain = async (modelId: string) => {
    console.log('Triggering retraining for model:', modelId);
    alert('Model retraining triggered. This will take 1-2 hours.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'training':
        return 'warning';
      case 'deprecated':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return 'success.main';
    if (accuracy >= 0.8) return 'warning.main';
    return 'error.main';
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            AI Models Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Monitor and manage machine learning models powering UpCoach AI features
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadModels}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Active Models
              </Typography>
              <Typography variant="h3">
                {models.filter(m => m.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Average Accuracy
              </Typography>
              <Typography variant="h3">
                {(
                  models
                    .filter(m => m.status === 'active')
                    .reduce((sum, m) => sum + m.accuracy, 0) /
                  models.filter(m => m.status === 'active').length || 0
                ).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Daily Predictions
              </Typography>
              <Typography variant="h3">
                {(models.reduce((sum, m) => sum + m.dailyPredictions, 0) / 1000).toFixed(1)}K
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Avg Inference Time
              </Typography>
              <Typography variant="h3">
                {(
                  models.reduce((sum, m) => sum + m.inferenceTimeMs, 0) /
                  models.length || 0
                ).toFixed(0)}ms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Models Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Model Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Accuracy</TableCell>
                <TableCell>Dataset Size</TableCell>
                <TableCell>Inference Time</TableCell>
                <TableCell>Last Evaluated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {model.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={model.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{model.version}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={model.status}
                      color={getStatusColor(model.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Typography
                        variant="body2"
                        sx={{ color: getAccuracyColor(model.accuracy), fontWeight: 'bold' }}
                      >
                        {(model.accuracy * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {(model.datasetSize / 1000).toFixed(0)}K rows
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{model.inferenceTimeMs}ms</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(model.lastEvaluatedAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewDetails(model)}>
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Retrain Model">
                        <IconButton
                          size="small"
                          onClick={() => handleRetrain(model.id)}
                          disabled={model.status === 'training'}
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Performance Metrics">
                        <IconButton size="small">
                          <AssessmentIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Model Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedModel?.name} - Details</DialogTitle>
        <DialogContent>
          {selectedModel && (
            <Box>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Version
                  </Typography>
                  <Typography variant="body1">{selectedModel.version}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Type
                  </Typography>
                  <Typography variant="body1">{selectedModel.type}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Trained At
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedModel.trainedAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Dataset Size
                  </Typography>
                  <Typography variant="body1">
                    {selectedModel.datasetSize.toLocaleString()} rows
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom mt={2}>
                Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption">Accuracy</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={selectedModel.accuracy * 100}
                        sx={{ flex: 1 }}
                      />
                      <Typography variant="body2">
                        {(selectedModel.accuracy * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                {selectedModel.precision && (
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption">Precision</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={selectedModel.precision * 100}
                          sx={{ flex: 1 }}
                        />
                        <Typography variant="body2">
                          {(selectedModel.precision * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {selectedModel.recall && (
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption">Recall</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={selectedModel.recall * 100}
                          sx={{ flex: 1 }}
                        />
                        <Typography variant="body2">
                          {(selectedModel.recall * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {selectedModel.f1Score && (
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption">F1 Score</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={selectedModel.f1Score * 100}
                          sx={{ flex: 1 }}
                        />
                        <Typography variant="body2">
                          {(selectedModel.f1Score * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {selectedModel.status === 'active' && selectedModel.accuracy < 0.85 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Model accuracy is below recommended threshold (85%). Consider retraining with
                  more recent data.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<TrendingUpIcon />}>
            View Full Metrics
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
