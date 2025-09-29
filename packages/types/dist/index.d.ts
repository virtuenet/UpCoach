/**
 * @upcoach/types
 * Shared TypeScript type definitions
 */
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'coach' | 'admin' | 'superadmin';
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    emailVerified: boolean;
    avatar?: string;
    bio?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface AuthResponse {
    success: boolean;
    user?: User;
    token?: string;
    refreshToken?: string;
    expiresIn?: number;
    error?: string;
}
export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}
export interface RegisterData {
    email: string;
    password: string;
    name: string;
    role?: 'user' | 'coach';
}
export type ContentType = 'article' | 'guide' | 'exercise' | 'lesson' | 'tip' | 'course' | 'template' | 'page' | 'faq' | 'announcement';
export type ContentStatus = 'draft' | 'published' | 'scheduled' | 'archived' | 'review' | 'expired';
export interface Content {
    id: string;
    type: ContentType;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    status: ContentStatus;
    authorId: string;
    categoryId?: string;
    tags?: string[];
    featuredImageUrl?: string;
    publishedAt?: Date;
    viewCount: number;
    likeCount: number;
    isPremium: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Subscription {
    id: string;
    userId: string;
    planId: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAt?: Date;
    canceledAt?: Date;
    trialStart?: Date;
    trialEnd?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface Transaction {
    id: string;
    userId: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    status: string;
    type: string;
    description?: string;
    createdAt: Date;
}
export interface Goal {
    id: string;
    userId: string;
    title: string;
    description?: string;
    targetDate?: Date;
    category: string;
    status: 'active' | 'completed' | 'paused' | 'abandoned';
    progress: number;
    milestones?: Milestone[];
    createdAt: Date;
    updatedAt: Date;
}
export interface Milestone {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: Date;
    dueDate?: Date;
}
export interface Task {
    id: string;
    userId: string;
    goalId?: string;
    title: string;
    description?: string;
    dueDate?: Date;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed' | 'canceled';
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ChatMessage {
    id: string;
    conversationId: string;
    userId: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    metadata?: Record<string, any>;
    createdAt: Date;
}
export interface Conversation {
    id: string;
    userId: string;
    title?: string;
    lastMessageAt: Date;
    messageCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface AnalyticsEvent {
    id: string;
    userId?: string;
    sessionId?: string;
    eventName: string;
    eventCategory?: string;
    eventProperties?: Record<string, any>;
    timestamp: Date;
}
export interface FinancialSnapshot {
    id: string;
    date: Date;
    revenue: number;
    mrr: number;
    arr: number;
    activeSubscriptions: number;
    churnRate: number;
    newUsers: number;
    totalUsers: number;
}
export { ApiResponse, ApiMeta, ApiError, ValidationError, PaginationParams, BatchRequest, BatchOperation, BatchResponse, BatchResult, WebSocketMessage, FileUpload, FileResponse } from './api';
//# sourceMappingURL=index.d.ts.map