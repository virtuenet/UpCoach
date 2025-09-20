/**
 * SMS Service for Two-Factor Authentication and Notifications
 * Supports multiple providers: Twilio, AWS SNS, and mock service for development
 */

import { logger } from '../../utils/logger';

export interface SMSProvider {
  name: string;
  sendSMS(phoneNumber: string, message: string): Promise<SMSResult>;
  validateConfiguration(): boolean;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

export interface SMSConfig {
  provider: 'twilio' | 'aws-sns' | 'mock';
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  awsSns?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
  mock?: {
    enabled: boolean;
    simulateFailure?: boolean;
  };
}

/**
 * Mock SMS Provider for development and testing
 */
class MockSMSProvider implements SMSProvider {
  name = 'mock';
  private simulateFailure: boolean;

  constructor(simulateFailure = false) {
    this.simulateFailure = simulateFailure;
  }

  validateConfiguration(): boolean {
    return true;
  }

  async sendSMS(phoneNumber: string, message: string): Promise<SMSResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    if (this.simulateFailure) {
      return {
        success: false,
        error: 'Mock SMS provider failure simulation',
        provider: this.name
      };
    }

    // Log the SMS in development (never in production)
    if (process.env.NODE_ENV === 'development') {
      logger.info('Mock SMS sent', {
        to: this.maskPhoneNumber(phoneNumber),
        message: message.substring(0, 50) + '...',
        provider: this.name
      });
    }

    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      provider: this.name
    };
  }

  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return phoneNumber;
    return phoneNumber.slice(0, 3) + '*'.repeat(phoneNumber.length - 6) + phoneNumber.slice(-3);
  }
}

/**
 * Twilio SMS Provider
 */
class TwilioSMSProvider implements SMSProvider {
  name = 'twilio';
  private config: NonNullable<SMSConfig['twilio']>;

  constructor(config: NonNullable<SMSConfig['twilio']>) {
    this.config = config;
  }

  validateConfiguration(): boolean {
    return !!(
      this.config.accountSid &&
      this.config.authToken &&
      this.config.fromNumber
    );
  }

  async sendSMS(phoneNumber: string, message: string): Promise<SMSResult> {
    try {
      // Dynamic import to avoid requiring Twilio package if not used
      const twilio = await import('twilio').catch(() => null);

      if (!twilio) {
        throw new Error('Twilio package not installed. Install with: npm install twilio');
      }

      const client = twilio.default(this.config.accountSid, this.config.authToken);

      const result = await client.messages.create({
        body: message,
        from: this.config.fromNumber,
        to: phoneNumber,
      });

      logger.info('SMS sent via Twilio', {
        messageId: result.sid,
        status: result.status,
        provider: this.name
      });

      return {
        success: true,
        messageId: result.sid,
        provider: this.name
      };
    } catch (error) {
      logger.error('Twilio SMS error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Twilio error',
        provider: this.name
      };
    }
  }
}

/**
 * AWS SNS SMS Provider
 */
class AWSSNSProvider implements SMSProvider {
  name = 'aws-sns';
  private config: NonNullable<SMSConfig['awsSns']>;

  constructor(config: NonNullable<SMSConfig['awsSns']>) {
    this.config = config;
  }

  validateConfiguration(): boolean {
    return !!(
      this.config.accessKeyId &&
      this.config.secretAccessKey &&
      this.config.region
    );
  }

  async sendSMS(phoneNumber: string, message: string): Promise<SMSResult> {
    try {
      // Dynamic import to avoid requiring AWS SDK if not used
      const AWS = await import('@aws-sdk/client-sns').catch(() => null);

      if (!AWS) {
        throw new Error('AWS SDK not installed. Install with: npm install @aws-sdk/client-sns');
      }

      const client = new AWS.SNSClient({
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      });

      const command = new AWS.PublishCommand({
        PhoneNumber: phoneNumber,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
        },
      });

      const result = await client.send(command);

      logger.info('SMS sent via AWS SNS', {
        messageId: result.MessageId,
        provider: this.name
      });

      return {
        success: true,
        messageId: result.MessageId,
        provider: this.name
      };
    } catch (error) {
      logger.error('AWS SNS SMS error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown AWS SNS error',
        provider: this.name
      };
    }
  }
}

/**
 * Main SMS Service class
 */
export class SMSService {
  private static instance: SMSService;
  private provider: SMSProvider;
  private config: SMSConfig;

  private constructor(config: SMSConfig) {
    this.config = config;
    this.provider = this.createProvider(config);
  }

  static getInstance(config?: SMSConfig): SMSService {
    if (!SMSService.instance && config) {
      SMSService.instance = new SMSService(config);
    } else if (!SMSService.instance) {
      // Default to mock provider if no config provided
      SMSService.instance = new SMSService({
        provider: 'mock',
        mock: { enabled: true }
      });
    }
    return SMSService.instance;
  }

  private createProvider(config: SMSConfig): SMSProvider {
    switch (config.provider) {
      case 'twilio':
        if (!config.twilio) {
          throw new Error('Twilio configuration is required when using Twilio provider');
        }
        return new TwilioSMSProvider(config.twilio);

      case 'aws-sns':
        if (!config.awsSns) {
          throw new Error('AWS SNS configuration is required when using AWS SNS provider');
        }
        return new AWSSNSProvider(config.awsSns);

      case 'mock':
      default:
        return new MockSMSProvider(config.mock?.simulateFailure);
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(phoneNumber: string, message: string): Promise<SMSResult> {
    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: 'Invalid phone number format',
        provider: this.provider.name
      };
    }

    // Validate message length
    if (message.length > 160) {
      logger.warn('SMS message exceeds 160 characters', { length: message.length });
    }

    // Validate provider configuration
    if (!this.provider.validateConfiguration()) {
      return {
        success: false,
        error: `${this.provider.name} provider configuration is invalid`,
        provider: this.provider.name
      };
    }

    try {
      const result = await this.provider.sendSMS(phoneNumber, message);

      // Add rate limiting information
      await this.trackSMSUsage(phoneNumber);

      return result;
    } catch (error) {
      logger.error('SMS sending failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMS error',
        provider: this.provider.name
      };
    }
  }

  /**
   * Send two-factor authentication code
   */
  async send2FACode(phoneNumber: string, code: string, expiryMinutes = 5): Promise<SMSResult> {
    const message = `Your UpCoach verification code is: ${code}. This code expires in ${expiryMinutes} minutes.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(phoneNumber: string, alertType: string): Promise<SMSResult> {
    const message = `UpCoach Security Alert: ${alertType}. If this wasn't you, please secure your account immediately.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Validate phone number format (basic E.164 validation)
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Track SMS usage for rate limiting and analytics
   */
  private async trackSMSUsage(phoneNumber: string): Promise<void> {
    try {
      // Import redis dynamically to avoid circular dependencies
      const { redis } = await import('../redis');

      const key = `sms:usage:${phoneNumber}:${new Date().toISOString().split('T')[0]}`;
      const current = await redis.incr(key);

      if (current === 1) {
        // Set expiry for the key (24 hours)
        await redis.expire(key, 86400);
      }

      // Log if approaching limits
      if (current >= 10) {
        logger.warn('High SMS usage detected', {
          phoneNumber: this.maskPhoneNumber(phoneNumber),
          dailyCount: current
        });
      }
    } catch (error) {
      logger.error('Failed to track SMS usage', error);
    }
  }

  /**
   * Get current provider information
   */
  getProviderInfo(): { name: string; configured: boolean } {
    return {
      name: this.provider.name,
      configured: this.provider.validateConfiguration()
    };
  }

  /**
   * Mask phone number for logging
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return phoneNumber;
    return phoneNumber.slice(0, 3) + '*'.repeat(phoneNumber.length - 6) + phoneNumber.slice(-3);
  }

  /**
   * Update provider configuration
   */
  updateConfig(config: SMSConfig): void {
    this.config = config;
    this.provider = this.createProvider(config);
    logger.info('SMS service configuration updated', { provider: config.provider });
  }
}

/**
 * Factory function to create SMS service with environment-based config
 */
export function createSMSService(): SMSService {
  // Use environment configuration if available, otherwise fallback to process.env
  let config: SMSConfig;

  try {
    // Try to import environment config
    const { config: envConfig } = require('../../config/environment');

    config = {
      provider: envConfig.sms.provider,
      twilio: envConfig.sms.twilio.accountSid ? {
        accountSid: envConfig.sms.twilio.accountSid,
        authToken: envConfig.sms.twilio.authToken,
        fromNumber: envConfig.sms.twilio.fromNumber,
      } : undefined,
      awsSns: envConfig.sms.awsSns.accessKeyId ? {
        accessKeyId: envConfig.sms.awsSns.accessKeyId,
        secretAccessKey: envConfig.sms.awsSns.secretAccessKey,
        region: envConfig.sms.awsSns.region,
      } : undefined,
      mock: envConfig.sms.mock,
    };
  } catch {
    // Fallback to direct environment variables
    config = {
      provider: (process.env.SMS_PROVIDER as SMSConfig['provider']) || 'mock',
      twilio: process.env.TWILIO_ACCOUNT_SID ? {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        fromNumber: process.env.TWILIO_FROM_NUMBER || '',
      } : undefined,
      awsSns: process.env.AWS_SNS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_SNS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SNS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_SNS_REGION || 'us-east-1',
      } : undefined,
      mock: {
        enabled: process.env.NODE_ENV !== 'production',
        simulateFailure: process.env.SMS_SIMULATE_FAILURE === 'true',
      },
    };
  }

  return SMSService.getInstance(config);
}

// Export singleton instance
export const smsService = createSMSService();