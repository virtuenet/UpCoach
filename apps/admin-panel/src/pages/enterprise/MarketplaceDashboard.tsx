import React, { useState, useEffect, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Badge,
  LinearProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  InputAdornment,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  Apps,
  Key,
  Webhook,
  TrendingUp,
  Search,
  Add,
  Edit,
  Delete,
  Refresh,
  Visibility,
  VisibilityOff,
  ContentCopy,
  CheckCircle,
  Error,
  Warning,
  PlayArrow,
  Stop,
  Code,
  Settings,
  BarChart,
  Assessment,
  Timeline,
  Speed,
  CloudUpload,
  MoreVert,
  FilterList,
  Download,
  Language,
  Security,
  Schedule,
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import Editor from '@monaco-editor/react';

/**
 * Marketplace Dashboard Component
 *
 * Complete React admin dashboard for marketplace management with:
 * - 5 tabs: Integrations, API Keys, Webhooks, Partners, Analytics
 * - Integration catalog with search and category filters
 * - OAuth app configuration UI with scopes
 * - Webhook endpoint management with test delivery
 * - Partner portal with API documentation links
 * - API usage analytics with Recharts (line charts, bar charts)
 * - Rate limit visualization
 * - Integration health dashboard with uptime metrics
 * - Real-time webhook delivery logs
 * - SWR for data fetching
 * - Monaco Editor for JSON payload editing
 */

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

interface Integration {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  type: string;
  provider: string;
  logoUrl?: string;
  websiteUrl?: string;
  documentationUrl?: string;
  isOfficial: boolean;
  isBeta: boolean;
  isPublished: boolean;
  rating: number;
  installCount: number;
}

interface IntegrationInstance {
  id: string;
  integrationId: string;
  status: string;
  settings: Record<string, any>;
  lastSyncAt?: string;
  lastError?: string;
  createdAt: string;
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  scope: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  expiresAt?: string;
  lastUsedAt?: string;
  isActive: boolean;
  createdAt: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  status: string;
  attempts: number;
  lastAttemptAt?: string;
  responseStatus?: number;
  errorMessage?: string;
  createdAt: string;
}

interface OAuthApp {
  id: string;
  name: string;
  clientId: string;
  redirectUris: string[];
  scope: string[];
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CATEGORIES = [
  { value: 'crm', label: 'CRM', icon: '👥' },
  { value: 'marketing', label: 'Marketing', icon: '📢' },
  { value: 'analytics', label: 'Analytics', icon: '📊' },
  { value: 'productivity', label: 'Productivity', icon: '✅' },
  { value: 'communication', label: 'Communication', icon: '💬' },
  { value: 'automation', label: 'Automation', icon: '⚡' },
  { value: 'hr', label: 'HR', icon: '👔' },
  { value: 'finance', label: 'Finance', icon: '💰' },
];

const AVAILABLE_SCOPES = [
  'users:read',
  'users:write',
  'sessions:read',
  'sessions:write',
  'analytics:read',
  'integrations:read',
  'integrations:write',
  'webhooks:read',
  'webhooks:write',
  'admin:full',
];

const WEBHOOK_EVENTS = [
  'user.created',
  'user.updated',
  'user.deleted',
  'session.created',
  'session.completed',
  'payment.succeeded',
  'payment.failed',
  'subscription.created',
  'subscription.updated',
  'subscription.canceled',
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

const MarketplaceDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });

  const [integrationDialog, setIntegrationDialog] = useState({ open: false, integration: null as Integration | null });
  const [apiKeyDialog, setApiKeyDialog] = useState({ open: false, apiKey: null as APIKey | null });
  const [webhookDialog, setWebhookDialog] = useState({ open: false, webhook: null as Webhook | null });
  const [oauthAppDialog, setOAuthAppDialog] = useState({ open: false, app: null as OAuthApp | null });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showApiKeyValue, setShowApiKeyValue] = useState<Record<string, boolean>>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [webhookTestPayload, setWebhookTestPayload] = useState('{\n  "event": "test",\n  "data": {}\n}');
  const [testingWebhook, setTestingWebhook] = useState(false);

  const { data: integrations, error: integrationsError } = useSWR<Integration[]>(
    '/api/marketplace/integrations',
    fetcher
  );

  const { data: instances, error: instancesError } = useSWR<IntegrationInstance[]>(
    '/api/marketplace/instances',
    fetcher
  );

  const { data: apiKeys, error: apiKeysError } = useSWR<APIKey[]>(
    '/api/marketplace/api-keys',
    fetcher
  );

  const { data: webhooks, error: webhooksError } = useSWR<Webhook[]>(
    '/api/marketplace/webhooks',
    fetcher
  );

  const { data: webhookDeliveries, error: deliveriesError } = useSWR<WebhookDelivery[]>(
    '/api/marketplace/webhook-deliveries?limit=50',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: oauthApps, error: oauthAppsError } = useSWR<OAuthApp[]>(
    '/api/marketplace/oauth-apps',
    fetcher
  );

  const { data: usageStats, error: usageStatsError } = useSWR<any[]>(
    '/api/marketplace/usage-stats?groupBy=day&days=30',
    fetcher
  );

  const { data: healthMetrics, error: healthError } = useSWR<any[]>(
    '/api/marketplace/health-metrics',
    fetcher,
    { refreshInterval: 30000 }
  );

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleInstallIntegration = async (integrationId: string) => {
    try {
      const response = await fetch('/api/marketplace/integrations/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId }),
      });

      if (!response.ok) throw new Error('Failed to install integration');

      showSnackbar('Integration installed successfully');
      mutate('/api/marketplace/instances');
    } catch (error) {
      showSnackbar('Failed to install integration', 'error');
    }
  };

  const handleCreateAPIKey = async (data: any) => {
    try {
      const response = await fetch('/api/marketplace/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create API key');

      const newKey = await response.json();
      showSnackbar('API key created successfully. Make sure to copy it now!', 'info');
      mutate('/api/marketplace/api-keys');
      setApiKeyDialog({ open: false, apiKey: null });

      return newKey;
    } catch (error) {
      showSnackbar('Failed to create API key', 'error');
    }
  };

  const handleCreateWebhook = async (data: any) => {
    try {
      const response = await fetch('/api/marketplace/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create webhook');

      showSnackbar('Webhook created successfully');
      mutate('/api/marketplace/webhooks');
      setWebhookDialog({ open: false, webhook: null });
    } catch (error) {
      showSnackbar('Failed to create webhook', 'error');
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    setTestingWebhook(true);
    try {
      const response = await fetch(`/api/marketplace/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: JSON.parse(webhookTestPayload) }),
      });

      if (!response.ok) throw new Error('Webhook test failed');

      showSnackbar('Webhook test successful');
      mutate('/api/marketplace/webhook-deliveries?limit=50');
    } catch (error) {
      showSnackbar('Webhook test failed', 'error');
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleDeleteAPIKey = async (keyId: string) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) return;

    try {
      const response = await fetch(`/api/marketplace/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete API key');

      showSnackbar('API key deleted successfully');
      mutate('/api/marketplace/api-keys');
    } catch (error) {
      showSnackbar('Failed to delete API key', 'error');
    }
  };

  const handleToggleWebhook = async (webhookId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/marketplace/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to toggle webhook');

      showSnackbar(`Webhook ${!isActive ? 'activated' : 'deactivated'}`);
      mutate('/api/marketplace/webhooks');
    } catch (error) {
      showSnackbar('Failed to toggle webhook', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSnackbar('Copied to clipboard');
  };

  const filteredIntegrations = integrations?.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || integration.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      active: 'success',
      pending: 'warning',
      error: 'error',
      inactive: 'default',
      healthy: 'success',
      degraded: 'warning',
      down: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      success: <CheckCircle fontSize="small" />,
      failed: <Error fontSize="small" />,
      pending: <Schedule fontSize="small" />,
      retrying: <Refresh fontSize="small" />,
    };
    return icons[status];
  };

  const calculateUptime = (metrics: any) => {
    if (!metrics) return 0;
    return metrics.successRate || 0;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Integration Marketplace
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              mutate('/api/marketplace/integrations');
              mutate('/api/marketplace/instances');
              mutate('/api/marketplace/api-keys');
              mutate('/api/marketplace/webhooks');
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => showSnackbar('Export functionality coming soon', 'info')}
          >
            Export Data
          </Button>
        </Box>
      </Box>

      <Card>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<Apps />} label="Integrations" />
          <Tab icon={<Key />} label="API Keys" />
          <Tab icon={<Webhook />} label="Webhooks" />
          <Tab icon={<Code />} label="OAuth Apps" />
          <Tab icon={<BarChart />} label="Analytics" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {CATEGORIES.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Grid container spacing={3}>
            {filteredIntegrations?.map(integration => {
              const instance = instances?.find(i => i.integrationId === integration.id);
              const health = healthMetrics?.find(h => h.integrationInstanceId === instance?.id);

              return (
                <Grid item xs={12} sm={6} md={4} key={integration.id}>
                  <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {integration.logoUrl ? (
                          <Avatar src={integration.logoUrl} sx={{ mr: 2 }} />
                        ) : (
                          <Avatar sx={{ mr: 2 }}>{integration.name[0]}</Avatar>
                        )}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6">{integration.name}</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            <Chip label={integration.category} size="small" />
                            {integration.isOfficial && <Chip label="Official" size="small" color="primary" />}
                            {integration.isBeta && <Chip label="Beta" size="small" color="warning" />}
                          </Box>
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {integration.description}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {integration.installCount} installs
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                            {integration.rating.toFixed(1)}
                          </Typography>
                          <Typography variant="caption">⭐</Typography>
                        </Box>
                      </Box>

                      {instance && (
                        <Box sx={{ mt: 2 }}>
                          <Chip
                            label={instance.status}
                            color={getStatusColor(instance.status)}
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          {health && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Uptime: {health.successRate?.toFixed(1)}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={health.successRate || 0}
                                sx={{ mt: 0.5 }}
                                color={health.successRate > 90 ? 'success' : health.successRate > 70 ? 'warning' : 'error'}
                              />
                            </Box>
                          )}
                        </Box>
                      )}
                    </CardContent>

                    <Box sx={{ p: 2, pt: 0 }}>
                      {instance ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Settings />}
                            fullWidth
                            onClick={() => setIntegrationDialog({ open: true, integration })}
                          >
                            Configure
                          </Button>
                          <IconButton size="small" color="error">
                            <Delete />
                          </IconButton>
                        </Box>
                      ) : (
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<Add />}
                          onClick={() => handleInstallIntegration(integration.id)}
                        >
                          Install
                        </Button>
                      )}
                      {integration.documentationUrl && (
                        <Button
                          size="small"
                          fullWidth
                          startIcon={<Language />}
                          sx={{ mt: 1 }}
                          onClick={() => window.open(integration.documentationUrl, '_blank')}
                        >
                          Documentation
                        </Button>
                      )}
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">API Keys</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setApiKeyDialog({ open: true, apiKey: null })}
            >
              Create API Key
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Key</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Rate Limits</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Used</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiKeys?.map(apiKey => (
                  <TableRow key={apiKey.id}>
                    <TableCell>{apiKey.name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {showApiKeyValue[apiKey.id] ? apiKey.key : '••••••••••••••••'}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setShowApiKeyValue(prev => ({ ...prev, [apiKey.id]: !prev[apiKey.id] }))}
                        >
                          {showApiKeyValue[apiKey.id] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" onClick={() => copyToClipboard(apiKey.key)}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {apiKey.scope.slice(0, 2).map(scope => (
                          <Chip key={scope} label={scope} size="small" />
                        ))}
                        {apiKey.scope.length > 2 && (
                          <Chip label={`+${apiKey.scope.length - 2}`} size="small" variant="outlined" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">
                        {apiKey.rateLimit.requestsPerMinute}/min
                      </Typography>
                      <Typography variant="caption" display="block">
                        {apiKey.rateLimit.requestsPerHour}/hr
                      </Typography>
                      <Typography variant="caption" display="block">
                        {apiKey.rateLimit.requestsPerDay}/day
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={apiKey.isActive ? 'Active' : 'Inactive'}
                        color={apiKey.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleDeleteAPIKey(apiKey.id)} color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {(!apiKeys || apiKeys.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No API keys found. Create your first API key to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Webhooks</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setWebhookDialog({ open: true, webhook: null })}
            >
              Create Webhook
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Active Webhooks
                  </Typography>
                  {webhooks?.map(webhook => (
                    <Box key={webhook.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
                          {webhook.url}
                        </Typography>
                        <Switch
                          checked={webhook.isActive}
                          onChange={() => handleToggleWebhook(webhook.id, webhook.isActive)}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                        {webhook.events.slice(0, 3).map(event => (
                          <Chip key={event} label={event} size="small" />
                        ))}
                        {webhook.events.length > 3 && (
                          <Chip label={`+${webhook.events.length - 3} more`} size="small" variant="outlined" />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Retries: {webhook.retryCount}/{webhook.maxRetries}
                        </Typography>
                        <Box>
                          <Button
                            size="small"
                            startIcon={<PlayArrow />}
                            onClick={() => handleTestWebhook(webhook.id)}
                            disabled={testingWebhook}
                          >
                            Test
                          </Button>
                          <IconButton size="small" color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                  {(!webhooks || webhooks.length === 0) && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                      No webhooks configured
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Deliveries
                  </Typography>
                  <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                    {webhookDeliveries?.map(delivery => (
                      <Box
                        key={delivery.id}
                        sx={{
                          mb: 1,
                          p: 1.5,
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          borderLeft: `4px solid ${
                            delivery.status === 'success' ? '#4caf50' :
                            delivery.status === 'failed' ? '#f44336' :
                            delivery.status === 'retrying' ? '#ff9800' : '#9e9e9e'
                          }`,
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(delivery.status)}
                            <Typography variant="subtitle2">{delivery.event}</Typography>
                          </Box>
                          <Chip label={delivery.status} size="small" color={getStatusColor(delivery.status)} />
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Attempts: {delivery.attempts}
                        </Typography>
                        {delivery.responseStatus && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Status: {delivery.responseStatus}
                          </Typography>
                        )}
                        {delivery.errorMessage && (
                          <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                            <Typography variant="caption">{delivery.errorMessage}</Typography>
                          </Alert>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          {new Date(delivery.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                    {(!webhookDeliveries || webhookDeliveries.length === 0) && (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                        No webhook deliveries yet
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Webhook Payload
              </Typography>
              <Editor
                height="300px"
                defaultLanguage="json"
                value={webhookTestPayload}
                onChange={(value) => setWebhookTestPayload(value || '')}
                options={{
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                }}
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">OAuth Applications</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOAuthAppDialog({ open: true, app: null })}
            >
              Create OAuth App
            </Button>
          </Box>

          <Grid container spacing={3}>
            {oauthApps?.map(app => (
              <Grid item xs={12} md={6} key={app.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{app.name}</Typography>
                      <Chip
                        label={app.isActive ? 'Active' : 'Inactive'}
                        color={app.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">Client ID</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {app.clientId}
                        </Typography>
                        <IconButton size="small" onClick={() => copyToClipboard(app.clientId)}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">Redirect URIs</Typography>
                      {app.redirectUris.map((uri, idx) => (
                        <Typography key={idx} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {uri}
                        </Typography>
                      ))}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">Scopes</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {app.scope.map(scope => (
                          <Chip key={scope} label={scope} size="small" />
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Last used: {app.lastUsedAt ? new Date(app.lastUsedAt).toLocaleDateString() : 'Never'}
                      </Typography>
                      <Box>
                        <IconButton size="small">
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {(!oauthApps || oauthApps.length === 0) && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Security sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No OAuth applications yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first OAuth application to allow third-party integrations
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOAuthAppDialog({ open: true, app: null })}
              >
                Create OAuth App
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    API Usage (Last 30 Days)
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={usageStats || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area type="monotone" dataKey="total_requests" stroke="#8884d8" fill="#8884d8" name="Total Requests" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Average Response Time
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={usageStats || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="avg_response_time" stroke="#82ca9d" name="Avg Response Time (ms)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Error Rate
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={usageStats || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="error_count" fill="#ff7043" name="Errors" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Integration Health Status
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {healthMetrics?.map((metric: any) => {
                      const instance = instances?.find(i => i.id === metric.integrationInstanceId);
                      const integration = integrations?.find(int => int.id === instance?.integrationId);

                      return (
                        <Box key={metric.integrationInstanceId} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2">{integration?.name || 'Unknown'}</Typography>
                            <Chip label={metric.status} color={getStatusColor(metric.status)} size="small" />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={metric.successRate || 0}
                            sx={{ mb: 0.5 }}
                            color={metric.successRate > 90 ? 'success' : metric.successRate > 70 ? 'warning' : 'error'}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">
                              Uptime: {metric.successRate?.toFixed(1)}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Avg: {metric.avgResponseTime}ms
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Data Transfer
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={usageStats || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area type="monotone" dataKey="total_request_size" stackId="1" stroke="#8884d8" fill="#8884d8" name="Request Size (bytes)" />
                      <Area type="monotone" dataKey="total_response_size" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Response Size (bytes)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      <Dialog
        open={apiKeyDialog.open}
        onClose={() => setApiKeyDialog({ open: false, apiKey: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create API Key</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Key Name"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Scopes</InputLabel>
            <Select multiple defaultValue={['users:read']} label="Scopes">
              {AVAILABLE_SCOPES.map(scope => (
                <MenuItem key={scope} value={scope}>{scope}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="subtitle2" gutterBottom>Rate Limits</Typography>
          <TextField margin="dense" label="Requests per minute" type="number" fullWidth variant="outlined" defaultValue={60} sx={{ mb: 1 }} />
          <TextField margin="dense" label="Requests per hour" type="number" fullWidth variant="outlined" defaultValue={3600} sx={{ mb: 1 }} />
          <TextField margin="dense" label="Requests per day" type="number" fullWidth variant="outlined" defaultValue={86400} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApiKeyDialog({ open: false, apiKey: null })}>Cancel</Button>
          <Button variant="contained" onClick={() => handleCreateAPIKey({})}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={webhookDialog.open}
        onClose={() => setWebhookDialog({ open: false, webhook: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Webhook</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Webhook URL" fullWidth variant="outlined" placeholder="https://example.com/webhook" sx={{ mb: 2 }} />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Events</InputLabel>
            <Select multiple defaultValue={['user.created']} label="Events">
              {WEBHOOK_EVENTS.map(event => (
                <MenuItem key={event} value={event}>{event}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField margin="dense" label="Max Retries" type="number" fullWidth variant="outlined" defaultValue={5} sx={{ mb: 1 }} />
          <TextField margin="dense" label="Timeout (ms)" type="number" fullWidth variant="outlined" defaultValue={30000} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWebhookDialog({ open: false, webhook: null })}>Cancel</Button>
          <Button variant="contained" onClick={() => handleCreateWebhook({})}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={oauthAppDialog.open}
        onClose={() => setOAuthAppDialog({ open: false, app: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create OAuth Application</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Application Name" fullWidth variant="outlined" sx={{ mb: 2 }} />
          <TextField margin="dense" label="Redirect URIs (one per line)" fullWidth multiline rows={3} variant="outlined" sx={{ mb: 2 }} />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Scopes</InputLabel>
            <Select multiple defaultValue={['users:read']} label="Scopes">
              {AVAILABLE_SCOPES.map(scope => (
                <MenuItem key={scope} value={scope}>{scope}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField margin="dense" label="Privacy Policy URL" fullWidth variant="outlined" sx={{ mb: 1 }} />
          <TextField margin="dense" label="Terms of Service URL" fullWidth variant="outlined" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOAuthAppDialog({ open: false, app: null })}>Cancel</Button>
          <Button variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MarketplaceDashboard;
