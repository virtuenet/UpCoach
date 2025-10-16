import * as dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import { getSecret } from './secrets-manager';

// Load environment variables
dotenv.config();

// Initialize Sequelize with PostgreSQL connection
const dbUrl = getSecret('DATABASE_URL', true);

export const sequelize = new Sequelize(
  dbUrl,
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);