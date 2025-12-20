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
  ListItemAvatar,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { getCoachPipelineData, CoachPipelineData, larkDeepLinks } from '../../services/larkWidgetService';

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  pending: 'warning',
  onboarding: 'info',
  active: 'success',
  inactive: 'default',
  suspended: 'error',
};

export const CoachPipelineWidget: React.FC = () => {
  const [data, setData] = useState<CoachPipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCoachPipelineData();
      setData(result);
    } catch (err) {
      setError('Failed to load coach pipeline data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenInLark = () => {
    window.open(larkDeepLinks.people, '_blank');
  };

  if (loading && !data) {
    return (
      <Card>
        <CardHeader title="Coach Pipeline" />
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
          title="Coach Pipeline"
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
        title="Coach Pipeline"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchData} size="small" disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Open in Lark">
              <IconButton onClick={handleOpenInLark} size="small">
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
              Total Coaches
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {data?.activeCoaches || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {data?.pendingOnboarding || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Onboarding
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUpIcon color="success" sx={{ mr: 0.5 }} />
              <Typography variant="h4">
                {data?.averageRating.toFixed(1) || '0.0'}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Avg Rating
            </Typography>
          </Box>
        </Box>

        {/* Status Breakdown */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            By Status
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(data?.byStatus || {}).map(([status, count]) => (
              <Chip
                key={status}
                label={`${status}: ${count}`}
                size="small"
                color={statusColors[status] || 'default'}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        {/* Recent Signups */}
        <Typography variant="subtitle2" gutterBottom>
          Recent Signups
        </Typography>
        <List dense>
          {(data?.recentSignups || []).slice(0, 5).map((coach) => (
            <ListItem key={coach.id} disablePadding sx={{ py: 0.5 }}>
              <ListItemAvatar>
                <Avatar sx={{ width: 32, height: 32 }}>
                  <PersonIcon fontSize="small" />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={coach.name}
                secondary={new Date(coach.signupDate).toLocaleDateString()}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              <Chip
                label={coach.status}
                size="small"
                color={statusColors[coach.status] || 'default'}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default CoachPipelineWidget;
