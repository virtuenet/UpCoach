/**
 * @upcoach/types
 * Shared TypeScript type definitions
 */

// User types
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

// Auth types
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

// Content types
export type ContentType =
  | 'article'
  | 'guide'
  | 'exercise'
  | 'lesson'
  | 'tip'
  | 'course'
  | 'template'
  | 'page'
  | 'faq'
  | 'announcement';

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

// Subscription types
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

// Transaction types
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

// Goal types
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

// Task types
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

// Chat types
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

// Analytics types
export interface AnalyticsEvent {
  id: string;
  userId?: string;
  sessionId?: string;
  eventName: string;
  eventCategory?: string;
  eventProperties?: Record<string, any>;
  timestamp: Date;
}

// Financial types
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

// API types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

// Export all API types from shared
export * from '../../shared/types/api';
