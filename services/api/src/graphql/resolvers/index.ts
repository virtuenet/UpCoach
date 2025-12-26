import { GraphQLContext } from '../apolloServer';
import { GraphQLError } from 'graphql';
import { userResolvers } from './userResolvers';
import { goalResolvers } from './goalResolvers';
import { habitResolvers } from './habitResolvers';
import { tenantResolvers } from './tenantResolvers';
import { analyticsResolvers } from './analyticsResolvers';
import { integrationResolvers } from './integrationResolvers';
import { webhookResolvers } from './webhookResolvers';
import { complianceResolvers } from './complianceResolvers';

/**
 * Root Resolvers
 *
 * Combines all resolvers with:
 * - Field-level permission checks
 * - Error handling
 * - DataLoader usage
 * - Pagination support
 *
 * Resolver Structure:
 * - Query: Read operations
 * - Mutation: Write operations
 * - Subscription: Real-time updates
 * - Type: Field resolvers with DataLoader
 */

export const resolvers = {
  Query: {
    // Authentication
    me: async (_: any, __: any, context: GraphQLContext) => {
      requireAuth(context);
      return context.dataloaders.userLoader.load(context.user!.id);
    },

    // Users
    user: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      requireAuth(context);
      return context.dataloaders.userLoader.load(id);
    },

    users: userResolvers.Query.users,

    // Tenants
    tenant: tenantResolvers.Query.tenant,
    tenants: tenantResolvers.Query.tenants,

    // Goals
    goal: goalResolvers.Query.goal,
    goals: goalResolvers.Query.goals,

    // Habits
    habit: habitResolvers.Query.habit,
    habits: habitResolvers.Query.habits,

    // Analytics
    userAnalytics: analyticsResolvers.Query.userAnalytics,
    complianceMetrics: analyticsResolvers.Query.complianceMetrics,

    // Gamification
    achievements: async (
      _: any,
      { userId }: { userId: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const query = `
        SELECT * FROM achievements
        WHERE user_id = $1
        ORDER BY unlocked_at DESC NULLS LAST
      `;
      const result = await context.db.query(query, [userId]);
      return result.rows.map(mapAchievement);
    },

    leaderboard: async (
      _: any,
      { period, limit }: { period: string; limit: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      // Implementation would fetch leaderboard data
      return {
        period,
        entries: [],
      };
    },

    // Integrations
    integrations: integrationResolvers.Query.integrations,
    integration: integrationResolvers.Query.integration,

    // Webhooks
    webhooks: webhookResolvers.Query.webhooks,
    webhook: webhookResolvers.Query.webhook,
    webhookDeliveries: webhookResolvers.Query.webhookDeliveries,

    // Compliance
    complianceControls: complianceResolvers.Query.complianceControls,
    policies: complianceResolvers.Query.policies,
    vendors: complianceResolvers.Query.vendors,
  },

  Mutation: {
    // Authentication
    login: userResolvers.Mutation.login,
    register: userResolvers.Mutation.register,
    refreshToken: userResolvers.Mutation.refreshToken,
    logout: userResolvers.Mutation.logout,

    // Goals
    createGoal: goalResolvers.Mutation.createGoal,
    updateGoal: goalResolvers.Mutation.updateGoal,
    deleteGoal: goalResolvers.Mutation.deleteGoal,
    completeGoal: goalResolvers.Mutation.completeGoal,

    // Habits
    createHabit: habitResolvers.Mutation.createHabit,
    updateHabit: habitResolvers.Mutation.updateHabit,
    deleteHabit: habitResolvers.Mutation.deleteHabit,
    checkInHabit: habitResolvers.Mutation.checkInHabit,

    // Milestones
    createMilestone: goalResolvers.Mutation.createMilestone,
    updateMilestone: goalResolvers.Mutation.updateMilestone,
    completeMilestone: goalResolvers.Mutation.completeMilestone,
    deleteMilestone: goalResolvers.Mutation.deleteMilestone,

    // Tenants
    createTenant: tenantResolvers.Mutation.createTenant,
    updateTenant: tenantResolvers.Mutation.updateTenant,
    updateTenantBranding: tenantResolvers.Mutation.updateTenantBranding,

    // Integrations
    connectIntegration: integrationResolvers.Mutation.connectIntegration,
    disconnectIntegration: integrationResolvers.Mutation.disconnectIntegration,
    syncIntegration: integrationResolvers.Mutation.syncIntegration,

    // Webhooks
    createWebhook: webhookResolvers.Mutation.createWebhook,
    updateWebhook: webhookResolvers.Mutation.updateWebhook,
    deleteWebhook: webhookResolvers.Mutation.deleteWebhook,
    testWebhook: webhookResolvers.Mutation.testWebhook,

    // Compliance
    acceptPolicy: complianceResolvers.Mutation.acceptPolicy,
    assessVendor: complianceResolvers.Mutation.assessVendor,
  },

  Subscription: {
    habitCheckedIn: {
      subscribe: async function* (_: any, { userId }: { userId: string }, context: GraphQLContext) {
        requireAuth(context);
        // Redis pub/sub implementation
        // Yield habit check-in events for user
      },
    },

    goalUpdated: {
      subscribe: async function* (_: any, { userId }: { userId: string }, context: GraphQLContext) {
        requireAuth(context);
        // Yield goal update events for user
      },
    },

    achievementUnlocked: {
      subscribe: async function* (_: any, { userId }: { userId: string }, context: GraphQLContext) {
        requireAuth(context);
        // Yield achievement unlock events for user
      },
    },

    complianceScoreUpdated: {
      subscribe: async function* (
        _: any,
        { tenantId }: { tenantId: string },
        context: GraphQLContext
      ) {
        requireAuth(context);
        requireRole(context, ['OWNER', 'ADMIN']);
        // Yield compliance score updates for tenant
      },
    },
  },

  // Type resolvers (use DataLoader)
  User: {
    tenant: (user: any, _: any, context: GraphQLContext) => {
      return context.dataloaders.tenantLoader.load(user.tenantId || user.tenant_id);
    },

    goals: async (user: any, _: any, context: GraphQLContext) => {
      const query = `SELECT * FROM goals WHERE user_id = $1 AND status != 'ARCHIVED'`;
      const result = await context.db.query(query, [user.id]);
      return result.rows.map(mapGoal);
    },

    habits: async (user: any, _: any, context: GraphQLContext) => {
      const query = `SELECT * FROM habits WHERE user_id = $1 AND active = true`;
      const result = await context.db.query(query, [user.id]);
      return result.rows.map(mapHabit);
    },

    achievements: async (user: any, _: any, context: GraphQLContext) => {
      const query = `SELECT * FROM achievements WHERE user_id = $1`;
      const result = await context.db.query(query, [user.id]);
      return result.rows.map(mapAchievement);
    },
  },

  Goal: {
    owner: (goal: any, _: any, context: GraphQLContext) => {
      return context.dataloaders.userLoader.load(goal.userId || goal.user_id);
    },

    milestones: async (goal: any, _: any, context: GraphQLContext) => {
      const query = `SELECT * FROM milestones WHERE goal_id = $1 ORDER BY due_date`;
      const result = await context.db.query(query, [goal.id]);
      return result.rows.map(mapMilestone);
    },

    habits: async (goal: any, _: any, context: GraphQLContext) => {
      const query = `SELECT * FROM habits WHERE goal_id = $1 AND active = true`;
      const result = await context.db.query(query, [goal.id]);
      return result.rows.map(mapHabit);
    },
  },

  Habit: {
    owner: (habit: any, _: any, context: GraphQLContext) => {
      return context.dataloaders.userLoader.load(habit.userId || habit.user_id);
    },

    goal: (habit: any, _: any, context: GraphQLContext) => {
      if (!habit.goalId && !habit.goal_id) return null;
      return context.dataloaders.goalLoader.load(habit.goalId || habit.goal_id);
    },

    checkins: async (
      habit: any,
      { startDate, endDate }: { startDate?: string; endDate?: string },
      context: GraphQLContext
    ) => {
      let query = `SELECT * FROM habit_checkins WHERE habit_id = $1`;
      const params: any[] = [habit.id];

      if (startDate) {
        params.push(startDate);
        query += ` AND checked_in_at >= $${params.length}`;
      }

      if (endDate) {
        params.push(endDate);
        query += ` AND checked_in_at <= $${params.length}`;
      }

      query += ` ORDER BY checked_in_at DESC`;

      const result = await context.db.query(query, params);
      return result.rows.map(mapHabitCheckin);
    },

    statistics: habitResolvers.Habit.statistics,
  },

  Tenant: {
    members: async (tenant: any, _: any, context: GraphQLContext) => {
      const query = `
        SELECT tm.*, u.* FROM tenant_memberships tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.tenant_id = $1
      `;
      const result = await context.db.query(query, [tenant.id]);
      return result.rows.map((row) => ({
        id: row.id,
        user: mapUser(row),
        role: row.role,
        joinedAt: row.joined_at,
      }));
    },
  },
};

/**
 * Helper functions
 */

function requireAuth(context: GraphQLContext): void {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }
}

function requireRole(context: GraphQLContext, allowedRoles: string[]): void {
  requireAuth(context);

  if (!allowedRoles.includes(context.user!.role)) {
    throw new GraphQLError('Insufficient permissions', {
      extensions: {
        code: 'FORBIDDEN',
        requiredRoles: allowedRoles,
        http: { status: 403 },
      },
    });
  }
}

// Mappers (convert database rows to GraphQL types)
function mapUser(row: any): any {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role?.toUpperCase(),
    avatar: row.avatar,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tenantId: row.tenant_id,
  };
}

function mapGoal(row: any): any {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status?.toUpperCase(),
    category: row.category?.toUpperCase(),
    targetDate: row.target_date,
    progress: row.progress || 0,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapHabit(row: any): any {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    frequency: row.frequency?.toUpperCase(),
    streak: row.streak || 0,
    longestStreak: row.longest_streak || 0,
    totalCheckins: row.total_checkins || 0,
    category: row.category?.toUpperCase(),
    reminderTime: row.reminder_time,
    goalId: row.goal_id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMilestone(row: any): any {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    completed: row.completed,
    completedAt: row.completed_at,
    goalId: row.goal_id,
  };
}

function mapHabitCheckin(row: any): any {
  return {
    id: row.id,
    habitId: row.habit_id,
    checkedInAt: row.checked_in_at,
    note: row.note,
    mood: row.mood,
    location: row.location,
  };
}

function mapAchievement(row: any): any {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    icon: row.icon,
    points: row.points,
    rarity: row.rarity?.toUpperCase(),
    unlockedAt: row.unlocked_at,
    progress: row.progress || 0,
    requirement: row.requirement,
  };
}
