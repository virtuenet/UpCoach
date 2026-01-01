import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  CircularProgress,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import {
  Speed as SpeedIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Code as CodeIcon,
  CloudUpload as CloudIcon,
  NetworkCheck as NetworkIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  LightbulbOutlined as LightbulbIcon,
  BugReport as BugIcon,
  CloudDone as CloudDoneIcon,
} from '@mui/icons-material';
import useSWR from 'swr';
import Editor from '@monaco-editor/react';
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface OptimizationScore {
  overall: number;
  assets: number;
  caching: number;
  network: number;
  database: number;
  edge: number;
  trend: number[];
  lastUpdated: Date;
}

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'javascript' | 'css' | 'font';
  size: number;
  optimizedSize: number;
  status: 'optimized' | 'pending' | 'failed';
  compressionRatio: number;
  lastOptimized?: Date;
  url: string;
}

interface EdgeFunction {
  id: string;
  name: string;
  platform: string;
  status: 'active' | 'deploying' | 'failed' | 'inactive';
  version: number;
  deployedAt: Date;
  metrics: {
    requestCount: number;
    errorRate: number;
    executionTimeP95: number;
  };
}

interface NetworkMetric {
  timestamp: Date;
  requestCount: number;
  avgLatency: number;
  cacheHitRatio: number;
  bandwidthSaved: number;
  http2Percentage: number;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: number;
  difficulty: 'low' | 'medium' | 'high';
  category: string;
  estimatedImprovement: string;
  autoApplicable: boolean;
  applied: boolean;
}

interface ABTest {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'paused';
  variants: Array<{
    name: string;
    traffic: number;
    avgLoadTime: number;
    conversionRate: number;
  }>;
  winner?: string;
  confidence: number;
  startedAt: Date;
}

interface WebVitals {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index} style={{ paddingTop: 24 }}>
      {value === index && children}
    </div>
  );
};

const OptimizationDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedAssetType, setSelectedAssetType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [edgeFunctionCode, setEdgeFunctionCode] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [webVitals, setWebVitals] = useState<WebVitals>({
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0,
  });

  const { data: optimizationScore, mutate: refreshScore } = useSWR<OptimizationScore>(
    '/api/optimization/score',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: assets, mutate: refreshAssets } = useSWR<Asset[]>(
    '/api/optimization/assets',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: edgeFunctions, mutate: refreshEdgeFunctions } = useSWR<EdgeFunction[]>(
    '/api/edge/functions',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: networkMetrics } = useSWR<NetworkMetric[]>(
    '/api/optimization/network-metrics',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: recommendations, mutate: refreshRecommendations } = useSWR<Recommendation[]>(
    '/api/optimization/recommendations',
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: abTests } = useSWR<ABTest[]>(
    '/api/optimization/ab-tests',
    fetcher,
    { refreshInterval: 5000 }
  );

  useEffect(() => {
    getLCP((metric) => {
      setWebVitals((prev) => ({ ...prev, lcp: metric.value }));
    });

    getFID((metric) => {
      setWebVitals((prev) => ({ ...prev, fid: metric.value }));
    });

    getCLS((metric) => {
      setWebVitals((prev) => ({ ...prev, cls: metric.value }));
    });

    getFCP((metric) => {
      setWebVitals((prev) => ({ ...prev, fcp: metric.value }));
    });

    getTTFB((metric) => {
      setWebVitals((prev) => ({ ...prev, ttfb: metric.value }));
    });
  }, []);

  const filteredAssets = useMemo(() => {
    if (!assets) return [];

    return assets.filter((asset) => {
      if (selectedAssetType !== 'all' && asset.type !== selectedAssetType) {
        return false;
      }
      if (selectedStatus !== 'all' && asset.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [assets, selectedAssetType, selectedStatus]);

  const handleOptimizeSelected = async () => {
    try {
      await fetch('/api/optimization/batch-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds: selectedAssets }),
      });
      setSelectedAssets([]);
      refreshAssets();
    } catch (error) {
      console.error('Optimization failed:', error);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await fetch('/api/optimization/assets/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds: selectedAssets }),
      });
      setSelectedAssets([]);
      refreshAssets();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleDeployEdgeFunction = async () => {
    try {
      await fetch('/api/edge/functions/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: edgeFunctionCode,
          platforms: selectedPlatforms,
        }),
      });
      setDeployDialogOpen(false);
      setEdgeFunctionCode('');
      setSelectedPlatforms([]);
      refreshEdgeFunctions();
    } catch (error) {
      console.error('Deployment failed:', error);
    }
  };

  const handleApplyRecommendation = async (recommendationId: string) => {
    try {
      await fetch(`/api/optimization/recommendations/${recommendationId}/apply`, {
        method: 'POST',
      });
      refreshRecommendations();
      refreshScore();
    } catch (error) {
      console.error('Failed to apply recommendation:', error);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Overall Optimization Score
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ flex: 1, mr: 2 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="100%"
                    data={[
                      {
                        name: 'Score',
                        value: optimizationScore?.overall || 0,
                        fill: getScoreColor(optimizationScore?.overall || 0),
                      },
                    ]}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </Box>
              <Box>
                <Typography variant="h2" color={getScoreColor(optimizationScore?.overall || 0)}>
                  {optimizationScore?.overall || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {getScoreLabel(optimizationScore?.overall || 0)}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Assets
                </Typography>
                <Typography variant="h6">{optimizationScore?.assets || 0}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={optimizationScore?.assets || 0}
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Caching
                </Typography>
                <Typography variant="h6">{optimizationScore?.caching || 0}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={optimizationScore?.caching || 0}
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Network
                </Typography>
                <Typography variant="h6">{optimizationScore?.network || 0}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={optimizationScore?.network || 0}
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Database
                </Typography>
                <Typography variant="h6">{optimizationScore?.database || 0}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={optimizationScore?.database || 0}
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Edge
                </Typography>
                <Typography variant="h6">{optimizationScore?.edge || 0}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={optimizationScore?.edge || 0}
                  sx={{ mt: 1 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Score Trend (Last 7 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={optimizationScore?.trend?.map((score, i) => ({
                day: `Day ${i + 1}`,
                score,
              })) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Core Web Vitals
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={2.4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    LCP (Largest Contentful Paint)
                  </Typography>
                  <Typography variant="h4" color={webVitals.lcp < 2500 ? 'success.main' : 'warning.main'}>
                    {(webVitals.lcp / 1000).toFixed(2)}s
                  </Typography>
                  <Typography variant="caption">
                    Target: &lt; 2.5s
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    FID (First Input Delay)
                  </Typography>
                  <Typography variant="h4" color={webVitals.fid < 100 ? 'success.main' : 'warning.main'}>
                    {webVitals.fid.toFixed(0)}ms
                  </Typography>
                  <Typography variant="caption">
                    Target: &lt; 100ms
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    CLS (Cumulative Layout Shift)
                  </Typography>
                  <Typography variant="h4" color={webVitals.cls < 0.1 ? 'success.main' : 'warning.main'}>
                    {webVitals.cls.toFixed(3)}
                  </Typography>
                  <Typography variant="caption">
                    Target: &lt; 0.1
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    FCP (First Contentful Paint)
                  </Typography>
                  <Typography variant="h4" color={webVitals.fcp < 1800 ? 'success.main' : 'warning.main'}>
                    {(webVitals.fcp / 1000).toFixed(2)}s
                  </Typography>
                  <Typography variant="caption">
                    Target: &lt; 1.8s
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    TTFB (Time to First Byte)
                  </Typography>
                  <Typography variant="h4" color={webVitals.ttfb < 800 ? 'success.main' : 'warning.main'}>
                    {webVitals.ttfb.toFixed(0)}ms
                  </Typography>
                  <Typography variant="caption">
                    Target: &lt; 800ms
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Wins This Week
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <TrendingUpIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Image Optimization"
                  secondary="Saved 2.3 GB in bandwidth"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <TrendingUpIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Edge Caching"
                  secondary="95% cache hit ratio"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <TrendingUpIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Code Splitting"
                  secondary="40% reduction in initial bundle"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Optimizations
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Before</TableCell>
                    <TableCell>After</TableCell>
                    <TableCell>Savings</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assets?.slice(0, 5).map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell>
                        <Chip label={asset.type} size="small" />
                      </TableCell>
                      <TableCell>{formatBytes(asset.size)}</TableCell>
                      <TableCell>{formatBytes(asset.optimizedSize)}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${asset.compressionRatio.toFixed(1)}%`}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {asset.lastOptimized
                          ? new Date(asset.lastOptimized).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderAssetsTab = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Asset Type</InputLabel>
          <Select
            value={selectedAssetType}
            onChange={(e) => setSelectedAssetType(e.target.value)}
            label="Asset Type"
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="image">Images</MenuItem>
            <MenuItem value="video">Videos</MenuItem>
            <MenuItem value="javascript">JavaScript</MenuItem>
            <MenuItem value="css">CSS</MenuItem>
            <MenuItem value="font">Fonts</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="optimized">Optimized</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        {selectedAssets.length > 0 && (
          <>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={handleOptimizeSelected}
            >
              Optimize Selected ({selectedAssets.length})
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteSelected}
            >
              Delete Selected
            </Button>
          </>
        )}

        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refreshAssets}>
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">
                Total Assets
              </Typography>
              <Typography variant="h4">{assets?.length || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">
                Optimized
              </Typography>
              <Typography variant="h4" color="success.main">
                {assets?.filter((a) => a.status === 'optimized').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">
                Total Size
              </Typography>
              <Typography variant="h4">
                {formatBytes(assets?.reduce((sum, a) => sum + a.size, 0) || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">
                Total Savings
              </Typography>
              <Typography variant="h4" color="success.main">
                {formatBytes(
                  assets?.reduce((sum, a) => sum + (a.size - a.optimizedSize), 0) || 0
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={
                            selectedAssets.length === filteredAssets.length &&
                            filteredAssets.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssets(filteredAssets.map((a) => a.id));
                            } else {
                              setSelectedAssets([]);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Original Size</TableCell>
                      <TableCell>Optimized Size</TableCell>
                      <TableCell>Savings</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell padding="checkbox">
                          <input
                            type="checkbox"
                            checked={selectedAssets.includes(asset.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssets([...selectedAssets, asset.id]);
                              } else {
                                setSelectedAssets(
                                  selectedAssets.filter((id) => id !== asset.id)
                                );
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell>
                          <Chip label={asset.type} size="small" />
                        </TableCell>
                        <TableCell>{formatBytes(asset.size)}</TableCell>
                        <TableCell>{formatBytes(asset.optimizedSize)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {formatBytes(asset.size - asset.optimizedSize)}
                            </Typography>
                            <Chip
                              label={`${asset.compressionRatio.toFixed(1)}%`}
                              color={asset.compressionRatio > 30 ? 'success' : 'default'}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          {asset.status === 'optimized' && (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Optimized"
                              color="success"
                              size="small"
                            />
                          )}
                          {asset.status === 'pending' && (
                            <Chip
                              icon={<CircularProgress size={16} />}
                              label="Pending"
                              color="warning"
                              size="small"
                            />
                          )}
                          {asset.status === 'failed' && (
                            <Chip
                              icon={<ErrorIcon />}
                              label="Failed"
                              color="error"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <PlayIcon />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderEdgeFunctionsTab = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<CloudIcon />}
          onClick={() => setDeployDialogOpen(true)}
        >
          Deploy New Function
        </Button>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refreshEdgeFunctions}>
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        {edgeFunctions?.map((func) => (
          <Grid item xs={12} md={6} key={func.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">{func.name}</Typography>
                  {func.status === 'active' && (
                    <Chip icon={<CheckCircleIcon />} label="Active" color="success" size="small" />
                  )}
                  {func.status === 'deploying' && (
                    <Chip icon={<CircularProgress size={16} />} label="Deploying" color="warning" size="small" />
                  )}
                  {func.status === 'failed' && (
                    <Chip icon={<ErrorIcon />} label="Failed" color="error" size="small" />
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Platform
                    </Typography>
                    <Typography variant="body1">{func.platform}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Version
                    </Typography>
                    <Typography variant="body1">v{func.version}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Request Count
                    </Typography>
                    <Typography variant="body1">
                      {func.metrics.requestCount.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Error Rate
                    </Typography>
                    <Typography variant="body1" color={func.metrics.errorRate > 0.01 ? 'error' : 'success.main'}>
                      {(func.metrics.errorRate * 100).toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      P95 Latency
                    </Typography>
                    <Typography variant="body1">
                      {func.metrics.executionTimeP95.toFixed(0)}ms
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Deployed
                    </Typography>
                    <Typography variant="body1">
                      {new Date(func.deployedAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined">
                    View Logs
                  </Button>
                  <Button size="small" variant="outlined" color="warning">
                    Rollback
                  </Button>
                  <Button size="small" variant="outlined" color="error">
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={deployDialogOpen} onClose={() => setDeployDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Deploy Edge Function</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Select Platforms
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['cloudflare', 'aws-lambda-edge', 'vercel', 'fastly'].map((platform) => (
                <Chip
                  key={platform}
                  label={platform}
                  onClick={() => {
                    if (selectedPlatforms.includes(platform)) {
                      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
                    } else {
                      setSelectedPlatforms([...selectedPlatforms, platform]);
                    }
                  }}
                  color={selectedPlatforms.includes(platform) ? 'primary' : 'default'}
                />
              ))}
            </Box>
          </Box>

          <Typography variant="body2" gutterBottom>
            Function Code
          </Typography>
          <Editor
            height="400px"
            defaultLanguage="javascript"
            value={edgeFunctionCode}
            onChange={(value) => setEdgeFunctionCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeployDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleDeployEdgeFunction}
            disabled={!edgeFunctionCode || selectedPlatforms.length === 0}
          >
            Deploy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  const renderNetworkTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">
              HTTP/2 Usage
            </Typography>
            <Typography variant="h4">
              {networkMetrics?.[networkMetrics.length - 1]?.http2Percentage.toFixed(0) || 0}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">
              Avg Latency
            </Typography>
            <Typography variant="h4">
              {networkMetrics?.[networkMetrics.length - 1]?.avgLatency.toFixed(0) || 0}ms
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">
              Cache Hit Ratio
            </Typography>
            <Typography variant="h4" color="success.main">
              {((networkMetrics?.[networkMetrics.length - 1]?.cacheHitRatio || 0) * 100).toFixed(0)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">
              Bandwidth Saved
            </Typography>
            <Typography variant="h4">
              {formatBytes(networkMetrics?.[networkMetrics.length - 1]?.bandwidthSaved || 0)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Network Performance Timeline
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={networkMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="avgLatency"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Latency (ms)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Request Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={networkMetrics?.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="requestCount" fill="#82ca9d" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cache Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={networkMetrics?.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cacheHitRatio"
                  stroke="#ff7300"
                  name="Cache Hit Ratio"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderRecommendationsTab = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        AI-powered optimization recommendations ranked by impact and ROI
      </Alert>

      <Grid container spacing={2}>
        {recommendations?.sort((a, b) => b.impact - a.impact).map((rec) => (
          <Grid item xs={12} key={rec.id}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  <LightbulbIcon color={rec.applied ? 'success' : 'warning'} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{rec.title}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {rec.category}
                    </Typography>
                  </Box>
                  <Chip
                    label={`Impact: ${rec.impact}/10`}
                    color={rec.impact >= 7 ? 'success' : rec.impact >= 4 ? 'warning' : 'default'}
                  />
                  <Chip
                    label={rec.difficulty}
                    color={rec.difficulty === 'low' ? 'success' : rec.difficulty === 'medium' ? 'warning' : 'error'}
                  />
                  {rec.applied && <CheckCircleIcon color="success" />}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="body1" paragraph>
                    {rec.description}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Estimated Improvement: {rec.estimatedImprovement}
                  </Typography>
                  {rec.autoApplicable && !rec.applied && (
                    <Button
                      variant="contained"
                      onClick={() => handleApplyRecommendation(rec.id)}
                    >
                      Apply Automatically
                    </Button>
                  )}
                  {!rec.autoApplicable && (
                    <Alert severity="info">
                      This optimization requires manual implementation
                    </Alert>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderABTestsTab = () => (
    <Grid container spacing={3}>
      {abTests?.map((test) => (
        <Grid item xs={12} md={6} key={test.id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{test.name}</Typography>
                <Chip
                  label={test.status}
                  color={
                    test.status === 'running'
                      ? 'primary'
                      : test.status === 'completed'
                      ? 'success'
                      : 'default'
                  }
                />
              </Box>

              <Typography variant="body2" color="textSecondary" gutterBottom>
                Statistical Confidence: {(test.confidence * 100).toFixed(1)}%
              </Typography>
              <LinearProgress variant="determinate" value={test.confidence * 100} sx={{ mb: 2 }} />

              {test.winner && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Winner: {test.winner}
                </Alert>
              )}

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Variant</TableCell>
                      <TableCell>Traffic</TableCell>
                      <TableCell>Load Time</TableCell>
                      <TableCell>Conv. Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {test.variants.map((variant) => (
                      <TableRow key={variant.name}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={variant.name === test.winner ? 'bold' : 'normal'}>
                            {variant.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{variant.traffic}%</TableCell>
                        <TableCell>{variant.avgLoadTime.toFixed(0)}ms</TableCell>
                        <TableCell>{(variant.conversionRate * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                {test.status === 'running' && (
                  <Button size="small" variant="outlined" color="warning">
                    Pause Test
                  </Button>
                )}
                {test.status === 'completed' && test.winner && (
                  <Button size="small" variant="contained" color="success">
                    Deploy Winner
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Optimization Dashboard</Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refreshScore}>
          Refresh All
        </Button>
      </Box>

      <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
        <Tab label="Overview" />
        <Tab label="Assets" />
        <Tab label="Edge Functions" />
        <Tab label="Network" />
        <Tab label="Recommendations" />
        <Tab label="A/B Tests" />
      </Tabs>

      <TabPanel value={currentTab} index={0}>
        {renderOverviewTab()}
      </TabPanel>
      <TabPanel value={currentTab} index={1}>
        {renderAssetsTab()}
      </TabPanel>
      <TabPanel value={currentTab} index={2}>
        {renderEdgeFunctionsTab()}
      </TabPanel>
      <TabPanel value={currentTab} index={3}>
        {renderNetworkTab()}
      </TabPanel>
      <TabPanel value={currentTab} index={4}>
        {renderRecommendationsTab()}
      </TabPanel>
      <TabPanel value={currentTab} index={5}>
        {renderABTestsTab()}
      </TabPanel>
    </Box>
  );
};

async function fetcher(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  return response.json();
}

export default OptimizationDashboard;
