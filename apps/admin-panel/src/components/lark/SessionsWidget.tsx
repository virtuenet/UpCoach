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
  Event as EventIcon,
  VideoCameraFront as VideoIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { getSessionData, SessionData, larkDeepLinks } from '../../services/larkWidgetService';

const sessionTypeColors: Record<string, string> = {
  Career: '#1976d2',
  Life: '#9c27b0',
  Fitness: '#4caf50',
  Business: '#ff9800',
  Health: '#00bcd4',
  one_on_one: '#1976d2',
  group: '#9c27b0',
  workshop: '#4caf50',
};

export const SessionsWidget: React.FC = () => {
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSessionData();
      setData(result);
    } catch (err) {
      setError('Failed to load session data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2 * 60 * 1000); // Refresh every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTimeUntil = (dateStr: string): string => {
    const now = new Date();
    const diff = new Date(dateStr).getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 0) return 'Started';
    if (minutes < 60) return `in ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `in ${hours}h ${minutes % 60}m`;
  };

  if (loading && !data) {
    return (
      <Card>
        <CardHeader title="Today's Sessions" />
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
          title="Today's Sessions"
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

  const completionRate = data?.todayTotal
    ? Math.round((data.completed / data.todayTotal) * 100)
    : 0;

  // Filter upcoming sessions (scheduled status)
  const upcomingSessions = data?.sessions.filter(s => s.status === 'scheduled') || [];

  return (
    <Card>
      <CardHeader
        title="Today's Sessions"
        subheader={`${data?.todayTotal || 0} scheduled`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchData} size="small" disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Open Calendar">
              <IconButton onClick={() => window.open(larkDeepLinks.calendar, '_blank')} size="small">
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
              {data?.todayTotal || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {data?.completed || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">
              {data?.noShow || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No-shows
            </Typography>
          </Box>
        </Box>

        {/* Completion Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Completion Rate
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completionRate}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionRate}
            color={completionRate >= 80 ? 'success' : completionRate >= 50 ? 'warning' : 'error'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Upcoming Sessions */}
        <Typography variant="subtitle2" gutterBottom>
          Upcoming Sessions
        </Typography>
        <List dense>
          {upcomingSessions.slice(0, 5).map((session) => (
            <ListItem
              key={session.id}
              disablePadding
              sx={{ py: 0.5 }}
              secondaryAction={
                <Chip
                  label={getTimeUntil(session.scheduledAt)}
                  size="small"
                  color={getTimeUntil(session.scheduledAt) === 'Started' ? 'success' : 'default'}
                  variant="outlined"
                />
              }
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: sessionTypeColors[session.type] || '#757575', width: 32, height: 32 }}>
                  <VideoIcon fontSize="small" />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                    {session.coachName} → {session.clientName}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EventIcon fontSize="inherit" sx={{ fontSize: 12 }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(session.scheduledAt)} • {session.type}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        {upcomingSessions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 40, opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              No more sessions scheduled for today
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionsWidget;
