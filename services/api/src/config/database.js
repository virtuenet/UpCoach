require('dotenv').config();

module.exports = {
  development: {
    get url() {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required for development');
      }
      return process.env.DATABASE_URL;
    },
    dialect: 'postgres',
    logging: console.log,
  },
  test: {
    get url() {
      if (!process.env.TEST_DATABASE_URL) {
        throw new Error('TEST_DATABASE_URL environment variable is required for testing');
      }
      return process.env.TEST_DATABASE_URL;
    },
    dialect: 'postgres',
    logging: false,
  },
  production: {
    get url() {
      return process.env.DATABASE_URL;
    },
    dialect: 'postgres',
    logging: false,
  }
};