import { NotificationPayload } from './PushNotificationService';

/**
 * Notification Template Service
 * Provides pre-configured notification templates for different events
 */

export type NotificationType =
  | 'habit_reminder'
  | 'habit_streak'
  | 'goal_milestone'
  | 'coach_message'
  | 'achievement_unlocked'
  | 'task_due'
  | 'mood_check_in'
  | 'voice_journal_prompt'
  | 'community_reply'
  | 'subscription_expiring'
  | 'welcome'
  | 'daily_summary';

export interface TemplateData {
  [key: string]: string | number;
}

export class NotificationTemplateService {
  /**
   * Get notification payload for a specific template
   */
  static getTemplate(type: NotificationType, data: TemplateData): NotificationPayload {
    const templates: Record<NotificationType, (data: TemplateData) => NotificationPayload> = {
      habit_reminder: data => ({
        title: 'Habit Reminder',
        body: `Time for your daily ${data.habitName}! Keep your ${data.streakCount}-day streak going! 💪`,
        data: {
          type: 'habit_reminder',
          habitId: String(data.habitId),
          action: 'open_habit',
        },
        badge: 1,
      }),

      habit_streak: data => ({
        title: '🔥 Streak Milestone!',
        body: `Congratulations! You've completed ${data.habitName} for ${data.streakCount} days in a row!`,
        data: {
          type: 'habit_streak',
          habitId: String(data.habitId),
          streakCount: String(data.streakCount),
          action: 'open_habit',
        },
        badge: 1,
      }),

      goal_milestone: data => ({
        title: '🎯 Goal Progress!',
        body: `You're ${data.progress}% towards "${data.goalName}". Keep going!`,
        data: {
          type: 'goal_milestone',
          goalId: String(data.goalId),
          progress: String(data.progress),
          action: 'open_goal',
        },
        badge: 1,
      }),

      coach_message: data => ({
        title: `💬 Message from ${data.coachName}`,
        body:
          String(data.message).substring(0, 100) + (String(data.message).length > 100 ? '...' : ''),
        data: {
          type: 'coach_message',
          conversationId: String(data.conversationId),
          messageId: String(data.messageId),
          action: 'open_chat',
        },
        image: String(data.coachAvatar),
        badge: 1,
      }),

      achievement_unlocked: data => ({
        title: '🏆 Achievement Unlocked!',
        body: `You've earned "${data.achievementName}"! ${data.description}`,
        data: {
          type: 'achievement_unlocked',
          achievementId: String(data.achievementId),
          action: 'open_achievements',
        },
        image: String(data.badgeImage),
        badge: 1,
      }),

      task_due: data => ({
        title: '📝 Task Due Soon',
        body: `"${data.taskName}" is due ${data.dueTime}. Don't forget!`,
        data: {
          type: 'task_due',
          taskId: String(data.taskId),
          action: 'open_task',
        },
        badge: 1,
      }),

      mood_check_in: data => ({
        title: '😊 How are you feeling?',
        body: `It's time for your ${data.checkInTime} mood check-in. Take a moment to reflect.`,
        data: {
          type: 'mood_check_in',
          action: 'open_mood_tracker',
        },
        badge: 1,
      }),

      voice_journal_prompt: data => ({
        title: '🎙️ Voice Journal Prompt',
        body: `${data.promptText}`,
        data: {
          type: 'voice_journal_prompt',
          promptId: String(data.promptId),
          action: 'open_voice_journal',
        },
        badge: 1,
      }),

      community_reply: data => ({
        title: '💬 New Reply',
        body: `${data.userName} replied to your post: "${String(data.replyText).substring(0, 80)}..."`,
        data: {
          type: 'community_reply',
          postId: String(data.postId),
          replyId: String(data.replyId),
          action: 'open_community_post',
        },
        image: String(data.userAvatar),
        badge: 1,
      }),

      subscription_expiring: data => ({
        title: '⚠️ Subscription Expiring',
        body: `Your ${data.planName} subscription expires in ${data.daysRemaining} days. Renew now to keep your progress!`,
        data: {
          type: 'subscription_expiring',
          subscriptionId: String(data.subscriptionId),
          action: 'open_subscription',
        },
        badge: 1,
      }),

      welcome: data => ({
        title: '👋 Welcome to UpCoach!',
        body: `Hi ${data.userName}! Let's start your journey to better habits and goals. Complete your profile to get personalized coaching.`,
        data: {
          type: 'welcome',
          userId: String(data.userId),
          action: 'open_onboarding',
        },
        badge: 1,
      }),

      daily_summary: data => ({
        title: '📊 Your Daily Summary',
        body: `${data.completedHabits} habits completed, ${data.goalsProgress}% goal progress. ${data.motivationalMessage}`,
        data: {
          type: 'daily_summary',
          date: String(data.date),
          action: 'open_dashboard',
        },
        badge: 1,
      }),
    };

    const template = templates[type];
    if (!template) {
      throw new Error(`Unknown notification template: ${type}`);
    }

    return template(data);
  }

  /**
   * Get all available notification types
   */
  static getAvailableTypes(): NotificationType[] {
    return [
      'habit_reminder',
      'habit_streak',
      'goal_milestone',
      'coach_message',
      'achievement_unlocked',
      'task_due',
      'mood_check_in',
      'voice_journal_prompt',
      'community_reply',
      'subscription_expiring',
      'welcome',
      'daily_summary',
    ];
  }

  /**
   * Validate template data for a specific type
   */
  static validateTemplateData(type: NotificationType, data: TemplateData): boolean {
    const requiredFields: Record<NotificationType, string[]> = {
      habit_reminder: ['habitName', 'habitId', 'streakCount'],
      habit_streak: ['habitName', 'habitId', 'streakCount'],
      goal_milestone: ['goalName', 'goalId', 'progress'],
      coach_message: ['coachName', 'message', 'conversationId', 'messageId'],
      achievement_unlocked: ['achievementName', 'achievementId', 'description'],
      task_due: ['taskName', 'taskId', 'dueTime'],
      mood_check_in: ['checkInTime'],
      voice_journal_prompt: ['promptText', 'promptId'],
      community_reply: ['userName', 'replyText', 'postId', 'replyId'],
      subscription_expiring: ['planName', 'subscriptionId', 'daysRemaining'],
      welcome: ['userName', 'userId'],
      daily_summary: ['completedHabits', 'goalsProgress', 'motivationalMessage', 'date'],
    };

    const required = requiredFields[type];
    if (!required) {
      return false;
    }

    return required.every(field => data[field] !== undefined && data[field] !== null);
  }
}

// Export for convenience
export const notificationTemplates = NotificationTemplateService;
