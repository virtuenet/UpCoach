/**
 * API type definitions for admin panel
 */

// Base API types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// Query parameters
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams extends PaginationParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  tags?: string[];
}

// Common model types
export interface TimestampedModel {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface IdentifiableModel {
  id: string;
}

// Dashboard types
export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  conversionRate: number;
  churnRate: number;
}

export interface ChartData {
  label: string;
  value: number;
  date?: string;
  category?: string;
}

// Financial types
export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: 'payment' | 'refund' | 'subscription' | 'adjustment';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  userId: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  amount: number;
  interval: 'monthly' | 'yearly';
}

// Content types
export interface Content {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  authorId: string;
  categoryId?: string;
  tags?: string[];
  featuredImage?: string;
  publishedAt?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  dueDate?: string;
  completedAt?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Goal types
export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  deadline?: string;
  userId: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  metadata?: any;
  readAt?: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  readAt?: string;
  createdAt: string;
}
