import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Sequelize with PostgreSQL connection
export const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://upcoach:upcoach_secure_pass@localhost:8004/upcoach_db',
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