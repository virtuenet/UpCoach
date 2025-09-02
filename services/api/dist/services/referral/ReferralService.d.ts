import { Transaction } from 'sequelize';
interface Referral {
    id: number;
    referrerId: number;
    refereeId?: number;
    code: string;
    status: 'pending' | 'completed' | 'expired' | 'cancelled';
    rewardStatus: 'pending' | 'paid' | 'failed';
    referrerReward?: number;
    refereeReward?: number;
    programId: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    completedAt?: Date;
    expiresAt: Date;
}
export declare class ReferralService {
    private programs;
    private referrals;
    constructor();
    private initializePrograms;
    createReferralCode(userId: number, programId?: string): Promise<Referral>;
    applyReferralCode(refereeId: number, code: string, transaction?: Transaction): Promise<{
        success: boolean;
        discount?: number;
        message: string;
    }>;
    getUserReferralStats(userId: number): Promise<{
        totalReferrals: number;
        successfulReferrals: number;
        totalEarnings: number;
        pendingEarnings: number;
        referralCode?: string;
        referrals: Referral[];
    }>;
    processReferrerReward(refereeId: number, paymentAmount: number): Promise<void>;
    getOverallStats(): Promise<{
        totalReferrals: number;
        activeReferrals: number;
        completedReferrals: number;
        totalEarnings: number;
        pendingPayouts: number;
        conversionRate: number;
    }>;
    getReferralLeaderboard(period?: 'week' | 'month' | 'all'): Promise<Array<{
        userId: number;
        userName: string;
        referralCount: number;
        totalEarnings: number;
        rank: number;
    }>>;
    private checkEligibility;
    private generateUniqueCode;
    private validateReferralCode;
    private applyRefereeReward;
    private applyReferrerReward;
    private scheduleReferrerReward;
    private sendReferralNotifications;
    private sendRewardNotification;
    private formatReward;
    private getLeaderboardStartDate;
    private saveReferralToDatabase;
    private updateReferralInDatabase;
    private getReferralByCode;
    private getReferralByReferee;
    private getUserReferrals;
    private countUserRewards;
    private getUserTotalEarnings;
}
export declare const referralService: ReferralService;
export {};
//# sourceMappingURL=ReferralService.d.ts.map