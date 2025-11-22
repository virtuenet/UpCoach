# Service-Level Testing Guide

**Date**: 2025-11-03
**Status**: ✅ Implemented and Validated
**Test Results**: 26/26 tests passing in ~2 seconds

---

## Table of Contents
1. [Overview](#overview)
2. [Why Service-Level Tests?](#why-service-level-tests)
3. [Architecture](#architecture)
4. [Getting Started](#getting-started)
5. [Writing Service-Level Tests](#writing-service-level-tests)
6. [Test Patterns](#test-patterns)
7. [Best Practices](#best-practices)
8. [Examples](#examples)
9. [Running Tests](#running-tests)

---

## Overview

Service-level tests are **integration tests that focus on business logic** by testing service classes directly without the overhead of HTTP endpoints or database connections. They sit between unit tests and E2E tests in the testing pyramid.

### Test Pyramid Position

```
         /\
        /  \     E2E Tests (slowest, most comprehensive)
       /____\
      /      \   Service-Level Tests (fast, business logic focus)
     /________\
    /          \ Unit Tests (fastest, most focused)
   /____________\
```

### What Service-Level Tests Validate

✅ **Business Logic Integration**: Multiple services working together
✅ **Service Workflows**: Complete user flows at the service layer
✅ **Cross-Service Communication**: Service A calling Service B
✅ **Error Handling**: Business logic error scenarios
✅ **Data Transformation**: Data flowing through service layers

❌ **NOT Tested**: HTTP routing, database queries, network calls

---

## Why Service-Level Tests?

### Problem We Solved

During Week 3-4 integration test implementation, we encountered blocking issues:

1. **Sequelize Mock Conflicts**: Jest mocking conflicted with sequelize-typescript decorators
2. **Full App Initialization**: HTTP tests required loading entire Express app → all routes → all controllers → all services → all models
3. **Database Dependency**: Integration tests required test database setup
4. **Slow Execution**: Full stack tests took 5-10 minutes to run

### Solution: Service-Level Testing

**Benefits Achieved**:
- ⚡ **Fast**: 2 seconds vs 5-10 minutes for full integration tests
- 🎯 **Focused**: Tests business logic, not infrastructure
- 🔧 **Easy to Debug**: Failures point directly to business logic issues
- 🚀 **No Setup**: No database, no app initialization, no HTTP layer
- ✅ **Reliable**: No flaky database connection issues
- 📈 **Scalable**: Easy to add new tests without infrastructure overhead

### Comparison

| Aspect | Service-Level | HTTP Integration | E2E |
|--------|---------------|------------------|-----|
| **Speed** | ~2 seconds | 5-10 minutes | 10-30 minutes |
| **Setup** | None | Database + App | Full stack |
| **Focus** | Business logic | HTTP + Logic | User flows |
| **Reliability** | High | Medium | Low |
| **Debug** | Easy | Medium | Hard |
| **Maintenance** | Low | Medium | High |

---

## Architecture

### Test Structure

```
src/
├── __tests__/
│   ├── service-integration/         # Service-level integration tests
│   │   ├── UserRegistrationService.test.ts
│   │   ├── GoalManagementService.test.ts
│   │   └── ...
│   ├── helpers/                     # Test utilities
│   │   ├── test-factories.ts        # Test data factories
│   │   └── mock-repositories.ts     # Mock repositories & services
│   ├── services/                    # Unit tests (legacy)
│   ├── integration/                 # HTTP integration tests (blocked)
│   └── e2e/                         # E2E tests (blocked)
├── services/                        # Service classes being tested
└── models/                          # Database models
```

### Dependency Flow

```
Test
  ↓
Service Under Test (e.g., UserRegistrationService)
  ↓
Mock Repositories (replace database access)
  ↓
Mock External Services (replace Stripe, Email, AI, etc.)
```

### Key Files

1. **`jest.config.service.js`**: Jest configuration for service tests
2. **`src/__tests__/helpers/test-factories.ts`**: Creates realistic test data
3. **`src/__tests__/helpers/mock-repositories.ts`**: Mock data access layer
4. **`src/__tests__/service-integration/*.test.ts`**: Service test files

---

## Getting Started

### Prerequisites

- Node.js 20+
- TypeScript
- Jest and ts-jest installed

### Installation

Service-level tests use existing dependencies. No additional setup needed.

### First Test

Create a file `src/__tests__/service-integration/MyService.test.ts`:

```typescript
import { TestFactories } from '../helpers/test-factories';
import { MockRepositories, MockServices } from '../helpers/mock-repositories';

describe('MyService Integration', () => {
  let service: MyService;
  let mockRepo: any;
  let mockExternalService: any;

  beforeEach(() => {
    // Create mocks
    mockRepo = MockRepositories.createMyRepository();
    mockExternalService = MockServices.createExternalService();

    // Instantiate service with mocks
    service = new MyService(mockRepo, mockExternalService);
  });

  test('should perform business operation', async () => {
    // Arrange: Set up test data and mock responses
    const testData = TestFactories.createMyData();
    mockRepo.findOne.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue(testData);

    // Act: Execute business logic
    const result = await service.doSomething(testData);

    // Assert: Verify behavior
    expect(result).toMatchObject({ id: testData.id });
    expect(mockRepo.create).toHaveBeenCalledWith(testData);
    expect(mockExternalService.notify).toHaveBeenCalled();
  });
});
```

---

## Writing Service-Level Tests

### Step 1: Create Service Class (if needed)

Service-level tests work best when services are **extracted from controllers**:

```typescript
// Before: Logic in controller
export class UserController {
  async register(req: Request, res: Response) {
    const { email, password } = req.body;

    // Business logic mixed with HTTP
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });
    await GamificationService.initializeUser(user.id);
    await EmailService.sendVerification(user.email);

    res.json({ user });
  }
}
```

```typescript
// After: Logic extracted to service
export class UserRegistrationService {
  constructor(
    private userRepo: UserRepository,
    private gamificationService: GamificationService,
    private emailService: EmailService,
    private authService: AuthService
  ) {}

  async register(data: { email: string; password: string }) {
    // Pure business logic
    const existingUser = await this.userRepo.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await this.authService.hashPassword(data.password);
    const user = await this.userRepo.create({ ...data, password: hashedPassword });

    await this.gamificationService.initializeUser(user.id);
    await this.emailService.sendVerificationEmail(user.email);

    return { user };
  }
}

// Controller becomes thin HTTP adapter
export class UserController {
  constructor(private registrationService: UserRegistrationService) {}

  async register(req: Request, res: Response) {
    try {
      const result = await this.registrationService.register(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

### Step 2: Add Test Data Factory

In `src/__tests__/helpers/test-factories.ts`:

```typescript
export class TestFactories {
  static createUser(overrides?: Partial<any>) {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: faker.internet.password({ length: 12 }),
      role: 'user',
      emailVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }
}
```

### Step 3: Add Mock Repository

In `src/__tests__/helpers/mock-repositories.ts`:

```typescript
export class MockRepositories {
  static createUserRepository() {
    return {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      count: jest.fn(),
    };
  }
}

export class MockServices {
  static createGamificationService() {
    return {
      initializeUser: jest.fn().mockResolvedValue({ level: 1, totalPoints: 0 }),
      awardPoints: jest.fn().mockResolvedValue({ pointsAwarded: 50 }),
    };
  }
}
```

### Step 4: Write the Test

```typescript
describe('UserRegistrationService Integration', () => {
  let service: UserRegistrationService;
  let mockUserRepo: any;
  let mockGamificationService: any;
  let mockEmailService: any;
  let mockAuthService: any;

  beforeEach(() => {
    mockUserRepo = MockRepositories.createUserRepository();
    mockGamificationService = MockServices.createGamificationService();
    mockEmailService = MockServices.createEmailService();
    mockAuthService = MockServices.createAuthService();

    service = new UserRegistrationService(
      mockUserRepo,
      mockGamificationService,
      mockEmailService,
      mockAuthService
    );
  });

  describe('Successful Registration', () => {
    test('should register new user with gamification', async () => {
      // Arrange
      const registrationData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const createdUser = TestFactories.createUser(registrationData);

      mockUserRepo.findOne.mockResolvedValue(null); // Email not taken
      mockUserRepo.create.mockResolvedValue(createdUser);
      mockAuthService.hashPassword.mockResolvedValue('hashed_password_123');

      // Act
      const result = await service.register(registrationData);

      // Assert
      expect(result).toMatchObject({
        user: {
          id: createdUser.id,
          email: registrationData.email,
        },
      });

      expect(mockUserRepo.create).toHaveBeenCalledWith({
        ...registrationData,
        password: 'hashed_password_123',
      });

      expect(mockGamificationService.initializeUser).toHaveBeenCalledWith(createdUser.id);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(registrationData.email);
    });
  });

  describe('Error Handling', () => {
    test('should reject duplicate email registration', async () => {
      // Arrange
      const existingUser = TestFactories.createUser({ email: 'test@example.com' });
      mockUserRepo.findOne.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(
        service.register({ email: 'test@example.com', password: 'password' })
      ).rejects.toThrow('Email already registered');

      expect(mockUserRepo.create).not.toHaveBeenCalled();
      expect(mockGamificationService.initializeUser).not.toHaveBeenCalled();
    });
  });
});
```

---

## Test Patterns

### Pattern 1: Happy Path Integration

Tests the complete successful flow through a service:

```typescript
test('should complete successful user registration flow', async () => {
  // 1. Mock all dependencies to succeed
  mockUserRepo.findOne.mockResolvedValue(null);
  mockUserRepo.create.mockResolvedValue(createdUser);
  mockGamificationService.initializeUser.mockResolvedValue({ level: 1 });
  mockEmailService.sendVerificationEmail.mockResolvedValue(true);

  // 2. Execute the flow
  const result = await service.register(registrationData);

  // 3. Verify all steps executed in order
  expect(mockUserRepo.findOne).toHaveBeenCalledBefore(mockUserRepo.create);
  expect(mockUserRepo.create).toHaveBeenCalledBefore(mockGamificationService.initializeUser);
  expect(mockGamificationService.initializeUser).toHaveBeenCalledBefore(mockEmailService.sendVerificationEmail);

  // 4. Verify final result
  expect(result.user.id).toBe(createdUser.id);
});
```

### Pattern 2: Error Scenarios

Tests business logic error handling:

```typescript
test('should handle duplicate email registration', async () => {
  mockUserRepo.findOne.mockResolvedValue(existingUser);

  await expect(service.register(registrationData)).rejects.toThrow('Email already registered');

  expect(mockUserRepo.create).not.toHaveBeenCalled();
});

test('should handle gamification initialization failure', async () => {
  mockUserRepo.findOne.mockResolvedValue(null);
  mockUserRepo.create.mockResolvedValue(createdUser);
  mockGamificationService.initializeUser.mockRejectedValue(new Error('Gamification failed'));

  await expect(service.register(registrationData)).rejects.toThrow('Gamification failed');
});
```

### Pattern 3: Cross-Service Integration

Tests multiple services working together:

```typescript
test('should integrate goal creation with gamification', async () => {
  // Arrange
  const goalData = TestFactories.createGoal();
  mockGoalRepo.create.mockResolvedValue(goalData);
  mockGamificationService.awardPoints.mockResolvedValue({
    pointsAwarded: 50,
    totalPoints: 150,
    levelUp: false
  });

  // Act
  const result = await goalService.createGoal(goalData);

  // Assert: Verify both services called correctly
  expect(mockGoalRepo.create).toHaveBeenCalledWith(goalData);
  expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
    goalData.userId,
    'goal_created',
    50
  );

  // Verify result includes both goal and gamification data
  expect(result).toMatchObject({
    goal: goalData,
    gamification: { pointsAwarded: 50, totalPoints: 150 },
  });
});
```

### Pattern 4: Sequential Operations

Tests multi-step workflows:

```typescript
test('should complete goal with milestone progression', async () => {
  // Step 1: Create goal
  const goal = TestFactories.createGoal({ status: 'active' });
  mockGoalRepo.create.mockResolvedValue(goal);

  const createdGoal = await goalService.createGoal(goal);

  // Step 2: Add milestones
  const milestone1 = TestFactories.createMilestone({ goalId: createdGoal.id });
  mockMilestoneRepo.create.mockResolvedValue(milestone1);

  await goalService.addMilestone(createdGoal.id, milestone1);

  // Step 3: Complete milestone
  mockMilestoneRepo.update.mockResolvedValue([1]);
  mockGoalRepo.findByPk.mockResolvedValue({ ...createdGoal, progress: 50 });

  await goalService.completeMilestone(milestone1.id);

  // Verify progression
  expect(mockGoalRepo.update).toHaveBeenCalledWith(
    { progress: 50 },
    { where: { id: createdGoal.id } }
  );
});
```

### Pattern 5: State Transitions

Tests business state changes:

```typescript
test('should transition goal from active to completed', async () => {
  const activeGoal = TestFactories.createGoal({ status: 'active', progress: 90 });
  mockGoalRepo.findByPk.mockResolvedValue(activeGoal);
  mockGoalRepo.update.mockResolvedValue([1]);
  mockGamificationService.awardPoints.mockResolvedValue({ pointsAwarded: 100 });

  await goalService.completeGoal(activeGoal.id);

  expect(mockGoalRepo.update).toHaveBeenCalledWith(
    { status: 'completed', progress: 100, completedAt: expect.any(Date) },
    { where: { id: activeGoal.id } }
  );

  expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
    activeGoal.userId,
    'goal_completed',
    100
  );
});
```

---

## Best Practices

### 1. Mock at the Repository Layer

✅ **DO**: Mock repositories (data access layer)
```typescript
mockUserRepo.findOne.mockResolvedValue(user);
mockUserRepo.create.mockResolvedValue(newUser);
```

❌ **DON'T**: Mock individual database methods
```typescript
User.findOne = jest.fn(); // Too low-level
```

### 2. Use Factories for Test Data

✅ **DO**: Use factories for consistent, realistic data
```typescript
const user = TestFactories.createUser({ email: 'specific@example.com' });
```

❌ **DON'T**: Manually create test data everywhere
```typescript
const user = { id: '123', email: 'test@example.com', ... }; // Repetitive
```

### 3. Test Business Logic, Not Infrastructure

✅ **DO**: Test service behavior
```typescript
test('should award points when goal is created', async () => {
  await goalService.createGoal(goalData);
  expect(mockGamificationService.awardPoints).toHaveBeenCalled();
});
```

❌ **DON'T**: Test database operations
```typescript
test('should call User.create with correct params', async () => {
  // Too focused on implementation details
});
```

### 4. Keep Tests Independent

✅ **DO**: Reset mocks in beforeEach
```typescript
beforeEach(() => {
  mockRepo = MockRepositories.createUserRepository();
  service = new UserService(mockRepo);
});
```

❌ **DON'T**: Share state between tests
```typescript
const mockRepo = MockRepositories.createUserRepository(); // Shared state
```

### 5. Use Descriptive Test Names

✅ **DO**: Clear, behavior-focused names
```typescript
test('should send verification email after successful registration', ...);
test('should reject registration when email already exists', ...);
```

❌ **DON'T**: Implementation-focused names
```typescript
test('register function test', ...);
test('test case 1', ...);
```

### 6. Assert on Behavior, Not Implementation

✅ **DO**: Verify outcomes
```typescript
expect(result.user.email).toBe('test@example.com');
expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
```

❌ **DON'T**: Over-specify implementation
```typescript
expect(mockUserRepo.create).toHaveBeenCalledWith({ /* exact object match */ });
```

### 7. Group Related Tests

✅ **DO**: Use nested describe blocks
```typescript
describe('UserRegistrationService', () => {
  describe('Successful Registration', () => {
    test('should register new user', ...);
    test('should initialize gamification', ...);
  });

  describe('Error Handling', () => {
    test('should reject duplicate email', ...);
    test('should reject invalid password', ...);
  });
});
```

---

## Examples

### Example 1: User Registration Service

**File**: `src/__tests__/service-integration/UserRegistrationService.test.ts`

**What It Tests**:
- User registration flow
- Email verification
- Gamification initialization
- Error handling (duplicate email, weak password)

**Key Test**:
```typescript
test('should complete registration with gamification initialization', async () => {
  const registrationData = {
    email: 'john@example.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe',
  };

  const createdUser = TestFactories.createUser(registrationData);
  const gamificationResult = { level: 1, totalPoints: 50 };

  mockUserRepo.findOne.mockResolvedValue(null);
  mockUserRepo.create.mockResolvedValue(createdUser);
  mockGamificationService.initializeUser.mockResolvedValue(gamificationResult);

  const result = await service.register(registrationData);

  expect(result).toMatchObject({
    user: { email: 'john@example.com' },
    gamification: { level: 1, totalPoints: 50 },
  });
});
```

### Example 2: Goal Management Service

**File**: `src/__tests__/service-integration/GoalManagementService.test.ts`

**What It Tests**:
- Goal creation with achievement unlocking
- Milestone completion and progress tracking
- AI recommendation integration
- Full goal lifecycle (create → progress → complete)

**Key Test**:
```typescript
test('should unlock achievement when goal is created', async () => {
  const goalData = TestFactories.createGoal();
  const achievement = TestFactories.createAchievement({ id: 'first_goal' });

  mockGoalRepo.create.mockResolvedValue(goalData);
  mockGamificationService.awardPoints.mockResolvedValue({ pointsAwarded: 50 });
  mockGamificationService.unlockAchievement.mockResolvedValue({
    achievement,
    justUnlocked: true,
  });

  const result = await goalService.createGoalWithAchievements(goalData);

  expect(result.achievement.justUnlocked).toBe(true);
  expect(mockGamificationService.unlockAchievement).toHaveBeenCalledWith(
    goalData.userId,
    'first_goal'
  );
});
```

---

## Running Tests

### Run All Service Tests

```bash
npm run test:service
```

**Output**:
```
PASS src/__tests__/service-integration/GoalManagementService.test.ts
PASS src/__tests__/service-integration/UserRegistrationService.test.ts

Test Suites: 2 passed, 2 total
Tests:       26 passed, 26 total
Time:        1.965 s
```

### Run Tests in Watch Mode

```bash
npm run test:service:watch
```

### Run with Coverage

```bash
npm run test:service:coverage
```

### Run Specific Test File

```bash
npm run test:service -- UserRegistrationService
```

### Run Specific Test

```bash
npm run test:service -- -t "should register new user"
```

---

## Troubleshooting

### Issue: Tests are slow

**Solution**: Check if you're accidentally loading the full app or real database.

✅ Service tests should be < 5 seconds
❌ If > 10 seconds, you're likely loading too much infrastructure

### Issue: Mock not being called

**Solution**: Verify mock is created before service instantiation:

```typescript
beforeEach(() => {
  mockRepo = MockRepositories.createUserRepository(); // Create first
  service = new MyService(mockRepo); // Then pass to service
});
```

### Issue: Type errors with mocks

**Solution**: Use `any` type for mocks in tests:

```typescript
let mockRepo: any; // Not UserRepository - too strict for mocks
```

### Issue: Test pollution (tests affecting each other)

**Solution**: Ensure `beforeEach` recreates all mocks:

```typescript
beforeEach(() => {
  mockRepo = MockRepositories.createUserRepository(); // New instance each time
  service = new MyService(mockRepo);
});
```

---

## Migration Guide: HTTP Integration → Service-Level

### Step 1: Identify Service Logic

**Before** (HTTP Integration Test):
```typescript
test('should register user via POST /api/register', async () => {
  const response = await request(app)
    .post('/api/register')
    .send({ email: 'test@example.com', password: 'password' })
    .expect(201);
});
```

**Identify**: The business logic is in the controller or service that handles registration.

### Step 2: Extract Service Class

If logic is in controller, extract it to a service:

```typescript
// services/UserRegistrationService.ts
export class UserRegistrationService {
  constructor(
    private userRepo: UserRepository,
    private emailService: EmailService,
    private gamificationService: GamificationService
  ) {}

  async register(data: { email: string; password: string }) {
    // Business logic here
  }
}
```

### Step 3: Create Service-Level Test

```typescript
// __tests__/service-integration/UserRegistrationService.test.ts
describe('UserRegistrationService Integration', () => {
  let service: UserRegistrationService;
  let mockUserRepo: any;
  let mockEmailService: any;
  let mockGamificationService: any;

  beforeEach(() => {
    mockUserRepo = MockRepositories.createUserRepository();
    mockEmailService = MockServices.createEmailService();
    mockGamificationService = MockServices.createGamificationService();

    service = new UserRegistrationService(
      mockUserRepo,
      mockEmailService,
      mockGamificationService
    );
  });

  test('should register new user with gamification', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue(createdUser);

    const result = await service.register({ email: 'test@example.com', password: 'password' });

    expect(result.user.email).toBe('test@example.com');
    expect(mockGamificationService.initializeUser).toHaveBeenCalled();
  });
});
```

---

## Next Steps

1. **Write More Service Tests**: Refactor payment flow, coaching session flow to service-level tests
2. **Add API Contract Tests**: Test HTTP layer separately with contract testing
3. **E2E Tests**: Add a few critical E2E tests for key user journeys
4. **CI/CD Integration**: Add service tests to CI pipeline (they're fast!)

---

## Resources

- [TESTING_STATUS.md](./TESTING_STATUS.md) - Current testing status and history
- [TESTING_ROADMAP.md](./TESTING_ROADMAP.md) - 3-month testing plan
- [jest.config.service.js](./jest.config.service.js) - Jest configuration for service tests
- [src/__tests__/helpers/test-factories.ts](./src/__tests__/helpers/test-factories.ts) - Test data factories
- [src/__tests__/helpers/mock-repositories.ts](./src/__tests__/helpers/mock-repositories.ts) - Mock utilities

---

## Summary

Service-level testing provides:
- ⚡ **Fast execution** (2 seconds vs 5-10 minutes)
- 🎯 **Focused testing** (business logic only)
- 🔧 **Easy debugging** (clear failure messages)
- 🚀 **No infrastructure** (no database, no app init)
- ✅ **High reliability** (no flaky tests)
- 📈 **Easy scaling** (add tests without overhead)

This approach solved our Week 3-4 integration testing blockers and provides a sustainable path forward for comprehensive business logic testing.

**Current Status**: ✅ 26/26 tests passing in ~2 seconds
**Recommendation**: Continue with service-level tests for all business logic, supplement with API contract tests for HTTP layer validation.
