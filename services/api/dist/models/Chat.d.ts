import { Model, Optional } from 'sequelize';
export interface ChatAttributes {
    id: string;
    userId: string;
    title?: string;
    type: 'general' | 'goal' | 'task' | 'mood' | 'coaching';
    context?: any;
    isActive: boolean;
    lastMessageAt?: Date;
    messageCount: number;
    metadata?: any;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ChatCreationAttributes extends Optional<ChatAttributes, 'id' | 'title' | 'type' | 'context' | 'isActive' | 'lastMessageAt' | 'messageCount' | 'metadata' | 'createdAt' | 'updatedAt'> {
}
export declare class Chat extends Model<ChatAttributes, ChatCreationAttributes> implements ChatAttributes {
    id: string;
    userId: string;
    title?: string;
    type: 'general' | 'goal' | 'task' | 'mood' | 'coaching';
    context?: any;
    isActive: boolean;
    lastMessageAt?: Date;
    messageCount: number;
    metadata?: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static associate(models: any): void;
}
//# sourceMappingURL=Chat.d.ts.map