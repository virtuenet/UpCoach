// Re-export from shared components with logger integration
import React from 'react';
// import SharedErrorBoundary from '../../../shared/components/ui/ErrorBoundary'; // Component not found

// Temporary fallback component while SharedErrorBoundary is missing
const ErrorBoundary: React.FC<any> = ({ children }) => {
  return <>{children}</>;
};

export default ErrorBoundary;