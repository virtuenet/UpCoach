/**
 * Shared services index
 */

// Export API client utilities
export { 
  createApiClient, 
  handleApiError, 
  withRetry, 
  transformers,
  type ApiClient,
  type ApiClientConfig 
} from './apiClient';