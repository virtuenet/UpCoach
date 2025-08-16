// Re-export from shared components with logger integration
import React from 'react';
import SharedErrorBoundary from '../../../shared/components/ui/ErrorBoundary';
import { logger } from '../utils/logger';

// Wrapper component that adds the logger
const ErrorBoundary: React.FC<React.ComponentProps<typeof SharedErrorBoundary>> = (props) => {
  return <SharedErrorBoundary {...props} logger={logger} />;
};

export default ErrorBoundary;