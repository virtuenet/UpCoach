import { EventEmitter } from 'events';
import axios from 'axios';

/**
 * Calendar Event
 */
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  reminders?: number[]; // Minutes before event
  metadata?: Record<string, any>;
}

/**
 * Google Calendar Config
 */
export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

/**
 * OAuth Tokens
 */
export interface OAuth Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * GoogleCalendarIntegration
 *
 * Integrates with Google Calendar API for syncing goals and habits as calendar events.
 */
export class GoogleCalendarIntegration extends EventEmitter {
  private static instance: GoogleCalendarIntegration;
  private userTokens: Map<string, OAuthTokens> = new Map();
  private readonly apiBaseUrl = 'https://www.googleapis.com/calendar/v3';

  private constructor(private config: GoogleCalendarConfig) {
    super();
  }

  static getInstance(config: GoogleCalendarConfig): GoogleCalendarIntegration {
    if (!GoogleCalendarIntegration.instance) {
      GoogleCalendarIntegration.instance = new GoogleCalendarIntegration(config);
    }
    return GoogleCalendarIntegration.instance;
  }

  /**
   * Get OAuth Authorization URL
   */
  getAuthorizationUrl(userId: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      access_type: 'offline',
      state: userId,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange Authorization Code for Tokens
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code',
    });

    const tokens: OAuthTokens = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
    };

    return tokens;
  }

  /**
   * Store User Tokens
   */
  async storeUserTokens(userId: string, tokens: OAuthTokens): Promise<void> {
    this.userTokens.set(userId, tokens);
    this.emit('tokens:stored', { userId });
  }

  /**
   * Refresh Access Token
   */
  async refreshAccessToken(userId: string): Promise<OAuthTokens> {
    const tokens = this.userTokens.get(userId);
    if (!tokens) {
      throw new Error('No tokens found for user');
    }

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      refresh_token: tokens.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'refresh_token',
    });

    const newTokens: OAuthTokens = {
      ...tokens,
      accessToken: response.data.access_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
    };

    this.userTokens.set(userId, newTokens);
    return newTokens;
  }

  /**
   * Get Valid Access Token
   */
  private async getValidAccessToken(userId: string): Promise<string> {
    let tokens = this.userTokens.get(userId);
    if (!tokens) {
      throw new Error('User not connected to Google Calendar');
    }

    // Refresh if expired
    if (tokens.expiresAt < new Date()) {
      tokens = await this.refreshAccessToken(userId);
    }

    return tokens.accessToken;
  }

  /**
   * Create Calendar Event
   */
  async createEvent(userId: string, event: CalendarEvent): Promise<{ id: string }> {
    const accessToken = await this.getValidAccessToken(userId);

    const response = await axios.post(
      `${this.apiBaseUrl}/calendars/primary/events`,
      {
        summary: event.title,
        description: event.description,
        start: { dateTime: event.startTime.toISOString() },
        end: { dateTime: event.endTime.toISOString() },
        location: event.location,
        attendees: event.attendees?.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: event.reminders?.map(minutes => ({
            method: 'popup',
            minutes,
          })),
        },
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    this.emit('event:created', { userId, eventId: response.data.id });

    return { id: response.data.id };
  }

  /**
   * Update Calendar Event
   */
  async updateEvent(userId: string, eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    const accessToken = await this.getValidAccessToken(userId);

    await axios.patch(
      `${this.apiBaseUrl}/calendars/primary/events/${eventId}`,
      {
        summary: event.title,
        description: event.description,
        start: event.startTime ? { dateTime: event.startTime.toISOString() } : undefined,
        end: event.endTime ? { dateTime: event.endTime.toISOString() } : undefined,
        location: event.location,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    this.emit('event:updated', { userId, eventId });
  }

  /**
   * Delete Calendar Event
   */
  async deleteEvent(userId: string, eventId: string): Promise<void> {
    const accessToken = await this.getValidAccessToken(userId);

    await axios.delete(`${this.apiBaseUrl}/calendars/primary/events/${eventId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    this.emit('event:deleted', { userId, eventId });
  }

  /**
   * List Upcoming Events
   */
  async listUpcomingEvents(
    userId: string,
    maxResults: number = 10
  ): Promise<CalendarEvent[]> {
    const accessToken = await this.getValidAccessToken(userId);

    const response = await axios.get(`${this.apiBaseUrl}/calendars/primary/events`, {
      params: {
        maxResults,
        orderBy: 'startTime',
        singleEvents: true,
        timeMin: new Date().toISOString(),
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return response.data.items.map((item: any) => ({
      id: item.id,
      title: item.summary,
      description: item.description,
      startTime: new Date(item.start.dateTime || item.start.date),
      endTime: new Date(item.end.dateTime || item.end.date),
      location: item.location,
      attendees: item.attendees?.map((a: any) => a.email),
    }));
  }

  /**
   * Sync Goal as Calendar Event
   */
  async syncGoalToCalendar(userId: string, goal: {
    id: string;
    title: string;
    description?: string;
    dueDate?: Date;
  }): Promise<string> {
    const event: CalendarEvent = {
      id: '',
      title: `Goal: ${goal.title}`,
      description: goal.description,
      startTime: goal.dueDate || new Date(),
      endTime: new Date((goal.dueDate || new Date()).getTime() + 60 * 60 * 1000),
      reminders: [24 * 60, 60], // 1 day and 1 hour before
      metadata: { type: 'goal', goalId: goal.id },
    };

    const result = await this.createEvent(userId, event);
    return result.id;
  }

  /**
   * Disconnect User
   */
  async disconnect(userId: string): Promise<void> {
    this.userTokens.delete(userId);
    this.emit('user:disconnected', { userId });
  }
}
