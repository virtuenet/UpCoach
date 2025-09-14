"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAllModels = initializeAllModels;
const logger_1 = require("../utils/logger");
const UserProfile_1 = require("./UserProfile");
const ExperimentEvent_1 = require("./experiments/ExperimentEvent");
async function initializeAllModels(sequelize) {
    logger_1.logger.info('Initializing deferred models...');
    const modelsToInitialize = [
        UserProfile_1.UserProfile,
        ExperimentEvent_1.ExperimentEvent,
    ];
    let initializedCount = 0;
    let failedCount = 0;
    for (const ModelClass of modelsToInitialize) {
        try {
            if (!sequelize.models[ModelClass.name]) {
                if (typeof ModelClass.initializeModel === 'function') {
                    await ModelClass.initializeModel(sequelize);
                    logger_1.logger.debug(`Initialized model: ${ModelClass.name}`);
                    initializedCount++;
                }
                else {
                    logger_1.logger.debug(`Model ${ModelClass.name} is already initialized or doesn't need deferred initialization`);
                }
            }
            else {
                logger_1.logger.debug(`Model ${ModelClass.name} is already initialized`);
                initializedCount++;
            }
        }
        catch (error) {
            logger_1.logger.error(`Failed to initialize model ${ModelClass.name}:`, error);
            failedCount++;
        }
    }
    logger_1.logger.info(`Model initialization complete. Initialized: ${initializedCount}, Failed: ${failedCount}`);
    if (failedCount > 0) {
        throw new Error(`Failed to initialize ${failedCount} models`);
    }
}
//# sourceMappingURL=modelInitializer.js.map