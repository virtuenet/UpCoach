import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';

// Import model classes (not instances) to avoid premature initialization
import { UserProfile } from './UserProfile';
import { ExperimentEvent } from './experiments/ExperimentEvent';

/**
 * Initialize all models that require deferred initialization
 * This ensures models are initialized only after database connection is ready
 */
export async function initializeAllModels(sequelize: Sequelize): Promise<void> {
  logger.info('Initializing deferred models...');

  // Initialize models that were previously failing due to premature initialization
  const modelsToInitialize = [
    UserProfile,
    ExperimentEvent,
    // Add other models here as needed
  ];

  let initializedCount = 0;
  let failedCount = 0;

  for (const ModelClass of modelsToInitialize) {
    try {
      // Check if model is already initialized
      if (!sequelize.models[ModelClass.name]) {
        // Initialize the model if it has a manual init method
        if (typeof ModelClass.initializeModel === 'function') {
          await ModelClass.initializeModel(sequelize);
          logger.debug(`Initialized model: ${ModelClass.name}`);
          initializedCount++;
        } else {
          logger.debug(`Model ${ModelClass.name} is already initialized or doesn't need deferred initialization`);
        }
      } else {
        logger.debug(`Model ${ModelClass.name} is already initialized`);
        initializedCount++;
      }
    } catch (error) {
      logger.error(`Failed to initialize model ${ModelClass.name}:`, error);
      failedCount++;
    }
  }

  logger.info(`Model initialization complete. Initialized: ${initializedCount}, Failed: ${failedCount}`);

  if (failedCount > 0) {
    throw new Error(`Failed to initialize ${failedCount} models`);
  }
}