/**
 * Type declarations for sequelize-typescript
 * Temporary workaround for module resolution issues
 */

declare module 'sequelize-typescript' {
  import { Model as SequelizeModel, DataTypes, ModelType as SequelizeModelType } from 'sequelize';

  export class Model extends SequelizeModel {}
  export { DataTypes as DataType };

  export function Table(options?: any): ClassDecorator;
  export function Column(options?: any): PropertyDecorator;
  export function PrimaryKey(target: any, propertyKey: string): void;
  export function AutoIncrement(target: any, propertyKey: string): void;
  export function CreatedAt(target: any, propertyKey: string): void;
  export function UpdatedAt(target: any, propertyKey: string): void;
  export function ForeignKey(modelGetter: () => typeof Model): PropertyDecorator;
  export function BelongsTo(modelGetter: () => typeof Model, options?: any): PropertyDecorator;
  export function HasMany(modelGetter: () => typeof Model, options?: any): PropertyDecorator;
  export function HasOne(modelGetter: () => typeof Model, options?: any): PropertyDecorator;
  export function BelongsToMany(modelGetter: () => typeof Model, options?: any): PropertyDecorator;
  export function AfterCreate(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
  export function AfterUpdate(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
  export function BeforeCreate(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
  export function BeforeUpdate(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;

  export interface ModelType<TModelAttributes, TCreationAttributes> extends SequelizeModelType {
    new (): Model<TModelAttributes, TCreationAttributes>;
  }
}