import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
/**
 * UpCoach Design System - Button Component
 * Unified button component with consistent styling and behavior
 */
import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
const StyledButton = styled(MuiButton, {
  shouldForwardProp: prop => prop !== 'loading',
})(({ theme, loading }) => ({
  position: 'relative',
  '& .MuiButton-startIcon': {
    opacity: loading ? 0 : 1,
  },
  '& .MuiButton-endIcon': {
    opacity: loading ? 0 : 1,
  },
}));
const LoadingWrapper = styled('div')({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
});
export const Button = ({
  variant = 'primary',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}) => {
  // Map custom variants to MUI variants
  const getMuiVariant = () => {
    switch (variant) {
      case 'primary':
        return 'contained';
      case 'secondary':
        return 'outlined';
      case 'tertiary':
      case 'ghost':
        return 'text';
      case 'danger':
        return 'contained';
      case 'link':
        return 'text';
      default:
        return 'contained';
    }
  };
  // Apply variant-specific color
  const getColor = () => {
    switch (variant) {
      case 'danger':
        return 'error';
      case 'secondary':
        return 'secondary';
      default:
        return 'primary';
    }
  };
  return _jsxs(StyledButton, {
    variant: getMuiVariant(),
    color: getColor(),
    disabled: disabled || loading,
    loading: loading,
    startIcon: leftIcon,
    endIcon: rightIcon,
    ...props,
    children: [
      loading &&
        _jsx(LoadingWrapper, { children: _jsx(CircularProgress, { size: 20, color: 'inherit' }) }),
      _jsx('span', { style: { opacity: loading ? 0 : 1 }, children: children }),
    ],
  });
};
export default Button;
