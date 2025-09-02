"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("./database");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const redis_1 = require("./redis");
class UserService {
    static async findById(id) {
        try {
            return await database_1.db.findOne('users', { id, is_active: true });
        }
        catch (error) {
            logger_1.logger.error('Error finding user by ID:', error);
            throw new apiError_1.ApiError(500, 'Failed to find user');
        }
    }
    static async findByEmail(email) {
        try {
            return await database_1.db.findOne('users', { email: email.toLowerCase() });
        }
        catch (error) {
            logger_1.logger.error('Error finding user by email:', error);
            throw new apiError_1.ApiError(500, 'Failed to find user');
        }
    }
    static async create(userData) {
        try {
            // Check if user already exists
            const existingUser = await this.findByEmail(userData.email);
            if (existingUser) {
                throw new apiError_1.ApiError(409, 'User with this email already exists');
            }
            // Hash password
            const passwordHash = await bcryptjs_1.default.hash(userData.password, 12);
            // Create user
            const user = await database_1.db.insert('users', {
                email: userData.email.toLowerCase(),
                password_hash: passwordHash,
                name: userData.name,
                bio: userData.bio || null,
                preferences: {},
            });
            logger_1.logger.info('User created successfully:', { userId: user.id, email: user.email });
            return user;
        }
        catch (error) {
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
            logger_1.logger.error('Error creating user:', error);
            throw new apiError_1.ApiError(500, 'Failed to create user');
        }
    }
    static async update(id, updateData) {
        try {
            const user = await this.findById(id);
            if (!user) {
                throw new apiError_1.ApiError(404, 'User not found');
            }
            const updatedUser = await database_1.db.update('users', {
                ...updateData,
                name: updateData.name,
                bio: updateData.bio,
                avatar_url: updateData.avatarUrl,
                preferences: updateData.preferences,
            }, { id });
            logger_1.logger.info('User updated successfully:', { userId: id });
            return updatedUser;
        }
        catch (error) {
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
            logger_1.logger.error('Error updating user:', error);
            throw new apiError_1.ApiError(500, 'Failed to update user');
        }
    }
    static async updatePassword(id, currentPassword, newPassword) {
        try {
            const user = await this.findById(id);
            if (!user) {
                throw new apiError_1.ApiError(404, 'User not found');
            }
            // Verify current password
            const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                throw new apiError_1.ApiError(400, 'Current password is incorrect');
            }
            // Hash new password
            const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 12);
            await database_1.db.update('users', { password_hash: newPasswordHash }, { id });
            logger_1.logger.info('User password updated successfully:', { userId: id });
        }
        catch (error) {
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
            logger_1.logger.error('Error updating password:', error);
            throw new apiError_1.ApiError(500, 'Failed to update password');
        }
    }
    static async updateLastLogin(id) {
        try {
            await database_1.db.update('users', { last_login_at: new Date() }, { id });
        }
        catch (error) {
            logger_1.logger.error('Error updating last login:', error);
            // Don't throw error as this is not critical
        }
    }
    static async verifyPassword(email, password) {
        try {
            const user = await this.findByEmail(email);
            if (!user || !user.isActive) {
                return null;
            }
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                return null;
            }
            return user;
        }
        catch (error) {
            logger_1.logger.error('Error verifying password:', error);
            return null;
        }
    }
    static async deactivate(id) {
        try {
            const user = await this.findById(id);
            if (!user) {
                throw new apiError_1.ApiError(404, 'User not found');
            }
            await database_1.db.update('users', { is_active: false }, { id });
            logger_1.logger.info('User deactivated successfully:', { userId: id });
        }
        catch (error) {
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
            logger_1.logger.error('Error deactivating user:', error);
            throw new apiError_1.ApiError(500, 'Failed to deactivate user');
        }
    }
    static async delete(id) {
        try {
            const user = await this.findById(id);
            if (!user) {
                throw new apiError_1.ApiError(404, 'User not found');
            }
            // Instead of hard delete, we deactivate the user
            await this.deactivate(id);
            logger_1.logger.info('User deleted successfully:', { userId: id });
        }
        catch (error) {
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
            logger_1.logger.error('Error deleting user:', error);
            throw new apiError_1.ApiError(500, 'Failed to delete user');
        }
    }
    static async getProfile(id) {
        try {
            const user = await this.findById(id);
            if (!user) {
                return null;
            }
            return this.toResponseDto(user);
        }
        catch (error) {
            logger_1.logger.error('Error getting user profile:', error);
            throw new apiError_1.ApiError(500, 'Failed to get user profile');
        }
    }
    static async getUserStatistics(id) {
        try {
            const user = await this.findById(id);
            if (!user) {
                throw new apiError_1.ApiError(404, 'User not found');
            }
            // Get various statistics
            const [tasksResult, goalsResult, moodEntriesResult] = await Promise.all([
                database_1.db.query(`
          SELECT 
            COUNT(*) as total_tasks,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks
          FROM tasks 
          WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
        `, [id]),
                database_1.db.query(`
          SELECT 
            COUNT(*) as total_goals,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_goals,
            AVG(progress_percentage) as avg_progress
          FROM goals 
          WHERE user_id = $1
        `, [id]),
                database_1.db.query(`
          SELECT COUNT(*) as mood_entries_count
          FROM mood_entries 
          WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '30 days'
        `, [id]),
            ]);
            return {
                tasks: tasksResult.rows[0],
                goals: goalsResult.rows[0],
                moodEntries: moodEntriesResult.rows[0],
                memberSince: user.createdAt,
                lastActive: user.lastLoginAt,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting user statistics:', error);
            throw new apiError_1.ApiError(500, 'Failed to get user statistics');
        }
    }
    static toResponseDto(user) {
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
    static validatePasswordStrength(password) {
        const errors = [];
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
    static async generatePasswordResetToken(userId) {
        try {
            const token = crypto_1.default.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry
            // Store token in database or Redis
            await redis_1.redis.setEx(`password_reset:${token}`, 3600, // 1 hour in seconds
            JSON.stringify({ userId, expiresAt }));
            return token;
        }
        catch (error) {
            logger_1.logger.error('Error generating password reset token:', error);
            throw new apiError_1.ApiError(500, 'Failed to generate password reset token');
        }
    }
    static async resetPasswordWithToken(token, newPassword) {
        try {
            // Get token data from Redis
            const tokenData = await redis_1.redis.get(`password_reset:${token}`);
            if (!tokenData) {
                throw new apiError_1.ApiError(400, 'Invalid or expired reset token');
            }
            const { userId, expiresAt } = JSON.parse(tokenData);
            // Check if token is expired
            if (new Date() > new Date(expiresAt)) {
                await redis_1.redis.del(`password_reset:${token}`);
                throw new apiError_1.ApiError(400, 'Reset token has expired');
            }
            // Hash new password with secure bcrypt rounds
            const rounds = parseInt(process.env.BCRYPT_ROUNDS || '14', 10);
            const passwordHash = await bcryptjs_1.default.hash(newPassword, rounds);
            // Update password
            const result = await database_1.db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id', [passwordHash, userId]);
            if (result.rowCount === 0) {
                throw new apiError_1.ApiError(404, 'User not found');
            }
            // Delete used token
            await redis_1.redis.del(`password_reset:${token}`);
            logger_1.logger.info('Password reset successfully for user:', userId);
            return userId;
        }
        catch (error) {
            if (error instanceof apiError_1.ApiError)
                throw error;
            logger_1.logger.error('Error resetting password with token:', error);
            throw new apiError_1.ApiError(500, 'Failed to reset password');
        }
    }
    static async verifyGoogleToken(_idToken) {
        try {
            // In production, you would verify the token with Google
            // For now, we'll throw an error to indicate it needs implementation
            throw new apiError_1.ApiError(501, 'Google OAuth not yet implemented');
            // Implementation would look like:
            // const ticket = await googleClient.verifyIdToken({
            //   idToken,
            //   audience: process.env.GOOGLE_CLIENT_ID,
            // });
            // return ticket.getPayload();
        }
        catch (error) {
            logger_1.logger.error('Error verifying Google token:', error);
            throw new apiError_1.ApiError(401, 'Invalid Google token');
        }
    }
    static async createFromGoogle(googleData) {
        try {
            const result = await database_1.db.query(`
        INSERT INTO users (email, name, google_id, avatar_url, is_email_verified, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
                googleData.email,
                googleData.name,
                googleData.googleId,
                googleData.avatarUrl,
                googleData.isEmailVerified,
                'user',
                true,
            ]);
            logger_1.logger.info('User created from Google:', { email: googleData.email });
            const user = result.rows[0];
            return {
                id: user.id,
                email: user.email,
                passwordHash: '', // Google users don't have passwords
                name: user.name,
                role: user.role,
                avatar: user.avatar_url,
                bio: user.bio,
                googleId: user.google_id,
                isActive: user.is_active,
                isEmailVerified: user.is_email_verified,
                preferences: {},
                onboardingCompleted: user.onboarding_completed,
                onboardingCompletedAt: user.onboarding_completed_at,
                onboardingSkipped: user.onboarding_skipped,
                lastLoginAt: user.last_login_at,
                createdAt: user.created_at,
                updatedAt: user.updated_at,
            };
        }
        catch (error) {
            if (error.code === '23505') {
                throw new apiError_1.ApiError(409, 'User with this email already exists');
            }
            logger_1.logger.error('Error creating user from Google:', error);
            throw new apiError_1.ApiError(500, 'Failed to create user');
        }
    }
    static async updateGoogleId(userId, googleId) {
        try {
            await database_1.db.query('UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2', [
                googleId,
                userId,
            ]);
        }
        catch (error) {
            logger_1.logger.error('Error updating Google ID:', error);
            throw new apiError_1.ApiError(500, 'Failed to update Google ID');
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map