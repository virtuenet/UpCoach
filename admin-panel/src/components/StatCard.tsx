import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  subtitle,
}) => {
  const theme = useTheme();
  const isPositiveTrend = trend && trend > 0;
  const trendColor = isPositiveTrend ? theme.palette.success.main : theme.palette.error.main;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                color: theme.palette[color].main,
                backgroundColor: theme.palette[color].light,
                borderRadius: '50%',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {React.cloneElement(icon as React.ReactElement, {
                fontSize: 'small',
              })}
            </Box>
          )}
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          {value}
        </Typography>

        {(trend !== undefined || subtitle) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isPositiveTrend ? (
                  <TrendingUp sx={{ fontSize: 16, color: trendColor, mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: trendColor, mr: 0.5 }} />
                )}
                <Typography variant="body2" sx={{ color: trendColor, fontWeight: 500 }}>
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
