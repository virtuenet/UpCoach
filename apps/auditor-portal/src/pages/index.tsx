import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Description as DescriptionIcon,
  CloudDownload as CloudDownloadIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

/**
 * Auditor Portal - Read-Only Compliance Dashboard
 *
 * Secure portal for external SOC2 auditors to:
 * - Review control attestations
 * - Browse evidence packages
 * - Download audit trails
 * - View system architecture
 * - Access policy documents
 *
 * Security:
 * - Read-only access (no mutations)
 * - Audit log for all views/downloads
 * - Time-limited access tokens
 * - IP whitelist restrictions
 */

interface ControlStatus {
  controlId: string;
  controlName: string;
  category: string;
  status: 'passing' | 'failing' | 'warning';
  evidenceCount: number;
  lastExecuted: string;
  complianceScore: number;
}

interface EvidencePackage {
  id: string;
  controlId: string;
  controlName: string;
  startDate: string;
  endDate: string;
  evidenceCount: number;
  generatedAt: string;
  downloadUrl: string;
}

interface PolicyDocument {
  id: string;
  name: string;
  version: string;
  status: string;
  publishedAt: string;
  complianceRate: number;
}

interface AuditTrailEntry {
  id: string;
  timestamp: string;
  action: string;
  resource: string;
  userId: string;
  ipAddress: string;
}

export default function AuditorPortalHome() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Controls state
  const [controls, setControls] = useState<ControlStatus[]>([]);
  const [selectedControl, setSelectedControl] = useState<ControlStatus | null>(null);

  // Evidence state
  const [evidencePackages, setEvidencePackages] = useState<EvidencePackage[]>([]);

  // Policy state
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDocument | null>(null);
  const [policyContent, setPolicyContent] = useState<string>('');

  // Audit trail state
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState('');

  // Dialog state
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // In production, replace with actual API calls
      // For now, using mock data
      await Promise.all([
        loadControls(),
        loadEvidencePackages(),
        loadPolicies(),
        loadAuditTrail(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadControls = async () => {
    // Mock data - replace with API call to /api/auditor/controls
    const mockControls: ControlStatus[] = [
      {
        controlId: 'CC6.1',
        controlName: 'Logical and Physical Access Controls',
        category: 'Common Criteria',
        status: 'passing',
        evidenceCount: 45,
        lastExecuted: new Date().toISOString(),
        complianceScore: 95,
      },
      {
        controlId: 'CC7.2',
        controlName: 'System Monitoring',
        category: 'Common Criteria',
        status: 'passing',
        evidenceCount: 38,
        lastExecuted: new Date().toISOString(),
        complianceScore: 92,
      },
      {
        controlId: 'CC8.1',
        controlName: 'Change Management',
        category: 'Common Criteria',
        status: 'warning',
        evidenceCount: 28,
        lastExecuted: new Date().toISOString(),
        complianceScore: 78,
      },
    ];
    setControls(mockControls);
  };

  const loadEvidencePackages = async () => {
    // Mock data - replace with API call to /api/auditor/evidence-packages
    const mockPackages: EvidencePackage[] = [
      {
        id: 'pkg-001',
        controlId: 'CC6.1',
        controlName: 'Logical and Physical Access Controls',
        startDate: '2025-01-01',
        endDate: '2025-12-26',
        evidenceCount: 45,
        generatedAt: new Date().toISOString(),
        downloadUrl: '/api/auditor/evidence-packages/pkg-001/download',
      },
      {
        id: 'pkg-002',
        controlId: 'CC7.2',
        controlName: 'System Monitoring',
        startDate: '2025-01-01',
        endDate: '2025-12-26',
        evidenceCount: 38,
        generatedAt: new Date().toISOString(),
        downloadUrl: '/api/auditor/evidence-packages/pkg-002/download',
      },
    ];
    setEvidencePackages(mockPackages);
  };

  const loadPolicies = async () => {
    // Mock data - replace with API call to /api/auditor/policies
    const mockPolicies: PolicyDocument[] = [
      {
        id: 'policy-001',
        name: 'Information Security Policy',
        version: '2.1.0',
        status: 'published',
        publishedAt: '2025-01-15T00:00:00Z',
        complianceRate: 98.5,
      },
      {
        id: 'policy-002',
        name: 'Access Control Policy',
        version: '1.5.0',
        status: 'published',
        publishedAt: '2025-02-01T00:00:00Z',
        complianceRate: 95.2,
      },
      {
        id: 'policy-003',
        name: 'Incident Response Policy',
        version: '3.0.0',
        status: 'published',
        publishedAt: '2025-03-10T00:00:00Z',
        complianceRate: 100,
      },
    ];
    setPolicies(mockPolicies);
  };

  const loadAuditTrail = async () => {
    // Mock data - replace with API call to /api/auditor/audit-trail
    const mockAuditTrail: AuditTrailEntry[] = [
      {
        id: 'audit-001',
        timestamp: new Date().toISOString(),
        action: 'VIEW_CONTROL',
        resource: 'CC6.1',
        userId: 'auditor@soc2firm.com',
        ipAddress: '203.0.113.42',
      },
      {
        id: 'audit-002',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: 'DOWNLOAD_EVIDENCE',
        resource: 'pkg-001',
        userId: 'auditor@soc2firm.com',
        ipAddress: '203.0.113.42',
      },
    ];
    setAuditTrail(mockAuditTrail);
  };

  const handleViewPolicy = async (policy: PolicyDocument) => {
    setSelectedPolicy(policy);
    setLoading(true);

    try {
      // Mock policy content - replace with API call
      const mockContent = `
# ${policy.name}

**Version**: ${policy.version}
**Published**: ${new Date(policy.publishedAt).toLocaleDateString()}

## 1. Purpose

This policy establishes the framework for managing information security...

## 2. Scope

This policy applies to all employees, contractors, and third parties...

## 3. Responsibilities

### 3.1 Information Security Officer
- Oversee information security program
- Conduct annual risk assessments
- Report to executive management

### 3.2 Employees
- Comply with security policies
- Report security incidents
- Complete annual training

## 4. Policy Statements

### 4.1 Access Control
All access to systems must be authorized...

### 4.2 Data Classification
Data must be classified as Public, Internal, Confidential, or Restricted...
      `;
      setPolicyContent(mockContent);
      setPolicyDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policy content');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadEvidence = async (packageId: string) => {
    try {
      // Log the download action
      await fetch('/api/auditor/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DOWNLOAD_EVIDENCE',
          resource: packageId,
        }),
      });

      // Trigger download
      window.open(`/api/auditor/evidence-packages/${packageId}/download`, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download evidence package');
    }
  };

  const handleExportAuditTrail = async () => {
    try {
      const csv = [
        ['Timestamp', 'Action', 'Resource', 'User', 'IP Address'].join(','),
        ...auditTrail.map((entry) =>
          [
            new Date(entry.timestamp).toISOString(),
            entry.action,
            entry.resource,
            entry.userId,
            entry.ipAddress,
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-trail-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export audit trail');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passing':
        return <CheckCircleIcon color="success" />;
      case 'failing':
        return <CancelIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <WarningIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passing':
        return 'success';
      case 'failing':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Overall Compliance
            </Typography>
            <Typography variant="h3" color="primary">
              92.5%
            </Typography>
            <LinearProgress variant="determinate" value={92.5} sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Controls Status
            </Typography>
            <Typography variant="h3">85/91</Typography>
            <Typography variant="body2" color="textSecondary" mt={1}>
              93% passing
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Evidence Collected
            </Typography>
            <Typography variant="h3">2,847</Typography>
            <Typography variant="body2" color="textSecondary" mt={1}>
              Last 365 days
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderControls = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          SOC2 Controls (91 Total)
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Control ID</TableCell>
              <TableCell>Control Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Evidence</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Last Executed</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {controls.map((control) => (
              <TableRow key={control.controlId}>
                <TableCell>{control.controlId}</TableCell>
                <TableCell>{control.controlName}</TableCell>
                <TableCell>
                  <Chip label={control.category} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(control.status)}
                    label={control.status.toUpperCase()}
                    color={getStatusColor(control.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip label={control.evidenceCount} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{control.complianceScore}%</TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(control.lastExecuted).toLocaleString()}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderEvidencePackages = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Evidence Packages
        </Typography>
        <List>
          {evidencePackages.map((pkg) => (
            <React.Fragment key={pkg.id}>
              <ListItem>
                <ListItemText
                  primary={`${pkg.controlId} - ${pkg.controlName}`}
                  secondary={
                    <>
                      <Typography variant="caption" display="block">
                        Period: {new Date(pkg.startDate).toLocaleDateString()} -{' '}
                        {new Date(pkg.endDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Evidence Items: {pkg.evidenceCount} | Generated:{' '}
                        {new Date(pkg.generatedAt).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
                <Tooltip title="Download Package">
                  <IconButton onClick={() => handleDownloadEvidence(pkg.id)}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderPolicies = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Policy Documents
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Policy Name</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Published</TableCell>
              <TableCell>Compliance Rate</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy.id}>
                <TableCell>{policy.name}</TableCell>
                <TableCell>
                  <Chip label={`v${policy.version}`} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={policy.status.toUpperCase()}
                    color={policy.status === 'published' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(policy.publishedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{policy.complianceRate}%</TableCell>
                <TableCell>
                  <Tooltip title="View Policy">
                    <IconButton size="small" onClick={() => handleViewPolicy(policy)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderAuditTrail = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Audit Trail</Typography>
          <Button
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
            onClick={handleExportAuditTrail}
          >
            Export CSV
          </Button>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="Filter by action, resource, or user..."
          value={auditFilter}
          onChange={(e) => setAuditFilter(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>User</TableCell>
              <TableCell>IP Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditTrail
              .filter(
                (entry) =>
                  !auditFilter ||
                  entry.action.toLowerCase().includes(auditFilter.toLowerCase()) ||
                  entry.resource.toLowerCase().includes(auditFilter.toLowerCase()) ||
                  entry.userId.toLowerCase().includes(auditFilter.toLowerCase())
              )
              .map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(entry.timestamp).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={entry.action} size="small" />
                  </TableCell>
                  <TableCell>{entry.resource}</TableCell>
                  <TableCell>{entry.userId}</TableCell>
                  <TableCell>
                    <Typography variant="caption">{entry.ipAddress}</Typography>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl">
      <Box py={4}>
        <Box display="flex" alignItems="center" mb={3}>
          <SecurityIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
          <Box>
            <Typography variant="h4">SOC2 Auditor Portal</Typography>
            <Typography variant="body2" color="textSecondary">
              Read-only compliance dashboard for external auditors
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          This portal provides read-only access to compliance controls, evidence packages,
          and policy documents. All views and downloads are logged for audit purposes.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {renderOverview()}

        <Box mt={4}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Controls" />
            <Tab label="Evidence Packages" />
            <Tab label="Policies" />
            <Tab label="Audit Trail" />
          </Tabs>

          <Box mt={3}>
            {activeTab === 0 && renderControls()}
            {activeTab === 1 && renderEvidencePackages()}
            {activeTab === 2 && renderPolicies()}
            {activeTab === 3 && renderAuditTrail()}
          </Box>
        </Box>

        {/* Policy Viewer Dialog */}
        <Dialog
          open={policyDialogOpen}
          onClose={() => setPolicyDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedPolicy?.name} (v{selectedPolicy?.version})
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                bgcolor: 'background.default',
                p: 2,
                borderRadius: 1,
              }}
            >
              {policyContent}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPolicyDialogOpen(false)}>Close</Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                const blob = new Blob([policyContent], { type: 'text/markdown' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedPolicy?.name}-v${selectedPolicy?.version}.md`;
                a.click();
                window.URL.revokeObjectURL(url);
              }}
            >
              Download
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
