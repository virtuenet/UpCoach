"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportRequestSchema = exports.batchOperationSchema = exports.apiKeySchema = exports.webhookPayloadSchema = exports.subscriptionSchema = exports.reportSchema = exports.feedbackSchema = exports.privacySettingsSchema = exports.notificationPreferencesSchema = exports.moneySchema = exports.addressSchema = exports.imageUploadSchema = exports.fileUploadSchema = exports.searchQuerySchema = exports.uuidParamSchema = exports.idParamSchema = exports.dateRangeSchema = exports.paginationSchema = void 0;
const zod_1 = require("zod");
// Pagination schema
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    sortBy: zod_1.z.string().optional(),
    order: zod_1.z
        .enum(['ASC', 'DESC', 'asc', 'desc'])
        .transform(val => val.toUpperCase())
        .optional(),
});
// Date range schema
exports.dateRangeSchema = zod_1.z
    .object({
    startDate: zod_1.z
        .string()
        .datetime()
        .or(zod_1.z.date())
        .transform(val => new Date(val)),
    endDate: zod_1.z
        .string()
        .datetime()
        .or(zod_1.z.date())
        .transform(val => new Date(val)),
})
    .refine(data => data.startDate <= data.endDate, {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
});
// ID parameter schema
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive(),
});
// UUID parameter schema
exports.uuidParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid UUID format'),
});
// Search query schema
exports.searchQuerySchema = zod_1.z.object({
    q: zod_1.z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
    filters: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
// File upload schema
exports.fileUploadSchema = zod_1.z.object({
    filename: zod_1.z.string().min(1).max(255),
    mimetype: zod_1.z.enum([
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
    size: zod_1.z
        .number()
        .positive()
        .max(10 * 1024 * 1024, 'File size must be less than 10MB'),
});
// Image upload schema (stricter for images)
exports.imageUploadSchema = zod_1.z.object({
    filename: zod_1.z.string().min(1).max(255),
    mimetype: zod_1.z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    size: zod_1.z
        .number()
        .positive()
        .max(5 * 1024 * 1024, 'Image size must be less than 5MB'),
    dimensions: zod_1.z
        .object({
        width: zod_1.z.number().positive().max(4096),
        height: zod_1.z.number().positive().max(4096),
    })
        .optional(),
});
// Address schema
exports.addressSchema = zod_1.z.object({
    street1: zod_1.z.string().min(1, 'Street address is required').max(100),
    street2: zod_1.z.string().max(100).optional(),
    city: zod_1.z.string().min(1, 'City is required').max(50),
    state: zod_1.z.string().min(1, 'State/Province is required').max(50),
    postalCode: zod_1.z.string().min(1, 'Postal code is required').max(20),
    country: zod_1.z.string().length(2, 'Country must be 2-letter ISO code'),
});
// Money/amount schema
exports.moneySchema = zod_1.z.object({
    amount: zod_1.z.number().positive().multipleOf(0.01, 'Amount must have at most 2 decimal places'),
    currency: zod_1.z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
});
// Notification preferences schema
exports.notificationPreferencesSchema = zod_1.z.object({
    email: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        marketing: zod_1.z.boolean().optional(),
        sessionReminders: zod_1.z.boolean().optional(),
        weeklyDigest: zod_1.z.boolean().optional(),
        productUpdates: zod_1.z.boolean().optional(),
    }),
    push: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        sessionReminders: zod_1.z.boolean().optional(),
        messages: zod_1.z.boolean().optional(),
        promotions: zod_1.z.boolean().optional(),
    }),
    sms: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        sessionReminders: zod_1.z.boolean().optional(),
        urgentOnly: zod_1.z.boolean().optional(),
    }),
});
// Privacy settings schema
exports.privacySettingsSchema = zod_1.z.object({
    profileVisibility: zod_1.z.enum(['public', 'private', 'connections-only']),
    showEmail: zod_1.z.boolean(),
    showPhone: zod_1.z.boolean(),
    allowMessages: zod_1.z.enum(['everyone', 'connections-only', 'nobody']),
    shareDataForImprovements: zod_1.z.boolean(),
    allowAnalytics: zod_1.z.boolean(),
});
// Feedback/Report schema
exports.feedbackSchema = zod_1.z.object({
    type: zod_1.z.enum(['bug', 'feature', 'complaint', 'compliment', 'other']),
    category: zod_1.z.string().optional(),
    subject: zod_1.z.string().min(5, 'Subject must be at least 5 characters').max(100),
    message: zod_1.z.string().min(20, 'Message must be at least 20 characters').max(2000),
    attachments: zod_1.z.array(zod_1.z.string().url()).max(5).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    contactMe: zod_1.z.boolean().default(false),
});
// Report user/content schema
exports.reportSchema = zod_1.z.object({
    targetType: zod_1.z.enum(['user', 'content', 'session', 'review']),
    targetId: zod_1.z.number().int().positive(),
    reason: zod_1.z.enum([
        'spam',
        'harassment',
        'inappropriate_content',
        'false_information',
        'copyright',
        'other',
    ]),
    description: zod_1.z.string().min(10, 'Please provide more details').max(1000),
    evidence: zod_1.z.array(zod_1.z.string().url()).optional(),
});
// Subscription schema
exports.subscriptionSchema = zod_1.z.object({
    planId: zod_1.z.string().min(1),
    billingCycle: zod_1.z.enum(['monthly', 'quarterly', 'yearly']),
    paymentMethodId: zod_1.z.string().min(1),
    couponCode: zod_1.z.string().optional(),
    autoRenew: zod_1.z.boolean().default(true),
});
// Webhook payload validation
exports.webhookPayloadSchema = zod_1.z.object({
    event: zod_1.z.string().min(1),
    data: zod_1.z.record(zod_1.z.unknown()),
    timestamp: zod_1.z.string().datetime().or(zod_1.z.date()),
    signature: zod_1.z.string().min(1),
});
// API key creation schema
exports.apiKeySchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'API key name must be at least 3 characters').max(50),
    description: zod_1.z.string().max(200).optional(),
    permissions: zod_1.z.array(zod_1.z.string()).min(1, 'Select at least one permission'),
    expiresAt: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    ipWhitelist: zod_1.z.array(zod_1.z.string().ip()).optional(),
});
// Batch operation schema
exports.batchOperationSchema = zod_1.z.object({
    operation: zod_1.z.enum(['create', 'update', 'delete']),
    items: zod_1.z.array(zod_1.z.record(zod_1.z.unknown())).min(1).max(100, 'Maximum 100 items per batch'),
    options: zod_1.z
        .object({
        skipErrors: zod_1.z.boolean().optional(),
        validateOnly: zod_1.z.boolean().optional(),
        transaction: zod_1.z.boolean().optional(),
    })
        .optional(),
});
// Export request schema
exports.exportRequestSchema = zod_1.z.object({
    format: zod_1.z.enum(['csv', 'json', 'xlsx', 'pdf']),
    fields: zod_1.z.array(zod_1.z.string()).optional(),
    filters: zod_1.z.record(zod_1.z.unknown()).optional(),
    dateRange: exports.dateRangeSchema.optional(),
    includeHeaders: zod_1.z.boolean().default(true),
    compress: zod_1.z.boolean().default(false),
});
//# sourceMappingURL=common.schema.js.map