/**
 * Marketplace Browser
 *
 * React component for browsing and installing integrations from the marketplace.
 *
 * Features:
 * - Category navigation (Communication, CRM, Payments, Marketing, etc.)
 * - Search and filter functionality
 * - Connector cards with logos, descriptions, ratings
 * - Installation wizard with OAuth flow
 * - Credential configuration forms
 * - Test connection functionality
 * - Installed connectors management
 * - Usage statistics per connector
 * - Popular/Trending/New sections
 * - Material-UI design
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Rating,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Whatshot as NewIcon,
  CheckCircle as InstalledIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Launch as LaunchIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

interface Integration {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  longDescription: string;
  icon: string;
  logo: string;
  provider: string;
  website: string;
  documentationUrl: string;
  version: string;
  authType: string;
  pricing: 'free' | 'premium' | 'enterprise';
  popularity: number;
  rating: number;
  reviewCount: number;
  installCount: number;
  status: string;
  tags: string[];
  features: string[];
  requirements: string[];
  screenshots: string[];
}

interface InstalledIntegration {
  id: string;
  integrationId: string;
  status: string;
  installedAt: string;
  lastUsedAt?: string;
  healthStatus: {
    isHealthy: boolean;
    lastChecked: string;
  };
  usageStats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

const categories: Category[] = [
  { id: 'all', name: 'All Integrations', icon: '🌐', count: 0 },
  { id: 'communication', name: 'Communication', icon: '💬', count: 0 },
  { id: 'crm', name: 'CRM', icon: '👥', count: 0 },
  { id: 'payments', name: 'Payments', icon: '💳', count: 0 },
  { id: 'marketing', name: 'Marketing', icon: '📧', count: 0 },
  { id: 'project_management', name: 'Project Management', icon: '📋', count: 0 },
  { id: 'file_storage', name: 'File Storage', icon: '📁', count: 0 },
  { id: 'social_media', name: 'Social Media', icon: '📱', count: 0 },
  { id: 'analytics', name: 'Analytics', icon: '📊', count: 0 },
  { id: 'ecommerce', name: 'E-commerce', icon: '🛍️', count: 0 },
  { id: 'calendar', name: 'Calendar', icon: '📅', count: 0 },
  { id: 'video_conferencing', name: 'Video', icon: '🎥', count: 0 },
  { id: 'development', name: 'Development', icon: '💻', count: 0 },
  { id: 'accounting', name: 'Accounting', icon: '💵', count: 0 },
  { id: 'support', name: 'Support', icon: '🎧', count: 0 },
  { id: 'collaboration', name: 'Collaboration', icon: '🤝', count: 0 },
];

export const MarketplaceBrowser: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [installedIntegrations, setInstalledIntegrations] = useState<InstalledIntegration[]>([]);
  const [filteredIntegrations, setFilteredIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [installStep, setInstallStep] = useState(0);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [installing, setInstalling] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showUninstallDialog, setShowUninstallDialog] = useState(false);
  const [selectedInstalled, setSelectedInstalled] = useState<InstalledIntegration | null>(null);

  useEffect(() => {
    fetchIntegrations();
    fetchInstalledIntegrations();
  }, []);

  useEffect(() => {
    filterIntegrations();
  }, [integrations, selectedCategory, searchQuery, activeTab]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marketplace/integrations');
      const data = await response.json();
      setIntegrations(data);
    } catch (error) {
      enqueueSnackbar('Failed to load integrations', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchInstalledIntegrations = async () => {
    try {
      const response = await fetch('/api/marketplace/installed');
      const data = await response.json();
      setInstalledIntegrations(data);
    } catch (error) {
      enqueueSnackbar('Failed to load installed integrations', { variant: 'error' });
    }
  };

  const filterIntegrations = useCallback(() => {
    let filtered = [...integrations];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(i => i.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        i =>
          i.name.toLowerCase().includes(query) ||
          i.description.toLowerCase().includes(query) ||
          i.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    switch (activeTab) {
      case 1:
        filtered.sort((a, b) => b.installCount - a.installCount);
        break;
      case 2:
        filtered.sort((a, b) => b.popularity * 0.6 + b.rating * 0.4 - (a.popularity * 0.6 + a.rating * 0.4));
        break;
      case 3:
        filtered = filtered.filter(i =>
          installedIntegrations.some(inst => inst.integrationId === i.id)
        );
        break;
    }

    setFilteredIntegrations(filtered);
  }, [integrations, selectedCategory, searchQuery, activeTab, installedIntegrations]);

  const isInstalled = (integrationId: string): boolean => {
    return installedIntegrations.some(i => i.integrationId === integrationId);
  };

  const handleInstallClick = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowInstallDialog(true);
    setInstallStep(0);
    setCredentials({});
  };

  const handleInstall = async () => {
    if (!selectedIntegration) return;

    setInstalling(true);
    try {
      if (selectedIntegration.authType === 'oauth2') {
        const response = await fetch('/api/marketplace/oauth/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: selectedIntegration.id,
          }),
        });

        const { authorizationUrl } = await response.json();
        window.location.href = authorizationUrl;
      } else {
        const response = await fetch('/api/marketplace/install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            integrationId: selectedIntegration.id,
            credentials,
          }),
        });

        if (!response.ok) throw new Error('Installation failed');

        enqueueSnackbar(`${selectedIntegration.name} installed successfully`, {
          variant: 'success',
        });

        await fetchInstalledIntegrations();
        setShowInstallDialog(false);
      }
    } catch (error) {
      enqueueSnackbar('Installation failed', { variant: 'error' });
    } finally {
      setInstalling(false);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedIntegration) return;

    setTestingConnection(true);
    try {
      const response = await fetch('/api/marketplace/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationId: selectedIntegration.id,
          credentials,
        }),
      });

      if (!response.ok) throw new Error('Connection test failed');

      enqueueSnackbar('Connection successful!', { variant: 'success' });
      setInstallStep(2);
    } catch (error) {
      enqueueSnackbar('Connection failed. Please check your credentials.', {
        variant: 'error',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleUninstall = async () => {
    if (!selectedInstalled) return;

    try {
      const response = await fetch(`/api/marketplace/uninstall/${selectedInstalled.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Uninstall failed');

      enqueueSnackbar('Integration uninstalled successfully', { variant: 'success' });
      await fetchInstalledIntegrations();
      setShowUninstallDialog(false);
    } catch (error) {
      enqueueSnackbar('Failed to uninstall integration', { variant: 'error' });
    }
  };

  const renderCredentialForm = () => {
    if (!selectedIntegration) return null;

    switch (selectedIntegration.authType) {
      case 'api_key':
        return (
          <TextField
            fullWidth
            label="API Key"
            value={credentials.apiKey || ''}
            onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
            margin="normal"
            type="password"
            helperText="Enter your API key from the provider's dashboard"
          />
        );

      case 'basic':
        return (
          <>
            <TextField
              fullWidth
              label="Username"
              value={credentials.username || ''}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Password"
              value={credentials.password || ''}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              margin="normal"
              type="password"
            />
          </>
        );

      case 'bearer':
        return (
          <TextField
            fullWidth
            label="Access Token"
            value={credentials.accessToken || ''}
            onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
            margin="normal"
            type="password"
            helperText="Enter your bearer token"
          />
        );

      default:
        return null;
    }
  };

  const renderInstallDialog = () => {
    if (!selectedIntegration) return null;

    const steps = ['Introduction', 'Configure', 'Complete'];

    return (
      <Dialog
        open={showInstallDialog}
        onClose={() => !installing && setShowInstallDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar src={selectedIntegration.logo} alt={selectedIntegration.name}>
                {selectedIntegration.icon}
              </Avatar>
              <Typography variant="h6">Install {selectedIntegration.name}</Typography>
            </Box>
            <IconButton onClick={() => setShowInstallDialog(false)} disabled={installing}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Stepper activeStep={installStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {installStep === 0 && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedIntegration.longDescription}
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Features
              </Typography>
              <List dense>
                {selectedIntegration.features.map((feature, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`• ${feature}`} />
                  </ListItem>
                ))}
              </List>

              {selectedIntegration.requirements.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Requirements
                  </Typography>
                  <List dense>
                    {selectedIntegration.requirements.map((req, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={`• ${req}`} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          )}

          {installStep === 1 && (
            <Box>
              {selectedIntegration.authType === 'oauth2' ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  You will be redirected to {selectedIntegration.provider} to authorize access.
                  After authorization, you'll be redirected back to complete the installation.
                </Alert>
              ) : (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Enter your {selectedIntegration.name} credentials below. You can find these in
                    your {selectedIntegration.provider} account settings.
                  </Alert>
                  {renderCredentialForm()}
                </>
              )}
            </Box>
          )}

          {installStep === 2 && (
            <Box textAlign="center" py={3}>
              <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Installation Complete!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {selectedIntegration.name} has been successfully installed and is ready to use.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          {installStep > 0 && installStep < 2 && (
            <Button onClick={() => setInstallStep(installStep - 1)} disabled={installing}>
              Back
            </Button>
          )}
          <Button onClick={() => setShowInstallDialog(false)} disabled={installing}>
            {installStep === 2 ? 'Close' : 'Cancel'}
          </Button>
          {installStep === 0 && (
            <Button
              variant="contained"
              onClick={() => setInstallStep(1)}
            >
              Continue
            </Button>
          )}
          {installStep === 1 && selectedIntegration.authType !== 'oauth2' && (
            <Button
              variant="outlined"
              onClick={handleTestConnection}
              disabled={testingConnection || installing}
            >
              {testingConnection ? <CircularProgress size={24} /> : 'Test Connection'}
            </Button>
          )}
          {installStep === 1 && (
            <Button
              variant="contained"
              onClick={handleInstall}
              disabled={installing}
            >
              {installing ? <CircularProgress size={24} /> : 'Install'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  const renderIntegrationCard = (integration: Integration) => {
    const installed = isInstalled(integration.id);

    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={integration.id}>
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            '&:hover': { boxShadow: 4 },
          }}
        >
          {installed && (
            <Chip
              icon={<InstalledIcon />}
              label="Installed"
              color="success"
              size="small"
              sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
            />
          )}

          <CardContent sx={{ flexGrow: 1 }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar
                src={integration.logo}
                alt={integration.name}
                sx={{ width: 48, height: 48 }}
              >
                {integration.icon}
              </Avatar>
              <Box flexGrow={1}>
                <Typography variant="h6" component="div">
                  {integration.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  by {integration.provider}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 60 }}>
              {integration.description}
            </Typography>

            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Rating value={integration.rating} precision={0.1} size="small" readOnly />
              <Typography variant="caption" color="text.secondary">
                ({integration.reviewCount})
              </Typography>
            </Box>

            <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
              <Chip label={integration.pricing} size="small" color="primary" variant="outlined" />
              <Chip label={integration.authType} size="small" variant="outlined" />
            </Box>

            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {integration.tags.slice(0, 3).map(tag => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Box>
          </CardContent>

          <CardActions>
            <Button
              size="small"
              startIcon={<InfoIcon />}
              onClick={() => {
                setSelectedIntegration(integration);
                setShowDetailsDialog(true);
              }}
            >
              Details
            </Button>
            {installed ? (
              <Button
                size="small"
                startIcon={<SettingsIcon />}
                onClick={() => {
                  const inst = installedIntegrations.find(i => i.integrationId === integration.id);
                  if (inst) {
                    setSelectedInstalled(inst);
                    setShowDetailsDialog(true);
                  }
                }}
              >
                Manage
              </Button>
            ) : (
              <Button
                size="small"
                variant="contained"
                onClick={() => handleInstallClick(integration)}
              >
                Install
              </Button>
            )}
          </CardActions>
        </Card>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Integration Marketplace
        </Typography>
        <Badge badgeContent={installedIntegrations.length} color="primary">
          <Button variant="outlined" startIcon={<InstalledIcon />}>
            My Integrations
          </Button>
        </Badge>
      </Box>

      <Box mb={3}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label="All" />
          <Tab icon={<StarIcon />} label="Popular" />
          <Tab icon={<TrendingIcon />} label="Trending" />
          <Tab icon={<InstalledIcon />} label="Installed" />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <TextField
                fullWidth
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Categories
              </Typography>
              <List dense>
                {categories.map(category => (
                  <ListItem
                    key={category.id}
                    button
                    selected={selectedCategory === category.id}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>{category.icon}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={category.name} />
                    <Typography variant="caption" color="text.secondary">
                      {integrations.filter(i => category.id === 'all' || i.category === category.id).length}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
              <CircularProgress />
            </Box>
          ) : filteredIntegrations.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="text.secondary">
                No integrations found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filters
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredIntegrations.map(renderIntegrationCard)}
            </Grid>
          )}
        </Grid>
      </Grid>

      {renderInstallDialog()}

      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedIntegration && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar src={selectedIntegration.logo} sx={{ width: 56, height: 56 }}>
                  {selectedIntegration.icon}
                </Avatar>
                <Box>
                  <Typography variant="h5">{selectedIntegration.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Version {selectedIntegration.version} • {selectedIntegration.installCount.toLocaleString()} installs
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedIntegration.longDescription}
              </Typography>

              <Box display="flex" gap={1} mb={2}>
                <Button
                  size="small"
                  startIcon={<LaunchIcon />}
                  href={selectedIntegration.website}
                  target="_blank"
                >
                  Website
                </Button>
                <Button
                  size="small"
                  startIcon={<InfoIcon />}
                  href={selectedIntegration.documentationUrl}
                  target="_blank"
                >
                  Documentation
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Features
              </Typography>
              <List>
                {selectedIntegration.features.map((feature, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`• ${feature}`} />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={showUninstallDialog}
        onClose={() => setShowUninstallDialog(false)}
      >
        <DialogTitle>Uninstall Integration</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to uninstall this integration? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUninstallDialog(false)}>Cancel</Button>
          <Button onClick={handleUninstall} color="error" variant="contained">
            Uninstall
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarketplaceBrowser;
