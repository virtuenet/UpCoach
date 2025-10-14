"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const tslib_1 = require("tslib");
const dotenv = tslib_1.__importStar(require("dotenv"));
const sequelize_1 = require("sequelize");
dotenv.config();
exports.sequelize = new sequelize_1.Sequelize(process.env.DATABASE_URL || 'postgresql://upcoach:upcoach_secure_pass@localhost:1433/upcoach_db', {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});
