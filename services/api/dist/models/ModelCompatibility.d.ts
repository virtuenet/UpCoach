/**
 * Model compatibility layer to bridge sequelize and sequelize-typescript models
 */
import { Model as SequelizeModel } from 'sequelize';
export type CompatibleModel<T extends SequelizeModel> = T & {
    new (...args: any[]): T;
};
export declare function makeCompatible<T extends typeof SequelizeModel>(model: T): any;
export { User as UserModel } from './User';
export { Goal as GoalModel } from './Goal';
export { Task as TaskModel } from './Task';
export { Mood as MoodModel } from './Mood';
export { Chat as ChatModel } from './Chat';
export { ChatMessage as ChatMessageModel } from './ChatMessage';
//# sourceMappingURL=ModelCompatibility.d.ts.map