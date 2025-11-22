/**
 * Type declarations for sequelize-typescript
 * Temporary workaround for module resolution issues
 */

declare module 'sequelize-typescript' {
  import { Model as SequelizeModel, DataTypes, ModelType as SequelizeModelType } from 'sequelize';

  export class Model extends SequelizeModel {}
  export { DataTypes as DataType };

  export function Table(options?: unknown): ClassDecorator;
  export function Column(options?: unknown): PropertyDecorator;
  export function PrimaryKey(target: unknown, propertyKey: string): void;
  export function AutoIncrement(target: unknown, propertyKey: string): void;
  export function CreatedAt(target: unknown, propertyKey: string): void;
  export function UpdatedAt(target: unknown, propertyKey: string): void;
  export function ForeignKey(modelGetter: () => typeof Model): PropertyDecorator;
  export function BelongsTo(modelGetter: () => typeof Model, options?: unknown): PropertyDecorator;
  export function HasMany(modelGetter: () => typeof Model, options?: unknown): PropertyDecorator;
  export function HasOne(modelGetter: () => typeof Model, options?: unknown): PropertyDecorator;
  export function BelongsToMany(modelGetter: () => typeof Model, options?: unknown): PropertyDecorator;
  export function AfterCreate(target: unknown, propertyKey: string, descriptor: PropertyDescriptor): void;
  export function AfterUpdate(target: unknown, propertyKey: string, descriptor: PropertyDescriptor): void;
  export function BeforeCreate(target: unknown, propertyKey: string, descriptor: PropertyDescriptor): void;
  export function BeforeUpdate(target: unknown, propertyKey: string, descriptor: PropertyDescriptor): void;

  export interface ModelType<TModelAttributes, TCreationAttributes> extends SequelizeModelType {
    new (): Model<TModelAttributes, TCreationAttributes>;
  }
}