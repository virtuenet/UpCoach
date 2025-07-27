'use client';

import { ReactNode } from 'react';
import { useExperiment } from '@/services/experiments';

interface ABTestProps {
  experimentId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ABTest({ experimentId, children, fallback }: ABTestProps) {
  const { variant } = useExperiment(experimentId);
  
  // If no variant or control, show fallback or first child
  if (variant === 'control') {
    return <>{fallback || children}</>;
  }
  
  return <>{children}</>;
}

interface VariantProps {
  variant: string;
  children: ReactNode;
}

export function Variant({ variant, children }: VariantProps) {
  return <div data-variant={variant}>{children}</div>;
}

interface ABTestSwitchProps {
  experimentId: string;
  children: ReactNode;
}

export function ABTestSwitch({ experimentId, children }: ABTestSwitchProps) {
  const { variant } = useExperiment(experimentId);
  
  // Find matching variant child
  const variantElements = Array.isArray(children) ? children : [children];
  
  for (const child of variantElements) {
    if (child && typeof child === 'object' && 'props' in child) {
      if (child.props.variant === variant) {
        return <>{child}</>;
      }
    }
  }
  
  // Return first child as fallback
  return <>{variantElements[0]}</>;
}