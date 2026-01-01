import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
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
  LinearProgress,
  Alert,
  AlertTitle,
  Badge,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Avatar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Shield,
  Security,
  Description,
  Visibility,
  Download,
  CheckCircle,
  Warning,
  Error,
  Info,
  Refresh,
  FilterList,
  Search,
  Close,
  TrendingUp,
  Assessment,
  Policy,
  VerifiedUser,
  Timeline,
  Article,
  Gavel,
  HealthAndSafety,
  Lock,
  VpnKey,
  Storage,
  CloudQueue,
  Group,
  School,
  NotificationsActive,
  PlaylistAddCheck,
} from '@mui/icons-material';
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import useSWR, { mutate } from 'swr';
import { useWebSocket } from '../../hooks/useWebSocket';

interface ComplianceOverview {
  gdprScore: number;
  soc2Score: number;
  hipaaScore: number;
  overallScore: number;
  lastUpdated: Date;
  activeBreaches: number;
  pendingDSRs: number;
  upcomingAudits: number;
  criticalFindings: number;
}

interface DataSubjectRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestType: string;
  status: string;
  submittedAt: Date;
  completedAt?: Date;
  verifiedAt?: Date;
  expiresAt: Date;
  progress: number;
}

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: string;
  userId?: string;
  userName?: string;
  ipAddress: string;
  resource: string;
  action: string;
  result: 'success' | 'failure';
  severity: 'info' | 'warning' | 'error' | 'critical';
  details: Record<string, any>;
}

interface RiskItem {
  id: string;
  riskId: string;
  title: string;
  category: string;
  likelihood: number;
  impact: number;
  riskLevel: string;
  owner: string;
  status: string;
  lastReviewed: Date;
  mitigationControls: string[];
}

interface CompliancePolicy {
  id: string;
  policyName: string;
  framework: string;
  version: string;
  effectiveDate: Date;
  lastReviewed: Date;
  status: string;
  owner: string;
  documentUrl?: string;
}

interface SOC2Control {
  id: string;
  controlId: string;
  principle: string;
  title: string;
  status: string;
  lastTested?: Date;
  nextTestDue?: Date;
  owner: string;
  automated: boolean;
}

interface HIPAASafeguard {
  id: string;
  type: string;
  title: string;
  implemented: boolean;
  implementedAt?: Date;
  responsibleParty: string;
  nextReview?: Date;
}

interface BreachIncident {
  id: string;
  incidentId: string;
  type: string;
  severity: string;
  detectedAt: Date;
  affectedRecords: number;
  status: string;
  framework: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }

  return response.json();
};

const ComplianceDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [dsrPage, setDsrPage] = useState(0);
  const [dsrRowsPerPage, setDsrRowsPerPage] = useState(10);
  const [auditPage, setAuditPage] = useState(0);
  const [auditRowsPerPage, setAuditRowsPerPage] = useState(25);
  const [selectedDSR, setSelectedDSR] = useState<DataSubjectRequest | null>(null);
  const [dsrDialogOpen, setDsrDialogOpen] = useState(false);
  const [auditFilters, setAuditFilters] = useState({
    eventType: '',
    severity: '',
    search: '',
  });
  const [timeRange, setTimeRange] = useState('7d');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedBreach, setSelectedBreach] = useState<BreachIncident | null>(null);
  const [breachDialogOpen, setBreachDialogOpen] = useState(false);

  const { data: overview, error: overviewError } = useSWR<ComplianceOverview>(
    '/api/compliance/overview',
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: dsrData } = useSWR<{ requests: DataSubjectRequest[]; total: number }>(
    `/api/compliance/gdpr/dsr?page=${dsrPage}&limit=${dsrRowsPerPage}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: auditLogs } = useSWR<{ logs: AuditLogEntry[]; total: number }>(
    `/api/compliance/soc2/audit-logs?page=${auditPage}&limit=${auditRowsPerPage}&eventType=${auditFilters.eventType}&severity=${auditFilters.severity}&search=${auditFilters.search}`,
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: risks } = useSWR<RiskItem[]>(
    '/api/compliance/soc2/risks',
    fetcher,
    { refreshInterval: 300000 }
  );

  const { data: policies } = useSWR<CompliancePolicy[]>(
    '/api/compliance/policies',
    fetcher,
    { refreshInterval: 300000 }
  );

  const { data: soc2Controls } = useSWR<SOC2Control[]>(
    '/api/compliance/soc2/controls',
    fetcher,
    { refreshInterval: 300000 }
  );

  const { data: hipaaData } = useSWR<{
    safeguards: HIPAASafeguard[];
    trainingCompliance: number;
    baaCount: number;
  }>(
    '/api/compliance/hipaa/status',
    fetcher,
    { refreshInterval: 300000 }
  );

  const { data: breaches } = useSWR<BreachIncident[]>(
    '/api/compliance/breaches',
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: trendData } = useSWR<Array<{
    date: string;
    gdpr: number;
    soc2: number;
    hipaa: number;
  }>>(
    `/api/compliance/trends?range=${timeRange}`,
    fetcher,
    { refreshInterval: 300000 }
  );

  useWebSocket('/ws/compliance', (message) => {
    if (message.type === 'dsr_update') {
      mutate('/api/compliance/gdpr/dsr');
      mutate('/api/compliance/overview');
    } else if (message.type === 'breach_detected') {
      mutate('/api/compliance/breaches');
      mutate('/api/compliance/overview');
    } else if (message.type === 'audit_event') {
      mutate('/api/compliance/soc2/audit-logs');
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleDSRClick = (dsr: DataSubjectRequest) => {
    setSelectedDSR(dsr);
    setDsrDialogOpen(true);
  };

  const handleProcessDSR = async (dsrId: string, action: 'approve' | 'reject') => {
    try {
      await fetch(`/api/compliance/gdpr/dsr/${dsrId}/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      mutate('/api/compliance/gdpr/dsr');
      mutate('/api/compliance/overview');
      setDsrDialogOpen(false);
    } catch (error) {
      console.error('Failed to process DSR:', error);
    }
  };

  const handleBreachClick = (breach: BreachIncident) => {
    setSelectedBreach(breach);
    setBreachDialogOpen(true);
  };

  const handleExportAuditLogs = async () => {
    try {
      const response = await fetch('/api/compliance/soc2/audit-logs/export', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  const filteredRisks = useMemo(() => {
    if (!risks) return [];
    if (riskFilter === 'all') return risks;
    return risks.filter(risk => risk.riskLevel.toLowerCase() === riskFilter);
  }, [risks, riskFilter]);

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      completed: 'success',
      pending: 'warning',
      processing: 'info',
      rejected: 'error',
      expired: 'default',
      effective: 'success',
      ineffective: 'error',
      active: 'success',
      inactive: 'default',
    };
    return statusMap[status.toLowerCase()] || 'default';
  };

  const getSeverityIcon = (severity: string) => {
    const icons = {
      info: <Info color="info" />,
      warning: <Warning color="warning" />,
      error: <Error color="error" />,
      critical: <Error sx={{ color: '#d32f2f' }} />,
    };
    return icons[severity as keyof typeof icons] || <Info />;
  };

  const complianceScoreData = overview ? [
    {
      name: 'GDPR',
      value: overview.gdprScore,
      fill: '#4caf50',
    },
    {
      name: 'SOC 2',
      value: overview.soc2Score,
      fill: '#2196f3',
    },
    {
      name: 'HIPAA',
      value: overview.hipaaScore,
      fill: '#ff9800',
    },
  ] : [];

  const riskDistribution = risks ? [
    {
      name: 'Critical',
      value: risks.filter(r => r.riskLevel === 'critical').length,
      fill: '#d32f2f',
    },
    {
      name: 'High',
      value: risks.filter(r => r.riskLevel === 'high').length,
      fill: '#f57c00',
    },
    {
      name: 'Medium',
      value: risks.filter(r => r.riskLevel === 'medium').length,
      fill: '#ffa726',
    },
    {
      name: 'Low',
      value: risks.filter(r => r.riskLevel === 'low').length,
      fill: '#66bb6a',
    },
  ] : [];

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity={overview && overview.criticalFindings > 0 ? 'error' : 'success'} sx={{ mb: 2 }}>
          <AlertTitle>
            {overview && overview.criticalFindings > 0
              ? `${overview.criticalFindings} Critical Findings Require Attention`
              : 'All Systems Compliant'}
          </AlertTitle>
          {overview && overview.criticalFindings > 0 ? (
            'Immediate action required to address critical compliance gaps.'
          ) : (
            'All compliance frameworks are meeting required standards.'
          )}
        </Alert>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: '#4caf50' }}>
                <Shield />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {overview?.overallScore || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall Compliance
                </Typography>
              </Box>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={overview?.overallScore || 0}
              sx={{ mt: 2, height: 8, borderRadius: 4 }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: '#f44336' }}>
                <NotificationsActive />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {overview?.activeBreaches || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Breaches
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: '#ff9800' }}>
                <Description />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {overview?.pendingDSRs || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending DSRs
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: '#2196f3' }}>
                <Assessment />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {overview?.upcomingAudits || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upcoming Audits
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Compliance Scores by Framework" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="10%"
                outerRadius="80%"
                data={complianceScoreData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  minAngle={15}
                  label={{ position: 'insideStart', fill: '#fff' }}
                  background
                  clockWise
                  dataKey="value"
                />
                <Legend
                  iconSize={10}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Risk Distribution" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Compliance Trends"
            action={
              <ToggleButtonGroup
                value={timeRange}
                exclusive
                onChange={(e, newValue) => newValue && setTimeRange(newValue)}
                size="small"
              >
                <ToggleButton value="7d">7D</ToggleButton>
                <ToggleButton value="30d">30D</ToggleButton>
                <ToggleButton value="90d">90D</ToggleButton>
              </ToggleButtonGroup>
            }
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="gdpr"
                  stackId="1"
                  stroke="#4caf50"
                  fill="#4caf50"
                  name="GDPR"
                />
                <Area
                  type="monotone"
                  dataKey="soc2"
                  stackId="1"
                  stroke="#2196f3"
                  fill="#2196f3"
                  name="SOC 2"
                />
                <Area
                  type="monotone"
                  dataKey="hipaa"
                  stackId="1"
                  stroke="#ff9800"
                  fill="#ff9800"
                  name="HIPAA"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Recent Breach Incidents" />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Incident ID</TableCell>
                    <TableCell>Framework</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Affected Records</TableCell>
                    <TableCell>Detected</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {breaches?.slice(0, 5).map((breach) => (
                    <TableRow key={breach.id} hover>
                      <TableCell>{breach.incidentId}</TableCell>
                      <TableCell>
                        <Chip label={breach.framework} size="small" />
                      </TableCell>
                      <TableCell>{breach.type}</TableCell>
                      <TableCell>
                        <Chip
                          label={breach.severity}
                          color={
                            breach.severity === 'critical' ? 'error' :
                            breach.severity === 'high' ? 'warning' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{breach.affectedRecords}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(breach.detectedAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Chip label={breach.status} color={getStatusColor(breach.status)} size="small" />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleBreachClick(breach)}>
                          <Visibility />
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

  const renderGDPRTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Shield fontSize="large" color="success" />
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {overview?.gdprScore || 0}%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  GDPR Compliance Score
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Description fontSize="large" color="primary" />
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {dsrData?.total || 0}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Total DSRs
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <PlaylistAddCheck fontSize="large" color="warning" />
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {overview?.pendingDSRs || 0}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Pending DSRs
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Data Subject Requests Queue"
            action={
              <Button startIcon={<Refresh />} onClick={() => mutate('/api/compliance/gdpr/dsr')}>
                Refresh
              </Button>
            }
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dsrData?.requests.map((dsr) => (
                    <TableRow key={dsr.id} hover>
                      <TableCell>{dsr.id.substring(0, 8)}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{dsr.userName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dsr.userEmail}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={dsr.requestType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip label={dsr.status} color={getStatusColor(dsr.status)} size="small" />
                      </TableCell>
                      <TableCell>
                        {format(new Date(dsr.submittedAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(dsr.expiresAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={dsr.progress}
                            sx={{ flex: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption">{dsr.progress}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleDSRClick(dsr)}>
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={dsrData?.total || 0}
              page={dsrPage}
              onPageChange={(e, newPage) => setDsrPage(newPage)}
              rowsPerPage={dsrRowsPerPage}
              onRowsPerPageChange={(e) => setDsrRowsPerPage(parseInt(e.target.value, 10))}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderSOC2Tab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Security fontSize="large" color="primary" />
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {overview?.soc2Score || 0}%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  SOC 2 Compliance Score
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <VerifiedUser fontSize="large" color="success" />
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {soc2Controls?.filter(c => c.status === 'effective').length || 0}/
                  {soc2Controls?.length || 0}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Effective Controls
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Warning fontSize="large" color="warning" />
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {risks?.filter(r => r.status === 'open').length || 0}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Open Risks
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="SOC 2 Controls by Principle" />
          <CardContent>
            <Grid container spacing={2}>
              {['Security', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy'].map(
                (principle) => {
                  const principleControls = soc2Controls?.filter(
                    (c) => c.principle.toLowerCase() === principle.toLowerCase().replace(' ', '_')
                  ) || [];
                  const effectiveCount = principleControls.filter(c => c.status === 'effective').length;
                  const percentage = principleControls.length > 0
                    ? (effectiveCount / principleControls.length) * 100
                    : 0;

                  return (
                    <Grid item xs={12} md={6} lg={4} key={principle}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {principle}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{ flex: 1, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption">{Math.round(percentage)}%</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {effectiveCount} of {principleControls.length} controls effective
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                }
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Risk Register"
            action={
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Filter by Level</InputLabel>
                <Select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  label="Filter by Level"
                >
                  <MenuItem value="all">All Risks</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            }
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Risk ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Likelihood</TableCell>
                    <TableCell>Impact</TableCell>
                    <TableCell>Risk Level</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Controls</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRisks.map((risk) => (
                    <TableRow key={risk.id} hover>
                      <TableCell>{risk.riskId}</TableCell>
                      <TableCell>{risk.title}</TableCell>
                      <TableCell>{risk.category}</TableCell>
                      <TableCell>
                        <Chip label={risk.likelihood} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={risk.impact} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={risk.riskLevel}
                          color={
                            risk.riskLevel === 'critical' ? 'error' :
                            risk.riskLevel === 'high' ? 'warning' :
                            risk.riskLevel === 'medium' ? 'info' : 'success'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{risk.owner}</TableCell>
                      <TableCell>
                        <Chip label={risk.status} color={getStatusColor(risk.status)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={risk.mitigationControls.length} size="small" variant="outlined" />
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

  const renderHIPAATab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <HealthAndSafety fontSize="large" color="warning" />
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {overview?.hipaaScore || 0}%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  HIPAA Compliance Score
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Lock fontSize="large" color="primary" />
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {hipaaData?.safeguards.filter(s => s.implemented).length || 0}/
                  {hipaaData?.safeguards.length || 0}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Safeguards Implemented
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <School fontSize="large" color="success" />
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {hipaaData?.trainingCompliance || 0}%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Training Compliance
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Article fontSize="large" color="info" />
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {hipaaData?.baaCount || 0}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Active BAAs
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="HIPAA Safeguards Implementation" />
          <CardContent>
            <Grid container spacing={2}>
              {['Administrative', 'Physical', 'Technical'].map((type) => {
                const typeSafeguards = hipaaData?.safeguards.filter(
                  (s) => s.type.toLowerCase() === type.toLowerCase()
                ) || [];
                const implementedCount = typeSafeguards.filter(s => s.implemented).length;
                const percentage = typeSafeguards.length > 0
                  ? (implementedCount / typeSafeguards.length) * 100
                  : 0;

                return (
                  <Grid item xs={12} md={4} key={type}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {type} Safeguards
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{ flex: 1, height: 10, borderRadius: 5 }}
                        />
                        <Typography variant="body2">{Math.round(percentage)}%</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {implementedCount} of {typeSafeguards.length} implemented
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="HIPAA Safeguards" />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Safeguard</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Responsible Party</TableCell>
                    <TableCell>Implemented Date</TableCell>
                    <TableCell>Next Review</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hipaaData?.safeguards.map((safeguard) => (
                    <TableRow key={safeguard.id} hover>
                      <TableCell>
                        <Chip label={safeguard.type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{safeguard.title}</TableCell>
                      <TableCell>
                        {safeguard.implemented ? (
                          <Chip icon={<CheckCircle />} label="Implemented" color="success" size="small" />
                        ) : (
                          <Chip icon={<Warning />} label="Not Implemented" color="warning" size="small" />
                        )}
                      </TableCell>
                      <TableCell>{safeguard.responsibleParty}</TableCell>
                      <TableCell>
                        {safeguard.implementedAt
                          ? format(new Date(safeguard.implementedAt), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {safeguard.nextReview
                          ? format(new Date(safeguard.nextReview), 'MMM dd, yyyy')
                          : '-'}
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

  const renderAuditLogsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Audit Log Filters"
            action={
              <Button startIcon={<Download />} onClick={handleExportAuditLogs}>
                Export
              </Button>
            }
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search"
                  value={auditFilters.search}
                  onChange={(e) => setAuditFilters({ ...auditFilters, search: e.target.value })}
                  InputProps={{
                    startAdornment: <Search />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Event Type</InputLabel>
                  <Select
                    value={auditFilters.eventType}
                    onChange={(e) => setAuditFilters({ ...auditFilters, eventType: e.target.value })}
                    label="Event Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="user_login">User Login</MenuItem>
                    <MenuItem value="data_access">Data Access</MenuItem>
                    <MenuItem value="permission_change">Permission Change</MenuItem>
                    <MenuItem value="configuration_change">Configuration Change</MenuItem>
                    <MenuItem value="security_alert">Security Alert</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={auditFilters.severity}
                    onChange={(e) => setAuditFilters({ ...auditFilters, severity: e.target.value })}
                    label="Severity"
                  >
                    <MenuItem value="">All Severities</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Audit Log Entries" />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Resource</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>IP Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs?.logs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Tooltip title={format(new Date(log.timestamp), 'PPpp')}>
                          <span>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip label={log.eventType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{log.userName || log.userId || 'System'}</TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.result}
                          color={log.result === 'success' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{getSeverityIcon(log.severity)}</TableCell>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace">
                          {log.ipAddress}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={auditLogs?.total || 0}
              page={auditPage}
              onPageChange={(e, newPage) => setAuditPage(newPage)}
              rowsPerPage={auditRowsPerPage}
              onRowsPerPageChange={(e) => setAuditRowsPerPage(parseInt(e.target.value, 10))}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPoliciesTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Compliance Policies"
            action={
              <Button variant="contained" startIcon={<Policy />}>
                New Policy
              </Button>
            }
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Policy Name</TableCell>
                    <TableCell>Framework</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Effective Date</TableCell>
                    <TableCell>Last Reviewed</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {policies?.map((policy) => (
                    <TableRow key={policy.id} hover>
                      <TableCell>{policy.policyName}</TableCell>
                      <TableCell>
                        <Chip label={policy.framework} size="small" />
                      </TableCell>
                      <TableCell>{policy.version}</TableCell>
                      <TableCell>
                        {format(new Date(policy.effectiveDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(policy.lastReviewed), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{policy.owner}</TableCell>
                      <TableCell>
                        <Chip label={policy.status} color={getStatusColor(policy.status)} size="small" />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                        {policy.documentUrl && (
                          <IconButton size="small" href={policy.documentUrl} target="_blank">
                            <Download />
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
      </Grid>
    </Grid>
  );

  if (overviewError) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          <AlertTitle>Error Loading Compliance Dashboard</AlertTitle>
          Failed to load compliance data. Please try again later.
        </Alert>
      </Container>
    );
  }

  if (!overview) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Compliance Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage GDPR, SOC 2, and HIPAA compliance across your organization
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<TrendingUp />} label="Overview" />
          <Tab icon={<Shield />} label="GDPR" />
          <Tab icon={<Security />} label="SOC 2" />
          <Tab icon={<HealthAndSafety />} label="HIPAA" />
          <Tab icon={<Timeline />} label="Audit Logs" />
          <Tab icon={<Gavel />} label="Policies" />
        </Tabs>
      </Paper>

      <Box>
        {selectedTab === 0 && renderOverviewTab()}
        {selectedTab === 1 && renderGDPRTab()}
        {selectedTab === 2 && renderSOC2Tab()}
        {selectedTab === 3 && renderHIPAATab()}
        {selectedTab === 4 && renderAuditLogsTab()}
        {selectedTab === 5 && renderPoliciesTab()}
      </Box>

      <Dialog open={dsrDialogOpen} onClose={() => setDsrDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Data Subject Request Details
          <IconButton
            onClick={() => setDsrDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedDSR && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Request ID
                </Typography>
                <Typography variant="body1">{selectedDSR.id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  User
                </Typography>
                <Typography variant="body1">{selectedDSR.userName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Request Type
                </Typography>
                <Typography variant="body1">{selectedDSR.requestType}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Chip label={selectedDSR.status} color={getStatusColor(selectedDSR.status)} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Submitted
                </Typography>
                <Typography variant="body1">
                  {format(new Date(selectedDSR.submittedAt), 'PPpp')}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Expires
                </Typography>
                <Typography variant="body1">
                  {format(new Date(selectedDSR.expiresAt), 'PPpp')}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDsrDialogOpen(false)}>Close</Button>
          {selectedDSR?.status === 'pending' && (
            <>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleProcessDSR(selectedDSR.id, 'reject')}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleProcessDSR(selectedDSR.id, 'approve')}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={breachDialogOpen} onClose={() => setBreachDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Breach Incident Details
          <IconButton
            onClick={() => setBreachDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedBreach && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity={selectedBreach.severity === 'critical' ? 'error' : 'warning'}>
                  <AlertTitle>{selectedBreach.severity.toUpperCase()} Severity Breach</AlertTitle>
                  {selectedBreach.affectedRecords} records affected
                </Alert>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Incident ID
                </Typography>
                <Typography variant="body1">{selectedBreach.incidentId}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Framework
                </Typography>
                <Typography variant="body1">{selectedBreach.framework}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body1">{selectedBreach.type}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Chip label={selectedBreach.status} color={getStatusColor(selectedBreach.status)} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Detected At
                </Typography>
                <Typography variant="body1">
                  {format(new Date(selectedBreach.detectedAt), 'PPpp')}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBreachDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ComplianceDashboard;
