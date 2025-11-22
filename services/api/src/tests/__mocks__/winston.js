// Mock for winston logger
const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  silly: jest.fn(),
  log: jest.fn(),
  add: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
  close: jest.fn(),
};

const winston = {
  format: {
    combine: jest.fn(() => ({})),
    timestamp: jest.fn(() => ({})),
    errors: jest.fn(() => ({})),
    json: jest.fn(() => ({})),
    printf: jest.fn((fn) => ({})),
    colorize: jest.fn(() => ({})),
    simple: jest.fn(() => ({})),
    prettyPrint: jest.fn(() => ({})),
    align: jest.fn(() => ({})),
    splat: jest.fn(() => ({})),
    label: jest.fn(() => ({})),
    metadata: jest.fn(() => ({})),
  },
  transports: {
    Console: jest.fn(() => ({
      level: 'info',
      format: {},
    })),
    File: jest.fn(() => ({
      filename: 'test.log',
      level: 'info',
    })),
  },
  createLogger: jest.fn(() => logger),
  addColors: jest.fn(),
};

// Create a proper default export structure
const winstonWithDefault = {
  ...winston,
  default: {
    ...winston,
    format: winston.format,
    transports: winston.transports,
    createLogger: winston.createLogger,
    addColors: winston.addColors,
  }
};

// Ensure winston.default.format.printf exists
winstonWithDefault.default.format = winston.format;

module.exports = winstonWithDefault;
module.exports.default = winstonWithDefault;