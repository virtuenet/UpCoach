/**
 * Group Session Service
 * Manages group coaching session lifecycle
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GroupSession,
  GroupSessionAttributes,
  SessionStatus,
  SessionType,
  RecurrencePattern,
} from '../../models/social/GroupSession';
import {
  GroupSessionParticipant,
  ParticipantStatus,
  PaymentStatus,
} from '../../models/social/GroupSessionParticipant';

// ==================== Types ====================

export interface CreateSessionInput {
  coachId: string;
  title: string;
  description: string;
  sessionType: SessionType;
  category: string;
  tags?: string[];
  scheduledAt: Date;
  durationMinutes: number;
  timezone?: string;
  maxParticipants?: number;
  minParticipants?: number;
  isFree?: boolean;
  price?: number;
  currency?: string;
  earlyBirdPrice?: number;
  earlyBirdDeadline?: Date;
  coverImageUrl?: string;
  prerequisites?: string;
  learningObjectives?: string[];
  recordingEnabled?: boolean;
  chatEnabled?: boolean;
  pollsEnabled?: boolean;
  qnaEnabled?: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: Date;
}

export interface UpdateSessionInput {
  title?: string;
  description?: string;
  scheduledAt?: Date;
  durationMinutes?: number;
  maxParticipants?: number;
  price?: number;
  coverImageUrl?: string;
  prerequisites?: string;
  learningObjectives?: string[];
  materialsUrl?: string;
  chatEnabled?: boolean;
  pollsEnabled?: boolean;
  qnaEnabled?: boolean;
}

export interface SessionFilters {
  coachId?: string;
  status?: SessionStatus | SessionStatus[];
  sessionType?: SessionType;
  category?: string;
  isFree?: boolean;
  fromDate?: Date;
  toDate?: Date;
  tags?: string[];
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'scheduledAt' | 'createdAt' | 'price' | 'currentParticipants';
  sortOrder?: 'asc' | 'desc';
}

export interface SessionListResult {
  sessions: GroupSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RegistrationResult {
  success: boolean;
  participant?: GroupSessionParticipant;
  error?: string;
  waitlisted?: boolean;
  requiresPayment?: boolean;
  paymentAmount?: number;
}

// ==================== Service ====================

export class GroupSessionService {
  private sessions: Map<string, GroupSession> = new Map();
  private participants: Map<string, GroupSessionParticipant[]> = new Map();

  // ==================== Session CRUD ====================

  /**
   * Create a new group session
   */
  async createSession(input: CreateSessionInput): Promise<GroupSession> {
    const sessionId = uuidv4();

    const session = {
      id: sessionId,
      coachId: input.coachId,
      title: input.title,
      description: input.description,
      sessionType: input.sessionType,
      category: input.category,
      tags: input.tags ?? [],
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes,
      timezone: input.timezone ?? 'UTC',
      recurrencePattern: input.recurrencePattern ?? 'none',
      recurrenceEndDate: input.recurrenceEndDate,
      maxParticipants: input.maxParticipants ?? 20,
      minParticipants: input.minParticipants ?? 1,
      currentParticipants: 0,
      waitlistEnabled: true,
      waitlistCount: 0,
      isFree: input.isFree ?? false,
      price: input.price,
      currency: input.currency ?? 'USD',
      earlyBirdPrice: input.earlyBirdPrice,
      earlyBirdDeadline: input.earlyBirdDeadline,
      status: 'scheduled' as SessionStatus,
      coverImageUrl: input.coverImageUrl,
      prerequisites: input.prerequisites,
      learningObjectives: input.learningObjectives ?? [],
      recordingEnabled: input.recordingEnabled ?? false,
      chatEnabled: input.chatEnabled ?? true,
      pollsEnabled: input.pollsEnabled ?? true,
      qnaEnabled: input.qnaEnabled ?? true,
      reactionsEnabled: true,
      viewCount: 0,
      ratingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as GroupSession;

    this.sessions.set(sessionId, session);
    this.participants.set(sessionId, []);

    // Create recurring sessions if needed
    if (input.recurrencePattern && input.recurrencePattern !== 'none') {
      await this.createRecurringSessions(session);
    }

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<GroupSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  /**
   * Update session
   */
  async updateSession(
    sessionId: string,
    input: UpdateSessionInput,
    coachId: string
  ): Promise<GroupSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.coachId !== coachId) return null;

    // Cannot update completed or cancelled sessions
    if (['completed', 'cancelled'].includes(session.status)) {
      throw new Error('Cannot update completed or cancelled sessions');
    }

    Object.assign(session, {
      ...input,
      updatedAt: new Date(),
    });

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * List sessions with filters
   */
  async listSessions(
    filters: SessionFilters,
    pagination: PaginationOptions = {}
  ): Promise<SessionListResult> {
    const { page = 1, limit = 20, sortBy = 'scheduledAt', sortOrder = 'asc' } = pagination;

    let sessions = Array.from(this.sessions.values());

    // Apply filters
    if (filters.coachId) {
      sessions = sessions.filter(s => s.coachId === filters.coachId);
    }
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      sessions = sessions.filter(s => statuses.includes(s.status));
    }
    if (filters.sessionType) {
      sessions = sessions.filter(s => s.sessionType === filters.sessionType);
    }
    if (filters.category) {
      sessions = sessions.filter(s => s.category === filters.category);
    }
    if (filters.isFree !== undefined) {
      sessions = sessions.filter(s => s.isFree === filters.isFree);
    }
    if (filters.fromDate) {
      sessions = sessions.filter(s => s.scheduledAt >= filters.fromDate!);
    }
    if (filters.toDate) {
      sessions = sessions.filter(s => s.scheduledAt <= filters.toDate!);
    }
    if (filters.tags && filters.tags.length > 0) {
      sessions = sessions.filter(s =>
        filters.tags!.some(tag => s.tags.includes(tag))
      );
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      sessions = sessions.filter(
        s =>
          s.title.toLowerCase().includes(search) ||
          s.description.toLowerCase().includes(search)
      );
    }

    // Sort
    sessions.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'scheduledAt':
          comparison = a.scheduledAt.getTime() - b.scheduledAt.getTime();
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'price':
          comparison = (a.price ?? 0) - (b.price ?? 0);
          break;
        case 'currentParticipants':
          comparison = a.currentParticipants - b.currentParticipants;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const total = sessions.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    sessions = sessions.slice(offset, offset + limit);

    return { sessions, total, page, limit, totalPages };
  }

  /**
   * Get upcoming sessions for discovery
   */
  async discoverSessions(
    options: {
      category?: string;
      sessionType?: SessionType;
      isFree?: boolean;
      limit?: number;
    } = {}
  ): Promise<GroupSession[]> {
    const { limit = 10 } = options;

    const result = await this.listSessions(
      {
        status: 'scheduled',
        fromDate: new Date(),
        category: options.category,
        sessionType: options.sessionType,
        isFree: options.isFree,
      },
      { limit, sortBy: 'scheduledAt', sortOrder: 'asc' }
    );

    return result.sessions;
  }

  // ==================== Session Lifecycle ====================

  /**
   * Start a session (go live)
   */
  async startSession(
    sessionId: string,
    coachId: string
  ): Promise<{ success: boolean; meetingUrl?: string; error?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) return { success: false, error: 'Session not found' };
    if (session.coachId !== coachId) return { success: false, error: 'Unauthorized' };
    if (session.status !== 'scheduled') {
      return { success: false, error: 'Session cannot be started' };
    }

    // Generate meeting credentials
    const meetingId = `gs-${sessionId.slice(0, 8)}`;
    const meetingUrl = `https://meet.upcoach.app/${meetingId}`;
    const meetingPassword = Math.random().toString(36).slice(2, 10);

    session.status = 'live';
    session.meetingId = meetingId;
    session.meetingUrl = meetingUrl;
    session.meetingPassword = meetingPassword;
    session.updatedAt = new Date();

    this.sessions.set(sessionId, session);

    // Notify participants
    await this.notifyParticipants(sessionId, 'session_started', {
      meetingUrl,
      meetingPassword,
    });

    return { success: true, meetingUrl };
  }

  /**
   * End a session
   */
  async endSession(
    sessionId: string,
    coachId: string
  ): Promise<{ success: boolean; error?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) return { success: false, error: 'Session not found' };
    if (session.coachId !== coachId) return { success: false, error: 'Unauthorized' };
    if (session.status !== 'live') {
      return { success: false, error: 'Session is not live' };
    }

    session.status = 'completed';
    session.updatedAt = new Date();

    this.sessions.set(sessionId, session);

    // Update participant attendance
    await this.finalizeAttendance(sessionId);

    // Notify participants
    await this.notifyParticipants(sessionId, 'session_ended', {});

    return { success: true };
  }

  /**
   * Cancel a session
   */
  async cancelSession(
    sessionId: string,
    coachId: string,
    reason?: string
  ): Promise<{ success: boolean; refundCount?: number; error?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) return { success: false, error: 'Session not found' };
    if (session.coachId !== coachId) return { success: false, error: 'Unauthorized' };
    if (['completed', 'cancelled'].includes(session.status)) {
      return { success: false, error: 'Session cannot be cancelled' };
    }

    session.status = 'cancelled';
    session.updatedAt = new Date();

    this.sessions.set(sessionId, session);

    // Process refunds
    const refundCount = await this.processRefunds(sessionId);

    // Notify participants
    await this.notifyParticipants(sessionId, 'session_cancelled', { reason });

    return { success: true, refundCount };
  }

  // ==================== Registration ====================

  /**
   * Register for a session
   */
  async registerParticipant(
    sessionId: string,
    userId: string
  ): Promise<RegistrationResult> {
    const session = this.sessions.get(sessionId);
    if (!session) return { success: false, error: 'Session not found' };
    if (session.status !== 'scheduled') {
      return { success: false, error: 'Registration is closed' };
    }

    // Check if already registered
    const participants = this.participants.get(sessionId) ?? [];
    const existing = participants.find(p => p.userId === userId);
    if (existing) {
      return { success: false, error: 'Already registered' };
    }

    // Check capacity
    const isFull = session.currentParticipants >= session.maxParticipants;
    const status: ParticipantStatus = isFull && session.waitlistEnabled
      ? 'waitlisted'
      : 'registered';

    // Determine payment status
    const requiresPayment = !session.isFree;
    const paymentStatus: PaymentStatus = session.isFree ? 'not_required' : 'pending';

    // Calculate price
    let paymentAmount = 0;
    if (requiresPayment) {
      if (
        session.earlyBirdPrice &&
        session.earlyBirdDeadline &&
        new Date() < session.earlyBirdDeadline
      ) {
        paymentAmount = session.earlyBirdPrice;
      } else {
        paymentAmount = session.price ?? 0;
      }
    }

    const participant = {
      id: uuidv4(),
      sessionId,
      userId,
      status,
      role: 'participant',
      paymentStatus,
      currency: session.currency,
      registeredAt: new Date(),
      waitlistPosition: status === 'waitlisted' ? session.waitlistCount + 1 : undefined,
      attendanceMinutes: 0,
      attendancePercentage: 0,
      messageCount: 0,
      reactionCount: 0,
      pollsAnswered: 0,
      questionsAsked: 0,
      handRaiseCount: 0,
      upvoterIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as GroupSessionParticipant;

    participants.push(participant);
    this.participants.set(sessionId, participants);

    // Update session counts
    if (status === 'registered') {
      session.currentParticipants++;
    } else {
      session.waitlistCount++;
    }
    this.sessions.set(sessionId, session);

    return {
      success: true,
      participant,
      waitlisted: status === 'waitlisted',
      requiresPayment,
      paymentAmount,
    };
  }

  /**
   * Cancel registration
   */
  async cancelRegistration(
    sessionId: string,
    userId: string
  ): Promise<{ success: boolean; refunded?: boolean; error?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) return { success: false, error: 'Session not found' };

    const participants = this.participants.get(sessionId) ?? [];
    const participantIndex = participants.findIndex(p => p.userId === userId);
    if (participantIndex === -1) {
      return { success: false, error: 'Not registered' };
    }

    const participant = participants[participantIndex];
    const wasRegistered = participant.status === 'registered';
    const wasPaid = participant.paymentStatus === 'completed';

    // Update participant status
    participant.status = 'cancelled';
    participant.updatedAt = new Date();

    // Process refund if paid
    let refunded = false;
    if (wasPaid) {
      participant.paymentStatus = 'refunded';
      participant.refundedAt = new Date();
      participant.refundAmount = participant.amountPaid;
      refunded = true;
    }

    participants[participantIndex] = participant;
    this.participants.set(sessionId, participants);

    // Update session counts
    if (wasRegistered) {
      session.currentParticipants--;

      // Promote from waitlist
      await this.promoteFromWaitlist(sessionId);
    } else if (participant.status === 'waitlisted') {
      session.waitlistCount--;
    }
    this.sessions.set(sessionId, session);

    return { success: true, refunded };
  }

  /**
   * Get session participants
   */
  async getParticipants(
    sessionId: string,
    options: {
      status?: ParticipantStatus;
      includeWaitlist?: boolean;
    } = {}
  ): Promise<GroupSessionParticipant[]> {
    let participants = this.participants.get(sessionId) ?? [];

    if (options.status) {
      participants = participants.filter(p => p.status === options.status);
    }

    if (!options.includeWaitlist) {
      participants = participants.filter(p => p.status !== 'waitlisted');
    }

    return participants;
  }

  /**
   * Check if user is registered
   */
  async isRegistered(sessionId: string, userId: string): Promise<boolean> {
    const participants = this.participants.get(sessionId) ?? [];
    return participants.some(
      p => p.userId === userId && ['registered', 'confirmed', 'attended'].includes(p.status)
    );
  }

  // ==================== Attendance ====================

  /**
   * Record participant joining
   */
  async recordJoin(sessionId: string, userId: string): Promise<void> {
    const participants = this.participants.get(sessionId) ?? [];
    const participant = participants.find(p => p.userId === userId);
    if (!participant) return;

    if (!participant.joinedAt) {
      participant.joinedAt = new Date();
      participant.status = 'attended';
    }

    this.participants.set(sessionId, participants);
  }

  /**
   * Record participant leaving
   */
  async recordLeave(sessionId: string, userId: string): Promise<void> {
    const participants = this.participants.get(sessionId) ?? [];
    const participant = participants.find(p => p.userId === userId);
    if (!participant || !participant.joinedAt) return;

    participant.leftAt = new Date();

    // Calculate attendance
    const attendanceMs = participant.leftAt.getTime() - participant.joinedAt.getTime();
    participant.attendanceMinutes += Math.floor(attendanceMs / 60000);

    const session = this.sessions.get(sessionId);
    if (session) {
      participant.attendancePercentage = Math.min(
        100,
        (participant.attendanceMinutes / session.durationMinutes) * 100
      );
    }

    this.participants.set(sessionId, participants);
  }

  // ==================== Ratings ====================

  /**
   * Submit session rating
   */
  async submitRating(
    sessionId: string,
    userId: string,
    rating: number,
    feedback?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    const session = this.sessions.get(sessionId);
    if (!session) return { success: false, error: 'Session not found' };

    const participants = this.participants.get(sessionId) ?? [];
    const participant = participants.find(p => p.userId === userId);
    if (!participant) {
      return { success: false, error: 'Not a participant' };
    }
    if (participant.rating) {
      return { success: false, error: 'Already rated' };
    }

    participant.rating = rating;
    participant.feedback = feedback;
    participant.feedbackSubmittedAt = new Date();

    this.participants.set(sessionId, participants);

    // Update session average rating
    const allRatings = participants
      .filter(p => p.rating !== undefined)
      .map(p => p.rating!);

    session.ratingCount = allRatings.length;
    session.averageRating =
      allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;

    this.sessions.set(sessionId, session);

    return { success: true };
  }

  // ==================== Private Helpers ====================

  private async createRecurringSessions(template: GroupSession): Promise<void> {
    if (!template.recurrenceEndDate) return;

    const intervals: Record<string, number> = {
      daily: 1,
      weekly: 7,
      biweekly: 14,
      monthly: 30,
    };

    const interval = intervals[template.recurrencePattern] ?? 0;
    if (interval === 0) return;

    let nextDate = new Date(template.scheduledAt);
    nextDate.setDate(nextDate.getDate() + interval);

    while (nextDate <= template.recurrenceEndDate) {
      await this.createSession({
        ...template,
        scheduledAt: new Date(nextDate),
        recurrencePattern: 'none',
      });

      nextDate.setDate(nextDate.getDate() + interval);
    }
  }

  private async promoteFromWaitlist(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.currentParticipants >= session.maxParticipants) return;

    const participants = this.participants.get(sessionId) ?? [];
    const waitlisted = participants
      .filter(p => p.status === 'waitlisted')
      .sort((a, b) => (a.waitlistPosition ?? 0) - (b.waitlistPosition ?? 0));

    if (waitlisted.length === 0) return;

    const toPromote = waitlisted[0];
    toPromote.status = 'registered';
    toPromote.promotedFromWaitlistAt = new Date();
    toPromote.waitlistPosition = undefined;

    session.currentParticipants++;
    session.waitlistCount--;

    this.sessions.set(sessionId, session);
    this.participants.set(sessionId, participants);

    // Notify promoted participant
    await this.notifyParticipant(toPromote.userId, 'promoted_from_waitlist', {
      sessionId,
      sessionTitle: session.title,
    });
  }

  private async finalizeAttendance(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const participants = this.participants.get(sessionId) ?? [];

    for (const participant of participants) {
      if (participant.joinedAt && !participant.leftAt) {
        // Still in session, record leave now
        await this.recordLeave(sessionId, participant.userId);
      }

      if (!participant.joinedAt && participant.status === 'registered') {
        participant.status = 'no_show';
      }
    }

    this.participants.set(sessionId, participants);
  }

  private async processRefunds(sessionId: string): Promise<number> {
    const participants = this.participants.get(sessionId) ?? [];
    let refundCount = 0;

    for (const participant of participants) {
      if (participant.paymentStatus === 'completed') {
        participant.paymentStatus = 'refunded';
        participant.refundedAt = new Date();
        participant.refundAmount = participant.amountPaid;
        refundCount++;
      }
      participant.status = 'cancelled';
    }

    this.participants.set(sessionId, participants);
    return refundCount;
  }

  private async notifyParticipants(
    sessionId: string,
    eventType: string,
    data: Record<string, any>
  ): Promise<void> {
    const participants = this.participants.get(sessionId) ?? [];
    for (const participant of participants) {
      if (['registered', 'confirmed'].includes(participant.status)) {
        await this.notifyParticipant(participant.userId, eventType, data);
      }
    }
  }

  private async notifyParticipant(
    userId: string,
    eventType: string,
    data: Record<string, any>
  ): Promise<void> {
    // In production, integrate with notification service
    console.log(`[GroupSessionService] Notify ${userId}: ${eventType}`, data);
  }
}

// ==================== Factory ====================

export function createGroupSessionService(): GroupSessionService {
  return new GroupSessionService();
}

export default GroupSessionService;
