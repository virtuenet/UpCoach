import { Card, CardContent, CardHeader, Skeleton } from '@mui/material';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useHabitAdherence } from '../../hooks/useAnalyticsQueries';

const chartFormatter = (value: number) => `${Math.round(value * 100)}%`;

export function HabitAdherenceChart({ days = 14 }: { days?: number }) {
  const { data, isLoading, isError } = useHabitAdherence(days);

  return (
    <Card>
      <CardHeader
        title="Habit Adherence"
        subheader={`Rolling completion rate (last ${days} days)`}
      />
      <CardContent sx={{ height: 260 }}>
        {isError && <div>Unable to load habit analytics.</div>}
        {isLoading ? (
          <Skeleton variant="rounded" height={220} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.adherence ?? []}>
              <defs>
                <linearGradient id="adherenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="date"
                tickFormatter={value => new Date(value).toLocaleDateString()}
              />
              <YAxis
                tickFormatter={chartFormatter}
                domain={[0, 1]}
                allowDecimals={true}
              />
              <Tooltip
                formatter={(value: number) => chartFormatter(value)}
                labelFormatter={value => new Date(value).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="completionRate"
                stroke="#7c3aed"
                fillOpacity={1}
                fill="url(#adherenceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}


