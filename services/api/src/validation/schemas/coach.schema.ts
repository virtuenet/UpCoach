import { z } from 'zod';

// Coach specializations enum
const specializationsEnum = z.enum([
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
const sessionTypeEnum = z.enum(['video', 'audio', 'chat', 'in-person']);

// Session status
const sessionStatusEnum = z.enum(['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show']);

// Coach profile schema
export const coachProfileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(100),
  bio: z
    .string()
    .min(50, 'Bio must be at least 50 characters')
    .max(2000, 'Bio must be less than 2000 characters'),
  specializations: z
    .array(specializationsEnum)
    .min(1, 'Select at least one specialization')
    .max(5, 'Maximum 5 specializations'),
  experience: z
    .number()
    .min(0, 'Experience cannot be negative')
    .max(50, 'Experience seems unrealistic'),
  education: z
    .array(
      z.object({
        degree: z.string().min(1).max(100),
        institution: z.string().min(1).max(100),
        year: z.number().min(1950).max(new Date().getFullYear()),
      })
    )
    .optional(),
  certifications: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        issuer: z.string().min(1).max(100),
        year: z.number().min(1950).max(new Date().getFullYear()),
        verificationUrl: z.string().url().optional(),
      })
    )
    .optional(),
  languages: z.array(z.string()).min(1, 'Specify at least one language'),
  hourlyRate: z.number().min(0, 'Rate cannot be negative').max(1000, 'Rate exceeds maximum'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
  timezone: z.string().min(1, 'Timezone is required'),
  availability: z.object({
    monday: z
      .array(
        z.object({
          start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        })
      )
      .optional(),
    tuesday: z
      .array(
        z.object({
          start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        })
      )
      .optional(),
    wednesday: z
      .array(
        z.object({
          start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        })
      )
      .optional(),
    thursday: z
      .array(
        z.object({
          start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        })
      )
      .optional(),
    friday: z
      .array(
        z.object({
          start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        })
      )
      .optional(),
    saturday: z
      .array(
        z.object({
          start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        })
      )
      .optional(),
    sunday: z
      .array(
        z.object({
          start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        })
      )
      .optional(),
  }),
  videoEnabled: z.boolean(),
  audioEnabled: z.boolean(),
  chatEnabled: z.boolean(),
  inPersonEnabled: z.boolean(),
  inPersonLocation: z.string().max(200).optional(),
});

// Coach search filters
export const coachSearchSchema = z
  .object({
    specialization: specializationsEnum.optional(),
    minRating: z.number().min(0).max(5).optional(),
    maxPrice: z.number().positive().optional(),
    minPrice: z.number().min(0).optional(),
    language: z.string().optional(),
    isAvailable: z.boolean().optional(),
    search: z.string().max(100).optional(),
    timezone: z.string().optional(),
    hasVideo: z.boolean().optional(),
    sortBy: z.enum(['rating', 'price', 'experience', 'sessions']).optional(),
    order: z.enum(['ASC', 'DESC']).optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
  })
  .refine(
    data => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    {
      message: 'Minimum price must be less than maximum price',
      path: ['minPrice'],
    }
  );

// Session booking schema
export const bookSessionSchema = z
  .object({
    coachId: z.number().int().positive(),
    sessionType: sessionTypeEnum,
    scheduledAt: z
      .string()
      .datetime()
      .or(z.date())
      .transform(val => new Date(val)),
    durationMinutes: z
      .number()
      .int()
      .min(30)
      .max(120)
      .refine(val => [30, 45, 60, 90, 120].includes(val), {
        message: 'Duration must be one of: 30, 45, 60, 90, or 120 minutes',
      }),
    title: z.string().min(3, 'Title must be at least 3 characters').max(100),
    description: z.string().max(500).optional(),
    timezone: z.string().min(1, 'Timezone is required'),
    packageId: z.number().int().positive().optional(),
  })
  .refine(
    data => {
      const scheduledDate = new Date(data.scheduledAt);
      const now = new Date();
      return scheduledDate > now;
    },
    {
      message: 'Session must be scheduled in the future',
      path: ['scheduledAt'],
    }
  );

// Session update schema
export const updateSessionSchema = z
  .object({
    scheduledAt: z
      .string()
      .datetime()
      .or(z.date())
      .transform(val => new Date(val))
      .optional(),
    title: z.string().min(3).max(100).optional(),
    description: z.string().max(500).optional(),
    status: sessionStatusEnum.optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine(
    data => {
      if (data.scheduledAt) {
        const scheduledDate = new Date(data.scheduledAt);
        const now = new Date();
        return scheduledDate > now;
      }
      return true;
    },
    {
      message: 'Session must be scheduled in the future',
      path: ['scheduledAt'],
    }
  );

// Cancel session schema
export const cancelSessionSchema = z.object({
  reason: z.string().min(10, 'Please provide a reason for cancellation').max(500),
  requestRefund: z.boolean().optional(),
});

// Session review schema
export const sessionReviewSchema = z.object({
  sessionId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(1000),
  communicationRating: z.number().int().min(1).max(5).optional(),
  knowledgeRating: z.number().int().min(1).max(5).optional(),
  helpfulnessRating: z.number().int().min(1).max(5).optional(),
  wouldRecommend: z.boolean().optional(),
  isAnonymous: z.boolean().optional(),
});

// Coach package schema
export const coachPackageSchema = z.object({
  name: z.string().min(3, 'Package name must be at least 3 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(500),
  sessionCount: z.number().int().min(1).max(100),
  validityDays: z.number().int().min(7).max(365),
  price: z.number().positive(),
  discount: z.number().min(0).max(50).optional(),
  features: z.array(z.string()).min(1, 'Add at least one feature'),
  sessionType: sessionTypeEnum,
  durationMinutes: z
    .number()
    .int()
    .min(30)
    .max(120)
    .refine(val => [30, 45, 60, 90, 120].includes(val), {
      message: 'Duration must be one of: 30, 45, 60, 90, or 120 minutes',
    }),
  maxBookingsPerWeek: z.number().int().min(1).max(7).optional(),
});

// Purchase package schema
export const purchasePackageSchema = z.object({
  packageId: z.number().int().positive(),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  couponCode: z.string().optional(),
});

// Coach availability update
export const updateAvailabilitySchema = z.object({
  date: z.string().datetime().or(z.date()),
  slots: z.array(
    z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      isAvailable: z.boolean(),
    })
  ),
});

// Coach statistics query
export const coachStatsQuerySchema = z
  .object({
    startDate: z.string().datetime().or(z.date()).optional(),
    endDate: z.string().datetime().or(z.date()).optional(),
    metric: z.enum(['sessions', 'revenue', 'ratings', 'clients']).optional(),
  })
  .refine(
    data => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'Start date must be before end date',
      path: ['startDate'],
    }
  );

// Type exports
export type CoachProfileInput = z.infer<typeof coachProfileSchema>;
export type CoachSearchInput = z.infer<typeof coachSearchSchema>;
export type BookSessionInput = z.infer<typeof bookSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CancelSessionInput = z.infer<typeof cancelSessionSchema>;
export type SessionReviewInput = z.infer<typeof sessionReviewSchema>;
export type CoachPackageInput = z.infer<typeof coachPackageSchema>;
export type PurchasePackageInput = z.infer<typeof purchasePackageSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type CoachStatsQueryInput = z.infer<typeof coachStatsQuerySchema>;
