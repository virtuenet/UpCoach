# Test Patterns

Established testing patterns and best practices for the UpCoach platform.

## Table of Contents

- [E2E Journey Pattern](#e2e-journey-pattern)
- [Dynamic Import Pattern](#dynamic-import-pattern)
- [Mock Database Pattern](#mock-database-pattern)
- [API Response Pattern](#api-response-pattern)
- [Service Mocking Patterns](#service-mocking-patterns)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

## E2E Journey Pattern

### Overview

The E2E Journey Pattern tests complete user workflows from start to finish using in-memory mocks
instead of HTTP requests.

**Success Rate:** 158/158 tests (100%)

### When to Use

- Testing multi-step user journeys
- Integration testing without HTTP layer
- Business logic validation
- State persistence across steps

### Pattern Structure

```typescript
describe('[Feature] Journey', () => {
  // 1. In-memory mock databases
  const mockUsers: any[] = [];
  const mockGoals: any[] = [];
  const mockSessions: any[] = [];

  // 2. Journey state variables
  let userId: string;
  let goalId: string;
  let sessionId: string;

  // 3. Setup mock infrastructure (once)
  beforeAll(() => {
    // Mock external services
    jest.mock('../services/StripeService');
    jest.mock('../services/EmailService');

    // Configure mocks
    mockStripe.customers.create.mockResolvedValue({ id: 'cus_123' });
  });

  // 4. Clean up after all tests
  afterAll(() => {
    jest.clearAllMocks();
  });

  // 5. Test each step in the journey
  test('Step 1: User registers', () => {
    const userData = {
      email: 'user@example.com',
      password: 'SecurePass123!',
    };

    const user = registerUserLogic(userData);
    mockUsers.push(user);
    userId = user.id;

    expect(user).toMatchObject({
      id: expect.any(String),
      email: userData.email,
      createdAt: expect.any(Date),
    });
  });

  test('Step 2: User creates goal', () => {
    const goalData = {
      userId,
      title: 'Learn TypeScript',
      description: 'Master TypeScript in 30 days',
    };

    const goal = createGoalLogic(goalData);
    mockGoals.push(goal);
    goalId = goal.id;

    expect(goal).toMatchObject({
      id: expect.any(String),
      userId,
      title: goalData.title,
    });
  });

  test('Step 3: User tracks progress', () => {
    const progress = updateGoalProgressLogic({
      goalId,
      userId,
      progress: 50,
    });

    const goal = mockGoals.find(g => g.id === goalId);
    goal.progress = progress.progress;

    expect(progress.progress).toBe(50);
  });
});
```

### Key Principles

1. **State Persistence:** Use `beforeAll` instead of `beforeEach`
2. **In-Memory Storage:** Arrays/objects instead of real database
3. **Business Logic:** Test logic functions, not HTTP endpoints
4. **Journey Variables:** Track IDs across test steps
5. **Realistic Flow:** Follow actual user journey

### Example: Payment Flow

```typescript
describe('Payment Flow Journey', () => {
  const mockUsers: any[] = [];
  const mockSubscriptions: any[] = [];
  const mockPayments: any[] = [];

  let userId: string;
  let customerId: string;
  let subscriptionId: string;

  beforeAll(() => {
    // Mock Stripe
    jest.mock('../services/StripeService', () => ({
      createCustomer: jest.fn(),
      createSubscription: jest.fn(),
      createPayment: jest.fn(),
    }));
  });

  test('should create Stripe customer', async () => {
    const user = { id: 'user_1', email: 'test@example.com' };
    mockUsers.push(user);
    userId = user.id;

    // Mock Stripe response
    const stripeCustomer = { id: 'cus_123', email: user.email };
    mockStripe.createCustomer.mockResolvedValue(stripeCustomer);

    const customer = await createStripeCustomer(user);
    customerId = customer.id;

    expect(customer.id).toBe('cus_123');
    expect(mockStripe.createCustomer).toHaveBeenCalledWith({
      email: user.email,
    });
  });

  test('should create subscription', async () => {
    const subscription = await createSubscription({
      customerId,
      priceId: 'price_monthly',
    });

    mockSubscriptions.push(subscription);
    subscriptionId = subscription.id;

    expect(subscription).toMatchObject({
      id: expect.any(String),
      customerId,
      status: 'active',
    });
  });

  test('should process payment', async () => {
    const payment = await processPayment({
      subscriptionId,
      amount: 2999, // $29.99
    });

    mockPayments.push(payment);

    expect(payment.status).toBe('succeeded');
    expect(payment.amount).toBe(2999);
  });
});
```

## Dynamic Import Pattern

### Overview

Solves global mock conflicts by dynamically importing modules after Jest setup.

### Problem Solved

- **GDPRService Blocker:** Module conflicts with global mocks
- **Circular Dependencies:** Import order issues
- **Mock Leakage:** One test's mocks affecting others

### Pattern Structure

```typescript
describe('Service with Module Conflicts', () => {
  let service: any;

  beforeAll(async () => {
    // 1. Unmock the specific module
    jest.unmock('../services/GDPRService');

    // 2. Dynamically import after unmocking
    const module = await import('../services/GDPRService');

    // 3. Instantiate service
    service = new module.GDPRService();
  });

  test('should work without mock conflicts', async () => {
    const result = await service.someMethod();
    expect(result).toBeDefined();
  });
});
```

### When to Use

- Module import conflicts
- Circular dependency errors
- Global mock interference
- Complex dependency trees

### Example: GDPR Service

```typescript
describe('GDPRService', () => {
  let gdprService: any;
  let mockDatabase: any;

  beforeAll(async () => {
    // Setup mock database first
    mockDatabase = {
      user: { findUnique: jest.fn(), delete: jest.fn() },
      goal: { findMany: jest.fn() },
      habit: { findMany: jest.fn() },
    };

    // Unmock GDPR service
    jest.unmock('../services/GDPRService');

    // Dynamic import
    const { GDPRService } = await import('../services/GDPRService');
    gdprService = new GDPRService(mockDatabase);
  });

  test('should export user data', async () => {
    const userId = 'user_123';

    mockDatabase.user.findUnique.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
    });
    mockDatabase.goal.findMany.mockResolvedValue([]);
    mockDatabase.habit.findMany.mockResolvedValue([]);

    const exportData = await gdprService.exportUserData(userId);

    expect(exportData).toMatchObject({
      user: expect.any(Object),
      goals: expect.any(Array),
      habits: expect.any(Array),
    });
  });
});
```

## Mock Database Pattern

### Overview

Use in-memory arrays/objects to simulate database behavior for fast, isolated tests.

### Pattern Structure

```typescript
// 1. Define mock storage
const mockUsers: User[] = [];
const mockGoals: Goal[] = [];

// 2. Create helper functions
const findUser = (id: string) => mockUsers.find(u => u.id === id);
const createUser = (data: UserInput) => {
  const user = {
    id: `user_${mockUsers.length + 1}`,
    ...data,
    createdAt: new Date(),
  };
  mockUsers.push(user);
  return user;
};

// 3. Use in tests
test('should create and find user', () => {
  const user = createUser({ email: 'test@example.com' });
  const found = findUser(user.id);

  expect(found).toEqual(user);
});
```

### Advanced Example: Relationships

```typescript
interface MockUser {
  id: string;
  email: string;
  goals?: MockGoal[];
}

interface MockGoal {
  id: string;
  userId: string;
  title: string;
}

const mockDatabase = {
  users: [] as MockUser[],
  goals: [] as MockGoal[],

  createUser(data: { email: string }): MockUser {
    const user = {
      id: `user_${this.users.length + 1}`,
      email: data.email,
    };
    this.users.push(user);
    return user;
  },

  createGoal(data: { userId: string; title: string }): MockGoal {
    const goal = {
      id: `goal_${this.goals.length + 1}`,
      userId: data.userId,
      title: data.title,
    };
    this.goals.push(goal);
    return goal;
  },

  getUserWithGoals(userId: string): MockUser | undefined {
    const user = this.users.find(u => u.id === userId);
    if (!user) return undefined;

    const goals = this.goals.filter(g => g.userId === userId);
    return { ...user, goals };
  },
};

// Usage in tests
test('should get user with goals', () => {
  const user = mockDatabase.createUser({ email: 'test@example.com' });
  mockDatabase.createGoal({ userId: user.id, title: 'Goal 1' });
  mockDatabase.createGoal({ userId: user.id, title: 'Goal 2' });

  const userWithGoals = mockDatabase.getUserWithGoals(user.id);

  expect(userWithGoals?.goals).toHaveLength(2);
});
```

## API Response Pattern

### Overview

Standardized response structure for all API endpoints.

### Success Response

```typescript
{
  success: true,
  data: {
    // Actual payload
  },
  message?: "Optional success message"
}
```

### Error Response

```typescript
{
  success: false,
  message: "User-friendly error message",
  error?: "ERROR_CODE"
}
```

### Testing Pattern

```typescript
describe('API Response Format', () => {
  test('should return success response', async () => {
    const response = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: expect.any(Object),
    });
  });

  test('should return error response', async () => {
    const response = await request(app).get('/api/v1/users/invalid-id');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      message: expect.any(String),
    });
  });
});
```

## Service Mocking Patterns

### Stripe Service

```typescript
jest.mock('../services/StripeService', () => ({
  createCustomer: jest.fn().mockResolvedValue({
    id: 'cus_test123',
    email: 'test@example.com',
  }),
  createSubscription: jest.fn().mockResolvedValue({
    id: 'sub_test123',
    status: 'active',
  }),
  createPayment: jest.fn().mockResolvedValue({
    id: 'pi_test123',
    status: 'succeeded',
  }),
  refund: jest.fn().mockResolvedValue({
    id: 'ref_test123',
    status: 'succeeded',
  }),
}));
```

### Email Service

```typescript
jest.mock('../services/EmailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({
    messageId: 'msg_test123',
    accepted: ['recipient@example.com'],
  }),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));
```

### OpenAI Service

```typescript
jest.mock('../services/AIService', () => ({
  generateCompletion: jest.fn().mockResolvedValue({
    text: 'AI generated response',
    model: 'gpt-4',
  }),
  analyzeEmotion: jest.fn().mockResolvedValue({
    emotion: 'positive',
    confidence: 0.95,
  }),
}));
```

### Redis Service

```typescript
jest.mock('../services/RedisService', () => ({
  get: jest.fn(),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
}));
```

## Anti-Patterns to Avoid

### ❌ Don't Mock Non-Existent Methods

```typescript
// BAD
mockService.methodThatDoesNotExist.mockResolvedValue('value');

// GOOD - Read implementation first
const implementation = await import('../services/RealService');
console.log(Object.keys(implementation)); // See actual methods
mockService.actualMethod.mockResolvedValue('value');
```

### ❌ Don't Use Global Mocks Everywhere

```typescript
// BAD - Affects all tests
jest.mock('../services/DatabaseService');

// GOOD - Scope to specific tests
describe('Specific test suite', () => {
  beforeAll(() => {
    jest.mock('../services/DatabaseService');
  });

  afterAll(() => {
    jest.unmock('../services/DatabaseService');
  });
});
```

### ❌ Don't Assume API Signatures

```typescript
// BAD - Guessing parameters
service.createUser('email', 'password');

// GOOD - Read actual implementation
// From services/UserService.ts:
// createUser({ email, password, name? }: CreateUserInput)
service.createUser({ email: 'test@example.com', password: 'pass123' });
```

### ❌ Don't Batch Todo Completions

```typescript
// BAD - Marking multiple todos complete at once
// Mark todos 1, 2, 3 all as completed

// GOOD - Mark complete immediately after finishing
test('should do task 1', () => {
  // do task 1
  // ✅ Mark todo 1 complete NOW
});

test('should do task 2', () => {
  // do task 2
  // ✅ Mark todo 2 complete NOW
});
```

### ❌ Don't Test HTTP in E2E Journeys

```typescript
// BAD - Using supertest in journey tests
const response = await request(app).post('/api/users');

// GOOD - Test business logic directly
const user = registerUserLogic({ email, password });
```

## Quick Reference

### E2E Journey Checklist

- [ ] In-memory mock databases defined
- [ ] Journey state variables declared
- [ ] `beforeAll` for infrastructure setup
- [ ] Each test represents a journey step
- [ ] Business logic functions (not HTTP)
- [ ] Realistic data flows
- [ ] State persists across tests

### Dynamic Import Checklist

- [ ] `jest.unmock()` called before import
- [ ] Module imported with `await import()`
- [ ] Service instantiated after import
- [ ] Dependencies mocked separately
- [ ] No circular dependency errors

### Mock Database Checklist

- [ ] Arrays/objects for storage
- [ ] Helper functions for CRUD
- [ ] Unique IDs generated
- [ ] Relationships maintained
- [ ] Clean up in `afterAll`

---

**Related Documentation:**

- [Testing Overview](TESTING_OVERVIEW.md)
- [Session Summary](SESSION_SUMMARY.md)
- [Journey to 100%](../archive/journey-to-100/)
