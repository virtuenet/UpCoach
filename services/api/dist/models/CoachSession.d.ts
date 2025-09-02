import { Model } from 'sequelize-typescript';
import { CoachProfile } from './CoachProfile';
export declare enum SessionType {
    VIDEO = "video",
    AUDIO = "audio",
    CHAT = "chat",
    IN_PERSON = "in-person"
}
export declare enum SessionStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    IN_PROGRESS = "in-progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    REFUNDED = "refunded",
    FAILED = "failed"
}
interface SharedResource {
    name: string;
    url: string;
    type: 'document' | 'video' | 'link' | 'other';
    uploadedAt: Date;
}
export declare class CoachSession extends Model {
    id: number;
    coachId: number;
    coach: CoachProfile;
    clientId: number;
    client: any;
    title: string;
    description?: string;
    sessionType: SessionType;
    status: SessionStatus;
    scheduledAt: Date;
    durationMinutes: number;
    actualStartTime?: Date;
    actualEndTime?: Date;
    timezone: string;
    meetingUrl?: string;
    meetingPassword?: string;
    locationAddress?: string;
    hourlyRate: number;
    totalAmount: number;
    currency: string;
    paymentStatus: PaymentStatus;
    paymentId?: string;
    coachNotes?: string;
    clientNotes?: string;
    sharedResources: SharedResource[];
    clientRating?: number;
    clientFeedback?: string;
    coachRating?: number;
    coachFeedback?: string;
    cancellationReason?: string;
    cancelledBy?: 'coach' | 'client' | 'system';
    cancelledAt?: Date;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
    static calculateTotalAmount(instance: CoachSession): void;
    static updateCoachStats(instance: CoachSession): Promise<void>;
    canBeCancelled(): boolean;
    canBeRescheduled(): boolean;
    cancel(cancelledBy: 'coach' | 'client' | 'system', reason?: string): Promise<void>;
    startSession(): Promise<void>;
    endSession(): Promise<void>;
    static getUpcomingSessions(userId: number, role: 'coach' | 'client'): Promise<CoachSession[]>;
    static checkConflicts(coachId: number, scheduledAt: Date, durationMinutes: number): Promise<boolean>;
}
export {};
//# sourceMappingURL=CoachSession.d.ts.map