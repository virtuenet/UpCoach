import { KafkaConfig, logLevel } from 'kafkajs';

/**
 * Kafka Configuration
 *
 * Centralized configuration for Kafka connection and client settings
 */

export const kafkaConfig: KafkaConfig = {
  clientId: 'upcoach-api',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  logLevel: logLevel.ERROR,
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
    multiplier: 2,
    factor: 0.2,
  },
  connectionTimeout: 10000,
  requestTimeout: 30000,
  ssl: process.env.KAFKA_SSL_ENABLED === 'true' ? {
    rejectUnauthorized: false,
  } : undefined,
  sasl: process.env.KAFKA_SASL_ENABLED === 'true' ? {
    mechanism: 'plain',
    username: process.env.KAFKA_SASL_USERNAME || '',
    password: process.env.KAFKA_SASL_PASSWORD || '',
  } : undefined,
};

export const producerConfig = {
  allowAutoTopicCreation: false,
  transactionTimeout: 60000,
  retry: {
    retries: 5,
    initialRetryTime: 100,
  },
  idempotent: true,
  maxInFlightRequests: 5,
  compression: 1, // gzip
};

export const consumerConfig = {
  groupId: process.env.KAFKA_CONSUMER_GROUP || 'upcoach-api-consumer',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  allowAutoTopicCreation: false,
  retry: {
    retries: 5,
    initialRetryTime: 100,
  },
};
