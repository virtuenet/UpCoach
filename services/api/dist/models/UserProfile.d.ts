import { Model, Optional } from 'sequelize';
export interface UserProfileAttributes {
    id: string;
    userId: string;
    age?: number;
    occupation?: string;
    timezone?: string;
    coachingStyle?: string;
    sessionFrequency?: string;
    commitmentLevel?: string;
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'balanced';
    communicationPreference?: 'supportive' | 'direct' | 'analytical' | 'motivational' | 'empathetic';
    personalityType?: string;
    aiPersonalization?: any;
    coachingPreferences?: {
        preferredMethods: string[];
        sessionFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
        sessionDuration: number;
        preferredTimes: string[];
        focusAreas: string[];
    };
    behaviorPatterns?: {
        avgSessionDuration: number;
        completionRate: number;
        engagementLevel: number;
        preferredTopics: string[];
        responseTime: number;
        consistencyScore: number;
    };
    progressMetrics?: {
        totalGoalsSet: number;
        goalsCompleted: number;
        currentStreak: number;
        longestStreak: number;
        totalSessions: number;
        accountAge: number;
        lastActiveDate: Date;
    };
    strengths?: string[];
    growthAreas?: string[];
    motivators?: string[];
    obstacles?: string[];
    preferences?: any;
    metadata?: any;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface UserProfileCreationAttributes extends Optional<UserProfileAttributes, 'id' | 'age' | 'occupation' | 'timezone' | 'coachingStyle' | 'sessionFrequency' | 'commitmentLevel' | 'learningStyle' | 'communicationPreference' | 'personalityType' | 'aiPersonalization' | 'coachingPreferences' | 'behaviorPatterns' | 'progressMetrics' | 'strengths' | 'growthAreas' | 'motivators' | 'obstacles' | 'preferences' | 'metadata' | 'createdAt' | 'updatedAt'> {
}
export declare class UserProfile extends Model<UserProfileAttributes, UserProfileCreationAttributes> implements UserProfileAttributes {
    id: string;
    userId: string;
    age?: number;
    occupation?: string;
    timezone?: string;
    coachingStyle?: string;
    sessionFrequency?: string;
    commitmentLevel?: string;
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'balanced';
    communicationPreference?: 'supportive' | 'direct' | 'analytical' | 'motivational' | 'empathetic';
    personalityType?: string;
    aiPersonalization?: any;
    coachingPreferences?: {
        preferredMethods: string[];
        sessionFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
        sessionDuration: number;
        preferredTimes: string[];
        focusAreas: string[];
    };
    behaviorPatterns?: {
        avgSessionDuration: number;
        completionRate: number;
        engagementLevel: number;
        preferredTopics: string[];
        responseTime: number;
        consistencyScore: number;
    };
    progressMetrics?: {
        totalGoalsSet: number;
        goalsCompleted: number;
        currentStreak: number;
        longestStreak: number;
        totalSessions: number;
        accountAge: number;
        lastActiveDate: Date;
    };
    strengths?: string[];
    growthAreas?: string[];
    motivators?: string[];
    obstacles?: string[];
    preferences?: any;
    metadata?: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default UserProfile;
//# sourceMappingURL=UserProfile.d.ts.map