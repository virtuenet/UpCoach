/**
 * Validated API Client
 * Wraps API client with automatic input validation and sanitization
 */
import { apiClient } from '../../api/client';
import { inputValidator } from '../validation/inputValidator';
import { logger } from '../../utils/logger';
class ValidatedApiClient {
    constructor() { }
    static getInstance() {
        if (!ValidatedApiClient.instance) {
            ValidatedApiClient.instance = new ValidatedApiClient();
        }
        return ValidatedApiClient.instance;
    }
    /**
     * Make validated API request
     */
    async request(config) {
        try {
            // Validate request data
            if (config.validation?.data && config.data) {
                const validation = inputValidator.validate(config.validation.data, config.data);
                if (!validation.success) {
                    const error = new Error('Request data validation failed');
                    error.validationErrors = validation.errors;
                    throw error;
                }
                config.data = validation.data;
            }
            // Validate request params
            if (config.validation?.params && config.params) {
                const validation = inputValidator.validate(config.validation.params, config.params);
                if (!validation.success) {
                    const error = new Error('Request params validation failed');
                    error.validationErrors = validation.errors;
                    throw error;
                }
                config.params = validation.data;
            }
            // Check for injection attempts in URL
            const injectionCheck = inputValidator.detectInjection(config.url);
            if (!injectionCheck.safe) {
                logger.error('Potential injection detected in URL', {
                    url: config.url,
                    type: injectionCheck.type,
                });
                throw new Error('Invalid request URL');
            }
            // Make API request
            const response = await apiClient.request({
                url: config.url,
                method: config.method || 'GET',
                data: config.data,
                params: config.params,
                headers: config.headers,
            });
            // Validate response if schema provided
            if (config.validation?.response) {
                const validation = inputValidator.validate(config.validation.response, response.data);
                if (!validation.success) {
                    logger.error('Response validation failed', {
                        url: config.url,
                        errors: validation.errors,
                    });
                    throw new Error('Invalid response from server');
                }
                return validation.data;
            }
            return response.data;
        }
        catch (error) {
            logger.error('Validated API request failed', {
                url: config.url,
                error,
            });
            throw error;
        }
    }
    /**
     * GET request with validation
     */
    async get(url, params, validation) {
        return this.request({
            url,
            method: 'GET',
            params,
            validation,
        });
    }
    /**
     * POST request with validation
     */
    async post(url, data, validation) {
        return this.request({
            url,
            method: 'POST',
            data,
            validation,
        });
    }
    /**
     * PUT request with validation
     */
    async put(url, data, validation) {
        return this.request({
            url,
            method: 'PUT',
            data,
            validation,
        });
    }
    /**
     * PATCH request with validation
     */
    async patch(url, data, validation) {
        return this.request({
            url,
            method: 'PATCH',
            data,
            validation,
        });
    }
    /**
     * DELETE request with validation
     */
    async delete(url, params, validation) {
        return this.request({
            url,
            method: 'DELETE',
            params,
            validation,
        });
    }
    /**
     * Create paginated request helper
     */
    async paginated(url, params, validation) {
        // Validate pagination params
        const paginationValidation = inputValidator.validatePagination(params);
        if (!paginationValidation.success) {
            throw new Error('Invalid pagination parameters');
        }
        const validatedParams = {
            ...params,
            ...paginationValidation.data,
        };
        return this.get(url, validatedParams, validation);
    }
    /**
     * File upload with validation
     */
    async uploadFile(url, file, additionalData) {
        // Validate file
        const fileValidation = inputValidator.validateFileUpload({
            name: file.name,
            type: file.type,
            size: file.size,
        });
        if (!fileValidation.success) {
            const error = new Error('File validation failed');
            error.validationErrors = fileValidation.errors;
            throw error;
        }
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        // Add additional data if provided
        if (additionalData) {
            Object.entries(additionalData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
                }
            });
        }
        return this.request({
            url,
            method: 'POST',
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
    /**
     * Batch requests with validation
     */
    async batch(requests) {
        // Validate all requests first
        const validatedRequests = requests.map(req => {
            if (req.validation?.data && req.data) {
                const validation = inputValidator.validate(req.validation.data, req.data);
                if (!validation.success) {
                    throw new Error(`Batch request validation failed for ${req.url}`);
                }
                req.data = validation.data;
            }
            if (req.validation?.params && req.params) {
                const validation = inputValidator.validate(req.validation.params, req.params);
                if (!validation.success) {
                    throw new Error(`Batch request validation failed for ${req.url}`);
                }
                req.params = validation.data;
            }
            return req;
        });
        // Execute requests in parallel
        const promises = validatedRequests.map(req => this.request(req));
        return Promise.all(promises);
    }
    /**
     * Retry failed requests with exponential backoff
     */
    async withRetry(config, maxRetries = 3, delay = 1000) {
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await this.request(config);
            }
            catch (error) {
                lastError = error;
                // Don't retry validation errors
                if (error.validationErrors) {
                    throw error;
                }
                // Don't retry 4xx errors (except 429)
                if (error.response?.status >= 400 &&
                    error.response?.status < 500 &&
                    error.response?.status !== 429) {
                    throw error;
                }
                // Wait before retrying
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
                }
            }
        }
        throw lastError;
    }
}
// Export singleton instance
export const validatedApi = ValidatedApiClient.getInstance();
// Export typed API methods for common endpoints
export const api = {
    // User endpoints
    users: {
        list: (params) => validatedApi.paginated('/users', params),
        get: (id) => validatedApi.get(`/users/${id}`),
        create: (data) => validatedApi.post('/users', data),
        update: (id, data) => validatedApi.put(`/users/${id}`, data),
        delete: (id) => validatedApi.delete(`/users/${id}`),
    },
    // Content endpoints
    content: {
        list: (params) => validatedApi.paginated('/content', params),
        get: (id) => validatedApi.get(`/content/${id}`),
        create: (data) => validatedApi.post('/content', data),
        update: (id, data) => validatedApi.put(`/content/${id}`, data),
        delete: (id) => validatedApi.delete(`/content/${id}`),
        publish: (id) => validatedApi.post(`/content/${id}/publish`),
        unpublish: (id) => validatedApi.post(`/content/${id}/unpublish`),
    },
    // Media endpoints
    media: {
        list: (params) => validatedApi.paginated('/media', params),
        upload: (file, metadata) => validatedApi.uploadFile('/media/upload', file, metadata),
        delete: (id) => validatedApi.delete(`/media/${id}`),
    },
    // Settings endpoints
    settings: {
        get: (key) => validatedApi.get(`/settings/${key}`),
        update: (key, value) => validatedApi.put(`/settings/${key}`, { value }),
    },
    // Analytics endpoints
    analytics: {
        overview: (params) => validatedApi.get('/analytics/overview', params),
        content: (params) => validatedApi.get('/analytics/content', params),
        users: (params) => validatedApi.get('/analytics/users', params),
    },
};
//# sourceMappingURL=validatedApiClient.js.map