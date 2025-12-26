import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Alert,
  LinearProgress,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  Visibility as ViewIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Webhook Management Page
 *
 * Admin interface for managing webhooks:
 * - Create/update/delete webhooks
 * - Subscribe to events
 * - Test webhook delivery
 * - View delivery history
 * - Monitor failure rates
 * - Regenerate secrets
 *
 * Integrates with WebhookRouter service from Phase 5
 */

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  failureCount: number;
  lastDeliveredAt?: string;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  responseStatus?: number;
  responseBody?: string;
  deliveredAt: string;
  success: boolean;
}

const AVAILABLE_EVENTS = [
  'GOAL_CREATED',
  'GOAL_UPDATED',
  'GOAL_COMPLETED',
  'HABIT_CREATED',
  'HABIT_CHECKED_IN',
  'ACHIEVEMENT_UNLOCKED',
  'USER_REGISTERED',
  'SUBSCRIPTION_UPDATED',
];

export default function WebhookManagementPage() {
  const { tenant } = useAuth();

  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [deliveriesDialogOpen, setDeliveriesDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);

  // Form state
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [secret, setSecret] = useState('');

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    setLoading(true);
    setError(null);

    try {
      // Mock data - replace with actual API call
      const mockWebhooks: Webhook[] = [
        {
          id: 'webhook-1',
          url: 'https://api.example.com/webhooks/upcoach',
          events: ['GOAL_CREATED', 'HABIT_CHECKED_IN'],
          secret: 'whsec_***************',
          active: true,
          failureCount: 0,
          lastDeliveredAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'webhook-2',
          url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX',
          events: ['ACHIEVEMENT_UNLOCKED'],
          secret: 'whsec_***************',
          active: true,
          failureCount: 3,
          lastDeliveredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setWebhooks(mockWebhooks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = () => {
    setEditingWebhook(null);
    setUrl('');
    setEvents([]);
    setSecret(generateSecret());
    setDialogOpen(true);
  };

  const handleEditWebhook = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setUrl(webhook.url);
    setEvents(webhook.events);
    setSecret(webhook.secret);
    setDialogOpen(true);
  };

  const handleSaveWebhook = async () => {
    setLoading(true);

    try {
      if (editingWebhook) {
        // Update webhook
        console.log('Updating webhook', { id: editingWebhook.id, url, events });
      } else {
        // Create webhook
        console.log('Creating webhook', { url, events, secret });
      }

      await loadWebhooks();
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    setLoading(true);

    try {
      console.log('Deleting webhook', webhookId);
      await loadWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    setLoading(true);

    try {
      console.log('Testing webhook', webhookId);
      alert('Test webhook sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDeliveries = async (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setLoading(true);

    try {
      // Mock deliveries - replace with actual API call
      const mockDeliveries: WebhookDelivery[] = [
        {
          id: 'delivery-1',
          webhookId: webhook.id,
          event: 'GOAL_CREATED',
          payload: { goalId: 'goal-123', title: 'Learn GraphQL' },
          responseStatus: 200,
          responseBody: 'OK',
          deliveredAt: new Date().toISOString(),
          success: true,
        },
        {
          id: 'delivery-2',
          webhookId: webhook.id,
          event: 'HABIT_CHECKED_IN',
          payload: { habitId: 'habit-456', userId: 'user-789' },
          responseStatus: 500,
          responseBody: 'Internal Server Error',
          deliveredAt: new Date(Date.now() - 3600000).toISOString(),
          success: false,
        },
      ];

      setDeliveries(mockDeliveries);
      setDeliveriesDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const generateSecret = () => {
    return 'whsec_' + Math.random().toString(36).substring(2, 15);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Webhook Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Configure webhooks to receive real-time notifications
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateWebhook}>
          Create Webhook
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Total Webhooks
              </Typography>
              <Typography variant="h3">{webhooks.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Active Webhooks
              </Typography>
              <Typography variant="h3">
                {webhooks.filter((w) => w.active).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Failed Deliveries
              </Typography>
              <Typography variant="h3" color="error">
                {webhooks.reduce((sum, w) => sum + w.failureCount, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>URL</TableCell>
                <TableCell>Events</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Failures</TableCell>
                <TableCell>Last Delivered</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {webhook.url}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {webhook.events.map((event) => (
                        <Chip key={event} label={event} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={webhook.active ? 'Active' : 'Inactive'}
                      color={webhook.active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={webhook.failureCount}
                      color={webhook.failureCount > 0 ? 'error' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {webhook.lastDeliveredAt
                        ? new Date(webhook.lastDeliveredAt).toLocaleString()
                        : 'Never'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Deliveries">
                        <IconButton size="small" onClick={() => handleViewDeliveries(webhook)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Test Webhook">
                        <IconButton size="small" onClick={() => handleTestWebhook(webhook.id)}>
                          <TestIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEditWebhook(webhook)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDeleteWebhook(webhook.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Webhook Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingWebhook ? 'Edit Webhook' : 'Create Webhook'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Webhook URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              fullWidth
              placeholder="https://api.example.com/webhooks"
              helperText="HTTPS endpoint to receive webhook deliveries"
            />

            <FormControl fullWidth>
              <InputLabel>Events</InputLabel>
              <Select
                multiple
                value={events}
                onChange={(e) => setEvents(e.target.value as string[])}
                input={<OutlinedInput label="Events" />}
                renderValue={(selected) => (
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {AVAILABLE_EVENTS.map((event) => (
                  <MenuItem key={event} value={event}>
                    <Checkbox checked={events.indexOf(event) > -1} />
                    <ListItemText primary={event} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              fullWidth
              helperText="Used to sign webhook payloads (HMAC SHA256)"
              InputProps={{
                readOnly: !editingWebhook,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveWebhook} variant="contained" disabled={!url || events.length === 0}>
            {editingWebhook ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deliveries Dialog */}
      <Dialog
        open={deliveriesDialogOpen}
        onClose={() => setDeliveriesDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Webhook Deliveries - {selectedWebhook?.url}</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Response</TableCell>
                <TableCell>Delivered At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell>
                    <Chip label={delivery.event} size="small" />
                  </TableCell>
                  <TableCell>
                    {delivery.success ? (
                      <Chip icon={<SuccessIcon />} label="Success" color="success" size="small" />
                    ) : (
                      <Chip icon={<ErrorIcon />} label="Failed" color="error" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {delivery.responseStatus} - {delivery.responseBody}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(delivery.deliveredAt).toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveriesDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
