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
    showSuccess(userId: string, message: string, action?: () => void): Promise<void>;
    showError(userId: string, error: UserFriendlyError): Promise<void>;
    showProgress(operationId: string, operation: string, progress: number, message?: string): Promise<void>;
    getProgress(operationId: string): Promise<ProgressNotification | null>;
    updateProgress(operationId: string, progress: number, estimatedTimeRemaining?: number): Promise<void>;
    showWarning(userId: string, message: string, actions?: NotificationAction[]): Promise<void>;
    showInfo(userId: string, message: string, persistent?: boolean): Promise<void>;
    private send;
    private sendEmailNotification;
    private getUserEmail;
    getRecentNotifications(_userId: string, _limit?: number): Promise<NotificationOptions[]>;
    clearNotifications(userId: string): Promise<void>;
    private setupCleanup;
    shutdown(): void;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=NotificationService.d.ts.map