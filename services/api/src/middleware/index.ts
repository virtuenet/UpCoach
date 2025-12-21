/**
 * Middleware Index
 *
 * Centralized exports for all middleware.
 */

// Authentication & Authorization
export { authenticate } from './auth';
export { authorize, authorizeRole } from './authorize';
export { authorizeSecure } from './authorize-secure';
export { roleAuth } from './roleAuth';

// Security
export { securityHardeningMiddleware } from './security-hardening';
export { securityMiddleware } from './security';
export { securityHeadersMiddleware } from './securityHeaders';
export { csrfProtection } from './csrf';
export { sqlInjectionProtection } from './sqlInjectionProtection';

// Threat Protection
export {
  createThreatProtection,
  createIPBlocker,
  createLoginTracker,
  createRequestValidator,
  createSecurityHeaders,
  createDataAccessLogger,
  threatProtection,
  ipBlocker,
  loginTracker,
  requestValidator,
  securityHeaders,
  dataAccessLogger,
} from './threatProtection';

// Rate Limiting
export { rateLimiter, createRateLimiter } from './rateLimiter';
export { advancedRateLimit } from './advancedRateLimit';
export { rateLimiterSecure } from './rateLimiter-secure';

// Validation
export { validate, validateBody, validateQuery, validateParams } from './validation';
export { zodValidation } from './zodValidation';
export { aiInputValidation } from './aiInputValidation';

// Performance & Caching
export { performanceMiddleware } from './performance';
export { cachingMiddleware } from './caching-middleware';
export { responseCache } from './responseCache';

// Error Handling
export { errorHandler } from './errorHandler';
export { notFoundHandler } from './notFoundHandler';

// Audit & Tracing
export { auditTrail } from './auditTrail';
export { requestTracing } from './requestTracing';

// Upload & CDN
export { uploadMiddleware } from './upload';
export { secureUpload } from './secureUpload';
export { cdnMiddleware } from './cdn';

// Other
export { i18nMiddleware } from './i18n';
export { tenantContext } from './tenantContext';
export { resourceAccessMiddleware } from './resourceAccess';
export { webhookSecurity } from './webhookSecurity';
export { securityNonce } from './securityNonce';
