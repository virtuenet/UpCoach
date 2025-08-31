import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
/**
 * UpCoach Design System - LoadingState Component
 * Unified loading states and skeletons
 */
import React from 'react';
import { Box, CircularProgress, Skeleton, Typography, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
const LoadingContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'fullScreen' && prop !== 'overlay',
})(({ theme, fullScreen, overlay }) => ({
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
const getSize = size => {
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
export const LoadingState = ({
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
        return _jsxs(Box, {
          sx: { width: '100%' },
          children: [
            avatar &&
              _jsxs(Box, {
                sx: { display: 'flex', gap: 2, mb: 2 },
                children: [
                  _jsx(Skeleton, { variant: 'circular', width: 40, height: 40 }),
                  _jsxs(Box, {
                    sx: { flex: 1 },
                    children: [
                      _jsx(Skeleton, { variant: 'text', width: '30%' }),
                      _jsx(Skeleton, { variant: 'text', width: '20%' }),
                    ],
                  }),
                ],
              }),
            image && _jsx(Skeleton, { variant: 'rectangular', height: imageHeight, sx: { mb: 2 } }),
            Array.from({ length: lines }).map((_, index) =>
              _jsx(
                Skeleton,
                { variant: 'text', width: index === lines - 1 ? '60%' : '100%' },
                index
              )
            ),
          ],
        });
      case 'linear':
        return _jsx(LinearProgress, { sx: { width: '100%', maxWidth: 400 } });
      case 'dots':
        return _jsxs(DotsContainer, {
          children: [_jsx('span', {}), _jsx('span', {}), _jsx('span', {})],
        });
      case 'pulse':
        return _jsx(PulseBox, {});
      case 'spinner':
      default:
        return _jsx(CircularProgress, { size: getSize(size) });
    }
  };
  return _jsxs(LoadingContainer, {
    fullScreen: fullScreen,
    overlay: overlay,
    children: [
      renderLoading(),
      text && _jsx(Typography, { variant: 'body2', color: 'text.secondary', children: text }),
    ],
  });
};
export default LoadingState;
