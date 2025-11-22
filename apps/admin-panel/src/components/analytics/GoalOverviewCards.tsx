import { Card, CardContent, Grid, Skeleton, Stack, Typography, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import SpeedIcon from '@mui/icons-material/Speed';
import PercentIcon from '@mui/icons-material/Percent';
import { useGoalOverview } from '../../hooks/useAnalyticsQueries';

const metricIconMap = {
  totalGoals: <TrackChangesIcon color="primary" />,
  completedGoals: <CheckCircleIcon color="success" />,
  activeGoals: <SpeedIcon color="info" />,
  completionRate: <PercentIcon color="secondary" />,
} as const;

export function GoalOverviewCards() {
  const { data, isLoading, isError } = useGoalOverview();

  if (isError) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">
            Unable to load goal analytics. Please try again later.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      key: 'totalGoals',
      label: 'Total Goals',
      value: data?.totalGoals ?? 0,
      helper: 'All time goals created',
    },
    {
      key: 'completedGoals',
      label: 'Completed Goals',
      value: data?.completedGoals ?? 0,
      helper: 'Marked as completed',
    },
    {
      key: 'activeGoals',
      label: 'Active Goals',
      value: data?.activeGoals ?? 0,
      helper: 'Currently in progress',
    },
    {
      key: 'completionRate',
      label: 'Completion Rate',
      value: `${Math.round((data?.completionRate ?? 0) * 100)}%`,
      helper: 'Completed / total',
    },
  ];

  return (
    <Grid container spacing={2}>
      {metrics.map(metric => (
        <Grid item xs={12} sm={6} lg={3} key={metric.key}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  {metric.label}
                </Typography>
                {metricIconMap[metric.key as keyof typeof metricIconMap]}
              </Stack>
              {isLoading ? (
                <Skeleton variant="text" height={36} />
              ) : (
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {metric.value}
                </Typography>
              )}
              <Chip size="small" label={metric.helper} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}


