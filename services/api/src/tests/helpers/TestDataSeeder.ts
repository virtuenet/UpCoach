/**
 * Test Data Seeder
 * Provides methods to seed test data for integration tests
 */

import { db } from '../../services/database';

export class TestDataSeeder {
  private seededData: {
    users: string[];
    goals: string[];
    tasks: string[];
    habits: string[];
  } = {
    users: [],
    goals: [],
    tasks: [],
    habits: [],
  };

  async seedTestUser(userData: Record<string, unknown>): Promise<Record<string, unknown>> {
    const user = await db.insert('users', {
      id: `test-user-${Date.now()}`,
      email: userData.email || 'test@example.com',
      ...userData,
    });

    if (user.id) {
      this.seededData.users.push(user.id as string);
    }

    return user;
  }

  async seedTestTask(taskData: Record<string, unknown>): Promise<Record<string, unknown>> {
    const task = await db.insert('tasks', {
      id: `test-task-${Date.now()}`,
      ...taskData,
    });

    if (task.id) {
      this.seededData.tasks.push(task.id as string);
    }

    return task;
  }

  async seedTestGoal(goalData: Record<string, unknown>): Promise<Record<string, unknown>> {
    const goal = await db.insert('goals', {
      id: `test-goal-${Date.now()}`,
      ...goalData,
    });

    if (goal.id) {
      this.seededData.goals.push(goal.id as string);
    }

    return goal;
  }

  async clearAllData(): Promise<void> {
    // Clear all seeded test data
    for (const userId of this.seededData.users) {
      try {
        await db.delete('users', { id: userId });
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    for (const goalId of this.seededData.goals) {
      try {
        await db.delete('goals', { id: goalId });
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    for (const taskId of this.seededData.tasks) {
      try {
        await db.delete('tasks', { id: taskId });
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    for (const habitId of this.seededData.habits) {
      try {
        await db.delete('habits', { id: habitId });
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    // Reset tracking
    this.seededData = {
      users: [],
      goals: [],
      tasks: [],
      habits: [],
    };
  }

  async seedBasicTestData(): Promise<void> {
    // Seed basic test data if needed
    return Promise.resolve();
  }

  async seedDatabase(): Promise<void> {
    // Initialize database with test data
    return Promise.resolve();
  }

  async cleanupDatabase(): Promise<void> {
    // Cleanup database after tests
    await this.clearAllData();
  }

  async resetTestData(): Promise<void> {
    // Reset test data to initial state
    await this.clearAllData();
  }

  async verifyUser(userId: string): Promise<void> {
    // Update user's email verification status in database mock
    await db.update('users', { isEmailVerified: true }, { id: userId });
  }
}

// Export singleton instance
export const testDataSeeder = new TestDataSeeder();
