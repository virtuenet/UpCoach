import { google, calendar_v3 } from 'googleapis';
import { Pool } from 'pg';
import { logger } from '../utils/logger';

/**
 * Google Calendar Integration Service
 *
 * Integrates UpCoach with Google Calendar for:
 * - Habit scheduling (create recurring calendar events)
 * - Goal milestone deadlines
 * - Check-in reminders
 * - Coach session bookings
 * - Two-way sync (UpCoach ↔ Google Calendar)
 *
 * Features:
 * - OAuth2 authentication
 * - Calendar event CRUD
 * - Recurring events (RRULE)
 * - Event reminders/notifications
 * - Multiple calendar support
 * - Timezone handling
 */

export interface GoogleCalendarConnection {
  tenantId: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  calendarId: string;
  createdAt: Date;
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export class GoogleCalendarService {
  private db: Pool;
  private oauth2Client: any;

  constructor(db: Pool) {
    this.db = db;
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'https://api.upcoach.com/integrations/google/callback'
    );
  }

  /**
   * Get OAuth2 authorization URL
   */
  getAuthorizationUrl(tenantId: string, userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: JSON.stringify({ tenantId, userId }),
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async handleOAuthCallback(
    code: string,
    tenantId: string,
    userId: string
  ): Promise<GoogleCalendarConnection> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      const { access_token, refresh_token, expiry_date } = tokens;

      // Save connection
      const query = `
        INSERT INTO google_calendar_connections (
          tenant_id, user_id, access_token, refresh_token,
          token_expiry, calendar_id, created_at
        )
        VALUES ($1, $2, $3, $4, $5, 'primary', NOW())
        ON CONFLICT (tenant_id, user_id) DO UPDATE
        SET access_token = $3, refresh_token = $4,
            token_expiry = $5, updated_at = NOW()
        RETURNING *
      `;
      const result = await this.db.query(query, [
        tenantId,
        userId,
        access_token,
        refresh_token,
        new Date(expiry_date!),
      ]);

      logger.info('Google Calendar connected', { tenantId, userId });

      return this.mapRowToConnection(result.rows[0]);
    } catch (error) {
      logger.error('Google Calendar OAuth failed', {
        tenantId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create habit reminder event
   */
  async createHabitEvent(
    tenantId: string,
    userId: string,
    habitName: string,
    frequency: 'daily' | 'weekly' | 'monthly',
    startTime: string,
    timezone: string = 'America/New_York'
  ): Promise<string> {
    try {
      const connection = await this.getConnection(tenantId, userId);
      await this.refreshTokenIfNeeded(connection);

      this.oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const event: CalendarEvent = {
        summary: `Habit: ${habitName}`,
        description: `Time to check in your habit "${habitName}"`,
        start: {
          dateTime: startTime,
          timeZone: timezone,
        },
        end: {
          dateTime: this.addMinutes(startTime, 30),
          timeZone: timezone,
        },
        recurrence: [this.buildRecurrenceRule(frequency)],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 10 },
            { method: 'email', minutes: 60 },
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: connection.calendarId,
        requestBody: event as calendar_v3.Schema$Event,
      });

      logger.info('Habit event created', {
        tenantId,
        userId,
        habitName,
        eventId: response.data.id,
      });

      return response.data.id!;
    } catch (error) {
      logger.error('Habit event creation failed', {
        tenantId,
        userId,
        habitName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create goal milestone deadline
   */
  async createGoalMilestone(
    tenantId: string,
    userId: string,
    goalTitle: string,
    milestoneName: string,
    dueDate: string,
    timezone: string = 'America/New_York'
  ): Promise<string> {
    try {
      const connection = await this.getConnection(tenantId, userId);
      await this.refreshTokenIfNeeded(connection);

      this.oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const event: CalendarEvent = {
        summary: `Goal Milestone: ${milestoneName}`,
        description: `Milestone for goal "${goalTitle}": ${milestoneName}`,
        start: {
          dateTime: dueDate,
          timeZone: timezone,
        },
        end: {
          dateTime: this.addMinutes(dueDate, 60),
          timeZone: timezone,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: connection.calendarId,
        requestBody: event as calendar_v3.Schema$Event,
      });

      logger.info('Goal milestone event created', {
        tenantId,
        userId,
        goalTitle,
        eventId: response.data.id,
      });

      return response.data.id!;
    } catch (error) {
      logger.error('Goal milestone event creation failed', {
        tenantId,
        userId,
        goalTitle,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update calendar event
   */
  async updateEvent(
    tenantId: string,
    userId: string,
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<void> {
    try {
      const connection = await this.getConnection(tenantId, userId);
      await this.refreshTokenIfNeeded(connection);

      this.oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.patch({
        calendarId: connection.calendarId,
        eventId,
        requestBody: updates as calendar_v3.Schema$Event,
      });

      logger.info('Calendar event updated', { tenantId, userId, eventId });
    } catch (error) {
      logger.error('Calendar event update failed', {
        tenantId,
        userId,
        eventId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(
    tenantId: string,
    userId: string,
    eventId: string
  ): Promise<void> {
    try {
      const connection = await this.getConnection(tenantId, userId);
      await this.refreshTokenIfNeeded(connection);

      this.oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.delete({
        calendarId: connection.calendarId,
        eventId,
      });

      logger.info('Calendar event deleted', { tenantId, userId, eventId });
    } catch (error) {
      logger.error('Calendar event deletion failed', {
        tenantId,
        userId,
        eventId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * List upcoming events
   */
  async listUpcomingEvents(
    tenantId: string,
    userId: string,
    maxResults: number = 10
  ): Promise<any[]> {
    try {
      const connection = await this.getConnection(tenantId, userId);
      await this.refreshTokenIfNeeded(connection);

      this.oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.list({
        calendarId: connection.calendarId,
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      logger.error('Calendar events list failed', {
        tenantId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnect(tenantId: string, userId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM google_calendar_connections WHERE tenant_id = $1 AND user_id = $2`,
      [tenantId, userId]
    );
    logger.info('Google Calendar disconnected', { tenantId, userId });
  }

  /**
   * Private helper methods
   */

  private async getConnection(
    tenantId: string,
    userId: string
  ): Promise<GoogleCalendarConnection> {
    const query = `
      SELECT * FROM google_calendar_connections
      WHERE tenant_id = $1 AND user_id = $2
    `;
    const result = await this.db.query(query, [tenantId, userId]);

    if (result.rows.length === 0) {
      throw new Error('Google Calendar not connected');
    }

    return this.mapRowToConnection(result.rows[0]);
  }

  private async refreshTokenIfNeeded(
    connection: GoogleCalendarConnection
  ): Promise<void> {
    const now = new Date();
    const expiry = new Date(connection.tokenExpiry);

    // Refresh if token expires in next 5 minutes
    if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
      this.oauth2Client.setCredentials({
        refresh_token: connection.refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      const { access_token, expiry_date } = credentials;

      // Update database
      await this.db.query(
        `UPDATE google_calendar_connections
         SET access_token = $1, token_expiry = $2, updated_at = NOW()
         WHERE tenant_id = $3 AND user_id = $4`,
        [access_token, new Date(expiry_date!), connection.tenantId, connection.userId]
      );

      connection.accessToken = access_token!;
      connection.tokenExpiry = new Date(expiry_date!);

      logger.info('Google Calendar token refreshed', {
        tenantId: connection.tenantId,
        userId: connection.userId,
      });
    }
  }

  private buildRecurrenceRule(frequency: 'daily' | 'weekly' | 'monthly'): string {
    const freqMap = {
      daily: 'DAILY',
      weekly: 'WEEKLY',
      monthly: 'MONTHLY',
    };
    return `RRULE:FREQ=${freqMap[frequency]}`;
  }

  private addMinutes(dateTime: string, minutes: number): string {
    const date = new Date(dateTime);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
  }

  private mapRowToConnection(row: any): GoogleCalendarConnection {
    return {
      tenantId: row.tenant_id,
      userId: row.user_id,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      tokenExpiry: row.token_expiry,
      calendarId: row.calendar_id,
      createdAt: row.created_at,
    };
  }
}
