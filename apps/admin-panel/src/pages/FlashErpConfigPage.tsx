import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { flashErpService, ERPConfiguration, ERPStatus, ERPSync, ERPMetrics } from '../services/flashErpService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function FlashErpConfigPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [config, setConfig] = useState<ERPConfiguration | null>(null);
  const [status, setStatus] = useState<ERPStatus | null>(null);
  const [syncHistory, setSyncHistory] = useState<ERPSync[]>([]);
  const [metrics, setMetrics] = useState<ERPMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    apiKey: '',
    apiSecret: '',
    baseURL: 'https://api.flasherp.com/v1',
    webhookSecret: '',
    isEnabled: false,
    syncInterval: 3600,
    enableAutoSync: true,
    enableWebhooks: true,
    syncScope: {
      transactions: true,
      subscriptions: true,
      customers: true,
      invoices: false,
      financialReports: false,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData, statusData, metricsData] = await Promise.all([
        flashErpService.getConfig().catch(() => null),
        flashErpService.getStatus().catch(() => null),
        flashErpService.getMetrics().catch(() => null),
      ]);

      if (configData) {
        setConfig(configData);
        setFormData({
          apiKey: '',
          apiSecret: '',
          baseURL: configData.baseURL,
          webhookSecret: '',
          isEnabled: configData.isEnabled,
          syncInterval: configData.syncInterval,
          enableAutoSync: configData.enableAutoSync,
          enableWebhooks: configData.enableWebhooks,
          syncScope: configData.syncScope,
        });
      }

      setStatus(statusData);
      setMetrics(metricsData);

      if (statusData?.enabled) {
        const historyData = await flashErpService.getSyncHistory({ limit: 10 });
        setSyncHistory(historyData.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updateData: any = {
        ...formData,
      };

      // Only send credentials if they were changed
      if (!formData.apiKey) delete updateData.apiKey;
      if (!formData.apiSecret) delete updateData.apiSecret;
      if (!formData.webhookSecret) delete updateData.webhookSecret;

      await flashErpService.updateConfig(updateData);
      setSuccess('Configuration saved successfully');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setError(null);
      setSuccess(null);

      const result = await flashErpService.testConnection();

      if (result.success) {
        setSuccess(`Connection successful! Latency: ${result.latency}ms`);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleFullSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccess(null);

      await flashErpService.triggerFullSync();
      setSuccess('Full sync initiated. Check sync history for progress.');

      // Reload status after a delay
      setTimeout(() => loadData(), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger sync');
    } finally {
      setSyncing(false);
    }
  };

  const handleRetrySync = async (syncId: string) => {
    try {
      await flashErpService.retrySyncRecord(syncId);
      setSuccess('Sync queued for retry');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to retry sync');
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced':
        return 'success';
      case 'failed':
        return 'error';
      case 'syncing':
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          FlashERP Integration
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={testing ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            onClick={handleTestConnection}
            disabled={testing || !config}
          >
            Test Connection
          </Button>
          <Button
            variant="outlined"
            startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
            onClick={handleFullSync}
            disabled={syncing || !status?.enabled}
          >
            Sync Now
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : 'Save Configuration'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Connection Settings" />
          <Tab label="Sync Configuration" />
          <Tab label="Status & Health" />
          <Tab label="Sync History" />
          <Tab label="Metrics" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ maxWidth: 600 }}>
            <TextField
              fullWidth
              label="API Key"
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder={config?.apiKeyMasked || 'Enter API key'}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="API Secret"
              type="password"
              value={formData.apiSecret}
              onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
              placeholder={config?.apiSecretMasked || 'Enter API secret'}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Base URL"
              value={formData.baseURL}
              onChange={(e) => setFormData({ ...formData, baseURL: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Webhook Secret"
              type="password"
              value={formData.webhookSecret}
              onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
              placeholder={config?.webhookSecretMasked || 'Enter webhook secret'}
              helperText="Used for HMAC-SHA256 signature verification"
            />
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ maxWidth: 600 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                />
              }
              label="Enable FlashERP Integration"
              sx={{ mb: 2, display: 'block' }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableAutoSync}
                  onChange={(e) => setFormData({ ...formData, enableAutoSync: e.target.checked })}
                />
              }
              label="Enable Automatic Sync"
              sx={{ mb: 2, display: 'block' }}
            />

            <TextField
              fullWidth
              type="number"
              label="Sync Interval (seconds)"
              value={formData.syncInterval}
              onChange={(e) => setFormData({ ...formData, syncInterval: parseInt(e.target.value) })}
              helperText="Minimum 300 seconds (5 minutes)"
              sx={{ mb: 3 }}
            />

            <Typography variant="h6" sx={{ mb: 2 }}>Sync Scope</Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.syncScope.transactions}
                  onChange={(e) => setFormData({
                    ...formData,
                    syncScope: { ...formData.syncScope, transactions: e.target.checked }
                  })}
                />
              }
              label="Sync Transactions"
              sx={{ display: 'block' }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.syncScope.subscriptions}
                  onChange={(e) => setFormData({
                    ...formData,
                    syncScope: { ...formData.syncScope, subscriptions: e.target.checked }
                  })}
                />
              }
              label="Sync Subscriptions"
              sx={{ display: 'block' }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.syncScope.customers}
                  onChange={(e) => setFormData({
                    ...formData,
                    syncScope: { ...formData.syncScope, customers: e.target.checked }
                  })}
                />
              }
              label="Sync Customers"
              sx={{ display: 'block' }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.syncScope.invoices}
                  onChange={(e) => setFormData({
                    ...formData,
                    syncScope: { ...formData.syncScope, invoices: e.target.checked }
                  })}
                />
              }
              label="Sync Invoices"
              sx={{ display: 'block' }}
            />
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {status ? (
            <Box>
              <Card sx={{ mb: 2, bgcolor: 'background.default' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>Health Status</Typography>
                    <Chip
                      label={status.healthStatus}
                      color={getHealthStatusColor(status.healthStatus) as any}
                      icon={status.healthStatus === 'healthy' ? <CheckCircleIcon /> : <ErrorIcon />}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Integration: {status.enabled ? 'Enabled' : 'Disabled'}
                  </Typography>

                  {status.lastFullSync && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Last Full Sync: {new Date(status.lastFullSync).toLocaleString()}
                    </Typography>
                  )}

                  {status.lastSyncStatus && (
                    <Typography variant="body2" color="text.secondary">
                      Last Sync Status: {status.lastSyncStatus}
                    </Typography>
                  )}
                </CardContent>
              </Card>

              <Card sx={{ bgcolor: 'background.default' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Statistics</Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Recent Syncs (24h)</Typography>
                      <Typography variant="h5">{status.stats.recentSyncs}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">Failed Syncs</Typography>
                      <Typography variant="h5" color="error">{status.stats.failedSyncs}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">Pending Retries</Typography>
                      <Typography variant="h5" color="warning.main">{status.stats.pendingRetries}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Alert severity="info">No status information available</Alert>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {syncHistory.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Source ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Attempt</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {syncHistory.map((sync) => (
                    <TableRow key={sync.id}>
                      <TableCell>{sync.sourceType}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {sync.sourceId.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sync.syncStatus}
                          color={getSyncStatusColor(sync.syncStatus) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {sync.lastSyncAttempt
                          ? new Date(sync.lastSyncAttempt).toLocaleString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {sync.syncDuration ? `${sync.syncDuration}ms` : '-'}
                      </TableCell>
                      <TableCell>
                        {sync.syncStatus === 'failed' && (
                          <Tooltip title="Retry sync">
                            <IconButton
                              size="small"
                              onClick={() => handleRetrySync(sync.id)}
                            >
                              <RefreshIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No sync history available</Alert>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          {metrics ? (
            <Box>
              <Card sx={{ mb: 2, bgcolor: 'background.default' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Last 24 Hours</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total</Typography>
                      <Typography variant="h5">{metrics.last24h.total}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Success</Typography>
                      <Typography variant="h5" color="success.main">{metrics.last24h.success}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Failed</Typography>
                      <Typography variant="h5" color="error">{metrics.last24h.failed}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ bgcolor: 'background.default' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Last 7 Days</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total</Typography>
                      <Typography variant="h5">{metrics.last7d.total}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Success</Typography>
                      <Typography variant="h5" color="success.main">{metrics.last7d.success}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Failed</Typography>
                      <Typography variant="h5" color="error">{metrics.last7d.failed}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Alert severity="info">No metrics available</Alert>
          )}
        </TabPanel>
      </Card>
    </Box>
  );
}
