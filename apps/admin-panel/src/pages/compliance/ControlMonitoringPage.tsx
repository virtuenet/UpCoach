import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Button,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../../contexts/AuthContext';
import { complianceService } from '../../services/complianceService';

/**
 * Control Monitoring Page
 *
 * Real-time compliance dashboard for SOC2 control monitoring:
 * - 91 controls status grid
 * - Daily control execution tracking
 * - Evidence collection progress
 * - Compliance score trending
 * - Failed control alerts
 * - Audit-ready evidence viewer
 */

interface ControlStatus {
  controlId: string;
  controlName: string;
  category: string;
  status: 'passing' | 'failing' | 'warning' | 'pending';
  lastExecuted: string;
  executionTime: number;
  evidenceCount: number;
  complianceScore: number;
}

interface ComplianceMetrics {
  overallScore: number;
  passingControls: number;
  totalControls: number;
  evidenceCollected: number;
  lastUpdated: string;
}

interface EvidenceItem {
  id: string;
  controlId: string;
  evidenceType: string;
  source: string;
  collectedAt: string;
  metadata: any;
}

export const ControlMonitoringPage: React.FC = () => {
  const { tenant } = useAuth();

  // State
  const [controls, setControls] = useState<ControlStatus[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedControl, setSelectedControl] = useState<ControlStatus | null>(null);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [trendData, setTrendData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
    loadTrendData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [controlsData, metricsData] = await Promise.all([
        complianceService.getControlStatus(tenant.id),
        complianceService.getComplianceMetrics(tenant.id),
      ]);

      setControls(controlsData);
      setMetrics(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const loadTrendData = async () => {
    try {
      const data = await complianceService.getComplianceTrend(tenant.id, 30);
      setTrendData({
        labels: data.map((d: any) => new Date(d.date).toLocaleDateString()),
        datasets: [
          {
            label: 'Compliance Score',
            data: data.map((d: any) => d.score),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4,
          },
        ],
      });
    } catch (err) {
      logger.error('Failed to load trend data', err);
    }
  };

  const handleViewEvidence = async (control: ControlStatus) => {
    setSelectedControl(control);
    setLoading(true);

    try {
      const evidence = await complianceService.getControlEvidence(
        tenant.id,
        control.controlId
      );
      setEvidenceItems(evidence);
      setEvidenceDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  };

  const handleRunControl = async (controlId: string) => {
    try {
      await complianceService.runControl(tenant.id, controlId);
      await loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run control');
    }
  };

  const handleExportEvidence = async (controlId: string) => {
    try {
      const blob = await complianceService.exportEvidencePackage(tenant.id, controlId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-${controlId}-${Date.now()}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export evidence');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passing':
        return <CheckCircleIcon color="success" />;
      case 'failing':
        return <CancelIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <WarningIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passing':
        return 'success';
      case 'failing':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderMetricsCards = () => (
    <Grid container spacing={3} mb={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Overall Compliance
            </Typography>
            <Typography variant="h3" color="primary">
              {metrics?.overallScore || 0}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={metrics?.overallScore || 0}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Passing Controls
            </Typography>
            <Typography variant="h3">
              {metrics?.passingControls || 0}/{metrics?.totalControls || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary" mt={1}>
              {Math.round(
                ((metrics?.passingControls || 0) / (metrics?.totalControls || 1)) * 100
              )}
              % passing
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Evidence Collected
            </Typography>
            <Typography variant="h3">{metrics?.evidenceCollected || 0}</Typography>
            <Typography variant="body2" color="textSecondary" mt={1}>
              Last 30 days
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Last Updated
            </Typography>
            <Typography variant="body1" mt={2}>
              {metrics?.lastUpdated
                ? new Date(metrics.lastUpdated).toLocaleString()
                : 'Never'}
            </Typography>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadDashboardData}
              sx={{ mt: 1 }}
            >
              Refresh
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTrendChart = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Compliance Score Trend (30 Days)
        </Typography>
        {trendData && (
          <Box height={300}>
            <Line
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                  },
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderControlsTable = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Control Status (91 Controls)
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Control ID</TableCell>
              <TableCell>Control Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Evidence</TableCell>
              <TableCell>Last Run</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {controls.map((control) => (
              <TableRow key={control.controlId}>
                <TableCell>{control.controlId}</TableCell>
                <TableCell>
                  <Typography variant="body2">{control.controlName}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={control.category} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(control.status)}
                    label={control.status.toUpperCase()}
                    color={getStatusColor(control.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{control.complianceScore}%</TableCell>
                <TableCell>
                  <Chip label={control.evidenceCount} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(control.lastExecuted).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title="View Evidence">
                    <IconButton
                      size="small"
                      onClick={() => handleViewEvidence(control)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Run Control">
                    <IconButton
                      size="small"
                      onClick={() => handleRunControl(control.controlId)}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export Evidence">
                    <IconButton
                      size="small"
                      onClick={() => handleExportEvidence(control.controlId)}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Compliance Control Monitoring
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Real-time SOC2 compliance monitoring and evidence tracking
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {renderMetricsCards()}
      {renderTrendChart()}
      {renderControlsTable()}

      {/* Evidence Dialog */}
      <Dialog
        open={evidenceDialogOpen}
        onClose={() => setEvidenceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Evidence for {selectedControl?.controlId} - {selectedControl?.controlName}
        </DialogTitle>
        <DialogContent>
          <List>
            {evidenceItems.map((item) => (
              <ListItem key={item.id} divider>
                <ListItemText
                  primary={`${item.evidenceType} (${item.source})`}
                  secondary={
                    <>
                      <Typography variant="caption" display="block">
                        Collected: {new Date(item.collectedAt).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Metadata: {JSON.stringify(item.metadata)}
                      </Typography>
                    </>
                  }
                />
                <IconButton size="small">
                  <DownloadIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEvidenceDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() =>
              selectedControl && handleExportEvidence(selectedControl.controlId)
            }
          >
            Export Package
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ControlMonitoringPage;
