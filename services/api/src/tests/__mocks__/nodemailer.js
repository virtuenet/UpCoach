const mockTransporter = {
  sendMail: jest.fn().mockResolvedValue({
    messageId: 'test-message-id',
    response: '250 Message accepted',
  }),
  verify: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(undefined),
};

const nodemailer = {
  createTransport: jest.fn().mockReturnValue(mockTransporter),
  createTransporter: jest.fn().mockReturnValue(mockTransporter), // Support both variations
  createTestAccount: jest.fn().mockResolvedValue({
    user: 'test@test.com',
    pass: 'testpass',
    smtp: { host: 'smtp.test.com', port: 587, secure: false },
  }),
};

// Ensure default export has all methods
nodemailer.default = nodemailer;

module.exports = nodemailer;
module.exports.default = nodemailer;