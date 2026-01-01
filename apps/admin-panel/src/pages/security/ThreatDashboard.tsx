/**
 * Advanced Threat Detection and Response Dashboard
 *
 * Comprehensive security operations center (SOC) dashboard with real-time threat monitoring,
 * SIEM, EDR, penetration testing, threat hunting, and attack surface management
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  FormControlLabel,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Computer as ComputerIcon,
  NetworkCheck as NetworkIcon,
  BugReport as BugIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Map as MapIcon,
  Assessment as AssessmentIcon,
  Shield as ShieldIcon,
  VpnLock as VpnLockIcon,
  Storage as StorageIcon,
  Language as LanguageIcon,
  Policy as PolicyIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Notifications as NotificationsIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';
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
  Treemap,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import ReactFlow, { Background, Controls, MiniMap, Node, Edge } from 'reactflow';
import Editor from '@monaco-editor/react';
import useSWR from 'swr';
import 'leaflet/dist/leaflet.css';
import 'reactflow/dist/style.css';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface Alert {
  id: string;
  timestamp: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  source: string;
  mitreAttack?: string[];
  status: 'new' | 'investigating' | 'resolved';
  assignedTo?: string;
}

interface Endpoint {
  id: string;
  hostname: string;
  ipAddress: string;
  platform: string;
  status: 'online' | 'offline' | 'isolated';
  riskScore: number;
  threats: number;
}

interface Vulnerability {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss: number;
  cve?: string;
  asset: string;
  status: 'open' | 'in_progress' | 'resolved';
}

interface PentestJob {
  id: string;
  name: string;
  type: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  progress: number;
  findings: number;
}

interface ThreatEvent {
  id: string;
  timestamp: Date;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  sourceIp?: string;
  sourceCountry?: string;
  mitreAttack?: string;
}

interface MITRECoverage {
  tactic: string;
  techniques: {
    id: string;
    name: string;
    tested: boolean;
    detected: boolean;
  }[];
  coverage: number;
}

// ============================================================================
// Constants
// ============================================================================

const SEVERITY_COLORS = {
  critical: '#d32f2f',
  high: '#f57c00',
  medium: '#fbc02d',
  low: '#388e3c',
  info: '#1976d2'
};

const MITRE_TACTICS = [
  { id: 'TA0001', name: 'Initial Access' },
  { id: 'TA0002', name: 'Execution' },
  { id: 'TA0003', name: 'Persistence' },
  { id: 'TA0004', name: 'Privilege Escalation' },
  { id: 'TA0005', name: 'Defense Evasion' },
  { id: 'TA0006', name: 'Credential Access' },
  { id: 'TA0007', name: 'Discovery' },
  { id: 'TA0008', name: 'Lateral Movement' },
  { id: 'TA0009', name: 'Collection' },
  { id: 'TA0010', name: 'Exfiltration' },
  { id: 'TA0011', name: 'Command and Control' },
  { id: 'TA0040', name: 'Impact' }
];

// ============================================================================
// Main Component
// ============================================================================

export default function ThreatDashboard(): JSX.Element {
  const [currentTab, setCurrentTab] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);

  // Fetch data with SWR
  const { data: alerts, mutate: refreshAlerts } = useSWR<Alert[]>(
    '/api/security/alerts',
    fetcher,
    { refreshInterval: autoRefresh ? 5000 : 0 }
  );

  const { data: endpoints } = useSWR<Endpoint[]>(
    '/api/security/endpoints',
    fetcher,
    { refreshInterval: autoRefresh ? 10000 : 0 }
  );

  const { data: vulnerabilities } = useSWR<Vulnerability[]>(
    '/api/security/vulnerabilities',
    fetcher,
    { refreshInterval: autoRefresh ? 30000 : 0 }
  );

  const { data: pentestJobs } = useSWR<PentestJob[]>(
    '/api/security/pentest-jobs',
    fetcher,
    { refreshInterval: autoRefresh ? 10000 : 0 }
  );

  const { data: metrics } = useSWR(
    '/api/security/metrics',
    fetcher,
    { refreshInterval: autoRefresh ? 5000 : 0 }
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ShieldIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Threat Detection & Response
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Advanced Security Operations Center
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={<Switch checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
            label="Auto Refresh"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              refreshAlerts();
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            color="primary"
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Alert Banner */}
      {alerts && alerts.filter(a => a.severity === 'critical' && a.status === 'new').length > 0 && (
        <Alert
          severity="error"
          icon={<ErrorIcon />}
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small">
              View All
            </Button>
          }
        >
          {alerts.filter(a => a.severity === 'critical' && a.status === 'new').length} critical alerts require immediate attention
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="scrollable">
          <Tab icon={<AssessmentIcon />} label="Overview" />
          <Tab icon={<StorageIcon />} label="SIEM" />
          <Tab icon={<ComputerIcon />} label="EDR" />
          <Tab icon={<BugIcon />} label="Penetration Testing" />
          <Tab icon={<SearchIcon />} label="Threat Hunting" />
          <Tab icon={<MapIcon />} label="Attack Surface" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      {currentTab === 0 && <OverviewTab alerts={alerts || []} endpoints={endpoints || []} metrics={metrics} />}
      {currentTab === 1 && <SIEMTab />}
      {currentTab === 2 && <EDRTab endpoints={endpoints || []} />}
      {currentTab === 3 && <PentestTab jobs={pentestJobs || []} vulnerabilities={vulnerabilities || []} />}
      {currentTab === 4 && <ThreatHuntingTab />}
      {currentTab === 5 && <AttackSurfaceTab />}

      {/* Alert Dialog */}
      <Dialog
        open={alertDialogOpen}
        onClose={() => setAlertDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Alert Details</DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Typography variant="h6">{selectedAlert.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedAlert.description}
              </Typography>
              {/* Add more alert details */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialogOpen(false)}>Close</Button>
          <Button variant="contained">Investigate</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================================
// Overview Tab
// ============================================================================

function OverviewTab({ alerts, endpoints, metrics }: { alerts: Alert[]; endpoints: Endpoint[]; metrics: any }): JSX.Element {
  const [threatFeed, setThreatFeed] = useState<ThreatEvent[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);

  // Simulate real-time threat feed
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent: ThreatEvent = {
        id: Math.random().toString(36),
        timestamp: new Date(),
        type: ['Authentication', 'Network', 'Malware', 'Data Exfiltration'][Math.floor(Math.random() * 4)],
        severity: ['critical', 'high', 'medium', 'low', 'info'][Math.floor(Math.random() * 5)] as any,
        message: 'Suspicious activity detected',
        sourceIp: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        sourceCountry: ['US', 'CN', 'RU', 'BR', 'IN'][Math.floor(Math.random() * 5)]
      };

      setThreatFeed(prev => [newEvent, ...prev].slice(0, 100));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll threat feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [threatFeed]);

  // Metrics data
  const alertsBySeverity = [
    { name: 'Critical', value: alerts.filter(a => a.severity === 'critical').length, color: SEVERITY_COLORS.critical },
    { name: 'High', value: alerts.filter(a => a.severity === 'high').length, color: SEVERITY_COLORS.high },
    { name: 'Medium', value: alerts.filter(a => a.severity === 'medium').length, color: SEVERITY_COLORS.medium },
    { name: 'Low', value: alerts.filter(a => a.severity === 'low').length, color: SEVERITY_COLORS.low }
  ];

  const timelineData = [
    { stage: 'Initial Access', count: 12, color: '#1976d2' },
    { stage: 'Execution', count: 8, color: '#388e3c' },
    { stage: 'Persistence', count: 5, color: '#f57c00' },
    { stage: 'Privilege Escalation', count: 3, color: '#d32f2f' },
    { stage: 'Defense Evasion', count: 7, color: '#7b1fa2' },
    { stage: 'Credential Access', count: 4, color: '#c2185b' },
    { stage: 'Discovery', count: 10, color: '#0097a7' },
    { stage: 'Lateral Movement', count: 2, color: '#fbc02d' },
    { stage: 'Collection', count: 6, color: '#5d4037' },
    { stage: 'Exfiltration', count: 1, color: '#d32f2f' }
  ];

  const mttrData = [
    { metric: 'MTTD', value: 4.2, target: 5.0 },
    { metric: 'MTTR', value: 12.5, target: 15.0 },
    { metric: 'MTTI', value: 8.3, target: 10.0 }
  ];

  // Threat locations
  const threatLocations = [
    { lat: 40.7128, lng: -74.0060, country: 'US', count: 45 },
    { lat: 39.9042, lng: 116.4074, country: 'CN', count: 32 },
    { lat: 55.7558, lng: 37.6173, country: 'RU', count: 28 },
    { lat: -23.5505, lng: -46.6333, country: 'BR', count: 15 },
    { lat: 28.6139, lng: 77.2090, country: 'IN', count: 22 }
  ];

  return (
    <Grid container spacing={3}>
      {/* Real-Time Threat Feed */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: 400 }}>
          <CardHeader
            title="Real-Time Threat Feed"
            avatar={<Badge badgeContent={threatFeed.length} color="error"><NotificationsIcon /></Badge>}
            action={
              <IconButton size="small">
                <RefreshIcon />
              </IconButton>
            }
          />
          <CardContent sx={{ p: 0 }}>
            <Box
              ref={feedRef}
              sx={{
                height: 320,
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 3 }
              }}
            >
              <List dense>
                {threatFeed.map((event) => (
                  <React.Fragment key={event.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: SEVERITY_COLORS[event.severity]
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" noWrap>
                            {event.type} - {event.message}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {event.timestamp.toLocaleTimeString()} • {event.sourceIp} ({event.sourceCountry})
                          </Typography>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Attack Timeline */}
      <Grid item xs={12} md={8}>
        <Card sx={{ height: 400 }}>
          <CardHeader title="Attack Timeline (MITRE ATT&CK)" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timelineData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="stage" width={150} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#8884d8">
                  {timelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Alerts by Severity */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: 350 }}>
          <CardHeader title="Alerts by Severity" />
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={alertsBySeverity}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {alertsBySeverity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Geographic Threat Heatmap */}
      <Grid item xs={12} md={8}>
        <Card sx={{ height: 350 }}>
          <CardHeader title="Geographic Threat Heatmap" />
          <CardContent sx={{ p: 1 }}>
            <Box sx={{ height: 280, position: 'relative' }}>
              <MapContainer
                center={[20, 0]}
                zoom={2}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {threatLocations.map((location, index) => (
                  <React.Fragment key={index}>
                    <Circle
                      center={[location.lat, location.lng]}
                      radius={location.count * 10000}
                      fillColor="#d32f2f"
                      fillOpacity={0.3}
                      stroke={false}
                    />
                    <Marker position={[location.lat, location.lng]}>
                      <Popup>
                        <strong>{location.country}</strong>
                        <br />
                        Threats: {location.count}
                      </Popup>
                    </Marker>
                  </React.Fragment>
                ))}
              </MapContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* MTTD/MTTR Metrics */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title="Detection & Response Metrics" />
          <CardContent>
            <Grid container spacing={3}>
              {mttrData.map((metric) => (
                <Grid item xs={12} md={4} key={metric.metric}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{metric.metric}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {metric.value} min
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(metric.value / metric.target) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: metric.value <= metric.target ? '#388e3c' : '#f57c00'
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Target: {metric.target} min
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// ============================================================================
// SIEM Tab
// ============================================================================

function SIEMTab(): JSX.Element {
  const [query, setQuery] = useState('eventType:authentication AND result:failure');
  const [liveStream, setLiveStream] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    // Simulate live log stream via WebSocket
    const ws = new WebSocket('ws://localhost:3000/api/security/logs/stream');

    ws.onmessage = (event) => {
      const log = JSON.parse(event.data);
      setLiveStream(prev => [log, ...prev].slice(0, 50));
    };

    return () => ws.close();
  }, []);

  const logSources = [
    { id: 'firewall', name: 'Firewall', status: 'healthy', eps: 1250 },
    { id: 'ids', name: 'IDS/IPS', status: 'healthy', eps: 890 },
    { id: 'web', name: 'Web Server', status: 'degraded', eps: 2340 },
    { id: 'db', name: 'Database', status: 'healthy', eps: 450 },
    { id: 'ad', name: 'Active Directory', status: 'healthy', eps: 320 }
  ];

  return (
    <Grid container spacing={3}>
      {/* Log Search */}
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Log Search"
            action={
              <Button variant="contained" startIcon={<SearchIcon />}>
                Search
              </Button>
            }
          />
          <CardContent>
            <Box sx={{ height: 200, border: '1px solid #ddd', borderRadius: 1 }}>
              <Editor
                height="200px"
                defaultLanguage="text"
                value={query}
                onChange={(value) => setQuery(value || '')}
                options={{
                  minimap: { enabled: false },
                  lineNumbers: 'off',
                  fontSize: 14
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Live Log Stream */}
      <Grid item xs={12} md={8}>
        <Card sx={{ height: 500 }}>
          <CardHeader
            title="Live Log Stream"
            avatar={<Badge badgeContent={liveStream.length} color="primary"><TimelineIcon /></Badge>}
          />
          <CardContent sx={{ p: 0 }}>
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {liveStream.map((log, index) => (
                    <TableRow
                      key={index}
                      hover
                      onClick={() => setSelectedLog(log)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="caption">
                          {new Date().toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={['INFO', 'WARN', 'ERROR'][Math.floor(Math.random() * 3)]}
                          size="small"
                          color={Math.random() > 0.7 ? 'error' : Math.random() > 0.4 ? 'warning' : 'info'}
                        />
                      </TableCell>
                      <TableCell>firewall-01</TableCell>
                      <TableCell>network</TableCell>
                      <TableCell>Connection attempt from 192.168.1.{Math.floor(Math.random() * 255)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Log Source Health */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: 500 }}>
          <CardHeader title="Log Source Health" />
          <CardContent>
            <List>
              {logSources.map((source) => (
                <React.Fragment key={source.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: source.status === 'healthy' ? '#388e3c' : '#f57c00'
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={source.name}
                      secondary={`${source.eps} EPS`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Correlation Rules */}
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Active Correlation Rules"
            action={
              <Button variant="outlined" size="small">
                Create Rule
              </Button>
            }
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rule Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Alerts (24h)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { name: 'Brute Force Detection', type: 'Threshold', severity: 'high', alerts: 12, enabled: true },
                    { name: 'Data Exfiltration', type: 'Statistical', severity: 'critical', alerts: 3, enabled: true },
                    { name: 'Privilege Escalation', type: 'Sequence', severity: 'critical', alerts: 1, enabled: true },
                    { name: 'Port Scan Detection', type: 'Threshold', severity: 'medium', alerts: 45, enabled: true }
                  ].map((rule, index) => (
                    <TableRow key={index}>
                      <TableCell>{rule.name}</TableCell>
                      <TableCell>
                        <Chip label={rule.type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rule.severity}
                          size="small"
                          sx={{ backgroundColor: SEVERITY_COLORS[rule.severity as keyof typeof SEVERITY_COLORS], color: 'white' }}
                        />
                      </TableCell>
                      <TableCell>{rule.alerts}</TableCell>
                      <TableCell>
                        <Switch checked={rule.enabled} size="small" />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <SearchIcon fontSize="small" />
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
  );
}

// ============================================================================
// EDR Tab
// ============================================================================

function EDRTab({ endpoints }: { endpoints: Endpoint[] }): JSX.Element {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [topologyView, setTopologyView] = useState(true);

  // Network topology data
  const nodes: Node[] = endpoints.map((ep, index) => ({
    id: ep.id,
    type: 'default',
    data: {
      label: (
        <Box sx={{ textAlign: 'center' }}>
          <ComputerIcon sx={{ fontSize: 32, color: ep.status === 'isolated' ? 'error.main' : 'primary.main' }} />
          <Typography variant="caption" display="block">
            {ep.hostname}
          </Typography>
        </Box>
      )
    },
    position: { x: (index % 5) * 200, y: Math.floor(index / 5) * 150 }
  }));

  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `e${i}-${i + 1}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      animated: true
    });
  }

  return (
    <Grid container spacing={3}>
      {/* Endpoint Health Grid */}
      <Grid item xs={12} md={8}>
        <Card sx={{ height: 500 }}>
          <CardHeader
            title="Endpoint Topology"
            action={
              <ToggleButtonGroup
                value={topologyView ? 'topology' : 'grid'}
                exclusive
                size="small"
              >
                <ToggleButton value="topology" onClick={() => setTopologyView(true)}>
                  <MapIcon />
                </ToggleButton>
                <ToggleButton value="grid" onClick={() => setTopologyView(false)}>
                  <FilterIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            }
          />
          <CardContent sx={{ p: 1, height: 420 }}>
            {topologyView ? (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                attributionPosition="bottom-left"
              >
                <Background />
                <Controls />
                <MiniMap />
              </ReactFlow>
            ) : (
              <Grid container spacing={2}>
                {endpoints.map((endpoint) => (
                  <Grid item xs={6} md={4} key={endpoint.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        borderColor: endpoint.status === 'isolated' ? 'error.main' : 'divider',
                        '&:hover': { boxShadow: 2 }
                      }}
                      onClick={() => setSelectedEndpoint(endpoint)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <ComputerIcon color="primary" />
                          <Chip
                            label={endpoint.status}
                            size="small"
                            color={endpoint.status === 'online' ? 'success' : endpoint.status === 'isolated' ? 'error' : 'default'}
                          />
                        </Box>
                        <Typography variant="subtitle2" noWrap>
                          {endpoint.hostname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {endpoint.ipAddress}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption">Risk Score: {endpoint.riskScore}</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={endpoint.riskScore}
                            sx={{ mt: 0.5, height: 4 }}
                            color={endpoint.riskScore > 70 ? 'error' : endpoint.riskScore > 40 ? 'warning' : 'success'}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Endpoint Details */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: 500 }}>
          <CardHeader title="Endpoint Details" />
          <CardContent>
            {selectedEndpoint ? (
              <Box>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Hostname
                    </Typography>
                    <Typography variant="body1">{selectedEndpoint.hostname}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      IP Address
                    </Typography>
                    <Typography variant="body1">{selectedEndpoint.ipAddress}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Platform
                    </Typography>
                    <Typography variant="body1">{selectedEndpoint.platform}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedEndpoint.status}
                      size="small"
                      color={selectedEndpoint.status === 'online' ? 'success' : 'error'}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Divider />
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      startIcon={<SearchIcon />}
                    >
                      Investigate
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      color="error"
                      startIcon={<VpnLockIcon />}
                    >
                      Isolate
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body2" color="text.secondary">
                  Select an endpoint to view details
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* File Integrity Monitoring */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="File Integrity Monitoring" />
          <CardContent>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>File Path</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { path: '/etc/passwd', action: 'modified', time: '10:23:45', status: 'alert' },
                    { path: '/var/www/config.php', action: 'modified', time: '10:18:32', status: 'alert' },
                    { path: '/home/user/document.pdf', action: 'created', time: '10:15:12', status: 'normal' }
                  ].map((file, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace">
                          {file.path}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={file.action} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{file.time}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={file.status}
                          size="small"
                          color={file.status === 'alert' ? 'error' : 'success'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Quarantine Management */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Quarantine Management" />
          <CardContent>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>File</TableCell>
                    <TableCell>Threat</TableCell>
                    <TableCell>Quarantined</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { file: 'malware.exe', threat: 'Trojan.Win32', time: '2h ago' },
                    { file: 'ransomware.dll', threat: 'Ransom.Locky', time: '5h ago' }
                  ].map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace">
                          {item.file}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.threat} size="small" color="error" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{item.time}</Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="error">
                          <ErrorIcon fontSize="small" />
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
  );
}

// ============================================================================
// Penetration Testing Tab
// ============================================================================

function PentestTab({ jobs, vulnerabilities }: { jobs: PentestJob[]; vulnerabilities: Vulnerability[] }): JSX.Element {
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const mitreCoverage: MITRECoverage[] = MITRE_TACTICS.map(tactic => ({
    tactic: tactic.name,
    techniques: [
      { id: 'T1566', name: 'Phishing', tested: true, detected: true },
      { id: 'T1190', name: 'Exploit Public-Facing App', tested: true, detected: false },
      { id: 'T1078', name: 'Valid Accounts', tested: false, detected: false }
    ],
    coverage: Math.random() * 100
  }));

  return (
    <Grid container spacing={3}>
      {/* Active Pentests */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader
            title="Active Penetration Tests"
            action={
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() => setScheduleDialogOpen(true)}
              >
                Schedule Pentest
              </Button>
            }
          />
          <CardContent>
            <Stack spacing={2}>
              {jobs.filter(j => j.status === 'running').map((job) => (
                <Card key={job.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1">{job.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {job.type}
                        </Typography>
                      </Box>
                      <Chip
                        label={job.status}
                        color={job.status === 'running' ? 'primary' : job.status === 'completed' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption">Progress</Typography>
                        <Typography variant="caption">{job.progress}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={job.progress} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {job.findings} findings discovered
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Vulnerability Summary */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="Vulnerability Summary" />
          <CardContent>
            <Stack spacing={2}>
              {['critical', 'high', 'medium', 'low'].map((severity) => (
                <Box key={severity}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" textTransform="capitalize">
                      {severity}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {vulnerabilities.filter(v => v.severity === severity).length}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(vulnerabilities.filter(v => v.severity === severity).length / vulnerabilities.length) * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]
                      }
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* MITRE ATT&CK Coverage Heatmap */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title="MITRE ATT&CK Coverage Heatmap" />
          <CardContent>
            <Grid container spacing={1}>
              {mitreCoverage.map((tactic, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Card
                    variant="outlined"
                    sx={{
                      backgroundColor: `rgba(${tactic.coverage > 70 ? '56,142,60' : tactic.coverage > 40 ? '251,192,45' : '211,47,47'}, ${tactic.coverage / 100})`,
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 2 }
                    }}
                  >
                    <CardContent>
                      <Typography variant="caption" fontWeight="bold" display="block">
                        {tactic.tactic}
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 1 }}>
                        {tactic.coverage.toFixed(0)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Coverage
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Vulnerability Findings */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title="Recent Vulnerability Findings" />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>CVSS</TableCell>
                    <TableCell>CVE</TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vulnerabilities.slice(0, 10).map((vuln) => (
                    <TableRow key={vuln.id}>
                      <TableCell>{vuln.title}</TableCell>
                      <TableCell>
                        <Chip
                          label={vuln.severity}
                          size="small"
                          sx={{ backgroundColor: SEVERITY_COLORS[vuln.severity], color: 'white' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={vuln.cvss.toFixed(1)} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace">
                          {vuln.cve || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{vuln.asset}</TableCell>
                      <TableCell>
                        <Chip
                          label={vuln.status}
                          size="small"
                          color={vuln.status === 'resolved' ? 'success' : vuln.status === 'in_progress' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <SearchIcon fontSize="small" />
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

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Penetration Test</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField label="Test Name" fullWidth />
            <FormControl fullWidth>
              <InputLabel>Test Type</InputLabel>
              <Select defaultValue="full">
                <MenuItem value="full">Full Penetration Test</MenuItem>
                <MenuItem value="network">Network Scan</MenuItem>
                <MenuItem value="web">Web Application</MenuItem>
                <MenuItem value="phishing">Phishing Simulation</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Target" fullWidth />
            <FormControlLabel control={<Switch />} label="Safe Mode" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Schedule</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

// ============================================================================
// Threat Hunting Tab
// ============================================================================

function ThreatHuntingTab(): JSX.Element {
  const [query, setQuery] = useState('SELECT * FROM processes WHERE name LIKE "%powershell%"');

  return (
    <Grid container spacing={3}>
      {/* Hypothesis Builder */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title="Threat Hunting Query" />
          <CardContent>
            <Box sx={{ height: 300, border: '1px solid #ddd', borderRadius: 1 }}>
              <Editor
                height="300px"
                defaultLanguage="sql"
                value={query}
                onChange={(value) => setQuery(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14
                }}
              />
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="contained" startIcon={<PlayIcon />}>
                Execute Query
              </Button>
              <Button variant="outlined">Save Query</Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* IOC Search */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="IOC Search" />
          <CardContent>
            <Stack spacing={2}>
              <TextField
                label="IP Address"
                placeholder="192.168.1.1"
                fullWidth
                size="small"
              />
              <TextField
                label="Domain"
                placeholder="malicious.com"
                fullWidth
                size="small"
              />
              <TextField
                label="File Hash"
                placeholder="MD5/SHA256"
                fullWidth
                size="small"
              />
              <TextField
                label="File Path"
                placeholder="/path/to/file"
                fullWidth
                size="small"
              />
              <Button variant="contained" fullWidth startIcon={<SearchIcon />}>
                Search IOCs
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Behavioral Analytics */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title="Behavioral Analytics" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={[
                { metric: 'Process Anomalies', value: 65 },
                { metric: 'Network Anomalies', value: 45 },
                { metric: 'File Anomalies', value: 78 },
                { metric: 'Registry Anomalies', value: 32 },
                { metric: 'User Behavior', value: 55 }
              ]}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Anomaly Score" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// ============================================================================
// Attack Surface Tab
// ============================================================================

function AttackSurfaceTab(): JSX.Element {
  const assetData = [
    { name: 'Web Servers', size: 45, value: 12 },
    { name: 'Databases', size: 30, value: 8 },
    { name: 'APIs', size: 25, value: 15 },
    { name: 'Cloud Storage', size: 20, value: 5 },
    { name: 'Mail Servers', size: 15, value: 3 }
  ];

  return (
    <Grid container spacing={3}>
      {/* External Asset Inventory */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title="External Asset Inventory" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <Treemap
                data={assetData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#fff"
                fill="#8884d8"
              >
                <RechartsTooltip />
              </Treemap>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Open Ports */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="Open Ports" />
          <CardContent>
            <List dense>
              {[
                { port: 80, service: 'HTTP', risk: 'medium' },
                { port: 443, service: 'HTTPS', risk: 'low' },
                { port: 22, service: 'SSH', risk: 'low' },
                { port: 3389, service: 'RDP', risk: 'high' },
                { port: 21, service: 'FTP', risk: 'high' }
              ].map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={`Port ${item.port} - ${item.service}`}
                      secondary={
                        <Chip
                          label={item.risk}
                          size="small"
                          color={item.risk === 'high' ? 'error' : item.risk === 'medium' ? 'warning' : 'success'}
                          sx={{ mt: 0.5 }}
                        />
                      }
                    />
                  </ListItem>
                  {index < 4 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* SSL/TLS Certificates */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="SSL/TLS Certificate Monitoring" />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Domain</TableCell>
                    <TableCell>Issuer</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { domain: 'api.example.com', issuer: "Let's Encrypt", expires: '45 days', status: 'valid' },
                    { domain: 'www.example.com', issuer: 'DigiCert', expires: '180 days', status: 'valid' },
                    { domain: 'old.example.com', issuer: 'Self-signed', expires: '5 days', status: 'expiring' }
                  ].map((cert, index) => (
                    <TableRow key={index}>
                      <TableCell>{cert.domain}</TableCell>
                      <TableCell>{cert.issuer}</TableCell>
                      <TableCell>{cert.expires}</TableCell>
                      <TableCell>
                        <Chip
                          label={cert.status}
                          size="small"
                          color={cert.status === 'valid' ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Cloud Security Posture */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Cloud Security Posture" />
          <CardContent>
            <Stack spacing={2}>
              {[
                { provider: 'AWS', score: 85, issues: 3 },
                { provider: 'Azure', score: 92, issues: 1 },
                { provider: 'GCP', score: 78, issues: 5 }
              ].map((cloud) => (
                <Box key={cloud.provider}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CloudIcon />
                      <Typography variant="body2">{cloud.provider}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      {cloud.score}/100
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={cloud.score}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: cloud.score >= 80 ? '#388e3c' : cloud.score >= 60 ? '#fbc02d' : '#d32f2f'
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {cloud.issues} security issues
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// ============================================================================
// Utilities
// ============================================================================

const fetcher = async (url: string) => {
  // Simulate API call with mock data
  await new Promise(resolve => setTimeout(resolve, 500));

  if (url.includes('/alerts')) {
    return [
      {
        id: '1',
        timestamp: new Date(),
        severity: 'critical',
        title: 'Brute Force Attack Detected',
        description: 'Multiple failed login attempts from 192.168.1.100',
        source: 'SIEM',
        status: 'new'
      },
      {
        id: '2',
        timestamp: new Date(),
        severity: 'high',
        title: 'Suspicious PowerShell Execution',
        description: 'Encoded PowerShell command detected',
        source: 'EDR',
        status: 'investigating'
      }
    ] as Alert[];
  }

  if (url.includes('/endpoints')) {
    return [
      {
        id: '1',
        hostname: 'WS-001',
        ipAddress: '192.168.1.10',
        platform: 'Windows',
        status: 'online',
        riskScore: 35,
        threats: 0
      },
      {
        id: '2',
        hostname: 'WS-002',
        ipAddress: '192.168.1.11',
        platform: 'Windows',
        status: 'isolated',
        riskScore: 85,
        threats: 3
      },
      {
        id: '3',
        hostname: 'SRV-001',
        ipAddress: '192.168.1.100',
        platform: 'Linux',
        status: 'online',
        riskScore: 20,
        threats: 0
      }
    ] as Endpoint[];
  }

  if (url.includes('/vulnerabilities')) {
    return [
      {
        id: '1',
        title: 'SQL Injection in Login Form',
        severity: 'critical',
        cvss: 9.8,
        cve: 'CVE-2023-12345',
        asset: 'web-app-01',
        status: 'open'
      },
      {
        id: '2',
        title: 'Outdated Apache Version',
        severity: 'high',
        cvss: 7.5,
        cve: 'CVE-2021-41773',
        asset: 'web-server-01',
        status: 'in_progress'
      }
    ] as Vulnerability[];
  }

  if (url.includes('/pentest-jobs')) {
    return [
      {
        id: '1',
        name: 'Quarterly Web App Test',
        type: 'web',
        status: 'running',
        progress: 65,
        findings: 8
      }
    ] as PentestJob[];
  }

  if (url.includes('/metrics')) {
    return {
      eventsPerSecond: 1250,
      activeAlerts: 15,
      endpointsOnline: 245,
      threatsBlocked: 127
    };
  }

  return [];
};
