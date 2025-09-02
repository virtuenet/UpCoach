import { Model, Optional } from 'sequelize';
export interface MoodAttributes {
    id: string;
    userId: string;
    mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
    moodScore: number;
    notes?: string;
    activities?: string[];
    emotions?: string[];
    physicalSymptoms?: string[];
    sleepQuality?: 'excellent' | 'good' | 'fair' | 'poor' | 'terrible';
    stressLevel?: number;
    energyLevel?: number;
    location?: string;
    weather?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface MoodCreationAttributes extends Optional<MoodAttributes, 'id' | 'notes' | 'activities' | 'emotions' | 'physicalSymptoms' | 'sleepQuality' | 'stressLevel' | 'energyLevel' | 'location' | 'weather' | 'createdAt' | 'updatedAt'> {
}
export declare class Mood extends Model<MoodAttributes, MoodCreationAttributes> implements MoodAttributes {
    id: string;
    userId: string;
    mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
    moodScore: number;
    notes?: string;
    activities?: string[];
    emotions?: string[];
    physicalSymptoms?: string[];
    sleepQuality?: 'excellent' | 'good' | 'fair' | 'poor' | 'terrible';
    stressLevel?: number;
    energyLevel?: number;
    location?: string;
    weather?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static associate(models: any): void;
}
//# sourceMappingURL=Mood.d.ts.map