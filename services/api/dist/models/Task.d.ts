import { Model, Optional } from 'sequelize';
export interface TaskAttributes {
    id: string;
    userId: string;
    goalId?: string;
    title: string;
    description?: string;
    dueDate?: Date;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    category?: string;
    tags?: string[];
    estimatedTime?: number;
    actualTime?: number;
    isRecurring: boolean;
    recurringPattern?: any;
    completedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'goalId' | 'description' | 'dueDate' | 'priority' | 'status' | 'category' | 'tags' | 'estimatedTime' | 'actualTime' | 'isRecurring' | 'recurringPattern' | 'completedAt' | 'createdAt' | 'updatedAt'> {
}
export declare class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
    id: string;
    userId: string;
    goalId?: string;
    title: string;
    description?: string;
    dueDate?: Date;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    category?: string;
    tags?: string[];
    estimatedTime?: number;
    actualTime?: number;
    isRecurring: boolean;
    recurringPattern?: any;
    completedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static associate(models: any): void;
}
//# sourceMappingURL=Task.d.ts.map