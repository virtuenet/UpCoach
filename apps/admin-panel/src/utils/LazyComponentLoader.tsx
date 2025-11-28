import React, { Suspense, ComponentType, LazyExoticComponent, memo } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

/**
 * Loading component interface
 */
interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

/**
 * Error fallback component interface
 */
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Lazy loading options
 */
interface LazyLoadOptions {
  fallback?: ComponentType<LoadingProps>;
  errorFallback?: ComponentType<ErrorFallbackProps>;
  preload?: boolean;
  retryAttempts?: number;
  timeout?: number;
  loadingMessage?: string;
  fullScreen?: boolean;
  loadingSize?: 'small' | 'medium' | 'large';
}

/**
 * Performance-optimized loading component
 */
const DefaultLoadingComponent: React.FC<LoadingProps> = memo(({
  message = 'Loading...',
  size = 'medium',
  fullScreen = false
}) => {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 56
  };

  const containerStyle = fullScreen ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 9999
  } : {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    minHeight: '200px'
  };

  return (
    <Box sx={containerStyle}>
      <CircularProgress size={sizeMap[size]} />
      <Typography
        variant="body2"
        color="textSecondary"
        sx={{ mt: 2 }}
      >
        {message}
      </Typography>
    </Box>
  );
});

DefaultLoadingComponent.displayName = 'DefaultLoadingComponent';

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = memo(({
  error,
  resetErrorBoundary
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      minHeight: '200px',
      textAlign: 'center'
    }}
  >
    <Typography variant="h6" color="error" gutterBottom>
      Failed to load component
    </Typography>
    <Typography variant="body2" color="textSecondary" paragraph>
      {error.message}
    </Typography>
    <button
      onClick={resetErrorBoundary}
      style={{
        padding: '8px 16px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Try again
    </button>
  </Box>
));

DefaultErrorFallback.displayName = 'DefaultErrorFallback';

/**
 * Preload cache for components
 */
const preloadCache = new Map<string, Promise<{ default: ComponentType<any> }>>();

/**
 * Create a lazy-loaded component with advanced features
 */
export function createLazyComponent<T = {}>(
  componentImport: () => Promise<{ default: ComponentType<T> }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<ComponentType<T>> {
  const {
    fallback = DefaultLoadingComponent,
    errorFallback = DefaultErrorFallback,
    preload = false,
    retryAttempts = 3,
    timeout = 10000
  } = options;

  // Create cache key for the component
  const cacheKey = componentImport.toString();

  // Enhanced import function with retry logic and timeout
  const enhancedImport = async (): Promise<{ default: ComponentType<T> }> => {
    // Check preload cache first
    if (preloadCache.has(cacheKey)) {
      return preloadCache.get(cacheKey)!;
    }

    let lastError: Error = new Error('Component loading failed');

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        // Create a promise that rejects after timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Component loading timeout after ${timeout}ms`));
          }, timeout);
        });

        // Race between component import and timeout
        const componentModule = await Promise.race([
          componentImport(),
          timeoutPromise
        ]);

        // Cache successful import
        preloadCache.set(cacheKey, Promise.resolve(componentModule));

        return componentModule;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < retryAttempts) {
          // Exponential backoff for retries
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  };

  // Create the lazy component
  const LazyComponent = React.lazy(enhancedImport);

  // Preload if requested
  if (preload) {
    setImmediate(() => {
      enhancedImport().catch(() => {
        // Silently handle preload failures
      });
    });
  }

  return LazyComponent;
}

/**
 * Higher-order component for lazy loading with enhanced features
 */
export function withLazyLoading<T extends Record<string, unknown>>(
  LazyComponent: LazyExoticComponent<ComponentType<T>>,
  options: LazyLoadOptions = {}
) {
  const {
    fallback: FallbackComponent = DefaultLoadingComponent,
    errorFallback = DefaultErrorFallback,
    loadingMessage,
    loadingSize,
    fullScreen
  } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const WrappedComponent = (props: T) => {
    const LoadingFallback = React.useMemo(() => (
      <FallbackComponent
        message={loadingMessage}
        size={loadingSize}
        fullScreen={fullScreen}
      />
    ), []);

    return (
      <ErrorBoundary
        FallbackComponent={errorFallback}
        onReset={() => window.location.reload()}
        onError={(error) => {
          console.error('Lazy component error:', error);
          // Log to monitoring service
          if (typeof window !== 'undefined' && (window as unknown as { Sentry?: { captureException: (e: Error) => void } }).Sentry) {
            (window as unknown as { Sentry: { captureException: (e: Error) => void } }).Sentry.captureException(error);
          }
        }}
      >
        <Suspense fallback={LoadingFallback}>
          {/* @ts-expect-error - Complex generic prop spreading */}
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };

  const componentName = (LazyComponent as unknown as { displayName?: string }).displayName || 'Component';
  WrappedComponent.displayName = `withLazyLoading(${componentName})`;

  return memo(WrappedComponent) as React.MemoExoticComponent<React.FC<T>>;
}

/**
 * Route-based lazy loading with intersection observer for preloading
 */
export function createRouteComponent<T extends Record<string, unknown> = Record<string, unknown>>(
  componentImport: () => Promise<{ default: ComponentType<T> }>,
  options: LazyLoadOptions & {
    preloadDistance?: number;
    routeName?: string;
  } = {}
) {
  const { preloadDistance = 1000, routeName, ...lazyOptions } = options;

  const LazyComponent = createLazyComponent(componentImport, lazyOptions);

  // Create intersection observer for preloading
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Trigger preload when element comes into view
            componentImport().catch(() => {
              // Silently handle preload failures
            });
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: `${preloadDistance}px`
      }
    );

    // Store observer for potential cleanup
    (LazyComponent as unknown as { __observer: IntersectionObserver }).__observer = observer;
  }

  return withLazyLoading(LazyComponent as LazyExoticComponent<ComponentType<T>>, {
    ...lazyOptions,
    loadingMessage: routeName ? `Loading ${routeName}...` : 'Loading page...',
    fullScreen: true
  });
}

/**
 * Performance monitoring for lazy components
 */
export class LazyComponentPerformanceMonitor {
  private static loadTimes = new Map<string, number>();
  private static loadErrors = new Map<string, number>();

  static startLoading(componentName: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      this.loadTimes.set(componentName, loadTime);

      // Log slow loading components
      if (loadTime > 2000) {
        console.warn(`Slow lazy component load: ${componentName} took ${loadTime.toFixed(2)}ms`);
      }

      // Track in analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'timing_complete', {
          name: 'lazy_component_load',
          value: Math.round(loadTime),
          event_category: 'performance',
          event_label: componentName
        });
      }
    };
  }

  static recordError(componentName: string, error: Error): void {
    const errorCount = this.loadErrors.get(componentName) || 0;
    this.loadErrors.set(componentName, errorCount + 1);

    console.error(`Lazy component error: ${componentName}`, error);

    // Track in error monitoring if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          component: componentName,
          error_type: 'lazy_load_failure'
        }
      });
    }
  }

  static getStats(): {
    loadTimes: Map<string, number>;
    loadErrors: Map<string, number>;
    averageLoadTime: number;
  } {
    const loadTimeValues = Array.from(this.loadTimes.values());
    const averageLoadTime = loadTimeValues.length > 0
      ? loadTimeValues.reduce((sum, time) => sum + time, 0) / loadTimeValues.length
      : 0;

    return {
      loadTimes: new Map(this.loadTimes),
      loadErrors: new Map(this.loadErrors),
      averageLoadTime
    };
  }
}

/**
 * Preload utility for warming up components
 */
export class ComponentPreloader {
  private static preloadQueue: Array<() => Promise<any>> = [];
  private static isProcessing = false;

  static add(componentImport: () => Promise<any>, priority: 'high' | 'normal' | 'low' = 'normal'): void {
    if (priority === 'high') {
      this.preloadQueue.unshift(componentImport);
    } else {
      this.preloadQueue.push(componentImport);
    }

    this.processQueue();
  }

  private static async processQueue(): Promise<void> {
    if (this.isProcessing || this.preloadQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.preloadQueue.length > 0) {
      const componentImport = this.preloadQueue.shift()!;

      try {
        // Only preload if browser is idle
        if ('requestIdleCallback' in window) {
          await new Promise<void>((resolve) => {
            (window as any).requestIdleCallback(() => {
              componentImport().then(() => resolve()).catch(() => resolve());
            });
          });
        } else {
          await componentImport().catch(() => {
            // Silently handle preload failures
          });
        }

        // Small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        // Continue processing even if one preload fails
        console.warn('Component preload failed:', error);
      }
    }

    this.isProcessing = false;
  }

  static preloadByRoute(routes: Array<{ path: string; component: () => Promise<any> }>): void {
    routes.forEach(route => {
      this.add(route.component, 'normal');
    });
  }
}

// Utility functions for common lazy loading patterns
export const LazyUtils = {
  // Create a lazy component for dashboard pages
  createDashboardPage: (componentImport: () => Promise<any>) =>
    createRouteComponent(componentImport, {
      routeName: 'Dashboard',
      preload: true,
      loadingSize: 'large'
    }),

  // Create a lazy component for modal dialogs
  createModalComponent: (componentImport: () => Promise<any>) =>
    createLazyComponent(componentImport, {
      preload: false,
      timeout: 5000,
      retryAttempts: 2
    }),

  // Create a lazy component for charts
  createChartComponent: (componentImport: () => Promise<any>) =>
    createLazyComponent(componentImport, {
      preload: false,
      timeout: 8000,
      retryAttempts: 3
    })
};

export default {
  createLazyComponent,
  withLazyLoading,
  createRouteComponent,
  LazyComponentPerformanceMonitor,
  ComponentPreloader,
  LazyUtils
};