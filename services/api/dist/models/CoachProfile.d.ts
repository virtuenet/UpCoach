import { Model } from 'sequelize-typescript';
import { CoachSession } from './CoachSession';
import { CoachReview } from './CoachReview';
import { CoachPackage } from './CoachPackage';
interface AvailabilitySchedule {
    monday?: {
        start: string;
        end: string;
    }[];
    tuesday?: {
        start: string;
        end: string;
    }[];
    wednesday?: {
        start: string;
        end: string;
    }[];
    thursday?: {
        start: string;
        end: string;
    }[];
    friday?: {
        start: string;
        end: string;
    }[];
    saturday?: {
        start: string;
        end: string;
    }[];
    sunday?: {
        start: string;
        end: string;
    }[];
}
interface Certification {
    name: string;
    issuer: string;
    date: string;
    verificationUrl?: string;
}
export declare class CoachProfile extends Model {
    id: number;
    userId: number;
    user: any;
    displayName: string;
    title?: string;
    bio?: string;
    specializations: string[];
    certifications: Certification[];
    experienceYears: number;
    languages: string[];
    timezone: string;
    isAvailable: boolean;
    hourlyRate?: number;
    currency: string;
    minBookingHours: number;
    maxBookingHours: number;
    availabilitySchedule: AvailabilitySchedule;
    bookingBufferHours: number;
    profileImageUrl?: string;
    coverImageUrl?: string;
    introVideoUrl?: string;
    galleryImages: string[];
    totalSessions: number;
    totalClients: number;
    averageRating: number;
    ratingCount: number;
    responseTimeHours?: number;
    isVerified: boolean;
    isFeatured: boolean;
    isActive: boolean;
    acceptsInsurance: boolean;
    acceptedPaymentMethods: string[];
    tags: string[];
    seoSlug?: string;
    metadata: any;
    sessions: CoachSession[];
    reviews: CoachReview[];
    packages: CoachPackage[];
    createdAt: Date;
    updatedAt: Date;
    static generateSeoSlug(instance: CoachProfile): void;
    isAvailableAt(date: Date): boolean;
    getNextAvailableSlot(duration?: number): Date | null;
    calculateSessionPrice(durationMinutes: number): number;
    static searchCoaches(filters: {
        specialization?: string;
        minRating?: number;
        maxPrice?: number;
        language?: string;
        isAvailable?: boolean;
        search?: string;
    }): Promise<CoachProfile[]>;
}
export {};
//# sourceMappingURL=CoachProfile.d.ts.map