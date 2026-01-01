import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  BugReport as BugReportIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  Webhook as WebhookIcon,
  Event as EventIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as ContentCopyIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import ReactFlow, { Node, Edge, Controls, Background, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import useSWR, { mutate } from 'swr';

interface SystemHealth {
  service: string;
  cpu: number;
  memory: number;
  disk: number;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
}

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  authenticated: boolean;
  requestSchema?: any;
  responseSchema?: any;
}

interface DatabaseQuery {
  query: string;
  duration: number;
  rows: number;
  explain?: string;
}

interface PerformanceMetric {
  timestamp: string;
  requestRate: number;
  avgLatency: number;
  errorRate: number;
  p95Latency: number;
}

interface ErrorLog {
  id: string;
  timestamp: string;
  level: string;
  service: string;
  message: string;
  stackTrace?: string;
  count: number;
  metadata?: Record<string, any>;
}

interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  service: string;
  message: string;
  metadata?: Record<string, any>;
}

interface FeatureFlag {
  name: string;
  enabled: boolean;
  percentage: number;
  description: string;
}

interface EnvVariable {
  key: string;
  value: string;
  environment: string;
  updatedAt: string;
}

interface Secret {
  key: string;
  value: string;
  masked: boolean;
  updatedAt: string;
}

interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  indexes: DatabaseIndex[];
  rowCount: number;
}

interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  primaryKey: boolean;
  foreignKey?: string;
}

interface DatabaseIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

interface WebhookTest {
  url: string;
  method: string;
  headers: Record<string, string>;
  payload: any;
  response?: {
    status: number;
    headers: Record<string, string>;
    body: any;
    duration: number;
  };
}

interface RealtimeEvent {
  id: string;
  timestamp: string;
  type: string;
  data: any;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const DeveloperDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    const newSocket = io(API_BASE_URL, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
    });

    newSocket.on('event', (event: RealtimeEvent) => {
      setRealtimeEvents((prev) => [event, ...prev.slice(0, 99)]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Developer Dashboard
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="System Health" />
        <Tab label="API Explorer" />
        <Tab label="Database Tools" />
        <Tab label="Logs" />
        <Tab label="Metrics" />
        <Tab label="Errors" />
        <Tab label="Configuration" />
        <Tab label="Documentation" />
        <Tab label="Webhooks" />
        <Tab label="Events" />
      </Tabs>

      {activeTab === 0 && <SystemHealthSection />}
      {activeTab === 1 && <APIExplorerSection />}
      {activeTab === 2 && <DatabaseToolsSection />}
      {activeTab === 3 && <LogsSection />}
      {activeTab === 4 && <MetricsSection />}
      {activeTab === 5 && <ErrorsSection />}
      {activeTab === 6 && <ConfigurationSection />}
      {activeTab === 7 && <DocumentationSection />}
      {activeTab === 8 && <WebhooksSection />}
      {activeTab === 9 && <EventsSection events={realtimeEvents} />}
    </Box>
  );
};

const SystemHealthSection: React.FC = () => {
  const { data: healthData, error, mutate: refreshHealth } = useSWR<SystemHealth[]>(
    `${API_BASE_URL}/admin/health`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: dependencyGraph } = useSWR<{ nodes: Node[]; edges: Edge[] }>(
    `${API_BASE_URL}/admin/health/dependencies`,
    fetcher
  );

  if (error) {
    return <Alert severity="error">Failed to load system health data</Alert>;
  }

  if (!healthData) {
    return <CircularProgress />;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">System Health Overview</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refreshHealth()}
          >
            Refresh
          </Button>
        </Box>
      </Grid>

      {healthData.map((service) => (
        <Grid item xs={12} md={6} lg={4} key={service.service}>
          <Card>
            <CardHeader
              title={service.service}
              action={
                <Chip
                  label={service.status}
                  color={
                    service.status === 'healthy'
                      ? 'success'
                      : service.status === 'degraded'
                      ? 'warning'
                      : 'error'
                  }
                  size="small"
                />
              }
            />
            <CardContent>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  CPU Usage
                </Typography>
                <Box display="flex" alignItems="center">
                  <Box flexGrow={1} mr={2}>
                    <Box
                      sx={{
                        height: 8,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${service.cpu}%`,
                          bgcolor:
                            service.cpu > 80
                              ? 'error.main'
                              : service.cpu > 60
                              ? 'warning.main'
                              : 'success.main',
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2">{service.cpu}%</Typography>
                </Box>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  Memory Usage
                </Typography>
                <Box display="flex" alignItems="center">
                  <Box flexGrow={1} mr={2}>
                    <Box
                      sx={{
                        height: 8,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${service.memory}%`,
                          bgcolor:
                            service.memory > 80
                              ? 'error.main'
                              : service.memory > 60
                              ? 'warning.main'
                              : 'success.main',
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2">{service.memory}%</Typography>
                </Box>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  Disk Usage
                </Typography>
                <Box display="flex" alignItems="center">
                  <Box flexGrow={1} mr={2}>
                    <Box
                      sx={{
                        height: 8,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${service.disk}%`,
                          bgcolor:
                            service.disk > 80
                              ? 'error.main'
                              : service.disk > 60
                              ? 'warning.main'
                              : 'success.main',
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2">{service.disk}%</Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="textSecondary">
                Uptime: {Math.floor(service.uptime / 3600)}h {Math.floor((service.uptime % 3600) / 60)}m
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {dependencyGraph && (
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Service Dependency Graph" />
            <CardContent>
              <Box height={500}>
                <ReactFlow
                  nodes={dependencyGraph.nodes}
                  edges={dependencyGraph.edges}
                  fitView
                >
                  <Controls />
                  <Background />
                  <MiniMap />
                </ReactFlow>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

const APIExplorerSection: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState('GET');
  const [selectedPath, setSelectedPath] = useState('/api/v1/users');
  const [requestBody, setRequestBody] = useState('{}');
  const [requestHeaders, setRequestHeaders] = useState('{}');
  const [authToken, setAuthToken] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { data: endpoints } = useSWR<APIEndpoint[]>(
    `${API_BASE_URL}/admin/api/endpoints`,
    fetcher
  );

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = JSON.parse(requestHeaders);
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const config: any = {
        method: selectedMethod.toLowerCase(),
        url: `${API_BASE_URL}${selectedPath}`,
        headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(selectedMethod)) {
        config.data = JSON.parse(requestBody);
      }

      const startTime = Date.now();
      const result = await axios(config);
      const duration = Date.now() - startTime;

      setResponse({
        status: result.status,
        headers: result.headers,
        data: result.data,
        duration,
      });
    } catch (error: any) {
      setResponse({
        status: error.response?.status || 0,
        headers: error.response?.headers || {},
        data: error.response?.data || { error: error.message },
        duration: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Request Configuration" />
          <CardContent>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Method</InputLabel>
              <Select
                value={selectedMethod}
                label="Method"
                onChange={(e) => setSelectedMethod(e.target.value)}
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="PATCH">PATCH</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Path"
              value={selectedPath}
              onChange={(e) => setSelectedPath(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Auth Token"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              sx={{ mb: 2 }}
              type="password"
            />

            <Typography variant="subtitle2" gutterBottom>
              Request Headers (JSON)
            </Typography>
            <Editor
              height="150px"
              defaultLanguage="json"
              value={requestHeaders}
              onChange={(value) => setRequestHeaders(value || '{}')}
              options={{ minimap: { enabled: false } }}
            />

            {['POST', 'PUT', 'PATCH'].includes(selectedMethod) && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Request Body (JSON)
                </Typography>
                <Editor
                  height="200px"
                  defaultLanguage="json"
                  value={requestBody}
                  onChange={(value) => setRequestBody(value || '{}')}
                  options={{ minimap: { enabled: false } }}
                />
              </Box>
            )}

            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleSendRequest}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            >
              Send Request
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Response" />
          <CardContent>
            {response ? (
              <>
                <Box mb={2}>
                  <Chip
                    label={`Status: ${response.status}`}
                    color={response.status >= 200 && response.status < 300 ? 'success' : 'error'}
                  />
                  <Chip label={`Duration: ${response.duration}ms`} sx={{ ml: 1 }} />
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Response Headers
                </Typography>
                <Editor
                  height="150px"
                  defaultLanguage="json"
                  value={JSON.stringify(response.headers, null, 2)}
                  options={{ readOnly: true, minimap: { enabled: false } }}
                />

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Response Body
                </Typography>
                <Editor
                  height="300px"
                  defaultLanguage="json"
                  value={JSON.stringify(response.data, null, 2)}
                  options={{ readOnly: true, minimap: { enabled: false } }}
                />
              </>
            ) : (
              <Typography color="textSecondary">
                Send a request to see the response
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Available Endpoints" />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Method</TableCell>
                    <TableCell>Path</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Auth</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {endpoints?.map((endpoint, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip label={endpoint.method} size="small" />
                      </TableCell>
                      <TableCell>{endpoint.path}</TableCell>
                      <TableCell>{endpoint.description}</TableCell>
                      <TableCell>
                        {endpoint.authenticated ? (
                          <Chip label="Required" color="primary" size="small" />
                        ) : (
                          <Chip label="Public" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedMethod(endpoint.method);
                            setSelectedPath(endpoint.path);
                          }}
                        >
                          Try
                        </Button>
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
};

const DatabaseToolsSection: React.FC = () => {
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { data: tables } = useSWR<DatabaseTable[]>(
    `${API_BASE_URL}/admin/database/tables`,
    fetcher
  );

  const { data: slowQueries } = useSWR<DatabaseQuery[]>(
    `${API_BASE_URL}/admin/database/slow-queries`,
    fetcher
  );

  const handleExecuteQuery = async () => {
    setLoading(true);
    try {
      const result = await axios.post(`${API_BASE_URL}/admin/database/query`, {
        query,
      });
      setQueryResult(result.data);
    } catch (error: any) {
      setQueryResult({
        error: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title="Query Analyzer" />
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              SQL Query
            </Typography>
            <Editor
              height="200px"
              defaultLanguage="sql"
              value={query}
              onChange={(value) => setQuery(value || '')}
              options={{ minimap: { enabled: false } }}
            />

            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={handleExecuteQuery}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            >
              Execute Query
            </Button>

            {queryResult && (
              <Box mt={2}>
                {queryResult.error ? (
                  <Alert severity="error">{queryResult.error}</Alert>
                ) : (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Results ({queryResult.rows?.length || 0} rows, {queryResult.duration}ms)
                    </Typography>
                    <Editor
                      height="300px"
                      defaultLanguage="json"
                      value={JSON.stringify(queryResult.rows, null, 2)}
                      options={{ readOnly: true, minimap: { enabled: false } }}
                    />

                    {queryResult.explain && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          Query Plan
                        </Typography>
                        <Editor
                          height="200px"
                          defaultLanguage="text"
                          value={queryResult.explain}
                          options={{ readOnly: true, minimap: { enabled: false } }}
                        />
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        <Card sx={{ mt: 3 }}>
          <CardHeader title="Slow Queries" />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Query</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Rows</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slowQueries?.map((slowQuery, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {slowQuery.query}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${slowQuery.duration}ms`}
                          color={slowQuery.duration > 1000 ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{slowQuery.rows}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="Database Schema" />
          <CardContent>
            {tables?.map((table) => (
              <Accordion key={table.name}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    {table.name} ({table.rowCount} rows)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Column</TableCell>
                        <TableCell>Type</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {table.columns.map((column) => (
                        <TableRow key={column.name}>
                          <TableCell>
                            {column.name}
                            {column.primaryKey && (
                              <Chip label="PK" size="small" sx={{ ml: 1 }} />
                            )}
                          </TableCell>
                          <TableCell>{column.type}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

const LogsSection: React.FC = () => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: logs, mutate: refreshLogs } = useSWR<LogEntry[]>(
    `${API_BASE_URL}/admin/logs?level=${filterLevel}&service=${filterService}&search=${searchText}`,
    fetcher,
    { refreshInterval: autoRefresh ? 2000 : 0 }
  );

  const { data: services } = useSWR<string[]>(
    `${API_BASE_URL}/admin/logs/services`,
    fetcher
  );

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      if (filterLevel !== 'all' && log.level !== filterLevel) return false;
      if (filterService !== 'all' && log.service !== filterService) return false;
      if (searchText && !log.message.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [logs, filterLevel, filterService, searchText]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warn':
        return 'warning';
      case 'info':
        return 'info';
      case 'debug':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Log Viewer"
            action={
              <Box display="flex" gap={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                  }
                  label="Auto-refresh"
                />
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => refreshLogs()}
                >
                  Refresh
                </Button>
              </Box>
            }
          />
          <CardContent>
            <Box display="flex" gap={2} mb={2}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Level</InputLabel>
                <Select
                  value={filterLevel}
                  label="Level"
                  onChange={(e) => setFilterLevel(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="warn">Warning</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="debug">Debug</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Service</InputLabel>
                <Select
                  value={filterService}
                  label="Service"
                  onChange={(e) => setFilterService(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  {services?.map((service) => (
                    <MenuItem key={service} value={service}>
                      {service}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ flexGrow: 1 }}
              />
            </Box>

            <Paper sx={{ maxHeight: 600, overflow: 'auto', bgcolor: 'grey.900', p: 2 }}>
              {filteredLogs.map((log, index) => (
                <Box key={index} mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption" color="grey.500" sx={{ minWidth: 100 }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Typography>
                    <Chip
                      label={log.level.toUpperCase()}
                      color={getLevelColor(log.level) as any}
                      size="small"
                      sx={{ minWidth: 70 }}
                    />
                    <Chip label={log.service} size="small" />
                    <Typography variant="body2" color="grey.100">
                      {log.message}
                    </Typography>
                  </Box>
                  {log.metadata && (
                    <Typography
                      variant="caption"
                      color="grey.600"
                      component="pre"
                      sx={{ ml: 15, mt: 0.5 }}
                    >
                      {JSON.stringify(log.metadata, null, 2)}
                    </Typography>
                  )}
                </Box>
              ))}
            </Paper>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

const MetricsSection: React.FC = () => {
  const { data: metricsData } = useSWR<PerformanceMetric[]>(
    `${API_BASE_URL}/admin/metrics/performance?hours=24`,
    fetcher,
    { refreshInterval: 10000 }
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title="Request Rate" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="requestRate" stroke="#8884d8" name="Requests/sec" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Response Latency" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="avgLatency"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Avg Latency (ms)"
                />
                <Area
                  type="monotone"
                  dataKey="p95Latency"
                  stroke="#ffc658"
                  fill="#ffc658"
                  name="P95 Latency (ms)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Error Rate" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="errorRate" fill="#ff6b6b" name="Error Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

const ErrorsSection: React.FC = () => {
  const { data: errors } = useSWR<ErrorLog[]>(
    `${API_BASE_URL}/admin/errors?hours=24`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title="Error Tracking" />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Count</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errors?.map((error) => (
                    <TableRow key={error.id}>
                      <TableCell>
                        {new Date(error.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip label={error.service} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            maxWidth: 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {error.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Badge badgeContent={error.count} color="error">
                          <BugReportIcon />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => setSelectedError(error)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Dialog
        open={!!selectedError}
        onClose={() => setSelectedError(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Error Details</DialogTitle>
        <DialogContent>
          {selectedError && (
            <>
              <Typography variant="body2" gutterBottom>
                <strong>Service:</strong> {selectedError.service}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Message:</strong> {selectedError.message}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Timestamp:</strong> {new Date(selectedError.timestamp).toLocaleString()}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Occurrences:</strong> {selectedError.count}
              </Typography>

              {selectedError.stackTrace && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Stack Trace
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.900', overflow: 'auto', maxHeight: 400 }}>
                    <Typography variant="body2" component="pre" color="grey.100">
                      {selectedError.stackTrace}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {selectedError.metadata && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Metadata
                  </Typography>
                  <Editor
                    height="200px"
                    defaultLanguage="json"
                    value={JSON.stringify(selectedError.metadata, null, 2)}
                    options={{ readOnly: true, minimap: { enabled: false } }}
                  />
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedError(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

const ConfigurationSection: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState(0);

  return (
    <Box>
      <Tabs value={activeSubTab} onChange={(e, v) => setActiveSubTab(v)} sx={{ mb: 2 }}>
        <Tab label="Feature Flags" />
        <Tab label="Environment Variables" />
        <Tab label="Secrets" />
      </Tabs>

      {activeSubTab === 0 && <FeatureFlagsPanel />}
      {activeSubTab === 1 && <EnvironmentVariablesPanel />}
      {activeSubTab === 2 && <SecretsPanel />}
    </Box>
  );
};

const FeatureFlagsPanel: React.FC = () => {
  const { data: flags, mutate: refreshFlags } = useSWR<FeatureFlag[]>(
    `${API_BASE_URL}/admin/feature-flags`,
    fetcher
  );

  const handleToggleFlag = async (name: string, enabled: boolean) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/feature-flags/${name}`, {
        enabled,
        percentage: enabled ? 100 : 0,
      });
      refreshFlags();
    } catch (error) {
      console.error('Failed to toggle feature flag', error);
    }
  };

  const handleUpdatePercentage = async (name: string, percentage: number) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/feature-flags/${name}`, {
        enabled: percentage > 0,
        percentage,
      });
      refreshFlags();
    } catch (error) {
      console.error('Failed to update percentage', error);
    }
  };

  return (
    <Card>
      <CardHeader title="Feature Flags" />
      <CardContent>
        <List>
          {flags?.map((flag) => (
            <React.Fragment key={flag.name}>
              <ListItem>
                <ListItemText
                  primary={flag.name}
                  secondary={
                    <>
                      <Typography variant="body2" color="textSecondary">
                        {flag.description}
                      </Typography>
                      <Box mt={1}>
                        <Typography variant="caption" gutterBottom>
                          Rollout: {flag.percentage}%
                        </Typography>
                        <Slider
                          value={flag.percentage}
                          onChange={(e, value) =>
                            handleUpdatePercentage(flag.name, value as number)
                          }
                          sx={{ width: 200 }}
                        />
                      </Box>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={flag.enabled}
                    onChange={(e) => handleToggleFlag(flag.name, e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

const EnvironmentVariablesPanel: React.FC = () => {
  const [environment, setEnvironment] = useState('development');
  const { data: envVars, mutate: refreshEnvVars } = useSWR<EnvVariable[]>(
    `${API_BASE_URL}/admin/env-vars?environment=${environment}`,
    fetcher
  );

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<EnvVariable | null>(null);

  return (
    <Card>
      <CardHeader
        title="Environment Variables"
        action={
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Environment</InputLabel>
            <Select
              value={environment}
              label="Environment"
              onChange={(e) => setEnvironment(e.target.value)}
            >
              <MenuItem value="development">Development</MenuItem>
              <MenuItem value="staging">Staging</MenuItem>
              <MenuItem value="production">Production</MenuItem>
            </Select>
          </FormControl>
        }
      />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Key</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {envVars?.map((envVar) => (
                <TableRow key={envVar.key}>
                  <TableCell>{envVar.key}</TableCell>
                  <TableCell>{envVar.value}</TableCell>
                  <TableCell>
                    {new Date(envVar.updatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingVar(envVar);
                        setEditDialogOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

const SecretsPanel: React.FC = () => {
  const [environment, setEnvironment] = useState('development');
  const { data: secrets, mutate: refreshSecrets } = useSWR<Secret[]>(
    `${API_BASE_URL}/admin/secrets?environment=${environment}`,
    fetcher
  );

  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  const toggleSecretVisibility = (key: string) => {
    const newVisible = new Set(visibleSecrets);
    if (newVisible.has(key)) {
      newVisible.delete(key);
    } else {
      newVisible.add(key);
    }
    setVisibleSecrets(newVisible);
  };

  return (
    <Card>
      <CardHeader
        title="Secrets Management"
        action={
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Environment</InputLabel>
            <Select
              value={environment}
              label="Environment"
              onChange={(e) => setEnvironment(e.target.value)}
            >
              <MenuItem value="development">Development</MenuItem>
              <MenuItem value="staging">Staging</MenuItem>
              <MenuItem value="production">Production</MenuItem>
            </Select>
          </FormControl>
        }
      />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Key</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {secrets?.map((secret) => (
                <TableRow key={secret.key}>
                  <TableCell>{secret.key}</TableCell>
                  <TableCell>
                    {visibleSecrets.has(secret.key)
                      ? secret.value
                      : '••••••••'}
                  </TableCell>
                  <TableCell>
                    {new Date(secret.updatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => toggleSecretVisibility(secret.key)}
                    >
                      {visibleSecrets.has(secret.key) ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                    <IconButton size="small">
                      <ContentCopyIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

const DocumentationSection: React.FC = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title="API Documentation" />
          <CardContent>
            <Typography variant="body1" paragraph>
              Access the full API documentation and GraphQL playground:
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                startIcon={<DescriptionIcon />}
                href={`${API_BASE_URL}/api/docs`}
                target="_blank"
              >
                OpenAPI/Swagger
              </Button>
              <Button
                variant="contained"
                startIcon={<CodeIcon />}
                href={`${API_BASE_URL}/graphql`}
                target="_blank"
              >
                GraphQL Playground
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

const WebhooksSection: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookMethod, setWebhookMethod] = useState('POST');
  const [webhookHeaders, setWebhookHeaders] = useState('{}');
  const [webhookPayload, setWebhookPayload] = useState('{}');
  const [webhookResponse, setWebhookResponse] = useState<WebhookTest['response'] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendWebhook = async () => {
    setLoading(true);
    try {
      const result = await axios.post(`${API_BASE_URL}/admin/webhooks/test`, {
        url: webhookUrl,
        method: webhookMethod,
        headers: JSON.parse(webhookHeaders),
        payload: JSON.parse(webhookPayload),
      });
      setWebhookResponse(result.data);
    } catch (error: any) {
      setWebhookResponse({
        status: 0,
        headers: {},
        body: { error: error.message },
        duration: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Webhook Tester" />
          <CardContent>
            <TextField
              fullWidth
              label="Webhook URL"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Method</InputLabel>
              <Select
                value={webhookMethod}
                label="Method"
                onChange={(e) => setWebhookMethod(e.target.value)}
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle2" gutterBottom>
              Headers (JSON)
            </Typography>
            <Editor
              height="100px"
              defaultLanguage="json"
              value={webhookHeaders}
              onChange={(value) => setWebhookHeaders(value || '{}')}
              options={{ minimap: { enabled: false } }}
            />

            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Payload (JSON)
              </Typography>
              <Editor
                height="200px"
                defaultLanguage="json"
                value={webhookPayload}
                onChange={(value) => setWebhookPayload(value || '{}')}
                options={{ minimap: { enabled: false } }}
              />
            </Box>

            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleSendWebhook}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <WebhookIcon />}
            >
              Send Webhook
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Response" />
          <CardContent>
            {webhookResponse ? (
              <>
                <Box mb={2}>
                  <Chip
                    label={`Status: ${webhookResponse.status}`}
                    color={webhookResponse.status >= 200 && webhookResponse.status < 300 ? 'success' : 'error'}
                  />
                  <Chip label={`Duration: ${webhookResponse.duration}ms`} sx={{ ml: 1 }} />
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Response Body
                </Typography>
                <Editor
                  height="400px"
                  defaultLanguage="json"
                  value={JSON.stringify(webhookResponse.body, null, 2)}
                  options={{ readOnly: true, minimap: { enabled: false } }}
                />
              </>
            ) : (
              <Typography color="textSecondary">
                Send a webhook to see the response
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

const EventsSection: React.FC<{ events: RealtimeEvent[] }> = ({ events }) => {
  return (
    <Card>
      <CardHeader title="Real-time Event Stream" />
      <CardContent>
        <Paper sx={{ maxHeight: 600, overflow: 'auto', p: 2 }}>
          {events.map((event) => (
            <Box key={event.id} mb={2}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <EventIcon fontSize="small" />
                <Typography variant="subtitle2">{event.type}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
              <Paper sx={{ p: 1, bgcolor: 'grey.100' }}>
                <Typography variant="body2" component="pre">
                  {JSON.stringify(event.data, null, 2)}
                </Typography>
              </Paper>
            </Box>
          ))}
          {events.length === 0 && (
            <Typography color="textSecondary">
              No events received yet. Events will appear here in real-time.
            </Typography>
          )}
        </Paper>
      </CardContent>
    </Card>
  );
};

export default DeveloperDashboard;
