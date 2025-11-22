import { Sequelize } from 'sequelize';
import { UserService } from '../../services/userService';
import { CreateUserDto } from '../../types/database';

// Create test database connection
let testDb: Sequelize;

export async function initializeDatabase(): Promise<void> {
  if (!testDb) {
    testDb = new Sequelize('sqlite::memory:', {
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false, // Disable SQL logging in tests
      define: {
        timestamps: true,
        underscored: false,
      },
    });

    // Initialize all models
    await initializeModels();
    await testDb.sync({ force: true });
  }
}

export async function clearTestDatabase(): Promise<void> {
  if (testDb) {
    await testDb.sync({ force: true });
  }
  // Clear the user store from jest.setup.ts
  if ((global as any).clearUserStore) {
    (global as any).clearUserStore();
  }
}

export async function closeTestDatabase(): Promise<void> {
  if (testDb) {
    await testDb.close();
  }
}

export async function seedTestData(): Promise<unknown> {
  // Create a test user
  const testUser = await UserService.create({
    email: 'test@example.com',
    password: 'TestPass123!',
    name: 'Test User',
    role: 'user'
  } as CreateUserDto);

  // Create test admin
  const testAdmin = await UserService.create({
    email: 'admin@example.com',
    password: 'AdminPass123!',
    name: 'Test Admin',
    role: 'admin'
  } as CreateUserDto);

  // Create test coach
  const testCoach = await UserService.create({
    email: 'coach@example.com',
    password: 'CoachPass123!',
    name: 'Test Coach',
    role: 'coach'
  } as CreateUserDto);

  return {
    user: testUser,
    admin: testAdmin,
    coach: testCoach
  };
}

async function initializeModels(): Promise<void> {
  // Import and initialize all models
  const { User } = require('../../models/User');
  const { UserProfile } = require('../../models/UserProfile');
  const { Goal } = require('../../models/Goal');
  const { Task } = require('../../models/Task');
  const { Mood } = require('../../models/Mood');
  const { Chat } = require('../../models/Chat');

  // Initialize model associations if they exist
  if (User.associate) User.associate({ User, UserProfile, Goal, Task, Mood, Chat });
  if (UserProfile.associate) UserProfile.associate({ User, UserProfile, Goal, Task, Mood, Chat });
  if (Goal.associate) Goal.associate({ User, UserProfile, Goal, Task, Mood, Chat });
  if (Task.associate) Task.associate({ User, UserProfile, Goal, Task, Mood, Chat });
  if (Mood.associate) Mood.associate({ User, UserProfile, Goal, Task, Mood, Chat });
  if (Chat.associate) Chat.associate({ User, UserProfile, Goal, Task, Mood, Chat });
}

export function createTestUser(overrides: unknown = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

export function createTestAdmin(overrides: unknown = {}) {
  return {
    id: 'test-admin-id',
    email: 'admin@example.com',
    name: 'Test Admin',
    role: 'admin',
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}