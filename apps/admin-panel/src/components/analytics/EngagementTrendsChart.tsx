import { Card, CardContent, CardHeader, Skeleton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useState } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useEngagementTrends } from '../../hooks/useAnalyticsQueries';

export function EngagementTrendsChart() {
  const [windowSize, setWindowSize] = useState(21);
  const { data, isLoading, isError } = useEngagementTrends(windowSize);

  return (
    <Card>
      <CardHeader
        title="Engagement Trends"
        subheader="Tasks, goals, and daily active minutes"
        action={
          <ToggleButtonGroup
            size="small"
            exclusive
            value={windowSize}
            onChange={(_, value) => value && setWindowSize(value)}
          >
            <ToggleButton value={7}>7d</ToggleButton>
            <ToggleButton value={14}>14d</ToggleButton>
            <ToggleButton value={30}>30d</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      <CardContent sx={{ height: 320 }}>
        {isError && <div>Unable to load engagement data.</div>}
        {isLoading ? (
          <Skeleton variant="rounded" height={280} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data?.trends ?? []}>
              <CartesianGrid stroke="#f5f5f5" />
              <XAxis
                dataKey="date"
                tickFormatter={value => new Date(value).toLocaleDateString()}
              />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" tickFormatter={value => `${value}m`} />
              <Tooltip
                formatter={(value: number, name) =>
                  name === 'activeMinutes' ? `${value} mins` : value
                }
                labelFormatter={value => new Date(value).toLocaleDateString()}
              />
              <Bar
                yAxisId="left"
                dataKey="tasksCompleted"
                stackId="volume"
                name="Tasks"
                fill="#a78bfa"
              />
              <Bar
                yAxisId="left"
                dataKey="goalsAchieved"
                stackId="volume"
                name="Goals"
                fill="#7c3aed"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="activeMinutes"
                name="Active Minutes"
                stroke="#0ea5e9"
                fill="#0ea5e933"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}


