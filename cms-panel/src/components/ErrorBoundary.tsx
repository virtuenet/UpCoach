// Re-export from shared components
import React from 'react'
import SharedErrorBoundary from '../../../shared/components/ui/ErrorBoundary'

// Use console as logger for CMS panel
const ErrorBoundary: React.FC<React.ComponentProps<typeof SharedErrorBoundary>> = (props) => {
  return <SharedErrorBoundary {...props} logger={console} />
}

export default ErrorBoundary