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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  SupportAgent as SupportIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { getSupportTicketData, SupportTicketData, larkDeepLinks } from '../../services/larkWidgetService';

const priorityColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
};

const categoryIcons: Record<string, React.ReactNode> = {
  app_issue: <ErrorIcon fontSize="small" />,
  payment: <WarningIcon fontSize="small" />,
  coaching: <SupportIcon fontSize="small" />,
};

export const SupportWidget: React.FC = () => {
  const [data, setData] = useState<SupportTicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSupportTicketData();
      setData(result);
    } catch (err) {
      setError('Failed to load support ticket data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3 * 60 * 1000); // Refresh every 3 minutes
    return () => clearInterval(interval);
  }, []);

  const formatResolutionTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  if (loading && !data) {
    return (
      <Card>
        <CardHeader title="Support Tickets" />
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
          title="Support Tickets"
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

  return (
    <Card>
      <CardHeader
        title="Support Tickets"
        subheader={`${data?.open || 0} open tickets`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchData} size="small" disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Open in Lark">
              <IconButton onClick={() => window.open(larkDeepLinks.base('support'), '_blank')} size="small">
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
            <Typography variant="h4" color="primary">
              {data?.total || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {data?.open || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Open
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4">
              {formatResolutionTime(data?.averageResolutionTime || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Resolution
            </Typography>
          </Box>
        </Box>

        {/* Priority Breakdown */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            By Priority
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(data?.byPriority || {}).map(([priority, count]) => (
              <Chip
                key={priority}
                label={`${priority}: ${count}`}
                size="small"
                color={priorityColors[priority] || 'default'}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Recent Tickets */}
        <Typography variant="subtitle2" gutterBottom>
          Recent Tickets
        </Typography>
        <List dense>
          {(data?.recentTickets || []).slice(0, 5).map((ticket) => (
            <ListItem
              key={ticket.id}
              disablePadding
              sx={{ py: 0.5 }}
              secondaryAction={
                <Chip
                  label={ticket.priority}
                  size="small"
                  color={priorityColors[ticket.priority] || 'default'}
                />
              }
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {categoryIcons[ticket.status] || <SupportIcon fontSize="small" />}
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {ticket.subject}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {ticket.clientName} &bull; {new Date(ticket.createdAt).toLocaleDateString()}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default SupportWidget;
