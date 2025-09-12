import { z } from 'zod';
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodEffects<z.ZodEnum<["ASC", "DESC", "asc", "desc"]>, string, "ASC" | "DESC" | "asc" | "desc">>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    order?: string | undefined;
    sortBy?: string | undefined;
}, {
    limit?: number | undefined;
    order?: "ASC" | "DESC" | "asc" | "desc" | undefined;
    page?: number | undefined;
    sortBy?: string | undefined;
}>;
export declare const dateRangeSchema: z.ZodEffects<z.ZodObject<{
    startDate: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>;
    endDate: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>;
}, "strip", z.ZodTypeAny, {
    endDate: Date;
    startDate: Date;
}, {
    endDate: string | Date;
    startDate: string | Date;
}>, {
    endDate: Date;
    startDate: Date;
}, {
    endDate: string | Date;
    startDate: string | Date;
}>;
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
}, {
    id: number;
}>;
export declare const uuidParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const searchQuerySchema: z.ZodObject<{
    q: z.ZodString;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    q: string;
    filters?: Record<string, unknown> | undefined;
}, {
    q: string;
    filters?: Record<string, unknown> | undefined;
}>;
export declare const fileUploadSchema: z.ZodObject<{
    filename: z.ZodString;
    mimetype: z.ZodEnum<["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/csv"]>;
    size: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    filename: string;
    size: number;
    mimetype: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "application/pdf" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "text/plain" | "text/csv";
}, {
    filename: string;
    size: number;
    mimetype: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "application/pdf" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "text/plain" | "text/csv";
}>;
export declare const imageUploadSchema: z.ZodObject<{
    filename: z.ZodString;
    mimetype: z.ZodEnum<["image/jpeg", "image/png", "image/gif", "image/webp"]>;
    size: z.ZodNumber;
    dimensions: z.ZodOptional<z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        width: number;
        height: number;
    }, {
        width: number;
        height: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    filename: string;
    size: number;
    mimetype: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    dimensions?: {
        width: number;
        height: number;
    } | undefined;
}, {
    filename: string;
    size: number;
    mimetype: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    dimensions?: {
        width: number;
        height: number;
    } | undefined;
}>;
export declare const addressSchema: z.ZodObject<{
    street1: z.ZodString;
    street2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    postalCode: z.ZodString;
    country: z.ZodString;
}, "strip", z.ZodTypeAny, {
    state: string;
    street1: string;
    city: string;
    postalCode: string;
    country: string;
    street2?: string | undefined;
}, {
    state: string;
    street1: string;
    city: string;
    postalCode: string;
    country: string;
    street2?: string | undefined;
}>;
export declare const moneySchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodEnum<["USD", "EUR", "GBP", "CAD", "AUD"]>>;
}, "strip", z.ZodTypeAny, {
    currency: "USD" | "EUR" | "GBP" | "CAD" | "AUD";
    amount: number;
}, {
    amount: number;
    currency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD" | undefined;
}>;
export declare const notificationPreferencesSchema: z.ZodObject<{
    email: z.ZodObject<{
        enabled: z.ZodBoolean;
        marketing: z.ZodOptional<z.ZodBoolean>;
        sessionReminders: z.ZodOptional<z.ZodBoolean>;
        weeklyDigest: z.ZodOptional<z.ZodBoolean>;
        productUpdates: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        marketing?: boolean | undefined;
        sessionReminders?: boolean | undefined;
        weeklyDigest?: boolean | undefined;
        productUpdates?: boolean | undefined;
    }, {
        enabled: boolean;
        marketing?: boolean | undefined;
        sessionReminders?: boolean | undefined;
        weeklyDigest?: boolean | undefined;
        productUpdates?: boolean | undefined;
    }>;
    push: z.ZodObject<{
        enabled: z.ZodBoolean;
        sessionReminders: z.ZodOptional<z.ZodBoolean>;
        messages: z.ZodOptional<z.ZodBoolean>;
        promotions: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        messages?: boolean | undefined;
        sessionReminders?: boolean | undefined;
        promotions?: boolean | undefined;
    }, {
        enabled: boolean;
        messages?: boolean | undefined;
        sessionReminders?: boolean | undefined;
        promotions?: boolean | undefined;
    }>;
    sms: z.ZodObject<{
        enabled: z.ZodBoolean;
        sessionReminders: z.ZodOptional<z.ZodBoolean>;
        urgentOnly: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        sessionReminders?: boolean | undefined;
        urgentOnly?: boolean | undefined;
    }, {
        enabled: boolean;
        sessionReminders?: boolean | undefined;
        urgentOnly?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    push: {
        enabled: boolean;
        messages?: boolean | undefined;
        sessionReminders?: boolean | undefined;
        promotions?: boolean | undefined;
    };
    email: {
        enabled: boolean;
        marketing?: boolean | undefined;
        sessionReminders?: boolean | undefined;
        weeklyDigest?: boolean | undefined;
        productUpdates?: boolean | undefined;
    };
    sms: {
        enabled: boolean;
        sessionReminders?: boolean | undefined;
        urgentOnly?: boolean | undefined;
    };
}, {
    push: {
        enabled: boolean;
        messages?: boolean | undefined;
        sessionReminders?: boolean | undefined;
        promotions?: boolean | undefined;
    };
    email: {
        enabled: boolean;
        marketing?: boolean | undefined;
        sessionReminders?: boolean | undefined;
        weeklyDigest?: boolean | undefined;
        productUpdates?: boolean | undefined;
    };
    sms: {
        enabled: boolean;
        sessionReminders?: boolean | undefined;
        urgentOnly?: boolean | undefined;
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
    profileVisibility: "public" | "private" | "connections-only";
    showEmail: boolean;
    showPhone: boolean;
    allowMessages: "connections-only" | "everyone" | "nobody";
    shareDataForImprovements: boolean;
    allowAnalytics: boolean;
}, {
    profileVisibility: "public" | "private" | "connections-only";
    showEmail: boolean;
    showPhone: boolean;
    allowMessages: "connections-only" | "everyone" | "nobody";
    shareDataForImprovements: boolean;
    allowAnalytics: boolean;
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
    message: string;
    type: "other" | "feature" | "bug" | "complaint" | "compliment";
    subject: string;
    contactMe: boolean;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    category?: string | undefined;
    attachments?: string[] | undefined;
}, {
    message: string;
    type: "other" | "feature" | "bug" | "complaint" | "compliment";
    subject: string;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    category?: string | undefined;
    attachments?: string[] | undefined;
    contactMe?: boolean | undefined;
}>;
export declare const reportSchema: z.ZodObject<{
    targetType: z.ZodEnum<["user", "content", "session", "review"]>;
    targetId: z.ZodNumber;
    reason: z.ZodEnum<["spam", "harassment", "inappropriate_content", "false_information", "copyright", "other"]>;
    description: z.ZodString;
    evidence: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    description: string;
    reason: "other" | "spam" | "harassment" | "inappropriate_content" | "false_information" | "copyright";
    targetType: "user" | "content" | "review" | "session";
    targetId: number;
    evidence?: string[] | undefined;
}, {
    description: string;
    reason: "other" | "spam" | "harassment" | "inappropriate_content" | "false_information" | "copyright";
    targetType: "user" | "content" | "review" | "session";
    targetId: number;
    evidence?: string[] | undefined;
}>;
export declare const subscriptionSchema: z.ZodObject<{
    planId: z.ZodString;
    billingCycle: z.ZodEnum<["monthly", "quarterly", "yearly"]>;
    paymentMethodId: z.ZodString;
    couponCode: z.ZodOptional<z.ZodString>;
    autoRenew: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    paymentMethodId: string;
    planId: string;
    billingCycle: "monthly" | "quarterly" | "yearly";
    autoRenew: boolean;
    couponCode?: string | undefined;
}, {
    paymentMethodId: string;
    planId: string;
    billingCycle: "monthly" | "quarterly" | "yearly";
    couponCode?: string | undefined;
    autoRenew?: boolean | undefined;
}>;
export declare const webhookPayloadSchema: z.ZodObject<{
    event: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    timestamp: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    signature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: string | Date;
    data: Record<string, unknown>;
    event: string;
    signature: string;
}, {
    timestamp: string | Date;
    data: Record<string, unknown>;
    event: string;
    signature: string;
}>;
export declare const apiKeySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    permissions: z.ZodArray<z.ZodString, "many">;
    expiresAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    ipWhitelist: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    permissions: string[];
    description?: string | undefined;
    expiresAt?: string | Date | undefined;
    ipWhitelist?: string[] | undefined;
}, {
    name: string;
    permissions: string[];
    description?: string | undefined;
    expiresAt?: string | Date | undefined;
    ipWhitelist?: string[] | undefined;
}>;
export declare const batchOperationSchema: z.ZodObject<{
    operation: z.ZodEnum<["create", "update", "delete"]>;
    items: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">;
    options: z.ZodOptional<z.ZodObject<{
        skipErrors: z.ZodOptional<z.ZodBoolean>;
        validateOnly: z.ZodOptional<z.ZodBoolean>;
        transaction: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        transaction?: boolean | undefined;
        skipErrors?: boolean | undefined;
        validateOnly?: boolean | undefined;
    }, {
        transaction?: boolean | undefined;
        skipErrors?: boolean | undefined;
        validateOnly?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    operation: "delete" | "create" | "update";
    items: Record<string, unknown>[];
    options?: {
        transaction?: boolean | undefined;
        skipErrors?: boolean | undefined;
        validateOnly?: boolean | undefined;
    } | undefined;
}, {
    operation: "delete" | "create" | "update";
    items: Record<string, unknown>[];
    options?: {
        transaction?: boolean | undefined;
        skipErrors?: boolean | undefined;
        validateOnly?: boolean | undefined;
    } | undefined;
}>;
export declare const exportRequestSchema: z.ZodObject<{
    format: z.ZodEnum<["csv", "json", "xlsx", "pdf"]>;
    fields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    dateRange: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        startDate: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>;
        endDate: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>;
    }, "strip", z.ZodTypeAny, {
        endDate: Date;
        startDate: Date;
    }, {
        endDate: string | Date;
        startDate: string | Date;
    }>, {
        endDate: Date;
        startDate: Date;
    }, {
        endDate: string | Date;
        startDate: string | Date;
    }>>;
    includeHeaders: z.ZodDefault<z.ZodBoolean>;
    compress: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    format: "json" | "pdf" | "csv" | "xlsx";
    compress: boolean;
    includeHeaders: boolean;
    fields?: string[] | undefined;
    filters?: Record<string, unknown> | undefined;
    dateRange?: {
        endDate: Date;
        startDate: Date;
    } | undefined;
}, {
    format: "json" | "pdf" | "csv" | "xlsx";
    fields?: string[] | undefined;
    compress?: boolean | undefined;
    filters?: Record<string, unknown> | undefined;
    dateRange?: {
        endDate: string | Date;
        startDate: string | Date;
    } | undefined;
    includeHeaders?: boolean | undefined;
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