import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  FormControlLabel,
  Switch,
  Skeleton,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ContentCopy,
  MoreVert,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel,
  Sync,
  Refresh,
  AttachMoney,
} from '@mui/icons-material';
import { tiersService, SubscriptionTier } from '../../services/tiersService';

export default function TiersListPage() {
  const navigate = useNavigate();

  // State
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includePrivate, setIncludePrivate] = useState(true);

  // Dialog states
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateTierId, setDuplicateTierId] = useState<string | null>(null);
  const [newTierName, setNewTierName] = useState('');
  const [duplicating, setDuplicating] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<SubscriptionTier | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTier, setMenuTier] = useState<SubscriptionTier | null>(null);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    synced: string[];
    failed: Array<{ tierId: string; error: string }>;
  } | null>(null);

  // Fetch tiers
  const fetchTiers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tiersService.getTiers({ includePrivate });
      setTiers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tiers');
    } finally {
      setLoading(false);
    }
  }, [includePrivate]);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  // Actions
  const handleCreate = () => {
    navigate('/financial/tiers/new');
  };

  const handleEdit = (tier: SubscriptionTier) => {
    navigate(`/financial/tiers/${tier.id}`);
  };

  const handlePricing = (tier: SubscriptionTier) => {
    navigate(`/financial/tiers/${tier.id}/pricing`);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tier: SubscriptionTier) => {
    setMenuAnchor(event.currentTarget);
    setMenuTier(tier);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuTier(null);
  };

  const handleDuplicateOpen = (tier: SubscriptionTier) => {
    setDuplicateTierId(tier.id);
    setNewTierName(`${tier.name}_copy`);
    setDuplicateDialogOpen(true);
    handleMenuClose();
  };

  const handleDuplicateConfirm = async () => {
    if (!duplicateTierId || !newTierName) return;

    try {
      setDuplicating(true);
      await tiersService.duplicateTier(duplicateTierId, newTierName);
      setDuplicateDialogOpen(false);
      setDuplicateTierId(null);
      setNewTierName('');
      fetchTiers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate tier');
    } finally {
      setDuplicating(false);
    }
  };

  const handleDeleteOpen = (tier: SubscriptionTier) => {
    setTierToDelete(tier);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!tierToDelete) return;

    try {
      setDeleting(true);
      await tiersService.deleteTier(tierToDelete.id);
      setDeleteDialogOpen(false);
      setTierToDelete(null);
      fetchTiers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tier');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (tier: SubscriptionTier) => {
    try {
      if (tier.isActive) {
        await tiersService.deactivateTier(tier.id);
      } else {
        await tiersService.activateTier(tier.id);
      }
      fetchTiers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tier status');
    }
    handleMenuClose();
  };

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const result = await tiersService.syncAllTiersToStripe();
      setSyncResult(result);
      fetchTiers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync with Stripe');
    } finally {
      setSyncing(false);
    }
  };

  const handleRefreshCache = async () => {
    try {
      await tiersService.refreshCache();
      fetchTiers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh cache');
    }
  };

  // Get pricing summary for a tier
  const getPricingSummary = (tier: SubscriptionTier): string => {
    if (!tier.pricing || tier.pricing.length === 0) {
      return 'No pricing set';
    }
    const monthlyPrice = tier.pricing.find(p => p.billingInterval === 'monthly');
    if (monthlyPrice) {
      return tiersService.formatAmount(monthlyPrice.amount, monthlyPrice.currency) + '/mo';
    }
    const firstPrice = tier.pricing[0];
    return tiersService.formatAmount(firstPrice.amount, firstPrice.currency) + `/${firstPrice.billingInterval}`;
  };

  // Get feature count for a tier
  const getFeatureCount = (tier: SubscriptionTier): number => {
    let count = 0;
    if (tier.hasVoiceJournaling) count++;
    if (tier.hasProgressPhotos) count++;
    if (tier.hasAdvancedAnalytics) count++;
    if (tier.hasTeamFeatures) count++;
    if (tier.hasPrioritySupport) count++;
    if (tier.hasCustomBranding) count++;
    if (tier.hasApiAccess) count++;
    if (tier.hasSsoIntegration) count++;
    if (tier.hasDedicatedSupport) count++;
    return count;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Subscription Tiers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage subscription plans, features, and pricing
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh cache">
            <IconButton onClick={handleRefreshCache}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={syncing ? <CircularProgress size={16} /> : <Sync />}
            onClick={handleSyncAll}
            disabled={syncing}
          >
            Sync to Stripe
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            Create Tier
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={includePrivate}
                onChange={(e) => setIncludePrivate(e.target.checked)}
              />
            }
            label="Show private tiers"
          />
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Sync Result Alert */}
      {syncResult && (
        <Alert
          severity={syncResult.failed.length > 0 ? 'warning' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => setSyncResult(null)}
        >
          {syncResult.synced.length > 0 && (
            <Box>Synced: {syncResult.synced.length} tier(s)</Box>
          )}
          {syncResult.failed.length > 0 && (
            <Box>Failed: {syncResult.failed.map(f => f.tierId).join(', ')}</Box>
          )}
        </Alert>
      )}

      {/* Tiers Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Display Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Visibility</TableCell>
                <TableCell>Pricing</TableCell>
                <TableCell>Limits</TableCell>
                <TableCell>Features</TableCell>
                <TableCell>Stripe</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 10 }).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : tiers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Box sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No tiers found. Create your first subscription tier.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleCreate}
                        sx={{ mt: 2 }}
                      >
                        Create Tier
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                tiers.map((tier) => (
                  <TableRow key={tier.id} hover>
                    <TableCell>{tier.sortOrder}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {tier.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{tier.displayName}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={tier.isActive ? <CheckCircle /> : <Cancel />}
                        label={tier.isActive ? 'Active' : 'Inactive'}
                        color={tier.isActive ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={tier.isPublic ? <Visibility /> : <VisibilityOff />}
                        label={tier.isPublic ? 'Public' : 'Private'}
                        color={tier.isPublic ? 'primary' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getPricingSummary(tier)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Max Coaches">
                          <Chip
                            size="small"
                            label={tiersService.formatLimit(tier.maxCoaches)}
                            variant="outlined"
                          />
                        </Tooltip>
                        <Tooltip title="Max Goals">
                          <Chip
                            size="small"
                            label={tiersService.formatLimit(tier.maxGoals)}
                            variant="outlined"
                          />
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={`${getFeatureCount(tier)} features`}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={tier.stripeProductId ? <CheckCircle /> : <Cancel />}
                        label={tier.stripeProductId ? 'Linked' : 'Not linked'}
                        color={tier.stripeProductId ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Pricing">
                        <IconButton size="small" onClick={() => handlePricing(tier)}>
                          <AttachMoney />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(tier)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, tier)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuTier && handleToggleActive(menuTier)}>
          {menuTier?.isActive ? (
            <>
              <Cancel sx={{ mr: 1 }} fontSize="small" />
              Deactivate
            </>
          ) : (
            <>
              <CheckCircle sx={{ mr: 1 }} fontSize="small" />
              Activate
            </>
          )}
        </MenuItem>
        <MenuItem onClick={() => menuTier && handleDuplicateOpen(menuTier)}>
          <ContentCopy sx={{ mr: 1 }} fontSize="small" />
          Duplicate
        </MenuItem>
        <MenuItem
          onClick={() => menuTier && handleDeleteOpen(menuTier)}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onClose={() => setDuplicateDialogOpen(false)}>
        <DialogTitle>Duplicate Tier</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Tier Name"
            fullWidth
            value={newTierName}
            onChange={(e) => setNewTierName(e.target.value)}
            helperText="Enter a unique name for the duplicated tier"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDuplicateConfirm}
            variant="contained"
            disabled={duplicating || !newTierName}
          >
            {duplicating ? <CircularProgress size={20} /> : 'Duplicate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Tier</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the tier "{tierToDelete?.displayName}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will deactivate the tier. Existing subscriptions will not be affected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
