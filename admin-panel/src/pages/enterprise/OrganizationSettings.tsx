import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import Grid from '@mui/material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tab,
  Tabs,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  LinearProgress,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Business,
  People,
  Security,
  Settings,
  Add,
  Edit,
  Delete,
  Send,
  Shield,
  Key,
  Group,
  Domain,
  CloudUpload,
} from '@mui/icons-material';
import api from '../../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`org-tabpanel-${index}`}
      aria-labelledby={`org-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const OrganizationSettings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [ssoProviders, setSsoProviders] = useState<any[]>([]);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [teamDialog, setTeamDialog] = useState(false);
  const [ssoDialog, setSsoDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member',
    teamIds: [],
  });

  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    department: '',
  });

  const [ssoForm, setSsoForm] = useState({
    provider: 'saml',
    enabled: false,
    samlIdpUrl: '',
    samlIdpCert: '',
    allowedDomains: [],
  });

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      const orgId = localStorage.getItem('organizationId');

      const [orgRes, membersRes, teamsRes, ssoRes] = await Promise.all([
        api.get(`/enterprise/organizations/${orgId}`),
        api.get(`/enterprise/organizations/${orgId}/members`),
        api.get(`/enterprise/organizations/${orgId}/teams`),
        api.get(`/enterprise/organizations/${orgId}/sso`),
      ]);

      setOrganization(orgRes.data.data.organization);
      setStats(orgRes.data.data.stats);
      setMembers(membersRes.data.data.members);
      setTeams(teamsRes.data.data.teams);
      setSsoProviders(ssoRes.data.data.providers);
    } catch (error) {
      console.error('Failed to load organization data:', error);
      enqueueSnackbar('Failed to load organization data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    try {
      const orgId = localStorage.getItem('organizationId');
      await api.post(`/enterprise/organizations/${orgId}/invitations`, inviteForm);

      enqueueSnackbar('Invitation sent successfully', { variant: 'success' });
      setInviteDialog(false);
      setInviteForm({ email: '', role: 'member', teamIds: [] });
      loadOrganizationData();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to send invitation', {
        variant: 'error',
      });
    }
  };

  const handleCreateTeam = async () => {
    try {
      const orgId = localStorage.getItem('organizationId');
      await api.post(`/enterprise/organizations/${orgId}/teams`, teamForm);

      enqueueSnackbar('Team created successfully', { variant: 'success' });
      setTeamDialog(false);
      setTeamForm({ name: '', description: '', department: '' });
      loadOrganizationData();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to create team', {
        variant: 'error',
      });
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const orgId = localStorage.getItem('organizationId');
      await api.delete(`/enterprise/organizations/${orgId}/members/${userId}`);

      enqueueSnackbar('Member removed successfully', { variant: 'success' });
      loadOrganizationData();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to remove member', {
        variant: 'error',
      });
    }
  };

  const handleConfigureSSO = async () => {
    try {
      const orgId = localStorage.getItem('organizationId');
      await api.post(`/enterprise/organizations/${orgId}/sso`, ssoForm);

      enqueueSnackbar('SSO configured successfully', { variant: 'success' });
      setSsoDialog(false);
      setSsoForm({
        provider: 'saml',
        enabled: false,
        samlIdpUrl: '',
        samlIdpCert: '',
        allowedDomains: [],
      });
      loadOrganizationData();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to configure SSO', {
        variant: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Organization Settings
      </Typography>

      {/* Organization Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid>
              <Avatar
                sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}
                src={organization?.logoUrl}
              >
                <Business fontSize="large" />
              </Avatar>
            </Grid>
            <Grid xs>
              <Typography variant="h5">{organization?.name}</Typography>
              <Typography color="textSecondary">{organization?.website}</Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={organization?.subscriptionTier}
                  color="primary"
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={`${stats?.activeMembers} / ${stats?.totalMembers} Active Members`}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip label={`${stats?.totalTeams} Teams`} size="small" />
              </Box>
            </Grid>
            <Grid>
              <Button variant="contained" startIcon={<CloudUpload />} component="label">
                Upload Logo
                <input type="file" hidden accept="image/*" />
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={(_e, v) => setTabValue(v)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<People />} label="Members" />
          <Tab icon={<Group />} label="Teams" />
          <Tab icon={<Security />} label="SSO & Security" />
          <Tab icon={<Settings />} label="Settings" />
        </Tabs>

        {/* Members Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Organization Members</Typography>
            <Button variant="contained" startIcon={<Send />} onClick={() => setInviteDialog(true)}>
              Invite Member
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Teams</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar src={member.avatar_url} sx={{ mr: 2 }}>
                          {member.full_name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{member.full_name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {member.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={member.role} size="small" />
                    </TableCell>
                    <TableCell>
                      {member.teams?.map((team: any) => (
                        <Chip
                          key={team.id}
                          label={team.name}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>{formatDate(member.joined_at)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Teams Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Teams</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setTeamDialog(true)}>
              Create Team
            </Button>
          </Box>

          <Grid container spacing={2}>
            {teams.map(team => (
              <Grid item xs={12} md={6} key={team.id}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">{team.name}</Typography>
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {team.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="textSecondary">
                        Department: {team.department || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {team.member_count} members
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* SSO & Security Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Single Sign-On (SSO)</Typography>
              <Button variant="contained" startIcon={<Shield />} onClick={() => setSsoDialog(true)}>
                Configure SSO
              </Button>
            </Box>

            {ssoProviders.length === 0 ? (
              <Alert severity="info">
                No SSO providers configured. Configure SSO to enable secure authentication.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {ssoProviders.map(provider => (
                  <Grid item xs={12} md={6} key={provider.id}>
                    <Card>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Key sx={{ mr: 1 }} />
                            <Typography variant="h6">{provider.provider.toUpperCase()}</Typography>
                          </Box>
                          <Switch checked={provider.enabled} />
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          {provider.enabled ? 'Active' : 'Inactive'}
                        </Typography>
                        {provider.allowed_domains && (
                          <Box sx={{ mt: 1 }}>
                            {provider.allowed_domains.map((domain: string) => (
                              <Chip key={domain} label={domain} size="small" sx={{ mr: 0.5 }} />
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Security Policies
            </Typography>
            <Alert severity="info">Enterprise security policies coming soon.</Alert>
          </Box>
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Organization Name"
                value={organization?.name || ''}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Website" value={organization?.website || ''} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Industry</InputLabel>
                <Select value={organization?.industry || ''}>
                  <MenuItem value="technology">Technology</MenuItem>
                  <MenuItem value="healthcare">Healthcare</MenuItem>
                  <MenuItem value="finance">Finance</MenuItem>
                  <MenuItem value="education">Education</MenuItem>
                  <MenuItem value="retail">Retail</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Organization Size</InputLabel>
                <Select value={organization?.size || ''}>
                  <MenuItem value="small">Small (1-50)</MenuItem>
                  <MenuItem value="medium">Medium (51-200)</MenuItem>
                  <MenuItem value="large">Large (201-1000)</MenuItem>
                  <MenuItem value="enterprise">Enterprise (1000+)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Billing Email" value={organization?.billingEmail || ''} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary">
                Save Changes
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialog} onClose={() => setInviteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Member</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={inviteForm.email}
              onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteForm.role}
                onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Teams (Optional)</InputLabel>
              <Select
                multiple
                value={inviteForm.teamIds}
                onChange={e =>
                  setInviteForm({
                    ...inviteForm,
                    teamIds: e.target.value as any,
                  })
                }
              >
                {teams.map(team => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialog(false)}>Cancel</Button>
          <Button onClick={handleInviteMember} variant="contained">
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={teamDialog} onClose={() => setTeamDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Team</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Team Name"
              value={teamForm.name}
              onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={teamForm.description}
              onChange={e => setTeamForm({ ...teamForm, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Department"
              value={teamForm.department}
              onChange={e => setTeamForm({ ...teamForm, department: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTeam} variant="contained">
            Create Team
          </Button>
        </DialogActions>
      </Dialog>

      {/* Configure SSO Dialog */}
      <Dialog open={ssoDialog} onClose={() => setSsoDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configure SSO</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Provider</InputLabel>
              <Select
                value={ssoForm.provider}
                onChange={e => setSsoForm({ ...ssoForm, provider: e.target.value })}
              >
                <MenuItem value="saml">SAML 2.0</MenuItem>
                <MenuItem value="oidc">OpenID Connect</MenuItem>
                <MenuItem value="google">Google Workspace</MenuItem>
                <MenuItem value="microsoft">Microsoft Azure AD</MenuItem>
                <MenuItem value="okta">Okta</MenuItem>
              </Select>
            </FormControl>

            {ssoForm.provider === 'saml' && (
              <>
                <TextField
                  fullWidth
                  label="SAML IdP URL"
                  value={ssoForm.samlIdpUrl}
                  onChange={e => setSsoForm({ ...ssoForm, samlIdpUrl: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="SAML IdP Certificate"
                  multiline
                  rows={4}
                  value={ssoForm.samlIdpCert}
                  onChange={e => setSsoForm({ ...ssoForm, samlIdpCert: e.target.value })}
                  sx={{ mb: 2 }}
                />
              </>
            )}

            <TextField
              fullWidth
              label="Allowed Email Domains (comma-separated)"
              placeholder="example.com, company.org"
              onChange={e =>
                setSsoForm({
                  ...ssoForm,
                  allowedDomains: e.target.value.split(',').map(d => d.trim()),
                })
              }
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={ssoForm.enabled}
                  onChange={e => setSsoForm({ ...ssoForm, enabled: e.target.checked })}
                />
              }
              label="Enable SSO"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSsoDialog(false)}>Cancel</Button>
          <Button onClick={handleConfigureSSO} variant="contained">
            Configure
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrganizationSettings;
