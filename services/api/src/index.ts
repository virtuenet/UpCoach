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
import { logger } from './utils/logger';
import { gracefulShutdown } from './utils/shutdown';
import app from './app';

const PORT = config.port;

/**
 * Initialize services
 */
async function initializeServices() {
  try {
    // Initialize database
    await initializeDatabase();

    // Initialize scheduler service
    SchedulerService.initialize();

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
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
