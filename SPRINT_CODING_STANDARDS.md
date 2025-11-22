# Coding Standards for 40-Day Implementation Sprint

## Overview
This document defines coding standards, patterns, and best practices for the comprehensive implementation sprint covering P0-P5 priorities plus landing page development.

**Last Updated**: 2025-10-28
**Applies To**: All phases (Phase 0-9)

---

## General Principles

### 1. Code Quality
- **Write self-documenting code**: Use descriptive variable/function names
- **Keep functions small**: Max 50 lines per function (excluding comments)
- **Single Responsibility**: Each function/class does one thing well
- **DRY Principle**: Don't Repeat Yourself - extract common patterns
- **YAGNI**: You Aren't Gonna Need It - avoid premature optimization

### 2. Testing Strategy
- **Unit Tests**: Write during implementation (not after)
- **Coverage Target**: 85%+ for new code
- **Test Naming**: `describe('ComponentName', () => { test('should do something when condition', () => {}) })`
- **Test Structure**: Arrange-Act-Assert (AAA) pattern

### 3. Security First
- **Input Validation**: Validate ALL user inputs
- **SQL Injection**: Use parameterized queries ONLY
- **XSS Prevention**: Sanitize all outputs
- **Authentication**: Never trust client-side auth
- **Secrets**: Never commit secrets, use environment variables

---

## Language-Specific Standards

### TypeScript/JavaScript

#### File Structure
```typescript
// 1. Imports (external first, then internal)
import React, { useState } from 'react';
import { api } from '@/services/api';

// 2. Types/Interfaces
interface UserProps {
  id: string;
  name: string;
}

// 3. Constants
const MAX_RETRY_ATTEMPTS = 3;

// 4. Main component/function
export const Component: React.FC<UserProps> = ({ id, name }) => {
  // Hooks first
  const [state, setState] = useState();

  // Event handlers
  const handleClick = () => {};

  // Render
  return <div>{name}</div>;
};

// 5. Helper functions
function helperFunction() {}

// 6. Default export (if needed)
export default Component;
```

#### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Files**: camelCase for utilities, PascalCase for components
- **Variables/Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Types/Interfaces**: PascalCase, prefix interfaces with `I` only if needed for clarity
- **Enums**: PascalCase for enum name, UPPER_SNAKE_CASE for values

#### TypeScript Best Practices
```typescript
// ✅ Good - Explicit types
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad - Any types
function calculateTotal(items: any): any {
  return items.reduce((sum: any, item: any) => sum + item.price, 0);
}

// ✅ Good - Type guards
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}

// ✅ Good - Nullish coalescing
const value = userInput ?? defaultValue;

// ✅ Good - Optional chaining
const email = user?.profile?.email;
```

#### Error Handling
```typescript
// ✅ Good - Specific error handling
try {
  const data = await fetchData();
  return data;
} catch (error) {
  if (error instanceof NetworkError) {
    logger.error('Network failure', { error });
    throw new ServiceUnavailableError('Service temporarily unavailable');
  }
  throw error;
}

// ❌ Bad - Silent failures
try {
  await fetchData();
} catch (error) {
  console.log(error); // Never just log and continue
}
```

#### Async/Await
```typescript
// ✅ Good - Async/await with error handling
async function loadUserData(userId: string): Promise<User> {
  try {
    const user = await api.get(`/users/${userId}`);
    const preferences = await api.get(`/users/${userId}/preferences`);
    return { ...user, preferences };
  } catch (error) {
    logger.error('Failed to load user data', { userId, error });
    throw new UserLoadError('Unable to load user data');
  }
}

// ❌ Bad - Callback hell or unhandled promises
function loadUserData(userId) {
  return api.get(`/users/${userId}`).then(user => {
    return api.get(`/users/${userId}/preferences`).then(prefs => {
      return { ...user, preferences: prefs };
    });
  }); // No error handling!
}
```

### Dart/Flutter

#### File Structure
```dart
// 1. Imports
import 'package:flutter/material.dart';
import '../models/user.dart';

// 2. Widget class
class UserProfileScreen extends StatelessWidget {
  // 3. Constructor
  const UserProfileScreen({
    Key? key,
    required this.userId,
  }) : super(key: key);

  // 4. Properties
  final String userId;

  // 5. Build method
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Profile')),
      body: _buildBody(),
    );
  }

  // 6. Private helper methods
  Widget _buildBody() {
    return Container();
  }
}
```

#### Naming Conventions
- **Classes**: PascalCase (`UserProfile`)
- **Files**: snake_case (`user_profile_screen.dart`)
- **Variables**: camelCase (`userName`)
- **Private members**: Prefix with underscore (`_privateMethod`)
- **Constants**: lowerCamelCase or SCREAMING_SNAKE_CASE for compile-time constants

#### Flutter Best Practices
```dart
// ✅ Good - Const constructors
const Text('Hello', style: TextStyle(fontSize: 16));

// ✅ Good - Extract widgets
Widget _buildProfileHeader() {
  return Container(/* ... */);
}

// ✅ Good - Use null-safety
String? getUserEmail(User? user) {
  return user?.email;
}

// ❌ Bad - Deep nesting
Widget build(BuildContext context) {
  return Container(
    child: Column(
      children: [
        Row(
          children: [
            Container(
              child: Text('Too deep!')
            )
          ]
        )
      ]
    )
  );
}
```

### SQL

#### Query Standards
```sql
-- ✅ Good - Parameterized queries
SELECT * FROM users WHERE id = $1 AND status = $2;

-- ❌ Bad - String concatenation
SELECT * FROM users WHERE id = '" + userId + "';

-- ✅ Good - Explicit column names
SELECT id, email, first_name, last_name FROM users;

-- ❌ Bad - SELECT *
SELECT * FROM users;

-- ✅ Good - Proper indexing
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ✅ Good - Comments
COMMENT ON TABLE users IS 'Stores user account information';
COMMENT ON COLUMN users.email IS 'User primary email (unique)';
```

---

## Project-Specific Patterns

### API Endpoints

#### RESTful Conventions
```
GET    /api/users           - List users
GET    /api/users/:id       - Get user
POST   /api/users           - Create user
PUT    /api/users/:id       - Update user (full)
PATCH  /api/users/:id       - Update user (partial)
DELETE /api/users/:id       - Delete user

GET    /api/users/:id/habits - Get user's habits (nested resource)
```

#### Response Format
```typescript
// ✅ Success Response
{
  "success": true,
  "data": { /* payload */ },
  "metadata": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}

// ✅ Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### State Management

#### React (Context + Hooks)
```typescript
// ✅ Good - Custom hooks for reusable logic
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading, error };
}
```

#### Flutter (Provider/Bloc)
```dart
// ✅ Good - Provider pattern
class UserProvider extends ChangeNotifier {
  User? _user;
  User? get user => _user;

  Future<void> loadUser(String userId) async {
    _user = await userService.getUser(userId);
    notifyListeners();
  }
}
```

### Error Handling Patterns

#### Custom Error Classes
```typescript
// services/api/src/errors/CustomErrors.ts
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}
```

#### Global Error Handler
```typescript
// Middleware for Express
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        field: error.field
      }
    });
  }

  if (error instanceof UnauthorizedError) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error.message
      }
    });
  }

  // Default to 500
  logger.error('Unhandled error', { error });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});
```

---

## Security Standards

### Input Validation
```typescript
// ✅ Good - Validation with Zod
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  age: z.number().int().min(13).max(120)
});

function createUser(data: unknown) {
  const validated = UserSchema.parse(data); // Throws if invalid
  return db.users.create(validated);
}
```

### SQL Injection Prevention
```typescript
// ✅ Good - Parameterized queries with Sequelize
const user = await User.findOne({
  where: { email: userEmail }
});

// ✅ Good - Raw queries with parameters
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [userEmail]
);

// ❌ Bad - String interpolation
const result = await db.query(
  `SELECT * FROM users WHERE email = '${userEmail}'`
);
```

### Authentication & Authorization
```typescript
// ✅ Good - Middleware pattern
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = await User.findByPk(decoded.userId);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Usage
app.get('/api/admin/users', requireAuth, requireRole(['admin']), getUsersHandler);
```

---

## Performance Best Practices

### Database
- Use indexes on frequently queried columns
- Limit SELECT queries to needed columns
- Use pagination for large datasets
- Implement database connection pooling
- Use transactions for related operations

```typescript
// ✅ Good - Pagination
async function getUsers(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;

  const [users, total] = await Promise.all([
    db.users.findAll({ offset, limit }),
    db.users.count()
  ]);

  return {
    users,
    metadata: {
      page,
      per_page: limit,
      total,
      total_pages: Math.ceil(total / limit)
    }
  };
}
```

### React Performance
```typescript
// ✅ Good - Memoization
const MemoizedComponent = React.memo(({ data }) => {
  return <ExpensiveRender data={data} />;
});

// ✅ Good - useMemo for expensive calculations
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.value - b.value);
}, [data]);

// ✅ Good - useCallback for event handlers
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

---

## Documentation Standards

### Code Comments
```typescript
/**
 * Calculates user's subscription churn risk score
 *
 * @param userId - The unique identifier for the user
 * @param options - Optional configuration for calculation
 * @returns Risk score between 0 (low risk) and 1 (high risk)
 * @throws {NotFoundError} If user doesn't exist
 *
 * @example
 * ```typescript
 * const risk = await calculateChurnRisk('user-123');
 * if (risk > 0.7) {
 *   await sendRetentionEmail(userId);
 * }
 * ```
 */
async function calculateChurnRisk(
  userId: string,
  options?: RiskCalculationOptions
): Promise<number> {
  // Implementation
}
```

### README Structure
Each feature directory should include:
```markdown
# Feature Name

## Purpose
Brief description of what this feature does

## Usage
Code examples showing how to use

## API Reference
List of functions/classes with parameters

## Dependencies
What this feature depends on

## Testing
How to run tests for this feature

## Known Issues
Any current limitations or bugs
```

---

## Git Commit Standards

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes bug nor adds feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Updating build tasks, package manager configs, etc.

**Examples**:
```
feat(auth): implement GDPR data export functionality

- Add data export service
- Create API endpoint for export requests
- Include user profile, habits, and messages in export
- Exports expire after 30 days

Closes #123
```

```
fix(mobile): resolve voice journal sync conflicts

Fixed race condition when multiple devices sync simultaneously.
Now uses last-write-wins strategy with conflict log.

Fixes #456
```

---

## Code Review Checklist

Before submitting PR:
- [ ] All tests pass
- [ ] No TypeScript/linting errors
- [ ] Code follows standards in this document
- [ ] Added unit tests for new functionality
- [ ] Updated documentation
- [ ] No console.log or debug code
- [ ] No hardcoded values (use constants/env vars)
- [ ] Error handling implemented
- [ ] Security vulnerabilities addressed
- [ ] Performance considered
- [ ] Accessibility checked (for UI changes)

---

## Environment Variables

### Naming Convention
```bash
# Use SCREAMING_SNAKE_CASE
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-here
REVENUECAT_API_KEY_IOS=rc_ios_key

# Group by service
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Indicate environment
NODE_ENV=development
LOG_LEVEL=debug
```

### Never Commit
```bash
# .env should NEVER be committed
# Instead, commit .env.example with placeholder values

# .env.example
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
```

---

## Sprint-Specific Guidelines

### Phase 0-1 (Security Focus)
- Every database query must be reviewed for SQL injection
- All user inputs must be validated
- Security tests must be written alongside implementation

### Phase 2-3 (Feature Development)
- Write unit tests FIRST for core logic
- Integration tests for API endpoints
- Mobile screens must include loading/error states

### Phase 4-6 (Analytics & ML)
- Document calculation methodologies
- Include sample data in tests
- Add confidence scores to predictions

### Phase 7 (UX)
- Test on multiple screen sizes
- Verify keyboard navigation
- Check color contrast ratios

### Phase 8 (Testing)
- Aim for 90%+ coverage on critical paths
- Include performance benchmarks
- Document test scenarios

---

## Questions or Exceptions?

If you encounter a situation not covered by these standards:
1. Document your approach
2. Note it in PR description
3. Be consistent with similar existing code
4. When in doubt, ask for clarification

**Remember**: These standards exist to maintain code quality and team velocity. They're guidelines, not rigid rules. Use professional judgment.
