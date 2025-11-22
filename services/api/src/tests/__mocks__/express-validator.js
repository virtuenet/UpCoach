// Mock for express-validator
const mockValidationChain = {
  isEmail: jest.fn().mockReturnThis(),
  isLength: jest.fn().mockReturnThis(),
  isInt: jest.fn().mockReturnThis(),
  isFloat: jest.fn().mockReturnThis(),
  isBoolean: jest.fn().mockReturnThis(),
  isString: jest.fn().mockReturnThis(),
  isArray: jest.fn().mockReturnThis(),
  isObject: jest.fn().mockReturnThis(),
  isUUID: jest.fn().mockReturnThis(),
  isURL: jest.fn().mockReturnThis(),
  isDate: jest.fn().mockReturnThis(),
  isISO8601: jest.fn().mockReturnThis(),
  isIn: jest.fn().mockReturnThis(),
  isNumeric: jest.fn().mockReturnThis(),
  isAlpha: jest.fn().mockReturnThis(),
  isAlphanumeric: jest.fn().mockReturnThis(),
  isMobilePhone: jest.fn().mockReturnThis(),
  isPostalCode: jest.fn().mockReturnThis(),
  isCreditCard: jest.fn().mockReturnThis(),
  isJSON: jest.fn().mockReturnThis(),
  isEmpty: jest.fn().mockReturnThis(),
  notEmpty: jest.fn().mockReturnThis(),
  matches: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  equals: jest.fn().mockReturnThis(),
  custom: jest.fn().mockReturnThis(),
  exists: jest.fn().mockReturnThis(),
  optional: jest.fn().mockReturnThis(),
  nullable: jest.fn().mockReturnThis(),
  withMessage: jest.fn().mockReturnThis(),
  bail: jest.fn().mockReturnThis(),
  trim: jest.fn().mockReturnThis(),
  escape: jest.fn().mockReturnThis(),
  normalizeEmail: jest.fn().mockReturnThis(),
  toLowerCase: jest.fn().mockReturnThis(),
  toUpperCase: jest.fn().mockReturnThis(),
  toInt: jest.fn().mockReturnThis(),
  toFloat: jest.fn().mockReturnThis(),
  toBoolean: jest.fn().mockReturnThis(),
  toDate: jest.fn().mockReturnThis(),
  customSanitizer: jest.fn().mockReturnThis(),
  run: jest.fn().mockResolvedValue(undefined),
};

// Main validation functions
const body = jest.fn((field, message) => ({ ...mockValidationChain, field }));
const param = jest.fn((field, message) => ({ ...mockValidationChain, field }));
const query = jest.fn((field, message) => ({ ...mockValidationChain, field }));
const header = jest.fn((field, message) => ({ ...mockValidationChain, field }));
const cookie = jest.fn((field, message) => ({ ...mockValidationChain, field }));
const check = jest.fn((field, message) => ({ ...mockValidationChain, field }));

// Validation result
const validationResult = jest.fn((req) => ({
  isEmpty: jest.fn().mockReturnValue(true),
  array: jest.fn().mockReturnValue([]),
  mapped: jest.fn().mockReturnValue({}),
  formatWith: jest.fn().mockReturnThis(),
  throw: jest.fn(),
}));

// Match functions
const matchedData = jest.fn((req, options) => ({
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  ...req.body,
}));

// One of validation
const oneOf = jest.fn((validations, message) =>
  jest.fn((req, res, next) => next())
);

// Check schema
const checkSchema = jest.fn((schema) => {
  const chains = [];
  for (const field in schema) {
    chains.push({ ...mockValidationChain, field });
  }
  return chains;
});

// Custom validators
const CustomValidator = {
  isString: (value) => typeof value === 'string',
  isEmail: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  isInt: (value) => Number.isInteger(value),
  isFloat: (value) => typeof value === 'number' && !Number.isNaN(value),
  isBoolean: (value) => typeof value === 'boolean',
  isArray: (value) => Array.isArray(value),
  isObject: (value) => typeof value === 'object' && value !== null,
  isUUID: (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
  isURL: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  isLength: (value, options) => {
    const len = value.length;
    if (options.min && len < options.min) return false;
    if (options.max && len > options.max) return false;
    return true;
  },
  matches: (value, pattern) => new RegExp(pattern).test(value),
  isIn: (value, values) => values.includes(value),
  isEmpty: (value) => !value || value.length === 0,
  notEmpty: (value) => value && value.length > 0,
};

// Sanitizers
const Sanitizer = {
  trim: (value) => value.trim(),
  escape: (value) => value.replace(/[<>]/g, ''),
  normalizeEmail: (value) => value.toLowerCase().trim(),
  toLowerCase: (value) => value.toLowerCase(),
  toUpperCase: (value) => value.toUpperCase(),
  toInt: (value) => parseInt(value, 10),
  toFloat: (value) => parseFloat(value),
  toBoolean: (value) => Boolean(value),
  toDate: (value) => new Date(value),
};

module.exports = {
  body,
  param,
  query,
  header,
  cookie,
  check,
  validationResult,
  matchedData,
  oneOf,
  checkSchema,
  CustomValidator,
  Sanitizer,
  // Also export as individual validators for compatibility
  isEmail: jest.fn().mockReturnValue(true),
  isLength: jest.fn().mockReturnValue(true),
  isInt: jest.fn().mockReturnValue(true),
  isFloat: jest.fn().mockReturnValue(true),
  isBoolean: jest.fn().mockReturnValue(true),
  isString: jest.fn().mockReturnValue(true),
  isArray: jest.fn().mockReturnValue(true),
  isObject: jest.fn().mockReturnValue(true),
  isUUID: jest.fn().mockReturnValue(true),
  isURL: jest.fn().mockReturnValue(true),
  matches: jest.fn().mockReturnValue(true),
  isIn: jest.fn().mockReturnValue(true),
  isEmpty: jest.fn().mockReturnValue(false),
  notEmpty: jest.fn().mockReturnValue(true),
};

module.exports.default = module.exports;