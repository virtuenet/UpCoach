import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tooltip,
  Alert,
  AlertTitle,
  Checkbox,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  InputAdornment,
  CircularProgress,
  Stack,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  TableSortLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  GetApp as GetAppIcon,
  Upload as UploadIcon,
  PersonAdd as PersonAddIcon,
  Login as LoginIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Storage as StorageIcon,
  Api as ApiIcon,
  People as PeopleIcon,
  AttachMoney as AttachMoneyIcon,
  Code as CodeIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { format, formatDistance } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Editor from '@monaco-editor/react';
import { ChromePicker } from 'react-color';

/**
 * Tenant Dashboard - Complete Admin Panel for Multi-Tenancy Management
 */

enum TenantStatus {
  PROVISIONING = 'PROVISIONING',
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELED = 'CANCELED',
  DELETED = 'DELETED'
}

enum SubscriptionPlan {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE'
}

enum IsolationStrategy {
  DATABASE_PER_TENANT = 'DATABASE_PER_TENANT',
  SCHEMA_PER_TENANT = 'SCHEMA_PER_TENANT',
  ROW_LEVEL_SECURITY = 'ROW_LEVEL_SECURITY'
}

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  status: TenantStatus;
  isolationStrategy: IsolationStrategy;
  plan: SubscriptionPlan;
  adminEmail: string;
  industry: string;
  companySize: string;
  trialEndsAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    usersCount?: number;
    storageUsedGB?: number;
    apiCallsThisMonth?: number;
  };
}

interface TenantMetrics {
  dau: number;
  mau: number;
  activeUsers: number;
  totalUsers: number;
  apiCalls: number;
  storageUsedGB: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
  featuresUsed: string[];
  healthScore: number;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

const statusColors: Record<TenantStatus, string> = {
  [TenantStatus.PROVISIONING]: 'info',
  [TenantStatus.TRIAL]: 'warning',
  [TenantStatus.ACTIVE]: 'success',
  [TenantStatus.SUSPENDED]: 'error',
  [TenantStatus.CANCELED]: 'default',
  [TenantStatus.DELETED]: 'default'
};

const planConfigs = {
  [SubscriptionPlan.STARTER]: {
    price: 99,
    features: ['Up to 10 users', '10GB storage', '10K API calls/month', 'Email support']
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    price: 299,
    features: ['Up to 100 users', '100GB storage', '100K API calls/month', 'Priority support', 'White-labeling', 'Custom domain', 'SSO']
  },
  [SubscriptionPlan.ENTERPRISE]: {
    price: 999,
    features: ['Unlimited users', '10TB storage', '10M API calls/month', '24/7 support', 'All features', 'Dedicated infrastructure', 'SLA']
  }
};

export const TenantDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [orderBy, setOrderBy] = useState<keyof Tenant>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [detailsTab, setDetailsTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTenant, setMenuTenant] = useState<Tenant | null>(null);
  const [impersonationDialogOpen, setImpersonationDialogOpen] = useState(false);
  const [impersonationReason, setImpersonationReason] = useState('');

  const { data: tenantsData, error: tenantsError } = useSWR(
    `${API_BASE_URL}/tenants?search=${searchQuery}&status=${statusFilter}&plan=${planFilter}&limit=${rowsPerPage}&offset=${page * rowsPerPage}`,
    fetcher,
    { refreshInterval: 10000 }
  );

  const tenants = tenantsData?.tenants || [];
  const totalTenants = tenantsData?.total || 0;

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property: keyof Tenant) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedTenants(tenants.map((t: Tenant) => t.id));
    } else {
      setSelectedTenants([]);
    }
  };

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenants(prev =>
      prev.includes(tenantId)
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, tenant: Tenant) => {
    setAnchorEl(event.currentTarget);
    setMenuTenant(tenant);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuTenant(null);
  };

  const handleViewDetails = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDetailsDialogOpen(true);
    handleCloseMenu();
  };

  const handleSuspendTenant = async (tenantId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/tenants/${tenantId}/suspend`, {
        reason: 'Administrative action'
      });
      mutate(`${API_BASE_URL}/tenants?search=${searchQuery}&status=${statusFilter}&plan=${planFilter}&limit=${rowsPerPage}&offset=${page * rowsPerPage}`);
      handleCloseMenu();
    } catch (error) {
      console.error('Failed to suspend tenant:', error);
    }
  };

  const handleActivateTenant = async (tenantId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/tenants/${tenantId}/activate`);
      mutate(`${API_BASE_URL}/tenants?search=${searchQuery}&status=${statusFilter}&plan=${planFilter}&limit=${rowsPerPage}&offset=${page * rowsPerPage}`);
      handleCloseMenu();
    } catch (error) {
      console.error('Failed to activate tenant:', error);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_BASE_URL}/tenants/${tenantId}?hard=true`);
        mutate(`${API_BASE_URL}/tenants?search=${searchQuery}&status=${statusFilter}&plan=${planFilter}&limit=${rowsPerPage}&offset=${page * rowsPerPage}`);
        handleCloseMenu();
      } catch (error) {
        console.error('Failed to delete tenant:', error);
      }
    }
  };

  const handleImpersonateTenant = async () => {
    if (!menuTenant || !impersonationReason.trim()) {
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/tenants/${menuTenant.id}/impersonate`, {
        reason: impersonationReason
      });

      window.open(
        `https://${menuTenant.subdomain}.upcoach.com?impersonation_token=${response.data.token}`,
        '_blank'
      );

      setImpersonationDialogOpen(false);
      setImpersonationReason('');
      handleCloseMenu();
    } catch (error) {
      console.error('Failed to impersonate tenant:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedTenants.length === 0) {
      return;
    }

    if (window.confirm(`Are you sure you want to ${action} ${selectedTenants.length} tenant(s)?`)) {
      try {
        await axios.post(`${API_BASE_URL}/tenants/bulk/${action}`, {
          tenantIds: selectedTenants
        });

        mutate(`${API_BASE_URL}/tenants?search=${searchQuery}&status=${statusFilter}&plan=${planFilter}&limit=${rowsPerPage}&offset=${page * rowsPerPage}`);
        setSelectedTenants([]);
      } catch (error) {
        console.error(`Failed to ${action} tenants:`, error);
      }
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Multi-Tenancy Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage tenants, monitor usage, configure white-labeling, and control access
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Tenant List" />
        <Tab label="Create Tenant" />
        <Tab label="Analytics" />
        <Tab label="White-Label" />
        <Tab label="Bulk Operations" />
      </Tabs>

      {activeTab === 0 && (
        <TenantListTab
          tenants={tenants}
          totalTenants={totalTenants}
          page={page}
          rowsPerPage={rowsPerPage}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          planFilter={planFilter}
          setPlanFilter={setPlanFilter}
          orderBy={orderBy}
          order={order}
          selectedTenants={selectedTenants}
          onChangePage={handleChangePage}
          onChangeRowsPerPage={handleChangeRowsPerPage}
          onRequestSort={handleRequestSort}
          onSelectAll={handleSelectAll}
          onSelectTenant={handleSelectTenant}
          onOpenMenu={handleOpenMenu}
          onViewDetails={handleViewDetails}
          onCreateTenant={() => setCreateDialogOpen(true)}
        />
      )}

      {activeTab === 1 && (
        <CreateTenantTab onClose={() => setActiveTab(0)} />
      )}

      {activeTab === 2 && (
        <AnalyticsTab />
      )}

      {activeTab === 3 && (
        <WhiteLabelTab />
      )}

      {activeTab === 4 && (
        <BulkOperationsTab
          selectedTenants={selectedTenants}
          onBulkAction={handleBulkAction}
        />
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => menuTenant && handleViewDetails(menuTenant)}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setImpersonationDialogOpen(true)}>
          <ListItemIcon><LoginIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Impersonate</ListItemText>
        </MenuItem>
        <Divider />
        {menuTenant?.status === TenantStatus.SUSPENDED ? (
          <MenuItem onClick={() => menuTenant && handleActivateTenant(menuTenant.id)}>
            <ListItemIcon><PlayArrowIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Activate</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => menuTenant && handleSuspendTenant(menuTenant.id)}>
            <ListItemIcon><BlockIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Suspend</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => menuTenant && handleDeleteTenant(menuTenant.id)} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <TenantDetailsDialog
        open={detailsDialogOpen}
        tenant={selectedTenant}
        onClose={() => setDetailsDialogOpen(false)}
      />

      <Dialog open={impersonationDialogOpen} onClose={() => setImpersonationDialogOpen(false)}>
        <DialogTitle>Impersonate Tenant</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Important</AlertTitle>
            All actions during impersonation will be logged. Session expires in 1 hour.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Impersonation"
            value={impersonationReason}
            onChange={(e) => setImpersonationReason(e.target.value)}
            required
            helperText="Please provide a detailed reason for this impersonation session"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImpersonationDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleImpersonateTenant}
            variant="contained"
            disabled={!impersonationReason.trim()}
          >
            Start Impersonation
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

interface TenantListTabProps {
  tenants: Tenant[];
  totalTenants: number;
  page: number;
  rowsPerPage: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  planFilter: string;
  setPlanFilter: (plan: string) => void;
  orderBy: keyof Tenant;
  order: 'asc' | 'desc';
  selectedTenants: string[];
  onChangePage: (event: unknown, newPage: number) => void;
  onChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRequestSort: (property: keyof Tenant) => void;
  onSelectAll: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectTenant: (tenantId: string) => void;
  onOpenMenu: (event: React.MouseEvent<HTMLElement>, tenant: Tenant) => void;
  onViewDetails: (tenant: Tenant) => void;
  onCreateTenant: () => void;
}

const TenantListTab: React.FC<TenantListTabProps> = ({
  tenants,
  totalTenants,
  page,
  rowsPerPage,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  planFilter,
  setPlanFilter,
  orderBy,
  order,
  selectedTenants,
  onChangePage,
  onChangeRowsPerPage,
  onRequestSort,
  onSelectAll,
  onSelectTenant,
  onOpenMenu,
  onViewDetails,
  onCreateTenant
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search tenants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ flexGrow: 1, minWidth: 300 }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
            <MenuItem value="all">All Statuses</MenuItem>
            {Object.values(TenantStatus).map(status => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Plan</InputLabel>
          <Select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} label="Plan">
            <MenuItem value="all">All Plans</MenuItem>
            {Object.values(SubscriptionPlan).map(plan => (
              <MenuItem key={plan} value={plan}>{plan}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateTenant}
        >
          Create Tenant
        </Button>
      </Box>

      {selectedTenants.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {selectedTenants.length} tenant(s) selected
        </Alert>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedTenants.length > 0 && selectedTenants.length < tenants.length}
                  checked={tenants.length > 0 && selectedTenants.length === tenants.length}
                  onChange={onSelectAll}
                />
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => onRequestSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>Subdomain</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell align="right">Users</TableCell>
              <TableCell align="right">Storage</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'createdAt'}
                  direction={orderBy === 'createdAt' ? order : 'asc'}
                  onClick={() => onRequestSort('createdAt')}
                >
                  Created
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tenants.map((tenant: Tenant) => (
              <TableRow
                key={tenant.id}
                hover
                selected={selectedTenants.includes(tenant.id)}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedTenants.includes(tenant.id)}
                    onChange={() => onSelectTenant(tenant.id)}
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {tenant.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tenant.adminEmail}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={tenant.subdomain} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={tenant.status}
                    size="small"
                    color={statusColors[tenant.status] as any}
                  />
                </TableCell>
                <TableCell>
                  <Chip label={tenant.plan} size="small" />
                </TableCell>
                <TableCell align="right">
                  {tenant.metadata.usersCount || 0}
                </TableCell>
                <TableCell align="right">
                  {(tenant.metadata.storageUsedGB || 0).toFixed(2)} GB
                </TableCell>
                <TableCell>
                  <Tooltip title={format(new Date(tenant.createdAt), 'PPpp')}>
                    <Typography variant="body2">
                      {formatDistance(new Date(tenant.createdAt), new Date(), { addSuffix: true })}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => onViewDetails(tenant)}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={(e) => onOpenMenu(e, tenant)}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={totalTenants}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onChangePage}
        onRowsPerPageChange={onChangeRowsPerPage}
      />
    </Paper>
  );
};

interface CreateTenantTabProps {
  onClose: () => void;
}

const CreateTenantTab: React.FC<CreateTenantTabProps> = ({ onClose }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    'Basic Information',
    'Plan Selection',
    'Configuration',
    'Branding',
    'Review & Create'
  ];

  const formik = useFormik({
    initialValues: {
      name: '',
      subdomain: '',
      adminEmail: '',
      adminPassword: '',
      industry: '',
      companySize: '',
      plan: SubscriptionPlan.STARTER,
      isolationStrategy: IsolationStrategy.ROW_LEVEL_SECURITY,
      features: {
        advancedAnalytics: false,
        aiCoaching: false,
        whiteLabeling: false,
        customDomain: false,
        ssoIntegration: false
      },
      limits: {
        maxUsers: 10,
        maxStorageGB: 10,
        maxApiCallsPerMonth: 10000
      },
      brandingLogoUrl: '',
      primaryColor: '#1976d2'
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Required'),
      subdomain: Yup.string()
        .matches(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens')
        .required('Required'),
      adminEmail: Yup.string().email('Invalid email').required('Required'),
      adminPassword: Yup.string().min(8, 'At least 8 characters').required('Required'),
      industry: Yup.string().required('Required'),
      companySize: Yup.string().required('Required')
    }),
    onSubmit: async (values) => {
      try {
        await axios.post(`${API_BASE_URL}/tenants`, values);
        onClose();
        mutate(`${API_BASE_URL}/tenants`);
      } catch (error) {
        console.error('Failed to create tenant:', error);
      }
    }
  });

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <form onSubmit={formik.handleSubmit}>
        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subdomain"
                name="subdomain"
                value={formik.values.subdomain}
                onChange={formik.handleChange}
                error={formik.touched.subdomain && Boolean(formik.errors.subdomain)}
                helperText={formik.touched.subdomain && formik.errors.subdomain}
                InputProps={{
                  endAdornment: <InputAdornment position="end">.upcoach.com</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Admin Email"
                name="adminEmail"
                type="email"
                value={formik.values.adminEmail}
                onChange={formik.handleChange}
                error={formik.touched.adminEmail && Boolean(formik.errors.adminEmail)}
                helperText={formik.touched.adminEmail && formik.errors.adminEmail}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Admin Password"
                name="adminPassword"
                type="password"
                value={formik.values.adminPassword}
                onChange={formik.handleChange}
                error={formik.touched.adminPassword && Boolean(formik.errors.adminPassword)}
                helperText={formik.touched.adminPassword && formik.errors.adminPassword}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Industry</InputLabel>
                <Select
                  name="industry"
                  value={formik.values.industry}
                  onChange={formik.handleChange}
                  label="Industry"
                >
                  <MenuItem value="technology">Technology</MenuItem>
                  <MenuItem value="healthcare">Healthcare</MenuItem>
                  <MenuItem value="education">Education</MenuItem>
                  <MenuItem value="finance">Finance</MenuItem>
                  <MenuItem value="retail">Retail</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Company Size</InputLabel>
                <Select
                  name="companySize"
                  value={formik.values.companySize}
                  onChange={formik.handleChange}
                  label="Company Size"
                >
                  <MenuItem value="1-10">1-10 employees</MenuItem>
                  <MenuItem value="11-50">11-50 employees</MenuItem>
                  <MenuItem value="51-200">51-200 employees</MenuItem>
                  <MenuItem value="201-1000">201-1000 employees</MenuItem>
                  <MenuItem value="1000+">1000+ employees</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {activeStep === 1 && (
          <Grid container spacing={3}>
            {Object.entries(planConfigs).map(([plan, config]) => (
              <Grid item xs={12} md={4} key={plan}>
                <Card
                  sx={{
                    border: formik.values.plan === plan ? 2 : 1,
                    borderColor: formik.values.plan === plan ? 'primary.main' : 'divider',
                    cursor: 'pointer'
                  }}
                  onClick={() => formik.setFieldValue('plan', plan)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {plan}
                    </Typography>
                    <Typography variant="h4" gutterBottom>
                      ${config.price}
                      <Typography component="span" variant="body2" color="text.secondary">
                        /month
                      </Typography>
                    </Typography>
                    <List dense>
                      {config.features.map((feature, idx) => (
                        <ListItem key={idx} disableGutters>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircleIcon fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {activeStep === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Isolation Strategy</InputLabel>
                <Select
                  name="isolationStrategy"
                  value={formik.values.isolationStrategy}
                  onChange={formik.handleChange}
                  label="Isolation Strategy"
                >
                  <MenuItem value={IsolationStrategy.ROW_LEVEL_SECURITY}>
                    Row-Level Security (Recommended)
                  </MenuItem>
                  <MenuItem value={IsolationStrategy.SCHEMA_PER_TENANT}>
                    Schema per Tenant
                  </MenuItem>
                  <MenuItem value={IsolationStrategy.DATABASE_PER_TENANT}>
                    Database per Tenant
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Feature Flags
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.features.advancedAnalytics}
                    onChange={(e) => formik.setFieldValue('features.advancedAnalytics', e.target.checked)}
                  />
                }
                label="Advanced Analytics"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.features.aiCoaching}
                    onChange={(e) => formik.setFieldValue('features.aiCoaching', e.target.checked)}
                  />
                }
                label="AI Coaching"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.features.whiteLabeling}
                    onChange={(e) => formik.setFieldValue('features.whiteLabeling', e.target.checked)}
                  />
                }
                label="White-Labeling"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.features.customDomain}
                    onChange={(e) => formik.setFieldValue('features.customDomain', e.target.checked)}
                  />
                }
                label="Custom Domain"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Limits
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Max Users"
                name="limits.maxUsers"
                type="number"
                value={formik.values.limits.maxUsers}
                onChange={formik.handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Max Storage (GB)"
                name="limits.maxStorageGB"
                type="number"
                value={formik.values.limits.maxStorageGB}
                onChange={formik.handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Max API Calls/Month"
                name="limits.maxApiCallsPerMonth"
                type="number"
                value={formik.values.limits.maxApiCallsPerMonth}
                onChange={formik.handleChange}
              />
            </Grid>
          </Grid>
        )}

        {activeStep === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Brand Customization
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Logo URL"
                name="brandingLogoUrl"
                value={formik.values.brandingLogoUrl}
                onChange={formik.handleChange}
                helperText="Upload your logo and paste the URL here"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Primary Color
                </Typography>
                <Box
                  sx={{
                    width: 60,
                    height: 40,
                    bgcolor: formik.values.primaryColor,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        )}

        {activeStep === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Tenant Configuration
            </Typography>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Basic Information
                    </Typography>
                    <Typography><strong>Name:</strong> {formik.values.name}</Typography>
                    <Typography><strong>Subdomain:</strong> {formik.values.subdomain}.upcoach.com</Typography>
                    <Typography><strong>Admin Email:</strong> {formik.values.adminEmail}</Typography>
                    <Typography><strong>Industry:</strong> {formik.values.industry}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Plan & Configuration
                    </Typography>
                    <Typography><strong>Plan:</strong> {formik.values.plan}</Typography>
                    <Typography><strong>Isolation:</strong> {formik.values.isolationStrategy}</Typography>
                    <Typography><strong>Max Users:</strong> {formik.values.limits.maxUsers}</Typography>
                    <Typography><strong>Max Storage:</strong> {formik.values.limits.maxStorageGB} GB</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>

          <Box>
            <Button onClick={onClose} sx={{ mr: 1 }}>
              Cancel
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                type="submit"
                variant="contained"
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? <CircularProgress size={24} /> : 'Create Tenant'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

const AnalyticsTab: React.FC = () => {
  const { data: analyticsData } = useSWR(`${API_BASE_URL}/tenants/analytics`, fetcher);

  const userGrowthData = analyticsData?.userGrowth || [];
  const planDistribution = analyticsData?.planDistribution || [];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PeopleIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Tenants</Typography>
            </Box>
            <Typography variant="h4">{analyticsData?.totalTenants || 0}</Typography>
            <Typography variant="body2" color="success.main">
              +{analyticsData?.newTenantsThisMonth || 0} this month
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Active Tenants</Typography>
            </Box>
            <Typography variant="h4">{analyticsData?.activeTenants || 0}</Typography>
            <Typography variant="body2" color="text.secondary">
              {analyticsData?.activePercentage || 0}% of total
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">MRR</Typography>
            </Box>
            <Typography variant="h4">${(analyticsData?.mrr || 0).toLocaleString()}</Typography>
            <Typography variant="body2" color="success.main">
              +{analyticsData?.mrrGrowth || 0}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <StorageIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Storage</Typography>
            </Box>
            <Typography variant="h4">{(analyticsData?.totalStorageGB || 0).toFixed(1)} GB</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tenant Growth (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="tenants" stroke="#1976d2" fill="#1976d2" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Plan Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {planDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#1976d2', '#dc004e', '#9c27b0'][index % 3]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

const WhiteLabelTab: React.FC = () => {
  const [selectedTenantId, setSelectedTenantId] = useState('');

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        White-Label Configuration
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Tenant</InputLabel>
        <Select
          value={selectedTenantId}
          onChange={(e) => setSelectedTenantId(e.target.value)}
          label="Select Tenant"
        >
          <MenuItem value="">-- Select a tenant --</MenuItem>
        </Select>
      </FormControl>

      {selectedTenantId && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Brand Assets
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Logo
                  </Typography>
                  <Button variant="outlined" startIcon={<CloudUploadIcon />}>
                    Upload Logo
                  </Button>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Favicon
                  </Typography>
                  <Button variant="outlined" startIcon={<CloudUploadIcon />}>
                    Upload Favicon
                  </Button>
                </Box>

                <Box>
                  <Typography variant="body2" gutterBottom>
                    Primary Color
                  </Typography>
                  <Box
                    sx={{
                      width: 100,
                      height: 40,
                      bgcolor: '#1976d2',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Custom Domain
                </Typography>

                <TextField
                  fullWidth
                  label="Custom Domain"
                  placeholder="coaching.example.com"
                  sx={{ mb: 2 }}
                />

                <Alert severity="info">
                  Add a TXT record to your DNS: _upcoach-verification.example.com
                </Alert>

                <Button variant="contained" sx={{ mt: 2 }}>
                  Verify Domain
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Theme Editor
                </Typography>

                <Box sx={{ height: 400, border: 1, borderColor: 'divider' }}>
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    defaultValue={JSON.stringify({
                      palette: {
                        primary: { main: '#1976d2' },
                        secondary: { main: '#dc004e' }
                      }
                    }, null, 2)}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14
                    }}
                  />
                </Box>

                <Button variant="contained" sx={{ mt: 2 }}>
                  Save Theme
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

interface BulkOperationsTabProps {
  selectedTenants: string[];
  onBulkAction: (action: string) => void;
}

const BulkOperationsTab: React.FC<BulkOperationsTabProps> = ({ selectedTenants, onBulkAction }) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Bulk Operations
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        {selectedTenants.length} tenant(s) selected
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activate Tenants
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Activate all selected tenants
              </Typography>
              <Button
                fullWidth
                variant="contained"
                color="success"
                disabled={selectedTenants.length === 0}
                onClick={() => onBulkAction('activate')}
              >
                Activate
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Suspend Tenants
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Suspend all selected tenants
              </Typography>
              <Button
                fullWidth
                variant="contained"
                color="warning"
                disabled={selectedTenants.length === 0}
                onClick={() => onBulkAction('suspend')}
              >
                Suspend
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Export Data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Export data for selected tenants
              </Typography>
              <Button
                fullWidth
                variant="contained"
                disabled={selectedTenants.length === 0}
                onClick={() => onBulkAction('export')}
              >
                Export
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

interface TenantDetailsDialogProps {
  open: boolean;
  tenant: Tenant | null;
  onClose: () => void;
}

const TenantDetailsDialog: React.FC<TenantDetailsDialogProps> = ({ open, tenant, onClose }) => {
  const [tab, setTab] = useState(0);

  const { data: metrics } = useSWR(
    tenant ? `${API_BASE_URL}/tenants/${tenant.id}/metrics` : null,
    fetcher
  );

  if (!tenant) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{tenant.name}</Typography>
          <Chip label={tenant.status} color={statusColors[tenant.status] as any} />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Overview" />
          <Tab label="Metrics" />
          <Tab label="Configuration" />
          <Tab label="Billing" />
          <Tab label="Users" />
          <Tab label="Activity" />
        </Tabs>

        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Subdomain</Typography>
              <Typography variant="body1" gutterBottom>{tenant.subdomain}.upcoach.com</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Admin Email</Typography>
              <Typography variant="body1" gutterBottom>{tenant.adminEmail}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Plan</Typography>
              <Typography variant="body1" gutterBottom>{tenant.plan}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Industry</Typography>
              <Typography variant="body1" gutterBottom>{tenant.industry}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Company Size</Typography>
              <Typography variant="body1" gutterBottom>{tenant.companySize}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Created</Typography>
              <Typography variant="body1" gutterBottom>
                {format(new Date(tenant.createdAt), 'PPpp')}
              </Typography>
            </Grid>
          </Grid>
        )}

        {tab === 1 && metrics && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4">{metrics.dau}</Typography>
                  <Typography variant="body2" color="text.secondary">Daily Active Users</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4">{metrics.mau}</Typography>
                  <Typography variant="body2" color="text.secondary">Monthly Active Users</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4">{metrics.storageUsedGB.toFixed(2)} GB</Typography>
                  <Typography variant="body2" color="text.secondary">Storage Used</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4">{metrics.healthScore.toFixed(0)}%</Typography>
                  <Typography variant="body2" color="text.secondary">Health Score</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tab === 2 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>Isolation Strategy</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {tenant.isolationStrategy}
            </Typography>

            <Typography variant="subtitle1" gutterBottom>Feature Flags</Typography>
            <Stack spacing={1}>
              <Chip label="Advanced Analytics: Enabled" size="small" color="success" />
              <Chip label="AI Coaching: Disabled" size="small" />
              <Chip label="White-Labeling: Enabled" size="small" color="success" />
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TenantDashboard;
