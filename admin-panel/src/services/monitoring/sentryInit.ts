/**
 * Sentry Frontend Monitoring Initialization - MOCK FOR DEVELOPMENT
 * Error tracking and performance monitoring for Admin Panel
 */

import * as React from 'react';

export interface SentryFrontendConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
  debug?: boolean;
}

/**
 * Mock Sentry Frontend Service for development
 */
export class SentryFrontendService {
  private initialized = false;
  private config?: SentryFrontendConfig;

  /**
   * Initialize Sentry with configuration
   */
  public initialize(config: SentryFrontendConfig): void {
    this.config = config;
    this.initialized = true;
    logger.info('SentryFrontendService initialized (MOCK)', { 
      environment: config.environment,
      dsn: config.dsn.substring(0, 20) + '...'
    });
  }

  /**
   * Check if Sentry is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Create error boundary component
   */
  createErrorBoundary(
    fallback?: React.ComponentType<any>,
    options?: any
  ): React.ComponentType<any> {
    if (!this.initialized) {
      // Return a simple fallback if Sentry is not initialized
      return ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children);
    }

    // Mock error boundary
    return ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children);
  }

  /**
   * Start a transaction (mock)
   */
  startTransaction(context: any): any {
    logger.debug('SentryFrontendService: Mock transaction started', context);
    return {
      finish: () => logger.debug('SentryFrontendService: Mock transaction finished')
    };
  }

  /**
   * Capture exception (mock)
   */
  captureException(exception: Error): string {
    logger.error('SentryFrontendService: Mock exception captured', exception);
    return 'mock-event-id';
  }

  /**
   * Add breadcrumb (mock)
   */
  addBreadcrumb(breadcrumb: any): void {
    logger.debug('SentryFrontendService: Mock breadcrumb added', breadcrumb);
  }

  /**
   * Set user context (mock)
   */
  setUser(user: any): void {
    logger.debug('SentryFrontendService: Mock user context set', user);
  }

  /**
   * Set tag (mock)
   */
  setTag(key: string, value: string): void {
    logger.debug('SentryFrontendService: Mock tag set', { key, value });
  }

  /**
   * Set context (mock)
   */
  setContext(name: string, context: any): void {
    logger.debug('SentryFrontendService: Mock context set', { name, context });
  }
}

// Create and export singleton instance
export const sentryFrontendService = new SentryFrontendService();

// Export default
export default sentryFrontendService;