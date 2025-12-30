import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CloudUpload,
  Preview,
  Save,
  Refresh,
  Build,
  Smartphone,
  Palette,
  Settings,
  Flag,
} from '@mui/icons-material';
import { ChromePicker } from 'react-color';

interface BrandConfig {
  appName: string;
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  splashLogoUrl?: string;
  featureFlags: Record<string, boolean>;
}

interface BuildInfo {
  version: string;
  buildNumber: string;
  status: 'pending' | 'building' | 'success' | 'failed';
  platform: 'ios' | 'android' | 'both';
  timestamp: Date;
}

const AppCustomizationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState<BrandConfig>({
    appName: 'UpCoach',
    companyName: 'UpCoach Inc.',
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    accentColor: '#f50057',
    logoUrl: '',
    featureFlags: {
      darkMode: true,
      voiceInput: true,
      wearableSync: true,
      advancedAnalytics: true,
    },
  });

  const [builds, setBuilds] = useState<BuildInfo[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ============================================================================
  // Configuration Management
  // ============================================================================

  const handleConfigChange = (field: keyof BrandConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureFlagToggle = (flag: string) => {
    setConfig(prev => ({
      ...prev,
      featureFlags: {
        ...prev.featureFlags,
        [flag]: !prev.featureFlags[flag],
      },
    }));
  };

  const saveConfiguration = async () => {
    try {
      // API call to save configuration
      await fetch('/api/mobile/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/mobile/config');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  // ============================================================================
  // Asset Management
  // ============================================================================

  const handleLogoUpload = async (type: 'logo' | 'splash', file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch('/api/mobile/upload-asset', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (type === 'logo') {
        handleConfigChange('logoUrl', data.url);
      } else {
        handleConfigChange('splashLogoUrl', data.url);
      }
    } catch (error) {
      console.error('Failed to upload asset:', error);
    }
  };

  // ============================================================================
  // Build Management
  // ============================================================================

  const triggerBuild = async (platform: 'ios' | 'android' | 'both') => {
    try {
      const response = await fetch('/api/mobile/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, platform }),
      });

      const build = await response.json();
      setBuilds(prev => [build, ...prev]);
    } catch (error) {
      console.error('Failed to trigger build:', error);
    }
  };

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    loadConfiguration();
  }, []);

  // ============================================================================
  // Render Methods
  // ============================================================================

  const renderBrandingTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              App Information
            </Typography>
            <TextField
              fullWidth
              label="App Name"
              value={config.appName}
              onChange={(e) => handleConfigChange('appName', e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Company Name"
              value={config.companyName}
              onChange={(e) => handleConfigChange('companyName', e.target.value)}
              margin="normal"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Color Scheme
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
              {['primaryColor', 'secondaryColor', 'accentColor'].map((colorKey) => (
                <Box key={colorKey} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ width: 120 }}>
                    {colorKey.replace('Color', '')}:
                  </Typography>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      backgroundColor: config[colorKey as keyof BrandConfig] as string,
                      border: '1px solid #ccc',
                      borderRadius: 1,
                      cursor: 'pointer',
                    }}
                    onClick={() => setColorPickerOpen(colorKey)}
                  />
                  <TextField
                    size="small"
                    value={config[colorKey as keyof BrandConfig]}
                    onChange={(e) => handleConfigChange(colorKey as keyof BrandConfig, e.target.value)}
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Assets
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    App Logo
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
                    Upload Logo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleLogoUpload('logo', e.target.files[0]);
                        }
                      }}
                    />
                  </Button>
                  {config.logoUrl && (
                    <Box sx={{ mt: 2 }}>
                      <img
                        src={config.logoUrl}
                        alt="Logo"
                        style={{ maxWidth: '200px', maxHeight: '100px' }}
                      />
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Splash Screen Logo
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
                    Upload Splash Logo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleLogoUpload('splash', e.target.files[0]);
                        }
                      }}
                    />
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFeatureFlagsTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Feature Flags
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(config.featureFlags).map(([flag, enabled]) => (
            <Grid item xs={12} sm={6} md={4} key={flag}>
              <FormControlLabel
                control={
                  <Switch
                    checked={enabled}
                    onChange={() => handleFeatureFlagToggle(flag)}
                  />
                }
                label={flag.replace(/([A-Z])/g, ' $1').trim()}
              />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderBuildTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Build Management
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<Build />}
                onClick={() => triggerBuild('ios')}
              >
                Build iOS
              </Button>
              <Button
                variant="contained"
                startIcon={<Build />}
                onClick={() => triggerBuild('android')}
              >
                Build Android
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Build />}
                onClick={() => triggerBuild('both')}
              >
                Build Both
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Build History
            </Typography>
            {builds.length === 0 ? (
              <Typography color="text.secondary">No builds yet</Typography>
            ) : (
              builds.map((build, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    mb: 1,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1">
                      Version {build.version} ({build.buildNumber})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {build.platform} • {build.timestamp.toLocaleString()}
                    </Typography>
                  </Box>
                  <Chip
                    label={build.status}
                    color={
                      build.status === 'success'
                        ? 'success'
                        : build.status === 'failed'
                        ? 'error'
                        : 'default'
                    }
                  />
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPreviewTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Live Preview
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
            bgcolor: 'background.default',
            borderRadius: 2,
            p: 4,
          }}
        >
          <Box
            sx={{
              width: 375,
              height: 667,
              border: '8px solid #000',
              borderRadius: 4,
              overflow: 'hidden',
              bgcolor: 'white',
            }}
          >
            <Box
              sx={{
                height: 60,
                bgcolor: config.primaryColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Typography variant="h6">{config.appName}</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Preview of {config.appName} with your customizations
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">App Customization Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button startIcon={<Refresh />} onClick={loadConfiguration}>
            Reload
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={saveConfiguration}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Configuration saved successfully!
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab icon={<Palette />} label="Branding" />
          <Tab icon={<Flag />} label="Feature Flags" />
          <Tab icon={<Build />} label="Build" />
          <Tab icon={<Preview />} label="Preview" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderBrandingTab()}
      {activeTab === 1 && renderFeatureFlagsTab()}
      {activeTab === 2 && renderBuildTab()}
      {activeTab === 3 && renderPreviewTab()}

      {/* Color Picker Dialog */}
      <Dialog
        open={colorPickerOpen !== null}
        onClose={() => setColorPickerOpen(null)}
      >
        <DialogTitle>Choose Color</DialogTitle>
        <DialogContent>
          {colorPickerOpen && (
            <ChromePicker
              color={config[colorPickerOpen as keyof BrandConfig] as string}
              onChange={(color) =>
                handleConfigChange(colorPickerOpen as keyof BrandConfig, color.hex)
              }
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setColorPickerOpen(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppCustomizationDashboard;
