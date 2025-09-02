import { Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, NonAttribute } from 'sequelize';
import { User } from './User';
export declare class Referral extends Model<InferAttributes<Referral>, InferCreationAttributes<Referral>> {
    id: CreationOptional<number>;
    referrerId: ForeignKey<User['id']>;
    refereeId: ForeignKey<User['id']> | null;
    code: string;
    programId: string;
    status: 'pending' | 'completed' | 'expired' | 'cancelled';
    rewardStatus: 'pending' | 'paid' | 'failed';
    referrerReward: number | null;
    refereeReward: number | null;
    metadata: any;
    completedAt: Date | null;
    expiresAt: Date;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
    referrer?: NonAttribute<User>;
    referee?: NonAttribute<User>;
    isExpired(): boolean;
    isActive(): boolean;
    canBeUsed(userId: string): boolean;
    static findByCode(code: string): Promise<Referral | null>;
    static findActiveByUser(userId: number): Promise<Referral | null>;
    static getUserStats(userId: number): Promise<{
        totalReferrals: number;
        completedReferrals: number;
        totalEarnings: number;
        pendingEarnings: number;
    }>;
    static getLeaderboard(period?: 'week' | 'month' | 'year' | 'all', limit?: number): Promise<Array<{
        userId: number;
        userName: string;
        referralCount: number;
        totalEarnings: number;
    }>>;
}
export default Referral;
//# sourceMappingURL=Referral.d.ts.map