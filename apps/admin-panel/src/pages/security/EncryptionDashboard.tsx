import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Button,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  LinearProgress,
  Tooltip,
  Badge,
  Stack,
  Divider,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  CircularProgress
} from '@mui/material';
import {
  Refresh,
  VpnKey,
  Security,
  Policy,
  Warning,
  CheckCircle,
  Error,
  Lock,
  LockOpen,
  Visibility,
  VisibilityOff,
  Download,
  Upload,
  Edit,
  Delete,
  Add,
  Schedule,
  Block,
  PlayArrow,
  Stop,
  Info,
  FilterList,
  Search,
  GetApp,
  CloudDownload,
  CheckCircleOutline,
  HighlightOff,
  Shield,
  VerifiedUser
} from '@mui/icons-material';
import {
  RadialBarChart,
  RadialBar,
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
  Area,
  AreaChart
} from 'recharts';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import useSWR from 'swr';
import { jsPDF } from 'jspdf';
import Editor from '@monaco-editor/react';

/**
 * Encryption Dashboard
 *
 * Complete React dashboard for encryption and data protection:
 * - Encryption status monitoring
 * - Key management
 * - DLP violations and quarantine
 * - Secrets management
 * - Compliance reporting
 */

interface EncryptionStatus {
  dataAtRest: number;
  dataInTransit: number;
  e2eeMessages: number;
  fieldLevel: {
    ssn: boolean;
    creditCard: boolean;
    password: boolean;
    email: boolean;
  };
}

interface MasterKey {
  id: string;
  type: string;
  created: string;
  lastRotated: string;
  expires: string;
  status: 'active' | 'rotating' | 'disabled';
  version: number;
  usageCount: number;
}

interface DLPViolation {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  user: string;
  dataType: string;
  action: string;
  timestamp: string;
  location: {
    ip: string;
    country: string;
  };
}

interface DLPPolicy {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: any[];
  actions: any[];
  violationCount: number;
}

interface QuarantineItem {
  id: string;
  type: string;
  user: string;
  detectedData: string[];
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface Secret {
  id: string;
  name: string;
  type: string;
  lastRotated: string;
  expires: string;
  status: 'on-time' | 'due-soon' | 'overdue';
  environment: string;
  accessCount: number;
}

interface AccessLog {
  id: string;
  secretName: string;
  user: string;
  action: string;
  timestamp: string;
  ip: string;
  success: boolean;
}

interface ComplianceScore {
  overall: number;
  dataAtRest: number;
  dataInTransit: number;
  e2ee: number;
  fieldLevel: number;
}

interface NonCompliantResource {
  id: string;
  type: string;
  issue: string;
  remediation: string;
  severity: 'low' | 'medium' | 'high';
}

const COLORS = {
  primary: '#1976d2',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  grey: '#9e9e9e'
};

const SEVERITY_COLORS = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#ff5722',
  critical: '#d32f2f'
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function EncryptionDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedKey, setSelectedKey] = useState<MasterKey | null>(null);
  const [rotationDialogOpen, setRotationDialogOpen] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<DLPPolicy | null>(null);
  const [showSecretValue, setShowSecretValue] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data fetching with SWR (10-second refresh)
  const { data: encryptionStatus, mutate: refreshStatus } = useSWR<EncryptionStatus>(
    '/api/security/encryption/status',
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: masterKeys, mutate: refreshKeys } = useSWR<MasterKey[]>(
    '/api/security/encryption/keys',
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: violations, mutate: refreshViolations } = useSWR<DLPViolation[]>(
    '/api/security/dlp/violations',
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: policies, mutate: refreshPolicies } = useSWR<DLPPolicy[]>(
    '/api/security/dlp/policies',
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: quarantine, mutate: refreshQuarantine } = useSWR<QuarantineItem[]>(
    '/api/security/dlp/quarantine',
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: secrets, mutate: refreshSecrets } = useSWR<Secret[]>(
    '/api/security/secrets',
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: accessLogs, mutate: refreshLogs } = useSWR<AccessLog[]>(
    '/api/security/secrets/logs',
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: complianceScore, mutate: refreshCompliance } = useSWR<ComplianceScore>(
    '/api/security/compliance/score',
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: nonCompliantResources } = useSWR<NonCompliantResource[]>(
    '/api/security/compliance/non-compliant',
    fetcher,
    { refreshInterval: 10000 }
  );

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Manual rotation
  const handleRotateKey = async (keyId: string) => {
    try {
      await fetch(`/api/security/encryption/keys/${keyId}/rotate`, {
        method: 'POST'
      });
      refreshKeys();
      setRotationDialogOpen(false);
    } catch (error) {
      console.error('Failed to rotate key:', error);
    }
  };

  // Review quarantine item
  const handleReviewQuarantine = async (itemId: string, approved: boolean) => {
    try {
      await fetch(`/api/security/dlp/quarantine/${itemId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved })
      });
      refreshQuarantine();
    } catch (error) {
      console.error('Failed to review quarantine item:', error);
    }
  };

  // Export audit logs
  const handleExportLogs = (format: 'csv' | 'json') => {
    if (!accessLogs) return;

    if (format === 'csv') {
      const csv = [
        ['Timestamp', 'Secret', 'User', 'Action', 'IP', 'Success'],
        ...accessLogs.map(log => [
          log.timestamp,
          log.secretName,
          log.user,
          log.action,
          log.ip,
          log.success ? 'Yes' : 'No'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.csv`;
      a.click();
    } else {
      const json = JSON.stringify(accessLogs, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.json`;
      a.click();
    }
  };

  // Generate PDF compliance report
  const handleGeneratePDFReport = () => {
    if (!complianceScore || !nonCompliantResources) return;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Encryption Compliance Report', 20, 20);

    // Date
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);

    // Overall Score
    doc.setFontSize(16);
    doc.text('Overall Compliance Score', 20, 45);
    doc.setFontSize(32);
    doc.text(`${complianceScore.overall}%`, 20, 60);

    // Category Scores
    doc.setFontSize(14);
    doc.text('Category Breakdown', 20, 75);
    doc.setFontSize(12);
    doc.text(`Data-at-Rest: ${complianceScore.dataAtRest}%`, 30, 85);
    doc.text(`Data-in-Transit: ${complianceScore.dataInTransit}%`, 30, 92);
    doc.text(`End-to-End Encryption: ${complianceScore.e2ee}%`, 30, 99);
    doc.text(`Field-Level Encryption: ${complianceScore.fieldLevel}%`, 30, 106);

    // Non-Compliant Resources
    doc.setFontSize(14);
    doc.text('Non-Compliant Resources', 20, 120);
    doc.setFontSize(10);

    let y = 130;
    nonCompliantResources.slice(0, 10).forEach((resource, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${index + 1}. ${resource.type}: ${resource.issue}`, 30, y);
      y += 7;
    });

    doc.save(`compliance-report-${Date.now()}.pdf`);
  };

  // Filtered violations
  const filteredViolations = useMemo(() => {
    if (!violations) return [];

    let filtered = violations;

    if (filterSeverity !== 'all') {
      filtered = filtered.filter(v => v.severity === filterSeverity);
    }

    if (searchQuery) {
      filtered = filtered.filter(v =>
        v.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.dataType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [violations, filterSeverity, searchQuery]);

  // Key usage chart data
  const keyUsageData = useMemo(() => {
    if (!masterKeys) return [];

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return last7Days.map((date, index) => ({
      date,
      requests: Math.floor(Math.random() * 10000) + 5000 // Mock data
    }));
  }, [masterKeys]);

  // Violation trend data
  const violationTrendData = useMemo(() => {
    if (!violations) return [];

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return last30Days.map(date => ({
      date,
      violations: Math.floor(Math.random() * 50) // Mock data
    }));
  }, [violations]);

  // Top violators data
  const topViolatorsData = useMemo(() => {
    if (!violations) return [];

    const userCounts: Record<string, number> = {};
    violations.forEach(v => {
      userCounts[v.user] = (userCounts[v.user] || 0) + 1;
    });

    return Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([user, count]) => ({ user, count }));
  }, [violations]);

  // Sensitive data detection counts
  const sensitiveDataCounts = useMemo(() => {
    if (!violations) return [];

    const counts: Record<string, number> = {};
    violations.forEach(v => {
      counts[v.dataType] = (counts[v.dataType] || 0) + 1;
    });

    return Object.entries(counts).map(([type, count]) => ({
      type,
      count
    }));
  }, [violations]);

  // Expiring secrets
  const expiringSecrets = useMemo(() => {
    if (!secrets) return [];

    return secrets.filter(s => {
      const expires = new Date(s.expires);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    });
  }, [secrets]);

  // Radial chart data for encryption status
  const encryptionRadialData = useMemo(() => {
    if (!encryptionStatus) return [];

    return [
      { name: 'Data-at-Rest', value: encryptionStatus.dataAtRest, fill: COLORS.success },
      { name: 'Data-in-Transit', value: encryptionStatus.dataInTransit, fill: COLORS.info },
      { name: 'E2EE Messages', value: encryptionStatus.e2eeMessages, fill: COLORS.primary }
    ];
  }, [encryptionStatus]);

  // Compliance radial data
  const complianceRadialData = useMemo(() => {
    if (!complianceScore) return [];

    return [
      { name: 'Overall', value: complianceScore.overall, fill: COLORS.success }
    ];
  }, [complianceScore]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Encryption & Data Protection
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor encryption status, manage keys, enforce DLP policies, and ensure compliance
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Key Management" />
        <Tab label="DLP" />
        <Tab label="Secrets" />
        <Tab label="Compliance" />
      </Tabs>

      {/* Tab 1: Overview */}
      {activeTab === 0 && (
        <Box>
          {/* Encryption Status Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Lock sx={{ mr: 1, color: COLORS.success }} />
                    <Typography variant="h6">Data-at-Rest</Typography>
                  </Box>
                  <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="60%"
                        outerRadius="100%"
                        data={[{ name: 'Data-at-Rest', value: encryptionStatus?.dataAtRest || 0, fill: COLORS.success }]}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <RadialBar dataKey="value" cornerRadius={10} />
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="24" fontWeight="bold">
                          {encryptionStatus?.dataAtRest || 0}%
                        </text>
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </Box>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Target: 100%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Security sx={{ mr: 1, color: COLORS.info }} />
                    <Typography variant="h6">Data-in-Transit</Typography>
                  </Box>
                  <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="60%"
                        outerRadius="100%"
                        data={[{ name: 'Data-in-Transit', value: encryptionStatus?.dataInTransit || 0, fill: COLORS.info }]}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <RadialBar dataKey="value" cornerRadius={10} />
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="24" fontWeight="bold">
                          {encryptionStatus?.dataInTransit || 0}%
                        </text>
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </Box>
                  <Typography variant="body2" color="text.secondary" align="center">
                    TLS 1.3 Usage
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <VpnKey sx={{ mr: 1, color: COLORS.primary }} />
                    <Typography variant="h6">E2EE Messages</Typography>
                  </Box>
                  <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="60%"
                        outerRadius="100%"
                        data={[{ name: 'E2EE', value: encryptionStatus?.e2eeMessages || 0, fill: COLORS.primary }]}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <RadialBar dataKey="value" cornerRadius={10} />
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="24" fontWeight="bold">
                          {encryptionStatus?.e2eeMessages || 0}%
                        </text>
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </Box>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Signal Protocol
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Field-Level Encryption */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Field-Level Encryption
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography>SSN</Typography>
                    {encryptionStatus?.fieldLevel.ssn ? (
                      <CheckCircle sx={{ color: COLORS.success }} />
                    ) : (
                      <HighlightOff sx={{ color: COLORS.error }} />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography>Credit Card</Typography>
                    {encryptionStatus?.fieldLevel.creditCard ? (
                      <CheckCircle sx={{ color: COLORS.success }} />
                    ) : (
                      <HighlightOff sx={{ color: COLORS.error }} />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography>Password</Typography>
                    {encryptionStatus?.fieldLevel.password ? (
                      <CheckCircle sx={{ color: COLORS.success }} />
                    ) : (
                      <HighlightOff sx={{ color: COLORS.error }} />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography>Email</Typography>
                    {encryptionStatus?.fieldLevel.email ? (
                      <CheckCircle sx={{ color: COLORS.success }} />
                    ) : (
                      <HighlightOff sx={{ color: COLORS.error }} />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Recent DLP Alerts */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Recent DLP Alerts</Typography>
                <Button variant="outlined" size="small" onClick={() => setActiveTab(2)}>
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Severity</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Data Type</TableCell>
                      <TableCell>Timestamp</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {violations?.slice(0, 5).map((violation) => (
                      <TableRow key={violation.id}>
                        <TableCell>
                          <Chip
                            label={violation.severity.toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: SEVERITY_COLORS[violation.severity],
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>{violation.type}</TableCell>
                        <TableCell>{violation.user}</TableCell>
                        <TableCell>{violation.dataType}</TableCell>
                        <TableCell>{new Date(violation.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab 2: Key Management */}
      {activeTab === 1 && (
        <Box>
          <Grid container spacing={3}>
            {/* Key Inventory */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Key Inventory</Typography>
                    <Button
                      variant="contained"
                      startIcon={<Refresh />}
                      onClick={() => refreshKeys()}
                    >
                      Refresh
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Key ID</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Created</TableCell>
                          <TableCell>Last Rotated</TableCell>
                          <TableCell>Expires</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {masterKeys?.map((key) => (
                          <TableRow key={key.id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {key.id.slice(0, 16)}...
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={key.type} size="small" />
                            </TableCell>
                            <TableCell>{new Date(key.created).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(key.lastRotated).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {(() => {
                                const expires = new Date(key.expires);
                                const now = new Date();
                                const daysUntil = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                return (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2">
                                      {daysUntil} days
                                    </Typography>
                                    {daysUntil <= 7 && (
                                      <Warning sx={{ ml: 1, color: COLORS.warning, fontSize: 16 }} />
                                    )}
                                  </Box>
                                );
                              })()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={key.status}
                                size="small"
                                color={key.status === 'active' ? 'success' : key.status === 'rotating' ? 'warning' : 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="Rotate Now">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedKey(key);
                                      setRotationDialogOpen(true);
                                    }}
                                  >
                                    <Refresh />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="View Details">
                                  <IconButton size="small">
                                    <Info />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Key Usage Chart */}
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Key Usage (7 Days)
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={keyUsageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="requests" stroke={COLORS.primary} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Rotation Schedule */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Rotation Schedule
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Key ID</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Next Rotation</TableCell>
                          <TableCell>Days Remaining</TableCell>
                          <TableCell>Auto-Rotate</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {masterKeys?.map((key) => {
                          const expires = new Date(key.expires);
                          const now = new Date();
                          const daysRemaining = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                          return (
                            <TableRow key={key.id}>
                              <TableCell sx={{ fontFamily: 'monospace' }}>{key.id.slice(0, 16)}...</TableCell>
                              <TableCell>{key.type}</TableCell>
                              <TableCell>{expires.toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Chip
                                  label={`${daysRemaining} days`}
                                  size="small"
                                  color={daysRemaining <= 7 ? 'warning' : 'default'}
                                />
                              </TableCell>
                              <TableCell>
                                <CheckCircleOutline sx={{ color: COLORS.success }} />
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    setSelectedKey(key);
                                    setRotationDialogOpen(true);
                                  }}
                                >
                                  Rotate Now
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tab 3: DLP */}
      {activeTab === 2 && (
        <Box>
          <Grid container spacing={3}>
            {/* Statistics Cards */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Violations
                  </Typography>
                  <Typography variant="h3">
                    {violations?.length || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Critical
                  </Typography>
                  <Typography variant="h3" sx={{ color: COLORS.error }}>
                    {violations?.filter(v => v.severity === 'critical').length || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Quarantined
                  </Typography>
                  <Typography variant="h3" sx={{ color: COLORS.warning }}>
                    {quarantine?.filter(q => q.status === 'pending').length || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Active Policies
                  </Typography>
                  <Typography variant="h3" sx={{ color: COLORS.success }}>
                    {policies?.filter(p => p.enabled).length || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Violation Trend */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Violation Trend (30 Days)
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={violationTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="violations" stroke={COLORS.error} fill={COLORS.error} fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Violators */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Violators
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topViolatorsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="user" type="category" width={80} />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill={COLORS.error} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Sensitive Data Detection */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sensitive Data Detection
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Data Type</TableCell>
                          <TableCell align="right">Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sensitiveDataCounts.map((item) => (
                          <TableRow key={item.type}>
                            <TableCell>{item.type}</TableCell>
                            <TableCell align="right">
                              <Chip label={item.count} size="small" color="error" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Quarantine Queue */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quarantine Queue
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>User</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Issues</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {quarantine?.filter(q => q.status === 'pending').map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.user}</TableCell>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>
                              <Chip label={item.detectedData.length} size="small" color="warning" />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => handleReviewQuarantine(item.id, true)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleReviewQuarantine(item.id, false)}
                                >
                                  Reject
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Policy Violations Table */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Policy Violations</Typography>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        size="small"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                          startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Severity</InputLabel>
                        <Select
                          value={filterSeverity}
                          label="Severity"
                          onChange={(e) => setFilterSeverity(e.target.value)}
                        >
                          <MenuItem value="all">All</MenuItem>
                          <MenuItem value="critical">Critical</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="low">Low</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Severity</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>User</TableCell>
                          <TableCell>Data Type</TableCell>
                          <TableCell>Action Taken</TableCell>
                          <TableCell>Location</TableCell>
                          <TableCell>Timestamp</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredViolations.map((violation) => (
                          <TableRow key={violation.id}>
                            <TableCell>
                              <Chip
                                label={violation.severity.toUpperCase()}
                                size="small"
                                sx={{
                                  backgroundColor: SEVERITY_COLORS[violation.severity],
                                  color: 'white'
                                }}
                              />
                            </TableCell>
                            <TableCell>{violation.type}</TableCell>
                            <TableCell>{violation.user}</TableCell>
                            <TableCell>
                              <Chip label={violation.dataType} size="small" />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={violation.action}
                                size="small"
                                color={violation.action === 'blocked' ? 'error' : 'warning'}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{violation.location.country}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {violation.location.ip}
                              </Typography>
                            </TableCell>
                            <TableCell>{new Date(violation.timestamp).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* DLP Policies */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">DLP Policies</Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setPolicyDialogOpen(true)}
                    >
                      Add Policy
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Priority</TableCell>
                          <TableCell>Conditions</TableCell>
                          <TableCell>Actions</TableCell>
                          <TableCell>Violations</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {policies?.map((policy) => (
                          <TableRow key={policy.id}>
                            <TableCell>{policy.name}</TableCell>
                            <TableCell>
                              <Chip label={policy.priority} size="small" />
                            </TableCell>
                            <TableCell>{policy.conditions.length}</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.5}>
                                {policy.actions.map((action: any, index: number) => (
                                  <Chip key={index} label={action.type} size="small" />
                                ))}
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Chip label={policy.violationCount} size="small" color="error" />
                            </TableCell>
                            <TableCell>
                              <Switch checked={policy.enabled} size="small" />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <IconButton size="small" onClick={() => {
                                  setSelectedPolicy(policy);
                                  setPolicyDialogOpen(true);
                                }}>
                                  <Edit />
                                </IconButton>
                                <IconButton size="small" color="error">
                                  <Delete />
                                </IconButton>
                              </Stack>
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
      )}

      {/* Tab 4: Secrets */}
      {activeTab === 3 && (
        <Box>
          <Grid container spacing={3}>
            {/* Expiring Secrets Alert */}
            {expiringSecrets.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  <AlertTitle>Secrets Expiring Soon</AlertTitle>
                  {expiringSecrets.length} secret(s) will expire within 7 days. Please rotate them soon.
                </Alert>
              </Grid>
            )}

            {/* Secret Inventory */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Secret Inventory</Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setSecretDialogOpen(true)}
                    >
                      Add Secret
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Environment</TableCell>
                          <TableCell>Last Rotated</TableCell>
                          <TableCell>Expires</TableCell>
                          <TableCell>Access Count</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {secrets?.map((secret) => (
                          <TableRow key={secret.id}>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{secret.name}</TableCell>
                            <TableCell>
                              <Chip label={secret.type} size="small" />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={secret.environment}
                                size="small"
                                color={secret.environment === 'prod' ? 'error' : secret.environment === 'staging' ? 'warning' : 'default'}
                              />
                            </TableCell>
                            <TableCell>{new Date(secret.lastRotated).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {(() => {
                                const expires = new Date(secret.expires);
                                const now = new Date();
                                const daysUntil = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                return (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2">{daysUntil} days</Typography>
                                    {daysUntil <= 7 && (
                                      <Warning sx={{ ml: 1, color: COLORS.warning, fontSize: 16 }} />
                                    )}
                                  </Box>
                                );
                              })()}
                            </TableCell>
                            <TableCell>{secret.accessCount}</TableCell>
                            <TableCell>
                              <Chip
                                label={secret.status === 'on-time' ? 'On-Time' : secret.status === 'due-soon' ? 'Due Soon' : 'Overdue'}
                                size="small"
                                color={secret.status === 'on-time' ? 'success' : secret.status === 'due-soon' ? 'warning' : 'error'}
                              />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <IconButton size="small">
                                  <Refresh />
                                </IconButton>
                                <IconButton size="small">
                                  <Edit />
                                </IconButton>
                                <IconButton size="small" color="error">
                                  <Delete />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Access Logs */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Access Logs</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => handleExportLogs('csv')}
                      >
                        Export CSV
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => handleExportLogs('json')}
                      >
                        Export JSON
                      </Button>
                    </Stack>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Timestamp</TableCell>
                          <TableCell>Secret</TableCell>
                          <TableCell>User</TableCell>
                          <TableCell>Action</TableCell>
                          <TableCell>IP Address</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {accessLogs?.slice(0, 20).map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{log.secretName}</TableCell>
                            <TableCell>{log.user}</TableCell>
                            <TableCell>
                              <Chip label={log.action} size="small" />
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{log.ip}</TableCell>
                            <TableCell>
                              {log.success ? (
                                <CheckCircle sx={{ color: COLORS.success }} />
                              ) : (
                                <Error sx={{ color: COLORS.error }} />
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
        </Box>
      )}

      {/* Tab 5: Compliance */}
      {activeTab === 4 && (
        <Box>
          <Grid container spacing={3}>
            {/* Overall Compliance Score */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Overall Compliance Score
                  </Typography>
                  <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="50%"
                        outerRadius="100%"
                        data={complianceRadialData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <RadialBar dataKey="value" cornerRadius={10} />
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="48" fontWeight="bold">
                          {complianceScore?.overall || 0}
                        </text>
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Category Breakdown */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Compliance Breakdown
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Data-at-Rest Encryption</Typography>
                        <Typography fontWeight="bold">{complianceScore?.dataAtRest || 0}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={complianceScore?.dataAtRest || 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(76, 175, 80, 0.2)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: COLORS.success
                          }
                        }}
                      />
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Data-in-Transit Encryption</Typography>
                        <Typography fontWeight="bold">{complianceScore?.dataInTransit || 0}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={complianceScore?.dataInTransit || 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(33, 150, 243, 0.2)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: COLORS.info
                          }
                        }}
                      />
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>End-to-End Encryption</Typography>
                        <Typography fontWeight="bold">{complianceScore?.e2ee || 0}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={complianceScore?.e2ee || 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(25, 118, 210, 0.2)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: COLORS.primary
                          }
                        }}
                      />
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Field-Level Encryption</Typography>
                        <Typography fontWeight="bold">{complianceScore?.fieldLevel || 0}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={complianceScore?.fieldLevel || 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(255, 152, 0, 0.2)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: COLORS.warning
                          }
                        }}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Non-Compliant Resources */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Non-Compliant Resources
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Resource ID</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Issue</TableCell>
                          <TableCell>Severity</TableCell>
                          <TableCell>Remediation</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {nonCompliantResources?.map((resource) => (
                          <TableRow key={resource.id}>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{resource.id}</TableCell>
                            <TableCell>{resource.type}</TableCell>
                            <TableCell>{resource.issue}</TableCell>
                            <TableCell>
                              <Chip
                                label={resource.severity.toUpperCase()}
                                size="small"
                                sx={{
                                  backgroundColor: SEVERITY_COLORS[resource.severity],
                                  color: 'white'
                                }}
                              />
                            </TableCell>
                            <TableCell>{resource.remediation}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Generate Report */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Generate Compliance Report
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Download a comprehensive compliance report in PDF format
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CloudDownload />}
                    onClick={handleGeneratePDFReport}
                  >
                    Download PDF Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Key Rotation Dialog */}
      <Dialog open={rotationDialogOpen} onClose={() => setRotationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rotate Encryption Key</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Warning</AlertTitle>
            This will create a new version of the encryption key and re-encrypt all data. This process may take several minutes.
          </Alert>
          {selectedKey && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Key ID:</strong> {selectedKey.id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Type:</strong> {selectedKey.type}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Current Version:</strong> {selectedKey.version}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Last Rotated:</strong> {new Date(selectedKey.lastRotated).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRotationDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => selectedKey && handleRotateKey(selectedKey.id)}
          >
            Rotate Key
          </Button>
        </DialogActions>
      </Dialog>

      {/* Policy Editor Dialog */}
      <Dialog open={policyDialogOpen} onClose={() => setPolicyDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedPolicy ? 'Edit Policy' : 'Add Policy'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Policy Name"
              fullWidth
              defaultValue={selectedPolicy?.name}
            />
            <TextField
              label="Priority"
              type="number"
              fullWidth
              defaultValue={selectedPolicy?.priority || 1}
            />
            <FormControlLabel
              control={<Switch defaultChecked={selectedPolicy?.enabled !== false} />}
              label="Enabled"
            />
            <Typography variant="subtitle2" gutterBottom>
              Policy Configuration (JSON)
            </Typography>
            <Box sx={{ height: 300, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Editor
                height="300px"
                defaultLanguage="json"
                defaultValue={JSON.stringify(selectedPolicy || {
                  conditions: [],
                  actions: []
                }, null, 2)}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12
                }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPolicyDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary">
            Save Policy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Secret Dialog */}
      <Dialog open={secretDialogOpen} onClose={() => setSecretDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Secret</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Secret Name" fullWidth required />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select label="Type" defaultValue="">
                <MenuItem value="api-key">API Key</MenuItem>
                <MenuItem value="db-credentials">Database Credentials</MenuItem>
                <MenuItem value="oauth-token">OAuth Token</MenuItem>
                <MenuItem value="ssh-key">SSH Key</MenuItem>
                <MenuItem value="certificate">Certificate</MenuItem>
                <MenuItem value="encryption-key">Encryption Key</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Environment</InputLabel>
              <Select label="Environment" defaultValue="dev">
                <MenuItem value="dev">Development</MenuItem>
                <MenuItem value="staging">Staging</MenuItem>
                <MenuItem value="prod">Production</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Secret Value"
              fullWidth
              multiline
              rows={4}
              type={showSecretValue ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowSecretValue(!showSecretValue)}>
                    {showSecretValue ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
            <TextField
              label="Rotation Days"
              type="number"
              fullWidth
              defaultValue={90}
              helperText="Number of days before automatic rotation"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSecretDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary">
            Add Secret
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
