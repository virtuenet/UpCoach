import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Badge,
  Avatar,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  Cell,
  PieChart,
  Pie,
  Treemap,
} from 'recharts';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Accessible as AccessibleIcon,
  BugReport as BugReportIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';

/**
 * Universal QA Dashboard
 * Real-time monitoring and visualization of cross-platform quality metrics
 */

// ==================== Types & Interfaces ====================

enum Platform {
  WEB = 'web',
  ANDROID = 'android',
  IOS = 'ios',
  DESKTOP = 'desktop',
}

interface TestExecution {
  id: string;
  testId: string;
  testName: string;
  platform: Platform;
  status: 'running' | 'passed' | 'failed' | 'queued';
  progress: number;
  startTime: Date;
  duration?: number;
  error?: string;
}

interface QualityScorecard {
  platform: Platform;
  overallScore: number;
  coverage: number;
  performance: number;
  accessibility: number;
  security: number;
  crashes: number;
  trend: 'up' | 'down' | 'stable';
}

interface CoverageData {
  file: string;
  platform: Platform;
  lines: number;
  branches: number;
  functions: number;
  statements: number;
}

interface PerformanceComparison {
  metric: string;
  web: number;
  android: number;
  ios: number;
  desktop: number;
}

interface FlakyTest {
  id: string;
  name: string;
  platform: Platform;
  flakinessScore: number;
  failures: number;
  totalRuns: number;
  lastFailure: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface AccessibilityReport {
  platform: Platform;
  wcagLevel: 'A' | 'AA' | 'AAA';
  violations: number;
  criticalViolations: number;
  warnings: number;
  passes: number;
  score: number;
  compliance: number;
}

interface ReleaseHealth {
  version: string;
  platform: Platform;
  releaseDate: Date;
  crashRate: number;
  testPassRate: number;
  performanceScore: number;
  userSatisfaction: number;
  issues: number;
}

interface TestExecutionTimeline {
  testId: string;
  testName: string;
  platform: Platform;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'passed' | 'failed';
}

interface QualityTrend {
  date: string;
  coverage: number;
  performance: number;
  accessibility: number;
  security: number;
  overall: number;
}

// ==================== Mock Data Generators ====================

const generateMockTestExecutions = (): TestExecution[] => {
  const tests = [
    'User Authentication Flow',
    'Checkout Process',
    'Product Search',
    'Profile Management',
    'Payment Integration',
    'Real-time Notifications',
    'Data Synchronization',
    'Image Upload',
  ];

  const platforms = [Platform.WEB, Platform.ANDROID, Platform.IOS, Platform.DESKTOP];
  const executions: TestExecution[] = [];

  platforms.forEach(platform => {
    tests.forEach((test, index) => {
      const status = ['running', 'passed', 'failed', 'queued'][Math.floor(Math.random() * 4)] as TestExecution['status'];
      executions.push({
        id: `${platform}-${index}`,
        testId: `test-${index}`,
        testName: test,
        platform,
        status,
        progress: status === 'running' ? Math.random() * 100 : status === 'passed' || status === 'failed' ? 100 : 0,
        startTime: new Date(Date.now() - Math.random() * 3600000),
        duration: status === 'passed' || status === 'failed' ? Math.random() * 60000 : undefined,
        error: status === 'failed' ? 'Assertion failed: Element not found' : undefined,
      });
    });
  });

  return executions;
};

const generateQualityScorecards = (): QualityScorecard[] => {
  return [
    {
      platform: Platform.WEB,
      overallScore: 92,
      coverage: 88,
      performance: 95,
      accessibility: 90,
      security: 93,
      crashes: 0.2,
      trend: 'up',
    },
    {
      platform: Platform.ANDROID,
      overallScore: 85,
      coverage: 82,
      performance: 88,
      accessibility: 85,
      security: 87,
      crashes: 1.5,
      trend: 'stable',
    },
    {
      platform: Platform.IOS,
      overallScore: 88,
      coverage: 85,
      performance: 92,
      accessibility: 88,
      security: 90,
      crashes: 0.8,
      trend: 'up',
    },
    {
      platform: Platform.DESKTOP,
      overallScore: 90,
      coverage: 87,
      performance: 93,
      accessibility: 89,
      security: 91,
      crashes: 0.5,
      trend: 'stable',
    },
  ];
};

const generateCoverageHeatmapData = (): CoverageData[] => {
  const files = [
    'auth/LoginForm.tsx',
    'checkout/PaymentForm.tsx',
    'products/ProductList.tsx',
    'profile/UserProfile.tsx',
    'common/Header.tsx',
    'utils/validators.ts',
    'services/api.ts',
    'hooks/useAuth.ts',
  ];

  const platforms = [Platform.WEB, Platform.ANDROID, Platform.IOS, Platform.DESKTOP];
  const data: CoverageData[] = [];

  files.forEach(file => {
    platforms.forEach(platform => {
      data.push({
        file,
        platform,
        lines: 60 + Math.random() * 40,
        branches: 50 + Math.random() * 50,
        functions: 70 + Math.random() * 30,
        statements: 65 + Math.random() * 35,
      });
    });
  });

  return data;
};

const generatePerformanceComparison = (): PerformanceComparison[] => {
  return [
    { metric: 'Load Time (ms)', web: 1200, android: 1800, ios: 1500, desktop: 1000 },
    { metric: 'Time to Interactive (ms)', web: 2100, android: 2800, ios: 2400, desktop: 1900 },
    { metric: 'Memory Usage (MB)', web: 85, android: 120, ios: 110, desktop: 95 },
    { metric: 'CPU Usage (%)', web: 25, android: 35, ios: 30, desktop: 22 },
    { metric: 'Network Requests', web: 42, android: 38, ios: 40, desktop: 45 },
    { metric: 'Bundle Size (KB)', web: 850, android: 1200, ios: 1100, desktop: 900 },
  ];
};

const generateFlakyTests = (): FlakyTest[] => {
  return [
    {
      id: '1',
      name: 'Payment Integration - Credit Card',
      platform: Platform.WEB,
      flakinessScore: 85,
      failures: 17,
      totalRuns: 20,
      lastFailure: new Date(Date.now() - 3600000),
      priority: 'critical',
    },
    {
      id: '2',
      name: 'Real-time Chat Messages',
      platform: Platform.ANDROID,
      flakinessScore: 72,
      failures: 14,
      totalRuns: 20,
      lastFailure: new Date(Date.now() - 7200000),
      priority: 'high',
    },
    {
      id: '3',
      name: 'Image Upload with Compression',
      platform: Platform.IOS,
      flakinessScore: 65,
      failures: 13,
      totalRuns: 20,
      lastFailure: new Date(Date.now() - 10800000),
      priority: 'high',
    },
    {
      id: '4',
      name: 'Notification Delivery',
      platform: Platform.DESKTOP,
      flakinessScore: 45,
      failures: 9,
      totalRuns: 20,
      lastFailure: new Date(Date.now() - 14400000),
      priority: 'medium',
    },
  ];
};

const generateAccessibilityReports = (): AccessibilityReport[] => {
  return [
    {
      platform: Platform.WEB,
      wcagLevel: 'AA',
      violations: 5,
      criticalViolations: 1,
      warnings: 12,
      passes: 143,
      score: 90,
      compliance: 95,
    },
    {
      platform: Platform.ANDROID,
      wcagLevel: 'AA',
      violations: 8,
      criticalViolations: 2,
      warnings: 18,
      passes: 128,
      score: 85,
      compliance: 92,
    },
    {
      platform: Platform.IOS,
      wcagLevel: 'AA',
      violations: 6,
      criticalViolations: 1,
      warnings: 15,
      passes: 135,
      score: 88,
      compliance: 94,
    },
    {
      platform: Platform.DESKTOP,
      wcagLevel: 'AA',
      violations: 4,
      criticalViolations: 0,
      warnings: 10,
      passes: 150,
      score: 92,
      compliance: 96,
    },
  ];
};

const generateReleaseHealthComparison = (): { current: ReleaseHealth[]; previous: ReleaseHealth[] } => {
  const platforms = [Platform.WEB, Platform.ANDROID, Platform.IOS, Platform.DESKTOP];

  return {
    current: platforms.map(platform => ({
      version: '2.5.0',
      platform,
      releaseDate: new Date(Date.now() - 86400000 * 7),
      crashRate: 0.5 + Math.random() * 1.5,
      testPassRate: 90 + Math.random() * 10,
      performanceScore: 85 + Math.random() * 15,
      userSatisfaction: 4.2 + Math.random() * 0.8,
      issues: Math.floor(Math.random() * 10),
    })),
    previous: platforms.map(platform => ({
      version: '2.4.0',
      platform,
      releaseDate: new Date(Date.now() - 86400000 * 21),
      crashRate: 1.0 + Math.random() * 2,
      testPassRate: 85 + Math.random() * 10,
      performanceScore: 80 + Math.random() * 15,
      userSatisfaction: 4.0 + Math.random() * 0.7,
      issues: Math.floor(Math.random() * 15) + 5,
    })),
  };
};

const generateTestExecutionTimeline = (): TestExecutionTimeline[] => {
  const tests = [
    'Auth Flow',
    'Checkout',
    'Search',
    'Profile',
    'Payment',
    'Notifications',
    'Sync',
    'Upload',
  ];

  const data: TestExecutionTimeline[] = [];
  let currentTime = 0;

  tests.forEach((test, index) => {
    const duration = 30000 + Math.random() * 60000;
    const status = Math.random() > 0.2 ? 'passed' : 'failed';

    data.push({
      testId: `test-${index}`,
      testName: test,
      platform: Platform.WEB,
      startTime: currentTime,
      endTime: currentTime + duration,
      duration,
      status,
    });

    currentTime += duration + 5000;
  });

  return data;
};

const generateQualityTrends = (): QualityTrend[] => {
  const trends: QualityTrend[] = [];
  const days = 30;

  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    trends.push({
      date: date.toISOString().split('T')[0],
      coverage: 75 + Math.random() * 15 + (days - i) * 0.3,
      performance: 80 + Math.random() * 10 + (days - i) * 0.2,
      accessibility: 82 + Math.random() * 12 + (days - i) * 0.25,
      security: 85 + Math.random() * 10 + (days - i) * 0.15,
      overall: 80 + Math.random() * 12 + (days - i) * 0.25,
    });
  }

  return trends;
};

// ==================== Dashboard Component ====================

export const UniversalQADashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [testExecutions, setTestExecutions] = useState<TestExecution[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestExecution | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const scorecards = useMemo(() => generateQualityScorecards(), []);
  const coverageData = useMemo(() => generateCoverageHeatmapData(), []);
  const performanceComparison = useMemo(() => generatePerformanceComparison(), []);
  const flakyTests = useMemo(() => generateFlakyTests(), []);
  const accessibilityReports = useMemo(() => generateAccessibilityReports(), []);
  const releaseHealth = useMemo(() => generateReleaseHealthComparison(), []);
  const executionTimeline = useMemo(() => generateTestExecutionTimeline(), []);
  const qualityTrends = useMemo(() => generateQualityTrends(), []);

  useEffect(() => {
    setTestExecutions(generateMockTestExecutions());

    const ws = new WebSocket('ws://localhost:8080/qa');

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'test_update') {
        setTestExecutions(prev =>
          prev.map(t => t.id === data.testId ? { ...t, ...data.update } : t)
        );
      }
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  const handlePlatformChange = useCallback((event: SelectChangeEvent<Platform | 'all'>) => {
    setSelectedPlatform(event.target.value as Platform | 'all');
  }, []);

  const handleRunTests = useCallback(() => {
    setIsRunning(true);
    setTestExecutions(prev =>
      prev.map(t => ({ ...t, status: 'running' as const, progress: 0 }))
    );

    setTimeout(() => {
      setIsRunning(false);
      setTestExecutions(generateMockTestExecutions());
    }, 5000);
  }, []);

  const handleStopTests = useCallback(() => {
    setIsRunning(false);
    setTestExecutions(prev =>
      prev.map(t => t.status === 'running' ? { ...t, status: 'queued' as const } : t)
    );
  }, []);

  const handleExportReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      scorecards,
      coverage: coverageData,
      performance: performanceComparison,
      accessibility: accessibilityReports,
      flakyTests,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-report-${new Date().toISOString()}.json`;
    a.click();
  }, [scorecards, coverageData, performanceComparison, accessibilityReports, flakyTests]);

  const filteredExecutions = useMemo(() => {
    if (selectedPlatform === 'all') return testExecutions;
    return testExecutions.filter(t => t.platform === selectedPlatform);
  }, [testExecutions, selectedPlatform]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUpIcon color="success" />;
    if (trend === 'down') return <TrendingDownIcon color="error" />;
    return <TrendingFlatIcon color="action" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const renderTestExecutionMonitor = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">Test Execution Monitor</Typography>
            <Badge badgeContent={wsConnected ? 'Live' : 'Offline'} color={wsConnected ? 'success' : 'error'}>
              <TimelineIcon />
            </Badge>
          </Box>
          <Box display="flex" gap={1}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Platform</InputLabel>
              <Select value={selectedPlatform} onChange={handlePlatformChange} label="Platform">
                <MenuItem value="all">All</MenuItem>
                <MenuItem value={Platform.WEB}>Web</MenuItem>
                <MenuItem value={Platform.ANDROID}>Android</MenuItem>
                <MenuItem value={Platform.IOS}>iOS</MenuItem>
                <MenuItem value={Platform.DESKTOP}>Desktop</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={isRunning ? <StopIcon /> : <PlayArrowIcon />}
              onClick={isRunning ? handleStopTests : handleRunTests}
              color={isRunning ? 'error' : 'primary'}
            >
              {isRunning ? 'Stop' : 'Run Tests'}
            </Button>
            <IconButton onClick={() => setTestExecutions(generateMockTestExecutions())} title="Refresh">
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={handleExportReport} title="Export Report">
              <DownloadIcon />
            </IconButton>
          </Box>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Test Name</TableCell>
                <TableCell>Platform</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Duration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExecutions.slice(0, 10).map(test => (
                <TableRow
                  key={test.id}
                  hover
                  onClick={() => setSelectedTest(test)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{test.testName}</TableCell>
                  <TableCell>
                    <Chip label={test.platform} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {test.status === 'passed' && <CheckCircleIcon color="success" />}
                    {test.status === 'failed' && <ErrorIcon color="error" />}
                    {test.status === 'running' && <CircularProgress size={20} />}
                    {test.status === 'queued' && <WarningIcon color="warning" />}
                  </TableCell>
                  <TableCell>
                    <Box width={100}>
                      <LinearProgress variant="determinate" value={test.progress} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    {test.duration ? `${(test.duration / 1000).toFixed(1)}s` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderQualityScorecard = () => (
    <Grid container spacing={2}>
      {scorecards.map(scorecard => (
        <Grid item xs={12} sm={6} md={3} key={scorecard.platform}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" textTransform="capitalize">
                  {scorecard.platform}
                </Typography>
                {getTrendIcon(scorecard.trend)}
              </Box>

              <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                <Box position="relative" display="inline-flex">
                  <CircularProgress
                    variant="determinate"
                    value={scorecard.overallScore}
                    size={100}
                    thickness={4}
                    color={scorecard.overallScore >= 90 ? 'success' : scorecard.overallScore >= 70 ? 'warning' : 'error'}
                  />
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    bottom={0}
                    right={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography variant="h4" component="div">
                      {scorecard.overallScore}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Coverage</Typography>
                  <Typography variant="body2" fontWeight="bold">{scorecard.coverage}%</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Performance</Typography>
                  <Typography variant="body2" fontWeight="bold">{scorecard.performance}%</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Accessibility</Typography>
                  <Typography variant="body2" fontWeight="bold">{scorecard.accessibility}%</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Security</Typography>
                  <Typography variant="body2" fontWeight="bold">{scorecard.security}%</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Crash Rate</Typography>
                  <Typography variant="body2" fontWeight="bold">{scorecard.crashes}%</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderCoverageHeatmap = () => {
    const files = Array.from(new Set(coverageData.map(d => d.file)));
    const platforms = [Platform.WEB, Platform.ANDROID, Platform.IOS, Platform.DESKTOP];

    const getCoverageColor = (coverage: number) => {
      if (coverage >= 80) return '#4caf50';
      if (coverage >= 60) return '#ff9800';
      return '#f44336';
    };

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Code Coverage Heatmap</Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>File</TableCell>
                  {platforms.map(platform => (
                    <TableCell key={platform} align="center" sx={{ textTransform: 'capitalize' }}>
                      {platform}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map(file => (
                  <TableRow key={file}>
                    <TableCell>{file}</TableCell>
                    {platforms.map(platform => {
                      const data = coverageData.find(d => d.file === file && d.platform === platform);
                      const avgCoverage = data
                        ? (data.lines + data.branches + data.functions + data.statements) / 4
                        : 0;

                      return (
                        <TableCell
                          key={platform}
                          align="center"
                          sx={{
                            backgroundColor: getCoverageColor(avgCoverage),
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        >
                          {avgCoverage.toFixed(1)}%
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderPerformanceComparison = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Performance Comparison</Typography>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={performanceComparison}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" angle={-45} textAnchor="end" height={120} />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="web" fill="#2196f3" name="Web" />
            <Bar dataKey="android" fill="#4caf50" name="Android" />
            <Bar dataKey="ios" fill="#ff9800" name="iOS" />
            <Bar dataKey="desktop" fill="#9c27b0" name="Desktop" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderFlakyTestTracker = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Flaky Test Tracker</Typography>

        <List>
          {flakyTests.map(test => (
            <React.Fragment key={test.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">{test.name}</Typography>
                      <Chip
                        label={test.priority}
                        size="small"
                        color={getPriorityColor(test.priority) as any}
                      />
                      <Chip
                        label={test.platform}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box mt={1}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption">
                          Failures: {test.failures}/{test.totalRuns}
                        </Typography>
                        <Typography variant="caption">
                          Last failed: {test.lastFailure.toLocaleTimeString()}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={test.flakinessScore}
                        color={test.flakinessScore > 70 ? 'error' : 'warning'}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Flakiness Score: {test.flakinessScore}%
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderAccessibilityReport = () => {
    const radarData = accessibilityReports.map(report => ({
      platform: report.platform,
      score: report.score,
      compliance: report.compliance,
      passes: (report.passes / 160) * 100,
      violations: 100 - (report.violations / 10) * 100,
    }));

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Accessibility Report</Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="platform" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Score" dataKey="score" stroke="#2196f3" fill="#2196f3" fillOpacity={0.6} />
                  <Radar name="Compliance" dataKey="compliance" stroke="#4caf50" fill="#4caf50" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Platform</TableCell>
                      <TableCell align="center">WCAG</TableCell>
                      <TableCell align="center">Violations</TableCell>
                      <TableCell align="center">Critical</TableCell>
                      <TableCell align="center">Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accessibilityReports.map(report => (
                      <TableRow key={report.platform}>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{report.platform}</TableCell>
                        <TableCell align="center">
                          <Chip label={report.wcagLevel} size="small" color="primary" />
                        </TableCell>
                        <TableCell align="center">{report.violations}</TableCell>
                        <TableCell align="center">
                          {report.criticalViolations > 0 ? (
                            <Chip
                              label={report.criticalViolations}
                              size="small"
                              color="error"
                            />
                          ) : (
                            <CheckCircleIcon color="success" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${report.score}%`}
                            size="small"
                            color={report.score >= 90 ? 'success' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderReleaseHealthComparison = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Release Health Comparison</Typography>

        <Grid container spacing={2}>
          {releaseHealth.current.map((current, index) => {
            const previous = releaseHealth.previous[index];

            return (
              <Grid item xs={12} sm={6} md={3} key={current.platform}>
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="subtitle2" textTransform="capitalize" gutterBottom>
                    {current.platform}
                  </Typography>

                  <Box display="flex" gap={2} mb={2}>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">Current</Typography>
                      <Typography variant="body2" fontWeight="bold">{current.version}</Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">Previous</Typography>
                      <Typography variant="body2">{previous.version}</Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption">Crash Rate</Typography>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="caption" fontWeight="bold">
                          {current.crashRate.toFixed(2)}%
                        </Typography>
                        {current.crashRate < previous.crashRate ? (
                          <TrendingUpIcon fontSize="small" color="success" />
                        ) : (
                          <TrendingDownIcon fontSize="small" color="error" />
                        )}
                      </Box>
                    </Box>

                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption">Test Pass Rate</Typography>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="caption" fontWeight="bold">
                          {current.testPassRate.toFixed(1)}%
                        </Typography>
                        {current.testPassRate > previous.testPassRate ? (
                          <TrendingUpIcon fontSize="small" color="success" />
                        ) : (
                          <TrendingDownIcon fontSize="small" color="error" />
                        )}
                      </Box>
                    </Box>

                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption">Performance</Typography>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="caption" fontWeight="bold">
                          {current.performanceScore.toFixed(0)}
                        </Typography>
                        {current.performanceScore > previous.performanceScore ? (
                          <TrendingUpIcon fontSize="small" color="success" />
                        ) : (
                          <TrendingDownIcon fontSize="small" color="error" />
                        )}
                      </Box>
                    </Box>

                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption">Issues</Typography>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="caption" fontWeight="bold">
                          {current.issues}
                        </Typography>
                        {current.issues < previous.issues ? (
                          <TrendingUpIcon fontSize="small" color="success" />
                        ) : (
                          <TrendingDownIcon fontSize="small" color="error" />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderTestExecutionTimeline = () => {
    const maxTime = Math.max(...executionTimeline.map(t => t.endTime));

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Test Execution Timeline (Gantt Chart)</Typography>

          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ minWidth: 800, height: 400, position: 'relative' }}>
              {executionTimeline.map((test, index) => {
                const left = (test.startTime / maxTime) * 100;
                const width = (test.duration / maxTime) * 100;
                const top = index * 40 + 20;

                return (
                  <Box key={test.testId}>
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        left: 10,
                        top: top + 10,
                        fontSize: '0.75rem'
                      }}
                    >
                      {test.testName}
                    </Typography>
                    <Tooltip title={`${(test.duration / 1000).toFixed(1)}s`}>
                      <Box
                        sx={{
                          position: 'absolute',
                          left: `calc(200px + ${left}%)`,
                          top,
                          width: `${width}%`,
                          height: 30,
                          backgroundColor: test.status === 'passed' ? '#4caf50' : '#f44336',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.7rem',
                        }}
                      >
                        {(test.duration / 1000).toFixed(1)}s
                      </Box>
                    </Tooltip>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderQualityTrends = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Quality Trends (30 Days)</Typography>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={qualityTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <RechartsTooltip />
            <Legend />
            <Line type="monotone" dataKey="overall" stroke="#2196f3" name="Overall" strokeWidth={2} />
            <Line type="monotone" dataKey="coverage" stroke="#4caf50" name="Coverage" />
            <Line type="monotone" dataKey="performance" stroke="#ff9800" name="Performance" />
            <Line type="monotone" dataKey="accessibility" stroke="#9c27b0" name="Accessibility" />
            <Line type="monotone" dataKey="security" stroke="#f44336" name="Security" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Universal QA Dashboard</Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Chip
            icon={<TimelineIcon />}
            label={`${testExecutions.filter(t => t.status === 'passed').length}/${testExecutions.length} Passed`}
            color="success"
          />
          <Chip
            icon={<BugReportIcon />}
            label={`${testExecutions.filter(t => t.status === 'failed').length} Failed`}
            color="error"
          />
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Coverage" />
        <Tab label="Performance" />
        <Tab label="Accessibility" />
        <Tab label="Quality Trends" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {renderTestExecutionMonitor()}
          </Grid>
          <Grid item xs={12}>
            {renderQualityScorecard()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderFlakyTestTracker()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderReleaseHealthComparison()}
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {renderCoverageHeatmap()}
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {renderPerformanceComparison()}
          </Grid>
          <Grid item xs={12}>
            {renderTestExecutionTimeline()}
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {renderAccessibilityReport()}
          </Grid>
        </Grid>
      )}

      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {renderQualityTrends()}
          </Grid>
        </Grid>
      )}

      <Dialog open={!!selectedTest} onClose={() => setSelectedTest(null)} maxWidth="md" fullWidth>
        {selectedTest && (
          <>
            <DialogTitle>Test Details: {selectedTest.testName}</DialogTitle>
            <DialogContent>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Platform</Typography>
                  <Chip label={selectedTest.platform} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedTest.status}
                    color={selectedTest.status === 'passed' ? 'success' : selectedTest.status === 'failed' ? 'error' : 'default'}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
                  <Typography>{selectedTest.duration ? `${(selectedTest.duration / 1000).toFixed(2)}s` : 'N/A'}</Typography>
                </Box>
                {selectedTest.error && (
                  <Alert severity="error">
                    <AlertTitle>Error</AlertTitle>
                    {selectedTest.error}
                  </Alert>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedTest(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default UniversalQADashboard;
