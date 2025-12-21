# Contributing to UpCoach

Thank you for your interest in contributing to UpCoach! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing Guidelines](#testing-guidelines)
8. [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility and apologize for mistakes
- Prioritize the community's best interests

## Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **Flutter** 3.24.x or higher
- **Docker** & Docker Compose
- **Git** with SSH key configured
- **PostgreSQL** 15.x (or use Docker)
- **Redis** 7.x (or use Docker)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone git@github.com:upcoach/upcoach.git
   cd upcoach
   ```

2. **Install dependencies**
   ```bash
   # Install Node.js dependencies
   npm install

   # Install API dependencies
   cd services/api && npm install && cd ../..

   # Install Admin Panel dependencies
   cd apps/admin-panel && npm install && cd ../..

   # Install Flutter dependencies
   cd apps/mobile && flutter pub get && cd ../..
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment files
   cp services/api/.env.example services/api/.env
   cp apps/admin-panel/.env.example apps/admin-panel/.env
   ```

4. **Start development services**
   ```bash
   # Using Docker Compose
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis

   # Run database migrations
   cd services/api && npx prisma migrate dev && cd ../..
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: API
   cd services/api && npm run dev

   # Terminal 2: Admin Panel
   cd apps/admin-panel && npm run dev

   # Terminal 3: Mobile (iOS Simulator)
   cd apps/mobile && flutter run
   ```

## Development Workflow

### Branch Strategy

We follow a modified Git Flow:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Production hotfixes
- `release/*` - Release preparation

### Creating a Feature Branch

```bash
# Always branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in small, focused commits
2. Write or update tests for your changes
3. Ensure all tests pass locally
4. Update documentation if needed

## Coding Standards

### TypeScript (API & Admin Panel)

```typescript
// Use TypeScript strict mode
// tsconfig.json: "strict": true

// Use explicit return types for functions
function calculateScore(habits: Habit[]): number {
  return habits.reduce((sum, h) => sum + h.score, 0);
}

// Use interfaces for object shapes
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
}

// Use enums sparingly, prefer union types
type Status = 'active' | 'inactive' | 'pending';

// Use async/await over promises
async function fetchUser(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  return user;
}
```

### Dart (Mobile App)

```dart
// Use freezed for immutable data classes
@freezed
class Habit with _$Habit {
  const factory Habit({
    required String id,
    required String name,
    required HabitFrequency frequency,
    @Default(0) int streak,
  }) = _Habit;

  factory Habit.fromJson(Map<String, dynamic> json) => _$HabitFromJson(json);
}

// Use Riverpod for state management
@riverpod
class HabitController extends _$HabitController {
  @override
  Future<List<Habit>> build() async {
    return ref.read(habitRepositoryProvider).getAll();
  }

  Future<void> addHabit(CreateHabitInput input) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final habit = await ref.read(habitRepositoryProvider).create(input);
      return [...(state.value ?? []), habit];
    });
  }
}

// Use early returns
Future<void> completeHabit(String habitId) async {
  final habit = await getHabit(habitId);
  if (habit == null) return;
  if (habit.isCompleted) return;

  await updateHabit(habit.copyWith(isCompleted: true));
}
```

### File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Dart files | snake_case | `habit_service.dart` |
| TypeScript files | camelCase | `habitService.ts` |
| React components | PascalCase | `HabitCard.tsx` |
| Test files | *.test.ts / *_test.dart | `habitService.test.ts` |
| Config files | lowercase | `tsconfig.json` |

### Code Organization

**Mobile (Flutter):**
```
lib/
├── core/           # Core utilities, shared across features
├── features/       # Feature modules (one folder per feature)
│   └── habits/
│       ├── data/           # Data layer (repositories, DTOs)
│       ├── domain/         # Business logic
│       ├── presentation/   # UI (screens, widgets)
│       └── providers/      # State management
└── shared/         # Shared widgets and models
```

**API (Node.js):**
```
src/
├── routes/         # Express route handlers
├── services/       # Business logic
├── models/         # Prisma models and types
├── middleware/     # Express middleware
└── utils/          # Utility functions
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change, no new feature or fix |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Build process, dependencies |

### Scopes

- `mobile` - Flutter mobile app
- `api` - API service
- `admin` - Admin panel
- `infra` - Infrastructure
- `docs` - Documentation

### Examples

```bash
feat(mobile): add habit reminder notifications

fix(api): resolve race condition in sync endpoint

docs(api): update OpenAPI specification for habits

refactor(mobile): extract habit card to shared widgets

test(api): add integration tests for auth service
```

## Pull Request Process

### Before Submitting

1. **Run linting**
   ```bash
   # API
   cd services/api && npm run lint

   # Admin Panel
   cd apps/admin-panel && npm run lint

   # Mobile
   cd apps/mobile && flutter analyze
   ```

2. **Run tests**
   ```bash
   # API
   cd services/api && npm test

   # Admin Panel
   cd apps/admin-panel && npm test

   # Mobile
   cd apps/mobile && flutter test
   ```

3. **Format code**
   ```bash
   # Mobile
   cd apps/mobile && dart format .
   ```

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests for my changes
- [ ] All tests pass locally
```

### Review Process

1. Create PR from your feature branch to `develop`
2. Fill out the PR template completely
3. Request review from at least one team member
4. Address all feedback
5. Ensure CI passes
6. Squash and merge when approved

## Testing Guidelines

### Unit Tests

**API (Jest):**
```typescript
describe('HabitService', () => {
  describe('createHabit', () => {
    it('should create a habit with valid input', async () => {
      const input = {
        name: 'Exercise',
        frequency: { type: 'daily' },
        userId: 'user-123'
      };

      const habit = await habitService.create(input);

      expect(habit.name).toBe('Exercise');
      expect(habit.userId).toBe('user-123');
    });

    it('should throw error for invalid input', async () => {
      const input = { name: '', frequency: null };

      await expect(habitService.create(input))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

**Mobile (Flutter):**
```dart
void main() {
  group('HabitRepository', () {
    late HabitRepository repository;
    late MockApiClient mockClient;

    setUp(() {
      mockClient = MockApiClient();
      repository = HabitRepository(apiClient: mockClient);
    });

    test('getAll returns list of habits', () async {
      when(mockClient.get('/habits'))
          .thenAnswer((_) async => mockHabitsResponse);

      final habits = await repository.getAll();

      expect(habits, hasLength(2));
      expect(habits.first.name, 'Exercise');
    });
  });
}
```

### Widget Tests (Flutter)

```dart
void main() {
  testWidgets('HabitCard displays habit information', (tester) async {
    final habit = Habit(
      id: '1',
      name: 'Exercise',
      frequency: HabitFrequency.daily(),
      streak: 5,
    );

    await tester.pumpWidget(
      MaterialApp(
        home: HabitCard(habit: habit),
      ),
    );

    expect(find.text('Exercise'), findsOneWidget);
    expect(find.text('5 day streak'), findsOneWidget);
  });
}
```

### Integration Tests

```typescript
describe('Auth Integration', () => {
  it('should complete full auth flow', async () => {
    // Register
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'password123', name: 'Test' });

    expect(registerRes.status).toBe(201);

    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeDefined();

    // Access protected route
    const meRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe('test@example.com');
  });
});
```

### Test Coverage

- **Minimum coverage**: 80%
- **Critical paths**: 100% (auth, payments, data sync)

## Documentation

### Code Comments

```typescript
/**
 * Calculates the user's habit completion rate for a given period.
 *
 * @param userId - The user's unique identifier
 * @param startDate - Start of the period (inclusive)
 * @param endDate - End of the period (inclusive)
 * @returns Completion rate as a decimal (0-1)
 *
 * @example
 * const rate = await getCompletionRate('user-123', new Date('2024-01-01'), new Date('2024-01-31'));
 * // Returns 0.85 (85% completion rate)
 */
async function getCompletionRate(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Implementation
}
```

### README Updates

When adding new features, update relevant READMEs:

- Feature documentation
- API endpoint changes
- Configuration options
- Breaking changes

## Need Help?

- Check existing issues and discussions
- Join our Discord server
- Email: dev@upcoach.app

Thank you for contributing to UpCoach!
