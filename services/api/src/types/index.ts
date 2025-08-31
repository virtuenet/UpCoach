/**
 * Core TypeScript type definitions for the UpCoach backend
 * This file consolidates all common types to replace 'any' usage
 */

import { Request } from 'express';
import { Model } from 'sequelize';

// ============================================
// Authentication & User Types
// ============================================

export type UserRole = 'admin' | 'coach' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
  };
  userId?: string;
  nonce?: string;
  organization?: Organization;
  organizationRole?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: ErrorDetails;
  timestamp?: string;
  path?: string;
  requestId?: string;
  stack?: string;
}

export interface ErrorDetails {
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
    value?: unknown;
  }>;
  fields?: string[];
  validation?: Record<string, string>;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================
// Database & Model Types
// ============================================

export interface SequelizeError extends Error {
  errors?: Array<{
    path: string;
    message: string;
    value: unknown;
    type?: string;
  }>;
  fields?: Record<string, unknown>;
  sql?: string;
  parent?: Error;
}

export interface ModelWithId extends Model {
  id: number;
}

export interface TimestampedModel {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ============================================
// Pagination Types
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ============================================
// Coach & Session Types
// ============================================

export interface CoachProfile {
  id: number;
  userId: number;
  displayName: string;
  bio: string;
  specializations: string[];
  hourlyRate: number;
  rating: number;
  totalSessions: number;
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
}

export interface CoachSession {
  id: number;
  coachId: number;
  clientId: number;
  sessionType: SessionType;
  scheduledAt: Date;
  durationMinutes: number;
  status: SessionStatus;
  title: string;
  description?: string;
  price: number;
  meetingLink?: string;
  notes?: string;
}

export type SessionType = 'video' | 'audio' | 'chat' | 'in-person';
export type SessionStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';

// ============================================
// Organization Types
// ============================================

export interface Organization {
  id: number;
  name: string;
  domain: string;
  settings: OrganizationSettings;
  role?: string;
}

export interface OrganizationSettings {
  allowedDomains?: string[];
  maxUsers?: number;
  features?: string[];
  customization?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

// ============================================
// Analytics & Events Types
// ============================================

export interface TrackingEvent {
  userId?: number;
  anonymousId?: string;
  event: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
  context?: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    page?: string;
  };
}

export interface AnalyticsMetrics {
  totalEvents: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  topEvents: Array<{
    event: string;
    count: number;
  }>;
}

// ============================================
// Payment & Subscription Types
// ============================================

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
  livemode: boolean;
}

export interface Subscription {
  id: number;
  userId: number;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  planId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'unpaid';

// ============================================
// Content & CMS Types
// ============================================

export interface Content {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  type: ContentType;
  status: ContentStatus;
  authorId: number;
  categoryId?: number;
  tags?: string[];
  metadata?: ContentMetadata;
  publishedAt?: Date;
  viewCount: number;
  likeCount: number;
  shareCount: number;
}

export type ContentType = 'article' | 'video' | 'podcast' | 'course' | 'resource';
export type ContentStatus = 'draft' | 'published' | 'archived' | 'scheduled';

export interface ContentMetadata {
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  keywords?: string[];
  readingTime?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

// ============================================
// AI & Machine Learning Types
// ============================================

export interface AIRequest {
  userId: number;
  prompt: string;
  context?: Record<string, unknown>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  id: string;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
}

export interface UserProfile {
  userId: number;
  learningStyle: LearningStyle;
  communicationPreference: CommunicationPreference;
  personalityType?: string;
  preferences: Record<string, unknown>;
  behaviorPatterns: Record<string, unknown>;
  progressMetrics: Record<string, number>;
}

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'balanced';
export type CommunicationPreference =
  | 'supportive'
  | 'direct'
  | 'analytical'
  | 'motivational'
  | 'empathetic';

// ============================================
// Notification Types
// ============================================

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'session_reminder'
  | 'payment_due'
  | 'achievement'
  | 'message';

// ============================================
// File Upload Types
// ============================================

export interface UploadedFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  uploadedBy: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// ============================================
// Export all types
// ============================================
// Note: Types are exported individually above.
// Default export removed as these are type definitions, not runtime values.
