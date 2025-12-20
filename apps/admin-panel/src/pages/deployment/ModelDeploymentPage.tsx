/**
 * Model Deployment Page
 *
 * Dashboard for managing ML model deployments:
 * - Model serving status
 * - Active deployments overview
 * - Quick actions
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  TrendingUp as TrendingUpIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  CloudUpload as DeployIcon,
} from '@mui/icons-material';
import { deploymentService, DeploymentStats, CanaryDeployment, Experiment } from '../../services/deploymentService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && children}
    </div>
  );
}

export default function ModelDeploymentPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DeploymentStats | null>(null);
  const [canaryDeployments, setCanaryDeployments] = useState<CanaryDeployment[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, canaryData, experimentsData] = await Promise.all([
        deploymentService.getModelStats(),
        deploymentService.listCanaryDeployments(),
        deploymentService.listExperiments(),
      ]);
      setStats(statsData);
      setCanaryDeployments(canaryData);
      setExperiments(experimentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deployment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'healthy':
      case 'completed':
      case 'running':
        return 'success';
      case 'canary':
      case 'partial':
      case 'paused':
        return 'warning';
      case 'rolled_back':
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Model Deployment
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<DeployIcon />}
            sx={{ mr: 1 }}
          >
            New Deployment
          </Button>
          <IconButton onClick={fetchData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <MemoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Loaded Models
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats?.loadedModels || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {stats?.totalPredictions?.toLocaleString() || 0} total predictions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SpeedIcon color="secondary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Avg Latency
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats?.avgLatencyMs?.toFixed(1) || 0}ms
              </Typography>
              <Typography variant="body2" color="textSecondary">
                P95: {stats?.p95LatencyMs?.toFixed(1) || 0}ms
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Success Rate
                </Typography>
              </Box>
              <Typography variant="h4">
                {((stats?.successRate || 0) * 100).toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(stats?.successRate || 0) * 100}
                color="success"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <DeployIcon color="info" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Active Deployments
                </Typography>
              </Box>
              <Typography variant="h4">
                {canaryDeployments.filter(d => d.status !== 'completed' && d.status !== 'rolled_back').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {experiments.filter(e => e.status === 'running').length} experiments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Canary Deployments" />
          <Tab label="Experiments" />
          <Tab label="Loaded Models" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Model</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Stage</TableCell>
                  <TableCell>Traffic %</TableCell>
                  <TableCell>Success Rate</TableCell>
                  <TableCell>Latency</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {canaryDeployments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">
                        No active canary deployments
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  canaryDeployments.map((deployment) => (
                    <TableRow key={deployment.id}>
                      <TableCell>{deployment.modelId}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {deployment.baselineVersion} → {deployment.canaryVersion}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={deployment.status}
                          size="small"
                          color={getStatusColor(deployment.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <LinearProgress
                            variant="determinate"
                            value={deployment.trafficPercentage}
                            sx={{ width: 60, mr: 1 }}
                          />
                          {deployment.trafficPercentage}%
                        </Box>
                      </TableCell>
                      <TableCell>
                        {deployment.metrics?.successRate
                          ? `${(deployment.metrics.successRate * 100).toFixed(1)}%`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {deployment.metrics?.avgLatencyMs
                          ? `${deployment.metrics.avgLatencyMs.toFixed(1)}ms`
                          : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" title="Promote">
                          <PlayIcon />
                        </IconButton>
                        <IconButton size="small" color="error" title="Rollback">
                          <StopIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Experiment</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Variants</TableCell>
                  <TableCell>Samples</TableCell>
                  <TableCell>Winner</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {experiments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">
                        No active experiments
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  experiments.map((experiment) => (
                    <TableRow key={experiment.id}>
                      <TableCell>{experiment.name}</TableCell>
                      <TableCell>{experiment.modelId}</TableCell>
                      <TableCell>
                        <Chip
                          label={experiment.status}
                          size="small"
                          color={getStatusColor(experiment.status)}
                        />
                      </TableCell>
                      <TableCell>{experiment.variants?.length || 0}</TableCell>
                      <TableCell>
                        {experiment.totalSamples?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell>
                        {experiment.winner ? (
                          <Chip label={experiment.winner} size="small" color="success" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {experiment.status === 'running' ? (
                          <IconButton size="small" color="error" title="Stop">
                            <StopIcon />
                          </IconButton>
                        ) : experiment.status === 'draft' ? (
                          <IconButton size="small" color="primary" title="Start">
                            <PlayIcon />
                          </IconButton>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box p={2}>
            <Typography color="textSecondary" align="center">
              Model serving details coming soon
            </Typography>
          </Box>
        </TabPanel>
      </Card>
    </Box>
  );
}
