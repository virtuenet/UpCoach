import { describe, beforeAll, afterAll, beforeEach, test, expect, jest } from '@jest/globals';
import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { User, UserCreationAttributes } from '../../models/User';
import { initializeDatabase, closeTestDatabase, clearTestDatabase } from '../helpers/database.helper';

// NOTE: resetMocks: true in jest.config clears mock implementations
// We need to restore the User mock implementation before each test
// For now, we'll just use the mock as-is and investigate further if needed

// Create a simple User model for testing without dependencies
class TestUser {
  public id!: string;
  public email!: string;
  public password!: string;
  public name!: string;
  public role!: 'user' | 'admin' | 'coach';
  public isActive!: boolean;
  public emailVerified!: boolean;

  static async hashPassword(password: string): Promise<string> {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '14', 10);
    return bcrypt.hash(password, rounds);
  }

  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  static validate(data: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.email) errors.push('Email is required');
    if (!data.password) errors.push('Password is required');
    if (!data.name) errors.push('Name is required');

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    if (data.role && !['user', 'admin', 'coach'].includes(data.role)) {
      errors.push('Invalid role');
    }

    return { isValid: errors.length === 0, errors };
  }
}

describe('User Model', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('Model Creation', () => {
    test('should create a user with valid data', async () => {
      const userData: UserCreationAttributes = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'user'
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe(userData.role);
      expect(user.isActive).toBe(true); // Default value
      expect(user.emailVerified).toBe(false); // Default value
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    test('should hash password before saving', async () => {
      const plainPassword = 'password123';
      const userData: UserCreationAttributes = {
        email: 'test@example.com',
        password: plainPassword,
        name: 'Test User'
      };

      const user = await User.create(userData);

      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    test('should set default values correctly', async () => {
      const userData: UserCreationAttributes = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const user = await User.create(userData);

      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
      expect(user.emailVerified).toBe(false);
      expect(user.onboardingCompleted).toBe(false);
      expect(user.onboardingSkipped).toBe(false);
    });

    test('should generate UUID for id', async () => {
      const userData: UserCreationAttributes = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const user = await User.create(userData);

      expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('Model Validation', () => {
    test('should require email', async () => {
      const userData = {
        password: 'password123',
        name: 'Test User'
      };

      await expect(User.create(userData as unknown)).rejects.toThrow();
    });

    test('should require password', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User'
      };

      await expect(User.create(userData as unknown)).rejects.toThrow();
    });

    test('should require name', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      await expect(User.create(userData as unknown)).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const userData: UserCreationAttributes = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should enforce unique email constraint', async () => {
      const userData: UserCreationAttributes = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await User.create(userData);

      // Try to create another user with same email
      await expect(User.create({
        ...userData,
        name: 'Another User'
      })).rejects.toThrow();
    });

    test('should enforce unique googleId constraint', async () => {
      const googleId = 'google-id-123';

      await User.create({
        email: 'user1@example.com',
        password: 'password123',
        name: 'User 1',
        googleId
      });

      // Try to create another user with same googleId
      await expect(User.create({
        email: 'user2@example.com',
        password: 'password123',
        name: 'User 2',
        googleId
      })).rejects.toThrow();
    });

    test('should validate role enum', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'invalid-role'
      };

      await expect(User.create(userData as unknown)).rejects.toThrow();
    });

    test('should accept valid roles', async () => {
      const roles = ['user', 'admin', 'coach'];

      for (const role of roles) {
        const user = await User.create({
          email: `${role}@example.com`,
          password: 'password123',
          name: `Test ${role}`,
          role: role as any
        });

        expect(user.role).toBe(role);
      }
    });
  });

  describe('Instance Methods', () => {
    let user: User;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    });

    test('should compare password correctly', async () => {
      const isValid = await user.comparePassword('password123');
      expect(isValid).toBe(true);

      const isInvalid = await user.comparePassword('wrongpassword');
      expect(isInvalid).toBe(false);
    });

    test('should handle empty password comparison', async () => {
      const isValid = await user.comparePassword('');
      expect(isValid).toBe(false);
    });
  });

  describe('Model Updates', () => {
    test('should hash password on update', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'oldpassword',
        name: 'Test User'
      });

      const oldHash = user.password;
      const newPassword = 'newpassword123';

      await user.update({ password: newPassword });

      expect(user.password).not.toBe(newPassword);
      expect(user.password).not.toBe(oldHash);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/);

      // Verify new password works
      const isValid = await user.comparePassword(newPassword);
      expect(isValid).toBe(true);
    });

    test('should not rehash password if unchanged', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      const originalHash = user.password;

      // Update other field
      await user.update({ name: 'Updated Name' });

      expect(user.password).toBe(originalHash);
    });

    test('should update lastLoginAt', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      expect(user.lastLoginAt).toBeNull();

      const loginTime = new Date();
      await user.update({ lastLoginAt: loginTime });

      expect(user.lastLoginAt).toEqual(loginTime);
    });

    test('should update onboarding status', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      expect(user.onboardingCompleted).toBe(false);
      expect(user.onboardingCompletedAt).toBeNull();

      const completionTime = new Date();
      await user.update({
        onboardingCompleted: true,
        onboardingCompletedAt: completionTime
      });

      expect(user.onboardingCompleted).toBe(true);
      expect(user.onboardingCompletedAt).toEqual(completionTime);
    });
  });

  describe('Model Queries', () => {
    beforeEach(async () => {
      // Create test users
      await User.bulkCreate([
        {
          email: 'user1@example.com',
          password: 'password123',
          name: 'User 1',
          role: 'user',
          isActive: true
        },
        {
          email: 'user2@example.com',
          password: 'password123',
          name: 'User 2',
          role: 'admin',
          isActive: true
        },
        {
          email: 'user3@example.com',
          password: 'password123',
          name: 'User 3',
          role: 'coach',
          isActive: false
        }
      ]);
    });

    test('should find user by email', async () => {
      const user = await User.findOne({
        where: { email: 'user1@example.com' }
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe('user1@example.com');
      expect(user?.name).toBe('User 1');
    });

    test('should find users by role', async () => {
      const users = await User.findAll({
        where: { role: 'user' }
      });

      expect(users).toHaveLength(1);
      expect(users[0].role).toBe('user');
    });

    test('should find active users', async () => {
      const activeUsers = await User.findAll({
        where: { isActive: true }
      });

      expect(activeUsers).toHaveLength(2);
      activeUsers.forEach(user => {
        expect(user.isActive).toBe(true);
      });
    });

    test('should count users by role', async () => {
      const userCount = await User.count({
        where: { role: 'user' }
      });

      const adminCount = await User.count({
        where: { role: 'admin' }
      });

      const coachCount = await User.count({
        where: { role: 'coach' }
      });

      expect(userCount).toBe(1);
      expect(adminCount).toBe(1);
      expect(coachCount).toBe(1);
    });
  });

  describe('Bcrypt Rounds Configuration', () => {
    test('should use default bcrypt rounds when not configured', async () => {
      delete process.env.BCRYPT_ROUNDS;

      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      // Default should be 14 rounds
      expect(user.password).toMatch(/^\$2[aby]\$14\$/);
    });

    test('should use configured bcrypt rounds', async () => {
      process.env.BCRYPT_ROUNDS = '10';

      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      expect(user.password).toMatch(/^\$2[aby]\$10\$/);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long names', async () => {
      const longName = 'A'.repeat(255);

      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: longName
      });

      expect(user.name).toBe(longName);
    });

    test('should handle optional fields as null', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        avatar: null,
        bio: null,
        googleId: null
      });

      expect(user.avatar).toBeNull();
      expect(user.bio).toBeNull();
      expect(user.googleId).toBeNull();
    });

    test('should handle unicode characters in name and bio', async () => {
      const unicodeName = '测试用户 🚀';
      const unicodeBio = 'Bio with émojis 😀 and spéciál characters';

      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: unicodeName,
        bio: unicodeBio
      });

      expect(user.name).toBe(unicodeName);
      expect(user.bio).toBe(unicodeBio);
    });
  });
});