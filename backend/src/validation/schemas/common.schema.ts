import { z } from 'zod';

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  order: z
    .enum(['ASC', 'DESC', 'asc', 'desc'])
    .transform(val => val.toUpperCase())
    .optional(),
});

// Date range schema
export const dateRangeSchema = z
  .object({
    startDate: z
      .string()
      .datetime()
      .or(z.date())
      .transform(val => new Date(val)),
    endDate: z
      .string()
      .datetime()
      .or(z.date())
      .transform(val => new Date(val)),
  })
  .refine(data => data.startDate <= data.endDate, {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  });

// ID parameter schema
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// UUID parameter schema
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

// Search query schema
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  filters: z.record(z.string(), z.unknown()).optional(),
});

// File upload schema
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
  ]),
  size: z
    .number()
    .positive()
    .max(10 * 1024 * 1024, 'File size must be less than 10MB'),
});

// Image upload schema (stricter for images)
export const imageUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  size: z
    .number()
    .positive()
    .max(5 * 1024 * 1024, 'Image size must be less than 5MB'),
  dimensions: z
    .object({
      width: z.number().positive().max(4096),
      height: z.number().positive().max(4096),
    })
    .optional(),
});

// Address schema
export const addressSchema = z.object({
  street1: z.string().min(1, 'Street address is required').max(100),
  street2: z.string().max(100).optional(),
  city: z.string().min(1, 'City is required').max(50),
  state: z.string().min(1, 'State/Province is required').max(50),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().length(2, 'Country must be 2-letter ISO code'),
});

// Money/amount schema
export const moneySchema = z.object({
  amount: z.number().positive().multipleOf(0.01, 'Amount must have at most 2 decimal places'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
});

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  email: z.object({
    enabled: z.boolean(),
    marketing: z.boolean().optional(),
    sessionReminders: z.boolean().optional(),
    weeklyDigest: z.boolean().optional(),
    productUpdates: z.boolean().optional(),
  }),
  push: z.object({
    enabled: z.boolean(),
    sessionReminders: z.boolean().optional(),
    messages: z.boolean().optional(),
    promotions: z.boolean().optional(),
  }),
  sms: z.object({
    enabled: z.boolean(),
    sessionReminders: z.boolean().optional(),
    urgentOnly: z.boolean().optional(),
  }),
});

// Privacy settings schema
export const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'connections-only']),
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  allowMessages: z.enum(['everyone', 'connections-only', 'nobody']),
  shareDataForImprovements: z.boolean(),
  allowAnalytics: z.boolean(),
});

// Feedback/Report schema
export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'complaint', 'compliment', 'other']),
  category: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100),
  message: z.string().min(20, 'Message must be at least 20 characters').max(2000),
  attachments: z.array(z.string().url()).max(5).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  contactMe: z.boolean().default(false),
});

// Report user/content schema
export const reportSchema = z.object({
  targetType: z.enum(['user', 'content', 'session', 'review']),
  targetId: z.number().int().positive(),
  reason: z.enum([
    'spam',
    'harassment',
    'inappropriate_content',
    'false_information',
    'copyright',
    'other',
  ]),
  description: z.string().min(10, 'Please provide more details').max(1000),
  evidence: z.array(z.string().url()).optional(),
});

// Subscription schema
export const subscriptionSchema = z.object({
  planId: z.string().min(1),
  billingCycle: z.enum(['monthly', 'quarterly', 'yearly']),
  paymentMethodId: z.string().min(1),
  couponCode: z.string().optional(),
  autoRenew: z.boolean().default(true),
});

// Webhook payload validation
export const webhookPayloadSchema = z.object({
  event: z.string().min(1),
  data: z.record(z.unknown()),
  timestamp: z.string().datetime().or(z.date()),
  signature: z.string().min(1),
});

// API key creation schema
export const apiKeySchema = z.object({
  name: z.string().min(3, 'API key name must be at least 3 characters').max(50),
  description: z.string().max(200).optional(),
  permissions: z.array(z.string()).min(1, 'Select at least one permission'),
  expiresAt: z.string().datetime().or(z.date()).optional(),
  ipWhitelist: z.array(z.string().ip()).optional(),
});

// Batch operation schema
export const batchOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete']),
  items: z.array(z.record(z.unknown())).min(1).max(100, 'Maximum 100 items per batch'),
  options: z
    .object({
      skipErrors: z.boolean().optional(),
      validateOnly: z.boolean().optional(),
      transaction: z.boolean().optional(),
    })
    .optional(),
});

// Export request schema
export const exportRequestSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx', 'pdf']),
  fields: z.array(z.string()).optional(),
  filters: z.record(z.unknown()).optional(),
  dateRange: dateRangeSchema.optional(),
  includeHeaders: z.boolean().default(true),
  compress: z.boolean().default(false),
});

// Type exports
export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
export type UuidParamInput = z.infer<typeof uuidParamSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type ImageUploadInput = z.infer<typeof imageUploadSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type MoneyInput = z.infer<typeof moneySchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type WebhookPayloadInput = z.infer<typeof webhookPayloadSchema>;
export type ApiKeyInput = z.infer<typeof apiKeySchema>;
export type BatchOperationInput = z.infer<typeof batchOperationSchema>;
export type ExportRequestInput = z.infer<typeof exportRequestSchema>;
