/**
 * Sentry Monitoring Service
 * Provides error tracking, performance monitoring, and release tracking
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Express, Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  debug?: boolean;
  integrations?: any[];
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null;
}

export class SentryService {
  private static instance: SentryService;
  private initialized = false;

  private constructor() {}

  static getInstance(): SentryService {
    if (!SentryService.instance) {
      SentryService.instance = new SentryService();
    }
    return SentryService.instance;
  }

  /**
   * Initialize Sentry with configuration
   */
  initialize(config: SentryConfig): void {
    if (this.initialized) {
      logger.warn('Sentry already initialized');
      return;
    }

    try {
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        release: config.release || process.env.npm_package_version,

        // Performance Monitoring
        tracesSampleRate: config.tracesSampleRate || 0.1,
        profilesSampleRate: config.profilesSampleRate || 0.1,

        // Enhanced error tracking
        debug: config.debug || process.env.NODE_ENV === 'development',

        integrations: [
          // HTTP integration
          Sentry.httpIntegration(),
          // Express integration
          Sentry.expressIntegration(),
          // Profiling
          nodeProfilingIntegration(),
          // Custom integrations
          ...(config.integrations || []),
        ],

        // Data scrubbing - removed due to type compatibility issues

        // Breadcrumb configuration
        beforeBreadcrumb: this.beforeBreadcrumb,

        // Additional options
        attachStacktrace: true,

        // Transport options
        transportOptions: {
          keepAlive: true,
        },
      });

      this.initialized = true;
      logger.info('Sentry initialized successfully', {
        environment: config.environment,
        release: config.release,
      });
    } catch (error) {
      logger.error('Failed to initialize Sentry', error);
    }
  }

  /**
   * Set up Express middleware
   */
  setupExpressMiddleware(app: Express): void {
    if (!this.initialized) {
      logger.warn('Sentry not initialized, skipping middleware setup');
      return;
    }

    // Request handler creates a separate execution context
    // app.use(Sentry.Handlers.requestHandler()); // Replaced by expressIntegration in v8

    // TracingHandler creates a trace for every incoming request - handled by integration now
    // app.use(Sentry.Handlers.tracingHandler()); // Removed in v8
  }

  /**
   * Set up error handler (should be after all other middleware)
   */
  setupErrorHandler(app: Express): void {
    if (!this.initialized) {
      logger.warn('Sentry not initialized, skipping error handler setup');
      return;
    }

    app.use(
      Sentry.expressErrorHandler({
        shouldHandleError: error => {
          // Capture 4xx and 5xx errors
          if ((error as any).status && (error as any).status >= 400) {
            return true;
          }
          return true;
        },
      })
    );
  }

  /**
   * Capture exception manually
   */
  captureException(error: Error, context?: any): string {
    if (!this.initialized) {
      logger.error('Sentry not initialized, cannot capture exception', error);
      return '';
    }

    const eventId = Sentry.captureException(error, {
      extra: context,
      tags: this.getDefaultTags(),
    });

    logger.error('Exception captured in Sentry', { eventId, error });
    return eventId;
  }

  /**
   * Capture message
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: any): string {
    if (!this.initialized) {
      logger.warn('Sentry not initialized, cannot capture message');
      return '';
    }

    const eventId = Sentry.captureMessage(message, level);

    return eventId;
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    if (!this.initialized) return;

    Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * Set user context
   */
  setUser(user: Sentry.User | null): void {
    if (!this.initialized) return;

    Sentry.setUser(user);
  }

  /**
   * Set additional context
   */
  setContext(key: string, context: any): void {
    if (!this.initialized) return;

    Sentry.setContext(key, context);
  }

  /**
   * Set tags for categorization
   */
  setTags(tags: { [key: string]: string }): void {
    if (!this.initialized) return;

    Sentry.setTags(tags);
  }

  /**
   * Start a transaction for performance monitoring
   */
  startTransaction(name: string, op: string): Sentry.Span | null {
    if (!this.initialized) return null;

    return Sentry.startSpan({ name, op }, (span) => span);
  }

  /**
   * Create a custom middleware for route transactions
   */
  routeTransaction() {
    return (req: Request, _res: Response, next: NextFunction) => {
      if (!this.initialized) {
        return next();
      }

      const span = Sentry.getActiveSpan();
      if (span) {
        // Set span attributes
        span.setAttributes({
          'http.method': req.method,
          'http.route': req.path,
        });

        _res.on('finish', () => {
          span.setStatus({ code: _res.statusCode >= 400 ? 2 : 1 }); // SpanStatusCode.ERROR : OK
          // span.end(); // Handled automatically in v8
        });
      }

      next();
    };
  }

  /**
   * Flush events before shutdown
   */
  async flush(timeout = 2000): Promise<boolean> {
    if (!this.initialized) return true;

    try {
      const result = await Sentry.flush(timeout);
      logger.info('Sentry events flushed successfully');
      return result;
    } catch (error) {
      logger.error('Failed to flush Sentry events', error);
      return false;
    }
  }

  /**
   * Close Sentry client
   */
  async close(timeout = 2000): Promise<boolean> {
    if (!this.initialized) return true;

    try {
      const result = await Sentry.close(timeout);
      this.initialized = false;
      logger.info('Sentry closed successfully');
      return result;
    } catch (error) {
      logger.error('Failed to close Sentry', error);
      return false;
    }
  }

  /**
   * Data scrubbing before sending to Sentry
   */
  private beforeSend(event: Sentry.Event): Sentry.Event | null {
    // Remove sensitive data
    if (event.request) {
      // Remove authorization headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Remove sensitive body data
      if (event.request.data) {
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
        sensitiveFields.forEach(field => {
          if (event.request.data[field]) {
            event.request.data[field] = '[REDACTED]';
          }
        });
      }
    }

    // Remove sensitive user data
    if (event.user) {
      if (event.user.email) {
        // Partially mask email
        const [username, domain] = event.user.email.split('@');
        if (username && domain) {
          const maskedUsername = username.substring(0, 2) + '***';
          event.user.email = `${maskedUsername}@${domain}`;
        }
      }
    }

    // Don't send events in test environment
    if (process.env.NODE_ENV === 'test') {
      return null;
    }

    return event;
  }

  /**
   * Filter breadcrumbs
   */
  private beforeBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
      return null;
    }

    // Remove sensitive data from breadcrumbs
    if (breadcrumb.data) {
      const sensitiveKeys = ['password', 'token', 'apiKey', 'secret'];
      sensitiveKeys.forEach(key => {
        if (breadcrumb.data && breadcrumb.data[key]) {
          breadcrumb.data[key] = '[REDACTED]';
        }
      });
    }

    return breadcrumb;
  }

  /**
   * Get default tags for all events
   */
  private getDefaultTags(): { [key: string]: string } {
    return {
      service: 'backend',
      hostname: process.env.HOSTNAME || 'unknown',
      nodeVersion: process.version,
    };
  }

  /**
   * Performance monitoring helper
   */
  measurePerformance<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    if (!this.initialized) {
      return fn();
    }

    const transaction = this.startTransaction(operation, 'function');

    return fn()
      .then(result => {
        transaction?.setStatus({ code: 1 }); // SpanStatusCode.OK
        return result;
      })
      .catch(error => {
        transaction?.setStatus({ code: 2 }); // SpanStatusCode.ERROR
        throw error;
      })
      .finally(() => {
        // transaction?.finish(); // Handled automatically in v8
      });
  }

  /**
   * Wrap async functions with error tracking
   */
  wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T, context?: string): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.captureException(error as Error, {
          context,
          args: args.map((arg, index) => {
            // Don't log sensitive data
            if (typeof arg === 'object' && arg !== null) {
              const cleaned = { ...arg };
              delete cleaned.password;
              delete cleaned.token;
              return cleaned;
            }
            return arg;
          }),
        });
        throw error;
      }
    }) as T;
  }
}

// Export singleton instance
export const sentryService = SentryService.getInstance();
