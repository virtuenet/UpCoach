import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock nodemailer BEFORE importing EmailService
jest.mock('nodemailer');
jest.mock('../../config/environment');
jest.mock('../../utils/logger');

// Now import after mocks are set up
import { EmailService } from '../../services/EmailService';

describe('EmailService', () => {
  let emailService: EmailService;
  let mockTransporter: any;
  let mockSendMail: jest.Mock;
  let mockVerify: jest.Mock;
  let mockClose: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh mock functions
    mockSendMail = jest.fn();
    mockVerify = jest.fn();
    mockClose = jest.fn();

    // Mock nodemailer transporter
    mockTransporter = {
      sendMail: mockSendMail,
      verify: mockVerify,
      close: mockClose,
    };

    // Mock nodemailer.createTransporter
    const nodemailer = require('nodemailer');
    nodemailer.createTransporter = jest.fn().mockReturnValue(mockTransporter);
    nodemailer.createTestAccount = jest.fn().mockResolvedValue({
      user: 'test@test.com',
      pass: 'testpass',
      smtp: { host: 'smtp.test.com', port: 587, secure: false },
    });

    // Mock config
    require('../../config/environment').config = {
      email: {
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        user: 'test@test.com',
        password: 'testpass',
      },
    };

    // Mock verify to resolve successfully by default
    mockVerify.mockResolvedValue(true);

    emailService = new EmailService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize email service with SMTP configuration', () => {
      expect(emailService).toBeDefined();
      expect(require('nodemailer').createTransporter).toHaveBeenCalled();
    });

    test('should use test transporter when credentials are missing', () => {
      // Re-initialize with missing credentials
      require('../../config/environment').config = {
        email: {},
      };

      const newEmailService = new EmailService();
      expect(newEmailService).toBeDefined();
    });
  });

  describe('sendEmail', () => {
    test('should send email successfully', async () => {
      const emailOptions = {
        to: 'recipient@test.com',
        subject: 'Test Email',
        text: 'This is a test email',
        html: '<p>This is a test email</p>',
      };

      const mockResult = {
        messageId: 'test-message-id',
        response: '250 Message accepted',
      };

      mockSendMail.mockResolvedValue(mockResult);

      const result = await emailService.sendEmail(emailOptions);

      expect(result).toEqual({
        success: true,
        messageId: 'test-message-id',
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: 'recipient@test.com',
        subject: 'Test Email',
        text: 'This is a test email',
        html: '<p>This is a test email</p>',
      });
    });

    test('should send email to multiple recipients', async () => {
      const emailOptions = {
        to: ['recipient1@test.com', 'recipient2@test.com'],
        subject: 'Test Email',
        text: 'This is a test email',
      };

      const mockResult = {
        messageId: 'test-message-id',
        response: '250 Message accepted',
      };

      mockSendMail.mockResolvedValue(mockResult);

      const result = await emailService.sendEmail(emailOptions);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: ['recipient1@test.com', 'recipient2@test.com'],
        subject: 'Test Email',
        text: 'This is a test email',
      });
    });

    test('should send email with attachments', async () => {
      const emailOptions = {
        to: 'recipient@test.com',
        subject: 'Test Email with Attachment',
        text: 'This email has an attachment',
        attachments: [
          {
            filename: 'test-file.pdf',
            content: Buffer.from('test content'),
            contentType: 'application/pdf',
          },
        ],
      };

      const mockResult = {
        messageId: 'test-message-id',
        response: '250 Message accepted',
      };

      mockSendMail.mockResolvedValue(mockResult);

      const result = await emailService.sendEmail(emailOptions);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: 'recipient@test.com',
        subject: 'Test Email with Attachment',
        text: 'This email has an attachment',
        attachments: [
          {
            filename: 'test-file.pdf',
            content: Buffer.from('test content'),
            contentType: 'application/pdf',
          },
        ],
      });
    });

    test('should handle email sending errors', async () => {
      const emailOptions = {
        to: 'recipient@test.com',
        subject: 'Test Email',
        text: 'This is a test email',
      };

      const error = new Error('SMTP Error: Failed to send email');
      mockSendMail.mockRejectedValue(error);

      const result = await emailService.sendEmail(emailOptions);

      expect(result).toEqual({
        success: false,
        error: 'SMTP Error: Failed to send email',
      });
    });

    test('should validate email addresses', async () => {
      const emailOptions = {
        to: 'invalid-email',
        subject: 'Test Email',
        text: 'This is a test email',
      };

      const result = await emailService.sendEmail(emailOptions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address');
    });

    test('should require subject and content', async () => {
      const emailOptions = {
        to: 'recipient@test.com',
        subject: '',
        text: '',
      };

      const result = await emailService.sendEmail(emailOptions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Subject and content are required');
    });
  });

  describe('sendTemplateEmail', () => {
    test('should send template-based email', async () => {
      const templateData = {
        to: 'recipient@test.com',
        template: 'welcome',
        data: {
          username: 'testuser',
          loginUrl: 'https://app.upcoach.com/login',
        },
      };

      const mockResult = {
        messageId: 'test-message-id',
        response: '250 Message accepted',
      };

      mockSendMail.mockResolvedValue(mockResult);

      const result = await emailService.sendTemplateEmail(templateData);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalled();
    });

    test('should handle template rendering errors', async () => {
      const templateData = {
        to: 'recipient@test.com',
        template: 'non-existent-template',
        data: {},
      };

      const result = await emailService.sendTemplateEmail(templateData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Template not found');
    });
  });

  describe('sendReportEmail', () => {
    test('should send financial report email', async () => {
      const reportData = {
        to: 'admin@upcoach.com',
        reportType: 'financial',
        period: '2024-01',
        data: {
          totalRevenue: 100000,
          totalExpenses: 60000,
          netProfit: 40000,
        },
        attachments: [
          {
            filename: 'financial-report-2024-01.pdf',
            content: Buffer.from('PDF content'),
            contentType: 'application/pdf',
          },
        ],
      };

      const mockResult = {
        messageId: 'test-message-id',
        response: '250 Message accepted',
      };

      mockSendMail.mockResolvedValue(mockResult);

      const result = await emailService.sendReportEmail(reportData);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@upcoach.com',
          subject: expect.stringContaining('Financial Report'),
          attachments: reportData.attachments,
        })
      );
    });

    test('should send user analytics report email', async () => {
      const reportData = {
        to: 'analytics@upcoach.com',
        reportType: 'analytics',
        period: '2024-01',
        data: {
          totalUsers: 10000,
          activeUsers: 7500,
          newRegistrations: 1200,
        },
      };

      const mockResult = {
        messageId: 'test-message-id',
        response: '250 Message accepted',
      };

      mockSendMail.mockResolvedValue(mockResult);

      const result = await emailService.sendReportEmail(reportData);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'analytics@upcoach.com',
          subject: expect.stringContaining('Analytics Report'),
        })
      );
    });
  });

  describe('sendNotificationEmail', () => {
    test('should send system notification email', async () => {
      const notificationData = {
        to: 'admin@upcoach.com',
        type: 'system-alert',
        title: 'High Memory Usage Alert',
        message: 'Server memory usage is above 90%',
        priority: 'high',
        timestamp: new Date(),
      };

      const mockResult = {
        messageId: 'test-message-id',
        response: '250 Message accepted',
      };

      mockSendMail.mockResolvedValue(mockResult);

      const result = await emailService.sendNotificationEmail(notificationData);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@upcoach.com',
          subject: expect.stringContaining('High Memory Usage Alert'),
        })
      );
    });

    test('should send user notification email', async () => {
      const notificationData = {
        to: 'user@test.com',
        type: 'goal-reminder',
        title: 'Goal Reminder',
        message: 'Don\'t forget to update your daily progress!',
        priority: 'medium',
        timestamp: new Date(),
      };

      const mockResult = {
        messageId: 'test-message-id',
        response: '250 Message accepted',
      };

      mockSendMail.mockResolvedValue(mockResult);

      const result = await emailService.sendNotificationEmail(notificationData);

      expect(result.success).toBe(true);
    });
  });

  describe('verifyConnection', () => {
    test('should verify SMTP connection successfully', async () => {
      mockVerify.mockResolvedValue(true);

      const result = await emailService.verifyConnection();

      expect(result).toBe(true);
      expect(mockVerify).toHaveBeenCalled();
    });

    test('should handle connection verification errors', async () => {
      mockVerify.mockRejectedValue(new Error('Connection failed'));

      const result = await emailService.verifyConnection();

      expect(result).toBe(false);
    });
  });

  describe('healthCheck', () => {
    test('should perform health check successfully', async () => {
      mockVerify.mockResolvedValue(true);

      const result = await emailService.healthCheck();

      expect(result).toEqual({
        status: 'healthy',
        smtp: 'connected',
        timestamp: expect.any(Date),
      });
    });

    test('should detect unhealthy email service', async () => {
      mockVerify.mockRejectedValue(new Error('SMTP Error'));

      const result = await emailService.healthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('SMTP Error');
    });
  });

  describe('getEmailStats', () => {
    test('should return email statistics', async () => {
      const stats = await emailService.getEmailStats();

      expect(stats).toHaveProperty('totalSent');
      expect(stats).toHaveProperty('totalFailed');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('averageDeliveryTime');
    });
  });

  describe('close', () => {
    test('should close email transporter', async () => {
      mockClose.mockResolvedValue(undefined);

      await emailService.close();

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Email Validation', () => {
    test('should validate single email address', () => {
      expect(emailService.validateEmail('valid@test.com')).toBe(true);
      expect(emailService.validateEmail('invalid-email')).toBe(false);
      expect(emailService.validateEmail('')).toBe(false);
    });

    test('should validate multiple email addresses', () => {
      const validEmails = ['user1@test.com', 'user2@test.com'];
      const invalidEmails = ['valid@test.com', 'invalid-email'];

      expect(emailService.validateEmails(validEmails)).toBe(true);
      expect(emailService.validateEmails(invalidEmails)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle transporter initialization errors', () => {
      const nodemailer = require('nodemailer');
      nodemailer.createTransporter.mockImplementation(() => {
        throw new Error('Transporter creation failed');
      });

      expect(() => new EmailService()).not.toThrow();
    });

    test('should handle rate limiting errors', async () => {
      const emailOptions = {
        to: 'recipient@test.com',
        subject: 'Test Email',
        text: 'This is a test email',
      };

      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      mockSendMail.mockRejectedValue(rateLimitError);

      const result = await emailService.sendEmail(emailOptions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });
  });
});