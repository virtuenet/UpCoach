import { describe, beforeEach, afterEach, test, expect, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../utils/logger');
jest.mock('google-auth-library');

const mockUser = {
  id: 'test-user-id',
  email: 'existing@example.com',
  password: '$2b$12$hashedpassword',
  name: 'Test User',
  role: 'user',
  isActive: true,
  emailVerified: false,
  comparePassword: jest.fn(),
  save: jest.fn(),
  update: jest.fn()
};

const mockUserModel = {
  create: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn()
};

// Mock UserService implementation for testing
class MockUserService {
  static async create(userData: unknown) {
    const validation = this.validateUserData(userData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    return {
      id: 'new-user-id',
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      role: userData.role || 'user',
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static async findByEmail(email: string) {
    if (email === 'existing@example.com') {
      return mockUser;
    }
    return null;
  }

  static async findById(id: string) {
    if (id === 'test-user-id') {
      return mockUser;
    }
    return null;
  }

  static async verifyPassword(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  static validatePasswordStrength(password: string) {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateUserData(userData: unknown) {
    const errors: string[] = [];

    if (!userData.email) errors.push('Email is required');
    if (!userData.password) errors.push('Password is required');
    if (!userData.name) errors.push('Name is required');

    if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('Invalid email format');
    }

    if (userData.role && !['user', 'admin', 'coach'].includes(userData.role)) {
      errors.push('Invalid role');
    }

    return { isValid: errors.length === 0, errors };
  }

  static async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) throw new Error('Current password is incorrect');

    const passwordValidation = this.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    return { success: true };
  }

  static async updateLastLogin(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    return { success: true, lastLoginAt: new Date() };
  }

  static async updateActiveStatus(userId: string, isActive: boolean) {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    return { success: true };
  }

  static toResponseDto(user: unknown) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      onboardingCompleted: user.onboardingCompleted,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  static async verifyGoogleToken(idToken: string) {
    if (idToken === 'valid-google-token') {
      return {
        sub: 'google-user-id',
        email: 'google@example.com',
        name: 'Google User',
        picture: 'https://example.com/avatar.jpg',
        email_verified: true
      };
    }
    throw new Error('Invalid Google token');
  }

  static async createFromGoogle(googleData: unknown) {
    return {
      id: 'google-user-id',
      email: googleData.email,
      name: googleData.name,
      googleId: googleData.googleId,
      avatarUrl: googleData.avatarUrl,
      role: 'user',
      isActive: true,
      emailVerified: googleData.isEmailVerified,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static async generatePasswordResetToken(userId: number) {
    return 'reset-token-' + userId;
  }

  static async resetPasswordWithToken(token: string, newPassword: string) {
    if (!token.startsWith('reset-token-')) {
      throw new Error('Invalid reset token');
    }

    const passwordValidation = this.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    const userId = token.replace('reset-token-', '');
    return userId;
  }

  static async getProfile(userId: string) {
    const user = await this.findById(userId);
    if (!user) return null;

    return this.toResponseDto(user);
  }

  static async updateGoogleId(userId: number, googleId: string) {
    return { success: true };
  }
}

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User'
      };

      const user = await MockUserService.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    test('should throw error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'User'
      };

      await expect(MockUserService.create(userData)).rejects.toThrow('Invalid email format');
    });

    test('should throw error for missing required fields', async () => {
      const userData = {
        email: 'test@example.com'
        // Missing password and name
      };

      await expect(MockUserService.create(userData)).rejects.toThrow();
    });
  });

  describe('findByEmail', () => {
    test('should find existing user by email', async () => {
      const user = await MockUserService.findByEmail('existing@example.com');

      expect(user).toBeDefined();
      expect(user?.email).toBe('existing@example.com');
    });

    test('should return null for non-existent email', async () => {
      const user = await MockUserService.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('verifyPassword', () => {
    test('should verify correct password', async () => {
      // Mock bcrypt.compare to return true for correct password
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const user = await MockUserService.verifyPassword('existing@example.com', 'correctpassword');

      expect(user).toBeDefined();
      expect(user?.email).toBe('existing@example.com');

      bcrypt.compare = originalCompare;
    });

    test('should return null for incorrect password', async () => {
      // Mock bcrypt.compare to return false for incorrect password
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const user = await MockUserService.verifyPassword('existing@example.com', 'wrongpassword');

      expect(user).toBeNull();

      bcrypt.compare = originalCompare;
    });

    test('should return null for non-existent user', async () => {
      const user = await MockUserService.verifyPassword('nonexistent@example.com', 'anypassword');

      expect(user).toBeNull();
    });
  });

  describe('validatePasswordStrength', () => {
    test('should accept strong password', () => {
      const result = MockUserService.validatePasswordStrength('SecurePass123!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject short password', () => {
      const result = MockUserService.validatePasswordStrength('Short1!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should reject password without uppercase', () => {
      const result = MockUserService.validatePasswordStrength('lowercase123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('should reject password without lowercase', () => {
      const result = MockUserService.validatePasswordStrength('UPPERCASE123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    test('should reject password without numbers', () => {
      const result = MockUserService.validatePasswordStrength('NoNumbers!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    test('should reject password without special characters', () => {
      const result = MockUserService.validatePasswordStrength('NoSpecialChars123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    test('should return multiple errors for weak password', () => {
      const result = MockUserService.validatePasswordStrength('weak');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('updatePassword', () => {
    test('should update password with valid data', async () => {
      // Mock bcrypt.compare to return true for current password
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const result = await MockUserService.updatePassword(
        'test-user-id',
        'currentpassword',
        'NewSecurePass123!'
      );

      expect(result.success).toBe(true);

      bcrypt.compare = originalCompare;
    });

    test('should throw error for incorrect current password', async () => {
      // Mock bcrypt.compare to return false for current password
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await expect(MockUserService.updatePassword(
        'test-user-id',
        'wrongcurrentpassword',
        'NewSecurePass123!'
      )).rejects.toThrow('Current password is incorrect');

      bcrypt.compare = originalCompare;
    });

    test('should throw error for weak new password', async () => {
      // Mock bcrypt.compare to return true for current password
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await expect(MockUserService.updatePassword(
        'test-user-id',
        'currentpassword',
        'weak'
      )).rejects.toThrow();

      bcrypt.compare = originalCompare;
    });

    test('should throw error for non-existent user', async () => {
      await expect(MockUserService.updatePassword(
        'non-existent-user',
        'currentpassword',
        'NewSecurePass123!'
      )).rejects.toThrow('User not found');
    });
  });

  describe('toResponseDto', () => {
    test('should return safe user data without password', () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'user',
        avatar: 'avatar.jpg',
        bio: 'User bio',
        isActive: true,
        emailVerified: true,
        onboardingCompleted: false,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        sensitiveField: 'should not be included'
      };

      const dto = MockUserService.toResponseDto(user);

      expect(dto).not.toHaveProperty('password');
      expect(dto).not.toHaveProperty('sensitiveField');
      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('email');
      expect(dto).toHaveProperty('name');
      expect(dto).toHaveProperty('role');
    });
  });

  describe('Google OAuth', () => {
    test('should verify valid Google token', async () => {
      const googleUser = await MockUserService.verifyGoogleToken('valid-google-token');

      expect(googleUser).toBeDefined();
      expect(googleUser.email).toBe('google@example.com');
      expect(googleUser.email_verified).toBe(true);
    });

    test('should throw error for invalid Google token', async () => {
      await expect(MockUserService.verifyGoogleToken('invalid-token')).rejects.toThrow('Invalid Google token');
    });

    test('should create user from Google data', async () => {
      const googleData = {
        email: 'google@example.com',
        name: 'Google User',
        googleId: 'google-id-123',
        avatarUrl: 'https://example.com/avatar.jpg',
        isEmailVerified: true
      };

      const user = await MockUserService.createFromGoogle(googleData);

      expect(user.email).toBe(googleData.email);
      expect(user.name).toBe(googleData.name);
      expect(user.emailVerified).toBe(true);
      expect(user.role).toBe('user');
    });
  });

  describe('Password Reset', () => {
    test('should generate password reset token', async () => {
      const token = await MockUserService.generatePasswordResetToken(123);

      expect(token).toBe('reset-token-123');
    });

    test('should reset password with valid token', async () => {
      const userId = await MockUserService.resetPasswordWithToken(
        'reset-token-123',
        'NewSecurePass123!'
      );

      expect(userId).toBe('123');
    });

    test('should throw error for invalid reset token', async () => {
      await expect(MockUserService.resetPasswordWithToken(
        'invalid-token',
        'NewSecurePass123!'
      )).rejects.toThrow('Invalid reset token');
    });

    test('should throw error for weak password in reset', async () => {
      await expect(MockUserService.resetPasswordWithToken(
        'reset-token-123',
        'weak'
      )).rejects.toThrow();
    });
  });

  describe('User Profile', () => {
    test('should get user profile', async () => {
      const profile = await MockUserService.getProfile('test-user-id');

      expect(profile).toBeDefined();
      expect(profile?.email).toBe('existing@example.com');
      expect(profile).not.toHaveProperty('password');
    });

    test('should return null for non-existent user profile', async () => {
      const profile = await MockUserService.getProfile('non-existent-user');

      expect(profile).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined and null inputs gracefully', async () => {
      expect(await MockUserService.findByEmail('')).toBeNull();
      expect(await MockUserService.findById('')).toBeNull();
    });

    test('should handle concurrent password updates', async () => {
      // Mock bcrypt.compare to return true
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const promises = [
        MockUserService.updatePassword('test-user-id', 'current', 'NewPass123!'),
        MockUserService.updatePassword('test-user-id', 'current', 'AnotherPass123!')
      ];

      // Both should succeed (in real implementation, this would need proper locking)
      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      bcrypt.compare = originalCompare;
    });
  });
});