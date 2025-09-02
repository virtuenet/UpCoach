import { Transaction } from 'sequelize';
interface AchievementProgress {
    achievementId: number;
    currentProgress: number;
    targetProgress: number;
    percentComplete: number;
    isUnlocked: boolean;
}
interface UserStats {
    level: number;
    totalPoints: number;
    currentPoints: number;
    nextLevelPoints: number;
    levelProgress: number;
    achievementsUnlocked: number;
    currentStreak: number;
    rank?: number;
}
export declare class GamificationService {
    initializeUser(userId: number, transaction?: Transaction): Promise<void>;
    awardPoints(userId: number, points: number, reason: string, transaction?: Transaction): Promise<void>;
    private checkLevelUp;
    private onLevelUp;
    trackProgress(userId: number, category: string, value?: number, metadata?: any): Promise<void>;
    private updateAchievementProgress;
    private unlockAchievement;
    updateStreak(userId: number, streakType: string, activityDate?: Date): Promise<void>;
    private checkStreakAchievements;
    getUserStats(userId: number): Promise<UserStats>;
    getUserAchievements(userId: number, category?: string): Promise<AchievementProgress[]>;
    createChallenge(challengeData: {
        name: string;
        description: string;
        type: string;
        startDate: Date;
        endDate: Date;
        requirements: any[];
        rewardPoints: number;
    }): Promise<number>;
    joinChallenge(userId: number, challengeId: number): Promise<void>;
    updateChallengeProgress(userId: number, challengeId: number, requirementIndex: number, progress: number): Promise<void>;
    private onChallengeComplete;
    getLeaderboard(type: 'points' | 'achievements' | 'streaks' | 'level', period?: 'all_time' | 'monthly' | 'weekly' | 'daily', limit?: number): Promise<any[]>;
    purchaseReward(userId: number, rewardItemId: number): Promise<void>;
    private getUserEmail;
    private notifyAchievementUnlock;
    checkAchievement(userId: number, achievementType: string, value: number): Promise<void>;
}
export declare const gamificationService: GamificationService;
export {};
//# sourceMappingURL=GamificationService.d.ts.map