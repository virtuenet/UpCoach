import { Router } from 'express';
import {
  validateBody,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  verify2FASchema,
  createValidator,
} from '../middleware/zodValidation';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const authController = new AuthController();

// Create reusable validators
const registerValidator = createValidator(registerSchema);
const loginValidator = createValidator(loginSchema);

/**
 * Public routes with validation and rate limiting
 */

// Registration with comprehensive validation
router.post(
  '/register',
  rateLimiter.authLimiter,
  validateBody(registerSchema, {
    message: 'Invalid registration data',
    logErrors: true,
  }),
  authController.register
);

// Login with validation
router.post(
  '/login',
  rateLimiter.authLimiter,
  loginValidator.body({
    message: 'Invalid login credentials',
  }),
  authController.login
);

// Forgot password
router.post(
  '/forgot-password',
  rateLimiter.authLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

// Reset password
router.post(
  '/reset-password',
  rateLimiter.authLimiter,
  validateBody(resetPasswordSchema, {
    message: 'Invalid reset password data',
  }),
  authController.resetPassword
);

/**
 * Protected routes requiring authentication
 */

// Change password (authenticated users)
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema, {
    message: 'Invalid password change request',
  }),
  authController.changePassword
);

// Update profile
router.patch(
  '/profile',
  authenticate,
  validateBody(updateProfileSchema, {
    stripUnknown: true, // Remove any fields not in the schema
  }),
  authController.updateProfile
);

// Enable 2FA
router.post('/2fa/enable', authenticate, validateBody(verify2FASchema), authController.enable2FA);

// Verify 2FA code
router.post(
  '/2fa/verify',
  authenticate,
  validateBody(verify2FASchema, {
    message: 'Invalid 2FA code',
  }),
  authController.verify2FA
);

/**
 * Example of conditional validation
 */
router.post(
  '/verify-email',
  // Only validate if token is in body, not query
  (req, res, next) => {
    if (req.body.token) {
      validateBody(verifyEmailSchema)(req, res, next);
    } else {
      next();
    }
  },
  authController.verifyEmail
);

/**
 * Example of multiple validations
 */
router.get(
  '/users/:id',
  authenticate,
  validateMultiple([
    {
      schema: idParamSchema,
      source: 'params',
    },
    {
      schema: paginationSchema,
      source: 'query',
      options: { stripUnknown: true },
    },
  ]),
  authController.getUser
);

/**
 * Example with custom async validation
 */
router.post(
  '/check-username',
  validateAsync(usernameSchema, async username => {
    // Custom check for username availability
    const exists = await authController.checkUsernameExists(username);
    if (exists) {
      return { error: 'Username is already taken' };
    }
    return true;
  }),
  authController.checkUsername
);

/**
 * Example with sanitization
 */
router.post(
  '/feedback',
  authenticate,
  sanitizeAndValidate(feedbackSchema), // Sanitizes XSS and validates
  authController.submitFeedback
);

export default router;
