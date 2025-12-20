import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  Chip,
  Paper,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Sync,
  Link as LinkIcon,
  LinkOff,
} from '@mui/icons-material';
import { tiersService, SubscriptionTier, CreateTierInput, UpdateTierInput } from '../../services/tiersService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tier-tabpanel-${index}`}
      aria-labelledby={`tier-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TierEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';

  // State
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Form state
  const [formData, setFormData] = useState<CreateTierInput & { stripeProductId?: string | null }>({
    name: '',
    displayName: '',
    description: '',
    sortOrder: 0,
    isActive: true,
    isPublic: false,
    maxCoaches: 1,
    maxGoals: 3,
    maxChatsPerDay: 5,
    hasVoiceJournaling: false,
    hasProgressPhotos: false,
    hasAdvancedAnalytics: false,
    hasTeamFeatures: false,
    hasPrioritySupport: false,
    hasCustomBranding: false,
    hasApiAccess: false,
    hasSsoIntegration: false,
    hasDedicatedSupport: false,
  });

  // Stripe sync state
  const [syncing, setSyncing] = useState(false);
  const [tier, setTier] = useState<SubscriptionTier | null>(null);

  // Fetch tier if editing
  const fetchTier = useCallback(async () => {
    if (isNew || !id) return;

    try {
      setLoading(true);
      const data = await tiersService.getTierById(id);
      setTier(data);
      setFormData({
        name: data.name,
        displayName: data.displayName,
        description: data.description || '',
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        isPublic: data.isPublic,
        maxCoaches: data.maxCoaches,
        maxGoals: data.maxGoals,
        maxChatsPerDay: data.maxChatsPerDay,
        hasVoiceJournaling: data.hasVoiceJournaling,
        hasProgressPhotos: data.hasProgressPhotos,
        hasAdvancedAnalytics: data.hasAdvancedAnalytics,
        hasTeamFeatures: data.hasTeamFeatures,
        hasPrioritySupport: data.hasPrioritySupport,
        hasCustomBranding: data.hasCustomBranding,
        hasApiAccess: data.hasApiAccess,
        hasSsoIntegration: data.hasSsoIntegration,
        hasDedicatedSupport: data.hasDedicatedSupport,
        stripeProductId: data.stripeProductId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tier');
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    fetchTier();
  }, [fetchTier]);

  // Handle form changes
  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLimitChange = (field: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (value === '-1' || !isNaN(numValue)) {
      handleChange(field, value === '-1' ? -1 : numValue);
    }
  };

  // Save tier
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (isNew) {
        const newTier = await tiersService.createTier(formData);
        setSuccess('Tier created successfully');
        navigate(`/financial/tiers/${newTier.id}`);
      } else if (id) {
        const updateData: UpdateTierInput = { ...formData };
        await tiersService.updateTier(id, updateData);
        setSuccess('Tier updated successfully');
        fetchTier();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tier');
    } finally {
      setSaving(false);
    }
  };

  // Sync to Stripe
  const handleSyncToStripe = async () => {
    if (!id || isNew) return;

    try {
      setSyncing(true);
      setError(null);
      await tiersService.syncTierToStripe(id);
      setSuccess('Synced to Stripe successfully');
      fetchTier();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync to Stripe');
    } finally {
      setSyncing(false);
    }
  };

  // Unlink from Stripe
  const handleUnlinkStripe = async () => {
    if (!id || isNew) return;

    try {
      setSyncing(true);
      setError(null);
      await tiersService.unlinkStripeProduct(id);
      setSuccess('Unlinked from Stripe successfully');
      fetchTier();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink from Stripe');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/financial/tiers')}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {isNew ? 'Create Tier' : `Edit: ${tier?.displayName || ''}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isNew ? 'Create a new subscription tier' : 'Modify tier settings and features'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isNew && (
            <>
              {tier?.stripeProductId ? (
                <Tooltip title="Unlink from Stripe">
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={syncing ? <CircularProgress size={16} /> : <LinkOff />}
                    onClick={handleUnlinkStripe}
                    disabled={syncing}
                  >
                    Unlink Stripe
                  </Button>
                </Tooltip>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={syncing ? <CircularProgress size={16} /> : <Sync />}
                  onClick={handleSyncToStripe}
                  disabled={syncing}
                >
                  Sync to Stripe
                </Button>
              )}
            </>
          )}
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
            onClick={handleSave}
            disabled={saving}
          >
            {isNew ? 'Create' : 'Save'}
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
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

      {/* Stripe Status */}
      {!isNew && tier && (
        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <LinkIcon color={tier.stripeProductId ? 'success' : 'disabled'} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              Stripe Integration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tier.stripeProductId
                ? `Linked to product: ${tier.stripeProductId}`
                : 'Not linked to Stripe'}
            </Typography>
          </Box>
          {tier.stripeProductId && (
            <Chip label="Synced" color="success" size="small" />
          )}
        </Paper>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="Basic Info" />
            <Tab label="Limits" />
            <Tab label="Features" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Basic Info Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Internal Name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  helperText="Unique identifier (lowercase, alphanumeric)"
                  disabled={!isNew}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Display Name"
                  value={formData.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  helperText="Name shown to users"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  multiline
                  rows={3}
                  helperText="Optional description for the tier"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sort Order"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => handleChange('sortOrder', parseInt(e.target.value, 10) || 0)}
                  helperText="Display order (lower = first)"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => handleChange('isActive', e.target.checked)}
                    />
                  }
                  label="Active"
                />
                <Typography variant="body2" color="text.secondary">
                  Only active tiers can have new subscriptions
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isPublic}
                      onChange={(e) => handleChange('isPublic', e.target.checked)}
                    />
                  }
                  label="Public"
                />
                <Typography variant="body2" color="text.secondary">
                  Public tiers are shown on the pricing page
                </Typography>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Limits Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Set -1 for unlimited. Limits control what users can access on this tier.
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Coaches"
                  type="number"
                  value={formData.maxCoaches}
                  onChange={(e) => handleLimitChange('maxCoaches', e.target.value)}
                  helperText={formData.maxCoaches === -1 ? 'Unlimited' : `${formData.maxCoaches} coaches`}
                  InputProps={{
                    endAdornment: formData.maxCoaches === -1 ? (
                      <Chip label="Unlimited" size="small" color="primary" />
                    ) : null,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Goals"
                  type="number"
                  value={formData.maxGoals}
                  onChange={(e) => handleLimitChange('maxGoals', e.target.value)}
                  helperText={formData.maxGoals === -1 ? 'Unlimited' : `${formData.maxGoals} goals`}
                  InputProps={{
                    endAdornment: formData.maxGoals === -1 ? (
                      <Chip label="Unlimited" size="small" color="primary" />
                    ) : null,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Chats Per Day"
                  type="number"
                  value={formData.maxChatsPerDay}
                  onChange={(e) => handleLimitChange('maxChatsPerDay', e.target.value)}
                  helperText={formData.maxChatsPerDay === -1 ? 'Unlimited' : `${formData.maxChatsPerDay} chats/day`}
                  InputProps={{
                    endAdornment: formData.maxChatsPerDay === -1 ? (
                      <Chip label="Unlimited" size="small" color="primary" />
                    ) : null,
                  }}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  handleChange('maxCoaches', -1);
                  handleChange('maxGoals', -1);
                  handleChange('maxChatsPerDay', -1);
                }}
              >
                Set All Unlimited
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  handleChange('maxCoaches', 1);
                  handleChange('maxGoals', 3);
                  handleChange('maxChatsPerDay', 5);
                }}
              >
                Reset to Free Defaults
              </Button>
            </Box>
          </TabPanel>

          {/* Features Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Toggle features available on this tier.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Core Features
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.hasVoiceJournaling}
                      onChange={(e) => handleChange('hasVoiceJournaling', e.target.checked)}
                    />
                  }
                  label="Voice Journaling"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.hasProgressPhotos}
                      onChange={(e) => handleChange('hasProgressPhotos', e.target.checked)}
                    />
                  }
                  label="Progress Photos"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.hasAdvancedAnalytics}
                      onChange={(e) => handleChange('hasAdvancedAnalytics', e.target.checked)}
                    />
                  }
                  label="Advanced Analytics"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Team & Business Features
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.hasTeamFeatures}
                      onChange={(e) => handleChange('hasTeamFeatures', e.target.checked)}
                    />
                  }
                  label="Team Features"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.hasCustomBranding}
                      onChange={(e) => handleChange('hasCustomBranding', e.target.checked)}
                    />
                  }
                  label="Custom Branding"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.hasApiAccess}
                      onChange={(e) => handleChange('hasApiAccess', e.target.checked)}
                    />
                  }
                  label="API Access"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Enterprise Features
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.hasSsoIntegration}
                      onChange={(e) => handleChange('hasSsoIntegration', e.target.checked)}
                    />
                  }
                  label="SSO Integration"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.hasDedicatedSupport}
                      onChange={(e) => handleChange('hasDedicatedSupport', e.target.checked)}
                    />
                  }
                  label="Dedicated Support"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.hasPrioritySupport}
                      onChange={(e) => handleChange('hasPrioritySupport', e.target.checked)}
                    />
                  }
                  label="Priority Support"
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  handleChange('hasVoiceJournaling', true);
                  handleChange('hasProgressPhotos', true);
                  handleChange('hasAdvancedAnalytics', true);
                  handleChange('hasTeamFeatures', true);
                  handleChange('hasPrioritySupport', true);
                  handleChange('hasCustomBranding', true);
                  handleChange('hasApiAccess', true);
                  handleChange('hasSsoIntegration', true);
                  handleChange('hasDedicatedSupport', true);
                }}
              >
                Enable All Features
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  handleChange('hasVoiceJournaling', false);
                  handleChange('hasProgressPhotos', false);
                  handleChange('hasAdvancedAnalytics', false);
                  handleChange('hasTeamFeatures', false);
                  handleChange('hasPrioritySupport', false);
                  handleChange('hasCustomBranding', false);
                  handleChange('hasApiAccess', false);
                  handleChange('hasSsoIntegration', false);
                  handleChange('hasDedicatedSupport', false);
                }}
              >
                Disable All Features
              </Button>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
