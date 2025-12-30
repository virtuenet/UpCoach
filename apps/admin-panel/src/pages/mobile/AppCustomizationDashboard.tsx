import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  TextField,
  Typography,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  CloudUpload,
  Phone,
  Palette,
  Settings,
  Build,
  Visibility,
  Download,
  Delete,
  Edit,
  Add,
  Check,
  Close,
} from '@mui/icons-material';
import { ChromePicker } from 'react-color';

// ============================================================================
// Types
// ============================================================================

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  error: string;
  success: string;
  warning: string;
}

interface BrandConfig {
  organizationId: string;
  appName: string;
  logoUrl: string;
  iconUrl: string;
  colorScheme: ColorScheme;
  typography: {
    fontFamily: string;
    fontSize: number;
  };
  features: {
    [key: string]: boolean;
  };
}

interface AppVersion {
  id: string;
  version: string;
  buildNumber: number;
  platform: 'ios' | 'android' | 'both';
  status: 'draft' | 'building' | 'ready' | 'published';
  createdAt: string;
  publishedAt?: string;
}

interface BuildConfig {
  platform: 'ios' | 'android' | 'both';
  environment: 'development' | 'staging' | 'production';
  bundleId: string;
  versionCode: number;
  versionName: string;
}

// ============================================================================
// Main Component
// ============================================================================

const AppCustomizationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [brandConfig, setBrandConfig] = useState<BrandConfig>({
    organizationId: '',
    appName: '',
    logoUrl: '',
    iconUrl: '',
    colorScheme: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#EC4899',
      background: '#FFFFFF',
      surface: '#F3F4F6',
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: 14,
    },
    features: {
      habits: true,
      goals: true,
      coaching: true,
      analytics: true,
      social: true,
    },
  });

  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [buildConfig, setBuildConfig] = useState<BuildConfig>({
    platform: 'both',
    environment: 'production',
    bundleId: 'com.upcoach.app',
    versionCode: 1,
    versionName: '1.0.0',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [buildDialogOpen, setBuildDialogOpen] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);

  // ============================================================================
  // Data Loading
  // ============================================================================

  useEffect(() => {
    loadConfiguration();
    loadVersions();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Load saved configuration
    } catch (error) {
      console.error('Error loading configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async () => {
    try {
      // Simulate API call
      const mockVersions: AppVersion[] = [
        {
          id: '1',
          version: '1.0.0',
          buildNumber: 1,
          platform: 'both',
          status: 'published',
          createdAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
        },
      ];
      setVersions(mockVersions);
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  // ============================================================================
  // Configuration Updates
  // ============================================================================

  const handleConfigChange = (field: string, value: any) => {
    setBrandConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleColorChange = (field: keyof ColorScheme, color: string) => {
    setBrandConfig(prev => ({
      ...prev,
      colorScheme: {
        ...prev.colorScheme,
        [field]: color,
      },
    }));
  };

  const handleFeatureToggle = (feature: string, enabled: boolean) => {
    setBrandConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: enabled,
      },
    }));
  };

  const handleSaveConfiguration = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Configuration saved:', brandConfig);
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // Asset Upload
  // ============================================================================

  const handleAssetUpload = async (assetType: 'logo' | 'icon', file: File) => {
    setUploadingAsset(assetType);
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create object URL for preview
      const url = URL.createObjectURL(file);
      
      if (assetType === 'logo') {
        handleConfigChange('logoUrl', url);
      } else {
        handleConfigChange('iconUrl', url);
      }
    } catch (error) {
      console.error('Error uploading asset:', error);
      alert('Failed to upload asset');
    } finally {
      setUploadingAsset(null);
    }
  };

  // ============================================================================
  // Build Triggers
  // ============================================================================

  const handleTriggerBuild = async () => {
    setBuildDialogOpen(false);
    setLoading(true);
    
    try {
      // Simulate build trigger
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newVersion: AppVersion = {
        id: Date.now().toString(),
        version: buildConfig.versionName,
        buildNumber: buildConfig.versionCode,
        platform: buildConfig.platform,
        status: 'building',
        createdAt: new Date().toISOString(),
      };
      
      setVersions(prev => [newVersion, ...prev]);
      alert('Build triggered successfully!');
    } catch (error) {
      console.error('Error triggering build:', error);
      alert('Failed to trigger build');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Render Tabs
  // ============================================================================

  const renderBrandingTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <TextField
              fullWidth
              label="Organization ID"
              value={brandConfig.organizationId}
              onChange={(e) => handleConfigChange('organizationId', e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="App Name"
              value={brandConfig.appName}
              onChange={(e) => handleConfigChange('appName', e.target.value)}
              margin="normal"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Assets
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Logo
              </Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="logo-upload"
                type="file"
                onChange={(e) => e.target.files?.[0] && handleAssetUpload('logo', e.target.files[0])}
              />
              <label htmlFor="logo-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={uploadingAsset === 'logo' ? <CircularProgress size={20} /> : <CloudUpload />}
                  disabled={uploadingAsset === 'logo'}
                >
                  Upload Logo
                </Button>
              </label>
              {brandConfig.logoUrl && (
                <Box sx={{ mt: 1 }}>
                  <img src={brandConfig.logoUrl} alt="Logo" style={{ maxHeight: 100 }} />
                </Box>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                App Icon
              </Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="icon-upload"
                type="file"
                onChange={(e) => e.target.files?.[0] && handleAssetUpload('icon', e.target.files[0])}
              />
              <label htmlFor="icon-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={uploadingAsset === 'icon' ? <CircularProgress size={20} /> : <CloudUpload />}
                  disabled={uploadingAsset === 'icon'}
                >
                  Upload Icon
                </Button>
              </label>
              {brandConfig.iconUrl && (
                <Box sx={{ mt: 1 }}>
                  <img src={brandConfig.iconUrl} alt="Icon" style={{ maxHeight: 80 }} />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderThemeTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Color Scheme
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(brandConfig.colorScheme).map(([key, value]) => (
                <Grid item xs={6} sm={4} md={3} key={key}>
                  <ColorPickerField
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    color={value}
                    onChange={(color) => handleColorChange(key as keyof ColorScheme, color)}
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Typography
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Font Family</InputLabel>
                  <Select
                    value={brandConfig.typography.fontFamily}
                    onChange={(e) => handleConfigChange('typography', {
                      ...brandConfig.typography,
                      fontFamily: e.target.value,
                    })}
                  >
                    <MenuItem value="Inter">Inter</MenuItem>
                    <MenuItem value="Roboto">Roboto</MenuItem>
                    <MenuItem value="Poppins">Poppins</MenuItem>
                    <MenuItem value="Open Sans">Open Sans</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Base Font Size"
                  type="number"
                  value={brandConfig.typography.fontSize}
                  onChange={(e) => handleConfigChange('typography', {
                    ...brandConfig.typography,
                    fontSize: parseInt(e.target.value),
                  })}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFeaturesTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Feature Flags
        </Typography>
        <List>
          {Object.entries(brandConfig.features).map(([feature, enabled]) => (
            <ListItem key={feature}>
              <ListItemText
                primary={feature.charAt(0).toUpperCase() + feature.slice(1)}
                secondary={`Enable ${feature} functionality`}
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={enabled}
                  onChange={(e) => handleFeatureToggle(feature, e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderBuildTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Build Configuration
              </Typography>
              <Button
                variant="contained"
                startIcon={<Build />}
                onClick={() => setBuildDialogOpen(true)}
              >
                Trigger New Build
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bundle ID"
                  value={buildConfig.bundleId}
                  onChange={(e) => setBuildConfig(prev => ({ ...prev, bundleId: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Version Name"
                  value={buildConfig.versionName}
                  onChange={(e) => setBuildConfig(prev => ({ ...prev, versionName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Version Code"
                  type="number"
                  value={buildConfig.versionCode}
                  onChange={(e) => setBuildConfig(prev => ({ ...prev, versionCode: parseInt(e.target.value) }))}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Build History
            </Typography>
            <List>
              {versions.map((version) => (
                <ListItem key={version.id}>
                  <ListItemText
                    primary={`Version ${version.version} (${version.buildNumber})`}
                    secondary={
                      <>
                        <Chip
                          label={version.status}
                          size="small"
                          color={version.status === 'published' ? 'success' : version.status === 'building' ? 'warning' : 'default'}
                          sx={{ mr: 1 }}
                        />
                        <Chip label={version.platform} size="small" sx={{ mr: 1 }} />
                        {new Date(version.createdAt).toLocaleString()}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    {version.status === 'ready' && (
                      <IconButton edge="end" aria-label="download">
                        <Download />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPreview = () => (
    <Card sx={{ backgroundColor: brandConfig.colorScheme.background }}>
      <CardContent>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          {brandConfig.logoUrl ? (
            <img src={brandConfig.logoUrl} alt="Logo" style={{ maxHeight: 120, marginBottom: 16 }} />
          ) : (
            <Box sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Typography color="text.secondary">Logo Preview</Typography>
            </Box>
          )}
          
          <Typography variant="h4" sx={{ color: brandConfig.colorScheme.primary, mb: 2 }}>
            {brandConfig.appName || 'App Name'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: brandConfig.colorScheme.primary,
                '&:hover': { backgroundColor: brandConfig.colorScheme.secondary },
              }}
            >
              Primary Button
            </Button>
            <Button
              variant="outlined"
              sx={{
                borderColor: brandConfig.colorScheme.primary,
                color: brandConfig.colorScheme.primary,
              }}
            >
              Secondary Button
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Chip label="Success" sx={{ backgroundColor: brandConfig.colorScheme.success, color: '#fff' }} />
            <Chip label="Warning" sx={{ backgroundColor: brandConfig.colorScheme.warning, color: '#fff' }} />
            <Chip label="Error" sx={{ backgroundColor: brandConfig.colorScheme.error, color: '#fff' }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // ============================================================================
  // Render Main Component
  // ============================================================================

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          App Customization Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Visibility />}
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Check />}
            onClick={handleSaveConfiguration}
            disabled={saving}
          >
            Save Configuration
          </Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<Palette />} label="Branding" />
          <Tab icon={<Palette />} label="Theme" />
          <Tab icon={<Settings />} label="Features" />
          <Tab icon={<Build />} label="Build" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {activeTab === 0 && renderBrandingTab()}
          {activeTab === 1 && renderThemeTab()}
          {activeTab === 2 && renderFeaturesTab()}
          {activeTab === 3 && renderBuildTab()}
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Live Preview</Typography>
            <IconButton onClick={() => setPreviewOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderPreview()}
        </DialogContent>
      </Dialog>

      {/* Build Dialog */}
      <Dialog open={buildDialogOpen} onClose={() => setBuildDialogOpen(false)}>
        <DialogTitle>Trigger New Build</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Platform</InputLabel>
            <Select
              value={buildConfig.platform}
              onChange={(e) => setBuildConfig(prev => ({ ...prev, platform: e.target.value as any }))}
            >
              <MenuItem value="ios">iOS</MenuItem>
              <MenuItem value="android">Android</MenuItem>
              <MenuItem value="both">Both</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Environment</InputLabel>
            <Select
              value={buildConfig.environment}
              onChange={(e) => setBuildConfig(prev => ({ ...prev, environment: e.target.value as any }))}
            >
              <MenuItem value="development">Development</MenuItem>
              <MenuItem value="staging">Staging</MenuItem>
              <MenuItem value="production">Production</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBuildDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTriggerBuild}>
            Start Build
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// ============================================================================
// Color Picker Component
// ============================================================================

const ColorPickerField: React.FC<{
  label: string;
  color: string;
  onChange: (color: string) => void;
}> = ({ label, color, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mt: 0.5,
          cursor: 'pointer',
        }}
        onClick={() => setShowPicker(!showPicker)}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            backgroundColor: color,
            border: '2px solid #ddd',
            borderRadius: 1,
          }}
        />
        <Typography variant="body2">{color}</Typography>
      </Box>
      {showPicker && (
        <Box sx={{ position: 'absolute', zIndex: 2 }}>
          <Box
            sx={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }}
            onClick={() => setShowPicker(false)}
          />
          <ChromePicker color={color} onChange={(color) => onChange(color.hex)} />
        </Box>
      )}
    </Box>
  );
};

export default AppCustomizationDashboard;
