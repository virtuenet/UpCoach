/**
 * Common type definitions shared across the backend
 */
export interface BaseUser {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'coach' | 'admin';
    avatar?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}
export interface AuthUser extends BaseUser {
    passwordHash?: string;
    googleId?: string;
    isActive: boolean;
    lastLoginAt?: Date | string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    code?: string;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface PaginationQuery {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface FilterQuery extends PaginationQuery {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}
export interface TimestampedModel {
    createdAt: Date | string;
    updatedAt: Date | string;
    deletedAt?: Date | string | null;
}
export interface IdentifiableModel {
    id: string | number;
}
export interface SessionData {
    userId: string;
    email: string;
    role: string;
    expiresAt: Date | string;
}
export interface ErrorDetails {
    field?: string;
    message: string;
    code?: string;
}
export interface ValidationError {
    errors: ErrorDetails[];
}
export interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer?: Buffer;
}
export interface NotificationPayload {
    userId: string;
    type: 'email' | 'push' | 'sms' | 'in-app';
    title: string;
    message: string;
    data?: Record<string, any>;
    scheduledAt?: Date | string;
}
export interface AnalyticsEvent {
    userId?: string;
    eventName: string;
    eventData?: Record<string, any>;
    timestamp: Date | string;
    sessionId?: string;
    metadata?: Record<string, any>;
}
export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    interval: 'monthly' | 'yearly';
    features: string[];
    limits?: Record<string, number>;
}
export declare function isApiResponse<T>(obj: any): obj is ApiResponse<T>;
export declare function isPaginatedResponse<T>(obj: any): obj is PaginatedResponse<T>;
export declare function hasTimestamps(obj: any): obj is TimestampedModel;
//# sourceMappingURL=common.d.ts.map