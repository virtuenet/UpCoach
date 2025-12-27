/**
 * API Response Optimizer
 * Phase 12 Week 1
 *
 * Optimizes API responses with field filtering, pagination,
 * and selective data loading for improved performance
 */

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface FieldSelection {
  include?: string[];
  exclude?: string[];
}

export class ResponseOptimizer {
  /**
   * Calculate pagination offset
   */
  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Create paginated response
   */
  static paginate<T>(
    data: T[],
    total: number,
    params: PaginationParams
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / params.limit);

    return {
      data,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasMore: params.page < totalPages
      }
    };
  }

  /**
   * Filter object fields based on selection
   */
  static filterFields<T extends Record<string, any>>(
    obj: T,
    selection: FieldSelection
  ): Partial<T> {
    // If include specified, only include those fields
    if (selection.include && selection.include.length > 0) {
      const filtered: any = {};
      selection.include.forEach(field => {
        if (field in obj) {
          filtered[field] = obj[field];
        }
      });
      return filtered;
    }

    // If exclude specified, exclude those fields
    if (selection.exclude && selection.exclude.length > 0) {
      const filtered = { ...obj };
      selection.exclude.forEach(field => {
        delete filtered[field];
      });
      return filtered;
    }

    return obj;
  }

  /**
   * Filter array of objects
   */
  static filterArrayFields<T extends Record<string, any>>(
    arr: T[],
    selection: FieldSelection
  ): Partial<T>[] {
    return arr.map(obj => this.filterFields(obj, selection));
  }

  /**
   * Parse field selection from query string
   * Format: ?fields=id,name,email or ?exclude=password,token
   */
  static parseFieldSelection(query: any): FieldSelection {
    const selection: FieldSelection = {};

    if (query.fields) {
      selection.include = query.fields.split(',').map((f: string) => f.trim());
    }

    if (query.exclude) {
      selection.exclude = query.exclude.split(',').map((f: string) => f.trim());
    }

    return selection;
  }

  /**
   * Parse pagination params from query
   */
  static parsePaginationParams(
    query: any,
    defaults: { page?: number; limit?: number } = {}
  ): PaginationParams {
    const page = parseInt(query.page) || defaults.page || 1;
    const limit = Math.min(
      parseInt(query.limit) || defaults.limit || 20,
      100 // Max limit
    );
    const offset = this.calculateOffset(page, limit);

    return { page, limit, offset };
  }

  /**
   * Optimize nested relationships (prevent over-fetching)
   */
  static selectiveLoad<T>(
    data: T,
    includes: string[] = []
  ): T {
    if (!includes.length) return data;

    const result: any = Array.isArray(data) ? [] : {};

    // Simple implementation - in production, use ORM's selective loading
    if (Array.isArray(data)) {
      return data as T;
    }

    return data;
  }
}
