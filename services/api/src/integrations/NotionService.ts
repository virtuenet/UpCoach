import { Client } from '@notionhq/client';
import { Pool } from 'pg';
import { logger } from '../utils/logger';

/**
 * Notion Integration Service
 *
 * Integrates UpCoach with Notion for:
 * - Goal documentation sync
 * - Habit tracking databases
 * - Progress journals
 * - Team collaboration
 * - Knowledge base management
 *
 * Features:
 * - OAuth2 authentication
 * - Database creation/updates
 * - Page creation/updates
 * - Block content management
 * - Two-way sync (UpCoach ↔ Notion)
 * - Rich text formatting
 */

export interface NotionConnection {
  tenantId: string;
  userId: string;
  accessToken: string;
  workspaceId: string;
  workspaceName: string;
  databaseId?: string;
  createdAt: Date;
}

export interface NotionPage {
  id?: string;
  title: string;
  properties: Record<string, any>;
  children?: any[];
}

export interface NotionDatabase {
  id?: string;
  title: string;
  properties: Record<string, any>;
}

export class NotionService {
  private db: Pool;
  private notionClients: Map<string, Client> = new Map();

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Get OAuth2 authorization URL
   */
  getAuthorizationUrl(tenantId: string, userId: string): string {
    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      process.env.NOTION_REDIRECT_URI || 'https://api.upcoach.com/integrations/notion/callback'
    );
    const state = encodeURIComponent(JSON.stringify({ tenantId, userId }));

    return `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${redirectUri}&state=${state}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async handleOAuthCallback(
    code: string,
    tenantId: string,
    userId: string
  ): Promise<NotionConnection> {
    try {
      const auth = Buffer.from(
        `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
      ).toString('base64');

      const response = await fetch('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.NOTION_REDIRECT_URI,
        }),
      });

      const data = await response.json();

      if (!data.access_token) {
        throw new Error('Failed to get Notion access token');
      }

      const { access_token, workspace_id, workspace_name } = data;

      // Save connection
      const query = `
        INSERT INTO notion_connections (
          tenant_id, user_id, access_token, workspace_id,
          workspace_name, created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (tenant_id, user_id) DO UPDATE
        SET access_token = $3, workspace_id = $4,
            workspace_name = $5, updated_at = NOW()
        RETURNING *
      `;
      const result = await this.db.query(query, [
        tenantId,
        userId,
        access_token,
        workspace_id,
        workspace_name,
      ]);

      logger.info('Notion connected', { tenantId, userId, workspaceName: workspace_name });

      return this.mapRowToConnection(result.rows[0]);
    } catch (error) {
      logger.error('Notion OAuth failed', {
        tenantId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create habits tracking database
   */
  async createHabitsDatabase(
    tenantId: string,
    userId: string,
    parentPageId: string
  ): Promise<string> {
    try {
      const client = await this.getClient(tenantId, userId);

      const database = await client.databases.create({
        parent: { type: 'page_id', page_id: parentPageId },
        title: [
          {
            type: 'text',
            text: { content: 'UpCoach Habits Tracker' },
          },
        ],
        properties: {
          Name: { title: {} },
          Frequency: {
            select: {
              options: [
                { name: 'Daily', color: 'blue' },
                { name: 'Weekly', color: 'green' },
                { name: 'Monthly', color: 'purple' },
              ],
            },
          },
          'Current Streak': { number: { format: 'number' } },
          'Last Check-in': { date: {} },
          Status: {
            select: {
              options: [
                { name: 'Active', color: 'green' },
                { name: 'Paused', color: 'yellow' },
                { name: 'Completed', color: 'gray' },
              ],
            },
          },
        },
      });

      // Save database ID
      await this.db.query(
        `UPDATE notion_connections SET database_id = $1 WHERE tenant_id = $2 AND user_id = $3`,
        [database.id, tenantId, userId]
      );

      logger.info('Notion habits database created', {
        tenantId,
        userId,
        databaseId: database.id,
      });

      return database.id;
    } catch (error) {
      logger.error('Notion database creation failed', {
        tenantId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create habit page in Notion
   */
  async createHabitPage(
    tenantId: string,
    userId: string,
    databaseId: string,
    habitName: string,
    frequency: string,
    description?: string
  ): Promise<string> {
    try {
      const client = await this.getClient(tenantId, userId);

      const page = await client.pages.create({
        parent: { type: 'database_id', database_id: databaseId },
        properties: {
          Name: {
            title: [{ type: 'text', text: { content: habitName } }],
          },
          Frequency: {
            select: { name: frequency },
          },
          'Current Streak': {
            number: 0,
          },
          Status: {
            select: { name: 'Active' },
          },
        },
        children: description
          ? [
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  rich_text: [
                    {
                      type: 'text',
                      text: { content: description },
                    },
                  ],
                },
              },
            ]
          : [],
      });

      logger.info('Notion habit page created', {
        tenantId,
        userId,
        habitName,
        pageId: page.id,
      });

      return page.id;
    } catch (error) {
      logger.error('Notion habit page creation failed', {
        tenantId,
        userId,
        habitName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create goal documentation page
   */
  async createGoalPage(
    tenantId: string,
    userId: string,
    parentPageId: string,
    goalTitle: string,
    description: string,
    milestones: Array<{ name: string; dueDate?: string }>
  ): Promise<string> {
    try {
      const client = await this.getClient(tenantId, userId);

      // Build page content
      const children: any[] = [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Goal Description' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: description } }],
          },
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Milestones' } }],
          },
        },
      ];

      // Add milestones as checklist
      milestones.forEach((milestone) => {
        children.push({
          object: 'block',
          type: 'to_do',
          to_do: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: milestone.dueDate
                    ? `${milestone.name} (Due: ${milestone.dueDate})`
                    : milestone.name,
                },
              },
            ],
            checked: false,
          },
        });
      });

      const page = await client.pages.create({
        parent: { type: 'page_id', page_id: parentPageId },
        properties: {
          title: {
            title: [{ type: 'text', text: { content: `Goal: ${goalTitle}` } }],
          },
        },
        children,
      });

      logger.info('Notion goal page created', {
        tenantId,
        userId,
        goalTitle,
        pageId: page.id,
      });

      return page.id;
    } catch (error) {
      logger.error('Notion goal page creation failed', {
        tenantId,
        userId,
        goalTitle,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update habit streak in Notion
   */
  async updateHabitStreak(
    tenantId: string,
    userId: string,
    pageId: string,
    streak: number,
    lastCheckinDate: string
  ): Promise<void> {
    try {
      const client = await this.getClient(tenantId, userId);

      await client.pages.update({
        page_id: pageId,
        properties: {
          'Current Streak': {
            number: streak,
          },
          'Last Check-in': {
            date: { start: lastCheckinDate },
          },
        },
      });

      logger.info('Notion habit streak updated', {
        tenantId,
        userId,
        pageId,
        streak,
      });
    } catch (error) {
      logger.error('Notion habit streak update failed', {
        tenantId,
        userId,
        pageId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Mark milestone as completed
   */
  async completeMilestone(
    tenantId: string,
    userId: string,
    pageId: string,
    blockId: string
  ): Promise<void> {
    try {
      const client = await this.getClient(tenantId, userId);

      await client.blocks.update({
        block_id: blockId,
        to_do: {
          rich_text: [],
          checked: true,
        },
      } as any);

      logger.info('Notion milestone completed', {
        tenantId,
        userId,
        pageId,
        blockId,
      });
    } catch (error) {
      logger.error('Notion milestone completion failed', {
        tenantId,
        userId,
        blockId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Disconnect Notion
   */
  async disconnect(tenantId: string, userId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM notion_connections WHERE tenant_id = $1 AND user_id = $2`,
      [tenantId, userId]
    );
    this.notionClients.delete(`${tenantId}:${userId}`);
    logger.info('Notion disconnected', { tenantId, userId });
  }

  /**
   * Private helper methods
   */

  private async getClient(tenantId: string, userId: string): Promise<Client> {
    const key = `${tenantId}:${userId}`;

    if (!this.notionClients.has(key)) {
      const connection = await this.getConnection(tenantId, userId);
      const client = new Client({ auth: connection.accessToken });
      this.notionClients.set(key, client);
    }

    return this.notionClients.get(key)!;
  }

  private async getConnection(
    tenantId: string,
    userId: string
  ): Promise<NotionConnection> {
    const query = `
      SELECT * FROM notion_connections
      WHERE tenant_id = $1 AND user_id = $2
    `;
    const result = await this.db.query(query, [tenantId, userId]);

    if (result.rows.length === 0) {
      throw new Error('Notion not connected');
    }

    return this.mapRowToConnection(result.rows[0]);
  }

  private mapRowToConnection(row: any): NotionConnection {
    return {
      tenantId: row.tenant_id,
      userId: row.user_id,
      accessToken: row.access_token,
      workspaceId: row.workspace_id,
      workspaceName: row.workspace_name,
      databaseId: row.database_id,
      createdAt: row.created_at,
    };
  }
}
