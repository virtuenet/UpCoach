import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Edit,
  Delete,
  LocalOffer,
  Sync,
  Link as LinkIcon,
  Timer,
} from '@mui/icons-material';
import {
  tiersService,
  SubscriptionTier,
  TierPricing,
  CreatePricingInput,
  UpdatePricingInput,
} from '../../services/tiersService';

export default function TierPricingPage() {
  const navigate = useNavigate();
  const { id: tierId } = useParams<{ id: string }>();

  // State
  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [pricing, setPricing] = useState<TierPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<TierPricing | null>(null);
  const [formData, setFormData] = useState<CreatePricingInput>({
    billingInterval: 'monthly',
    amount: 0,
    currency: 'USD',
    isActive: true,
    trialDays: 0,
    discountPercentage: 0,
  });
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pricingToDelete, setPricingToDelete] = useState<TierPricing | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountPricing, setDiscountPricing] = useState<TierPricing | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountValidUntil, setDiscountValidUntil] = useState('');
  const [settingDiscount, setSettingDiscount] = useState(false);

  const [trialDialogOpen, setTrialDialogOpen] = useState(false);
  const [trialPricing, setTrialPricing] = useState<TierPricing | null>(null);
  const [trialDays, setTrialDays] = useState(0);
  const [settingTrial, setSettingTrial] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!tierId) return;

    try {
      setLoading(true);
      setError(null);

      const [tierData, pricingData] = await Promise.all([
        tiersService.getTierById(tierId),
        tiersService.getTierPricing(tierId, { includeInactive: true }),
      ]);

      setTier(tierData);
      setPricing(pricingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [tierId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open create dialog
  const handleCreate = () => {
    setEditingPricing(null);
    setFormData({
      billingInterval: 'monthly',
      amount: 0,
      currency: 'USD',
      isActive: true,
      trialDays: 0,
      discountPercentage: 0,
    });
    setEditDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (pricingItem: TierPricing) => {
    setEditingPricing(pricingItem);
    setFormData({
      billingInterval: pricingItem.billingInterval,
      amount: pricingItem.amount,
      currency: pricingItem.currency,
      isActive: pricingItem.isActive,
      trialDays: pricingItem.trialDays,
      discountPercentage: pricingItem.discountPercentage || 0,
    });
    setEditDialogOpen(true);
  };

  // Save pricing
  const handleSave = async () => {
    if (!tierId) return;

    try {
      setSaving(true);
      setError(null);

      if (editingPricing) {
        const updateData: UpdatePricingInput = {
          amount: formData.amount,
          currency: formData.currency,
          isActive: formData.isActive,
          trialDays: formData.trialDays,
        };
        await tiersService.updatePricing(tierId, editingPricing.id, updateData);
        setSuccess('Pricing updated successfully');
      } else {
        await tiersService.createPricing(tierId, formData);
        setSuccess('Pricing created successfully');
      }

      setEditDialogOpen(false);
      setEditingPricing(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  // Delete pricing
  const handleDeleteOpen = (pricingItem: TierPricing) => {
    setPricingToDelete(pricingItem);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tierId || !pricingToDelete) return;

    try {
      setDeleting(true);
      await tiersService.deletePricing(tierId, pricingToDelete.id);
      setSuccess('Pricing deleted successfully');
      setDeleteDialogOpen(false);
      setPricingToDelete(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pricing');
    } finally {
      setDeleting(false);
    }
  };

  // Discount management
  const handleDiscountOpen = (pricingItem: TierPricing) => {
    setDiscountPricing(pricingItem);
    setDiscountPercentage(pricingItem.discountPercentage || 0);
    setDiscountValidUntil(pricingItem.discountValidUntil || '');
    setDiscountDialogOpen(true);
  };

  const handleSetDiscount = async () => {
    if (!tierId || !discountPricing) return;

    try {
      setSettingDiscount(true);
      if (discountPercentage > 0) {
        await tiersService.setDiscount(
          tierId,
          discountPricing.id,
          discountPercentage,
          discountValidUntil || undefined
        );
        setSuccess('Discount set successfully');
      } else {
        await tiersService.removeDiscount(tierId, discountPricing.id);
        setSuccess('Discount removed successfully');
      }
      setDiscountDialogOpen(false);
      setDiscountPricing(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set discount');
    } finally {
      setSettingDiscount(false);
    }
  };

  // Trial management
  const handleTrialOpen = (pricingItem: TierPricing) => {
    setTrialPricing(pricingItem);
    setTrialDays(pricingItem.trialDays);
    setTrialDialogOpen(true);
  };

  const handleSetTrial = async () => {
    if (!tierId || !trialPricing) return;

    try {
      setSettingTrial(true);
      await tiersService.setTrialDays(tierId, trialPricing.id, trialDays);
      setSuccess('Trial days updated successfully');
      setTrialDialogOpen(false);
      setTrialPricing(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set trial days');
    } finally {
      setSettingTrial(false);
    }
  };

  // Format price for display
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  // Get effective price (with discount)
  const getEffectivePrice = (pricingItem: TierPricing): number => {
    if (!pricingItem.discountPercentage || pricingItem.discountPercentage <= 0) {
      return pricingItem.amount;
    }
    // Check if discount is still valid
    if (pricingItem.discountValidUntil) {
      const validUntil = new Date(pricingItem.discountValidUntil);
      if (validUntil < new Date()) {
        return pricingItem.amount;
      }
    }
    return Math.round(pricingItem.amount * (1 - pricingItem.discountPercentage / 100));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/financial/tiers')}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Pricing: {tier?.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage pricing options for this tier
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/financial/tiers/${tierId}`)}
          >
            Edit Tier
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            Add Pricing
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Pricing Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Billing Interval</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Effective Price</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell>Trial Days</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Stripe</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pricing.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Box sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No pricing options yet. Add your first pricing option.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleCreate}
                        sx={{ mt: 2 }}
                      >
                        Add Pricing
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                pricing.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Chip
                        label={tiersService.getBillingIntervalLabel(item.billingInterval)}
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>
                        {formatPrice(item.amount, item.currency)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatPrice(tiersService.getMonthlyEquivalent(item.amount, item.billingInterval), item.currency)}/mo equivalent
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.discountPercentage && item.discountPercentage > 0 ? (
                        <Box>
                          <Typography
                            fontWeight={600}
                            color="success.main"
                          >
                            {formatPrice(getEffectivePrice(item), item.currency)}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ textDecoration: 'line-through' }}
                            color="text.secondary"
                          >
                            {formatPrice(item.amount, item.currency)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography fontWeight={600}>
                          {formatPrice(item.amount, item.currency)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{item.currency}</TableCell>
                    <TableCell>
                      {item.trialDays > 0 ? (
                        <Chip
                          icon={<Timer />}
                          label={`${item.trialDays} days`}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      ) : (
                        <Typography color="text.secondary">None</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.discountPercentage && item.discountPercentage > 0 ? (
                        <Chip
                          icon={<LocalOffer />}
                          label={`${item.discountPercentage}% off`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Typography color="text.secondary">None</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={item.isActive ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {item.stripePriceId ? (
                        <Tooltip title={item.stripePriceId}>
                          <Chip
                            icon={<LinkIcon />}
                            label="Linked"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </Tooltip>
                      ) : (
                        <Chip
                          label="Not linked"
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Set Discount">
                        <IconButton size="small" onClick={() => handleDiscountOpen(item)}>
                          <LocalOffer />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Set Trial">
                        <IconButton size="small" onClick={() => handleTrialOpen(item)}>
                          <Timer />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(item)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteOpen(item)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPricing ? 'Edit Pricing' : 'Add Pricing'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!!editingPricing}>
                <InputLabel>Billing Interval</InputLabel>
                <Select
                  value={formData.billingInterval}
                  label="Billing Interval"
                  onChange={(e) => setFormData(prev => ({ ...prev, billingInterval: e.target.value as 'monthly' | 'quarterly' | 'yearly' }))}
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!!editingPricing}>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={formData.currency}
                  label="Currency"
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                  <MenuItem value="IDR">IDR</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount (in cents)"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseInt(e.target.value, 10) || 0 }))}
                helperText={`Display: ${formatPrice(formData.amount, formData.currency || 'USD')}`}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Trial Days"
                type="number"
                value={formData.trialDays}
                onChange={(e) => setFormData(prev => ({ ...prev, trialDays: parseInt(e.target.value, 10) || 0 }))}
                helperText="0 for no trial"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : editingPricing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Pricing</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the {pricingToDelete?.billingInterval} pricing?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will deactivate the pricing. Existing subscriptions will not be affected.
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

      {/* Discount Dialog */}
      <Dialog open={discountDialogOpen} onClose={() => setDiscountDialogOpen(false)}>
        <DialogTitle>Set Discount</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Discount Percentage"
                type="number"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(parseInt(e.target.value, 10) || 0)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                helperText="Set to 0 to remove discount"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Valid Until"
                type="date"
                value={discountValidUntil}
                onChange={(e) => setDiscountValidUntil(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Leave empty for no expiry"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscountDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSetDiscount}
            variant="contained"
            disabled={settingDiscount}
          >
            {settingDiscount ? <CircularProgress size={20} /> : 'Apply'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trial Dialog */}
      <Dialog open={trialDialogOpen} onClose={() => setTrialDialogOpen(false)}>
        <DialogTitle>Set Trial Days</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Trial Days"
            type="number"
            value={trialDays}
            onChange={(e) => setTrialDays(parseInt(e.target.value, 10) || 0)}
            sx={{ mt: 2 }}
            helperText="Set to 0 for no trial"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrialDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSetTrial}
            variant="contained"
            disabled={settingTrial}
          >
            {settingTrial ? <CircularProgress size={20} /> : 'Apply'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
