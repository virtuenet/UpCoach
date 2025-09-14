"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.sequelize = void 0;
exports.initializeDatabase = initializeDatabase;
exports.closeDatabase = closeDatabase;
exports.query = query;
exports.transaction = transaction;
exports.getClient = getClient;
exports.healthCheck = healthCheck;
exports.getPoolStats = getPoolStats;
const logger_1 = require("../utils/logger");
const sequelize_1 = require("./sequelize");
Object.defineProperty(exports, "sequelize", { enumerable: true, get: function () { return sequelize_1.sequelize; } });
async function initializeDatabase() {
    try {
        await sequelize_1.sequelize.authenticate();
        logger_1.logger.info('Database connection established successfully.');
        await initializeModels();
        logger_1.logger.info('Database sync disabled for debugging.');
    }
    catch (error) {
        logger_1.logger.error('Unable to connect to the database:', error);
        throw error;
    }
}
async function initializeModels() {
    try {
        const { initializeAllModels } = await Promise.resolve().then(() => __importStar(require('../models/modelInitializer')));
        await initializeAllModels(sequelize_1.sequelize);
        logger_1.logger.info('All models initialized successfully.');
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize models:', error);
        throw error;
    }
}
async function closeDatabase() {
    try {
        await sequelize_1.sequelize.close();
        logger_1.logger.info('Database connection closed.');
    }
    catch (error) {
        logger_1.logger.error('Error closing database connection:', error);
        throw error;
    }
}
async function query(text, params) {
    try {
        const start = Date.now();
        const [results] = await sequelize_1.sequelize.query(text, {
            replacements: params,
            raw: true,
        });
        const duration = Date.now() - start;
        logger_1.logger.info('Executed query', {
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            duration: `${duration}ms`,
            rows: Array.isArray(results) ? results.length : 0,
        });
        return { rows: results, rowCount: Array.isArray(results) ? results.length : 0 };
    }
    catch (error) {
        logger_1.logger.error('Database query error:', {
            query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            error: error instanceof Error ? error.message : String(error),
            params: params ? params.length : 0,
        });
        throw error;
    }
}
async function transaction(callback) {
    const t = await sequelize_1.sequelize.transaction();
    try {
        logger_1.logger.info('Transaction started');
        const result = await callback(t);
        await t.commit();
        logger_1.logger.info('Transaction committed');
        return result;
    }
    catch (error) {
        await t.rollback();
        logger_1.logger.info('Transaction rolled back');
        logger_1.logger.error('Transaction error:', error);
        throw error;
    }
}
async function getClient() {
    return sequelize_1.sequelize;
}
async function healthCheck() {
    try {
        const result = await query('SELECT 1 as health');
        return result.rows[0]?.health === 1;
    }
    catch (error) {
        logger_1.logger.error('Database health check failed:', error);
        return false;
    }
}
function getPoolStats() {
    return {
        dialect: sequelize_1.sequelize.getDialect(),
        database: sequelize_1.sequelize.getDatabaseName(),
        connected: sequelize_1.sequelize
            .authenticate()
            .then(() => true)
            .catch(() => false),
    };
}
exports.db = {
    query,
    transaction,
    getClient,
    healthCheck,
    getPoolStats,
    async findOne(table, conditions) {
        const { SecureDB } = require('../utils/dbSecurity');
        return SecureDB.findOne(table, conditions);
    },
    async findMany(table, conditions = {}, options = {}) {
        const { SecureDB } = require('../utils/dbSecurity');
        const orderBy = options.orderBy
            ? `${options.orderBy} ${options.orderDirection || 'ASC'}`
            : undefined;
        return SecureDB.findAll(table, conditions, {
            limit: options.limit,
            offset: options.offset,
            orderBy,
        });
    },
    async insert(table, data) {
        const { SecureDB } = require('../utils/dbSecurity');
        return SecureDB.insert(table, data);
    },
    async update(table, data, conditions) {
        const { SecureDB } = require('../utils/dbSecurity');
        const affectedRows = await SecureDB.update(table, data, conditions);
        if (affectedRows > 0) {
            return SecureDB.findOne(table, conditions);
        }
        return null;
    },
    async delete(table, conditions) {
        const { SecureDB } = require('../utils/dbSecurity');
        return SecureDB.delete(table, conditions);
    },
    async count(table, conditions = {}) {
        const { SecureDB } = require('../utils/dbSecurity');
        const results = await SecureDB.findAll(table, conditions);
        return results.length;
    },
    async exists(table, conditions) {
        const { SecureDB } = require('../utils/dbSecurity');
        const result = await SecureDB.findOne(table, conditions);
        return result !== null;
    },
};
process.on('SIGINT', async () => {
    await closeDatabase();
});
process.on('SIGTERM', async () => {
    await closeDatabase();
});
//# sourceMappingURL=database.js.map