module.exports = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-user-id', role: 'user' }),
  decode: jest.fn().mockReturnValue({ userId: 'test-user-id', role: 'user' }),
};