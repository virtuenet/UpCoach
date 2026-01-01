import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Alert,
  Badge,
  Tooltip,
  LinearProgress,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  FormControlLabel,
  Drawer,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Block as BlockIcon,
  Shield as ShieldIcon,
  BugReport as BugReportIcon,
  Notifications as NotificationsIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Flag as FlagIcon,
  Visibility as VisibilityIcon,
  Public as PublicIcon,
  Computer as ComputerIcon,
  NetworkCheck as NetworkCheckIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  ResponsiveContainer
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap
} from 'reactflow';
import useSWR from 'swr';
import 'leaflet/dist/leaflet.css';
import 'reactflow/dist/style.css';

// ============================================================================
// INTERFACES
// ============================================================================

interface SecurityMetrics {
  threatScore: number;
  activeIncidents: number;
  blockedAttacks: number;
  trustScoreAverage: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  alertsToday: number;
  complianceScore: number;
}

interface ThreatEvent {
  id: string;
  timestamp: Date;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  sourceIp: string;
  sourceCountry: string;
  sourceLatitude: number;
  sourceLongitude: number;
  targetIp: string;
  targetLatitude: number;
  targetLongitude: number;
  threatScore: number;
  blocked: boolean;
  description: string;
}

interface Incident {
  id: string;
  title: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  status: 'DETECTED' | 'TRIAGED' | 'INVESTIGATING' | 'CONTAINED' | 'ERADICATED' | 'RECOVERED' | 'CLOSED';
  assignedTo: string[];
  createdAt: Date;
  affectedSystems: number;
  playbookStatus?: string;
}

interface IPReputation {
  ipAddress: string;
  country: string;
  threatType: string[];
  reputationScore: number;
  lastSeen: Date;
  blocked: boolean;
}

interface CVE {
  cveId: string;
  description: string;
  cvssScore: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedAsset: string;
  patchStatus: 'INSTALLED' | 'PENDING' | 'OVERDUE';
  exploitAvailable: boolean;
  publishedDate: Date;
}

interface Alert {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  acknowledged: boolean;
}

interface TrustScoreDistribution {
  range: string;
  count: number;
}

interface DevicePosture {
  compliant: number;
  nonCompliant: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SecurityDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidentDetailOpen, setIncidentDetailOpen] = useState(false);
  const [ipLookupOpen, setIpLookupOpen] = useState(false);
  const [ipLookupValue, setIpLookupValue] = useState('');
  const [alertsPaused, setAlertsPaused] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [severityFilter, setSeverityFilter] = useState<string[]>(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

  // SWR data fetching
  const { data: metrics, error: metricsError } = useSWR<SecurityMetrics>(
    '/api/security/metrics',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: threats, error: threatsError } = useSWR<ThreatEvent[]>(
    `/api/security/threats?timeRange=${timeRange}`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: incidents, error: incidentsError } = useSWR<Incident[]>(
    '/api/security/incidents?status=DETECTED,TRIAGED,INVESTIGATING,CONTAINED',
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: ipReputations, error: ipReputationsError } = useSWR<IPReputation[]>(
    '/api/security/ip-reputation?limit=100',
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: vulnerabilities, error: vulnerabilitiesError } = useSWR<CVE[]>(
    '/api/security/vulnerabilities?status=PENDING,OVERDUE',
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: alerts, error: alertsError } = useSWR<Alert[]>(
    '/api/security/alerts?acknowledged=false',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: trustScoreDistribution } = useSWR<TrustScoreDistribution[]>(
    '/api/security/trust-score-distribution',
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: devicePosture } = useSWR<DevicePosture>(
    '/api/security/device-posture',
    fetcher,
    { refreshInterval: 30000 }
  );

  // WebSocket for real-time alerts
  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');

    ws.onmessage = (event) => {
      const alert = JSON.parse(event.data);
      if (!alertsPaused) {
        // Handle new alert
        console.log('New alert:', alert);
      }
    };

    return () => ws.close();
  }, [alertsPaused]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setIncidentDetailOpen(true);
  };

  // ============================================================================
  // TAB 1: OVERVIEW
  // ============================================================================

  const renderOverviewTab = () => (
    <Box>
      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Threat Score
                  </Typography>
                  <Typography variant="h4" sx={{ color: getThreatScoreColor(metrics?.threatScore || 0) }}>
                    {metrics?.threatScore || 0}
                  </Typography>
                </Box>
                <ShieldIcon sx={{ fontSize: 48, color: getThreatScoreColor(metrics?.threatScore || 0), opacity: 0.3 }} />
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics?.threatScore || 0}
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
                color={metrics?.threatScore && metrics.threatScore > 70 ? 'error' : metrics?.threatScore && metrics.threatScore > 40 ? 'warning' : 'success'}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Active Incidents
                  </Typography>
                  <Typography variant="h4" color={metrics?.activeIncidents && metrics.activeIncidents > 0 ? 'error.main' : 'text.primary'}>
                    {metrics?.activeIncidents || 0}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Requires attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Blocked Attacks
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {metrics?.blockedAttacks || 0}
                  </Typography>
                </Box>
                <BlockIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Last 24 hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Compliance Score
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {metrics?.complianceScore || 0}%
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                SOC 2 / GDPR / HIPAA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Threat Score Trend Chart */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Threat Score Trend (Last 24 Hours)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={generateThreatTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#f44336" strokeWidth={2} name="Threat Score" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Vulnerabilities by Severity
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Critical', value: metrics?.vulnerabilities.critical || 0, color: '#d32f2f' },
                    { name: 'High', value: metrics?.vulnerabilities.high || 0, color: '#f57c00' },
                    { name: 'Medium', value: metrics?.vulnerabilities.medium || 0, color: '#fbc02d' },
                    { name: 'Low', value: metrics?.vulnerabilities.low || 0, color: '#388e3c' }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {[
                    { color: '#d32f2f' },
                    { color: '#f57c00' },
                    { color: '#fbc02d' },
                    { color: '#388e3c' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Attack Vectors Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Attack Vectors (Last 7 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={generateAttackVectorData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ============================================================================
  // TAB 2: THREAT INTELLIGENCE
  // ============================================================================

  const renderThreatIntelligenceTab = () => (
    <Box>
      {/* Real-Time Threat Map */}
      <Paper sx={{ p: 3, mb: 3, height: 500 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Real-Time Threat Map
          </Typography>
          <Box>
            <FormControl size="small" sx={{ mr: 2, minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} label="Time Range">
                <MenuItem value="1h">Last 1 Hour</MenuItem>
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ height: 400 }}>
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {threats?.map((threat) => (
              <React.Fragment key={threat.id}>
                <Marker position={[threat.sourceLatitude, threat.sourceLongitude]}>
                  <Popup>
                    <Typography variant="subtitle2">{threat.type}</Typography>
                    <Typography variant="body2">IP: {threat.sourceIp}</Typography>
                    <Typography variant="body2">Country: {threat.sourceCountry}</Typography>
                    <Typography variant="body2">Score: {threat.threatScore}</Typography>
                    <Chip
                      label={threat.blocked ? 'BLOCKED' : 'ACTIVE'}
                      color={threat.blocked ? 'success' : 'error'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Popup>
                </Marker>
                <Polyline
                  positions={[
                    [threat.sourceLatitude, threat.sourceLongitude],
                    [threat.targetLatitude, threat.targetLongitude]
                  ]}
                  color={getSeverityColor(threat.severity)}
                  weight={3}
                  opacity={0.6}
                />
              </React.Fragment>
            ))}
          </MapContainer>
        </Box>
      </Paper>

      {/* Live Threat Feed */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Live Threat Feed
              </Typography>
              <Chip
                label={alertsPaused ? 'PAUSED' : 'LIVE'}
                color={alertsPaused ? 'default' : 'success'}
                icon={alertsPaused ? <StopIcon /> : <PlayArrowIcon />}
                onClick={() => setAlertsPaused(!alertsPaused)}
              />
            </Box>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Threat Type</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {threats?.slice(0, 20).map((threat) => (
                    <TableRow key={threat.id} hover>
                      <TableCell>{formatTime(threat.timestamp)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {threat.sourceIp}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <span className={`fi fi-${threat.sourceCountry.toLowerCase()}`} style={{ marginRight: 8 }} />
                          {threat.sourceCountry}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={threat.type} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={threat.threatScore}
                          size="small"
                          color={threat.threatScore > 80 ? 'error' : threat.threatScore > 50 ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={threat.blocked ? 'BLOCKED' : 'ACTIVE'}
                          size="small"
                          color={threat.blocked ? 'success' : 'error'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              IP Reputation Lookup
            </Typography>
            <TextField
              fullWidth
              label="IP Address"
              value={ipLookupValue}
              onChange={(e) => setIpLookupValue(e.target.value)}
              size="small"
              sx={{ mb: 2 }}
            />
            <Button
              fullWidth
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => setIpLookupOpen(true)}
            >
              Lookup
            </Button>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Threat Statistics
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Threats Detected Today"
                  secondary={threats?.length || 0}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Blocked IPs"
                  secondary={ipReputations?.filter(ip => ip.blocked).length || 0}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Tor Exit Nodes"
                  secondary={ipReputations?.filter(ip => ip.threatType.includes('TOR_EXIT_NODE')).length || 0}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Malicious IPs"
                  secondary={ipReputations?.filter(ip => ip.reputationScore > 70).length || 0}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ============================================================================
  // TAB 3: INCIDENTS
  // ============================================================================

  const renderIncidentsTab = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#d32f2f', color: 'white' }}>
            <CardContent>
              <Typography variant="h3">{incidents?.filter(i => i.severity === 'CRITICAL').length || 0}</Typography>
              <Typography variant="body2">Critical Incidents</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#f57c00', color: 'white' }}>
            <CardContent>
              <Typography variant="h3">{incidents?.filter(i => i.severity === 'HIGH').length || 0}</Typography>
              <Typography variant="body2">High Severity</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#fbc02d', color: 'white' }}>
            <CardContent>
              <Typography variant="h3">{incidents?.filter(i => i.severity === 'MEDIUM').length || 0}</Typography>
              <Typography variant="body2">Medium Severity</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#388e3c', color: 'white' }}>
            <CardContent>
              <Typography variant="h3">{incidents?.filter(i => i.severity === 'LOW').length || 0}</Typography>
              <Typography variant="body2">Low Severity</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Active Incidents
          </Typography>
          <Box>
            <IconButton>
              <FilterListIcon />
            </IconButton>
            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidents?.map((incident) => (
                <TableRow key={incident.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {incident.id.substring(0, 8)}
                    </Typography>
                  </TableCell>
                  <TableCell>{incident.title}</TableCell>
                  <TableCell>
                    <Chip label={incident.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getSeverityIcon(incident.severity)}
                      label={incident.severity}
                      size="small"
                      color={getSeverityChipColor(incident.severity)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.status}
                      size="small"
                      color={getStatusColor(incident.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {incident.assignedTo.slice(0, 2).join(', ')}
                    {incident.assignedTo.length > 2 && ` +${incident.assignedTo.length - 2}`}
                  </TableCell>
                  <TableCell>{formatTime(incident.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleIncidentClick(incident)}>
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Incident Metrics */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Incident Response Metrics (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={generateIncidentMetricsData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="mttd" stroke="#1976d2" strokeWidth={2} name="MTTD (min)" />
                <Line type="monotone" dataKey="mttr" stroke="#388e3c" strokeWidth={2} name="MTTR (min)" />
                <Line type="monotone" dataKey="mttc" stroke="#f57c00" strokeWidth={2} name="MTTC (min)" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ============================================================================
  // TAB 4: ZERO TRUST
  // ============================================================================

  const renderZeroTrustTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Trust Score Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trustScoreDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Device Posture Summary
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Compliant', value: devicePosture?.compliant || 0, color: '#388e3c' },
                    { name: 'Non-Compliant', value: devicePosture?.nonCompliant || 0, color: '#d32f2f' }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  <Cell fill="#388e3c" />
                  <Cell fill="#d32f2f" />
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Network Segmentation Map
            </Typography>
            <Box sx={{ height: 500 }}>
              <ReactFlow
                nodes={generateNetworkNodes()}
                edges={generateNetworkEdges()}
                fitView
              >
                <Background />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Unusual Access Alerts
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Anomaly Type</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generateUnusualAccessAlerts().map((alert, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{alert.user}</TableCell>
                      <TableCell>
                        <Chip label={alert.type} size="small" />
                      </TableCell>
                      <TableCell>{alert.details}</TableCell>
                      <TableCell>
                        <Chip label={alert.severity} size="small" color={getSeverityChipColor(alert.severity)} />
                      </TableCell>
                      <TableCell>{formatTime(alert.timestamp)}</TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined">
                          Investigate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // ============================================================================
  // TAB 5: VULNERABILITIES
  // ============================================================================

  const renderVulnerabilitiesTab = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="error.main">
                {vulnerabilities?.filter(v => v.severity === 'CRITICAL').length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Critical CVEs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="warning.main">
                {vulnerabilities?.filter(v => v.patchStatus === 'OVERDUE').length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Overdue Patches
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="primary.main">
                {vulnerabilities?.filter(v => v.exploitAvailable).length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Public Exploits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="success.main">
                {vulnerabilities?.filter(v => v.patchStatus === 'INSTALLED').length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Patched
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Vulnerability Queue (Risk-Based Priority)
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>CVE ID</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>CVSS Score</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Affected Asset</TableCell>
                <TableCell>Patch Status</TableCell>
                <TableCell>Exploit</TableCell>
                <TableCell>Published</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vulnerabilities?.slice(0, 20).map((cve) => (
                <TableRow key={cve.cveId} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {cve.cveId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={cve.description}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {cve.description}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cve.cvssScore.toFixed(1)}
                      size="small"
                      color={cve.cvssScore >= 9 ? 'error' : cve.cvssScore >= 7 ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={cve.severity} size="small" color={getSeverityChipColor(cve.severity)} />
                  </TableCell>
                  <TableCell>{cve.affectedAsset}</TableCell>
                  <TableCell>
                    <Chip
                      label={cve.patchStatus}
                      size="small"
                      color={
                        cve.patchStatus === 'INSTALLED' ? 'success' :
                        cve.patchStatus === 'OVERDUE' ? 'error' : 'warning'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {cve.exploitAvailable && (
                      <Tooltip title="Public exploit available">
                        <FlagIcon color="error" fontSize="small" />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(cve.publishedDate)}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined">
                      Patch
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );

  // ============================================================================
  // TAB 6: COMPLIANCE
  // ============================================================================

  const renderComplianceTab = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                SOC 2 Type II
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" my={2}>
                <CircularProgress
                  variant="determinate"
                  value={95}
                  size={120}
                  thickness={5}
                  color="success"
                />
                <Box position="absolute">
                  <Typography variant="h4" color="success.main">
                    95%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary" align="center">
                Compliant
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                GDPR
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" my={2}>
                <CircularProgress
                  variant="determinate"
                  value={88}
                  size={120}
                  thickness={5}
                  color="primary"
                />
                <Box position="absolute">
                  <Typography variant="h4" color="primary.main">
                    88%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary" align="center">
                Compliant
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                HIPAA
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" my={2}>
                <CircularProgress
                  variant="determinate"
                  value={92}
                  size={120}
                  thickness={5}
                  color="success"
                />
                <Box position="absolute">
                  <Typography variant="h4" color="success.main">
                    92%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary" align="center">
                Compliant
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Audit Logs
        </Typography>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {generateAuditLogs().map((log, index) => (
                <TableRow key={index} hover>
                  <TableCell>{formatTime(log.timestamp)}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell fontFamily="monospace">{log.ipAddress}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.status}
                      size="small"
                      color={log.status === 'SUCCESS' ? 'success' : 'error'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Compliance Reports
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ justifyContent: 'flex-start' }}
            >
              SOC 2 Audit Report (Q4 2025)
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ justifyContent: 'flex-start' }}
            >
              GDPR Data Protection Impact Assessment
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ justifyContent: 'flex-start' }}
            >
              HIPAA Security Risk Assessment
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ justifyContent: 'flex-start' }}
            >
              PCI-DSS Compliance Report
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  // ============================================================================
  // MODALS & DIALOGS
  // ============================================================================

  const IncidentDetailDialog = () => (
    <Dialog
      open={incidentDetailOpen}
      onClose={() => setIncidentDetailOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{selectedIncident?.title}</Typography>
          <IconButton onClick={() => setIncidentDetailOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {selectedIncident && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Incident ID
                </Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {selectedIncident.id}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Severity
                </Typography>
                <Chip label={selectedIncident.severity} color={getSeverityChipColor(selectedIncident.severity)} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Type
                </Typography>
                <Typography variant="body1">{selectedIncident.type}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Chip label={selectedIncident.status} color={getStatusColor(selectedIncident.status)} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Incident Timeline
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {generateIncidentTimeline().map((event, index) => (
                <Box key={index} display="flex" alignItems="flex-start" mb={2}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      mt: 0.5,
                      mr: 2
                    }}
                  />
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight="bold">
                      {event.action}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatTime(event.timestamp)} - {event.actor}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {selectedIncident.playbookStatus && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Playbook Execution
                </Typography>
                <Box>
                  <LinearProgress variant="determinate" value={65} sx={{ mb: 1 }} />
                  <Typography variant="caption" color="textSecondary">
                    Step 3 of 5: Collecting evidence
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setIncidentDetailOpen(false)}>Close</Button>
        <Button variant="contained" color="primary">
          Take Action
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  if (metricsError) {
    return (
      <Alert severity="error">
        Failed to load security metrics. Please try again later.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Security Operations Center
        </Typography>
        <Badge badgeContent={alerts?.length || 0} color="error">
          <IconButton>
            <NotificationsIcon />
          </IconButton>
        </Badge>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" icon={<SecurityIcon />} iconPosition="start" />
          <Tab label="Threat Intelligence" icon={<PublicIcon />} iconPosition="start" />
          <Tab label="Incidents" icon={<WarningIcon />} iconPosition="start" />
          <Tab label="Zero Trust" icon={<LockIcon />} iconPosition="start" />
          <Tab label="Vulnerabilities" icon={<BugReportIcon />} iconPosition="start" />
          <Tab label="Compliance" icon={<AssessmentIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderOverviewTab()}
      {activeTab === 1 && renderThreatIntelligenceTab()}
      {activeTab === 2 && renderIncidentsTab()}
      {activeTab === 3 && renderZeroTrustTab()}
      {activeTab === 4 && renderVulnerabilitiesTab()}
      {activeTab === 5 && renderComplianceTab()}

      <IncidentDetailDialog />
    </Box>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const fetcher = (url: string) => fetch(url).then(res => res.json());

const getThreatScoreColor = (score: number): string => {
  if (score > 70) return '#d32f2f';
  if (score > 40) return '#f57c00';
  return '#388e3c';
};

const getSeverityColor = (severity: string): string => {
  const colors: Record<string, string> = {
    CRITICAL: '#d32f2f',
    HIGH: '#f57c00',
    MEDIUM: '#fbc02d',
    LOW: '#388e3c',
    INFO: '#1976d2'
  };
  return colors[severity] || '#1976d2';
};

const getSeverityChipColor = (severity: string): 'error' | 'warning' | 'success' | 'default' => {
  const colors: Record<string, 'error' | 'warning' | 'success' | 'default'> = {
    CRITICAL: 'error',
    HIGH: 'warning',
    MEDIUM: 'warning',
    LOW: 'success',
    INFORMATIONAL: 'default'
  };
  return colors[severity] || 'default';
};

const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
  const colors: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
    DETECTED: 'error',
    TRIAGED: 'warning',
    INVESTIGATING: 'primary',
    CONTAINED: 'warning',
    ERADICATED: 'primary',
    RECOVERED: 'success',
    CLOSED: 'success'
  };
  return colors[status] || 'default';
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
      return <ErrorIcon fontSize="small" />;
    case 'HIGH':
      return <WarningIcon fontSize="small" />;
    case 'MEDIUM':
      return <InfoIcon fontSize="small" />;
    default:
      return <CheckCircleIcon fontSize="small" />;
  }
};

const formatTime = (date: Date): string => {
  return new Date(date).toLocaleString();
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString();
};

// Mock data generators
const generateThreatTrendData = () => {
  const data = [];
  for (let i = 24; i >= 0; i--) {
    data.push({
      time: `${i}h ago`,
      score: Math.floor(Math.random() * 40) + 20
    });
  }
  return data;
};

const generateAttackVectorData = () => [
  { name: 'SQL Injection', count: 245 },
  { name: 'XSS', count: 189 },
  { name: 'Brute Force', count: 156 },
  { name: 'CSRF', count: 98 },
  { name: 'Path Traversal', count: 67 },
  { name: 'Command Injection', count: 45 }
];

const generateIncidentMetricsData = () => {
  const data = [];
  for (let i = 30; i >= 0; i--) {
    data.push({
      day: `Day ${31 - i}`,
      mttd: Math.floor(Math.random() * 30) + 10,
      mttr: Math.floor(Math.random() * 60) + 20,
      mttc: Math.floor(Math.random() * 90) + 30
    });
  }
  return data;
};

const generateNetworkNodes = (): Node[] => [
  { id: '1', type: 'input', data: { label: 'API Gateway' }, position: { x: 250, y: 0 } },
  { id: '2', data: { label: 'Auth Service' }, position: { x: 100, y: 100 } },
  { id: '3', data: { label: 'User Service' }, position: { x: 250, y: 100 } },
  { id: '4', data: { label: 'Payment Service' }, position: { x: 400, y: 100 } },
  { id: '5', data: { label: 'Database' }, position: { x: 250, y: 200 } }
];

const generateNetworkEdges = (): Edge[] => [
  { id: 'e1-2', source: '1', target: '2', label: 'mTLS', animated: true },
  { id: 'e1-3', source: '1', target: '3', label: 'mTLS', animated: true },
  { id: 'e1-4', source: '1', target: '4', label: 'mTLS', animated: true },
  { id: 'e2-5', source: '2', target: '5', label: 'Encrypted' },
  { id: 'e3-5', source: '3', target: '5', label: 'Encrypted' },
  { id: 'e4-5', source: '4', target: '5', label: 'Encrypted' }
];

const generateUnusualAccessAlerts = () => [
  {
    user: 'john.doe@upcoach.com',
    type: 'Location Anomaly',
    details: 'Login from Russia (usual: USA)',
    severity: 'HIGH' as const,
    timestamp: new Date()
  },
  {
    user: 'jane.smith@upcoach.com',
    type: 'Time Anomaly',
    details: 'Login at 3:00 AM (usual: 9-5)',
    severity: 'MEDIUM' as const,
    timestamp: new Date(Date.now() - 3600000)
  },
  {
    user: 'admin@upcoach.com',
    type: 'Geo-Velocity',
    details: 'Impossible travel: NYC → Tokyo in 1 hour',
    severity: 'CRITICAL' as const,
    timestamp: new Date(Date.now() - 7200000)
  }
];

const generateIncidentTimeline = () => [
  { timestamp: new Date(), action: 'Incident detected', actor: 'SYSTEM' },
  { timestamp: new Date(Date.now() - 300000), action: 'Assigned to SOC team', actor: 'Auto-Triage' },
  { timestamp: new Date(Date.now() - 600000), action: 'Playbook execution started', actor: 'security@upcoach.com' },
  { timestamp: new Date(Date.now() - 900000), action: 'Evidence collected', actor: 'SYSTEM' },
  { timestamp: new Date(Date.now() - 1200000), action: 'Malicious IPs blocked', actor: 'SYSTEM' }
];

const generateAuditLogs = () => {
  const logs = [];
  for (let i = 0; i < 20; i++) {
    logs.push({
      timestamp: new Date(Date.now() - i * 60000),
      user: `user${i}@upcoach.com`,
      action: ['LOGIN', 'LOGOUT', 'DATA_ACCESS', 'CONFIG_CHANGE'][Math.floor(Math.random() * 4)],
      resource: `/api/v1/resource/${i}`,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      status: Math.random() > 0.1 ? 'SUCCESS' : 'FAILED'
    });
  }
  return logs;
};

export default SecurityDashboard;
