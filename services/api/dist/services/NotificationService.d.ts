import { EventEmitter } from 'events';
import { UserFriendlyError } from '../utils/errorHandler';
export interface NotificationOptions {
    userId: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'progress';
    title: string;
    message: string;
    actions?: NotificationAction[];
    persistent?: boolean;
    duration?: number;
    metadata?: Record<string, any>;
}
export interface NotificationAction {
    label: string;
    action: string;
    primary?: boolean;
    icon?: string;
}
export interface ProgressNotification {
    operationId: string;
    operation: string;
    progress: number;
    message: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    estimatedTimeRemaining?: number;
}
export declare class NotificationService extends EventEmitter {
    private static instance;
    private progressTrackers;
    private cache;
    private cleanupInterval?;
    private constructor();
    static getInstance(): NotificationService;
    /**
     * Show a success notification
     */
    showSuccess(userId: string, message: string, action?: () => void): Promise<void>;
    /**
     * Show an error notification with retry option
     */
    showError(userId: string, error: UserFriendlyError): Promise<void>;
    /**
     * Show a progress notification
     */
    showProgress(operationId: string, operation: string, progress: number, message?: string): Promise<void>;
    /**
     * Get progress for an operation
     */
    getProgress(operationId: string): Promise<ProgressNotification | null>;
    /**
     * Update progress with estimated time
     */
    updateProgress(operationId: string, progress: number, estimatedTimeRemaining?: number): Promise<void>;
    /**
     * Show a warning notification
     */
    showWarning(userId: string, message: string, actions?: NotificationAction[]): Promise<void>;
    /**
     * Show an info notification
     */
    showInfo(userId: string, message: string, persistent?: boolean): Promise<void>;
    /**
     * Send notification through available channels
     */
    private send;
    /**
     * Send email notification for critical issues
     */
    private sendEmailNotification;
    /**
     * Get user email (placeholder - implement with actual user service)
     */
    private getUserEmail;
    /**
     * Get recent notifications for a user
     */
    getRecentNotifications(_userId: string, _limit?: number): Promise<NotificationOptions[]>;
    /**
     * Clear notifications for a user
     */
    clearNotifications(userId: string): Promise<void>;
    /**
     * Setup cleanup interval
     */
    private setupCleanup;
    /**
     * Gracefully shutdown the service
     */
    shutdown(): void;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=NotificationService.d.ts.map