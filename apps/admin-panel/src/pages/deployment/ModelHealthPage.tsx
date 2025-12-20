/**
 * Model Health Page
 *
 * Dashboard for monitoring ML model health:
 * - Health status overview
 * - Alerts and incidents
 * - Self-healing events
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
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
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as HealthyIcon,
  Warning as DegradedIcon,
  Error as UnhealthyIcon,
  Help as UnknownIcon,
  Notifications as AlertIcon,
  AutoFixHigh as HealingIcon,
} from '@mui/icons-material';
import { deploymentService, HealthStatus, ModelHealth, AlertInfo, HealingEvent } from '../../services/deploymentService';

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

const getHealthIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return <HealthyIcon color="success" />;
    case 'degraded':
      return <DegradedIcon color="warning" />;
    case 'unhealthy':
      return <UnhealthyIcon color="error" />;
    default:
      return <UnknownIcon color="disabled" />;
  }
};

const getAlertSeverityColor = (severity: string): 'info' | 'warning' | 'error' | 'default' => {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    default:
      return 'info';
  }
};

export default function ModelHealthPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [modelHealthList, setModelHealthList] = useState<ModelHealth[]>([]);
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [healingEvents, setHealingEvents] = useState<HealingEvent[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [aggregatedHealth, alertsData, eventsData] = await Promise.all([
        deploymentService.getAggregatedHealth(),
        deploymentService.getActiveAlerts(),
        deploymentService.getHealingEvents(),
      ]);
      setHealthStatus(aggregatedHealth);
      setModelHealthList(aggregatedHealth.models || []);
      setAlerts(alertsData);
      setHealingEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await deploymentService.acknowledgeAlert(alertId, 'current-user');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge alert');
    }
  };

  if (loading && !healthStatus) {
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
          Model Health
        </Typography>
        <IconButton onClick={fetchData} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Health Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderLeft: 4,
            borderColor: healthStatus?.overall === 'healthy' ? 'success.main' :
                         healthStatus?.overall === 'degraded' ? 'warning.main' : 'error.main'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                {getHealthIcon(healthStatus?.overall || 'unknown')}
                <Typography sx={{ ml: 1 }} color="textSecondary" variant="body2">
                  Overall Status
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ textTransform: 'capitalize' }}>
                {healthStatus?.overall || 'Unknown'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <HealthyIcon color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Healthy Models
                </Typography>
              </Box>
              <Typography variant="h4">
                {healthStatus?.summary?.healthyModels || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                of {healthStatus?.summary?.totalModels || 0} total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AlertIcon color="error" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Active Alerts
                </Typography>
              </Box>
              <Typography variant="h4" color={alerts.length > 0 ? 'error' : 'inherit'}>
                {alerts.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {alerts.filter(a => a.severity === 'critical').length} critical
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <HealingIcon color="info" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Healing Events
                </Typography>
              </Box>
              <Typography variant="h4">
                {healingEvents.filter(e => e.result === 'success').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {healingEvents.length} total today
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
          <Tab label="Model Status" />
          <Tab
            label={
              <Box display="flex" alignItems="center">
                Alerts
                {alerts.length > 0 && (
                  <Chip
                    label={alerts.length}
                    size="small"
                    color="error"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </Box>
            }
          />
          <Tab label="Self-Healing" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Model</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Uptime</TableCell>
                  <TableCell>Latency</TableCell>
                  <TableCell>Success Rate</TableCell>
                  <TableCell>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modelHealthList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">
                        No models registered for health monitoring
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  modelHealthList.map((model) => (
                    <TableRow key={`${model.modelId}-${model.version}`}>
                      <TableCell>{model.modelId}</TableCell>
                      <TableCell>{model.version}</TableCell>
                      <TableCell>
                        <Tooltip title={model.overallStatus}>
                          <Chip
                            icon={getHealthIcon(model.overallStatus)}
                            label={model.overallStatus}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <LinearProgress
                            variant="determinate"
                            value={model.uptime || 100}
                            sx={{ width: 60, mr: 1 }}
                            color={model.uptime > 99 ? 'success' : model.uptime > 95 ? 'warning' : 'error'}
                          />
                          {model.uptime?.toFixed(1) || 100}%
                        </Box>
                      </TableCell>
                      <TableCell>
                        {model.metrics?.avgLatencyMs?.toFixed(1) || '-'}ms
                      </TableCell>
                      <TableCell>
                        {model.metrics?.successRate
                          ? `${(model.metrics.successRate * 100).toFixed(1)}%`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {model.lastUpdated
                          ? new Date(model.lastUpdated).toLocaleTimeString()
                          : '-'}
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
                  <TableCell>Severity</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="textSecondary">
                        No active alerts
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Chip
                          label={alert.severity}
                          size="small"
                          color={getAlertSeverityColor(alert.severity)}
                        />
                      </TableCell>
                      <TableCell>{alert.title}</TableCell>
                      <TableCell>{alert.modelId}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {alert.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(alert.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Target</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Completed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {healingEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="textSecondary">
                        No healing events recorded
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  healingEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{event.targetId}</TableCell>
                      <TableCell>
                        <Chip
                          label={event.action}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {event.reason}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.result}
                          size="small"
                          color={
                            event.result === 'success' ? 'success' :
                            event.result === 'failure' ? 'error' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(event.startedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {event.completedAt
                          ? new Date(event.completedAt).toLocaleString()
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>
    </Box>
  );
}
