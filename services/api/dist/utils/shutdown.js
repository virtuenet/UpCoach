"use strict";
/**
 * Graceful Shutdown Handler
 * Ensures all services properly clean up resources before exit
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdown = void 0;
exports.onShutdown = onShutdown;
const logger_1 = require("./logger");
const NotificationService_1 = require("../services/NotificationService");
const UnifiedEmailService_1 = require("../services/email/UnifiedEmailService");
const UnifiedCacheService_1 = require("../services/cache/UnifiedCacheService");
class GracefulShutdown {
    handlers = [];
    isShuttingDown = false;
    server;
    /**
     * Register a shutdown handler
     */
    register(name, handler, priority = 50) {
        this.handlers.push({ name, handler, priority });
        // Sort by priority
        this.handlers.sort((a, b) => a.priority - b.priority);
    }
    /**
     * Set the HTTP server for graceful shutdown
     */
    setServer(server) {
        this.server = server;
    }
    /**
     * Initialize shutdown handlers
     */
    initialize() {
        // Register default service handlers
        this.register('HTTP Server', async () => {
            if (this.server) {
                logger_1.logger.info('Closing HTTP server...');
                await new Promise(resolve => {
                    this.server.close(() => {
                        logger_1.logger.info('HTTP server closed');
                        resolve();
                    });
                });
            }
        }, 10);
        this.register('NotificationService', async () => {
            await NotificationService_1.notificationService.shutdown();
        }, 20);
        this.register('EmailService', async () => {
            await UnifiedEmailService_1.emailService.shutdown();
        }, 30);
        this.register('CacheService', async () => {
            const cache = (0, UnifiedCacheService_1.getCacheService)();
            if (cache && typeof cache.disconnect === 'function') {
                logger_1.logger.info('Disconnecting cache service...');
                await cache.disconnect();
            }
        }, 40);
        // Setup signal handlers
        process.on('SIGTERM', () => this.shutdown('SIGTERM'));
        process.on('SIGINT', () => this.shutdown('SIGINT'));
        process.on('SIGUSR2', () => this.shutdown('SIGUSR2')); // For nodemon
        // Handle uncaught errors
        process.on('uncaughtException', error => {
            logger_1.logger.error('Uncaught exception:', error);
            this.shutdown('UNCAUGHT_EXCEPTION', 1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
            // Don't exit on unhandled rejection in development
            if (process.env.NODE_ENV === 'production') {
                this.shutdown('UNHANDLED_REJECTION', 1);
            }
        });
        logger_1.logger.info('Graceful shutdown handlers initialized');
    }
    /**
     * Perform graceful shutdown
     */
    async shutdown(signal, exitCode = 0) {
        if (this.isShuttingDown) {
            logger_1.logger.warn('Shutdown already in progress, ignoring signal:', signal);
            return;
        }
        this.isShuttingDown = true;
        logger_1.logger.info(`Graceful shutdown initiated by ${signal}`);
        // Set a timeout for forced shutdown
        const forceShutdownTimeout = setTimeout(() => {
            logger_1.logger.error('Forced shutdown due to timeout');
            process.exit(exitCode || 1);
        }, 30000); // 30 seconds timeout
        try {
            // Run all shutdown handlers
            for (const { name, handler } of this.handlers) {
                try {
                    logger_1.logger.info(`Running shutdown handler: ${name}`);
                    await Promise.resolve(handler());
                    logger_1.logger.info(`Shutdown handler completed: ${name}`);
                }
                catch (error) {
                    logger_1.logger.error(`Shutdown handler failed: ${name}`, error);
                }
            }
            logger_1.logger.info('All shutdown handlers completed');
        }
        catch (error) {
            logger_1.logger.error('Error during shutdown:', error);
        }
        finally {
            clearTimeout(forceShutdownTimeout);
            // Give a moment for logs to flush
            setTimeout(() => {
                logger_1.logger.info('Exiting process');
                process.exit(exitCode);
            }, 100);
        }
    }
    /**
     * Register a cleanup function that runs on shutdown
     */
    onShutdown(name, handler, priority = 50) {
        this.register(name, handler, priority);
    }
}
// Export singleton instance
exports.gracefulShutdown = new GracefulShutdown();
// Export convenience function
function onShutdown(name, handler, priority = 50) {
    exports.gracefulShutdown.onShutdown(name, handler, priority);
}
//# sourceMappingURL=shutdown.js.map