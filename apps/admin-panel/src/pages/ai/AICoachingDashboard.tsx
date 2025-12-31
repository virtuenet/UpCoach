/**
 * AI Coaching Dashboard - Live AI conversation monitoring and management
 *
 * Features:
 * - Live AI conversation monitoring
 * - Coaching session management
 * - AI performance metrics with Recharts
 * - Token usage tracking and cost management
 * - Model selection and configuration
 * - Safety and moderation controls
 * - Conversation transcripts viewer
 * - Session analytics and insights
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  LinearProgress,
  Switch,
  FormControlLabel,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
} from 'recharts';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  Psychology as AIIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

// Types
interface ConversationSession {
  id: string;
  userId: string;
  userName: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  totalTokens: number;
  model: string;
  style: string;
  status: 'active' | 'completed' | 'ended';
  emotionalStates: string[];
  actionItems: number;
}

interface AIMetrics {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  userSatisfaction: number;
  modelDistribution: Record<string, number>;
  styleDistribution: Record<string, number>;
}

interface TokenUsage {
  timestamp: Date;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokens?: number;
  emotionalTone?: string;
}

interface ConversationTranscript {
  sessionId: string;
  messages: Message[];
  summary?: string;
  actionItems: Array<{
    id: string;
    content: string;
    category: string;
    priority: string;
  }>;
}

interface ModelConfig {
  model: 'gpt-4-turbo' | 'gpt-4' | 'claude-3-opus' | 'claude-3-sonnet';
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const TOKEN_COSTS = {
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'claude-3-opus': { prompt: 0.015, completion: 0.075 },
  'claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
};

/**
 * AI Coaching Dashboard Component
 */
const AICoachingDashboard: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [metrics, setMetrics] = useState<AIMetrics>({
    totalSessions: 0,
    activeSessions: 0,
    totalMessages: 0,
    totalTokens: 0,
    totalCost: 0,
    averageResponseTime: 0,
    userSatisfaction: 0,
    modelDistribution: {},
    styleDistribution: {},
  });
  const [tokenUsageHistory, setTokenUsageHistory] = useState<TokenUsage[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<ConversationTranscript | null>(null);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    model: 'gpt-4-turbo',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0,
  });
  const [safetyEnabled, setSafetyEnabled] = useState(true);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [transcriptDialogOpen, setTranscriptDialogOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:3000/ai');

    ws.onopen = () => {
      setWsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      setWsConnected(false);
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [timeRange]);

  // Handlers
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'session:started':
        handleNewSession(data.payload);
        break;
      case 'message:sent':
        handleNewMessage(data.payload);
        break;
      case 'session:ended':
        handleSessionEnded(data.payload);
        break;
      case 'metrics:update':
        setMetrics((prev) => ({ ...prev, ...data.payload }));
        break;
    }
  };

  const handleNewSession = (sessionData: any) => {
    const newSession: ConversationSession = {
      id: sessionData.sessionId,
      userId: sessionData.userId,
      userName: sessionData.userName || 'Unknown User',
      startTime: new Date(sessionData.startTime),
      messageCount: 0,
      totalTokens: 0,
      model: sessionData.model || 'gpt-4-turbo',
      style: sessionData.style || 'supportive',
      status: 'active',
      emotionalStates: [],
      actionItems: 0,
    };

    setSessions((prev) => [newSession, ...prev]);
    setMetrics((prev) => ({
      ...prev,
      activeSessions: prev.activeSessions + 1,
      totalSessions: prev.totalSessions + 1,
    }));
  };

  const handleNewMessage = (messageData: any) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === messageData.sessionId
          ? {
              ...session,
              messageCount: session.messageCount + 1,
              totalTokens: session.totalTokens + (messageData.tokens?.total || 0),
            }
          : session
      )
    );

    const usage: TokenUsage = {
      timestamp: new Date(),
      model: messageData.model,
      promptTokens: messageData.tokens?.prompt || 0,
      completionTokens: messageData.tokens?.completion || 0,
      totalTokens: messageData.tokens?.total || 0,
      cost: calculateCost(messageData.model, messageData.tokens),
    };

    setTokenUsageHistory((prev) => [...prev, usage].slice(-100));
  };

  const handleSessionEnded = (sessionData: any) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionData.sessionId
          ? {
              ...session,
              status: 'completed',
              endTime: new Date(sessionData.endTime),
            }
          : session
      )
    );

    setMetrics((prev) => ({
      ...prev,
      activeSessions: Math.max(0, prev.activeSessions - 1),
    }));
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, metricsRes, tokenUsageRes] = await Promise.all([
        fetch(`/api/ai/sessions?range=${timeRange}`),
        fetch(`/api/ai/metrics?range=${timeRange}`),
        fetch(`/api/ai/token-usage?range=${timeRange}`),
      ]);

      const sessionsData = await sessionsRes.json();
      const metricsData = await metricsRes.json();
      const tokenUsageData = await tokenUsageRes.json();

      setSessions(
        sessionsData.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined,
        }))
      );
      setMetrics(metricsData);
      setTokenUsageHistory(
        tokenUsageData.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        }))
      );
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewTranscript = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ai/sessions/${sessionId}/transcript`);
      const data = await response.json();
      setTranscript(data);
      setSelectedSession(sessionId);
      setTranscriptDialogOpen(true);
    } catch (error) {
      console.error('Failed to load transcript:', error);
    } finally {
      setLoading(false);
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      await fetch(`/api/ai/sessions/${sessionId}/end`, { method: 'POST' });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: 'ended' } : s))
      );
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const updateModelConfig = async () => {
    try {
      await fetch('/api/ai/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelConfig),
      });
      setConfigDialogOpen(false);
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  const exportData = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/ai/export?format=${format}&range=${timeRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-coaching-data-${new Date().toISOString()}.${format}`;
      a.click();
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const calculateCost = (model: string, tokens: any): number => {
    const costs = TOKEN_COSTS[model as keyof typeof TOKEN_COSTS] || { prompt: 0, completion: 0 };
    const promptCost = ((tokens?.prompt || 0) / 1000) * costs.prompt;
    const completionCost = ((tokens?.completion || 0) / 1000) * costs.completion;
    return promptCost + completionCost;
  };

  // Computed data
  const tokenUsageChartData = useMemo(() => {
    const grouped = tokenUsageHistory.reduce((acc, usage) => {
      const hour = new Date(usage.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      if (!acc[hour]) {
        acc[hour] = { hour, tokens: 0, cost: 0 };
      }
      acc[hour].tokens += usage.totalTokens;
      acc[hour].cost += usage.cost;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  }, [tokenUsageHistory]);

  const modelDistributionData = useMemo(() => {
    return Object.entries(metrics.modelDistribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [metrics.modelDistribution]);

  const styleDistributionData = useMemo(() => {
    return Object.entries(metrics.styleDistribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [metrics.styleDistribution]);

  const averageCostPerSession = useMemo(() => {
    return metrics.totalSessions > 0 ? metrics.totalCost / metrics.totalSessions : 0;
  }, [metrics]);

  // Render functions
  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Key Metrics */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Sessions
                </Typography>
                <Typography variant="h4">{metrics.totalSessions}</Typography>
              </Box>
              <ChatIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Active Sessions
                </Typography>
                <Typography variant="h4" color="success.main">
                  {metrics.activeSessions}
                </Typography>
              </Box>
              <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Cost
                </Typography>
                <Typography variant="h4">${metrics.totalCost.toFixed(2)}</Typography>
              </Box>
              <MoneyIcon color="warning" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Avg Response Time
                </Typography>
                <Typography variant="h4">{metrics.averageResponseTime.toFixed(1)}s</Typography>
              </Box>
              <SpeedIcon color="info" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Token Usage Chart */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Token Usage Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={tokenUsageChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="tokens"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Tokens"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="cost"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Cost ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Model Distribution */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Model Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={modelDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {modelDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Style Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Coaching Style Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={styleDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {styleDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Performance Metrics */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary">
                User Satisfaction
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <LinearProgress
                  variant="determinate"
                  value={metrics.userSatisfaction * 20}
                  sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2">{metrics.userSatisfaction.toFixed(1)}/5</Typography>
              </Box>
            </Box>

            <Box mt={3}>
              <Typography variant="body2" color="textSecondary">
                Average Cost per Session
              </Typography>
              <Typography variant="h5" mt={1}>
                ${averageCostPerSession.toFixed(3)}
              </Typography>
            </Box>

            <Box mt={3}>
              <Typography variant="body2" color="textSecondary">
                Messages per Session
              </Typography>
              <Typography variant="h5" mt={1}>
                {metrics.totalSessions > 0
                  ? (metrics.totalMessages / metrics.totalSessions).toFixed(1)
                  : 0}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderSessionsTab = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Active & Recent Sessions</Typography>
          <Box>
            <Chip
              label={wsConnected ? 'Live' : 'Disconnected'}
              color={wsConnected ? 'success' : 'error'}
              size="small"
              sx={{ mr: 2 }}
            />
            <Button startIcon={<RefreshIcon />} onClick={loadDashboardData}>
              Refresh
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Style</TableCell>
                <TableCell>Messages</TableCell>
                <TableCell>Tokens</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.userName}</TableCell>
                  <TableCell>{session.startTime.toLocaleTimeString()}</TableCell>
                  <TableCell>
                    <Chip label={session.model} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={session.style} size="small" color="primary" />
                  </TableCell>
                  <TableCell>{session.messageCount}</TableCell>
                  <TableCell>{session.totalTokens.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={session.status}
                      size="small"
                      color={
                        session.status === 'active'
                          ? 'success'
                          : session.status === 'completed'
                          ? 'default'
                          : 'warning'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => viewTranscript(session.id)}>
                      <ViewIcon />
                    </IconButton>
                    {session.status === 'active' && (
                      <IconButton size="small" onClick={() => endSession(session.id)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderConfigTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Model Configuration
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Default Model</InputLabel>
              <Select
                value={modelConfig.model}
                onChange={(e) =>
                  setModelConfig({ ...modelConfig, model: e.target.value as any })
                }
              >
                <MenuItem value="gpt-4-turbo">GPT-4 Turbo</MenuItem>
                <MenuItem value="gpt-4">GPT-4</MenuItem>
                <MenuItem value="claude-3-opus">Claude 3 Opus</MenuItem>
                <MenuItem value="claude-3-sonnet">Claude 3 Sonnet</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              margin="normal"
              label="Temperature"
              type="number"
              value={modelConfig.temperature}
              onChange={(e) =>
                setModelConfig({ ...modelConfig, temperature: parseFloat(e.target.value) })
              }
              inputProps={{ min: 0, max: 2, step: 0.1 }}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Max Tokens"
              type="number"
              value={modelConfig.maxTokens}
              onChange={(e) =>
                setModelConfig({ ...modelConfig, maxTokens: parseInt(e.target.value) })
              }
              inputProps={{ min: 100, max: 4000, step: 100 }}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Top P"
              type="number"
              value={modelConfig.topP}
              onChange={(e) =>
                setModelConfig({ ...modelConfig, topP: parseFloat(e.target.value) })
              }
              inputProps={{ min: 0, max: 1, step: 0.1 }}
            />

            <Box mt={2}>
              <Button variant="contained" onClick={updateModelConfig}>
                Save Configuration
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Safety & Features
            </Typography>

            <FormControlLabel
              control={
                <Switch checked={safetyEnabled} onChange={(e) => setSafetyEnabled(e.target.checked)} />
              }
              label="Enable Safety Filters"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={streamingEnabled}
                  onChange={(e) => setStreamingEnabled(e.target.checked)}
                />
              }
              label="Enable Response Streaming"
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Coaching Style Presets
            </Typography>

            <List dense>
              {['Supportive', 'Challenging', 'Analytical', 'Motivational'].map((style) => (
                <ListItem key={style}>
                  <ListItemText
                    primary={style}
                    secondary={`Default ${style.toLowerCase()} coaching approach`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end">
                      <SettingsIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Export Data
            </Typography>
            <Box display="flex" gap={2}>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportData('csv')}>
                Export as CSV
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportData('json')}>
                Export as JSON
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            AI Coaching Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Monitor and manage AI coaching sessions in real-time
          </Typography>
        </Box>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)}>
            <MenuItem value="1h">Last Hour</MenuItem>
            <MenuItem value="24h">Last 24 Hours</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab label="Overview" />
          <Tab label="Sessions" />
          <Tab label="Configuration" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && renderOverviewTab()}
      {activeTab === 1 && renderSessionsTab()}
      {activeTab === 2 && renderConfigTab()}

      {/* Transcript Dialog */}
      <Dialog
        open={transcriptDialogOpen}
        onClose={() => setTranscriptDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Conversation Transcript
          {transcript && (
            <Typography variant="caption" display="block" color="textSecondary">
              Session ID: {transcript.sessionId}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {transcript && (
            <>
              {/* Messages */}
              <Box mb={3}>
                {transcript.messages.map((msg) => (
                  <Box
                    key={msg.id}
                    mb={2}
                    p={2}
                    bgcolor={msg.role === 'user' ? 'action.hover' : 'background.paper'}
                    borderLeft={4}
                    borderColor={msg.role === 'user' ? 'primary.main' : 'secondary.main'}
                  >
                    <Typography variant="caption" color="textSecondary">
                      {msg.role.toUpperCase()} - {msg.timestamp.toLocaleTimeString()}
                    </Typography>
                    <Typography variant="body2" mt={1}>
                      {msg.content}
                    </Typography>
                    {msg.tokens && (
                      <Typography variant="caption" color="textSecondary" mt={1}>
                        {msg.tokens} tokens
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>

              {/* Action Items */}
              {transcript.actionItems.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Extracted Action Items
                  </Typography>
                  <List>
                    {transcript.actionItems.map((item) => (
                      <ListItem key={item.id}>
                        <ListItemText
                          primary={item.content}
                          secondary={`${item.category} - ${item.priority} priority`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {/* Summary */}
              {transcript.summary && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Session Summary
                  </Typography>
                  <Typography variant="body2">{transcript.summary}</Typography>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTranscriptDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Export Transcript
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AICoachingDashboard;
