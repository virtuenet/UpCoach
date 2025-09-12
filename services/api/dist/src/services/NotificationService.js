"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
const UnifiedCacheService_1 = require("./cache/UnifiedCacheService");
const UnifiedEmailService_1 = __importDefault(require("./email/UnifiedEmailService"));
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
    async showError(userId, error) {
        const notification = {
            userId,
            type: 'error',
            title: 'Action Required',
            message: error.userMessage,
            actions: [],
            persistent: !error.retryable,
        };
        if (error.retryable) {
            notification.actions.push({
                label: 'Retry',
                action: 'retry',
                primary: true,
                icon: 'refresh',
            });
        }
        if (error.helpUrl) {
            notification.actions.push({
                label: 'Get Help',
                action: 'help',
                icon: 'help',
            });
        }
        notification.actions.push({
            label: 'Dismiss',
            action: 'dismiss',
            icon: 'close',
        });
        await this.send(notification);
    }
    async showProgress(operationId, operation, progress, message) {
        const progressNotification = {
            operationId,
            operation,
            progress: Math.min(100, Math.max(0, progress)),
            message: message || `${operation}: ${progress}% complete`,
            status: progress === 100 ? 'completed' : 'in_progress',
        };
        this.progressTrackers.set(operationId, progressNotification);
        this.emit('progress', progressNotification);
        await this.cache.set(`progress:${operationId}`, progressNotification, { ttl: 300 });
        if (progress === 100) {
            setTimeout(() => {
                this.progressTrackers.delete(operationId);
            }, 30000);
        }
    }
    async getProgress(operationId) {
        if (this.progressTrackers.has(operationId)) {
            return this.progressTrackers.get(operationId);
        }
        const cached = await this.cache.get(`progress:${operationId}`);
        return cached;
    }
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
    async send(notification) {
        try {
            this.emit('notification', notification);
            const key = `notification:${notification.userId}:${Date.now()}`;
            await this.cache.set(key, notification, { ttl: 300 });
            logger_1.logger.info('Notification sent', {
                userId: notification.userId,
                type: notification.type,
                title: notification.title,
            });
            if (notification.type === 'error' && notification.persistent) {
                await this.sendEmailNotification(notification);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send notification', error);
        }
    }
    async sendEmailNotification(notification) {
        try {
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
    async getUserEmail(userId) {
        const cached = await this.cache.get(`user:email:${userId}`);
        return cached;
    }
    async getRecentNotifications(_userId, _limit = 10) {
        return [];
    }
    async clearNotifications(userId) {
        logger_1.logger.info(`Clearing notifications for user ${userId}`);
    }
    setupCleanup() {
        this.cleanupInterval = setInterval(() => {
            for (const [id, progress] of this.progressTrackers) {
                if (progress.status === 'completed') {
                    this.progressTrackers.delete(id);
                }
            }
        }, 60000);
    }
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
        this.removeAllListeners();
        this.progressTrackers.clear();
        logger_1.logger.info('NotificationService shutdown complete');
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = NotificationService.getInstance();
//# sourceMappingURL=NotificationService.js.map