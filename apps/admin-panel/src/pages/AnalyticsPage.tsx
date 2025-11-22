import { Box, Typography, Grid } from '@mui/material';
import {
  EngagementTrendsChart,
  GoalOverviewCards,
  HabitAdherenceChart,
} from '../components/analytics';

export default function AnalyticsPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
        Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Powered by the new `/api/analytics/v2` data pipeline. Updated automatically every few minutes.
      </Typography>

      <Box mb={3}>
        <GoalOverviewCards />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <HabitAdherenceChart days={14} />
        </Grid>
        <Grid item xs={12} md={6}>
          <EngagementTrendsChart />
        </Grid>
      </Grid>
    </Box>
  );
}
