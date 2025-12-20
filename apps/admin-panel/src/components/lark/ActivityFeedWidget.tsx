import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  Sync as SyncIcon,
  Person as PersonIcon,
  SupportAgent as SupportIcon,
  AttachMoney as MoneyIcon,
  Event as EventIcon,
  Notifications as NotificationIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  getActivityFeed,
  getSyncStatus,
  triggerSync,
  ActivityFeedItem,
  LarkSyncStatus,
  larkDeepLinks,
} from '../../services/larkWidgetService';

const activityTypeConfig: Record<string, { icon: React.ReactElement; color: string }> = {
  coach_signup: { icon: <PersonIcon fontSize="small" />, color: '#4caf50' },
  coach_update: { icon: <PersonIcon fontSize="small" />, color: '#2196f3' },
  ticket_created: { icon: <SupportIcon fontSize="small" />, color: '#ff9800' },
  ticket_resolved: { icon: <SupportIcon fontSize="small" />, color: '#4caf50' },
  payout_approved: { icon: <MoneyIcon fontSize="small" />, color: '#4caf50' },
  payout_rejected: { icon: <MoneyIcon fontSize="small" />, color: '#f44336' },
  session_completed: { icon: <EventIcon fontSize="small" />, color: '#2196f3' },
  session_no_show: { icon: <EventIcon fontSize="small" />, color: '#ff9800' },
  sync_completed: { icon: <SyncIcon fontSize="small" />, color: '#9c27b0' },
  notification_sent: { icon: <NotificationIcon fontSize="small" />, color: '#00bcd4' },
};

const importanceIcons: Record<string, React.ReactElement> = {
  high: <ErrorIcon fontSize="small" color="error" />,
  medium: <WarningIcon fontSize="small" color="warning" />,
  low: <InfoIcon fontSize="small" color="info" />,
  normal: <SuccessIcon fontSize="small" color="success" />,
};

export const ActivityFeedWidget: React.FC = () => {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<LarkSyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [activityResult, syncResult] = await Promise.all([
        getActivityFeed(),
        getSyncStatus(),
      ]);
      setActivities(activityResult);
      setSyncStatus(syncResult);
    } catch (err) {
      setError('Failed to load activity data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await triggerSync();
      await fetchData(); // Refresh after sync
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60 * 1000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (dateStr: string): string => {
    const now = new Date();
    const activityDate = new Date(dateStr);
    const diff = now.getTime() - activityDate.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatLastSync = (dateStr: string | null): string => {
    if (!dateStr) return 'Never';
    return formatTimestamp(dateStr);
  };

  if (loading && activities.length === 0) {
    return (
      <Card>
        <CardHeader title="Activity Feed" />
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
          title="Activity Feed"
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

  const isHealthy = syncStatus?.isConnected && syncStatus.errors.length === 0;

  return (
    <Card>
      <CardHeader
        title="Activity Feed"
        subheader="Lark integration activity"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Trigger Sync">
              <IconButton onClick={handleSync} size="small" disabled={syncing}>
                <SyncIcon sx={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchData} size="small" disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Open Lark">
              <IconButton onClick={() => window.open(larkDeepLinks.base('activity'), '_blank')} size="small">
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <CardContent>
        {/* Sync Status */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1.5,
          mb: 2,
          bgcolor: isHealthy ? 'success.light' : 'warning.light',
          borderRadius: 1,
          opacity: 0.9,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SyncIcon fontSize="small" />
            <Typography variant="body2">
              Sync: {isHealthy ? 'Healthy' : 'Issues Detected'}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Last: {formatLastSync(syncStatus?.lastSyncTime || null)}
          </Typography>
        </Box>

        {/* Sync Stats */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {syncStatus?.isConnected ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Connected
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color={syncStatus?.isRunning ? 'warning.main' : 'text.secondary'}>
              {syncStatus?.isRunning ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Running
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="error.main">
              {syncStatus?.errors.length || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Errors
            </Typography>
          </Box>
        </Box>

        {/* Progress if running */}
        {syncStatus?.isRunning && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Syncing: {syncStatus.currentTable || 'Initializing...'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {syncStatus.progress}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={syncStatus.progress} />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Recent Activity */}
        <Typography variant="subtitle2" gutterBottom>
          Recent Activity
        </Typography>
        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
          {activities.slice(0, 10).map((activity) => {
            const config = activityTypeConfig[activity.type] || {
              icon: <NotificationIcon fontSize="small" />,
              color: '#757575'
            };

            return (
              <ListItem
                key={activity.id}
                disablePadding
                sx={{ py: 0.5 }}
                secondaryAction={
                  <Typography variant="caption" color="text.secondary">
                    {formatTimestamp(activity.occurredAt)}
                  </Typography>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: config.color, width: 28, height: 28 }}>
                    {config.icon}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {importanceIcons[activity.importance] || importanceIcons['normal']}
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {activity.description}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {activity.actorName} ({activity.actorType})
                    </Typography>
                  }
                />
              </ListItem>
            );
          })}
        </List>

        {activities.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <SyncIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No recent activity
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* CSS for spin animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Card>
  );
};

export default ActivityFeedWidget;
