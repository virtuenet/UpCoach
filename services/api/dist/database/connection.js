"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
// Check environment variables directly
const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';
if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}
const sequelize = new sequelize_1.Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    dialectOptions: {
        ssl: NODE_ENV === 'production'
            ? {
                require: true,
                rejectUnauthorized: false,
            }
            : false,
    },
});
exports.sequelize = sequelize;
exports.default = sequelize;
//# sourceMappingURL=connection.js.map