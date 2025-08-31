/**
 * UpCoach Design System - LoadingState Component
 * Unified loading states and skeletons
 */
import React from 'react';
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
export declare const LoadingState: React.FC<LoadingStateProps>;
export default LoadingState;
//# sourceMappingURL=LoadingState.d.ts.map
