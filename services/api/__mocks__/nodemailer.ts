/**
 * Mock for nodemailer module
 * Used in EmailService tests
 */

export const mockSendMail = jest.fn();
export const mockVerify = jest.fn();
export const mockClose = jest.fn();

const mockTransporter = {
  sendMail: mockSendMail,
  verify: mockVerify,
  close: mockClose,
};

export const createTransporter = jest.fn(() => mockTransporter);
export const createTestAccount = jest.fn().mockResolvedValue({
  user: 'test@ethereal.email',
  pass: 'testpass',
  smtp: {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
  },
});

const nodemailer = {
  createTransporter,
  createTestAccount,
};

export default nodemailer;
