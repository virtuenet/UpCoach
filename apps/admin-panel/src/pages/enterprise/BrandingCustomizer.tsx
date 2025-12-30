import React, { useState, useEffect, useCallback } from 'react';
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
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  Avatar,
  IconButton,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import {
  Upload,
  Save,
  Refresh,
  Visibility,
  Code,
  Palette,
  Image as ImageIcon,
  Typography as TypographyIcon,
  Settings,
  CheckCircle,
} from '@mui/icons-material';
import { SketchPicker, ColorResult } from 'react-color';

/**
 * Branding Customizer Component
 *
 * Comprehensive white-label branding interface for enterprise clients.
 * Allows customization of colors, logos, typography, and theme settings.
 */

interface BrandingConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    error: string;
    success: string;
    warning: string;
  };
  logo: {
    main: string;
    icon: string;
    favicon: string;
    loading: string;
  };
  typography: {
    fontFamily: string;
    headingFontFamily: string;
    fontSize: {
      small: number;
      medium: number;
      large: number;
    };
  };
  theme: {
    mode: 'light' | 'dark' | 'auto';
    borderRadius: number;
    spacing: number;
  };
  customCss: string;
  features: {
    customDomain: boolean;
    removeBranding: boolean;
    customEmailTemplates: boolean;
  };
}

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

const BrandingCustomizer: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  const [config, setConfig] = useState<BrandingConfig>({
    colors: {
      primary: '#2196F3',
      secondary: '#FF4081',
      accent: '#00BCD4',
      background: '#FFFFFF',
      text: '#212121',
      error: '#F44336',
      success: '#4CAF50',
      warning: '#FF9800',
    },
    logo: {
      main: '',
      icon: '',
      favicon: '',
      loading: '',
    },
    typography: {
      fontFamily: 'Roboto, sans-serif',
      headingFontFamily: 'Roboto, sans-serif',
      fontSize: {
        small: 12,
        medium: 14,
        large: 16,
      },
    },
    theme: {
      mode: 'light',
      borderRadius: 4,
      spacing: 8,
    },
    customCss: '',
    features: {
      customDomain: false,
      removeBranding: false,
      customEmailTemplates: false,
    },
  });

  useEffect(() => {
    loadBrandingConfig();
  }, []);

  const loadBrandingConfig = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In production, fetch from API
      // const response = await fetch('/api/enterprise/branding');
      // const data = await response.json();
      // setConfig(data);

    } catch (error) {
      showSnackbar('Failed to load branding configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In production, save to API
      // await fetch('/api/enterprise/branding', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(config),
      // });

      showSnackbar('Branding configuration saved successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to save branding configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = (colorKey: string, color: ColorResult) => {
    setConfig(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: color.hex,
      },
    }));
  };

  const handleFileUpload = async (type: keyof BrandingConfig['logo'], file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setConfig(prev => ({
          ...prev,
          logo: {
            ...prev.logo,
            [type]: e.target?.result as string,
          },
        }));
      };
      reader.readAsDataURL(file);

      showSnackbar(`${type} uploaded successfully`, 'success');
    } catch (error) {
      showSnackbar(`Failed to upload ${type}`, 'error');
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all branding settings?')) {
      loadBrandingConfig();
      showSnackbar('Branding configuration reset', 'success');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const ColorPickerButton: React.FC<{
    label: string;
    colorKey: string;
    color: string;
  }> = ({ label, colorKey, color }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 60,
            height: 40,
            backgroundColor: color,
            border: '1px solid #ddd',
            borderRadius: 1,
            cursor: 'pointer',
          }}
          onClick={() => setShowColorPicker(colorKey)}
        />
        <TextField
          value={color}
          size="small"
          sx={{ width: 120 }}
          onChange={(e) => {
            setConfig(prev => ({
              ...prev,
              colors: { ...prev.colors, [colorKey]: e.target.value },
            }));
          }}
        />
        {showColorPicker === colorKey && (
          <Box sx={{ position: 'absolute', zIndex: 2 }}>
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              }}
              onClick={() => setShowColorPicker(null)}
            />
            <SketchPicker
              color={color}
              onChange={(color) => handleColorChange(colorKey, color)}
            />
          </Box>
        )}
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Branding Customizer
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            onClick={handleSave}
            disabled={saving}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      <Card>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<Palette />} label="Colors" />
          <Tab icon={<ImageIcon />} label="Logos & Images" />
          <Tab icon={<TypographyIcon />} label="Typography" />
          <Tab icon={<Settings />} label="Theme Settings" />
          <Tab icon={<Code />} label="Custom CSS" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Primary Colors
              </Typography>
              <ColorPickerButton
                label="Primary Color"
                colorKey="primary"
                color={config.colors.primary}
              />
              <ColorPickerButton
                label="Secondary Color"
                colorKey="secondary"
                color={config.colors.secondary}
              />
              <ColorPickerButton
                label="Accent Color"
                colorKey="accent"
                color={config.colors.accent}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                System Colors
              </Typography>
              <ColorPickerButton
                label="Background"
                colorKey="background"
                color={config.colors.background}
              />
              <ColorPickerButton
                label="Text Color"
                colorKey="text"
                color={config.colors.text}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Status Colors
              </Typography>
              <ColorPickerButton
                label="Error Color"
                colorKey="error"
                color={config.colors.error}
              />
              <ColorPickerButton
                label="Success Color"
                colorKey="success"
                color={config.colors.success}
              />
              <ColorPickerButton
                label="Warning Color"
                colorKey="warning"
                color={config.colors.warning}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, backgroundColor: config.colors.background }}>
                <Typography variant="h6" gutterBottom sx={{ color: config.colors.text }}>
                  Preview
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="Primary" sx={{ backgroundColor: config.colors.primary, color: '#fff' }} />
                  <Chip label="Secondary" sx={{ backgroundColor: config.colors.secondary, color: '#fff' }} />
                  <Chip label="Accent" sx={{ backgroundColor: config.colors.accent, color: '#fff' }} />
                  <Chip label="Success" sx={{ backgroundColor: config.colors.success, color: '#fff' }} />
                  <Chip label="Warning" sx={{ backgroundColor: config.colors.warning, color: '#fff' }} />
                  <Chip label="Error" sx={{ backgroundColor: config.colors.error, color: '#fff' }} />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {(['main', 'icon', 'favicon', 'loading'] as const).map((type) => (
              <Grid item xs={12} sm={6} md={3} key={type}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {type.charAt(0).toUpperCase() + type.slice(1)} Logo
                    </Typography>
                    {config.logo[type] ? (
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Avatar
                          src={config.logo[type]}
                          sx={{ width: 100, height: 100, margin: '0 auto' }}
                          variant="rounded"
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          height: 100,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f5f5f5',
                          borderRadius: 1,
                          mb: 2,
                        }}
                      >
                        <ImageIcon sx={{ fontSize: 40, color: '#ccc' }} />
                      </Box>
                    )}
                    <Button
                      variant="outlined"
                      fullWidth
                      component="label"
                      startIcon={<Upload />}
                    >
                      Upload
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(type, file);
                        }}
                      />
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Font Settings
              </Typography>
              <TextField
                fullWidth
                label="Body Font Family"
                value={config.typography.fontFamily}
                onChange={(e) =>
                  setConfig(prev => ({
                    ...prev,
                    typography: { ...prev.typography, fontFamily: e.target.value },
                  }))
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Heading Font Family"
                value={config.typography.headingFontFamily}
                onChange={(e) =>
                  setConfig(prev => ({
                    ...prev,
                    typography: { ...prev.typography, headingFontFamily: e.target.value },
                  }))
                }
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Font Sizes
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Small: {config.typography.fontSize.small}px</Typography>
                <Slider
                  value={config.typography.fontSize.small}
                  onChange={(e, v) =>
                    setConfig(prev => ({
                      ...prev,
                      typography: {
                        ...prev.typography,
                        fontSize: { ...prev.typography.fontSize, small: v as number },
                      },
                    }))
                  }
                  min={8}
                  max={16}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Medium: {config.typography.fontSize.medium}px</Typography>
                <Slider
                  value={config.typography.fontSize.medium}
                  onChange={(e, v) =>
                    setConfig(prev => ({
                      ...prev,
                      typography: {
                        ...prev.typography,
                        fontSize: { ...prev.typography.fontSize, medium: v as number },
                      },
                    }))
                  }
                  min={12}
                  max={20}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Large: {config.typography.fontSize.large}px</Typography>
                <Slider
                  value={config.typography.fontSize.large}
                  onChange={(e, v) =>
                    setConfig(prev => ({
                      ...prev,
                      typography: {
                        ...prev.typography,
                        fontSize: { ...prev.typography.fontSize, large: v as number },
                      },
                    }))
                  }
                  min={14}
                  max={24}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom style={{ fontFamily: config.typography.headingFontFamily }}>
                  Typography Preview
                </Typography>
                <Typography
                  style={{
                    fontFamily: config.typography.fontFamily,
                    fontSize: config.typography.fontSize.large,
                  }}
                >
                  Large text sample
                </Typography>
                <Typography
                  style={{
                    fontFamily: config.typography.fontFamily,
                    fontSize: config.typography.fontSize.medium,
                  }}
                >
                  Medium text sample
                </Typography>
                <Typography
                  style={{
                    fontFamily: config.typography.fontFamily,
                    fontSize: config.typography.fontSize.small,
                  }}
                >
                  Small text sample
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Theme Configuration
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Theme Mode</InputLabel>
                <Select
                  value={config.theme.mode}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      theme: { ...prev.theme, mode: e.target.value as 'light' | 'dark' | 'auto' },
                    }))
                  }
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="auto">Auto</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ mt: 3 }}>
                <Typography gutterBottom>Border Radius: {config.theme.borderRadius}px</Typography>
                <Slider
                  value={config.theme.borderRadius}
                  onChange={(e, v) =>
                    setConfig(prev => ({
                      ...prev,
                      theme: { ...prev.theme, borderRadius: v as number },
                    }))
                  }
                  min={0}
                  max={20}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography gutterBottom>Spacing: {config.theme.spacing}px</Typography>
                <Slider
                  value={config.theme.spacing}
                  onChange={(e, v) =>
                    setConfig(prev => ({
                      ...prev,
                      theme: { ...prev.theme, spacing: v as number },
                    }))
                  }
                  min={4}
                  max={16}
                  step={2}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Features
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.features.customDomain}
                    onChange={(e) =>
                      setConfig(prev => ({
                        ...prev,
                        features: { ...prev.features, customDomain: e.target.checked },
                      }))
                    }
                  />
                }
                label="Custom Domain"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config.features.removeBranding}
                    onChange={(e) =>
                      setConfig(prev => ({
                        ...prev,
                        features: { ...prev.features, removeBranding: e.target.checked },
                      }))
                    }
                  />
                }
                label="Remove UpCoach Branding"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config.features.customEmailTemplates}
                    onChange={(e) =>
                      setConfig(prev => ({
                        ...prev,
                        features: { ...prev.features, customEmailTemplates: e.target.checked },
                      }))
                    }
                  />
                }
                label="Custom Email Templates"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Custom CSS
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Add custom CSS to further customize your branding. Changes will be applied globally.
              </Alert>
              <TextField
                fullWidth
                multiline
                rows={15}
                value={config.customCss}
                onChange={(e) => setConfig(prev => ({ ...prev, customCss: e.target.value }))}
                placeholder="/* Enter your custom CSS here */"
                sx={{ fontFamily: 'monospace' }}
              />
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

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

export default BrandingCustomizer;
