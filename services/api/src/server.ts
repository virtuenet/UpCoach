import { config as dotenvConfig } from 'dotenv';
import { createServer } from 'http';
import { AddressInfo } from 'net';

// Load environment variables first
dotenvConfig();

import { initializeDatabase } from './config/database';
import { config } from './config/environment';
import { logger } from './utils/logger';
import { redis } from './services/redis';
import { DatabaseService } from './services/database';
import { SchedulerService } from './services/SchedulerService';

// Server instance
let server: ReturnType<typeof createServer>;

/**
 * Initialize all services
 */
async function initializeServices(): Promise<void> {
  try {
    logger.info('🚀 Starting UpCoach Backend Service...');

    // 1. Initialize Redis connection
    logger.info('📦 Connecting to Redis...');
    try {
      await redis.ping();
      logger.info('✅ Redis connected successfully');
    } catch (error) {
      logger.error('❌ Redis connection failed:', error);
      logger.warn('⚠️  Continuing without Redis cache (degraded performance)');
    }

    // 2. Initialize PostgreSQL database
    logger.info('🗄️  Connecting to PostgreSQL database...');
    try {
      await DatabaseService.initialize();
      logger.info('✅ PostgreSQL connected successfully');
    } catch (error) {
      logger.error('❌ PostgreSQL connection failed:', error);
      throw error; // Cannot continue without database
    }

    // 3. Initialize Sequelize models (if using Sequelize)
    logger.info('📊 Initializing database models...');
    try {
      await initializeDatabase();
      logger.info('✅ Database models initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize database models:', error);
      logger.warn('⚠️  Some features may not work properly');
    }

    // 4. Run database migrations
    logger.info('🔄 Running database migrations...');
    try {
      await runMigrations();
      logger.info('✅ Database migrations completed');
    } catch (error) {
      logger.error('❌ Database migrations failed:', error);
      logger.warn('⚠️  Database may not be in correct state');
    }

    // 5. Initialize scheduler service
    logger.info('⏰ Starting scheduler service...');
    try {
      const scheduler = SchedulerService.getInstance();
      await scheduler.initialize();
      logger.info('✅ Scheduler service started');
    } catch (error) {
      logger.error('❌ Scheduler service failed to start:', error);
      logger.warn('⚠️  Background jobs will not run');
    }

    // 6. Initialize monitoring services
    if (config.monitoring?.sentry?.enabled) {
      logger.info('📊 Initializing Sentry monitoring...');
      const { sentryService } = await import('./services/monitoring/SentryService');
      sentryService.initialize({
        dsn: config.monitoring.sentry.dsn,
        environment: config.env,
        release: config.monitoring.sentry.release,
      });
      logger.info('✅ Sentry monitoring initialized');
    }

    logger.info('✨ All services initialized successfully');
  } catch (error) {
    logger.error('💥 Failed to initialize services:', error);
    throw error;
  }
}

/**
 * Run database migrations
 */
async function runMigrations(): Promise<void> {
  const fs = require('fs').promises;
  const path = require('path');

  const migrationsDir = path.join(__dirname, '../migrations');

  try {
    // Check if migrations directory exists
    await fs.access(migrationsDir);

    // Get all SQL migration files
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files
      .filter((file: string) => file.endsWith('.sql'))
      .sort(); // Ensure migrations run in order

    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf8');

      try {
        // Run migration
        await DatabaseService.getInstance().query(sql);
        logger.info(`✅ Migration ${file} executed successfully`);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists')) {
          logger.debug(`⏭️  Migration ${file} already applied`);
        } else {
          logger.error(`❌ Migration ${file} failed:`, error);
          throw error;
        }
      }
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      logger.warn('⚠️  No migrations directory found');
    } else {
      throw error;
    }
  }
}

/**
 * Start the Express server
 */
async function startServer(): Promise<void> {
  try {
    // Import app after services are initialized
    const app = (await import('./index')).default || (await import('./index')).app;

    // Create HTTP server
    server = createServer(app);

    // Start listening
    server.listen(config.port, () => {
      const address = server.address() as AddressInfo;
      logger.info(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║         🚀 UpCoach Backend Service Started 🚀            ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  Environment: ${config.env.padEnd(42)} ║
║  Port:        ${String(address.port).padEnd(42)} ║
║  API URL:     ${(`http://localhost:${address.port}/api`).padEnd(42)} ║
║  Health:      ${(`http://localhost:${address.port}/health`).padEnd(42)} ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${config.port} is already in use`);
      } else {
        logger.error('❌ Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    throw error;
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`\n📛 Received ${signal} signal, starting graceful shutdown...`);

  try {
    // 1. Stop accepting new connections
    if (server) {
      logger.info('🔌 Closing HTTP server...');
      await new Promise<void>((resolve) => {
        server.close(() => {
          logger.info('✅ HTTP server closed');
          resolve();
        });
      });
    }

    // 2. Stop scheduler
    logger.info('⏰ Stopping scheduler service...');
    const scheduler = SchedulerService.getInstance();
    await scheduler.stop();
    logger.info('✅ Scheduler stopped');

    // 3. Close database connections
    logger.info('🗄️  Closing database connections...');
    await DatabaseService.disconnect();
    logger.info('✅ Database connections closed');

    // 4. Close Redis connection
    logger.info('📦 Closing Redis connection...');
    await redis.quit();
    logger.info('✅ Redis connection closed');

    logger.info('👋 Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  try {
    // Initialize all services
    await initializeServices();

    // Start the server
    await startServer();

    // Setup graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logger.error('💥 Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main().catch((error) => {
    logger.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { server, initializeServices, startServer, gracefulShutdown };