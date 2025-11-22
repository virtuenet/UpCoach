// Mock for bcryptjs
const bcryptjs = {
  hash: jest.fn(async (password, rounds) => {
    // Generate a random salt to ensure different hashes for same password
    const randomSalt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    // Return a mock hash with realistic length (>50 chars) and randomness
    return `$2a$${rounds}$${randomSalt}mockedhash${password.substring(0, 10)}paddingtomakelonger`;
  }),

  compare: jest.fn(async (password, hash) => {
    // Handle null, undefined, or empty password
    if (!password || password === '') {
      return false;
    }
    // Handle null or empty hash
    if (!hash || hash === '') {
      return false;
    }

    // Simple mock comparison - return true for matching patterns
    // Hash format is: $2a${rounds}$mockedhash${password.substring(0, 10)}
    // So we check if the hash includes the first 10 chars of the password
    const passwordPrefix = password.substring(0, 10);
    if (hash.includes(passwordPrefix)) {
      return true;
    }
    if (password === hash) {
      return true;
    }
    // Default behavior for testing
    return password === 'correctPassword' || password === 'validPassword';
  }),

  genSalt: jest.fn(async (rounds = 10) => {
    return `$2a$${rounds}$mockedsalt`;
  }),

  hashSync: jest.fn((password, rounds) => {
    // Generate a random salt to ensure different hashes for same password
    const randomSalt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    // Return a mock hash with realistic length (>50 chars) and randomness
    return `$2a$${rounds}$${randomSalt}mockedhashsync${password.substring(0, 10)}paddingtomakelonger`;
  }),

  compareSync: jest.fn((password, hash) => {
    // Handle null, undefined, or empty password
    if (!password || password === '') {
      return false;
    }
    // Handle null or empty hash
    if (!hash || hash === '') {
      return false;
    }

    // Same logic as async compare
    const passwordPrefix = password.substring(0, 10);
    if (hash.includes(passwordPrefix)) {
      return true;
    }
    if (password === hash) {
      return true;
    }
    return password === 'correctPassword' || password === 'validPassword';
  }),

  genSaltSync: jest.fn((rounds = 10) => {
    return `$2a$${rounds}$mockedsaltsync`;
  }),

  getRounds: jest.fn((hash) => {
    const match = hash.match(/\$2[aby]?\$(\d+)\$/);
    return match ? parseInt(match[1], 10) : 10;
  })
};

module.exports = bcryptjs;
module.exports.default = bcryptjs;