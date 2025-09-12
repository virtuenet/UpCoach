'use strict';

var axios = require('axios');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var axios__default = /*#__PURE__*/_interopDefault(axios);

// src/services/apiClient.ts
function createApiClient(config) {
  const client = axios__default.default.create({
    baseURL: config.baseURL,
    timeout: config.timeout || 3e4,
    withCredentials: config.withCredentials || false,
    headers: {
      "Content-Type": "application/json"
    }
  });
  let authToken = null;
  client.setAuthToken = (token) => {
    authToken = token;
  };
  client.interceptors.request.use(
    async (requestConfig) => {
      const token = authToken || (config.getAuthToken ? config.getAuthToken() : null);
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
      const method = requestConfig.method?.toUpperCase();
      if (!config.skipCSRF && method && ["POST", "PUT", "DELETE", "PATCH"].includes(method) && !requestConfig.headers["X-Skip-CSRF"]) {
        try {
          const csrfToken = config.getCSRFToken ? await config.getCSRFToken() : null;
          if (csrfToken) {
            requestConfig.headers["X-CSRF-Token"] = csrfToken;
          }
        } catch (error) {
          console.warn("Failed to get CSRF token:", error);
        }
      }
      return requestConfig;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && config.onUnauthorized) {
        config.onUnauthorized();
      }
      if (error.response?.status === 403 && error.response.data?.code === "CSRF_TOKEN_INVALID") {
        if (!error.config?._retried && config.getCSRFToken) {
          error.config._retried = true;
          try {
            const newToken = await config.getCSRFToken();
            if (newToken && error.config) {
              error.config.headers["X-CSRF-Token"] = newToken;
              return client(error.config);
            }
          } catch (csrfError) {
            console.error("Failed to refresh CSRF token:", csrfError);
          }
        }
      }
      if (config.onError) {
        config.onError(error);
      }
      return Promise.reject(error);
    }
  );
  return client;
}
function handleApiError(error) {
  if (axios__default.default.isAxiosError(error)) {
    const response = error.response;
    if (response) {
      return {
        message: response.data?.message || response.data?.error || `Error: ${response.status}`,
        code: response.data?.code || String(response.status),
        details: response.data
      };
    } else if (error.request) {
      return {
        message: "No response from server. Please check your connection.",
        code: "NETWORK_ERROR"
      };
    }
  }
  return {
    message: error.message || "An unexpected error occurred",
    code: "UNKNOWN_ERROR"
  };
}
function withRetry(apiCall, options = {}) {
  const {
    maxRetries = 3,
    delay = 1e3,
    shouldRetry = (error) => {
      if (axios__default.default.isAxiosError(error)) {
        return !error.response || error.response.status >= 500;
      }
      return false;
    }
  } = options;
  return new Promise(async (resolve, reject) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await apiCall();
        return resolve(result);
      } catch (error) {
        lastError = error;
        if (!shouldRetry(error) || i === maxRetries - 1) {
          return reject(error);
        }
        await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
      }
    }
    reject(lastError);
  });
}
var transformers = {
  // Convert snake_case to camelCase
  snakeToCamel: (data) => {
    if (Array.isArray(data)) {
      return data.map(transformers.snakeToCamel);
    }
    if (data !== null && typeof data === "object") {
      return Object.keys(data).reduce((acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        acc[camelKey] = transformers.snakeToCamel(data[key]);
        return acc;
      }, {});
    }
    return data;
  },
  // Convert camelCase to snake_case
  camelToSnake: (data) => {
    if (Array.isArray(data)) {
      return data.map(transformers.camelToSnake);
    }
    if (data !== null && typeof data === "object") {
      return Object.keys(data).reduce((acc, key) => {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        acc[snakeKey] = transformers.camelToSnake(data[key]);
        return acc;
      }, {});
    }
    return data;
  }
};

exports.createApiClient = createApiClient;
exports.handleApiError = handleApiError;
exports.transformers = transformers;
exports.withRetry = withRetry;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map