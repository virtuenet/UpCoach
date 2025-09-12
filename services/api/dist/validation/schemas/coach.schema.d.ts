import { z } from 'zod';
export declare const coachProfileSchema: z.ZodObject<{
    displayName: z.ZodString;
    bio: z.ZodString;
    specializations: z.ZodArray<z.ZodEnum<["life_coaching", "career_coaching", "business_coaching", "health_wellness", "relationship_coaching", "financial_coaching", "executive_coaching", "performance_coaching", "mindfulness_meditation", "leadership_development", "personal_development", "nutrition_fitness"]>, "many">;
    experience: z.ZodNumber;
    education: z.ZodOptional<z.ZodArray<z.ZodObject<{
        degree: z.ZodString;
        institution: z.ZodString;
        year: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        year: number;
        degree: string;
        institution: string;
    }, {
        year: number;
        degree: string;
        institution: string;
    }>, "many">>;
    certifications: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        issuer: z.ZodString;
        year: z.ZodNumber;
        verificationUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        year: number;
        issuer: string;
        verificationUrl?: string | undefined;
    }, {
        name: string;
        year: number;
        issuer: string;
        verificationUrl?: string | undefined;
    }>, "many">>;
    languages: z.ZodArray<z.ZodString, "many">;
    hourlyRate: z.ZodNumber;
    currency: z.ZodDefault<z.ZodEnum<["USD", "EUR", "GBP", "CAD", "AUD"]>>;
    timezone: z.ZodString;
    availability: z.ZodObject<{
        monday: z.ZodOptional<z.ZodArray<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            end: string;
            start: string;
        }, {
            end: string;
            start: string;
        }>, "many">>;
        tuesday: z.ZodOptional<z.ZodArray<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            end: string;
            start: string;
        }, {
            end: string;
            start: string;
        }>, "many">>;
        wednesday: z.ZodOptional<z.ZodArray<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            end: string;
            start: string;
        }, {
            end: string;
            start: string;
        }>, "many">>;
        thursday: z.ZodOptional<z.ZodArray<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            end: string;
            start: string;
        }, {
            end: string;
            start: string;
        }>, "many">>;
        friday: z.ZodOptional<z.ZodArray<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            end: string;
            start: string;
        }, {
            end: string;
            start: string;
        }>, "many">>;
        saturday: z.ZodOptional<z.ZodArray<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            end: string;
            start: string;
        }, {
            end: string;
            start: string;
        }>, "many">>;
        sunday: z.ZodOptional<z.ZodArray<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            end: string;
            start: string;
        }, {
            end: string;
            start: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        sunday?: {
            end: string;
            start: string;
        }[] | undefined;
        monday?: {
            end: string;
            start: string;
        }[] | undefined;
        tuesday?: {
            end: string;
            start: string;
        }[] | undefined;
        wednesday?: {
            end: string;
            start: string;
        }[] | undefined;
        thursday?: {
            end: string;
            start: string;
        }[] | undefined;
        friday?: {
            end: string;
            start: string;
        }[] | undefined;
        saturday?: {
            end: string;
            start: string;
        }[] | undefined;
    }, {
        sunday?: {
            end: string;
            start: string;
        }[] | undefined;
        monday?: {
            end: string;
            start: string;
        }[] | undefined;
        tuesday?: {
            end: string;
            start: string;
        }[] | undefined;
        wednesday?: {
            end: string;
            start: string;
        }[] | undefined;
        thursday?: {
            end: string;
            start: string;
        }[] | undefined;
        friday?: {
            end: string;
            start: string;
        }[] | undefined;
        saturday?: {
            end: string;
            start: string;
        }[] | undefined;
    }>;
    videoEnabled: z.ZodBoolean;
    audioEnabled: z.ZodBoolean;
    chatEnabled: z.ZodBoolean;
    inPersonEnabled: z.ZodBoolean;
    inPersonLocation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    bio: string;
    currency: "USD" | "EUR" | "GBP" | "CAD" | "AUD";
    timezone: string;
    availability: {
        sunday?: {
            end: string;
            start: string;
        }[] | undefined;
        monday?: {
            end: string;
            start: string;
        }[] | undefined;
        tuesday?: {
            end: string;
            start: string;
        }[] | undefined;
        wednesday?: {
            end: string;
            start: string;
        }[] | undefined;
        thursday?: {
            end: string;
            start: string;
        }[] | undefined;
        friday?: {
            end: string;
            start: string;
        }[] | undefined;
        saturday?: {
            end: string;
            start: string;
        }[] | undefined;
    };
    displayName: string;
    specializations: ("life_coaching" | "career_coaching" | "business_coaching" | "health_wellness" | "relationship_coaching" | "financial_coaching" | "executive_coaching" | "performance_coaching" | "mindfulness_meditation" | "leadership_development" | "personal_development" | "nutrition_fitness")[];
    languages: string[];
    hourlyRate: number;
    experience: number;
    videoEnabled: boolean;
    audioEnabled: boolean;
    chatEnabled: boolean;
    inPersonEnabled: boolean;
    education?: {
        year: number;
        degree: string;
        institution: string;
    }[] | undefined;
    certifications?: {
        name: string;
        year: number;
        issuer: string;
        verificationUrl?: string | undefined;
    }[] | undefined;
    inPersonLocation?: string | undefined;
}, {
    bio: string;
    timezone: string;
    availability: {
        sunday?: {
            end: string;
            start: string;
        }[] | undefined;
        monday?: {
            end: string;
            start: string;
        }[] | undefined;
        tuesday?: {
            end: string;
            start: string;
        }[] | undefined;
        wednesday?: {
            end: string;
            start: string;
        }[] | undefined;
        thursday?: {
            end: string;
            start: string;
        }[] | undefined;
        friday?: {
            end: string;
            start: string;
        }[] | undefined;
        saturday?: {
            end: string;
            start: string;
        }[] | undefined;
    };
    displayName: string;
    specializations: ("life_coaching" | "career_coaching" | "business_coaching" | "health_wellness" | "relationship_coaching" | "financial_coaching" | "executive_coaching" | "performance_coaching" | "mindfulness_meditation" | "leadership_development" | "personal_development" | "nutrition_fitness")[];
    languages: string[];
    hourlyRate: number;
    experience: number;
    videoEnabled: boolean;
    audioEnabled: boolean;
    chatEnabled: boolean;
    inPersonEnabled: boolean;
    education?: {
        year: number;
        degree: string;
        institution: string;
    }[] | undefined;
    currency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD" | undefined;
    certifications?: {
        name: string;
        year: number;
        issuer: string;
        verificationUrl?: string | undefined;
    }[] | undefined;
    inPersonLocation?: string | undefined;
}>;
export declare const coachSearchSchema: z.ZodEffects<z.ZodObject<{
    specialization: z.ZodOptional<z.ZodEnum<["life_coaching", "career_coaching", "business_coaching", "health_wellness", "relationship_coaching", "financial_coaching", "executive_coaching", "performance_coaching", "mindfulness_meditation", "leadership_development", "personal_development", "nutrition_fitness"]>>;
    minRating: z.ZodOptional<z.ZodNumber>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
    minPrice: z.ZodOptional<z.ZodNumber>;
    language: z.ZodOptional<z.ZodString>;
    isAvailable: z.ZodOptional<z.ZodBoolean>;
    search: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    hasVideo: z.ZodOptional<z.ZodBoolean>;
    sortBy: z.ZodOptional<z.ZodEnum<["rating", "price", "experience", "sessions"]>>;
    order: z.ZodOptional<z.ZodEnum<["ASC", "DESC"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    search?: string | undefined;
    order?: "ASC" | "DESC" | undefined;
    language?: string | undefined;
    timezone?: string | undefined;
    sortBy?: "price" | "rating" | "sessions" | "experience" | undefined;
    isAvailable?: boolean | undefined;
    specialization?: "life_coaching" | "career_coaching" | "business_coaching" | "health_wellness" | "relationship_coaching" | "financial_coaching" | "executive_coaching" | "performance_coaching" | "mindfulness_meditation" | "leadership_development" | "personal_development" | "nutrition_fitness" | undefined;
    minRating?: number | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    hasVideo?: boolean | undefined;
}, {
    search?: string | undefined;
    limit?: number | undefined;
    order?: "ASC" | "DESC" | undefined;
    language?: string | undefined;
    timezone?: string | undefined;
    page?: number | undefined;
    sortBy?: "price" | "rating" | "sessions" | "experience" | undefined;
    isAvailable?: boolean | undefined;
    specialization?: "life_coaching" | "career_coaching" | "business_coaching" | "health_wellness" | "relationship_coaching" | "financial_coaching" | "executive_coaching" | "performance_coaching" | "mindfulness_meditation" | "leadership_development" | "personal_development" | "nutrition_fitness" | undefined;
    minRating?: number | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    hasVideo?: boolean | undefined;
}>, {
    limit: number;
    page: number;
    search?: string | undefined;
    order?: "ASC" | "DESC" | undefined;
    language?: string | undefined;
    timezone?: string | undefined;
    sortBy?: "price" | "rating" | "sessions" | "experience" | undefined;
    isAvailable?: boolean | undefined;
    specialization?: "life_coaching" | "career_coaching" | "business_coaching" | "health_wellness" | "relationship_coaching" | "financial_coaching" | "executive_coaching" | "performance_coaching" | "mindfulness_meditation" | "leadership_development" | "personal_development" | "nutrition_fitness" | undefined;
    minRating?: number | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    hasVideo?: boolean | undefined;
}, {
    search?: string | undefined;
    limit?: number | undefined;
    order?: "ASC" | "DESC" | undefined;
    language?: string | undefined;
    timezone?: string | undefined;
    page?: number | undefined;
    sortBy?: "price" | "rating" | "sessions" | "experience" | undefined;
    isAvailable?: boolean | undefined;
    specialization?: "life_coaching" | "career_coaching" | "business_coaching" | "health_wellness" | "relationship_coaching" | "financial_coaching" | "executive_coaching" | "performance_coaching" | "mindfulness_meditation" | "leadership_development" | "personal_development" | "nutrition_fitness" | undefined;
    minRating?: number | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    hasVideo?: boolean | undefined;
}>;
export declare const bookSessionSchema: z.ZodEffects<z.ZodObject<{
    coachId: z.ZodNumber;
    sessionType: z.ZodEnum<["video", "audio", "chat", "in-person"]>;
    scheduledAt: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>;
    durationMinutes: z.ZodEffects<z.ZodNumber, number, number>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    timezone: z.ZodString;
    packageId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title: string;
    timezone: string;
    scheduledAt: Date;
    sessionType: "video" | "audio" | "chat" | "in-person";
    coachId: number;
    durationMinutes: number;
    description?: string | undefined;
    packageId?: number | undefined;
}, {
    title: string;
    timezone: string;
    scheduledAt: string | Date;
    sessionType: "video" | "audio" | "chat" | "in-person";
    coachId: number;
    durationMinutes: number;
    description?: string | undefined;
    packageId?: number | undefined;
}>, {
    title: string;
    timezone: string;
    scheduledAt: Date;
    sessionType: "video" | "audio" | "chat" | "in-person";
    coachId: number;
    durationMinutes: number;
    description?: string | undefined;
    packageId?: number | undefined;
}, {
    title: string;
    timezone: string;
    scheduledAt: string | Date;
    sessionType: "video" | "audio" | "chat" | "in-person";
    coachId: number;
    durationMinutes: number;
    description?: string | undefined;
    packageId?: number | undefined;
}>;
export declare const updateSessionSchema: z.ZodEffects<z.ZodObject<{
    scheduledAt: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["scheduled", "in-progress", "completed", "cancelled", "no-show"]>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show" | undefined;
    description?: string | undefined;
    title?: string | undefined;
    notes?: string | undefined;
    scheduledAt?: Date | undefined;
}, {
    status?: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show" | undefined;
    description?: string | undefined;
    title?: string | undefined;
    notes?: string | undefined;
    scheduledAt?: string | Date | undefined;
}>, {
    status?: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show" | undefined;
    description?: string | undefined;
    title?: string | undefined;
    notes?: string | undefined;
    scheduledAt?: Date | undefined;
}, {
    status?: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show" | undefined;
    description?: string | undefined;
    title?: string | undefined;
    notes?: string | undefined;
    scheduledAt?: string | Date | undefined;
}>;
export declare const cancelSessionSchema: z.ZodObject<{
    reason: z.ZodString;
    requestRefund: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    reason: string;
    requestRefund?: boolean | undefined;
}, {
    reason: string;
    requestRefund?: boolean | undefined;
}>;
export declare const sessionReviewSchema: z.ZodObject<{
    sessionId: z.ZodNumber;
    rating: z.ZodNumber;
    comment: z.ZodString;
    communicationRating: z.ZodOptional<z.ZodNumber>;
    knowledgeRating: z.ZodOptional<z.ZodNumber>;
    helpfulnessRating: z.ZodOptional<z.ZodNumber>;
    wouldRecommend: z.ZodOptional<z.ZodBoolean>;
    isAnonymous: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    comment: string;
    sessionId: number;
    rating: number;
    communicationRating?: number | undefined;
    knowledgeRating?: number | undefined;
    helpfulnessRating?: number | undefined;
    wouldRecommend?: boolean | undefined;
    isAnonymous?: boolean | undefined;
}, {
    comment: string;
    sessionId: number;
    rating: number;
    communicationRating?: number | undefined;
    knowledgeRating?: number | undefined;
    helpfulnessRating?: number | undefined;
    wouldRecommend?: boolean | undefined;
    isAnonymous?: boolean | undefined;
}>;
export declare const coachPackageSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    sessionCount: z.ZodNumber;
    validityDays: z.ZodNumber;
    price: z.ZodNumber;
    discount: z.ZodOptional<z.ZodNumber>;
    features: z.ZodArray<z.ZodString, "many">;
    sessionType: z.ZodEnum<["video", "audio", "chat", "in-person"]>;
    durationMinutes: z.ZodEffects<z.ZodNumber, number, number>;
    maxBookingsPerWeek: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    price: number;
    sessionType: "video" | "audio" | "chat" | "in-person";
    durationMinutes: number;
    sessionCount: number;
    validityDays: number;
    features: string[];
    discount?: number | undefined;
    maxBookingsPerWeek?: number | undefined;
}, {
    name: string;
    description: string;
    price: number;
    sessionType: "video" | "audio" | "chat" | "in-person";
    durationMinutes: number;
    sessionCount: number;
    validityDays: number;
    features: string[];
    discount?: number | undefined;
    maxBookingsPerWeek?: number | undefined;
}>;
export declare const purchasePackageSchema: z.ZodObject<{
    packageId: z.ZodNumber;
    paymentMethodId: z.ZodString;
    couponCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    packageId: number;
    paymentMethodId: string;
    couponCode?: string | undefined;
}, {
    packageId: number;
    paymentMethodId: string;
    couponCode?: string | undefined;
}>;
export declare const updateAvailabilitySchema: z.ZodObject<{
    date: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    slots: z.ZodArray<z.ZodObject<{
        start: z.ZodString;
        end: z.ZodString;
        isAvailable: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        end: string;
        start: string;
        isAvailable: boolean;
    }, {
        end: string;
        start: string;
        isAvailable: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    date: string | Date;
    slots: {
        end: string;
        start: string;
        isAvailable: boolean;
    }[];
}, {
    date: string | Date;
    slots: {
        end: string;
        start: string;
        isAvailable: boolean;
    }[];
}>;
export declare const coachStatsQuerySchema: z.ZodEffects<z.ZodObject<{
    startDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    endDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    metric: z.ZodOptional<z.ZodEnum<["sessions", "revenue", "ratings", "clients"]>>;
}, "strip", z.ZodTypeAny, {
    endDate?: string | Date | undefined;
    startDate?: string | Date | undefined;
    metric?: "revenue" | "sessions" | "ratings" | "clients" | undefined;
}, {
    endDate?: string | Date | undefined;
    startDate?: string | Date | undefined;
    metric?: "revenue" | "sessions" | "ratings" | "clients" | undefined;
}>, {
    endDate?: string | Date | undefined;
    startDate?: string | Date | undefined;
    metric?: "revenue" | "sessions" | "ratings" | "clients" | undefined;
}, {
    endDate?: string | Date | undefined;
    startDate?: string | Date | undefined;
    metric?: "revenue" | "sessions" | "ratings" | "clients" | undefined;
}>;
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
//# sourceMappingURL=coach.schema.d.ts.map