import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Chip, Button, CircularProgress } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { flashErpService, ERPStatus } from '../services/flashErpService';

export default function IntegrationsPage() {
  const navigate = useNavigate();
  const [erpStatus, setErpStatus] = useState<ERPStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadERPStatus();
  }, []);

  const loadERPStatus = async () => {
    try {
      setLoading(true);
      const status = await flashErpService.getStatus();
      setErpStatus(status);
    } catch (error) {
      console.error('Failed to load ERP status:', error);
      setErpStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusChip = () => {
    if (!erpStatus?.enabled) {
      return <Chip label="Not Configured" color="default" size="small" />;
    }

    switch (erpStatus.healthStatus) {
      case 'healthy':
        return <Chip icon={<CheckCircleIcon />} label="Healthy" color="success" size="small" />;
      case 'degraded':
        return <Chip icon={<ErrorIcon />} label="Degraded" color="warning" size="small" />;
      case 'down':
        return <Chip icon={<ErrorIcon />} label="Down" color="error" size="small" />;
      default:
        return <Chip label="Unknown" color="default" size="small" />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Integrations
      </Typography>

      <Grid container spacing={3}>
        {/* FlashERP Integration Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceIcon sx={{ fontSize: 48, mr: 2, color: 'primary.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    FlashERP
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    AI-first ERP system
                  </Typography>
                </Box>
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  getHealthStatusChip()
                )}
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Sync financial transactions, subscriptions, invoices, and customers to your FlashERP system via API.
              </Typography>

              {erpStatus?.enabled && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Last Sync: {erpStatus.lastFullSync ? new Date(erpStatus.lastFullSync).toLocaleString() : 'Never'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Sync Status: {erpStatus.lastSyncStatus || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Recent Syncs: {erpStatus.stats.recentSyncs}
                  </Typography>
                  {erpStatus.stats.failedSyncs > 0 && (
                    <Typography variant="caption" color="error.main" display="block">
                      Failed Syncs: {erpStatus.stats.failedSyncs}
                    </Typography>
                  )}
                </Box>
              )}

              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/system/flasherp')}
              >
                {erpStatus?.enabled ? 'Manage Integration' : 'Configure Integration'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Placeholder for future integrations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                More Integrations Coming Soon
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Additional integrations will be available in future releases.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
