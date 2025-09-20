/**
 * Model helpers to provide properly typed Sequelize operations
 * This file provides utility functions that cast model operations to avoid TypeScript errors
 */

import { Model } from 'sequelize';

export const ModelHelpers = {
  /**
   * Safely call findByPk on any model
   */
  findByPk: async <T extends typeof Model>(model: T, id: any, options?: any): Promise<InstanceType<T> | null> => {
    return (model as any).findByPk(id, options);
  },

  /**
   * Safely call findOne on any model
   */
  findOne: async <T extends typeof Model>(model: T, options?: any): Promise<InstanceType<T> | null> => {
    return (model as any).findOne(options);
  },

  /**
   * Safely call findAll on any model
   */
  findAll: async <T extends typeof Model>(model: T, options?: any): Promise<InstanceType<T>[]> => {
    return (model as any).findAll(options);
  },

  /**
   * Safely call findAndCountAll on any model
   */
  findAndCountAll: async <T extends typeof Model>(model: T, options?: any): Promise<{ rows: InstanceType<T>[]; count: number }> => {
    return (model as any).findAndCountAll(options);
  },

  /**
   * Safely call create on any model
   */
  create: async <T extends typeof Model>(model: T, values: any, options?: any): Promise<InstanceType<T>> => {
    return (model as any).create(values, options);
  },

  /**
   * Safely call bulkCreate on any model
   */
  bulkCreate: async <T extends typeof Model>(model: T, records: any[], options?: any): Promise<InstanceType<T>[]> => {
    return (model as any).bulkCreate(records, options);
  },

  /**
   * Safely call update on any model
   */
  update: async <T extends typeof Model>(model: T, values: any, options: any): Promise<[number]> => {
    return (model as any).update(values, options);
  },

  /**
   * Safely call destroy on any model
   */
  destroy: async <T extends typeof Model>(model: T, options: any): Promise<number> => {
    return (model as any).destroy(options);
  },

  /**
   * Safely call scope on any model
   */
  scope: <T extends typeof Model>(model: T, scopes?: string | string[] | any): T => {
    return (model as any).scope(scopes);
  },

  /**
   * Safely call count on any model
   */
  count: async <T extends typeof Model>(model: T, options?: any): Promise<number> => {
    return (model as any).count(options);
  }
};

// For backward compatibility, export individual functions
export const { findByPk, findOne, findAll, findAndCountAll, create, bulkCreate, update, destroy, scope, count } = ModelHelpers;