import { Model, Optional } from 'sequelize';
export interface ChatMessageAttributes {
    id: string;
    chatId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: any;
    parentMessageId?: string;
    isEdited: boolean;
    editedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ChatMessageCreationAttributes extends Optional<ChatMessageAttributes, 'id' | 'metadata' | 'parentMessageId' | 'isEdited' | 'editedAt' | 'createdAt' | 'updatedAt'> {
}
export declare class ChatMessage extends Model<ChatMessageAttributes, ChatMessageCreationAttributes> implements ChatMessageAttributes {
    id: string;
    chatId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: any;
    parentMessageId?: string;
    isEdited: boolean;
    editedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static associate(models: any): void;
}
//# sourceMappingURL=ChatMessage.d.ts.map