import { CoachProfile } from '../../models/CoachProfile';
import { CoachSession, SessionType } from '../../models/CoachSession';
import { CoachReview } from '../../models/CoachReview';
import { CoachPackage, ClientCoachPackage } from '../../models/CoachPackage';
import { Transaction } from 'sequelize';
interface CoachSearchFilters {
    specialization?: string;
    minRating?: number;
    maxPrice?: number;
    minPrice?: number;
    language?: string;
    isAvailable?: boolean;
    search?: string;
    timezone?: string;
    hasVideo?: boolean;
    sortBy?: 'rating' | 'price' | 'experience' | 'sessions';
    order?: 'ASC' | 'DESC';
}
interface BookingRequest {
    coachId: number;
    clientId: number;
    sessionType: SessionType;
    scheduledAt: Date;
    durationMinutes: number;
    title: string;
    description?: string;
    timezone: string;
    packageId?: number;
}
interface AvailabilitySlot {
    date: Date;
    startTime: string;
    endTime: string;
    available: boolean;
}
export declare class CoachService {
    searchCoaches(filters: CoachSearchFilters, page?: number, limit?: number): Promise<{
        coaches: CoachProfile[];
        total: number;
        pages: number;
    }>;
    getCoachDetails(coachId: number): Promise<CoachProfile | null>;
    getCoachAvailability(coachId: number, startDate: Date, endDate: Date): Promise<AvailabilitySlot[]>;
    bookSession(booking: BookingRequest, transaction?: Transaction): Promise<CoachSession>;
    processSessionPayment(sessionId: number, paymentMethodId: string): Promise<void>;
    submitReview(sessionId: number, clientId: number, reviewData: {
        rating: number;
        title?: string;
        comment: string;
        communicationRating?: number;
        knowledgeRating?: number;
        helpfulnessRating?: number;
    }): Promise<CoachReview>;
    purchasePackage(packageId: number, clientId: number, paymentMethodId: string): Promise<ClientCoachPackage>;
    getCoachPackages(coachId: number): Promise<CoachPackage[]>;
    getClientSessions(clientId: number, status?: string, page?: number, limit?: number): Promise<{
        sessions: CoachSession[];
        total: number;
        pages: number;
    }>;
    cancelSession(sessionId: number, userId: number, userRole: string, reason?: string): Promise<void>;
    getMarketplaceStats(): Promise<any>;
    private getSessionsOverTime;
    getCoachDashboard(coachId: number): Promise<{
        profile: CoachProfile;
        stats: {
            totalSessions: number;
            upcomingSessions: number;
            totalEarnings: number;
            pendingEarnings: number;
            averageRating: number;
            totalReviews: number;
        };
        upcomingSessions: CoachSession[];
        recentReviews: CoachReview[];
        activePackages: CoachPackage[];
    }>;
    private calculateCoachEarnings;
    private getOrCreateStripeCustomer;
    private sendBookingConfirmationEmails;
    private sendPaymentConfirmationEmails;
    private sendPackagePurchaseEmail;
    private sendCancellationEmails;
}
export declare const coachService: CoachService;
export {};
//# sourceMappingURL=CoachService.d.ts.map