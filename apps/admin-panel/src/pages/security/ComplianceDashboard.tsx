import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Tooltip,
  Badge,
  Alert,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  BugReport as BugReportIcon,
  AccountTree as WorkflowIcon,
  Description as DescriptionIcon,
  Link as LinkIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  RadialBarChart,
  RadialBar,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
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
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { format, subMonths, isAfter, isBefore } from 'date-fns';
import useSWR from 'swr';
import jsPDF from 'jspdf';
import { Formik, Form, Field } from 'formik';

// ==================== Interfaces ====================

interface ComplianceScore {
  frameworkId: string;
  overallScore: number;
  domainScores: Record<string, number>;
  controlsPassed: number;
  controlsFailed: number;
  controlsNotTested: number;
  controlsNotApplicable: number;
  totalControls: number;
  trend: Array<{
    date: string;
    score: number;
    controlsPassed: number;
    controlsFailed: number;
  }>;
  lastCalculated: string;
}

interface ComplianceControl {
  id: string;
  frameworkId: string;
  controlId: string;
  title: string;
  description: string;
  domain: string;
  type: string;
  category: string;
  testProcedure: string;
  testFrequency: string;
  automatable: boolean;
  status: 'pass' | 'fail' | 'not_applicable' | 'not_tested' | 'manual_review';
  lastTested?: string;
  nextTest?: string;
  owner: string;
  implementationStatus: string;
  evidenceCount: number;
  findingsCount: number;
  mappedControls: Array<{
    frameworkId: string;
    controlId: string;
    relationshipType: string;
  }>;
}

interface Vulnerability {
  id: string;
  cveId: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvssScore: number;
  affectedAssets: string[];
  status: 'open' | 'in_progress' | 'patched' | 'mitigated' | 'accepted';
  priorityScore: number;
  assignedTo: string;
  dueDate: string;
  discoveredDate: string;
  exploitAvailable: boolean;
  kev: boolean;
  patchAvailable: boolean;
}

interface SecurityWorkflow {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  priority: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  steps: Array<{
    id: string;
    name: string;
    status: string;
    type: string;
  }>;
  metadata: Record<string, any>;
}

interface AuditEvent {
  id: string;
  auditId: string;
  frameworkId: string;
  auditType: string;
  auditor: string;
  startDate: string;
  endDate: string;
  status: string;
  findings: Array<{
    id: string;
    controlId: string;
    findingType: string;
    severity: string;
    description: string;
    status: string;
  }>;
}

// ==================== Main Component ====================

const ComplianceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedFramework, setSelectedFramework] = useState('soc2');
  const [selectedControl, setSelectedControl] = useState<ComplianceControl | null>(null);
  const [controlDialogOpen, setControlDialogOpen] = useState(false);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<SecurityWorkflow | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: complianceScores, mutate: mutateScores } = useSWR<ComplianceScore[]>(
    '/api/compliance/scores',
    { refreshInterval: 10000 }
  );

  const { data: controls, mutate: mutateControls } = useSWR<ComplianceControl[]>(
    `/api/compliance/controls?framework=${selectedFramework}`,
    { refreshInterval: 10000 }
  );

  const { data: vulnerabilities, mutate: mutateVulnerabilities } = useSWR<Vulnerability[]>(
    '/api/vulnerabilities',
    { refreshInterval: 10000 }
  );

  const { data: workflows, mutate: mutateWorkflows } = useSWR<SecurityWorkflow[]>(
    '/api/security/workflows',
    { refreshInterval: 10000 }
  );

  const { data: audits, mutate: mutateAudits } = useSWR<AuditEvent[]>(
    '/api/compliance/audits',
    { refreshInterval: 10000 }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleControlClick = (control: ComplianceControl) => {
    setSelectedControl(control);
    setControlDialogOpen(true);
  };

  const handleWorkflowClick = (workflow: SecurityWorkflow) => {
    setSelectedWorkflow(workflow);
    setWorkflowDialogOpen(true);
  };

  const handleRunControlTest = async (controlId: string) => {
    try {
      await fetch(`/api/compliance/controls/${controlId}/test`, { method: 'POST' });
      mutateControls();
    } catch (error) {
      console.error('Failed to run control test:', error);
    }
  };

  const handleGenerateReport = async (reportType: string) => {
    try {
      const response = await fetch('/api/compliance/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameworkId: selectedFramework, reportType }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${selectedFramework}-${Date.now()}.pdf`;
      a.click();
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const filteredControls = useMemo(() => {
    if (!controls) return [];

    return controls.filter(control => {
      if (filterStatus !== 'all' && control.status !== filterStatus) return false;
      return true;
    });
  }, [controls, filterStatus]);

  const filteredVulnerabilities = useMemo(() => {
    if (!vulnerabilities) return [];

    return vulnerabilities.filter(vuln => {
      if (filterSeverity !== 'all' && vuln.severity !== filterSeverity) return false;
      if (filterStatus !== 'all' && vuln.status !== filterStatus) return false;
      return true;
    });
  }, [vulnerabilities, filterSeverity, filterStatus]);

  const overdueVulnerabilities = useMemo(() => {
    if (!vulnerabilities) return [];

    return vulnerabilities.filter(v => {
      const dueDate = new Date(v.dueDate);
      return isBefore(dueDate, new Date()) && v.status === 'open';
    });
  }, [vulnerabilities]);

  // ==================== Tab Content ====================

  const renderOverviewTab = () => {
    if (!complianceScores) {
      return <CircularProgress />;
    }

    const frameworkData = complianceScores.map(score => ({
      name: score.frameworkId.toUpperCase(),
      value: score.overallScore,
      fill: getScoreColor(score.overallScore),
    }));

    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Overall Compliance Score
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="10%"
                    outerRadius="90%"
                    data={frameworkData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar
                      minAngle={15}
                      background
                      clockWise
                      dataKey="value"
                      label={{ position: 'insideStart', fill: '#fff' }}
                    />
                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                    <RechartsTooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Framework Breakdown
                </Typography>
                <Stack spacing={2}>
                  {complianceScores.map(score => (
                    <Box key={score.frameworkId}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" fontWeight="bold">
                          {score.frameworkId.toUpperCase()}
                        </Typography>
                        <Typography variant="body2" color={getScoreColor(score.overallScore)}>
                          {score.overallScore.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={score.overallScore}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getScoreColor(score.overallScore),
                          },
                        }}
                      />
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="caption" color="textSecondary">
                          Passed: {score.controlsPassed}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Failed: {score.controlsFailed}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Total: {score.totalControls}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Compliance Trend (Last 12 Months)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={complianceScores[0]?.trend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM yy')} />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#1976d2" strokeWidth={2} name="Score %" />
                    <Line type="monotone" dataKey="controlsPassed" stroke="#4caf50" strokeWidth={2} name="Passed" />
                    <Line type="monotone" dataKey="controlsFailed" stroke="#f44336" strokeWidth={2} name="Failed" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <BugReportIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6">Vulnerabilities</Typography>
                </Box>
                <Typography variant="h3" color="error">
                  {vulnerabilities?.length || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Open Vulnerabilities
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Chip label="Critical" size="small" color="error" />
                    <Typography>{vulnerabilities?.filter(v => v.severity === 'critical').length || 0}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Chip label="High" size="small" color="warning" />
                    <Typography>{vulnerabilities?.filter(v => v.severity === 'high').length || 0}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Chip label="Overdue" size="small" color="error" variant="outlined" />
                    <Typography>{overdueVulnerabilities.length}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <WorkflowIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Active Workflows</Typography>
                </Box>
                <Typography variant="h3" color="primary">
                  {workflows?.filter(w => w.status === 'running').length || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Currently Running
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Completed</Typography>
                    <Typography>{workflows?.filter(w => w.status === 'completed').length || 0}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Failed</Typography>
                    <Typography color="error">{workflows?.filter(w => w.status === 'failed').length || 0}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CalendarIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">Upcoming Audits</Typography>
                </Box>
                <Typography variant="h3" color="info">
                  {audits?.filter(a => a.status === 'scheduled').length || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Scheduled Audits
                </Typography>
                <Divider sx={{ my: 2 }} />
                {audits?.filter(a => a.status === 'scheduled').slice(0, 2).map(audit => (
                  <Box key={audit.id} mb={1}>
                    <Typography variant="body2" fontWeight="bold">{audit.frameworkId.toUpperCase()}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {format(new Date(audit.startDate), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderControlsTab = () => {
    return (
      <Box>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Framework</InputLabel>
                <Select
                  value={selectedFramework}
                  onChange={(e) => setSelectedFramework(e.target.value)}
                  label="Framework"
                >
                  <MenuItem value="soc2">SOC 2</MenuItem>
                  <MenuItem value="iso27001">ISO 27001</MenuItem>
                  <MenuItem value="pci-dss">PCI-DSS</MenuItem>
                  <MenuItem value="hipaa">HIPAA</MenuItem>
                  <MenuItem value="gdpr">GDPR</MenuItem>
                  <MenuItem value="nist-csf">NIST CSF</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pass">Pass</MenuItem>
                  <MenuItem value="fail">Fail</MenuItem>
                  <MenuItem value="not_tested">Not Tested</MenuItem>
                  <MenuItem value="manual_review">Manual Review</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={() => {
                  filteredControls.filter(c => c.automatable).forEach(c => handleRunControlTest(c.id));
                }}
                fullWidth
              >
                Run All Tests
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => mutateControls()}
                fullWidth
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Control ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Tested</TableCell>
                <TableCell>Next Test</TableCell>
                <TableCell>Evidence</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredControls
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((control) => (
                  <TableRow
                    key={control.id}
                    hover
                    onClick={() => handleControlClick(control)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {control.controlId}
                      </Typography>
                    </TableCell>
                    <TableCell>{control.title}</TableCell>
                    <TableCell>
                      <Chip label={control.domain} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{renderStatusChip(control.status)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {control.lastTested ? format(new Date(control.lastTested), 'MMM dd, yyyy') : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {control.nextTest ? format(new Date(control.nextTest), 'MMM dd, yyyy') : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Badge badgeContent={control.evidenceCount} color="primary">
                        <DescriptionIcon />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {control.owner}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunControlTest(control.id);
                        }}
                        disabled={!control.automatable}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredControls.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>
      </Box>
    );
  };

  const renderVulnerabilitiesTab = () => {
    const riskHeatmapData = useMemo(() => {
      if (!vulnerabilities) return [];

      return vulnerabilities.map(v => ({
        x: v.cvssScore,
        y: v.priorityScore,
        z: 10,
        name: v.cveId,
        severity: v.severity,
      }));
    }, [vulnerabilities]);

    return (
      <Box>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  label="Severity"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="patched">Patched</MenuItem>
                  <MenuItem value="mitigated">Mitigated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Alert severity="warning" icon={<WarningIcon />}>
                {overdueVulnerabilities.length} vulnerabilities are overdue for remediation
              </Alert>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vulnerability Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Critical', value: vulnerabilities?.filter(v => v.severity === 'critical').length || 0, fill: '#d32f2f' },
                        { name: 'High', value: vulnerabilities?.filter(v => v.severity === 'high').length || 0, fill: '#f57c00' },
                        { name: 'Medium', value: vulnerabilities?.filter(v => v.severity === 'medium').length || 0, fill: '#fbc02d' },
                        { name: 'Low', value: vulnerabilities?.filter(v => v.severity === 'low').length || 0, fill: '#388e3c' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Risk Heatmap
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="x" name="CVSS Score" domain={[0, 10]} />
                    <YAxis type="number" dataKey="y" name="Priority Score" domain={[0, 400]} />
                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Vulnerabilities" data={riskHeatmapData} fill="#1976d2" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>CVE ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>CVSS</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>SLA</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVulnerabilities
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((vuln) => (
                  <TableRow key={vuln.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="bold">
                          {vuln.cveId}
                        </Typography>
                        {vuln.exploitAvailable && (
                          <Tooltip title="Public exploit available">
                            <ErrorIcon color="error" fontSize="small" />
                          </Tooltip>
                        )}
                        {vuln.kev && (
                          <Tooltip title="Known Exploited Vulnerability">
                            <WarningIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {vuln.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{renderSeverityChip(vuln.severity)}</TableCell>
                    <TableCell>
                      <Chip
                        label={vuln.cvssScore.toFixed(1)}
                        size="small"
                        color={getCVSSColor(vuln.cvssScore)}
                      />
                    </TableCell>
                    <TableCell>{renderVulnStatusChip(vuln.status)}</TableCell>
                    <TableCell>{renderSLAProgress(vuln.dueDate, vuln.discoveredDate)}</TableCell>
                    <TableCell>
                      <Chip label={vuln.priorityScore} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                        {vuln.assignedTo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <LinkIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredVulnerabilities.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>
      </Box>
    );
  };

  const renderWorkflowsTab = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    React.useEffect(() => {
      if (selectedWorkflow) {
        const workflowNodes: Node[] = selectedWorkflow.steps.map((step, index) => ({
          id: step.id,
          type: 'default',
          data: { label: step.name },
          position: { x: 150, y: index * 100 },
          style: {
            background: getStepColor(step.status),
            color: '#fff',
            border: '1px solid #222',
          },
        }));

        const workflowEdges: Edge[] = selectedWorkflow.steps.slice(0, -1).map((step, index) => ({
          id: `e${step.id}-${selectedWorkflow.steps[index + 1].id}`,
          source: step.id,
          target: selectedWorkflow.steps[index + 1].id,
          animated: selectedWorkflow.steps[index + 1].status === 'running',
        }));

        setNodes(workflowNodes);
        setEdges(workflowEdges);
      }
    }, [selectedWorkflow, setNodes, setEdges]);

    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Workflows
                </Typography>
                <List>
                  {workflows?.filter(w => w.status === 'running' || w.status === 'paused').map(workflow => (
                    <ListItem
                      key={workflow.id}
                      button
                      onClick={() => handleWorkflowClick(workflow)}
                      selected={selectedWorkflow?.id === workflow.id}
                    >
                      <ListItemIcon>
                        <WorkflowIcon color={workflow.status === 'running' ? 'primary' : 'disabled'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={workflow.name}
                        secondary={`${workflow.type} - ${workflow.status}`}
                      />
                      <LinearProgress
                        variant="determinate"
                        value={(workflow.steps.filter(s => s.status === 'completed').length / workflow.steps.length) * 100}
                        sx={{ width: 100 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Playbook Library
                </Typography>
                <Grid container spacing={2}>
                  {['Phishing Response', 'Malware Response', 'Vulnerability Response', 'Compliance Check'].map(playbook => (
                    <Grid item xs={12} sm={6} key={playbook}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="body1" fontWeight="bold">
                            {playbook}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Last run: 2 hours ago
                          </Typography>
                          <Box mt={2}>
                            <Button size="small" variant="contained" fullWidth>
                              Run Playbook
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: 600 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Workflow Visualization
                </Typography>
                {selectedWorkflow ? (
                  <Box sx={{ height: 500 }}>
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      fitView
                    >
                      <Background />
                      <Controls />
                      <MiniMap />
                    </ReactFlow>
                  </Box>
                ) : (
                  <Box display="flex" alignItems="center" justifyContent="center" height={500}>
                    <Typography color="textSecondary">
                      Select a workflow to view visualization
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Workflow History
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Started</TableCell>
                        <TableCell>Completed</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Steps</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {workflows?.filter(w => w.status === 'completed' || w.status === 'failed').slice(0, 10).map(workflow => (
                        <TableRow key={workflow.id} hover onClick={() => handleWorkflowClick(workflow)}>
                          <TableCell>{workflow.name}</TableCell>
                          <TableCell>
                            <Chip label={workflow.type} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{renderWorkflowStatusChip(workflow.status)}</TableCell>
                          <TableCell>
                            {workflow.startedAt ? format(new Date(workflow.startedAt), 'MMM dd, HH:mm') : '-'}
                          </TableCell>
                          <TableCell>
                            {workflow.completedAt ? format(new Date(workflow.completedAt), 'MMM dd, HH:mm') : '-'}
                          </TableCell>
                          <TableCell>
                            {workflow.startedAt && workflow.completedAt
                              ? `${Math.round((new Date(workflow.completedAt).getTime() - new Date(workflow.startedAt).getTime()) / 60000)}m`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {workflow.steps.filter(s => s.status === 'completed').length} / {workflow.steps.length}
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
  };

  const renderAuditsTab = () => {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Audit Schedule</Typography>
                  <Button variant="contained" startIcon={<CalendarIcon />}>
                    Schedule Audit
                  </Button>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Audit ID</TableCell>
                        <TableCell>Framework</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Auditor</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Findings</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {audits?.map(audit => (
                        <TableRow key={audit.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {audit.auditId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={audit.frameworkId.toUpperCase()} size="small" />
                          </TableCell>
                          <TableCell>{audit.auditType}</TableCell>
                          <TableCell>{audit.auditor}</TableCell>
                          <TableCell>{format(new Date(audit.startDate), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{format(new Date(audit.endDate), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{renderAuditStatusChip(audit.status)}</TableCell>
                          <TableCell>
                            <Badge badgeContent={audit.findings.length} color="error">
                              <AssessmentIcon />
                            </Badge>
                          </TableCell>
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
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Audit Findings
                </Typography>
                <List>
                  {audits?.flatMap(a => a.findings).slice(0, 5).map(finding => (
                    <ListItem key={finding.id}>
                      <ListItemText
                        primary={finding.description}
                        secondary={`${finding.controlId} - ${finding.severity}`}
                      />
                      {renderFindingSeverityIcon(finding.severity)}
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Auditor Portal
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Generate a secure link for external auditors to access evidence and documentation.
                </Typography>
                <Button variant="contained" startIcon={<LinkIcon />} fullWidth>
                  Generate Portal Link
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderReportsTab = () => {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Compliance Reports
                </Typography>
                <Stack spacing={2}>
                  {['SOC 2', 'ISO 27001', 'PCI-DSS', 'HIPAA', 'GDPR'].map(framework => (
                    <Box key={framework} display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body1" fontWeight="bold">{framework}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Comprehensive compliance report
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleGenerateReport(framework)}
                      >
                        Generate
                      </Button>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Executive Summary
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  One-page overview with scores, trends, and top risks
                </Typography>
                <Button variant="contained" startIcon={<DownloadIcon />} fullWidth>
                  Download Executive Summary
                </Button>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Evidence Package
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Complete evidence collection for all controls
                </Typography>
                <Button variant="contained" startIcon={<DownloadIcon />} fullWidth>
                  Download Evidence Package
                </Button>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Scheduled Reports
                </Typography>
                <Formik
                  initialValues={{ frequency: 'weekly', recipients: '' }}
                  onSubmit={(values) => console.log(values)}
                >
                  {({ values, handleChange, handleSubmit }) => (
                    <Form onSubmit={handleSubmit}>
                      <Stack spacing={2}>
                        <FormControl fullWidth>
                          <InputLabel>Frequency</InputLabel>
                          <Select
                            name="frequency"
                            value={values.frequency}
                            onChange={handleChange}
                            label="Frequency"
                          >
                            <MenuItem value="daily">Daily</MenuItem>
                            <MenuItem value="weekly">Weekly</MenuItem>
                            <MenuItem value="monthly">Monthly</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          name="recipients"
                          label="Email Recipients"
                          value={values.recipients}
                          onChange={handleChange}
                          placeholder="email@example.com"
                          fullWidth
                        />
                        <Button type="submit" variant="contained">
                          Schedule Report
                        </Button>
                      </Stack>
                    </Form>
                  )}
                </Formik>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // ==================== Helper Functions ====================

  const getScoreColor = (score: number): string => {
    if (score >= 95) return '#4caf50';
    if (score >= 85) return '#8bc34a';
    if (score >= 70) return '#ffc107';
    return '#f44336';
  };

  const getCVSSColor = (score: number): 'error' | 'warning' | 'info' | 'success' => {
    if (score >= 9.0) return 'error';
    if (score >= 7.0) return 'warning';
    if (score >= 4.0) return 'info';
    return 'success';
  };

  const getStepColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'running': return '#2196f3';
      case 'failed': return '#f44336';
      case 'pending': return '#9e9e9e';
      default: return '#757575';
    }
  };

  const renderStatusChip = (status: string) => {
    const config = {
      pass: { label: 'Pass', color: 'success' as const, icon: <CheckCircleIcon /> },
      fail: { label: 'Fail', color: 'error' as const, icon: <ErrorIcon /> },
      not_tested: { label: 'Not Tested', color: 'default' as const, icon: <InfoIcon /> },
      manual_review: { label: 'Manual Review', color: 'warning' as const, icon: <WarningIcon /> },
      not_applicable: { label: 'N/A', color: 'default' as const, icon: <InfoIcon /> },
    };

    const { label, color, icon } = config[status as keyof typeof config] || config.not_tested;

    return <Chip label={label} color={color} size="small" icon={icon} />;
  };

  const renderSeverityChip = (severity: string) => {
    const config = {
      critical: { label: 'Critical', color: 'error' as const },
      high: { label: 'High', color: 'warning' as const },
      medium: { label: 'Medium', color: 'info' as const },
      low: { label: 'Low', color: 'success' as const },
    };

    const { label, color } = config[severity as keyof typeof config] || config.low;

    return <Chip label={label} color={color} size="small" />;
  };

  const renderVulnStatusChip = (status: string) => {
    const config = {
      open: { label: 'Open', color: 'error' as const },
      in_progress: { label: 'In Progress', color: 'warning' as const },
      patched: { label: 'Patched', color: 'success' as const },
      mitigated: { label: 'Mitigated', color: 'info' as const },
      accepted: { label: 'Accepted', color: 'default' as const },
    };

    const { label, color } = config[status as keyof typeof config] || config.open;

    return <Chip label={label} color={color} size="small" />;
  };

  const renderWorkflowStatusChip = (status: string) => {
    const config = {
      running: { label: 'Running', color: 'primary' as const },
      completed: { label: 'Completed', color: 'success' as const },
      failed: { label: 'Failed', color: 'error' as const },
      paused: { label: 'Paused', color: 'warning' as const },
    };

    const { label, color } = config[status as keyof typeof config] || { label: status, color: 'default' as const };

    return <Chip label={label} color={color} size="small" />;
  };

  const renderAuditStatusChip = (status: string) => {
    const config = {
      scheduled: { label: 'Scheduled', color: 'info' as const },
      in_progress: { label: 'In Progress', color: 'warning' as const },
      completed: { label: 'Completed', color: 'success' as const },
    };

    const { label, color } = config[status as keyof typeof config] || { label: status, color: 'default' as const };

    return <Chip label={label} color={color} size="small" />;
  };

  const renderFindingSeverityIcon = (severity: string) => {
    if (severity === 'critical' || severity === 'high') return <ErrorIcon color="error" />;
    if (severity === 'medium') return <WarningIcon color="warning" />;
    return <InfoIcon color="info" />;
  };

  const renderSLAProgress = (dueDate: string, discoveredDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const discovered = new Date(discoveredDate);

    const totalTime = due.getTime() - discovered.getTime();
    const elapsed = now.getTime() - discovered.getTime();
    const progress = Math.min(100, (elapsed / totalTime) * 100);

    const color = progress > 100 ? 'error' : progress > 80 ? 'warning' : 'success';
    const daysRemaining = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return (
      <Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, progress)}
          color={color}
          sx={{ mb: 0.5 }}
        />
        <Typography variant="caption" color={color === 'error' ? 'error' : 'textSecondary'}>
          {daysRemaining > 0 ? `${daysRemaining}d remaining` : `${Math.abs(daysRemaining)}d overdue`}
        </Typography>
      </Box>
    );
  };

  // ==================== Main Render ====================

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Security & Compliance Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<AssessmentIcon />}>
            Metrics
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => setReportDialogOpen(true)}>
            Export
          </Button>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => {
            mutateScores();
            mutateControls();
            mutateVulnerabilities();
            mutateWorkflows();
            mutateAudits();
          }}>
            Refresh All
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" icon={<SecurityIcon />} iconPosition="start" />
          <Tab label="Controls" icon={<CheckCircleIcon />} iconPosition="start" />
          <Tab label="Vulnerabilities" icon={<BugReportIcon />} iconPosition="start" />
          <Tab label="Workflows" icon={<WorkflowIcon />} iconPosition="start" />
          <Tab label="Audits" icon={<CalendarIcon />} iconPosition="start" />
          <Tab label="Reports" icon={<DescriptionIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      <Box>
        {activeTab === 0 && renderOverviewTab()}
        {activeTab === 1 && renderControlsTab()}
        {activeTab === 2 && renderVulnerabilitiesTab()}
        {activeTab === 3 && renderWorkflowsTab()}
        {activeTab === 4 && renderAuditsTab()}
        {activeTab === 5 && renderReportsTab()}
      </Box>

      <Dialog open={controlDialogOpen} onClose={() => setControlDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedControl?.controlId}: {selectedControl?.title}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Description</Typography>
              <Typography variant="body2">{selectedControl?.description}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Test Procedure</Typography>
              <Typography variant="body2">{selectedControl?.testProcedure}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Mapped Controls</Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {selectedControl?.mappedControls.map(mapping => (
                  <Chip
                    key={`${mapping.frameworkId}-${mapping.controlId}`}
                    label={`${mapping.frameworkId.toUpperCase()}: ${mapping.controlId}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setControlDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => {
            if (selectedControl) handleRunControlTest(selectedControl.id);
            setControlDialogOpen(false);
          }}>
            Run Test
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={workflowDialogOpen} onClose={() => setWorkflowDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{selectedWorkflow?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Status</Typography>
              {selectedWorkflow && renderWorkflowStatusChip(selectedWorkflow.status)}
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Steps</Typography>
              {selectedWorkflow?.steps.map(step => (
                <Box key={step.id} display="flex" justifyContent="space-between" alignItems="center" my={1}>
                  <Typography variant="body2">{step.name}</Typography>
                  <Chip label={step.status} size="small" sx={{ bgcolor: getStepColor(step.status), color: '#fff' }} />
                </Box>
              ))}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkflowDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplianceDashboard;
