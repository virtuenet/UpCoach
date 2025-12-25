import { Kafka, Producer, ProducerRecord, RecordMetadata } from 'kafkajs';
import { kafkaConfig, producerConfig } from './config';
import { KafkaTopic } from './topics';
import { logger } from '../../utils/logger';

/**
 * Kafka Producer Service
 *
 * High-throughput event producer with batching, compression, and retry logic
 */
export class KafkaProducerService {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer(producerConfig);
  }

  /**
   * Connect to Kafka cluster
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.producer.connect();
      this.isConnected = true;
      logger.info('Kafka producer connected successfully');
    } catch (error) {
      logger.error('Failed to connect Kafka producer', error);
      throw error;
    }
  }

  /**
   * Disconnect from Kafka cluster
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info('Kafka producer disconnected');
    } catch (error) {
      logger.error('Failed to disconnect Kafka producer', error);
      throw error;
    }
  }

  /**
   * Send a single event to Kafka
   */
  async sendEvent<T = any>(
    topic: KafkaTopic,
    key: string,
    value: T,
    headers?: Record<string, string>
  ): Promise<RecordMetadata[]> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const record: ProducerRecord = {
        topic,
        messages: [
          {
            key,
            value: JSON.stringify({
              ...value,
              timestamp: new Date().toISOString(),
            }),
            headers: {
              'content-type': 'application/json',
              'event-source': 'upcoach-api',
              ...headers,
            },
          },
        ],
      };

      const metadata = await this.producer.send(record);

      logger.debug(`Event sent to ${topic}`, {
        key,
        partition: metadata[0].partition,
        offset: metadata[0].offset,
      });

      return metadata;
    } catch (error) {
      logger.error(`Failed to send event to ${topic}`, { key, error });
      throw error;
    }
  }

  /**
   * Send multiple events in a batch
   */
  async sendBatch<T = any>(
    topic: KafkaTopic,
    events: Array<{ key: string; value: T; headers?: Record<string, string> }>
  ): Promise<RecordMetadata[]> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const record: ProducerRecord = {
        topic,
        messages: events.map(event => ({
          key: event.key,
          value: JSON.stringify({
            ...event.value,
            timestamp: new Date().toISOString(),
          }),
          headers: {
            'content-type': 'application/json',
            'event-source': 'upcoach-api',
            ...event.headers,
          },
        })),
      };

      const metadata = await this.producer.send(record);

      logger.info(`Batch of ${events.length} events sent to ${topic}`);

      return metadata;
    } catch (error) {
      logger.error(`Failed to send batch to ${topic}`, { count: events.length, error });
      throw error;
    }
  }

  /**
   * Send habit check-in event
   */
  async sendHabitCheckin(userId: string, habitId: string, data: any): Promise<void> {
    await this.sendEvent(
      KafkaTopic.HABIT_CHECKIN,
      userId,
      {
        userId,
        habitId,
        ...data,
      }
    );
  }

  /**
   * Send session start event
   */
  async sendSessionStart(userId: string, sessionId: string, metadata: any): Promise<void> {
    await this.sendEvent(
      KafkaTopic.SESSION_START,
      userId,
      {
        userId,
        sessionId,
        ...metadata,
      }
    );
  }

  /**
   * Send session end event
   */
  async sendSessionEnd(userId: string, sessionId: string, duration: number): Promise<void> {
    await this.sendEvent(
      KafkaTopic.SESSION_END,
      userId,
      {
        userId,
        sessionId,
        duration,
      }
    );
  }

  /**
   * Send goal created event
   */
  async sendGoalCreated(userId: string, goalId: string, goalData: any): Promise<void> {
    await this.sendEvent(
      KafkaTopic.GOAL_CREATED,
      userId,
      {
        userId,
        goalId,
        ...goalData,
      }
    );
  }

  /**
   * Send goal completed event
   */
  async sendGoalCompleted(userId: string, goalId: string, completionData: any): Promise<void> {
    await this.sendEvent(
      KafkaTopic.GOAL_COMPLETED,
      userId,
      {
        userId,
        goalId,
        ...completionData,
      }
    );
  }

  /**
   * Send churn risk detected event
   */
  async sendChurnRiskDetected(
    userId: string,
    churnProbability: number,
    riskTier: string,
    features: any
  ): Promise<void> {
    await this.sendEvent(
      KafkaTopic.CHURN_RISK_DETECTED,
      userId,
      {
        userId,
        churnProbability,
        riskTier,
        features,
      }
    );
  }

  /**
   * Send intervention triggered event
   */
  async sendInterventionTriggered(
    userId: string,
    interventionType: string,
    reason: string,
    metadata: any
  ): Promise<void> {
    await this.sendEvent(
      KafkaTopic.INTERVENTION_TRIGGERED,
      userId,
      {
        userId,
        interventionType,
        reason,
        ...metadata,
      }
    );
  }
}

// Singleton instance
export const kafkaProducer = new KafkaProducerService();
