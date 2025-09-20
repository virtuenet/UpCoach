"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsService = exports.SMSService = void 0;
exports.createSMSService = createSMSService;
const logger_1 = require("../../utils/logger");
class MockSMSProvider {
    name = 'mock';
    simulateFailure;
    constructor(simulateFailure = false) {
        this.simulateFailure = simulateFailure;
    }
    validateConfiguration() {
        return true;
    }
    async sendSMS(phoneNumber, message) {
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        if (this.simulateFailure) {
            return {
                success: false,
                error: 'Mock SMS provider failure simulation',
                provider: this.name
            };
        }
        if (process.env.NODE_ENV === 'development') {
            logger_1.logger.info('Mock SMS sent', {
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
    maskPhoneNumber(phoneNumber) {
        if (phoneNumber.length <= 4)
            return phoneNumber;
        return phoneNumber.slice(0, 3) + '*'.repeat(phoneNumber.length - 6) + phoneNumber.slice(-3);
    }
}
class TwilioSMSProvider {
    name = 'twilio';
    config;
    constructor(config) {
        this.config = config;
    }
    validateConfiguration() {
        return !!(this.config.accountSid &&
            this.config.authToken &&
            this.config.fromNumber);
    }
    async sendSMS(phoneNumber, message) {
        try {
            const twilio = await Promise.resolve().then(() => __importStar(require('twilio'))).catch(() => null);
            if (!twilio) {
                throw new Error('Twilio package not installed. Install with: npm install twilio');
            }
            const client = twilio.default(this.config.accountSid, this.config.authToken);
            const result = await client.messages.create({
                body: message,
                from: this.config.fromNumber,
                to: phoneNumber,
            });
            logger_1.logger.info('SMS sent via Twilio', {
                messageId: result.sid,
                status: result.status,
                provider: this.name
            });
            return {
                success: true,
                messageId: result.sid,
                provider: this.name
            };
        }
        catch (error) {
            logger_1.logger.error('Twilio SMS error', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown Twilio error',
                provider: this.name
            };
        }
    }
}
class AWSSNSProvider {
    name = 'aws-sns';
    config;
    constructor(config) {
        this.config = config;
    }
    validateConfiguration() {
        return !!(this.config.accessKeyId &&
            this.config.secretAccessKey &&
            this.config.region);
    }
    async sendSMS(phoneNumber, message) {
        try {
            const AWS = await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-sns'))).catch(() => null);
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
            logger_1.logger.info('SMS sent via AWS SNS', {
                messageId: result.MessageId,
                provider: this.name
            });
            return {
                success: true,
                messageId: result.MessageId,
                provider: this.name
            };
        }
        catch (error) {
            logger_1.logger.error('AWS SNS SMS error', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown AWS SNS error',
                provider: this.name
            };
        }
    }
}
class SMSService {
    static instance;
    provider;
    config;
    constructor(config) {
        this.config = config;
        this.provider = this.createProvider(config);
    }
    static getInstance(config) {
        if (!SMSService.instance && config) {
            SMSService.instance = new SMSService(config);
        }
        else if (!SMSService.instance) {
            SMSService.instance = new SMSService({
                provider: 'mock',
                mock: { enabled: true }
            });
        }
        return SMSService.instance;
    }
    createProvider(config) {
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
    async sendSMS(phoneNumber, message) {
        if (!this.isValidPhoneNumber(phoneNumber)) {
            return {
                success: false,
                error: 'Invalid phone number format',
                provider: this.provider.name
            };
        }
        if (message.length > 160) {
            logger_1.logger.warn('SMS message exceeds 160 characters', { length: message.length });
        }
        if (!this.provider.validateConfiguration()) {
            return {
                success: false,
                error: `${this.provider.name} provider configuration is invalid`,
                provider: this.provider.name
            };
        }
        try {
            const result = await this.provider.sendSMS(phoneNumber, message);
            await this.trackSMSUsage(phoneNumber);
            return result;
        }
        catch (error) {
            logger_1.logger.error('SMS sending failed', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown SMS error',
                provider: this.provider.name
            };
        }
    }
    async send2FACode(phoneNumber, code, expiryMinutes = 5) {
        const message = `Your UpCoach verification code is: ${code}. This code expires in ${expiryMinutes} minutes.`;
        return this.sendSMS(phoneNumber, message);
    }
    async sendSecurityAlert(phoneNumber, alertType) {
        const message = `UpCoach Security Alert: ${alertType}. If this wasn't you, please secure your account immediately.`;
        return this.sendSMS(phoneNumber, message);
    }
    isValidPhoneNumber(phoneNumber) {
        const e164Regex = /^\+[1-9]\d{1,14}$/;
        return e164Regex.test(phoneNumber);
    }
    async trackSMSUsage(phoneNumber) {
        try {
            const { redis } = await Promise.resolve().then(() => __importStar(require('../redis')));
            const key = `sms:usage:${phoneNumber}:${new Date().toISOString().split('T')[0]}`;
            const current = await redis.incr(key);
            if (current === 1) {
                await redis.expire(key, 86400);
            }
            if (current >= 10) {
                logger_1.logger.warn('High SMS usage detected', {
                    phoneNumber: this.maskPhoneNumber(phoneNumber),
                    dailyCount: current
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to track SMS usage', error);
        }
    }
    getProviderInfo() {
        return {
            name: this.provider.name,
            configured: this.provider.validateConfiguration()
        };
    }
    maskPhoneNumber(phoneNumber) {
        if (phoneNumber.length <= 4)
            return phoneNumber;
        return phoneNumber.slice(0, 3) + '*'.repeat(phoneNumber.length - 6) + phoneNumber.slice(-3);
    }
    updateConfig(config) {
        this.config = config;
        this.provider = this.createProvider(config);
        logger_1.logger.info('SMS service configuration updated', { provider: config.provider });
    }
}
exports.SMSService = SMSService;
function createSMSService() {
    let config;
    try {
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
    }
    catch {
        config = {
            provider: process.env.SMS_PROVIDER || 'mock',
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
exports.smsService = createSMSService();
//# sourceMappingURL=SMSService.js.map