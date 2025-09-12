"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdown = void 0;
exports.onShutdown = onShutdown;
const UnifiedCacheService_1 = require("../services/cache/UnifiedCacheService");
const UnifiedEmailService_1 = require("../services/email/UnifiedEmailService");
const NotificationService_1 = require("../services/NotificationService");
const logger_1 = require("./logger");
class GracefulShutdown {
    handlers = [];
    isShuttingDown = false;
    server;
    register(name, handler, priority = 50) {
        this.handlers.push({ name, handler, priority });
        this.handlers.sort((a, b) => a.priority - b.priority);
    }
    setServer(server) {
        this.server = server;
    }
    initialize() {
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
        process.on('SIGTERM', () => this.shutdown('SIGTERM'));
        process.on('SIGINT', () => this.shutdown('SIGINT'));
        process.on('SIGUSR2', () => this.shutdown('SIGUSR2'));
        process.on('uncaughtException', error => {
            logger_1.logger.error('Uncaught exception:', error);
            this.shutdown('UNCAUGHT_EXCEPTION', 1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
            if (process.env.NODE_ENV === 'production') {
                this.shutdown('UNHANDLED_REJECTION', 1);
            }
        });
        logger_1.logger.info('Graceful shutdown handlers initialized');
    }
    async shutdown(signal, exitCode = 0) {
        if (this.isShuttingDown) {
            logger_1.logger.warn('Shutdown already in progress, ignoring signal:', signal);
            return;
        }
        this.isShuttingDown = true;
        logger_1.logger.info(`Graceful shutdown initiated by ${signal}`);
        const forceShutdownTimeout = setTimeout(() => {
            logger_1.logger.error('Forced shutdown due to timeout');
            process.exit(exitCode || 1);
        }, 30000);
        try {
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
            setTimeout(() => {
                logger_1.logger.info('Exiting process');
                process.exit(exitCode);
            }, 100);
        }
    }
    onShutdown(name, handler, priority = 50) {
        this.register(name, handler, priority);
    }
}
exports.gracefulShutdown = new GracefulShutdown();
function onShutdown(name, handler, priority = 50) {
    exports.gracefulShutdown.onShutdown(name, handler, priority);
}
//# sourceMappingURL=shutdown.js.map