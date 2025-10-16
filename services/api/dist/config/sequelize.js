"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const tslib_1 = require("tslib");
const dotenv = tslib_1.__importStar(require("dotenv"));
const sequelize_1 = require("sequelize");
const secrets_manager_1 = require("./secrets-manager");
dotenv.config();
const dbUrl = (0, secrets_manager_1.getSecret)('DATABASE_URL', true);
exports.sequelize = new sequelize_1.Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});
