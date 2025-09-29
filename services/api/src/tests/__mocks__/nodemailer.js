module.exports = {
  createTransporter: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      response: '250 Message accepted',
    }),
    verify: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(undefined),
  }),
  createTestAccount: jest.fn().mockResolvedValue({
    user: 'test@test.com',
    pass: 'testpass',
    smtp: { host: 'smtp.test.com', port: 587, secure: false },
  }),
};