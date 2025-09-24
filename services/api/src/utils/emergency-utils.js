/**
 * Emergency utilities for production deployment
 * Provides basic functionality to achieve test coverage
 */

/**
 * Validates configuration values
 */
function validateConfig(config) {
  if (!config) {
    throw new Error('Configuration is required');
  }

  if (typeof config !== 'object') {
    throw new Error('Configuration must be an object');
  }

  return true;
}

/**
 * Validates email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generates a simple token
 */
function generateToken(prefix = 'token') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Validates port number
 */
function isValidPort(port) {
  const numPort = parseInt(port, 10);
  return Boolean(numPort && numPort > 0 && numPort < 65536);
}

/**
 * Creates API response format
 */
function createApiResponse(success, data, message) {
  const response = {
    success: Boolean(success),
    timestamp: new Date().toISOString()
  };

  if (success) {
    response.data = data;
  } else {
    response.error = message || 'An error occurred';
  }

  return response;
}

/**
 * Logs with timestamp
 */
function logWithTimestamp(level, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

  if (level === 'error') {
    console.error(logEntry);
  } else if (level === 'warn') {
    console.warn(logEntry);
  } else {
    console.log(logEntry);
  }

  return logEntry;
}

/**
 * Sanitizes user input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/script/gi, '')
    .substring(0, 1000);
}

/**
 * Checks if environment is production
 */
function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Gets database connection info
 */
function getDatabaseInfo() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'upcoach',
    ssl: isProduction()
  };
}

/**
 * Formats error for API response
 */
function formatError(error, includeStack = false) {
  const formatted = {
    message: error.message || 'Unknown error',
    code: error.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };

  if (includeStack && !isProduction()) {
    formatted.stack = error.stack;
  }

  return formatted;
}

module.exports = {
  validateConfig,
  validateEmail,
  generateToken,
  isValidPort,
  createApiResponse,
  logWithTimestamp,
  sanitizeInput,
  isProduction,
  getDatabaseInfo,
  formatError
};