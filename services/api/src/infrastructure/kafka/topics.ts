/**
 * Kafka Topic Definitions
 *
 * Defines all event topics used in the UpCoach platform for real-time processing
 */

export enum KafkaTopic {
  // User Habit Events
  HABIT_CHECKIN = 'user.habit.checkin',
  HABIT_CREATED = 'user.habit.created',
  HABIT_UPDATED = 'user.habit.updated',
  HABIT_DELETED = 'user.habit.deleted',

  // User Session Events
  SESSION_START = 'user.session.start',
  SESSION_END = 'user.session.end',

  // Goal Events
  GOAL_CREATED = 'user.goal.created',
  GOAL_UPDATED = 'user.goal.updated',
  GOAL_COMPLETED = 'user.goal.completed',
  GOAL_FAILED = 'user.goal.failed',

  // Subscription Events
  SUBSCRIPTION_CREATED = 'user.subscription.created',
  SUBSCRIPTION_CHANGED = 'user.subscription.changed',
  SUBSCRIPTION_CANCELLED = 'user.subscription.cancelled',
  SUBSCRIPTION_RENEWED = 'user.subscription.renewed',

  // Engagement Events
  ENGAGEMENT_DECREASED = 'user.engagement.decreased',
  ENGAGEMENT_INCREASED = 'user.engagement.increased',

  // AI Decision Events
  CHURN_RISK_DETECTED = 'ai.churn_risk.detected',
  INTERVENTION_TRIGGERED = 'ai.intervention.triggered',
  INTERVENTION_DELIVERED = 'ai.intervention.delivered',
  INTERVENTION_RESPONDED = 'ai.intervention.responded',

  // Model Events
  MODEL_PREDICTION = 'ml.model.prediction',
  MODEL_DRIFT_DETECTED = 'ml.model.drift_detected',
}

export interface KafkaTopicConfig {
  topic: KafkaTopic;
  partitions: number;
  replicationFactor: number;
  retentionMs: number;
  cleanupPolicy: 'delete' | 'compact';
}

export const TOPIC_CONFIGS: KafkaTopicConfig[] = [
  {
    topic: KafkaTopic.HABIT_CHECKIN,
    partitions: 6,
    replicationFactor: 3,
    retentionMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    cleanupPolicy: 'delete',
  },
  {
    topic: KafkaTopic.SESSION_START,
    partitions: 3,
    replicationFactor: 3,
    retentionMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    cleanupPolicy: 'delete',
  },
  {
    topic: KafkaTopic.SESSION_END,
    partitions: 3,
    replicationFactor: 3,
    retentionMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    cleanupPolicy: 'delete',
  },
  {
    topic: KafkaTopic.GOAL_CREATED,
    partitions: 3,
    replicationFactor: 3,
    retentionMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    cleanupPolicy: 'delete',
  },
  {
    topic: KafkaTopic.GOAL_COMPLETED,
    partitions: 3,
    replicationFactor: 3,
    retentionMs: 90 * 24 * 60 * 60 * 1000, // 90 days
    cleanupPolicy: 'delete',
  },
  {
    topic: KafkaTopic.SUBSCRIPTION_CHANGED,
    partitions: 2,
    replicationFactor: 3,
    retentionMs: 365 * 24 * 60 * 60 * 1000, // 365 days
    cleanupPolicy: 'delete',
  },
  {
    topic: KafkaTopic.CHURN_RISK_DETECTED,
    partitions: 4,
    replicationFactor: 3,
    retentionMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    cleanupPolicy: 'delete',
  },
  {
    topic: KafkaTopic.INTERVENTION_TRIGGERED,
    partitions: 4,
    replicationFactor: 3,
    retentionMs: 90 * 24 * 60 * 60 * 1000, // 90 days
    cleanupPolicy: 'delete',
  },
  {
    topic: KafkaTopic.MODEL_PREDICTION,
    partitions: 6,
    replicationFactor: 3,
    retentionMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    cleanupPolicy: 'delete',
  },
];
