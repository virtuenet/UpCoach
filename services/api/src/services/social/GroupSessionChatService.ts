/**
 * Group Session Chat Service
 * Manages real-time chat, polls, and Q&A for group sessions
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GroupSessionChat,
  ChatMessageType,
  PollData,
  PollOption,
  Reaction,
  FileAttachment,
} from '../../models/social/GroupSessionChat';

// ==================== Types ====================

export interface SendMessageInput {
  sessionId: string;
  userId: string;
  messageType?: ChatMessageType;
  content: string;
  replyToId?: string;
  attachments?: FileAttachment[];
}

export interface CreatePollInput {
  sessionId: string;
  userId: string;
  question: string;
  options: string[];
  allowMultiple?: boolean;
  anonymous?: boolean;
  showResults?: boolean;
  durationMinutes?: number;
}

export interface AskQuestionInput {
  sessionId: string;
  userId: string;
  question: string;
  isAnonymous?: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  messageType: ChatMessageType;
  content: string;
  replyToId?: string;
  pollData?: PollData;
  attachments: FileAttachment[];
  reactions: Reaction[];
  isPinned: boolean;
  isHighlighted: boolean;
  isAnswered?: boolean;
  upvoteCount?: number;
  hasUpvoted?: boolean;
  createdAt: Date;
  editedAt?: Date;
}

export interface ChatEventHandler {
  onMessage: (message: ChatMessage) => void;
  onReaction: (messageId: string, reaction: Reaction) => void;
  onPollUpdate: (messageId: string, pollData: PollData) => void;
  onMessageDeleted: (messageId: string) => void;
  onMessagePinned: (messageId: string, isPinned: boolean) => void;
}

// ==================== Service ====================

export class GroupSessionChatService {
  private messages: Map<string, GroupSessionChat[]> = new Map();
  private eventHandlers: Map<string, ChatEventHandler[]> = new Map();
  private pollTimers: Map<string, NodeJS.Timeout> = new Map();

  // ==================== Messages ====================

  /**
   * Send a chat message
   */
  async sendMessage(input: SendMessageInput): Promise<ChatMessage> {
    const { sessionId, userId, messageType = 'text', content, replyToId, attachments = [] } = input;

    const message = {
      id: uuidv4(),
      sessionId,
      userId,
      messageType,
      content,
      replyToId,
      threadId: replyToId ? this.getThreadId(sessionId, replyToId) : undefined,
      attachments,
      reactions: [],
      isPinned: false,
      isHighlighted: false,
      isHidden: false,
      isAnswered: false,
      upvoteCount: 0,
      upvoterIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as GroupSessionChat;

    const sessionMessages = this.messages.get(sessionId) ?? [];
    sessionMessages.push(message);
    this.messages.set(sessionId, sessionMessages);

    // Emit event
    const chatMessage = this.toChatMessage(message);
    this.emitEvent(sessionId, 'message', chatMessage);

    return chatMessage;
  }

  /**
   * Send an announcement (host/moderator only)
   */
  async sendAnnouncement(
    sessionId: string,
    userId: string,
    content: string
  ): Promise<ChatMessage> {
    return this.sendMessage({
      sessionId,
      userId,
      messageType: 'announcement',
      content,
    });
  }

  /**
   * Get messages for a session
   */
  async getMessages(
    sessionId: string,
    options: {
      limit?: number;
      before?: Date;
      after?: Date;
      messageType?: ChatMessageType;
      userId?: string;
      pinnedOnly?: boolean;
      questionsOnly?: boolean;
      unansweredOnly?: boolean;
    } = {}
  ): Promise<ChatMessage[]> {
    const { limit = 100, before, after, messageType, pinnedOnly, questionsOnly, unansweredOnly } = options;

    let messages = this.messages.get(sessionId) ?? [];

    // Filter by visibility
    messages = messages.filter(m => !m.isHidden && !m.deletedAt);

    // Apply filters
    if (before) {
      messages = messages.filter(m => m.createdAt < before);
    }
    if (after) {
      messages = messages.filter(m => m.createdAt > after);
    }
    if (messageType) {
      messages = messages.filter(m => m.messageType === messageType);
    }
    if (pinnedOnly) {
      messages = messages.filter(m => m.isPinned);
    }
    if (questionsOnly) {
      messages = messages.filter(m => m.messageType === 'question');
    }
    if (unansweredOnly) {
      messages = messages.filter(m => m.messageType === 'question' && !m.isAnswered);
    }

    // Sort by creation time
    messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Apply limit
    messages = messages.slice(-limit);

    return messages.map(m => this.toChatMessage(m));
  }

  /**
   * Edit a message
   */
  async editMessage(
    messageId: string,
    userId: string,
    newContent: string
  ): Promise<ChatMessage | null> {
    for (const [sessionId, messages] of this.messages) {
      const message = messages.find(m => m.id === messageId);
      if (message && message.userId === userId && !message.deletedAt) {
        message.content = newContent;
        message.editedAt = new Date();
        message.updatedAt = new Date();

        const chatMessage = this.toChatMessage(message);
        this.emitEvent(sessionId, 'message', chatMessage);
        return chatMessage;
      }
    }
    return null;
  }

  /**
   * Delete a message
   */
  async deleteMessage(
    messageId: string,
    userId: string,
    isModeratorAction = false
  ): Promise<boolean> {
    for (const [sessionId, messages] of this.messages) {
      const message = messages.find(m => m.id === messageId);
      if (message && (message.userId === userId || isModeratorAction)) {
        message.deletedAt = new Date();
        message.updatedAt = new Date();

        this.emitEvent(sessionId, 'deleted', { messageId });
        return true;
      }
    }
    return false;
  }

  // ==================== Reactions ====================

  /**
   * Add reaction to a message
   */
  async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<boolean> {
    for (const [sessionId, messages] of this.messages) {
      const message = messages.find(m => m.id === messageId);
      if (message && !message.deletedAt) {
        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(r => r.emoji === emoji);
        if (existingReaction?.userIds.includes(userId)) {
          return false;
        }

        if (existingReaction) {
          existingReaction.count++;
          existingReaction.userIds.push(userId);
        } else {
          message.reactions.push({
            emoji,
            count: 1,
            userIds: [userId],
          });
        }

        message.updatedAt = new Date();

        this.emitEvent(sessionId, 'reaction', {
          messageId,
          reaction: message.reactions.find(r => r.emoji === emoji),
        });
        return true;
      }
    }
    return false;
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<boolean> {
    for (const [sessionId, messages] of this.messages) {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        const reaction = message.reactions.find(r => r.emoji === emoji);
        if (reaction && reaction.userIds.includes(userId)) {
          reaction.count--;
          reaction.userIds = reaction.userIds.filter(id => id !== userId);

          if (reaction.count === 0) {
            message.reactions = message.reactions.filter(r => r.emoji !== emoji);
          }

          message.updatedAt = new Date();

          this.emitEvent(sessionId, 'reaction', { messageId, reaction });
          return true;
        }
      }
    }
    return false;
  }

  // ==================== Polls ====================

  /**
   * Create a poll
   */
  async createPoll(input: CreatePollInput): Promise<ChatMessage> {
    const {
      sessionId,
      userId,
      question,
      options,
      allowMultiple = false,
      anonymous = false,
      showResults = true,
      durationMinutes,
    } = input;

    const pollOptions: PollOption[] = options.map((text, index) => ({
      id: `opt_${index}`,
      text,
      voteCount: 0,
      voterIds: [],
    }));

    const pollData: PollData = {
      question,
      options: pollOptions,
      status: 'active',
      allowMultiple,
      anonymous,
      showResults,
    };

    const message = {
      id: uuidv4(),
      sessionId,
      userId,
      messageType: 'poll' as ChatMessageType,
      content: question,
      pollData,
      attachments: [],
      reactions: [],
      isPinned: false,
      isHighlighted: true,
      isHidden: false,
      isAnswered: false,
      upvoteCount: 0,
      upvoterIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as GroupSessionChat;

    const sessionMessages = this.messages.get(sessionId) ?? [];
    sessionMessages.push(message);
    this.messages.set(sessionId, sessionMessages);

    // Set auto-close timer if duration specified
    if (durationMinutes) {
      const timer = setTimeout(() => {
        this.closePoll(message.id, userId);
      }, durationMinutes * 60000);
      this.pollTimers.set(message.id, timer);
    }

    const chatMessage = this.toChatMessage(message);
    this.emitEvent(sessionId, 'message', chatMessage);

    return chatMessage;
  }

  /**
   * Vote on a poll
   */
  async votePoll(
    pollId: string,
    userId: string,
    optionIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    for (const [sessionId, messages] of this.messages) {
      const message = messages.find(m => m.id === pollId);
      if (message?.pollData && message.pollData.status === 'active') {
        // Check if already voted (unless multiple allowed)
        if (!message.pollData.allowMultiple) {
          const alreadyVoted = message.pollData.options.some(opt =>
            opt.voterIds.includes(userId)
          );
          if (alreadyVoted) {
            return { success: false, error: 'Already voted' };
          }
          // Only allow one option if not multiple
          if (optionIds.length > 1) {
            return { success: false, error: 'Only one option allowed' };
          }
        }

        // Record votes
        for (const optionId of optionIds) {
          const option = message.pollData.options.find(o => o.id === optionId);
          if (option && !option.voterIds.includes(userId)) {
            option.voteCount++;
            option.voterIds.push(userId);
          }
        }

        message.updatedAt = new Date();

        this.emitEvent(sessionId, 'poll', {
          messageId: pollId,
          pollData: message.pollData,
        });

        return { success: true };
      }
    }
    return { success: false, error: 'Poll not found or closed' };
  }

  /**
   * Close a poll
   */
  async closePoll(pollId: string, userId: string): Promise<boolean> {
    for (const [sessionId, messages] of this.messages) {
      const message = messages.find(m => m.id === pollId);
      if (message?.pollData && message.userId === userId) {
        message.pollData.status = 'closed';
        message.pollData.closedAt = new Date();
        message.updatedAt = new Date();

        // Clear timer if exists
        const timer = this.pollTimers.get(pollId);
        if (timer) {
          clearTimeout(timer);
          this.pollTimers.delete(pollId);
        }

        this.emitEvent(sessionId, 'poll', {
          messageId: pollId,
          pollData: message.pollData,
        });

        return true;
      }
    }
    return false;
  }

  /**
   * Get poll results
   */
  async getPollResults(pollId: string): Promise<PollData | null> {
    for (const messages of this.messages.values()) {
      const message = messages.find(m => m.id === pollId);
      if (message?.pollData) {
        return message.pollData;
      }
    }
    return null;
  }

  // ==================== Q&A ====================

  /**
   * Ask a question
   */
  async askQuestion(input: AskQuestionInput): Promise<ChatMessage> {
    return this.sendMessage({
      sessionId: input.sessionId,
      userId: input.userId,
      messageType: 'question',
      content: input.question,
    });
  }

  /**
   * Answer a question
   */
  async answerQuestion(
    questionId: string,
    userId: string,
    answer: string
  ): Promise<ChatMessage | null> {
    for (const [sessionId, messages] of this.messages) {
      const question = messages.find(m => m.id === questionId);
      if (question && question.messageType === 'question') {
        // Send answer message
        const answerMessage = await this.sendMessage({
          sessionId,
          userId,
          messageType: 'answer',
          content: answer,
          replyToId: questionId,
        });

        // Mark question as answered
        question.isAnswered = true;
        question.answeredBy = userId;
        question.answeredAt = new Date();
        question.updatedAt = new Date();

        this.emitEvent(sessionId, 'message', this.toChatMessage(question));

        return answerMessage;
      }
    }
    return null;
  }

  /**
   * Upvote a question
   */
  async upvoteQuestion(questionId: string, userId: string): Promise<boolean> {
    for (const [sessionId, messages] of this.messages) {
      const question = messages.find(m => m.id === questionId);
      if (question && question.messageType === 'question') {
        if (question.upvoterIds.includes(userId)) {
          return false;
        }

        question.upvoteCount++;
        question.upvoterIds.push(userId);
        question.updatedAt = new Date();

        this.emitEvent(sessionId, 'message', this.toChatMessage(question));
        return true;
      }
    }
    return false;
  }

  /**
   * Get top questions (sorted by upvotes)
   */
  async getTopQuestions(
    sessionId: string,
    limit = 10,
    unansweredOnly = true
  ): Promise<ChatMessage[]> {
    let messages = this.messages.get(sessionId) ?? [];

    messages = messages.filter(
      m =>
        m.messageType === 'question' &&
        !m.isHidden &&
        !m.deletedAt &&
        (!unansweredOnly || !m.isAnswered)
    );

    messages.sort((a, b) => b.upvoteCount - a.upvoteCount);

    return messages.slice(0, limit).map(m => this.toChatMessage(m));
  }

  // ==================== Moderation ====================

  /**
   * Pin a message
   */
  async pinMessage(messageId: string, moderatorId: string): Promise<boolean> {
    for (const [sessionId, messages] of this.messages) {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        message.isPinned = true;
        message.updatedAt = new Date();

        this.emitEvent(sessionId, 'pinned', { messageId, isPinned: true });
        return true;
      }
    }
    return false;
  }

  /**
   * Unpin a message
   */
  async unpinMessage(messageId: string, moderatorId: string): Promise<boolean> {
    for (const [sessionId, messages] of this.messages) {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        message.isPinned = false;
        message.updatedAt = new Date();

        this.emitEvent(sessionId, 'pinned', { messageId, isPinned: false });
        return true;
      }
    }
    return false;
  }

  /**
   * Hide a message (moderation)
   */
  async hideMessage(
    messageId: string,
    moderatorId: string,
    reason?: string
  ): Promise<boolean> {
    for (const [sessionId, messages] of this.messages) {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        message.isHidden = true;
        message.hiddenBy = moderatorId;
        message.hiddenReason = reason;
        message.updatedAt = new Date();

        this.emitEvent(sessionId, 'deleted', { messageId });
        return true;
      }
    }
    return false;
  }

  /**
   * Highlight a message
   */
  async highlightMessage(messageId: string, moderatorId: string): Promise<boolean> {
    for (const [sessionId, messages] of this.messages) {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        message.isHighlighted = true;
        message.updatedAt = new Date();

        this.emitEvent(sessionId, 'message', this.toChatMessage(message));
        return true;
      }
    }
    return false;
  }

  // ==================== Event Handling ====================

  /**
   * Subscribe to chat events
   */
  subscribe(sessionId: string, handler: ChatEventHandler): () => void {
    const handlers = this.eventHandlers.get(sessionId) ?? [];
    handlers.push(handler);
    this.eventHandlers.set(sessionId, handlers);

    // Return unsubscribe function
    return () => {
      const currentHandlers = this.eventHandlers.get(sessionId) ?? [];
      this.eventHandlers.set(
        sessionId,
        currentHandlers.filter(h => h !== handler)
      );
    };
  }

  /**
   * Clear chat (for session cleanup)
   */
  async clearChat(sessionId: string): Promise<void> {
    this.messages.delete(sessionId);
    this.eventHandlers.delete(sessionId);
  }

  // ==================== Private Helpers ====================

  private getThreadId(sessionId: string, replyToId: string): string | undefined {
    const messages = this.messages.get(sessionId) ?? [];
    const replyTo = messages.find(m => m.id === replyToId);
    return replyTo?.threadId ?? replyToId;
  }

  private toChatMessage(message: GroupSessionChat, requestingUserId?: string): ChatMessage {
    return {
      id: message.id,
      sessionId: message.sessionId,
      userId: message.userId,
      messageType: message.messageType,
      content: message.content,
      replyToId: message.replyToId,
      pollData: message.pollData,
      attachments: message.attachments,
      reactions: message.reactions,
      isPinned: message.isPinned,
      isHighlighted: message.isHighlighted,
      isAnswered: message.isAnswered,
      upvoteCount: message.upvoteCount,
      hasUpvoted: requestingUserId
        ? message.upvoterIds.includes(requestingUserId)
        : undefined,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
    };
  }

  private emitEvent(
    sessionId: string,
    eventType: string,
    data: any
  ): void {
    const handlers = this.eventHandlers.get(sessionId) ?? [];
    for (const handler of handlers) {
      try {
        switch (eventType) {
          case 'message':
            handler.onMessage(data);
            break;
          case 'reaction':
            handler.onReaction(data.messageId, data.reaction);
            break;
          case 'poll':
            handler.onPollUpdate(data.messageId, data.pollData);
            break;
          case 'deleted':
            handler.onMessageDeleted(data.messageId);
            break;
          case 'pinned':
            handler.onMessagePinned(data.messageId, data.isPinned);
            break;
        }
      } catch (error) {
        console.error('[GroupSessionChatService] Event handler error:', error);
      }
    }
  }
}

// ==================== Factory ====================

export function createGroupSessionChatService(): GroupSessionChatService {
  return new GroupSessionChatService();
}

export default GroupSessionChatService;
