require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL || 'postgresql://upcoach:upcoach_secure_pass@localhost:8004/upcoach_db',
    dialect: 'postgres',
    logging: console.log,
  },
  test: {
    url: process.env.TEST_DATABASE_URL || 'postgresql://upcoach:upcoach_secure_pass@localhost:8004/upcoach_db_test',
    dialect: 'postgres',
    logging: false,
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
  }
};