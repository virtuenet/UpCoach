import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
  Button,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  AccessTime as PendingIcon,
  CheckCircle as ApprovedIcon,
  Paid as PaidIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { getPayoutData, PayoutData, larkDeepLinks } from '../../services/larkWidgetService';

const statusConfig: Record<string, { color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'; icon: React.ReactElement }> = {
  pending: { color: 'warning', icon: <PendingIcon fontSize="small" /> },
  approved: { color: 'info', icon: <ApprovedIcon fontSize="small" /> },
  paid: { color: 'success', icon: <PaidIcon fontSize="small" /> },
  rejected: { color: 'error', icon: <WarningIcon fontSize="small" /> },
};

export const PayoutsWidget: React.FC = () => {
  const [data, setData] = useState<PayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPayoutData();
      setData(result);
    } catch (err) {
      setError('Failed to load payout data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading && !data) {
    return (
      <Card>
        <CardHeader title="Coach Payouts" />
        <CardContent>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader
          title="Coach Payouts"
          action={
            <IconButton onClick={fetchData} size="small">
              <RefreshIcon />
            </IconButton>
          }
        />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  const pendingPayouts = data?.recentPayouts.filter(p => p.status === 'pending') || [];
  const hasPendingPayouts = pendingPayouts.length > 0;

  // Build status breakdown from available data
  const byStatus: Record<string, number> = {};
  if (data) {
    if (data.pending > 0) byStatus['pending'] = data.pending;
    if (data.approved > 0) byStatus['approved'] = data.approved;
    if (data.paidThisMonth > 0) byStatus['paid'] = data.paidThisMonth;
  }

  return (
    <Card>
      <CardHeader
        title="Coach Payouts"
        subheader={`${data?.pending || 0} pending approval`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchData} size="small" disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Open Approvals">
              <IconButton onClick={() => window.open(larkDeepLinks.approval, '_blank')} size="small">
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <CardContent>
        {/* Summary Stats */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" color="primary">
              {formatCurrency(data?.pendingAmount || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" color="success.main">
              {formatCurrency(data?.paidAmountThisMonth || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Paid (Month)
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5">
              {data?.pending || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Awaiting
            </Typography>
          </Box>
        </Box>

        {/* Status Breakdown */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Status Overview
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(byStatus).map(([status, count]) => (
              <Chip
                key={status}
                icon={statusConfig[status]?.icon}
                label={`${status}: ${count}`}
                size="small"
                color={statusConfig[status]?.color || 'default'}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Recent Payouts */}
        <Typography variant="subtitle2" gutterBottom>
          Recent Payouts
        </Typography>
        <List dense>
          {(data?.recentPayouts || []).slice(0, 5).map((payout) => (
            <ListItem
              key={payout.id}
              disablePadding
              sx={{ py: 0.5 }}
              secondaryAction={
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color={payout.status === 'pending' ? 'warning.main' : 'text.primary'}
                >
                  {formatCurrency(payout.amount, payout.currency)}
                </Typography>
              }
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={payout.status}
                      size="small"
                      color={statusConfig[payout.status]?.color || 'default'}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                      {payout.coachName}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    Period ends: {formatDate(payout.periodEnd)}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>

        {/* Action Button for Pending */}
        {hasPendingPayouts && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="warning"
              size="small"
              fullWidth
              startIcon={<PendingIcon />}
              onClick={() => window.open(larkDeepLinks.approval, '_blank')}
            >
              Review {pendingPayouts.length} Pending Payout{pendingPayouts.length > 1 ? 's' : ''}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PayoutsWidget;
