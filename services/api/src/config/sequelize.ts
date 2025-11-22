import * as dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import { getSecret } from './secrets-manager';

// Load environment variables
dotenv.config();

// Initialize Sequelize with PostgreSQL connection
const dbUrl = getSecret('DATABASE_URL', true);

/**
 * NOTE: Using plain sequelize instead of sequelize-typescript due to import order issues.
 * Models with @Column decorators that use DataType (AIInteraction, FinancialSnapshot, CostTracking)
 * execute decorators at import time, before Sequelize-TypeScript can initialize the DataType object.
 *
 * Proper fix requires implementing lazy model loading or factory pattern.
 * See: /Users/ardisetiadharma/CURSOR Repository/UpCoach/upcoach-project/services/api/src/models/modelInitializer.ts
 */
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