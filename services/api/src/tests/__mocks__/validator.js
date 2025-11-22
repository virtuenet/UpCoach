// Mock for validator.js library
const validator = {
  // String validators
  isEmail: jest.fn((str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)),
  isURL: jest.fn((str) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }),
  isFQDN: jest.fn(() => true),
  isIP: jest.fn(() => true),
  isAlpha: jest.fn((str) => /^[a-zA-Z]+$/.test(str)),
  isAlphanumeric: jest.fn((str) => /^[a-zA-Z0-9]+$/.test(str)),
  isNumeric: jest.fn((str) => /^[0-9]+$/.test(str)),
  isPort: jest.fn((str) => {
    const port = parseInt(str, 10);
    return port >= 0 && port <= 65535;
  }),
  isLowercase: jest.fn((str) => str === str.toLowerCase()),
  isUppercase: jest.fn((str) => str === str.toUpperCase()),
  isAscii: jest.fn(() => true),
  isBase64: jest.fn(() => true),
  isHexadecimal: jest.fn((str) => /^[0-9A-Fa-f]+$/.test(str)),
  isHexColor: jest.fn((str) => /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(str)),
  isRgbColor: jest.fn(() => true),
  isHSL: jest.fn(() => true),

  // Number validators
  isInt: jest.fn((str) => Number.isInteger(Number(str))),
  isFloat: jest.fn((str) => !isNaN(parseFloat(str))),
  isDecimal: jest.fn((str) => !isNaN(parseFloat(str))),
  isDivisibleBy: jest.fn((str, num) => Number(str) % num === 0),

  // Date validators
  isDate: jest.fn((str) => !isNaN(Date.parse(str))),
  isAfter: jest.fn(() => true),
  isBefore: jest.fn(() => true),
  isISO8601: jest.fn(() => true),
  isRFC3339: jest.fn(() => true),

  // Boolean validators
  isBoolean: jest.fn((str) => ['true', 'false', '1', '0'].includes(str.toLowerCase())),

  // Array/Object validators
  isJSON: jest.fn((str) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }),
  isJWT: jest.fn(() => true),
  isEmpty: jest.fn((str) => !str || str.length === 0),
  isLength: jest.fn((str, options) => {
    const len = str.length;
    if (options.min !== undefined && len < options.min) return false;
    if (options.max !== undefined && len > options.max) return false;
    return true;
  }),

  // UUID validators
  isUUID: jest.fn((str, version) => {
    const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return pattern.test(str);
  }),

  // Credit card validators
  isCreditCard: jest.fn(() => true),

  // Phone validators
  isMobilePhone: jest.fn(() => true),

  // Postal code validators
  isPostalCode: jest.fn(() => true),

  // Currency validators
  isCurrency: jest.fn(() => true),

  // Hash validators
  isMD5: jest.fn((str) => /^[a-f0-9]{32}$/i.test(str)),
  isHash: jest.fn(() => true),

  // MIME type validators
  isMimeType: jest.fn(() => true),

  // Language validators
  isISO31661Alpha2: jest.fn(() => true),
  isISO31661Alpha3: jest.fn(() => true),
  isLocale: jest.fn(() => true),

  // Other validators
  isLatLong: jest.fn(() => true),
  isMongoId: jest.fn((str) => /^[a-f0-9]{24}$/i.test(str)),
  isMultibyte: jest.fn(() => true),
  isSurrogatePair: jest.fn(() => true),
  isVariableWidth: jest.fn(() => true),
  isWhitelisted: jest.fn((str, chars) => {
    for (let i = 0; i < str.length; i++) {
      if (!chars.includes(str[i])) return false;
    }
    return true;
  }),
  matches: jest.fn((str, pattern) => new RegExp(pattern).test(str)),
  contains: jest.fn((str, seed) => str.includes(seed)),
  equals: jest.fn((str, comparison) => str === comparison),
  isIn: jest.fn((str, values) => values.includes(str)),

  // Sanitizers
  escape: jest.fn((str) => str.replace(/[<>&'"]/g, (char) => {
    const escapeChars = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '\'': '&#x27;',
      '"': '&quot;'
    };
    return escapeChars[char];
  })),
  unescape: jest.fn((str) => str.replace(/&lt;|&gt;|&amp;|&#x27;|&quot;/g, (match) => {
    const unescapeChars = {
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&#x27;': '\'',
      '&quot;': '"'
    };
    return unescapeChars[match];
  })),
  trim: jest.fn((str, chars) => {
    if (!chars) return str.trim();
    const pattern = new RegExp(`^[${chars}]+|[${chars}]+$`, 'g');
    return str.replace(pattern, '');
  }),
  ltrim: jest.fn((str, chars) => {
    if (!chars) return str.trimStart();
    const pattern = new RegExp(`^[${chars}]+`, 'g');
    return str.replace(pattern, '');
  }),
  rtrim: jest.fn((str, chars) => {
    if (!chars) return str.trimEnd();
    const pattern = new RegExp(`[${chars}]+$`, 'g');
    return str.replace(pattern, '');
  }),
  stripLow: jest.fn((str) => str),
  toBoolean: jest.fn((str) => ['true', '1', 'yes'].includes(str.toLowerCase())),
  toDate: jest.fn((str) => new Date(str)),
  toFloat: jest.fn((str) => parseFloat(str)),
  toInt: jest.fn((str, radix = 10) => parseInt(str, radix)),
  normalizeEmail: jest.fn((email, options) => {
    let normalized = email.toLowerCase().trim();
    if (options && options.gmail_remove_dots) {
      const [localPart, domain] = normalized.split('@');
      if (domain === 'gmail.com') {
        normalized = localPart.replace(/\./g, '') + '@' + domain;
      }
    }
    return normalized;
  }),
  blacklist: jest.fn((str, chars) => str.replace(new RegExp(`[${chars}]`, 'g'), '')),
  whitelist: jest.fn((str, chars) => str.replace(new RegExp(`[^${chars}]`, 'g'), '')),

  // Type checking
  isString: jest.fn((value) => typeof value === 'string'),
  isNumber: jest.fn((value) => typeof value === 'number' && !isNaN(value)),
  isObject: jest.fn((value) => typeof value === 'object' && value !== null && !Array.isArray(value)),
  isArray: jest.fn((value) => Array.isArray(value)),
  isNull: jest.fn((value) => value === null),
  isUndefined: jest.fn((value) => value === undefined),

  // Additional commonly used validators
  isStrongPassword: jest.fn((str, options = {}) => {
    const minLength = options.minLength || 8;
    const minLowercase = options.minLowercase || 1;
    const minUppercase = options.minUppercase || 1;
    const minNumbers = options.minNumbers || 1;
    const minSymbols = options.minSymbols || 1;

    if (str.length < minLength) return false;
    if ((str.match(/[a-z]/g) || []).length < minLowercase) return false;
    if ((str.match(/[A-Z]/g) || []).length < minUppercase) return false;
    if ((str.match(/[0-9]/g) || []).length < minNumbers) return false;
    if ((str.match(/[^a-zA-Z0-9]/g) || []).length < minSymbols) return false;

    return true;
  }),

  // Version for default export
  default: undefined,
};

// Add default export reference
validator.default = validator;

module.exports = validator;