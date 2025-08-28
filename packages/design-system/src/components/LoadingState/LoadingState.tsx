/**
 * UpCoach Design System - LoadingState Component
 * Unified loading states and skeletons
 */

import React from 'react';
import { 
  Box, 
  CircularProgress, 
  Skeleton, 
  Typography,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';

export interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'linear' | 'dots' | 'pulse';
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  skeletonConfig?: {
    lines?: number;
    avatar?: boolean;
    image?: boolean;
    imageHeight?: number;
  };
}

const LoadingContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'fullScreen' && prop !== 'overlay'
})<{ fullScreen?: boolean; overlay?: boolean }>(({ theme, fullScreen, overlay }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(4),
  ...(fullScreen && {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: theme.zIndex.modal,
  }),
  ...(overlay && {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(2px)',
    zIndex: 10,
  }),
}));

const DotsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  '& > span': {
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    animation: 'bounce 1.4s infinite ease-in-out both',
    '&:nth-of-type(1)': {
      animationDelay: '-0.32s',
    },
    '&:nth-of-type(2)': {
      animationDelay: '-0.16s',
    },
  },
  '@keyframes bounce': {
    '0%, 80%, 100%': {
      transform: 'scale(0)',
      opacity: 0.5,
    },
    '40%': {
      transform: 'scale(1)',
      opacity: 1,
    },
  },
}));

const PulseBox = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  '@keyframes pulse': {
    '0%, 100%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.3,
    },
  },
}));

const getSize = (size?: string) => {
  switch (size) {
    case 'small':
      return 24;
    case 'large':
      return 48;
    case 'medium':
    default:
      return 36;
  }
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  size = 'medium',
  text,
  fullScreen = false,
  overlay = false,
  skeletonConfig = {},
}) => {
  const renderLoading = () => {
    switch (variant) {
      case 'skeleton':
        const { lines = 3, avatar = false, image = false, imageHeight = 200 } = skeletonConfig;
        return (
          <Box sx={{ width: '100%' }}>
            {avatar && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="30%" />
                  <Skeleton variant="text" width="20%" />
                </Box>
              </Box>
            )}
            {image && <Skeleton variant="rectangular" height={imageHeight} sx={{ mb: 2 }} />}
            {Array.from({ length: lines }).map((_, index) => (
              <Skeleton
                key={index}
                variant="text"
                width={index === lines - 1 ? '60%' : '100%'}
              />
            ))}
          </Box>
        );

      case 'linear':
        return <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />;

      case 'dots':
        return (
          <DotsContainer>
            <span />
            <span />
            <span />
          </DotsContainer>
        );

      case 'pulse':
        return <PulseBox />;

      case 'spinner':
      default:
        return <CircularProgress size={getSize(size)} />;
    }
  };

  return (
    <LoadingContainer fullScreen={fullScreen} overlay={overlay}>
      {renderLoading()}
      {text && (
        <Typography variant="body2" color="text.secondary">
          {text}
        </Typography>
      )}
    </LoadingContainer>
  );
};

export default LoadingState;