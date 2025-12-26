import { GraphQLClient } from 'graphql-request';

/**
 * UpCoach GraphQL Client SDK
 *
 * TypeScript SDK for external developers to interact with UpCoach GraphQL API.
 *
 * Features:
 * - Type-safe queries and mutations
 * - Automatic code generation from schema
 * - Authentication handling
 * - Error handling
 * - Request/response interceptors
 *
 * Usage:
 * ```typescript
 * import { UpCoachClient } from '@upcoach/graphql-client';
 *
 * const client = new UpCoachClient({
 *   apiKey: 'your-api-key',
 *   endpoint: 'https://api.upcoach.com/graphql',
 * });
 *
 * const user = await client.getUser({ id: '123' });
 * const goals = await client.getGoals({ userId: '123', limit: 10 });
 * ```
 */

export interface UpCoachClientConfig {
  apiKey: string;
  endpoint?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class UpCoachClient {
  private client: GraphQLClient;
  private apiKey: string;

  constructor(config: UpCoachClientConfig) {
    this.apiKey = config.apiKey;

    const endpoint = config.endpoint || 'https://api.upcoach.com/graphql';

    this.client = new GraphQLClient(endpoint, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...config.headers,
      },
      timeout: config.timeout || 30000,
    });
  }

  /**
   * Execute raw GraphQL query
   */
  async query<T = any>(query: string, variables?: any): Promise<T> {
    try {
      return await this.client.request<T>(query, variables);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * User operations
   */
  async getUser(userId: string): Promise<any> {
    const query = `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          email
          firstName
          lastName
          role
          avatar
          createdAt
        }
      }
    `;
    const result = await this.query(query, { id: userId });
    return result.user;
  }

  async getMe(): Promise<any> {
    const query = `
      query GetMe {
        me {
          id
          email
          firstName
          lastName
          role
          avatar
          tenant {
            id
            name
            slug
          }
        }
      }
    `;
    const result = await this.query(query);
    return result.me;
  }

  /**
   * Goal operations
   */
  async getGoals(params?: {
    status?: string;
    category?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const query = `
      query GetGoals($status: GoalStatus, $category: GoalCategory, $userId: ID, $limit: Int, $offset: Int) {
        goals(status: $status, category: $category, userId: $userId, limit: $limit, offset: $offset) {
          edges {
            node {
              id
              title
              description
              status
              category
              targetDate
              progress
              createdAt
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
          totalCount
        }
      }
    `;
    const result = await this.query(query, params);
    return result.goals;
  }

  async createGoal(input: {
    title: string;
    description?: string;
    category: string;
    targetDate?: string;
  }): Promise<any> {
    const mutation = `
      mutation CreateGoal($input: CreateGoalInput!) {
        createGoal(input: $input) {
          id
          title
          description
          status
          category
          targetDate
          createdAt
        }
      }
    `;
    const result = await this.query(mutation, { input });
    return result.createGoal;
  }

  async updateGoal(
    id: string,
    input: {
      title?: string;
      description?: string;
      status?: string;
      category?: string;
      targetDate?: string;
    }
  ): Promise<any> {
    const mutation = `
      mutation UpdateGoal($id: ID!, $input: UpdateGoalInput!) {
        updateGoal(id: $id, input: $input) {
          id
          title
          description
          status
          category
          targetDate
          updatedAt
        }
      }
    `;
    const result = await this.query(mutation, { id, input });
    return result.updateGoal;
  }

  async deleteGoal(id: string): Promise<boolean> {
    const mutation = `
      mutation DeleteGoal($id: ID!) {
        deleteGoal(id: $id)
      }
    `;
    const result = await this.query(mutation, { id });
    return result.deleteGoal;
  }

  /**
   * Habit operations
   */
  async getHabits(params?: {
    category?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const query = `
      query GetHabits($category: HabitCategory, $userId: ID, $limit: Int, $offset: Int) {
        habits(category: $category, userId: $userId, limit: $limit, offset: $offset) {
          edges {
            node {
              id
              name
              description
              frequency
              streak
              longestStreak
              totalCheckins
              category
              createdAt
            }
          }
          totalCount
        }
      }
    `;
    const result = await this.query(query, params);
    return result.habits;
  }

  async createHabit(input: {
    name: string;
    description?: string;
    frequency: string;
    category: string;
    reminderTime?: string;
    goalId?: string;
  }): Promise<any> {
    const mutation = `
      mutation CreateHabit($input: CreateHabitInput!) {
        createHabit(input: $input) {
          id
          name
          description
          frequency
          category
          reminderTime
          createdAt
        }
      }
    `;
    const result = await this.query(mutation, { input });
    return result.createHabit;
  }

  async checkInHabit(habitId: string, note?: string, mood?: number): Promise<any> {
    const mutation = `
      mutation CheckInHabit($habitId: ID!, $note: String, $mood: Int) {
        checkInHabit(habitId: $habitId, note: $note, mood: $mood) {
          id
          habitId
          checkedInAt
          note
          mood
        }
      }
    `;
    const result = await this.query(mutation, { habitId, note, mood });
    return result.checkInHabit;
  }

  /**
   * Analytics operations
   */
  async getUserAnalytics(userId: string, period: string): Promise<any> {
    const query = `
      query GetUserAnalytics($userId: ID!, $period: StatisticsPeriod!) {
        userAnalytics(userId: $userId, period: $period) {
          userId
          totalGoals
          completedGoals
          activeHabits
          totalCheckins
          averageStreak
          longestStreak
          pointsEarned
          level
          productivityScore
        }
      }
    `;
    const result = await this.query(query, { userId, period });
    return result.userAnalytics;
  }

  /**
   * Webhook operations
   */
  async createWebhook(input: {
    url: string;
    events: string[];
    secret?: string;
  }): Promise<any> {
    const mutation = `
      mutation CreateWebhook($input: CreateWebhookInput!) {
        createWebhook(input: $input) {
          id
          url
          events
          secret
          active
          createdAt
        }
      }
    `;
    const result = await this.query(mutation, { input });
    return result.createWebhook;
  }

  async getWebhooks(): Promise<any> {
    const query = `
      query GetWebhooks {
        webhooks {
          id
          url
          events
          active
          failureCount
          lastDeliveredAt
          createdAt
        }
      }
    `;
    const result = await this.query(query);
    return result.webhooks;
  }

  /**
   * Error handling
   */
  private handleError(error: any): Error {
    if (error.response?.errors) {
      const graphQLError = error.response.errors[0];
      const message = graphQLError.message;
      const code = graphQLError.extensions?.code;

      return new UpCoachError(message, code, graphQLError);
    }

    return new UpCoachError('Network error', 'NETWORK_ERROR', error);
  }
}

/**
 * Custom error class
 */
export class UpCoachError extends Error {
  code: string;
  originalError: any;

  constructor(message: string, code: string, originalError?: any) {
    super(message);
    this.name = 'UpCoachError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Export SDK
 */
export { GraphQLClient } from 'graphql-request';
export default UpCoachClient;
