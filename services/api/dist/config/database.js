require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL || (() => {
      throw new Error('DATABASE_URL environment variable is required for development');
    })(),
    dialect: 'postgres',
    logging: console.log,
  },
  test: {
    url: process.env.TEST_DATABASE_URL || (() => {
      throw new Error('TEST_DATABASE_URL environment variable is required for testing');
    })(),
    dialect: 'postgres',
    logging: false,
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
  }
};