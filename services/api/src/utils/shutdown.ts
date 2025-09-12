/**
 * Graceful Shutdown Handler
 * Ensures all services properly clean up resources before exit
 */

import { Server } from 'http';

import { getCacheService } from '../services/cache/UnifiedCacheService';
import { emailService } from '../services/email/UnifiedEmailService';
import { notificationService } from '../services/NotificationService';

import { logger } from './logger';


interface ShutdownHandler {
  name: string;
  handler: () => Promise<void> | void;
  priority: number; // Lower priority runs first
}

class GracefulShutdown {
  private handlers: ShutdownHandler[] = [];
  private isShuttingDown = false;
  private server?: Server;

  /**
   * Register a shutdown handler
   */
  register(name: string, handler: () => Promise<void> | void, priority = 50): void {
    this.handlers.push({ name, handler, priority });
    // Sort by priority
    this.handlers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Set the HTTP server for graceful shutdown
   */
  setServer(server: Server): void {
    this.server = server;
  }

  /**
   * Initialize shutdown handlers
   */
  initialize(): void {
    // Register default service handlers
    this.register(
      'HTTP Server',
      async () => {
        if (this.server) {
          logger.info('Closing HTTP server...');
          await new Promise<void>(resolve => {
            this.server!.close(() => {
              logger.info('HTTP server closed');
              resolve();
            });
          });
        }
      },
      10
    );

    this.register(
      'NotificationService',
      async () => {
        await notificationService.shutdown();
      },
      20
    );

    this.register(
      'EmailService',
      async () => {
        await emailService.shutdown();
      },
      30
    );

    this.register(
      'CacheService',
      async () => {
        const cache = getCacheService();
        if (cache && typeof cache.disconnect === 'function') {
          logger.info('Disconnecting cache service...');
          await cache.disconnect();
        }
      },
      40
    );

    // Setup signal handlers
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGUSR2', () => this.shutdown('SIGUSR2')); // For nodemon

    // Handle uncaught errors
    process.on('uncaughtException', error => {
      logger.error('Uncaught exception:', error);
      this.shutdown('UNCAUGHT_EXCEPTION', 1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      // Don't exit on unhandled rejection in development
      if (process.env.NODE_ENV === 'production') {
        this.shutdown('UNHANDLED_REJECTION', 1);
      }
    });

    logger.info('Graceful shutdown handlers initialized');
  }

  /**
   * Perform graceful shutdown
   */
  async shutdown(signal: string, exitCode = 0): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress, ignoring signal:', signal);
      return;
    }

    this.isShuttingDown = true;
    logger.info(`Graceful shutdown initiated by ${signal}`);

    // Set a timeout for forced shutdown
    const forceShutdownTimeout = setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(exitCode || 1);
    }, 30000); // 30 seconds timeout

    try {
      // Run all shutdown handlers
      for (const { name, handler } of this.handlers) {
        try {
          logger.info(`Running shutdown handler: ${name}`);
          await Promise.resolve(handler());
          logger.info(`Shutdown handler completed: ${name}`);
        } catch (error) {
          logger.error(`Shutdown handler failed: ${name}`, error);
        }
      }

      logger.info('All shutdown handlers completed');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    } finally {
      clearTimeout(forceShutdownTimeout);

      // Give a moment for logs to flush
      setTimeout(() => {
        logger.info('Exiting process');
        process.exit(exitCode);
      }, 100);
    }
  }

  /**
   * Register a cleanup function that runs on shutdown
   */
  onShutdown(name: string, handler: () => Promise<void> | void, priority = 50): void {
    this.register(name, handler, priority);
  }
}

// Export singleton instance
export const gracefulShutdown = new GracefulShutdown();

// Export convenience function
export function onShutdown(name: string, handler: () => Promise<void> | void, priority = 50): void {
  gracefulShutdown.onShutdown(name, handler, priority);
}
