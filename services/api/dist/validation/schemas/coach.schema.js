"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coachStatsQuerySchema = exports.updateAvailabilitySchema = exports.purchasePackageSchema = exports.coachPackageSchema = exports.sessionReviewSchema = exports.cancelSessionSchema = exports.updateSessionSchema = exports.bookSessionSchema = exports.coachSearchSchema = exports.coachProfileSchema = void 0;
const zod_1 = require("zod");
// Coach specializations enum
const specializationsEnum = zod_1.z.enum([
    'life_coaching',
    'career_coaching',
    'business_coaching',
    'health_wellness',
    'relationship_coaching',
    'financial_coaching',
    'executive_coaching',
    'performance_coaching',
    'mindfulness_meditation',
    'leadership_development',
    'personal_development',
    'nutrition_fitness',
]);
// Session types
const sessionTypeEnum = zod_1.z.enum(['video', 'audio', 'chat', 'in-person']);
// Session status
const sessionStatusEnum = zod_1.z.enum(['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show']);
// Coach profile schema
exports.coachProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(2, 'Display name must be at least 2 characters').max(100),
    bio: zod_1.z
        .string()
        .min(50, 'Bio must be at least 50 characters')
        .max(2000, 'Bio must be less than 2000 characters'),
    specializations: zod_1.z
        .array(specializationsEnum)
        .min(1, 'Select at least one specialization')
        .max(5, 'Maximum 5 specializations'),
    experience: zod_1.z
        .number()
        .min(0, 'Experience cannot be negative')
        .max(50, 'Experience seems unrealistic'),
    education: zod_1.z
        .array(zod_1.z.object({
        degree: zod_1.z.string().min(1).max(100),
        institution: zod_1.z.string().min(1).max(100),
        year: zod_1.z.number().min(1950).max(new Date().getFullYear()),
    }))
        .optional(),
    certifications: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(1).max(100),
        issuer: zod_1.z.string().min(1).max(100),
        year: zod_1.z.number().min(1950).max(new Date().getFullYear()),
        verificationUrl: zod_1.z.string().url().optional(),
    }))
        .optional(),
    languages: zod_1.z.array(zod_1.z.string()).min(1, 'Specify at least one language'),
    hourlyRate: zod_1.z.number().min(0, 'Rate cannot be negative').max(1000, 'Rate exceeds maximum'),
    currency: zod_1.z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
    timezone: zod_1.z.string().min(1, 'Timezone is required'),
    availability: zod_1.z.object({
        monday: zod_1.z
            .array(zod_1.z.object({
            start: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            end: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        }))
            .optional(),
        tuesday: zod_1.z
            .array(zod_1.z.object({
            start: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            end: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        }))
            .optional(),
        wednesday: zod_1.z
            .array(zod_1.z.object({
            start: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            end: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        }))
            .optional(),
        thursday: zod_1.z
            .array(zod_1.z.object({
            start: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            end: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        }))
            .optional(),
        friday: zod_1.z
            .array(zod_1.z.object({
            start: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            end: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        }))
            .optional(),
        saturday: zod_1.z
            .array(zod_1.z.object({
            start: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            end: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        }))
            .optional(),
        sunday: zod_1.z
            .array(zod_1.z.object({
            start: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            end: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        }))
            .optional(),
    }),
    videoEnabled: zod_1.z.boolean(),
    audioEnabled: zod_1.z.boolean(),
    chatEnabled: zod_1.z.boolean(),
    inPersonEnabled: zod_1.z.boolean(),
    inPersonLocation: zod_1.z.string().max(200).optional(),
});
// Coach search filters
exports.coachSearchSchema = zod_1.z
    .object({
    specialization: specializationsEnum.optional(),
    minRating: zod_1.z.number().min(0).max(5).optional(),
    maxPrice: zod_1.z.number().positive().optional(),
    minPrice: zod_1.z.number().min(0).optional(),
    language: zod_1.z.string().optional(),
    isAvailable: zod_1.z.boolean().optional(),
    search: zod_1.z.string().max(100).optional(),
    timezone: zod_1.z.string().optional(),
    hasVideo: zod_1.z.boolean().optional(),
    sortBy: zod_1.z.enum(['rating', 'price', 'experience', 'sessions']).optional(),
    order: zod_1.z.enum(['ASC', 'DESC']).optional(),
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().positive().max(100).default(20),
})
    .refine(data => {
    if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice;
    }
    return true;
}, {
    message: 'Minimum price must be less than maximum price',
    path: ['minPrice'],
});
// Session booking schema
exports.bookSessionSchema = zod_1.z
    .object({
    coachId: zod_1.z.number().int().positive(),
    sessionType: sessionTypeEnum,
    scheduledAt: zod_1.z
        .string()
        .datetime()
        .or(zod_1.z.date())
        .transform(val => new Date(val)),
    durationMinutes: zod_1.z
        .number()
        .int()
        .min(30)
        .max(120)
        .refine(val => [30, 45, 60, 90, 120].includes(val), {
        message: 'Duration must be one of: 30, 45, 60, 90, or 120 minutes',
    }),
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters').max(100),
    description: zod_1.z.string().max(500).optional(),
    timezone: zod_1.z.string().min(1, 'Timezone is required'),
    packageId: zod_1.z.number().int().positive().optional(),
})
    .refine(data => {
    const scheduledDate = new Date(data.scheduledAt);
    const now = new Date();
    return scheduledDate > now;
}, {
    message: 'Session must be scheduled in the future',
    path: ['scheduledAt'],
});
// Session update schema
exports.updateSessionSchema = zod_1.z
    .object({
    scheduledAt: zod_1.z
        .string()
        .datetime()
        .or(zod_1.z.date())
        .transform(val => new Date(val))
        .optional(),
    title: zod_1.z.string().min(3).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    status: sessionStatusEnum.optional(),
    notes: zod_1.z.string().max(2000).optional(),
})
    .refine(data => {
    if (data.scheduledAt) {
        const scheduledDate = new Date(data.scheduledAt);
        const now = new Date();
        return scheduledDate > now;
    }
    return true;
}, {
    message: 'Session must be scheduled in the future',
    path: ['scheduledAt'],
});
// Cancel session schema
exports.cancelSessionSchema = zod_1.z.object({
    reason: zod_1.z.string().min(10, 'Please provide a reason for cancellation').max(500),
    requestRefund: zod_1.z.boolean().optional(),
});
// Session review schema
exports.sessionReviewSchema = zod_1.z.object({
    sessionId: zod_1.z.number().int().positive(),
    rating: zod_1.z.number().int().min(1).max(5),
    comment: zod_1.z.string().min(10, 'Review must be at least 10 characters').max(1000),
    communicationRating: zod_1.z.number().int().min(1).max(5).optional(),
    knowledgeRating: zod_1.z.number().int().min(1).max(5).optional(),
    helpfulnessRating: zod_1.z.number().int().min(1).max(5).optional(),
    wouldRecommend: zod_1.z.boolean().optional(),
    isAnonymous: zod_1.z.boolean().optional(),
});
// Coach package schema
exports.coachPackageSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'Package name must be at least 3 characters').max(100),
    description: zod_1.z.string().min(20, 'Description must be at least 20 characters').max(500),
    sessionCount: zod_1.z.number().int().min(1).max(100),
    validityDays: zod_1.z.number().int().min(7).max(365),
    price: zod_1.z.number().positive(),
    discount: zod_1.z.number().min(0).max(50).optional(),
    features: zod_1.z.array(zod_1.z.string()).min(1, 'Add at least one feature'),
    sessionType: sessionTypeEnum,
    durationMinutes: zod_1.z
        .number()
        .int()
        .min(30)
        .max(120)
        .refine(val => [30, 45, 60, 90, 120].includes(val), {
        message: 'Duration must be one of: 30, 45, 60, 90, or 120 minutes',
    }),
    maxBookingsPerWeek: zod_1.z.number().int().min(1).max(7).optional(),
});
// Purchase package schema
exports.purchasePackageSchema = zod_1.z.object({
    packageId: zod_1.z.number().int().positive(),
    paymentMethodId: zod_1.z.string().min(1, 'Payment method is required'),
    couponCode: zod_1.z.string().optional(),
});
// Coach availability update
exports.updateAvailabilitySchema = zod_1.z.object({
    date: zod_1.z.string().datetime().or(zod_1.z.date()),
    slots: zod_1.z.array(zod_1.z.object({
        start: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        end: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        isAvailable: zod_1.z.boolean(),
    })),
});
// Coach statistics query
exports.coachStatsQuerySchema = zod_1.z
    .object({
    startDate: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    endDate: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    metric: zod_1.z.enum(['sessions', 'revenue', 'ratings', 'clients']).optional(),
})
    .refine(data => {
    if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
}, {
    message: 'Start date must be before end date',
    path: ['startDate'],
});
//# sourceMappingURL=coach.schema.js.map