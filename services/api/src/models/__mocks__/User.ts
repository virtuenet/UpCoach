import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// console.error('[USER MOCK] Loading User model mock from __mocks__/User.ts...');

// In-memory store for created users
const users = new Map<string, any>();

// Helper to validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper to hash password
async function hashPassword(password: string): Promise<string> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '14', 10);
  return bcrypt.hash(password, rounds);
}

// Helper to create user instance
function createUserInstance(data: any) {
  const instance = {
    ...data,
    save: jest.fn(async () => data),
    update: jest.fn(async (updates: any) => {
      // Hash password if it's being updated
      if (updates.password && updates.password !== instance.password) {
        updates.password = await hashPassword(updates.password);
      }

      // Update the instance
      Object.assign(instance, updates, { updatedAt: new Date() });

      // Update in the store
      if (instance.id) {
        users.set(instance.id, instance);
      }

      return instance;
    }),
    reload: jest.fn(async () => data),
    destroy: jest.fn(async () => {
      if (instance.id) {
        users.delete(instance.id);
      }
      return 1;
    }),
    comparePassword: jest.fn(async (password: string) => {
      if (!password || !instance.password) return false;
      return bcrypt.compare(password, instance.password);
    }),
  };

  return instance;
}

// Mock User Model
export const User = {
  // Static methods
  create: jest.fn(async (data: any) => {
    // Validation
    if (!data.email) {
      throw new Error('Validation error: email is required');
    }
    if (!data.password) {
      throw new Error('Validation error: password is required');
    }
    if (!data.name) {
      throw new Error('Validation error: name is required');
    }
    if (!isValidEmail(data.email)) {
      throw new Error('Validation error: invalid email format');
    }
    if (data.role && !['user', 'admin', 'coach'].includes(data.role)) {
      throw new Error('Validation error: invalid role');
    }

    // Check unique constraints
    const existingByEmail = Array.from(users.values()).find(
      u => u.email === data.email
    );
    if (existingByEmail) {
      throw new Error('Validation error: email must be unique');
    }

    if (data.googleId) {
      const existingByGoogleId = Array.from(users.values()).find(
        u => u.googleId === data.googleId
      );
      if (existingByGoogleId) {
        throw new Error('Validation error: googleId must be unique');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user with defaults
    const user = {
      id: data.id || uuidv4(),
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role || 'user',
      avatar: data.avatar || null,
      bio: data.bio || null,
      googleId: data.googleId || null,
      organizationId: data.organizationId || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      emailVerified: data.emailVerified !== undefined ? data.emailVerified : false,
      onboardingCompleted: data.onboardingCompleted !== undefined ? data.onboardingCompleted : false,
      onboardingCompletedAt: data.onboardingCompletedAt || null,
      onboardingSkipped: data.onboardingSkipped !== undefined ? data.onboardingSkipped : false,
      lastLoginAt: data.lastLoginAt || null,
      twoFactorSecret: data.twoFactorSecret || null,
      twoFactorEnabled: data.twoFactorEnabled || false,
      twoFactorBackupCodes: data.twoFactorBackupCodes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const instance = createUserInstance(user);

    // Store in memory
    users.set(user.id, instance);

    return instance;
  }),

  findByPk: jest.fn(async (id: string) => {
    const user = users.get(id);
    return user || null;
  }),

  findOne: jest.fn(async (options: any) => {
    if (!options?.where) return null;

    const where = options.where;
    const user = Array.from(users.values()).find(u => {
      return Object.keys(where).every(key => u[key] === where[key]);
    });

    return user || null;
  }),

  findAll: jest.fn(async (options: any = {}) => {
    let results = Array.from(users.values());

    if (options.where) {
      results = results.filter(u => {
        return Object.keys(options.where).every(key => u[key] === options.where[key]);
      });
    }

    return results;
  }),

  count: jest.fn(async (options: any = {}) => {
    let results = Array.from(users.values());

    if (options.where) {
      results = results.filter(u => {
        return Object.keys(options.where).every(key => u[key] === options.where[key]);
      });
    }

    return results.length;
  }),

  bulkCreate: jest.fn(async (dataArray: any[]) => {
    const createdUsers = [];

    for (const data of dataArray) {
      const user = await User.create(data);
      createdUsers.push(user);
    }

    return createdUsers;
  }),

  update: jest.fn(async (updates: any, options: any) => {
    if (!options?.where) return [0, []];

    const where = options.where;
    let updatedCount = 0;
    const updatedUsers: any[] = [];

    for (const user of users.values()) {
      const matches = Object.keys(where).every(key => user[key] === where[key]);
      if (matches) {
        await user.update(updates);
        updatedCount++;
        updatedUsers.push(user);
      }
    }

    return [updatedCount, updatedUsers];
  }),

  destroy: jest.fn(async (options: any) => {
    if (!options?.where) return 0;

    const where = options.where;
    let destroyedCount = 0;

    const usersToDestroy = Array.from(users.values()).filter(u => {
      return Object.keys(where).every(key => u[key] === where[key]);
    });

    for (const user of usersToDestroy) {
      users.delete(user.id);
      destroyedCount++;
    }

    return destroyedCount;
  }),

  build: jest.fn((data: any) => {
    const user = {
      id: data.id || uuidv4(),
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role || 'user',
      avatar: data.avatar || null,
      bio: data.bio || null,
      googleId: data.googleId || null,
      organizationId: data.organizationId || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      emailVerified: data.emailVerified !== undefined ? data.emailVerified : false,
      onboardingCompleted: data.onboardingCompleted !== undefined ? data.onboardingCompleted : false,
      onboardingCompletedAt: data.onboardingCompletedAt || null,
      onboardingSkipped: data.onboardingSkipped !== undefined ? data.onboardingSkipped : false,
      lastLoginAt: data.lastLoginAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return createUserInstance(user);
  }),

  // Class properties
  associate: jest.fn(),
  hasOne: jest.fn(),
  hasMany: jest.fn(),
  belongsTo: jest.fn(),
};

// Helper function to clear the in-memory store (for test cleanup)
export function clearUserStore() {
  users.clear();
}

// Make clearUserStore available globally for database.helper.ts
if (typeof global !== 'undefined') {
  (global as any).clearUserStore = clearUserStore;
}

// For TypeScript compatibility
export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin' | 'coach';
  avatar?: string;
  bio?: string;
  googleId?: string;
  organizationId?: string;
  isActive: boolean;
  emailVerified: boolean;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: Date;
  onboardingSkipped?: boolean;
  lastLoginAt?: Date;
  twoFactorSecret?: string;
  twoFactorEnabled?: boolean;
  twoFactorBackupCodes?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface UserCreationAttributes extends Partial<UserAttributes> {
  email: string;
  password: string;
  name: string;
}
