/**
 * Server Entry Point - Starts the HTTP Server
 *
 * This module starts the Express server on the configured port.
 * It imports the pre-configured app from './app.ts' and starts listening.
 *
 * For testing without starting the server, import from './app.ts' instead.
 */

import { initializeDatabase } from './config/database';
import { config } from './config/environment';
import { SchedulerService } from './services/SchedulerService';
import { DatabaseService } from './services/database';
import { logger } from './utils/logger';
import { gracefulShutdown } from './utils/shutdown';
import app from './app';

const PORT = config.port;

/**
 * Initialize services
 */
async function initializeServices() {
  try {
    // Initialize PostgreSQL connection pool
    logger.info('Initializing PostgreSQL connection pool...');
    await DatabaseService.initialize();
    logger.info('PostgreSQL connection pool initialized successfully');

    // Initialize Sequelize database and models
    logger.info('About to initialize database...');
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // Initialize scheduler service
    logger.info('About to initialize scheduler service...');
    SchedulerService.initialize();
    logger.info('Scheduler service initialized successfully');

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    logger.error('Error type:', typeof error);
    logger.error('Error is null?:', error === null);
    logger.error('Error is undefined?:', error === undefined);
    if (error instanceof Error) {
      logger.error('Error message:', error.message);
      logger.error('Error stack:', error.stack);
    } else {
      logger.error('Error (stringified):', JSON.stringify(error));
    }
    process.exit(1);
  }
}

/**
 * Start the HTTP server
 */
const server = app.listen(PORT, async () => {
  logger.info(`Server is running on port ${PORT}`);

  // Initialize services after server starts
  await initializeServices();

  // Initialize graceful shutdown
  gracefulShutdown.setServer(server);
  gracefulShutdown.initialize();

  // Register additional cleanup if needed
  gracefulShutdown.onShutdown(
    'SchedulerService',
    async () => {
      logger.info('Shutting down SchedulerService...');
      // Add scheduler shutdown logic here if needed
    },
    25
  );
});

export default app;
export { server };
