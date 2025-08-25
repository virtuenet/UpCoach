import axios, { CancelTokenSource } from 'axios';

/**
 * Global Request Manager
 * Manages all active API requests and provides utilities for cancellation
 */
class RequestManager {
  private activeRequests: Map<string, CancelTokenSource>;
  private requestGroups: Map<string, Set<string>>;

  constructor() {
    this.activeRequests = new Map();
    this.requestGroups = new Map();
  }

  /**
   * Create a new cancel token for a request
   * @param requestId Unique identifier for the request
   * @param groupId Optional group identifier for batch cancellation
   */
  createCancelToken(requestId: string, groupId?: string): CancelTokenSource {
    // Cancel any existing request with the same ID
    this.cancelRequest(requestId);

    // Create new cancel token
    const source = axios.CancelToken.source();
    this.activeRequests.set(requestId, source);

    // Add to group if specified
    if (groupId) {
      if (!this.requestGroups.has(groupId)) {
        this.requestGroups.set(groupId, new Set());
      }
      this.requestGroups.get(groupId)!.add(requestId);
    }

    return source;
  }

  /**
   * Cancel a specific request
   */
  cancelRequest(requestId: string, message?: string): void {
    const source = this.activeRequests.get(requestId);
    if (source) {
      source.cancel(message || `Request ${requestId} cancelled`);
      this.activeRequests.delete(requestId);
      
      // Remove from any groups
      this.requestGroups.forEach(group => {
        group.delete(requestId);
      });
    }
  }

  /**
   * Cancel all requests in a group
   */
  cancelGroup(groupId: string, message?: string): void {
    const group = this.requestGroups.get(groupId);
    if (group) {
      group.forEach(requestId => {
        this.cancelRequest(requestId, message || `Group ${groupId} cancelled`);
      });
      this.requestGroups.delete(groupId);
    }
  }

  /**
   * Cancel all active requests
   */
  cancelAll(message?: string): void {
    this.activeRequests.forEach((source, _requestId) => {
      source.cancel(message || 'All requests cancelled');
    });
    this.activeRequests.clear();
    this.requestGroups.clear();
  }

  /**
   * Remove completed request from tracking
   */
  removeRequest(requestId: string): void {
    this.activeRequests.delete(requestId);
    
    // Remove from any groups
    this.requestGroups.forEach(group => {
      group.delete(requestId);
    });
  }

  /**
   * Check if a request is active
   */
  isActive(requestId: string): boolean {
    return this.activeRequests.has(requestId);
  }

  /**
   * Get count of active requests
   */
  getActiveCount(): number {
    return this.activeRequests.size;
  }

  /**
   * Get active requests in a group
   */
  getGroupRequests(groupId: string): string[] {
    const group = this.requestGroups.get(groupId);
    return group ? Array.from(group) : [];
  }

  /**
   * Clean up cancelled or completed requests
   */
  cleanup(): void {
    // Remove cancelled tokens
    this.activeRequests.forEach((source, requestId) => {
      if (source.token.reason) {
        this.removeRequest(requestId);
      }
    });

    // Remove empty groups
    this.requestGroups.forEach((group, groupId) => {
      if (group.size === 0) {
        this.requestGroups.delete(groupId);
      }
    });
  }
}

// Export singleton instance
export const requestManager = new RequestManager();

/**
 * React hook for request management
 */
export function useRequestManager() {
  return {
    createToken: (id: string, group?: string) => requestManager.createCancelToken(id, group),
    cancel: (id: string) => requestManager.cancelRequest(id),
    cancelGroup: (group: string) => requestManager.cancelGroup(group),
    cancelAll: () => requestManager.cancelAll(),
    isActive: (id: string) => requestManager.isActive(id),
    getActiveCount: () => requestManager.getActiveCount(),
  };
}

/**
 * Higher-order function to wrap API calls with automatic cancellation
 */
export function withCancellation<T = any>(
  requestId: string,
  apiCall: (cancelToken: any) => Promise<T>,
  groupId?: string
): Promise<T> {
  const source = requestManager.createCancelToken(requestId, groupId);
  
  return apiCall(source.token)
    .finally(() => {
      requestManager.removeRequest(requestId);
    });
}

/**
 * Decorator for automatic request cancellation on component unmount
 */
export function createRequestGroup(componentName: string) {
  const groupId = `component_${componentName}_${Date.now()}`;
  
  return {
    groupId,
    request: <T = any>(
      requestId: string,
      apiCall: (cancelToken: any) => Promise<T>
    ): Promise<T> => {
      return withCancellation(`${groupId}_${requestId}`, apiCall, groupId);
    },
    cancelAll: () => requestManager.cancelGroup(groupId),
  };
}

/**
 * Utility to create a debounced cancellable request
 */
export function createDebouncedRequest<T = any>(
  requestId: string,
  apiCall: (cancelToken: any) => Promise<T>,
  delay: number = 300
): {
  execute: () => Promise<T>;
  cancel: () => void;
} {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return {
    execute: () => {
      return new Promise((resolve, reject) => {
        // Clear existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        // Cancel existing request
        requestManager.cancelRequest(requestId, 'Debounced');
        
        // Set new timeout
        timeoutId = setTimeout(() => {
          withCancellation(requestId, apiCall)
            .then(resolve)
            .catch(reject);
        }, delay);
      });
    },
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      requestManager.cancelRequest(requestId);
    },
  };
}

/**
 * Periodic cleanup of completed requests
 */
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestManager.cleanup();
  }, 60000); // Clean up every minute
}