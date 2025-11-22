# API Documentation Guide

Guide for adding Swagger/OpenAPI documentation to UpCoach API endpoints.

## Table of Contents

- [Overview](#overview)
- [Setup Complete](#setup-complete)
- [Documentation Pattern](#documentation-pattern)
- [Examples](#examples)
- [Progress Tracker](#progress-tracker)
- [How to Add Documentation](#how-to-add-documentation)

## Overview

The UpCoach API uses **Swagger/OpenAPI 3.0** for interactive API documentation. Swagger UI is
available at `/api-docs` when running in development mode.

### Technologies

- `swagger-jsdoc` - Generates OpenAPI specification from JSDoc comments
- `swagger-ui-express` - Serves interactive Swagger UI
- OpenAPI 3.0 - Industry-standard API specification format

## Setup Complete

✅ **What's Already Done:**

1. **Swagger packages installed** (`swagger-jsdoc`, `swagger-ui-express`, TypeScript types)
2. **Swagger configuration created** ([src/config/swagger.ts](../src/config/swagger.ts))
3. **Swagger integrated into app** ([src/app.ts](../src/app.ts))
4. **Common schemas defined** (User, Goal, Habit, Subscription, Error responses)
5. **Sample routes documented** (Notifications: 6 endpoints, Auth: 2 endpoints)

### Access Swagger UI

**Development:**

```bash
npm run dev
# Navigate to: http://localhost:8080/api-docs
```

**OpenAPI JSON:**

- http://localhost:8080/api-docs.json

## Documentation Pattern

### Basic JSDoc Format

```typescript
/**
 * @swagger
 * /api/endpoint-path:
 *   method:
 *     summary: Short description
 *     description: Detailed description of what this endpoint does
 *     tags: [Category Name]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field1
 *               - field2
 *             properties:
 *               field1:
 *                 type: string
 *                 description: Description of field1
 *                 example: "example value"
 *               field2:
 *                 type: integer
 *                 example: 42
 *     responses:
 *       200:
 *         description: Success response description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.method('/endpoint-path', ...handlers);
```

### Reusable Components

Use component references to avoid repetition:

**Pre-defined Schemas** (in [src/config/swagger.ts](../src/config/swagger.ts)):

- `#/components/schemas/User`
- `#/components/schemas/Goal`
- `#/components/schemas/Habit`
- `#/components/schemas/Subscription`
- `#/components/schemas/SuccessResponse`
- `#/components/schemas/ErrorResponse`
- `#/components/schemas/PaginatedResponse`
- `#/components/schemas/AuthResponse`
- `#/components/schemas/UserRegistration`
- `#/components/schemas/UserLogin`
- `#/components/schemas/NotificationPayload`

**Pre-defined Responses:**

- `#/components/responses/Unauthorized` - 401 errors
- `#/components/responses/Forbidden` - 403 errors
- `#/components/responses/NotFound` - 404 errors
- `#/components/responses/ValidationError` - 400 validation errors
- `#/components/responses/RateLimitExceeded` - 429 rate limit errors

### Tags (Categories)

Available tags defined in swagger.ts:

- `Authentication` - Login, register, password reset
- `Users` - User management
- `Goals` - Goal CRUD and tracking
- `Habits` - Habit tracking
- `Tasks` - Task management
- `Mood` - Mood tracking
- `Voice Journal` - Voice journal entries
- `Chat` - Messaging
- `Coaches` - Coach profiles
- `Notifications` - Push notifications
- `Payments` - Stripe integration
- `Analytics` - User analytics
- `AI Services` - AI features
- `Enterprise` - SSO, teams, orgs
- `Health` - System health

## Examples

### Example 1: Simple GET Endpoint

```typescript
/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', authMiddleware, async (req, res) => {
  // Implementation...
});
```

### Example 2: POST with Request Body

```typescript
/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Create new goal
 *     description: Create a new goal for the authenticated user
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGoal'
 *     responses:
 *       201:
 *         description: Goal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Goal'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', authMiddleware, async (req, res) => {
  // Implementation...
});
```

### Example 3: GET with Query Parameters

```typescript
/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: List user goals
 *     description: Retrieve a paginated list of the user's goals
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, paused, abandoned]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Goals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authMiddleware, async (req, res) => {
  // Implementation...
});
```

### Example 4: DELETE with Path Parameter

```typescript
/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     summary: Delete goal
 *     description: Delete a specific goal by ID
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Goal ID
 *     responses:
 *       200:
 *         description: Goal deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  // Implementation...
});
```

## Progress Tracker

### ✅ Fully Documented Routes (64/45+ endpoints)

- ✅ **Notifications** (6 endpoints)
  - POST `/api/notifications/register-token`
  - DELETE `/api/notifications/unregister-token`
  - POST `/api/notifications/send`
  - POST `/api/notifications/subscribe-topic`
  - POST `/api/notifications/unsubscribe-topic`
  - GET `/api/notifications/status`

- ✅ **Authentication** (13 endpoints)
  - POST `/api/auth/register` - Email/password registration
  - POST `/api/auth/login` - Email/password login
  - POST `/api/auth/refresh` - Exchange refresh token for new tokens
  - POST `/api/auth/logout` - Logout current session
  - POST `/api/auth/logout-all` - Logout every device
  - POST `/api/auth/change-password` - Authenticated password change
  - POST `/api/auth/forgot-password` - Request reset email
  - POST `/api/auth/reset-password` - Reset via token
  - GET `/api/auth/verify` - Validate bearer token
  - GET `/api/auth/profile` - Fetch profile via auth context
  - GET `/api/auth/verify-email` - Complete email verification
  - POST `/api/auth/resend-verification` - Resend verification link
  - POST `/api/auth/google` - Google OAuth login

- ✅ **Goals** (5 endpoints)
  - GET `/api/goals` - List user goals with filtering and pagination
  - POST `/api/goals` - Create new goal
  - GET `/api/goals/{id}` - Get goal by ID with milestones
  - PUT `/api/goals/{id}` - Update goal
  - DELETE `/api/goals/{id}` - Delete goal

- ✅ **Habits** (3 endpoints)
  - GET `/api/habits` - List user habits with filtering and pagination
  - POST `/api/habits` - Create new habit
  - POST `/api/habits/{id}/check-in` - Check in to habit

- ✅ **Users** (10 endpoints)
  - GET `/api/user/profile` - Get current user profile (legacy alias)
  - PUT `/api/user/profile` - Update current user profile (legacy alias)
  - POST `/api/user/profile/picture` - Upload profile picture
  - GET `/api/users/profile` - Tenant-aware profile fetch
  - PUT `/api/users/profile` - Tenant-aware profile update
  - GET `/api/users/statistics` - Engagement statistics summary
  - DELETE `/api/users/account` - Deactivate own account
  - GET `/api/users/all` - Admin list of users
  - GET `/api/users/{id}` - Admin lookup by ID
  - DELETE `/api/users/{id}` - Admin deactivation by ID

- ✅ **Tasks** (6 endpoints - extended coverage)
  - GET `/api/tasks` - List user tasks with filtering and pagination
  - GET `/api/tasks/{id}` - Get task by ID
  - POST `/api/tasks` - Create new task
  - PUT `/api/tasks/{id}` - Update task
  - DELETE `/api/tasks/{id}` - Delete task
  - GET `/api/tasks/stats/overview` - Task summary analytics

- ✅ **Mood** (7 endpoints - extended coverage)
  - GET `/api/mood` - List mood entries with filtering
  - GET `/api/mood/today` - Get today's entry
  - GET `/api/mood/stats/overview` - Mood analytics
  - GET `/api/mood/{id}` - Get entry by ID
  - POST `/api/mood` - Log mood entry
  - PUT `/api/mood/{id}` - Update entry
  - DELETE `/api/mood/{id}` - Delete entry

- ✅ **Chat** (3 endpoints)
  - GET `/api/chat/conversations` - List conversations
  - POST `/api/chat/conversations` - Start new conversation
  - POST `/api/chat/message` - Send message and get AI response

- ✅ **Financial** (11 endpoints)
  - POST `/api/financial/webhook/stripe` - Stripe webhook receiver
  - GET `/api/financial/dashboard` - Top-level financial overview
  - GET `/api/financial/dashboard/revenue` - Revenue-focused dashboard slice
  - GET `/api/financial/revenue/mrr` - Monthly recurring revenue metrics
  - GET `/api/financial/revenue/arr` - Annual recurring revenue metrics
  - GET `/api/financial/revenue/by-plan` - Revenue broken down by plan/tier
  - GET `/api/financial/reports` - List generated financial reports
  - POST `/api/financial/reports` - Create/generate a financial report
  - POST `/api/financial/reports/{id}/send` - Email an existing report
  - POST `/api/financial/reports/send` - Send an ad-hoc report payload
  - POST `/api/financial/reports/schedule` - Schedule recurring reports

### ⏳ Remaining Routes (~37 endpoints)

> For the up-to-date backlog, see `docs/api/API_DOCS_GAP_ANALYSIS.md`. The legacy checklist below will be refreshed after the next documentation sprint.

**Priority 1 - Critical Auth Routes:**

- [ ] POST `/api/auth/refresh` - Refresh access token
- [ ] POST `/api/auth/logout` - Logout user
- [ ] POST `/api/auth/forgot-password` - Request password reset
- [ ] POST `/api/auth/reset-password` - Reset password with token
- [ ] POST `/api/auth/change-password` - Change password (authenticated)
- [ ] POST `/api/auth/verify-email` - Verify email address
- [ ] GET `/api/auth/verify` - Check authentication status

**Priority 2 - Core Features:**

Goals Routes (`src/routes/goals.ts`):

- [ ] GET `/api/goals` - List goals
- [ ] POST `/api/goals` - Create goal
- [ ] GET `/api/goals/:id` - Get goal by ID
- [ ] PUT `/api/goals/:id` - Update goal
- [ ] DELETE `/api/goals/:id` - Delete goal
- [ ] PATCH `/api/goals/:id/progress` - Update progress

Habits Routes (`src/routes/habits.ts`):

- [ ] GET `/api/habits` - List habits
- [ ] POST `/api/habits` - Create habit
- [ ] GET `/api/habits/:id` - Get habit by ID
- [ ] PUT `/api/habits/:id` - Update habit
- [ ] DELETE `/api/habits/:id` - Delete habit
- [ ] POST `/api/habits/:id/check-in` - Log habit completion

Users Routes (`src/routes/user.ts`, `src/routes/users.ts`):

- [ ] GET `/api/users/me` - Get current user profile
- [ ] PUT `/api/users/me` - Update current user profile
- [ ] DELETE `/api/users/me` - Delete account (GDPR)
- [ ] GET `/api/users/:id` - Get user by ID (admin)

**Priority 3 - Secondary Features:**

Tasks Routes (`src/routes/tasks.ts`):

- [ ] GET `/api/tasks` - List tasks
- [ ] POST `/api/tasks` - Create task
- [ ] PUT `/api/tasks/:id` - Update task
- [ ] DELETE `/api/tasks/:id` - Delete task

Mood Routes (`src/routes/mood.ts`):

- [ ] POST `/api/mood` - Log mood entry
- [ ] GET `/api/mood/history` - Get mood history
- [ ] GET `/api/mood/analytics` - Get mood analytics

Chat Routes (`src/routes/chat.ts`):

- [ ] GET `/api/chats` - List conversations
- [ ] POST `/api/chats` - Start new conversation
- [ ] GET `/api/chats/:id/messages` - Get messages
- [ ] POST `/api/chats/:id/messages` - Send message

Financial Routes (`src/routes/financial.ts`):

- [ ] POST `/api/subscriptions` - Create subscription
- [ ] GET `/api/subscriptions/current` - Get current subscription
- [ ] POST `/api/subscriptions/cancel` - Cancel subscription
- [ ] GET `/api/payments/history` - Payment history

## How to Add Documentation

### Step 1: Choose a Route File

Start with high-priority routes (see Progress Tracker above). Open the route file:

```bash
cd src/routes
ls *.ts  # List all route files
```

### Step 2: Add Swagger Comment

Add a `@swagger` JSDoc comment **immediately above** the route handler:

```typescript
// BEFORE
router.post('/goals', authMiddleware, async (req, res) => { ... });

// AFTER
/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Create new goal
 *     ...
 */
router.post('/goals', authMiddleware, async (req, res) => { ... });
```

### Step 3: Follow the Pattern

Use the examples in this guide as templates. Copy and modify for your endpoint.

### Step 4: Test Documentation

1. Start dev server: `npm run dev`
2. Open Swagger UI: http://localhost:8080/api-docs
3. Find your endpoint in the UI
4. Click "Try it out" to test
5. Verify request/response formats match

### Step 5: Update Progress Tracker

Mark the endpoint as ✅ complete in this document's Progress Tracker.

## Tips & Best Practices

### 1. Use Reusable Schemas

Don't redefine common schemas. Use references:

```typescript
// ❌ BAD - Repeating schema definition
schema: type: object;
properties: id: {
  type: string;
}
email: {
  type: string;
}
name: {
  type: string;
}

// ✅ GOOD - Using component reference
schema: $ref: '#/components/schemas/User';
```

### 2. Add Examples

Examples help API consumers understand request/response formats:

```typescript
properties:
  email:
    type: string
    format: email
    example: "user@example.com"  # Add example!
  age:
    type: integer
    example: 25  # Add example!
```

### 3. Document Error Responses

Include all possible error codes:

```typescript
responses:
  200: { ... }
  400: { $ref: '#/components/responses/ValidationError' }
  401: { $ref: '#/components/responses/Unauthorized' }
  404: { $ref: '#/components/responses/NotFound' }
  500: { description: 'Server error' }
```

### 4. Use Descriptive Summaries

Summaries appear in the Swagger UI sidebar:

```typescript
summary: "Get user profile"  # ❌ Too short
summary: "Get authenticated user's complete profile with preferences"  # ✅ Better
```

### 5. Tag Consistently

Use existing tags from swagger.ts. Don't create new tags unless necessary.

### 6. Test As You Go

After documenting 3-5 endpoints, test in Swagger UI to catch issues early.

## Common Issues & Solutions

### Issue 1: Endpoint Not Appearing

**Problem:** Added @swagger comment but endpoint doesn't show in Swagger UI

**Solution:**

- Check that route file is in `src/routes/**/*.ts` (covered by swagger.ts APIs pattern)
- Restart dev server (`npm run dev`)
- Check for YAML syntax errors in @swagger comment

### Issue 2: Schema Not Found

**Problem:** `$ref: '#/components/schemas/MySchema'` shows error

**Solution:**

- Schema must be defined in `src/config/swagger.ts` under `components.schemas`
- Check spelling and exact case sensitivity

### Issue 3: Authentication Not Working

**Problem:** "Authorize" button in Swagger UI doesn't work

**Solution:**

1. Click "Authorize" button in Swagger UI
2. Enter: `Bearer <your-access-token>`
3. Get token from POST /api/auth/login response

## Adding New Component Schemas

If you need a new reusable schema, add it to [src/config/swagger.ts](../src/config/swagger.ts):

```typescript
// In swagger.ts -> components.schemas
MyNewSchema: {
  type: 'object',
  properties: {
    field1: { type: 'string', example: 'value' },
    field2: { type: 'integer', example: 42 },
  },
  required: ['field1']
}
```

Then reference it:

```typescript
schema: $ref: '#/components/schemas/MyNewSchema';
```

## Resources

- [Swagger JSDoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/) - Test YAML snippets
- [UpCoach Swagger Config](../src/config/swagger.ts)

---

**Last Updated:** November 21, 2025 **Progress:** 46/45+ endpoints documented (≈100%) **Next
Priority:** Document Financial, Voice Journal, Enterprise, Webhook, and Health APIs
