/**
 * Test Auth Helper
 * Provides authentication utilities for integration tests
 */

import jwt from 'jsonwebtoken';
import { db } from '../../services/database';

export class TestAuthHelper {
  private testUsers: Map<string, { id: string; email: string; token: string }> = new Map();

  async createAuthToken(userId: string, email?: string, role?: string): Promise<string> {
    // Create a real JWT token for testing
    const secret = process.env.JWT_SECRET || 'test-secret-key';
    const token = jwt.sign(
      {
        userId,
        email: email || `test-${userId}@upcoach.ai`,
        role: role || 'user',
        type: 'access',
        jti: 'test-jti-' + Date.now(),
      },
      secret,
      { expiresIn: '1h' }
    );
    return token;
  }

  async loginUser(email: string, password: string): Promise<{ token: string; user: Record<string, unknown> }> {
    // Look up user from database
    const user = await db.findOne('users', { email });

    if (!user) {
      throw new Error('User not found');
    }

    // For testing, we'll just create a token
    const token = await this.createAuthToken(user.id as string, user.email as string, user.role as string);

    return {
      token,
      user,
    };
  }

  async getAuthHeaders(userId?: string): Promise<Record<string, string>> {
    const token = await this.createAuthToken(userId || 'test-user');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const secret = process.env.JWT_SECRET || 'test-secret-key';
      jwt.verify(token, secret);
      return true;
    } catch {
      return false;
    }
  }

  async revokeToken(token: string): Promise<void> {
    // Token revocation logic would go here
    return Promise.resolve();
  }

  async getAuthToken(user: Record<string, unknown>): Promise<string> {
    const email = user.email as string;

    // Check if we already have a cached token for this user
    if (this.testUsers.has(email)) {
      return this.testUsers.get(email)!.token;
    }

    // Look up or expect the user to be already registered
    const existingUser = await db.findOne('users', { email });

    if (existingUser && existingUser.id) {
      const token = await this.createAuthToken(
        existingUser.id as string,
        existingUser.email as string,
        existingUser.role as string || 'user'
      );
      this.testUsers.set(email, {
        id: existingUser.id as string,
        email,
        token,
      });
      return token;
    }

    // If user doesn't exist, create a temporary token
    // The actual registration should be done in the test
    const tempToken = await this.createAuthToken('temp-user-' + email, email, 'user');
    return tempToken;
  }

  async getUserId(email: string): Promise<string> {
    // Check cache first
    if (this.testUsers.has(email)) {
      return this.testUsers.get(email)!.id;
    }

    // Look up in database
    const user = await db.findOne('users', { email });
    if (user && user.id) {
      return user.id as string;
    }

    throw new Error(`User not found: ${email}`);
  }

  clearCache(): void {
    this.testUsers.clear();
  }
}

// Export singleton instance
export const testAuthHelper = new TestAuthHelper();
