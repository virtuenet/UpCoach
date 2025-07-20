import bcrypt from 'bcryptjs';
import { db } from './database';
import { ApiError } from '../utils/apiError';
import { User, CreateUserDto, UpdateUserDto, UserResponseDto } from '../types/database';
import { logger } from '../utils/logger';

export class UserService {
  static async findById(id: string): Promise<User | null> {
    try {
      return await db.findOne<User>('users', { id, is_active: true });
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw new ApiError(500, 'Failed to find user');
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      return await db.findOne<User>('users', { email: email.toLowerCase() });
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw new ApiError(500, 'Failed to find user');
    }
  }

  static async create(userData: CreateUserDto): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new ApiError(409, 'User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await db.insert<User>('users', {
        email: userData.email.toLowerCase(),
        password_hash: passwordHash,
        name: userData.name,
        bio: userData.bio || null,
        preferences: {},
      });

      logger.info('User created successfully:', { userId: user.id, email: user.email });
      return user;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error creating user:', error);
      throw new ApiError(500, 'Failed to create user');
    }
  }

  static async update(id: string, updateData: UpdateUserDto): Promise<User | null> {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      const updatedUser = await db.update<User>(
        'users',
        {
          ...updateData,
          name: updateData.name,
          bio: updateData.bio,
          avatar_url: updateData.avatarUrl,
          preferences: updateData.preferences,
        },
        { id }
      );

      logger.info('User updated successfully:', { userId: id });
      return updatedUser;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error updating user:', error);
      throw new ApiError(500, 'Failed to update user');
    }
  }

  static async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new ApiError(400, 'Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      await db.update('users', { password_hash: newPasswordHash }, { id });

      logger.info('User password updated successfully:', { userId: id });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error updating password:', error);
      throw new ApiError(500, 'Failed to update password');
    }
  }

  static async updateLastLogin(id: string): Promise<void> {
    try {
      await db.update('users', { last_login_at: new Date() }, { id });
    } catch (error) {
      logger.error('Error updating last login:', error);
      // Don't throw error as this is not critical
    }
  }

  static async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByEmail(email);
      if (!user || !user.isActive) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      logger.error('Error verifying password:', error);
      return null;
    }
  }

  static async deactivate(id: string): Promise<void> {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      await db.update('users', { is_active: false }, { id });

      logger.info('User deactivated successfully:', { userId: id });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error deactivating user:', error);
      throw new ApiError(500, 'Failed to deactivate user');
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Instead of hard delete, we deactivate the user
      await this.deactivate(id);

      logger.info('User deleted successfully:', { userId: id });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error deleting user:', error);
      throw new ApiError(500, 'Failed to delete user');
    }
  }

  static async getProfile(id: string): Promise<UserResponseDto | null> {
    try {
      const user = await this.findById(id);
      if (!user) {
        return null;
      }

      return this.toResponseDto(user);
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw new ApiError(500, 'Failed to get user profile');
    }
  }

  static async getUserStatistics(id: string): Promise<any> {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Get various statistics
      const [tasksResult, goalsResult, moodEntriesResult] = await Promise.all([
        db.query(`
          SELECT 
            COUNT(*) as total_tasks,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks
          FROM tasks 
          WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
        `, [id]),
        db.query(`
          SELECT 
            COUNT(*) as total_goals,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_goals,
            AVG(progress_percentage) as avg_progress
          FROM goals 
          WHERE user_id = $1
        `, [id]),
        db.query(`
          SELECT COUNT(*) as mood_entries_count
          FROM mood_entries 
          WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '30 days'
        `, [id])
      ]);

      return {
        tasks: tasksResult.rows[0],
        goals: goalsResult.rows[0],
        moodEntries: moodEntriesResult.rows[0],
        memberSince: user.createdAt,
        lastActive: user.lastLoginAt,
      };
    } catch (error) {
      logger.error('Error getting user statistics:', error);
      throw new ApiError(500, 'Failed to get user statistics');
    }
  }

  static toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
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
      errors,
    };
  }
} 