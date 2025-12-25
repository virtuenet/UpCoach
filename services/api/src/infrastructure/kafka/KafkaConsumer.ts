import { Kafka, Consumer, EachMessagePayload, ConsumerSubscribeTopics } from 'kafkajs';
import { kafkaConfig, consumerConfig } from './config';
import { KafkaTopic } from './topics';
import { logger } from '../../utils/logger';

/**
 * Kafka Consumer Service
 *
 * Consumes events from Kafka topics and routes to handlers
 */
export class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected: boolean = false;
  private handlers: Map<KafkaTopic, (payload: any) => Promise<void>> = new Map();

  constructor(groupId?: string) {
    this.kafka = new Kafka(kafkaConfig);
    this.consumer = this.kafka.consumer({
      ...consumerConfig,
      groupId: groupId || consumerConfig.groupId,
    });
  }

  /**
   * Connect to Kafka cluster
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.consumer.connect();
      this.isConnected = true;
      logger.info('Kafka consumer connected successfully');
    } catch (error) {
      logger.error('Failed to connect Kafka consumer', error);
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
      await this.consumer.disconnect();
      this.isConnected = false;
      logger.info('Kafka consumer disconnected');
    } catch (error) {
      logger.error('Failed to disconnect Kafka consumer', error);
      throw error;
    }
  }

  /**
   * Register a handler for a specific topic
   */
  registerHandler(topic: KafkaTopic, handler: (payload: any) => Promise<void>): void {
    this.handlers.set(topic, handler);
    logger.info(`Handler registered for topic: ${topic}`);
  }

  /**
   * Subscribe to topics and start consuming
   */
  async subscribe(topics: KafkaTopic[]): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const subscribeTopics: ConsumerSubscribeTopics = {
        topics,
        fromBeginning: false,
      };

      await this.consumer.subscribe(subscribeTopics);
      logger.info(`Subscribed to topics: ${topics.join(', ')}`);

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });
    } catch (error) {
      logger.error('Failed to subscribe to topics', { topics, error });
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      const key = message.key?.toString();
      const value = message.value?.toString();

      if (!value) {
        logger.warn('Received message with no value', { topic, partition, offset: message.offset });
        return;
      }

      const parsedValue = JSON.parse(value);

      logger.debug(`Processing message from ${topic}`, {
        key,
        partition,
        offset: message.offset,
      });

      // Find and execute handler
      const handler = this.handlers.get(topic as KafkaTopic);

      if (handler) {
        await handler({
          key,
          value: parsedValue,
          headers: message.headers,
          partition,
          offset: message.offset,
          timestamp: message.timestamp,
        });
      } else {
        logger.warn(`No handler registered for topic: ${topic}`);
      }
    } catch (error) {
      logger.error(`Failed to process message from ${topic}`, {
        partition,
        offset: message.offset,
        error,
      });

      // Don't throw - commit offset and continue
      // Dead letter queue can be implemented here
    }
  }

  /**
   * Seek to a specific offset
   */
  async seek(topic: KafkaTopic, partition: number, offset: string): Promise<void> {
    try {
      this.consumer.seek({ topic, partition, offset });
      logger.info(`Seeked to offset ${offset} on ${topic}:${partition}`);
    } catch (error) {
      logger.error('Failed to seek', { topic, partition, offset, error });
      throw error;
    }
  }

  /**
   * Pause consumption from topics
   */
  async pause(topics: KafkaTopic[]): Promise<void> {
    try {
      this.consumer.pause(topics.map(topic => ({ topic })));
      logger.info(`Paused consumption from topics: ${topics.join(', ')}`);
    } catch (error) {
      logger.error('Failed to pause topics', { topics, error });
      throw error;
    }
  }

  /**
   * Resume consumption from topics
   */
  async resume(topics: KafkaTopic[]): Promise<void> {
    try {
      this.consumer.resume(topics.map(topic => ({ topic })));
      logger.info(`Resumed consumption from topics: ${topics.join(', ')}`);
    } catch (error) {
      logger.error('Failed to resume topics', { topics, error });
      throw error;
    }
  }
}

// Create consumer instance
export const kafkaConsumer = new KafkaConsumerService();
