import { Model, Optional } from 'sequelize';
export interface GoalAttributes {
    id: string;
    userId: string;
    title: string;
    description?: string;
    targetDate?: Date;
    category?: string;
    priority: 'low' | 'medium' | 'high';
    status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
    progress: number;
    milestones?: any;
    reminders?: any;
    isArchived: boolean;
    completedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface GoalCreationAttributes extends Optional<GoalAttributes, 'id' | 'description' | 'targetDate' | 'category' | 'priority' | 'status' | 'progress' | 'milestones' | 'reminders' | 'isArchived' | 'completedAt' | 'createdAt' | 'updatedAt'> {
}
export declare class Goal extends Model<GoalAttributes, GoalCreationAttributes> implements GoalAttributes {
    id: string;
    userId: string;
    title: string;
    description?: string;
    targetDate?: Date;
    category?: string;
    priority: 'low' | 'medium' | 'high';
    status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
    progress: number;
    milestones?: any;
    reminders?: any;
    isArchived: boolean;
    completedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static associate(models: any): void;
}
//# sourceMappingURL=Goal.d.ts.map