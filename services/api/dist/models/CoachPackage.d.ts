import { Model } from 'sequelize-typescript';
import { CoachProfile } from './CoachProfile';
export declare class CoachPackage extends Model {
    id: number;
    coachId: number;
    coach: CoachProfile;
    name: string;
    description?: string;
    sessionCount: number;
    validityDays: number;
    price: number;
    currency: string;
    originalPrice?: number;
    discountPercentage?: number;
    maxPurchasesPerClient: number;
    totalAvailable?: number;
    totalSold: number;
    isActive: boolean;
    clientPackages: ClientCoachPackage[];
    createdAt: Date;
    updatedAt: Date;
    static calculateDiscounts(instance: CoachPackage): void;
    isAvailable(): boolean;
    getSavingsAmount(): number;
    canBePurchasedBy(clientId: number): Promise<boolean>;
    recordPurchase(): Promise<void>;
    static getActivePackages(coachId: number): Promise<CoachPackage[]>;
    static calculateBestValue(coachId: number, sessionCount: number): Promise<{
        regularPrice: number;
        packagePrice: number;
        savings: number;
    } | null>;
}
export declare class ClientCoachPackage extends Model {
    id: number;
    packageId: number;
    package: CoachPackage;
    clientId: number;
    client: any;
    purchaseDate: Date;
    expiryDate: Date;
    sessionsUsed: number;
    sessionsRemaining: number;
    paymentId?: string;
    amountPaid: number;
    status: 'active' | 'expired' | 'cancelled';
    isValid(): boolean;
    useSession(): Promise<void>;
    refundSession(): Promise<void>;
    getDaysRemaining(): number;
    static getActivePackagesForClient(clientId: number): Promise<ClientCoachPackage[]>;
    static checkExpiredPackages(): Promise<void>;
}
//# sourceMappingURL=CoachPackage.d.ts.map