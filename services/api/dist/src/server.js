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
exports.server = void 0;
exports.initializeServices = initializeServices;
exports.startServer = startServer;
exports.gracefulShutdown = gracefulShutdown;
const dotenv_1 = require("dotenv");
const http_1 = require("http");
(0, dotenv_1.config)();
const database_1 = require("./config/database");
const environment_1 = require("./config/environment");
const logger_1 = require("./utils/logger");
const redis_1 = require("./services/redis");
const database_2 = require("./services/database");
const SchedulerService_1 = require("./services/SchedulerService");
let server;
async function initializeServices() {
    try {
        logger_1.logger.info('🚀 Starting UpCoach Backend Service...');
        logger_1.logger.info('📦 Connecting to Redis...');
        try {
            await redis_1.redis.ping();
            logger_1.logger.info('✅ Redis connected successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Redis connection failed:', error);
            logger_1.logger.warn('⚠️  Continuing without Redis cache (degraded performance)');
        }
        logger_1.logger.info('🗄️  Connecting to PostgreSQL database...');
        try {
            await database_2.DatabaseService.initialize();
            logger_1.logger.info('✅ PostgreSQL connected successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ PostgreSQL connection failed:', error);
            throw error;
        }
        logger_1.logger.info('📊 Initializing database models...');
        try {
            await (0, database_1.initializeDatabase)();
            logger_1.logger.info('✅ Database models initialized');
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to initialize database models:', error);
            logger_1.logger.warn('⚠️  Some features may not work properly');
        }
        logger_1.logger.info('🔄 Running database migrations...');
        try {
            await runMigrations();
            logger_1.logger.info('✅ Database migrations completed');
        }
        catch (error) {
            logger_1.logger.error('❌ Database migrations failed:', error);
            logger_1.logger.warn('⚠️  Database may not be in correct state');
        }
        logger_1.logger.info('⏰ Starting scheduler service...');
        try {
            const scheduler = SchedulerService_1.SchedulerService.getInstance();
            await scheduler.initialize();
            logger_1.logger.info('✅ Scheduler service started');
        }
        catch (error) {
            logger_1.logger.error('❌ Scheduler service failed to start:', error);
            logger_1.logger.warn('⚠️  Background jobs will not run');
        }
        if (environment_1.config.monitoring?.sentry?.enabled) {
            logger_1.logger.info('📊 Initializing Sentry monitoring...');
            const { sentryService } = await Promise.resolve().then(() => __importStar(require('./services/monitoring/SentryService')));
            sentryService.initialize({
                dsn: environment_1.config.monitoring.sentry.dsn,
                environment: environment_1.config.env,
                release: environment_1.config.monitoring.sentry.release,
            });
            logger_1.logger.info('✅ Sentry monitoring initialized');
        }
        logger_1.logger.info('✨ All services initialized successfully');
    }
    catch (error) {
        logger_1.logger.error('💥 Failed to initialize services:', error);
        throw error;
    }
}
async function runMigrations() {
    const fs = require('fs').promises;
    const path = require('path');
    const migrationsDir = path.join(__dirname, '../migrations');
    try {
        await fs.access(migrationsDir);
        const files = await fs.readdir(migrationsDir);
        const sqlFiles = files
            .filter((file) => file.endsWith('.sql'))
            .sort();
        for (const file of sqlFiles) {
            const filePath = path.join(migrationsDir, file);
            const sql = await fs.readFile(filePath, 'utf8');
            try {
                await database_2.DatabaseService.getInstance().query(sql);
                logger_1.logger.info(`✅ Migration ${file} executed successfully`);
            }
            catch (error) {
                if (error.message?.includes('already exists')) {
                    logger_1.logger.debug(`⏭️  Migration ${file} already applied`);
                }
                else {
                    logger_1.logger.error(`❌ Migration ${file} failed:`, error);
                    throw error;
                }
            }
        }
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            logger_1.logger.warn('⚠️  No migrations directory found');
        }
        else {
            throw error;
        }
    }
}
async function startServer() {
    try {
        const app = (await Promise.resolve().then(() => __importStar(require('./index')))).default || (await Promise.resolve().then(() => __importStar(require('./index')))).app;
        exports.server = server = (0, http_1.createServer)(app);
        server.listen(environment_1.config.port, () => {
            const address = server.address();
            logger_1.logger.info(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║         🚀 UpCoach Backend Service Started 🚀            ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  Environment: ${environment_1.config.env.padEnd(42)} ║
║  Port:        ${String(address.port).padEnd(42)} ║
║  API URL:     ${(`http://localhost:${address.port}/api`).padEnd(42)} ║
║  Health:      ${(`http://localhost:${address.port}/health`).padEnd(42)} ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
        });
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger_1.logger.error(`❌ Port ${environment_1.config.port} is already in use`);
            }
            else {
                logger_1.logger.error('❌ Server error:', error);
            }
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to start server:', error);
        throw error;
    }
}
async function gracefulShutdown(signal) {
    logger_1.logger.info(`\n📛 Received ${signal} signal, starting graceful shutdown...`);
    try {
        if (server) {
            logger_1.logger.info('🔌 Closing HTTP server...');
            await new Promise((resolve) => {
                server.close(() => {
                    logger_1.logger.info('✅ HTTP server closed');
                    resolve();
                });
            });
        }
        logger_1.logger.info('⏰ Stopping scheduler service...');
        const scheduler = SchedulerService_1.SchedulerService.getInstance();
        await scheduler.stop();
        logger_1.logger.info('✅ Scheduler stopped');
        logger_1.logger.info('🗄️  Closing database connections...');
        await database_2.DatabaseService.disconnect();
        logger_1.logger.info('✅ Database connections closed');
        logger_1.logger.info('📦 Closing Redis connection...');
        await redis_1.redis.quit();
        logger_1.logger.info('✅ Redis connection closed');
        logger_1.logger.info('👋 Graceful shutdown completed');
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
    }
}
async function main() {
    try {
        await initializeServices();
        await startServer();
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('💥 Uncaught Exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('UNHANDLED_REJECTION');
        });
    }
    catch (error) {
        logger_1.logger.error('💥 Failed to start application:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    main().catch((error) => {
        logger_1.logger.error('💥 Fatal error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=server.js.map