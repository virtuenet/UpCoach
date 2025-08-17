# Error Handling Guide

## Overview
This guide documents the error handling patterns and best practices for the UpCoach backend.

## Error Types

### UserFriendlyError
Main error class for all application errors with user-facing messages.

```typescript
import { UserFriendlyError } from '../utils/errorHandler';

throw new UserFriendlyError(
  'Your session has expired. Please log in again.',  // User message
  'JWT token expired at 2024-01-01 12:00:00',       // Technical message
  401,                                               // HTTP status code
  'Click here to log in',                           // Action required
  false,                                             // Not retryable
  '/auth/login'                                     // Help URL
);
```

### Standard Error Handling
For unknown errors, use the type guards:

```typescript
import { isError, hasMessage, getErrorMessage } from '../utils/errorHandler';

try {
  // ... code that might throw
} catch (error) {
  if (isError(error)) {
    logger.error('Operation failed:', error.message);
  } else {
    logger.error('Unknown error:', getErrorMessage(error));
  }
}
```

## Controller Error Handling

### Using handleControllerError
```typescript
import { handleControllerError } from '../utils/errorHandler';

export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const user = await userService.getUser(req.params.id);
    res.json(user);
  } catch (error) {
    handleControllerError(error, res, 'getUser');
  }
}
```

### Response Format
Error responses follow this structure:
```json
{
  "success": false,
  "error": {
    "message": "User-friendly error message",
    "statusCode": 400,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "retryable": true,
    "action": "Please try again",
    "helpUrl": "/help/errors/400"
  }
}
```

In development, technical details are included:
```json
{
  "success": false,
  "error": {
    "message": "User-friendly error message",
    "statusCode": 400,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "retryable": true,
    "technical": {
      "message": "Database connection timeout",
      "context": "getUser",
      "stack": "Error: Database connection timeout\n    at ..."
    }
  }
}
```

## Service Error Handling

### Database Errors
```typescript
async function getUserById(id: number): Promise<User> {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new UserFriendlyError(
        'User not found',
        `User with ID ${id} does not exist`,
        404,
        'Check the user ID and try again',
        false
      );
    }
    return user;
  } catch (error) {
    if (error instanceof UserFriendlyError) throw error;
    
    throw new UserFriendlyError(
      'Unable to retrieve user information',
      getErrorMessage(error),
      500,
      'Please try again later',
      true
    );
  }
}
```

### External API Errors
```typescript
async function callExternalAPI(): Promise<any> {
  try {
    const response = await axios.get('https://api.example.com/data');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new UserFriendlyError(
        'External service is currently unavailable',
        `API call failed: ${error.message}`,
        error.response?.status || 503,
        'Please try again in a few minutes',
        true
      );
    }
    throw error;
  }
}
```

## Notification Integration

### Show Errors to Users
```typescript
import { notificationService } from '../services/NotificationService';
import { handleError } from '../utils/errorHandler';

async function performAction(userId: string): Promise<void> {
  try {
    // ... perform action
  } catch (error) {
    const userError = handleError(error);
    await notificationService.showError(userId, userError);
    throw userError;
  }
}
```

## Validation Errors

### Using Express Validator
```typescript
import { validationResult } from 'express-validator';

export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new UserFriendlyError(
      'Please check your input and try again',
      'Validation failed',
      400,
      'Fix the highlighted fields',
      false
    );
  }
  next();
}
```

## Async Error Handling

### Using catchAsync Wrapper
```typescript
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleControllerError(error, res, fn.name || 'unknown');
    });
  };
};

// Usage
router.get('/users/:id', catchAsync(async (req, res) => {
  const user = await userService.getUser(req.params.id);
  res.json(user);
}));
```

## Error Monitoring

### Logging Errors
```typescript
import { logger } from '../utils/logger';

// Log with context
logger.error('Payment processing failed', {
  userId: user.id,
  amount: payment.amount,
  error: error.message,
  stack: error.stack,
});

// Log with severity
logger.fatal('Database connection lost', error);
logger.warn('Rate limit approaching', { userId, requests: count });
```

## Best Practices

### DO:
- ✅ Always provide user-friendly error messages
- ✅ Include actionable information when possible
- ✅ Log technical details for debugging
- ✅ Use appropriate HTTP status codes
- ✅ Make errors retryable when appropriate
- ✅ Test error scenarios

### DON'T:
- ❌ Expose sensitive information in error messages
- ❌ Show stack traces to users in production
- ❌ Use generic error messages like "An error occurred"
- ❌ Ignore errors silently
- ❌ Mix technical and user-facing messages

## Testing Error Scenarios

```typescript
describe('Error Handling', () => {
  it('should handle database errors gracefully', async () => {
    // Mock database error
    jest.spyOn(User, 'findByPk').mockRejectedValue(new Error('Connection lost'));
    
    const response = await request(app)
      .get('/users/123')
      .expect(500);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Unable to retrieve user information');
    expect(response.body.error.retryable).toBe(true);
  });
});
```

## Common Error Patterns

### Authentication Errors
- 401: Invalid credentials, expired token
- 403: Insufficient permissions

### Validation Errors
- 400: Invalid input, missing required fields
- 422: Business rule violations

### Resource Errors
- 404: Resource not found
- 409: Resource conflict (duplicate)

### Server Errors
- 500: Internal server error
- 502: Bad gateway (external service failure)
- 503: Service unavailable (maintenance, overload)