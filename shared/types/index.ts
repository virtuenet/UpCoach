/**
 * Shared Type Definitions
 * Central location for all common types used across the application
 */

// ==================== User Types ====================
export interface User {
  id: number | string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastLoginAt?: Date | string;
  onboardingCompleted?: boolean;
  subscription?: Subscription;
  profile?: UserProfile;
}

export type UserRole = 'user' | 'admin' | 'coach' | 'enterprise';

export interface UserProfile {
  id: number | string;
  userId: number | string;
  bio?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  language?: string;
  preferences?: UserPreferences;
  metadata?: Record<string, any>;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  marketing: boolean;
  reminders: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showPhone: boolean;
  allowAnalytics: boolean;
}

// ==================== Auth Types ====================
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken?: string | null;
  expiresAt?: number;
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
  role?: UserRole;
  organizationId?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  message?: string;
}

// ==================== API Types ====================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
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
  filters?: Record<string, any>;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
  field?: string;
}

// ==================== Financial Types ====================
export interface Transaction {
  id: number | string;
  userId: number | string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type TransactionType = 'payment' | 'refund' | 'subscription' | 'payout';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Subscription {
  id: number | string;
  userId: number | string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date | string;
  currentPeriodEnd: Date | string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date | string;
  metadata?: Record<string, any>;
}

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing' | 'incomplete';

export interface FinancialMetrics {
  mrr: number;
  arr: number;
  churnRate: number;
  ltv: number;
  cac: number;
  runway: number;
  burnRate: number;
  grossMargin: number;
}

// ==================== Content Types ====================
export interface Content {
  id: number | string;
  type: ContentType;
  title: string;
  slug: string;
  description?: string;
  body?: string;
  status: ContentStatus;
  authorId: number | string;
  categoryId?: number | string;
  tags?: string[];
  metadata?: ContentMetadata;
  publishedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type ContentType = 'article' | 'course' | 'video' | 'template' | 'media';
export type ContentStatus = 'draft' | 'published' | 'archived' | 'scheduled';

export interface ContentMetadata {
  views?: number;
  likes?: number;
  shares?: number;
  readTime?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  outcomes?: string[];
}

// ==================== Goal & Task Types ====================
export interface Goal {
  id: number | string;
  userId: number | string;
  title: string;
  description?: string;
  category?: string;
  targetDate?: Date | string;
  status: GoalStatus;
  progress: number;
  milestones?: Milestone[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned';

export interface Milestone {
  id: number | string;
  goalId: number | string;
  title: string;
  description?: string;
  dueDate?: Date | string;
  completed: boolean;
  completedAt?: Date | string;
}

export interface Task {
  id: number | string;
  userId: number | string;
  goalId?: number | string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date | string;
  completedAt?: Date | string;
  tags?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// ==================== Chat & Messaging Types ====================
export interface Conversation {
  id: number | string;
  participants: string[];
  type: 'direct' | 'group' | 'ai';
  title?: string;
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Message {
  id: number | string;
  conversationId: number | string;
  senderId: number | string;
  content: string;
  type: MessageType;
  attachments?: Attachment[];
  metadata?: Record<string, any>;
  readBy?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'system';

export interface Attachment {
  id: number | string;
  url: string;
  type: string;
  name: string;
  size: number;
}

// ==================== Analytics Types ====================
export interface AnalyticsEvent {
  userId?: number | string;
  sessionId?: string;
  event: string;
  properties?: Record<string, any>;
  timestamp: Date | string;
  platform?: string;
  deviceType?: string;
  ip?: string;
}

export interface UserActivity {
  userId: number | string;
  date: Date | string;
  sessionsCount: number;
  totalDuration: number;
  events: AnalyticsEvent[];
  goalProgress?: number;
  tasksCompleted?: number;
}

export interface DashboardMetrics {
  users: {
    total: number;
    active: number;
    new: number;
    churn: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    growth: number;
  };
  engagement: {
    dau: number;
    wau: number;
    mau: number;
    avgSessionDuration: number;
  };
  content: {
    total: number;
    published: number;
    views: number;
    engagement: number;
  };
}

// ==================== Coach Types ====================
export interface Coach {
  id: number | string;
  userId: number | string;
  specializations: string[];
  experience: number;
  certifications?: Certification[];
  availability?: Availability;
  rating?: number;
  reviewsCount?: number;
  clientsCount?: number;
  hourlyRate?: number;
  bio?: string;
  verified: boolean;
}

export interface Certification {
  name: string;
  issuer: string;
  date: Date | string;
  expiryDate?: Date | string;
  verificationUrl?: string;
}

export interface Availability {
  timezone: string;
  schedule: WeeklySchedule;
  exceptions?: ScheduleException[];
}

export interface WeeklySchedule {
  [day: string]: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface ScheduleException {
  date: Date | string;
  available: boolean;
  slots?: TimeSlot[];
}

// ==================== Notification Types ====================
export interface Notification {
  id: number | string;
  userId: number | string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  readAt?: Date | string;
  createdAt: Date | string;
}

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'goal_reminder'
  | 'task_due'
  | 'achievement'
  | 'message'
  | 'system';

// ==================== Common Types ====================
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: string;
}

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
}

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'startsWith'
  | 'endsWith';

export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

export interface DateRange {
  start: Date | string;
  end: Date | string;
}

// Export everything from a single entry point
export default {
  // This default export can be used for namespace imports
  // import Types from '@shared/types';
  // const user: Types.User = {...}
};
