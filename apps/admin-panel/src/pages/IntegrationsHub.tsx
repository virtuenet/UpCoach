import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Extension as ExtensionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { integrationsService } from '../services/integrationsService';

/**
 * Integrations Hub Page
 *
 * Central hub for managing third-party integrations:
 * - Plugin marketplace browser
 * - Installed plugins management
 * - Integration connections (Zapier, Slack, Google Calendar, Notion)
 * - Webhook configuration
 * - Plugin execution history
 * - Usage statistics
 */

interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  category: string;
  permissions: string[];
  downloadCount: number;
  rating: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  installed?: boolean;
}

interface Integration {
  id: string;
  name: string;
  type: 'zapier' | 'slack' | 'google_calendar' | 'notion';
  status: 'connected' | 'disconnected';
  connectedAt?: string;
  lastSync?: string;
}

interface ExecutionHistory {
  id: string;
  pluginId: string;
  pluginName: string;
  success: boolean;
  executionTime: number;
  executedAt: string;
  error?: string;
}

export const IntegrationsHub: React.FC = () => {
  const { tenant } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // Marketplace state
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);

  // Installed plugins state
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([]);

  // Integrations state
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState<string>('');

  // Execution history state
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistory[]>([]);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [tabValue]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (tabValue === 0) {
        // Load marketplace plugins
        const pluginsData = await integrationsService.getMarketplacePlugins();
        setPlugins(pluginsData);
      } else if (tabValue === 1) {
        // Load installed plugins
        const installedData = await integrationsService.getInstalledPlugins(tenant.id);
        setInstalledPlugins(installedData);
      } else if (tabValue === 2) {
        // Load integrations
        const integrationsData = await integrationsService.getIntegrations(tenant.id);
        setIntegrations(integrationsData);
      } else if (tabValue === 3) {
        // Load execution history
        const historyData = await integrationsService.getExecutionHistory(tenant.id);
        setExecutionHistory(historyData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInstallPlugin = async (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setInstallDialogOpen(true);
  };

  const confirmInstallPlugin = async () => {
    if (!selectedPlugin) return;

    try {
      await integrationsService.installPlugin(tenant.id, selectedPlugin.id, {});
      setInstallDialogOpen(false);
      setSelectedPlugin(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install plugin');
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    if (!confirm('Are you sure you want to uninstall this plugin?')) return;

    try {
      await integrationsService.uninstallPlugin(tenant.id, pluginId);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to uninstall plugin');
    }
  };

  const handleConnectIntegration = async (type: string) => {
    setSelectedIntegrationType(type);
    setConnectDialogOpen(true);
  };

  const confirmConnectIntegration = async () => {
    try {
      const authUrl = await integrationsService.getIntegrationAuthUrl(
        selectedIntegrationType,
        tenant.id
      );
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect integration');
    }
  };

  const handleDisconnectIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;

    try {
      await integrationsService.disconnectIntegration(tenant.id, integrationId);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect integration');
    }
  };

  const renderMarketplaceTab = () => (
    <Grid container spacing={3}>
      {plugins.map((plugin) => (
        <Grid item xs={12} md={6} lg={4} key={plugin.id}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ExtensionIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">{plugin.name}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {plugin.description}
              </Typography>
              <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                <Chip label={plugin.category} size="small" />
                <Chip label={`v${plugin.version}`} size="small" variant="outlined" />
                <Chip
                  label={`⭐ ${plugin.rating.toFixed(1)}`}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Typography variant="caption" color="textSecondary" mt={1}>
                By {plugin.author} • {plugin.downloadCount} downloads
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                variant="contained"
                onClick={() => handleInstallPlugin(plugin)}
                disabled={plugin.installed}
              >
                {plugin.installed ? 'Installed' : 'Install'}
              </Button>
              <Button size="small">View Details</Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderInstalledTab = () => (
    <Grid container spacing={3}>
      {installedPlugins.map((plugin) => (
        <Grid item xs={12} md={6} lg={4} key={plugin.id}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <ExtensionIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">{plugin.name}</Typography>
                </Box>
                <CheckCircleIcon color="success" />
              </Box>
              <Typography variant="body2" color="textSecondary">
                Version {plugin.version}
              </Typography>
              <Box mt={2}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Active"
                />
              </Box>
            </CardContent>
            <CardActions>
              <IconButton size="small" color="primary">
                <SettingsIcon />
              </IconButton>
              <IconButton size="small" color="primary">
                <TimelineIcon />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleUninstallPlugin(plugin.id)}
              >
                <DeleteIcon />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderIntegrationsTab = () => (
    <Grid container spacing={3}>
      {[
        {
          name: 'Zapier',
          type: 'zapier',
          description: 'Connect to 2,000+ apps via Zapier',
          icon: '⚡',
        },
        {
          name: 'Slack',
          type: 'slack',
          description: 'Send notifications and bot commands',
          icon: '💬',
        },
        {
          name: 'Google Calendar',
          type: 'google_calendar',
          description: 'Sync habits and goals to calendar',
          icon: '📅',
        },
        {
          name: 'Notion',
          type: 'notion',
          description: 'Document goals and track progress',
          icon: '📝',
        },
      ].map((integration) => {
        const connected = integrations.find((i) => i.type === integration.type);

        return (
          <Grid item xs={12} md={6} key={integration.type}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" sx={{ mr: 2 }}>
                      {integration.icon}
                    </Typography>
                    <Box>
                      <Typography variant="h6">{integration.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {integration.description}
                      </Typography>
                    </Box>
                  </Box>
                  {connected ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CancelIcon color="disabled" />
                  )}
                </Box>
                {connected && (
                  <Box mt={2}>
                    <Typography variant="caption" color="textSecondary">
                      Connected: {new Date(connected.connectedAt!).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </CardContent>
              <CardActions>
                {connected ? (
                  <>
                    <Button size="small" startIcon={<SettingsIcon />}>
                      Configure
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDisconnectIntegration(connected.id)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleConnectIntegration(integration.type)}
                  >
                    Connect
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  const renderHistoryTab = () => (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Plugin</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Execution Time</TableCell>
          <TableCell>Executed At</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {executionHistory.map((execution) => (
          <TableRow key={execution.id}>
            <TableCell>{execution.pluginName}</TableCell>
            <TableCell>
              {execution.success ? (
                <Chip label="Success" color="success" size="small" />
              ) : (
                <Chip label="Failed" color="error" size="small" />
              )}
            </TableCell>
            <TableCell>{execution.executionTime}ms</TableCell>
            <TableCell>
              {new Date(execution.executedAt).toLocaleString()}
            </TableCell>
            <TableCell>
              <Tooltip title="View Logs">
                <IconButton size="small">
                  <TimelineIcon />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Integrations Hub
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Manage plugins and integrations to extend UpCoach functionality
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Marketplace" />
          <Tab label="Installed Plugins" />
          <Tab label="Integrations" />
          <Tab label="Execution History" />
        </Tabs>
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <>
          {tabValue === 0 && renderMarketplaceTab()}
          {tabValue === 1 && renderInstalledTab()}
          {tabValue === 2 && renderIntegrationsTab()}
          {tabValue === 3 && renderHistoryTab()}
        </>
      )}

      {/* Install Plugin Dialog */}
      <Dialog open={installDialogOpen} onClose={() => setInstallDialogOpen(false)}>
        <DialogTitle>Install Plugin</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Install <strong>{selectedPlugin?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {selectedPlugin?.description}
          </Typography>
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Requested Permissions:
            </Typography>
            {selectedPlugin?.permissions.map((permission) => (
              <Chip key={permission} label={permission} size="small" sx={{ mr: 1, mb: 1 }} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstallDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmInstallPlugin} variant="contained">
            Install
          </Button>
        </DialogActions>
      </Dialog>

      {/* Connect Integration Dialog */}
      <Dialog open={connectDialogOpen} onClose={() => setConnectDialogOpen(false)}>
        <DialogTitle>Connect Integration</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You will be redirected to authorize UpCoach to access your{' '}
            <strong>{selectedIntegrationType}</strong> account.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmConnectIntegration} variant="contained">
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntegrationsHub;
