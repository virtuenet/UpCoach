import DataLoader from 'dataloader';
import { Pool } from 'pg';
import { logger } from '../../utils/logger';

/**
 * DataLoader Configuration
 *
 * Prevents N+1 query problems by batching and caching database queries.
 *
 * Features:
 * - Automatic batching (collects requests in single event loop tick)
 * - Request-scoped caching
 * - NULL handling for missing records
 * - Type-safe batch functions
 *
 * Usage in resolvers:
 * ```
 * const user = await context.dataloaders.userLoader.load(userId);
 * const users = await context.dataloaders.userLoader.loadMany([id1, id2, id3]);
 * ```
 *
 * Performance:
 * - Without DataLoader: N+1 queries (1 + N for each relationship)
 * - With DataLoader: 2 queries (1 for parent + 1 batched for children)
 */

/**
 * Create all DataLoaders
 */
export function createDataLoaders(db: Pool) {
  return {
    userLoader: createUserLoader(db),
    tenantLoader: createTenantLoader(db),
    goalLoader: createGoalLoader(db),
    habitLoader: createHabitLoader(db),
    achievementLoader: createAchievementLoader(db),
    integrationLoader: createIntegrationLoader(db),
    webhookLoader: createWebhookLoader(db),
  };
}

/**
 * User DataLoader
 */
function createUserLoader(db: Pool) {
  return new DataLoader<string, any>(
    async (userIds) => {
      const query = `
        SELECT * FROM users
        WHERE id = ANY($1)
      `;
      const result = await db.query(query, [userIds]);

      // Create lookup map
      const userMap = new Map();
      result.rows.forEach((row) => {
        userMap.set(row.id, mapUser(row));
      });

      // Return in same order as requested
      return userIds.map((id) => userMap.get(id) || null);
    },
    {
      batchScheduleFn: (callback) => setTimeout(callback, 0),
      cacheKeyFn: (key) => key.toString(),
    }
  );
}

/**
 * Tenant DataLoader
 */
function createTenantLoader(db: Pool) {
  return new DataLoader<string, any>(async (tenantIds) => {
    const query = `
      SELECT * FROM tenants
      WHERE id = ANY($1)
    `;
    const result = await db.query(query, [tenantIds]);

    const tenantMap = new Map();
    result.rows.forEach((row) => {
      tenantMap.set(row.id, mapTenant(row));
    });

    return tenantIds.map((id) => tenantMap.get(id) || null);
  });
}

/**
 * Goal DataLoader
 */
function createGoalLoader(db: Pool) {
  return new DataLoader<string, any>(async (goalIds) => {
    const query = `
      SELECT * FROM goals
      WHERE id = ANY($1)
    `;
    const result = await db.query(query, [goalIds]);

    const goalMap = new Map();
    result.rows.forEach((row) => {
      goalMap.set(row.id, mapGoal(row));
    });

    return goalIds.map((id) => goalMap.get(id) || null);
  });
}

/**
 * Habit DataLoader
 */
function createHabitLoader(db: Pool) {
  return new DataLoader<string, any>(async (habitIds) => {
    const query = `
      SELECT * FROM habits
      WHERE id = ANY($1)
    `;
    const result = await db.query(query, [habitIds]);

    const habitMap = new Map();
    result.rows.forEach((row) => {
      habitMap.set(row.id, mapHabit(row));
    });

    return habitIds.map((id) => habitMap.get(id) || null);
  });
}

/**
 * Achievement DataLoader
 */
function createAchievementLoader(db: Pool) {
  return new DataLoader<string, any>(async (achievementIds) => {
    const query = `
      SELECT * FROM achievements
      WHERE id = ANY($1)
    `;
    const result = await db.query(query, [achievementIds]);

    const achievementMap = new Map();
    result.rows.forEach((row) => {
      achievementMap.set(row.id, mapAchievement(row));
    });

    return achievementIds.map((id) => achievementMap.get(id) || null);
  });
}

/**
 * Integration DataLoader
 */
function createIntegrationLoader(db: Pool) {
  return new DataLoader<string, any>(async (integrationIds) => {
    const query = `
      SELECT * FROM integrations
      WHERE id = ANY($1)
    `;
    const result = await db.query(query, [integrationIds]);

    const integrationMap = new Map();
    result.rows.forEach((row) => {
      integrationMap.set(row.id, mapIntegration(row));
    });

    return integrationIds.map((id) => integrationMap.get(id) || null);
  });
}

/**
 * Webhook DataLoader
 */
function createWebhookLoader(db: Pool) {
  return new DataLoader<string, any>(async (webhookIds) => {
    const query = `
      SELECT * FROM webhooks
      WHERE id = ANY($1)
    `;
    const result = await db.query(query, [webhookIds]);

    const webhookMap = new Map();
    result.rows.forEach((row) => {
      webhookMap.set(row.id, mapWebhook(row));
    });

    return webhookIds.map((id) => webhookMap.get(id) || null);
  });
}

/**
 * Mapper functions
 */

function mapUser(row: any): any {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role?.toUpperCase(),
    avatar: row.avatar,
    tenantId: row.tenant_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTenant(row: any): any {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    customDomain: row.custom_domain,
    branding: {
      primaryColor: row.primary_color || '#6366F1',
      secondaryColor: row.secondary_color || '#8B5CF6',
      logo: row.logo,
      fontFamily: row.font_family || 'Inter',
      customCss: row.custom_css,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

function mapIntegration(row: any): any {
  return {
    id: row.id,
    provider: row.provider?.toUpperCase(),
    status: row.status?.toUpperCase(),
    connectedAt: row.connected_at,
    lastSyncAt: row.last_sync_at,
    config: row.config,
  };
}

function mapWebhook(row: any): any {
  return {
    id: row.id,
    url: row.url,
    events: row.events,
    secret: row.secret,
    active: row.active,
    failureCount: row.failure_count || 0,
    lastDeliveredAt: row.last_delivered_at,
    createdAt: row.created_at,
  };
}
