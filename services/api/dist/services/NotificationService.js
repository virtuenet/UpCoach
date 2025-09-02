"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
const UnifiedEmailService_1 = __importDefault(require("./email/UnifiedEmailService"));
const UnifiedCacheService_1 = require("./cache/UnifiedCacheService");
class NotificationService extends events_1.EventEmitter {
    static instance;
    progressTrackers = new Map();
    cache = (0, UnifiedCacheService_1.getCacheService)();
    cleanupInterval;
    constructor() {
        super();
        this.setupCleanup();
    }
    static getInstance() {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }
    /**
     * Show a success notification
     */
    async showSuccess(userId, message, action) {
        const notification = {
            userId,
            type: 'success',
            title: 'Success',
            message,
            duration: 5000,
        };
        if (action) {
            notification.actions = [{ label: 'View', action: 'view', primary: true }];
        }
        await this.send(notification);
    }
    /**
     * Show an error notification with retry option
     */
    async showError(userId, error) {
        const notification = {
            userId,
            type: 'error',
            title: 'Action Required',
            message: error.userMessage,
            actions: [],
            persistent: !error.retryable,
        };
        // Add retry action if retryable
        if (error.retryable) {
            notification.actions.push({
                label: 'Retry',
                action: 'retry',
                primary: true,
                icon: 'refresh',
            });
        }
        // Add help action if help URL is available
        if (error.helpUrl) {
            notification.actions.push({
                label: 'Get Help',
                action: 'help',
                icon: 'help',
            });
        }
        // Always add dismiss action
        notification.actions.push({
            label: 'Dismiss',
            action: 'dismiss',
            icon: 'close',
        });
        await this.send(notification);
    }
    /**
     * Show a progress notification
     */
    async showProgress(operationId, operation, progress, message) {
        const progressNotification = {
            operationId,
            operation,
            progress: Math.min(100, Math.max(0, progress)),
            message: message || `${operation}: ${progress}% complete`,
            status: progress === 100 ? 'completed' : 'in_progress',
        };
        // Store progress tracker
        this.progressTrackers.set(operationId, progressNotification);
        // Emit progress event
        this.emit('progress', progressNotification);
        // Store in cache for retrieval
        await this.cache.set(`progress:${operationId}`, progressNotification, { ttl: 300 } // 5 minutes TTL
        );
        // Clean up completed operations after delay
        if (progress === 100) {
            setTimeout(() => {
                this.progressTrackers.delete(operationId);
            }, 30000); // 30 seconds
        }
    }
    /**
     * Get progress for an operation
     */
    async getProgress(operationId) {
        // Check memory first
        if (this.progressTrackers.has(operationId)) {
            return this.progressTrackers.get(operationId);
        }
        // Check cache
        const cached = await this.cache.get(`progress:${operationId}`);
        return cached;
    }
    /**
     * Update progress with estimated time
     */
    async updateProgress(operationId, progress, estimatedTimeRemaining) {
        const existing = await this.getProgress(operationId);
        if (existing) {
            existing.progress = progress;
            existing.status = progress === 100 ? 'completed' : 'in_progress';
            if (estimatedTimeRemaining !== undefined) {
                existing.estimatedTimeRemaining = estimatedTimeRemaining;
            }
            await this.showProgress(operationId, existing.operation, progress, existing.message);
        }
    }
    /**
     * Show a warning notification
     */
    async showWarning(userId, message, actions) {
        await this.send({
            userId,
            type: 'warning',
            title: 'Warning',
            message,
            actions,
            duration: 8000,
        });
    }
    /**
     * Show an info notification
     */
    async showInfo(userId, message, persistent = false) {
        await this.send({
            userId,
            type: 'info',
            title: 'Information',
            message,
            persistent,
            duration: persistent ? undefined : 5000,
        });
    }
    /**
     * Send notification through available channels
     */
    async send(notification) {
        try {
            // Emit to WebSocket subscribers
            this.emit('notification', notification);
            // Store in cache for polling clients
            const key = `notification:${notification.userId}:${Date.now()}`;
            await this.cache.set(key, notification, { ttl: 300 }); // 5 minutes TTL
            // Log notification
            logger_1.logger.info('Notification sent', {
                userId: notification.userId,
                type: notification.type,
                title: notification.title,
            });
            // For critical errors, also send email
            if (notification.type === 'error' && notification.persistent) {
                await this.sendEmailNotification(notification);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send notification', error);
        }
    }
    /**
     * Send email notification for critical issues
     */
    async sendEmailNotification(notification) {
        try {
            // Get user email from cache or database
            const userEmail = await this.getUserEmail(notification.userId);
            if (!userEmail)
                return;
            await UnifiedEmailService_1.default.send({
                to: userEmail,
                subject: `[${notification.type.toUpperCase()}] ${notification.title}`,
                template: 'notification',
                data: {
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    actions: notification.actions,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to send email notification', error);
        }
    }
    /**
     * Get user email (placeholder - implement with actual user service)
     */
    async getUserEmail(userId) {
        // TODO: Implement actual user email lookup
        const cached = await this.cache.get(`user:email:${userId}`);
        return cached;
    }
    /**
     * Get recent notifications for a user
     */
    async getRecentNotifications(_userId, _limit = 10) {
        // For now, return empty array as cache.keys is not implemented
        // TODO: Implement when cache service supports key pattern search
        return [];
    }
    /**
     * Clear notifications for a user
     */
    async clearNotifications(userId) {
        // TODO: Implement when cache service supports key pattern deletion
        logger_1.logger.info(`Clearing notifications for user ${userId}`);
    }
    /**
     * Setup cleanup interval
     */
    setupCleanup() {
        this.cleanupInterval = setInterval(() => {
            // Clean up old progress trackers
            for (const [id, progress] of this.progressTrackers) {
                if (progress.status === 'completed') {
                    this.progressTrackers.delete(id);
                }
            }
        }, 60000); // Every minute
    }
    /**
     * Gracefully shutdown the service
     */
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
        // Clear all listeners
        this.removeAllListeners();
        // Clear progress trackers
        this.progressTrackers.clear();
        logger_1.logger.info('NotificationService shutdown complete');
    }
}
exports.NotificationService = NotificationService;
// Export singleton instance
exports.notificationService = NotificationService.getInstance();
//# sourceMappingURL=NotificationService.js.map