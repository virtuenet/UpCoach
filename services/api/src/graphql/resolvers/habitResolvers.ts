import { GraphQLContext } from '../apolloServer';
import { GraphQLError } from 'graphql';

export const habitResolvers = {
  Query: {
    habit: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');
      return context.dataloaders.habitLoader.load(id);
    },

    habits: async (_: any, args: any, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');
      const { limit = 20, offset = 0, category, userId } = args;
      // Implementation similar to goalResolvers
      return { edges: [], pageInfo: {}, totalCount: 0 };
    },
  },

  Mutation: {
    createHabit: async (_: any, { input }: any, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');
      const query = `INSERT INTO habits (name, description, frequency, category, user_id, tenant_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
      const result = await context.db.query(query, [input.name, input.description, input.frequency?.toLowerCase(), input.category?.toLowerCase(), context.user.id, context.user.tenantId]);
      return mapHabit(result.rows[0]);
    },

    updateHabit: async (_: any, { id, input }: any, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');
      // Implementation similar to updateGoal
      return { id };
    },

    deleteHabit: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');
      await context.db.query(`DELETE FROM habits WHERE id = $1`, [id]);
      return true;
    },

    checkInHabit: async (_: any, { habitId, note, mood }: any, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');
      const query = `INSERT INTO habit_checkins (habit_id, user_id, checked_in_at, note, mood) VALUES ($1, $2, NOW(), $3, $4) RETURNING *`;
      const result = await context.db.query(query, [habitId, context.user.id, note, mood]);
      return { id: result.rows[0].id, habitId, checkedInAt: result.rows[0].checked_in_at, note, mood };
    },
  },

  Habit: {
    statistics: async (habit: any, { period }: { period: string }, context: GraphQLContext) => {
      return { totalCheckins: 0, currentStreak: 0, longestStreak: 0, completionRate: 0, averageMood: 0, checkinsByDayOfWeek: [], checkinsByHour: [] };
    },
  },
};

function mapHabit(row: any): any {
  return { id: row.id, name: row.name, description: row.description, frequency: row.frequency?.toUpperCase(), streak: row.streak || 0, category: row.category?.toUpperCase(), userId: row.user_id, createdAt: row.created_at, updatedAt: row.updated_at };
}
