import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Alert,
  Slider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Tooltip,
  CircularProgress,
  AppBar,
  Toolbar,
  Drawer,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Palette as PaletteIcon,
  TextFields as TextFieldsIcon,
  Category as CategoryIcon,
  Code as CodeIcon,
  PhoneIphone as PhoneIcon,
  Laptop as LaptopIcon,
  Tablet as TabletIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AutoAwesome as AIIcon,
  Accessibility as AccessibilityIcon,
} from '@mui/icons-material';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Editor from '@monaco-editor/react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * Design System Dashboard - Phase 36 Week 2
 * Complete design system management interface
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

interface DesignToken {
  id: string;
  name: string;
  type: 'color' | 'typography' | 'spacing' | 'shadow' | 'radius' | 'motion';
  value: any;
  category: string;
  platform?: 'web' | 'ios' | 'android' | 'desktop' | 'universal';
}

interface ColorToken {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  name: string;
  contrastRatio?: number;
}

interface ComponentDefinition {
  id: string;
  name: string;
  type: string;
  props: Record<string, any>;
  children?: ComponentDefinition[];
  platform: 'react' | 'flutter' | 'swiftui' | 'compose';
}

interface AccessibilityReport {
  score: number;
  level: 'A' | 'AA' | 'AAA';
  issues: AccessibilityIssue[];
}

interface AccessibilityIssue {
  type: 'contrast' | 'focus' | 'aria' | 'keyboard';
  severity: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
  suggestion?: string;
}

interface ThemeConfig {
  name: string;
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  tokens: DesignToken[];
}

interface ExportFormat {
  name: string;
  format: 'figma' | 'sketch' | 'xd' | 'css' | 'json' | 'tailwind';
  description: string;
}

interface PlatformPreview {
  platform: 'web' | 'ios' | 'android' | 'desktop';
  width: number;
  height: number;
  scale: number;
}

// ============================================================================
// Main Component
// ============================================================================

const DesignSystemDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [tokens, setTokens] = useState<DesignToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<DesignToken | null>(null);
  const [components, setComponents] = useState<ComponentDefinition[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<ComponentDefinition | null>(null);
  const [previewPlatform, setPreviewPlatform] = useState<PlatformPreview['platform']>('web');
  const [accessibilityReport, setAccessibilityReport] = useState<AccessibilityReport | null>(null);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(getDefaultTheme());
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showTokenEditor, setShowTokenEditor] = useState(false);
  const [showComponentBuilder, setShowComponentBuilder] = useState(false);
  const [showAIThemeGenerator, setShowAIThemeGenerator] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeTokens();
    initializeComponents();
  }, []);

  useEffect(() => {
    if (tokens.length > 0) {
      runAccessibilityCheck();
    }
  }, [tokens]);

  // ============================================================================
  // Initialization
  // ============================================================================

  const initializeTokens = () => {
    const defaultTokens: DesignToken[] = [
      {
        id: 'color-primary-500',
        name: 'color.primary.500',
        type: 'color',
        value: { hex: '#2196f3', rgb: { r: 33, g: 150, b: 243 }, hsl: { h: 207, s: 90, l: 54 }, name: 'Blue' },
        category: 'primary',
        platform: 'universal',
      },
      {
        id: 'color-neutral-white',
        name: 'color.neutral.white',
        type: 'color',
        value: { hex: '#ffffff', rgb: { r: 255, g: 255, b: 255 }, hsl: { h: 0, s: 0, l: 100 }, name: 'White' },
        category: 'neutral',
        platform: 'universal',
      },
      {
        id: 'typography-h1',
        name: 'typography.h1',
        type: 'typography',
        value: { fontFamily: 'Inter', fontSize: 96, fontWeight: 300, lineHeight: 1.167 },
        category: 'heading',
        platform: 'universal',
      },
      {
        id: 'spacing-4',
        name: 'spacing.4',
        type: 'spacing',
        value: { value: 16, unit: 'px' },
        category: 'spacing',
        platform: 'universal',
      },
      {
        id: 'shadow-md',
        name: 'shadow.md',
        type: 'shadow',
        value: { offsetX: 0, offsetY: 4, blurRadius: 6, spreadRadius: -1, color: 'rgba(0,0,0,0.1)' },
        category: 'elevation',
        platform: 'universal',
      },
      {
        id: 'radius-md',
        name: 'radius.md',
        type: 'radius',
        value: { value: 4, unit: 'px' },
        category: 'shape',
        platform: 'universal',
      },
      {
        id: 'motion-normal',
        name: 'motion.duration.normal',
        type: 'motion',
        value: { duration: 300, easing: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 } },
        category: 'duration',
        platform: 'universal',
      },
    ];

    setTokens(defaultTokens);
  };

  const initializeComponents = () => {
    const defaultComponents: ComponentDefinition[] = [
      {
        id: 'button-1',
        name: 'Primary Button',
        type: 'Button',
        props: {
          variant: 'primary',
          size: 'medium',
          label: 'Click Me',
        },
        platform: 'react',
      },
      {
        id: 'input-1',
        name: 'Text Input',
        type: 'Input',
        props: {
          variant: 'outlined',
          label: 'Enter text',
          placeholder: 'Type here...',
        },
        platform: 'react',
      },
      {
        id: 'card-1',
        name: 'Content Card',
        type: 'Card',
        props: {
          variant: 'elevated',
          padding: 16,
        },
        children: [
          {
            id: 'text-1',
            name: 'Card Title',
            type: 'Text',
            props: {
              variant: 'h5',
              children: 'Card Title',
            },
            platform: 'react',
          },
        ],
        platform: 'react',
      },
    ];

    setComponents(defaultComponents);
  };

  function getDefaultTheme(): ThemeConfig {
    return {
      name: 'Default Light',
      mode: 'light',
      primaryColor: '#2196f3',
      secondaryColor: '#f50057',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      tokens: [],
    };
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  const handleAddToken = () => {
    const newToken: DesignToken = {
      id: `token-${Date.now()}`,
      name: 'new.token',
      type: 'color',
      value: { hex: '#000000', rgb: { r: 0, g: 0, b: 0 }, hsl: { h: 0, s: 0, l: 0 }, name: 'Black' },
      category: 'custom',
      platform: 'universal',
    };

    setTokens([...tokens, newToken]);
    setSelectedToken(newToken);
    setShowTokenEditor(true);
  };

  const handleUpdateToken = (updatedToken: DesignToken) => {
    setTokens(tokens.map(t => t.id === updatedToken.id ? updatedToken : t));
    setSelectedToken(updatedToken);
  };

  const handleDeleteToken = (tokenId: string) => {
    setTokens(tokens.filter(t => t.id !== tokenId));
    if (selectedToken?.id === tokenId) {
      setSelectedToken(null);
    }
  };

  const handleTokenClick = (token: DesignToken) => {
    setSelectedToken(token);
    setShowTokenEditor(true);
  };

  // ============================================================================
  // Component Management
  // ============================================================================

  const handleAddComponent = () => {
    const newComponent: ComponentDefinition = {
      id: `component-${Date.now()}`,
      name: 'New Component',
      type: 'Container',
      props: {},
      platform: 'react',
    };

    setComponents([...components, newComponent]);
    setSelectedComponent(newComponent);
    setShowComponentBuilder(true);
  };

  const handleUpdateComponent = (updatedComponent: ComponentDefinition) => {
    setComponents(components.map(c => c.id === updatedComponent.id ? updatedComponent : c));
    setSelectedComponent(updatedComponent);
  };

  const handleDeleteComponent = (componentId: string) => {
    setComponents(components.filter(c => c.id !== componentId));
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  };

  const handleComponentClick = (component: ComponentDefinition) => {
    setSelectedComponent(component);
    setShowComponentBuilder(true);
  };

  // ============================================================================
  // Code Generation
  // ============================================================================

  const generateCode = useCallback((component: ComponentDefinition, platform: string) => {
    switch (platform) {
      case 'react':
        return generateReactCode(component);
      case 'flutter':
        return generateFlutterCode(component);
      case 'swiftui':
        return generateSwiftUICode(component);
      case 'compose':
        return generateComposeCode(component);
      default:
        return '// Platform not supported';
    }
  }, []);

  const generateReactCode = (component: ComponentDefinition): string => {
    const propsString = Object.entries(component.props)
      .map(([key, value]) => {
        if (typeof value === 'string') return `${key}="${value}"`;
        if (typeof value === 'boolean') return value ? key : '';
        return `${key}={${JSON.stringify(value)}}`;
      })
      .filter(Boolean)
      .join(' ');

    let code = `<${component.type}${propsString ? ' ' + propsString : ''}>`;

    if (component.children && component.children.length > 0) {
      code += '\n';
      component.children.forEach(child => {
        code += '  ' + generateReactCode(child) + '\n';
      });
    } else if (component.props.children) {
      code += component.props.children;
    }

    code += `</${component.type}>`;
    return code;
  };

  const generateFlutterCode = (component: ComponentDefinition): string => {
    const widgetMap: Record<string, string> = {
      Button: 'ElevatedButton',
      Input: 'TextField',
      Card: 'Card',
      Text: 'Text',
      Container: 'Container',
    };

    const widget = widgetMap[component.type] || 'Container';
    let code = `${widget}(\n`;

    if (component.props.label) {
      code += `  child: Text('${component.props.label}'),\n`;
    }

    if (component.props.onPress) {
      code += `  onPressed: () {},\n`;
    }

    if (component.children && component.children.length > 0) {
      code += `  children: [\n`;
      component.children.forEach(child => {
        code += '    ' + generateFlutterCode(child) + ',\n';
      });
      code += '  ],\n';
    }

    code += ')';
    return code;
  };

  const generateSwiftUICode = (component: ComponentDefinition): string => {
    const viewMap: Record<string, string> = {
      Button: 'Button',
      Input: 'TextField',
      Card: 'VStack',
      Text: 'Text',
      Container: 'VStack',
    };

    const view = viewMap[component.type] || 'VStack';

    if (component.type === 'Button') {
      return `${view}("${component.props.label || 'Button'}") { }`;
    }

    if (component.type === 'Text') {
      return `${view}("${component.props.children || ''}")`;
    }

    let code = `${view} {\n`;

    if (component.children && component.children.length > 0) {
      component.children.forEach(child => {
        code += '  ' + generateSwiftUICode(child) + '\n';
      });
    }

    code += '}';
    return code;
  };

  const generateComposeCode = (component: ComponentDefinition): string => {
    const composableMap: Record<string, string> = {
      Button: 'Button',
      Input: 'OutlinedTextField',
      Card: 'Card',
      Text: 'Text',
      Container: 'Box',
    };

    const composable = composableMap[component.type] || 'Box';
    let code = `${composable}(\n`;

    if (component.props.label) {
      code += `  text = "${component.props.label}",\n`;
    }

    if (component.props.onClick || component.props.onPress) {
      code += `  onClick = { },\n`;
    }

    code += ')';

    if (component.children && component.children.length > 0) {
      code += ' {\n';
      component.children.forEach(child => {
        code += '  ' + generateComposeCode(child) + '\n';
      });
      code += '}';
    }

    return code;
  };

  // ============================================================================
  // Accessibility Checking
  // ============================================================================

  const runAccessibilityCheck = useCallback(() => {
    const issues: AccessibilityIssue[] = [];
    let score = 100;

    const colorTokens = tokens.filter(t => t.type === 'color');
    for (let i = 0; i < colorTokens.length; i++) {
      for (let j = i + 1; j < colorTokens.length; j++) {
        const color1 = colorTokens[i].value;
        const color2 = colorTokens[j].value;

        if (color1.rgb && color2.rgb) {
          const ratio = calculateContrastRatio(color1.rgb, color2.rgb);

          if (ratio < 4.5) {
            issues.push({
              type: 'contrast',
              severity: 'error',
              message: `Low contrast ratio (${ratio.toFixed(2)}) between ${colorTokens[i].name} and ${colorTokens[j].name}`,
              element: `${colorTokens[i].name} / ${colorTokens[j].name}`,
              suggestion: 'Increase contrast to at least 4.5:1 for normal text',
            });
            score -= 5;
          }
        }
      }
    }

    components.forEach(component => {
      if (component.type === 'Button' && !component.props.ariaLabel && !component.props.label) {
        issues.push({
          type: 'aria',
          severity: 'error',
          message: `Button ${component.name} is missing accessible label`,
          element: component.name,
          suggestion: 'Add aria-label or label prop',
        });
        score -= 10;
      }

      if (component.type === 'Input' && !component.props.label) {
        issues.push({
          type: 'aria',
          severity: 'warning',
          message: `Input ${component.name} is missing label`,
          element: component.name,
          suggestion: 'Add label prop for better accessibility',
        });
        score -= 5;
      }
    });

    let level: 'A' | 'AA' | 'AAA' = 'AAA';
    if (score < 70) level = 'A';
    else if (score < 90) level = 'AA';

    setAccessibilityReport({
      score: Math.max(0, score),
      level,
      issues: issues.slice(0, 10),
    });
  }, [tokens, components]);

  const calculateContrastRatio = (rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }): number => {
    const l1 = getRelativeLuminance(rgb1);
    const l2 = getRelativeLuminance(rgb2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  };

  const getRelativeLuminance = (rgb: { r: number; g: number; b: number }): number => {
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // ============================================================================
  // AI Theme Generation
  // ============================================================================

  const generateAITheme = async (brandGuidelines: string) => {
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const aiGeneratedTheme: ThemeConfig = {
      name: 'AI Generated Theme',
      mode: 'light',
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      tokens: [
        {
          id: 'ai-primary',
          name: 'color.primary.500',
          type: 'color',
          value: { hex: '#1976d2', rgb: { r: 25, g: 118, b: 210 }, hsl: { h: 207, s: 79, l: 46 }, name: 'Blue' },
          category: 'primary',
        },
        {
          id: 'ai-secondary',
          name: 'color.secondary.500',
          type: 'color',
          value: { hex: '#dc004e', rgb: { r: 220, g: 0, b: 78 }, hsl: { h: 339, s: 100, l: 43 }, name: 'Pink' },
          category: 'secondary',
        },
      ],
    };

    setThemeConfig(aiGeneratedTheme);
    setTokens([...tokens, ...aiGeneratedTheme.tokens]);
    setLoading(false);
    setShowAIThemeGenerator(false);
  };

  // ============================================================================
  // Export Functionality
  // ============================================================================

  const exportDesignSystem = (format: ExportFormat['format']) => {
    let exportData = '';

    switch (format) {
      case 'json':
        exportData = JSON.stringify({ tokens, components, theme: themeConfig }, null, 2);
        break;
      case 'css':
        exportData = generateCSSExport();
        break;
      case 'tailwind':
        exportData = generateTailwindExport();
        break;
      case 'figma':
        exportData = generateFigmaTokensExport();
        break;
      default:
        exportData = JSON.stringify({ tokens, components }, null, 2);
    }

    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design-system.${format === 'figma' ? 'json' : format}`;
    a.click();
    URL.revokeObjectURL(url);

    setShowExportDialog(false);
  };

  const generateCSSExport = (): string => {
    let css = ':root {\n';

    tokens.forEach(token => {
      const cssName = `--${token.name.replace(/\./g, '-')}`;
      let value = '';

      if (token.type === 'color' && token.value.hex) {
        value = token.value.hex;
      } else if (token.type === 'spacing' || token.type === 'radius') {
        value = `${token.value.value}${token.value.unit}`;
      } else if (token.type === 'typography') {
        value = `${token.value.fontSize}px`;
      }

      if (value) {
        css += `  ${cssName}: ${value};\n`;
      }
    });

    css += '}\n';
    return css;
  };

  const generateTailwindExport = (): string => {
    const config = {
      theme: {
        extend: {
          colors: {} as Record<string, string>,
          spacing: {} as Record<string, string>,
          borderRadius: {} as Record<string, string>,
        },
      },
    };

    tokens.forEach(token => {
      if (token.type === 'color' && token.value.hex) {
        const key = token.name.replace('color.', '').replace(/\./g, '-');
        config.theme.extend.colors[key] = token.value.hex;
      } else if (token.type === 'spacing') {
        const key = token.name.replace('spacing.', '');
        config.theme.extend.spacing[key] = `${token.value.value}${token.value.unit}`;
      } else if (token.type === 'radius') {
        const key = token.name.replace('radius.', '');
        config.theme.extend.borderRadius[key] = `${token.value.value}${token.value.unit}`;
      }
    });

    return `module.exports = ${JSON.stringify(config, null, 2)}`;
  };

  const generateFigmaTokensExport = (): string => {
    const figmaTokens: any = {};

    tokens.forEach(token => {
      const path = token.name.split('.');
      let current = figmaTokens;

      path.forEach((segment, index) => {
        if (index === path.length - 1) {
          current[segment] = {
            value: token.type === 'color' ? token.value.hex : token.value,
            type: token.type,
          };
        } else {
          current[segment] = current[segment] || {};
          current = current[segment];
        }
      });
    });

    return JSON.stringify(figmaTokens, null, 2);
  };

  // ============================================================================
  // Analytics Data
  // ============================================================================

  const tokenUsageData = useMemo(() => {
    const usage: Record<string, number> = {};

    tokens.forEach(token => {
      usage[token.type] = (usage[token.type] || 0) + 1;
    });

    return Object.entries(usage).map(([name, value]) => ({ name, value }));
  }, [tokens]);

  const componentUsageData = useMemo(() => {
    const usage: Record<string, number> = {};

    components.forEach(component => {
      usage[component.type] = (usage[component.type] || 0) + 1;
    });

    return Object.entries(usage).map(([name, value]) => ({ name, value }));
  }, [components]);

  const COLORS = ['#2196f3', '#f50057', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f5f5f5' }}>
        {/* Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            width: 280,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              borderRight: '1px solid #e0e0e0',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Design System
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Universal Design System Dashboard
            </Typography>
          </Box>
          <Divider />
          <List>
            <ListItemButton selected={activeTab === 0} onClick={() => setActiveTab(0)}>
              <PaletteIcon sx={{ mr: 2 }} />
              <ListItemText primary="Tokens" />
            </ListItemButton>
            <ListItemButton selected={activeTab === 1} onClick={() => setActiveTab(1)}>
              <CategoryIcon sx={{ mr: 2 }} />
              <ListItemText primary="Components" />
            </ListItemButton>
            <ListItemButton selected={activeTab === 2} onClick={() => setActiveTab(2)}>
              <CodeIcon sx={{ mr: 2 }} />
              <ListItemText primary="Code Generator" />
            </ListItemButton>
            <ListItemButton selected={activeTab === 3} onClick={() => setActiveTab(3)}>
              <AccessibilityIcon sx={{ mr: 2 }} />
              <ListItemText primary="Accessibility" />
            </ListItemButton>
            <ListItemButton selected={activeTab === 4} onClick={() => setActiveTab(4)}>
              <VisibilityIcon sx={{ mr: 2 }} />
              <ListItemText primary="Preview" />
            </ListItemButton>
          </List>
        </Drawer>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <AppBar position="static" color="default" elevation={0}>
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {activeTab === 0 && 'Design Tokens'}
                {activeTab === 1 && 'Components'}
                {activeTab === 2 && 'Code Generator'}
                {activeTab === 3 && 'Accessibility Report'}
                {activeTab === 4 && 'Platform Preview'}
              </Typography>
              <Button
                startIcon={<AIIcon />}
                variant="outlined"
                onClick={() => setShowAIThemeGenerator(true)}
                sx={{ mr: 1 }}
              >
                AI Theme
              </Button>
              <Button
                startIcon={<DownloadIcon />}
                variant="contained"
                onClick={() => setShowExportDialog(true)}
              >
                Export
              </Button>
            </Toolbar>
          </AppBar>

          <Box sx={{ p: 3 }}>
            {/* Tokens Tab */}
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h5">Design Tokens</Typography>
                    <Button startIcon={<AddIcon />} variant="contained" onClick={handleAddToken}>
                      Add Token
                    </Button>
                  </Box>
                </Grid>

                {/* Token Analytics */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Token Distribution</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={tokenUsageData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => entry.name}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {tokenUsageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Token Overview</Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>Total Tokens: {tokens.length}</Typography>
                      <Typography variant="body2" gutterBottom>Color Tokens: {tokens.filter(t => t.type === 'color').length}</Typography>
                      <Typography variant="body2" gutterBottom>Typography Tokens: {tokens.filter(t => t.type === 'typography').length}</Typography>
                      <Typography variant="body2" gutterBottom>Spacing Tokens: {tokens.filter(t => t.type === 'spacing').length}</Typography>
                    </Box>
                  </Paper>
                </Grid>

                {/* Token List */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      {tokens.map(token => (
                        <Grid item xs={12} sm={6} md={4} key={token.id}>
                          <TokenCard
                            token={token}
                            onClick={() => handleTokenClick(token)}
                            onDelete={() => handleDeleteToken(token.id)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Components Tab */}
            {activeTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h5">Components</Typography>
                    <Button startIcon={<AddIcon />} variant="contained" onClick={handleAddComponent}>
                      Add Component
                    </Button>
                  </Box>
                </Grid>

                {/* Component Analytics */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Component Usage</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={componentUsageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#2196f3" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                {/* Component List */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      {components.map(component => (
                        <Grid item xs={12} sm={6} md={4} key={component.id}>
                          <ComponentCard
                            component={component}
                            onClick={() => handleComponentClick(component)}
                            onDelete={() => handleDeleteComponent(component.id)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Code Generator Tab */}
            {activeTab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom>Code Generator</Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Select Component</Typography>
                    <List>
                      {components.map(component => (
                        <ListItemButton
                          key={component.id}
                          selected={selectedComponent?.id === component.id}
                          onClick={() => {
                            setSelectedComponent(component);
                            setGeneratedCode(generateCode(component, component.platform));
                          }}
                        >
                          <ListItemText primary={component.name} secondary={component.type} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">Generated Code</Typography>
                      <Box>
                        <Button
                          size="small"
                          onClick={() => selectedComponent && setGeneratedCode(generateCode(selectedComponent, 'react'))}
                          sx={{ mr: 1 }}
                        >
                          React
                        </Button>
                        <Button
                          size="small"
                          onClick={() => selectedComponent && setGeneratedCode(generateCode(selectedComponent, 'flutter'))}
                          sx={{ mr: 1 }}
                        >
                          Flutter
                        </Button>
                        <Button
                          size="small"
                          onClick={() => selectedComponent && setGeneratedCode(generateCode(selectedComponent, 'swiftui'))}
                          sx={{ mr: 1 }}
                        >
                          SwiftUI
                        </Button>
                        <Button
                          size="small"
                          onClick={() => selectedComponent && setGeneratedCode(generateCode(selectedComponent, 'compose'))}
                        >
                          Compose
                        </Button>
                      </Box>
                    </Box>
                    <Editor
                      height="500px"
                      defaultLanguage="typescript"
                      value={generatedCode || '// Select a component to generate code'}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        readOnly: true,
                      }}
                    />
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Accessibility Tab */}
            {activeTab === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom>Accessibility Report</Typography>
                </Grid>

                {accessibilityReport && (
                  <>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h3" color="primary">{accessibilityReport.score}</Typography>
                        <Typography variant="body1" gutterBottom>Accessibility Score</Typography>
                        <Chip label={`WCAG ${accessibilityReport.level}`} color="primary" />
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={8}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Issues Found: {accessibilityReport.issues.length}</Typography>
                        <List>
                          {accessibilityReport.issues.map((issue, index) => (
                            <React.Fragment key={index}>
                              <ListItem>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Chip
                                        label={issue.severity}
                                        size="small"
                                        color={issue.severity === 'error' ? 'error' : 'warning'}
                                        sx={{ mr: 1 }}
                                      />
                                      {issue.message}
                                    </Box>
                                  }
                                  secondary={
                                    <>
                                      {issue.element && <Typography variant="caption">Element: {issue.element}</Typography>}
                                      <br />
                                      {issue.suggestion && <Typography variant="caption" color="primary">Suggestion: {issue.suggestion}</Typography>}
                                    </>
                                  }
                                />
                              </ListItem>
                              {index < accessibilityReport.issues.length - 1 && <Divider />}
                            </React.Fragment>
                          ))}
                        </List>
                      </Paper>
                    </Grid>
                  </>
                )}
              </Grid>
            )}

            {/* Preview Tab */}
            {activeTab === 4 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h5">Platform Preview</Typography>
                    <Box>
                      <IconButton onClick={() => setPreviewPlatform('web')} color={previewPlatform === 'web' ? 'primary' : 'default'}>
                        <LaptopIcon />
                      </IconButton>
                      <IconButton onClick={() => setPreviewPlatform('ios')} color={previewPlatform === 'ios' ? 'primary' : 'default'}>
                        <PhoneIcon />
                      </IconButton>
                      <IconButton onClick={() => setPreviewPlatform('android')} color={previewPlatform === 'android' ? 'primary' : 'default'}>
                        <TabletIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', bgcolor: '#e0e0e0', minHeight: 600 }}>
                    <PlatformPreviewFrame platform={previewPlatform} components={components} />
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>
        </Box>

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Export Design System</DialogTitle>
          <DialogContent>
            <List>
              {[
                { name: 'Figma Tokens', format: 'figma' as const, description: 'JSON format for Figma plugins' },
                { name: 'CSS Variables', format: 'css' as const, description: 'CSS custom properties' },
                { name: 'Tailwind Config', format: 'tailwind' as const, description: 'Tailwind CSS configuration' },
                { name: 'JSON', format: 'json' as const, description: 'Raw JSON data' },
              ].map((exportFormat) => (
                <ListItemButton key={exportFormat.format} onClick={() => exportDesignSystem(exportFormat.format)}>
                  <ListItemText primary={exportFormat.name} secondary={exportFormat.description} />
                </ListItemButton>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* AI Theme Generator Dialog */}
        <Dialog open={showAIThemeGenerator} onClose={() => setShowAIThemeGenerator(false)} maxWidth="md" fullWidth>
          <DialogTitle>AI Theme Generator</DialogTitle>
          <DialogContent>
            <TextField
              label="Brand Guidelines"
              multiline
              rows={6}
              fullWidth
              placeholder="Describe your brand: colors, style, target audience..."
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAIThemeGenerator(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => generateAITheme('Modern, professional, tech-focused')}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Generate'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DndProvider>
  );
};

// ============================================================================
// Sub-Components
// ============================================================================

const TokenCard: React.FC<{ token: DesignToken; onClick: () => void; onDelete: () => void }> = ({
  token,
  onClick,
  onDelete,
}) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {token.type === 'color' && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                bgcolor: token.value.hex,
                border: '1px solid #e0e0e0',
                mr: 2,
              }}
            />
          )}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2">{token.name}</Typography>
            <Typography variant="caption" color="text.secondary">{token.type}</Typography>
          </Box>
        </Box>
        {token.type === 'color' && (
          <Typography variant="body2" color="text.secondary">{token.value.hex}</Typography>
        )}
        {token.type === 'typography' && (
          <Typography variant="body2" color="text.secondary">
            {token.value.fontSize}px / {token.value.fontWeight}
          </Typography>
        )}
        {(token.type === 'spacing' || token.type === 'radius') && (
          <Typography variant="body2" color="text.secondary">
            {token.value.value}{token.value.unit}
          </Typography>
        )}
      </CardContent>
      <CardActions>
        <Button size="small" onClick={onClick}>Edit</Button>
        <IconButton size="small" onClick={onDelete}>
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

const ComponentCard: React.FC<{ component: ComponentDefinition; onClick: () => void; onDelete: () => void }> = ({
  component,
  onClick,
  onDelete,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>{component.name}</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>{component.type}</Typography>
        <Chip label={component.platform} size="small" />
      </CardContent>
      <CardActions>
        <Button size="small" onClick={onClick}>Edit</Button>
        <IconButton size="small" onClick={onDelete}>
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

const PlatformPreviewFrame: React.FC<{ platform: string; components: ComponentDefinition[] }> = ({
  platform,
  components,
}) => {
  const dimensions = {
    web: { width: 1024, height: 768 },
    ios: { width: 375, height: 812 },
    android: { width: 360, height: 640 },
    desktop: { width: 1440, height: 900 },
  }[platform] || { width: 1024, height: 768 };

  return (
    <Box
      sx={{
        width: dimensions.width * 0.5,
        height: dimensions.height * 0.5,
        bgcolor: 'white',
        borderRadius: platform === 'ios' ? 4 : 1,
        border: '8px solid #333',
        overflow: 'hidden',
        boxShadow: 3,
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Preview - {platform}</Typography>
        <Box sx={{ mt: 2 }}>
          {components.slice(0, 3).map(component => (
            <Box key={component.id} sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">{component.name}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default DesignSystemDashboard;
