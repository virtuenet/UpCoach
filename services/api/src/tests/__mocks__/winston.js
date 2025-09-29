module.exports = {
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  }),
  format: {
    combine: jest.fn().mockReturnValue({}),
    timestamp: jest.fn().mockReturnValue({}),
    printf: jest.fn().mockReturnValue({}),
    colorize: jest.fn().mockReturnValue({}),
    simple: jest.fn().mockReturnValue({}),
    json: jest.fn().mockReturnValue({}),
    errors: jest.fn().mockReturnValue({}),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
};