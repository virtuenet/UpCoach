/**
 * Model helpers to provide properly typed Sequelize operations
 * This file provides utility functions that cast model operations to avoid TypeScript errors
 */

import { Model } from 'sequelize';

export const ModelHelpers = {
  /**
   * Safely call findByPk on any model
   */
  findByPk: async <T extends typeof Model>(model: T, id: unknown, options?: unknown): Promise<InstanceType<T> | null> => {
    return (model as unknown).findByPk(id, options);
  },

  /**
   * Safely call findOne on any model
   */
  findOne: async <T extends typeof Model>(model: T, options?: unknown): Promise<InstanceType<T> | null> => {
    return (model as unknown).findOne(options);
  },

  /**
   * Safely call findAll on any model
   */
  findAll: async <T extends typeof Model>(model: T, options?: unknown): Promise<InstanceType<T>[]> => {
    return (model as unknown).findAll(options);
  },

  /**
   * Safely call findAndCountAll on any model
   */
  findAndCountAll: async <T extends typeof Model>(model: T, options?: unknown): Promise<{ rows: InstanceType<T>[]; count: number }> => {
    return (model as unknown).findAndCountAll(options);
  },

  /**
   * Safely call create on any model
   */
  create: async <T extends typeof Model>(model: T, values: unknown, options?: unknown): Promise<InstanceType<T>> => {
    return (model as unknown).create(values, options);
  },

  /**
   * Safely call bulkCreate on any model
   */
  bulkCreate: async <T extends typeof Model>(model: T, records: unknown[], options?: unknown): Promise<InstanceType<T>[]> => {
    return (model as unknown).bulkCreate(records, options);
  },

  /**
   * Safely call update on any model
   */
  update: async <T extends typeof Model>(model: T, values: unknown, options: unknown): Promise<[number]> => {
    return (model as unknown).update(values, options);
  },

  /**
   * Safely call destroy on any model
   */
  destroy: async <T extends typeof Model>(model: T, options: unknown): Promise<number> => {
    return (model as unknown).destroy(options);
  },

  /**
   * Safely call scope on any model
   */
  scope: <T extends typeof Model>(model: T, scopes?: string | string[] | any): T => {
    return (model as unknown).scope(scopes);
  },

  /**
   * Safely call count on any model
   */
  count: async <T extends typeof Model>(model: T, options?: unknown): Promise<number> => {
    return (model as unknown).count(options);
  }
};

// For backward compatibility, export individual functions
export const { findByPk, findOne, findAll, findAndCountAll, create, bulkCreate, update, destroy, scope, count } = ModelHelpers;