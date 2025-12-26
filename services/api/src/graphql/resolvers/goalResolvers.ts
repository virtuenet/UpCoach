import { GraphQLContext } from '../apolloServer';
import { GraphQLError } from 'graphql';

export const goalResolvers = {
  Query: {
    goal: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');
      return context.dataloaders.goalLoader.load(id);
    },

    goals: async (_: any, args: any, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');

      const { limit = 20, offset = 0, status, category, userId } = args;

      let query = `SELECT * FROM goals WHERE tenant_id = $1`;
      const params: any[] = [context.user.tenantId];

      if (status) {
        params.push(status.toLowerCase());
        query += ` AND status = $${params.length}`;
      }

      if (category) {
        params.push(category.toLowerCase());
        query += ` AND category = $${params.length}`;
      }

      if (userId) {
        params.push(userId);
        query += ` AND user_id = $${params.length}`;
      } else {
        params.push(context.user.id);
        query += ` AND user_id = $${params.length}`;
      }

      const countResult = await context.db.query(
        query.replace('SELECT *', 'SELECT COUNT(*)'),
        params
      );
      const totalCount = parseInt(countResult.rows[0].count);

      params.push(limit, offset);
      query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const result = await context.db.query(query, params);

      const edges = result.rows.map((row, index) => ({
        node: mapGoal(row),
        cursor: Buffer.from(`${offset + index}`).toString('base64'),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage: offset + limit < totalCount,
          hasPreviousPage: offset > 0,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
        totalCount,
      };
    },
  },

  Mutation: {
    createGoal: async (_: any, { input }: any, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');

      const query = `
        INSERT INTO goals (title, description, category, target_date, status, user_id, tenant_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'active', $5, $6, NOW(), NOW())
        RETURNING *
      `;
      const result = await context.db.query(query, [
        input.title,
        input.description,
        input.category?.toLowerCase(),
        input.targetDate,
        context.user.id,
        context.user.tenantId,
      ]);

      return mapGoal(result.rows[0]);
    },

    updateGoal: async (_: any, { id, input }: any, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');

      const updates: string[] = [];
      const params: any[] = [id];

      if (input.title !== undefined) {
        params.push(input.title);
        updates.push(`title = $${params.length}`);
      }

      if (input.description !== undefined) {
        params.push(input.description);
        updates.push(`description = $${params.length}`);
      }

      if (input.status !== undefined) {
        params.push(input.status.toLowerCase());
        updates.push(`status = $${params.length}`);
      }

      if (input.category !== undefined) {
        params.push(input.category.toLowerCase());
        updates.push(`category = $${params.length}`);
      }

      if (input.targetDate !== undefined) {
        params.push(input.targetDate);
        updates.push(`target_date = $${params.length}`);
      }

      updates.push('updated_at = NOW()');

      const query = `UPDATE goals SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;
      const result = await context.db.query(query, params);

      return mapGoal(result.rows[0]);
    },

    deleteGoal: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');

      await context.db.query(`DELETE FROM goals WHERE id = $1 AND user_id = $2`, [
        id,
        context.user.id,
      ]);

      return true;
    },

    completeGoal: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');

      const query = `
        UPDATE goals SET status = 'completed', updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      const result = await context.db.query(query, [id, context.user.id]);

      return mapGoal(result.rows[0]);
    },

    createMilestone: async (_: any, { goalId, input }: any, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');

      const query = `
        INSERT INTO milestones (goal_id, title, description, due_date, completed, created_at)
        VALUES ($1, $2, $3, $4, false, NOW())
        RETURNING *
      `;
      const result = await context.db.query(query, [
        goalId,
        input.title,
        input.description,
        input.dueDate,
      ]);

      return mapMilestone(result.rows[0]);
    },

    updateMilestone: async (_: any, { id, input }: any, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');

      const updates: string[] = [];
      const params: any[] = [id];

      if (input.title !== undefined) {
        params.push(input.title);
        updates.push(`title = $${params.length}`);
      }

      if (input.description !== undefined) {
        params.push(input.description);
        updates.push(`description = $${params.length}`);
      }

      if (input.dueDate !== undefined) {
        params.push(input.dueDate);
        updates.push(`due_date = $${params.length}`);
      }

      if (input.completed !== undefined) {
        params.push(input.completed);
        updates.push(`completed = $${params.length}`);
        if (input.completed) {
          updates.push('completed_at = NOW()');
        }
      }

      const query = `UPDATE milestones SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;
      const result = await context.db.query(query, params);

      return mapMilestone(result.rows[0]);
    },

    completeMilestone: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');

      const query = `
        UPDATE milestones SET completed = true, completed_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const result = await context.db.query(query, [id]);

      return mapMilestone(result.rows[0]);
    },

    deleteMilestone: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) throw new GraphQLError('Authentication required');

      await context.db.query(`DELETE FROM milestones WHERE id = $1`, [id]);

      return true;
    },
  },
};

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
