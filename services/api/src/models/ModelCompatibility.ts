/**
 * Model compatibility layer to bridge sequelize and sequelize-typescript models
 */

import { Model as SequelizeModel } from 'sequelize';
// import { Model as SequelizeTypescriptModel } from 'sequelize-typescript';

// Type to make regular sequelize models compatible with sequelize-typescript
export type CompatibleModel<T extends SequelizeModel> = T & {
  new (...args: any[]): T;
};

// Helper to cast regular sequelize models for use with sequelize-typescript decorators
export function makeCompatible<T extends typeof SequelizeModel>(model: T): any {
  return model as any;
}

// Re-export commonly used models with compatibility
export { User as UserModel } from './User';
export { Goal as GoalModel } from './Goal';
export { Task as TaskModel } from './Task';
export { Mood as MoodModel } from './Mood';
export { Chat as ChatModel } from './Chat';
export { ChatMessage as ChatMessageModel } from './ChatMessage';
