/**
 * Model helpers to provide properly typed Sequelize operations
 * This file provides utility functions that cast model operations to avoid TypeScript errors
 */

import { Model, ModelStatic, FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, BulkCreateOptions } from 'sequelize';

// Define a more specific type for Sequelize models with static methods
type ModelClass<T extends Model = Model> = ModelStatic<T> & {
  findByPk: (id: string | number, options?: FindOptions) => Promise<T | null>;
  findOne: (options?: FindOptions) => Promise<T | null>;
  findAll: (options?: FindOptions) => Promise<T[]>;
  findAndCountAll: (options?: FindOptions) => Promise<{ rows: T[]; count: number }>;
  create: (values: Record<string, unknown>, options?: CreateOptions) => Promise<T>;
  bulkCreate: (records: Record<string, unknown>[], options?: BulkCreateOptions) => Promise<T[]>;
  update: (values: Record<string, unknown>, options: UpdateOptions) => Promise<[number]>;
  destroy: (options: DestroyOptions) => Promise<number>;
  scope: (scopes?: string | string[] | Record<string, unknown>) => ModelStatic<T>;
  count: (options?: CountOptions) => Promise<number>;
};

export const ModelHelpers = {
  /**
   * Safely call findByPk on any model
   */
  findByPk: async <T extends Model>(model: ModelClass<T>, id: string | number, options?: FindOptions): Promise<T | null> => {
    return model.findByPk(id, options);
  },

  /**
   * Safely call findOne on any model
   */
  findOne: async <T extends Model>(model: ModelClass<T>, options?: FindOptions): Promise<T | null> => {
    return model.findOne(options);
  },

  /**
   * Safely call findAll on any model
   */
  findAll: async <T extends Model>(model: ModelClass<T>, options?: FindOptions): Promise<T[]> => {
    return model.findAll(options);
  },

  /**
   * Safely call findAndCountAll on any model
   */
  findAndCountAll: async <T extends Model>(model: ModelClass<T>, options?: FindOptions): Promise<{ rows: T[]; count: number }> => {
    return model.findAndCountAll(options);
  },

  /**
   * Safely call create on any model
   */
  create: async <T extends Model>(model: ModelClass<T>, values: Record<string, unknown>, options?: CreateOptions): Promise<T> => {
    return model.create(values, options);
  },

  /**
   * Safely call bulkCreate on any model
   */
  bulkCreate: async <T extends Model>(model: ModelClass<T>, records: Record<string, unknown>[], options?: BulkCreateOptions): Promise<T[]> => {
    return model.bulkCreate(records, options);
  },

  /**
   * Safely call update on any model
   */
  update: async <T extends Model>(model: ModelClass<T>, values: Record<string, unknown>, options: UpdateOptions): Promise<[number]> => {
    return model.update(values, options);
  },

  /**
   * Safely call destroy on any model
   */
  destroy: async <T extends Model>(model: ModelClass<T>, options: DestroyOptions): Promise<number> => {
    return model.destroy(options);
  },

  /**
   * Safely call scope on any model
   */
  scope: <T extends Model>(model: ModelClass<T>, scopes?: string | string[] | Record<string, unknown>): ModelStatic<T> => {
    return model.scope(scopes);
  },

  /**
   * Safely call count on any model
   */
  count: async <T extends Model>(model: ModelClass<T>, options?: CountOptions): Promise<number> => {
    return model.count(options);
  }
};

// For backward compatibility, export individual functions
export const { findByPk, findOne, findAll, findAndCountAll, create, bulkCreate, update, destroy, scope, count } = ModelHelpers;