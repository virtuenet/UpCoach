import { z } from 'zod';
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodEffects<z.ZodEnum<["ASC", "DESC", "asc", "desc"]>, string, "ASC" | "DESC" | "asc" | "desc">>;
}, "strip", z.ZodTypeAny, {
    limit?: number;
    order?: string;
    page?: number;
    sortBy?: string;
}, {
    limit?: number;
    order?: "ASC" | "DESC" | "asc" | "desc";
    page?: number;
    sortBy?: string;
}>;
export declare const dateRangeSchema: z.ZodEffects<z.ZodObject<{
    startDate: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>;
    endDate: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>;
}, "strip", z.ZodTypeAny, {
    endDate?: Date;
    startDate?: Date;
}, {
    endDate?: string | Date;
    startDate?: string | Date;
}>, {
    endDate?: Date;
    startDate?: Date;
}, {
    endDate?: string | Date;
    startDate?: string | Date;
}>;
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id?: number;
}, {
    id?: number;
}>;
export declare const uuidParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
}, {
    id?: string;
}>;
export declare const searchQuerySchema: z.ZodObject<{
    q: z.ZodString;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    filters?: Record<string, unknown>;
    q?: string;
}, {
    filters?: Record<string, unknown>;
    q?: string;
}>;
export declare const fileUploadSchema: z.ZodObject<{
    filename: z.ZodString;
    mimetype: z.ZodEnum<["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/csv"]>;
    size: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    filename?: string;
    size?: number;
    mimetype?: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "application/pdf" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "text/plain" | "text/csv";
}, {
    filename?: string;
    size?: number;
    mimetype?: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "application/pdf" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "text/plain" | "text/csv";
}>;
export declare const imageUploadSchema: z.ZodObject<{
    filename: z.ZodString;
    mimetype: z.ZodEnum<["image/jpeg", "image/png", "image/gif", "image/webp"]>;
    size: z.ZodNumber;
    dimensions: z.ZodOptional<z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        width?: number;
        height?: number;
    }, {
        width?: number;
        height?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    filename?: string;
    size?: number;
    mimetype?: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    dimensions?: {
        width?: number;
        height?: number;
    };
}, {
    filename?: string;
    size?: number;
    mimetype?: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    dimensions?: {
        width?: number;
        height?: number;
    };
}>;
export declare const addressSchema: z.ZodObject<{
    street1: z.ZodString;
    street2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    postalCode: z.ZodString;
    country: z.ZodString;
}, "strip", z.ZodTypeAny, {
    state?: string;
    street1?: string;
    street2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
}, {
    state?: string;
    street1?: string;
    street2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
}>;
export declare const moneySchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodEnum<["USD", "EUR", "GBP", "CAD", "AUD"]>>;
}, "strip", z.ZodTypeAny, {
    currency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD";
    amount?: number;
}, {
    currency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD";
    amount?: number;
}>;
export declare const notificationPreferencesSchema: z.ZodObject<{
    email: z.ZodObject<{
        enabled: z.ZodBoolean;
        marketing: z.ZodOptional<z.ZodBoolean>;
        sessionReminders: z.ZodOptional<z.ZodBoolean>;
        weeklyDigest: z.ZodOptional<z.ZodBoolean>;
        productUpdates: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        marketing?: boolean;
        enabled?: boolean;
        sessionReminders?: boolean;
        weeklyDigest?: boolean;
        productUpdates?: boolean;
    }, {
        marketing?: boolean;
        enabled?: boolean;
        sessionReminders?: boolean;
        weeklyDigest?: boolean;
        productUpdates?: boolean;
    }>;
    push: z.ZodObject<{
        enabled: z.ZodBoolean;
        sessionReminders: z.ZodOptional<z.ZodBoolean>;
        messages: z.ZodOptional<z.ZodBoolean>;
        promotions: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        messages?: boolean;
        enabled?: boolean;
        sessionReminders?: boolean;
        promotions?: boolean;
    }, {
        messages?: boolean;
        enabled?: boolean;
        sessionReminders?: boolean;
        promotions?: boolean;
    }>;
    sms: z.ZodObject<{
        enabled: z.ZodBoolean;
        sessionReminders: z.ZodOptional<z.ZodBoolean>;
        urgentOnly: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean;
        sessionReminders?: boolean;
        urgentOnly?: boolean;
    }, {
        enabled?: boolean;
        sessionReminders?: boolean;
        urgentOnly?: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    push?: {
        messages?: boolean;
        enabled?: boolean;
        sessionReminders?: boolean;
        promotions?: boolean;
    };
    email?: {
        marketing?: boolean;
        enabled?: boolean;
        sessionReminders?: boolean;
        weeklyDigest?: boolean;
        productUpdates?: boolean;
    };
    sms?: {
        enabled?: boolean;
        sessionReminders?: boolean;
        urgentOnly?: boolean;
    };
}, {
    push?: {
        messages?: boolean;
        enabled?: boolean;
        sessionReminders?: boolean;
        promotions?: boolean;
    };
    email?: {
        marketing?: boolean;
        enabled?: boolean;
        sessionReminders?: boolean;
        weeklyDigest?: boolean;
        productUpdates?: boolean;
    };
    sms?: {
        enabled?: boolean;
        sessionReminders?: boolean;
        urgentOnly?: boolean;
    };
}>;
export declare const privacySettingsSchema: z.ZodObject<{
    profileVisibility: z.ZodEnum<["public", "private", "connections-only"]>;
    showEmail: z.ZodBoolean;
    showPhone: z.ZodBoolean;
    allowMessages: z.ZodEnum<["everyone", "connections-only", "nobody"]>;
    shareDataForImprovements: z.ZodBoolean;
    allowAnalytics: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    profileVisibility?: "public" | "private" | "connections-only";
    showEmail?: boolean;
    showPhone?: boolean;
    allowMessages?: "connections-only" | "everyone" | "nobody";
    shareDataForImprovements?: boolean;
    allowAnalytics?: boolean;
}, {
    profileVisibility?: "public" | "private" | "connections-only";
    showEmail?: boolean;
    showPhone?: boolean;
    allowMessages?: "connections-only" | "everyone" | "nobody";
    shareDataForImprovements?: boolean;
    allowAnalytics?: boolean;
}>;
export declare const feedbackSchema: z.ZodObject<{
    type: z.ZodEnum<["bug", "feature", "complaint", "compliment", "other"]>;
    category: z.ZodOptional<z.ZodString>;
    subject: z.ZodString;
    message: z.ZodString;
    attachments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    contactMe: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    type?: "other" | "feature" | "bug" | "complaint" | "compliment";
    priority?: "low" | "medium" | "high" | "urgent";
    category?: string;
    subject?: string;
    attachments?: string[];
    contactMe?: boolean;
}, {
    message?: string;
    type?: "other" | "feature" | "bug" | "complaint" | "compliment";
    priority?: "low" | "medium" | "high" | "urgent";
    category?: string;
    subject?: string;
    attachments?: string[];
    contactMe?: boolean;
}>;
export declare const reportSchema: z.ZodObject<{
    targetType: z.ZodEnum<["user", "content", "session", "review"]>;
    targetId: z.ZodNumber;
    reason: z.ZodEnum<["spam", "harassment", "inappropriate_content", "false_information", "copyright", "other"]>;
    description: z.ZodString;
    evidence: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    description?: string;
    evidence?: string[];
    reason?: "other" | "spam" | "harassment" | "inappropriate_content" | "false_information" | "copyright";
    targetType?: "user" | "content" | "review" | "session";
    targetId?: number;
}, {
    description?: string;
    evidence?: string[];
    reason?: "other" | "spam" | "harassment" | "inappropriate_content" | "false_information" | "copyright";
    targetType?: "user" | "content" | "review" | "session";
    targetId?: number;
}>;
export declare const subscriptionSchema: z.ZodObject<{
    planId: z.ZodString;
    billingCycle: z.ZodEnum<["monthly", "quarterly", "yearly"]>;
    paymentMethodId: z.ZodString;
    couponCode: z.ZodOptional<z.ZodString>;
    autoRenew: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    paymentMethodId?: string;
    couponCode?: string;
    planId?: string;
    billingCycle?: "monthly" | "quarterly" | "yearly";
    autoRenew?: boolean;
}, {
    paymentMethodId?: string;
    couponCode?: string;
    planId?: string;
    billingCycle?: "monthly" | "quarterly" | "yearly";
    autoRenew?: boolean;
}>;
export declare const webhookPayloadSchema: z.ZodObject<{
    event: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    timestamp: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    signature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp?: string | Date;
    data?: Record<string, unknown>;
    event?: string;
    signature?: string;
}, {
    timestamp?: string | Date;
    data?: Record<string, unknown>;
    event?: string;
    signature?: string;
}>;
export declare const apiKeySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    permissions: z.ZodArray<z.ZodString, "many">;
    expiresAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    ipWhitelist: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    expiresAt?: string | Date;
    permissions?: string[];
    ipWhitelist?: string[];
}, {
    name?: string;
    description?: string;
    expiresAt?: string | Date;
    permissions?: string[];
    ipWhitelist?: string[];
}>;
export declare const batchOperationSchema: z.ZodObject<{
    operation: z.ZodEnum<["create", "update", "delete"]>;
    items: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">;
    options: z.ZodOptional<z.ZodObject<{
        skipErrors: z.ZodOptional<z.ZodBoolean>;
        validateOnly: z.ZodOptional<z.ZodBoolean>;
        transaction: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        transaction?: boolean;
        skipErrors?: boolean;
        validateOnly?: boolean;
    }, {
        transaction?: boolean;
        skipErrors?: boolean;
        validateOnly?: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    options?: {
        transaction?: boolean;
        skipErrors?: boolean;
        validateOnly?: boolean;
    };
    operation?: "delete" | "create" | "update";
    items?: Record<string, unknown>[];
}, {
    options?: {
        transaction?: boolean;
        skipErrors?: boolean;
        validateOnly?: boolean;
    };
    operation?: "delete" | "create" | "update";
    items?: Record<string, unknown>[];
}>;
export declare const exportRequestSchema: z.ZodObject<{
    format: z.ZodEnum<["csv", "json", "xlsx", "pdf"]>;
    fields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    dateRange: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        startDate: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>;
        endDate: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>;
    }, "strip", z.ZodTypeAny, {
        endDate?: Date;
        startDate?: Date;
    }, {
        endDate?: string | Date;
        startDate?: string | Date;
    }>, {
        endDate?: Date;
        startDate?: Date;
    }, {
        endDate?: string | Date;
        startDate?: string | Date;
    }>>;
    includeHeaders: z.ZodDefault<z.ZodBoolean>;
    compress: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    fields?: string[];
    format?: "json" | "pdf" | "csv" | "xlsx";
    filters?: Record<string, unknown>;
    dateRange?: {
        endDate?: Date;
        startDate?: Date;
    };
    includeHeaders?: boolean;
    compress?: boolean;
}, {
    fields?: string[];
    format?: "json" | "pdf" | "csv" | "xlsx";
    filters?: Record<string, unknown>;
    dateRange?: {
        endDate?: string | Date;
        startDate?: string | Date;
    };
    includeHeaders?: boolean;
    compress?: boolean;
}>;
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
//# sourceMappingURL=common.schema.d.ts.map