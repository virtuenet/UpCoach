/**
 * UpCoach Design System - Card Component
 * Unified card component for content containers
 */

import React from 'react';
import { 
  Card as MuiCard, 
  CardProps as MuiCardProps,
  CardContent,
  CardHeader,
  CardActions,
  CardMedia,
  Typography,
  IconButton,
  Skeleton
} from '@mui/material';
import { styled } from '@mui/material/styles';

export interface CardProps extends Omit<MuiCardProps, 'title'> {
  title?: React.ReactNode;
  subtitle?: string;
  headerAction?: React.ReactNode;
  media?: {
    src: string;
    alt?: string;
    height?: number;
  };
  actions?: React.ReactNode;
  loading?: boolean;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

const StyledCard = styled(MuiCard, {
  shouldForwardProp: (prop) => prop !== 'variant' && prop !== 'padding'
})<{ variant?: string; padding?: string }>(({ theme, variant = 'elevated' }) => ({
  transition: theme.transitions.create(['box-shadow', 'transform'], {
    duration: theme.transitions.duration.short,
  }),
  ...(variant === 'filled' && {
    backgroundColor: theme.palette.grey[50],
    boxShadow: 'none',
  }),
  '&:hover': {
    ...(variant === 'elevated' && {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
    }),
  },
}));

const getPaddingValue = (padding?: string, theme?: any) => {
  switch (padding) {
    case 'none':
      return 0;
    case 'small':
      return theme?.spacing(2);
    case 'large':
      return theme?.spacing(4);
    case 'medium':
    default:
      return theme?.spacing(3);
  }
};

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerAction,
  media,
  actions,
  loading = false,
  variant = 'elevated',
  padding = 'medium',
  children,
  ...props
}) => {
  const cardVariant = variant === 'outlined' ? 'outlined' : 'elevation';

  if (loading) {
    return (
      <StyledCard variant={cardVariant} {...props}>
        {(title || subtitle) && (
          <CardHeader
            title={<Skeleton variant="text" width="60%" />}
            subheader={subtitle && <Skeleton variant="text" width="40%" />}
          />
        )}
        {media && <Skeleton variant="rectangular" height={media.height || 200} />}
        <CardContent sx={{ padding: (theme) => getPaddingValue(padding, theme) }}>
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="text" width="80%" />
        </CardContent>
        {actions && (
          <CardActions>
            <Skeleton variant="rectangular" width={100} height={36} />
          </CardActions>
        )}
      </StyledCard>
    );
  }

  return (
    <StyledCard variant={cardVariant} {...props}>
      {(title || subtitle || headerAction) && (
        <CardHeader
          title={title}
          subheader={subtitle}
          action={headerAction}
        />
      )}
      {media && (
        <CardMedia
          component="img"
          height={media.height || 200}
          image={media.src}
          alt={media.alt}
        />
      )}
      {children && (
        <CardContent sx={{ padding: (theme) => getPaddingValue(padding, theme) }}>
          {children}
        </CardContent>
      )}
      {actions && <CardActions>{actions}</CardActions>}
    </StyledCard>
  );
};

export default Card;