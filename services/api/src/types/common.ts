/**
 * Common type definitions shared across the backend
 */

// User-related types
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

// API Response types
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

// Request types
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

// Database types
export interface TimestampedModel {
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

export interface IdentifiableModel {
  id: string | number;
}

// Session types
export interface SessionData {
  userId: string;
  email: string;
  role: string;
  expiresAt: Date | string;
}

// Error types
export interface ErrorDetails {
  field?: string;
  message: string;
  code?: string;
}

export interface ValidationError {
  errors: ErrorDetails[];
}

// File upload types
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

// Notification types
export interface NotificationPayload {
  userId: string;
  type: 'email' | 'push' | 'sms' | 'in-app';
  title: string;
  message: string;
  data?: Record<string, any>;
  scheduledAt?: Date | string;
}

// Analytics types
export interface AnalyticsEvent {
  userId?: string;
  eventName: string;
  eventData?: Record<string, any>;
  timestamp: Date | string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// Subscription types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits?: Record<string, number>;
}

// Export type guards
export function isApiResponse<T>(obj: unknown): obj is ApiResponse<T> {
  return typeof obj === 'object' && 'success' in obj;
}

export function isPaginatedResponse<T>(obj: unknown): obj is PaginatedResponse<T> {
  return typeof obj === 'object' && 'items' in obj && 'total' in obj;
}

export function hasTimestamps(obj: unknown): obj is TimestampedModel {
  return typeof obj === 'object' && 'createdAt' in obj && 'updatedAt' in obj;
}
